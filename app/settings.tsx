import { useState, type ReactElement } from "react";
import { Alert, StyleSheet, View } from "react-native";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle } from "@/ui/primitives";
import { PATH_AI_PRODUCT_ENGINEERING_ID, PATH_BACKEND_API_DATA_ID, PATH_SECURE_SOFTWARE_APPSEC_ID } from "@/content/roles";
import { useProgress } from "@/state/progress-provider";
import { colors, radius, spacing } from "@/ui/theme";

export default function SettingsScreen(): ReactElement {
  const [showDangerActions, setShowDangerActions] = useState(false);
  const { availableRoleTargets, error, isSaving, progress, resetLocalProgress, roleTarget, selectRoleTarget } = useProgress();

  function confirmReset(): void {
    Alert.alert(
      "Reset local progress?",
      "This clears local profile, progress, reviews, evidence, and weekly reports on this device.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Reset", style: "destructive", onPress: () => void resetLocalProgress() }
      ]
    );
  }

  return (
    <Screen eyebrow="CareerForge Mobile" title="Settings">
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
    </Screen>
  );
}

function describeCareerTarget(roleTargetId: string): string {
  if (roleTargetId === PATH_BACKEND_API_DATA_ID) {
    return "Best if you want APIs, SQL, data models, and backend proof to lead before AI, analytics, cloud, or ML unlocks.";
  }

  if (roleTargetId === PATH_SECURE_SOFTWARE_APPSEC_ID) {
    return "Best if you want secure coding, secrets discipline, threat notes, dependency hygiene, and AppSec proof to shape the path.";
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
  }
});
