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
 * offline Android emulator, 2026-10-11). The offline regex runner must select
 * for every runnable python lesson at curriculum level 0. (Level-1
 * lesson-python-literals legitimately stays on the WebView runner: its checks
 * use `assert ... is ...`/`assert ... is not ...` forms the regex evaluator
 * cannot parse, and the gate must stay stricter than the evaluator.)
 */
describe("native python runner selection", () => {
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

  it("keeps the sample lesson runnable end to end on the offline runner: shipped fails, solved passes", () => {
    const lesson = contentPack.lessons.find((candidate) => candidate.id === "lesson-python-zero-first-script");
    expect(lesson).toBeDefined();
    const spec = lesson!.workshop.miniProject.runnerSpec as LessonRunnerSpec;

    const shipped = runNativePythonProof(spec, lesson!.id, spec.starterCode, "2026-10-11T12:00:00.000Z");
    expect(shipped.passed).toBe(false);

    const solved = runNativePythonProof(spec, lesson!.id, 'print("first run")', "2026-10-11T12:00:00.000Z");
    expect(solved.passed).toBe(true);
  });
});
