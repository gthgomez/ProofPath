import { DEFAULT_ROLE_TARGET_ID, legacyCareerPathIdMap } from "@/content/roles";
import { createProofArtifactFromAttempt, formatProofArtifactVerifierOutput, normalizeCodeRunAttempt } from "@/domain/code-run";
import { advanceReviewItem, createReviewItem, recordReviewEvent, removeReviewItem, reviewKey, upsertReviewItem } from "@/domain/review";
import { createWeeklyReportSnapshot, upsertWeeklyReport } from "@/domain/weekly-report";
import type { CodeRunAttempt, ContentPack, EvidenceItem, EvidenceTestStatus, EvidenceTrustClassification, EvidenceType, Lesson, ProjectMission, ProofArtifact, Quiz, QuizAttempt, ReadmeStatus, ReviewRating, ReviewTargetType, UserProfile, UserProgress, WeeklyPlanTask } from "./types";

export interface MissionProofChecklistItem {
  id: string;
  label: string;
  required: boolean;
  complete: boolean;
}

interface EvidenceDraft {
  type: EvidenceType;
  title: string;
  body: string;
  linkedProjectMissionId?: string;
  linkedLessonId?: string;
  linkedSkillIds?: string[];
  uri?: string;
  repoUrl?: string;
  commitHash?: string;
  testStatus?: EvidenceTestStatus;
  artifactUri?: string;
  readmeStatus?: ReadmeStatus;
  deploymentUrl?: string;
  verifierOutput?: string;
  reflection?: string;
  proofArtifact?: ProofArtifact;
  trust?: EvidenceTrustClassification;
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values));
}

function withTimestamp(progress: Omit<UserProgress, "updatedAt">, now: string): UserProgress {
  return {
    ...progress,
    profile: {
      ...progress.profile,
      updatedAt: progress.profile.updatedAt || now
    },
    completedLessonIds: uniqueValues(progress.completedLessonIds),
    completedLessonMiniProjectIds: uniqueValues(progress.completedLessonMiniProjectIds),
    completedQuizIds: uniqueValues(progress.completedQuizIds),
    completedProjectMissionIds: uniqueValues(progress.completedProjectMissionIds),
    completedProjectMissionDeliverableIds: uniqueValues(progress.completedProjectMissionDeliverableIds),
    completedProjectMissionPhaseIds: uniqueValues(progress.completedProjectMissionPhaseIds),
    weeklyPlanTaskIds: uniqueValues(progress.weeklyPlanTaskIds),
    codeRunAttempts: progress.codeRunAttempts.map(normalizeCodeRunAttempt).slice(0, 250),
    updatedAt: now
  };
}

type StoredEvidenceItem = Omit<EvidenceItem, "linkedSkillIds" | "testStatus" | "readmeStatus">
  & Partial<Pick<EvidenceItem, "linkedSkillIds" | "testStatus" | "readmeStatus" | "trust">>;

function normalizeEvidenceItem(item: StoredEvidenceItem): EvidenceItem {
  const verifierOutput = item.verifierOutput?.trim();
  return {
    ...item,
    linkedSkillIds: item.linkedSkillIds ?? [],
    testStatus: item.testStatus ?? "unknown",
    readmeStatus: item.readmeStatus ?? "missing",
    trust: item.trust ?? (
      item.proofArtifact
        ? "auto_verified_code_lab"
        : verifierOutput
          ? "manual_verifier_output"
          : "manual_note"
    )
  };
}

function isUrlLike(value: string): boolean {
  return /^https?:\/\/[^\s]+$/i.test(value.trim());
}

function isCommitHashLike(value: string): boolean {
  return /^[a-f0-9]{7,40}$/i.test(value.trim());
}

function optionalTrimmed(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

export function validateEvidenceDraft(draft: EvidenceDraft): string | null {
  if (draft.title.trim().length === 0 || draft.body.trim().length === 0) {
    return "Evidence needs a title and note.";
  }

  const repoUrl = optionalTrimmed(draft.repoUrl);
  const artifactUri = optionalTrimmed(draft.artifactUri);
  const deploymentUrl = optionalTrimmed(draft.deploymentUrl);
  const commitHash = optionalTrimmed(draft.commitHash);

  if (repoUrl && !isUrlLike(repoUrl)) {
    return "Repo URL must start with http:// or https://.";
  }

  if (artifactUri && !isUrlLike(artifactUri)) {
    return "Artifact link must start with http:// or https://.";
  }

  if (deploymentUrl && !isUrlLike(deploymentUrl)) {
    return "Deployment link must start with http:// or https://.";
  }

  if (commitHash && !isCommitHashLike(commitHash)) {
    return "Commit hash should be 7 to 40 hexadecimal characters.";
  }

  if (draft.testStatus === "passing" && !optionalTrimmed(draft.verifierOutput)) {
    return "Passing test evidence needs check output.";
  }

  return null;
}

function setMembership(values: string[], id: string, completed: boolean): string[] {
  const valueSet = new Set(values);

  if (completed) {
    valueSet.add(id);
  } else {
    valueSet.delete(id);
  }

  return Array.from(valueSet);
}

function createEvidenceItemFromProof(proof: ProofArtifact, now: string): EvidenceItem {
  return {
    id: `evidence-proof-${proof.sourceRunAttemptId}`,
    type: "test-output",
    title: `Code Lab proof: ${proof.lessonId}`,
    body: "Passing Run checks output captured automatically from the professional code lab.",
    linkedLessonId: proof.lessonId,
    linkedSkillIds: [],
    testStatus: "passing",
    readmeStatus: "missing",
    verifierOutput: formatProofArtifactVerifierOutput(proof),
    proofArtifact: proof,
    trust: "auto_verified_code_lab",
    createdAt: now
  };
}

export function createInitialProfile(now = new Date().toISOString()): UserProfile {
  return {
    roleTargetId: DEFAULT_ROLE_TARGET_ID,
    createdAt: now,
    updatedAt: now
  };
}

function normalizeCareerPathId(roleTargetId?: string): string {
  if (!roleTargetId) {
    return DEFAULT_ROLE_TARGET_ID;
  }

  return legacyCareerPathIdMap[roleTargetId] ?? roleTargetId;
}

type StoredProgress = Omit<UserProgress, "profile" | "evidenceItems" | "quizAttempts" | "codeRunAttempts" | "completedLessonMiniProjectIds" | "completedProjectMissionDeliverableIds" | "completedProjectMissionPhaseIds" | "reviewItems" | "reviewEvents" | "weeklyReports">
  & { evidenceItems: StoredEvidenceItem[] }
  & Partial<Pick<UserProgress, "profile" | "quizAttempts" | "codeRunAttempts" | "completedLessonMiniProjectIds" | "completedProjectMissionDeliverableIds" | "completedProjectMissionPhaseIds" | "reviewItems" | "reviewEvents" | "weeklyReports">>;

export function ensureProgressProfile(progress: StoredProgress, now = new Date().toISOString()): UserProgress {
  const fallbackProfile = createInitialProfile(now);

  return {
    ...progress,
    profile: {
      ...fallbackProfile,
      ...progress.profile,
      roleTargetId: normalizeCareerPathId(progress.profile?.roleTargetId),
      createdAt: progress.profile?.createdAt || progress.updatedAt || now,
      updatedAt: progress.profile?.updatedAt || progress.updatedAt || now
    },
    evidenceItems: progress.evidenceItems.map(normalizeEvidenceItem),
    quizAttempts: progress.quizAttempts ?? [],
    codeRunAttempts: (progress.codeRunAttempts ?? []).map(normalizeCodeRunAttempt),
    completedLessonMiniProjectIds: progress.completedLessonMiniProjectIds ?? [],
    completedProjectMissionDeliverableIds: progress.completedProjectMissionDeliverableIds ?? [],
    completedProjectMissionPhaseIds: progress.completedProjectMissionPhaseIds ?? [],
    reviewItems: progress.reviewItems ?? [],
    reviewEvents: progress.reviewEvents ?? [],
    weeklyReports: progress.weeklyReports ?? []
  };
}

export function createInitialProgress(now = new Date().toISOString()): UserProgress {
  return {
    profile: createInitialProfile(now),
    completedLessonIds: [],
    completedLessonMiniProjectIds: [],
    completedQuizIds: [],
    completedProjectMissionIds: [],
    completedProjectMissionDeliverableIds: [],
    completedProjectMissionPhaseIds: [],
    evidenceItems: [],
    quizAttempts: [],
    codeRunAttempts: [],
    weeklyPlanTaskIds: [],
    reviewItems: [],
    reviewEvents: [],
    weeklyReports: [],
    updatedAt: now
  };
}

export function setRoleTarget(progress: UserProgress, roleTargetId: string, completedOnboarding = true, now = new Date().toISOString()): UserProgress {
  const normalizedRoleTargetId = normalizeCareerPathId(roleTargetId);

  return withTimestamp({
    ...progress,
    profile: {
      ...progress.profile,
      roleTargetId: normalizedRoleTargetId,
      onboardingCompletedAt: completedOnboarding ? progress.profile.onboardingCompletedAt ?? now : progress.profile.onboardingCompletedAt,
      updatedAt: now
    }
  }, now);
}

export function setLessonCompletion(progress: UserProgress, lessonId: string, completed: boolean, now = new Date().toISOString()): UserProgress {
  return withTimestamp({
    ...progress,
    completedLessonIds: setMembership(progress.completedLessonIds, lessonId, completed),
    reviewItems: completed
      ? upsertReviewItem(progress.reviewItems, "lesson", lessonId, now)
      : removeReviewItem(progress.reviewItems, "lesson", lessonId)
  }, now);
}

export function setLessonMiniProjectCompletion(progress: UserProgress, lessonId: string, completed: boolean, now = new Date().toISOString()): UserProgress {
  return withTimestamp({
    ...progress,
    completedLessonMiniProjectIds: setMembership(progress.completedLessonMiniProjectIds, lessonId, completed)
  }, now);
}

export function recordCodeRunAttempt(progress: UserProgress, attempt: CodeRunAttempt, now = new Date().toISOString()): UserProgress {
  const normalizedAttempt = normalizeCodeRunAttempt(attempt);
  const proofArtifact = createProofArtifactFromAttempt(normalizedAttempt);
  const proofEvidence = proofArtifact ? createEvidenceItemFromProof(proofArtifact, now) : null;

  return withTimestamp({
    ...progress,
    codeRunAttempts: [normalizedAttempt, ...progress.codeRunAttempts].slice(0, 250),
    evidenceItems: proofEvidence ? [proofEvidence, ...progress.evidenceItems] : progress.evidenceItems,
    completedLessonMiniProjectIds: setMembership(
      progress.completedLessonMiniProjectIds,
      normalizedAttempt.lessonId,
      normalizedAttempt.runMode === "run_checks" && normalizedAttempt.passed
    )
  }, now);
}

export function setQuizCompletion(progress: UserProgress, quizId: string, completed: boolean, now = new Date().toISOString()): UserProgress {
  return withTimestamp({
    ...progress,
    completedQuizIds: setMembership(progress.completedQuizIds, quizId, completed),
    reviewItems: completed
      ? upsertReviewItem(progress.reviewItems, "quiz", quizId, now)
      : removeReviewItem(progress.reviewItems, "quiz", quizId)
  }, now);
}

function missionDeliverableId(missionId: string, deliverableIndex: number): string {
  return `${missionId}:${deliverableIndex}`;
}

function missionPhaseId(missionId: string, phaseId: string): string {
  return `${missionId}:${phaseId}`;
}

export function setMissionDeliverableCompletion(progress: UserProgress, missionId: string, deliverableIndex: number, completed: boolean, now = new Date().toISOString()): UserProgress {
  return withTimestamp({
    ...progress,
    completedProjectMissionDeliverableIds: setMembership(
      progress.completedProjectMissionDeliverableIds,
      missionDeliverableId(missionId, deliverableIndex),
      completed
    )
  }, now);
}

export function setMissionPhaseCompletion(progress: UserProgress, missionId: string, phaseId: string, completed: boolean, now = new Date().toISOString()): UserProgress {
  return withTimestamp({
    ...progress,
    completedProjectMissionPhaseIds: setMembership(
      progress.completedProjectMissionPhaseIds,
      missionPhaseId(missionId, phaseId),
      completed
    )
  }, now);
}

export function hasVerifierBackedMissionEvidence(progress: UserProgress, missionId: string): boolean {
  return progress.evidenceItems.some((item) => (
    item.linkedProjectMissionId === missionId
    && item.testStatus === "passing"
    && Boolean(item.verifierOutput)
  ));
}

function readmeMeetsRequirement(actual: ReadmeStatus, required: ReadmeStatus): boolean {
  if (required === "missing") {
    return true;
  }

  if (required === "basic") {
    return actual === "basic" || actual === "complete";
  }

  return actual === "complete";
}

function getLinkedMissionEvidence(progress: UserProgress, missionId: string): EvidenceItem[] {
  return progress.evidenceItems.filter((item) => item.linkedProjectMissionId === missionId);
}

export function getMissionProofChecklist(progress: UserProgress, mission: ProjectMission): MissionProofChecklistItem[] {
  const linkedEvidence = getLinkedMissionEvidence(progress, mission.id);
  const requirements = mission.evidenceRequirements;
  const hasRepoUrl = linkedEvidence.some((item) => Boolean(item.repoUrl));
  const hasCommitHash = linkedEvidence.some((item) => Boolean(item.commitHash));
  const hasPassingVerifierOutput = linkedEvidence.some((item) => item.testStatus === "passing" && Boolean(item.verifierOutput));
  const hasRequiredReadme = linkedEvidence.some((item) => readmeMeetsRequirement(item.readmeStatus, requirements.readmeStatus));
  const hasArtifactOrDeployment = linkedEvidence.some((item) => Boolean(item.artifactUri || item.deploymentUrl));
  const hasReflection = linkedEvidence.some((item) => Boolean(item.reflection) || item.body.trim().length >= 120);

  return [
    { id: "repo-url", label: "Repo link", required: requirements.repoUrl, complete: hasRepoUrl },
    { id: "commit-hash", label: "Commit hash", required: requirements.commitHash, complete: hasCommitHash },
    { id: "passing-verifier", label: "Passing verifier", required: requirements.passingVerifierOutput, complete: hasPassingVerifierOutput },
    { id: "readme-status", label: `README ${requirements.readmeStatus}`, required: requirements.readmeStatus !== "missing", complete: hasRequiredReadme },
    { id: "artifact-or-deployment", label: "Artifact or deployment", required: requirements.artifactOrDeployment, complete: hasArtifactOrDeployment },
    { id: "reflection", label: "Reflection", required: requirements.reflection, complete: hasReflection }
  ].filter((item) => item.required);
}

export function missionEvidenceMeetsRequirements(progress: UserProgress, mission: ProjectMission): boolean {
  const linkedEvidence = progress.evidenceItems.filter((item) => item.linkedProjectMissionId === mission.id);

  if (linkedEvidence.length === 0) {
    return false;
  }

  const checklist = getMissionProofChecklist(progress, mission);
  return checklist.length > 0 && checklist.every((item) => item.complete);
}

export function areMissionDeliverablesComplete(progress: UserProgress, mission: ProjectMission): boolean {
  return mission.deliverables.every((_, index) => progress.completedProjectMissionDeliverableIds.includes(missionDeliverableId(mission.id, index)));
}

export function canCompleteMission(progress: UserProgress, mission: ProjectMission): boolean {
  return missionEvidenceMeetsRequirements(progress, mission);
}

export function getMissionSupportedLessonIds(mission: ProjectMission, lessons: Lesson[], content?: ContentPack): string[] {
  if (mission.id === "mission-cli-study-tracker") {
    return lessons.slice(0, 12).map((lesson) => lesson.id);
  }

  if (mission.id === "mission-python-data-cleaner") {
    return lessons.slice(5, 15).map((lesson) => lesson.id);
  }

  const skillRelatedLessons = lessons.filter((lesson) => lesson.skillIds.some((skillId) => mission.skillIds.includes(skillId)));
  if (skillRelatedLessons.length > 0) {
    return skillRelatedLessons.map((lesson) => lesson.id);
  }

  if (content) {
    const moduleIdsForMissionTrack = new Set(content.modules.filter((moduleItem) => moduleItem.trackId === mission.trackId).map((moduleItem) => moduleItem.id));
    const trackLessons = lessons.filter((lesson) => moduleIdsForMissionTrack.has(lesson.moduleId));
    if (trackLessons.length > 0) {
      return trackLessons.map((lesson) => lesson.id);
    }
  }

  return lessons.map((lesson) => lesson.id);
}

export function isLessonVerifiedComplete(progress: UserProgress, lesson: Lesson): boolean {
  return progress.completedLessonMiniProjectIds.includes(lesson.id)
    && progress.completedQuizIds.includes(lesson.quizId);
}

export function isWeeklyTaskComplete(task: WeeklyPlanTask, progress: UserProgress): boolean {
  if (task.linkedLessonId) {
    return progress.completedLessonIds.includes(task.linkedLessonId);
  }

  if (task.linkedProjectMissionId) {
    return progress.completedProjectMissionIds.includes(task.linkedProjectMissionId);
  }

  return progress.weeklyReports.length > 0;
}

function deriveCompletedLessonMiniProjectIds(progress: UserProgress): string[] {
  return uniqueValues(progress.codeRunAttempts
    .filter((attempt) => (attempt.runMode ?? "run_checks") === "run_checks" && attempt.passed)
    .map((attempt) => attempt.lessonId));
}

function deriveCompletedQuizIds(progress: UserProgress): string[] {
  return uniqueValues(progress.quizAttempts
    .filter((attempt) => attempt.passed)
    .map((attempt) => attempt.quizId));
}

function deriveCompletedLessonIds(content: ContentPack, progress: UserProgress): string[] {
  return content.lessons
    .filter((lesson) => isLessonVerifiedComplete(progress, lesson))
    .map((lesson) => lesson.id);
}

function deriveCompletedMissionIds(content: ContentPack, progress: UserProgress): string[] {
  return content.projectMissions
    .filter((mission) => {
      const supportedLessonIds = getMissionSupportedLessonIds(mission, content.lessons, content);
      const preparationComplete = supportedLessonIds.length === 0
        || supportedLessonIds.every((lessonId) => progress.completedLessonIds.includes(lessonId));

      return preparationComplete && missionEvidenceMeetsRequirements(progress, mission);
    })
    .map((mission) => mission.id);
}

function deriveCompletedMissionDeliverableIds(content: ContentPack, completedMissionIds: string[]): string[] {
  return content.projectMissions.flatMap((mission) => {
    if (!completedMissionIds.includes(mission.id)) {
      return [];
    }

    return mission.deliverables.map((_deliverable, index) => missionDeliverableId(mission.id, index));
  });
}

function deriveCompletedMissionPhaseIds(content: ContentPack, completedMissionIds: string[]): string[] {
  return content.projectMissions.flatMap((mission) => {
    if (!completedMissionIds.includes(mission.id)) {
      return [];
    }

    return mission.phases.map((phase) => missionPhaseId(mission.id, phase.id));
  });
}

function deriveCompletedWeeklyTaskIds(content: ContentPack, progress: UserProgress): string[] {
  return content.weeklyPlan.tasks
    .filter((task) => isWeeklyTaskComplete(task, progress))
    .map((task) => task.id);
}

function reconcileReviewItems(progress: UserProgress, now: string): UserProgress["reviewItems"] {
  let reviewItems = progress.reviewItems.filter((item) => {
    if (item.targetType === "lesson") {
      return progress.completedLessonIds.includes(item.targetId);
    }

    if (item.targetType === "quiz") {
      return progress.completedQuizIds.includes(item.targetId);
    }

    return progress.completedProjectMissionIds.includes(item.targetId);
  });

  for (const lessonId of progress.completedLessonIds) {
    reviewItems = upsertReviewItem(reviewItems, "lesson", lessonId, now);
  }

  for (const quizId of progress.completedQuizIds) {
    reviewItems = upsertReviewItem(reviewItems, "quiz", quizId, now);
  }

  for (const missionId of progress.completedProjectMissionIds) {
    reviewItems = upsertReviewItem(reviewItems, "mission", missionId, now);
  }

  return reviewItems;
}

export function reconcileDerivedProgress(content: ContentPack, progress: UserProgress, now = new Date().toISOString()): UserProgress {
  const completedLessonMiniProjectIds = deriveCompletedLessonMiniProjectIds(progress);
  const completedQuizIds = deriveCompletedQuizIds(progress);
  const withLessonInputs = {
    ...progress,
    completedLessonMiniProjectIds,
    completedQuizIds
  };
  const completedLessonIds = deriveCompletedLessonIds(content, withLessonInputs);
  const withLessons = {
    ...withLessonInputs,
    completedLessonIds
  };
  const completedProjectMissionIds = deriveCompletedMissionIds(content, withLessons);
  const withMissions = {
    ...withLessons,
    completedProjectMissionIds,
    completedProjectMissionDeliverableIds: deriveCompletedMissionDeliverableIds(content, completedProjectMissionIds),
    completedProjectMissionPhaseIds: deriveCompletedMissionPhaseIds(content, completedProjectMissionIds)
  };
  const nextProgress = {
    ...withMissions,
    weeklyPlanTaskIds: deriveCompletedWeeklyTaskIds(content, withMissions)
  };

  return withTimestamp({
    ...nextProgress,
    reviewItems: reconcileReviewItems(nextProgress, now)
  }, now);
}

export function setMissionCompletion(progress: UserProgress, mission: ProjectMission, completed: boolean, now = new Date().toISOString()): UserProgress {
  if (completed && !canCompleteMission(progress, mission)) {
    return progress;
  }

  return withTimestamp({
    ...progress,
    completedProjectMissionIds: setMembership(progress.completedProjectMissionIds, mission.id, completed),
    reviewItems: completed
      ? upsertReviewItem(progress.reviewItems, "mission", mission.id, now)
      : removeReviewItem(progress.reviewItems, "mission", mission.id)
  }, now);
}

export function setWeeklyPlanTaskCompletion(progress: UserProgress, taskId: string, completed: boolean, now = new Date().toISOString()): UserProgress {
  return withTimestamp({
    ...progress,
    weeklyPlanTaskIds: setMembership(progress.weeklyPlanTaskIds, taskId, completed)
  }, now);
}

export function addEvidenceItem(progress: UserProgress, draft: EvidenceDraft, now = new Date().toISOString()): UserProgress {
  const validationError = validateEvidenceDraft(draft);

  if (validationError) {
    throw new Error(validationError);
  }

  const evidenceItem: EvidenceItem = {
    id: `evidence-${now.replace(/[^0-9]/g, "")}-${progress.evidenceItems.length + 1}`,
    type: draft.type,
    title: draft.title.trim(),
    body: draft.body.trim(),
    linkedProjectMissionId: draft.linkedProjectMissionId,
    linkedLessonId: draft.linkedLessonId,
    linkedSkillIds: uniqueValues(draft.linkedSkillIds ?? []),
    uri: optionalTrimmed(draft.uri),
    repoUrl: optionalTrimmed(draft.repoUrl),
    commitHash: optionalTrimmed(draft.commitHash),
    testStatus: draft.testStatus ?? "unknown",
    artifactUri: optionalTrimmed(draft.artifactUri),
    readmeStatus: draft.readmeStatus ?? "missing",
    deploymentUrl: optionalTrimmed(draft.deploymentUrl),
    verifierOutput: optionalTrimmed(draft.verifierOutput),
    reflection: optionalTrimmed(draft.reflection),
    proofArtifact: draft.proofArtifact,
    trust: draft.trust ?? (
      draft.proofArtifact
        ? "auto_verified_code_lab"
        : optionalTrimmed(draft.verifierOutput)
          ? "manual_verifier_output"
          : "manual_note"
    ),
    createdAt: now
  };

  return withTimestamp({
    ...progress,
    evidenceItems: [evidenceItem, ...progress.evidenceItems]
  }, now);
}

export function submitQuizAttempt(progress: UserProgress, quiz: Quiz, selectedChoiceIndexes: number[], now = new Date().toISOString()): UserProgress {
  const correctAnswers = quiz.questions.filter((question, index) => question.correctChoiceIndex === selectedChoiceIndexes[index]).length;
  const score = quiz.questions.length === 0 ? 0 : Math.round((correctAnswers / quiz.questions.length) * 100);
  const passed = score >= quiz.passingScore;
  const attempt: QuizAttempt = {
    id: `quiz-attempt-${quiz.id}-${now.replace(/[^0-9]/g, "")}-${progress.quizAttempts.length + 1}`,
    quizId: quiz.id,
    selectedChoiceIndexes,
    score,
    passed,
    attemptedAt: now
  };

  return withTimestamp({
    ...progress,
    completedQuizIds: setMembership(progress.completedQuizIds, quiz.id, passed),
    quizAttempts: [attempt, ...progress.quizAttempts].slice(0, 250),
    reviewItems: passed
      ? upsertReviewItem(progress.reviewItems, "quiz", quiz.id, now)
      : removeReviewItem(progress.reviewItems, "quiz", quiz.id)
  }, now);
}

export function recordReview(progress: UserProgress, targetType: ReviewTargetType, targetId: string, rating: ReviewRating, now = new Date().toISOString()): UserProgress {
  const key = reviewKey(targetType, targetId);
  const existingItem = progress.reviewItems.find((item) => reviewKey(item.targetType, item.targetId) === key)
    ?? createReviewItem(targetType, targetId, now);
  const advancedItem = advanceReviewItem(existingItem, rating, now);
  const reviewEvent = recordReviewEvent(advancedItem, rating, now);

  return withTimestamp({
    ...progress,
    reviewItems: [
      ...progress.reviewItems.filter((item) => reviewKey(item.targetType, item.targetId) !== key),
      advancedItem
    ],
    reviewEvents: [reviewEvent, ...progress.reviewEvents].slice(0, 250)
  }, now);
}

export function generateWeeklyReport(progress: UserProgress, content: ContentPack, now = new Date().toISOString()): UserProgress {
  const snapshot = createWeeklyReportSnapshot(content, progress, now);

  return withTimestamp({
    ...progress,
    weeklyReports: upsertWeeklyReport(progress.weeklyReports, snapshot)
  }, now);
}
