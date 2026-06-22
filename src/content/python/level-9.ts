import type { Lesson, Quiz, LessonPracticeBlock } from "@/domain/types";
import { proofLesson } from "./shared";

// ---------------------------------------------------------------------------
// Practice Reps for Level 9
// ---------------------------------------------------------------------------

const pythonEnvConfigPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "import os\n\n# Read API_KEY and DB_PATH from environment.\napi_key = os.environ.get('API_KEY', '')\ndb_path = os.environ.get('DB_PATH', 'tracker.db')\nprint(f'api_key: {\"***\" if api_key else \"missing\"}')\nprint(f'db_path: {db_path}')",
    expectedOutput: "api_key: *** (masked) and db_path: tracker.db",
    checkYourAnswer: "Repeat the env-read pattern with new variable names. Sensitive values should be masked in output, not printed in plain text.",
    tier: "replicate"
  },
  {
    starterCode: "import os\n\n# Return the value or a clear error when a required env var is missing.\napi_key = os.environ.get('API_KEY')\nif not api_key:\n    print('missing API_KEY')",
    expectedOutput: "missing API_KEY printed when the environment variable is not set.",
    checkYourAnswer: "This failure rep proves missing env vars produce visible errors, not silent None values that crash later.",
    tier: "diagnose"
  },
  {
    starterCode: "config = {\n    'api_key': os.environ.get('API_KEY'),\n    'db_path': os.environ.get('DB_PATH', 'tracker.db'),\n}\n# Use config dict so the rest of the app does not call os.environ directly.\nprint(config)",
    expectedOutput: "A config dictionary with loaded values, keeping os.environ calls at the boundary.",
    checkYourAnswer: "Project-shaped config: environment reads happen once at startup, and the rest of the app uses the config dict.",
    tier: "synthesize"
  }
];

const pythonCiWorkflowPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "ci_steps = [\n    {'name': 'Checkout code'},\n    {'name': 'Set up Python'},\n]\n# Add lint and test steps.\nprint(ci_steps)",
    expectedOutput: "The workflow includes checkout, Python setup, lint, and test steps.",
    checkYourAnswer: "Repeat the CI pattern with new lint and test step names. A CI workflow should declare all verification steps explicitly.",
    tier: "replicate"
  },
  {
    starterCode: "ci_steps = [{'name': 'Deploy'}, {'name': 'Notify'}]\n# These run before lint and tests. Mark this as wrong.\nprint(ci_steps)",
    expectedOutput: "This workflow is wrong because deploy runs before tests and lint, which could ship broken code.",
    checkYourAnswer: "This failure rep shows the wrong order. Tests and lint should gate deployment, not run after it.",
    tier: "diagnose"
  },
  {
    starterCode: "ci_triggers = ['push', 'pull_request']\nci_jobs = ['lint', 'test', 'deploy']\nprint(ci_triggers)\nprint(ci_jobs)",
    expectedOutput: "push and pull_request triggers, with lint, test, and deploy jobs.",
    checkYourAnswer: "Project-shaped CI: the workflow file should specify which events trigger it and what jobs run in what order.",
    tier: "synthesize"
  }
];

// ---- Secrets Management Practice Reps ----

const pythonSecretsPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "import os\n\n# Read DB_PASSWORD and API_KEY from environment, never hardcode.\ndb_password = os.environ.get('DB_PASSWORD')\napi_key = os.environ.get('API_KEY')\nprint(f'db configured: {bool(db_password)}')\nprint(f'api configured: {bool(api_key)}')",
    expectedOutput: "db configured: True and api configured: True when env vars are set.",
    checkYourAnswer: "Repeat the pattern with new secret names. Secrets should always come from the environment, not from hardcoded source code.",
    tier: "replicate"
  },
  {
    starterCode: "import os\n\n# This prints the actual API key in logs\napi_key = os.environ.get('API_KEY', 'fallback')\nprint(f'Connecting with key {api_key}')",
    expectedOutput: "The printed output contains the API_KEY value in plain text, exposing the secret to anyone viewing logs or terminal output.",
    checkYourAnswer: "This failure rep shows the risk of printing secret values. Logged secrets can be exposed in CI logs, terminal history, and support tickets.",
    tier: "diagnose"
  },
  {
    starterCode: "from dataclasses import dataclass\nimport os\n\n@dataclass\nclass Secrets:\n    db_password: str\n    api_key: str\n    \n    @classmethod\n    def from_env(cls):\n        return cls(\n            db_password=os.environ['DB_PASSWORD'],\n            api_key=os.environ['API_KEY']\n        )\n\n# Load secrets at startup boundary\nsecrets = Secrets.from_env()\nprint(f'Secrets loaded: {bool(secrets.db_password)}')",
    expectedOutput: "Secrets loaded: True, proving the secrets boundary loads values at startup without exposing them in output.",
    checkYourAnswer: "Project-shaped secrets: load all secrets at a single startup boundary into a typed dataclass. The rest of the app never calls os.environ directly.",
    tier: "synthesize"
  }
];

// ---- Deployment Strategies Practice Reps ----

const pythonDeploymentPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "# Deployment strategies define how new code reaches production.\nstrategies = ['blue-green', 'canary', 'rolling']\nrollback_plan = 'revert to previous version'\nprint(strategies)\nprint(rollback_plan)",
    expectedOutput: "blue-green, canary, rolling deployment strategies plus a rollback plan.",
    checkYourAnswer: "Repeat the pattern with your own deployment keywords. Every deployment should name a strategy and a rollback approach.",
    tier: "replicate"
  },
  {
    starterCode: "# This deployment skips health checks and monitoring.\ndeploy = {'strategy': 'rolling', 'health_check': False, 'rollback': False}\nprint(f'Deploy strategy: {deploy[\"strategy\"]}')\nprint(f'Safe to deploy: {deploy[\"health_check\"] and deploy[\"rollback\"]}')",
    expectedOutput: "Safe to deploy: False because health_check and rollback are not set up.",
    checkYourAnswer: "This failure rep proves deployment readiness requires health checks and rollback plans. Skipping them means broken code can reach users undetected.",
    tier: "diagnose"
  },
  {
    starterCode: "# Deployment runbook for the Study Tracker\nrunbook = {\n    'strategy': 'blue-green',\n    'health_check_endpoint': '/health',\n    'rollback_command': 'kubectl rollout undo deployment/study-tracker',\n    'monitor_window': '10 minutes'\n}\nprint(f'Strategy: {runbook[\"strategy\"]}')\nprint(f'Health check: {runbook[\"health_check_endpoint\"]}')\nprint(f'Rollback: {runbook[\"rollback_command\"]}')",
    expectedOutput: "A complete deployment runbook with strategy, health check, rollback command, and monitor window.",
    checkYourAnswer: "Project-shaped deployment: a runbook documents the strategy, how to verify success, and how to rollback. Every deploy should be repeatable from these instructions.",
    tier: "synthesize"
  }
];

// ---- Monitoring Basics Practice Reps ----

const pythonMonitoringPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "# Basic health check for the Study Tracker\nimport json\nhealth = {'status': 'ok', 'timestamp': '2026-06-21T10:00:00Z', 'version': '1.0.0'}\nprint(json.dumps(health))",
    expectedOutput: "A JSON health check response with status, timestamp, and version.",
    checkYourAnswer: "Repeat the pattern with extra fields like uptime or database_connected. A health check endpoint should return structured JSON for monitoring tools to parse.",
    tier: "replicate"
  },
  {
    starterCode: "# This health check always returns 'ok' even when the database is disconnected\nhealth = {'status': 'ok', 'database': 'disconnected'}\nprint(f'Reported: {health[\"status\"]}')\nprint(f'Database: {health[\"database\"]}')",
    expectedOutput: "Reported: ok but Database: disconnected — the status field is misleading because it does not reflect the actual database state.",
    checkYourAnswer: "This failure rep shows a dishonest health check. The status field should aggregate sub-check results, not always report 'ok'.",
    tier: "diagnose"
  },
  {
    starterCode: "# Structured logging with JSON format\nimport logging\nimport json\n\nlogging.basicConfig(level=logging.INFO)\nlogger = logging.getLogger('study_tracker')\n\nlog_entry = {\n    'event': 'session_added',\n    'topic': 'python',\n    'minutes': 30,\n    'severity': 'info'\n}\nlogger.info(json.dumps(log_entry))\nprint('Monitoring configured')",
    expectedOutput: "A JSON log entry with event, topic, minutes, and severity fields ready for monitoring ingestion.",
    checkYourAnswer: "Project-shaped monitoring: structured JSON logs let monitoring tools parse and alert on specific fields. Log levels (info, warning, error) help filter signal from noise.",
    tier: "synthesize"
  }
];

// ---------------------------------------------------------------------------
// Lesson 1 — Load Config From Environment Variables (concept_only)
// ---------------------------------------------------------------------------

const envConfigLesson = proofLesson({
  id: "lesson-python-env-config",
  moduleId: "module-python-ops",
  slug: "python-env-config",
  title: "Load Config From Environment Variables",
  summary: "Keep secrets out of source code by loading configuration from environment variables.",
  bodyMarkdown: `> **🏗️ Concept Lab** — This lesson uses a JavaScript sandbox to demonstrate the pattern because real \`os.environ\` and GitHub Actions workflows require a Python runtime with OS access that the mobile sandbox cannot provide. Focus on understanding the concept and pattern — you'll apply these in your own Python environment.\n\nHardcoding API keys, database paths, and other secrets in Python files is unsafe. A .env file keeps configuration separate from code, and python-dotenv loads it into environment variables at runtime. (Note: this concept-only lesson uses a JavaScript sandbox to demonstrate the pattern since the real os.environ requires a Python runtime.)`,
  estimatedMinutes: 11,
  difficulty: "applied",
  skillIds: ["skill-python-professional", "skill-secret-handling", "skill-testing-debugging"],
  quizId: "quiz-python-env-config",
  desktopTask: "Create a config loader that reads API_KEY and DB_PATH from environment variables with a fallback for DB_PATH.",
  evidencePrompt: "Record the config loader function, the masked key output, and the missing-key error case.",
  language: "Python configuration",
  tools: ["os.environ", "python-dotenv", "config dictionary"],
  synopsis: "You are learning how to keep secrets out of source code by loading configuration from environment variables. An environment variable is a named value stored outside the program, typically set in a .env file or the shell.",
  prerequisites: [
    "Know that API keys should not be hardcoded in source files.",
    "Know that a .env file stores key=value pairs."
  ],
  testingFocus: "You will test that the config loader reads expected values, masks secrets in output, and reports missing required variables clearly.",
  objective: "Load API configuration from environment variables instead of hardcoded values.",
  whyItMatters: "Hardcoded secrets in source code are the most common beginner security mistake. Environment variables keep credentials out of version control.",
  coreConcept: "Environment variables store configuration outside the program. os.environ.get('KEY', default) reads a value with an optional fallback. python-dotenv loads variables from a .env file so they are available in os.environ at runtime.",
  workedExample: "os.environ.get('API_KEY', '') reads the API_KEY variable, returning empty string as fallback if not set.",
  guidedExercise: "Write a config loader that reads API_KEY and DB_PATH from environment, masks the key in output, and raises a clear error if API_KEY is missing.",
  missionConnection: "This prepares professional-grade credential handling before the CI/CD and deployment lessons.",
  reflectionPrompt: "Which configuration values should be required (no default), and which should have safe fallback defaults?",
  practiceStarter: "import os\n\napi_key = os.environ.get('API_KEY')\ndb_path = os.environ.get('DB_PATH', 'tracker.db')\n\nprint(f'Config: db_path={db_path}')\nif not api_key:\n    print('Error: API_KEY is not set')",
  practiceExpected: "Config output shows db_path and an error if API_KEY is missing.",
  practiceCheck: "If the code prints the actual API_KEY value in plain text, secrets are at risk. Mask or validate required keys before using them.",
  practiceReps: pythonEnvConfigPracticeReps,
  miniTitle: "Create an env-based config loader",
  miniGoal: "Build a config dictionary that reads API_KEY and DB_PATH from environment variables.",
  miniSteps: ["Read API_KEY with no default", "Read DB_PATH with a default of tracker.db", "Mask the API_KEY in output", "Error if API_KEY is missing"],
  miniDeliverables: ["Config dictionary", "Masked output", "Missing-key error case"],
  verifierCommand: "API_KEY=secret python -c 'import os; print(os.environ.get(\"API_KEY\"))'",
  expectedEvidence: "Command output showing the API_KEY is loaded from the environment, plus proof that omitting API_KEY produces a clear error.",
  projectConnection: "This adds professional credential handling to the integration utility.",
  requiredCodeIncludes: ["os.environ.get", "API_KEY", "DB_PATH"],
  requiredOutputIncludes: ["config", "api", "passed"],
  runnerLanguage: "javascript",
  runnerStarterCode: "const config = {\n  dotenv: true,\n  loadFromEnv: function(vars) {\n    // Concept: os.environ.get() reads a value with optional default.\n    return vars.reduce((cfg, {key, fallback}) => {\n      cfg[key] = process.env[key] || fallback || null;\n      return cfg;\n    }, {});\n  },\n  maskSecrets: function(cfg, secretKeys) {\n    const masked = {...cfg};\n    secretKeys.forEach(k => { if (masked[k]) masked[k] = '***'; });\n    return masked;\n  }\n};\n\nconst loaded = config.loadFromEnv([\n  {key: 'API_KEY'},\n  {key: 'DB_PATH', fallback: 'tracker.db'}\n]);\nconsole.log('config loaded');",
  runnerTestCode: "const cfg = config.loadFromEnv([\n  {key: 'API_KEY', fallback: ''},\n  {key: 'DB_PATH', fallback: 'tracker.db'}\n]);\nif (typeof cfg.API_KEY !== 'string') throw new Error('API_KEY should be a string');\nif (cfg.DB_PATH !== 'tracker.db') throw new Error('DB_PATH should default to tracker.db');\nconst masked = config.maskSecrets(cfg, ['API_KEY']);\nif (masked.API_KEY !== '***') throw new Error('secret keys should be masked');\nconsole.log('config api passed');",
  hiddenTests: [
    {
      id: "env-config-missing-key-detection",
      name: "Config detects missing required keys",
      code: "const result = config.loadFromEnv([{key: 'REQUIRED_KEY'}]);\nif (result.REQUIRED_KEY) throw new Error('should be null for missing key');\nconsole.log('missing key detected');"
    }
  ],
  curriculum: {
    level: 9,
    sequence: 1,
    version: "1.0.0",
    lessonKind: "concept_only",
    teaches: ["py.config.env"],
    requires: ["py.config.loader"],
    visibleCodeConcepts: ["py.config.env"],
    quizConcepts: ["py.config.env"],
    usesButDoesNotTeach: ["py.import"],
    proofOutputs: ["terminal_stdout"]
  }
});

envConfigLesson.depth = {
  primaryConceptId: "py.config.env",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.config.env",
      definition: "Storing configuration values such as API keys and database paths in environment variables or .env files instead of hardcoding them in source code.",
      mentalModel: "Think of environment variables as a locker next to your desk. Your program knows the locker number (variable name) and can open it to retrieve the contents, but the contents are not written on the program itself. Only people with access to the locker can see the secret.",
      syntaxShape: "os.environ.get('KEY') or os.getenv('KEY', 'default')",
      tinyExample: "os.environ.get('API_KEY')",
      commonMistake: "Hardcoding secrets inside the source file, which leaks credentials when the code is shared or committed to version control.",
      repairHint: "Use os.environ.get() to read values at startup, and add .env to .gitignore so the file is never committed.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-env-1",
      label: "Read env var with fallback",
      codeFragment: "os.environ.get('DB_PATH', 'tracker.db')",
      conceptIds: ["py.config.env"],
      explanation: "Reads the DB_PATH environment variable. If it is not set, uses 'tracker.db' as the default fallback value.",
      learnerShouldBeAbleToSay: "I use os.environ.get with a second argument to provide a sensible default when the variable is not set."
    },
    {
      id: "w-env-2",
      label: "Detect missing required key",
      codeFragment: "if not api_key:\n    print('Error: API_KEY is not set')",
      conceptIds: ["py.config.env"],
      explanation: "Checks if the required API_KEY variable has a value and reports an error if it is missing, instead of silently continuing with None.",
      learnerShouldBeAbleToSay: "I verify required environment variables are present before the app uses them."
    }
  ],
  guidedEdits: [
    {
      id: "g-env-1",
      instruction: "Read API_KEY from the environment using os.environ.get with no default, and print an error if it is missing.",
      conceptIds: ["py.config.env"],
      targetCodeFragment: "api_key = os.environ.get('API_KEY')\ndb_path = os.environ.get('DB_PATH', 'tracker.db')",
      expectedObservation: "The script reports an error when API_KEY is not set, instead of silently using None.",
      wrongTurnHint: "Add an if not api_key: check and print an error message before the config summary."
    },
    {
      id: "g-env-2",
      instruction: "Mask the api_key value in the printed output so secrets are not exposed in logs.",
      conceptIds: ["py.config.env"],
      targetCodeFragment: "print(f'Config: db_path={db_path}')",
      expectedObservation: "The api_key value is replaced with *** in the printed configuration summary.",
      wrongTurnHint: "Use a conditional: api_key_display = '***' if api_key else 'missing' and print that instead of the raw value."
    }
  ],
  errorClinic: [
    {
      id: "e-env-1",
      conceptIds: ["py.config.env"],
      brokenExample: "api_key = 'sk-abc123'\ndb_path = 'tracker.db'",
      symptom: "When the code is committed to Git, the API key is visible in the repository history to anyone with access.",
      likelyCause: "Hardcoding the secret directly in the source file instead of reading it from an environment variable.",
      fixStrategy: "Replace hardcoded values with os.environ.get('API_KEY') and store the real key in a .env file listed in .gitignore."
    },
    {
      id: "e-env-2",
      conceptIds: ["py.config.env"],
      brokenExample: "print(f'Connecting with key {api_key}')",
      symptom: "Logs or terminal output contain the plain-text API key, which could be exposed in screenshots, CI logs, or support tickets.",
      likelyCause: "Printing the raw secret value directly in output or log messages.",
      fixStrategy: "Mask secret values before printing: use '***' instead of the actual key in any output or logging."
    }
  ],
  codeLabBridge: {
    story: "The tracker needs an API key to fetch sessions. Hardcoding it in the source would expose the credential. Loading it from the environment keeps the code safe to share.",
    usesConcepts: ["py.config.env"],
    learnerOwns: [],
    checkerOwns: ["env-config-missing-key-detection"],
    runExpectation: "prints config api passed"
  },
  understandingProofPrompt: "Why does putting .env in .gitignore protect the secret even when using environment variables correctly?",
  exitTicket: [
    "I know how to read configuration from environment variables with fallback defaults.",
    "I understand why secrets should be masked in output and kept out of version control."
  ]
};

// ---------------------------------------------------------------------------
// Lesson 2 — Automate Verification With CI (concept_only)
// ---------------------------------------------------------------------------

const ciWorkflowLesson = proofLesson({
  id: "lesson-python-ci-workflow",
  moduleId: "module-python-ops",
  slug: "python-ci-workflow",
  title: "Automate Verification With CI",
  summary: "Create a GitHub Actions workflow that runs tests and lint on every push.",
  bodyMarkdown: `> **🏗️ Concept Lab** — This lesson uses a JavaScript sandbox to demonstrate the pattern because real \`os.environ\` and GitHub Actions workflows require a Python runtime with OS access that the mobile sandbox cannot provide. Focus on understanding the concept and pattern — you'll apply these in your own Python environment.\n\nContinuous Integration (CI) runs automated checks every time you push code. A GitHub Actions workflow file declares what events trigger checks, what jobs to run, and what commands verify the project.`,
  estimatedMinutes: 12,
  difficulty: "applied",
  skillIds: ["skill-python-professional", "skill-ci-release", "skill-testing-debugging"],
  quizId: "quiz-python-ci-workflow",
  desktopTask: "Create a GitHub Actions workflow YAML that runs pytest and lint on push and pull_request events.",
  evidencePrompt: "Record the workflow YAML structure, the trigger events, the job steps, and one improvement you would add next.",
  language: "CI/CD concepts",
  tools: ["GitHub Actions", "YAML", "pytest", "lint"],
  synopsis: "You are learning how to automate code verification with GitHub Actions. A CI workflow is a YAML file that tells GitHub what commands to run when code is pushed or a pull request is opened.",
  prerequisites: [
    "Know what pytest and lint commands do.",
    "Know the concept of a git push and pull request."
  ],
  testingFocus: "You will test that the workflow YAML describes correct trigger events, has at least two jobs, and that one job depends on another.",
  objective: "Design a GitHub Actions workflow that verifies the project on every push.",
  whyItMatters: "Manual verification is unreliable. CI runs the same checks every time so nothing is forgotten before deployment.",
  coreConcept: "A GitHub Actions workflow is a YAML file in .github/workflows/. It defines triggers (push, pull_request), jobs (lint, test, deploy), and steps (checkout, setup, run commands). Jobs can depend on each other.",
  workedExample: "A workflow triggered on push runs 'pip install pytest && python -m pytest' in the test job after checkout and Python setup steps.",
  guidedExercise: "Write a GitHub Actions workflow YAML that runs lint and test jobs, with test depending on lint passing first.",
  missionConnection: "This adds automated quality gates to the project, making it ready for professional team workflows.",
  reflectionPrompt: "What would happen if lint failed but tests passed? Should the deploy job still run?",
  practiceStarter: "name: CI\n\non:\n  push:\n  pull_request:\n\njobs:\n  lint:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - uses: actions/setup-python@v4\n        with:\n          python-version: '3.11'\n      - run: pip install ruff\n      - run: ruff check .\n\n  test:\n    needs: lint\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - uses: actions/setup-python@v4\n        with:\n          python-version: '3.11'\n      - run: pip install pytest\n      - run: python -m pytest",
  practiceExpected: "Workflow YAML with name, on triggers, and separate lint and test jobs.",
  practiceCheck: "If test does not depend on lint, broken formatting can reach deployment before tests run. Use needs: lint to gate the test job.",
  practiceReps: pythonCiWorkflowPracticeReps,
  miniTitle: "Create a CI workflow file",
  miniGoal: "Write a GitHub Actions workflow that triggers on push and runs lint then test jobs.",
  miniSteps: ["Name the workflow and set push/pull_request triggers", "Add a lint job with actions/checkout and ruff check", "Add a test job that needs lint and runs pytest"],
  miniDeliverables: ["Workflow YAML content", "Trigger event list", "Job dependency structure"],
  verifierCommand: "gh workflow run CI && gh run watch",
  expectedEvidence: "GitHub Actions run output showing lint and test jobs passing for the project.",
  projectConnection: "This adds professional CI verification to the tracker project.",
  requiredCodeIncludes: ["name:", "on:", "push", "pull_request", "jobs:", "lint", "test"],
  requiredOutputIncludes: ["ci", "workflow", "passed"],
  runnerLanguage: "javascript",
  runnerStarterCode: "function createWorkflow() {\n  return {\n    name: 'CI',\n    on: ['push', 'pull_request'],\n    jobs: {\n      lint: {\n        'runs-on': 'ubuntu-latest',\n        steps: [\n          { uses: 'actions/checkout@v3' },\n          { uses: 'actions/setup-python@v4', with: { 'python-version': '3.11' } },\n          { run: 'pip install ruff' },\n          { run: 'ruff check .' }\n        ]\n      },\n      test: {\n        needs: 'lint',\n        'runs-on': 'ubuntu-latest',\n        steps: [\n          { uses: 'actions/checkout@v3' },\n          { uses: 'actions/setup-python@v4', with: { 'python-version': '3.11' } },\n          { run: 'pip install pytest' },\n          { run: 'python -m pytest' }\n        ]\n      }\n    }\n  };\n}\n\nconst wf = createWorkflow();\nconsole.log('ci workflow created');",
  runnerTestCode: "const wf = createWorkflow();\nif (wf.name !== 'CI') throw new Error('name should be CI');\nif (!wf.on.includes('push')) throw new Error('should trigger on push');\nif (!wf.on.includes('pull_request')) throw new Error('should trigger on pull_request');\nif (!wf.jobs.lint) throw new Error('should have lint job');\nif (!wf.jobs.test) throw new Error('should have test job');\nif (wf.jobs.test.needs !== 'lint') throw new Error('test should depend on lint');\nconsole.log('ci workflow passed');",
  hiddenTests: [
    {
      id: "ci-workflow-has-steps-in-each-job",
      name: "Each CI job has actionable steps",
      code: "const wf = createWorkflow();\nif (!wf.jobs.lint.steps || wf.jobs.lint.steps.length < 2) throw new Error('lint job needs steps');\nif (!wf.jobs.test.steps || wf.jobs.test.steps.length < 2) throw new Error('test job needs steps');\nconsole.log('ci steps validated');"
    }
  ],
  curriculum: {
    level: 9,
    sequence: 2,
    version: "1.0.0",
    lessonKind: "concept_only",
    teaches: ["ops.ci.github_actions.basic"],
    requires: ["py.ci.workflow"],
    visibleCodeConcepts: ["ops.ci.github_actions.basic"],
    quizConcepts: ["ops.ci.github_actions.basic"],
    proofOutputs: ["terminal_stdout"]
  }
});

ciWorkflowLesson.depth = {
  primaryConceptId: "ops.ci.github_actions.basic",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "ops.ci.github_actions.basic",
      definition: "Automating code verification, linting, and testing by defining event-driven workflows using GitHub Actions YAML configuration.",
      mentalModel: "Think of a CI workflow as a robot quality inspector. Every time you push code (event), the robot wakes up, runs through its checklist (jobs), and reports whether the code passes or fails — all without you having to remember each step.",
      syntaxShape: ".github/workflows/ci.yml with name, on, jobs, steps",
      tinyExample: "name: CI\non: [push]\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - run: pytest",
      commonMistake: "Putting all commands in one job instead of separating concerns (lint vs test vs deploy), making it harder to see which step failed.",
      repairHint: "Create separate jobs for lint, test, and deploy, and use needs to define dependencies between them.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-ci-1",
      label: "Define workflow triggers",
      codeFragment: "on:\n  push:\n  pull_request:",
      conceptIds: ["ops.ci.github_actions.basic"],
      explanation: "Tells GitHub to run the workflow every time code is pushed to any branch or a pull request is opened or updated.",
      learnerShouldBeAbleToSay: "I configure the workflow to run automatically on push and pull_request events."
    },
    {
      id: "w-ci-2",
      label: "Job dependency with needs",
      codeFragment: "test:\n    needs: lint",
      conceptIds: ["ops.ci.github_actions.basic"],
      explanation: "Declares that the test job depends on the lint job completing successfully first. If lint fails, test is skipped automatically.",
      learnerShouldBeAbleToSay: "I use needs to make sure lint passes before tests run, creating a quality gate."
    }
  ],
  guidedEdits: [
    {
      id: "g-ci-1",
      instruction: "Add a test job that needs lint to run first. It should check out code, set up Python, install pytest, and run python -m pytest.",
      conceptIds: ["ops.ci.github_actions.basic"],
      targetCodeFragment: "jobs:\n  lint:",
      expectedObservation: "The workflow has a test job that depends on lint using needs: lint.",
      wrongTurnHint: "Add a new job block after lint, set needs: lint, and include checkout, setup-python, pip install pytest, and pytest steps."
    },
    {
      id: "g-ci-2",
      instruction: "Add pull_request to the trigger events so PRs are also verified.",
      conceptIds: ["ops.ci.github_actions.basic"],
      targetCodeFragment: "on:\n  push:",
      expectedObservation: "The workflow triggers on both push and pull_request events.",
      wrongTurnHint: "Add a line with pull_request: under the on: block, at the same indentation level as push:."
    }
  ],
  errorClinic: [
    {
      id: "e-ci-1",
      conceptIds: ["ops.ci.github_actions.basic"],
      brokenExample: "jobs:\n  test:\n    steps:\n      - run: python -m pytest",
      symptom: "The workflow fails because Python and pytest are not installed in the runner environment.",
      likelyCause: "Missing setup steps: actions/checkout and actions/setup-python must run before any Python commands.",
      fixStrategy: "Add uses: actions/checkout@v3 and uses: actions/setup-python@v4 before the run step."
    },
    {
      id: "e-ci-2",
      conceptIds: ["ops.ci.github_actions.basic"],
      brokenExample: "jobs:\n  deploy:\n    steps:\n      - run: ./deploy.sh",
      symptom: "Broken code is deployed because lint and test jobs are not required before deployment.",
      likelyCause: "The deploy job does not declare needs: [lint, test], so it runs even when verification fails.",
      fixStrategy: "Set needs: [lint, test] on the deploy job so it only runs after all verification jobs pass."
    }
  ],
  codeLabBridge: {
    story: "With test and lint commands ready locally, a CI workflow automates them on every push so nothing is forgotten.",
    usesConcepts: ["ops.ci.github_actions.basic"],
    learnerOwns: [],
    checkerOwns: ["ci-workflow-has-steps-in-each-job"],
    runExpectation: "prints ci workflow passed"
  },
  understandingProofPrompt: "Why should the test job depend on lint using needs: lint instead of running both in parallel?",
  exitTicket: [
    "I know how to write a GitHub Actions workflow with triggers and jobs.",
    "I understand why CI workflows should gate deployment behind passing verification jobs."
  ]
};

// ---------------------------------------------------------------------------
// Lesson 3 — Manage Secrets With Environment Variables (concept_only)
// ---------------------------------------------------------------------------

const secretsManagementLesson = proofLesson({
  id: "lesson-python-secrets-management",
  moduleId: "module-python-ops",
  slug: "python-secrets-management",
  title: "Manage Secrets With Environment Variables",
  summary: "Load API keys, database passwords, and other secrets from the environment using a typed boundary.",
  bodyMarkdown: `> **🏗️ Concept Lab** — This lesson uses a JavaScript sandbox to demonstrate the pattern because real \`os.environ\` requires a Python runtime with OS access that the mobile sandbox cannot provide. Focus on understanding the concept and pattern — you'll apply these in your own Python environment.\n\nHardcoding secrets in source code is the most common security mistake. A secrets boundary loads all credentials at startup from environment variables into a typed dataclass. The rest of the app never touches \`os.environ\` directly. This keeps secrets out of version control and makes the boundary easy to audit.`,
  estimatedMinutes: 12,
  difficulty: "applied",
  skillIds: ["skill-python-professional", "skill-secret-handling", "skill-testing-debugging"],
  quizId: "quiz-python-secrets-management",
  desktopTask: "Create a Secrets dataclass that loads DB_PASSWORD and API_KEY from environment variables at startup.",
  evidencePrompt: "Record the Secrets dataclass, the from_env classmethod, and proof that missing secrets raise clear errors.",
  language: "Python secrets management",
  tools: ["Secrets dataclass", "environment variables", "startup boundary", ".env.example"],
  synopsis: "You are learning how to keep secrets out of source code by loading them at a single startup boundary. A Secrets dataclass collects all credentials in one place so the rest of the app never handles raw secrets.",
  prerequisites: [
    "Know how to load config from environment variables.",
    "Know that hardcoded secrets in git history are exposed to everyone with repo access."
  ],
  testingFocus: "You will test that the secrets boundary loads expected values, masks secrets in output, and reports missing required credentials clearly.",
  objective: "Create a typed secrets boundary that loads credentials from environment variables at startup.",
  whyItMatters: "Hardcoded credentials are the #1 cause of leaked secrets in open-source projects. A single startup boundary makes secret handling auditable and safe.",
  coreConcept: "A Secrets dataclass with a from_env classmethod loads all credentials at a single startup boundary. Required secrets raise errors immediately if missing. The rest of the app receives the typed Secrets object and never accesses os.environ.",
  workedExample: "Secrets.from_env() returns Secrets(db_password='...', api_key='...') after reading from environment variables.",
  guidedExercise: "Create a Secrets dataclass with from_env that loads DB_PASSWORD and API_KEY, validates they are present, and raises ValueError if any are missing.",
  missionConnection: "This adds professional secret handling to the deploy pipeline, protecting production credentials.",
  reflectionPrompt: "Should default values ever be provided for secrets like API keys and database passwords, or should they always be required?",
  practiceStarter: "import os\n\n# Create a Secrets class with from_env that loads secrets.\nprint('Loading secrets at startup boundary...')\nprint('Secrets boundary configured')",
  practiceExpected: "Secrets are loaded at startup from environment variables with clear error messages for missing required values.",
  practiceCheck: "If the code provides default values for secrets (like 'default_password'), those defaults could accidentally be used in production. Required secrets should have no defaults.",
  practiceReps: pythonSecretsPracticeReps,
  miniTitle: "Create a typed secrets boundary",
  miniGoal: "Build a Secrets dataclass that loads credentials from environment variables at startup.",
  miniSteps: ["Define Secrets dataclass with db_password and api_key fields", "Implement from_env classmethod", "Validate required secrets are present", "Mask secrets in output and logs"],
  miniDeliverables: ["Secrets dataclass", "from_env classmethod", "Missing-secret error handling"],
  verifierCommand: "DB_PASSWORD=secret API_KEY=key python -c 'from secrets_config import Secrets; s = Secrets.from_env()'",
  expectedEvidence: "Command output showing secrets loaded successfully, plus proof that omitting a required secret raises a clear error.",
  projectConnection: "This protects production credentials before the Study Tracker is deployed to a real server.",
  requiredCodeIncludes: ["Secrets", "from_env", "db_password", "api_key"],
  requiredOutputIncludes: ["secrets", "loaded", "passed"],
  runnerLanguage: "javascript",
  runnerStarterCode: "class Secrets {\n  constructor(env) {\n    this.dbPassword = env.DB_PASSWORD || null;\n    this.apiKey = env.API_KEY || null;\n  }\n  \n  static fromEnv(env) {\n    const s = new Secrets(env);\n    if (!s.dbPassword) throw new Error('DB_PASSWORD is required');\n    if (!s.apiKey) throw new Error('API_KEY is required');\n    return s;\n  }\n  \n  mask() {\n    return {\n      dbPassword: this.dbPassword ? '***' : null,\n      apiKey: this.apiKey ? '***' : null\n    };\n  }\n}\n\nconst env = { DB_PASSWORD: 'supersecret', API_KEY: 'sk-abc123' };\nconst s = Secrets.fromEnv(env);\nconsole.log('secrets loaded');",
  runnerTestCode: "const env = { DB_PASSWORD: 'supersecret', API_KEY: 'sk-abc123' };\nconst s = Secrets.fromEnv(env);\nif (!(s instanceof Secrets)) throw new Error('should return Secrets instance');\nconst masked = s.mask();\nif (masked.dbPassword !== '***') throw new Error('db password should be masked');\nif (masked.apiKey !== '***') throw new Error('api key should be masked');\ntry {\n  Secrets.fromEnv({});\n  throw new Error('should throw for missing secrets');\n} catch (e) {\n  if (!e.message.includes('required')) throw new Error('error should mention required');\n}\nconsole.log('secrets management passed');",
  hiddenTests: [
    {
      id: "secrets-rejects-missing-key",
      name: "Secrets rejects when API_KEY is missing",
      code: "try {\n  Secrets.fromEnv({ DB_PASSWORD: 'pw123' });\n  throw new Error('should have thrown');\n} catch (e) {\n  if (!e.message.includes('API_KEY')) throw new Error('should mention missing API_KEY');\n  console.log('missing key rejected');\n}"
    }
  ],
  curriculum: {
    level: 9,
    sequence: 3,
    version: "1.0.0",
    lessonKind: "concept_only",
    teaches: ["py.secrets.env"],
    requires: ["py.config.env", "py.file.input"],
    visibleCodeConcepts: ["py.secrets.env"],
    quizConcepts: ["py.secrets.env"],
    usesButDoesNotTeach: ["py.import"],
    proofOutputs: ["terminal_stdout"]
  }
});

secretsManagementLesson.depth = {
  primaryConceptId: "py.secrets.env",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.secrets.env",
      definition: "A security pattern that loads all credentials (API keys, passwords, tokens) from environment variables at a single startup boundary, never from hardcoded source code.",
      mentalModel: "Think of the passwords boundary like a secure lockbox at the entrance of a building. The lockbox holds all keys (secrets). People inside the building never carry the master key — they get access through the lockbox.",
      syntaxShape: "@dataclass\nclass Secrets:\n    db_password: str\n    api_key: str\n    @classmethod\n    def from_env(cls):\n        return cls(db_password=os.environ['DB_PASSWORD'],\n                    api_key=os.environ['API_KEY'])",
      tinyExample: "Secrets.from_env() is called once at startup and the instance is passed to code that needs it.",
      commonMistake: "Providing default fallback values for secrets (e.g., os.environ.get('API_KEY', 'dev-key')) which could accidentally be used in production.",
      repairHint: "Use os.environ['KEY'] (which raises KeyError if missing) instead of os.environ.get with a default. Required secrets should always fail loudly when absent.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-sec-1",
      label: "Secrets from_env boundary",
      codeFragment: "@dataclass\nclass Secrets:\n    db_password: str\n    api_key: str\n\n    @classmethod\n    def from_env(cls):\n        return cls(\n            db_password=os.environ['DB_PASSWORD'],\n            api_key=os.environ['API_KEY']\n        )",
      conceptIds: ["py.secrets.env"],
      explanation: "Defines a dataclass with all secret fields. The from_env classmethod reads each secret from os.environ using bracket access (which raises KeyError if missing).",
      learnerShouldBeAbleToSay: "I use a dataclass with a from_env classmethod to load all secrets at one startup boundary."
    },
    {
      id: "w-sec-2",
      label: "No defaults for secrets",
      codeFragment: "db_password=os.environ['DB_PASSWORD']  # raises KeyError if missing",
      conceptIds: ["py.secrets.env"],
      explanation: "Uses bracket access instead of .get() so missing secrets fail immediately with a clear error, not with a silent None.",
      learnerShouldBeAbleToSay: "I use os.environ['KEY'] instead of os.environ.get to ensure missing required secrets fail immediately."
    }
  ],
  guidedEdits: [
    {
      id: "g-sec-1",
      instruction: "Rename db_password to db_password and add an api_key field to the Secrets dataclass.",
      conceptIds: ["py.secrets.env"],
      targetCodeFragment: "class Secrets:",
      expectedObservation: "The Secrets dataclass now holds both db_password and api_key fields.",
      wrongTurnHint: "Use @dataclass decorator and add the new field with a type annotation: api_key: str."
    },
    {
      id: "g-sec-2",
      instruction: "Add a from_env classmethod that reads DB_PASSWORD and API_KEY from the environment.",
      conceptIds: ["py.secrets.env"],
      targetCodeFragment: "@dataclass\nclass Secrets:\n    db_password: str\n    api_key: str",
      expectedObservation: "Secrets.from_env() reads both values from environment variables and returns a Secrets instance.",
      wrongTurnHint: "Use os.environ['KEY'] for required secrets. Add a @classmethod that returns cls(db_password=os.environ['DB_PASSWORD'], api_key=os.environ['API_KEY'])."
    }
  ],
  errorClinic: [
    {
      id: "e-sec-1",
      conceptIds: ["py.secrets.env"],
      brokenExample: "db_password = os.environ.get('DB_PASSWORD', 'default_pass')",
      symptom: "When DB_PASSWORD is not set, the code silently uses 'default_pass' instead of failing, potentially exposing a weak default in production.",
      likelyCause: "Using .get() with a default value instead of bracket access for required secrets.",
      fixStrategy: "Replace os.environ.get with os.environ['DB_PASSWORD'] so missing secrets raise KeyError immediately."
    },
    {
      id: "e-sec-2",
      conceptIds: ["py.secrets.env"],
      brokenExample: "print(f'Connecting to database with password {db_password}')",
      symptom: "The plain-text password appears in logs, terminal output, or CI logs, exposing the credential.",
      likelyCause: "Printing or logging the raw secret value instead of masking it.",
      fixStrategy: "Never log or print secret values. Use '***' in any output that includes credential information."
    }
  ],
  codeLabBridge: {
    story: "The tracker needs database credentials and API keys to run. Hardcoding them would expose secrets. A typed Secrets boundary loads everything at startup from the environment.",
    usesConcepts: ["py.secrets.env"],
    learnerOwns: [],
    checkerOwns: ["secrets-rejects-missing-key"],
    runExpectation: "prints secrets management passed"
  },
  understandingProofPrompt: "Why should secrets use os.environ['KEY'] (no default) instead of os.environ.get('KEY', 'default')? What incident could a silent default cause?",
  exitTicket: [
    "I know how to create a typed secrets boundary that loads credentials from environment variables.",
    "I understand why required secrets should never have default fallback values."
  ]
};

// ---------------------------------------------------------------------------
// Lesson 4 — Production Deployment Strategies (concept_only)
// ---------------------------------------------------------------------------

const deploymentStrategiesLesson = proofLesson({
  id: "lesson-python-deployment-strategies",
  moduleId: "module-python-ops",
  slug: "python-deployment-strategies",
  title: "Choose Safe Deployment Strategies",
  summary: "Deploy the Study Tracker using blue-green, canary, or rolling strategies with health checks and rollback plans.",
  bodyMarkdown: `> **🏗️ Concept Lab** — This lesson uses a JavaScript sandbox to demonstrate the pattern because real deployment orchestration requires a cloud environment that the mobile sandbox cannot provide. Focus on understanding the concept and pattern — you'll apply these in your own Python environment.\n\nA deployment strategy determines how new code reaches production users. Blue-green deploys a parallel environment and switches traffic. Canary sends a small percentage of users to the new version first. Rolling updates instances gradually. Every deployment needs a health check to verify success and a rollback plan if something goes wrong.`,
  estimatedMinutes: 13,
  difficulty: "applied",
  skillIds: ["skill-python-professional", "skill-ci-release", "skill-testing-debugging"],
  quizId: "quiz-python-deployment-strategies",
  desktopTask: "Create a deployment runbook for the Study Tracker with strategy, health check endpoint, and rollback command.",
  evidencePrompt: "Record the deployment strategy names, the health check endpoint, the rollback plan, and one risk per strategy.",
  language: "Deployment strategies",
  tools: ["blue-green deploy", "canary release", "rolling update", "health check", "rollback plan"],
  synopsis: "You are learning how to deploy code safely. A deployment strategy controls how new software reaches users, minimizing downtime and risk. Each strategy has different trade-offs between speed, safety, and cost.",
  prerequisites: [
    "Know that CI runs automated checks before deployment.",
    "Know the difference between development and production environments."
  ],
  testingFocus: "You will test that the deployment runbook names a strategy, a health check endpoint, a rollback command, and that missing health checks block deployment.",
  objective: "Design a safe deployment runbook with strategy, health check, and rollback plan.",
  whyItMatters: "Deploying without a strategy risks downtime for all users. A runbook documents the exact steps to deploy, verify, and rollback so incidents are handled systematically.",
  coreConcept: "A deployment runbook documents: the strategy (blue-green, canary, or rolling), the health check endpoint (e.g., /health), the rollback command, and the monitoring window. Each strategy trades off speed vs safety.",
  workedExample: "A blue-green deploy creates a new environment (green), runs health checks, switches traffic from blue to green, then keeps blue as rollback target.",
  guidedExercise: "Write a deployment runbook for the Study Tracker that names the strategy, health check endpoint, rollback command, and monitoring window.",
  missionConnection: "This prepares the ops workflow for deploying the Study Tracker to a real server.",
  reflectionPrompt: "When would you choose a canary deploy over blue-green? What additional monitoring does a canary need?",
  practiceStarter: "# Deployment runbook for Study Tracker\nrunbook = {\n    'strategy': '',\n    'health_check_endpoint': '',\n    'rollback_command': '',\n    'monitor_window': ''\n}\nprint('Define the deployment runbook fields')",
  practiceExpected: "A complete runbook with strategy, health check, rollback command, and monitor window.",
  practiceCheck: "If the runbook is missing a health check or rollback plan, the deployment is unsafe. Every valid runbook must have all four fields populated.",
  practiceReps: pythonDeploymentPracticeReps,
  miniTitle: "Create a deployment runbook",
  miniGoal: "Write a deployment runbook with strategy, health check, rollback plan, and monitoring window.",
  miniSteps: ["Choose a deployment strategy", "Define the health check endpoint", "Write the rollback command", "Set a monitoring window"],
  miniDeliverables: ["Deployment runbook", "Strategy explanation", "Rollback procedure"],
  verifierCommand: "cat runbook.md or review the deployment checklist manually.",
  expectedEvidence: "A runbook document with strategy, health check endpoint, rollback command, and monitoring window.",
  projectConnection: "This runbook guides the actual deployment of the Study Tracker with professional safety practices.",
  requiredCodeIncludes: ["strategy", "health_check", "rollback"],
  requiredOutputIncludes: ["deploy", "strategy", "passed"],
  runnerLanguage: "javascript",
  runnerStarterCode: `function createRunbook(strategy, healthEndpoint, rollbackCmd, monitorWindow) {
  return {
    strategy: strategy || '',
    healthCheckEndpoint: healthEndpoint || '',
    rollbackCommand: rollbackCmd || '',
    monitorWindow: monitorWindow || '',
    isReady: function() {
      return !!(this.strategy && this.healthCheckEndpoint && this.rollbackCommand && this.monitorWindow);
    }
  };
}

const rb = createRunbook('blue-green', '/health', 'kubectl rollout undo', '10m');
console.log('deploy runbook created');`,
  runnerTestCode: "const rb = createRunbook('blue-green', '/health', 'kubectl rollout undo', '10m');\nif (rb.strategy !== 'blue-green') throw new Error('strategy should be blue-green');\nif (rb.healthCheckEndpoint !== '/health') throw new Error('should have health check');\nif (!rb.rollbackCommand) throw new Error('should have rollback command');\nif (!rb.isReady()) throw new Error('complete runbook should be ready');\nconst empty = createRunbook();\nif (empty.isReady()) throw new Error('empty runbook should not be ready');\nconsole.log('deploy strategy passed');",
  hiddenTests: [
    {
      id: "deploy-requires-rollback",
      name: "Deploy runbook requires rollback plan",
      code: "const rb = createRunbook('canary', '/health', '', '');\nif (rb.isReady()) throw new Error('should not be ready without rollback');\nconsole.log('rollback required check passed');"
    }
  ],
  curriculum: {
    level: 9,
    sequence: 4,
    version: "1.0.0",
    lessonKind: "concept_only",
    teaches: ["ops.deploy.strategies"],
    requires: ["ops.ci.github_actions.basic"],
    visibleCodeConcepts: ["ops.deploy.strategies"],
    quizConcepts: ["ops.deploy.strategies"],
    usesButDoesNotTeach: [],
    proofOutputs: ["terminal_stdout"]
  }
});

deploymentStrategiesLesson.depth = {
  primaryConceptId: "ops.deploy.strategies",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "ops.deploy.strategies",
      definition: "Systematic approaches to releasing new software versions into production, balancing speed, safety, and user impact through techniques like blue-green, canary, and rolling deployments.",
      mentalModel: "Think of deployment strategies like changing a traffic light: blue-green is like building a new intersection entirely before redirecting traffic; canary is like letting one car test the new route first; rolling is like repaving one lane at a time.",
      syntaxShape: "deploy_runbook = {'strategy': 'blue-green', 'health_check': '/health', 'rollback': 'kubectl undo'}",
      tinyExample: "blue-green: deploy to new env, test, switch traffic, keep old env as rollback.",
      commonMistake: "Skipping health checks before switching traffic, so broken code reaches users before anyone notices.",
      repairHint: "Always run health checks against the new environment before routing traffic to it. Automate the check so it cannot be skipped.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-dep-1",
      label: "Blueprint green deployment",
      codeFragment: "blue-green: deploy new version to 'green' env, run health checks,\nswitch traffic from 'blue' to 'green', keep 'blue' as rollback",
      conceptIds: ["ops.deploy.strategies"],
      explanation: "Blue-green maintains two identical environments. The new version deploys to the inactive one, gets verified, then receives all traffic. The previous version remains available for instant rollback.",
      learnerShouldBeAbleToSay: "I understand blue-green deployment keeps a hot standby environment for instant rollback."
    },
    {
      id: "w-dep-2",
      label: "Health check gate",
      codeFragment: "if health_check_passes:\n    switch_traffic(new_version)\nelse:\n    abort_deployment()\n    notify_team()",
      conceptIds: ["ops.deploy.strategies"],
      explanation: "Health checks gate the traffic switch. If the new version fails health checks, deployment aborts automatically and the team is notified.",
      learnerShouldBeAbleToSay: "I know that health checks must pass before traffic is switched to the new version."
    }
  ],
  guidedEdits: [
    {
      id: "g-dep-1",
      instruction: "Add a health check endpoint and rollback command to the deployment runbook.",
      conceptIds: ["ops.deploy.strategies"],
      targetCodeFragment: "runbook = {\n    'strategy': 'blue-green',\n    'health_check_endpoint': '',\n    'rollback_command': ''\n}",
      expectedObservation: "The runbook now has a health check endpoint and rollback command alongside the strategy.",
      wrongTurnHint: "Set health_check_endpoint to '/health' and rollback_command to a specific undo command like 'kubectl rollout undo'."
    },
    {
      id: "g-dep-2",
      instruction: "Make isReady return false when health_check_endpoint is missing.",
      conceptIds: ["ops.deploy.strategies"],
      targetCodeFragment: "isReady: function() {\n    return true;\n}",
      expectedObservation: "The runbook is not ready until health check endpoint is populated.",
      wrongTurnHint: "Check each field: return !!(this.strategy && this.healthCheckEndpoint && this.rollbackCommand && this.monitorWindow)."
    }
  ],
  errorClinic: [
    {
      id: "e-dep-1",
      conceptIds: ["ops.deploy.strategies"],
      brokenExample: "deploy new version directly to production, no health check",
      symptom: "Broken code reaches all users immediately with no way to detect the failure before impact.",
      likelyCause: "Skipping health checks and using a direct-to-production deploy without any safety gate.",
      fixStrategy: "Use a blue-green or canary strategy with automated health checks that gate the traffic switch."
    },
    {
      id: "e-dep-2",
      conceptIds: ["ops.deploy.strategies"],
      brokenExample: "runbook = {'strategy': 'rolling', 'health_check': '/health', 'rollback': ''}",
      symptom: "When the deployment fails, there is no documented rollback procedure, causing extended downtime.",
      likelyCause: "The runbook is missing a rollback command because the team assumed the deployment would work.",
      fixStrategy: "Always document a rollback command before deploying. The rollback target should be the exact previous version identifier."
    }
  ],
  codeLabBridge: {
    story: "With CI passing and secrets configured, the Study Tracker needs a safe deployment strategy. A runbook documents exactly how to deploy, verify, and rollback.",
    usesConcepts: ["ops.deploy.strategies"],
    learnerOwns: [],
    checkerOwns: ["deploy-requires-rollback"],
    runExpectation: "prints deploy strategy passed"
  },
  understandingProofPrompt: "Why is a canary deployment safer than a rolling update for critical changes? What monitoring metrics would make you abort a canary?",
  exitTicket: [
    "I know the differences between blue-green, canary, and rolling deployment strategies.",
    "I understand why every deployment needs a health check gate and a documented rollback plan."
  ]
};

// ---------------------------------------------------------------------------
// Lesson 5 — Monitoring and Health Checks (concept_only)
// ---------------------------------------------------------------------------

const monitoringBasicsLesson = proofLesson({
  id: "lesson-python-monitoring-basics",
  moduleId: "module-python-ops",
  slug: "python-monitoring-basics",
  title: "Add Monitoring and Health Checks",
  summary: "Set up structured logging, health check endpoints, and alert thresholds for the deployed Study Tracker.",
  bodyMarkdown: `> **🏗️ Concept Lab** — This lesson uses a JavaScript sandbox to demonstrate the pattern because real monitoring setup requires a running server environment that the mobile sandbox cannot provide. Focus on understanding the concept and pattern — you'll apply these in your own Python environment.\n\nOnce the Study Tracker is deployed, you need to know it is working. Structured JSON logging sends machine-readable events to monitoring tools. Health check endpoints (like /health) let load balancers and orchestration verify the app is responsive. Alert thresholds define when to notify the on-call team.`,
  estimatedMinutes: 12,
  difficulty: "applied",
  skillIds: ["skill-python-professional", "skill-ci-release", "skill-testing-debugging"],
  quizId: "quiz-python-monitoring-basics",
  desktopTask: "Create a health check endpoint, structured log format, and alert threshold configuration.",
  evidencePrompt: "Record the health check JSON format, a sample structured log entry, and the alert threshold rules.",
  language: "Monitoring and observability",
  tools: ["health check endpoint", "structured JSON logging", "alert thresholds", "log levels"],
  synopsis: "You are learning to monitor a deployed application. Monitoring tells you whether the app is healthy, what errors are occurring, and when to alert the team.",
  prerequisites: [
    "Know the difference between info, warning, and error log levels.",
    "Know that a health check endpoint returns the application status."
  ],
  testingFocus: "You will test that the health check returns all required fields, that structured logs include severity and event name, and that alert thresholds are defined.",
  objective: "Set up health checks, structured logging, and alert thresholds for a deployed application.",
  whyItMatters: "Without monitoring, you discover outages when users report them. Health checks and structured logging let you detect problems before users notice.",
  coreConcept: "A health check endpoint returns structured JSON with status, version, timestamp, and dependency status. Structured logging emits JSON objects with event, severity, and context fields. Alert thresholds define when a metric triggers a notification.",
  workedExample: "GET /health returns {'status': 'ok', 'version': '1.0.0', 'database': 'connected', 'timestamp': '2026-06-21T10:00:00Z'}.",
  guidedExercise: "Create a health check response schema, write a sample structured log entry, and define alert thresholds for database errors and high latency.",
  missionConnection: "This completes the ops workflow: deploy the Study Tracker and monitor it in production.",
  reflectionPrompt: "Which metrics are most important to alert on immediately vs track as trends over time?",
  practiceStarter: "# Health check for the Study Tracker\nhealth = {\n    'status': '',\n    'version': '',\n    'database': '',\n    'timestamp': ''\n}\nprint('Define the health check response shape')",
  practiceExpected: "A complete health check JSON with status, version, database, and timestamp fields.",
  practiceCheck: "If the health check always returns 'ok' even when dependencies are down, it is misleading. Each dependency should have its own check that contributes to the overall status.",
  practiceReps: pythonMonitoringPracticeReps,
  miniTitle: "Create a health check and monitoring config",
  miniGoal: "Design a health check endpoint, structured log format, and alert threshold rules.",
  miniSteps: ["Define the health check response schema", "Create a sample structured log entry", "Set alert thresholds for error rate and latency"],
  miniDeliverables: ["Health check JSON schema", "Sample structured log", "Alert threshold rules"],
  verifierCommand: "curl http://study-tracker.example.com/health or review the monitoring configuration manually.",
  expectedEvidence: "Health check response, sample log entry, and documented alert thresholds.",
  projectConnection: "This monitoring setup keeps the deployed Study Tracker observable in production.",
  requiredCodeIncludes: ["health", "status", "version", "timestamp"],
  requiredOutputIncludes: ["health", "monitor", "passed"],
  runnerLanguage: "javascript",
  runnerStarterCode: `function healthCheck(version, dbConnected) {
  return {
    status: dbConnected ? 'ok' : 'degraded',
    version: version || 'unknown',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  };
}

function structuredLog(event, severity, data) {
  return JSON.stringify({
    event: event || 'unknown',
    severity: severity || 'info',
    timestamp: new Date().toISOString(),
    ...data
  });
}

const hc = healthCheck('1.0.0', true);
console.log('health monitor configured');`,
  runnerTestCode: "const hc = healthCheck('1.0.0', true);\nif (hc.status !== 'ok') throw new Error('should be ok when db connected');\nif (hc.version !== '1.0.0') throw new Error('version should be 1.0.0');\nif (hc.database !== 'connected') throw new Error('db should be connected');\n\nconst degraded = healthCheck('1.0.0', false);\nif (degraded.status !== 'degraded') throw new Error('should be degraded when db disconnected');\n\nconst log = JSON.parse(structuredLog('session_added', 'info', {topic: 'python', minutes: 30}));\nif (log.event !== 'session_added') throw new Error('log should contain event name');\nif (log.severity !== 'info') throw new Error('log should have severity');\nif (log.topic !== 'python') throw new Error('log should include context');\n\nconsole.log('health monitor passed');",
  hiddenTests: [
    {
      id: "monitor-degraded-status",
      name: "Health check reports degraded when db is down",
      code: "const hc = healthCheck('1.0.0', false);\nif (hc.status !== 'degraded') throw new Error('should be degraded');\nif (hc.database !== 'disconnected') throw new Error('should report disconnected');\nconsole.log('degraded status check passed');"
    }
  ],
  curriculum: {
    level: 9,
    sequence: 5,
    version: "1.0.0",
    lessonKind: "concept_only",
    teaches: ["ops.monitoring.basics"],
    requires: [],
    visibleCodeConcepts: ["ops.monitoring.basics"],
    quizConcepts: ["ops.monitoring.basics"],
    usesButDoesNotTeach: ["py.json", "py.import", "py.logging", "py.logging.warning"],
    proofOutputs: ["terminal_stdout"]
  }
});

monitoringBasicsLesson.depth = {
  primaryConceptId: "ops.monitoring.basics",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "ops.monitoring.basics",
      definition: "The practice of tracking application health, errors, and performance through structured logging, health check endpoints, and configurable alert thresholds.",
      mentalModel: "Think of monitoring like a car dashboard: the health check is the 'check engine' light, structured logs are the diagnostic data stream, and alerts are the warning chimes for specific conditions.",
      syntaxShape: "health = {'status': 'ok', 'version': '1.0.0', 'database': 'connected'}",
      tinyExample: "GET /health returns JSON with status, version, and dependency checks.",
      commonMistake: "Health check always returns 'ok' even when database or other dependencies are down, hiding problems from operators.",
      repairHint: "Check each dependency individually and aggregate their status. The top-level status should reflect the worst dependency state.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-mon-1",
      label: "Health check with dependency status",
      codeFragment: "def health_check():\n    db_status = check_database()\n    return {\n        'status': 'ok' if db_status else 'degraded',\n        'database': 'connected' if db_status else 'disconnected',\n        'version': '1.0.0'\n    }",
      conceptIds: ["ops.monitoring.basics"],
      explanation: "Checks the database connection and returns a JSON response with the aggregated status. If the database is down, status becomes 'degraded' instead of 'ok'.",
      learnerShouldBeAbleToSay: "I check each dependency individually in the health check and report the worst status."
    },
    {
      id: "w-mon-2",
      label: "Structured JSON logging",
      codeFragment: "import logging\nimport json\nlogger = logging.getLogger('study_tracker')\nlogger.info(json.dumps({'event': 'session_added', 'topic': 'python', 'minutes': 30}))",
      conceptIds: ["ops.monitoring.basics"],
      explanation: "Emits a structured JSON log entry that monitoring tools can parse. Each entry has an event name, severity, and context fields.",
      learnerShouldBeAbleToSay: "I use structured JSON logging so monitoring tools can filter and alert on specific events."
    }
  ],
  guidedEdits: [
    {
      id: "g-mon-1",
      instruction: "Add a database field to the health check that reports 'connected' or 'disconnected' based on the dbConnected parameter.",
      conceptIds: ["ops.monitoring.basics"],
      targetCodeFragment: "function healthCheck(version, dbConnected) {\n    return {\n        status: 'ok',\n        version: version || 'unknown'\n    };\n}",
      expectedObservation: "The health check now reports database status and sets overall status to 'degraded' when disconnected.",
      wrongTurnHint: "Add a database field: database: dbConnected ? 'connected' : 'disconnected'. Change status to 'degraded' when dbConnected is false."
    },
    {
      id: "g-mon-2",
      instruction: "Add event, severity, and context data to the structured log entry.",
      conceptIds: ["ops.monitoring.basics"],
      targetCodeFragment: "function structuredLog(event, severity, data) {\n    return JSON.stringify({});\n}",
      expectedObservation: "The log entry includes event name, severity, timestamp, and context fields.",
      wrongTurnHint: "Return JSON.stringify({event, severity, timestamp: new Date().toISOString(), ...data})."
    }
  ],
  errorClinic: [
    {
      id: "e-mon-1",
      conceptIds: ["ops.monitoring.basics"],
      brokenExample: "def health_check():\n    return {'status': 'ok'}",
      symptom: "The health check always says 'ok' even when the database is disconnected or the app is broken.",
      likelyCause: "The health check does not check any dependencies. It reports status without verifying anything.",
      fixStrategy: "Add individual checks for each dependency (database, cache, upstream API) and aggregate their status into the response."
    },
    {
      id: "e-mon-2",
      conceptIds: ["ops.monitoring.basics"],
      brokenExample: "print(f'Session added: {topic}')",
      symptom: "Logs are unstructured text that monitoring tools cannot parse reliably, making automated alerting impossible.",
      likelyCause: "Using plain print or f-string logging instead of structured JSON format.",
      fixStrategy: "Replace print statements with structured logging using JSON format: logger.info(json.dumps({'event': 'session_added', 'topic': topic}))."
    }
  ],
  codeLabBridge: {
    story: "After deploying the Study Tracker with a safe strategy, monitoring tells you it is healthy. Health checks, structured logs, and alerts keep the deployment observable.",
    usesConcepts: ["ops.monitoring.basics"],
    learnerOwns: [],
    checkerOwns: ["monitor-degraded-status"],
    runExpectation: "prints health monitor passed"
  },
  understandingProofPrompt: "Why should a health check check each dependency individually rather than returning a blanket status? What is the difference between 'degraded' and 'down'?",
  exitTicket: [
    "I know how to design a health check endpoint with dependency status.",
    "I understand the role of structured logging and alert thresholds in production monitoring."
  ]
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const level9Lessons: Lesson[] = [
  envConfigLesson,
  ciWorkflowLesson,
  secretsManagementLesson,
  deploymentStrategiesLesson,
  monitoringBasicsLesson
];

export const level9Quizzes: Quiz[] = [
  {
    id: "quiz-python-env-config",
    lessonId: "lesson-python-env-config",
    title: "Environment config checkpoint",
    passingScore: 80,
    questions: [
      {
        id: "question-python-env-config-1",
        prompt: "What does this code do when API_KEY is set?\n```python\nimport os\napi_key = os.environ.get(\"API_KEY\")\ndb_path = os.environ.get(\"DB_PATH\", \"tracker.db\")\nif not api_key:\n    print(\"Error: API_KEY is not set\")\n```",
        choices: ["It crashes because API_KEY is required", "It prints the API_KEY in plain text", "It loads both values and only prints an error if API_KEY is missing"],
        correctChoiceIndex: 2,
        conceptIds: ["py.config.env"],
        explanation: "os.environ.get reads the value. When API_KEY is set, the error is skipped and both values are loaded."
      },
      {
        id: "question-python-env-config-2",
        prompt: "You committed a file with api_key = \"sk-abc123\" hardcoded. After a teammate clones the repo, what is the risk?",
        choices: ["The code will not run because the API key is hardcoded in git history", "The API key is now visible to everyone with access to the repository", "The program ignores hardcoded values"],
        correctChoiceIndex: 1,
        conceptIds: ["py.config.env"],
        explanation: "Hardcoded credentials in source code are visible in the git history to anyone who can access the repo."
      },
      {
        id: "question-python-env-config-3",
        prompt: "Why load all environment config at startup into a dictionary instead of calling os.environ.get throughout the code?",
        choices: ["Because it keeps os.environ calls at a single boundary and makes the rest of the code independent of the environment", "Because os.environ.get is slow", "Because dictionaries cannot hold environment values"],
        correctChoiceIndex: 0,
        conceptIds: ["py.config.env"],
        explanation: "Loading config at the boundary centralizes environment access and makes the rest of the code testable with different config values."
      }
    ]
  },
  {
    id: "quiz-python-ci-workflow",
    lessonId: "lesson-python-ci-workflow",
    title: "CI workflow checkpoint",
    passingScore: 80,
    questions: [
      {
        id: "question-python-ci-workflow-1",
        prompt: "What does this CI workflow snippet do?\n```yaml\non:\n  push:\n  pull_request:\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - uses: actions/setup-python@v4\n      - run: python -m pytest\n```",
        choices: ["Runs tests on every push and pull request", "Deploys the project to production", "Edits source code automatically"],
        correctChoiceIndex: 0,
        explanation: "The on block triggers on push and pull_request, and the test job runs pytest after checkout and Python setup.",
        conceptIds: ["ops.ci.github_actions.basic"]
      },
      {
        id: "question-python-ci-workflow-2",
        prompt: "Your CI workflow deploys to production before tests have finished. What should you add to prevent this?",
        choices: ["Run deploy before checkout", "Remove the deploy job entirely", "Add needs: [lint, test] to the deploy job so it waits for verification"],
        correctChoiceIndex: 2,
        explanation: "The needs keyword creates a dependency so deploy only runs after lint and test jobs succeed.",
        conceptIds: ["ops.ci.github_actions.basic"]
      },
      {
        id: "question-python-ci-workflow-3",
        prompt: "Why include separate lint and test jobs instead of running everything in one job?",
        choices: ["Because one job cannot run multiple commands", "Because separate jobs make failures easier to identify and can run in parallel", "Because lint is always faster than tests"],
        correctChoiceIndex: 1,
        conceptIds: ["ops.ci.github_actions.basic"],
        explanation: "Separate jobs with clear names make the CI output easier to read and allow parallel execution."
      }
    ]
  },
  {
    id: "quiz-python-secrets-management",
    lessonId: "lesson-python-secrets-management",
    title: "Secrets management checkpoint",
    passingScore: 80,
    questions: [
      {
        id: "question-python-secrets-management-1",
        prompt: "What does a Secrets dataclass with a from_env classmethod do?",
        choices: ["Loads all credentials from environment variables at a single startup boundary", "Hardcodes secrets directly in the source code", "Deletes secrets after loading them"],
        correctChoiceIndex: 0,
        conceptIds: ["py.secrets.env"],
        explanation: "A Secrets dataclass with from_env reads all credentials from environment variables at one startup boundary, keeping secrets out of source code."
      },
      {
        id: "question-python-secrets-management-2",
        prompt: "Why should required secrets use os.environ['KEY'] instead of os.environ.get('KEY')?",
        choices: ["Because bracket access is faster", "Because they are equivalent", "Because bracket access raises KeyError immediately if the secret is missing, preventing silent None values"],
        correctChoiceIndex: 2,
        conceptIds: ["py.secrets.env"],
        explanation: "os.environ['KEY'] raises KeyError immediately if the variable is not set, failing loudly instead of silently returning None."
      },
      {
        id: "question-python-secrets-management-3",
        prompt: "A teammate prints the API key in a log statement for debugging. What is the risk?",
        choices: ["No risk because logs are private", "The API key is exposed in log files, CI output, and potentially support tickets", "Printing makes the code run faster"],
        correctChoiceIndex: 1,
        conceptIds: ["py.secrets.env"],
        explanation: "Logging secrets exposes them in log files, CI output, terminal history, and support tickets. Secrets should always be masked or omitted from output."
      }
    ]
  },
  {
    id: "quiz-python-deployment-strategies",
    lessonId: "lesson-python-deployment-strategies",
    title: "Deployment strategies checkpoint",
    passingScore: 80,
    questions: [
      {
        id: "question-python-deployment-strategies-1",
        prompt: "What is the key advantage of a blue-green deployment?",
        choices: ["It provides instant rollback by keeping the old environment active", "It is cheaper than other strategies", "It deploys to every server simultaneously"],
        correctChoiceIndex: 0,
        conceptIds: ["ops.deploy.strategies"],
        explanation: "Blue-green keeps the old environment (blue) fully running after the switch, enabling instant rollback if the new version fails."
      },
      {
        id: "question-python-deployment-strategies-2",
        prompt: "Your deployment pipeline deploys directly to production without health checks. What should you add?",
        choices: ["More deployment environments", "Faster servers", "A health check gate that verifies the new version before routing traffic"],
        correctChoiceIndex: 2,
        conceptIds: ["ops.deploy.strategies"],
        explanation: "Health checks verify the new version is working before traffic is routed to it, preventing broken code from reaching users."
      },
      {
        id: "question-python-deployment-strategies-3",
        prompt: "What should a deployment runbook include?",
        choices: ["Strategy, health check endpoint, rollback command, and monitoring window", "Only the deployment date", "The source code diff"],
        correctChoiceIndex: 0,
        conceptIds: ["ops.deploy.strategies"],
        explanation: "A complete runbook documents the strategy, how to verify success (health check), how to undo (rollback), and how long to monitor."
      }
    ]
  },
  {
    id: "quiz-python-monitoring-basics",
    lessonId: "lesson-python-monitoring-basics",
    title: "Monitoring basics checkpoint",
    passingScore: 80,
    questions: [
      {
        id: "question-python-monitoring-basics-1",
        prompt: "What does a health check endpoint return?",
        choices: ["Structured JSON with status, version, and dependency health", "The entire application log", "The source code version"],
        correctChoiceIndex: 0,
        conceptIds: ["ops.monitoring.basics"],
        explanation: "A health check returns structured JSON with the overall status, version, and the status of each dependency (database, cache, etc.)."
      },
      {
        id: "question-python-monitoring-basics-2",
        prompt: "Your health check always returns 'ok' even when the database is down. What is the problem?",
        choices: ["No problem — the app still serves requests", "The database eventually recovers automatically", "The health check is dishonest and hides problems from operators and load balancers"],
        correctChoiceIndex: 2,
        conceptIds: ["ops.monitoring.basics"],
        explanation: "A health check that always reports 'ok' prevents operators and automation from detecting and responding to real problems."
      },
      {
        id: "question-python-monitoring-basics-3",
        prompt: "Why use structured JSON logging instead of plain print statements?",
        choices: ["JSON is smaller than plain text", "JSON is easier for humans to read", "Structured logs can be parsed by monitoring tools for automated alerting and analysis"],
        correctChoiceIndex: 2,
        conceptIds: ["ops.monitoring.basics"],
        explanation: "Structured JSON logs let monitoring tools parse fields (event, severity, duration) for automated dashboards and alerting."
      }
    ]
  }
];
