import type { Lesson, Module, ProjectMission, UserProgress } from "@/domain/types";
import { getMissionSupportedLessonIds, missionEvidenceMeetsRequirements } from "@/domain/progress";

export type LessonStatus = "locked" | "upcoming" | "current" | "in_progress" | "completed";
export type MissionStatus = "locked" | "ready" | "in_progress" | "completed";
export type ModuleStatus = "not_started" | "in_progress" | "mission_ready" | "completed";
export type CtaVariant = "primary" | "secondary" | "tertiary";

export interface LessonArc {
  id: string;
  title: string;
  lessonIndexes: number[];
  missionHint?: string;
}

export interface LessonCtaRule {
  label: string;
  variant: CtaVariant;
  tone: "blue" | "teal" | "amber" | "rose" | "green" | "ink";
}

export interface MissionReadiness {
  status: MissionStatus;
  dependencyText: string;
  supportedLessonIds: string[];
}

export const pythonCoreLessonArcs: LessonArc[] = [
  {
    id: "python-basics",
    title: "Python Basics",
    lessonIndexes: [0, 1, 2, 3, 4],
    missionHint: "Build the first tracker slice."
  },
  {
    id: "clean-validate-data",
    title: "Clean and Validate Data",
    lessonIndexes: [5, 6, 7, 8, 9],
    missionHint: "Prepare parser and rejected-row proof."
  },
  {
    id: "real-cli",
    title: "Build a Real CLI",
    lessonIndexes: [10, 11, 12, 13, 14],
    missionHint: "Turn scripts into reviewer-friendly commands."
  },
  {
    id: "package-proof",
    title: "Package as Proof",
    lessonIndexes: [15, 16],
    missionHint: "Package evidence and pass the review gate."
  }
];

export function getLessonArcs(moduleItem: Module, lessons: Lesson[]): LessonArc[] {
  if (moduleItem.id === "module-python-core" && lessons.length >= 17) {
    return pythonCoreLessonArcs;
  }

  return [{
    id: `${moduleItem.id}-core`,
    title: "Module Lessons",
    lessonIndexes: lessons.map((_, index) => index)
  }];
}

export function getNextLessonId(lessons: Lesson[], progress: UserProgress): string | undefined {
  return lessons.find((lesson) => !progress.completedLessonIds.includes(lesson.id))?.id;
}

export function getLessonStatus(lesson: Lesson, lessons: Lesson[], progress: UserProgress): LessonStatus {
  if (progress.completedLessonIds.includes(lesson.id)) {
    return "completed";
  }

  const latestRun = progress.codeRunAttempts.find((attempt) => attempt.lessonId === lesson.id);
  const quizStarted = progress.quizAttempts.some((attempt) => attempt.quizId === lesson.quizId);
  const miniProjectStarted = progress.completedLessonMiniProjectIds.includes(lesson.id) || Boolean(latestRun);

  if (quizStarted || miniProjectStarted) {
    return "in_progress";
  }

  return getNextLessonId(lessons, progress) === lesson.id ? "current" : "upcoming";
}

export function getModuleStatus(lessons: Lesson[], missions: ProjectMission[], progress: UserProgress): ModuleStatus {
  const completedLessons = lessons.filter((lesson) => progress.completedLessonIds.includes(lesson.id)).length;
  const completedMissions = missions.filter((mission) => progress.completedProjectMissionIds.includes(mission.id)).length;

  if (completedLessons === lessons.length && completedMissions === missions.length) {
    return "completed";
  }

  if (completedLessons === lessons.length) {
    return "mission_ready";
  }

  return completedLessons > 0 ? "in_progress" : "not_started";
}

export function getModuleCtaLabel(moduleItem: Module, lessons: Lesson[], missions: ProjectMission[], progress: UserProgress): string {
  const status = getModuleStatus(lessons, missions, progress);

  if (status === "completed") {
    return `Review ${moduleItem.title}`;
  }

  if (status === "mission_ready") {
    return "Open portfolio missions";
  }

  if (status === "in_progress") {
    return `Continue ${moduleItem.title}`;
  }

  return `Start ${moduleItem.title}`;
}

export function getLessonCtaRule(status: LessonStatus): LessonCtaRule {
  switch (status) {
    case "completed":
      return { label: "Review", variant: "secondary", tone: "ink" };
    case "in_progress":
      return { label: "Continue", variant: "primary", tone: "blue" };
    case "current":
      return { label: "Start lesson", variant: "primary", tone: "blue" };
    case "locked":
      return { label: "Locked", variant: "secondary", tone: "ink" };
    case "upcoming":
      return { label: "Preview", variant: "secondary", tone: "blue" };
  }
}

export function getMissionReadiness(mission: ProjectMission, lessons: Lesson[], progress: UserProgress): MissionReadiness {
  const supportedLessonIds = getMissionSupportedLessonIds(mission, lessons);
  const completedSupportedLessons = supportedLessonIds.filter((lessonId) => progress.completedLessonIds.includes(lessonId)).length;
  const hasStarted = completedSupportedLessons > 0
    || progress.evidenceItems.some((item) => item.linkedProjectMissionId === mission.id);

  if (progress.completedProjectMissionIds.includes(mission.id)) {
    return {
      status: "completed",
      dependencyText: "Portfolio proof complete.",
      supportedLessonIds
    };
  }

  if (completedSupportedLessons === supportedLessonIds.length && missionEvidenceMeetsRequirements(progress, mission)) {
    return {
      status: "ready",
      dependencyText: "Preparation and evidence are complete. Mission award will be captured automatically.",
      supportedLessonIds
    };
  }

  if (completedSupportedLessons === supportedLessonIds.length) {
    return {
      status: hasStarted ? "in_progress" : "ready",
      dependencyText: `Lessons ${formatLessonRange(supportedLessonIds, lessons)} are complete. Add required evidence to earn the mission award.`,
      supportedLessonIds
    };
  }

  return {
    status: "locked",
    dependencyText: `Supported by Lessons ${formatLessonRange(supportedLessonIds, lessons)}.`,
    supportedLessonIds
  };
}

export function formatLessonRange(lessonIds: string[], lessons: Lesson[]): string {
  const positions = lessonIds
    .map((lessonId) => lessons.findIndex((lesson) => lesson.id === lessonId) + 1)
    .filter((position) => position > 0);

  if (positions.length === 0) {
    return "for this module";
  }

  return `${Math.min(...positions)}-${Math.max(...positions)}`;
}

export function formatEstimatedMinutes(lessons: Lesson[]): string {
  const totalMinutes = lessons.reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0);

  return `${totalMinutes} min`;
}
