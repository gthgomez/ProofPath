import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { computeCodeHash } from "@/domain/code-run";
import {
  createProgressBackup,
  parseProgressBackup,
  PROGRESS_BACKUP_FORMAT,
  PROGRESS_BACKUP_VERSION,
  restoreProgressBackup,
  serializeProgressBackup,
  type ProgressBackup
} from "@/domain/progress-backup";
import { createInitialProgress } from "@/domain/progress";
import type { CodeRunAttempt, EvidenceItem, UserProgress } from "@/domain/types";

const NOW = "2026-11-07T12:00:00.000Z";
const SENTINEL = "HIDDEN_ONLY_SENTINEL_IMPORTED_2026";

function baseProgress(): UserProgress {
  return createInitialProgress(NOW);
}

function forgedAttempt(overrides: Partial<CodeRunAttempt> = {}): CodeRunAttempt {
  return {
    id: "forged-attempt",
    lessonId: "lesson-python-values",
    language: "python",
    runMode: "run_checks",
    command: "proofpath checks study_session.py",
    codeSnapshot: "print('ok')",
    stdout: SENTINEL,
    stderr: SENTINEL,
    passed: true,
    score: 100,
    runtimeMs: 1,
    testResults: [
      { id: "visible", name: SENTINEL, passed: true, visible: true, message: SENTINEL },
      { id: "hidden", name: SENTINEL, passed: true, visible: false, message: SENTINEL }
    ],
    hiddenCheckSummary: { total: 1, passed: 1, failed: 0 },
    diagnostics: [{ id: "d", severity: "info", source: "runtime", message: SENTINEL, confidence: "known" }],
    terminalTranscript: [{ type: "stdout", text: SENTINEL }],
    // A future marker is still just a claim made by the document.
    sandboxDisclosureVersion: 9999,
    createdAt: NOW,
    ...overrides
  };
}

function forgedEvidence(overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    id: "forged-evidence",
    type: "test-output",
    title: "Forged Code Lab proof",
    body: "The learner says this ran.",
    linkedLessonId: "lesson-python-values",
    linkedSkillIds: [],
    testStatus: "passing",
    readmeStatus: "missing",
    trust: "auto_verified_code_lab",
    verifierOutput: SENTINEL,
    proofArtifact: {
      sourceRunAttemptId: "forged-attempt",
      lessonId: "lesson-python-values",
      language: "python",
      runMode: "run_checks",
      command: "proofpath checks study_session.py",
      passed: true,
      score: 100,
      runtimeMs: 1,
      createdAt: NOW,
      stdout: SENTINEL,
      stderr: SENTINEL,
      visibleCheckResults: [
        { id: "visible", name: SENTINEL, passed: true, visible: true, message: SENTINEL }
      ],
      hiddenCheckSummary: { total: 1, passed: 1, failed: 0 },
      // Deliberately wrong for the preserved code snapshot.
      codeHash: "cf-deadbeef",
      codeSnapshot: "print('ok')",
      terminalTranscript: [{ type: "stdout", text: SENTINEL }],
      sandboxDisclosureVersion: 9999
    },
    createdAt: NOW,
    ...overrides
  };
}

function rawBackup(progress: UserProgress): Record<string, unknown> {
  return {
    format: PROGRESS_BACKUP_FORMAT,
    version: PROGRESS_BACKUP_VERSION,
    createdAt: NOW,
    progress,
    drafts: {}
  };
}

describe("imported backup trust boundary", () => {
  it("does not trust a forged disclosure marker or Code Lab label from a document", () => {
    const progress = {
      ...baseProgress(),
      codeRunAttempts: [forgedAttempt()],
      evidenceItems: [forgedEvidence()],
      completedLessonMiniProjectIds: [],
      durableLessonMiniProjectIds: []
    };

    const parsed = parseProgressBackup(JSON.stringify(rawBackup(progress)), NOW);
    expect(parsed.error).toBeUndefined();
    const restored = restoreProgressBackup(contentPack, parsed.backup!, NOW);
    const serialized = JSON.stringify(restored);

    expect(serialized).not.toContain(SENTINEL);
    const attempt = restored.codeRunAttempts[0];
    expect(attempt.importedAt).toBe(NOW);
    expect(attempt.stdout).toBe("");
    expect(attempt.stderr).toBe("");
    expect(attempt.hiddenCheckSummary).toEqual({ total: 0, passed: 0, failed: 0 });
    expect(attempt.testResults.every((result) => result.visible)).toBe(true);
    expect(attempt.testResults[0]?.name).toBe("Visible check 1");
    expect(attempt.passed).toBe(true);

    const evidence = restored.evidenceItems[0];
    expect(evidence.importedAt).toBe(NOW);
    expect(evidence.trust).toBe("manual_verifier_output");
    expect(evidence.proofArtifact?.importedAt).toBe(NOW);
    expect(evidence.proofArtifact?.hiddenCheckSummary).toEqual({ total: 0, passed: 0, failed: 0 });
    expect(evidence.verifierOutput).not.toContain(SENTINEL);
  });

  it("does not promote an imported passing attempt into a durable achievement", () => {
    const progress = {
      ...baseProgress(),
      codeRunAttempts: [forgedAttempt()],
      completedLessonMiniProjectIds: [],
      durableLessonMiniProjectIds: []
    };

    const restored = restoreProgressBackup(
      contentPack,
      parseProgressBackup(JSON.stringify(rawBackup(progress)), NOW).backup!,
      NOW
    );

    expect(restored.durableLessonMiniProjectIds ?? []).not.toContain("lesson-python-values");
  });

  it("keeps an explicitly recorded achievement even though attempts are not promoted", () => {
    const progress = {
      ...baseProgress(),
      codeRunAttempts: [forgedAttempt()],
      completedLessonMiniProjectIds: ["lesson-python-values"],
      durableLessonMiniProjectIds: ["lesson-python-values"]
    };

    const restored = restoreProgressBackup(
      contentPack,
      parseProgressBackup(JSON.stringify(rawBackup(progress)), NOW).backup!,
      NOW
    );

    expect(restored.durableLessonMiniProjectIds).toContain("lesson-python-values");
  });

  it("recomputes a proof hash from the preserved code instead of trusting the document", () => {
    const progress = {
      ...baseProgress(),
      evidenceItems: [forgedEvidence()]
    };

    const restored = restoreProgressBackup(
      contentPack,
      parseProgressBackup(JSON.stringify(rawBackup(progress)), NOW).backup!,
      NOW
    );

    expect(restored.evidenceItems[0]?.proofArtifact?.codeHash).toBe(computeCodeHash("print('ok')"));
    expect(restored.evidenceItems[0]?.proofArtifact?.codeHash).not.toBe("cf-deadbeef");
  });

  it("marks conflicting proof and attempt identities as imported rather than verified", () => {
    const evidence = forgedEvidence({
      proofArtifact: {
        ...forgedEvidence().proofArtifact!,
        sourceRunAttemptId: "an-attempt-that-is-not-in-this-document"
      }
    });
    const progress = { ...baseProgress(), evidenceItems: [evidence] };

    const restored = restoreProgressBackup(
      contentPack,
      parseProgressBackup(JSON.stringify(rawBackup(progress)), NOW).backup!,
      NOW
    );

    expect(restored.evidenceItems[0]?.trust).toBe("manual_verifier_output");
    expect(restored.evidenceItems[0]?.importedAt).toBe(NOW);
  });

  it("treats an imported quiz pass as history without awarding a durable quiz achievement", () => {
    const progress = {
      ...baseProgress(),
      quizAttempts: [{
        id: "forged-quiz",
        quizId: "quiz-python-values",
        selectedChoiceIndexes: [0],
        score: 100,
        passed: true,
        attemptedAt: NOW
      }],
      durableQuizIds: []
    };

    const restored = restoreProgressBackup(
      contentPack,
      parseProgressBackup(JSON.stringify(rawBackup(progress)), NOW).backup!,
      NOW
    );

    expect(restored.quizAttempts[0]?.importedAt).toBe(NOW);
    expect(restored.durableQuizIds ?? []).not.toContain("quiz-python-values");
  });

  it("rejects an unsupported newer backup before interpreting any records", () => {
    const parsed = parseProgressBackup(JSON.stringify({
      ...rawBackup({ ...baseProgress(), codeRunAttempts: [forgedAttempt()] }),
      version: PROGRESS_BACKUP_VERSION + 1
    }), NOW);

    expect(parsed.error).toMatch(/newer ProofPath version/i);
    expect(parsed.backup).toBeUndefined();
  });

  it("sanitizes an oversized malformed transcript instead of publishing it", () => {
    const huge = "A".repeat(1_500_000) + SENTINEL;
    const progress = {
      ...baseProgress(),
      codeRunAttempts: [forgedAttempt({ terminalTranscript: [{ type: "stdout", text: huge }] })]
    };

    const parsed = parseProgressBackup(JSON.stringify(rawBackup(progress)), NOW);
    expect(parsed.error).toBeUndefined();
    const restored = restoreProgressBackup(contentPack, parsed.backup!, NOW);
    expect(JSON.stringify(restored)).not.toContain(SENTINEL);
    expect(restored.codeRunAttempts[0]?.terminalTranscript).not.toEqual([{ type: "stdout", text: huge }]);
  });

  it("still restores an older supported format with no attempts", () => {
    const progress = { ...baseProgress(), completedLessonIds: [] };
    const parsed = parseProgressBackup(JSON.stringify(rawBackup(progress)), NOW);

    expect(parsed.error).toBeUndefined();
    expect(parsed.backup?.version).toBe(1);
  });

  it("keeps a locally produced backup round-trippable while dropping its local-verification claim on import", () => {
    const progress: UserProgress = {
      ...baseProgress(),
      evidenceItems: [{
        ...forgedEvidence({ trust: "auto_verified_code_lab" }),
        verifierOutput: "ok"
      }]
    };
    // Export sanitizes the document; import still refuses to trust its marker.
    const exported = serializeProgressBackup(createProgressBackup(progress, {}, NOW));
    const parsed = parseProgressBackup(exported, NOW);
    expect(parsed.error).toBeUndefined();
    const restored = restoreProgressBackup(contentPack, parsed.backup as ProgressBackup, NOW);
    expect(restored.evidenceItems[0]?.trust).toBe("manual_verifier_output");
    expect(restored.evidenceItems[0]?.importedAt).toBe(NOW);
  });
});
