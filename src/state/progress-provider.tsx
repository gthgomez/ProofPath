import { useSQLiteContext } from "expo-sqlite";
import type { PropsWithChildren, ReactElement } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { contentPack } from "@/content/seed";
import {
  addEvidenceItem,
  createInitialProgress,
  dismissDashboardTour,
  placementSkip,
  generateWeeklyReport,
  recordCodeRunAttempt,
  recordReview,
  reconcileDerivedProgress,
  setRoleTarget,
  submitQuizAttempt,
  validateEvidenceDraft
} from "@/domain/progress";
import { coordinatedProgressRestore, recoverPendingProgressRestore } from "@/domain/progress-restore";
import { calculateReadinessScore } from "@/domain/readiness";
import { getContentForRole, getRoleTarget } from "@/domain/role-routing";
import { roleTargets } from "@/content/roles";
import type { CodeRunAttempt, EvidenceTestStatus, EvidenceType, Quiz, ReadinessScore, ReadmeStatus, ReviewRating, ReviewTargetType, RoleTarget, UserProfile, UserProgress } from "@/domain/types";
import type { ProgressBackup } from "@/domain/progress-backup";
import { loadProgress, resetProgress, saveProgress } from "@/storage/progress-store";
import { editorDraftStore } from "@/storage/draft-store";

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
  /**
   * Replace all local progress and editor drafts from a validated backup.
   * Resolves only after both replacements are durable, or reports an error with
   * the previous state preserved (or recovered on the next launch).
   */
  restoreBackup: (backup: ProgressBackup) => Promise<{ ok: boolean; error?: string }>;
  dismissTour: () => void;
  /**
   * Placement out of prerequisites. This never awards lesson, quiz, or Code Lab
   * completion; it only unlocks navigation.
   */
  placement: (lessonIds: string[], quizIds: string[]) => void;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: PropsWithChildren): ReactElement {
  return <SQLiteProgressProvider>{children}</SQLiteProgressProvider>;
}

function SQLiteProgressProvider({ children }: PropsWithChildren): ReactElement {
  const db = useSQLiteContext();
  const [progress, setProgress] = useState<UserProgress>(() => createInitialProgress());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const progressRef = useRef(progress);
  const saveQueueRef = useRef(Promise.resolve());
  const pendingSaveCountRef = useRef(0);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateProgress(): Promise<void> {
      try {
        setIsLoading(true);
        const storedProgress = await loadProgress(db);
        if (isMounted) {
          const derivedProgress = reconcileDerivedProgress(getContentForRole(contentPack, storedProgress.profile.roleTargetId), storedProgress, storedProgress.updatedAt);
          progressRef.current = derivedProgress;
          setProgress(derivedProgress);
          setError(null);
        }

        // A crash during a restore leaves a journal. The current progress
        // identity decides whether the new or old draft snapshot wins.
        const recovery = await recoverPendingProgressRestore(editorDraftStore, {
          read: () => loadProgress(db)
        });
        if (isMounted && recovery.error) {
          setError(recovery.error);
        }
      } catch (caughtError) {
        if (isMounted) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to load progress.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void hydrateProgress();

    return () => {
      isMounted = false;
    };
  }, [db]);

  const updateProgress = useCallback((createNextProgress: (currentProgress: UserProgress) => UserProgress): void => {
    const rawNextProgress = createNextProgress(progressRef.current);
    const nextProgress = reconcileDerivedProgress(getContentForRole(contentPack, rawNextProgress.profile.roleTargetId), rawNextProgress);
    progressRef.current = nextProgress;
    setProgress(nextProgress);
    setIsSaving(true);
    pendingSaveCountRef.current += 1;
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(() => saveProgress(db, nextProgress))
      .then(() => setError(null))
      .catch((caughtError: unknown) => {
        setError(caughtError instanceof Error ? caughtError.message : "Unable to save progress.");
      })
      .finally(() => {
        pendingSaveCountRef.current -= 1;
        if (pendingSaveCountRef.current === 0) {
          setIsSaving(false);
        }
      });
  }, [db]);

  const value = useMemo<ProgressContextValue>(() => {
    const roleScopedContent = getContentForRole(contentPack, progress.profile.roleTargetId);
    const readiness = calculateReadinessScore(roleScopedContent, progress);

    return {
      progress,
      profile: progress.profile,
      roleTarget: getRoleTarget(progress.profile.roleTargetId),
      availableRoleTargets: roleTargets,
      readiness,
      isLoading,
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
        setIsSaving(true);
        try {
          await saveQueueRef.current.catch(() => undefined);
          // Clear editor drafts with progress, but do not let a draft-storage
          // failure block the progress reset. Surface the partial failure so a
          // stale draft is not mistaken for a clean reset.
          let draftError: string | null = null;
          try {
            await editorDraftStore.clearAll();
          } catch (caughtDraftError) {
            draftError = caughtDraftError instanceof Error ? caughtDraftError.message : "Unknown draft-storage error.";
          }
          const initialProgress = await resetProgress(db);
          progressRef.current = initialProgress;
          setProgress(initialProgress);
          setError(draftError ? `Progress reset, but editor drafts could not be cleared: ${draftError}` : null);
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to reset progress.");
        } finally {
          setIsSaving(false);
        }
      },
      restoreBackup: async (backup) => {
        setIsSaving(true);
        try {
          // Let already-issued saves settle before replacing the store, so a
          // queued write cannot land after the restored snapshot.
          await saveQueueRef.current.catch(() => undefined);
          const result = await coordinatedProgressRestore({
            backup,
            content: contentPack,
            draftStore: editorDraftStore,
            progressPort: {
              readUpdatedAt: async () => (await loadProgress(db)).updatedAt,
              read: () => loadProgress(db),
              write: (nextProgress) => saveProgress(db, nextProgress)
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
  }, [db, error, isLoading, isSaving, progress, updateProgress]);

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
