import type { CurriculumMetadata, Lesson, LessonPracticeBlock, Quiz, QuizQuestion } from "@/domain/types";
import { proofLesson, shuffleQuizChoices, workshop } from "../python/shared";

/**
 * SQL track lessons built with the shared lesson builders. The SQL sandbox is
 * read-only for learners (SELECT / WITH only), so every lesson seeds its schema
 * and rows through the runner's privileged `setupCode`, and every check uses the
 * `EXPECT_ROWS:` marker convention (or a trusted INSERT harness for hidden
 * checks) copied from the pre-existing SQL lessons.
 *
 * Files live under src/content/sql/ to keep the querying/modeling arc together;
 * seed.ts splices `sqlLessons` and `sqlQuizzes` into the content pack.
 */


interface SqlCurriculumInput {
  level: number;
  sequence: number;
  teaches: string[];
  requires?: string[];
  visibleCodeConcepts?: string[];
}

function sqlCurriculum(input: SqlCurriculumInput): CurriculumMetadata {
  return {
    level: input.level,
    sequence: input.sequence,
    version: "1.0.0",
    lessonKind: "proof_pack",
    teaches: input.teaches,
    requires: input.requires ?? [],
    visibleCodeConcepts: input.visibleCodeConcepts ?? input.teaches,
    quizConcepts: input.teaches,
    proofOutputs: ["code_snapshot", "terminal_stdout", "auto_code_run", "test_output"],
    runnerCapabilities: ["runner.run_checks", "runner.hidden_checks", "runner.sql.sqlite_memory", "runner.no_network"]
  };
}

const SQL_TOOLS = ["SQLite SQL", "query runner"];
const SQL_LANGUAGE = "SQL";

const sqlJoinPracticeReps: LessonPracticeBlock[] = [
  {
    tier: "transfer",
    starterCode: "-- New context: an `evidence` table gained a `reviewer` column, and some rows have NULL reviewer.\n-- Print the title of every mission whose evidence is missing OR unreviewed.\nSELECT m.title\nFROM missions m\nLEFT JOIN evidence e ON e.mission_id = m.id\nWHERE e.id IS NULL;",
    expectedOutput: "Unreviewed rows are still shown, which is the bug this transfer rep exists to expose.",
    checkYourAnswer: "A LEFT JOIN keeps the mission row when nothing matches, but a row that matches with reviewer NULL is not caught by e.id IS NULL. Add the reviewer condition and check whether you also drop the truly-missing rows."
  },
  {
    tier: "diagnose",
    starterCode: "-- This query returns zero rows even though missions without evidence exist.\n-- Find the one clause that is wrong.\nSELECT m.title\nFROM missions m\nINNER JOIN evidence e ON e.mission_id = m.id\nWHERE e.id IS NULL;",
    expectedOutput: "Zero rows, because INNER JOIN already removed every mission that lacks evidence.",
    checkYourAnswer: "The bug is the join type, not the WHERE clause. INNER JOIN drops the unmatched mission rows before the filter can select them, so the question 'which missions have no evidence' can never be answered with an inner join."
  },
  {
    starterCode: "SELECT m.title\nFROM missions m\nLEFT JOIN evidence e ON e.mission_id = m.id\nWHERE e.id IS NULL;",
    expectedOutput: "Only the mission with no linked evidence appears, and its title is 'no evidence'.",
    checkYourAnswer: "Start from the table where missing rows matter. If you start from evidence, missions with no evidence cannot appear."
  },
  {
    starterCode: "SELECT m.title, COUNT(e.id) AS evidence_count\nFROM missions m\nLEFT JOIN evidence e ON e.mission_id = m.id\nGROUP BY m.id, m.title;",
    expectedOutput: "Every mission appears with a count, including missions where evidence_count is 0.",
    checkYourAnswer: "COUNT(e.id) counts matching evidence rows. A LEFT JOIN keeps the mission row even when that count is zero."
  },
  {
    starterCode: "SELECT m.title\nFROM missions m\nINNER JOIN evidence e ON e.mission_id = m.id;",
    expectedOutput: "Only missions that already have evidence appear.",
    checkYourAnswer: "This is the contrast rep. INNER JOIN is correct for existing matches but wrong when the product question is about missing work."
  }
];

// ---------------------------------------------------------------------------
// Lesson 1: aggregates and the WHERE-vs-HAVING trap
// ---------------------------------------------------------------------------

const aggregatePracticeReps: LessonPracticeBlock[] = [
  {
    tier: "replicate",
    starterCode: "SELECT topic, COUNT(*) AS session_count\nFROM study_sessions\nGROUP BY topic\nORDER BY topic;",
    expectedOutput: "One row per topic with the number of sessions recorded for that topic.",
    checkYourAnswer: "GROUP BY topic collapses every session row into one row per topic before COUNT runs. If a topic is missing, check the spelling and the seeded table name."
  },
  {
    tier: "diagnose",
    starterCode: "SELECT learner, SUM(minutes) AS total\nFROM study_sessions\nWHERE SUM(minutes) > 20\nGROUP BY learner;",
    expectedOutput: "The query fails because WHERE cannot see a group aggregate; the filter must move into HAVING.",
    checkYourAnswer: "SQLite reports 'misuse of aggregate'. WHERE filters individual rows before grouping, so SUM does not exist yet at that point."
  },
  {
    tier: "synthesize",
    starterCode: "SELECT learner, COUNT(DISTINCT topic) AS topic_count\nFROM study_sessions\nGROUP BY learner\nHAVING COUNT(DISTINCT topic) >= 2\nORDER BY learner;",
    expectedOutput: "Only learners who studied at least two distinct topics survive the HAVING filter.",
    checkYourAnswer: "This combines grouping, a DISTINCT count, and a group filter. Ask which clause runs over rows and which runs over finished groups."
  }
];

const aggregateQuiz = {
  id: "quiz-sql-aggregates",
  lessonId: "lesson-sql-aggregates",
  title: "Grouping and filtering aggregates",
  passingScore: 80,
  questions: ([
    {
      id: "quiz-sql-aggregates-q1",
      prompt: "A report needs only groups whose total is above a threshold. Where does that filter belong?",
      choices: [
        "In WHERE, before the rows are grouped",
        "In HAVING, after the groups are formed",
        "In ORDER BY, after the rows are sorted"
      ],
      correctChoiceIndex: 1,
      explanation: "HAVING is evaluated after GROUP BY, so it can compare an aggregate such as SUM(minutes)."
    },
    {
      id: "quiz-sql-aggregates-q2",
      prompt: "Why does `WHERE SUM(minutes) > 40` fail?",
      choices: [
        "The table has no minutes column",
        "WHERE runs before groups exist, so no aggregate is available yet",
        "SUM is only allowed inside ORDER BY"
      ],
      correctChoiceIndex: 1,
      explanation: "Row filters run before grouping. Aggregates become available only once GROUP BY has collapsed the rows."
    },
    {
      id: "quiz-sql-aggregates-q3",
      prompt: "What does `GROUP BY learner, topic` produce?",
      choices: [
        "One row per learner",
        "One row per learner-topic pair",
        "One row per original session"
      ],
      correctChoiceIndex: 1,
      explanation: "Each distinct combination of the grouped columns becomes exactly one output row."
    }
  ] as QuizQuestion[]).map(shuffleQuizChoices)
} satisfies Quiz;

// ---------------------------------------------------------------------------
// Lesson 2: subqueries and the `=` vs `IN` trap
// ---------------------------------------------------------------------------

const subqueryPracticeReps: LessonPracticeBlock[] = [
  {
    tier: "replicate",
    starterCode: "SELECT learner, topic, minutes\nFROM study_sessions\nWHERE minutes > (SELECT AVG(minutes) FROM study_sessions)\nORDER BY minutes DESC;",
    expectedOutput: "Only sessions longer than the overall average remain, ordered from longest to shortest.",
    checkYourAnswer: "The subquery returns exactly one value, the average, so a scalar comparison is safe. Ask what would happen if it returned many rows."
  },
  {
    tier: "diagnose",
    starterCode: "SELECT DISTINCT topic\nFROM study_sessions\nWHERE topic = (SELECT topic FROM study_sessions WHERE minutes > 40);",
    expectedOutput: "The query silently keeps only one topic because a multi-row subquery used with = is read as a scalar.",
    checkYourAnswer: "This is the taught bug: it passes on data where the subquery happens to return one row and breaks later. Replace = with IN when the subquery can return a set."
  },
  {
    tier: "synthesize",
    starterCode: "SELECT learner\nFROM study_sessions\nGROUP BY learner\nHAVING MAX(minutes) > (SELECT AVG(minutes) FROM study_sessions)\nORDER BY learner;",
    expectedOutput: "Learners whose single best session beats the overall average appear once each.",
    checkYourAnswer: "This mixes a grouped query with a scalar subquery. Read it as: build the average once, then compare each learner's best session against it."
  }
];

const subqueryQuiz = {
  id: "quiz-sql-subqueries",
  lessonId: "lesson-sql-subqueries",
  title: "Subqueries and derived values",
  passingScore: 80,
  questions: ([
    {
      id: "quiz-sql-subqueries-q1",
      prompt: "When must you use IN instead of = with a subquery?",
      choices: [
        "When the subquery can return more than one row",
        "When the subquery has no WHERE clause",
        "When the outer table is empty"
      ],
      correctChoiceIndex: 0,
      explanation: "IN compares against a set of values, while = expects a single scalar value."
    },
    {
      id: "quiz-sql-subqueries-q2",
      prompt: "What does a scalar subquery return?",
      choices: [
        "A whole table",
        "Exactly one value",
        "One column with many rows"
      ],
      correctChoiceIndex: 1,
      explanation: "A scalar subquery is used where a single value is expected, such as the right side of = or >."
    },
    {
      id: "quiz-sql-subqueries-q3",
      prompt: "Why does `topic = (SELECT topic ...)` pass on a small test but fail in production?",
      choices: [
        "The database rewrites the query at random",
        "It silently uses only one row of a multi-row result",
        "It deletes the extra rows before returning"
      ],
      correctChoiceIndex: 1,
      explanation: "A scalar context collapses a multi-row subquery to a single value, so extra matches are silently ignored."
    }
  ] as QuizQuestion[]).map(shuffleQuizChoices)
} satisfies Quiz;

// ---------------------------------------------------------------------------
// Lesson 3: common table expressions
// ---------------------------------------------------------------------------

const ctePracticeReps: LessonPracticeBlock[] = [
  {
    tier: "replicate",
    starterCode: "WITH topic_totals AS (\n  SELECT topic, SUM(minutes) AS total\n  FROM study_sessions\n  GROUP BY topic\n)\nSELECT topic, total FROM topic_totals ORDER BY total DESC;",
    expectedOutput: "Each topic appears once with its summed minutes, largest total first.",
    checkYourAnswer: "The CTE names the intermediate totals, and the outer query just reads that name. If total is unknown, make sure the CTE selected it."
  },
  {
    tier: "diagnose",
    starterCode: "WITH totals AS (\n  SELECT learner, SUM(minutes) AS total\n  FROM study_sessions\n  GROUP BY learner\n)\nSELECT learner, total\nFROM study_sessions\nWHERE total > 40;",
    expectedOutput: "The query fails because it reads the base table instead of the named CTE.",
    checkYourAnswer: "A CTE is only usable by name. The outer FROM must reference totals, not study_sessions, or the derived column does not exist."
  },
  {
    tier: "synthesize",
    starterCode: "WITH totals AS (\n  SELECT learner, SUM(minutes) AS total\n  FROM study_sessions\n  GROUP BY learner\n),\nranked AS (\n  SELECT learner, total, total >= 70 AS at_goal\n  FROM totals\n)\nSELECT learner, total\nFROM ranked\nWHERE at_goal = 1\nORDER BY total DESC;",
    expectedOutput: "One row per learner who reached the goal, ordered by total minutes.",
    checkYourAnswer: "The second CTE builds on the first. Read the WITH block top to bottom, like steps in a recipe, instead of jumping to the final SELECT."
  }
];

const cteQuiz = {
  id: "quiz-sql-ctes",
  lessonId: "lesson-sql-ctes",
  title: "Readable multi-step queries with WITH",
  passingScore: 80,
  questions: ([
    {
      id: "quiz-sql-ctes-q1",
      prompt: "What is the main benefit of a WITH clause?",
      choices: [
        "It stores the result permanently for later sessions",
        "It names an intermediate result so a long query reads in steps",
        "It removes the need for a database"
      ],
      correctChoiceIndex: 1,
      explanation: "A CTE is a named, temporary result that makes a multi-step query readable and repeatable."
    },
    {
      id: "quiz-sql-ctes-q2",
      prompt: "In one WITH block, can a later CTE reference an earlier one?",
      choices: [
        "No, each CTE is isolated",
        "Yes, a later CTE can build on an earlier one",
        "Only if you repeat the WITH keyword each time"
      ],
      correctChoiceIndex: 1,
      explanation: "CTEs in the same WITH block are defined in order, so later ones can read earlier ones."
    },
    {
      id: "quiz-sql-ctes-q3",
      prompt: "After `WITH totals AS (...)`, how does the main statement use it?",
      choices: [
        "Reference totals as a table in FROM",
        "Copy totals into a new file first",
        "Call totals() like a function"
      ],
      correctChoiceIndex: 0,
      explanation: "The CTE behaves like a temporary table that the main statement selects from by name."
    }
  ] as QuizQuestion[]).map(shuffleQuizChoices)
} satisfies Quiz;

// ---------------------------------------------------------------------------
// Lesson 4: window functions
// ---------------------------------------------------------------------------

const windowPracticeReps: LessonPracticeBlock[] = [
  {
    tier: "replicate",
    starterCode: "SELECT topic, minutes,\n       SUM(minutes) OVER (PARTITION BY topic) AS topic_total\nFROM study_sessions\nORDER BY topic, minutes;",
    expectedOutput: "Every session row survives, and each row shows its topic's total on the side.",
    checkYourAnswer: "Unlike GROUP BY, a window function keeps all rows. If rows disappeared, you accidentally used grouping."
  },
  {
    tier: "diagnose",
    starterCode: "SELECT learner, topic, minutes,\n       RANK() OVER (ORDER BY minutes) AS session_rank\nFROM study_sessions;",
    expectedOutput: "The rank is computed across every learner, so the same learner's sessions are not compared to each other.",
    checkYourAnswer: "Missing PARTITION BY mixes all rows into one ranking. Add PARTITION BY learner when each learner needs their own order."
  },
  {
    tier: "synthesize",
    starterCode: "SELECT learner, day, minutes,\n       SUM(minutes) OVER (PARTITION BY learner ORDER BY day) AS running_total,\n       RANK() OVER (PARTITION BY learner ORDER BY minutes DESC) AS session_rank\nFROM study_sessions\nORDER BY learner, day;",
    expectedOutput: "Each session keeps its row, shows the learner's running total so far, and its rank by length.",
    checkYourAnswer: "This combines a running total and a rank in one pass. Both windows partition by learner but sort differently, which is the whole point."
  }
];

const windowQuiz = {
  id: "quiz-sql-window-functions",
  lessonId: "lesson-sql-window-functions",
  title: "Window functions without collapsing rows",
  passingScore: 80,
  questions: ([
    {
      id: "quiz-sql-window-functions-q1",
      prompt: "How does a window function differ from GROUP BY?",
      choices: [
        "It removes duplicate rows",
        "It keeps every row and adds a calculated column",
        "It can only count rows"
      ],
      correctChoiceIndex: 1,
      explanation: "A window function computes across related rows while leaving each original row in the result."
    },
    {
      id: "quiz-sql-window-functions-q2",
      prompt: "What does PARTITION BY do inside OVER (...)?",
      choices: [
        "Splits the rows into groups that are ranked independently",
        "Deletes rows outside the chosen partition",
        "Sorts only the final printed output"
      ],
      correctChoiceIndex: 0,
      explanation: "PARTITION BY restarts the window calculation for each group, like a fresh tally per learner or topic."
    },
    {
      id: "quiz-sql-window-functions-q3",
      prompt: "To compute a running total within each learner, the OVER clause needs...",
      choices: [
        "A GROUP BY and a HAVING clause",
        "An ORDER BY on the column that defines the sequence",
        "A primary key on every selected column"
      ],
      correctChoiceIndex: 1,
      explanation: "A running total accumulates in a defined order, so the window needs ORDER BY to know which row comes next."
    }
  ] as QuizQuestion[]).map(shuffleQuizChoices)
} satisfies Quiz;

// ---------------------------------------------------------------------------
// Lesson 5: join fan-out and COUNT(DISTINCT)
// ---------------------------------------------------------------------------

const joinFanoutPracticeReps: LessonPracticeBlock[] = [
  {
    tier: "replicate",
    starterCode: "SELECT learners.name, COUNT(enrollments.id) AS enrollment_count\nFROM learners\nJOIN enrollments ON enrollments.learner_id = learners.id\nGROUP BY learners.id, learners.name\nORDER BY learners.name;",
    expectedOutput: "Each learner appears once with the number of enrollment rows, and no submissions are joined yet.",
    checkYourAnswer: "Counting a row id from the many-side gives the number of enrollment rows. That is correct until a second many-side table multiplies them."
  },
  {
    tier: "diagnose",
    starterCode: "SELECT learners.name, SUM(submissions.score) AS score_total\nFROM learners\nJOIN enrollments ON enrollments.learner_id = learners.id\nJOIN submissions ON submissions.enrollment_id = enrollments.id\nGROUP BY learners.id, learners.name;",
    expectedOutput: "The total is inflated because enrollment rows are repeated once per submission.",
    checkYourAnswer: "After joining two one-to-many tables, each enrollment appears as many times as it has submissions. Summing a column from the other side double-counts."
  },
  {
    tier: "synthesize",
    starterCode: "SELECT learners.name,\n       COUNT(DISTINCT enrollments.course) AS course_count,\n       COUNT(DISTINCT submissions.id) AS submission_count\nFROM learners\nJOIN enrollments ON enrollments.learner_id = learners.id\nLEFT JOIN submissions ON submissions.enrollment_id = enrollments.id\nGROUP BY learners.id, learners.name\nORDER BY learners.name;",
    expectedOutput: "Two distinct counts live side by side without either one inflating the other.",
    checkYourAnswer: "COUNT(DISTINCT ...) makes the fan-out harmless: each distinct course and submission is counted once even though the join multiplied the rows."
  }
];

const joinFanoutQuiz = {
  id: "quiz-sql-join-fanout",
  lessonId: "lesson-sql-join-fanout",
  title: "Joins that multiply rows",
  passingScore: 80,
  questions: ([
    {
      id: "quiz-sql-join-fanout-q1",
      prompt: "Why can a join make COUNT(*) too high?",
      choices: [
        "Joining two one-to-many tables multiplies matching rows",
        "COUNT ignores joined tables",
        "SQLite adds one to every inline count"
      ],
      correctChoiceIndex: 0,
      explanation: "Each parent row is repeated once for every matching child across the joined relationships, so plain row counts inflate."
    },
    {
      id: "quiz-sql-join-fanout-q2",
      prompt: "What does COUNT(DISTINCT enrollments.course) count?",
      choices: [
        "Every joined row",
        "Each different course value once per group",
        "Only rows where the course is NULL"
      ],
      correctChoiceIndex: 1,
      explanation: "DISTINCT collapses duplicates first, so the count reflects distinct courses rather than multiplied rows."
    },
    {
      id: "quiz-sql-join-fanout-q3",
      prompt: "You join learners to enrollments and to submissions. The safe way to count courses per learner is...",
      choices: [
        "COUNT(*)",
        "COUNT(DISTINCT enrollments.course)",
        "SUM(submissions.score)"
      ],
      correctChoiceIndex: 1,
      explanation: "Counting distinct courses keeps the number stable no matter how many submissions each enrollment has."
    }
  ] as QuizQuestion[]).map(shuffleQuizChoices)
} satisfies Quiz;

// ---------------------------------------------------------------------------
// Lesson 6: normalization (one fact in one place)
// ---------------------------------------------------------------------------

const normalizationPracticeReps: LessonPracticeBlock[] = [
  {
    tier: "replicate",
    starterCode: "SELECT course_name, COUNT(DISTINCT teacher) AS teacher_count\nFROM enrollments_bad\nGROUP BY course_name\nORDER BY course_name;",
    expectedOutput: "Each course name shows how many different teachers are attached to it.",
    checkYourAnswer: "A course should have one teacher. A count above one is the smell that the same fact was stored more than once by hand."
  },
  {
    tier: "diagnose",
    starterCode: "SELECT 'inconsistent_courses' AS check_name, COUNT(*) AS total\nFROM (\n  SELECT course_name\n  FROM enrollments_bad\n  GROUP BY course_name\n  HAVING COUNT(DISTINCT teacher) > 1\n);",
    expectedOutput: "Only course names written down with two different teachers are counted.",
    checkYourAnswer: "Without HAVING, this counts every course. The group filter is what isolates duplicated facts from healthy ones."
  },
  {
    tier: "synthesize",
    starterCode: "SELECT course_name, MIN(teacher) AS kept_teacher, MAX(teacher) AS conflicting_teacher\nFROM enrollments_bad\nGROUP BY course_name\nHAVING COUNT(DISTINCT teacher) > 1\nORDER BY course_name;",
    expectedOutput: "Each inconsistent course lists the two spellings a reviewer would have to reconcile.",
    checkYourAnswer: "This surfaces the exact conflicting values so a human can fix them. The permanent fix is a courses table with one teacher per key."
  }
];

const normalizationQuiz = {
  id: "quiz-sql-normalization",
  lessonId: "lesson-sql-normalization",
  title: "One fact in one place",
  passingScore: 80,
  questions: ([
    {
      id: "quiz-sql-normalization-q1",
      prompt: "What does 'one fact in one place' mean for a schema?",
      choices: [
        "Store every value on every row",
        "Store each fact once and reference it by a key",
        "Never use more than one table"
      ],
      correctChoiceIndex: 1,
      explanation: "Normalization keeps a single authoritative copy of each fact and links to it, so updates stay consistent."
    },
    {
      id: "quiz-sql-normalization-q2",
      prompt: "Why is storing a teacher name on every enrollment row risky?",
      choices: [
        "Text is always slower than numbers",
        "Updating one copy can leave other rows inconsistent",
        "Foreign keys cannot reference text"
      ],
      correctChoiceIndex: 1,
      explanation: "Duplicated facts drift. A typo in one copy creates two versions of the truth that reports then disagree about."
    },
    {
      id: "quiz-sql-normalization-q3",
      prompt: "A reference key (foreign key) lets a row...",
      choices: [
        "Point at the one authoritative row it depends on",
        "Duplicate the parent row automatically",
        "Skip validation entirely"
      ],
      correctChoiceIndex: 0,
      explanation: "The key stores a link to the single real row instead of copying its values, which keeps the fact in one place."
    }
  ] as QuizQuestion[]).map(shuffleQuizChoices)
} satisfies Quiz;

// ---------------------------------------------------------------------------
// Lessons
// ---------------------------------------------------------------------------

const STUDY_SESSIONS_SETUP = [
  "CREATE TABLE study_sessions (id INTEGER PRIMARY KEY, learner TEXT, topic TEXT, minutes INTEGER);",
  "INSERT INTO study_sessions (learner, topic, minutes) VALUES ('ada', 'sql', 45);",
  "INSERT INTO study_sessions (learner, topic, minutes) VALUES ('ada', 'sql', 30);",
  "INSERT INTO study_sessions (learner, topic, minutes) VALUES ('ada', 'python', 20);",
  "INSERT INTO study_sessions (learner, topic, minutes) VALUES ('grace', 'sql', 15);",
  "INSERT INTO study_sessions (learner, topic, minutes) VALUES ('grace', 'git', 60);",
  "INSERT INTO study_sessions (learner, topic, minutes) VALUES ('linus', 'git', 25);"
].join("\n");

export const sqlLessons: Lesson[] = [
    {
      id: "lesson-sql-joins",
      curriculum: {
        level: 0,
        sequence: 1,
        version: "1.0.0",
        lessonKind: "run_file",
        teaches: ["sql.join", "sql.join.direction"],
        requires: [],
        visibleCodeConcepts: ["sql.join", "sql.join.direction"],
        quizConcepts: ["sql.join", "sql.join.direction"],
        usesButDoesNotTeach: [],
        proofOutputs: ["terminal_stdout"]
      },
      moduleId: "module-sql-core",
      slug: "sql-joins",
      title: "Joins That Answer Product Questions",
      summary: "Use joins to connect evidence to missions and skills.",
      bodyMarkdown: "Normalized tables become useful when joins answer a real question. Ask which missions have evidence, which skills they prove, and what remains stale.",
      estimatedMinutes: 9,
      difficulty: "applied",
      skillIds: ["skill-sql-joins"],
      quizId: "quiz-sql-joins",
      desktopTask: "Sketch a SQL query that lists missions with zero evidence items.",
      evidencePrompt: "Keep the query, expected rows, and a short note about why the join direction matters.",
      workshop: workshop(
        "Use joins to answer one product question from normalized tables.",
        "Career-readiness apps need queries that find missing proof, stale work, and skill gaps.",
        "The table you start from changes what missing data you can see. LEFT JOIN from missions can reveal missions with no evidence.",
        "SELECT m.title FROM missions m LEFT JOIN evidence e ON e.mission_id = m.id WHERE e.id IS NULL;",
        "Write one query that finds project missions with no check-backed evidence.",
        "This prepares the Portfolio Evidence Ledger and Job Tracker Schema missions.",
        "Why would an INNER JOIN hide the exact gap you need to see?",
        ["Starting from evidence when you need missing missions", "Forgetting null checks", "Writing queries with no sample rows"],
        undefined,
        {
          language: "SQL",
          tools: ["SQLite or Postgres", "sample tables", "query runner"],
          synopsis: "You are learning how joins connect separate tables so you can answer a product question, especially which records are missing proof.",
          prerequisites: ["Know that tables store rows and columns.", "Have two sample tables in mind, such as missions and evidence."],
          testingFocus: "You will test the query against sample rows where one mission has evidence and one mission has none."
      },
        {
          starterCode: "SELECT m.title\nFROM missions m\nLEFT JOIN evidence e ON e.mission_id = m.id\nWHERE e.id IS NULL;",
          expectedOutput: "Only missions with no matching evidence rows should appear.",
          checkYourAnswer: "If missions with evidence still appear, your join condition is wrong. If missing missions disappear, you probably used INNER JOIN."
      },
        {
          title: "Find missions with missing proof",
          goal: "Create sample SQL tables and write a query that reveals which missions have no evidence.",
          steps: ["Create or sketch missions and evidence rows", "Include one mission with evidence and one without", "Run a LEFT JOIN query that returns only the missing-proof mission"],
          deliverables: ["Sample rows", "SQL query", "Expected result rows"],
          verifierCommand: "Run the query in SQLite or Postgres.",
          expectedEvidence: "Query text and output showing only the mission with no evidence.",
          projectConnection: "This is the gap-finding query for the Portfolio Evidence Ledger mission.",
          tester: {
            codeLabel: "Paste your SQL query",
            outputLabel: "Paste query result rows",
            requiredCodeIncludes: ["LEFT JOIN", "WHERE", "IS NULL"],
          requiredOutputIncludes: ["no evidence"],
          successMessage: "Your SQL proof uses a left join to reveal missing evidence.",
          failureMessage: "The tester needs a LEFT JOIN / IS NULL query and output naming the missing-evidence mission."
          },
          runnerSpec: {
            language: "sql",
            setupCode: "CREATE TABLE missions (id TEXT, title TEXT);\nCREATE TABLE evidence (id TEXT, mission_id TEXT);\nINSERT INTO missions VALUES ('m1', 'has evidence'), ('m2', 'no evidence');\nINSERT INTO evidence VALUES ('e1', 'm1');",
            starterCode: "SELECT m.title\nFROM missions m\nLEFT JOIN evidence e ON e.mission_id = m.id\nWHERE e.id IS NULL;",
            visibleTests: [
              {
                id: "returns-missing-evidence",
                name: "Returns only missions with no evidence",
                code: "EXPECT_ROWS:no evidence",
                expectedOutputIncludes: ["no evidence"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["no evidence"]
          }
        }
        ,
        sqlJoinPracticeReps
      )
    },
    {
      id: "lesson-sql-constraints",
      curriculum: {
        level: 1,
        sequence: 1,
        version: "1.0.0",
        lessonKind: "run_file",
        teaches: ["sql.schema.constraints"],
        requires: ["sql.join"],
        visibleCodeConcepts: ["sql.schema.constraints"],
        quizConcepts: ["sql.schema.constraints"],
        usesButDoesNotTeach: [],
        proofOutputs: ["terminal_stdout"]
      },
      moduleId: "module-sql-core",
      slug: "sql-constraints",
      title: "Constraints Protect App Data",
      summary: "Use primary keys, foreign keys, and checks so bad rows fail before reports lie.",
      bodyMarkdown: "Queries are only as trustworthy as the rows underneath them. Constraints make impossible states hard to store, which is simpler than repairing every report later.",
      estimatedMinutes: 11,
      difficulty: "applied",
      skillIds: ["skill-sql-joins", "skill-api-contracts"],
      quizId: "quiz-sql-constraints",
      desktopTask: "Sketch tables for evidence items with a foreign key and one status check.",
      evidencePrompt: "Keep the table definitions, one rejected bad row, and one successful join query.",
      workshop: workshop(
        "Add constraints that keep evidence data consistent before queries run.",
        "Backend and full-stack projects need database rules that reject impossible rows, not just UI code that hopes users behave.",
        "A primary key identifies each row. A foreign key points to a real parent row. A CHECK constraint limits a value to allowed states such as draft, verified, or stale.",
        "CHECK (status IN ('draft', 'verified', 'stale')) prevents a typo like verifed from entering the evidence table.",
        "Create a missions table and an evidence table that rejects evidence for missing missions and invalid statuses.",
        "This deepens the Portfolio Evidence Ledger and Job Tracker Schema missions.",
        "Which bad row should the database reject before a product query ever sees it?",
        ["Storing status as any text", "Skipping foreign keys and trusting app code only", "Testing only successful inserts"],
        undefined,
        {
          language: "SQL and Postgres concepts",
          tools: ["SQLite or Postgres", "schema sketch", "query runner"],
          synopsis: "You are learning how database constraints protect app state so reports about evidence and readiness are based on valid rows.",
          prerequisites: ["Know that tables can reference other tables.", "Understand that app data can become misleading when invalid rows are allowed."],
          testingFocus: "You will test the schema by inserting one valid row and showing one invalid status or missing parent row is rejected."
      },
        {
          starterCode: "CREATE TABLE missions (id TEXT PRIMARY KEY, title TEXT NOT NULL);\nCREATE TABLE evidence (\n  id TEXT PRIMARY KEY,\n  mission_id TEXT NOT NULL REFERENCES missions(id),\n  status TEXT NOT NULL CHECK (status IN ('draft', 'verified', 'stale'))\n);",
          expectedOutput: "A valid evidence row can join back to its mission, while an invalid status such as verifed is rejected.",
          checkYourAnswer: "If every status inserts successfully, the constraint is not protecting the table. If evidence can point to no mission, the relationship is only implied."
      },
        {
          title: "Constrain an evidence table",
          goal: "Create a small evidence schema that accepts valid rows and rejects invalid status values.",
          steps: ["Define mission and evidence tables", "Insert one valid mission and evidence row", "Attempt one invalid status and record the rejection"],
          deliverables: ["Schema SQL", "Valid join output", "Rejected-row evidence"],
          verifierCommand: "Run the schema and insert checks in SQLite or Postgres.",
          expectedEvidence: "Schema text, valid join output, and a rejected invalid-status row showing the database protected the data.",
          projectConnection: "This is the data-integrity slice for the Portfolio Evidence Ledger mission.",
          tester: {
            codeLabel: "Paste your SQL schema",
            outputLabel: "Paste valid join output and rejected-row note",
            requiredCodeIncludes: ["PRIMARY KEY", "REFERENCES", "CHECK"],
            requiredOutputIncludes: ["verified", "rejected"],
            successMessage: "Your SQL proof shows constraints protecting evidence rows.",
            failureMessage: "The tester needs constraint SQL plus output showing a valid row and a rejected bad row."
          },
          runnerSpec: {
            language: "sql",
            setupCode: "CREATE TABLE missions (id TEXT PRIMARY KEY, title TEXT NOT NULL);\nCREATE TABLE evidence (id TEXT PRIMARY KEY, mission_id TEXT NOT NULL REFERENCES missions(id), status TEXT NOT NULL CHECK (status IN ('draft', 'verified', 'stale')));\nINSERT INTO missions VALUES ('m1', 'Typed Progress Board');\nINSERT INTO evidence VALUES ('e1', 'm1', 'verified');",
            starterCode: "SELECT m.title, e.status\nFROM missions m\nJOIN evidence e ON e.mission_id = m.id;",
            visibleTests: [
              {
                id: "valid-evidence-joins",
                name: "Valid evidence joins to mission",
                code: "EXPECT_ROWS:Typed Progress Board|verified",
                expectedOutputIncludes: ["Typed Progress Board", "verified"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["Typed Progress Board", "verified"]
          }
        }
      )
    },

  proofLesson({
    id: "lesson-sql-aggregates",
    moduleId: "module-sql-querying",
    slug: "sql-aggregates",
    title: "Count Groups, Then Filter Them",
    summary: "Use GROUP BY for per-group totals and HAVING for filters on those totals.",
    bodyMarkdown: "GROUP BY collapses many rows into one row per group. A beginner mistake is to reach for WHERE when the condition mentions an aggregate: `WHERE SUM(minutes) > 40` fails because WHERE runs before groups exist. HAVING is the clause that filters the finished groups.",
    estimatedMinutes: 10,
    difficulty: "foundation",
    skillIds: ["skill-sql-joins"],
    quizId: "quiz-sql-aggregates",
    desktopTask: "Write a grouped query that reports per-topic study totals and keeps only the topics above a threshold.",
    evidencePrompt: "Keep the grouped query, its output rows, and a note explaining why the filter moved from WHERE to HAVING.",
    language: SQL_LANGUAGE,
    tools: SQL_TOOLS,
    synopsis: "You are learning how GROUP BY builds one row per group and why a filter on an aggregate total belongs in HAVING, not WHERE.",
    prerequisites: ["Know that a SELECT can sum or count values.", "Have seen a table with one row per event."],
    testingFocus: "You will test the grouped query against seeded sessions where only some groups pass the threshold.",
    objective: "Group study sessions and keep only the groups whose total crosses a threshold.",
    whyItMatters: "Dashboards and reports answer questions about groups: which topics are popular, which learners are falling behind. Filtering the wrong clause silently breaks those answers.",
    coreConcept: "WHERE filters rows before grouping; HAVING filters groups after aggregation.",
    workedExample: "`GROUP BY learner, topic` gives one row per learner-topic pair. Adding `HAVING SUM(minutes) >= 40` keeps only pairs whose combined minutes reach forty.",
    guidedExercise: "Group the sessions by learner and topic, sum the minutes, then keep only groups at or above forty minutes.",
    missionConnection: "This is the reporting layer behind the Portfolio Evidence Ledger mission.",
    reflectionPrompt: "Why would moving a group filter into WHERE change the answer instead of just raising an error?",
    practiceStarter: "SELECT learner, topic, SUM(minutes) AS total\nFROM study_sessions\nGROUP BY learner, topic;",
    practiceExpected: "One row per learner-topic pair with the summed minutes for that pair.",
    practiceCheck: "If you see an error about aggregate use, the condition is in WHERE. Move any test on SUM or COUNT into HAVING after the GROUP BY.",
    practiceReps: aggregatePracticeReps,
    miniTitle: "Report per-group study totals",
    miniGoal: "Create a grouped report that keeps only groups above a threshold.",
    miniSteps: ["Group sessions by learner and topic", "Sum the minutes per group", "Keep only groups at or above forty minutes"],
    miniDeliverables: ["Grouped SQL query", "Output rows", "Note on WHERE versus HAVING"],
    verifierCommand: "Run the grouped query in the SQLite check.",
    expectedEvidence: "The grouped query plus output rows showing only the groups that passed the HAVING threshold.",
    projectConnection: "This is the aggregate reporting slice of the Portfolio Evidence Ledger mission.",
    requiredCodeIncludes: ["GROUP BY", "HAVING", "COUNT"],
    requiredOutputIncludes: ["ada | sql | 75", "grace | git | 60"],
    runnerLanguage: "sql",
    runnerSetupCode: STUDY_SESSIONS_SETUP,
    runnerStarterCode: "SELECT learner, topic, SUM(minutes) AS total\nFROM study_sessions\nWHERE SUM(minutes) >= 40\nGROUP BY learner, topic;",
    runnerTestCode: "EXPECT_ROWS:ada | sql | 75",
    runnerExpectedExactLines: ["ada | sql | 75", "grace | git | 60"],
    runnerExpectedExactSet: true,
    hiddenTests: [
      {
        id: "sql-aggregates-hidden",
        name: "Hidden check adds a session that pushes a group over the threshold",
        code: "INSERT INTO study_sessions (learner, topic, minutes) VALUES ('ada', 'python', 25);",
        expectedOutputExactLines: ["ada | sql | 75", "grace | git | 60", "ada | python | 45"],
        expectedOutputExactSet: true
      }
    ],
    curriculum: sqlCurriculum({
      level: 1,
      sequence: 1,
      teaches: ["sql.aggregate.group_by", "sql.aggregate.having"]
    }),
    commonMistakes: [
      "Filtering an aggregate total in WHERE instead of HAVING",
      "Grouping by too few columns so rows merge unexpectedly",
      "Assuming every group has a matching row after an inner join"
    ],
    customRepairs: {
      "Filtering an aggregate total in WHERE instead of HAVING": "WHERE runs before grouping, so SUM and COUNT are not available there. Put any condition that mentions an aggregate in HAVING, after the GROUP BY.",
      "Grouping by too few columns so rows merge unexpectedly": "List every column you want preserved per group in GROUP BY. If two different learners share a topic, grouping by topic alone merges their minutes."
    }
  }),

  proofLesson({
    id: "lesson-sql-subqueries",
    moduleId: "module-sql-querying",
    slug: "sql-subqueries",
    title: "Filter by a Derived Value",
    summary: "Use subqueries to filter rows against a value the query computes first.",
    bodyMarkdown: "A subquery is a query inside a query. It lets you filter against something you do not know in advance, such as the average session length. The trap is using `=` when the subquery can return many rows: a scalar context silently keeps one value, so the query passes on small data and quietly drops matches later. Use IN when the subquery returns a set.",
    estimatedMinutes: 11,
    difficulty: "applied",
    skillIds: ["skill-sql-joins"],
    quizId: "quiz-sql-subqueries",
    desktopTask: "Write a query that finds sessions longer than the average, then one that uses IN to filter by a derived set.",
    evidencePrompt: "Keep both subqueries and a note explaining when a scalar subquery is safe and when IN is required.",
    language: SQL_LANGUAGE,
    tools: SQL_TOOLS,
    synopsis: "You are learning to filter rows against a value another query computes, and how to tell a one-value subquery apart from a set of values.",
    prerequisites: ["Know how WHERE filters rows.", "Have seen an aggregate such as AVG or MAX."],
    testingFocus: "You will test the subquery against seeded data where a multi-row result behaves differently from a scalar one.",
    objective: "Filter sessions against a derived value and choose the right comparison operator.",
    whyItMatters: "Feature requests often mean 'compared to the average' or 'belongs to this set'. Choosing the wrong operator produces a query that works on tiny data and misreports at scale.",
    coreConcept: "A scalar subquery returns exactly one value and pairs with =, >, or <. A multi-row subquery returns a set and pairs with IN.",
    workedExample: "`WHERE minutes > (SELECT AVG(minutes) FROM study_sessions)` compares each row to the overall average, while `WHERE topic IN (SELECT topic FROM ... WHERE minutes > 40)` keeps rows whose topic appears in a derived set.",
    guidedExercise: "Find every topic that has at least one session longer than forty minutes by filtering with IN over a subquery.",
    missionConnection: "This is the derived-filter technique for the Job Tracker Schema mission.",
    reflectionPrompt: "What would a reviewer notice on production-sized data if you used = with a set-returning subquery?",
    practiceStarter: "SELECT DISTINCT topic\nFROM study_sessions\nWHERE topic IN (SELECT topic FROM study_sessions WHERE minutes > 40);",
    practiceExpected: "Every topic that has at least one session longer than forty minutes.",
    practiceCheck: "Ask how many rows the subquery can return. If it can return more than one, use IN; if the query must return exactly one value, keep = and prove the subquery is unique.",
    practiceReps: subqueryPracticeReps,
    miniTitle: "Filter against a derived value",
    miniGoal: "Write a subquery-driven filter and justify the comparison operator you chose.",
    miniSteps: ["Decide whether the inner query returns a value or a set", "Write the inner query so it returns the right shape", "Compare with = or IN and run the check"],
    miniDeliverables: ["Outer query", "Inner subquery", "Operator justification"],
    verifierCommand: "Run the subquery filter in the SQLite check.",
    expectedEvidence: "Both halves of the query plus output rows showing every qualifying record without silent drops.",
    projectConnection: "This feeds the derived-selection queries in the Job Tracker Schema mission.",
    requiredCodeIncludes: ["SELECT", "WHERE", "IN"],
    requiredOutputIncludes: ["git", "sql"],
    runnerLanguage: "sql",
    runnerSetupCode: STUDY_SESSIONS_SETUP,
    runnerStarterCode: "SELECT DISTINCT topic\nFROM study_sessions\nWHERE topic = (SELECT topic FROM study_sessions WHERE minutes > 40);",
    runnerTestCode: "EXPECT_ROWS:git",
    runnerExpectedExactLines: ["git", "sql"],
    runnerExpectedExactSet: true,
    hiddenTests: [
      {
        id: "sql-subqueries-hidden",
        name: "Hidden check adds a longer session that widens the derived set",
        code: "INSERT INTO study_sessions (learner, topic, minutes) VALUES ('linus', 'python', 55);",
        expectedOutputExactLines: ["git", "python", "sql"],
        expectedOutputExactSet: true
      }
    ],
    curriculum: sqlCurriculum({
      level: 2,
      sequence: 2,
      teaches: ["sql.subquery.scalar", "sql.subquery.in"],
      requires: ["sql.aggregate.group_by"]
    }),
    commonMistakes: [
      "Using = with a subquery that can return more than one row",
      "Comparing a column to a subquery that returns the wrong number of columns",
      "Duplicating a heavy aggregate in every row instead of computing it once"
    ],
    customRepairs: {
      "Using = with a subquery that can return more than one row": "Replace = with IN when the inner query can return a set. If you truly need one value, make the inner query return exactly one row and column.",
      "Comparing a column to a subquery that returns the wrong number of columns": "A scalar comparison needs the subquery to select exactly one column. Return the single value you want to compare against, not SELECT *."
    }
  }),

  proofLesson({
    id: "lesson-sql-ctes",
    moduleId: "module-sql-querying",
    slug: "sql-ctes",
    title: "Name Each Step with WITH",
    summary: "Use common table expressions to turn a nested query into readable steps.",
    bodyMarkdown: "A WITH clause names an intermediate result so a long query reads like a recipe. Each named step is a normal query, and later steps can read earlier ones. The mistake is treating a CTE like a stored table: it exists only for the statement that defines it, and the outer query has to reference it by name. Unreadable nested subqueries hide bugs; named steps make each stage checkable.",
    estimatedMinutes: 11,
    difficulty: "applied",
    skillIds: ["skill-sql-joins"],
    quizId: "quiz-sql-ctes",
    desktopTask: "Rewrite a nested subquery as two named CTE steps and check the final count.",
    evidencePrompt: "Keep the WITH query, the final result, and a note on which step was easiest to verify in isolation.",
    language: SQL_LANGUAGE,
    tools: SQL_TOOLS,
    synopsis: "You are learning to break a multi-step query into named common table expressions so each stage can be read and checked on its own.",
    prerequisites: ["Know how a subquery returns an intermediate result.", "Have seen GROUP BY produce per-group totals."],
    testingFocus: "You will test a two-step WITH query and confirm the final aggregate matches the named steps.",
    objective: "Rewrite a multi-step query as readable WITH steps and use a named step in the final statement.",
    whyItMatters: "Reviewers and future-you can only trust a query they can read. Named steps turn a wall of nesting into a sequence of checkable claims.",
    coreConcept: "A CTE is a named temporary result. Define it with WITH name AS (...), then reference name like a table in the statement that follows.",
    workedExample: "`WITH totals AS (SELECT learner, SUM(minutes) AS total FROM study_sessions GROUP BY learner)` names per-learner totals, and the outer query can then count how many learners reached the goal.",
    guidedExercise: "Name the per-learner totals in a CTE, then count how many learners reached at least seventy minutes.",
    missionConnection: "This is the readable-query habit behind the Portfolio Evidence Ledger mission.",
    reflectionPrompt: "Which single named step would you keep if a teammate asked you to explain the query in one sentence?",
    practiceStarter: "WITH totals AS (\n  SELECT learner, SUM(minutes) AS total\n  FROM study_sessions\n  GROUP BY learner\n)\nSELECT learner, total\nFROM totals\nORDER BY total DESC;",
    practiceExpected: "One row per learner with their total minutes, largest first.",
    practiceCheck: "If the outer query cannot find total, check that the CTE selected it and that the FROM references the CTE name rather than the base table.",
    practiceReps: ctePracticeReps,
    miniTitle: "Rewrite a nested query with WITH",
    miniGoal: "Split a multi-step question into named CTE stages and verify the final count.",
    miniSteps: ["Name the first intermediate result in a CTE", "Use that name in the next step or the final query", "Run the check and confirm the final value"],
    miniDeliverables: ["WITH query", "Final result", "Step-by-step reading note"],
    verifierCommand: "Run the WITH query in the SQLite check.",
    expectedEvidence: "The multi-step query plus output showing the named steps produce the final aggregate.",
    projectConnection: "This is the readable reporting style used across the Portfolio Evidence Ledger mission.",
    requiredCodeIncludes: ["WITH", "GROUP BY", "COUNT"],
    requiredOutputIncludes: ["at_goal | 2"],
    runnerLanguage: "sql",
    runnerSetupCode: STUDY_SESSIONS_SETUP,
    runnerStarterCode: "WITH totals AS (\n  SELECT learner, SUM(minutes) AS total\n  FROM study_sessions\n  GROUP BY learner\n)\nSELECT 'at_goal' AS bucket, COUNT(*) AS learners\nFROM totals;",
    runnerTestCode: "EXPECT_ROWS:at_goal | 2",
    runnerExpectedExactLines: ["at_goal | 2"],
    hiddenTests: [
      {
        id: "sql-ctes-hidden",
        name: "Hidden check adds a learner who reaches the goal",
        code: "INSERT INTO study_sessions (learner, topic, minutes) VALUES ('nina', 'sql', 80);",
        expectedOutputIncludes: ["at_goal | 3"]
      }
    ],
    curriculum: sqlCurriculum({
      level: 2,
      sequence: 3,
      teaches: ["sql.cte.with", "sql.cte.chained"],
      requires: ["sql.aggregate.group_by", "sql.aggregate.having"]
    }),
    commonMistakes: [
      "Reading the base table instead of the named CTE in the outer query",
      "Expecting a CTE to persist after the statement finishes",
      "Repeating the same nested subquery instead of naming it once"
    ],
    customRepairs: {
      "Reading the base table instead of the named CTE in the outer query": "A CTE is only visible by name. Point the outer FROM at the CTE so its derived columns, such as total, actually exist.",
      "Expecting a CTE to persist after the statement finishes": "A CTE lives only for the statement that defines it. If later statements need the result, make it a real table or run the WITH again."
    }
  }),

  proofLesson({
    id: "lesson-sql-window-functions",
    moduleId: "module-sql-querying",
    slug: "sql-window-functions",
    title: "Rank and Total Without Losing Rows",
    summary: "Use window functions to add per-group calculations while keeping every row.",
    bodyMarkdown: "GROUP BY collapses rows: after grouping, the individual sessions are gone. Sometimes you want the opposite, a per-row answer such as 'this is session three' or 'this is the running total so far'. A window function computes across related rows but keeps every row. OVER (PARTITION BY ... ORDER BY ...) defines the group and the order the calculation follows.",
    estimatedMinutes: 12,
    difficulty: "applied",
    skillIds: ["skill-sql-joins"],
    quizId: "quiz-sql-window-functions",
    desktopTask: "Write a query that keeps every session row and adds a per-learner running total and rank.",
    evidencePrompt: "Keep the window query, its output rows, and a note contrasting it with the GROUP BY version.",
    language: SQL_LANGUAGE,
    tools: SQL_TOOLS,
    synopsis: "You are learning how a window function adds a calculation to every row, instead of collapsing rows the way GROUP BY does.",
    prerequisites: ["Know that GROUP BY reduces many rows to one per group.", "Have seen an ORDER BY that controls output order."],
    testingFocus: "You will test a window query and confirm every original row survives with the expected running total.",
    objective: "Add a running total and a rank to every row without collapsing the rows.",
    whyItMatters: "Progress screens and leaderboards need a value attached to each row, not a single summary. Window functions are how SQL answers those questions in one clean pass.",
    coreConcept: "A window function sees the other rows in its partition but does not remove any row. PARTITION BY defines the related rows; ORDER BY defines the sequence.",
    workedExample: "`SUM(minutes) OVER (PARTITION BY learner ORDER BY day)` adds a running total per learner while leaving every session row in the output.",
    guidedExercise: "Add a per-learner running total ordered by day, then check that each row shows the accumulation up to that day.",
    missionConnection: "This is the progress-tracking calculation behind the Job Tracker Schema mission.",
    reflectionPrompt: "Why would GROUP BY be the wrong tool if you still need to show each individual session?",
    practiceStarter: "SELECT learner, topic, minutes,\n       SUM(minutes) OVER (PARTITION BY learner) AS learner_total\nFROM study_sessions\nORDER BY learner, minutes DESC;",
    practiceExpected: "Every session row appears, and each row shows its learner's overall total on the side.",
    practiceCheck: "If rows disappear, you used GROUP BY by accident. A window function must keep the same number of rows the FROM clause produced.",
    practiceReps: windowPracticeReps,
    miniTitle: "Keep every row and add a running total",
    miniGoal: "Write a window query that keeps all sessions and adds per-learner calculations.",
    miniSteps: ["Select the session rows you want to keep", "Add an OVER clause partitioned by learner", "Order within the window and confirm every row survives"],
    miniDeliverables: ["Window query", "Output rows", "Contrast note against GROUP BY"],
    verifierCommand: "Run the window query in the SQLite check.",
    expectedEvidence: "The window query plus output showing one running total per row and no lost sessions.",
    projectConnection: "This powers the per-row progress calculations in the Job Tracker Schema mission.",
    requiredCodeIncludes: ["OVER", "PARTITION BY", "ORDER BY"],
    requiredOutputIncludes: ["ada | python | 20 | 95", "grace | git | 15 | 75"],
    runnerLanguage: "sql",
    runnerSetupCode:
      "CREATE TABLE study_sessions (id INTEGER PRIMARY KEY, learner TEXT, topic TEXT, minutes INTEGER, day INTEGER);\n" +
      "INSERT INTO study_sessions (learner, topic, minutes, day) VALUES ('ada', 'sql', 45, 1);\n" +
      "INSERT INTO study_sessions (learner, topic, minutes, day) VALUES ('ada', 'sql', 30, 2);\n" +
      "INSERT INTO study_sessions (learner, topic, minutes, day) VALUES ('ada', 'python', 20, 3);\n" +
      "INSERT INTO study_sessions (learner, topic, minutes, day) VALUES ('grace', 'git', 60, 1);\n" +
      "INSERT INTO study_sessions (learner, topic, minutes, day) VALUES ('grace', 'git', 15, 2);",
    runnerStarterCode:
      "SELECT learner, topic, SUM(minutes) AS running_total\nFROM study_sessions\nGROUP BY learner, topic\nORDER BY learner, topic;",
    runnerTestCode: "EXPECT_ROWS:ada | python | 20 | 95",
    runnerExpectedExactLines: [
      "ada | sql | 45 | 45",
      "ada | sql | 30 | 75",
      "ada | python | 20 | 95",
      "grace | git | 60 | 60",
      "grace | git | 15 | 75"
    ],
    hiddenTests: [
      {
        id: "sql-window-functions-hidden",
        name: "Hidden check adds a later session and extends the running total",
        code: "INSERT INTO study_sessions (learner, topic, minutes, day) VALUES ('ada', 'sql', 20, 4);",
        expectedOutputIncludes: ["ada | sql | 20 | 115"]
      }
    ],
    curriculum: sqlCurriculum({
      level: 3,
      sequence: 4,
      teaches: ["sql.window.rank", "sql.window.running_total"],
      requires: ["sql.aggregate.group_by"]
    }),
    commonMistakes: [
      "Using GROUP BY when every original row still needs to be shown",
      "Forgetting PARTITION BY so the window mixes all groups together",
      "Omitting ORDER BY when the calculation depends on row sequence"
    ],
    customRepairs: {
      "Using GROUP BY when every original row still needs to be shown": "GROUP BY removes rows. If the output must keep one row per session, use a window function with OVER instead of grouping.",
      "Forgetting PARTITION BY so the window mixes all groups together": "Without PARTITION BY the calculation runs over every row. Add PARTITION BY the column that defines the separate groups, such as learner."
    }
  }),

  proofLesson({
    id: "lesson-sql-join-fanout",
    moduleId: "module-sql-querying",
    slug: "sql-join-fanout",
    title: "A Join Can Multiply Rows",
    summary: "Recognize fan-out when joining two one-to-many tables and count distinct values instead.",
    bodyMarkdown: "A join repeats a parent row once for every matching child. Join one parent to two different child tables and the counts multiply: each enrollment is repeated once per submission. COUNT(*) then reports the size of the multiplied result, not the number of courses. COUNT(DISTINCT ...) counts each different value once and is immune to the multiplication.",
    estimatedMinutes: 12,
    difficulty: "applied",
    skillIds: ["skill-sql-joins", "skill-data-quality"],
    quizId: "quiz-sql-join-fanout",
    desktopTask: "Join learners to enrollments and submissions, then report distinct course counts without inflation.",
    evidencePrompt: "Keep the fan-out query, the distinct-count query, and the two different numbers they produce.",
    language: SQL_LANGUAGE,
    tools: SQL_TOOLS,
    synopsis: "You are learning why joining two one-to-many tables multiplies rows, and how COUNT(DISTINCT) keeps per-parent counts honest.",
    prerequisites: ["Know how a join matches rows on a key.", "Have seen COUNT and GROUP BY in a report."],
    testingFocus: "You will test a joined report and show the row-count version inflating while the distinct version stays correct.",
    objective: "Count distinct children per parent across a fan-out join.",
    whyItMatters: "Inflated counts produce wrong dashboards and wrong decisions. Fan-out is a quiet, common reporting bug that tests on tiny data rarely catch.",
    coreConcept: "Joining two one-to-many relationships multiplies rows. COUNT(DISTINCT child) counts each distinct child once, undoing the multiplication.",
    workedExample: "Learner Ada has two sql submissions and one python submission. `COUNT(*)` after joining enrollments and submissions reports three, but `COUNT(DISTINCT enrollments.course)` reports the true two courses.",
    guidedExercise: "Join learners to enrollments and submissions, then report distinct courses per learner without double counting.",
    missionConnection: "This is the correctness check for the Portfolio Evidence Ledger mission.",
    reflectionPrompt: "How would you detect fan-out in a dashboard number that looked plausible but was too high?",
    practiceStarter: "SELECT learners.name, COUNT(DISTINCT enrollments.course) AS course_count\nFROM learners\nJOIN enrollments ON enrollments.learner_id = learners.id\nGROUP BY learners.id, learners.name\nORDER BY learners.name;",
    practiceExpected: "Each learner appears once with the number of distinct courses, unaffected by how many submissions exist.",
    practiceCheck: "Compare COUNT(*) with COUNT(DISTINCT ...). If the plain count is larger than the number of real items, the join has multiplied rows.",
    practiceReps: joinFanoutPracticeReps,
    miniTitle: "Prove a joined count without fan-out",
    miniGoal: "Report distinct child counts across a fan-out join and explain the inflated alternative.",
    miniSteps: ["Join the parent to both child tables", "Count rows the naive way and note the inflation", "Switch to COUNT(DISTINCT ...) and confirm the correct number"],
    miniDeliverables: ["Fan-out query", "Distinct-count query", "Before-and-after numbers"],
    verifierCommand: "Run both counts in the SQLite check.",
    expectedEvidence: "The joined report plus output showing the distinct count is smaller and stable than the row count.",
    projectConnection: "This guards the evidence totals in the Portfolio Evidence Ledger mission.",
    requiredCodeIncludes: ["COUNT(DISTINCT", "JOIN", "GROUP BY"],
    requiredOutputIncludes: ["Ada | 2", "Grace | 1"],
    runnerLanguage: "sql",
    runnerSetupCode:
      "CREATE TABLE learners (id TEXT PRIMARY KEY, name TEXT);\n" +
      "CREATE TABLE enrollments (id TEXT PRIMARY KEY, learner_id TEXT, course TEXT);\n" +
      "CREATE TABLE submissions (id TEXT PRIMARY KEY, enrollment_id TEXT, score INTEGER);\n" +
      "INSERT INTO learners VALUES ('l1', 'Ada'), ('l2', 'Grace');\n" +
      "INSERT INTO enrollments VALUES ('e1', 'l1', 'sql'), ('e2', 'l1', 'python'), ('e3', 'l2', 'sql');\n" +
      "INSERT INTO submissions VALUES ('s1', 'e1', 90), ('s2', 'e1', 80), ('s3', 'e2', 70), ('s4', 'e3', 85);",
    runnerStarterCode:
      "SELECT learners.name, COUNT(*) AS course_count\nFROM learners\nJOIN enrollments ON enrollments.learner_id = learners.id\nJOIN submissions ON submissions.enrollment_id = enrollments.id\nGROUP BY learners.id, learners.name\nORDER BY learners.name;",
    runnerTestCode: "EXPECT_ROWS:Ada | 2",
    runnerExpectedExactLines: ["Ada | 2", "Grace | 1"],
    runnerExpectedExactSet: true,
    hiddenTests: [
      {
        id: "sql-join-fanout-hidden",
        name: "Hidden check adds an enrollment and proves the distinct count follows it",
        code: "INSERT INTO enrollments VALUES ('e4', 'l2', 'git');",
        expectedOutputExactLines: ["Ada | 2", "Grace | 2"],
        expectedOutputExactSet: true
      }
    ],
    curriculum: sqlCurriculum({
      level: 3,
      sequence: 5,
      teaches: ["sql.join.fanout", "sql.aggregate.count_distinct"],
      requires: ["sql.aggregate.group_by"]
    }),
    commonMistakes: [
      "Using COUNT(*) after joining two one-to-many tables",
      "Summing a column from the other side of a multiplied join",
      "Assuming a plausible dashboard number is correct without a distinct check"
    ],
    customRepairs: {
      "Using COUNT(*) after joining two one-to-many tables": "COUNT(*) counts multiplied rows. Use COUNT(DISTINCT child_key) so each real child is counted once regardless of the join size.",
      "Summing a column from the other side of a multiplied join": "When two child tables fan out, summing either side double-counts. Aggregate each child in its own subquery or CTE, then join the totals."
    }
  }),

  proofLesson({
    id: "lesson-sql-normalization",
    moduleId: "module-sql-modeling",
    slug: "sql-normalization",
    title: "One Fact in One Place",
    summary: "Spot repeated facts in a table and replace them with a key reference.",
    bodyMarkdown: "When the same fact is copied onto many rows, the copies drift. Two enrollments for the same course can disagree about the teacher because someone fixed one row and missed another. Normalization stores that fact once, in its own table, and references it by a key. The query in this lesson detects the drift; the fix is to give the course a single row that every enrollment points at.",
    estimatedMinutes: 12,
    difficulty: "applied",
    skillIds: ["skill-sql-joins", "skill-data-quality"],
    quizId: "quiz-sql-normalization",
    desktopTask: "Write a query that finds course names attached to more than one teacher, then sketch the normalized schema.",
    evidencePrompt: "Keep the duplicate-detecting query, its output, and a sketch of the two-table fix.",
    language: SQL_LANGUAGE,
    tools: SQL_TOOLS,
    synopsis: "You are learning to detect the same fact stored on many rows and to design a schema where it lives in exactly one place.",
    prerequisites: ["Know that tables can reference other tables with keys.", "Have seen GROUP BY report one row per group."],
    testingFocus: "You will test a query that finds course facts stored inconsistently, and confirm it separates healthy courses from duplicated ones.",
    objective: "Detect a fact stored inconsistently in a denormalized table and explain the normalized fix.",
    whyItMatters: "Duplicated facts create disagreements that no amount of query skill can repair. The schema has to keep one authoritative copy so reports agree.",
    coreConcept: "Normalization gives each fact one home. Other tables reference it by key instead of copying its values, so there is nothing to fall out of sync.",
    workedExample: "Storing teacher on every enrollment lets one row say Dr. Chen and another say Dr. Chan for the same course. A courses table with one teacher per course makes that disagreement impossible to store.",
    guidedExercise: "Find the course names that have more than one distinct teacher, then describe the two-table schema that removes the duplication.",
    missionConnection: "This is the schema-design judgment behind the Job Tracker Schema mission.",
    reflectionPrompt: "What class of bug disappears once a fact has exactly one home?",
    practiceStarter: "SELECT course_name, COUNT(DISTINCT teacher) AS teacher_count\nFROM enrollments_bad\nGROUP BY course_name\nORDER BY course_name;",
    practiceExpected: "Each course name appears once with the number of distinct teachers attached to it.",
    practiceCheck: "A teacher_count above one means the same course was written down with two different teachers. That is the duplicate-fact smell.",
    practiceReps: normalizationPracticeReps,
    miniTitle: "Detect and fix a duplicated fact",
    miniGoal: "Find the inconsistent course facts and sketch the schema that removes them.",
    miniSteps: ["Group the denormalized rows by course name", "Keep only courses with more than one teacher", "Sketch the normalized courses and enrollments tables"],
    miniDeliverables: ["Detection query", "Output rows", "Normalized schema sketch"],
    verifierCommand: "Run the detection query in the SQLite check.",
    expectedEvidence: "Output naming the inconsistent courses plus a schema sketch where each course fact lives in one row.",
    projectConnection: "This is the modeling step for the Job Tracker Schema mission.",
    requiredCodeIncludes: ["GROUP BY", "HAVING", "COUNT(DISTINCT"],
    requiredOutputIncludes: ["inconsistent_courses | 1"],
    runnerLanguage: "sql",
    runnerSetupCode:
      "CREATE TABLE enrollments_bad (id INTEGER PRIMARY KEY, learner TEXT, course_name TEXT, teacher TEXT);\n" +
      "INSERT INTO enrollments_bad (learner, course_name, teacher) VALUES ('ada', 'sql', 'Dr. Chen');\n" +
      "INSERT INTO enrollments_bad (learner, course_name, teacher) VALUES ('grace', 'sql', 'Dr. Chen');\n" +
      "INSERT INTO enrollments_bad (learner, course_name, teacher) VALUES ('linus', 'python', 'Dr. Park');\n" +
      "INSERT INTO enrollments_bad (learner, course_name, teacher) VALUES ('ada', 'python', 'Dr. Park');\n" +
      "INSERT INTO enrollments_bad (learner, course_name, teacher) VALUES ('grace', 'sql', 'Dr. Chan');",
    runnerStarterCode:
      "SELECT 'inconsistent_courses' AS check_name, COUNT(*) AS total\nFROM (\n  SELECT course_name\n  FROM enrollments_bad\n  GROUP BY course_name\n);",
    runnerTestCode: "EXPECT_ROWS:inconsistent_courses | 1",
    runnerExpectedExactLines: ["inconsistent_courses | 1"],
    hiddenTests: [
      {
        id: "sql-normalization-hidden",
        name: "Hidden check adds a second inconsistent course",
        code: "INSERT INTO enrollments_bad (learner, course_name, teacher) VALUES ('grace', 'python', 'Dr. Parke');",
        expectedOutputIncludes: ["inconsistent_courses | 2"]
      }
    ],
    curriculum: sqlCurriculum({
      level: 2,
      sequence: 6,
      teaches: ["sql.normalization.one_fact_one_place", "sql.normalization.reference_key"],
      requires: ["sql.aggregate.group_by", "sql.aggregate.having"],
      visibleCodeConcepts: ["sql.normalization.one_fact_one_place", "sql.normalization.reference_key", "sql.subquery.scalar"]
    }),
    commonMistakes: [
      "Storing the same fact on every row and updating only some copies",
      "Using a display name as a key instead of a stable identifier",
      "Fixing one bad row by hand without removing the duplicate source"
    ],
    customRepairs: {
      "Storing the same fact on every row and updating only some copies": "Move the fact to its own table with one row per subject, then reference it by key. Copies cannot drift when there is only one copy.",
      "Using a display name as a key instead of a stable identifier": "Names can change and repeat. Reference the fact by a stable id so renaming the display value happens in exactly one place."
    }
  })
];

export const sqlQuizzes: Quiz[] = [
      {
      id: "quiz-sql-joins",
      lessonId: "lesson-sql-joins",
      title: "SQL join checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-sql-1",
          prompt: "Which question is a join best suited to answer?",
          choices: ["What color should the button be?", "Which missions have no evidence?", "What is the app name?"],
          correctChoiceIndex: 1,
          explanation: "That answer needs mission rows connected to evidence rows."
      },
        {
          id: "question-sql-2",
          prompt: "What does an inner join drop from the results?",
          choices: ["Rows without a matching row on the other side", "Columns with repeated names", "Tables with more than two columns"],
          correctChoiceIndex: 0,
          explanation: "An inner join keeps only paired rows, so unmatched records disappear from the output."
      },
        {
          id: "question-sql-3",
          prompt: "Why match rows on IDs instead of display names?",
          choices: ["IDs stay stable and unique while names can repeat or change", "IDs are shorter to type in queries", "Names cannot be stored in tables"],
          correctChoiceIndex: 0,
          explanation: "Joining on stable keys avoids merging two different records that happen to share a label."
        }
      ].map(shuffleQuizChoices)
    },
      {
      id: "quiz-sql-constraints",
      lessonId: "lesson-sql-constraints",
      title: "SQL constraints checkpoint",
      passingScore: 80,
      questions: ([
        {
          id: "question-sql-constraints-1",
          prompt: "What does a foreign key protect?",
          choices: ["A child row pointing to a missing parent", "The button color", "The order of README sections"],
          correctChoiceIndex: 0,
          explanation: "A foreign key keeps relationships tied to rows that actually exist."
      },
        {
          id: "question-sql-constraints-2",
          prompt: "Why use a CHECK constraint for status?",
          choices: ["To reject values outside the allowed set", "To make every value text", "To avoid all queries"],
          correctChoiceIndex: 0,
          explanation: "A CHECK constraint can prevent misspelled or unsupported states from entering the table."
      },
        {
          id: "question-sql-constraints-3",
          prompt: "Why test a rejected row?",
          choices: ["To prove the schema blocks bad data", "To hide the failure", "To remove valid inserts"],
          correctChoiceIndex: 0,
          explanation: "The rejection is evidence that the database rule is active, not just documented."
        }
      ].map(shuffleQuizChoices)),
    },

  aggregateQuiz,
  subqueryQuiz,
  cteQuiz,
  windowQuiz,
  joinFanoutQuiz,
  normalizationQuiz
];
