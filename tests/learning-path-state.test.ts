import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { getLessonsForModule } from "@/domain/content";
import { normalizeCodeRunAttempt } from "@/domain/code-run";
import {
  getLessonArcs,
  getLessonCtaRule,
  getLessonStatus,
  getMissionReadiness,
  getModuleCtaLabel,
  getModuleStatus
} from "@/domain/learning-path";
import { createInitialProgress, recordCodeRunAttempt, setLessonCompletion } from "@/domain/progress";

const pythonModule = contentPack.modules.find((moduleItem) => moduleItem.id === "module-python-core")!;
const pythonLessons = getLessonsForModule(contentPack, pythonModule.id);
const cliMission = contentPack.projectMissions.find((mission) => mission.id === "mission-cli-study-tracker")!;

describe("learning path state model", () => {
  it("groups Python Core into named proof arcs", () => {
    const arcs = getLessonArcs(pythonModule, pythonLessons);

    expect(arcs.map((arc) => arc.title)).toEqual([
      "Python Basics",
      "Clean and Validate Data",
      "Build a Real CLI",
      "Package as Proof"
    ]);
    expect(arcs.flatMap((arc) => arc.lessonIndexes)).toHaveLength(17);
  });

  it("uses one canonical lesson status for roadmap cards", () => {
    const initialProgress = createInitialProgress();

    expect(getLessonStatus(pythonLessons[0], pythonLessons, initialProgress)).toBe("current");
    expect(getLessonStatus(pythonLessons[1], pythonLessons, initialProgress)).toBe("upcoming");

    const afterFirstLesson = setLessonCompletion(initialProgress, pythonLessons[0].id, true);
    expect(getLessonStatus(pythonLessons[0], pythonLessons, afterFirstLesson)).toBe("completed");
    expect(getLessonStatus(pythonLessons[1], pythonLessons, afterFirstLesson)).toBe("current");
  });

  it("treats started code work as in-progress before completion", () => {
    const progress = recordCodeRunAttempt(createInitialProgress(), normalizeCodeRunAttempt({
      id: "attempt-1",
      lessonId: pythonLessons[0].id,
      language: "python",
      codeSnapshot: "print('proof')",
      stdout: "proof",
      stderr: "",
      passed: false,
      score: 0,
      runtimeMs: 10,
      testResults: [],
      createdAt: "2026-05-08T00:00:00.000Z"
    }));

    expect(getLessonStatus(pythonLessons[0], pythonLessons, progress)).toBe("in_progress");
  });

  it("keeps primary CTA rules limited to current and continued work", () => {
    expect(getLessonCtaRule("current")).toMatchObject({ label: "Start lesson", variant: "primary" });
    expect(getLessonCtaRule("in_progress")).toMatchObject({ label: "Continue", variant: "primary" });
    expect(getLessonCtaRule("upcoming")).toMatchObject({ label: "Preview", variant: "secondary" });
    expect(getLessonCtaRule("completed")).toMatchObject({ label: "Review", variant: "secondary" });
  });

  it("moves a module from start to mission-ready with state-specific CTA labels", () => {
    const initialProgress = createInitialProgress();
    const completedProgress = pythonLessons.reduce(
      (currentProgress, lesson) => setLessonCompletion(currentProgress, lesson.id, true),
      initialProgress
    );

    expect(getModuleStatus(pythonLessons, [cliMission], initialProgress)).toBe("not_started");
    expect(getModuleCtaLabel(pythonModule, pythonLessons, [cliMission], initialProgress)).toBe("Start Python Core Proof");
    expect(getModuleStatus(pythonLessons, [cliMission], completedProgress)).toBe("mission_ready");
    expect(getModuleCtaLabel(pythonModule, pythonLessons, [cliMission], completedProgress)).toBe("Open portfolio missions");
  });

  it("explains mission readiness with lesson dependencies", () => {
    const readiness = getMissionReadiness(cliMission, pythonLessons, createInitialProgress());

    expect(readiness.status).toBe("locked");
    expect(readiness.dependencyText).toContain("Lessons 1-12");
    expect(readiness.supportedLessonIds).toHaveLength(12);
  });
});
