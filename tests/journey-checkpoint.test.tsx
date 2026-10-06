// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import {
  answerQuiz,
  clearStoredProgress,
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

/**
 * Seed progress with the Code Lab already complete so Checkpoint is unlocked.
 * `reconcileDerivedProgress` derives mini-project completion from durable ids
 * and run history, so the durable set is the seed that survives a reload.
 */
function seedMiniProjectDone() {
  seedStoredProgress({ durableLessonMiniProjectIds: [LESSON_ID] });
}

describe("checkpoint quiz journey", () => {
  beforeEach(() => {
    clearStoredProgress();
    seedOnboardingComplete();
    seedMiniProjectDone();
  });

  it("submits correct answers and records a passing quiz attempt", async () => {
    renderLessonScreen(LESSON_ID);

    // The Checkpoint tab is unlocked because the mini project is complete.
    fireEvent.click(screen.getByRole("button", { name: "Checkpoint step" }));
    expect(screen.getByText("Step 4 of 5: CHECKPOINT")).toBeInTheDocument();

    const quiz = getQuizForLesson(LESSON_ID);
    expect(screen.getByText(`After coding: ${quiz.title}`)).toBeInTheDocument();

    // Submit stays disabled until every question is answered.
    expect(getQuizSubmitButton()).toBeDisabled();
    await answerQuiz(quiz);
    expect(getQuizSubmitButton()).toBeEnabled();
    fireEvent.click(getQuizSubmitButton());

    expect(await screen.findByText("Checkpoint passed", { selector: "h1" })).toBeInTheDocument();

    const stored = readStoredProgress();
    expect(stored?.completedQuizIds).toContain(quiz.id);
    const attempt = stored?.quizAttempts.find((candidate) => candidate.quizId === quiz.id);
    expect(attempt?.passed).toBe(true);
    expect(attempt?.score).toBe(100);
  });

  it("records a failing attempt when answers are wrong", async () => {
    renderLessonScreen(LESSON_ID);
    fireEvent.click(screen.getByRole("button", { name: "Checkpoint step" }));

    const quiz = getQuizForLesson(LESSON_ID);
    await answerQuiz(quiz, "wrong");
    fireEvent.click(getQuizSubmitButton());

    expect(await screen.findByText("Checkpoint needs review")).toBeInTheDocument();

    const stored = readStoredProgress();
    expect(stored?.completedQuizIds ?? []).not.toContain(quiz.id);
    const attempt = stored?.quizAttempts.find((candidate) => candidate.quizId === quiz.id);
    expect(attempt?.passed).toBe(false);
    expect(attempt?.score).toBe(0);
  });

  it("keeps the Evidence step locked until the quiz passes", async () => {
    renderLessonScreen(LESSON_ID);

    expect(screen.getByRole("button", { name: "Evidence step" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Checkpoint step" }));
    const quiz = getQuizForLesson(LESSON_ID);
    await answerQuiz(quiz);
    fireEvent.click(getQuizSubmitButton());

    expect(await screen.findByText("Checkpoint passed", { selector: "h1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Evidence step" })).toBeEnabled();
  });
});
