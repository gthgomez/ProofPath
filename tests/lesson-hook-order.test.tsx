// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SafeAreaProvider } from "react-native-safe-area-context";
import LessonDetailScreen from "../app/lesson/[lessonId]";
import { ProgressProvider } from "@/state/progress-provider";
import { contentPack } from "@/content/seed";
import { findLesson } from "@/domain/content";
import { __setParams } from "./mocks/expo-router";

// Mirrors the native SQLite hydration transition: the onboarding gate reports
// "still checking" on the first render and "ready" after hydration. Before the
// fix, an effect sat below the early returns, so this transition changed the
// hook count on the same component instance and React threw.
const gate = vi.hoisted(() => ({ checking: true, listeners: new Set<() => void>() }));

vi.mock("expo-router", () => import("./mocks/expo-router"));
vi.mock("react-native-safe-area-context", () => import("./mocks/safe-area-context"));
vi.mock("@/ui/onboarding-guard", async () => {
  const React = await import("react");
  return {
    useOnboardingGate: () => {
      const [, forceRender] = React.useReducer((value: number) => value + 1, 0);
      React.useEffect(() => {
        gate.listeners.add(forceRender);
        return () => {
          gate.listeners.delete(forceRender);
        };
      }, []);
      return { isCheckingOnboarding: gate.checking, needsOnboarding: false };
    }
  };
});

const LESSON_ID = "lesson-python-zero-first-script";

describe("lesson screen hook order", () => {
  beforeEach(() => {
    gate.checking = true;
    gate.listeners.clear();
    window.localStorage.clear();
    window.localStorage.setItem("proofpath.progress.v1", JSON.stringify({
      profile: { onboardingCompletedAt: "2026-01-01T00:00:00.000Z" }
    }));
    __setParams({ lessonId: LESSON_ID });
  });

  it("hydrates from loading to the lesson without changing the hook count", async () => {
    const lesson = findLesson(contentPack, LESSON_ID);
    expect(lesson).toBeDefined();

    render(
      <SafeAreaProvider>
        <ProgressProvider>
          <LessonDetailScreen />
        </ProgressProvider>
      </SafeAreaProvider>
    );

    expect(screen.getByLabelText("Loading lesson")).toBeInTheDocument();

    // The hydration completes on the same mounted instance.
    act(() => {
      gate.checking = false;
      for (const listener of gate.listeners) {
        listener();
      }
    });

    expect(await screen.findByText(lesson!.title)).toBeInTheDocument();
    expect(screen.queryByLabelText("Loading lesson")).not.toBeInTheDocument();
  });
});
