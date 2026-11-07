import { describe, expect, it } from "vitest";
import {
  CODE_RUN_DISCLOSURE_MIGRATION,
  REVIEW_EVENT_ASSISTED_MIGRATION
} from "@/storage/progress-store";

interface Statement {
  get: (...params: unknown[]) => unknown;
  all: (...params: unknown[]) => unknown[];
  run: (...params: unknown[]) => unknown;
}

interface Database {
  exec: (sql: string) => void;
  prepare: (sql: string) => Statement;
  close: () => void;
}

interface SqliteModule {
  DatabaseSync: new (path: string) => Database;
}

// Load the built-in SQLite engine without asking TypeScript for node:sqlite
// types, which vary by @types/node version. This exercises the migration on a
// real SQLite engine rather than a fake adapter.
const moduleName = "node:sqlite";
const sqlite = await import(moduleName) as unknown as SqliteModule;

function v10Database(): Database {
  const db = new sqlite.DatabaseSync(":memory:");
  db.exec(`
    CREATE TABLE review_events (
      id TEXT PRIMARY KEY NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      rating TEXT NOT NULL,
      reviewed_at TEXT NOT NULL,
      next_due_at TEXT NOT NULL,
      interval_days INTEGER NOT NULL,
      sort_order INTEGER NOT NULL
    );
    CREATE TABLE code_run_attempts (
      id TEXT PRIMARY KEY NOT NULL,
      lesson_id TEXT NOT NULL,
      language TEXT NOT NULL,
      code_snapshot TEXT NOT NULL,
      stdout TEXT NOT NULL,
      stderr TEXT NOT NULL,
      passed INTEGER NOT NULL,
      score REAL NOT NULL,
      runtime_ms INTEGER NOT NULL,
      test_results_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );
    CREATE TABLE lessons (
      id TEXT PRIMARY KEY NOT NULL,
      completed INTEGER NOT NULL
    );
    CREATE TABLE evidence_items (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL
    );
    PRAGMA user_version = 10;
    INSERT INTO lessons (id, completed) VALUES ('lesson-python-values', 1);
    INSERT INTO evidence_items (id, title) VALUES ('evidence-proof-1', 'Proof');
    INSERT INTO review_events
      (id, target_type, target_id, rating, reviewed_at, next_due_at, interval_days, sort_order)
      VALUES ('review-1', 'lesson', 'lesson-python-values', 'good', '2026-11-01T00:00:00.000Z', '2026-11-02T00:00:00.000Z', 1, 0);
    INSERT INTO code_run_attempts
      (id, lesson_id, language, code_snapshot, stdout, stderr, passed, score, runtime_ms, test_results_json, created_at, sort_order)
      VALUES ('attempt-1', 'lesson-python-values', 'python', 'print("ok")', 'ok', '', 1, 100, 5, '[]', '2026-11-01T00:00:00.000Z', 0);
  `);
  return db;
}

describe("real SQLite v10 → v11 additive migration", () => {
  it("preserves learner rows and adds nullable assistance/disclosure columns", () => {
    const db = v10Database();
    try {
      db.exec(REVIEW_EVENT_ASSISTED_MIGRATION);
      db.exec(CODE_RUN_DISCLOSURE_MIGRATION);
      db.exec("PRAGMA user_version = 11;");

      const reviewColumns = db.prepare("PRAGMA table_info(review_events)").all() as Array<{ name: string }>;
      const attemptColumns = db.prepare("PRAGMA table_info(code_run_attempts)").all() as Array<{ name: string }>;
      expect(reviewColumns.some((column) => column.name === "assisted")).toBe(true);
      expect(attemptColumns.some((column) => column.name === "sandbox_disclosure_version")).toBe(true);

      const review = db.prepare("SELECT id, assisted FROM review_events").get() as { id: string; assisted: number | null };
      expect(review).toEqual({ id: "review-1", assisted: null });
      const attempt = db.prepare("SELECT id, sandbox_disclosure_version FROM code_run_attempts").get() as {
        id: string;
        sandbox_disclosure_version: number | null;
      };
      expect(attempt).toEqual({ id: "attempt-1", sandbox_disclosure_version: null });

      // Existing lessons/evidence survive.
      expect(db.prepare("SELECT COUNT(*) AS count FROM lessons").get()).toEqual({ count: 1 });
      expect(db.prepare("SELECT COUNT(*) AS count FROM evidence_items").get()).toEqual({ count: 1 });
      expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 11 });

      db.prepare("UPDATE review_events SET assisted = 1 WHERE id = 'review-1'").run();
      expect(db.prepare("SELECT assisted FROM review_events").get()).toEqual({ assisted: 1 });
    } finally {
      db.close();
    }
  });

  it("treats a row inserted without assistance as unassisted, not false-positive", () => {
    const db = v10Database();
    try {
      db.exec(REVIEW_EVENT_ASSISTED_MIGRATION);
      db.prepare(
        `INSERT INTO review_events
          (id, target_type, target_id, rating, reviewed_at, next_due_at, interval_days, sort_order)
         VALUES ('review-2', 'lesson', 'lesson-python-values', 'good', '2026-11-03T00:00:00.000Z', '2026-11-04T00:00:00.000Z', 1, 1)`
      ).run();
      const row = db.prepare("SELECT assisted FROM review_events WHERE id = 'review-2'").get() as { assisted: number | null };
      expect(row.assisted).toBeNull();
    } finally {
      db.close();
    }
  });
});
