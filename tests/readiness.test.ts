import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { demoProgress } from "@/content/progress";
import { createInitialProgress } from "@/domain/progress";
import { calculateReadinessScore } from "@/domain/readiness";

describe("calculateReadinessScore", () => {
  it("returns a bounded explainable score", () => {
    const readiness = calculateReadinessScore(contentPack, demoProgress);

    expect(readiness.score).toBeGreaterThanOrEqual(0);
    expect(readiness.score).toBeLessThanOrEqual(100);
    expect(readiness.breakdown.lessonCompletion).toBeGreaterThan(0);
  });

  it("keeps empty progress at the starting label", () => {
    const readiness = calculateReadinessScore(contentPack, createInitialProgress("2026-05-04T00:00:00.000Z"));

    expect(readiness.score).toBe(0);
    expect(readiness.label).toBe("starting");
  });

  it("does not label tap-only progress portfolio-ready without evidence", () => {
    const tapOnlyProgress = {
      ...createInitialProgress("2026-05-04T00:00:00.000Z"),
      completedLessonIds: contentPack.lessons.map((lesson) => lesson.id),
      completedQuizIds: contentPack.quizzes.map((quiz) => quiz.id),
      completedProjectMissionIds: contentPack.projectMissions.map((mission) => mission.id),
      reviewEvents: contentPack.lessons.map((lesson, index) => ({
        id: `review-${lesson.id}`,
        targetType: "lesson" as const,
        targetId: lesson.id,
        rating: "easy" as const,
        reviewedAt: `2026-05-04T00:0${index}:00.000Z`,
        nextDueAt: "2026-05-10T00:00:00.000Z",
        intervalDays: 6
      }))
    };
    const readiness = calculateReadinessScore(contentPack, tapOnlyProgress);

    expect(readiness.breakdown.evidenceHygiene).toBe(0);
    expect(readiness.score).toBeLessThan(70);
    expect(readiness.label).not.toBe("portfolio-ready");
  });
});
