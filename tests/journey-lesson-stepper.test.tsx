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
  renderLessonScreen,
  seedOnboardingComplete
} from "./journey-helpers";

vi.mock("expo-router", () => import("./mocks/expo-router"));
vi.mock("@/sandbox/runner", () => import("./mocks/sandbox-runner"));
vi.mock("react-native-safe-area-context", () => import("./mocks/safe-area-context"));

const LESSON_ID = "lesson-python-zero-files-folders";

describe("lesson stepper journey", () => {
  beforeEach(() => {
    clearStoredProgress();
    seedOnboardingComplete();
    __setSandboxOutcome("pass");
  });

  it("walks the full five-step workflow from Understand to Evidence", { timeout: 20000 }, async () => {
    renderLessonScreen(LESSON_ID);

    // Step 1: Understand — later steps are locked until prerequisites complete.
    expect(screen.getByText("Step 1 of 5: UNDERSTAND")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Understand step" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Checkpoint step" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Evidence step" })).toBeDisabled();

    // Step 2: Experiment (practice).
    await continueForward();
    expect(screen.getByText("Step 2 of 5: EXPERIMENT")).toBeInTheDocument();

    // Step 3: Apply (Code Lab). Checkpoint stays locked until the check passes.
    await continueForward();
    expect(screen.getByText("Step 3 of 5: CODE LAB")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Checkpoint step" })).toBeDisabled();

    // Run the Code Lab check (sandbox test double passes).
    await clickRunChecks();
    expect(await screen.findAllByText("Add evidence now")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Take checkpoint" })).toBeEnabled();

    // Step 4: Checkpoint — answer the quiz and submit.
    fireEvent.click(screen.getByRole("button", { name: "Take checkpoint" }));
    expect(screen.getByText("Step 4 of 5: CHECKPOINT")).toBeInTheDocument();

    const quiz = getQuizForLesson(LESSON_ID);
    expect(getQuizSubmitButton()).toBeDisabled();
    await answerQuiz(quiz);
    const submitButton = getQuizSubmitButton();
    expect(submitButton).toBeEnabled();
    fireEvent.click(submitButton);

    expect(await screen.findByText("Checkpoint passed", { selector: "h1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save evidence" })).toBeEnabled();

    // Step 5: Evidence — the lesson is complete, so the CTA offers the next lesson.
    fireEvent.click(screen.getByRole("button", { name: "Save evidence" }));
    expect(screen.getByText("Step 5 of 5: EVIDENCE")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Next lesson" })).toBeInTheDocument();
  });

  it("unlocks the Checkpoint stepper tab only after the Code Lab check passes", async () => {
    renderLessonScreen(LESSON_ID);

    expect(screen.getByRole("button", { name: "Checkpoint step" })).toBeDisabled();

    await continueForward();
    await continueForward();
    await clickRunChecks();

    expect(await screen.findAllByText("Add evidence now")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Checkpoint step" })).toBeEnabled();
  });
});
