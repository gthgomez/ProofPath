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
  let writeMode: "ok" | "throw-before" | "throw-after" | "ignore" = "ok";
  let readFailures = 0;
  let staleRead: UserProgress | null = null;

  const port: DurableProgressPort = {
    async readUpdatedAt() {
      return stored.updatedAt;
    },
    async read() {
      if (readFailures > 0) {
        readFailures -= 1;
        throw new Error("Progress read failed");
      }
      return staleRead ?? stored;
    },
    async write(next) {
      if (writeMode === "throw-before") {
        throw new Error("Progress storage is full");
      }
      if (writeMode !== "ignore") {
        stored = next;
      }
      if (writeMode === "throw-after") {
        throw new Error("Progress write reported failure after commit");
      }
    }
  };

  return {
    port,
    current: () => stored,
    failNextWrites(value: boolean) {
      writeMode = value ? "throw-before" : "ok";
    },
    ignoreWrites(value: boolean) {
      writeMode = value ? "ignore" : "ok";
    },
    commitThenThrow() {
      writeMode = "throw-after";
    },
    failReads(count: number) {
      readFailures = count;
    },
    returnStaleProgress(progress: UserProgress | null) {
      staleRead = progress;
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
    expect(await store.recoverPendingRestore(async () => ({ updatedAt: NOW }))).toEqual({ existed: false, applied: null });
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

  it("keeps the journal and recovers the old state when a resolved write left old progress", async () => {
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
    expect(result.error).toMatch(/could not verify/i);
    expect(map.has(JOURNAL_KEY)).toBe(true);
    expect(map.get(`${DRAFT_KEY_PREFIX}lesson-a`)).toBe("new");
    expect(target.current()).toEqual(initialProgress());

    const recovery = await store.recoverPendingRestore(async () => ({ updatedAt: NOW }));
    expect(recovery).toEqual({ existed: true, applied: "old" });
    expect(map.get(`${DRAFT_KEY_PREFIX}lesson-a`)).toBe("old draft");
    expect(map.has(JOURNAL_KEY)).toBe(false);
  });

  it("treats a committed write followed by a read failure as success once identity is confirmed", async () => {
    const { map, store } = seededStore();
    await store.save("lesson-a", "old draft");
    const backup = makeBackup(initialProgress(), { "lesson-a": { status: "draft", code: "new" } });
    const target = fakeProgress(initialProgress());
    target.commitThenThrow();

    const result = await coordinatedProgressRestore({
      backup,
      content: contentPack,
      draftStore: store,
      progressPort: target.port,
      now: LATER
    });

    expect(result.ok).toBe(true);
    expect(result.progress?.restoreTransactionId).toBeTruthy();
    expect(map.get(`${DRAFT_KEY_PREFIX}lesson-a`)).toBe("new");
    expect(map.has(JOURNAL_KEY)).toBe(false);
  });

  it("keeps a coherent new state when the commit is durable but verification reads fail", async () => {
    const { map, store } = seededStore();
    await store.save("lesson-a", "old draft");
    const backup = makeBackup(initialProgress(), { "lesson-a": { status: "draft", code: "new" } });
    const target = fakeProgress(initialProgress());
    target.failReads(2);

    const result = await coordinatedProgressRestore({
      backup,
      content: contentPack,
      draftStore: store,
      progressPort: target.port,
      now: LATER
    });

    expect(result.ok).toBe(false);
    expect(map.has(JOURNAL_KEY)).toBe(true);
    expect(map.get(`${DRAFT_KEY_PREFIX}lesson-a`)).toBe("new");

    const committed = target.current();
    const recovery = await store.recoverPendingRestore(async () => ({
      updatedAt: committed.updatedAt,
      restoreTransactionId: committed.restoreTransactionId
    }));
    expect(recovery).toEqual({ existed: true, applied: "new" });
    expect(map.get(`${DRAFT_KEY_PREFIX}lesson-a`)).toBe("new");
    expect(map.has(JOURNAL_KEY)).toBe(false);
  });

  it("does not roll drafts back from a stale read after a resolved write", async () => {
    const { map, store } = seededStore();
    await store.save("lesson-a", "old draft");
    const backup = makeBackup(initialProgress(), { "lesson-a": { status: "draft", code: "new" } });
    const target = fakeProgress(initialProgress());
    target.returnStaleProgress(initialProgress());

    const result = await coordinatedProgressRestore({
      backup,
      content: contentPack,
      draftStore: store,
      progressPort: target.port,
      now: LATER
    });

    expect(result.ok).toBe(false);
    expect(map.has(JOURNAL_KEY)).toBe(true);
    expect(map.get(`${DRAFT_KEY_PREFIX}lesson-a`)).toBe("new");

    target.returnStaleProgress(null);
    const committed = target.current();
    const recovery = await store.recoverPendingRestore(async () => ({
      updatedAt: committed.updatedAt,
      restoreTransactionId: committed.restoreTransactionId
    }));
    expect(recovery).toEqual({ existed: true, applied: "new" });
  });

  it("does not guess when progress changed after a restore started", async () => {
    const { map, store } = seededStore();
    await store.save("lesson-a", "old draft");
    const backup = makeBackup(initialProgress(), { "lesson-a": { status: "draft", code: "new" } });
    await store.writeRestoreJournal({
      version: 2,
      transactionId: "tx-new",
      createdAt: LATER,
      oldDrafts: { "lesson-a": { status: "draft", code: "old draft" } },
      newDrafts: backup.drafts,
      oldProgressUpdatedAt: NOW,
      newProgressUpdatedAt: LATER
    });
    await store.importAll(backup.drafts);

    const recovery = await store.recoverPendingRestore(async () => ({
      updatedAt: "2026-11-07T14:00:00.000Z",
      restoreTransactionId: undefined
    }));

    expect(recovery.existed).toBe(true);
    expect(recovery.applied).toBeNull();
    expect(recovery.error).toMatch(/cannot be reconciled/i);
    expect(map.has(JOURNAL_KEY)).toBe(true);
  });

  it("keeps the journal when progress storage cannot be read during recovery", async () => {
    const { map, store } = seededStore();
    await store.save("lesson-a", "old draft");
    const backup = makeBackup(initialProgress(), { "lesson-a": { status: "draft", code: "new" } });
    await store.writeRestoreJournal({
      version: 2,
      transactionId: "tx-new",
      createdAt: LATER,
      oldDrafts: { "lesson-a": { status: "draft", code: "old draft" } },
      newDrafts: backup.drafts,
      oldProgressUpdatedAt: NOW,
      newProgressUpdatedAt: LATER
    });
    await store.importAll(backup.drafts);

    const recovery = await recoverPendingProgressRestore(store, {
      read: async () => {
        throw new Error("progress unavailable");
      }
    });

    expect(recovery.existed).toBe(true);
    expect(recovery.applied).toBeNull();
    expect(recovery.error).toMatch(/waiting for progress storage/i);
    expect(map.has(JOURNAL_KEY)).toBe(true);
  });

  it("recovers the new drafts when progress committed before the process stopped", async () => {
    const { map, store } = seededStore();
    await store.save("lesson-a", "old draft");

    const backup = makeBackup(initialProgress(), { "lesson-a": { status: "draft", code: "new" } });
    await store.writeRestoreJournal({
      version: 2,
      transactionId: "tx-new",
      createdAt: LATER,
      oldDrafts: { "lesson-a": { status: "draft", code: "old draft" } },
      newDrafts: backup.drafts,
      oldProgressUpdatedAt: NOW,
      newProgressUpdatedAt: LATER
    });
    await store.importAll(backup.drafts);

    const restarted = reopen(map);

    const recovery = await restarted.recoverPendingRestore(async () => ({
      updatedAt: LATER,
      restoreTransactionId: "tx-new"
    }));
    expect(recovery).toEqual({ existed: true, applied: "new" });
    expect(await restarted.load("lesson-a")).toEqual({ status: "draft", code: "new" });
    expect(map.has(JOURNAL_KEY)).toBe(false);
  });

  it("recovers the old drafts when progress never committed", async () => {
    const { map, store } = seededStore();
    await store.save("lesson-a", "old draft");

    const backup = makeBackup(initialProgress(), { "lesson-a": { status: "draft", code: "new" } });
    await store.writeRestoreJournal({
      version: 2,
      transactionId: "tx-new",
      createdAt: LATER,
      oldDrafts: { "lesson-a": { status: "draft", code: "old draft" } },
      newDrafts: backup.drafts,
      oldProgressUpdatedAt: NOW,
      newProgressUpdatedAt: LATER
    });
    await store.importAll(backup.drafts);

    const restarted = reopen(map);

    const recovery = await recoverPendingProgressRestore(restarted, {
      read: async () => initialProgress()
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
