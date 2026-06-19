import type { Lesson, Quiz } from "@/domain/types";
import { proofLesson, checkpointQuiz } from "./shared";

// ---------------------------------------------------------------------------
// Micro-lesson 1 — Read a Traceback (concept_only)
// ---------------------------------------------------------------------------

const readTracebackLesson = proofLesson({
  id: "lesson-python-read-traceback",
  moduleId: "module-python-core",
  slug: "python-read-traceback",
  title: "Read a Traceback",
  summary: "Learn to read Python's error report so you know where to look and what went wrong.",
  bodyMarkdown: "A traceback is Python's error log. It lists the call chain that led to the failure, ending with the exception name and a short message. The last two lines are almost always the most useful: they show where the error occurred and what kind of error it was.",
  estimatedMinutes: 4,
  difficulty: "foundation",
  skillIds: ["skill-python-basics", "skill-testing-debugging"],
  quizId: "quiz-python-read-traceback",
  desktopTask: "Deliberately trigger a NameError and read the traceback, identifying the file name, line number, and exception type.",
  evidencePrompt: "Write down the last two lines of the traceback and explain what each part means.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "You are learning to treat a traceback as information, not panic.",
  prerequisites: [
    "Have run at least one Python file that produced output.",
    "Understand how to run files in the terminal."
  ],
  testingFocus: "Trigger an error deliberately and read the three key parts of the traceback.",
  objective: "Identify the file, line number, and exception type from a Python traceback.",
  whyItMatters: "Every beginner sees tracebacks daily. The difference between a stuck learner and a productive one is knowing what to read first.",
  coreConcept: "A traceback starts with 'Traceback (most recent call last)'. Each indented File / line block shows one step in the call stack. The last line names the exception and gives a short message. Read the last line first.",
  workedExample: "NameError: name 'topic' is not defined tells you the exception is NameError and the missing name is topic. File 'study.py', line 3 tells you where to look.",
  guidedExercise: "Run a file with a missing variable, read the traceback, and write the exception name and line number.",
  missionConnection: "When the Study Tracker receives bad input it will raise exceptions. Reading the traceback is how you debug the parser.",
  reflectionPrompt: "Which line of the traceback tells you what kind of problem occurred, and which line tells you where?",
  practiceStarter: "# This code has a deliberate error.\n# Run it, read the traceback, and identify the exception type and line number.\nprint(undefined_variable)",
  practiceExpected: "NameError: name 'undefined_variable' is not defined",
  practiceCheck: "The traceback should end with a NameError line. The line number points to the print statement. The message names the undefined variable.",
  practiceReps: [],
  miniTitle: "Read and annotate a traceback",
  miniGoal: "Trigger a NameError and annotate the traceback with file, line, and exception type.",
  miniSteps: ["Run the starter code", "Read the traceback", "Write the exception type and line number"],
  miniDeliverables: [
    "Traceback output showing the intentional NameError",
    "Written annotation pointing out the error location",
    "A sentence on the difference between NameError and syntax errors"
  ],
  verifierCommand: "python read_traceback.py",
  expectedEvidence: "Traceback text ending in NameError plus your written annotation explaining file and line location.",
  projectConnection: "The Study Tracker parser will raise ValueError for bad CSV rows. Reading that traceback starts the fix.",
  requiredCodeIncludes: ["undefined_variable"],
  requiredOutputIncludes: ["NameError"],
  runnerLanguage: "python",
  runnerStarterCode: "# This is a concept lesson. The intentional error below produces a traceback.\n# Run it, read the output, then answer the proof prompt.\ntry:\n    print(undefined_variable)\nexcept NameError as e:\n    print(f\"NameError caught: {e}\")\n    print('traceback-read passed')",
  runnerTestCode: [
    "try:",
    "    print(undefined_variable_check)",
    "except NameError as e:",
    "    print(f'NameError: {e}')",
    "    print('traceback-read passed')"
  ].join("\n"),
  hiddenTests: [],
  curriculum: {
    level: 4,
    sequence: 1,
    version: "1.0.0",
    lessonKind: "concept_only",
    teaches: ["debug.traceback", "debug.line_number"],
    requires: ["py.variable.assignment", "py.function.def"],
    visibleCodeConcepts: ["debug.traceback", "debug.line_number"],
    quizConcepts: ["debug.traceback", "debug.line_number"],
    proofOutputs: ["terminal_stdout"]
  }
});

readTracebackLesson.depth = {
  primaryConceptId: "debug.traceback",
  secondaryConceptIds: ["debug.line_number"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "debug.traceback",
      definition: "Python's multi-line error report showing the call stack and the exception that stopped execution.",
      mentalModel: "Think of a traceback as a flight recorder log: it shows every step the program took before the crash, in reverse order.",
      syntaxShape: "Traceback (most recent call last):\n  File 'name.py', line N\n    code\nExceptionType: message",
      tinyExample: "NameError: name 'topic' is not defined",
      commonMistake: "Panicking and reading the first line first. The important line is always the last one.",
      repairHint: "Scroll to the bottom of the traceback. The last line names the exception type and what went wrong.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "debug.line_number",
      definition: "The line in the source file where Python stopped executing.",
      mentalModel: "Think of the line number as a map coordinate: it shows where the accident happened, not necessarily where the fault was introduced.",
      syntaxShape: "File 'study.py', line 3",
      tinyExample: "line 3",
      commonMistake: "Assuming the bug is always exactly on the reported line. Sometimes the cause is one line earlier.",
      repairHint: "Check the reported line and the line immediately before it.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-tb-1",
      label: "Read the last line",
      codeFragment: "NameError: name 'undefined_variable' is not defined",
      conceptIds: ["debug.traceback"],
      explanation: "NameError is the exception type. The message names the undefined variable. This is where to start.",
      learnerShouldBeAbleToSay: "The last line of the traceback names the exception and what went wrong"
    },
    {
      id: "w-tb-2",
      label: "Find the source line",
      codeFragment: "  File 'read_traceback.py', line 3, in <module>",
      conceptIds: ["debug.line_number"],
      explanation: "This shows the file and line number where execution stopped.",
      learnerShouldBeAbleToSay: "Line 3 in read_traceback.py is where to look"
    }
  ],
  guidedEdits: [
    {
      id: "g-tb-1",
      instruction: "Change 'undefined_variable' to 'topic = 30' and re-run. The traceback should disappear.",
      conceptIds: ["debug.traceback"],
      targetCodeFragment: "print(undefined_variable)",
      expectedObservation: "No traceback — the NameError is gone because topic is now defined.",
      wrongTurnHint: "Define topic before the print statement."
    }
  ],
  errorClinic: [
    {
      id: "e-tb-1",
      conceptIds: ["debug.traceback"],
      brokenExample: "print(undefined_variable)",
      symptom: "NameError: name 'undefined_variable' is not defined",
      likelyCause: "The variable was never assigned before it was used.",
      fixStrategy: "Assign the variable before the print: undefined_variable = 'something'"
    }
  ],
  codeLabBridge: {
    story: "Every Study Tracker debugging session starts with reading a traceback. Practice the habit of reading the last line first.",
    usesConcepts: ["debug.traceback", "debug.line_number"],
    learnerOwns: [],
    checkerOwns: [],
    runExpectation: "prints traceback-read passed"
  },
  understandingProofPrompt: "Given this traceback: 'File study.py, line 7 / NameError: name total is not defined' — what is the exception type and where do you look first?",
  exitTicket: [
    "I read the last line of a traceback first to identify the exception type.",
    "I know the File / line block tells me where execution stopped."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 2 — Fix a NameError (debug_repair)
// ---------------------------------------------------------------------------

const nameErrorLesson = proofLesson({
  id: "lesson-python-nameerror",
  moduleId: "module-python-core",
  slug: "python-nameerror",
  title: "Fix a NameError",
  summary: "Diagnose and fix a NameError by identifying the undefined name.",
  bodyMarkdown: "NameError means Python found a name it does not recognise — usually because the variable was never assigned, was mistyped, or is out of scope. The error message always names the offending identifier.",
  estimatedMinutes: 5,
  difficulty: "foundation",
  skillIds: ["skill-python-basics", "skill-testing-debugging"],
  quizId: "quiz-python-nameerror",
  desktopTask: "Fix a broken script that raises NameError by reading the message and correcting the undefined name.",
  evidencePrompt: "Record the original error message, your diagnosis, and the one-line fix.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "You are learning the exact steps to diagnose and fix a NameError.",
  prerequisites: [
    "Know how to read a traceback (previous lesson).",
    "Understand how Python variables are assigned values."
  ],
  testingFocus: "Run the fixed version and confirm no NameError appears.",
  objective: "Fix a NameError by identifying and correcting the undefined variable.",
  whyItMatters: "NameErrors are the most common beginner error. Fixing them quickly requires reading the message, not guessing.",
  coreConcept: "NameError: name 'X' is not defined always tells you the name Python cannot find. Check: is X assigned before it is used? Is it misspelled? Is it inside a scope that cannot see it?",
  workedExample: "print(topic) before topic = 'python' raises NameError. Fix: move topic = 'python' above the print.",
  guidedExercise: "Read the NameError message, find the line where the name should be defined, and add the assignment.",
  missionConnection: "The Study Tracker will raise NameError if a variable used in a report is never set. This lesson gives you the reflex to find and fix it.",
  reflectionPrompt: "Name two different mistakes that could cause a NameError for the same variable name.",
  practiceStarter: "# Fix the NameError below.\nprint(study_topic)\nstudy_topic = \"python\"",
  practiceExpected: "python",
  practiceCheck: "Move the assignment above the print. The fix is one line moving up, nothing else.",
  practiceReps: [
    {
      starterCode: "def display_session():\n    print(\"session topic: \" + session_label)\n\nsession_label = \"python 30min\"\ndisplay_session()",
      expectedOutput: "session topic: python 30min",
      checkYourAnswer: "session_label is assigned at module level. The function can read global variables defined before the call."
    },
    {
      starterCode: "topic = \"python\"\nminutes = 30\nprint(\"study session topic: \" + topik + f\" for {minutes} min\")",
      expectedOutput: "study session topic: python for 30 min",
      checkYourAnswer: "The NameError here is a typo: topik should be topic. Read the error message, find the typo, fix it."
    }
  ],
  miniTitle: "Fix a NameError",
  miniGoal: "Read a NameError message, identify the undefined name, and apply the minimal fix.",
  miniSteps: ["Run the broken code", "Read the NameError message", "Find where the name should be defined", "Add or move the assignment"],
  miniDeliverables: [
    "Fixed Python file with the assignment moved above the print",
    "Clean terminal output showing the printed value",
    "Explanation of why NameError occurs when order of statements is wrong"
  ],
  verifierCommand: "python fix_nameerror.py",
  expectedEvidence: "Clean terminal output with no NameError showing the correct printed variable value.",
  projectConnection: "The Study Tracker's parser will NameError if a session field is accessed before parsing. This reflex speeds up the fix.",
  requiredCodeIncludes: ["study_topic"],
  requiredOutputIncludes: ["python"],
  runnerLanguage: "python",
  runnerStarterCode: "# Fix the NameError: move the assignment above the print.\nstudy_topic = \"python\"  # Move this line above the print.\nprint(study_topic)",
  runnerTestCode: [
    "assert study_topic == 'python', 'study_topic should be python'",
    "print('nameerror passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "nameerror-no-exception",
      name: "No NameError raised",
      code: "try:\n    _ = study_topic\nexcept NameError:\n    raise AssertionError('study_topic is still undefined')"
    }
  ],
  curriculum: {
    level: 4,
    sequence: 2,
    version: "1.0.0",
    lessonKind: "debug_repair",
    intentionalFailure: true,
    teaches: ["debug.nameerror"],
    requires: ["debug.traceback", "py.variable.assignment"],
    visibleCodeConcepts: ["debug.nameerror", "py.variable.assignment"],
    quizConcepts: ["debug.nameerror"],
    usesButDoesNotTeach: ["py.assertion"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

nameErrorLesson.depth = {
  primaryConceptId: "debug.nameerror",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "debug.nameerror",
      definition: "An exception raised when Python encounters a name it has not seen an assignment for.",
      mentalModel: "Think of NameError as a confused librarian: you asked for a book by a name that has no card in the catalogue.",
      syntaxShape: "NameError: name 'x' is not defined",
      tinyExample: "NameError: name 'topic' is not defined",
      commonMistake: "Searching the wrong place — looking at the print line when the real bug is the missing assignment above it.",
      repairHint: "Find the name in the error message, then search upward in the file for where it should be assigned.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-ne-1",
      label: "Read the NameError",
      codeFragment: "NameError: name 'study_topic' is not defined",
      conceptIds: ["debug.nameerror"],
      explanation: "study_topic is used before it is assigned. Python cannot find it in any scope.",
      learnerShouldBeAbleToSay: "study_topic needs to be assigned before this line runs"
    }
  ],
  guidedEdits: [
    {
      id: "g-ne-1",
      instruction: "Move study_topic = 'python' to the line before print(study_topic).",
      conceptIds: ["debug.nameerror"],
      targetCodeFragment: "print(study_topic)",
      expectedObservation: "No NameError — the output is 'python'.",
      wrongTurnHint: "The assignment must appear before the print in execution order."
    }
  ],
  errorClinic: [
    {
      id: "e-ne-1",
      conceptIds: ["debug.nameerror"],
      brokenExample: "print(topik)",
      symptom: "NameError: name 'topik' is not defined",
      likelyCause: "Misspelling: topic was written as topik.",
      fixStrategy: "Correct the spelling to match the assignment: print(topic)"
    }
  ],
  codeLabBridge: {
    story: "The Study Tracker parser raises NameError when a session field is used before it is parsed. This lesson builds the reflex to spot and fix it.",
    usesConcepts: ["debug.nameerror"],
    learnerOwns: ["study_topic"],
    checkerOwns: ["nameerror-no-exception"],
    runExpectation: "prints nameerror passed"
  },
  understandingProofPrompt: "List two different causes of NameError for the same variable name. How would you tell them apart from the traceback?",
  exitTicket: [
    "I can read the NameError message to find the undefined name.",
    "I know to check: is it assigned? Is it misspelled? Is it in scope?"
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 3 — Fix a TypeError (debug_repair)
// ---------------------------------------------------------------------------

const typeErrorLesson = proofLesson({
  id: "lesson-python-typeerror",
  moduleId: "module-python-core",
  slug: "python-typeerror",
  title: "Fix a TypeError",
  summary: "Diagnose and fix a TypeError by identifying the mismatched types.",
  bodyMarkdown: "TypeError means Python received a value of the wrong type for an operation. The most common cause is mixing strings and integers in arithmetic. The error message names the operation and the conflicting types.",
  estimatedMinutes: 5,
  difficulty: "foundation",
  skillIds: ["skill-python-basics", "skill-testing-debugging"],
  quizId: "quiz-python-typeerror",
  desktopTask: "Fix a broken calculation that raises TypeError by correcting the type mismatch.",
  evidencePrompt: "Record the TypeError message, which type was wrong, and what you changed to fix it.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "You are learning how to diagnose a TypeError and fix the type mismatch.",
  prerequisites: [
    "Know how to read a traceback (lesson-python-read-traceback).",
    "Understand Python string and integer value types."
  ],
  testingFocus: "Run the fixed version and confirm the output is an integer.",
  objective: "Fix a TypeError by converting or correcting the mismatched operand.",
  whyItMatters: "The Study Tracker reads minutes from CSV as strings. Adding them without conversion raises TypeError. This lesson gives you the fix.",
  coreConcept: "TypeError: unsupported operand type(s) means you tried to use an operator with incompatible types. '30' + 20 fails because you cannot add a string and an integer. int('30') converts the string first.",
  workedExample: "minutes = '30' + 20 raises TypeError. Fix: minutes = int('30') + 20 produces 50.",
  guidedExercise: "Read the TypeError, find the string that should be an integer, and wrap it in int().",
  missionConnection: "Every time the Study Tracker reads a minutes value from CSV it is a string. int() converts it before arithmetic.",
  reflectionPrompt: "What is the minimum change that fixes the TypeError without rewriting more code than necessary?",
  practiceStarter: "minutes_str = \"30\"\n# Fix the TypeError: convert minutes_str to an integer before adding.\ntotal = minutes_str + 20\nprint(total)",
  practiceExpected: "50",
  practiceCheck: "Wrap minutes_str in int() before the addition. The fix is one word: int(minutes_str) + 20.",
  practiceReps: [
    {
      starterCode: "raw = \"15\"\nresult = raw * 2\nprint(\"multiplied result value: \" + str(result))",
      expectedOutput: "multiplied result value: 30",
      checkYourAnswer: "raw is a string. '15' * 2 repeats the string, not multiplies the number. int(raw) * 2 produces 30."
    },
    {
      starterCode: "a = 10\nb = \"5\"\ntotal = a + b\nprint(\"calculated sum total: \" + str(total))",
      expectedOutput: "calculated sum total: 15",
      checkYourAnswer: "b is a string. int(b) converts it before addition. The TypeError message tells you which type was wrong."
    }
  ],
  miniTitle: "Fix a TypeError",
  miniGoal: "Convert a string to an integer to fix a TypeError in a calculation.",
  miniSteps: ["Read the TypeError message", "Identify the string operand", "Wrap it in int()", "Verify the result"],
  miniDeliverables: [
    "Fixed Python file with the string wrapped in int()",
    "Clean terminal output showing the correct integer total",
    "Short note on when string concatenation vs integer addition is used"
  ],
  verifierCommand: "python fix_typeerror.py",
  expectedEvidence: "Terminal output showing the correct integer total after type conversion is successfully run.",
  projectConnection: "int() is the first fix applied when the Study Tracker reads raw CSV minutes values.",
  requiredCodeIncludes: ["int", "minutes_str"],
  requiredOutputIncludes: ["50"],
  runnerLanguage: "python",
  runnerStarterCode: "minutes_str = \"30\"\n# Fix the TypeError: convert minutes_str to an integer before adding.\ntotal = minutes_str + 20\nprint(total)",
  runnerTestCode: [
    "assert isinstance(total, int), 'total must be an integer, not a string'",
    "assert total == 50, 'total should be 50'",
    "print('typeerror passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "typeerror-result-correct",
      name: "Result is the correct integer",
      code: "assert total == 50, 'total must equal 50'"
    }
  ],
  curriculum: {
    level: 4,
    sequence: 3,
    version: "1.0.0",
    lessonKind: "debug_repair",
    intentionalFailure: true,
    teaches: ["debug.typeerror"],
    requires: ["debug.traceback", "py.arithmetic", "py.string"],
    visibleCodeConcepts: ["debug.typeerror", "py.arithmetic"],
    quizConcepts: ["debug.typeerror"],
    usesButDoesNotTeach: ["py.assertion"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

typeErrorLesson.depth = {
  primaryConceptId: "debug.typeerror",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "debug.typeerror",
      definition: "An exception raised when an operation is applied to an operand of the wrong type.",
      mentalModel: "Think of TypeError as a type mismatch notice: the operation expects one type but received another.",
      syntaxShape: "TypeError: unsupported operand type(s) for +: 'str' and 'int'",
      tinyExample: "'30' + 20",
      commonMistake: "Trying to add a string and an integer without converting one of them first.",
      repairHint: "Wrap the string in int() before the operation: int('30') + 20",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-te-1",
      label: "Read the TypeError",
      codeFragment: "TypeError: can only concatenate str (not 'int') to str",
      conceptIds: ["debug.typeerror"],
      explanation: "Python cannot add a string and an integer. The types are incompatible for +.",
      learnerShouldBeAbleToSay: "The types are mismatched — one needs to be converted"
    },
    {
      id: "w-te-2",
      label: "Fix with int()",
      codeFragment: "total = int(minutes_str) + 20",
      conceptIds: ["debug.typeerror"],
      explanation: "int() converts the string '30' to the integer 30 before the addition runs.",
      learnerShouldBeAbleToSay: "int() converts the string to a number first"
    }
  ],
  guidedEdits: [
    {
      id: "g-te-1",
      instruction: "Wrap minutes_str in int() on the total line.",
      conceptIds: ["debug.typeerror"],
      targetCodeFragment: "total = minutes_str + 20",
      expectedObservation: "The output changes from a TypeError to 50.",
      wrongTurnHint: "Change only the right side: int(minutes_str) + 20"
    }
  ],
  errorClinic: [
    {
      id: "e-te-1",
      conceptIds: ["debug.typeerror"],
      brokenExample: 'total = "30" + 20',
      symptom: "TypeError: can only concatenate str (not 'int') to str",
      likelyCause: "The string '30' and the integer 20 cannot be added.",
      fixStrategy: "Convert the string: int('30') + 20"
    }
  ],
  codeLabBridge: {
    story: "The Study Tracker reads minutes as strings from CSV. int() is the first transformation before any arithmetic.",
    usesConcepts: ["debug.typeerror"],
    learnerOwns: ["total"],
    checkerOwns: ["typeerror-result-correct"],
    runExpectation: "prints typeerror passed"
  },
  understandingProofPrompt: "What is the minimum change that fixes TypeError: can only concatenate str (not 'int') to str when total = '30' + 20?",
  exitTicket: [
    "I can identify which operand has the wrong type from a TypeError message.",
    "I know int() converts a numeric string to an integer."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 4 — Fix a ValueError (debug_repair)
// ---------------------------------------------------------------------------

const valueErrorLesson = proofLesson({
  id: "lesson-python-valueerror",
  moduleId: "module-python-core",
  slug: "python-valueerror",
  title: "Fix a ValueError",
  summary: "Diagnose a ValueError and handle it with a useful error message.",
  bodyMarkdown: "ValueError means the type is correct but the value itself is not valid for the operation. The classic example is int('oops'): the argument is a string (correct type for int()), but its content cannot be converted to a number.",
  estimatedMinutes: 5,
  difficulty: "foundation",
  skillIds: ["skill-python-basics", "skill-testing-debugging"],
  quizId: "quiz-python-valueerror",
  desktopTask: "Write a safe parser that handles a bad minutes value and reports a clear error message.",
  evidencePrompt: "Record the ValueError message, the bad input, and the error message your code produces.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "You are learning to catch a ValueError and report it clearly instead of crashing.",
  prerequisites: [
    "Know how to read a traceback and fix a TypeError (previous lessons).",
    "Understand how try/except blocks are structured in Python."
  ],
  testingFocus: "The test confirms the parser handles both a valid value and an invalid value without crashing.",
  objective: "Catch a ValueError and return a useful error message instead of letting the program crash.",
  whyItMatters: "Real CSV files contain non-numeric minute values. The Study Tracker must handle them cleanly.",
  coreConcept: "ValueError: invalid literal for int() with base 10: 'oops' means the string cannot be converted. try/except ValueError catches the failure path and lets you substitute a useful message.",
  workedExample: "int('oops') raises ValueError. try: safe = int('oops') except ValueError: error = 'invalid minutes: oops'.",
  guidedExercise: "Write a parser that returns 30 for '30' and an error message for 'oops'.",
  missionConnection: "The Study Tracker's CSV parser will encounter non-numeric minute values. This lesson gives it a graceful fallback.",
  reflectionPrompt: "How is a ValueError different from a TypeError? Can the same bad input trigger both?",
  practiceStarter: "def safe_parse(raw):\n    # Return int(raw) or an error message if conversion fails.\n    return 0\n\nprint(safe_parse(\"30\"))\nprint(safe_parse(\"oops\"))",
  practiceExpected: "30\ninvalid minutes: oops",
  practiceCheck: "The function should return an integer for valid input and a string message for invalid input. If it crashes, the try/except is missing or catching the wrong exception.",
  practiceReps: [
    {
      starterCode: "def safe_parse(raw):\n    try:\n        return int(raw)\n    except ValueError:\n        return f\"invalid: {raw}\"\n\nprint(\"parsed value: \" + str(safe_parse(\"45\")))\nprint(\"parsed value: \" + safe_parse(\"soon\"))",
      expectedOutput: "parsed value: 45\nparsed value: invalid: soon",
      checkYourAnswer: "The try block converts valid strings. The except block catches invalid ones and returns a clear message."
    }
  ],
  miniTitle: "Write a safe parser",
  miniGoal: "Define safe_parse(raw) that returns an integer for valid input and an error message for invalid input.",
  miniSteps: ["Add a try block with int(raw)", "Add except ValueError with a clear message", "Test both paths"],
  miniDeliverables: [
    "Python file with safe_parse function using try/except ValueError",
    "Terminal output showing both valid conversion and invalid message",
    "Reflection note on how ValueError differs from TypeError"
  ],
  verifierCommand: "python safe_parse.py",
  expectedEvidence: "Terminal output showing the valid integer and the clear error message.",
  projectConnection: "safe_parse is the Study Tracker's minute parser: valid rows become integers, bad rows get a diagnostic message.",
  requiredCodeIncludes: ["try", "except", "ValueError"],
  requiredOutputIncludes: ["30", "invalid"],
  runnerLanguage: "python",
  runnerStarterCode: "def safe_parse(raw):\n    try:\n        return int(raw)\n    except ValueError:\n        return f\"invalid minutes: {raw}\"\n\nprint(safe_parse(\"30\"))\nprint(safe_parse(\"oops\"))",
  runnerTestCode: [
    "assert safe_parse('30') == 30, 'safe_parse should return 30 for the string 30'",
    "result = safe_parse('oops')",
    "assert isinstance(result, str), 'safe_parse should return a string error message for oops'",
    "assert 'oops' in result, 'error message should mention oops'",
    "print('valueerror passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "valueerror-both-paths",
      name: "Handles both valid and invalid input",
      code: "assert safe_parse('15') == 15, 'safe_parse of 15 should be 15'\nassert 'invalid' in safe_parse('bad').lower(), 'safe_parse of bad should return invalid message'"
    }
  ],
  curriculum: {
    level: 4,
    sequence: 4,
    version: "1.0.0",
    lessonKind: "debug_repair",
    intentionalFailure: true,
    teaches: ["debug.exception_name", "py.value_error"],
    requires: ["debug.traceback", "py.function.def", "py.return"],
    visibleCodeConcepts: ["debug.exception_name", "py.value_error"],
    quizConcepts: ["debug.exception_name", "py.value_error"],
    usesButDoesNotTeach: ["py.assertion"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

valueErrorLesson.depth = {
  primaryConceptId: "py.value_error",
  secondaryConceptIds: ["debug.exception_name"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.value_error",
      definition: "An exception raised when a function receives the right type but a value that cannot be processed.",
      mentalModel: "Think of ValueError as the right container, wrong contents: you gave int() a string, but the string is not a number.",
      syntaxShape: "ValueError: invalid literal for int() with base 10: 'text'",
      tinyExample: "int('oops') raises ValueError",
      commonMistake: "Catching ValueError when the bug is actually a TypeError — the error message names the exception, so read it first.",
      repairHint: "Match your except clause to the exact exception name in the traceback.",
      usedIn: ["learn", "practice", "code_lab"]
    },
    {
      conceptId: "debug.exception_name",
      definition: "The class identifier (NameError, TypeError, ValueError, etc.) that categorises what went wrong.",
      mentalModel: "Think of the exception name as a medical diagnosis: it tells you the class of problem before you look up the cure.",
      syntaxShape: "ExceptionName: detail message",
      tinyExample: "ValueError",
      commonMistake: "Using a bare except: clause that catches every exception type, hiding the real problem.",
      repairHint: "Always name the exception: except ValueError instead of except Exception.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-ve-1",
      label: "Try the conversion",
      codeFragment: "try:\n    return int(raw)",
      conceptIds: ["py.value_error"],
      explanation: "int(raw) attempts conversion. For '30' it succeeds. For 'oops' it raises ValueError.",
      learnerShouldBeAbleToSay: "The try block runs the risky conversion"
    },
    {
      id: "w-ve-2",
      label: "Catch the ValueError",
      codeFragment: "except ValueError:\n    return f'invalid minutes: {raw}'",
      conceptIds: ["debug.exception_name", "py.value_error"],
      explanation: "except ValueError catches the specific exception and returns a clear message instead of crashing.",
      learnerShouldBeAbleToSay: "except names the specific exception to catch"
    }
  ],
  guidedEdits: [
    {
      id: "g-ve-1",
      instruction: "Change the except clause from 'except Exception' to 'except ValueError' and confirm both paths still work.",
      conceptIds: ["debug.exception_name"],
      targetCodeFragment: "except ValueError:",
      expectedObservation: "Both paths still work. The more specific clause is safer and clearer.",
      wrongTurnHint: "Only change the exception name in the except clause."
    }
  ],
  errorClinic: [
    {
      id: "e-ve-1",
      conceptIds: ["py.value_error"],
      brokenExample: "try:\n    return int(raw)\nexcept TypeError:\n    return 'invalid'",
      symptom: "Script crashes with ValueError instead of returning the error message.",
      likelyCause: "Catching TypeError instead of ValueError. int() raises ValueError for non-numeric strings.",
      fixStrategy: "Change except TypeError to except ValueError."
    }
  ],
  codeLabBridge: {
    story: "safe_parse is the Study Tracker's boundary function: it converts raw strings to integers or returns a diagnostic.",
    usesConcepts: ["py.value_error", "debug.exception_name"],
    learnerOwns: ["safe_parse"],
    checkerOwns: ["valueerror-both-paths"],
    runExpectation: "prints valueerror passed"
  },
  understandingProofPrompt: "Why is 'except ValueError' safer than 'except Exception' when parsing minutes?",
  exitTicket: [
    "I know ValueError means right type, wrong value.",
    "I can write try/except ValueError to handle conversion failures."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 5 — Handle Failures Gracefully with try/except (run_file)
// ---------------------------------------------------------------------------

const tryExceptLesson = proofLesson({
  id: "lesson-python-try-except",
  moduleId: "module-python-core",
  slug: "python-try-except",
  title: "Handle Failures Gracefully",
  summary: "Use try/except to handle expected failures and return useful messages instead of crashing.",
  bodyMarkdown: "try/except separates the code that might fail (the try block) from the code that handles the failure (the except block). A good exception handler catches the specific exception, records what went wrong, and returns a clear message. It does not silently swallow errors.",
  estimatedMinutes: 7,
  difficulty: "foundation",
  skillIds: ["skill-python-basics", "skill-testing-debugging"],
  quizId: "quiz-python-try-except",
  desktopTask: "Write a minutes parser that handles a valid value and an invalid value without crashing, and write one assertion per path.",
  evidencePrompt: "Record the valid output, the invalid error message, and the two assertion results.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "You are learning how to write a function that handles both the happy path and the failure path.",
  prerequisites: [
    "Know how to read tracebacks and identify ValueError (previous lessons).",
    "Understand the concept of a happy path and failure path."
  ],
  testingFocus: "The test calls the parser with a valid value and an invalid value and checks both results.",
  objective: "Write a try/except block that handles a specific exception and returns a useful message.",
  whyItMatters: "Real software receives bad input. A useful parser reports the problem clearly instead of crashing or pretending the bad value worked.",
  coreConcept: "try: attempt the risky operation. except ExceptionName: handle the specific failure. Return a clear message, not a generic 'error'. Catch only what you expect. Let unexpected exceptions surface.",
  workedExample: "try: safe_minutes = int('30') except ValueError: error_message = 'invalid minutes: oops'. int('30') succeeds; int('oops') triggers the except.",
  guidedExercise: "Write parse_minutes(raw) that returns an integer for valid input and a formatted error string for invalid input, then test both paths.",
  missionConnection: "This is exactly the function the Study Tracker's CSV parser needs at its boundary.",
  reflectionPrompt: "Which value caused the error, and what message would help a beginner fix the input?",
  practiceStarter: "safe_minutes = None\nerror_message = \"\"\n\n# Parse \"30\" safely and report \"oops\" without crashing.\ntry:\n    safe_minutes = int(\"30\")\nexcept ValueError:\n    error_message = \"invalid minutes: oops\"\n\nprint(safe_minutes)\nprint(error_message)",
  practiceExpected: "30\n",
  practiceCheck: "safe_minutes should be the integer 30. error_message should be empty because '30' is valid. Change '30' to 'oops' and re-run to see the failure path.",
  practiceReps: [
    {
      starterCode: "def parse_minutes(raw):\n    try:\n        return int(raw)\n    except ValueError:\n        return f\"invalid minutes: {raw}\"\n\nif parse_minutes(\"45\") == 45 and \"invalid\" in parse_minutes(\"soon\"):\n    print(\"try-except assertion verification passed\")",
      expectedOutput: "try-except assertion verification passed",
      checkYourAnswer: "Both assertions must pass. The first checks the happy path, the second checks the failure path."
    },
    {
      starterCode: "def parse_minutes(raw):\n    try:\n        return int(raw)\n    except ValueError:\n        return f\"invalid minutes: {raw}\"\n\n# Try a negative number — what should happen?\nprint(\"negative minutes parsed: \" + str(parse_minutes(\"-5\")))\nprint(\"invalid string parsed: \" + parse_minutes(\"abc\"))",
      expectedOutput: "negative minutes parsed: -5\ninvalid string parsed: invalid minutes: abc",
      checkYourAnswer: "int('-5') succeeds — negative numbers are valid integers. The ValueError only fires for non-numeric strings."
    }
  ],
  miniTitle: "Write parse_minutes",
  miniGoal: "Define parse_minutes(raw) with try/except ValueError and assert both paths.",
  miniSteps: ["Write the try block", "Write the except block with a clear message", "Call with a valid value", "Call with an invalid value", "Add two assertions"],
  miniDeliverables: [
    "Python file with parse_minutes using try/except ValueError",
    "Terminal output showing both valid and invalid test paths",
    "Written explanation of why we name the exception type explicitly"
  ],
  verifierCommand: "python parse_minutes.py",
  expectedEvidence: "Terminal output showing assertions passed for both happy and failure paths successfully.",
  projectConnection: "parse_minutes is the Study Tracker's boundary function: the entry point for every minute value from CSV.",
  requiredCodeIncludes: ["try", "except", "ValueError", "error_message"],
  requiredOutputIncludes: ["30", "invalid minutes"],
  runnerLanguage: "python",
  runnerStarterCode: "safe_minutes = None\nerror_message = \"\"\n\n# Parse \"30\" safely and report \"oops\" without crashing.\ntry:\n    safe_minutes = int(\"30\")\nexcept ValueError:\n    error_message = \"invalid minutes: oops\"\n\nprint(safe_minutes)\nprint(error_message)",
  runnerTestCode: [
    "assert safe_minutes == 30, 'safe_minutes should be 30'",
    "assert error_message == '', 'error_message should be empty because 30 is valid'",
    "try:",
    "    _ = int('oops')",
    "except ValueError:",
    "    print('invalid minutes: oops')",
    "print('try-except passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "try-except-handles-both",
      name: "Handles valid and invalid input",
      code: "assert isinstance(safe_minutes, int), 'safe_minutes must be an integer'\nassert error_message == '', 'No error expected for valid input'"
    }
  ],
  curriculum: {
    level: 4,
    sequence: 5,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.try_except", "py.raise"],
    requires: ["py.value_error", "debug.exception_name", "py.function.def", "py.return"],
    visibleCodeConcepts: ["py.try_except", "py.raise"],
    quizConcepts: ["py.try_except"],
    usesButDoesNotTeach: ["py.assertion"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

tryExceptLesson.depth = {
  primaryConceptId: "py.try_except",
  secondaryConceptIds: ["py.raise"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.try_except",
      definition: "A two-block structure where try contains the risky code and except catches specific exceptions to handle gracefully.",
      mentalModel: "Think of try/except as an airbag: the car still moves (the try block runs), but if something crashes the airbag deploys (the except block handles it) instead of everything stopping.",
      syntaxShape: "try:\n    risky_code\nexcept ExceptionName:\n    fallback_code",
      tinyExample: "try:\n    safe_minutes = int(raw)\nexcept ValueError:\n    error_message = f'invalid: {raw}'",
      commonMistake: "Using bare except: without naming the exception, which hides bugs by catching everything.",
      repairHint: "Always name the exception: except ValueError, not just except.",
      usedIn: ["learn", "practice", "code_lab"]
    },
    {
      conceptId: "py.raise",
      definition: "Manually triggering an exception using the raise keyword when your own logic detects an invalid state.",
      mentalModel: "Think of raise as the fire alarm: your code spots the problem and signals the emergency instead of silently continuing.",
      syntaxShape: "raise ExceptionClass('message')",
      tinyExample: "raise ValueError('negative minutes')",
      commonMistake: "Using raise Exception instead of a specific type like ValueError or TypeError.",
      repairHint: "Raise the most specific exception type that matches the problem.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-te-1",
      label: "Try the conversion",
      codeFragment: "try:\n    safe_minutes = int(\"30\")",
      conceptIds: ["py.try_except"],
      explanation: "The try block attempts int('30'). If it succeeds, safe_minutes is 30 and the except block is skipped.",
      learnerShouldBeAbleToSay: "try runs first — if no exception, except is skipped"
    },
    {
      id: "w-te-2",
      label: "Handle the failure",
      codeFragment: "except ValueError:\n    error_message = \"invalid minutes: oops\"",
      conceptIds: ["py.try_except", "debug.exception_name"],
      explanation: "If int() raises ValueError the except block runs and sets a clear error message.",
      learnerShouldBeAbleToSay: "except catches the specific exception and handles it"
    }
  ],
  guidedEdits: [
    {
      id: "g-te-1",
      instruction: "Change int('30') to int('oops') and observe the except block run.",
      conceptIds: ["py.try_except"],
      targetCodeFragment: 'safe_minutes = int("30")',
      expectedObservation: "safe_minutes stays None and error_message is set to 'invalid minutes: oops'.",
      wrongTurnHint: "Only change the string inside int(). Leave the except block untouched."
    }
  ],
  errorClinic: [
    {
      id: "e-te-1",
      conceptIds: ["py.try_except"],
      brokenExample: "try:\n    safe_minutes = int(raw)\nexcept TypeError:\n    error_message = 'invalid'",
      symptom: "Script crashes with ValueError instead of setting error_message.",
      likelyCause: "Catching TypeError when int() raises ValueError for non-numeric strings.",
      fixStrategy: "Change except TypeError to except ValueError."
    },
    {
      id: "e-te-2",
      conceptIds: ["py.try_except"],
      brokenExample: "try:\n    safe_minutes = int(raw)\nexcept:\n    error_message = 'invalid'",
      symptom: "Bare except hides unexpected errors and makes debugging harder.",
      likelyCause: "Using bare except catches everything, including KeyboardInterrupt and SystemExit.",
      fixStrategy: "Name the exception: except ValueError."
    }
  ],
  codeLabBridge: {
    story: "parse_minutes is the Study Tracker's boundary: it converts valid CSV values and reports invalid ones without crashing.",
    usesConcepts: ["py.try_except", "py.value_error"],
    learnerOwns: ["safe_minutes", "error_message"],
    checkerOwns: ["try-except-handles-both"],
    runExpectation: "prints try-except passed"
  },
  understandingProofPrompt: "What is the difference between 'except Exception' and 'except ValueError'? Which is safer and why?",
  exitTicket: [
    "I can write a try/except block that catches a specific exception.",
    "I know bare except is dangerous because it hides unexpected bugs."
  ]
};

// ---------------------------------------------------------------------------
// Deprecated — original monolithic lesson (kept for progress resolution)
// ---------------------------------------------------------------------------

const deprecatedTracebackClinicLesson = proofLesson({
  id: "lesson-python-traceback-clinic",
  moduleId: "module-python-core",
  slug: "python-traceback-clinic",
  title: "Read Errors Like a Developer (Deprecated)",
  summary: "Original Level 4 lesson — replaced by five focused micro-lessons.",
  bodyMarkdown: "This lesson has been split into focused micro-lessons. Learners who completed it are automatically placed out of the new sequence.",
  estimatedMinutes: 10,
  difficulty: "foundation",
  skillIds: ["skill-python-basics", "skill-testing-debugging"],
  quizId: "quiz-python-traceback-clinic",
  desktopTask: "Write a small parser that handles one valid minutes value and one invalid value without crashing.",
  evidencePrompt: "Record the failing input, the safe output, and the exception type you handled.",
  language: "Python",
  tools: ["Python 3", "terminal", "tracebacks", "try/except"],
  synopsis: "You are learning to treat errors as information. Instead of seeing a traceback as a dead end, you will read what failed and decide what message would help the user fix it.",
  prerequisites: ["Know that int('30') converts text into a number.", "Know that file input can contain values your code did not expect."],
  testingFocus: "You will test one valid value and one invalid value so the parser proves both success behavior and failure behavior.",
  objective: "Read a Python error and handle invalid input without hiding the problem.",
  whyItMatters: "Real software receives bad input. A useful script reports the problem clearly instead of crashing or pretending the bad value worked.",
  coreConcept: "A traceback is Python's error report. The last line usually names the exception, which is the type of problem Python found. try/except lets you handle an expected failure path and return a useful message instead of crashing.",
  workedExample: "int('30') works, but int('oops') raises ValueError. A safe parser can catch that and report invalid minutes: oops.",
  guidedExercise: "Create a parser that returns 30 for valid input and a clear error message for invalid input.",
  missionConnection: "This makes the CLI Study Tracker safer when file rows contain bad minute values.",
  reflectionPrompt: "Which value caused the error, and what message would help a beginner fix the input?",
  practiceStarter: "safe_minutes = None\nerror_message = \"\"\n\n# Parse \"30\" safely and report \"oops\" without crashing.\nprint(safe_minutes)\nprint(error_message)",
  practiceExpected: "30\ninvalid minutes: oops",
  practiceCheck: "If the program crashes, read the last line of the traceback first. If it silently returns 0 for oops, the user will not know what to fix, so use a clear error message instead.",
  practiceReps: [],
  miniTitle: "Handle bad minutes input",
  miniGoal: "Build a tiny parser that accepts valid minutes and reports invalid minutes without crashing.",
  miniSteps: ["Parse the text value 30 into an integer", "Try parsing the bad value oops", "Set a clear error message when parsing fails"],
  miniDeliverables: ["Parser code", "Output showing 30", "Output showing invalid minutes: oops"],
  verifierCommand: "python traceback_clinic.py",
  expectedEvidence: "Terminal output proving valid input still works and invalid input is reported with a clear message instead of a traceback.",
  projectConnection: "This makes the CLI Study Tracker safer when file rows contain bad minute values.",
  requiredCodeIncludes: ["try", "except", "ValueError", "error_message"],
  requiredOutputIncludes: ["30", "invalid minutes", "oops"],
  runnerLanguage: "python",
  runnerStarterCode: "safe_minutes = None\nerror_message = \"\"\n\n# Parse \"30\" safely and report \"oops\" without crashing.\nprint(safe_minutes)\nprint(error_message)",
  runnerTestCode: "assert safe_minutes == 30, 'safe_minutes should be 30'\nassert error_message == 'invalid minutes: oops', 'error_message must match invalid minutes: oops'\nprint('invalid minutes oops passed')",
  hiddenTests: [
    {
      id: "minutes-error-is-explicit",
      name: "Minutes error is explicit",
      code: "assert isinstance(safe_minutes, int), 'safe_minutes must be an integer'\nassert 'oops' in error_message, 'error_message should contain oops'\nassert 'invalid' in error_message, 'error_message should contain invalid'"
    }
  ],
  curriculum: {
    level: 4,
    sequence: 99,
    version: "1.0.0",
    deprecated: true,
    preserveProgress: true,
    showInActivePath: false,
    showInReviewQueue: false,
    legacyEvidenceOnly: true,
    lessonKind: "run_file",
    teaches: ["debug.traceback", "debug.exception_name", "debug.line_number", "py.raise", "py.value_error", "debug.invalid_input"],
    requires: ["py.function.def", "py.return"],
    usesButDoesNotTeach: ["py.assertion"],
    replacedByLessonIds: [
      "lesson-python-read-traceback",
      "lesson-python-nameerror",
      "lesson-python-typeerror",
      "lesson-python-valueerror",
      "lesson-python-try-except"
    ]
  }
});

deprecatedTracebackClinicLesson.depth = {
  primaryConceptId: "debug.traceback",
  secondaryConceptIds: ["debug.exception_name", "debug.line_number"],
  maxNewConcepts: 3,
  conceptCapsules: [],
  codeWalkthrough: [],
  guidedEdits: [],
  errorClinic: [],
  codeLabBridge: {
    story: "This lesson is deprecated. See the five replacement micro-lessons.",
    usesConcepts: ["debug.traceback"],
    learnerOwns: [],
    checkerOwns: [],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "This lesson is deprecated. Complete lesson-python-try-except instead.",
  exitTicket: ["This lesson is deprecated."]
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const level4Lessons: Lesson[] = [
  readTracebackLesson,
  nameErrorLesson,
  typeErrorLesson,
  valueErrorLesson,
  tryExceptLesson
];

/** Kept in the content pack so old learner progress IDs still resolve. */
export const deprecatedLevel4Lessons: Lesson[] = [
  deprecatedTracebackClinicLesson
];

// ---------------------------------------------------------------------------
// Quizzes — one per micro-lesson
// ---------------------------------------------------------------------------

export const level4Quizzes: Quiz[] = [
  checkpointQuiz(
    "quiz-python-read-traceback",
    "lesson-python-read-traceback",
    "Read a Traceback Checkpoint",
    "reading tracebacks",
    "Read the last line first to identify the exception type and message, then find the File / line block.",
    "Read the first line of the traceback to find the problem.",
    "Tracebacks always point to the line where the bug was introduced, not where execution stopped.",
    "The last line names the exception. The File / line block shows where execution stopped.",
    ["debug.traceback", "debug.line_number"]
  ),
  checkpointQuiz(
    "quiz-python-nameerror",
    "lesson-python-nameerror",
    "NameError Checkpoint",
    "NameError",
    "Assign the variable before using it, or correct the spelling to match the assignment.",
    "Wrap the variable name in quotes to avoid the error.",
    "Add a try/except around every variable access to prevent NameError.",
    "NameError means Python cannot find a name. Check assignment, spelling, and scope.",
    ["debug.nameerror"]
  ),
  checkpointQuiz(
    "quiz-python-typeerror",
    "lesson-python-typeerror",
    "TypeError Checkpoint",
    "TypeError",
    "Convert the string to an integer with int() before the arithmetic operation.",
    "Wrap the entire expression in str() to convert everything to the same type.",
    "Use // instead of + to avoid type conflicts in mixed operations.",
    "TypeError means the types are incompatible for the operation. int() converts a numeric string to an integer.",
    ["debug.typeerror"]
  ),
  checkpointQuiz(
    "quiz-python-valueerror",
    "lesson-python-valueerror",
    "ValueError Checkpoint",
    "ValueError",
    "Catch the specific ValueError with try/except ValueError and return a clear error message.",
    "Catch all exceptions with bare except and silently ignore the failure.",
    "Convert the input using str() before passing it to int() to prevent ValueError.",
    "ValueError means right type, wrong value. try/except ValueError handles it without hiding other bugs.",
    ["py.value_error", "debug.exception_name"]
  ),
  checkpointQuiz(
    "quiz-python-try-except",
    "lesson-python-try-except",
    "try/except Checkpoint",
    "try/except exception handling",
    "Write try with the risky code and except ExceptionName with a clear fallback message.",
    "Use bare except: to catch everything and avoid crashes in all cases.",
    "Put all exception handling in a global try block at the top of the file.",
    "try contains the attempt. except names the exception and handles the fallback. Never use bare except.",
    ["py.try_except"]
  ),
  // Deprecated quiz — kept so old quiz attempt IDs still resolve
  checkpointQuiz(
    "quiz-python-traceback-clinic",
    "lesson-python-traceback-clinic",
    "Traceback Clinic Checkpoint (Deprecated)",
    "reading traceback errors",
    "Interpret exception details, line numbers, and stderr lines, using try/except blocks to handle invalid input.",
    "Bypass try/except blocks and let scripts crash, assuming users read raw tracebacks.",
    "Catch all errors under a generic Exception block without naming a repair strategy.",
    "Tracebacks locate errors. Try/except intercepts exceptions and provides fallbacks.",
    ["debug.traceback", "debug.exception_name", "debug.line_number", "py.value_error"]
  )
];
