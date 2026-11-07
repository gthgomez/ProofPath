import {
  createEditorDraftStore,
  draftStorageKey,
  type DraftPersistence,
  type DraftState,
  type DraftWriteResult,
  type EditorDraftStore
} from "@/storage/draft-store.shared";

const memoryDrafts = new Map<string, string>();

function isLocalStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

const webDraftPersistence: DraftPersistence = {
  async read(key) {
    if (isLocalStorageAvailable()) {
      try {
        const stored = window.localStorage.getItem(key);
        if (stored !== null) {
          return stored;
        }
      } catch {
        // Fall through to the in-memory mirror.
      }
    }
    return memoryDrafts.get(key) ?? null;
  },
  async write(key, value) {
    memoryDrafts.set(key, value);
    if (!isLocalStorageAvailable()) {
      return;
    }
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      // Keep the session copy but report the durable write as failed so the UI
      // can tell the learner their draft will not survive a reload.
      throw error;
    }
  },
  async remove(key) {
    memoryDrafts.delete(key);
    if (!isLocalStorageAvailable()) {
      return;
    }
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Removing from the mirror above is enough for this session.
    }
  },
  async clearAll() {
    memoryDrafts.clear();
    if (!isLocalStorageAvailable()) {
      return;
    }
    try {
      const keys: string[] = [];
      for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key && key.startsWith(draftStorageKey(""))) {
          keys.push(key);
        }
      }
      for (const key of keys) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Best-effort clearing; the in-memory mirror is already cleared.
    }
  }
};

export const editorDraftStore: EditorDraftStore = createEditorDraftStore(webDraftPersistence);

export function getEditorDraft(lessonId: string): Promise<DraftState> {
  return editorDraftStore.load(lessonId);
}

export function saveEditorDraft(lessonId: string, code: string): Promise<DraftWriteResult> {
  return editorDraftStore.save(lessonId, code);
}

export function resetEditorDraft(lessonId: string): Promise<DraftWriteResult> {
  return editorDraftStore.reset(lessonId);
}

export function clearEditorDraft(lessonId: string): Promise<void> {
  return editorDraftStore.clear(lessonId);
}

export function resetDraftStoreForTests(): Promise<void> {
  return editorDraftStore.clearAll();
}
