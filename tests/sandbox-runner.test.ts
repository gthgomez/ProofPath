import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { contentPack } from "@/content/seed";
import type { LessonRunnerSpec } from "@/domain/types";
import { runNativePythonProof } from "@/sandbox/native-python-proof-runner";
import {
  PYTHON_DIRECT_RUN_NAME,
  PYTHON_IMPORT_RUN_NAME,
  SQL_HARNESS_PATTERN,
  isTrustedSqlHarness,
  preloadSandbox,
  runLessonSandbox
} from "@/sandbox/runner";

describe("lesson sandbox runner", () => {
  it("runs TypeScript-style lesson code through the local runner", async () => {
    const lesson = contentPack.lessons.find((candidate) => candidate.id === "lesson-typescript-contracts")!;
    const result = await runLessonSandbox(
      lesson.workshop.miniProject.runnerSpec,
      lesson.id,
      lesson.workshop.miniProject.runnerSpec.starterCode,
      "2026-05-07T20:30:00.000Z"
    );

    expect(result.passed).toBe(true);
    expect(result.stdout).toContain("proofCount");
  });

  it("fails incomplete JavaScript project code", async () => {
    const lesson = contentPack.lessons.find((candidate) => candidate.id === "lesson-ai-test-loop")!;
    const result = await runLessonSandbox(
      lesson.workshop.miniProject.runnerSpec,
      lesson.id,
      "function formatUser(user) { return user.name; }\nconst aiJudgmentNote = 'AI draft';",
      "2026-05-07T20:31:00.000Z"
    );

    expect(result.passed).toBe(false);
    expect(result.testResults[0]?.message).toContain("missing fallback");
  });

  it("blocks unsafe browser and network APIs before execution", async () => {
    const lesson = contentPack.lessons.find((candidate) => candidate.id === "lesson-typescript-contracts")!;
    const result = await runLessonSandbox(
      lesson.workshop.miniProject.runnerSpec,
      lesson.id,
      "fetch('https://example.com');\nconst card = {};",
      "2026-05-07T20:32:00.000Z"
    );

    expect(result.passed).toBe(false);
    expect(result.stderr).toContain("Network calls are disabled");
    expect(result.testResults[0]?.id).toContain("policy");
  });

  it("blocks destructive SQL before execution", async () => {
    const lesson = contentPack.lessons.find((candidate) => candidate.id === "lesson-sql-joins")!;
    const result = await runLessonSandbox(
      lesson.workshop.miniProject.runnerSpec,
      lesson.id,
      "DROP TABLE missions;",
      "2026-05-07T20:33:00.000Z"
    );

    expect(result.passed).toBe(false);
    expect(result.stderr).toContain("read-only");
  });

  it("blocks obvious infinite JavaScript loops before execution", async () => {
    const lesson = contentPack.lessons.find((candidate) => candidate.id === "lesson-typescript-contracts")!;
    const result = await runLessonSandbox(
      lesson.workshop.miniProject.runnerSpec,
      lesson.id,
      "while (true) {}",
      "2026-05-07T20:34:00.000Z"
    );

    expect(result.passed).toBe(false);
    expect(result.stderr).toContain("infinite loops");
  });

  it("runs the first Python proof with the native offline fallback", () => {
    const lesson = contentPack.lessons.find((candidate) => candidate.id === "lesson-python-values")!;
    const spec = lesson.workshop.miniProject.runnerSpec;
    const result = runNativePythonProof(
      spec,
      lesson.id,
      [
        'topic = "python"',
        "minutes = 30",
        "completed = False",
        'summary = f"{topic}\\n{minutes}\\nplanned"',
        "print(summary)"
      ].join("\n"),
      "2026-05-07T20:35:00.000Z"
    );

    expect(result.passed).toBe(true);
    expect(result.stdout).toContain("python\n30\nplanned");
    expect(result.stdout).toContain("passed");
  });

  it("gives a lesson-specific Python failure instead of a runner timeout", () => {
    const lesson = contentPack.lessons.find((candidate) => candidate.id === "lesson-python-values")!;
    const spec = lesson.workshop.miniProject.runnerSpec;
    const result = runNativePythonProof(
      spec,
      lesson.id,
      spec.starterCode,
      "2026-05-07T20:36:00.000Z"
    );

    expect(result.passed).toBe(false);
    expect(result.runtimeMs).toBeLessThan(1000);
    expect(result.testResults[0]?.message).toContain("Change minutes from 0 to the number 30");
    expect(result.stderr).not.toContain("timed out");
  });

  it("allows safe background preloading of sandbox runtime environments", () => {
    expect(() => preloadSandbox("python")).not.toThrow();
    expect(() => preloadSandbox("sql")).not.toThrow();
    expect(() => preloadSandbox("javascript")).not.toThrow();
    expect(() => preloadSandbox("python")).not.toThrow();
    expect(() => preloadSandbox("sql")).not.toThrow();
  });

  it("fails unsupported Python control flow gracefully instead of throwing unhandled exceptions", () => {
    const lesson = contentPack.lessons.find((candidate) => candidate.id === "lesson-python-values")!;
    const spec = lesson.workshop.miniProject.runnerSpec;
    
    expect(() => {
      const result = runNativePythonProof(
        spec,
        lesson.id,
        "if True:\n  minutes = 30",
        "2026-05-07T20:37:00.000Z"
      );
      expect(result.passed).toBe(false);
      expect(result.stderr).toContain("Unsupported Python feature in the native offline verifier");
    }).not.toThrow();
  });

  describe("SQL sandbox per-check isolation", () => {
    beforeAll(() => {
      const require = createRequire(import.meta.url);
      const wasmPath = require.resolve("sql.js/dist/sql-wasm.wasm");
      globalThis.__careerforgeImportRuntimeModuleForTests = async (specifier: string) => {
        const loaded = await import(specifier);
        if (specifier !== "sql.js") {
          return loaded;
        }

        // In the Node test environment the runner's hardcoded browser asset URL
        // (/sandbox-assets/sql.js/...) does not exist. Redirect sql.js to the
        // wasm file shipped in node_modules so the runner exercises real SQL.
        const initSqlJs = (loaded as { default: (config?: { locateFile?: (file: string) => string }) => Promise<unknown> }).default;
        return {
          ...loaded,
          default: (config?: { locateFile?: (file: string) => string }) => initSqlJs({ ...config, locateFile: () => wasmPath })
        };
      };
    });

    afterAll(() => {
      globalThis.__careerforgeImportRuntimeModuleForTests = undefined;
    });

    // Mirrors the SQLite persistence lesson: a read-only learner aggregate over
    // seeded sessions, plus a hidden check that first inserts an unseen topic.
    const harnessSpec: LessonRunnerSpec = {
      language: "sql",
      instructions: "Summarize study minutes per topic.",
      starterCode: "SELECT topic, SUM(minutes) FROM sessions GROUP BY topic ORDER BY topic;",
      setupCode: [
        "CREATE TABLE sessions (id INTEGER PRIMARY KEY, date TEXT NOT NULL, topic TEXT NOT NULL, minutes INTEGER NOT NULL CHECK (minutes > 0));",
        "INSERT INTO sessions (date, topic, minutes) VALUES ('2026-06-01', 'python', 30);",
        "INSERT INTO sessions (date, topic, minutes) VALUES ('2026-06-02', 'python', 20);",
        "INSERT INTO sessions (date, topic, minutes) VALUES ('2026-06-03', 'git', 15);"
      ].join("\n"),
      visibleTests: [
        {
          id: "visible-topic-totals",
          name: "Returns per-topic totals",
          code: "-- visible check runs no harness SQL",
          expectedOutputIncludes: ["python", "50", "git", "15"]
        }
      ],
      hiddenTests: [
        {
          id: "hidden-unseen-topic",
          name: "Computes totals for a newly seeded topic",
          code: "-- Hidden checks may seed an extra topic before the learner query runs.\nINSERT INTO sessions (date, topic, minutes) VALUES ('2026-06-04', 'sql', 45);",
          expectedOutputIncludes: ["python", "50", "git", "15", "sql", "45"]
        }
      ],
      expectedOutput: ["python", "50", "git", "15"],
      timeoutMs: 30000,
      allowNetwork: false
    };

    it("re-seeds a fresh database for every check so non-idempotent SQL does not leak state", async () => {
      const spec: LessonRunnerSpec = {
        language: "sql",
        instructions: "Summarize study minutes per topic.",
        starterCode: "SELECT topic, SUM(minutes) AS total FROM sessions GROUP BY topic;",
        setupCode: [
          "CREATE TABLE sessions (topic TEXT, minutes INTEGER);",
          "INSERT INTO sessions VALUES ('python', 30), ('python', 15), ('sql', 20);"
        ].join("\n"),
        visibleTests: [
          {
            id: "visible-topic-totals",
            name: "Returns totals per topic",
            code: "EXPECT_ROWS",
            expectedOutputIncludes: ["python | 45", "sql | 20"]
          }
        ],
        hiddenTests: [
          {
            id: "hidden-topic-totals",
            name: "Returns the same totals on a second check",
            code: "EXPECT_ROWS",
            expectedOutputIncludes: ["python | 45", "sql | 20"]
          }
        ],
        expectedOutput: ["python | 45", "sql | 20"],
        timeoutMs: 30000,
        allowNetwork: false
      };

      // `CREATE TABLE tmp` is policy-legal but non-idempotent: without a fresh
      // database per check, the second check fails with "table tmp already exists".
      const code = [
        "CREATE TABLE tmp (id INTEGER);",
        "SELECT topic, SUM(minutes) FROM sessions GROUP BY topic;"
      ].join("\n");

      const result = await runLessonSandbox(spec, "lesson-sql-isolation", code, "2026-05-07T20:38:00.000Z");

      expect(result.passed).toBe(true);
      expect(result.testResults.length).toBeGreaterThan(0);
      expect(result.testResults.every((testResult) => testResult.passed)).toBe(true);
    });

    it("passes a computed per-topic aggregate when a hidden check seeds an unseen topic", async () => {
      const result = await runLessonSandbox(
        harnessSpec,
        "lesson-sql-harness-correct",
        "SELECT topic, SUM(minutes) FROM sessions GROUP BY topic ORDER BY topic;",
        "2026-05-07T20:39:00.000Z"
      );

      expect(result.passed).toBe(true);
      expect(result.score).toBe(100);
      // Blocker 5: the hidden check's harness output (the unseen sql | 45 row) must
      // never leak into learner-visible stdout. Only the visible check publishes.
      expect(result.stdout).toContain("git | 15");
      expect(result.stdout).toContain("python | 50");
      expect(result.stdout).not.toContain("sql | 45");
      expect(result.terminalTranscript.some((event) => event.type === "stdout" && event.text.includes("sql | 45"))).toBe(false);
    });

    it("fails a forged constant UNION and proves the hidden harness check is the discriminator", async () => {
      const forged = await runLessonSandbox(
        harnessSpec,
        "lesson-sql-harness-forged",
        "SELECT 'python', 50 UNION ALL SELECT 'git', 15;",
        "2026-05-07T20:40:00.000Z"
      );

      // The visible check passes (score 50 = 1 of 2 checks), so the "Output
      // missing" failure comes from the hidden check that inserted the unseen sql
      // topic. Only a harness-seeded hidden check can distinguish the forgery.
      expect(forged.passed).toBe(false);
      expect(forged.score).toBe(50);
      expect(forged.stderr).toContain("Output missing");

      // Revert sensitivity (#9): the hidden check only discriminates because the
      // runner actually executes the trusted harness INSERT. The honest aggregate
      // query scores 100 on the very same spec, which is impossible if harness
      // execution is removed (the unseen sql | 45 row would never exist).
      const honest = await runLessonSandbox(
        harnessSpec,
        "lesson-sql-harness-honest",
        "SELECT topic, SUM(minutes) FROM sessions GROUP BY topic ORDER BY topic;",
        "2026-05-07T20:41:00.000Z"
      );
      expect(honest.passed).toBe(true);
      expect(honest.score).toBe(100);
    });

    it("restricts the privileged SQL harness to seed-safe statements", () => {
      // Blocker 4: the harness runs without the learner policy gate, so it may
      // only contain schema + seed statements. SELECT/WITH/INSERT/CREATE pass;
      // every mutation/administration statement is rejected.
      const allowed = [
        "INSERT INTO sessions (date, topic, minutes) VALUES ('2026-06-04', 'sql', 45);",
        "-- Trusted harness SQL: seed an unseen topic\nINSERT INTO sessions (date, topic, minutes) VALUES ('2026-06-04', 'sql', 45);",
        "/* block comment */ SELECT 1;",
        "CREATE TABLE seed (topic TEXT);",
        "WITH seed AS (SELECT 1 AS n) SELECT n FROM seed;"
      ];
      for (const code of allowed) {
        expect(SQL_HARNESS_PATTERN.test(code)).toBe(true);
      }

      const rejected = [
        "DROP TABLE sessions;",
        "-- comment then drop\nDROP TABLE sessions;",
        "UPDATE sessions SET minutes = 0;",
        "DELETE FROM sessions;",
        "ALTER TABLE sessions ADD COLUMN hidden TEXT;",
        "PRAGMA table_info(sessions);",
        "ATTACH DATABASE 'evil.db' AS evil;",
        "DETACH DATABASE evil;",
        "VACUUM;",
        "REINDEX;",
        "ANALYZE;",
        "REPLACE INTO sessions (id, topic, minutes) VALUES (99, 'sql', 1);",
        "EXPECT_ROWS:no evidence",
        "-- visible check runs no harness SQL"
      ];
      for (const code of rejected) {
        expect(SQL_HARNESS_PATTERN.test(code)).toBe(false);
      }
    });

    it("rejects multi-statement harness payloads that chain a destructive statement", () => {
      // The legacy prefix pattern only inspects the first statement, so it still
      // accepts these. `db.run` executes every statement, so the hardened gate
      // must reject them.
      const chainedPayloads = [
        "INSERT INTO sessions (date, topic, minutes) VALUES ('2026-06-04', 'sql', 45); DROP TABLE sessions;",
        "SELECT 1; DELETE FROM sessions;",
        "WITH seed AS (SELECT 1 AS n) DELETE FROM sessions;",
        "CREATE TABLE tmp (id INTEGER); PRAGMA writable_schema = 1;",
        "INSERT INTO sessions (date, topic, minutes) VALUES ('2026-06-04', 'sql', 45); UPDATE sessions SET minutes = 0;"
      ];

      for (const payload of chainedPayloads) {
        expect(SQL_HARNESS_PATTERN.test(payload)).toBe(true);
        expect(isTrustedSqlHarness(payload)).toBe(false);
      }

      // The legitimate hidden harness must still be accepted, including a
      // semicolon and a destructive-looking word inside a string literal.
      expect(isTrustedSqlHarness("INSERT INTO sessions (date, topic, minutes) VALUES ('2026-06-04', 'sql', 45);")).toBe(true);
      expect(isTrustedSqlHarness("INSERT INTO notes (body) VALUES ('call; delete later');")).toBe(true);
      expect(isTrustedSqlHarness("-- seed\nINSERT INTO sessions (topic) VALUES ('sql');")).toBe(true);
    });

    it("does not execute a multi-statement hidden harness that chains a DROP after a seed", async () => {
      const spec: LessonRunnerSpec = {
        language: "sql",
        instructions: "List the seeded topics.",
        starterCode: "SELECT topic FROM sessions;",
        setupCode: [
          "CREATE TABLE sessions (id INTEGER PRIMARY KEY, topic TEXT NOT NULL);",
          "INSERT INTO sessions (topic) VALUES ('python'), ('git');"
        ].join("\n"),
        visibleTests: [
          {
            id: "visible-topics",
            name: "Lists the seeded topics",
            code: "-- visible check runs no harness SQL",
            expectedOutputIncludes: ["python", "git"]
          }
        ],
        hiddenTests: [
          {
            id: "hidden-multi-statement",
            name: "Would seed then drop",
            // Privileged hidden harness: if the gate only checked the first
            // statement, `db.run` would execute the DROP and the learner query
            // would fail for every check.
            code: "INSERT INTO sessions (topic) VALUES ('sql'); DROP TABLE sessions;",
            expectedOutputIncludes: ["python", "git"]
          }
        ],
        expectedOutput: ["python", "git"],
        timeoutMs: 30000,
        allowNetwork: false
      };

      const result = await runLessonSandbox(
        spec,
        "lesson-sql-harness-multi-statement",
        "SELECT topic FROM sessions;",
        "2026-05-07T20:42:00.000Z"
      );

      // The harness is skipped, so the DROP never runs and the read-only learner
      // query still sees the seeded table. Only a prefix-only gate would fail here.
      expect(result.passed).toBe(true);
      expect(result.stderr).not.toContain("no such table");
      expect(result.stdout).toContain("python");
      expect(result.stdout).toContain("git");
    });
  });

  describe("Python __name__ run-mode fidelity", () => {
    beforeAll(() => {
      globalThis.__careerforgeImportRuntimeModuleForTests = (specifier: string) => import(specifier);
    });

    afterAll(() => {
      globalThis.__careerforgeImportRuntimeModuleForTests = undefined;
    });

    const lesson = contentPack.lessons.find((candidate) => candidate.id === "lesson-python-module-guard")!;
    const spec: LessonRunnerSpec = {
      ...lesson.workshop.miniProject.runnerSpec,
      timeoutMs: 30000
    };
    // Defines the reusable helper the visible check imports, then prints the
    // actual value Python binds to __name__ for the current run mode.
    const nameProbeCode = [
      "def total_minutes(sessions):",
      "    total = 0",
      "    for s in sessions:",
      "        total = total + s['minutes']",
      "    return total",
      "",
      "print(f'name={__name__}')"
    ].join("\n");

    it("binds __main__ for run_file and the import sentinel for run_checks", async () => {
      const directRun = await runLessonSandbox(spec, lesson.id, nameProbeCode, "2026-05-08T22:20:00.000Z", "run_file");
      expect(directRun.passed).toBe(true);
      expect(PYTHON_DIRECT_RUN_NAME).toBe("__main__");
      expect(directRun.stdout).toContain(`name=${PYTHON_DIRECT_RUN_NAME}`);

      const importStyle = await runLessonSandbox(spec, lesson.id, nameProbeCode, "2026-05-08T22:21:00.000Z", "run_checks");
      expect(importStyle.passed).toBe(true);
      // The actual bound value must be the non-__main__ import sentinel, not just
      // "the guarded print did not fire".
      expect(importStyle.stdout).toContain(`name=${PYTHON_IMPORT_RUN_NAME}`);
      expect(PYTHON_IMPORT_RUN_NAME).not.toBe(PYTHON_DIRECT_RUN_NAME);
      expect(importStyle.stdout).not.toContain(`name=${PYTHON_DIRECT_RUN_NAME}`);
    });

    it("runs the guarded block under run_file and stays silent under run_checks", async () => {
      const guardedCode = [
        "def total_minutes(sessions):",
        "    total = 0",
        "    for s in sessions:",
        "        total = total + s['minutes']",
        "    return total",
        "",
        "if __name__ == '__main__':",
        "    sessions = [{'topic': 'python', 'minutes': 30}, {'topic': 'git', 'minutes': 15}]",
        "    result = total_minutes(sessions)",
        "    print(f'{result} total minutes')"
      ].join("\n");

      const directRun = await runLessonSandbox(spec, lesson.id, guardedCode, "2026-05-08T22:22:00.000Z", "run_file");
      expect(directRun.passed).toBe(true);
      expect(directRun.stdout).toContain("45 total minutes");

      const importStyle = await runLessonSandbox(spec, lesson.id, guardedCode, "2026-05-08T22:23:00.000Z", "run_checks");
      expect(importStyle.passed).toBe(true);
      expect(importStyle.stdout).not.toContain("45 total minutes");
    });
  }, 60000);
});
