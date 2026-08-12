import type { SQLiteDatabase } from "expo-sqlite";
import { loadProgress, saveProgress, resetProgress } from "./progress-store";
import type { ProgressStore } from "./types";
import type { UserProgress } from "@/domain/types";

/**
 * ProgressStore backed by SQLite (expo-sqlite).
 *
 * Thin wrapper around the existing progress-store.ts functions.
 * The 1448-line SQLite implementation in progress-store.ts is NOT
 * modified — this adapter just binds the db dependency at
 * construction time.
 */
export class SQLiteProgressStore implements ProgressStore {
  constructor(private readonly db: SQLiteDatabase) {}

  async load(): Promise<UserProgress> {
    return loadProgress(this.db);
  }

  async save(progress: UserProgress): Promise<void> {
    return saveProgress(this.db, progress);
  }

  async reset(): Promise<UserProgress> {
    return resetProgress(this.db);
  }
}
