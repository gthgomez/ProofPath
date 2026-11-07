import type { ContentPack, UserProgress } from "@/domain/types";
import { restoreProgressBackup, type ProgressBackup } from "@/domain/progress-backup";
import type { EditorDraftStore, RestoreRecoveryResult } from "@/storage/draft-store.shared";

/**
 * The progress side of a coordinated restore. Implementations must be durable:
 * `write` resolves only after the replacement survives a restart, and `read`
 * returns what is actually on disk.
 */
export interface DurableProgressPort {
  readUpdatedAt(): Promise<string>;
  read(): Promise<UserProgress>;
  write(progress: UserProgress): Promise<void>;
}

export interface CoordinatedRestoreResult {
  ok: boolean;
  progress?: UserProgress;
  error?: string;
}

/**
 * Restore drafts and progress as one recoverable operation.
 *
 * Sequence:
 * 1. Snapshot the old drafts and the old progress identity.
 * 2. Persist a recovery journal containing both draft snapshots and the old/new
 *    progress timestamps. If this cannot be written durably, nothing changes.
 * 3. Replace drafts. `importAll` requires durable writes and rolls itself back
 *    to the snapshot on failure.
 * 4. Replace progress (atomic in both storage engines).
 * 5. Clear the journal only after both replacements are durable.
 *
 * Failure handling:
 * - Journal failure: original drafts and progress preserved.
 * - Draft failure: `importAll` restores the old drafts; progress untouched.
 * - Progress failure: old drafts are restored; the previous progress is intact.
 * - Process termination: `recoverPendingProgressRestore` uses the progress
 *   `updatedAt` to decide whether the new or old draft snapshot is authoritative.
 *
 * This is a verified two-phase replacement, not a claim that independent writes
 * are atomic.
 */
export async function coordinatedProgressRestore({
  backup,
  content,
  draftStore,
  progressPort,
  now = new Date().toISOString()
}: {
  backup: ProgressBackup;
  content: ContentPack;
  draftStore: EditorDraftStore;
  progressPort: DurableProgressPort;
  now?: string;
}): Promise<CoordinatedRestoreResult> {
  const oldDrafts = await draftStore.exportAll();
  const oldUpdatedAt = await progressPort.readUpdatedAt();

  const restored = restoreProgressBackup(content, backup, now);
  const newUpdatedAt = restored.updatedAt === oldUpdatedAt
    ? new Date(Date.parse(now) + 1).toISOString()
    : restored.updatedAt;
  const nextProgress: UserProgress = {
    ...restored,
    updatedAt: newUpdatedAt,
    profile: { ...restored.profile, updatedAt: newUpdatedAt }
  };

  try {
    await draftStore.writeRestoreJournal({
      version: 1,
      createdAt: now,
      oldDrafts,
      newDrafts: backup.drafts,
      oldProgressUpdatedAt: oldUpdatedAt,
      newProgressUpdatedAt: newUpdatedAt
    });
  } catch (caughtError) {
    return {
      ok: false,
      error: caughtError instanceof Error
        ? caughtError.message
        : "This device could not stage the restore safely."
    };
  }

  const draftResult = await draftStore.importAll(backup.drafts);
  if (!draftResult.ok) {
    await draftStore.clearRestoreJournal().catch(() => undefined);
    return { ok: false, error: draftResult.error };
  }

  try {
    await progressPort.write(nextProgress);
    const persisted = await progressPort.read();
    if (persisted.updatedAt !== newUpdatedAt) {
      throw new Error("Progress storage did not retain the restored snapshot.");
    }
  } catch (caughtError) {
    const rollback = await draftStore.importAll(oldDrafts);
    if (rollback.ok) {
      await draftStore.clearRestoreJournal().catch(() => undefined);
    }
    const reason = caughtError instanceof Error ? caughtError.message : "Progress could not be saved.";
    return {
      ok: false,
      error: rollback.ok
        ? reason
        : `${reason} Editor drafts could not be fully rolled back; ProofPath will finish recovery on the next launch.`
    };
  }

  try {
    await draftStore.clearRestoreJournal();
  } catch {
    // The data is durable; a leftover journal is idempotent on next launch.
  }

  return { ok: true, progress: nextProgress };
}

/**
 * Finish or roll back an interrupted restore. Progress is already durable at
 * this point; only the draft side needs reconciliation.
 */
export async function recoverPendingProgressRestore(
  draftStore: EditorDraftStore,
  progressPort: Pick<DurableProgressPort, "readUpdatedAt">
): Promise<RestoreRecoveryResult> {
  let updatedAt = "";
  try {
    updatedAt = await progressPort.readUpdatedAt();
  } catch {
    // A missing progress row means the restore's progress write never landed,
    // so the old draft snapshot wins.
    updatedAt = "";
  }
  return draftStore.recoverPendingRestore(updatedAt);
}
