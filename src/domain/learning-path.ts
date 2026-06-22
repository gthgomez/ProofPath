import type { Lesson, Module, ProjectMission, UserProgress } from "@/domain/types";
import { getMissionSupportedLessonIds, missionEvidenceMeetsRequirements, isLessonSatisfied } from "@/domain/progress";

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
    id: "variables-output",
    title: "Variables and Output",
    lessonIndexes: [5, 6, 7, 8, 9, 10],
    missionHint: "Store data and produce readable output."
  },
  {
    id: "collections-control-flow",
    title: "Collections and Control Flow",
    lessonIndexes: [11, 12, 13, 14, 15, 16],
    missionHint: "Lists, dicts, decisions, and loops with the module guard."
  },
  {
    id: "functions",
    title: "Functions",
    lessonIndexes: [17, 18, 19, 20, 21, 22],
    missionHint: "Decompose the tracker into reusable functions."
  },
  {
    id: "debugging-assertions",
    title: "Debugging and Assertions",
    lessonIndexes: [23, 24, 25, 26, 27, 28, 29],
    missionHint: "Read tracebacks, handle exceptions, and write regression tests."
  },
  {
    id: "file-io-cli",
    title: "File I/O and CLI",
    lessonIndexes: [30, 31, 32, 33, 34, 35, 36, 37, 38],
    missionHint: "Build a real CLI with file parsing, rejected rows, and portfolio proof."
  }
];

const moduleLessonArcs: Record<string, LessonArc[]> = {
  "module-python-professional": [
    {
      id: "python-professional-structure",
      title: "Structure and Models",
      lessonIndexes: [0, 1, 2],
      missionHint: "Turn scripts into package-shaped code with typed data and JSON output."
    },
    {
      id: "python-professional-operations",
      title: "Errors, Config, and Quality",
      lessonIndexes: [3, 4, 5, 6, 7, 8, 9],
      missionHint: "Add logging, metadata, installability, environments, config, and repeatable checks."
    },
    {
      id: "python-professional-review",
      title: "Professional Review Gate",
      lessonIndexes: [10],
      missionHint: "Confirm the package is maintainable before integration depth."
    }
  ],
  "module-python-dashboard": [
    {
      id: "python-dashboard-boundaries",
      title: "Validation and Services",
      lessonIndexes: [0, 1, 2],
      missionHint: "Harden input boundaries and prepare typed service state for the dashboard."
    },
    {
      id: "python-dashboard-data-api",
      title: "Persistence, APIs, and Mocks",
      lessonIndexes: [3, 4, 5],
      missionHint: "Connect SQLite repositories, safe API clients, and mocked test doubles."
    },
    {
      id: "python-dashboard-capstone",
      title: "Dashboard Build and Review",
      lessonIndexes: [6, 7],
      missionHint: "Build the dashboard, inspect failure paths, and choose one improvement."
    }
  ],
  "module-typescript-core": [
    {
      id: "typescript-contracts",
      title: "Type Contracts",
      lessonIndexes: [0, 1],
      missionHint: "Model data and validate external payloads before UI work."
    },
    {
      id: "typescript-state",
      title: "State Changes",
      lessonIndexes: [2],
      missionHint: "Connect typed events to the progress board."
    }
  ],
  "module-sql-core": [
    {
      id: "sql-query-questions",
      title: "Product Questions",
      lessonIndexes: [0],
      missionHint: "Use joins to find missing evidence."
    },
    {
      id: "sql-data-integrity",
      title: "Data Integrity",
      lessonIndexes: [1],
      missionHint: "Protect app data before reporting on it."
    }
  ],
  "module-secure-software-core": [
    {
      id: "security-risk-boundaries",
      title: "Risk and Boundaries",
      lessonIndexes: [0, 1, 2],
      missionHint: "Name threats, secrets, auth boundaries, and ownership checks first."
    },
    {
      id: "security-input-output",
      title: "Input and Output Safety",
      lessonIndexes: [3, 4],
      missionHint: "Reject bad input and encode user-controlled output."
    },
    {
      id: "security-release-hygiene",
      title: "Release Hygiene",
      lessonIndexes: [5],
      missionHint: "Review dependencies and logs before release."
    }
  ],
  "module-ai-apps": [
    {
      id: "ai-app-boundaries",
      title: "AI Boundaries",
      lessonIndexes: [0],
      missionHint: "Keep secrets and privileged actions server-side."
    },
    {
      id: "ai-grounding",
      title: "Grounded Answers",
      lessonIndexes: [1],
      missionHint: "Separate retrieval, answer drafting, and citation checks."
    }
  ],
  "module-cloud-platform-core": [
    {
      id: "cloud-config",
      title: "Config Safety",
      lessonIndexes: [0],
      missionHint: "Document config without leaking secrets."
    },
    {
      id: "cloud-release-ops",
      title: "Release and Ops",
      lessonIndexes: [1, 2, 3],
      missionHint: "Gate deploys, drill rollback, and watch logs."
    }
  ],
  "module-data-systems-core": [
    {
      id: "data-quality-contracts",
      title: "Quality Contracts",
      lessonIndexes: [0, 1, 2],
      missionHint: "Define trusted rows, fixtures, and rejected-row reasons."
    },
    {
      id: "data-lineage",
      title: "Lineage",
      lessonIndexes: [3],
      missionHint: "Explain where report rows came from."
    },
    {
      id: "data-reports",
      title: "Reproducible Reports",
      lessonIndexes: [4],
      missionHint: "Make reports rerunnable instead of screenshot-only."
    }
  ],
  "module-ml-core": [
    {
      id: "ml-metrics-context",
      title: "Metrics Context",
      lessonIndexes: [0],
      missionHint: "Read scores with split, sample size, and limits."
    },
    {
      id: "ml-error-patterns",
      title: "Error Patterns",
      lessonIndexes: [1],
      missionHint: "Use confusion matrices to find model failure modes."
    }
  ]
};

export function getLessonArcs(moduleItem: Module, lessons: Lesson[]): LessonArc[] {
  if (moduleItem.id === "module-python-core" && lessons.length >= 17) {
    return pythonCoreLessonArcs;
  }

  const configuredArcs = moduleLessonArcs[moduleItem.id];
  if (configuredArcs) {
    return configuredArcs
      .map((arc) => ({
        ...arc,
        lessonIndexes: arc.lessonIndexes.filter((lessonIndex) => lessonIndex < lessons.length)
      }))
      .filter((arc) => arc.lessonIndexes.length > 0);
  }

  return [{
    id: `${moduleItem.id}-core`,
    title: "Module Lessons",
    lessonIndexes: lessons.map((_, index) => index)
  }];
}

export function getNextLessonId(lessons: Lesson[], progress: UserProgress): string | undefined {
  return lessons.find((lesson) => !isLessonSatisfied(progress, lesson.id))?.id;
}

export function getLessonStatus(lesson: Lesson, lessons: Lesson[], progress: UserProgress): LessonStatus {
  if (isLessonSatisfied(progress, lesson.id)) {
    return "completed";
  }

  const latestRun = progress.codeRunAttempts.find((attempt) => attempt.lessonId === lesson.id);
  const quizStarted = progress.quizAttempts.some((attempt) => attempt.quizId === lesson.quizId);
  const miniProjectStarted = progress.completedLessonMiniProjectIds.includes(lesson.id) || Boolean(latestRun);

  if (quizStarted || miniProjectStarted) {
    return "in_progress";
  }

  return getNextLessonId(lessons, progress) === lesson.id ? "current" : "locked";
}

export function getModuleStatus(lessons: Lesson[], missions: ProjectMission[], progress: UserProgress): ModuleStatus {
  const completedLessons = lessons.filter((lesson) => isLessonSatisfied(progress, lesson.id)).length;
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
  const completedSupportedLessons = supportedLessonIds.filter((lessonId) => isLessonSatisfied(progress, lessonId)).length;
  const hasStarted = completedSupportedLessons > 0
    || progress.evidenceItems.some((item) => item.linkedProjectMissionId === mission.id);

  if (progress.completedProjectMissionIds.includes(mission.id)) {
    return {
      status: "completed",
      dependencyText: "Portfolio evidence complete.",
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
