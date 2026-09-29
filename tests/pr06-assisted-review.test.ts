import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import {
  createInitialProgress,
  recordCodeRunAttempt,
  recordReview,
  reconcileDerivedProgress,
  submitQuizAttempt
} from "@/domain/progress";
import { getReviewCards } from "@/domain/review-queue";
import { reviewVariantKey } from "@/domain/review";
import { normalizeCodeRunAttempt } from "@/domain/code-run";
import type { Lesson, Quiz, UserProgress } from "@/domain/types";

const NOW = "2026-09-28T12:00:00.000Z";

function lessonById(lessonId: string): Lesson {
  const lesson = contentPack.lessons.find((item) => item.id === lessonId);
  expect(lesson, `missing lesson ${lessonId}`).toBeDefined();
  return lesson!;
}

function passingQuizChoices(quiz: Quiz): number[] {
  return quiz.questions.map((question) => question.correctChoiceIndex);
}

function runAttempt(progress: UserProgress, lessonId: string) {
  const lesson = lessonById(lessonId);
  return normalizeCodeRunAttempt({
    id: `run-${lessonId}-${progress.codeRunAttempts.length}`,
    lessonId,
    language: lesson.workshop.miniProject.runnerSpec.language,
    codeSnapshot: lesson.workshop.miniProject.runnerSpec.starterCode,
    stdout: lesson.workshop.miniProject.runnerSpec.expectedOutput.join("\n"),
    stderr: "",
    passed: true,
    score: 100,
    runtimeMs: 10,
    testResults: [],
    hiddenCheckSummary: { total: 0, passed: 0, failed: 0 },
    diagnostics: [],
    terminalTranscript: [],
    createdAt: NOW
  });
}

function progressWithFirstLesson(progress: UserProgress = createInitialProgress(NOW)): { progress: UserProgress; lesson: Lesson; quiz: Quiz } {
  const lesson = contentPack.lessons[0];
  const quiz = contentPack.quizzes.find((item) => item.id === lesson.quizId)!;
  let updated = recordCodeRunAttempt(progress, runAttempt(progress, lesson.id), NOW);
  updated = submitQuizAttempt(updated, quiz, passingQuizChoices(quiz), NOW);
  updated = reconcileDerivedProgress(contentPack, updated, NOW);
  return { progress: updated, lesson, quiz };
}

describe("PR06: assistance-aware review queue", () => {
  it("records assistance context on a review event when the hint was revealed", () => {
    const { progress, lesson } = progressWithFirstLesson();

    const unassisted = recordReview(progress, "lesson", lesson.id, "good", NOW);
    const assisted = recordReview(progress, "lesson", lesson.id, "good", NOW, { assisted: true });

    expect(unassisted.reviewEvents[0]?.assisted).toBeUndefined();
    expect(assisted.reviewEvents[0]?.assisted).toBe(true);
  });

  it("variant selection is deterministic and rotates with repetitions, pinning repair after lapses", () => {
    const { progress, lesson } = progressWithFirstLesson();

    const first = recordReview(progress, "lesson", lesson.id, "good", NOW);
    const second = recordReview(first, "lesson", lesson.id, "good", NOW);

    const item = second.reviewItems.find((candidate) => candidate.targetType === "lesson" && candidate.targetId === lesson.id)!;
    expect(reviewVariantKey({ ...item, repetitions: 0, lapses: 0 })).toBe(`lesson:${lesson.id}:v0`);
    expect(reviewVariantKey({ ...item, repetitions: 1, lapses: 0 })).toBe(`lesson:${lesson.id}:v1`);
    expect(reviewVariantKey({ ...item, repetitions: 3, lapses: 1 })).toBe(`lesson:${lesson.id}:repair`);

    // The same state always produces the same variant (no randomness).
    expect(reviewVariantKey(item)).toBe(reviewVariantKey(item));
  });

  it("a lapsed review presents the debug/repair card, and rotation changes the delayed variant", () => {
    const { progress, lesson } = progressWithFirstLesson();

    const lapsed = recordReview(progress, "lesson", lesson.id, "again", NOW);
    const lapsedItem = lapsed.reviewItems.find((candidate) => candidate.targetType === "lesson" && candidate.targetId === lesson.id)!;
    const lapsedCards = getReviewCards(contentPack, lapsed, NOW);
    const lapsedCard = lapsedCards.find((card) => card.item.targetId === lesson.id)!;

    expect(lapsedItem.lapses).toBeGreaterThan(0);
    expect(lapsedCard.recallPrompt).toContain("mistake");

    const rotated = getReviewCards(contentPack, { ...progress, reviewItems: [ { ...progress.reviewItems.find((c) => c.targetType === "lesson" && c.targetId === lesson.id)!, repetitions: 1, lapses: 0 } ] }, NOW);
    const rotatedCard = rotated.find((card) => card.item.targetId === lesson.id)!;
    const firstCard = getReviewCards(contentPack, progress, NOW).find((card) => card.item.targetId === lesson.id)!;
    expect(rotatedCard.recallPrompt).not.toBe(firstCard.recallPrompt);
  });

  it("missing a review (rating again) never deletes earned achievement", () => {
    const { progress, lesson, quiz } = progressWithFirstLesson();

    const afterMiss = reconcileDerivedProgress(contentPack, recordReview(progress, "lesson", lesson.id, "again", NOW), NOW);

    expect(afterMiss.completedLessonIds).toContain(lesson.id);
    expect(afterMiss.completedQuizIds).toContain(quiz.id);
    expect(afterMiss.durableQuizIds).toContain(quiz.id);
  });
});
