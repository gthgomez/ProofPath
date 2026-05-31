import { describe, expect, it } from "vitest";
import {
  buildRunningTerminalEvents,
  codeRunCommand,
  createProofArtifactFromAttempt,
  formatTerminalTranscript,
  normalizeCodeRunAttempt,
  phaseLabelsFor,
  redactCheckResults,
  runtimeCapabilitiesFor
} from "@/domain/code-run";
import { createInitialProgress, recordCodeRunAttempt } from "@/domain/progress";
import { buildProblemDiagnostics } from "@/sandbox/diagnostics";
import { runLessonSandbox } from "@/sandbox/runner";

describe("production-style sandbox workflow contracts", () => {
  it("redacts hidden check messages and private summary metadata", () => {
    const redacted = redactCheckResults([
      { id: "visible", name: "Visible output", passed: true, visible: true, message: "Passed" },
      { id: "hidden", name: "Hidden edge case", passed: false, visible: false, message: "secret edge case expected 42" }
    ]);

    expect(redacted.visibleCheckResults).toHaveLength(1);
    expect(redacted.visibleCheckResults[0]?.message).toBe("Passed");
    expect(JSON.stringify(redacted.visibleCheckResults)).not.toContain("secret edge case");
    expect(redacted.hiddenCheckSummary).toEqual({ total: 1, passed: 0, failed: 1 });
  });

  it("builds language-accurate phase labels without Python compile or fake TypeScript typecheck", () => {
    expect(phaseLabelsFor("python", "run_checks").join("\n")).toContain("[parse] Checking Python syntax");
    expect(phaseLabelsFor("python", "run_checks").join("\n")).not.toMatch(/compile/i);
    expect(phaseLabelsFor("typescript", "run_checks").join("\n")).toContain("[transform] Preparing JavaScript runtime");
    expect(phaseLabelsFor("typescript", "run_checks").join("\n")).not.toMatch(/typecheck/i);

    const runningEvents = buildRunningTerminalEvents("python", "run_checks", 1);
    expect(runningEvents[0]).toEqual({ type: "context", cwd: "careerforge://lesson-sandbox", file: "study_session.py", language: "python" });
    expect(runningEvents[1]).toEqual({ type: "command", text: `$ ${codeRunCommand("python", "run_checks")}` });
    expect(runningEvents.some((event) => event.type === "phase" && event.status === "active")).toBe(true);
  });

  it("keeps TypeScript runtime capability honest until full compiler validation exists", () => {
    const capabilities = runtimeCapabilitiesFor("typescript");

    expect(capabilities.workflowLabel).toBe("transform + run + verify");
    expect(capabilities.supportsTypecheck).toBe(false);
    expect(capabilities.beginnerNote).toContain("does not run the full TypeScript compiler yet");
  });

  it("keeps run file attempts from completing progress or creating proof", () => {
    const progress = recordCodeRunAttempt(createInitialProgress(), normalizeCodeRunAttempt({
      id: "run-file-1",
      lessonId: "lesson-python-values",
      language: "python",
      runMode: "run_file",
      command: "python study_session.py",
      codeSnapshot: "print('python')",
      stdout: "python",
      stderr: "",
      passed: true,
      score: 0,
      runtimeMs: 4,
      testResults: [],
      createdAt: "2026-05-08T21:00:00.000Z"
    }), "2026-05-08T21:00:00.000Z");

    expect(progress.completedLessonMiniProjectIds).toEqual([]);
    expect(progress.evidenceItems).toEqual([]);
  });

  it("creates proof evidence only from passing run checks", () => {
    const attempt = normalizeCodeRunAttempt({
      id: "run-checks-1",
      lessonId: "lesson-python-values",
      language: "python",
      runMode: "run_checks",
      command: "careerforge checks study_session.py",
      codeSnapshot: "print('python')",
      stdout: "python",
      stderr: "",
      passed: true,
      score: 100,
      runtimeMs: 6,
      testResults: [
        { id: "visible", name: "Visible output", passed: true, visible: true, message: "Passed" },
        { id: "hidden", name: "Hidden exact value", passed: true, visible: false, message: "secret hidden pass" }
      ],
      createdAt: "2026-05-08T21:01:00.000Z"
    });
    const proof = createProofArtifactFromAttempt(attempt);
    const progress = recordCodeRunAttempt(createInitialProgress(), attempt, "2026-05-08T21:01:00.000Z");

    expect(proof?.hiddenCheckSummary).toEqual({ total: 0, passed: 0, failed: 0 });
    expect(JSON.stringify(proof)).not.toContain("secret hidden pass");
    expect(JSON.stringify(proof)).not.toContain("Hidden checks");
    expect(progress.completedLessonMiniProjectIds).toEqual(["lesson-python-values"]);
    expect(progress.evidenceItems[0]?.proofArtifact?.sourceRunAttemptId).toBe("run-checks-1");
  });

  it("creates deterministic Python diagnostics without guessed locations", () => {
    const syntaxDiagnostics = buildProblemDiagnostics({
      language: "python",
      stderr: 'File "<string>", line 3\nSyntaxError: invalid syntax'
    });
    const nameDiagnostics = buildProblemDiagnostics({
      language: "python",
      stderr: "NameError: minutes is not defined"
    });
    const timeoutDiagnostics = buildProblemDiagnostics({
      language: "python",
      timedOut: true
    });

    expect(syntaxDiagnostics[0]).toMatchObject({ source: "parser", confidence: "known", line: 3 });
    expect(nameDiagnostics[0]).toMatchObject({ source: "runtime", confidence: "unknown" });
    expect(timeoutDiagnostics[0]).toMatchObject({ id: "runtime-timeout", confidence: "unknown" });
  });

  it("reports policy blocks as policy diagnostics and terminal policy results", async () => {
    const result = await runLessonSandbox({
      language: "javascript",
      instructions: "Run a local script.",
      starterCode: "console.log('ok')",
      visibleTests: [{ id: "visible", name: "Visible", code: "", expectedOutputIncludes: ["ok"] }],
      hiddenTests: [],
      expectedOutput: ["ok"],
      timeoutMs: 1000,
      allowNetwork: false
    }, "lesson-js-policy", "fetch('https://example.com')", "2026-05-08T21:02:00.000Z", "run_checks");

    expect(result.passed).toBe(false);
    expect(result.diagnostics[0]).toMatchObject({ source: "policy" });
    expect(result.terminalTranscript).toContainEqual({ type: "result", status: "policy_blocked", runtimeMs: result.runtimeMs, reason: "policy_blocked" });
    expect(result.terminalTranscript.filter((event) => event.type === "phase").every((event) => event.status === "skipped")).toBe(true);
  });

  it("uses phase-specific terminal statuses and canonical copy transcripts", () => {
    const attempt = normalizeCodeRunAttempt({
      id: "run-checks-failed",
      lessonId: "lesson-python-values",
      language: "python",
      runMode: "run_checks",
      command: "careerforge checks study_session.py",
      codeSnapshot: "print('wrong')",
      stdout: "wrong",
      stderr: "",
      passed: false,
      score: 50,
      runtimeMs: 9,
      testResults: [
        { id: "visible", name: "Visible output", passed: false, visible: true, message: "Missing expected output" },
        { id: "hidden", name: "Hidden exact value", passed: true, visible: false, message: "secret hidden clue" }
      ],
      createdAt: "2026-05-08T21:03:00.000Z"
    });

    const phases = attempt.terminalTranscript.filter((event) => event.type === "phase");
    const transcript = formatTerminalTranscript(attempt.terminalTranscript);

    expect(phases.map((event) => event.status)).toEqual(["done", "done", "failed"]);
    expect(transcript).toContain("[result] failed (check_failed, exit 1)");
    expect(transcript).not.toContain("Hidden checks");
    expect(transcript).not.toContain("hidden checks");
    expect(transcript).not.toContain("secret hidden clue");
  });

  it("marks syntax failures before execution and skips later phases", () => {
    const diagnostics = buildProblemDiagnostics({
      language: "python",
      stderr: 'File "<string>", line 2\nSyntaxError: invalid syntax'
    });
    const attempt = normalizeCodeRunAttempt({
      id: "run-checks-syntax",
      lessonId: "lesson-python-values",
      language: "python",
      runMode: "run_checks",
      command: "careerforge checks study_session.py",
      codeSnapshot: "print(",
      stdout: "",
      stderr: 'File "<string>", line 2\nSyntaxError: invalid syntax',
      passed: false,
      score: 0,
      runtimeMs: 3,
      testResults: [],
      diagnostics,
      createdAt: "2026-05-08T21:04:00.000Z"
    });

    expect(attempt.terminalTranscript.filter((event) => event.type === "phase").map((event) => event.status))
      .toEqual(["failed", "skipped", "skipped"]);
    expect(attempt.terminalTranscript).toContainEqual({ type: "result", status: "failed", runtimeMs: 3, exitCode: 1, reason: "syntax_error" });
  });
});
