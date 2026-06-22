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
import { getPathNodes } from "@/domain/role-routing";

const pythonModule = {
  id: "module-python-core",
  trackId: "track-python",
  slug: "python-core",
  title: "Python Core",
  summary: "Python Core",
  lessonIds: [
    "lesson-python-zero-files-folders",
    "lesson-python-zero-terminal",
    "lesson-python-zero-first-script",
    "lesson-python-zero-change-rerun",
    "lesson-python-zero-first-error",
    "lesson-python-values",
    "lesson-python-collections",
    "lesson-python-decisions",
    "lesson-python-loops",
    "lesson-python-foundation-capstone",
    "lesson-python-strings-cleanup",
    "lesson-python-file-input",
    "lesson-python-parser-tests",
    "lesson-python-cli-arguments",
    "lesson-python-file-backed-cli",
    "lesson-python-cli-polish",
    "lesson-python-output-file",
    "lesson-python-rejected-row-report",
    "lesson-python-portfolio-proof",
    "lesson-python-core-review"
  ],
  projectMissionIds: ["mission-cli-study-tracker"],
  skillIds: [],
  sortOrder: 1
};
const pythonLessons = pythonModule.lessonIds.map((id) => contentPack.lessons.find((l) => l.id === id)!).filter(Boolean);
const pythonProfessionalModule = contentPack.modules.find((moduleItem) => moduleItem.id === "module-python-professional")!;
const pythonProfessionalLessons = getLessonsForModule(contentPack, pythonProfessionalModule.id);
const pythonIntegrationModule = contentPack.modules.find((moduleItem) => moduleItem.id === "module-python-dashboard")!;
const pythonIntegrationLessons = getLessonsForModule(contentPack, pythonIntegrationModule.id);
const cliMission = contentPack.projectMissions.find((mission) => mission.id === "mission-cli-study-tracker")!;

describe("learning path state model", () => {
  it("groups Python Core into named learning arcs", () => {
    const arcs = getLessonArcs(pythonModule, pythonLessons);

    expect(arcs.map((arc) => arc.title)).toEqual([
      "Python Basics",
      "Variables and Output",
      "Collections and Control Flow",
      "Functions",
      "Debugging and Assertions",
      "File I/O and CLI"
    ]);
    expect(arcs.flatMap((arc) => arc.lessonIndexes)).toHaveLength(39);
  });

  it("groups Python Professional and Integration into depth arcs", () => {
    const professionalArcs = getLessonArcs(pythonProfessionalModule, pythonProfessionalLessons);
    const integrationArcs = getLessonArcs(pythonIntegrationModule, pythonIntegrationLessons);

    expect(professionalArcs.map((arc) => arc.title)).toEqual([
      "Structure and Models",
      "Errors, Config, and Quality",
      "Professional Review Gate"
    ]);
    expect(professionalArcs.flatMap((arc) => arc.lessonIndexes)).toHaveLength(pythonProfessionalLessons.length);

    expect(integrationArcs.map((arc) => arc.title)).toEqual([
      "Validation and Services",
      "Persistence, APIs, and Mocks",
      "Dashboard Build and Review"
    ]);
    expect(integrationArcs.flatMap((arc) => arc.lessonIndexes)).toHaveLength(pythonIntegrationLessons.length);
  });

  it("uses one canonical lesson status for roadmap cards", () => {
    const initialProgress = createInitialProgress();

    expect(getLessonStatus(pythonLessons[0], pythonLessons, initialProgress)).toBe("current");
    expect(getLessonStatus(pythonLessons[1], pythonLessons, initialProgress)).toBe("locked");

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
    expect(getModuleCtaLabel(pythonModule, pythonLessons, [cliMission], initialProgress)).toBe("Start Python Core");
    expect(getModuleStatus(pythonLessons, [cliMission], completedProgress)).toBe("mission_ready");
    expect(getModuleCtaLabel(pythonModule, pythonLessons, [cliMission], completedProgress)).toBe("Open portfolio missions");
  });

  it("explains mission readiness with lesson dependencies", () => {
    const readiness = getMissionReadiness(cliMission, pythonLessons, createInitialProgress());

    expect(readiness.status).toBe("locked");
    expect(readiness.dependencyText).toContain("Lessons 1-12");
    expect(readiness.supportedLessonIds).toHaveLength(12);
  });

  it("marks placed-out lessons with status 'placed-out' in getPathNodes and doesn't block progression", () => {
    const progress = {
      ...createInitialProgress(),
      placedOutLessonIds: [pythonLessons[0].id]
    };
    
    const nodes = getPathNodes(contentPack, "track-python", progress);
    
    // The first node (placed out) should have status 'placed-out'
    const firstNode = nodes.find(n => n.id === pythonLessons[0].id);
    expect(firstNode).toBeDefined();
    expect(firstNode?.status).toBe("placed-out");

    // The second node should be 'current', not 'locked', because placed-out lessons are non-blocking
    const secondNode = nodes.find(n => n.id === pythonLessons[1].id);
    expect(secondNode).toBeDefined();
    expect(secondNode?.status).toBe("current");

    // The third node should be 'locked'
    const thirdNode = nodes.find(n => n.id === pythonLessons[2].id);
    expect(thirdNode).toBeDefined();
    expect(thirdNode?.status).toBe("locked");
  });
});
