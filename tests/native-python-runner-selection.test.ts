import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { canRunNativePythonProof, runNativePythonProof } from "@/sandbox/native-python-proof-runner";
import type { LessonRunnerSpec } from "@/domain/types";

/**
 * Regression: comment-only verifier checks (the level-0 teaching style) were
 * rejected by canRunNativePythonProof, so the first lessons a beginner meets —
 * including the sample lesson — silently fell to the WebView Pyodide runner.
 * On offline devices whose Pyodide cold boot exceeds the startup allowance,
 * every check timed out (observed three consecutive 24000ms timeouts on an
 * offline Android emulator, 2026-10-11).
 *
 * Scope note: the gate rejects exactly the verifier forms the regex evaluator
 * cannot parse (`assert ... is ...`/`assert ... is not ...`). It does not
 * guarantee the evaluator can evaluate every accepted assertion — gate-accepted
 * `==` operands can still reference method chains the evaluator cannot
 * evaluate; those fail honestly (the lesson-python-strings hidden check is a
 * known case, tracked separately).
 */
describe("native python runner selection", () => {
  // Lessons whose specs deliberately require the WebView Pyodide runner:
  // control flow, is/is not identity checks, method-chain assertions —
  // anything the offline regex runner cannot execute or evaluate. Move a
  // lesson into or out of this set only after confirming its checks still
  // pass and fail honestly on the offline runner.
  const WEBVIEW_PYTHON_LESSONS = new Set([
    "lesson-python-literals",
    "lesson-python-list-of-dicts",
    "lesson-python-loops",
    "lesson-python-foundation-capstone",
    "lesson-python-strings-cleanup",
    "lesson-python-module-guard",
    "lesson-python-def-call",
    "lesson-python-parameters",
    "lesson-python-return",
    "lesson-python-print-vs-return",
    "lesson-python-functions-capstone",
    "lesson-python-functions",
    "lesson-python-read-traceback",
    "lesson-python-nameerror",
    "lesson-python-valueerror",
    "lesson-python-try-except",
    "lesson-python-breakpoint-debugger",
    "lesson-python-assertions",
    "lesson-python-debugging-capstone",
    "lesson-python-import",
    "lesson-python-file-input",
    "lesson-python-parser-tests",
    "lesson-python-cli-arguments",
    "lesson-python-file-backed-cli",
    "lesson-python-cli-polish",
    "lesson-python-output-file",
    "lesson-python-rejected-row-report",
    "lesson-python-core-review",
    "lesson-python-project-structure",
    "lesson-python-dataclass-models",
    "lesson-python-json-reports",
    "lesson-python-logging-errors",
    "lesson-python-pyproject-metadata",
    "lesson-python-installable-cli",
    "lesson-python-virtual-env",
    "lesson-python-config-files",
    "lesson-python-professional-review",
    "lesson-python-type-hints",
    "lesson-python-regex-validation",
    "lesson-python-oop-service",
    "lesson-python-api-client",
    "lesson-python-testing-mocks",
    "lesson-python-integration-capstone",
    "lesson-python-integration-review",
    "lesson-python-api-retry",
    "lesson-python-rate-limiting",
    "lesson-python-api-caching",
    "lesson-python-circuit-breaker"
  ]);

  it("selects the offline regex runner for every runnable python lesson at level 0", () => {
    const lessons = contentPack.lessons.filter((candidate) => (
      candidate.curriculum
      && candidate.curriculum.level === 0
      && candidate.workshop.miniProject.runnerSpec?.language === "python"
    ));

    expect(lessons.length).toBeGreaterThan(0);
    for (const lesson of lessons) {
      const spec = lesson.workshop.miniProject.runnerSpec as LessonRunnerSpec;
      expect(canRunNativePythonProof(spec), lesson.id).toBe(true);
    }
  });

  it("pins the runner selection for every runnable python lesson at every level (no silent flips)", () => {
    const lessons = contentPack.lessons.filter((candidate) => (
      candidate.workshop.miniProject.runnerSpec?.language === "python"
    ));

    expect(lessons.length).toBeGreaterThan(WEBVIEW_PYTHON_LESSONS.size);
    for (const lesson of lessons) {
      const spec = lesson.workshop.miniProject.runnerSpec as LessonRunnerSpec;
      const expectedNative = !WEBVIEW_PYTHON_LESSONS.has(lesson.id);
      expect(
        canRunNativePythonProof(spec),
        `${lesson.id} runner selection changed — if intended, update WEBVIEW_PYTHON_LESSONS deliberately`
      ).toBe(expectedNative);
    }
  });

  it("keeps the sample lesson runnable end to end on the offline runner: shipped fails, solved passes", () => {
    const lesson = contentPack.lessons.find((candidate) => candidate.id === "lesson-python-zero-first-script");
    expect(lesson).toBeDefined();
    const spec = lesson!.workshop.miniProject.runnerSpec as LessonRunnerSpec;

    const shipped = runNativePythonProof(spec, lesson!.id, spec.starterCode, "2026-10-11T12:00:00.000Z");
    expect(shipped.passed).toBe(false);

    const solved = runNativePythonProof(spec, lesson!.id, 'print("first run")', "2026-10-11T12:00:00.000Z");
    expect(solved.passed).toBe(true);
  });

  it("reports the syntax-error lesson's shipped starter as a Python syntax error, not an unsupported expression", () => {
    const lesson = contentPack.lessons.find((candidate) => candidate.id === "lesson-python-zero-first-error");
    expect(lesson).toBeDefined();
    const spec = lesson!.workshop.miniProject.runnerSpec as LessonRunnerSpec;

    const shipped = runNativePythonProof(spec, lesson!.id, spec.starterCode, "2026-10-11T12:00:00.000Z");
    expect(shipped.passed).toBe(false);
    expect(shipped.stderr).toContain("SyntaxError: unterminated string literal");
    expect(shipped.diagnostics.some((diagnostic) => diagnostic.id === "python-syntax-error")).toBe(true);

    const fixed = runNativePythonProof(spec, lesson!.id, 'print("fixed syntax")', "2026-10-11T12:00:00.000Z");
    expect(fixed.passed).toBe(true);
  });
});
