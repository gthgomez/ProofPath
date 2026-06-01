import { getRelevantReviewEvents } from "./review";
import type { ContentPack, EvidenceItem, ReadinessBreakdown, ReadinessScore, UserProgress } from "./types";

function percentage(completed: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return Math.round((completed / total) * 100);
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, Math.round(score)));
}

function countKnownCompleted(completedIds: string[], knownIds: Set<string>): number {
  return completedIds.filter((id) => knownIds.has(id)).length;
}

function reviewEventValue(rating: string): number {
  if (rating === "easy") {
    return 20;
  }

  if (rating === "good") {
    return 16;
  }

  if (rating === "hard") {
    return 8;
  }

  return 0;
}

function calculateReviewCadence(content: ContentPack, progress: UserProgress, now: string): number {
  const latestByTarget = new Map<string, { rating: string; reviewedAt: string; nextDueAt: string }>();

  for (const event of getRelevantReviewEvents(content, progress)) {
    const key = `${event.targetType}:${event.targetId}`;
    const latest = latestByTarget.get(key);

    if (!latest || Date.parse(event.reviewedAt) > Date.parse(latest.reviewedAt)) {
      latestByTarget.set(key, event);
    }
  }

  let score = 0;
  for (const event of latestByTarget.values()) {
    if (Date.parse(event.nextDueAt) >= Date.parse(now)) {
      score += reviewEventValue(event.rating);
    }
  }

  return clampScore(score);
}

function evidenceQuality(item: EvidenceItem): number {
  if (item.testStatus === "unknown" && !item.repoUrl && !item.commitHash && !item.verifierOutput && !item.artifactUri && !item.deploymentUrl) {
    return 0;
  }

  let score = item.testStatus === "passing" ? 12 : 0;

  if (item.repoUrl) {
    score += 14;
  }

  if (item.commitHash) {
    score += 12;
  }

  const hasPassingTests = item.testStatus === "passing";

  if (item.verifierOutput && hasPassingTests) {
    score += 14;
  }

  if (item.readmeStatus === "complete") {
    score += 14;
  } else if (item.readmeStatus === "basic") {
    score += 7;
  }

  if (item.artifactUri) {
    score += 10;
  }

  if (item.deploymentUrl && hasPassingTests) {
    score += 8;
  }

  if (item.reflection || item.body.length > 80) {
    score += 8;
  }

  if (item.linkedSkillIds.length > 0 && (item.repoUrl || item.commitHash || item.verifierOutput)) {
    score += 6;
  }

  if (!hasPassingTests) {
    return Math.min(45, score);
  }

  return Math.min(100, score);
}

export function calculateReadinessScore(content: ContentPack, progress: UserProgress, now = new Date().toISOString()): ReadinessScore {
  const lessonIds = new Set(content.lessons.map((lesson) => lesson.id));
  const quizIds = new Set(content.quizzes.map((quiz) => quiz.id));
  const missionIds = new Set(content.projectMissions.map((mission) => mission.id));
  const relevantEvidence = progress.evidenceItems.filter((item) => {
    if (!item.linkedLessonId && !item.linkedProjectMissionId) {
      return false;
    }

    const linkedLessonIsRelevant = item.linkedLessonId ? lessonIds.has(item.linkedLessonId) : true;
    const linkedMissionIsRelevant = item.linkedProjectMissionId ? missionIds.has(item.linkedProjectMissionId) : true;
    return linkedLessonIsRelevant && linkedMissionIsRelevant;
  });

  const lessonCompletion = percentage(countKnownCompleted(progress.completedLessonIds, lessonIds), content.lessons.length);
  const quizPerformance = percentage(countKnownCompleted(progress.completedQuizIds, quizIds), content.quizzes.length);
  const projectCompletion = percentage(countKnownCompleted(progress.completedProjectMissionIds, missionIds), content.projectMissions.length);

  const evidenceHygiene = clampScore(relevantEvidence.reduce((total, item) => total + evidenceQuality(item), 0));
  const reviewCadence = calculateReviewCadence(content, progress, now);

  const rawScore = clampScore(
    (lessonCompletion * 0.1)
    + (quizPerformance * 0.1)
    + (projectCompletion * 0.4)
    + (evidenceHygiene * 0.3)
    + (reviewCadence * 0.1)
  );
  const evidenceCappedScore = evidenceHygiene === 0 ? Math.min(rawScore, 69) : rawScore;
  const score = projectCompletion === 0 ? Math.min(evidenceCappedScore, 59) : evidenceCappedScore;

  const label = score >= 70 ? "portfolio-ready" : score >= 35 ? "building" : "starting";

  const breakdown: ReadinessBreakdown = {
    lessonCompletion,
    quizPerformance,
    projectCompletion,
    evidenceHygiene,
    reviewCadence
  };
  const weakestArea = (Object.entries(breakdown) as Array<[keyof ReadinessBreakdown, number]>)
    .sort((left, right) => left[1] - right[1])[0]?.[0] ?? "projectCompletion";
  const nextOpenMission = content.projectMissions.find((mission) => !progress.completedProjectMissionIds.includes(mission.id));
  const blockingProofRequirement = projectCompletion === 0
    ? "Complete one project mission before readiness can move beyond the building range."
    : evidenceHygiene === 0
      ? "Attach repo or check-backed evidence for completed work."
      : reviewCadence === 0
        ? "Log one recall review to keep completed work fresh."
        : "Keep deepening evidence quality with stronger artifacts and reflections.";
  const nextAction = nextOpenMission
    ? `Work next on ${nextOpenMission.title}: ${nextOpenMission.acceptanceCriteria[0]}.`
    : weakestArea === "evidenceHygiene"
      ? "Improve one evidence item with repo URL, check output, README status, and reflection."
      : weakestArea === "reviewCadence"
        ? "Review one completed lesson, quiz, or mission."
        : "Complete the next workshop lesson and attach evidence to a mission.";
  const explanation = [
    `Projects carry 40% of readiness; current project completion is ${projectCompletion}%.`,
    `Evidence quality carries 30%; current evidence hygiene is ${evidenceHygiene}%.`,
    blockingProofRequirement
  ];

  return {
    score,
    label,
    breakdown,
    nextAction,
    weakestArea,
    blockingProofRequirement,
    explanation
  };
}
