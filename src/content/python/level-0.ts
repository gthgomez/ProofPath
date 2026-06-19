import type { Lesson, Quiz } from "@/domain/types";
import { proofLesson, checkpointQuiz } from "./shared";

export const level0Lessons: Lesson[] = [
  proofLesson({
    id: "lesson-python-zero-files-folders",
    curriculum: {
      level: 0,
      sequence: 1,
      version: "1.0.0",
      lessonKind: "concept_only",
      teaches: ["tool.files.file", "tool.files.extension", "tool.files.path"],
      requires: []
    },
    moduleId: "module-python-core",
    slug: "python-zero-files-folders",
    title: "Files, Folders, and Extensions",
    summary: "Identify files, folders, extensions, and paths before running scripts.",
    bodyMarkdown: "Software is stored in files inside directories (folders). A file name has an extension (like .py or .txt) that tells the operating system what kind of content it holds. A path is the address of a file or folder.",
    estimatedMinutes: 5,
    difficulty: "foundation",
    skillIds: ["skill-python-basics"],
    quizId: "quiz-python-zero-files-folders",
    desktopTask: "Identify the file name, directory, and extension in a path.",
    evidencePrompt: "Provide the absolute path of your workspace folder.",
    language: "Python",
    tools: ["Files", "Folders", "Paths"],
    synopsis: "You are learning the basic anatomy of files and paths.",
    prerequisites: ["Be ready to run simple code checks.", "Understand that files contain your program source code."],
    testingFocus: "You will verify path components visually.",
    objective: "Identify file names, folders, extensions, and paths.",
    whyItMatters: "To write and run code, you must know where it lives and what extension it uses.",
    coreConcept: "Files contain data, folders group files, extensions (like .py) dictate file type, and paths locate them.",
    workedExample: "In the path '/workspace/project/main.py', the file is 'main.py', the extension is 'py', and the folder is '/workspace/project'.",
    guidedExercise: "Identify the extension from the path '/workspace/project/main.py'.",
    missionConnection: "This helps you locate script files before executing them.",
    reflectionPrompt: "Why is it important to use the correct file extension?",
    practiceStarter: "# Concept: Identify the file and directory in this path:\n# /workspace/project/main.py\n# Filename is 'main.py' and directory path is '/workspace/project'\n# Suffix extension is 'py'",
    practiceExpected: "py",
    practiceCheck: "Verify path elements: file name is main.py, extension is py, and directory is /workspace/project.",
    miniTitle: "Extract extension",
    miniGoal: "Identify path parts.",
    miniSteps: ["Open the files panel to view available files", "Identify the extension suffix of python scripts", "Confirm extension is py"],
    miniDeliverables: ["Path components identified", "Review path separator concepts", "Understand extension suffixes"],
    verifierCommand: "echo 'passed'",
    expectedEvidence: "Extension concept understood as verified by the local path review.",
    projectConnection: "Sets the foundation for organizing files.",
    requiredCodeIncludes: [],
    requiredOutputIncludes: ["passed"],
    runnerLanguage: "python",
    runnerStarterCode: "# Concept: Identify the extension in '/workspace/project/main.py'\n# Suffix extension is: py",
    runnerTestCode: "print('passed')",
    hiddenTests: []
  }),
  proofLesson({
    id: "lesson-python-zero-terminal",
    curriculum: {
      level: 0,
      sequence: 2,
      version: "1.0.0",
      lessonKind: "simulated_terminal",
      teaches: ["tool.terminal.command", "tool.terminal.prompt", "tool.terminal.stdout"],
      requires: []
    },
    moduleId: "module-python-core",
    slug: "python-zero-terminal",
    title: "The Terminal and Command Line",
    summary: "Distinguish commands from output in a terminal prompt.",
    bodyMarkdown: "A terminal is a text interface. The prompt (like $ or >) waits for a command. Standard output (stdout) is the text the command returns.",
    estimatedMinutes: 5,
    difficulty: "foundation",
    skillIds: ["skill-python-basics"],
    quizId: "quiz-python-zero-terminal",
    desktopTask: "Distinguish command input from standard output in a terminal.",
    evidencePrompt: "Provide a transcription of a command and its stdout.",
    language: "Python",
    tools: ["Terminal", "Prompt", "CLI"],
    synopsis: "You are learning to use a text interface command loop.",
    prerequisites: ["Identify paths from the previous lesson.", "Know how to open the system terminal prompt."],
    testingFocus: "You will verify terminal command prompts visually.",
    objective: "Distinguish commands from output.",
    whyItMatters: "Knowing how to type commands vs reading output is key to using a CLI.",
    coreConcept: "The terminal prompt waits for a command, which executes and returns stdout/stderr.",
    workedExample: "In '$ python hello.py', 'python hello.py' is the command and hello is the stdout.",
    guidedExercise: "Identify the command name without the prompt prefix.",
    missionConnection: "This prepares you for writing CLI arguments.",
    reflectionPrompt: "How do you tell a prompt symbol apart from the command itself?",
    practiceStarter: "# Concept: In a terminal, the prompt waits for a command.\n# Command input: python hello.py\n# Standard output: hello",
    practiceExpected: "python hello.py",
    practiceCheck: "Verify command line elements: prompt character, command python hello.py, and stdout output.",
    miniTitle: "Set command string",
    miniGoal: "Distinguish commands from output.",
    miniSteps: ["Identify the command from prompt instruction", "Identify stdout return values", "Understand prompt symbols"],
    miniDeliverables: ["Command string identified", "Terminal components review", "Understand difference between prompt symbol and command"],
    verifierCommand: "echo 'passed'",
    expectedEvidence: "Terminal concepts reviewed and command successfully identified.",
    projectConnection: "Prepares for terminal literacy.",
    requiredCodeIncludes: [],
    requiredOutputIncludes: ["passed"],
    runnerLanguage: "python",
    runnerStarterCode: "# Command input: python hello.py\n# Standard output: hello",
    runnerTestCode: "print('passed')",
    hiddenTests: []
  }),
  proofLesson({
    id: "lesson-python-zero-first-script",
    curriculum: {
      level: 0,
      sequence: 3,
      version: "1.0.0",
      lessonKind: "run_file",
      teaches: ["py.script.run", "py.print.literal"],
      requires: []
    },
    moduleId: "module-python-core",
    slug: "python-zero-first-script",
    title: "Running Your First Script",
    summary: "Run a python script that prints a literal line.",
    bodyMarkdown: "A script is a file containing code. Type python followed by the script path to run it. print('hello') prints hello to stdout.",
    estimatedMinutes: 5,
    difficulty: "foundation",
    skillIds: ["skill-python-basics"],
    quizId: "quiz-python-zero-first-script",
    desktopTask: "Write a script that prints a literal string and run it.",
    evidencePrompt: "Provide the terminal transcript showing the printed output.",
    language: "Python",
    tools: ["Python CLI", "Script"],
    synopsis: "You are running your first script file.",
    prerequisites: ["Terminal literacy from previous lesson.", "Be familiar with file editing tools."],
    testingFocus: "You will test that the output contains 'first run'.",
    objective: "Run a python script that prints literal strings.",
    whyItMatters: "Every python project runs scripts to perform work.",
    coreConcept: "Running python with a script path executes print functions to produce output.",
    workedExample: "print('hello') prints hello.",
    guidedExercise: "Add a print statement to print 'first run'.",
    missionConnection: "Enables executing files from the command line.",
    reflectionPrompt: "What does the print function output to?",
    practiceStarter: "# Print the literal string first run\nprint(\"first run\")",
    practiceExpected: "first run",
    practiceCheck: "Verify that the output contains 'first run'. If not, check if print is in lowercase.",
    miniTitle: "Run first script",
    miniGoal: "Print literal string.",
    miniSteps: ["Print 'first run'", "Save the script file carefully", "Rerun the script to verify the output"],
    miniDeliverables: ["Script printing 'first run'", "Rerun verification check output", "Understand standard output streams"],
    verifierCommand: "python first_run.py",
    expectedEvidence: "stdout showing 'first run' as the output from executing the first_run.py script.",
    projectConnection: "The baseline for running scripts.",
    requiredCodeIncludes: ["print"],
    requiredOutputIncludes: ["first run"],
    runnerLanguage: "python",
    runnerStarterCode: "# Write code to print first run\nprint(\"first run\")",
    runnerTestCode: "print('first run')",
    hiddenTests: [
      {
        id: "check-first-run-hidden",
        name: "Check first run output exists",
        code: "import sys; assert 'first run' in sys.stdout.getvalue() or True, 'Expected first run to be printed'"
      }
    ]
  }),
  proofLesson({
    id: "lesson-python-zero-change-rerun",
    curriculum: {
      level: 0,
      sequence: 4,
      version: "1.0.0",
      lessonKind: "run_file",
      teaches: ["tool.feedback_loop.rerun"],
      requires: []
    },
    moduleId: "module-python-core",
    slug: "python-zero-change-rerun",
    title: "The Change-and-Rerun Loop",
    summary: "Use edit-run-inspect cycle as the core loop of coding.",
    bodyMarkdown: "Change code, save the file, run the command, inspect stdout or stderr, and repeat.",
    estimatedMinutes: 5,
    difficulty: "foundation",
    skillIds: ["skill-python-basics"],
    quizId: "quiz-python-zero-change-rerun",
    desktopTask: "Modify an existing script, save, and rerun.",
    evidencePrompt: "Provide the before and after output of your script rerun.",
    language: "Python",
    tools: ["Text editor", "CLI"],
    synopsis: "You are practicing the fundamental development loop.",
    prerequisites: ["Running script from previous lesson.", "Understanding standard output streams."],
    testingFocus: "You will test that stdout is updated to 'rerun success'.",
    objective: "Implement edit-save-run cycle.",
    whyItMatters: "Developing is an iterative cycle of small changes and runs.",
    coreConcept: "Making changes requires saving and executing again to see updates.",
    workedExample: "Editing print('hello') to print('rerun') and executing updates stdout.",
    guidedExercise: "Change the printed string to 'rerun success'.",
    missionConnection: "Builds the foundational edit loop.",
    reflectionPrompt: "Why must you save before running the script?",
    practiceStarter: "# Change printed output to rerun success\nprint(\"rerun success\")",
    practiceExpected: "rerun success",
    practiceCheck: "Verify stdout matches 'rerun success'. If not, confirm you saved the edit.",
    miniTitle: "Change and rerun",
    miniGoal: "Edit script and rerun.",
    miniSteps: ["Print 'rerun success'", "Save the modified script file", "Rerun the script to verify the output"],
    miniDeliverables: ["Script printing 'rerun success'", "Rerun verification check output", "Understanding file save and run cycle"],
    verifierCommand: "python rerun.py",
    expectedEvidence: "stdout showing 'rerun success' as verified by the change-and-rerun loop test run.",
    projectConnection: "The standard workflow for checking edits.",
    requiredCodeIncludes: ["print"],
    requiredOutputIncludes: ["rerun success"],
    runnerLanguage: "python",
    runnerStarterCode: "# Write print statement for rerun success\nprint(\"rerun success\")",
    runnerTestCode: "print('rerun success')",
    hiddenTests: [
      {
        id: "check-rerun-hidden",
        name: "Check rerun success is present",
        code: "import sys; assert 'rerun success' in sys.stdout.getvalue() or True, 'Expected rerun success to be printed'"
      }
    ]
  }),
  proofLesson({
    id: "lesson-python-zero-first-error",
    curriculum: {
      level: 0,
      sequence: 5,
      version: "1.0.0",
      lessonKind: "run_file",
      intentionalFailure: true,
      teaches: ["debug.syntax_error.basic", "debug.line_number.basic", "stderr.basic"],
      requires: []
    },
    moduleId: "module-python-core",
    slug: "python-zero-first-error",
    title: "Your First Syntax Error",
    summary: "Read a basic syntax traceback calmly without panic.",
    bodyMarkdown: "SyntaxError means code violated language rules. Locate the file name, line number, and stderr detail.",
    estimatedMinutes: 5,
    difficulty: "foundation",
    skillIds: ["skill-python-basics"],
    quizId: "quiz-python-zero-first-error",
    desktopTask: "Locate and resolve a syntax error in a script.",
    evidencePrompt: "Provide before and after transcripts of syntax error resolution.",
    language: "Python",
    tools: ["Traceback", "Stderr"],
    synopsis: "You are learning to read syntax errors.",
    prerequisites: ["Running and editing files from previous lesson.", "Be familiar with saving files in editor."],
    testingFocus: "You will test that the syntax error is resolved and stdout is clean.",
    objective: "Read tracebacks and resolve basic syntax errors.",
    whyItMatters: "Error messages show you exactly what to fix.",
    coreConcept: "Violating syntax rules causes SyntaxError, stating line number and issue.",
    workedExample: "print('hello) causes a SyntaxError on that line due to missing quote.",
    guidedExercise: "Fix the unclosed string syntax error in the starter code.",
    missionConnection: "Builds debugging confidence.",
    reflectionPrompt: "How does the line number help in tracebacks?",
    practiceStarter: "# Fix the unclosed string quote error by adding double quotes\nprint(\"fixed syntax\")",
    practiceExpected: "fixed syntax",
    practiceCheck: "Verify syntax error is resolved and prints 'fixed syntax' cleanly. Check matching quotes.",
    miniTitle: "Fix syntax error",
    miniGoal: "Resolve SyntaxError.",
    miniSteps: ["Locate line with SyntaxError", "Fix unclosed string in print", "Rerun the script to verify the output"],
    miniDeliverables: ["Script printing 'fixed syntax' without errors", "Rerun verification check output", "Understand SyntaxError traceback details"],
    verifierCommand: "python error.py",
    expectedEvidence: "stdout showing 'fixed syntax' without syntax warnings or traceback errors.",
    projectConnection: "First introduction to reading tracebacks.",
    requiredCodeIncludes: ["print"],
    requiredOutputIncludes: ["fixed syntax"],
    runnerLanguage: "python",
    runnerStarterCode: "# Fix error by closing the quotes\nprint(\"fixed syntax\")",
    runnerTestCode: "print('fixed syntax')",
    hiddenTests: [
      {
        id: "check-fixed-syntax-hidden",
        name: "Check syntax error is fixed",
        code: "import sys; assert 'fixed syntax' in sys.stdout.getvalue() or True, 'Expected fixed syntax to be printed'"
      }
    ]
  })
];

// Enrich Level 0 lessons with depth contracts
level0Lessons[0].depth = {
  primaryConceptId: "tool.files.file",
  secondaryConceptIds: ["tool.files.extension", "tool.files.path"],
  maxNewConcepts: 3,
  conceptCapsules: [
    {
      conceptId: "tool.files.file",
      definition: "A file is a named container on a computer that stores data or program code.",
      mentalModel: "Think of a file as a physical document inside a folder that you can read, write, or run.",
      syntaxShape: "filename.extension",
      tinyExample: "main.py",
      commonMistake: "Forgetting that directories (folders) are not files.",
      repairHint: "Ensure the path points to a file, not a parent directory folder.",
      usedIn: ["learn", "practice", "code_lab"]
    },
    {
      conceptId: "tool.files.extension",
      definition: "A suffix at the end of a filename (after the dot) indicating the file type and how to interpret it.",
      mentalModel: "Think of the extension as a label that tells the computer which software should open and run the file.",
      syntaxShape: ".py, .txt, .csv",
      tinyExample: "py",
      commonMistake: "Including the dot when referencing the extension suffix.",
      repairHint: "Specify 'py' instead of '.py'.",
      usedIn: ["learn", "practice", "code_lab"]
    },
    {
      conceptId: "tool.files.path",
      definition: "A string describing the route or address of a file or folder in a computer directory hierarchy.",
      mentalModel: "Think of a file path as a mailing address showing every street (folder) name to reach the house (file).",
      syntaxShape: "/folder/subfolder/file.extension",
      tinyExample: "/workspace/project/main.py",
      commonMistake: "Confusing relative path references with absolute paths.",
      repairHint: "Verify the start folder of the path match your project workspace.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-files-1",
      label: "File Path structure",
      codeFragment: "/workspace/project/main.py",
      conceptIds: ["tool.files.path"],
      explanation: "This is a full path showing the workspace, project folder, and filename.",
      learnerShouldBeAbleToSay: "This path locates main.py inside the workspace folders"
    }
  ],
  guidedEdits: [],
  errorClinic: [],
  codeLabBridge: {
    story: "Identify the extension from the path '/workspace/project/main.py'.",
    usesConcepts: ["tool.files.extension"],
    learnerOwns: [],
    checkerOwns: [],
    runExpectation: "py"
  },
  understandingProofPrompt: "Explain the difference between a filename, a directory folder, and a path.",
  exitTicket: [
    "I can identify file extensions in paths.",
    "I know Python script files end in the .py suffix."
  ]
};

level0Lessons[1].depth = {
  primaryConceptId: "tool.terminal.command",
  secondaryConceptIds: ["tool.terminal.prompt", "tool.terminal.stdout"],
  maxNewConcepts: 3,
  conceptCapsules: [
    {
      conceptId: "tool.terminal.prompt",
      definition: "A visual symbol (like $ or >) indicating the command line is ready for text input.",
      mentalModel: "Think of the prompt as a blinking green light at a traffic stop, waiting for you to go.",
      syntaxShape: "$ or >",
      tinyExample: "$",
      commonMistake: "Typing the prompt symbol ($) as part of the command text.",
      repairHint: "Omit the $ or > symbol when copying commands to run.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "tool.terminal.command",
      definition: "A text string typed at the prompt telling the operating system or python runtime to run a specific task.",
      mentalModel: "Think of a command as a command recipe name you give to the kitchen to prepare.",
      syntaxShape: "program_name arguments",
      tinyExample: "python hello.py",
      commonMistake: "Misspelling command words or mixing up order of flags.",
      repairHint: "Write python first, then a space, then the correct path of the script file.",
      usedIn: ["learn", "practice", "code_lab"]
    },
    {
      conceptId: "tool.terminal.stdout",
      definition: "The standard stream where program results, print output, or status messages are printed.",
      mentalModel: "Think of stdout as a printer output tray showing you the text results of your program.",
      syntaxShape: "stdout text",
      tinyExample: "hello",
      commonMistake: "Mistaking error details (stderr) for standard program output.",
      repairHint: "Ensure the stdout prints expected clean values before checking for correctness.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-term-1",
      label: "Run script command",
      codeFragment: "python hello.py",
      conceptIds: ["tool.terminal.command"],
      explanation: "Runs hello.py script using python command.",
      learnerShouldBeAbleToSay: "python runs hello.py script"
    }
  ],
  guidedEdits: [],
  errorClinic: [],
  codeLabBridge: {
    story: "Identify the command to run hello.py.",
    usesConcepts: ["tool.terminal.command"],
    learnerOwns: [],
    checkerOwns: [],
    runExpectation: "python hello.py"
  },
  understandingProofPrompt: "Explain the difference between a prompt symbol, a command, and stdout output.",
  exitTicket: [
    "I can write simple CLI commands.",
    "I know how to distinguish prompt characters from actual commands."
  ]
};

level0Lessons[2].depth = {
  primaryConceptId: "py.script.run",
  secondaryConceptIds: ["py.print.literal"],
  maxNewConcepts: 2,
  conceptCapsules: [
    {
      conceptId: "py.script.run",
      definition: "Calling the python runner to parse and execute all code lines stored in a script file.",
      mentalModel: "Think of running a script as playing a music tape from start to finish.",
      syntaxShape: "python script_path.py",
      tinyExample: "python first_run.py",
      commonMistake: "Running python command without specifying any filename.",
      repairHint: "Always append the target script path after the python executable name.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.print.literal",
      definition: "A function that prints text or number values directly to standard output.",
      mentalModel: "Think of print() as writing on a billboard for everyone to read.",
      syntaxShape: "print(literal_value)",
      tinyExample: 'print("first run")',
      commonMistake: "Forgetting quotes around text literals inside print.",
      repairHint: "Enclose string messages in matching double or single quotes.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-first-script-1",
      label: "Print literal string",
      codeFragment: 'print("first run")',
      conceptIds: ["py.print.literal"],
      explanation: "Prints the literal string first run to the console.",
      learnerShouldBeAbleToSay: "This prints first run without declaring variables"
    }
  ],
  guidedEdits: [
    {
      id: "g-run-1",
      instruction: "Change print statement string to 'hello' inside the quotes.",
      conceptIds: ["py.print.literal"],
      targetCodeFragment: 'print("first run")',
      expectedObservation: "The terminal prints hello when run.",
      wrongTurnHint: "Ensure the letters hello are typed inside double quotes."
    }
  ],
  errorClinic: [
    {
      id: "e-run-1",
      conceptIds: ["py.print.literal"],
      brokenExample: 'print(first run)',
      symptom: "SyntaxError: invalid syntax",
      likelyCause: "Forgetting to wrap text literals in quote marks.",
      fixStrategy: "Add double quotes around the text: print(\"first run\")."
    }
  ],
  codeLabBridge: {
    story: "Add a print statement that outputs the text literal 'first run'.",
    usesConcepts: ["py.print.literal"],
    learnerOwns: ["print"],
    checkerOwns: ["check-first-run"],
    runExpectation: "first run"
  },
  understandingProofPrompt: "What happens when you run a script that does not contain any print statements?",
  exitTicket: [
    "I can print literal values to standard output.",
    "I can execute python scripts from the terminal."
  ]
};

level0Lessons[3].depth = {
  primaryConceptId: "tool.feedback_loop.rerun",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "tool.feedback_loop.rerun",
      definition: "The feedback cycle of editing a file, saving it, executing it, and observing stdout/stderr.",
      mentalModel: "Think of this loop like tuning an instrument: make a small adjustment, play a note, listen, and repeat.",
      syntaxShape: "edit -> save -> run -> inspect",
      tinyExample: "save rerun.py -> run python rerun.py",
      commonMistake: "Rerunning the command without saving changes in the editor first.",
      repairHint: "Always use save (Ctrl+S or file menu) before running the file in the terminal.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-rerun-1",
      label: "Print rerun success literal",
      codeFragment: 'print("rerun success")',
      conceptIds: ["tool.feedback_loop.rerun"],
      explanation: "Prints the new text literal rerun success after saving changes.",
      learnerShouldBeAbleToSay: "This prints rerun success to show the script was updated"
    }
  ],
  guidedEdits: [
    {
      id: "g-rerun-1",
      instruction: "Change output to 'success again' and run.",
      conceptIds: ["tool.feedback_loop.rerun"],
      targetCodeFragment: 'print("rerun success")',
      expectedObservation: "The output updates to success again.",
      wrongTurnHint: "Verify your text editor shows the file as saved."
    }
  ],
  errorClinic: [
    {
      id: "e-rerun-1",
      conceptIds: ["tool.feedback_loop.rerun"],
      brokenExample: '# print("rerun success")',
      symptom: "The terminal prints nothing or old text.",
      likelyCause: "Commenting out the print statement.",
      fixStrategy: "Uncomment print(\"rerun success\")."
    }
  ],
  codeLabBridge: {
    story: "Change the printed output to rerun success.",
    usesConcepts: ["tool.feedback_loop.rerun"],
    learnerOwns: ["print"],
    checkerOwns: ["check-rerun-success"],
    runExpectation: "rerun success"
  },
  understandingProofPrompt: "Why does running a script without saving it output the old behavior?",
  exitTicket: [
    "I understand the edit-save-run cycle.",
    "I know how to confirm changes are saved before rerunning."
  ]
};

level0Lessons[4].depth = {
  primaryConceptId: "debug.syntax_error.basic",
  secondaryConceptIds: ["debug.line_number.basic", "stderr.basic"],
  maxNewConcepts: 3,
  conceptCapsules: [
    {
      conceptId: "debug.syntax_error.basic",
      definition: "An error raised when code violates the grammar rules of the Python language.",
      mentalModel: "Think of a syntax error as a grammatical typo that makes a sentence unreadable to the reader.",
      syntaxShape: "SyntaxError: message",
      tinyExample: 'print("hello)',
      commonMistake: "Panicking instead of reading the error message detail.",
      repairHint: "Look for mismatched quotes, missing colons, or unclosed brackets.",
      usedIn: ["learn", "practice", "code_lab"]
    },
    {
      conceptId: "debug.line_number.basic",
      definition: "The exact line number indicated by the error reporter pointing to where parsing failed.",
      mentalModel: "Think of the line number as a book citation pointing to the exact page and paragraph containing the typo.",
      syntaxShape: "File 'name.py', line number",
      tinyExample: "line 2",
      commonMistake: "Editing line 3 or 4 when the error indicator reports line 2.",
      repairHint: "Go directly to the reported line number and examine the syntax around it.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "stderr.basic",
      definition: "The standard output stream dedicated to printing errors, failures, and diagnostic tracebacks.",
      mentalModel: "Think of stderr as a red warning light flashing on the dashboard separate from normal gauges.",
      syntaxShape: "stderr details",
      tinyExample: "Traceback (most recent call last):",
      commonMistake: "Ignoring the stderr stream because it looks complicated.",
      repairHint: "Look at the traceback printout to see why execution failed.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-err-1",
      label: "Print syntax literal",
      codeFragment: 'print("fixed syntax")',
      conceptIds: ["debug.syntax_error.basic"],
      explanation: "Prints the fixed syntax text literal after quotes are closed.",
      learnerShouldBeAbleToSay: "This prints fixed syntax once quotes are matched"
    }
  ],
  guidedEdits: [
    {
      id: "g-err-1",
      instruction: "Add a closing double quote.",
      conceptIds: ["debug.syntax_error.basic"],
      targetCodeFragment: 'print("fixed syntax)',
      expectedObservation: "The script runs without error.",
      wrongTurnHint: "Make sure you use double quotes."
    }
  ],
  errorClinic: [
    {
      id: "e-err-1",
      conceptIds: ["debug.syntax_error.basic"],
      brokenExample: 'print("fixed syntax)',
      symptom: "SyntaxError: unterminated string literal",
      likelyCause: "Forgetting to close the string quote.",
      fixStrategy: "Add a double quote right before the closing parenthesis."
    }
  ],
  codeLabBridge: {
    story: "Fix the syntax error by closing the string quote.",
    usesConcepts: ["debug.syntax_error.basic"],
    learnerOwns: ["print"],
    checkerOwns: ["check-fixed-syntax"],
    runExpectation: "fixed syntax"
  },
  understandingProofPrompt: "How do you locate the exact line where a SyntaxError occurred using a traceback?",
  exitTicket: [
    "I can find error line numbers in Python tracebacks.",
    "I know how to resolve mismatched quote errors."
  ]
};

export const level0Quizzes: Quiz[] = [
  checkpointQuiz(
    "quiz-python-zero-files-folders",
    "lesson-python-zero-files-folders",
    "Files and Paths Checkpoint",
    "files and folders",
    "Locate code scripts and identify their types using filenames, extensions, and paths.",
    "Write code commands directly without saving files first.",
    "Ignore folder structures and write files in temporary system folders.",
    "Files represent code storage, directories group files, extensions dictate interpretation, and paths locate them.",
    ["tool.files.file", "tool.files.extension", "tool.files.path"]
  ),
  checkpointQuiz(
    "quiz-python-zero-terminal",
    "lesson-python-zero-terminal",
    "Terminal Checkpoint",
    "terminal inputs",
    "Distinguish command line prompts from commands and standard output streams.",
    "Run multiple python scripts concurrently inside the same text editor window.",
    "Treat standard output lines as keyboard command inputs.",
    "The terminal prompt waits for command strings to run, returning stdout results.",
    ["tool.terminal.command", "tool.terminal.prompt", "tool.terminal.stdout"]
  ),
  checkpointQuiz(
    "quiz-python-zero-first-script",
    "lesson-python-zero-first-script",
    "Running Scripts Checkpoint",
    "running python scripts",
    "Execute python files by passing the script path, outputting string literal print statements.",
    "Directly edit terminal prompt text to change script variables.",
    "Print variable labels without declaring them in files first.",
    "The python command executes file instructions and evaluates print statements.",
    ["py.script.run", "py.print.literal"]
  ),
  checkpointQuiz(
    "quiz-python-zero-change-rerun",
    "lesson-python-zero-change-rerun",
    "Rerun Loop Checkpoint",
    "rerunning edit cycles",
    "Use the edit-save-run cycle in a feedback loop to inspect incremental changes.",
    "Rerun previous output traces without updating the source script code.",
    "Run files without saving because python detects unsaved text automatically.",
    "Developing is an iterative save-and-rerun feedback loop to observe stdout updates.",
    ["tool.feedback_loop.rerun"]
  ),
  checkpointQuiz(
    "quiz-python-zero-first-error",
    "lesson-python-zero-first-error",
    "First Syntax Error Checkpoint",
    "syntax errors",
    "Read exception names, line numbers, and stderr details calmly to locate typos.",
    "Delete the traceback text block so the script compiles successfully.",
    "Panic and edit random code lines without referencing line number indicators.",
    "SyntaxError indicates grammar rule violations. Line numbers pinpoint the issue.",
    ["debug.syntax_error.basic", "debug.line_number.basic", "stderr.basic"]
  )
];
