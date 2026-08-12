import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { createInitialProgress, recordReview, setLessonCompletion, setRoleTarget } from "@/domain/progress";
import { calculateReadinessScore } from "@/domain/readiness";
import { createReviewItem } from "@/domain/review";
import { getContentForRole } from "@/domain/role-routing";
import { getReviewCards } from "@/domain/review-queue";

const NOW = "2026-05-04T17:00:00.000Z";

describe("review queue", () => {
  it("schedules completed lessons into the role-scoped queue", () => {
    const progress = setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
    const withLesson = setLessonCompletion(progress, "lesson-python-def-call", true, NOW);
    const roleContent = getContentForRole(contentPack, withLesson.profile.roleTargetId);
    const cards = getReviewCards(roleContent, withLesson, "2026-05-05T17:00:00.000Z");

    expect(cards).toHaveLength(1);
    expect(cards[0]?.title).toBe("Define and Call a Function");
    expect(cards[0]?.isDue).toBe(true);
    expect(cards[0]?.recallPrompt.toLowerCase()).toContain("without opening the lesson");
    expect(cards[0]?.answerHint).toContain("def name()");
  });

  it("hides stale persisted review items when the target is no longer completed", () => {
    const progress = {
      ...setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW),
      reviewItems: [createReviewItem("lesson", "lesson-python-def-call", NOW)]
    };
    const roleContent = getContentForRole(contentPack, progress.profile.roleTargetId);

    expect(getReviewCards(roleContent, progress, "2026-05-05T17:00:00.000Z")).toEqual([]);
  });

  it("advances successful recall and creates repair work after again", () => {
    const progress = setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
    const withLesson = setLessonCompletion(progress, "lesson-python-def-call", true, NOW);
    const reviewed = recordReview(withLesson, "lesson", "lesson-python-def-call", "good", "2026-05-05T17:00:00.000Z");
    const repeated = recordReview(reviewed, "lesson", "lesson-python-def-call", "again", "2026-05-06T17:00:00.000Z");
    const roleContent = getContentForRole(contentPack, repeated.profile.roleTargetId);
    const [card] = getReviewCards(roleContent, repeated, "2026-05-07T17:00:00.000Z");

    expect(reviewed.reviewItems[0]?.repetitions).toBe(1);
    expect(repeated.reviewItems[0]?.lapses).toBe(1);
    expect(card?.repairPrompt).toContain("Repair task");
    expect(card?.recallPrompt).toContain("Name one mistake");
    expect(card?.isDue).toBe(true);
  });

  it("rewards successful current recall more than repeated again events", () => {
    const progress = setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
    const withLesson = setLessonCompletion(progress, "lesson-python-def-call", true, NOW);
    const again = recordReview(withLesson, "lesson", "lesson-python-def-call", "again", "2026-05-05T17:00:00.000Z");
    const good = recordReview(withLesson, "lesson", "lesson-python-def-call", "good", "2026-05-05T17:00:00.000Z");
    const staleGood = recordReview(withLesson, "lesson", "lesson-python-def-call", "good", "2026-05-05T17:00:00.000Z");
    const roleContent = getContentForRole(contentPack, progress.profile.roleTargetId);

    expect(calculateReadinessScore(roleContent, again, "2026-05-05T18:00:00.000Z").breakdown.reviewCadence).toBe(0);
    expect(calculateReadinessScore(roleContent, good, "2026-05-06T16:00:00.000Z").breakdown.reviewCadence).toBeGreaterThan(0);
    expect(calculateReadinessScore(roleContent, staleGood, "2026-05-08T17:00:00.000Z").breakdown.reviewCadence).toBe(0);
  });
});
