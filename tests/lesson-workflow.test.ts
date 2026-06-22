import { describe, expect, it } from "vitest";
import { deriveLessonWorkflow } from "@/domain/lesson-workflow";

describe("deriveLessonWorkflow", () => {
  it("starts at read and CTA points to code", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "read",
      miniProjectDone: false,
      quizDone: false,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
    });

    expect(workflow.currentStep).toBe("read");
    expect(workflow.cta.action).toBe("navigate");
    if (workflow.cta.action === "navigate") {
      expect(workflow.cta.targetStep).toBe("code");
    }
    expect(workflow.cta.label).toBe("Continue to code");
    expect(workflow.cta.disabled).toBe(false);
    expect(workflow.unlockedSteps).toContain("read");
    expect(workflow.unlockedSteps).toContain("code");
    expect(workflow.unlockedSteps).not.toContain("check");
  });

  it("shows complete-message CTA on code step when miniProject is not done", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "code",
      miniProjectDone: false,
      quizDone: false,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
    });

    expect(workflow.currentStep).toBe("code");
    expect(workflow.cta.label).toBe("Complete the Code Lab");
    expect(workflow.cta.action).toBe("idle");
    expect(workflow.unlockedSteps).not.toContain("check");
    expect(workflow.canNavigateForward).toBe(false);
  });

  it("keeps CTA idle even if quiz is somehow done but mini-project is not", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "code",
      miniProjectDone: false,
      quizDone: true,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
    });

    expect(workflow.currentStep).toBe("code");
    expect(workflow.cta.label).toBe("Complete the Code Lab");
    expect(workflow.cta.action).toBe("idle");
    expect(workflow.unlockedSteps).not.toContain("check");
  });

  it("advances CTA to check once miniProjectDone is true", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "code",
      miniProjectDone: true,
      quizDone: false,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
    });

    expect(workflow.currentStep).toBe("code");
    expect(workflow.cta.action).toBe("navigate");
    if (workflow.cta.action === "navigate") {
      expect(workflow.cta.targetStep).toBe("check");
    }
    expect(workflow.cta.label).toBe("Take quiz");
    expect(workflow.unlockedSteps).toContain("check");
    expect(workflow.canNavigateForward).toBe(true);
  });

  it("shows Answer all questions CTA on check step when quiz not yet completed", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "check",
      miniProjectDone: true,
      quizDone: false,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
      allQuestionsAnswered: false,
    });

    expect(workflow.currentStep).toBe("check");
    expect(workflow.cta.action).toBe("submit-quiz");
    expect(workflow.cta.label).toBe("Answer all questions");
    expect(workflow.cta.disabled).toBe(true);
  });

  it("enables Submit quiz CTA when all questions are answered on check step", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "check",
      miniProjectDone: true,
      quizDone: false,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
      allQuestionsAnswered: true,
    });

    expect(workflow.currentStep).toBe("check");
    expect(workflow.cta.action).toBe("submit-quiz");
    expect(workflow.cta.label).toBe("Submit quiz");
    expect(workflow.cta.disabled).toBe(false);
  });

  it("shows Next lesson CTA once quiz is done on check step when next lesson exists", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "check",
      miniProjectDone: true,
      quizDone: true,
      lessonDone: false,
      hasQuiz: true,
      nextLessonId: "lesson-2",
    });

    expect(workflow.currentStep).toBe("check");
    expect(workflow.cta.action).toBe("next-lesson");
    if (workflow.cta.action === "next-lesson") {
      expect(workflow.cta.lessonId).toBe("lesson-2");
    }
    expect(workflow.cta.label).toBe("Next lesson");
    expect(workflow.cta.disabled).toBe(false);
  });

  it("shows Module complete CTA on check step when lesson is complete and no next exists", () => {
    const workflow = deriveLessonWorkflow({
      currentStep: "check",
      miniProjectDone: true,
      quizDone: true,
      lessonDone: true,
      hasQuiz: true,
      nextLessonId: undefined,
    });

    expect(workflow.currentStep).toBe("check");
    expect(workflow.cta.action).toBe("module-complete");
    expect(workflow.cta.label).toBe("Module complete");
    expect(workflow.cta.disabled).toBe(false);
  });
});
