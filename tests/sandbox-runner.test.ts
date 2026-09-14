import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { contentPack } from "@/content/seed";
import type { LessonRunnerSpec } from "@/domain/types";
import { runNativePythonProof } from "@/sandbox/native-python-proof-runner";
import { preloadSandbox, runLessonSandbox } from "@/sandbox/runner";

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
      expect(result.stdout).toContain("sql | 45");
    });

    it("fails a forged constant UNION that never reads the seeded sessions table", async () => {
      const result = await runLessonSandbox(
        harnessSpec,
        "lesson-sql-harness-forged",
        "SELECT 'python', 50 UNION ALL SELECT 'git', 15;",
        "2026-05-07T20:40:00.000Z"
      );

      // The visible check passes, so the 50 score and "Output missing" error
      // come from the hidden check that inserted the unseen sql topic.
      expect(result.passed).toBe(false);
      expect(result.score).toBe(50);
      expect(result.stderr).toContain("Output missing");
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

    it("prints guarded output under run_file and stays silent under run_checks", async () => {
      const directRun = await runLessonSandbox(spec, lesson.id, guardedCode, "2026-05-08T22:20:00.000Z", "run_file");
      expect(directRun.passed).toBe(true);
      expect(directRun.stdout).toContain("45 total minutes");

      const importStyle = await runLessonSandbox(spec, lesson.id, guardedCode, "2026-05-08T22:21:00.000Z", "run_checks");
      expect(importStyle.passed).toBe(true);
      expect(importStyle.stdout).not.toContain("45 total minutes");
    });
  }, 60000);
});
