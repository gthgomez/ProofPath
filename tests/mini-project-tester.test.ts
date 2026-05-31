import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { runMiniProjectTest } from "@/domain/mini-project-tester";

const pythonLesson = contentPack.lessons.find((lesson) => lesson.id === "lesson-python-functions")!;

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
});
