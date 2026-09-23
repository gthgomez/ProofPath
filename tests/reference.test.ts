import { describe, expect, it } from "vitest";
import { conceptRegistry } from "@/content/concepts";
import type { ConceptDefinition } from "@/content/concepts";
import { contentPack } from "@/content/seed";
import { buildConceptIndex, conceptCategoryLabels, groupConceptsByCategory, searchContent } from "@/domain/reference";
import type { ContentPack, Lesson, Module } from "@/domain/types";
import { collectActiveConceptUsage, supportingConceptAllowList } from "../scripts/validate-content";

function makeLesson(overrides: Partial<Lesson> & Pick<Lesson, "id" | "moduleId" | "title">): Lesson {
  return {
    slug: overrides.id,
    summary: "",
    bodyMarkdown: "",
    estimatedMinutes: 5,
    difficulty: "foundation",
    skillIds: [],
    quizId: "",
    desktopTask: "",
    evidencePrompt: "",
    workshop: {
      language: "python",
      tools: [],
      synopsis: "",
      prerequisites: [],
      testingFocus: "",
      practice: { starterCode: "", expectedOutput: "", checkYourAnswer: "" },
      miniProject: {
        title: "",
        goal: "",
        steps: [],
        deliverables: [],
        verifierCommand: "",
        expectedEvidence: "",
        projectConnection: "",
        tester: {
          codeLabel: "",
          outputLabel: "",
          requiredCodeIncludes: [],
          requiredOutputIncludes: [],
          forbiddenOutputIncludes: [],
          successMessage: "",
          failureMessage: ""
        },
        runnerSpec: {
          language: "python",
          instructions: "",
          starterCode: "",
          visibleTests: [],
          hiddenTests: [],
          expectedOutput: [],
          timeoutMs: 1000,
          allowNetwork: false
        }
      },
      objective: "",
      whyItMatters: "",
      coreConcept: "",
      workedExample: "",
      commonMistakes: [],
      misconceptionChecks: [],
      recallCards: [],
      guidedExercise: "",
      missionConnection: "",
      reflectionPrompt: ""
    },
    ...overrides
  };
}

function makeModule(overrides: Partial<Module> & Pick<Module, "id" | "lessonIds" | "sortOrder">): Module {
  return {
    trackId: "track-fixture",
    slug: overrides.id,
    title: overrides.id,
    summary: "",
    projectMissionIds: [],
    skillIds: [],
    ...overrides
  };
}

function makePack(modules: Module[], lessons: Lesson[]): ContentPack {
  return {
    skills: [],
    skillEdges: [],
    tracks: [
      {
        id: "track-fixture",
        slug: "fixture",
        title: "Fixture Track",
        summary: "",
        roleTargets: [],
        moduleIds: modules.map((moduleItem) => moduleItem.id),
        accentColor: "#000000"
      }
    ],
    modules,
    lessons,
    quizzes: [],
    projectMissions: [],
    weeklyPlan: { id: "week-fixture", weekStart: "2026-09-21", headline: "", tasks: [] }
  };
}

function fixtureConcepts(): ConceptDefinition[] {
  return [
    {
      id: "c.loop",
      label: "Loop",
      category: "python",
      description: "repeat work with a loop",
      introducedLevel: 1
    },
    {
      id: "c.file-input",
      label: "File Input",
      category: "files",
      description: "read a file",
      introducedLevel: 4,
      aliases: ["c.file.read"]
    }
  ];
}

function fixturePack(): ContentPack {
  const moduleEarly = makeModule({ id: "module-early", lessonIds: ["lesson-plain", "lesson-capsule"], sortOrder: 1 });
  const moduleLate = makeModule({ id: "module-late", lessonIds: ["lesson-late", "lesson-deprecated"], sortOrder: 2 });

  const lessons = [
    makeLesson({
      id: "lesson-plain",
      moduleId: "module-early",
      title: "Plain Loop Lesson",
      summary: "teaches the loop plainly",
      curriculum: { level: 1, sequence: 1, version: "1", teaches: ["c.loop"], requires: [] }
    }),
    makeLesson({
      id: "lesson-capsule",
      moduleId: "module-early",
      title: "Capsule Loop Lesson",
      summary: "teaches the loop with a capsule",
      curriculum: { level: 1, sequence: 2, version: "1", teaches: ["c.loop"], requires: [] },
      depth: {
        primaryConceptId: "c.loop",
        secondaryConceptIds: [],
        maxNewConcepts: 1,
        conceptCapsules: [
          {
            conceptId: "c.loop",
            definition: "a loop repeats work",
            mentalModel: "a hamster wheel",
            syntaxShape: "for item in items:",
            tinyExample: "for item in [1, 2]:\n    print(item)",
            commonMistake: "forgetting the colon",
            repairHint: "check the colon",
            usedIn: ["learn"]
          }
        ],
        codeWalkthrough: [],
        guidedEdits: [],
        errorClinic: [],
        codeLabBridge: {
          story: "",
          usesConcepts: [],
          learnerOwns: [],
          checkerOwns: [],
          runExpectation: ""
        },
        understandingProofPrompt: "",
        exitTicket: []
      }
    }),
    makeLesson({
      id: "lesson-late",
      moduleId: "module-late",
      title: "Late File Lesson",
      summary: "teaches file input later",
      curriculum: { level: 4, sequence: 1, version: "1", teaches: ["c.file.read"], requires: [] }
    }),
    makeLesson({
      id: "lesson-deprecated",
      moduleId: "module-late",
      title: "Deprecated Loop Lesson",
      summary: "deprecated",
      curriculum: { level: 2, sequence: 2, version: "1", teaches: ["c.loop"], requires: [], deprecated: true }
    })
  ];

  return makePack([moduleEarly, moduleLate], lessons);
}

describe("buildConceptIndex", () => {
  it("indexes every registered concept exactly once", () => {
    const index = buildConceptIndex(contentPack, conceptRegistry);

    expect(index).toHaveLength(conceptRegistry.length);
    expect(new Set(index.map((entry) => entry.concept.id)).size).toBe(conceptRegistry.length);
  });

  it("matches the validator's taught-by-active-lesson set for registry concepts", () => {
    const { taughtByActiveLesson } = collectActiveConceptUsage(contentPack, conceptRegistry);
    const registryIds = new Set(conceptRegistry.map((concept) => concept.id));
    const indexedTaught = new Set(
      buildConceptIndex(contentPack, conceptRegistry)
        .filter((entry) => !entry.isSupportingOnly)
        .map((entry) => entry.concept.id)
    );
    const expected = new Set([...taughtByActiveLesson].filter((conceptId) => registryIds.has(conceptId)));

    expect(indexedTaught).toEqual(expected);
  });

  it("leaves no orphaned supporting-only entries", () => {
    const { metadataReferencedConceptIds } = collectActiveConceptUsage(contentPack, conceptRegistry);
    const aliasTargets = new Set(conceptRegistry.flatMap((concept) => concept.aliases ?? []));

    for (const entry of buildConceptIndex(contentPack, conceptRegistry)) {
      if (!entry.isSupportingOnly) continue;
      const exempt =
        supportingConceptAllowList.includes(entry.concept.id) ||
        aliasTargets.has(entry.concept.id) ||
        metadataReferencedConceptIds.has(entry.concept.id);
      expect(exempt).toBe(true);
    }
  });

  it("only lists active teaching lessons that canonically teach the concept", () => {
    const canonicalByAlias = new Map<string, string>();
    for (const concept of conceptRegistry) {
      for (const alias of concept.aliases ?? []) canonicalByAlias.set(alias, concept.id);
    }
    const lessonById = new Map(contentPack.lessons.map((lesson) => [lesson.id, lesson]));

    for (const entry of buildConceptIndex(contentPack, conceptRegistry)) {
      for (const location of entry.teachingLocations) {
        const lesson = lessonById.get(location.lessonId);
        expect(lesson, location.lessonId).toBeDefined();
        expect(lesson?.curriculum?.deprecated).toBeFalsy();
        expect(lesson?.curriculum?.teaches.map((id) => canonicalByAlias.get(id) ?? id)).toContain(entry.concept.id);
      }
    }
  });

  it("orders teaching locations by curriculum position", () => {
    const index = buildConceptIndex(fixturePack(), fixtureConcepts());
    const loop = index.find((entry) => entry.concept.id === "c.loop");

    expect(loop?.teachingLocations.map((location) => location.lessonId)).toEqual(["lesson-plain", "lesson-capsule"]);
  });

  it("prefers the capsule-bearing lesson as the introduction", () => {
    const index = buildConceptIndex(fixturePack(), fixtureConcepts());
    const loop = index.find((entry) => entry.concept.id === "c.loop");

    expect(loop?.introducingLesson?.lessonId).toBe("lesson-capsule");
    expect(loop?.capsule?.definition).toBe("a loop repeats work");
  });

  it("normalizes teaching references through aliases", () => {
    const index = buildConceptIndex(fixturePack(), fixtureConcepts());
    const fileInput = index.find((entry) => entry.concept.id === "c.file-input");

    expect(fileInput?.teachingLocations.map((location) => location.lessonId)).toEqual(["lesson-late"]);
    expect(fileInput?.isSupportingOnly).toBe(false);
  });

  it("keeps deprecated lessons out of the index", () => {
    const index = buildConceptIndex(fixturePack(), fixtureConcepts());
    const loop = index.find((entry) => entry.concept.id === "c.loop");

    expect(loop?.teachingLocations.map((location) => location.lessonId)).not.toContain("lesson-deprecated");
  });

  it("flags concepts no active lesson teaches as supporting-only", () => {
    const untaught: ConceptDefinition[] = [
      { id: "c.support", label: "Support", category: "project", description: "supporting only", introducedLevel: 0 }
    ];

    expect(buildConceptIndex(fixturePack(), untaught)[0].isSupportingOnly).toBe(true);
  });

  it("carries non-empty capsule content from the real pack", () => {
    for (const entry of buildConceptIndex(contentPack, conceptRegistry)) {
      if (!entry.capsule) continue;
      expect(entry.introducingLesson).toBeDefined();
      expect(entry.capsule.definition.length).toBeGreaterThan(0);
      expect(entry.capsule.tinyExample.length).toBeGreaterThan(0);
    }
  });
});

describe("groupConceptsByCategory", () => {
  it("accounts for every indexed concept exactly once", () => {
    const groups = groupConceptsByCategory(buildConceptIndex(contentPack, conceptRegistry));
    const total = groups.reduce((sum, group) => sum + group.entries.length, 0);

    expect(total).toBe(conceptRegistry.length);
    for (const group of groups) {
      expect(group.entries.length).toBeGreaterThan(0);
      expect(group.label).toBe(conceptCategoryLabels[group.category]);
    }
  });

  it("groups the fixture concepts by category with sorted labels", () => {
    const groups = groupConceptsByCategory(buildConceptIndex(fixturePack(), fixtureConcepts()));

    expect(groups.map((group) => group.label)).toEqual(["Files & Folders", "Python"]);
    expect(groups[0]?.entries.map((entry) => entry.concept.id)).toEqual(["c.file-input"]);
    expect(groups[1]?.entries.map((entry) => entry.concept.id)).toEqual(["c.loop"]);
  });

  it("sorts entries alphabetically within each real-pack group", () => {
    const groups = groupConceptsByCategory(buildConceptIndex(contentPack, conceptRegistry));

    for (const group of groups) {
      const labels = group.entries.map((entry) => entry.concept.label);
      expect(labels).toEqual([...labels].sort((left, right) => left.localeCompare(right)));
    }
  });
});

describe("searchContent", () => {
  it("ranks exact label matches above prefix matches above substring matches", () => {
    const concepts: ConceptDefinition[] = [
      { id: "c.while", label: "While Loops", category: "python", description: "condition-controlled loop", introducedLevel: 2 },
      { id: "c.looping", label: "Looping Patterns", category: "python", description: "common loop shapes", introducedLevel: 2 },
      { id: "c.loop", label: "Loop", category: "python", description: "repeat work", introducedLevel: 1 }
    ];
    const results = searchContent(fixturePack(), concepts, "loop");

    expect(results.concepts.map((hit) => hit.entry.concept.id)).toEqual(["c.loop", "c.looping", "c.while"]);
  });

  it("requires every query token to match (AND semantics)", () => {
    const concepts: ConceptDefinition[] = [
      { id: "c.while", label: "While Loops", category: "python", description: "condition-controlled loop", introducedLevel: 2 },
      { id: "c.loop", label: "Loop", category: "python", description: "repeat work", introducedLevel: 1 }
    ];
    const results = searchContent(fixturePack(), concepts, "loops while");

    expect(results.concepts.map((hit) => hit.entry.concept.id)).toEqual(["c.while"]);
  });

  it("is case-insensitive and matches aliases", () => {
    const results = searchContent(fixturePack(), fixtureConcepts(), "FILE.READ");

    expect(results.concepts.map((hit) => hit.entry.concept.id)).toEqual(["c.file-input"]);
  });

  it("returns empty groups for an empty or whitespace query", () => {
    expect(searchContent(fixturePack(), fixtureConcepts(), "")).toEqual({ concepts: [], lessons: [], missions: [] });
    expect(searchContent(fixturePack(), fixtureConcepts(), "   ")).toEqual({ concepts: [], lessons: [], missions: [] });
  });

  it("finds lessons and missions by title", () => {
    const pack = makePack(
      [makeModule({ id: "module-early", lessonIds: ["lesson-script"], sortOrder: 1 })],
      [
        makeLesson({
          id: "lesson-script",
          moduleId: "module-early",
          title: "Running Your First Script",
          summary: "execute a python file"
        })
      ]
    );
    pack.projectMissions = [
      {
        id: "mission-tracker",
        trackId: "track-fixture",
        title: "Study Tracker",
        brief: "track study habits",
        difficulty: "foundation",
        deliverables: [],
        acceptanceCriteria: [],
        phases: [],
        starterPrompt: "",
        verificationCommands: [],
        expectedArtifacts: [],
        rubric: [],
        commonFailureModes: [],
        portfolioSummaryPrompt: "",
        evidenceRequirements: {
          repoUrl: false,
          commitHash: false,
          passingVerifierOutput: false,
          readmeStatus: "basic",
          artifactOrDeployment: false,
          reflection: false
        },
        skillIds: []
      }
    ];

    const lessonResults = searchContent(pack, [], "first script");
    expect(lessonResults.lessons.map((hit) => hit.lesson.id)).toEqual(["lesson-script"]);

    const missionResults = searchContent(pack, [], "study tracker");
    expect(missionResults.missions.map((hit) => hit.mission.id)).toEqual(["mission-tracker"]);
  });

  it("excludes deprecated lessons from lesson results", () => {
    const deprecated = contentPack.lessons.find((lesson) => lesson.curriculum?.deprecated);
    expect(deprecated).toBeDefined();

    const titleToken = deprecated!.title.toLowerCase().split(" ").filter(Boolean)[0];
    const results = searchContent(contentPack, conceptRegistry, titleToken);

    expect(results.lessons.map((hit) => hit.lesson.id)).not.toContain(deprecated!.id);
  });

  it("surfaces the real pack's concepts and lessons", () => {
    const index = buildConceptIndex(contentPack, conceptRegistry);
    const withCapsule = index.find((entry) => entry.capsule);
    expect(withCapsule).toBeDefined();

    const conceptResults = searchContent(contentPack, conceptRegistry, withCapsule!.concept.label);
    expect(conceptResults.concepts[0]?.entry.concept.id).toBe(withCapsule!.concept.id);

    const activeLesson = contentPack.lessons.find((lesson) => !lesson.curriculum?.deprecated);
    expect(activeLesson).toBeDefined();
    const lessonResults = searchContent(contentPack, conceptRegistry, activeLesson!.title);
    expect(lessonResults.lessons.some((hit) => hit.lesson.id === activeLesson!.id)).toBe(true);
  });

  it("is deterministic for identical inputs", () => {
    const first = searchContent(contentPack, conceptRegistry, "python file");
    const second = searchContent(contentPack, conceptRegistry, "python file");

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });
});
