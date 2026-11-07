import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";

/**
 * The four thinnest tracks were content-only: learners read an explanation and
 * ran one project check. Add authored practice reps that ask them to diagnose a
 * snippet and then transfer the rule to a different input. This guard keeps
 * those tracks from silently regressing to reading-only lessons.
 */
describe("thin-track practice depth", () => {
  const thinTrackIds = [
    "track-ai-tools",
    "track-ai-apps",
    "track-ml",
    "track-testing-debugging"
  ];
  const modules = contentPack.modules.filter((module) => thinTrackIds.includes(module.trackId));
  const lessons = contentPack.lessons.filter((lesson) => modules.some((module) => module.id === lesson.moduleId));

  it("covers every lesson in the four thin tracks", () => {
    expect(new Set(lessons.map((lesson) => lesson.id)).size).toBe(8);
  });

  it("gives every thin-track lesson at least two practice reps with a transfer task", () => {
    for (const lesson of lessons) {
      const reps = lesson.workshop.practiceReps ?? [];
      expect(reps.length, `${lesson.id} should have at least two practice reps`).toBeGreaterThanOrEqual(2);
      expect(
        reps.some((rep) => rep.tier === "transfer"),
        `${lesson.id} should include a transfer rep`
      ).toBe(true);
      expect(
        reps.some((rep) => rep.tier === "diagnose"),
        `${lesson.id} should include a diagnose rep`
      ).toBe(true);
    }
  });
});
