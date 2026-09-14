import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { runMiniProjectTest } from "@/domain/mini-project-tester";
import type { LessonMiniProject, LessonMiniProjectTester } from "@/domain/types";

const pythonLesson = contentPack.lessons.find((lesson) => lesson.id === "lesson-python-functions")!;

/**
 * Build a minimal lesson mini project so a test can exercise one tester rule
 * without depending on a specific lesson in the content pack. Defaults mirror
 * the shared default tester (including the generic forbidden terms).
 */
function makeMiniProject(tester: Partial<LessonMiniProjectTester> = {}): LessonMiniProject {
  const defaultTester: LessonMiniProjectTester = {
    codeLabel: "Code or artifact",
    outputLabel: "Terminal output",
    requiredCodeIncludes: [],
    requiredOutputIncludes: ["passed"],
    forbiddenOutputIncludes: ["traceback", "exception", "syntaxerror", "error:", "failed"],
    successMessage: "passed",
    failureMessage: "failed"
  };

  return {
    title: "Test mini project",
    goal: "Exercise one tester rule.",
    steps: ["Build", "Run", "Record"],
    deliverables: ["Code", "Output", "Note"],
    verifierCommand: "python test.py",
    expectedEvidence: "Output showing the check passed.",
    projectConnection: "Rehearsal for the larger mission.",
    tester: { ...defaultTester, ...tester },
    runnerSpec: {
      language: "python",
      instructions: "Run the code.",
      starterCode: "print('passed')",
      visibleTests: [],
      hiddenTests: [],
      expectedOutput: ["passed"],
      timeoutMs: 4000,
      memoryLimitMb: 128,
      allowNetwork: false
    }
  };
}

describe("mini project tester", () => {
  it("passes only when code proof and output requirements are present", () => {
    const result = runMiniProjectTest(pythonLesson.workshop.miniProject, {
      codeOrArtifact: "def group_minutes(sessions):\n    return {'python': 50, 'git': 15}",
      terminalOutput: "{'python': 50, 'git': 15}"
    });

    expect(result.passed).toBe(true);
  });

  it("blocks missing output and runtime error markers", () => {
    const result = runMiniProjectTest(pythonLesson.workshop.miniProject, {
      codeOrArtifact: "def group_minutes(sessions):\n    return {}",
      terminalOutput: "Traceback: NameError"
    });

    expect(result.passed).toBe(false);
    expect(result.missingOutputRequirements).toContain("python");
    expect(result.blockedOutputTerms).toContain("traceback");
  });

  it("does not block required exception output with the generic error: guard", () => {
    const miniProject = makeMiniProject({
      requiredCodeIncludes: ["undefined_variable", "try", "except", "NameError"],
      requiredOutputIncludes: ["NameError"]
    });

    const result = runMiniProjectTest(miniProject, {
      codeOrArtifact: "try:\n    print(undefined_variable)\nexcept NameError as error:\n    print(error)",
      terminalOutput: "NameError: name 'undefined_variable' is not defined"
    });

    expect(result.passed).toBe(true);
    expect(result.missingOutputRequirements).toEqual([]);
    expect(result.blockedOutputTerms).not.toContain("error:");
  });

  it("does not suppress a forbidden term a required term merely contains", () => {
    const miniProject = makeMiniProject({
      requiredOutputIncludes: ["error count: 0"],
      forbiddenOutputIncludes: ["error:"]
    });

    const result = runMiniProjectTest(miniProject, {
      codeOrArtifact: "print('error count: 0')",
      terminalOutput: "error count: 0\nValueError: unexpected failure"
    });

    expect(result.missingOutputRequirements).toEqual([]);
    expect(result.blockedOutputTerms).toContain("error:");
    expect(result.passed).toBe(false);
  });

  it("still blocks an unrequested traceback on a normal lesson", () => {
    const miniProject = makeMiniProject({ requiredOutputIncludes: ["passed"] });

    const result = runMiniProjectTest(miniProject, {
      codeOrArtifact: "def group_minutes(sessions):\n    return {}",
      terminalOutput: "Traceback (most recent call last):\nNameError: name 'sessions' is not defined"
    });

    expect(result.passed).toBe(false);
    expect(result.blockedOutputTerms).toContain("traceback");
    expect(result.blockedOutputTerms).toContain("error:");
  });

  it("does not self-block a required term that equals a forbidden term", () => {
    const miniProject = makeMiniProject({
      requiredOutputIncludes: ["failed"],
      forbiddenOutputIncludes: ["traceback", "failed"]
    });

    const result = runMiniProjectTest(miniProject, {
      codeOrArtifact: "print('failed')",
      terminalOutput: "failed"
    });

    expect(result.passed).toBe(true);
    expect(result.blockedOutputTerms).not.toContain("failed");
  });
});
