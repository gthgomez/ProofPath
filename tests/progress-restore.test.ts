import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import {
  createProgressBackup,
  parseProgressBackup,
  serializeProgressBackup,
  type ProgressBackup
} from "@/domain/progress-backup";
import {
  coordinatedProgressRestore,
  recoverPendingProgressRestore,
  type DurableProgressPort
} from "@/domain/progress-restore";
import { createInitialProgress, setLessonMiniProjectCompletion, setRoleTarget } from "@/domain/progress";
import type { UserProgress } from "@/domain/types";
import {
  createEditorDraftStore,
  DRAFT_KEY_PREFIX,
  type DraftPersistence,
  type DraftState
} from "@/storage/draft-store.shared";

const NOW = "2026-11-07T12:00:00.000Z";
const LATER = "2026-11-07T13:00:00.000Z";
const JOURNAL_KEY = "proofpath.restore.journal.v1";

function initialProgress(): UserProgress {
  return setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
}

function fakePersistence() {
  const map = new Map<string, string>();
  const failWrite = new Set<string>();
  const sessionOnly = new Set<string>();
  let writeGate: Promise<void> | null = null;

  const persistence: DraftPersistence = {
    async read(key) {
      return map.get(key) ?? null;
    },
    async write(key, value) {
      if (writeGate) {
        await writeGate;
      }
      if (failWrite.has(key)) {
        throw new Error("Storage quota exceeded");
      }
      if (sessionOnly.has(key)) {
        return "session";
      }
      map.set(key, value);
      return "durable";
    },
    async remove(key) {
      map.delete(key);
    },
    async clearAll() {
      for (const key of Array.from(map.keys())) {
        if (key.startsWith(DRAFT_KEY_PREFIX)) {
          map.delete(key);
        }
      }
    },
    async entries() {
      return Array.from(map.entries()).map(([key, value]) => ({ key, value }));
    }
  };

  return {
    map,
    failWrite,
    sessionOnly,
    persistence,
    holdWrites() {
      let release!: () => void;
      writeGate = new Promise<void>((resolve) => {
        release = resolve;
      });
      return () => {
        writeGate = null;
        release();
      };
    }
  };
}

function fakeProgress(initial: UserProgress) {
  let stored = initial;
  let failWrite = false;
  let ignoreWrite = false;

  const port: DurableProgressPort = {
    async readUpdatedAt() {
      return stored.updatedAt;
    },
    async read() {
      return stored;
    },
    async write(next) {
      if (failWrite) {
        throw new Error("Progress storage is full");
      }
      if (!ignoreWrite) {
        stored = next;
      }
    }
  };

  return {
    port,
    current: () => stored,
    failNextWrites(value: boolean) {
      failWrite = value;
    },
    ignoreWrites(value: boolean) {
      ignoreWrite = value;
    }
  };
}

function makeBackup(progress: UserProgress, drafts: Record<string, DraftState>): ProgressBackup {
  const parsed = parseProgressBackup(serializeProgressBackup(createProgressBackup(progress, drafts, NOW)), NOW);
  if (!parsed.backup) {
    throw new Error(parsed.error ?? "fixture backup was invalid");
  }
  return parsed.backup;
}

function seededStore() {
  const fake = fakePersistence();
  const store = createEditorDraftStore(fake.persistence);
  return { ...fake, store };
}

/** A fresh store instance over the same durable map, simulating an app restart. */
function reopen(map: Map<string, string>) {
  return createEditorDraftStore({
    read: async (key) => map.get(key) ?? null,
    write: async (key, value) => {
      map.set(key, value);
      return "durable";
    },
    remove: async (key) => {
      map.delete(key);
    },
    clearAll: async () => {
      for (const key of Array.from(map.keys())) {
        if (key.startsWith(DRAFT_KEY_PREFIX)) {
          map.delete(key);
        }
      }
    },
    entries: async () => Array.from(map.entries()).map(([key, value]) => ({ key, value }))
  });
}

describe("coordinated progress and draft restore", () => {
  it("replaces drafts (including reset tombstones) and progress, clearing the journal", async () => {
    const { map, store } = seededStore();
    await store.save("lesson-a", "old draft");

    const progress = setLessonMiniProjectCompletion(initialProgress(), "lesson-python-values", true, NOW);
    const backup = makeBackup(progress, {
      "lesson-a": { status: "draft", code: "restored draft" },
      "lesson-b": { status: "reset" }
    });
    const target = fakeProgress(initialProgress());

    const result = await coordinatedProgressRestore({
      backup,
      content: contentPack,
      draftStore: store,
      progressPort: target.port,
      now: LATER
    });

    expect(result.ok).toBe(true);
    expect(await store.load("lesson-a")).toEqual({ status: "draft", code: "restored draft" });
    expect(await store.load("lesson-b")).toEqual({ status: "reset" });
    expect(target.current().durableLessonMiniProjectIds).toContain("lesson-python-values");
    expect(target.current().updatedAt).toBe(result.progress?.updatedAt);
    expect(map.has(JOURNAL_KEY)).toBe(false);
  });

  it("does nothing when the recovery journal cannot be written durably", async () => {
    const { map, store, failWrite } = seededStore();
    await store.save("lesson-a", "old draft");
    failWrite.add(JOURNAL_KEY);

    const backup = makeBackup(initialProgress(), { "lesson-a": { status: "draft", code: "new" } });
    const target = fakeProgress(initialProgress());

    const result = await coordinatedProgressRestore({
      backup,
      content: contentPack,
      draftStore: store,
      progressPort: target.port,
      now: LATER
    });

    expect(result.ok).toBe(false);
    expect(map.get(`${DRAFT_KEY_PREFIX}lesson-a`)).toBe("old draft");
    expect(target.current()).toEqual(initialProgress());
  });

  it("does not leave a phantom journal when the journal is only retained in memory", async () => {
    const { store, sessionOnly } = seededStore();
    await store.save("lesson-a", "old draft");
    sessionOnly.add(JOURNAL_KEY);

    const backup = makeBackup(initialProgress(), { "lesson-a": { status: "draft", code: "new" } });
    const target = fakeProgress(initialProgress());
    const result = await coordinatedProgressRestore({
      backup,
      content: contentPack,
      draftStore: store,
      progressPort: target.port,
      now: LATER
    });

    expect(result.ok).toBe(false);
    expect(await store.recoverPendingRestore(NOW)).toEqual({ existed: false, applied: null });
    expect(await store.load("lesson-a")).toEqual({ status: "draft", code: "old draft" });
  });

  it("rolls drafts back when one draft write fails", async () => {
    const { map, store, failWrite } = seededStore();
    await store.save("lesson-a", "old draft");
    failWrite.add(`${DRAFT_KEY_PREFIX}lesson-b`);

    const backup = makeBackup(initialProgress(), {
      "lesson-a": { status: "draft", code: "new a" },
      "lesson-b": { status: "draft", code: "new b" }
    });
    const target = fakeProgress(initialProgress());

    const result = await coordinatedProgressRestore({
      backup,
      content: contentPack,
      draftStore: store,
      progressPort: target.port,
      now: LATER
    });

    expect(result.ok).toBe(false);
    expect(map.get(`${DRAFT_KEY_PREFIX}lesson-a`)).toBe("old draft");
    expect(map.has(`${DRAFT_KEY_PREFIX}lesson-b`)).toBe(false);
    expect(map.has(JOURNAL_KEY)).toBe(false);
    expect(target.current()).toEqual(initialProgress());
  });

  it("treats a session-only draft write as failure and preserves the original drafts", async () => {
    const { map, store, sessionOnly } = seededStore();
    await store.save("lesson-a", "old draft");
    sessionOnly.add(`${DRAFT_KEY_PREFIX}lesson-a`);

    const backup = makeBackup(initialProgress(), { "lesson-a": { status: "draft", code: "new" } });
    const target = fakeProgress(initialProgress());

    const result = await coordinatedProgressRestore({
      backup,
      content: contentPack,
      draftStore: store,
      progressPort: target.port,
      now: LATER
    });

    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/durably/i);
    expect(map.get(`${DRAFT_KEY_PREFIX}lesson-a`)).toBe("old draft");
  });

  it("restores the previous drafts when the progress write fails", async () => {
    const { map, store } = seededStore();
    await store.save("lesson-a", "old draft");

    const backup = makeBackup(initialProgress(), { "lesson-a": { status: "draft", code: "new" } });
    const target = fakeProgress(initialProgress());
    target.failNextWrites(true);

    const result = await coordinatedProgressRestore({
      backup,
      content: contentPack,
      draftStore: store,
      progressPort: target.port,
      now: LATER
    });

    expect(result.ok).toBe(false);
    expect(map.get(`${DRAFT_KEY_PREFIX}lesson-a`)).toBe("old draft");
    expect(map.has(JOURNAL_KEY)).toBe(false);
    expect(target.current()).toEqual(initialProgress());
  });

  it("does not report success when the progress store does not retain the write", async () => {
    const { map, store } = seededStore();
    await store.save("lesson-a", "old draft");

    const backup = makeBackup(initialProgress(), { "lesson-a": { status: "draft", code: "new" } });
    const target = fakeProgress(initialProgress());
    target.ignoreWrites(true);

    const result = await coordinatedProgressRestore({
      backup,
      content: contentPack,
      draftStore: store,
      progressPort: target.port,
      now: LATER
    });

    expect(result.ok).toBe(false);
    expect(map.get(`${DRAFT_KEY_PREFIX}lesson-a`)).toBe("old draft");
    expect(target.current()).toEqual(initialProgress());
  });

  it("recovers the new drafts when progress committed before the process stopped", async () => {
    const { map, store } = seededStore();
    await store.save("lesson-a", "old draft");

    const backup = makeBackup(initialProgress(), { "lesson-a": { status: "draft", code: "new" } });
    await store.writeRestoreJournal({
      version: 1,
      createdAt: LATER,
      oldDrafts: { "lesson-a": { status: "draft", code: "old draft" } },
      newDrafts: backup.drafts,
      oldProgressUpdatedAt: NOW,
      newProgressUpdatedAt: LATER
    });
    await store.importAll(backup.drafts);

    const restarted = reopen(map);

    const recovery = await restarted.recoverPendingRestore(LATER);
    expect(recovery).toEqual({ existed: true, applied: "new" });
    expect(await restarted.load("lesson-a")).toEqual({ status: "draft", code: "new" });
    expect(map.has(JOURNAL_KEY)).toBe(false);
  });

  it("recovers the old drafts when progress never committed", async () => {
    const { map, store } = seededStore();
    await store.save("lesson-a", "old draft");

    const backup = makeBackup(initialProgress(), { "lesson-a": { status: "draft", code: "new" } });
    await store.writeRestoreJournal({
      version: 1,
      createdAt: LATER,
      oldDrafts: { "lesson-a": { status: "draft", code: "old draft" } },
      newDrafts: backup.drafts,
      oldProgressUpdatedAt: NOW,
      newProgressUpdatedAt: LATER
    });
    await store.importAll(backup.drafts);

    const restarted = reopen(map);

    const recovery = await recoverPendingProgressRestore(restarted, {
      readUpdatedAt: async () => NOW
    });
    expect(recovery).toEqual({ existed: true, applied: "old" });
    expect(await restarted.load("lesson-a")).toEqual({ status: "draft", code: "old draft" });
    expect(map.has(JOURNAL_KEY)).toBe(false);
  });

  it("drops a save issued before an import so it cannot overwrite restored drafts", async () => {
    const { store } = seededStore();
    await store.save("lesson-a", "old draft");

    const save = store.save("lesson-a", "late user edit");
    const importResult = await store.importAll({ "lesson-a": { status: "draft", code: "restored" } });
    await save;

    expect(importResult).toEqual({ ok: true });
    expect(await store.load("lesson-a")).toEqual({ status: "draft", code: "restored" });
  });

  it("preserves historical achievements and reset tombstones", async () => {
    const { store } = seededStore();
    const progress = setLessonMiniProjectCompletion(initialProgress(), "lesson-python-values", true, NOW);
    const backup = makeBackup(progress, { "lesson-python-values": { status: "reset" } });
    const target = fakeProgress(initialProgress());

    const result = await coordinatedProgressRestore({
      backup,
      content: contentPack,
      draftStore: store,
      progressPort: target.port,
      now: LATER
    });

    expect(result.ok).toBe(true);
    expect(target.current().durableLessonMiniProjectIds).toContain("lesson-python-values");
    expect(await store.load("lesson-python-values")).toEqual({ status: "reset" });
  });
});
