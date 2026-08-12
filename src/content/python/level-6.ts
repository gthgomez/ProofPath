import type { Lesson, Quiz, LessonPracticeBlock } from "@/domain/types";
import { proofLesson, codeReadingQuiz } from "./shared";

// ---------------------------------------------------------------------------
// Practice Reps for Level 6
// ---------------------------------------------------------------------------

const professionalProjectStructurePracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "project_files = ['study_tracker/cli.py', 'study_tracker/parser.py', 'study_tracker/reports.py']\nmodule_roles = {'cli': 'parse command arguments'}\nprint(project_files)\nprint(module_roles)",
    expectedOutput: "The package lists cli.py, parser.py, reports.py, and role notes.",
    checkYourAnswer: "Same idea, new data: add models.py and decide whether parsing rows or defining StudySession belongs there.",
    tier: "replicate"
  },
  {
    starterCode: "module_roles = {'parser': 'parse arguments', 'cli': 'parse rows'}\nprint(module_roles)",
    expectedOutput: "This role map should be rejected because parser and cli responsibilities are swapped.",
    checkYourAnswer: "Failure rep: if parser.py knows argparse, the boundary is leaking. CLI owns command flags; parser owns rows.",
    tier: "diagnose"
  },
  {
    starterCode: "project_files = ['study_tracker/cli.py', 'study_tracker/parser.py', 'study_tracker/models.py', 'study_tracker/reports.py', 'tests/test_parser.py']\nprint('\\n'.join(project_files))",
    expectedOutput: "A project-shaped file tree includes package modules and tests outside package code.",
    checkYourAnswer: "This is the structure a reviewer can navigate before reading implementation details.",
    tier: "synthesize"
  },
  {
    starterCode: "# Diff review sim:\n# + [project.scripts]\n# study = 'study_tracker:main'\nprint('review: missing test, add entry point')",
    expectedOutput: "review: missing console script entry point and no smoke test for CLI packaging",
    checkYourAnswer: "Call out missing console_scripts and no CLI test. Fix: add to pyproject + smoke test. (review-sim tier)",
    tier: "review-sim"
  }
];

const pythonDataclassPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "row = {'date': '2026-05-08', 'topic': 'git', 'minutes': '15'}\n# Convert this row into StudySession with minutes as int.\nprint(row)",
    expectedOutput: "StudySession(date='2026-05-08', topic='git', minutes=15)",
    checkYourAnswer: "This repeats the model contract with new data. The key check is that minutes becomes an integer before the rest of the project uses it.",
    tier: "replicate"
  },
  {
    starterCode: "row = {'date': '2026-05-08', 'topic': 'python', 'minutes': '-5'}\n# Try to build StudySession and record the failure.\nprint(row)",
    expectedOutput: "Negative minutes are rejected with a clear ValueError or project input error.",
    checkYourAnswer: "The failure case is the point of the model. If negative minutes create a session, the model is only decoration.",
    tier: "diagnose"
  },
  {
    starterCode: "rows = [{'date': '2026-05-08', 'topic': 'python', 'minutes': '30'}]\n# Convert rows into model objects before reports use them.\nprint(rows)",
    expectedOutput: "Report code receives a list of StudySession objects, not loose raw dictionaries.",
    checkYourAnswer: "This is the project-shaped rep: parsing creates trusted objects, reports consume trusted objects, and raw rows stay at the boundary.",
    tier: "synthesize"
  },
  {
    starterCode: "# Review model diff for dataclass:\n# + @dataclass\n# + class StudySession: ...\nprint('review: add validation in post_init')",
    expectedOutput: "review: add post_init validation to reject negative minutes in dataclass model",
    checkYourAnswer: "Flag: no validation for negative minutes; suggest __post_init__ check. (review-sim)",
    tier: "review-sim"
  }
];

const pythonJsonPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "import json\nsummary = {'session_count': 3, 'total_minutes': 65, 'rejected_count': 0}\njson_report = ''\nprint(json_report)",
    expectedOutput: "{\"session_count\": 3, \"total_minutes\": 65, \"rejected_count\": 0}",
    checkYourAnswer: "Use new numbers without changing field names. Stable keys matter because tests and future API consumers depend on them.",
    tier: "replicate"
  },
  {
    starterCode: "import json\njson_report = '{\"total_minutes\": \"45\"}'\nparsed = json.loads(json_report)\n# Decide why this is the wrong contract.\nprint(parsed)",
    expectedOutput: "The failure is that total_minutes is text, not a number, so the contract should reject it.",
    checkYourAnswer: "Machine-readable does not only mean valid JSON text. The parsed types must match the contract the rest of the app expects.",
    tier: "diagnose"
  },
  {
    starterCode: "import json\nreport = {'sessions': [{'topic': 'python', 'minutes': 30}], 'totals': {'python': 30}, 'rejected_count': 1}\nprint(json.dumps(report))",
    expectedOutput: "JSON includes sessions, totals, and rejected_count so another tool can inspect the tracker result.",
    checkYourAnswer: "This is the project-shaped rep. Include enough stable fields for a dashboard or evidence log to consume without scraping terminal prose.",
    tier: "synthesize"
  },
  {
    starterCode: "# Review json report diff\n# + 'schema_version': 1\nprint('review: add version')",
    expectedOutput: "review: add schema_version field to json report for forward compatibility in parsers",
    checkYourAnswer: "Missing version field; future parsers may break. Add it. (review-sim)",
    tier: "review-sim"
  }
];

const professionalLoggingPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "value = '45'\nminutes = parse_minutes(value)\nprint(minutes)",
    expectedOutput: "45 minutes parsed successfully without warning logs.",
    checkYourAnswer: "The success path should stay boring. Logging should not turn normal input into noisy warnings.",
    tier: "replicate"
  },
  {
    starterCode: "try:\n    parse_minutes('')\nexcept TrackerInputError as error:\n    print(error)",
    expectedOutput: "minutes is required for empty input.",
    checkYourAnswer: "Failure rep: empty input and non-numeric input may need different user-facing messages.",
    tier: "diagnose"
  },
  {
    starterCode: "for value in ['30', 'soon']:\n    try:\n        parse_minutes(value)\n    except TrackerInputError:\n        pass\nprint(logs)",
    expectedOutput: "Logs include the invalid value soon but not the successful value 30.",
    checkYourAnswer: "Project-shaped rep: logs should preserve useful failure context without flooding normal runs.",
    tier: "synthesize"
  }
];

const professionalPytestPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "fixtures = ['clean_rows']\ntests = ['test_summary_totals']\nverification_commands = ['python -m pytest']\nprint(fixtures, tests, verification_commands)",
    expectedOutput: "clean_rows, test_summary_totals, and python -m pytest are listed.",
    checkYourAnswer: "Same idea with the happy-path fixture. It proves the command and behavior name are reproducible.",
    tier: "replicate"
  },
  {
    starterCode: "fixtures = ['messy_rows']\ntests = ['test_rejected_report']\nverification_commands = []\nprint(fixtures, tests)",
    expectedOutput: "messy_rows and test_rejected_report cover rejected input.",
    checkYourAnswer: "Failure rep: if there is no messy fixture, the test suite does not protect the bad-input behavior.",
    tier: "diagnose"
  },
  {
    starterCode: "verification_commands = ['python -m pytest', 'study-tracker --help', 'study-tracker --input sessions.csv --format json']\nprint(verification_commands)",
    expectedOutput: "The project-shaped command list includes tests plus CLI smoke and JSON output.",
    checkYourAnswer: "Professional evidence combines unit tests with one command that exercises the installed utility.",
    tier: "synthesize"
  },
  {
    starterCode: "import pytest\n\n@pytest.mark.parametrize('value,expected', [('15', 15), ('30', 30), ('0', 0)])\ndef test_parse_minutes(value, expected):\n    assert parse_minutes(value) == expected\n\n# Run the parametrize test with three inputs.\nprint('parametrize test ready')",
    expectedOutput: "parametrize test ready — the test runs three times: value 15, 30, and 0 all produce the expected integer.",
    checkYourAnswer: "Parametrize keeps the test logic in one place while covering multiple inputs. Each input pair is a separate test run, so a single failure does not block the others.",
    tier: "replicate"
  },
  {
    starterCode: "import pytest\n\ndef parse_minutes(value):\n    if not value.isdigit():\n        raise ValueError(f'Invalid minutes: {value}')\n    return int(value)\n\n# Bug: this test catches all exceptions instead of only ValueError.\ntry:\n    parse_minutes('soon')\n    assert False, 'should have raised'\nexcept Exception:\n    pass\nprint('fix the test to use pytest.raises instead of try/except')",
    expectedOutput: "The test passes even if parse_minutes raises TypeError instead of ValueError — masking the wrong exception.",
    checkYourAnswer: "Replace try/except with with pytest.raises(ValueError): to be precise about which exception you expect. A bare Exception catch masks real bugs.",
    tier: "diagnose"
  },
  {
    starterCode: "import pytest\n\ndef parse_minutes(value):\n    if not value.isdigit():\n        raise ValueError(f'Invalid minutes: {value}')\n    return int(value)\n\n# Write a parametrize test covering valid and invalid inputs.\n@pytest.mark.parametrize('value,expected', [\n    ('30', 30),\n    ('0', 0),\n    ('soon', None),  # should raise ValueError\n])\ndef test_parse_minutes(value, expected):\n    if expected is None:\n        with pytest.raises(ValueError):\n            parse_minutes(value)\n    else:\n        assert parse_minutes(value) == expected\n\nprint('parametrize and raises combined test ready')",
    expectedOutput: "The parametrize test covers three cases: two valid inputs return integers, and the invalid input triggers ValueError via pytest.raises.",
    checkYourAnswer: "Combine parametrize with raises by using expected=None to indicate the invalid case, then branch inside the test body. This keeps all test cases in one table.",
    tier: "synthesize"
  }
];

const professionalPyprojectPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "pyproject_toml = '[project]\\nname = \"study-tracker\"\\nversion = \"0.1.0\"\\nrequires-python = \">=3.11\"'\nprint(pyproject_toml)",
    expectedOutput: "[project], name, version, and requires-python are present.",
    checkYourAnswer: "Same metadata idea with a minimal project block. A reviewer should not infer these from filenames.",
    tier: "replicate"
  },
  {
    starterCode: "pyproject_toml = '[project]\\nname = \"study-tracker\"\\nversion = \"0.1.0\"'\nprint(pyproject_toml)",
    expectedOutput: "This should fail the professional gate because requires-python is missing.",
    checkYourAnswer: "Failure rep: missing Python version requirements make clean-machine setup more ambiguous.",
    tier: "diagnose"
  },
  {
    starterCode: "pyproject_toml = '[project.optional-dependencies]\\ndev = [\"pytest\", \"ruff\"]\\n\\n[tool.pytest.ini_options]\\ntestpaths = [\"tests\"]'\nprint(pyproject_toml)",
    expectedOutput: "Dev dependencies and pytest testpaths are declared for tools.",
    checkYourAnswer: "Project-shaped rep: tool-readable config belongs in pyproject; README prose explains it but does not replace it.",
    tier: "synthesize"
  }
];

const professionalInstallableCliPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "project_scripts = {'study-tracker': 'study_tracker.cli:main'}\nsmoke_command = 'study-tracker --help'\nprint(project_scripts)\nprint(smoke_command)",
    expectedOutput: "study-tracker maps to study_tracker.cli:main and has a --help smoke command.",
    checkYourAnswer: "Same entry point with the expected command. The command name should be stable for reviewers.",
    tier: "replicate"
  },
  {
    starterCode: "project_scripts = {'study-tracker': 'study_tracker.parser:parse_row'}\nprint(project_scripts)",
    expectedOutput: "This should fail because the console script points at parser logic instead of the CLI main.",
    checkYourAnswer: "Failure rep: entry points should coordinate CLI behavior, not expose an internal helper.",
    tier: "diagnose"
  },
  {
    starterCode: "install_commands = ['python -m pip install -e .', 'study-tracker --help', 'study-tracker --input sessions.csv --format json']\nprint(install_commands)",
    expectedOutput: "Editable install, help smoke, and JSON command are all documented.",
    checkYourAnswer: "Project-shaped rep: installability is proven by installation plus commands a reviewer can rerun.",
    tier: "synthesize"
  }
];

const pythonConfigPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "DEFAULT_CONFIG = {'format': 'text', 'output': 'summary.txt', 'min_minutes': 0}\nfile_config = {'output': 'weekly.txt'}\n# Merge without losing omitted defaults.\nprint(file_config)",
    expectedOutput: "{'format': 'text', 'output': 'weekly.txt', 'min_minutes': 0}",
    checkYourAnswer: "This repeats the merge with new data. File values update known defaults, but omitted defaults should still be present.",
    tier: "replicate"
  },
  {
    starterCode: "DEFAULT_CONFIG = {'format': 'text', 'output': 'summary.txt', 'min_minutes': 0}\nfile_config = {'format': 'json', 'secret_token': 'do-not-use'}\n# Ignore unknown or secret-looking keys.\nprint(file_config)",
    expectedOutput: "The config keeps format=json and rejects or ignores secret_token.",
    checkYourAnswer: "The failure case protects the boundary. Config should not silently accept unknown keys that could change behavior or leak secrets.",
    tier: "diagnose"
  },
  {
    starterCode: "config_sources = ['defaults', 'tracker.config.json', '--format json']\n# Write the precedence order the CLI will use.\nprint(config_sources)",
    expectedOutput: "CLI flags override config file values, and config file values override defaults.",
    checkYourAnswer: "Project-shaped config needs a visible precedence rule. Without it, a user cannot predict why a run produced JSON or text.",
    tier: "synthesize"
  }
];

const pythonCiPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "ci_commands = ['python -m pytest', 'study-tracker --help']\n# Add a JSON smoke command that proves report output still works.\nprint(ci_commands)",
    expectedOutput: "python -m pytest, study-tracker --help, and study-tracker --input sessions.csv --format json are present.",
    checkYourAnswer: "Repeat the gate with one more integration command. Unit tests plus an installed CLI smoke command catch different failures.",
    tier: "replicate"
  },
  {
    starterCode: "gate = {'lint': True, 'tests': False, 'cli_smoke': True, 'allowed': True}\n# Make allowed depend on every required check passing.\nprint(gate)",
    expectedOutput: "allowed is False when tests fail.",
    checkYourAnswer: "This is the failure rep. A quality gate that stays green when tests fail is not a gate; it is just a checklist.",
    tier: "diagnose"
  },
  {
    starterCode: "evidence = {'local': [], 'ci': [], 'limitation': ''}\n# Record local and CI evidence plus one limitation.\nprint(evidence)",
    expectedOutput: "Evidence names local commands, CI commands, and one limitation or skipped check.",
    checkYourAnswer: "Project-shaped CI evidence should be honest. If pre-commit is not installed yet, say that and keep pytest plus smoke output visible.",
    tier: "synthesize"
  }
];

const pythonProfessionalReviewPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "review_matrix = [{'area': 'structure', 'evidence': 'tree shows cli/parser/reports/tests'}]\n# Add metadata, command, config, logging, and tests rows.\nprint(review_matrix)",
    expectedOutput: "Rows cover structure, metadata, command, config, logging, and tests.",
    checkYourAnswer: "A professional review matrix is only useful when every quality area has evidence, not just a label.",
    tier: "replicate"
  },
  {
    starterCode: "weak_row = {'area': 'command', 'evidence': ''}\n# Explain why this row fails review.\nprint(weak_row)",
    expectedOutput: "The row fails because command evidence is empty or lacks study-tracker output.",
    checkYourAnswer: "This failure rep catches vague review notes. If the command row has no exact command output, installability is not proven.",
    tier: "diagnose"
  },
  {
    starterCode: "improvement = {'target': 'typing', 'decision': '', 'first_check': ''}\n# Choose whether to add mypy/pyright now or document runtime-only typing.\nprint(improvement)",
    expectedOutput: "The improvement records a typing decision and one check or limitation.",
    checkYourAnswer: "The professional improvement should help future maintainers. Adding lint checks or formal type assertions keeps interfaces stable.",
    tier: "synthesize"
  }
];


// ---------------------------------------------------------------------------
// Micro-lesson 1 — Structure Python Like a Project (run_file)
// ---------------------------------------------------------------------------

const projectStructureLesson = proofLesson({
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
  language: "Python project structure",
  tools: ["Python package", "module boundaries", "pytest"],
  synopsis: "When your project grows from 1 file to 10, how do you keep it organized?",
  prerequisites: [
    "Have a working study tracker script.",
    "Know which parts parse input, format reports, and handle command-line flags."
  ],
  testingFocus: "You will test the structure by proving the expected package files exist and that each one has one clear responsibility.",
  objective: "Split a one-file script into modules with clear responsibilities.",
  whyItMatters: "Reviewers trust code faster when they can find the entrypoint, parsing logic, report logic, and tests without reading a giant file.",
  coreConcept: "A module is one Python file or package area with a focused job. A module boundary is the line between responsibilities: cli.py handles arguments, parser.py handles rows, reports.py formats output, and tests prove behavior.",
  workedExample: "study_tracker/cli.py should know about argparse, while study_tracker/parser.py should not.",
  guidedExercise: "List the project files and assign one clear responsibility to each important module.",
  missionConnection: "This starts the professional utility mission by making the project reviewable before adding more features.",
  reflectionPrompt: "Which file should change when the CLI flag changes, and which file should remain untouched?",
  practiceStarter: "project_files = []\nmodule_roles = {}\n\n# Add package files and describe cli, parser, reports, and tests responsibilities.\nprint(project_files)\nprint(module_roles)",
  practiceExpected: "study_tracker/cli.py\nstudy_tracker/parser.py\nstudy_tracker/reports.py\ntests/test_parser.py",
  practiceCheck: "If cli.py and parser.py have the same responsibility, the split is not helping. Each module should own one reason to change, such as command flags or row parsing.",
  practiceReps: professionalProjectStructurePracticeReps,
  miniTitle: "Plan the professional package layout",
  miniGoal: "Create a package layout and module-role map for the study tracker.",
  miniSteps: ["List the package files", "Name each module's responsibility", "Identify where tests should live"],
  miniDeliverables: [
    "Project file list",
    "Module responsibility map",
    "One boundary decision note"
  ],
  verifierCommand: "python -m pytest",
  expectedEvidence: "File tree plus a note explaining why CLI parsing and row parsing live in different modules.",
  projectConnection: "This is the structure foundation for the Professional Python Utility mission.",
  requiredCodeIncludes: ["study_tracker/cli.py", "study_tracker/parser.py", "study_tracker/reports.py", "tests/test_parser.py"],
  requiredOutputIncludes: ["cli", "parser", "reports", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "project_files = []\nmodule_roles = {}\n\n# Add package files and describe cli, parser, reports, and tests responsibilities.\nprint(project_files)\nprint(module_roles)",
  runnerTestCode: "required = {'study_tracker/__init__.py', 'study_tracker/cli.py', 'study_tracker/parser.py', 'study_tracker/reports.py', 'tests/test_parser.py'}\nassert required.issubset(set(project_files))\nassert module_roles['cli'] == 'parse command arguments'\nassert module_roles['parser'] == 'turn rows into sessions'\nassert module_roles['reports'] == 'format output artifacts'\nprint('cli parser reports structure passed')",
  hiddenTests: [
    {
      id: "professional-layout-keeps-tests-outside-package",
      name: "Tests live outside package code",
      code: "assert any(path.startswith('tests/') for path in project_files)\nassert not any(path.startswith('study_tracker/tests') for path in project_files)"
    }
  ],
  curriculum: {
    level: 6,
    sequence: 1,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.structure.package", "py.structure.boundaries"],
    requires: ["py.cli.file_backed"],
    visibleCodeConcepts: ["py.structure.package", "py.structure.boundaries"],
    quizConcepts: ["py.structure.package", "py.structure.boundaries"],
    proofOutputs: ["terminal_stdout"]
  }
});

projectStructureLesson.depth = {
  primaryConceptId: "py.structure.package",
  secondaryConceptIds: ["py.structure.boundaries"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.structure.package",
      definition: "Structuring source files inside a folder containing __init__.py so Python treats it as an importable namespace.",
      mentalModel: "Think of a package as a folder dividers system: instead of storing all sheets in one pile (a single script), you create tabs (cli.py, parser.py) so someone can fetch just what they need.",
      syntaxShape: "study_tracker/\n  __init__.py\n  cli.py\n  parser.py",
      tinyExample: "from study_tracker.parser import parse_row",
      commonMistake: "Leaving out __init__.py, which prevents standard pytest tool imports from resolving.",
      repairHint: "Create an empty __init__.py inside the package folder.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.structure.boundaries",
      definition: "Keeping logical areas from sharing code imports that are outside their focus (e.g. parser does not import argparse).",
      mentalModel: "Clean rooms: you do not want mud from the garden (CLI argv strings) tracked all over the kitchen (pure calculation functions). Parser should handle clean string parameters.",
      syntaxShape: "No import argparse inside parser.py",
      tinyExample: "parser.py has pure functions",
      commonMistake: "Importing argparse or writing file open calls in parser.py, linking it directly to system paths.",
      repairHint: "Put all argparse definitions inside cli.py and pass simple variables to other modules.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-ps-1",
      label: "Package Init",
      codeFragment: "study_tracker/__init__.py",
      conceptIds: ["py.structure.package"],
      explanation: "Identifies the folder as a package namespace, letting python import its parts.",
      learnerShouldBeAbleToSay: "We mark the folder so it is importable."
    },
    {
      id: "w-ps-2",
      label: "Pure logic module",
      codeFragment: "from study_tracker.parser import parse_row",
      conceptIds: ["py.structure.boundaries"],
      explanation: "Imports the parsing logic into the CLI coordinator without bringing along file reads.",
      learnerShouldBeAbleToSay: "The parser module remains clean and independent."
    }
  ],
  guidedEdits: [
    {
      id: "g-ps-1",
      instruction: "Add 'study_tracker/__init__.py' to the project_files list.",
      conceptIds: ["py.structure.package"],
      targetCodeFragment: "project_files = []",
      expectedObservation: "The initialization file is included in the project package configuration.",
      wrongTurnHint: "Append 'study_tracker/__init__.py' to the project_files list."
    }
  ],
  errorClinic: [
    {
      id: "e-ps-1",
      conceptIds: ["py.structure.package"],
      brokenExample: "import cli\n# pytest: ModuleNotFoundError: No module named 'cli'",
      symptom: "pytest cannot find package files when run from the root directory.",
      likelyCause: "Importing directly from filenames without using the package namespace prefix.",
      fixStrategy: "Use package prefix: from study_tracker import cli"
    }
  ],
  codeLabBridge: {
    story: "A single script is fine for a quick exercise. Packages separate responsibilities so a reviewer can inspect one piece at a time.",
    usesConcepts: ["py.structure.package", "py.structure.boundaries"],
    learnerOwns: ["project_files", "module_roles"],
    checkerOwns: ["professional-layout-keeps-tests-outside-package"],
    runExpectation: "prints cli parser reports structure passed"
  },
  understandingProofPrompt: "Why should parser.py remain unaware of the command-line flags parsed by argparse?",
  exitTicket: [
    "I can organize files into importable Python packages.",
    "I understand how module boundaries keep core calculations reusable."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 2 — Model Data With Dataclasses (run_file)
// ---------------------------------------------------------------------------

const dataclassModelsLesson = proofLesson({
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
  language: "Python dataclasses",
  tools: ["dataclasses", "type hints", "assertions"],
  synopsis: "What if every one of your data records came with built-in validation and a clean print?",
  prerequisites: [
    "Know what fields a session needs.",
    "Know how parser functions turn raw input into program data."
  ],
  testingFocus: "You will test a valid session and a rejected invalid session so the model becomes a real contract, not just a class name.",
  objective: "Create a typed StudySession model with validation.",
  whyItMatters: "A professional parser should return a dependable domain object instead of many slightly different dictionaries.",
  coreConcept: "A dataclass is a Python shortcut for creating a small data model with named fields. It gives the project a named contract. __post_init__ runs after the object is created and can reject impossible values such as negative minutes.",
  workedExample: "StudySession(date='2026-05-07', topic='python', minutes=30) is easier to inspect than a loose dictionary.",
  guidedExercise: "Define StudySession, convert one row dictionary into it, and reject negative minutes.",
  missionConnection: "This prepares JSON reports, logging, and pytest tests to share the same data shape.",
  reflectionPrompt: "Which validation belongs in the model, and which validation belongs in row parsing before the model is created?",
  commonMistakes: ["Forgetting frozen=True to prevent mutation", "Adding methods that mutate fields"],
  practiceStarter: "from dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass StudySession:\n    date: str\n    topic: str\n    minutes: int\n\n    def __post_init__(self):\n        pass\n\ndef session_from_row(row):\n    return None\n\nsession = session_from_row({'date': '2026-05-07', 'topic': 'python', 'minutes': '30'})\nprint(session)",
  practiceExpected: "StudySession(date='2026-05-07', topic='python', minutes=30)",
  practiceCheck: "If minutes is still text, the parser conversion is incomplete. If negative minutes work, the model is not protecting the project from impossible data.",
  practiceReps: pythonDataclassPracticeReps,
  miniTitle: "Create the StudySession model",
  miniGoal: "Build a dataclass model and parser conversion function for tracker sessions.",
  miniSteps: ["Define StudySession as a frozen dataclass", "Convert row minutes into an integer", "Reject negative minutes"],
  miniDeliverables: [
    "StudySession dataclass",
    "session_from_row function",
    "Valid and invalid proof output"
  ],
  verifierCommand: "python -m pytest tests/test_models.py",
  expectedEvidence: "Passing output showing a valid StudySession and a rejected negative-minutes case.",
  projectConnection: "This gives the Professional Python Utility mission a domain model a reviewer can trust.",
  requiredCodeIncludes: ["@dataclass", "StudySession", "__post_init__", "session_from_row"],
  requiredOutputIncludes: ["StudySession", "minutes=30", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "from dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass StudySession:\n    date: str\n    topic: str\n    minutes: int\n\n    def __post_init__(self):\n        if self.minutes < 0:\n            raise ValueError('minutes must be positive')\n\ndef session_from_row(row):\n    try:\n        return StudySession(date=row['date'], topic=row['topic'], minutes=int(row['minutes']))\n    except (ValueError, KeyError):\n        return None\n\nsession = session_from_row({'date': '2026-05-07', 'topic': 'python', 'minutes': '30'})\nprint(session)",
  runnerTestCode: "assert session == StudySession(date='2026-05-07', topic='python', minutes=30)\nassert isinstance(session.minutes, int)\ntry:\n    StudySession(date='2026-05-07', topic='python', minutes=-1)\nexcept ValueError:\n    pass\nelse:\n    raise AssertionError('negative minutes should be rejected')\nprint('StudySession minutes=30 passed')",
  hiddenTests: [
    {
      id: "dataclass-model-converts-alternate-row",
      name: "Parser converts alternate row data",
      code: "other = session_from_row({'date': '2026-05-08', 'topic': 'git', 'minutes': '15'})\nassert other == StudySession(date='2026-05-08', topic='git', minutes=15)"
    }
  ],
  curriculum: {
    level: 6,
    sequence: 2,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.dataclass.model", "py.dataclass.validation"],
    requires: ["py.structure.package"],
    usesButDoesNotTeach: ["py.import", "py.dataclass"],
    visibleCodeConcepts: ["py.dataclass.model", "py.dataclass.validation"],
    quizConcepts: ["py.dataclass.model", "py.dataclass.validation"],
    proofOutputs: ["terminal_stdout"]
  }
});

dataclassModelsLesson.depth = {
  primaryConceptId: "py.dataclass.model",
  secondaryConceptIds: ["py.dataclass.validation"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.dataclass.model",
      definition: "Defining immutable structures with explicit types using Python's @dataclass(frozen=True) decorator.",
      mentalModel: "A plastic mold: a dictionary can grow new keys or hold bad types at any time. A frozen dataclass enforces one shape that cannot be changed once cast.",
      syntaxShape: "from dataclasses import dataclass\n@dataclass(frozen=True)\nclass Name:\n    field: type",
      tinyExample: "@dataclass(frozen=True)\nclass Session: topic: str",
      commonMistake: "Using normal classes without frozen=True, allowing code to modify fields in-place and breaking state consistency.",
      repairHint: "Add frozen=True to the @dataclass decorator.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.dataclass.validation",
      definition: "Using __post_init__ to execute validation checks immediately after a dataclass instance is initialized.",
      mentalModel: "Safety check: immediately after the factory casts the plastic mold, it measures the dimensions. If they are impossible (negative numbers), it throws it out.",
      syntaxShape: "def __post_init__(self):\n    if check: raise ValueError",
      tinyExample: "if self.minutes < 0: raise ValueError()",
      commonMistake: "Letting negative values pass initialization, causing report formatters to calculate impossible summaries.",
      repairHint: "Add a ValueError raise statement inside the __post_init__ function.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-dm-1",
      label: "Frozen decorator",
      codeFragment: "@dataclass(frozen=True)",
      conceptIds: ["py.dataclass.model"],
      explanation: "Tells Python to auto-generate constructor (__init__) and prevent fields from being reassigned.",
      learnerShouldBeAbleToSay: "We define a read-only class layout."
    },
    {
      id: "w-dm-2",
      label: "Instance validation",
      codeFragment: "def __post_init__(self):",
      conceptIds: ["py.dataclass.validation"],
      explanation: "Runs validation checks automatically after the constructor populates the fields.",
      learnerShouldBeAbleToSay: "This runs immediately after fields are populated."
    }
  ],
  guidedEdits: [
    {
      id: "g-dm-1",
      instruction: "Add a check to __post_init__ that raises a ValueError if the topic is empty string.",
      conceptIds: ["py.dataclass.validation"],
      targetCodeFragment: "def __post_init__(self):\n        if self.minutes < 0:\n            raise ValueError('minutes must be positive')",
      expectedObservation: "Creating a session with empty topic string now raises a ValueError.",
      wrongTurnHint: "Add 'if not self.topic: raise ValueError('topic cannot be empty')'."
    }
  ],
  errorClinic: [
    {
      id: "e-dm-1",
      conceptIds: ["py.dataclass.model"],
      brokenExample: "session = StudySession('date', 'topic', 30)\nsession.minutes = 45",
      symptom: "FrozenInstanceError: cannot assign to field 'minutes'",
      likelyCause: "Attempted to reassign a field on a frozen (immutable) dataclass instance.",
      fixStrategy: "Create a new instance instead of modifying: session = StudySession('date', 'topic', 45)"
    }
  ],
  codeLabBridge: {
    story: "Dictionaries are convenient, but typed dataclasses create clear expectations. They guarantee that other modules receive clean data shapes.",
    usesConcepts: ["py.dataclass.model", "py.dataclass.validation"],
    learnerOwns: ["StudySession", "session_from_row"],
    checkerOwns: ["dataclass-model-converts-alternate-row"],
    runExpectation: "prints StudySession minutes=30 passed"
  },
  understandingProofPrompt: "Why does marking a dataclass frozen=True help keep program state predictable?",
  exitTicket: [
    "I know how to define a frozen dataclass with Python type hints.",
    "I can write __post_init__ validation rules that block impossible field values."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 3 — Produce JSON Reports (run_file)
// ---------------------------------------------------------------------------

const jsonReportsLesson = proofLesson({
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
  language: "Python JSON",
  tools: ["json", "CLI output", "assertions"],
  synopsis: "Your CLI produces text output — how do you make it produce data that other programs can read?",
  prerequisites: [
    "Know how the tracker calculates totals.",
    "Know that JSON has strings, numbers, lists, booleans, and objects."
  ],
  testingFocus: "You will test JSON by parsing it back into a dictionary and asserting stable fields, instead of only checking that the text looks like JSON.",
  objective: "Format the tracker summary as deterministic JSON.",
  whyItMatters: "A professional CLI can support humans and automation. JSON output lets tests and other tools inspect exact fields instead of scraping text.",
  coreConcept: "JSON is a text format that uses objects, lists, strings, numbers, booleans, and null. json.dumps turns Python dictionaries into JSON text. Stable keys and simple value types make output predictable.",
  workedExample: "{\"session_count\": 2, \"total_minutes\": 45, \"rejected_count\": 1} is easier to assert than a paragraph.",
  guidedExercise: "Build a report dictionary and serialize it to JSON with the expected fields.",
  missionConnection: "This prepares the professional utility for integration with dashboards, evidence logs, or CI checks.",
  reflectionPrompt: "Which fields should be stable contract fields, and which details should stay as human-only explanation?",
  practiceStarter: "import json\n\nsummary = {'session_count': 2, 'total_minutes': 45, 'rejected_count': 1}\njson_report = ''\nprint(json_report)",
  practiceExpected: "{\"session_count\": 2, \"total_minutes\": 45, \"rejected_count\": 1}",
  practiceCheck: "If your test only checks that the output starts with a brace, parse it with json.loads and assert the actual fields. That proves the JSON is usable, not just pretty.",
  practiceReps: pythonJsonPracticeReps,
  miniTitle: "Add JSON report output",
  miniGoal: "Create deterministic JSON output for tracker summary data.",
  miniSteps: ["Build a report dictionary", "Serialize it with json.dumps", "Parse it back in a test and assert fields"],
  miniDeliverables: [
    "Report dictionary",
    "JSON output",
    "Parsed JSON assertion"
  ],
  verifierCommand: "python study_tracker.py --input sessions.csv --format json",
  expectedEvidence: "JSON output plus a test or assertion showing session_count, total_minutes, and rejected_count parse correctly.",
  projectConnection: "This makes the tracker useful beyond terminal reading and strengthens portfolio evidence.",
  requiredCodeIncludes: ["json.dumps", "session_count", "total_minutes", "rejected_count"],
  requiredOutputIncludes: ["session_count", "total_minutes", "45", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "import json\n\nsummary = {'session_count': 2, 'total_minutes': 45, 'rejected_count': 1}\njson_report = json.dumps(summary)\nprint(json_report)",
  runnerTestCode: "parsed = json.loads(json_report)\nassert parsed == {'session_count': 2, 'total_minutes': 45, 'rejected_count': 1}\nprint('session_count total_minutes 45 passed')",
  hiddenTests: [
    {
      id: "json-report-is-machine-readable",
      name: "JSON report is machine-readable",
      code: "assert isinstance(json.loads(json_report)['total_minutes'], int)"
    }
  ],
  curriculum: {
    level: 6,
    sequence: 3,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.json.dumps", "py.json.loads"],
    requires: ["py.dataclass.model"],
    usesButDoesNotTeach: ["py.import", "py.json"],
    visibleCodeConcepts: ["py.json.dumps", "py.json.loads"],
    quizConcepts: ["py.json.dumps", "py.json.loads"],
    proofOutputs: ["terminal_stdout"]
  }
});

jsonReportsLesson.depth = {
  primaryConceptId: "py.json.dumps",
  secondaryConceptIds: ["py.json.loads"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.json.dumps",
      definition: "Converting a Python dictionary or list structure into a valid serialized JSON string.",
      mentalModel: "Think of dumps as packaging: you place a toy (Python dict) inside a box (JSON string) so it can be shipped safely to other countries (other program environments).",
      syntaxShape: "json.dumps(dictionary_data)",
      tinyExample: "json.dumps({'val': 1})",
      commonMistake: "Trying to serialize custom objects (like dataclass instances) directly without converting them to dictionaries first, raising TypeError.",
      repairHint: "Use asdict() from dataclasses or build a simple parser dictionary before calling dumps().",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.json.loads",
      definition: "Converting a serialized JSON string back into a Python dictionary or list structure.",
      mentalModel: "Think of loads as unpacking: you open the shipping box (JSON string) and reconstruct the original toy structure (Python dict) to verify all parts match.",
      syntaxShape: "json.loads(json_string)",
      tinyExample: "json.loads('{\"val\": 1}')",
      commonMistake: "Checking for substring presence (like 'total_minutes' in string) instead of parsing it, which misses structure or validation errors.",
      repairHint: "Always parse JSON with loads() before running test assertions.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-jr-1",
      label: "Serialize structure",
      codeFragment: "json_report = json.dumps(summary)",
      conceptIds: ["py.json.dumps"],
      explanation: "Takes the summary dictionary and converts it to a clean serialized string.",
      learnerShouldBeAbleToSay: "We build a valid JSON text representing our totals."
    },
    {
      id: "w-jr-2",
      label: "Parse and verify",
      codeFragment: "parsed = json.loads(json_report)",
      conceptIds: ["py.json.loads"],
      explanation: "Unpacks the JSON string back to dict so tests can verify fields directly.",
      learnerShouldBeAbleToSay: "We unpack the string in our test to inspect dictionary keys."
    }
  ],
  guidedEdits: [
    {
      id: "g-jr-1",
      instruction: "Add sort_keys=True to json.dumps so that keys are printed in alphabetical order.",
      conceptIds: ["py.json.dumps"],
      targetCodeFragment: "json_report = json.dumps(summary)",
      expectedObservation: "The keys in serialized output appear ordered: rejected_count first, then session_count.",
      wrongTurnHint: "Call json.dumps(summary, sort_keys=True) to make the text serialization deterministic."
    }
  ],
  errorClinic: [
    {
      id: "e-jr-1",
      conceptIds: ["py.json.dumps"],
      brokenExample: "session = StudySession('a', 'b', 5)\njson.dumps(session)",
      symptom: "TypeError: Object of type StudySession is not JSON serializable",
      likelyCause: "Dataclass instances are not automatically converted to JSON primitive structures.",
      fixStrategy: "Convert to dictionary first: from dataclasses import asdict; json.dumps(asdict(session))"
    }
  ],
  codeLabBridge: {
    story: "Automated scripts need stable schemas. Exposing reports in JSON allows external systems to read metrics safely.",
    usesConcepts: ["py.json.dumps", "py.json.loads"],
    learnerOwns: ["summary", "json_report"],
    checkerOwns: ["json-report-is-machine-readable"],
    runExpectation: "prints session_count total_minutes 45 passed"
  },
  understandingProofPrompt: "Why are JSON keys sorted alphabetically when packaging data outputs for other tools?",
  exitTicket: [
    "I know how to serialize Python dictionaries using json.dumps.",
    "I can write assertions that parse JSON strings before checking fields."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 4 — Log Failures Without Hiding Them (run_file)
// ---------------------------------------------------------------------------

const loggingErrorsLesson = proofLesson({
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
  language: "Python logging",
  tools: ["logging", "custom exceptions", "terminal"],
  synopsis: "Your program runs overnight and crashes at 3am. How do you find out why?",
  prerequisites: [
    "Know why bad minutes should be rejected.",
    "Know how try/except catches expected failures."
  ],
  testingFocus: "You will test the returned valid value, the custom exception, and the captured log message so success and failure are both proven.",
  objective: "Raise a project-specific error and log the context.",
  whyItMatters: "A professional utility should fail loudly enough for developers and clearly enough for users. Logging and custom exceptions help you serve both audiences.",
  coreConcept: "An exception is Python's way to signal that something went wrong. A custom exception such as TrackerInputError names an expected user-input problem. A logger records context so the failure can be diagnosed later.",
  workedExample: "parse_minutes('soon') can log invalid minutes: soon and raise TrackerInputError('minutes must be a number').",
  guidedExercise: "Implement a parser that logs invalid input and raises a custom exception instead of returning fake data.",
  missionConnection: "This prepares the professional utility for reliable troubleshooting and honest CLI errors.",
  reflectionPrompt: "Which information belongs in the log, and which information should be shown to the CLI user?",
  practiceStarter: "import logging\n\nlogs = []\n\nclass TrackerInputError(Exception):\n    pass\n\n# Configure logger and implement parse_minutes.\ndef parse_minutes(value):\n    return None\n\nprint(parse_minutes('30'))",
  practiceExpected: "30\ninvalid minutes: soon",
  practiceCheck: "If invalid input returns 0, the program is hiding bad data. It should log context and raise the project-specific error.",
  practiceReps: professionalLoggingPracticeReps,
  miniTitle: "Add logged custom errors",
  miniGoal: "Create a custom input error and log invalid minute values before raising it.",
  miniSteps: ["Define TrackerInputError", "Configure a logger that captures warning messages", "Raise TrackerInputError for invalid minutes"],
  miniDeliverables: [
    "Custom exception",
    "Logging setup",
    "Valid and invalid parser proof"
  ],
  verifierCommand: "python -m pytest tests/test_errors.py",
  expectedEvidence: "Passing tests showing valid minutes parse, invalid minutes raise TrackerInputError, and logs capture the bad value.",
  projectConnection: "This makes the professional utility easier to debug and safer to use.",
  requiredCodeIncludes: ["TrackerInputError", "logging", "logger.warning", "parse_minutes"],
  requiredOutputIncludes: ["invalid minutes", "soon", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "import logging\n\nlogs = []\n\nclass TrackerInputError(Exception):\n    pass\n\nclass ListHandler(logging.Handler):\n    def emit(self, record):\n        logs.append(record.getMessage())\n\nlogger = logging.getLogger('study_tracker')\nlogger.handlers = []\nlogger.addHandler(ListHandler())\nlogger.setLevel(logging.INFO)\n\ndef parse_minutes(value):\n    try:\n        return int(value)\n    except ValueError:\n        logger.warning(f\"invalid minutes: {value}\")\n        raise TrackerInputError('minutes must be a number')\n\nvalid_minutes = parse_minutes('30')\nprint(valid_minutes)",
  runnerTestCode: "assert valid_minutes == 30\ntry:\n    parse_minutes('soon')\nexcept TrackerInputError as error:\n    assert str(error) == 'minutes must be a number'\nelse:\n    raise AssertionError('invalid minutes should raise TrackerInputError')\nassert 'invalid minutes: soon' in logs\nprint('invalid minutes soon passed')",
  hiddenTests: [
    {
      id: "logging-errors-keeps-logger-name",
      name: "Logger keeps project-specific name",
      code: "assert logger.name == 'study_tracker'"
    }
  ],
  curriculum: {
    level: 6,
    sequence: 4,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.logging.warning", "py.errors.custom"],
    requires: ["py.dataclass.model"],
    usesButDoesNotTeach: ["py.import", "py.logging"],
    visibleCodeConcepts: ["py.logging.warning", "py.errors.custom"],
    quizConcepts: ["py.logging.warning", "py.errors.custom"],
    proofOutputs: ["terminal_stdout"]
  }
});

loggingErrorsLesson.depth = {
  primaryConceptId: "py.logging.warning",
  secondaryConceptIds: ["py.errors.custom"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.logging.warning",
      definition: "Using Python's standard logging module to record non-fatal context alerts without interrupting logic.",
      mentalModel: "Think of logging like writing in a diary: if something strange happens (invalid inputs), you write it down. Later, if you get confused, you read the diary to see exactly what happened.",
      syntaxShape: "logger.warning(message)",
      tinyExample: "logger.warning('bad CSV split')",
      commonMistake: "Using basic print() statements for warnings, which write to stdout and mess up machine-readable JSON outputs.",
      repairHint: "Always use logger.warning() or logger.error() so messages print to stderr instead of stdout.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.errors.custom",
      definition: "Creating custom class exceptions (TrackerInputError) derived from Exception to name distinct failure states.",
      mentalModel: "Sticky labels: instead of marking every package problem with a generic 'Error' label, you write 'Damaged Contents' (TrackerInputError). Your code can identify that label specifically.",
      syntaxShape: "class TrackerInputError(Exception): pass",
      tinyExample: "raise TrackerInputError('error message')",
      commonMistake: "Raising generic Exception('text') for expected user mistakes, which makes catching specific bugs impossible without string matching.",
      repairHint: "Define a clean sub-class inheriting Exception for user inputs.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-le-1",
      label: "Custom exception label",
      codeFragment: "class TrackerInputError(Exception): pass",
      conceptIds: ["py.errors.custom"],
      explanation: "Declares a unique exception name. We can catch this error specifically in try/except blocks.",
      learnerShouldBeAbleToSay: "We define a custom input exception class."
    },
    {
      id: "w-le-2",
      label: "Log failed argument",
      codeFragment: "logger.warning(f'invalid minutes: {value}')",
      conceptIds: ["py.logging.warning"],
      explanation: "Saves the bad value to logging streams for audit context before throwing.",
      learnerShouldBeAbleToSay: "We record what string value caused the conversion error."
    }
  ],
  guidedEdits: [
    {
      id: "g-le-1",
      instruction: "Add a check to parse_minutes that raises TrackerInputError immediately if value is empty string.",
      conceptIds: ["py.errors.custom"],
      targetCodeFragment: "def parse_minutes(value):\n    try:",
      expectedObservation: "Empty minutes now throw TrackerInputError before integer conversion attempts.",
      wrongTurnHint: "Add 'if not value: raise TrackerInputError()' at start of parse_minutes."
    }
  ],
  errorClinic: [
    {
      id: "e-le-1",
      conceptIds: ["py.errors.custom"],
      brokenExample: "try:\n    parse_minutes('soon')\nexcept Exception:\n    print('error happened')",
      symptom: "All runtime bugs (like spelling typos inside parse_minutes) are caught and hidden.",
      likelyCause: "Catching a generic Exception instead of our specific TrackerInputError class.",
      fixStrategy: "Catch only the custom input label: except TrackerInputError:"
    }
  ],
  codeLabBridge: {
    story: "Hiding errors makes tools quiet but fragile. Log the context, raise a custom exception, and let the command coordinator handle formatting.",
    usesConcepts: ["py.logging.warning", "py.errors.custom"],
    learnerOwns: ["TrackerInputError", "parse_minutes"],
    checkerOwns: ["logging-errors-keeps-logger-name"],
    runExpectation: "prints invalid minutes soon passed"
  },
  understandingProofPrompt: "Why should we avoid printing error warnings to standard output (stdout) when writing CLI tools?",
  exitTicket: [
    "I can define custom exceptions to isolate program errors.",
    "I know how to write log warning records that write to stderr channels."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 5 — Prove It With Pytest and CI Commands (run_file)
// ---------------------------------------------------------------------------

const pytestCiLesson = proofLesson({
  id: "lesson-python-pytest-ci",
  moduleId: "module-python-professional",
  slug: "python-pytest-ci",
  title: "Prove It With Pytest and CI Commands",
  summary: "Organize repeatable tests with fixtures, parametrized cases, and exception assertions a reviewer can run.",
  bodyMarkdown: "Professional project proof is repeatable. A reviewer should see the fixtures, test cases, parametrized input combinations, and exact commands that prove the utility still works after changes. Use @pytest.mark.parametrize to run one test across many input pairs, and pytest.raises() to assert that invalid input raises the expected exception.",
  estimatedMinutes: 16,
  difficulty: "portfolio",
  skillIds: ["skill-python-professional", "skill-testing-debugging", "skill-portfolio-evidence"],
  quizId: "quiz-python-pytest-ci",
  desktopTask: "Create pytest fixtures for clean and messy rows, then document python -m pytest and one CLI smoke command.",
  evidencePrompt: "Record the fixture names, test names, exact commands, and final passing output.",
  language: "Python testing",
  tools: ["pytest", "fixtures", "CI-style commands"],
  synopsis: "How do you write a test that sets up data, runs code, and cleans up — without repeating yourself?",
  prerequisites: [
    "Have parser and report behavior to test.",
    "Know why clean and messy inputs both matter."
  ],
  testingFocus: "You will test that fixture names, test names, and verification commands cover clean rows, messy rows, and CLI smoke behavior.",
  objective: "Create repeatable pytest evidence for the professional utility.",
  whyItMatters: "Manual runs are useful, but professional projects need a verifier that runs the same way for every reviewer and future change.",
  coreConcept: "A fixture is reusable sample data for tests. Tests name behavior. Verification commands document how to run the proof from a clean checkout.",
  workedExample: "A clean_rows fixture can support test_summary_totals, while messy_rows can support test_rejected_report.",
  guidedExercise: "Define fixture names, test names, and verification commands for the tracker.",
  missionConnection: "This turns the professional utility into a portfolio-ready artifact with reviewer-grade proof.",
  reflectionPrompt: "Which behavior would break first if a future change damaged parsing, and which test would catch it?",
  practiceStarter: "fixtures = []\ntests = []\nverification_commands = []\n\n# Add professional pytest fixtures, test names, and commands.\nprint(fixtures)\nprint(tests)\nprint(verification_commands)",
  practiceExpected: "clean_rows\nmessy_rows\ntest_summary_totals\ntest_rejected_report\npython -m pytest",
  practiceCheck: "If your commands do not include python -m pytest, a reviewer may not know how to reproduce the test proof exactly. A smoke command is a quick run that proves the CLI still starts.",
  practiceReps: professionalPytestPracticeReps,
  miniTitle: "Create professional verification evidence",
  miniGoal: "Define the pytest fixtures, test cases, and verification commands that prove the utility works.",
  miniSteps: ["Name fixtures for clean and messy input", "Name tests for totals and rejected reports", "Document pytest and CLI smoke commands"],
  miniDeliverables: [
    "Fixture plan",
    "Test plan",
    "Verification command list"
  ],
  verifierCommand: "python -m pytest && python study_tracker.py --input sessions.csv --output summary.txt",
  expectedEvidence: "Passing pytest output plus a CLI smoke command that proves the packaged utility still runs.",
  projectConnection: "This is the verification standard for the Professional Python Utility mission.",
  requiredCodeIncludes: ["clean_rows", "messy_rows", "test_summary_totals", "test_rejected_report", "python -m pytest"],
  requiredOutputIncludes: ["pytest", "summary", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "fixtures = ['clean_rows', 'messy_rows']\ntests = ['test_summary_totals', 'test_rejected_report']\nverification_commands = ['python -m pytest', 'python study_tracker.py --input sessions.csv --output summary.txt']\nprint(fixtures)\nprint(tests)\nprint(verification_commands)",
  runnerTestCode: "assert 'clean_rows' in fixtures\nassert 'messy_rows' in fixtures\nassert 'test_summary_totals' in tests\nassert 'test_rejected_report' in tests\nassert 'python -m pytest' in verification_commands\nassert any('study_tracker.py --input sessions.csv --output summary.txt' in command for command in verification_commands)\nprint('pytest summary passed')",
  hiddenTests: [
    {
      id: "pytest-ci-plan-covers-cli-smoke",
      name: "Verification plan includes CLI smoke proof",
      code: "assert any(command.startswith('python study_tracker.py') for command in verification_commands)"
    }
  ],
  curriculum: {
    level: 6,
    sequence: 5,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.pytest.fixtures", "py.pytest.smoke", "py.pytest.parametrize", "py.pytest.raises"],
    requires: ["py.dataclass.model"],
    usesButDoesNotTeach: ["py.csv", "py.json", "py.import"],
    visibleCodeConcepts: ["py.pytest.fixtures", "py.pytest.smoke", "py.pytest.parametrize", "py.pytest.raises"],
    quizConcepts: ["py.pytest.fixtures", "py.pytest.smoke", "py.pytest.parametrize", "py.pytest.raises"],
    proofOutputs: ["terminal_stdout"]
  }
});

pytestCiLesson.depth = {
  primaryConceptId: "py.pytest.fixtures",
  secondaryConceptIds: ["py.pytest.smoke", "py.pytest.parametrize", "py.pytest.raises"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.pytest.fixtures",
      definition: "Creating reusable helper functions decorated with @pytest.fixture to deliver stable test datasets to test cases.",
      mentalModel: "Think of a fixture like a stage set: before actors (test statements) perform, the crew sets up the tables and chairs (fixtures) so the scene starts in a known state.",
      syntaxShape: "import pytest\n@pytest.fixture\ndef clean_data():\n    return [...]",
      tinyExample: "@pytest.fixture\ndef rows(): return []",
      commonMistake: "Modifying fixtures in-place during tests, which pollutes test runs for other assertions.",
      repairHint: "Make fixtures return fresh, clean structures and treat them as read-only inside test arguments.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.pytest.smoke",
      definition: "Executing a lightweight command that runs the entire program loop with basic parameters, verifying that packaging works.",
      mentalModel: "Turn the key: you do not drive the car for 10 miles (regression check), you just turn the ignition to make sure the starter motor turns over (CLI responds).",
      syntaxShape: "python -m study_tracker.cli --help",
      tinyExample: "study-tracker --help",
      commonMistake: "Relying purely on module tests, leaving broken entry point configurations unnoticed until deployment.",
      repairHint: "Include a single, simple command line execution in your verification documentation.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.pytest.parametrize",
      definition: "Using @pytest.mark.parametrize decorator to run a single test function against multiple input-output pairs without duplicating test code.",
      mentalModel: "Think of parametrize as a test blueprint: instead of writing one test per input, you write the test once and list the inputs and expected outputs in a table. pytest runs the test body for every row in that table.",
      syntaxShape: '@pytest.mark.parametrize("input,expected", [("a", 1), ("b", 2)])\ndef test_example(input, expected):\n    assert function(input) == expected',
      tinyExample: '@pytest.mark.parametrize("minutes,expected", [("30", 30), ("15", 15), ("0", 0)])\ndef test_parse_minutes(minutes, expected):\n    assert parse_minutes(minutes) == expected',
      commonMistake: "Forgetting that parametrize string names must match the test function parameter names exactly, or pytest skips the test silently.",
      repairHint: "Every name in the parametrize string must appear as a function argument with the exact same spelling.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.pytest.raises",
      definition: "Using the pytest.raises() context manager to assert that a specific exception type is raised during code execution.",
      mentalModel: "Think of pytest.raises as a tripwire: you wrap the code that should fail, and if the expected exception does not appear, the test fails. This proves your error handling is working.",
      syntaxShape: "with pytest.raises(ValueError):\n    parse_minutes('soon')",
      tinyExample: "import pytest\nwith pytest.raises(ValueError):\n    int('not-a-number')",
      commonMistake: "Using bare try/except in tests instead of pytest.raises(), which can mask unexpected failures or catch the wrong exception.",
      repairHint: "Replace try/except blocks in test code with with pytest.raises(ExpectedError): to be precise about which exception you expect.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-pc-1",
      label: "Reusable fixture",
      codeFragment: "@pytest.fixture\ndef clean_rows():\n    return ['2026-05-07,python,30']",
      conceptIds: ["py.pytest.fixtures"],
      explanation: "Declares clean_rows dataset. pytest feeds this list directly to test functions that match the argument name.",
      learnerShouldBeAbleToSay: "We declare a standard input list for our calculations."
    },
    {
      id: "w-pc-2",
      label: "Smoke command check",
      codeFragment: "python -m pytest && study-tracker --help",
      conceptIds: ["py.pytest.smoke"],
      explanation: "Runs both unit tests and confirms the command-line interface starts up successfully.",
      learnerShouldBeAbleToSay: "We prove internal logic is verified and CLI entry works."
    },
    {
      id: "w-pc-3",
      label: "Parametrized test",
      codeFragment: '@pytest.mark.parametrize("value,expected", [("30", 30), ("15", 15)])\ndef test_parse_minutes(value, expected):\n    assert parse_minutes(value) == expected',
      conceptIds: ["py.pytest.parametrize"],
      explanation: "Runs the test twice: once with value='30' expecting 30, once with '15' expecting 15. No loop, no duplicate functions.",
      learnerShouldBeAbleToSay: "Parametrize lets me cover multiple inputs without writing repetitive test functions."
    },
    {
      id: "w-pc-4",
      label: "Exception assertion with pytest.raises",
      codeFragment: "with pytest.raises(ValueError):\n    parse_minutes('soon')",
      conceptIds: ["py.pytest.raises"],
      explanation: "Asserts that parse_minutes raises ValueError when given non-numeric input. If no exception or a different exception is raised, the test fails.",
      learnerShouldBeAbleToSay: "pytest.raises proves my function rejects invalid input with the right exception."
    }
  ],
  guidedEdits: [
    {
      id: "g-pc-1",
      instruction: "Add 'test_rejected_report' to the tests array.",
      conceptIds: ["py.pytest.fixtures"],
      targetCodeFragment: "tests = ['test_summary_totals']",
      expectedObservation: "The test list includes coverage for rejections reporting.",
      wrongTurnHint: "Append 'test_rejected_report' to the tests list."
    }
  ],
  errorClinic: [
    {
      id: "e-pc-1",
      conceptIds: ["py.pytest.fixtures"],
      brokenExample: "def test_totals(clean_rows):\n    # forgot @pytest.fixture on clean_rows",
      symptom: "FixtureLookupError: fixture 'clean_rows' not found",
      likelyCause: "The data function was declared but not registered using the @pytest.fixture decorator.",
      fixStrategy: "Add decoration: @pytest.fixture\ndef clean_rows():"
    }
  ],
  codeLabBridge: {
    story: "Assertions in comments are easily ignored. Package tests as fixtures and commands so that anyone can repeat the proof.",
    usesConcepts: ["py.pytest.fixtures", "py.pytest.smoke"],
    learnerOwns: ["fixtures", "tests", "verification_commands"],
    checkerOwns: ["pytest-ci-plan-covers-cli-smoke"],
    runExpectation: "prints pytest summary passed"
  },
  understandingProofPrompt: "Why does pytest require matching function argument names to locate registered fixtures?",
  exitTicket: [
    "I know how to declare pytest datasets using fixtures.",
    "I understand why CLI smoke commands catch packaging entry point failures."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 6 — Declare the Project With pyproject.toml (concept_only)
// ---------------------------------------------------------------------------

const pyprojectMetadataLesson = proofLesson({
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
  language: "Python packaging",
  tools: ["pyproject.toml", "pytest", "packaging metadata"],
  synopsis: "How does pip know what your package is called, who wrote it, and what it needs to run?",
  prerequisites: [
    "Know the utility package name.",
    "Know the test folder and minimum Python version the project expects."
  ],
  testingFocus: "You will test that the pyproject text includes project metadata, dev dependencies, and pytest configuration.",
  objective: "Write a minimal pyproject.toml for the professional utility.",
  whyItMatters: "Packaging metadata makes the project installable, inspectable, and tool-friendly. Without it, reviewers have to infer the project name, Python version, and test setup.",
  coreConcept: "pyproject.toml is the standard project configuration file for modern Python tools. A strong pyproject.toml starts with [project], name, version, requires-python, optional dev dependencies, and tool configuration for pytest.",
  workedExample: "[project] name = 'study-tracker' and [tool.pytest.ini_options] testpaths = ['tests'] tell humans and tools what this project is.",
  guidedExercise: "Draft the pyproject.toml content that defines the tracker as a Python project.",
  missionConnection: "This prepares the installable CLI lesson and makes the Professional Python Utility mission closer to a real package.",
  reflectionPrompt: "Which metadata helps a reviewer install the project, and which metadata helps test tools run consistently?",
  practiceStarter: "pyproject_toml = \"\"\"\n[project]\nname = \"\"\nversion = \"\"\nrequires-python = \"\"\n\n[tool.pytest.ini_options]\ntestpaths = []\n\"\"\"\nprint(pyproject_toml)",
  practiceExpected: "[project]\nname = \"study-tracker\"\nrequires-python = \">=3.11\"\ntestpaths = [\"tests\"]",
  practiceCheck: "If pytest settings only exist in your README, tooling cannot read them. Put repeatable configuration in pyproject.toml and use the README to explain it.",
  practiceReps: professionalPyprojectPracticeReps,
  miniTitle: "Create packaging metadata",
  miniGoal: "Write a minimal pyproject.toml that identifies the utility and configures tests.",
  miniSteps: ["Add [project] metadata", "Declare requires-python", "Add pytest testpaths under tool configuration"],
  miniDeliverables: [
    "pyproject.toml text",
    "Python version requirement",
    "pytest testpath configuration"
  ],
  verifierCommand: "python -m pytest",
  expectedEvidence: "pyproject.toml excerpt plus pytest output showing tests are discovered from the configured folder.",
  projectConnection: "This is the package metadata foundation for the Professional Python Utility mission.",
  requiredCodeIncludes: ["[project]", "name", "version", "requires-python", "[tool.pytest.ini_options]"],
  requiredOutputIncludes: ["study-tracker", "tests", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "pyproject_toml = \"\"\"\n[project]\nname = \"study-tracker\"\nversion = \"0.1.0\"\nrequires-python = \">=3.11\"\n[project.optional-dependencies]\ndev = [\"pytest\"]\n[tool.pytest.ini_options]\ntestpaths = [\"tests\"]\n\"\"\"\nprint(pyproject_toml)",
  runnerTestCode: "assert '[project]' in pyproject_toml\nassert 'name = \"study-tracker\"' in pyproject_toml\nassert 'version = \"0.1.0\"' in pyproject_toml\nassert 'requires-python = \">=3.11\"' in pyproject_toml\nassert '[tool.pytest.ini_options]' in pyproject_toml\nassert 'testpaths = [\"tests\"]' in pyproject_toml\nprint('study-tracker tests passed')",
  hiddenTests: [
    {
      id: "pyproject-has-dev-test-dependency",
      name: "pyproject includes dev test dependency",
      code: "assert '[project.optional-dependencies]' in pyproject_toml\nassert 'pytest' in pyproject_toml"
    }
  ],
  curriculum: {
    level: 6,
    sequence: 6,
    version: "1.0.0",
    lessonKind: "concept_only",
    teaches: ["py.metadata.pyproject", "py.metadata.dependencies"],
    requires: ["py.structure.package"],
    visibleCodeConcepts: ["py.metadata.pyproject", "py.metadata.dependencies"],
    quizConcepts: ["py.metadata.pyproject", "py.metadata.dependencies"],
    proofOutputs: ["terminal_stdout"]
  }
});

pyprojectMetadataLesson.depth = {
  primaryConceptId: "py.metadata.pyproject",
  secondaryConceptIds: ["py.metadata.dependencies"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.metadata.pyproject",
      definition: "Writing a pyproject.toml configuration file to declare Python requirements, project version, and tool parameters in a standard place.",
      mentalModel: "The shipping manifest: it lists exactly what container version is used, what content is inside, and what machinery must be present to unpack it.",
      syntaxShape: "[project]\nname = '...'\nrequires-python = '>=3.11'",
      tinyExample: "requires-python = '>=3.11'",
      commonMistake: "Hardcoding tool path exclusions only in IDE directories, leaving other test frameworks clueless on where tests are stored.",
      repairHint: "Use [tool.pytest.ini_options] to set testpaths = ['tests'].",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.metadata.dependencies",
      definition: "Listing required library names (like pytest) inside dependency or optional-dependency metadata arrays.",
      mentalModel: "Required toolbox: telling a mechanic 'I need a wrench' (declaring pytest) so the workshop installer fetches it before he begins to inspect the engine.",
      syntaxShape: "dev = ['pytest']",
      tinyExample: "dev = ['pytest']",
      commonMistake: "Leaving dependencies unlisted, forcing reviewers to run pip installs in loops after encountering missing module exceptions.",
      repairHint: "Define dev tools under [project.optional-dependencies] in pyproject.toml.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-pm-1",
      label: "Project Block",
      codeFragment: "[project]\nname = 'study-tracker'",
      conceptIds: ["py.metadata.pyproject"],
      explanation: "Declares project block metadata and specifies study-tracker as package name.",
      learnerShouldBeAbleToSay: "We name the package consistently for pip installs."
    },
    {
      id: "w-pm-2",
      label: "Test Paths",
      codeFragment: "[tool.pytest.ini_options]\ntestpaths = ['tests']",
      conceptIds: ["py.metadata.pyproject"],
      explanation: "Configures pytest defaults, pointing to test folders to restrict discover searches.",
      learnerShouldBeAbleToSay: "We direct testing tools to search inside the tests folder."
    }
  ],
  guidedEdits: [
    {
      id: "g-pm-1",
      instruction: "Add 'pytest' dependency string to pyproject_toml.",
      conceptIds: ["py.metadata.dependencies"],
      targetCodeFragment: "pyproject_toml = \"\"\"",
      expectedObservation: "The developer test dependency is listed clearly in optional dependencies block.",
      wrongTurnHint: "Add dev = ['pytest'] below optional dependencies."
    }
  ],
  errorClinic: [
    {
      id: "e-pm-1",
      conceptIds: ["py.metadata.pyproject"],
      brokenExample: "# pyproject.toml\n[project]\n# forgot requires-python",
      symptom: "Script installs but crashes on older Python runtimes due to syntax incompatibility.",
      likelyCause: "Omitted minimum python runtime declarations, letting it execute on unsupported platforms.",
      fixStrategy: "Add metadata constraint: requires-python = '>=3.11'"
    }
  ],
  codeLabBridge: {
    story: "A reviewer needs standard hooks to install and run code. Defining project packaging metadata makes verification automatic.",
    usesConcepts: ["py.metadata.pyproject", "py.metadata.dependencies"],
    learnerOwns: ["pyproject_toml"],
    checkerOwns: ["pyproject-has-dev-test-dependency"],
    runExpectation: "prints study-tracker tests passed"
  },
  understandingProofPrompt: "Why does pyproject.toml replace legacy setup.py script files in modern Python packaging?",
  exitTicket: [
    "I know how to write pyproject.toml package metadata tags.",
    "I understand why requires-python constraints prevent runtime errors."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 7 — Make the CLI Installable (run_file)
// ---------------------------------------------------------------------------

const installableCliLesson = proofLesson({
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
  language: "Python packaging",
  tools: ["pyproject.toml", "console scripts", "CLI smoke test"],
  synopsis: "You've built a great tool — how do you install it with `pip install` like every other Python tool?",
  prerequisites: [
    "Have a package module with cli.py.",
    "Know what main() should call without owning all business logic."
  ],
  testingFocus: "You will test that the entry point maps study-tracker to study_tracker.cli:main and that a smoke command is documented.",
  objective: "Add a console script entry point for the tracker.",
  whyItMatters: "An installable CLI is easier to review because the command name becomes stable. The reviewer should not need to know which Python file happens to be the entrypoint.",
  coreConcept: "A console script entry point connects an installed command name to a Python function. [project.scripts] maps a command name to a Python function such as study_tracker.cli:main.",
  workedExample: "study-tracker = 'study_tracker.cli:main' means the installed command can call the package entrypoint.",
  guidedExercise: "Define the script entry point and the smoke command that proves it works.",
  missionConnection: "This turns the professional utility from a script into an installable local tool.",
  reflectionPrompt: "What should main() own, and what logic should remain in parser or reports modules?",
  practiceStarter: "project_scripts = {}\nmain_function = \"\"\nsmoke_command = \"\"\n\n# Add the installable CLI command mapping and smoke command.\nprint(project_scripts)\nprint(smoke_command)",
  practiceExpected: "study-tracker -> study_tracker.cli:main\nstudy-tracker --help",
  practiceCheck: "If the entry point does not end in :main, make sure the referenced function exists and only coordinates the CLI flow. The calculation logic should still live in focused modules.",
  practiceReps: professionalInstallableCliPracticeReps,
  miniTitle: "Expose the study-tracker command",
  miniGoal: "Define the console script entry point and smoke command for the installed utility.",
  miniSteps: ["Add the [project.scripts] mapping", "Point it at study_tracker.cli:main", "Document an installed-command smoke test"],
  miniDeliverables: [
    "Script entry point",
    "main function path",
    "Smoke command"
  ],
  verifierCommand: "python -m pip install -e . && study-tracker --help",
  expectedEvidence: "Entry-point excerpt plus smoke command output proving the installed command runs.",
  projectConnection: "This makes the Professional Python Utility behave like a real local command-line package.",
  requiredCodeIncludes: ["[project.scripts]", "study-tracker", "study_tracker.cli:main"],
  requiredOutputIncludes: ["study-tracker", "--help", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "project_scripts = {'study-tracker': 'study_tracker.cli:main'}\nmain_function = 'study_tracker.cli:main'\nsmoke_command = 'study-tracker --help'\nprint(project_scripts)\nprint(smoke_command)",
  runnerTestCode: "assert project_scripts == {'study-tracker': 'study_tracker.cli:main'}\nassert main_function == 'study_tracker.cli:main'\nassert smoke_command == 'study-tracker --help'\nprint('study-tracker --help passed')",
  hiddenTests: [
    {
      id: "installable-cli-uses-package-module",
      name: "Entry point uses package module",
      code: "assert project_scripts['study-tracker'].startswith('study_tracker.')"
    }
  ],
  curriculum: {
    level: 6,
    sequence: 7,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.packaging.scripts", "py.packaging.install"],
    requires: ["py.metadata.pyproject"],
    usesButDoesNotTeach: ["py.csv", "py.json"],
    visibleCodeConcepts: ["py.packaging.scripts", "py.packaging.install"],
    quizConcepts: ["py.packaging.scripts", "py.packaging.install"],
    proofOutputs: ["terminal_stdout"]
  }
});

installableCliLesson.depth = {
  primaryConceptId: "py.packaging.scripts",
  secondaryConceptIds: ["py.packaging.install"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.packaging.scripts",
      definition: "Defining console script entry points under [project.scripts] in pyproject.toml, mapping command names to python paths.",
      mentalModel: "The switchboard: when the OS receives the command 'study-tracker', it checks the packaging config and wires the request directly to study_tracker/cli.py's main().",
      syntaxShape: "[project.scripts]\ncmd-name = 'package.module:function'",
      tinyExample: "study-tracker = 'study_tracker.cli:main'",
      commonMistake: "Pointing the command script at a file path instead of package module notation, raising SyntaxError at install.",
      repairHint: "Write the target using dot-notation path, followed by colon, and function name: study_tracker.cli:main.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.packaging.install",
      definition: "Using pip's editable flag (-e) to link local package folders directly into the active Python environment.",
      mentalModel: "Live link: instead of copying files into Python directories, pip creates a shortcut. Any edits you make in the package folder update the command immediately.",
      syntaxShape: "pip install -e .",
      tinyExample: "pip install -e .",
      commonMistake: "Reinstalling the package after every change because you did not use the editable (-e) flag.",
      repairHint: "Run `pip install -e .` once from the package root to link it.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-ic-1",
      label: "Map entry point",
      codeFragment: "[project.scripts]\nstudy-tracker = 'study_tracker.cli:main'",
      conceptIds: ["py.packaging.scripts"],
      explanation: "Configures package installation metadata to link the global shell command name study-tracker to our main handler.",
      learnerShouldBeAbleToSay: "We map the command shell directly to our main execution entrypoint."
    },
    {
      id: "w-ic-2",
      label: "Editable install command",
      codeFragment: "python -m pip install -e .",
      conceptIds: ["py.packaging.install"],
      explanation: "Tells pip to install the package in editable mode, linking local files for active debug iteration.",
      learnerShouldBeAbleToSay: "We link files live so changes update the shell immediately."
    }
  ],
  guidedEdits: [
    {
      id: "g-ic-1",
      instruction: "Add 'study-tracker = 'study_tracker.cli:main'' under [project.scripts] inside the packaging configurations.",
      conceptIds: ["py.packaging.scripts"],
      targetCodeFragment: "project_scripts = {}",
      expectedObservation: "The shell script mappings are resolved.",
      wrongTurnHint: "Initialize the project_scripts map with the correct command entry point pair."
    }
  ],
  errorClinic: [
    {
      id: "e-ic-1",
      conceptIds: ["py.packaging.scripts"],
      brokenExample: "study-tracker = 'study_tracker/cli.py'",
      symptom: "ValueError: Invalid entry point specification: 'study_tracker/cli.py'",
      likelyCause: "Exposed console scripts using file paths instead of Python package dot notation.",
      fixStrategy: "Convert target path to package dot notation: study-tracker = 'study_tracker.cli:main'"
    }
  ],
  codeLabBridge: {
    story: "A reviewer should not have to execute scripts with manual python commands. Packaging entry points gives reviewers direct commands.",
    usesConcepts: ["py.packaging.scripts", "py.packaging.install"],
    learnerOwns: ["project_scripts", "main_function", "smoke_command"],
    checkerOwns: ["installable-cli-uses-package-module"],
    runExpectation: "prints study-tracker --help passed"
  },
  understandingProofPrompt: "What is the benefit of using pip install -e . instead of pip install . during package design?",
  exitTicket: [
    "I know how to map console scripts under pyproject.toml blocks.",
    "I understand how editable installations link packages live."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 8 — Load Configuration Without Surprises (run_file)
// ---------------------------------------------------------------------------

const configFilesLesson = proofLesson({
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
  language: "Python configuration",
  tools: ["json", "config files", "defaults"],
  synopsis: "How do you change your program's behavior without editing the source code?",
  prerequisites: [
    "Know the CLI options format, output, and min_minutes.",
    "Know how JSON represents dictionaries."
  ],
  testingFocus: "You will test default config behavior, file override behavior, and preservation of default values not mentioned in the file.",
  objective: "Load config defaults from a file without hiding behavior.",
  whyItMatters: "Configuration makes a tool flexible, but hidden configuration makes it confusing. Professional loaders use explicit defaults and predictable merge rules.",
  coreConcept: "Configuration means settings the user or project can change without editing program logic. A safe config loader starts from DEFAULT_CONFIG, reads a file when present, and lets file values override only known keys.",
  workedExample: "DEFAULT_CONFIG can set format=text, output=summary.txt, and min_minutes=0 while tracker.config.json overrides format=json.",
  guidedExercise: "Build a loader that merges a JSON config file with defaults.",
  missionConnection: "This prepares the professional utility for real users who want stable defaults across runs.",
  reflectionPrompt: "Which options belong in config, and which options should remain explicit command-line arguments?",
  practiceStarter: "import json\n\nDEFAULT_CONFIG = {'format': 'text', 'output': 'summary.txt', 'min_minutes': 0}\nfiles = {'tracker.config.json': '{\"format\": \"json\", \"min_minutes\": 15}'}\n\ndef load_config(path=None, files=None):\n    return {}\n\nconfig = load_config('tracker.config.json', files)\nprint(config)",
  practiceExpected: "{'format': 'json', 'output': 'summary.txt', 'min_minutes': 15}",
  practiceCheck: "If output disappears when the config file omits it, you replaced defaults instead of merging with them. Merging means file values update the default set instead of wiping it out.",
  practiceReps: pythonConfigPracticeReps,
  miniTitle: "Merge config with defaults",
  miniGoal: "Create a config loader that preserves defaults and applies known file overrides.",
  miniSteps: ["Define DEFAULT_CONFIG", "Read JSON config when a path is provided", "Merge file values over defaults without losing omitted defaults"],
  miniDeliverables: [
    "DEFAULT_CONFIG",
    "load_config function",
    "Merged config proof"
  ],
  verifierCommand: "python -m pytest tests/test_config.py",
  expectedEvidence: "Passing config tests showing default behavior, file override behavior, and preserved fallback values.",
  projectConnection: "This gives the Professional Python Utility predictable settings without hardcoding every run.",
  requiredCodeIncludes: ["DEFAULT_CONFIG", "load_config", "json.loads", "tracker.config.json"],
  requiredOutputIncludes: ["format", "summary.txt", "min_minutes", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "import json\n\nDEFAULT_CONFIG = {'format': 'text', 'output': 'summary.txt', 'min_minutes': 0}\nfiles = {'tracker.config.json': '{\"format\": \"json\", \"min_minutes\": 15}'}\n\ndef load_config(path=None, files=None):\n    merged = DEFAULT_CONFIG.copy()\n    if path and files and path in files:\n        try:\n            overrides = json.loads(files[path])\n            for key in overrides:\n                if key in DEFAULT_CONFIG:\n                    merged[key] = overrides[key]\n        except ValueError:\n            pass\n    return merged\n\nconfig = load_config('tracker.config.json', files)\nprint(config)",
  runnerTestCode: "assert config == {'format': 'json', 'output': 'summary.txt', 'min_minutes': 15}\nassert load_config(None, files) == DEFAULT_CONFIG\nprint('format summary.txt min_minutes passed')",
  hiddenTests: [
    {
      id: "config-loader-ignores-unknown-keys",
      name: "Config loader ignores unknown keys",
      code: "unknown_files = {'tracker.config.json': '{\"format\": \"json\", \"extra\": true}'}\nloaded = load_config('tracker.config.json', unknown_files)\nassert loaded == {'format': 'json', 'output': 'summary.txt', 'min_minutes': 0}"
    }
  ],
  curriculum: {
    level: 6,
    sequence: 9,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.config.loader", "py.config.merge"],
    requires: ["py.cli.file_backed"],
    usesButDoesNotTeach: ["py.import", "py.json"],
    visibleCodeConcepts: ["py.config.loader", "py.config.merge"],
    quizConcepts: ["py.config.loader", "py.config.merge"],
    proofOutputs: ["terminal_stdout"]
  }
});

configFilesLesson.depth = {
  primaryConceptId: "py.config.loader",
  secondaryConceptIds: ["py.config.merge"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.config.loader",
      definition: "Reading setting files (like JSON) safely using try/except blocks to provide fallback dictionaries on parsing failures.",
      mentalModel: "Backup generator: the loader checks if there is power in the main line (JSON config). If it is offline or broken, it switches to the backup generator (DEFAULT_CONFIG).",
      syntaxShape: "try: data = json.load(f)\nexcept json.JSONDecodeError: data = {}",
      tinyExample: "json.loads(text)",
      commonMistake: "Letting invalid JSON syntax in settings files crash the entire CLI application.",
      repairHint: "Wrap json.load() calls inside a try-except block and return default dictionaries on error.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.config.merge",
      definition: "Updating default parameters with overrides from configurations, while ignoring unrecognized keys.",
      mentalModel: "Sorting filter: if the user specifies changes to options we know (format, output), we update them. If they try to set options we do not know (secret_token), we ignore them.",
      syntaxShape: "for key in data:\n    if key in defaults:\n        defaults[key] = data[key]",
      tinyExample: "if k in defaults: defaults[k] = v",
      commonMistake: "Blindly using dict.update(file_config), which lets arbitrary or misspelled keys contaminate the settings namespace.",
      repairHint: "Loop over the overrides dictionary and explicitly check if keys match known default keys.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-cf-1",
      label: "Copy defaults",
      codeFragment: "merged = DEFAULT_CONFIG.copy()",
      conceptIds: ["py.config.loader"],
      explanation: "Creates a copy of defaults to ensure we do not mutate global dictionaries.",
      learnerShouldBeAbleToSay: "We base our config dictionary on our known default keys."
    },
    {
      id: "w-cf-2",
      label: "Validate override keys",
      codeFragment: "if key in DEFAULT_CONFIG:\n    merged[key] = overrides[key]",
      conceptIds: ["py.config.merge"],
      explanation: "Performs key checks, restricting updates to settings fields defined in DEFAULT_CONFIG.",
      learnerShouldBeAbleToSay: "We only merge keys we recognize, filtering out extras."
    }
  ],
  guidedEdits: [
    {
      id: "g-cf-1",
      instruction: "Add a check to load_config that catches json.JSONDecodeError and prints 'bad json ignored'.",
      conceptIds: ["py.config.loader"],
      targetCodeFragment: "except ValueError:\n            pass",
      expectedObservation: "Malformed configuration files trigger the warning message and fall back to default values.",
      wrongTurnHint: "Catch json.JSONDecodeError (or ValueError which covers it) and add print statement."
    }
  ],
  errorClinic: [
    {
      id: "e-cf-1",
      conceptIds: ["py.config.merge"],
      brokenExample: "merged = DEFAULT_CONFIG\n# overrides applied inline...",
      symptom: "Subsequent config loads contain changes carried over from previous calls.",
      likelyCause: "Mutating the global DEFAULT_CONFIG dictionary directly because .copy() was omitted.",
      fixStrategy: "Always call .copy() before editing defaults: merged = DEFAULT_CONFIG.copy()"
    }
  ],
  codeLabBridge: {
    story: "Users value settings files that stay predictable. Merging file properties over copy defaults preserves your settings contract.",
    usesConcepts: ["py.config.loader", "py.config.merge"],
    learnerOwns: ["DEFAULT_CONFIG", "load_config"],
    checkerOwns: ["config-loader-ignores-unknown-keys"],
    runExpectation: "prints format summary.txt min_minutes passed"
  },
  understandingProofPrompt: "Why should we restrict settings overrides to only keys that exist in DEFAULT_CONFIG?",
  exitTicket: [
    "I know how to load JSON settings files safely using exception blocks.",
    "I can write merge logic that preserves fallbacks for omitted keys."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 9 — Set CI and Pre-Commit Expectations (run_file)
// ---------------------------------------------------------------------------

const ciPrecommitLesson = proofLesson({
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
  language: "Python project operations",
  tools: ["pre-commit", "CI workflow", "pytest", "CLI smoke test"],
  synopsis: "What if every git commit automatically checked your code for bugs before it saved?",
  prerequisites: [
    "Know the pytest command for the utility.",
    "Know the installed CLI command name."
  ],
  testingFocus: "You will test that the quality plan includes linting, tests, CLI smoke proof, and consistent local/CI expectations.",
  objective: "Define the quality gates for the professional utility.",
  whyItMatters: "A project is easier to trust when checks run before code review and again in CI. The exact tools can vary, but the expectations should be explicit.",
  coreConcept: "A quality gate is a check that must pass before work is trusted. A practical quality gate includes formatting or linting, pytest, and one CLI smoke command that exercises the installed command.",
  workedExample: "pre-commit can run ruff and pytest locally, while CI can run python -m pytest and study-tracker --help.",
  guidedExercise: "Create a quality-gate plan with local hooks, CI commands, and required proof output.",
  missionConnection: "This is the final professional standard before the utility is portfolio-ready.",
  reflectionPrompt: "Which check catches style drift, which check catches logic regression, and which check catches packaging or entrypoint breakage?",
  practiceStarter: "precommit_hooks = []\nci_commands = []\nrequired_evidence = []\n\n# Add local hooks, CI commands, and evidence requirements.\nprint(precommit_hooks)\nprint(ci_commands)\nprint(required_evidence)",
  practiceExpected: "ruff\npython -m pytest\nstudy-tracker --help\nCI checks pass",
  practiceCheck: "If your CI never runs the installed command, packaging can break while tests still pass. Include at least one command that starts the installed CLI.",
  practiceReps: pythonCiPracticeReps,
  miniTitle: "Define professional quality gates",
  miniGoal: "Create a pre-commit and CI verification plan for the Python utility.",
  miniSteps: ["List local pre-commit hooks", "List CI commands", "Require pytest and CLI smoke evidence"],
  miniDeliverables: [
    "Pre-commit hook plan",
    "CI command plan",
    "Required evidence checklist"
  ],
  verifierCommand: "pre-commit run --all-files && python -m pytest && study-tracker --help",
  expectedEvidence: "Output showing lint or format checks, pytest, and an installed CLI smoke command pass.",
  projectConnection: "This makes the Professional Python Utility reviewable with repeatable quality gates.",
  requiredCodeIncludes: ["pre-commit", "ruff", "python -m pytest", "study-tracker --help"],
  requiredOutputIncludes: ["ruff", "pytest", "study-tracker", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "precommit_hooks = ['ruff', 'python -m pytest']\nci_commands = ['python -m pytest', 'study-tracker --help']\nrequired_evidence = ['ruff validation passed', 'pytest passed', 'CLI smoke output', 'CI passed']\nprint(precommit_hooks)\nprint(ci_commands)\nprint(required_evidence)",
  runnerTestCode: "assert 'ruff' in precommit_hooks\nassert 'python -m pytest' in precommit_hooks\nassert 'python -m pytest' in ci_commands\nassert 'study-tracker --help' in ci_commands\nassert 'CI passed' in required_evidence\nprint('ruff pytest study-tracker passed')",
  hiddenTests: [
    {
      id: "ci-precommit-includes-cli-output-evidence",
      name: "Quality plan requires CLI output evidence",
      code: "assert any('CLI smoke output' in evidence for evidence in required_evidence)"
    }
  ],
  curriculum: {
    level: 6,
    sequence: 10,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.ci.precommit", "py.ci.workflow"],
    requires: ["py.metadata.pyproject"],
    visibleCodeConcepts: ["py.ci.precommit", "py.ci.workflow"],
    quizConcepts: ["py.ci.precommit", "py.ci.workflow"],
    proofOutputs: ["terminal_stdout"]
  }
});

ciPrecommitLesson.depth = {
  primaryConceptId: "py.ci.precommit",
  secondaryConceptIds: ["py.ci.workflow"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.ci.precommit",
      definition: "Using local pre-commit hooks to automate formatting (ruff) and tests (pytest) before code is added to Git history.",
      mentalModel: "Local filter: it prevents typos and broken assertions from getting into your repository, keeping commits clean and reviewable.",
      syntaxShape: "repos:\n  - repo: local\n    hooks:\n      - id: ruff",
      tinyExample: "pre-commit run --all-files",
      commonMistake: "Bypassing pre-commit hooks (--no-verify), which pollutes the remote repository with formatting warnings.",
      repairHint: "Always fix local warnings before committing; use pre-commit to run formatting checks automatically.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.ci.workflow",
      definition: "Configuring cloud pipelines (like GitHub Actions) to compile, package, and test your codebase on every push.",
      mentalModel: "The clean-room inspector: it fetches your project on a clean computer, installs dependencies, and runs tests to prove it works outside your laptop.",
      syntaxShape: "jobs:\n  test:\n    runs-on: ubuntu-latest\n    steps: ...",
      tinyExample: "run: python -m pytest",
      commonMistake: "Running different commands in CI than those used locally, causing unexpected environment errors.",
      repairHint: "Make sure your CI workflow executes the exact same pytest commands documented in your README.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-pc-1",
      label: "Pre-commit Hook Definition",
      codeFragment: "hooks:\n  - id: ruff\n    entry: ruff check\n    language: python",
      conceptIds: ["py.ci.precommit"],
      explanation: "Declares a local check to execute ruff on modified source files before commit approvals.",
      learnerShouldBeAbleToSay: "We register local linter scripts to run automatically."
    },
    {
      id: "w-pc-2",
      label: "CI Smoke verification step",
      codeFragment: "- name: CLI Smoke Test\n  run: study-tracker --help",
      conceptIds: ["py.ci.workflow"],
      explanation: "Installs the package in the clean CI container and runs the entry point command.",
      learnerShouldBeAbleToSay: "CI checks package installation is functional on push."
    }
  ],
  guidedEdits: [
    {
      id: "g-pc-1",
      instruction: "Add 'CI passed' to the required_evidence requirements.",
      conceptIds: ["py.ci.workflow"],
      targetCodeFragment: "required_evidence = []",
      expectedObservation: "The quality plan requires clean CI status indicators.",
      wrongTurnHint: "Append 'CI passed' to the required_evidence array."
    }
  ],
  errorClinic: [
    {
      id: "e-pc-1",
      conceptIds: ["py.ci.workflow"],
      brokenExample: "# CI workflow script\n- name: Test\n  run: pytest # forgot python -m!",
      symptom: "CI pipeline fails with 'Command pytest not found' even though it works locally.",
      likelyCause: "Relying on global path paths in CI instead of executing modules explicitly.",
      fixStrategy: "Use python executable route: run: python -m pytest"
    }
  ],
  codeLabBridge: {
    story: "Quality checks are most useful when they are automated. Pre-commit hooks check code locally, and CI proves it globally.",
    usesConcepts: ["py.ci.precommit", "py.ci.workflow"],
    learnerOwns: ["precommit_hooks", "ci_commands", "required_evidence"],
    checkerOwns: ["ci-precommit-includes-cli-output-evidence"],
    runExpectation: "prints ruff pytest study-tracker passed"
  },
  understandingProofPrompt: "Why should we run a package smoke command in our CI workflow in addition to running pytest?",
  exitTicket: [
    "I know how to write pre-commit configs to check code formatting.",
    "I understand why CI workflows require python module syntax commands."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 10 — Professional Utility Review Gate (concept_only)
// ---------------------------------------------------------------------------

const professionalReviewLesson = proofLesson({
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
  language: "Professional Python review",
  tools: ["pyproject.toml", "installed CLI", "config tests", "pytest"],
  synopsis: "Your tool is packaged, tested, and documented. Does it actually meet professional standards?",
  prerequisites: [
    "Have completed the Professional Python Utility lessons.",
    "Have proof commands for pytest and the installed CLI."
  ],
  testingFocus: "You will test that every professional quality area has specific evidence and one improvement.",
  objective: "Review the professional utility as a maintainable package.",
  whyItMatters: "A maintainer needs more than feature proof. They need to know how the package is structured, installed, configured, tested, and debugged.",
  coreConcept: "A professional review matrix maps each quality area to evidence: structure, metadata, command, config, errors/logs, and tests.",
  workedExample: "pyproject proves metadata, study-tracker --help proves entrypoint, pytest proves behavior, and config tests prove defaults.",
  guidedExercise: "Build a review matrix that proves the utility is maintainable, not just functional.",
  missionConnection: "This review gate confirms readiness for Python Integration Depth.",
  reflectionPrompt: "Which proof would fail first if the package could not be installed on a clean machine?",
  practiceStarter: "review_matrix = []\ncommands = []\nimprovement = ''\n\n# Add evidence rows for structure, metadata, command, config, logging, and tests.\nprint(review_matrix)\nprint(commands)\nprint(improvement)",
  practiceExpected: "structure, metadata, command, config, logging, tests, improvement",
  practiceCheck: "If a row has no evidence, it is a hope, not a review. Name the command or artifact that proves the row.",
  practiceReps: pythonProfessionalReviewPracticeReps,
  miniTitle: "Complete the Professional Utility Review",
  miniGoal: "Create a maintainer-style review matrix for the professional package.",
  miniSteps: ["Map each quality area to evidence", "List exact verification commands", "Choose one professional improvement"],
  miniDeliverables: [
    "Review matrix",
    "Command evidence",
    "Improvement note"
  ],
  verifierCommand: "python -m pytest && study-tracker --help && pre-commit run --all-files",
  expectedEvidence: "A matrix showing structure, metadata, installed CLI, config, logging, and test proof, plus one improvement decision.",
  projectConnection: "This review gate confirms readiness for Python Integration Depth.",
  requiredCodeIncludes: ["structure", "metadata", "command", "config", "logging", "tests"],
  requiredOutputIncludes: ["metadata", "command", "config", "tests", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "review_matrix = [\n    {'area': 'structure', 'evidence': 'study_tracker package'},\n    {'area': 'metadata', 'evidence': 'pyproject.toml exists'},\n    {'area': 'command', 'evidence': 'study-tracker command runs'},\n    {'area': 'config', 'evidence': 'tracker.config.json merges'},\n    {'area': 'logging', 'evidence': 'TrackerInputError raised'},\n    {'area': 'tests', 'evidence': 'pytest passes'},\n]\ncommands = ['python -m pytest', 'study-tracker --help']\nimprovement = 'Implement strict typing using mypy check configurations.'\nprint(review_matrix)\nprint(commands)\nprint(improvement)",
  runnerTestCode: "areas = {row['area'] for row in review_matrix}\nassert {'structure', 'metadata', 'command', 'config', 'logging', 'tests'}.issubset(areas)\nassert all(row.get('evidence') for row in review_matrix)\nassert any('python -m pytest' in command for command in commands)\nassert any('study-tracker --help' in command for command in commands)\nassert len(improvement) >= 20\nprint('metadata command config tests passed')",
  hiddenTests: [
    {
      id: "professional-review-names-installability",
      name: "Professional review includes installability evidence",
      code: "assert any(row['area'] == 'command' and 'study-tracker' in row.get('evidence', '') for row in review_matrix)"
    }
  ],
  curriculum: {
    level: 6,
    sequence: 11,
    version: "1.0.0",
    lessonKind: "concept_only",
    teaches: ["py.gate.professional", "py.gate.matrix"],
    requires: ["py.ci.precommit"],
    usesButDoesNotTeach: ["py.logging", "py.json"],
    visibleCodeConcepts: ["py.gate.professional", "py.gate.matrix"],
    quizConcepts: ["py.gate.professional", "py.gate.matrix"],
    proofOutputs: ["terminal_stdout"]
  }
});

professionalReviewLesson.depth = {
  primaryConceptId: "py.gate.professional",
  secondaryConceptIds: ["py.gate.matrix"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.gate.professional",
      definition: "Conducting a comprehensive audit of package installation, configuration merging, error logging, and quality gates.",
      mentalModel: "The vehicle inspection: checking that the headlights (logging), brakes (tests), and steering (CLI config) all pass standards before public release.",
      syntaxShape: "A review list mapping packaging fields to verification command results",
      tinyExample: "'evidence': 'study-tracker --help output'",
      commonMistake: "Providing vague summaries ('code is done') without proof of environment setup or configuration behavior.",
      repairHint: "Write down the exact console script output that proves package installability.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.gate.matrix",
      definition: "Developing a structured matrix that links quality areas (structure, config, etc.) to tangible proof artifacts.",
      mentalModel: "The spreadsheet checklist: listing the quality area in column A, the proof command in column B, and the output result in column C.",
      syntaxShape: "A list of dictionaries with 'area' and 'evidence' keys",
      tinyExample: "{'area': 'config', 'evidence': 'defaults merge'}",
      commonMistake: "Failing to check that the console script command runs successfully on a clean environment.",
      repairHint: "Use the review matrix to map every quality area to copy-pasteable proof commands.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-pr-1",
      label: "Audit Matrix Row",
      codeFragment: "{'area': 'command', 'evidence': 'study-tracker command runs successfully'}",
      conceptIds: ["py.gate.matrix"],
      explanation: "Verifies the installable command exists and executes without path errors.",
      learnerShouldBeAbleToSay: "We record installable command confirmation."
    },
    {
      id: "w-pr-2",
      label: "Improvement Plan",
      codeFragment: "improvement = 'Implement strict typing using mypy check configurations.'",
      conceptIds: ["py.gate.professional"],
      explanation: "Proposes a concrete package enhancement with a clear tool target.",
      learnerShouldBeAbleToSay: "We select a clear next quality upgrade goal."
    }
  ],
  guidedEdits: [
    {
      id: "g-pr-1",
      instruction: "Add 'python -m pytest' to the verification commands list in review matrix.",
      conceptIds: ["py.gate.professional"],
      targetCodeFragment: "commands = []",
      expectedObservation: "The test run command is listed under verification checks.",
      wrongTurnHint: "Append 'python -m pytest' to the commands list."
    }
  ],
  errorClinic: [
    {
      id: "e-pr-1",
      conceptIds: ["py.gate.professional"],
      brokenExample: "review_matrix = [\n    {'area': 'config', 'evidence': 'it works'}\n]",
      symptom: "Audit is rejected because quality area evidence is vague.",
      likelyCause: "Asserting completion without naming the command or artifact that holds the proof.",
      fixStrategy: "Specify the exact check output: 'evidence': 'DEFAULT_CONFIG merges with config.json'"
    }
  ],
  codeLabBridge: {
    story: "A reviewer needs inspectable evidence to trust package maintainability. Auditing each area keeps code reliable.",
    usesConcepts: ["py.gate.professional", "py.gate.matrix"],
    learnerOwns: [],
    checkerOwns: [],
    runExpectation: "prints metadata command config tests passed"
  },
  understandingProofPrompt: "Why does the review matrix separate structural proof from functional test results?",
  exitTicket: [
    "I know how to construct package review matrices for code reviews.",
    "I can diagnose packaging issues using clean environment installation checks."
  ]
};


// ---------------------------------------------------------------------------
// Micro-lesson 8 — Manage Virtual Environments (run_file)
// ---------------------------------------------------------------------------

const pythonVirtualEnvPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "import sys\nprint(f\"python: {sys.version}\")\nvenv_cmd = 'python -m venv .venv'\nactivation_cmd = '.venv\\\\Scripts\\\\activate'\nprint(venv_cmd)\nprint(activation_cmd)",
    expectedOutput: "python -m venv .venv\n.venv\\Scripts\\activate",
    checkYourAnswer: "Same venv with a new name. The mechanism is the same regardless of whether the environment is called .venv or env.",
    tier: "replicate"
  },
  {
    starterCode: "requirements = ['pandas>=2.0', 'requests==2.31.0']\nprint('Running outside venv - global packages may conflict')\nprint(f'requirements: {requirements}')\npip_freeze_global = 47\npip_freeze_expected = 3\nprint(f'pip freeze shows {pip_freeze_global} packages instead of {pip_freeze_expected}')",
    expectedOutput: "Running outside venv - global packages may conflict\npip freeze shows 47 packages instead of 3",
    checkYourAnswer: "The diagnosis rep: pip freeze in a global environment lists unrelated packages. The learner should identify that venv isolation is missing.",
    tier: "diagnose"
  },
  {
    starterCode: "pip_freeze_output = ['pandas==2.2.0', 'requests==2.31.0', 'pytest==8.0.0']\nrequirements_txt = '\\n'.join(pip_freeze_output)\nprint(requirements_txt)",
    expectedOutput: "pandas==2.2.0\nrequests==2.31.0\npytest==8.0.0",
    checkYourAnswer: "Project-shaped rep: pip freeze generates a deployable dependency list. A reviewer can recreate the environment from it.",
    tier: "synthesize"
  }
];

const virtualEnvLesson = proofLesson({
  id: "lesson-python-virtual-env",
  moduleId: "module-python-professional",
  slug: "python-virtual-env",
  title: "Manage Virtual Environments",
  summary: "Learn how to create and manage Python virtual environments with venv, pip freeze, and requirements.txt.",
  bodyMarkdown: "Virtual environments isolate project dependencies so different projects can use different library versions without conflicts. Creating a venv is simple: `python -m venv .venv` creates the environment folder. Activate it with `.venv\\\\Scripts\\\\activate` on Windows or `source .venv/bin/activate` on macOS/Linux. Once active, `pip freeze > requirements.txt` records the exact packages so reviewers can recreate the environment. Professional projects use venvs to keep dependencies clean, and commit requirements.txt (or pyproject.toml dependency lists) instead of the .venv folder itself.",
  estimatedMinutes: 12,
  difficulty: "applied",
  skillIds: ["skill-python-professional"],
  quizId: "quiz-python-virtual-env",
  desktopTask: "Create a virtual environment for the study tracker, activate it, install project dependencies, and generate requirements.txt.",
  evidencePrompt: "Record the venv creation command, the activation command, pip freeze output showing only project dependencies, and one reason venvs prevent version conflicts.",
  language: "Python virtual environments",
  tools: ["venv", "pip freeze", "requirements.txt"],
  synopsis: "What happens when Project A needs Python 3.9 and Project B needs Python 3.12?",
  prerequisites: [
    "Have Python 3 installed on your system.",
    "Know what pip install does."
  ],
  testingFocus: "You will test that the venv creation command, activation command, and requirements.txt generation are documented correctly.",
  objective: "Create and use a Python virtual environment for the study tracker project.",
  whyItMatters: "Professional projects cannot assume every reviewer has the same global packages. A venv makes the dependency environment reproducible and prevents version conflicts.",
  coreConcept: "A virtual environment is an isolated Python installation inside your project folder. python -m venv creates it, activate scripts switch the shell into it, and pip freeze saves the dependency list.",
  workedExample: "python -m venv .venv && source .venv/bin/activate && pip freeze > requirements.txt creates a requirements file from an isolated environment.",
  guidedExercise: "Create a virtual environment, activate it, and record the pip freeze command.",
  missionConnection: "This makes the Professional Python Utility cleanly installable with known dependencies, a key expectation for portfolio review.",
  reflectionPrompt: "Which dependencies should be in requirements.txt and which belong in pyproject.toml's optional dependencies?",
  practiceStarter: "venv_cmd = 'python -m venv .venv'\nactivation_cmd = ''\npip_freeze_cmd = 'pip freeze > requirements.txt'\n\n# Add the correct activation command for your OS.\nprint(venv_cmd)\nprint(activation_cmd)\nprint(pip_freeze_cmd)",
  practiceExpected: "python -m venv .venv\n.venv\\Scripts\\activate (Windows) or source .venv/bin/activate (macOS/Linux)\npip freeze > requirements.txt",
  practiceCheck: "If you only create the venv without activating it, pip freeze captures the global environment instead of the isolated one. Always activate before installing or freezing.",
  practiceReps: pythonVirtualEnvPracticeReps,
  miniTitle: "Set up the virtual environment",
  miniGoal: "Create a venv, activate it, and generate requirements.txt for the study tracker.",
  miniSteps: ["Create a .venv folder", "Activate the virtual environment", "Run pip freeze to record dependencies"],
  miniDeliverables: [
    "Venv creation command",
    "Activation command",
    "requirements.txt content"
  ],
  verifierCommand: "python -m venv .venv && source .venv/bin/activate && pip freeze",
  expectedEvidence: "pip freeze output showing only the project's required packages (pytest, etc.) without system-wide packages.",
  projectConnection: "This makes the Professional Python Utility portable: any reviewer can recreate the same dependency environment.",
  requiredCodeIncludes: ["venv", "activate", "pip freeze", "requirements.txt"],
  requiredOutputIncludes: ["venv", "activate", "pip freeze", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "venv_cmd = 'python -m venv .venv'\nactivation_cmd = '.venv\\\\Scripts\\\\activate'\npip_freeze_cmd = 'pip freeze > requirements.txt'\nprint(venv_cmd)\nprint(activation_cmd)\nprint(pip_freeze_cmd)",
  runnerTestCode: "assert venv_cmd == 'python -m venv .venv'\nassert '.venv' in activation_cmd\nassert 'activate' in activation_cmd\nassert pip_freeze_cmd == 'pip freeze > requirements.txt'\nprint('venv activate pip freeze passed')",
  hiddenTests: [
    {
      id: "virtual-env-activation-path",
      name: "Activation path targets venv folder",
      code: "assert activation_cmd.startswith('.venv')"
    }
  ],
  curriculum: {
    level: 6,
    sequence: 8,
    version: "1.0.0",
    lessonKind: "concept_only",
    teaches: ["py.env.virtual"],
    requires: ["py.metadata.dependencies"],
    usesButDoesNotTeach: ["py.import", "py.pyproject.toml"],
    visibleCodeConcepts: ["py.env.virtual"],
    quizConcepts: ["py.env.virtual"],
    proofOutputs: ["reflection"]
  }
});

virtualEnvLesson.depth = {
  primaryConceptId: "py.env.virtual",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.env.virtual",
      definition: "Creating isolated Python environments using python -m venv to separate project dependencies from system-wide packages.",
      mentalModel: "Think of a venv like a clean room: each of your projects gets its own sealed container with only the tools it needs. No project can accidentally break another by upgrading a shared library.",
      syntaxShape: "python -m venv .venv\n.venv\\Scripts\\activate\npip freeze > requirements.txt",
      tinyExample: "python -m venv .venv && source .venv/bin/activate",
      commonMistake: "Running pip install without activating the venv first, installing packages globally instead of into the project's isolated environment.",
      repairHint: "Always check that your terminal prompt shows (.venv) before running pip install commands.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-ve-1",
      label: "Create venv",
      codeFragment: "python -m venv .venv",
      conceptIds: ["py.env.virtual"],
      explanation: "Creates a .venv folder inside the project with its own Python binary and pip installation.",
      learnerShouldBeAbleToSay: "We create a local isolated Python environment for our project."
    },
    {
      id: "w-ve-2",
      label: "Activate and freeze",
      codeFragment: ".venv\\Scripts\\activate\npip freeze > requirements.txt",
      conceptIds: ["py.env.virtual"],
      explanation: "Activate switches the shell into the venv so pip installs go into .venv, not globally. Then pip freeze records the current packages.",
      learnerShouldBeAbleToSay: "We enter the isolated environment and save its package list."
    }
  ],
  guidedEdits: [
    {
      id: "g-ve-1",
      instruction: "Replace the placeholder activation_cmd with the correct command for your operating system.",
      conceptIds: ["py.env.virtual"],
      targetCodeFragment: "activation_cmd = ''",
      expectedObservation: "The activation command targets .venv\\Scripts\\activate on Windows or .venv/bin/activate on macOS/Linux.",
      wrongTurnHint: "On Windows use .venv\\Scripts\\activate, on macOS/Linux use source .venv/bin/activate."
    }
  ],
  errorClinic: [
    {
      id: "e-ve-1",
      conceptIds: ["py.env.virtual"],
      brokenExample: "# Running pip install before activation\npip install pytest",
      symptom: "pytest is installed globally and visible to all projects instead of only the current one.",
      likelyCause: "Installing packages in the global environment without creating or activating a venv first.",
      fixStrategy: "Always create and activate a venv before running pip install for project dependencies."
    }
  ],
  codeLabBridge: {
    story: "Global Python environments quickly become messy when different projects need different library versions. Virtual environments keep each project's dependencies clean and separate.",
    usesConcepts: ["py.env.virtual"],
    learnerOwns: ["venv_cmd", "activation_cmd", "pip_freeze_cmd"],
    checkerOwns: ["virtual-env-activation-path"],
    runExpectation: "prints venv activate pip freeze passed"
  },
  understandingProofPrompt: "Why should you never commit the .venv folder to version control, even though it contains all your project dependencies?",
  exitTicket: [
    "I can create a Python virtual environment using python -m venv.",
    "I know how to activate a venv and use pip freeze to record dependencies."
  ]
};

// ---------------------------------------------------------------------------
// Level 6 Quizzes
// ---------------------------------------------------------------------------

export const level6Quizzes: Quiz[] = [
  codeReadingQuiz(
    "quiz-python-project-structure",
    "lesson-python-project-structure",
    "Project structure checkpoint",
    'from study_tracker.cli import build_parser\nfrom study_tracker.parser import parse_row\nfrom study_tracker.reports import format_report',
    "project structure",
    "The functions live in separate modules with clear responsibilities",
    "All project logic is in one large file",
    "The project has no structure",
    "Each import comes from a different module, showing the project is split into cli, parser, and reports.",
    ["py.structure.package"]
  ),
  codeReadingQuiz(
    "quiz-python-dataclass-models",
    "lesson-python-dataclass-models",
    "Dataclass model checkpoint",
    '@dataclass(frozen=True)\nclass StudySession:\n    date: str\n    topic: str\n    minutes: int\n\ns = StudySession("2026-05-07", "python", 30)\nprint(s.minutes)',
    "dataclass model",
    "30",
    "\"30\"",
    "TypeError",
    "The frozen dataclass stores minutes as an integer, so printing s.minutes outputs the number 30 without quotes.",
    ["py.dataclass.model"]
  ),
  codeReadingQuiz(
    "quiz-python-json-reports",
    "lesson-python-json-reports",
    "JSON report checkpoint",
    'summary = {"session_count": 2, "total_minutes": 45}\nprint(json.dumps(summary))',
    "json reports",
    "{\"session_count\": 2, \"total_minutes\": 45}",
    "2 45",
    "[2, 45]",
    "json.dumps serializes the dictionary to a JSON string with the same key-value pairs.",
    ["py.json.dumps"]
  ),
  codeReadingQuiz(
    "quiz-python-logging-errors",
    "lesson-python-logging-errors",
    "Logging and errors checkpoint",
    'def parse_minutes(value):\n    try:\n        return int(value)\n    except ValueError:\n        logger.warning(f"invalid minutes: {value}")\n        raise TrackerInputError("minutes must be a number")',
    "logging errors",
    "Logs the bad value and raises TrackerInputError",
    "Returns 0 silently",
    "Prints the error and continues",
    "The function logs the invalid input for debugging and raises a project-specific error so the caller can handle it.",
    ["py.logging.warning"]
  ),
  codeReadingQuiz(
    "quiz-python-pytest-ci",
    "lesson-python-pytest-ci",
    "Pytest and CI proof checkpoint",
    '@pytest.fixture\ndef clean_rows():\n    return ["2026-05-07,python,30"]',
    "pytest fixtures",
    "It defines a reusable test dataset called clean_rows",
    "It runs the test immediately",
    "It deletes the test data",
    "The @pytest.fixture decorator creates a reusable input dataset that pytest injects into test functions.",
    ["py.pytest.fixtures"]
  ),
  codeReadingQuiz(
    "quiz-python-pyproject-metadata",
    "lesson-python-pyproject-metadata",
    "pyproject metadata checkpoint",
    '[project]\nname = "study-tracker"\nversion = "0.1.0"\nrequires-python = ">=3.11"',
    "pyproject metadata",
    "The project's name, version, and minimum Python version",
    "The project's dependencies",
    "The project's test configuration",
    "The [project] block declares the package identity: name, version, and supported Python versions.",
    ["py.metadata.pyproject"]
  ),
  codeReadingQuiz(
    "quiz-python-installable-cli",
    "lesson-python-installable-cli",
    "Installable CLI checkpoint",
    '[project.scripts]\nstudy-tracker = "study_tracker.cli:main"',
    "packaging scripts",
    "Defines a console script entry point so 'study-tracker' runs the main function",
    "Installs pytest automatically",
    "Creates a new Python file",
    "The [project.scripts] section maps the command name 'study-tracker' to the main function in the package.",
    ["py.packaging.scripts"]
  ),
  codeReadingQuiz(
    "quiz-python-config-files",
    "lesson-python-config-files",
    "Config files checkpoint",
    'DEFAULT_CONFIG = {"format": "text", "min_minutes": 0}\nfor key in overrides:\n    if key in DEFAULT_CONFIG:\n        merged[key] = overrides[key]',
    "config merge",
    "It only applies overrides for keys that exist in DEFAULT_CONFIG, ignoring unknown ones",
    "It adds unknown keys to the config",
    "It crashes on unknown keys",
    "The loop filters overrides so only keys that match DEFAULT_CONFIG are applied, ignoring unknown keys.",
    ["py.config.merge"]
  ),
  codeReadingQuiz(
    "quiz-python-ci-precommit",
    "lesson-python-ci-precommit",
    "CI and pre-commit checkpoint",
    'on:\n  push:\n  pull_request:\n\njobs:\n  lint:\n    runs-on: ubuntu-latest\n    steps:\n      - run: ruff check .',
    "ci precommit",
    "A CI workflow that triggers on push and PR, running ruff linting",
    "A deployment pipeline",
    "A local pre-commit configuration",
    "The on block triggers on push and pull_request events, and the lint job runs ruff.",
    ["py.ci.workflow"]
  ),
  codeReadingQuiz(
    "quiz-python-professional-review",
    "lesson-python-professional-review",
    "Professional review checkpoint",
    '{"area": "command", "evidence": "study-tracker --help returns usage"}',
    "professional review",
    "That the installed CLI entry point works and responds",
    "That the project has pytest tests",
    "That the README is complete",
    "The matrix connects the quality area (command) with concrete evidence (the tool responds to --help).",
    ["py.gate.matrix"]
  ),
  codeReadingQuiz(
    "quiz-python-virtual-env",
    "lesson-python-virtual-env",
    "Virtual Environments Checkpoint",
    "python -m venv .venv\nsource .venv/bin/activate\npip freeze > requirements.txt",
    "virtual environment commands",
    "python -m venv creates an isolated environment, source .venv/bin/activate switches into it, and pip freeze records installed packages",
    "python -m venv installs all packages globally and freeze removes them",
    "python -m venv deletes the project folder and activate restores it",
    "Each command serves a different role: venv creates the isolated space, activate enters it, and pip freeze snapshots the dependency state.",
    ["py.env.virtual"]
  )
];

export const level6Lessons: Lesson[] = [
  projectStructureLesson,
  dataclassModelsLesson,
  jsonReportsLesson,
  loggingErrorsLesson,
  pytestCiLesson,
  pyprojectMetadataLesson,
  installableCliLesson,
  virtualEnvLesson,
  configFilesLesson,
  ciPrecommitLesson,
  professionalReviewLesson
];
