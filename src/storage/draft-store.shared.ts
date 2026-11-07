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
 */

export const DRAFT_KEY_PREFIX = "proofpath.editor_draft.v1.";

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
  /** Replace all drafts atomically-enough for a restore; waits for pending writes. */
  importAll(snapshot: Record<string, DraftState>): Promise<{ ok: true } | { ok: false; error: string }>;
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
        .then(() => persistence.clearAll());
      // Later operations wait for the clear even when it fails, so they are
      // still attempted on a consistent (if partly populated) store. The
      // caller receives the original rejection from `clearing`.
      resetBarrier = clearing.then(() => undefined, () => undefined);
      return clearing;
    },
    async exportAll() {
      await resetBarrier.catch(() => undefined);
      await Promise.allSettled(Array.from(queues.values()));
      const entries = await persistence.entries();
      const snapshot: Record<string, DraftState> = {};
      for (const entry of entries) {
        if (!entry.key.startsWith(DRAFT_KEY_PREFIX)) {
          continue;
        }
        const lessonId = entry.key.slice(DRAFT_KEY_PREFIX.length);
        if (!lessonId) {
          continue;
        }
        snapshot[lessonId] = entry.value === DRAFT_RESET_MARKER
          ? { status: "reset" }
          : { status: "draft", code: entry.value };
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
        .then(async () => {
          await persistence.clearAll();
          for (const [lessonId, state] of Object.entries(snapshot)) {
            const key = draftStorageKey(lessonId);
            if (state.status === "reset") {
              await persistence.write(key, DRAFT_RESET_MARKER);
            } else if (state.status === "draft") {
              await persistence.write(key, state.code);
            }
          }
        });
      resetBarrier = importing.then(() => undefined, () => undefined);
      return importing.then(
        () => ({ ok: true } as const),
        (error: unknown) => ({
          ok: false as const,
          error: error instanceof Error ? error.message : "Unable to restore editor drafts."
        })
      );
    }
  };
}
