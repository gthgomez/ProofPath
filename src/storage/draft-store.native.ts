import { openDatabaseAsync, type SQLiteDatabase } from "expo-sqlite";
import {
  createEditorDraftStore,
  DRAFT_KEY_PREFIX,
  type DraftPersistence,
  type DraftState,
  type DraftWriteResult,
  type EditorDraftStore
} from "@/storage/draft-store.shared";

/**
 * Native editor-draft persistence.
 *
 * A module-local Map (the PR #51 fallback) is not durable: it dies with the
 * process. Backing drafts with expo-sqlite means an unexecuted edit survives
 * navigation, component remount, and an app restart, matching the web
 * localStorage path. A dedicated small database keeps drafts out of the
 * progress/evidence schema entirely, so resetting progress and exporting
 * portfolio packets cannot accidentally include or destroy editor text.
 */

const DRAFT_DB_NAME = "proofpath-drafts.db";
let dbPromise: Promise<SQLiteDatabase> | null = null;

function getDb(): Promise<SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await openDatabaseAsync(DRAFT_DB_NAME);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS editor_drafts (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
      `);
      return db;
    })().catch((error) => {
      // Allow a later attempt to retry after a transient open failure.
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
}

interface DraftRow {
  value: string;
}

const nativeDraftPersistence: DraftPersistence = {
  async read(key) {
    const db = await getDb();
    const row = await db.getFirstAsync<DraftRow>("SELECT value FROM editor_drafts WHERE key = ?", key);
    return row?.value ?? null;
  },
  async write(key, value) {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO editor_drafts (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      key,
      value,
      new Date().toISOString()
    );
  },
  async remove(key) {
    const db = await getDb();
    await db.runAsync("DELETE FROM editor_drafts WHERE key = ?", key);
  },
  async clearAll() {
    const db = await getDb();
    await db.runAsync("DELETE FROM editor_drafts WHERE key LIKE ?", `${DRAFT_KEY_PREFIX}%`);
  }
};

export const editorDraftStore: EditorDraftStore = createEditorDraftStore(nativeDraftPersistence);

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
