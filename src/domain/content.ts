import type { ContentPack, Lesson, Module, ProjectMission, Track } from "./types";

export function findTrack(content: ContentPack, trackId: string): Track | undefined {
  return content.tracks.find((track) => track.id === trackId);
}

export function findLesson(content: ContentPack, lessonId: string): Lesson | undefined {
  return content.lessons.find((lesson) => lesson.id === lessonId);
}

export function findMission(content: ContentPack, missionId: string): ProjectMission | undefined {
  return content.projectMissions.find((mission) => mission.id === missionId);
}

export function getModulesForTrack(content: ContentPack, trackId: string): Module[] {
  return content.modules
    .filter((moduleItem) => moduleItem.trackId === trackId)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

export function getLessonsForModule(content: ContentPack, moduleId: string): Lesson[] {
  const moduleItem = content.modules.find((candidate) => candidate.id === moduleId);

  if (!moduleItem) {
    return [];
  }

  return moduleItem.lessonIds
    .map((lessonId) => findLesson(content, lessonId))
    .filter((lesson): lesson is Lesson => Boolean(lesson));
}

export function getMissionsForTrack(content: ContentPack, trackId: string): ProjectMission[] {
  return content.projectMissions.filter((mission) => mission.trackId === trackId);
}
