import { describe, expect, it } from "vitest";
import { deriveLessonWorkflow } from "@/domain/lesson-workflow";

describe("deriveLessonWorkflow", () => {
  it("starts at understand and CTA points to practice/experiment", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "understand",
      miniProjectDone: false,
      quizDone: false,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
    });

    expect(workflow.currentStep).toBe("understand");
    expect(workflow.cta.action).toBe("navigate");
    if (workflow.cta.action === "navigate") {
      expect(workflow.cta.targetStep).toBe("experiment");
    }
    expect(workflow.cta.label).toBe("Continue to Practice");
    expect(workflow.cta.disabled).toBe(false);
    expect(workflow.unlockedSteps).toContain("understand");
    expect(workflow.unlockedSteps).toContain("experiment");
    expect(workflow.unlockedSteps).toContain("apply");
    expect(workflow.unlockedSteps).not.toContain("checkpoint");
  });

  it("points to apply from experiment step", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "experiment",
      miniProjectDone: false,
      quizDone: false,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
    });

    expect(workflow.currentStep).toBe("experiment");
    expect(workflow.cta.action).toBe("navigate");
    if (workflow.cta.action === "navigate") {
      expect(workflow.cta.targetStep).toBe("apply");
    }
    expect(workflow.cta.label).toBe("Continue to Code Lab");
    expect(workflow.cta.disabled).toBe(false);
  });

  it("keeps CTA on Run Code Lab if miniProjectDone is false", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "apply",
      miniProjectDone: false,
      quizDone: false,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
    });

    expect(workflow.currentStep).toBe("apply");
    expect(workflow.cta.label).toBe("Run Code Lab");
    // Action is idle because the runner handles execution, it's not a navigation action.
    expect(workflow.cta.action).toBe("idle");
    expect(workflow.unlockedSteps).not.toContain("checkpoint");
    expect(workflow.canNavigateForward).toBe(false);
  });

  it("keeps CTA on Run Code Lab even if quiz is somehow done but mini-project is not done", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "apply",
      miniProjectDone: false,
      quizDone: true,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
    });

    expect(workflow.currentStep).toBe("apply");
    expect(workflow.cta.label).toBe("Run Code Lab");
    expect(workflow.cta.action).toBe("idle");
    expect(workflow.unlockedSteps).not.toContain("checkpoint");
  });

  it("advances CTA to checkpoint once miniProjectDone is true", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "apply",
      miniProjectDone: true,
      quizDone: false,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
    });

    expect(workflow.currentStep).toBe("apply");
    expect(workflow.cta.action).toBe("navigate");
    if (workflow.cta.action === "navigate") {
      expect(workflow.cta.targetStep).toBe("checkpoint");
    }
    expect(workflow.cta.label).toBe("Take checkpoint");
    expect(workflow.unlockedSteps).toContain("checkpoint");
    expect(workflow.canNavigateForward).toBe(true);
  });

  it("shows Answer checkpoint CTA when on checkpoint step and quiz not yet completed", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "checkpoint",
      miniProjectDone: true,
      quizDone: false,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
      allQuestionsAnswered: false,
    });

    expect(workflow.currentStep).toBe("checkpoint");
    expect(workflow.cta.action).toBe("submit-quiz");
    expect(workflow.cta.label).toBe("Answer checkpoint");
    expect(workflow.cta.disabled).toBe(true);
    expect(workflow.unlockedSteps).not.toContain("evidence");
  });

  it("enables Submit checkpoint CTA when all questions are answered on checkpoint step", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "checkpoint",
      miniProjectDone: true,
      quizDone: false,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
      allQuestionsAnswered: true,
    });

    expect(workflow.currentStep).toBe("checkpoint");
    expect(workflow.cta.action).toBe("submit-quiz");
    expect(workflow.cta.label).toBe("Submit checkpoint");
    expect(workflow.cta.disabled).toBe(false);
  });

  it("shows Save evidence CTA once quiz is done on checkpoint step", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "checkpoint",
      miniProjectDone: true,
      quizDone: true,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
    });

    expect(workflow.currentStep).toBe("checkpoint");
    expect(workflow.cta.action).toBe("navigate");
    if (workflow.cta.action === "navigate") {
      expect(workflow.cta.targetStep).toBe("evidence");
    }
    expect(workflow.cta.label).toBe("Save evidence");
    expect(workflow.unlockedSteps).toContain("evidence");
  });

  it("shows Next lesson CTA on evidence step when lesson is completed and next exists", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "evidence",
      miniProjectDone: true,
      quizDone: true,
      lessonDone: true,
      hasQuiz: true,
      nextLessonId: "lesson-2",
    });

    expect(workflow.currentStep).toBe("evidence");
    expect(workflow.cta.action).toBe("next-lesson");
    if (workflow.cta.action === "next-lesson") {
      expect(workflow.cta.lessonId).toBe("lesson-2");
    }
    expect(workflow.cta.disabled).toBe(false);
  });

  it("shows Module complete CTA on evidence step when lesson is completed and no next exists", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "evidence",
      miniProjectDone: true,
      quizDone: true,
      lessonDone: true,
      hasQuiz: true,
      nextLessonId: undefined,
    });

    expect(workflow.currentStep).toBe("evidence");
    expect(workflow.cta.action).toBe("module-complete");
    expect(workflow.cta.disabled).toBe(false);
  });
});
