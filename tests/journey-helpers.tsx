import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { expect } from "vitest";
import type { ReactElement } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LessonDetailScreen from "../app/lesson/[lessonId]";
import EvidenceLogScreen from "../app/evidence";
import { contentPack } from "@/content/seed";
import { findLesson } from "@/domain/content";
import { ProgressProvider } from "@/state/progress-provider";
import type { Quiz, UserProgress } from "@/domain/types";
import { __setParams } from "./mocks/expo-router";

export const WEB_PROGRESS_KEY = "proofpath.progress.v1";

const ONBOARDED_PROFILE = {
  profile: {
    onboardingCompletedAt: "2026-01-01T00:00:00.000Z"
  }
};

/** Write a localStorage entry so the onboarding gate lets screens render. */
export function seedOnboardingComplete(): void {
  window.localStorage.setItem(WEB_PROGRESS_KEY, JSON.stringify(ONBOARDED_PROFILE));
}

/** Replace the stored progress with an arbitrary partial (e.g. pre-completed steps). */
export function seedStoredProgress(partial: Partial<UserProgress>): void {
  window.localStorage.setItem(WEB_PROGRESS_KEY, JSON.stringify({
    ...ONBOARDED_PROFILE,
    ...partial
  }));
}

export function clearStoredProgress(): void {
  window.localStorage.removeItem(WEB_PROGRESS_KEY);
}

export function readStoredProgress(): UserProgress | null {
  const stored = window.localStorage.getItem(WEB_PROGRESS_KEY);
  if (!stored) {
    return null;
  }
  try {
    return JSON.parse(stored) as UserProgress;
  } catch {
    return null;
  }
}

function renderWithProviders(node: ReactElement) {
  return render(
    <SafeAreaProvider>
      <ProgressProvider>
        {node}
      </ProgressProvider>
    </SafeAreaProvider>
  );
}

/** Render the lesson screen for a lesson id with onboarding already complete. */
export function renderLessonScreen(lessonId: string) {
  __setParams({ lessonId });
  const lesson = findLesson(contentPack, lessonId);
  if (!lesson) {
    throw new Error(`Unknown lesson id: ${lessonId}`);
  }
  return { lesson, ...renderWithProviders(<LessonDetailScreen />) };
}

/** Render the evidence screen with the given route params. */
export function renderEvidenceScreen(params: Record<string, string> = {}) {
  __setParams(params);
  return renderWithProviders(<EvidenceLogScreen />);
}

export function getQuizForLesson(lessonId: string): Quiz {
  const lesson = findLesson(contentPack, lessonId);
  if (!lesson) {
    throw new Error(`Unknown lesson id: ${lessonId}`);
  }
  const quiz = contentPack.quizzes.find((candidate) => candidate.id === lesson.quizId);
  if (!quiz) {
    throw new Error(`Lesson ${lessonId} has no quiz`);
  }
  return quiz;
}

/**
 * Click a choice for every question in a quiz. Choice buttons are scoped to
 * their question block via the "Question N/M" badge so identical choice text
 * in different questions cannot collide. `mode: "correct"` clicks the marked
 * correct choice; `mode: "wrong"` clicks an incorrect one.
 */
export async function answerQuiz(quiz: Quiz, mode: "correct" | "wrong" = "correct"): Promise<void> {
  for (let index = 0; index < quiz.questions.length; index += 1) {
    const question = quiz.questions[index];
    const choiceIndex = mode === "correct"
      ? question.correctChoiceIndex
      : (question.correctChoiceIndex + 1) % question.choices.length;
    // Async query: the Checkpoint step renders its quiz after the step
    // transition, so a synchronous `getByText` here can run before the
    // question block exists and fail spuriously.
    const badge = await screen.findByText(`Question ${index + 1}/${quiz.questions.length}`);
    // Text → Badge View → Row → question block View
    const questionBlock = badge.parentElement?.parentElement?.parentElement;
    if (!questionBlock) {
      throw new Error(`Could not locate question block for question ${index + 1}`);
    }
    const choiceButton = within(questionBlock as HTMLElement).getByRole("button", {
      name: question.choices[choiceIndex]
    });
    fireEvent.click(choiceButton);
  }
}

/**
 * Wait for a Code Lab run to finish. The run-state badge (src/ui/code-lab.tsx)
 * reads "Running file" / "Running checks" while `isRunning` is true and flips
 * to a settled state ("File ran", "Check passed", "Needs attention", or back
 * to "Ready to run") once the attempt has been recorded.
 *
 * Waiting on the button being enabled is not sufficient: the button is already
 * enabled at click time, so such a wait resolves immediately and races ahead of
 * the run.
 */
async function waitForRunToSettle(mode: "file" | "checks"): Promise<void> {
  const runningLabel = new RegExp(`^Running ${mode}$`);
  // Two elements carry this label while a run is in flight: the run-state
  // badge and the trigger button itself, so query by "all", not "the".
  //
  // Phase 1: the run has started. `fireEvent` flushes React state inside
  // `act`, so this holds on the first tick — but asserting it keeps the wait
  // honest if that ever changes, instead of passing through a state that
  // never happened.
  await waitFor(() => expect(screen.getAllByText(runningLabel).length).toBeGreaterThan(0));
  // Phase 2: the run has finished and the attempt has been recorded.
  await waitFor(() => expect(screen.queryAllByText(runningLabel)).toHaveLength(0));
}

/** Click the Code Lab "Run file" button and wait for the run to settle. */
export async function clickRunFile(): Promise<void> {
  fireEvent.click(screen.getByRole("button", { name: "Run file" }));
  await waitForRunToSettle("file");
}

/** Click the Code Lab "Run checks" button and wait for the run to settle. */
export async function clickRunChecks(): Promise<void> {
  fireEvent.click(screen.getByRole("button", { name: /^Run checks( again)?$/ }));
  await waitForRunToSettle("checks");
}

/** Navigate the stepper forward via the in-content "Continue … →" buttons. */
export async function continueForward(): Promise<void> {
  const button = await screen.findByRole("button", { name: /Continue to .* →/ });
  fireEvent.click(button);
}

/** Open a stepper tab by its accessible name (e.g. "Checkpoint step"). */
export function clickStepperTab(stepLabel: string): void {
  fireEvent.click(screen.getByRole("button", { name: `${stepLabel} step` }));
}

/**
 * The quiz submit button shares its name with the sticky CTA ("Submit
 * checkpoint"). Return the in-content quiz button by excluding the one
 * rendered inside the persistent action bar.
 */
export function getQuizSubmitButton(): HTMLElement {
  const buttons = screen.getAllByRole("button", { name: "Submit checkpoint" });
  const quizButton = buttons.find((button) => !button.closest('[aria-label="Persistent lesson action"]'));
  if (!quizButton) {
    throw new Error("Quiz submit button not found");
  }
  return quizButton;
}
