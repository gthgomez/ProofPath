import { findLesson, findMission } from "./content";
import { isReviewDue } from "./review";
import type { ContentPack, ReviewItem, UserProgress } from "./types";

export interface ReviewCard {
  item: ReviewItem;
  title: string;
  subtitle: string;
  recallPrompt: string;
  answerHint?: string;
  repairPrompt: string;
  isDue: boolean;
}

function titleForItem(content: ContentPack, item: ReviewItem): string {
  if (item.targetType === "lesson") {
    return findLesson(content, item.targetId)?.title ?? item.targetId;
  }

  if (item.targetType === "quiz") {
    return content.quizzes.find((quiz) => quiz.id === item.targetId)?.title ?? item.targetId;
  }

  return findMission(content, item.targetId)?.title ?? item.targetId;
}

function subtitleForItem(item: ReviewItem): string {
  if (item.targetType === "lesson") {
    return "Lesson recall";
  }

  if (item.targetType === "quiz") {
    return "Checkpoint recall";
  }

  return "Mission recall";
}

function lessonRecallForItem(content: ContentPack, item: ReviewItem): Pick<ReviewCard, "recallPrompt" | "answerHint"> {
  const lesson = findLesson(content, item.targetId);
  const recallCards = lesson?.workshop.recallCards ?? [];

  if (recallCards.length === 0) {
    return { recallPrompt: "Recall the core idea and one desktop action before rereading the lesson." };
  }

  const debugCardIndex = recallCards.findIndex((card) => card.type === "debug");
  const fallbackIndex = item.repetitions % recallCards.length;
  const selectedCard = item.lapses > 0 && debugCardIndex >= 0
    ? recallCards[debugCardIndex]
    : recallCards[fallbackIndex] ?? recallCards[0];

  return {
    recallPrompt: selectedCard.prompt,
    answerHint: selectedCard.answerHint
  };
}

function recallPromptForItem(content: ContentPack, item: ReviewItem): Pick<ReviewCard, "recallPrompt" | "answerHint"> {
  if (item.targetType === "mission") {
    return { recallPrompt: "Name the mission output, check command, and remaining gap without opening the mission first." };
  }

  if (item.targetType === "quiz") {
    return { recallPrompt: "Explain why the correct answer is correct before checking the prompt again." };
  }

  return lessonRecallForItem(content, item);
}

function repairPromptForItem(content: ContentPack, item: ReviewItem): string {
  if (item.lapses === 0) {
    return "Repair task appears after an Again review.";
  }

  if (item.targetType !== "lesson") {
    return "Repair task: add evidence or notes for the part that failed recall.";
  }

  const lesson = findLesson(content, item.targetId);
  const misconception = lesson?.workshop.misconceptionChecks[0];

  return misconception
    ? `Repair task: ${misconception.checkPrompt}`
    : "Repair task: add evidence or notes for the part that failed recall.";
}

function isReviewTargetCompleted(progress: UserProgress, item: ReviewItem): boolean {
  if (item.targetType === "lesson") {
    return progress.completedLessonIds.includes(item.targetId);
  }

  if (item.targetType === "quiz") {
    return progress.completedQuizIds.includes(item.targetId);
  }

  return progress.completedProjectMissionIds.includes(item.targetId);
}

export function getReviewCards(content: ContentPack, progress: UserProgress, now = new Date().toISOString()): ReviewCard[] {
  const contentTargets = new Set([
    ...content.lessons.map((lesson) => `lesson:${lesson.id}`),
    ...content.quizzes.map((quiz) => `quiz:${quiz.id}`),
    ...content.projectMissions.map((mission) => `mission:${mission.id}`)
  ]);

  return progress.reviewItems
    .filter((item) => contentTargets.has(`${item.targetType}:${item.targetId}`))
    .filter((item) => isReviewTargetCompleted(progress, item))
    .map((item) => {
      const recall = recallPromptForItem(content, item);

      return {
        item,
        title: titleForItem(content, item),
        subtitle: subtitleForItem(item),
        recallPrompt: recall.recallPrompt,
        answerHint: recall.answerHint,
        repairPrompt: repairPromptForItem(content, item),
        isDue: isReviewDue(item, now)
      };
    })
    .sort((left, right) => Date.parse(left.item.dueAt) - Date.parse(right.item.dueAt));
}
