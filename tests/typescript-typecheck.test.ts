import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { LessonRunnerSpec } from "@/domain/types";
import { runLessonSandbox } from "@/sandbox/runner";

function typeScriptSpec(code: string): LessonRunnerSpec {
  return {
    language: "typescript",
    instructions: "Declare a number and print it.",
    starterCode: code,
    visibleTests: [
      {
        id: "visible",
        name: "Prints the number",
        code: "console.log(value);",
        expectedOutputIncludes: ["2"]
      }
    ],
    hiddenTests: [],
    expectedOutput: ["2"],
    timeoutMs: 4000,
    memoryLimitMb: 128,
    allowNetwork: false
  };
}

describe("TypeScript sandbox type check", () => {
  beforeAll(() => {
    // The Node test environment cannot satisfy the runner's `new Function`
    // dynamic import, so route the compiler import through the same test seam
    // the Python/SQL runner tests use.
    globalThis.__proofpathImportRuntimeModuleForTests = (specifier: string) => import(specifier);
  });

  afterAll(() => {
    globalThis.__proofpathImportRuntimeModuleForTests = undefined;
  });

  it("fails a check when the learner file has a type error", async () => {
    const result = await runLessonSandbox(
      typeScriptSpec('const value: number = "hello";'),
      "lesson-ts-type-error",
      'const value: number = "hello";',
      "2026-10-07T20:00:00.000Z"
    );

    expect(result.passed).toBe(false);
    expect(result.score).toBe(0);
    // The learner sees a type check failure, not a generic runtime crash.
    expect(result.testResults[0]?.passed).toBe(false);
    expect(result.testResults[0]?.message).toMatch(/type error/i);
    expect(result.testResults[0]?.message).toMatch(/not assignable to type 'number'/i);
  });

  it("still passes a type-correct learner file", async () => {
    const code = "const value: number = 2;\nconsole.log(value);";
    const result = await runLessonSandbox(
      typeScriptSpec(code),
      "lesson-ts-type-valid",
      code,
      "2026-10-07T20:01:00.000Z"
    );

    expect(result.passed).toBe(true);
    expect(result.score).toBe(100);
    expect(result.stdout).toContain("2");
  });

  it("surfaces the failing line and a beginner-facing diagnostic instead of a crash", async () => {
    const result = await runLessonSandbox(
      typeScriptSpec('const value: number = "hello";'),
      "lesson-ts-type-diagnostic",
      'const value: number = "hello";',
      "2026-10-07T20:02:00.000Z"
    );

    // Runner exception path would surface a "runner-error" test id and a runner
    // message. A real type check must do neither.
    expect(result.testResults.some((testResult) => testResult.id.includes("runner-error"))).toBe(false);
    expect(result.testResults[0]?.message).toContain("Line 1");
    expect(result.stderr).toMatch(/error TS2322/);
    expect(result.diagnostics.some((diagnostic) => diagnostic.source === "parser")).toBe(true);
  });

  it("fails run_file on a type error and never leaks hidden check details", async () => {
    const spec = typeScriptSpec('const value: number = "hello";');
    spec.hiddenTests = [
      { id: "hidden", name: "SECRET hidden name", code: "console.log('secret')", expectedOutputIncludes: ["secret"] }
    ];

    const runFile = await runLessonSandbox(
      spec,
      "lesson-ts-runfile",
      spec.starterCode,
      "2026-10-07T20:03:00.000Z",
      "run_file"
    );
    expect(runFile.passed).toBe(false);
    expect(runFile.stderr).toMatch(/error TS2322/);
    expect(runFile.testResults).toEqual([]);

    const checks = await runLessonSandbox(
      spec,
      "lesson-ts-hidden",
      spec.starterCode,
      "2026-10-07T20:04:00.000Z",
      "run_checks"
    );
    expect(checks.passed).toBe(false);
    expect(checks.hiddenCheckSummary).toEqual({ total: 0, passed: 0, failed: 0 });
    expect(JSON.stringify(checks)).not.toContain("SECRET");
  });
});
