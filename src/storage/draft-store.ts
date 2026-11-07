const memoryDrafts = new Map<string, string>();

const DRAFT_KEY_PREFIX = "proofpath.editor_draft.";

function isLocalStorageAvailable(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * Retrieves the stored editor draft code for a given lesson, if any.
 * Checks localStorage first, then in-memory cache.
 */
export function getEditorDraft(lessonId: string): string | null {
  if (isLocalStorageAvailable()) {
    try {
      const stored = window.localStorage.getItem(`${DRAFT_KEY_PREFIX}${lessonId}`);
      if (stored !== null) {
        return stored;
      }
    } catch (_) {
      // Ignore security/quota errors and fall back to memory
    }
  }

  return memoryDrafts.get(lessonId) ?? null;
}

/**
 * Persists the learner's current editor text for a given lesson so edits
 * made before or after running code survive navigation, re-renders, and reloads.
 */
export function saveEditorDraft(lessonId: string, code: string): void {
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.setItem(`${DRAFT_KEY_PREFIX}${lessonId}`, code);
    } catch (_) {
      // Ignore storage errors
    }
  }

  memoryDrafts.set(lessonId, code);
}

/**
 * Clears the stored editor draft for a given lesson.
 */
export function clearEditorDraft(lessonId: string): void {
  if (isLocalStorageAvailable()) {
    try {
      window.localStorage.removeItem(`${DRAFT_KEY_PREFIX}${lessonId}`);
    } catch (_) {
      // Ignore storage errors
    }
  }

  memoryDrafts.delete(lessonId);
}

/**
 * Clears all in-memory drafts (primarily for test resets).
 */
export function resetDraftStoreForTests(): void {
  memoryDrafts.clear();
}
