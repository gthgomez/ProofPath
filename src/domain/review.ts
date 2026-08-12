import type { ContentPack, ReviewEvent, ReviewItem, ReviewRating, ReviewTargetType, UserProgress } from "./types";

const REVIEW_INTERVALS = [1, 3, 7, 14, 30];
const DEFAULT_EASE_FACTOR = 2.5;

export function reviewKey(targetType: ReviewTargetType, targetId: string): string {
  return `${targetType}:${targetId}`;
}

export function addDaysIso(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

export function createReviewItem(targetType: ReviewTargetType, targetId: string, now = new Date().toISOString()): ReviewItem {
  return {
    targetType,
    targetId,
    dueAt: addDaysIso(now, REVIEW_INTERVALS[0] ?? 1),
    intervalDays: REVIEW_INTERVALS[0] ?? 1,
    repetitions: 0,
    easeFactor: DEFAULT_EASE_FACTOR,
    lapses: 0
  };
}

export function upsertReviewItem(items: ReviewItem[], targetType: ReviewTargetType, targetId: string, now = new Date().toISOString()): ReviewItem[] {
  const key = reviewKey(targetType, targetId);

  if (items.some((item) => reviewKey(item.targetType, item.targetId) === key)) {
    return items;
  }

  return [...items, createReviewItem(targetType, targetId, now)];
}

export function removeReviewItem(items: ReviewItem[], targetType: ReviewTargetType, targetId: string): ReviewItem[] {
  const key = reviewKey(targetType, targetId);
  return items.filter((item) => reviewKey(item.targetType, item.targetId) !== key);
}

function qualityForRating(rating: ReviewRating): number {
  switch (rating) {
    case "again":
      return 2;
    case "hard":
      return 3;
    case "good":
      return 4;
    case "easy":
      return 5;
  }
}

function intervalForReview(rating: ReviewRating, repetitions: number): number {
  if (rating === "again") {
    return 1;
  }

  const index = Math.min(repetitions - 1 + (rating === "easy" ? 1 : 0), REVIEW_INTERVALS.length - 1);
  const baseInterval = REVIEW_INTERVALS[Math.max(0, index)] ?? 1;

  if (rating === "hard") {
    return Math.max(1, Math.floor(baseInterval / 2));
  }

  return baseInterval;
}

export function advanceReviewItem(item: ReviewItem, rating: ReviewRating, now = new Date().toISOString()): ReviewItem {
  const quality = qualityForRating(rating);
  const nextEaseFactor = Math.max(
    1.3,
    item.easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );
  const repetitions = quality < 3 ? 0 : item.repetitions + 1;
  const intervalDays = intervalForReview(rating, repetitions);

  return {
    ...item,
    dueAt: addDaysIso(now, intervalDays),
    lastReviewedAt: now,
    intervalDays,
    repetitions,
    easeFactor: nextEaseFactor,
    lapses: rating === "again" ? item.lapses + 1 : item.lapses
  };
}

export function isReviewDue(item: ReviewItem, now = new Date().toISOString()): boolean {
  return Date.parse(item.dueAt) <= Date.parse(now);
}

export function recordReviewEvent(item: ReviewItem, rating: ReviewRating, now = new Date().toISOString()): ReviewEvent {
  return {
    id: `review-${now.replace(/[^0-9]/g, "")}-${reviewKey(item.targetType, item.targetId).replace(/[^a-z0-9]/gi, "-")}`,
    targetType: item.targetType,
    targetId: item.targetId,
    rating,
    reviewedAt: now,
    nextDueAt: item.dueAt,
    intervalDays: item.intervalDays
  };
}

export function getRelevantReviewEvents(content: ContentPack, progress: UserProgress): ReviewEvent[] {
  const targetIds = new Set([
    ...content.lessons.map((lesson) => reviewKey("lesson", lesson.id)),
    ...content.quizzes.map((quiz) => reviewKey("quiz", quiz.id)),
    ...content.projectMissions.map((mission) => reviewKey("mission", mission.id))
  ]);

  // Direct slice lesson refs (per python plan AC): explicit ids for integrated resilience/ops proofs surfaced for review scheduling beyond weekly/learning-path arcs.
  const pythonIntegrationSlices = ["lesson-python-resilience-slice1", "lesson-python-resilience-slice2", "lesson-python-ops-slice1"];
  pythonIntegrationSlices.forEach((sid) => targetIds.add(reviewKey("lesson", sid)));

  return progress.reviewEvents.filter((event) => targetIds.has(reviewKey(event.targetType, event.targetId)));
}
