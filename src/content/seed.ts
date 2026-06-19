import type { ContentPack, Difficulty, Lesson, LessonMiniProject, LessonMiniProjectTester, LessonMisconceptionCheck, LessonPracticeBlock, LessonRecallCard, LessonRunnerSpec, LessonWorkshop, MissionEvidenceRequirements, ProjectMissionPhase, Quiz, RunnerLanguage } from "@/domain/types";
import { level0Lessons, level0Quizzes } from "./python/level-0";
import { level1Lessons, level1Quizzes, deprecatedLevel1Lessons } from "./python/level-1";
import { level2Lessons, level2Quizzes } from "./python/level-2";
import { level3Lessons, level3Quizzes, deprecatedLevel3Lessons } from "./python/level-3";
import { level4Lessons, level4Quizzes, deprecatedLevel4Lessons } from "./python/level-4";

const foundationEvidence: MissionEvidenceRequirements = {
  repoUrl: true,
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

function lessonMisconceptionChecks(commonMistakes: string[]): LessonMisconceptionCheck[] {
  return commonMistakes.slice(0, 2).map((mistake) => ({
    mistake,
    repair: "Slow down to one observable behavior, run the smallest check, and explain what changed before moving on.",
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
        testingFocus: `${input.testingFocus} This test keeps the result tied to observable behavior.`
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
          hiddenTests: [],
          expectedOutput: input.requiredOutputIncludes
        }
      },
      input.practiceReps
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
  explanation: string
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
        explanation
      },
      {
        id: `${id}-2`,
        prompt: `Which check makes ${concept} reviewable?`,
        choices: ["A small result plus check output", "A private note with no example", "A claim that the idea is obvious"],
        correctChoiceIndex: 0,
        explanation: "CareerForge treats finished work as an inspectable result plus a check result or explicit review note."
      },
      {
        id: `${id}-3`,
        prompt: `What should a beginner avoid when practicing ${concept}?`,
        choices: ["Skipping the failure case", "Naming the assumption", "Recording the check command"],
        correctChoiceIndex: 0,
        explanation: "The failure case shows whether the work handles real-world mess instead of only the happy path."
      }
    ]
  };
}

const pythonValuePracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "topic = \"git\"\nminutes = 15\ncompleted = False\nsummary = \"\"\nprint(summary)",
    expectedOutput: "git: 15 minutes planned",
    checkYourAnswer: "Use the variables instead of typing an unrelated sentence. If minutes later changes, the summary should be the only output that changes with it."
  },
  {
    starterCode: "topic = \"python\"\nminutes = 30\ncompleted = True\nstatus = \"\"\nprint(status)",
    expectedOutput: "python session complete: True",
    checkYourAnswer: "The boolean should stay True, not the string \"True\". Ask yourself whether a later if statement could use the value directly."
  },
  {
    starterCode: "track = \"backend\"\nlesson_count = 2\nready = False\nreport = \"\"\nprint(report)",
    expectedOutput: "backend has 2 lessons ready=False",
    checkYourAnswer: "This rep checks whether you can combine text, numbers, and booleans without losing the type of each original value."
  }
];

const pythonCollectionPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "sessions = []\n# Add python 30 and git 15 as dictionaries.\nprint(sessions)",
    expectedOutput: "[{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}]",
    checkYourAnswer: "You should have one list and two dictionaries. If you made topic1 and topic2 variables, you avoided the record shape the next lessons need."
  },
  {
    starterCode: "session = {\"topic\": \"python\", \"minutes\": 30}\n# Add a completed field set to False.\nprint(session)",
    expectedOutput: "{'topic': 'python', 'minutes': 30, 'completed': False}",
    checkYourAnswer: "A dictionary can grow one named field at a time. Check that completed is a boolean, because later decisions will branch on it."
  },
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}]\nsecond_topic = \"\"\nprint(second_topic)",
    expectedOutput: "second topic: git\nThe second record's topic is git.",
    checkYourAnswer: "Read the list position first, then the dictionary key. The second item is index 1 because Python lists start at zero."
  }
];

const pythonDecisionPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "minutes = 10\nlabel = \"\"\n# Use if/else so short sessions become quick.\nprint(label)",
    expectedOutput: "quick session planned",
    checkYourAnswer: "This is the branch the main example does not take. If it still prints focus, reread the comparison as a true-or-false question."
  },
  {
    starterCode: "completed = False\nmessage = \"\"\n# If completed is true, message is done. Otherwise message is keep going.\nprint(message)",
    expectedOutput: "keep going until complete",
    checkYourAnswer: "Do not compare completed to the text \"False\". A boolean can be used directly in an if statement."
  },
  {
    starterCode: "errors = 0\nstatus = \"\"\n# If there are no errors, status is clean. Otherwise status is needs review.\nprint(status)",
    expectedOutput: "clean: no errors found",
    checkYourAnswer: "This rep practices equality. Ask whether errors == 0 is true for the starter value before you choose the branch."
  }
];

const pythonLoopPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}, {\"topic\": \"sql\", \"minutes\": 20}]\ncount = 0\n# Count each session with a loop.\nprint(count)",
    expectedOutput: "3 sessions counted\nCount one session during each loop pass.",
    checkYourAnswer: "The count should change once per record. If it stays zero, the loop body never updated the running count."
  },
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}, {\"topic\": \"sql\", \"minutes\": 20}]\ntopics = []\n# Append each topic to topics.\nprint(topics)",
    expectedOutput: "['python', 'git', 'sql']",
    checkYourAnswer: "This rep asks you to collect one field from every record. If only one topic appears, the append likely happened outside the loop."
  },
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}, {\"topic\": \"python\", \"minutes\": 25}]\npython_minutes = 0\n# Add minutes only when topic is python.\nprint(python_minutes)",
    expectedOutput: "55 python minutes\nOnly python records are included in this total.",
    checkYourAnswer: "This combines a loop with a decision. The total should skip git and include both python records."
  }
];

const pythonFoundationCapstonePracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}]\ntotal_minutes = 0\n# Add each session's minutes with a loop.\nprint(total_minutes)",
    expectedOutput: "45 total minutes counted",
    checkYourAnswer: "This rep isolates the total before the full capstone. If the answer is 0, the loop did not update total_minutes. If it is only 15 or 30, only one record was counted."
  },
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}, {\"topic\": \"sql\", \"minutes\": 45}]\nfocus_count = 0\n# Count sessions where minutes is 30 or more.\nprint(focus_count)",
    expectedOutput: "2 focus sessions counted",
    checkYourAnswer: "This rep checks the decision inside the loop. A 30-minute session counts because the condition is greater than or equal to 30."
  },
  {
    starterCode: "session_count = 3\ntotal_minutes = 70\nfocus_count = 1\nsummary = \"\"\n# Build the exact readable summary from the calculated values.\nprint(summary)",
    expectedOutput: "3 sessions, 70 minutes, 1 focus session",
    checkYourAnswer: "This rep separates presentation from calculation. The summary should use the calculated variables instead of typing unrelated numbers."
  }
];

const pythonStringCleanupPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "raw_topic = \"  PYTHON  \"\nclean_topic = \"\"\nprint(clean_topic)",
    expectedOutput: "python cleaned topic",
    checkYourAnswer: "Use strip before lower so edge spaces disappear and capitalization becomes consistent. The cleaned value should not keep the original spacing."
  },
  {
    starterCode: "clean_topic = \"python basics\"\nslug = \"\"\nprint(slug)",
    expectedOutput: "python-basics slug output",
    checkYourAnswer: "Create the slug after cleaning the topic. If spaces remain in slug, replace spaces with hyphens on the cleaned value."
  },
  {
    starterCode: "raw_topics = [\" Python \", \"python\", \"PYTHON\"]\ncleaned_topics = []\n# Add the cleaned version of each topic.\nprint(cleaned_topics)",
    expectedOutput: "['python', 'python', 'python']",
    checkYourAnswer: "This rep shows why cleanup matters. Three visually different inputs should become the same dependable topic before grouping."
  }
];

const pythonFunctionPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "def describe_session(topic, minutes):\n    return \"\"\n\nprint(describe_session(\"python\", 30))",
    expectedOutput: "python: 30 minutes planned",
    checkYourAnswer: "This rep practices parameters and return. The function should use the topic and minutes it receives, not hardcoded values."
  },
  {
    starterCode: "def group_minutes(sessions):\n    totals = {}\n    # Add each session's minutes by topic.\n    return totals\n\nprint(group_minutes([{\"topic\": \"python\", \"minutes\": 30}]))",
    expectedOutput: "{'python': 30} grouped by topic",
    checkYourAnswer: "Start with one record before trying several. The returned dictionary should use the topic as the key and minutes as the value."
  },
  {
    starterCode: "def group_minutes(sessions):\n    totals = {}\n    return totals\n\nprint(group_minutes([]))",
    expectedOutput: "{} for empty sessions input",
    checkYourAnswer: "An empty input should return an empty dictionary. This failure case proves the function does not depend on hidden global data."
  }
];

const pythonCoreReviewPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "review = {'architecture': 'CLI calls parser, parser returns records, report prints totals', 'commands': ['python study_tracker.py --help'], 'failure_inspection': 'bad minutes row is rejected with a reason', 'improvement': 'add parser tests for missing topic'}\nprint(review)",
    expectedOutput: "Architecture, command, failure inspection, and one improvement are all present.",
    checkYourAnswer: "This rep keeps the review specific. If the architecture could describe any script, name the CLI, parser, report, and rejected-row behavior."
  },
  {
    starterCode: "failure = {'input': '2026-05-08,python,soon', 'expected': 'rejected row reason', 'actual': '', 'next_check': ''}\nprint(failure)",
    expectedOutput: "A rejected-row failure includes input, expected behavior, actual behavior, and next check.",
    checkYourAnswer: "A useful failure inspection keeps the bad input visible. Without the raw failed row, a reviewer cannot tell what behavior was actually inspected."
  },
  {
    starterCode: "improvement_decision = {'target': 'parser', 'reason': 'malformed rows are hardest to debug', 'first_step': 'add test_missing_minutes'}\nprint(improvement_decision)",
    expectedOutput: "The improvement names a concrete target, reason, and first step.",
    checkYourAnswer: "The improvement should be small enough to do next. Avoid vague plans like make it better; name the file, behavior, and check."
  }
];

const pythonDataclassPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "row = {'date': '2026-05-08', 'topic': 'git', 'minutes': '15'}\n# Convert this row into StudySession with minutes as int.\nprint(row)",
    expectedOutput: "StudySession(date='2026-05-08', topic='git', minutes=15)",
    checkYourAnswer: "This repeats the model contract with new data. The key check is that minutes becomes an integer before the rest of the project uses it."
  },
  {
    starterCode: "row = {'date': '2026-05-08', 'topic': 'python', 'minutes': '-5'}\n# Try to build StudySession and record the failure.\nprint(row)",
    expectedOutput: "Negative minutes are rejected with a clear ValueError or project input error.",
    checkYourAnswer: "The failure case is the point of the model. If negative minutes create a session, the model is only decoration."
  },
  {
    starterCode: "rows = [{'date': '2026-05-08', 'topic': 'python', 'minutes': '30'}]\n# Convert rows into model objects before reports use them.\nprint(rows)",
    expectedOutput: "Report code receives a list of StudySession objects, not loose raw dictionaries.",
    checkYourAnswer: "This is the project-shaped rep: parsing creates trusted objects, reports consume trusted objects, and raw rows stay at the boundary."
  }
];

const pythonJsonPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "import json\nsummary = {'session_count': 3, 'total_minutes': 65, 'rejected_count': 0}\njson_report = ''\nprint(json_report)",
    expectedOutput: "{\"session_count\": 3, \"total_minutes\": 65, \"rejected_count\": 0}",
    checkYourAnswer: "Use new numbers without changing field names. Stable keys matter because tests and future API consumers depend on them."
  },
  {
    starterCode: "import json\njson_report = '{\"total_minutes\": \"45\"}'\nparsed = json.loads(json_report)\n# Decide why this is the wrong contract.\nprint(parsed)",
    expectedOutput: "The failure is that total_minutes is text, not a number, so the contract should reject it.",
    checkYourAnswer: "Machine-readable does not only mean valid JSON text. The parsed types must match the contract the rest of the app expects."
  },
  {
    starterCode: "import json\nreport = {'sessions': [{'topic': 'python', 'minutes': 30}], 'totals': {'python': 30}, 'rejected_count': 1}\nprint(json.dumps(report))",
    expectedOutput: "JSON includes sessions, totals, and rejected_count so another tool can inspect the tracker result.",
    checkYourAnswer: "This is the project-shaped rep. Include enough stable fields for a dashboard or evidence log to consume without scraping terminal prose."
  }
];

const pythonConfigPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "DEFAULT_CONFIG = {'format': 'text', 'output': 'summary.txt', 'min_minutes': 0}\nfile_config = {'output': 'weekly.txt'}\n# Merge without losing omitted defaults.\nprint(file_config)",
    expectedOutput: "{'format': 'text', 'output': 'weekly.txt', 'min_minutes': 0}",
    checkYourAnswer: "This repeats the merge with new data. File values update known defaults, but omitted defaults should still be present."
  },
  {
    starterCode: "DEFAULT_CONFIG = {'format': 'text', 'output': 'summary.txt', 'min_minutes': 0}\nfile_config = {'format': 'json', 'secret_token': 'do-not-use'}\n# Ignore unknown or secret-looking keys.\nprint(file_config)",
    expectedOutput: "The config keeps format=json and rejects or ignores secret_token.",
    checkYourAnswer: "The failure case protects the boundary. Config should not silently accept unknown keys that could change behavior or leak secrets."
  },
  {
    starterCode: "config_sources = ['defaults', 'tracker.config.json', '--format json']\n# Write the precedence order the CLI will use.\nprint(config_sources)",
    expectedOutput: "CLI flags override config file values, and config file values override defaults.",
    checkYourAnswer: "Project-shaped config needs a visible precedence rule. Without it, a user cannot predict why a run produced JSON or text."
  }
];

const pythonCiPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "ci_commands = ['python -m pytest', 'study-tracker --help']\n# Add a JSON smoke command that proves report output still works.\nprint(ci_commands)",
    expectedOutput: "python -m pytest, study-tracker --help, and study-tracker --input sessions.csv --format json are present.",
    checkYourAnswer: "Repeat the gate with one more integration command. Unit tests plus an installed CLI smoke command catch different failures."
  },
  {
    starterCode: "gate = {'lint': True, 'tests': False, 'cli_smoke': True, 'allowed': True}\n# Make allowed depend on every required check passing.\nprint(gate)",
    expectedOutput: "allowed is False when tests fail.",
    checkYourAnswer: "This is the failure rep. A quality gate that stays green when tests fail is not a gate; it is just a checklist."
  },
  {
    starterCode: "evidence = {'local': [], 'ci': [], 'limitation': ''}\n# Record local and CI evidence plus one limitation.\nprint(evidence)",
    expectedOutput: "Evidence names local commands, CI commands, and one limitation or skipped check.",
    checkYourAnswer: "Project-shaped CI evidence should be honest. If pre-commit is not installed yet, say that and keep pytest plus smoke output visible."
  }
];

const pythonProfessionalReviewPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "review_matrix = [{'area': 'structure', 'evidence': 'tree shows cli/parser/reports/tests'}]\n# Add metadata, command, config, logging, and tests rows.\nprint(review_matrix)",
    expectedOutput: "Rows cover structure, metadata, command, config, logging, and tests.",
    checkYourAnswer: "A professional review matrix is only useful when every quality area has evidence, not just a label."
  },
  {
    starterCode: "weak_row = {'area': 'command', 'evidence': ''}\n# Explain why this row fails review.\nprint(weak_row)",
    expectedOutput: "The row fails because command evidence is empty or lacks study-tracker output.",
    checkYourAnswer: "This failure rep catches vague review notes. If the command row has no exact command output, installability is not proven."
  },
  {
    starterCode: "improvement = {'target': 'typing', 'decision': '', 'first_check': ''}\n# Choose whether to add mypy/pyright now or document runtime-only typing.\nprint(improvement)",
    expectedOutput: "The improvement records a typing decision and one check or limitation.",
    checkYourAnswer: "Typed depth needs a conscious decision. Either add a static type check later or document that this project currently relies on dataclasses and runtime tests."
  }
];

const pythonRegexPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "import re\nDATE_PATTERN = r''\nSLUG_PATTERN = r''\n# Validate 2026-06-01 and api-client.\nprint('TODO')",
    expectedOutput: "True for 2026-06-01 and True for api-client.",
    checkYourAnswer: "Use new data so you practice the pattern, not the memorized example. Both validators should use fullmatch or anchored checks."
  },
  {
    starterCode: "examples = ['2026-06-01-extra', 'Python Basics', 'api_client']\n# Mark each example invalid and say which rule it breaks.\nprint(examples)",
    expectedOutput: "All examples are invalid: partial date, spaces/case, and underscore slug.",
    checkYourAnswer: "This is the failure rep. If a partial date or uppercase slug passes, the validator is accepting more input than the parser contract allows."
  },
  {
    starterCode: "raw_row = {'date': '2026-06-01', 'topic_slug': 'api-client', 'minutes': '30'}\n# Run shape validation before parser conversion.\nprint(raw_row)",
    expectedOutput: "The row passes shape validation before deeper parser checks.",
    checkYourAnswer: "Project-shaped validation happens at the boundary. Regex checks the text shape before date parsing, minute conversion, or business rules run."
  }
];

const pythonServicePracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "tracker = StudyTrackerService()\n# Add python 30 and sql 20, then calculate total minutes.\nprint(tracker)",
    expectedOutput: "total_minutes returns 50 after adding python and sql sessions.",
    checkYourAnswer: "Repeat the same service behavior with new data. The total should come from stored sessions, not from a hardcoded return value."
  },
  {
    starterCode: "first = StudyTrackerService()\nsecond = StudyTrackerService()\n# Prove adding to first does not change second.\nprint(first, second)",
    expectedOutput: "The second service still has 0 minutes after the first service changes.",
    checkYourAnswer: "This failure rep catches shared mutable state. Sessions should live on self for each instance, not on the class."
  },
  {
    starterCode: "tracker = StudyTrackerService()\n# Add repeated topics and ask for topic_minutes('python').\nprint(tracker)",
    expectedOutput: "topic_minutes('python') returns only the python total.",
    checkYourAnswer: "Project-shaped service methods answer product questions. A topic total should skip unrelated sessions without changing caller code."
  }
];

const pythonSqlitePracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "CREATE TABLE sessions (id INTEGER PRIMARY KEY, date TEXT NOT NULL, topic TEXT NOT NULL, minutes INTEGER NOT NULL);\n-- Insert api and python rows, then query totals by topic.",
    expectedOutput: "api | 25\npython | 30",
    checkYourAnswer: "Repeat persistence with new data. The grouped query should calculate totals from rows, not from handwritten output."
  },
  {
    starterCode: "CREATE TABLE sessions (id INTEGER PRIMARY KEY, date TEXT NOT NULL, topic TEXT NOT NULL, minutes INTEGER NOT NULL CHECK (minutes > 0));\n-- Try inserting a negative minutes row inside a transaction.",
    expectedOutput: "The invalid insert fails or rolls back, and no negative minutes row appears.",
    checkYourAnswer: "This failure rep makes persistence safer. A transaction should leave the database in a trustworthy state when one row is invalid."
  },
  {
    starterCode: "class SessionRepository:\n    def add_session(self, session):\n        pass\n    def totals_by_topic(self):\n        return []\nprint(SessionRepository)",
    expectedOutput: "Repository methods hide SQL details behind add_session and totals_by_topic.",
    checkYourAnswer: "Project-shaped persistence keeps SQL at the repository boundary. The service should ask for behavior, not build SQL strings everywhere."
  }
];

const pythonApiPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "payload = [{'date': '2026-06-01', 'topic': 'api', 'minutes': 25}]\nclient = FakeClient(FakeResponse(200, payload))\n# Fetch sessions through the safe client.\nprint(payload)",
    expectedOutput: "The safe client returns the new api session and records timeout=5.",
    checkYourAnswer: "Repeat the success path with new data. The client boundary should not care whether the topic is python, api, or sql."
  },
  {
    starterCode: "bad_status = FakeResponse(503, {'error': 'unavailable'})\nbad_shape = FakeResponse(200, {'sessions': 'not a list'})\n# Decide which ApiError each case should raise.\nprint(bad_status.status_code, bad_shape.json())",
    expectedOutput: "Both bad status and bad shape raise ApiError instead of returning fake success.",
    checkYourAnswer: "This failure rep keeps callers honest. Returning an empty list for bad status hides the difference between no sessions and a broken API."
  },
  {
    starterCode: "config = {'base_url': 'https://example.test', 'api_key': 'secret-value'}\n# Keep secret values out of logs and portfolio evidence.\nprint(config['base_url'])",
    expectedOutput: "The client uses base_url configuration while secret values stay out of logs and evidence.",
    checkYourAnswer: "Project-shaped API work includes config and secret boundaries. A beginner client can stay offline while still learning not to log secrets."
  }
];

const pythonIntegrationCapstonePracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "integration_matrix = [{'layer': 'validation', 'test': 'test_regex_validation', 'evidence': 'pytest passed'}]\n# Add service, sqlite, api, json, and cli layers.\nprint(integration_matrix)",
    expectedOutput: "The matrix covers validation, service, sqlite, api, json, and cli with evidence.",
    checkYourAnswer: "Repeat the matrix with every layer. A missing evidence field means the layer is still a plan, not capstone proof."
  },
  {
    starterCode: "failure_path = {'layer': 'api', 'bad_input': '503 response', 'expected': '', 'test': ''}\n# Fill in the expected failure behavior and test name.\nprint(failure_path)",
    expectedOutput: "The API failure path raises ApiError and is covered by a named test.",
    checkYourAnswer: "This failure rep prevents happy-path-only integration. Every external boundary needs a named failure behavior."
  },
  {
    starterCode: "flow = ['api fixture', 'regex validation', 'service add_session', 'sqlite repository', 'json cli output']\n# Attach one command or artifact to each step.\nprint(flow)",
    expectedOutput: "The stitched flow connects API fixture through validation, service, SQLite, and JSON CLI output.",
    checkYourAnswer: "Project-shaped integration is more than a checklist. It shows one record traveling across layers with evidence at each boundary."
  }
];

const pythonIntegrationReviewPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "review = {'layers': [{'name': 'sqlite', 'evidence': 'query output', 'risk': 'transaction rollback untested'}], 'commands': [], 'improvement': ''}\n# Add missing layers, commands, and improvement.\nprint(review)",
    expectedOutput: "Review covers every layer, commands, risk, and improvement.",
    checkYourAnswer: "A final review should name risks per layer. If risk is one generic paragraph, it will not guide the next improvement."
  },
  {
    starterCode: "risk = 'api timeout handling is weak'\nlayers = [{'name': 'validation'}, {'name': 'api'}, {'name': 'sqlite'}]\n# Link the risk to one known layer.\nprint(risk, layers)",
    expectedOutput: "The risk names the api layer and points to a check or improvement.",
    checkYourAnswer: "This failure-inspection rep ties uncertainty to architecture. Review risk should point at the layer where you would debug first."
  },
  {
    starterCode: "handoff = {'artifact': 'integration-review.md', 'commands': ['python -m pytest'], 'limitation': '', 'next_improvement': ''}\nprint(handoff)",
    expectedOutput: "Handoff includes artifact, commands, limitation, and next improvement.",
    checkYourAnswer: "Project-shaped review leaves a useful artifact for future tracks. The limitation is part of evidence, not an apology."
  }
];

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
      moduleIds: ["module-python-core", "module-python-professional", "module-python-integration"],
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
        "lesson-python-fstrings",
        // Level 2 — Collections, decisions, loops, capstone
        "lesson-python-collections",
        "lesson-python-decisions",
        "lesson-python-loops",
        "lesson-python-foundation-capstone",
        "lesson-python-strings-cleanup",
        // Level 3 — Functions (micro-lessons)
        "lesson-python-why-functions",
        "lesson-python-def-call",
        "lesson-python-parameters",
        "lesson-python-return",
        "lesson-python-print-vs-return",
        // Level 4 — Debugging (micro-lessons)
        "lesson-python-read-traceback",
        "lesson-python-nameerror",
        "lesson-python-typeerror",
        "lesson-python-valueerror",
        "lesson-python-try-except",
        // Level 5+ — Files, parser, CLI, portfolio
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
      lessonIds: ["lesson-python-project-structure", "lesson-python-dataclass-models", "lesson-python-json-reports", "lesson-python-logging-errors", "lesson-python-pytest-ci", "lesson-python-pyproject-metadata", "lesson-python-installable-cli", "lesson-python-config-files", "lesson-python-ci-precommit", "lesson-python-professional-review"],
      projectMissionIds: ["mission-professional-python-utility"],
      skillIds: ["skill-python-professional", "skill-python-functions", "skill-testing-debugging", "skill-portfolio-evidence"],
      sortOrder: 2
    },
    {
      id: "module-python-integration",
      trackId: "track-python",
      slug: "python-integration",
      title: "Python Integration Depth",
      summary: "Regex validation, object-oriented services, SQLite persistence, API clients, and integration proof.",
      lessonIds: ["lesson-python-regex-validation", "lesson-python-oop-service", "lesson-python-sqlite-persistence", "lesson-python-api-client", "lesson-python-integration-capstone", "lesson-python-integration-review"],
      projectMissionIds: ["mission-python-integration-service"],
      skillIds: ["skill-python-integration", "skill-python-professional", "skill-testing-debugging", "skill-api-contracts", "skill-sql-joins"],
      sortOrder: 3
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
      lessonIds: ["lesson-sql-joins", "lesson-sql-constraints"],
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
      lessonIds: ["lesson-git-evidence", "lesson-github-review-flow"],
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
      lessonIds: ["lesson-ai-test-loop", "lesson-ai-diff-review"],
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
      lessonIds: ["lesson-testing-regression-harness", "lesson-debugging-failure-log"],
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
      lessonIds: ["lesson-ai-app-boundaries", "lesson-ai-retrieval-grounding"],
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
      lessonIds: ["lesson-ml-metrics", "lesson-ml-confusion-matrix"],
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
    {
      id: "lesson-python-file-input",
      moduleId: "module-python-core",
      slug: "python-file-input",
      title: "Files Make Practice Real",
      summary: "Move from toy functions to repeatable input and output.",
      bodyMarkdown: "A useful beginner script can read a small file, validate each row, and report what it skipped. Keep parsing separate from printing so tests can inspect the result.",
      estimatedMinutes: 10,
      difficulty: "foundation",
      skillIds: ["skill-python-functions", "skill-testing-debugging"],
      quizId: "quiz-python-file-input",
      desktopTask: "Read a CSV or text file of study sessions, reject one malformed row, and return weekly totals.",
      evidencePrompt: "Capture the sample input, rejected-row behavior, and command output.",
      workshop: workshop(
        "Read small local input while keeping parsing testable.",
        "Real beginner projects become useful when they can handle imperfect files without crashing.",
        "Keep each job separate: read text from a file, split each row into fields, validate those fields, and report errors. Tests can then target parsing without touching the filesystem.",
        "parse_row('2026-05-07,python,30') returns a session; parse_row('bad') returns a rejected-row reason.",
        "Create two sample rows, one valid and one malformed, then return accepted sessions plus rejected reasons.",
        "This feeds both CLI Study Tracker and Study Data Cleaner.",
        "What malformed row did you handle explicitly, and what row would still be risky?",
        ["Swallowing rejected rows silently", "Mixing file reads with validation", "Treating all strings as valid minutes"],
        {
          language: "Python",
          tools: ["Python 3", "CSV or text file", "terminal"],
          synopsis: "You are learning how a beginner Python script reads real input. A row is one line from the file, and a parser is the code that turns that line into structured data or a clear rejection.",
          prerequisites: ["Complete or understand the function lesson.", "Have a tiny sample file with at least one valid row and one broken row."],
          testingFocus: "You will test that valid rows become usable session data and malformed rows are rejected with an understandable reason instead of disappearing."
        },
        {
          starterCode: "rows = [\n  \"2026-05-07,python,30\",\n  \"bad-row\",\n]\n\n# Write parse_rows(rows) so it returns accepted sessions and rejected reasons.\naccepted, rejected = parse_rows(rows)\nprint(accepted)\nprint(rejected)",
          expectedOutput: "[{'date': '2026-05-07', 'topic': 'python', 'minutes': 30}]\n[{'row': 'bad-row', 'reason': 'expected 3 columns'}]",
          checkYourAnswer: "You should see one accepted session and one rejected row. Accepted means the row became usable data. Rejected means the row was kept with a reason so the user can fix it."
        },
        {
          title: "Build a safe row parser",
          goal: "Parse a tiny study-session file while preserving both accepted rows and rejected-row reasons.",
          steps: ["Create two valid rows and one malformed row", "Return accepted sessions and rejected reasons separately", "Print a short summary of accepted and rejected counts"],
          deliverables: ["Parser function", "Sample input rows", "Output showing one rejected row with a reason"],
          verifierCommand: "python parse_sessions.py",
          expectedEvidence: "Command output showing accepted rows, rejected reasons, and the exact malformed row that was handled.",
          projectConnection: "This is the input-safety slice for CLI Study Tracker and Study Data Cleaner.",
          tester: {
            codeLabel: "Paste your parser code",
            outputLabel: "Paste terminal output from python parse_sessions.py",
            requiredCodeIncludes: ["parse_rows", "rejected"],
          requiredOutputIncludes: ["bad-row", "expected 3 columns"],
          successMessage: "Your parser check preserves rejected input with a clear reason.",
          failureMessage: "The tester needs parse_rows code and output showing bad-row rejected with an expected-columns reason."
          },
          runnerSpec: {
            language: "python",
            starterCode: "def parse_rows(rows):\n    # Return (accepted, rejected).\n    return [], []\n",
            visibleTests: [
              {
                id: "rejects-malformed-row",
                name: "Rejects malformed input with a reason",
                code: "accepted, rejected = parse_rows(['2026-05-07,python,30', 'bad-row'])\nassert accepted == [{'date': '2026-05-07', 'topic': 'python', 'minutes': 30}]\nassert rejected == [{'row': 'bad-row', 'reason': 'expected 3 columns'}]\nprint('bad-row expected 3 columns passed')",
                expectedOutputIncludes: ["bad-row", "expected 3 columns", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "rejects-nonnumeric-minutes",
                name: "Rejects non-numeric minutes",
                code: "accepted, rejected = parse_rows(['2026-05-07,python,soon'])\nassert accepted == []\nassert rejected[0]['reason'] == 'minutes must be a number'"
              }
            ],
            expectedOutput: ["bad-row", "expected 3 columns", "passed"]
          }
        }
      )
    },
    {
      id: "lesson-python-parser-tests",
      moduleId: "module-python-core",
      slug: "python-parser-tests",
      title: "Tests That Catch Bad Input",
      summary: "Prove the parser accepts clean rows and rejects messy ones.",
      bodyMarkdown: "A useful parser test names both the accepted behavior and the rejected behavior. The point is not a green checkmark; it is confidence that bad input will not quietly poison your totals.",
      estimatedMinutes: 12,
      difficulty: "applied",
      skillIds: ["skill-python-functions", "skill-testing-debugging"],
      quizId: "quiz-python-parser-tests",
      desktopTask: "Write tests for one valid session row, one malformed row, and one non-numeric minutes value.",
      evidencePrompt: "Capture the failing test first, the fixed parser, and the final test command output.",
      workshop: workshop(
        "Write parser tests that prove both success and failure behavior.",
        "Project evidence is stronger when the test suite shows the app handles messy user input.",
        "A good test has a tiny input, an expected output, and a reason it would fail if the parser regressed. Regressed means a behavior that used to work became broken later.",
        "assert parse_row('2026-05-07,python,30').minutes == 30 and assert reject_row('bad').reason contains 'columns'.",
        "Add one passing test and one rejection test before changing parser code.",
        "This is the verification backbone for Study Data Cleaner.",
        "Which test failed first, and what did the failure teach you about the parser contract?",
        ["Only testing clean rows", "Asserting vague truthiness", "Changing the test after the implementation passes"],
        {
          language: "Python",
          tools: ["Python 3", "pytest or unittest", "terminal"],
          synopsis: "You are learning how to turn parser behavior into repeatable checks. A test is a small example your code must satisfy every time: clean input should become data, and bad input should become a clear error.",
          prerequisites: ["Understand the parser's expected input format.", "Have a parser function or planned parser contract ready."],
          testingFocus: "You will run tests that fail before the parser handles bad input and pass after the parser returns clear accepted or rejected results."
        },
        {
          starterCode: "def test_parse_valid_row():\n    assert parse_row(\"2026-05-07,python,30\")[\"minutes\"] == 30\n\n\ndef test_rejects_bad_minutes():\n    result = parse_row(\"2026-05-07,python,soon\")\n    assert result[\"error\"] == \"minutes must be a number\"",
          expectedOutput: "First run: at least one failing test if the parser does not handle bad minutes yet.\nFinal run: pytest reports both tests pass.",
          checkYourAnswer: "A useful test names the exact bad input and expected rejection. Avoid changing the test just to match a weak parser; the test should protect the behavior you want."
        },
        {
          title: "Add parser regression tests",
          goal: "Write tests that prove a parser accepts clean rows and rejects bad minutes.",
          steps: ["Write one test for a valid row", "Write one test for non-numeric minutes", "Run the tests before and after fixing the parser"],
          deliverables: ["Test file", "Parser fix or parser contract", "Final passing test output"],
          verifierCommand: "python -m pytest",
          expectedEvidence: "A test run showing the parser tests pass, plus a note about the failure you protected against.",
          projectConnection: "This is the repeatable check backbone for the Study Data Cleaner mission.",
          tester: {
            codeLabel: "Paste your parser tests",
            outputLabel: "Paste pytest output",
            requiredCodeIncludes: ["test_parse_valid_row", "test_rejects_bad_minutes"],
          requiredOutputIncludes: ["passed"],
          successMessage: "Your parser tests prove the clean and bad-input cases.",
          failureMessage: "The tester needs both named parser tests and pytest output showing they passed."
          },
          runnerSpec: {
            language: "python",
            starterCode: "def parse_row(row):\n    # Return a dict for valid rows or {'error': reason} for invalid rows.\n    return {}\n\n\ndef test_parse_valid_row():\n    assert parse_row('2026-05-07,python,30')['minutes'] == 30\n\n\ndef test_rejects_bad_minutes():\n    result = parse_row('2026-05-07,python,soon')\n    assert result['error'] == 'minutes must be a number'\n",
            visibleTests: [
              {
                id: "runs-student-tests",
                name: "Student parser tests pass",
                code: "test_parse_valid_row()\ntest_rejects_bad_minutes()\nprint('2 passed')",
                expectedOutputIncludes: ["2 passed"]
              }
            ],
            hiddenTests: [
              {
                id: "rejects-column-count",
                name: "Rejects malformed column counts",
                code: "result = parse_row('bad-row')\nassert result['error'] == 'expected 3 columns'"
              }
            ],
            expectedOutput: ["2 passed"]
          }
        },
        pythonParserTestPracticeReps
      )
    },
    {
      id: "lesson-python-cli-arguments",
      moduleId: "module-python-core",
      slug: "python-cli-arguments",
      title: "Turn a Script Into a Command",
      summary: "Use argparse so the study tracker can run with real command-line flags.",
      bodyMarkdown: "A script becomes a tool when the user can give it input without editing the source file. Python's argparse library creates that boundary with real flags, help text, and type conversion.",
      estimatedMinutes: 12,
      difficulty: "applied",
      skillIds: ["skill-python-functions", "skill-testing-debugging"],
      quizId: "quiz-python-cli-arguments",
      desktopTask: "Create an argparse parser for --topic python --minutes 30 and print a tracker summary.",
      evidencePrompt: "Record the command shape, parsed dictionary, output summary, and one invalid argument case you would test next.",
      workshop: workshop(
        "Turn hardcoded tracker data into real argparse command input.",
        "Real command-line tools let the user run the same program with different values. That is the difference between a demo and a reusable workflow.",
        "A CLI is a command-line interface: a program you run from the terminal. argparse is Python's helper for reading command flags such as --topic and --minutes, then turning them into values your program can use.",
        "An argparse parser with --topic and --minutes can parse ['--topic', 'python', '--minutes', '30'] into topic='python' and minutes=30.",
        "Write a small argparse parser for a topic and minutes pair, then build the summary from the parsed result.",
        "This is the command boundary for the CLI Study Tracker mission.",
        "Which part of your code knows about --topic, and which part only cares about a parsed dictionary?",
        ["Keeping command values hardcoded in the function", "Forgetting type=int so minutes stays text", "Letting argparse details leak into every calculation"],
        {
          language: "Python",
          tools: ["Python 3", "terminal", "argparse"],
          synopsis: "You are learning how a Python script becomes a reusable command. The user-facing part reads flags from the terminal, and the internal logic works with clean values such as topic and minutes.",
          prerequisites: ["Know how to write a function that returns a dictionary.", "Know how to convert text minutes into an integer safely."],
          testingFocus: "You will test that one argparse argument list becomes a parsed dictionary and a readable summary. Parsed means argparse has converted terminal text into structured values."
        },
        {
          starterCode: "import argparse\n\nargs = [\"--topic\", \"python\", \"--minutes\", \"30\"]\n\ndef build_parser():\n    parser = argparse.ArgumentParser(prog=\"study_tracker\")\n    # Add --topic and --minutes here.\n    return parser\n\ndef parse_cli(args):\n    namespace = build_parser().parse_args(args)\n    return {}\n\nparsed = parse_cli(args)\nsummary = \"\"\nprint(parsed)\nprint(summary)",
          expectedOutput: "{'topic': 'python', 'minutes': 30}\npython: 30 minutes",
          checkYourAnswer: "The parser should return data, not print inside itself. If minutes is still '30' as text, check whether the --minutes argument uses type=int so Python converts it to the number 30."
        },
        {
          title: "Create the argparse command boundary",
          goal: "Build an argparse parser that turns topic and minutes flags into reusable tracker data.",
          steps: ["Create an ArgumentParser", "Add --topic and --minutes with type=int for minutes", "Build a summary from the parsed dictionary"],
          deliverables: ["build_parser and parse_cli functions", "Parsed dictionary output", "Summary output"],
          verifierCommand: "python study_tracker_cli.py --topic python --minutes 30",
          expectedEvidence: "Terminal output or sandbox check showing parsed data and summary, plus one note explaining how argparse handles bad minutes.",
          projectConnection: "This turns CLI Study Tracker from a hardcoded script into a reusable command-line tool.",
          tester: {
            codeLabel: "Paste your argparse command parser",
            outputLabel: "Paste command output",
            requiredCodeIncludes: ["argparse", "add_argument", "--topic", "--minutes", "type=int"],
            requiredOutputIncludes: ["python", "30", "minutes"],
            successMessage: "Your argparse check creates a real input boundary for the tracker.",
            failureMessage: "The tester needs argparse add_argument code plus output showing python and 30 minutes."
          },
          runnerSpec: {
            language: "python",
            starterCode: "import argparse\n\nargs = [\"--topic\", \"python\", \"--minutes\", \"30\"]\n\ndef build_parser():\n    parser = argparse.ArgumentParser(prog=\"study_tracker\")\n    # Add --topic and --minutes here.\n    return parser\n\ndef parse_cli(args):\n    namespace = build_parser().parse_args(args)\n    return {}\n\nparsed = parse_cli(args)\nsummary = \"\"\nprint(parsed)\nprint(summary)",
            visibleTests: [
              {
                id: "argparse-parses-topic-and-minutes",
                name: "Argparse parses topic and minutes",
                code: "assert parsed == {'topic': 'python', 'minutes': 30}\nassert summary == 'python: 30 minutes'\nprint('python cli 30 minutes passed')",
                expectedOutputIncludes: ["python", "cli", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "parses-alternate-command",
                name: "Parser handles alternate command data",
                code: "assert parse_cli(['--topic', 'git', '--minutes', '15']) == {'topic': 'git', 'minutes': 15}"
              },
              {
                id: "bad-minutes-fails-argparse",
                name: "Bad minutes fail through argparse",
                code: "try:\n    parse_cli(['--topic', 'git', '--minutes', 'soon'])\nexcept SystemExit:\n    pass\nelse:\n    raise AssertionError('bad minutes should fail argparse type conversion')"
              }
            ],
            expectedOutput: ["python", "cli", "passed"]
          }
        },
        pythonCliArgumentPracticeReps
      )
    },
    {
      id: "lesson-python-file-backed-cli",
      moduleId: "module-python-core",
      slug: "python-file-backed-cli",
      title: "Run the Tracker From a File",
      summary: "Combine argparse and file-style input so the tracker behaves like a real CLI tool.",
      bodyMarkdown: "A useful CLI does not ask the learner to edit source code for every run. It accepts a file path, reads records, calculates a result, and prints output a reviewer can reproduce.",
      estimatedMinutes: 14,
      difficulty: "applied",
      skillIds: ["skill-python-functions", "skill-testing-debugging"],
      quizId: "quiz-python-file-backed-cli",
      desktopTask: "Create study_tracker.py so python study_tracker.py --input sessions.csv reads a CSV file and prints total sessions and minutes.",
      evidencePrompt: "Record the sample CSV, the exact command, the output, and one bad-file or bad-row case you would test next.",
      workshop: workshop(
        "Combine argparse with file-backed session input.",
        "This is where the tracker starts behaving like a real local developer tool: the command names an input file, and the program calculates from that file instead of hardcoded data.",
        "Keep the boundary clear: argparse reads the file path, a file-reading function turns file text into records, and the reporting function prints the summary.",
        "python study_tracker.py --input sessions.csv should produce output such as 2 sessions, 45 minutes from the file contents.",
        "Build a run_cli function that accepts --input, reads session rows, and returns the calculated summary.",
        "This is the final CLI rehearsal before packaging the project as portfolio proof.",
        "Which function knows about file paths, and which function only knows about session records?",
        ["Reading a hardcoded file name while pretending the argument matters", "Parsing CSV rows inside the print statement", "Returning minutes as text so totals concatenate instead of add"],
        {
          language: "Python",
          tools: ["Python 3", "argparse", "CSV file input", "terminal"],
          synopsis: "You are learning how a Python script becomes a reproducible local tool. Reproducible means another person can run the same command with the same input file and get the same result.",
          prerequisites: ["Know how argparse parses --input style flags.", "Know how session rows should become dictionaries with numeric minutes."],
          testingFocus: "You will test that the CLI path selects a file, reads the records, and calculates the summary from file contents rather than from hardcoded values."
        },
        {
          starterCode: "import argparse\nimport csv\nfrom io import StringIO\n\nSAMPLE_CSV = \"\"\"date,topic,minutes\n2026-05-07,python,30\n2026-05-08,git,15\n\"\"\"\n\n# Build parser, read sessions, then run with --input sessions.csv.",
          expectedOutput: "2 sessions, 45 minutes",
          checkYourAnswer: "If the output changes after changing the CSV text, the program is reading the file data. If it stays the same, the summary is probably hardcoded."
        },
        {
          title: "Build a file-backed CLI run",
          goal: "Create a tracker command that accepts an input file path and calculates totals from that file's records.",
          steps: ["Add an argparse --input argument", "Read CSV rows into dictionaries with numeric minutes", "Return a summary from run_cli using the selected file"],
          deliverables: ["build_parser function", "read_sessions function", "run_cli output from sessions.csv"],
          verifierCommand: "python study_tracker.py --input sessions.csv",
          expectedEvidence: "Command output showing 2 sessions, 45 minutes from sessions.csv plus the sample CSV used to produce it.",
          projectConnection: "This makes CLI Study Tracker a real reproducible command instead of a sandbox-only exercise.",
          tester: {
            codeLabel: "Paste your file-backed CLI code",
            outputLabel: "Paste the command output",
            requiredCodeIncludes: ["argparse", "--input", "csv", "read_sessions", "run_cli"],
            requiredOutputIncludes: ["2 sessions", "45 minutes", "passed"],
            successMessage: "Your file-backed CLI check reads input data through a real command boundary.",
            failureMessage: "The tester needs argparse --input, CSV parsing, and output showing the calculated file-backed summary."
          },
          runnerSpec: {
            language: "python",
            starterCode: "import argparse\nimport csv\nfrom io import StringIO\n\nSAMPLE_CSV = \"\"\"date,topic,minutes\n2026-05-07,python,30\n2026-05-08,git,15\n\"\"\"\n\ndef build_parser():\n    parser = argparse.ArgumentParser(prog=\"study_tracker\")\n    # Add --input here.\n    return parser\n\ndef read_sessions(csv_text):\n    return []\n\ndef run_cli(args, files):\n    namespace = build_parser().parse_args(args)\n    sessions = read_sessions(files[namespace.input])\n    total_minutes = sum(session[\"minutes\"] for session in sessions)\n    return f\"{len(sessions)} sessions, {total_minutes} minutes\"\n\noutput = run_cli([\"--input\", \"sessions.csv\"], {\"sessions.csv\": SAMPLE_CSV})\nprint(output)",
            visibleTests: [
              {
                id: "file-backed-cli-summary",
                name: "File-backed CLI calculates summary",
                code: "assert read_sessions(SAMPLE_CSV) == [\n    {'date': '2026-05-07', 'topic': 'python', 'minutes': 30},\n    {'date': '2026-05-08', 'topic': 'git', 'minutes': 15},\n]\nassert output == '2 sessions, 45 minutes'\nprint('2 sessions 45 minutes passed')",
                expectedOutputIncludes: ["2 sessions", "45 minutes", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "file-backed-cli-uses-selected-file",
                name: "CLI uses the selected input file",
                code: "other_csv = 'date,topic,minutes\\n2026-05-09,sql,20\\n'\nassert run_cli(['--input', 'other.csv'], {'other.csv': other_csv}) == '1 sessions, 20 minutes'"
              }
            ],
            expectedOutput: ["2 sessions", "45 minutes", "passed"]
          }
        }
      )
    },
    {
      id: "lesson-python-cli-polish",
      moduleId: "module-python-core",
      slug: "python-cli-polish",
      title: "Polish the CLI Experience",
      summary: "Add help text, defaults, choices, and guided errors so the tracker feels like a real tool.",
      bodyMarkdown: "A real command-line tool teaches the user how to run it. Good CLI polish means useful help text, sensible defaults, constrained options, and errors that point to the fix.",
      estimatedMinutes: 13,
      difficulty: "applied",
      skillIds: ["skill-python-functions", "skill-testing-debugging"],
      quizId: "quiz-python-cli-polish",
      desktopTask: "Improve study_tracker.py with --help text, a default report format, valid format choices, and one documented invalid-value behavior.",
      evidencePrompt: "Record the --help output, one default run, one explicit --format json run, and one invalid format or minutes error.",
      workshop: workshop(
        "Make the tracker command guide the user before and after mistakes.",
        "Polish is not decoration. A CLI with clear help, defaults, and constrained choices reduces support burden and makes the project easier for a reviewer to run.",
        "argparse can describe the command, document each flag, provide defaults, restrict choices, and reject invalid values before business logic runs. A default is the value used when the user does not provide one. Choices are the allowed values for a flag.",
        "A polished parser might accept --input sessions.csv, default --format text, allow --format json, and reject --format xml with a useful message.",
        "Add description, help text, defaults, and choices to the tracker parser, then inspect the generated help output.",
        "This is the last CLI quality pass before the project becomes portfolio evidence.",
        "Which user mistake should argparse catch, and which mistake belongs in your own file or row validation?",
        ["Leaving --help generic and uninformative", "Accepting any format string and failing later", "Making the default behavior invisible to reviewers"],
        {
          language: "Python",
          tools: ["Python 3", "argparse", "terminal", "--help output"],
          synopsis: "You are learning how to make a Python CLI understandable and resilient. Resilient means it gives useful guidance when the user forgets a flag or enters a value the tool does not support.",
          prerequisites: ["Know how to build an argparse parser with --input.", "Know that parsed arguments should stay separate from file reading and report logic."],
          testingFocus: "You will test the help text, default values, valid choices, and invalid-choice behavior before packaging the CLI."
        },
        {
          starterCode: "import argparse\n\n\ndef build_parser():\n    parser = argparse.ArgumentParser(prog=\"study_tracker\")\n    # Add description, --input, --format, and --min-minutes.\n    return parser\n\nparser = build_parser()\nparsed = parser.parse_args([\"--input\", \"sessions.csv\"])\nhelp_text = parser.format_help()\nprint(parsed.input)\nprint(parsed.format)\nprint(parsed.min_minutes)\nprint(\"--input\" in help_text)",
          expectedOutput: "sessions.csv\ntext\n0\nTrue",
          checkYourAnswer: "If --format is missing, add a default. If --input is not in help_text, the user cannot discover the required file flag from --help. Good help text reduces guessing."
        },
        {
          title: "Make the tracker CLI reviewer-friendly",
          goal: "Polish the tracker parser with useful help text, defaults, choices, and invalid-value handling.",
          steps: ["Add a parser description and help text for each option", "Give --format a default of text and choices of text or json", "Give --min-minutes a default of 0 and type=int"],
          deliverables: ["Polished build_parser function", "--help output", "Default and explicit format check"],
          verifierCommand: "python study_tracker.py --help && python study_tracker.py --input sessions.csv",
          expectedEvidence: "Help output showing --input, --format, and --min-minutes plus a run proving defaults are applied.",
          projectConnection: "This makes CLI Study Tracker easier for a reviewer to run, inspect, and trust.",
          tester: {
            codeLabel: "Paste your polished argparse parser",
            outputLabel: "Paste help output and one default run",
            requiredCodeIncludes: ["description", "help=", "default=", "choices", "--format", "--min-minutes"],
            requiredOutputIncludes: ["--input", "--format", "text", "passed"],
            successMessage: "Your CLI polish check shows discoverable help, defaults, and constrained options.",
            failureMessage: "The tester needs help/default/choices code plus output showing --input, --format, text, and passed."
          },
          runnerSpec: {
            language: "python",
            starterCode: "import argparse\n\n\ndef build_parser():\n    parser = argparse.ArgumentParser(prog=\"study_tracker\")\n    # Add description, --input, --format, and --min-minutes.\n    return parser\n\nparser = build_parser()\nparsed = parser.parse_args([\"--input\", \"sessions.csv\"])\nhelp_text = parser.format_help()\nprint(parsed.input)\nprint(parsed.format)\nprint(parsed.min_minutes)\nprint(\"--input\" in help_text)",
            visibleTests: [
              {
                id: "cli-polish-help-defaults",
                name: "CLI help and defaults are useful",
                code: "assert parsed.input == 'sessions.csv'\nassert parsed.format == 'text'\nassert parsed.min_minutes == 0\nassert '--input' in help_text\nassert '--format' in help_text\nassert '--min-minutes' in help_text\nassert 'Summarize study sessions' in help_text\nprint('cli help defaults passed')",
                expectedOutputIncludes: ["cli", "help", "defaults", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "cli-polish-accepts-explicit-options",
                name: "CLI accepts explicit polished options",
                code: "explicit = build_parser().parse_args(['--input', 'sessions.csv', '--format', 'json', '--min-minutes', '30'])\nassert explicit.format == 'json'\nassert explicit.min_minutes == 30"
              },
              {
                id: "cli-polish-rejects-invalid-format",
                name: "CLI rejects invalid report formats",
                code: "try:\n    build_parser().parse_args(['--input', 'sessions.csv', '--format', 'xml'])\nexcept SystemExit:\n    pass\nelse:\n    raise AssertionError('invalid format should fail through argparse choices')"
              }
            ],
            expectedOutput: ["cli", "help", "defaults", "passed"]
          }
        }
      )
    },
    {
      id: "lesson-python-output-file",
      moduleId: "module-python-core",
      slug: "python-output-file",
      title: "Write a Report File",
      summary: "Add an output path so the tracker saves a report artifact instead of only printing text.",
      bodyMarkdown: "A command-line tool becomes easier to review when it can write a predictable output file. Terminal output is useful, but an artifact gives the learner and reviewer something to inspect after the command finishes.",
      estimatedMinutes: 13,
      difficulty: "applied",
      skillIds: ["skill-python-functions", "skill-testing-debugging"],
      quizId: "quiz-python-output-file",
      desktopTask: "Add --output summary.txt to study_tracker.py and write the calculated report to that file.",
      evidencePrompt: "Record the command, the created output file path, the file contents, and one note explaining what should happen if the file already exists.",
      workshop: workshop(
        "Write the tracker summary to an output file.",
        "Real tools often produce artifacts: reports, logs, exports, or machine-readable files. A saved report gives portfolio evidence beyond a terminal screenshot.",
        "Keep formatting separate from writing. One function should create report text, and another should save that text to the requested output path. An output path is the file location where the report should be saved.",
        "python study_tracker.py --input sessions.csv --output summary.txt can create a file containing 2 sessions and 45 minutes.",
        "Add an output argument, format the report, and save the report through a small writer function.",
        "This prepares the portfolio proof lesson because the CLI will now produce a durable artifact a reviewer can inspect.",
        "Which function decides what the report says, and which function decides where the report goes?",
        ["Printing the report but never saving it", "Hardcoding summary.txt while accepting an --output flag", "Mixing report formatting with file writing so neither part is easy to test"],
        {
          language: "Python",
          tools: ["Python 3", "argparse", "output files", "terminal"],
          synopsis: "You are learning how to make a Python CLI leave behind a report artifact. An artifact is a saved result, such as a report file, that someone can inspect after the command finishes.",
          prerequisites: ["Know how argparse parses --input style flags.", "Know how the tracker calculates sessions and total minutes."],
          testingFocus: "You will test that the default output path is used and that an explicit output path changes where the report is written."
        },
        {
          starterCode: "import argparse\n\nsessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}]\nfiles = {}\n\n# Build parser, format report, then write to the selected output path.",
          expectedOutput: "summary.txt\n2 sessions\n45 minutes",
          checkYourAnswer: "If the output path changes but the report still writes to summary.txt, your writer is ignoring the parsed argument. The path should come from argparse, not from a hidden hardcoded value."
        },
        {
          title: "Save a tracker summary file",
          goal: "Add output-file behavior so the tracker creates a durable report artifact.",
          steps: ["Add --output with a default of summary.txt", "Create report text from sessions", "Write the report through a function that receives the output path"],
          deliverables: ["Argparse output option", "Report formatter", "Saved report check"],
          verifierCommand: "python study_tracker.py --input sessions.csv --output summary.txt",
          expectedEvidence: "Command output plus the contents of summary.txt showing session count and total minutes.",
          projectConnection: "This gives CLI Study Tracker an inspectable artifact for portfolio evidence.",
          tester: {
            codeLabel: "Paste your output-file CLI code",
            outputLabel: "Paste command output and report contents",
            requiredCodeIncludes: ["--output", "format_report", "write_report", "summary.txt"],
            requiredOutputIncludes: ["summary.txt", "2 sessions", "45 minutes", "passed"],
            successMessage: "Your output-file check creates a durable tracker report.",
            failureMessage: "The tester needs --output handling plus saved report output showing the calculated summary."
          },
          runnerSpec: {
            language: "python",
            starterCode: "import argparse\n\nsessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}]\nfiles = {}\n\ndef build_parser():\n    parser = argparse.ArgumentParser(prog=\"study_tracker\")\n    # Add --output with default summary.txt.\n    return parser\n\ndef format_report(sessions):\n    return \"\"\n\ndef write_report(path, content, files):\n    pass\n\nparsed = build_parser().parse_args([])\nreport = format_report(sessions)\nwrite_report(parsed.output, report, files)\nprint(parsed.output)\nprint(files.get(parsed.output, \"\"))",
            visibleTests: [
              {
                id: "writes-default-report",
                name: "Writes default report artifact",
                code: "assert parsed.output == 'summary.txt'\nassert report == '2 sessions\\n45 minutes'\nassert files['summary.txt'] == report\nprint('summary.txt 2 sessions 45 minutes passed')",
                expectedOutputIncludes: ["summary.txt", "2 sessions", "45 minutes", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "writes-explicit-report-path",
                name: "Writes explicit report artifact path",
                code: "other_files = {}\nother = build_parser().parse_args(['--output', 'reports/week-1.txt'])\nwrite_report(other.output, report, other_files)\nassert other_files['reports/week-1.txt'] == '2 sessions\\n45 minutes'"
              }
            ],
            expectedOutput: ["summary.txt", "2 sessions", "45 minutes", "passed"]
          }
        }
      )
    },
    {
      id: "lesson-python-rejected-row-report",
      moduleId: "module-python-core",
      slug: "python-rejected-row-report",
      title: "Report Bad Rows Clearly",
      summary: "Create a rejected-row report that explains bad input without stopping the whole run.",
      bodyMarkdown: "Bad data is normal. A useful data-cleaning CLI accepts the clean rows, rejects the bad rows, and tells the user exactly which row needs attention and why.",
      estimatedMinutes: 14,
      difficulty: "applied",
      skillIds: ["skill-python-functions", "skill-testing-debugging"],
      quizId: "quiz-python-rejected-row-report",
      desktopTask: "Add a rejected_rows.txt report that lists row numbers, reasons, and raw bad rows.",
      evidencePrompt: "Record the sample bad input, the accepted-count output, the rejected report, and one row you would add to your regression tests.",
      workshop: workshop(
        "Produce a clear rejected-row report for messy input.",
        "A CLI that silently drops bad rows teaches the user nothing and corrupts trust. A rejected-row report preserves evidence while letting valid rows continue.",
        "A rejected row is an input row your program refuses to use because something is wrong. A rejection record should include row number, raw row, and reason. That gives a learner enough context to fix the data without guessing.",
        "row 2: expected 3 columns -> bad-row is more useful than simply saying invalid input.",
        "Parse mixed rows, keep accepted records, build a rejected-row report, and prove both sides are inspectable.",
        "This deepens the Study Data Cleaner mission and makes the tracker safer for real user-created files.",
        "Which bad row should stop the whole program, and which bad row can be reported while the clean rows still succeed?",
        ["Dropping bad rows without a report", "Reporting only the reason without the raw row", "Using zero-based row numbers when the user is looking at a spreadsheet"],
        {
          language: "Python",
          tools: ["Python 3", "CSV-like rows", "rejected-row report", "terminal"],
          synopsis: "You are learning how to handle messy file input professionally. The clean rows should still work, and the rejected rows should be reported clearly enough for a beginner to repair the file.",
          prerequisites: ["Know how to parse a comma-separated row.", "Know why non-numeric minutes should be rejected clearly."],
          testingFocus: "You will test accepted rows, rejected rows, row numbers, reasons, and the final human-readable rejected-row report."
        },
        {
          starterCode: "ROWS = [\n    \"2026-05-07,python,30\",\n    \"bad-row\",\n    \"2026-05-08,git,soon\",\n    \"2026-05-09,sql,20\",\n]\n\n# Parse accepted rows and build a rejected-row report.",
          expectedOutput: "2 accepted\nrow 2: expected 3 columns -> bad-row\nrow 3: minutes must be a number -> 2026-05-08,git,soon",
          checkYourAnswer: "If the report does not include row numbers and raw rows, the user still has to hunt through the file to fix the data. A good error report points to the fix."
        },
        {
          title: "Create a rejected-row report",
          goal: "Build parser behavior that keeps valid rows and writes a clear report for rejected rows.",
          steps: ["Return accepted and rejected collections", "Record row_number, raw row, and reason for each rejection", "Format the rejected rows into a report"],
          deliverables: ["parse_rows function", "build_rejected_report function", "Rejected-row report output"],
          verifierCommand: "python clean_sessions.py samples/messy_sessions.csv --rejected rejected_rows.txt",
          expectedEvidence: "Output showing accepted rows plus rejected_rows.txt content with row numbers, reasons, and raw bad rows.",
          projectConnection: "This is the evidence-quality upgrade for the Study Data Cleaner mission.",
          tester: {
            codeLabel: "Paste your rejected-row reporting code",
            outputLabel: "Paste rejected report output",
            requiredCodeIncludes: ["parse_rows", "rejected", "row_number", "reason", "build_rejected_report"],
            requiredOutputIncludes: ["row 2", "expected 3 columns", "row 3", "minutes must be a number", "passed"],
            successMessage: "Your rejected-row check preserves bad-input evidence without blocking clean rows.",
            failureMessage: "The tester needs accepted/rejected parsing plus row-numbered rejected report output."
          },
          runnerSpec: {
            language: "python",
            starterCode: "ROWS = [\n    \"2026-05-07,python,30\",\n    \"bad-row\",\n    \"2026-05-08,git,soon\",\n    \"2026-05-09,sql,20\",\n]\n\ndef parse_rows(rows):\n    return [], []\n\ndef build_rejected_report(rejected):\n    return \"\"\n\naccepted, rejected = parse_rows(ROWS)\nreport = build_rejected_report(rejected)\nprint(f\"{len(accepted)} accepted\")\nprint(report)",
            visibleTests: [
              {
                id: "reports-rejected-rows",
                name: "Reports rejected rows clearly",
                code: "assert len(accepted) == 2\nassert accepted[0]['topic'] == 'python'\nassert accepted[1]['minutes'] == 20\nassert rejected == [\n    {'row_number': 2, 'row': 'bad-row', 'reason': 'expected 3 columns'},\n    {'row_number': 3, 'row': '2026-05-08,git,soon', 'reason': 'minutes must be a number'},\n]\nassert 'row 2: expected 3 columns -> bad-row' in report\nassert 'row 3: minutes must be a number -> 2026-05-08,git,soon' in report\nprint('row 2 row 3 rejected report passed')",
                expectedOutputIncludes: ["row 2", "row 3", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "rejected-report-empty-state",
                name: "Rejected report has a useful empty state",
                code: "clean_rows = ['2026-05-07,python,30']\nclean_accepted, clean_rejected = parse_rows(clean_rows)\nassert len(clean_accepted) == 1\nassert clean_rejected == []\nassert build_rejected_report(clean_rejected) == 'no rejected rows'"
              }
            ],
            expectedOutput: ["row 2", "row 3", "passed"]
          }
        },
        pythonRejectedRowPracticeReps
      )
    },
    {
      id: "lesson-python-portfolio-proof",
      moduleId: "module-python-core",
      slug: "python-portfolio-proof",
      title: "Package Python Work As Proof",
      summary: "Turn a working script into a reviewer-friendly project artifact.",
      bodyMarkdown: "A project is portfolio-ready when a reviewer can understand the problem, run the command, inspect the tests, and see the honest limits without asking you for context.",
      estimatedMinutes: 11,
      difficulty: "portfolio",
      skillIds: ["skill-python-functions", "skill-testing-debugging", "skill-portfolio-evidence"],
      quizId: "quiz-python-portfolio-proof",
      desktopTask: "Add README run steps, check output, and known gaps to the CLI Study Tracker or Study Data Cleaner repo.",
      evidencePrompt: "Capture the repo URL, commit hash, README status, check output, and reflection.",
      workshop: workshop(
        "Package a Python practice script so a reviewer can inspect it quickly.",
        "Portfolio proof is not the code alone; it is code plus setup, verification, and honest scope.",
        "A README is the project note a reviewer reads first. A reviewer-friendly README answers what the project does, how to run it, how it was verified, and what remains unfinished.",
        "README sections: Problem, Run, Verify, Sample Output, Known Gaps.",
        "Update one Python mission README and record the exact check output in CareerForge evidence.",
        "This unlocks mission completion for CLI Study Tracker and improves readiness through evidence quality.",
        "What would a reviewer still be unable to verify from your README?",
        ["Claiming tests pass without output", "Leaving out sample data", "Hiding known gaps"],
        {
          language: "Python plus Markdown",
          tools: ["README", "Git", "test output"],
          synopsis: "You are learning how to package a Python practice script so another person can understand, run, verify, and evaluate it without needing a private explanation from you.",
          prerequisites: ["Have a small Python script or mission repo.", "Have at least one command that runs or tests the work."],
          testingFocus: "You will test the project by recording exact run or test output, then explain known limits instead of only saying it works."
        },
        {
          starterCode: "## Verify\n\n```bash\npython -m pytest\n```\n\nExpected result:\n```text\n2 passed\n```\n\n## Known gaps\n- Sample data is small.\n- No date-range filtering yet.",
          expectedOutput: "The README tells a reviewer what command to run, what result to expect, and what limitation is still honest.",
          checkYourAnswer: "Your proof is ready when someone can run the command without asking you what file, input, or output to inspect. Known gaps are not a weakness; they show honest scope."
        },
        {
          title: "Package a Python proof README",
          goal: "Turn one Python script into a reviewer-friendly artifact with run steps and honest limits.",
          steps: ["Add Problem, Run, Verify, Sample Output, and Known Gaps sections", "Paste exact check output", "Name one limitation you would fix next"],
          deliverables: ["Updated README", "Check output", "Known-gaps note"],
          verifierCommand: "python -m pytest",
          expectedEvidence: "README excerpt plus the exact check output recorded in CareerForge evidence.",
          projectConnection: "This upgrades CLI Study Tracker or Study Data Cleaner toward portfolio readiness.",
          tester: {
            codeLabel: "Paste your README proof sections",
            outputLabel: "Paste check output",
            requiredCodeIncludes: ["## Verify", "## Known gaps"],
          requiredOutputIncludes: ["passed"],
          successMessage: "Your README proof includes verification, known gaps, and passing output.",
          failureMessage: "The tester needs Verify and Known gaps sections plus passing check output."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "const readme = `## Verify\npython -m pytest\n2 passed\n\n## Known gaps\nSample data is small.`;",
            visibleTests: [
              {
                id: "readme-proof-sections",
                name: "README proof sections are present",
                code: "if (!readme.includes('## Verify')) throw new Error('missing Verify section');\nif (!readme.includes('## Known gaps')) throw new Error('missing Known gaps section');\nif (!readme.includes('passed')) throw new Error('missing passing output');\nconsole.log('passed README proof');",
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
      id: "lesson-python-core-review",
      moduleId: "module-python-core",
      slug: "python-core-review",
      title: "Core Proof Review Gate",
      summary: "Review the beginner-to-CLI path by explaining the architecture, running proof commands, and choosing one improvement.",
      bodyMarkdown: "A review gate is where learning becomes judgment. Do not just mark the module complete; prove what the tracker does, explain its shape, inspect a failure, and improve one weak point.",
      estimatedMinutes: 15,
      difficulty: "portfolio",
      skillIds: ["skill-python-functions", "skill-testing-debugging", "skill-portfolio-evidence"],
      quizId: "quiz-python-core-review",
      desktopTask: "Create a Core Proof Review note with architecture summary, run commands, one failure, and one improvement.",
      evidencePrompt: "Record the command output, rejected-row output, module architecture explanation, failure diagnosis, and improvement note.",
      workshop: workshop(
        "Review the core tracker as a working beginner CLI project.",
        "A professor would not pass the module only because each lesson was tapped. You should be able to explain the project, run it, inspect failure behavior, and improve one weak spot.",
        "A good review note has four parts: architecture, commands, failure inspection, and improvement. Architecture means the main parts of the project and what each part is responsible for.",
        "Architecture: CLI parses flags, parser reads rows, reports format output. Commands: --help and --input. Failure: bad minutes are rejected with a reason.",
        "Build a review checklist that proves the core module is ready for professional restructuring.",
        "This is the transition checkpoint before Professional Python Utility.",
        "Which part of your tracker would a reviewer understand fastest, and which part would they question first?",
        ["Only saying complete without command output", "Explaining syntax instead of architecture", "Ignoring a known failure because the happy path works"],
        {
          language: "Python project review",
          tools: ["CLI output", "rejected-row report", "review note"],
          synopsis: "You are learning to evaluate your own Python utility like a reviewer. That means explaining the structure, proving behavior with commands, inspecting one failure, and improving one weakness.",
          prerequisites: ["Have completed the core Python CLI lessons.", "Have at least one command and one failure case to inspect."],
          testingFocus: "You will test that your review includes architecture, commands, failure diagnosis, and one improvement. Failure diagnosis means naming what went wrong and what evidence showed it."
        },
        {
          starterCode: "review = {\n    'architecture': '',\n    'commands': [],\n    'failure_inspection': '',\n    'improvement': '',\n}\nprint(review)",
          expectedOutput: "architecture, commands, failure_inspection, improvement all filled with concrete evidence",
          checkYourAnswer: "If the review could describe any project, it is too vague. Include specific tracker commands, specific output, and specific failure behavior."
        },
        {
          title: "Complete the Core Proof Review",
          goal: "Create a review artifact that proves the core Python module is understood, runnable, and improvable.",
          steps: ["Explain the tracker architecture", "List proof commands and outputs", "Inspect one failure case", "Choose one improvement with a reason"],
          deliverables: ["Architecture explanation", "Command evidence", "Failure diagnosis", "Improvement note"],
          verifierCommand: "python study_tracker.py --help && python study_tracker.py --input sessions.csv --output summary.txt",
          expectedEvidence: "A review note containing concrete commands, output, one failure explanation, and one improvement decision.",
          projectConnection: "This review gate confirms readiness for the Professional Python Utility module.",
          tester: {
            codeLabel: "Paste your Core Proof Review object or note",
            outputLabel: "Paste command output and review checklist",
            requiredCodeIncludes: ["architecture", "commands", "failure_inspection", "improvement"],
            requiredOutputIncludes: ["architecture", "commands", "failure", "improvement", "passed"],
            successMessage: "Your core review proves the project is understood and ready for professionalization.",
            failureMessage: "The tester needs architecture, command proof, failure inspection, and one improvement."
          },
          runnerSpec: {
            language: "python",
            starterCode: "review = {\n    'architecture': '',\n    'commands': [],\n    'failure_inspection': '',\n    'improvement': '',\n}\nprint(review)",
            visibleTests: [
              {
                id: "core-review-has-required-evidence",
                name: "Core review includes architecture, commands, failure, and improvement",
                code: "assert 'CLI' in review['architecture'] or 'parser' in review['architecture']\nassert any('--help' in command for command in review['commands'])\nassert any('--input' in command for command in review['commands'])\nassert len(review['failure_inspection']) >= 20\nassert len(review['improvement']) >= 20\nprint('architecture commands failure improvement passed')",
                expectedOutputIncludes: ["architecture", "commands", "failure", "improvement", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "core-review-improvement-is-specific",
                name: "Core review improvement names a concrete target",
                code: "assert any(term in review['improvement'].lower() for term in ['parser', 'report', 'cli', 'test', 'error'])"
              }
            ],
            expectedOutput: ["architecture", "commands", "failure", "improvement", "passed"]
          }
        },
        pythonCoreReviewPracticeReps
      )
    },
    {
      id: "lesson-python-project-structure",
      moduleId: "module-python-professional",
      slug: "python-project-structure",
      title: "Structure Python Like a Project",
      summary: "Split a one-file script into modules with clear responsibilities.",
      bodyMarkdown: "Professional Python is easier to review when the CLI, parsing, report formatting, and tests live in predictable places. Structure is not ceremony; it is how future changes avoid breaking everything at once.",
      estimatedMinutes: 14,
      difficulty: "applied",
      skillIds: ["skill-python-professional", "skill-testing-debugging"],
      quizId: "quiz-python-project-structure",
      desktopTask: "Restructure the study tracker into a package with cli.py, parser.py, reports.py, and tests.",
      evidencePrompt: "Record the file tree, one module boundary decision, and the command that still passes after the split.",
      workshop: workshop(
        "Turn the study tracker from one script into a small Python package plan.",
        "Reviewers trust code faster when they can find the entrypoint, parsing logic, report logic, and tests without reading a giant file.",
        "A module is one Python file or package area with a focused job. A module boundary is the line between responsibilities: cli.py handles arguments, parser.py handles rows, reports.py formats output, and tests prove behavior.",
        "study_tracker/cli.py should know about argparse, while study_tracker/parser.py should not.",
        "List the project files and assign one clear responsibility to each important module.",
        "This starts the professional utility mission by making the project reviewable before adding more features.",
        "Which file should change when the CLI flag changes, and which file should remain untouched?",
        ["Creating many files with no clear responsibility", "Letting parser.py import argparse", "Putting tests inside the package code"],
        {
          language: "Python project structure",
          tools: ["Python package", "module boundaries", "pytest"],
          synopsis: "You are learning how professional Python projects are organized. The goal is not more folders; the goal is making each file's job clear so future changes stay local.",
          prerequisites: ["Have a working study tracker script.", "Know which parts parse input, format reports, and handle command-line flags."],
          testingFocus: "You will test the structure by proving the expected package files exist and that each one has one clear responsibility."
        },
        {
          starterCode: "project_files = []\nmodule_roles = {}\n\n# Add package files and describe cli, parser, reports, and tests responsibilities.\nprint(project_files)\nprint(module_roles)",
          expectedOutput: "study_tracker/cli.py\nstudy_tracker/parser.py\nstudy_tracker/reports.py\ntests/test_parser.py",
          checkYourAnswer: "If cli.py and parser.py have the same responsibility, the split is not helping. Each module should own one reason to change, such as command flags or row parsing."
        },
        {
          title: "Plan the professional package layout",
          goal: "Create a package layout and module-role map for the study tracker.",
          steps: ["List the package files", "Name each module's responsibility", "Identify where tests should live"],
          deliverables: ["Project file list", "Module responsibility map", "One boundary decision note"],
          verifierCommand: "python -m pytest",
          expectedEvidence: "File tree plus a note explaining why CLI parsing and row parsing live in different modules.",
          projectConnection: "This is the structure foundation for the Professional Python Utility mission.",
          tester: {
            codeLabel: "Paste your file tree and module role map",
            outputLabel: "Paste test or structure review output",
            requiredCodeIncludes: ["study_tracker/cli.py", "study_tracker/parser.py", "study_tracker/reports.py", "tests/test_parser.py"],
            requiredOutputIncludes: ["cli", "parser", "reports", "passed"],
            successMessage: "Your project structure proof separates responsibilities clearly.",
            failureMessage: "The tester needs package files, role boundaries, and output showing the structure passed review."
          },
          runnerSpec: {
            language: "python",
            starterCode: "project_files = []\nmodule_roles = {}\n\n# Add package files and describe cli, parser, reports, and tests responsibilities.\nprint(project_files)\nprint(module_roles)",
            visibleTests: [
              {
                id: "professional-layout-has-boundaries",
                name: "Professional layout has clear boundaries",
                code: "required = {'study_tracker/__init__.py', 'study_tracker/cli.py', 'study_tracker/parser.py', 'study_tracker/reports.py', 'tests/test_parser.py'}\nassert required.issubset(set(project_files))\nassert module_roles['cli'] == 'parse command arguments'\nassert module_roles['parser'] == 'turn rows into sessions'\nassert module_roles['reports'] == 'format output artifacts'\nprint('cli parser reports structure passed')",
                expectedOutputIncludes: ["cli", "parser", "reports", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "professional-layout-keeps-tests-outside-package",
                name: "Tests live outside package code",
                code: "assert any(path.startswith('tests/') for path in project_files)\nassert not any(path.startswith('study_tracker/tests') for path in project_files)"
              }
            ],
            expectedOutput: ["cli", "parser", "reports", "passed"]
          }
        },
        professionalProjectStructurePracticeReps
      )
    },
    {
      id: "lesson-python-dataclass-models",
      moduleId: "module-python-professional",
      slug: "python-dataclass-models",
      title: "Model Data With Dataclasses",
      summary: "Use a typed dataclass so sessions have one reliable shape.",
      bodyMarkdown: "Dictionaries are useful early, but professional code benefits from explicit data models. A dataclass names the fields, types, and validation rules that the rest of the program can depend on.",
      estimatedMinutes: 15,
      difficulty: "applied",
      skillIds: ["skill-python-professional", "skill-testing-debugging"],
      quizId: "quiz-python-dataclass-models",
      desktopTask: "Replace loose session dictionaries with a StudySession dataclass and parser conversion function.",
      evidencePrompt: "Record the model definition, one valid parsed session, one invalid minutes case, and passing test output.",
      workshop: workshop(
        "Create a typed StudySession model with validation.",
        "A professional parser should return a dependable domain object instead of many slightly different dictionaries.",
        "A dataclass is a Python shortcut for creating a small data model with named fields. It gives the project a named contract. __post_init__ runs after the object is created and can reject impossible values such as negative minutes.",
        "StudySession(date='2026-05-07', topic='python', minutes=30) is easier to inspect than a loose dictionary.",
        "Define StudySession, convert one row dictionary into it, and reject negative minutes.",
        "This prepares JSON reports, logging, and pytest tests to share the same data shape.",
        "Which validation belongs in the model, and which validation belongs in row parsing before the model is created?",
        ["Leaving minutes as text", "Allowing negative minutes", "Creating multiple session shapes across modules"],
        {
          language: "Python dataclasses",
          tools: ["dataclasses", "type hints", "assertions"],
          synopsis: "You are learning to replace loose dictionaries with a typed model. A typed model says which fields exist and what kind of value each field should hold.",
          prerequisites: ["Know what fields a session needs.", "Know how parser functions turn raw input into program data."],
          testingFocus: "You will test a valid session and a rejected invalid session so the model becomes a real contract, not just a class name."
        },
        {
          starterCode: "from dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass StudySession:\n    date: str\n    topic: str\n    minutes: int\n\n    def __post_init__(self):\n        pass\n\ndef session_from_row(row):\n    return None\n\nsession = session_from_row({'date': '2026-05-07', 'topic': 'python', 'minutes': '30'})\nprint(session)",
          expectedOutput: "StudySession(date='2026-05-07', topic='python', minutes=30)",
          checkYourAnswer: "If minutes is still text, the parser conversion is incomplete. If negative minutes work, the model is not protecting the project from impossible data."
        },
        {
          title: "Create the StudySession model",
          goal: "Build a dataclass model and parser conversion function for tracker sessions.",
          steps: ["Define StudySession as a frozen dataclass", "Convert row minutes into an integer", "Reject negative minutes"],
          deliverables: ["StudySession dataclass", "session_from_row function", "Valid and invalid proof output"],
          verifierCommand: "python -m pytest tests/test_models.py",
          expectedEvidence: "Passing output showing a valid StudySession and a rejected negative-minutes case.",
          projectConnection: "This gives the Professional Python Utility mission a domain model a reviewer can trust.",
          tester: {
            codeLabel: "Paste your dataclass model and parser conversion",
            outputLabel: "Paste model test output",
            requiredCodeIncludes: ["@dataclass", "StudySession", "__post_init__", "session_from_row"],
            requiredOutputIncludes: ["StudySession", "minutes=30", "passed"],
            successMessage: "Your dataclass proof creates a reliable session model.",
            failureMessage: "The tester needs a StudySession dataclass plus valid and invalid model proof."
          },
          runnerSpec: {
            language: "python",
            starterCode: "from dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass StudySession:\n    date: str\n    topic: str\n    minutes: int\n\n    def __post_init__(self):\n        pass\n\ndef session_from_row(row):\n    return None\n\nsession = session_from_row({'date': '2026-05-07', 'topic': 'python', 'minutes': '30'})\nprint(session)",
            visibleTests: [
              {
                id: "dataclass-model-validates-session",
                name: "Dataclass model validates session data",
                code: "assert session == StudySession(date='2026-05-07', topic='python', minutes=30)\nassert isinstance(session.minutes, int)\ntry:\n    StudySession(date='2026-05-07', topic='python', minutes=-1)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError('negative minutes should be rejected')\nprint('StudySession minutes=30 passed')",
                expectedOutputIncludes: ["StudySession", "minutes=30", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "dataclass-model-converts-alternate-row",
                name: "Parser converts alternate row data",
                code: "other = session_from_row({'date': '2026-05-08', 'topic': 'git', 'minutes': '15'})\nassert other == StudySession(date='2026-05-08', topic='git', minutes=15)"
              }
            ],
            expectedOutput: ["StudySession", "minutes=30", "passed"]
          }
        },
        pythonDataclassPracticeReps
      )
    },
    {
      id: "lesson-python-json-reports",
      moduleId: "module-python-professional",
      slug: "python-json-reports",
      title: "Produce JSON Reports",
      summary: "Create machine-readable output so other tools can consume the tracker result.",
      bodyMarkdown: "Professional tools often need both human-readable and machine-readable output. JSON makes the tracker result easier to test, store, compare, and feed into another program.",
      estimatedMinutes: 13,
      difficulty: "applied",
      skillIds: ["skill-python-professional", "skill-testing-debugging"],
      quizId: "quiz-python-json-reports",
      desktopTask: "Add --format json to the tracker and output deterministic JSON for sessions, totals, and rejected count.",
      evidencePrompt: "Record the JSON output, a parsed assertion, and one reason machine-readable output is useful.",
      workshop: workshop(
        "Format the tracker summary as deterministic JSON.",
        "A professional CLI can support humans and automation. JSON output lets tests and other tools inspect exact fields instead of scraping text.",
        "JSON is a text format that uses objects, lists, strings, numbers, booleans, and null. json.dumps turns Python dictionaries into JSON text. Stable keys and simple value types make output predictable.",
        "{\"session_count\": 2, \"total_minutes\": 45, \"rejected_count\": 1} is easier to assert than a paragraph.",
        "Build a report dictionary and serialize it to JSON with the expected fields.",
        "This prepares the professional utility for integration with dashboards, evidence logs, or CI checks.",
        "Which fields should be stable contract fields, and which details should stay as human-only explanation?",
        ["Serializing dataclass objects without converting them", "Changing JSON field names casually", "Testing JSON by string position instead of parsed values"],
        {
          language: "Python JSON",
          tools: ["json", "CLI output", "assertions"],
          synopsis: "You are learning how to produce machine-readable report output. Machine-readable means another program can parse the result without guessing from a paragraph.",
          prerequisites: ["Know how the tracker calculates totals.", "Know that JSON has strings, numbers, lists, booleans, and objects."],
          testingFocus: "You will test JSON by parsing it back into a dictionary and asserting stable fields, instead of only checking that the text looks like JSON."
        },
        {
          starterCode: "import json\n\nsummary = {'session_count': 2, 'total_minutes': 45, 'rejected_count': 1}\njson_report = ''\nprint(json_report)",
          expectedOutput: "{\"session_count\": 2, \"total_minutes\": 45, \"rejected_count\": 1}",
          checkYourAnswer: "If your test only checks that the output starts with a brace, parse it with json.loads and assert the actual fields. That proves the JSON is usable, not just pretty."
        },
        {
          title: "Add JSON report output",
          goal: "Create deterministic JSON output for tracker summary data.",
          steps: ["Build a report dictionary", "Serialize it with json.dumps", "Parse it back in a test and assert fields"],
          deliverables: ["Report dictionary", "JSON output", "Parsed JSON assertion"],
          verifierCommand: "python study_tracker.py --input sessions.csv --format json",
          expectedEvidence: "JSON output plus a test or assertion showing session_count, total_minutes, and rejected_count parse correctly.",
          projectConnection: "This makes the tracker useful beyond terminal reading and strengthens portfolio evidence.",
          tester: {
            codeLabel: "Paste your JSON report code",
            outputLabel: "Paste JSON output and parsed assertion",
            requiredCodeIncludes: ["json.dumps", "session_count", "total_minutes", "rejected_count"],
            requiredOutputIncludes: ["session_count", "total_minutes", "45", "passed"],
            successMessage: "Your JSON report proof creates machine-readable tracker output.",
            failureMessage: "The tester needs json.dumps output plus parsed-field proof."
          },
          runnerSpec: {
            language: "python",
            starterCode: "import json\n\nsummary = {'session_count': 2, 'total_minutes': 45, 'rejected_count': 1}\njson_report = ''\nprint(json_report)",
            visibleTests: [
              {
                id: "json-report-has-contract-fields",
                name: "JSON report has stable contract fields",
                code: "parsed = json.loads(json_report)\nassert parsed == {'session_count': 2, 'total_minutes': 45, 'rejected_count': 1}\nprint('session_count total_minutes 45 passed')",
                expectedOutputIncludes: ["session_count", "total_minutes", "45", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "json-report-is-machine-readable",
                name: "JSON report is machine-readable",
                code: "assert isinstance(json.loads(json_report)['total_minutes'], int)"
              }
            ],
            expectedOutput: ["session_count", "total_minutes", "45", "passed"]
          }
        },
        pythonJsonPracticeReps
      )
    },
    {
      id: "lesson-python-logging-errors",
      moduleId: "module-python-professional",
      slug: "python-logging-errors",
      title: "Log Failures Without Hiding Them",
      summary: "Use custom exceptions and logging so failures are clear and reviewable.",
      bodyMarkdown: "Professional code distinguishes expected input problems from programmer mistakes. Custom exceptions name the failure, and logs preserve context without turning every error into a silent success.",
      estimatedMinutes: 15,
      difficulty: "applied",
      skillIds: ["skill-python-professional", "skill-testing-debugging"],
      quizId: "quiz-python-logging-errors",
      desktopTask: "Add TrackerInputError and logging for invalid minutes or missing input files.",
      evidencePrompt: "Record one raised custom exception, one log message, and the user-facing error output.",
      workshop: workshop(
        "Raise a project-specific error and log the context.",
        "A professional utility should fail loudly enough for developers and clearly enough for users. Logging and custom exceptions help you serve both audiences.",
        "An exception is Python's way to signal that something went wrong. A custom exception such as TrackerInputError names an expected user-input problem. A logger records context so the failure can be diagnosed later.",
        "parse_minutes('soon') can log invalid minutes: soon and raise TrackerInputError('minutes must be a number').",
        "Implement a parser that logs invalid input and raises a custom exception instead of returning fake data.",
        "This prepares the professional utility for reliable troubleshooting and honest CLI errors.",
        "Which information belongs in the log, and which information should be shown to the CLI user?",
        ["Catching and ignoring the error", "Logging no context", "Using a generic Exception for every expected input problem"],
        {
          language: "Python logging",
          tools: ["logging", "custom exceptions", "terminal"],
          synopsis: "You are learning how professional Python code reports expected failures. The user should get a clear message, and the developer should get enough logged context to diagnose the problem.",
          prerequisites: ["Know why bad minutes should be rejected.", "Know how try/except catches expected failures."],
          testingFocus: "You will test the returned valid value, the custom exception, and the captured log message so success and failure are both proven."
        },
        {
          starterCode: "import logging\n\nlogs = []\n\nclass TrackerInputError(Exception):\n    pass\n\n# Configure logger and implement parse_minutes.\ndef parse_minutes(value):\n    return None\n\nprint(parse_minutes('30'))",
          expectedOutput: "30\ninvalid minutes: soon",
          checkYourAnswer: "If invalid input returns 0, the program is hiding bad data. It should log context and raise the project-specific error."
        },
        {
          title: "Add logged custom errors",
          goal: "Create a custom input error and log invalid minute values before raising it.",
          steps: ["Define TrackerInputError", "Configure a logger that captures warning messages", "Raise TrackerInputError for invalid minutes"],
          deliverables: ["Custom exception", "Logging setup", "Valid and invalid parser proof"],
          verifierCommand: "python -m pytest tests/test_errors.py",
          expectedEvidence: "Passing tests showing valid minutes parse, invalid minutes raise TrackerInputError, and logs capture the bad value.",
          projectConnection: "This makes the professional utility easier to debug and safer to use.",
          tester: {
            codeLabel: "Paste your custom error and logging code",
            outputLabel: "Paste error/log test output",
            requiredCodeIncludes: ["TrackerInputError", "logging", "logger.warning", "parse_minutes"],
            requiredOutputIncludes: ["invalid minutes", "soon", "passed"],
            successMessage: "Your logging proof reports bad input without hiding it.",
            failureMessage: "The tester needs a custom error, a warning log, and proof that invalid minutes fail clearly."
          },
          runnerSpec: {
            language: "python",
            starterCode: "import logging\n\nlogs = []\n\nclass TrackerInputError(Exception):\n    pass\n\nclass ListHandler(logging.Handler):\n    def emit(self, record):\n        logs.append(record.getMessage())\n\nlogger = logging.getLogger('study_tracker')\nlogger.handlers = []\nlogger.addHandler(ListHandler())\nlogger.setLevel(logging.INFO)\n\ndef parse_minutes(value):\n    return None\n\nvalid_minutes = parse_minutes('30')\nprint(valid_minutes)",
            visibleTests: [
              {
                id: "logging-errors-invalid-minutes",
                name: "Invalid minutes are logged and raised clearly",
                code: "assert valid_minutes == 30\ntry:\n    parse_minutes('soon')\nexcept TrackerInputError as error:\n    assert str(error) == 'minutes must be a number'\nelse:\n    raise AssertionError('invalid minutes should raise TrackerInputError')\nassert 'invalid minutes: soon' in logs\nprint('invalid minutes soon passed')",
                expectedOutputIncludes: ["invalid minutes", "soon", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "logging-errors-keeps-logger-name",
                name: "Logger keeps project-specific name",
                code: "assert logger.name == 'study_tracker'"
              }
            ],
            expectedOutput: ["invalid minutes", "soon", "passed"]
          }
        },
        professionalLoggingPracticeReps
      )
    },
    {
      id: "lesson-python-pytest-ci",
      moduleId: "module-python-professional",
      slug: "python-pytest-ci",
      title: "Prove It With Pytest and CI Commands",
      summary: "Organize repeatable tests and verification commands a reviewer can run.",
      bodyMarkdown: "Professional project proof is repeatable. A reviewer should see the fixtures, test cases, and exact commands that prove the utility still works after changes.",
      estimatedMinutes: 14,
      difficulty: "portfolio",
      skillIds: ["skill-python-professional", "skill-testing-debugging", "skill-portfolio-evidence"],
      quizId: "quiz-python-pytest-ci",
      desktopTask: "Create pytest fixtures for clean and messy rows, then document python -m pytest and one CLI smoke command.",
      evidencePrompt: "Record the fixture names, test names, exact commands, and final passing output.",
      workshop: workshop(
        "Create repeatable pytest evidence for the professional utility.",
        "Manual runs are useful, but professional projects need a verifier that runs the same way for every reviewer and future change.",
        "A fixture is reusable sample data for tests. Tests name behavior. Verification commands document how to run the proof from a clean checkout.",
        "A clean_rows fixture can support test_summary_totals, while messy_rows can support test_rejected_report.",
        "Define fixture names, test names, and verification commands for the tracker.",
        "This turns the professional utility into a portfolio-ready artifact with reviewer-grade proof.",
        "Which behavior would break first if a future change damaged parsing, and which test would catch it?",
        ["Only testing through screenshots", "No fixture for messy input", "Using pytest without documenting the exact command"],
        {
          language: "Python testing",
          tools: ["pytest", "fixtures", "CI-style commands"],
          synopsis: "You are learning how professional Python projects prove behavior with repeatable tests and exact verification commands. Repeatable means a reviewer can run the same command and inspect the same kind of result.",
          prerequisites: ["Have parser and report behavior to test.", "Know why clean and messy inputs both matter."],
          testingFocus: "You will test that fixture names, test names, and verification commands cover clean rows, messy rows, and CLI smoke behavior."
        },
        {
          starterCode: "fixtures = []\ntests = []\nverification_commands = []\n\n# Add professional pytest fixtures, test names, and commands.\nprint(fixtures)\nprint(tests)\nprint(verification_commands)",
          expectedOutput: "clean_rows\nmessy_rows\ntest_summary_totals\ntest_rejected_report\npython -m pytest",
          checkYourAnswer: "If your commands do not include python -m pytest, a reviewer may not know how to reproduce the test proof exactly. A smoke command is a quick run that proves the CLI still starts."
        },
        {
          title: "Create professional verification evidence",
          goal: "Define the pytest fixtures, test cases, and verification commands that prove the utility works.",
          steps: ["Name fixtures for clean and messy input", "Name tests for totals and rejected reports", "Document pytest and CLI smoke commands"],
          deliverables: ["Fixture plan", "Test plan", "Verification command list"],
          verifierCommand: "python -m pytest && python study_tracker.py --input sessions.csv --output summary.txt",
          expectedEvidence: "Passing pytest output plus a CLI smoke command that proves the packaged utility still runs.",
          projectConnection: "This is the verification standard for the Professional Python Utility mission.",
          tester: {
            codeLabel: "Paste your pytest and verification plan",
            outputLabel: "Paste passing command output",
            requiredCodeIncludes: ["clean_rows", "messy_rows", "test_summary_totals", "test_rejected_report", "python -m pytest"],
            requiredOutputIncludes: ["pytest", "summary", "passed"],
            successMessage: "Your pytest/CI proof gives reviewers repeatable evidence.",
            failureMessage: "The tester needs fixture names, test names, and exact verification commands."
          },
          runnerSpec: {
            language: "python",
            starterCode: "fixtures = []\ntests = []\nverification_commands = []\n\n# Add professional pytest fixtures, test names, and commands.\nprint(fixtures)\nprint(tests)\nprint(verification_commands)",
            visibleTests: [
              {
                id: "pytest-ci-plan-has-proof",
                name: "Pytest and CLI verification plan has proof coverage",
                code: "assert 'clean_rows' in fixtures\nassert 'messy_rows' in fixtures\nassert 'test_summary_totals' in tests\nassert 'test_rejected_report' in tests\nassert 'python -m pytest' in verification_commands\nassert any('study_tracker.py --input sessions.csv --output summary.txt' in command for command in verification_commands)\nprint('pytest summary passed')",
                expectedOutputIncludes: ["pytest", "summary", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "pytest-ci-plan-covers-cli-smoke",
                name: "Verification plan includes CLI smoke proof",
                code: "assert any(command.startswith('python study_tracker.py') for command in verification_commands)"
              }
            ],
            expectedOutput: ["pytest", "summary", "passed"]
          }
        },
        professionalPytestPracticeReps
      )
    },
    {
      id: "lesson-python-pyproject-metadata",
      moduleId: "module-python-professional",
      slug: "python-pyproject-metadata",
      title: "Declare the Project With pyproject.toml",
      summary: "Add packaging metadata so the utility has a name, version, Python requirement, and test configuration.",
      bodyMarkdown: "Professional Python projects describe themselves in pyproject.toml. That file tells tools how the project is named, what Python version it expects, and how tests should be discovered.",
      estimatedMinutes: 13,
      difficulty: "portfolio",
      skillIds: ["skill-python-professional", "skill-testing-debugging", "skill-portfolio-evidence"],
      quizId: "quiz-python-pyproject-metadata",
      desktopTask: "Create pyproject.toml for the study tracker with project metadata, dev test dependencies, and pytest testpaths.",
      evidencePrompt: "Record the pyproject.toml sections, the Python version requirement, and the command that reads the same test layout.",
      workshop: workshop(
        "Write a minimal pyproject.toml for the professional utility.",
        "Packaging metadata makes the project installable, inspectable, and tool-friendly. Without it, reviewers have to infer the project name, Python version, and test setup.",
        "pyproject.toml is the standard project configuration file for modern Python tools. A strong pyproject.toml starts with [project], name, version, requires-python, optional dev dependencies, and tool configuration for pytest.",
        "[project] name = 'study-tracker' and [tool.pytest.ini_options] testpaths = ['tests'] tell humans and tools what this project is.",
        "Draft the pyproject.toml content that defines the tracker as a Python project.",
        "This prepares the installable CLI lesson and makes the Professional Python Utility mission closer to a real package.",
        "Which metadata helps a reviewer install the project, and which metadata helps test tools run consistently?",
        ["Leaving out requires-python", "Putting pytest settings only in a README", "Using a project name that does not match the CLI"],
        {
          language: "Python packaging",
          tools: ["pyproject.toml", "pytest", "packaging metadata"],
          synopsis: "You are learning how professional Python projects declare metadata. Metadata is information about the project, such as its name, version, Python requirement, and test settings.",
          prerequisites: ["Know the utility package name.", "Know the test folder and minimum Python version the project expects."],
          testingFocus: "You will test that the pyproject text includes project metadata, dev dependencies, and pytest configuration."
        },
        {
          starterCode: "pyproject_toml = \"\"\"\n[project]\nname = \"\"\nversion = \"\"\nrequires-python = \"\"\n\n[tool.pytest.ini_options]\ntestpaths = []\n\"\"\"\nprint(pyproject_toml)",
          expectedOutput: "[project]\nname = \"study-tracker\"\nrequires-python = \">=3.11\"\ntestpaths = [\"tests\"]",
          checkYourAnswer: "If pytest settings only exist in your README, tooling cannot read them. Put repeatable configuration in pyproject.toml and use the README to explain it."
        },
        {
          title: "Create packaging metadata",
          goal: "Write a minimal pyproject.toml that identifies the utility and configures tests.",
          steps: ["Add [project] metadata", "Declare requires-python", "Add pytest testpaths under tool configuration"],
          deliverables: ["pyproject.toml text", "Python version requirement", "pytest testpath configuration"],
          verifierCommand: "python -m pytest",
          expectedEvidence: "pyproject.toml excerpt plus pytest output showing tests are discovered from the configured folder.",
          projectConnection: "This is the package metadata foundation for the Professional Python Utility mission.",
          tester: {
            codeLabel: "Paste your pyproject.toml",
            outputLabel: "Paste pytest or metadata review output",
            requiredCodeIncludes: ["[project]", "name", "version", "requires-python", "[tool.pytest.ini_options]"],
            requiredOutputIncludes: ["study-tracker", "tests", "passed"],
            successMessage: "Your pyproject proof gives tools enough metadata to understand the utility.",
            failureMessage: "The tester needs project metadata, pytest configuration, and output showing the metadata passed review."
          },
          runnerSpec: {
            language: "python",
            starterCode: "pyproject_toml = \"\"\"\n[project]\nname = \"\"\nversion = \"\"\nrequires-python = \"\"\n\n[tool.pytest.ini_options]\ntestpaths = []\n\"\"\"\nprint(pyproject_toml)",
            visibleTests: [
              {
                id: "pyproject-has-professional-metadata",
                name: "pyproject.toml has professional metadata",
                code: "assert '[project]' in pyproject_toml\nassert 'name = \"study-tracker\"' in pyproject_toml\nassert 'version = \"0.1.0\"' in pyproject_toml\nassert 'requires-python = \">=3.11\"' in pyproject_toml\nassert '[tool.pytest.ini_options]' in pyproject_toml\nassert 'testpaths = [\"tests\"]' in pyproject_toml\nprint('study-tracker tests passed')",
                expectedOutputIncludes: ["study-tracker", "tests", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "pyproject-has-dev-test-dependency",
                name: "pyproject includes dev test dependency",
                code: "assert '[project.optional-dependencies]' in pyproject_toml\nassert 'pytest' in pyproject_toml"
              }
            ],
            expectedOutput: ["study-tracker", "tests", "passed"]
          }
        },
        professionalPyprojectPracticeReps
      )
    },
    {
      id: "lesson-python-installable-cli",
      moduleId: "module-python-professional",
      slug: "python-installable-cli",
      title: "Make the CLI Installable",
      summary: "Expose a console script entry point so users can run study-tracker instead of python study_tracker.py.",
      bodyMarkdown: "Professional Python CLIs should be installable. A console script entry point turns package code into a command a reviewer can run consistently after installation.",
      estimatedMinutes: 14,
      difficulty: "portfolio",
      skillIds: ["skill-python-professional", "skill-testing-debugging", "skill-portfolio-evidence"],
      quizId: "quiz-python-installable-cli",
      desktopTask: "Add [project.scripts] study-tracker = study_tracker.cli:main and document an install-plus-smoke command.",
      evidencePrompt: "Record the entry point, the install command, and the smoke-test command that proves the installed CLI runs.",
      workshop: workshop(
        "Add a console script entry point for the tracker.",
        "An installable CLI is easier to review because the command name becomes stable. The reviewer should not need to know which Python file happens to be the entrypoint.",
        "A console script entry point connects an installed command name to a Python function. [project.scripts] maps a command name to a Python function such as study_tracker.cli:main.",
        "study-tracker = 'study_tracker.cli:main' means the installed command can call the package entrypoint.",
        "Define the script entry point and the smoke command that proves it works.",
        "This turns the professional utility from a script into an installable local tool.",
        "What should main() own, and what logic should remain in parser or reports modules?",
        ["Pointing the script at a function that does not exist", "Putting all logic inside main", "Documenting only python study_tracker.py after adding an installed command"],
        {
          language: "Python packaging",
          tools: ["pyproject.toml", "console scripts", "CLI smoke test"],
          synopsis: "You are learning how professional Python projects expose an installable command with a stable entry point, so a reviewer can run study-tracker instead of remembering a file path.",
          prerequisites: ["Have a package module with cli.py.", "Know what main() should call without owning all business logic."],
          testingFocus: "You will test that the entry point maps study-tracker to study_tracker.cli:main and that a smoke command is documented."
        },
        {
          starterCode: "project_scripts = {}\nmain_function = \"\"\nsmoke_command = \"\"\n\n# Add the installable CLI command mapping and smoke command.\nprint(project_scripts)\nprint(smoke_command)",
          expectedOutput: "study-tracker -> study_tracker.cli:main\nstudy-tracker --help",
          checkYourAnswer: "If the entry point does not end in :main, make sure the referenced function exists and only coordinates the CLI flow. The calculation logic should still live in focused modules."
        },
        {
          title: "Expose the study-tracker command",
          goal: "Define the console script entry point and smoke command for the installed utility.",
          steps: ["Add the [project.scripts] mapping", "Point it at study_tracker.cli:main", "Document an installed-command smoke test"],
          deliverables: ["Script entry point", "main function path", "Smoke command"],
          verifierCommand: "python -m pip install -e . && study-tracker --help",
          expectedEvidence: "Entry-point excerpt plus smoke command output proving the installed command runs.",
          projectConnection: "This makes the Professional Python Utility behave like a real local command-line package.",
          tester: {
            codeLabel: "Paste your project script entry point",
            outputLabel: "Paste installed CLI smoke output",
            requiredCodeIncludes: ["[project.scripts]", "study-tracker", "study_tracker.cli:main"],
            requiredOutputIncludes: ["study-tracker", "--help", "passed"],
            successMessage: "Your installable CLI proof exposes a stable command.",
            failureMessage: "The tester needs a console script mapping plus smoke output for study-tracker --help."
          },
          runnerSpec: {
            language: "python",
            starterCode: "project_scripts = {}\nmain_function = \"\"\nsmoke_command = \"\"\n\n# Add the installable CLI command mapping and smoke command.\nprint(project_scripts)\nprint(smoke_command)",
            visibleTests: [
              {
                id: "installable-cli-entrypoint",
                name: "Installable CLI entry point is defined",
                code: "assert project_scripts == {'study-tracker': 'study_tracker.cli:main'}\nassert main_function == 'study_tracker.cli:main'\nassert smoke_command == 'study-tracker --help'\nprint('study-tracker --help passed')",
                expectedOutputIncludes: ["study-tracker", "--help", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "installable-cli-uses-package-module",
                name: "Entry point uses package module",
                code: "assert project_scripts['study-tracker'].startswith('study_tracker.')"
              }
            ],
            expectedOutput: ["study-tracker", "--help", "passed"]
          }
        },
        professionalInstallableCliPracticeReps
      )
    },
    {
      id: "lesson-python-config-files",
      moduleId: "module-python-professional",
      slug: "python-config-files",
      title: "Load Configuration Without Surprises",
      summary: "Use config files and defaults so CLI behavior is repeatable without hardcoding every option.",
      bodyMarkdown: "Professional tools often need defaults that can change by project or environment. A configuration loader should merge explicit config with safe defaults and keep command-line overrides easy to reason about.",
      estimatedMinutes: 14,
      difficulty: "portfolio",
      skillIds: ["skill-python-professional", "skill-testing-debugging"],
      quizId: "quiz-python-config-files",
      desktopTask: "Add a tracker.config.json file with report format and minimum-minute defaults, then load it safely.",
      evidencePrompt: "Record the default config, a sample config file, merged config output, and one missing-config behavior.",
      workshop: workshop(
        "Load config defaults from a file without hiding behavior.",
        "Configuration makes a tool flexible, but hidden configuration makes it confusing. Professional loaders use explicit defaults and predictable merge rules.",
        "Configuration means settings the user or project can change without editing program logic. A safe config loader starts from DEFAULT_CONFIG, reads a file when present, and lets file values override only known keys.",
        "DEFAULT_CONFIG can set format=text, output=summary.txt, and min_minutes=0 while tracker.config.json overrides format=json.",
        "Build a loader that merges a JSON config file with defaults.",
        "This prepares the professional utility for real users who want stable defaults across runs.",
        "Which options belong in config, and which options should remain explicit command-line arguments?",
        ["Letting unknown config keys silently change behavior", "Failing when no config path is provided", "Using config values without defaults"],
        {
          language: "Python configuration",
          tools: ["json", "config files", "defaults"],
          synopsis: "You are learning how to give a Python CLI configurable behavior while keeping defaults explicit and testable. Defaults are the values the tool uses when no config file overrides them.",
          prerequisites: ["Know the CLI options format, output, and min_minutes.", "Know how JSON represents dictionaries."],
          testingFocus: "You will test default config behavior, file override behavior, and preservation of default values not mentioned in the file."
        },
        {
          starterCode: "import json\n\nDEFAULT_CONFIG = {'format': 'text', 'output': 'summary.txt', 'min_minutes': 0}\nfiles = {'tracker.config.json': '{\"format\": \"json\", \"min_minutes\": 15}'}\n\ndef load_config(path=None, files=None):\n    return {}\n\nconfig = load_config('tracker.config.json', files)\nprint(config)",
          expectedOutput: "{'format': 'json', 'output': 'summary.txt', 'min_minutes': 15}",
          checkYourAnswer: "If output disappears when the config file omits it, you replaced defaults instead of merging with them. Merging means file values update the default set instead of wiping it out."
        },
        {
          title: "Merge config with defaults",
          goal: "Create a config loader that preserves defaults and applies known file overrides.",
          steps: ["Define DEFAULT_CONFIG", "Read JSON config when a path is provided", "Merge file values over defaults without losing omitted defaults"],
          deliverables: ["DEFAULT_CONFIG", "load_config function", "Merged config proof"],
          verifierCommand: "python -m pytest tests/test_config.py",
          expectedEvidence: "Passing config tests showing default behavior, file override behavior, and preserved fallback values.",
          projectConnection: "This gives the Professional Python Utility predictable settings without hardcoding every run.",
          tester: {
            codeLabel: "Paste your config loader",
            outputLabel: "Paste config test output",
            requiredCodeIncludes: ["DEFAULT_CONFIG", "load_config", "json.loads", "tracker.config.json"],
            requiredOutputIncludes: ["format", "summary.txt", "min_minutes", "passed"],
            successMessage: "Your config proof preserves defaults while applying file overrides.",
            failureMessage: "The tester needs a DEFAULT_CONFIG merge loader plus output showing preserved defaults."
          },
          runnerSpec: {
            language: "python",
            starterCode: "import json\n\nDEFAULT_CONFIG = {'format': 'text', 'output': 'summary.txt', 'min_minutes': 0}\nfiles = {'tracker.config.json': '{\"format\": \"json\", \"min_minutes\": 15}'}\n\ndef load_config(path=None, files=None):\n    return {}\n\nconfig = load_config('tracker.config.json', files)\nprint(config)",
            visibleTests: [
              {
                id: "config-loader-merges-defaults",
                name: "Config loader merges defaults with file values",
                code: "assert config == {'format': 'json', 'output': 'summary.txt', 'min_minutes': 15}\nassert load_config(None, files) == DEFAULT_CONFIG\nprint('format summary.txt min_minutes passed')",
                expectedOutputIncludes: ["format", "summary.txt", "min_minutes", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "config-loader-ignores-unknown-keys",
                name: "Config loader ignores unknown keys",
                code: "unknown_files = {'tracker.config.json': '{\"format\": \"json\", \"extra\": true}'}\nloaded = load_config('tracker.config.json', unknown_files)\nassert loaded == {'format': 'json', 'output': 'summary.txt', 'min_minutes': 0}"
              }
            ],
            expectedOutput: ["format", "summary.txt", "min_minutes", "passed"]
          }
        },
        pythonConfigPracticeReps
      )
    },
    {
      id: "lesson-python-ci-precommit",
      moduleId: "module-python-professional",
      slug: "python-ci-precommit",
      title: "Set CI and Pre-Commit Expectations",
      summary: "Define local and CI checks so formatting, linting, tests, and CLI smoke proof stay repeatable.",
      bodyMarkdown: "Professional projects protect quality before review. Pre-commit catches local issues early, and CI proves the same checks pass in a clean environment.",
      estimatedMinutes: 15,
      difficulty: "portfolio",
      skillIds: ["skill-python-professional", "skill-testing-debugging", "skill-portfolio-evidence"],
      quizId: "quiz-python-ci-precommit",
      desktopTask: "Document pre-commit hooks and a CI workflow that run lint, tests, and CLI smoke commands.",
      evidencePrompt: "Record the local pre-commit checks, CI commands, and final passing output from the same verifier set.",
      workshop: workshop(
        "Define the quality gates for the professional utility.",
        "A project is easier to trust when checks run before code review and again in CI. The exact tools can vary, but the expectations should be explicit.",
        "A quality gate is a check that must pass before work is trusted. A practical quality gate includes formatting or linting, pytest, and one CLI smoke command that exercises the installed command.",
        "pre-commit can run ruff and pytest locally, while CI can run python -m pytest and study-tracker --help.",
        "Create a quality-gate plan with local hooks, CI commands, and required proof output.",
        "This is the final professional standard before the utility is portfolio-ready.",
        "Which check catches style drift, which check catches logic regression, and which check catches packaging or entrypoint breakage?",
        ["Running CI commands that differ from local commands without explaining why", "Testing only lint and never behavior", "Skipping the installed CLI smoke command"],
        {
          language: "Python project operations",
          tools: ["pre-commit", "CI workflow", "pytest", "CLI smoke test"],
          synopsis: "You are learning how professional Python projects make verification repeatable before review and in clean CI environments. CI means continuous integration: checks that run automatically in a fresh environment.",
          prerequisites: ["Know the pytest command for the utility.", "Know the installed CLI command name."],
          testingFocus: "You will test that the quality plan includes linting, tests, CLI smoke proof, and consistent local/CI expectations."
        },
        {
          starterCode: "precommit_hooks = []\nci_commands = []\nrequired_evidence = []\n\n# Add local hooks, CI commands, and evidence requirements.\nprint(precommit_hooks)\nprint(ci_commands)\nprint(required_evidence)",
          expectedOutput: "ruff\npython -m pytest\nstudy-tracker --help\nCI checks pass",
          checkYourAnswer: "If your CI never runs the installed command, packaging can break while tests still pass. Include at least one command that starts the installed CLI."
        },
        {
          title: "Define professional quality gates",
          goal: "Create a pre-commit and CI verification plan for the Python utility.",
          steps: ["List local pre-commit hooks", "List CI commands", "Require pytest and CLI smoke evidence"],
          deliverables: ["Pre-commit hook plan", "CI command plan", "Required evidence checklist"],
          verifierCommand: "pre-commit run --all-files && python -m pytest && study-tracker --help",
          expectedEvidence: "Output showing lint or format checks, pytest, and an installed CLI smoke command pass.",
          projectConnection: "This makes the Professional Python Utility reviewable with repeatable quality gates.",
          tester: {
            codeLabel: "Paste your CI/pre-commit plan",
            outputLabel: "Paste check output",
            requiredCodeIncludes: ["pre-commit", "ruff", "python -m pytest", "study-tracker --help"],
            requiredOutputIncludes: ["ruff", "pytest", "study-tracker", "passed"],
            successMessage: "Your quality-gate proof covers local and CI verification.",
            failureMessage: "The tester needs pre-commit, lint, pytest, and installed CLI smoke expectations."
          },
          runnerSpec: {
            language: "python",
            starterCode: "precommit_hooks = []\nci_commands = []\nrequired_evidence = []\n\n# Add local hooks, CI commands, and evidence requirements.\nprint(precommit_hooks)\nprint(ci_commands)\nprint(required_evidence)",
            visibleTests: [
              {
                id: "ci-precommit-quality-gates",
                name: "CI and pre-commit quality gates are complete",
                code: "assert 'ruff' in precommit_hooks\nassert 'python -m pytest' in precommit_hooks\nassert 'python -m pytest' in ci_commands\nassert 'study-tracker --help' in ci_commands\nassert 'CI passed' in required_evidence\nprint('ruff pytest study-tracker passed')",
                expectedOutputIncludes: ["ruff", "pytest", "study-tracker", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "ci-precommit-includes-cli-output-evidence",
                name: "Quality plan requires CLI output evidence",
                code: "assert any('CLI smoke output' in evidence for evidence in required_evidence)"
              }
            ],
            expectedOutput: ["ruff", "pytest", "study-tracker", "passed"]
          }
        },
        pythonCiPracticeReps
      )
    },
    {
      id: "lesson-python-professional-review",
      moduleId: "module-python-professional",
      slug: "python-professional-review",
      title: "Professional Utility Review Gate",
      summary: "Review the package like a maintainer by checking structure, metadata, tests, config, and installed command proof.",
      bodyMarkdown: "Professional work is not just more code. It is code that a maintainer can install, test, configure, and debug with confidence.",
      estimatedMinutes: 16,
      difficulty: "portfolio",
      skillIds: ["skill-python-professional", "skill-testing-debugging", "skill-portfolio-evidence"],
      quizId: "quiz-python-professional-review",
      desktopTask: "Create a Professional Utility Review matrix covering structure, pyproject, installed command, config, logging, and pytest proof.",
      evidencePrompt: "Record the package tree, pyproject excerpt, installed command output, config behavior, log/error example, and pytest output.",
      workshop: workshop(
        "Review the professional utility as a maintainable package.",
        "A maintainer needs more than feature proof. They need to know how the package is structured, installed, configured, tested, and debugged.",
        "A professional review matrix maps each quality area to evidence: structure, metadata, command, config, errors/logs, and tests.",
        "pyproject proves metadata, study-tracker --help proves entrypoint, pytest proves behavior, and config tests prove defaults.",
        "Build a review matrix that proves the utility is maintainable, not just functional.",
        "This is the transition checkpoint before Python Integration Depth.",
        "Which proof would fail first if the package could not be installed on a clean machine?",
        ["Checking only business logic and ignoring installability", "Listing pyproject without verifying commands", "Claiming config works without a default case"],
        {
          language: "Professional Python review",
          tools: ["pyproject.toml", "installed CLI", "config tests", "pytest"],
          synopsis: "You are learning to review a Python package for maintainability: structure, metadata, installability, configuration, logging, and repeatable tests.",
          prerequisites: ["Have completed the Professional Python Utility lessons.", "Have proof commands for pytest and the installed CLI."],
          testingFocus: "You will test that every professional quality area has specific evidence and one improvement."
        },
        {
          starterCode: "review_matrix = []\ncommands = []\nimprovement = ''\n\n# Add evidence rows for structure, metadata, command, config, logging, and tests.\nprint(review_matrix)\nprint(commands)\nprint(improvement)",
          expectedOutput: "structure, metadata, command, config, logging, tests, improvement",
          checkYourAnswer: "If a row has no evidence, it is a hope, not a review. Name the command or artifact that proves the row."
        },
        {
          title: "Complete the Professional Utility Review",
          goal: "Create a maintainer-style review matrix for the professional package.",
          steps: ["Map each quality area to evidence", "List exact verification commands", "Choose one professional improvement"],
          deliverables: ["Review matrix", "Command evidence", "Improvement note"],
          verifierCommand: "python -m pytest && study-tracker --help && pre-commit run --all-files",
          expectedEvidence: "A matrix showing structure, metadata, installed CLI, config, logging, and test proof, plus one improvement decision.",
          projectConnection: "This review gate confirms readiness for Python Integration Depth.",
          tester: {
            codeLabel: "Paste your Professional Utility Review matrix",
            outputLabel: "Paste command output and improvement note",
            requiredCodeIncludes: ["structure", "metadata", "command", "config", "logging", "tests"],
            requiredOutputIncludes: ["metadata", "command", "config", "tests", "passed"],
            successMessage: "Your professional review proves the package is maintainable and verifiable.",
            failureMessage: "The tester needs evidence rows for structure, metadata, command, config, logging, and tests."
          },
          runnerSpec: {
            language: "python",
            starterCode: "review_matrix = []\ncommands = []\nimprovement = ''\n\n# Add evidence rows for structure, metadata, command, config, logging, and tests.\nprint(review_matrix)\nprint(commands)\nprint(improvement)",
            visibleTests: [
              {
                id: "professional-review-covers-quality-areas",
                name: "Professional review covers maintainability proof",
                code: "areas = {row['area'] for row in review_matrix}\nassert {'structure', 'metadata', 'command', 'config', 'logging', 'tests'}.issubset(areas)\nassert all(row.get('evidence') for row in review_matrix)\nassert any('python -m pytest' in command for command in commands)\nassert any('study-tracker --help' in command for command in commands)\nassert len(improvement) >= 20\nprint('metadata command config tests passed')",
                expectedOutputIncludes: ["metadata", "command", "config", "tests", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "professional-review-names-installability",
                name: "Professional review includes installability evidence",
                code: "assert any(row['area'] == 'command' and 'study-tracker' in row.get('evidence', '') for row in review_matrix)"
              }
            ],
            expectedOutput: ["metadata", "command", "config", "tests", "passed"]
          }
        },
        pythonProfessionalReviewPracticeReps
      )
    },
    {
      id: "lesson-python-regex-validation",
      moduleId: "module-python-integration",
      slug: "python-regex-validation",
      title: "Validate Text With Regex Carefully",
      summary: "Use regular expressions for narrow input checks without turning parsing into a mystery.",
      bodyMarkdown: "Regex is powerful when it answers a narrow question. Professional Python uses it for focused validation, then keeps the rest of the parsing readable.",
      estimatedMinutes: 13,
      difficulty: "applied",
      skillIds: ["skill-python-integration", "skill-testing-debugging"],
      quizId: "quiz-python-regex-validation",
      desktopTask: "Add regex validation for YYYY-MM-DD dates and topic slugs in the study tracker parser.",
      evidencePrompt: "Record valid and invalid examples, the regex patterns, and the tests that prove each boundary.",
      workshop: workshop(
        "Validate dates and slugs with small regular expressions.",
        "Real input often needs format checks before deeper parsing. Regex should catch obvious shape problems without hiding business rules.",
        "A regular expression, or regex, is a compact pattern for checking text shape. A regex should be specific enough to reject bad shapes and simple enough for a teammate to review.",
        "A YYYY-MM-DD shape check can use ^\\d{4}-\\d{2}-\\d{2}$ before later date parsing validates calendar correctness.",
        "Write validators for date strings and topic slugs, then test valid and invalid examples.",
        "This closes the regex gap and strengthens parser boundaries for the Study Data Cleaner mission.",
        "Which validation belongs in regex, and which validation should be handled by date or business logic later?",
        ["Using one giant regex for all parsing", "Accepting partial matches", "Treating regex shape validation as full calendar validation"],
        {
          language: "Python regex",
          tools: ["re", "parser tests", "input validation"],
          synopsis: "You are learning how to use regular expressions as focused validation tools while keeping parser behavior understandable. Use regex for shape checks, not for every business rule.",
          prerequisites: ["Know that raw rows are strings.", "Know why bad dates or topic slugs should be rejected clearly."],
          testingFocus: "You will test valid and invalid date and slug examples with direct assertions, including examples that should fail."
        },
        {
          starterCode: "import re\n\nDATE_PATTERN = r\"\"\nSLUG_PATTERN = r\"\"\n\ndef is_valid_date(value):\n    return False\n\ndef is_valid_slug(value):\n    return False\n\nprint(is_valid_date(\"2026-05-08\"))\nprint(is_valid_slug(\"python-basics\"))",
          expectedOutput: "True\nTrue\nFalse for malformed examples",
          checkYourAnswer: "If bad-2026 passes, your date regex is matching only part of the text. Use anchors or fullmatch so the whole value must match."
        },
        {
          title: "Add focused regex validators",
          goal: "Create date and slug validators that reject malformed text before parser conversion.",
          steps: ["Define a date shape regex", "Define a topic slug regex", "Test valid and invalid examples"],
          deliverables: ["DATE_PATTERN", "SLUG_PATTERN", "Validator functions"],
          verifierCommand: "python -m pytest tests/test_validation.py",
          expectedEvidence: "Passing tests showing valid date/slug examples pass and malformed examples fail.",
          projectConnection: "This adds a professional validation boundary to the parser.",
          tester: {
            codeLabel: "Paste your regex validators",
            outputLabel: "Paste validation test output",
            requiredCodeIncludes: ["re", "DATE_PATTERN", "SLUG_PATTERN", "fullmatch"],
            requiredOutputIncludes: ["date", "slug", "passed"],
            successMessage: "Your regex validation proof keeps input checks focused and testable.",
            failureMessage: "The tester needs anchored regex validators plus output proving date and slug checks."
          },
          runnerSpec: {
            language: "python",
            starterCode: "import re\n\nDATE_PATTERN = r\"\"\nSLUG_PATTERN = r\"\"\n\ndef is_valid_date(value):\n    return False\n\ndef is_valid_slug(value):\n    return False\n\nprint(is_valid_date(\"2026-05-08\"))\nprint(is_valid_slug(\"python-basics\"))",
            visibleTests: [
              {
                id: "regex-validates-date-and-slug",
                name: "Regex validators accept and reject expected values",
                code: "assert is_valid_date('2026-05-08') is True\nassert is_valid_date('bad-2026-05-08') is False\nassert is_valid_date('2026-5-8') is False\nassert is_valid_slug('python-basics') is True\nassert is_valid_slug('Python Basics') is False\nprint('date slug passed')",
                expectedOutputIncludes: ["date", "slug", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "regex-validation-rejects-partials",
                name: "Regex validators reject partial matches",
                code: "assert is_valid_date('2026-05-08-extra') is False\nassert is_valid_slug('python_basics') is False"
              }
            ],
            expectedOutput: ["date", "slug", "passed"]
          }
        },
        pythonRegexPracticeReps
      )
    },
    {
      id: "lesson-python-oop-service",
      moduleId: "module-python-integration",
      slug: "python-oop-service",
      title: "Use Classes for Stateful Services",
      summary: "Create a small service class when behavior and state belong together.",
      bodyMarkdown: "Object-oriented Python is useful when an object owns state and behavior together. A tracker service can own sessions and expose methods that add, total, and summarize them.",
      estimatedMinutes: 14,
      difficulty: "applied",
      skillIds: ["skill-python-integration", "skill-python-professional", "skill-testing-debugging"],
      quizId: "quiz-python-oop-service",
      desktopTask: "Create a StudyTrackerService class with add_session, total_minutes, and topic_minutes methods.",
      evidencePrompt: "Record two independent service instances and the tests proving they do not share state.",
      workshop: workshop(
        "Use a class when tracker state and behavior belong together.",
        "Classes are not required for every problem. They become useful when a project needs a clear object that owns state and methods.",
        "A class is a blueprint for creating objects. A service class is an object that owns useful app behavior. It can keep session storage private and expose methods for operations the rest of the app needs.",
        "StudyTrackerService().add_session('python', 30) followed by total_minutes() should return 30.",
        "Implement a service class and prove separate instances keep separate session lists.",
        "This closes the OOP gap and prepares larger Python app workflows.",
        "Which data should the service own, and which data should still be passed into methods explicitly?",
        ["Using a class only to group unrelated functions", "Sharing mutable class-level session lists", "Letting every module modify internal state directly"],
        {
          language: "Python classes",
          tools: ["classes", "methods", "state tests"],
          synopsis: "You are learning when object-oriented Python helps: when one object should own state and expose clear behavior. State means data that the object remembers between method calls.",
          prerequisites: ["Know how functions receive inputs and return values.", "Know what session data the tracker stores."],
          testingFocus: "You will test totals and prove two service instances do not accidentally share state."
        },
        {
          starterCode: "class StudyTrackerService:\n    def __init__(self):\n        pass\n\n    def add_session(self, topic, minutes):\n        pass\n\n    def total_minutes(self):\n        return 0\n\ntracker = StudyTrackerService()\ntracker.add_session('python', 30)\nprint(tracker.total_minutes())",
          expectedOutput: "30\nindependent instances do not share sessions",
          checkYourAnswer: "If a second tracker starts with the first tracker's sessions, you probably used class-level mutable state. Store sessions on self inside __init__ instead."
        },
        {
          title: "Build a tracker service class",
          goal: "Create a StudyTrackerService class with isolated state and useful methods.",
          steps: ["Initialize instance session storage", "Add sessions through a method", "Calculate totals through a method"],
          deliverables: ["StudyTrackerService class", "Two method tests", "Independent instance proof"],
          verifierCommand: "python -m pytest tests/test_service.py",
          expectedEvidence: "Passing tests for adding sessions, totals, and independent instances.",
          projectConnection: "This gives the integration mission a professional service layer.",
          tester: {
            codeLabel: "Paste your service class",
            outputLabel: "Paste service test output",
            requiredCodeIncludes: ["class StudyTrackerService", "__init__", "add_session", "total_minutes"],
            requiredOutputIncludes: ["service", "30", "passed"],
            successMessage: "Your service proof uses OOP where state and behavior belong together.",
            failureMessage: "The tester needs a service class plus tests for totals and independent instances."
          },
          runnerSpec: {
            language: "python",
            starterCode: "class StudyTrackerService:\n    def __init__(self):\n        pass\n\n    def add_session(self, topic, minutes):\n        pass\n\n    def total_minutes(self):\n        return 0\n\ntracker = StudyTrackerService()\ntracker.add_session('python', 30)\nprint(tracker.total_minutes())",
            visibleTests: [
              {
                id: "oop-service-keeps-state",
                name: "Service class owns state and behavior",
                code: "tracker.add_session('git', 15)\nassert tracker.total_minutes() == 45\nother = StudyTrackerService()\nassert other.total_minutes() == 0\nother.add_session('sql', 20)\nassert other.total_minutes() == 20\nassert tracker.total_minutes() == 45\nprint('service 30 passed')",
                expectedOutputIncludes: ["service", "30", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "oop-service-topic-minutes",
                name: "Service supports topic totals when implemented",
                code: "if hasattr(tracker, 'topic_minutes'):\n    assert tracker.topic_minutes('python') == 30"
              }
            ],
            expectedOutput: ["service", "30", "passed"]
          }
        },
        pythonServicePracticeReps
      )
    },
    {
      id: "lesson-python-sqlite-persistence",
      moduleId: "module-python-integration",
      slug: "python-sqlite-persistence",
      title: "Persist Sessions With SQLite",
      summary: "Design a SQLite table and queries that make tracker sessions durable.",
      bodyMarkdown: "Persistence changes a script into an app-like tool. SQLite is a practical local database for small utilities because it stores structured data without a server.",
      estimatedMinutes: 14,
      difficulty: "applied",
      skillIds: ["skill-python-integration", "skill-sql-joins", "skill-testing-debugging"],
      quizId: "quiz-python-sqlite-persistence",
      desktopTask: "Create a SQLite sessions table and queries for inserting sessions and totaling minutes by topic.",
      evidencePrompt: "Record the schema, seed rows, total-by-topic query, and command output.",
      workshop: workshop(
        "Store study sessions in a SQLite table.",
        "A professional local utility should not lose useful data every time it exits. SQLite gives the tracker durable structured storage.",
        "A schema is the shape of a database table. A good first schema stores date, topic, and minutes with types and a simple primary key. A repository function can hide SQL details from service code while queries answer real product questions.",
        "SELECT topic, SUM(minutes) FROM sessions GROUP BY topic returns totals that the report layer can use.",
        "Create the sessions table, insert sample rows, query totals by topic, and plan one invalid-row transaction check.",
        "This closes the database persistence gap and connects the Python path to the SQL path.",
        "Which fields belong in the database, and which calculated values can be derived by query?",
        ["Storing all session data as one text blob", "No query proving the schema works", "Hardcoding totals instead of calculating them"],
        {
          language: "SQLite for Python utilities",
          tools: ["SQLite", "schema", "aggregate query"],
          synopsis: "You are learning how a Python utility can persist session data with SQLite. Persist means save data so it is still available after the program exits.",
          prerequisites: ["Know the session fields date, topic, and minutes.", "Know that SQL tables store rows and queries calculate answers."],
          testingFocus: "You will test the schema by inserting rows, querying total minutes by topic, and explaining how an invalid insert should fail without leaving bad rows behind."
        },
        {
          starterCode: "CREATE TABLE sessions (\n  id INTEGER PRIMARY KEY,\n  date TEXT NOT NULL,\n  topic TEXT NOT NULL,\n  minutes INTEGER NOT NULL\n);\n\n-- Insert python and git sessions, then query totals by topic.",
          expectedOutput: "python | 50\ngit | 15",
          checkYourAnswer: "If the query returns one row per session, add GROUP BY topic so the database groups sessions by topic before calculating totals."
        },
        {
          title: "Create durable session storage",
          goal: "Build a SQLite schema and total-by-topic query for tracker sessions.",
          steps: ["Create the sessions table", "Insert at least three sample rows", "Query total minutes grouped by topic", "Name the invalid insert or rollback check"],
          deliverables: ["CREATE TABLE statement", "Seed inserts", "Aggregate query output", "Invalid-row or transaction failure note"],
          verifierCommand: "sqlite3 tracker.db < schema_and_query.sql",
          expectedEvidence: "SQL output showing python and git totals from inserted session rows plus a note about the invalid-row or rollback check.",
          projectConnection: "This turns the tracker into a local persistent utility.",
          tester: {
            codeLabel: "Paste your SQLite schema and query",
            outputLabel: "Paste query output",
            requiredCodeIncludes: ["CREATE TABLE", "sessions", "INSERT", "SUM", "GROUP BY"],
            requiredOutputIncludes: ["python", "50", "git", "15"],
            successMessage: "Your SQLite proof stores and queries durable session data.",
            failureMessage: "The tester needs a sessions schema, inserts, and grouped total output."
          },
          runnerSpec: {
            language: "sql",
            setupCode: "",
            starterCode: "CREATE TABLE sessions (\n  id INTEGER PRIMARY KEY,\n  date TEXT NOT NULL,\n  topic TEXT NOT NULL,\n  minutes INTEGER NOT NULL\n);\n\n-- Insert python and git sessions, then query totals by topic.",
            visibleTests: [
              {
                id: "sqlite-session-totals",
                name: "SQLite query returns totals by topic",
                code: "EXPECT_ROWS:python|50\ngit|15",
                expectedOutputIncludes: ["python", "50", "git", "15"]
              }
            ],
            hiddenTests: [
              {
                id: "sqlite-session-invalid-row-note",
                name: "SQLite depth includes an invalid row or rollback check",
                code: "EXPECT_ROWS:python|50\ngit|15",
                expectedOutputIncludes: ["python", "50", "git", "15"]
              }
            ],
            expectedOutput: ["python", "50", "git", "15"]
          }
        },
        pythonSqlitePracticeReps
      )
    },
    {
      id: "lesson-python-api-client",
      moduleId: "module-python-integration",
      slug: "python-api-client",
      title: "Call APIs Through a Safe Client",
      summary: "Build an API boundary with timeout, status checks, and response validation.",
      bodyMarkdown: "Network code should live at the edge of a project. A safe API client handles timeouts, status codes, and response shapes before the rest of the app trusts the data.",
      estimatedMinutes: 15,
      difficulty: "applied",
      skillIds: ["skill-python-integration", "skill-api-contracts", "skill-testing-debugging"],
      quizId: "quiz-python-api-client",
      desktopTask: "Create a fetch_sessions client function that validates status code and response shape before returning session records.",
      evidencePrompt: "Record one successful fake response, one bad-status response, one bad-shape response, and the tests proving each path.",
      workshop: workshop(
        "Build a safe API client boundary without trusting the network blindly.",
        "Professional Python apps often read from APIs. The rest of your program should not trust raw network responses until status and shape are checked.",
        "An API client is the code that talks to another service over the network. A client function should use config for the base URL, set a timeout, check HTTP status, parse JSON, validate fields, and keep secrets out of logs.",
        "client.get(url, timeout=5) returning status 200 and a list of sessions can become trusted records after validation.",
        "Use a fake client to test success, bad status, bad shape, and safe config handling without making real network calls.",
        "This closes the API/networking gap while keeping the mobile sandbox safe and offline.",
        "Which failures belong at the API boundary before data reaches the service layer?",
        ["No timeout", "Assuming status 200", "Trusting any JSON shape as session data"],
        {
          language: "Python API client",
          tools: ["HTTP client boundary", "fake responses", "validation tests", "config safety"],
          synopsis: "You are learning how to design API code as a safe boundary. Network data is untrusted input until your code checks the status code and response shape.",
          prerequisites: ["Know the StudySession fields.", "Know that network responses are untrusted input."],
          testingFocus: "You will test success, non-200 status, invalid JSON shape, timeout usage, and safe config boundaries without using real network access."
        },
        {
          starterCode: "class ApiError(Exception):\n    pass\n\nclass FakeResponse:\n    def __init__(self, status_code, payload):\n        self.status_code = status_code\n        self._payload = payload\n    def json(self):\n        return self._payload\n\nclass FakeClient:\n    def __init__(self, response):\n        self.response = response\n        self.timeout_seen = None\n    def get(self, url, timeout):\n        self.timeout_seen = timeout\n        return self.response\n\ndef fetch_sessions(client, url):\n    return []",
          expectedOutput: "[{'date': '2026-05-08', 'topic': 'python', 'minutes': 30}]\ntimeout=5",
          checkYourAnswer: "If bad status or bad shape returns an empty list, the caller cannot tell success from failure. Raise a project-specific API error so failure stays visible."
        },
        {
          title: "Create a safe API client",
          goal: "Build an API client boundary that checks timeout, status, and response shape.",
          steps: ["Call the client with timeout=5", "Raise ApiError for non-200 status", "Validate response records before returning them", "Keep base URL config separate from secret values"],
          deliverables: ["fetch_sessions function", "Fake client tests", "ApiError failure cases", "Config/secret boundary note"],
          verifierCommand: "python -m pytest tests/test_api_client.py",
          expectedEvidence: "Passing tests for success, bad status, bad shape, timeout behavior, and a note that secret values are not logged or pasted into evidence.",
          projectConnection: "This prepares Python integration work without requiring live network access in beginner lessons.",
          tester: {
            codeLabel: "Paste your API client boundary",
            outputLabel: "Paste API client test output",
            requiredCodeIncludes: ["ApiError", "fetch_sessions", "timeout=5", "status_code", "json"],
            requiredOutputIncludes: ["api", "timeout", "passed"],
            successMessage: "Your API client proof validates network data before trusting it.",
            failureMessage: "The tester needs status checks, timeout usage, shape validation, and API error tests."
          },
          runnerSpec: {
            language: "python",
            starterCode: "class ApiError(Exception):\n    pass\n\nclass FakeResponse:\n    def __init__(self, status_code, payload):\n        self.status_code = status_code\n        self._payload = payload\n    def json(self):\n        return self._payload\n\nclass FakeClient:\n    def __init__(self, response):\n        self.response = response\n        self.timeout_seen = None\n    def get(self, url, timeout):\n        self.timeout_seen = timeout\n        return self.response\n\ndef fetch_sessions(client, url):\n    return []",
            visibleTests: [
              {
                id: "api-client-validates-boundary",
                name: "API client validates status and shape",
                code: "payload = [{'date': '2026-05-08', 'topic': 'python', 'minutes': 30}]\nclient = FakeClient(FakeResponse(200, payload))\nassert fetch_sessions(client, 'https://example.test/sessions') == payload\nassert client.timeout_seen == 5\ntry:\n    fetch_sessions(FakeClient(FakeResponse(500, {'error': 'down'})), 'https://example.test/sessions')\nexcept ApiError:\n    pass\nelse:\n    raise AssertionError('bad status should raise ApiError')\nprint('api timeout passed')",
                expectedOutputIncludes: ["api", "timeout", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "api-client-rejects-bad-shape",
                name: "API client rejects bad response shape",
                code: "try:\n    fetch_sessions(FakeClient(FakeResponse(200, {'date': 'not a list'})), 'https://example.test/sessions')\nexcept ApiError:\n    pass\nelse:\n    raise AssertionError('bad shape should raise ApiError')"
              }
            ],
            expectedOutput: ["api", "timeout", "passed"]
          }
        },
        pythonApiPracticeReps
      )
    },
    {
      id: "lesson-python-integration-capstone",
      moduleId: "module-python-integration",
      slug: "python-integration-capstone",
      title: "Integrate the Professional Utility",
      summary: "Plan the final integration that connects validation, service logic, persistence, API boundaries, and evidence.",
      bodyMarkdown: "The point of advanced topics is not to collect buzzwords. The point is to integrate them into one reviewable utility where each layer has a job and each behavior has proof.",
      estimatedMinutes: 16,
      difficulty: "portfolio",
      skillIds: ["skill-python-integration", "skill-python-professional", "skill-testing-debugging", "skill-portfolio-evidence"],
      quizId: "quiz-python-integration-capstone",
      desktopTask: "Create an integration plan and verification matrix for regex, service class, SQLite, API client, JSON output, and CLI smoke commands.",
      evidencePrompt: "Record the integration layers, tests for each layer, and the final command sequence that proves the whole utility.",
      workshop: workshop(
        "Create the final integration plan for the professional utility.",
        "Advanced Python work is strongest when each layer is testable alone and then proven together through one or two smoke commands.",
        "An integration matrix is a table-like plan that names each layer, responsibility, tests, and evidence. Here the layers are validation, service logic, persistence, API client, reports, and CLI.",
        "The regex validator can have unit tests, the service can have state tests, SQLite can have repository fixtures, the API client can use fake responses, and the installed CLI can have a smoke command.",
        "Build a verification matrix that proves every integration layer has a clear responsibility, test, failure case, and stitched evidence path.",
        "This becomes the implementation checklist for the Python Integration Service mission.",
        "Which layer would you debug first if the final CLI output is wrong?",
        ["No integration test after unit tests", "A layer with no owner", "Evidence that proves only one happy path"],
        {
          language: "Python integration architecture",
          tools: ["verification matrix", "unit tests", "CLI smoke tests"],
          synopsis: "You are learning how to connect professional Python layers into one reviewable utility with evidence for each boundary. A layer is one part of the system with a clear job.",
          prerequisites: ["Know the validation, service, persistence, API, and report layers.", "Know the exact commands that verify the project."],
          testingFocus: "You will test that every required layer has a named responsibility, test, evidence command, and at least one failure case across the stitched path."
        },
        {
          starterCode: "integration_matrix = []\nverification_commands = []\n\n# Add layers, responsibilities, tests, and final commands.\nprint(integration_matrix)\nprint(verification_commands)",
          expectedOutput: "validation -> test_regex_validation\nservice -> test_service_totals\nsqlite -> test_sqlite_totals\napi -> test_api_client\nstudy-tracker --help",
          checkYourAnswer: "If a layer has no test, it is not ready for the capstone. If a command has no artifact or output to inspect, the evidence is weak."
        },
        {
          title: "Build the integration proof matrix",
          goal: "Create a capstone plan that connects every advanced Python layer to tests and evidence.",
          steps: ["List each integration layer", "Name its responsibility and test", "Name one failure path", "Name final check commands and artifacts"],
          deliverables: ["Integration matrix", "Verification command list", "Failure-path row", "Evidence checklist"],
          verifierCommand: "python -m pytest && study-tracker --help && study-tracker --input sessions.csv --format json",
          expectedEvidence: "A matrix connecting layers to tests plus final command output for pytest, help, JSON report smoke proof, and one invalid input or API failure path.",
          projectConnection: "This is the final checklist for the Python Integration Service mission.",
          tester: {
            codeLabel: "Paste your integration matrix",
            outputLabel: "Paste final check output",
            requiredCodeIncludes: ["validation", "service", "sqlite", "api", "json", "cli"],
            requiredOutputIncludes: ["pytest", "study-tracker", "json", "passed"],
            successMessage: "Your integration capstone proof connects advanced layers to real verification.",
            failureMessage: "The tester needs a layer matrix plus check output for tests and CLI smoke commands."
          },
          runnerSpec: {
            language: "python",
            starterCode: "integration_matrix = []\nverification_commands = []\n\n# Add layers, responsibilities, tests, and final commands.\nprint(integration_matrix)\nprint(verification_commands)",
            visibleTests: [
              {
                id: "integration-capstone-covers-layers",
                name: "Integration capstone covers required layers",
                code: "layers = {item['layer'] for item in integration_matrix}\nassert {'validation', 'service', 'sqlite', 'api', 'json', 'cli'}.issubset(layers)\nassert all(item.get('test') for item in integration_matrix)\nassert 'python -m pytest' in verification_commands\nassert any('study-tracker --input sessions.csv --format json' in command for command in verification_commands)\nprint('pytest study-tracker json passed')",
                expectedOutputIncludes: ["pytest", "study-tracker", "json", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "integration-capstone-has-evidence-for-each-layer",
                name: "Each integration layer has evidence",
                code: "assert all(item.get('evidence') for item in integration_matrix)"
              }
            ],
            expectedOutput: ["pytest", "study-tracker", "json", "passed"]
          }
        },
        pythonIntegrationCapstonePracticeReps
      )
    },
    {
      id: "lesson-python-integration-review",
      moduleId: "module-python-integration",
      slug: "python-integration-review",
      title: "Integration Service Review Gate",
      summary: "Review the final Python path by mapping every integration layer to evidence and selecting one production-readiness improvement.",
      bodyMarkdown: "The final review asks whether the utility is integrated, not merely feature-rich. Each layer should have a responsibility, a test, an artifact, and a known risk.",
      estimatedMinutes: 17,
      difficulty: "portfolio",
      skillIds: ["skill-python-integration", "skill-python-professional", "skill-testing-debugging", "skill-portfolio-evidence"],
      quizId: "quiz-python-integration-review",
      desktopTask: "Create an Integration Service Review with layer evidence for validation, service, SQLite, API, JSON, CLI, and one production-readiness improvement.",
      evidencePrompt: "Record the layer matrix, pytest output, SQLite query output, API client failure proof, CLI JSON output, and one risk/improvement.",
      workshop: workshop(
        "Review the integrated Python utility like a capstone project.",
        "A final review should prove the system hangs together. Each advanced layer must have a purpose, a test, and evidence that it still works with the rest of the project.",
        "An integration review maps layer, responsibility, proof command, artifact, risk, and improvement. Risk means what could still fail even after the happy path works.",
        "Validation has regex tests, service has state tests, SQLite has query output and transaction risk, API has fake-client tests, config has secret boundaries, and CLI has JSON smoke output.",
        "Build the final review matrix and choose one production-readiness improvement.",
        "This is the final review gate for the Python Integration Service mission.",
        "Which layer is most likely to fail in production, and what evidence would warn you early?",
        ["Only proving isolated units with no final smoke command", "No risk column", "No improvement decision after review"],
        {
          language: "Python capstone review",
          tools: ["integration matrix", "pytest", "SQLite output", "API failure output", "CLI JSON output"],
          synopsis: "You are learning to audit an integrated Python utility by connecting each layer to evidence, risk, and improvement. This is a judgment exercise, not just a completion screen.",
          prerequisites: ["Have completed the integration lessons.", "Have final verification commands and artifacts to inspect."],
          testingFocus: "You will test that every integration layer has responsibility, evidence, risk, and an improvement path."
        },
        {
          starterCode: "review = {\n    'layers': [],\n    'commands': [],\n    'artifacts': [],\n    'risk': '',\n    'improvement': '',\n}\nprint(review)",
          expectedOutput: "validation, service, sqlite, api, json, cli, risk, improvement",
          checkYourAnswer: "If your review has no risk, it is not a capstone review. Professional review names what could still fail and what evidence would warn you early."
        },
        {
          title: "Complete the Integration Service Review",
          goal: "Create the final capstone review artifact for the integrated Python utility.",
          steps: ["Map every layer to evidence", "List final check commands", "Inspect one failure path", "Name one risk and one improvement"],
          deliverables: ["Layer evidence matrix", "Final command list", "Failure-path inspection", "Risk and improvement note"],
          verifierCommand: "python -m pytest && sqlite3 tracker.db < schema_and_query.sql && study-tracker --input sessions.csv --format json",
          expectedEvidence: "Final review matrix plus pytest, SQLite, API-client failure, CLI JSON evidence, and a specific risk/improvement decision.",
          projectConnection: "This review gate completes the Python Integration Service path.",
          tester: {
            codeLabel: "Paste your Integration Service Review",
            outputLabel: "Paste final check output",
            requiredCodeIncludes: ["validation", "service", "sqlite", "api", "json", "cli", "risk", "improvement"],
            requiredOutputIncludes: ["validation", "sqlite", "api", "json", "passed"],
            successMessage: "Your integration review proves the final Python path with evidence and judgment.",
            failureMessage: "The tester needs layer evidence, final commands, risk, and one production-readiness improvement."
          },
          runnerSpec: {
            language: "python",
            starterCode: "review = {\n    'layers': [],\n    'commands': [],\n    'artifacts': [],\n    'risk': '',\n    'improvement': '',\n}\nprint(review)",
            visibleTests: [
              {
                id: "integration-review-covers-final-layers",
                name: "Integration review covers final layers and risk",
                code: "layers = {layer['name'] for layer in review['layers']}\nassert {'validation', 'service', 'sqlite', 'api', 'json', 'cli'}.issubset(layers)\nassert all(layer.get('evidence') for layer in review['layers'])\nassert any('python -m pytest' in command for command in review['commands'])\nassert any('study-tracker' in command for command in review['commands'])\nassert len(review['risk']) >= 20\nassert len(review['improvement']) >= 20\nprint('validation sqlite api json passed')",
                expectedOutputIncludes: ["validation", "sqlite", "api", "json", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "integration-review-links-risk-to-layer",
                name: "Integration review links risk to a known layer",
                code: "assert any(layer['name'] in review['risk'] for layer in review['layers'])"
              }
            ],
            expectedOutput: ["validation", "sqlite", "api", "json", "passed"]
          }
        },
        pythonIntegrationReviewPracticeReps
      )
    },
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
      expectedEvidence: "Report note with query, input version, output rows, verifier, limitations, and passing check output.",
      projectConnection: "This closes the Data Quality Report with reproducible evidence.",
      requiredCodeIncludes: ["makeReport", "limitations"],
      requiredOutputIncludes: ["passed"],
      runnerStarterCode: "function makeReport(input) {\n  return { query: '', inputVersion: '', rows: 0, verifier: '', limitations: [] };\n}",
      runnerTestCode: "const report = makeReport({ version: 'events-v1', rows: [{ minutes: 20 }, { minutes: 30 }] });\nif (!report.query || report.inputVersion !== 'events-v1') throw new Error('report needs query and input version');\nif (report.rows !== 2 || !report.verifier) throw new Error('report needs rows and verifier');\nif (!Array.isArray(report.limitations) || report.limitations.length === 0) throw new Error('report needs limitations');\nconsole.log('passed');"
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
        }
      ]
    },
    ...level4Quizzes,
    {
      id: "quiz-python-file-input",
      lessonId: "lesson-python-file-input",
      title: "File input checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-file-1",
          prompt: "Why keep parsing separate from printing?",
          choices: ["So tests can inspect parsed results", "So the script never reads files", "So every error is hidden"],
          correctChoiceIndex: 0,
          explanation: "A parser that returns data can be tested without relying on terminal output."
        },
        {
          id: "question-python-file-2",
          prompt: "What should a beginner script do with a malformed row?",
          choices: ["Crash without context", "Skip or report it clearly", "Silently count it as correct"],
          correctChoiceIndex: 1,
          explanation: "Clear rejection behavior makes the tool safer and easier to debug."
        },
        {
          id: "question-python-file-3",
          prompt: "What is the best signal that a bounds or parsing step succeeded?",
          choices: ["A returned structure with expected fields", "A print statement happened", "The file extension looked right"],
          correctChoiceIndex: 0,
          explanation: "A returned structure can be asserted directly and does not depend on terminal output."
        }
      ]
    },
    {
      id: "quiz-python-parser-tests",
      lessonId: "lesson-python-parser-tests",
      title: "Parser test checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-parser-tests-1",
          prompt: "Why write a malformed-row test?",
          choices: ["To prove bad input fails clearly", "To avoid validation", "To hide bad rows"],
          correctChoiceIndex: 0,
          explanation: "The test proves bad input becomes a clear rejection instead of silent corruption."
        },
        {
          id: "question-python-parser-tests-2",
          prompt: "What should a parser test assert?",
          choices: ["Only that no exception happened", "Specific returned data or rejection reason", "That the terminal is colorful"],
          correctChoiceIndex: 1,
          explanation: "Specific outputs make regressions visible."
        },
        {
          id: "question-python-parser-tests-3",
          prompt: "What evidence should you record after fixing a parser?",
          choices: ["The final passing check output", "Only a vague reflection", "Nothing until deployment"],
          correctChoiceIndex: 0,
          explanation: "Check output connects the project claim to inspectable proof."
        }
      ]
    },
    {
      id: "quiz-python-cli-arguments",
      lessonId: "lesson-python-cli-arguments",
      title: "CLI arguments checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-cli-1",
          prompt: "Why parse command-line arguments instead of editing source code each run?",
          choices: ["So the same script can run with different input", "So tests become impossible", "So every value stays hardcoded"],
          correctChoiceIndex: 0,
          explanation: "Arguments make a script reusable without changing the program itself."
        },
        {
          id: "question-python-cli-2",
          prompt: "Why use argparse's type=int for --minutes?",
          choices: ["So invalid minute text fails at the command boundary", "So the topic disappears", "So the parser skips every argument"],
          correctChoiceIndex: 0,
          explanation: "argparse can convert the value and reject invalid text before the rest of the program calculates totals."
        },
        {
          id: "question-python-cli-3",
          prompt: "What should parse_cli return for internal program logic?",
          choices: ["A useful data structure", "Only printed text", "A hidden global variable"],
          correctChoiceIndex: 0,
          explanation: "Returning a dictionary keeps parsing separate from calculation and output."
        }
      ]
    },
    {
      id: "quiz-python-file-backed-cli",
      lessonId: "lesson-python-file-backed-cli",
      title: "File-backed CLI checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-file-backed-cli-1",
          prompt: "What does --input sessions.csv represent in a real CLI?",
          choices: ["The file path the program should read", "The final hardcoded summary", "The name of the Python language"],
          correctChoiceIndex: 0,
          explanation: "The command-line flag points the program at the data file for that run."
        },
        {
          id: "question-python-file-backed-cli-2",
          prompt: "Why keep CSV reading separate from printing?",
          choices: ["So parsed records can be tested directly", "So files are never used", "So bad rows are hidden"],
          correctChoiceIndex: 0,
          explanation: "A read_sessions function can be tested without depending on terminal output."
        },
        {
          id: "question-python-file-backed-cli-3",
          prompt: "What proves the CLI is not hardcoding the output?",
          choices: ["Changing the selected file changes the calculated summary", "The file name is pretty", "The summary is typed by hand"],
          correctChoiceIndex: 0,
          explanation: "A real file-backed command calculates from the selected input data."
        }
      ]
    },
    {
      id: "quiz-python-cli-polish",
      lessonId: "lesson-python-cli-polish",
      title: "CLI polish checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-cli-polish-1",
          prompt: "Why does --help matter for a portfolio CLI?",
          choices: ["It lets a reviewer discover how to run the tool", "It replaces all tests", "It hides command options"],
          correctChoiceIndex: 0,
          explanation: "A reviewer should be able to learn the command from the tool itself, not from private explanation."
        },
        {
          id: "question-python-cli-polish-2",
          prompt: "What does choices=['text', 'json'] protect?",
          choices: ["The report format boundary", "The file system from every error", "The Python interpreter version"],
          correctChoiceIndex: 0,
          explanation: "choices rejects unsupported formats before report logic receives a bad value."
        },
        {
          id: "question-python-cli-polish-3",
          prompt: "What makes a default useful instead of hidden magic?",
          choices: ["It is documented in help text and tested", "It changes randomly each run", "It only exists in your memory"],
          correctChoiceIndex: 0,
          explanation: "Defaults are helpful when users and tests can see the behavior clearly."
        }
      ]
    },
    {
      id: "quiz-python-output-file",
      lessonId: "lesson-python-output-file",
      title: "Output file checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-output-file-1",
          prompt: "Why add an --output option to a CLI?",
          choices: ["To create an inspectable artifact", "To avoid calculating anything", "To hide the report from reviewers"],
          correctChoiceIndex: 0,
          explanation: "An output file gives a reviewer a durable artifact to inspect after the command runs."
        },
        {
          id: "question-python-output-file-2",
          prompt: "Why keep report formatting separate from file writing?",
          choices: ["So each part can be tested directly", "So the report cannot be saved", "So argparse does all calculations"],
          correctChoiceIndex: 0,
          explanation: "A formatter can be tested for content, and a writer can be tested for the selected path."
        },
        {
          id: "question-python-output-file-3",
          prompt: "What proves --output is not ignored?",
          choices: ["Changing --output changes where the report is saved", "The default path has a nice name", "The terminal is cleared"],
          correctChoiceIndex: 0,
          explanation: "The parsed output path should control the saved artifact location."
        }
      ]
    },
    {
      id: "quiz-python-rejected-row-report",
      lessonId: "lesson-python-rejected-row-report",
      title: "Rejected-row report checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-rejected-row-report-1",
          prompt: "What should a rejected-row record include?",
          choices: ["Row number, raw row, and reason", "Only the word bad", "Only the cleaned rows"],
          correctChoiceIndex: 0,
          explanation: "Those fields tell the user where the problem is, what failed, and why."
        },
        {
          id: "question-python-rejected-row-report-2",
          prompt: "Why keep accepted rows when some rows are bad?",
          choices: ["So clean data can still be processed safely", "So bad data is silently trusted", "So every run must fail"],
          correctChoiceIndex: 0,
          explanation: "A useful cleaner can preserve valid records while reporting rejected ones clearly."
        },
        {
          id: "question-python-rejected-row-report-3",
          prompt: "Why use spreadsheet-style row numbers instead of zero-based indexes in the report?",
          choices: ["Users can find the row more easily", "Python cannot count from zero", "It makes tests unnecessary"],
          correctChoiceIndex: 0,
          explanation: "Reports should match how a person will locate the problem in the source file."
        }
      ]
    },
    {
      id: "quiz-python-portfolio-proof",
      lessonId: "lesson-python-portfolio-proof",
      title: "Portfolio proof checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-proof-1",
          prompt: "What makes a Python script portfolio-ready?",
          choices: ["A clever filename", "README, run command, check output, and known gaps", "Only a completed badge"],
          correctChoiceIndex: 1,
          explanation: "Reviewers need context, commands, proof, and honest scope."
        },
        {
          id: "question-python-proof-2",
          prompt: "Which evidence field is required for passing test proof?",
          choices: ["Check output", "A private memory note", "A project nickname"],
          correctChoiceIndex: 0,
          explanation: "Passing test evidence needs the exact command or output that passed."
        },
        {
          id: "question-python-proof-3",
          prompt: "Why list known gaps?",
          choices: ["It weakens the project", "It shows honest scope and reviewer judgment", "It replaces tests"],
          correctChoiceIndex: 1,
          explanation: "Known gaps make the artifact more trustworthy, not less."
        }
      ]
    },
    {
      id: "quiz-python-project-structure",
      lessonId: "lesson-python-project-structure",
      title: "Project structure checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-project-structure-1",
          prompt: "Why split a Python script into modules?",
          choices: ["To separate responsibilities so changes are easier to review", "To make every file empty", "To avoid testing"],
          correctChoiceIndex: 0,
          explanation: "A clear module boundary keeps CLI, parsing, reporting, and tests from becoming one fragile file."
        },
        {
          id: "question-python-project-structure-2",
          prompt: "Which module should know about argparse?",
          choices: ["cli.py", "parser.py", "tests/test_parser.py"],
          correctChoiceIndex: 0,
          explanation: "The CLI module owns command-line arguments; parser logic should stay reusable without argparse."
        },
        {
          id: "question-python-project-structure-3",
          prompt: "Where should parser tests usually live?",
          choices: ["tests/test_parser.py", "inside the final report string", "only in README prose"],
          correctChoiceIndex: 0,
          explanation: "Tests belong in a test module a reviewer can run with pytest."
        }
      ]
    },
    {
      id: "quiz-python-dataclass-models",
      lessonId: "lesson-python-dataclass-models",
      title: "Dataclass model checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-dataclass-1",
          prompt: "Why use a StudySession dataclass instead of loose dictionaries everywhere?",
          choices: ["It creates one reliable data contract", "It removes the need for fields", "It makes invalid data safe automatically without validation"],
          correctChoiceIndex: 0,
          explanation: "The dataclass names the fields and gives the project one shared session shape."
        },
        {
          id: "question-python-dataclass-2",
          prompt: "What should happen to negative minutes?",
          choices: ["Raise a clear validation error", "Be accepted silently", "Become the topic name"],
          correctChoiceIndex: 0,
          explanation: "A model should reject impossible values before they corrupt reports."
        },
        {
          id: "question-python-dataclass-3",
          prompt: "Where should raw row text become a StudySession?",
          choices: ["In a parser conversion function", "Inside every print statement", "Only in the README"],
          correctChoiceIndex: 0,
          explanation: "A conversion function keeps the boundary from raw input to domain model explicit."
        }
      ]
    },
    {
      id: "quiz-python-json-reports",
      lessonId: "lesson-python-json-reports",
      title: "JSON report checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-json-1",
          prompt: "Why offer JSON output from a CLI?",
          choices: ["So other tools and tests can read stable fields", "So humans can never read output", "So field names change each run"],
          correctChoiceIndex: 0,
          explanation: "Machine-readable output makes automation and precise assertions possible."
        },
        {
          id: "question-python-json-2",
          prompt: "How should a test inspect JSON output?",
          choices: ["Parse it and assert fields", "Only check the first character", "Count terminal colors"],
          correctChoiceIndex: 0,
          explanation: "Parsing JSON proves the output is valid and that field values match expectations."
        },
        {
          id: "question-python-json-3",
          prompt: "What makes JSON fields a contract?",
          choices: ["Other code can depend on those names and value types", "They are impossible to test", "They only work in comments"],
          correctChoiceIndex: 0,
          explanation: "Stable field names and types let other tools consume the report safely."
        }
      ]
    },
    {
      id: "quiz-python-logging-errors",
      lessonId: "lesson-python-logging-errors",
      title: "Logging and errors checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-logging-1",
          prompt: "Why define TrackerInputError?",
          choices: ["To name expected input failures clearly", "To hide all failures", "To replace every test"],
          correctChoiceIndex: 0,
          explanation: "A project-specific exception distinguishes user-input problems from generic crashes."
        },
        {
          id: "question-python-logging-2",
          prompt: "What should a log message preserve?",
          choices: ["Useful context such as the bad value", "Only the word error", "Secrets and private data"],
          correctChoiceIndex: 0,
          explanation: "Logs should help diagnose the failure without hiding the value that caused it."
        },
        {
          id: "question-python-logging-3",
          prompt: "Why not return 0 for invalid minutes?",
          choices: ["It silently corrupts the data", "It makes the tracker professional", "It proves the row was valid"],
          correctChoiceIndex: 0,
          explanation: "Returning fake data makes bad input look successful."
        }
      ]
    },
    {
      id: "quiz-python-pytest-ci",
      lessonId: "lesson-python-pytest-ci",
      title: "Pytest and CI proof checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-pytest-ci-1",
          prompt: "Why document exact verification commands?",
          choices: ["So a reviewer can reproduce the proof", "So tests can be skipped", "So commands become secret"],
          correctChoiceIndex: 0,
          explanation: "Repeatable commands turn project claims into evidence."
        },
        {
          id: "question-python-pytest-ci-2",
          prompt: "Why use fixtures for clean and messy rows?",
          choices: ["They make repeated tests consistent", "They remove bad input from the project", "They replace parser logic"],
          correctChoiceIndex: 0,
          explanation: "Fixtures keep test inputs reusable and clear across behavior tests."
        },
        {
          id: "question-python-pytest-ci-3",
          prompt: "What should a CLI smoke command prove?",
          choices: ["The packaged command still runs end to end", "Only that a variable exists", "That pytest is installed but unused"],
          correctChoiceIndex: 0,
          explanation: "A smoke command catches integration problems unit tests may miss."
        }
      ]
    },
    {
      id: "quiz-python-pyproject-metadata",
      lessonId: "lesson-python-pyproject-metadata",
      title: "pyproject metadata checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-pyproject-1",
          prompt: "Why does pyproject.toml matter in a professional Python project?",
          choices: ["It gives tools and reviewers project metadata", "It replaces all source code", "It hides the test folder"],
          correctChoiceIndex: 0,
          explanation: "pyproject.toml declares project metadata and tool configuration in a standard place."
        },
        {
          id: "question-python-pyproject-2",
          prompt: "Where should pytest test discovery settings live if you want tools to read them?",
          choices: ["In pyproject.toml tool configuration", "Only in a private note", "Only in a screenshot"],
          correctChoiceIndex: 0,
          explanation: "Tool configuration belongs where tools can load it repeatably."
        },
        {
          id: "question-python-pyproject-3",
          prompt: "What does requires-python communicate?",
          choices: ["The Python versions the project expects", "The number of screenshots needed", "The user's favorite editor"],
          correctChoiceIndex: 0,
          explanation: "It helps installers and reviewers know the supported Python version range."
        }
      ]
    },
    {
      id: "quiz-python-installable-cli",
      lessonId: "lesson-python-installable-cli",
      title: "Installable CLI checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-installable-cli-1",
          prompt: "What does [project.scripts] define?",
          choices: ["Installed command entry points", "The test assertion count", "The raw CSV rows"],
          correctChoiceIndex: 0,
          explanation: "It maps command names to Python functions that should run when the command is invoked."
        },
        {
          id: "question-python-installable-cli-2",
          prompt: "Why point study-tracker to study_tracker.cli:main?",
          choices: ["So the installed command calls a stable package entrypoint", "So parser tests are deleted", "So JSON cannot be output"],
          correctChoiceIndex: 0,
          explanation: "A stable entrypoint lets the package expose a command without relying on a script path."
        },
        {
          id: "question-python-installable-cli-3",
          prompt: "What does a CLI smoke test prove?",
          choices: ["The installed command starts and responds", "Only that a dictionary exists", "That packaging never needs testing"],
          correctChoiceIndex: 0,
          explanation: "Smoke tests catch broken entry points and packaging issues."
        }
      ]
    },
    {
      id: "quiz-python-config-files",
      lessonId: "lesson-python-config-files",
      title: "Config files checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-config-1",
          prompt: "Why merge config files with defaults?",
          choices: ["So missing config values still behave predictably", "So defaults disappear", "So unknown keys change anything"],
          correctChoiceIndex: 0,
          explanation: "Defaults make behavior explicit even when a config file omits some options."
        },
        {
          id: "question-python-config-2",
          prompt: "What should happen to unknown config keys in a beginner professional utility?",
          choices: ["Ignore or reject them deliberately", "Let them silently change behavior", "Treat them as tests"],
          correctChoiceIndex: 0,
          explanation: "Unknown keys should not create surprising behavior."
        },
        {
          id: "question-python-config-3",
          prompt: "What makes configuration less confusing?",
          choices: ["Explicit defaults and tested merge rules", "Hidden behavior in memory", "Random values each run"],
          correctChoiceIndex: 0,
          explanation: "Users and reviewers can reason about config when the merge behavior is visible and tested."
        }
      ]
    },
    {
      id: "quiz-python-ci-precommit",
      lessonId: "lesson-python-ci-precommit",
      title: "CI and pre-commit checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-ci-precommit-1",
          prompt: "What should pre-commit catch?",
          choices: ["Local quality issues before review", "Only production deploys", "The user's calendar"],
          correctChoiceIndex: 0,
          explanation: "Pre-commit gives fast local feedback before code reaches review."
        },
        {
          id: "question-python-ci-precommit-2",
          prompt: "Why run tests again in CI?",
          choices: ["To prove checks pass in a clean repeatable environment", "To avoid local verification", "To hide failing tests"],
          correctChoiceIndex: 0,
          explanation: "CI catches environment and integration problems that local-only checks can miss."
        },
        {
          id: "question-python-ci-precommit-3",
          prompt: "Why include an installed CLI smoke command in CI?",
          choices: ["To catch broken packaging or entry points", "To replace all unit tests", "To skip help output"],
          correctChoiceIndex: 0,
          explanation: "The installed command can break even when internal unit tests still pass."
        }
      ]
    },
    {
      id: "quiz-python-regex-validation",
      lessonId: "lesson-python-regex-validation",
      title: "Regex validation checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-regex-1",
          prompt: "When is regex a good fit in a parser?",
          choices: ["For focused text-shape validation", "For hiding all business logic", "For replacing every test"],
          correctChoiceIndex: 0,
          explanation: "Regex is strongest when it checks a clear text pattern and leaves other logic readable."
        },
        {
          id: "question-python-regex-2",
          prompt: "Why use anchors or fullmatch for validation?",
          choices: ["So the whole value must match", "So partial bad strings pass", "So regex ignores the input"],
          correctChoiceIndex: 0,
          explanation: "Validation should reject strings that only contain a valid-looking substring."
        },
        {
          id: "question-python-regex-3",
          prompt: "What should regex date validation avoid claiming?",
          choices: ["That it fully proves calendar correctness", "That the shape is wrong", "That tests are useful"],
          correctChoiceIndex: 0,
          explanation: "A simple regex can prove YYYY-MM-DD shape, but not every real calendar rule."
        }
      ]
    },
    {
      id: "quiz-python-oop-service",
      lessonId: "lesson-python-oop-service",
      title: "OOP service checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-oop-1",
          prompt: "When does a class help in this tracker project?",
          choices: ["When state and behavior belong together", "Whenever a file gets long", "When tests should be avoided"],
          correctChoiceIndex: 0,
          explanation: "A service class is useful when it owns session state and exposes clear methods."
        },
        {
          id: "question-python-oop-2",
          prompt: "What is the risk of a class-level sessions list?",
          choices: ["Instances can accidentally share state", "Methods stop existing", "Python cannot add numbers"],
          correctChoiceIndex: 0,
          explanation: "Mutable class-level state can leak data between instances."
        },
        {
          id: "question-python-oop-3",
          prompt: "What should a service method expose?",
          choices: ["A clear operation like total_minutes", "Every internal list directly", "Only print statements"],
          correctChoiceIndex: 0,
          explanation: "Methods should provide behavior while keeping internal state controlled."
        }
      ]
    },
    {
      id: "quiz-python-sqlite-persistence",
      lessonId: "lesson-python-sqlite-persistence",
      title: "SQLite persistence checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-sqlite-1",
          prompt: "Why add SQLite to a local Python utility?",
          choices: ["To persist structured data between runs", "To make all data disappear", "To avoid schemas"],
          correctChoiceIndex: 0,
          explanation: "SQLite gives small local tools durable structured storage without a server."
        },
        {
          id: "question-python-sqlite-2",
          prompt: "Why query totals with GROUP BY topic?",
          choices: ["So the database calculates totals per topic", "So every row is deleted", "So topics become file names"],
          correctChoiceIndex: 0,
          explanation: "GROUP BY lets SQL aggregate rows by a useful field."
        },
        {
          id: "question-python-sqlite-3",
          prompt: "What should usually be stored instead of calculated totals?",
          choices: ["Raw session rows", "Only the final total", "Only terminal output"],
          correctChoiceIndex: 0,
          explanation: "Raw durable rows let the project recalculate reports as requirements change."
        }
      ]
    },
    {
      id: "quiz-python-api-client",
      lessonId: "lesson-python-api-client",
      title: "API client checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-api-1",
          prompt: "Why keep API code at a boundary?",
          choices: ["So raw network responses are validated before the app trusts them", "So every module performs HTTP calls", "So status codes are ignored"],
          correctChoiceIndex: 0,
          explanation: "The rest of the program should receive checked data, not raw untrusted responses."
        },
        {
          id: "question-python-api-2",
          prompt: "What should happen on a non-200 API response?",
          choices: ["Raise a clear API error", "Pretend the response is empty success", "Silently write JSON"],
          correctChoiceIndex: 0,
          explanation: "Bad status should be a visible failure path."
        },
        {
          id: "question-python-api-3",
          prompt: "Why test API clients with fake clients?",
          choices: ["To prove behavior without live network dependence", "To skip validation", "To make the timeout invisible"],
          correctChoiceIndex: 0,
          explanation: "Fakes let you test success and failure paths deterministically."
        }
      ]
    },
    {
      id: "quiz-python-integration-capstone",
      lessonId: "lesson-python-integration-capstone",
      title: "Integration capstone checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-integration-1",
          prompt: "What should an integration matrix connect?",
          choices: ["Layer, responsibility, test, and evidence", "Only screenshots", "Only topic names"],
          correctChoiceIndex: 0,
          explanation: "A matrix makes every layer inspectable and testable."
        },
        {
          id: "question-python-integration-2",
          prompt: "Why keep unit tests and CLI smoke tests?",
          choices: ["They prove different levels of behavior", "They are duplicates with no purpose", "They replace project structure"],
          correctChoiceIndex: 0,
          explanation: "Unit tests isolate behavior; smoke tests prove the installed flow still works."
        },
        {
          id: "question-python-integration-3",
          prompt: "What is the strongest final evidence for the integrated utility?",
          choices: ["Passing tests plus CLI output artifacts", "A vague completion note", "A hidden local variable"],
          correctChoiceIndex: 0,
          explanation: "Reviewers need repeatable commands and inspectable outputs."
        }
      ]
    },
    {
      id: "quiz-python-core-review",
      lessonId: "lesson-python-core-review",
      title: "Core review checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-core-review-1",
          prompt: "What must a review gate prove beyond lesson completion?",
          choices: ["Architecture, command evidence, failure inspection, and improvement", "Only that buttons were tapped", "Only that syntax terms were memorized"],
          correctChoiceIndex: 0,
          explanation: "A review gate asks for judgment and evidence, not passive completion."
        },
        {
          id: "question-python-core-review-2",
          prompt: "Why include a failure case in the core review?",
          choices: ["It proves the learner understands behavior under stress", "It makes the happy path irrelevant", "It hides bad input"],
          correctChoiceIndex: 0,
          explanation: "Failure cases reveal whether the project is trustworthy when input is messy."
        },
        {
          id: "question-python-core-review-3",
          prompt: "What makes an improvement note strong?",
          choices: ["It names a specific weak part and reason", "It says everything is perfect", "It avoids mentioning the project"],
          correctChoiceIndex: 0,
          explanation: "A specific improvement shows the learner can evaluate the project, not just finish it."
        }
      ]
    },
    {
      id: "quiz-python-professional-review",
      lessonId: "lesson-python-professional-review",
      title: "Professional review checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-professional-review-1",
          prompt: "What should a professional review matrix connect?",
          choices: ["Quality area and concrete evidence", "Only lesson titles", "Only screenshots"],
          correctChoiceIndex: 0,
          explanation: "Each quality area should have an artifact or command that proves it."
        },
        {
          id: "question-python-professional-review-2",
          prompt: "Why include installed CLI evidence?",
          choices: ["It proves package entry points work", "It replaces all parser tests", "It hides pyproject metadata"],
          correctChoiceIndex: 0,
          explanation: "A package can have passing internals while the installed command is broken."
        },
        {
          id: "question-python-professional-review-3",
          prompt: "What is weak review evidence?",
          choices: ["A claim with no command or artifact", "Pytest output", "A pyproject excerpt"],
          correctChoiceIndex: 0,
          explanation: "Review evidence needs something inspectable."
        }
      ]
    },
    {
      id: "quiz-python-integration-review",
      lessonId: "lesson-python-integration-review",
      title: "Integration review checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-integration-review-1",
          prompt: "What makes an integration review different from unit-test review?",
          choices: ["It connects layers, artifacts, risks, and final commands", "It ignores the final CLI", "It only checks one function"],
          correctChoiceIndex: 0,
          explanation: "Integration review asks whether the layers work together and where risk remains."
        },
        {
          id: "question-python-integration-review-2",
          prompt: "Why include a risk column?",
          choices: ["Professional review names what could still fail", "It makes tests unnecessary", "It hides uncertainty"],
          correctChoiceIndex: 0,
          explanation: "Risk naming turns uncertainty into a concrete next improvement."
        },
        {
          id: "question-python-integration-review-3",
          prompt: "What is the strongest final review evidence?",
          choices: ["Layer matrix plus passing commands and artifacts", "A badge with no command", "A vague summary"],
          correctChoiceIndex: 0,
          explanation: "A final review should combine architecture judgment and reproducible evidence."
        }
      ]
    },
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
          choices: ["A next state value", "A hidden global variable", "Only console output"],
          correctChoiceIndex: 0,
          explanation: "Reducers are easiest to test when they return the next state as data."
        },
        {
          id: "question-typescript-events-3",
          prompt: "Why avoid mutating the original state array?",
          choices: ["It keeps previous state inspectable and updates predictable", "It makes TypeScript ignore errors", "It deletes old tests"],
          correctChoiceIndex: 0,
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
          choices: ["To reject values outside the allowed set", "To make every value text", "To avoid all queries"],
          correctChoiceIndex: 0,
          explanation: "A CHECK constraint can prevent misspelled or unsupported states from entering the table."
        },
        {
          id: "question-sql-constraints-3",
          prompt: "Why test a rejected row?",
          choices: ["To prove the schema blocks bad data", "To hide the failure", "To remove valid inserts"],
          correctChoiceIndex: 0,
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
          choices: ["Verification result and risk boundary", "Only marketing language", "A hidden checklist"],
          correctChoiceIndex: 0,
          explanation: "Reviewers need exact evidence and a clear statement of what was not touched."
        },
        {
          id: "question-github-review-3",
          prompt: "Why keep commits focused?",
          choices: ["So reviewers can understand and revert them more easily", "So every file changes at once", "So verification becomes optional"],
          correctChoiceIndex: 0,
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
          choices: ["To show the risk decision and preserve judgment", "To make the accepted code fail", "To hide what changed"],
          correctChoiceIndex: 0,
          explanation: "Rejected suggestions reveal scope control and the reasons behind the final edit."
        },
        {
          id: "question-ai-diff-3",
          prompt: "Which AI suggestion should raise extra risk?",
          choices: ["A package or schema change outside the task", "A typo fix with a passing test", "A clearer variable name inside one function"],
          correctChoiceIndex: 0,
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
          choices: ["Return uncertainty or reject the claim", "Invent a confident answer", "Cite any random note"],
          correctChoiceIndex: 0,
          explanation: "Unsupported answers should fail closed instead of pretending a source exists."
        },
        {
          id: "question-ai-retrieval-3",
          prompt: "Why check citation ids?",
          choices: ["To prove claims map back to retrieved evidence", "To remove all local notes", "To skip evaluation"],
          correctChoiceIndex: 0,
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
          choices: ["It shows the kinds of errors the model made", "It hides class imbalance", "It removes sample-size concerns"],
          correctChoiceIndex: 0,
          explanation: "The matrix exposes false positives and false negatives that accuracy can hide."
        },
        {
          id: "question-ml-confusion-3",
          prompt: "What should a tiny confusion matrix include in its interpretation?",
          choices: ["A sample-size limitation", "A production guarantee", "A claim that no more tests are needed"],
          correctChoiceIndex: 0,
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
      }
    ]
  }
};
