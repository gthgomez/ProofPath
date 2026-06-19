import { describe, expect, it } from "vitest";
import { roleTargets } from "@/content/roles";
import { contentPack } from "@/content/seed";
import { contentPackSchema, roleTargetSchema } from "@/domain/schemas";
import { validateContent } from "../scripts/validate-content";

describe("content pack", () => {
  it("matches the schema", () => {
    expect(contentPackSchema.parse(contentPack).tracks.length).toBeGreaterThan(0);
  });

  it("has role targets that point to known tracks", () => {
    const parsedRoleTargets = roleTargetSchema.array().parse(roleTargets);
    const trackIds = new Set(contentPack.tracks.map((track) => track.id));

    expect(parsedRoleTargets.filter((roleTarget) => roleTarget.default)).toHaveLength(1);
    for (const roleTarget of parsedRoleTargets) {
      expect(roleTarget.trackIds.every((trackId) => trackIds.has(trackId))).toBe(true);
    }
  });

  it("uses original placeholder curriculum content", () => {
    const serializedContent = JSON.stringify(contentPack).toLowerCase();

    expect(serializedContent).not.toContain("sololearn");
    expect(serializedContent).not.toContain("freecodecamp");
  });

  it("prioritizes deep project missions over quiz variety", () => {
    expect(contentPack.projectMissions.length).toBeGreaterThanOrEqual(10);

    for (const mission of contentPack.projectMissions) {
      expect(mission.phases.length).toBeGreaterThanOrEqual(3);
      expect(mission.verificationCommands.length).toBeGreaterThan(0);
      expect(mission.expectedArtifacts.length).toBeGreaterThan(0);
      expect(mission.rubric.length).toBeGreaterThan(0);
      expect(mission.commonFailureModes.length).toBeGreaterThan(0);
    }
  });

  it("frames each lesson for a brand-new learner", () => {
    for (const lesson of contentPack.lessons) {
      expect(lesson.workshop.language.length).toBeGreaterThan(0);
      expect(lesson.workshop.tools.length).toBeGreaterThanOrEqual(2);
      expect(lesson.workshop.synopsis.length).toBeGreaterThanOrEqual(80);
      expect(lesson.workshop.prerequisites.length).toBeGreaterThanOrEqual(2);
      expect(lesson.workshop.testingFocus.toLowerCase()).toContain("test");
      expect(lesson.workshop.practice.starterCode.length).toBeGreaterThanOrEqual(40);
      expect(lesson.workshop.practice.expectedOutput.length).toBeGreaterThanOrEqual(1);
      expect(lesson.workshop.practice.checkYourAnswer.length).toBeGreaterThanOrEqual(50);
      for (const practiceRep of lesson.workshop.practiceReps ?? []) {
        expect(practiceRep.starterCode.length).toBeGreaterThanOrEqual(40);
        expect(practiceRep.expectedOutput.length).toBeGreaterThanOrEqual(20);
        expect(practiceRep.checkYourAnswer.length).toBeGreaterThanOrEqual(50);
      }
      expect(lesson.workshop.miniProject.steps.length).toBeGreaterThanOrEqual(3);
      expect(lesson.workshop.miniProject.deliverables.length).toBeGreaterThanOrEqual(3);
      expect(lesson.workshop.miniProject.verifierCommand.length).toBeGreaterThan(0);
      expect(lesson.workshop.miniProject.expectedEvidence.length).toBeGreaterThanOrEqual(60);
      expect(lesson.workshop.recallCards.map((card) => card.type).sort()).toEqual(["debug", "explain", "transfer"]);
      expect(new Set(lesson.workshop.recallCards.map((card) => card.id)).size).toBe(lesson.workshop.recallCards.length);
      expect(lesson.workshop.recallCards.every((card) => card.prompt.length >= 50 && card.answerHint.length >= 20)).toBe(true);
      expect(lesson.workshop.misconceptionChecks.length).toBeGreaterThanOrEqual(1);
      expect(lesson.workshop.misconceptionChecks.every((check) => (
        check.mistake.length > 0
        && check.repair.length >= 40
        && check.checkPrompt.length >= 50
      ))).toBe(true);
      expect(lesson.workshop.miniProject.tester.requiredOutputIncludes.length).toBeGreaterThan(0);
      expect(lesson.workshop.miniProject.tester.forbiddenOutputIncludes).toContain("traceback");
      expect(lesson.workshop.miniProject.runnerSpec.allowNetwork).toBe(false);
      expect(lesson.workshop.miniProject.runnerSpec.visibleTests.length).toBeGreaterThan(0);
      expect(lesson.workshop.miniProject.runnerSpec.timeoutMs).toBeGreaterThan(0);
      expect(lesson.workshop.miniProject.runnerSpec.timeoutMs).toBeLessThanOrEqual(10000);
      expect(lesson.workshop.miniProject.runnerSpec.expectedOutput.length).toBeGreaterThan(0);
    }

    const firstPythonLesson = contentPack.lessons.find((lesson) => lesson.id === "lesson-python-values");
    expect(firstPythonLesson?.workshop.language).toBe("Python");
    expect(firstPythonLesson?.workshop.tools).toContain("Python 3");
    expect(firstPythonLesson?.workshop.practice.expectedOutput).toContain("python");
  });

  it("gives the first Python arc explicit next-line code shapes", () => {
    const firstPythonArcLessonIds = [
      "lesson-python-values",
      "lesson-python-collections",
      "lesson-python-decisions",
      "lesson-python-loops",
      "lesson-python-foundation-capstone",
      "lesson-python-strings-cleanup"
    ];

    for (const lessonId of firstPythonArcLessonIds) {
      const lesson = contentPack.lessons.find((candidate) => candidate.id === lessonId);
      expect(lesson?.workshop.codeShape).toBeTruthy();
      expect(lesson?.workshop.codeShape).toContain("=");
    }
  });

  it("adds repeated practice to selected non-Python depth lessons", () => {
    const depthLessonIds = [
      "lesson-typescript-contracts",
      "lesson-typescript-runtime-validation",
      "lesson-sql-joins",
      "lesson-security-secrets-auth",
      "lesson-security-access-control-lab",
      "lesson-security-injection-output-encoding",
      "lesson-ai-retrieval-grounding",
      "lesson-cloud-ci-deploy-checks",
      "lesson-cloud-rollback-drill",
      "lesson-data-contracts-fixtures",
      "lesson-data-rejected-row-proof",
      "lesson-ml-confusion-matrix"
    ];

    for (const lessonId of depthLessonIds) {
      const lesson = contentPack.lessons.find((candidate) => candidate.id === lessonId);

      expect(lesson?.workshop.practiceReps?.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("embodies the Python depth standard in selected depth lessons", () => {
    const pythonDepthLessonIds = [
      "lesson-python-parser-tests",
      "lesson-python-cli-arguments",
      "lesson-python-rejected-row-report",
      "lesson-python-core-review",
      "lesson-python-project-structure",
      "lesson-python-dataclass-models",
      "lesson-python-json-reports",
      "lesson-python-logging-errors",
      "lesson-python-pytest-ci",
      "lesson-python-pyproject-metadata",
      "lesson-python-installable-cli",
      "lesson-python-config-files",
      "lesson-python-ci-precommit",
      "lesson-python-professional-review",
      "lesson-python-regex-validation",
      "lesson-python-oop-service",
      "lesson-python-sqlite-persistence",
      "lesson-python-api-client",
      "lesson-python-integration-capstone",
      "lesson-python-integration-review"
    ];
    const failureTerms = ["fail", "failure", "invalid", "reject", "error", "timeout", "status", "rollback", "risk", "bad shape", "bad input"];

    for (const lessonId of pythonDepthLessonIds) {
      const lesson = contentPack.lessons.find((candidate) => candidate.id === lessonId);
      const lessonText = JSON.stringify(lesson).toLowerCase();

      expect(lesson?.workshop.practiceReps?.length).toBeGreaterThanOrEqual(3);
      expect(lesson?.workshop.miniProject.runnerSpec.visibleTests.length).toBeGreaterThanOrEqual(1);
      expect(lesson?.workshop.miniProject.runnerSpec.hiddenTests.length).toBeGreaterThanOrEqual(1);
      expect(failureTerms.some((term) => lessonText.includes(term))).toBe(true);
    }
  });

  it("keeps Python review gates tied to evidence and judgment", () => {
    const reviewLessonIds = [
      "lesson-python-core-review",
      "lesson-python-professional-review",
      "lesson-python-integration-review"
    ];

    for (const lessonId of reviewLessonIds) {
      const lesson = contentPack.lessons.find((candidate) => candidate.id === lessonId);
      const lessonText = JSON.stringify(lesson).toLowerCase();

      expect(lessonText).toMatch(/architecture|structure|layers|matrix/);
      expect(lessonText).toMatch(/command|pytest|study-tracker|sqlite/);
      expect(lessonText).toMatch(/failure|risk|invalid|reject|error/);
      expect(lessonText).toContain("improvement");
    }
  });

  it("passes all static integrity rules (Groups A-G)", () => {
    const errors = validateContent();
    expect(errors).toEqual([]);
  });
});
