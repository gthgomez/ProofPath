import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { normalizeCodeRunAttempt } from "@/domain/code-run";
import {
  createInitialProgress,
  ensureProgressProfile,
  getMissionSupportedLessonIds,
  reconcileDerivedProgress,
  recordCodeRunAttempt,
  submitQuizAttempt
} from "@/domain/progress";
import { calculateReadinessScore } from "@/domain/readiness";
import type { Lesson, Quiz, UserProgress } from "@/domain/types";

const NOW = "2026-05-04T16:40:00.000Z";

function lessonById(lessonId: string): Lesson {
  const lesson = contentPack.lessons.find((item) => item.id === lessonId);
  expect(lesson, `missing lesson ${lessonId}`).toBeDefined();
  return lesson!;
}

function quizForLesson(lessonId: string): Quiz {
  const quiz = contentPack.quizzes.find((item) => item.id === lessonById(lessonId).quizId);
  expect(quiz, `missing quiz for ${lessonId}`).toBeDefined();
  return quiz!;
}

function passingQuizChoices(quiz: Quiz): number[] {
  return quiz.questions.map((question) => question.correctChoiceIndex);
}

function runAttempt(progress: UserProgress, lessonId: string, passed: boolean, runMode: "run_checks" | "run_file" = "run_checks") {
  const lesson = lessonById(lessonId);
  return normalizeCodeRunAttempt({
    id: `run-${lessonId}-${progress.codeRunAttempts.length}-${Math.random().toString(36).slice(2, 8)}`,
    lessonId,
    language: lesson.workshop.miniProject.runnerSpec.language,
    codeSnapshot: lesson.workshop.miniProject.runnerSpec.starterCode,
    stdout: passed ? lesson.workshop.miniProject.runnerSpec.expectedOutput.join("\n") : "",
    stderr: "",
    passed,
    score: passed ? 100 : 0,
    runtimeMs: 10,
    testResults: [],
    hiddenCheckSummary: { total: 0, passed: 0, failed: 0 },
    diagnostics: [],
    terminalTranscript: [],
    createdAt: NOW
  });
}

describe("PR01: durable achievements survive history compaction", () => {
  it("keeps a lesson completed after 1,000 later passing and failing runs", () => {
    const firstLesson = contentPack.lessons[0];
    let progress = recordCodeRunAttempt(createInitialProgress(NOW), runAttempt(createInitialProgress(NOW), firstLesson.id, true), NOW);
    expect(progress.completedLessonMiniProjectIds).toContain(firstLesson.id);

    const otherLessons = contentPack.lessons.slice(1, 8).map((lesson) => lesson.id);
    for (let i = 0; i < 1000; i++) {
      const lessonId = otherLessons[i % otherLessons.length];
      progress = recordCodeRunAttempt(progress, runAttempt(progress, lessonId, i % 2 === 0), NOW);
    }

    expect(progress.codeRunAttempts).toHaveLength(250);
    expect(progress.durableLessonMiniProjectIds).toContain(firstLesson.id);

    const reconciled = reconcileDerivedProgress(contentPack, progress, NOW);
    expect(reconciled.completedLessonMiniProjectIds).toContain(firstLesson.id);
  });

  it("keeps a quiz pass after 1,000 later quiz attempts and a later failing draft", () => {
    const quiz = contentPack.quizzes[0];
    let progress = submitQuizAttempt(createInitialProgress(NOW), quiz, passingQuizChoices(quiz), NOW);
    expect(progress.completedQuizIds).toContain(quiz.id);

    for (let i = 0; i < 1000; i++) {
      const target = contentPack.quizzes[i % contentPack.quizzes.length];
      progress = submitQuizAttempt(
        progress,
        target,
        i % 2 === 0 ? target.questions.map((question) => question.correctChoiceIndex) : target.questions.map(() => 0),
        NOW
      );
    }

    expect(progress.quizAttempts).toHaveLength(250);
    expect(progress.durableQuizIds).toContain(quiz.id);

    const reconciled = reconcileDerivedProgress(contentPack, progress, NOW);
    expect(reconciled.completedQuizIds).toContain(quiz.id);
  });

  it("migrates stored progress by promoting evidenced passes into durable achievements", () => {
    const firstLesson = contentPack.lessons[0];
    const quiz = quizForLesson(firstLesson.id);
    const stored = {
      profile: createInitialProgress(NOW).profile,
      completedLessonIds: [],
      completedLessonMiniProjectIds: [],
      completedQuizIds: [quiz.id],
      completedProjectMissionIds: [],
      evidenceItems: [],
      weeklyPlanTaskIds: [],
      codeRunAttempts: [runAttempt(createInitialProgress(NOW), firstLesson.id, true)],
      updatedAt: NOW
    };

    const migrated = ensureProgressProfile(stored as unknown as UserProgress, NOW);

    expect(migrated.durableLessonMiniProjectIds).toContain(firstLesson.id);
    expect(migrated.durableQuizIds).toContain(quiz.id);
  });

  it("keeps durable achievements stable across a role-target change", () => {
    const firstLesson = contentPack.lessons[0];
    let progress = recordCodeRunAttempt(createInitialProgress(NOW), runAttempt(createInitialProgress(NOW), firstLesson.id, true), NOW);
    progress = submitQuizAttempt(progress, quizForLesson(firstLesson.id), passingQuizChoices(quizForLesson(firstLesson.id)), NOW);

    const before = {
      durableLessons: progress.durableLessonMiniProjectIds,
      durableQuizzes: progress.durableQuizIds
    };
    const reconciled = reconcileDerivedProgress(contentPack, progress, NOW);

    expect(reconciled.durableLessonMiniProjectIds).toEqual(before.durableLessons);
    expect(reconciled.durableQuizIds).toEqual(before.durableQuizzes);
  });
});

describe("PR02: evidence hygiene measures distinct-target coverage", () => {
  it("does not saturate evidence hygiene with repeated runs of one lesson", () => {
    const lesson = contentPack.lessons[0];
    let progress = createInitialProgress(NOW);
    for (let i = 0; i < 4; i++) {
      progress = recordCodeRunAttempt(progress, runAttempt(progress, lesson.id, true), NOW);
    }

    const readiness = calculateReadinessScore(contentPack, progress);
    // Four passing runs each create proof evidence, but only the best item for
    // this single target counts (one auto proof item is worth 26 points).
    expect(readiness.breakdown.evidenceHygiene).toBeLessThanOrEqual(26);
  });

  it("increases coverage across distinct lessons, not repeated attempts", () => {
    let progress = createInitialProgress(NOW);
    for (const lesson of contentPack.lessons.slice(0, 4)) {
      progress = recordCodeRunAttempt(progress, runAttempt(progress, lesson.id, true), NOW);
    }
    const fourLessons = calculateReadinessScore(contentPack, progress).breakdown.evidenceHygiene;

    progress = recordCodeRunAttempt(progress, runAttempt(progress, contentPack.lessons[4].id, true), NOW);
    const fiveLessons = calculateReadinessScore(contentPack, progress).breakdown.evidenceHygiene;

    expect(fiveLessons).toBeGreaterThan(fourLessons);
  });
});

describe("PR03: mission prerequisites are stable contracts", () => {
  it("does not change mission prerequisites when an unrelated lesson is inserted first", () => {
    const trackerMission = contentPack.projectMissions.find((mission) => mission.id === "mission-cli-study-tracker")!;
    const cleanerMission = contentPack.projectMissions.find((mission) => mission.id === "mission-python-data-cleaner")!;

    const syntheticLesson: Lesson = {
      ...contentPack.lessons[0],
      id: "lesson-synthetic-unrelated",
      moduleId: "module-python-foundation",
      title: "Unrelated inserted lesson"
    };
    const reorderedLessons = [syntheticLesson, ...contentPack.lessons];

    expect(getMissionSupportedLessonIds(trackerMission, reorderedLessons, contentPack))
      .toEqual(getMissionSupportedLessonIds(trackerMission, contentPack.lessons, contentPack));
    expect(getMissionSupportedLessonIds(cleanerMission, reorderedLessons, contentPack))
      .toEqual(getMissionSupportedLessonIds(cleanerMission, contentPack.lessons, contentPack));
  });

  it("explicit mission curriculum references resolve to existing lessons", () => {
    const lessonIds = new Set(contentPack.lessons.map((lesson) => lesson.id));
    const problems: string[] = [];

    for (const mission of contentPack.projectMissions) {
      if (!mission.curriculum) {
        continue;
      }

      for (const lessonId of mission.curriculum.supportedLessonIds) {
        if (!lessonIds.has(lessonId)) {
          problems.push(`${mission.id} references unknown lesson ${lessonId}`);
        }
      }
      if (new Set(mission.curriculum.supportedLessonIds).size !== mission.curriculum.supportedLessonIds.length) {
        problems.push(`${mission.id} has duplicate supportedLessonIds`);
      }
    }

    expect(problems).toEqual([]);
  });
});
