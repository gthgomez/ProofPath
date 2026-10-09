export type LessonWorkflowStep =
  | "understand"    // Learn content — theory, synopsis, worked example
  | "experiment"    // Practice — starter code, predictions, fluency reps
  | "apply"         // Code Lab — write code, run checks
  | "checkpoint"    // Quiz + recall cards
  | "evidence";     // Post-completion evidence capture prompt

export type LessonWorkflowCta =
  | { action: "navigate"; targetStep: LessonWorkflowStep; label: string; tone: "blue" | "green" | "amber" | "ink"; disabled: boolean }
  | { action: "submit-quiz"; label: string; tone: "blue" | "green" | "amber" | "ink"; disabled: boolean }
  | { action: "open-evidence"; label: string; tone: "blue" | "green" | "amber" | "ink"; disabled: boolean }
  | { action: "next-lesson"; label: string; lessonId: string; tone: "blue" | "green" | "amber" | "ink"; disabled: boolean }
  | { action: "module-complete"; label: string; tone: "blue" | "green" | "amber" | "ink"; disabled: boolean }
  | { action: "choose-path"; label: string; tone: "blue" | "green" | "amber" | "ink"; disabled: boolean }
  | { action: "idle"; label: string; tone: "blue" | "green" | "amber" | "ink"; disabled: boolean };

export interface LessonWorkflowResult {
  currentStep: LessonWorkflowStep;
  stepIndex: number;         // 0-based index
  totalSteps: number;        // always 5
  completedSteps: LessonWorkflowStep[];
  unlockedSteps: LessonWorkflowStep[];
  cta: LessonWorkflowCta;
  canNavigateForward: boolean;
  canNavigateBack: boolean;
}

export const STEPS: LessonWorkflowStep[] = [
  "understand",
  "experiment",
  "apply",
  "checkpoint",
  "evidence"
];

export function deriveLessonWorkflow(input: {
  currentStep: LessonWorkflowStep;
  miniProjectDone: boolean;
  quizDone: boolean;
  lessonDone: boolean;
  hasQuiz: boolean;
  nextLessonId: string | undefined;
  allQuestionsAnswered?: boolean;
  /** Steps the learner has actually opened this session. Unvisited steps stay available but are never labeled completed. */
  visitedSteps?: LessonWorkflowStep[];
  /** True when the learner ran practice code at least once (the Experiment activity, not just a visit). */
  experimentAttempted?: boolean;
  /**
   * True for a sample lesson opened before a career path is chosen. The lesson
   * is fully playable, but the terminal action routes to path setup instead of
   * a later lesson that would silently redirect there anyway.
   */
  previewMode?: boolean;
}): LessonWorkflowResult {
  const { currentStep, miniProjectDone, quizDone, lessonDone, hasQuiz, nextLessonId, allQuestionsAnswered = false, visitedSteps = [], experimentAttempted = false, previewMode = false } = input;
  const stepIndex = STEPS.indexOf(currentStep);

  // Determine unlocked steps
  const unlockedSteps: LessonWorkflowStep[] = ["understand", "experiment", "apply"];
  if (miniProjectDone) {
    unlockedSteps.push("checkpoint");
  }
  if (miniProjectDone && (quizDone || !hasQuiz)) {
    unlockedSteps.push("evidence");
  }

  // Determine completed steps. Visiting a step is the minimum evidence that
  // the activity happened; apply/checkpoint/evidence keep their checked
  // completion signals so an unattempted activity is never shown as completed.
  const completedSteps: LessonWorkflowStep[] = [];
  if (visitedSteps.includes("understand") || currentStep !== "understand") {
    completedSteps.push("understand");
  }
  if (experimentAttempted || miniProjectDone) {
    completedSteps.push("experiment");
  }
  if (miniProjectDone) {
    completedSteps.push("apply");
  }
  if (quizDone || !hasQuiz) {
    completedSteps.push("checkpoint");
  }
  // Evidence is considered completed if the lesson is fully complete/done
  if (lessonDone) {
    completedSteps.push("evidence");
  }

  // Determine CTA
  let cta: LessonWorkflowCta = { action: "idle", label: "Loading", tone: "ink", disabled: true };

  if (currentStep === "understand") {
    cta = { action: "navigate", targetStep: "experiment", label: "Continue to Practice", tone: "blue", disabled: false };
  } else if (currentStep === "experiment") {
    cta = { action: "navigate", targetStep: "apply", label: "Continue to Code Lab", tone: "blue", disabled: false };
  } else if (currentStep === "apply") {
    if (!miniProjectDone) {
      cta = { action: "idle", label: "Run Code Lab", tone: "blue", disabled: true };
    } else {
      cta = { action: "navigate", targetStep: "checkpoint", label: "Take checkpoint", tone: "blue", disabled: false };
    }
  } else if (currentStep === "checkpoint") {
    if (hasQuiz && !quizDone) {
      cta = {
        action: "submit-quiz",
        label: allQuestionsAnswered ? "Submit checkpoint" : "Answer checkpoint",
        tone: allQuestionsAnswered ? "amber" : "blue",
        disabled: !allQuestionsAnswered
      };
    } else {
      // Quiz is done or no quiz
      cta = { action: "navigate", targetStep: "evidence", label: "Save evidence", tone: "green", disabled: false };
    }
  } else if (currentStep === "evidence") {
    if (lessonDone) {
      if (previewMode) {
        // A sample lesson has no career path yet; route to setup with an
        // explicit label instead of pushing a lesson that would redirect.
        cta = { action: "choose-path", label: "Choose a career path to continue", tone: "green", disabled: false };
      } else if (nextLessonId) {
        cta = { action: "next-lesson", label: "Next lesson", lessonId: nextLessonId, tone: "green", disabled: false };
      } else {
        cta = { action: "module-complete", label: "Module complete", tone: "green", disabled: false };
      }
    } else {
      // This case should rarely happen as checkpoint/codelab should both be complete
      cta = { action: "idle", label: "Complete activities first", tone: "ink", disabled: true };
    }
  }

  const canNavigateBack = stepIndex > 0;
  // Can only navigate forward manually if the next step is unlocked
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
