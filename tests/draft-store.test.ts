// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearEditorDraft,
  editorDraftStore,
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
    await expect(saveEditorDraft("lesson-python-test", "x = 42\nprint(x)")).resolves.toBe("saved");
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

  it("round-trips every draft, including reset tombstones, through export/import", async () => {
    await saveEditorDraft("lesson-a", "code for a");
    await resetEditorDraft("lesson-b");
    const snapshot = await editorDraftStore.exportAll();
    expect(snapshot["lesson-a"]).toEqual({ status: "draft", code: "code for a" });
    expect(snapshot["lesson-b"]).toEqual({ status: "reset" });

    // Simulate a later state that a restore must replace, not merge with.
    await saveEditorDraft("lesson-a", "newer local edit");
    await saveEditorDraft("lesson-c", "stale extra draft");

    await expect(editorDraftStore.importAll(snapshot)).resolves.toEqual({ ok: true });
    expect(await getEditorDraft("lesson-a")).toEqual({ status: "draft", code: "code for a" });
    expect(await getEditorDraft("lesson-b")).toEqual({ status: "reset" });
    expect(await getEditorDraft("lesson-c")).toEqual({ status: "none" });
  });
});

describe("editor draft store ordering, reset fencing, and failure (shared factory)", () => {
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
        stored.set(key, value);
        if (options.failWrites) {
          throw new Error("quota exceeded");
        }
        writes.push({ key, value });
        return "durable";
      },
      async remove(key) {
        stored.delete(key);
      },
      async clearAll() {
        stored.clear();
      },
      async entries() {
        return Array.from(stored.entries()).map(([key, value]) => ({ key, value }));
      }
    };

    return { persistence, writes, stored };
  }

  interface ControlledPersistence {
    persistence: DraftPersistence;
    stored: Map<string, string>;
    requestedWrites: Array<{ key: string; value: string }>;
    pending: Array<{ key: string; value: string; release: () => void; fail: () => void }>;
    clearCalls: () => number;
    failClear: (error: Error) => void;
  }

  function createControlledPersistence(): ControlledPersistence {
    const stored = new Map<string, string>();
    const requestedWrites: Array<{ key: string; value: string }> = [];
    const pending: ControlledPersistence["pending"] = [];
    let clearCalls = 0;
    let clearFailure: Error | null = null;

    const persistence: DraftPersistence = {
      async read(key) {
        return stored.get(key) ?? null;
      },
      write(key, value) {
        requestedWrites.push({ key, value });
        return new Promise<"durable">((resolve, reject) => {
          pending.push({
            key,
            value,
            release: () => {
              stored.set(key, value);
              resolve("durable");
            },
            fail: () => reject(new Error("write failed"))
          });
        });
      },
      async remove(key) {
        stored.delete(key);
      },
      async clearAll() {
        clearCalls += 1;
        if (clearFailure) {
          throw clearFailure;
        }
        stored.clear();
      },
      async entries() {
        return Array.from(stored.entries()).map(([key, value]) => ({ key, value }));
      }
    };

    return {
      persistence,
      stored,
      requestedWrites,
      pending,
      clearCalls: () => clearCalls,
      failClear: (error) => {
        clearFailure = error;
      }
    };
  }

  async function flush(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 0));
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

  it("returns a recoverable failure result when the durable write throws", async () => {
    const { persistence } = createFakePersistence({ failWrites: true });
    const store = createEditorDraftStore(persistence);

    await expect(store.save("lesson-fail", "typed code")).resolves.toBe("failed");
    // The fake retained the text, mirroring a session fallback.
    expect(await store.load("lesson-fail")).toEqual({ status: "draft", code: "typed code" });
  });

  it("reports session-only retention separately from durable success", async () => {
    const stored = new Map<string, string>();
    const persistence: DraftPersistence = {
      async read(key) {
        return stored.get(key) ?? null;
      },
      async write(key, value) {
        stored.set(key, value);
        return "session";
      },
      async remove(key) {
        stored.delete(key);
      },
      async clearAll() {
        stored.clear();
      },
      async entries() {
        return Array.from(stored.entries()).map(([key, value]) => ({ key, value }));
      }
    };
    const store = createEditorDraftStore(persistence);

    await expect(store.save("lesson-session", "kept this session")).resolves.toBe("session_only");
    expect(await store.load("lesson-session")).toEqual({ status: "draft", code: "kept this session" });
  });

  it("drops a save queued before clearAll and removes the in-flight write", async () => {
    const fake = createControlledPersistence();
    const store = createEditorDraftStore(fake.persistence);

    const inFlight = store.save("lesson-a", "old code");
    const queued = store.save("lesson-a", "queued before reset");
    await flush();
    expect(fake.pending).toHaveLength(1);

    const clearing = store.clearAll();
    fake.pending[0]!.release();

    await expect(queued).resolves.toBe("failed");
    await expect(inFlight).resolves.toBe("saved");
    await clearing;

    expect(fake.stored.size).toBe(0);
    expect(await store.load("lesson-a")).toEqual({ status: "none" });
  });

  it("retains a new edit made after clearAll begins", async () => {
    const fake = createControlledPersistence();
    const store = createEditorDraftStore(fake.persistence);

    const clearing = store.clearAll();
    const after = store.save("lesson-a", "new code after reset");
    await flush();

    expect(fake.clearCalls()).toBe(1);
    expect(fake.pending).toHaveLength(1);
    fake.pending[0]!.release();

    await expect(after).resolves.toBe("saved");
    await clearing;
    expect(await store.load("lesson-a")).toEqual({ status: "draft", code: "new code after reset" });
  });

  it("clears multiple lessons even with pending writes in several queues", async () => {
    const fake = createControlledPersistence();
    const store = createEditorDraftStore(fake.persistence);

    const a = store.save("lesson-a", "a");
    const b = store.save("lesson-b", "b");
    await flush();
    expect(fake.pending).toHaveLength(2);

    const clearing = store.clearAll();
    for (const write of fake.pending) {
      write.release();
    }

    await Promise.all([a, b]);
    await clearing;

    expect(fake.stored.size).toBe(0);
    expect(await store.load("lesson-a")).toEqual({ status: "none" });
    expect(await store.load("lesson-b")).toEqual({ status: "none" });
  });

  it("surfaces a clearAll failure and still allows later edits", async () => {
    const fake = createControlledPersistence();
    fake.failClear(new Error("database locked"));
    const store = createEditorDraftStore(fake.persistence);

    await expect(store.clearAll()).rejects.toThrow("database locked");

    const after = store.save("lesson-a", "still usable");
    await flush();
    fake.pending[0]!.release();
    await expect(after).resolves.toBe("saved");
    expect(await store.load("lesson-a")).toEqual({ status: "draft", code: "still usable" });
  });

  it("namespaces draft keys by lesson", () => {
    expect(draftStorageKey("lesson-a")).not.toBe(draftStorageKey("lesson-b"));
    expect(draftStorageKey("lesson-a")).toContain("proofpath.editor_draft.");
  });
});
