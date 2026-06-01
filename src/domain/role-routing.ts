import { DEFAULT_ROLE_TARGET_ID, legacyCareerPathIdMap, pathProofGates, roleTargets, type CareerUnlock, type PathProofGate } from "@/content/roles";
import { findLesson, getLessonsForModule, getModulesForTrack } from "@/domain/content";
import { getMissionProofChecklist, missionEvidenceMeetsRequirements, type MissionProofChecklistItem } from "@/domain/progress";
import type { ContentPack, Lesson, Module, ProjectMission, RoleTarget, UserProfile, UserProgress } from "@/domain/types";

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
    .find((lesson) => !progress.completedLessonIds.includes(lesson.id));
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
