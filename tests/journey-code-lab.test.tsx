// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { __lastSandboxCall, __setSandboxOutcome } from "./mocks/sandbox-runner";
import {
  clearStoredProgress,
  clickRunChecks,
  clickRunFile,
  continueForward,
  readStoredProgress,
  renderLessonScreen,
  seedOnboardingComplete
} from "./journey-helpers";

vi.mock("expo-router", () => import("./mocks/expo-router"));
vi.mock("@/sandbox/runner", () => import("./mocks/sandbox-runner"));
vi.mock("react-native-safe-area-context", () => import("./mocks/safe-area-context"));

const LESSON_ID = "lesson-python-zero-files-folders";

async function goToCodeLab() {
  renderLessonScreen(LESSON_ID);
  await continueForward();
  await continueForward();
  expect(screen.getByText("Step 3 of 5: CODE LAB")).toBeInTheDocument();
}

describe("Code Lab journey", () => {
  beforeEach(() => {
    clearStoredProgress();
    seedOnboardingComplete();
    __setSandboxOutcome("pass");
  });

  it("runs the file and shows terminal output", async () => {
    await goToCodeLab();

    await clickRunFile();

    // The terminal shows the mocked program output.
    expect(await screen.findByText("py")).toBeInTheDocument();
    // The run-state badge flips from "Ready to run" to "File ran".
    expect(await screen.findByText("File ran")).toBeInTheDocument();
    // The sandbox received the run_file mode.
    expect(__lastSandboxCall()?.runMode).toBe("run_file");
  });

  it("passes the check and records the attempt in stored progress", async () => {
    await goToCodeLab();

    await clickRunChecks();

    // The status card and the "Code Lab check passed" panel both confirm the pass.
    expect(await screen.findAllByText("Check passed")).toHaveLength(2);
    expect(__lastSandboxCall()?.runMode).toBe("run_checks");

    // The sticky CTA advances now that the mini project is complete.
    expect(screen.getByRole("button", { name: "Take checkpoint" })).toBeEnabled();

    const stored = readStoredProgress();
    expect(stored).not.toBeNull();
    expect(stored?.codeRunAttempts.some((attempt) => (
      attempt.lessonId === LESSON_ID
      && attempt.runMode === "run_checks"
      && attempt.passed
    ))).toBe(true);
    expect(stored?.completedLessonMiniProjectIds).toContain(LESSON_ID);
  });

  it("shows a failing check without completing the mini project", async () => {
    __setSandboxOutcome("fail");
    await goToCodeLab();

    await clickRunChecks();

    expect(await screen.findByText("checks failed")).toBeInTheDocument();

    // The sticky CTA stays on "Run Code Lab" and remains disabled.
    expect(screen.getByRole("button", { name: "Run Code Lab" })).toBeDisabled();

    const stored = readStoredProgress();
    expect(stored?.completedLessonMiniProjectIds ?? []).not.toContain(LESSON_ID);
  });
});
