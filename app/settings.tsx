import { useState, type ReactElement } from "react";
import { Platform, StyleSheet, TextInput, View } from "react-native";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle } from "@/ui/primitives";
import { ConfirmDialog } from "@/ui/confirm-dialog";
import { PATH_AI_PRODUCT_ENGINEERING_ID, PATH_BACKEND_API_DATA_ID, PATH_SECURE_SOFTWARE_APPSEC_ID } from "@/content/roles";
import {
  createProgressBackup,
  parseProgressBackup,
  ProgressBackupTooLargeError,
  serializeProgressBackup,
  type ProgressBackup
} from "@/domain/progress-backup";
import { editorDraftStore } from "@/storage/draft-store";
import { useProgress } from "@/state/progress-provider";
import { copyToClipboard, downloadTextFile, pickTextFile, shareFile } from "@/ui/file-transfer";
import { colors, radius, spacing } from "@/ui/theme";

export default function SettingsScreen(): ReactElement {
  const [showDangerActions, setShowDangerActions] = useState(false);
  const [backupText, setBackupText] = useState("");
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState<
    { kind: "restore"; backup: ProgressBackup } | { kind: "reset" } | null
  >(null);
  const {
    availableRoleTargets,
    error,
    isSaving,
    progress,
    resetLocalProgress,
    restoreBackup,
    roleTarget,
    selectRoleTarget
  } = useProgress();

  async function buildBackupJson(): Promise<string> {
    const drafts = await editorDraftStore.exportAll();
    return serializeProgressBackup(createProgressBackup(progress, drafts, new Date().toISOString()));
  }

  function describeBackupBuildError(caughtError: unknown): string {
    if (caughtError instanceof ProgressBackupTooLargeError) {
      return `${caughtError.message} Your progress is still saved on this device. This backup was not produced because ProofPath could not restore it either.`;
    }
    return caughtError instanceof Error
      ? `Could not build the progress backup: ${caughtError.message}`
      : "Could not build the progress backup.";
  }

  async function handleCopyBackup(): Promise<void> {
    try {
      const json = await buildBackupJson();
      const outcome = await copyToClipboard(json);
      setBackupStatus(outcome === "clipped"
        ? "Progress backup JSON copied. It includes editor drafts and reset markers."
        : "Clipboard is not available here. Use Download on web.");
    } catch (caughtError) {
      setBackupStatus(describeBackupBuildError(caughtError));
    }
  }

  async function handleDownloadBackup(): Promise<void> {
    try {
      const json = await buildBackupJson();
      const outcome = await downloadTextFile("proofpath-progress-backup.json", json, "application/json");
      setBackupStatus(outcome === "downloaded"
        ? "Downloaded proofpath-progress-backup.json."
        : "Download is only available in the browser build. Use Copy instead.");
    } catch (caughtError) {
      setBackupStatus(describeBackupBuildError(caughtError));
    }
  }

  async function handleShareBackup(): Promise<void> {
    try {
      const json = await buildBackupJson();
      const outcome = await shareFile("proofpath-progress-backup.json", json, "application/json");
      setBackupStatus(outcome === "shared"
        ? "Opened the share sheet with proofpath-progress-backup.json. Choose a destination to save it; closing the sheet cancels it."
        : outcome === "unsupported"
          ? "File sharing is not available on this device. Use Copy backup JSON instead."
          : "Sharing failed. Use Copy backup JSON instead.");
    } catch (caughtError) {
      setBackupStatus(describeBackupBuildError(caughtError));
    }
  }

  async function handleImportBackupFile(): Promise<void> {
    const result = await pickTextFile();
    if (result.status === "cancelled") {
      setBackupStatus("No file chosen. Nothing was changed.");
      return;
    }
    if (result.status === "unsupported") {
      setBackupStatus("File import is not available here. Paste the backup JSON instead.");
      return;
    }
    if (result.status === "failed") {
      setBackupStatus(result.error ?? "The selected file could not be read.");
      return;
    }

    setBackupText(result.content);
    const parsed = parseProgressBackup(result.content, new Date().toISOString());
    if (!parsed.backup) {
      setBackupStatus(`${result.fileName}: ${parsed.error ?? "this backup is not valid."}`);
      return;
    }
    setBackupStatus(`Loaded ${result.fileName}. Review what will be replaced, then confirm.`);
    setPendingConfirmation({ kind: "restore", backup: parsed.backup });
  }

  function handleRestore(): void {
    const parsed = parseProgressBackup(backupText, new Date().toISOString());
    if (!parsed.backup) {
      setBackupStatus(parsed.error ?? "This backup is not valid.");
      return;
    }

    setPendingConfirmation({ kind: "restore", backup: parsed.backup });
  }

  async function performRestore(backup: ProgressBackup): Promise<void> {
    setIsRestoring(true);
    try {
      const result = await restoreBackup(backup);
      setPendingConfirmation(null);
      setBackupStatus(result.ok
        ? "Progress and editor drafts restored from the backup. Restored Code Lab proofs are kept as self-reported check output because this device did not execute them."
        : `Backup validated, but restore could not be completed: ${result.error ?? "unknown error"}. Your previous local state was kept.`);
      if (result.ok) {
        setBackupText("");
      }
    } catch (caughtError) {
      setPendingConfirmation(null);
      setBackupStatus(caughtError instanceof Error ? caughtError.message : "Unable to restore the backup.");
    } finally {
      setIsRestoring(false);
    }
  }

  function confirmReset(): void {
    setPendingConfirmation({ kind: "reset" });
  }

  async function performReset(): Promise<void> {
    setIsResetting(true);
    try {
      await resetLocalProgress();
      setPendingConfirmation(null);
    } finally {
      setIsResetting(false);
    }
  }

  function restoreConfirmationDetails(backup: ProgressBackup): string[] {
    const drafts = Object.keys(backup.drafts).length;
    const attempts = backup.progress.codeRunAttempts?.length ?? 0;
    return [
      backup.progress.evidenceItems.length === 1
        ? "1 evidence item"
        : `${backup.progress.evidenceItems.length} evidence items`,
      attempts === 1 ? "1 saved code run" : `${attempts} saved code runs`,
      backup.progress.completedLessonIds.length === 1
        ? "1 completed lesson"
        : `${backup.progress.completedLessonIds.length} completed lessons`,
      drafts === 1 ? "1 editor draft" : `${drafts} editor drafts`,
      `Backup created ${new Date(backup.createdAt).toLocaleString()}`
    ];
  }

  return (
    <Screen eyebrow="ProofPath" title="Settings">
      <Panel>
        <Row>
          <Badge tone="green">offline</Badge>
          <Badge tone="blue">on this device</Badge>
          {isSaving ? <Badge tone="amber">saving</Badge> : null}
        </Row>
        <SectionTitle>Your saved work</SectionTitle>
        <BodyText>Your lessons, quiz attempts, evidence, reviews, and weekly reports are saved locally on this device.</BodyText>
        <MutedText>Last saved {new Date(progress.updatedAt).toLocaleString()}</MutedText>
        {error ? <MutedText accessibilityLiveRegion="polite">{error}</MutedText> : null}
      </Panel>

      <Panel>
        <Row>
          <Badge tone="rose">{roleTarget.title}</Badge>
          <Badge tone="green">current path</Badge>
        </Row>
        <SectionTitle>Career path</SectionTitle>
        <BodyText>Switching career paths changes the order of lessons, the missions shown first, the Today plan, weekly tasks, and readiness score.</BodyText>
        <MutedText>It does not delete completed work. Reset progress is lower on this screen because it clears saved data.</MutedText>
        <View style={styles.pathList}>
          {availableRoleTargets.map((target) => {
            const selected = target.id === roleTarget.id;

            return (
              <View key={target.id} style={[styles.pathOption, selected ? styles.pathOptionSelected : null]}>
                {selected ? (
                  <Row>
                    <Badge tone="rose">selected</Badge>
                  </Row>
                ) : null}
                <SectionTitle>{target.title}</SectionTitle>
                <BodyText>{target.summary}</BodyText>
                <MutedText>{describeCareerTarget(target.id)}</MutedText>
                <ButtonShell
                  accessibilityHint={selected ? "This career path is currently selected." : "Switches recommendations and scoring to this career path without deleting saved work."}
                  disabled={isSaving}
                  onPress={() => selectRoleTarget(target.id, true)}
                  selected={selected}
                  tone={selected ? "ink" : "blue"}
                  variant={selected ? "secondary" : "primary"}
                >
                  {selected ? `Current: ${target.title}` : `Use ${target.title}`}
                </ButtonShell>
              </View>
            );
          })}
        </View>
      </Panel>

      <Panel accessibilityLabel="Backup and restore">
        <Row>
          <Badge tone="blue">portable</Badge>
          <Badge tone="teal">version 1</Badge>
        </Row>
        <SectionTitle>Back up or restore progress</SectionTitle>
        <BodyText>This is a complete local backup: profile, achievements, placement, attempts, evidence, reviews, weekly reports, and editor drafts. It is not the reviewer portfolio packet.</BodyText>
        <Row>
          <ButtonShell
            accessibilityHint="Copies a complete, versioned progress backup as JSON, including editor drafts."
            disabled={isSaving}
            onPress={() => void handleCopyBackup()}
            tone="blue"
            variant="secondary"
          >
            Copy backup JSON
          </ButtonShell>
          <ButtonShell
            accessibilityHint={Platform.OS === "web"
              ? "Downloads a complete progress backup JSON file."
              : "Writes a named JSON backup file and opens the system share sheet so you can save it."}
            disabled={isSaving}
            onPress={() => void (Platform.OS === "web" ? handleDownloadBackup() : handleShareBackup())}
            tone="teal"
            variant="secondary"
          >
            {Platform.OS === "web" ? "Download backup" : "Share backup file"}
          </ButtonShell>
          <ButtonShell
            accessibilityHint="Choose a ProofPath backup file from this device. Nothing changes until you confirm the restore."
            disabled={isSaving || isRestoring}
            onPress={() => void handleImportBackupFile()}
            tone="blue"
            variant="secondary"
          >
            Import backup file
          </ButtonShell>
        </Row>
        <MutedText>Restore from a file, or paste the backup JSON below. Restoring replaces local progress only after you confirm.</MutedText>
        <TextInput
          accessibilityHint="Paste a ProofPath progress backup JSON document."
          accessibilityLabel="Progress backup JSON"
          multiline
          onChangeText={setBackupText}
          placeholder='{"format":"proofpath-progress-backup",...}'
          placeholderTextColor={colors.muted}
          style={[styles.backupInput, styles.backupText]}
          value={backupText}
        />
        <ButtonShell
          accessibilityHint="Validates the pasted backup and asks for confirmation before replacing local progress."
          disabled={isSaving || isRestoring || backupText.trim().length === 0}
          onPress={handleRestore}
          tone="rose"
        >
          {isRestoring ? "Restoring backup" : "Restore from backup"}
        </ButtonShell>
        {backupStatus ? <MutedText accessibilityLiveRegion="polite">{backupStatus}</MutedText> : null}
      </Panel>

      <Panel accessibilityLabel="Danger zone">
        <Row>
          <Badge tone="rose">danger zone</Badge>
        </Row>
        <SectionTitle>Reset saved work</SectionTitle>
        <BodyText>Use this only when you want to clear the local profile, progress, reviews, evidence, and weekly reports on this device.</BodyText>
        <ButtonShell
          accessibilityHint={showDangerActions ? "Hides the reset progress action." : "Shows the reset progress action."}
          disabled={isSaving}
          onPress={() => setShowDangerActions((current) => !current)}
          tone="rose"
          variant="secondary"
        >
          {showDangerActions ? "Hide reset action" : "Show reset action"}
        </ButtonShell>
        {showDangerActions ? (
          <ButtonShell
            accessibilityHint="Clears local profile, progress, reviews, evidence, and weekly reports."
            disabled={isSaving}
            onPress={confirmReset}
            tone="rose"
          >
            Reset progress
          </ButtonShell>
        ) : null}
      </Panel>

      <ConfirmDialog
        busy={pendingConfirmation?.kind === "restore" ? isRestoring : pendingConfirmation?.kind === "reset" ? isResetting : false}
        cancelLabel="Keep my data"
        confirmLabel={pendingConfirmation?.kind === "restore" ? "Replace with backup" : "Erase everything"}
        destructive
        details={pendingConfirmation?.kind === "restore"
          ? restoreConfirmationDetails(pendingConfirmation.backup)
          : [
              "Profile and career-path choice",
              "Lesson, quiz, and mission progress",
              "Evidence, reviews, and weekly reports",
              "Editor drafts and reset markers"
            ]}
        message={pendingConfirmation?.kind === "restore"
          ? "This replaces all local progress and editor drafts with the backup. It cannot be undone. ProofPath did not execute the restored checks on this device, so restored Code Lab proofs are kept as self-reported check output."
          : "This clears saved work on this device. It cannot be undone."}
        onCancel={() => setPendingConfirmation(null)}
        onConfirm={() => {
          if (pendingConfirmation?.kind === "restore") {
            void performRestore(pendingConfirmation.backup);
            return;
          }
          if (pendingConfirmation?.kind === "reset") {
            void performReset();
          }
        }}
        title={pendingConfirmation?.kind === "restore" ? "Replace local progress?" : "Reset saved work?"}
        visible={pendingConfirmation !== null}
      />
    </Screen>
  );
}

function describeCareerTarget(roleTargetId: string): string {
  if (roleTargetId === PATH_BACKEND_API_DATA_ID) {
    return "Best if you want APIs, SQL, data models, and backend projects to lead before AI, analytics, cloud, or ML unlocks.";
  }

  if (roleTargetId === PATH_SECURE_SOFTWARE_APPSEC_ID) {
    return "Best if you want secure coding, secrets discipline, threat notes, dependency hygiene, and AppSec evidence to shape the path.";
  }

  if (roleTargetId === PATH_AI_PRODUCT_ENGINEERING_ID) {
    return "Best if you want TypeScript, AI verification, RAG, evals, guardrails, and AI app boundaries to show up early.";
  }

  return "Best if you want the broad shared core: Python, TypeScript, SQL, Git, testing, and AI verification before specialization.";
}

const styles = StyleSheet.create({
  pathList: {
    gap: spacing.sm
  },
  pathOption: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  pathOptionSelected: {
    backgroundColor: colors.surface,
    borderColor: colors.ink
  },
  backupInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    minHeight: 120,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm
  },
  backupText: {
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" }),
    textAlignVertical: "top"
  }
});
