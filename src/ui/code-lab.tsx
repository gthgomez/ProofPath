import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { buildRunningTerminalEvents, emptyHiddenCheckSummary, formatTerminalTranscript, runtimeCapabilitiesFor } from "@/domain/code-run";
import type { CodeRunAttempt, CodeRunMode, HiddenCheckSummary, TerminalEvent } from "@/domain/types";
import { runLessonSandbox, getSandboxCapabilityLabel } from "@/sandbox/runner";
import { Badge, BodyText, ButtonShell, MutedText, Row, SectionTitle } from "@/ui/primitives";
import { colors, radius, semanticColors, spacing } from "@/ui/theme";
import { CodeProblems } from "@/ui/code-problems";
import { CodeTerminal } from "@/ui/code-terminal";
import { SyntaxHighlightedEditor } from "@/ui/syntax-highlighted-editor";
import type { CodeLabProps } from "@/ui/code-lab.shared";

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

export function CodeLab({ attemptHistory = [], isSaving, latestRun, lessonId, onRunPassed, runnerSpec }: CodeLabProps): ReactElement {
  const [code, setCode] = useState(runnerSpec.starterCode);
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunMode, setActiveRunMode] = useState<CodeRunMode>("run_checks");
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [runError, setRunError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [focusedLine, setFocusedLine] = useState<number | null>(null);

  useEffect(() => {
    setCode(runnerSpec.starterCode);
    setRunError(null);
    setCopyStatus(null);
  }, [runnerSpec.starterCode]);

  const runCode = async (runMode: CodeRunMode): Promise<void> => {
    setIsRunning(true);
    setActiveRunMode(runMode);
    setActivePhaseIndex(0);
    setRunError(null);

    try {
      await waitForRunPhase();
      setActivePhaseIndex(1);
      const attempt = await runLessonSandbox(runnerSpec, lessonId, code, new Date().toISOString(), runMode);
      setActivePhaseIndex(runMode === "run_checks" ? 2 : 1);
      await waitForRunPhase(180);
      onRunPassed(redactLearnerAttempt(attempt));
    } catch (caughtError) {
      setRunError(caughtError instanceof Error ? caughtError.message : "Unable to run sandbox.");
    } finally {
      setIsRunning(false);
    }
  };

  const copyRunOutput = async (): Promise<void> => {
    if (!latestRun) {
      return;
    }

    const copied = await copyTextToClipboard(formatTerminalTranscript(redactLearnerTerminalEvents(latestRun.terminalTranscript)));
    setCopyStatus(copied ? "Learner-safe transcript copied." : "Output is selectable. Long-press the output block to copy it.");
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
    setCopyStatus(copied ? "Learner-safe check summary copied." : "Check summary is visible below.");
  };

  const learnerLatestRun = latestRun ? redactLearnerAttempt(latestRun) : undefined;
  const learnerAttemptHistory = attemptHistory.map(redactLearnerAttempt);
  const proofCaptured = learnerLatestRun?.runMode === "run_checks" && learnerLatestRun.passed;
  const fileRan = learnerLatestRun?.runMode === "run_file" && learnerLatestRun.passed;
  const runtimeCapabilities = runtimeCapabilitiesFor(runnerSpec.language);
  const capability = getSandboxCapabilityLabel(runnerSpec.language);
  const terminalEvents: TerminalEvent[] = isRunning
    ? buildRunningTerminalEvents(runnerSpec.language, activeRunMode, activePhaseIndex)
    : learnerLatestRun?.terminalTranscript ?? buildRunningTerminalEvents(runnerSpec.language, "run_checks", -1);
  const diagnostics = learnerLatestRun?.diagnostics ?? [];
  const runState = isRunning
    ? activeRunMode === "run_file"
      ? "Running file"
      : "Running checks"
    : proofCaptured
      ? "Check passed"
      : fileRan
        ? "File ran"
      : learnerLatestRun
        ? "Needs attention"
        : "Ready to run";

  return (
    <View style={styles.codeLab}>
      <Row style={{ flexWrap: "wrap", gap: spacing.xs }}>
        <Badge tone="blue">{runnerSpec.language}</Badge>
        <Badge tone="amber">{runnerSpec.timeoutMs}ms limit</Badge>
        <Badge tone="teal">network off</Badge>
        <Badge tone="ink">{capability.label}</Badge>
        {learnerLatestRun ? <Badge tone={learnerLatestRun.passed ? "green" : "rose"}>{latestRunBadgeLabel(learnerLatestRun)}</Badge> : null}
      </Row>
      <SectionTitle>Code Lab</SectionTitle>
      <BodyText>{runnerSpec.instructions}</BodyText>
      <View style={[styles.statusCard, proofCaptured ? styles.statusPass : latestRun && !latestRun.passed ? styles.statusFail : null]}>
        <Row>
          <Badge tone={proofCaptured ? "green" : learnerLatestRun && !learnerLatestRun.passed ? "rose" : isRunning ? "amber" : fileRan ? "blue" : "teal"}>{runState}</Badge>
        </Row>
        <MutedText>
          {proofCaptured
            ? "Check passed. Save the output when you are ready to add portfolio evidence."
            : fileRan
              ? "The file ran. Run checks when you are ready to validate the answer."
            : learnerLatestRun
              ? "Read the failing test, change the smallest thing, then run again."
              : "Run file to inspect output. Run checks when you are ready to validate the answer."}
        </MutedText>
      </View>
      <SectionTitle>Code editor</SectionTitle>
      <MutedText>Syntax highlighting helps you read the code structure. Run file shows program output; Run checks validates the lesson goal.</MutedText>
      <MutedText style={{ fontStyle: "italic", marginBottom: spacing.xs }}>
        Sandbox capabilities: {capability.note}
      </MutedText>
      {runtimeCapabilities.beginnerNote ? <MutedText>{runtimeCapabilities.beginnerNote}</MutedText> : null}
      <SyntaxHighlightedEditor
        accessibilityLabel={`${runnerSpec.language} code editor`}
        diagnostics={diagnostics}
        focusLine={focusedLine}
        language={runnerSpec.language}
        onChangeText={setCode}
        value={code}
      />
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
          onPress={() => setCode(runnerSpec.starterCode)}
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
      <MutedText>Only learner-facing check feedback appears here; private check details stay redacted.</MutedText>
      {runnerSpec.visibleTests.map((test) => (
        <MutedText key={test.id}>{test.name}{formatVisibleTestExpectation(test.expectedOutputIncludes)}</MutedText>
      ))}
      {learnerLatestRun ? (
        <CodeRunResult
          copyStatus={copyStatus}
          latestRun={learnerLatestRun}
          onCopyOutput={copyRunOutput}
          onCopyProofSummary={copyProofSummary}
          onCopyStderr={copyStderr}
          onCopyStdout={copyStdout}
        />
      ) : null}
      {learnerAttemptHistory.length > 1 ? <RunHistory attempts={learnerAttemptHistory.slice(0, 5)} /> : null}
      {runError ? <MutedText>{runError}</MutedText> : null}
    </View>
  );
}

const redactedHiddenCheckSummary: HiddenCheckSummary = emptyHiddenCheckSummary();

function redactLearnerAttempt(attempt: CodeRunAttempt): CodeRunAttempt {
  return {
    ...attempt,
    hiddenCheckSummary: redactedHiddenCheckSummary,
    terminalTranscript: redactLearnerTerminalEvents(attempt.terminalTranscript)
  };
}

function redactLearnerTerminalEvents(events: TerminalEvent[]): TerminalEvent[] {
  return events.filter((event) => {
    if (event.type !== "diagnostic") {
      return true;
    }

    return !/^Hidden checks:/i.test(event.message);
  });
}

function waitForRunPhase(durationMs = 260): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

export function CodeRunResult({
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

function formatProofSummary(latestRun: NonNullable<CodeLabProps["latestRun"]>): string {
  return [
    "Code Lab check summary",
    `command: ${latestRun.command}`,
    `mode: ${latestRun.runMode === "run_checks" ? "checks" : "file run"}`,
    `language: ${latestRun.language}`,
    `result: ${resultStatusLabel(latestRun)}`,
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

export const codeLabStyles = StyleSheet.create({
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
  }
});

const styles = codeLabStyles;
