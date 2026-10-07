import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { contentPack } from "@/content/seed";
import type { LessonRunnerSpec } from "@/domain/types";
import { runLessonSandbox } from "@/sandbox/runner";

const NOW = "2026-10-07T00:00:00.000Z";
const WASM_DIR = resolve(process.cwd(), "public/sandbox-assets/sql.js");

function specFor(lessonId: string): LessonRunnerSpec {
  const lesson = contentPack.lessons.find((candidate) => candidate.id === lessonId);
  if (!lesson) throw new Error(`missing lesson ${lessonId}`);
  return lesson.workshop.miniProject.runnerSpec;
}

async function run(lessonId: string, code: string) {
  return runLessonSandbox(specFor(lessonId), lessonId, code, NOW);
}

describe("SQL checks cannot be satisfied by a constant forgery", () => {
  beforeAll(() => {
    // Load the real sql.js in Node, pointing the wasm loader at the shipped asset.
    globalThis.__proofpathImportRuntimeModuleForTests = async (specifier: string) => {
      if (specifier === "sql.js") {
        const real = await import("sql.js");
        const initSqlJs = (real as { default: (config?: unknown) => Promise<unknown> }).default;
        return { default: (config?: { locateFile?: (file: string) => string }) =>
          initSqlJs({ ...(config ?? {}), locateFile: (file: string) => `${WASM_DIR}/${file}` }) };
      }
      return import(specifier);
    };
  });

  afterAll(() => {
    globalThis.__proofpathImportRuntimeModuleForTests = undefined;
  });

  it("accepts the correct aggregate query but rejects an unfiltered one", async () => {
    const correct = await run(
      "lesson-sql-aggregates",
      "SELECT learner, topic, SUM(minutes) AS total\nFROM study_sessions\nGROUP BY learner, topic\nHAVING SUM(minutes) >= 40;"
    );
    expect(correct.passed).toBe(true);

    // No HAVING: the extra groups must not be tolerated.
    const unfiltered = await run(
      "lesson-sql-aggregates",
      "SELECT learner, topic, SUM(minutes) AS total\nFROM study_sessions\nGROUP BY learner, topic;"
    );
    expect(unfiltered.passed).toBe(false);
  });

  it("rejects a hardcoded UNION that emits the visible and hidden literals", async () => {
    const forged = await run(
      "lesson-sql-aggregates",
      "SELECT 'ada | sql | 75' AS row\nUNION ALL SELECT 'grace | git | 60'\nUNION ALL SELECT 'ada | python | 45';"
    );
    expect(forged.passed).toBe(false);
  });

  it("accepts the correct subquery filter but rejects a hardcoded UNION", async () => {
    const correct = await run(
      "lesson-sql-subqueries",
      "SELECT DISTINCT topic\nFROM study_sessions\nWHERE topic IN (SELECT topic FROM study_sessions WHERE minutes > 40);"
    );
    expect(correct.passed).toBe(true);

    const forged = await run(
      "lesson-sql-subqueries",
      "SELECT 'git' AS topic\nUNION ALL SELECT 'sql'\nUNION ALL SELECT 'python';"
    );
    expect(forged.passed).toBe(false);
  });

  it("accepts the correct fan-out count but rejects a hardcoded UNION", async () => {
    const correct = await run(
      "lesson-sql-join-fanout",
      "SELECT learners.name, COUNT(DISTINCT enrollments.course) AS course_count\n" +
        "FROM learners\n" +
        "JOIN enrollments ON enrollments.learner_id = learners.id\n" +
        "LEFT JOIN submissions ON submissions.enrollment_id = enrollments.id\n" +
        "GROUP BY learners.id, learners.name\n" +
        "ORDER BY learners.name;"
    );
    expect(correct.passed).toBe(true);

    const forged = await run(
      "lesson-sql-join-fanout",
      "SELECT 'Ada' AS name, 2 AS course_count\nUNION ALL SELECT 'Grace', 1\nUNION ALL SELECT 'Grace', 2;"
    );
    expect(forged.passed).toBe(false);
  });
});
