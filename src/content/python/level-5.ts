import type { Lesson, Quiz, LessonPracticeBlock } from "@/domain/types";
import { proofLesson, codeReadingQuiz } from "./shared";

// ---------------------------------------------------------------------------
// Practice Reps for Level 5
// ---------------------------------------------------------------------------

const pythonParserTestPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "from pathlib import Path\ndef test_parse_second_valid_row():\n    assert parse_row('2026-05-08,git,15')['topic'] == 'git'\n    assert parse_row('2026-05-08,git,15')['minutes'] == 15\np = Path('sample.csv')\nprint(p.exists())",
    expectedOutput: "A second clean row passes with topic git and minutes 15.\nFalse (or True if file present)",
    checkYourAnswer: "This repeats the happy path with new data. If the test only passes for python and 30, the parser is memorizing the example instead of parsing rows. pathlib keeps paths clean.",
    tier: "replicate"
  },
  {
    starterCode: "def test_rejects_missing_topic():\n    result = parse_row('2026-05-08,,15')\n    assert result['error'] == 'topic is required'",
    expectedOutput: "The missing-topic row is rejected with topic is required.",
    checkYourAnswer: "This is a different failure from bad minutes. A useful parser explains which field failed so the user can fix the row.",
    tier: "diagnose"
  },
  {
    starterCode: "def test_parse_file_rows_mixed():\n    accepted, rejected = parse_rows(['2026-05-08,git,15', 'bad-row'])\n    assert len(accepted) == 1\n    assert rejected[0]['error'] == 'expected 3 columns'",
    expectedOutput: "One accepted row and one rejected row are both accounted for.",
    checkYourAnswer: "This is the project-shaped rep: the parser must handle a mixed file, not just one isolated string.",
    tier: "synthesize"
  }
];

const pythonCliArgumentPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "parsed = parse_cli(['--topic', 'git', '--minutes', '15'])\nsummary = f\"{parsed['topic']}: {parsed['minutes']} minutes\"\nprint(summary)",
    expectedOutput: "git: 15 minutes from parsed CLI arguments.",
    checkYourAnswer: "Same idea, new data. If git still prints python, the summary is hardcoded instead of built from parsed arguments.",
    tier: "replicate"
  },
  {
    starterCode: "try:\n    parse_cli(['--topic', 'git', '--minutes', 'soon'])\nexcept SystemExit:\n    print('bad minutes rejected')",
    expectedOutput: "bad minutes rejected",
    checkYourAnswer: "The failure rep proves type=int is doing real boundary work. Invalid terminal text should not become tracker data.",
    tier: "diagnose"
  },
  {
    starterCode: "command = 'study_tracker --topic sql --minutes 20'\nparsed = parse_cli(['--topic', 'sql', '--minutes', '20'])\nprint(command)\nprint(parsed)",
    expectedOutput: "study_tracker --topic sql --minutes 20\n{'topic': 'sql', 'minutes': 20}",
    checkYourAnswer: "This connects the parser to the real command shape a reviewer would run in the CLI project.",
    tier: "synthesize"
  }
];

const pythonRejectedRowPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "ROWS = ['2026-05-10,python,25', '2026-05-11,git,15']\naccepted, rejected = parse_rows(ROWS)\nprint(len(accepted), len(rejected))",
    expectedOutput: "2 accepted rows and 0 rejected rows.",
    checkYourAnswer: "A good rejected-row reporter also handles the no-error case. Clean files should not invent warnings.",
    tier: "replicate"
  },
  {
    starterCode: "ROWS = ['2026-05-10,,25']\naccepted, rejected = parse_rows(ROWS)\nprint(rejected[0]['reason'])",
    expectedOutput: "missing topic is recorded as the rejected-row reason.",
    checkYourAnswer: "This failure is different from bad minutes and bad columns. Name the exact field that made the row unusable.",
    tier: "diagnose"
  },
  {
    starterCode: "ROWS = ['2026-05-10,python,25', 'bad-row', '2026-05-11,git,15']\naccepted, rejected = parse_rows(ROWS)\nreport = build_rejected_report(rejected)\nprint(len(accepted))\nprint(report)",
    expectedOutput: "2 accepted rows plus a row-numbered rejected report for bad-row.",
    checkYourAnswer: "This is the project-shaped run: clean data continues while rejected data remains visible and fixable.",
    tier: "synthesize"
  }
];

const pythonCoreReviewPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "review = {'architecture': 'CLI calls parser, parser returns records, report prints totals', 'commands': ['python study_tracker.py --help'], 'failure_inspection': 'bad minutes row is rejected with a reason', 'improvement': 'add parser tests for missing topic'}\nprint(review)",
    expectedOutput: "Architecture, command, failure inspection, and one improvement are all present.",
    checkYourAnswer: "This rep keeps the review specific. If the architecture could describe any script, name the CLI, parser, report, and rejected-row behavior.",
    tier: "replicate"
  },
  {
    starterCode: "failure = {'input': '2026-05-08,python,soon', 'expected': 'rejected row reason', 'actual': '', 'next_check': ''}\nprint(failure)",
    expectedOutput: "A rejected-row failure includes input, expected behavior, actual behavior, and next check.",
    checkYourAnswer: "A useful failure inspection keeps the bad input visible. Without the raw failed row, a reviewer cannot tell what behavior was actually inspected.",
    tier: "diagnose"
  },
  {
    starterCode: "improvement_decision = {'target': 'parser', 'reason': 'malformed rows are hardest to debug', 'first_step': 'add test_missing_minutes'}\nprint(improvement_decision)",
    expectedOutput: "The improvement names a concrete target, reason, and first step.",
    checkYourAnswer: "The improvement should be small enough to do next. Avoid vague plans like make it better; name the file, behavior, and check.",
    tier: "synthesize"
  }
];


// ---------------------------------------------------------------------------
// Micro-lesson 1 — Import Code Others Wrote (run_file)
// ---------------------------------------------------------------------------

const pythonImportPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "import csv\nfrom io import StringIO\n\ntext = \"date,topic,minutes\\n2026-05-07,python,30\"\nf = StringIO(text)\nreader = csv.DictReader(f)\nfor row in reader:\n    print(row['topic'], row['minutes'])",
    expectedOutput: "python 30 from the CSV reader.",
    checkYourAnswer: "The csv.DictReader uses the header row to build dictionaries. If the output includes header names or shows raw text, the reader construction is wrong.",
    tier: "replicate"
  },
  {
    starterCode: "import json\n\ndata = '{\"topic\": \"python\", \"minutes\": 30}'\nparsed = json.loads(data)\nprint(parsed[\"minutes\"] + 10)",
    expectedOutput: "40 — the parsed minutes (30) plus 10 gives 40.",
    checkYourAnswer: "json.loads() converts valid JSON text into a Python dictionary. If you get a TypeError, minutes might still be a string. json.loads preserves JSON types: numbers become integers or floats.",
    tier: "diagnose"
  },
  {
    starterCode: "# Write a function that accepts a Python dictionary,\n# converts it to JSON using json.dumps,\n# and returns the JSON string.\n# Then test it with this data:\n\ndef to_json(data):\n    pass  # Your code here\n\nsession = {\"topic\": \"git\", \"minutes\": 15}\nresult = to_json(session)\nprint(result)",
    expectedOutput: '{"topic": "git", "minutes": 15}',
    checkYourAnswer: "Your to_json function should call json.dumps(data) and return the result. The JSON output must have double quotes around keys and string values.",
    tier: "synthesize"
  }
];

const pythonImportLesson = proofLesson({
  id: "lesson-python-import",
  moduleId: "module-python-core",
  slug: "python-import",
  title: "Import Code Others Wrote",
  summary: "Use Python's import statement to bring in standard library modules.",
  bodyMarkdown: "A Python file can only do so much on its own. The `import` statement unlocks the entire standard library: modules for parsing CSV files, reading and writing JSON, accepting command-line arguments, and more. Think of `import` as a library card that lets you borrow pre-written code instead of writing everything from scratch.",
  estimatedMinutes: 8,
  difficulty: "foundation",
  skillIds: ["skill-python-basics"],
  quizId: "quiz-python-import",
  desktopTask: "Write a small Python script that imports a module (json or csv), uses it to process data, and prints results.",
  evidencePrompt: "Capture the import statement, the data being processed, and the output printed by the script.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "How do you borrow Python's built-in superpowers (JSON parsing, CSV reading)?",
  prerequisites: [
    "Understand how a Python script runs top-to-bottom.",
    "Know the difference between defining a function and calling it.",
    "Complete or understand the module guard lesson."
  ],
  testingFocus: "You will test that an import resolves without error and that the imported module's function produces the expected output.",
  objective: "Use import to access Python's standard library modules and call their functions.",
  whyItMatters: "Real Python scripts rarely start from blank. The standard library provides battle-tested tools for files, data, and system interaction. Imports are how you reach them.",
  coreConcept: "An import loads a module (a .py file or compiled extension) into your script's namespace so you can call its functions and access its constants. Python comes with a large standard library you can import without installing anything extra.",
  workedExample: "import json allows you to call json.loads() and json.dumps() to work with JSON data.",
  guidedExercise: "Open a Python file, add import json at the top, create a small dictionary, serialize it with json.dumps(), then print the result.",
  missionConnection: "Imports are your gateway to every Python module in the CLI Study Tracker and Study Data Cleaner missions.",
  reflectionPrompt: "Which is clearer for reading code — import module at the top of a file, or import specific_function from inside a function body?",
  practiceStarter: "import json\n\ndata = {\"topic\": \"python\", \"minutes\": 30}\njson_text = json.dumps(data)\nprint(json_text)",
  practiceExpected: '{"topic": "python", "minutes": 30}',
  practiceCheck: "The json.dumps() call converts the Python dictionary into a JSON string. If the output shows single quotes or no quotes around keys, json.dumps was not used correctly.",
  practiceReps: pythonImportPracticeReps,
  miniTitle: "Import a module and use it",
  miniGoal: "Write a small Python script that imports json and converts a session dictionary to a JSON string.",
  miniSteps: ["Add import json to your script", "Create a session dictionary", "Call json.dumps() to serialize it", "Print the JSON string"],
  miniDeliverables: [
    "Python script with import statement",
    "JSON output from json.dumps()",
    "Short reflection on import vs from...import syntax"
  ],
  verifierCommand: "python import_practice.py",
  expectedEvidence: "Script output showing the JSON string produced by json.dumps().",
  projectConnection: "Imports are the foundation of every module-based lesson: csv, json, argparse, and all standard library tools.",
  requiredCodeIncludes: ["import json", "json.dumps"],
  requiredOutputIncludes: ["topic", "minutes", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "import json\n\nsession = {\"topic\": \"python\", \"minutes\": 30}\njson_text = json.dumps(session)\nprint(json_text)",
  runnerTestCode: "import json\ntry:\n    json.loads('{}')\n    result = json.dumps({\"topic\": \"python\", \"minutes\": 30})\n    assert 'topic' in result\n    assert 'python' in result\n    assert '30' in result\n    print('import json passed')\nexcept NameError:\n    print('json module not imported - add import json')",
  hiddenTests: [
    {
      id: "import-json-parse",
      name: "JSON parse works",
      code: "import json\nparsed = json.loads('{\"topic\": \"git\", \"minutes\": 15}')\nassert parsed['topic'] == 'git'\nassert parsed['minutes'] == 15"
    },
    {
      id: "import-alternate-json",
      name: "JSON dump with alternate data",
      code: "import json\noutput = json.dumps({\"topic\": \"sql\", \"minutes\": 20})\nassert '\"topic\"' in output\nassert '\"sql\"' in output\nassert '20' in output"
    }
  ],
  curriculum: {
    level: 5,
    sequence: 0,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.import"],
    requires: ["py.module.guard"],
    usesButDoesNotTeach: ["py.assertion", "py.json", "py.csv"],
    visibleCodeConcepts: ["py.import"],
    quizConcepts: ["py.import"],
    proofOutputs: ["terminal_stdout"]
  }
});

pythonImportLesson.depth = {
  primaryConceptId: "py.import",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.import",
      definition: "Using the import statement to load a Python module (a .py file or compiled extension) into your script's namespace so you can call its functions and constants.",
      mentalModel: "Think of import as a library card. The standard library is a giant bookshelf of pre-written tools. import json checks out the json book and lets you use json.loads() and json.dumps() without writing them yourself.",
      syntaxShape: "import module_name\nfrom module_name import specific_name\nimport module_name as alias",
      tinyExample: "import json\ndata = json.loads('{\"key\": \"value\"}')",
      commonMistake: "Putting import inside a function body instead of at the top of the file, causing confusion about where a module is loaded.",
      repairHint: "Place all imports at the top of your file, before any function definitions or other code.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-im-1",
      label: "Basic import statement",
      codeFragment: "import json",
      conceptIds: ["py.import"],
      explanation: "Imports the json module. You can now call json.loads() and json.dumps() with the module prefix.",
      learnerShouldBeAbleToSay: "We import the json module so we can convert dictionaries to JSON strings."
    },
    {
      id: "w-im-2",
      label: "Using an imported function",
      codeFragment: "json_text = json.dumps(session)",
      conceptIds: ["py.import"],
      explanation: "Calls the dumps function from the json module, converting the Python dictionary to a JSON-formatted string.",
      learnerShouldBeAbleToSay: "json.dumps serializes a Python object to a JSON string with double quotes."
    },
    {
      id: "w-im-3",
      label: "from...import syntax",
      codeFragment: "from csv import DictReader",
      conceptIds: ["py.import"],
      explanation: "Imports only the DictReader class from the csv module, letting you call DictReader() directly without the module prefix.",
      learnerShouldBeAbleToSay: "from...import brings a specific name into the current namespace."
    }
  ],
  guidedEdits: [
    {
      id: "g-im-1",
      instruction: "Add an import json statement at the top of the script, before the variable definition.",
      conceptIds: ["py.import"],
      targetCodeFragment: "session = {\"topic\": \"python\", \"minutes\": 30}\njson_text = json.dumps(session)\nprint(json_text)",
      expectedObservation: "The json module is imported before being used, so json.dumps() produces a JSON string.",
      wrongTurnHint: "Put import json on a line before the session variable, at the very top of the file."
    }
  ],
  errorClinic: [
    {
      id: "e-im-1",
      conceptIds: ["py.import"],
      brokenExample: "data = json.loads('{\"key\": \"value\"}')\nimport json",
      symptom: "NameError: name 'json' is not defined",
      likelyCause: "The import statement appears after the code that uses it. Python executes files top-to-bottom, so json is not yet loaded.",
      fixStrategy: "Move import json to the very top of the file, before any code that uses it."
    },
    {
      id: "e-im-2",
      conceptIds: ["py.import"],
      brokenExample: "import cvs\nreader = csv.DictReader(open('data.csv'))",
      symptom: "ModuleNotFoundError: No module named 'cvs'",
      likelyCause: "The module name is misspelled as cvs instead of csv.",
      fixStrategy: "Double-check the spelling of the module name. Python's standard library modules include csv, json, argparse, and many others."
    }
  ],
  codeLabBridge: {
    story: "A Python file without imports can only do basic math and string work. Real utilities import csv, json, argparse, and other standard library modules. Mastering import is your first step into the full Python ecosystem.",
    usesConcepts: ["py.import"],
    learnerOwns: ["import json", "to_json"],
    checkerOwns: ["import-json-parse", "import-alternate-json"],
    runExpectation: "prints import json passed"
  },
  understandingProofPrompt: "What is the difference between import json and from json import dumps? When would you choose one over the other?",
  exitTicket: [
    "I can write an import statement at the top of a Python file.",
    "I know how to call functions from an imported module using the module prefix.",
    "I understand the difference between import module and from module import name."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 2 — Files Make Practice Real (run_file)
// ---------------------------------------------------------------------------

const fileInputLesson = proofLesson({
  id: "lesson-python-file-input",
  moduleId: "module-python-core",
  slug: "python-file-input",
  title: "Files Make Practice Real",
  summary: "Move from toy functions to repeatable input and output.",
  bodyMarkdown: "A useful beginner script can read a small file, validate each row, and report what it skipped. Keep parsing separate from printing so tests can inspect the result. Use pathlib.Path for paths instead of strings.",
  estimatedMinutes: 10,
  difficulty: "foundation",
  skillIds: ["skill-python-functions", "skill-testing-debugging"],
  quizId: "quiz-python-file-input",
  desktopTask: "Read a CSV or text file of study sessions, reject one malformed row, and return weekly totals.",
  evidencePrompt: "Capture the sample input, rejected-row behavior, and command output.",
  language: "Python",
  tools: ["Python 3", "CSV or text file", "terminal"],
  synopsis: "How do you load 1000 study sessions from a file without typing them by hand?",
  prerequisites: [
    "Complete or understand the function lesson.",
    "Have a tiny sample file with at least one valid row and one broken row."
  ],
  testingFocus: "You will test that valid rows become usable session data and malformed rows are rejected with an understandable reason instead of disappearing.",
  objective: "Read small local input while keeping parsing testable.",
  whyItMatters: "Real beginner projects become useful when they can handle imperfect files without crashing.",
  coreConcept: "Keep each job separate: read text from a file, split each row into fields, validate those fields, and report errors. Tests can then target parsing without touching the filesystem.",
  workedExample: "parse_row('2026-05-07,python,30') returns a session; parse_row('bad') returns a rejected-row reason.",
  guidedExercise: "Create two sample rows, one valid and one malformed, then return accepted sessions plus rejected reasons.",
  missionConnection: "This feeds both CLI Study Tracker and Study Data Cleaner.",
  reflectionPrompt: "What malformed row did you handle explicitly, and what row would still be risky?",
  commonMistakes: ["Forgetting to close the file (not using 'with')", "Assuming the file path is relative to the script instead of the working directory"],
  practiceStarter: "rows = [\n  \"2026-05-07,python,30\",\n  \"bad-row\",\n]\n\n# Write parse_rows(rows) so it returns accepted sessions and rejected reasons.\naccepted, rejected = parse_rows(rows)\nprint(accepted)\nprint(rejected)",
  practiceExpected: "[{'date': '2026-05-07', 'topic': 'python', 'minutes': 30}]\n[{'row': 'bad-row', 'reason': 'expected 3 columns'}]",
  practiceCheck: "You should see one accepted session and one rejected row. Accepted means the row became usable data. Rejected means the row was kept with a reason so the user can fix it.",
  practiceReps: [
    {
      starterCode: "rows = [\"2026-05-10,java,45\", \"2026-05-11,javascript,20\"]\naccepted, rejected = parse_rows(rows)\nprint(f\"{len(accepted)} sessions, {len(rejected)} rejected\")",
      expectedOutput: "2 sessions, 0 rejected for a valid pair of java and javascript rows.",
      checkYourAnswer: "Same parse_rows pattern, new topic values. If the output shows 2 accepted with correct data, the parser generalizes beyond the worked example.",
      tier: "replicate"
    },
    {
      starterCode: "def parse_rows(rows):\n    accepted = []\n    for row in rows:\n        parts = row.split(',')\n        if len(parts) == 3:\n            accepted.append({'topic': parts[1], 'minutes': parts[2]})\n    return accepted\n\ntest = [\"2026-05-10,python,30\"]\nresult = parse_rows(test)\nprint(result[0]['minutes'], type(result[0]['minutes']))",
      expectedOutput: "30 <class 'str'> — minutes is a string, not an integer, which breaks math operations.",
      checkYourAnswer: "The bug is that int() conversion is missing on parts[2]. Storing minutes as a string causes errors when summing totals or comparing values.",
      tier: "diagnose"
    },
    {
      starterCode: "# Write parse_rows(rows) that returns (accepted, rejected)\n# Each row: \"date,topic,minutes\"\n# Accepted: list of dicts with 'date','topic','minutes'(int)\n# Rejected: list of dicts with 'row' and 'reason'\n# Test with sample data:\n\nrows = [\"2026-05-10,python,30\", \"bad\", \"2026-05-11,git,20\"]\naccepted = []\nrejected = []\n# Your parsing logic here\n\nprint(f\"Accepted: {len(accepted)}, Rejected: {len(rejected)}\")",
      expectedOutput: "Accepted: 2, Rejected: 1, where 'bad' has a clear rejection reason like 'expected 3 columns'.",
      checkYourAnswer: "Your parser must separate accepted from rejected cleanly. If rejected is empty, bad rows are being silently dropped instead of reported.",
      tier: "synthesize"
    }
  ],
  miniTitle: "Build a safe row parser",
  miniGoal: "Parse a tiny study-session file while preserving both accepted rows and rejected-row reasons.",
  miniSteps: ["Create two valid rows and one malformed row", "Return accepted sessions and rejected reasons separately", "Print a short summary of accepted and rejected counts"],
  miniDeliverables: [
    "Parser function",
    "Sample input rows",
    "Output showing one rejected row with a reason"
  ],
  verifierCommand: "python parse_sessions.py",
  expectedEvidence: "Command output showing accepted rows, rejected reasons, and the exact malformed row that was handled.",
  projectConnection: "This is the input-safety slice for CLI Study Tracker and Study Data Cleaner.",
  requiredCodeIncludes: ["parse_rows", "rejected"],
  requiredOutputIncludes: ["bad-row", "expected 3 columns"],
  runnerLanguage: "python",
  runnerStarterCode: "def parse_rows(rows):\n    # Return (accepted, rejected).\n    # Split each line, check columns count, build dictionaries.\n    accepted = []\n    rejected = []\n    for row in rows:\n        parts = row.strip().split(',')\n        if len(parts) != 3:\n            rejected.append({'row': row, 'reason': 'expected 3 columns'})\n        else:\n            try:\n                minutes = int(parts[2])\n                accepted.append({'date': parts[0], 'topic': parts[1], 'minutes': minutes})\n            except ValueError:\n                rejected.append({'row': row, 'reason': 'minutes must be a number'})\n    return accepted, rejected\n",
  runnerTestCode: "accepted, rejected = parse_rows(['2026-05-07,python,30', 'bad-row'])\nassert accepted == [{'date': '2026-05-07', 'topic': 'python', 'minutes': 30}]\nassert rejected == [{'row': 'bad-row', 'reason': 'expected 3 columns'}]\nprint('bad-row expected 3 columns passed')",
  hiddenTests: [
    {
      id: "rejects-nonnumeric-minutes",
      name: "Rejects non-numeric minutes",
      code: "accepted, rejected = parse_rows(['2026-05-07,python,soon'])\nassert accepted == []\nassert rejected[0]['reason'] == 'minutes must be a number'"
    }
  ],
  curriculum: {
    level: 5,
    sequence: 1,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.file.input", "py.parser.separation", "py.pathlib"],
    requires: ["py.function.def", "py.try_except"],
    visibleCodeConcepts: ["py.file.input", "py.parser.separation", "py.pathlib"],
    quizConcepts: ["py.file.input", "py.parser.separation"],
    proofOutputs: ["terminal_stdout"]
  }
});

fileInputLesson.depth = {
  primaryConceptId: "py.file.input",
  secondaryConceptIds: ["py.parser.separation"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.file.input",
      definition: "Using Python's open() with a context manager (with) to safely stream text data from disk.",
      mentalModel: "Think of open() as requesting a book from a library, and 'with' as a study room that automatically returns the book when you walk out, preventing resource leaks.",
      syntaxShape: "with open(path, 'r') as file:\n    lines = file.readlines()",
      tinyExample: "with open('log.txt') as f: print(f.read())",
      commonMistake: "Calling open() without 'with', which locks the file in memory if the script crashes before close() runs.",
      repairHint: "Wrap file operations inside a 'with open(...) as name:' block.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.parser.separation",
      definition: "Isolating file reading side effects from the pure logic of converting string rows into structured types.",
      mentalModel: "Keep a water faucet (file reading) separate from the mixing bowl (parsing logic). If you parse lines as list of strings, you can test parsing without needing real files on disk.",
      syntaxShape: "def parse(lines):\n    return [line.strip().split(',') for line in lines]",
      tinyExample: "parse(['a,b,c'])",
      commonMistake: "Putting 'open()' inside the row parser, which makes writing automated tests extremely difficult.",
      repairHint: "Accept lists of strings or raw string blocks, and let the caller handle file opening.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.pathlib",
      definition: "Object-oriented path handling with pathlib.Path for joining, reading, and checking files without manual string ops or os.path.",
      mentalModel: "Think of Path as a smart file address object. p = Path('data/sessions.csv'); p.exists() tells truth without string hacks.",
      syntaxShape: "from pathlib import Path\np = Path('sessions.csv')\ntext = p.read_text()",
      tinyExample: "p = Path('log.txt'); print(p.suffix)",
      commonMistake: "Hardcoding '/' or '\\\\' in paths instead of using Path / operator or joinpath.",
      repairHint: "Use from pathlib import Path; p = Path(dir) / filename",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-fi-1",
      label: "Safe open block",
      codeFragment: "with open('study.csv', 'r') as f:",
      conceptIds: ["py.file.input"],
      explanation: "Opens study.csv for reading. File automatically closes when the code block exits.",
      learnerShouldBeAbleToSay: "This context manager handles opening and closing files safely."
    },
    {
      id: "w-fi-2",
      label: "Pass lines, not handles",
      codeFragment: "parsed_records = parse_rows(f.readlines())",
      conceptIds: ["py.parser.separation"],
      explanation: "Reads lines from file handle and forwards raw text strings to a pure parser function.",
      learnerShouldBeAbleToSay: "We separate file input from the parsing rules by passing string list."
    }
  ],
  guidedEdits: [
    {
      id: "g-fi-1",
      instruction: "Add a column count validator. If a split row does not have 3 parts, record it in the rejected list.",
      conceptIds: ["py.parser.separation"],
      targetCodeFragment: "def parse_rows(rows):\n    # Return (accepted, rejected).\n    return [], []",
      expectedObservation: "A malformed row like 'bad-row' is recorded under rejected with a reason.",
      wrongTurnHint: "Split each row on commas. Check if length is 3 before indexing fields."
    }
  ],
  errorClinic: [
    {
      id: "e-fi-1",
      conceptIds: ["py.file.input"],
      brokenExample: "f = open('data.csv')\n# do calculations\nf.close()",
      symptom: "ResourceWarning: unclosed file <_io.TextIOWrapper ...>",
      likelyCause: "If calculations raise an exception, f.close() is skipped and the file descriptor leaks.",
      fixStrategy: "Rewrite with context manager: with open('data.csv') as f:\n    # calculations"
    }
  ],
  codeLabBridge: {
    story: "Beginner scripts often mix reading files with parsing. Learn to separate them so that your parser tests can run on pure list structures.",
    usesConcepts: ["py.file.input", "py.parser.separation"],
    learnerOwns: ["parse_rows"],
    checkerOwns: ["rejects-nonnumeric-minutes"],
    runExpectation: "prints bad-row expected 3 columns passed"
  },
  understandingProofPrompt: "Why does passing a list of strings to our parser make it easier to test than passing the filename itself?",
  exitTicket: [
    "I understand how the with open context manager prevents locked file resource warnings.",
    "I know how to write a parse function that accepts string rows instead of file paths."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 2 — Tests That Catch Bad Input (run_file)
// ---------------------------------------------------------------------------

const parserTestsLesson = proofLesson({
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
  language: "Python",
  tools: ["Python 3", "pytest or unittest", "terminal"],
  synopsis: "What if one line in your 5000-row file breaks the whole program?",
  prerequisites: [
    "Understand the parser's expected input format.",
    "Have a parser function or planned parser contract ready."
  ],
  testingFocus: "You will run tests that fail before the parser handles bad input and pass after the parser returns clear accepted or rejected results.",
  objective: "Write parser tests that prove both success and failure behavior.",
  whyItMatters: "Project evidence is stronger when the test suite shows the app handles messy user input.",
  coreConcept: "A good test has a tiny input, an expected output, and a reason it would fail if the parser regressed. Regressed means a behavior that used to work became broken later.",
  workedExample: "assert parse_row('2026-05-07,python,30').minutes == 30 and assert reject_row('bad').reason contains 'columns'.",
  guidedExercise: "Add one passing test and one rejection test before changing parser code.",
  missionConnection: "This is the verification backbone for Study Data Cleaner.",
  reflectionPrompt: "Which test failed first, and what did the failure teach you about the parser contract?",
  practiceStarter: "def test_parse_valid_row():\n    assert parse_row(\"2026-05-07,python,30\")[\"minutes\"] == 30\n\n\ndef test_rejects_bad_minutes():\n    result = parse_row(\"2026-05-07,python,soon\")\n    assert result[\"error\"] == \"minutes must be a number\"",
  practiceExpected: "First run: at least one failing test if the parser does not handle bad minutes yet.\nFinal run: pytest reports both tests pass.",
  practiceCheck: "A useful test names the exact bad input and expected rejection. Avoid changing the test just to match a weak parser; the test should protect the behavior you want.",
  practiceReps: pythonParserTestPracticeReps,
  miniTitle: "Add parser regression tests",
  miniGoal: "Write tests that prove a parser accepts clean rows and rejects bad minutes.",
  miniSteps: ["Write one test for a valid row", "Write one test for non-numeric minutes", "Run the tests before and after fixing the parser"],
  miniDeliverables: [
    "Test file",
    "Parser fix or parser contract",
    "Final passing test output"
  ],
  verifierCommand: "python -m pytest",
  expectedEvidence: "A test run showing the parser tests pass, plus a note about the failure you protected against.",
  projectConnection: "This is the repeatable check backbone for the Study Data Cleaner mission.",
  requiredCodeIncludes: ["test_parse_valid_row", "test_rejects_bad_minutes"],
  requiredOutputIncludes: ["passed"],
  runnerLanguage: "python",
  runnerStarterCode: "def parse_row(row):\n    # Return a dict for valid rows or {'error': reason} for invalid rows.\n    parts = row.strip().split(',')\n    if len(parts) != 3:\n        return {'error': 'expected 3 columns'}\n    try:\n        minutes = int(parts[2])\n        return {'date': parts[0], 'topic': parts[1], 'minutes': minutes}\n    except ValueError:\n        return {'error': 'minutes must be a number'}\n\n\ndef test_parse_valid_row():\n    assert parse_row('2026-05-07,python,30')['minutes'] == 30\n\n\ndef test_rejects_bad_minutes():\n    result = parse_row('2026-05-07,python,soon')\n    assert result['error'] == 'minutes must be a number'\n",
  runnerTestCode: "test_parse_valid_row()\ntest_rejects_bad_minutes()\nprint('2 passed')",
  hiddenTests: [
    {
      id: "rejects-column-count",
      name: "Rejects malformed column counts",
      code: "result = parse_row('bad-row')\nassert result['error'] == 'expected 3 columns'"
    }
  ],
  curriculum: {
    level: 5,
    sequence: 2,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.test.assertions", "py.test.failures"],
    requires: ["py.file.input", "py.parser.separation"],
    visibleCodeConcepts: ["py.test.assertions", "py.test.failures"],
    quizConcepts: ["py.test.assertions", "py.test.failures"],
    usesButDoesNotTeach: ["py.csv"],
    proofOutputs: ["terminal_stdout"]
  }
});

parserTestsLesson.depth = {
  primaryConceptId: "py.test.assertions",
  secondaryConceptIds: ["py.test.failures"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.test.assertions",
      definition: "Writing assertions that target exact field values or error dictionary structures returned by logic.",
      mentalModel: "Think of an assertion as a safety inspector. If a box has '30' stamped on the side but contains a string, the inspector rings a loud alarm (AssertionError).",
      syntaxShape: "assert expression_that_evaluates_to_boolean",
      tinyExample: "assert parse_row('a,b,5')['minutes'] == 5",
      commonMistake: "Asserting vague things like 'assert result' which passes for empty dictionaries or error lists.",
      repairHint: "Assert on specific keys and values: assert result['minutes'] == 30, not just assert result.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.test.failures",
      definition: "Intentionally passing invalid input strings to a parser to prove it flags error keys.",
      mentalModel: "A crash test: you drive a test car into a wall (bad input) to make sure the airbag deploys (returns error) instead of the engine exploding (crashing the script).",
      syntaxShape: "assert parse_row('bad')['error'] == 'expected 3 columns'",
      tinyExample: "assert 'error' in parse_row('bad')",
      commonMistake: "Only testing happy paths, leaving the code vulnerable to quiet silent data corruption on messy inputs.",
      repairHint: "Write separate test functions specifically containing malformed test rows.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-pt-1",
      label: "Assert value extraction",
      codeFragment: "assert parse_row('2026-06-21,python,30')['minutes'] == 30",
      conceptIds: ["py.test.assertions"],
      explanation: "Asserts that string '30' was correctly parsed and converted to the integer 30.",
      learnerShouldBeAbleToSay: "We verify the numeric type and value matches 30."
    },
    {
      id: "w-pt-2",
      label: "Assert error dictionary key",
      codeFragment: "assert result['error'] == 'minutes must be a number'",
      conceptIds: ["py.test.failures"],
      explanation: "Ensures the parser caught the non-numeric string and populated the error field.",
      learnerShouldBeAbleToSay: "We confirm a bad minutes value produces the expected error text."
    }
  ],
  guidedEdits: [
    {
      id: "g-pt-1",
      instruction: "Add a test function 'test_rejects_empty_row' that asserts an empty row returns a column count error.",
      conceptIds: ["py.test.failures"],
      targetCodeFragment: "def test_rejects_bad_minutes():",
      expectedObservation: "pytest discovers and runs three tests, verifying the empty row rejection.",
      wrongTurnHint: "Write a new def starting with test_ and call parse_row('') inside."
    }
  ],
  errorClinic: [
    {
      id: "e-pt-1",
      conceptIds: ["py.test.assertions"],
      brokenExample: "def test_row():\n    parse_row('a,b,30') # forgot assert!",
      symptom: "Test passes even if the parser returns empty dicts.",
      likelyCause: "Function was executed, but its return value was never inspected using an assert statement.",
      fixStrategy: "Always assign the result and add an assert statement: assert parse_row(...) == expected"
    }
  ],
  codeLabBridge: {
    story: "Testing is not just checking if the code runs. Repeatable tests prove your code handles edge cases correctly.",
    usesConcepts: ["py.test.assertions", "py.test.failures"],
    learnerOwns: ["parse_row", "test_parse_valid_row", "test_rejects_bad_minutes"],
    checkerOwns: ["rejects-column-count"],
    runExpectation: "prints 2 passed"
  },
  understandingProofPrompt: "What is the difference between a test crashing with a TypeError vs a test failing an assertion? Which is better for a user-facing tool?",
  exitTicket: [
    "I know how to write pytest assertions that inspect error keys in dictionaries.",
    "I can explain why happy-path testing is insufficient for CSV parser stability."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 3 — Turn a Script Into a Command (run_file)
// ---------------------------------------------------------------------------

const cliArgumentsLesson = proofLesson({
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
  language: "Python",
  tools: ["Python 3", "terminal", "argparse"],
  synopsis: "How does your program know which file to work on without editing the code?",
  prerequisites: [
    "Know how to write a function that returns a dictionary.",
    "Know how to convert text minutes into an integer safely."
  ],
  testingFocus: "You will test that one argparse argument list becomes a parsed dictionary and a readable summary. Parsed means argparse has converted terminal text into structured values.",
  objective: "Turn hardcoded tracker data into real argparse command input.",
  whyItMatters: "Real command-line tools let the user run the same program with different values. That is the difference between a demo and a reusable workflow.",
  coreConcept: "A CLI is a command-line interface: a program you run from the terminal. argparse is Python's helper for reading command flags such as --topic and --minutes, then turning them into values your program can use.",
  workedExample: "An argparse parser with --topic and --minutes can parse ['--topic', 'python', '--minutes', '30'] into topic='python' and minutes=30.",
  guidedExercise: "Write a small argparse parser for a topic and minutes pair, then build the summary from the parsed result.",
  missionConnection: "This is the command boundary for the CLI Study Tracker mission.",
  reflectionPrompt: "Which part of your code knows about --topic, and which part only cares about a parsed dictionary?",
  commonMistakes: ["Confusing --flags with positional arguments", "Forgetting type=int on numeric arguments"],
  practiceStarter: "import argparse\n\nargs = [\"--topic\", \"python\", \"--minutes\", \"30\"]\n\ndef build_parser():\n    parser = argparse.ArgumentParser(prog=\"study_tracker\")\n    # Add --topic and --minutes here.\n    return parser\n\ndef parse_cli(args):\n    namespace = build_parser().parse_args(args)\n    return {}\n\nparsed = parse_cli(args)\nsummary = \"\"\nprint(parsed)\nprint(summary)",
  practiceExpected: "{'topic': 'python', 'minutes': 30}\npython: 30 minutes",
  practiceCheck: "The parser should return data, not print inside itself. If minutes is still '30' as text, check whether the --minutes argument uses type=int so Python converts it to the number 30.",
  practiceReps: pythonCliArgumentPracticeReps,
  miniTitle: "Create the argparse command boundary",
  miniGoal: "Build an argparse parser that turns topic and minutes flags into reusable tracker data.",
  miniSteps: ["Create an ArgumentParser", "Add --topic and --minutes with type=int for minutes", "Build a summary from the parsed dictionary"],
  miniDeliverables: [
    "build_parser and parse_cli functions",
    "Parsed dictionary output",
    "Summary output"
  ],
  verifierCommand: "python study_tracker_cli.py --topic python --minutes 30",
  expectedEvidence: "Terminal output or sandbox check showing parsed data and summary, plus one note explaining how argparse handles bad minutes.",
  projectConnection: "This turns CLI Study Tracker from a hardcoded script into a reusable command-line tool.",
  requiredCodeIncludes: ["argparse", "add_argument", "--topic", "--minutes", "type=int"],
  requiredOutputIncludes: ["python", "30", "minutes"],
  runnerLanguage: "python",
  runnerStarterCode: "import argparse\n\nargs = [\"--topic\", \"python\", \"--minutes\", \"30\"]\n\ndef build_parser():\n    parser = argparse.ArgumentParser(prog=\"study_tracker\")\n    # Add --topic and --minutes here.\n    parser.add_argument('--topic', required=True)\n    parser.add_argument('--minutes', required=True, type=int)\n    return parser\n\ndef parse_cli(args):\n    namespace = build_parser().parse_args(args)\n    return {'topic': namespace.topic, 'minutes': namespace.minutes}\n\nparsed = parse_cli(args)\nsummary = f\"{parsed['topic']}: {parsed['minutes']} minutes\"\nprint(parsed)\nprint(summary)",
  runnerTestCode: "assert parsed == {'topic': 'python', 'minutes': 30}\nassert summary == 'python: 30 minutes'\nprint('python cli 30 minutes passed')",
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
  curriculum: {
    level: 5,
    sequence: 3,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.cli.arguments", "py.argparse.parser"],
    requires: ["py.function.def"],
    usesButDoesNotTeach: ["py.argparse"],
    visibleCodeConcepts: ["py.cli.arguments", "py.argparse.parser"],
    quizConcepts: ["py.cli.arguments", "py.argparse.parser"],
    proofOutputs: ["terminal_stdout"]
  }
});

cliArgumentsLesson.depth = {
  primaryConceptId: "py.cli.arguments",
  secondaryConceptIds: ["py.argparse.parser"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.cli.arguments",
      definition: "Accepting configuration inputs from the terminal argv list rather than hardcoding them in functions.",
      mentalModel: "Think of command flags like ordering food: --topic is the dish name and --minutes is the quantity. You pass the order to the kitchen without rewriting the recipe.",
      syntaxShape: "python script.py --flag value",
      tinyExample: "--topic python",
      commonMistake: "Leaving variables hardcoded in the file and pretending argument flags are being parsed.",
      repairHint: "Make sure you read values from the returned argparse namespace instead of local variables.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.argparse.parser",
      definition: "Python's standard library module for declaring, validating, and converting terminal flag values.",
      mentalModel: "Think of argparse as a border checkpoint: it inspects flags, converts strings to numbers, and rejects bad options with automatic help instructions.",
      syntaxShape: "parser = argparse.ArgumentParser()\nparser.add_argument('--topic')\nargs = parser.parse_args()",
      tinyExample: "parser.add_argument('--minutes', type=int)",
      commonMistake: "Forgetting type=int, which keeps minutes as a string that causes math errors later.",
      repairHint: "Add type=int to numeric arguments so argparse handles the conversion boundary.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-arg-1",
      label: "Create ArgumentParser",
      codeFragment: "parser = argparse.ArgumentParser(prog='study_tracker')",
      conceptIds: ["py.argparse.parser"],
      explanation: "Initializes the command-line argument parser with a program name.",
      learnerShouldBeAbleToSay: "We start argparse with the tracker name."
    },
    {
      id: "w-arg-2",
      label: "Declare typed flag",
      codeFragment: "parser.add_argument('--minutes', type=int)",
      conceptIds: ["py.argparse.parser"],
      explanation: "Configures the --minutes flag. Setting type=int validates that input is a number.",
      learnerShouldBeAbleToSay: "Minutes flag must be convertible to an integer."
    }
  ],
  guidedEdits: [
    {
      id: "g-arg-1",
      instruction: "Add a --topic argument to build_parser. It should be a string.",
      conceptIds: ["py.cli.arguments"],
      targetCodeFragment: "# Add --topic and --minutes here.",
      expectedObservation: "argparse extracts the --topic python parameter into the parsed dictionary.",
      wrongTurnHint: "Call parser.add_argument('--topic') inside build_parser."
    }
  ],
  errorClinic: [
    {
      id: "e-arg-1",
      conceptIds: ["py.argparse.parser"],
      brokenExample: "parser.add_argument('--minutes')\n# parsed.minutes + 10",
      symptom: "TypeError: can only concatenate str (not \"int\") to str",
      likelyCause: "Missing type=int in add_argument, leaving the parsed value as a string.",
      fixStrategy: "Change the definition: parser.add_argument('--minutes', type=int)"
    }
  ],
  codeLabBridge: {
    story: "Hardcoding inputs restricts scripts. Argparse sets a clear boundary between users running flags and core tracker logic.",
    usesConcepts: ["py.cli.arguments", "py.argparse.parser"],
    learnerOwns: ["build_parser", "parse_cli"],
    checkerOwns: ["parses-alternate-command", "bad-minutes-fails-argparse"],
    runExpectation: "prints python cli 30 minutes passed"
  },
  understandingProofPrompt: "What does argparse do automatically when a user inputs a non-numeric value for a type=int flag?",
  exitTicket: [
    "I can configure argparse command flags with type conversions.",
    "I know how to return structured arguments separated from terminal display code."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 4 — Run the Tracker From a File (run_file)
// ---------------------------------------------------------------------------

const fileBackedCliLesson = proofLesson({
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
  language: "Python",
  tools: ["Python 3", "argparse", "CSV file input", "terminal"],
  synopsis: "Your CSV reader works. Your CLI handles arguments. What happens when you combine them?",
  prerequisites: [
    "Know how argparse parses --input style flags.",
    "Know how session rows should become dictionaries with numeric minutes."
  ],
  testingFocus: "You will test that the CLI path selects a file, reads the records, and calculates the summary from file contents rather than from hardcoded values.",
  objective: "Combine argparse with file-backed session input.",
  whyItMatters: "This is where the tracker starts behaving like a real local developer tool: the command names an input file, and the program calculates from that file instead of hardcoded data.",
  coreConcept: "Keep the boundary clear: argparse reads the file path, a file-reading function turns file text into records, and the reporting function prints the summary.",
  workedExample: "python study_tracker.py --input sessions.csv should produce output such as 2 sessions, 45 minutes from the file contents.",
  guidedExercise: "Build a run_cli function that accepts --input, reads session rows, and returns the calculated summary.",
  missionConnection: "This is the final CLI rehearsal before packaging the project as portfolio proof.",
  reflectionPrompt: "Which function knows about file paths, and which function only knows about session records?",
  practiceStarter: "import argparse\nimport csv\nfrom io import StringIO\n\nSAMPLE_CSV = \"\"\"date,topic,minutes\n2026-05-07,python,30\n2026-05-08,git,15\n\"\"\"\n\n# Build parser, read sessions, then run with --input sessions.csv.",
  practiceExpected: "2 sessions, 45 minutes",
  practiceCheck: "If the output changes after changing the CSV text, the program is reading the file data. If it stays the same, the summary is probably hardcoded.",
  practiceReps: [
    {
      starterCode: "csv_content = \"date,topic,minutes\\n2026-05-10,sql,25\\n2026-05-11,git,30\"\nsessions = read_sessions(csv_content)\ntotal = sum(s[\"minutes\"] for s in sessions)\nprint(f\"{len(sessions)} sessions, {total} minutes\")",
      expectedOutput: "2 sessions, 55 minutes from sql and git sessions.",
      checkYourAnswer: "This calls read_sessions with new data. If the output is always the same, the function is hardcoded instead of reading from the CSV text.",
      tier: "replicate"
    },
    {
      starterCode: "csv_text = \"date,topic\\n2026-05-10,python,30\\n2026-05-11,git,15\"\nfrom io import StringIO\nimport csv\nf = StringIO(csv_text)\nreader = csv.DictReader(f)\nfor row in reader:\n    print(row)",
      expectedOutput: "Only two keys 'date' and 'topic' appear — minutes is missing because the CSV header declares only two columns.",
      checkYourAnswer: "The header line says 'date,topic' but data rows have three columns. The header must include 'minutes' for that column to be parsed by DictReader.",
      tier: "diagnose"
    },
    {
      starterCode: "# Write read_sessions(csv_text) that parses CSV content\n# and returns session dicts with 'date','topic','minutes'(int)\n# Then test it:\n\ncsv = \"date,topic,minutes\\n2026-05-10,python,30\"\nsessions = []  # Replace with your read_sessions call\nprint(f\"{len(sessions)} session(s)\")\nif sessions:\n    print(sessions[0]['topic'], sessions[0]['minutes'])",
      expectedOutput: "1 session with topic python and 30 as an integer.",
      checkYourAnswer: "The CSV text should become one session with correct fields. If the output is 0 sessions, the reader isn't extracting rows from the CSV string.",
      tier: "synthesize"
    }
  ],
  miniTitle: "Build a file-backed CLI run",
  miniGoal: "Create a tracker command that accepts an input file path and calculates totals from that file's records.",
  miniSteps: ["Add an argparse --input argument", "Read CSV rows into dictionaries with numeric minutes", "Return a summary from run_cli using the selected file"],
  miniDeliverables: [
    "build_parser function",
    "read_sessions function",
    "run_cli output from sessions.csv"
  ],
  verifierCommand: "python study_tracker.py --input sessions.csv",
  expectedEvidence: "Command output showing 2 sessions, 45 minutes from sessions.csv plus the sample CSV used to produce it.",
  projectConnection: "This makes CLI Study Tracker a real reproducible command instead of a sandbox-only exercise.",
  requiredCodeIncludes: ["argparse", "--input", "csv", "read_sessions", "run_cli"],
  requiredOutputIncludes: ["2 sessions", "45 minutes", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "import argparse\nimport csv\nfrom io import StringIO\n\nSAMPLE_CSV = \"\"\"date,topic,minutes\n2026-05-07,python,30\n2026-05-08,git,15\n\"\"\"\n\ndef build_parser():\n    parser = argparse.ArgumentParser(prog=\"study_tracker\")\n    # Add --input here.\n    parser.add_argument('--input', required=True)\n    return parser\n\ndef read_sessions(csv_text):\n    # Parse CSV content\n    f = StringIO(csv_text.strip())\n    reader = csv.DictReader(f)\n    sessions = []\n    for row in reader:\n        sessions.append({'date': row['date'], 'topic': row['topic'], 'minutes': int(row['minutes'])})\n    return sessions\n\ndef run_cli(args, files):\n    namespace = build_parser().parse_args(args)\n    sessions = read_sessions(files[namespace.input])\n    total_minutes = sum(session[\"minutes\"] for session in sessions)\n    return f\"{len(sessions)} sessions, {total_minutes} minutes\"\n\noutput = run_cli([\"--input\", \"sessions.csv\"], {\"sessions.csv\": SAMPLE_CSV})\nprint(output)",
  runnerTestCode: "assert read_sessions(SAMPLE_CSV) == [\n    {'date': '2026-05-07', 'topic': 'python', 'minutes': 30},\n    {'date': '2026-05-08', 'topic': 'git', 'minutes': 15},\n]\nassert output == '2 sessions, 45 minutes'\nprint('2 sessions 45 minutes passed')",
  hiddenTests: [
    {
      id: "file-backed-cli-uses-selected-file",
      name: "CLI uses the selected input file",
      code: "other_csv = 'date,topic,minutes\\n2026-05-09,sql,20\\n'\nassert run_cli(['--input', 'other.csv'], {'other.csv': other_csv}) == '1 sessions, 20 minutes'"
    }
  ],
  curriculum: {
    level: 5,
    sequence: 4,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.cli.file_backed", "py.cli.integration"],
    requires: ["py.cli.arguments", "py.file.input"],
    usesButDoesNotTeach: ["py.argparse", "py.csv"],
    visibleCodeConcepts: ["py.cli.file_backed", "py.cli.integration"],
    quizConcepts: ["py.cli.file_backed", "py.cli.integration"],
    proofOutputs: ["terminal_stdout"]
  }
});

fileBackedCliLesson.depth = {
  primaryConceptId: "py.cli.file_backed",
  secondaryConceptIds: ["py.cli.integration"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.cli.file_backed",
      definition: "Using a command argument to specify the file path to parse, making the utility independent of hardcoded files.",
      mentalModel: "Think of the file path like a address on an envelope: the mailman (CLI) delivers the envelope (file contents) to the house (parser) without knowing what is written inside.",
      syntaxShape: "python cli.py --input path/to/file.csv",
      tinyExample: "--input data.csv",
      commonMistake: "Hardcoding 'sessions.csv' inside open() while parsing the --input flag, ignoring the user's choice.",
      repairHint: "Pass namespace.input as the path to your file opening logic.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.cli.integration",
      definition: "Connecting argument parsing, file reading, and data validation into a single coordinated command workflow.",
      mentalModel: "Think of an assembly line: one station reads the order, the next fetches the material, and the final station constructs the report. Keep the workflow clean.",
      syntaxShape: "def run_cli(args):\n    ns = parse_args(args)\n    data = read_file(ns.input)\n    print(format_report(data))",
      tinyExample: "run_cli(sys.argv[1:])",
      commonMistake: "Mixing CSV column splitting inside the argument parsing function, breaking separation of concerns.",
      repairHint: "Create a coordinate function (like run_cli) that calls build_parser, read_sessions, and totals reports.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-fb-1",
      label: "Map --input flag",
      codeFragment: "parser.add_argument('--input', required=True)",
      conceptIds: ["py.cli.file_backed"],
      explanation: "Declares --input as a required terminal argument holding the file path.",
      learnerShouldBeAbleToSay: "We require the user to supply the CSV filepath."
    },
    {
      id: "w-fb-2",
      label: "Coordinate flow",
      codeFragment: "sessions = read_sessions(files[namespace.input])",
      conceptIds: ["py.cli.integration"],
      explanation: "Extracts the path argument, reads the associated file rows, and creates data models.",
      learnerShouldBeAbleToSay: "We route the specified file path to our reader function."
    }
  ],
  guidedEdits: [
    {
      id: "g-fb-1",
      instruction: "Implement read_sessions using the csv.DictReader or string splitting. Minutes must be cast to integer.",
      conceptIds: ["py.cli.integration"],
      targetCodeFragment: "def read_sessions(csv_text):\n    return []",
      expectedObservation: "The read_sessions function correctly parses CSV rows into dictionaries with numeric minutes.",
      wrongTurnHint: "Split by lines, then by commas, skipping header. Convert row[2] to int."
    }
  ],
  errorClinic: [
    {
      id: "e-fb-1",
      conceptIds: ["py.cli.file_backed"],
      brokenExample: "def run_cli():\n    # open('sessions.csv')\n    # parser.parse_args()",
      symptom: "Script ignores the --input argument and always loads sessions.csv.",
      likelyCause: "File path is hardcoded instead of read from the argparse namespace.",
      fixStrategy: "Extract the value: path = parser.parse_args().input; open(path)"
    }
  ],
  codeLabBridge: {
    story: "A tool that only works on one hardcoded file is a script, not a utility. Let users point the command at any session log.",
    usesConcepts: ["py.cli.file_backed", "py.cli.integration"],
    learnerOwns: ["build_parser", "read_sessions", "run_cli"],
    checkerOwns: ["file-backed-cli-uses-selected-file"],
    runExpectation: "prints 2 sessions 45 minutes passed"
  },
  understandingProofPrompt: "What happens if you run study_tracker.py with --input missing.csv when the file does not exist on disk?",
  exitTicket: [
    "I can pass filenames dynamically from the CLI to open functions.",
    "I can trace input data from terminal flags down to CSV parser lines."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 5 — Polish the CLI Experience (run_file)
// ---------------------------------------------------------------------------

const cliPolishLesson = proofLesson({
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
  language: "Python",
  tools: ["Python 3", "argparse", "terminal", "--help output"],
  synopsis: "Your tool works — but would anyone else know how to use it?",
  prerequisites: [
    "Know how to build an argparse parser with --input.",
    "Know that parsed arguments should stay separate from file reading and report logic."
  ],
  testingFocus: "You will test the help text, default values, valid choices, and invalid-choice behavior before packaging the CLI.",
  objective: "Make the tracker command guide the user before and after mistakes.",
  whyItMatters: "Polish is not decoration. A CLI with clear help, defaults, and constrained choices reduces support burden and makes the project easier for a reviewer to run.",
  coreConcept: "argparse can describe the command, document each flag, provide defaults, restrict choices, and reject invalid values before business logic runs. A default is the value used when the user does not provide one. Choices are the allowed values for a flag.",
  workedExample: "A polished parser might accept --input sessions.csv, default --format text, allow --format json, and reject --format xml with a useful message.",
  guidedExercise: "Add description, help text, defaults, and choices to the tracker parser, then inspect the generated help output.",
  missionConnection: "This is the last CLI quality pass before the project becomes portfolio evidence.",
  reflectionPrompt: "Which user mistake should argparse catch, and which mistake belongs in your own file or row validation?",
  practiceStarter: "import argparse\n\n\ndef build_parser():\n    parser = argparse.ArgumentParser(prog=\"study_tracker\")\n    # Add description, --input, --format, and --min-minutes.\n    return parser\n\nparser = build_parser()\nparsed = parser.parse_args([\"--input\", \"sessions.csv\"])\nhelp_text = parser.format_help()\nprint(parsed.input)\nprint(parsed.format)\nprint(parsed.min_minutes)\nprint(\"--input\" in help_text)",
  practiceExpected: "sessions.csv\ntext\n0\nTrue",
  practiceCheck: "If --format is missing, add a default. If --input is not in help_text, the user cannot discover the required file flag from --help. Good help text reduces guessing.",
  practiceReps: [
    {
      starterCode: "import argparse\nparser = argparse.ArgumentParser(prog=\"study_tracker\", description=\"Track your study sessions\")\nparser.add_argument(\"--topic\", help=\"Study topic (e.g. python, git)\")\nparser.add_argument(\"--format\", default=\"text\", choices=[\"text\", \"json\"])\nprint(parser.format_help())",
      expectedOutput: "Help output showing --topic, --format options with 'Track your study sessions' description.",
      checkYourAnswer: "Help text is auto-generated by argparse. If --topic or --format is missing, the add_argument calls are incomplete.",
      tier: "replicate"
    },
    {
      starterCode: "import argparse\nparser = argparse.ArgumentParser(prog=\"study_tracker\")\nparser.add_argument(\"--format\", default=\"text\")\nparser.add_argument(\"--topic\", required=True)\n\ntry:\n    args = parser.parse_args([\"--topic\", \"python\", \"--format\", \"xml\"])\n    print(f\"Format: {args.format}\")\nexcept SystemExit:\n    print(\"Invalid format rejected\")",
      expectedOutput: "Format: xml — the invalid format 'xml' is accepted because choices=['text', 'json'] is missing.",
      checkYourAnswer: "Without choices, argparse accepts any string for --format. Add choices=['text', 'json'] to reject invalid formats at the CLI boundary.",
      tier: "diagnose"
    },
    {
      starterCode: "# Build an ArgumentParser that:\n# - Has description \"Study session reporter\"\n# - Accepts --input (required, help=\"Path to CSV\")\n# - Accepts --format with choices text/json, default text\n# - Has --min-minutes with type=int and default 0\n\n# Write your build_parser function:\ndef build_parser():\n    pass  # Your code here\n\n# Test it:\nparser = build_parser()\nargs = parser.parse_args([\"--input\", \"data.csv\"])\nprint(args.format, args.min_minutes)",
      expectedOutput: "Default values 'text' and 0 are used when optional flags are omitted.",
      checkYourAnswer: "Default values make the CLI easier to use. If you get an error about missing --format, you need a default= value in the add_argument call.",
      tier: "synthesize"
    }
  ],
  miniTitle: "Make the tracker CLI reviewer-friendly",
  miniGoal: "Polish the tracker parser with useful help text, defaults, choices, and invalid-value handling.",
  miniSteps: ["Add a parser description and help text for each option", "Give --format a default of text and choices of text or json", "Give --min-minutes a default of 0 and type=int"],
  miniDeliverables: [
    "Polished build_parser function",
    "--help output",
    "Default and explicit format check"
  ],
  verifierCommand: "python study_tracker.py --help && python study_tracker.py --input sessions.csv",
  expectedEvidence: "Help output showing --input, --format, and --min-minutes plus a run proving defaults are applied.",
  projectConnection: "This makes CLI Study Tracker easier for a reviewer to run, inspect, and trust.",
  requiredCodeIncludes: ["description", "help=", "default=", "choices", "--format", "--min-minutes"],
  requiredOutputIncludes: ["--input", "--format", "text", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "import argparse\n\n\ndef build_parser():\n    parser = argparse.ArgumentParser(\n        prog=\"study_tracker\",\n        description=\"Summarize study sessions from csv.\"\n    )\n    parser.add_argument('--input', required=True, help='Path to sessions csv')\n    parser.add_argument('--format', default='text', choices=['text', 'json'], help='Report format')\n    parser.add_argument('--min-minutes', default=0, type=int, help='Min minutes filter')\n    return parser\n\nparser = build_parser()\nparsed = parser.parse_args([\"--input\", \"sessions.csv\"])\nhelp_text = parser.format_help()\nprint(parsed.input)\nprint(parsed.format)\nprint(parsed.min_minutes)\nprint(\"--input\" in help_text)",
  runnerTestCode: "assert parsed.input == 'sessions.csv'\nassert parsed.format == 'text'\nassert parsed.min_minutes == 0\nassert '--input' in help_text\nassert '--format' in help_text\nassert '--min-minutes' in help_text\nassert 'Summarize study sessions' in help_text\nprint('cli help defaults passed')",
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
  curriculum: {
    level: 5,
    sequence: 5,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.cli.help_defaults", "py.cli.constraints"],
    requires: ["py.cli.file_backed"],
    usesButDoesNotTeach: ["py.argparse", "py.csv", "py.json"],
    visibleCodeConcepts: ["py.cli.help_defaults", "py.cli.constraints"],
    quizConcepts: ["py.cli.help_defaults", "py.cli.constraints"],
    proofOutputs: ["terminal_stdout"]
  }
});

cliPolishLesson.depth = {
  primaryConceptId: "py.cli.help_defaults",
  secondaryConceptIds: ["py.cli.constraints"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.cli.help_defaults",
      definition: "Adding 'description' to ArgumentParser and 'help' and 'default' properties to arguments so the command self-documents.",
      mentalModel: "Think of help and defaults as a museum guide: if you ask for directions (--help), it gives you a pamphlet. If you do not ask for anything, it guides you to the default room.",
      syntaxShape: "parser.add_argument('--format', default='text', help='Report format')",
      tinyExample: "default='text'",
      commonMistake: "Leaving flags with no descriptions, forcing the reviewer to open source files to figure out what options exist.",
      repairHint: "Pass description= to ArgumentParser, and help= to every add_argument.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.cli.constraints",
      definition: "Using the 'choices' parameter in argparse to limit flag inputs to a specific set of allowed strings.",
      mentalModel: "A turnstile: it only accepts tokens (text, json) and locks out other shapes (xml) immediately, saving you from writing validation statements later.",
      syntaxShape: "parser.add_argument('--format', choices=['text', 'json'])",
      tinyExample: "choices=['text', 'json']",
      commonMistake: "Letting any arbitrary string pass argparse, causing the script to crash inside formatting logic.",
      repairHint: "Use the choices parameter to constrain options directly at the CLI border.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-cp-1",
      label: "Polished help description",
      codeFragment: "parser = argparse.ArgumentParser(description='Summarize study sessions')",
      conceptIds: ["py.cli.help_defaults"],
      explanation: "Adds program description, which is printed at the top of the --help documentation screen.",
      learnerShouldBeAbleToSay: "We explain what the command does when help is run."
    },
    {
      id: "w-cp-2",
      label: "Restrict options",
      codeFragment: "choices=['text', 'json']",
      conceptIds: ["py.cli.constraints"],
      explanation: "Restricts the format flag. Argparse will reject format values that are not text or json.",
      learnerShouldBeAbleToSay: "Argparse handles format validations for us."
    }
  ],
  guidedEdits: [
    {
      id: "g-cp-1",
      instruction: "Add --min-minutes to build_parser. Give it a type=int, default=0, and help='Minimum minutes filter'.",
      conceptIds: ["py.cli.help_defaults"],
      targetCodeFragment: "# Add description, --input, --format, and --min-minutes.",
      expectedObservation: "The --min-minutes argument gets parsed and defaults to 0 when omitted.",
      wrongTurnHint: "Call parser.add_argument('--min-minutes', type=int, default=0) inside build_parser."
    }
  ],
  errorClinic: [
    {
      id: "e-cp-1",
      conceptIds: ["py.cli.constraints"],
      brokenExample: "parser.add_argument('--format')\n# inside logic:\n# if format == 'xml': print('bad')",
      symptom: "Program accepts invalid format names and prints generic run errors.",
      likelyCause: "Format constraints were written as manual if-statements in business logic instead of argparse choices.",
      fixStrategy: "Move validation to argparse border: parser.add_argument('--format', choices=['text', 'json'])"
    }
  ],
  codeLabBridge: {
    story: "A reviewer values tools that teach how to run them. Polishing your arguments makes your command safe and discoverable.",
    usesConcepts: ["py.cli.help_defaults", "py.cli.constraints"],
    learnerOwns: ["build_parser"],
    checkerOwns: ["cli-polish-accepts-explicit-options", "cli-polish-rejects-invalid-format"],
    runExpectation: "prints cli help defaults passed"
  },
  understandingProofPrompt: "How does argparse print flag options when choices are restricted? Copy or describe the formatting.",
  exitTicket: [
    "I know how to write self-documenting argparse command options.",
    "I understand why choices and defaults prevent configuration logic errors."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 6 — Write a Report File (run_file)
// ---------------------------------------------------------------------------

const outputFileLesson = proofLesson({
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
  language: "Python",
  tools: ["Python 3", "argparse", "output files", "terminal"],
  synopsis: "How do you save your results to a file instead of just printing them?",
  prerequisites: [
    "Know how argparse parses --input style flags.",
    "Know how the tracker calculates sessions and total minutes."
  ],
  testingFocus: "You will test that the default output path is used and that an explicit output path changes where the report is written.",
  objective: "Write the tracker summary to an output file.",
  whyItMatters: "Real tools often produce artifacts: reports, logs, exports, or machine-readable files. A saved report gives portfolio evidence beyond a terminal screenshot.",
  coreConcept: "Keep formatting separate from writing. One function should create report text, and another should save that text to the requested output path. An output path is the file location where the report should be saved.",
  workedExample: "python study_tracker.py --input sessions.csv --output summary.txt can create a file containing 2 sessions and 45 minutes.",
  guidedExercise: "Add an output argument, format the report, and save the report through a small writer function.",
  missionConnection: "This prepares the portfolio proof lesson because the CLI will now produce a durable artifact a reviewer can inspect.",
  reflectionPrompt: "Which function decides what the report says, and which function decides where the report goes?",
  practiceStarter: "import argparse\n\nsessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}]\nfiles = {}\n\n# Build parser, format report, then write to the selected output path.",
  practiceExpected: "summary.txt\n2 sessions\n45 minutes",
  practiceCheck: "If the output path changes but the report still writes to summary.txt, your writer is ignoring the parsed argument. The path should come from argparse, not from a hidden hardcoded value.",
  practiceReps: [
    {
      starterCode: "content = \"2 sessions\\n45 minutes\"\nfiles = {}\ndef write_report(path, content, files):\n    files[path] = content\n\nwrite_report(\"output.txt\", content, files)\nprint(list(files.keys()))\nprint(files[\"output.txt\"])",
      expectedOutput: "['output.txt'] with content '2 sessions\\n45 minutes'.",
      checkYourAnswer: "This replicates the write_report pattern. If the key is wrong or missing, the path argument is not being used correctly.",
      tier: "replicate"
    },
    {
      starterCode: "files = {}\ndef write_report(content):\n    path = \"summary.txt\"\n    files[path] = content\n\nwrite_report(\"session data\")\nwrite_report(\"more data\")\nprint(list(files.keys()))",
      expectedOutput: "Only one key 'summary.txt' exists — write_report ignores the caller's intent and always uses the same hardcoded path.",
      checkYourAnswer: "The path is hardcoded inside the function instead of being passed as a parameter. Add a path parameter and use it instead of the hardcoded string.",
      tier: "diagnose"
    },
    {
      starterCode: "# Write a function format_report(sessions) that returns a string\n# Sessions: [{\"topic\": \"python\", \"minutes\": 30}, ...]\n# Format: \"{count} sessions\\n{total} minutes\"\n# Then write write_report(path, content, files) that stores content in dict\n\nsessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}]\nfiles = {}\n# Your format_report and write_report code here\n\nprint(list(files.keys()))\nif files:\n    path = list(files.keys())[0]\n    print(files[path])",
      expectedOutput: "A report key in the files dict containing '2 sessions\\n45 minutes'.",
      checkYourAnswer: "format_report should sum minutes across all sessions. If the total is wrong, check that int conversion is done before summing.",
      tier: "synthesize"
    }
  ],
  miniTitle: "Save a tracker summary file",
  miniGoal: "Add output-file behavior so the tracker creates a durable report artifact.",
  miniSteps: ["Add --output with a default of summary.txt", "Create report text from sessions", "Write the report through a function that receives the output path"],
  miniDeliverables: [
    "Argparse output option",
    "Report formatter",
    "Saved report check"
  ],
  verifierCommand: "python study_tracker.py --input sessions.csv --output summary.txt",
  expectedEvidence: "Command output plus the contents of summary.txt showing session count and total minutes.",
  projectConnection: "This gives CLI Study Tracker an inspectable artifact for portfolio evidence.",
  requiredCodeIncludes: ["--output", "format_report", "write_report", "summary.txt"],
  requiredOutputIncludes: ["summary.txt", "2 sessions", "45 minutes", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "import argparse\n\nsessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}]\nfiles = {}\n\ndef build_parser():\n    parser = argparse.ArgumentParser(prog=\"study_tracker\")\n    parser.add_argument('--output', default='summary.txt')\n    return parser\n\ndef format_report(sessions):\n    total_minutes = sum(s[\"minutes\"] for s in sessions)\n    return f\"{len(sessions)} sessions\\n{total_minutes} minutes\"\n\ndef write_report(path, content, files):\n    files[path] = content\n\nparsed = build_parser().parse_args([])\nreport = format_report(sessions)\nwrite_report(parsed.output, report, files)\nprint(parsed.output)\nprint(files.get(parsed.output, \"\"))",
  runnerTestCode: "assert parsed.output == 'summary.txt'\nassert report == '2 sessions\\n45 minutes'\nassert files['summary.txt'] == report\nprint('summary.txt 2 sessions 45 minutes passed')",
  hiddenTests: [
    {
      id: "writes-explicit-report-path",
      name: "Writes explicit report artifact path",
      code: "other_files = {}\nother = build_parser().parse_args(['--output', 'reports/week-1.txt'])\nwrite_report(other.output, report, other_files)\nassert other_files['reports/week-1.txt'] == '2 sessions\\n45 minutes'"
    }
  ],
  curriculum: {
    level: 5,
    sequence: 6,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.file.output", "py.cli.artifacts"],
    requires: ["py.cli.file_backed"],
    usesButDoesNotTeach: ["py.argparse"],
    visibleCodeConcepts: ["py.file.output", "py.cli.artifacts"],
    quizConcepts: ["py.file.output", "py.cli.artifacts"],
    proofOutputs: ["terminal_stdout"]
  }
});

outputFileLesson.depth = {
  primaryConceptId: "py.file.output",
  secondaryConceptIds: ["py.cli.artifacts"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.file.output",
      definition: "Using open() with the write mode ('w') to save text strings to files on disk.",
      mentalModel: "Think of output writing as stamping text into wet cement: once written, it remains in the file until you clear or overwrite the block.",
      syntaxShape: "with open(path, 'w') as file:\n    file.write(content)",
      tinyExample: "with open('out.txt', 'w') as f: f.write('done')",
      commonMistake: "Mixing formatting logic directly into the write statement, making it hard to test how the report looks without writing to disk.",
      repairHint: "Write a function that formats the report as a string, then pass that string to write_report().",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.cli.artifacts",
      definition: "Generating a reviewable file on disk that contains command summaries, proving the command ran.",
      mentalModel: "A receipt: printing a summary in the terminal is fine, but leaving a receipt file behind gives inspectors permanent proof.",
      syntaxShape: "python cli.py --output summary.txt",
      tinyExample: "--output summary.txt",
      commonMistake: "Hardcoding 'summary.txt' inside write_report, ignoring --output flag user overrides.",
      repairHint: "Fetch the output path from args.output and pass it to write_report.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-fo-1",
      label: "Map output flag",
      codeFragment: "parser.add_argument('--output', default='summary.txt')",
      conceptIds: ["py.cli.artifacts"],
      explanation: "Declares an output path flag. Defaults to summary.txt when omitted.",
      learnerShouldBeAbleToSay: "Reviewers get summary.txt automatically unless they specify otherwise."
    },
    {
      id: "w-fo-2",
      label: "Safe write block",
      codeFragment: "with open(path, 'w') as f:\n    f.write(content)",
      conceptIds: ["py.file.output"],
      explanation: "Context manager opens the path in write mode ('w'), wiping prior contents and saving the string.",
      learnerShouldBeAbleToSay: "We overwrite the summary file with fresh calculations."
    }
  ],
  guidedEdits: [
    {
      id: "g-fo-1",
      instruction: "Implement format_report so it returns '{len(sessions)} sessions\\n{total_minutes} minutes'.",
      conceptIds: ["py.file.output"],
      targetCodeFragment: "def format_report(sessions):\n    return \"\"",
      expectedObservation: "The output file contains the formatted multi-line summary string.",
      wrongTurnHint: "Sum minutes from sessions list, then format a string with two lines."
    }
  ],
  errorClinic: [
    {
      id: "e-fo-1",
      conceptIds: ["py.file.output"],
      brokenExample: "def save(content):\n    with open('summary.txt', 'w') as f:\n        f.write(content)",
      symptom: "Changing the --output flag does not change where the report is written.",
      likelyCause: "The path parameter is missing from the function, causing it to use a hardcoded string.",
      fixStrategy: "Pass the path: def save(path, content):\n    with open(path, 'w') as f:"
    }
  ],
  codeLabBridge: {
    story: "A terminal line disappears when the terminal is closed. Writing report files leaves a durable artifact for evidence validation.",
    usesConcepts: ["py.file.output", "py.cli.artifacts"],
    learnerOwns: ["format_report", "write_report"],
    checkerOwns: ["writes-explicit-report-path"],
    runExpectation: "prints summary.txt 2 sessions 45 minutes passed"
  },
  understandingProofPrompt: "What happens to the existing content of summary.txt if you open it with mode='w'?",
  exitTicket: [
    "I know how to write files using context managers in write mode.",
    "I can separate string formatting from file I/O operations."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 7 — Report Bad Rows Clearly (run_file)
// ---------------------------------------------------------------------------

const rejectedRowReportLesson = proofLesson({
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
  language: "Python",
  tools: ["Python 3", "CSV-like rows", "rejected-row report", "terminal"],
  synopsis: "Your parser cleaned 990 of 1000 rows. How do you tell the user which 10 failed?",
  prerequisites: [
    "Know how to parse a comma-separated row.",
    "Know why non-numeric minutes should be rejected clearly."
  ],
  testingFocus: "You will test accepted rows, rejected rows, row numbers, reasons, and the final human-readable rejected-row report.",
  objective: "Produce a clear rejected-row report for messy input.",
  whyItMatters: "A CLI that silently drops bad rows teaches the user nothing and corrupts trust. A rejected-row report preserves evidence while letting valid rows continue.",
  coreConcept: "A rejected row is an input row your program refuses to use because something is wrong. A rejection record should include row number, raw row, and reason. That gives a learner enough context to fix the data without guessing.",
  workedExample: "row 2: expected 3 columns -> bad-row is more useful than simply saying invalid input.",
  guidedExercise: "Parse mixed rows, keep accepted records, build a rejected-row report, and prove both sides are inspectable.",
  missionConnection: "This deepens the Study Data Cleaner mission and makes the tracker safer for real user-created files.",
  reflectionPrompt: "Which bad row should stop the whole program, and which bad row can be reported while the clean rows still succeed?",
  practiceStarter: "ROWS = [\n    \"2026-05-07,python,30\",\n    \"bad-row\",\n    \"2026-05-08,git,soon\",\n    \"2026-05-09,sql,20\",\n]\n\n# Parse accepted rows and build a rejected-row report.",
  practiceExpected: "2 accepted\nrow 2: expected 3 columns -> bad-row\nrow 3: minutes must be a number -> 2026-05-08,git,soon",
  practiceCheck: "If the report does not include row numbers and raw rows, the user still has to hunt through the file to fix the data. A good error report points to the fix.",
  practiceReps: pythonRejectedRowPracticeReps,
  miniTitle: "Create a rejected-row report",
  miniGoal: "Build parser behavior that keeps valid rows and writes a clear report for rejected rows.",
  miniSteps: ["Return accepted and rejected collections", "Record row_number, raw row, and reason for each rejection", "Format the rejected rows into a report"],
  miniDeliverables: [
    "parse_rows function",
    "build_rejected_report function",
    "Rejected-row report output"
  ],
  verifierCommand: "python clean_sessions.py samples/messy_sessions.csv --rejected rejected_rows.txt",
  expectedEvidence: "Output showing accepted rows plus rejected_rows.txt content with row numbers, reasons, and raw bad rows.",
  projectConnection: "This is the evidence-quality upgrade for the Study Data Cleaner mission.",
  requiredCodeIncludes: ["parse_rows", "rejected", "row_number", "reason", "build_rejected_report"],
  requiredOutputIncludes: ["row 2", "expected 3 columns", "row 3", "minutes must be a number", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "ROWS = [\n    \"2026-05-07,python,30\",\n    \"bad-row\",\n    \"2026-05-08,git,soon\",\n    \"2026-05-09,sql,20\",\n]\n\ndef parse_rows(rows):\n    accepted = []\n    rejected = []\n    for idx, row in enumerate(rows, start=1):\n        parts = row.strip().split(',')\n        if len(parts) != 3:\n            rejected.append({'row_number': idx, 'row': row, 'reason': 'expected 3 columns'})\n        else:\n            try:\n                minutes = int(parts[2])\n                accepted.append({'date': parts[0], 'topic': parts[1], 'minutes': minutes})\n            except ValueError:\n                rejected.append({'row_number': idx, 'row': row, 'reason': 'minutes must be a number'})\n    return accepted, rejected\n\ndef build_rejected_report(rejected):\n    if not rejected:\n        return 'no rejected rows'\n    lines = []\n    for r in rejected:\n        lines.append(f\"row {r['row_number']}: {r['reason']} -> {r['row']}\")\n    return '\\n'.join(lines)\n\naccepted, rejected = parse_rows(ROWS)\nreport = build_rejected_report(rejected)\nprint(f\"{len(accepted)} accepted\")\nprint(report)",
  runnerTestCode: "assert len(accepted) == 2\nassert accepted[0]['topic'] == 'python'\nassert accepted[1]['minutes'] == 20\nassert rejected == [\n    {'row_number': 2, 'row': 'bad-row', 'reason': 'expected 3 columns'},\n    {'row_number': 3, 'row': '2026-05-08,git,soon', 'reason': 'minutes must be a number'},\n]\nassert 'row 2: expected 3 columns -> bad-row' in report\nassert 'row 3: minutes must be a number -> 2026-05-08,git,soon' in report\nprint('row 2 row 3 rejected report passed')",
  hiddenTests: [
    {
      id: "rejected-report-empty-state",
      name: "Rejected report has a useful empty state",
      code: "clean_rows = ['2026-05-07,python,30']\nclean_accepted, clean_rejected = parse_rows(clean_rows)\nassert len(clean_accepted) == 1\nassert clean_rejected == []\nassert build_rejected_report(clean_rejected) == 'no rejected rows'"
    }
  ],
  curriculum: {
    level: 5,
    sequence: 7,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.report.rejections", "py.report.row_numbers"],
    requires: ["py.file.input"],
    visibleCodeConcepts: ["py.report.rejections", "py.report.row_numbers"],
    quizConcepts: ["py.report.rejections", "py.report.row_numbers"],
    proofOutputs: ["terminal_stdout"]
  }
});

rejectedRowReportLesson.depth = {
  primaryConceptId: "py.report.rejections",
  secondaryConceptIds: ["py.report.row_numbers"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.report.rejections",
      definition: "Collecting and writing malformed inputs to a dedicated log or rejected file instead of crashing or silently ignoring them.",
      mentalModel: "Think of sorting mail: letters with correct addresses go to delivery bags (accepted), while illegible letters go to a special box with a sticky note explaining the problem.",
      syntaxShape: "rejected.append({'row': row, 'reason': '...' })",
      tinyExample: "rejected = [{'row_number': 2, 'row': 'bad', 'reason': 'columns'}]",
      commonMistake: "Silently ignoring bad rows, which hides data issues from the user and makes reports deceptively clean.",
      repairHint: "Return a second collection (rejected) from your parser and write it to a separate log file.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.report.row_numbers",
      definition: "Tracking and outputting 1-based spreadsheet row indexes for rejected rows so users can easily find them in editor.",
      mentalModel: "A map coordinate: telling someone 'there is a typo in your file' is useless. Telling them 'check line 7' allows them to open the editor and fix it immediately.",
      syntaxShape: "for row_number, row in enumerate(rows, start=1):",
      tinyExample: "enumerate(rows, start=1)",
      commonMistake: "Using 0-based indexing (row 0), which confuses non-programmers looking at text editors.",
      repairHint: "Set start=1 in enumerate() to match standard spreadsheet editor view numbers.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-rr-1",
      label: "Enumerate 1-indexed rows",
      codeFragment: "for row_number, row in enumerate(rows, start=1):",
      conceptIds: ["py.report.row_numbers"],
      explanation: "Iterates through rows. Setting start=1 aligns row numbers with text editor line numbers.",
      learnerShouldBeAbleToSay: "We count lines starting at 1 so users can locate errors."
    },
    {
      id: "w-rr-2",
      label: "Format rejection line",
      codeFragment: "f'row {r[\"row_number\"]}: {r[\"reason\"]} -> {r[\"row\"]}'",
      conceptIds: ["py.report.rejections"],
      explanation: "Assembles the rejection report line with line number, explanation, and raw string.",
      learnerShouldBeAbleToSay: "We write out where the error is, why it failed, and what was read."
    }
  ],
  guidedEdits: [
    {
      id: "g-rr-1",
      instruction: "Implement build_rejected_report so it returns 'no rejected rows' if the list is empty.",
      conceptIds: ["py.report.rejections"],
      targetCodeFragment: "def build_rejected_report(rejected):\n    return \"\"",
      expectedObservation: "A clean run produces the string 'no rejected rows' instead of an empty file.",
      wrongTurnHint: "Check if the rejected list is empty. If so, return 'no rejected rows'."
    }
  ],
  errorClinic: [
    {
      id: "e-rr-1",
      conceptIds: ["py.report.row_numbers"],
      brokenExample: "for index, row in enumerate(rows):\n    # row_number = index",
      symptom: "Rejection report lists line numbers that are 1 line off from the spreadsheet editor.",
      likelyCause: "Forgot start=1 in enumerate(), leading to 0-based counting.",
      fixStrategy: "Change definition: for row_number, row in enumerate(rows, start=1):"
    }
  ],
  codeLabBridge: {
    story: "A professional tool is helpful when inputs are messy. Building a rejected-row report preserves data audit trails.",
    usesConcepts: ["py.report.rejections", "py.report.row_numbers"],
    learnerOwns: ["parse_rows", "build_rejected_report"],
    checkerOwns: ["rejected-report-has-empty-state"],
    runExpectation: "prints row 2 row 3 rejected report passed"
  },
  understandingProofPrompt: "Why do we include the raw bad row string in the rejection report, instead of only listing the line number?",
  exitTicket: [
    "I can use enumerate(start=1) to track spreadsheet-friendly line coordinates.",
    "I know how to format a rejected-row report that lists errors separate from clean counts."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 8 — Package Python Work As Proof (concept_only)
// ---------------------------------------------------------------------------

const portfolioProofLesson = proofLesson({
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
  evidencePrompt: "Capture the terminal output of your running script, README status, check output, and reflection.",
  language: "Python plus Markdown",
  tools: ["README", "Git", "test output"],
  synopsis: "You've built a real CLI tool. How do you prove it works to someone who's hiring?",
  prerequisites: [
    "Have a small Python script or mission repo.",
    "Have at least one command that runs or tests the work."
  ],
  testingFocus: "You will test the project by recording exact run or test output, then explain known limits instead of only saying it works.",
  objective: "Package a Python practice script so a reviewer can inspect it quickly.",
  whyItMatters: "Portfolio proof is not the code alone; it is code plus setup, verification, and honest scope.",
  coreConcept: "A README is the project note a reviewer reads first. A reviewer-friendly README answers what the project does, how to run it, how it was verified, and what remains unfinished.",
  workedExample: "README sections: Problem, Run, Verify, Sample Output, Known Gaps.",
  guidedExercise: "Update one Python mission README and record the exact check output in CareerForge evidence.",
  missionConnection: "This unlocks mission completion for CLI Study Tracker and improves readiness through evidence quality.",
  reflectionPrompt: "What would a reviewer still be unable to verify from your README?",
  practiceStarter: "## Verify\n\n```bash\npython -m pytest\n```\n\nExpected result:\n```text\n2 passed\n```\n\n## Known gaps\n- Sample data is small.\n- No date-range filtering yet.",
  practiceExpected: "The README tells a reviewer what command to run, what result to expect, and what limitation is still honest.",
  practiceCheck: "Your proof is ready when someone can run the command without asking you what file, input, or output to inspect. Known gaps are not a weakness; they show honest scope.",
  practiceReps: [
    {
      starterCode: "readme = \"\"\"## Study Tracker\nA CLI tool that reads CSV session logs and prints summary reports.\n\n## Run\npython study_tracker.py --input sessions.csv\n\n## Verify\npython -m pytest\n\n## Known gaps\n- No date range filtering\n- Sample data is small\n\"\"\"\nprint(readme)",
      expectedOutput: "README with Run, Verify, and Known gaps sections clearly separated.",
      checkYourAnswer: "A good README tells the reviewer what the project does and exactly how to verify it. If any section is missing, the reviewer has to guess.",
      tier: "replicate"
    },
    {
      starterCode: "readme = \"\"\"## Study Tracker\nA CLI tool.\n\n## Run\npython study_tracker.py\n\n## Verify\nThe code works.\n\"\"\"\nproblems = []\nif \"## Known gaps\" not in readme:\n    problems.append(\"Missing known gaps section\")\nif \"sessions.csv\" not in readme:\n    problems.append(\"Missing example command with input file\")\nprint(problems)",
      expectedOutput: "['Missing known gaps section', 'Missing example command with input file'] — two issues diagnosed in the README.",
      checkYourAnswer: "Saying 'The code works' is not a verify command. A reviewer needs the exact command and expected output to confirm the project functions correctly.",
      tier: "diagnose"
    },
    {
      starterCode: "# Write a README section for your Study Tracker CLI.\n# Include:\n# - What the project does\n# - How to run it (with exact command)\n# - How to verify it works\n# - One honest known gap\n\nreadme = \"\"\nprint(readme)",
      expectedOutput: "A coherent README with run instructions, verify steps, and a known gap that helps the reviewer understand the project boundaries.",
      checkYourAnswer: "The README should let someone who has never seen the project run it successfully on the first try. If the command is missing the --input flag, the reviewer will get errors.",
      tier: "synthesize"
    }
  ],
  miniTitle: "Package a Python proof README",
  miniGoal: "Turn one Python script into a reviewer-friendly artifact with run steps and honest limits.",
  miniSteps: ["Add Problem, Run, Verify, Sample Output, and Known Gaps sections", "Paste exact check output", "Name one limitation you would fix next"],
  miniDeliverables: [
    "Updated README",
    "Check output",
    "Known-gaps note"
  ],
  verifierCommand: "python -m pytest",
  expectedEvidence: "README excerpt plus the exact check output recorded in CareerForge evidence.",
  projectConnection: "This upgrades CLI Study Tracker or Study Data Cleaner toward portfolio readiness.",
  requiredCodeIncludes: ["## Verify", "## Known gaps"],
  requiredOutputIncludes: ["passed"],
  runnerLanguage: "javascript",
  runnerStarterCode: "const readme = `## Verify\npython -m pytest\n2 passed\n\n## Known gaps\nSample data is small.`;",
  runnerTestCode: "if (!readme.includes('## Verify')) throw new Error('missing Verify section');\nif (!readme.includes('## Known gaps')) throw new Error('missing Known gaps section');\nif (!readme.includes('passed')) throw new Error('missing passing output');\nconsole.log('passed README proof');",
  hiddenTests: [],
  curriculum: {
    level: 5,
    sequence: 8,
    version: "1.0.0",
    lessonKind: "concept_only",
    teaches: ["py.proof.readme", "py.proof.gaps"],
    requires: ["py.cli.file_backed"],
    visibleCodeConcepts: ["py.proof.readme", "py.proof.gaps"],
    quizConcepts: ["py.proof.readme", "py.proof.gaps"],
    usesButDoesNotTeach: ["py.csv"],
    proofOutputs: ["terminal_stdout"]
  }
});

portfolioProofLesson.depth = {
  primaryConceptId: "py.proof.readme",
  secondaryConceptIds: ["py.proof.gaps"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.proof.readme",
      definition: "Structuring a markdown README with clear execution instructions, verification commands, and expected outputs.",
      mentalModel: "Think of a README as assembly instructions for a desk. It lists what parts you need, what tools to run, and what the finished desk looks like.",
      syntaxShape: "Markdown text starting with ## headings",
      tinyExample: "## Verify\n`python -m pytest`",
      commonMistake: "Leaving out the verification commands or expected run results, forcing reviewers to guess how to test the code.",
      repairHint: "Always paste the exact shell command and expected output into a ## Verify block.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.proof.gaps",
      definition: "Explicitly declaring known constraints, skipped features, or code limitations within project documentation.",
      mentalModel: "Honesty: declaring that a desk is only rated for 50 pounds prevents someone from putting an anvil on it and blaming you when it collapses.",
      syntaxShape: "## Known gaps\n- List items",
      tinyExample: "## Known gaps\n- CSV headers are skipped",
      commonMistake: "Pretending the code handles every edge case, which loses trust when a reviewer easily breaks it.",
      repairHint: "Document what your code does not do in a ## Known gaps section.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-pr-1",
      label: "Verify Section",
      codeFragment: "## Verify\n```bash\npython study_tracker.py --input sessions.csv\n```",
      conceptIds: ["py.proof.readme"],
      explanation: "Documents the exact command the reviewer should run to test the CLI tool.",
      learnerShouldBeAbleToSay: "We show the reviewer how to confirm the CLI works."
    },
    {
      id: "w-pr-2",
      label: "Honest Limitations",
      codeFragment: "## Known gaps\n- Non-numeric minutes are rejected but not logged.",
      conceptIds: ["py.proof.gaps"],
      explanation: "Explains what boundaries the code currently leaves for future improvements.",
      learnerShouldBeAbleToSay: "We state the boundaries of what this version can handle."
    }
  ],
  guidedEdits: [
    {
      id: "g-pr-1",
      instruction: "Add a paragraph under Problem explaining who the tool is for: 'A local CLI for student study sessions.'",
      conceptIds: ["py.proof.readme"],
      targetCodeFragment: "const readme =",
      expectedObservation: "The target audience statement appears in the README.",
      wrongTurnHint: "Insert the sentence at the top of the readme string."
    }
  ],
  errorClinic: [
    {
      id: "e-pr-1",
      conceptIds: ["py.proof.readme"],
      brokenExample: "## Verify\nRun the python script.",
      symptom: "Reviewer gets import errors or is unable to reproduce passing state.",
      likelyCause: "The description is too vague and lacks the exact terminal command line.",
      fixStrategy: "Provide the exact command line: ## Verify\n`python study_tracker.py --input sessions.csv`"
    }
  ],
  codeLabBridge: {
    story: "A reviewer evaluates many projects. A readme that makes commands copy-pasteable gets reviewed first.",
    usesConcepts: ["py.proof.readme", "py.proof.gaps"],
    learnerOwns: [],
    checkerOwns: [],
    runExpectation: "prints passed README proof"
  },
  understandingProofPrompt: "How does declaring known gaps in your project documentation improve your credibility as an engineer?",
  exitTicket: [
    "I know how to write execution guides with copy-pasteable shell commands.",
    "I can identify and write down honest limits for my code blocks."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 9 — Core Proof Review Gate (concept_only)
// ---------------------------------------------------------------------------

const coreReviewLesson = proofLesson({
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
  language: "Python project review",
  tools: ["CLI output", "rejected-row report", "review note"],
  synopsis: "Before moving to professional Python — does your tool actually work start to finish?",
  prerequisites: [
    "Have completed the core Python CLI lessons.",
    "Have at least one command and one failure case to inspect."
  ],
  testingFocus: "You will test that your review includes architecture, commands, failure diagnosis, and one improvement. Failure diagnosis means naming what went wrong and what evidence showed it.",
  objective: "Review the core tracker as a working beginner CLI project.",
  whyItMatters: "A professor would not pass the module only because each lesson was tapped. You should be able to explain the project, run it, inspect failure behavior, and improve one weak spot.",
  coreConcept: "A good review note has four parts: architecture, commands, failure inspection, and improvement. Architecture means the main parts of the project and what each part is responsible for.",
  workedExample: "Architecture: CLI parses flags, parser reads rows, reports format output. Commands: --help and --input. Failure: bad minutes are rejected with a reason.",
  guidedExercise: "Build a review checklist that proves the core module is ready for professional restructuring.",
  missionConnection: "This is the transition checkpoint before Professional Python Utility.",
  reflectionPrompt: "Which part of your tracker would a reviewer understand fastest, and which part would they question first?",
  practiceStarter: "review = {\n    'architecture': '',\n    'commands': [],\n    'failure_inspection': '',\n    'improvement': '',\n}\nprint(review)",
  practiceExpected: "architecture, commands, failure_inspection, improvement all filled with concrete evidence",
  practiceCheck: "If the review could describe any project, it is too vague. Include specific tracker commands, specific output, and specific failure behavior.",
  practiceReps: pythonCoreReviewPracticeReps,
  miniTitle: "Complete the Core Proof Review",
  miniGoal: "Create a review artifact that proves the core Python module is understood, runnable, and improvable.",
  miniSteps: ["Explain the tracker architecture", "List proof commands and outputs", "Inspect one failure case", "Choose one improvement with a reason"],
  miniDeliverables: [
    "Architecture explanation",
    "Command evidence",
    "Failure diagnosis",
    "Improvement note"
  ],
  verifierCommand: "python study_tracker.py --help && python study_tracker.py --input sessions.csv --output summary.txt",
  expectedEvidence: "A review note containing concrete commands, output, one failure explanation, and one improvement decision.",
  projectConnection: "This review gate confirms readiness for the Professional Python Utility module.",
  requiredCodeIncludes: ["architecture", "commands", "failure_inspection", "improvement"],
  requiredOutputIncludes: ["architecture", "commands", "failure", "improvement", "passed"],
  runnerLanguage: "python",
  runnerStarterCode: "review = {\n    'architecture': 'CLI coordinates, parser splits rows, report prints stats.',\n    'commands': ['python study_tracker.py --help', 'python study_tracker.py --input sessions.csv'],\n    'failure_inspection': 'Invalid minutes are rejected with an error key.',\n    'improvement': 'Add parser unit tests for missing columns.',\n}\nprint(review)",
  runnerTestCode: "assert 'CLI' in review['architecture'] or 'parser' in review['architecture']\nassert any('--help' in command for command in review['commands'])\nassert any('--input' in command for command in review['commands'])\nassert len(review['failure_inspection']) >= 20\nassert len(review['improvement']) >= 20\nprint('architecture commands failure improvement passed')",
  hiddenTests: [
    {
      id: "core-review-improvement-is-specific",
      name: "Core review improvement names a concrete target",
      code: "assert any(term in review['improvement'].lower() for term in ['parser', 'report', 'cli', 'test', 'error'])"
    }
  ],
  curriculum: {
    level: 5,
    sequence: 9,
    version: "1.0.0",
    lessonKind: "concept_only",
    teaches: ["py.gate.review", "py.gate.architecture"],
    requires: ["py.proof.readme"],
    usesButDoesNotTeach: ["py.csv"],
    visibleCodeConcepts: ["py.gate.review", "py.gate.architecture"],
    quizConcepts: ["py.gate.review", "py.gate.architecture"],
    proofOutputs: ["terminal_stdout"]
  }
});

coreReviewLesson.depth = {
  primaryConceptId: "py.gate.review",
  secondaryConceptIds: ["py.gate.architecture"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.gate.review",
      definition: "Performing a review of your own code from a maintainer's perspective, verifying command outputs and error behaviors.",
      mentalModel: "An audit: instead of saying 'it works because I wrote it', you check off exact items on a audit sheet (run logs, test suite, readme commands) to prove it.",
      syntaxShape: "A review dictionary or structured document checklist",
      tinyExample: "'failure_inspection': 'bad row gives error'",
      commonMistake: "Tapping complete without compiling a summary of what the code does or listing limits, leaving no proof for reviewers.",
      repairHint: "Write a checklist covering architecture, run commands, one bad input case, and one improvement.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.gate.architecture",
      definition: "Describing how modules interface: how argument flags route to CSV reads, which convert to records, which feed summary formatting.",
      mentalModel: "A blueprint: it shows how the rooms (functions) connect (pass data) without describing what color the wallpaper is.",
      syntaxShape: "Text description of data flow pathways",
      tinyExample: "'CLI -> CSV Reader -> parser -> reporter'",
      commonMistake: "Describing syntax rules ('I used variables and loops') instead of describing module boundaries and data flow.",
      repairHint: "Trace how raw terminal text becomes parsed data and then formatted output.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-cr-1",
      label: "Review Structure",
      codeFragment: "'architecture': 'argparse handles CLI flags, forwarding to read_sessions for parsing'",
      conceptIds: ["py.gate.architecture"],
      explanation: "Explains how data flows from CLI arguments to file reads.",
      learnerShouldBeAbleToSay: "We show we understand the pipeline components and roles."
    },
    {
      id: "w-cr-2",
      label: "Proof Command",
      codeFragment: "'commands': ['python study_tracker.py --input sessions.csv']",
      conceptIds: ["py.gate.review"],
      explanation: "Provides the exact command used to verify the program is functional.",
      learnerShouldBeAbleToSay: "This is the entry point command we audited."
    }
  ],
  guidedEdits: [
    {
      id: "g-cr-1",
      instruction: "Add 'test_parse_valid_row' command to the review commands list to document unit testing.",
      conceptIds: ["py.gate.review"],
      targetCodeFragment: "review = {",
      expectedObservation: "The test command appears inside the documented commands list.",
      wrongTurnHint: "Add 'pytest tests/test_parser.py' to the commands array."
    }
  ],
  errorClinic: [
    {
      id: "e-cr-1",
      conceptIds: ["py.gate.review"],
      brokenExample: "review = {\n    'architecture': 'I wrote Python code.'\n}",
      symptom: "Review is rejected as too generic or lacking module boundaries.",
      likelyCause: "Explaining language selection instead of describing the project's data flow.",
      fixStrategy: "Rewrite to trace data flow: CLI inputs -> parser logic -> file writing."
    }
  ],
  codeLabBridge: {
    story: "A review gate ensures you look back at the path before moving forward. Explain the design before modularizing it.",
    usesConcepts: ["py.gate.review", "py.gate.architecture"],
    learnerOwns: [],
    checkerOwns: [],
    runExpectation: "prints architecture commands failure improvement passed"
  },
  understandingProofPrompt: "Why does explaining your project's architecture make it easier to modularize the code into separate files later?",
  exitTicket: [
    "I can describe the data flow from terminal flags down to reports.",
    "I know how to write a project audit containing run commands and limitations."
  ]
};


// ---------------------------------------------------------------------------
// Level 5 Quizzes
// ---------------------------------------------------------------------------

export const level5Quizzes: Quiz[] = [
  codeReadingQuiz(
    "quiz-python-file-input",
    "lesson-python-file-input",
    "File input checkpoint",
    'a, r = parse_rows(["2026-05-07,python,30"])\nprint(len(a), len(r))',
    "parser separation",
    "1 0",
    "0 1",
    "1 1",
    "The valid 3-field row passes parsing so one row is accepted and zero are rejected.",
    ["py.parser.separation"]
  ),
  codeReadingQuiz(
    "quiz-python-parser-tests",
    "lesson-python-parser-tests",
    "Parser test checkpoint",
    'def test_rejects_bad_minutes():\n    result = parse_row("2026-05-07,python,soon")\n    assert result["error"] == "minutes must be a number"',
    "test failures",
    "That non-numeric minutes produce the expected error message",
    "That the parser works correctly on valid rows",
    "That the test will fail silently",
    "The test proves the parser rejects invalid minutes with the correct error message.",
    ["py.test.failures"]
  ),
  codeReadingQuiz(
    "quiz-python-cli-arguments",
    "lesson-python-cli-arguments",
    "CLI arguments checkpoint",
    'parsed = parse_cli(["--topic", "git", "--minutes", "15"])\nprint(parsed["topic"])',
    "cli arguments",
    "git",
    "python",
    "15",
    "The argparse parser extracts 'git' from the --topic argument flag.",
    ["py.cli.arguments"]
  ),
  codeReadingQuiz(
    "quiz-python-file-backed-cli",
    "lesson-python-file-backed-cli",
    "File-backed CLI checkpoint",
    'def read_sessions(csv_text):\n    f = StringIO(csv_text.strip())\n    reader = csv.DictReader(f)\n    sessions = []\n    for row in reader:\n        sessions.append({"topic": row["topic"], "minutes": int(row["minutes"])})\n    return sessions',
    "cli file backed",
    "It parses CSV text into session dictionaries with numeric minutes",
    "It reads a file from disk and returns session dictionaries",
    "It writes sessions to a CSV file",
    "The function reads CSV text from a string, not a file, converting each row into a session dictionary with int minutes.",
    ["py.cli.file_backed"]
  ),
  codeReadingQuiz(
    "quiz-python-cli-polish",
    "lesson-python-cli-polish",
    "CLI polish checkpoint",
    'parser.add_argument("--format",\n    choices=["text", "json"],\n    default="text")',
    "cli constraints",
    "It restricts --format to text or json with a default of text",
    "It allows any string value for --format",
    "It rejects the --format flag entirely",
    "The choices parameter tells argparse to reject any value not in the list, while default provides a fallback.",
    ["py.cli.constraints"]
  ),
  codeReadingQuiz(
    "quiz-python-output-file",
    "lesson-python-output-file",
    "Output file checkpoint",
    'with open(path, "w") as f:\n    f.write(content)',
    "file output",
    "It opens a file for writing, overwriting existing content",
    "It reads a file from disk",
    "It appends content to an existing file",
    "The 'w' mode opens the file for writing and overwrites any existing content in the file.",
    ["py.file.output"]
  ),
  codeReadingQuiz(
    "quiz-python-rejected-row-report",
    "lesson-python-rejected-row-report",
    "Rejected-row report checkpoint",
    'rejected = [{"row_number": 2, "reason": "expected 3 columns"}]\nprint(f"row {rejected[0][\'row_number\']}: {rejected[0][\'reason\']}")',
    "report rejections",
    "row 2: expected 3 columns",
    "row 1: expected 3 columns",
    "row 2: bad input",
    "The f-string formats the row_number and reason into a human-readable rejection line.",
    ["py.report.row_numbers"]
  ),
  codeReadingQuiz(
    "quiz-python-portfolio-proof",
    "lesson-python-portfolio-proof",
    "Portfolio proof checkpoint",
    '## Verify\n\npython -m pytest\n\nExpected:\n2 passed',
    "proof readme",
    "A section telling reviewers how to verify the project works",
    "A section listing the project author",
    "A section hiding test output",
    "The Verify section documents the exact command and expected output a reviewer should run to confirm the project works.",
    ["py.proof.readme"]
  ),
  codeReadingQuiz(
    "quiz-python-core-review",
    "lesson-python-core-review",
    "Core review checkpoint",
    'review = {\n    "architecture": "CLI -> parser -> report",\n    "commands": ["--help", "--input sessions.csv"]\n}',
    "gate review",
    "The project's data flow architecture and verification commands",
    "The project's test coverage statistics",
    "The project's file count",
    "The review names how data flows through the program and the commands used to verify behavior.",
    ["py.gate.architecture"]
  ),
  codeReadingQuiz(
    "quiz-python-import",
    "lesson-python-import",
    "Import statement checkpoint",
    'import json\ndata = json.loads(\'{"topic": "python"}\')\nprint(data["topic"])',
    "import",
    "Prints the string python from the parsed JSON dictionary",
    "Prints the raw JSON text unchanged",
    "Throws a NameError because import is misspelled",
    "json.loads() converts a JSON string into a Python dictionary, so printing data[\"topic\"] gives the value 'python'.",
    ["py.import"]
  ),
];

export const level5Lessons: Lesson[] = [
  pythonImportLesson,
  fileInputLesson,
  parserTestsLesson,
  cliArgumentsLesson,
  fileBackedCliLesson,
  cliPolishLesson,
  outputFileLesson,
  rejectedRowReportLesson,
  portfolioProofLesson,
  coreReviewLesson
];
