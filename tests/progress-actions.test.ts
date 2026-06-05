import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { normalizeCodeRunAttempt } from "@/domain/code-run";
import {
  addEvidenceItem,
  createInitialProgress,
  ensureProgressProfile,
  fastTrackLessons,
  placementSkip,
  getMissionSupportedLessonIds,
  reconcileDerivedProgress,
  recordCodeRunAttempt,
  recordReview,
  setRoleTarget,
  setLessonCompletion,
  setLessonMiniProjectCompletion,
  setMissionDeliverableCompletion,
  setMissionCompletion,
  setQuizCompletion,
  submitQuizAttempt,
  setWeeklyPlanTaskCompletion,
  validateEvidenceDraft
} from "@/domain/progress";
import type { Lesson, UserProgress } from "@/domain/types";
import { userProgressSchema } from "@/domain/schemas";

const NOW = "2026-05-04T16:40:00.000Z";
const cliMission = contentPack.projectMissions.find((mission) => mission.id === "mission-cli-study-tracker")!;
const pythonQuiz = contentPack.quizzes.find((quiz) => quiz.id === "quiz-python-functions")!;

function passingRunForLesson(lesson: Lesson, now: string) {
  return normalizeCodeRunAttempt({
    id: `run-${lesson.id}-${now.replace(/[^0-9]/g, "")}`,
    lessonId: lesson.id,
    language: lesson.workshop.miniProject.runnerSpec.language,
    codeSnapshot: lesson.workshop.miniProject.runnerSpec.starterCode,
    stdout: lesson.workshop.miniProject.runnerSpec.expectedOutput.join("\n"),
    stderr: "",
    passed: true,
    score: 100,
    runtimeMs: 12,
    testResults: [],
    createdAt: now
  });
}

function completeLessonWithActivity(progress: UserProgress, lesson: Lesson, now: string): UserProgress {
  const quiz = contentPack.quizzes.find((candidate) => candidate.id === lesson.quizId)!;
  const withRun = recordCodeRunAttempt(progress, passingRunForLesson(lesson, now), now);
  return submitQuizAttempt(withRun, quiz, quiz.questions.map((question) => question.correctChoiceIndex), now);
}

describe("progress actions", () => {
  it("creates schema-valid empty progress", () => {
    const progress = createInitialProgress(NOW);

    expect(userProgressSchema.parse(progress).updatedAt).toBe(NOW);
    expect(progress.profile.roleTargetId).toBe("path-software-foundations");
    expect(progress.profile.onboardingCompletedAt).toBeUndefined();
    expect(progress.completedLessonIds).toEqual([]);
    expect(progress.reviewItems).toEqual([]);
  });

  it("selects a career path and normalizes old progress payloads", () => {
    const progress = createInitialProgress(NOW);
    const selected = setRoleTarget(progress, "path-ai-product-engineering", true, "2026-05-04T16:41:00.000Z");
    const upgraded = ensureProgressProfile({
      completedLessonIds: [],
      completedQuizIds: [],
      completedProjectMissionIds: [],
      evidenceItems: [],
      weeklyPlanTaskIds: [],
      reviewItems: undefined,
      reviewEvents: undefined,
      updatedAt: NOW
    });
    const migrated = ensureProgressProfile({
      profile: {
        roleTargetId: "role-python-fullstack",
        createdAt: NOW,
        updatedAt: NOW
      },
      completedLessonIds: [],
      completedQuizIds: [],
      completedProjectMissionIds: [],
      evidenceItems: [],
      weeklyPlanTaskIds: [],
      updatedAt: NOW
    });

    expect(selected.profile.roleTargetId).toBe("path-ai-product-engineering");
    expect(selected.profile.onboardingCompletedAt).toBe("2026-05-04T16:41:00.000Z");
    expect(upgraded.profile.roleTargetId).toBe("path-software-foundations");
    expect(migrated.profile.roleTargetId).toBe("path-backend-api-data");
    expect(upgraded.reviewItems).toEqual([]);
  });

  it("toggles completion lists without duplicates", () => {
    const progress = createInitialProgress(NOW);
    const withLesson = setLessonCompletion(progress, "lesson-python-functions", true, NOW);
    const withMiniProject = setLessonMiniProjectCompletion(withLesson, "lesson-python-functions", true, NOW);
    const duplicateLesson = setLessonCompletion(withMiniProject, "lesson-python-functions", true, NOW);
    const withQuiz = setQuizCompletion(duplicateLesson, "quiz-python-functions", true, NOW);
    const withDeliverables = cliMission.deliverables.reduce(
      (currentProgress, _deliverable, index) => setMissionDeliverableCompletion(currentProgress, cliMission.id, index, true, NOW),
      withQuiz
    );
    const withEvidence = addEvidenceItem(withDeliverables, {
      type: "test-output",
      title: "Verifier proof",
      body: "Mission verifier passed with a repo link and a note about what the command proves.",
      linkedProjectMissionId: cliMission.id,
      repoUrl: "https://github.com/example/cli-study-tracker",
      testStatus: "passing",
      readmeStatus: "basic",
      verifierOutput: "npm run verify",
      reflection: "This proof connects the CLI deliverables to a repeatable verifier."
    }, NOW);
    const withMission = setMissionCompletion(withEvidence, cliMission, true, NOW);
    const withTask = setWeeklyPlanTaskCompletion(withMission, "task-python-cli", true, NOW);
    const reopenedLesson = setLessonCompletion(withTask, "lesson-python-functions", false, NOW);

    expect(duplicateLesson.completedLessonIds).toEqual(["lesson-python-functions"]);
    expect(duplicateLesson.completedLessonMiniProjectIds).toEqual(["lesson-python-functions"]);
    expect(withTask.completedQuizIds).toEqual(["quiz-python-functions"]);
    expect(withTask.completedProjectMissionIds).toEqual(["mission-cli-study-tracker"]);
    expect(withTask.weeklyPlanTaskIds).toEqual(["task-python-cli"]);
    expect(withTask.reviewItems.map((item) => `${item.targetType}:${item.targetId}`)).toEqual([
      "lesson:lesson-python-functions",
      "quiz:quiz-python-functions",
      "mission:mission-cli-study-tracker"
    ]);
    expect(reopenedLesson.completedLessonIds).toEqual([]);
    expect(reopenedLesson.reviewItems.map((item) => `${item.targetType}:${item.targetId}`)).toEqual([
      "quiz:quiz-python-functions",
      "mission:mission-cli-study-tracker"
    ]);
  });

  it("requires scored quiz attempts before checkpoint completion", () => {
    const progress = createInitialProgress(NOW);
    const failed = submitQuizAttempt(progress, pythonQuiz, [0, 0, 1], "2026-05-04T16:41:00.000Z");
    const passed = submitQuizAttempt(failed, pythonQuiz, [1, 1, 0], "2026-05-04T16:42:00.000Z");

    expect(failed.completedQuizIds).toEqual([]);
    expect(failed.quizAttempts[0]?.score).toBe(0);
    expect(passed.completedQuizIds).toEqual(["quiz-python-functions"]);
    expect(passed.quizAttempts[0]?.passed).toBe(true);
  });

  it("reconciles completion from real activity instead of manual flags", () => {
    const progress = createInitialProgress(NOW);
    const manuallyMarked = setWeeklyPlanTaskCompletion(
      setMissionCompletion(
        setMissionDeliverableCompletion(
          setLessonCompletion(
            setLessonMiniProjectCompletion(
              setQuizCompletion(progress, "quiz-python-values", true, NOW),
              "lesson-python-values",
              true,
              NOW
            ),
            "lesson-python-values",
            true,
            NOW
          ),
          cliMission.id,
          0,
          true,
          NOW
        ),
        cliMission,
        true,
        NOW
      ),
      "task-python-cli",
      true,
      NOW
    );
    const reconciled = reconcileDerivedProgress(contentPack, manuallyMarked, NOW);

    expect(reconciled.completedQuizIds).toEqual([]);
    expect(reconciled.completedLessonMiniProjectIds).toEqual([]);
    expect(reconciled.completedLessonIds).toEqual([]);
    expect(reconciled.completedProjectMissionIds).toEqual([]);
    expect(reconciled.completedProjectMissionDeliverableIds).toEqual([]);
    expect(reconciled.weeklyPlanTaskIds).toEqual([]);
  });

  it("awards lessons, missions, and linked weekly tasks from verified activity", () => {
    const mission = contentPack.projectMissions.find((candidate) => candidate.id === "mission-web-progress-board")!;
    const supportedLessons = getMissionSupportedLessonIds(mission, contentPack.lessons, contentPack)
      .map((lessonId) => contentPack.lessons.find((lesson) => lesson.id === lessonId)!)
      .filter(Boolean);
    const withLessons = supportedLessons.reduce(
      (currentProgress, lesson, index) => completeLessonWithActivity(currentProgress, lesson, new Date(Date.parse("2026-05-04T17:00:00.000Z") + (index * 60_000)).toISOString()),
      createInitialProgress(NOW)
    );
    const withEvidence = addEvidenceItem(withLessons, {
      type: "test-output",
      title: "Typed board proof",
      body: "Verifier-backed evidence for the typed progress board mission with a repo, commit, README, and reflection.",
      linkedProjectMissionId: mission.id,
      linkedSkillIds: mission.skillIds,
      repoUrl: "https://github.com/example/typed-progress-board",
      commitHash: "abc1234",
      testStatus: "passing",
      readmeStatus: "complete",
      verifierOutput: "npm run verify",
      reflection: "This evidence shows the typed board can be inspected and verified."
    }, "2026-05-04T17:20:00.000Z");
    const reconciled = reconcileDerivedProgress(contentPack, withEvidence, "2026-05-04T17:21:00.000Z");

    expect(supportedLessons.length).toBeGreaterThan(0);
    expect(supportedLessons.every((lesson) => reconciled.completedLessonIds.includes(lesson.id))).toBe(true);
    expect(reconciled.completedProjectMissionIds).toContain(mission.id);
    expect(reconciled.completedProjectMissionDeliverableIds).toEqual(
      mission.deliverables.map((_deliverable, index) => `${mission.id}:${index}`)
    );
    expect(reconciled.reviewItems.map((item) => `${item.targetType}:${item.targetId}`)).toContain(`mission:${mission.id}`);
  });

  it("requires mission-specific proof fields before mission completion", () => {
    const progress = createInitialProgress(NOW);
    const withDeliverables = cliMission.deliverables.reduce(
      (currentProgress, _deliverable, index) => setMissionDeliverableCompletion(currentProgress, cliMission.id, index, true, NOW),
      progress
    );
    const verifierOnly = addEvidenceItem(withDeliverables, {
      type: "test-output",
      title: "Verifier only",
      body: "This has command output but lacks the repo and reflection required by the mission.",
      linkedProjectMissionId: cliMission.id,
      testStatus: "passing",
      verifierOutput: "pytest"
    }, NOW);
    const attempted = setMissionCompletion(verifierOnly, cliMission, true, NOW);

    expect(attempted.completedProjectMissionIds).toEqual([]);
  });

  it("adds newest evidence first", () => {
    const progress = createInitialProgress(NOW);
    const first = addEvidenceItem(progress, {
      type: "reflection",
      title: " First note ",
      body: " Captured a verifier ",
      linkedProjectMissionId: "mission-cli-study-tracker"
    }, "2026-05-04T16:40:01.000Z");
    const second = addEvidenceItem(first, {
      type: "repo",
      title: "Repo",
      body: "README updated",
      uri: "https://github.com/example/repo"
    }, "2026-05-04T16:40:02.000Z");

    expect(second.evidenceItems).toHaveLength(2);
    expect(second.evidenceItems[0]?.title).toBe("Repo");
    expect(second.evidenceItems[0]?.testStatus).toBe("unknown");
    expect(second.evidenceItems[0]?.readmeStatus).toBe("missing");
    expect(second.evidenceItems[0]?.linkedSkillIds).toEqual([]);
    expect(second.evidenceItems[1]?.title).toBe("First note");
    expect(userProgressSchema.parse(second).evidenceItems[0]?.type).toBe("repo");
  });

  it("stores structured evidence proof fields", () => {
    const progress = createInitialProgress(NOW);
    const next = addEvidenceItem(progress, {
      type: "test-output",
      title: "Verifier proof",
      body: "Captured the exact command and result.",
      linkedProjectMissionId: "mission-cli-study-tracker",
      linkedSkillIds: ["skill-testing-debugging", "skill-portfolio-evidence"],
      repoUrl: "https://github.com/example/repo",
      commitHash: "abc1234",
      testStatus: "passing",
      artifactUri: "https://example.com/demo.gif",
      readmeStatus: "complete",
      deploymentUrl: "https://example.com",
      verifierOutput: "npm run verify",
      reflection: "Proof is inspectable and still has deployment follow-up."
    }, NOW);

    expect(next.evidenceItems[0]?.testStatus).toBe("passing");
    expect(next.evidenceItems[0]?.readmeStatus).toBe("complete");
    expect(next.evidenceItems[0]?.linkedSkillIds).toEqual(["skill-testing-debugging", "skill-portfolio-evidence"]);
    expect(userProgressSchema.parse(next).evidenceItems[0]?.verifierOutput).toBe("npm run verify");
  });

  it("validates structured evidence proof fields", () => {
    expect(validateEvidenceDraft({
      type: "repo",
      title: "Repo",
      body: "Proof",
      repoUrl: "github.com/example/repo"
    })).toContain("Repo URL");

    expect(validateEvidenceDraft({
      type: "commit",
      title: "Commit",
      body: "Proof",
      commitHash: "not-a-hash"
    })).toContain("Commit hash");

    expect(validateEvidenceDraft({
      type: "test-output",
      title: "Tests",
      body: "Proof",
      testStatus: "passing"
    })).toContain("check output");
  });

  it("records recall review events and advances due dates", () => {
    const progress = createInitialProgress(NOW);
    const withLesson = setLessonCompletion(progress, "lesson-python-functions", true, NOW);
    const reviewed = recordReview(withLesson, "lesson", "lesson-python-functions", "good", "2026-05-05T16:40:00.000Z");

    expect(withLesson.reviewItems[0]?.dueAt).toBe("2026-05-05T16:40:00.000Z");
    expect(reviewed.reviewItems[0]?.repetitions).toBe(1);
    expect(reviewed.reviewItems[0]?.dueAt).toBe("2026-05-06T16:40:00.000Z");
    expect(reviewed.reviewEvents[0]?.rating).toBe("good");
  });

  it("completes lessons, mini-projects, and quizzes via fastTrackLessons", () => {
    const progress = createInitialProgress(NOW);
    const targetLessons = ["lesson-python-values", "lesson-python-collections"];
    const targetQuizzes = ["quiz-python-values", "quiz-python-collections"];

    const updated = fastTrackLessons(progress, targetLessons, targetQuizzes, NOW);

    expect(updated.completedLessonIds).toContain("lesson-python-values");
    expect(updated.completedLessonIds).toContain("lesson-python-collections");
    expect(updated.completedLessonMiniProjectIds).toContain("lesson-python-values");
    expect(updated.completedLessonMiniProjectIds).toContain("lesson-python-collections");
    expect(updated.completedQuizIds).toContain("quiz-python-values");
    expect(updated.completedQuizIds).toContain("quiz-python-collections");
  });

  it("skips lessons and quizzes via placementSkip without completion or review items", () => {
    const progress = createInitialProgress(NOW);
    const targetLessons = ["lesson-python-values", "lesson-python-collections"];
    const targetQuizzes = ["quiz-python-values", "quiz-python-collections"];

    const updated = placementSkip(progress, targetLessons, targetQuizzes, NOW);

    expect(updated.placedOutLessonIds).toContain("lesson-python-values");
    expect(updated.placedOutLessonIds).toContain("lesson-python-collections");
    expect(updated.placedOutQuizIds).toContain("quiz-python-values");
    expect(updated.placedOutQuizIds).toContain("quiz-python-collections");

    // Must NOT grant actual completion
    expect(updated.completedLessonIds).not.toContain("lesson-python-values");
    expect(updated.completedLessonMiniProjectIds).not.toContain("lesson-python-values");
    expect(updated.completedQuizIds).not.toContain("quiz-python-values");

    // Must NOT create review items
    expect(updated.reviewItems).toEqual([]);
  });

  it("ensures legacy progress payloads are hydrated with empty placement fields", () => {
    const legacyPayload = {
      completedLessonIds: ["lesson-python-values"],
      completedQuizIds: ["quiz-python-values"],
      completedProjectMissionIds: [],
      evidenceItems: [],
      weeklyPlanTaskIds: [],
      updatedAt: NOW
    } as any;

    const hydrated = ensureProgressProfile(legacyPayload, NOW);

    expect(hydrated.placedOutLessonIds).toEqual([]);
    expect(hydrated.placedOutQuizIds).toEqual([]);
    expect(hydrated.completedLessonIds).toContain("lesson-python-values");
  });
});
