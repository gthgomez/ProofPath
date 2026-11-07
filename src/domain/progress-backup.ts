import { z } from "zod";
import {
  formatProofArtifactVerifierOutput,
  normalizeCodeRunAttempt,
  sanitizeProofArtifactForDisclosure
} from "@/domain/code-run";
import type { ContentPack, EvidenceItem, UserProgress } from "@/domain/types";
import { ensureProgressProfile, reconcileDerivedProgress } from "@/domain/progress";
import { userProgressSchema } from "@/domain/schemas";
import type { DraftState } from "@/storage/draft-store.shared";

/**
 * A complete local progress backup, distinct from a reviewer portfolio packet.
 *
 * It contains the learner's profile, achievements, placement, attempts,
 * evidence/proofs, review state (including assistance), weekly reports, and
 * editor drafts (including reset tombstones). It is versioned and validated
 * before any mutation. Restoring is an explicit replace, not a merge.
 */
export const PROGRESS_BACKUP_FORMAT = "proofpath-progress-backup";
export const PROGRESS_BACKUP_VERSION = 1;
export const MAX_PROGRESS_BACKUP_CHARS = 5_000_000;
const MAX_DRAFT_CODE_CHARS = 200_000;
const MAX_DRAFT_COUNT = 5_000;

export type ProgressBackupDraft =
  | { status: "draft"; code: string }
  | { status: "reset" };

export interface ProgressBackup {
  format: typeof PROGRESS_BACKUP_FORMAT;
  version: number;
  createdAt: string;
  progress: UserProgress;
  drafts: Record<string, ProgressBackupDraft>;
}

export interface ProgressBackupParseResult {
  backup?: ProgressBackup;
  error?: string;
}

const progressBackupDraftSchema = z.union([
  z.object({ status: z.literal("draft"), code: z.string() }),
  z.object({ status: z.literal("reset") })
]);

const progressBackupSchema = z.object({
  format: z.literal(PROGRESS_BACKUP_FORMAT),
  version: z.number().int().positive(),
  createdAt: z.string(),
  progress: userProgressSchema,
  drafts: z.record(z.string(), progressBackupDraftSchema).default({})
});

function sanitizeEvidenceForBackup(item: EvidenceItem): EvidenceItem {
  if (!item.proofArtifact) {
    return item;
  }

  const proofArtifact = sanitizeProofArtifactForDisclosure(item.proofArtifact);
  return {
    ...item,
    // A legacy auto-proof may have kept a raw copy here that predates the
    // disclosure boundary. Derive it from the sanitized proof instead.
    verifierOutput: formatProofArtifactVerifierOutput(proofArtifact),
    proofArtifact
  };
}

function sanitizeProgressForBackup(progress: UserProgress): UserProgress {
  return {
    ...progress,
    codeRunAttempts: progress.codeRunAttempts.map(normalizeCodeRunAttempt),
    evidenceItems: progress.evidenceItems.map(sanitizeEvidenceForBackup)
  };
}

export function createProgressBackup(
  progress: UserProgress,
  drafts: Record<string, DraftState>,
  now = new Date().toISOString()
): ProgressBackup {
  const backupDrafts: Record<string, ProgressBackupDraft> = {};
  for (const [lessonId, state] of Object.entries(drafts)) {
    if (!lessonId) {
      continue;
    }
    if (state.status === "draft") {
      backupDrafts[lessonId] = { status: "draft", code: state.code };
    } else if (state.status === "reset") {
      backupDrafts[lessonId] = { status: "reset" };
    }
  }

  return {
    format: PROGRESS_BACKUP_FORMAT,
    version: PROGRESS_BACKUP_VERSION,
    createdAt: now,
    progress: sanitizeProgressForBackup(progress),
    drafts: backupDrafts
  };
}

export function serializeProgressBackup(backup: ProgressBackup): string {
  return JSON.stringify(backup, null, 2);
}

export function parseProgressBackup(raw: string, now = new Date().toISOString()): ProgressBackupParseResult {
  if (raw.length > MAX_PROGRESS_BACKUP_CHARS) {
    return { error: "This backup is too large to restore safely." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "The pasted backup is not valid JSON." };
  }

  const result = progressBackupSchema.safeParse(parsed);
  if (!result.success) {
    return { error: "The pasted backup does not match the ProofPath progress backup format." };
  }

  if (result.data.version > PROGRESS_BACKUP_VERSION) {
    return { error: `This backup was created by a newer ProofPath version (${result.data.version}).` };
  }

  if (Object.keys(result.data.drafts).length > MAX_DRAFT_COUNT) {
    return { error: "This backup contains too many editor drafts to restore safely." };
  }

  for (const [lessonId, draft] of Object.entries(result.data.drafts)) {
    if (!lessonId || (draft.status === "draft" && draft.code.length > MAX_DRAFT_CODE_CHARS)) {
      return { error: "This backup contains an invalid or oversized editor draft." };
    }
  }

  const normalizedProgress = ensureProgressProfile(
    result.data.progress as unknown as Parameters<typeof ensureProgressProfile>[0],
    now
  );

  return {
    backup: {
      format: PROGRESS_BACKUP_FORMAT,
      version: result.data.version,
      createdAt: result.data.createdAt,
      progress: normalizedProgress,
      drafts: result.data.drafts
    }
  };
}

/**
 * Produce the progress to install after a confirmed restore. Derived fields
 * (completed lessons/missions, review items) are reconciled against the current
 * content pack so the restored state is internally consistent.
 */
export function restoreProgressBackup(
  content: ContentPack,
  backup: ProgressBackup,
  now = new Date().toISOString()
): UserProgress {
  const normalized = ensureProgressProfile(
    backup.progress as unknown as Parameters<typeof ensureProgressProfile>[0],
    now
  );
  return reconcileDerivedProgress(content, normalized, now);
}
