import { describe, expect, it } from "vitest";
import { ensureProgressProfile, createInitialProgress } from "@/domain/progress";

describe("progress migration", () => {
  const level0LessonIds = [
    "lesson-python-zero-files-folders",
    "lesson-python-zero-terminal",
    "lesson-python-zero-first-script",
    "lesson-python-zero-change-rerun",
    "lesson-python-zero-first-error"
  ];

  const level0QuizIds = [
    "quiz-python-zero-files-folders",
    "quiz-python-zero-terminal",
    "quiz-python-zero-first-script",
    "quiz-python-zero-change-rerun",
    "quiz-python-zero-first-error"
  ];

  const level1MicroLessonIds = [
    "lesson-python-literals",
    "lesson-python-assignment",
    "lesson-python-print-values",
    "lesson-python-numbers",
    "lesson-python-strings",
    "lesson-python-fstrings"
  ];

  const level1MicroQuizIds = [
    "quiz-python-literals",
    "quiz-python-assignment",
    "quiz-python-print-values",
    "quiz-python-numbers",
    "quiz-python-strings",
    "quiz-python-fstrings"
  ];

  const level3MicroLessonIds = [
    "lesson-python-why-functions",
    "lesson-python-def-call",
    "lesson-python-parameters",
    "lesson-python-return",
    "lesson-python-print-vs-return"
  ];

  const level3MicroQuizIds = [
    "quiz-python-why-functions",
    "quiz-python-def-call",
    "quiz-python-parameters",
    "quiz-python-return",
    "quiz-python-print-vs-return"
  ];

  const level4MicroLessonIds = [
    "lesson-python-read-traceback",
    "lesson-python-nameerror",
    "lesson-python-typeerror",
    "lesson-python-valueerror",
    "lesson-python-try-except"
  ];

  const level4MicroQuizIds = [
    "quiz-python-read-traceback",
    "quiz-python-nameerror",
    "quiz-python-typeerror",
    "quiz-python-valueerror",
    "quiz-python-try-except"
  ];

  // ---------------------------------------------------------------------------
  // Brand new learner baseline
  // ---------------------------------------------------------------------------

  it("does not place out any lessons for a brand new learner", () => {
    const rawProgress = createInitialProgress();
    const migrated = ensureProgressProfile(rawProgress);

    expect(migrated.placedOutLessonIds).toEqual([]);
    expect(migrated.placedOutQuizIds).toEqual([]);
  });

  // ---------------------------------------------------------------------------
  // lesson-python-values (old Level 0/1 anchor)
  // ---------------------------------------------------------------------------

  it("places out Level 0 and Level 1 micro-lessons for legacy learners who completed lesson-python-values", () => {
    const rawProgress = {
      ...createInitialProgress(),
      completedLessonIds: ["lesson-python-values"]
    };

    const migrated = ensureProgressProfile(rawProgress);
    const expectedLessons = [...level0LessonIds, ...level1MicroLessonIds];
    const expectedQuizzes = [...level0QuizIds, ...level1MicroQuizIds];

    for (const id of expectedLessons) {
      expect(migrated.placedOutLessonIds).toContain(id);
    }
    for (const id of expectedQuizzes) {
      expect(migrated.placedOutQuizIds).toContain(id);
    }
  });

  it("does not place out Level 3 or Level 4 micro-lessons when only lesson-python-values is completed", () => {
    const rawProgress = {
      ...createInitialProgress(),
      completedLessonIds: ["lesson-python-values"]
    };

    const migrated = ensureProgressProfile(rawProgress);

    for (const id of [...level3MicroLessonIds, ...level4MicroLessonIds]) {
      expect(migrated.placedOutLessonIds).not.toContain(id);
    }
  });

  // ---------------------------------------------------------------------------
  // lesson-python-functions (old Level 3 anchor)
  // ---------------------------------------------------------------------------

  it("places out all Level 3 micro-lessons for legacy learners who completed lesson-python-functions", () => {
    const rawProgress = {
      ...createInitialProgress(),
      completedLessonIds: ["lesson-python-functions"]
    };

    const migrated = ensureProgressProfile(rawProgress);

    for (const id of level3MicroLessonIds) {
      expect(migrated.placedOutLessonIds).toContain(id);
    }
    for (const id of level3MicroQuizIds) {
      expect(migrated.placedOutQuizIds).toContain(id);
    }
  });

  it("does not place out Level 0, 1, or 4 lessons when only lesson-python-functions is completed", () => {
    const rawProgress = {
      ...createInitialProgress(),
      completedLessonIds: ["lesson-python-functions"]
    };

    const migrated = ensureProgressProfile(rawProgress);

    for (const id of [...level0LessonIds, ...level1MicroLessonIds, ...level4MicroLessonIds]) {
      expect(migrated.placedOutLessonIds).not.toContain(id);
    }
  });

  // ---------------------------------------------------------------------------
  // lesson-python-traceback-clinic (old Level 4 anchor)
  // ---------------------------------------------------------------------------

  it("places out all Level 4 micro-lessons for legacy learners who completed lesson-python-traceback-clinic", () => {
    const rawProgress = {
      ...createInitialProgress(),
      completedLessonIds: ["lesson-python-traceback-clinic"]
    };

    const migrated = ensureProgressProfile(rawProgress);

    for (const id of level4MicroLessonIds) {
      expect(migrated.placedOutLessonIds).toContain(id);
    }
    for (const id of level4MicroQuizIds) {
      expect(migrated.placedOutQuizIds).toContain(id);
    }
  });

  it("does not place out Level 0, 1, or 3 lessons when only lesson-python-traceback-clinic is completed", () => {
    const rawProgress = {
      ...createInitialProgress(),
      completedLessonIds: ["lesson-python-traceback-clinic"]
    };

    const migrated = ensureProgressProfile(rawProgress);

    for (const id of [...level0LessonIds, ...level1MicroLessonIds, ...level3MicroLessonIds]) {
      expect(migrated.placedOutLessonIds).not.toContain(id);
    }
  });

  // ---------------------------------------------------------------------------
  // Full legacy learner (all three old lessons completed)
  // ---------------------------------------------------------------------------

  it("places out all micro-lessons for a learner who completed all three deprecated lessons", () => {
    const rawProgress = {
      ...createInitialProgress(),
      completedLessonIds: ["lesson-python-values", "lesson-python-functions", "lesson-python-traceback-clinic"]
    };

    const migrated = ensureProgressProfile(rawProgress);
    const allExpected = [
      ...level0LessonIds,
      ...level1MicroLessonIds,
      ...level3MicroLessonIds,
      ...level4MicroLessonIds
    ];

    for (const id of allExpected) {
      expect(migrated.placedOutLessonIds).toContain(id);
    }
  });

  // ---------------------------------------------------------------------------
  // Idempotency and correctness invariants
  // ---------------------------------------------------------------------------

  it("is idempotent — running twice produces the same result", () => {
    const rawProgress = {
      ...createInitialProgress(),
      completedLessonIds: ["lesson-python-values", "lesson-python-functions", "lesson-python-traceback-clinic"]
    };

    const firstRun = ensureProgressProfile(rawProgress);
    const secondRun = ensureProgressProfile(firstRun);

    expect(secondRun.placedOutLessonIds.sort()).toEqual(firstRun.placedOutLessonIds.sort());
    expect(secondRun.placedOutQuizIds.sort()).toEqual(firstRun.placedOutQuizIds.sort());
  });

  it("does not create evidence artifacts during migration", () => {
    const rawProgress = {
      ...createInitialProgress(),
      completedLessonIds: ["lesson-python-values", "lesson-python-functions", "lesson-python-traceback-clinic"]
    };

    const migrated = ensureProgressProfile(rawProgress);

    expect(migrated.evidenceItems).toEqual([]);
  });

  it("does not auto-complete local missions during migration", () => {
    const rawProgress = {
      ...createInitialProgress(),
      completedLessonIds: ["lesson-python-values", "lesson-python-functions", "lesson-python-traceback-clinic"]
    };

    const migrated = ensureProgressProfile(rawProgress);

    expect(migrated.completedProjectMissionIds).toEqual([]);
    expect(migrated.completedProjectMissionDeliverableIds).toEqual([]);
  });

  it("does not place out Git/GitHub lessons even for a fully-migrated learner", () => {
    const rawProgress = {
      ...createInitialProgress(),
      completedLessonIds: ["lesson-python-values", "lesson-python-functions", "lesson-python-traceback-clinic"]
    };

    const migrated = ensureProgressProfile(rawProgress);

    expect(migrated.placedOutLessonIds.some(id => id.includes("git"))).toBe(false);
    expect(migrated.placedOutQuizIds.some(id => id.includes("git"))).toBe(false);
  });
});
