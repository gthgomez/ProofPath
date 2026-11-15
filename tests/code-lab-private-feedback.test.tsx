// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  CURRENT_SANDBOX_DISCLOSURE_VERSION,
  PRIVATE_VERIFICATION_DIAGNOSTIC_ID,
  privateVerificationFailedDiagnostic
} from "@/domain/code-run";
import type { CodeRunAttempt, LessonRunnerSpec } from "@/domain/types";
import { resetDraftStoreForTests } from "@/storage/draft-store";
import { CodeLab } from "@/ui/code-lab";

vi.mock("expo-router", () => import("./mocks/expo-router"));
vi.mock("react-native-safe-area-context", () => import("./mocks/safe-area-context"));

const LESSON_ID = "lesson-synthetic-private-feedback-ui";
const NOW = "2026-11-15T05:25:00.000Z";

const SPEC: LessonRunnerSpec = {
  language: "python",
  instructions: "Print DONE, then satisfy the private checks.",
  starterCode: 'print("DONE")',
  visibleTests: [{ id: "visible", name: "Visible check", code: "", expectedOutputIncludes: ["DONE"] }],
  hiddenTests: [{
    id: "hidden",
    name: "SECRET_HIDDEN_NAME",
    code: "",
    expectedOutputIncludes: ["SECRET_EXPECTED_ROW_2026"]
  }],
  expectedOutput: ["DONE"],
  timeoutMs: 1000,
  allowNetwork: false
};

function privateFailureRun(): CodeRunAttempt {
  const diagnostic = privateVerificationFailedDiagnostic();
  return {
    id: "attempt-private-fail",
    lessonId: LESSON_ID,
    language: "python",
    runMode: "run_checks",
    command: "proofpath checks study_session.py",
    codeSnapshot: 'print("DONE")',
    stdout: "DONE",
    stderr: "",
    passed: false,
    score: 50,
    runtimeMs: 8,
    testResults: [{ id: "visible", name: "Visible check", passed: true, visible: true, message: "Passed" }],
    hiddenCheckSummary: { total: 0, passed: 0, failed: 0 },
    diagnostics: [diagnostic],
    terminalTranscript: [
      { type: "stdout", text: "DONE" },
      { type: "diagnostic", severity: "info", message: "PASS Visible check: Passed" },
      { type: "diagnostic", severity: "error", message: diagnostic.message },
      { type: "result", status: "failed", reason: "check_failed", runtimeMs: 8, exitCode: 1 }
    ],
    sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION,
    createdAt: NOW
  };
}

describe("Code Lab private-verification feedback", () => {
  beforeEach(async () => {
    await resetDraftStoreForTests();
    window.localStorage.clear();
  });

  it("explains a hidden-only failure without telling the learner to read a missing visible failure", async () => {
    const run = privateFailureRun();
    render(
      <CodeLab
        attemptHistory={[run]}
        isSaving={false}
        latestRun={run}
        lessonId={LESSON_ID}
        onRunPassed={() => undefined}
        runnerSpec={SPEC}
      />
    );

    expect(await screen.findByText("Private checks need work")).toBeInTheDocument();
    expect(screen.getAllByText(/Visible checks passed, but private verification did not/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Read the failing test, change the smallest thing/)).toBeNull();
    expect(screen.getAllByText(privateVerificationFailedDiagnostic().message).length).toBeGreaterThan(0);
    expect(screen.getAllByText(privateVerificationFailedDiagnostic().beginnerExplanation!).length).toBeGreaterThan(0);
    expect(screen.queryByText(/SECRET_/)).toBeNull();
    expect(screen.queryByText(PRIVATE_VERIFICATION_DIAGNOSTIC_ID)).toBeNull();
  });
});
