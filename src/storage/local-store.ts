import { createInitialProgress } from "@/domain/progress";
import type { ProgressStore } from "./types";
import type { UserProgress } from "@/domain/types";

const STORAGE_KEY = "careerforge.progress.v1";

/**
 * ProgressStore backed by window.localStorage (web).
 *
 * Extracted from the inline storage logic that was previously
 * embedded in progress-provider.web.tsx.
 */
export class LocalStorageProgressStore implements ProgressStore {
  async load(): Promise<UserProgress> {
    if (typeof window === "undefined") {
      return createInitialProgress();
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return createInitialProgress();
    }

    return parseStoredProgress(stored);
  }

  async save(progress: UserProgress): Promise<void> {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    }
  }

  async reset(): Promise<UserProgress> {
    const initial = createInitialProgress();
    await this.save(initial);
    return initial;
  }
}

function parseStoredProgress(serialized: string): UserProgress {
  try {
    const parsed = JSON.parse(serialized) as Partial<UserProgress>;
    return mergeDefaults(parsed);
  } catch {
    return createInitialProgress();
  }
}

function mergeDefaults(stored: Partial<UserProgress>): UserProgress {
  const initial = createInitialProgress();
  return {
    ...initial,
    ...stored,
    profile: {
      ...initial.profile,
      ...stored.profile,
    },
    completedLessonIds: stored.completedLessonIds ?? [],
    completedLessonMiniProjectIds: stored.completedLessonMiniProjectIds ?? [],
    completedQuizIds: stored.completedQuizIds ?? [],
    placedOutLessonIds: stored.placedOutLessonIds ?? [],
    placedOutQuizIds: stored.placedOutQuizIds ?? [],
    completedProjectMissionIds: stored.completedProjectMissionIds ?? [],
    completedProjectMissionDeliverableIds: stored.completedProjectMissionDeliverableIds ?? [],
    completedProjectMissionPhaseIds: stored.completedProjectMissionPhaseIds ?? [],
    evidenceItems: stored.evidenceItems ?? [],
    quizAttempts: stored.quizAttempts ?? [],
    codeRunAttempts: stored.codeRunAttempts ?? [],
    weeklyPlanTaskIds: stored.weeklyPlanTaskIds ?? [],
    reviewItems: stored.reviewItems ?? [],
    reviewEvents: stored.reviewEvents ?? [],
    weeklyReports: stored.weeklyReports ?? [],
    updatedAt: stored.updatedAt ?? initial.updatedAt,
  };
}
