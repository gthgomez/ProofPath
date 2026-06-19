import { DEFAULT_ROLE_TARGET_ID, legacyCareerPathIdMap, pathProofGates, roleTargets, type CareerUnlock, type PathProofGate } from "@/content/roles";
import { findLesson, getLessonsForModule, getModulesForTrack } from "@/domain/content";
import { getMissionProofChecklist, missionEvidenceMeetsRequirements, isLessonSatisfied, getProofCompletedLessonIds, type MissionProofChecklistItem } from "@/domain/progress";
import type { ContentPack, Lesson, Module, ProjectMission, RoleTarget, UserProfile, UserProgress } from "@/domain/types";
import { getLessonStatus, getMissionReadiness } from "@/domain/learning-path";

export function getRoleTarget(roleTargetId?: string): RoleTarget {
  const normalizedRoleTargetId = roleTargetId ? legacyCareerPathIdMap[roleTargetId] ?? roleTargetId : roleTargetId;

  return roleTargets.find((roleTarget) => roleTarget.id === normalizedRoleTargetId)
    ?? roleTargets.find((roleTarget) => roleTarget.default)
    ?? roleTargets[0];
}

export function isOnboardingComplete(profile: UserProfile): boolean {
  return Boolean(profile.onboardingCompletedAt);
}

export function getTracksForRole(content: ContentPack, roleTargetId = DEFAULT_ROLE_TARGET_ID) {
  const roleTarget = getRoleTarget(roleTargetId);
  const orderedTracks = roleTarget.trackIds
    .map((trackId) => content.tracks.find((track) => track.id === trackId))
    .filter((track): track is ContentPack["tracks"][number] => Boolean(track));

  if (orderedTracks.length > 0) {
    return orderedTracks;
  }

  return content.tracks;
}

export function getRoleTrackIds(content: ContentPack, roleTargetId = DEFAULT_ROLE_TARGET_ID): Set<string> {
  return new Set(getTracksForRole(content, roleTargetId).map((track) => track.id));
}

export function getLessonsForRole(content: ContentPack, roleTargetId = DEFAULT_ROLE_TARGET_ID): Lesson[] {
  return getTracksForRole(content, roleTargetId)
    .flatMap((track) => getModulesForTrack(content, track.id))
    .flatMap((moduleItem) => getLessonsForModule(content, moduleItem.id));
}

export function getMissionsForRole(content: ContentPack, roleTargetId = DEFAULT_ROLE_TARGET_ID): ProjectMission[] {
  return getTracksForRole(content, roleTargetId)
    .flatMap((track) => content.projectMissions.filter((mission) => mission.trackId === track.id));
}

export function getModulesForRole(content: ContentPack, roleTargetId = DEFAULT_ROLE_TARGET_ID): Module[] {
  return getTracksForRole(content, roleTargetId)
    .flatMap((track) => getModulesForTrack(content, track.id));
}

export function getContentForRole(content: ContentPack, roleTargetId = DEFAULT_ROLE_TARGET_ID): ContentPack {
  const tracks = getTracksForRole(content, roleTargetId);
  const modules = getModulesForRole(content, roleTargetId);
  const lessons = getLessonsForRole(content, roleTargetId);
  const missions = getMissionsForRole(content, roleTargetId);
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  const missionIds = new Set(missions.map((mission) => mission.id));
  const skillIds = new Set([
    ...modules.flatMap((moduleItem) => moduleItem.skillIds),
    ...lessons.flatMap((lesson) => lesson.skillIds),
    ...missions.flatMap((mission) => mission.skillIds)
  ]);

  return {
    ...content,
    tracks,
    modules,
    lessons,
    quizzes: content.quizzes.filter((quiz) => lessonIds.has(quiz.lessonId)),
    projectMissions: missions,
    skills: content.skills.filter((skill) => skillIds.has(skill.id)),
    skillEdges: content.skillEdges.filter((edge) => skillIds.has(edge.fromSkillId) && skillIds.has(edge.toSkillId)),
    weeklyPlan: {
      ...content.weeklyPlan,
      tasks: content.weeklyPlan.tasks.filter((task) => {
        return (task.linkedLessonId ? lessonIds.has(task.linkedLessonId) : false)
          || (task.linkedProjectMissionId ? missionIds.has(task.linkedProjectMissionId) : false);
      })
    }
  };
}

export function getNextLessonForRole(content: ContentPack, progress: UserProgress): Lesson | undefined {
  return getLessonsForRole(content, progress.profile.roleTargetId)
    .find((lesson) => !isLessonSatisfied(progress, lesson.id));
}

export function getNextMissionForRole(content: ContentPack, progress: UserProgress): ProjectMission | undefined {
  return getMissionsForRole(content, progress.profile.roleTargetId)
    .find((mission) => !progress.completedProjectMissionIds.includes(mission.id));
}

export function getFirstLessonForModule(content: ContentPack, lessonIds: string[]): Lesson | undefined {
  return lessonIds
    .map((lessonId) => findLesson(content, lessonId))
    .find((lesson): lesson is Lesson => Boolean(lesson));
}

export interface RoleTrackOnboardingSummary {
  trackCount: number;
  includedTrackTitles: string[];
  excludedTrackTitles: string[];
}

export function getRoleTrackOnboardingSummary(content: ContentPack, roleTargetId: string): RoleTrackOnboardingSummary {
  const includedTracks = getTracksForRole(content, roleTargetId);
  const includedTrackIds = new Set(includedTracks.map((track) => track.id));

  return {
    trackCount: includedTracks.length,
    includedTrackTitles: includedTracks.map((track) => track.title),
    excludedTrackTitles: content.tracks
      .filter((track) => !includedTrackIds.has(track.id))
      .map((track) => track.title)
  };
}

export type FutureUnlockLabel = "Roadmap" | "Locked specialization" | "Coming later";

export interface PathProofMissionStatus {
  missionId: string;
  title: string;
  complete: boolean;
  checklist: MissionProofChecklistItem[];
}

export interface PathProofGateStatus {
  gate: PathProofGate;
  complete: boolean;
  completedMissionCount: number;
  requiredMissionCount: number;
  missions: PathProofMissionStatus[];
}

export interface FutureUnlockStatus extends CareerUnlock {
  label: FutureUnlockLabel;
  availableInContent: boolean;
  gateComplete: boolean;
}

export function getPathProofGateForRole(roleTargetId: string): PathProofGate | undefined {
  const roleTarget = getRoleTarget(roleTargetId);
  return pathProofGates.find((gate) => gate.pathId === roleTarget.id);
}

export function evaluatePathProofGate(content: ContentPack, progress: UserProgress, roleTargetId = progress.profile.roleTargetId): PathProofGateStatus | undefined {
  const gate = getPathProofGateForRole(roleTargetId);

  if (!gate) {
    return undefined;
  }

  const missions = gate.requiredMissionIds.map((missionId) => {
    const mission = content.projectMissions.find((candidate) => candidate.id === missionId);
    const checklist = mission ? getMissionProofChecklist(progress, mission) : [];
    const complete = mission
      ? progress.completedProjectMissionIds.includes(mission.id) && missionEvidenceMeetsRequirements(progress, mission)
      : false;

    return {
      missionId,
      title: mission?.title ?? missionId,
      complete,
      checklist
    };
  });
  const completedMissionCount = missions.filter((mission) => mission.complete).length;

  return {
    gate,
    complete: missions.length > 0 && completedMissionCount === missions.length,
    completedMissionCount,
    requiredMissionCount: missions.length,
    missions
  };
}

export function getFutureUnlocksForRole(content: ContentPack, progress: UserProgress, roleTargetId = progress.profile.roleTargetId): FutureUnlockStatus[] {
  const gateStatus = evaluatePathProofGate(content, progress, roleTargetId);

  if (!gateStatus) {
    return [];
  }

  return gateStatus.gate.unlocks.map((unlock) => {
    const availableInContent = unlock.kind === "path"
      ? roleTargets.some((roleTarget) => roleTarget.id === unlock.id)
      : content.tracks.some((track) => track.id === unlock.id);
    const label: FutureUnlockLabel = availableInContent
      ? gateStatus.complete
        ? "Roadmap"
        : "Locked specialization"
      : "Coming later";

    return {
      ...unlock,
      label,
      availableInContent,
      gateComplete: gateStatus.complete
    };
  });
}

export function isGitTrackCompleted(content: ContentPack, progress: UserProgress): boolean {
  const gitModules = content.modules.filter((m) => m.trackId === "track-git");
  const gitLessons = gitModules.flatMap((m) => {
    return m.lessonIds.map((id) => content.lessons.find((l) => l.id === id)).filter(Boolean);
  });
  if (gitLessons.length === 0) {
    return false;
  }
  return gitLessons.every((l) => isLessonSatisfied(progress, l!.id));
}

export interface PathNode {
  id: string;
  title: string;
  type: "lesson" | "mission";
  status: "completed" | "current" | "upcoming" | "locked" | "placed-out";
  estimatedMinutes?: number;
  difficulty?: string;
  language?: string;
}

export function getPathNodes(content: ContentPack, trackId: string, progress: UserProgress): PathNode[] {
  const modules = getModulesForTrack(content, trackId);
  const nodes: PathNode[] = [];

  for (const moduleItem of modules) {
    const lessons = getLessonsForModule(content, moduleItem.id);
    for (const lesson of lessons) {
      nodes.push({
        id: lesson.id,
        title: lesson.title,
        type: "lesson",
        status: (() => {
          const lStatus = getLessonStatus(lesson, lessons, progress);
          return lStatus === "in_progress" ? "current" : lStatus;
        })(),
        estimatedMinutes: lesson.estimatedMinutes,
        difficulty: lesson.difficulty,
        language: lesson.workshop.language
      });
    }

    const missions = moduleItem.projectMissionIds
      .map((missionId) => content.projectMissions.find((m) => m.id === missionId))
      .filter((m): m is ProjectMission => Boolean(m));
    for (const mission of missions) {
      const readiness = getMissionReadiness(mission, lessons, progress);
      const status: PathNode["status"] =
        readiness.status === "completed"
          ? "completed"
          : readiness.status === "ready" || readiness.status === "in_progress"
            ? "current"
            : "locked";
      nodes.push({
        id: mission.id,
        title: mission.title,
        type: "mission",
        status,
        difficulty: mission.difficulty
      });
    }
  }

  // Sequential Locking Post-processing:
  let foundFirstUncompleted = false;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isCompleted = node.type === "lesson"
      ? getProofCompletedLessonIds(progress).includes(node.id)
      : progress.completedProjectMissionIds.includes(node.id);
    const isPlacedOut = node.type === "lesson" && (progress.placedOutLessonIds || []).includes(node.id);

    if (isCompleted) {
      node.status = "completed";
    } else if (isPlacedOut) {
      node.status = "placed-out";
    } else if (!foundFirstUncompleted) {
      node.status = "current";
      foundFirstUncompleted = true;
    } else {
      node.status = "locked";
    }
  }

  return nodes;
}
