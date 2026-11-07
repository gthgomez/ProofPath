import { beforeEach, describe, expect, it } from "vitest";
import {
  clearEditorDraft,
  getEditorDraft,
  resetDraftStoreForTests,
  resetEditorDraft,
  saveEditorDraft
} from "@/storage/draft-store";
import { createEditorDraftStore, draftStorageKey, type DraftPersistence } from "@/storage/draft-store.shared";

describe("editor draft store (web / localStorage mirror)", () => {
  beforeEach(async () => {
    await resetDraftStoreForTests();
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it("returns no draft when none exists for a lesson", async () => {
    expect(await getEditorDraft("lesson-python-test")).toEqual({ status: "none" });
  });

  it("persists and retrieves unrun editor edits", async () => {
    await saveEditorDraft("lesson-python-test", "x = 42\nprint(x)");
    expect(await getEditorDraft("lesson-python-test")).toEqual({ status: "draft", code: "x = 42\nprint(x)" });
  });

  it("updates existing drafts when more edits are made after a run", async () => {
    await saveEditorDraft("lesson-python-test", "initial code");
    await saveEditorDraft("lesson-python-test", "updated code after run");
    expect(await getEditorDraft("lesson-python-test")).toEqual({ status: "draft", code: "updated code after run" });
  });

  it("records a durable reset tombstone instead of resurrecting older code", async () => {
    await saveEditorDraft("lesson-python-test", "custom code");
    expect(await resetEditorDraft("lesson-python-test")).toBe("saved");
    // After reset, a remount must use the starter, not the previous executed
    // snapshot. The store reports the reset explicitly.
    expect(await getEditorDraft("lesson-python-test")).toEqual({ status: "reset" });

    // A new edit supersedes the tombstone.
    await saveEditorDraft("lesson-python-test", "new attempt");
    expect(await getEditorDraft("lesson-python-test")).toEqual({ status: "draft", code: "new attempt" });
  });

  it("clears a draft entirely", async () => {
    await saveEditorDraft("lesson-python-test", "custom code");
    await clearEditorDraft("lesson-python-test");
    expect(await getEditorDraft("lesson-python-test")).toEqual({ status: "none" });
  });

  it("isolates drafts across different lessons", async () => {
    await saveEditorDraft("lesson-a", "code for a");
    await saveEditorDraft("lesson-b", "code for b");
    expect(await getEditorDraft("lesson-a")).toEqual({ status: "draft", code: "code for a" });
    expect(await getEditorDraft("lesson-b")).toEqual({ status: "draft", code: "code for b" });
  });

  it("clears all lesson drafts without touching anything else", async () => {
    await saveEditorDraft("lesson-a", "code for a");
    await saveEditorDraft("lesson-b", "code for b");
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem("proofpath.progress.v1", "{\"keep\":true}");
    }

    await resetDraftStoreForTests();

    expect(await getEditorDraft("lesson-a")).toEqual({ status: "none" });
    expect(await getEditorDraft("lesson-b")).toEqual({ status: "none" });
    if (typeof window !== "undefined" && window.localStorage) {
      expect(window.localStorage.getItem("proofpath.progress.v1")).toBe("{\"keep\":true}");
    }
  });
});

describe("editor draft store ordering and failure (shared factory)", () => {
  function createFakePersistence(options: { failWrites?: boolean; delayFor?: (call: number) => number } = {}) {
    const stored = new Map<string, string>();
    const writes: Array<{ key: string; value: string }> = [];
    let call = 0;

    const persistence: DraftPersistence = {
      async read(key) {
        return stored.get(key) ?? null;
      },
      async write(key, value) {
        call += 1;
        const delay = options.delayFor?.(call) ?? 0;
        if (delay > 0) {
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
        if (options.failWrites) {
          stored.set(key, value);
          throw new Error("quota exceeded");
        }
        stored.set(key, value);
        writes.push({ key, value });
      },
      async remove(key) {
        stored.delete(key);
      },
      async clearAll() {
        stored.clear();
      }
    };

    return { persistence, writes, stored };
  }

  it("serializes writes per lesson so an older save cannot overwrite a newer one", async () => {
    // The first write is slow; without per-lesson ordering it would finish last
    // and clobber the newer draft.
    const { persistence, writes } = createFakePersistence({ delayFor: (call) => (call === 1 ? 20 : 0) });
    const store = createEditorDraftStore(persistence);

    const older = store.save("lesson-ordered", "old code");
    const newer = store.save("lesson-ordered", "new code");
    await Promise.all([older, newer]);

    expect(writes.map((write) => write.value)).toEqual(["old code", "new code"]);
    expect(await store.load("lesson-ordered")).toEqual({ status: "draft", code: "new code" });
  });

  it("does not let one lesson's writes block another lesson", async () => {
    const { persistence } = createFakePersistence({ delayFor: (call) => (call === 1 ? 20 : 0) });
    const store = createEditorDraftStore(persistence);

    const slow = store.save("lesson-a", "a");
    const fast = store.save("lesson-b", "b");
    // Both settle; ordering is per-lesson, not global.
    await expect(Promise.all([slow, fast])).resolves.toEqual(["saved", "saved"]);
  });

  it("returns a recoverable failure result when the durable write fails", async () => {
    const { persistence } = createFakePersistence({ failWrites: true });
    const store = createEditorDraftStore(persistence);

    await expect(store.save("lesson-fail", "typed code")).resolves.toBe("failed");
    // The session mirror still holds the text so the learner does not lose it.
    expect(await store.load("lesson-fail")).toEqual({ status: "draft", code: "typed code" });
  });

  it("namespaces draft keys by lesson", () => {
    expect(draftStorageKey("lesson-a")).not.toBe(draftStorageKey("lesson-b"));
    expect(draftStorageKey("lesson-a")).toContain("proofpath.editor_draft.");
  });
});
