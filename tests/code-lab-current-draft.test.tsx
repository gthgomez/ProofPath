// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CURRENT_SANDBOX_DISCLOSURE_VERSION } from "@/domain/code-run";
import type { CodeRunAttempt, LessonRunnerSpec } from "@/domain/types";
import { resetDraftStoreForTests, saveEditorDraft } from "@/storage/draft-store";
import { CodeLab } from "@/ui/code-lab";

vi.mock("expo-router", () => import("./mocks/expo-router"));
vi.mock("react-native-safe-area-context", () => import("./mocks/safe-area-context"));

const LESSON_ID = "lesson-verify-current-draft";
const NOW = "2026-11-07T12:00:00.000Z";

const SPEC: LessonRunnerSpec = {
  language: "python",
  instructions: "Print ok.",
  starterCode: "print('wrong')",
  visibleTests: [{ id: "visible", name: "Prints ok", code: "", expectedOutputIncludes: ["ok"] }],
  hiddenTests: [],
  expectedOutput: ["ok"],
  timeoutMs: 1000,
  allowNetwork: false
};

function passingRun(): CodeRunAttempt {
  return {
    id: "attempt-passing",
    lessonId: LESSON_ID,
    language: "python",
    runMode: "run_checks",
    command: "proofpath checks study_session.py",
    codeSnapshot: "print('ok')",
    stdout: "ok",
    stderr: "",
    passed: true,
    score: 100,
    runtimeMs: 5,
    testResults: [{ id: "visible", name: "Prints ok", passed: true, visible: true, message: "Passed" }],
    hiddenCheckSummary: { total: 0, passed: 0, failed: 0 },
    diagnostics: [],
    terminalTranscript: [
      { type: "stdout", text: "ok" },
      { type: "result", status: "passed", reason: "success", runtimeMs: 5, exitCode: 0 }
    ],
    sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION,
    createdAt: NOW
  };
}

function renderLab(onRunPassed: (attempt: CodeRunAttempt) => void = () => undefined) {
  const run = passingRun();
  return render(
    <CodeLab
      attemptHistory={[run]}
      historicalAchievement
      isSaving={false}
      latestRun={run}
      lessonId={LESSON_ID}
      onRunPassed={onRunPassed}
      runnerSpec={SPEC}
    />
  );
}

describe("Code Lab current-draft verification", () => {
  beforeEach(async () => {
    await resetDraftStoreForTests();
    window.localStorage.clear();
  });

  it("shows the checked result only while the editor matches the checked snapshot", async () => {
    renderLab();

    expect(await screen.findByText("Check passed")).toBeInTheDocument();
    expect(screen.getByText(/Check passed for the code currently in the editor/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("python code editor"), {
      target: { value: "print('wrong')" }
    });

    expect(await screen.findByText("Unverified changes")).toBeInTheDocument();
    expect(screen.getByText("Lesson passed previously")).toBeInTheDocument();
    expect(screen.queryByText(/Check passed for the code currently in the editor/)).toBeNull();
    expect(screen.getByText(/Last executed snapshot/)).toBeInTheDocument();
  });

  it("does not present an incorrect starter as checked after an explicit reset", async () => {
    renderLab();
    expect(await screen.findByText("Check passed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset starter" }));

    expect(await screen.findByText("Unverified changes")).toBeInTheDocument();
    expect(screen.queryByText("Check passed")).toBeNull();
    expect(screen.getByText("Lesson passed previously")).toBeInTheDocument();
  });

  it("keeps historical achievement while a restored draft remains unverified", async () => {
    await saveEditorDraft(LESSON_ID, "print('restored but unchecked')");
    renderLab();

    expect(await screen.findByDisplayValue("print('restored but unchecked')")).toBeInTheDocument();
    expect(await screen.findByText("Unverified changes")).toBeInTheDocument();
    expect(screen.getByText("Lesson passed previously")).toBeInTheDocument();
    expect(screen.queryByText("Check passed")).toBeNull();
  });
});
