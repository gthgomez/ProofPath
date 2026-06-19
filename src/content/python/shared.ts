import type { CurriculumMetadata, Difficulty, Lesson, LessonMiniProject, LessonMiniProjectTester, LessonMisconceptionCheck, LessonPracticeBlock, LessonRecallCard, LessonRunnerSpec, LessonWorkshop, MissionEvidenceRequirements, Quiz, RunnerLanguage } from "@/domain/types";

export const foundationEvidence: MissionEvidenceRequirements = {
  repoUrl: false,
  commitHash: false,
  passingVerifierOutput: true,
  readmeStatus: "basic",
  artifactOrDeployment: false,
  reflection: true
};

export const noviceEvidence: MissionEvidenceRequirements = {
  repoUrl: false,
  commitHash: false,
  passingVerifierOutput: true,
  readmeStatus: "missing",
  artifactOrDeployment: false,
  reflection: true
};

export const portfolioEvidence: MissionEvidenceRequirements = {
  repoUrl: true,
  commitHash: true,
  passingVerifierOutput: true,
  readmeStatus: "complete",
  artifactOrDeployment: true,
  reflection: true
};

export type LessonMiniProjectInput = Omit<LessonMiniProject, "tester" | "runnerSpec"> & {
  tester?: Partial<LessonMiniProjectTester>;
  runnerSpec?: Partial<LessonRunnerSpec> & Pick<LessonRunnerSpec, "language" | "starterCode" | "visibleTests">;
};

export function defaultRunnerSpec(
  language: RunnerLanguage,
  starterCode: string,
  instructions: string,
  visibleTestCode: string,
  expectedOutput: string[] = ["passed"]
): LessonRunnerSpec {
  return {
    language,
    instructions,
    starterCode,
    visibleTests: [
      {
        id: "visible-check",
        name: "Visible lesson check",
        code: visibleTestCode,
        expectedOutputIncludes: expectedOutput
      }
    ],
    hiddenTests: [],
    expectedOutput,
    timeoutMs: 4000,
    memoryLimitMb: 128,
    allowNetwork: false
  };
}

export function miniProjectWithTester(miniProject: LessonMiniProjectInput): LessonMiniProject {
  const defaultTester: LessonMiniProjectTester = {
    codeLabel: "Code or artifact",
    outputLabel: "Terminal output or check result",
    requiredCodeIncludes: [],
    requiredOutputIncludes: ["passed"],
    forbiddenOutputIncludes: ["traceback", "exception", "syntaxerror", "error:", "failed"],
    successMessage: "Mini-project check passed. The lesson can count this hands-on work.",
    failureMessage: "The tester needs code or notes plus clean check output before this can be marked done."
  };

  return {
    ...miniProject,
    runnerSpec: miniProject.runnerSpec ? {
      instructions: miniProject.runnerSpec.instructions ?? miniProject.goal,
      setupCode: miniProject.runnerSpec.setupCode,
      language: miniProject.runnerSpec.language,
      starterCode: miniProject.runnerSpec.starterCode,
      visibleTests: miniProject.runnerSpec.visibleTests,
      hiddenTests: miniProject.runnerSpec.hiddenTests ?? [],
      expectedOutput: miniProject.runnerSpec.expectedOutput ?? miniProject.tester?.requiredOutputIncludes ?? defaultTester.requiredOutputIncludes,
      timeoutMs: miniProject.runnerSpec.timeoutMs ?? 4000,
      memoryLimitMb: miniProject.runnerSpec.memoryLimitMb ?? 128,
      allowNetwork: false
    } : defaultRunnerSpec("javascript", "// Write your proof function here.", miniProject.goal, "console.log('passed')"),
    tester: {
      ...defaultTester,
      ...miniProject.tester,
      requiredCodeIncludes: miniProject.tester?.requiredCodeIncludes ?? defaultTester.requiredCodeIncludes,
      requiredOutputIncludes: miniProject.tester?.requiredOutputIncludes ?? defaultTester.requiredOutputIncludes,
      forbiddenOutputIncludes: miniProject.tester?.forbiddenOutputIncludes ?? defaultTester.forbiddenOutputIncludes
    }
  };
}

export function lowerFirst(value: string): string {
  return value.length === 0 ? value : `${value[0]?.toLowerCase()}${value.slice(1)}`;
}

export function professorSynopsis(synopsis: string, objective: string, projectGoal: string): string {
  return `Start here: ${synopsis} By the end, you will be able to ${lowerFirst(objective)} You will practice it by making this small result: ${lowerFirst(projectGoal)}`;
}

export function professorTestingFocus(testingFocus: string): string {
  return `What the check confirms: ${testingFocus} If the sandbox prints passed, that means the app confirmed the result; it is usually not a word you type yourself.`;
}

export function professorCoreConcept(coreConcept: string): string {
  return `Mental model: ${coreConcept}`;
}

export function professorGuidedExercise(guidedExercise: string): string {
  return `First do this: ${lowerFirst(guidedExercise)} Work one line at a time, run the code, then compare the result with the expected output.`;
}

export function professorReflectionPrompt(reflectionPrompt: string): string {
  return `${reflectionPrompt} A strong answer names the decision you made, the evidence you used, and one remaining uncertainty.`;
}

export function retentionSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "lesson";
}

export function lessonRecallCards(objective: string, coreConcept: string, guidedExercise: string, missionConnection: string): LessonRecallCard[] {
  const slug = retentionSlug(objective);

  return [
    {
      id: `${slug}-explain`,
      type: "explain",
      prompt: `Explain the lesson idea without opening the notes: ${lowerFirst(objective)}`,
      answerHint: coreConcept
    },
    {
      id: `${slug}-debug`,
      type: "debug",
      prompt: `Name one mistake that would make this practice fail, then say how you would notice it: ${lowerFirst(guidedExercise)}`,
      answerHint: "Look for the wrong output, missing value, skipped branch, or unchecked failure case before changing more code."
    },
    {
      id: `${slug}-transfer`,
      type: "transfer",
      prompt: "Where does this idea show up in the larger project or portfolio mission?",
      answerHint: missionConnection
    }
  ];
}

export function lessonMisconceptionChecks(commonMistakes: string[]): LessonMisconceptionCheck[] {
  return commonMistakes.slice(0, 2).map((mistake) => ({
    mistake,
    repair: "Slow down to one observable behavior, run the smallest check, and explain what changed before moving on.",
    checkPrompt: `How would you catch this mistake before claiming the lesson is done: ${lowerFirst(mistake)}?`
  }));
}

export function workshop(
  objective: string,
  whyItMatters: string,
  coreConcept: string,
  workedExample: string,
  guidedExercise: string,
  missionConnection: string,
  reflectionPrompt: string,
  commonMistakes = ["Skipping the failure case", "Recording completion without check output"],
  beginnerContext: Pick<LessonWorkshop, "language" | "tools" | "synopsis" | "prerequisites" | "testingFocus"> & { codeShape?: string } = {
    language: "Career skill",
    tools: ["CareerForge"],
    synopsis: objective,
    prerequisites: ["No prior setup required beyond opening this lesson."],
    testingFocus: "You will test the idea with a small task and a short evidence note."
  },
  practice: LessonPracticeBlock = {
    starterCode: "Start with the smallest example from the guided exercise.",
    expectedOutput: "A result you can inspect without guessing.",
    checkYourAnswer: "Compare your result with the expected output, then explain one thing you would test next."
  },
  miniProject: LessonMiniProjectInput = {
    title: "Lesson practice slice",
    goal: "Turn the lesson idea into one small artifact you can inspect.",
    steps: ["Build the smallest working version", "Run one lesson check or manual check", "Write what the result confirms"],
    deliverables: ["Working result", "Check result", "Short reflection"],
    verifierCommand: "Run the smallest command or check that confirms the result works.",
    expectedEvidence: "A note with the result path, check output, and one limitation.",
    projectConnection: "This mini project is a small rehearsal for the larger portfolio mission."
  },
  practiceReps: LessonPracticeBlock[] = []
): LessonWorkshop {
  const completedMiniProject = miniProjectWithTester(miniProject);

  return {
    ...beginnerContext,
    synopsis: professorSynopsis(beginnerContext.synopsis, objective, completedMiniProject.goal),
    testingFocus: professorTestingFocus(beginnerContext.testingFocus),
    codeShape: beginnerContext.codeShape,
    practice,
    practiceReps,
    miniProject: completedMiniProject,
    objective,
    whyItMatters,
    coreConcept: professorCoreConcept(coreConcept),
    workedExample,
    commonMistakes,
    misconceptionChecks: lessonMisconceptionChecks(commonMistakes),
    recallCards: lessonRecallCards(objective, coreConcept, guidedExercise, missionConnection),
    guidedExercise: professorGuidedExercise(guidedExercise),
    missionConnection,
    reflectionPrompt: professorReflectionPrompt(reflectionPrompt)
  };
}

export interface ProofLessonInput {
  id: string;
  moduleId: string;
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  estimatedMinutes: number;
  difficulty: Difficulty;
  skillIds: string[];
  quizId: string;
  desktopTask: string;
  evidencePrompt: string;
  language: string;
  tools: string[];
  synopsis: string;
  prerequisites: string[];
  testingFocus: string;
  objective: string;
  whyItMatters: string;
  coreConcept: string;
  workedExample: string;
  guidedExercise: string;
  missionConnection: string;
  reflectionPrompt: string;
  practiceStarter: string;
  practiceExpected: string;
  practiceCheck: string;
  practiceReps?: LessonPracticeBlock[];
  miniTitle: string;
  miniGoal: string;
  miniSteps: string[];
  miniDeliverables: string[];
  verifierCommand: string;
  expectedEvidence: string;
  projectConnection: string;
  requiredCodeIncludes: string[];
  requiredOutputIncludes: string[];
  runnerLanguage?: RunnerLanguage;
  runnerStarterCode: string;
  runnerTestCode: string;
  hiddenTests?: any[]; // optional hidden tests override
  curriculum?: CurriculumMetadata;
  codeShape?: string;
}

export function proofLesson(input: ProofLessonInput): Lesson {
  const baseLesson: Lesson = {
    id: input.id,
    moduleId: input.moduleId,
    slug: input.slug,
    title: input.title,
    summary: input.summary,
    bodyMarkdown: input.bodyMarkdown,
    estimatedMinutes: input.estimatedMinutes,
    difficulty: input.difficulty,
    skillIds: input.skillIds,
    quizId: input.quizId,
    desktopTask: input.desktopTask,
    evidencePrompt: input.evidencePrompt,
    curriculum: input.curriculum,
    workshop: workshop(
      input.objective,
      input.whyItMatters,
      input.coreConcept,
      input.workedExample,
      input.guidedExercise,
      input.missionConnection,
      input.reflectionPrompt,
      ["Skipping the negative case", "Claiming completion without check output"],
      {
        language: input.language,
        tools: input.tools,
        synopsis: input.synopsis,
        prerequisites: input.prerequisites,
        testingFocus: `${input.testingFocus} This test keeps the result tied to observable behavior.`,
        codeShape: input.codeShape
      },
      {
        starterCode: input.practiceStarter,
        expectedOutput: input.practiceExpected,
        checkYourAnswer: input.practiceCheck
      },
      {
        title: input.miniTitle,
        goal: input.miniGoal,
        steps: input.miniSteps,
        deliverables: input.miniDeliverables,
        verifierCommand: input.verifierCommand,
        expectedEvidence: input.expectedEvidence,
        projectConnection: input.projectConnection,
        tester: {
          codeLabel: "Paste your project note or code",
          outputLabel: "Paste check output",
          requiredCodeIncludes: input.requiredCodeIncludes,
          requiredOutputIncludes: input.requiredOutputIncludes,
          successMessage: `${input.title} check passed.`,
          failureMessage: "The tester needs the required fields plus clean check output."
        },
        runnerSpec: {
          language: input.runnerLanguage ?? "javascript",
          starterCode: input.runnerStarterCode,
          visibleTests: [
            {
              id: `${input.slug}-visible-check`,
              name: `${input.title} visible check`,
              code: input.runnerTestCode,
              expectedOutputIncludes: input.requiredOutputIncludes
            }
          ],
          hiddenTests: input.hiddenTests ?? [],
          expectedOutput: input.requiredOutputIncludes
        }
      },
      input.practiceReps
    )
  };
  return baseLesson;
}

export function checkpointQuiz(
  id: string,
  lessonId: string,
  title: string,
  concept: string,
  rightAnswer: string,
  wrongAnswerA: string,
  wrongAnswerB: string,
  explanation: string,
  conceptIds?: string[]
): Quiz {
  return {
    id,
    lessonId,
    title,
    passingScore: 80,
    questions: [
      {
        id: `${id}-1`,
        prompt: `What is the main purpose of ${concept}?`,
        choices: [rightAnswer, wrongAnswerA, wrongAnswerB],
        correctChoiceIndex: 0,
        explanation,
        conceptIds
      },
      {
        id: `${id}-2`,
        prompt: `Which check makes ${concept} reviewable?`,
        choices: ["A private note with no example", "A small result plus check output", "A claim that the idea is obvious"],
        correctChoiceIndex: 1,
        explanation: "CareerForge treats finished work as an inspectable result plus a check result or explicit review note.",
        conceptIds
      },
      {
        id: `${id}-3`,
        prompt: `What should a beginner avoid when practicing ${concept}?`,
        choices: ["Naming the assumption", "Recording the check command", "Skipping the failure case"],
        correctChoiceIndex: 2,
        explanation: "The failure case shows whether the work handles real-world mess instead of only the happy path.",
        conceptIds
      }
    ]
  };
}
