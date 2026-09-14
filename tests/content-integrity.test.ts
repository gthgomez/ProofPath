import { describe, expect, it } from "vitest";
import { roleTargets } from "@/content/roles";
import { contentPack } from "@/content/seed";
import { conceptRegistry } from "@/content/concepts";
import { contentPackSchema, roleTargetSchema } from "@/domain/schemas";
import { validateSandboxSubmission } from "@/sandbox/policy";
import {
  collectActiveConceptUsage,
  findConceptHygieneErrors,
  findDangerousRunnerStatement,
  findUnsafeRunnerSqlErrors,
  findUnsafeSetupCodeErrors,
  setupCodeAllowedLessonIds,
  supportingConceptAllowList,
  validateContent
} from "../scripts/validate-content";

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
      } else {
        // Keep the exemption tied to its reason: if this lesson stops requiring
        // the NameError line, it no longer justifies dropping "traceback".
        expect(lesson.workshop.miniProject.tester.requiredOutputIncludes).toContain("NameError");
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
  // concept-only simulations). Used by the sandbox-language test below.
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
          for (const id of depth.codeLabBridge.verifierOnlyConcepts ?? []) push(id);
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

    // Lower-bound guards: empty concept references would make the dangling check
    // pass without ever exercising a single lookup.
    expect(registeredConceptIds.size).toBeGreaterThan(0);
    expect(contentPack.lessons.some((lesson) => (lesson.curriculum?.teaches.length ?? 0) > 0)).toBe(true);
    expect(contentPack.quizzes.some((quiz) => quiz.questions.some((question) => (question.conceptIds?.length ?? 0) > 0))).toBe(true);

    expect(dangling).toEqual([]);

    // Rule Group L scope (Issue #8, CLAUDE.md Content Integrity Rule 5):
    // conceptIds are required for exactly the quizzes of depth-bearing lessons.
    // scripts/validate-content.ts enforces this inside its `if (!lesson.depth)
    // continue` loop, so depth-less quizzes -- notably the 36 inline non-Python
    // (TypeScript/SQL/Git/AI/ML) questions assembled in seed.ts -- are
    // intentionally out of scope rather than force-mapped to an invented
    // taxonomy. Keep this assertion in lockstep with that validator gate.
    const missingConceptMappings: string[] = [];
    const lessonById = new Map(contentPack.lessons.map((lesson) => [lesson.id, lesson]));
    // Lower-bound guard: prove at least one depth-bearing quiz was inspected.
    const depthBearingQuizzes = contentPack.quizzes.filter((quiz) => lessonById.get(quiz.lessonId)?.depth);
    expect(depthBearingQuizzes.length).toBeGreaterThan(0);
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

  it("keeps the concept registry free of orphans and contradictory usesButDoesNotTeach declarations", () => {
    // Drives Rule Group P directly (findConceptHygieneErrors) so a regression in
    // scripts/validate-content.ts fails here instead of silently passing a copy.
    const problems = findConceptHygieneErrors(contentPack, conceptRegistry, supportingConceptAllowList);
    expect(problems).toEqual([]);

    // Lower-bound guards: an empty registry/lesson set would make the check vacuous.
    expect(conceptRegistry.length).toBeGreaterThan(0);
    expect(contentPack.lessons.length).toBeGreaterThan(0);

    // The allow-list must stay meaningful: every entry is a real registry concept.
    const unknownAllowedConcepts = supportingConceptAllowList.filter((id) => !registeredConceptIds.has(id));
    expect(unknownAllowedConcepts).toEqual([]);

    // The allow-list must not go stale: an allow-listed concept that an active
    // lesson teaches or that active metadata references no longer needs its
    // exemption and should be removed from the list.
    const { taughtByActiveLesson, metadataReferencedConceptIds } = collectActiveConceptUsage(contentPack, conceptRegistry);
    const staleAllowedConcepts = supportingConceptAllowList.filter(
      (id) => taughtByActiveLesson.has(id) || metadataReferencedConceptIds.has(id)
    );
    expect(staleAllowedConcepts).toEqual([]);

    // Negative fixtures: crafted packs prove Rule Group P fails closed.
    const orphanRegistry = [
      {
        id: "py.crafted.orphan",
        label: "Crafted orphan",
        category: "python",
        description: "crafted orphan",
        introducedLevel: 1
      }
    ] as unknown as typeof conceptRegistry;
    const orphanErrors = findConceptHygieneErrors(
      { lessons: [], quizzes: [], tracks: [], modules: [] } as unknown as typeof contentPack,
      orphanRegistry,
      []
    );
    expect(orphanErrors).toHaveLength(1);
    expect(orphanErrors[0]).toContain("py.crafted.orphan");

    // A quiz attached to a deprecated lesson must not keep a concept alive.
    const deprecatedQuizRegistry = [
      {
        id: "py.crafted.deprecatedquiz",
        label: "Crafted deprecated quiz concept",
        category: "python",
        description: "crafted",
        introducedLevel: 1
      }
    ] as unknown as typeof conceptRegistry;
    const deprecatedQuizErrors = findConceptHygieneErrors(
      {
        lessons: [
          {
            id: "lesson-crafted-deprecated",
            moduleId: "module-crafted",
            curriculum: { level: 1, deprecated: true, teaches: [], requires: [], usesButDoesNotTeach: [] }
          }
        ],
        quizzes: [
          {
            id: "quiz-crafted-deprecated",
            lessonId: "lesson-crafted-deprecated",
            questions: [{ id: "question-crafted", conceptIds: ["py.crafted.deprecatedquiz"] }]
          }
        ],
        tracks: [],
        modules: []
      } as unknown as typeof contentPack,
      deprecatedQuizRegistry,
      []
    );
    expect(deprecatedQuizErrors).toHaveLength(1);
    expect(deprecatedQuizErrors[0]).toContain("py.crafted.deprecatedquiz");

    // Alias references are normalized to the canonical concept id, so a lesson
    // that teaches an alias keeps the canonical entry alive.
    const aliasRegistry = [
      {
        id: "py.crafted.canonical",
        label: "Crafted canonical",
        category: "python",
        description: "crafted",
        introducedLevel: 1,
        aliases: ["py.crafted.alias"]
      }
    ] as unknown as typeof conceptRegistry;
    const aliasErrors = findConceptHygieneErrors(
      {
        lessons: [
          {
            id: "lesson-crafted-alias",
            moduleId: "module-crafted",
            curriculum: { level: 1, teaches: ["py.crafted.alias"], requires: [], usesButDoesNotTeach: [] }
          }
        ],
        quizzes: [],
        tracks: [],
        modules: []
      } as unknown as typeof contentPack,
      aliasRegistry,
      []
    );
    expect(aliasErrors).toEqual([]);

    // P2: usesButDoesNotTeach must not contradict an earlier same-level teaches.
    const conflictErrors = findConceptHygieneErrors(
      {
        lessons: [
          {
            id: "lesson-crafted-first",
            moduleId: "module-crafted",
            curriculum: { level: 1, teaches: ["py.crafted.taught"], requires: [], usesButDoesNotTeach: [] }
          },
          {
            id: "lesson-crafted-second",
            moduleId: "module-crafted",
            curriculum: { level: 1, teaches: [], requires: [], usesButDoesNotTeach: ["py.crafted.taught"] }
          }
        ],
        quizzes: [],
        tracks: [{ id: "track-crafted" }],
        modules: [
          {
            id: "module-crafted",
            trackId: "track-crafted",
            sortOrder: 0,
            lessonIds: ["lesson-crafted-first", "lesson-crafted-second"]
          }
        ]
      } as unknown as typeof contentPack,
      [] as unknown as typeof conceptRegistry,
      []
    );
    expect(conflictErrors).toHaveLength(1);
    expect(conflictErrors[0]).toContain("lesson-crafted-second");
    expect(conflictErrors[0]).toContain("py.crafted.taught");
  });

  it("keeps track and module containment bidirectional", () => {
    const moduleById = new Map(contentPack.modules.map((moduleItem) => [moduleItem.id, moduleItem]));
    const problems: string[] = [];

    // Lower-bound guards: empty tracks/modules would make the containment loops vacuous.
    expect(contentPack.tracks.length).toBeGreaterThan(0);
    expect(contentPack.modules.length).toBeGreaterThan(0);

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
    // Lower-bound guards: an empty or edge-less graph would make the drain check
    // pass without exercising any prerequisite relationship.
    const edgeCount = [...edges.values()].reduce((total, neighbors) => total + neighbors.length, 0);
    expect(nodes.size).toBeGreaterThan(0);
    expect(edgeCount).toBeGreaterThan(0);
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
    // setupCode and SQL check harnesses run WITHOUT the sandbox policy checks
    // that gate learner code (see src/sandbox/runner.ts). Rule Group O in
    // scripts/validate-content.ts owns the allow-list and the dangerous-operation
    // pattern; this test reuses that export so the invariant cannot drift.
    const problems = findUnsafeSetupCodeErrors(contentPack.lessons, setupCodeAllowedLessonIds);

    // Lower-bound guards: prove the scan actually saw privileged code.
    const setupCodeLessons = contentPack.lessons.filter(
      (lesson) => lesson.workshop.miniProject.runnerSpec.setupCode?.trim()
    ).length;
    const sqlCheckHarnesses = contentPack.lessons
      .filter((lesson) => lesson.workshop.miniProject.runnerSpec.language === "sql")
      .flatMap((lesson) => [
        ...lesson.workshop.miniProject.runnerSpec.visibleTests,
        ...lesson.workshop.miniProject.runnerSpec.hiddenTests
      ])
      .filter((test) => test.code && test.code.trim().length > 0).length;

    expect(setupCodeLessons).toBeGreaterThan(0);
    expect(sqlCheckHarnesses).toBeGreaterThan(0);
    expect(problems).toEqual([]);

    // The allow-list must stay tight: every vetted lesson actually ships setupCode,
    // so stale permissions are caught rather than silently accumulating.
    const allowlistedWithoutSetupCode = [...setupCodeAllowedLessonIds].filter((lessonId) => {
      const lesson = contentPack.lessons.find((candidate) => candidate.id === lessonId);
      return !lesson?.workshop.miniProject.runnerSpec.setupCode?.trim();
    });
    expect(allowlistedWithoutSetupCode).toEqual([]);

    // Negative fixtures: crafted lessons prove Rule Group O fails closed rather
    // than merely passing the real content.
    const craftedErrors = findUnsafeSetupCodeErrors(
      [
        {
          id: "lesson-crafted-unlisted",
          workshop: {
            miniProject: {
              runnerSpec: {
                language: "sql",
                setupCode: "CREATE TABLE t (id INTEGER);",
                visibleTests: [],
                hiddenTests: []
              }
            }
          }
        },
        {
          id: "lesson-crafted-dangerous",
          workshop: {
            miniProject: {
              runnerSpec: {
                language: "sql",
                setupCode: "DROP TABLE sessions;",
                visibleTests: [],
                hiddenTests: [{ id: "hidden", code: "DELETE FROM sessions;" }]
              }
            }
          }
        }
      ],
      setupCodeAllowedLessonIds
    );

    // lesson-crafted-unlisted: allow-list error only.
    // lesson-crafted-dangerous: allow-list error + setupCode DROP + check DELETE.
    expect(craftedErrors).toHaveLength(4);
    expect(craftedErrors.some((error) => error.includes("lesson-crafted-unlisted") && error.includes("allow-list"))).toBe(true);
    expect(craftedErrors.some((error) => error.includes("lesson-crafted-dangerous") && error.includes("allow-list"))).toBe(true);
    expect(craftedErrors.some((error) => error.includes("lesson-crafted-dangerous") && error.includes("DROP"))).toBe(true);
    expect(craftedErrors.some((error) => error.includes("lesson-crafted-dangerous") && error.includes("DELETE"))).toBe(true);
  });

  it("rejects dangerous trusted SQL harness code in runner checks (negative fixture)", () => {
    // Negative fixture: Rule Group O must fail closed on privileged harness SQL.
    // These crafted strings stand in for a malicious content pack, so the rule is
    // proven to reject bad input rather than merely passing the real content.
    const rejected: Array<[string, string]> = [
      ["DROP TABLE sessions;", "DROP"],
      ["  -- seed then destroy\nDROP TABLE sessions;", "DROP"],
      ["UPDATE sessions SET minutes = 0;", "UPDATE"],
      ["DELETE FROM sessions;", "DELETE"],
      ["ALTER TABLE sessions ADD COLUMN hidden TEXT;", "ALTER"],
      ["PRAGMA table_info(sessions);", "PRAGMA"],
      ["ATTACH DATABASE 'evil.db' AS evil;", "ATTACH"],
      ["DETACH DATABASE evil;", "DETACH"],
      ["VACUUM;", "VACUUM"],
      ["REINDEX;", "REINDEX"],
      ["ANALYZE;", "ANALYZE"],
      ["CREATE VIRTUAL TABLE fts USING fts5(topic);", "CREATE VIRTUAL TABLE"],
      ["CREATE TRIGGER t AFTER INSERT ON sessions BEGIN SELECT 1; END;", "CREATE TRIGGER"],
      ["CREATE TEMP TRIGGER t AFTER INSERT ON sessions BEGIN SELECT 1; END;", "CREATE TEMP TRIGGER"],
      ["CREATE TEMPORARY TRIGGER t AFTER INSERT ON sessions BEGIN SELECT 1; END;", "CREATE TEMPORARY TRIGGER"],
      ["REPLACE INTO sessions VALUES (1);", "REPLACE INTO"],
      ["INSERT INTO sessions VALUES (1); DROP TABLE sessions;", "DROP"]
    ];

    for (const [code, expectedOperator] of rejected) {
      expect(findDangerousRunnerStatement(code)).toBe(expectedOperator);
    }

    // Schema + seed harnesses and legacy non-SQL markers must be allowed, and
    // keywords inside seed literals/comments must not false-positive.
    const allowed = [
      "INSERT INTO sessions (date, topic, minutes) VALUES ('2026-06-04', 'sql', 45);",
      "-- Trusted harness SQL: seed an unseen topic\nINSERT INTO sessions (date, topic, minutes) VALUES ('2026-06-04', 'sql', 45);",
      "CREATE TABLE IF NOT EXISTS seed (topic TEXT);\nINSERT INTO seed VALUES ('sql');",
      "INSERT INTO sessions (topic) VALUES ('delete my notes');",
      "-- UPDATE nothing here\nINSERT INTO sessions (topic) VALUES ('sql');",
      "CREATE TABLE t (note TEXT DEFAULT 'drop me');",
      "SELECT 1;",
      "WITH seed AS (SELECT 1 AS n) SELECT n FROM seed;",
      "EXPECT_ROWS:no evidence",
      "-- visible check runs no harness SQL",
      ""
    ];

    for (const code of allowed) {
      expect(findDangerousRunnerStatement(code)).toBeNull();
    }

    // Belt-and-braces: the real content must satisfy the same predicate.
    for (const lesson of contentPack.lessons) {
      const runnerSpec = lesson.workshop.miniProject.runnerSpec;
      if (runnerSpec.language !== "sql") continue;
      for (const test of [...runnerSpec.visibleTests, ...runnerSpec.hiddenTests]) {
        expect(findDangerousRunnerStatement(test.code)).toBeNull();
      }
    }

    // Prove the actual Rule Group O guard fails closed on a crafted lesson whose
    // SQL check harness is destructive (a whole malicious pack cannot be
    // injected because validateContent reads the shipped pack).
    const craftedErrors = findUnsafeRunnerSqlErrors("lesson-crafted-evil", {
      language: "sql",
      visibleTests: [{ id: "visible", code: "SELECT 1;" }],
      hiddenTests: [{ id: "hidden", code: "DROP TABLE sessions;" }]
    });
    expect(craftedErrors).toHaveLength(1);
    expect(craftedErrors[0]).toContain("lesson-crafted-evil");
    expect(craftedErrors[0]).toContain("hidden");
    expect(craftedErrors[0]).toContain("DROP");

    // Non-SQL specs and safe SQL harnesses produce no errors.
    expect(findUnsafeRunnerSqlErrors("lesson-crafted-safe", {
      language: "sql",
      visibleTests: [{ id: "visible", code: "EXPECT_ROWS:no evidence" }],
      hiddenTests: [{ id: "hidden", code: "-- seed\nINSERT INTO sessions (topic) VALUES ('sql');" }]
    })).toEqual([]);
    expect(findUnsafeRunnerSqlErrors("lesson-crafted-js", {
      language: "javascript",
      visibleTests: [{ id: "visible", code: "DROP TABLE sessions;" }],
      hiddenTests: []
    })).toEqual([]);
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
      // Mirror the "QUIZ POSITION BIAS CHECKS" block in
      // scripts/validate-content.ts (the ratio >= 0.8 warning), which flags a
      // single answer position holding >= 80% of a quiz's questions. Staying at
      // least as strict as the validator keeps this invariant honest.
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
