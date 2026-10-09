import type { EvidenceTrustClassification, ProofArtifact } from "./types";

/**
 * Single owner of evidence-provenance semantics.
 *
 * ProofPath can only make strong claims about work it actually executed. Every
 * other classification describes information the learner supplied. These
 * categories exist so the UI, the reviewer export, and readiness scoring can
 * never present learner-entered data as independently verified engineering
 * work.
 *
 * | Classification                  | What it means                                                        |
 * | ------------------------------- | -------------------------------------------------------------------- |
 * | `auto_verified_code_lab`        | ProofPath executed the check in its own sandbox. Locally verified.   |
 * | `reproduction_package_supplied` | Repo, revision, and verification command were provided, not executed.|
 * | `manual_verifier_output`        | The learner pasted check output. Self-reported.                      |
 * | `manual_note`                   | The learner wrote a note. Self-reported.                             |
 * | `independently_verified`        | A trusted third party re-ran the work. Not awarded by current code.  |
 */
export interface TrustProvenanceInfo {
  id: EvidenceTrustClassification;
  /** Learner-facing label. */
  label: string;
  /** One-line explanation of exactly what was (and was not) executed. */
  description: string;
  /** True only when ProofPath itself executed the relevant checks. */
  locallyVerified: boolean;
  /** True only when a trusted independent party verified the artifact. */
  independentlyVerified: boolean;
}

export const TRUST_PROVENANCE: Record<EvidenceTrustClassification, TrustProvenanceInfo> = {
  auto_verified_code_lab: {
    id: "auto_verified_code_lab",
    label: "Locally verified (Code Lab)",
    description: "ProofPath ran the check in its own sandbox and captured the result.",
    locallyVerified: true,
    independentlyVerified: false
  },
  reproduction_package_supplied: {
    id: "reproduction_package_supplied",
    label: "Reproduction package supplied",
    description: "A repository, revision, and verification command were supplied, but ProofPath has not executed them.",
    locallyVerified: false,
    independentlyVerified: false
  },
  manual_verifier_output: {
    id: "manual_verifier_output",
    label: "Self-reported check output",
    description: "The learner pasted check output. ProofPath did not run or verify it.",
    locallyVerified: false,
    independentlyVerified: false
  },
  manual_note: {
    id: "manual_note",
    label: "Self-reported note",
    description: "A learner-written note. No execution was performed or verified.",
    locallyVerified: false,
    independentlyVerified: false
  },
  independently_verified: {
    id: "independently_verified",
    label: "Independently verified",
    description: "A trusted verifier executed the specified artifact or revision. Not currently awarded.",
    locallyVerified: false,
    independentlyVerified: true
  }
};

/**
 * Historical persisted values that no longer describe a supported provenance
 * category. They map to the honest equivalent: `externally_reproducible` never
 * proved external execution, so it becomes `reproduction_package_supplied`
 * rather than being silently promoted to a stronger claim.
 */
const LEGACY_TRUST_CLASSIFICATIONS: Record<string, EvidenceTrustClassification> = {
  externally_reproducible: "reproduction_package_supplied"
};

export function normalizeTrustClassification(raw: string | null | undefined): EvidenceTrustClassification | undefined {
  if (!raw) {
    return undefined;
  }

  const legacy = LEGACY_TRUST_CLASSIFICATIONS[raw];
  if (legacy) {
    return legacy;
  }

  return Object.prototype.hasOwnProperty.call(TRUST_PROVENANCE, raw)
    ? (raw as EvidenceTrustClassification)
    : undefined;
}

export function trustProvenance(trust: EvidenceTrustClassification | undefined): TrustProvenanceInfo {
  return TRUST_PROVENANCE[trust ?? "manual_note"] ?? TRUST_PROVENANCE.manual_note;
}

export function evidenceTrustLabel(trust: EvidenceTrustClassification | undefined): string {
  return trustProvenance(trust).label;
}

export function isUrlLike(value: string): boolean {
  return /^https?:\/\/[^\s]+$/i.test(value.trim());
}

export function isCommitHashLike(value: string): boolean {
  return /^[a-f0-9]{7,40}$/i.test(value.trim());
}

export interface EvidenceClassificationInput {
  proofArtifact?: ProofArtifact;
  repoUrl?: string | null;
  commitHash?: string | null;
  verifierOutput?: string | null;
}

/**
 * A "reproduction package" is a repository plus a pinned revision plus the
 * command that re-checks it. Supplying these means a third party *could*
 * reproduce the work; it does not mean anyone did. README state and claimed
 * test status are deliberately excluded — they are assertions, not artifacts.
 */
export function suppliesReproductionPackage(input: EvidenceClassificationInput): boolean {
  return Boolean(
    input.repoUrl && isUrlLike(input.repoUrl)
    && input.commitHash && isCommitHashLike(input.commitHash)
    && input.verifierOutput && input.verifierOutput.trim().length > 0
  );
}

/**
 * Classify learner-supplied evidence by the strongest claim its own contents
 * support. ProofPath never awards `independently_verified` here: it has not
 * executed the external work.
 */
export function classifyEvidenceTrust(input: EvidenceClassificationInput): EvidenceTrustClassification {
  if (input.proofArtifact) {
    return "auto_verified_code_lab";
  }

  if (suppliesReproductionPackage(input)) {
    return "reproduction_package_supplied";
  }

  if (input.verifierOutput && input.verifierOutput.trim().length > 0) {
    return "manual_verifier_output";
  }

  return "manual_note";
}
