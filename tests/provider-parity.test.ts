import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

function read(relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}

/**
 * The two progress providers are separate platform files. They have drifted
 * before: web `fastTrack` awarded completion while native only placed out.
 * These checks make the shared public contract explicit and prevent the same
 * divergence from returning silently.
 */
describe("web/native progress provider parity", () => {
  const web = read("src/state/progress-provider.web.tsx");
  const native = read("src/state/progress-provider.tsx");

  it("both expose the same public operations", () => {
    for (const operation of [
      "selectRoleTarget",
      "recordRecallReview",
      "recordCodeRun",
      "submitQuiz",
      "addEvidence",
      "generateWeeklyCareerReport",
      "resetLocalProgress",
      "restoreBackup",
      "dismissTour",
      "placement"
    ]) {
      expect(web).toContain(operation);
      expect(native).toContain(operation);
    }
  });

  it("placement means placement out of prerequisites on both platforms, never completion", () => {
    for (const source of [web, native]) {
      expect(source).toMatch(/placement: \(lessonIds, quizIds\) => \{\s*updateProgress\(\(currentProgress\) => placementSkip/);
      expect(source).not.toContain("fastTrackLessons");
    }
  });

  it("restore uses the coordinated durable protocol on both platforms", () => {
    for (const source of [web, native]) {
      expect(source).toContain("coordinatedProgressRestore");
      expect(source).toContain("recoverPendingProgressRestore");
      expect(source).not.toContain("restoreProgress:");
    }
  });
});
