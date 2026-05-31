import { findLesson, findMission } from "./content";
import { isReviewDue } from "./review";
import type { ContentPack, ReviewItem, UserProgress } from "./types";

export interface ReviewCard {
  item: ReviewItem;
  title: string;
  subtitle: string;
  recallPrompt: string;
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

  return "Mission proof recall";
}

function recallPromptForItem(item: ReviewItem): string {
  if (item.targetType === "mission") {
    return "Name the artifact, verifier command, and remaining gap without opening the mission first.";
  }

  if (item.targetType === "quiz") {
    return "Explain why the correct answer is correct before checking the prompt again.";
  }

  return "Recall the core idea and one desktop action before rereading the lesson.";
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
    .map((item) => ({
      item,
      title: titleForItem(content, item),
      subtitle: subtitleForItem(item),
      recallPrompt: recallPromptForItem(item),
      repairPrompt: item.lapses > 0 ? "Repair task: add evidence or notes for the part that failed recall." : "Repair task appears after an Again review.",
      isDue: isReviewDue(item, now)
    }))
    .sort((left, right) => Date.parse(left.item.dueAt) - Date.parse(right.item.dueAt));
}
