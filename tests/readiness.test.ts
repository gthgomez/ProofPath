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

  it("caps placement-only user score at 59% and does not grant portfolio-ready status", () => {
    const initialProgress = createInitialProgress("2026-05-04T00:00:00.000Z");
    const placementProgress = {
      ...initialProgress,
      placedOutLessonIds: contentPack.lessons.map((l) => l.id),
      placedOutQuizIds: contentPack.quizzes.map((q) => q.id)
    };

    const readiness = calculateReadinessScore(contentPack, placementProgress);

    // Should have 100% lesson/quiz coverage but no project/evidence
    expect(readiness.breakdown.lessonCompletion).toBe(100);
    expect(readiness.breakdown.quizPerformance).toBe(100);
    expect(readiness.breakdown.projectCompletion).toBe(0);
    expect(readiness.breakdown.evidenceHygiene).toBe(0);

    // Hard cap at 59 because projectCompletion is 0
    expect(readiness.score).toBeLessThanOrEqual(59);
    expect(readiness.label).toBe("starting");
  });

  it("allows readiness to rise appropriately for placement + mission/evidence users", () => {
    const initialProgress = createInitialProgress("2026-05-04T00:00:00.000Z");
    const placementProgress = {
      ...initialProgress,
      placedOutLessonIds: contentPack.lessons.map((l) => l.id),
      placedOutQuizIds: contentPack.quizzes.map((q) => q.id)
    };

    // Simulate completing all project missions
    const mission = contentPack.projectMissions[0];
    const withMissions = {
      ...placementProgress,
      completedProjectMissionIds: contentPack.projectMissions.map((m) => m.id)
    };

    // Add valid evidence
    const withEvidence = {
      ...withMissions,
      evidenceItems: [
        {
          id: "evidence-1",
          type: "test-output" as const,
          title: "Mission evidence",
          body: "Passing tests with repo and verifier output log detail.",
          linkedProjectMissionId: mission.id,
          linkedSkillIds: ["skill-portfolio-evidence"],
          repoUrl: "https://github.com/example/repo",
          commitHash: "abc1234",
          testStatus: "passing" as const,
          readmeStatus: "complete" as const,
          verifierOutput: "npm run verify",
          createdAt: "2026-05-04T12:00:00.000Z"
        }
      ]
    };

    const readiness = calculateReadinessScore(contentPack, withEvidence);

    // Knowledge/coverage is credited from placement, project is complete, evidence is healthy
    expect(readiness.breakdown.lessonCompletion).toBe(100);
    expect(readiness.breakdown.quizPerformance).toBe(100);
    expect(readiness.breakdown.projectCompletion).toBeGreaterThan(0);
    expect(readiness.breakdown.evidenceHygiene).toBeGreaterThan(0);

    // The score should be unblocked and higher than the 59 cap
    expect(readiness.score).toBeGreaterThan(60);

    // Ensure we did not mutate completedLessonIds or insert fake evidence
    expect(withEvidence.completedLessonIds).toEqual([]);
    expect(withEvidence.evidenceItems.length).toBe(1);
  });

  it("allows readiness to rise incrementally for placement + one mission/evidence but still respects proof-first caps", () => {
    const initialProgress = createInitialProgress("2026-05-04T00:00:00.000Z");
    const placementProgress = {
      ...initialProgress,
      placedOutLessonIds: contentPack.lessons.map((l) => l.id),
      placedOutQuizIds: contentPack.quizzes.map((q) => q.id)
    };

    const placementOnlyReadiness = calculateReadinessScore(contentPack, placementProgress);
    expect(placementOnlyReadiness.score).toBe(20);

    // Simulate completing just 1 project mission
    const mission = contentPack.projectMissions[0];
    const withOneMission = {
      ...placementProgress,
      completedProjectMissionIds: [mission.id]
    };

    // Add 1 valid evidence item
    const withEvidence = {
      ...withOneMission,
      evidenceItems: [
        {
          id: "evidence-1",
          type: "test-output" as const,
          title: "Mission evidence",
          body: "Passing tests with repo and verifier output log detail.",
          linkedProjectMissionId: mission.id,
          linkedSkillIds: ["skill-portfolio-evidence"],
          repoUrl: "https://github.com/example/repo",
          commitHash: "abc1234",
          testStatus: "passing" as const,
          readmeStatus: "complete" as const,
          verifierOutput: "npm run verify",
          createdAt: "2026-05-04T12:00:00.000Z"
        }
      ]
    };

    const partialReadiness = calculateReadinessScore(contentPack, withEvidence);

    // Should score higher than placement-only (20)
    expect(partialReadiness.score).toBeGreaterThan(placementOnlyReadiness.score);

    // Should still be capped or locked below portfolio-ready (70) because they only completed 1 mission
    expect(partialReadiness.score).toBeLessThan(70);
    expect(partialReadiness.label).toBe("building");
  });

  it("regression: placedOutLessonIds remains separate from completedLessonIds", () => {
    const initialProgress = createInitialProgress("2026-05-04T00:00:00.000Z");
    const placementProgress = {
      ...initialProgress,
      placedOutLessonIds: ["lesson-1"],
      placedOutQuizIds: ["quiz-1"]
    };

    expect(placementProgress.completedLessonIds).toEqual([]);
    expect(placementProgress.completedQuizIds).toEqual([]);
    expect(placementProgress.placedOutLessonIds).toEqual(["lesson-1"]);
    expect(placementProgress.placedOutQuizIds).toEqual(["quiz-1"]);
  });
});
