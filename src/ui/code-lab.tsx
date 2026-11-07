import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { buildRunningTerminalEvents, emptyHiddenCheckSummary, formatTerminalTranscript, runtimeCapabilitiesFor } from "@/domain/code-run";
import { isScaffoldStarter, scaffoldStarterNotice, type ScaffoldStarterNotice } from "@/domain/starter-expectation";
import type { CodeRunAttempt, CodeRunMode, HiddenCheckSummary, TerminalEvent } from "@/domain/types";
import { runLessonSandbox, getSandboxCapabilityLabel } from "@/sandbox/runner";
import { Badge, BodyText, ButtonShell, MutedText, Row, SectionTitle } from "@/ui/primitives";
import { runPhaseDelay } from "@/ui/run-phase-timing";
import { colors, radius, semanticColors, spacing } from "@/ui/theme";
import { CodeProblems } from "@/ui/code-problems";
import { CodeTerminal } from "@/ui/code-terminal";
import { SyntaxHighlightedEditor } from "@/ui/syntax-highlighted-editor";
import type { CodeLabProps } from "@/ui/code-lab.shared";

import { getEditorDraft, resetEditorDraft, saveEditorDraft } from "@/storage/draft-store";

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

export function CodeLab({ attemptHistory = [], handoff, historicalAchievement = false, isSaving, latestRun, lessonId, onRunPassed, runnerSpec }: CodeLabProps): ReactElement {
  const [code, setCode] = useState(runnerSpec.starterCode);
  const lastHandoffToken = useRef<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activeRunMode, setActiveRunMode] = useState<CodeRunMode>("run_checks");
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [runError, setRunError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [focusedLine, setFocusedLine] = useState<number | null>(null);
  const [draftStatus, setDraftStatus] = useState<string | null>(null);
  const editedRef = useRef(false);
  const latestRunRef = useRef(latestRun);
  latestRunRef.current = latestRun;

  useEffect(() => {
    let cancelled = false;
    editedRef.current = false;
    setRunError(null);
    setCopyStatus(null);

    // Hydrate asynchronously so native SQLite-backed drafts work. An edit made
    // before hydration completes wins over the stored draft.
    void getEditorDraft(lessonId)
      .then((state) => {
        if (cancelled || editedRef.current) {
          return;
        }
        if (state.status === "draft") {
          setCode(state.code);
        } else if (state.status === "reset") {
          // An explicit reset is durable: never resurrect the last executed snapshot.
          setCode(runnerSpec.starterCode);
        } else {
          setCode(latestRunRef.current?.codeSnapshot ?? runnerSpec.starterCode);
        }
      })
      .catch(() => {
        if (!cancelled && !editedRef.current) {
          setCode(latestRunRef.current?.codeSnapshot ?? runnerSpec.starterCode);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [runnerSpec.starterCode, lessonId]);

  useEffect(() => {
    if (!handoff || handoff.token === lastHandoffToken.current) {
      return;
    }
    lastHandoffToken.current = handoff.token;
    editedRef.current = true;
    setCode(handoff.code);
    setRunError(null);
    setDraftStatus("Practice code loaded. Practice runs are not graded; use Run checks here when you are ready to verify.");
    void saveEditorDraft(lessonId, handoff.code);
  }, [handoff, lessonId]);

  const persistDraft = (nextCode: string): void => {
    editedRef.current = true;
    void saveEditorDraft(lessonId, nextCode).then((result) => {
      setDraftStatus(
        result === "saved"
          ? null
          : result === "session_only"
            ? "Draft kept for this session only. Browser storage is unavailable, so it will not survive a reload."
            : "Draft could not be saved on this device. Copy your code before leaving."
      );
    });
  };

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
  // The current editor is only verified when it is byte-for-byte the snapshot
  // that was actually checked. A pass on older text is a historical
  // achievement, not evidence that this draft passes.
  const currentDraftMatchesLastRun = code === learnerLatestRun?.codeSnapshot;
  const verifiedRun = currentDraftMatchesLastRun ? learnerLatestRun : undefined;
  const draftUnverified = Boolean(learnerLatestRun) && !currentDraftMatchesLastRun;
  // Durable achievement survives history compaction; the attempt scan covers
  // snapshots that have not (yet) been promoted.
  const historicalPass = historicalAchievement
    || learnerAttemptHistory.some((attempt) => attempt.runMode === "run_checks" && attempt.passed)
    || (learnerLatestRun?.runMode === "run_checks" && learnerLatestRun.passed);
  const proofCaptured = verifiedRun?.runMode === "run_checks" && verifiedRun.passed;
  const fileRan = verifiedRun?.runMode === "run_file" && verifiedRun.passed;
  const runtimeCapabilities = runtimeCapabilitiesFor(runnerSpec.language);
  const capability = getSandboxCapabilityLabel(runnerSpec.language);
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
              : "Ready to run";

  return (
    <View style={styles.codeLab}>
      <Row style={{ flexWrap: "wrap", gap: spacing.xs }}>
        <Badge tone="blue">{runnerSpec.language}</Badge>
        <Badge tone="amber">{runnerSpec.timeoutMs}ms limit</Badge>
        <Badge tone="teal">network off</Badge>
        <Badge tone="ink">{capability.label}</Badge>
        {historicalPass && !proofCaptured ? <Badge tone="green">Lesson passed previously</Badge> : null}
        {draftUnverified ? <Badge tone="amber">Current draft unverified</Badge> : null}
        {verifiedRun ? <Badge tone={verifiedRun.passed ? "green" : "rose"}>{latestRunBadgeLabel(verifiedRun)}</Badge> : null}
      </Row>
      <SectionTitle>Code Lab</SectionTitle>
      <BodyText>{runnerSpec.instructions}</BodyText>
      {scaffoldNotice && !learnerLatestRun ? <ScaffoldStarterCard notice={scaffoldNotice} /> : null}
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
      <MutedText style={{ fontStyle: "italic", marginBottom: spacing.xs }}>
        Sandbox capabilities: {capability.note}
      </MutedText>
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
            // Persist a reset tombstone so a remount does not resurrect the old
            // executed snapshot via `latestRun.codeSnapshot`.
            void resetEditorDraft(lessonId).then((result) => {
              setDraftStatus(
                result === "saved"
                  ? null
                  : result === "session_only"
                    ? "Reset applied for this session only; browser storage is unavailable, so it may not survive a reload."
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
      {scaffoldNotice && failedGradedRun ? <ScaffoldStarterCard notice={scaffoldNotice} /> : null}
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

function waitForRunPhase(defaultDurationMs = 260): Promise<void> {
  return runPhaseDelay(defaultDurationMs);
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

const styles = codeLabStyles;
