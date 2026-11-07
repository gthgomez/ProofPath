import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { buildRunningTerminalEvents, buildTerminalTranscript, codeRunCommand, CURRENT_SANDBOX_DISCLOSURE_VERSION, emptyHiddenCheckSummary, formatTerminalTranscript, normalizeCodeRunAttempt, runtimeCapabilitiesFor } from "@/domain/code-run";
import { isScaffoldStarter, scaffoldStarterNotice, type ScaffoldStarterNotice } from "@/domain/starter-expectation";
import type { CodeRunAttempt, CodeRunMode, TerminalEvent } from "@/domain/types";
import { buildProblemDiagnostics } from "@/sandbox/diagnostics";
import { formatPolicyViolationFeedback } from "@/sandbox/feedback";
import {
  createNativeWebViewRunnerHtml,
  NATIVE_ANDROID_SANDBOX_BASE_URL,
  NATIVE_SANDBOX_WEBVIEW_SECURITY_PROPS,
  nativeRunTimeoutMs,
  parseNativeWebViewRunnerMessage,
  validateNativeWebViewResult,
  type NativeWebViewRunnerRequest
} from "@/sandbox/native-webview-runner";
import { canRunNativePythonProof, runNativePythonFile, runNativePythonProof } from "@/sandbox/native-python-proof-runner";
import { validateSandboxSubmission } from "@/sandbox/policy";
import { Badge, BodyText, ButtonShell, MutedText, Row, SectionTitle } from "@/ui/primitives";
import { runPhaseDelay } from "@/ui/run-phase-timing";
import { colors, radius, semanticColors, spacing } from "@/ui/theme";
import { CodeProblems } from "@/ui/code-problems";
import { CodeTerminal } from "@/ui/code-terminal";
import { SyntaxHighlightedEditor } from "@/ui/syntax-highlighted-editor";
import { getEditorDraft, resetEditorDraft, saveEditorDraft } from "@/storage/draft-store";
import type { CodeLabProps } from "@/ui/code-lab.shared";

// The native run-time startup allowance (and the unmeasured-cold-start note)
// lives in `nativeStartupAllowanceMs`, next to the asset paths it protects.

function formatVisibleTestExpectation(expectedOutputIncludes?: string[]): string {
  if (!expectedOutputIncludes?.length) {
    return "";
  }

  const learnerOutput = expectedOutputIncludes.filter((value) => value !== "passed");
  const verifierOutput = expectedOutputIncludes.includes("passed") ? "check prints passed" : null;
  const parts = [
    learnerOutput.length ? `checks output for ${learnerOutput.join(", ")}` : null,
    verifierOutput
  ].filter(Boolean);

  return parts.length ? ` - ${parts.join("; ")}` : "";
}

export function CodeLab({ attemptHistory = [], historicalAchievement = false, isSaving, latestRun, lessonId, onRunPassed, runnerSpec }: CodeLabProps): ReactElement {
  const webViewRef = useRef<React.ElementRef<typeof WebView>>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const phaseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRequestIdRef = useRef<string | null>(null);
  // The full request context, not just the ID: accepted results must match the
  // lesson, language, mode, and exact code snapshot that were sent.
  const activeRequestRef = useRef<NativeWebViewRunnerRequest | null>(null);
  const editedRef = useRef(false);
  const latestRunRef = useRef(latestRun);
  latestRunRef.current = latestRun;
  const [code, setCode] = useState(runnerSpec.starterCode);
  const [isBridgeReady, setIsBridgeReady] = useState(false);
  const [isRuntimeWarm, setIsRuntimeWarm] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunMode, setActiveRunMode] = useState<CodeRunMode>("run_checks");
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [runError, setRunError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [focusedLine, setFocusedLine] = useState<number | null>(null);
  const [webViewKey, setWebViewKey] = useState(0);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const runnerHtml = useMemo(() => createNativeWebViewRunnerHtml(), []);

  useEffect(() => {
    let cancelled = false;
    editedRef.current = false;
    setRunError(null);
    setCopyStatus(null);

    // Hydrate from the SQLite-backed draft store. An edit made before hydration
    // wins over the stored draft, and a durable reset tombstone wins over the
    // last executed snapshot so old code cannot reappear after a restart.
    void getEditorDraft(lessonId)
      .then((state) => {
        if (cancelled || editedRef.current) {
          return;
        }
        if (state.status === "draft") {
          setCode(state.code);
        } else if (state.status === "reset") {
          setCode(runnerSpec.starterCode);
        } else {
          setCode(latestRunRef.current?.codeSnapshot ?? runnerSpec.starterCode);
        }
      })
      .catch(() => {
        if (!cancelled && !editedRef.current) {
          setCode(latestRunRef.current?.codeSnapshot ?? runnerSpec.starterCode);
          setDraftStatus("Draft storage is unavailable on this device. Your edit is kept for this session only.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [runnerSpec.starterCode, lessonId]);

  const persistDraft = (nextCode: string): void => {
    editedRef.current = true;
    void saveEditorDraft(lessonId, nextCode).then((result) => {
      setDraftStatus(
        result === "saved"
          ? null
          : result === "session_only"
            ? "Draft kept for this session only. Device storage is unavailable, so it will not survive a restart."
            : "Draft could not be saved on this device. Copy your code before leaving."
      );
    });
  };

  useEffect(() => {
    return () => {
      clearRunnerTimeout();
      clearPhaseTimeout();
    };
  }, []);

  const clearRunnerTimeout = (): void => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    activeRequestIdRef.current = null;
    activeRequestRef.current = null;
  };

  const clearPhaseTimeout = (): void => {
    if (phaseTimeoutRef.current) {
      clearTimeout(phaseTimeoutRef.current);
      phaseTimeoutRef.current = null;
    }
  };

  const buildFailedAttempt = (message: string, now = new Date().toISOString(), runtimeMs = 0, runMode: CodeRunMode = activeRunMode): CodeRunAttempt => {
    const command = codeRunCommand(runnerSpec.language, runMode);
    const diagnostics = buildProblemDiagnostics({ language: runnerSpec.language, stderr: message, errorMessage: message });
    const testResults = runMode === "run_checks" ? [
      {
        id: "native-webview-runner",
        name: "Native WebView runner",
        passed: false,
        visible: true,
        message
      }
    ] : [];

    return normalizeCodeRunAttempt({
      id: `code-run-${lessonId}-${now.replace(/[^0-9]/g, "")}`,
      lessonId,
      language: runnerSpec.language,
      runMode,
      sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION,
      command,
      codeSnapshot: code,
      stdout: "",
      stderr: message,
      passed: false,
      score: 0,
      runtimeMs,
      testResults,
      hiddenCheckSummary: emptyHiddenCheckSummary(),
      diagnostics,
      terminalTranscript: buildTerminalTranscript({
        command,
        diagnostics,
        hiddenCheckSummary: emptyHiddenCheckSummary(),
        language: runnerSpec.language,
        passed: false,
        runMode,
        runtimeMs,
        stderr: message,
        stdout: "",
        testResults
      }),
      createdAt: now
    });
  };

  const runCode = async (runMode: CodeRunMode): Promise<void> => {
    const now = new Date().toISOString();
    const policyViolations = validateSandboxSubmission(runnerSpec, code);
    const nativeTimeoutMs = nativeRunTimeoutMs(runnerSpec.timeoutMs, runnerSpec.language, isRuntimeWarm);

    setRunError(null);
    setIsRunning(true);
    setActiveRunMode(runMode);
    setActivePhaseIndex(0);
    await waitForRunPhase();

    if (policyViolations.length > 0) {
      setActivePhaseIndex(runMode === "run_checks" ? 2 : 1);
      await waitForRunPhase(160);
      const command = codeRunCommand(runnerSpec.language, runMode);
      const stderr = policyViolations.map((violation) => formatPolicyViolationFeedback(violation, runnerSpec.language)).join("\n\n");
      const diagnostics = buildProblemDiagnostics({ language: runnerSpec.language, policyViolations });
      const testResults = policyViolations.map((violation) => ({
        id: `policy-${violation.rule}`,
        name: "Sandbox policy",
        passed: false,
        visible: true,
        message: formatPolicyViolationFeedback(violation, runnerSpec.language)
      }));
      const attempt: CodeRunAttempt = {
        ...normalizeCodeRunAttempt({
          id: `code-run-${lessonId}-${now.replace(/[^0-9]/g, "")}`,
          lessonId,
          language: runnerSpec.language,
          runMode,
          sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION,
          command,
          codeSnapshot: code,
          stdout: "",
          stderr,
          passed: false,
          score: 0,
          runtimeMs: 0,
          testResults: runMode === "run_checks" ? testResults : [],
          hiddenCheckSummary: emptyHiddenCheckSummary(),
          diagnostics,
          terminalTranscript: buildTerminalTranscript({
            command,
            diagnostics,
            hiddenCheckSummary: emptyHiddenCheckSummary(),
            language: runnerSpec.language,
            passed: false,
            runMode,
            runtimeMs: 0,
            stderr,
            stdout: "",
            testResults: runMode === "run_checks" ? testResults : []
          }),
          createdAt: now
        })
      };
      onRunPassed(attempt);
      setIsRunning(false);
      return;
    }

    if (runnerSpec.language === "python" && canRunNativePythonProof(runnerSpec)) {
      setActivePhaseIndex(1);
      try {
        await waitForRunPhase(160);
        setActivePhaseIndex(runMode === "run_checks" ? 2 : 1);
        onRunPassed(runMode === "run_file" ? runNativePythonFile(lessonId, code, now) : runNativePythonProof(runnerSpec, lessonId, code, now));
      } finally {
        setIsRunning(false);
      }
      return;
    }

    if (!isBridgeReady) {
      setRunError("Native sandbox is still starting. Try again in a moment.");
      setIsRunning(false);
      return;
    }

    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    activeRequestIdRef.current = requestId;

    const request: NativeWebViewRunnerRequest = {
      requestId,
      lessonId,
      spec: runnerSpec,
      code,
      now,
      runMode
    };
    activeRequestRef.current = request;
    const payload = JSON.stringify({ type: "run", request });

    phaseTimeoutRef.current = setTimeout(() => {
      setActivePhaseIndex(1);
      phaseTimeoutRef.current = setTimeout(() => {
        setActivePhaseIndex(runMode === "run_checks" ? 2 : 1);
      }, 420);
    }, 160);
    timeoutRef.current = setTimeout(() => {
      activeRequestIdRef.current = null;
      clearRunnerTimeout();
      clearPhaseTimeout();
      setIsRunning(false);
      setIsBridgeReady(false);
      // The WebView is recreated below, so the runtime is cold again on the new
      // bridge; re-grant the startup allowance for its first run.
      setIsRuntimeWarm(false);
      setWebViewKey((current) => current + 1);
      onRunPassed(
        buildFailedAttempt(
          formatNativeTimeoutFeedback(runnerSpec.language, nativeTimeoutMs),
          now,
          nativeTimeoutMs,
          runMode
        )
      );
    }, nativeTimeoutMs);

    webViewRef.current?.injectJavaScript(
      `window.ProofPathSandbox && window.ProofPathSandbox.run(${JSON.stringify(payload)}); true;`
    );
  };

  const handleRunnerMessage = (event: WebViewMessageEvent): void => {
    const message = parseNativeWebViewRunnerMessage(event.nativeEvent.data);

    if (message?.type === "sandbox-ready") {
      setIsBridgeReady(true);
      // Warm the bundled runtime (the TypeScript compiler is ~9 MB) before the
      // first timed run so the cold parse does not count against the allowance.
      webViewRef.current?.injectJavaScript(
        `window.ProofPathSandbox && window.ProofPathSandbox.preload(${JSON.stringify({ language: runnerSpec.language })}); true;`
      );
      return;
    }

    if (message?.type === "sandbox-warm") {
      // The preload finished, so the runtime no longer needs the cold-start
      // allowance on later runs.
      setIsRuntimeWarm(true);
      return;
    }

    if (message?.type === "sandbox-result") {
      const activeRequest = activeRequestRef.current;
      if (!activeRequest || !activeRequestIdRef.current || message.requestId !== activeRequestIdRef.current) {
        // Discard: no run is currently active, or the result does not match the active run request ID.
        return;
      }

      const attempt = normalizeCodeRunAttempt(message.attempt);
      const integrity = validateNativeWebViewResult(attempt, activeRequest, message.requestId);
      clearRunnerTimeout();
      clearPhaseTimeout();
      setIsRunning(false);

      if (!integrity.ok) {
        // A structurally valid message that does not describe the code we asked
        // the runner to execute must never become proof. Recreate the bridge so
        // a confused runtime cannot keep answering the same request.
        setIsBridgeReady(false);
        setIsRuntimeWarm(false);
        setWebViewKey((current) => current + 1);
        setRunError(`Discarded an inconsistent sandbox result (${integrity.reason}). Run again to produce a verifiable result.`);
        return;
      }

      onRunPassed(attempt);
    }
  };

  const copyRunOutput = async (): Promise<void> => {
    if (!latestRun) {
      return;
    }

    const copied = await copyTextToClipboard(formatTerminalTranscript(latestRun.terminalTranscript));
    setCopyStatus(copied ? "Output copied." : "Output is selectable. Long-press the output block to copy it.");
  };
  const copyStdout = async (): Promise<void> => {
    if (!latestRun) {
      return;
    }

    const copied = await copyTextToClipboard(latestRun.stdout);
    setCopyStatus(copied ? "Stdout copied." : "Stdout is selectable in the terminal.");
  };
  const copyStderr = async (): Promise<void> => {
    if (!latestRun) {
      return;
    }

    const copied = await copyTextToClipboard(latestRun.stderr);
    setCopyStatus(copied ? "Stderr copied." : "Stderr is selectable in the terminal.");
  };
  const copyProofSummary = async (): Promise<void> => {
    if (!latestRun) {
      return;
    }

    const copied = await copyTextToClipboard(formatProofSummary(latestRun));
    setCopyStatus(copied ? "Check summary copied." : "Check summary is visible below.");
  };

  const learnerAttemptHistory = attemptHistory;
  // Only the exact snapshot that was checked is verified. A previous pass on
  // different text is a historical achievement, not proof for this draft.
  const currentDraftMatchesLastRun = code === latestRun?.codeSnapshot;
  const verifiedRun = currentDraftMatchesLastRun ? latestRun : undefined;
  const draftUnverified = Boolean(latestRun) && !currentDraftMatchesLastRun;
  const historicalPass = historicalAchievement
    || learnerAttemptHistory.some((attempt) => attempt.runMode === "run_checks" && attempt.passed)
    || (latestRun?.runMode === "run_checks" && latestRun.passed);
  const proofCaptured = verifiedRun?.runMode === "run_checks" && verifiedRun.passed;
  const fileRan = verifiedRun?.runMode === "run_file" && verifiedRun.passed;
  const runtimeCapabilities = runtimeCapabilitiesFor(runnerSpec.language);
  const terminalEvents: TerminalEvent[] = isRunning
    ? buildRunningTerminalEvents(runnerSpec.language, activeRunMode, activePhaseIndex)
    : verifiedRun?.terminalTranscript ?? buildRunningTerminalEvents(runnerSpec.language, "run_checks", -1);
  const diagnostics = verifiedRun?.diagnostics ?? [];
  const scaffoldNotice = isScaffoldStarter(runnerSpec.starterCode) ? scaffoldStarterNotice() : null;
  const failedGradedRun = verifiedRun?.runMode === "run_checks" && !verifiedRun.passed;
  const runState = isRunning
    ? activeRunMode === "run_file"
      ? "Running file"
      : "Running checks"
    : proofCaptured
      ? "Check passed"
      : draftUnverified
        ? "Unverified changes"
        : fileRan
          ? "File ran"
          : verifiedRun
            ? "Needs attention"
            : historicalPass
              ? "Passed previously"
              : isBridgeReady
                ? "Ready to run"
                : "Starting runner";

  return (
    <View style={styles.codeLab}>
      <WebView
        {...NATIVE_SANDBOX_WEBVIEW_SECURITY_PROPS}
        cacheEnabled={false}
        incognito
        javaScriptCanOpenWindowsAutomatically={false}
        javaScriptEnabled
        key={webViewKey}
        mixedContentMode="never"
        onError={() => {
          setIsBridgeReady(false);
          setIsRuntimeWarm(false);
          setRunError("Native sandbox WebView failed to load.");
        }}
        onMessage={handleRunnerMessage}
        originWhitelist={["*"]}
        setSupportMultipleWindows={false}
        allowFileAccess
        source={{ html: runnerHtml, baseUrl: NATIVE_ANDROID_SANDBOX_BASE_URL }}
        style={styles.runnerFrame}
      />
      <Row>
        <Badge tone="blue">{runnerSpec.language}</Badge>
        <Badge tone="amber">{runnerSpec.timeoutMs}ms limit</Badge>
        <Badge tone="teal">network off</Badge>
        {runnerSpec.language === "typescript" ? <Badge tone="ink">{runtimeCapabilities.workflowLabel}</Badge> : null}
        <Badge tone={(runnerSpec.language === "python" && canRunNativePythonProof(runnerSpec)) || isBridgeReady ? "green" : "amber"}>
          {runnerSpec.language === "python" && canRunNativePythonProof(runnerSpec) ? "native check ready" : isBridgeReady ? "native ready" : "native starting"}
        </Badge>
        {historicalPass && !proofCaptured ? <Badge tone="green">Lesson passed previously</Badge> : null}
        {draftUnverified ? <Badge tone="amber">Current draft unverified</Badge> : null}
        {verifiedRun ? <Badge tone={verifiedRun.passed ? "green" : "rose"}>{latestRunBadgeLabel(verifiedRun)}</Badge> : null}
      </Row>
      <SectionTitle>Code Lab</SectionTitle>
      <BodyText>{runnerSpec.instructions}</BodyText>
      {scaffoldNotice && !latestRun ? <ScaffoldStarterCard notice={scaffoldNotice} /> : null}
      <View style={[styles.statusCard, proofCaptured ? styles.statusPass : verifiedRun && !verifiedRun.passed ? styles.statusFail : null]}>
        <Row>
          <Badge tone={proofCaptured ? "green" : draftUnverified ? "amber" : verifiedRun && !verifiedRun.passed ? "rose" : isRunning ? "amber" : fileRan ? "blue" : "teal"}>{runState}</Badge>
        </Row>
        <MutedText>
          {proofCaptured
            ? "Check passed for the code currently in the editor. Save the output when you are ready to add portfolio evidence."
            : draftUnverified
              ? historicalPass
                ? "This draft has changed since it passed. Run checks to verify the current version; your earlier pass stays on your record."
                : "This draft has changed since the last run. Run checks to verify the current version."
              : fileRan
                ? "The file ran. Run checks when you are ready to validate the answer."
                : verifiedRun
                  ? "Read the failing test, change the smallest thing, then run again."
                  : historicalPass
                    ? "You passed this lesson previously. Run checks to verify the code currently in the editor."
                    : "Run file to inspect output. Run checks when you are ready to validate the answer."}
        </MutedText>
      </View>
      <SectionTitle>Code editor</SectionTitle>
      <MutedText>Syntax highlighting helps you read the code structure. Run file shows program output; Run checks validates the lesson goal.</MutedText>
      {runtimeCapabilities.beginnerNote ? <MutedText>{runtimeCapabilities.beginnerNote}</MutedText> : null}
      <SyntaxHighlightedEditor
        accessibilityLabel={`${runnerSpec.language} code editor`}
        diagnostics={diagnostics}
        focusLine={focusedLine}
        language={runnerSpec.language}
        onChangeText={(nextCode) => {
          setCode(nextCode);
          persistDraft(nextCode);
        }}
        value={code}
      />
      {draftStatus ? <MutedText accessibilityLiveRegion="polite">{draftStatus}</MutedText> : null}
      <Row>
        <ButtonShell
          accessibilityHint="Runs the current file and shows terminal output without completing the Code Lab check."
          disabled={isSaving || isRunning}
          onPress={() => {
            void runCode("run_file");
          }}
          tone="blue"
          variant="secondary"
        >
          {isRunning && activeRunMode === "run_file" ? "Running file" : "Run file"}
        </ButtonShell>
        <ButtonShell
          accessibilityHint="Runs lesson checks. Passing checks complete the Code Lab task."
          disabled={isSaving || isRunning}
          onPress={() => {
            void runCode("run_checks");
          }}
          tone={proofCaptured ? "green" : "amber"}
        >
          {isRunning && activeRunMode === "run_checks" ? "Running checks" : proofCaptured ? "Run checks again" : "Run checks"}
        </ButtonShell>
        <ButtonShell
          accessibilityHint="Restores the lesson starter code."
          disabled={isSaving || isRunning}
          onPress={() => {
            setCode(runnerSpec.starterCode);
            editedRef.current = true;
            // Persist a reset tombstone so a remount or app restart does not
            // resurrect the last executed snapshot.
            void resetEditorDraft(lessonId).then((result) => {
              setDraftStatus(
                result === "saved"
                  ? null
                  : result === "session_only"
                    ? "Reset applied for this session only; device storage is unavailable, so it may not survive a restart."
                    : "Reset could not be saved on this device. It applies to this session only."
              );
            });
          }}
          size="compact"
          tone="ink"
          variant="secondary"
        >
          Reset starter
        </ButtonShell>
      </Row>
      <MutedText>Completion requires Run checks. Run file is for inspecting behavior before verification.</MutedText>
      <CodeTerminal events={terminalEvents} />
      <CodeProblems diagnostics={diagnostics} onSelectLine={setFocusedLine} />
      <SectionTitle>Visible checks</SectionTitle>
      {runnerSpec.visibleTests.map((test) => (
        <MutedText key={test.id}>{test.name}{formatVisibleTestExpectation(test.expectedOutputIncludes)}</MutedText>
      ))}
      {latestRun ? (
        <CodeRunResult
          copyStatus={copyStatus}
          latestRun={latestRun}
          onCopyOutput={copyRunOutput}
          onCopyProofSummary={copyProofSummary}
          onCopyStderr={copyStderr}
          onCopyStdout={copyStdout}
        />
      ) : null}
      {scaffoldNotice && failedGradedRun ? <ScaffoldStarterCard notice={scaffoldNotice} /> : null}
      {attemptHistory.length > 1 ? <RunHistory attempts={attemptHistory.slice(0, 5)} /> : null}
      {runError ? <MutedText>{runError}</MutedText> : null}
    </View>
  );
}

function waitForRunPhase(durationMs = 260): Promise<void> {
  return runPhaseDelay(durationMs);
}

function formatNativeTimeoutFeedback(language: CodeLabProps["runnerSpec"]["language"], timeoutMs: number): string {
  const runtimeName = language === "python" ? "Python" : language === "sql" ? "SQL" : "sandbox";

  return [
    `The native ${runtimeName} sandbox did not return a result within ${timeoutMs}ms.`,
    language === "python" || language === "sql"
      ? "On the first offline run, the lesson runtime may still be starting. Try once more; later runs should be faster."
      : "The code may be waiting or repeating longer than this lesson allows.",
    "If it keeps happening, remove input(), infinite loops, recursion, or repeated work that continues after the answer is already known."
  ].join("\n");
}

function ScaffoldStarterCard({ notice }: { notice: ScaffoldStarterNotice }): ReactElement {
  return (
    <View accessibilityLabel={notice.title} style={styles.scaffoldNotice}>
      <Row>
        <Badge tone="amber">{notice.title}</Badge>
      </Row>
      <MutedText>{notice.body}</MutedText>
    </View>
  );
}

function CodeRunResult({
  copyStatus,
  latestRun,
  onCopyOutput,
  onCopyProofSummary,
  onCopyStderr,
  onCopyStdout
}: Pick<CodeLabProps, "latestRun"> & {
  copyStatus?: string | null;
  latestRun: NonNullable<CodeLabProps["latestRun"]>;
  onCopyOutput?: () => void;
  onCopyProofSummary?: () => void;
  onCopyStderr?: () => void;
  onCopyStdout?: () => void;
}): ReactElement {
  return (
    <View style={styles.testResult}>
      <MutedText>Last executed snapshot. It may differ from the code currently in the editor.</MutedText>
      <Row>
        <Badge tone={latestRun.passed ? "green" : "rose"}>{resultStatusLabel(latestRun)}</Badge>
        <Badge tone="blue">{runtimeLabel(latestRun)}</Badge>
      </Row>
      {onCopyOutput ? (
        <Row>
          <ButtonShell
            accessibilityHint="Copies the canonical terminal transcript for this attempt."
            onPress={onCopyOutput}
            size="compact"
            tone="ink"
            variant="secondary"
          >
            Copy transcript
          </ButtonShell>
          <ButtonShell
            accessibilityHint="Copies stdout only."
            disabled={!latestRun.stdout}
            onPress={onCopyStdout}
            size="compact"
            tone="blue"
            variant="secondary"
          >
            Copy stdout
          </ButtonShell>
          <ButtonShell
            accessibilityHint="Copies stderr only."
            disabled={!latestRun.stderr}
            onPress={onCopyStderr}
            size="compact"
            tone="rose"
            variant="secondary"
          >
            Copy stderr
          </ButtonShell>
          <ButtonShell
            accessibilityHint="Copies a short check summary for evidence review."
            onPress={onCopyProofSummary}
            size="compact"
            tone="green"
            variant="secondary"
          >
            Copy check summary
          </ButtonShell>
        </Row>
      ) : null}
      {copyStatus ? <MutedText>{copyStatus}</MutedText> : null}
    </View>
  );
}

function RunHistory({ attempts }: { attempts: CodeRunAttempt[] }): ReactElement {
  return (
    <View style={styles.testResult}>
      <SectionTitle>Recent attempts</SectionTitle>
      {attempts.map((attempt, index) => (
        <Row key={attempt.id}>
          <Badge tone={attempt.passed ? "green" : "rose"}>{index === 0 ? "latest" : `#${index + 1}`}</Badge>
          <Badge tone={attempt.runMode === "run_checks" ? "amber" : "blue"}>{attempt.runMode === "run_checks" ? "checks" : "file"}</Badge>
          <MutedText>{resultStatusLabel(attempt)} - {runtimeLabel(attempt)}</MutedText>
        </Row>
      ))}
    </View>
  );
}

function isTimeoutRun(latestRun: NonNullable<CodeLabProps["latestRun"]>): boolean {
  return /timed out|timeout|took too long/i.test([
    latestRun.stderr,
    ...latestRun.testResults.map((testResult) => testResult.message)
  ].join("\n"));
}

function resultStatusLabel(latestRun: NonNullable<CodeLabProps["latestRun"]>): string {
  if (latestRun.runMode === "run_file" && latestRun.passed) {
    return "file ran";
  }

  if (latestRun.passed) {
    return "checks passed";
  }

  return isTimeoutRun(latestRun) ? "timeout" : latestRun.runMode === "run_file" ? "file failed" : "checks failed";
}

function runtimeLabel(latestRun: NonNullable<CodeLabProps["latestRun"]>): string {
  if (isTimeoutRun(latestRun)) {
    return latestRun.runtimeMs > 0 ? `stopped after ${latestRun.runtimeMs}ms` : "timeout";
  }

  return `${latestRun.runtimeMs}ms`;
}

function latestRunBadgeLabel(latestRun: NonNullable<CodeLabProps["latestRun"]>): string {
  return latestRun.runMode === "run_file"
    ? latestRun.passed ? "file ran" : "file failed"
    : `${latestRun.score}% last checks`;
}

export function formatProofSummary(latestRun: NonNullable<CodeLabProps["latestRun"]>): string {
  return [
    `command: ${latestRun.command}`,
    `mode: ${latestRun.runMode}`,
    `language: ${latestRun.language}`,
    `result: ${latestRun.passed ? "passed" : "failed"}`,
    `runtime: ${latestRun.runtimeMs}ms`,
    latestRun.runMode === "run_checks" ? `visible checks: ${latestRun.testResults.filter((testResult) => testResult.passed).length}/${latestRun.testResults.length} passed` : undefined,
    latestRun.runMode === "run_checks" ? "private check details: redacted" : undefined
  ].filter(Boolean).join("\n\n");
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  const maybeNavigator = globalThis.navigator as ({ clipboard?: { writeText?: (value: string) => Promise<void> } } | undefined);

  if (!maybeNavigator?.clipboard?.writeText) {
    return false;
  }

  try {
    await maybeNavigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const styles = StyleSheet.create({
  codeLab: {
    gap: spacing.sm
  },
  codeBlock: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: "monospace",
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 19,
    padding: spacing.md
  },
  runnerFrame: {
    height: 1,
    left: -10,
    opacity: 0.01,
    position: "absolute",
    top: -10,
    width: 1
  },
  testResult: {
    borderColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.md
  },
  statusCard: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  statusPass: {
    backgroundColor: semanticColors.successSoft,
    borderColor: semanticColors.success
  },
  statusFail: {
    backgroundColor: semanticColors.dangerSoft,
    borderColor: semanticColors.danger
  },
  scaffoldNotice: {
    backgroundColor: semanticColors.warningSoft,
    borderColor: semanticColors.warning,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  }
});
