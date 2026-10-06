// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { __setSandboxOutcome } from "./mocks/sandbox-runner";
import {
  answerQuiz,
  clearStoredProgress,
  clickRunChecks,
  continueForward,
  getQuizForLesson,
  getQuizSubmitButton,
  renderLessonScreen,
  seedOnboardingComplete
} from "./journey-helpers";

vi.mock("expo-router", () => import("./mocks/expo-router"));
vi.mock("@/sandbox/runner", () => import("./mocks/sandbox-runner"));
vi.mock("react-native-safe-area-context", () => import("./mocks/safe-area-context"));

describe("probe", () => {
  beforeEach(() => {
    clearStoredProgress();
    seedOnboardingComplete();
    __setSandboxOutcome("pass");
  });

  it("finds duplicate Checkpoint passed text", async () => {
    renderLessonScreen("lesson-python-zero-files-folders");
    await continueForward();
    await continueForward();
    await clickRunChecks();
    fireEvent.click(screen.getByRole("button", { name: "Take checkpoint" }));
    const quiz = getQuizForLesson("lesson-python-zero-files-folders");
    await answerQuiz(quiz);
    fireEvent.click(getQuizSubmitButton());

    await screen.findAllByText("Checkpoint passed");
    const all = screen.getAllByText("Checkpoint passed");
    console.log("COUNT:", all.length);
    for (const el of all) {
      const chain: string[] = [];
      let node: HTMLElement | null = el;
      for (let i = 0; i < 6 && node; i += 1) {
        chain.push(`${node.tagName}[${node.getAttribute("aria-label") ?? node.getAttribute("class")?.slice(0, 30) ?? ""}]`);
        node = node.parentElement as HTMLElement | null;
      }
      console.log("CHAIN:", chain.join(" < "));
    }
    expect(true).toBe(true);
  });
});
