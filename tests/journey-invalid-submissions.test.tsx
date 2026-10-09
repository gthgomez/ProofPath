// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import {
  clearStoredProgress,
  getQuizForLesson,
  getQuizSubmitButton,
  renderEvidenceScreen,
  renderLessonScreen,
  seedOnboardingComplete,
  seedStoredProgress
} from "./journey-helpers";

vi.mock("expo-router", () => import("./mocks/expo-router"));
vi.mock("@/sandbox/runner", () => import("./mocks/sandbox-runner"));
vi.mock("react-native-safe-area-context", () => import("./mocks/safe-area-context"));

const LESSON_ID = "lesson-python-zero-files-folders";

describe("invalid submissions", () => {
  beforeEach(() => {
    clearStoredProgress();
    seedOnboardingComplete();
  });

  it("keeps the checkpoint submit button disabled while questions are unanswered", async () => {
    seedStoredProgress({ durableLessonMiniProjectIds: [LESSON_ID] });
    renderLessonScreen(LESSON_ID);

    fireEvent.click(screen.getByRole("button", { name: "Checkpoint step" }));
    const quiz = getQuizForLesson(LESSON_ID);

    expect(getQuizSubmitButton()).toBeDisabled();

    // Answer only the first question — the rest are still missing.
    const firstQuestion = quiz.questions[0];
    const badge = screen.getByText(`Question 1/${quiz.questions.length}`);
    const questionBlock = badge.parentElement?.parentElement?.parentElement;
    if (!questionBlock) {
      throw new Error("Could not locate question block");
    }
    const { within } = await import("@testing-library/react");
    fireEvent.click(within(questionBlock as HTMLElement).getByRole("button", {
      name: firstQuestion.choices[firstQuestion.correctChoiceIndex]
    }));

    expect(getQuizSubmitButton()).toBeDisabled();
  });

  it("disables evidence save until both title and note are filled", () => {
    renderEvidenceScreen();

    const saveButton = screen.getByRole("button", { name: "Save evidence" });
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Evidence title"), { target: { value: "My proof" } });
    expect(screen.getByRole("button", { name: "Save evidence" })).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Evidence note"), { target: { value: "What changed and why it matters." } });
    expect(screen.getByRole("button", { name: "Save evidence" })).toBeEnabled();
  });

  it("rejects an invalid repo URL with a validation error", async () => {
    renderEvidenceScreen();

    // Unlock the Git detail fields, then expand the optional detail disclosure
    // so the Repository URL input is rendered.
    fireEvent.click(screen.getByRole("button", { name: /Enable Desktop Developer Mode/ }));
    fireEvent.click(screen.getByRole("button", { name: /Add repo, README, artifact, or reflection/ }));

    fireEvent.change(screen.getByLabelText("Evidence title"), { target: { value: "Broken link" } });
    fireEvent.change(screen.getByLabelText("Evidence note"), { target: { value: "This evidence has a malformed repo URL." } });
    fireEvent.change(screen.getByLabelText("Repository URL"), { target: { value: "not-a-url" } });

    fireEvent.click(screen.getByRole("button", { name: "Save evidence" }));

    expect(await screen.findByText("Repo URL must start with http:// or https://.")).toBeInTheDocument();
    // The entry was not saved.
    expect(screen.getByText("0 entries")).toBeInTheDocument();
  });

  it("saves a valid evidence entry and clears the form", async () => {
    renderEvidenceScreen();

    fireEvent.change(screen.getByLabelText("Evidence title"), { target: { value: "Study Tracker proof" } });
    fireEvent.change(screen.getByLabelText("Evidence note"), { target: { value: "Check output captured from the Code Lab." } });

    fireEvent.click(screen.getByRole("button", { name: "Save evidence" }));

    // The entry appears in the portfolio list and the form clears.
    expect(await screen.findByText("1 entries")).toBeInTheDocument();
    expect(screen.getByText("Study Tracker proof")).toBeInTheDocument();
    expect((screen.getByLabelText("Evidence title") as HTMLInputElement).value).toBe("");
  });

  it("prefills the evidence form from a passing Code Lab run", async () => {
    seedStoredProgress({
      codeRunAttempts: [{
        id: "code-run-seeded",
        lessonId: LESSON_ID,
        language: "python",
        runMode: "run_checks",
        command: "verify",
        codeSnapshot: "print(\"py\")",
        stdout: "py",
        stderr: "",
        passed: true,
        score: 100,
        runtimeMs: 10,
        testResults: [],
        hiddenCheckSummary: { total: 1, passed: 1, failed: 0 },
        diagnostics: [],
        terminalTranscript: [],
        createdAt: "2026-01-02T00:00:00.000Z"
      }]
    });

    renderEvidenceScreen({ lessonId: LESSON_ID, prefill: "codelab" });

    await waitFor(() => {
      expect((screen.getByLabelText("Evidence title") as HTMLInputElement).value).toContain("proof");
    });
    expect((screen.getByLabelText("Evidence note") as HTMLInputElement).value).toContain("Automatically verified");
    expect(screen.getByRole("button", { name: "Save evidence" })).toBeEnabled();
  });

  it("permits opening sample python lesson directly without mandatory onboarding setup", async () => {
    clearStoredProgress();
    // Do not seed onboarding; should still render sample lesson without redirection
    renderLessonScreen("lesson-python-zero-first-script");
    expect(await screen.findByText("Running Your First Script")).toBeInTheDocument();
  });
});
