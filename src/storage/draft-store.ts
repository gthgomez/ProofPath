import {
  createEditorDraftStore,
  draftStorageKey,
  type DraftPersistence,
  type DraftState,
  type DraftWriteResult,
  type EditorDraftStore
} from "@/storage/draft-store.shared";

const memoryDrafts = new Map<string, string>();

function localStorageOrNull(): Storage | null {
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

const webDraftPersistence: DraftPersistence = {
  async read(key) {
    // The in-memory mirror wins: it holds the newest value even when a durable
    // write failed and the browser retained an older copy.
    const mirrored = memoryDrafts.get(key);
    if (mirrored !== undefined) {
      return mirrored;
    }
    const storage = localStorageOrNull();
    if (!storage) {
      return null;
    }
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  },
  async write(key, value) {
    memoryDrafts.set(key, value);
    const storage = localStorageOrNull();
    if (!storage) {
      return "session";
    }
    try {
      storage.setItem(key, value);
      return "durable";
    } catch {
      // The session copy above is still usable, but it will not survive a
      // reload. Report that honestly instead of throwing away the edit.
      return "session";
    }
  },
  async remove(key) {
    memoryDrafts.delete(key);
    const storage = localStorageOrNull();
    if (!storage) {
      return;
    }
    storage.removeItem(key);
  },
  async clearAll() {
    memoryDrafts.clear();
    const storage = localStorageOrNull();
    if (!storage) {
      return;
    }
    const keys: string[] = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key && key.startsWith(draftStorageKey(""))) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      storage.removeItem(key);
    }
  },
  async entries() {
    const values = new Map<string, string>();
    const storage = localStorageOrNull();
    if (storage) {
      for (let index = 0; index < storage.length; index += 1) {
        const key = storage.key(index);
        if (key && key.startsWith(draftStorageKey(""))) {
          try {
            const value = storage.getItem(key);
            if (value !== null) {
              values.set(key, value);
            }
          } catch {
            // Skip unreadable entries; a partial backup is safer than a crash.
          }
        }
      }
    }
    // The session mirror holds the newest value after a failed durable write.
    for (const [key, value] of memoryDrafts) {
      values.set(key, value);
    }
    return Array.from(values.entries()).map(([key, value]) => ({ key, value }));
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
