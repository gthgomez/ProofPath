import type {
  CodeRunAttempt,
  CodeRunMode,
  CodeRunTestResult,
  HiddenCheckSummary,
  ProblemDiagnostic,
  ProofArtifact,
  RunnerLanguage,
  SandboxRuntimeCapabilities,
  TerminalEvent,
  TerminalPhaseStatus,
  TerminalResultReason
} from "@/domain/types";

const MAX_PROOF_CODE_SNAPSHOT_LENGTH = 12000;

export function codeRunCommand(language: RunnerLanguage, runMode: CodeRunMode): string {
  const fileName = defaultFileName(language);
  if (runMode === "run_file") {
    if (language === "python") {
      return `python ${fileName}`;
    }

    if (language === "sql") {
      return `sqlite3 careerforge.db < ${fileName}`;
    }

    if (language === "typescript") {
      return `careerforge run ${fileName}`;
    }

    return `node ${fileName}`;
  }

  return `careerforge checks ${fileName}`;
}

export function runtimeCapabilitiesFor(language: RunnerLanguage): SandboxRuntimeCapabilities {
  if (language === "python") {
    return {
      language,
      workflowLabel: "syntax + execute + verify",
      supportsRunFile: true,
      supportsRunChecks: true,
      supportsProofCapture: true,
      supportsTypecheck: false,
      limitations: [
        "Web uses Pyodide for Python execution.",
        "Native offline fallback supports the beginner subset used by early Python proof lessons.",
        "No package installation, network access, or filesystem writes are available in the lesson sandbox."
      ]
    };
  }

  if (language === "sql") {
    return {
      language,
      workflowLabel: "prepare database + execute + verify",
      supportsRunFile: true,
      supportsRunChecks: true,
      supportsProofCapture: true,
      supportsTypecheck: false,
      limitations: [
        "SQL runs against lesson-provided in-memory data.",
        "Mutation statements are blocked for read-only beginner labs.",
        "No external database connection is available in the lesson sandbox."
      ]
    };
  }

  if (language === "typescript") {
    return {
      language,
      workflowLabel: "transform + run + verify",
      supportsRunFile: true,
      supportsRunChecks: true,
      supportsProofCapture: true,
      supportsTypecheck: false,
      beginnerNote: "This lab transforms and runs TypeScript for lesson checks. It does not run the full TypeScript compiler yet.",
      limitations: [
        "TypeScript is transformed for execution before checks run.",
        "The sandbox does not perform full compiler validation yet.",
        "Use external project commands when a lesson asks for full TypeScript validation evidence."
      ]
    };
  }

  return {
    language,
    workflowLabel: "parse + execute + verify",
    supportsRunFile: true,
    supportsRunChecks: true,
    supportsProofCapture: true,
    supportsTypecheck: false,
    limitations: [
      "JavaScript runs in an offline lesson sandbox.",
      "Network, filesystem, and process APIs are blocked.",
      "No package installation is available in the lesson sandbox."
    ]
  };
}

export function defaultFileName(language: RunnerLanguage): string {
  if (language === "python") {
    return "study_session.py";
  }

  if (language === "sql") {
    return "query.sql";
  }

  if (language === "typescript") {
    return "lesson.ts";
  }

  return "lesson.js";
}

export function emptyHiddenCheckSummary(): HiddenCheckSummary {
  return { total: 0, passed: 0, failed: 0 };
}

export function redactCheckResults(testResults: CodeRunTestResult[]): {
  hiddenCheckSummary: HiddenCheckSummary;
  visibleCheckResults: CodeRunTestResult[];
} {
  const visibleCheckResults = testResults
    .filter((result) => result.visible)
    .map((result) => ({ ...result, visible: true }));
  const hiddenResults = testResults.filter((result) => !result.visible);

  return {
    visibleCheckResults,
    hiddenCheckSummary: {
      total: hiddenResults.length,
      passed: hiddenResults.filter((result) => result.passed).length,
      failed: hiddenResults.filter((result) => !result.passed).length
    }
  };
}

export function normalizeCodeRunAttempt(attempt: Partial<CodeRunAttempt> & Pick<CodeRunAttempt, "id" | "lessonId" | "language" | "codeSnapshot" | "stdout" | "stderr" | "passed" | "score" | "runtimeMs" | "testResults" | "createdAt">): CodeRunAttempt {
  const runMode = attempt.runMode ?? "run_checks";
  const redacted = redactCheckResults(attempt.testResults ?? []);
  const hiddenCheckSummary = emptyHiddenCheckSummary();
  const diagnostics = attempt.diagnostics ?? [];
  const command = attempt.command ?? codeRunCommand(attempt.language, runMode);
  const terminalTranscript = attempt.terminalTranscript ?? buildTerminalTranscript({
    command,
    diagnostics,
    hiddenCheckSummary,
    language: attempt.language,
    passed: attempt.passed,
    runMode,
    runtimeMs: attempt.runtimeMs,
    stderr: attempt.stderr,
    stdout: attempt.stdout,
    testResults: redacted.visibleCheckResults
  });

  return {
    ...attempt,
    runMode,
    command,
    testResults: redacted.visibleCheckResults,
    hiddenCheckSummary,
    diagnostics,
    terminalTranscript
  };
}

export function buildRunningTerminalEvents(language: RunnerLanguage, runMode: CodeRunMode, activePhaseIndex: number): TerminalEvent[] {
  const phases = phaseLabelsFor(language, runMode);
  return [
    buildTerminalContextEvent(language),
    { type: "command", text: `$ ${codeRunCommand(language, runMode)}` },
    ...phases.map((label, index): TerminalEvent => ({
      type: "phase",
      label,
      status: index < activePhaseIndex ? "done" : index === activePhaseIndex ? "active" : "pending"
    }))
  ];
}

export function buildTerminalTranscript({
  command,
  diagnostics,
  hiddenCheckSummary,
  language,
  passed,
  runMode,
  runtimeMs,
  stderr,
  stdout,
  testResults
}: {
  command: string;
  diagnostics: ProblemDiagnostic[];
  hiddenCheckSummary: HiddenCheckSummary;
  language: RunnerLanguage;
  passed: boolean;
  runMode: CodeRunMode;
  runtimeMs: number;
  stderr: string;
  stdout: string;
  testResults: CodeRunTestResult[];
}): TerminalEvent[] {
  const reason = terminalResultReason({ diagnostics, passed, runMode, testResults });
  const resultStatus = resultStatusFromReason(reason);
  const exitCode = exitCodeFromReason(reason);
  const phases = phaseLabelsFor(language, runMode);
  const events: TerminalEvent[] = [
    buildTerminalContextEvent(language),
    { type: "command", text: `$ ${command}` },
    ...phases.map((label, index): TerminalEvent => ({
      type: "phase",
      label,
      status: phaseStatusForReason(reason, phases, index, runMode)
    }))
  ];

  if (stdout) {
    events.push({ type: "stdout", text: stdout });
  }

  if (stderr) {
    events.push({ type: "stderr", text: stderr });
  }

  for (const diagnostic of diagnostics) {
    events.push({
      type: "diagnostic",
      severity: diagnostic.severity,
      message: diagnostic.message,
      ...(diagnostic.confidence === "known" && diagnostic.line ? { line: diagnostic.line } : {})
    });
  }

  if (runMode === "run_checks") {
    for (const result of testResults) {
      events.push({
        type: "diagnostic",
        severity: result.passed ? "info" : "error",
        message: `${result.passed ? "PASS" : "FAIL"} ${result.name}: ${result.message}`
      });
    }

  }

  events.push({
    type: "result",
    status: resultStatus,
    runtimeMs,
    ...(exitCode === undefined ? {} : { exitCode }),
    reason
  });

  return events;
}

export function phaseLabelsFor(language: RunnerLanguage, runMode: CodeRunMode): string[] {
  if (language === "python") {
    return runMode === "run_file"
      ? ["[parse] Checking Python syntax...", "[execute] Running study_session.py..."]
      : ["[parse] Checking Python syntax...", "[execute] Running study_session.py...", "[verify] Running lesson checks..."];
  }

  if (language === "sql") {
    return runMode === "run_file"
      ? ["[prepare] Loading SQLite database...", "[execute] Running query.sql..."]
      : ["[prepare] Loading SQLite database...", "[execute] Running query.sql...", "[verify] Checking result rows..."];
  }

  if (language === "typescript") {
    return runMode === "run_file"
      ? ["[prepare] Reading TypeScript source...", "[transform] Preparing JavaScript runtime...", "[execute] Running lesson.ts..."]
      : ["[prepare] Reading TypeScript source...", "[transform] Preparing JavaScript runtime...", "[execute] Running lesson.ts...", "[verify] Running lesson checks..."];
  }

  return runMode === "run_file"
    ? ["[parse] Checking JavaScript syntax...", "[execute] Running lesson.js..."]
    : ["[parse] Checking JavaScript syntax...", "[execute] Running lesson.js...", "[verify] Running lesson checks..."];
}

export function createProofArtifactFromAttempt(attempt: CodeRunAttempt, missionId?: string): ProofArtifact | null {
  const normalizedAttempt = normalizeCodeRunAttempt(attempt);
  if (normalizedAttempt.runMode !== "run_checks" || !normalizedAttempt.passed) {
    return null;
  }

  return {
    sourceRunAttemptId: normalizedAttempt.id,
    lessonId: normalizedAttempt.lessonId,
    missionId,
    language: normalizedAttempt.language,
    runMode: "run_checks",
    command: normalizedAttempt.command,
    passed: normalizedAttempt.passed,
    score: normalizedAttempt.score,
    runtimeMs: normalizedAttempt.runtimeMs,
    createdAt: normalizedAttempt.createdAt,
    stdout: normalizedAttempt.stdout,
    stderr: normalizedAttempt.stderr,
    visibleCheckResults: normalizedAttempt.testResults,
    hiddenCheckSummary: normalizedAttempt.hiddenCheckSummary,
    codeHash: hashCodeSnapshot(normalizedAttempt.codeSnapshot),
    ...(normalizedAttempt.codeSnapshot.length <= MAX_PROOF_CODE_SNAPSHOT_LENGTH ? { codeSnapshot: normalizedAttempt.codeSnapshot } : {}),
    terminalTranscript: normalizedAttempt.terminalTranscript
  };
}

export function formatProofArtifactVerifierOutput(proof: ProofArtifact): string {
  return formatTerminalTranscript(proof.terminalTranscript);
}

export function formatTerminalTranscript(events: TerminalEvent[]): string {
  return events.map((event): string => {
    if (event.type === "context") {
      return `[context] cwd=${event.cwd} file=${event.file} language=${event.language}`;
    }

    if (event.type === "command") {
      return event.text;
    }

    if (event.type === "phase") {
      return `${event.label} ${event.status}`;
    }

    if (event.type === "stdout") {
      return `[stdout]\n${event.text}`;
    }

    if (event.type === "stderr") {
      return `[stderr]\n${event.text}`;
    }

    if (event.type === "diagnostic") {
      const location = typeof event.line === "number" ? `line ${event.line}: ` : "Location unknown: ";
      return `[${event.severity}] ${location}${event.message}`;
    }

    const exitLabel = event.status === "policy_blocked"
      ? "blocked"
      : typeof event.exitCode === "number"
        ? `exit ${event.exitCode}`
        : "no exit code";
    return `[result] ${event.status} (${event.reason}, ${exitLabel}) in ${event.runtimeMs}ms`;
  }).join("\n");
}

export function formatLegacyProofArtifactVerifierOutput(proof: ProofArtifact): string {
  return [
    `$ ${proof.command}`,
    `status: ${proof.passed ? "passed" : "failed"}`,
    `runtime: ${proof.runtimeMs}ms`,
    proof.stdout ? `stdout:\n${proof.stdout}` : undefined,
    proof.stderr ? `stderr:\n${proof.stderr}` : undefined,
    `visible checks: ${proof.visibleCheckResults.filter((result) => result.passed).length}/${proof.visibleCheckResults.length} passed`,
    "private verifier details: redacted",
    `code hash: ${proof.codeHash}`
  ].filter(Boolean).join("\n\n");
}

function buildTerminalContextEvent(language: RunnerLanguage): TerminalEvent {
  return {
    type: "context",
    cwd: "careerforge://lesson-sandbox",
    file: defaultFileName(language),
    language
  };
}

function terminalResultReason({
  diagnostics,
  passed,
  runMode,
  testResults
}: {
  diagnostics: ProblemDiagnostic[];
  passed: boolean;
  runMode: CodeRunMode;
  testResults: CodeRunTestResult[];
}): TerminalResultReason {
  if (passed) {
    return "success";
  }

  if (diagnostics.some((diagnostic) => diagnostic.source === "policy")) {
    return "policy_blocked";
  }

  if (diagnostics.some((diagnostic) => /timeout|timed out|took too long/i.test(diagnostic.message))) {
    return "timeout";
  }

  if (diagnostics.some((diagnostic) => diagnostic.source === "parser")) {
    return "syntax_error";
  }

  if (runMode === "run_checks" && testResults.some((testResult) => !testResult.passed)) {
    return testResults.some((testResult) => testResult.id.includes("runner-error"))
      ? "runner_error"
      : "check_failed";
  }

  if (diagnostics.some((diagnostic) => diagnostic.source === "system")) {
    return "runner_error";
  }

  return "runtime_error";
}

function resultStatusFromReason(reason: TerminalResultReason): "passed" | "failed" | "timeout" | "policy_blocked" {
  if (reason === "success") {
    return "passed";
  }

  if (reason === "timeout") {
    return "timeout";
  }

  if (reason === "policy_blocked") {
    return "policy_blocked";
  }

  return "failed";
}

function exitCodeFromReason(reason: TerminalResultReason): number | undefined {
  if (reason === "success") {
    return 0;
  }

  if (reason === "policy_blocked") {
    return undefined;
  }

  if (reason === "timeout") {
    return 124;
  }

  return 1;
}

function phaseStatusForReason(
  reason: TerminalResultReason,
  phases: string[],
  index: number,
  runMode: CodeRunMode
): TerminalPhaseStatus {
  if (reason === "success") {
    return "done";
  }

  if (reason === "policy_blocked") {
    return "skipped";
  }

  if (reason === "syntax_error") {
    // Parsing is the first gate. Later phases were never attempted, so keep
    // them pending instead of implying that the runner deliberately skipped
    // their work.
    return index === 0 ? "failed" : "pending";
  }

  const verifyIndex = phases.findIndex((phase) => phase.includes("[verify]"));
  const executeIndex = phases.findIndex((phase) => phase.includes("[execute]"));

  if (reason === "check_failed") {
    if (verifyIndex >= 0) {
      return index < verifyIndex ? "done" : index === verifyIndex ? "failed" : "skipped";
    }
    return index === phases.length - 1 ? "failed" : "done";
  }

  if (reason === "runtime_error" || reason === "timeout") {
    const failureIndex = executeIndex >= 0 ? executeIndex : Math.max(0, phases.length - 1);
    return index < failureIndex ? "done" : index === failureIndex ? "failed" : "pending";
  }

  if (reason === "runner_error") {
    // A runner exception is raised while executing learner code (before the
    // checks can run), so it has the same phase boundary as a runtime error.
    // This avoids falsely reporting verification as failed when it never ran.
    const failureIndex = executeIndex >= 0 ? executeIndex : 0;
    return index < failureIndex ? "done" : index === failureIndex ? "failed" : "pending";
  }

  return "failed";
}

function hashCodeSnapshot(code: string): string {
  let hash = 5381;
  for (let index = 0; index < code.length; index += 1) {
    hash = ((hash << 5) + hash) ^ code.charCodeAt(index);
  }

  return `cf-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
