import { describe, expect, it } from "vitest";
import {
  CURRENT_SANDBOX_DISCLOSURE_VERSION,
  normalizeCodeRunAttempt,
  PRIVATE_VERIFICATION_DIAGNOSTIC_ID,
  privateVerificationFailedDiagnostic,
  withPrivateVerificationFeedback
} from "@/domain/code-run";
import type { CodeRunAttempt, CodeRunTestResult, ProblemDiagnostic } from "@/domain/types";

const NOW = "2026-11-15T05:20:00.000Z";
const SECRET_NAME = "SECRET_HIDDEN_NAME_2026";
const SECRET_MESSAGE = "SECRET_HIDDEN_MESSAGE_2026";
const SECRET_EXPECTED = "SECRET_EXPECTED_ROW_2026";

function visiblePass(): CodeRunTestResult {
  return { id: "visible", name: "Visible check", passed: true, visible: true, message: "Passed" };
}

function attempt(overrides: Partial<CodeRunAttempt> = {}): CodeRunAttempt {
  return {
    id: "attempt-private-feedback",
    lessonId: "lesson-synthetic-private-feedback",
    language: "python",
    runMode: "run_checks",
    command: "proofpath checks study_session.py",
    codeSnapshot: 'print("DONE")',
    stdout: "DONE",
    stderr: "",
    passed: false,
    score: 50,
    runtimeMs: 12,
    testResults: [
      visiblePass(),
      { id: "hidden", name: SECRET_NAME, passed: false, visible: false, message: SECRET_MESSAGE }
    ],
    hiddenCheckSummary: { total: 1, passed: 0, failed: 1 },
    diagnostics: [],
    terminalTranscript: [],
    sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION,
    createdAt: NOW,
    ...overrides
  };
}

describe("private verification learner feedback", () => {
  it("adds a count-free diagnostic when visible checks pass but the grade fails", () => {
    const normalized = normalizeCodeRunAttempt(attempt());
    const privateDiagnostic = normalized.diagnostics.find(
      (diagnostic) => diagnostic.id === PRIVATE_VERIFICATION_DIAGNOSTIC_ID
    );

    expect(normalized.passed).toBe(false);
    expect(normalized.testResults).toEqual([visiblePass()]);
    expect(privateDiagnostic).toEqual(privateVerificationFailedDiagnostic());
    expect(normalized.terminalTranscript.some((event) => (
      event.type === "diagnostic" && event.message.includes("additional private verification")
    ))).toBe(true);

    const serialized = JSON.stringify(normalized);
    for (const secret of [SECRET_NAME, SECRET_MESSAGE, SECRET_EXPECTED, "total\":1", "failed\":1"]) {
      expect(serialized).not.toContain(secret);
    }
    expect(normalized.hiddenCheckSummary).toEqual({ total: 0, passed: 0, failed: 0 });
  });

  it("does not invent private-failure feedback when a visible check already failed", () => {
    const diagnostics = withPrivateVerificationFeedback([], {
      passed: false,
      runMode: "run_checks",
      visibleCheckResults: [
        { id: "visible", name: "Visible check", passed: false, visible: true, message: "Not yet." }
      ]
    });

    expect(diagnostics).toEqual([]);
  });

  it("does not add feedback for a fully passing attempt", () => {
    const diagnostics = withPrivateVerificationFeedback([], {
      passed: true,
      runMode: "run_checks",
      visibleCheckResults: [visiblePass()]
    });

    expect(diagnostics).toEqual([]);
  });

  it("is idempotent when the diagnostic is already present", () => {
    const existing: ProblemDiagnostic[] = [privateVerificationFailedDiagnostic()];
    const next = withPrivateVerificationFeedback(existing, {
      passed: false,
      runMode: "run_checks",
      visibleCheckResults: [visiblePass()]
    });

    expect(next).toHaveLength(1);
    expect(next[0]?.id).toBe(PRIVATE_VERIFICATION_DIAGNOSTIC_ID);
  });

  it("keeps legacy quarantine ahead of private-verification synthesis", () => {
    const legacy = normalizeCodeRunAttempt(attempt({
      sandboxDisclosureVersion: undefined,
      stdout: `DONE\n${SECRET_EXPECTED}`,
      stderr: SECRET_MESSAGE,
      diagnostics: [{
        id: "legacy-leak",
        severity: "error",
        source: "runtime",
        message: SECRET_MESSAGE,
        confidence: "unknown"
      }]
    }));

    expect(legacy.diagnostics.map((diagnostic) => diagnostic.id)).toEqual(["legacy-output-quarantine"]);
    expect(JSON.stringify(legacy)).not.toContain(SECRET_MESSAGE);
    expect(JSON.stringify(legacy)).not.toContain(SECRET_EXPECTED);
  });
});
