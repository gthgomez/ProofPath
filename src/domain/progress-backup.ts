import { z } from "zod";
import {
  computeCodeHash,
  formatProofArtifactVerifierOutput,
  normalizeCodeRunAttempt,
  sanitizeProofArtifactForDisclosure
} from "@/domain/code-run";
import { classifyEvidenceTrust } from "@/domain/evidence-trust";
import type { ContentPack, EvidenceItem, ProofArtifact, UserProgress } from "@/domain/types";
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

/**
 * Measured ceiling shared by export and import.
 *
 * The app keeps at most 250 code-run attempts and 250 quiz attempts. A maximal
 * attempt today is roughly 12 KB of code plus a bounded transcript (~1 KB), so
 * attempts cost < 4 MB even before evidence. Evidence may duplicate a proof's
 * buffers, roughly doubling that. Drafts are capped at 200 KB each and 5,000
 * entries, but real drafts are a few KB. 20 million characters leaves ample
 * headroom for legitimate history while still refusing a document that cannot
 * be restored in one operation. The important invariant is that the exporter
 * rejects the *same* document the importer would reject.
 */
export const MAX_PROGRESS_BACKUP_CHARS = 20_000_000;
const MAX_DRAFT_CODE_CHARS = 200_000;
const MAX_DRAFT_COUNT = 5_000;

export class ProgressBackupTooLargeError extends Error {
  readonly characters: number;
  readonly limit: number;

  constructor(characters: number, limit = MAX_PROGRESS_BACKUP_CHARS) {
    super(`This backup is ${characters.toLocaleString()} characters, above the ${limit.toLocaleString()}-character restore limit.`);
    this.name = "ProgressBackupTooLargeError";
    this.characters = characters;
    this.limit = limit;
  }
}

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

/**
 * Treat every record in an imported document as untrusted input.
 *
 * A `sandboxDisclosureVersion` (or an `auto_verified_code_lab` label, or a
 * passing grade) that arrives inside a backup is an assertion by the document,
 * not evidence that this device's sanitizing runner produced it. Import forces
 * the legacy-disclosure path, which withholds ambiguous raw buffers, neutralizes
 * visible check labels, and recomputes the code hash from the preserved code.
 * Grades and learner code are preserved; provenance is downgraded to
 * self-reported so no imported record is presented as locally verified.
 */
export function sanitizeImportedProgress(progress: UserProgress, now: string): UserProgress {
  const codeRunAttempts = (progress.codeRunAttempts ?? []).map((attempt) => ({
    ...normalizeCodeRunAttempt({
      ...attempt,
      sandboxDisclosureVersion: undefined,
      importedAt: now
    }),
    importedAt: now
  }));

  const quizAttempts = (progress.quizAttempts ?? []).map((attempt) => ({
    ...attempt,
    importedAt: now
  }));

  const evidenceItems = progress.evidenceItems.map((item): EvidenceItem => {
    if (!item.proofArtifact) {
      return {
        ...item,
        trust: classifyEvidenceTrust({
          repoUrl: item.repoUrl,
          commitHash: item.commitHash,
          verifierOutput: item.verifierOutput
        }),
        importedAt: now
      };
    }

    const proofArtifact = sanitizeImportedProofArtifact(item.proofArtifact, now);
    return {
      ...item,
      // A proof restored from a file is useful history, but this device did not
      // execute it. Never keep the stronger local-verification label.
      trust: "manual_verifier_output",
      importedAt: now,
      verifierOutput: formatProofArtifactVerifierOutput(proofArtifact),
      proofArtifact
    };
  });

  return {
    ...progress,
    // A restore identity belongs to the device that performed the restore. An
    // imported file must not be able to claim it.
    restoreTransactionId: undefined,
    codeRunAttempts,
    quizAttempts,
    evidenceItems
  };
}

function sanitizeImportedProofArtifact(proof: ProofArtifact, now: string): ProofArtifact {
  const sanitized = sanitizeProofArtifactForDisclosure({
    ...proof,
    sandboxDisclosureVersion: undefined,
    importedAt: now
  });

  return {
    ...sanitized,
    importedAt: now,
    // Identity must match the code that was preserved, not a hash supplied by
    // the document. Without a snapshot there is nothing to recompute from.
    ...(sanitized.codeSnapshot !== undefined
      ? { codeHash: computeCodeHash(sanitized.codeSnapshot) }
      : {})
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

/**
 * Serialize a backup but refuse to produce a document that the importer would
 * reject. Export must never advertise a "complete" backup it cannot restore.
 */
export function serializeProgressBackup(backup: ProgressBackup): string {
  const json = JSON.stringify(backup, null, 2);
  if (json.length > MAX_PROGRESS_BACKUP_CHARS) {
    throw new ProgressBackupTooLargeError(json.length);
  }
  return json;
}

export function parseProgressBackup(raw: string, now = new Date().toISOString()): ProgressBackupParseResult {
  if (raw.length > MAX_PROGRESS_BACKUP_CHARS) {
    return { error: `This backup is too large to restore safely (${raw.length.toLocaleString()} characters; limit ${MAX_PROGRESS_BACKUP_CHARS.toLocaleString()}).` };
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

  // Sanitize before profile reconciliation so a forged passing attempt cannot
  // be promoted into a durable achievement first and then marked imported.
  const importedProgress = sanitizeImportedProgress(
    result.data.progress as unknown as UserProgress,
    now
  );
  const normalizedProgress = ensureProgressProfile(
    importedProgress as unknown as Parameters<typeof ensureProgressProfile>[0],
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
 *
 * Sanitization is repeated here because callers may construct a backup object
 * directly instead of going through `parseProgressBackup`; the operation is
 * idempotent for already-imported records.
 */
export function restoreProgressBackup(
  content: ContentPack,
  backup: ProgressBackup,
  now = new Date().toISOString()
): UserProgress {
  const importedProgress = sanitizeImportedProgress(backup.progress, now);
  const normalized = ensureProgressProfile(
    importedProgress as unknown as Parameters<typeof ensureProgressProfile>[0],
    now
  );
  return reconcileDerivedProgress(content, normalized, now);
}
