// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { __setSandboxOutcome } from "./mocks/sandbox-runner";
import {
  answerQuiz,
  clearStoredProgress,
  clickRunChecks,
  continueForward,
  getQuizForLesson,
  getQuizSubmitButton,
  readStoredProgress,
  renderLessonScreen
} from "./journey-helpers";

vi.mock("expo-router", () => import("./mocks/expo-router"));
vi.mock("@/sandbox/runner", () => import("./mocks/sandbox-runner"));
vi.mock("react-native-safe-area-context", () => import("./mocks/safe-area-context"));

const SAMPLE_LESSON_ID = "lesson-python-zero-first-script";

describe("sample lesson journey without onboarding", () => {
  beforeEach(() => {
    clearStoredProgress();
    __setSandboxOutcome("pass");
  });

  it("runs, fails, then passes the graded checks and completes the lesson", async () => {
    renderLessonScreen(SAMPLE_LESSON_ID);

    // The lesson renders and explains the preview instead of silently redirecting.
    expect(await screen.findByText("Running Your First Script")).toBeInTheDocument();
    expect(screen.getByText("You are previewing a sample lesson")).toBeInTheDocument();

    // Experiment: run the starter code and see its output.
    await continueForward();
    fireEvent.click(screen.getByRole("button", { name: /Run starter code/ }));
    expect(await screen.findByText("Starter output")).toBeInTheDocument();

    // Code Lab: the shipped starter fails the graded checks...
    await continueForward();
    expect(screen.getByText("Step 3 of 5: CODE LAB")).toBeInTheDocument();

    __setSandboxOutcome("fail");
    await clickRunChecks();
    expect(await screen.findByText("checks failed")).toBeInTheDocument();

    // ...then a corrected line passes and records the mini project.
    __setSandboxOutcome("pass");
    await clickRunChecks();
    expect(await screen.findAllByText("Check passed")).toHaveLength(2);

    // Checkpoint: answer correctly and pass.
    fireEvent.click(screen.getByRole("button", { name: "Checkpoint step" }));
    const quiz = getQuizForLesson(SAMPLE_LESSON_ID);
    await answerQuiz(quiz);
    fireEvent.click(getQuizSubmitButton());
    expect(await screen.findByText("Checkpoint passed", { selector: "h1" })).toBeInTheDocument();

    // Evidence: a clear next action, not an unexplained onboarding redirect.
    fireEvent.click(screen.getByRole("button", { name: "Evidence step" }));
    expect(screen.getByText("Choose a career path to save portfolio evidence")).toBeInTheDocument();

    // Progress is retained locally on this device.
    const stored = readStoredProgress();
    expect(stored?.completedQuizIds).toContain(quiz.id);
    expect(stored?.durableLessonMiniProjectIds ?? []).toContain(SAMPLE_LESSON_ID);
  });

  it("keeps saved sample progress across a reload", async () => {
    const firstRender = renderLessonScreen(SAMPLE_LESSON_ID);
    await continueForward();
    await continueForward();
    await clickRunChecks();

    const stored = readStoredProgress();
    expect(stored?.codeRunAttempts.some((attempt) => attempt.lessonId === SAMPLE_LESSON_ID && attempt.passed)).toBe(true);

    // Unmount, then re-mount against the persisted store: the pass survives.
    firstRender.unmount();
    renderLessonScreen(SAMPLE_LESSON_ID);
    expect(await screen.findByText("Running Your First Script")).toBeInTheDocument();
    const reloaded = readStoredProgress();
    expect(reloaded?.durableLessonMiniProjectIds ?? []).toContain(SAMPLE_LESSON_ID);
  });
});
