import type { Lesson, LessonPracticeBlock, Quiz } from "@/domain/types";
import { shuffleQuizChoices, workshop } from "../python/shared";

// SQL and Postgres track. Mirrors the python/level-N.ts split: this file owns the
// track's lessons and quizzes, and the shared builders in
// src/content/python/shared.ts do the rest.

const sqlJoinPracticeReps: LessonPracticeBlock[] = [
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

export const sqlLessons: Lesson[] = [
    {
      id: "lesson-sql-joins",
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
];
