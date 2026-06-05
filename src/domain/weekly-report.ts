import { getRelevantReviewEvents } from "./review";
import { getMissionsForRole, getLessonsForRole } from "./role-routing";
import type { ContentPack, UserProgress, WeeklyReportSnapshot } from "./types";
import { calculateReadinessScore } from "./readiness";

function weekStartFor(isoDate: string): string {
  const date = new Date(isoDate);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diff);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function countKnown(ids: string[], knownIds: Set<string>): number {
  return ids.filter((id) => knownIds.has(id)).length;
}

function relevantEvidence(content: ContentPack, progress: UserProgress) {
  const lessonIds = new Set(content.lessons.map((lesson) => lesson.id));
  const missionIds = new Set(content.projectMissions.map((mission) => mission.id));

  return progress.evidenceItems.filter((item) => {
    if (!item.linkedLessonId && !item.linkedProjectMissionId) {
      return false;
    }

    return (item.linkedLessonId ? lessonIds.has(item.linkedLessonId) : true)
      && (item.linkedProjectMissionId ? missionIds.has(item.linkedProjectMissionId) : true);
  });
}

export function createWeeklyReportSnapshot(content: ContentPack, progress: UserProgress, now = new Date().toISOString()): WeeklyReportSnapshot {
  const lessonIds = new Set(content.lessons.map((lesson) => lesson.id));
  const quizIds = new Set(content.quizzes.map((quiz) => quiz.id));
  const missionIds = new Set(content.projectMissions.map((mission) => mission.id));
  const evidence = relevantEvidence(content, progress);
  const passingEvidence = evidence.filter((item) => item.testStatus === "passing" && Boolean(item.verifierOutput));
  const reviewEvents = getRelevantReviewEvents(content, progress);
  const readiness = calculateReadinessScore(content, progress, now);
  const lessonsCompleted = countKnown(progress.completedLessonIds, lessonIds);
  const quizzesCompleted = countKnown(progress.completedQuizIds, quizIds);
  const missionsCompleted = countKnown(progress.completedProjectMissionIds, missionIds);
  const wins: string[] = [];
  const risks: string[] = [];
  const nextActions: string[] = [];
  const completedMissions = content.projectMissions.filter((mission) => progress.completedProjectMissionIds.includes(mission.id));
  const completedMissionTitles = completedMissions.map((mission) => mission.title);
  const portfolioBullets = completedMissions.slice(0, 4).map((mission) => {
    const missionEvidence = passingEvidence.find((item) => item.linkedProjectMissionId === mission.id);
    const proof = missionEvidence?.repoUrl ? `repo ${missionEvidence.repoUrl}` : "check-backed evidence";
    return `Built ${mission.title}; showed ${mission.skillIds.length} skills with ${proof}.`;
  });
  const projectGaps = content.projectMissions
    .filter((mission) => !progress.completedProjectMissionIds.includes(mission.id))
    .slice(0, 3)
    .map((mission) => `${mission.title}: ${mission.acceptanceCriteria[0]}`);
  const portfolioSummary = completedMissionTitles.length > 0
    ? `Portfolio evidence this week centers on ${completedMissionTitles.join(", ")}.`
    : "No completed project mission is portfolio-ready yet.";

  if (lessonsCompleted > 0) {
    wins.push(`${lessonsCompleted} lessons completed for this career path.`);
  }

  if (passingEvidence.length > 0) {
    wins.push(`${passingEvidence.length} passing evidence items recorded.`);
  }

  if (reviewEvents.length > 0) {
    wins.push(`${reviewEvents.length} recall reviews logged.`);
  }

  if (missionsCompleted === 0) {
    risks.push("No career-path project mission is complete yet.");
    const nextMission = getMissionsForRole(content, progress.profile.roleTargetId)
      .find((mission) => !progress.completedProjectMissionIds.includes(mission.id));
    if (nextMission) {
      nextActions.push(`Complete mission: ${nextMission.title}.`);
    }
  }

  if (passingEvidence.length === 0) {
    risks.push("No passing check-backed evidence is attached to this career path.");
    nextActions.push("Attach one repo or check output with passing test status.");
  }

  if (reviewEvents.length === 0) {
    risks.push("No recall review has been logged yet.");
    const nextLesson = getLessonsForRole(content, progress.profile.roleTargetId)
      .find((lesson) => progress.completedLessonIds.includes(lesson.id));
    nextActions.push(nextLesson ? `Review completed lesson: ${nextLesson.title}.` : "Complete one lesson to unlock recall review.");
  }

  if (nextActions.length === 0) {
    nextActions.push("Keep the loop: complete one mission, add check-backed evidence, then review it.");
  }

  const snapshot: WeeklyReportSnapshot = {
    id: `weekly-report-${progress.profile.roleTargetId}-${weekStartFor(now)}`,
    weekStart: weekStartFor(now),
    generatedAt: now,
    roleTargetId: progress.profile.roleTargetId,
    readinessScore: readiness.score,
    lessonsCompleted,
    quizzesCompleted,
    missionsCompleted,
    evidenceCount: evidence.length,
    passingEvidenceCount: passingEvidence.length,
    reviewEventsCount: reviewEvents.length,
    summary: `${readiness.score}% ready with ${passingEvidence.length} passing evidence item${passingEvidence.length === 1 ? "" : "s"}.`,
    wins: wins.length > 0 ? wins : ["Started the week with a clear career path."],
    risks,
    nextActions: nextActions.slice(0, 3),
    portfolioSummary,
    portfolioBullets,
    projectGaps
  };

  return {
    ...snapshot,
    portfolioMarkdown: [
      `# CareerForge Portfolio Report - ${snapshot.weekStart}`,
      "",
      `## Summary`,
      snapshot.portfolioSummary ?? snapshot.summary,
      "",
      "## Verified Project Bullets",
      ...(portfolioBullets.length > 0 ? portfolioBullets.map((bullet) => `- ${bullet}`) : ["- No portfolio-ready project bullets yet."]),
      "",
      "## Current Gaps",
      ...(projectGaps.length > 0 ? projectGaps.map((gap) => `- ${gap}`) : ["- No open project gaps for this career path."]),
      "",
      "## Next Actions",
      ...snapshot.nextActions.map((action) => `- ${action}`)
    ].join("\n")
  };
}

export function upsertWeeklyReport(reports: WeeklyReportSnapshot[], snapshot: WeeklyReportSnapshot): WeeklyReportSnapshot[] {
  return [snapshot, ...reports.filter((report) => report.id !== snapshot.id)];
}
