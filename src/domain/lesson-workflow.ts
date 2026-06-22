export type LessonWorkflowStep =
  | "read"    // Learn content — concept capsules, synopsis, examples
  | "code"    // Practice + Code Lab — walkthrough, starter code, mini-project
  | "check";  // Quiz + evidence capture

export type LessonWorkflowCta =
  | { action: "navigate"; targetStep: LessonWorkflowStep; label: string; tone: "blue" | "green" | "amber" | "ink"; disabled: boolean }
  | { action: "submit-quiz"; label: string; tone: "blue" | "green" | "amber" | "ink"; disabled: boolean }
  | { action: "next-lesson"; label: string; lessonId: string; tone: "blue" | "green" | "amber" | "ink"; disabled: boolean }
  | { action: "module-complete"; label: string; tone: "blue" | "green" | "amber" | "ink"; disabled: boolean }
  | { action: "idle"; label: string; tone: "blue" | "green" | "amber" | "ink"; disabled: boolean };

export interface LessonWorkflowResult {
  currentStep: LessonWorkflowStep;
  stepIndex: number;         // 0-based index
  totalSteps: number;        // always 3
  completedSteps: LessonWorkflowStep[];
  unlockedSteps: LessonWorkflowStep[];
  cta: LessonWorkflowCta;
  canNavigateForward: boolean;
  canNavigateBack: boolean;
}

export const STEPS: LessonWorkflowStep[] = [
  "read",
  "code",
  "check"
];

export function deriveLessonWorkflow(input: {
  currentStep: LessonWorkflowStep;
  miniProjectDone: boolean;
  quizDone: boolean;
  lessonDone: boolean;
  hasQuiz: boolean;
  nextLessonId: string | undefined;
  allQuestionsAnswered?: boolean;
}): LessonWorkflowResult {
  const { currentStep, miniProjectDone, quizDone, lessonDone, hasQuiz, nextLessonId, allQuestionsAnswered = false } = input;
  const stepIndex = STEPS.indexOf(currentStep);

  // Determine unlocked steps
  const unlockedSteps: LessonWorkflowStep[] = ["read", "code"];
  if (miniProjectDone) {
    unlockedSteps.push("check");
  }

  // Determine completed steps
  const completedSteps: LessonWorkflowStep[] = ["read"];
  if (miniProjectDone) {
    completedSteps.push("code");
  }
  if (quizDone || !hasQuiz) {
    completedSteps.push("check");
  }

  // Determine CTA
  let cta: LessonWorkflowCta = { action: "idle", label: "Loading", tone: "ink", disabled: true };

  if (currentStep === "read") {
    cta = { action: "navigate", targetStep: "code", label: "Continue to code", tone: "blue", disabled: false };
  } else if (currentStep === "code") {
    if (!miniProjectDone) {
      cta = { action: "idle", label: "Complete the Code Lab", tone: "blue", disabled: true };
    } else {
      cta = { action: "navigate", targetStep: "check", label: "Take quiz", tone: "blue", disabled: false };
    }
  } else if (currentStep === "check") {
    if (hasQuiz && !quizDone) {
      cta = {
        action: "submit-quiz",
        label: allQuestionsAnswered ? "Submit quiz" : "Answer all questions",
        tone: allQuestionsAnswered ? "amber" : "blue",
        disabled: !allQuestionsAnswered
      };
    } else {
      if (nextLessonId) {
        cta = { action: "next-lesson", label: "Next lesson", lessonId: nextLessonId, tone: "green", disabled: false };
      } else {
        cta = { action: "module-complete", label: "Module complete", tone: "green", disabled: false };
      }
    }
  }

  const canNavigateBack = stepIndex > 0;
  const canNavigateForward = stepIndex < STEPS.length - 1 && unlockedSteps.includes(STEPS[stepIndex + 1]);

  return {
    currentStep,
    stepIndex,
    totalSteps: STEPS.length,
    completedSteps,
    unlockedSteps,
    cta,
    canNavigateBack,
    canNavigateForward
  };
}
