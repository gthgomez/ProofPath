import type { UserProgress } from "@/domain/types";

/**
 * Portable storage abstraction for UserProgress.
 *
 * Implementations exist for:
 *   - SQLite (native Android/iOS via expo-sqlite)
 *   - localStorage (web)
 *
 * All methods are async to support SQLite's async API.
 * Synchronous storage (localStorage) may resolve immediately.
 */
export interface ProgressStore {
  /** Retrieve saved progress. Creates initial state if none exists. */
  load(): Promise<UserProgress>;

  /** Persist the current progress snapshot. */
  save(progress: UserProgress): Promise<void>;

  /** Wipe all stored data and return fresh initial progress. */
  reset(): Promise<UserProgress>;
}
