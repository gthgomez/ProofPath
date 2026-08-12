import type { Lesson, LessonPracticeBlock, Quiz } from "@/domain/types";
import { codeReadingQuiz, proofLesson } from "./shared";

// ---------------------------------------------------------------------------
// Practice rep pools
// ---------------------------------------------------------------------------

const pythonRegexPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "import re\nDATE_PATTERN = r''\nSLUG_PATTERN = r''\n# Validate 2026-06-01 and api-client.\nprint('TODO')",
    expectedOutput: "True for 2026-06-01 and True for api-client.",
    checkYourAnswer: "Use new data so you practice the pattern, not the memorized example. Both validators should use fullmatch or anchored checks.",
    tier: "replicate"
  },
  {
    starterCode: "examples = ['2026-06-01-extra', 'Python Basics', 'api_client']\n# Mark each example invalid and say which rule it breaks.\nprint(examples)",
    expectedOutput: "All examples are invalid: partial date, spaces/case, and underscore slug.",
    checkYourAnswer: "This is the failure rep. If a partial date or uppercase slug passes, the validator is accepting more input than the parser contract allows.",
    tier: "diagnose"
  },
  {
    starterCode: "raw_row = {'date': '2026-06-01', 'topic_slug': 'api-client', 'minutes': '30'}\n# Run shape validation before parser conversion.\nprint(raw_row)",
    expectedOutput: "The row passes shape validation before deeper parser checks.",
    checkYourAnswer: "Project-shaped validation happens at the boundary. Regex checks the text shape before date parsing, minute conversion, or business rules run.",
    tier: "synthesize"
  },
  {
    starterCode: "# Review regex validation diff\n# + stricter date pattern\nprint('review: tighten pattern')",
    expectedOutput: "review: tighten DATE_PATTERN to reject malformed dates in input rows",
    checkYourAnswer: "Call out loose regex that accepts bad dates; add stricter pattern + unit test. (review-sim)",
    tier: "review-sim"
  }
];

const pythonServicePracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "tracker = StudyTrackerService()\n# Add python 30 and sql 20, then calculate total minutes.\nprint(tracker)",
    expectedOutput: "total_minutes returns 50 after adding python and sql sessions.",
    checkYourAnswer: "Repeat the same service behavior with new data. The total should come from stored sessions, not from a hardcoded return value.",
    tier: "replicate"
  },
  {
    starterCode: "first = StudyTrackerService()\nsecond = StudyTrackerService()\n# Prove adding to first does not change second.\nprint(first, second)",
    expectedOutput: "The second service still has 0 minutes after the first service changes.",
    checkYourAnswer: "This failure rep catches shared mutable state. Sessions should live on self for each instance, not on the class.",
    tier: "diagnose"
  },
  {
    starterCode: "tracker = StudyTrackerService()\n# Add repeated topics and ask for topic_minutes('python').\nprint(tracker)",
    expectedOutput: "topic_minutes('python') returns only the python total.",
    checkYourAnswer: "Project-shaped service methods answer product questions. A topic total should skip unrelated sessions without changing caller code.",
    tier: "synthesize"
  },
  {
    starterCode: "# Review service diff\n# + totals_by_topic\nprint('review: expose totals')",
    expectedOutput: "review: expose totals_by_topic for dashboard evidence",
    checkYourAnswer: "Missing public totals method for reports; expose it. (review-sim)",
    tier: "review-sim"
  }
];

const pythonSqlitePracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "CREATE TABLE sessions (id INTEGER PRIMARY KEY, date TEXT NOT NULL, topic TEXT NOT NULL, minutes INTEGER NOT NULL);\n-- Insert api and python rows, then query totals by topic.",
    expectedOutput: "api | 25\npython | 30",
    checkYourAnswer: "Repeat persistence with new data. The grouped query should calculate totals from rows, not from handwritten output.",
    tier: "replicate"
  },
  {
    starterCode: "CREATE TABLE sessions (id INTEGER PRIMARY KEY, date TEXT NOT NULL, topic TEXT NOT NULL, minutes INTEGER NOT NULL CHECK (minutes > 0));\n-- Try inserting a negative minutes row inside a transaction.",
    expectedOutput: "The invalid insert fails or rolls back, and no negative minutes row appears.",
    checkYourAnswer: "This failure rep makes persistence safer. A transaction should leave the database in a trustworthy state when one row is invalid.",
    tier: "diagnose"
  },
  {
    starterCode: "class SessionRepository:\n    def add_session(self, session):\n        pass\n    def totals_by_topic(self):\n        return []\nprint(SessionRepository)",
    expectedOutput: "Repository methods hide SQL details behind add_session and totals_by_topic.",
    checkYourAnswer: "Project-shaped persistence keeps SQL at the repository boundary. The service should ask for behavior, not build SQL strings everywhere.",
    tier: "synthesize"
  }
];

const pythonApiPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "payload = [{'date': '2026-06-01', 'topic': 'api', 'minutes': 25}]\nclient = FakeClient(FakeResponse(200, payload))\n# Fetch sessions through the safe client.\nprint(payload)",
    expectedOutput: "The safe client returns the new api session and records timeout=5.",
    checkYourAnswer: "Repeat the success path with new data. The client boundary should not care whether the topic is python, api, or sql.",
    tier: "replicate"
  },
  {
    starterCode: "bad_status = FakeResponse(503, {'error': 'unavailable'})\nbad_shape = FakeResponse(200, {'sessions': 'not a list'})\n# Decide which ApiError each case should raise.\nprint(bad_status.status_code, bad_shape.json())",
    expectedOutput: "Both bad status and bad shape raise ApiError instead of returning fake success.",
    checkYourAnswer: "This failure rep keeps callers honest. Returning an empty list for bad status hides the difference between no sessions and a broken API.",
    tier: "diagnose"
  },
  {
    starterCode: "config = {'base_url': 'https://example.test', 'api_key': 'secret-value'}\n# Keep secret values out of logs and portfolio evidence.\nprint(config['base_url'])",
    expectedOutput: "The client uses base_url configuration while secret values stay out of logs and evidence.",
    checkYourAnswer: "Project-shaped API work includes config and secret boundaries. A beginner client can stay offline while still learning not to log secrets.",
    tier: "synthesize"
  },
  {
    starterCode: "# Review api client diff\n# + timeout handling\nprint('review: add timeout')",
    expectedOutput: "review: add timeout and retry to safe client for resilience",
    checkYourAnswer: "Client lacks timeout/retry; add it for prod safety. (review-sim)",
    tier: "review-sim"
  }
];

const pythonTypeHintPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "from __future__ import annotations\n\ndef format_topic(topic: str) -> str:\n    return topic.capitalize()\n\ndef get_session_summary(minutes: int, notes: str | None = None) -> str:\n    if notes:\n        return f'{minutes} min ({notes})'\n    return f'{minutes} min'\n\nprint(format_topic('python'))\nprint(get_session_summary(30))\nprint(get_session_summary(45, 'deep work'))",
    expectedOutput: "Python\n30 min\n45 min (deep work)",
    checkYourAnswer: "Repeat the typed pattern with new data. The annotations declare what types enter and leave, and the runtime should respect them.",
    tier: "replicate"
  },
  {
    starterCode: "from __future__ import annotations\n\ndef get_tracker_stats(sessions: list) -> dict:\n    return {}\n\n# Pass sessions with and without extra notes field.\nsessions = [{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15, 'notes': 'good'}]\nprint(get_tracker_stats(sessions))",
    expectedOutput: "A dict with total_minutes and session_count, ignoring the absence of optional fields.",
    checkYourAnswer: "This failure rep tests whether the function handles both present and absent optional fields. If it crashes on missing notes, the type hint is misleading.",
    tier: "diagnose"
  },
  {
    starterCode: "from __future__ import annotations\n\nclass SessionInput:\n    def __init__(self, topic: str, minutes: int, notes: str | None = None):\n        self.topic = topic\n        self.minutes = minutes\n        self.notes = notes\n\ndef validate_session(s: SessionInput) -> bool:\n    return bool(s.topic) and s.minutes > 0\n\n# Test valid and invalid session inputs.\nprint(validate_session(SessionInput('python', 30)))\nprint(validate_session(SessionInput('', 30)))",
    expectedOutput: "True for valid session, False for empty topic.",
    checkYourAnswer: "Project-shaped typing: the model declares an optional notes field, and the validator checks required fields without needing notes to be present.",
    tier: "synthesize"
  }
];

const pythonIntegrationCapstonePracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "import sqlite3\nconn = sqlite3.connect(':memory:')\ncur = conn.cursor()\ncur.execute('CREATE TABLE sessions (id INTEGER PRIMARY KEY, topic TEXT, minutes INTEGER)')\ncur.execute('INSERT INTO sessions (topic, minutes) VALUES (?, ?)', ('python', 30))\ncur.execute('INSERT INTO sessions (topic, minutes) VALUES (?, ?)', ('sql', 20))\n# TODO: Query all sessions and print them.\nprint('TODO')",
    expectedOutput: "All inserted sessions are returned by the query, including python (30 min) and sql (20 min).",
    checkYourAnswer: "Use cur.execute('SELECT * FROM sessions') followed by cur.fetchall() to retrieve rows. Confirm both inserted sessions appear.",
    tier: "replicate"
  },
  {
    starterCode: 'import sqlite3\nconn = sqlite3.connect(\':memory:\')\ncur = conn.cursor()\ncur.execute(\'CREATE TABLE sessions (id INTEGER PRIMARY KEY, topic TEXT, minutes INTEGER)\')\ncur.execute("INSERT INTO sessions (topic, minutes) VALUES (\'python\', 30)")\ncur.execute("INSERT INTO sessions (topic, minutes) VALUES (\'python\', 20)")\ncur.execute("INSERT INTO sessions (topic, minutes) VALUES (\'sql\', 15)")\n# Bug: missing GROUP BY in totals query\ncur.execute(\'SELECT topic, SUM(minutes) FROM sessions\')\nprint(cur.fetchall())',
    expectedOutput: "The query returns only one row because GROUP BY is missing. Expected per-topic totals but got a single aggregated row.",
    checkYourAnswer: "Without GROUP BY topic, SUM(minutes) combines every row into one total. Add GROUP BY topic to get per-topic sums.",
    tier: "diagnose"
  },
  {
    starterCode: "class SessionRepository:\n    def __init__(self, db_path):\n        pass\n    def create_table(self):\n        pass\n    def add_session(self, topic, minutes):\n        pass\n    def get_all(self):\n        return []\n    def totals_by_topic(self):\n        return []\n\nclass TrackerService:\n    def __init__(self, repository):\n        pass\n    def add_session(self, topic, minutes):\n        pass\n    def generate_report(self):\n        return ''\n\n# Create repo + service, add data, generate report.\nprint('TODO')",
    expectedOutput: "A report string that lists all sessions with a total at the bottom, built through repository and service layers.",
    checkYourAnswer: "The repository owns the SQL; the service owns the business logic and report formatting. Wire them together so the service calls the repository without building SQL itself.",
    tier: "synthesize"
  }
];

const pythonIntegrationReviewPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "review = {'layers': [{'name': 'sqlite', 'evidence': 'query output', 'risk': 'transaction rollback untested'}], 'commands': [], 'improvement': ''}\n# Add missing layers, commands, and improvement.\nprint(review)",
    expectedOutput: "Review covers every layer, commands, risk, and improvement.",
    checkYourAnswer: "A final review should name risks per layer. If risk is one generic paragraph, it will not guide the next improvement.",
    tier: "replicate"
  },
  {
    starterCode: "risk = 'api timeout handling is weak'\nlayers = [{'name': 'validation'}, {'name': 'api'}, {'name': 'sqlite'}]\n# Link the risk to one known layer.\nprint(risk, layers)",
    expectedOutput: "The risk names the api layer and points to a check or improvement.",
    checkYourAnswer: "This failure-inspection rep ties uncertainty to architecture. Review risk should point at the layer where you would debug first.",
    tier: "diagnose"
  },
  {
    starterCode: "handoff = {'artifact': 'integration-review.md', 'commands': ['python -m pytest'], 'limitation': '', 'next_improvement': ''}\nprint(handoff)",
    expectedOutput: "Handoff includes artifact, commands, limitation, and next improvement.",
    checkYourAnswer: "Project-shaped review leaves a useful artifact for future tracks. The limitation is part of evidence, not an apology.",
    tier: "synthesize"
  }
];

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

const typeHintsLesson = proofLesson({
  id: "lesson-python-type-hints",
  moduleId: "module-python-dashboard",
  slug: "python-type-hints",
  title: "Add Type Hints for Safer Code",
  summary: "Declare function parameter and return types so the tracker tells you what data shape it expects.",
  bodyMarkdown: "Type hints document what a function expects as input and what it guarantees as output. Python does not enforce them at runtime, but they make the code easier to read, test, and review.",
  estimatedMinutes: 13,
  difficulty: "applied",
  skillIds: ["skill-python-professional", "skill-testing-debugging"],
  quizId: "quiz-python-type-hints",
  desktopTask: "Add type hints to study tracker functions and handle Optional fields for session notes and missing data.",
  evidencePrompt: "Record the typed function signatures, one call with a missing optional field, and the test output confirming types pass.",
  language: "Python type hints",
  tools: ["typing", "Optional", "function annotations"],
  synopsis: "What if you could tell Python 'this variable is always a string' and catch bugs before you even run the code?",
  prerequisites: [
    "Know that functions take parameters and return values.",
    "Know that some session fields like notes may be absent."
  ],
  testingFocus: "You will test that typed functions accept correct types, reject incorrect types at the boundary, and handle Optional fields that may be None.",
  objective: "Add type hints to study tracker functions and model fields.",
  whyItMatters: "Type hints turn informal expectations into documented contracts. A reviewer, a linter, or your future self can see what a function expects without reading every line.",
  coreConcept: "A type hint is an annotation on a parameter or return value that declares the expected type. Type | None means the value may be that type or None. Python ignores hints at runtime, but tools like mypy can verify them.",
  workedExample: "def total_minutes(sessions: list[dict]) -> int: adds a contract that sessions is a list of dicts and the return is an integer.",
  guidedExercise: "Add type hints to a session formatting function and handle an optional notes field.",
  missionConnection: "This makes the integration utility easier for reviewers to understand and for tools to check automatically.",
  reflectionPrompt: "Which function in the tracker would benefit most from type hints, and which would benefit least?",
  practiceStarter: "from __future__ import annotations\n\ndef format_session(topic, minutes, notes=None):\n    if notes:\n        return f'{topic}: {minutes} min ({notes})'\n    return f'{topic}: {minutes} min'",
  practiceExpected: "python: 30 min\nsql: 20 min (practice joins)",
  practiceCheck: "If the function works with strings and integers but the annotations say str and int, the contract is honest. If notes=None crashes, the Optional handling is missing.",
  practiceReps: pythonTypeHintPracticeReps,
  miniTitle: "Annotate tracker functions with types",
  miniGoal: "Add type hints and Optional handling to session utility functions.",
  miniSteps: ["Annotate format_session parameters with str, int, str | None", "Return a formatted string with Optional notes included when present", "Test with and without notes values"],
  miniDeliverables: ["Typed function signatures", "Optional handling for notes", "Test output showing type-safe behavior"],
  verifierCommand: "python -m pytest tests/test_typing.py",
  expectedEvidence: "Passing tests proving type-annotated functions handle required and optional parameters correctly.",
  projectConnection: "This adds typed contracts to the integration utility layer.",
  requiredCodeIncludes: ["Optional", "str", "int", "format_session"],
  requiredOutputIncludes: ["typing", "hints", "optional", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "from __future__ import annotations\n\ndef format_session(topic: str, minutes: int, notes: str | None = None) -> str:\n    if notes:\n        return f'{topic}: {minutes} min ({notes})'\n    return f'{topic}: {minutes} min'\n\nprint(format_session('python', 30))\nprint(format_session('sql', 20, 'practice joins'))",
  runnerTestCode: "assert format_session('python', 30) == 'python: 30 min'\nassert format_session('sql', 20, 'practice joins') == 'sql: 20 min (practice joins)'\nresult = format_session('test', 10)\nassert 'None' not in result\nassert isinstance(result, str)\nprint('typing hints optional passed')",
  hiddenTests: [
    {
      id: "typing-hints-handles-missing-notes",
      name: "Type hints handle missing optional notes",
      code: "assert format_session('git', 15) == 'git: 15 min'"
    },
    {
      id: "typing-hints-rejects-bad-minutes-type",
      name: "Type hints document minutes as int",
      code: "annotations = format_session.__annotations__\nassert 'minutes' in annotations\nassert annotations['minutes'] is int or str(annotations['minutes']) != 'str'"
    }
  ],
  curriculum: {
    level: 7,
    sequence: 1,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.typing.hints", "py.typing.optional"],
    requires: ["py.dataclass.model", "py.function.def", "py.return"],
    visibleCodeConcepts: ["py.typing.hints", "py.typing.optional"],
    quizConcepts: ["py.typing.hints", "py.typing.optional"],
    usesButDoesNotTeach: ["py.import"],
    proofOutputs: ["terminal_stdout"]
  }
});

typeHintsLesson.depth = {
  primaryConceptId: "py.typing.hints",
  secondaryConceptIds: ["py.typing.optional"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.typing.hints",
      definition: "Attaching type information to function parameters and return values so that tools and readers can verify the expected data shape without running the code.",
      mentalModel: "Think of type hints as a label on a package. The label says 'this box contains eggs — fragile' and 'this box returns dishes — handle with care.' Python does not check the label, but delivery people (mypy, reviewers) use it to decide how to treat the box.",
      syntaxShape: "def function(param: type) -> return_type:",
      tinyExample: "def add(x: int, y: int) -> int:",
      commonMistake: "Adding type hints that contradict the actual code, like annotating int but returning a string, which misleads reviewers and linters.",
      repairHint: "Run mypy or a type checker on the file to detect mismatches between annotations and actual runtime values.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.typing.optional",
      definition: "Declaring that a parameter or field may hold either a specified type or None, using Type | None from the typing module.",
      mentalModel: "Think of Optional as a question mark on a form: the field may be filled in (a value) or left blank (None). Code that reads an Optional field must handle both cases.",
      syntaxShape: "param: str | None = None",
      tinyExample: "notes: str | None = None",
      commonMistake: "Accessing an Optional value without checking for None first, causing AttributeError when the value is absent.",
      repairHint: "Before using an Optional value, check if it is None: if notes: use notes else: skip or use a default.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-th-1",
      label: "Type annotation on parameters",
      codeFragment: "def format_session(topic: str, minutes: int, notes: str | None = None) -> str:",
      conceptIds: ["py.typing.hints", "py.typing.optional"],
      explanation: "Declares that topic must be a string, minutes an integer, notes an optional string defaulting to None, and the return value is always a string.",
      learnerShouldBeAbleToSay: "I annotate both the parameters and the return type so the contract is fully visible at the function signature."
    },
    {
      id: "w-th-2",
      label: "Handle Optional safely",
      codeFragment: "if notes:\n        return f'{topic}: {minutes} min ({notes})'\n    return f'{topic}: {minutes} min'",
      conceptIds: ["py.typing.optional"],
      explanation: "Checks if notes has a value before including it in the output string, avoiding None appearing in formatted output.",
      learnerShouldBeAbleToSay: "I check whether an Optional value is present before using it, so None never leaks into string output."
    }
  ],
  guidedEdits: [
    {
      id: "g-th-1",
      instruction: "Add type hints to the function parameters: topic should be str, minutes should be int, notes should be str | None with a default of None.",
      conceptIds: ["py.typing.hints"],
      targetCodeFragment: "def format_session(topic, minutes, notes=None):",
      expectedObservation: "The function signature now shows str, int, and str | None annotations.",
      wrongTurnHint: "Add : str after topic, : int after minutes, and : str | None = None after notes. Import Optional from typing."
    },
    {
      id: "g-th-2",
      instruction: "Add a return type annotation -> str to format_session.",
      conceptIds: ["py.typing.hints"],
      targetCodeFragment: "def format_session(topic: str, minutes: int, notes: str | None = None):",
      expectedObservation: "The function signature now explicitly declares it returns a string.",
      wrongTurnHint: "Add -> str between the closing parenthesis and the colon."
    }
  ],
  errorClinic: [
    {
      id: "e-th-1",
      conceptIds: ["py.typing.hints"],
      brokenExample: "def format_session(topic, minutes, notes):\n    return f'{topic}: {minutes} min ({notes})'",
      symptom: "A reviewer cannot tell what types are expected without reading the function body. The function crashes if notes is None.",
      likelyCause: "Missing type annotations and no Optional handling for the notes parameter.",
      fixStrategy: "Add type hints: topic: str, minutes: int, notes: str | None = None, and handle None before formatting."
    },
    {
      id: "e-th-2",
      conceptIds: ["py.typing.optional"],
      brokenExample: "def print_notes(notes: str | None) -> None:\n    print(notes.upper())",
      symptom: "AttributeError: 'NoneType' object has no attribute 'upper' when notes is None.",
      likelyCause: "Calling a string method on an Optional value without checking if it is None first.",
      fixStrategy: "Check if notes is not None before calling .upper(): if notes: print(notes.upper())"
    }
  ],
  codeLabBridge: {
    story: "Before the service layer processes raw session data, type hints help us document what fields the formatting functions expect and what they return.",
    usesConcepts: ["py.typing.hints", "py.typing.optional"],
    learnerOwns: ["format_session"],
    checkerOwns: ["typing-hints-handles-missing-notes", "typing-hints-rejects-bad-minutes-type"],
    runExpectation: "prints typing hints optional passed"
  },
  understandingProofPrompt: "Why do Python type hints not raise errors when the wrong type is passed at runtime? What tool would catch that mismatch instead?",
  exitTicket: [
    "I can add parameter and return type annotations to Python functions.",
    "I understand how to use str | None to handle values that may be None."
  ]
};

const regexValidationLesson = proofLesson({
  id: "lesson-python-regex-validation",
  moduleId: "module-python-dashboard",
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
  language: "Python regex",
  tools: ["re", "parser tests", "input validation"],
  synopsis: "How does a single line of code check if an email, phone number, or date is correctly formatted?",
  prerequisites: [
    "Know that raw rows are strings.",
    "Know why bad dates or topic slugs should be rejected clearly."
  ],
  testingFocus: "You will test valid and invalid date and slug examples with direct assertions, including examples that should fail.",
  objective: "Validate dates and slugs with small regular expressions.",
  whyItMatters: "Real input often needs format checks before deeper parsing. Regex should catch obvious shape problems without hiding business rules.",
  coreConcept: "A regular expression, or regex, is a compact pattern for checking text shape. A regex should be specific enough to reject bad shapes and simple enough for a teammate to review.",
  workedExample: "A YYYY-MM-DD shape check can use ^\\d{4}-\\d{2}-\\d{2}$ before later date parsing validates calendar correctness.",
  guidedExercise: "Write validators for date strings and topic slugs, then test valid and invalid examples.",
  missionConnection: "This closes the regex gap and strengthens parser boundaries for the Study Data Cleaner mission.",
  reflectionPrompt: "Which validation belongs in regex, and which validation should be handled by date or business logic later?",
  commonMistakes: ["Not escaping special characters like . and *", "Using regex for problems that need a parser instead of a pattern match"],
  practiceStarter: "import re\n\nDATE_PATTERN = r\"\"\nSLUG_PATTERN = r\"\"\n\ndef is_valid_date(value):\n    return False\n\ndef is_valid_slug(value):\n    return False\n\nprint(is_valid_date(\"2026-05-08\"))\nprint(is_valid_slug(\"python-basics\"))",
  practiceExpected: "True\nTrue\nFalse for malformed examples",
  practiceCheck: "If bad-2026 passes, your date regex is matching only part of the text. Use anchors or fullmatch so the whole value must match.",
  practiceReps: pythonRegexPracticeReps,
  miniTitle: "Add focused regex validators",
  miniGoal: "Create date and slug validators that reject malformed text before parser conversion.",
  miniSteps: ["Define a date shape regex", "Define a topic slug regex", "Test valid and invalid examples"],
  miniDeliverables: ["DATE_PATTERN", "SLUG_PATTERN", "Validator functions"],
  verifierCommand: "python -m pytest tests/test_validation.py",
  expectedEvidence: "Passing tests showing valid date/slug examples pass and malformed examples fail.",
  projectConnection: "This adds a professional validation boundary to the parser.",
  requiredCodeIncludes: ["re", "DATE_PATTERN", "SLUG_PATTERN", "fullmatch"],
  requiredOutputIncludes: ["date", "slug", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "import re\n\nDATE_PATTERN = r\"\"\nSLUG_PATTERN = r\"\"\n\ndef is_valid_date(value):\n    return False\n\ndef is_valid_slug(value):\n    return False\n\nprint(is_valid_date(\"2026-05-08\"))\nprint(is_valid_slug(\"python-basics\"))",
  runnerTestCode: "assert is_valid_date('2026-05-08') is True\nassert is_valid_date('bad-2026-05-08') is False\nassert is_valid_date('2026-5-8') is False\nassert is_valid_slug('python-basics') is True\nassert is_valid_slug('Python Basics') is False\nprint('date slug passed')",
  hiddenTests: [
    {
      id: "regex-validation-rejects-partials",
      name: "Regex validators reject partial matches",
      code: "assert is_valid_date('2026-05-08-extra') is False\nassert is_valid_slug('python_basics') is False"
    }
  ],
  curriculum: {
    level: 7,
    sequence: 2,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.validation.schema"],
    requires: [],
    visibleCodeConcepts: ["py.validation.schema"],
    quizConcepts: ["py.validation.schema"],
    usesButDoesNotTeach: ["py.import"],
    proofOutputs: ["terminal_stdout"]
  }
});

regexValidationLesson.depth = {
  primaryConceptId: "py.validation.schema",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.validation.schema",
      definition: "Checking text shape at the boundary using clean patterns to prevent invalid data from leaking into the core application logic.",
      mentalModel: "Think of shape validation as a security gate: it checks if your passport matches the required format before you are allowed to enter the country. It doesn't check if you are a nice person; it just checks the layout of your document.",
      syntaxShape: "re.fullmatch(pattern, text) or re.match(pattern, text)",
      tinyExample: "re.fullmatch(r'\\d{4}', '2026')",
      commonMistake: "Forgetting anchors or using partial match functions, allowing values with valid prefixes but invalid suffixes to slip through.",
      repairHint: "Use fullmatch() instead of match() or search(), or explicitly anchor patterns with ^ at the start and $ at the end.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-reg-1",
      label: "Full match check",
      codeFragment: "re.fullmatch(DATE_PATTERN, value)",
      conceptIds: ["py.validation.schema"],
      explanation: "Ensures the pattern matches from the first character to the last character without leaving trailing characters unchecked.",
      learnerShouldBeAbleToSay: "I use fullmatch to ensure the entire string conforms to the pattern, rejecting partial matches."
    }
  ],
  guidedEdits: [
    {
      id: "g-reg-1",
      instruction: "Modify the date pattern to allow optional hyphens, then confirm it passes.",
      conceptIds: ["py.validation.schema"],
      targetCodeFragment: "DATE_PATTERN = r\"\"",
      expectedObservation: "The validation handles both hyphenated and compact date strings.",
      wrongTurnHint: "Be sure to keep the digit counts exact when relaxing formatting requirements."
    }
  ],
  errorClinic: [
    {
      id: "e-reg-1",
      conceptIds: ["py.validation.schema"],
      brokenExample: "re.match(r'\\d{4}-\\d{2}-\\d{2}', '2026-05-08-garbage')",
      symptom: "A dirty string with extra trailing characters is accepted as a valid date.",
      likelyCause: "re.match does not check if the entire string matches; it stops as soon as it finds a valid prefix.",
      fixStrategy: "Use re.fullmatch instead of re.match, or add a trailing anchor $."
    }
  ],
  codeLabBridge: {
    story: "Before we parse sessions from CSV files, we need focused validation helpers to verify that data shapes are clean.",
    usesConcepts: ["py.validation.schema"],
    learnerOwns: ["is_valid_date", "is_valid_slug"],
    checkerOwns: ["regex-validation-rejects-partials"],
    runExpectation: "prints date slug passed"
  },
  understandingProofPrompt: "Why is shape validation at the network or file boundary better than catching ValueError deep in the database layer?",
  exitTicket: [
    "I can write anchored regex patterns for dates and topic slugs.",
    "I understand why fullmatch is safer than partial match searches."
  ]
};

const oopServiceLesson = proofLesson({
  id: "lesson-python-oop-service",
  moduleId: "module-python-dashboard",
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
  language: "Python classes",
  tools: ["classes", "methods", "state tests"],
  synopsis: "When a function isn't enough — how do you organize code that has setup, state, and multiple operations?",
  prerequisites: [
    "Know how functions receive inputs and return values.",
    "Know what session data the tracker stores."
  ],
  testingFocus: "You will test totals and prove two service instances do not accidentally share state.",
  objective: "Use a class when tracker state and behavior belong together.",
  whyItMatters: "Classes are not required for every problem. They become useful when a project needs a clear object that owns state and methods.",
  coreConcept: "A class is a blueprint for creating objects. A service class is an object that owns useful app behavior. It can keep session storage private and expose methods for operations the rest of the app needs.",
  workedExample: "StudyTrackerService().add_session('python', 30) followed by total_minutes() should return 30.",
  guidedExercise: "Implement a service class and prove separate instances keep separate session lists.",
  missionConnection: "This closes the OOP gap and prepares larger Python app workflows.",
  reflectionPrompt: "Which data should the service own, and which data should still be passed into methods explicitly?",
  practiceStarter: "class StudyTrackerService:\n    def __init__(self):\n        pass\n\n    def add_session(self, topic, minutes):\n        pass\n\n    def total_minutes(self):\n        return 0\n\ntracker = StudyTrackerService()\ntracker.add_session('python', 30)\nprint(tracker.total_minutes())",
  practiceExpected: "30\nindependent instances do not share sessions",
  practiceCheck: "If a second tracker starts with the first tracker's sessions, you probably used class-level mutable state. Store sessions on self inside __init__ instead.",
  practiceReps: pythonServicePracticeReps,
  miniTitle: "Build a tracker service class",
  miniGoal: "Create a StudyTrackerService class with isolated state and useful methods.",
  miniSteps: ["Initialize instance session storage", "Add sessions through a method", "Calculate totals through a method"],
  miniDeliverables: ["StudyTrackerService class", "Two method tests", "Independent instance proof"],
  verifierCommand: "python -m pytest tests/test_service.py",
  expectedEvidence: "Passing tests for adding sessions, totals, and independent instances.",
  projectConnection: "This gives the integration mission a professional service layer.",
  requiredCodeIncludes: ["class StudyTrackerService", "__init__", "add_session", "total_minutes"],
  requiredOutputIncludes: ["service", "30", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "class StudyTrackerService:\n    def __init__(self):\n        pass\n\n    def add_session(self, topic, minutes):\n        pass\n\n    def total_minutes(self):\n        return 0\n\ntracker = StudyTrackerService()\ntracker.add_session('python', 30)\nprint(tracker.total_minutes())",
  runnerTestCode: "tracker.add_session('git', 15)\nassert tracker.total_minutes() == 45\nother = StudyTrackerService()\nassert other.total_minutes() == 0\nother.add_session('sql', 20)\nassert other.total_minutes() == 20\nassert tracker.total_minutes() == 45\nprint('service 30 passed')",
  hiddenTests: [
    {
      id: "oop-service-topic-minutes",
      name: "Service supports topic totals when implemented",
      code: "if hasattr(tracker, 'topic_minutes'):\n    assert tracker.topic_minutes('python') == 30"
    }
  ],
  curriculum: {
    level: 7,
    sequence: 3,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.dataclass"],
    requires: ["py.validation.schema"],
    visibleCodeConcepts: ["py.dataclass"],
    quizConcepts: ["py.dataclass"],
    usesButDoesNotTeach: [],
    proofOutputs: ["terminal_stdout"]
  }
});

oopServiceLesson.depth = {
  primaryConceptId: "py.dataclass",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.dataclass",
      definition: "Using structured class representations to group related data attributes and behaviors into a cohesive type.",
      mentalModel: "Think of a class instance as a folder in a cabinet. Each folder holds its own unique sheets of data (instance variables). You can put things in it or take things out without affecting any other folder in the cabinet.",
      syntaxShape: "class ClassName:\n    def __init__(self):\n        self.attribute = value",
      tinyExample: "class Session:\n    def __init__(self, topic):\n        self.topic = topic",
      commonMistake: "Defining a mutable list at the class level instead of inside the __init__ constructor, causing all instances to share the same list.",
      repairHint: "Define instance lists inside __init__ with self.sessions = [] so each object gets its own separate list.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-oop-1",
      label: "Instance initialization",
      codeFragment: "def __init__(self):\n        self.sessions = []",
      conceptIds: ["py.dataclass"],
      explanation: "Prepares a fresh, empty sessions list for each individual tracker instance.",
      learnerShouldBeAbleToSay: "I initialize instance data on self so that different trackers do not leak session data to each other."
    }
  ],
  guidedEdits: [
    {
      id: "g-oop-1",
      instruction: "Add a method topic_minutes(topic) to total only minutes matching the specified topic.",
      conceptIds: ["py.dataclass"],
      targetCodeFragment: "def total_minutes(self):\n        return 0",
      expectedObservation: "You can query topic-specific minutes apart from the grand total.",
      wrongTurnHint: "Iterate over self.sessions and compare each session's topic attribute before adding to a running sum."
    }
  ],
  errorClinic: [
    {
      id: "e-oop-1",
      conceptIds: ["py.dataclass"],
      brokenExample: "class StudyTrackerService:\n    sessions = []\n    def add_session(self, topic, minutes):\n        self.sessions.append((topic, minutes))",
      symptom: "Creating a new tracker instance still shows previous instances' session data.",
      likelyCause: "Declaring sessions directly inside the class block makes it a class-level variable, shared among all instances.",
      fixStrategy: "Move sessions = [] inside def __init__(self): and attach it to self."
    }
  ],
  codeLabBridge: {
    story: "Now that validation is complete, we need an application service layer to manage the state of parsed sessions in memory.",
    usesConcepts: ["py.dataclass"],
    learnerOwns: ["StudyTrackerService"],
    checkerOwns: ["oop-service-topic-minutes"],
    runExpectation: "prints service 30 passed"
  },
  understandingProofPrompt: "Explain what self represents in Python methods. Why does passing self allow separate objects to maintain separate data?",
  exitTicket: [
    "I know how to define a service class with methods that manage isolated instance state.",
    "I understand the difference between instance-level attributes and class-level attributes."
  ]
};

const sqlitePersistenceLesson = proofLesson({
  id: "lesson-python-sqlite-persistence",
  moduleId: "module-python-dashboard",
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
  language: "SQLite for Python utilities",
  tools: ["SQLite", "schema", "aggregate query"],
  synopsis: "Your app restarts and all your data disappears. How do you make it remember?",
  prerequisites: [
    "Know the session fields date, topic, and minutes.",
    "Know that SQL tables store rows and queries calculate answers."
  ],
  testingFocus: "You will test the schema by inserting rows, querying total minutes by topic, and explaining how an invalid insert should fail without leaving bad rows behind.",
  objective: "Store study sessions in a SQLite table.",
  whyItMatters: "A professional local utility should not lose data every time it exits. SQLite gives the tracker durable structured storage.",
  coreConcept: "A schema is the shape of a database table. A good first schema stores date, topic, and minutes with types and a simple primary key. A repository function can hide SQL details from service code while queries answer real product questions.",
  workedExample: "SELECT topic, SUM(minutes) FROM sessions GROUP BY topic returns totals that the report layer can use.",
  guidedExercise: "Create the sessions table, insert sample rows, query totals by topic, and plan one invalid-row transaction check.",
  missionConnection: "This closes the database persistence gap and connects the Python path to the SQL path.",
  reflectionPrompt: "Which fields belong in the database, and which calculated values can be derived by query?",
  practiceStarter: "CREATE TABLE sessions (\n  id INTEGER PRIMARY KEY,\n  date TEXT NOT NULL,\n  topic TEXT NOT NULL,\n  minutes INTEGER NOT NULL\n);\n\n-- Insert python and git sessions, then query totals by topic.",
  practiceExpected: "python | 50\ngit | 15",
  practiceCheck: "If the query returns one row per session, add GROUP BY topic so the database groups sessions by topic before calculating totals.",
  practiceReps: pythonSqlitePracticeReps,
  miniTitle: "Create durable session storage",
  miniGoal: "Build a SQLite schema and total-by-topic query for tracker sessions.",
  miniSteps: ["Create the sessions table", "Insert at least three sample rows", "Query total minutes grouped by topic", "Name the invalid insert or rollback check"],
  miniDeliverables: ["CREATE TABLE statement", "Seed inserts", "Aggregate query output", "Invalid-row or transaction failure note"],
  verifierCommand: "sqlite3 tracker.db < schema_and_query.sql",
  expectedEvidence: "SQL output showing python and git totals from inserted session rows plus a note about the invalid-row or rollback check.",
  projectConnection: "This turns the tracker into a local persistent utility.",
  requiredCodeIncludes: ["CREATE TABLE", "sessions", "INSERT", "SUM", "GROUP BY"],
  requiredOutputIncludes: ["python", "50", "git", "15"],
  runnerLanguage: "sql",
  runnerStarterCode: "CREATE TABLE sessions (\n  id INTEGER PRIMARY KEY,\n  date TEXT NOT NULL,\n  topic TEXT NOT NULL,\n  minutes INTEGER NOT NULL\n);\n\n-- Insert python and git sessions, then query totals by topic.",
  runnerTestCode: "EXPECT_ROWS:python|50\ngit|15",
  hiddenTests: [
    {
      id: "sqlite-session-invalid-row-note",
      name: "SQLite depth includes an invalid row or rollback check",
      code: "EXPECT_ROWS:python|50\ngit|15",
      expectedOutputIncludes: ["python", "50", "git", "15"]
    }
  ],
  curriculum: {
    level: 7,
    sequence: 4,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.sqlite", "py.sqlite.query"],
    requires: ["py.dataclass"],
    visibleCodeConcepts: ["py.sqlite", "py.sqlite.query"],
    quizConcepts: ["py.sqlite", "py.sqlite.query"],
    usesButDoesNotTeach: [],
    proofOutputs: ["terminal_stdout"]
  }
});

sqlitePersistenceLesson.depth = {
  primaryConceptId: "py.sqlite",
  secondaryConceptIds: ["py.sqlite.query"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.sqlite",
      definition: "An embedded SQL database engine that stores structured application records in a single local file without requiring a running server.",
      mentalModel: "Think of SQLite as a structured spreadsheet file. Your program writes rows to it and reads rows back, but instead of using Excel, you write SQL commands. The spreadsheet file is permanent, so it stays on disk even when your program isn't running.",
      syntaxShape: "import sqlite3\nconn = sqlite3.connect('tracker.db')",
      tinyExample: "import sqlite3",
      commonMistake: "Forgetting to close the connection or database cursors, which can result in database file locks and write errors.",
      repairHint: "Use context managers (with sqlite3.connect(...) as conn:) to ensure resources are cleaned up automatically.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.sqlite.query",
      definition: "Executing structured language queries (SQL) using parameterized inputs to fetch, aggregate, or modify records safely.",
      mentalModel: "Think of SQL queries as requests to a highly efficient filing clerk. Parameterized inputs are safety guards that make sure user inputs are treated as raw text, never as commands that could break the database structure.",
      syntaxShape: "cursor.execute('SELECT * FROM sessions WHERE topic = ?', (topic,))",
      tinyExample: "cursor.execute('SELECT * FROM sessions')",
      commonMistake: "Using string interpolation (f'SELECT ... {topic}') instead of query parameters, which leaves the database vulnerable to SQL injection.",
      repairHint: "Always use placeholders (?) and pass values as a tuple in the execute method's second parameter.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-sql-1",
      label: "Group and aggregate rows",
      codeFragment: "SELECT topic, SUM(minutes) FROM sessions GROUP BY topic",
      conceptIds: ["py.sqlite.query"],
      explanation: "Aggregates minutes per topic, condensing multiple individual sessions into a single total row per topic.",
      learnerShouldBeAbleToSay: "I use GROUP BY topic and SUM(minutes) to calculate topic-specific totals in SQL."
    }
  ],
  guidedEdits: [
    {
      id: "g-sql-1",
      instruction: "Add a CHECK constraint on minutes to ensure only positive numbers are stored.",
      conceptIds: ["py.sqlite"],
      targetCodeFragment: "minutes INTEGER NOT NULL",
      expectedObservation: "Inserting negative minutes results in a CHECK constraint failure.",
      wrongTurnHint: "Define CHECK (minutes > 0) directly inline with the minutes column declaration."
    }
  ],
  errorClinic: [
    {
      id: "e-sql-1",
      conceptIds: ["py.sqlite.query"],
      brokenExample: "cursor.execute(f\"INSERT INTO sessions VALUES ('{date}', '{topic}')\")",
      symptom: "Security alerts or syntax errors when inputs contain quotes or special characters.",
      likelyCause: "String interpolation inserts raw input directly into the SQL command stream.",
      fixStrategy: "Change the string to use ? placeholders and pass inputs as a tuple: cursor.execute('INSERT INTO sessions VALUES (?, ?)', (date, topic))"
    }
  ],
  codeLabBridge: {
    story: "Now that we can manage parsed sessions in memory, we need to save them persistently so they survive script restarts.",
    usesConcepts: ["py.sqlite", "py.sqlite.query"],
    learnerOwns: ["sessions"],
    checkerOwns: ["sqlite-session-invalid-row-note"],
    runExpectation: "prints python|50 and git|15"
  },
  understandingProofPrompt: "Why does database persistence require a defined schema, whereas saving raw CSV rows does not?",
  exitTicket: [
    "I can design a SQLite table schema with primary keys and constraints.",
    "I know how to aggregate columns using SUM and GROUP BY in a SQL query."
  ]
};

const apiClientLesson = proofLesson({
  id: "lesson-python-api-client",
  moduleId: "module-python-dashboard",
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
  language: "Python API client",
  tools: ["HTTP client boundary", "fake responses", "validation tests", "config safety"],
  synopsis: "How does your Study Tracker talk to a web service that's halfway across the internet?",
  prerequisites: [
    "Know the StudySession fields.",
    "Know that network responses are untrusted input."
  ],
  testingFocus: "You will test success, non-200 status, invalid JSON shape, timeout usage, and safe config boundaries without using real network access.",
  objective: "Build a safe API client boundary without trusting the network blindly.",
  whyItMatters: "Professional Python apps often read from APIs. The rest of your program should not trust raw network responses until status and shape are checked.",
  coreConcept: "An API client is the code that talks to another service over the network. A client function should use config for the base URL, set a timeout, check HTTP status, parse JSON, validate fields, and keep secrets out of logs.",
  workedExample: "client.get(url, timeout=5) returning status 200 and a list of sessions can become trusted records after validation.",
  guidedExercise: "Use a fake client to test success, bad status, bad shape, and safe config handling without making real network calls.",
  missionConnection: "This closes the API/networking gap while keeping the mobile sandbox safe and offline.",
  reflectionPrompt: "Which failures belong at the API boundary before data reaches the service layer?",
  commonMistakes: ["Not checking response.status_code before parsing body", "Hardcoding the API URL instead of making it configurable"],
  practiceStarter: "class ApiError(Exception):\n    pass\n\nclass FakeResponse:\n    def __init__(self, status_code, payload):\n        self.status_code = status_code\n        self._payload = payload\n    def json(self):\n        return self._payload\n\nclass FakeClient:\n    def __init__(self, response):\n        self.response = response\n        self.timeout_seen = None\n    def get(self, url, timeout):\n        self.timeout_seen = timeout\n        return self.response\n\ndef fetch_sessions(client, url):\n    return []",
  practiceExpected: "[{'date': '2026-05-08', 'topic': 'python', 'minutes': 30}]\ntimeout=5",
  practiceCheck: "If bad status or bad shape returns an empty list, the caller cannot tell success from failure. Raise a project-specific API error so failure stays visible.",
  practiceReps: pythonApiPracticeReps,
  miniTitle: "Create a safe API client",
  miniGoal: "Build an API client boundary that checks timeout, status, and response shape.",
  miniSteps: ["Call the client with timeout=5", "Raise ApiError for non-200 status", "Validate response records before returning them", "Keep base URL config separate from secret values"],
  miniDeliverables: ["fetch_sessions function", "Fake client tests", "ApiError failure cases", "Config/secret boundary note"],
  verifierCommand: "python -m pytest tests/test_api_client.py",
  expectedEvidence: "Passing tests for success, bad status, bad shape, timeout behavior, and a note that secret values are not logged or pasted into evidence.",
  projectConnection: "This prepares Python integration work without requiring live network access in beginner lessons.",
  requiredCodeIncludes: ["ApiError", "fetch_sessions", "timeout=5", "status_code", "json"],
  requiredOutputIncludes: ["api", "timeout", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "class ApiError(Exception):\n    pass\n\nclass FakeResponse:\n    def __init__(self, status_code, payload):\n        self.status_code = status_code\n        self._payload = payload\n    def json(self):\n        return self._payload\n\nclass FakeClient:\n    def __init__(self, response):\n        self.response = response\n        self.timeout_seen = None\n    def get(self, url, timeout):\n        self.timeout_seen = timeout\n        return self.response\n\ndef fetch_sessions(client, url):\n    return []",
  runnerTestCode: "payload = [{'date': '2026-05-08', 'topic': 'python', 'minutes': 30}]\nclient = FakeClient(FakeResponse(200, payload))\nassert fetch_sessions(client, 'https://example.test/sessions') == payload\nassert client.timeout_seen == 5\ntry:\n    fetch_sessions(FakeClient(FakeResponse(500, {'error': 'down'})), 'https://example.test/sessions')\nexcept ApiError:\n    pass\nelse:\n    raise AssertionError('bad status should raise ApiError')\nprint('api timeout passed')",
  hiddenTests: [
    {
      id: "api-client-rejects-bad-shape",
      name: "API client rejects bad response shape",
      code: "try:\n    fetch_sessions(FakeClient(FakeResponse(200, {'date': 'not a list'})), 'https://example.test/sessions')\nexcept ApiError:\n    pass\nelse:\n    raise AssertionError('bad shape should raise ApiError')"
    }
  ],
  curriculum: {
    level: 7,
    sequence: 5,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.api.client", "py.http.status"],
    requires: [],
    visibleCodeConcepts: ["py.api.client", "py.http.status"],
    quizConcepts: ["py.api.client", "py.http.status"],
    usesButDoesNotTeach: ["py.json"],
    proofOutputs: ["terminal_stdout"]
  }
});

apiClientLesson.depth = {
  primaryConceptId: "py.api.client",
  secondaryConceptIds: ["py.http.status"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.api.client",
      definition: "An isolated boundary module that handles network HTTP requests, response mapping, and network failure modes cleanly.",
      mentalModel: "Think of an API client as a translator at a border post: it receives foreign requests, verifies their credentials, translates them into the local language, and raises an alarm if the package is broken.",
      syntaxShape: "def fetch_data(client, url):\n    # implementation",
      tinyExample: "def fetch(client):\n    return client.get(url)",
      commonMistake: "Failing to set a request timeout, which can cause the client to hang forever on a slow network.",
      repairHint: "Always pass a timeout=N parameter to your HTTP requests to avoid silent thread blocking.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.http.status",
      definition: "Standardized numerical response status codes returned by web servers to indicate request outcomes.",
      mentalModel: "Think of status codes as a quick thumb sign from a helper: a thumbs-up (200 OK) means everything is good. A question mark (404 Not Found) means it's missing. A warning sign (500 Server Error) means they broke down.",
      syntaxShape: "response.status_code == 200",
      tinyExample: "if resp.status_code != 200:\n    raise Error()",
      commonMistake: "Assuming status code is 200 without checking, leading to parsing errors when servers return HTML error pages.",
      repairHint: "Explicitly check response.status_code or use response.raise_for_status() before attempting to decode JSON payloads.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-api-1",
      label: "HTTP status verification",
      codeFragment: "if response.status_code != 200:\n        raise ApiError(f'HTTP {response.status_code}')",
      conceptIds: ["py.http.status"],
      explanation: "Rejects non-200 responses immediately, raising a clear custom exception before doing any parsing.",
      learnerShouldBeAbleToSay: "I raise ApiError immediately on bad status codes to keep network errors distinct from local code bugs."
    }
  ],
  guidedEdits: [
    {
      id: "g-api-1",
      instruction: "Add validation that the JSON payload is a list before processing items.",
      conceptIds: ["py.api.client"],
      targetCodeFragment: "return []",
      expectedObservation: "The client throws ApiError when receiving a dictionary instead of a list.",
      wrongTurnHint: "Use isinstance(payload, list) to check shape correctness before returning."
    }
  ],
  errorClinic: [
    {
      id: "e-api-1",
      conceptIds: ["py.api.client"],
      brokenExample: "def fetch(client, url):\n    return client.get(url).json()",
      symptom: "Program freezes indefinitely or crashes with an unhandled status code error.",
      likelyCause: "The HTTP get call has no timeout parameter, and it doesn't check status codes before calling json().",
      fixStrategy: "Add timeout=5 and check that response.status_code == 200."
    }
  ],
  codeLabBridge: {
    story: "Before the service queries the database, it must pull fresh sessions from the server using our safe API boundary.",
    usesConcepts: ["py.api.client", "py.http.status"],
    learnerOwns: ["fetch_sessions"],
    checkerOwns: ["api-client-rejects-bad-shape"],
    runExpectation: "prints api timeout passed"
  },
  understandingProofPrompt: "Why is it important to use a project-specific exception (like ApiError) instead of a generic Exception when network requests fail?",
  exitTicket: [
    "I know how to build a safe API client with status verification.",
    "I understand the necessity of using fake clients for unit testing network endpoints."
  ]
};

// ---- Practice reps for testing mocks lesson ----

const pythonTestingMocksPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "from unittest.mock import patch\n\ndef test_fetch_sessions():\n    with patch('api_client.ApiClient.get') as mock_get:\n        mock_get.return_value = [{'topic': 'python', 'minutes': 30}]\n        # Call the function and verify mock was called\n        pass\n\nprint('TODO')",
    expectedOutput: "mock_get was called once with the expected arguments.",
    checkYourAnswer: "Use patch as a context manager to replace a real function with a controlled double. Verify the mock was called with assert_called_once_with.",
    tier: "replicate"
  },
  {
    starterCode: "from unittest.mock import patch\n\ndef test_fetch_sessions_failure():\n    with patch('api_client.ApiClient.get') as mock_get:\n        mock_get.side_effect = ConnectionError('timeout')\n        # This test expects ApiError but mock raises ConnectionError\n        pass\n\nprint('TODO')",
    expectedOutput: "The mock side_effect causes the test to fail or raise an unexpected error because the test expects ApiError, not ConnectionError.",
    checkYourAnswer: "This failure rep shows that mocks can simulate errors, but the test must handle the same exception type the real code raises. Asserting ApiError fails if the mock raises ConnectionError.",
    tier: "diagnose"
  },
  {
    starterCode: "from unittest.mock import patch\n\ndef test_tracker_service():\n    # Write a test that patches StudyTrackerService.add_session\n    # to verify it is called with the correct arguments\n    pass\n\nprint('TODO')",
    expectedOutput: "The mock verifies add_session was called with the right topic and minutes.",
    checkYourAnswer: "Project-shaped testing means using mocks to verify service-layer interactions without real side effects. assert_called_with confirms the arguments.",
    tier: "synthesize"
  }
];

const testingMocksLesson = proofLesson({
  id: "lesson-python-testing-mocks",
  moduleId: "module-python-dashboard",
  slug: "python-testing-mocks",
  title: "Replace Real APIs With Mock Test Doubles",
  summary: "Learn to replace real API calls with controlled test doubles using unittest.mock.patch.",
  bodyMarkdown: "Real API calls make tests slow, flaky, and dependent on network access. The `unittest.mock` module lets you replace real functions with controlled test doubles that you can inspect and configure.\n\n## Using `patch()` as a context manager\n\nThe `patch()` function temporarily replaces a real object with a `MagicMock` during the `with` block:\n\n```python\nfrom unittest.mock import patch\n\ndef test_fetch_sessions():\n    with patch('api_client.ApiClient.get') as mock_get:\n        mock_get.return_value = [{'topic': 'python', 'minutes': 30}]\n        result = fetch_sessions()\n        mock_get.assert_called_once_with('/sessions', timeout=5)\n```\n\n## Key mock methods\n\n- **`return_value`** — What the mock returns when called.\n- **`side_effect`** — An exception to raise or an iterable of return values.\n- **`assert_called_once_with()`** — Verifies the mock was called exactly once with specific arguments.\n- **`assert_called_with()`** — Verifies the most recent call matched specific arguments.\n\n## Testing the Study Tracker service\n\nYou can mock the `StudyTrackerService` methods to isolate the code being tested from real side effects like database writes or network calls:",
  estimatedMinutes: 14,
  difficulty: "applied",
  skillIds: ["skill-python-integration", "skill-testing-debugging"],
  quizId: "quiz-python-testing-mocks",
  desktopTask: "Use unittest.mock.patch to test the API client without real network access, then verify mock call arguments and handle side effects.",
  evidencePrompt: "Record the patched test function, the mock assertion output, and one example of side_effect testing.",
  language: "Python unittest.mock",
  tools: ["unittest.mock", "patch", "MagicMock", "assert_called_with", "side_effect", "return_value"],
  synopsis: "How do you test code that needs a web service that isn't running?",
  prerequisites: [
    "Know how the Study Tracker API client fetches sessions.",
    "Know that real network calls make tests slow and flaky."
  ],
  testingFocus: "You will test that mock objects are called with the expected arguments, that side_effect raises controlled exceptions, and that return_value provides controlled data.",
  objective: "Use unittest.mock.patch to create test doubles for the API client and service layer.",
  whyItMatters: "Professional Python tests isolate the code being tested from external dependencies. Mocking lets you verify that your code calls external services with the right arguments without actually calling them.",
  coreConcept: "unittest.mock.patch temporarily replaces a real function or object with a MagicMock instance during a test block. The mock records every call and its arguments, so you can assert the call happened with the expected inputs.",
  workedExample: "with patch('api_client.ApiClient.get') as mock_get: replaces ApiClient.get with a mock. Setting mock_get.return_value = [...] controls what the mock returns. Calling mock_get.assert_called_once_with('/sessions', timeout=5) verifies the arguments.",
  guidedExercise: "Write a test that patches fetch_sessions, sets a return_value, calls the function, and asserts the mock was called with the right URL and timeout.",
  missionConnection: "Mocking lets the integration tests run without a live API, making them fast enough to run before every commit.",
  reflectionPrompt: "What is the difference between mocking return_value and using side_effect? When would you use each one?",
  practiceStarter: "from unittest.mock import patch\n\ndef test_fetch_sessions():\n    with patch('api_client.ApiClient.get') as mock_get:\n        mock_get.return_value = [{'topic': 'python', 'minutes': 30}]\n        # Call the function and verify mock was called\n        pass\n\nprint('TODO')",
  practiceExpected: "mock_get was called once with '/sessions' and timeout=5.",
  practiceCheck: "If the mock was not called, the function may not be reaching the API client. If assert_called_once_with fails, check the actual arguments passed.",
  practiceReps: pythonTestingMocksPracticeReps,
  miniTitle: "Mock the API client for reliable testing",
  miniGoal: "Write a test that uses patch to replace the API client and verify call behavior.",
  miniSteps: ["Use patch as a context manager to replace ApiClient.get", "Set return_value to fake session data", "Assert the mock was called with the expected URL and timeout"],
  miniDeliverables: ["Test function with patch", "Mock assertion output", "One side_effect example"],
  verifierCommand: "python -m pytest tests/test_mocks.py",
  expectedEvidence: "Passing test output showing mock assertions for call count, arguments, and one side_effect example.",
  projectConnection: "Mocking makes the integration test suite fast and deterministic without requiring a running API server.",
  requiredCodeIncludes: ["patch", "mock_get", "assert_called", "return_value"],
  requiredOutputIncludes: ["mock", "called", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "from unittest.mock import patch\n\ndef test_fetch_sessions():\n    with patch('api_client.ApiClient.get') as mock_get:\n        mock_get.return_value = [{'topic': 'python', 'minutes': 30}]\n        # Call the function and verify mock was called\n        pass\n\nprint('TODO')",
  runnerTestCode: "from unittest.mock import patch\n\ndef test_fetch_sessions():\n    with patch('api_client.ApiClient.get') as mock_get:\n        mock_get.return_value = [{'topic': 'python', 'minutes': 30}]\n        result = mock_get('/sessions', timeout=5)\n        mock_get.assert_called_once_with('/sessions', timeout=5)\n        assert result == [{'topic': 'python', 'minutes': 30}]\n\ntest_fetch_sessions()\nprint('mock called passed')",
  hiddenTests: [
    {
      id: "testing-mocks-side-effect",
      name: "Mock test handles side_effect errors",
      code: "from unittest.mock import patch\n\nwith patch('api_client.ApiClient.get') as mock_get:\n    mock_get.side_effect = ConnectionError('timeout')\n    try:\n        mock_get('/sessions')\n        assert False, 'should have raised'\n    except ConnectionError as e:\n        assert 'timeout' in str(e)"
    }
  ],
  curriculum: {
    level: 7,
    sequence: 6,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.testing.mock"],
    requires: ["py.api.client"],
    visibleCodeConcepts: ["py.testing.mock"],
    quizConcepts: ["py.testing.mock"],
    usesButDoesNotTeach: ["py.import", "py.pytest.basic"],
    proofOutputs: ["terminal_stdout"]
  }
});

testingMocksLesson.depth = {
  primaryConceptId: "py.testing.mock",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.testing.mock",
      definition: "Replacing a real function or object with a controlled test double that records calls and returns specified values.",
      mentalModel: "Think of a mock as a stunt double in a movie. The stunt double replaces the actor for dangerous scenes (network calls), performs the same actions, and records exactly what happened so the director can review it.",
      syntaxShape: "from unittest.mock import patch\nwith patch('module.function') as mock:\n    mock.return_value = value\n    mock.assert_called_once_with(arg)",
      tinyExample: "mock_get.return_value = ['data']",
      commonMistake: "Asserting the mock was called with arguments that don't match the actual call, or forgetting to check the mock at all.",
      repairHint: "Add mock.assert_called_once_with(expected_arg) right after the call that exercises the mocked function.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-mock-1",
      label: "Patch as context manager",
      codeFragment: "with patch('api_client.ApiClient.get') as mock_get:\n    mock_get.return_value = [{'topic': 'python', 'minutes': 30}]",
      conceptIds: ["py.testing.mock"],
      explanation: "patch replaces ApiClient.get with a MagicMock within the with block. The mock automatically restores the original after the block exits.",
      learnerShouldBeAbleToSay: "I use patch as a context manager to temporarily replace a function with a controlled mock that records calls."
    },
    {
      id: "w-mock-2",
      label: "Assert mock call arguments",
      codeFragment: "mock_get.assert_called_once_with('/sessions', timeout=5)",
      conceptIds: ["py.testing.mock"],
      explanation: "Verifies the mock was called exactly once and with the specified arguments. If the call count or arguments differ, the assertion raises a descriptive error.",
      learnerShouldBeAbleToSay: "I use assert_called_once_with to verify the exact arguments passed to the mocked function."
    }
  ],
  guidedEdits: [
    {
      id: "g-mock-1",
      instruction: "Add an assertion that mock_get was called with the URL '/sessions' and timeout=5.",
      conceptIds: ["py.testing.mock"],
      targetCodeFragment: "with patch('api_client.ApiClient.get') as mock_get:",
      expectedObservation: "The mock assertion passes and confirms the call arguments.",
      wrongTurnHint: "Use mock_get.assert_called_once_with('/sessions', timeout=5) after the function call."
    },
    {
      id: "g-mock-2",
      instruction: "Add a side_effect that raises ConnectionError and verify the error is raised.",
      conceptIds: ["py.testing.mock"],
      targetCodeFragment: "mock_get.return_value = [{'topic': 'python', 'minutes': 30}]",
      expectedObservation: "Calling mock_get raises a ConnectionError instead of returning data.",
      wrongTurnHint: "Set mock_get.side_effect = ConnectionError('timeout') before calling mock_get."
    }
  ],
  errorClinic: [
    {
      id: "e-mock-1",
      conceptIds: ["py.testing.mock"],
      brokenExample: "with patch('api_client.ApiClient.get') as mock_get:\n    mock_get.return_value = [{'topic': 'python', 'minutes': 30}]\n    result = mock_get('/sessions', timeout=5)\n# No assertion checks the mock was called",
      symptom: "The test passes but does not verify the code under test actually calls the mocked function.",
      likelyCause: "The test exercises the mock but never asserts that the real code path calls the function with the expected arguments.",
      fixStrategy: "Add mock_get.assert_called_once_with('/sessions', timeout=5) after the function call."
    },
    {
      id: "e-mock-2",
      conceptIds: ["py.testing.mock"],
      brokenExample: "with patch('api_client.ApiClient.get') as mock_get:\n    mock_get.side_effect = ConnectionError('timeout')\n    result = mock_get('/sessions')\nassert result is None  # This assertion passes silently",
      symptom: "The test passes but the ConnectionError was never raised because side_effect needs to be triggered.",
      likelyCause: "The mock is set up but the test uses it directly rather than through the function under test.",
      fixStrategy: "Call the function under test inside the with block and use a try/except to catch the expected exception."
    }
  ],
  codeLabBridge: {
    story: "Now that the API client has a safe boundary, we need mock tests that verify it without making real network calls.",
    usesConcepts: ["py.testing.mock"],
    learnerOwns: ["test_fetch_sessions"],
    checkerOwns: ["testing-mocks-side-effect"],
    runExpectation: "prints mock called passed"
  },
  understandingProofPrompt: "Why does mocking make tests faster and more reliable compared to real API calls? What kinds of bugs might mocking still miss?",
  exitTicket: [
    "I know how to use unittest.mock.patch to replace a function with a test double.",
    "I can assert that a mock was called with the expected arguments."
  ]
};

const integrationCapstoneLesson = proofLesson({
  id: "lesson-python-integration-capstone",
  moduleId: "module-python-dashboard",
  slug: "python-integration-capstone",
  title: "Integration Capstone: Build the Study Dashboard",
  summary: "Build a two-layer Study Dashboard with SQLite persistence: session_repository.py for data access, tracker_service.py for business logic, and a CLI interface.",
  bodyMarkdown: "## Architecture\n\nYou are building a Study Dashboard from scratch, not just planning one. The project has four files:\n\n### 1. session_repository.py\nSessionRepository wraps all SQLite access: create_table(), add_session(topic, minutes), get_all(), and totals_by_topic(). No business logic lives here — only SQL.\n\n### 2. tracker_service.py\nTrackerService contains validation and report generation: add_session(topic, minutes) validates that topic is non-empty and minutes > 0, then delegates storage to the repository. generate_report() pulls all sessions and formats them as a human-readable string.\n\n### 3. cli.py\nA command-line interface using argparse with three flags: --add <topic> <minutes> to add a session, --report to print the report, and --db <path> to specify the database file.\n\n### 4. tests/test_integration.py\nEnd-to-end tests that create an in-memory database, exercise the full add-and-report flow, and verify that validation rejections raise appropriate errors.\n\n## Starter Code\n\nEach module starts as `pass` stubs. Your job is to fill in every function body so the full stack works end-to-end.\n\n## Repository Pattern\n\nThe repository pattern separates data access (SQL) from business logic (validation, formatting). This means:\n- If the database schema changes, you only change SessionRepository.\n- If validation rules change, you only change TrackerService.\n- The CLI never touches SQL directly.\n\n## What Success Looks Like\n\n```\npython cli.py --db study.db --add python 30\npython cli.py --db study.db --add sql 20\npython cli.py --db study.db --report\n```\nThe report should show both sessions with a total at the bottom.",
  estimatedMinutes: 25,
  difficulty: "portfolio",
  skillIds: [
    "skill-python-integration",
    "skill-python-professional",
    "skill-testing-debugging",
    "skill-portfolio-evidence"
  ],
  quizId: "quiz-python-integration-capstone",
  desktopTask: "Write session_repository.py, tracker_service.py, cli.py, and tests/test_integration.py for the Study Dashboard.",
  evidencePrompt: "Record the completed session_repository.py, tracker_service.py, cli.py, test output, and one example of validation rejecting bad input.",
  language: "Python integration capstone",
  tools: ["sqlite3", "argparse", "repository pattern", "integration tests"],
  synopsis: "You have SQLite, an API, and OOP services — what can you build with all three?",
  prerequisites: [
    "Know how to write SQL CREATE TABLE and SELECT queries.",
    "Know how to use argparse for CLI flags.",
    "Know how to use pytest for automated tests."
  ],
  testingFocus: "You will test that the repository accepts and retrieves sessions, the service validates and rejects bad input, and the CLI parses add and report flags correctly.",
  objective: "Build a working Study Dashboard with separate repository, service, CLI, and test layers.",
  whyItMatters: "Professional Python projects separate data access from business logic. This capstone proves you can build a complete offline utility with clean architecture.",
  coreConcept: "The repository pattern separates database queries from application logic. SessionRepository owns SQL only. TrackerService owns validation and formatting. Tests exercise the full stack through the public interfaces.",
  workedExample: "SessionRepository.add_session('python', 30) stores a row via SQL INSERT. TrackerService.add_session('python', 30) validates the input then calls repository.add_session. cli.py --add python 30 parses the args and calls the service.",
  guidedExercise: "Implement SessionRepository.create_table() with a sessions table, then add_session(), then TrackerService, then the CLI, and finally run the integration test.",
  missionConnection: "This capstone completes the Python Study Dashboard module and prepares evidence for the Integration Service portfolio mission.",
  reflectionPrompt: "What would need to change in your repository if you switched from SQLite to a different database? What would stay the same in the service layer?",
  practiceStarter: "class SessionRepository:\n    def __init__(self, db_path):\n        pass\n    def create_table(self):\n        pass\n    def add_session(self, topic, minutes):\n        pass\n    def get_all(self):\n        return []\n    def totals_by_topic(self):\n        return []\n\nclass TrackerService:\n    def __init__(self, repository):\n        pass\n    def add_session(self, topic, minutes):\n        pass\n    def generate_report(self):\n        return ''\n\nrepo = SessionRepository(':memory:')\nrepo.create_table()\nservice = TrackerService(repo)\nservice.add_session('python', 30)\nservice.add_session('sql', 20)\nprint(service.generate_report())",
  practiceExpected: "python: 30 min\nsql: 20 min\nTotal: 50 min",
  practiceCheck: "If the report is empty, check that create_table ran before add_session. If totals are wrong, check that get_all returns the correct rows before the service sums them.",
  practiceReps: pythonIntegrationCapstonePracticeReps,
  miniTitle: "Build the Study Dashboard",
  miniGoal: "Implement all four modules (repository, service, CLI, tests) and verify the full flow.",
  miniSteps: [
    "Implement SessionRepository with create_table, add_session, get_all, totals_by_topic",
    "Implement TrackerService with add_session (validate topic non-empty, minutes > 0) and generate_report",
    "Implement cli.py with argparse --add, --report, --db flags",
    "Write tests/test_integration.py that tests the full add-and-report flow",
    "Run the test and CLI to confirm the end-to-end flow works"
  ],
  miniDeliverables: [
    "session_repository.py",
    "tracker_service.py",
    "cli.py",
    "tests/test_integration.py",
    "Test output showing passing integration test"
  ],
  verifierCommand: "python -m pytest tests/test_integration.py -v",
  expectedEvidence: "Passing pytest output showing repository accepts sessions, service generates a report, and validation rejects bad input.",
  projectConnection: "This capstone completes the Python Study Dashboard and provides portfolio evidence of full-stack Python development.",
  requiredCodeIncludes: ["SessionRepository", "TrackerService", "argparse", "sqlite3", "create_table", "add_session", "totals_by_topic", "generate_report"],
  requiredOutputIncludes: ["python", "30", "sql", "20", "Total"],
  runnerLanguage: "python",
  runnerStarterCode: "class SessionRepository:\n    def __init__(self, db_path):\n        pass\n    def create_table(self):\n        pass\n    def add_session(self, topic, minutes):\n        pass\n    def get_all(self):\n        return []\n    def totals_by_topic(self):\n        return []\n\nclass TrackerService:\n    def __init__(self, repository):\n        pass\n    def add_session(self, topic, minutes):\n        pass\n    def generate_report(self):\n        return ''\n\nrepo = SessionRepository(':memory:')\nrepo.create_table()\nservice = TrackerService(repo)\nservice.add_session('python', 30)\nservice.add_session('sql', 20)\nprint(service.generate_report())",
  runnerTestCode: "import sqlite3\n\n# Test 1: Repository accepts and retrieves sessions\nrepo = SessionRepository(':memory:')\nrepo.create_table()\nrepo.add_session('python', 30)\nrepo.add_session('sql', 20)\nall_sessions = repo.get_all()\nassert len(all_sessions) == 2, f'Expected 2 sessions, got {len(all_sessions)}'\ntotals = repo.totals_by_topic()\nassert len(totals) == 2, f'Expected 2 topic totals, got {len(totals)}'\nprint('repository sessions passed')\n\n# Test 2: Service generates a report\nservice = TrackerService(repo)\nreport = service.generate_report()\nassert 'python' in report\nassert 'sql' in report\nassert 'Total' in report\nprint('service report passed')\nprint('python 30 sql 20 Total: 50')\n\n# Test 3: Service validates input\ntry:\n    service.add_session('', 30)\n    print('FAIL: should have raised ValueError for empty topic')\nexcept ValueError:\n    print('validation topic passed')",
  hiddenTests: [
    {
      id: "integration-capstone-handles-empty-db",
      name: "Integration handles empty database",
      code: "empty_repo = SessionRepository(':memory:')\nempty_repo.create_table()\nassert empty_repo.get_all() == []\nassert empty_repo.totals_by_topic() == []\nempty_service = TrackerService(empty_repo)\nreport = empty_service.generate_report()\nassert 'Total' in report or '0' in report"
    },
    {
      id: "integration-capstone-rejects-negative-minutes",
      name: "Integration rejects negative minutes",
      code: "repo = SessionRepository(':memory:')\nrepo.create_table()\nservice = TrackerService(repo)\ntry:\n    service.add_session('python', -5)\n    print('FAIL: should have raised ValueError for negative minutes')\nexcept ValueError:\n    pass"
    }
  ],
  curriculum: {
    level: 7,
    sequence: 7,
    version: "1.0.0",
    lessonKind: "proof_pack",
    teaches: ["ops.architecture.note"],
    reinforces: ["py.sqlite.query"],
    requires: ["py.dataclass", "py.sqlite"],
    visibleCodeConcepts: ["py.sqlite.query"],
    quizConcepts: ["py.sqlite.query"],
    usesButDoesNotTeach: ["py.f_string", "py.dict.literal", "py.import", "py.argparse"],
    proofOutputs: ["terminal_stdout"]
  }
});

integrationCapstoneLesson.depth = {
  primaryConceptId: "py.sqlite.query",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.sqlite.query",
      definition: "Executing structured language queries (SQL) using parameterized inputs to fetch, aggregate, or modify records safely, applied here through the repository pattern.",
      mentalModel: "Think of the repository pattern as a librarian. You don't go into the stacks yourself; you tell the librarian what you need and they fetch it. The repository is the librarian for your data — your service layer never touches SQL directly.",
      syntaxShape: "repo.add_session(topic, minutes)  # No SQL visible at the call site",
      tinyExample: "repo = SessionRepository('study.db')\nrepo.create_table()\nrepo.add_session('python', 30)",
      commonMistake: "Putting business logic (validation, formatting) inside the repository instead of the service layer, coupling data access rules to business rules.",
      repairHint: "Keep SessionRepository focused on SQL only. Move input validation and report formatting to TrackerService.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-cap-1",
      label: "Repository query with parameterized input",
      codeFragment: "def add_session(self, topic, minutes):\n    self.cur.execute('INSERT INTO sessions (topic, minutes) VALUES (?, ?)', (topic, minutes))\n    self.conn.commit()",
      conceptIds: ["py.sqlite.query"],
      explanation: "The repository method uses parameterized SQL with ? placeholders to insert a session row, then commits the transaction so the change is durable.",
      learnerShouldBeAbleToSay: "I execute INSERT with ? placeholders to safely store session data, and I commit to make the change visible to future queries."
    },
    {
      id: "w-cap-2",
      label: "Aggregate query per topic",
      codeFragment: "def totals_by_topic(self):\n    self.cur.execute('SELECT topic, SUM(minutes) FROM sessions GROUP BY topic')\n    return self.cur.fetchall()",
      conceptIds: ["py.sqlite.query"],
      explanation: "The GROUP BY clause groups rows by topic, and SUM calculates the total minutes per group. The repository returns raw rows for the service to format.",
      learnerShouldBeAbleToSay: "I use GROUP BY with SUM to calculate per-topic totals, and I return raw data from the repository without formatting it."
    }
  ],
  guidedEdits: [
    {
      id: "g-cap-1",
      instruction: "Implement SessionRepository.add_session to insert a row and commit.",
      conceptIds: ["py.sqlite.query"],
      targetCodeFragment: "def add_session(self, topic, minutes):\n        pass",
      expectedObservation: "After calling add_session, get_all returns the newly added session.",
      wrongTurnHint: "Use self.cur.execute with ? placeholders, then call self.conn.commit(). The columns are topic (TEXT) and minutes (INTEGER)."
    },
    {
      id: "g-cap-2",
      instruction: "Implement TrackerService.add_session to validate that topic is non-empty and minutes > 0 before calling the repository.",
      conceptIds: ["py.sqlite.query"],
      targetCodeFragment: "def add_session(self, topic, minutes):\n        pass",
      expectedObservation: "Calling add_session with an empty topic raises ValueError; calling with valid input delegates to the repository.",
      wrongTurnHint: "Check 'if not topic' and 'if minutes <= 0' then 'raise ValueError(...)' before calling self.repository.add_session."
    }
  ],
  errorClinic: [
    {
      id: "e-cap-1",
      conceptIds: ["py.sqlite.query"],
      brokenExample: "def add_session(self, topic, minutes):\n    self.cur.execute(f\"INSERT INTO sessions VALUES ('{topic}', {minutes})\")\n    self.conn.commit()",
      symptom: "SQL syntax errors or injection vulnerabilities when topic contains quotes or special characters.",
      likelyCause: "String interpolation inserts raw input directly into the SQL command instead of using parameterized placeholders.",
      fixStrategy: "Always use ? placeholders and pass values as a tuple: cur.execute('INSERT INTO sessions (topic, minutes) VALUES (?, ?)', (topic, minutes))"
    },
    {
      id: "e-cap-2",
      conceptIds: ["py.sqlite.query"],
      brokenExample: "class TrackerService:\n    def __init__(self, db_path):\n        self.conn = sqlite3.connect(db_path)\n        self.cur = self.conn.cursor()\n    def add_session(self, topic, minutes):\n        self.cur.execute('INSERT INTO sessions VALUES (?, ?)', (topic, minutes))",
      symptom: "The service layer directly manages database connections and executes SQL, mixing business logic with persistence.",
      likelyCause: "Bypassing the repository layer and putting SQL directly in the service, which couples business logic to the database schema.",
      fixStrategy: "Inject a SessionRepository instance in the service constructor and call repository methods instead of executing SQL directly."
    }
  ],
  codeLabBridge: {
    story: "You have built each piece of the Study Dashboard separately. Now wire them together: the repository owns all SQL, the service owns validation and reporting, and the CLI owns user interaction.",
    usesConcepts: ["py.sqlite.query"],
    learnerOwns: ["SessionRepository", "TrackerService"],
    checkerOwns: ["integration-capstone-handles-empty-db", "integration-capstone-rejects-negative-minutes"],
    runExpectation: "prints repository sessions passed service report passed validation topic passed"
  },
  understandingProofPrompt: "Why is it important to separate SQL queries into a repository layer instead of writing them directly in the service or CLI? What changes when you add a new query?",
  exitTicket: [
    "I can build a repository class that wraps SQLite CRUD operations behind a clean interface.",
    "I can build a service class that validates input and calls the repository for data access."
  ]
};

const integrationReviewLesson = proofLesson({
  id: "lesson-python-integration-review",
  moduleId: "module-python-dashboard",
  slug: "python-integration-review",
  title: "Integration Service Review Gate",
  summary: "Review the final Python path by mapping every integration layer to evidence and selecting one production-readiness improvement.",
  bodyMarkdown: "The final review asks whether the utility is integrated, not merely feature-rich. Each layer should have a responsibility, a test, an artifact, and a known risk.",
  estimatedMinutes: 17,
  difficulty: "portfolio",
  skillIds: [
    "skill-python-integration",
    "skill-python-professional",
    "skill-testing-debugging",
    "skill-portfolio-evidence"
  ],
  quizId: "quiz-python-integration-review",
  desktopTask: "Create an Integration Service Review with layer evidence for validation, service, SQLite, API, JSON, CLI, and one production-readiness improvement.",
  evidencePrompt: "Record the layer matrix, pytest output, SQLite query output, API client failure proof, CLI JSON output, and one risk/improvement.",
  language: "Python capstone review",
  tools: ["integration matrix", "pytest", "SQLite output", "API failure output", "CLI JSON output"],
  synopsis: "Does your integrated Study Dashboard actually hold up under real use?",
  prerequisites: [
    "Have completed the integration lessons.",
    "Have final verification commands and artifacts to inspect."
  ],
  testingFocus: "You will test that every integration layer has responsibility, evidence, risk, and an improvement path.",
  objective: "Review the integrated Python utility like a capstone project.",
  whyItMatters: "A final review should prove the system hangs together. Each advanced layer must have a purpose, a test, and evidence that it still works with the rest of the project.",
  coreConcept: "An integration review maps layer, responsibility, proof command, artifact, risk, and improvement. Risk means what could still fail even after the happy path works.",
  workedExample: "Validation has regex tests, service has state tests, SQLite has query output and transaction risk, API has fake-client tests, config has secret boundaries, and CLI has JSON smoke output.",
  guidedExercise: "Build the final review matrix and choose one production-readiness improvement.",
  missionConnection: "This review gate completes the Python Integration Service path.",
  reflectionPrompt: "Which layer is most likely to fail in production, and what evidence would warn you early?",
  practiceStarter: "review = {\n    'layers': [],\n    'commands': [],\n    'artifacts': [],\n    'risk': '',\n    'improvement': '',\n}\nprint(review)",
  practiceExpected: "validation, service, sqlite, api, json, cli, risk, improvement",
  practiceCheck: "If your review has no risk, it is not a capstone review. Professional review names what could still fail and what evidence would warn you early.",
  practiceReps: pythonIntegrationReviewPracticeReps,
  miniTitle: "Complete the Integration Service Review",
  miniGoal: "Create the final capstone review artifact for the integrated Python utility.",
  miniSteps: ["Map every layer to evidence", "List final check commands", "Inspect one failure path", "Name one risk and one improvement"],
  miniDeliverables: ["Layer evidence matrix", "Final command list", "Failure-path inspection", "Risk and improvement note"],
  verifierCommand: "python -m pytest && sqlite3 tracker.db < schema_and_query.sql && study-tracker --input sessions.csv --format json",
  expectedEvidence: "Final review matrix plus pytest, SQLite, API-client failure, CLI JSON evidence, and a specific risk/improvement decision.",
  projectConnection: "This review gate completes the Python Integration Service path.",
  requiredCodeIncludes: ["validation", "service", "sqlite", "api", "json", "cli", "risk", "improvement"],
  requiredOutputIncludes: ["validation", "sqlite", "api", "json", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "review = {\n    'layers': [],\n    'commands': [],\n    'artifacts': [],\n    'risk': '',\n    'improvement': '',\n}\nprint(review)",
  runnerTestCode: "layers = {layer['name'] for layer in review['layers']}\nassert {'validation', 'service', 'sqlite', 'api', 'json', 'cli'}.issubset(layers)\nassert all(layer.get('evidence') for layer in review['layers'])\nassert any('python -m pytest' in command for command in review['commands'])\nassert any('study-tracker' in command for command in review['commands'])\nassert len(review['risk']) >= 20\nassert len(review['improvement']) >= 20\nprint('validation sqlite api json passed')",
  hiddenTests: [
    {
      id: "integration-review-links-risk-to-layer",
      name: "Integration review links risk to a known layer",
      code: "assert any(layer['name'] in review['risk'] for layer in review['layers'])"
    }
  ],
  curriculum: {
    level: 7,
    sequence: 8,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["evidence.portfolio"],
    requires: ["ops.architecture.note"],
    visibleCodeConcepts: ["evidence.portfolio"],
    quizConcepts: ["evidence.portfolio"],
    usesButDoesNotTeach: ["py.json"],
    proofOutputs: ["terminal_stdout"]
  }
});

integrationReviewLesson.depth = {
  primaryConceptId: "evidence.portfolio",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "evidence.portfolio",
      definition: "Assembling verifiable artifacts, logs, and failure-path proofs into a package suitable for review by senior engineers.",
      mentalModel: "Think of portfolio evidence as a lawyer's case file. You don't just tell the judge that your client is innocent; you present physical exhibits, records, and cross-examinations that back up every single claim.",
      syntaxShape: "A final verification report file.",
      tinyExample: "An integration matrix with risk/improvement columns.",
      commonMistake: "Failing to detail failure cases in the final review, leaving the evaluator unsure how robust the code is.",
      repairHint: "Include a risk/limitation analysis that names concrete failure modes.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-rev-1",
      label: "Evaluate risk and improvement",
      codeFragment: "assert len(review['risk']) >= 20\nassert len(review['improvement']) >= 20",
      conceptIds: ["evidence.portfolio"],
      explanation: "Enforces that the student writes a descriptive risk assessment and an improvement path of at least 20 characters.",
      learnerShouldBeAbleToSay: "I must write a detailed description of the system's remaining risks and potential improvements."
    }
  ],
  guidedEdits: [
    {
      id: "g-rev-1",
      instruction: "Add a limitation entry specifically mapping database locks in SQLite.",
      conceptIds: ["evidence.portfolio"],
      targetCodeFragment: "review = {",
      expectedObservation: "The review artifact contains database-specific risks.",
      wrongTurnHint: "Provide an explicit note under a risk or limitation attribute."
    }
  ],
  errorClinic: [
    {
      id: "e-rev-1",
      conceptIds: ["evidence.portfolio"],
      brokenExample: "review = {'risk': 'none', 'improvement': 'nothing'}",
      symptom: "Rejection during senior code audit.",
      likelyCause: "Providing generic, non-informative feedback instead of professional critical self-evaluation.",
      fixStrategy: "Be specific about what could fail (e.g. database locks, slow API timeouts) and how you would mitigate it next."
    }
  ],
  codeLabBridge: {
    story: "With the full integration built and tested, we compile the final review gate to document readiness and improvements.",
    usesConcepts: ["evidence.portfolio"],
    learnerOwns: ["review"],
    checkerOwns: ["integration-review-links-risk-to-layer"],
    runExpectation: "prints validation sqlite api json passed"
  },
  understandingProofPrompt: "Why does professional self-evaluation of code risk and limitations increase project trustworthiness?",
  exitTicket: [
    "I know how to construct a capstone review package with layer evidence.",
    "I understand how to document remaining risks and improvement options."
  ]
};

export const level7Lessons: Lesson[] = [
  typeHintsLesson,
  regexValidationLesson,
  oopServiceLesson,
  sqlitePersistenceLesson,
  apiClientLesson,
  testingMocksLesson,
  integrationCapstoneLesson,
  integrationReviewLesson
];

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------

export const level7Quizzes: Quiz[] = [
  codeReadingQuiz(
    "quiz-python-type-hints",
    "lesson-python-type-hints",
    "Type hints checkpoint",
    'def format_session(topic: str, minutes: int) -> str:\n    return f"{topic}: {minutes} min"',
    "type hints",
    "topic is a string, minutes is an integer, and the function returns a string",
    "topic is optional, minutes is a string",
    "The function has no return value",
    "The type hints declare that topic must be str, minutes must be int, and the return value is str.",
    ["py.typing.hints"]
  ),
  codeReadingQuiz(
    "quiz-python-regex-validation",
    "lesson-python-regex-validation",
    "Regex validation checkpoint",
    'import re\nDATE_PATTERN = r"^\\d{4}-\\d{2}-\\d{2}$"\ndef is_valid_date(value):\n    return bool(re.fullmatch(DATE_PATTERN, value))',
    "regex validation",
    "False",
    "True",
    "None",
    "re.fullmatch requires the entire string to match. '2026-05-08-extra' has trailing characters so fullmatch returns None (falsy).",
    ["py.validation.schema"]
  ),
  codeReadingQuiz(
    "quiz-python-oop-service",
    "lesson-python-oop-service",
    "OOP service checkpoint",
    'tracker = StudyTrackerService()\ntracker.add_session("python", 30)\ntracker.add_session("git", 15)\nprint(tracker.total_minutes())',
    "oop service",
    "45",
    "30",
    "15",
    "The total_minutes method sums all added sessions: 30 + 15 = 45.",
    ["py.dataclass"]
  ),
  codeReadingQuiz(
    "quiz-python-sqlite-persistence",
    "lesson-python-sqlite-persistence",
    "SQLite persistence checkpoint",
    'SELECT topic, SUM(minutes)\nFROM sessions GROUP BY topic;',
    "sqlite query",
    "One row per topic with the total minutes for that topic",
    "Every session row individually",
    "An error because the syntax is wrong",
    "GROUP BY topic groups rows by topic, and SUM(minutes) calculates the total minutes for each group.",
    ["py.sqlite.query"]
  ),
  codeReadingQuiz(
    "quiz-python-api-client",
    "lesson-python-api-client",
    "API client checkpoint",
    'def fetch_sessions(client, url):\n    response = client.get(url, timeout=5)\n    if response.status_code != 200:\n        raise ApiError(f"HTTP {response.status_code}")\n    return response.json()',
    "api client",
    "It calls the API with a timeout, checks status, and raises ApiError on bad status",
    "It always returns empty data",
    "It ignores the response status",
    "The client sets a timeout, verifies status code is 200, and raises ApiError for non-200 responses.",
    ["py.api.client"]
  ),
  codeReadingQuiz(
    "quiz-python-integration-capstone",
    "lesson-python-integration-capstone",
    "Integration capstone checkpoint",
    "class SessionRepository:\n    def __init__(self, db_path):\n        self.conn = sqlite3.connect(db_path)\n        self.cur = self.conn.cursor()\n        self.create_table()\n\n    def create_table(self):\n        self.cur.execute('CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY, topic TEXT, minutes INTEGER)')\n        self.conn.commit()\n\n    def add_session(self, topic, minutes):\n        self.cur.execute('INSERT INTO sessions (topic, minutes) VALUES (?, ?)', (topic, minutes))\n        self.conn.commit()\n\n    def totals_by_topic(self):\n        self.cur.execute('SELECT topic, SUM(minutes) FROM sessions GROUP BY topic')\n        return self.cur.fetchall()",
    "the repository pattern and SQL parameterized queries",
    "It creates a sessions table, inserts rows with parameterized queries, and returns per-topic totals using GROUP BY and SUM",
    "It deletes all rows from the sessions table and returns nothing",
    "It creates a new database file every time add_session is called",
    "SessionRepository wraps SQL operations behind clean method calls. add_session uses ? placeholders to prevent SQL injection. totals_by_topic uses GROUP BY to aggregate minutes per topic.",
    ["py.sqlite.query"]
  ),
  codeReadingQuiz(
    "quiz-python-integration-review",
    "lesson-python-integration-review",
    "Integration review checkpoint",
    'review = {\n    "layers": [\n        {"name": "sqlite", "risk": "transaction rollback untested"}\n    ],\n    "improvement": "Add rollback tests"\n}',
    "integration review",
    "A layer with a named risk and an improvement path",
    "A list of all project files",
    "A deployment pipeline",
    "The review identifies a specific risk for the sqlite layer and proposes a concrete improvement.",
    ["evidence.portfolio"]
  ),
  codeReadingQuiz(
    "quiz-python-testing-mocks",
    "lesson-python-testing-mocks",
    "Testing with mocks checkpoint",
    "from unittest.mock import patch\n\ndef test_fetch_sessions():\n    with patch('api_client.ApiClient.get') as mock_get:\n        mock_get.return_value = [{'topic': 'python'}]\n        result = mock_get('/sessions', timeout=5)\n        mock_get.assert_called_once_with('/sessions', timeout=5)",
    "unittest.mock.patch",
    "It patches ApiClient.get to return fake data and verifies the call was made with the right arguments",
    "It makes a real HTTP request and checks the server response",
    "It deletes the ApiClient module from the codebase",
    "patch temporarily replaces ApiClient.get with a MagicMock. The mock returns fake data and the assertion verifies the call arguments.",
    ["py.testing.mock"]
  )
];
