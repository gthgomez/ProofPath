import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { runNativePythonProof } from "@/sandbox/native-python-proof-runner";
import { runLessonSandbox } from "@/sandbox/runner";

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
});
