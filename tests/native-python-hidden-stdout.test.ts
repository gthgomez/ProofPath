import { describe, expect, it } from "vitest";
import type { LessonRunnerSpec } from "@/domain/types";
import { formatTerminalTranscript, PRIVATE_VERIFICATION_DIAGNOSTIC_ID } from "@/domain/code-run";
import { runNativePythonProof } from "@/sandbox/native-python-proof-runner";

const SECRET = "HIDDEN_NATIVE_SENTINEL_2026";
const SECRET_EXPECTED = "SECRET_EXPECTED_ROW_2026";

describe("native offline Python hidden stdout rollback", () => {
  it("never publishes a hidden print into learner-visible stdout and still grades the hidden failure", () => {
    const spec: LessonRunnerSpec = {
      language: "python",
      instructions: "Print ok.",
      starterCode: 'print("ok")',
      visibleTests: [
        { id: "visible", name: "Visible check", code: "# comment-only", expectedOutputIncludes: ["ok"] }
      ],
      hiddenTests: [
        {
          id: "hidden",
          name: "Hidden check",
          code: `print("${SECRET}")`,
          expectedOutputIncludes: [SECRET_EXPECTED]
        }
      ],
      expectedOutput: ["ok"],
      timeoutMs: 1000,
      allowNetwork: false
    };

    const result = runNativePythonProof(
      spec,
      "lesson-synthetic-native-hidden-stdout",
      'print("ok")',
      "2026-11-15T05:35:00.000Z"
    );

    expect(result.passed).toBe(false);
    expect(result.score).toBe(50);
    expect(result.testResults.map((testResult) => testResult.id)).toEqual(["visible"]);
    expect(result.testResults[0]?.passed).toBe(true);
    expect(result.diagnostics.some((diagnostic) => diagnostic.id === PRIVATE_VERIFICATION_DIAGNOSTIC_ID)).toBe(true);

    const serialized = JSON.stringify(result);
    const transcript = formatTerminalTranscript(result.terminalTranscript);
    for (const secret of [SECRET, SECRET_EXPECTED]) {
      expect(result.stdout).not.toContain(secret);
      expect(result.stderr).not.toContain(secret);
      expect(serialized).not.toContain(secret);
      expect(transcript).not.toContain(secret);
    }
  });

  it("still keeps visible check output after a later hidden print is rolled back", () => {
    const spec: LessonRunnerSpec = {
      language: "python",
      instructions: "Print visible, then a private check prints a sentinel.",
      starterCode: 'print("visible-ok")',
      visibleTests: [
        { id: "visible", name: "Visible check", code: "# grades learner stdout", expectedOutputIncludes: ["visible-ok"] }
      ],
      hiddenTests: [
        {
          id: "hidden",
          name: "Hidden check",
          code: `print("${SECRET}")`,
          expectedOutputIncludes: ["visible-ok", SECRET]
        }
      ],
      expectedOutput: ["visible-ok"],
      timeoutMs: 1000,
      allowNetwork: false
    };

    // Hidden check expects both the learner line and its own print; grading uses
    // the pre-rollback buffers, then the sentinel must disappear from stdout.
    const result = runNativePythonProof(
      spec,
      "lesson-synthetic-native-hidden-stdout-pass",
      'print("visible-ok")',
      "2026-11-15T05:36:00.000Z"
    );

    expect(result.passed).toBe(true);
    expect(result.stdout).toContain("visible-ok");
    expect(result.stdout).not.toContain(SECRET);
    expect(JSON.stringify(result)).not.toContain(SECRET);
  });
});
