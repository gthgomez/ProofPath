import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import type { LessonRunnerSpec } from "@/domain/types";
import { runNativePythonFile, runNativePythonProof } from "@/sandbox/native-python-proof-runner";
import { runLessonSandbox } from "@/sandbox/runner";

const lesson = contentPack.lessons.find((candidate) => candidate.id === "lesson-python-values")!;
const pythonSpec: LessonRunnerSpec = {
  ...lesson.workshop.miniProject.runnerSpec,
  timeoutMs: 30000
};

function diagnosticIds(result: { diagnostics: Array<{ id: string }> }): string[] {
  return result.diagnostics.map((diagnostic) => diagnostic.id);
}

describe("Python web/native runner parity", () => {
  beforeAll(() => {
    globalThis.__careerforgeImportRuntimeModuleForTests = (specifier: string) => import(specifier);
  });

  afterAll(() => {
    globalThis.__careerforgeImportRuntimeModuleForTests = undefined;
  });

  it("passes the first Python proof through both execution paths", async () => {
    const code = [
      'topic = "python"',
      "minutes = 30",
      "completed = False",
      'summary = f"{topic}\\n{minutes}\\nplanned"',
      "print(summary)"
    ].join("\n");

    const webResult = await runLessonSandbox(pythonSpec, lesson.id, code, "2026-05-08T22:10:00.000Z", "run_checks");
    const nativeResult = runNativePythonProof(pythonSpec, lesson.id, code, "2026-05-08T22:10:01.000Z");

    expect(webResult.passed).toBe(true);
    expect(nativeResult.passed).toBe(true);
    expect(webResult.stdout).toContain("python\n30\nplanned");
    expect(nativeResult.stdout).toContain("python\n30\nplanned");
    expect(webResult.terminalTranscript.some((event) => event.type === "result" && event.status === "passed")).toBe(true);
    expect(nativeResult.terminalTranscript.some((event) => event.type === "result" && event.status === "passed")).toBe(true);
  });

  it("reports Python syntax errors as parser diagnostics in both paths", async () => {
    const code = "print(";

    const webResult = await runLessonSandbox(pythonSpec, lesson.id, code, "2026-05-08T22:11:00.000Z", "run_file");
    const nativeResult = runNativePythonFile(lesson.id, code, "2026-05-08T22:11:01.000Z");

    expect(webResult.passed).toBe(false);
    expect(nativeResult.passed).toBe(false);
    expect(diagnosticIds(webResult)).toContain("python-syntax-error");
    expect(diagnosticIds(nativeResult)).toContain("python-syntax-error");
    expect(nativeResult.diagnostics[0]).toMatchObject({ source: "parser", confidence: "known", line: 1 });
  });

  it("reports Python name errors as runtime diagnostics in both paths", async () => {
    const code = "print(minutes)";

    const webResult = await runLessonSandbox(pythonSpec, lesson.id, code, "2026-05-08T22:12:00.000Z", "run_file");
    const nativeResult = runNativePythonFile(lesson.id, code, "2026-05-08T22:12:01.000Z");

    expect(webResult.passed).toBe(false);
    expect(nativeResult.passed).toBe(false);
    expect(diagnosticIds(webResult)).toContain("python-name-error");
    expect(diagnosticIds(nativeResult)).toContain("python-name-error");
    expect(webResult.stderr).not.toMatch(/timed out|timeout/i);
    expect(nativeResult.stderr).not.toMatch(/timed out|timeout/i);
  });
});
