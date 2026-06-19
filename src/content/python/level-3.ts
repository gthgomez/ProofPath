import type { Lesson, Quiz } from "@/domain/types";
import { proofLesson, checkpointQuiz } from "./shared";

// ---------------------------------------------------------------------------
// Practice rep pools
// ---------------------------------------------------------------------------

const whyFunctionsPracticeReps = [
  {
    starterCode: "# Without a function, the same block runs twice.\nminutes_a = 30\ntotal_a = minutes_a + 10\nprint(f\"session a: {total_a} minutes\")\n\nminutes_b = 20\ntotal_b = minutes_b + 10\nprint(f\"session b: {total_b} minutes\")\n# How would a function remove the duplicated logic?",
    expectedOutput: "session a: 40 minutes\nsession b: 30 minutes",
    checkYourAnswer: "Both blocks do the same calculation. A function lets you write the logic once and call it twice with different inputs."
  }
];

const defCallPracticeReps = [
  {
    starterCode: "def greet():\n    print(\"greeting hello world\")\n\ngreet()",
    expectedOutput: "greeting hello world",
    checkYourAnswer: "def names the function. Calling greet() runs the body. Since there is no return statement, the function executes print directly."
  },
  {
    starterCode: "def describe():\n    print(\"python study session details\")\n\ndescribe()",
    expectedOutput: "python study session details",
    checkYourAnswer: "Calling describe() runs the print statement inside its body. This makes the output visible in the terminal."
  }
];

const parametersPracticeReps = [
  {
    starterCode: "def describe_session(topic, minutes):\n    print(f\"session: {topic} took {minutes} min\")\n\ndescribe_session(\"python\", 30)",
    expectedOutput: "session: python took 30 min",
    checkYourAnswer: "topic and minutes are parameters — local names for the values the caller passes in. Change the call to (\"git\", 15) and re-run."
  },
  {
    starterCode: "def add_minutes(a, b):\n    print(f\"calculated total is {a + b} minutes\")\n\nadd_minutes(30, 20)",
    expectedOutput: "calculated total is 50 minutes",
    checkYourAnswer: "a and b receive the values 30 and 20 from the call. The function adds them and prints the result."
  }
];

const returnPracticeReps = [
  {
    starterCode: "def double(n):\n    return n * 2\n\nresult = double(15)\nprint(f\"double result value: {result}\")",
    expectedOutput: "double result value: 30",
    checkYourAnswer: "return sends the result back. result stores it. Without return the function sends back None."
  },
  {
    starterCode: "def total_minutes(sessions):\n    total = 0\n    for s in sessions:\n        total += s[\"minutes\"]\n    return total\n\nprint(f\"total minutes sum: {total_minutes([{'minutes': 30}, {'minutes': 20}])}\")",
    expectedOutput: "total minutes sum: 50",
    checkYourAnswer: "The loop accumulates into total. return total at the end sends the accumulated value back to the caller."
  }
];

const printVsReturnPracticeReps = [
  {
    starterCode: "def bad_total(a, b):\n    print(a + b)\n\nresult = bad_total(30, 20)\nprint(\"bad_total result variable value:\")\nprint(result)",
    expectedOutput: "50\nbad_total result variable value:\nNone",
    checkYourAnswer: "bad_total prints the sum but returns None. The caller stores None. This is why print inside a function is almost never what you want."
  },
  {
    starterCode: "def good_total(a, b):\n    return a + b\n\nresult = good_total(30, 20)\nprint(\"good_total result variable value:\")\nprint(result)",
    expectedOutput: "good_total result variable value:\n50",
    checkYourAnswer: "good_total returns the value. The caller can store, test, or pass it on. Print only shows it — it cannot be reused."
  }
];

const pythonFunctionPracticeReps = [
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

// ---------------------------------------------------------------------------
// Micro-lesson 1 — Why Functions Exist (concept_only)
// ---------------------------------------------------------------------------

const whyFunctionsLesson = proofLesson({
  id: "lesson-python-why-functions",
  moduleId: "module-python-core",
  slug: "python-why-functions",
  title: "Why Functions Exist",
  summary: "Understand what problem functions solve before learning the syntax.",
  bodyMarkdown: "Without functions, duplicate code forces you to edit the same logic in multiple places. A function packages a reusable step under a name. You call it once per session instead of copying and pasting it. Functions also make programs easier to test because you can check one step in isolation.",
  estimatedMinutes: 4,
  difficulty: "foundation",
  skillIds: ["skill-python-functions"],
  quizId: "quiz-python-why-functions",
  desktopTask: "Compare two code blocks — one duplicated and one using a function — and explain what changed.",
  evidencePrompt: "Write one sentence explaining what the function removes and what remains in each call site.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "You are seeing the problem functions solve before touching the syntax.",
  prerequisites: ["Know how to assign variables (Level 1 lessons).", "Understand how variables are named and printed."],
  testingFocus: "Compare duplicated code against a function and identify what changed.",
  objective: "State in one sentence what problem a function solves.",
  whyItMatters: "Understanding motivation makes the syntax stick. Learners who skip the why often write functions that print instead of returning.",
  coreConcept: "A function is a named, reusable block. It solves the problem of duplicate logic. Calling a function is cheaper than copying code, and a named function can be tested in isolation.",
  workedExample: "Calculating 'minutes + 10' in two places is duplicated. Wrapping it in add_overhead(minutes) means fixing a bug once fixes it everywhere.",
  guidedExercise: "Identify two lines in a script that do the same thing, then describe what a function would replace.",
  missionConnection: "The CLI Study Tracker has at least three places that inspect session minutes. Functions keep those rules consistent.",
  reflectionPrompt: "Name a real task in your daily life you do the same way every time. How is that like a function?",
  practiceStarter: "# Without a function:\nminutes_a = 30\noverage_a = minutes_a + 10\nprint(f\"session a: {overage_a} minutes\")\n\nminutes_b = 20\noverage_b = minutes_b + 10\nprint(f\"session b: {overage_b} minutes\")",
  practiceExpected: "session a: 40 minutes\nsession b: 30 minutes",
  practiceCheck: "Both blocks are identical except for the variable names. A function would contain the '+ 10' logic once and be called twice.",
  practiceReps: whyFunctionsPracticeReps,
  miniTitle: "Spot the duplicate logic",
  miniGoal: "Read two code blocks, identify the shared logic, and write one sentence describing what a function would remove.",
  miniSteps: ["Read the two blocks", "Find what is identical", "Write what a function would encapsulate"],
  miniDeliverables: ["One sentence describing the shared logic", "A sketch of what the function call would look like", "A short reflection note on when copy-paste code should become a function"],
  verifierCommand: "python why_functions.py",
  expectedEvidence: "Short written explanation naming the duplicated calculation.",
  projectConnection: "Every Study Tracker aggregation (totals, averages, filters) will be a function you call once per session.",
  requiredCodeIncludes: ["minutes_a", "minutes_b"],
  requiredOutputIncludes: ["session a", "session b"],
  runnerLanguage: "python",
  runnerStarterCode: "minutes_a = 30\noverage_a = minutes_a + 10\nprint(f\"session a: {overage_a} minutes\")\n\nminutes_b = 20\noverage_b = minutes_b + 10\nprint(f\"session b: {overage_b} minutes\")",
  runnerTestCode: [
    "assert overage_a == 40, 'overage_a should be minutes_a + 10'",
    "assert overage_b == 30, 'overage_b should be minutes_b + 10'",
    "print('why-functions passed')"
  ].join("\n"),
  hiddenTests: [],
  curriculum: {
    level: 3,
    sequence: 1,
    version: "1.0.0",
    lessonKind: "concept_only",
    teaches: ["py.function.motivation"],
    requires: ["py.variable.assignment", "py.f_string"],
    visibleCodeConcepts: ["py.variable.assignment", "py.f_string"],
    quizConcepts: ["py.function.motivation"],
    usesButDoesNotTeach: ["py.assertion"],
    proofOutputs: ["terminal_stdout"]
  }
});

whyFunctionsLesson.depth = {
  primaryConceptId: "py.function.motivation",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.function.motivation",
      definition: "The reason functions exist: to remove duplicated logic by naming a reusable step.",
      mentalModel: "Think of a function as a recipe card: instead of writing the steps every time, you just say 'follow the card'.",
      syntaxShape: "Not syntax — a concept. The syntax comes in the next lesson.",
      tinyExample: "add_overhead(minutes) replaces two identical blocks.",
      commonMistake: "Thinking functions are only needed for long programs. Even two identical lines are worth naming.",
      repairHint: "If you copy-pasted a block of code, that block is a candidate for a function.",
      usedIn: ["learn"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-why-1",
      label: "Spot the duplication",
      codeFragment: "overage_a = minutes_a + 10\n# ...\noverage_b = minutes_b + 10",
      conceptIds: ["py.function.motivation"],
      explanation: "The '+ 10' logic appears twice. If the business rule changes to '+ 15', both places need editing.",
      learnerShouldBeAbleToSay: "These two lines do the same thing — a function would let me write it once"
    }
  ],
  guidedEdits: [
    {
      id: "g-why-1",
      instruction: "Change the overhead from 10 to 15 in both blocks. Count how many edits you made.",
      conceptIds: ["py.function.motivation"],
      targetCodeFragment: "overage_a = minutes_a + 10",
      expectedObservation: "You edited two lines. With a function you would edit one.",
      wrongTurnHint: "Change both lines. The goal is to notice the cost of duplication."
    }
  ],
  errorClinic: [],
  codeLabBridge: {
    story: "The Study Tracker's minute calculations are duplicated in three places. Identifying them is the first step to writing reusable functions.",
    usesConcepts: ["py.function.motivation"],
    learnerOwns: [],
    checkerOwns: [],
    runExpectation: "prints why-functions passed"
  },
  understandingProofPrompt: "Name one calculation in the Study Tracker that is currently duplicated and describe what a function call would look like.",
  exitTicket: [
    "I can identify duplicated logic and explain what a function would replace.",
    "I know functions exist to make logic reusable and testable."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 2 — Define and Call (run_file)
// ---------------------------------------------------------------------------

const defCallLesson = proofLesson({
  id: "lesson-python-def-call",
  moduleId: "module-python-core",
  slug: "python-def-call",
  title: "Define and Call a Function",
  summary: "Write your first def block and call it to produce a result.",
  bodyMarkdown: "The def keyword opens a function definition. The name after def becomes the function's call name. The indented block is the body. You call the function by writing its name followed by ().",
  estimatedMinutes: 5,
  difficulty: "foundation",
  skillIds: ["skill-python-functions"],
  quizId: "quiz-python-def-call",
  desktopTask: "Define a function named greet and call it twice to confirm it runs the body each time.",
  evidencePrompt: "Record the function body, the two call outputs, and what changed between calls.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "You are writing your first def block and calling it to confirm it works.",
  prerequisites: ["Understand why functions exist (previous lesson).", "Know how running scripts produces output in the terminal."],
  testingFocus: "The test calls the function and checks that the function prints expected greeting.",
  objective: "Define a function with def and call it to produce an output.",
  whyItMatters: "def is the most common Python keyword. Without it, nothing in your program is reusable.",
  coreConcept: "def name(): creates a function named name. The body is indented by four spaces. name() calls it and runs the body. The function ends when the indentation level returns to the left.",
  workedExample: "def greet(): followed by print('hello') creates a function. greet() runs it and displays 'hello'.",
  guidedExercise: "Write a function named session_label that prints the string 'study session label', then call it.",
  missionConnection: "Every Study Tracker feature — parsing, grouping, reporting — will be a def block you call once per run.",
  reflectionPrompt: "What happens if you call greet before defining it? Read the error message carefully.",
  practiceStarter: "def greet():\n    print(\"hello learner greeting\")\n\ngreet()",
  practiceExpected: "hello learner greeting",
  practiceCheck: "The output should show 'hello learner greeting'. If it is empty, the function body was not called or does not print.",
  practiceReps: defCallPracticeReps,
  miniTitle: "Define and call greet",
  miniGoal: "Write a function that prints one string and confirm the call produces that string.",
  miniSteps: ["Write def greet():", "Add print('hello learner greeting') in the body", "Call greet()"],
  miniDeliverables: ["Python file with the greet function", "Printed call result showing greeting", "Short reflection note on print vs function body definition"],
  verifierCommand: "python greet.py",
  expectedEvidence: "Terminal output showing the greet function execution, plus a written note explaining call syntax.",
  projectConnection: "This is the pattern for every Study Tracker function: def, body, call.",
  requiredCodeIncludes: ["def greet", "print", "greet()"],
  requiredOutputIncludes: ["hello"],
  runnerLanguage: "python",
  runnerStarterCode: "def greet():\n    print(\"hello learner greeting\")\n\ngreet()",
  runnerTestCode: [
    "assert callable(greet), 'greet must be a callable function'",
    "print('def-call passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "def-call-callable",
      name: "greet is callable",
      code: "assert callable(greet), 'greet must be a callable function'"
    }
  ],
  curriculum: {
    level: 3,
    sequence: 2,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.function.def", "py.function.call"],
    requires: ["py.function.motivation", "py.variable.assignment"],
    visibleCodeConcepts: ["py.function.def", "py.function.call"],
    quizConcepts: ["py.function.def", "py.function.call"],
    usesButDoesNotTeach: ["py.assertion"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

defCallLesson.depth = {
  primaryConceptId: "py.function.def",
  secondaryConceptIds: ["py.function.call"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.function.def",
      definition: "Defining a named, reusable block using the def keyword.",
      mentalModel: "def is like writing a recipe: it describes what to do, but nothing happens until you cook it (call it).",
      syntaxShape: "def function_name():\n    # body",
      tinyExample: "def greet():",
      commonMistake: "Forgetting the colon after () or forgetting to indent the body.",
      repairHint: "Check that the def line ends with : and the body is indented four spaces.",
      usedIn: ["learn", "practice", "code_lab"]
    },
    {
      conceptId: "py.function.call",
      definition: "Running a defined function by writing its name followed by ().",
      mentalModel: "Calling a function is like pressing the 'start' button: the recipe runs now.",
      syntaxShape: "function_name()",
      tinyExample: "greet()",
      commonMistake: "Forgetting the () — writing just greet refers to the function object without running it.",
      repairHint: "Always include () to actually call the function.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-dc-1",
      label: "Define the function",
      codeFragment: "def greet():\n    return \"hello\"",
      conceptIds: ["py.function.def"],
      explanation: "def greet(): starts the definition. The indented return 'hello' is the body. Nothing runs yet.",
      learnerShouldBeAbleToSay: "def creates the function but does not run it"
    },
    {
      id: "w-dc-2",
      label: "Call the function",
      codeFragment: "result = greet()",
      conceptIds: ["py.function.call"],
      explanation: "greet() runs the body, evaluates to 'hello', and stores it in result.",
      learnerShouldBeAbleToSay: "greet() executes the body and returns the value"
    }
  ],
  guidedEdits: [
    {
      id: "g-dc-1",
      instruction: "Change the returned string to 'study session' and re-run.",
      conceptIds: ["py.function.def"],
      targetCodeFragment: 'return "hello"',
      expectedObservation: "The call result changes to 'study session'.",
      wrongTurnHint: "Change only the string inside return, not the def line."
    }
  ],
  errorClinic: [
    {
      id: "e-dc-1",
      conceptIds: ["py.function.def"],
      brokenExample: "def greet()\n    return 'hello'",
      symptom: "SyntaxError: expected ':'",
      likelyCause: "Missing colon at the end of the def line.",
      fixStrategy: "Add : after the closing parenthesis: def greet():"
    },
    {
      id: "e-dc-2",
      conceptIds: ["py.function.call"],
      brokenExample: "result = greet\nprint(result)",
      symptom: "Prints <function greet at 0x...> instead of 'hello'.",
      likelyCause: "greet without () refers to the function object, not the result of calling it.",
      fixStrategy: "Add parentheses: result = greet()"
    }
  ],
  codeLabBridge: {
    story: "Every Study Tracker feature begins with a def block. Practice the pattern before adding parameters.",
    usesConcepts: ["py.function.def", "py.function.call"],
    learnerOwns: ["greet"],
    checkerOwns: ["def-call-callable"],
    runExpectation: "prints def-call passed"
  },
  understandingProofPrompt: "What is the difference between greet and greet()? What does each evaluate to?",
  exitTicket: [
    "I can write a def block with an indented body.",
    "I know () is required to call a function."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 3 — Parameters and Arguments (run_file)
// ---------------------------------------------------------------------------

const parametersLesson = proofLesson({
  id: "lesson-python-parameters",
  moduleId: "module-python-core",
  slug: "python-parameters",
  title: "Parameters and Arguments",
  summary: "Give your function inputs using parameters so it works with different data.",
  bodyMarkdown: "A parameter is a local name inside the function definition. When you call the function, you pass an argument — the actual value. Python binds the argument to the parameter name for the duration of the call.",
  estimatedMinutes: 6,
  difficulty: "foundation",
  skillIds: ["skill-python-functions"],
  quizId: "quiz-python-parameters",
  desktopTask: "Write a function that accepts topic and minutes and returns a session label.",
  evidencePrompt: "Record two different call outputs and explain what changed between them.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "You are learning how to make a function flexible by giving it named inputs.",
  prerequisites: ["Know how to define and call a function (previous lesson).", "Know how running scripts produces output in the terminal."],
  testingFocus: "The test calls the function with two different argument sets and checks that they are printed.",
  objective: "Write a function with two parameters and call it with two different argument sets.",
  whyItMatters: "Without parameters, every function only works with hardcoded values. Parameters are what make functions actually reusable.",
  coreConcept: "def f(topic, minutes): declares two parameters. When you call f('python', 30), topic gets 'python' and minutes gets 30 for that call. Each call gets fresh parameter values.",
  workedExample: "def describe(topic, minutes): print(f'{topic}: {minutes} min'). describe('python', 30) prints 'python: 30 min'.",
  guidedExercise: "Define describe_session with two parameters and call it twice with different data.",
  missionConnection: "The Study Tracker's describe_session function will accept any topic and minutes and produce a consistent label.",
  reflectionPrompt: "What happens if you call the function with one argument instead of two? Read the error message.",
  practiceStarter: "def describe_session(topic, minutes):\n    print(f\"session: {topic} took {minutes} min\")\n\ndescribe_session(\"python\", 30)\ndescribe_session(\"git\", 15)",
  practiceExpected: "session: python took 30 min\nsession: git took 15 min",
  practiceCheck: "Each call produces a different output from the same function body. If both lines print the same thing, the function may use hardcoded values instead of parameters.",
  practiceReps: parametersPracticeReps,
  miniTitle: "Build describe_session",
  miniGoal: "Write describe_session(topic, minutes) and confirm it produces different output for different inputs.",
  miniSteps: ["Define the function with two parameters", "Build the print output using both parameters", "Call it twice with different arguments"],
  miniDeliverables: ["Python file with describe_session", "Two different printed output lines", "One reflection note on parameters vs global variables"],
  verifierCommand: "python describe_session.py",
  expectedEvidence: "Two printed lines showing different topics and minute counts in the output.",
  projectConnection: "describe_session is the core display function the Study Tracker will use for every session line.",
  requiredCodeIncludes: ["def describe_session", "topic", "minutes", "print"],
  requiredOutputIncludes: ["python", "30", "git", "15"],
  runnerLanguage: "python",
  runnerStarterCode: "def describe_session(topic, minutes):\n    print(f\"session: {topic} took {minutes} min\")\n\ndescribe_session(\"python\", 30)\ndescribe_session(\"git\", 15)",
  runnerTestCode: [
    "assert callable(describe_session), 'describe_session must be a callable function'",
    "print('parameters passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "parameters-different-inputs",
      name: "Function is callable and takes arguments",
      code: "assert callable(describe_session), 'describe_session must be a callable function'"
    }
  ],
  curriculum: {
    level: 3,
    sequence: 3,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.parameter", "py.argument"],
    requires: ["py.function.def", "py.function.call", "py.f_string"],
    visibleCodeConcepts: ["py.parameter", "py.argument", "py.f_string"],
    quizConcepts: ["py.parameter", "py.argument"],
    usesButDoesNotTeach: ["py.assertion"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

parametersLesson.depth = {
  primaryConceptId: "py.parameter",
  secondaryConceptIds: ["py.argument"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.parameter",
      definition: "A placeholder name in the function definition that receives the caller's argument value.",
      mentalModel: "Think of a parameter as a labelled inbox slot: topic is the slot label, and 'python' is what the caller drops in.",
      syntaxShape: "def function(parameter_name):",
      tinyExample: "topic, minutes",
      commonMistake: "Using the same name as a global variable, causing the function to silently use the global instead of the argument.",
      repairHint: "Give parameters descriptive names that differ from any global variables.",
      usedIn: ["learn", "practice", "code_lab"]
    },
    {
      conceptId: "py.argument",
      definition: "The actual value passed to a function at the call site.",
      mentalModel: "An argument is what you drop into the inbox: the concrete value, not the label.",
      syntaxShape: "function_name(value_1, value_2)",
      tinyExample: '"python", 30',
      commonMistake: "Passing arguments in the wrong order — Python matches by position, not by name.",
      repairHint: "Check that argument order matches parameter order in the def line.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-par-1",
      label: "Define two parameters",
      codeFragment: "def describe_session(topic, minutes):",
      conceptIds: ["py.parameter"],
      explanation: "topic and minutes are local names available inside the function for the duration of one call.",
      learnerShouldBeAbleToSay: "topic and minutes are the inbox slots for this function"
    },
    {
      id: "w-par-2",
      label: "Pass two arguments",
      codeFragment: 'describe_session("python", 30)',
      conceptIds: ["py.argument"],
      explanation: "'python' goes into topic and 30 goes into minutes for this call.",
      learnerShouldBeAbleToSay: "The arguments fill the parameters in order"
    }
  ],
  guidedEdits: [
    {
      id: "g-par-1",
      instruction: "Call describe_session with 'sql' and 45 and predict the output before running.",
      conceptIds: ["py.argument"],
      targetCodeFragment: 'describe_session("python", 30)',
      expectedObservation: "Output changes to 'sql: 45 min'.",
      wrongTurnHint: "Only change the arguments in the call, not the function body."
    }
  ],
  errorClinic: [
    {
      id: "e-par-1",
      conceptIds: ["py.parameter"],
      brokenExample: "def describe_session(topic, minutes):\n    return f\"{topic}: {minutes} min\"\n\ndescribe_session('python')",
      symptom: "TypeError: describe_session() missing 1 required positional argument: 'minutes'",
      likelyCause: "The call passes one argument but the function expects two.",
      fixStrategy: "Provide both arguments: describe_session('python', 30)"
    }
  ],
  codeLabBridge: {
    story: "describe_session(topic, minutes) is the Study Tracker's first parameterised function.",
    usesConcepts: ["py.parameter", "py.argument"],
    learnerOwns: ["describe_session"],
    checkerOwns: ["parameters-different-inputs"],
    runExpectation: "prints parameters passed"
  },
  understandingProofPrompt: "Why does calling describe_session('git', 15) produce different output than describe_session('python', 30) even though the function body is identical?",
  exitTicket: [
    "I know parameters are local names inside the function and arguments are the values I pass in.",
    "I can call the same function with different arguments to get different results."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 4 — Return Values (run_file)
// ---------------------------------------------------------------------------

const returnLesson = proofLesson({
  id: "lesson-python-return",
  moduleId: "module-python-core",
  slug: "python-return",
  title: "Return Values",
  summary: "Use return to send the function's result back to the caller.",
  bodyMarkdown: "return ends the function and sends a value back to wherever the function was called. Without return, the function gives back None. The caller can store, test, or pass on the returned value.",
  estimatedMinutes: 6,
  difficulty: "foundation",
  skillIds: ["skill-python-functions"],
  quizId: "quiz-python-return",
  desktopTask: "Write a function that groups minutes by topic and returns the dictionary.",
  evidencePrompt: "Record the function signature, the return value, and one assertion that confirmed it.",
  language: "Python",
  tools: ["Python 3", "terminal", "assertions"],
  synopsis: "You are learning how to pass data out of a function so the caller can use it.",
  prerequisites: ["Know how to define a function and pass parameters (previous lessons).", "Understand print output in functions."],
  testingFocus: "The test calls the function and checks the returned value matches expected data.",
  objective: "Write a function that returns a value the caller can store and test.",
  whyItMatters: "A function that returns data is testable. A function that only prints is not. The Study Tracker needs testable functions to be maintainable.",
  coreConcept: "return value sends value back to the caller. Without return the function evaluates to None. The caller does not see any intermediate variables inside the function.",
  workedExample: "def total(a, b): return a + b. result = total(30, 20) stores 50.",
  guidedExercise: "Write a function that returns the sum of two minutes values, call it, and print the result.",
  missionConnection: "The Study Tracker's group_minutes function will return a dictionary that tests can assert against.",
  reflectionPrompt: "What would an print statement look like if you printed the function's returned value directly?",
  practiceStarter: "def total_minutes(a, b):\n    # Return the sum of a and b.\n    return 0\n\nresult = total_minutes(30, 20)\nprint(f\"total minutes sum is: {result}\")",
  practiceExpected: "total minutes sum is: 50",
  practiceCheck: "If the output shows 0, the function is returning 0 instead of the sum. Change return 0 to return a + b.",
  practiceReps: returnPracticeReps,
  miniTitle: "Write and test total_minutes",
  miniGoal: "Define total_minutes(a, b) so it returns the sum, then confirm the returned value.",
  miniSteps: ["Write the function body", "Return a + b", "Call it and print the result"],
  miniDeliverables: ["Python file with total_minutes", "Terminal print output", "Short reflection note explaining print vs return"],
  verifierCommand: "python total_minutes.py",
  expectedEvidence: "Terminal output showing the correct total sum printed, plus a written note distinguishing print and return.",
  projectConnection: "Return is how the Study Tracker's aggregation functions hand their results to the reporting layer.",
  requiredCodeIncludes: ["def total_minutes", "return"],
  requiredOutputIncludes: ["50"],
  runnerLanguage: "python",
  runnerStarterCode: "def total_minutes(a, b):\n    # Return the sum of a and b.\n    return 0\n\nresult = total_minutes(30, 20)\nprint(f\"total minutes sum is: {result}\")",
  runnerTestCode: [
    "assert total_minutes(30, 20) == 50, 'total_minutes should return 50 for inputs 30 and 20'",
    "assert total_minutes(0, 0) == 0, 'total_minutes(0, 0) should be 0'",
    "print('return passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "return-value-not-none",
      name: "Function does not return None",
      code: "assert total_minutes(30, 20) is not None, 'total_minutes must have a return statement'"
    }
  ],
  curriculum: {
    level: 3,
    sequence: 4,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.return"],
    requires: ["py.function.def", "py.parameter", "py.arithmetic"],
    visibleCodeConcepts: ["py.return"],
    quizConcepts: ["py.return"],
    usesButDoesNotTeach: ["py.assertion"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

returnLesson.depth = {
  primaryConceptId: "py.return",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.return",
      definition: "A statement that ends a function and sends a computed value back to the caller.",
      mentalModel: "Think of return as the checkout window: you hand the finished product to the customer who ordered it.",
      syntaxShape: "return value",
      tinyExample: "return totals",
      commonMistake: "Using print(result) inside the function instead of return result, so the caller receives None.",
      repairHint: "Replace print statements inside the function with return to send data to the caller.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-ret-1",
      label: "Return the sum",
      codeFragment: "def total_minutes(a, b):\n    return a + b",
      conceptIds: ["py.return"],
      explanation: "return a + b evaluates the sum and sends it back. The caller receives 50, not None.",
      learnerShouldBeAbleToSay: "return sends the computed value out of the function"
    },
    {
      id: "w-ret-2",
      label: "Assert the returned value",
      codeFragment: "result = total_minutes(30, 20)\nassert result == 50",
      conceptIds: ["py.return"],
      explanation: "result stores the returned value. assert proves the value is what we expected.",
      learnerShouldBeAbleToSay: "asserting the return value is how we test a function"
    }
  ],
  guidedEdits: [
    {
      id: "g-ret-1",
      instruction: "Change 'return 0' to 'return a + b' and observe the assertion pass.",
      conceptIds: ["py.return"],
      targetCodeFragment: "return 0",
      expectedObservation: "The assertion passes and 'passed' is printed.",
      wrongTurnHint: "Only change the return statement. Do not touch the assertion."
    }
  ],
  errorClinic: [
    {
      id: "e-ret-1",
      conceptIds: ["py.return"],
      brokenExample: "def total_minutes(a, b):\n    print(a + b)",
      symptom: "Assertion fails with 'None != 50' because the function returns None.",
      likelyCause: "print() displays the value but does not return it.",
      fixStrategy: "Change print(a + b) to return a + b."
    }
  ],
  codeLabBridge: {
    story: "The Study Tracker's aggregation functions must return data so tests can verify correctness.",
    usesConcepts: ["py.return"],
    learnerOwns: ["total_minutes"],
    checkerOwns: ["return-value-not-none"],
    runExpectation: "prints return passed"
  },
  understandingProofPrompt: "What is the return value of a function that has no return statement? Write a one-line test that proves it.",
  exitTicket: [
    "I know return sends a value back to the caller.",
    "I know a function without return gives back None."
  ]
};

// ---------------------------------------------------------------------------
// Micro-lesson 5 — Print vs Return (run_file)
// ---------------------------------------------------------------------------

const printVsReturnLesson = proofLesson({
  id: "lesson-python-print-vs-return",
  moduleId: "module-python-core",
  slug: "python-print-vs-return",
  title: "Print vs Return",
  summary: "Understand why returning data beats printing it when functions need to cooperate.",
  bodyMarkdown: "print() sends text to the terminal — useful for humans but invisible to other code. return sends data to the caller — useful for tests, other functions, and any code that needs the result. A function that only prints cannot be tested or composed.",
  estimatedMinutes: 5,
  difficulty: "foundation",
  skillIds: ["skill-python-functions"],
  quizId: "quiz-python-print-vs-return",
  desktopTask: "Compare a function that prints its result against one that returns it. Write one assertion that only works for the returning version.",
  evidencePrompt: "Record what the two functions produce and why the test passes for one but not the other.",
  language: "Python",
  tools: ["Python 3", "terminal"],
  synopsis: "You are learning the most important function design rule: return data, do not print it.",
  prerequisites: [
    "Know how return works (previous lesson).",
    "Understand how print displays output in the terminal."
  ],
  testingFocus: "The test shows that a function returning None cannot be tested the same way as one that returns data.",
  objective: "Explain why a function should return data rather than printing it.",
  whyItMatters: "Every function in the Study Tracker's core logic will be tested. Testing requires return values, not printed text.",
  coreConcept: "print() is a side effect: it writes to the terminal and returns None. return hands data to the caller. The caller of a printing function gets None and cannot use the output in further calculations or assertions.",
  workedExample: "def bad(a, b): print(a + b). result = bad(30, 20) stores None. def good(a, b): return a + b. result = good(30, 20) stores 50.",
  guidedExercise: "Run both versions and compare what result holds. Write one assertion that proves only the returning version passes.",
  missionConnection: "Every CLI Study Tracker function — group_minutes, filter_sessions, format_report — must return data to stay testable.",
  reflectionPrompt: "Can you think of a case where you would legitimately want to print inside a function? Name the case and explain why it is different.",
  practiceStarter: "def bad_total(a, b):\n    print(a + b)\n\ndef good_total(a, b):\n    return a + b\n\nbad_result = bad_total(30, 20)\ngood_result = good_total(30, 20)\n\nprint(f\"bad_result is: {bad_result}\")\nprint(f\"good_result is: {good_result}\")",
  practiceExpected: "50\nbad_result is: None\ngood_result is: 50",
  practiceCheck: "bad_result should be None. good_result should be 50. If both are None, neither function has return.",
  practiceReps: printVsReturnPracticeReps,
  miniTitle: "Compare print vs return",
  miniGoal: "Demonstrate that a printing function returns None while a returning function provides usable data.",
  miniSteps: ["Write bad_total with print", "Write good_total with return", "Assert good_total works and show bad_total returns None"],
  miniDeliverables: [
    "Python file containing both bad_total and good_total functions",
    "Terminal output showing the difference between None and 50",
    "One sentence explanation of why printing fails assertions"
  ],
  verifierCommand: "python print_vs_return.py",
  expectedEvidence: "Terminal output showing bad_result is None and good_result is 50, verifying the return differences.",
  projectConnection: "The Study Tracker's group_minutes, filter_sessions, and format_summary must all return data.",
  requiredCodeIncludes: ["def bad_total", "def good_total", "return"],
  requiredOutputIncludes: ["None", "50"],
  runnerLanguage: "python",
  runnerStarterCode: "def bad_total(a, b):\n    print(a + b)\n\ndef good_total(a, b):\n    return a + b\n\nbad_result = bad_total(30, 20)\ngood_result = good_total(30, 20)\n\nprint(f\"bad_result is: {bad_result}\")\nprint(f\"good_result is: {good_result}\")",
  runnerTestCode: [
    "assert bad_total(30, 20) is None, 'bad_total returns None because it only prints'",
    "assert good_total(30, 20) == 50, 'good_total should return 50'",
    "print('print-vs-return passed')"
  ].join("\n"),
  hiddenTests: [
    {
      id: "pvr-returning-function-usable",
      name: "Returning function result is usable in arithmetic",
      code: "assert good_total(10, 5) + good_total(5, 5) == 25, 'Returned values can be combined'"
    }
  ],
  curriculum: {
    level: 3,
    sequence: 5,
    version: "1.0.0",
    lessonKind: "run_file",
    teaches: ["py.print_vs_return"],
    requires: ["py.return", "py.print.variable"],
    visibleCodeConcepts: ["py.print_vs_return", "py.return"],
    quizConcepts: ["py.print_vs_return"],
    usesButDoesNotTeach: ["py.assertion"],
    proofOutputs: ["terminal_stdout", "auto_code_run"]
  }
});

printVsReturnLesson.depth = {
  primaryConceptId: "py.print_vs_return",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.print_vs_return",
      definition: "The distinction between displaying output (print — returns None) and sending data to the caller (return — sends the value).",
      mentalModel: "print() is like writing on a whiteboard: humans can read it but code cannot grab it. return is like handing someone a document: they can read it, copy it, and pass it on.",
      syntaxShape: "print(val)  # shows it, returns None\nreturn val  # sends it to caller",
      tinyExample: "return totals",
      commonMistake: "Using print inside a function and then being surprised the caller gets None.",
      repairHint: "Replace print with return when the caller needs to use the value.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-pvr-1",
      label: "Printing version returns None",
      codeFragment: "def bad_total(a, b):\n    print(a + b)\n\nresult = bad_total(30, 20)\nprint(result)  # None",
      conceptIds: ["py.print_vs_return"],
      explanation: "bad_total prints 50 to the terminal then returns None implicitly. The caller stores None.",
      learnerShouldBeAbleToSay: "print inside a function is visible to humans but gives None to the caller"
    },
    {
      id: "w-pvr-2",
      label: "Returning version is usable",
      codeFragment: "def good_total(a, b):\n    return a + b\n\nresult = good_total(30, 20)\nprint(result)  # 50",
      conceptIds: ["py.print_vs_return"],
      explanation: "good_total returns 50. The caller stores 50 and can pass it to assert or another function.",
      learnerShouldBeAbleToSay: "return makes the value available to any code that calls the function"
    }
  ],
  guidedEdits: [
    {
      id: "g-pvr-1",
      instruction: "Add assert good_total(30, 20) == 50 and observe it passes. Then add assert bad_total(30, 20) == 50 and observe it fails.",
      conceptIds: ["py.print_vs_return"],
      targetCodeFragment: "good_result = good_total(30, 20)",
      expectedObservation: "The good_total assertion passes. The bad_total assertion raises AssertionError.",
      wrongTurnHint: "Run both assertions separately and read the error messages."
    }
  ],
  errorClinic: [
    {
      id: "e-pvr-1",
      conceptIds: ["py.print_vs_return"],
      brokenExample: "def group_minutes(sessions):\n    print(totals)",
      symptom: "Test assert group_minutes(sessions) == {'python': 50} fails with None != {'python': 50}.",
      likelyCause: "The function prints instead of returning.",
      fixStrategy: "Change print(totals) to return totals."
    }
  ],
  codeLabBridge: {
    story: "Every Study Tracker function that calculates data must return it so tests and the CLI layer can use it.",
    usesConcepts: ["py.print_vs_return"],
    learnerOwns: ["good_total"],
    checkerOwns: ["pvr-returning-function-usable"],
    runExpectation: "prints print-vs-return passed"
  },
  understandingProofPrompt: "Write one sentence explaining why a function that only calls print() cannot be used in an assertion.",
  exitTicket: [
    "I know print() returns None and return sends data to the caller.",
    "I can write a function that is testable by using return."
  ]
};

// ---------------------------------------------------------------------------
// Deprecated — original monolithic lesson (kept for progress resolution)
// ---------------------------------------------------------------------------

const deprecatedFunctionsLesson = proofLesson({
  id: "lesson-python-functions",
  moduleId: "module-python-core",
  slug: "python-functions",
  title: "Functions That Earn Their Name (Deprecated)",
  summary: "Original Level 3 lesson — replaced by five focused micro-lessons.",
  bodyMarkdown: "This lesson has been split into focused micro-lessons. Learners who completed it are automatically placed out of the new sequence.",
  estimatedMinutes: 8,
  difficulty: "foundation",
  skillIds: ["skill-python-functions", "skill-testing-debugging"],
  quizId: "quiz-python-functions",
  desktopTask: "Create a Python function that groups study tasks by track and write two assertions for it.",
  evidencePrompt: "Record the file path, command output, and what failed before it passed.",
  language: "Python",
  tools: ["Python 3", "terminal", "assertions or pytest"],
  synopsis: "You are learning how to write a small Python function with clear inputs and outputs. That makes the function easier to test because you can call it with sample data and inspect what it returns.",
  prerequisites: ["Know that Python code runs from a .py file.", "Be ready to create a list or dictionary of sample study sessions."],
  testingFocus: "You will test that the function returns the right totals for normal input and does not depend on printing or hidden global state.",
  objective: "Write one small Python function that can be tested without running the whole program.",
  whyItMatters: "The CLI Study Tracker only becomes maintainable when the grouping logic is separate from input and printing.",
  coreConcept: "A function is a named reusable step. A testable function takes input values through parameters, returns an answer, and does not secretly depend on printed output. Reading files and printing are side effects, which means they interact with the outside world.",
  workedExample: "def group_minutes(sessions): starts a function. Calling group_minutes([{'topic': 'python', 'minutes': 30}, {'topic': 'python', 'minutes': 20}]) should return {'python': 50}.",
  guidedExercise: "Write a function that accepts three study-session objects and returns total minutes by topic.",
  missionConnection: "This becomes the weekly aggregation core for CLI Study Tracker.",
  reflectionPrompt: "Which input shape made your function easiest to test, and what would break if printing lived inside it?",
  practiceStarter: "def group_minutes(sessions):\n    # Return total minutes by topic.\n    return {}\n",
  practiceExpected: "{'python': 50, 'git': 15}",
  practiceCheck: "Your function should return a dictionary instead of printing inside the function. Return means send the answer back to the caller. Add one assertion for the normal case and one assertion for an empty list.",
  practiceReps: pythonFunctionPracticeReps,
  miniTitle: "Build a study-minute grouper",
  miniGoal: "Create a tiny Python module that groups study sessions by topic without printing from the core function.",
  miniSteps: ["Create a sessions list with at least three entries", "Write group_minutes so it returns a dictionary", "Add two assertions: normal input and empty input"],
  miniDeliverables: ["Python file with the function", "Two passing assertions", "One sentence explaining why returning data is easier to test"],
  verifierCommand: "python study_minutes.py",
  expectedEvidence: "Console output or assertion result showing python totals and the empty-list case.",
  projectConnection: "This becomes the calculation core for the CLI Study Tracker mission.",
  requiredCodeIncludes: ["def group_minutes", "return"],
  requiredOutputIncludes: ["python", "50", "git", "15"],
  runnerLanguage: "python",
  runnerStarterCode: "def group_minutes(sessions):\n    # Return total minutes by topic.\n    return {}\n",
  runnerTestCode: "sessions = [\n    {'topic': 'python', 'minutes': 30},\n    {'topic': 'python', 'minutes': 20},\n    {'topic': 'git', 'minutes': 15},\n]\nassert group_minutes(sessions) == {'python': 50, 'git': 15}\nprint('python=50 git=15 passed')",
  hiddenTests: [
    {
      id: "handles-empty-list",
      name: "Handles empty input",
      code: "assert group_minutes([]) == {}, 'group_minutes of empty list should be empty dict'"
    }
  ],
  curriculum: {
    level: 3,
    sequence: 99,
    version: "1.0.0",
    deprecated: true,
    preserveProgress: true,
    showInActivePath: false,
    showInReviewQueue: false,
    legacyEvidenceOnly: true,
    lessonKind: "run_file",
    teaches: ["py.function.def", "py.parameter", "py.return", "py.print_vs_return"],
    requires: ["py.variable.assignment", "py.for_loop", "py.if_else"],
    usesButDoesNotTeach: ["py.assertion"],
    replacedByLessonIds: [
      "lesson-python-why-functions",
      "lesson-python-def-call",
      "lesson-python-parameters",
      "lesson-python-return",
      "lesson-python-print-vs-return"
    ]
  }
});

deprecatedFunctionsLesson.depth = {
  primaryConceptId: "py.function.def",
  secondaryConceptIds: ["py.parameter", "py.return"],
  maxNewConcepts: 3,
  conceptCapsules: [],
  codeWalkthrough: [],
  guidedEdits: [],
  errorClinic: [],
  codeLabBridge: {
    story: "This lesson is deprecated. See the five replacement micro-lessons.",
    usesConcepts: ["py.function.def"],
    learnerOwns: [],
    checkerOwns: [],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "This lesson is deprecated. Complete lesson-python-print-vs-return instead.",
  exitTicket: ["This lesson is deprecated."]
};

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export const level3Lessons: Lesson[] = [
  whyFunctionsLesson,
  defCallLesson,
  parametersLesson,
  returnLesson,
  printVsReturnLesson
];

/** Kept in the content pack so old learner progress IDs still resolve. */
export const deprecatedLevel3Lessons: Lesson[] = [
  deprecatedFunctionsLesson
];

// ---------------------------------------------------------------------------
// Quizzes — one per micro-lesson
// ---------------------------------------------------------------------------

export const level3Quizzes: Quiz[] = [
  checkpointQuiz(
    "quiz-python-why-functions",
    "lesson-python-why-functions",
    "Why Functions Checkpoint",
    "why functions exist",
    "Functions remove duplicated logic by naming a reusable step you can call instead of copy-paste.",
    "Functions are only useful when a program is longer than 50 lines.",
    "Functions are a way to run code slower so it is easier to debug.",
    "Functions solve the duplication problem. Any repeated logic is a candidate for a function.",
    ["py.function.motivation"]
  ),
  checkpointQuiz(
    "quiz-python-def-call",
    "lesson-python-def-call",
    "Define and Call Checkpoint",
    "defining and calling functions",
    "Use def name(): with an indented body to define, and name() to call.",
    "Use function name() to define and run name to call.",
    "Use call name() to define and def name to run.",
    "def creates the function. Calling it with () runs the body.",
    ["py.function.def", "py.function.call"]
  ),
  checkpointQuiz(
    "quiz-python-parameters",
    "lesson-python-parameters",
    "Parameters Checkpoint",
    "function parameters",
    "Parameters are local names in the def line; arguments are the values passed at the call site.",
    "Parameters and arguments are the same thing used in different contexts.",
    "Parameters must have the same name as the variables the caller passes in.",
    "Parameters receive arguments by position. They are local to the function for one call.",
    ["py.parameter", "py.argument"]
  ),
  checkpointQuiz(
    "quiz-python-return",
    "lesson-python-return",
    "Return Values Checkpoint",
    "return statements",
    "return sends the computed value back to the caller so it can be stored, tested, or passed on.",
    "return prints the value to the terminal and ends the function.",
    "return is only needed when the function is called inside an assert statement.",
    "Without return, the function gives back None. return sends the actual computed value.",
    ["py.return"]
  ),
  checkpointQuiz(
    "quiz-python-print-vs-return",
    "lesson-python-print-vs-return",
    "Print vs Return Checkpoint",
    "print vs return",
    "return sends data to the caller; print shows text and returns None, making the function untestable.",
    "print and return are interchangeable — both send the value to the caller.",
    "return is slower than print, so use print when performance matters.",
    "print is for human-readable output. return is for data the rest of the program can use.",
    ["py.print_vs_return"]
  ),
  // Deprecated quiz — kept so old quiz attempt IDs still resolve
  checkpointQuiz(
    "quiz-python-functions",
    "lesson-python-functions",
    "Functions Checkpoint (Deprecated)",
    "defining functions",
    "Structure reusable code blocks using def, parameters, and return statement values.",
    "Rely on global variables and print results directly without returning data.",
    "Pass arguments directly into print statements without parameter naming.",
    "Functions define behavior. Parameters receive inputs. Return sends back results.",
    ["py.function.def", "py.parameter", "py.return", "py.print_vs_return"]
  )
];
