import { describe, expect, it } from "vitest";
import { buildTerminalTranscript, emptyHiddenCheckSummary } from "@/domain/code-run";
import type { ProblemDiagnostic } from "@/domain/types";

function phaseStatuses(diagnostics: ProblemDiagnostic[]) {
  const events = buildTerminalTranscript({
    command: "run lesson.ts",
    diagnostics,
    hiddenCheckSummary: emptyHiddenCheckSummary(),
    language: "typescript",
    passed: false,
    runMode: "run_checks",
    runtimeMs: 5,
    stderr: "",
    stdout: "",
    testResults: []
  });

  return new Map(
    events
      .filter((event): event is Extract<typeof event, { type: "phase" }> => event.type === "phase")
      .map((event) => [event.label, event.status])
  );
}

describe("terminal phase status", () => {
  it("marks the TypeScript typecheck phase failed, not prepare", () => {
    const typeError: ProblemDiagnostic = {
      id: "typescript-typecheck-error",
      severity: "error",
      source: "parser",
      message: "lesson.ts(1,7): error TS2322: Type 'string' is not assignable to type 'number'.",
      beginnerExplanation: "TypeScript found a type mismatch before running the code.",
      rawDetail: "lesson.ts(1,7): error TS2322",
      line: 1,
      column: 7,
      confidence: "known"
    };

    const statuses = phaseStatuses([typeError]);

    expect(statuses.get("[prepare] Reading TypeScript source...")).toBe("done");
    expect(statuses.get("[typecheck] Checking TypeScript types...")).toBe("failed");
    expect(statuses.get("[transform] Preparing JavaScript runtime...")).toBe("pending");
    expect(statuses.get("[execute] Running lesson.ts...")).toBe("pending");
  });
});
