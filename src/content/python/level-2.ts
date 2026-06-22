import type { Lesson, LessonPracticeBlock, Quiz } from "@/domain/types";
import { proofLesson, checkpointQuiz, codeReadingQuiz } from "./shared";

const pythonListPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "topics = ['python', 'git', 'sql']\nsecond = ''\nprint(second)",
    expectedOutput: "git\nIndex 1 is the second item because lists start at 0.",
    checkYourAnswer: "List positions start at 0. Index 0 is 'python', index 1 is 'git'. Make sure you access index 1, not index 2.",
    tier: "replicate"
  },
  {
    starterCode: "mixed = [30, 15, 45]\nfirst = ''\nprint(first)",
    expectedOutput: "30 is at index 0 in the list.",
    checkYourAnswer: "The first item in the list is at position 0. Access mixed[0] to get 30.",
    tier: "replicate"
  },
  {
    starterCode: "items = [10, 20, 30]\n# Bug: the code tries to read an item beyond the list.\ntotal = items[3]\nprint(total)",
    expectedOutput: "List index fix: access valid positions 0, 1, or 2 only.",
    checkYourAnswer: "A list with 3 items has valid indices 0, 1, and 2. Index 3 is out of range. Fix by accessing an existing position.",
    tier: "diagnose"
  },
  {
    starterCode: "# Create a list called minutes_list that holds three numbers: 30, 15, and 45.\n# Then use the list to build a total.\nminutes_list = []\ntotal = 0\nprint(total)",
    expectedOutput: "90 total minutes created from list items",
    checkYourAnswer: "Create the list with three numbers, then add them up by index. Each number stays inside the list brackets separated by commas.",
    tier: "synthesize"
  }
];

const pythonDictPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "session = {'topic': 'python', 'minutes': 30}\n# Add a completed field set to False.\nprint(session)",
    expectedOutput: "{'topic': 'python', 'minutes': 30, 'completed': False}",
    checkYourAnswer: "A dictionary can grow one named field at a time. Check that completed is a boolean, because later decisions will branch on it.",
    tier: "replicate"
  },
  {
    starterCode: "session = {'topic': 'python'}\n# Add the minutes field with value 30.\nprint(session)",
    expectedOutput: "{'topic': 'python', 'minutes': 30}",
    checkYourAnswer: "Add minutes by assigning it like a variable. The new key-value pair appears in the dictionary output.",
    tier: "replicate"
  },
  {
    starterCode: "session = {'topic': 'python', 'minutes': 30}\n# Bug: the code tries to read a field that does not exist.\nname = session['name']\nprint(name)",
    expectedOutput: "Fix: use the correct key 'topic' instead of 'name'.",
    checkYourAnswer: "The key 'name' does not exist in the dictionary. Change it to 'topic' which is one of the actual keys.",
    tier: "diagnose"
  },
  {
    starterCode: "# Create a session dictionary with topic and minutes fields.\n# topic should be 'python', minutes should be 30.\n# Then print the topic value.\nsession = {}\nvalue = \"\"\nprint(value)",
    expectedOutput: "python accessed from dictionary key",
    checkYourAnswer: "Build the dictionary with curly braces, colons between keys and values, and commas between pairs. Then access topic by its key name.",
    tier: "synthesize"
  }
];

const pythonRecordListPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "sessions = []\n# Add python 30 and git 15 as dictionaries.\nprint(sessions)",
    expectedOutput: "[{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}]",
    checkYourAnswer: "You should have one list and two dictionaries. If you made separate variables, you avoided the record shape the next lessons need.",
    tier: "replicate"
  },
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}]\nsecond_topic = \"\"\nprint(second_topic)",
    expectedOutput: "second topic: git\nThe second record's topic is git.",
    checkYourAnswer: "Read the list position first, then the dictionary key. The second item is index 1 because Python lists start at zero.",
    tier: "diagnose"
  },
  {
    starterCode: "# Create a list called records with three study sessions.\n# Each session needs topic, minutes, and completed fields.\n# Use mixed data: at least two topics, varied minutes.\nprint(records)",
    expectedOutput: "[{'topic': 'python', 'minutes': 30, 'completed': False}, {'topic': 'git', 'minutes': 15, 'completed': True}, {'topic': 'sql', 'minutes': 45, 'completed': False}]",
    checkYourAnswer: "All three dictionaries must use the exact same key names in the same order. If the output is wrong, check that each record has topic, minutes, and completed — no extras, no missing fields.",
    tier: "synthesize"
  }
];

const pythonDecisionPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "minutes = 10\nlabel = \"\"\n# Use if/else so short sessions become quick.\nprint(label)",
    expectedOutput: "quick session planned",
    checkYourAnswer: "This is the branch the main example does not take. If it still prints focus, reread the comparison as a true-or-false question.",
    tier: "replicate"
  },
  {
    starterCode: "completed = False\nmessage = \"\"\n# If completed is true, message is done. Otherwise message is keep going.\nprint(message)",
    expectedOutput: "keep going until complete",
    checkYourAnswer: "Do not compare completed to the text \"False\". A boolean can be used directly in an if statement.",
    tier: "replicate"
  },
  {
    starterCode: "errors = 0\nstatus = \"\"\n# If there are no errors, status is clean. Otherwise status is needs review.\nprint(status)",
    expectedOutput: "clean: no errors found",
    checkYourAnswer: "This rep practices equality. Ask whether errors == 0 is true for the starter value before you choose the branch.",
    tier: "replicate"
  },
  {
    starterCode: "completed = True\n# Bug: the condition below compares a boolean to a string.\nif completed == \"True\":\n    message = \"done\"\nelse:\n    message = \"keep going\"\nprint(message)",
    expectedOutput: "done: session marked complete",
    checkYourAnswer: "The bug is comparing completed (a boolean) to the string \"True\". Remove the == comparison and use the boolean directly: if completed:",
    tier: "diagnose"
  },
  {
    starterCode: "total_minutes = 45\n# From scratch: if total_minutes is more than 0, set report to \"study time logged\".\n# Otherwise, set report to \"no study time yet\". Print the report.\nreport = \"\"\nprint(report)",
    expectedOutput: "study time logged report",
    checkYourAnswer: "You need the full if/else structure. The condition checks whether total_minutes > 0. If the output is blank, your if/else never assigned report to either branch.",
    tier: "synthesize"
  }
];

const pythonLoopPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}, {\"topic\": \"sql\", \"minutes\": 20}]\ncount = 0\n# Count each session with a loop.\nprint(count)",
    expectedOutput: "3 sessions counted\nCount one session during each loop pass.",
    checkYourAnswer: "The count should change once per record. If it stays zero, the loop body never updated the running count.",
    tier: "replicate"
  },
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}, {\"topic\": \"sql\", \"minutes\": 20}]\ntopics = []\n# Append each topic to topics.\nprint(topics)",
    expectedOutput: "['python', 'git', 'sql']",
    checkYourAnswer: "This rep asks you to collect one field from every record. If only one topic appears, the append likely happened outside the loop.",
    tier: "replicate"
  },
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}, {\"topic\": \"python\", \"minutes\": 25}]\npython_minutes = 0\n# Add minutes only when topic is python.\nprint(python_minutes)",
    expectedOutput: "55 python minutes\nOnly python records are included in this total.",
    checkYourAnswer: "This combines a loop with a decision. The total should skip git and include both python records.",
    tier: "synthesize"
  },
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}]\ntotal = 0\n# Bug: this loop resets the total on each pass.\nfor session in sessions:\n    total = 0\n    total = total + session[\"minutes\"]\nprint(total)",
    expectedOutput: "45 total minutes accumulated",
    checkYourAnswer: "The total always ends up as 15 because total = 0 inside the loop resets it on each pass. Move total = 0 before the loop so it accumulates correctly.",
    tier: "diagnose"
  }
];

const pythonFoundationCapstonePracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}]\ntotal_minutes = 0\n# Add each session's minutes with a loop.\nprint(total_minutes)",
    expectedOutput: "45 total minutes counted",
    checkYourAnswer: "This rep isolates the total before the full capstone. If the answer is 0, the loop did not update total_minutes. If it is only 15 or 30, only one record was counted.",
    tier: "replicate"
  },
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}, {\"topic\": \"sql\", \"minutes\": 45}]\nfocus_count = 0\n# Count sessions where minutes is 30 or more.\nprint(focus_count)",
    expectedOutput: "2 focus sessions counted",
    checkYourAnswer: "This rep checks the decision inside the loop. A 30-minute session counts because the condition is greater than or equal to 30.",
    tier: "replicate"
  },
  {
    starterCode: "session_count = 3\ntotal_minutes = 70\nfocus_count = 1\nsummary = \"\"\n# Build the exact readable summary from the calculated values.\nprint(summary)",
    expectedOutput: "3 sessions, 70 minutes, 1 focus session",
    checkYourAnswer: "This rep separates presentation from calculation. The summary should use the calculated variables instead of typing unrelated numbers.",
    tier: "replicate"
  },
  {
    starterCode: "sessions = [{\"topic\": \"python\", \"minutes\": 30}, {\"topic\": \"git\", \"minutes\": 15}, {\"topic\": \"python\", \"minutes\": 25}]\ntotal_minutes = 0\nfocus_count = 0\n# Bug: the output shows 70 minutes but focus_count stays 0. Fix the missing logic.\nfor session in sessions:\n    total_minutes = total_minutes + session[\"minutes\"]\nprint(total_minutes)\nprint(focus_count)",
    expectedOutput: "70 minutes, 2 focus sessions counted",
    checkYourAnswer: "The focus_count is never incremented because no if decision exists inside the loop. Add if session['minutes'] >= 30: focus_count = focus_count + 1 in the loop body.",
    tier: "diagnose"
  },
  {
    starterCode: "# From scratch: create a sessions list with two records: python 30, git 15.\n# Loop over it to calculate total_minutes and focus_count.\n# Print: \"X sessions, Y minutes, Z focus\"\ntotal_minutes = 0\nfocus_count = 0\nsummary = \"\"\nprint(summary)",
    expectedOutput: "2 sessions, 45 minutes, 1 focus",
    checkYourAnswer: "No list is provided — you must create it yourself. If the output is wrong, check whether you created sessions, looped correctly, and built the summary from your calculated values.",
    tier: "synthesize"
  }
];

const pythonStringCleanupPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "raw_topic = \"  PYTHON  \"\nclean_topic = \"\"\nprint(clean_topic)",
    expectedOutput: "python cleaned topic",
    checkYourAnswer: "Use strip before lower so edge spaces disappear and capitalization becomes consistent. The cleaned value should not keep the original spacing.",
    tier: "replicate"
  },
  {
    starterCode: "clean_topic = \"python basics\"\nslug = \"\"\nprint(slug)",
    expectedOutput: "python-basics slug output",
    checkYourAnswer: "Create the slug after cleaning the topic. If spaces remain in slug, replace spaces with hyphens on the cleaned value.",
    tier: "replicate"
  },
  {
    starterCode: "raw_topics = [\" Python \", \"python\", \"PYTHON\"]\ncleaned_topics = []\n# Add the cleaned version of each topic.\nprint(cleaned_topics)",
    expectedOutput: "['python', 'python', 'python']",
    checkYourAnswer: "This rep shows why cleanup matters. Three visually different inputs should become the same dependable topic before grouping.",
    tier: "synthesize"
  },
  {
    starterCode: "raw_topic = \"  Python  \"\n# Bug: this code keeps the edge spaces.\nclean_topic = raw_topic.lower()\nprint(clean_topic)",
    expectedOutput: "python cleaned topic",
    checkYourAnswer: "The code calls lower() before strip(), so edge spaces remain. Swap the order: strip first, or chain as raw_topic.strip().lower().",
    tier: "diagnose"
  }
];

const pythonModuleGuardPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "def count_sessions(sessions):\n    return len(sessions)\n\n# Add the module guard. Inside:\n#   data = [{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}]\n#   print(f\"{count_sessions(data)} session(s)\")\n",
    expectedOutput: "2 session(s) counted",
    checkYourAnswer: "Copy the guard pattern: if __name__ == '__main__': with the test code indented below. Both double-underscore pairs on name and main are essential.",
    tier: "replicate"
  },
  {
    starterCode: "def total_minutes(sessions):\n    total = 0\n    for s in sessions:\n        total = total + s['minutes']\n    return total\n\n# Bug: the guard below never evaluates to True.\nif __name__ == '__main_':\n    data = [{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}]\n    result = total_minutes(data)\n    print(f'{result} total minutes')\n",
    expectedOutput: "45 total minutes summed",
    checkYourAnswer: "The guard has '__main_' with only one trailing underscore instead of two. Python never matches '__main_' to '__main__', so the block never runs. Fix the spelling.",
    tier: "diagnose"
  },
  {
    starterCode: "def parse_sessions(raw):\n    \"\"\"Convert [topic, minutes] pairs into session dicts.\"\"\"\n    result = []\n    for item in raw:\n        result.append({'topic': item[0], 'minutes': int(item[1])})\n    return result\n\n# Write from scratch:\n# 1. Add a module guard so parse_sessions is importable.\n# 2. Inside, create test data and print the result count.\n# Test data: [[\"python\", \"30\"], [\"git\", \"15\"], [\"sql\", \"20\"]]\n",
    expectedOutput: "3 sessions parsed correctly",
    checkYourAnswer: "You need the full guard with __name__ == '__main__' and the test code indented inside. If nothing prints, check the double underscores and indentation.",
    tier: "synthesize"
  }
];

export const level2Lessons: Lesson[] = [
  proofLesson({
    id: "lesson-python-lists",
      curriculum: {
        level: 2,
        sequence: 1,
        version: "1.0.0",
        teaches: ["py.list.literal"],
        requires: ["py.variable.assignment", "py.string", "py.integer"],
        usesButDoesNotTeach: ["py.assertion"]
      },
    codeShape: [
      "# Square brackets make a list.",
      "topics = [\"python\", \"git\", \"sql\"]",
      "",
      "# Access items by position (starts at 0):",
      "second = topics[1]",
      "print(second)"
    ].join("\n"),
    moduleId: "module-python-core",
    slug: "python-lists",
    title: "Lists Hold Ordered Items",
    summary: "Use a Python list to store multiple values in one variable by position.",
    bodyMarkdown: "Square brackets [] make a list. Items inside are separated by commas. Think of a list like numbered train cars — each car holds one item, and you access cars by their position number (starting at 0). Lists keep items in order so you can always find the first, second, or last value.",
    estimatedMinutes: 8,
    difficulty: "foundation",
    skillIds: ["skill-python-basics", "skill-testing-debugging"],
    quizId: "quiz-python-lists",
    desktopTask: "Create a list of topics and print the second topic.",
    evidencePrompt: "Record the list code, the output, and one reason position 0 matters.",
    language: "Python",
    tools: ["Python 3", "terminal", "lists"],
    synopsis: "You are learning how Python stores multiple values in one ordered list.",
    prerequisites: ["Know that a variable can store a single value.", "Know that strings use quotes and numbers usually do not."],
    testingFocus: "You will test that the list is created correctly and that items can be accessed by their zero-based index.",
    objective: "Create a Python list and access items by their index position.",
    whyItMatters: "Real scripts rarely work with one value at a time. Lists let you store and process many values together.",
    coreConcept: "A list is an ordered collection wrapped in square brackets. Each item has a position called an index, starting at 0. You read an item by writing the list variable followed by the index in brackets: topics[1] reads the second item.",
    workedExample: "topics = ['python', 'git', 'sql'] stores three strings in order. topics[0] is 'python', topics[1] is 'git', topics[2] is 'sql'.",
    guidedExercise: "Create a list of study topics, then print the second topic using its index.",
    missionConnection: "This prepares you to hold multiple study sessions in one variable instead of separate named variables.",
    reflectionPrompt: "If a list has 3 items, what is the index of the last item, and what happens if you try index 3?",
    practiceStarter: "topics = ['python']\n\n# Add 'git' and 'sql' to the list, then print the second topic.\nprint(topics)",
    practiceExpected: "git\nIndex 1 is the second topic.",
    practiceCheck: "The output should show the second item. If you see python, you printed index 0 instead of index 1.",
    practiceReps: pythonListPracticeReps,
    miniTitle: "Build a topic list",
    miniGoal: "Create a Python list that stores three study topics and access one by index.",
    miniSteps: ["Create a list with three topic strings", "Access index 1 to get the second topic", "Print the result"],
    miniDeliverables: ["Python list code", "Output showing the second topic", "One sentence about zero-based indexing"],
    verifierCommand: "python topics_list.py",
    expectedEvidence: "Terminal output showing the second topic plus a note about zero-based indexing.",
    projectConnection: "This becomes the foundation for storing repeated records in the Study Tracker.",
    requiredCodeIncludes: ["topics", "[", "]"],
    requiredOutputIncludes: ["git"],
    runnerLanguage: "python",
    runnerStarterCode: "topics = ['python']\n\n# Add 'git' and 'sql' to the list, then print the second topic.\nprint(topics)",
    runnerTestCode: "assert isinstance(topics, list), 'topics must be a list'\nassert len(topics) == 3, 'topics must contain exactly 3 items'\nassert topics[1] == 'git', 'the second topic should be git'\nprint('git list passed')",
    hiddenTests: [
      {
        id: "list-items-are-strings",
        name: "Every item in the list is a string",
        code: "assert all(isinstance(item, str) for item in topics), 'All items must be strings'"
      }
    ]
  }),
  proofLesson({
    id: "lesson-python-dicts",
      curriculum: {
        level: 2,
        sequence: 2,
        version: "1.0.0",
        teaches: ["py.dict.literal"],
        requires: ["py.list.literal", "py.variable.assignment", "py.string"],
        usesButDoesNotTeach: ["py.assertion"]
      },
    codeShape: [
      "# Curly braces make a dictionary.",
      "session = {\"topic\": \"python\", \"minutes\": 30}",
      "",
      "# Access values by their key name:",
      "topic = session[\"topic\"]",
      "print(topic)"
    ].join("\n"),
    moduleId: "module-python-core",
    slug: "python-dicts",
    title: "Dictionaries Map Keys to Values",
    summary: "Use a Python dictionary to store labeled fields in one variable.",
    bodyMarkdown: "Curly braces {} make a dictionary. Think of a dictionary like a labeling drawer — each item has a label (key) and the thing inside (value), and you find things by their label, not their position. Keys and values are separated by a colon, and key-value pairs are separated by commas.",
    estimatedMinutes: 8,
    difficulty: "foundation",
    skillIds: ["skill-python-basics", "skill-testing-debugging"],
    quizId: "quiz-python-dicts",
    desktopTask: "Create a study session dictionary and print the topic value by its key name.",
    evidencePrompt: "Record the dictionary code, the output, and one key that every session record should share.",
    language: "Python",
    tools: ["Python 3", "terminal", "dictionaries"],
    synopsis: "You are learning how Python stores labeled data in key-value pairs.",
    prerequisites: ["Know that a variable can store a single value.", "Know that strings use quotes."],
    testingFocus: "You will test that the dictionary is created with the right keys and that values can be accessed by their key name.",
    objective: "Create a Python dictionary and access values by their key names.",
    whyItMatters: "Dictionaries give names to data fields, so code meaning stays clear instead of relying on position alone.",
    coreConcept: "A dictionary pairs keys with values using curly braces. Each key is a name (usually a string), and each value is the data for that field. You read a value by writing the dictionary variable followed by the key in brackets: session['topic'].",
    workedExample: "session = {'topic': 'python', 'minutes': 30} stores two fields. session['topic'] returns 'python', and session['minutes'] returns 30.",
    guidedExercise: "Create a dictionary with topic and minutes, then print the topic value using its key.",
    missionConnection: "This prepares you to represent one study session as a labeled record.",
    reflectionPrompt: "What happens if you try to read a key that does not exist in the dictionary?",
    practiceStarter: "session = {\"topic\": \"python\"}\n\n# Add the minutes field with value 30, then print the topic.\nprint(session)",
    practiceExpected: "{'topic': 'python', 'minutes': 30}",
    practiceCheck: "Add minutes by assigning session['minutes'] = 30. The output should show both keys.",
    practiceReps: pythonDictPracticeReps,
    miniTitle: "Build a session dictionary",
    miniGoal: "Create a Python dictionary that stores one study session with topic and minutes fields.",
    miniSteps: ["Create a dictionary with a topic key", "Add a minutes key with value 30", "Print the dictionary"],
    miniDeliverables: ["Python dict code", "Output showing both fields", "One sentence about key names vs positions"],
    verifierCommand: "python session_dict.py",
    expectedEvidence: "Terminal output showing the dictionary with topic and minutes plus a note about key access.",
    projectConnection: "This becomes the record shape that the Study Tracker uses for every session.",
    requiredCodeIncludes: ["session", "{", "}"],
    requiredOutputIncludes: ["topic", "minutes"],
    runnerLanguage: "python",
    runnerStarterCode: "session = {\"topic\": \"python\"}\n\n# Add the minutes field with value 30, then print the session.\nprint(session)",
    runnerTestCode: "assert isinstance(session, dict), 'session must be a dictionary'\nassert 'topic' in session and 'minutes' in session, 'session must have topic and minutes keys'\nassert session['topic'] == 'python', 'topic should be python'\nassert session['minutes'] == 30, 'minutes should be 30'\nprint('python 30 dict passed')",
    hiddenTests: [
      {
        id: "session-has-required-keys",
        name: "Session has topic and minutes keys",
        code: "assert isinstance(session, dict)\nassert len(session) == 2, 'session should have exactly 2 keys'\nassert isinstance(session['minutes'], int), 'minutes must be an integer'"
      }
    ]
  }),
  proofLesson({
    id: "lesson-python-list-of-dicts",
      curriculum: {
        level: 2,
        sequence: 3,
        version: "1.0.0",
        teaches: ["py.record.list_of_dicts"],
        requires: ["py.list.literal", "py.dict.literal", "py.variable.assignment", "py.string", "py.integer", "py.boolean"],
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
    slug: "python-list-of-dicts",
    title: "Lists of Dictionaries Hold Real Records",
    summary: "Use a list of dictionaries so Python can hold more than one study session.",
    bodyMarkdown: "A list of dictionaries combines two ideas you already know: a list holds items in order, and a dictionary stores labeled fields. Together they form a record collection where the list is the filing cabinet (keeping sessions in order) and each dictionary is one file folder with named fields. Since you already know lists and dicts separately, this lesson shows how to combine them into the record shape that real scripts use.",
    estimatedMinutes: 8,
    difficulty: "foundation",
    skillIds: ["skill-python-basics", "skill-testing-debugging"],
    quizId: "quiz-python-list-of-dicts",
    desktopTask: "Represent two study sessions as a list of dictionaries and print the second topic.",
    evidencePrompt: "Record the data structure, output, and one field name that every record should share.",
    language: "Python",
    tools: ["Python 3", "terminal", "lists of dictionaries"],
    synopsis: "You are learning how Python holds repeated records. A record is one study session, and repeated records are what let the tracker move beyond one hardcoded example.",
    prerequisites: ["Know that a list stores items in order by position.", "Know that a dictionary maps key names to values."],
    testingFocus: "You will test that the sessions value is a list, that it contains two dictionaries, and that both records use the same beginner-friendly keys: topic and minutes.",
    objective: "Represent two related study sessions with a list of dictionaries.",
    whyItMatters: "Real scripts rarely work with one value at a time. They need a shape that can hold repeated records consistently.",
    coreConcept: "A record is one complete item of information. In Python, a dictionary uses keys and values: the key names the field, and the value is the data in that field. A list stores several records in order so the same code can work with all of them. The combination of both — a list of dictionaries — is the most common way to hold tabular data in Python.",
    workedExample: "sessions = [{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}] keeps two records in one variable. sessions[1] reads the second record because list positions start at zero, and sessions[1]['topic'] reads the second record's topic field.",
    guidedExercise: "Add a second study-session dictionary to a sessions list, then print the second session's topic.",
    missionConnection: "This prepares the CLI Study Tracker to hold a week of sessions instead of one hardcoded line.",
    reflectionPrompt: "Which keys should every session share, and what would break if one record used name instead of topic?",
    practiceStarter: "sessions = [\n    {\"topic\": \"python\", \"minutes\": 30}\n]\n\n# Add a git session with 15 minutes.\nprint(sessions)",
    practiceExpected: "[{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}]",
    practiceCheck: "The output should show square brackets for the list and curly braces for each dictionary. If the second record is missing, check whether it was added inside the list brackets.",
    practiceReps: pythonRecordListPracticeReps,
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
        sequence: 4,
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
    bodyMarkdown: "An if statement lets a program choose between paths. The line ending with : asks a true-or-false question, and the indented lines below it are the code Python runs for that answer. The `>=` operator means 'greater than or equal to' — so `minutes >= 30` asks: is minutes 30 or more?",
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
        sequence: 5,
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
        sequence: 6,
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
        sequence: 7,
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
  }),
  proofLesson({
    id: "lesson-python-module-guard",
      curriculum: {
        level: 2,
        sequence: 8,
        version: "1.0.0",
        teaches: ["py.module.guard"],
        requires: ["py.if_else", "py.f_string", "py.for_loop", "py.print.variable"],
        usesButDoesNotTeach: ["py.assertion", "py.function.def", "py.return"]
      },
    codeShape: [
      'def reusable_function():',
      '    return "data that stays quiet on import"',
      '',
      'if __name__ == "__main__":',
      '    # Only runs when the file is executed directly.',
      '    print(reusable_function())'
    ].join("\n"),
    moduleId: "module-python-core",
    slug: "python-module-guard",
    title: "The Module Guard Lets Files Be Reusable AND Runnable",
    summary: "Learn the module guard pattern that lets Python files act as reusable modules AND standalone scripts.",
    bodyMarkdown: "When Python runs a script, the built-in variable __name__ is set to '__main__'. When another file imports that script, __name__ is the module name, not '__main__'. The guard `if __name__ == '__main__':` checks which case this is, so code inside only runs during direct execution. This means the Study Tracker file can define reusable functions at the top, and wrap the interactive CLI code behind the guard. When you write `from study_tracker import parse_row`, the import silently loads the function without triggering test prints or the menu prompt.",
    estimatedMinutes: 10,
    difficulty: "applied",
    skillIds: ["skill-python-basics"],
    quizId: "quiz-python-module-guard",
    desktopTask: "Add a module guard to a script so the test data and print only run during direct execution.",
    evidencePrompt: "Record the guarded script, the output from direct execution, and proof that importing the module stays silent.",
    language: "Python",
    tools: ["Python 3", "terminal", "module guard pattern"],
    synopsis: "You are learning to protect your module's test and CLI code from running during import, which is the standard way professional Python projects organize reusable code.",
    prerequisites: ["Know that a function is a reusable block of code.", "Know that import loads another module's symbols."],
    testingFocus: "You will test that the guarded code runs only when the file is executed directly, and that importing the module does not trigger the guarded output.",
    objective: "Explain and apply the if __name__ == '__main__' pattern to make Python files dual-purpose as modules and scripts.",
    whyItMatters: "Without the module guard, importing a file runs all its code — including test prints and CLI prompts. The guard keeps reusable functions importable while still letting the file run as a script.",
    coreConcept: "Every Python file has a built-in __name__ variable. When you run the file directly, Python sets __name__ to '__main__'. When another file imports it, __name__ is the module's name. The guard `if __name__ == '__main__':` checks which case this is, so code inside only runs during direct execution.",
    workedExample: "def total_minutes(sessions): total = 0; for s in sessions: total += s['minutes']; return total then a guard block below creates test data, calls total_minutes, and prints the result. Importing the file gives you the function. Running it directly prints the summary.",
    guidedExercise: "Add the module guard to a short script so the calculation code only runs when the file is executed directly.",
    missionConnection: "The CLI Study Tracker will need this pattern to separate reusable data functions from the interactive menu script.",
    reflectionPrompt: "What would happen if you imported a helper module that printed test output at the bottom? How does the guard prevent that confusion?",
    practiceStarter: "def total_minutes(sessions):\n    total = 0\n    for s in sessions:\n        total = total + s['minutes']\n    return total\n\n# Add the module guard. Inside it:\n#   sessions = [{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}]\n#   result = total_minutes(sessions)\n#   print(f'{result} total minutes')\n",
    practiceExpected: "45 total minutes",
    practiceCheck: "If the guard is missing or misspelled, the output might still be blank or might fire during import. Check that __name__ has double underscores on both sides and the comparison is to '__main__'.",
    practiceReps: pythonModuleGuardPracticeReps,
    miniTitle: "Guard the Study Tracker logic",
    miniGoal: "Add an if __name__ guard to a module so the test code stays silent during import.",
    miniSteps: ["Define a reusable helper function at module level", "Add the if __name__ == '__main__' guard check", "Put the test data and print inside the guarded block"],
    miniDeliverables: ["Python file with module guard", "Output from direct execution", "One sentence explaining what the guard prevents"],
    verifierCommand: "python guarded_tracker.py",
    expectedEvidence: "Terminal output showing the summary plus a note that importing this file does not print the summary.",
    projectConnection: "This pattern is essential for the CLI Study Tracker to separate reusable logic (importable) from the interactive menu (direct-run only).",
    requiredCodeIncludes: ["__name__", "__main__", "if", "sessions"],
    requiredOutputIncludes: ["minutes"],
    runnerLanguage: "python",
    runnerStarterCode: "def total_minutes(sessions):\n    total = 0\n    for s in sessions:\n        total = total + s['minutes']\n    return total\n\n# Add the module guard. Inside:\n#   sessions = [{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}]\n#   result = total_minutes(sessions)\n#   print(f'{result} total minutes')\n",
    runnerTestCode: "assert callable(total_minutes), 'total_minutes must be a function defined at module level'\ntest_sessions = [{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}]\nassert total_minutes(test_sessions) == 45, 'total_minutes should return 45 for the test data'\nprint('module guard passed')",
    hiddenTests: [
      {
        id: "module-guard-function-sums-correctly",
        name: "total_minutes sums correctly with varied data",
        code: "assert total_minutes([{'topic': 'x', 'minutes': 10}, {'topic': 'y', 'minutes': 20}]) == 30, 'total_minutes should sum two records'\nassert total_minutes([]) == 0, 'total_minutes should handle empty list'"
      }
    ]
  })
];

// Add depth configurations to level2Lessons
level2Lessons[0].depth = {
  primaryConceptId: "py.list.literal",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.list.literal",
      definition: "An ordered collection of items wrapped in square brackets and separated by commas.",
      mentalModel: "Think of a list like numbered train cars — each car holds one item, and you access cars by their position number (starting at 0).",
      syntaxShape: "[item1, item2]",
      tinyExample: '["python", "git", "sql"]',
      commonMistake: "Forgetting to separate list items with commas. Also: accessing index 3 in a 3-item list causes IndexError because valid positions are 0, 1, and 2.",
      repairHint: "Add a comma between adjacent list elements. Check that the index is within 0 to len(list) - 1.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-list-1",
      label: "Create a list",
      codeFragment: 'topics = ["python", "git", "sql"]',
      conceptIds: ["py.list.literal"],
      explanation: "Creates a list named topics containing three string items in order.",
      learnerShouldBeAbleToSay: "topics is a list storing three study topics in order"
    },
    {
      id: "w-list-2",
      label: "Access by index",
      codeFragment: 'second = topics[1]',
      conceptIds: ["py.list.literal"],
      explanation: "Reads the second item from topics. Index 1 means the second position because counting starts at 0.",
      learnerShouldBeAbleToSay: "topics[1] reads the second item from the list"
    }
  ],
  guidedEdits: [
    {
      id: "g-list-1",
      instruction: "Add a fourth topic 'sql' to the topics list and print index 3.",
      conceptIds: ["py.list.literal"],
      targetCodeFragment: 'topics = ["python", "git"]',
      expectedObservation: "The output shows 'sql' when accessing index 3.",
      wrongTurnHint: "Add 'sql' inside the list brackets separated by a comma."
    }
  ],
  errorClinic: [
    {
      id: "e-list-1",
      conceptIds: ["py.list.index"],
      brokenExample: "items = [10, 20, 30]\nprint(items[3])",
      symptom: "IndexError: list index out of range",
      likelyCause: "Using an index position higher than length - 1 of the list.",
      fixStrategy: "Access index 0, 1, or 2 since the list has 3 items."
    }
  ],
  codeLabBridge: {
    story: "Create a topics list and access the second item by its index.",
    usesConcepts: ["py.list.literal"],
    learnerOwns: ["topics"],
    checkerOwns: ["topics-have-items"],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "Why does Python start list indices at 0 instead of 1?",
  exitTicket: [
    "I understand list indexes start at 0.",
    "I can create and access items in a Python list."
  ]
};

level2Lessons[1].depth = {
  primaryConceptId: "py.dict.literal",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.dict.literal",
      definition: "A collection of key-value pairs wrapped in curly braces, where each unique key maps to a value.",
      mentalModel: "Think of a dictionary like a labeling drawer — each item has a label (key) and the thing inside (value), and you find things by their label, not their position.",
      syntaxShape: "{key1: value1, key2: value2}",
      tinyExample: '{"topic": "python", "minutes": 30}',
      commonMistake: "Using equals (=) instead of colons (:) to link keys to values inside literal braces. Also: looking up a key that does not exist causes KeyError.",
      repairHint: "Replace equals signs with colons inside dictionary braces. Check that the key name matches exactly, including quotes and spelling.",
      usedIn: ["learn", "practice"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-dict-1",
      label: "Create a dictionary",
      codeFragment: 'session = {"topic": "python", "minutes": 30}',
      conceptIds: ["py.dict.literal"],
      explanation: "Creates a dictionary named session with two key-value pairs. 'topic' maps to 'python' and 'minutes' maps to 30.",
      learnerShouldBeAbleToSay: "session is a dictionary with topic and minutes fields"
    },
    {
      id: "w-dict-2",
      label: "Access by key",
      codeFragment: 'topic = session["topic"]',
      conceptIds: ["py.dict.literal"],
      explanation: "Reads the value stored under the key 'topic'. Unlike list indices, dictionary keys are names not positions.",
      learnerShouldBeAbleToSay: "session['topic'] reads the value stored under the topic key"
    }
  ],
  guidedEdits: [
    {
      id: "g-dict-1",
      instruction: "Add a 'completed' field set to False in the session dictionary.",
      conceptIds: ["py.dict.literal"],
      targetCodeFragment: 'session = {"topic": "python", "minutes": 30}',
      expectedObservation: "The printed output shows three key-value pairs including completed: False.",
      wrongTurnHint: "Assign session['completed'] = False on a new line after creating the dictionary."
    }
  ],
  errorClinic: [
    {
      id: "e-dict-1",
      conceptIds: ["py.dict.key_lookup"],
      brokenExample: 'session = {"topic": "python", "minutes": 30}\nprint(session["name"])',
      symptom: "KeyError: 'name'",
      likelyCause: "Looking up a key name that does not exist in the session dictionary.",
      fixStrategy: "Change the key lookup from 'name' to the correct field key: 'topic'."
    }
  ],
  codeLabBridge: {
    story: "Create a session dictionary with topic and minutes, then access the topic by its key name.",
    usesConcepts: ["py.dict.literal"],
    learnerOwns: ["session"],
    checkerOwns: ["session-has-fields"],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "Why do we use key names instead of positions to access dictionary values?",
  exitTicket: [
    "I can create a dictionary with key-value pairs.",
    "I know how to access and add fields by their key names."
  ]
};

level2Lessons[2].depth = {
  primaryConceptId: "py.record.list_of_dicts",
  secondaryConceptIds: [],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.record.list_of_dicts",
      definition: "A structural pattern where database-like records are represented as dictionary objects inside a parent list.",
      mentalModel: "Think of a list of dictionaries as a filing cabinet: the list is the cabinet keeping folders in order, and each dictionary is one labeled folder with named fields.",
      syntaxShape: "[{key: val}, {key: val}]",
      tinyExample: '[{"topic": "python", "minutes": 30}, {"topic": "git", "minutes": 15}]',
      commonMistake: "Using inconsistent key names across different dictionaries in the same list.",
      repairHint: "Verify all records use the exact same string keys for identical fields.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-rec-1",
      label: "Define list of dictionaries",
      codeFragment: 'sessions = [\n    {"topic": "python", "minutes": 30}\n]',
      conceptIds: ["py.record.list_of_dicts"],
      explanation: "Creates a list named sessions containing a single study session dictionary.",
      learnerShouldBeAbleToSay: "sessions is a list storing dictionary records representing sessions"
    }
  ],
  guidedEdits: [
    {
      id: "g-rec-1",
      instruction: "Add a second dictionary with topic 'git' and minutes 15 inside the sessions list.",
      conceptIds: ["py.record.list_of_dicts"],
      targetCodeFragment: 'sessions = [\n    {"topic": "python", "minutes": 30}\n]',
      expectedObservation: "The printed output shows both python and git dictionaries in the list.",
      wrongTurnHint: "Separate the two dictionary curly brace blocks with a comma."
    }
  ],
  errorClinic: [],
  codeLabBridge: {
    story: "Define a sessions list containing two study records (python 30 and git 15).",
    usesConcepts: ["py.record.list_of_dicts"],
    learnerOwns: ["sessions"],
    checkerOwns: ["sessions-have-two-records"],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "Why do we prefer using a list of dictionaries over separate variable names for multiple records?",
  exitTicket: [
    "I understand that a list holds records in order.",
    "I can represent tables of data as a list of dictionaries."
  ]
};

level2Lessons[3].depth = {
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

level2Lessons[4].depth = {
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

level2Lessons[5].depth = {
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
    },
    {
      conceptId: "py.f_string",
      definition: "A string prefixed with f that embeds variable values inside {} placeholders.",
      mentalModel: "Think of an f-string as a fill-in-the-blank sentence: {} marks the blanks and Python fills them in.",
      syntaxShape: 'f"text {variable} more text"',
      tinyExample: 'f"{topic}: {minutes} min"',
      commonMistake: "Forgetting the f prefix, which makes the braces literal characters instead of variable slots.",
      repairHint: "Add f before the opening quote: f\"{variable}\".",
      usedIn: ["learn", "practice"]
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

level2Lessons[6].depth = {
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

level2Lessons[7].depth = {
  primaryConceptId: "py.module.guard",
  secondaryConceptIds: ["py.if_else", "py.f_string", "py.module.guard.mechanics"],
  maxNewConcepts: 1,
  conceptCapsules: [
    {
      conceptId: "py.module.guard",
      definition: "A conditional block that checks if __name__ equals '__main__' to separate importable code from direct-execution code.",
      mentalModel: "Think of the module guard as a velvet rope: the reusable functions are the general admission area, and the guarded block is the VIP section that only opens when you run the file directly.",
      syntaxShape: 'if __name__ == "__main__":\n    # code here runs only on direct execution',
      tinyExample: 'if __name__ == "__main__":\n    print("Direct run only")',
      commonMistake: "Using a single = instead of ==, or forgetting double underscores on both sides of __name__ and __main__.",
      repairHint: "Verify exactly two underscores before and after both name and main: __name__ == '__main__'.",
      usedIn: ["learn", "practice", "code_lab"]
    },
    {
      conceptId: "py.module.guard.mechanics",
      definition: "The __name__ variable is a string that Python sets to '__main__' when running a file directly, or to the module's name when imported.",
      mentalModel: "Think of __name__ as a name tag Python attaches to every file. When you run a file directly, Python writes '__main__' on the tag. When another file imports it, Python writes the file's actual name on the tag instead.",
      syntaxShape: "if __name__ == '__main__':",
      tinyExample: "# In study_tracker.py:\nif __name__ == '__main__':\n    print('Running directly!')\nelse:\n    print(f'Imported as {__name__}')",
      commonMistake: "Forgetting that __name__ is '__main__' only when run directly — imported code with the same guard will NOT execute the guarded block.",
      repairHint: "Add a print(__name__) line before the guard to see what Python thinks the current file is named. If you see the module's filename, you're importing it.",
      usedIn: ["learn", "practice", "code_lab"]
    }
  ],
  codeWalkthrough: [
    {
      id: "w-guard-1",
      label: "Define reusable function",
      codeFragment: "def total_minutes(sessions):\n    total = 0\n    for s in sessions:\n        total = total + s['minutes']\n    return total",
      conceptIds: ["py.module.guard"],
      explanation: "Defines a function at module level so it is available whether the file is imported or run directly.",
      learnerShouldBeAbleToSay: "total_minutes is defined globally and can be imported by other files without triggering output"
    },
    {
      id: "w-guard-2",
      label: "Add the module guard",
      codeFragment: 'if __name__ == "__main__":',
      conceptIds: ["py.module.guard"],
      explanation: "Checks whether this file is being run directly (__name__ is '__main__') or imported. Code inside only runs on direct execution.",
      learnerShouldBeAbleToSay: "the guard condition checks if this is the main execution entry point"
    },
    {
      id: "w-guard-3",
      label: "Test code inside the guard",
      codeFragment: '    data = [{"topic": "python", "minutes": 30}]\n    print(total_minutes(data))',
      conceptIds: ["py.module.guard", "py.f_string"],
      explanation: "Test or CLI code placed inside the guarded block stays safe from accidental execution during import.",
      learnerShouldBeAbleToSay: "inside the guard I put test output that should not run when the module is imported"
    }
  ],
  guidedEdits: [
    {
      id: "g-guard-1",
      instruction: "Move the print statement outside the module guard so it runs on import.",
      conceptIds: ["py.module.guard"],
      targetCodeFragment: 'if __name__ == "__main__":\n    print(total_minutes(data))',
      expectedObservation: "The print now runs when the file is imported into another module instead of staying silent.",
      wrongTurnHint: "Unindent the print line so it is at the same level as the if, not inside its block."
    }
  ],
  errorClinic: [
    {
      id: "e-guard-1",
      conceptIds: ["py.module.guard"],
      brokenExample: "if __name__ = '__main__':",
      symptom: "SyntaxError: invalid syntax",
      likelyCause: "Using assignment operator = instead of comparison operator == in the guard condition.",
      fixStrategy: "Replace = with ==: if __name__ == '__main__'."
    },
    {
      id: "e-guard-2",
      conceptIds: ["py.module.guard"],
      brokenExample: "if _name_ == '__main__':",
      symptom: "NameError: name '_name_' is not defined",
      likelyCause: "Using single underscores instead of double underscores around name.",
      fixStrategy: "Use two underscores on each side: __name__."
    }
  ],
  codeLabBridge: {
    story: "Build a module guard that wraps the Study Tracker's test code so the parsing function can be imported cleanly.",
    usesConcepts: ["py.module.guard"],
    learnerOwns: ["total_minutes"],
    checkerOwns: ["module-guard-check"],
    runExpectation: "prints passed"
  },
  understandingProofPrompt: "Why is it important to keep reusable function definitions outside the module guard block?",
  exitTicket: [
    "I can explain when and why to use the module guard pattern.",
    "I know that __name__ changes based on how the file is executed."
  ]
};

export const level2Quizzes: Quiz[] = [
  codeReadingQuiz(
    "quiz-python-lists",
    "lesson-python-lists",
    "Lists Checkpoint",
    'topics = ["python", "git", "sql"]\nsecond = topics[1]',
    "lists",
    "topics[1] reads the second item 'git' because list indexes start at 0",
    "topics[1] reads the first item 'python' because counting starts at 1",
    "topics[1] causes an error because you cannot index a list",
    "Python lists use zero-based indexing. Index 0 is the first element, index 1 is the second.",
    ["py.list.literal"]
  ),
  codeReadingQuiz(
    "quiz-python-dicts",
    "lesson-python-dicts",
    "Dicts Checkpoint",
    'session = {"topic": "python", "minutes": 30}\ntopic = session["topic"]',
    "dictionaries",
    'session["topic"] accesses the value stored under the key "topic", which is "python"',
    'session["topic"] accesses the value at position 0, which is "topic"',
    'session["topic"] causes an error because you need an index number, not a key name',
    "Dictionaries use key names, not positions. session['topic'] looks up the value stored under the key 'topic'.",
    ["py.dict.literal"]
  ),
  codeReadingQuiz(
    "quiz-python-list-of-dicts",
    "lesson-python-list-of-dicts",
    "List of Dicts Checkpoint",
    'sessions = [{"topic": "python", "minutes": 30}, {"topic": "git", "minutes": 15}]',
    "lists of dictionaries",
    "sessions[1] reads the second dictionary because list indexes start at 0",
    "sessions[1] reads the first dictionary because counting starts at 1",
    "sessions[1] causes an error because you cannot index a list of dictionaries",
    "Python lists use zero-based indexing. Index 0 is the first element, index 1 is the second.",
    ["py.record.list_of_dicts"]
  ),
  codeReadingQuiz(
    "quiz-python-decisions",
    "lesson-python-decisions",
    "Decisions Checkpoint",
    'if minutes >= 30:\n    label = "focus"\nelse:\n    label = "quick"',
    "if/else decisions",
    '30 is equal to 30, so minutes >= 30 is True and label becomes "focus"',
    '30 is not greater than 30, so the condition is False and label becomes "quick"',
    ">= only checks greater-than, not equality, so 30 triggers the else branch",
    '>= means "greater than or equal to." 30 >= 30 is True, so the if branch runs.',
    ["py.if_else", "py.comparison"]
  ),
  codeReadingQuiz(
    "quiz-python-loops",
    "lesson-python-loops",
    "Loops Checkpoint",
    'total_minutes = 0\nfor session in sessions:\n    total_minutes = total_minutes + session["minutes"]',
    "for loops",
    "total_minutes must start at 0 before the loop, or it resets on every pass",
    "total_minutes should start at 0 inside the loop so each session has its own total",
    "The loop only runs once over all sessions combined, not once per session",
    "Initializing the accumulator inside the loop resets it to 0 on each pass. Only the last session's minutes would be counted.",
    ["py.for_loop", "py.accumulator"]
  ),
  codeReadingQuiz(
    "quiz-python-foundation-capstone",
    "lesson-python-foundation-capstone",
    "Capstone Checkpoint",
    'for session in sessions:\n    total_minutes = total_minutes + session["minutes"]\n    if session["minutes"] >= 30:\n        focus_count = focus_count + 1',
    "combining decisions and loops",
    "The loop calculates both totals at once, which is more efficient than two separate loops",
    "The if statement inside the loop would cause each session to be counted twice",
    "The focus_count should be on a separate line outside the loop, not indented inside",
    "Both accumulators update inside the same loop. The if condition only fires for sessions with 30 or more minutes.",
    ["py.accumulator", "py.for_loop", "py.if_else"]
  ),
  codeReadingQuiz(
    "quiz-python-strings-cleanup",
    "lesson-python-strings-cleanup",
    "String Cleanup Checkpoint",
    'clean_topic = raw_topic.strip().lower()\nslug = clean_topic.replace(" ", "-")',
    "string cleaning",
    "`slug` replaces spaces with hyphens so the value is URL/filename-friendly",
    "`slug` is another cleaned copy with spaces preserved",
    "`slug` overwrites clean_topic with the original value",
    "A slug is a filename-safe version: lowercase, no spaces, hyphens between words.",
    ["py.string"]
  ),
  codeReadingQuiz(
    "quiz-python-module-guard",
    "lesson-python-module-guard",
    "Module Guard Checkpoint",
    'def analyze(sessions):\n    return f"{len(sessions)} sessions tracked"\n\nif __name__ == "__main__":\n    data = [{"topic": "python", "minutes": 30}]\n    print(analyze(data))',
    "module guard pattern",
    "When imported, analyze() is available but nothing prints. When run directly, it prints the summary.",
    "When imported, the file prints the summary because analyze() runs on import automatically.",
    "The if __name__ condition prevents analyze() from being defined during import at all.",
    "The guard `if __name__ == '__main__':` lets the function be imported without triggering the test code. Only direct execution runs the indented block.",
    ["py.module.guard"]
  )
];
