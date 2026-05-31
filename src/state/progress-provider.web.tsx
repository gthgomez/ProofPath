import type { PropsWithChildren, ReactElement } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { contentPack } from "@/content/seed";
import { roleTargets } from "@/content/roles";
import {
  addEvidenceItem,
  createInitialProgress,
  generateWeeklyReport,
  recordCodeRunAttempt,
  recordReview,
  reconcileDerivedProgress,
  setRoleTarget,
  submitQuizAttempt,
  validateEvidenceDraft
} from "@/domain/progress";
import { calculateReadinessScore } from "@/domain/readiness";
import { getContentForRole, getRoleTarget } from "@/domain/role-routing";
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

interface ProgressContextValue {
  progress: UserProgress;
  profile: UserProfile;
  roleTarget: RoleTarget;
  availableRoleTargets: RoleTarget[];
  readiness: ReadinessScore;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  selectRoleTarget: (roleTargetId: string, completeOnboarding?: boolean) => void;
  recordRecallReview: (targetType: ReviewTargetType, targetId: string, rating: ReviewRating) => void;
  recordCodeRun: (attempt: CodeRunAttempt) => void;
  submitQuiz: (quiz: Quiz, selectedChoiceIndexes: number[]) => void;
  addEvidence: (input: EvidenceInput) => boolean;
  generateWeeklyCareerReport: () => void;
  resetLocalProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);
const WEB_PROGRESS_KEY = "careerforge.progress.v1";

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

function loadWebProgress(): UserProgress {
  if (typeof window === "undefined") {
    return createInitialProgress();
  }

  const stored = window.localStorage.getItem(WEB_PROGRESS_KEY);
  if (!stored) {
    return createInitialProgress();
  }

  return createInitialProgressSafe(stored);
}

function saveWebProgress(progress: UserProgress): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(WEB_PROGRESS_KEY, JSON.stringify(progress));
  }
}

export function ProgressProvider({ children }: PropsWithChildren): ReactElement {
  const [progress, setProgress] = useState<UserProgress>(() => {
    const storedProgress = loadWebProgress();
    return reconcileDerivedProgress(getContentForRole(contentPack, storedProgress.profile.roleTargetId), storedProgress, storedProgress.updatedAt);
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

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
      recordRecallReview: (targetType, targetId, rating) => {
        updateProgress((currentProgress) => recordReview(currentProgress, targetType, targetId, rating));
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
      resetLocalProgress: async () => {
        const initialProgress = createInitialProgress();
        progressRef.current = initialProgress;
        setProgress(initialProgress);
        try {
          saveWebProgress(initialProgress);
          setError(null);
        } catch (caughtError) {
          setError(caughtError instanceof Error ? caughtError.message : "Unable to reset progress.");
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
