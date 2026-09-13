import { describe, expect, it } from "vitest";
import { roleTargets } from "@/content/roles";
import { contentPack } from "@/content/seed";
import { conceptRegistry } from "@/content/concepts";
import { contentPackSchema, roleTargetSchema } from "@/domain/schemas";
import { validateSandboxSubmission } from "@/sandbox/policy";
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
      const forbiddenOutputIncludes = lesson.workshop.miniProject.tester.forbiddenOutputIncludes;
      expect(forbiddenOutputIncludes.length).toBeGreaterThan(0);
      // The read-traceback lesson deliberately asks the learner to print a
      // readable NameError line, so it intentionally drops the generic
      // "error:"/"traceback" terms that would block the correct output.
      if (lesson.id !== "lesson-python-read-traceback") {
        expect(forbiddenOutputIncludes).toContain("traceback");
      }
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
      "lesson-python-lists",
      "lesson-python-dicts",
      "lesson-python-list-of-dicts",
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

describe("structural invariants", () => {
  const registeredConceptIds = new Set(conceptRegistry.map((concept) => concept.id));

  // Module-python lessons that intentionally run in a non-Python sandbox (or are
  // concept-only simulations). Shared by the sandbox-language test and the
  // privileged setupCode test below.
  const documentedSimulations = new Set([
    "lesson-python-portfolio-proof",
    "lesson-python-sqlite-persistence",
    "lesson-python-env-config",
    "lesson-python-ci-workflow",
    "lesson-python-secrets-management",
    "lesson-python-deployment-strategies",
    "lesson-python-monitoring-basics"
  ]);

  function collectConceptIds(collect: (push: (id: string) => void) => void): string[] {
    const ids: string[] = [];
    collect((id) => ids.push(id));
    return ids;
  }

  it("resolves every referenced concept id against the registry", () => {
    const dangling: string[] = [];

    for (const lesson of contentPack.lessons) {
      const curriculum = lesson.curriculum;
      if (curriculum) {
        const curriculumIds = collectConceptIds((push) => {
          for (const id of curriculum.teaches) push(id);
          for (const id of curriculum.requires) push(id);
          for (const id of curriculum.reinforces ?? []) push(id);
          for (const id of curriculum.visibleCodeConcepts ?? []) push(id);
          for (const id of curriculum.usesButDoesNotTeach ?? []) push(id);
          for (const id of curriculum.quizConcepts ?? []) push(id);
        });
        for (const id of curriculumIds) {
          if (!registeredConceptIds.has(id)) dangling.push(`lesson ${lesson.id} references unknown concept '${id}'`);
        }
      }

      const depth = lesson.depth;
      if (depth) {
        const depthIds = collectConceptIds((push) => {
          push(depth.primaryConceptId);
          for (const id of depth.secondaryConceptIds) push(id);
          for (const capsule of depth.conceptCapsules) push(capsule.conceptId);
          for (const note of depth.codeWalkthrough) for (const id of note.conceptIds) push(id);
          for (const edit of depth.guidedEdits) for (const id of edit.conceptIds) push(id);
          for (const clinic of depth.errorClinic) for (const id of clinic.conceptIds) push(id);
          for (const id of depth.codeLabBridge.usesConcepts) push(id);
        });
        for (const id of depthIds) {
          if (!registeredConceptIds.has(id)) dangling.push(`lesson ${lesson.id} depth references unknown concept '${id}'`);
        }
      }
    }

    for (const quiz of contentPack.quizzes) {
      for (const question of quiz.questions) {
        for (const id of question.conceptIds ?? []) {
          if (!registeredConceptIds.has(id)) dangling.push(`quiz ${quiz.id} question ${question.id} references unknown concept '${id}'`);
        }
      }
    }

    expect(dangling).toEqual([]);

    // Rule Group L (scripts/validate-content.ts:716) enforces conceptIds only on
    // quizzes whose lesson carries a depth block. Depth-less quizzes -- for
    // example the non-Python inline quizzes assembled in seed.ts -- are a
    // documented exception, so they are intentionally left unmapped rather than
    // inventing concept ids for them.
    const missingConceptMappings: string[] = [];
    const lessonById = new Map(contentPack.lessons.map((lesson) => [lesson.id, lesson]));
    for (const quiz of contentPack.quizzes) {
      if (!lessonById.get(quiz.lessonId)?.depth) continue;
      for (const question of quiz.questions) {
        if (!question.conceptIds || question.conceptIds.length === 0) {
          missingConceptMappings.push(`quiz ${quiz.id} question ${question.id} lacks conceptIds`);
        }
      }
    }

    expect(missingConceptMappings).toEqual([]);
  });

  it("keeps track and module containment bidirectional", () => {
    const moduleById = new Map(contentPack.modules.map((moduleItem) => [moduleItem.id, moduleItem]));
    const problems: string[] = [];

    for (const track of contentPack.tracks) {
      for (const moduleId of track.moduleIds) {
        const moduleItem = moduleById.get(moduleId);
        if (!moduleItem) {
          problems.push(`track ${track.id} lists missing module '${moduleId}'`);
        } else if (moduleItem.trackId !== track.id) {
          problems.push(`track ${track.id} lists module '${moduleId}' whose trackId is '${moduleItem.trackId}'`);
        }
      }
    }

    for (const moduleItem of contentPack.modules) {
      const track = contentPack.tracks.find((candidate) => candidate.id === moduleItem.trackId);
      if (!track) {
        problems.push(`module ${moduleItem.id} points at missing track '${moduleItem.trackId}'`);
      } else if (!track.moduleIds.includes(moduleItem.id)) {
        problems.push(`module ${moduleItem.id} is missing from track ${moduleItem.trackId}.moduleIds`);
      }
    }

    expect(problems).toEqual([]);
  });

  it("has an acyclic concept-prerequisite graph (requires -> teaches)", () => {
    const nodes = new Set<string>();
    const edges = new Map<string, string[]>();
    const indegree = new Map<string, number>();

    for (const lesson of contentPack.lessons) {
      if (lesson.curriculum?.deprecated) continue;
      for (const requiredId of lesson.curriculum?.requires ?? []) nodes.add(requiredId);
      for (const taughtId of lesson.curriculum?.teaches ?? []) nodes.add(taughtId);
    }
    for (const node of nodes) {
      edges.set(node, []);
      indegree.set(node, 0);
    }

    for (const lesson of contentPack.lessons) {
      if (lesson.curriculum?.deprecated) continue;
      for (const requiredId of lesson.curriculum?.requires ?? []) {
        for (const taughtId of lesson.curriculum?.teaches ?? []) {
          if (requiredId === taughtId) continue;
          edges.get(requiredId)?.push(taughtId);
          indegree.set(taughtId, (indegree.get(taughtId) ?? 0) + 1);
        }
      }
    }

    let queue = [...nodes].filter((node) => (indegree.get(node) ?? 0) === 0);
    let drained = 0;
    while (queue.length > 0) {
      const next: string[] = [];
      for (const node of queue) {
        drained++;
        for (const neighbor of edges.get(node) ?? []) {
          indegree.set(neighbor, (indegree.get(neighbor) ?? 0) - 1);
          if (indegree.get(neighbor) === 0) next.push(neighbor);
        }
      }
      queue = next;
    }

    const stuck = [...nodes].filter((node) => (indegree.get(node) ?? 0) > 0);
    expect(drained).toBe(nodes.size);
    expect(stuck).toEqual([]);
  });

  it("keeps required lesson code inside the sandbox policy", () => {
    const violations: string[] = [];
    let scannedLessons = 0;

    for (const lesson of contentPack.lessons) {
      if (lesson.curriculum?.deprecated) continue;
      scannedLessons++;
      const spec = lesson.workshop.miniProject.runnerSpec;
      const requiredLines = lesson.workshop.miniProject.tester.requiredCodeIncludes;
      // Practice code is run through the same sandbox as the runner spec
      // (app/lesson/[lessonId].tsx handleRunPractice), so the policy must accept
      // it too. Include the practice starter and every practice rep.
      const practiceCodes = [
        lesson.workshop.practice.starterCode,
        ...(lesson.workshop.practiceReps ?? []).map((practiceRep) => practiceRep.starterCode)
      ];
      const submission = [spec.starterCode, ...requiredLines, ...practiceCodes].join("\n");
      for (const violation of validateSandboxSubmission(spec, submission)) {
        violations.push(`lesson ${lesson.id} [${spec.language}] violates ${violation.rule}: ${violation.message}`);
      }
    }

    expect(scannedLessons).toBeGreaterThan(0);
    expect(violations).toEqual([]);
  });

  it("keeps privileged runner setupCode to vetted schema-and-seed lessons", () => {
    // setupCode runs WITHOUT the sandbox policy checks that gate learner code
    // (see src/content/python/level-7.ts and src/sandbox/runner.ts), so it must
    // stay limited to lesson schema plus seed statements. Lessons allowed to
    // carry setupCode are the documented module-python simulations above plus the
    // SQL lessons, whose runner legitimately seeds a read-only database so the
    // learner only writes SELECT queries.
    const setupCodeAllowedLessonIds = new Set([
      ...documentedSimulations,
      "lesson-sql-joins",
      "lesson-sql-constraints"
    ]);
    const dangerousSetupStatement = /\b(DROP|ATTACH|DETACH|PRAGMA|load_extension|UPDATE|DELETE)\b/i;
    const problems: string[] = [];
    let setupCodeLessons = 0;

    for (const lesson of contentPack.lessons) {
      const setupCode = lesson.workshop.miniProject.runnerSpec.setupCode;
      if (!setupCode) continue;
      setupCodeLessons++;
      if (!setupCodeAllowedLessonIds.has(lesson.id)) {
        problems.push(`lesson ${lesson.id} defines privileged setupCode but is not a vetted setup lesson`);
      }
      const dangerous = setupCode.match(dangerousSetupStatement);
      if (dangerous) {
        problems.push(`lesson ${lesson.id} setupCode contains non-schema/seed statement '${dangerous[0]}'`);
      }
    }

    expect(setupCodeLessons).toBeGreaterThan(0);
    expect(problems).toEqual([]);
  });

  it("runs module-python lessons in the python sandbox except documented simulations", () => {
    const problems: string[] = [];
    let allowlistedFound = 0;

    for (const lesson of contentPack.lessons) {
      if (!lesson.moduleId.startsWith("module-python-")) continue;
      if (documentedSimulations.has(lesson.id)) {
        allowlistedFound++;
        continue;
      }
      const language = lesson.workshop.miniProject.runnerSpec.language;
      if (language !== "python") {
        problems.push(`lesson ${lesson.id} runs in '${language}' sandbox but is not in the documented simulation allowlist`);
      }
    }

    expect(allowlistedFound).toBe(documentedSimulations.size);
    expect(problems).toEqual([]);
  });

  it("keeps quiz answer positions unbiased (no quiz >=80% at one index)", () => {
    const biased: string[] = [];

    for (const quiz of contentPack.quizzes) {
      if (quiz.questions.length < 3) continue;
      const counts = new Map<number, number>();
      for (const question of quiz.questions) {
        counts.set(question.correctChoiceIndex, (counts.get(question.correctChoiceIndex) ?? 0) + 1);
      }
      const maxCount = Math.max(...counts.values());
      // Mirror scripts/validate-content.ts:1192, which warns when a single answer
      // position holds >= 80% of a quiz's questions. Staying at least as strict as
      // the validator keeps this invariant honest instead of trailing it.
      if (maxCount / quiz.questions.length >= 0.8) {
        biased.push(`${quiz.id}: ${maxCount}/${quiz.questions.length} questions share one correctChoiceIndex`);
      }
    }

    expect(biased).toEqual([]);
  });

  it("gives every quiz at least three questions and a passingScore that tolerates one miss", () => {
    const problems: string[] = [];

    for (const quiz of contentPack.quizzes) {
      const questionCount = quiz.questions.length;
      if (questionCount < 3) {
        problems.push(`quiz ${quiz.id} has only ${questionCount} questions`);
      }
      if (quiz.passingScore > 100) {
        problems.push(`quiz ${quiz.id} passingScore ${quiz.passingScore} exceeds 100`);
      }
      if (questionCount === 0) continue;

      // Replay the real grading in src/domain/progress.ts submitQuizAttempt:
      // score = Math.round((correct / questionCount) * 100), passed = score >= passingScore.
      // Find the smallest number of correct answers that actually passes.
      let requiredCorrect = -1;
      for (let correct = 0; correct <= questionCount; correct++) {
        if (Math.round((correct / questionCount) * 100) >= quiz.passingScore) {
          requiredCorrect = correct;
          break;
        }
      }

      if (requiredCorrect < 1) {
        problems.push(`quiz ${quiz.id} can be passed with 0 correct answers (passingScore ${quiz.passingScore})`);
      } else if (requiredCorrect > questionCount - 1) {
        problems.push(
          `quiz ${quiz.id} passingScore ${quiz.passingScore} needs a perfect ${requiredCorrect}/${questionCount}; a learner cannot miss even one question`
        );
      }
    }

    expect(problems).toEqual([]);
  });
});
