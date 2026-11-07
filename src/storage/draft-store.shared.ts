/**
 * Editor draft contract shared by the web and native persistence adapters.
 *
 * Drafts are keyed per lesson and are deliberately separate from progress:
 * an unexecuted edit is not proof, and it must never leak into an export. The
 * store keeps a tombstone for an explicit "Reset starter" so a later remount
 * cannot resurrect an older executed snapshot from `latestRun`.
 *
 * Ordering rules:
 * - Operations for the same lesson run in call order.
 * - `clearAll` is a global barrier: it invalidates saves issued before it,
 *   waits for every in-flight write to settle, then clears storage. Saves
 *   issued after it begins wait for the clear and therefore survive it.
 * - A save that was superseded by `clearAll` never writes, so a pre-reset
 *   write cannot resurrect data after a successful reset.
 *
 * Restore rules:
 * - `importAll` requires durable persistence. A session-only write would
 *   disappear on restart, so it is a failure, not a success.
 * - `importAll` snapshots the previous drafts and restores them when any write
 *   fails. It also writes a small recovery journal (old + new drafts, and the
 *   progress timestamps on either side) so a process termination between the
 *   draft and progress stages is recovered deterministically at startup.
 */

export const DRAFT_KEY_PREFIX = "proofpath.editor_draft.v1.";
const RESTORE_JOURNAL_KEY = "proofpath.restore.journal.v1";

/** Stored marker for an explicit reset. Not a possible program body. */
const DRAFT_RESET_MARKER = "\u0000proofpath:reset";

export type DraftState =
  | { status: "draft"; code: string }
  | { status: "reset" }
  | { status: "none" };

/**
 * - `saved`: durably persisted and expected to survive a restart.
 * - `session_only`: retained in memory for this process only.
 * - `failed`: not retained anywhere.
 */
export type DraftWriteResult = "saved" | "session_only" | "failed";

export type DraftWriteMode = "durable" | "session";

export interface DraftEntry {
  key: string;
  value: string;
}

export interface DraftPersistence {
  read(key: string): Promise<string | null>;
  /** Resolves with the durability actually achieved. Throws only if nothing was retained. */
  write(key: string, value: string): Promise<DraftWriteMode>;
  remove(key: string): Promise<void>;
  clearAll(): Promise<void>;
  /** Raw entries for a backup; implementations may return keys outside the draft prefix. */
  entries(): Promise<DraftEntry[]>;
}

export function draftStorageKey(lessonId: string): string {
  return `${DRAFT_KEY_PREFIX}${lessonId}`;
}

export interface RestoreJournal {
  version: 2;
  /** Durable identity written into the restored progress snapshot. */
  transactionId: string;
  createdAt: string;
  oldDrafts: Record<string, DraftState>;
  newDrafts: Record<string, DraftState>;
  oldProgressUpdatedAt: string;
  newProgressUpdatedAt: string;
}

export interface RestoreJournalV1 {
  version: 1;
  createdAt: string;
  oldDrafts: Record<string, DraftState>;
  newDrafts: Record<string, DraftState>;
  oldProgressUpdatedAt: string;
  newProgressUpdatedAt: string;
}

export interface ProgressIdentity {
  updatedAt: string;
  restoreTransactionId?: string;
}

export interface RestoreRecoveryResult {
  existed: boolean;
  applied: "new" | "old" | null;
  error?: string;
}

export interface EditorDraftStore {
  load(lessonId: string): Promise<DraftState>;
  save(lessonId: string, code: string): Promise<DraftWriteResult>;
  /** Persist a reset tombstone so remounts use the starter, not an old snapshot. */
  reset(lessonId: string): Promise<DraftWriteResult>;
  clear(lessonId: string): Promise<void>;
  /** Clear every lesson draft without touching progress or proof. */
  clearAll(): Promise<void>;
  /** Snapshot every stored draft for a portable backup. */
  exportAll(): Promise<Record<string, DraftState>>;
  /**
   * Replace all drafts, requiring durable persistence, with rollback to the
   * previous snapshot if any write fails.
   */
  importAll(snapshot: Record<string, DraftState>): Promise<
    | { ok: true }
    | { ok: false; error: string; rollbackComplete: boolean }
  >;
  /** Persist the recovery journal before a coordinated restore starts. */
  writeRestoreJournal(journal: RestoreJournal): Promise<void>;
  clearRestoreJournal(): Promise<void>;
  /**
   * Resolve an interrupted restore. The durable progress identity decides which
   * draft snapshot is authoritative. New journals use an explicit transaction
   * id; legacy journals fall back to the old timestamp comparison.
   */
  recoverPendingRestore(readProgressIdentity: () => Promise<ProgressIdentity>): Promise<RestoreRecoveryResult>;
}

function serializeDraftState(state: DraftState): string | null {
  if (state.status === "draft") {
    return state.code;
  }
  if (state.status === "reset") {
    return DRAFT_RESET_MARKER;
  }
  return null;
}

function parseDraftState(value: string): DraftState {
  return value === DRAFT_RESET_MARKER
    ? { status: "reset" }
    : { status: "draft", code: value };
}

function draftRecordToEntries(snapshot: Record<string, DraftState>): Map<string, string> {
  const entries = new Map<string, string>();
  for (const [lessonId, state] of Object.entries(snapshot)) {
    if (!lessonId) {
      continue;
    }
    const value = serializeDraftState(state);
    if (value !== null) {
      entries.set(draftStorageKey(lessonId), value);
    }
  }
  return entries;
}

export function createEditorDraftStore(persistence: DraftPersistence): EditorDraftStore {
  const queues = new Map<string, Promise<unknown>>();
  // Bumped by clearAll. Saves capture the value at call time; a save whose
  // generation is stale is dropped instead of writing after the reset.
  let generation = 0;
  // Operations issued after a clearAll wait for it to finish.
  let resetBarrier: Promise<void> = Promise.resolve();

  function enqueue<T>(lessonId: string, task: () => Promise<T>): Promise<T> {
    const previous = queues.get(lessonId) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(task);
    queues.set(lessonId, next);
    return next;
  }

  function afterBarrier<T>(barrier: Promise<void>, task: () => Promise<T>): Promise<T> {
    return barrier.catch(() => undefined).then(task);
  }

  async function writeDraft(key: string, value: string): Promise<DraftWriteResult> {
    try {
      const mode = await persistence.write(key, value);
      return mode === "durable" ? "saved" : "session_only";
    } catch {
      return "failed";
    }
  }

  async function writeDurable(key: string, value: string): Promise<void> {
    const mode = await persistence.write(key, value);
    if (mode !== "durable") {
      throw new Error("This device could not save the data durably. Check available storage and try again.");
    }
  }

  async function waitForSettled(): Promise<void> {
    await resetBarrier.catch(() => undefined);
    await Promise.allSettled(Array.from(queues.values()));
  }

  async function readDraftEntries(): Promise<Map<string, string>> {
    const entries = await persistence.entries();
    const result = new Map<string, string>();
    for (const entry of entries) {
      if (entry.key.startsWith(DRAFT_KEY_PREFIX)) {
        result.set(entry.key, entry.value);
      }
    }
    return result;
  }

  async function restoreEntries(
    previous: Map<string, string>,
    touchedKeys: Set<string>
  ): Promise<string | null> {
    const problems: string[] = [];
    // `touchedKeys` includes writes that failed before reporting durability and
    // deletions that failed after clearing the session mirror. Both can leave
    // state behind, so both participate in rollback.
    for (const key of touchedKeys) {
      if (!previous.has(key)) {
        try {
          await persistence.remove(key);
        } catch (error) {
          problems.push(`Unable to remove a partially restored draft: ${error instanceof Error ? error.message : "unknown error"}`);
        }
      }
    }
    for (const key of touchedKeys) {
      if (!previous.has(key)) {
        continue;
      }
      try {
        const mode = await persistence.write(key, previous.get(key) as string);
        if (mode !== "durable") {
          problems.push(`Draft ${key} was only retained for this session while rolling back.`);
        }
      } catch (error) {
        problems.push(`Unable to roll back a draft: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }
    return problems.length > 0 ? problems.join(" ") : null;
  }

  async function importSnapshot(
    snapshot: Record<string, DraftState>
  ): Promise<{ ok: true } | { ok: false; error: string; rollbackComplete: boolean }> {
    // Callers are responsible for settling the queues; waiting here would
    // deadlock `importAll`, whose barrier includes this operation.
    const previous = await readDraftEntries();
    const next = draftRecordToEntries(snapshot);
    // Track a key before writing it. Platform adapters may update their
    // session mirror before reporting durability failure; rollback must cover
    // those keys too, or an uncommitted draft stays visible.
    const touchedKeys = new Set<string>();

    try {
      for (const [key, value] of next) {
        touchedKeys.add(key);
        await writeDurable(key, value);
      }
      // Only remove stale entries after every new value is durable, so a quota
      // failure leaves the previous drafts intact.
      for (const key of previous.keys()) {
        if (!next.has(key)) {
          touchedKeys.add(key);
          await persistence.remove(key);
        }
      }
      return { ok: true };
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unable to restore editor drafts.";
      const rollbackError = await restoreEntries(previous, touchedKeys);
      return {
        ok: false,
        error: rollbackError ? `${message} ${rollbackError}` : message,
        rollbackComplete: rollbackError === null
      };
    }
  }

  async function readRestoreJournal(): Promise<RestoreJournal | RestoreJournalV1 | null> {
    let raw: string | null;
    try {
      raw = await persistence.read(RESTORE_JOURNAL_KEY);
    } catch {
      return null;
    }
    if (!raw) {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<RestoreJournal | RestoreJournalV1>;
      const sharedValid = typeof parsed.createdAt === "string"
        && typeof parsed.oldProgressUpdatedAt === "string"
        && typeof parsed.newProgressUpdatedAt === "string"
        && parsed.oldDrafts
        && parsed.newDrafts
        && typeof parsed.oldDrafts === "object"
        && typeof parsed.newDrafts === "object";
      if (!sharedValid) {
        return null;
      }
      if (parsed.version === 2 && typeof parsed.transactionId === "string" && parsed.transactionId.length > 0) {
        return parsed as RestoreJournal;
      }
      if (parsed.version === 1) {
        return parsed as RestoreJournalV1;
      }
      return null;
    } catch {
      return null;
    }
  }

  return {
    load(lessonId) {
      const barrier = resetBarrier;
      const key = draftStorageKey(lessonId);
      return enqueue(lessonId, () => afterBarrier(barrier, async () => {
        const stored = await persistence.read(key);
        if (stored === null) {
          return { status: "none" };
        }
        if (stored === DRAFT_RESET_MARKER) {
          return { status: "reset" };
        }
        return { status: "draft", code: stored };
      }));
    },
    save(lessonId, code) {
      const key = draftStorageKey(lessonId);
      const operationGeneration = generation;
      const barrier = resetBarrier;
      return enqueue(lessonId, () => afterBarrier(barrier, async () => {
        if (operationGeneration !== generation) {
          // A reset happened after this save was issued. Dropping it is the
          // whole point: the reset must win.
          return "failed";
        }
        return writeDraft(key, code);
      }));
    },
    reset(lessonId) {
      const key = draftStorageKey(lessonId);
      const barrier = resetBarrier;
      return enqueue(lessonId, () => afterBarrier(barrier, () => writeDraft(key, DRAFT_RESET_MARKER)));
    },
    clear(lessonId) {
      const barrier = resetBarrier;
      return enqueue(lessonId, () => afterBarrier(barrier, () => persistence.remove(draftStorageKey(lessonId))));
    },
    clearAll() {
      generation += 1;
      const priorBarrier = resetBarrier;
      const pending = Array.from(queues.values());
      const clearing = priorBarrier
        .catch(() => undefined)
        .then(() => Promise.allSettled(pending))
        .then(async () => {
          await persistence.clearAll();
          // A reset invalidates any staged restore.
          await persistence.remove(RESTORE_JOURNAL_KEY).catch(() => undefined);
        });
      // Later operations wait for the clear even when it fails, so they are
      // still attempted on a consistent (if partly populated) store. The
      // caller receives the original rejection from `clearing`.
      resetBarrier = clearing.then(() => undefined, () => undefined);
      return clearing;
    },
    async exportAll() {
      await waitForSettled();
      const entries = await readDraftEntries();
      const snapshot: Record<string, DraftState> = {};
      for (const [key, value] of entries) {
        const lessonId = key.slice(DRAFT_KEY_PREFIX.length);
        if (!lessonId) {
          continue;
        }
        snapshot[lessonId] = parseDraftState(value);
      }
      return snapshot;
    },
    importAll(snapshot) {
      generation += 1;
      const priorBarrier = resetBarrier;
      const pending = Array.from(queues.values());
      const importing = priorBarrier
        .catch(() => undefined)
        .then(() => Promise.allSettled(pending))
        .then(() => importSnapshot(snapshot));
      // Later operations wait for the import even when it fails. The caller
      // receives the structured result rather than an unhandled rejection.
      resetBarrier = importing.then(() => undefined, () => undefined);
      return importing;
    },
    async writeRestoreJournal(journal) {
      const serialized = JSON.stringify(journal);
      try {
        await writeDurable(RESTORE_JOURNAL_KEY, serialized);
        const readBack = await persistence.read(RESTORE_JOURNAL_KEY);
        if (readBack !== serialized) {
          throw new Error("The restore recovery journal could not be verified.");
        }
      } catch (error) {
        // A session-only adapter mirror must not leave a phantom journal that a
        // later recovery would treat as durable evidence of a staged restore.
        await persistence.remove(RESTORE_JOURNAL_KEY).catch(() => undefined);
        throw error;
      }
    },
    async clearRestoreJournal() {
      await persistence.remove(RESTORE_JOURNAL_KEY);
    },
    async recoverPendingRestore(readProgressIdentity) {
      const journal = await readRestoreJournal();
      if (!journal) {
        return { existed: false, applied: null };
      }

      let identity: ProgressIdentity;
      try {
        identity = await readProgressIdentity();
      } catch (error) {
        // Never guess which draft snapshot wins. Keep the journal so a later
        // launch can reconcile once progress storage is readable.
        return {
          existed: true,
          applied: null,
          error: `An interrupted restore is waiting for progress storage: ${error instanceof Error ? error.message : "unknown read failure"}`
        };
      }

      let useNew: boolean;
      if (journal.version === 2) {
        useNew = identity.restoreTransactionId === journal.transactionId;
        const isClearlyOld = !useNew
          && identity.restoreTransactionId === undefined
          && identity.updatedAt === journal.oldProgressUpdatedAt;
        if (!useNew && !isClearlyOld) {
          return {
            existed: true,
            applied: null,
            error: "An interrupted restore cannot be reconciled yet because progress changed after it started. The recovery journal was kept."
          };
        }
      } else {
        // Legacy journal: the timestamp is the only identity available.
        if (identity.updatedAt === journal.newProgressUpdatedAt) {
          useNew = true;
        } else if (identity.updatedAt === journal.oldProgressUpdatedAt) {
          useNew = false;
        } else {
          return {
            existed: true,
            applied: null,
            error: "An interrupted legacy restore cannot be reconciled because progress changed after it started. The recovery journal was kept."
          };
        }
      }

      await waitForSettled();
      const result = await importSnapshot(useNew ? journal.newDrafts : journal.oldDrafts);
      if (!result.ok) {
        return {
          existed: true,
          applied: null,
          error: `An interrupted restore could not be completed: ${result.error}`
        };
      }

      try {
        await persistence.remove(RESTORE_JOURNAL_KEY);
      } catch (error) {
        return {
          existed: true,
          applied: useNew ? "new" : "old",
          error: error instanceof Error ? error.message : "Unable to clear the restore journal."
        };
      }

      return { existed: true, applied: useNew ? "new" : "old" };
    }
  };
}
