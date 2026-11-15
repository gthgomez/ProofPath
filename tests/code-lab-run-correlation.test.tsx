// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { CURRENT_SANDBOX_DISCLOSURE_VERSION } from "@/domain/code-run";
import type { CodeRunAttempt, LessonRunnerSpec } from "@/domain/types";
import { resetDraftStoreForTests } from "@/storage/draft-store";

vi.mock("expo-router", () => import("./mocks/expo-router"));
vi.mock("react-native-safe-area-context", () => import("./mocks/safe-area-context"));

const LESSON_ID = "lesson-synthetic-run-correlation";
const NOW = "2026-11-15T05:26:00.000Z";

const SPEC: LessonRunnerSpec = {
  language: "javascript",
  instructions: "Print ok.",
  starterCode: "console.log('ok');",
  visibleTests: [{ id: "visible", name: "Prints ok", code: "", expectedOutputIncludes: ["ok"] }],
  hiddenTests: [],
  expectedOutput: ["ok"],
  timeoutMs: 1000,
  allowNetwork: false
};

function attempt(id: string): CodeRunAttempt {
  return {
    id,
    lessonId: LESSON_ID,
    language: "javascript",
    runMode: "run_checks",
    command: "proofpath checks lesson.js",
    codeSnapshot: "console.log('ok');",
    stdout: "ok",
    stderr: "",
    passed: true,
    score: 100,
    runtimeMs: 3,
    testResults: [{ id: "visible", name: "Prints ok", passed: true, visible: true, message: "Passed" }],
    hiddenCheckSummary: { total: 0, passed: 0, failed: 0 },
    diagnostics: [],
    terminalTranscript: [{ type: "result", status: "passed", reason: "success", runtimeMs: 3, exitCode: 0 }],
    sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION,
    createdAt: NOW
  };
}

describe("Code Lab web run-generation correlation", () => {
  beforeEach(async () => {
    await resetDraftStoreForTests();
    window.localStorage.clear();
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("does not deliver a delayed sandbox result after the Code Lab unmounts", async () => {
    let resolveRun: ((value: CodeRunAttempt) => void) | undefined;
    const pending = new Promise<CodeRunAttempt>((resolve) => {
      resolveRun = resolve;
    });

    vi.doMock("@/sandbox/runner", () => ({
      getSandboxCapabilityLabel: () => ({ label: "test runner", note: "synthetic" }),
      runLessonSandbox: async () => pending
    }));

    const { CodeLab } = await import("@/ui/code-lab");
    const received: CodeRunAttempt[] = [];
    const view = render(
      <CodeLab
        attemptHistory={[]}
        isSaving={false}
        lessonId={LESSON_ID}
        onRunPassed={(next) => {
          received.push(next);
        }}
        runnerSpec={SPEC}
      />
    );

    fireEvent.click(await screen.findByRole("button", { name: "Run checks" }));
    await waitFor(() => expect(screen.getAllByText("Running checks").length).toBeGreaterThan(0));

    view.unmount();

    await act(async () => {
      resolveRun?.(attempt("attempt-late-after-unmount"));
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(received).toEqual([]);
  });
});
