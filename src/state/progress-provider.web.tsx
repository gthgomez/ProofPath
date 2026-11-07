import type { PropsWithChildren, ReactElement } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { contentPack } from "@/content/seed";
import { roleTargets } from "@/content/roles";
import {
  addEvidenceItem,
  createInitialProgress,
  dismissDashboardTour,
  generateWeeklyReport,
  placementSkip,
  recordCodeRunAttempt,
  recordReview,
  reconcileDerivedProgress,
  setRoleTarget,
  submitQuizAttempt,
  validateEvidenceDraft
} from "@/domain/progress";
import { coordinatedProgressRestore, recoverPendingProgressRestore } from "@/domain/progress-restore";
import type { ProgressBackup } from "@/domain/progress-backup";
import { calculateReadinessScore } from "@/domain/readiness";
import { getContentForRole, getRoleTarget } from "@/domain/role-routing";
import { editorDraftStore } from "@/storage/draft-store";
import type {
  CodeRunAttempt,
  EvidenceTestStatus,
  EvidenceType,
  Quiz,
  ReadinessScore,
  ReadmeStatus,
  ReviewRating,
  ReviewTargetType,
  RoleTarget,
  UserProfile,
  UserProgress
} from "@/domain/types";

interface EvidenceInput {
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
}

export interface ProgressContextValue {
  progress: UserProgress;
  profile: UserProfile;
  roleTarget: RoleTarget;
  availableRoleTargets: RoleTarget[];
  readiness: ReadinessScore;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  selectRoleTarget: (roleTargetId: string, completeOnboarding?: boolean) => void;
  recordRecallReview: (targetType: ReviewTargetType, targetId: string, rating: ReviewRating, options?: { assisted?: boolean }) => void;
  recordCodeRun: (attempt: CodeRunAttempt) => void;
  submitQuiz: (quiz: Quiz, selectedChoiceIndexes: number[]) => void;
  addEvidence: (input: EvidenceInput) => boolean;
  generateWeeklyCareerReport: () => void;
  resetLocalProgress: () => Promise<void>;
  restoreBackup: (backup: ProgressBackup) => Promise<{ ok: boolean; error?: string }>;
  dismissTour: () => void;
  /** Placement only: never awards lesson, quiz, or Code Lab completion. */
  placement: (lessonIds: string[], quizIds: string[]) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);
const WEB_PROGRESS_KEY = "proofpath.progress.v1";
const LEGACY_WEB_PROGRESS_KEY = "careerforge.progress.v1";

function createInitialProgressFromStored(storedProgress: Partial<UserProgress>): UserProgress {
  const initialProgress = createInitialProgress();

  return {
    ...initialProgress,
    ...storedProgress,
    profile: {
      ...initialProgress.profile,
      ...storedProgress.profile
    },
    completedLessonIds: storedProgress.completedLessonIds ?? [],
    completedLessonMiniProjectIds: storedProgress.completedLessonMiniProjectIds ?? [],
    completedQuizIds: storedProgress.completedQuizIds ?? [],
    placedOutLessonIds: storedProgress.placedOutLessonIds ?? [],
    placedOutQuizIds: storedProgress.placedOutQuizIds ?? [],
    completedProjectMissionIds: storedProgress.completedProjectMissionIds ?? [],
    completedProjectMissionDeliverableIds: storedProgress.completedProjectMissionDeliverableIds ?? [],
    completedProjectMissionPhaseIds: storedProgress.completedProjectMissionPhaseIds ?? [],
    evidenceItems: storedProgress.evidenceItems ?? [],
    quizAttempts: storedProgress.quizAttempts ?? [],
    codeRunAttempts: storedProgress.codeRunAttempts ?? [],
    weeklyPlanTaskIds: storedProgress.weeklyPlanTaskIds ?? [],
    reviewItems: storedProgress.reviewItems ?? [],
    reviewEvents: storedProgress.reviewEvents ?? [],
    weeklyReports: storedProgress.weeklyReports ?? [],
    updatedAt: storedProgress.updatedAt ?? new Date().toISOString()
  };
}

function createInitialProgressSafe(serializedProgress: string): UserProgress {
  try {
    return createInitialProgressFromStored(JSON.parse(serializedProgress) as Partial<UserProgress>);
  } catch {
    return createInitialProgress();
  }
}

function readStoredProgress(): UserProgress {
  if (typeof window === "undefined") {
    return createInitialProgress();
  }

  const stored = window.localStorage.getItem(WEB_PROGRESS_KEY);
  if (stored) {
    return createInitialProgressSafe(stored);
  }

  // One-time migration: rename left no migration path for the legacy
  // "careerforge.progress.v1" localStorage entry, so copy it under the new key.
  const legacyStored = window.localStorage.getItem(LEGACY_WEB_PROGRESS_KEY);
  if (!legacyStored) {
    return createInitialProgress();
  }

  try {
    window.localStorage.setItem(WEB_PROGRESS_KEY, legacyStored);
  } catch {
    // Quota errors must not block loading migrated progress for this session.
  }

  return createInitialProgressSafe(legacyStored);
}

function saveWebProgress(progress: UserProgress): void {
  if (typeof window === "undefined") {
    throw new Error("Browser storage is unavailable.");
  }
  window.localStorage.setItem(WEB_PROGRESS_KEY, JSON.stringify(progress));
}

/** Write and verify the exact bytes, so a quota failure cannot look like success. */
function saveWebProgressDurably(progress: UserProgress): void {
  const serialized = JSON.stringify(progress);
  saveWebProgress(progress);
  const readBack = typeof window === "undefined" ? null : window.localStorage.getItem(WEB_PROGRESS_KEY);
  if (readBack !== serialized) {
    throw new Error("Browser storage did not retain the restored progress.");
  }
}

export function ProgressProvider({ children }: PropsWithChildren): ReactElement {
  const [progress, setProgress] = useState<UserProgress>(() => {
    const storedProgress = readStoredProgress();
    return reconcileDerivedProgress(getContentForRole(contentPack, storedProgress.profile.roleTargetId), storedProgress, storedProgress.updatedAt);
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    let isMounted = true;
    // Finish or roll back a restore interrupted between its draft and progress
    // stages. Progress is already durable; only drafts need reconciliation.
    void recoverPendingProgressRestore(editorDraftStore, {
      read: async () => readStoredProgress()
    }).then((recovery) => {
      if (isMounted && recovery.error) {
        setError(recovery.error);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const updateProgress = useCallback((createNextProgress: (currentProgress: UserProgress) => UserProgress): void => {
    const rawNextProgress = createNextProgress(progressRef.current);
    const nextProgress = reconcileDerivedProgress(getContentForRole(contentPack, rawNextProgress.profile.roleTargetId), rawNextProgress);
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    setIsSaving(true);
    try {
      saveWebProgress(nextProgress);
      setError(null);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save progress.");
    } finally {
      setIsSaving(false);
    }
  }, []);

  const value = useMemo<ProgressContextValue>(() => {
    const roleScopedContent = getContentForRole(contentPack, progress.profile.roleTargetId);
    const readiness = calculateReadinessScore(roleScopedContent, progress);

    return {
      progress,
      profile: progress.profile,
      roleTarget: getRoleTarget(progress.profile.roleTargetId),
      availableRoleTargets: roleTargets,
      readiness,
      isLoading: false,
      isSaving,
      error,
      selectRoleTarget: (roleTargetId, completeOnboarding = true) => {
        updateProgress((currentProgress) => setRoleTarget(currentProgress, roleTargetId, completeOnboarding));
      },
      recordRecallReview: (targetType, targetId, rating, options) => {
        updateProgress((currentProgress) => recordReview(currentProgress, targetType, targetId, rating, undefined, options));
      },
      recordCodeRun: (attempt) => {
        updateProgress((currentProgress) => recordCodeRunAttempt(currentProgress, attempt));
      },
      submitQuiz: (quiz, selectedChoiceIndexes) => {
        updateProgress((currentProgress) => submitQuizAttempt(currentProgress, quiz, selectedChoiceIndexes));
      },
      addEvidence: (input) => {
        const validationError = validateEvidenceDraft(input);

        if (validationError) {
          setError(validationError);
          return false;
        }
        updateProgress((currentProgress) => addEvidenceItem(currentProgress, input));
        return true;
      },
      generateWeeklyCareerReport: () => {
        updateProgress((currentProgress) => generateWeeklyReport(currentProgress, roleScopedContent));
      },
      dismissTour: () => {
        updateProgress((currentProgress) => dismissDashboardTour(currentProgress));
      },
      placement: (lessonIds, quizIds) => {
        updateProgress((currentProgress) => placementSkip(currentProgress, lessonIds, quizIds));
      },
      resetLocalProgress: async () => {
        const initialProgress = createInitialProgress();
        progressRef.current = initialProgress;
        setProgress(initialProgress);
        try {
          // Clear editor drafts with progress; surface a partial failure rather
          // than silently leaving a stale draft behind.
          let draftError: string | null = null;
          try {
            await editorDraftStore.clearAll();
          } catch (caughtDraftError) {
            draftError = caughtDraftError instanceof Error ? caughtDraftError.message : "Unknown draft-storage error.";
          }
          saveWebProgress(initialProgress);
          setError(draftError ? `Progress reset, but editor drafts could not be cleared: ${draftError}` : null);
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to reset progress.");
        }
      },
      restoreBackup: async (backup) => {
        setIsSaving(true);
        try {
          const result = await coordinatedProgressRestore({
            backup,
            content: contentPack,
            draftStore: editorDraftStore,
            progressPort: {
              readUpdatedAt: async () => readStoredProgress().updatedAt,
              read: async () => readStoredProgress(),
              write: async (nextProgress) => saveWebProgressDurably(nextProgress)
            }
          });

          if (result.ok && result.progress) {
            progressRef.current = result.progress;
            setProgress(result.progress);
            setError(null);
            return { ok: true };
          }

          const message = result.error ?? "Unable to restore the backup.";
          setError(message);
          return { ok: false, error: message };
        } catch (caughtError) {
          const message = caughtError instanceof Error ? caughtError.message : "Unable to restore the backup.";
          setError(message);
          return { ok: false, error: message };
        } finally {
          setIsSaving(false);
        }
      }
    };
  }, [error, isSaving, progress, updateProgress]);

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const context = useContext(ProgressContext);

  if (!context) {
    throw new Error("useProgress must be used inside ProgressProvider.");
  }

  return context;
}
