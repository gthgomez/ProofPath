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

// Session mirror so a transient SQLite write failure does not discard the
// learner's edit outright. It is reported as `session_only`, never as durable.
const memoryDrafts = new Map<string, string>();

const nativeDraftPersistence: DraftPersistence = {
  async read(key) {
    const mirrored = memoryDrafts.get(key);
    if (mirrored !== undefined) {
      return mirrored;
    }
    const db = await getDb();
    const row = await db.getFirstAsync<DraftRow>("SELECT value FROM editor_drafts WHERE key = ?", key);
    return row?.value ?? null;
  },
  async write(key, value) {
    memoryDrafts.set(key, value);
    try {
      const db = await getDb();
      await db.runAsync(
        `INSERT INTO editor_drafts (key, value, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
        key,
        value,
        new Date().toISOString()
      );
      return "durable";
    } catch {
      return "session";
    }
  },
  async remove(key) {
    memoryDrafts.delete(key);
    const db = await getDb();
    await db.runAsync("DELETE FROM editor_drafts WHERE key = ?", key);
  },
  async clearAll() {
    memoryDrafts.clear();
    const db = await getDb();
    await db.runAsync("DELETE FROM editor_drafts WHERE key LIKE ?", `${DRAFT_KEY_PREFIX}%`);
  },
  async entries() {
    const db = await getDb();
    const rows = await db.getAllAsync<DraftRow & { key: string }>(
      "SELECT key, value FROM editor_drafts WHERE key LIKE ?",
      `${DRAFT_KEY_PREFIX}%`
    );
    const values = new Map<string, string>();
    for (const row of rows) {
      values.set(row.key, row.value);
    }
    // The session mirror holds the newest value after a failed durable write.
    for (const [key, value] of memoryDrafts) {
      values.set(key, value);
    }
    return Array.from(values.entries()).map(([key, value]) => ({ key, value }));
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
