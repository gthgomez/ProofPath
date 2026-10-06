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
  renderLessonScreen,
  seedOnboardingComplete,
  seedStoredProgress
} from "./journey-helpers";

vi.mock("expo-router", () => import("./mocks/expo-router"));
vi.mock("@/sandbox/runner", () => import("./mocks/sandbox-runner"));
vi.mock("react-native-safe-area-context", () => import("./mocks/safe-area-context"));

const LESSON_ID = "lesson-python-zero-files-folders";

describe("persistence + reload", () => {
  beforeEach(() => {
    clearStoredProgress();
    seedOnboardingComplete();
    __setSandboxOutcome("pass");
  });

  it("restores Code Lab completion after a page reload", async () => {
    // First session: run the Code Lab check.
    const first = renderLessonScreen(LESSON_ID);
    await continueForward();
    await continueForward();
    await clickRunChecks();
    expect(await screen.findAllByText("Add evidence now")).toHaveLength(2);

    // Simulate a full page reload: unmount everything and re-render the screen.
    // The ProgressProvider re-reads localStorage on mount.
    first.unmount();
    renderLessonScreen(LESSON_ID);

    // The Checkpoint tab is unlocked because the mini project completion was persisted.
    expect(screen.getByRole("button", { name: "Checkpoint step" })).toBeEnabled();

    // Navigate to the Code Lab — the passing run is restored from storage.
    await continueForward();
    await continueForward();
    expect(screen.getByText("Step 3 of 5: CODE LAB")).toBeInTheDocument();
    expect(await screen.findAllByText("Check passed")).toHaveLength(2);
  });

  it("restores quiz completion after a page reload", async () => {
    // Seed the mini project as done so Checkpoint is unlocked.
    seedStoredProgress({ durableLessonMiniProjectIds: [LESSON_ID] });

    // First session: answer and submit the quiz.
    const first = renderLessonScreen(LESSON_ID);
    fireEvent.click(screen.getByRole("button", { name: "Checkpoint step" }));

    const quiz = getQuizForLesson(LESSON_ID);
    await answerQuiz(quiz);
    fireEvent.click(getQuizSubmitButton());
    expect(await screen.findByText("Checkpoint passed", { selector: "h1" })).toBeInTheDocument();

    // Reload: unmount and re-render.
    first.unmount();
    renderLessonScreen(LESSON_ID);

    // The Evidence step is unlocked because the quiz pass was persisted.
    expect(screen.getByRole("button", { name: "Evidence step" })).toBeEnabled();

    // The stored progress contains the quiz attempt.
    const reloaded = readStoredProgress();
    expect(reloaded?.completedQuizIds).toContain(quiz.id);
    expect(reloaded?.quizAttempts.some((attempt) => attempt.quizId === quiz.id && attempt.passed)).toBe(true);
  });

  it("restores full lesson completion after a page reload", async () => {
    // First session: complete both the Code Lab and the quiz.
    const first = renderLessonScreen(LESSON_ID);
    await continueForward();
    await continueForward();
    await clickRunChecks();

    fireEvent.click(screen.getByRole("button", { name: "Take checkpoint" }));
    const quiz = getQuizForLesson(LESSON_ID);
    await answerQuiz(quiz);
    fireEvent.click(getQuizSubmitButton());
    expect(await screen.findByText("Checkpoint passed", { selector: "h1" })).toBeInTheDocument();

    // Reload.
    first.unmount();
    renderLessonScreen(LESSON_ID);

    // The lesson is marked complete and the Evidence step is unlocked.
    expect(screen.getByRole("button", { name: "Evidence step" })).toBeEnabled();

    // Navigate to Evidence — the "Next lesson" CTA is available.
    fireEvent.click(screen.getByRole("button", { name: "Evidence step" }));
    expect(screen.getByText("Step 5 of 5: EVIDENCE")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Next lesson" })).toBeInTheDocument();

    const reloaded = readStoredProgress();
    expect(reloaded?.completedLessonIds).toContain(LESSON_ID);
  });
});
