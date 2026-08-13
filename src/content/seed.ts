import type { ContentPack, CurriculumMetadata, Difficulty, Lesson, LessonMiniProject, LessonMiniProjectTester, LessonMisconceptionCheck, LessonPracticeBlock, LessonRecallCard, LessonRunnerSpec, LessonWorkshop, MissionEvidenceRequirements, ProjectMissionPhase, Quiz, RunnerLanguage } from "@/domain/types";
import { deterministicShuffle } from "./python/shared";
import { level0Lessons, level0Quizzes } from "./python/level-0";
import { level1Lessons, level1Quizzes, deprecatedLevel1Lessons } from "./python/level-1";
import { level2Lessons, level2Quizzes } from "./python/level-2";
import { level3Lessons, level3Quizzes, deprecatedLevel3Lessons } from "./python/level-3";
import { level4Lessons, level4Quizzes, deprecatedLevel4Lessons } from "./python/level-4";
import { level5Lessons, level5Quizzes } from "./python/level-5";
import { level6Lessons, level6Quizzes } from "./python/level-6";
import { level7Lessons, level7Quizzes } from "./python/level-7";
import { level8Lessons, level8Quizzes } from "./python/level-8";
import { level9Lessons, level9Quizzes } from "./python/level-9";

const foundationEvidence: MissionEvidenceRequirements = {
  repoUrl: false,
  commitHash: false,
  passingVerifierOutput: true,
  readmeStatus: "basic",
  artifactOrDeployment: false,
  reflection: true
};

const portfolioEvidence: MissionEvidenceRequirements = {
  repoUrl: true,
  commitHash: true,
  passingVerifierOutput: true,
  readmeStatus: "complete",
  artifactOrDeployment: true,
  reflection: true
};

type LessonMiniProjectInput = Omit<LessonMiniProject, "tester" | "runnerSpec"> & {
  tester?: Partial<LessonMiniProjectTester>;
  runnerSpec?: Partial<LessonRunnerSpec> & Pick<LessonRunnerSpec, "language" | "starterCode" | "visibleTests">;
};

function defaultRunnerSpec(
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

function miniProjectWithTester(miniProject: LessonMiniProjectInput): LessonMiniProject {
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

function missionPhases(slug: string, buildTarget: string, verifier: string, polishTarget = "portfolio note"): ProjectMissionPhase[] {
  return [
    {
      id: `${slug}-plan`,
      title: "Plan the check",
      goal: `Define the smallest useful version of ${buildTarget}.`,
      tasks: ["Write the user story", "List the data contract", "Name the check before building"]
    },
    {
      id: `${slug}-build`,
      title: "Build the slice",
      goal: `Create ${buildTarget} with one complete happy path and one handled failure path.`,
      tasks: ["Implement the core flow", "Keep UI or CLI separate from domain logic", "Commit when the first slice works"]
    },
    {
      id: `${slug}-verify`,
      title: "Verify and explain",
      goal: `Confirm ${buildTarget} works with ${verifier}.`,
      tasks: ["Run the check", "Capture exact output", `Write the ${polishTarget}`]
    }
  ];
}

function lowerFirst(value: string): string {
  return value.length === 0 ? value : `${value[0]?.toLowerCase()}${value.slice(1)}`;
}

function professorSynopsis(synopsis: string, objective: string, projectGoal: string): string {
  return `Start here: ${synopsis} By the end, you will be able to ${lowerFirst(objective)} You will practice it by making this small result: ${lowerFirst(projectGoal)}`;
}

function professorTestingFocus(testingFocus: string): string {
  return `What the check confirms: ${testingFocus} If the sandbox prints passed, that means the app confirmed the result; it is usually not a word you type yourself.`;
}

function professorCoreConcept(coreConcept: string): string {
  return `Mental model: ${coreConcept}`;
}

function professorGuidedExercise(guidedExercise: string): string {
  return `First do this: ${lowerFirst(guidedExercise)} Work one line at a time, run the code, then compare the result with the expected output.`;
}

function professorReflectionPrompt(reflectionPrompt: string): string {
  return `${reflectionPrompt} A strong answer names the decision you made, the evidence you used, and one remaining uncertainty.`;
}

function retentionSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "lesson";
}

function lessonRecallCards(objective: string, coreConcept: string, guidedExercise: string, missionConnection: string): LessonRecallCard[] {
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

function lessonMisconceptionChecks(
  commonMistakes: string[],
  customRepairs?: Record<string, string>
): LessonMisconceptionCheck[] {
  return commonMistakes.slice(0, 2).map((mistake) => ({
    mistake,
    repair: customRepairs?.[mistake]
      ?? "Slow down to one observable behavior, run the smallest check, and explain what changed before moving on.",
    checkPrompt: `How would you catch this mistake before claiming the lesson is done: ${lowerFirst(mistake)}?`
  }));
}

function workshop(
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
  practiceReps: LessonPracticeBlock[] = [],
  customRepairs?: Record<string, string>
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

interface ProofLessonInput {
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
  hiddenTests?: any[];
  curriculum?: CurriculumMetadata;
  codeShape?: string;
  customRepairs?: Record<string, string>;
}

function proofLesson(input: ProofLessonInput): Lesson {
  return {
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
      input.practiceReps,
      input.customRepairs
    )
  };
}

function checkpointQuiz(
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

  // Q2: Review check — rotate target index to (q1CorrectIndex + 1) % 3
  const q2CorrectIndex = (q1CorrectIndex + 1) % 3;
  const q2Right = "A small result plus check output";
  const q2Wrongs = ["A private note with no example", "A claim that the idea is obvious"];
  const q2Choices = new Array(3);
  q2Choices[q2CorrectIndex] = q2Right;
  let q2WrongIdx = 0;
  for (let i = 0; i < 3; i++) {
    if (i !== q2CorrectIndex) {
      q2Choices[i] = q2Wrongs[q2WrongIdx++];
    }
  }

  // Q3: Beginner pitfalls — rotate target index to (q1CorrectIndex + 2) % 3
  const q3CorrectIndex = (q1CorrectIndex + 2) % 3;
  const q3Right = "Skipping the failure case";
  const q3Wrongs = ["Naming the assumption", "Recording the check command"];
  const q3Choices = new Array(3);
  q3Choices[q3CorrectIndex] = q3Right;
  let q3WrongIdx = 0;
  for (let i = 0; i < 3; i++) {
    if (i !== q3CorrectIndex) {
      q3Choices[i] = q3Wrongs[q3WrongIdx++];
    }
  }

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

// Removed: pythonValuePracticeReps — moved to level file

// Removed: pythonCollectionPracticeReps — moved to level file

// Removed: pythonDecisionPracticeReps — moved to level file

// Removed: pythonLoopPracticeReps — moved to level file

// Removed: pythonFoundationCapstonePracticeReps — moved to level file

// Removed: pythonStringCleanupPracticeReps — moved to level file

// Removed: pythonFunctionPracticeReps — moved to level file

// Removed: pythonCoreReviewPracticeReps — moved to level file

// Removed: pythonDataclassPracticeReps — moved to level file

// Removed: pythonJsonPracticeReps — moved to level file

// Removed: pythonConfigPracticeReps — moved to level file

// Removed: pythonCiPracticeReps — moved to level file

// Removed: pythonProfessionalReviewPracticeReps — moved to level file


const typescriptContractPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "type ReadinessCard = {\n  label: string;\n  score: number;\n};\n\nconst card: ReadinessCard = { label: 'Portfolio', score: 42 };\nconsole.log(card.score);",
    expectedOutput: "The readiness score prints 42 and the object keeps score as a number.",
    checkYourAnswer: "Add a status field to the type, then watch the example object fail until you provide it. The lesson is the contract catching drift before the UI renders."
  },
  {
    starterCode: "type EvidenceBadge = { title: string; passing: boolean };\nconst badge: EvidenceBadge = { title: 'CLI tests', passing: true };\nconsole.log(badge.passing);",
    expectedOutput: "The badge prints true because passing is a boolean, not a display string.",
    checkYourAnswer: "Change passing to the string 'yes'. TypeScript should reject it because later logic needs a real boolean branch."
  },
  {
    starterCode: "type MissionSummary = { title: string; artifactCount: number; nextAction: string };\nconst summary: MissionSummary = { title: 'RAG Notes', artifactCount: 3, nextAction: 'Add citation check' };",
    expectedOutput: "The object has one text title, one number count, and one next action string.",
    checkYourAnswer: "This repeats the same contract idea with new field names so you remember the shape, not just MissionCard."
  }
];

const sqlJoinPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "SELECT skills.name\nFROM skills\nLEFT JOIN evidence_skills es ON es.skill_id = skills.id\nWHERE es.evidence_id IS NULL;",
    expectedOutput: "Only skills with no linked evidence rows should appear.",
    checkYourAnswer: "Start from the table where missing rows matter. If you start from evidence, skills with no evidence cannot appear."
  },
  {
    starterCode: "SELECT m.title, COUNT(e.id) AS evidence_count\nFROM missions m\nLEFT JOIN evidence e ON e.mission_id = m.id\nGROUP BY m.id, m.title;",
    expectedOutput: "Every mission appears with a count, including missions where evidence_count is 0.",
    checkYourAnswer: "COUNT(e.id) counts matching evidence rows. A LEFT JOIN keeps the mission row even when that count is zero."
  },
  {
    starterCode: "SELECT m.title\nFROM missions m\nINNER JOIN evidence e ON e.mission_id = m.id;",
    expectedOutput: "Only missions that already have evidence appear.",
    checkYourAnswer: "This is the contrast rep. INNER JOIN is correct for existing matches but wrong when the product question is about missing work."
  }
];

const aiRetrievalPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "const retrievedIds = ['n1'];\nconst answer = { claims: [{ text: 'Tests passed', citationId: 'n1' }] };\nconsole.log(answer.claims[0].citationId);",
    expectedOutput: "The answer cites n1, which is inside the retrieved note id list.",
    checkYourAnswer: "The claim cites a retrieved note. Change the citation to n2 and the grounding check should reject it."
  },
  {
    starterCode: "const retrievedIds = ['n1'];\nconst answer = { claims: [{ text: 'The app is deployed', citationId: null }] };\nconsole.log(answer.claims[0].citationId);",
    expectedOutput: "null means the claim is unsupported and should not be presented as fact.",
    checkYourAnswer: "Unsupported is a valid safe result. Do not fill in a citation just to make the answer look complete."
  },
  {
    starterCode: "const notes = [{ id: 'n1', text: 'SQLite stores progress locally.' }, { id: 'n2', text: 'Secrets stay server-side.' }];\nconst retrievedIds = ['n2'];",
    expectedOutput: "An answer about secrets may cite n2, but an answer about SQLite should not pretend n2 supports it.",
    checkYourAnswer: "This rep practices topic fit. Grounding is not just citation format; the cited note must support the claim."
  }
];

const securitySecretPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "const settings = ['PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];\nconsole.log(settings);",
    expectedOutput: "PUBLIC_SUPABASE_URL is public config; SUPABASE_SERVICE_ROLE_KEY is secret.",
    checkYourAnswer: "The word public is not magic, but service role power is. Classify by what the value can do if leaked."
  },
  {
    starterCode: "const boundary = { operation: 'read user profile', enforcedAt: 'client' };\nconsole.log(boundary.enforcedAt);",
    expectedOutput: "client is the wrong boundary for authorization.",
    checkYourAnswer: "Client checks can improve UX, but server or database policy must enforce access before data is returned."
  },
  {
    starterCode: "const env = { MAP_TILE_URL: 'https://tiles.example.com', DATABASE_URL: 'postgres://secret' };\nconsole.log(Object.keys(env));",
    expectedOutput: "MAP_TILE_URL can be public; DATABASE_URL must not be bundled.",
    checkYourAnswer: "Ask whether the value only points at a public resource or whether it grants private access."
  }
];

const cloudReleasePracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "const checks = { build: true, tests: true, rollback: false };\nconsole.log(checks);",
    expectedOutput: "Release is blocked because rollback is false.",
    checkYourAnswer: "A rollback note is part of readiness, not paperwork after deploy. Missing rollback should keep the gate closed."
  },
  {
    starterCode: "const checks = { build: true, tests: false, rollback: true };\nconsole.log(checks);",
    expectedOutput: "Release is blocked because tests are false.",
    checkYourAnswer: "This rep prevents build-only thinking. Build success and test success answer different questions."
  },
  {
    starterCode: "const checks = { build: true, tests: true, rollback: true };\nconsole.log(checks);",
    expectedOutput: "Release can proceed because every required gate is true.",
    checkYourAnswer: "All-green means the release is allowed, not guaranteed perfect. The gate controls minimum release evidence."
  }
];

const mlConfusionMatrixPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "const matrix = { tp: 8, fp: 2, fn: 5, tn: 20 };\nconsole.log(matrix.fn);",
    expectedOutput: "The matrix reports 5 false negatives.",
    checkYourAnswer: "False negatives are real positives the model missed. Ask what user harm happens when this number is high."
  },
  {
    starterCode: "const matrix = { tp: 12, fp: 6, fn: 1, tn: 30 };\nconsole.log(matrix.fp);",
    expectedOutput: "The matrix reports 6 false positives.",
    checkYourAnswer: "False positives are negative examples predicted positive. They matter when incorrect alerts or approvals are costly."
  },
  {
    starterCode: "const matrix = { tp: 9, fp: 1, fn: 9, tn: 40 };\nconsole.log(matrix.tp + matrix.fn);",
    expectedOutput: "18 actual positive examples",
    checkYourAnswer: "This rep ties the cells back to the data. Actual positives are true positives plus false negatives."
  }
];

const typescriptRuntimeValidationPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "const payload = { title: 'CLI Study Tracker', proofCount: 2 };\nfunction isMissionCard(value) {\n  return false;\n}\nconsole.log(isMissionCard(payload));",
    expectedOutput: "true for the complete mission-card payload.",
    checkYourAnswer: "A TypeScript type helps your code, but external payloads are just unknown values until a runtime check confirms their shape."
  },
  {
    starterCode: "const payload = { title: 'CLI Study Tracker', proofCount: 'two' };\nfunction isMissionCard(value) {\n  return false;\n}\nconsole.log(isMissionCard(payload));",
    expectedOutput: "false because proofCount is text instead of a number.",
    checkYourAnswer: "This is the important failure case. If the guard accepts proofCount as a string, the UI contract is not actually protected."
  },
  {
    starterCode: "const payload = null;\nfunction isObject(value) {\n  return false;\n}\nconsole.log(isObject(payload));",
    expectedOutput: "false because null is not a usable object payload.",
    checkYourAnswer: "JavaScript has a trap: typeof null is object. A good guard checks value !== null before reading fields."
  }
];

const securityAccessControlPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "const request = { userId: 'u1', resourceOwnerId: 'u1' };\nfunction canReadProfile(req) {\n  return true;\n}\nconsole.log(canReadProfile(request));",
    expectedOutput: "true because the requester owns the profile.",
    checkYourAnswer: "This is the allowed case. Keep it small so the denied case is easier to compare against."
  },
  {
    starterCode: "const request = { userId: 'u1', resourceOwnerId: 'u2' };\nfunction canReadProfile(req) {\n  return true;\n}\nconsole.log(canReadProfile(request));",
    expectedOutput: "false because the requester does not own the profile.",
    checkYourAnswer: "Broken access control often looks like this: the app checks that someone is logged in but forgets to check ownership."
  },
  {
    starterCode: "const request = { userId: 'u1', role: 'user', requiredRole: 'admin' };\nfunction hasRequiredRole(req) {\n  return true;\n}\nconsole.log(hasRequiredRole(request));",
    expectedOutput: "false because a normal user does not satisfy an admin-only operation.",
    checkYourAnswer: "Ownership and role checks are separate questions. Say which one your code is answering."
  }
];

const securityInjectionOutputPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "const comment = '<script>alert(1)</script>';\nfunction escapeHtml(value) {\n  return value;\n}\nconsole.log(escapeHtml(comment));",
    expectedOutput: "The script tags are escaped, not rendered as HTML.",
    checkYourAnswer: "Safe output does not trust stored text just because it already reached your database."
  },
  {
    starterCode: "const name = 'Ada & Grace';\nfunction escapeHtml(value) {\n  return value;\n}\nconsole.log(escapeHtml(name));",
    expectedOutput: "Ada &amp; Grace or an equivalent escaped ampersand.",
    checkYourAnswer: "A safe encoder must preserve normal text while escaping special characters. Do not only test attack-looking input."
  },
  {
    starterCode: "const query = \"python'; DROP TABLE lessons; --\";\nfunction usesParameterizedQuery(sql) {\n  return false;\n}\nconsole.log(usesParameterizedQuery(query));",
    expectedOutput: "The unsafe text is treated as a value, not joined into a SQL command.",
    checkYourAnswer: "This rep is about boundary discipline: values stay values; commands stay commands."
  }
];

const cloudRollbackPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "const release = { version: '1.2.0', previousVersion: '1.1.9', healthCheck: 'failing' };\nfunction rollbackAction(release) {\n  return '';\n}\nconsole.log(rollbackAction(release));",
    expectedOutput: "rollback to 1.1.9 because the health check is failing.",
    checkYourAnswer: "A rollback note must name the exact previous version or action. 'Undo it' is not specific enough."
  },
  {
    starterCode: "const release = { version: '1.2.0', previousVersion: '', healthCheck: 'failing' };\nfunction canRelease(release) {\n  return true;\n}\nconsole.log(canRelease(release));",
    expectedOutput: "false because there is no rollback target.",
    checkYourAnswer: "A release without a rollback target should be blocked before deploy, not discovered after an incident."
  },
  {
    starterCode: "const drill = { trigger: 'error rate > 5%', owner: 'on-call', command: 'deploy previous' };\nconsole.log(drill);",
    expectedOutput: "A rollback drill names trigger, owner, and command.",
    checkYourAnswer: "A useful drill says when to rollback, who acts, and what command or platform action they use."
  }
];

const dataContractsPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "const row = { userId: 'u1', minutes: 30, topic: 'python' };\nfunction isLearningRow(row) {\n  return false;\n}\nconsole.log(isLearningRow(row));",
    expectedOutput: "true because the row has userId, numeric minutes, and topic.",
    checkYourAnswer: "A dataset contract names the fields a report can trust before any aggregation starts."
  },
  {
    starterCode: "const row = { userId: 'u1', minutes: -5, topic: 'python' };\nfunction isLearningRow(row) {\n  return true;\n}\nconsole.log(isLearningRow(row));",
    expectedOutput: "false because minutes cannot be negative.",
    checkYourAnswer: "A fixture should include a bad row on purpose. That proves the contract rejects impossible data."
  },
  {
    starterCode: "const fixture = [{ userId: 'u1', minutes: 30, topic: 'python' }];\nconsole.log(fixture.length);",
    expectedOutput: "1 sample row available for repeatable tests.",
    checkYourAnswer: "Fixtures make tests repeatable. If the only sample is a live export, a reviewer cannot easily reproduce the result."
  }
];

const dataRejectedRowPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "const row = { rowNumber: 2, minutes: '', topic: 'python' };\nfunction rejectionReason(row) {\n  return '';\n}\nconsole.log(rejectionReason(row));",
    expectedOutput: "missing minutes is reported as the rejection reason.",
    checkYourAnswer: "A rejected row needs a reason that tells the data owner what to fix."
  },
  {
    starterCode: "const rejected = [{ rowNumber: 3, raw: 'git,-5', reason: 'negative minutes' }];\nconsole.log(rejected[0].reason);",
    expectedOutput: "negative minutes is reported as the rejection reason.",
    checkYourAnswer: "Keep row number, raw value, and reason together. Without the raw value, debugging becomes guesswork."
  },
  {
    starterCode: "const report = { accepted: 8, rejected: 2, reasons: ['missing topic', 'negative minutes'] };\nconsole.log(report.accepted + report.rejected);",
    expectedOutput: "10 total input rows accounted for.",
    checkYourAnswer: "A quality report should account for accepted plus rejected rows so bad data does not disappear silently."
  }
];

const pythonParserTestPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "def test_parse_second_valid_row():\n    assert parse_row('2026-05-08,git,15')['topic'] == 'git'\n    assert parse_row('2026-05-08,git,15')['minutes'] == 15",
    expectedOutput: "A second clean row passes with topic git and minutes 15.",
    checkYourAnswer: "This repeats the happy path with new data. If the test only passes for python and 30, the parser is memorizing the example instead of parsing rows."
  },
  {
    starterCode: "def test_rejects_missing_topic():\n    result = parse_row('2026-05-08,,15')\n    assert result['error'] == 'topic is required'",
    expectedOutput: "The missing-topic row is rejected with topic is required.",
    checkYourAnswer: "This is a different failure from bad minutes. A useful parser explains which field failed so the user can fix the row."
  },
  {
    starterCode: "def test_parse_file_rows_mixed():\n    accepted, rejected = parse_rows(['2026-05-08,git,15', 'bad-row'])\n    assert len(accepted) == 1\n    assert rejected[0]['error'] == 'expected 3 columns'",
    expectedOutput: "One accepted row and one rejected row are both accounted for.",
    checkYourAnswer: "This is the project-shaped rep: the parser must handle a mixed file, not just one isolated string."
  }
];

const pythonCliArgumentPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "parsed = parse_cli(['--topic', 'git', '--minutes', '15'])\nsummary = f\"{parsed['topic']}: {parsed['minutes']} minutes\"\nprint(summary)",
    expectedOutput: "git: 15 minutes from parsed CLI arguments.",
    checkYourAnswer: "Same idea, new data. If git still prints python, the summary is hardcoded instead of built from parsed arguments."
  },
  {
    starterCode: "try:\n    parse_cli(['--topic', 'git', '--minutes', 'soon'])\nexcept SystemExit:\n    print('bad minutes rejected')",
    expectedOutput: "bad minutes rejected",
    checkYourAnswer: "The failure rep proves type=int is doing real boundary work. Invalid terminal text should not become tracker data."
  },
  {
    starterCode: "command = 'study_tracker --topic sql --minutes 20'\nparsed = parse_cli(['--topic', 'sql', '--minutes', '20'])\nprint(command)\nprint(parsed)",
    expectedOutput: "study_tracker --topic sql --minutes 20\n{'topic': 'sql', 'minutes': 20}",
    checkYourAnswer: "This connects the parser to the real command shape a reviewer would run in the CLI project."
  }
];

const pythonRejectedRowPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "ROWS = ['2026-05-10,python,25', '2026-05-11,git,15']\naccepted, rejected = parse_rows(ROWS)\nprint(len(accepted), len(rejected))",
    expectedOutput: "2 accepted rows and 0 rejected rows.",
    checkYourAnswer: "A good rejected-row reporter also handles the no-error case. Clean files should not invent warnings."
  },
  {
    starterCode: "ROWS = ['2026-05-10,,25']\naccepted, rejected = parse_rows(ROWS)\nprint(rejected[0]['reason'])",
    expectedOutput: "missing topic is recorded as the rejected-row reason.",
    checkYourAnswer: "This failure is different from bad minutes and bad columns. Name the exact field that made the row unusable."
  },
  {
    starterCode: "ROWS = ['2026-05-10,python,25', 'bad-row', '2026-05-11,git,15']\naccepted, rejected = parse_rows(ROWS)\nreport = build_rejected_report(rejected)\nprint(len(accepted))\nprint(report)",
    expectedOutput: "2 accepted rows plus a row-numbered rejected report for bad-row.",
    checkYourAnswer: "This is the project-shaped run: clean data continues while rejected data remains visible and fixable."
  }
];

const professionalProjectStructurePracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "project_files = ['study_tracker/cli.py', 'study_tracker/parser.py', 'study_tracker/reports.py']\nmodule_roles = {'cli': 'parse command arguments'}\nprint(project_files)\nprint(module_roles)",
    expectedOutput: "The package lists cli.py, parser.py, reports.py, and role notes.",
    checkYourAnswer: "Same idea, new data: add models.py and decide whether parsing rows or defining StudySession belongs there."
  },
  {
    starterCode: "module_roles = {'parser': 'parse arguments', 'cli': 'parse rows'}\nprint(module_roles)",
    expectedOutput: "This role map should be rejected because parser and cli responsibilities are swapped.",
    checkYourAnswer: "Failure rep: if parser.py knows argparse, the boundary is leaking. CLI owns command flags; parser owns rows."
  },
  {
    starterCode: "project_files = ['study_tracker/cli.py', 'study_tracker/parser.py', 'study_tracker/models.py', 'study_tracker/reports.py', 'tests/test_parser.py']\nprint('\\n'.join(project_files))",
    expectedOutput: "A project-shaped file tree includes package modules and tests outside package code.",
    checkYourAnswer: "This is the structure a reviewer can navigate before reading implementation details."
  }
];

const professionalLoggingPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "value = '45'\nminutes = parse_minutes(value)\nprint(minutes)",
    expectedOutput: "45 minutes parsed successfully without warning logs.",
    checkYourAnswer: "The success path should stay boring. Logging should not turn normal input into noisy warnings."
  },
  {
    starterCode: "try:\n    parse_minutes('')\nexcept TrackerInputError as error:\n    print(error)",
    expectedOutput: "minutes is required for empty input.",
    checkYourAnswer: "Failure rep: empty input and non-numeric input may need different user-facing messages."
  },
  {
    starterCode: "for value in ['30', 'soon']:\n    try:\n        parse_minutes(value)\n    except TrackerInputError:\n        pass\nprint(logs)",
    expectedOutput: "Logs include the invalid value soon but not the successful value 30.",
    checkYourAnswer: "Project-shaped rep: logs should preserve useful failure context without flooding normal runs."
  }
];

const professionalPytestPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "fixtures = ['clean_rows']\ntests = ['test_summary_totals']\nverification_commands = ['python -m pytest']\nprint(fixtures, tests, verification_commands)",
    expectedOutput: "clean_rows, test_summary_totals, and python -m pytest are listed.",
    checkYourAnswer: "Same idea with the happy-path fixture. It proves the command and behavior name are reproducible."
  },
  {
    starterCode: "fixtures = ['messy_rows']\ntests = ['test_rejected_report']\nverification_commands = []\nprint(fixtures, tests)",
    expectedOutput: "messy_rows and test_rejected_report cover rejected input.",
    checkYourAnswer: "Failure rep: if there is no messy fixture, the test suite does not protect the bad-input behavior."
  },
  {
    starterCode: "verification_commands = ['python -m pytest', 'study-tracker --help', 'study-tracker --input sessions.csv --format json']\nprint(verification_commands)",
    expectedOutput: "The project-shaped command list includes tests plus CLI smoke and JSON output.",
    checkYourAnswer: "Professional evidence combines unit tests with one command that exercises the installed utility."
  }
];

const professionalPyprojectPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "pyproject_toml = '[project]\\nname = \"study-tracker\"\\nversion = \"0.1.0\"\\nrequires-python = \">=3.11\"'\nprint(pyproject_toml)",
    expectedOutput: "[project], name, version, and requires-python are present.",
    checkYourAnswer: "Same metadata idea with a minimal project block. A reviewer should not infer these from filenames."
  },
  {
    starterCode: "pyproject_toml = '[project]\\nname = \"study-tracker\"\\nversion = \"0.1.0\"'\nprint(pyproject_toml)",
    expectedOutput: "This should fail the professional gate because requires-python is missing.",
    checkYourAnswer: "Failure rep: missing Python version requirements make clean-machine setup more ambiguous."
  },
  {
    starterCode: "pyproject_toml = '[project.optional-dependencies]\\ndev = [\"pytest\", \"ruff\"]\\n\\n[tool.pytest.ini_options]\\ntestpaths = [\"tests\"]'\nprint(pyproject_toml)",
    expectedOutput: "Dev dependencies and pytest testpaths are declared for tools.",
    checkYourAnswer: "Project-shaped rep: tool-readable config belongs in pyproject; README prose explains it but does not replace it."
  }
];

const professionalInstallableCliPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "project_scripts = {'study-tracker': 'study_tracker.cli:main'}\nsmoke_command = 'study-tracker --help'\nprint(project_scripts)\nprint(smoke_command)",
    expectedOutput: "study-tracker maps to study_tracker.cli:main and has a --help smoke command.",
    checkYourAnswer: "Same entry point with the expected command. The command name should be stable for reviewers."
  },
  {
    starterCode: "project_scripts = {'study-tracker': 'study_tracker.parser:parse_row'}\nprint(project_scripts)",
    expectedOutput: "This should fail because the console script points at parser logic instead of the CLI main.",
    checkYourAnswer: "Failure rep: entry points should coordinate CLI behavior, not expose an internal helper."
  },
  {
    starterCode: "install_commands = ['python -m pip install -e .', 'study-tracker --help', 'study-tracker --input sessions.csv --format json']\nprint(install_commands)",
    expectedOutput: "Editable install, help smoke, and JSON command are all documented.",
    checkYourAnswer: "Project-shaped rep: installability is proven by installation plus commands a reviewer can rerun."
  }
];

export const contentPack: ContentPack = {
  skills: [
    { id: "skill-git-workflow", slug: "git-workflow", name: "Git workflow", category: "workflow" },
    { id: "skill-python-basics", slug: "python-basics", name: "Python basics", category: "language" },
    { id: "skill-python-functions", slug: "python-functions", name: "Python functions", category: "language" },
    { id: "skill-python-professional", slug: "python-professional", name: "Professional Python", category: "language" },
    { id: "skill-python-integration", slug: "python-integration", name: "Python integration", category: "backend" },
    { id: "skill-typescript-types", slug: "typescript-types", name: "TypeScript types", category: "language" },
    { id: "skill-sql-joins", slug: "sql-joins", name: "SQL joins", category: "data" },
    { id: "skill-api-contracts", slug: "api-contracts", name: "API contracts", category: "backend" },
    { id: "skill-testing-debugging", slug: "testing-debugging", name: "Testing and debugging", category: "workflow" },
    { id: "skill-regression-testing", slug: "regression-testing", name: "Regression testing", category: "workflow" },
    { id: "skill-debugging-log", slug: "debugging-log", name: "Debugging evidence logs", category: "workflow" },
    { id: "skill-threat-modeling", slug: "threat-modeling", name: "Threat modeling", category: "backend" },
    { id: "skill-secret-handling", slug: "secret-handling", name: "Secret handling", category: "backend" },
    { id: "skill-auth-boundaries", slug: "auth-boundaries", name: "Auth boundaries", category: "backend" },
    { id: "skill-dependency-hygiene", slug: "dependency-hygiene", name: "Dependency hygiene", category: "workflow" },
    { id: "skill-cloud-config", slug: "cloud-config", name: "Cloud configuration", category: "backend" },
    { id: "skill-ci-release", slug: "ci-release", name: "CI and release checks", category: "workflow" },
    { id: "skill-observability-cost", slug: "observability-cost", name: "Observability and cost notes", category: "backend" },
    { id: "skill-data-quality", slug: "data-quality", name: "Data quality", category: "data" },
    { id: "skill-data-pipelines", slug: "data-pipelines", name: "Data pipelines", category: "data" },
    { id: "skill-reproducible-report", slug: "reproducible-report", name: "Reproducible reporting", category: "data" },
    { id: "skill-ai-verification", slug: "ai-verification", name: "AI output verification", category: "ai" },
    { id: "skill-portfolio-evidence", slug: "portfolio-evidence", name: "Portfolio evidence", category: "portfolio" },
    { id: "skill-ml-metrics", slug: "ml-metrics", name: "ML metrics", category: "ai" }
  ],
  skillEdges: [
    { fromSkillId: "skill-git-workflow", toSkillId: "skill-portfolio-evidence", relationType: "supports" },
    { fromSkillId: "skill-python-basics", toSkillId: "skill-python-functions", relationType: "prerequisite" },
    { fromSkillId: "skill-python-functions", toSkillId: "skill-python-professional", relationType: "prerequisite" },
    { fromSkillId: "skill-python-professional", toSkillId: "skill-python-integration", relationType: "prerequisite" },
    { fromSkillId: "skill-python-functions", toSkillId: "skill-api-contracts", relationType: "supports" },
    { fromSkillId: "skill-testing-debugging", toSkillId: "skill-ai-verification", relationType: "prerequisite" },
    { fromSkillId: "skill-testing-debugging", toSkillId: "skill-regression-testing", relationType: "extends" },
    { fromSkillId: "skill-regression-testing", toSkillId: "skill-debugging-log", relationType: "supports" },
    { fromSkillId: "skill-sql-joins", toSkillId: "skill-api-contracts", relationType: "supports" },
    { fromSkillId: "skill-api-contracts", toSkillId: "skill-threat-modeling", relationType: "supports" },
    { fromSkillId: "skill-threat-modeling", toSkillId: "skill-secret-handling", relationType: "prerequisite" },
    { fromSkillId: "skill-secret-handling", toSkillId: "skill-auth-boundaries", relationType: "supports" },
    { fromSkillId: "skill-testing-debugging", toSkillId: "skill-dependency-hygiene", relationType: "supports" },
    { fromSkillId: "skill-api-contracts", toSkillId: "skill-cloud-config", relationType: "supports" },
    { fromSkillId: "skill-cloud-config", toSkillId: "skill-ci-release", relationType: "supports" },
    { fromSkillId: "skill-ci-release", toSkillId: "skill-observability-cost", relationType: "extends" },
    { fromSkillId: "skill-sql-joins", toSkillId: "skill-data-quality", relationType: "supports" },
    { fromSkillId: "skill-data-quality", toSkillId: "skill-data-pipelines", relationType: "supports" },
    { fromSkillId: "skill-data-pipelines", toSkillId: "skill-reproducible-report", relationType: "extends" }
  ],
  tracks: [
    {
      id: "track-python",
      slug: "python-fundamentals",
      title: "Python Fundamentals",
      summary: "Small automation, professional structure, typed models, logs, and tests for real project proof.",
      roleTargets: ["Software Foundations", "Backend, APIs & Data Systems"],
      moduleIds: ["module-python-core", "module-python-professional", "module-python-dashboard"],
      accentColor: "#0B2F6A"
    },
    {
      id: "track-typescript",
      slug: "typescript-web",
      title: "TypeScript and Web",
      summary: "Typed UI thinking, API-shaped data, and browser problem solving.",
      roleTargets: ["Software Foundations", "AI Product Engineering"],
      moduleIds: ["module-typescript-core"],
      accentColor: "#2B7BFF"
    },
    {
      id: "track-sql",
      slug: "sql-postgres",
      title: "SQL and Postgres",
      summary: "Queries, joins, schema thinking, and persistence for app builders.",
      roleTargets: ["Backend, APIs & Data Systems", "Secure Software & AppSec"],
      moduleIds: ["module-sql-core"],
      accentColor: "#08234F"
    },
    {
      id: "track-git",
      slug: "git-github",
      title: "Git and GitHub",
      summary: "Repository hygiene, commits, READMEs, issues, and release evidence.",
      roleTargets: ["Software Foundations", "Secure Software & AppSec"],
      moduleIds: ["module-git-core"],
      accentColor: "#1DA28F"
    },
    {
      id: "track-ai-tools",
      slug: "ai-assisted-coding",
      title: "AI-Assisted Coding",
      summary: "Use AI for speed while preserving tests, review, and ownership.",
      roleTargets: ["Software Foundations", "AI Product Engineering"],
      moduleIds: ["module-ai-verification"],
      accentColor: "#1A67E8"
    },
    {
      id: "track-testing-debugging",
      slug: "testing-debugging",
      title: "Testing and Debugging",
      summary: "Regression checks, failure logs, and readable check output before specialization.",
      roleTargets: ["Software Foundations", "Shared Core Readiness"],
      moduleIds: ["module-testing-debugging-core"],
      accentColor: "#6B5B95"
    },
    {
      id: "track-secure-software",
      slug: "secure-software-appsec",
      title: "Secure Software",
      summary: "Threat notes, secret handling, auth boundaries, input validation, dependency hygiene, and safe logging.",
      roleTargets: ["Secure Software & AppSec"],
      moduleIds: ["module-secure-software-core"],
      accentColor: "#8A1C32"
    },
    {
      id: "track-ai-apps",
      slug: "practical-ai-apps",
      title: "Practical AI Apps",
      summary: "Plan RAG, evals, routers, and safety checks without shipping secrets.",
      roleTargets: ["AI Product Engineering", "Backend unlock"],
      moduleIds: ["module-ai-apps"],
      accentColor: "#D1433A"
    },
    {
      id: "track-ml",
      slug: "ml-foundations",
      title: "ML Foundations",
      summary: "Data splits, metrics, error analysis, and responsible model summaries.",
      roleTargets: ["Backend/Data unlock", "ML & Model Literacy"],
      moduleIds: ["module-ml-core"],
      accentColor: "#157A6E"
    },
    {
      id: "track-cloud-platform-basics",
      slug: "cloud-platform-basics",
      title: "Cloud Platform Basics",
      summary: "Environment config, CI release checks, logs, budgets, and rollback notes for beginner deployable work.",
      roleTargets: ["Backend unlock", "Security unlock"],
      moduleIds: ["module-cloud-platform-core"],
      accentColor: "#4A6FA5"
    },
    {
      id: "track-data-systems",
      slug: "data-systems",
      title: "Data Systems",
      summary: "Data quality, pipeline lineage, reproducible reports, and product-facing data evidence.",
      roleTargets: ["Backend unlock", "Data unlock"],
      moduleIds: ["module-data-systems-core"],
      accentColor: "#2E6F40"
    }
  ],
  modules: [
    {
      id: "module-python-core",
      trackId: "track-python",
      slug: "python-core",
      title: "Python Core",
      summary: "Beginner syntax, debugging, text cleanup, functions, files, tests, and a testable command-line utility.",
      lessonIds: [
        // Level 0 — Environment orientation
        "lesson-python-zero-files-folders",
        "lesson-python-zero-terminal",
        "lesson-python-zero-first-script",
        "lesson-python-zero-change-rerun",
        "lesson-python-zero-first-error",
        // Level 1 — Values and output (micro-lessons)
        "lesson-python-literals",
        "lesson-python-assignment",
        "lesson-python-print-values",
        "lesson-python-numbers",
        "lesson-python-strings",
        "lesson-python-string-indexing",
        "lesson-python-fstrings",
        // Level 2 — Collections, decisions, loops, capstone
        "lesson-python-lists",
        "lesson-python-dicts",
        "lesson-python-mutability",
        "lesson-python-list-of-dicts",
        "lesson-python-strings-cleanup",
        "lesson-python-decisions",
        "lesson-python-truthiness",
        "lesson-python-loops",
        "lesson-python-foundation-capstone",
        "lesson-python-module-guard",
        // Level 3 — Functions (micro-lessons)
        "lesson-python-why-functions",
        "lesson-python-def-call",
        "lesson-python-parameters",
        "lesson-python-return",
        "lesson-python-print-vs-return",
        "lesson-python-functions-capstone",
        // Level 4 — Debugging (micro-lessons)
        "lesson-python-read-traceback",
        "lesson-python-nameerror",
        "lesson-python-typeerror",
        "lesson-python-valueerror",
        "lesson-python-try-except",
        "lesson-python-breakpoint-debugger",
        "lesson-python-assertions",
        "lesson-python-debugging-capstone",
        // Level 5+ — Import, files, parser, CLI, portfolio
        "lesson-python-import",
        "lesson-python-file-input",
        "lesson-python-parser-tests",
        "lesson-python-cli-arguments",
        "lesson-python-file-backed-cli",
        "lesson-python-cli-polish",
        "lesson-python-output-file",
        "lesson-python-rejected-row-report",
        "lesson-python-portfolio-proof",
        "lesson-python-core-review"
      ],
      projectMissionIds: ["mission-cli-study-tracker", "mission-python-data-cleaner"],
      skillIds: ["skill-python-basics", "skill-python-functions", "skill-testing-debugging"],
      sortOrder: 1
    },
    {
      id: "module-python-professional",
      trackId: "track-python",
      slug: "python-professional",
      title: "Professional Python Utility",
      summary: "Structure, typed models, JSON reports, logging, packaging, configuration, and CI evidence for reviewable Python work.",
      lessonIds: ["lesson-python-project-structure", "lesson-python-dataclass-models", "lesson-python-json-reports", "lesson-python-logging-errors", "lesson-python-pytest-ci", "lesson-python-pyproject-metadata", "lesson-python-installable-cli", "lesson-python-virtual-env", "lesson-python-config-files", "lesson-python-ci-precommit", "lesson-python-professional-review"],
      projectMissionIds: ["mission-professional-python-utility"],
      skillIds: ["skill-python-professional", "skill-python-functions", "skill-testing-debugging", "skill-portfolio-evidence"],
      sortOrder: 2
    },
    {
      id: "module-python-dashboard",
      trackId: "track-python",
      slug: "python-dashboard",
      title: "Python Study Dashboard",
      summary: "SQLite persistence, API sync, object-oriented services, regex validation, and a complete dashboard proof artifact.",
      lessonIds: ["lesson-python-type-hints", "lesson-python-regex-validation", "lesson-python-oop-service", "lesson-python-sqlite-persistence", "lesson-python-api-client", "lesson-python-testing-mocks", "lesson-python-integration-capstone", "lesson-python-integration-review"],
      projectMissionIds: ["mission-python-integration-service"],
      skillIds: ["skill-python-integration", "skill-python-professional", "skill-testing-debugging", "skill-api-contracts", "skill-sql-joins"],
      sortOrder: 3
    },
    {
      id: "module-python-api-resilience",
      trackId: "track-python",
      slug: "python-api-resilience",
      title: "API Resilience & Retry",
      summary: "Retry logic, rate limiting, caching, and circuit breaker patterns for professional resilient Python services.",
      lessonIds: ["lesson-python-api-retry", "lesson-python-rate-limiting", "lesson-python-api-caching", "lesson-python-circuit-breaker", "lesson-python-resilience-slice1", "lesson-python-resilience-slice2"],
      projectMissionIds: ["mission-python-api-resilience"],
      skillIds: ["skill-python-integration", "skill-api-contracts", "skill-testing-debugging"],
      sortOrder: 4
    },
    {
      id: "module-python-ops",
      trackId: "track-python",
      slug: "python-ops",
      title: "Operations & CI/CD",
      summary: "Environment configuration, secrets management, CI workflows, deployment strategies, and monitoring for professional Python.",
      lessonIds: ["lesson-python-env-config", "lesson-python-ci-workflow", "lesson-python-secrets-management", "lesson-python-deployment-strategies", "lesson-python-monitoring-basics", "lesson-python-ops-slice1"],
      projectMissionIds: ["mission-python-ops"],
      skillIds: ["skill-python-professional", "skill-secret-handling", "skill-ci-release"],
      sortOrder: 5
    },
    {
      id: "module-typescript-core",
      trackId: "track-typescript",
      slug: "typescript-core",
      title: "TypeScript App Thinking",
      summary: "Model domain objects before wiring screens.",
      lessonIds: ["lesson-typescript-contracts", "lesson-typescript-runtime-validation", "lesson-typescript-events-state"],
      projectMissionIds: ["mission-web-progress-board", "mission-api-contract-playground"],
      skillIds: ["skill-typescript-types", "skill-api-contracts"],
      sortOrder: 1
    },
    {
      id: "module-sql-core",
      trackId: "track-sql",
      slug: "sql-core",
      title: "SQL for App State",
      summary: "Use joins to answer product questions from normalized data.",
      lessonIds: ["lesson-sql-joins", "lesson-sql-constraints", "lesson-sql-group-aggregate", "lesson-sql-indexes-transactions"],
      projectMissionIds: ["mission-sql-portfolio-ledger", "mission-job-tracker-schema"],
      skillIds: ["skill-sql-joins"],
      sortOrder: 1
    },
    {
      id: "module-git-core",
      trackId: "track-git",
      slug: "git-core",
      title: "GitHub Evidence",
      summary: "Turn local work into proof a reviewer can inspect.",
      lessonIds: ["lesson-git-evidence", "lesson-github-review-flow", "lesson-git-branching-merge", "lesson-git-undo-recovery"],
      projectMissionIds: ["mission-portfolio-readme"],
      skillIds: ["skill-git-workflow", "skill-portfolio-evidence"],
      sortOrder: 1
    },
    {
      id: "module-ai-verification",
      trackId: "track-ai-tools",
      slug: "ai-verification",
      title: "AI With Verification",
      summary: "Use model help while keeping tests and source custody.",
      lessonIds: ["lesson-ai-test-loop", "lesson-ai-diff-review", "lesson-ai-prompt-contracts", "lesson-ai-hallucination-audit"],
      projectMissionIds: ["mission-ai-bug-rubric", "mission-ai-test-harness"],
      skillIds: ["skill-ai-verification", "skill-testing-debugging"],
      sortOrder: 1
    },
    {
      id: "module-testing-debugging-core",
      trackId: "track-testing-debugging",
      slug: "testing-debugging-core",
      title: "Testing and Debugging",
      summary: "Build a tiny regression harness and a failure log that make debugging visible.",
      lessonIds: ["lesson-testing-regression-harness", "lesson-debugging-failure-log", "lesson-testing-unit-isolation", "lesson-debugging-traceback-triage"],
      projectMissionIds: ["mission-regression-proof-pack"],
      skillIds: ["skill-testing-debugging", "skill-regression-testing", "skill-debugging-log", "skill-portfolio-evidence"],
      sortOrder: 1
    },
    {
      id: "module-secure-software-core",
      trackId: "track-secure-software",
      slug: "secure-software-core",
      title: "Secure Software Practice",
      summary: "Practice concrete AppSec habits: threat modeling, secrets, auth boundaries, validation, dependencies, and logs.",
      lessonIds: ["lesson-security-threat-model", "lesson-security-secrets-auth", "lesson-security-access-control-lab", "lesson-security-input-validation", "lesson-security-injection-output-encoding", "lesson-security-dependency-logging"],
      projectMissionIds: ["mission-secure-review-pack"],
      skillIds: ["skill-threat-modeling", "skill-secret-handling", "skill-auth-boundaries", "skill-dependency-hygiene", "skill-testing-debugging", "skill-portfolio-evidence"],
      sortOrder: 1
    },
    {
      id: "module-ai-apps",
      trackId: "track-ai-apps",
      slug: "ai-apps",
      title: "AI App Foundations",
      summary: "Design AI features behind safe server boundaries.",
      lessonIds: ["lesson-ai-app-boundaries", "lesson-ai-retrieval-grounding", "lesson-ai-vector-embeddings", "lesson-ai-eval-rubrics"],
      projectMissionIds: ["mission-ai-study-planner", "mission-rag-notes-prototype"],
      skillIds: ["skill-ai-verification", "skill-api-contracts"],
      sortOrder: 1
    },
    {
      id: "module-ml-core",
      trackId: "track-ml",
      slug: "ml-core",
      title: "ML Metrics Basics",
      summary: "Explain a model result with splits, metrics, and limits.",
      lessonIds: ["lesson-ml-metrics", "lesson-ml-confusion-matrix", "lesson-ml-data-preprocessing", "lesson-ml-overfitting-regularization"],
      projectMissionIds: ["mission-ml-metrics-report"],
      skillIds: ["skill-ml-metrics", "skill-testing-debugging"],
      sortOrder: 1
    },
    {
      id: "module-cloud-platform-core",
      trackId: "track-cloud-platform-basics",
      slug: "cloud-platform-core",
      title: "Cloud Platform Practice",
      summary: "Prepare deployable work with environment config, CI release checks, logs, budget notes, and rollback evidence.",
      lessonIds: ["lesson-cloud-env-config", "lesson-cloud-ci-deploy-checks", "lesson-cloud-rollback-drill", "lesson-cloud-logs-costs"],
      projectMissionIds: ["mission-cloud-release-runbook"],
      skillIds: ["skill-cloud-config", "skill-ci-release", "skill-observability-cost", "skill-portfolio-evidence"],
      sortOrder: 1
    },
    {
      id: "module-data-systems-core",
      trackId: "track-data-systems",
      slug: "data-systems-core",
      title: "Data Systems Practice",
      summary: "Turn messy records into quality checks, lineage notes, and reproducible product-facing reports.",
      lessonIds: ["lesson-data-quality-rules", "lesson-data-contracts-fixtures", "lesson-data-rejected-row-proof", "lesson-data-pipeline-lineage", "lesson-data-reproducible-report"],
      projectMissionIds: ["mission-data-quality-report"],
      skillIds: ["skill-data-quality", "skill-data-pipelines", "skill-reproducible-report", "skill-sql-joins", "skill-portfolio-evidence"],
      sortOrder: 1
    }
  ],
  lessons: [
    ...level0Lessons,
    ...level1Lessons,
    ...deprecatedLevel1Lessons,
    ...level2Lessons,
    ...level3Lessons,
    ...deprecatedLevel3Lessons,
    {
      id: "lesson-typescript-contracts",
      moduleId: "module-typescript-core",
      slug: "typescript-contracts",
      title: "Types Before Screens",
      summary: "Define app data contracts before UI layout.",
      bodyMarkdown: "A type is a promise between data and UI. If a readiness card needs a score, label, and evidence count, model those fields before arranging the card.",
      estimatedMinutes: 7,
      difficulty: "foundation",
      skillIds: ["skill-typescript-types", "skill-api-contracts"],
      quizId: "quiz-typescript-contracts",
      desktopTask: "Define a ProjectMission type with deliverables and acceptance criteria.",
      evidencePrompt: "Save the type definition and one example object that typechecks.",
      workshop: workshop(
        "Model screen data before designing the screen.",
        "Typed contracts keep project boards from becoming hardcoded card collections.",
        "A type names the fields the UI is allowed to trust. Validation still belongs at the boundary when data is external.",
        "type MissionCard = { title: string; proofCount: number; nextAction: string } gives the UI a small stable contract.",
        "Define a typed object for one progress card and render it from data rather than literals.",
        "This prepares the Typed Progress Board and API Contract Playground missions.",
        "Which UI bug would your type prevent before runtime?",
        ["Using any for external data", "Embedding progress values inside JSX", "Adding fields only after the UI breaks"],
        {
          language: "TypeScript",
          tools: ["TypeScript", "React or Expo", "typecheck"],
          synopsis: "You are learning to describe app data before building screens, so the UI has a clear contract instead of scattered hardcoded values.",
          prerequisites: ["Know that TypeScript adds types to JavaScript.", "Have one simple card or object in mind, such as a mission progress card."],
          testingFocus: "You will test the contract by creating an example object that typechecks and would fail if a required field is missing."
        },
        {
          starterCode: "type MissionCard = {\n  title: string;\n  proofCount: number;\n  nextAction: string;\n};\n\nconst card: MissionCard = {\n  title: \"CLI Study Tracker\",\n  proofCount: 2,\n  nextAction: \"Add check output\"\n};",
          expectedOutput: "TypeScript accepts the object because every required field has the expected type.",
          checkYourAnswer: "Temporarily remove proofCount or make it a string. The typecheck should fail, which proves the UI contract is doing real work."
        },
        {
          title: "Create a typed mission card contract",
          goal: "Define one TypeScript contract and one example object that a future progress card can render.",
          steps: ["Write a MissionCard type", "Create one valid example object", "Break one field intentionally and confirm typecheck catches it"],
          deliverables: ["MissionCard type", "Valid example object", "Screenshot or note of the failed typecheck experiment"],
          verifierCommand: "npm run typecheck",
          expectedEvidence: "Typecheck result plus the exact field that failed when you broke the contract.",
          projectConnection: "This is a small slice of the Typed Progress Board mission.",
          tester: {
            codeLabel: "Paste your TypeScript contract and example object",
            outputLabel: "Paste typecheck output or your failed-field note",
            requiredCodeIncludes: ["type MissionCard", "proofCount", "nextAction"],
          requiredOutputIncludes: ["typecheck", "proofCount"],
          successMessage: "Your TypeScript proof shows both the contract and the typecheck experiment.",
          failureMessage: "The tester needs the MissionCard contract plus typecheck proof naming the field you broke."
          },
          runnerSpec: {
            language: "typescript",
            starterCode: "type MissionCard = {\n  title: string;\n  proofCount: number;\n  nextAction: string;\n};\n\nconst card: MissionCard = {\n  title: \"CLI Study Tracker\",\n  proofCount: 2,\n  nextAction: \"Add check output\"\n};",
            visibleTests: [
              {
                id: "card-has-required-data",
                name: "Card has required data",
                code: "if (card.title !== 'CLI Study Tracker') throw new Error('title mismatch');\nif (card.proofCount !== 2) throw new Error('proofCount mismatch');\nif (!card.nextAction.includes('check')) throw new Error('nextAction should name check work');\nconsole.log('typecheck proofCount contract passed');",
                expectedOutputIncludes: ["typecheck", "proofCount", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["typecheck", "proofCount", "passed"]
          }
        },
        typescriptContractPracticeReps
      )
    },
    proofLesson({
      id: "lesson-typescript-runtime-validation",
      moduleId: "module-typescript-core",
      slug: "typescript-runtime-validation",
      title: "Runtime Validation for External Data",
      summary: "Check unknown payloads before typed UI code trusts them.",
      bodyMarkdown: "TypeScript catches mistakes inside your code, but it cannot guarantee that a saved file, API response, or pasted JSON has the shape you expected. Runtime validation is the doorway check: inspect the unknown value, reject missing or wrong fields, then let the rest of the app use the typed shape confidently.",
      estimatedMinutes: 11,
      difficulty: "applied",
      skillIds: ["skill-typescript-types", "skill-api-contracts", "skill-testing-debugging"],
      quizId: "quiz-typescript-runtime-validation",
      desktopTask: "Write a small runtime guard for a mission-card payload and test one accepted and one rejected object.",
      evidencePrompt: "Capture the guard function, accepted payload, rejected payload, and typecheck or test output.",
      language: "TypeScript",
      tools: ["TypeScript", "runtime guard", "typecheck"],
      synopsis: "You are learning the difference between a type you wrote and an unknown value that arrives from outside your code.",
      prerequisites: ["Know how to define a TypeScript object type.", "Know that API or JSON data can be malformed."],
      testingFocus: "The check confirms that complete payloads pass and malformed payloads fail before UI code trusts them.",
      objective: "Write a runtime guard that accepts a valid mission-card payload and rejects malformed data.",
      whyItMatters: "A typed UI still breaks if external data is trusted without checking its runtime shape.",
      coreConcept: "Static types protect code you compile; runtime validation protects boundaries where unknown data enters the app.",
      workedExample: "A valid card has title as text, proofCount as a number, and nextAction as text; proofCount: 'two' must be rejected.",
      guidedExercise: "Create isMissionCard, test a complete payload, then test one payload with the wrong field type.",
      missionConnection: "This deepens the Typed Progress Board and API Contract Playground missions.",
      reflectionPrompt: "Which field would cause the clearest UI bug if you skipped runtime validation?",
      practiceStarter: "type MissionCard = { title: string; proofCount: number; nextAction: string };\nfunction isMissionCard(value: unknown): value is MissionCard {\n  return false;\n}",
      practiceExpected: "A complete object passes, proofCount as a string fails, and the check prints passed.",
      practiceCheck: "Do not read fields until you know the value is a non-null object. Then check each required field by type.",
      practiceReps: typescriptRuntimeValidationPracticeReps,
      miniTitle: "Guard an external mission card",
      miniGoal: "Create a runtime validation function for one UI payload shape.",
      miniSteps: ["Define the MissionCard type", "Write isMissionCard for unknown values", "Test one valid payload and one malformed payload"],
      miniDeliverables: ["MissionCard type", "Runtime guard", "Accepted and rejected payload tests"],
      verifierCommand: "npm run typecheck or run the Code Lab check.",
      expectedEvidence: "Runtime guard code plus output showing a valid payload accepted and malformed payload rejected.",
      projectConnection: "This is the boundary check for API-shaped progress data.",
      requiredCodeIncludes: ["isMissionCard", "proofCount", "unknown"],
      requiredOutputIncludes: ["passed"],
      runnerLanguage: "typescript",
      runnerStarterCode: "type MissionCard = { title: string; proofCount: number; nextAction: string };\n\nfunction isMissionCard(value: unknown): value is MissionCard {\n  return false;\n}\n\nconst validPayload = { title: 'CLI Study Tracker', proofCount: 2, nextAction: 'Add output' };\nconst invalidPayload = { title: 'CLI Study Tracker', proofCount: 'two', nextAction: 'Add output' };",
      runnerTestCode: "if (!isMissionCard(validPayload)) throw new Error('valid payload should pass');\nif (isMissionCard(invalidPayload)) throw new Error('string proofCount should fail');\nif (isMissionCard(null)) throw new Error('null should fail');\nconsole.log('runtime validation passed');"
    }),
    ...level4Lessons,
    ...deprecatedLevel4Lessons,
    ...level5Lessons,
    ...level6Lessons,
    ...level7Lessons,
    ...level8Lessons,
    ...level9Lessons,
    {
      id: "lesson-sql-joins",
      moduleId: "module-sql-core",
      slug: "sql-joins",
      title: "Joins That Answer Product Questions",
      summary: "Use joins to connect evidence to missions and skills.",
      bodyMarkdown: "Normalized tables become useful when joins answer a real question. Ask which missions have evidence, which skills they prove, and what remains stale.",
      estimatedMinutes: 9,
      difficulty: "applied",
      skillIds: ["skill-sql-joins"],
      quizId: "quiz-sql-joins",
      desktopTask: "Sketch a SQL query that lists missions with zero evidence items.",
      evidencePrompt: "Keep the query, expected rows, and a short note about why the join direction matters.",
      workshop: workshop(
        "Use joins to answer one product question from normalized tables.",
        "Career-readiness apps need queries that find missing proof, stale work, and skill gaps.",
        "The table you start from changes what missing data you can see. LEFT JOIN from missions can reveal missions with no evidence.",
        "SELECT m.title FROM missions m LEFT JOIN evidence e ON e.mission_id = m.id WHERE e.id IS NULL;",
        "Write one query that finds project missions with no check-backed evidence.",
        "This prepares the Portfolio Evidence Ledger and Job Tracker Schema missions.",
        "Why would an INNER JOIN hide the exact gap you need to see?",
        ["Starting from evidence when you need missing missions", "Forgetting null checks", "Writing queries with no sample rows"],
        {
          language: "SQL",
          tools: ["SQLite or Postgres", "sample tables", "query runner"],
          synopsis: "You are learning how joins connect separate tables so you can answer a product question, especially which records are missing proof.",
          prerequisites: ["Know that tables store rows and columns.", "Have two sample tables in mind, such as missions and evidence."],
          testingFocus: "You will test the query against sample rows where one mission has evidence and one mission has none."
        },
        {
          starterCode: "SELECT m.title\nFROM missions m\nLEFT JOIN evidence e ON e.mission_id = m.id\nWHERE e.id IS NULL;",
          expectedOutput: "Only missions with no matching evidence rows should appear.",
          checkYourAnswer: "If missions with evidence still appear, your join condition is wrong. If missing missions disappear, you probably used INNER JOIN."
        },
        {
          title: "Find missions with missing proof",
          goal: "Create sample SQL tables and write a query that reveals which missions have no evidence.",
          steps: ["Create or sketch missions and evidence rows", "Include one mission with evidence and one without", "Run a LEFT JOIN query that returns only the missing-proof mission"],
          deliverables: ["Sample rows", "SQL query", "Expected result rows"],
          verifierCommand: "Run the query in SQLite or Postgres.",
          expectedEvidence: "Query text and output showing only the mission with no evidence.",
          projectConnection: "This is the gap-finding query for the Portfolio Evidence Ledger mission.",
          tester: {
            codeLabel: "Paste your SQL query",
            outputLabel: "Paste query result rows",
            requiredCodeIncludes: ["LEFT JOIN", "WHERE", "IS NULL"],
          requiredOutputIncludes: ["no evidence"],
          successMessage: "Your SQL proof uses a left join to reveal missing evidence.",
          failureMessage: "The tester needs a LEFT JOIN / IS NULL query and output naming the missing-evidence mission."
          },
          runnerSpec: {
            language: "sql",
            setupCode: "CREATE TABLE missions (id TEXT, title TEXT);\nCREATE TABLE evidence (id TEXT, mission_id TEXT);\nINSERT INTO missions VALUES ('m1', 'has evidence'), ('m2', 'no evidence');\nINSERT INTO evidence VALUES ('e1', 'm1');",
            starterCode: "SELECT m.title\nFROM missions m\nLEFT JOIN evidence e ON e.mission_id = m.id\nWHERE e.id IS NULL;",
            visibleTests: [
              {
                id: "returns-missing-evidence",
                name: "Returns only missions with no evidence",
                code: "EXPECT_ROWS:no evidence",
                expectedOutputIncludes: ["no evidence"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["no evidence"]
          }
        }
        ,
        sqlJoinPracticeReps
      )
    },
    {
      id: "lesson-git-evidence",
      moduleId: "module-git-core",
      slug: "git-evidence",
      title: "Evidence A Reviewer Can Trust",
      summary: "A repo proves more when setup, tests, and screenshots are easy to inspect.",
      bodyMarkdown: "A portfolio repo should answer what it does, how to run it, how it was verified, and what is intentionally unfinished.",
      estimatedMinutes: 6,
      difficulty: "foundation",
      skillIds: ["skill-git-workflow", "skill-portfolio-evidence"],
      quizId: "quiz-git-evidence",
      desktopTask: "Add a README verification section to one practice repo.",
      evidencePrompt: "Link the commit and record the exact command that passed or failed.",
      workshop: workshop(
        "Make one repo understandable and verifiable for a reviewer.",
        "GitHub evidence only helps if the reviewer can reproduce your claims.",
        "A strong repo has a clear problem statement, setup command, verification command, sample output, and known gaps.",
        "Verification: npm run test -> 9 passed; Known gaps: no auth, no deployment.",
        "Add or improve the verification section in one README.",
        "This directly supports Portfolio README Upgrade and every portfolio mission.",
        "What proof would make this repo trustworthy to someone who has never met you?",
        ["Writing only feature lists", "No run command", "No known gaps"],
        {
          language: "Markdown and Git",
          tools: ["GitHub", "README", "commit history"],
          synopsis: "You are learning how to make a repo understandable to a reviewer by showing setup, verification, sample output, and honest gaps.",
          prerequisites: ["Have or create a practice repo.", "Know how to edit a README file."],
          testingFocus: "You will test whether the repo is reviewer-ready by linking a commit and recording the exact command that passed or failed."
        },
        {
          starterCode: "## Verification\n\nCommand:\n```bash\nnpm run test\n```\n\nResult:\n```text\n9 passed\n```\n\nKnown gaps:\n- No deployment yet.\n- Test data is local only.",
          expectedOutput: "A reviewer can see the command, the result, and the current limits without digging through your commit history.",
          checkYourAnswer: "Your README should answer: what does it do, how do I run it, how was it verified, and what is intentionally unfinished?"
        },
        {
          title: "Upgrade one repo README",
          goal: "Make one practice repo inspectable by adding verification and known-gaps sections.",
          steps: ["Add setup and run commands", "Add exact check output", "Add known gaps that are honest but not self-sabotaging"],
          deliverables: ["README diff", "Commit or local note", "Check output"],
          verifierCommand: "git diff -- README.md",
          expectedEvidence: "README diff or commit link showing verification and known-gaps sections.",
          projectConnection: "This is the smallest useful slice of the Portfolio README Upgrade mission.",
          tester: {
            codeLabel: "Paste README diff or updated sections",
            outputLabel: "Paste check output or git diff summary",
            requiredCodeIncludes: ["Verification", "Known gaps"],
          requiredOutputIncludes: ["passed"],
          successMessage: "Your repo proof includes check output and honest known gaps.",
          failureMessage: "The tester needs README verification/known-gaps text plus passing check output."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "const readme = `# Practice Repo\n\n## Verification\nnpm run test\n9 passed\n\n## Known gaps\nNo deployment yet.`;",
            visibleTests: [
              {
                id: "repo-readme-verifiable",
                name: "Repo README is verifiable",
                code: "for (const phrase of ['Verification', 'Known gaps', 'passed']) {\n  if (!readme.includes(phrase)) throw new Error(`missing ${phrase}`);\n}\nconsole.log('passed repo README verifier');",
                expectedOutputIncludes: ["passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["passed"]
          }
        }
      )
    },
    {
      id: "lesson-ai-test-loop",
      moduleId: "module-ai-verification",
      slug: "ai-test-loop",
      title: "Use AI Without Surrendering Judgment",
      summary: "Treat model output as a draft until tests and inspection prove it.",
      bodyMarkdown: "AI can suggest a fix quickly, but ownership starts when you reproduce the issue, inspect the diff, and run the verifier yourself.",
      estimatedMinutes: 8,
      difficulty: "applied",
      skillIds: ["skill-ai-verification", "skill-testing-debugging"],
      quizId: "quiz-ai-test-loop",
      desktopTask: "Ask an AI for a test idea, then write your own final assertion and explain the difference.",
      evidencePrompt: "Store the prompt summary, final test, and check output.",
      workshop: workshop(
        "Use AI output as a draft while keeping verification custody.",
        "Employable AI-assisted engineers can explain why a suggested change is correct, not just who suggested it.",
        "The loop is reproduce, ask, inspect, edit, verify, then record evidence.",
        "An AI suggests a null check; you add a regression test and only accept the fix after the test fails then passes.",
        "Ask for one test idea, write your own final assertion, and record the check output.",
        "This prepares the AI Bug Review Rubric and AI Prompt Verification Harness missions.",
        "Where did your judgment change the model's suggestion?",
        ["Accepting plausible code", "Skipping reproduction", "Recording the prompt but not the verifier"],
        {
          language: "AI-assisted coding",
          tools: ["AI chat", "test runner", "diff review"],
          synopsis: "You are learning how to use AI as a draft partner while keeping ownership of the final test, code, and evidence.",
          prerequisites: ["Have a small bug, behavior, or test idea to inspect.", "Know how to run the verifier for the project."],
          testingFocus: "You will test the AI suggestion by reproducing the issue, writing or improving an assertion, and capturing check output yourself."
        },
        {
          starterCode: "AI suggestion: \"Add a null check before reading user.name.\"\n\nYour final test idea:\n- Given a user without a name\n- When the formatter runs\n- Then it returns \"Unknown user\" instead of crashing",
          expectedOutput: "A final assertion written in your words, plus check output that proves the behavior.",
          checkYourAnswer: "Do not accept the AI suggestion until you can explain the failing case and show the test passing after your edit."
        },
        {
          title: "Verify one AI-generated test idea",
          goal: "Use AI for a draft test idea, then rewrite and verify the final assertion yourself.",
          steps: ["Ask AI for one test idea", "Rewrite the assertion in your own words", "Run the verifier and record what changed from the AI draft"],
          deliverables: ["Prompt summary", "Final assertion", "Check output and judgment note"],
          verifierCommand: "Run the relevant project test command.",
          expectedEvidence: "Final test plus check output, with a short note explaining what you changed from the AI prompt.",
          projectConnection: "This rehearses the AI Prompt Verification Harness mission.",
          tester: {
            codeLabel: "Paste your final assertion and judgment note",
            outputLabel: "Paste check output",
            requiredCodeIncludes: ["assert", "AI"],
          requiredOutputIncludes: ["passed"],
          successMessage: "Your AI-assisted proof keeps ownership in your final assertion and check output.",
          failureMessage: "The tester needs a final assertion, a note about the AI draft, and passing check output."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "function formatUser(user) {\n  return user.name;\n}\n\n// Fix formatUser, then keep this note honest.\nconst aiJudgmentNote = 'AI suggested a null check; I verified the fallback behavior.';",
            visibleTests: [
              {
                id: "ai-suggestion-verified",
                name: "AI suggestion is verified with a real assertion",
                code: "if (formatUser({}) !== 'Unknown user') throw new Error('missing fallback');\nif (!aiJudgmentNote.includes('AI')) throw new Error('missing AI judgment note');\nconsole.log('passed AI verification');",
                expectedOutputIncludes: ["passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["passed"]
          }
        }
      )
    },
    {
      id: "lesson-ai-app-boundaries",
      moduleId: "module-ai-apps",
      slug: "ai-app-boundaries",
      title: "AI App Boundary Rules",
      summary: "Keep secrets and privileged AI calls out of the mobile client.",
      bodyMarkdown: "A mobile app may hold public configuration, but vendor keys and privileged actions belong behind a server boundary with logging and rate controls.",
      estimatedMinutes: 8,
      difficulty: "applied",
      skillIds: ["skill-ai-verification", "skill-api-contracts"],
      quizId: "quiz-ai-app-boundaries",
      desktopTask: "Draw the request path for a future AI mentor feature without putting secrets in the app.",
      evidencePrompt: "Save the diagram or notes and list which values may be public.",
      workshop: workshop(
        "Draw an AI feature boundary that keeps secrets and privileged actions off the phone.",
        "Mobile bundles can be inspected, so AI provider keys and privileged scoring logic need a server boundary.",
        "The client can send user intent and receive bounded results; the server owns secrets, logging, rate limits, and eval checks.",
        "Mobile -> API route -> model provider; API route stores audit metadata and strips unsupported claims before returning.",
        "Sketch one request path and label public config, private secrets, and verifier/eval checks.",
        "This prepares AI Study Planner Boundary Map and RAG Notes Search Prototype.",
        "Which value in your design must never ship inside the app bundle?",
        ["Putting vendor keys in client code", "Letting AI directly mutate readiness", "No eval or logging point"],
        {
          language: "Mobile architecture",
          tools: ["Expo or mobile app", "API boundary", "diagram or notes"],
          synopsis: "You are learning where AI requests belong in a mobile app so secrets, privileged logic, and audit checks stay off the client.",
          prerequisites: ["Know that mobile app bundles can be inspected.", "Have a rough idea for an AI feature such as a study planner or mentor."],
          testingFocus: "You will test the design by labeling which values are public, which are private, and where verification or logging happens."
        },
        {
          starterCode: "Mobile app -> /api/mentor-plan -> AI provider\n\nPublic on phone:\n- user goal\n- selected track id\n\nPrivate on server:\n- provider API key\n- rate limits\n- audit logs",
          expectedOutput: "The phone never contains provider secrets, and the server owns the privileged AI call plus logging.",
          checkYourAnswer: "If a value would let someone spend money, impersonate the app, or bypass checks, it belongs behind the server boundary."
        },
        {
          title: "Draw an AI boundary map",
          goal: "Map one mobile AI feature so public inputs, private secrets, and verification points are obvious.",
          steps: ["Pick one AI feature such as mentor planning", "Draw client, API, provider, and logging boxes", "Label public values and server-only values"],
          deliverables: ["Boundary diagram or note", "Public/private value list", "One verifier or logging checkpoint"],
          verifierCommand: "Review the diagram and confirm no provider secret is listed under the mobile app.",
          expectedEvidence: "A diagram or text map that clearly keeps secrets and privileged checks behind the API boundary.",
          projectConnection: "This is the foundation for AI Study Planner Boundary Map and RAG Notes Search Prototype.",
          tester: {
            codeLabel: "Paste your boundary map",
            outputLabel: "Paste your review result",
            requiredCodeIncludes: ["Mobile app", "API", "provider", "server"],
          requiredOutputIncludes: ["no provider secret"],
          successMessage: "Your boundary proof keeps secrets behind the server boundary.",
          failureMessage: "The tester needs a client/API/provider map and review output confirming no provider secret is on the phone."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "const boundary = {\n  mobile: ['user goal', 'selected track id'],\n  server: ['provider API key', 'rate limits', 'audit logs'],\n  provider: ['model call']\n};",
            visibleTests: [
              {
                id: "secrets-stay-server-side",
                name: "Secrets stay behind API boundary",
                code: "if (!boundary.server.includes('provider API key')) throw new Error('server must own provider key');\nif (boundary.mobile.includes('provider API key')) throw new Error('provider secret leaked to mobile');\nconsole.log('no provider secret on mobile passed');",
                expectedOutputIncludes: ["no provider secret", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["no provider secret", "passed"]
          }
        }
      )
    },
    {
      id: "lesson-ml-metrics",
      moduleId: "module-ml-core",
      slug: "ml-metrics",
      title: "Metrics Need Context",
      summary: "A model score is only useful when you know the split, metric, and failure cases.",
      bodyMarkdown: "Accuracy can hide weak spots. Always ask what was measured, what data was held out, and which examples failed.",
      estimatedMinutes: 7,
      difficulty: "foundation",
      skillIds: ["skill-ml-metrics", "skill-testing-debugging"],
      quizId: "quiz-ml-metrics",
      desktopTask: "Write a short model-card note for a toy classifier result.",
      evidencePrompt: "Capture the metric, sample size, and one known limitation.",
      workshop: workshop(
        "Explain one model result without overclaiming it.",
        "Practical AI work needs engineers who can read metrics and spot weak evidence.",
        "A metric needs context: split, sample size, target label, failure examples, and limits.",
        "Accuracy 92% on 50 examples is weaker than it sounds if the minority class only had 3 examples.",
        "Write a model-card note with metric, sample size, split, one failure, and one limitation.",
        "This prepares the ML Metrics Report mission.",
        "What would make this model result untrustworthy in production?",
        ["Reporting accuracy alone", "No failure example", "No sample-size context"],
        {
          language: "Machine learning evaluation",
          tools: ["model card note", "metrics", "sample results"],
          synopsis: "You are learning how to explain a model score with enough context that a reader knows what was measured and what could still fail.",
          prerequisites: ["Know that a model makes predictions on examples.", "Have a toy metric or sample result to describe."],
          testingFocus: "You will test whether the metric claim is honest by naming the split, sample size, failure example, and limitation."
        },
        {
          starterCode: "Metric: accuracy = 92%\nSample size: 50 examples\nSplit: held-out test set\nKnown failure: misses short notes with abbreviations\nLimit: minority class has 3 examples",
          expectedOutput: "A metric note that includes score, sample size, split, one failure example, and one limitation.",
          checkYourAnswer: "If the note only says 92% accuracy, it is not enough. Add the context a reviewer needs to judge the claim."
        },
        {
          title: "Write a model metric card",
          goal: "Turn one model score into an honest evaluation note with context and limits.",
          steps: ["Record the metric, sample size, and split", "Add one failure example", "Add one limitation and one next evaluation you would run"],
          deliverables: ["Metric card note", "Failure example", "Limitation and next-check note"],
          verifierCommand: "Review the note and confirm it includes score, split, sample size, failure, and limitation.",
          expectedEvidence: "A model-card style note that makes the metric claim inspectable.",
          projectConnection: "This is the mini version of the ML Metrics Report mission.",
          tester: {
            codeLabel: "Paste your metric card note",
            outputLabel: "Paste your checklist review",
            requiredCodeIncludes: ["accuracy", "sample size", "split", "failure", "limitation"],
          requiredOutputIncludes: ["score", "split", "sample size", "failure", "limitation"],
          successMessage: "Your metric card proof gives the score enough context to inspect.",
          failureMessage: "The tester needs metric context in the note and checklist output covering score, split, sample size, failure, and limitation."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "const metricCard = {\n  score: 'accuracy = 92%',\n  sampleSize: 50,\n  split: 'held-out test set',\n  failure: 'misses short notes with abbreviations',\n  limitation: 'minority class has 3 examples'\n};",
            visibleTests: [
              {
                id: "metric-card-has-context",
                name: "Metric card has context",
                code: "for (const key of ['score', 'sampleSize', 'split', 'failure', 'limitation']) {\n  if (!metricCard[key]) throw new Error(`missing ${key}`);\n}\nconsole.log('score split sample size failure limitation passed');",
                expectedOutputIncludes: ["score", "split", "sample size", "failure", "limitation"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["score", "split", "sample size", "failure", "limitation"]
          }
        }
      )
    },
    {
      id: "lesson-typescript-events-state",
      moduleId: "module-typescript-core",
      slug: "typescript-events-state",
      title: "Typed Events Change State",
      summary: "Model user actions as typed events so UI state changes stay reviewable.",
      bodyMarkdown: "A screen is easier to test when every button press becomes a small typed event and one reducer decides how state changes. This keeps UI rendering separate from business rules.",
      estimatedMinutes: 11,
      difficulty: "applied",
      skillIds: ["skill-typescript-types", "skill-api-contracts", "skill-testing-debugging"],
      quizId: "quiz-typescript-events-state",
      desktopTask: "Write a typed reducer for adding and completing one progress task.",
      evidencePrompt: "Save the event type, reducer output, and typecheck or test result.",
      workshop: workshop(
        "Use typed events to update UI state without scattering logic across the screen.",
        "Typed reducers make web and mobile screens easier to test because state changes can be verified without tapping through the UI.",
        "An event is a named action such as addTask or completeTask. A reducer takes the current state and one event, then returns the next state without mutating the original object.",
        "type Event = { type: 'complete'; id: string } lets the reducer handle completion with a known shape.",
        "Create a TaskState type, an Event union, and a reducer that completes one task by id.",
        "This deepens the Typed Progress Board and API Contract Playground missions.",
        "Which state update moved out of the UI and into a testable function?",
        ["Mutating the original state array", "Using stringly typed event names with no union", "Letting UI components decide business rules"],
        {
          language: "TypeScript",
          tools: ["TypeScript", "React or Expo", "typecheck", "unit test"],
          synopsis: "You are learning how a typed UI turns button actions into testable state changes instead of burying logic inside components.",
          prerequisites: ["Know how to define a TypeScript object type.", "Understand that UI state can be represented as plain data."],
          testingFocus: "You will test the reducer by sending a complete event and checking that only the matching task changes."
        },
        {
          starterCode: "type Task = { id: string; title: string; done: boolean };\ntype Event = { type: \"complete\"; id: string };\n\nconst state: Task[] = [{ id: \"t1\", title: \"Run typecheck\", done: false }];\nconst next = reducer(state, { type: \"complete\", id: \"t1\" });\nconsole.log(next);",
          expectedOutput: "The task with id t1 has done: true, and the original state can still be inspected separately.",
          checkYourAnswer: "If state[0].done changed before you assigned next, you mutated the original array. Return a new array so tests and UI updates stay predictable."
        },
        {
          title: "Build a typed task reducer",
          goal: "Create a reducer that completes one task from a typed event without mutating the original state.",
          steps: ["Define Task and Event types", "Implement reducer(state, event)", "Verify completion changes only the matching task"],
          deliverables: ["Task and Event types", "Reducer function", "Check output"],
          verifierCommand: "npm run typecheck or npm test",
          expectedEvidence: "Typecheck or test output plus a short note proving the reducer completes one task without mutating the original state.",
          projectConnection: "This is a testable state-management slice for the Typed Progress Board mission.",
          tester: {
            codeLabel: "Paste your reducer and event types",
            outputLabel: "Paste typecheck or test output",
            requiredCodeIncludes: ["type Event", "reducer", "complete"],
            requiredOutputIncludes: ["passed"],
            successMessage: "Your reducer proof shows a typed event changing state under test.",
            failureMessage: "The tester needs typed event code and check output showing the reducer passed."
          },
          runnerSpec: {
            language: "typescript",
            starterCode: "type Task = { id: string; title: string; done: boolean };\ntype Event = { type: \"complete\"; id: string };\n\nfunction reducer(state: Task[], event: Event): Task[] {\n  return state;\n}\n\nconst before: Task[] = [{ id: \"t1\", title: \"Run typecheck\", done: false }, { id: \"t2\", title: \"Commit proof\", done: false }];\nconst after = reducer(before, { type: \"complete\", id: \"t1\" });",
            visibleTests: [
              {
                id: "typed-event-completes-task",
                name: "Typed event completes the matching task",
                code: "if (after.find((task) => task.id === 't1')?.done !== true) throw new Error('t1 should be complete');\nif (after.find((task) => task.id === 't2')?.done !== false) throw new Error('t2 should stay incomplete');\nif (before[0].done !== false) throw new Error('original state was mutated');\nconsole.log('typed event reducer passed');",
                expectedOutputIncludes: ["typed event", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["typed event", "passed"]
          }
        }
      )
    },
    {
      id: "lesson-sql-constraints",
      moduleId: "module-sql-core",
      slug: "sql-constraints",
      title: "Constraints Protect App Data",
      summary: "Use primary keys, foreign keys, and checks so bad rows fail before reports lie.",
      bodyMarkdown: "Queries are only as trustworthy as the rows underneath them. Constraints make impossible states hard to store, which is simpler than repairing every report later.",
      estimatedMinutes: 11,
      difficulty: "applied",
      skillIds: ["skill-sql-joins", "skill-api-contracts"],
      quizId: "quiz-sql-constraints",
      desktopTask: "Sketch tables for evidence items with a foreign key and one status check.",
      evidencePrompt: "Keep the table definitions, one rejected bad row, and one successful join query.",
      workshop: workshop(
        "Add constraints that keep evidence data consistent before queries run.",
        "Backend and full-stack projects need database rules that reject impossible rows, not just UI code that hopes users behave.",
        "A primary key identifies each row. A foreign key points to a real parent row. A CHECK constraint limits a value to allowed states such as draft, verified, or stale.",
        "CHECK (status IN ('draft', 'verified', 'stale')) prevents a typo like verifed from entering the evidence table.",
        "Create a missions table and an evidence table that rejects evidence for missing missions and invalid statuses.",
        "This deepens the Portfolio Evidence Ledger and Job Tracker Schema missions.",
        "Which bad row should the database reject before a product query ever sees it?",
        ["Storing status as any text", "Skipping foreign keys and trusting app code only", "Testing only successful inserts"],
        {
          language: "SQL and Postgres concepts",
          tools: ["SQLite or Postgres", "schema sketch", "query runner"],
          synopsis: "You are learning how database constraints protect app state so reports about evidence and readiness are based on valid rows.",
          prerequisites: ["Know that tables can reference other tables.", "Understand that app data can become misleading when invalid rows are allowed."],
          testingFocus: "You will test the schema by inserting one valid row and showing one invalid status or missing parent row is rejected."
        },
        {
          starterCode: "CREATE TABLE missions (id TEXT PRIMARY KEY, title TEXT NOT NULL);\nCREATE TABLE evidence (\n  id TEXT PRIMARY KEY,\n  mission_id TEXT NOT NULL REFERENCES missions(id),\n  status TEXT NOT NULL CHECK (status IN ('draft', 'verified', 'stale'))\n);",
          expectedOutput: "A valid evidence row can join back to its mission, while an invalid status such as verifed is rejected.",
          checkYourAnswer: "If every status inserts successfully, the constraint is not protecting the table. If evidence can point to no mission, the relationship is only implied."
        },
        {
          title: "Constrain an evidence table",
          goal: "Create a small evidence schema that accepts valid rows and rejects invalid status values.",
          steps: ["Define mission and evidence tables", "Insert one valid mission and evidence row", "Attempt one invalid status and record the rejection"],
          deliverables: ["Schema SQL", "Valid join output", "Rejected-row evidence"],
          verifierCommand: "Run the schema and insert checks in SQLite or Postgres.",
          expectedEvidence: "Schema text, valid join output, and a rejected invalid-status row showing the database protected the data.",
          projectConnection: "This is the data-integrity slice for the Portfolio Evidence Ledger mission.",
          tester: {
            codeLabel: "Paste your SQL schema",
            outputLabel: "Paste valid join output and rejected-row note",
            requiredCodeIncludes: ["PRIMARY KEY", "REFERENCES", "CHECK"],
            requiredOutputIncludes: ["verified", "rejected"],
            successMessage: "Your SQL proof shows constraints protecting evidence rows.",
            failureMessage: "The tester needs constraint SQL plus output showing a valid row and a rejected bad row."
          },
          runnerSpec: {
            language: "sql",
            setupCode: "CREATE TABLE missions (id TEXT PRIMARY KEY, title TEXT NOT NULL);\nCREATE TABLE evidence (id TEXT PRIMARY KEY, mission_id TEXT NOT NULL REFERENCES missions(id), status TEXT NOT NULL CHECK (status IN ('draft', 'verified', 'stale')));\nINSERT INTO missions VALUES ('m1', 'Typed Progress Board');\nINSERT INTO evidence VALUES ('e1', 'm1', 'verified');",
            starterCode: "SELECT m.title, e.status\nFROM missions m\nJOIN evidence e ON e.mission_id = m.id;",
            visibleTests: [
              {
                id: "valid-evidence-joins",
                name: "Valid evidence joins to mission",
                code: "EXPECT_ROWS:Typed Progress Board|verified",
                expectedOutputIncludes: ["Typed Progress Board", "verified"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["Typed Progress Board", "verified"]
          }
        }
      )
    },
    {
      id: "lesson-github-review-flow",
      moduleId: "module-git-core",
      slug: "github-review-flow",
      title: "Commits Tell a Review Story",
      summary: "Group changes into small commits with messages, diffs, and verification notes a reviewer can follow.",
      bodyMarkdown: "A reviewer should be able to understand why a change exists, what files moved, and what command proved it. Git history is not just backup; it is engineering evidence.",
      estimatedMinutes: 9,
      difficulty: "foundation",
      skillIds: ["skill-git-workflow", "skill-portfolio-evidence"],
      quizId: "quiz-github-review-flow",
      desktopTask: "Draft a commit message and PR checklist for one small practice change.",
      evidencePrompt: "Save the diff summary, commit message, and exact check command.",
      workshop: workshop(
        "Turn a local diff into a reviewable GitHub story.",
        "Career evidence improves when each commit explains one reason, one change, and one verification result.",
        "A good review flow has a scoped branch, a focused diff, a commit message with intent, and a PR note that names tests and risks.",
        "feat: add evidence status filter pairs with npm run test -> 12 passed and a note that deployment was not touched.",
        "Write a commit message and PR checklist for a small change before pretending it is ready.",
        "This deepens the Portfolio README Upgrade mission and supports every future portfolio repo.",
        "What would a reviewer know from your commit message that the diff alone does not explain?",
        ["Bundling unrelated fixes into one commit", "Writing vague messages like update stuff", "Leaving verification out of the PR body"],
        {
          language: "Git and GitHub",
          tools: ["git diff", "commit message", "PR checklist"],
          synopsis: "You are learning how to make GitHub history useful to reviewers by connecting the diff, reason, verifier, and risk note.",
          prerequisites: ["Know that a commit captures a snapshot of changes.", "Have a small practice change or hypothetical diff to describe."],
          testingFocus: "You will test the review story by checking whether the message names intent, scope, verification, and known risk."
        },
        {
          starterCode: "Commit message:\nfeat: add evidence status filter\n\nPR checklist:\n- Scope: filter completed evidence cards only\n- Verification: npm run test -> 12 passed\n- Risk: no storage or API changes",
          expectedOutput: "A reviewer can identify the intent, changed area, verification result, and risk boundary from the notes.",
          checkYourAnswer: "If the message could apply to any project, make it more specific. If the PR note has no command result, the reviewer still has to guess."
        },
        {
          title: "Draft a review-ready commit note",
          goal: "Write a commit message and PR checklist that connect one diff to verifier evidence.",
          steps: ["Summarize the diff in one scope", "Write a commit message with intent", "Add verification and risk notes"],
          deliverables: ["Commit message", "Diff summary", "Verifier and risk checklist"],
          verifierCommand: "Review the note against the checklist.",
          expectedEvidence: "Commit and PR notes that include intent, scope, verification output, and one honest risk boundary.",
          projectConnection: "This is the reviewer-facing workflow behind the Portfolio README Upgrade mission.",
          tester: {
            codeLabel: "Paste your commit message and PR checklist",
            outputLabel: "Paste your checklist review",
            requiredCodeIncludes: ["Verification", "Risk"],
            requiredOutputIncludes: ["passed"],
            successMessage: "Your GitHub story gives a reviewer intent, scope, verification, and risk.",
            failureMessage: "The tester needs a commit/PR note with verification and risk evidence."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "const reviewNote = {\n  commit: 'feat: add evidence status filter',\n  scope: 'filter completed evidence cards only',\n  verification: 'npm run test -> 12 passed',\n  risk: 'no storage or API changes'\n};",
            visibleTests: [
              {
                id: "review-note-has-evidence",
                name: "Review note includes verification and risk",
                code: "for (const key of ['commit', 'scope', 'verification', 'risk']) {\n  if (!reviewNote[key]) throw new Error(`missing ${key}`);\n}\nif (!reviewNote.verification.includes('passed')) throw new Error('verification must include result');\nconsole.log('review story passed');",
                expectedOutputIncludes: ["review story", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["review story", "passed"]
          }
        }
      )
    },
    {
      id: "lesson-ai-diff-review",
      moduleId: "module-ai-verification",
      slug: "ai-diff-review",
      title: "Review AI Diffs Before Trusting Them",
      summary: "Use a local checklist to inspect AI-generated changes for scope, contracts, secrets, and verification.",
      bodyMarkdown: "AI output is untrusted until the human review loop accepts it. A diff checklist makes acceptance explicit: what changed, what risk moved, what verifier passed, and what was rejected.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-ai-verification", "skill-testing-debugging", "skill-portfolio-evidence"],
      quizId: "quiz-ai-diff-review",
      desktopTask: "Apply a diff-review checklist to one AI-suggested change and reject at least one risky item.",
      evidencePrompt: "Keep the checklist, accepted edits, rejected edits, and check output.",
      workshop: workshop(
        "Inspect an AI-generated diff before accepting any code.",
        "Responsible AI-assisted coding means you can show what you accepted, what you rejected, and which local evidence justified the decision.",
        "A review checklist should cover scope, contract changes, secrets, destructive behavior, tests, and remaining uncertainty. The AI suggestion is a draft, not authority.",
        "Reject a suggestion that adds a package for a one-line bug fix, then keep the smaller tested edit.",
        "Review one suggested diff and mark each item accepted, rejected, or needs follow-up with a reason.",
        "This deepens the AI Bug Review Rubric and AI Prompt Verification Harness missions.",
        "Which part of the AI suggestion did you reject, and what evidence supported that decision?",
        ["Accepting the whole diff because tests pass", "Ignoring package or schema changes", "Failing to record rejected suggestions"],
        {
          language: "AI-assisted coding",
          tools: ["AI chat", "git diff", "test runner", "review checklist"],
          synopsis: "You are learning how to review model-generated code as untrusted input and keep custody of the final accepted change.",
          prerequisites: ["Have a small AI-suggested patch or sample diff.", "Know the check command for the project you are reviewing."],
          testingFocus: "You will test the review by ensuring the accepted change has check output and the rejected change has a clear risk reason."
        },
        {
          starterCode: "Checklist:\n- Scope: one bug fix\n- Contract change: none\n- Package change: rejected\n- Secret risk: none found\n- Verification: npm run test -> passed",
          expectedOutput: "The accepted change has local check output, and the rejected item names a concrete risk such as package expansion or contract drift.",
          checkYourAnswer: "A useful rejection is specific. Do not write 'bad'; write the risk, such as unnecessary package change for a local bug fix."
        },
        {
          title: "Apply an AI diff review checklist",
          goal: "Review an AI-suggested change and record accepted edits, rejected edits, and verifier evidence.",
          steps: ["List the AI-suggested changes", "Reject at least one risky or out-of-scope item", "Run the verifier for the accepted edit"],
          deliverables: ["Review checklist", "Rejected-item reason", "Check output"],
          verifierCommand: "Run the project verifier for the accepted change.",
          expectedEvidence: "Checklist showing accepted and rejected AI suggestions plus exact check output for the accepted change.",
          projectConnection: "This is the review gate inside the AI Prompt Verification Harness mission.",
          tester: {
            codeLabel: "Paste your AI diff checklist",
            outputLabel: "Paste check output",
            requiredCodeIncludes: ["accepted", "rejected", "Verification"],
            requiredOutputIncludes: ["passed"],
            successMessage: "Your AI diff review keeps human ownership over accepted and rejected changes.",
            failureMessage: "The tester needs accepted/rejected review notes plus passing check output."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "const aiReview = {\n  accepted: ['small null fallback with regression test'],\n  rejected: ['new dependency for a one-line bug fix'],\n  verification: 'npm run test -> passed',\n  risk: 'package changes were out of scope'\n};",
            visibleTests: [
              {
                id: "ai-review-records-judgment",
                name: "AI review records accepted and rejected choices",
                code: "if (aiReview.accepted.length === 0) throw new Error('accepted item required');\nif (aiReview.rejected.length === 0) throw new Error('rejected item required');\nif (!aiReview.verification.includes('passed')) throw new Error('missing check result');\nconsole.log('accepted rejected AI review passed');",
                expectedOutputIncludes: ["accepted", "rejected", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["accepted", "rejected", "passed"]
          }
        }
      )
    },
    {
      id: "lesson-ai-retrieval-grounding",
      moduleId: "module-ai-apps",
      slug: "ai-retrieval-grounding",
      title: "Ground Answers In Retrieved Notes",
      summary: "Separate retrieval from answer generation so AI app outputs can cite local evidence.",
      bodyMarkdown: "A practical AI app should know when it has support and when it does not. Retrieval gives the answer step a small local evidence set; the check confirms that claims point back to those notes.",
      estimatedMinutes: 12,
      difficulty: "applied",
      skillIds: ["skill-ai-verification", "skill-api-contracts", "skill-testing-debugging"],
      quizId: "quiz-ai-retrieval-grounding",
      desktopTask: "Create a tiny notes corpus and answer one question using only retrieved notes.",
      evidencePrompt: "Save retrieved note IDs, the answer, citation mapping, and unsupported-question behavior.",
      workshop: workshop(
        "Ground one AI-style answer in retrieved local notes.",
        "RAG features are safer when retrieval, answer drafting, and citation checking are separate steps that can each be tested.",
        "Retrieval selects relevant notes. Generation writes an answer using only those notes. Verification checks that every important claim cites a retrieved note.",
        "If note n1 says tests passed and note n2 says deployment is absent, the answer can cite n1 and n2 but should not invent production usage.",
        "Build a tiny retrieval result and an answer object with citations for each claim.",
        "This deepens the RAG Notes Search Prototype mission.",
        "Which claim would your verifier reject because no retrieved note supports it?",
        ["Answering from general knowledge", "Mixing retrieved and non-retrieved citations", "Skipping unsupported-question behavior"],
        {
          language: "Practical AI app design",
          tools: ["local notes", "retrieval function", "citation checker"],
          synopsis: "You are learning how an AI app can answer from a local evidence set instead of guessing from the model's general knowledge.",
          prerequisites: ["Understand that notes can be represented as small records with ids and text.", "Know that citations should point to specific source records."],
          testingFocus: "You will test that the answer cites retrieved note ids and that unsupported claims are rejected instead of invented."
        },
        {
          starterCode: "const notes = [{ id: 'n1', text: 'The parser tests passed.' }];\nconst answer = { text: 'The parser tests passed.', citations: ['n1'] };\nconsole.log(answer);",
          expectedOutput: "The answer cites only note ids that were retrieved, and unsupported questions return an uncertainty message.",
          checkYourAnswer: "If a citation points to a note that was not retrieved, the answer is not grounded. If the answer makes a claim with no citation, mark it unsupported."
        },
        {
          title: "Check answer citations against retrieved notes",
          goal: "Create a tiny retrieval result and verify that answer citations point only to retrieved notes.",
          steps: ["Create two local notes", "Select one retrieved note for a question", "Verify the answer cites only retrieved note ids"],
          deliverables: ["Notes corpus", "Retrieved ids", "Cited answer and unsupported-case note"],
          verifierCommand: "Run the citation-check script or Code Lab check.",
          expectedEvidence: "Retrieved note ids, answer citations, and check output showing citations are grounded in the retrieved set.",
          projectConnection: "This is the grounding check inside the RAG Notes Search Prototype mission.",
          tester: {
            codeLabel: "Paste your notes, retrieved ids, and cited answer",
            outputLabel: "Paste citation-check output",
            requiredCodeIncludes: ["notes", "retrievedIds", "citations"],
            requiredOutputIncludes: ["grounded", "passed"],
            successMessage: "Your AI app proof separates retrieval from answer grounding.",
            failureMessage: "The tester needs notes, retrieved ids, citations, and grounded check output."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "const notes = [{ id: 'n1', text: 'The parser tests passed.' }, { id: 'n2', text: 'Deployment is not configured.' }];\nconst retrievedIds = ['n1'];\nconst answer = { text: 'The parser tests passed.', citations: ['n1'] };\n\nfunction citationsAreGrounded(result, ids) {\n  return false;\n}",
            visibleTests: [
              {
                id: "citations-use-retrieved-notes",
                name: "Citations use only retrieved notes",
                code: "if (!citationsAreGrounded(answer, retrievedIds)) throw new Error('answer should be grounded');\nif (citationsAreGrounded({ text: 'Deployment is ready.', citations: ['n2'] }, retrievedIds)) throw new Error('non-retrieved citation should fail');\nconsole.log('grounded citations passed');",
                expectedOutputIncludes: ["grounded", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["grounded", "passed"]
          }
        }
        ,
        aiRetrievalPracticeReps
      )
    },
    {
      id: "lesson-ml-confusion-matrix",
      moduleId: "module-ml-core",
      slug: "ml-confusion-matrix",
      title: "Confusion Matrices Reveal Failure Patterns",
      summary: "Count true positives, false positives, false negatives, and true negatives before trusting a model score.",
      bodyMarkdown: "Accuracy can look fine while one class fails badly. A confusion matrix shows which errors happened so the next evaluation can focus on the real weak spot.",
      estimatedMinutes: 11,
      difficulty: "foundation",
      skillIds: ["skill-ml-metrics", "skill-testing-debugging"],
      quizId: "quiz-ml-confusion-matrix",
      desktopTask: "Calculate a confusion matrix for six toy predictions and explain one failure pattern.",
      evidencePrompt: "Capture the counts, one derived metric, and a limitation of the tiny sample.",
      workshop: workshop(
        "Calculate a confusion matrix and use it to explain one model failure pattern.",
        "Practical ML evaluation starts with counts a reviewer can inspect before trusting summary metrics.",
        "For binary classification, true positives are positive examples predicted positive, false positives are negatives predicted positive, false negatives are positives predicted negative, and true negatives are negatives predicted negative.",
        "For labels [1, 1, 0, 0] and predictions [1, 0, 1, 0], the matrix has one true positive, one false negative, one false positive, and one true negative.",
        "Count TP, FP, FN, and TN for a tiny prediction list, then write one sentence about the failure pattern.",
        "This deepens the ML Metrics Report mission.",
        "Which error type would matter most if the model screened urgent support tickets?",
        ["Reporting only accuracy", "Swapping false positives and false negatives", "Ignoring sample size when interpreting counts"],
        {
          language: "Machine learning evaluation",
          tools: ["toy predictions", "confusion matrix", "metrics note"],
          synopsis: "You are learning how to inspect the kinds of mistakes a classifier makes instead of relying on one score.",
          prerequisites: ["Know that a classifier predicts labels.", "Know that evaluation compares predictions to true labels."],
          testingFocus: "You will test the count function against a tiny known example and then explain what the errors mean."
        },
        {
          starterCode: "const labels = [1, 1, 0, 0];\nconst predictions = [1, 0, 1, 0];\nconst matrix = countMatrix(labels, predictions);\nconsole.log(matrix);",
          expectedOutput: "{ tp: 1, fp: 1, fn: 1, tn: 1 } plus a short note about the sample being too small for broad claims.",
          checkYourAnswer: "Check one row at a time. If an actual positive was predicted negative, that is a false negative, not a false positive."
        },
        {
          title: "Count classifier errors",
          goal: "Build a tiny confusion-matrix counter and explain one error pattern from the counts.",
          steps: ["Write countMatrix(labels, predictions)", "Verify the known four-example case", "Write one limitation about sample size"],
          deliverables: ["Count function", "Matrix output", "Failure-pattern note"],
          verifierCommand: "Run the Code Lab check or a local test.",
          expectedEvidence: "Matrix output with TP, FP, FN, and TN counts plus a short limitation note about what the tiny sample cannot prove.",
          projectConnection: "This is the error-analysis slice for the ML Metrics Report mission.",
          tester: {
            codeLabel: "Paste your confusion matrix function and note",
            outputLabel: "Paste check output",
            requiredCodeIncludes: ["tp", "fp", "fn", "tn"],
            requiredOutputIncludes: ["passed"],
            successMessage: "Your ML evaluation proof shows the error counts behind the metric.",
            failureMessage: "The tester needs TP/FP/FN/TN code plus check output."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "function countMatrix(labels, predictions) {\n  return { tp: 0, fp: 0, fn: 0, tn: 0 };\n}\n\nconst matrix = countMatrix([1, 1, 0, 0], [1, 0, 1, 0]);",
            visibleTests: [
              {
                id: "counts-confusion-matrix",
                name: "Counts binary confusion matrix",
                code: "if (matrix.tp !== 1 || matrix.fp !== 1 || matrix.fn !== 1 || matrix.tn !== 1) throw new Error('matrix counts are wrong');\nconst second = countMatrix([1, 0, 0, 1, 1], [1, 0, 0, 0, 1]);\nif (second.tp !== 2 || second.fp !== 0 || second.fn !== 1 || second.tn !== 2) throw new Error('second matrix counts are wrong');\nconsole.log('confusion matrix passed');",
                expectedOutputIncludes: ["confusion matrix", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["confusion matrix", "passed"]
          }
        }
        ,
        mlConfusionMatrixPracticeReps
      )
    }
    ,
    proofLesson({
      id: "lesson-testing-regression-harness",
      moduleId: "module-testing-debugging-core",
      slug: "testing-regression-harness",
      title: "Regression Harnesses Catch Repeat Bugs",
      summary: "Turn a fixed bug into a tiny check that fails if the bug returns.",
      bodyMarkdown: "A regression test is a promise that a known bug stays fixed. The smallest useful harness names the input, expected result, and check output.",
      estimatedMinutes: 10,
      difficulty: "foundation",
      skillIds: ["skill-testing-debugging", "skill-regression-testing"],
      quizId: "quiz-testing-regression-harness",
      desktopTask: "Write a tiny function plus two cases: one normal case and one case that used to fail.",
      evidencePrompt: "Capture the cases, the check output, and the bug that would return if the check were removed.",
      language: "Testing",
      tools: ["JavaScript", "test cases", "terminal"],
      synopsis: "You are learning how to preserve a bug fix with a tiny repeatable check instead of trusting memory or a manual click path.",
      prerequisites: ["Know that code can be run more than once.", "Know that a test compares actual behavior with expected behavior."],
      testingFocus: "The check confirms that the normal case passes and that invalid input is rejected without pretending the result is valid.",
      objective: "Create a regression harness with one happy path and one old-bug path.",
      whyItMatters: "Employers value beginners who can prevent solved problems from coming back.",
      coreConcept: "A regression harness is a repeatable check for behavior that must not break again.",
      workedExample: "If a minutes parser once accepted empty input, the harness should include an empty-input case that expects invalid.",
      guidedExercise: "Write summarizeMinutes, run two cases, and make the verifier print passed only when both cases behave correctly.",
      missionConnection: "This starts the Regression Proof Pack mission.",
      reflectionPrompt: "Which case would catch the bug fastest if someone changed this code next week?",
      practiceStarter: "const cases = [{ input: { minutes: 30 }, expected: 30 }, { input: { minutes: '' }, expected: 'invalid' }];",
      practiceExpected: "The normal case returns 30, the bad case returns invalid, and the verifier prints passed.",
      practiceCheck: "Check that your harness proves both what should work and what should fail.",
      miniTitle: "Build a two-case regression harness",
      miniGoal: "Create a tiny verifier that preserves one fixed behavior and one rejected bad input.",
      miniSteps: ["Name the behavior that must stay fixed", "Add one normal case", "Add one old-bug or invalid case", "Print passed only after both checks succeed"],
      miniDeliverables: ["Harness code", "Two named cases", "Check output", "Short bug note"],
      verifierCommand: "Run the Code Lab check or node regression_harness.js.",
      expectedEvidence: "Harness code, two named cases, passing check output, and one note describing the bug the harness prevents from returning.",
      projectConnection: "This is the first artifact in the Regression Proof Pack.",
      requiredCodeIncludes: ["summarizeMinutes", "cases"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "const cases = [{ input: { minutes: 30 }, expected: 30 }, { input: { minutes: '' }, expected: 'invalid' }];\n\nfunction summarizeMinutes(input) {\n  return input.minutes;\n}",
      runnerTestCode: "if (summarizeMinutes(cases[0].input) !== 30) throw new Error('normal minutes should pass');\nif (summarizeMinutes(cases[1].input) !== 'invalid') throw new Error('empty minutes should be invalid');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-debugging-failure-log",
      moduleId: "module-testing-debugging-core",
      slug: "debugging-failure-log",
      title: "Failure Logs Make Debugging Reviewable",
      summary: "Capture symptom, hypothesis, fix, verifier, and residual risk for one bug.",
      bodyMarkdown: "A debugging log turns a messy fix into evidence. It helps a reviewer see what failed, what changed, and what still might be untested.",
      estimatedMinutes: 9,
      difficulty: "foundation",
      skillIds: ["skill-debugging-log", "skill-testing-debugging"],
      quizId: "quiz-debugging-failure-log",
      desktopTask: "Write a five-field failure log for a bug you can reproduce with a small input.",
      evidencePrompt: "Capture the failure log and the check output that proves the fix.",
      language: "Debugging",
      tools: ["failure log", "check output", "terminal"],
      synopsis: "You are learning to make debugging visible by recording the symptom, hypothesis, fix, verifier, and remaining risk in one compact artifact.",
      prerequisites: ["Know that a bug has an observed symptom.", "Know that a verifier can prove one narrow behavior."],
      testingFocus: "The check confirms that a useful log includes every field needed for another person to inspect the fix.",
      objective: "Create a debugging log that connects a symptom to a verified fix.",
      whyItMatters: "A clear failure log shows judgment, not just trial-and-error editing.",
      coreConcept: "Debugging evidence ties an observed failure to a hypothesis, a change, and a check result.",
      workedExample: "Symptom: empty minutes crash. Hypothesis: parser trusts blank strings. Fix: reject blanks. Check: empty case returns invalid.",
      guidedExercise: "Fill each log field with one concrete sentence, then check that no field is empty.",
      missionConnection: "This completes the evidence pattern for the Regression Proof Pack mission.",
      reflectionPrompt: "Which remaining risk would you test next if you had another hour?",
      practiceStarter: "const log = { symptom: '', hypothesis: '', fix: '', verifier: '', residualRisk: '' };",
      practiceExpected: "A complete log has all five fields and the verifier prints passed.",
      practiceCheck: "If another person cannot reproduce what failed, the log is not reviewable yet.",
      miniTitle: "Write a reviewable failure log",
      miniGoal: "Create a complete debugging log that explains one verified fix.",
      miniSteps: ["Name the symptom", "Write the hypothesis", "Record the fix", "Attach check output", "Name one residual risk"],
      miniDeliverables: ["Failure log", "Check output", "Residual-risk note"],
      verifierCommand: "Run the Code Lab check or inspect the five-field log.",
      expectedEvidence: "A five-field failure log with symptom, hypothesis, fix, verifier, residual risk, and passing check output.",
      projectConnection: "This becomes the narrative section of the Regression Proof Pack.",
      requiredCodeIncludes: ["symptom", "hypothesis", "verifier"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "const failureLog = { symptom: '', hypothesis: '', fix: '', verifier: '', residualRisk: '' };\n\nfunction isUsefulLog(log) {\n  return false;\n}",
      runnerTestCode: "const good = { symptom: 'blank minutes crash', hypothesis: 'parser trusts blanks', fix: 'reject blank minutes', verifier: 'empty case returns invalid', residualRisk: 'timezone formats not tested' };\nif (!isUsefulLog(good)) throw new Error('complete log should pass');\nif (isUsefulLog({ ...good, verifier: '' })) throw new Error('missing verifier should fail');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-security-threat-model",
      moduleId: "module-secure-software-core",
      slug: "security-threat-model",
      title: "Threat Notes Before Fix Lists",
      summary: "Name the asset, actor, abuse case, control, and verifier for a small feature.",
      bodyMarkdown: "Secure software starts by naming what could go wrong. A threat note keeps security work tied to a concrete feature and verifier.",
      estimatedMinutes: 11,
      difficulty: "foundation",
      skillIds: ["skill-threat-modeling"],
      quizId: "quiz-security-threat-model",
      desktopTask: "Create a threat note for a profile form or API endpoint.",
      evidencePrompt: "Capture the threat note and the verifier you would run after the control is implemented.",
      language: "Application security",
      tools: ["threat note", "feature boundary", "verifier plan"],
      synopsis: "You are learning to describe security risk in a beginner-friendly way before jumping to tools, scanners, or vague fix lists.",
      prerequisites: ["Know what feature you are reviewing.", "Know that a control is a design or code choice that reduces a risk."],
      testingFocus: "The check confirms that the threat note names an asset, actor, abuse case, control, and verifier.",
      objective: "Write a threat note that maps one feature risk to one testable control.",
      whyItMatters: "Security work becomes practical when risk is tied to a concrete feature and a verifier.",
      coreConcept: "A threat note connects asset, actor, abuse case, control, and verification.",
      workedExample: "For a profile form, the asset is user email, the actor is an unauthenticated visitor, and the control is server-side ownership check.",
      guidedExercise: "Choose one feature, fill the five fields, and reject notes that only say make it secure.",
      missionConnection: "This opens the Secure Review Pack mission.",
      reflectionPrompt: "Which assumption in your threat note would need confirmation from the product owner?",
      practiceStarter: "const threat = { asset: 'user email', actor: 'unauthenticated visitor', abuseCase: 'read another account', control: 'ownership check', verifier: 'access denied test' };",
      practiceExpected: "The threat note has five concrete fields and the verifier prints passed.",
      practiceCheck: "A control without a verifier is only a wish; name how it will be checked.",
      miniTitle: "Draft a five-field threat note",
      miniGoal: "Create one threat note for a small feature and make every field concrete.",
      miniSteps: ["Pick one feature", "Name the protected asset", "Name the actor and abuse case", "Name the control and verifier"],
      miniDeliverables: ["Threat note", "Verifier plan", "Residual assumption"],
      verifierCommand: "Run the Code Lab check or inspect the five-field threat note.",
      expectedEvidence: "A complete threat note with asset, actor, abuse case, control, verifier, and one remaining assumption.",
      projectConnection: "This becomes the risk table in the Secure Review Pack.",
      requiredCodeIncludes: ["asset", "actor", "control", "verifier"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function buildThreatNote(feature) {\n  return { asset: '', actor: '', abuseCase: '', control: '', verifier: '' };\n}\n\nconst note = buildThreatNote('profile');",
      runnerTestCode: "const required = ['asset', 'actor', 'abuseCase', 'control', 'verifier'];\nif (!required.every((key) => typeof note[key] === 'string' && note[key].trim().length > 3)) throw new Error('threat note needs concrete fields');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-security-secrets-auth",
      moduleId: "module-secure-software-core",
      slug: "security-secrets-auth",
      title: "Secrets and Auth Boundaries",
      summary: "Separate public config from secrets and name where auth must be enforced.",
      bodyMarkdown: "A secret is not just any setting. Secure apps keep private credentials out of clients and enforce authorization at server boundaries.",
      estimatedMinutes: 10,
      difficulty: "foundation",
      skillIds: ["skill-secret-handling", "skill-auth-boundaries"],
      quizId: "quiz-security-secrets-auth",
      desktopTask: "Classify sample settings as public or secret and name one server-side auth boundary.",
      evidencePrompt: "Capture the classification table and one auth-boundary verifier.",
      language: "Application security",
      tools: ["config table", "auth boundary", "server check"],
      synopsis: "You are learning how to avoid two common beginner mistakes: exposing private keys and trusting client-side checks as authorization.",
      prerequisites: ["Know that frontend code can be inspected by users.", "Know that server code can enforce access before returning data."],
      testingFocus: "The check confirms that secret-looking names are classified as secret and public browser config remains public.",
      objective: "Classify settings and name the server boundary that protects private data.",
      whyItMatters: "Modern apps often fail through leaked keys or authorization checks placed in the wrong layer.",
      coreConcept: "Secrets stay server-side; authorization decisions must be enforced where data is returned or mutated.",
      workedExample: "PUBLIC_API_BASE can be public, but STRIPE_SECRET_KEY and DATABASE_URL are secrets.",
      guidedExercise: "Sort five settings into public or secret, then write one sentence naming the auth boundary.",
      missionConnection: "This supplies the secrets and auth section of the Secure Review Pack.",
      reflectionPrompt: "Which value would be most damaging if copied into a mobile bundle?",
      practiceStarter: "const settings = ['PUBLIC_API_BASE', 'DATABASE_URL', 'STRIPE_SECRET_KEY'];",
      practiceExpected: "Secret-like settings are marked secret, public base URLs are marked public, and the verifier prints passed.",
      practiceCheck: "If the browser or mobile bundle needs it to render, it might be public; if it grants power, it is secret.",
      practiceReps: securitySecretPracticeReps,
      miniTitle: "Classify config and auth boundaries",
      miniGoal: "Create a small config table and one server-side authorization note.",
      miniSteps: ["List public settings", "List secret settings", "Name the protected operation", "Name the server-side verifier"],
      miniDeliverables: ["Config table", "Auth-boundary note", "Check output"],
      verifierCommand: "Run the Code Lab check or inspect the classification table.",
      expectedEvidence: "A config classification table, auth-boundary note, and check output proving secrets are not treated as public.",
      projectConnection: "This becomes the config hygiene section of the Secure Review Pack.",
      requiredCodeIncludes: ["classifySetting", "secret"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function classifySetting(name) {\n  return 'public';\n}",
      runnerTestCode: "if (classifySetting('STRIPE_SECRET_KEY') !== 'secret') throw new Error('secret keys must be secret');\nif (classifySetting('DATABASE_URL') !== 'secret') throw new Error('database urls must be secret');\nif (classifySetting('PUBLIC_API_BASE') !== 'public') throw new Error('public api base can be public');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-security-access-control-lab",
      moduleId: "module-secure-software-core",
      slug: "security-access-control-lab",
      title: "Broken Access Control: Exploit, Fix, Verify",
      summary: "Prove that a user can only access resources they own or are allowed to manage.",
      bodyMarkdown: "Access control is the rule that decides who may read or change a resource. Beginners often check only that a user is logged in, then forget to check ownership or role. This lesson stages the secure habit: show the broken case, write the smallest rule, and verify both allowed and denied access.",
      estimatedMinutes: 12,
      difficulty: "applied",
      skillIds: ["skill-auth-boundaries", "skill-threat-modeling", "skill-testing-debugging"],
      quizId: "quiz-security-access-control-lab",
      desktopTask: "Write an ownership check for a profile read action and test both the owner and non-owner case.",
      evidencePrompt: "Capture the broken case, fixed rule, denied request, allowed request, and check output.",
      language: "Application security",
      tools: ["access rule", "negative test", "ownership check"],
      synopsis: "You are learning the difference between authentication and authorization with one tiny resource rule.",
      prerequisites: ["Know that logged-in means identity is known.", "Know that authorization decides what that identity may access."],
      testingFocus: "The check confirms owner access is allowed and non-owner access is denied.",
      objective: "Write an ownership rule that allows the owner and rejects a different user.",
      whyItMatters: "Broken access control is common because happy-path testing often proves login but skips ownership.",
      coreConcept: "Authentication asks who the user is; authorization asks whether that user may access this specific resource.",
      workedExample: "User u1 may read profile owned by u1, but user u1 must not read a profile owned by u2.",
      guidedExercise: "Implement canReadProfile, test the owner case, then test the non-owner case before calling the rule done.",
      missionConnection: "This deepens the auth-boundary part of the Secure Review Pack.",
      reflectionPrompt: "Which denied request would catch the bug if someone only tested logged-in users?",
      practiceStarter: "function canReadProfile(request) {\n  return true;\n}\n\nconsole.log(canReadProfile({ userId: 'u1', resourceOwnerId: 'u2' }));",
      practiceExpected: "Owner requests pass, non-owner requests fail, and the check prints passed.",
      practiceCheck: "If every logged-in user passes, you tested authentication but not authorization.",
      practiceReps: securityAccessControlPracticeReps,
      miniTitle: "Verify profile ownership",
      miniGoal: "Create one access-control rule with an allowed owner case and denied non-owner case.",
      miniSteps: ["Name the protected resource", "Write the owner rule", "Test owner access", "Test non-owner denial"],
      miniDeliverables: ["Access rule", "Allowed test", "Denied test", "Short broken-case note"],
      verifierCommand: "Run the Code Lab check or local access-control test.",
      expectedEvidence: "Access-rule code and output showing owner access allowed, non-owner access denied, and the broken case explained.",
      projectConnection: "This becomes the access-control lab inside the Secure Review Pack.",
      requiredCodeIncludes: ["canReadProfile", "userId", "resourceOwnerId"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function canReadProfile(request) {\n  return true;\n}",
      runnerTestCode: "if (!canReadProfile({ userId: 'u1', resourceOwnerId: 'u1' })) throw new Error('owner should be allowed');\nif (canReadProfile({ userId: 'u1', resourceOwnerId: 'u2' })) throw new Error('non-owner should be denied');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-security-input-validation",
      moduleId: "module-secure-software-core",
      slug: "security-input-validation",
      title: "Validate Inputs at the Boundary",
      summary: "Reject malformed input with clear errors before domain logic trusts it.",
      bodyMarkdown: "Input validation protects the boundary between untrusted data and trusted application logic. Good validation rejects bad data without leaking internals.",
      estimatedMinutes: 10,
      difficulty: "foundation",
      skillIds: ["skill-auth-boundaries", "skill-testing-debugging"],
      quizId: "quiz-security-input-validation",
      desktopTask: "Write a validator for one small profile payload with a negative test.",
      evidencePrompt: "Capture the valid case, rejected case, and safe error text.",
      language: "Application security",
      tools: ["validator", "negative test", "safe error"],
      synopsis: "You are learning to treat outside input as untrusted until it passes a small, explicit validation boundary.",
      prerequisites: ["Know that form and API data can be malformed.", "Know that error messages should help without exposing internals."],
      testingFocus: "The check confirms that valid input passes and malformed email or role input fails with a safe message.",
      objective: "Write a boundary validator with one valid case and one rejected case.",
      whyItMatters: "Boundary validation prevents messy or hostile input from spreading through the app.",
      coreConcept: "Validate shape and allowed values before domain logic uses input.",
      workedExample: "A role field should accept learner or mentor, not any arbitrary string.",
      guidedExercise: "Validate email and role fields, then return safe errors for invalid values.",
      missionConnection: "This adds the input-validation proof to the Secure Review Pack.",
      reflectionPrompt: "What internal detail should your error message avoid revealing?",
      practiceStarter: "const input = { email: 'learner@example.com', role: 'learner' };",
      practiceExpected: "Valid input passes, bad email or role fails, and the verifier prints passed.",
      practiceCheck: "Do not let unknown role values through just because the email looks valid.",
      miniTitle: "Build a boundary validator",
      miniGoal: "Create a validator that accepts one safe payload and rejects two unsafe payloads.",
      miniSteps: ["Define allowed fields", "Accept the valid payload", "Reject malformed email", "Reject unsupported role"],
      miniDeliverables: ["Validator code", "Valid-case output", "Rejected-case output"],
      verifierCommand: "Run the Code Lab check or local validation tests.",
      expectedEvidence: "Validator code, valid and rejected case output, safe error text, and passing check output.",
      projectConnection: "This is the validation evidence in the Secure Review Pack.",
      requiredCodeIncludes: ["validateProfile", "errors"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function validateProfile(input) {\n  return { ok: true, errors: [] };\n}",
      runnerTestCode: "if (!validateProfile({ email: 'learner@example.com', role: 'learner' }).ok) throw new Error('valid input should pass');\nif (validateProfile({ email: 'bad', role: 'learner' }).ok) throw new Error('bad email should fail');\nif (validateProfile({ email: 'learner@example.com', role: 'admin' }).ok) throw new Error('unsupported role should fail');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-security-injection-output-encoding",
      moduleId: "module-secure-software-core",
      slug: "security-injection-output-encoding",
      title: "Injection Boundaries and Safe Output",
      summary: "Keep user text as data and escape it before display.",
      bodyMarkdown: "Injection bugs happen when untrusted text crosses a boundary and starts acting like a command or markup. A beginner does not need every attack family at once. Start with one habit: keep values separate from commands, then encode user-controlled text before it appears in HTML, logs, or query strings.",
      estimatedMinutes: 12,
      difficulty: "applied",
      skillIds: ["skill-auth-boundaries", "skill-testing-debugging"],
      quizId: "quiz-security-injection-output-encoding",
      desktopTask: "Write a tiny HTML escape function and test normal text plus script-looking text.",
      evidencePrompt: "Capture the unsafe input, escaped output, normal-text case, and check output.",
      language: "Application security",
      tools: ["output encoding", "negative test", "safe text"],
      synopsis: "You are learning one concrete injection defense: user text remains text and must not become executable markup.",
      prerequisites: ["Know that users can type unexpected characters.", "Know that HTML treats angle brackets specially."],
      testingFocus: "The check confirms script-looking text is escaped while normal text remains readable.",
      objective: "Escape untrusted text before displaying it as HTML-like output.",
      whyItMatters: "Safe output prevents a stored note, comment, or name field from becoming active markup.",
      coreConcept: "Boundary safety keeps commands and markup separate from user-controlled values.",
      workedExample: "<script>alert(1)</script> should display as escaped text, not run as a script.",
      guidedExercise: "Write escapeHtml, test a script-looking string, then test a normal name with an ampersand.",
      missionConnection: "This adds injection-boundary thinking to the Secure Review Pack.",
      reflectionPrompt: "Which output location would need escaping before a reviewer could trust it?",
      practiceStarter: "function escapeHtml(value) {\n  return value;\n}\n\nconsole.log(escapeHtml('<script>alert(1)</script>'));",
      practiceExpected: "Special HTML characters are escaped, normal text stays readable, and the check prints passed.",
      practiceCheck: "If the output still contains raw <script>, the text can still be interpreted as markup.",
      practiceReps: securityInjectionOutputPracticeReps,
      miniTitle: "Escape user-controlled output",
      miniGoal: "Create one output-encoding helper with safe and normal examples.",
      miniSteps: ["Choose the unsafe input", "Escape special HTML characters", "Test a normal text case", "Explain the boundary"],
      miniDeliverables: ["escapeHtml helper", "Unsafe-input output", "Normal-input output", "Boundary note"],
      verifierCommand: "Run the Code Lab check or local output-encoding test.",
      expectedEvidence: "Encoding helper and output showing script-looking text escaped, normal text preserved, and check output passing.",
      projectConnection: "This becomes the injection-boundary section of the Secure Review Pack.",
      requiredCodeIncludes: ["escapeHtml", "replace"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function escapeHtml(value) {\n  return value;\n}",
      runnerTestCode: "const escaped = escapeHtml('<script>alert(1)</script>');\nif (escaped.includes('<script>')) throw new Error('script tag should be escaped');\nif (!escaped.includes('&lt;script&gt;')) throw new Error('escaped output should show encoded tag');\nif (!escapeHtml('Ada & Grace').includes('&amp;')) throw new Error('ampersand should be escaped');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-security-dependency-logging",
      moduleId: "module-secure-software-core",
      slug: "security-dependency-logging",
      title: "Dependencies and Logs Need Guardrails",
      summary: "Review dependency risk and logging behavior without leaking private data.",
      bodyMarkdown: "Security proof includes the boring parts: dependency review, version notes, safe logs, and clear residual risk.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-dependency-hygiene", "skill-secret-handling"],
      quizId: "quiz-security-dependency-logging",
      desktopTask: "Create a release-risk note with dependency and logging checks.",
      evidencePrompt: "Capture the dependency note, log redaction note, and check output.",
      language: "Application security",
      tools: ["dependency note", "safe logs", "release checklist"],
      synopsis: "You are learning the practical AppSec habit of checking package risk and log safety before claiming a release is ready.",
      prerequisites: ["Know that dependencies can change app behavior.", "Know that logs can accidentally reveal sensitive values."],
      testingFocus: "The check confirms that a release review flags unpinned dependencies and raw secret logging.",
      objective: "Create a dependency and logging checklist for one small release.",
      whyItMatters: "Real incidents often come from package drift or logs that expose private data.",
      coreConcept: "Release hygiene checks dependency freshness, pinning, vulnerability notes, and safe log redaction.",
      workedExample: "A review should flag unpinned helper packages and any log line that prints token values.",
      guidedExercise: "Review a sample release object and return every risk that needs a fix.",
      missionConnection: "This completes the Secure Review Pack before portfolio evidence.",
      reflectionPrompt: "Which risk would block release and which could become a follow-up ticket?",
      practiceStarter: "const release = { pinned: false, logsSecrets: true, verifier: 'npm test passed' };",
      practiceExpected: "The review flags dependency pinning and secret logging, then the verifier prints passed.",
      practiceCheck: "A passing test suite does not prove logs are safe or dependencies are pinned.",
      miniTitle: "Review dependency and log hygiene",
      miniGoal: "Create a release checklist that flags package and logging risks.",
      miniSteps: ["Check dependency pinning", "Check vulnerability or update notes", "Check whether logs expose secrets", "Record release decision"],
      miniDeliverables: ["Release-risk note", "Safe-log note", "Check output"],
      verifierCommand: "Run the Code Lab check or inspect the release checklist.",
      expectedEvidence: "Release checklist, dependency note, safe-log note, release decision, and passing check output.",
      projectConnection: "This closes the Secure Review Pack with release hygiene evidence.",
      requiredCodeIncludes: ["reviewRelease", "risks"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function reviewRelease(release) {\n  return [];\n}",
      runnerTestCode: "const risks = reviewRelease({ pinned: false, logsSecrets: true, verifier: 'npm test passed' });\nif (!risks.includes('pin dependencies')) throw new Error('must flag unpinned dependencies');\nif (!risks.includes('redact secret logs')) throw new Error('must flag secret logging');\nif (reviewRelease({ pinned: true, logsSecrets: false, verifier: 'npm test passed' }).length !== 0) throw new Error('clean release should have no risks');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-cloud-env-config",
      moduleId: "module-cloud-platform-core",
      slug: "cloud-env-config",
      title: "Environment Config Without Secret Leaks",
      summary: "Separate deploy-time settings from secrets and document required environment variables.",
      bodyMarkdown: "Cloud work begins with configuration discipline. A beginner deploy should name required settings and keep private values out of source.",
      estimatedMinutes: 10,
      difficulty: "foundation",
      skillIds: ["skill-cloud-config", "skill-secret-handling"],
      quizId: "quiz-cloud-env-config",
      desktopTask: "Create an environment config matrix for local, preview, and production.",
      evidencePrompt: "Capture the matrix, missing-config behavior, and check output.",
      language: "Cloud platform",
      tools: ["env matrix", "secret boundary", "deploy note"],
      synopsis: "You are learning how deployable apps use environment configuration without copying private values into source code or client bundles.",
      prerequisites: ["Know that apps can run in local and hosted environments.", "Know that secrets should not be committed."],
      testingFocus: "The check confirms that required config exists and that secret values are represented by names, not raw credentials.",
      objective: "Build a small environment config matrix with safe secret handling.",
      whyItMatters: "Config mistakes are one of the fastest ways to break or leak a beginner deployment.",
      coreConcept: "Environment config names required settings while secret values stay in the platform secret store.",
      workedExample: "API_BASE can be documented as a value, but DATABASE_URL should be documented as required without printing the credential.",
      guidedExercise: "Resolve config for local and production, then reject a production config with missing required values.",
      missionConnection: "This starts the Cloud Release Runbook mission.",
      reflectionPrompt: "Which setting would break production if it were missing?",
      practiceStarter: "const env = { NODE_ENV: 'production', API_BASE: 'https://api.example.com', DATABASE_URL: '[secret]' };",
      practiceExpected: "Production config resolves required names without exposing the secret value, and the verifier prints passed.",
      practiceCheck: "The artifact should show what is required, not the real secret.",
      miniTitle: "Create an env config matrix",
      miniGoal: "Document local, preview, and production config without exposing secrets.",
      miniSteps: ["List required variables", "Mark public versus secret settings", "Define missing-config behavior", "Run the config check"],
      miniDeliverables: ["Config matrix", "Missing-config output", "Check output"],
      verifierCommand: "Run the Code Lab check or local config check.",
      expectedEvidence: "Environment matrix, missing-config result, secret-boundary note, and passing check output.",
      projectConnection: "This is the config section of the Cloud Release Runbook.",
      requiredCodeIncludes: ["resolveConfig", "required"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function resolveConfig(env) {\n  return { ok: true, required: [], exposesSecret: true };\n}",
      runnerTestCode: "const prod = resolveConfig({ NODE_ENV: 'production', API_BASE: 'https://api.example.com', DATABASE_URL: '[secret]' });\nif (!prod.ok || prod.exposesSecret) throw new Error('production config should be ok without exposing secrets');\nif (resolveConfig({ NODE_ENV: 'production', API_BASE: '' }).ok) throw new Error('missing production config should fail');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-cloud-ci-deploy-checks",
      moduleId: "module-cloud-platform-core",
      slug: "cloud-ci-deploy-checks",
      title: "Release Checks Before Deploy",
      summary: "Define the checks that must pass before a cloud release is allowed.",
      bodyMarkdown: "A release checklist keeps deployment from being a guess. It should include tests, build, migration or data notes, and rollback readiness.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-ci-release", "skill-testing-debugging"],
      quizId: "quiz-cloud-ci-deploy-checks",
      desktopTask: "Create a release gate that passes only when required checks are green.",
      evidencePrompt: "Capture the required checks, a blocked release example, and a passing release example.",
      language: "Cloud platform",
      tools: ["CI checks", "release gate", "rollback note"],
      synopsis: "You are learning to make release decisions from named checks instead of vibes, screenshots, or a single local run.",
      prerequisites: ["Know that CI can run commands automatically.", "Know that deploys should have rollback notes."],
      testingFocus: "The check confirms that a release is blocked when build, tests, or rollback notes are missing.",
      objective: "Build a release gate that requires build, tests, and rollback readiness.",
      whyItMatters: "Career-ready deploy work includes the evidence that release risk was checked.",
      coreConcept: "A release gate turns required checks into a yes/no deploy decision.",
      workedExample: "If tests pass but rollback is missing, the release should stay blocked.",
      guidedExercise: "Evaluate three check objects and return deploy only when all required checks pass.",
      missionConnection: "This adds deployment gating to the Cloud Release Runbook.",
      reflectionPrompt: "Which missing check should block release most often in this app?",
      practiceStarter: "const checks = { build: true, tests: true, rollback: false };",
      practiceExpected: "A release without rollback is blocked, all-green checks pass, and the verifier prints passed.",
      practiceCheck: "Do not let a single green check hide a missing release requirement.",
      practiceReps: cloudReleasePracticeReps,
      miniTitle: "Build a release gate",
      miniGoal: "Create a function or checklist that blocks deploys until required checks pass.",
      miniSteps: ["Name required checks", "Block one missing-check release", "Allow one all-green release", "Record rollback readiness"],
      miniDeliverables: ["Release gate", "Blocked example", "Passing example"],
      verifierCommand: "Run the Code Lab check or local release-gate test.",
      expectedEvidence: "Release gate artifact, blocked release example, passing release example, rollback note, and check output.",
      projectConnection: "This is the CI gate in the Cloud Release Runbook.",
      requiredCodeIncludes: ["canDeploy", "rollback"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function canDeploy(checks) {\n  return true;\n}",
      runnerTestCode: "if (canDeploy({ build: true, tests: true, rollback: false })) throw new Error('missing rollback should block deploy');\nif (canDeploy({ build: true, tests: false, rollback: true })) throw new Error('failing tests should block deploy');\nif (!canDeploy({ build: true, tests: true, rollback: true })) throw new Error('all checks should deploy');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-cloud-rollback-drill",
      moduleId: "module-cloud-platform-core",
      slug: "cloud-rollback-drill",
      title: "Rollback Drills Before Real Deploys",
      summary: "Practice the exact recovery action before a release needs it.",
      bodyMarkdown: "A rollback plan is weak until someone can follow it under pressure. A beginner-friendly rollback drill names the trigger, previous version, owner, command, and success check. This keeps cloud learning practical: do not just say rollback exists; rehearse the smallest recovery path before the deploy is trusted.",
      estimatedMinutes: 11,
      difficulty: "applied",
      skillIds: ["skill-ci-release", "skill-observability-cost", "skill-testing-debugging"],
      quizId: "quiz-cloud-rollback-drill",
      desktopTask: "Write a rollback drill for one app release with trigger, owner, command, and success check.",
      evidencePrompt: "Capture the rollback drill, blocked release without rollback target, and passing drill check output.",
      language: "Cloud platform",
      tools: ["rollback drill", "release gate", "ops checklist"],
      synopsis: "You are learning to make rollback concrete enough that another person could use it when a release goes wrong.",
      prerequisites: ["Know that deploys can fail after launch.", "Know that a previous version or known-good state must exist before rollback."],
      testingFocus: "The check confirms a drill names trigger, previous version, owner, action, and success check.",
      objective: "Create a rollback drill that names when to rollback and how to confirm recovery.",
      whyItMatters: "Cloud releases are safer when recovery is rehearsed before users are waiting.",
      coreConcept: "A rollback drill turns recovery into a named action with trigger, owner, command, and success check.",
      workedExample: "If error rate exceeds 5%, the owner runs deploy previous 1.1.9, then checks health returns green.",
      guidedExercise: "Fill the five rollback fields, then reject a release that has no previous version.",
      missionConnection: "This deepens the Cloud Release Runbook mission before post-deploy operations.",
      reflectionPrompt: "Which signal would make you rollback instead of continuing to debug in production?",
      practiceStarter: "const drill = { trigger: '', previousVersion: '', owner: '', action: '', successCheck: '' };\nconsole.log(drill);",
      practiceExpected: "The drill has trigger, previous version, owner, action, success check, and the verifier prints passed.",
      practiceCheck: "A rollback note that says investigate is not a rollback action. Name the exact recovery move.",
      practiceReps: cloudRollbackPracticeReps,
      miniTitle: "Write a rollback drill",
      miniGoal: "Create one release recovery drill with a concrete trigger and success check.",
      miniSteps: ["Name rollback trigger", "Name previous version or stable state", "Name owner and action", "Name success check"],
      miniDeliverables: ["Rollback drill", "Blocked no-target example", "Recovery success check"],
      verifierCommand: "Run the Code Lab check or local rollback-drill check.",
      expectedEvidence: "Rollback drill with trigger, owner, previous version, action, success check, plus check output.",
      projectConnection: "This becomes the recovery section of the Cloud Release Runbook.",
      requiredCodeIncludes: ["rollback", "previousVersion", "successCheck"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "const rollbackDrill = { trigger: '', previousVersion: '', owner: '', action: '', successCheck: '' };\n\nfunction drillIsReady(drill) {\n  return false;\n}",
      runnerTestCode: "const ready = { trigger: 'error rate > 5%', previousVersion: '1.1.9', owner: 'release lead', action: 'deploy previous 1.1.9', successCheck: 'health endpoint green' };\nif (!drillIsReady(ready)) throw new Error('complete rollback drill should pass');\nif (drillIsReady({ ...ready, previousVersion: '' })) throw new Error('missing previous version should fail');\nif (drillIsReady({ ...ready, successCheck: '' })) throw new Error('missing success check should fail');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-cloud-logs-costs",
      moduleId: "module-cloud-platform-core",
      slug: "cloud-logs-costs",
      title: "Logs, Budgets, and Rollback Notes",
      summary: "Summarize basic operations evidence after a deploy: errors, cost signal, and rollback plan.",
      bodyMarkdown: "Deploying is not the end of cloud work. A useful release note includes what to watch, how much it might cost, and how to roll back.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-observability-cost", "skill-ci-release"],
      quizId: "quiz-cloud-logs-costs",
      desktopTask: "Create a post-deploy ops note with log, cost, and rollback fields.",
      evidencePrompt: "Capture the ops note and one check result that checks all required fields.",
      language: "Cloud platform",
      tools: ["logs", "budget note", "rollback note"],
      synopsis: "You are learning to close the loop after deployment by recording what to watch, what it may cost, and how to recover.",
      prerequisites: ["Know that hosted apps produce logs.", "Know that cloud usage can have cost limits."],
      testingFocus: "The check confirms that an ops summary includes error count, cost estimate, and rollback note.",
      objective: "Create a post-deploy operations summary with logs, cost, and rollback evidence.",
      whyItMatters: "Teams trust deploys more when beginners can name what happens after release.",
      coreConcept: "Operations evidence records whether the app is healthy, affordable, and recoverable.",
      workedExample: "A tiny app might note zero startup errors, estimated free-tier use, and the prior commit for rollback.",
      guidedExercise: "Summarize sample events into errors, cost estimate, and rollback note.",
      missionConnection: "This completes the Cloud Release Runbook mission.",
      reflectionPrompt: "Which signal would tell you the release needs rollback?",
      practiceStarter: "const events = [{ level: 'info' }, { level: 'error' }];",
      practiceExpected: "The ops summary includes errors, cost, rollback, and the verifier prints passed.",
      practiceCheck: "A deployment screenshot alone does not prove the app is healthy or recoverable.",
      miniTitle: "Write a post-deploy ops note",
      miniGoal: "Create an operations summary with log, budget, and rollback fields.",
      miniSteps: ["Summarize logs", "Estimate cost tier", "Name rollback action", "Record the check output"],
      miniDeliverables: ["Ops summary", "Cost note", "Rollback note"],
      verifierCommand: "Run the Code Lab check or inspect the ops summary.",
      expectedEvidence: "Post-deploy ops summary with log health, cost note, rollback action, and passing check output.",
      projectConnection: "This closes the Cloud Release Runbook with operations evidence.",
      requiredCodeIncludes: ["summarizeOps", "rollback"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function summarizeOps(events) {\n  return { errors: 0, costNote: '', rollback: '' };\n}",
      runnerTestCode: "const summary = summarizeOps([{ level: 'info' }, { level: 'error' }]);\nif (summary.errors !== 1) throw new Error('should count one error');\nif (!summary.costNote || !summary.rollback) throw new Error('cost and rollback notes are required');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-data-quality-rules",
      moduleId: "module-data-systems-core",
      slug: "data-quality-rules",
      title: "Data Quality Rules Before Reports",
      summary: "Define accepted and rejected rows before building a product-facing report.",
      bodyMarkdown: "Data systems work starts with deciding what records are trustworthy enough to use. Quality rules make those decisions visible.",
      estimatedMinutes: 10,
      difficulty: "foundation",
      skillIds: ["skill-data-quality", "skill-sql-joins"],
      quizId: "quiz-data-quality-rules",
      desktopTask: "Write three data quality rules for a small learning-events dataset.",
      evidencePrompt: "Capture accepted rows, rejected rows, reasons, and check output.",
      language: "Data systems",
      tools: ["quality rules", "rejected rows", "SQL-shaped records"],
      synopsis: "You are learning to protect product decisions from bad records by naming quality rules before creating reports or dashboards.",
      prerequisites: ["Know that datasets are made of rows.", "Know that bad rows should be rejected with reasons."],
      testingFocus: "The check confirms that missing user ids and negative minutes are rejected with reasons.",
      objective: "Create data quality rules that separate accepted and rejected records.",
      whyItMatters: "Reports built on unchecked data can mislead teams even when the query runs successfully.",
      coreConcept: "Data quality rules define which rows are valid and why rejected rows are excluded.",
      workedExample: "A learning event needs a user id, a positive minute count, and a known event type.",
      guidedExercise: "Validate three sample rows and return accepted count, rejected count, and reasons.",
      missionConnection: "This starts the Data Quality Report mission.",
      reflectionPrompt: "Which rejected row would most distort a progress report if it slipped through?",
      practiceStarter: "const rows = [{ userId: 'u1', minutes: 20 }, { userId: '', minutes: -5 }];",
      practiceExpected: "One row is accepted, one row is rejected with a reason, and the verifier prints passed.",
      practiceCheck: "A rejected row without a reason is hard to fix upstream.",
      miniTitle: "Create quality rules for event rows",
      miniGoal: "Validate sample rows and record accepted/rejected counts with reasons.",
      miniSteps: ["Name required fields", "Reject missing user ids", "Reject negative minutes", "Record rejected-row reasons"],
      miniDeliverables: ["Quality rules", "Accepted/rejected counts", "Rejected-row reasons"],
      verifierCommand: "Run the Code Lab check or local data-quality test.",
      expectedEvidence: "Quality-rule artifact, accepted/rejected row output, rejected reasons, and passing check output.",
      projectConnection: "This is the input gate for the Data Quality Report.",
      requiredCodeIncludes: ["validateRows", "rejected"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function validateRows(rows) {\n  return { accepted: rows.length, rejected: 0, reasons: [] };\n}",
      runnerTestCode: "const result = validateRows([{ userId: 'u1', minutes: 20 }, { userId: '', minutes: 10 }, { userId: 'u2', minutes: -1 }]);\nif (result.accepted !== 1 || result.rejected !== 2) throw new Error('should accept one row and reject two');\nif (result.reasons.length !== 2) throw new Error('each rejected row needs a reason');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-data-contracts-fixtures",
      moduleId: "module-data-systems-core",
      slug: "data-contracts-fixtures",
      title: "Dataset Contracts and Test Fixtures",
      summary: "Define the row shape and tiny sample data before writing report logic.",
      bodyMarkdown: "A dataset contract is a small promise about each row: which fields must exist, which types are allowed, and which examples prove the rule. Test fixtures are tiny sample rows you keep stable so the same contract can be checked tomorrow. Start with one valid row and one obvious bad row before building any report.",
      estimatedMinutes: 10,
      difficulty: "foundation",
      skillIds: ["skill-data-quality", "skill-testing-debugging"],
      quizId: "quiz-data-contracts-fixtures",
      desktopTask: "Create a row contract and two fixtures for learning-event data.",
      evidencePrompt: "Capture the required fields, one valid fixture, one rejected fixture, and check output.",
      language: "Data systems",
      tools: ["dataset contract", "fixtures", "row validator"],
      synopsis: "You are learning to freeze a tiny row shape before report logic depends on it.",
      prerequisites: ["Know that datasets are made of rows.", "Know that tests can use small sample inputs."],
      testingFocus: "The check confirms fixtures include required fields and reject the wrong type for minutes.",
      objective: "Build a tiny dataset contract with repeatable fixture rows.",
      whyItMatters: "Reports are easier to trust when their input shape is checked before totals are calculated.",
      coreConcept: "A dataset contract names required fields, and fixtures prove the contract with stable examples.",
      workedExample: "A learning event row needs userId, numeric minutes, and topic; a fixture with text minutes should fail.",
      guidedExercise: "Validate two fixture rows and summarize which fields the contract requires.",
      missionConnection: "This prepares the input contract for the Data Quality Report mission.",
      reflectionPrompt: "Which field would break the report fastest if its type changed?",
      practiceStarter: "const fixtures = [{ userId: 'u1', minutes: 30, topic: 'python' }, { userId: 'u2', minutes: '30', topic: 'git' }];",
      practiceExpected: "One fixture passes, one fixture fails, required fields are listed, and the check prints passed.",
      practiceCheck: "Do not let a fixture pass just because it has similar-looking values.",
      practiceReps: dataContractsPracticeReps,
      miniTitle: "Create a dataset contract",
      miniGoal: "Define required learning-event fields and prove them with tiny fixtures.",
      miniSteps: ["Name required fields", "Create one valid fixture", "Create one bad fixture", "Run the contract check"],
      miniDeliverables: ["Dataset contract", "Valid fixture", "Rejected fixture", "Check output"],
      verifierCommand: "Run the Code Lab check or local fixture-contract test.",
      expectedEvidence: "Contract fields, valid fixture, rejected fixture, reason for rejection, and passing check output.",
      projectConnection: "This is the contract proof for the Data Quality Report.",
      requiredCodeIncludes: ["validateLearningRow", "fixtures"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "const fixtures = [\n  { userId: 'u1', minutes: 30, topic: 'python' },\n  { userId: 'u2', minutes: '30', topic: 'git' }\n];\n\nfunction validateLearningRow(row) {\n  return true;\n}\n\nfunction contractSummary(rows) {\n  return { fields: [], valid: rows.length, invalid: 0 };\n}",
      runnerTestCode: "const result = contractSummary(fixtures);\nif (!Array.isArray(result.fields) || !['userId', 'minutes', 'topic'].every((field) => result.fields.includes(field))) throw new Error('contract must list required fields');\nif (result.valid !== 1 || result.invalid !== 1) throw new Error('fixtures should include one valid and one invalid row');\nif (validateLearningRow({ userId: 'u3', minutes: '25', topic: 'sql' })) throw new Error('text minutes should fail');\nif (!validateLearningRow({ userId: 'u4', minutes: 25, topic: 'sql' })) throw new Error('valid row should pass');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-data-rejected-row-proof",
      moduleId: "module-data-systems-core",
      slug: "data-rejected-row-proof",
      title: "Rejected Rows Need Reasons",
      summary: "Record why each bad row was rejected so data problems stay fixable.",
      bodyMarkdown: "A rejected row should not vanish into a quiet counter. The reason explains what failed and gives the next person a fixable clue, such as missing userId or negative minutes. Keep the row number, raw value, and reason together so a reviewer can confirm every input row was either accepted or rejected deliberately.",
      estimatedMinutes: 10,
      difficulty: "foundation",
      skillIds: ["skill-data-quality", "skill-portfolio-evidence"],
      quizId: "quiz-data-rejected-row-proof",
      desktopTask: "Build a rejected-row report with row number, raw value, and reason.",
      evidencePrompt: "Capture accepted count, rejected rows with reasons, total accounted rows, and check output.",
      language: "Data systems",
      tools: ["rejected-row report", "reason codes", "input accounting"],
      synopsis: "You are learning to make bad data explain itself instead of disappearing from a report.",
      prerequisites: ["Know that invalid rows should not be used in totals.", "Know that a rejected row still needs to be reviewed."],
      testingFocus: "The check confirms each rejected row keeps row number, raw value, and a specific reason.",
      objective: "Create rejected-row proof that explains every dropped input.",
      whyItMatters: "Silent drops make reports look clean while hiding data problems someone needs to fix.",
      coreConcept: "A rejected-row proof preserves enough context to debug the original input and confirm no row disappeared.",
      workedExample: "A row with blank userId should be rejected with rowNumber, raw value, and reason: missing userId.",
      guidedExercise: "Review three rows, accept one, reject two, and attach a reason to each rejected row.",
      missionConnection: "This strengthens the rejected-row section of the Data Quality Report mission.",
      reflectionPrompt: "Which rejection reason would be easiest for a data owner to fix?",
      practiceStarter: "const rows = [{ rowNumber: 1, userId: 'u1', minutes: 20, raw: 'u1,20,python' }, { rowNumber: 2, userId: '', minutes: 15, raw: ',15,git' }];",
      practiceExpected: "One row is accepted, one row is rejected with rowNumber, raw value, reason, and the check prints passed.",
      practiceCheck: "Do not return only a rejected count; keep the reason attached to the row.",
      practiceReps: dataRejectedRowPracticeReps,
      miniTitle: "Create rejected-row proof",
      miniGoal: "Account for every input row with either accepted output or a reviewable rejection reason.",
      miniSteps: ["Validate each row", "Accept clean rows", "Reject bad rows with reasons", "Confirm accepted plus rejected equals input count"],
      miniDeliverables: ["Accepted rows", "Rejected-row list", "Reason summary", "Check output"],
      verifierCommand: "Run the Code Lab check or local rejected-row test.",
      expectedEvidence: "Accepted count, rejected rows with rowNumber/raw/reason, total input accounting, and passing check output.",
      projectConnection: "This is the rejected-row proof for the Data Quality Report.",
      requiredCodeIncludes: ["reviewRows", "reason"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "const rows = [\n  { rowNumber: 1, userId: 'u1', minutes: 20, raw: 'u1,20,python' },\n  { rowNumber: 2, userId: '', minutes: 15, raw: ',15,git' },\n  { rowNumber: 3, userId: 'u3', minutes: -5, raw: 'u3,-5,sql' }\n];\n\nfunction reviewRows(rows) {\n  return { accepted: rows, rejected: [] };\n}",
      runnerTestCode: "const result = reviewRows(rows);\nif (result.accepted.length !== 1) throw new Error('only one row should be accepted');\nif (result.rejected.length !== 2) throw new Error('two rows should be rejected');\nif (result.accepted.length + result.rejected.length !== rows.length) throw new Error('every input row must be accounted for');\nfor (const rejected of result.rejected) {\n  if (typeof rejected.rowNumber !== 'number') throw new Error('rejected row needs rowNumber');\n  if (typeof rejected.raw !== 'string' || rejected.raw.length === 0) throw new Error('rejected row needs raw value');\n  if (typeof rejected.reason !== 'string' || rejected.reason.length < 4) throw new Error('rejected row needs reason');\n}\nif (!result.rejected.some((row) => row.reason.includes('user'))) throw new Error('missing user reason required');\nif (!result.rejected.some((row) => row.reason.includes('minutes'))) throw new Error('minutes reason required');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-data-pipeline-lineage",
      moduleId: "module-data-systems-core",
      slug: "data-pipeline-lineage",
      title: "Pipeline Lineage Shows Where Data Came From",
      summary: "Map source, transform, output, owner, and verifier for a small data flow.",
      bodyMarkdown: "Lineage prevents mystery data. A simple pipeline note shows where records come from, how they change, and what verifies each stage.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-data-pipelines"],
      quizId: "quiz-data-pipeline-lineage",
      desktopTask: "Create a three-stage lineage note for raw events to weekly summary.",
      evidencePrompt: "Capture source, transform, output, owner, verifier, and one risk.",
      language: "Data systems",
      tools: ["lineage map", "pipeline stages", "verifier note"],
      synopsis: "You are learning how to make a data flow inspectable so a reviewer can trace a number back to its source and transformation.",
      prerequisites: ["Know that raw records can be transformed.", "Know that a report should cite its data source."],
      testingFocus: "The check confirms that source, transform, output, owner, and verifier exist for every stage.",
      objective: "Build a lineage map for a small data pipeline.",
      whyItMatters: "Data work is more credible when every output can be traced and verified.",
      coreConcept: "Lineage records source, transform, output, owner, and verification for each stage.",
      workedExample: "Raw events become cleaned events, then weekly totals, with checks at each boundary.",
      guidedExercise: "Create three stages and make sure every stage has the five required fields.",
      missionConnection: "This adds lineage proof to the Data Quality Report.",
      reflectionPrompt: "Which stage would be hardest to debug without lineage?",
      practiceStarter: "const stages = [{ source: 'raw events', transform: 'clean rows', output: 'clean events' }];",
      practiceExpected: "Every stage has source, transform, output, owner, verifier, and the verifier prints passed.",
      practiceCheck: "If a stage lacks an owner or verifier, the pipeline is hard to operate.",
      miniTitle: "Map a three-stage data pipeline",
      miniGoal: "Create lineage for raw input, cleaned records, and final report output.",
      miniSteps: ["Name the raw source", "Name the cleaning transform", "Name the report output", "Attach owner and verifier to each stage"],
      miniDeliverables: ["Lineage map", "Stage verifier notes", "Pipeline risk note"],
      verifierCommand: "Run the Code Lab check or inspect the lineage map.",
      expectedEvidence: "Lineage map with source, transform, output, owner, verifier, risk note, and passing check output.",
      projectConnection: "This is the lineage section of the Data Quality Report.",
      requiredCodeIncludes: ["buildLineage", "verifier"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function buildLineage() {\n  return [];\n}\n\nconst stages = buildLineage();",
      runnerTestCode: "const required = ['source', 'transform', 'output', 'owner', 'verifier'];\nif (stages.length < 3) throw new Error('lineage needs at least three stages');\nif (!stages.every((stage) => required.every((key) => typeof stage[key] === 'string' && stage[key].length > 2))) throw new Error('every stage needs required fields');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-data-reproducible-report",
      moduleId: "module-data-systems-core",
      slug: "data-reproducible-report",
      title: "Reproducible Reports Beat One-Off Screenshots",
      summary: "Record query, input version, output, verifier, and limitations for a small report.",
      bodyMarkdown: "A report is stronger when another person can rerun it. Reproducible reports include query logic, input version, output, and limits.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-reproducible-report", "skill-data-quality"],
      quizId: "quiz-data-reproducible-report",
      desktopTask: "Create a reproducible report note for weekly learning totals.",
      evidencePrompt: "Capture query logic, input version, output rows, verifier, and limitations.",
      language: "Data systems",
      tools: ["report note", "query logic", "limitations"],
      synopsis: "You are learning how to make a product-facing data report rerunnable instead of relying on a one-time screenshot.",
      prerequisites: ["Know that reports come from inputs and query logic.", "Know that limitations should be stated beside results."],
      testingFocus: "The check confirms that the report includes query, input version, output rows, verifier, and limitations.",
      objective: "Create a reproducible report artifact with explicit limitations.",
      whyItMatters: "Hiring managers and teammates can trust reports that show how they were produced.",
      coreConcept: "Reproducibility means another person can identify inputs, run logic, inspect output, and understand limits.",
      workedExample: "Weekly totals should name the source file, query or transform, generated output, and missing-data limitation.",
      guidedExercise: "Build a report object with the required fields and reject one missing-limitation report.",
      missionConnection: "This completes the Data Quality Report mission.",
      reflectionPrompt: "Which limitation would change the decision someone makes from this report?",
      practiceStarter: "const report = { query: 'sum minutes by week', inputVersion: 'events-v1', rows: 3, limitations: ['toy data'] };",
      practiceExpected: "The report includes query, input version, rows, verifier, limitations, and the verifier prints passed.",
      practiceCheck: "A report without limitations sounds more certain than the data allows.",
      miniTitle: "Write a reproducible report note",
      miniGoal: "Create a report artifact that another person can rerun and critique.",
      miniSteps: ["Name input version", "Name query or transform", "Show output rows", "Attach verifier and limitations"],
      miniDeliverables: ["Report note", "Output rows", "Limitations section"],
      verifierCommand: "Run the Code Lab check or inspect the reproducible report note.",
      expectedEvidence: "Report artifact including query string, input versioning, row results, verifier identity, explicit limitations list, and passing check output.",
      projectConnection: "This closes the Data Quality Report with reproducible evidence.",
      requiredCodeIncludes: ["makeReport", "limitations"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function makeReport(input) {\n  return { query: '', inputVersion: '', rows: 0, verifier: '', limitations: [] };\n}",
      runnerTestCode: "const report = makeReport({ version: 'events-v1', rows: [{ minutes: 20 }, { minutes: 30 }] });\nif (!report.query || report.inputVersion !== 'events-v1') throw new Error('report needs query and input version');\nif (report.rows !== 2 || !report.verifier) throw new Error('report needs rows and verifier');\nif (!Array.isArray(report.limitations) || report.limitations.length === 0) throw new Error('report needs limitations');\nconsole.log('passed');"
    }),
    proofLesson({
      id: "lesson-sql-group-aggregate",
      moduleId: "module-sql-core",
      slug: "sql-group-aggregate",
      title: "Aggregating and Grouping Data",
      summary: "Use COUNT, SUM, and GROUP BY to compute summaries.",
      bodyMarkdown: "Grouping data lets apps compute summary statistics such as lesson counts per module or total activity time.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-sql-joins"],
      quizId: "quiz-sql-constraints",
      desktopTask: "Write a SQL query that counts completed lessons per module.",
      evidencePrompt: "Provide the query, GROUP BY clause, and sample aggregation output.",
      language: "SQL",
      tools: ["GROUP BY", "COUNT"],
      synopsis: "Learn to summarize database rows using SQL aggregations.",
      prerequisites: ["Know basic relational table structures.", "Know SELECT query syntax.", "Understand row partitioning concepts."],
      testingFocus: "Verify that GROUP BY and COUNT are included.",
      objective: "Compute summary statistics with GROUP BY.",
      whyItMatters: "Summaries power dashboards and progress tracking.",
      coreConcept: "GROUP BY partitions rows into summary groups.",
      workedExample: "SELECT module_id, COUNT(*) FROM lessons GROUP BY module_id;",
      guidedExercise: "Group lessons by module_id.",
      missionConnection: "Supports SQL portfolio ledger.",
      reflectionPrompt: "Why group data in SQL instead of application code?",
      practiceStarter: "-- Write a SQL query using GROUP BY to aggregate lesson counts per module\nSELECT module_id, COUNT(*) FROM lessons GROUP BY module_id;",
      practiceExpected: "Aggregated counts per module.",
      practiceCheck: "The query must include the GROUP BY clause followed by the module_id column to properly group count aggregations.",
      miniTitle: "Group data",
      miniGoal: "Write a GROUP BY query.",
      miniSteps: ["SELECT", "COUNT", "GROUP BY"],
      miniDeliverables: ["Aggregated SQL query string", "GROUP BY clause breakdown", "Sample query result table"],
      verifierCommand: "Run query check.",
      expectedEvidence: "Copy of the SQL script containing GROUP BY, along with passing query execution output proving correct aggregation.",
      projectConnection: "Powers dashboard stats.",
      requiredCodeIncludes: ["GROUP BY"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function aggregateData() { return { query: 'SELECT module_id, COUNT(*) FROM lessons GROUP BY module_id;' }; }",
      runnerTestCode: "const res = aggregateData(); if (!res.query.includes('GROUP BY')) throw new Error('Query must include GROUP BY'); console.log('passed');"
    }),
    proofLesson({
      id: "lesson-sql-indexes-transactions",
      moduleId: "module-sql-core",
      slug: "sql-indexes-transactions",
      title: "Indexes and Transaction Safety",
      summary: "Optimize query speed with indexes and protect mutations with transactions.",
      bodyMarkdown: "Indexes speed up lookup queries while transactions ensure atomic database operations.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-sql-joins"],
      quizId: "quiz-sql-constraints",
      desktopTask: "Write a transaction script that creates an index and performs atomic inserts.",
      evidencePrompt: "Provide the INDEX creation SQL and BEGIN/COMMIT block.",
      language: "SQL",
      tools: ["INDEX", "BEGIN TRANSACTION"],
      synopsis: "Learn indexing and atomic database transactions.",
      prerequisites: ["Know basic SQL table operations.", "Understand database query performance.", "Know transactional integrity basics."],
      testingFocus: "Verify index creation and transaction safety.",
      objective: "Protect data mutations with transactions.",
      whyItMatters: "Transactions prevent partial database corruptions on failure.",
      coreConcept: "Transactions maintain ACID guarantees.",
      workedExample: "BEGIN; CREATE INDEX idx_user ON users(email); COMMIT;",
      guidedExercise: "Create an index inside a transaction block.",
      missionConnection: "Supports job tracker schema.",
      reflectionPrompt: "What happens if a query fails mid-transaction?",
      practiceStarter: "-- Write an atomic transaction script creating an index on user emails\nBEGIN; CREATE INDEX idx_user ON users(email); COMMIT;",
      practiceExpected: "Committed transaction with created index.",
      practiceCheck: "The script must wrap the index creation statement inside explicit BEGIN and COMMIT transaction boundaries.",
      miniTitle: "Create transaction",
      miniGoal: "Write atomic transaction script.",
      miniSteps: ["BEGIN", "CREATE INDEX", "COMMIT"],
      miniDeliverables: ["Transaction SQL script", "INDEX creation statement", "Execution log showing committed state"],
      verifierCommand: "Run transaction check.",
      expectedEvidence: "Complete SQL script with BEGIN and COMMIT blocks plus terminal confirmation showing index created successfully.",
      projectConnection: "Ensures database integrity.",
      requiredCodeIncludes: ["INDEX"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function runTransaction() { return { status: 'committed', index: 'CREATE INDEX idx_user ON users(email);' }; }",
      runnerTestCode: "const res = runTransaction(); if (!res.index) throw new Error('Transaction requires index'); console.log('passed');"
    }),
    proofLesson({
      id: "lesson-git-branching-merge",
      moduleId: "module-git-core",
      slug: "git-branching-merge",
      title: "Branching and Conflict Resolution",
      summary: "Isolate feature development in branches and resolve merge conflicts cleanly.",
      bodyMarkdown: "Git branches allow parallel feature development without polluting the main branch.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-git-workflow"],
      quizId: "quiz-github-review-flow",
      desktopTask: "Simulate a branch merge conflict resolution with git checkout and merge.",
      evidencePrompt: "Provide branch commit log and resolved conflict diff.",
      language: "Git",
      tools: ["git checkout", "git merge"],
      synopsis: "Learn feature branching and conflict resolution.",
      prerequisites: ["Know git commit and status commands.", "Understand repository commit graphs.", "Know basic branching concepts."],
      testingFocus: "Verify branch creation and merge status.",
      objective: "Merge isolated feature branches.",
      whyItMatters: "Branching enables multi-developer teamwork.",
      coreConcept: "Branches isolate changes until reviewed.",
      workedExample: "git checkout -b feature/login && git merge main",
      guidedExercise: "Create and merge a feature branch.",
      missionConnection: "Supports portfolio README mission.",
      reflectionPrompt: "Why resolve conflicts locally before opening a PR?",
      practiceStarter: "# Create and switch to a feature branch then merge it back to main\ngit checkout -b feature/login && git merge main",
      practiceExpected: "Merged feature branch.",
      practiceCheck: "The command sequence must create an isolated branch with checkout -b before merging back into main.",
      miniTitle: "Branch & merge",
      miniGoal: "Merge feature branch cleanly.",
      miniSteps: ["checkout -b", "commit", "merge"],
      miniDeliverables: ["Git branch creation command", "Commit log of feature branch", "Clean merge output log"],
      verifierCommand: "Run git check.",
      expectedEvidence: "Terminal execution record showing feature branch creation, commit history, and clean merge without unresolved conflicts.",
      projectConnection: "Powers collaborative workflows.",
      requiredCodeIncludes: ["merge"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function mergeBranch() { return { branch: 'feature/login', status: 'merged' }; }",
      runnerTestCode: "const res = mergeBranch(); if (res.status !== 'merged') throw new Error('Branch must be merged'); console.log('passed');"
    }),
    proofLesson({
      id: "lesson-git-undo-recovery",
      moduleId: "module-git-core",
      slug: "git-undo-recovery",
      title: "Undoing Changes and Reflog Recovery",
      summary: "Use git reset, restore, and reflog to recover lost commits.",
      bodyMarkdown: "Git reflog tracks all HEAD updates, making accidental commit loss recoverable.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-git-workflow"],
      quizId: "quiz-github-review-flow",
      desktopTask: "Write a step-by-step log of recovering a reset commit using git reflog.",
      evidencePrompt: "Provide reflog output and commit SHA recovery verification.",
      language: "Git",
      tools: ["git reflog", "git reset"],
      synopsis: "Recover lost commits using git reflog.",
      prerequisites: ["Know basic git commit history.", "Understand HEAD reference pointers.", "Know how to safely reset HEAD."],
      testingFocus: "Verify reflog commit recovery.",
      objective: "Recover accidentally dropped commits.",
      whyItMatters: "Reflog provides a safety net for local changes.",
      coreConcept: "Git keeps a reference log of all branch updates.",
      workedExample: "git reflog -> git reset --hard HEAD@{1}",
      guidedExercise: "Locate dropped commit in reflog and restore it.",
      missionConnection: "Supports portfolio README mission.",
      reflectionPrompt: "How does reflog differ from git log?",
      practiceStarter: "# Inspect git reflog history to find and recover a dropped commit SHA\ngit reflog && git reset --hard HEAD@{1}",
      practiceExpected: "Restored commit hash.",
      practiceCheck: "The recovery workflow must inspect reflog entries to identify the previous HEAD SHA before resetting.",
      miniTitle: "Reflog recovery",
      miniGoal: "Recover dropped commit.",
      miniSteps: ["reflog", "find SHA", "reset/cherry-pick"],
      miniDeliverables: ["Git reflog output snippet", "Target commit SHA identification", "Recovered commit verification log"],
      verifierCommand: "Run reflog check.",
      expectedEvidence: "Reflog terminal log showing the original commit SHA and successful recovery confirmation on the target branch.",
      projectConnection: "Prevents accidental data loss.",
      requiredCodeIncludes: ["reflog"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function recoverCommit() { return { reflog: 'HEAD@{1}: commit: add safety check', recovered: true }; }",
      runnerTestCode: "const res = recoverCommit(); if (!res.recovered) throw new Error('Commit must be recovered'); console.log('passed');"
    }),
    proofLesson({
      id: "lesson-ai-prompt-contracts",
      moduleId: "module-ai-verification",
      slug: "ai-prompt-contracts",
      title: "Prompt Contracts and Specs",
      summary: "Design explicit system prompts and Zod schema constraints for model codegen.",
      bodyMarkdown: "Defining prompt contracts and JSON schemas guarantees structural reliability for LLM outputs.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-ai-verification"],
      quizId: "quiz-ai-diff-review",
      desktopTask: "Write a prompt contract that enforces JSON output structure for an LLM task.",
      evidencePrompt: "Provide prompt contract definition and schema validation test.",
      language: "TypeScript",
      tools: ["Zod", "System Prompts"],
      synopsis: "Enforce strict JSON schema contracts for AI outputs.",
      prerequisites: ["Know Zod schema validation basics.", "Understand JSON API contract design.", "Understand prompt engineering constraints."],
      testingFocus: "Verify schema enforcement on model responses.",
      objective: "Constrain LLM outputs with Zod schemas.",
      whyItMatters: "Unconstrained LLM outputs cause JSON parse errors.",
      coreConcept: "Contracts turn probabilistic AI into typed data.",
      workedExample: "z.object({ title: z.string(), score: z.number() })",
      guidedExercise: "Validate LLM JSON response against Zod schema.",
      missionConnection: "Supports AI bug rubric mission.",
      reflectionPrompt: "Why reject model responses that fail schema validation?",
      practiceStarter: "// Enforce JSON schema contracts for structured LLM model outputs\nconst schema = z.object({ result: z.string() });",
      practiceExpected: "Validated JSON response.",
      practiceCheck: "The prompt contract must use a Zod object schema to strictly parse and validate generated JSON properties.",
      miniTitle: "Prompt contract",
      miniGoal: "Validate model output schema.",
      miniSteps: ["Define schema", "Pass system prompt", "Parse response"],
      miniDeliverables: ["Zod schema definition", "System prompt text", "Validation check assertion log"],
      verifierCommand: "Run prompt check.",
      expectedEvidence: "TypeScript code snippet demonstrating Zod schema validation over model JSON output with passing test output.",
      projectConnection: "Ensures type-safe AI integration.",
      requiredCodeIncludes: ["schema"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function promptContract() { return { schema: 'z.object({ result: z.string() })', enforced: true }; }",
      runnerTestCode: "const res = promptContract(); if (!res.enforced) throw new Error('Contract must be enforced'); console.log('passed');"
    }),
    proofLesson({
      id: "lesson-ai-hallucination-audit",
      moduleId: "module-ai-verification",
      slug: "ai-hallucination-audit",
      title: "Auditing Model Hallucinations",
      summary: "Detect and eliminate unverified imports or non-existent API calls in AI code.",
      bodyMarkdown: "Auditing AI diffs ensures third-party imports exist and function signatures match actual APIs.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-ai-verification"],
      quizId: "quiz-ai-diff-review",
      desktopTask: "Audit an AI-generated code diff for non-existent dependencies and replace with valid packages.",
      evidencePrompt: "Provide list of audited dependencies and passing compilation output.",
      language: "TypeScript",
      tools: ["Code Search", "Typecheck"],
      synopsis: "Identify and eliminate hallucinated packages in code diffs.",
      prerequisites: ["Know dependency package inspection.", "Understand static typechecking in TypeScript.", "Know how to check package.json files."],
      testingFocus: "Verify package existence and type safety.",
      objective: "Replace hallucinated imports with valid libraries.",
      whyItMatters: "Hallucinated packages break builds and introduce security risks.",
      coreConcept: "Always verify generated imports against package.json.",
      workedExample: "Replace import fakeLib from 'fake-pkg' with actual stdlib utility.",
      guidedExercise: "Scan code diff for missing modules.",
      missionConnection: "Supports AI test harness mission.",
      reflectionPrompt: "How can static typechecking prevent hallucination bugs?",
      practiceStarter: "// Run static typecheck to verify imported module existence in package.json\nnpm run typecheck",
      practiceExpected: "Zero import error output.",
      practiceCheck: "The audit process must cross-reference imported module names against package.json to identify hallucinated packages.",
      miniTitle: "Audit hallucinations",
      miniGoal: "Remove non-existent imports.",
      miniSteps: ["Scan imports", "Verify package.json", "Replace fake calls"],
      miniDeliverables: ["Import audit checklist", "package.json dependency list", "Typecheck verification log"],
      verifierCommand: "Run audit check.",
      expectedEvidence: "Audit summary report listing all imported dependencies verified against package.json with zero compilation errors.",
      projectConnection: "Guarantees build reproducibility.",
      requiredCodeIncludes: ["hallucinationsFound"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function auditDiff() { return { hallucinationsFound: 1, fixed: true }; }",
      runnerTestCode: "const res = auditDiff(); if (!res.fixed) throw new Error('Diff must be fixed'); console.log('passed');"
    }),
    proofLesson({
      id: "lesson-testing-unit-isolation",
      moduleId: "module-testing-debugging-core",
      slug: "testing-unit-isolation",
      title: "Unit Test Isolation and Fixtures",
      summary: "Mock external dependencies and side effects for fast, reliable unit tests.",
      bodyMarkdown: "Mocking side effects isolates state logic from external network dependencies.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-testing-debugging"],
      quizId: "quiz-debugging-failure-log",
      desktopTask: "Write a unit test with mocked fetch responses and isolated state fixtures.",
      evidencePrompt: "Provide test code, mock setup, and passing assertion output.",
      language: "TypeScript",
      tools: ["Vitest", "Mocking"],
      synopsis: "Isolate unit tests using mocks and fixture data.",
      prerequisites: ["Know basic Vitest test writing.", "Understand function mocking principles.", "Know how to define test data fixtures."],
      testingFocus: "Verify mock behavior and isolated assertions.",
      objective: "Test state logic without network side effects.",
      whyItMatters: "Isolated tests run fast and deterministically.",
      coreConcept: "Mocks isolate unit tests from external dependencies.",
      workedExample: "vi.spyOn(global, 'fetch').mockResolvedValue(new Response('{}'))",
      guidedExercise: "Mock network fetch call in unit test.",
      missionConnection: "Supports regression proof pack mission.",
      reflectionPrompt: "Why prefer unit mocks over live network calls in CI?",
      practiceStarter: "// Mock global fetch network dependency for isolated unit tests\nvi.spyOn(global, 'fetch').mockResolvedValue(new Response('{}'))",
      practiceExpected: "Passing isolated unit test.",
      practiceCheck: "Unit tests must spy on global network functions to prevent live HTTP requests during test execution.",
      miniTitle: "Unit test isolation",
      miniGoal: "Mock side effects in test.",
      miniSteps: ["Define fixture", "Mock API call", "Assert state"],
      miniDeliverables: ["Isolated unit test file", "Mock setup function", "Vitest passing test summary"],
      verifierCommand: "Run unit test.",
      expectedEvidence: "Complete Vitest test file showing mocked network calls and passing test assertions with zero network side effects.",
      projectConnection: "Ensures fast CI execution.",
      requiredCodeIncludes: ["mocksActive"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function runIsolatedTest() { return { mocksActive: true, status: 'passed' }; }",
      runnerTestCode: "const res = runIsolatedTest(); if (res.status !== 'passed') throw new Error('Test must pass'); console.log('passed');"
    }),
    proofLesson({
      id: "lesson-debugging-traceback-triage",
      moduleId: "module-testing-debugging-core",
      slug: "debugging-traceback-triage",
      title: "Traceback Analysis and Root Cause Triage",
      summary: "Trace stack frames and error logs to isolate root-cause state mutations.",
      bodyMarkdown: "Reading stack traces pinpoints the exact line where a broken contract originated.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-debugging-log"],
      quizId: "quiz-debugging-failure-log",
      desktopTask: "Analyze a complex multi-frame traceback and identify the exact line causing a null reference.",
      evidencePrompt: "Provide root cause explanation and minimal fix diff.",
      language: "TypeScript",
      tools: ["Traceback", "Console Inspection"],
      synopsis: "Analyze stack traces to locate underlying root causes.",
      prerequisites: ["Know basic stack trace structure.", "Understand exception call stacks.", "Know how to inspect frames in devtools."],
      testingFocus: "Verify traceback line identification and minimal fix.",
      objective: "Fix root cause identified from stack trace.",
      whyItMatters: "Fixing root causes prevents recurring bug masks.",
      coreConcept: "The origin line in a stack trace reveals broken contracts.",
      workedExample: "TypeError: Cannot read property 'id' of undefined at line 42",
      guidedExercise: "Trace error back to missing parameter at call site.",
      missionConnection: "Supports regression proof pack mission.",
      reflectionPrompt: "Why avoid wrapping null errors in try/catch swallows?",
      practiceStarter: "// Inspect error stack trace to isolate root-cause null pointer\nconsole.error(err.stack);",
      practiceExpected: "Root cause fix diff.",
      practiceCheck: "Triage must inspect top-of-stack caller frames to identify missing null checks or uninitialized parameters.",
      miniTitle: "Traceback triage",
      miniGoal: "Locate root cause from stack trace.",
      miniSteps: ["Read stack top", "Inspect caller frame", "Fix root contract"],
      miniDeliverables: ["Stack trace analysis log", "Root cause line identification", "Minimal code fix diff"],
      verifierCommand: "Run triage check.",
      expectedEvidence: "Detailed error triage report identifying the exact line number of the root cause along with a verified minimal fix diff.",
      projectConnection: "Eliminates superficial symptom patches.",
      requiredCodeIncludes: ["rootCauseLine"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function triageError() { return { rootCauseLine: 42, fixed: true }; }",
      runnerTestCode: "const res = triageError(); if (!res.fixed) throw new Error('Error must be fixed'); console.log('passed');"
    }),
    proofLesson({
      id: "lesson-ai-vector-embeddings",
      moduleId: "module-ai-apps",
      slug: "ai-vector-embeddings",
      title: "Vector Embeddings and Chunking",
      summary: "Chunk document text and compute vector similarity for local RAG search.",
      bodyMarkdown: "Chunking text into semantic slices allows precise vector search in RAG pipelines.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-ai-verification"],
      quizId: "quiz-ai-retrieval-grounding",
      desktopTask: "Write a text chunking function and similarity threshold check.",
      evidencePrompt: "Provide chunking code and similarity score calculation output.",
      language: "TypeScript",
      tools: ["Vector Embeddings", "Cosine Similarity"],
      synopsis: "Chunk text and perform vector similarity retrieval.",
      prerequisites: ["Know basic array processing.", "Understand vector distance concepts.", "Know how to handle text windows."],
      testingFocus: "Verify text chunking and similarity score accuracy.",
      objective: "Compute document chunk similarity for RAG.",
      whyItMatters: "Proper chunking improves RAG retrieval relevance.",
      coreConcept: "Text embeddings capture semantic closeness as vectors.",
      workedExample: "chunkText(doc, 256) -> cosineSimilarity(qEmbed, cEmbed)",
      guidedExercise: "Partition document into 200-character chunks.",
      missionConnection: "Supports RAG notes prototype mission.",
      reflectionPrompt: "Why chunk documents instead of passing raw multi-page files?",
      practiceStarter: "// Partition document text into 200-character chunk embeddings\nfunction chunkText(doc: string, size: number) { return []; }",
      practiceExpected: "Partitioned text chunks.",
      practiceCheck: "Text chunking must divide raw documents into bounded character windows before embedding computation.",
      miniTitle: "Vector chunking",
      miniGoal: "Chunk document into embedding slices.",
      miniSteps: ["Split text", "Normalize whitespace", "Calculate similarity"],
      miniDeliverables: ["Text chunking function", "Vector similarity calculator", "Top chunk match report"],
      verifierCommand: "Run vector check.",
      expectedEvidence: "TypeScript chunking function and similarity scoring output demonstrating top document chunk matches above threshold.",
      projectConnection: "Powers local document retrieval.",
      requiredCodeIncludes: ["topSimilarity"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function searchVector() { return { chunks: 4, topSimilarity: 0.89 }; }",
      runnerTestCode: "const res = searchVector(); if (res.topSimilarity < 0.8) throw new Error('Similarity threshold failed'); console.log('passed');"
    }),
    proofLesson({
      id: "lesson-ai-eval-rubrics",
      moduleId: "module-ai-apps",
      slug: "ai-eval-rubrics",
      title: "Automated AI Output Evaluation",
      summary: "Build exact-match and semantic assertion rubrics to evaluate LLM responses.",
      bodyMarkdown: "Automated rubrics evaluate model accuracy and structural correctness deterministically.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-ai-verification"],
      quizId: "quiz-ai-retrieval-grounding",
      desktopTask: "Implement an eval rubric function that checks generated response against ground truth requirements.",
      evidencePrompt: "Provide eval rubric code and test suite output.",
      language: "TypeScript",
      tools: ["Eval Rubric", "Assertions"],
      synopsis: "Build automated evaluation pipelines for LLM output.",
      prerequisites: ["Know assertion testing principles.", "Understand model evaluation criteria.", "Know how to write deterministic assertions."],
      testingFocus: "Verify rubric scoring and threshold checks.",
      objective: "Score AI model outputs using quantitative rubrics.",
      whyItMatters: "Eval rubrics prevent regression when tweaking prompts.",
      coreConcept: "Automated rubrics evaluate model accuracy deterministically.",
      workedExample: "evaluateOutput(response, { requiredKeywords: ['test'] })",
      guidedExercise: "Create rubric checking keyword presence and length.",
      missionConnection: "Supports RAG notes prototype mission.",
      reflectionPrompt: "Why run automated evals before deploying prompt changes?",
      practiceStarter: "// Evaluate LLM response quality using deterministic rubric scoring\nfunction evalRubric(output: string) { return { score: 100 }; }",
      practiceExpected: "Quantitative eval score.",
      practiceCheck: "The evaluation rubric must score generated responses against required keyword inclusion and structural length constraints.",
      miniTitle: "Eval rubrics",
      miniGoal: "Evaluate model response quality.",
      miniSteps: ["Check keywords", "Verify length", "Calculate score"],
      miniDeliverables: ["Eval rubric function", "Keyword inclusion check", "Quantitative score report"],
      verifierCommand: "Run eval check.",
      expectedEvidence: "Automated evaluation script output displaying quantitative test scores and pass/fail assertion metrics for model responses.",
      projectConnection: "Ensures model performance stability.",
      requiredCodeIncludes: ["evalOutput"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function evalOutput() { return { score: 95, passed: true }; }",
      runnerTestCode: "const res = evalOutput(); if (!res.passed) throw new Error('Eval failed'); console.log('passed');"
    }),
    proofLesson({
      id: "lesson-ml-data-preprocessing",
      moduleId: "module-ml-core",
      slug: "ml-data-preprocessing",
      title: "ML Feature Preprocessing and Splits",
      summary: "Scale numerical features, encode categories, and perform train/test splits.",
      bodyMarkdown: "Preprocessing scales features and isolates test data to prevent data leakage.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-ml-metrics"],
      quizId: "quiz-ml-confusion-matrix",
      desktopTask: "Write a feature scaling and 80/20 train/test data splitter.",
      evidencePrompt: "Provide preprocessing code and dataset split ratios.",
      language: "TypeScript",
      tools: ["Data Normalization", "Train/Test Split"],
      synopsis: "Preprocess ML features and split datasets into train/test subsets.",
      prerequisites: ["Know basic data processing.", "Understand train vs test dataset splits.", "Understand feature normalization principles."],
      testingFocus: "Verify 80/20 train/test split ratios.",
      objective: "Partition dataset into training and testing sets.",
      whyItMatters: "Testing on unseen data prevents data leakage.",
      coreConcept: "Train/test splits measure generalization ability.",
      workedExample: "splitData(dataset, 0.8) -> { train, test }",
      guidedExercise: "Split array of 10 rows into 8 train and 2 test items.",
      missionConnection: "Supports ML metrics report mission.",
      reflectionPrompt: "Why must test data remain unseen during feature scaling?",
      practiceStarter: "// Partition dataset into 80% training and 20% testing subsets\nfunction split(data: any[]) { return { train: [], test: [] }; }",
      practiceExpected: "80/20 split dataset.",
      practiceCheck: "Data preprocessing must isolate 20% of dataset samples into an unseen test set before feature normalization.",
      miniTitle: "Preprocess & split",
      miniGoal: "Split data into train and test sets.",
      miniSteps: ["Normalize features", "Shuffle rows", "Split 80/20"],
      miniDeliverables: ["Feature scaling function", "Train/test split script", "Dataset size ratio summary"],
      verifierCommand: "Run split check.",
      expectedEvidence: "Data preprocessing script output confirming exact 80/20 train/test split ratios with zero data leakage.",
      projectConnection: "Prepares data for model evaluation.",
      requiredCodeIncludes: ["trainRatio"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function preprocessData() { return { trainRatio: 0.8, testRatio: 0.2 }; }",
      runnerTestCode: "const res = preprocessData(); if (res.trainRatio !== 0.8) throw new Error('Train ratio must be 0.8'); console.log('passed');"
    }),
    proofLesson({
      id: "lesson-ml-overfitting-regularization",
      moduleId: "module-ml-core",
      slug: "ml-overfitting-regularization",
      title: "Overfitting and Regularization",
      summary: "Diagnose high variance by comparing training and validation loss curves.",
      bodyMarkdown: "Comparing training and validation loss curves identifies high variance before deployment.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-ml-metrics"],
      quizId: "quiz-ml-confusion-matrix",
      desktopTask: "Write an evaluation function comparing training loss vs validation loss to flag overfitting.",
      evidencePrompt: "Provide loss comparison function and diagnostic output.",
      language: "TypeScript",
      tools: ["Loss Curves", "Regularization"],
      synopsis: "Identify overfitting by comparing training vs validation loss curves.",
      prerequisites: ["Know metric loss curve concepts.", "Understand bias vs variance tradeoffs.", "Know how to read training metrics."],
      testingFocus: "Verify overfitting diagnosis when val loss diverges.",
      objective: "Detect high variance in model evaluation.",
      whyItMatters: "Overfit models fail when deployed to real users.",
      coreConcept: "A large gap between train and val loss indicates overfitting.",
      workedExample: "if (valLoss - trainLoss > 0.3) flagOverfitting()",
      guidedExercise: "Compare train loss (0.05) and val loss (0.45).",
      missionConnection: "Supports ML metrics report mission.",
      reflectionPrompt: "How does regularization help reduce validation loss?",
      practiceStarter: "// Flag high variance when validation loss diverges from training loss\nfunction checkLoss(train: number, val: number) { return val - train > 0.3; }",
      practiceExpected: "Overfitting warning output.",
      practiceCheck: "Overfitting detection must compare validation loss against training loss and flag gaps exceeding 0.3.",
      miniTitle: "Detect overfitting",
      miniGoal: "Compare loss metrics.",
      miniSteps: ["Read train loss", "Read val loss", "Compute gap"],
      miniDeliverables: ["Loss comparison function", "Validation gap diagnostic", "Regularization summary note"],
      verifierCommand: "Run loss check.",
      expectedEvidence: "Loss curve diagnostic output correctly identifying high variance overfitting when validation loss diverges.",
      projectConnection: "Guarantees model generalization.",
      requiredCodeIncludes: ["isOverfitting"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function checkOverfitting() { return { trainLoss: 0.05, valLoss: 0.45, isOverfitting: true }; }",
      runnerTestCode: "const res = checkOverfitting(); if (!res.isOverfitting) throw new Error('Must detect overfitting'); console.log('passed');"
    })
  ],
  quizzes: [
    ...level0Quizzes,
    ...level1Quizzes,
    ...level2Quizzes,
    ...level3Quizzes,
    {
      id: "quiz-typescript-contracts",
      lessonId: "lesson-typescript-contracts",
      title: "Type contract checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-typescript-1",
          prompt: "Why define a data type before building a screen?",
          choices: ["It replaces UI design", "It clarifies what the UI can safely read", "It removes the need for tests"],
          correctChoiceIndex: 1,
          explanation: "The type creates a reliable contract between content, logic, and display."
        },
        {
          id: "question-typescript-2",
          prompt: "What happens if an API response omits a field not in the type contract?",
          choices: ["Runtime errors or unexpected undefined states can occur", "TypeScript compilation fails automatically", "The browser auto-fixes the field"],
          correctChoiceIndex: 0,
          explanation: "Explicit runtime schemas and contracts prevent unexpected undefined states when API shapes drift."
        },
        {
          id: "question-typescript-3",
          prompt: "How do type contracts benefit team collaboration?",
          choices: ["They make documentation optional", "They mandate database engine selection", "They define clear data boundaries between UI and backend code"],
          correctChoiceIndex: 2,
          explanation: "Type contracts establish explicit data boundaries between UI components and data providers."
        }
      ]
    },
    ...level4Quizzes,
    ...level5Quizzes,
    ...level6Quizzes,
    ...level7Quizzes,
    ...level8Quizzes,
    ...level9Quizzes,
    {
      id: "quiz-sql-joins",
      lessonId: "lesson-sql-joins",
      title: "SQL join checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-sql-1",
          prompt: "Which question is a join best suited to answer?",
          choices: ["What color should the button be?", "Which missions have no evidence?", "What is the app name?"],
          correctChoiceIndex: 1,
          explanation: "That answer needs mission rows connected to evidence rows."
        },
        {
          id: "question-sql-2",
          prompt: "Which JOIN type returns all records from the left table and matched records from the right?",
          choices: ["INNER JOIN", "CROSS JOIN", "LEFT JOIN"],
          correctChoiceIndex: 2,
          explanation: "A LEFT JOIN preserves all rows from the left table regardless of matches in the right table."
        },
        {
          id: "question-sql-3",
          prompt: "What happens when joining two tables on a non-unique foreign key?",
          choices: ["The query returns matching rows for every foreign key occurrence", "The database deletes duplicate keys", "An error is thrown immediately"],
          correctChoiceIndex: 0,
          explanation: "Non-unique foreign key joins yield rows for every matching combination in the joined tables."
        }
      ]
    },
    {
      id: "quiz-git-evidence",
      lessonId: "lesson-git-evidence",
      title: "Repo evidence checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-git-1",
          prompt: "What is the strongest portfolio evidence?",
          choices: ["A vague completed badge", "A repo with setup, tests, and a demo", "A private note with no commands"],
          correctChoiceIndex: 1,
          explanation: "Reviewers need inspectable artifacts and commands, not only completion claims."
        },
        {
          id: "question-git-2",
          prompt: "Why is attaching automated test results to a PR valuable?",
          choices: ["It replaces the need for code reviews", "It makes repository history private", "It proves functionality mechanically without relying solely on claims"],
          correctChoiceIndex: 2,
          explanation: "Automated test outputs provide reproducible evidence that logic holds across commits."
        },
        {
          id: "question-git-3",
          prompt: "What should a clean git commit history communicate?",
          choices: ["Incremental logical changes with clear intent", "Every single save keystroke", "Unrelated features grouped into one commit"],
          correctChoiceIndex: 0,
          explanation: "Atomic, intentional commits make pull request reviews and regression isolation straightforward."
        }
      ]
    },
    {
      id: "quiz-ai-test-loop",
      lessonId: "lesson-ai-test-loop",
      title: "AI verification checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-ai-1",
          prompt: "When is AI-generated code acceptable to ship?",
          choices: ["When it looks plausible", "When local evidence verifies it", "When it uses modern syntax"],
          correctChoiceIndex: 1,
          explanation: "The proof comes from reproduction, tests, inspection, and verification output."
        },
        {
          id: "question-ai-2",
          prompt: "What is the first step after generating a complex function with AI?",
          choices: ["Inspect the diff and run tests to verify contracts", "Deploy to production immediately", "Delete all previous unit tests"],
          correctChoiceIndex: 0,
          explanation: "AI proposals must be inspected against test suites and type contracts before acceptance."
        },
        {
          id: "question-ai-3",
          prompt: "Why is manual test inspection required alongside AI code generators?",
          choices: ["Compilers refuse AI code", "AI models cannot run tests", "AI generators may produce hallucinated or unverified API calls"],
          correctChoiceIndex: 2,
          explanation: "Models may generate syntactically correct code containing subtle logical flaws or stale API calls."
        }
      ]
    },
    {
      id: "quiz-ai-app-boundaries",
      lessonId: "lesson-ai-app-boundaries",
      title: "AI boundary checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-ai-boundary-1",
          prompt: "Where should a model-provider secret live?",
          choices: ["Inside the mobile bundle", "Behind a server boundary", "In a screenshot"],
          correctChoiceIndex: 1,
          explanation: "Client bundles can be inspected, so privileged secrets must stay server-side."
        },
        {
          id: "question-ai-boundary-2",
          prompt: "Why must API credentials be hidden from client bundles?",
          choices: ["Client bundles can be decompiled and reverse engineered", "Client bundles grow too large", "Mobile OSes delete string values"],
          correctChoiceIndex: 0,
          explanation: "Binary bundles and APKs can be extracted to expose embedded secret strings."
        },
        {
          id: "question-ai-boundary-3",
          prompt: "What is a safe pattern for client apps calling AI services?",
          choices: ["Hardcode keys in source control", "Publish keys in README files", "Proxy requests through a backend server that authenticates client requests"],
          correctChoiceIndex: 2,
          explanation: "A proxy backend enforces client authentication while protecting API secrets."
        }
      ]
    },
    {
      id: "quiz-ml-metrics",
      lessonId: "lesson-ml-metrics",
      title: "ML metrics checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-ml-1",
          prompt: "Why can accuracy be misleading?",
          choices: ["It never uses numbers", "It may hide class imbalance or failure cases", "It only works for SQL"],
          correctChoiceIndex: 1,
          explanation: "A single metric needs data context and error analysis."
        },
        {
          id: "question-ml-2",
          prompt: "Which metric measures the proportion of actual positive cases correctly identified?",
          choices: ["Recall (Sensitivity)", "Precision", "Accuracy"],
          correctChoiceIndex: 0,
          explanation: "Recall captures true positive coverage out of all actual positive samples."
        },
        {
          id: "question-ml-3",
          prompt: "In a highly imbalanced dataset (99% negative cases), what does a model predicting 100% negative achieve?",
          choices: ["0% accuracy", "50% accuracy", "99% accuracy while failing to identify any positive cases"],
          correctChoiceIndex: 2,
          explanation: "High accuracy in imbalanced datasets can mask a model that fails entirely on positive samples."
        }
      ]
    },
    {
      id: "quiz-typescript-events-state",
      lessonId: "lesson-typescript-events-state",
      title: "Typed events checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-typescript-events-1",
          prompt: "Why model UI actions as typed events?",
          choices: ["So state changes can be tested with known shapes", "So reducers can mutate every object", "So screens no longer need data"],
          correctChoiceIndex: 0,
          explanation: "Typed events make each action explicit and let tests call state logic without rendering the UI."
        },
        {
          id: "question-typescript-events-2",
          prompt: "What should a reducer return after handling an event?",
          choices: ["A hidden global variable", "A next state value", "Only console output"],
          correctChoiceIndex: 1,
          explanation: "Reducers are easiest to test when they return the next state as data."
        },
        {
          id: "question-typescript-events-3",
          prompt: "Why avoid mutating the original state array?",
          choices: ["It makes TypeScript ignore errors", "It deletes old tests", "It keeps previous state inspectable and updates predictable"],
          correctChoiceIndex: 2,
          explanation: "Non-mutating updates let tests compare before and after state reliably."
        }
      ]
    },
    {
      id: "quiz-sql-constraints",
      lessonId: "lesson-sql-constraints",
      title: "SQL constraints checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-sql-constraints-1",
          prompt: "What does a foreign key protect?",
          choices: ["A child row pointing to a missing parent", "The button color", "The order of README sections"],
          correctChoiceIndex: 0,
          explanation: "A foreign key keeps relationships tied to rows that actually exist."
        },
        {
          id: "question-sql-constraints-2",
          prompt: "Why use a CHECK constraint for status?",
          choices: ["To make every value text", "To reject values outside the allowed set", "To avoid all queries"],
          correctChoiceIndex: 1,
          explanation: "A CHECK constraint can prevent misspelled or unsupported states from entering the table."
        },
        {
          id: "question-sql-constraints-3",
          prompt: "Why test a rejected row?",
          choices: ["To hide the failure", "To remove valid inserts", "To prove the schema blocks bad data"],
          correctChoiceIndex: 2,
          explanation: "The rejection is evidence that the database rule is active, not just documented."
        }
      ]
    },
    {
      id: "quiz-github-review-flow",
      lessonId: "lesson-github-review-flow",
      title: "GitHub review flow checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-github-review-1",
          prompt: "What should a commit message add beyond the diff?",
          choices: ["Intent and scope", "A secret token", "Unrelated future plans"],
          correctChoiceIndex: 0,
          explanation: "The diff shows what changed; the message should help explain why and where."
        },
        {
          id: "question-github-review-2",
          prompt: "What belongs in a reviewer-friendly PR note?",
          choices: ["Only marketing language", "Verification result and risk boundary", "A hidden checklist"],
          correctChoiceIndex: 1,
          explanation: "Reviewers need exact evidence and a clear statement of what was not touched."
        },
        {
          id: "question-github-review-3",
          prompt: "Why keep commits focused?",
          choices: ["So every file changes at once", "So verification becomes optional", "So reviewers can understand and revert them more easily"],
          correctChoiceIndex: 2,
          explanation: "Focused commits make review, verification, and recovery simpler."
        }
      ]
    },
    {
      id: "quiz-ai-diff-review",
      lessonId: "lesson-ai-diff-review",
      title: "AI diff review checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-ai-diff-1",
          prompt: "How should you treat an AI-generated diff before review?",
          choices: ["As untrusted draft material", "As approved source authority", "As a replacement for tests"],
          correctChoiceIndex: 0,
          explanation: "Model output needs human inspection and local check evidence before acceptance."
        },
        {
          id: "question-ai-diff-2",
          prompt: "Why record rejected AI suggestions?",
          choices: ["To make the accepted code fail", "To show the risk decision and preserve judgment", "To hide what changed"],
          correctChoiceIndex: 1,
          explanation: "Rejected suggestions reveal scope control and the reasons behind the final edit."
        },
        {
          id: "question-ai-diff-3",
          prompt: "Which AI suggestion should raise extra risk?",
          choices: ["A typo fix with a passing test", "A clearer variable name inside one function", "A package or schema change outside the task"],
          correctChoiceIndex: 2,
          explanation: "Package and schema changes can widen blast radius beyond the requested fix."
        }
      ]
    },
    {
      id: "quiz-ai-retrieval-grounding",
      lessonId: "lesson-ai-retrieval-grounding",
      title: "Retrieval grounding checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-ai-retrieval-1",
          prompt: "What should retrieval provide before answer generation?",
          choices: ["A small evidence set with note ids", "A hidden provider key", "A production claim with no source"],
          correctChoiceIndex: 0,
          explanation: "The answer step should work from retrieved source records that can be checked."
        },
        {
          id: "question-ai-retrieval-2",
          prompt: "What should happen when no retrieved note supports the claim?",
          choices: ["Invent a confident answer", "Return uncertainty or reject the claim", "Cite any random note"],
          correctChoiceIndex: 1,
          explanation: "Unsupported answers should fail closed instead of pretending a source exists."
        },
        {
          id: "question-ai-retrieval-3",
          prompt: "Why check citation ids?",
          choices: ["To remove all local notes", "To skip evaluation", "To prove claims map back to retrieved evidence"],
          correctChoiceIndex: 2,
          explanation: "Citation checks make grounding inspectable instead of decorative."
        }
      ]
    },
    {
      id: "quiz-ml-confusion-matrix",
      lessonId: "lesson-ml-confusion-matrix",
      title: "Confusion matrix checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-ml-confusion-1",
          prompt: "What is a false negative?",
          choices: ["An actual positive predicted as negative", "An actual negative predicted as positive", "A metric with no data"],
          correctChoiceIndex: 0,
          explanation: "False negatives are missed positive cases."
        },
        {
          id: "question-ml-confusion-2",
          prompt: "Why use a confusion matrix instead of accuracy alone?",
          choices: ["It hides class imbalance", "It shows the kinds of errors the model made", "It removes sample-size concerns"],
          correctChoiceIndex: 1,
          explanation: "The matrix exposes false positives and false negatives that accuracy can hide."
        },
        {
          id: "question-ml-confusion-3",
          prompt: "What should a tiny confusion matrix include in its interpretation?",
          choices: ["A production guarantee", "A claim that no more tests are needed", "A sample-size limitation"],
          correctChoiceIndex: 2,
          explanation: "Small samples can teach error patterns but cannot justify broad quality claims."
        }
      ]
    }
    ,
    checkpointQuiz("quiz-testing-regression-harness", "lesson-testing-regression-harness", "Regression harness checkpoint", "a regression harness", "Preventing a fixed bug from returning with repeatable checks", "Replacing tests with a screenshot", "Removing failure cases after the fix works", "A regression harness preserves known behavior with a repeatable verifier."),
    checkpointQuiz("quiz-debugging-failure-log", "lesson-debugging-failure-log", "Failure log checkpoint", "a debugging failure log", "Making the symptom, hypothesis, fix, verifier, and residual risk inspectable", "Hiding the failed input after it is fixed", "Claiming debugging is complete without a verifier", "A failure log lets another person understand the debugging path and remaining risk."),
    checkpointQuiz("quiz-security-threat-model", "lesson-security-threat-model", "Threat note checkpoint", "a threat note", "Connecting an asset, actor, abuse case, control, and verifier", "Listing random tools before naming the risk", "Marking every feature as equally risky", "Threat notes make security work concrete enough to test."),
    checkpointQuiz("quiz-security-secrets-auth", "lesson-security-secrets-auth", "Secrets and auth checkpoint", "secret and auth boundaries", "Keeping secrets server-side and enforcing authorization at data boundaries", "Putting every setting in public client code", "Trusting a hidden button as authorization", "Secrets and authorization decisions need the correct boundary."),
    checkpointQuiz("quiz-typescript-runtime-validation", "lesson-typescript-runtime-validation", "Runtime validation checkpoint", "runtime validation for external data", "Checking unknown payloads before treating them as typed app data", "Casting every API response directly to a TypeScript type", "Reading fields from null before checking the value", "Runtime guards protect the boundary where external data enters the app."),
    checkpointQuiz("quiz-security-access-control-lab", "lesson-security-access-control-lab", "Access control checkpoint", "broken access control", "Proving both allowed owner access and denied non-owner access", "Treating logged-in as allowed for every record", "Testing only the happy path owner case", "Authorization must compare the requester to the specific resource or action."),
    checkpointQuiz("quiz-security-input-validation", "lesson-security-input-validation", "Input validation checkpoint", "boundary input validation", "Rejecting malformed or unsupported input before domain logic trusts it", "Passing every payload through if one field looks right", "Returning internal stack traces as user-facing errors", "Validation protects domain logic from untrusted input."),
    checkpointQuiz("quiz-security-injection-output-encoding", "lesson-security-injection-output-encoding", "Output encoding checkpoint", "safe output encoding", "Escaping user-controlled text before rendering it as markup", "Deleting all user text to avoid escaping", "Letting raw script-looking text survive in output", "Output encoding preserves text while keeping commands and markup separate."),
    checkpointQuiz("quiz-security-dependency-logging", "lesson-security-dependency-logging", "Dependency and logging checkpoint", "dependency and log hygiene", "Flagging package drift and preventing logs from exposing private data", "Treating passing tests as proof that logs are safe", "Printing tokens so debugging is easier", "Release hygiene includes dependencies and safe logs, not only functional tests."),
    checkpointQuiz("quiz-cloud-env-config", "lesson-cloud-env-config", "Cloud config checkpoint", "environment configuration", "Documenting required settings while keeping secret values out of source", "Committing production credentials to simplify deploys", "Assuming local defaults are enough for production", "Cloud config needs explicit required values and secret boundaries."),
    checkpointQuiz("quiz-cloud-ci-deploy-checks", "lesson-cloud-ci-deploy-checks", "Release checks checkpoint", "a release gate", "Blocking deploy until required build, test, and rollback checks pass", "Deploying because one local command worked", "Skipping rollback because the change is small", "A release gate converts deploy readiness into named evidence."),
    checkpointQuiz("quiz-cloud-rollback-drill", "lesson-cloud-rollback-drill", "Rollback drill checkpoint", "a rollback drill", "Naming trigger, owner, previous version, action, and success check before deploy", "Inventing rollback steps during the incident", "Shipping without a previous version or owner", "Rollback drills make recovery concrete before a release needs it."),
    checkpointQuiz("quiz-cloud-logs-costs", "lesson-cloud-logs-costs", "Ops note checkpoint", "post-deploy operations evidence", "Recording health, cost signal, and rollback action after release", "Saving only a launch screenshot", "Ignoring budget because the app is small", "Post-deploy evidence shows whether the release is healthy and recoverable."),
    checkpointQuiz("quiz-data-quality-rules", "lesson-data-quality-rules", "Data quality checkpoint", "data quality rules", "Separating accepted rows from rejected rows with reasons", "Building reports before checking input records", "Dropping bad rows without saying why", "Quality rules make report inputs trustworthy and debuggable."),
    checkpointQuiz("quiz-data-contracts-fixtures", "lesson-data-contracts-fixtures", "Dataset contracts checkpoint", "dataset contracts and fixtures", "Naming required row fields and proving them with stable good and bad fixtures", "Building report logic before checking input shape", "Letting text minutes pass as numeric minutes", "Dataset contracts keep report inputs inspectable and repeatable."),
    checkpointQuiz("quiz-data-rejected-row-proof", "lesson-data-rejected-row-proof", "Rejected-row proof checkpoint", "rejected-row proof", "Keeping row number, raw value, and reason for each rejected input", "Returning only a rejected count", "Dropping bad rows silently", "Rejected-row proof makes bad data fixable instead of invisible."),
    checkpointQuiz("quiz-data-pipeline-lineage", "lesson-data-pipeline-lineage", "Pipeline lineage checkpoint", "pipeline lineage", "Tracing source, transform, output, owner, and verifier for each stage", "Treating final numbers as self-explanatory", "Removing owners from the pipeline note", "Lineage makes report outputs traceable."),
    checkpointQuiz("quiz-data-reproducible-report", "lesson-data-reproducible-report", "Reproducible report checkpoint", "a reproducible report", "Naming input version, query logic, output, verifier, and limitations", "Sharing a one-off screenshot with no source", "Omitting limitations to sound more confident", "Reproducible reports can be rerun and critiqued.")
  ],
  projectMissions: [
    {
      id: "mission-cli-study-tracker",
      trackId: "track-python",
      title: "CLI Study Tracker",
      brief: "Build a small Python command-line tool that records study sessions and prints weekly totals.",
      difficulty: "foundation",
      deliverables: ["Python script", "README run instructions", "Two tests or assertion examples"],
      acceptanceCriteria: ["Tracks at least date, topic, and minutes", "Handles bad input with a clear message", "Includes --help, documented defaults, report output, and verification output"],
      phases: missionPhases("cli-study-tracker", "a CLI study tracker", "pytest or documented assertions"),
      starterPrompt: "Build a Python CLI that accepts study sessions, stores them in a small local file, and prints weekly totals by topic.",
      verificationCommands: ["python study_tracker.py --help", "python study_tracker.py --input sessions.csv --output summary.txt", "pytest"],
      expectedArtifacts: ["Repository link", "Sample input file", "--help output", "summary.txt output", "Check output", "README usage section"],
      rubric: ["Input validation is explicit", "Core grouping logic is testable without terminal output", "CLI help and defaults are reviewer-friendly", "README states known limits"],
      commonFailureModes: ["Mixing parsing, printing, and storage in one function", "Only testing the happy path", "Leaving CLI defaults undocumented", "Claiming passing tests without command output"],
      portfolioSummaryPrompt: "Explain how this project proves Python functions, file input, and test/debug discipline.",
      evidenceRequirements: foundationEvidence,
      skillIds: ["skill-python-functions", "skill-testing-debugging", "skill-portfolio-evidence"]
    },
    {
      id: "mission-python-data-cleaner",
      trackId: "track-python",
      title: "Study Data Cleaner",
      brief: "Turn messy session notes into normalized weekly records with rejected-row reporting.",
      difficulty: "applied",
      deliverables: ["Parser module", "Rejected-row report", "Unit tests for malformed input"],
      acceptanceCriteria: ["Separates parsing from reporting", "Rejects bad rows with row numbers and reasons", "Produces deterministic weekly totals"],
      phases: missionPhases("python-data-cleaner", "a small data cleaner", "unit tests against clean and malformed rows"),
      starterPrompt: "Create a Python module that reads messy study records, normalizes fields, rejects malformed rows, and returns a summary object.",
      verificationCommands: ["python -m pytest", "python clean_sessions.py samples/messy_sessions.csv --rejected rejected_rows.txt"],
      expectedArtifacts: ["Repo URL", "Sample messy input", "Rejected-row report", "Check output"],
      rubric: ["Bad data does not crash the app", "Rejected rows include row numbers, raw rows, and reasons", "Tests prove both accepted and rejected rows", "Reflection names the edge case that took longest"],
      commonFailureModes: ["Silently dropping bad rows", "Reporting bad rows without enough context to fix them", "Hardcoding sample data into code", "Printing results that tests cannot inspect"],
      portfolioSummaryPrompt: "Summarize the data-quality problem, the parser contract, and the failure cases you handled.",
      evidenceRequirements: foundationEvidence,
      skillIds: ["skill-python-functions", "skill-testing-debugging", "skill-portfolio-evidence"]
    },
    {
      id: "mission-professional-python-utility",
      trackId: "track-python",
      title: "Professional Python Utility",
      brief: "Turn the study tracker into an installable, reviewable Python package with typed models, JSON output, config, logging, and CI-grade evidence.",
      difficulty: "portfolio",
      deliverables: ["Python package layout", "pyproject.toml", "Installable CLI entry point", "Typed StudySession model", "JSON report mode", "Config loader", "Logged custom errors", "Pytest and CI/pre-commit evidence"],
      acceptanceCriteria: ["Package separates CLI, parsing, models, and reports", "pyproject.toml declares project metadata and console script", "Invalid input raises project-specific errors and logs context", "JSON output has stable fields", "Config merges defaults predictably", "README includes exact pytest, pre-commit, and installed CLI smoke commands"],
      phases: missionPhases("professional-python-utility", "an installable professional Python CLI utility", "python -m pytest plus installed CLI smoke commands", "portfolio README"),
      starterPrompt: "Refactor the study tracker into a package with pyproject.toml, cli.py, parser.py, models.py, reports.py, config loading, tests, JSON output, custom errors, logging, and CI/pre-commit verification commands.",
      verificationCommands: ["python -m pytest", "python -m pip install -e .", "study-tracker --help", "study-tracker --input sessions.csv --format json", "pre-commit run --all-files"],
      expectedArtifacts: ["Package file tree", "pyproject.toml", "Sample input files", "JSON output", "Config example", "Log/error example", "Pytest output", "Pre-commit or CI output", "README verification section"],
      rubric: ["Module boundaries are clear", "Package metadata and entry point are defined", "Data model validates impossible values", "JSON fields are stable and tested", "Config defaults are explicit", "Errors are logged without hiding failures", "Verification commands are reproducible"],
      commonFailureModes: ["Keeping all behavior in one script", "No installable command", "Returning fake values for bad input", "Changing JSON field names without tests", "Config values overriding unknown behavior", "Logging no useful context", "README claims pass without exact output"],
      portfolioSummaryPrompt: "Explain how this project demonstrates professional Python packaging, typed data modeling, machine-readable output, configuration, logging, and repeatable CI-grade verification.",
      evidenceRequirements: portfolioEvidence,
      skillIds: ["skill-python-professional", "skill-python-functions", "skill-testing-debugging", "skill-portfolio-evidence"]
    },
    {
      id: "mission-python-integration-service",
      trackId: "track-python",
      title: "Python Integration Service",
      brief: "Extend the professional tracker with regex validation, service classes, SQLite persistence, safe API boundaries, and integration evidence.",
      difficulty: "portfolio",
      deliverables: ["Regex validation tests", "StudyTrackerService class", "SQLite schema and queries", "Safe API client tests", "Integration verification matrix"],
      acceptanceCriteria: ["Regex validators reject malformed date and slug input", "Service instances do not share mutable state", "SQLite queries calculate topic totals from stored rows", "API client checks timeout, status, and response shape", "Integration matrix maps every layer to tests and evidence"],
      phases: missionPhases("python-integration-service", "an integrated Python utility service", "unit tests plus CLI and database smoke commands", "portfolio architecture note"),
      starterPrompt: "Extend the professional study tracker with regex validation, an OOP service layer, SQLite persistence, a safe API client boundary, and a final integration verification matrix.",
      verificationCommands: ["python -m pytest", "sqlite3 tracker.db < schema_and_query.sql", "study-tracker --input sessions.csv --format json", "study-tracker --help"],
      expectedArtifacts: ["Validation test output", "Service tests", "SQLite schema/query output", "API client tests", "Integration matrix", "CLI smoke output"],
      rubric: ["Regex stays focused and tested", "Service state is isolated", "Persistence schema answers real questions", "API boundary validates untrusted responses", "Integration evidence covers every layer"],
      commonFailureModes: ["Regex doing too much parsing", "Shared class-level mutable state", "Database schema with no useful query", "API client trusting raw JSON", "Capstone evidence proving only the happy path"],
      portfolioSummaryPrompt: "Explain how the project demonstrates integrated Python engineering: validation, OOP services, persistence, API safety, and layered verification.",
      evidenceRequirements: portfolioEvidence,
      skillIds: ["skill-python-integration", "skill-python-professional", "skill-testing-debugging", "skill-api-contracts", "skill-sql-joins", "skill-portfolio-evidence"]
    },
    {
      id: "mission-web-progress-board",
      trackId: "track-typescript",
      title: "Typed Progress Board",
      brief: "Create a TypeScript UI mock that renders tracks, progress, and next actions from typed data.",
      difficulty: "foundation",
      deliverables: ["Typed data model", "Rendered board", "Screenshot or short demo"],
      acceptanceCriteria: ["No implicit any types", "Progress data is not hardcoded into UI elements", "README explains the data contract"],
      phases: missionPhases("web-progress-board", "a typed progress board", "typecheck plus a screenshot or demo"),
      starterPrompt: "Build a small TypeScript progress board that renders track cards from typed seed data and highlights the next action.",
      verificationCommands: ["npm run typecheck", "npm run test"],
      expectedArtifacts: ["Type definitions", "Screenshot or demo link", "Check output", "README data contract section"],
      rubric: ["Types describe the domain before UI", "Cards render from data arrays", "Empty or missing progress has a visible state"],
      commonFailureModes: ["Hardcoding every card", "Using broad any types", "Showing percentages without explaining the source"],
      portfolioSummaryPrompt: "Explain how this proves typed UI modeling and data-driven rendering.",
      evidenceRequirements: foundationEvidence,
      skillIds: ["skill-typescript-types", "skill-portfolio-evidence"]
    },
    {
      id: "mission-api-contract-playground",
      trackId: "track-typescript",
      title: "API Contract Playground",
      brief: "Model a tiny request/response contract and validate examples before UI consumes them.",
      difficulty: "applied",
      deliverables: ["Request and response types", "Validation examples", "Consumer rendering example"],
      acceptanceCriteria: ["Invalid examples fail clearly", "Consumer code reads narrowed data", "Tests cover one bad payload"],
      phases: missionPhases("api-contract-playground", "a validated API contract slice", "typecheck and validation tests"),
      starterPrompt: "Create TypeScript types and validation for a project mission API response, then render a small consumer view from parsed data.",
      verificationCommands: ["npm run typecheck", "npm test"],
      expectedArtifacts: ["Schema/type file", "Passing and failing examples", "Check output", "README contract notes"],
      rubric: ["Boundary validation is separate from rendering", "Bad payloads produce useful errors", "README names contract assumptions"],
      commonFailureModes: ["Trusting raw JSON as typed", "Letting UI validate everything", "No negative test case"],
      portfolioSummaryPrompt: "Describe the contract boundary and how validation prevents UI failure.",
      evidenceRequirements: foundationEvidence,
      skillIds: ["skill-typescript-types", "skill-api-contracts", "skill-testing-debugging"]
    },
    {
      id: "mission-sql-portfolio-ledger",
      trackId: "track-sql",
      title: "Portfolio Evidence Ledger",
      brief: "Design SQL tables for projects, evidence, skills, and readiness snapshots.",
      difficulty: "applied",
      deliverables: ["Schema sketch", "Three useful queries", "Known limitations note"],
      acceptanceCriteria: ["Missions can have multiple evidence items", "Skills can attach to lessons and projects", "A stale evidence query exists"],
      phases: missionPhases("sql-portfolio-ledger", "a normalized evidence ledger", "three saved SQL queries with expected rows"),
      starterPrompt: "Design a normalized SQL schema that connects projects, evidence items, skills, and readiness snapshots.",
      verificationCommands: ["sqlite3 evidence.db < schema.sql", "sqlite3 evidence.db < queries.sql"],
      expectedArtifacts: ["Schema SQL", "Seed data", "Three query outputs", "Limitations note"],
      rubric: ["Many-to-many skill evidence is modeled", "Queries answer product questions", "Known tradeoffs are explicit"],
      commonFailureModes: ["One giant table", "Queries with no sample output", "No stale or missing-evidence query"],
      portfolioSummaryPrompt: "Explain the product questions your schema can answer and why the table boundaries matter.",
      evidenceRequirements: foundationEvidence,
      skillIds: ["skill-sql-joins", "skill-portfolio-evidence"]
    },
    {
      id: "mission-job-tracker-schema",
      trackId: "track-sql",
      title: "Job Tracker Schema",
      brief: "Design a small job-application tracker schema with skill gaps and follow-up tasks.",
      difficulty: "portfolio",
      deliverables: ["Application schema", "Skill-gap query", "Follow-up query", "Seeded sample data"],
      acceptanceCriteria: ["Applications link to companies and required skills", "Query finds missing skills by role", "Follow-up dates are queryable"],
      phases: missionPhases("job-tracker-schema", "a job tracker data model", "schema load plus two product queries"),
      starterPrompt: "Create SQL tables for companies, applications, required skills, evidence links, and follow-up tasks.",
      verificationCommands: ["sqlite3 job_tracker.db < schema.sql", "sqlite3 job_tracker.db < sample_queries.sql"],
      expectedArtifacts: ["Schema SQL", "Seed rows", "Skill-gap output", "Follow-up output"],
      rubric: ["Skill gaps connect to evidence", "Queries support real job-search decisions", "README explains next migration"],
      commonFailureModes: ["Treating skills as comma-separated text", "No date handling", "No evidence link back to portfolio work"],
      portfolioSummaryPrompt: "Turn the schema into a resume bullet about backend data modeling for job-search workflows.",
      evidenceRequirements: portfolioEvidence,
      skillIds: ["skill-sql-joins", "skill-api-contracts", "skill-portfolio-evidence"]
    },
    {
      id: "mission-portfolio-readme",
      trackId: "track-git",
      title: "Portfolio README Upgrade",
      brief: "Turn one practice repository README into a reviewer-friendly artifact.",
      difficulty: "foundation",
      deliverables: ["Problem statement", "Run commands", "Verification section", "Screenshot or sample output"],
      acceptanceCriteria: ["A new developer can run the project", "Verification claims include exact commands", "Known gaps are listed honestly"],
      phases: missionPhases("portfolio-readme", "a reviewer-ready README", "fresh setup and verification commands", "known-gaps section"),
      starterPrompt: "Choose one practice repo and rewrite the README so a reviewer can understand, run, verify, and judge the project quickly.",
      verificationCommands: ["git status --short", "run the repo's documented verifier"],
      expectedArtifacts: ["README diff", "Commit hash", "Screenshot or sample output", "Known gaps"],
      rubric: ["Setup works from a clean checkout", "Verification claims include exact commands", "Known gaps are honest and scoped"],
      commonFailureModes: ["Marketing copy without commands", "No screenshot or sample output", "No commit link"],
      portfolioSummaryPrompt: "Draft two portfolio bullets from the README's verified behavior.",
      evidenceRequirements: portfolioEvidence,
      skillIds: ["skill-git-workflow", "skill-portfolio-evidence"]
    },
    {
      id: "mission-ai-bug-rubric",
      trackId: "track-ai-tools",
      title: "AI Bug Review Rubric",
      brief: "Create a small rubric for reviewing AI-suggested bug fixes before accepting them.",
      difficulty: "applied",
      deliverables: ["Rubric markdown", "Example accepted fix", "Example rejected fix"],
      acceptanceCriteria: ["Requires local reproduction or substitute evidence", "Requires check output", "Flags secret, auth, or public-contract risk"],
      phases: missionPhases("ai-bug-rubric", "an AI bug-review rubric", "rubric applied to two examples"),
      starterPrompt: "Write a rubric that decides whether an AI-suggested bug fix is safe to accept, then apply it to one accepted and one rejected example.",
      verificationCommands: ["markdownlint README.md or manual checklist", "run verifier for accepted example"],
      expectedArtifacts: ["Rubric markdown", "Accepted example", "Rejected example", "Check output"],
      rubric: ["Reproduction is required or explicitly substituted", "Security and contract risk are checked", "Rejected example explains the failure mode"],
      commonFailureModes: ["Accepting plausible code without evidence", "Ignoring public contract changes", "No rejected example"],
      portfolioSummaryPrompt: "Explain how this demonstrates AI-assisted engineering judgment rather than blind tool use.",
      evidenceRequirements: foundationEvidence,
      skillIds: ["skill-ai-verification", "skill-testing-debugging", "skill-portfolio-evidence"]
    },
    {
      id: "mission-ai-test-harness",
      trackId: "track-ai-tools",
      title: "AI Prompt Verification Harness",
      brief: "Build a tiny harness that records prompt intent, model output, human edits, and check result.",
      difficulty: "portfolio",
      deliverables: ["Prompt log format", "Verifier script", "Before/after example", "Risk notes"],
      acceptanceCriteria: ["Separates model suggestion from accepted code", "Stores exact check result", "Flags hallucinated or unsafe suggestions"],
      phases: missionPhases("ai-test-harness", "an AI verification harness", "a sample run with passing and rejected outputs"),
      starterPrompt: "Create a small local workflow that captures an AI suggestion, the human-edited final version, and the check output that justified accepting it.",
      verificationCommands: ["npm run test", "node scripts/verify-ai-suggestion.js samples/example.json"],
      expectedArtifacts: ["Prompt log sample", "Verifier script", "Accepted output", "Rejected output"],
      rubric: ["Model output is treated as untrusted", "Accepted changes cite verifier evidence", "Unsafe output is visibly rejected"],
      commonFailureModes: ["Saving only the final answer", "No negative example", "No exact command output"],
      portfolioSummaryPrompt: "Summarize the harness as proof of responsible AI-assisted development.",
      evidenceRequirements: portfolioEvidence,
      skillIds: ["skill-ai-verification", "skill-testing-debugging", "skill-portfolio-evidence"]
    },
    {
      id: "mission-ai-study-planner",
      trackId: "track-ai-apps",
      title: "AI Study Planner Boundary Map",
      brief: "Design a future AI mentor flow without client-side secrets or fake certainty.",
      difficulty: "applied",
      deliverables: ["Request flow", "Server boundary list", "Evaluation questions"],
      acceptanceCriteria: ["No model secrets live in the app", "Plan records uncertainty", "Output requires evidence before changing readiness"],
      phases: missionPhases("ai-study-planner", "an AI study-planner boundary map", "manual threat and eval checklist"),
      starterPrompt: "Map the request flow for a future AI mentor that suggests weekly study work without storing vendor secrets in the mobile bundle.",
      verificationCommands: ["review the boundary checklist", "review the eval questions against one sample output"],
      expectedArtifacts: ["Request-flow diagram", "Server boundary list", "Evaluation checklist", "Uncertainty notes"],
      rubric: ["Secrets stay server-side", "Readiness changes require evidence", "Output confidence is not overstated"],
      commonFailureModes: ["Putting API keys in the app", "Letting AI update readiness directly", "No eval questions"],
      portfolioSummaryPrompt: "Explain the security boundary and evaluation method in portfolio language.",
      evidenceRequirements: foundationEvidence,
      skillIds: ["skill-ai-verification", "skill-api-contracts"]
    },
    {
      id: "mission-rag-notes-prototype",
      trackId: "track-ai-apps",
      title: "RAG Notes Search Prototype",
      brief: "Prototype a local notes search flow that separates retrieval, answer generation, and verification.",
      difficulty: "portfolio",
      deliverables: ["Tiny notes corpus", "Retrieval function", "Answer-with-citations example", "Failure-case note"],
      acceptanceCriteria: ["Answer cites retrieved notes", "Unknown questions do not invent facts", "Verifier checks at least one citation"],
      phases: missionPhases("rag-notes-prototype", "a RAG notes prototype", "retrieval tests and citation checks"),
      starterPrompt: "Build a small notes search prototype that retrieves relevant notes, drafts an answer using only those notes, and rejects unsupported claims.",
      verificationCommands: ["npm run test", "node scripts/check-citations.js samples/rag-answer.json"],
      expectedArtifacts: ["Notes corpus", "Retrieval test output", "Cited answer", "Unsupported-question example"],
      rubric: ["Retrieval and generation are separate", "Unsupported answers fail closed", "Citations can be checked"],
      commonFailureModes: ["Answering from general knowledge", "No unsupported-question test", "No citation mapping"],
      portfolioSummaryPrompt: "Frame this as an AI app prototype with retrieval discipline and hallucination controls.",
      evidenceRequirements: portfolioEvidence,
      skillIds: ["skill-ai-verification", "skill-api-contracts", "skill-portfolio-evidence"]
    },
    {
      id: "mission-ml-metrics-report",
      trackId: "track-ml",
      title: "ML Metrics Report",
      brief: "Evaluate a toy classifier and write a model-card style report with limits and failure cases.",
      difficulty: "applied",
      deliverables: ["Train/test split note", "Metrics table", "Failure-case examples", "Model-card summary"],
      acceptanceCriteria: ["Names the metric and sample size", "Shows at least one failure case", "Does not overclaim model quality"],
      phases: missionPhases("ml-metrics-report", "an ML metrics report", "metric reproduction and failure-case review"),
      starterPrompt: "Use a toy classifier result to write a short metrics report that explains the split, metric, sample size, and failure cases.",
      verificationCommands: ["python evaluate.py", "python -m pytest tests/test_metrics.py"],
      expectedArtifacts: ["Metrics output", "Failure examples", "Model-card note", "Check output"],
      rubric: ["Metric context is clear", "Failures are analyzed", "Claims are bounded by the data"],
      commonFailureModes: ["Reporting accuracy alone", "No holdout/split note", "No failure examples"],
      portfolioSummaryPrompt: "Summarize this as practical ML evaluation literacy for SWE work.",
      evidenceRequirements: foundationEvidence,
      skillIds: ["skill-ml-metrics", "skill-testing-debugging", "skill-portfolio-evidence"]
    },
    {
      id: "mission-regression-proof-pack",
      trackId: "track-testing-debugging",
      title: "Regression Proof Pack",
      brief: "Create a small regression harness and failure log that prove a fixed bug stays fixed.",
      difficulty: "foundation",
      deliverables: ["Regression harness", "Normal and old-bug cases", "Failure log", "Check output"],
      acceptanceCriteria: ["Harness includes a happy path and rejected case", "Failure log names symptom, hypothesis, fix, verifier, and residual risk", "README explains what the harness does and does not prove"],
      phases: missionPhases("regression-proof-pack", "a regression proof pack", "a two-case harness and failure-log review"),
      starterPrompt: "Build a tiny verifier for one fixed behavior, add one old-bug case, and write a debugging log that explains the fix and remaining risk.",
      verificationCommands: ["node regression_harness.js", "review failure-log.md"],
      expectedArtifacts: ["Harness code", "Passing check output", "failure-log.md", "README proof section"],
      rubric: ["The rejected case would catch the old bug", "Check output is exact", "Failure log is specific enough for another person to review"],
      commonFailureModes: ["Only testing the happy path", "Writing a vague failure log", "Claiming broad quality from one tiny harness"],
      portfolioSummaryPrompt: "Explain how this proves testing and debugging discipline before specialization.",
      evidenceRequirements: foundationEvidence,
      skillIds: ["skill-testing-debugging", "skill-regression-testing", "skill-debugging-log", "skill-portfolio-evidence"]
    },
    {
      id: "mission-secure-review-pack",
      trackId: "track-secure-software",
      title: "Secure Review Pack",
      brief: "Review a small app feature for threats, secrets, auth boundaries, input validation, dependency risk, and safe logging.",
      difficulty: "portfolio",
      deliverables: ["Threat table", "Config and secret classification", "Auth-boundary note", "Input validation tests", "Dependency/logging checklist", "Residual-risk summary"],
      acceptanceCriteria: ["Every threat has a control and verifier", "Secrets are separated from public config", "Auth is enforced at a server/data boundary", "Input validation has a negative test", "Dependency and logging risks are classified before release"],
      phases: missionPhases("secure-review-pack", "a secure review pack", "validation tests plus security checklist review", "portfolio security note"),
      starterPrompt: "Choose one small feature and build a security review pack that maps threats to controls, verifies validation behavior, and documents release hygiene.",
      verificationCommands: ["npm run test", "review security-checklist.md", "review config-classification.md"],
      expectedArtifacts: ["Threat table", "Validation test output", "Config classification", "Dependency/logging checklist", "Residual-risk note", "README security section"],
      rubric: ["Risks are feature-specific", "Controls map to verifiers", "Secrets and auth boundaries are explicit", "Validation rejects malformed input", "Residual risk is honest"],
      commonFailureModes: ["Generic security claims", "No negative validation test", "Client-side-only authorization", "Logging sensitive values", "No residual-risk note"],
      portfolioSummaryPrompt: "Explain how this demonstrates entry-level AppSec judgment with evidence-backed controls.",
      evidenceRequirements: portfolioEvidence,
      skillIds: ["skill-threat-modeling", "skill-secret-handling", "skill-auth-boundaries", "skill-dependency-hygiene", "skill-testing-debugging", "skill-portfolio-evidence"]
    },
    {
      id: "mission-cloud-release-runbook",
      trackId: "track-cloud-platform-basics",
      title: "Cloud Release Runbook",
      brief: "Create a beginner cloud release runbook with config, CI checks, logs, cost note, and rollback plan.",
      difficulty: "applied",
      deliverables: ["Environment config matrix", "Release gate checklist", "Post-deploy ops note", "Rollback note"],
      acceptanceCriteria: ["Config matrix separates public settings from secrets", "Release gate blocks missing build, tests, or rollback", "Ops note includes log health and cost signal", "Rollback action is concrete"],
      phases: missionPhases("cloud-release-runbook", "a cloud release runbook", "config and release-gate checks"),
      starterPrompt: "Prepare a release runbook for a small app that documents required environment variables, CI checks, post-deploy monitoring, cost assumptions, and rollback action.",
      verificationCommands: ["review env-matrix.md", "review release-gate.md", "review ops-note.md"],
      expectedArtifacts: ["env-matrix.md", "release-gate.md", "ops-note.md", "rollback note", "Check output"],
      rubric: ["Secret handling is explicit", "Deploy readiness is gated by named checks", "Operations note includes health and cost", "Rollback is actionable"],
      commonFailureModes: ["Committing secret values", "Treating build success as the only release gate", "No cost or rollback note", "No evidence after deploy"],
      portfolioSummaryPrompt: "Frame this as cloud platform readiness: deployable work with evidence, budget awareness, and recovery planning.",
      evidenceRequirements: foundationEvidence,
      skillIds: ["skill-cloud-config", "skill-ci-release", "skill-observability-cost", "skill-portfolio-evidence"]
    },
    {
      id: "mission-data-quality-report",
      trackId: "track-data-systems",
      title: "Data Quality Report",
      brief: "Build a small data-quality report with accepted/rejected rows, lineage, reproducible output, and limitations.",
      difficulty: "applied",
      deliverables: ["Quality rules", "Rejected-row report", "Pipeline lineage map", "Reproducible report note", "Limitations section"],
      acceptanceCriteria: ["Bad records are rejected with reasons", "Lineage traces source to output", "Report can be rerun from named inputs", "Limitations are stated next to the result"],
      phases: missionPhases("data-quality-report", "a data quality report", "row validation and reproducible report checks"),
      starterPrompt: "Create a small report pipeline for learning events that validates input rows, maps lineage, and produces a rerunnable weekly summary with limitations.",
      verificationCommands: ["node validate_rows.js", "review lineage.md", "review report-note.md"],
      expectedArtifacts: ["Quality rules", "Rejected rows", "Lineage map", "Report output", "Limitations note", "Check output"],
      rubric: ["Rejected rows explain the reason", "Lineage is traceable", "Report input version and query logic are named", "Limitations prevent overclaiming"],
      commonFailureModes: ["Dropping rows silently", "No source-to-output lineage", "One-off screenshot as report proof", "No limitations"],
      portfolioSummaryPrompt: "Explain how this demonstrates data systems thinking for backend and product-facing work.",
      evidenceRequirements: foundationEvidence,
      skillIds: ["skill-data-quality", "skill-data-pipelines", "skill-reproducible-report", "skill-portfolio-evidence"]
    },
    {
      id: "mission-python-api-resilience",
      trackId: "track-python",
      title: "Resilient API Integration",
      brief: "Build a resilient API client with retry, exponential backoff, caching, and circuit breaker patterns for the Study Tracker.",
      difficulty: "portfolio",
      deliverables: ["Retry wrapper with max_retries", "Exponential backoff for 429 rate limits", "In-memory response cache with TTL", "Circuit breaker with open/half-open/closed states", "Integration tests for all patterns", "Architecture note explaining pattern choices", "Integrated resilient client demo module exercising retry+backoff+cache+breaker"],
      acceptanceCriteria: ["Retry handles 503 errors up to max_retries", "Backoff doubles delay after 429 and caps at max_delay", "Cache returns data without network call on repeated URLs", "Circuit breaker opens after threshold failures and recovers via half-open", "Each pattern has passing unit tests", "Architecture note names trade-offs of each pattern"],
      phases: missionPhases("python-api-resilience", "a resilient API integration layer", "unit tests for retry, backoff, cache, and circuit breaker", "portfolio architecture note"),
      starterPrompt: "Extend the Study Tracker API client with retry, exponential backoff, caching, and circuit breaker patterns. Each pattern should be independently testable and documented with its trade-offs.",
      verificationCommands: ["python -m pytest", "python -m pytest tests/test_retry.py", "python -m pytest tests/test_rate_limit.py", "python -m pytest tests/test_caching.py", "python -m pytest tests/test_circuit_breaker.py"],
      expectedArtifacts: ["Retry wrapper code", "Backoff implementation", "Cache implementation", "Circuit breaker class", "Test output for all four patterns", "Architecture note"],
      rubric: ["Each pattern solves a distinct problem", "Patterns compose correctly (retry uses backoff, circuit wraps retry)", "Tests prove both success and failure paths", "Architecture note explains when each pattern applies"],
      commonFailureModes: ["Retry does not stop on 200", "Backoff uses fixed delay instead of exponential", "Cache stores error responses", "Circuit breaker never transitions to half-open", "Integration tests only cover the happy path"],
      portfolioSummaryPrompt: "Explain how the four resilience patterns work together to make the API client production-ready, including the trade-offs you considered.",
      evidenceRequirements: portfolioEvidence,
      skillIds: ["skill-python-integration", "skill-api-contracts", "skill-testing-debugging", "skill-portfolio-evidence"]
    },
    {
      id: "mission-python-ops",
      trackId: "track-python",
      title: "Production Readiness",
      brief: "Deploy a monitored, secure Study Tracker application with CI/CD, secrets management, deployment strategy, and health monitoring.",
      difficulty: "portfolio",
      deliverables: ["CI workflow file with lint and test gates", "Secrets dataclass with from_env boundary", "Deployment runbook with strategy and rollback", "Health check endpoint specification", "Structured logging configuration", "Monitoring and alert thresholds document", "Integrated ops proof: wired CI+secrets+deploy+monitor in one runbook+config set"],
      acceptanceCriteria: ["CI workflow triggers on push and pull_request", "Secrets boundary loads from environment with no defaults for required values", "Deployment runbook names strategy, health check, rollback command, and monitor window", "Health check reports dependency status", "Logs are structured JSON with event and severity fields", "Alert thresholds are documented with action owners"],
      phases: missionPhases("python-ops", "a production-ready deployment pipeline", "CI check, secrets tests, and runbook review", "portfolio README"),
      starterPrompt: "Prepare the Study Tracker for production: set up CI, secure secrets, define a deployment strategy with health checks, and configure monitoring and alerting.",
      verificationCommands: ["python -m pytest", "review secrets boundary", "review deployment runbook", "review health check specification"],
      expectedArtifacts: [".github/workflows/ci.yml", "Secrets dataclass", "Deployment runbook", "Health check spec", "Structured log example", "Alert thresholds document", "README"],
      rubric: ["CI gates deployment behind passing tests", "Secrets are never hardcoded or printed in plain text", "Deployment strategy includes health check verification", "Monitoring captures both success and error events", "Alert thresholds have clear action owners"],
      commonFailureModes: ["CI deploys without test gate", "Secrets use default fallback values", "Deployment runbook skips rollback plan", "Health check always returns ok regardless of dependencies", "No alert thresholds defined", "README claims readiness without evidence"],
      portfolioSummaryPrompt: "Explain how this project demonstrates production readiness: automated verification, secret safety, deployment discipline, and operational observability.",
      evidenceRequirements: portfolioEvidence,
      skillIds: ["skill-python-professional", "skill-secret-handling", "skill-ci-release", "skill-testing-debugging", "skill-portfolio-evidence"]
    }
  ],
  weeklyPlan: {
    id: "weekly-plan-2026-05-04",
    weekStart: "2026-05-04",
    headline: "Build evidence, not just streaks.",
    tasks: [
      {
        id: "task-python-cli",
        title: "Ship one Python utility",
        detail: "Complete the CLI Study Tracker mission and capture command output.",
        linkedProjectMissionId: "mission-cli-study-tracker",
        minutes: 90
      },
      {
        id: "task-git-readme",
        title: "Upgrade one README",
        detail: "Add setup, verification, and known gaps to a small practice repo.",
        linkedProjectMissionId: "mission-portfolio-readme",
        minutes: 45
      },
      {
        id: "task-ai-loop",
        title: "Practice AI verification",
        detail: "Use AI for one test idea, then keep only the locally verified result.",
        linkedProjectMissionId: "mission-ai-test-harness",
        minutes: 60
      },
      {
        id: "task-schema-depth",
        title: "Deepen one data model",
        detail: "Complete one schema mission and capture the query output that proves it.",
        linkedProjectMissionId: "mission-job-tracker-schema",
        minutes: 75
      },
      {
        id: "task-python-api-resilience",
        title: "Ship resilient API integration",
        detail: "Complete the Resilient API Integration mission with tests for all four patterns.",
        linkedProjectMissionId: "mission-python-api-resilience",
        minutes: 120
      },
      {
        id: "task-python-ops",
        title: "Prepare production deployment",
        detail: "Complete the Production Readiness mission including CI, secrets, runbook, and monitoring spec.",
        linkedProjectMissionId: "mission-python-ops",
        minutes: 90
      },
      {
        id: "task-resilience-slice1",
        title: "Resilience slice 1 integrated proof",
        detail: "Complete the retry+backoff integration slice and capture evidence.",
        linkedLessonId: "lesson-python-resilience-slice1",
        minutes: 25
      },
      {
        id: "task-resilience-slice2",
        title: "Resilience slice 2 with cache",
        detail: "Complete the cache+resilience slice and show cache hit.",
        linkedLessonId: "lesson-python-resilience-slice2",
        minutes: 20
      },
      {
        id: "task-ops-slice1",
        title: "Ops slice integrated proof",
        detail: "Complete the ops composition slice and show the integrated proof.",
        linkedLessonId: "lesson-python-ops-slice1",
        minutes: 30
      }
    ]
  }
};
