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

function createRestoreTransactionId(now: string): string {
  const cryptoApi = globalThis.crypto as Crypto | undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === "function") {
    return cryptoApi.randomUUID();
  }
  return `restore-${now}-${Math.random().toString(36).slice(2, 12)}`;
}

async function readProgressIdentity(
  port: DurableProgressPort
): Promise<{ updatedAt: string; restoreTransactionId?: string } | null> {
  try {
    const progress = await port.read();
    return {
      updatedAt: progress.updatedAt,
      ...(progress.restoreTransactionId ? { restoreTransactionId: progress.restoreTransactionId } : {})
    };
  } catch {
    return null;
  }
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
  const transactionId = createRestoreTransactionId(now);

  const restored = restoreProgressBackup(content, backup, now);
  const newUpdatedAt = restored.updatedAt === oldUpdatedAt
    ? new Date(Date.parse(now) + 1).toISOString()
    : restored.updatedAt;
  const nextProgress: UserProgress = {
    ...restored,
    restoreTransactionId: transactionId,
    updatedAt: newUpdatedAt,
    profile: { ...restored.profile, updatedAt: newUpdatedAt }
  };

  try {
    await draftStore.writeRestoreJournal({
      version: 2,
      transactionId,
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
    // Keep the journal whenever rollback may be incomplete so startup can
    // decide from the durable progress identity. A journal is harmless and
    // idempotent; deleting it early could expose a mixed state.
    if (draftResult.rollbackComplete) {
      await draftStore.clearRestoreJournal().catch(() => undefined);
    }
    return {
      ok: false,
      error: draftResult.rollbackComplete
        ? draftResult.error
        : `${draftResult.error} Recovery information was kept; ProofPath will finish reconciling on the next launch.`
    };
  }

  let writeError: unknown = null;
  try {
    await progressPort.write(nextProgress);
  } catch (error) {
    writeError = error;
  }

  // A write can succeed durably and still reject (or a verification read can
  // fail). Read the authoritative identity instead of assuming failure.
  let persisted = await readProgressIdentity(progressPort);
  if (!persisted) {
    persisted = await readProgressIdentity(progressPort);
  }

  const confirmedNew = persisted?.restoreTransactionId === transactionId
    && persisted.updatedAt === newUpdatedAt;
  if (confirmedNew) {
    try {
      await draftStore.clearRestoreJournal();
    } catch {
      // Data is coherent; a leftover journal is idempotent on next launch.
    }
    return { ok: true, progress: nextProgress };
  }

  // Only roll drafts back when the write itself rejected *and* the store still
  // reports the old identity. A write that resolved but reads back old/stale is
  // ambiguous (eventual consistency, broken adapter, or concurrent writer) and
  // must keep the journal rather than risk pairing new progress with old drafts.
  const confirmedOld = writeError !== null
    && persisted
    && persisted.restoreTransactionId !== transactionId
    && persisted.updatedAt === oldUpdatedAt;

  if (confirmedOld) {
    const rollback = await draftStore.importAll(oldDrafts);
    if (rollback.ok) {
      await draftStore.clearRestoreJournal().catch(() => undefined);
    }
    const reason = writeError instanceof Error
      ? writeError.message
      : "Progress storage did not retain the restored snapshot.";
    return {
      ok: false,
      error: rollback.ok
        ? reason
        : `${reason} Editor drafts could not be fully rolled back; ProofPath will finish recovery on the next launch.`
    };
  }

  // Ambiguous: the write may have committed but verification is unavailable, or
  // another writer changed progress. Do not roll drafts back and do not delete
  // the journal; startup recovery will establish one coherent side.
  return {
    ok: false,
    error: "ProofPath could not verify which progress snapshot is durable. The restore journal was kept, and the next launch will reconcile progress and drafts to one coherent state."
  };
}

/**
 * Finish or roll back an interrupted restore. Progress is already durable at
 * this point; only the draft side needs reconciliation.
 */
export async function recoverPendingProgressRestore(
  draftStore: EditorDraftStore,
  progressPort: Pick<DurableProgressPort, "read">
): Promise<RestoreRecoveryResult> {
  return draftStore.recoverPendingRestore(async () => {
    const progress = await progressPort.read();
    return {
      updatedAt: progress.updatedAt,
      ...(progress.restoreTransactionId ? { restoreTransactionId: progress.restoreTransactionId } : {})
    };
  });
}
