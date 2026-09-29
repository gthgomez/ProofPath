import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { deriveLessonWorkflow } from "@/domain/lesson-workflow";
import { runNativePythonProof } from "@/sandbox/native-python-proof-runner";
import type { Lesson } from "@/domain/types";

const filesLesson = contentPack.lessons.find((lesson) => lesson.id === "lesson-python-zero-files-folders")!;
const terminalLesson = contentPack.lessons.find((lesson) => lesson.id === "lesson-python-zero-terminal")!;

function runLearnerCode(lesson: Lesson, code: string) {
  return runNativePythonProof(
    lesson.workshop.miniProject.runnerSpec,
    lesson.id,
    code,
    "2026-09-28T12:00:00.000Z"
  );
}

describe("PR04: conceptual activities assess a learner response", () => {
  it("files lesson: the shipped starter (empty answer) fails", async () => {
    const result = runLearnerCode(filesLesson, filesLesson.workshop.miniProject.runnerSpec.starterCode);
    expect(result.passed).toBe(false);
  });

  it("files lesson: the correct answer passes", async () => {
    const result = runLearnerCode(filesLesson, 'print("py")');
    expect(result.passed).toBe(true);
  });

  it("files lesson: the taught misconception (dot included) fails", async () => {
    const result = runLearnerCode(filesLesson, 'print(".py")');
    expect(result.passed).toBe(false);
  });

  it("files lesson: an unrelated answer fails", async () => {
    const result = runLearnerCode(filesLesson, 'print("main.py")');
    expect(result.passed).toBe(false);
  });

  it("terminal lesson: the shipped starter (empty answer) fails", async () => {
    const result = runLearnerCode(terminalLesson, terminalLesson.workshop.miniProject.runnerSpec.starterCode);
    expect(result.passed).toBe(false);
  });

  it("terminal lesson: the correct command passes", async () => {
    const result = runLearnerCode(terminalLesson, 'print("python hello.py")');
    expect(result.passed).toBe(true);
  });

  it("terminal lesson: the taught misconception (prompt symbol included) fails", async () => {
    const result = runLearnerCode(terminalLesson, 'print("$ python hello.py")');
    expect(result.passed).toBe(false);
  });

  it("stdout-checked run_file lessons still pass with their authored solutions", async () => {
    const firstScript = contentPack.lessons.find((lesson) => lesson.id === "lesson-python-zero-first-script")!;
    const result = runLearnerCode(firstScript, 'print("first run")');
    expect(result.passed).toBe(true);

    const wrong = runLearnerCode(firstScript, 'print("hello")');
    expect(wrong.passed).toBe(false);
  });
});

describe("PR04/F05: workflow labels never mark unvisited steps completed", () => {
  const baseInput = {
    miniProjectDone: false,
    quizDone: false,
    lessonDone: false,
    hasQuiz: true,
    nextLessonId: "lesson-2" as const
  };

  it("a fresh lesson shows no completed steps", () => {
    const workflow = deriveLessonWorkflow({ ...baseInput, currentStep: "understand" });
    expect(workflow.completedSteps).toEqual([]);
  });

  it("moving to experiment marks only understand completed", () => {
    const workflow = deriveLessonWorkflow({
      ...baseInput,
      currentStep: "experiment",
      visitedSteps: ["understand", "experiment"]
    });
    expect(workflow.completedSteps).toEqual(["understand"]);
  });

  it("running practice code marks experiment attempted/completed", () => {
    const workflow = deriveLessonWorkflow({
      ...baseInput,
      currentStep: "experiment",
      visitedSteps: ["understand", "experiment"],
      experimentAttempted: true
    });
    expect(workflow.completedSteps).toEqual(["understand", "experiment"]);
  });

  it("checked signals still mark apply/checkpoint/evidence completed", () => {
    const workflow = deriveLessonWorkflow({
      ...baseInput,
      currentStep: "evidence",
      miniProjectDone: true,
      quizDone: true,
      lessonDone: true,
      visitedSteps: ["understand", "experiment", "apply", "checkpoint", "evidence"]
    });
    expect(workflow.completedSteps).toEqual(["understand", "experiment", "apply", "checkpoint", "evidence"]);
  });
});

describe("PR05: level-0 conceptual starter contracts (native runner)", () => {
  it.each([
    ["lesson-python-zero-files-folders", 'print("py")', "py"],
    ["lesson-python-zero-terminal", 'print("python hello.py")', "python hello.py"]
  ])("%s: fails as shipped, passes with the one-line answer", (lessonId, answer) => {
    const lesson = contentPack.lessons.find((candidate) => candidate.id === lessonId)!;
    const spec = lesson.workshop.miniProject.runnerSpec;

    const shipped = runNativePythonProof(spec, lesson.id, spec.starterCode, "2026-09-28T12:00:00.000Z");
    expect(shipped.passed).toBe(false);

    const solved = runNativePythonProof(spec, lesson.id, answer, "2026-09-28T12:00:00.000Z");
    expect(solved.passed).toBe(true);
  });

  it("every level-0 lesson ships misconception-specific repairs and at least one transfer rep", () => {
    for (const lesson of contentPack.lessons.filter((candidate) => candidate.curriculum?.level === 0 && !candidate.curriculum?.deprecated)) {
      const checks = lesson.workshop.misconceptionChecks;
      expect(checks.length, lesson.id).toBeGreaterThan(0);
      expect(checks.every((check) => check.repair !== check.checkPrompt), lesson.id).toBe(true);

      const reps = lesson.workshop.practiceReps ?? [];
      expect(reps.some((rep) => rep.tier === "transfer" || rep.tier === "synthesize"), lesson.id).toBe(true);
    }
  });
});
