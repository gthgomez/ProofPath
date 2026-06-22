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

export function lessonMisconceptionChecks(
  commonMistakes: string[],
  /** Optional map from mistake text to custom repair guidance. If omitted, generates a mistake-specific repair. */
  customRepairs?: Record<string, string>
): LessonMisconceptionCheck[] {
  return commonMistakes.slice(0, 2).map((mistake) => ({
    mistake,
    repair: customRepairs?.[mistake]
      ?? `The mistake is: ${lowerFirst(mistake)}. Fix it, re-run the smallest check, and confirm the output changes as expected.`,
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
  customRepairs?: Record<string, string>,
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
    misconceptionChecks: lessonMisconceptionChecks(commonMistakes, customRepairs),
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
  /** Optional map from mistake text to custom repair guidance for misconception checks */
  customRepairs?: Record<string, string>;
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
      input.customRepairs,
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

/**
 * Deterministic shuffle keyed to a seed string. The same seed always produces
 * the same permutation, so quiz choice order is stable across reruns but varies
 * between different quiz IDs (preventing answer position bias).
 */
export function deterministicShuffle<T>(array: T[], seed: string): T[] {
  // DJB2 hash: convert seed string into a numeric state
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) + hash) + seed.charCodeAt(i);
    hash = hash & 0x7fffffff;
  }
  // Fisher-Yates shuffle driven by a linear congruential generator
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    hash = (hash * 1103515245 + 12345) & 0x7fffffff;
    const j = hash % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Generate a quiz with code-reading, scenario, and output-prediction questions.
 * Choices are shuffled deterministically per question ID so correct answer
 * position varies between lessons while remaining stable across reruns.
 */
export function codeReadingQuiz(
  id: string,
  lessonId: string,
  title: string,
  codeSnippet: string,
  concept: string,
  rightAnswer: string,
  wrongAnswerA: string,
  wrongAnswerB: string,
  explanation: string,
  conceptIds?: string[]
): Quiz {
  // Q1: Code-reading — shuffle the 3 answer choices
  const q1Choices = [rightAnswer, wrongAnswerA, wrongAnswerB];
  const q1Shuffled = deterministicShuffle(q1Choices, `${id}-cr-1`);
  const q1CorrectIndex = q1Shuffled.indexOf(rightAnswer);

  // Q2: Output prediction — shuffle the 3 hardcoded scenario choices
  const q2Raw = [
    "It would produce the exact same output",
    "It would produce a different output or error",
    "The program would not run at all"
  ];
  const q2Shuffled = deterministicShuffle(q2Raw, `${id}-cr-2`);
  const q2CorrectIndex = q2Shuffled.indexOf("It would produce a different output or error");

  // Q3: Application — shuffle the 3 hardcoded application choices
  const q3Raw = [
    "Never — this is just theory",
    "Only when installing Python on a new computer",
    "When processing or inspecting session data"
  ];
  const q3Shuffled = deterministicShuffle(q3Raw, `${id}-cr-3`);
  const q3CorrectIndex = q3Shuffled.indexOf("When processing or inspecting session data");

  // Q4: Debug — shuffle the 3 generic debug choices
  const q4Raw = [
    "A NameError from an undefined variable",
    "A TypeError from mixing incompatible types",
    "A logic error from misunderstanding what the function returns"
  ];
  const q4Shuffled = deterministicShuffle(q4Raw, `${id}-cr-4`);
  const q4CorrectIndex = q4Shuffled.indexOf("A logic error from misunderstanding what the function returns");

  // Q5: Refactor — shuffle the 3 generic refactor choices
  const q5Raw = [
    "Add more comments to explain each line",
    "Extract a helper function for the repeated logic",
    "Rename all variables to be shorter"
  ];
  const q5Shuffled = deterministicShuffle(q5Raw, `${id}-cr-5`);
  const q5CorrectIndex = q5Shuffled.indexOf("Extract a helper function for the repeated logic");

  return {
    id,
    lessonId,
    title,
    passingScore: 80,
    questions: [
      {
        id: `${id}-cr-1`,
        prompt: `Look at this code:\n\`\`\`python\n${codeSnippet}\n\`\`\`\nWhat does it produce or do?`,
        choices: q1Shuffled,
        correctChoiceIndex: q1CorrectIndex,
        explanation,
        conceptIds
      },
      {
        id: `${id}-cr-2`,
        prompt: `What would happen if you ran this version of the code?\n\`\`\`python\n${wrongAnswerA.includes("print") ? codeSnippet.replace(/print\([^)]+\)/, 'print("wrong")') : codeSnippet.replace(wrongAnswerA.includes("=") ? /[a-z_]+ = / : /print/, "x = 1\n    print")}\n\`\`\``,
        choices: q2Shuffled,
        correctChoiceIndex: q2CorrectIndex,
        explanation: "Changing code changes behavior. Always predict the output before running.",
        conceptIds
      },
      {
        id: `${id}-cr-3`,
        prompt: `In the Study Tracker project, where would you apply ${concept}?`,
        choices: q3Shuffled,
        correctChoiceIndex: q3CorrectIndex,
        explanation: "This concept helps you build the Study Tracker feature that reads, validates, or reports on sessions.",
        conceptIds
      },
      {
        id: `${id}-cr-4`,
        prompt: `What is the most likely bug someone would introduce in this code?`,
        choices: q4Shuffled,
        correctChoiceIndex: q4CorrectIndex,
        explanation: "Logic errors are the most common real-world bug — the code runs but produces wrong results.",
        conceptIds
      },
      {
        id: `${id}-cr-5`,
        prompt: `What single change would most improve this code?`,
        choices: q5Shuffled,
        correctChoiceIndex: q5CorrectIndex,
        explanation: "Extracting a helper function for repeated logic follows the DRY (Don't Repeat Yourself) principle, making code more maintainable.",
        conceptIds
      }
    ]
  };
}

/** @deprecated Replaced by codeReadingQuiz(). Shuffle backported to eliminate position bias. Use codeReadingQuiz for all new quizzes. */
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
  // Q1: Concept purpose — shuffle the 3 answer choices
  const q1Choices = deterministicShuffle([rightAnswer, wrongAnswerA, wrongAnswerB], `${id}-cp-1`);
  const q1CorrectIndex = q1Choices.indexOf(rightAnswer);

  // Q2: Review check — shuffle the 3 hardcoded choices
  const q2Raw = ["A private note with no example", "A small result plus check output", "A claim that the idea is obvious"];
  const q2Choices = deterministicShuffle(q2Raw, `${id}-cp-2`);
  const q2CorrectIndex = q2Choices.indexOf("A small result plus check output");

  // Q3: Beginner pitfalls — shuffle the 3 hardcoded choices
  const q3Raw = ["Naming the assumption", "Recording the check command", "Skipping the failure case"];
  const q3Choices = deterministicShuffle(q3Raw, `${id}-cp-3`);
  const q3CorrectIndex = q3Choices.indexOf("Skipping the failure case");

  return {
    id,
    lessonId,
    title,
    passingScore: 80,
    questions: [
      {
        id: `${id}-1`,
        prompt: `What is the main purpose of ${concept}?`,
        choices: q1Choices,
        correctChoiceIndex: q1CorrectIndex,
        explanation,
        conceptIds
      },
      {
        id: `${id}-2`,
        prompt: `Which check makes ${concept} reviewable?`,
        choices: q2Choices,
        correctChoiceIndex: q2CorrectIndex,
        explanation: "CareerForge treats finished work as an inspectable result plus a check result or explicit review note.",
        conceptIds
      },
      {
        id: `${id}-3`,
        prompt: `What should a beginner avoid when practicing ${concept}?`,
        choices: q3Choices,
        correctChoiceIndex: q3CorrectIndex,
        explanation: "The failure case shows whether the work handles real-world mess instead of only the happy path.",
        conceptIds
      }
    ]
  };
}
