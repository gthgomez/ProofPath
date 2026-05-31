import { Redirect, useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { contentPack } from "@/content/seed";
import { findLesson } from "@/domain/content";
import { formatTerminalTranscript } from "@/domain/code-run";
import { getMissionsForRole } from "@/domain/role-routing";
import type { EvidenceTestStatus, EvidenceType, ReadmeStatus } from "@/domain/types";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { useProgress } from "@/state/progress-provider";
import { colors, radius, spacing } from "@/ui/theme";

export default function EvidenceLogScreen(): ReactElement {
  const { missionId } = useLocalSearchParams<{ missionId?: string }>();
  const { addEvidence, error, isSaving, progress, roleTarget } = useProgress();
  const { isCheckingOnboarding, needsOnboarding } = useOnboardingGate();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [commitHash, setCommitHash] = useState("");
  const [testStatus, setTestStatus] = useState<EvidenceTestStatus>("unknown");
  const [artifactUri, setArtifactUri] = useState("");
  const [readmeStatus, setReadmeStatus] = useState<ReadmeStatus>("missing");
  const [deploymentUrl, setDeploymentUrl] = useState("");
  const [verifierOutput, setVerifierOutput] = useState("");
  const [reflection, setReflection] = useState("");
  const [showProofDetails, setShowProofDetails] = useState(false);
  const roleMissions = getMissionsForRole(contentPack, roleTarget.id);
  const [linkedMissionId, setLinkedMissionId] = useState<string | undefined>(() => (
    roleMissions.some((mission) => mission.id === missionId) ? missionId : roleMissions[0]?.id
  ));
  const linkedMission = roleMissions.find((mission) => mission.id === linkedMissionId);
  const linkedLesson = linkedMission ? contentPack.modules
    .filter((moduleItem) => moduleItem.trackId === linkedMission.trackId)
    .flatMap((moduleItem) => moduleItem.lessonIds)
    .map((lessonId) => findLesson(contentPack, lessonId))
    .find((lesson) => Boolean(lesson)) : undefined;
  const linkedSkillIds = Array.from(new Set([
    ...(linkedMission?.skillIds ?? []),
    ...(linkedLesson?.skillIds ?? [])
  ]));
  const linkedMissionRequirements = linkedMission ? [
    linkedMission.evidenceRequirements.repoUrl ? "repo link" : undefined,
    linkedMission.evidenceRequirements.commitHash ? "commit hash" : undefined,
    linkedMission.evidenceRequirements.passingVerifierOutput ? "passing verifier" : undefined,
    linkedMission.evidenceRequirements.readmeStatus !== "missing" ? `README ${linkedMission.evidenceRequirements.readmeStatus}` : undefined,
    linkedMission.evidenceRequirements.artifactOrDeployment ? "artifact or deployment" : undefined,
    linkedMission.evidenceRequirements.reflection ? "reflection" : undefined
  ].filter((label): label is string => Boolean(label)) : [];

  const canSubmit = title.trim().length > 0 && body.trim().length > 0;

  if (isCheckingOnboarding) {
    return (
      <Screen eyebrow="Path setup" title="Loading evidence">
        <Panel accessibilityLabel="Loading evidence form" accessibilityState={{ busy: true }}>
          <SectionTitle>Reading local profile</SectionTitle>
          <MutedText>Checking SQLite before choosing the evidence mission.</MutedText>
        </Panel>
      </Screen>
    );
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  function submitEvidence(): void {
    if (!canSubmit) {
      return;
    }

    const evidenceType: EvidenceType = verifierOutput.trim().length > 0
      ? "test-output"
      : deploymentUrl.trim().length > 0
        ? "deployment"
        : artifactUri.trim().length > 0
          ? "screenshot"
          : commitHash.trim().length > 0
            ? "commit"
            : repoUrl.trim().length > 0
              ? "repo"
              : reflection.trim().length > 0
                ? "reflection"
                : "note";

    const saved = addEvidence({
      type: evidenceType,
      title,
      body,
      linkedProjectMissionId: linkedMission?.id,
      linkedLessonId: linkedLesson?.id,
      linkedSkillIds,
      repoUrl,
      commitHash,
      testStatus,
      artifactUri,
      readmeStatus,
      deploymentUrl,
      verifierOutput,
      reflection
    });
    if (!saved) {
      return;
    }
    setTitle("");
    setBody("");
    setRepoUrl("");
    setCommitHash("");
    setTestStatus("unknown");
    setArtifactUri("");
    setReadmeStatus("missing");
    setDeploymentUrl("");
    setVerifierOutput("");
    setReflection("");
  }

  function applyMissionProofTemplate(): void {
    if (!linkedMission) {
      return;
    }

    setTitle(`${linkedMission.title} proof`);
    setBody(`Evidence for ${linkedMission.title}: ${linkedMission.expectedArtifacts.join("; ")}.`);
    setVerifierOutput(linkedMission.verificationCommands.join("\n"));
    setReadmeStatus(linkedMission.evidenceRequirements.readmeStatus);
    setReflection(linkedMission.portfolioSummaryPrompt);
  }

  return (
    <Screen eyebrow="Portfolio" title="Portfolio">
      <Panel accessibilityLabel="Add portfolio evidence">
        <Row>
          <Badge tone="green">{progress.evidenceItems.length} entries</Badge>
          {isSaving ? <Badge tone="amber">saving</Badge> : null}
        </Row>
        <SectionTitle>Interview-ready proof</SectionTitle>
        <MutedText>
          Your portfolio is evidence you can explain in an interview: repo links, passing test output, screenshots, and short notes about what you built and verified.
        </MutedText>
        <SectionTitle>Add evidence</SectionTitle>
        {roleMissions.length > 0 ? (
          <Row>
            {roleMissions.map((mission) => (
              <ButtonShell
                accessibilityHint={`Links this evidence to ${mission.title}.`}
                key={mission.id}
                onPress={() => setLinkedMissionId(mission.id)}
                selected={linkedMissionId === mission.id}
                tone={linkedMissionId === mission.id ? "ink" : "blue"}
              >
                {mission.title}
              </ButtonShell>
            ))}
          </Row>
        ) : null}
        {linkedMission ? <MutedText>Linked mission: {linkedMission.title}</MutedText> : <MutedText>Select a mission before saving portfolio evidence.</MutedText>}
        {linkedSkillIds.length > 0 ? <MutedText>Skills: {linkedSkillIds.length}</MutedText> : null}
        {linkedMissionRequirements.length > 0 ? (
          <Row>
            {linkedMissionRequirements.map((requirement) => (
              <Badge key={requirement} tone="rose">{requirement}</Badge>
            ))}
          </Row>
        ) : null}
        <ButtonShell
          accessibilityHint="Prefills the evidence form with this mission's expected proof fields."
          disabled={!linkedMission}
          onPress={applyMissionProofTemplate}
          tone="teal"
        >
          Use proof template
        </ButtonShell>
        <TextInput
          accessibilityHint="Required. Give this evidence a short name."
          accessibilityLabel="Evidence title"
          onChangeText={setTitle}
          placeholder="Title"
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={title}
        />
        <TextInput
          accessibilityHint="Required. Describe what changed, passed, or still needs work."
          accessibilityLabel="Evidence note"
          multiline
          onChangeText={setBody}
          placeholder="What changed, passed, or needs work?"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.noteInput]}
          value={body}
        />
        <TextInput
          accessibilityHint="Required when test status is passing."
          accessibilityLabel="Verifier output"
          multiline
          onChangeText={setVerifierOutput}
          placeholder="Verifier output or exact command"
          placeholderTextColor={colors.muted}
          style={[styles.input, styles.noteInput]}
          value={verifierOutput}
        />
        <ButtonShell
          accessibilityHint={showProofDetails ? "Hides repo, commit, README, artifact, deployment, and reflection fields." : "Shows optional proof detail fields."}
          accessibilityState={{ expanded: showProofDetails }}
          onPress={() => setShowProofDetails((current) => !current)}
          tone="ink"
          variant="secondary"
        >
          {showProofDetails ? "Hide proof details" : "Add repo, README, artifact, or reflection"}
        </ButtonShell>
        {showProofDetails ? (
          <View style={styles.detailFields}>
            <TextInput
              accessibilityHint="Optional. Must start with http or https."
              accessibilityLabel="Repository URL"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onChangeText={setRepoUrl}
              placeholder="Repo URL"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={repoUrl}
            />
            <TextInput
              accessibilityHint="Optional. Seven to forty hexadecimal characters."
              accessibilityLabel="Commit hash"
              autoCapitalize="none"
              autoCorrect={false}
              onChangeText={setCommitHash}
              placeholder="Commit hash"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={commitHash}
            />
            <Row>
              {(["unknown", "not-run", "passing", "failing"] as const).map((status) => (
                <ButtonShell
                  accessibilityHint={`Marks test status as ${status}.`}
                  accessibilityLabel={`Test status ${status}`}
                  key={status}
                  onPress={() => setTestStatus(status)}
                  selected={testStatus === status}
                  tone={testStatus === status ? "ink" : status === "passing" ? "green" : status === "failing" ? "rose" : "blue"}
                >
                  {status}
                </ButtonShell>
              ))}
            </Row>
            <Row>
              {(["missing", "basic", "complete"] as const).map((status) => (
                <ButtonShell
                  accessibilityHint={`Marks README status as ${status}.`}
                  accessibilityLabel={`README status ${status}`}
                  key={status}
                  onPress={() => setReadmeStatus(status)}
                  selected={readmeStatus === status}
                  tone={readmeStatus === status ? "ink" : status === "complete" ? "green" : "amber"}
                >
                  README {status}
                </ButtonShell>
              ))}
            </Row>
            <TextInput
              accessibilityHint="Optional. Link to a screenshot, demo, or artifact."
              accessibilityLabel="Artifact link"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onChangeText={setArtifactUri}
              placeholder="Screenshot, demo, or artifact link"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={artifactUri}
            />
            <TextInput
              accessibilityHint="Optional. Link to a deployed demo or release."
              accessibilityLabel="Deployment link"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onChangeText={setDeploymentUrl}
              placeholder="Deployment link"
              placeholderTextColor={colors.muted}
              style={styles.input}
              value={deploymentUrl}
            />
            <TextInput
              accessibilityHint="Optional. Explain what this evidence proves."
              accessibilityLabel="Evidence reflection"
              multiline
              onChangeText={setReflection}
              placeholder="Reflection: what this proves and what remains"
              placeholderTextColor={colors.muted}
              style={[styles.input, styles.noteInput]}
              value={reflection}
            />
          </View>
        ) : null}
        {error ? <MutedText accessibilityLiveRegion="polite">{error}</MutedText> : null}
        <ButtonShell
          accessibilityHint={canSubmit ? "Saves this evidence to local SQLite." : "Enter a title and note before saving."}
          disabled={!canSubmit || isSaving}
          onPress={submitEvidence}
          tone="green"
        >
          Save evidence
        </ButtonShell>
      </Panel>

      {progress.evidenceItems.length === 0 ? (
        <Panel>
          <SectionTitle>No evidence saved yet</SectionTitle>
          <MutedText>Start with a repo, verifier output, screenshot, or reflection tied to the suggested mission.</MutedText>
        </Panel>
      ) : null}

      {progress.evidenceItems.map((item) => (
        <Panel key={item.id}>
          <Row>
            <Badge tone="green">{item.type}</Badge>
            <Badge tone={item.trust === "auto_verified_code_lab" ? "green" : item.trust === "manual_verifier_output" ? "amber" : "blue"}>
              {trustLabel(item.trust ?? "manual_note")}
            </Badge>
            <MutedText>{new Date(item.createdAt).toLocaleDateString()}</MutedText>
          </Row>
          <SectionTitle>{item.title}</SectionTitle>
          <BodyText>{item.body}</BodyText>
          <Row>
            <Badge tone={item.testStatus === "passing" ? "green" : item.testStatus === "failing" ? "rose" : "blue"}>{item.testStatus}</Badge>
            <Badge tone={item.readmeStatus === "complete" ? "green" : item.readmeStatus === "basic" ? "amber" : "rose"}>README {item.readmeStatus}</Badge>
            {item.linkedSkillIds.length > 0 ? <Badge tone="teal">{item.linkedSkillIds.length} skills</Badge> : null}
          </Row>
          {item.repoUrl ? <MutedText>Repo: {item.repoUrl}</MutedText> : null}
          {item.commitHash ? <MutedText>Commit: {item.commitHash}</MutedText> : null}
          {item.artifactUri ? <MutedText>Artifact: {item.artifactUri}</MutedText> : null}
          {item.deploymentUrl ? <MutedText>Deployment: {item.deploymentUrl}</MutedText> : null}
          {item.verifierOutput ? <MutedText>Verifier: {item.verifierOutput}</MutedText> : null}
          {item.reflection ? <MutedText>Reflection: {item.reflection}</MutedText> : null}
          {item.proofArtifact ? (
            <>
              <SectionTitle>Proof artifact</SectionTitle>
              <MutedText>Command: {item.proofArtifact.command}</MutedText>
              <MutedText>Language: {item.proofArtifact.language}</MutedText>
              <MutedText>Run mode: {item.proofArtifact.runMode}</MutedText>
              <MutedText>Runtime: {item.proofArtifact.runtimeMs}ms</MutedText>
              <MutedText>Result: {item.proofArtifact.passed ? "passed" : "failed"}</MutedText>
              <MutedText>Visible checks: {item.proofArtifact.visibleCheckResults.filter((result) => result.passed).length}/{item.proofArtifact.visibleCheckResults.length} passed</MutedText>
              <MutedText>Private verifier details: redacted</MutedText>
              <MutedText>Code hash: {item.proofArtifact.codeHash}</MutedText>
              {item.proofArtifact.missionId ? <MutedText>Mission: {item.proofArtifact.missionId}</MutedText> : null}
              <MutedText>Transcript: {formatTerminalTranscript(item.proofArtifact.terminalTranscript)}</MutedText>
            </>
          ) : null}
          {item.uri ? <MutedText>Legacy link: {item.uri}</MutedText> : null}
        </Panel>
      ))}
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
  noteInput: {
    minHeight: 96,
    textAlignVertical: "top"
  },
  detailFields: {
    gap: spacing.sm
  }
});

function trustLabel(trust: "auto_verified_code_lab" | "manual_verifier_output" | "manual_note"): string {
  if (trust === "auto_verified_code_lab") {
    return "auto-verified";
  }

  if (trust === "manual_verifier_output") {
    return "self-reported verifier";
  }

  return "self-reported note";
}
