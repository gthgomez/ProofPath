// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  CURRENT_SANDBOX_DISCLOSURE_VERSION,
  privateVerificationFailedDiagnostic
} from "@/domain/code-run";
import type { CodeRunAttempt, LessonRunnerSpec } from "@/domain/types";
import { resetDraftStoreForTests } from "@/storage/draft-store";
import { CodeLab } from "@/ui/code-lab";

vi.mock("expo-router", () => import("./mocks/expo-router"));
vi.mock("react-native-safe-area-context", () => import("./mocks/safe-area-context"));

const LESSON_ID = "lesson-synthetic-diagnostics-survive-edit";
const NOW = "2026-11-15T05:40:00.000Z";
const FAIL_MESSAGE = "NameError: name 'frist' is not defined";

const SPEC: LessonRunnerSpec = {
  language: "python",
  instructions: "Print first run.",
  starterCode: "print('first run')",
  visibleTests: [{ id: "visible", name: "Prints first run", code: "", expectedOutputIncludes: ["first run"] }],
  hiddenTests: [],
  expectedOutput: ["first run"],
  timeoutMs: 1000,
  allowNetwork: false
};

function failingRun(): CodeRunAttempt {
  return {
    id: "attempt-failing",
    lessonId: LESSON_ID,
    language: "python",
    runMode: "run_checks",
    command: "proofpath checks study_session.py",
    codeSnapshot: "print(frist)",
    stdout: "",
    stderr: FAIL_MESSAGE,
    passed: false,
    score: 0,
    runtimeMs: 4,
    testResults: [{ id: "visible", name: "Prints first run", passed: false, visible: true, message: FAIL_MESSAGE }],
    hiddenCheckSummary: { total: 0, passed: 0, failed: 0 },
    diagnostics: [{
      id: "python-name-error",
      severity: "error",
      source: "runtime",
      message: FAIL_MESSAGE,
      beginnerExplanation: "Python looked for a name that does not exist yet.",
      confidence: "unknown"
    }],
    terminalTranscript: [
      { type: "stderr", text: FAIL_MESSAGE },
      { type: "diagnostic", severity: "error", message: FAIL_MESSAGE },
      { type: "result", status: "failed", reason: "runtime_error", runtimeMs: 4, exitCode: 1 }
    ],
    sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION,
    createdAt: NOW
  };
}

describe("Code Lab diagnostics survive unverified edits", () => {
  beforeEach(async () => {
    await resetDraftStoreForTests();
    window.localStorage.clear();
  });

  it("keeps the last failure clue visible after the learner edits the draft", async () => {
    const run = failingRun();
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

    expect(await screen.findByText("Needs attention")).toBeInTheDocument();
    expect(screen.getAllByText(FAIL_MESSAGE).length).toBeGreaterThan(0);

    fireEvent.change(screen.getByLabelText("python code editor"), {
      target: { value: "print('first run')" }
    });

    expect(await screen.findByText("Unverified changes")).toBeInTheDocument();
    expect(screen.queryByText("Check passed")).toBeNull();
    // The previous failure must remain so the learner can fix against it.
    expect(screen.getAllByText(FAIL_MESSAGE).length).toBeGreaterThan(0);
    expect(screen.getByText(/Python looked for a name that does not exist yet/)).toBeInTheDocument();
  });

  it("keeps private-verification feedback visible after an unverified edit", async () => {
    const diagnostic = privateVerificationFailedDiagnostic();
    const run: CodeRunAttempt = {
      ...failingRun(),
      id: "attempt-private-fail",
      codeSnapshot: 'print("DONE")',
      stdout: "DONE",
      stderr: "",
      score: 50,
      testResults: [{ id: "visible", name: "Visible check", passed: true, visible: true, message: "Passed" }],
      diagnostics: [diagnostic],
      terminalTranscript: [
        { type: "stdout", text: "DONE" },
        { type: "diagnostic", severity: "error", message: diagnostic.message },
        { type: "result", status: "failed", reason: "check_failed", runtimeMs: 4, exitCode: 1 }
      ]
    };

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
    fireEvent.change(screen.getByLabelText("python code editor"), {
      target: { value: 'print("DONE")\nprint("more")' }
    });
    expect(await screen.findByText("Unverified changes")).toBeInTheDocument();
    expect(screen.getAllByText(diagnostic.message).length).toBeGreaterThan(0);
  });
});
