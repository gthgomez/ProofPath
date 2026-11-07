import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import {
  createProofArtifactFromAttempt,
  normalizeCodeRunAttempt,
  publicHiddenCheckSummary,
  redactCheckResults
} from "@/domain/code-run";
import { generateReviewerPortfolioExport } from "@/domain/evidence-export";
import { createInitialProgress, recordCodeRunAttempt, setRoleTarget } from "@/domain/progress";
import type { CodeRunAttempt, CodeRunTestResult } from "@/domain/types";

const NOW = "2026-11-07T21:20:00.000Z";

function hiddenResults(): CodeRunTestResult[] {
  return [
    { id: "visible", name: "Visible check", passed: true, visible: true, message: "Passed" },
    { id: "hidden-a", name: "SECRET_HIDDEN_NAME", passed: true, visible: false, message: "SECRET_HIDDEN_MESSAGE" },
    { id: "hidden-b", name: "SECRET_HIDDEN_NAME_2", passed: false, visible: false, message: "SECRET_HIDDEN_MESSAGE_2" }
  ];
}

function attempt(overrides: Partial<CodeRunAttempt> = {}): CodeRunAttempt {
  return {
    id: "attempt-hidden-policy",
    lessonId: "lesson-python-values",
    language: "python",
    runMode: "run_checks",
    command: "proofpath checks study_session.py",
    codeSnapshot: "print('ok')",
    stdout: "ok",
    stderr: "",
    passed: true,
    score: 100,
    runtimeMs: 4,
    testResults: hiddenResults(),
    hiddenCheckSummary: { total: 2, passed: 1, failed: 1 },
    diagnostics: [],
    terminalTranscript: [],
    createdAt: NOW,
    ...overrides
  };
}

describe("public hidden-check disclosure policy", () => {
  it("zeroes a supplied aggregate and drops hidden names and messages", () => {
    const normalized = normalizeCodeRunAttempt(attempt());

    expect(normalized.hiddenCheckSummary).toEqual({ total: 0, passed: 0, failed: 0 });
    expect(normalized.testResults.map((result) => result.id)).toEqual(["visible"]);
    expect(JSON.stringify(normalized)).not.toContain("SECRET_HIDDEN");
  });

  it("normalizes a historical attempt whose summary field is missing", () => {
    const legacy = attempt();
    delete (legacy as { hiddenCheckSummary?: unknown }).hiddenCheckSummary;

    const normalized = normalizeCodeRunAttempt(legacy);

    expect(normalized.hiddenCheckSummary).toEqual(publicHiddenCheckSummary());
    expect(JSON.stringify(normalized)).not.toContain("SECRET_HIDDEN");
  });

  it("keeps internal grading counts while publishing zero counts", () => {
    // Grading must still see the hidden failure; only disclosure is suppressed.
    const internal = redactCheckResults(hiddenResults());
    expect(internal.hiddenCheckSummary).toEqual({ total: 2, passed: 1, failed: 1 });
    expect(normalizeCodeRunAttempt(attempt({ passed: false, score: 67 })).hiddenCheckSummary).toEqual({
      total: 0,
      passed: 0,
      failed: 0
    });
  });

  it("keeps proof artifacts and reviewer exports free of hidden-check material", () => {
    const proof = createProofArtifactFromAttempt(normalizeCodeRunAttempt(attempt()));
    expect(proof).not.toBeNull();
    expect(proof?.hiddenCheckSummary).toEqual({ total: 0, passed: 0, failed: 0 });

    let progress = setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
    progress = recordCodeRunAttempt(progress, attempt(), NOW);

    const packet = generateReviewerPortfolioExport(contentPack, progress, NOW);
    const serialized = JSON.stringify(packet);
    expect(serialized).not.toContain("SECRET_HIDDEN");
    expect(packet.markdownPacket).not.toContain("SECRET_HIDDEN");
    expect(packet.evidenceItems[0]?.proofArtifact?.hiddenCheckSummary).toEqual({ total: 0, passed: 0, failed: 0 });
  });
});
