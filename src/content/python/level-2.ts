import type { Lesson, Quiz } from "@/domain/types";
import { proofLesson, checkpointQuiz } from "./shared";

const pythonCollectionPracticeReps = [
  {
    starterCode: "sessions = []\n# Add python 30 and git 15 as dictionaries.\nprint(sessions)",
    expectedOutput: "[{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}]",
    checkYourAnswer: "You should have one list and two dictionaries. If you made topic1 and topic2 variables, you avoided the record shape the next lessons need."
  },
  {
    starterCode: "session = {\"topic\": \"python\", \"minutes\": 30}\n# Add a completed field set to False.\nprint(session)",
    expectedOutput: "{'topic': 'python', 'minutes': 30, 'completed': False}",
    checkYourAnswer: "A dictionary can grow one named field at a time. Check that completed is a boolean, because later decisions will branch on it."
  },
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes': 15}]\nsecond_topic = \"\"\nprint(second_topic)",
    expectedOutput: "second topic: git\nThe second record's topic is git.",
    checkYourAnswer: "Read the list position first, then the dictionary key. The second item is index 1 because Python lists start at zero."
  }
];

const pythonDecisionPracticeReps = [
  {
    starterCode: "minutes = 10\nlabel = \"\"\n# Use if/else so short sessions become quick.\nprint(label)",
    expectedOutput: "quick session planned",
    checkYourAnswer: "This is the branch the main example does not take. If it still prints focus, reread the comparison as a true-or-false question."
  },
  {
    starterCode: "completed = False\nmessage = \"\"\n# If completed is true, message is done. Otherwise message is keep going.\nprint(message)",
    expectedOutput: "keep going until complete",
    checkYourAnswer: "Do not compare completed to the text \"False\". A boolean can be used directly in an if statement."
  },
  {
    starterCode: "errors = 0\nstatus = \"\"\n# If there are no errors, status is clean. Otherwise status is needs review.\nprint(status)",
    expectedOutput: "clean: no errors found",
    checkYourAnswer: "This rep practices equality. Ask whether errors == 0 is true for the starter value before you choose the branch."
  }
];

const pythonLoopPracticeReps = [
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}, {\"topic\": \"sql\", \"minutes\": 20}]\ncount = 0\n# Count each session with a loop.\nprint(count)",
    expectedOutput: "3 sessions counted\nCount one session during each loop pass.",
    checkYourAnswer: "The count should change once per record. If it stays zero, the loop body never updated the running count."
  },
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}, {\"topic\": \"sql\", \"minutes\": 20}]\ntopics = []\n# Append each topic to topics.\nprint(topics)",
    expectedOutput: "['python', 'git', 'sql']",
    checkYourAnswer: "This rep asks you to collect one field from every record. If only one topic appears, the append likely happened outside the loop."
  },
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}, {\"topic\": \"python\", \"minutes\": 25}]\npython_minutes = 0\n# Add minutes only when topic is python.\nprint(python_minutes)",
    expectedOutput: "55 python minutes\nOnly python records are included in this total.",
    checkYourAnswer: "This combines a loop with a decision. The total should skip git and include both python records."
  }
];

const pythonFoundationCapstonePracticeReps = [
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}]\ntotal_minutes = 0\n# Add each session's minutes with a loop.\nprint(total_minutes)",
    expectedOutput: "45 total minutes counted",
    checkYourAnswer: "This rep isolates the total before the full capstone. If the answer is 0, the loop did not update total_minutes. If it is only 15 or 30, only one record was counted."
  },
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}, {\"topic\": \"sql\", \"minutes\": 45}]\nfocus_count = 0\n# Count sessions where minutes is 30 or more.\nprint(focus_count)",
    expectedOutput: "2 focus sessions counted",
    checkYourAnswer: "This rep checks the decision inside the loop. A 30-minute session counts because the condition is greater than or equal to 30."
  },
  {
    starterCode: "session_count = 3\ntotal_minutes = 70\nfocus_count = 1\nsummary = \"\"\n# Build the exact readable summary from the calculated values.\nprint(summary)",
    expectedOutput: "3 sessions, 70 minutes, 1 focus session",
    checkYourAnswer: "This rep separates presentation from calculation. The summary should use the calculated variables instead of typing unrelated numbers."
  }
];

const pythonStringCleanupPracticeReps = [
  {
    starterCode: "raw_topic = \"  PYTHON  \"\nclean_topic = \"\"\nprint(clean_topic)",
    expectedOutput: "python cleaned topic",
    checkYourAnswer: "Use strip before lower so edge spaces disappear and capitalization becomes consistent. The cleaned value should not keep the original spacing."
  },
  {
    starterCode: "clean_topic = \"python basics\"\nslug = \"\"\nprint(slug)",
    expectedOutput: "python-basics slug output",
    checkYourAnswer: "Create the slug after cleaning the topic. If spaces remain in slug, replace spaces with hyphens on the cleaned value."
  },
  {
    starterCode: "raw_topics = [\" Python \", \"python\", \"PYTHON\"]\ncleaned_topics = []\n# Add the cleaned version of each topic.\nprint(cleaned_topics)",
    expectedOutput: "['python', 'python', 'python']",
    checkYourAnswer: "This rep shows why cleanup matters. Three visually different inputs should become the same dependable topic before grouping."
  }
];

export const level2Lessons: Lesson[] = [
  proofLesson({
    id: "lesson-python-collections",
      curriculum: {
        level: 2,
        sequence: 1,
        version: "1.0.0",
        teaches: ["py.record.list_of_dicts", "py.list.literal", "py.dict.literal"],
        requires: ["py.variable.assignment", "py.string", "py.integer", "py.boolean"],
        usesButDoesNotTeach: ["py.assertion"]
      },
    codeShape: [
      "# Square brackets make a list.",
      "records = [",
      "    # Curly braces make one dictionary record.",
      "    {\"field\": \"text value\", \"number_field\": 30},",
      "    {\"field\": \"another text value\", \"number_field\": 15},",
      "]",
      "",
      "# To read one value later:",
      "second_topic = sessions[1][\"topic\"]",
      "print(second_topic)"
    ].join("\n"),
    moduleId: "module-python-core",
    slug: "python-collections",
    title: "Lists and Dictionaries Hold Real Records",
    summary: "Use a list of dictionaries so Python can hold more than one study session.",
    bodyMarkdown: "A list keeps items in order between square brackets. A dictionary names the parts of one item between curly braces. Together, they let a beginner script hold real records instead of one loose pile of variables.",
    estimatedMinutes: 8,
    difficulty: "foundation",
    skillIds: ["skill-python-basics", "skill-testing-debugging"],
    quizId: "quiz-python-collections",
    desktopTask: "Represent two study sessions as a list of dictionaries and print the second topic.",
    evidencePrompt: "Record the data structure, output, and one field name that every record should share.",
    language: "Python",
    tools: ["Python 3", "terminal", "lists and dictionaries"],
    synopsis: "You are learning how Python holds repeated records. A record is one study session, and repeated records are what let the tracker move beyond one hardcoded example.",
    prerequisites: ["Know that a variable can store a value.", "Know that strings use quotes and numbers usually do not."],
    testingFocus: "You will test that the sessions value is a list, that it contains two dictionaries, and that both records use the same beginner-friendly keys: topic and minutes.",
    objective: "Represent two related study sessions with a list of dictionaries.",
    whyItMatters: "Real scripts rarely work with one value at a time. They need a shape that can hold repeated records consistently.",
    coreConcept: "A record is one complete item of information. In Python, a dictionary uses keys and values: the key names the field, and the value is the data in that field. A list stores several records in order so the same code can work with all of them.",
    workedExample: "sessions = [{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}] keeps two records in one variable. sessions[1] reads the second record because list positions start at zero.",
    guidedExercise: "Add a second study-session dictionary to a sessions list, then print the second session's topic.",
    missionConnection: "This prepares the CLI Study Tracker to hold a week of sessions instead of one hardcoded line.",
    reflectionPrompt: "Which keys should every session share, and what would break if one record used name instead of topic?",
    practiceStarter: "sessions = [\n    {\"topic\": \"python\", \"minutes\": 30}\n]\n\n# Add a git session with 15 minutes.\nprint(sessions)",
    practiceExpected: "[{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}]",
    practiceCheck: "The output should show square brackets for the list and curly braces for each dictionary. If the second record is missing, check whether it was added inside the list brackets.",
    practiceReps: pythonCollectionPracticeReps,
    miniTitle: "Build a two-session record list",
    miniGoal: "Create a Python list that stores two study-session dictionaries with consistent field names.",
    miniSteps: ["Keep the first python session", "Add a second git session with 15 minutes", "Print the second topic from the list"],
    miniDeliverables: ["List with two dictionaries", "Output showing git as the second topic", "One sentence naming the shared keys"],
    verifierCommand: "python sessions_list.py",
    expectedEvidence: "Terminal output showing both records and the second topic, plus a note that topic and minutes are shared keys.",
    projectConnection: "This becomes the in-memory data shape that later functions, files, and tests will reuse.",
    requiredCodeIncludes: ["sessions", "topic", "minutes", "git"],
    requiredOutputIncludes: ["python", "git", "records"],
    runnerLanguage: "python",
    runnerStarterCode: "sessions = [\n    {\"topic\": \"python\", \"minutes\": 30}\n]\n\n# Add a git session with 15 minutes, then print a result line.\nprint(sessions)",
    runnerTestCode: "assert isinstance(sessions, list), 'sessions must be a list'\nassert len(sessions) == 2, 'The sessions list must contain exactly two records.'\nassert sessions[0] == {'topic': 'python', 'minutes': 30}, 'First session record should match'\nassert sessions[1] == {'topic': 'git', 'minutes': 15}, 'Second session record should match'\nprint('python git records passed')",
    hiddenTests: [
      {
        id: "sessions-share-required-keys",
        name: "Every session has topic and minutes",
        code: "assert all(isinstance(session, dict) for session in sessions), 'Every session must be a dictionary'\nassert all('topic' in session and 'minutes' in session for session in sessions), 'Every session dictionary must contain topic and minutes keys'\nassert all(isinstance(session['minutes'], int) for session in sessions), 'Every session minutes must be an integer'"
      }
    ]
  }),
  proofLesson({
    id: "lesson-python-decisions",
      curriculum: {
        level: 2,
        sequence: 2,
        version: "1.0.0",
        teaches: ["py.if_else", "py.comparison", "py.indentation.block"],
        requires: ["py.variable.assignment"],
        usesButDoesNotTeach: ["py.assertion"]
      },
    codeShape: [
      "# The colon starts a block. The next line is indented.",
      "if true_or_false_question:",
      "    value = \"first choice\"",
      "else:",
      "    value = \"second choice\"",
      "",
      "# In this lesson, the question is minutes >= 30:",
      "if minutes >= 30:",
      "    label = \"focus\"",
      "else:",
      "    label = \"quick\""
    ].join("\n"),
    moduleId: "module-python-core",
    slug: "python-decisions",
    title: "Decisions Make Scripts Useful",
    summary: "Use if and else so Python can label a session based on its minutes.",
    bodyMarkdown: "An if statement lets a program choose between paths. The line ending with : asks a true-or-false question, and the indented lines below it are the code Python runs for that answer.",
    estimatedMinutes: 8,
    difficulty: "foundation",
    skillIds: ["skill-python-basics", "skill-testing-debugging"],
    quizId: "quiz-python-decisions",
    desktopTask: "Write an if/else that labels a 30-minute session as focus and a shorter one as quick.",
    evidencePrompt: "Record the condition you used, the output, and one example that should take the other branch.",
    language: "Python",
    tools: ["Python 3", "terminal", "if/else"],
    synopsis: "You are learning how Python chooses between two paths, which is the heart of validation and helpful user feedback.",
    prerequisites: ["Know how to store a number in a variable.", "Know how to run a Python file and inspect printed output."],
    testingFocus: "You will test that 30 minutes becomes the text label focus, and you will explain which shorter value would make the else branch choose quick.",
    objective: "Write an if/else decision that labels a study session from its minutes.",
    whyItMatters: "Useful tools make decisions: accept or reject input, mark work complete or incomplete, and choose the right message for the user.",
    coreConcept: "A condition is a true-or-false question written in code, such as minutes >= 30. The colon starts the block. Indentation matters: the indented lines under if run when the condition is true, and the indented lines under else run when it is false.",
    workedExample: "if minutes >= 30: label = 'focus' else: label = 'quick' turns a number into a meaningful category. Written on real lines, label = 'focus' must be indented under the if.",
    guidedExercise: "Use minutes to assign label, then print a sentence that includes the label.",
    missionConnection: "This prepares the CLI Study Tracker to explain sessions instead of only storing raw numbers.",
    reflectionPrompt: "What exact question does your condition ask, and what value would make the else branch run?",
    practiceStarter: "minutes = 30\nlabel = \"\"\n\n# If minutes is 30 or more, label should be focus. Otherwise it should be quick.\nprint(label)",
    practiceExpected: "focus session planned",
    practiceCheck: "If the output is blank, your if/else did not assign label. If it says quick for 30 minutes, read minutes >= 30 as a question: is 30 greater than or equal to 30?",
    practiceReps: pythonDecisionPracticeReps,
    miniTitle: "Label a study session",
    miniGoal: "Create a Python decision that labels a study session as focus when it is 30 minutes or longer.",
    miniSteps: ["Create a minutes variable set to 30", "Use if/else to assign focus or quick", "Print a result line that includes the label"],
    miniDeliverables: ["Python if/else code", "Output showing focus session planned", "One note describing the shorter-session branch"],
    verifierCommand: "python session_label.py",
    expectedEvidence: "Terminal output showing focus session planned plus a note explaining which minutes value would produce quick.",
    projectConnection: "This becomes the first rule the tracker can use to explain study quality, not just duration.",
    requiredCodeIncludes: ["if", "else", "minutes", "label"],
    requiredOutputIncludes: ["focus", "session", "planned"],
    runnerLanguage: "python",
    runnerStarterCode: "minutes = 30\nlabel = \"\"\n\n# If minutes is 30 or more, label should be focus. Otherwise it should be quick.\nprint(label)",
    runnerTestCode: "assert minutes == 30, 'minutes should be 30'\nassert label == 'focus', 'label should be focus'\nprint('focus session planned passed')",
    hiddenTests: [
      {
        id: "label-is-a-known-category",
        name: "Label stays in the expected categories",
        code: "assert label in {'focus', 'quick'}\nassert isinstance(label, str)"
      }
    ]
  }),
  proofLesson({
    id: "lesson-python-loops",
      curriculum: {
        level: 2,
        sequence: 3,
        version: "1.0.0",
        teaches: ["py.for_loop", "py.accumulator", "py.loop_body"],
        requires: ["py.record.list_of_dicts"],
        usesButDoesNotTeach: ["py.assertion"]
      },
    codeShape: [
      "# Start the total before the loop so it can grow.",
      "total = 0",
      "for one_item in list_of_items:",
      "    total = total + one_item[\"number_field\"]",
      "",
      "# In this lesson, one_item is named session:",
      "total_minutes = 0",
      "for session in sessions:",
      "    total_minutes = total_minutes + session[\"minutes\"]"
    ].join("\n"),
    moduleId: "module-python-core",
    slug: "python-loops",
    title: "Loops Turn Records Into Totals",
    summary: "Use a for loop to add study minutes across multiple session records.",
    bodyMarkdown: "A loop repeats the same careful action for each item. In for session in sessions:, session is a temporary name for the current record, and Python changes it on each pass through the list.",
    estimatedMinutes: 9,
    difficulty: "foundation",
    skillIds: ["skill-python-basics", "skill-testing-debugging"],
    quizId: "quiz-python-loops",
    desktopTask: "Loop over two study-session dictionaries and calculate total minutes.",
    evidencePrompt: "Record the loop code, the total output, and one reason the loop is safer than adding values by hand.",
    language: "Python",
    tools: ["Python 3", "terminal", "for loops"],
    synopsis: "You are learning how Python repeats a small action across records, which is the bridge from beginner syntax to useful automation.",
    prerequisites: ["Know that sessions can be a list of dictionaries.", "Know that minutes should be stored as numbers if you want to add them."],
    testingFocus: "You will test that the loop produces the exact total for known records and that the total starts outside the loop.",
    objective: "Use a for loop to total minutes from a list of study-session dictionaries.",
    whyItMatters: "Most real scripts process many records. A loop lets the same rule run for each record without duplicating code.",
    coreConcept: "A for loop gives you one item at a time from a list. A running total is a number you start before the loop, then update inside the indented loop body. If you restart the total inside the loop, you erase the work from earlier passes.",
    workedExample: "for session in sessions: total_minutes = total_minutes + session['minutes'] adds each record's minutes to the same total.",
    guidedExercise: "Start total_minutes at 0, loop through sessions, and add each session's minutes.",
    missionConnection: "This prepares the grouping function in the next lesson, where loops become reusable logic.",
    reflectionPrompt: "What value changes on each loop pass, and what would the total be if you added a third 20-minute session?",
    practiceStarter: "sessions = [\n    {\"topic\": \"python\", \"minutes\": 30},\n    {\"topic\": \"git\", \"minutes\": 15},\n]\ntotal_minutes = 0\n\n# Use a for loop to add each session's minutes.\nprint(total_minutes)",
    practiceExpected: "total minutes: 45\n\nVerifier then prints: passed",
    practiceCheck: "Your own output should show the total is 45. If it is 15 or 30, your loop is only counting one record. If it is 0, the addition never happened. The final passed line comes from the check.",
    practiceReps: pythonLoopPracticeReps,
    miniTitle: "Total study minutes",
    miniGoal: "Create the first automation slice by looping over study sessions and calculating total minutes.",
    miniSteps: ["Start with two session dictionaries", "Initialize total_minutes before the loop", "Use a for loop to add each minutes value"],
    miniDeliverables: ["Python loop code", "Output showing total minutes: 45", "One note explaining why total_minutes starts before the loop"],
    verifierCommand: "python total_minutes.py",
    expectedEvidence: "Terminal output showing total minutes: 45 plus a note describing what the loop does once per session.",
    projectConnection: "This is the stepping stone from raw records to the reusable group_minutes function.",
    requiredCodeIncludes: ["for", "sessions", "total_minutes", "minutes"],
    requiredOutputIncludes: ["total", "45"],
    runnerLanguage: "python",
    runnerStarterCode: "sessions = [\n    {\"topic\": \"python\", \"minutes\": 30},\n    {\"topic\": \"git\", \"minutes\": 15},\n]\ntotal_minutes = 0\n\n# Use a for loop to add each session's minutes.\nprint(total_minutes)",
    runnerTestCode: "assert total_minutes == 45, 'total_minutes should be 45'\nprint('total 45 passed')",
    hiddenTests: [
      {
        id: "total-is-numeric",
        name: "Total is numeric and based on records",
        code: "assert isinstance(total_minutes, int), 'total_minutes must be an integer'\nassert sum(session['minutes'] for session in sessions) == total_minutes, 'total_minutes should sum up all session minutes'"
      }
    ]
  }),
  proofLesson({
    id: "lesson-python-foundation-capstone",
      curriculum: {
        level: 2,
        sequence: 4,
        version: "1.0.0",
        teaches: [],
        requires: ["py.for_loop", "py.if_else", "py.accumulator"],
        usesButDoesNotTeach: ["py.assertion"]
      },
    codeShape: [
      "# 1. Data: the records the program starts with",
      "sessions = [...]",
      "",
      "# 2. Logic: calculate from the records",
      "total_minutes = 0",
      "focus_count = 0",
      "for session in sessions:",
      "    total_minutes = total_minutes + session[\"minutes\"]",
      "    if session[\"minutes\"] >= 30:",
      "        focus_count = focus_count + 1",
      "",
      "# 3. Presentation: turn the calculation into readable output",
      "summary = f\"{len(sessions)} sessions, {total_minutes} minutes, {focus_count} focus session\""
    ].join("\n"),
    moduleId: "module-python-core",
    slug: "python-foundation-capstone",
    title: "Build the First Study Tracker Slice",
    summary: "Combine values, records, decisions, and loops into one small tracker result.",
    bodyMarkdown: "A capstone is where small ideas stop living alone. This script has three sections: data to start with, logic that calculates from the data, and output that explains the result.",
    estimatedMinutes: 12,
    difficulty: "foundation",
    skillIds: ["skill-python-basics", "skill-testing-debugging"],
    quizId: "quiz-python-foundation-capstone",
    desktopTask: "Create a single Python script that stores sessions, totals minutes, counts focus sessions, and prints one summary line.",
    evidencePrompt: "Record the script path, passing output, and one change you would make if the sessions came from a file.",
    language: "Python",
    tools: ["Python 3", "terminal", "lists, if/else, for loops"],
    synopsis: "You are learning to combine beginner pieces into one small program. The goal is to see values, records, decisions, and loops working together instead of feeling like separate syntax facts.",
    prerequisites: ["Know how to store sessions as dictionaries in a list.", "Know how to use if/else inside a for loop."],
    testingFocus: "You will test that the script calculates the session count, total minutes, and focus-session count from the records.",
    objective: "Combine beginner Python building blocks into one working study-tracker slice.",
    whyItMatters: "Real software rarely tests one syntax idea at a time. You need to connect data shape, decisions, loops, and output into a behavior someone can use.",
    coreConcept: "A small script becomes software when data moves through clear steps: records are stored first, rules such as focus-session checks are applied next, totals are calculated, and the final output explains the result. If a final number is wrong, fix the calculation before editing the sentence.",
    workedExample: "Three session dictionaries can produce the summary 3 sessions, 70 minutes, 1 focus session. The summary should be built from len(sessions), total_minutes, and focus_count.",
    guidedExercise: "Build the full flow from records to summary before moving into functions.",
    missionConnection: "This is the first checkpoint version of CLI Study Tracker before you extract reusable functions.",
    reflectionPrompt: "Which part of the script is data, which part is logic, and which part is presentation?",
    practiceStarter: "sessions = [\n    {\"topic\": \"python\", \"minutes\": 30},\n    {\"topic\": \"git\", \"minutes\": 15},\n    {\"topic\": \"python\", \"minutes\": 25},\n]\ntotal_minutes = 0\nfocus_count = 0\nsummary = \"\"\n\n# Loop over sessions, calculate totals, then build summary.\nprint(summary)",
    practiceExpected: "3 sessions, 70 minutes, 1 focus session",
    practiceCheck: "If the numbers are wrong, do not edit the final summary string first. Check whether the loop calculates total_minutes and focus_count from the records.",
    practiceReps: pythonFoundationCapstonePracticeReps,
    miniTitle: "Ship the first tracker slice",
    miniGoal: "Build a single-file tracker result that calculates a useful summary from repeated study-session records.",
    miniSteps: ["Store three study-session dictionaries", "Loop once to calculate total minutes and focus sessions", "Print the exact summary from calculated values"],
    miniDeliverables: ["Python script", "Output summary", "One note separating data, logic, and presentation"],
    verifierCommand: "python tracker_slice.py",
    expectedEvidence: "Terminal output with the calculated summary plus a short explanation of which lines store data and which lines calculate behavior.",
    projectConnection: "This is the first complete slice of the CLI Study Tracker mission.",
    requiredCodeIncludes: ["sessions", "for", "total_minutes", "focus_count", "summary"],
    requiredOutputIncludes: ["3 sessions", "70 minutes", "1 focus"],
    runnerLanguage: "python",
    runnerStarterCode: "sessions = [\n    {\"topic\": \"python\", \"minutes\": 30},\n    {\"topic\": \"git\", \"minutes\": 15},\n    {\"topic\": \"python\", \"minutes\": 25},\n]\ntotal_minutes = 0\nfocus_count = 0\nsummary = \"\"\n\n# Loop over sessions, calculate totals, then build summary.\nprint(summary)",
    runnerTestCode: "assert len(sessions) == 3, 'sessions list must have exactly three records'\nassert total_minutes == 70, 'total_minutes should be 70'\nassert focus_count == 1, 'focus_count should be 1'\nassert summary == '3 sessions, 70 minutes, 1 focus session', 'summary should match'\nprint('tracker slice 70 minutes passed')",
    hiddenTests: [
      {
        id: "tracker-summary-matches-data",
        name: "Summary matches the stored data",
        code: "assert sum(session['minutes'] for session in sessions) == total_minutes, 'total_minutes should sum up all session minutes'\nassert sum(1 for session in sessions if session['minutes'] >= 30) == focus_count, 'focus_count should count sessions with 30 or more minutes'"
      }
    ]
  }),
  proofLesson({
    id: "lesson-python-strings-cleanup",
      curriculum: {
        level: 2,
        sequence: 5,
        version: "1.0.0",
        teaches: ["py.string"],
        requires: ["py.variable.assignment"],
        usesButDoesNotTeach: ["py.assertion"],
        reinforces: ["py.string"]
      },
    codeShape: [
      "clean_text = raw_text.strip().lower()",
      "slug = clean_text.replace(\" \", \"-\")",
      "",
      "# In this lesson:",
      "clean_topic = raw_topic.strip().lower()",
      "slug = clean_topic.replace(\" \", \"-\")"
    ].join("\n"),
    moduleId: "module-python-core",
    slug: "python-strings-cleanup",
    title: "Clean Text Before You Trust It",
    summary: "Normalize messy text so session topics can be compared and stored safely.",
    bodyMarkdown: "Text from users and files is often messy. Python strings have built-in methods that return cleaned copies of text. Cleaning whitespace and case early prevents values like Python and python from becoming separate topics by accident.",
    estimatedMinutes: 9,
    difficulty: "foundation",
    skillIds: ["skill-python-basics", "skill-testing-debugging"],
    quizId: "quiz-python-strings-cleanup",
    desktopTask: "Write a Python cleanup function that normalizes a raw topic and creates a simple slug.",
    evidencePrompt: "Record messy input, cleaned output, and the exact string method that fixed the issue.",
    language: "Python",
    tools: ["Python 3", "terminal", "string methods"],
    synopsis: "You are learning to clean messy text before using it in program logic, which is a key move in real scripts and data tools.",
    prerequisites: ["Know that strings are text values.", "Know that dictionary topics need consistent names if you want reliable totals."],
    testingFocus: "You will test that messy spacing and capitalization become one predictable cleaned topic and one slug, which is the hyphenated storage-friendly name.",
    objective: "Clean raw text into a dependable topic name and slug.",
    whyItMatters: "Any tracker that reads human input needs text cleanup before totals, files, or reports can be trusted.",
    coreConcept: "A string method is a built-in action for text. strip removes spaces at the edges, lower makes letters lowercase, and replace swaps one piece of text for another. These methods return a new string, so you usually save the result in a variable.",
    workedExample: "'  Python Basics  '.strip().lower() becomes 'python basics'. Then clean_topic.replace(' ', '-') creates python-basics, a URL- or filename-friendly slug.",
    guidedExercise: "Normalize one raw topic string, then build a slug from it.",
    missionConnection: "This prevents the CLI Study Tracker from treating Python, python, and python basics inconsistently.",
    reflectionPrompt: "Which cleanup step changes meaning, and which cleanup step only makes the same meaning consistent?",
    practiceStarter: "raw_topic = \"  Python Basics  \"\nclean_topic = \"\"\nslug = \"\"\n\n# Clean raw_topic and create a slug.\nprint(clean_topic)\nprint(slug)",
    practiceExpected: "python basics\npython-basics",
    practiceCheck: "If clean_topic still has spaces at the edges, use strip first. If it still has capital letters, use lower. If slug has spaces, replace them after the topic is clean.",
    practiceReps: pythonStringCleanupPracticeReps,
    miniTitle: "Normalize a session topic",
    miniGoal: "Create a text cleanup slice that turns messy user input into a consistent topic and slug.",
    miniSteps: ["Strip extra whitespace", "Lowercase the topic for consistent comparison", "Create a slug by replacing internal spaces with hyphens"],
    miniDeliverables: ["Python cleanup code", "Cleaned topic output", "Slug output"],
    verifierCommand: "python clean_topic.py",
    expectedEvidence: "Terminal output showing the cleaned topic and slug plus one note explaining why cleanup must happen before grouping topics.",
    projectConnection: "This prevents the CLI Study Tracker from treating Python, python, and python basics inconsistently.",
    requiredCodeIncludes: ["strip", "lower", "replace", "slug"],
    requiredOutputIncludes: ["python basics", "python-basics"],
    runnerLanguage: "python",
    runnerStarterCode: "raw_topic = \"  Python Basics  \"\nclean_topic = \"\"\nslug = \"\"\n\n# Clean raw_topic and create a slug.\nprint(clean_topic)\nprint(slug)",
    runnerTestCode: "assert clean_topic == 'python basics', 'clean_topic should be python basics'\nassert slug == 'python-basics', 'slug should be python-basics'\nprint('python basics slug passed')",
    hiddenTests: [
      {
        id: "cleanup-removes-edge-space",
        name: "Cleanup removes edge spaces and normalizes case",
        code: "assert clean_topic == clean_topic.strip(), 'clean_topic should be stripped'\nassert clean_topic.islower(), 'clean_topic should be lowercase'\nassert ' ' not in slug, 'slug should not contain spaces'"
      }
    ]
  })
];

// Add depth configurations to level2Lessons
level2Lessons[0].depth = {
  primaryConceptId: "py.record.list_of_dicts",
  secondaryConceptIds: ["py.list.literal", "py.dict.literal"],
  maxNewConcepts: 3,
  conceptCapsules: [
    {
      conceptId: "py.list.literal",
      definition: "An ordered collection of items wrapped in square brackets and separated by commas.",
      mentalModel: "Think of a list as a numbered line of train cars, where you can add, remove, or access cars by their index number.",
      syntaxShape: "[item1, item2]",
      tinyExample: '["python", "git"]',
      commonMistake: "Forgetting to separate list items with commas.",
      repairHint: "Add a comma between adjacent list elements.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.dict.literal",
      definition: "A collection of key-value pairs wrapped in curly braces, where each unique key maps to a value.",
      mentalModel: "Think of a dictionary like a labeling drawer where each label name points directly to an object inside.",
      syntaxShape: "{key1: value1, key2: value2}",
      tinyExample: '{"topic": "python", "minutes": 30}',
      commonMistake: "Using equals (=) instead of colons (:) to link keys to values inside literal braces.",
      repairHint: "Replace equals signs with colons inside dictionary braces.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.record.list_of_dicts",
      definition: "A structural pattern where database-like records are represented as dictionary objects inside a parent list.",
      mentalModel: "Think of a list of dictionaries as a spreadsheet database, where the list is the spreadsheet and each dictionary is a row.",
      syntaxShape: "[{key: val}, {key: val}]",
      tinyExample: '[{"topic": "python", "minutes": 30}, {"topic": "git", "minutes": 15}]',
      commonMistake: "Using inconsistent key names across different dictionaries in the same list.",
      repairHint: "Verify all records use the exact same string keys for identical fields.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-coll-1",
      label: "Define list of dictionaries",
      codeFragment: 'sessions = [\n    {"topic": "python", "minutes": 30}\n]',
      conceptIds: ["py.record.list_of_dicts"],
      explanation: "Creates a list named sessions containing a single study session dictionary.",
      learnerShouldBeAbleToSay: "sessions is a list storing dictionary records representing sessions"
    }
  ],
  guidedEdits: [
    {
      id: "g-coll-1",
      instruction: "Add a second dictionary with topic 'git' and minutes 15 inside the sessions list.",
      conceptIds: ["py.record.list_of_dicts"],
      targetCodeFragment: 'sessions = [\n    {"topic": "python", "minutes": 30}\n]',
      expectedObservation: "The printed output shows both python and git dictionaries in the list.",
      wrongTurnHint: "Separate the two dictionary curly brace blocks with a comma."
    }
  ],
  errorClinic: [
    {
      id: "e-coll-1",
      conceptIds: ["py.dict.key_lookup"],
      brokenExample: 'second_topic = sessions[1]["name"]',
      symptom: "KeyError: 'name'",
      likelyCause: "Looking up a key name that doesn't exist in the session dictionary.",
      fixStrategy: "Change the key lookup from 'name' to the correct field key: 'topic'."
    },
    {
      id: "e-coll-2",
      conceptIds: ["py.list.index"],
      brokenExample: "second = sessions[2]",
      symptom: "IndexError: list index out of range",
      likelyCause: "Using an index position higher than length - 1 of the list.",
      fixStrategy: "Access the second item using zero-based index 1: sessions[1]."
    }
  ],
  codeLabBridge: {
    story: "Define a sessions list containing two study records (python 30 and git 15).",
    usesConcepts: ["py.record.list_of_dicts"],
    learnerOwns: ["sessions"],
    checkerOwns: ["sessions-have-two-records"],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "Why do we prefer using a list of dictionaries over separate variable names for multiple records?",
  exitTicket: [
    "I understand list indexes start at 0.",
    "I can represent tables of data as a list of dictionaries."
  ]
};

level2Lessons[1].depth = {
  primaryConceptId: "py.if_else",
  secondaryConceptIds: ["py.comparison", "py.indentation.block"],
  maxNewConcepts: 3,
  conceptCapsules: [
    {
      conceptId: "py.comparison",
      definition: "Operators (like >=, ==, <) used to compare two values, returning True or False.",
      mentalModel: "Think of a comparison as a balance scale that checks if one side matches or outweighs the other.",
      syntaxShape: "value1 >= value2",
      tinyExample: "minutes >= 30",
      commonMistake: "Using a single = (assignment) instead of == (equality comparison) inside conditions.",
      repairHint: "Use double equals == for comparisons.",
      usedIn: ["learn", "practice"]
    },
    {
      conceptId: "py.if_else",
      definition: "A control flow structure that chooses which code path to execute based on a boolean condition.",
      mentalModel: "Think of if/else as a fork in the road with a signpost directing traffic left or right.",
      syntaxShape: "if condition:\n    # path A\nelse:\n    # path B",
      tinyExample: "if minutes >= 30:\n    label = 'focus'\nelse:\n    label = 'quick'",
      commonMistake: "Forgetting to end the if or else lines with a colon (:).",
      repairHint: "Add a colon character at the end of conditional branch headers.",
      usedIn: ["learn", "practice", "code_lab"]
    },
    {
      conceptId: "py.indentation.block",
      definition: "Spacing lines (usually four spaces) to define code blocks belonging to a control flow branch.",
      mentalModel: "Think of indentation as placing items inside boxes: items inside a box move together.",
      syntaxShape: "    indented_line",
      tinyExample: "    label = 'focus'",
      commonMistake: "Mixing tabs and spaces, or forgetting to indent lines inside a branch.",
      repairHint: "Use exactly four spaces for each level of indentation.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-dec-1",
      label: "Evaluate condition",
      codeFragment: "if minutes >= 30:",
      conceptIds: ["py.comparison", "py.if_else"],
      explanation: "Checks if minutes is greater than or equal to 30, starting the code block with a colon.",
      learnerShouldBeAbleToSay: "checks if the minutes variable is 30 or more"
    },
    {
      id: "w-dec-2",
      label: "Run true branch",
      codeFragment: '    label = "focus"',
      conceptIds: ["py.indentation.block"],
      explanation: "Assigns 'focus' to label. Indented four spaces, meaning it only runs when condition is True.",
      learnerShouldBeAbleToSay: "if true, label is set to focus"
    },
    {
      id: "w-dec-3",
      label: "Run false branch",
      codeFragment: 'else:\n    label = "quick"',
      conceptIds: ["py.if_else"],
      explanation: "Declares fallback block. If condition is False, label is assigned 'quick'.",
      learnerShouldBeAbleToSay: "otherwise, label is set to quick"
    }
  ],
  guidedEdits: [
    {
      id: "g-dec-1",
      instruction: "Change minutes to 15 in the script.",
      conceptIds: ["py.if_else"],
      targetCodeFragment: "minutes = 30",
      expectedObservation: "The print statement prints quick session planned.",
      wrongTurnHint: "Assign the number 15 directly to minutes."
    }
  ],
  errorClinic: [
    {
      id: "e-dec-1",
      conceptIds: ["py.indentation.block"],
      brokenExample: 'if minutes >= 30:\nlabel = "focus"',
      symptom: "IndentationError: expected an indented block after 'if' statement on line 3",
      likelyCause: "Writing statement lines directly underneath if/else headers without indentation.",
      fixStrategy: "Indent the label assignment lines by adding four spaces."
    },
    {
      id: "e-dec-2",
      conceptIds: ["py.comparison"],
      brokenExample: "if minutes = 30:",
      symptom: "SyntaxError: invalid syntax",
      likelyCause: "Using single equals assignment operator where comparison is expected.",
      fixStrategy: "Change the single equals (=) to a double equals (==)."
    }
  ],
  codeLabBridge: {
    story: "Use if/else to check minutes and categorize the session quality.",
    usesConcepts: ["py.if_else"],
    learnerOwns: ["label"],
    checkerOwns: ["minutes-produce-focus-label"],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "Why does Python enforce indentation blocks instead of using curly braces for bodies?",
  exitTicket: [
    "I know how comparisons return booleans.",
    "I can write indented branches under if and else."
  ]
};

level2Lessons[2].depth = {
  primaryConceptId: "py.for_loop",
  secondaryConceptIds: ["py.accumulator", "py.loop_body"],
  maxNewConcepts: 3,
  conceptCapsules: [
    {
      conceptId: "py.for_loop",
      definition: "An iteration statement that runs a block of code once for each item in a list sequence.",
      mentalModel: "Think of a loop like a mail carrier checking every mailbox along a street, one by one.",
      syntaxShape: "for item in list:\n    # loop block",
      tinyExample: "for session in sessions:\n    ...",
      commonMistake: "Forgetting the colon at the end of the loop header line.",
      repairHint: "Verify you end the for statement line with a colon (:).",
      usedIn: ["learn", "practice", "code_lab"]
    },
    {
      conceptId: "py.accumulator",
      definition: "A variable initialized before a loop and updated inside to maintain a running total.",
      mentalModel: "Think of an accumulator as a piggy bank where you add coins one at a time to build savings.",
      syntaxShape: "total = total + value",
      tinyExample: "total_minutes = total_minutes + session['minutes']",
      commonMistake: "Initializing the total variable inside the loop body, causing it to reset constantly.",
      repairHint: "Declare and set the running total variable to 0 before the loop line starts.",
      usedIn: ["learn", "practice", "code_lab"]
    },
    {
      conceptId: "py.loop_body",
      definition: "The indented block of statements executed repeatedly for each item in the sequence.",
      mentalModel: "Think of the loop body as the repetitive work routine you perform for every document in a stack.",
      syntaxShape: "    # body statements",
      tinyExample: "    total_minutes = total_minutes + session['minutes']",
      commonMistake: "Adding lines to the loop body that should only run once after iteration completes.",
      repairHint: "Unindent lines that should execute after the loop is done.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-loop-1",
      label: "Initialize running total",
      codeFragment: "total_minutes = 0",
      conceptIds: ["py.accumulator"],
      explanation: "Creates the total_minutes tracker and sets it to 0 before list iteration begins.",
      learnerShouldBeAbleToSay: "total_minutes starts at 0 before we inspect any records"
    },
    {
      id: "w-loop-2",
      label: "Loop over records list",
      codeFragment: "for session in sessions:",
      conceptIds: ["py.for_loop"],
      explanation: "Iterates through sessions, assigning the current dictionary record to the variable session.",
      learnerShouldBeAbleToSay: "the loop looks at each session record in sessions in turn"
    },
    {
      id: "w-loop-3",
      label: "Add to running total",
      codeFragment: "    total_minutes = total_minutes + session[\"minutes\"]",
      conceptIds: ["py.accumulator", "py.loop_body"],
      explanation: "Reads the minutes field of the current session and adds it to total_minutes.",
      learnerShouldBeAbleToSay: "each pass adds the current session minutes to the total"
    }
  ],
  guidedEdits: [
    {
      id: "g-loop-1",
      instruction: "Add a third session dictionary with minutes 20 to the list.",
      conceptIds: ["py.for_loop"],
      targetCodeFragment: 'sessions = [\n    {"topic": "python", "minutes": 30},\n    {"topic": "git", "minutes": 15},\n]',
      expectedObservation: "The terminal prints total minutes: 65.",
      wrongTurnHint: "Add the third record dict inside list brackets separated by a comma."
    }
  ],
  errorClinic: [
    {
      id: "e-loop-1",
      conceptIds: ["py.accumulator"],
      brokenExample: 'for session in sessions:\n    total_minutes = 0\n    total_minutes = total_minutes + session["minutes"]',
      symptom: "The printed total is only the last item's minutes instead of the sum.",
      likelyCause: "Resetting the accumulator variable to 0 inside the loop body block.",
      fixStrategy: "Move the total_minutes = 0 line outside and above the for loop block."
    }
  ],
  codeLabBridge: {
    story: "Calculate the total minutes by iterating over the sessions list.",
    usesConcepts: ["py.for_loop", "py.accumulator"],
    learnerOwns: ["total_minutes"],
    checkerOwns: ["loop-totals-minutes"],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "Why does declaring accumulator variables inside loops cause errors?",
  exitTicket: [
    "I can use for loops to iterate across list records.",
    "I understand the accumulator pattern for totals."
  ]
};

level2Lessons[3].depth = {
  primaryConceptId: "py.accumulator",
  secondaryConceptIds: ["py.for_loop", "py.if_else"],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.accumulator",
      definition: "Managing multiple running totals or counts inside a single iteration loop.",
      mentalModel: "Think of sorting coins: you maintain separate cups for pennies and nickels, adding to the right cup as you sort.",
      syntaxShape: "total = total + val\ncount = count + 1",
      tinyExample: "total_minutes = total_minutes + session['minutes']\nfocus_count = focus_count + 1",
      commonMistake: "Forgetting to initialize all counts/totals before starting loop iteration.",
      repairHint: "Make sure all accumulator variables are initialized to 0 above the loop line.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-cap-1",
      label: "Evaluate and count focus",
      codeFragment: '    if session["minutes"] >= 30:\n        focus_count = focus_count + 1',
      conceptIds: ["py.accumulator", "py.if_else"],
      explanation: "Applies condition to session minutes and increments focus_count when True.",
      learnerShouldBeAbleToSay: "if a session is 30 or more minutes, we add 1 to focus_count"
    }
  ],
  guidedEdits: [
    {
      id: "g-cap-1",
      instruction: "Change the git session minutes to 35 in the list.",
      conceptIds: ["py.for_loop"],
      targetCodeFragment: '{"topic": "git", "minutes": 15}',
      expectedObservation: "The output updates to 2 focus sessions and 90 minutes.",
      wrongTurnHint: "Change 15 to 35 inside the git dictionary record directly."
    }
  ],
  errorClinic: [
    {
      id: "e-cap-1",
      conceptIds: ["py.accumulator"],
      brokenExample: 'for session in sessions:\n    total_minutes = total_minutes + session["minutes"]\nfocus_count = focus_count + 1',
      symptom: "focus_count is incorrect (often stays at 1 regardless of input records).",
      likelyCause: "Running the conditional increment line outside the loop block.",
      fixStrategy: "Indent the condition and increment block lines so they belong to the loop body."
    }
  ],
  codeLabBridge: {
    story: "Calculate totals and focus counts, then format the final tracker summary.",
    usesConcepts: ["py.for_loop", "py.accumulator", "py.if_else"],
    learnerOwns: ["total_minutes", "focus_count", "summary"],
    checkerOwns: ["tracker-slice-summary"],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "Describe the three logical parts of our capstone script: data, logic, and presentation.",
  exitTicket: [
    "I can combine decisions and loops into structured scripts.",
    "I know how to format results for human inspectors."
  ]
};

level2Lessons[4].depth = {
  primaryConceptId: "py.string",
  secondaryConceptIds: ["py.variable.assignment"],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.string",
      definition: "Using built-in string methods (like strip(), lower(), replace()) to clean and normalize text.",
      mentalModel: "Think of string cleaning like washing vegetables before cooking: you remove dirt (spaces) and peel (normalize case) before slicing.",
      syntaxShape: "string.method()",
      tinyExample: 'clean_topic = raw_topic.strip().lower()',
      commonMistake: "Assuming string methods edit in-place rather than returning a new string copy.",
      repairHint: "Store the returned cleaned string back in a variable: clean = original.strip().",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-clean-1",
      label: "Normalize text",
      codeFragment: "clean_topic = raw_topic.strip().lower()",
      conceptIds: ["py.string"],
      explanation: "Strips edge spaces and converts characters to lowercase in one chained instruction.",
      learnerShouldBeAbleToSay: "clean_topic holds the trimmed, lowercase version of raw_topic"
    },
    {
      id: "w-clean-2",
      label: "Generate slug",
      codeFragment: 'slug = clean_topic.replace(" ", "-")',
      conceptIds: ["py.string"],
      explanation: "Replaces internal space characters with hyphens to make a storage-friendly slug.",
      learnerShouldBeAbleToSay: "slug holds clean_topic with spaces changed to dashes"
    }
  ],
  guidedEdits: [
    {
      id: "g-clean-1",
      instruction: "Change raw_topic to '  SQL Basics  ' in the script.",
      conceptIds: ["py.string"],
      targetCodeFragment: 'raw_topic = "  Python Basics  "',
      expectedObservation: "The terminal prints sql basics and sql-basics.",
      wrongTurnHint: "Assign the new string with spaces inside the quotes."
    }
  ],
  errorClinic: [
    {
      id: "e-clean-1",
      conceptIds: ["py.string"],
      brokenExample: 'clean_topic = raw_topic.strip()\nclean_topic.lower()',
      symptom: "capital letters remain in clean_topic variable.",
      likelyCause: "Calling lower() but not storing the returned cleaned string copy.",
      fixStrategy: "Assign the result back to the variable: clean_topic = clean_topic.lower()."
    }
  ],
  codeLabBridge: {
    story: "Clean raw topics and create hyphenated database-friendly slugs.",
    usesConcepts: ["py.string"],
    learnerOwns: ["clean_topic", "slug"],
    checkerOwns: ["cleans-topic-and-slug"],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "Why does Python return copy results for string methods instead of editing the string directly?",
  exitTicket: [
    "I can trim whitespace and change casing on strings.",
    "I know how to build URL-friendly slugs using replace."
  ]
};

export const level2Quizzes: Quiz[] = [
  checkpointQuiz(
    "quiz-python-collections",
    "lesson-python-collections",
    "Collections Checkpoint",
    "lists and dictionaries",
    "Define lists of dictionaries to store repeated records with consistent field keys.",
    "Write loose variables to hold values rather than collections.",
    "Access dictionary fields using numerical index numbers directly.",
    "Lists hold collections in order. Dictionaries group fields as key-value pairs.",
    ["py.list.literal", "py.dict.literal", "py.record.list_of_dicts"]
  ),
  checkpointQuiz(
    "quiz-python-decisions",
    "lesson-python-decisions",
    "Decisions Checkpoint",
    "if/else conditional logic",
    "Direct execution flow along branches using comparisons and indented blocks.",
    "Format if/else statements without using colons or spaces.",
    "Compare string characters using single equals assignment operators.",
    "Conditional branches verify comparison queries, executing indented blocks.",
    ["py.comparison", "py.if_else", "py.indentation.block"]
  ),
  checkpointQuiz(
    "quiz-python-loops",
    "lesson-python-loops",
    "Loops Checkpoint",
    "for loop iteration",
    "Iterate over lists of records to aggregate totals using accumulator patterns.",
    "Reset totals inside loop blocks so calculations only return the last item.",
    "Iterate across dictionary keys using mathematical division loops.",
    "For loops iterate collections. Accumulators maintain totals outside loops.",
    ["py.for_loop", "py.accumulator", "py.loop_body"]
  ),
  checkpointQuiz(
    "quiz-python-foundation-capstone",
    "lesson-python-foundation-capstone",
    "Capstone Checkpoint",
    "structured capstone scripts",
    "Combine data structures, loops, comparisons, and accumulator counts into one summary.",
    "Separate all variables so the final printed summary is a hardcoded literal string.",
    "Write loops that never use conditional blocks or running counts.",
    "Capstone scripts structure data sources, calculate logic, and present summaries.",
    ["py.accumulator", "py.for_loop", "py.if_else"]
  ),
  checkpointQuiz(
    "quiz-python-strings-cleanup",
    "lesson-python-strings-cleanup",
    "String Cleanup Checkpoint",
    "string normalization methods",
    "Clean messy string whitespace and letter casing to enable dependable database lookups.",
    "Modify string characters in-place without saving method return values.",
    "Parse text values into integers before stripping extra space characters.",
    "String methods return copy results. strip() and lower() normalize text.",
    ["py.string", "py.variable.assignment"]
  )
];
