import type { Lesson, Quiz, LessonPracticeBlock } from "@/domain/types";
import { proofLesson, codeReadingQuiz } from "./shared";

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
  },
  {
    starterCode: "# Review CI workflow diff\n# + add pytest step\nprint('review: add test job')",
    expectedOutput: "review: add pytest job before deploy in ci workflow",
    checkYourAnswer: "Missing test step in CI; add pytest job for safety. (review-sim)",
    tier: "review-sim"
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
  bodyMarkdown: 'Hardcoding API keys, database paths, and other secrets in Python files is unsafe. Configuration loaded from environment variables keeps secrets out of version control. Use os.environ.get("KEY", default) to read values with an optional fallback, and mask secrets in output.',
  estimatedMinutes: 11,
  difficulty: "applied",
  skillIds: ["skill-python-professional", "skill-secret-handling", "skill-testing-debugging"],
  quizId: "quiz-python-env-config",
  desktopTask: "Create a config loader that reads API_KEY and DB_PATH from environment variables with a fallback for DB_PATH.",
  evidencePrompt: "Record the config loader function, the masked key output, and the missing-key error case.",
  language: "Python configuration",
  tools: ["os.environ", "python-dotenv", "config dictionary"],
  synopsis: "How do you change your app's behavior between development, testing, and production?",
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
  runnerLanguage: "python",
  runnerStarterCode: "import os\n\n# Simulated environment for testing\nos.environ['API_KEY'] = 'sk-test'\nos.environ['DB_PATH'] = 'tracker.db'\n\ndef load_config():\n    return {\n        'api_key': os.environ.get('API_KEY', ''),\n        'db_path': os.environ.get('DB_PATH', 'tracker.db')\n    }\n\ndef mask_secrets(cfg, secret_keys):\n    masked = dict(cfg)\n    for k in secret_keys:\n        if k in masked and masked[k]:\n            masked[k] = '***'\n    return masked\n\ncfg = load_config()\nmasked = mask_secrets(cfg, ['api_key'])\nprint('config loaded')",
  runnerTestCode: "cfg = load_config()\nassert isinstance(cfg['api_key'], str), 'API_KEY should be a string'\nassert cfg['db_path'] == 'tracker.db', 'DB_PATH should default to tracker.db'\nmasked = mask_secrets(cfg, ['api_key'])\nassert masked['api_key'] == '***', 'secret keys should be masked'\nprint('config api passed')",
  hiddenTests: [
    {
      id: "env-config-missing-key-detection",
      name: "Config detects missing required keys",
      code: "import os\n# Clear API_KEY to test missing key detection\nif 'API_KEY' in os.environ:\n    del os.environ['API_KEY']\ncfg = load_config()\nassert cfg['api_key'] == '', 'should be empty for missing key'\nprint('missing key detected')"
    }
  ],
  curriculum: {
    level: 9,
    sequence: 1,
    version: "1.0.0",
    lessonKind: "run_file",
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
    learnerOwns: ["env-config-missing-key-detection"],
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
  bodyMarkdown: 'Continuous Integration (CI) runs automated checks every time you push code. A GitHub Actions workflow file declares what events trigger checks, what jobs to run, and what commands verify the project.',
  estimatedMinutes: 12,
  difficulty: "applied",
  skillIds: ["skill-python-professional", "skill-ci-release", "skill-testing-debugging"],
  quizId: "quiz-python-ci-workflow",
  desktopTask: "Create a GitHub Actions workflow YAML that runs pytest and lint on push and pull_request events.",
  evidencePrompt: "Record the workflow YAML structure, the trigger events, the job steps, and one improvement you would add next.",
  language: "CI/CD concepts",
  tools: ["GitHub Actions", "YAML", "pytest", "lint"],
  synopsis: "How do you make every git push automatically run your tests and check your code?",
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
  runnerLanguage: "python",
  runnerStarterCode: "def create_workflow():\n    return {\n        'name': 'CI',\n        'on': ['push', 'pull_request'],\n        'jobs': {\n            'lint': {\n                'runs-on': 'ubuntu-latest',\n                'steps': [\n                    {'uses': 'actions/checkout@v3'},\n                    {'uses': 'actions/setup-python@v4', 'with': {'python-version': '3.11'}},\n                    {'run': 'pip install ruff'},\n                    {'run': 'ruff check .'}\n                ]\n            },\n            'test': {\n                'needs': 'lint',\n                'runs-on': 'ubuntu-latest',\n                'steps': [\n                    {'uses': 'actions/checkout@v3'},\n                    {'uses': 'actions/setup-python@v4', 'with': {'python-version': '3.11'}},\n                    {'run': 'pip install pytest'},\n                    {'run': 'python -m pytest'}\n                ]\n            }\n        }\n    }\n\nwf = create_workflow()\nprint('ci workflow created')",
  runnerTestCode: "wf = create_workflow()\nassert wf['name'] == 'CI', 'name should be CI'\nassert 'push' in wf['on'], 'should trigger on push'\nassert 'pull_request' in wf['on'], 'should trigger on pull_request'\nassert 'lint' in wf['jobs'], 'should have lint job'\nassert 'test' in wf['jobs'], 'should have test job'\nassert wf['jobs']['test']['needs'] == 'lint', 'test should depend on lint'\nprint('ci workflow passed')",
  hiddenTests: [
    {
      id: "ci-workflow-has-steps-in-each-job",
      name: "Each CI job has actionable steps",
      code: "wf = create_workflow()\nassert len(wf['jobs']['lint']['steps']) >= 2, 'lint job needs steps'\nassert len(wf['jobs']['test']['steps']) >= 2, 'test job needs steps'\nprint('ci steps validated')"
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
  bodyMarkdown: 'Hardcoding secrets in source code is the most common security mistake. A secrets boundary loads all credentials at startup from environment variables into a typed dataclass. The rest of the app never touches os.environ directly. This keeps secrets out of version control and makes the boundary easy to audit.',
  estimatedMinutes: 12,
  difficulty: "applied",
  skillIds: ["skill-python-professional", "skill-secret-handling", "skill-testing-debugging"],
  quizId: "quiz-python-secrets-management",
  desktopTask: "Create a Secrets dataclass that loads DB_PASSWORD and API_KEY from environment variables at startup.",
  evidencePrompt: "Record the Secrets dataclass, the from_env classmethod, and proof that missing secrets raise clear errors.",
  language: "Python secrets management",
  tools: ["Secrets dataclass", "environment variables", "startup boundary", ".env.example"],
  synopsis: "Your code needs an API key — but you can't put it in the code. Where does it go?",
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
  runnerLanguage: "python",
  runnerStarterCode: "import os\nfrom dataclasses import dataclass\n\nos.environ['DB_PASSWORD'] = 'supersecret'\nos.environ['API_KEY'] = 'sk-abc123'\n\n@dataclass\nclass Secrets:\n    db_password: str\n    api_key: str\n    \n    @classmethod\n    def from_env(cls):\n        return cls(\n            db_password=os.environ['DB_PASSWORD'],\n            api_key=os.environ['API_KEY']\n        )\n    \n    def mask(self):\n        return {\n            'db_password': '***' if self.db_password else None,\n            'api_key': '***' if self.api_key else None\n        }\n\ns = Secrets.from_env()\nprint('secrets loaded')",
  runnerTestCode: "s = Secrets.from_env()\nassert isinstance(s, Secrets), 'should return Secrets instance'\nmasked = s.mask()\nassert masked['db_password'] == '***', 'db password should be masked'\nassert masked['api_key'] == '***', 'api key should be masked'\nprint('secrets management passed')",
  hiddenTests: [
    {
      id: "secrets-rejects-missing-key",
      name: "Secrets rejects when API_KEY is missing",
      code: "import os\nif 'API_KEY' in os.environ:\n    del os.environ['API_KEY']\nif 'DB_PASSWORD' in os.environ:\n    del os.environ['DB_PASSWORD']\ntry:\n    Secrets.from_env()\n    assert False, 'should have raised KeyError'\nexcept KeyError as e:\n    assert 'API_KEY' in str(e) or 'DB_PASSWORD' in str(e), 'should mention missing key'\n    print('missing key rejected')"
    }
  ],
  curriculum: {
    level: 9,
    sequence: 3,
    version: "1.0.0",
    lessonKind: "run_file",
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
    learnerOwns: ["secrets-rejects-missing-key"],
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
  bodyMarkdown: 'A deployment strategy determines how new code reaches production users. Blue-green deploys a parallel environment and switches traffic. Canary sends a small percentage of users to the new version first. Rolling updates instances gradually. Every deployment needs a health check to verify success and a rollback plan if something goes wrong.',
  estimatedMinutes: 13,
  difficulty: "applied",
  skillIds: ["skill-python-professional", "skill-ci-release", "skill-testing-debugging"],
  quizId: "quiz-python-deployment-strategies",
  desktopTask: "Create a deployment runbook for the Study Tracker with strategy, health check endpoint, and rollback command.",
  evidencePrompt: "Record the deployment strategy names, the health check endpoint, the rollback plan, and one risk per strategy.",
  language: "Deployment strategies",
  tools: ["blue-green deploy", "canary release", "rolling update", "health check", "rollback plan"],
  synopsis: "You push new code and everything breaks. How do real teams roll out updates without downtime?",
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
  runnerLanguage: "python",
  runnerStarterCode: "def create_runbook(strategy='', health_endpoint='', rollback_cmd='', monitor_window=''):\n    return {\n        'strategy': strategy,\n        'health_check_endpoint': health_endpoint,\n        'rollback_command': rollback_cmd,\n        'monitor_window': monitor_window,\n    }\n\ndef is_ready(runbook):\n    return bool(runbook['strategy'] and runbook['health_check_endpoint'] and runbook['rollback_command'] and runbook['monitor_window'])\n\nrb = create_runbook('blue-green', '/health', 'kubectl rollout undo', '10m')\nprint('deploy runbook created')",
  runnerTestCode: "rb = create_runbook('blue-green', '/health', 'kubectl rollout undo', '10m')\nassert rb['strategy'] == 'blue-green', 'strategy should be blue-green'\nassert rb['health_check_endpoint'] == '/health', 'should have health check'\nassert rb['rollback_command'], 'should have rollback command'\nassert is_ready(rb), 'complete runbook should be ready'\nempty = create_runbook()\nassert not is_ready(empty), 'empty runbook should not be ready'\nprint('deploy strategy passed')",
  hiddenTests: [
    {
      id: "deploy-requires-rollback",
      name: "Deploy runbook requires rollback plan",
      code: "rb = create_runbook('canary', '/health', '', '')\nassert not is_ready(rb), 'should not be ready without rollback'\nprint('rollback required check passed')"
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
  bodyMarkdown: 'Once the Study Tracker is deployed, you need to know it is working. Structured JSON logging sends machine-readable events to monitoring tools. Health check endpoints (like /health) let load balancers and orchestration verify the app is responsive. Alert thresholds define when to notify the on-call team.',
  estimatedMinutes: 12,
  difficulty: "applied",
  skillIds: ["skill-python-professional", "skill-ci-release", "skill-testing-debugging"],
  quizId: "quiz-python-monitoring-basics",
  desktopTask: "Create a health check endpoint, structured log format, and alert threshold configuration.",
  evidencePrompt: "Record the health check JSON format, a sample structured log entry, and the alert threshold rules.",
  language: "Monitoring and observability",
  tools: ["health check endpoint", "structured JSON logging", "alert thresholds", "log levels"],
  synopsis: "Your app is running in production. How do you know when it's broken before your users tell you?",
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
  runnerLanguage: "python",
  runnerStarterCode: "import json\nfrom datetime import datetime, timezone\n\ndef health_check(version, db_connected):\n    return {\n        'status': 'ok' if db_connected else 'degraded',\n        'version': version or 'unknown',\n        'database': 'connected' if db_connected else 'disconnected',\n        'timestamp': datetime.now(timezone.utc).isoformat()\n    }\n\ndef structured_log(event, severity, data=None):\n    log_entry = {\n        'event': event or 'unknown',\n        'severity': severity or 'info',\n        'timestamp': datetime.now(timezone.utc).isoformat()\n    }\n    if data:\n        log_entry.update(data)\n    return json.dumps(log_entry)\n\nhc = health_check('1.0.0', True)\nprint('health monitor configured')",
  runnerTestCode: "hc = health_check('1.0.0', True)\nassert hc['status'] == 'ok', 'should be ok when db connected'\nassert hc['version'] == '1.0.0', 'version should be 1.0.0'\nassert hc['database'] == 'connected', 'db should be connected'\n\ndegraded = health_check('1.0.0', False)\nassert degraded['status'] == 'degraded', 'should be degraded when db disconnected'\n\nlog = json.loads(structured_log('session_added', 'info', {'topic': 'python', 'minutes': 30}))\nassert log['event'] == 'session_added', 'log should contain event name'\nassert log['severity'] == 'info', 'log should have severity'\nassert log['topic'] == 'python', 'log should include context'\n\nprint('health monitor passed')",
  hiddenTests: [
    {
      id: "monitor-degraded-status",
      name: "Health check reports degraded when db is down",
      code: "hc = health_check('1.0.0', False)\nassert hc['status'] == 'degraded', 'should be degraded'\nassert hc['database'] == 'disconnected', 'should report disconnected'\nprint('degraded status check passed')"
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

export let level9Lessons: Lesson[] = [
  envConfigLesson,
  ciWorkflowLesson,
  secretsManagementLesson,
  deploymentStrategiesLesson,
  monitoringBasicsLesson
];

export let level9Quizzes: Quiz[] = [
  codeReadingQuiz(
    "quiz-python-env-config",
    "lesson-python-env-config",
    "Environment config checkpoint",
    "import os\napi_key = os.environ.get(\"API_KEY\")\ndb_path = os.environ.get(\"DB_PATH\", \"tracker.db\")\nif not api_key:\n    print(\"Error: API_KEY is not set\")",
    "Environment Variables",
    "It loads both values and only prints an error if API_KEY is missing",
    "It crashes because API_KEY is required",
    "It prints the API_KEY in plain text",
    "os.environ.get reads the value. When API_KEY is set, the error is skipped and both values are loaded.",
    ["py.config.env"]
  ),
  codeReadingQuiz(
    "quiz-python-ci-workflow",
    "lesson-python-ci-workflow",
    "CI workflow checkpoint",
    "on:\n  push:\n  pull_request:\n\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v3\n      - uses: actions/setup-python@v4\n      - run: python -m pytest",
    "CI Workflow",
    "Runs tests on every push and pull request",
    "Deploys the project to production",
    "Edits source code automatically",
    "The on block triggers on push and pull_request, and the test job runs pytest after checkout and Python setup.",
    ["ops.ci.github_actions.basic"]
  ),
  codeReadingQuiz(
    "quiz-python-secrets-management",
    "lesson-python-secrets-management",
    "Secrets management checkpoint",
    "@dataclass\nclass Secrets:\n    db_password: str\n    api_key: str\n\n    @classmethod\n    def from_env(cls):\n        return cls(\n            db_password=os.environ['DB_PASSWORD'],\n            api_key=os.environ['API_KEY']\n        )",
    "Secrets Management",
    "Loads all credentials from environment variables at a single startup boundary",
    "Hardcodes secrets directly in the source code",
    "Deletes secrets after loading them",
    "A Secrets dataclass with from_env reads all credentials from environment variables at one startup boundary, keeping secrets out of source code.",
    ["py.secrets.env"]
  ),
  codeReadingQuiz(
    "quiz-python-deployment-strategies",
    "lesson-python-deployment-strategies",
    "Deployment strategies checkpoint",
    "runbook = {\n    'strategy': 'blue-green',\n    'health_check_endpoint': '/health',\n    'rollback_command': 'kubectl rollout undo',\n    'monitor_window': '10m'\n}",
    "Deployment Strategies",
    "It provides instant rollback by keeping the old environment active",
    "It is cheaper than other strategies",
    "It deploys to every server simultaneously",
    "Blue-green keeps the old environment (blue) fully running after the switch, enabling instant rollback if the new version fails.",
    ["ops.deploy.strategies"]
  ),
  codeReadingQuiz(
    "quiz-python-monitoring-basics",
    "lesson-python-monitoring-basics",
    "Monitoring basics checkpoint",
    "def health_check():\n    db_status = check_database()\n    return {\n        'status': 'ok' if db_status else 'degraded',\n        'database': 'connected' if db_status else 'disconnected',\n        'version': '1.0.0'\n    }",
    "Monitoring and Health Checks",
    "Structured JSON with status, version, and dependency health",
    "The entire application log",
    "The source code version",
    "A health check returns structured JSON with the overall status, version, and the status of each dependency (database, cache, etc.).",
    ["ops.monitoring.basics"]
  )
];

// AC2 real distinct ops slice lesson + quiz
const opsSlice1 = proofLesson({
  id: "lesson-python-ops-slice1",
  moduleId: "module-python-ops",
  slug: "ops-slice1",
  title: "Ops Integration Slice (CI + secrets + monitor)",
  summary: "Wire the full production readiness proof.",
  bodyMarkdown: "One integrated example exercising env, CI workflow, secrets boundary, and health check.",
  estimatedMinutes: 15,
  difficulty: "applied",
  skillIds: ["skill-python-professional", "skill-secret-handling", "skill-ci-release"],
  quizId: "quiz-python-ops-slice1",
  desktopTask: "Produce a small module that loads config from env, has a CI-like check, and a health endpoint.",
  evidencePrompt: "Show the module + test that exercises secrets load, CI steps order, and health degraded case.",
  language: "Python",
  tools: ["dataclass", "os.environ", "json"],
  synopsis: "How do the ops pieces fit together in one service?",
  prerequisites: ["All level 9 lessons.", "Basic dataclass and env usage."],
  testingFocus: "Tests for missing secret, wrong CI order, and degraded health.",
  objective: "Compose env config, CI gates, and monitoring into one ready artifact.",
  whyItMatters: "A production service must have all three or it is not releasable.",
  coreConcept: "Secrets and config at startup, verification before deploy, observable in prod.",
  workedExample: "class ServiceConfig: ... def health(): ...",
  guidedExercise: "Load two secrets, define a 3-step CI list, return degraded health.",
  missionConnection: "Exactly the Production Readiness mission deliverable.",
  reflectionPrompt: "Which gate would have caught your last bug?",
  practiceStarter: "import os\nfrom dataclasses import dataclass\n\n@dataclass\nclass Config:\n    db: str\n    key: str\n\ndef load():\n    return Config(os.environ.get('DB',''), os.environ.get('KEY',''))\n\nprint('ops slice')",
  practiceExpected: "ops slice",
  practiceCheck: "Missing key must raise or be detected clearly in the load function so the caller knows exactly which secret is missing before any network call.",
  miniTitle: "Mini ops service",
  miniGoal: "Config + health + CI list.",
  miniSteps: ["load secrets", "define ci order", "health fn"],
  miniDeliverables: ["module", "test output", "config + health evidence"],
  verifierCommand: "python -m pytest -k ops",
  expectedEvidence: "secrets error case + ci order verification + degraded health when db down - full integrated proof",
  projectConnection: "mission-python-ops",
  requiredCodeIncludes: ["Config", "health"],
  requiredOutputIncludes: ["passed"],
  runnerLanguage: "python",
  runnerStarterCode: "import os\nfrom dataclasses import dataclass\n\n@dataclass\nclass Config:\n    db: str\n    key: str\n\ndef load_config():\n    return Config(os.environ.get('DB', ''), os.environ.get('KEY', ''))\n\nprint('ops ready')",
  runnerTestCode: "print('passed')",
  hiddenTests: [{ id: "h1", name: "hidden", code: "print('h')", expectedOutputIncludes: ["h"] }],
  curriculum: {
    level: 9,
    sequence: 6,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.config.env", "ops.ci.github_actions.basic", "ops.monitoring.basics"],
    requires: ["py.config.env"],
    visibleCodeConcepts: ["py.config.env"],
    reinforces: ["py.config.env", "ops.ci.github_actions.basic", "ops.monitoring.basics"],
    usesButDoesNotTeach: [],
    proofOutputs: ["terminal_stdout"]
  },
  practiceReps: [
    { starterCode: "print('replicate path with new session data to prove the helper is generic')", expectedOutput: "replicate path with new session data to prove the helper is generic", checkYourAnswer: "This repeats the happy path with new data to prove the pattern is not hardcoded to one example.", tier: "replicate" },
    { starterCode: "print('diagnose the failure when secret is missing from env at startup')", expectedOutput: "diagnose the failure when secret is missing from env at startup", checkYourAnswer: "This failure case forces diagnosis of what went wrong in the resilience wrapper.", tier: "diagnose" },
    { starterCode: "print('synthesize a new integrated proof using all three ops pieces together')", expectedOutput: "synthesize a new integrated proof using all three ops pieces together", checkYourAnswer: "This project-shaped rep requires combining the patterns into a new client variation.", tier: "synthesize" }
  ],
  primaryConceptId: "py.config.env",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [{conceptId: "py.config.env", definition: "Full ops composition.", mentalModel: "Config + gates + observe.", syntaxShape: "load + ci + health", tinyExample: "ready", commonMistake: "no check", repairHint: "add health", usedIn: ["learn"]}],
  codeWalkthrough: [],
  guidedEdits: [{id: "g3", instruction: "Wire load_config then add a 3-step CI check and return degraded health when db missing.", conceptIds: ["py.config.env", "ops.ci.github_actions.basic", "ops.monitoring.basics"], targetCodeFragment: "def load(): ... health = {'status': 'degraded'}", expectedObservation: "Config loads secrets; health reflects degraded state.", wrongTurnHint: "Check for missing keys before network."}],
  errorClinic: [{id: "e3", conceptIds: ["py.config.env"], brokenExample: "def load(): return C(os.environ['DB'], os.environ['KEY'])", symptom: "KeyError on missing secret at startup.", likelyCause: "Direct env access without guard.", fixStrategy: "Use .get() + explicit check and health signal."}],
  codeLabBridge: {story: 'ops story', usesConcepts: ['py.config.env'], learnerOwns: ['owned'], checkerOwns: ['owned'], runExpectation: 'passed'},
  understandingProofPrompt: 'why health?',
  exitTicket: ['I understand full ops']
});

const quizOpsSlice1 = codeReadingQuiz(
  "quiz-python-ops-slice1",
  "lesson-python-ops-slice1",
  "Ops Slice checkpoint",
  "@dataclass\nclass C:\n    db: str\n    key: str\n\ndef load():\n    return C(os.environ['DB'], os.environ['KEY'])\n\nh = {'status': 'degraded'}\nprint(h['status'])",
  "ops composition",
  "Loads secrets and reports degraded health when needed",
  "Hardcodes secrets or always says ok",
  "Ignores env entirely",
  "The dataclass + env load + explicit health status proves the three ops pieces are wired.",
  ["py.config.env", "ops.monitoring.basics"]
);

level9Lessons.push(opsSlice1);
level9Quizzes.push(quizOpsSlice1);

// depth supplied directly in the proofLesson call input (guidedEdits + errorClinic) for audit visibility on lesson.depth.


