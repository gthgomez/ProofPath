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

/**
 * Version of the sandbox output disclosure boundary.
 *
 * Version 2 runners sanitize private check output at the source: hidden stdout
 * and stderr are rolled back per check, hidden results are removed, and the
 * public hidden summary is zeroed. Records produced before this marker existed
 * cannot be assumed to have that property, because their raw buffers may still
 * contain hidden verifier output.
 */
export const CURRENT_SANDBOX_DISCLOSURE_VERSION = 2;

/**
 * Shown in place of quarantined legacy sandbox output. We cannot reliably split
 * an old mixed stdout/stderr buffer into public and private text, so the honest
 * choice is to omit the ambiguous material and say so rather than publish it.
 */
export const LEGACY_OUTPUT_QUARANTINE_NOTICE =
  "Legacy sandbox output withheld because it predates per-check disclosure boundaries. Visible check results and the learner's own code are preserved; raw stdout, stderr, diagnostics, and terminal text are omitted.";

function hasTrustedDisclosure(version: number | undefined, importedAt: string | undefined): boolean {
  // A marker that arrived inside a backup is an assertion by the document, not
  // evidence that this device's sanitizing runner produced the buffer. Imported
  // records are always quarantined regardless of the supplied version.
  if (importedAt) {
    return false;
  }
  return typeof version === "number" && version >= CURRENT_SANDBOX_DISCLOSURE_VERSION;
}

function legacyQuarantineDiagnostic(): ProblemDiagnostic {
  return {
    id: "legacy-output-quarantine",
    severity: "info",
    source: "runtime",
    message: LEGACY_OUTPUT_QUARANTINE_NOTICE,
    confidence: "known"
  };
}

/**
 * Legacy check results carry runner-generated names, ids, and messages that we
 * cannot prove are free of hidden verifier text. Preserve the pass/fail shape
 * (which drives the already-computed grade) but synthesize neutral labels.
 */
function sanitizeLegacyVisibleResults(results: CodeRunTestResult[]): CodeRunTestResult[] {
  return results
    .filter((result) => result.visible)
    .map((result, index) => ({
      id: `visible-${index + 1}`,
      name: `Visible check ${index + 1}`,
      passed: Boolean(result.passed),
      visible: true,
      message: "Visible check result preserved; legacy detail withheld."
    }));
}

export function codeRunCommand(language: RunnerLanguage, runMode: CodeRunMode): string {
  const fileName = defaultFileName(language);
  if (runMode === "run_file") {
    if (language === "python") {
      return `python ${fileName}`;
    }

    if (language === "sql") {
      return `sqlite3 proofpath.db < ${fileName}`;
    }

    if (language === "typescript") {
      return `proofpath run ${fileName}`;
    }

    return `node ${fileName}`;
  }

  return `proofpath checks ${fileName}`;
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
      workflowLabel: "typecheck + transform + run + verify",
      supportsRunFile: true,
      supportsRunChecks: true,
      supportsProofCapture: true,
      supportsTypecheck: true,
      beginnerNote: "This lab runs a real TypeScript type check before executing and verifying your code, so a type error fails the check.",
      limitations: [
        "Type errors are reported with the failing line and compiler message before any code runs.",
        "The type check covers your single lesson file against the TypeScript standard library; it is not a full project build.",
        "Imports and cross-file type resolution are not available in the lesson sandbox."
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

/**
 * Public disclosure policy for private verifier checks.
 *
 * ProofPath publishes NO hidden-check counts, names, messages, expected values,
 * seeds, or internal identities. Grading still uses the complete result set
 * internally (`redactCheckResults`), but every learner-facing or exported
 * surface carries this zeroed aggregate. This is the single place the policy is
 * named; callers must not hand-build a summary from private results.
 */
export function publicHiddenCheckSummary(): HiddenCheckSummary {
  return emptyHiddenCheckSummary();
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
  // Deliberately ignore any supplied summary: the public policy is zero counts.
  // A sanitized aggregate passed by an older runner must not resurrect counts.
  const hiddenCheckSummary = publicHiddenCheckSummary();
  const trustedDisclosure = hasTrustedDisclosure(attempt.sandboxDisclosureVersion, attempt.importedAt);

  // A supplied terminalTranscript is never trusted on its own: it may be a
  // legacy transcript that embedded hidden stdout/stderr. Even with a trusted
  // attempt, rebuilding from the already-sanitized buffers keeps one source of
  // truth and makes repeated normalization idempotent.
  const diagnostics = trustedDisclosure ? (attempt.diagnostics ?? []) : [legacyQuarantineDiagnostic()];
  const stdout = trustedDisclosure ? attempt.stdout : "";
  const stderr = trustedDisclosure ? attempt.stderr : "";
  const visibleCheckResults = trustedDisclosure
    ? redacted.visibleCheckResults
    : sanitizeLegacyVisibleResults(attempt.testResults ?? []);
  const command = attempt.command ?? codeRunCommand(attempt.language, runMode);
  const terminalTranscript = buildTerminalTranscript({
    command,
    diagnostics,
    hiddenCheckSummary,
    language: attempt.language,
    passed: attempt.passed,
    runMode,
    runtimeMs: attempt.runtimeMs,
    stderr,
    stdout,
    testResults: visibleCheckResults
  });

  return {
    ...attempt,
    runMode,
    command,
    stdout,
    stderr,
    testResults: visibleCheckResults,
    hiddenCheckSummary,
    diagnostics,
    terminalTranscript,
    sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION
  };
}

/**
 * Apply the disclosure boundary to a proof artifact that may have been persisted
 * before per-check sanitization existed. Proofs created by current runners carry
 * a trusted marker and pass through unchanged; ambiguous legacy proofs lose
 * their raw buffers and gain an explanatory transcript event.
 */
export function sanitizeProofArtifactForDisclosure(proof: ProofArtifact): ProofArtifact {
  if (hasTrustedDisclosure(proof.sandboxDisclosureVersion, proof.importedAt)) {
    return proof;
  }

  const visibleCheckResults = sanitizeLegacyVisibleResults(proof.visibleCheckResults);
  const hiddenCheckSummary = publicHiddenCheckSummary();
  const transcript = buildTerminalTranscript({
    command: proof.command,
    diagnostics: [legacyQuarantineDiagnostic()],
    hiddenCheckSummary,
    language: proof.language,
    passed: proof.passed,
    runMode: proof.runMode,
    runtimeMs: proof.runtimeMs,
    stderr: "",
    stdout: "",
    testResults: visibleCheckResults
  });

  return {
    ...proof,
    stdout: "",
    stderr: "",
    visibleCheckResults,
    hiddenCheckSummary,
    terminalTranscript: transcript,
    sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION
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
      ? ["[prepare] Reading TypeScript source...", "[typecheck] Checking TypeScript types...", "[transform] Preparing JavaScript runtime...", "[execute] Running lesson.ts..."]
      : ["[prepare] Reading TypeScript source...", "[typecheck] Checking TypeScript types...", "[transform] Preparing JavaScript runtime...", "[execute] Running lesson.ts...", "[verify] Running lesson checks..."];
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
    codeHash: computeCodeHash(normalizedAttempt.codeSnapshot),
    ...(normalizedAttempt.codeSnapshot.length <= MAX_PROOF_CODE_SNAPSHOT_LENGTH ? { codeSnapshot: normalizedAttempt.codeSnapshot } : {}),
    terminalTranscript: normalizedAttempt.terminalTranscript,
    sandboxDisclosureVersion: normalizedAttempt.sandboxDisclosureVersion ?? CURRENT_SANDBOX_DISCLOSURE_VERSION
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
    cwd: "proofpath://lesson-sandbox",
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

  if (runMode === "run_checks" && !passed) {
    // The aggregate pass flag can fail when only a private check failed. No
    // private result is needed to say honestly that a check failed; only a
    // real execution diagnostic would change the classification.
    const runtimeFailure = diagnostics.some((diagnostic) => (
      diagnostic.severity === "error"
      && (diagnostic.source === "runtime" || diagnostic.source === "system")
    ));
    return runtimeFailure ? "runtime_error" : "check_failed";
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
    // A parse/type-check failure is the first analysis gate. Later phases were
    // never attempted, so keep them pending instead of implying that the runner
    // deliberately skipped their work. TypeScript reports its type errors during
    // [typecheck] (after a [prepare] that only read the source), so prefer
    // [typecheck] over [parse]/[prepare]; Python/JavaScript report during
    // [parse] and SQL during [prepare].
    const analysisIndex = ["[typecheck]", "[parse]", "[prepare]"]
      .map((marker) => phases.findIndex((phase) => phase.includes(marker)))
      .find((index) => index >= 0);
    const failureIndex = analysisIndex ?? 0;
    return index < failureIndex ? "done" : index === failureIndex ? "failed" : "pending";
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

export function computeCodeHash(code: string): string {
  let hash = 5381;
  for (let index = 0; index < code.length; index += 1) {
    hash = ((hash << 5) + hash) ^ code.charCodeAt(index);
  }

  return `cf-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}
