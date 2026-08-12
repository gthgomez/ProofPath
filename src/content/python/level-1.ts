import type { Lesson, LessonPracticeBlock, Quiz } from "@/domain/types";
import { proofLesson, codeReadingQuiz, lessonRecallCards, lessonMisconceptionChecks } from "./shared";

// ---------------------------------------------------------------------------
// Practice rep pools
// ---------------------------------------------------------------------------

const literalsPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "# Which line below stores a whole number?\n# a) count = \"5\"\n# b) count = 5\n# c) count = 5.0\ncount = 5\nprint(\"Type check result is below\")\nprint(type(count))",
    expectedOutput: "Type check result is below\n<class 'int'>",
    checkYourAnswer: "type() returns the data type. An integer has no quotes and no decimal. The string '5' looks like a number but behaves like text.",
    tier: "replicate"
  },
  {
    starterCode: "active = True\nprint(\"Active type is below\")\nprint(type(active))\nprint(\"Active value is below\")\nprint(active)",
    expectedOutput: "Active type is below\n<class 'bool'>\nActive value is below\nTrue",
    checkYourAnswer: "True and False must be capitalised and have no quotes. Lowercase true or 'True' in quotes will not work the same way.",
    tier: "replicate"
  },
  {
    starterCode: 'count = "5"\nprint("Count type is below")\nprint(type(count))',
    expectedOutput: "Count type is below\n<class 'int'>",
    checkYourAnswer: "The bug is that count holds the string '5', not the integer 5. Remove the quotes around 5 so type() reports <class 'int'>.",
    tier: "diagnose"
  },
  {
    starterCode: '# Write three type() calls to check the type of the string "python",\n# the integer 42, and the boolean True.\n# Print the result of each type() call.\n',
    expectedOutput: "<class 'str'>\n<class 'int'>\n<class 'bool'>",
    checkYourAnswer: "Call print(type(...)) for each value. Make sure you write the literal correctly: 'python' needs quotes, 42 needs none, True needs a capital T.",
    tier: "synthesize"
  }
];

const assignmentPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "topic = \"git\"\nminutes = 15\ncompleted = False\nprint(\"Topic name is\")\nprint(topic)\nprint(\"Minutes count is\")\nprint(minutes)\nprint(\"Completed status is\")\nprint(completed)",
    expectedOutput: "Topic name is\ngit\nMinutes count is\n15\nCompleted status is\nFalse",
    checkYourAnswer: "Each variable holds one value. Notice topic is text (quotes), minutes is a number (no quotes), and completed is a boolean (capital T or F, no quotes).",
    tier: "replicate"
  },
  {
    starterCode: "track = \"backend\"\nlesson_count = 2\nready = False\nprint(\"Track name is\")\nprint(track)\nprint(\"Lesson count is\")\nprint(lesson_count)\nprint(\"Ready status is\")\nprint(ready)",
    expectedOutput: "Track name is\nbackend\nLesson count is\n2\nReady status is\nFalse",
    checkYourAnswer: "The names on the left describe the values on the right. A good variable name is a tiny label for the data it holds.",
    tier: "replicate"
  },
  {
    starterCode: '# Fix the bug: minutes should hold the integer 30, not the string "30".\nminutes = "30"\nprint("Minutes value is")\nprint(minutes)',
    expectedOutput: "Minutes value is printed as\n30",
    checkYourAnswer: "The bug is that minutes holds the string '30' instead of the integer 30. Remove the quotes so Python treats it as a number.",
    tier: "diagnose"
  },
  {
    starterCode: '# Create three variables for a study tracker session:\n# topic (string), minutes (integer), and completed (boolean).\n# Assign any values you like and print all three.\n',
    expectedOutput: "topic is python\nminutes is 45\ncompleted is False",
    checkYourAnswer: "Define topic, minutes, and completed with the correct types. Strings need quotes, integers need none, booleans need capital T or F.",
    tier: "synthesize"
  }
];

const printValuesPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "language = \"Python\"\nversion = 3\nprint(\"Language value is\")\nprint(language)\nprint(\"Version value is\")\nprint(version)",
    expectedOutput: "Language value is\nPython\nVersion value is\n3",
    checkYourAnswer: "print(language) sends the value stored in language to the terminal. Without print nothing is visible.",
    tier: "replicate"
  },
  {
    starterCode: "score = 100\npassed = True\nprint(\"Score value is\")\nprint(score)\nprint(\"Passed value is\")\nprint(passed)",
    expectedOutput: "Score value is\n100\nPassed value is\nTrue",
    checkYourAnswer: "Printing a boolean shows True or False. This is different from printing the string 'True'.",
    tier: "replicate"
  },
  {
    starterCode: '# Fix the bug: the code prints the literal word instead of the stored value.\ntopic = "git"\nprint("topic")',
    expectedOutput: "The printed value is\ngit",
    checkYourAnswer: "The bug is that print(\"topic\") prints the literal word topic instead of the variable's value. Remove the quotes inside print() to print the variable.",
    tier: "diagnose"
  },
  {
    starterCode: '# Assign a variable called session_name with the value "review" and\n# a variable called duration with the value 20. Print both on separate lines.\n',
    expectedOutput: "session name is review\nduration is 20",
    checkYourAnswer: "Assign session_name = \"review\" and duration = 20, then call print() with each variable name — not a string literal.",
    tier: "synthesize"
  }
];

const numbersPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "sessions = 3\nminutes_each = 20\ntotal = sessions * minutes_each\nprint(\"Total calculated sum is\")\nprint(total)",
    expectedOutput: "Total calculated sum is\n60",
    checkYourAnswer: "Multiplication uses *. The result is a new integer, not a string. If total was 0 the right-hand side didn't run.",
    tier: "replicate"
  },
  {
    starterCode: "total = 75\ndone = 2\nremaining = total - done\nprint(\"Remaining lessons count is\")\nprint(remaining)",
    expectedOutput: "Remaining lessons count is\n73",
    checkYourAnswer: "Subtraction with - produces a new value stored in remaining. Variables on both sides of - are looked up first.",
    tier: "replicate"
  },
  {
    starterCode: 'session_a = 15\nsession_b = 10\ntotal = session_a - session_b\nprint("Total minutes is")\nprint(total)',
    expectedOutput: "New total minutes value is\n25",
    checkYourAnswer: "The bug is that the code subtracts instead of adding. Change the - to + so total becomes the sum of both sessions.",
    tier: "diagnose"
  },
  {
    starterCode: '# Calculate the total minutes for three study sessions:\n# session_1 = 25, session_2 = 30, session_3 = 15.\n# Store the sum in a variable called grand_total and print it.\n',
    expectedOutput: "The grand total is\n70",
    checkYourAnswer: "Assign all three session variables, then add them with + and store the result in grand_total before printing.",
    tier: "synthesize"
  }
];

const stringsPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "greeting = \"Hello\"\nname = \"learner\"\nmessage = greeting + \" \" + name\nprint(\"Formatted joined message is\")\nprint(message)",
    expectedOutput: "Formatted joined message is\nHello learner",
    checkYourAnswer: "+ joins two strings. The space in the middle is itself a tiny string literal. Without it the words run together.",
    tier: "replicate"
  },
  {
    starterCode: "raw = \"  Python  \"\nclean = raw.strip()\nprint(\"Stripped clean value is\")\nprint(clean)",
    expectedOutput: "Stripped clean value is\nPython",
    checkYourAnswer: ".strip() removes leading and trailing spaces. The original raw stays unchanged; strip returns a new value.",
    tier: "replicate"
  },
  {
    starterCode: 'raw = "  Python  "\nraw.strip()\nprint("Cleaned value is")\nprint(raw)',
    expectedOutput: "Cleaned value is\nPython",
    checkYourAnswer: "The bug is that raw.strip() returns a new value but nothing saves it. Assign the result: clean = raw.strip() and print clean instead of raw.",
    tier: "diagnose"
  },
  {
    starterCode: '# Join the two strings topic = "python" and status = "completed"\n# into one message: "python-completed".\n# Then apply .upper() to make the result uppercase and print it.\n',
    expectedOutput: "The final result is\nPYTHON-COMPLETED",
    checkYourAnswer: "Use + to join the strings with a hyphen in between, then chain .upper() on the result and print it.",
    tier: "synthesize"
  }
];

const fstringsPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "topic = \"python\"\nminutes = 30\nsummary = f\"{topic} session took {minutes} min\"\nprint(summary)",
    expectedOutput: "python session took 30 min",
    checkYourAnswer: "Each {} is replaced by the variable's value at runtime. The surrounding text is literal characters.",
    tier: "replicate"
  },
  {
    starterCode: "sessions = 4\ntotal_minutes = 90\nreport = f\"{sessions} sessions and {total_minutes} minutes\"\nprint(report)",
    expectedOutput: "4 sessions and 90 minutes",
    checkYourAnswer: "f-strings combine numbers and text without explicit conversion. 4 is still an int; the f-string handles the display.",
    tier: "replicate"
  },
  {
    starterCode: 'topic = "python"\nminutes = 30\nsummary = "{topic}: {minutes} min"\nprint(summary)',
    expectedOutput: "The output is: python: 30 min",
    checkYourAnswer: "The bug is that the f prefix is missing before the opening quote. Add f before the string so Python replaces {} with variable values.",
    tier: "diagnose"
  },
  {
    starterCode: '# Build a session summary string using an f-string.\n# Variables: topic = "git", sessions = 3.\n# Expected output: "git: 3 sessions logged".\n',
    expectedOutput: "git: 3 sessions logged",
    checkYourAnswer: "Write an f-string with {} placeholders for topic and sessions. Remember the f prefix and use \\n only if you want a newline.",
    tier: "synthesize"
  }
];

const pythonValuePracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "topic = \"git\"\nminutes = 15\ncompleted = False\nsummary = \"\"\nprint(summary)",
    expectedOutput: "git: 15 minutes planned",
    checkYourAnswer: "Use the variables instead of typing an unrelated sentence. If minutes later changes, the summary should be the only output that changes with it.",
    tier: "synthesize"
  },
  {
    starterCode: "topic = \"python\"\nminutes = 30\ncompleted = True\nstatus = \"\"\nprint(status)",
    expectedOutput: "python session complete: True",
    checkYourAnswer: "The boolean should stay True, not the string \"True\". Ask yourself whether a later if statement could use the value directly.",
    tier: "synthesize"
  },
  {
    starterCode: "track = \"backend\"\nlesson_count = 2\nready = False\nreport = \"\"\nprint(report)",
    expectedOutput: "backend has 2 lessons ready=False",
    checkYourAnswer: "This rep checks whether you can combine text, numbers, and booleans without losing the type of each original value.",
    tier: "synthesize"
  },
  {
    starterCode: 'topic = "git"\nminutes = 15\ncompleted = False\nsummary = f"{topic}: {minutes} minutes planned"\nprint(summary)',
    expectedOutput: "git: 15 minutes planned",
    checkYourAnswer: "The summary is already built for you. Run the code and observe how the f-string combines topic, minutes, and the literal text.",
    tier: "replicate"
  },
  {
    starterCode: 'topic = "python"\nminutes = 30\ncompleted = True\nstatus = "python session complete:" + " " + True\nprint(status)',
    expectedOutput: "python session complete: True",
    checkYourAnswer: "The bug is that True is a boolean and cannot be concatenated with + and a string. Use an f-string or convert True to a string with str().",
    tier: "diagnose"
  }
];

// ---------------------------------------------------------------------------
// Micro-lesson 1 — Python's Three Starter Types (concept_only)
// ---------------------------------------------------------------------------

const literalsLesson = proofLesson({
  id: "lesson-python-literals",
  moduleId: "module-python-core",
  slug: "python-literals",
  title: "Python's Three Starter Types",
  summary: "Learn what strings, integers, and booleans look like before you name them.",
  bodyMarkdown: "Python has three types you will use in every program: strings (text in quotes), integers (whole numbers without quotes), and booleans (True or False). You can check any value's type by calling `type(value)` — it will tell you whether the value is a string, an integer, or a boolean. Recognising which type a value is helps you predict what will happen when you combine or compare values.",
  estimatedMinutes: 4,
  difficulty: "foundation",
  skillIds: ["skill-python-basics"],
  quizId: "quiz-python-literals",
  desktopTask: "Identify the type of five literal values in a short Python file.",
  evidencePrompt: "Write down one string, one integer, and one boolean from memory, and state what makes each different.",
  language: "Python",
  tools: ["Python 3", "print output"],
  synopsis: "What would you type to tell Python 'this is text' vs 'this is a number'?",
  prerequisites: ["No prior Python knowledge required.", "Be ready to view text outputs in the terminal."],
  testingFocus: "Use type() to confirm each value has the expected type.",
  objective: "Identify and distinguish strings, integers, and booleans by sight.",
  whyItMatters: "Type confusion is the number one beginner error. Knowing the type before assigning prevents most of them.",
  coreConcept: "A string is text surrounded by quotes. An integer is a whole number with no quotes. A boolean is exactly True or False with a capital first letter and no quotes.",
  workedExample: "\"python\" is a string. 30 is an integer. False is a boolean. type(\"python\") confirms <class 'str'>.",
  guidedExercise: "Call type() on three values and compare the output.",
  missionConnection: "Every CLI Study Tracker value is one of these three types at the boundary.",
  reflectionPrompt: "Which type is easiest to misidentify, and what visual cue tells you which one a value is?",
  practiceStarter: "print(type(\"python\"))\nprint(type(30))\nprint(type(False))",
  practiceExpected: "<class 'str'>\n<class 'int'>\n<class 'bool'>",
  practiceCheck: "If any line says <class 'str'> when you expected int, check whether the value is wrapped in quotes.",
  practiceReps: literalsPracticeReps,
  miniTitle: "Identify literal types",
  miniGoal: "Call type() on one string, one integer, and one boolean and read the output.",
  miniSteps: ["Write three literal values", "Print type() of each", "Record what each type() line shows"],
  miniDeliverables: ["Three type() calls", "Observed class output", "One sentence explaining why '30' is a string while 30 is an integer"],
  verifierCommand: "python literals.py",
  expectedEvidence: "Terminal output showing three distinct type check lines, plus a written note explaining string quotes.",
  projectConnection: "Recognising types is the first step before the Study Tracker reads and validates CSV rows.",
  requiredCodeIncludes: ["type"],
  requiredOutputIncludes: ["str", "int", "bool"],
  runnerLanguage: "python",
  runnerStarterCode: "print(type(\"python\"))\nprint(type(30))\nprint(type(False))",
  runnerTestCode: [
    "assert type('python') is str, 'type check for python failed'",
    "assert type(30) is int, 'type check for 30 failed'",
    "assert type(False) is bool, 'type check for False failed'",
    "print('str int bool passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "types-are-distinct",
      name: "All three types are distinct",
      code: "assert str is not int, 'str should not equal int'\nassert int is not bool, 'int should not equal bool'\nassert str is not bool, 'str should not equal bool'"
    }
  ],
  curriculum: {
    level: 1,
    sequence: 1,
    version: "1.0.0",
    lessonKind: "concept_only",
    teaches: ["py.string", "py.integer", "py.boolean"],
    requires: [],
    visibleCodeConcepts: ["py.string", "py.integer", "py.boolean"],
    quizConcepts: ["py.string", "py.integer", "py.boolean"],
    usesButDoesNotTeach: ["py.assertion"],
    proofOutputs: ["terminal_stdout"]
  }
});

literalsLesson.depth = {
  primaryConceptId: "py.string",
  secondaryConceptIds: ["py.integer", "py.boolean"],
  maxNewConcepts: 3,
  conceptCapsules: [
    {
      conceptId: "py.string",
      definition: "A sequence of characters enclosed in single or double quotes.",
      mentalModel: "Think of a string as a piece of labelled tape: the text between the quotes is the printed characters on the tape.",
      syntaxShape: '"text" or \'text\'',
      tinyExample: '"python"',
      commonMistake: "Forgetting closing quotes or mixing single and double quotes around one value.",
      repairHint: "Every opening quote needs a matching closing quote of the same style.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.integer",
      definition: "A whole number without a decimal point or quotes.",
      mentalModel: "Think of an integer as a plain counter token: 30, not '30' or 30.0.",
      syntaxShape: "123 or -5",
      tinyExample: "30",
      commonMistake: "Wrapping a number in quotes, which turns it into a string Python cannot add.",
      repairHint: "Remove the quotes from numeric values you intend to use in arithmetic.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.boolean",
      definition: "A two-state value that is either True or False.",
      mentalModel: "Think of a boolean as a light switch: it is on (True) or off (False), nothing in between.",
      syntaxShape: "True or False",
      tinyExample: "False",
      commonMistake: "Writing true in lowercase or putting it in quotes, both of which make Python treat it as something else.",
      repairHint: "Always write True or False with a capital first letter and no quotes.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-lit-1",
      label: "Check string type",
      codeFragment: 'type("python")',
      conceptIds: ["py.string"],
      explanation: "Returns <class 'str'> confirming the value is a string.",
      learnerShouldBeAbleToSay: '"python" is a string because it is wrapped in quotes'
    },
    {
      id: "w-lit-2",
      label: "Check integer type",
      codeFragment: "type(30)",
      conceptIds: ["py.integer"],
      explanation: "Returns <class 'int'> confirming the value is a whole number.",
      learnerShouldBeAbleToSay: "30 is an integer because it has no quotes and no decimal"
    },
    {
      id: "w-lit-3",
      label: "Check boolean type",
      codeFragment: "type(False)",
      conceptIds: ["py.boolean"],
      explanation: "Returns <class 'bool'> confirming the value is a boolean.",
      learnerShouldBeAbleToSay: "False is a boolean with a capital F and no quotes"
    }
  ],
  guidedEdits: [
    {
      id: "g-lit-1",
      instruction: "Change 30 to \"30\" and observe how the type changes.",
      conceptIds: ["py.integer", "py.string"],
      targetCodeFragment: "type(30)",
      expectedObservation: "The output changes from <class 'int'> to <class 'str'>.",
      wrongTurnHint: "Make only the one change, then run and compare the output."
    }
  ],
  errorClinic: [
    {
      id: "e-lit-1",
      conceptIds: ["py.string"],
      brokenExample: 'x = "hello',
      symptom: "SyntaxError: EOL while scanning string literal",
      likelyCause: "The opening quote has no matching closing quote.",
      fixStrategy: 'Add the missing closing quote: x = "hello"'
    },
    {
      id: "e-lit-2",
      conceptIds: ["py.boolean"],
      brokenExample: 'active = "True"',
      symptom: "The boolean check fails because the value is a string, not a bool.",
      likelyCause: "Putting quotes around True makes it the four-character string 'True', not the boolean.",
      fixStrategy: "Remove the quotes: active = True"
    }
  ],
  codeLabBridge: {
    story: "Before the Study Tracker reads CSV rows it needs to know which fields are strings, which are integers, and which become booleans.",
    usesConcepts: ["py.string", "py.integer", "py.boolean"],
    learnerOwns: [],
    checkerOwns: ["types-are-distinct"],
    runExpectation: "prints str int bool passed"
  },
  understandingProofPrompt: "Without running Python, state the type of each value: 42, 'hello', True, \"3\". Explain one case where the type surprised you.",
  exitTicket: [
    "I can tell a string, integer, and boolean apart by looking at them.",
    "I know quotes make a value a string even if it looks like a number."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 2 — Give Values a Name (run_file)
// ---------------------------------------------------------------------------

const assignmentLesson = proofLesson({
  id: "lesson-python-assignment",
  moduleId: "module-python-core",
  slug: "python-assignment",
  title: "Give Values a Name",
  summary: "Use = to store a value under a name so your program can reuse it.",
  bodyMarkdown: "The = sign in Python is not equality — it is assignment. It stores the value on the right under the name on the left. After name = value Python remembers the value every time you write that name.",
  estimatedMinutes: 5,
  difficulty: "foundation",
  skillIds: ["skill-python-basics"],
  quizId: "quiz-python-assignment",
  desktopTask: "Create three variables for one study session and print each one.",
  evidencePrompt: "Record the file path, output, and one reason why you chose each variable name.",
  language: "Python",
  tools: ["Python 3", "terminal", "print output"],
  synopsis: "How do you save a value so you can use it again later?",
  prerequisites: ["Know what strings, integers, and booleans are (previous lesson).", "Be ready to edit variables on the left and right of =."],
  testingFocus: "The tests check that each variable exists and holds the right type.",
  objective: "Assign a string, integer, and boolean to named variables.",
  whyItMatters: "Without named variables, every calculation would need you to type the same value twice, making programs fragile and hard to read.",
  coreConcept: "name = value stores the value under the name. The name goes left of =, the value goes right. Python raises NameError if you try to use a name you have not assigned yet.",
  workedExample: "topic = 'python' stores the string python. minutes = 30 stores the integer 30. completed = False stores the boolean False.",
  guidedExercise: "Write one variable for topic, one for minutes, and one for completed, then print each.",
  missionConnection: "Every Study Tracker session starts as three named variables before it becomes a dictionary or file row.",
  reflectionPrompt: "Which variable name would make the program hardest to read if you renamed it to x? Why?",
  practiceStarter: "topic = \"python\"\nminutes = 0\ncompleted = False\n# Change minutes to 30, then print all three variables.\nprint(topic)\nprint(minutes)\nprint(completed)",
  practiceExpected: "python\n30\nFalse",
  practiceCheck: "If minutes prints 0, you forgot to change the assignment. The name on the left should stay the same; only the value on the right changes.",
  practiceReps: assignmentPracticeReps,
  miniTitle: "Name one study session",
  miniGoal: "Store topic, minutes, and completed as named Python values and print each one.",
  miniSteps: ["Assign topic as a string", "Assign minutes as an integer", "Assign completed as a boolean", "Print all three"],
  miniDeliverables: ["Python file with three assignments", "Printed output showing all three values", "One reflection note on why variable names should be descriptive"],
  verifierCommand: "python study_session.py",
  expectedEvidence: "Terminal output showing the assigned values on three separate lines, plus a short name explanation.",
  projectConnection: "These three variables become the foundation of the CLI Study Tracker session record.",
  requiredCodeIncludes: ["topic", "minutes", "completed"],
  requiredOutputIncludes: ["python", "30", "False"],
  runnerLanguage: "python",
  runnerStarterCode: "topic = \"python\"\nminutes = 0\ncompleted = False\n# Change minutes to 30, then print all three.\nprint(topic)\nprint(minutes)\nprint(completed)",
  runnerTestCode: [
    "assert topic == 'python', 'topic should be the string python'",
    "assert minutes == 30, 'Change minutes to 30'",
    "assert completed is False, 'completed should stay the boolean False'",
    "assert isinstance(topic, str), 'topic must be a string'",
    "assert isinstance(minutes, int), 'minutes must be an integer'",
    "assert isinstance(completed, bool), 'completed must be a boolean'",
    "print('passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "assignment-types-correct",
      name: "All three variables have the right types",
      code: "assert isinstance(topic, str), 'topic must be string'\nassert isinstance(minutes, int), 'minutes must be integer'\nassert isinstance(completed, bool), 'completed must be boolean'"
    }
  ],
  curriculum: {
    level: 1,
    sequence: 2,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.variable.assignment"],
    requires: ["py.string", "py.integer", "py.boolean"],
    visibleCodeConcepts: ["py.variable.assignment", "py.string", "py.integer", "py.boolean"],
    quizConcepts: ["py.variable.assignment"],
    usesButDoesNotTeach: ["py.assertion"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

assignmentLesson.depth = {
  primaryConceptId: "py.variable.assignment",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.variable.assignment",
      definition: "Storing a value under a name using the = operator.",
      mentalModel: "Think of a variable as a labelled box: the name is the label and the value is what you put inside.",
      syntaxShape: "name = value",
      tinyExample: 'topic = "python"',
      commonMistake: "Putting the value on the left: '\"python\" = topic' raises SyntaxError.",
      repairHint: "The name always goes left of =, the value always goes right.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-asgn-1",
      label: "Assign string",
      codeFragment: 'topic = "python"',
      conceptIds: ["py.variable.assignment", "py.string"],
      explanation: "Stores the string 'python' under the name topic.",
      learnerShouldBeAbleToSay: "topic now holds the string python"
    },
    {
      id: "w-asgn-2",
      label: "Assign integer",
      codeFragment: "minutes = 30",
      conceptIds: ["py.variable.assignment", "py.integer"],
      explanation: "Stores the integer 30 under the name minutes.",
      learnerShouldBeAbleToSay: "minutes holds the number 30, not the string '30'"
    },
    {
      id: "w-asgn-3",
      label: "Assign boolean",
      codeFragment: "completed = False",
      conceptIds: ["py.variable.assignment", "py.boolean"],
      explanation: "Stores the boolean False under completed.",
      learnerShouldBeAbleToSay: "completed is False meaning the session is not finished yet"
    }
  ],
  guidedEdits: [
    {
      id: "g-asgn-1",
      instruction: "Change minutes from 0 to 30 and re-run.",
      conceptIds: ["py.variable.assignment"],
      targetCodeFragment: "minutes = 0",
      expectedObservation: "The printed output changes from 0 to 30.",
      wrongTurnHint: "Only change the number on the right of =, leave the name minutes unchanged."
    }
  ],
  errorClinic: [
    {
      id: "e-asgn-1",
      conceptIds: ["py.variable.assignment"],
      brokenExample: '"python" = topic',
      symptom: "SyntaxError: cannot assign to literal",
      likelyCause: "The value and name are swapped. Python cannot store into a literal.",
      fixStrategy: 'Swap: topic = "python"'
    },
    {
      id: "e-asgn-2",
      conceptIds: ["py.variable.assignment"],
      brokenExample: "print(subject)",
      symptom: "NameError: name 'subject' is not defined",
      likelyCause: "You used a name that was never assigned.",
      fixStrategy: "Assign subject = 'python' before printing it."
    }
  ],
  codeLabBridge: {
    story: "Assign the three session fields before the tracker combines them.",
    usesConcepts: ["py.variable.assignment"],
    learnerOwns: ["topic", "minutes", "completed"],
    checkerOwns: ["assignment-types-correct"],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "What error appears if you try to print a variable before assigning it?",
  exitTicket: [
    "I can assign a string, integer, and boolean to named variables.",
    "I know the name goes left of = and the value goes right."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 3 — Print What You Named (run_file)
// ---------------------------------------------------------------------------

const printValuesLesson = proofLesson({
  id: "lesson-python-print-values",
  moduleId: "module-python-core",
  slug: "python-print-values",
  title: "Print What You Named",
  summary: "Use print() to display the value stored in a variable.",
  bodyMarkdown: "print() sends its argument to the terminal. When you pass a variable name, Python looks up the stored value and displays it. This is how you inspect your program while it runs.",
  estimatedMinutes: 4,
  difficulty: "foundation",
  skillIds: ["skill-python-basics"],
  quizId: "quiz-python-print-values",
  desktopTask: "Assign two variables and print each one on its own line.",
  evidencePrompt: "Record the exact terminal output and explain what changed when you updated one variable's value.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "You have a variable — how do you see what's inside it?",
  prerequisites: ["Know how to assign a variable (previous lesson).", "Know how running scripts produces output in the terminal."],
  testingFocus: "The test confirms the output matches the stored values, not a hardcoded string.",
  objective: "Use print() to display the value of a variable.",
  whyItMatters: "print() is your first debugging tool. If the output is wrong, the variable holds the wrong value.",
  coreConcept: "print(name) displays the value stored in name. Each print() call produces one output line. Printing nothing is how bugs hide.",
  workedExample: "topic = 'python' then print(topic) displays python. Changing topic to 'git' and re-running makes print display git.",
  guidedExercise: "Assign topic and minutes, change one value, run and observe the output change.",
  missionConnection: "The Study Tracker uses print to show the session summary before it is written to a file.",
  reflectionPrompt: "What happens if you call print(topic) before assigning topic? How does the error message help?",
  practiceStarter: "topic = \"python\"\nminutes = 30\nprint(topic)\nprint(minutes)",
  practiceExpected: "python\n30",
  practiceCheck: "Each print should show the current variable value. If you see 0 instead of 30, check the assignment line.",
  practiceReps: printValuesPracticeReps,
  miniTitle: "Print session variables",
  miniGoal: "Assign two variables and print each one to confirm the values are stored correctly.",
  miniSteps: ["Assign topic and minutes", "Print both", "Change one value, re-run, observe the output change"],
  miniDeliverables: ["Python file with print statements", "Two printed lines from variables", "Short description of the difference between print(variable) and print('string')"],
  verifierCommand: "python print_values.py",
  expectedEvidence: "Terminal output showing the topic and minutes variables printed on separate lines after execution.",
  projectConnection: "Printing variables is how the Study Tracker reports a session before any file I/O.",
  requiredCodeIncludes: ["print", "topic", "minutes"],
  requiredOutputIncludes: ["python", "30"],
  runnerLanguage: "python",
  runnerStarterCode: "topic = \"python\"\nminutes = 30\nprint(topic)\nprint(minutes)",
  runnerTestCode: [
    "assert topic == 'python', 'topic should stay python'",
    "assert minutes == 30, 'minutes should stay 30'",
    "print('passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "print-values-types-correct",
      name: "Variables printed are correct types",
      code: "assert isinstance(topic, str), 'topic must be string'\nassert isinstance(minutes, int), 'minutes must be integer'"
    }
  ],
  curriculum: {
    level: 1,
    sequence: 3,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.print.variable"],
    requires: ["py.variable.assignment"],
    visibleCodeConcepts: ["py.print.variable"],
    quizConcepts: ["py.print.variable"],
    usesButDoesNotTeach: ["py.assertion"],
    proofOutputs: ["terminal_stdout"]
  }
});

printValuesLesson.depth = {
  primaryConceptId: "py.print.variable",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.print.variable",
      definition: "Calling print() with a variable name to display its stored value in the terminal.",
      mentalModel: "print() is a window into the variable: it shows you what is inside without changing it.",
      syntaxShape: "print(variable_name)",
      tinyExample: "print(topic)",
      commonMistake: "Printing the string 'topic' instead of the variable topic — quotes make it literal text.",
      repairHint: "Remove quotes inside print() when you want to display a variable, not the word itself.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-pv-1",
      label: "Assign then print",
      codeFragment: 'topic = "python"\nprint(topic)',
      conceptIds: ["py.variable.assignment", "py.print.variable"],
      explanation: "topic is assigned first, then print(topic) displays the stored value.",
      learnerShouldBeAbleToSay: "print(topic) shows the value python, not the word topic"
    }
  ],
  guidedEdits: [
    {
      id: "g-pv-1",
      instruction: "Change topic to 'git' and observe the output change.",
      conceptIds: ["py.print.variable"],
      targetCodeFragment: 'topic = "python"',
      expectedObservation: "The output changes from python to git.",
      wrongTurnHint: "Change only the value on the right of the = sign."
    }
  ],
  errorClinic: [
    {
      id: "e-pv-1",
      conceptIds: ["py.print.variable"],
      brokenExample: 'print("topic")',
      symptom: "Prints the literal word topic instead of the variable's value.",
      likelyCause: "Quotes inside print() make everything a string literal.",
      fixStrategy: "Remove the quotes: print(topic)"
    }
  ],
  codeLabBridge: {
    story: "Print each session variable so the user can inspect the data before it is processed.",
    usesConcepts: ["py.print.variable"],
    learnerOwns: ["topic", "minutes"],
    checkerOwns: ["print-values-types-correct"],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "Without running code, what does print('minutes') display? What does print(minutes) display? Why are they different?",
  exitTicket: [
    "I can print a variable's value without quotes inside print().",
    "I know print() does not change the variable."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 4 — Numbers and Arithmetic (run_file)
// ---------------------------------------------------------------------------

const numbersLesson = proofLesson({
  id: "lesson-python-numbers",
  moduleId: "module-python-core",
  slug: "python-numbers",
  title: "Numbers and Arithmetic",
  summary: "Use +, -, *, and // to calculate with integers.",
  bodyMarkdown: "Python can add, subtract, multiply, and divide integers. The result of integer arithmetic is another integer (// for floor division). Storing results in variables lets you reuse calculated totals.",
  estimatedMinutes: 5,
  difficulty: "foundation",
  skillIds: ["skill-python-basics"],
  quizId: "quiz-python-numbers",
  desktopTask: "Calculate total study minutes from two sessions and print the result.",
  evidencePrompt: "Record the calculation, the result, and explain what // does differently from /.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "What happens when you tell Python to add, subtract, or multiply numbers?",
  prerequisites: ["Know how to assign an integer (lesson-python-assignment).", "Be ready to write basic math expressions."],
  testingFocus: "The test checks that the computed total equals the sum of the inputs.",
  objective: "Calculate a total using integer arithmetic and store the result.",
  whyItMatters: "The Study Tracker adds minutes across sessions to produce weekly totals. Arithmetic is the core of that calculation.",
  coreConcept: "Arithmetic operators work on integer variables. + adds, - subtracts, * multiplies, // divides and drops the remainder. The result is stored in a new variable.",
  workedExample: "session_a = 30, session_b = 20, total = session_a + session_b produces 50.",
  guidedExercise: "Add two session_minutes values and print the total.",
  missionConnection: "The Study Tracker sums minutes across sessions using exactly this pattern.",
  reflectionPrompt: "What would happen if you used / instead of // when you need a whole number result?",
  practiceStarter: "session_a = 30\nsession_b = 20\ntotal = 0\n# Compute total as the sum of session_a and session_b.\nprint(total)",
  practiceExpected: "50",
  practiceCheck: "total should equal 50. If it is still 0, the arithmetic line is missing or not assigned to total.",
  practiceReps: numbersPracticeReps,
  miniTitle: "Sum two sessions",
  miniGoal: "Add two study-minute values together and print the total.",
  miniSteps: ["Assign two session minute values", "Calculate total with +", "Print total"],
  miniDeliverables: ["Python file with arithmetic expression", "Correct total printed to the terminal", "Short comment explaining the difference between // and / division"],
  verifierCommand: "python sum_sessions.py",
  expectedEvidence: "Terminal output showing the correct sum of both study sessions printed after code execution.",
  projectConnection: "This arithmetic is the foundation of the Study Tracker's weekly minute report.",
  requiredCodeIncludes: ["session_a", "session_b", "total"],
  requiredOutputIncludes: ["50"],
  runnerLanguage: "python",
  runnerStarterCode: "session_a = 30\nsession_b = 20\ntotal = 0\n# Compute total as the sum of session_a and session_b.\nprint(total)",
  runnerTestCode: [
    "assert session_a == 30, 'session_a should stay 30'",
    "assert session_b == 20, 'session_b should stay 20'",
    "assert total == session_a + session_b, 'total should be the sum of both sessions'",
    "assert isinstance(total, int), 'total must be an integer'",
    "print('passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "arithmetic-total-correct",
      name: "Total is computed from variables",
      code: "assert total == 50, 'total should be 50'"
    }
  ],
  curriculum: {
    level: 1,
    sequence: 5,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.arithmetic"],
    requires: ["py.variable.assignment", "py.integer"],
    reinforces: ["py.integer"],
    visibleCodeConcepts: ["py.arithmetic", "py.integer"],
    quizConcepts: ["py.arithmetic"],
    usesButDoesNotTeach: ["py.assertion"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

numbersLesson.depth = {
  primaryConceptId: "py.arithmetic",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.arithmetic",
      definition: "Using +, -, *, // operators to compute a new integer from two integer values.",
      mentalModel: "Think of arithmetic as asking Python to be a calculator: two values go in, one result comes out.",
      syntaxShape: "result = left_value + right_value",
      tinyExample: "total = session_a + session_b",
      commonMistake: "Using / when you want a whole-number result — / returns a float like 50.0 instead of 50.",
      repairHint: "Use // for integer division. Use + for addition and * for multiplication.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-num-1",
      label: "Add two session totals",
      codeFragment: "total = session_a + session_b",
      conceptIds: ["py.arithmetic"],
      explanation: "Python evaluates session_a + session_b, producing 50, and stores it in total.",
      learnerShouldBeAbleToSay: "total is the result of adding both session values"
    }
  ],
  guidedEdits: [
    {
      id: "g-num-1",
      instruction: "Change session_b to 25 and predict the new total before running.",
      conceptIds: ["py.arithmetic"],
      targetCodeFragment: "session_b = 20",
      expectedObservation: "The total becomes 55.",
      wrongTurnHint: "Only change the value of session_b, then re-run and compare."
    }
  ],
  errorClinic: [
    {
      id: "e-num-1",
      conceptIds: ["py.arithmetic"],
      brokenExample: 'total = "30" + 20',
      symptom: "TypeError: can only concatenate str (not 'int') to str",
      likelyCause: "One value is a string and the other is an integer. + means different things for each.",
      fixStrategy: "Remove quotes from the string value so both sides are integers."
    }
  ],
  codeLabBridge: {
    story: "The Study Tracker needs to sum all session minutes before writing the report.",
    usesConcepts: ["py.arithmetic"],
    learnerOwns: ["total"],
    checkerOwns: ["arithmetic-total-correct"],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "What is the difference between 7 / 2 and 7 // 2 in Python?",
  exitTicket: [
    "I can add two integer variables and store the result.",
    "I know // produces a whole number and / may produce a decimal."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 5 — Text, Quotes, and Escape (run_file)
// ---------------------------------------------------------------------------

const stringsLesson = proofLesson({
  id: "lesson-python-strings",
  moduleId: "module-python-core",
  slug: "python-strings",
  title: "Text, Quotes, and String Operations",
  summary: "Join, clean, and inspect strings using + and built-in methods.",
  bodyMarkdown: "### What is a method?\nA method is a built-in action that belongs to a specific type of value. You've already used a function: print(). A method is like a function, but it's attached to the value it works on.\n\nYou write it with a dot after the value, followed by parentheses: \"hello\".upper(). The dot means \"this action belongs to this value.\" The parentheses mean \"run the action now.\"\n\nThink of a TV remote: the buttons are methods. The remote (the object) has buttons you press. You don't need to know how the remote works inside — you just press the button you need.\n\nStrings have methods you can call with a dot: .strip() removes leading and trailing spaces, .lower() converts to lowercase, and len() counts characters. You can join two strings with +.",
  estimatedMinutes: 5,
  difficulty: "foundation",
  skillIds: ["skill-python-basics"],
  quizId: "quiz-python-strings",
  desktopTask: "Clean a topic string and join it with a status word to produce a readable output.",
  evidencePrompt: "Record the original string, the cleaned string, and what .strip() removed.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "Your text has extra spaces and mixed case — how do you clean it up?",
  prerequisites: ["Know how to assign a string variable (lesson-python-assignment).", "Understand how variables are lookup targets."],
  testingFocus: "The test checks that the cleaned string matches the expected value exactly.",
  objective: "Join strings and apply .strip() and .lower() to normalise input.",
  whyItMatters: "Real CSV input contains inconsistent spacing and capitalisation. Cleaning strings before the tracker groups sessions prevents silent duplicates.",
  coreConcept: "Strings are objects with methods. .strip() returns a new string with edge whitespace removed. .lower() returns a new lowercase string. + joins two strings end to end.",
  workedExample: "'  Python  '.strip() returns 'Python'. '  Python  '.strip().lower() returns 'python'. 'hello' + ' ' + 'world' returns 'hello world'.",
  guidedExercise: "Strip and lowercase a raw topic, then join it with ' session' to produce a clean label.",
  missionConnection: "The Study Tracker normalises topics before grouping so 'Python' and '  python  ' count as the same topic.",
  reflectionPrompt: "Why does calling .strip() first and then .lower() produce the same result as .lower() first and then .strip()?",
  practiceStarter: "raw = \"  Python  \"\nclean = \"\"\n# Strip whitespace and convert to lowercase.\nprint(clean)",
  practiceExpected: "python",
  practiceCheck: "clean should be 'python' with no spaces and all lowercase. If it shows '  Python  ' the methods were not called.",
  practiceReps: stringsPracticeReps,
  miniTitle: "Clean a topic string",
  miniGoal: "Strip and lowercase a raw topic string to produce a normalised value.",
  miniSteps: ["Start with a string that has spaces or mixed capitalisation", "Apply .strip() then .lower()", "Print the result"],
  miniDeliverables: ["Python file with strip and lower calls", "Cleaned terminal output", "One sentence explaining why normalising topics prevents duplicates"],
  verifierCommand: "python clean_topic.py",
  expectedEvidence: "Terminal output showing the lowercase, trimmed string, plus a short comment explaining the value of text normalisation.",
  projectConnection: "Normalised topics are the foundation of the Study Tracker's grouping logic.",
  requiredCodeIncludes: ["raw", "clean", "strip"],
  requiredOutputIncludes: ["python"],
  runnerLanguage: "python",
  runnerStarterCode: "raw = \"  Python  \"\nclean = \"\"\n# Strip whitespace and convert to lowercase.\nprint(clean)",
  runnerTestCode: [
    "assert clean == 'python', 'clean should be lowercase python with no spaces'",
    "print('passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "string-clean-correct",
      name: "Cleaned string has no whitespace and is lowercase",
      code: "assert clean == clean.strip().lower(), 'clean should be stripped and lowercased'"
    }
  ],
  curriculum: {
    level: 1,
    sequence: 6,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.string.methods", "py.method"],
    requires: ["py.variable.assignment", "py.string"],
    reinforces: ["py.string"],
    visibleCodeConcepts: ["py.string.methods", "py.method", "py.string"],
    usesButDoesNotTeach: ["py.assertion"],
    quizConcepts: ["py.string.methods", "py.method"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

stringsLesson.depth = {
  primaryConceptId: "py.string.methods",
  secondaryConceptIds: ["py.method"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.string.methods",
      definition: "Built-in functions you call on a string using dot notation to produce a modified or measured version.",
      mentalModel: "Think of a string method as a filter machine: you put the original string in, the method does its work, and a new string comes out.",
      syntaxShape: '"text".method() or variable.method()',
      tinyExample: '"  Python  ".strip()',
      commonMistake: "Forgetting that methods return a new string — the original variable is unchanged unless you reassign.",
      repairHint: "Assign the result: clean = raw.strip() so the cleaned value is stored.",
      usedIn: ["learn", "practice", "code_lab"]
    },
    {
      conceptId: "py.method",
      definition: "A built-in action that belongs to a specific type of value, called using dot notation.",
      mentalModel: "Think of a method like a button on a TV remote: the remote (the value) has buttons you can press (the methods). You don't need to know how the remote works inside.",
      syntaxShape: 'value.method() or "text".method()',
      tinyExample: '"hello".upper()',
      commonMistake: "Forgetting parentheses at the end of a method call, which returns the method object instead of executing it.",
      repairHint: "Always add () after the method name to execute it: value.method().",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-str-1",
      label: "Strip then lowercase",
      codeFragment: 'clean = raw.strip().lower()',
      conceptIds: ["py.string.methods"],
      explanation: "strip() removes edge whitespace first, then lower() converts the result to lowercase. Both return new strings.",
      learnerShouldBeAbleToSay: "Methods chain left to right, each working on the result of the previous"
    }
  ],
  guidedEdits: [
    {
      id: "g-str-1",
      instruction: "Add .lower() after .strip() to make the output fully lowercase.",
      conceptIds: ["py.string.methods"],
      targetCodeFragment: "clean = raw.strip()",
      expectedObservation: "The output changes from 'Python' to 'python'.",
      wrongTurnHint: "Chain .lower() directly onto the end of .strip(), with no space."
    }
  ],
  errorClinic: [
    {
      id: "e-str-1",
      conceptIds: ["py.string.methods"],
      brokenExample: "raw.strip()\nprint(raw)",
      symptom: "raw still shows original value with spaces.",
      likelyCause: "The result of strip() was discarded instead of being stored.",
      fixStrategy: "Assign: clean = raw.strip() then print(clean)."
    }
  ],
  codeLabBridge: {
    story: "Normalise raw CSV topic strings before the tracker groups them.",
    usesConcepts: ["py.string.methods"],
    learnerOwns: ["clean"],
    checkerOwns: ["string-clean-correct"],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "What does 'PYTHON'.lower().strip() return, and does the order of method calls matter here?",
  exitTicket: [
    "I can apply .strip() and .lower() to clean a string.",
    "I know methods return new strings and do not modify the original."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 6 — Build Output with f-strings (run_file)
// ---------------------------------------------------------------------------

const fstringsLesson = proofLesson({
  id: "lesson-python-fstrings",
  moduleId: "module-python-core",
  slug: "python-fstrings",
  title: "Build Output with f-strings",
  summary: "Use f-strings to embed variable values directly inside a readable output string.",
  bodyMarkdown: "An f-string starts with f before the opening quote. Inside the string, curly braces {} act as slots: Python replaces each slot with the variable's current value. You can combine text, numbers, and booleans in one line without manual conversion.",
  estimatedMinutes: 6,
  difficulty: "foundation",
  skillIds: ["skill-python-basics"],
  quizId: "quiz-python-fstrings",
  desktopTask: "Build a study-session summary string using an f-string with topic, minutes, and completed.",
  evidencePrompt: "Record the summary string and explain what each {} was replaced with.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "What if you could embed a variable right inside a sentence without stopping and starting?",
  prerequisites: ["Know how to assign strings and integers (lessons 2–5).", "Know how to use print() to output results."],
  testingFocus: "The test checks that the output contains the variable values, not literal placeholder text.",
  objective: "Use an f-string to build a multiline session summary.",
  whyItMatters: "The Study Tracker's summary report is an f-string that combines topic, minutes, and status into one inspectable line per session.",
  coreConcept: "f'{name}' evaluates to the string value of name at runtime. You can embed any variable type. \\n inside an f-string produces a newline.",
  workedExample: 'topic = "python", minutes = 30. f"{topic}: {minutes} minutes" produces "python: 30 minutes".',
  guidedExercise: "Create topic, minutes, and completed, then build a summary using an f-string with all three.",
  missionConnection: "This is the exact format the Study Tracker uses when printing one session summary to the terminal.",
  reflectionPrompt: "What is the difference between f'{minutes}' and '{minutes}'? Run both and describe what you see.",
  practiceStarter: "topic = \"python\"\nminutes = 30\ncompleted = False\n\nsummary = \"\"\n# Build summary as: \"python\\n30\\nplanned\"\nprint(summary)",
  practiceExpected: "python\n30\nplanned",
  practiceCheck: "The f-string should embed topic and minutes. Replace the 'planned' word with the literal string planned rather than the boolean False directly.",
  practiceReps: fstringsPracticeReps,
  miniTitle: "Build a session summary",
  miniGoal: "Create a multiline session summary using an f-string with topic, minutes, and a status word.",
  miniSteps: ["Define topic, minutes, completed", "Build summary with an f-string", "Print summary"],
  miniDeliverables: ["Python file using f-string summary", "Multiline output showing all values", "One sentence explaining why f-strings are preferred over concatenation"],
  verifierCommand: "python session_summary.py",
  expectedEvidence: "Terminal output showing topic, minutes, and planned on separate lines.",
  projectConnection: "This is the template for the Study Tracker's per-session display.",
  requiredCodeIncludes: ["topic", "minutes", "summary", "f\""],
  requiredOutputIncludes: ["python", "30", "planned"],
  runnerLanguage: "python",
  runnerStarterCode: "topic = \"python\"\nminutes = 30\ncompleted = False\n\nsummary = \"\"\n# Build summary as: \"python\\n30\\nplanned\"\nprint(summary)",
  runnerTestCode: [
    "assert topic == 'python', 'topic should stay python'",
    "assert minutes == 30, 'Change minutes to 30'",
    "assert completed is False, 'completed should stay False'",
    "assert isinstance(minutes, int), 'minutes must be an integer'",
    "assert isinstance(completed, bool), 'completed must be a boolean'",
    "assert summary == 'python\\n30\\nplanned', 'Build summary so it prints python, 30, and planned on separate lines.'",
    "print('passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "fstring-summary-correct",
      name: "Summary embeds variable values",
      code: "assert str(minutes) in summary, 'The summary should contain the minutes value.'"
    }
  ],
  curriculum: {
    level: 1,
    sequence: 4,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.f_string"],
    requires: ["py.variable.assignment", "py.string", "py.print.variable"],
    visibleCodeConcepts: ["py.f_string"],
    quizConcepts: ["py.f_string"],
    usesButDoesNotTeach: ["py.assertion", "py.dict.literal"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

fstringsLesson.depth = {
  primaryConceptId: "py.f_string",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.f_string",
      definition: "A string prefixed with f that embeds variable values inside {} placeholders at runtime.",
      mentalModel: "Think of an f-string as a fill-in-the-blank sentence: {} marks the blanks and Python fills them with the current variable values.",
      syntaxShape: 'f"text {variable} more text"',
      tinyExample: 'f"{topic}: {minutes} min"',
      commonMistake: "Forgetting the f prefix, which makes the braces literal characters instead of variable slots.",
      repairHint: "Add f immediately before the opening quote: f\"{variable}\".",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-fstr-1",
      label: "Embed two variables",
      codeFragment: 'summary = f"{topic}: {minutes} minutes"',
      conceptIds: ["py.f_string"],
      explanation: "Python replaces {topic} with the string python and {minutes} with the integer 30 at runtime.",
      learnerShouldBeAbleToSay: "Each {} is a placeholder that holds a variable name"
    },
    {
      id: "w-fstr-2",
      label: "Use newline in f-string",
      codeFragment: 'summary = f"{topic}\\n{minutes}\\nplanned"',
      conceptIds: ["py.f_string"],
      explanation: "\\n inside an f-string inserts a line break, putting each value on its own line.",
      learnerShouldBeAbleToSay: "\\n moves the cursor to the next line"
    }
  ],
  guidedEdits: [
    {
      id: "g-fstr-1",
      instruction: "Change the f-string to put each value on its own line using \\n.",
      conceptIds: ["py.f_string"],
      targetCodeFragment: 'summary = ""',
      expectedObservation: "The output shows three lines: python, 30, planned.",
      wrongTurnHint: "Use f\"{topic}\\n{minutes}\\nplanned\" with \\n between each value."
    }
  ],
  errorClinic: [
    {
      id: "e-fstr-1",
      conceptIds: ["py.f_string"],
      brokenExample: 'summary = "{topic}: {minutes}"',
      symptom: "Prints the literal text {topic}: {minutes} instead of variable values.",
      likelyCause: "The f prefix is missing before the opening quote.",
      fixStrategy: 'Add f before the quote: summary = f"{topic}: {minutes}"'
    }
  ],
  codeLabBridge: {
    story: "Build the session summary string that the Study Tracker will print and log.",
    usesConcepts: ["py.f_string"],
    learnerOwns: ["summary"],
    checkerOwns: ["fstring-summary-correct"],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "What is the difference between f\"{minutes}\" and str(minutes)? When would you prefer the f-string approach?",
  exitTicket: [
    "I can write an f-string that embeds two or more variables.",
    "I know the f prefix is required and {} marks variable slots."
  ]
};

fstringsLesson.workshop.commonMistakes = [
  "Forgetting the f prefix before the quote",
  "Putting { or } literally without doubling to {{ and }}"
];

// ---------------------------------------------------------------------------
// Micro-lesson 7 — String Indexing & Slicing (run_file)
// ---------------------------------------------------------------------------

const stringIndexPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: 'language = "python"\nfirst = language[0]\nprint("First character is")\nprint(first)',
    expectedOutput: "First character is\np",
    checkYourAnswer: "language[0] gives the character at position 0, the first character 'p'. Python counts positions starting from 0.",
    tier: "replicate"
  },
  {
    starterCode: 'language = "python"\n# Fix this slice so it prints "yth" instead of "yt"\nchunk = language[1:3]\nprint("The correct slice result is")\nprint(chunk)',
    expectedOutput: "The correct slice result is\nyth",
    checkYourAnswer: "language[1:3] gives positions 1 and 2 (end is exclusive). To include index 3, use language[1:4].",
    tier: "diagnose"
  },
  {
    starterCode: '# Extract initials from "Grace Hopper"\nfull_name = "Grace Hopper"\nfirst_initial = full_name[0]\n# Access the last initial (the character right after the space)\n# Change the 0 to the correct index to get "H"\nlast_initial = full_name[0]\nprint(first_initial + last_initial)',
    expectedOutput: "Combined initials output:\nGH",
    checkYourAnswer: "Count positions from 0: G(0), r(1), a(2), c(3), e(4), space(5), H(6). Change full_name[0] to full_name[6] to get 'H'.",
    tier: "synthesize"
  }
];

const stringIndexLesson = proofLesson({
  id: "lesson-python-string-indexing",
  moduleId: "module-python-core",
  slug: "python-string-indexing",
  title: "String Indexing & Slicing",
  summary: "Access individual characters by position and extract substrings using bracket notation.",
  bodyMarkdown: "Strings are sequences of characters. Each character has a position called an index, starting at 0. Use square brackets to access any character: text[0] gets the first character, text[1] the second, and so on. You can also count from the end with negative indices: text[-1] is the last character. To extract a substring (a slice), use colon syntax: text[start:end] gives the characters from start up to (but not including) end.",
  estimatedMinutes: 8,
  difficulty: "foundation",
  skillIds: ["skill-python-basics"],
  quizId: "quiz-python-string-indexing",
  desktopTask: "Access the first and last character of a string, then extract a three-character slice from the middle.",
  evidencePrompt: "Record the string, the index you used for each access, and the printed output for both single characters and the slice.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "How do you grab just the first letter or the file extension from a string?",
  prerequisites: ["Know what a string is (lesson-python-strings).", "Be ready to count positions starting from 0."],
  testingFocus: "The tests check that you accessed the correct positions using bracket notation.",
  objective: "Access individual characters and extract substrings using bracket notation.",
  whyItMatters: "The Study Tracker parses file extensions from filenames and validates role prefixes by checking specific character positions.",
  coreConcept: "Each character in a string has an index (position number) starting at 0. Square brackets [index] access one character. A slice [start:end] returns characters from start to end-1. Negative indices count from the end: -1 is the last character.",
  workedExample: 'text = "python", text[0] returns "p", text[2] returns "t", text[-1] returns "n", text[0:4] returns "pyth".',
  guidedExercise: "Assign a string, access the first and last character using positive and negative indices, then extract a three-character slice from the middle.",
  missionConnection: "The Study Tracker parses file extensions from filenames using slice syntax and validates role prefixes by checking the first character.",
  reflectionPrompt: "Why does text[:3] give the same result as text[0:3]? What does text[3:] give, and how does omitting start or end change the behavior?",
  practiceStarter: 'text = "python"\nprint("First char:")\nprint(text[0])\nprint("Last char:")\nprint(text[-1])\nprint("Slice 0:3:")\nprint(text[0:3])',
  practiceExpected: "First char:\np\nLast char:\nn\nSlice 0:3:\npyt",
  practiceCheck: "text[0] gives the first character. text[-1] gives the last character. text[0:3] gives positions 0, 1, and 2 (the end index is exclusive).",
  practiceReps: stringIndexPracticeReps,
  miniTitle: "Initial Extractor",
  miniGoal: "Extract initials from a full name using string indexing and slicing.",
  miniSteps: [
    "Assign a full name string like 'Ada Lovelace'",
    "Access the first character with [0]",
    "Find the character after the space using its index",
    "Print both initials together"
  ],
  miniDeliverables: [
    "Python file extracting initials from a name",
    "Printed output showing both initials",
    "One sentence explaining how negative indexing could simplify the extraction"
  ],
  verifierCommand: "python initials.py",
  expectedEvidence: "Terminal output showing the two initials printed without spaces, plus a brief note on negative indexing.",
  projectConnection: "The Study Tracker uses string indexing to parse initials and short codes from user input.",
  requiredCodeIncludes: ["[", "]", "print"],
  requiredOutputIncludes: ["GH", "csv"],
  runnerLanguage: "python",
  runnerStarterCode: 'filename = "report.csv"\n# Use slicing to extract the file extension "csv"\n# Hint: the dot (.) is at position 6\nextension = ""\nprint(extension)',
  runnerTestCode: [
    "assert '.' in filename, 'filename should include a dot'",
    "assert extension == 'csv', 'extension should be csv'",
    "print('passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "extension-extracted",
      name: "File extension extracted correctly",
      code: "assert filename[-3:] == 'csv', 'extension should be last 3 chars'\nassert extension == filename[-3:], 'extension should match filename slice'"
    }
  ],
  curriculum: {
    level: 1,
    sequence: 7,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.string.index"],
    requires: ["py.string"],
    visibleCodeConcepts: ["py.string.index"],
    quizConcepts: ["py.string.index"],
    usesButDoesNotTeach: ["py.assertion", "py.list.literal", "py.csv"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

// Override misconception checks with concept-specific ones
stringIndexLesson.workshop.commonMistakes = [
  "Accessing index 0 thinking it gives the 'first' item after index 1",
  "Forgetting slices are end-exclusive"
];
stringIndexLesson.workshop.misconceptionChecks = lessonMisconceptionChecks(
  stringIndexLesson.workshop.commonMistakes
);

// Custom recall cards with generative prompt, concept mistake, and transfer context
stringIndexLesson.workshop.recallCards = lessonRecallCards({
  objective: stringIndexLesson.workshop.objective,
  coreConcept: stringIndexLesson.workshop.coreConcept,
  guidedExercise: stringIndexLesson.workshop.guidedExercise,
  missionConnection: stringIndexLesson.workshop.missionConnection,
  generativePrompt: "What happens when you access text[5] on a 5-character string? Why? What about text[5:10] on that same string?",
  conceptMistake: "off-by-one",
  transferContext: "the login validation step reads the first 3 characters of the user role"
});

stringIndexLesson.depth = {
  primaryConceptId: "py.string.index",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.string.index",
      definition: "Access individual characters by position using bracket notation, and extract substrings with slice syntax.",
      mentalModel: "Think of a string as a row of numbered lockers. Each locker holds one character. The first locker is number 0.",
      syntaxShape: "text[0] gets first char, text[-1] gets last char, text[1:4] gets chars at positions 1, 2, 3",
      tinyExample: '"python"[0] returns "p"',
      commonMistake: "Off-by-one errors: forgetting that indices start at 0 and slice ends are exclusive.",
      repairHint: "Count from 0, not 1. For a slice, the end index is the first position NOT included.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-si-1",
      label: "Slice from start to end",
      codeFragment: 'text = "python"\ntext[1:4]',
      conceptIds: ["py.string.index"],
      explanation: "text[1:4] returns characters at positions 1, 2, and 3 — 'y', 't', 'h' — but NOT position 4 ('o'). The end is exclusive.",
      learnerShouldBeAbleToSay: "text[1:4] gives characters at indices 1 up to but not including 4"
    },
    {
      id: "w-si-2",
      label: "Negative index access",
      codeFragment: 'text = "python"\ntext[-1]',
      conceptIds: ["py.string.index"],
      explanation: "text[-1] counts from the end. -1 is the last character 'n', -2 is the second-last 'o', and so on.",
      learnerShouldBeAbleToSay: "Negative indices count backward from the end of the string, starting at -1"
    }
  ],
  guidedEdits: [
    {
      id: "g-si-1",
      instruction: "Fix the slice so it prints the first three characters instead of the last three.",
      conceptIds: ["py.string.index"],
      targetCodeFragment: 'text = "python"\nchunk = text[-3:]',
      expectedObservation: "The output changes from 'hon' to 'pyt'.",
      wrongTurnHint: "Use text[0:3] to get the first three characters. The start index 0 is the first character."
    },
    {
      id: "g-si-2",
      instruction: "Fix the negative index so it accesses the second-to-last character, not the last.",
      conceptIds: ["py.string.index"],
      targetCodeFragment: 'text = "python"\nprint(text[-1])',
      expectedObservation: "The output changes from 'n' to 'o'.",
      wrongTurnHint: "text[-1] is the last character. text[-2] is the second-to-last."
    }
  ],
  errorClinic: [
    {
      id: "e-si-1",
      conceptIds: ["py.string.index"],
      brokenExample: 'text = "python"\nprint(text[10])',
      symptom: "IndexError: string index out of range",
      likelyCause: "The index 10 is beyond the last character. 'python' only has indices 0 through 5.",
      fixStrategy: "Check that the index is less than the string length. 'python' has length 6, so valid indices are 0 to 5."
    },
    {
      id: "e-si-2",
      conceptIds: ["py.string.index"],
      brokenExample: 'text = "python"\nprint(text[0:0])',
      symptom: "Prints an empty line instead of characters.",
      likelyCause: "The slice start equals the slice end, so no characters are included.",
      fixStrategy: "Make the end index larger than the start index. For the first character, use text[0:1]."
    }
  ],
  codeLabBridge: {
    story: "The Study Tracker needs to extract the file extension from a filename like 'report.csv' to decide which parser to use. You will extract 'csv' using slice syntax.",
    usesConcepts: ["py.string.index"],
    learnerOwns: ["filename", "extension"],
    checkerOwns: ["extension-extracted"],
    runExpectation: "prints extension passed"
  },
  understandingProofPrompt: "What happens when you access text[5] on a 5-character string like 'hello'? Why? Is there a difference between text[5:10] on that same string and text[5:]?",
  exitTicket: [
    "I can access a character at any position using positive and negative indices.",
    "I can extract a substring using slice syntax with start and end."
  ]
};

// ---------------------------------------------------------------------------
// Deprecated — original monolithic lesson (kept for progress resolution)
// ---------------------------------------------------------------------------

const deprecatedValuesLesson = proofLesson({
  id: "lesson-python-values",
  moduleId: "module-python-core",
  slug: "python-values",
  title: "Names, Values, and First Output (Deprecated)",
  summary: "Original Level 1 lesson — replaced by six focused micro-lessons.",
  bodyMarkdown: "This lesson has been split into focused micro-lessons. Learners who completed it are automatically placed out of the new sequence.",
  estimatedMinutes: 7,
  difficulty: "foundation",
  skillIds: ["skill-python-basics", "skill-testing-debugging"],
  quizId: "quiz-python-values",
  desktopTask: "Create a tiny Python file that stores one study session as named values and prints a summary.",
  evidencePrompt: "Record the file path, the final output, and which value you changed to make the output correct.",
  language: "Python",
  tools: ["Python 3", "terminal", "print output"],
  synopsis: "You are learning the smallest useful Python move: give values clear names, then combine those values into output you can inspect.",
  prerequisites: ["Know that Python code can run from a .py file.", "Be ready to edit one line and run the file again."],
  testingFocus: "The tests check that topic, minutes, and completed exist with the required values, and that your printed summary matches the expected output. The final passed line is the check result, not another variable you need to create.",
  objective: "Name simple Python values and combine them into one readable output string.",
  whyItMatters: "Every later Python project depends on seeing data clearly before it is wrapped in functions, files, or tests.",
  coreConcept: "A variable stores a value under a useful name. The name goes on the left of =, and the value goes on the right. Strings are text in quotes, integers are whole numbers without quotes, and booleans are True or False facts.",
  workedExample: "topic = 'python' stores text, minutes = 30 stores a number, and completed = False stores a true-or-false fact. A summary can translate those raw values into the readable output python, 30, planned.",
  guidedExercise: "Create three variables for one study session, change the starter minutes value to 30, then build one summary string from those values.",
  missionConnection: "This is the first slice of the CLI Study Tracker: one session that a learner and a test can inspect.",
  reflectionPrompt: "Which variable name made the program easier to read, and which value would you change to describe a different session?",
  practiceStarter: "topic = \"python\"\nminutes = 0\ncompleted = False\n\n# Change minutes to 30.\n# Then build the required summary using the values above.\n# Hint: summary = f\"{topic}\\n{minutes}\\nplanned\"\nsummary = \"\"\nprint(summary)",
  practiceExpected: "python\n30\nplanned\n\nVerifier then prints: passed",
  practiceCheck: "Check three things: minutes should be the number 30, summary should not stay empty, and each required value should print on its own line.",
  practiceReps: pythonValuePracticeReps,
  miniTitle: "Build one study-session summary",
  miniGoal: "Create the first study-tracker slice by storing one session as named Python values and printing a readable summary.",
  miniSteps: ["Keep topic set to python", "Change minutes from 0 to the number 30", "Keep completed as the boolean False", "Build summary from the variables and print python, 30, and planned on separate lines"],
  miniDeliverables: ["Python file with named values", "Printed summary output", "One note explaining why completed = False maps to the readable word planned"],
  verifierCommand: "python study_session.py",
  expectedEvidence: "Terminal output showing python, 30, planned, and the check's passed line plus a short note identifying the string, number, and boolean values.",
  projectConnection: "This gives the CLI Study Tracker its first data point before sessions become lists and files.",
  requiredCodeIncludes: ["topic", "minutes", "completed", "summary"],
  requiredOutputIncludes: ["python", "30", "planned"],
  runnerLanguage: "python",
  runnerStarterCode: "topic = \"python\"\nminutes = 0\ncompleted = False\n\n# Change minutes to 30.\n# Then build the required summary using the values above.\n# Hint: summary = f\"{topic}\\n{minutes}\\nplanned\"\nsummary = \"\"\nprint(summary)",
  runnerTestCode: [
    "assert topic == 'python', 'topic should stay \"python\".'",
    "assert minutes == 30, 'Change minutes from 0 to the number 30, not the string \"30\".'",
    "assert completed is False, 'completed should stay the boolean False. That means the session is still planned.'",
    "assert isinstance(minutes, int), 'minutes must be a number so later lessons can add study time.'",
    "assert isinstance(completed, bool), 'completed must be a boolean, not the word \"planned\".'",
    "assert summary == 'python\\n30\\nplanned', 'Build summary so it prints python, 30, and planned on separate lines.'",
    "print('passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "values-have-right-types",
      name: "Values use beginner-friendly types",
      code: "assert isinstance(topic, str), 'topic must be a string'\nassert isinstance(minutes, int), 'minutes must be an integer'\nassert isinstance(completed, bool), 'completed must be a boolean'\nassert str(minutes) in summary, 'The summary should contain the minutes value.'"
    }
  ],
  curriculum: {
    level: 1,
    sequence: 99,
    version: "1.0.0",
    deprecated: true,
    preserveProgress: true,
    showInActivePath: false,
    showInReviewQueue: false,
    legacyEvidenceOnly: true,
    lessonKind: "run_file",
    teaches: ["py.variable.assignment", "py.print.variable", "py.f_string", "py.string", "py.integer", "py.boolean"],
    requires: [],
    usesButDoesNotTeach: ["py.assertion"],
    replacedByLessonIds: [
      "lesson-python-literals",
      "lesson-python-assignment",
      "lesson-python-print-values",
      "lesson-python-numbers",
      "lesson-python-strings",
      "lesson-python-fstrings"
    ]
  },
  codeShape: "name = value"
});

deprecatedValuesLesson.depth = {
  primaryConceptId: "py.variable.assignment",
  secondaryConceptIds: ["py.print.variable", "py.f_string"],
  maxNewConcepts: 3,
  conceptCapsules: [
    {
      conceptId: "py.variable.assignment",
      definition: "Creating or updating a variable by writing name = value.",
      mentalModel: "Think of a variable as a storage container with a label name on it, holding a single value inside.",
      syntaxShape: "name = value",
      tinyExample: 'topic = "python"',
      commonMistake: "Putting the value on the left side of the equals sign.",
      repairHint: "Ensure the variable name is always written first on the left of '='.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [],
  guidedEdits: [],
  errorClinic: [],
  codeLabBridge: {
    story: "This lesson has been deprecated. See the six replacement micro-lessons.",
    usesConcepts: ["py.variable.assignment"],
    learnerOwns: [],
    checkerOwns: [],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "This lesson is deprecated. Complete lesson-python-fstrings instead.",
  exitTicket: ["This lesson is deprecated."]
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const level1Lessons: Lesson[] = [
  literalsLesson,
  assignmentLesson,
  printValuesLesson,
  fstringsLesson,
  numbersLesson,
  stringsLesson,
  stringIndexLesson
];

/** Kept in the content pack so old learner progress IDs still resolve. */
export const deprecatedLevel1Lessons: Lesson[] = [
  deprecatedValuesLesson
];

// ---------------------------------------------------------------------------
// Quizzes — one per micro-lesson
// ---------------------------------------------------------------------------

export const level1Quizzes: Quiz[] = [
  codeReadingQuiz(
    "quiz-python-literals",
    "lesson-python-literals",
    "Literal Types Checkpoint",
    'type("python")\ntype(30)\ntype(False)',
    "Python's three starter types",
    "type() tells you whether each value is a string, integer, or boolean",
    "type() converts each value to a string so you can print it",
    "type() returns the length of each value",
    "type() returns <class 'str'>, <class 'int'>, or <class 'bool'> depending on the value inside the parentheses.",
    ["py.string", "py.integer", "py.boolean"]
  ),
  codeReadingQuiz(
    "quiz-python-assignment",
    "lesson-python-assignment",
    "Variable Assignment Checkpoint",
    'topic = "python"\nminutes = 30\ncompleted = False',
    "variable assignment",
    'The name on the left stores the value on the right: topic holds "python", minutes holds 30',
    'The equals sign compares topic to "python" and returns True',
    "The value on the left is stored into the name on the right",
    "In Python, = is assignment, not equality. It stores the right-side value into the left-side name.",
    ["py.variable.assignment"]
  ),
  codeReadingQuiz(
    "quiz-python-print-values",
    "lesson-python-print-values",
    "Print Values Checkpoint",
    'topic = "python"\nprint(topic)',
    "printing variable values",
    'print(topic) displays the value "python" stored inside topic, not the word topic',
    'print(topic) displays the text "topic" because it prints the variable name',
    "print(topic) causes an error because variables cannot be printed",
    "print(variable) looks up the variable's stored value. To print the literal word, you would need quotes: print(\"topic\").",
    ["py.print.variable"]
  ),
  codeReadingQuiz(
    "quiz-python-numbers",
    "lesson-python-numbers",
    "Arithmetic Checkpoint",
    "total = session_a + session_b\nprint(total)",
    "integer arithmetic",
    "You must use // for integer division; / produces a float like 3.5",
    "/ and // both produce the same result for whole-number division",
    "You should use + for division because it is the most common operator",
    "// performs floor division (drops the decimal). / performs true division and may return a float.",
    ["py.arithmetic"]
  ),
  codeReadingQuiz(
    "quiz-python-strings",
    "lesson-python-strings",
    "String Methods Checkpoint",
    'raw = "  Python  "\nclean = raw.strip().lower()',
    "string methods",
    'clean = "python" — no spaces and all lowercase. The original raw is unchanged.',
    'raw is now "python" because .strip() and .lower() modify the variable in place',
    "This causes an error because you cannot chain two methods together",
    "String methods return NEW values without changing the original. Chaining works left to right: strip() removes spaces, then lower() lowercases the result.",
    ["py.string.methods"]
  ),
  codeReadingQuiz(
    "quiz-python-fstrings",
    "lesson-python-fstrings",
    "f-string Checkpoint",
    'topic = "python"\nsummary = f"{topic}: 30 minutes"',
    "f-strings",
    "The f prefix and {} placeholder let you insert the value of topic into the string",
    "Without the f prefix, {topic} is also replaced by the variable value",
    "The {} brackets store the result back into the variable topic",
    'f"{variable}" replaces {variable} with its current value. Without the f prefix, Python treats {topic} as literal text.',
    ["py.f_string"]
  ),
  codeReadingQuiz(
    "quiz-python-string-indexing",
    "lesson-python-string-indexing",
    "String Indexing Checkpoint",
    'language = "python"\nfirst = language[0]\nprint(first)',
    "accessing characters by position",
    "Square brackets with a position number access one character.",
    "language[0] returns a list of all characters from the start.",
    "language[0] returns the integer position of character p in the string.",
    "language[0] with the string 'python' returns 'p' because indexing starts at position 0.",
    ["py.string.index"]
  ),
  // 5Q quiz (was checkpoint, now codeReadingQuiz for uniform 5Q + bias resistance)
  codeReadingQuiz(
    "quiz-python-values",
    "lesson-python-values",
    "Variables and Formatting Checkpoint",
    'topic = "python"\nminutes = 42\nprint(f"{topic} study: {minutes} minutes")',
    "variables and text formatting",
    "Assign variables and combine values into multiline strings using f-string syntax.",
    "Build summaries using loose literal string inputs without saving them in variables.",
    "Concatenate strings using mathematical division operators.",
    "Variable assignments use name = value. F-strings allow value interpolation.",
    ["py.variable.assignment", "py.f_string", "py.print.variable"]
  )
];
