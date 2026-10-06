import type { CodeRunAttempt, CodeRunMode, LessonRunnerSpec } from "@/domain/types";

/**
 * Test double for the sandbox runner. The real runner boots pyodide/sql.js
 * from CDN assets, which is impossible in jsdom. Journey tests configure the
 * desired outcome with `__setSandboxOutcome` and inspect calls through
 * `__lastSandboxCall`.
 */

export type SandboxOutcome = "pass" | "fail";

interface SandboxCall {
  lessonId: string;
  runMode: CodeRunMode;
  code: string;
}

let outcome: SandboxOutcome = "pass";
let lastCall: SandboxCall | null = null;

export function __setSandboxOutcome(next: SandboxOutcome): void {
  outcome = next;
}

export function __lastSandboxCall(): SandboxCall | null {
  return lastCall;
}

export function preloadSandbox(_language: string): void {
  // No-op: the real runner preloads pyodide/sql.js runtimes.
}

export function getSandboxCapabilityLabel(language: string): { label: string; note: string } {
  return {
    label: `${language} (test double)`,
    note: "Sandbox execution is mocked in journey tests."
  };
}

export async function runLessonSandbox(
  spec: LessonRunnerSpec,
  lessonId: string,
  code: string,
  now = new Date().toISOString(),
  runMode: CodeRunMode = "run_checks"
): Promise<CodeRunAttempt> {
  lastCall = { lessonId, runMode, code };

  const passed = outcome === "pass";
  const stdout = passed ? "py" : "";
  const stderr = passed ? "" : "AssertionError: check failed";

  return {
    id: `code-run-${lessonId}-${now.replace(/[^0-9]/g, "")}`,
    lessonId,
    language: spec.language,
    runMode,
    command: runMode === "run_file" ? `${spec.language} main.py` : `verify ${lessonId}`,
    codeSnapshot: code,
    stdout,
    stderr,
    passed,
    score: passed ? 100 : 0,
    runtimeMs: 12,
    testResults: [
      {
        id: "mock-check",
        name: "Mock visible check",
        passed,
        visible: true,
        message: passed ? "Check passed" : "Check failed"
      }
    ],
    hiddenCheckSummary: {
      total: 1,
      passed: passed ? 1 : 0,
      failed: passed ? 0 : 1
    },
    diagnostics: passed ? [] : [{
      id: "mock-diagnostic",
      severity: "error",
      source: "check",
      message: "Check failed",
      line: 1,
      confidence: "known"
    }],
    terminalTranscript: [
      { type: "command", text: runMode === "run_file" ? "$ python main.py" : "$ verify" },
      { type: "stdout", text: stdout },
      { type: "result", status: passed ? "passed" : "failed", reason: passed ? "success" : "check_failed", exitCode: passed ? 0 : 1, runtimeMs: 12 }
    ],
    createdAt: now
  };
}
