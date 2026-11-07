/**
 * Editor draft contract shared by the web and native persistence adapters.
 *
 * Drafts are keyed per lesson and are deliberately separate from progress:
 * an unexecuted edit is not proof, and it must never leak into an export. The
 * store keeps a tombstone for an explicit "Reset starter" so a later remount
 * cannot resurrect an older executed snapshot from `latestRun`.
 */

export const DRAFT_KEY_PREFIX = "proofpath.editor_draft.v1.";

/** Stored marker for an explicit reset. Not a possible program body. */
const DRAFT_RESET_MARKER = "\u0000proofpath:reset";

export type DraftState =
  | { status: "draft"; code: string }
  | { status: "reset" }
  | { status: "none" };

export type DraftWriteResult = "saved" | "failed";

export interface DraftPersistence {
  read(key: string): Promise<string | null>;
  write(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  clearAll(): Promise<void>;
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
  clearAll(): Promise<void>;
}

export function createEditorDraftStore(persistence: DraftPersistence): EditorDraftStore {
  // Per-lesson write ordering: a slow older save must never land after a newer
  // one. Each operation for a lesson is chained behind the previous operation.
  const queues = new Map<string, Promise<unknown>>();

  function enqueue<T>(lessonId: string, task: () => Promise<T>): Promise<T> {
    const previous = queues.get(lessonId) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(task);
    queues.set(lessonId, next);
    return next;
  }

  return {
    load(lessonId) {
      const key = draftStorageKey(lessonId);
      return enqueue(lessonId, async () => {
        const stored = await persistence.read(key);
        if (stored === null) {
          return { status: "none" };
        }
        if (stored === DRAFT_RESET_MARKER) {
          return { status: "reset" };
        }
        return { status: "draft", code: stored };
      });
    },
    save(lessonId, code) {
      const key = draftStorageKey(lessonId);
      return enqueue(lessonId, async () => {
        try {
          await persistence.write(key, code);
          return "saved";
        } catch {
          return "failed";
        }
      });
    },
    reset(lessonId) {
      const key = draftStorageKey(lessonId);
      return enqueue(lessonId, async () => {
        try {
          await persistence.write(key, DRAFT_RESET_MARKER);
          return "saved";
        } catch {
          return "failed";
        }
      });
    },
    clear(lessonId) {
      return enqueue(lessonId, () => persistence.remove(draftStorageKey(lessonId)));
    },
    clearAll() {
      return persistence.clearAll();
    }
  };
}
