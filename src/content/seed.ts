import type { ContentPack, LessonMiniProject, LessonMiniProjectTester, LessonPracticeBlock, LessonRunnerSpec, LessonWorkshop, MissionEvidenceRequirements, ProjectMissionPhase, RunnerLanguage } from "@/domain/types";

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
        id: "visible-proof",
        name: "Visible proof check",
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
    outputLabel: "Terminal output or verifier result",
    requiredCodeIncludes: [],
    requiredOutputIncludes: ["passed"],
    forbiddenOutputIncludes: ["traceback", "exception", "syntaxerror", "error:", "failed"],
    successMessage: "Mini-project proof passed. The lesson can count this hands-on work.",
    failureMessage: "The tester needs code/artifact proof plus clean verifier output before this can be marked done."
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
      title: "Plan the proof",
      goal: `Define the smallest useful version of ${buildTarget}.`,
      tasks: ["Write the user story", "List the data contract", "Name the verifier before building"]
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
      goal: `Prove ${buildTarget} works with ${verifier}.`,
      tasks: ["Run the verifier", "Capture exact output", `Write the ${polishTarget}`]
    }
  ];
}

function lowerFirst(value: string): string {
  return value.length === 0 ? value : `${value[0]?.toLowerCase()}${value.slice(1)}`;
}

function professorSynopsis(synopsis: string, objective: string, projectGoal: string): string {
  return `Start here: ${synopsis} By the end, you will be able to ${lowerFirst(objective)} You will prove it by creating this proof: ${lowerFirst(projectGoal)}`;
}

function professorTestingFocus(testingFocus: string): string {
  return `What the verifier checks: ${testingFocus} If the sandbox prints passed, that means the verifier confirmed the result; it is usually not a word you type yourself.`;
}

function professorCoreConcept(coreConcept: string): string {
  return `Plain-English concept: ${coreConcept}`;
}

function professorGuidedExercise(guidedExercise: string): string {
  return `First do this: ${lowerFirst(guidedExercise)} Work one line at a time, run the code, then compare the result with the expected output.`;
}

function professorReflectionPrompt(reflectionPrompt: string): string {
  return `${reflectionPrompt} A strong answer names the decision you made, the evidence you used, and one remaining uncertainty.`;
}

function workshop(
  objective: string,
  whyItMatters: string,
  coreConcept: string,
  workedExample: string,
  guidedExercise: string,
  missionConnection: string,
  reflectionPrompt: string,
  commonMistakes = ["Skipping the failure case", "Recording completion without verifier output"],
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
    title: "Lesson proof slice",
    goal: "Turn the lesson idea into one small artifact you can inspect.",
    steps: ["Build the smallest working version", "Run one verifier or manual check", "Write what the result proves"],
    deliverables: ["Working artifact", "Verifier result", "Short reflection"],
    verifierCommand: "Run the smallest command or check that proves the artifact works.",
    expectedEvidence: "A note with the artifact path, result, and one limitation.",
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
    guidedExercise: professorGuidedExercise(guidedExercise),
    missionConnection,
    reflectionPrompt: professorReflectionPrompt(reflectionPrompt)
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
    { fromSkillId: "skill-sql-joins", toSkillId: "skill-api-contracts", relationType: "supports" }
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
    }
  ],
  modules: [
    {
      id: "module-python-core",
      trackId: "track-python",
      slug: "python-core",
      title: "Python Core Proof",
      summary: "Beginner syntax, debugging, text cleanup, functions, files, tests, and a testable command-line utility.",
      lessonIds: ["lesson-python-values", "lesson-python-collections", "lesson-python-decisions", "lesson-python-loops", "lesson-python-foundation-capstone", "lesson-python-strings-cleanup", "lesson-python-functions", "lesson-python-traceback-clinic", "lesson-python-file-input", "lesson-python-parser-tests", "lesson-python-cli-arguments", "lesson-python-file-backed-cli", "lesson-python-cli-polish", "lesson-python-output-file", "lesson-python-rejected-row-report", "lesson-python-portfolio-proof", "lesson-python-core-review"],
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
      lessonIds: ["lesson-typescript-contracts", "lesson-typescript-events-state"],
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
    }
  ],
  lessons: [
    {
      id: "lesson-python-values",
      moduleId: "module-python-core",
      slug: "python-values",
      title: "Names, Values, and First Output",
      summary: "Start Python by naming simple values and producing one inspectable result.",
      bodyMarkdown: "Python programs begin with values: text, numbers, and true or false facts. A variable name is a label for one of those values, so a reader can understand the program without guessing.",
      estimatedMinutes: 7,
      difficulty: "foundation",
      skillIds: ["skill-python-basics", "skill-testing-debugging"],
      quizId: "quiz-python-values",
      desktopTask: "Create a tiny Python file that stores one study session as named values and prints a summary.",
      evidencePrompt: "Record the file path, the final output, and which value you changed to make the output correct.",
      workshop: workshop(
        "Name simple Python values and combine them into one readable output string.",
        "Every later Python project depends on seeing data clearly before it is wrapped in functions, files, or tests.",
        "A variable stores a value under a useful name. Strings represent text, integers represent whole numbers, and booleans represent true or false facts.",
        "topic = 'python' and minutes = 30 let the script print readable lines. completed = False means the session is still planned, so the summary shows planned instead of the raw value False.",
        "Create three variables for one study session, change the starter minutes value to 30, then build one summary string from those values.",
        "This is the first slice of the CLI Study Tracker: one session that a learner and a test can inspect.",
        "Which variable name made the program easier to read, and which value would you change to describe a different session?",
        ["Treating the variable name as the value itself", "Putting quotes around numbers that should be counted", "Printing a result without checking that it uses the variables"],
        {
          language: "Python",
          tools: ["Python 3", "terminal", "print output"],
          synopsis: "You are learning the smallest useful Python move: give values clear names, then combine those values into output you can inspect.",
          prerequisites: ["Know that Python code can run from a .py file.", "Be ready to edit one line and run the file again."],
          testingFocus: "The tests check that topic, minutes, and completed exist with the required values, and that your printed summary matches the expected output. The final passed line is the verifier result, not another variable you need to create.",
          codeShape: [
            "name = value",
            "summary = f\"{name}\\n{another_value}\\nreadable_word\"",
            "print(summary)",
            "",
            "# In this lesson, your next line is:",
            "summary = f\"{topic}\\n{minutes}\\nplanned\""
          ].join("\n")
        },
        {
          starterCode: "topic = \"python\"\nminutes = 0\ncompleted = False\n\n# Change minutes to 30.\n# Then build the required summary using the values above.\nsummary = \"\"\nprint(summary)",
          expectedOutput: "python\n30\nplanned\n\nVerifier then prints: passed",
          checkYourAnswer: "Check three things: minutes should be the number 30, summary should not stay empty, and each required value should print on its own line."
        },
        {
          title: "Build one study-session summary",
          goal: "Create the first study-tracker slice by storing one session as named Python values and printing a readable summary.",
          steps: ["Keep topic set to python", "Change minutes from 0 to the number 30", "Keep completed as the boolean False", "Build summary from the variables and print python, 30, and planned on separate lines"],
          deliverables: ["Python file with named values", "Printed summary output", "One note explaining why completed = False maps to the readable word planned"],
          verifierCommand: "python study_session.py",
          expectedEvidence: "Terminal output showing python, 30, planned, and the verifier's passed line plus a short note identifying the string, number, and boolean values.",
          projectConnection: "This gives the CLI Study Tracker its first data point before sessions become lists and files.",
          tester: {
            codeLabel: "Paste your Python values and summary",
            outputLabel: "Paste the terminal output",
            requiredCodeIncludes: ["topic", "minutes", "completed", "summary"],
            requiredOutputIncludes: ["python", "30", "planned"],
            successMessage: "Your first Python proof uses named values and produces an inspectable result.",
            failureMessage: "The tester needs the named values plus output showing python, 30, and planned."
          },
          runnerSpec: {
            language: "python",
            starterCode: "topic = \"python\"\nminutes = 0\ncompleted = False\n\n# Change minutes to 30.\n# Then build the required summary using the values above.\nsummary = \"\"\nprint(summary)",
            visibleTests: [
              {
                id: "values-build-summary",
                name: "Values build the required summary",
                code: [
                  "assert topic == 'python', 'topic should stay \"python\".'",
                  "assert minutes == 30, 'Change minutes from 0 to the number 30, not the string \"30\".'",
                  "assert completed is False, 'completed should stay the boolean False. That means the session is still planned.'",
                  "assert isinstance(minutes, int), 'minutes must be a number so later lessons can add study time.'",
                  "assert isinstance(completed, bool), 'completed must be a boolean, not the word \"planned\".'",
                  "assert summary == 'python\\n30\\nplanned', 'Build summary so it prints python, 30, and planned on separate lines.'",
                  "print('passed')"
                ].join("\n"),
                expectedOutputIncludes: ["python", "30", "planned", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "values-have-right-types",
                name: "Values use beginner-friendly types",
                code: "assert isinstance(topic, str)\nassert isinstance(minutes, int)\nassert isinstance(completed, bool)\nassert str(minutes) in summary"
              }
            ],
            expectedOutput: ["python", "30", "planned", "passed"]
          }
        },
        pythonValuePracticeReps
      )
    },
    {
      id: "lesson-python-collections",
      moduleId: "module-python-core",
      slug: "python-collections",
      title: "Lists and Dictionaries Hold Real Records",
      summary: "Use a list of dictionaries so Python can hold more than one study session.",
      bodyMarkdown: "A list keeps items in order. A dictionary names the parts of one item. Together, they let a beginner script hold real records instead of one loose pile of variables.",
      estimatedMinutes: 8,
      difficulty: "foundation",
      skillIds: ["skill-python-basics", "skill-testing-debugging"],
      quizId: "quiz-python-collections",
      desktopTask: "Represent two study sessions as a list of dictionaries and print the second topic.",
      evidencePrompt: "Record the data structure, output, and one field name that every record should share.",
      workshop: workshop(
        "Represent two related study sessions with a list of dictionaries.",
        "Real scripts rarely work with one value at a time. They need a shape that can hold repeated records consistently.",
        "A record is one complete item of information. In Python, a dictionary can represent one study-session record with named keys such as topic and minutes. A list stores several records in order so the same code can work with all of them.",
        "sessions = [{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}] keeps two records in one variable.",
        "Add a second study-session dictionary to a sessions list, then print the second session's topic.",
        "This prepares the CLI Study Tracker to hold a week of sessions instead of one hardcoded line.",
        "Which keys should every session share, and what would break if one record used name instead of topic?",
        ["Using different keys for the same idea", "Making many separate variables instead of one list", "Putting every value into one long string"],
        {
          language: "Python",
          tools: ["Python 3", "terminal", "lists and dictionaries"],
          synopsis: "You are learning how Python holds repeated records. A record is one study session, and repeated records are what let the tracker move beyond one hardcoded example.",
          prerequisites: ["Know that a variable can store a value.", "Know that strings use quotes and numbers usually do not."],
          testingFocus: "You will test that the sessions value is a list, that it contains two dictionaries, and that both records use the same beginner-friendly keys: topic and minutes.",
          codeShape: [
            "records = [",
            "    {\"field\": \"text value\", \"number_field\": 30},",
            "    {\"field\": \"another text value\", \"number_field\": 15},",
            "]",
            "",
            "# To read one value later:",
            "second_topic = sessions[1][\"topic\"]",
            "print(second_topic)"
          ].join("\n")
        },
        {
          starterCode: "sessions = [\n    {\"topic\": \"python\", \"minutes\": 30}\n]\n\n# Add a git session with 15 minutes.\nprint(sessions)",
          expectedOutput: "[{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}]",
          checkYourAnswer: "The output should show square brackets for the list and curly braces for each dictionary. If the second record is missing, check whether it was added inside the list brackets."
        },
        {
          title: "Build a two-session record list",
          goal: "Create a Python list that stores two study-session dictionaries with consistent field names.",
          steps: ["Keep the first python session", "Add a second git session with 15 minutes", "Print the second topic from the list"],
          deliverables: ["List with two dictionaries", "Output showing git as the second topic", "One sentence naming the shared keys"],
          verifierCommand: "python sessions_list.py",
          expectedEvidence: "Terminal output showing both records and the second topic, plus a note that topic and minutes are shared keys.",
          projectConnection: "This becomes the in-memory data shape that later functions, files, and tests will reuse.",
          tester: {
            codeLabel: "Paste your sessions list",
            outputLabel: "Paste the terminal output",
            requiredCodeIncludes: ["sessions", "topic", "minutes", "git"],
            requiredOutputIncludes: ["python", "git", "records"],
            successMessage: "Your collection proof stores repeated records with a consistent shape.",
            failureMessage: "The tester needs a sessions list with python and git records plus output proving the shape."
          },
          runnerSpec: {
            language: "python",
            starterCode: "sessions = [\n    {\"topic\": \"python\", \"minutes\": 30}\n]\n\n# Add a git session with 15 minutes, then print a proof line.\nprint(sessions)",
            visibleTests: [
              {
                id: "sessions-have-two-records",
                name: "Sessions include two consistent records",
                code: "assert isinstance(sessions, list)\nassert len(sessions) == 2\nassert sessions[0] == {'topic': 'python', 'minutes': 30}\nassert sessions[1] == {'topic': 'git', 'minutes': 15}\nprint('python git records passed')",
                expectedOutputIncludes: ["python", "git", "records", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "sessions-share-required-keys",
                name: "Every session has topic and minutes",
                code: "assert all(isinstance(session, dict) for session in sessions)\nassert all('topic' in session and 'minutes' in session for session in sessions)\nassert all(isinstance(session['minutes'], int) for session in sessions)"
              }
            ],
            expectedOutput: ["python", "git", "records", "passed"]
          }
        },
        pythonCollectionPracticeReps
      )
    },
    {
      id: "lesson-python-decisions",
      moduleId: "module-python-core",
      slug: "python-decisions",
      title: "Decisions Make Scripts Useful",
      summary: "Use if and else so Python can label a session based on its minutes.",
      bodyMarkdown: "An if statement lets a program choose between paths. That is how a script stops being a fixed demonstration and starts responding to the data it receives.",
      estimatedMinutes: 8,
      difficulty: "foundation",
      skillIds: ["skill-python-basics", "skill-testing-debugging"],
      quizId: "quiz-python-decisions",
      desktopTask: "Write an if/else that labels a 30-minute session as focus and a shorter one as quick.",
      evidencePrompt: "Record the condition you used, the output, and one example that should take the other branch.",
      workshop: workshop(
        "Write an if/else decision that labels a study session from its minutes.",
        "Useful tools make decisions: accept or reject input, mark work complete or incomplete, and choose the right message for the user.",
        "A condition is a true-or-false question written in code, such as minutes >= 30. The if block is the indented code Python runs when the answer is true. The else block is the indented code Python runs when the answer is false.",
        "if minutes >= 30: label = 'focus' else: label = 'quick' turns a number into a meaningful category.",
        "Use minutes to assign label, then print a sentence that includes the label.",
        "This prepares the CLI Study Tracker to explain sessions instead of only storing raw numbers.",
        "What exact question does your condition ask, and what value would make the else branch run?",
        ["Writing the condition in English instead of Python", "Using = when the decision needs comparison", "Only checking the branch that already worked"],
        {
          language: "Python",
          tools: ["Python 3", "terminal", "if/else"],
          synopsis: "You are learning how Python chooses between two paths, which is the heart of validation and helpful user feedback.",
          prerequisites: ["Know how to store a number in a variable.", "Know how to run a Python file and inspect printed output."],
          testingFocus: "You will test that 30 minutes becomes the text label focus, and you will explain which shorter value would make the else branch choose quick.",
          codeShape: [
            "if true_or_false_question:",
            "    value = \"first choice\"",
            "else:",
            "    value = \"second choice\"",
            "",
            "# In this lesson, the question is minutes >= 30:",
            "if minutes >= 30:",
            "    label = \"focus\"",
            "else:",
            "    label = \"quick\""
          ].join("\n")
        },
        {
          starterCode: "minutes = 30\nlabel = \"\"\n\n# If minutes is 30 or more, label should be focus. Otherwise it should be quick.\nprint(label)",
          expectedOutput: "focus session planned",
          checkYourAnswer: "If the output is blank, your if/else did not assign label. If it says quick for 30 minutes, read minutes >= 30 as a question: is 30 greater than or equal to 30?"
        },
        {
          title: "Label a study session",
          goal: "Create a Python decision that labels a study session as focus when it is 30 minutes or longer.",
          steps: ["Create a minutes variable set to 30", "Use if/else to assign focus or quick", "Print a proof line that includes the label"],
          deliverables: ["Python if/else code", "Output showing focus session planned", "One note describing the shorter-session branch"],
          verifierCommand: "python session_label.py",
          expectedEvidence: "Terminal output showing focus session planned plus a note explaining which minutes value would produce quick.",
          projectConnection: "This becomes the first rule the tracker can use to explain study quality, not just duration.",
          tester: {
            codeLabel: "Paste your if/else code",
            outputLabel: "Paste the terminal output",
            requiredCodeIncludes: ["if", "else", "minutes", "label"],
            requiredOutputIncludes: ["focus", "session", "planned"],
            successMessage: "Your decision proof turns raw minutes into a meaningful label.",
            failureMessage: "The tester needs an if/else decision plus output showing focus session planned."
          },
          runnerSpec: {
            language: "python",
            starterCode: "minutes = 30\nlabel = \"\"\n\n# If minutes is 30 or more, label should be focus. Otherwise it should be quick.\nprint(label)",
            visibleTests: [
              {
                id: "minutes-produce-focus-label",
                name: "Minutes produce the focus label",
                code: "assert minutes == 30\nassert label == 'focus'\nprint('focus session planned passed')",
                expectedOutputIncludes: ["focus", "session", "planned", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "label-is-a-known-category",
                name: "Label stays in the expected categories",
                code: "assert label in {'focus', 'quick'}\nassert isinstance(label, str)"
              }
            ],
            expectedOutput: ["focus", "session", "planned", "passed"]
          }
        },
        pythonDecisionPracticeReps
      )
    },
    {
      id: "lesson-python-loops",
      moduleId: "module-python-core",
      slug: "python-loops",
      title: "Loops Turn Records Into Totals",
      summary: "Use a for loop to add study minutes across multiple session records.",
      bodyMarkdown: "A loop repeats the same careful action for each item. Once study sessions live in a list, a loop is how Python can inspect every record without copy-pasting code.",
      estimatedMinutes: 9,
      difficulty: "foundation",
      skillIds: ["skill-python-basics", "skill-testing-debugging"],
      quizId: "quiz-python-loops",
      desktopTask: "Loop over two study-session dictionaries and calculate total minutes.",
      evidencePrompt: "Record the loop code, the total output, and one reason the loop is safer than adding values by hand.",
      workshop: workshop(
        "Use a for loop to total minutes from a list of study-session dictionaries.",
        "Most real scripts process many records. A loop lets the same rule run for each record without duplicating code.",
        "A for loop gives you one item at a time from a list. A running total is a number you start before the loop, then update during each loop pass as you read each record.",
        "for session in sessions: total_minutes += session['minutes'] adds each record to the same total.",
        "Start total_minutes at 0, loop through sessions, and add each session's minutes.",
        "This prepares the grouping function in the next lesson, where loops become reusable logic.",
        "What value changes on each loop pass, and what would the total be if you added a third 20-minute session?",
        ["Resetting the total inside the loop", "Adding only the first record", "Changing the list shape while trying to total it"],
        {
          language: "Python",
          tools: ["Python 3", "terminal", "for loops"],
          synopsis: "You are learning how Python repeats a small action across records, which is the bridge from beginner syntax to useful automation.",
          prerequisites: ["Know that sessions can be a list of dictionaries.", "Know that minutes should be stored as numbers if you want to add them."],
          testingFocus: "You will test that the loop produces the exact total for known records and that the total starts outside the loop.",
          codeShape: [
            "total = 0",
            "for one_item in list_of_items:",
            "    total = total + one_item[\"number_field\"]",
            "",
            "# In this lesson, one_item is named session:",
            "total_minutes = 0",
            "for session in sessions:",
            "    total_minutes = total_minutes + session[\"minutes\"]"
          ].join("\n")
        },
        {
          starterCode: "sessions = [\n    {\"topic\": \"python\", \"minutes\": 30},\n    {\"topic\": \"git\", \"minutes\": 15},\n]\ntotal_minutes = 0\n\n# Use a for loop to add each session's minutes.\nprint(total_minutes)",
          expectedOutput: "total minutes: 45\n\nVerifier then prints: passed",
          checkYourAnswer: "Your own output should prove the total is 45. If it is 15 or 30, your loop is only counting one record. If it is 0, the addition never happened. The final passed line comes from the verifier."
        },
        {
          title: "Total study minutes",
          goal: "Create the first automation slice by looping over study sessions and calculating total minutes.",
          steps: ["Start with two session dictionaries", "Initialize total_minutes before the loop", "Use a for loop to add each minutes value"],
          deliverables: ["Python loop code", "Output showing total minutes: 45", "One note explaining why total_minutes starts before the loop"],
          verifierCommand: "python total_minutes.py",
          expectedEvidence: "Terminal output showing total minutes: 45 plus a note describing what the loop does once per session.",
          projectConnection: "This is the stepping stone from raw records to the reusable group_minutes function.",
          tester: {
            codeLabel: "Paste your loop code",
            outputLabel: "Paste the terminal output",
            requiredCodeIncludes: ["for", "sessions", "total_minutes", "minutes"],
            requiredOutputIncludes: ["total", "45"],
            successMessage: "Your loop proof processes repeated records instead of hardcoding the answer.",
            failureMessage: "The tester needs a for loop plus output showing the 45-minute total."
          },
          runnerSpec: {
            language: "python",
            starterCode: "sessions = [\n    {\"topic\": \"python\", \"minutes\": 30},\n    {\"topic\": \"git\", \"minutes\": 15},\n]\ntotal_minutes = 0\n\n# Use a for loop to add each session's minutes.\nprint(total_minutes)",
            visibleTests: [
              {
                id: "loop-totals-minutes",
                name: "Loop totals the known session minutes",
                code: "assert total_minutes == 45\nprint('total 45 passed')",
                expectedOutputIncludes: ["total", "45", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "total-is-numeric",
                name: "Total is numeric and based on records",
                code: "assert isinstance(total_minutes, int)\nassert sum(session['minutes'] for session in sessions) == total_minutes"
              }
            ],
            expectedOutput: ["total", "45", "passed"]
          }
        },
        pythonLoopPracticeReps
      )
    },
    {
      id: "lesson-python-foundation-capstone",
      moduleId: "module-python-core",
      slug: "python-foundation-capstone",
      title: "Build the First Study Tracker Slice",
      summary: "Combine values, records, decisions, and loops into one small tracker proof.",
      bodyMarkdown: "A capstone is where small ideas stop living alone. This lesson asks you to combine the beginner pieces into one script that totals sessions and explains the result.",
      estimatedMinutes: 12,
      difficulty: "foundation",
      skillIds: ["skill-python-basics", "skill-testing-debugging"],
      quizId: "quiz-python-foundation-capstone",
      desktopTask: "Create a single Python script that stores sessions, totals minutes, counts focus sessions, and prints one summary line.",
      evidencePrompt: "Record the script path, passing output, and one change you would make if the sessions came from a file.",
      workshop: workshop(
        "Combine beginner Python building blocks into one working study-tracker slice.",
        "Real software rarely tests one syntax idea at a time. You need to connect data shape, decisions, loops, and output into a behavior someone can use.",
        "A small script becomes software when data moves through clear steps: records are stored first, rules such as focus-session checks are applied next, totals are calculated, and the final output explains the result.",
        "Three session dictionaries can produce the summary 3 sessions, 70 minutes, 1 focus session.",
        "Build the full flow from records to summary before moving into functions.",
        "This is the first checkpoint version of CLI Study Tracker before you extract reusable functions.",
        "Which part of the script is data, which part is logic, and which part is presentation?",
        ["Hardcoding the final summary instead of calculating it", "Mixing inconsistent record keys", "Forgetting that the focus count depends on the same loop"],
        {
          language: "Python",
          tools: ["Python 3", "terminal", "lists, if/else, for loops"],
          synopsis: "You are learning to combine beginner pieces into one small program. The goal is to see values, records, decisions, and loops working together instead of feeling like separate syntax facts.",
          prerequisites: ["Know how to store sessions as dictionaries in a list.", "Know how to use if/else inside a for loop."],
          testingFocus: "You will test that the script calculates the session count, total minutes, and focus-session count from the records.",
          codeShape: [
            "# 1. Data: the records the program starts with",
            "sessions = [...]",
            "",
            "# 2. Logic: calculate from the records",
            "total_minutes = 0",
            "focus_count = 0",
            "for session in sessions:",
            "    total_minutes = total_minutes + session[\"minutes\"]",
            "    if session[\"minutes\"] >= 30:",
            "        focus_count = focus_count + 1",
            "",
            "# 3. Presentation: turn the calculation into readable output",
            "summary = f\"{len(sessions)} sessions, {total_minutes} minutes, {focus_count} focus session\""
          ].join("\n")
        },
        {
          starterCode: "sessions = [\n    {\"topic\": \"python\", \"minutes\": 30},\n    {\"topic\": \"git\", \"minutes\": 15},\n    {\"topic\": \"python\", \"minutes\": 25},\n]\ntotal_minutes = 0\nfocus_count = 0\nsummary = \"\"\n\n# Loop over sessions, calculate totals, then build summary.\nprint(summary)",
          expectedOutput: "3 sessions, 70 minutes, 1 focus session",
          checkYourAnswer: "If the numbers are wrong, do not edit the final summary string first. Check whether the loop calculates total_minutes and focus_count from the records."
        },
        {
          title: "Ship the first tracker slice",
          goal: "Build a single-file tracker proof that calculates a useful summary from repeated study-session records.",
          steps: ["Store three study-session dictionaries", "Loop once to calculate total minutes and focus sessions", "Print the exact summary from calculated values"],
          deliverables: ["Python script", "Output summary", "One note separating data, logic, and presentation"],
          verifierCommand: "python tracker_slice.py",
          expectedEvidence: "Terminal output with the calculated summary plus a short explanation of which lines store data and which lines calculate behavior.",
          projectConnection: "This is the first complete slice of the CLI Study Tracker mission.",
          tester: {
            codeLabel: "Paste your tracker slice",
            outputLabel: "Paste the terminal output",
            requiredCodeIncludes: ["sessions", "for", "total_minutes", "focus_count", "summary"],
            requiredOutputIncludes: ["3 sessions", "70 minutes", "1 focus"],
            successMessage: "Your capstone proof connects beginner syntax into a working tracker slice.",
            failureMessage: "The tester needs calculated session count, total minutes, and focus count output."
          },
          runnerSpec: {
            language: "python",
            starterCode: "sessions = [\n    {\"topic\": \"python\", \"minutes\": 30},\n    {\"topic\": \"git\", \"minutes\": 15},\n    {\"topic\": \"python\", \"minutes\": 25},\n]\ntotal_minutes = 0\nfocus_count = 0\nsummary = \"\"\n\n# Loop over sessions, calculate totals, then build summary.\nprint(summary)",
            visibleTests: [
              {
                id: "tracker-slice-summary",
                name: "Tracker slice produces calculated summary",
                code: "assert len(sessions) == 3\nassert total_minutes == 70\nassert focus_count == 1\nassert summary == '3 sessions, 70 minutes, 1 focus session'\nprint('tracker slice 70 minutes passed')",
                expectedOutputIncludes: ["tracker", "70", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "tracker-summary-matches-data",
                name: "Summary matches the stored data",
                code: "assert sum(session['minutes'] for session in sessions) == total_minutes\nassert sum(1 for session in sessions if session['minutes'] >= 30) == focus_count"
              }
            ],
            expectedOutput: ["tracker", "70", "passed"]
          }
        }
      )
    },
    {
      id: "lesson-python-strings-cleanup",
      moduleId: "module-python-core",
      slug: "python-strings-cleanup",
      title: "Clean Text Before You Trust It",
      summary: "Normalize messy text so session topics can be compared and stored safely.",
      bodyMarkdown: "Text from users and files is often messy. Cleaning whitespace and case early prevents two values like Python and python from becoming separate topics by accident.",
      estimatedMinutes: 9,
      difficulty: "foundation",
      skillIds: ["skill-python-basics", "skill-testing-debugging"],
      quizId: "quiz-python-strings-cleanup",
      desktopTask: "Write a Python cleanup function that normalizes a raw topic and creates a simple slug.",
      evidencePrompt: "Record messy input, cleaned output, and the exact string method that fixed the issue.",
      workshop: workshop(
        "Clean raw text into a dependable topic name and slug.",
        "Any tracker that reads human input needs text cleanup before totals, files, or reports can be trusted.",
        "A string method is a built-in action for text. strip removes spaces at the edges, lower makes letters lowercase, and replace swaps one piece of text for another. Normalizing means turning messy input into one consistent format.",
        "'  Python Basics  '.strip().lower() becomes 'python basics'. Replacing spaces with hyphens creates the slug python-basics, which is a URL- or filename-friendly version of the topic.",
        "Normalize one raw topic string, then build a slug from it.",
        "This prepares file parsing because rows from a file often contain extra spaces and inconsistent capitalization.",
        "Which cleanup step changes meaning, and which cleanup step only makes the same meaning consistent?",
        ["Comparing raw text before stripping spaces", "Lowercasing some topics but not others", "Treating cleanup as a display-only concern"],
        {
          language: "Python",
          tools: ["Python 3", "terminal", "string methods"],
          synopsis: "You are learning to clean messy text before using it in program logic, which is a key move in real scripts and data tools.",
          prerequisites: ["Know that strings are text values.", "Know that dictionary topics need consistent names if you want reliable totals."],
          testingFocus: "You will test that messy spacing and capitalization become one predictable cleaned topic and one slug, which is the hyphenated storage-friendly name.",
          codeShape: [
            "clean_text = raw_text.strip().lower()",
            "slug = clean_text.replace(\" \", \"-\")",
            "",
            "# In this lesson:",
            "clean_topic = raw_topic.strip().lower()",
            "slug = clean_topic.replace(\" \", \"-\")"
          ].join("\n")
        },
        {
          starterCode: "raw_topic = \"  Python Basics  \"\nclean_topic = \"\"\nslug = \"\"\n\n# Clean raw_topic and create a slug.\nprint(clean_topic)\nprint(slug)",
          expectedOutput: "python basics\npython-basics",
          checkYourAnswer: "If clean_topic still has spaces at the edges, use strip first. If it still has capital letters, use lower. If slug has spaces, replace them after the topic is clean."
        },
        {
          title: "Normalize a session topic",
          goal: "Create a text cleanup slice that turns messy user input into a consistent topic and slug.",
          steps: ["Strip extra whitespace", "Lowercase the topic for consistent comparison", "Create a slug by replacing internal spaces with hyphens"],
          deliverables: ["Python cleanup code", "Cleaned topic output", "Slug output"],
          verifierCommand: "python clean_topic.py",
          expectedEvidence: "Terminal output showing the cleaned topic and slug plus one note explaining why cleanup must happen before grouping topics.",
          projectConnection: "This prevents the CLI Study Tracker from treating Python, python, and python basics inconsistently.",
          tester: {
            codeLabel: "Paste your text cleanup code",
            outputLabel: "Paste the terminal output",
            requiredCodeIncludes: ["strip", "lower", "replace", "slug"],
            requiredOutputIncludes: ["python basics", "python-basics"],
            successMessage: "Your text cleanup proof makes messy input safe to compare and store.",
            failureMessage: "The tester needs strip/lower/replace cleanup plus cleaned topic and slug output."
          },
          runnerSpec: {
            language: "python",
            starterCode: "raw_topic = \"  Python Basics  \"\nclean_topic = \"\"\nslug = \"\"\n\n# Clean raw_topic and create a slug.\nprint(clean_topic)\nprint(slug)",
            visibleTests: [
              {
                id: "cleans-topic-and-slug",
                name: "Cleans topic and slug",
                code: "assert clean_topic == 'python basics'\nassert slug == 'python-basics'\nprint('python basics slug passed')",
                expectedOutputIncludes: ["python", "slug", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "cleanup-removes-edge-space",
                name: "Cleanup removes edge spaces and normalizes case",
                code: "assert clean_topic == clean_topic.strip()\nassert clean_topic.islower()\nassert ' ' not in slug"
              }
            ],
            expectedOutput: ["python", "slug", "passed"]
          }
        }
      )
    },
    {
      id: "lesson-python-functions",
      moduleId: "module-python-core",
      slug: "python-functions",
      title: "Functions That Earn Their Name",
      summary: "Turn repeated script steps into testable functions.",
      bodyMarkdown: "A useful function has a narrow job, named inputs, and a result you can test. Start by writing the example call first, then make the function satisfy it.",
      estimatedMinutes: 8,
      difficulty: "foundation",
      skillIds: ["skill-python-functions", "skill-testing-debugging"],
      quizId: "quiz-python-functions",
      desktopTask: "Create a Python function that groups study tasks by track and write two assertions for it.",
      evidencePrompt: "Record the file path, command output, and what failed before it passed.",
      workshop: workshop(
        "Write one small Python function that can be tested without running the whole program.",
        "The CLI Study Tracker only becomes maintainable when the grouping logic is separate from input and printing.",
        "A function is a named reusable step. A testable function takes input values, returns an answer, and does not secretly depend on printed output. Reading files and printing are side effects, which means they interact with the outside world.",
        "group_minutes([{'topic': 'python', 'minutes': 30}, {'topic': 'python', 'minutes': 20}]) returns {'python': 50}.",
        "Write a function that accepts three study-session objects and returns total minutes by topic.",
        "This becomes the weekly aggregation core for CLI Study Tracker.",
        "Which input shape made your function easiest to test, and what would break if printing lived inside it?",
        ["Letting the function read global state", "Printing instead of returning data", "Testing only one topic"],
        {
          language: "Python",
          tools: ["Python 3", "terminal", "assertions or pytest"],
          synopsis: "You are learning how to write a small Python function with clear inputs and outputs. That makes the function easier to test because you can call it with sample data and inspect what it returns.",
          prerequisites: ["Know that Python code runs from a .py file.", "Be ready to create a list or dictionary of sample study sessions."],
          testingFocus: "You will test that the function returns the right totals for normal input and does not depend on printing or hidden global state."
        },
        {
          starterCode: "sessions = [\n  {\"topic\": \"python\", \"minutes\": 30},\n  {\"topic\": \"python\", \"minutes\": 20},\n  {\"topic\": \"git\", \"minutes\": 15},\n]\n\n# Write group_minutes(sessions) here.\nprint(group_minutes(sessions))",
          expectedOutput: "{'python': 50, 'git': 15}",
          checkYourAnswer: "Your function should return a dictionary instead of printing inside the function. Return means send the answer back to the caller. Add one assertion for the normal case and one assertion for an empty list."
        },
        {
          title: "Build a study-minute grouper",
          goal: "Create a tiny Python module that groups study sessions by topic without printing from the core function.",
          steps: ["Create a sessions list with at least three entries", "Write group_minutes so it returns a dictionary", "Add two assertions: normal input and empty input"],
          deliverables: ["Python file with the function", "Two passing assertions", "One sentence explaining why returning data is easier to test"],
          verifierCommand: "python study_minutes.py",
          expectedEvidence: "Console output or assertion result showing python totals and the empty-list case.",
          projectConnection: "This becomes the calculation core for the CLI Study Tracker mission.",
          tester: {
            codeLabel: "Paste your Python function",
            outputLabel: "Paste terminal output from python study_minutes.py",
            requiredCodeIncludes: ["def group_minutes", "return"],
          requiredOutputIncludes: ["python", "50", "git", "15"],
          successMessage: "Your grouper proof has the function shape and expected topic totals.",
          failureMessage: "The tester needs a group_minutes function that returns data and output with python=50 and git=15."
          },
          runnerSpec: {
            language: "python",
            starterCode: "def group_minutes(sessions):\n    # Return total minutes by topic.\n    return {}\n",
            visibleTests: [
              {
                id: "groups-known-topics",
                name: "Groups known study topics",
                code: "sessions = [\n    {'topic': 'python', 'minutes': 30},\n    {'topic': 'python', 'minutes': 20},\n    {'topic': 'git', 'minutes': 15},\n]\nassert group_minutes(sessions) == {'python': 50, 'git': 15}\nprint('python=50 git=15 passed')",
                expectedOutputIncludes: ["python=50", "git=15", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "handles-empty-list",
                name: "Handles empty input",
                code: "assert group_minutes([]) == {}"
              }
            ],
            expectedOutput: ["python=50", "git=15", "passed"]
          }
        }
      )
    },
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
          starterCode: "type MissionCard = {\n  title: string;\n  proofCount: number;\n  nextAction: string;\n};\n\nconst card: MissionCard = {\n  title: \"CLI Study Tracker\",\n  proofCount: 2,\n  nextAction: \"Add verifier output\"\n};",
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
            starterCode: "type MissionCard = {\n  title: string;\n  proofCount: number;\n  nextAction: string;\n};\n\nconst card: MissionCard = {\n  title: \"CLI Study Tracker\",\n  proofCount: 2,\n  nextAction: \"Add verifier output\"\n};",
            visibleTests: [
              {
                id: "card-has-required-data",
                name: "Card has required data",
                code: "if (card.title !== 'CLI Study Tracker') throw new Error('title mismatch');\nif (card.proofCount !== 2) throw new Error('proofCount mismatch');\nif (!card.nextAction.includes('verifier')) throw new Error('nextAction should name verifier work');\nconsole.log('typecheck proofCount contract passed');",
                expectedOutputIncludes: ["typecheck", "proofCount", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["typecheck", "proofCount", "passed"]
          }
        }
      )
    },
    {
      id: "lesson-python-traceback-clinic",
      moduleId: "module-python-core",
      slug: "python-traceback-clinic",
      title: "Read Errors Like a Developer",
      summary: "Use tracebacks and try/except to turn bad input into useful feedback.",
      bodyMarkdown: "A traceback is not a personal failure. It is Python showing where the program stopped and why. Developers learn to read the last line, find the failing value, and decide whether to fix the code or handle the input.",
      estimatedMinutes: 10,
      difficulty: "foundation",
      skillIds: ["skill-python-basics", "skill-testing-debugging"],
      quizId: "quiz-python-traceback-clinic",
      desktopTask: "Write a small parser that handles one valid minutes value and one invalid value without crashing.",
      evidencePrompt: "Record the failing input, the safe output, and the exception type you handled.",
      workshop: workshop(
        "Read a Python error and handle invalid input without hiding the problem.",
        "Real software receives bad input. A useful script reports the problem clearly instead of crashing or pretending the bad value worked.",
        "A traceback is Python's error report. The last line usually names the exception, which is the type of problem Python found. try/except lets you handle an expected failure path and return a useful message instead of crashing.",
        "int('30') works, but int('oops') raises ValueError. A safe parser can catch that and report invalid minutes: oops.",
        "Create a parser that returns 30 for valid input and a clear error message for invalid input.",
        "This prepares file parsing, where one bad row should not destroy the whole tracker run.",
        "Which value caused the error, and what message would help a beginner fix the input?",
        ["Catching every exception without naming the issue", "Returning zero for bad input without explaining why", "Reading only the first traceback line"],
        {
          language: "Python",
          tools: ["Python 3", "terminal", "tracebacks", "try/except"],
          synopsis: "You are learning how to treat errors as information. Instead of seeing a traceback as a dead end, you will read what failed and decide what message would help the user fix it.",
          prerequisites: ["Know that int('30') converts text into a number.", "Know that file input can contain values your code did not expect."],
          testingFocus: "You will test one valid value and one invalid value so the parser proves both success behavior and failure behavior."
        },
        {
          starterCode: "safe_minutes = None\nerror_message = \"\"\n\n# Parse \"30\" safely and report \"oops\" without crashing.\nprint(safe_minutes)\nprint(error_message)",
          expectedOutput: "30\ninvalid minutes: oops",
          checkYourAnswer: "If the program crashes, read the last line of the traceback first. If it silently returns 0 for oops, the user will not know what to fix, so use a clear error message instead."
        },
        {
          title: "Handle bad minutes input",
          goal: "Build a tiny parser that accepts valid minutes and reports invalid minutes without crashing.",
          steps: ["Parse the text value 30 into an integer", "Try parsing the bad value oops", "Set a clear error message when parsing fails"],
          deliverables: ["Parser code", "Output showing 30", "Output showing invalid minutes: oops"],
          verifierCommand: "python traceback_clinic.py",
          expectedEvidence: "Terminal output proving valid input still works and invalid input is reported with a clear message instead of a traceback.",
          projectConnection: "This makes the CLI Study Tracker safer when file rows contain bad minute values.",
          tester: {
            codeLabel: "Paste your parser and try/except code",
            outputLabel: "Paste terminal output",
            requiredCodeIncludes: ["try", "except", "ValueError", "error_message"],
            requiredOutputIncludes: ["30", "invalid minutes", "oops"],
            successMessage: "Your error-handling proof turns a crash into useful feedback.",
            failureMessage: "The tester needs try/except code plus output for both valid and invalid minutes."
          },
          runnerSpec: {
            language: "python",
            starterCode: "safe_minutes = None\nerror_message = \"\"\n\n# Parse \"30\" safely and report \"oops\" without crashing.\nprint(safe_minutes)\nprint(error_message)",
            visibleTests: [
              {
                id: "handles-valid-and-invalid-minutes",
                name: "Handles valid and invalid minutes",
                code: "assert safe_minutes == 30\nassert error_message == 'invalid minutes: oops'\nprint('invalid minutes oops passed')",
                expectedOutputIncludes: ["invalid", "minutes", "passed"]
              }
            ],
            hiddenTests: [
              {
                id: "minutes-error-is-explicit",
                name: "Minutes error is explicit",
                code: "assert isinstance(safe_minutes, int)\nassert 'oops' in error_message\nassert 'invalid' in error_message"
              }
            ],
            expectedOutput: ["invalid", "minutes", "passed"]
          }
        }
      )
    },
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
          successMessage: "Your parser proof preserves rejected input with a clear reason.",
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
          synopsis: "You are learning how to turn parser behavior into proof. A test is a small example your code must satisfy every time: clean input should become data, and bad input should become a clear error.",
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
          projectConnection: "This is the verifier backbone for the Study Data Cleaner mission.",
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
        }
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
          expectedEvidence: "Terminal output or sandbox proof showing parsed data and summary, plus one note explaining how argparse handles bad minutes.",
          projectConnection: "This turns CLI Study Tracker from a hardcoded script into a reusable command-line tool.",
          tester: {
            codeLabel: "Paste your argparse command parser",
            outputLabel: "Paste command output",
            requiredCodeIncludes: ["argparse", "add_argument", "--topic", "--minutes", "type=int"],
            requiredOutputIncludes: ["python", "30", "minutes"],
            successMessage: "Your argparse proof creates a real input boundary for the tracker.",
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
        }
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
            successMessage: "Your file-backed CLI proof reads input data through a real command boundary.",
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
          deliverables: ["Polished build_parser function", "--help output", "Default and explicit format proof"],
          verifierCommand: "python study_tracker.py --help && python study_tracker.py --input sessions.csv",
          expectedEvidence: "Help output showing --input, --format, and --min-minutes plus a run proving defaults are applied.",
          projectConnection: "This makes CLI Study Tracker easier for a reviewer to run, inspect, and trust.",
          tester: {
            codeLabel: "Paste your polished argparse parser",
            outputLabel: "Paste help output and one default run",
            requiredCodeIncludes: ["description", "help=", "default=", "choices", "--format", "--min-minutes"],
            requiredOutputIncludes: ["--input", "--format", "text", "passed"],
            successMessage: "Your CLI polish proof shows discoverable help, defaults, and constrained options.",
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
          deliverables: ["Argparse output option", "Report formatter", "Saved report proof"],
          verifierCommand: "python study_tracker.py --input sessions.csv --output summary.txt",
          expectedEvidence: "Command output plus the contents of summary.txt showing session count and total minutes.",
          projectConnection: "This gives CLI Study Tracker an inspectable artifact for portfolio evidence.",
          tester: {
            codeLabel: "Paste your output-file CLI code",
            outputLabel: "Paste command output and report contents",
            requiredCodeIncludes: ["--output", "format_report", "write_report", "summary.txt"],
            requiredOutputIncludes: ["summary.txt", "2 sessions", "45 minutes", "passed"],
            successMessage: "Your output-file proof creates a durable tracker report.",
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
            successMessage: "Your rejected-row proof preserves bad-input evidence without blocking clean rows.",
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
        }
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
      desktopTask: "Add README run steps, verifier output, and known gaps to the CLI Study Tracker or Study Data Cleaner repo.",
      evidencePrompt: "Capture the repo URL, commit hash, README status, verifier output, and reflection.",
      workshop: workshop(
        "Package a Python practice script so a reviewer can inspect it quickly.",
        "Portfolio proof is not the code alone; it is code plus setup, verification, and honest scope.",
        "A README is the project note a reviewer reads first. A reviewer-friendly README answers what the project does, how to run it, how it was verified, and what remains unfinished.",
        "README sections: Problem, Run, Verify, Sample Output, Known Gaps.",
        "Update one Python mission README and record the exact verifier output in CareerForge evidence.",
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
          steps: ["Add Problem, Run, Verify, Sample Output, and Known Gaps sections", "Paste exact verifier output", "Name one limitation you would fix next"],
          deliverables: ["Updated README", "Verifier output", "Known-gaps note"],
          verifierCommand: "python -m pytest",
          expectedEvidence: "README excerpt plus the exact verifier output recorded in CareerForge evidence.",
          projectConnection: "This upgrades CLI Study Tracker or Study Data Cleaner toward portfolio readiness.",
          tester: {
            codeLabel: "Paste your README proof sections",
            outputLabel: "Paste verifier output",
            requiredCodeIncludes: ["## Verify", "## Known gaps"],
          requiredOutputIncludes: ["passed"],
          successMessage: "Your README proof includes verification, known gaps, and passing output.",
          failureMessage: "The tester needs Verify and Known gaps sections plus passing verifier output."
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
        }
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
            outputLabel: "Paste verifier output",
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
        }
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
        }
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
        }
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
        }
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
        "A schema is the shape of a database table. A good first schema stores date, topic, and minutes with types and a simple primary key. Queries should answer real product questions.",
        "SELECT topic, SUM(minutes) FROM sessions GROUP BY topic returns totals that the report layer can use.",
        "Create the sessions table, insert sample rows, and query totals by topic.",
        "This closes the database persistence gap and connects the Python path to the SQL path.",
        "Which fields belong in the database, and which calculated values can be derived by query?",
        ["Storing all session data as one text blob", "No query proving the schema works", "Hardcoding totals instead of calculating them"],
        {
          language: "SQLite for Python utilities",
          tools: ["SQLite", "schema", "aggregate query"],
          synopsis: "You are learning how a Python utility can persist session data with SQLite. Persist means save data so it is still available after the program exits.",
          prerequisites: ["Know the session fields date, topic, and minutes.", "Know that SQL tables store rows and queries calculate answers."],
          testingFocus: "You will test the schema by inserting rows and querying total minutes by topic, so the table proves it can answer a real tracker question."
        },
        {
          starterCode: "CREATE TABLE sessions (\n  id INTEGER PRIMARY KEY,\n  date TEXT NOT NULL,\n  topic TEXT NOT NULL,\n  minutes INTEGER NOT NULL\n);\n\n-- Insert python and git sessions, then query totals by topic.",
          expectedOutput: "python | 50\ngit | 15",
          checkYourAnswer: "If the query returns one row per session, add GROUP BY topic so the database groups sessions by topic before calculating totals."
        },
        {
          title: "Create durable session storage",
          goal: "Build a SQLite schema and total-by-topic query for tracker sessions.",
          steps: ["Create the sessions table", "Insert at least three sample rows", "Query total minutes grouped by topic"],
          deliverables: ["CREATE TABLE statement", "Seed inserts", "Aggregate query output"],
          verifierCommand: "sqlite3 tracker.db < schema_and_query.sql",
          expectedEvidence: "SQL output showing python and git totals from inserted session rows.",
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
            hiddenTests: [],
            expectedOutput: ["python", "50", "git", "15"]
          }
        }
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
        "An API client is the code that talks to another service over the network. A client function should set a timeout, check HTTP status, parse JSON, and validate the fields it returns.",
        "client.get(url, timeout=5) returning status 200 and a list of sessions can become trusted records after validation.",
        "Use a fake client to test success, bad status, and bad shape without making real network calls.",
        "This closes the API/networking gap while keeping the mobile sandbox safe and offline.",
        "Which failures belong at the API boundary before data reaches the service layer?",
        ["No timeout", "Assuming status 200", "Trusting any JSON shape as session data"],
        {
          language: "Python API client",
          tools: ["HTTP client boundary", "fake responses", "validation tests"],
          synopsis: "You are learning how to design API code as a safe boundary. Network data is untrusted input until your code checks the status code and response shape.",
          prerequisites: ["Know the StudySession fields.", "Know that network responses are untrusted input."],
          testingFocus: "You will test success, non-200 status, and invalid JSON shape without using real network access."
        },
        {
          starterCode: "class ApiError(Exception):\n    pass\n\nclass FakeResponse:\n    def __init__(self, status_code, payload):\n        self.status_code = status_code\n        self._payload = payload\n    def json(self):\n        return self._payload\n\nclass FakeClient:\n    def __init__(self, response):\n        self.response = response\n        self.timeout_seen = None\n    def get(self, url, timeout):\n        self.timeout_seen = timeout\n        return self.response\n\ndef fetch_sessions(client, url):\n    return []",
          expectedOutput: "[{'date': '2026-05-08', 'topic': 'python', 'minutes': 30}]\ntimeout=5",
          checkYourAnswer: "If bad status or bad shape returns an empty list, the caller cannot tell success from failure. Raise a project-specific API error so failure stays visible."
        },
        {
          title: "Create a safe API client",
          goal: "Build an API client boundary that checks timeout, status, and response shape.",
          steps: ["Call the client with timeout=5", "Raise ApiError for non-200 status", "Validate response records before returning them"],
          deliverables: ["fetch_sessions function", "Fake client tests", "ApiError failure cases"],
          verifierCommand: "python -m pytest tests/test_api_client.py",
          expectedEvidence: "Passing tests for success, bad status, bad shape, and timeout behavior.",
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
        }
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
        "The regex validator can have unit tests, the service can have state tests, and the installed CLI can have a smoke command.",
        "Build a verification matrix that proves every integration layer has a clear responsibility and test.",
        "This becomes the implementation checklist for the Python Integration Service mission.",
        "Which layer would you debug first if the final CLI output is wrong?",
        ["No integration test after unit tests", "A layer with no owner", "Evidence that proves only one happy path"],
        {
          language: "Python integration architecture",
          tools: ["verification matrix", "unit tests", "CLI smoke tests"],
          synopsis: "You are learning how to connect professional Python layers into one reviewable utility with evidence for each boundary. A layer is one part of the system with a clear job.",
          prerequisites: ["Know the validation, service, persistence, API, and report layers.", "Know the exact commands that verify the project."],
          testingFocus: "You will test that every required layer has a named responsibility, test, and evidence command."
        },
        {
          starterCode: "integration_matrix = []\nverification_commands = []\n\n# Add layers, responsibilities, tests, and final commands.\nprint(integration_matrix)\nprint(verification_commands)",
          expectedOutput: "validation -> test_regex_validation\nservice -> test_service_totals\nsqlite -> test_sqlite_totals\napi -> test_api_client\nstudy-tracker --help",
          checkYourAnswer: "If a layer has no test, it is not ready for the capstone. If a command has no artifact or output to inspect, the evidence is weak."
        },
        {
          title: "Build the integration proof matrix",
          goal: "Create a capstone plan that connects every advanced Python layer to tests and evidence.",
          steps: ["List each integration layer", "Name its responsibility and test", "Name final verifier commands and artifacts"],
          deliverables: ["Integration matrix", "Verification command list", "Evidence checklist"],
          verifierCommand: "python -m pytest && study-tracker --help && study-tracker --input sessions.csv --format json",
          expectedEvidence: "A matrix connecting layers to tests plus final command output for pytest, help, and JSON report smoke proof.",
          projectConnection: "This is the final checklist for the Python Integration Service mission.",
          tester: {
            codeLabel: "Paste your integration matrix",
            outputLabel: "Paste final verifier output",
            requiredCodeIncludes: ["validation", "service", "sqlite", "api", "json", "cli"],
            requiredOutputIncludes: ["pytest", "study-tracker", "json", "passed"],
            successMessage: "Your integration capstone proof connects advanced layers to real verification.",
            failureMessage: "The tester needs a layer matrix plus verifier output for tests and CLI smoke commands."
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
        }
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
        "Validation has regex tests, service has state tests, SQLite has query output, API has fake-client tests, and CLI has JSON smoke output.",
        "Build the final review matrix and choose one production-readiness improvement.",
        "This is the final review gate for the Python Integration Service mission.",
        "Which layer is most likely to fail in production, and what evidence would warn you early?",
        ["Only proving isolated units with no final smoke command", "No risk column", "No improvement decision after review"],
        {
          language: "Python capstone review",
          tools: ["integration matrix", "pytest", "SQLite output", "CLI JSON output"],
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
          steps: ["Map every layer to evidence", "List final verifier commands", "Name one risk and one improvement"],
          deliverables: ["Layer evidence matrix", "Final command list", "Risk and improvement note"],
          verifierCommand: "python -m pytest && sqlite3 tracker.db < schema_and_query.sql && study-tracker --input sessions.csv --format json",
          expectedEvidence: "Final review matrix plus pytest, SQLite, API-client, and CLI JSON evidence.",
          projectConnection: "This review gate completes the Python Integration Service path.",
          tester: {
            codeLabel: "Paste your Integration Service Review",
            outputLabel: "Paste final verifier output",
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
        }
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
        "Write one query that finds project missions with no verifier-backed evidence.",
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
          steps: ["Add setup and run commands", "Add exact verifier output", "Add known gaps that are honest but not self-sabotaging"],
          deliverables: ["README diff", "Commit or local note", "Verifier output"],
          verifierCommand: "git diff -- README.md",
          expectedEvidence: "README diff or commit link showing verification and known-gaps sections.",
          projectConnection: "This is the smallest useful slice of the Portfolio README Upgrade mission.",
          tester: {
            codeLabel: "Paste README diff or updated sections",
            outputLabel: "Paste verifier output or git diff summary",
            requiredCodeIncludes: ["Verification", "Known gaps"],
          requiredOutputIncludes: ["passed"],
          successMessage: "Your repo proof includes verifier output and honest known gaps.",
          failureMessage: "The tester needs README verification/known-gaps text plus passing verifier output."
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
      evidencePrompt: "Store the prompt summary, final test, and verifier output.",
      workshop: workshop(
        "Use AI output as a draft while keeping verification custody.",
        "Employable AI-assisted engineers can explain why a suggested change is correct, not just who suggested it.",
        "The loop is reproduce, ask, inspect, edit, verify, then record evidence.",
        "An AI suggests a null check; you add a regression test and only accept the fix after the test fails then passes.",
        "Ask for one test idea, write your own final assertion, and record the verifier output.",
        "This prepares the AI Bug Review Rubric and AI Prompt Verification Harness missions.",
        "Where did your judgment change the model's suggestion?",
        ["Accepting plausible code", "Skipping reproduction", "Recording the prompt but not the verifier"],
        {
          language: "AI-assisted coding",
          tools: ["AI chat", "test runner", "diff review"],
          synopsis: "You are learning how to use AI as a draft partner while keeping ownership of the final test, code, and evidence.",
          prerequisites: ["Have a small bug, behavior, or test idea to inspect.", "Know how to run the verifier for the project."],
          testingFocus: "You will test the AI suggestion by reproducing the issue, writing or improving an assertion, and capturing verifier output yourself."
        },
        {
          starterCode: "AI suggestion: \"Add a null check before reading user.name.\"\n\nYour final test idea:\n- Given a user without a name\n- When the formatter runs\n- Then it returns \"Unknown user\" instead of crashing",
          expectedOutput: "A final assertion written in your words, plus verifier output that proves the behavior.",
          checkYourAnswer: "Do not accept the AI suggestion until you can explain the failing case and show the test passing after your edit."
        },
        {
          title: "Verify one AI-generated test idea",
          goal: "Use AI for a draft test idea, then rewrite and verify the final assertion yourself.",
          steps: ["Ask AI for one test idea", "Rewrite the assertion in your own words", "Run the verifier and record what changed from the AI draft"],
          deliverables: ["Prompt summary", "Final assertion", "Verifier output and judgment note"],
          verifierCommand: "Run the relevant project test command.",
          expectedEvidence: "Final test plus verifier output, with a short note explaining what you changed from the AI prompt.",
          projectConnection: "This rehearses the AI Prompt Verification Harness mission.",
          tester: {
            codeLabel: "Paste your final assertion and judgment note",
            outputLabel: "Paste verifier output",
            requiredCodeIncludes: ["assert", "AI"],
          requiredOutputIncludes: ["passed"],
          successMessage: "Your AI-assisted proof keeps ownership in your final assertion and verifier output.",
          failureMessage: "The tester needs a final assertion, a note about the AI draft, and passing verifier output."
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
          deliverables: ["Task and Event types", "Reducer function", "Verifier output"],
          verifierCommand: "npm run typecheck or npm test",
          expectedEvidence: "Typecheck or test output plus a short note proving the reducer completes one task without mutating the original state.",
          projectConnection: "This is a testable state-management slice for the Typed Progress Board mission.",
          tester: {
            codeLabel: "Paste your reducer and event types",
            outputLabel: "Paste typecheck or test output",
            requiredCodeIncludes: ["type Event", "reducer", "complete"],
            requiredOutputIncludes: ["passed"],
            successMessage: "Your reducer proof shows a typed event changing state under test.",
            failureMessage: "The tester needs typed event code and verifier output showing the reducer passed."
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
      evidencePrompt: "Save the diff summary, commit message, and exact verifier command.",
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
      evidencePrompt: "Keep the checklist, accepted edits, rejected edits, and verifier output.",
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
          prerequisites: ["Have a small AI-suggested patch or sample diff.", "Know the verifier command for the project you are reviewing."],
          testingFocus: "You will test the review by ensuring the accepted change has verifier output and the rejected change has a clear risk reason."
        },
        {
          starterCode: "Checklist:\n- Scope: one bug fix\n- Contract change: none\n- Package change: rejected\n- Secret risk: none found\n- Verification: npm run test -> passed",
          expectedOutput: "The accepted change has local verifier output, and the rejected item names a concrete risk such as package expansion or contract drift.",
          checkYourAnswer: "A useful rejection is specific. Do not write 'bad'; write the risk, such as unnecessary package change for a local bug fix."
        },
        {
          title: "Apply an AI diff review checklist",
          goal: "Review an AI-suggested change and record accepted edits, rejected edits, and verifier evidence.",
          steps: ["List the AI-suggested changes", "Reject at least one risky or out-of-scope item", "Run the verifier for the accepted edit"],
          deliverables: ["Review checklist", "Rejected-item reason", "Verifier output"],
          verifierCommand: "Run the project verifier for the accepted change.",
          expectedEvidence: "Checklist showing accepted and rejected AI suggestions plus exact verifier output for the accepted change.",
          projectConnection: "This is the review gate inside the AI Prompt Verification Harness mission.",
          tester: {
            codeLabel: "Paste your AI diff checklist",
            outputLabel: "Paste verifier output",
            requiredCodeIncludes: ["accepted", "rejected", "Verification"],
            requiredOutputIncludes: ["passed"],
            successMessage: "Your AI diff review keeps human ownership over accepted and rejected changes.",
            failureMessage: "The tester needs accepted/rejected review notes plus passing verifier output."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "const aiReview = {\n  accepted: ['small null fallback with regression test'],\n  rejected: ['new dependency for a one-line bug fix'],\n  verification: 'npm run test -> passed',\n  risk: 'package changes were out of scope'\n};",
            visibleTests: [
              {
                id: "ai-review-records-judgment",
                name: "AI review records accepted and rejected choices",
                code: "if (aiReview.accepted.length === 0) throw new Error('accepted item required');\nif (aiReview.rejected.length === 0) throw new Error('rejected item required');\nif (!aiReview.verification.includes('passed')) throw new Error('missing verifier result');\nconsole.log('accepted rejected AI review passed');",
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
      bodyMarkdown: "A practical AI app should know when it has support and when it does not. Retrieval gives the answer step a small local evidence set; the verifier checks that claims point back to those notes.",
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
          verifierCommand: "Run the citation-check script or Code Lab verifier.",
          expectedEvidence: "Retrieved note ids, answer citations, and verifier output showing citations are grounded in the retrieved set.",
          projectConnection: "This is the grounding check inside the RAG Notes Search Prototype mission.",
          tester: {
            codeLabel: "Paste your notes, retrieved ids, and cited answer",
            outputLabel: "Paste citation-check output",
            requiredCodeIncludes: ["notes", "retrievedIds", "citations"],
            requiredOutputIncludes: ["grounded", "passed"],
            successMessage: "Your AI app proof separates retrieval from answer grounding.",
            failureMessage: "The tester needs notes, retrieved ids, citations, and grounded verifier output."
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
          verifierCommand: "Run the Code Lab verifier or a local test.",
          expectedEvidence: "Matrix output with TP, FP, FN, and TN counts plus a short limitation note about what the tiny sample cannot prove.",
          projectConnection: "This is the error-analysis slice for the ML Metrics Report mission.",
          tester: {
            codeLabel: "Paste your confusion matrix function and note",
            outputLabel: "Paste verifier output",
            requiredCodeIncludes: ["tp", "fp", "fn", "tn"],
            requiredOutputIncludes: ["passed"],
            successMessage: "Your ML evaluation proof shows the error counts behind the metric.",
            failureMessage: "The tester needs TP/FP/FN/TN code plus verifier output."
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
      )
    }
  ],
  quizzes: [
    {
      id: "quiz-python-values",
      lessonId: "lesson-python-values",
      title: "Python values checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-values-1",
          prompt: "What is a variable name doing in a beginner Python program?",
          choices: ["Giving a value a readable label", "Running the terminal automatically", "Replacing the need for output"],
          correctChoiceIndex: 0,
          explanation: "A variable name lets the program and the reader refer to a value clearly."
        },
        {
          id: "question-python-values-2",
          prompt: "Which value should usually stay a number if you plan to add it later?",
          choices: ["topic", "minutes", "summary sentence"],
          correctChoiceIndex: 1,
          explanation: "Minutes should be numeric so later lessons can total and group them."
        },
        {
          id: "question-python-values-3",
          prompt: "Why print or test the summary after creating the variables?",
          choices: ["To prove the values produced the expected result", "To make the code longer", "To hide the variable names"],
          correctChoiceIndex: 0,
          explanation: "Output gives you evidence that the named values were combined correctly."
        }
      ]
    },
    {
      id: "quiz-python-collections",
      lessonId: "lesson-python-collections",
      title: "Python collections checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-collections-1",
          prompt: "Why use a dictionary for one study session?",
          choices: ["It names the fields of one record", "It deletes repeated data automatically", "It only stores text"],
          correctChoiceIndex: 0,
          explanation: "A dictionary can name fields such as topic and minutes for one record."
        },
        {
          id: "question-python-collections-2",
          prompt: "Why put session dictionaries inside a list?",
          choices: ["So the script can hold multiple records", "So every record becomes one string", "So tests cannot inspect the data"],
          correctChoiceIndex: 0,
          explanation: "A list lets Python keep repeated records together in one variable."
        },
        {
          id: "question-python-collections-3",
          prompt: "What makes repeated records easier to process later?",
          choices: ["Consistent keys across records", "Different names for the same field", "One variable per possible session"],
          correctChoiceIndex: 0,
          explanation: "Consistent keys let loops and functions read each record the same way."
        }
      ]
    },
    {
      id: "quiz-python-decisions",
      lessonId: "lesson-python-decisions",
      title: "Python decisions checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-decisions-1",
          prompt: "What question does an if condition answer?",
          choices: ["A true-or-false question", "A file-name question only", "A question that must always be true"],
          correctChoiceIndex: 0,
          explanation: "The if block runs when the condition is true; otherwise the else block can run."
        },
        {
          id: "question-python-decisions-2",
          prompt: "For minutes >= 30, which value should a 30-minute session receive?",
          choices: ["quick", "focus", "unknown"],
          correctChoiceIndex: 1,
          explanation: "Thirty satisfies the greater-than-or-equal condition, so it should use the focus branch."
        },
        {
          id: "question-python-decisions-3",
          prompt: "Why should you think about the else branch even when the visible example passes?",
          choices: ["It proves you understand the other path", "It makes Python ignore errors", "It replaces the need for a condition"],
          correctChoiceIndex: 0,
          explanation: "Real decisions need both paths to make sense, especially when future data changes."
        }
      ]
    },
    {
      id: "quiz-python-loops",
      lessonId: "lesson-python-loops",
      title: "Python loops checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-loops-1",
          prompt: "What does a for loop give you when looping through sessions?",
          choices: ["One session at a time", "Only the final total", "A new file automatically"],
          correctChoiceIndex: 0,
          explanation: "The loop variable represents one item from the list on each pass."
        },
        {
          id: "question-python-loops-2",
          prompt: "Where should total_minutes usually be initialized?",
          choices: ["Before the loop starts", "Inside the loop on every pass", "Only after printing"],
          correctChoiceIndex: 0,
          explanation: "The running total starts before the loop so each pass can add to it."
        },
        {
          id: "question-python-loops-3",
          prompt: "Why is a loop better than manually adding sessions[0] and sessions[1]?",
          choices: ["It can scale to more records", "It prevents all mistakes automatically", "It only works with two records"],
          correctChoiceIndex: 0,
          explanation: "A loop repeats the same logic for each record, so adding more sessions requires less duplicated code."
        }
      ]
    },
    {
      id: "quiz-python-foundation-capstone",
      lessonId: "lesson-python-foundation-capstone",
      title: "Foundation capstone checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-foundation-capstone-1",
          prompt: "What makes the tracker slice more than a syntax exercise?",
          choices: ["It connects data, logic, and output", "It uses the longest possible variable names", "It avoids testing calculated values"],
          correctChoiceIndex: 0,
          explanation: "The capstone matters because several small ideas work together to produce a useful behavior."
        },
        {
          id: "question-python-foundation-capstone-2",
          prompt: "If the summary total is wrong, what should you inspect first?",
          choices: ["Only the final printed string", "The loop and running totals", "The lesson title"],
          correctChoiceIndex: 1,
          explanation: "Calculated output should be fixed at the calculation step, not patched in the final sentence."
        },
        {
          id: "question-python-foundation-capstone-3",
          prompt: "Why separate data, logic, and presentation?",
          choices: ["So each part can be changed and tested more clearly", "So the script cannot run", "So every variable becomes global"],
          correctChoiceIndex: 0,
          explanation: "Separation makes the next step, functions, much easier to understand and test."
        }
      ]
    },
    {
      id: "quiz-python-strings-cleanup",
      lessonId: "lesson-python-strings-cleanup",
      title: "Text cleanup checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-strings-cleanup-1",
          prompt: "Why clean topic text before grouping sessions?",
          choices: ["So equivalent topics compare consistently", "So every topic is deleted", "So tests cannot see the raw value"],
          correctChoiceIndex: 0,
          explanation: "Cleaning whitespace and case prevents equivalent topic names from being counted separately."
        },
        {
          id: "question-python-strings-cleanup-2",
          prompt: "Which method removes extra spaces at the edges of a string?",
          choices: ["strip", "append", "except"],
          correctChoiceIndex: 0,
          explanation: "strip removes leading and trailing whitespace."
        },
        {
          id: "question-python-strings-cleanup-3",
          prompt: "When should you create a slug like python-basics?",
          choices: ["After the topic has been cleaned", "Before reading the raw topic", "Only after tests are deleted"],
          correctChoiceIndex: 0,
          explanation: "Slug creation should use a consistent cleaned value so file or URL-like names stay predictable."
        }
      ]
    },
    {
      id: "quiz-python-functions",
      lessonId: "lesson-python-functions",
      title: "Python function checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-1",
          prompt: "What makes a beginner function easier to test?",
          choices: ["It reads global state", "It has clear inputs and outputs", "It prints every intermediate value"],
          correctChoiceIndex: 1,
          explanation: "Clear inputs and outputs let a test call the function and compare the result."
        },
        {
          id: "question-python-2",
          prompt: "Where should terminal printing usually live?",
          choices: ["Inside every core function", "At the edge of the program", "Inside test assertions"],
          correctChoiceIndex: 1,
          explanation: "Keeping printing at the edge lets the core function return data tests can inspect."
        },
        {
          id: "question-python-3",
          prompt: "What is the strongest first test for grouping study minutes?",
          choices: ["One input with known totals", "A screenshot of the terminal", "A comment saying it works"],
          correctChoiceIndex: 0,
          explanation: "A tiny known input makes the expected output concrete."
        }
      ]
    },
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
    {
      id: "quiz-python-traceback-clinic",
      lessonId: "lesson-python-traceback-clinic",
      title: "Traceback clinic checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-python-traceback-1",
          prompt: "What is the most useful first thing to read in a traceback?",
          choices: ["The last line naming the exception", "Only the file icon", "The longest variable name"],
          correctChoiceIndex: 0,
          explanation: "The last line usually names what kind of error stopped the program."
        },
        {
          id: "question-python-traceback-2",
          prompt: "What should a safe parser do with expected bad input?",
          choices: ["Crash without context", "Report a clear failure reason", "Pretend the value was correct"],
          correctChoiceIndex: 1,
          explanation: "Expected bad input should become a useful message or rejection record."
        },
        {
          id: "question-python-traceback-3",
          prompt: "Why avoid catching every exception silently?",
          choices: ["It hides real problems", "It makes tests stronger automatically", "It turns strings into numbers"],
          correctChoiceIndex: 0,
          explanation: "Silent broad catches make debugging harder because they erase the evidence."
        }
      ]
    },
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
          choices: ["The final passing verifier output", "Only a vague reflection", "Nothing until deployment"],
          correctChoiceIndex: 0,
          explanation: "Verifier output connects the project claim to inspectable proof."
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
          choices: ["A clever filename", "README, run command, verifier output, and known gaps", "Only a completed badge"],
          correctChoiceIndex: 1,
          explanation: "Reviewers need context, commands, proof, and honest scope."
        },
        {
          id: "question-python-proof-2",
          prompt: "Which evidence field is required for passing test proof?",
          choices: ["Verifier output", "A private memory note", "A project nickname"],
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
          explanation: "Model output needs human inspection and local verifier evidence before acceptance."
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
      expectedArtifacts: ["Repository link", "Sample input file", "--help output", "summary.txt output", "Verifier output", "README usage section"],
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
      expectedArtifacts: ["Repo URL", "Sample messy input", "Rejected-row report", "Verifier output"],
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
      expectedArtifacts: ["Type definitions", "Screenshot or demo link", "Verifier output", "README data contract section"],
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
      expectedArtifacts: ["Schema/type file", "Passing and failing examples", "Verifier output", "README contract notes"],
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
      acceptanceCriteria: ["Requires local reproduction or substitute evidence", "Requires verifier output", "Flags secret, auth, or public-contract risk"],
      phases: missionPhases("ai-bug-rubric", "an AI bug-review rubric", "rubric applied to two examples"),
      starterPrompt: "Write a rubric that decides whether an AI-suggested bug fix is safe to accept, then apply it to one accepted and one rejected example.",
      verificationCommands: ["markdownlint README.md or manual checklist", "run verifier for accepted example"],
      expectedArtifacts: ["Rubric markdown", "Accepted example", "Rejected example", "Verifier output"],
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
      brief: "Build a tiny harness that records prompt intent, model output, human edits, and verifier result.",
      difficulty: "portfolio",
      deliverables: ["Prompt log format", "Verifier script", "Before/after example", "Risk notes"],
      acceptanceCriteria: ["Separates model suggestion from accepted code", "Stores exact verifier result", "Flags hallucinated or unsafe suggestions"],
      phases: missionPhases("ai-test-harness", "an AI verification harness", "a sample run with passing and rejected outputs"),
      starterPrompt: "Create a small local workflow that captures an AI suggestion, the human-edited final version, and the verifier output that justified accepting it.",
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
      expectedArtifacts: ["Metrics output", "Failure examples", "Model-card note", "Verifier output"],
      rubric: ["Metric context is clear", "Failures are analyzed", "Claims are bounded by the data"],
      commonFailureModes: ["Reporting accuracy alone", "No holdout/split note", "No failure examples"],
      portfolioSummaryPrompt: "Summarize this as practical ML evaluation literacy for SWE work.",
      evidenceRequirements: foundationEvidence,
      skillIds: ["skill-ml-metrics", "skill-testing-debugging", "skill-portfolio-evidence"]
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
