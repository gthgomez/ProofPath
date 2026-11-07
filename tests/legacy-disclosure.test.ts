import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import {
  CURRENT_SANDBOX_DISCLOSURE_VERSION,
  LEGACY_OUTPUT_QUARANTINE_NOTICE,
  normalizeCodeRunAttempt,
  sanitizeProofArtifactForDisclosure
} from "@/domain/code-run";
import { generateReviewerPortfolioExport } from "@/domain/evidence-export";
import {
  createInitialProgress,
  ensureProgressProfile,
  recordCodeRunAttempt,
  setRoleTarget
} from "@/domain/progress";
import type { CodeRunAttempt, EvidenceItem, ProofArtifact, UserProgress } from "@/domain/types";

const NOW = "2026-11-07T12:00:00.000Z";
const SENTINEL = "HIDDEN_ONLY_SENTINEL_2026";
const HIDDEN_NAME = "SECRET_HIDDEN_CHECK_NAME";

function legacyAttempt(overrides: Partial<CodeRunAttempt> = {}): CodeRunAttempt {
  return {
    id: "legacy-attempt",
    lessonId: "lesson-python-values",
    language: "python",
    runMode: "run_checks",
    command: "proofpath checks study_session.py",
    codeSnapshot: "print('ok')",
    stdout: `ok\n${SENTINEL}`,
    stderr: `${SENTINEL}\nTraceback: hidden seed`,
    passed: false,
    score: 50,
    runtimeMs: 9,
    testResults: [
      { id: `visible-${SENTINEL}`, name: `Visible ${SENTINEL}`, passed: true, visible: true, message: SENTINEL },
      { id: "hidden-1", name: HIDDEN_NAME, passed: false, visible: false, message: SENTINEL }
    ],
    hiddenCheckSummary: { total: 1, passed: 0, failed: 1 },
    diagnostics: [
      {
        id: "runtime-error",
        severity: "error",
        source: "runtime",
        message: SENTINEL,
        confidence: "unknown"
      }
    ],
    terminalTranscript: [
      { type: "command", text: "$ proofpath checks study_session.py" },
      { type: "stdout", text: SENTINEL },
      { type: "stderr", text: SENTINEL },
      { type: "result", status: "failed", reason: "check_failed", runtimeMs: 9, exitCode: 1 }
    ],
    createdAt: NOW,
    ...overrides
  };
}

function legacyProof(overrides: Partial<ProofArtifact> = {}): ProofArtifact {
  return {
    sourceRunAttemptId: "legacy-attempt",
    lessonId: "lesson-python-values",
    language: "python",
    runMode: "run_checks",
    command: "proofpath checks study_session.py",
    passed: true,
    score: 100,
    runtimeMs: 9,
    createdAt: NOW,
    stdout: SENTINEL,
    stderr: SENTINEL,
    visibleCheckResults: [
      { id: `visible-${SENTINEL}`, name: HIDDEN_NAME, passed: true, visible: true, message: SENTINEL }
    ],
    hiddenCheckSummary: { total: 3, passed: 2, failed: 1 },
    codeHash: "cf-00000000",
    codeSnapshot: "print('ok')",
    terminalTranscript: [
      { type: "stdout", text: SENTINEL },
      { type: "result", status: "passed", reason: "success", runtimeMs: 9, exitCode: 0 }
    ],
    ...overrides
  };
}

function onboarded(): UserProgress {
  return setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
}

describe("legacy sandbox disclosure quarantine", () => {
  it("strips every sandbox-derived field from a legacy attempt while preserving grade and code", () => {
    const normalized = normalizeCodeRunAttempt(legacyAttempt());

    expect(normalized.passed).toBe(false);
    expect(normalized.score).toBe(50);
    expect(normalized.codeSnapshot).toBe("print('ok')");
    expect(normalized.sandboxDisclosureVersion).toBe(CURRENT_SANDBOX_DISCLOSURE_VERSION);

    expect(normalized.stdout).toBe("");
    expect(normalized.stderr).toBe("");
    expect(normalized.diagnostics).toEqual([
      {
        id: "legacy-output-quarantine",
        severity: "info",
        source: "runtime",
        message: LEGACY_OUTPUT_QUARANTINE_NOTICE,
        confidence: "known"
      }
    ]);
    expect(normalized.hiddenCheckSummary).toEqual({ total: 0, passed: 0, failed: 0 });
    expect(normalized.testResults).toEqual([
      { id: "visible-1", name: "Visible check 1", passed: true, visible: true, message: "Visible check result preserved; legacy detail withheld." }
    ]);

    const serialized = JSON.stringify(normalized);
    expect(serialized).not.toContain(SENTINEL);
    expect(serialized).not.toContain(HIDDEN_NAME);
    expect(normalized.terminalTranscript).toContainEqual({
      type: "diagnostic",
      severity: "info",
      message: LEGACY_OUTPUT_QUARANTINE_NOTICE
    });
    expect(normalized.terminalTranscript).toContainEqual({
      type: "result",
      status: "failed",
      reason: "check_failed",
      runtimeMs: 9,
      exitCode: 1
    });
  });

  it("is idempotent across repeated normalization", () => {
    const once = normalizeCodeRunAttempt(legacyAttempt());
    const twice = normalizeCodeRunAttempt(once);
    expect(twice).toEqual(once);
    expect(JSON.stringify(twice)).not.toContain(SENTINEL);
  });

  it("keeps visible output for a current runner attempt", () => {
    const trusted = legacyAttempt({
      sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION,
      stdout: "visible stdout",
      stderr: "",
      diagnostics: [],
      testResults: [
        { id: "visible", name: "Visible output", passed: true, visible: true, message: "ok" }
      ],
      hiddenCheckSummary: { total: 0, passed: 0, failed: 0 }
    });

    const normalized = normalizeCodeRunAttempt(trusted);

    expect(normalized.stdout).toBe("visible stdout");
    expect(normalized.testResults[0]?.message).toBe("ok");
    expect(normalized.terminalTranscript).toContainEqual({ type: "stdout", text: "visible stdout" });
    expect(JSON.stringify(normalized)).not.toContain(LEGACY_OUTPUT_QUARANTINE_NOTICE);
  });

  it("quarantines a persisted legacy proof artifact", () => {
    const sanitized = sanitizeProofArtifactForDisclosure(legacyProof());

    expect(sanitized.stdout).toBe("");
    expect(sanitized.stderr).toBe("");
    expect(sanitized.hiddenCheckSummary).toEqual({ total: 0, passed: 0, failed: 0 });
    expect(sanitized.visibleCheckResults).toEqual([
      { id: "visible-1", name: "Visible check 1", passed: true, visible: true, message: "Visible check result preserved; legacy detail withheld." }
    ]);
    expect(sanitized.sandboxDisclosureVersion).toBe(CURRENT_SANDBOX_DISCLOSURE_VERSION);
    expect(JSON.stringify(sanitized)).not.toContain(SENTINEL);
    expect(JSON.stringify(sanitized)).not.toContain(HIDDEN_NAME);
  });

  it("does not leak legacy data through proof creation or a reviewer export", () => {
    let progress = onboarded();
    progress = recordCodeRunAttempt(progress, legacyAttempt({ passed: true, score: 100 }), NOW);

    const packet = generateReviewerPortfolioExport(contentPack, progress, NOW);
    const serialized = JSON.stringify(packet);

    expect(serialized).not.toContain(SENTINEL);
    expect(serialized).not.toContain(HIDDEN_NAME);
    expect(packet.markdownPacket).not.toContain(SENTINEL);
    expect(packet.markdownPacket).not.toContain(HIDDEN_NAME);
    expect(packet.markdownPacket).toContain(LEGACY_OUTPUT_QUARANTINE_NOTICE);
    // A pass is still a pass; quarantine changes disclosure, not grading.
    expect(packet.summary.autoVerifiedCount).toBe(1);
  });

  it("sanitizes a legacy proof that was loaded directly from persisted progress", () => {
    const rawEvidence: EvidenceItem = {
      id: "evidence-proof-legacy",
      type: "test-output",
      title: "Legacy proof",
      body: "Captured automatically.",
      linkedLessonId: "lesson-python-values",
      linkedSkillIds: [],
      testStatus: "passing",
      readmeStatus: "missing",
      verifierOutput: `${SENTINEL} raw persisted verifier output`,
      proofArtifact: legacyProof(),
      trust: "auto_verified_code_lab",
      createdAt: NOW
    };
    const stored = createInitialProgress(NOW);
    stored.evidenceItems = [rawEvidence];
    stored.codeRunAttempts = [legacyAttempt()];

    const loaded = ensureProgressProfile(
      stored as unknown as Parameters<typeof ensureProgressProfile>[0],
      NOW
    );
    const packet = generateReviewerPortfolioExport(contentPack, loaded, NOW);
    const serialized = JSON.stringify(packet);
    const entry = packet.evidenceItems[0];

    expect(serialized).not.toContain(SENTINEL);
    expect(serialized).not.toContain(HIDDEN_NAME);
    expect(packet.markdownPacket).not.toContain(SENTINEL);
    expect(entry?.trust).toBe("auto_verified_code_lab");
    expect(entry?.verifierOutput ?? "").not.toContain(SENTINEL);
    expect(entry?.proofArtifact?.stdout).toBe("");
    expect(entry?.proofArtifact?.sandboxDisclosureVersion).toBe(CURRENT_SANDBOX_DISCLOSURE_VERSION);
  });
});
