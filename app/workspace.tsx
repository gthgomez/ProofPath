import { Link, Redirect, useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { useState } from "react";
import { Platform, StyleSheet, Text, TextInput } from "react-native";
import { buildCiWorkflowDiagnosisTask, buildStudyTrackerFullJourneyTask } from "@/content/workspace-tasks";
import {
  createWorkspaceBundle,
  serializeWorkspaceBundle,
  validateResultManifest,
  workspaceBundleMarkdown,
  type WorkspaceManifestValidation,
  type WorkspaceTask
} from "@/domain/workspace-bridge";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle, SubPanel } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { useProgress } from "@/state/progress-provider";
import { copyToClipboard, downloadTextFile, shareText } from "@/ui/file-transfer";
import { colors, radius, spacing } from "@/ui/theme";

const WORKSPACE_TASKS: WorkspaceTask[] = [
  buildStudyTrackerFullJourneyTask(),
  buildCiWorkflowDiagnosisTask()
];

export default function WorkspaceScreen(): ReactElement {
  const { taskId } = useLocalSearchParams<{ taskId?: string }>();
  const { isCheckingOnboarding, needsOnboarding } = useOnboardingGate();

  if (isCheckingOnboarding) {
    return (
      <Screen eyebrow="Projects" title="Loading workspaces">
        <Panel accessibilityLabel="Loading workspaces" accessibilityState={{ busy: true }}>
          <SectionTitle>Reading local profile</SectionTitle>
          <MutedText>Checking SQLite before opening the workspace.</MutedText>
        </Panel>
      </Screen>
    );
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  const task = taskId ? WORKSPACE_TASKS.find((candidate) => candidate.id === taskId) : undefined;

  if (task) {
    return <WorkspaceDetail task={task} />;
  }

  return <WorkspaceList />;
}

function WorkspaceList(): ReactElement {
  return (
    <Screen eyebrow="Projects" title="Local workspaces">
      <Panel>
        <SectionTitle>Run real projects on your own machine</SectionTitle>
        <BodyText>
          ProofPath cannot run GitHub Actions or your filesystem, so these projects export a small workspace you run with
          real tools. You paste the result manifest back, and ProofPath records it as self-reported evidence.
        </BodyText>
      </Panel>
      {WORKSPACE_TASKS.map((task) => (
        <Panel key={task.id}>
          <Row>
            <Badge tone="teal">{task.files.length} files</Badge>
            <Badge tone="blue">v{task.version}</Badge>
          </Row>
          <SectionTitle>{task.title}</SectionTitle>
          <MutedText>{task.setupInstructions[0]}</MutedText>
          <Link href={{ pathname: "/workspace", params: { taskId: task.id } }} asChild>
            <ButtonShell accessibilityHint={`Opens the ${task.title} workspace.`} tone="teal">
              Open workspace
            </ButtonShell>
          </Link>
        </Panel>
      ))}
    </Screen>
  );
}

function WorkspaceDetail({ task }: { task: WorkspaceTask }): ReactElement {
  const { addEvidence, progress } = useProgress();
  const [manifestText, setManifestText] = useState("");
  const [validation, setValidation] = useState<WorkspaceManifestValidation | null>(null);
  const [transferStatus, setTransferStatus] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<string | null>(null);

  const bundle = createWorkspaceBundle(task);
  const relatedEvidence = task.linkedMissionId
    ? progress.evidenceItems.filter((item) => item.linkedProjectMissionId === task.linkedMissionId)
    : [];

  async function handleExport(): Promise<void> {
    const content = serializeWorkspaceBundle(bundle);
    const outcome = Platform.OS === "web"
      ? await downloadTextFile(bundle.fileName, content, "application/json")
      : await shareText(task.title, content);

    if (outcome === "downloaded") {
      setTransferStatus(`Downloaded ${bundle.fileName}. Reconstruct the files, preserving paths.`);
    } else if (outcome === "shared") {
      setTransferStatus("Opened the share sheet. Save the file, then reconstruct it preserving paths.");
    } else {
      setTransferStatus("This platform cannot save files directly. Use Copy workspace text instead.");
    }
  }

  async function handleCopy(): Promise<void> {
    const outcome = await copyToClipboard(workspaceBundleMarkdown(bundle));
    setTransferStatus(outcome === "clipped" ? "Workspace text copied to the clipboard." : "Clipboard is not available here.");
  }

  function handleValidate(): void {
    const result = validateResultManifest(task, manifestText);
    setValidation(result);
    setSavedStatus(null);
  }

  function handleSave(): void {
    const result = validateResultManifest(task, manifestText);
    setValidation(result);

    if (!result.passed) {
      setSavedStatus("Fix the failed checks and paste a passing manifest before saving evidence.");
      return;
    }

    const saved = addEvidence({
      type: "test-output",
      title: `${task.title} verifier run`,
      body: `Pasted the verifier result manifest for ${task.id} v${task.version}. Self-reported by the learner's own machine.`,
      linkedProjectMissionId: task.linkedMissionId,
      testStatus: "passing",
      verifierOutput: manifestText.trim(),
      reflection: undefined
    });

    setSavedStatus(saved ? "Saved as self-reported evidence linked to this project." : "Could not save evidence.");
  }

  return (
    <Screen eyebrow="Local workspace" title={task.title}>
      <Panel>
        <SectionTitle>Before you start</SectionTitle>
        {task.requirements.map((requirement) => (
          <MutedText key={requirement}>- {requirement}</MutedText>
        ))}
      </Panel>

      <Panel>
        <SectionTitle>Steps</SectionTitle>
        {task.setupInstructions.map((instruction, index) => (
          <BodyText key={instruction}>{index + 1}. {instruction}</BodyText>
        ))}
        <SubPanel>
          <MutedText style={{ fontWeight: "600" }}>Verification command</MutedText>
          {task.commands.map((command) => (
            <Text key={command.id} style={styles.code}>{command.command}</Text>
          ))}
        </SubPanel>
      </Panel>

      <Panel>
        <SectionTitle>Files in this workspace</SectionTitle>
        {task.files.map((file) => (
          <MutedText key={file.path}>{file.path}</MutedText>
        ))}
      </Panel>

      <Panel>
        <SectionTitle>Export the workspace</SectionTitle>
        <MutedText>
          The JSON export carries every file path and its contents, so the project can be reconstructed exactly.
        </MutedText>
        <Row>
          <ButtonShell accessibilityHint="Downloads or shares the workspace files." onPress={handleExport} tone="teal">
            {Platform.OS === "web" ? "Download workspace file" : "Share workspace file"}
          </ButtonShell>
          <ButtonShell
            accessibilityHint="Copies the full workspace as text with file delimiters."
            onPress={handleCopy}
            tone="ink"
            variant="secondary"
          >
            Copy workspace text
          </ButtonShell>
        </Row>
        {transferStatus ? <MutedText style={{ color: colors.teal, fontWeight: "600" }}>{transferStatus}</MutedText> : null}
      </Panel>

      <Panel>
        <SectionTitle>Paste the result manifest</SectionTitle>
        <MutedText>
          Run the verification command and paste the JSON it prints on stdout. The manifest is a record from your
          machine, not a signature, so it is stored as self-reported evidence.
        </MutedText>
        <TextInput
          accessibilityHint="Paste the JSON result manifest printed by the verifier."
          accessibilityLabel="Result manifest JSON"
          multiline
          onChangeText={(value) => {
            setManifestText(value);
            setValidation(null);
            setSavedStatus(null);
          }}
          placeholder={'{ "taskId": "...", "results": [...] }'}
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.manifestInput]}
          value={manifestText}
        />
        <Row>
          <ButtonShell accessibilityHint="Checks the manifest against the task and workspace hash." onPress={handleValidate} tone="blue" variant="secondary">
            Validate manifest
          </ButtonShell>
          <ButtonShell accessibilityHint="Saves passing, self-reported evidence." disabled={manifestText.trim().length === 0} onPress={handleSave} tone="green">
            Validate & save evidence
          </ButtonShell>
        </Row>
        {validation ? (
          <SubPanel>
            <Row>
              <Badge tone={validation.passed ? "green" : validation.status === "malformed" ? "rose" : "amber"}>{validation.status}</Badge>
              <MutedText>{validation.passed ? "All checks passed." : "Not accepted yet."}</MutedText>
            </Row>
            {validation.problems.map((problem) => (
              <MutedText key={problem}>{problem}</MutedText>
            ))}
          </SubPanel>
        ) : null}
        {savedStatus ? <MutedText style={{ color: colors.ink, fontWeight: "600" }}>{savedStatus}</MutedText> : null}
      </Panel>

      {task.linkedMissionId ? (
        <Panel>
          <SectionTitle>Linked project evidence</SectionTitle>
          <MutedText>{relatedEvidence.length} saved evidence item{relatedEvidence.length === 1 ? "" : "s"} for this project.</MutedText>
          <Link href={{ pathname: "/mission/[missionId]", params: { missionId: task.linkedMissionId } }} asChild>
            <ButtonShell accessibilityHint="Opens the linked project mission." tone="teal" variant="secondary">
              Open linked mission
            </ButtonShell>
          </Link>
        </Panel>
      ) : null}

      <Panel>
        <SectionTitle>Reconstructing the files</SectionTitle>
        <MutedText>
          The download is a single JSON file listing every path and its contents. Create each file at its path, run the
          verification command, then repair the defects the README describes.
        </MutedText>
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  manifestInput: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    minHeight: 140,
    textAlignVertical: "top"
  },
  code: {
    color: colors.ink,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    fontSize: 14
  }
});
