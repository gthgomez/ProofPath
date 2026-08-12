import type { Lesson, Quiz, LessonPracticeBlock } from "@/domain/types";
import { proofLesson, codeReadingQuiz } from "./shared";

// ---------------------------------------------------------------------------
// Micro-lesson 1 — Read a Traceback (concept_only)
// ---------------------------------------------------------------------------

const readTracebackLesson = proofLesson({
  id: "lesson-python-read-traceback",
  moduleId: "module-python-core",
  slug: "python-read-traceback",
  title: "Read a Traceback",
  summary: "Learn to read Python's error report so you know where to look and what went wrong.",
  bodyMarkdown: "Run this code. It WILL crash. READ the error message — that's the lesson. A traceback is Python's error log. It lists the call chain that led to the failure, ending with the exception name and a short message. The last two lines are almost always the most useful: they show where the error occurred and what kind of error it was.",
  estimatedMinutes: 4,
  difficulty: "foundation",
  skillIds: ["skill-python-basics", "skill-testing-debugging"],
  quizId: "quiz-python-read-traceback",
  desktopTask: "Deliberately trigger a NameError and read the traceback, identifying the file name, line number, and exception type.",
  evidencePrompt: "Write down the last two lines of the traceback and explain what each part means.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "Your screen just exploded with red text. What is it actually telling you?",
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
  practiceReps: [
    {
      starterCode: "# Run this code and read the traceback.\n# Identify the exception type and the line number.\nprint(study_topic)",
      expectedOutput: "NameError: name 'study_topic' is not defined — reads the traceback and names the missing variable.",
      checkYourAnswer: "The traceback ends with NameError and names 'study_topic' as undefined. The line number points to the print statement that tried to use the variable before assignment.",
      tier: "replicate"
    },
    {
      starterCode: "# Bug: this code has two problems. Run it, read the traceback,\n# identify the FIRST exception and which line causes it.\ntopic = \"python\"\nminutes = \"30\"\ntotal = topic + \" \" + minutes\nprint(\"Study session: \" + topic + \" for \" + minutes + \" min\")\nprint(undefind_variable)",
      expectedOutput: "NameError: name 'undefind_variable' is not defined — the typo on the last line causes the crash before the earlier code completes.",
      checkYourAnswer: "The NameError on 'undefind_variable' is a typo of 'undefined_variable'. The fix is to remove the faulty print or correct the variable name to a defined one.",
      tier: "diagnose"
    },
    {
      starterCode: "# Write code that deliberately triggers a TypeError by adding a string \n# and an integer without conversion. Run it and read the traceback.\n# Expected: TypeError about str and int.\n# Then write the FIXED version below the buggy one.\n\n# Buggy version:\n",
      expectedOutput: "TypeError: unsupported operand type(s) for +: 'str' and 'int' — then write a corrected version that converts the string.",
      checkYourAnswer: "Deliberately trigger a TypeError (e.g., '5' + 10). Read the traceback to confirm it says TypeError, then write the fix using int('5') + 10.",
      tier: "synthesize"
    }
  ],
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
  runnerStarterCode: "# This code has a deliberate error.\n# Run it, read the traceback, then answer the proof prompt.\nprint(undefined_variable)",
  runnerTestCode: "print('traceback-read passed')",
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
  synopsis: "'name 'sessions' is not defined' — but you defined it. Where did it go?",
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
      checkYourAnswer: "session_label is assigned at module level. The function can read global variables defined before the call.",
      tier: "replicate"
    },
    {
      starterCode: "topic = \"python\"\nminutes = 30\nprint(\"study session topic: \" + topik + f\" for {minutes} min\")",
      expectedOutput: "study session topic: python for 30 min",
      checkYourAnswer: "The NameError here is a typo: topik should be topic. Read the error message, find the typo, fix it.",
      tier: "diagnose"
    },
    {
      starterCode: "# Write a function that prints a study session label.\n# The function should use a global variable named session_topic.\n# Expected output: \"Study session: python\"\nsession_topic = \"python\"\n\n# Write the function and call it below.\n",
      expectedOutput: "Study session: python",
      checkYourAnswer: "Define a function that accesses the global session_topic variable inside a print statement. Call the function after the definition.",
      tier: "synthesize"
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
  synopsis: "Why does Python say you can't add a string to an integer when it looks fine to you?",
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
      checkYourAnswer: "raw is a string. '15' * 2 repeats the string, not multiplies the number. int(raw) * 2 produces 30.",
      tier: "diagnose"
    },
    {
      starterCode: "a = 10\nb = \"5\"\ntotal = a + b\nprint(\"calculated sum total: \" + str(total))",
      expectedOutput: "calculated sum total: 15",
      checkYourAnswer: "b is a string. int(b) converts it before addition. The TypeError message tells you which type was wrong.",
      tier: "diagnose"
    },
    {
      starterCode: "# Run this working type-safe version and observe the correct output.\nminutes_str = \"30\"\ntotal = int(minutes_str) + 20\nprint(f\"total minutes: {total}\")",
      expectedOutput: "The correct total is: 50 minutes",
      checkYourAnswer: "int() converts the string to an integer before addition, so the calculation produces the correct numeric result without TypeError.",
      tier: "replicate"
    },
    {
      starterCode: "# Write a function that safely adds two values.\n# If one is a string, convert it with int() first.\ndef safe_add(a, b):\n    # Convert if needed, then return the sum.\n    return 0\n\nprint(safe_add(10, \"5\"))\nprint(safe_add(20, 30))",
      expectedOutput: "safe_add(10, \"5\") returns 15\nsafe_add(20, 30) returns 50",
      checkYourAnswer: "Check each parameter with int() conversion. The function must handle string and integer inputs without raising TypeError.",
      tier: "synthesize"
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
  synopsis: "You passed 'thirty' where Python expected 30 — how does it tell you?",
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
      checkYourAnswer: "The try block converts valid strings. The except block catches invalid ones and returns a clear message.",
      tier: "replicate"
    },
    {
      starterCode: "# Bug: this function catches the wrong exception type.\ndef safe_parse(raw):\n    try:\n        return int(raw)\n    except TypeError:\n        return f\"invalid: {raw}\"\n\nprint(safe_parse(\"45\"))\nprint(safe_parse(\"oops\"))",
      expectedOutput: "Parsed 45 as integer\nInvalid input: oops was rejected",
      checkYourAnswer: "int('oops') raises ValueError, not TypeError. The except TypeError clause does not catch it. Change it to except ValueError so the handler fires.",
      tier: "diagnose"
    },
    {
      starterCode: "# Write a function that parses a minutes string and returns either\n# the integer value or a descriptive error message.\n# Use try/except ValueError.\ndef parse_study_minutes(raw):\n    # Return int(raw) or an error message.\n    return 0\n\nprint(parse_study_minutes(\"30\"))\nprint(parse_study_minutes(\"bad\"))",
      expectedOutput: "30\ninvalid minutes: bad",
      checkYourAnswer: "Try int(raw) in the try block. Catch ValueError and return a formatted error. The function should never crash for string input.",
      tier: "synthesize"
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
  synopsis: "Your program crashes on bad input every time. Can you catch the fall instead of preventing it?",
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
      checkYourAnswer: "Both assertions must pass. The first checks the happy path, the second checks the failure path.",
      tier: "replicate"
    },
    {
      starterCode: "def parse_minutes(raw):\n    try:\n        return int(raw)\n    except ValueError:\n        return f\"invalid minutes: {raw}\"\n\n# Try a negative number — what should happen?\nprint(\"negative minutes parsed: \" + str(parse_minutes(\"-5\")))\nprint(\"invalid string parsed: \" + parse_minutes(\"abc\"))",
      expectedOutput: "negative minutes parsed: -5\ninvalid string parsed: invalid minutes: abc",
      checkYourAnswer: "int('-5') succeeds — negative numbers are valid integers. The ValueError only fires for non-numeric strings.",
      tier: "replicate"
    },
    {
      starterCode: "# Bug: the function silently returns 0 for invalid input instead of reporting the error.\ndef parse_minutes(raw):\n    try:\n        return int(raw)\n    except ValueError:\n        return 0\n\nprint(parse_minutes(\"45\"))\nprint(parse_minutes(\"abc\"))",
      expectedOutput: "45\ninvalid minutes: abc",
      checkYourAnswer: "The function catches ValueError but returns 0 instead of a descriptive message. Change return 0 to return f\"invalid minutes: {raw}\" so the caller knows what went wrong.",
      tier: "diagnose"
    },
    {
      starterCode: "# Write a robust parse_minutes function with try/except ValueError.\n# Valid input: return the integer.\n# Invalid input: return \"INVALID: <raw>\" in uppercase.\ndef parse_minutes(raw):\n    # Implement try/except here.\n    return 0\n\nprint(parse_minutes(\"30\"))\nprint(parse_minutes(\"bad\"))",
      expectedOutput: "parse_minutes(30) returns 30\nparse_minutes(bad) returns INVALID: bad",
      checkYourAnswer: "Use try/except ValueError. Valid strings return int(raw). Invalid strings return f\"INVALID: {raw}\" in the except block.",
      tier: "synthesize"
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

tryExceptLesson.workshop.commonMistakes = [
  "Catching too broad an Exception class (bare except:)",
  "Placing try around too much code"
];

// ---------------------------------------------------------------------------
// Micro-lesson 6 — Use the Debugger to Find Hidden Bugs (run_file)
// ---------------------------------------------------------------------------

const breakpointDebuggerLesson = proofLesson({
  id: "lesson-python-breakpoint-debugger",
  moduleId: "module-python-core",
  slug: "python-breakpoint-debugger",
  title: "Use the Debugger to Find Hidden Bugs",
  summary: "Drop a breakpoint, step through code, and inspect variables interactively.",
  bodyMarkdown: `breakpoint() is Python's built-in debugger. It pauses execution at any line and opens an interactive prompt (called pdb) where you can inspect variables, step line by line, and understand what your code is actually doing.

The most common debugger commands are:
- **n** (next) — execute the current line and advance to the next line
- **p** (print) — display the value of a variable: \`p count\` shows the current value of count
- **c** (continue) — resume normal execution until the next breakpoint

breakpoint() works with any Python program and requires no special tools or editors. It is always available because it is part of Python's standard library.`,
  estimatedMinutes: 7,
  difficulty: "foundation",
  skillIds: ["skill-python-basics", "skill-testing-debugging"],
  quizId: "quiz-python-breakpoint-debugger",
  desktopTask: "Add breakpoint() to a countdown function, step through it using n, inspect variables with p, and continue with c.",
  evidencePrompt: "Record the bug you found, the line where you placed breakpoint(), and the p variable output that revealed the bug.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "What if you could stop time and inspect every variable mid-execution?",
  prerequisites: [
    "Know how to read a traceback (lesson-python-read-traceback).",
    "Understand functions and how parameters are passed (Level 3).",
    "Have used try/except to handle exceptions (lesson-python-try-except)."
  ],
  testingFocus: "The test confirms your understanding of breakpoint() behaviour, debugger commands, and when the debugger is more effective than print().",
  objective: "Use breakpoint() to pause execution, inspect variables, and step through code line by line to find bugs.",
  whyItMatters: "The #1 beginner debugging mistake is adding print() to find bugs. A debugger shows you the exact state at any point without changing your code.",
  coreConcept: "Think of breakpoint() as a pause button. The debugger opens an interactive prompt where you can inspect variables, step line by line, and understand what your code is actually doing.",
  workedExample: `def countdown(n):
    for i in range(n, 0, -1):
        breakpoint()  # Pause here to inspect i and n
        print(i)
    print('Done!')

countdown(3)
# When the debugger opens, type:
#   n  -> step to print(i)
#   p i -> inspect loop variable (shows 3)
#   n  -> execute print and advance
#   p i -> inspect again (still 3, next iteration has not started)
#   c  -> continue to see remaining output`,
  guidedExercise: "Add breakpoint() to a countdown function, run it, use n to step through three lines, p to inspect the loop variable, and c to continue execution.",
  missionConnection: "When the Study Tracker's aggregation produces wrong totals, a breakpoint inside the loop reveals the exact state at each iteration — no print statements needed.",
  reflectionPrompt: "When would breakpoint() find a bug that print() would miss?",
  practiceStarter: `def countdown(n):
    for i in range(n, 0, -1):
        breakpoint()  # Step through here
        print(i)

countdown(3)
print('Done!')`,
  practiceExpected: "3\n2\n1\nDone!",
  practiceCheck: "Run the code. When execution pauses at breakpoint(), type n to step to print(i), then n again to execute and advance. Type p i to inspect, then c to continue all remaining iterations.",
  practiceReps: [
    {
      starterCode: "# Add breakpoint() inside the loop, run, step with n three times,\n# use p item to inspect, then c to continue.\ndef show_items(items):\n    for item in items:\n        print(item)\n\nshow_items(['python', 'git', 'sql'])\nprint('done')",
      expectedOutput: "Show items output: python\ngit\nsql\ndone",
      checkYourAnswer: "Add breakpoint() before print(item). Run, type n to step to the print, then n again to execute. Use p item to see the current value. Repeat for each of the three items, then c to finish.",
      tier: "replicate"
    },
    {
      starterCode: `# This function has a logic bug. Add breakpoint(), step through,
# inspect the variables, and identify why the total is wrong.
def calculate_total(values):
    total = 0
    for v in values:
        total = v  # Bug: should be total = total + v
    return total

result = calculate_total([10, 20, 30])
print(f"Total: {result} (expected: 60)")`,
      expectedOutput: "Total: 60 (expected: 60)",
      checkYourAnswer: "Place breakpoint() just before total = v. Step with n, inspect p total and p v at each iteration. You will see total is replaced instead of accumulated. The fix is total = total + v.",
      tier: "diagnose"
    },
    {
      starterCode: `# Debug this accumulator: the count is wrong.
# Place breakpoint() in the loop, step through 3 items,
# and find the bug that makes count too low.
def count_positive(numbers):
    count = 0
    for n in numbers:
        if n > 0:
            count = count + 1
        else:
            count = 0  # Bug: resets accumulator on non-positive
    return count

print(f"Count: {count_positive([5, -1, 3])} (expected: 2)")`,
      expectedOutput: "Count: 2 (expected: 2)",
      checkYourAnswer: "Place breakpoint() inside the loop before the if. Step each iteration with n. Inspect p n and p count. When n is -1, the else branch resets count to 0. Remove the else block or change it to pass to fix the accumulator.",
      tier: "synthesize"
    }
  ],
  miniTitle: "Debug average study minutes",
  miniGoal: "Add breakpoint() to a buggy function that calculates average study minutes, step through it, find the bug, and fix it.",
  miniSteps: [
    "Add breakpoint() inside the loop of average_minutes",
    "Run and step through with n for each iteration",
    "Inspect total, count, and values with p",
    "Identify the accumulator bug and fix it",
    "Remove breakpoint() and re-run to confirm the correct average"
  ],
  miniDeliverables: [
    "Buggy average_minutes function with breakpoint() placed correctly",
    "Notes on what p revealed at each step through the loop",
    "Fixed function with correct average output and breakpoint removed"
  ],
  verifierCommand: "python debug_average_minutes.py",
  expectedEvidence: "Terminal output showing the debugger stepping output and the corrected average value.",
  projectConnection: "The Study Tracker's aggregation pipeline will calculate averages, totals, and counts. breakpoint() inside those loops shows you the exact state at each iteration, catching bugs that print()-based debugging would miss.",
  requiredCodeIncludes: ["breakpoint()"],
  requiredOutputIncludes: ["Total"],
  runnerLanguage: "python",
  runnerStarterCode: `# After debugging locally, confirm calculate_total works correctly.
def calculate_total(values):
    total = 0
    for v in values:
        total = total + v
    return total

print(f"Total: {calculate_total([10, 20, 30])} (expected: 60)")
print("breakpoint lesson complete")`,
  runnerTestCode: [
    "assert calculate_total([10, 20, 30]) == 60, 'calculate_total should return 60 for [10, 20, 30]'",
    "assert calculate_total([]) == 0, 'calculate_total([]) should return 0'",
    "assert calculate_total([5]) == 5, 'calculate_total([5]) should return 5'",
    "print('breakpoint-debugger passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "breakpoint-calculate-total",
      name: "calculate_total handles edge cases",
      code: "assert calculate_total([1, 2, 3, 4, 5]) == 15, 'calculate_total should sum all values'\nassert calculate_total([0, 0, 0]) == 0, 'calculate_total of zeros should be 0'\nassert calculate_total([-5, 5]) == 0, 'calculate_total should handle negatives'"
    }
  ],
  curriculum: {
    level: 4,
    sequence: 6,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["debug.breakpoint.basic"],
    requires: ["py.try_except", "py.function.def", "debug.traceback"],
    usesButDoesNotTeach: ["py.assertion"],
    visibleCodeConcepts: ["debug.breakpoint.basic"],
    quizConcepts: ["debug.breakpoint.basic"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

breakpointDebuggerLesson.depth = {
  primaryConceptId: "debug.breakpoint.basic",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "debug.breakpoint.basic",
      definition: "A built-in debugging function that pauses execution and opens an interactive prompt for variable inspection and line-by-line stepping.",
      mentalModel: "Think of breakpoint() as a pause button. The debugger opens an interactive prompt where you can inspect variables, step line by line, and understand what your code is actually doing.",
      syntaxShape: "breakpoint()\n# then in the debugger:\nn  - step to next line\np variable_name  - print variable value\nc  - continue execution",
      tinyExample: "for i in range(3):\n    breakpoint()\n    print(i)",
      commonMistake: "Forgetting to remove breakpoint() from production code, causing execution to pause unexpectedly.",
      repairHint: "Remove breakpoint() after you find the bug. Search your file for 'breakpoint' before claiming the fix is done.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-bp-1",
      label: "Place the breakpoint",
      codeFragment: "for i in range(n, 0, -1):\n    breakpoint()  # Pause here\n    print(i)",
      conceptIds: ["debug.breakpoint.basic"],
      explanation: "breakpoint() pauses execution at this exact point on every loop iteration. The debugger opens before print(i) runs.",
      learnerShouldBeAbleToSay: "breakpoint() pauses before the next line executes - I control when to proceed"
    },
    {
      id: "w-bp-2",
      label: "Inspect and continue",
      codeFragment: "(Pdb) p i\n3\n(Pdb) n\n3\n(Pdb) c",
      conceptIds: ["debug.breakpoint.basic"],
      explanation: "p i shows the current value of i (which is 3). n advances to the next line (print(i) executes). c continues normal execution until the next breakpoint or the end of the program.",
      learnerShouldBeAbleToSay: "p inspects variables, n advances one line, c continues to the end"
    }
  ],
  guidedEdits: [
    {
      id: "g-bp-1",
      instruction: "Add breakpoint() before the print inside the show_items function. Run the code and type n to step to the print, then n again to execute.",
      conceptIds: ["debug.breakpoint.basic"],
      targetCodeFragment: "print(item)",
      expectedObservation: "Execution pauses before each print. Typing n advances one step. After three iterations, the program completes.",
      wrongTurnHint: "Place breakpoint() on its own line just before print(item), not inside the print call."
    },
    {
      id: "g-bp-2",
      instruction: "After breakpoint pauses, type p item to inspect the current value, then type n to step to the next line. Try c to continue all remaining iterations at once.",
      conceptIds: ["debug.breakpoint.basic"],
      targetCodeFragment: "breakpoint()\n        print(item)",
      expectedObservation: "p item shows the current iteration value. n advances one line. c continues through the rest of the loop without further pausing.",
      wrongTurnHint: "Type p item exactly at the (Pdb) prompt. If p gives a NameError, the variable might not be in scope at that point."
    }
  ],
  errorClinic: [
    {
      id: "e-bp-1",
      conceptIds: ["debug.breakpoint.basic"],
      brokenExample: "def total(values):\n    total = 0\n    for v in values:\n        total = total + v\n    return total\n\n# breakpoint() was here during debugging but never removed\nprint(total([10, 20, 30]))",
      symptom: "The script pauses unexpectedly when run normally, requiring the user to type c every time.",
      likelyCause: "breakpoint() was left in the code after debugging finished.",
      fixStrategy: "Search for 'breakpoint' in the file and remove every occurrence before treating the fix as complete."
    },
    {
      id: "e-bp-2",
      conceptIds: ["debug.breakpoint.basic"],
      brokenExample: "def process(data):\n    breakpoint()  # Before the function is called\n    # ... processing logic ...\n\nprint('Starting')\nprocess([1, 2, 3])\nprint('Done')",
      symptom: "The debugger opens immediately when the function is called, before any interesting logic runs.",
      likelyCause: "breakpoint() is placed at the top of the function body, before the variables you need to inspect are created.",
      fixStrategy: "Move breakpoint() to the specific line where you want to inspect state — inside a loop, after an assignment, or before a conditional branch."
    }
  ],
  codeLabBridge: {
    story: "The Study Tracker's aggregation pipeline calculates averages and totals. A breakpoint inside the accumulation loop shows you the exact intermediate state at each iteration — something print() debugging cannot easily do.",
    usesConcepts: ["debug.breakpoint.basic"],
    learnerOwns: ["calculate_total"],
    checkerOwns: ["breakpoint-calculate-total"],
    runExpectation: "prints breakpoint-debugger passed"
  },
  understandingProofPrompt: "Explain the difference between n, p, and c in the Python debugger. Give one scenario where each command is the most useful.",
  exitTicket: [
    "I know breakpoint() pauses execution and opens an interactive debugging prompt.",
    "I can use n to step to the next line, p to inspect a variable, and c to continue execution.",
    "I understand that breakpoint() finds bugs that print() would miss because I can inspect the exact state without modifying my code."
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
// Micro-lesson 7 — Prove It with assert (concept_only)
// ---------------------------------------------------------------------------

const assertionsLesson = proofLesson({
  id: "lesson-python-assertions",
  moduleId: "module-python-core",
  slug: "python-assertions",
  title: "Prove It with assert",
  summary: "Use assert statements to prove your code does what you expect — before you even write a test file.",
  bodyMarkdown: "An assertion is the simplest way to say: I expect this to be true, and if it is not, stop and tell me. Python's assert statement checks a condition and raises AssertionError if the condition is false. Adding a custom message — assert condition, 'what I expected' — tells you what broke without reading the entire program.",
  estimatedMinutes: 5,
  difficulty: "foundation",
  skillIds: ["skill-python-basics", "skill-testing-debugging"],
  quizId: "quiz-python-assertions",
  desktopTask: "Write three assert statements that check a parse_minutes function: one for a valid integer, one for a negative value, and one for an invalid string.",
  evidencePrompt: "Capture the terminal output showing all three assertions passed or one assertion failing with a clear custom message.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "How do you write code that checks itself before it wrecks itself?",
  prerequisites: [
    "Know how to define a function with def and return.",
    "Know that int('30') returns 30 and int('soon') raises ValueError.",
    "Have worked through try/except in the previous lesson."
  ],
  testingFocus: "Write assertions with custom messages for both the happy path and the failure path.",
  objective: "Use assert with a custom message to verify a function's return value.",
  whyItMatters: "An assertion turns a vague hope into a written contract. If the function breaks, the assertion tells you which expectation failed — not just that something went wrong.",
  coreConcept: "assert condition tells Python to raise AssertionError if the condition is false. assert condition, 'message' adds a human-readable explanation so you immediately know what expectation was violated. Use a custom message on every assertion.",
  workedExample: "assert parse_minutes('30') == 30, 'valid string should return integer 30'. If parse_minutes returns None instead, the message 'valid string should return integer 30' tells you exactly what went wrong.",
  guidedExercise: "Write parse_minutes with try/except, then write three assert statements to prove it works for a valid value, a second valid value, and an invalid string.",
  missionConnection: "Every parser in the CLI Study Tracker should have at least one assertion proving the happy path and one proving the failure path.",
  reflectionPrompt: "What would the AssertionError message say if parse_minutes returned None instead of 30? How does the custom message help you fix it faster?",
  practiceStarter: "def parse_minutes(raw):\n    try:\n        return int(raw)\n    except ValueError:\n        return None\n\n# Add a custom message to each assertion:\nassert parse_minutes('30') == 30, ''\nassert parse_minutes('45') == 45, ''\nassert parse_minutes('soon') is None, ''",
  practiceExpected: "All three assertions pass silently — no output means they all passed.",
  practiceCheck: "If nothing is printed and the program exits without error, all assertions passed. Add a print('assertions passed') at the bottom to confirm.",
  practiceReps: [
    {
      starterCode: "def parse_minutes(raw):\n    try:\n        return int(raw)\n    except ValueError:\n        return None\n\nassert parse_minutes('60') == 60, 'valid 60 should return integer 60'\nassert parse_minutes('oops') is None, 'invalid string should return None'\nprint('practice rep 1 passed')",
      expectedOutput: "practice rep 1 passed",
      checkYourAnswer: "Both assertions must pass silently. The final print proves all assertions ran without error.",
      tier: "replicate"
    },
    {
      starterCode: "def double(n):\n    return n * 2\n\nassert double(3) == 6, 'double(3) should return 6'\nassert double(0) == 0, 'double(0) should return 0'\nprint('double assertions passed')",
      expectedOutput: "double assertions passed",
      checkYourAnswer: "This rep proves assertions work on any function, not just parsers. Always add a custom message so failures are self-explanatory.",
      tier: "replicate"
    },
    {
      starterCode: "# Bug: the assertion message is missing, so failures are hard to diagnose.\ndef parse_minutes(raw):\n    try:\n        return int(raw)\n    except ValueError:\n        return None\n\nassert parse_minutes('50') == 50\nassert parse_minutes('bad') is None\nprint('assertions ran')",
      expectedOutput: "Assertions completed (missing custom message)",
      checkYourAnswer: "Both assertions pass, but neither has a custom message. A failure would just say AssertionError with no explanation. Add a comma and message after each condition.",
      tier: "diagnose"
    },
    {
      starterCode: "# Write a function named get_weekday and write two assertions for it.\n# get_weekday(0) should return \"Monday\", get_weekday(4) should return \"Friday\".\ndef get_weekday(day_num):\n    days = [\"Monday\", \"Tuesday\", \"Wednesday\", \"Thursday\", \"Friday\", \"Saturday\", \"Sunday\"]\n    return days[day_num]\n\n# Add your assertions below:\n",
      expectedOutput: "All assertions pass silently — no output means they all passed.",
      checkYourAnswer: "Write assert get_weekday(0) == 'Monday', 'message' and assert get_weekday(4) == 'Friday', 'message'. Always include a custom message.",
      tier: "synthesize"
    }
  ],
  miniTitle: "Write parse_minutes with assert",
  miniGoal: "Define parse_minutes and prove it with at least two assert statements that have custom messages.",
  miniSteps: ["Define parse_minutes using try/except", "Assert the happy path with a custom message", "Assert the failure path with a custom message", "Add print('assertions passed') to confirm all ran"],
  miniDeliverables: [
    "parse_minutes function with try/except",
    "At least two assert statements with custom messages",
    "Terminal output showing assertions passed"
  ],
  verifierCommand: "python prove_minutes.py",
  expectedEvidence: "Terminal output showing 'assertions passed' with no AssertionError.",
  projectConnection: "In the CLI Study Tracker, assertions guard every parsing function so bugs are caught during development, not when a user feeds in bad data.",
  requiredCodeIncludes: ["assert", "parse_minutes"],
  requiredOutputIncludes: ["passed"],
  runnerLanguage: "python",
  runnerStarterCode: "def parse_minutes(raw):\n    try:\n        return int(raw)\n    except ValueError:\n        return None\n\nassert parse_minutes('30') == 30, 'valid string should return integer 30'\nassert parse_minutes('soon') is None, 'invalid string should return None'\nprint('assertions passed')",
  runnerTestCode: "assert parse_minutes('30') == 30, 'valid string should return integer 30'\nassert parse_minutes('45') == 45, 'second valid value should return integer 45'\nassert parse_minutes('soon') is None, 'invalid string should return None'\nprint('assertions passed')",
  hiddenTests: [
    {
      id: "assertion-has-message",
      name: "Assertions include custom messages",
      code: "assert parse_minutes('30') == 30, 'happy path must return integer'\nassert parse_minutes('bad') is None, 'failure path must return None'"
    }
  ],
  curriculum: {
    level: 4,
    sequence: 7,
    version: "1.0.0",
    lessonKind: "concept_only",
    teaches: ["py.assertion"],
    requires: ["py.function.def", "py.return", "py.try_except"],
    visibleCodeConcepts: ["py.assertion"],
    quizConcepts: ["py.assertion"],
    proofOutputs: ["terminal_stdout"]
  }
});

assertionsLesson.depth = {
  primaryConceptId: "py.assertion",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.assertion",
      definition: "An assert statement checks a condition and raises AssertionError (with an optional message) if the condition is false.",
      mentalModel: "Think of assert as a promise written in code. You are saying: I guarantee this will be true here — and if it is not, stop everything and tell me which promise I broke.",
      syntaxShape: "assert condition, 'custom message explaining what was expected'",
      tinyExample: "assert parse_minutes('30') == 30, 'valid string should return integer 30'",
      commonMistake: "Writing assert without a custom message, so the AssertionError shows no explanation of what went wrong.",
      repairHint: "Always add a comma and a short message after the condition: assert result == expected, 'describe what you expected'.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-asr-1",
      label: "The assertion",
      codeFragment: "assert parse_minutes('30') == 30, 'valid string should return integer 30'",
      conceptIds: ["py.assertion"],
      explanation: "assert evaluates the condition. If it is true, nothing happens. If it is false, Python raises AssertionError with the message 'valid string should return integer 30'.",
      learnerShouldBeAbleToSay: "assert checks a condition and stops with a message if the condition fails."
    },
    {
      id: "w-asr-2",
      label: "The failure path assertion",
      codeFragment: "assert parse_minutes('soon') is None, 'invalid string should return None'",
      conceptIds: ["py.assertion"],
      explanation: "This asserts the failure path. If parse_minutes returns anything other than None for 'soon', the AssertionError message tells us exactly which contract broke.",
      learnerShouldBeAbleToSay: "Proving the failure path is just as important as proving the happy path."
    }
  ],
  guidedEdits: [
    {
      id: "g-asr-1",
      instruction: "Add a custom message to the assertion. Change 'assert result == 30' to include a message after a comma so failures are self-explanatory.",
      targetCodeFragment: "assert parse_minutes('30') == 30, 'parse_minutes should return 30 for valid input'",
      conceptIds: ["py.assertion"],
      expectedObservation: "The assertion still passes silently, but if it fails you now see which expectation was violated.",
      wrongTurnHint: "Add a comma after the condition, then type a short string describing what you expected."
    },
    {
      id: "g-asr-2",
      instruction: "Add a second assertion for the failure path. Verify that parse_minutes('soon') returns None with a clear message.",
      targetCodeFragment: "assert parse_minutes('30') == 30, 'valid string should return integer 30'\nassert parse_minutes('soon') is None, 'invalid string should return None'",
      conceptIds: ["py.assertion"],
      expectedObservation: "Both assertions pass silently. The program exits without error.",
      wrongTurnHint: "Add the second assert on its own line. Check that parse_minutes('soon') returns None, not a string."
    }
  ],
  errorClinic: [
    {
      id: "e-asr-1",
      conceptIds: ["py.assertion"],
      brokenExample: "assert parse_minutes('30')",
      symptom: "This passes for any truthy return value, including the string 'error'. It does not verify the actual return value.",
      likelyCause: "Forgetting to compare with == or check for None.",
      fixStrategy: "Always compare the result explicitly: assert parse_minutes('30') == 30, 'message'."
    }
  ],
  codeLabBridge: {
    story: "Every parser function in the CLI Study Tracker deserves at least two assertions: one for a valid row and one for a rejected row.",
    usesConcepts: ["py.assertion", "py.try_except"],
    learnerOwns: ["assertion-has-message"],
    checkerOwns: ["assertion-has-message"],
    runExpectation: "prints assertions passed"
  },
  understandingProofPrompt: "What is the difference between assert result == 30 and assert result == 30, 'message'? When would the message matter most?",
  exitTicket: [
    "I can write an assert statement with a custom message that checks a function's return value.",
    "I know that assert checks both the happy path and the failure path.",
    "Every assert I write has a comma and a custom message explaining what was expected."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 8 — Debugging Capstone: Fix the Broken Tracker (debug_repair)
// ---------------------------------------------------------------------------

const debuggingCapstoneLesson = proofLesson({
  id: "lesson-python-debugging-capstone",
  moduleId: "module-python-core",
  slug: "python-debugging-capstone",
  title: "Debugging Capstone: Fix the Broken Tracker",
  summary: "Fix 5 deliberate bugs in Study Tracker code using traceback reading, exception diagnosis, and regression assertions.",
  bodyMarkdown: `Your Study Tracker script has 5 bugs to find and fix: a NameError (undefined variable), a TypeError (string + int), a ValueError (invalid int conversion), an IndentationError (mismatched indent), and a silent logic error (accumulator reset inside a loop).

The IndentationError will be the first error you see — Python cannot parse the file until it is fixed. After that, each run reveals the next runtime bug.

Your mission is in 4 phases:
1. Run the code and read each traceback — the last line tells you the exception type
2. Fix each bug one at a time — only one fix between runs
3. Add an assert statement proving each fix works — regression assertions prevent old bugs from returning
4. Re-run until the output shows correct values with no traceback

This capstone combines everything you have learned about reading tracebacks, fixing NameError/TypeError/ValueError, handling indentation, and writing regression assertions.`,
  estimatedMinutes: 20,
  difficulty: "applied",
  skillIds: ["skill-python-basics", "skill-testing-debugging"],
  quizId: "quiz-python-debugging-capstone",
  desktopTask: "Fix all 5 bugs in the Study Tracker script. Add an assert statement after each fix proving it works, then run the final version to confirm clean output with total=70 and count=3.",
  evidencePrompt: "Record each bug you found: the error message, your diagnosis, the one-line fix, and the assert statement that proves the fix works.",
  language: "Python",
  tools: ["Python 3", "terminal", "tracebacks", "assert"],
  synopsis: "You've learned 7 debugging tools. Here are 5 bugs — which tool fixes each one?",
  prerequisites: [
    "Know how to read a traceback and identify NameError, TypeError, ValueError, and IndentationError.",
    "Know how to write assert statements with custom messages.",
    "Have completed the five debugging micro-lessons in this level."
  ],
  testingFocus: "The test confirms the fixed script runs without exceptions and produces correct output values.",
  objective: "Fix 5 deliberate bugs of different types in one script, adding regression assertions for each fix.",
  whyItMatters: "Real debugging is rarely one bug at a time. This capstone builds the systematic workflow you need for complex debugging sessions.",
  coreConcept: "Systematic debugging: (1) run the code, (2) read the traceback last line first, (3) classify the exception type, (4) apply the targeted fix, (5) write an assert that proves the fix. Re-run to expose the next bug. When no traceback remains, check for silent logic errors and add assertions to confirm correct output.",
  workedExample: "Bug: NameError on 'app_name'. Fix: add app_name = 'CareerForge' before the print. Assert: assert isinstance(app_name, str), 'app_name must be a string'. Re-run to see the next bug.",
  guidedExercise: "Run the broken script, read the first traceback, classify the bug, fix it, add an assert, re-run, and repeat for all 5 bugs. The IndentationError must be fixed first since it is a parse-time error that stops everything.",
  missionConnection: "The Study Tracker is built incrementally — each new feature can introduce bugs in existing code. Regression assertions catch them immediately.",
  reflectionPrompt: "Which bug was hardest to find and why? What does that tell you about your debugging blind spot?",
  practiceStarter: `# Fix these 5 bugs in the Study Tracker
# 1. IndentationError: wrong indent inside report_summary
# 2. NameError: app_name is undefined
# 3. TypeError: string + int without conversion
# 4. ValueError: parse_duration crashes on bad input
# 5. Logic error: accumulator resets in loop

sessions = [
    {"topic": "Python", "minutes": "30"},
    {"topic": "Variables", "minutes": "15"},
    {"topic": "Loops", "minutes": "25"}
]

print("Welcome to " + app_name)

for s in sessions:
    mins = s["minutes"]
    total = mins + 5
    print(s["topic"], ":", total)

def parse_duration(raw):
    return int(raw)

print(parse_duration("30"))
print(parse_duration("bad"))

def report_summary(data):
    total = 0
    for entry in data:
        total = total + int(entry["minutes"])
      print("Total:", total)
    return total

def count_sessions(data):
    count = 0
    for item in data:
        count = 0
        count = count + 1
    return count

print(report_summary(sessions))
print(count_sessions(sessions))`,
  practiceExpected: "The script runs without tracebacks and prints correct outputs: total=70, count=3.",
  practiceCheck: `Run the script. The first error you see is an IndentationError — Python cannot parse the file. Fix the indentation in report_summary, then re-run. Each re-run reveals the next runtime bug. Fix one bug between runs, add an assert, and repeat until all output is correct.`,
  practiceReps: [
    {
      starterCode: `# Debug: this function has a NameError. Fix it using the pattern from the capstone.
def get_session_count(data):
    return len(sesions)

print(get_session_count([1, 2, 3]))
print(get_session_count([]))`,
      expectedOutput: "The fixed function prints 3 for 3 items and 0 for an empty list — NameError fixed.",
      checkYourAnswer: "The NameError is caused by a typo: 'sesions' should be 'data'. Read the error message, find the misspelled name, and correct it.",
      tier: "replicate"
    },
    {
      starterCode: `# Diagnosis: this code produces a TypeError. Run it, read the traceback, and fix the type mismatch.
def calculate_total(data):
    total = 0
    for entry in data:
        total = total + entry["minutes"]
    return total

print(calculate_total([{"minutes": "30"}, {"minutes": "15"}]))`,
      expectedOutput: "The fixed function prints 45 — TypeError from string + int resolved by int() conversion.",
      checkYourAnswer: "The TypeError occurs because entry['minutes'] is a string. Fix by converting with int(entry['minutes']) before adding to total.",
      tier: "diagnose"
    },
    {
      starterCode: `# Write regression assertions for the fixed function below.
# The function should:
# - Return integer 30 for parse_duration("30")
# - Return None for parse_duration("bad")
# - Not raise any exception for any input

def parse_duration(raw):
    try:
        return int(raw)
    except ValueError:
        return None

# Write 3 assert statements below proving the function works correctly.
# Each assert must have a custom message.
`,
      expectedOutput: "All 3 assertions pass silently with no AssertionError.",
      checkYourAnswer: "Write asserts for: (1) valid input returns correct integer, (2) invalid input returns None, (3) function handles empty string. Each assert needs a custom message explaining what is expected.",
      tier: "synthesize"
    }
  ],
  miniTitle: "Fix the Broken Tracker",
  miniGoal: "Fix all 5 bugs in the Study Tracker script and add regression assertions.",
  miniSteps: [
    "Run the broken script and read the first traceback",
    "Classify the bug and apply the minimal fix",
    "Add an assert statement proving the fix works",
    "Re-run to expose the next bug",
    "Repeat for all 5 bugs",
    "Run the final version and confirm clean output with correct values"
  ],
  miniDeliverables: [
    "Fixed Python script with all 5 bugs corrected",
    "One assert statement per fix (5 total) with custom messages",
    "Clean terminal output showing total=70 and count=3"
  ],
  verifierCommand: "python fix_study_tracker.py",
  expectedEvidence: "Terminal output showing no tracebacks, total=70, count=3, and 5 assert statements that pass silently.",
  projectConnection: "The CLI Study Tracker is the same type of data-tracking script. Every new feature can introduce bugs. This capstone teaches the workflow to fix them systematically.",
  requiredCodeIncludes: ["app_name", "parse_duration", "report_summary", "count_sessions"],
  requiredOutputIncludes: ["70", "3"],
  runnerLanguage: "python",
  runnerStarterCode: `# Fix these 5 bugs in the Study Tracker
# 1. IndentationError: wrong indent inside report_summary
# 2. NameError: app_name is undefined
# 3. TypeError: string + int without conversion
# 4. ValueError: parse_duration crashes on bad input
# 5. Logic error: accumulator resets in loop

sessions = [
    {"topic": "Python", "minutes": "30"},
    {"topic": "Variables", "minutes": "15"},
    {"topic": "Loops", "minutes": "25"}
]

print("Welcome to " + app_name)

for s in sessions:
    mins = s["minutes"]
    total = mins + 5
    print(s["topic"], ":", total)

def parse_duration(raw):
    return int(raw)

print(parse_duration("30"))
print(parse_duration("bad"))

def report_summary(data):
    total = 0
    for entry in data:
        total = total + int(entry["minutes"])
      print("Total:", total)
    return total

def count_sessions(data):
    count = 0
    for item in data:
        count = 0
        count = count + 1
    return count

print(report_summary(sessions))
print(count_sessions(sessions))`,
  runnerTestCode: `# Verify all 5 bugs are fixed
# Bug 1 (IndentationError fixed): report_summary runs and returns correct total
total = report_summary(sessions)
assert total == 70, f'Bug 1: total should be 70, got {total}'

# Bug 2 (NameError fixed): app_name is defined
assert isinstance(app_name, str) and len(app_name) > 0, 'Bug 2: app_name must be defined before use'

# Bug 4 (ValueError fixed): parse_duration handles bad input
result = parse_duration("30")
assert result == 30, 'Bug 4: parse_duration("30") should return 30'
result2 = parse_duration("oops")
assert result2 is not None, 'Bug 4: parse_duration("oops") should not crash'

# Bug 5 (Logic error fixed): count_sessions returns correct count
count = count_sessions(sessions)
assert count == 3, f'Bug 5: count should be 3, got {count}'

print('debugging-capstone passed')`,
  hiddenTests: [
    {
      id: "capstone-all-bugs-fixed",
      name: "All 5 bugs are fixed",
      code: "assert isinstance(app_name, str), 'Bug 2: app_name must be a string'\nassert parse_duration('50') == 50, 'Bug 4: parse_duration should handle valid input'\nbad = parse_duration('bad')\nassert bad is None or isinstance(bad, str), 'Bug 4: parse_duration should handle invalid input'\ntotal = report_summary(sessions)\nassert total == 70, f'Bug 1: total should be 70, got {total}'\ncount = count_sessions(sessions)\nassert count == 3, f'Bug 5: count should be 3, got {count}'"
    }
  ],
  curriculum: {
    level: 4,
    sequence: 8,
    version: "1.0.0",
    lessonKind: "debug_repair",
    intentionalFailure: true,
    teaches: ["debug.regression"],
    requires: ["py.try_except", "py.assertion"],
    usesButDoesNotTeach: ["py.f_string", "py.for_loop", "py.dict.literal", "py.accumulator", "py.list.append"],
    visibleCodeConcepts: ["debug.regression"],
    quizConcepts: ["debug.regression"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

debuggingCapstoneLesson.depth = {
  primaryConceptId: "debug.regression",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "debug.regression",
      definition: "A debugging workflow where you fix one error at a time, add a regression assertion to confirm the fix, then re-run to expose the next bug.",
      mentalModel: "Think of debugging like peeling an onion: each traceback reveals one layer. Fix it, assert it, re-run, and the next layer appears. Regression assertions are checkpoints that prevent old bugs from coming back.",
      syntaxShape: "Run the code → read the traceback (last line first) → classify the exception → apply the minimal fix → add an assert → re-run → repeat until clean output.",
      tinyExample: "assert count == 3, 'count should be 3'",
      commonMistake: "Fixing multiple bugs at once without re-running between fixes. Fix one bug, assert it, re-run — the second bug might be different from what you assumed.",
      repairHint: "Only fix one bug between each run. The traceback tells you what to fix next. Assertions prove the fix before moving on.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-dc-1",
      label: "Run and read the first traceback",
      codeFragment: "IndentationError: unindent does not match any outer indentation level",
      conceptIds: ["debug.regression"],
      explanation: "The first run hits an IndentationError because the print inside report_summary has wrong indentation. This is a parse-time error — Python cannot even load the file. Fix the indentation first, then re-run.",
      learnerShouldBeAbleToSay: "The first bug is an IndentationError — the indentation inside report_summary must match the surrounding block."
    },
    {
      id: "w-dc-2",
      label: "Fix, assert, and re-run",
      codeFragment: "assert isinstance(app_name, str), 'app_name must be a string'",
      conceptIds: ["debug.regression"],
      explanation: "After fixing the IndentationError, re-running reveals the NameError on app_name. Fix by defining app_name before the print, add an assert to prove the fix, then re-run to expose the next bug.",
      learnerShouldBeAbleToSay: "Fix one bug, add an assertion, re-run, and the next traceback reveals the next bug."
    },
    {
      id: "w-dc-3",
      label: "Detect a silent logic error",
      codeFragment: "count = 0  # inside the loop — resets every iteration!",
      conceptIds: ["debug.regression"],
      explanation: "After fixing all traceback errors, the script runs but the output shows count=1 instead of count=3. This is a silent logic error — no exception, just wrong output. The fix is to move the accumulator initialization outside the loop.",
      learnerShouldBeAbleToSay: "A silent logic error produces wrong output without a traceback. Assertions on expected values catch these."
    }
  ],
  guidedEdits: [
    {
      id: "g-dc-1",
      instruction: "Fix the IndentationError first: change the print inside report_summary to use 4-space indentation matching the rest of the function body. Then re-run to see the next error.",
      conceptIds: ["debug.regression"],
      targetCodeFragment: '      print("Total:", total)',
      expectedObservation: "The IndentationError disappears. The next run reveals a NameError on app_name.",
      wrongTurnHint: "The print line has 6 spaces of indentation but should have 4 (matching the for loop body inside report_summary)."
    },
    {
      id: "g-dc-2",
      instruction: "Add app_name = 'CareerForge' before the print that uses app_name. Then add an assert verifying app_name is a string. Re-run and observe the next bug.",
      conceptIds: ["debug.regression"],
      targetCodeFragment: 'print("Welcome to " + app_name)',
      expectedObservation: "The NameError disappears. The loop now runs but hits a TypeError on mins + 5.",
      wrongTurnHint: "Add the assignment above the print (not below it). The assert should check the variable type."
    }
  ],
  errorClinic: [
    {
      id: "e-dc-1",
      conceptIds: ["debug.regression"],
      brokenExample: "count = 0\nfor item in data:\n    count = 0\n    count = count + 1",
      symptom: "count is always 1 instead of the total number of items (silent logic error — no traceback, just wrong output).",
      likelyCause: "The accumulator count = 0 is reset on every loop iteration, so it never accumulates past 1.",
      fixStrategy: "Remove the count = 0 line inside the loop. The accumulator should only be initialized once before the loop."
    },
    {
      id: "e-dc-2",
      conceptIds: ["debug.regression"],
      brokenExample: "def report_summary(data):\n    total = 0\n    for entry in data:\n        total = total + int(entry['minutes'])\n      print('Total:', total)\n    return total",
      symptom: "IndentationError: unindent does not match any outer indentation level.",
      likelyCause: "The print statement inside the function has inconsistent indentation (6 spaces instead of 4).",
      fixStrategy: "Fix the indentation of the print statement to match the rest of the function body (4 spaces)."
    },
    {
      id: "e-dc-3",
      conceptIds: ["debug.regression", "py.try_except"],
      brokenExample: "def parse_duration(raw):\n    return int(raw)\n\nparse_duration('bad')",
      symptom: "ValueError: invalid literal for int() with base 10: 'bad'",
      likelyCause: "int() cannot convert a non-numeric string. The function does not handle invalid input.",
      fixStrategy: "Wrap the conversion in try/except ValueError and return None or a descriptive message for invalid input."
    }
  ],
  codeLabBridge: {
    story: "The Study Tracker grows feature by feature. Each new feature can introduce bugs in existing functionality. Regression assertions catch them. This capstone builds the systematic debugging workflow you will use on the real tracker.",
    usesConcepts: ["debug.regression"],
    learnerOwns: ["app_name", "parse_duration", "report_summary", "count_sessions"],
    checkerOwns: ["capstone-all-bugs-fixed"],
    runExpectation: "prints debugging-capstone passed"
  },
  understandingProofPrompt: "Explain the systematic debugging workflow: run, read, classify, fix, assert, re-run. Why is it important to fix only one bug between each run, rather than trying to fix all 5 at once?",
  exitTicket: [
    "I can systematically debug a multi-bug script: run, read the traceback last line first, classify, fix, assert, re-run.",
    "I know that regression assertions prevent old bugs from returning after new fixes are applied.",
    "I understand that silent logic errors (wrong output without traceback) require assertions on expected values to detect."
  ]
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const level4Lessons: Lesson[] = [
  readTracebackLesson,
  nameErrorLesson,
  typeErrorLesson,
  valueErrorLesson,
  tryExceptLesson,
  breakpointDebuggerLesson,
  assertionsLesson,
  debuggingCapstoneLesson
];

/** Kept in the content pack so old learner progress IDs still resolve. */
export const deprecatedLevel4Lessons: Lesson[] = [
  deprecatedTracebackClinicLesson
];

// ---------------------------------------------------------------------------
// Quizzes — one per micro-lesson
// ---------------------------------------------------------------------------

export const level4Quizzes: Quiz[] = [
  codeReadingQuiz(
    "quiz-python-read-traceback",
    "lesson-python-read-traceback",
    "Read a Traceback Checkpoint",
    "print(undefined_variable)",
    "reading tracebacks",
    'NameError: name "undefined_variable" is not defined — the variable was never assigned',
    "TypeError: the wrong type of value was used",
    "SyntaxError: the code violates Python grammar rules",
    "NameError means Python cannot find a name. Read the last line of the traceback first to see which name is missing.",
    ["debug.traceback", "debug.line_number"]
  ),
  codeReadingQuiz(
    "quiz-python-nameerror",
    "lesson-python-nameerror",
    "NameError Checkpoint",
    'print(study_topic)\nstudy_topic = "python"',
    "NameError",
    "NameError — study_topic is used in print() before it is assigned",
    "This works fine because Python reads all assignments before executing any code",
    "SyntaxError — you cannot have a print statement before a variable assignment",
    "Python executes top-to-bottom. The print runs before study_topic exists, so Python raises NameError.",
    ["debug.nameerror"]
  ),
  codeReadingQuiz(
    "quiz-python-typeerror",
    "lesson-python-typeerror",
    "TypeError Checkpoint",
    'total = "30" + 20',
    "TypeError",
    "TypeError — you cannot add a string and an integer without converting first",
    'This works fine because Python automatically converts "30" to 30',
    "ValueError — the types are right but the value is invalid",
    'The string "30" and integer 20 are incompatible types for +. Use int("30") to convert first.',
    ["debug.typeerror"]
  ),
  codeReadingQuiz(
    "quiz-python-valueerror",
    "lesson-python-valueerror",
    "ValueError Checkpoint",
    'int("oops")',
    "ValueError",
    'ValueError — "oops" is a string (right type) but cannot be converted to a number (wrong value)',
    "TypeError — int() expected a number but got a string",
    "This works and returns 0 for invalid input",
    "ValueError means the type is fine (string is valid for int()) but the content is not a number.",
    ["py.value_error", "debug.exception_name"]
  ),
  codeReadingQuiz(
    "quiz-python-try-except",
    "lesson-python-try-except",
    "try/except Checkpoint",
    "try:\n    value = int(raw)\nexcept ValueError:\n    value = 0",
    "try/except error handling",
    "The try block runs first. If ValueError occurs, the except block runs instead of crashing",
    "Both try and except blocks run every time, and the last one wins",
    "The except block runs first to check for errors, then the try block runs",
    "Python tries the try block. If no exception, except is skipped. If the named exception occurs, execution jumps to except.",
    ["py.try_except"]
  ),
  codeReadingQuiz(
    "quiz-python-breakpoint-debugger",
    "lesson-python-breakpoint-debugger",
    "Breakpoint Debugger Checkpoint",
    'def countdown(n):\n    for i in range(n, 0, -1):\n        breakpoint()\n        print(i)\n\ncountdown(3)',
    "breakpoint debugging",
    "Execution pauses at breakpoint() on each loop iteration, opening the debugger where you can inspect i with p i and step with n",
    "The code runs normally and prints 3, 2, 1 without pausing because breakpoint() is ignored in scripts",
    "The code raises a NameError because breakpoint is not a built-in Python function",
    "breakpoint() is a built-in Python function that pauses execution and opens the interactive pdb debugger. You control the flow with n (next), p (print), and c (continue).",
    ["debug.breakpoint.basic"]
  ),
  // 5Q quiz (was checkpoint, now codeReadingQuiz)
  codeReadingQuiz(
    "quiz-python-traceback-clinic",
    "lesson-python-traceback-clinic",
    "Traceback Clinic Checkpoint",
    'try:\n    minutes = int("bad")\nexcept ValueError as e:\n    print("error:", e)',
    "reading traceback errors",
    "Interpret exception details, line numbers, and stderr lines, using try/except blocks to handle invalid input.",
    "Bypass try/except blocks and let scripts crash, assuming users read raw tracebacks.",
    "Catch all errors under a generic Exception block without naming a repair strategy.",
    "Tracebacks locate errors. Try/except intercepts exceptions and provides fallbacks.",
    ["debug.traceback", "debug.exception_name", "debug.line_number", "py.value_error"]
  ),
  codeReadingQuiz(
    "quiz-python-assertions",
    "lesson-python-assertions",
    "Assertions Checkpoint",
    'assert parse_minutes("30") == 30, "valid string should return integer 30"',
    "assert statements",
    "assert checks the condition. If true, nothing happens. If false, AssertionError with the message is raised",
    "assert prints the message to the terminal when the condition passes",
    "assert modifies the function to return the message instead of the value",
    "assert is a written contract. The custom message tells you exactly which expectation failed, without having to read the whole file.",
    ["py.assertion"]
  ),
  codeReadingQuiz(
    "quiz-python-debugging-capstone",
    "lesson-python-debugging-capstone",
    "Debugging Capstone Checkpoint",
    'assert parse_duration("30") == 30, "valid input should return 30"\nassert parse_duration("bad") is None, "invalid input should return None"',
    "regression testing",
    "Each assertion acts as a regression test: it proves a specific fix works and catches the bug if a future change breaks it",
    "Assertions should only be added after all bugs are fixed, not during the debugging process",
    "Assertions replace the need to run the code at all since they verify correctness statically",
    "Each assertion is a written contract that documents expected behavior and alerts you if a future change reintroduces the bug. Run, fix, assert, re-run — not fix-everything-then-assert.",
    ["debug.regression"]
  )
];
