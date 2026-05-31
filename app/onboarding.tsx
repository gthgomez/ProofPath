import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { contentPack } from "@/content/seed";
import { roleOnboardingCopy } from "@/content/roles";
import { getRoleTrackOnboardingSummary } from "@/domain/role-routing";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle } from "@/ui/primitives";
import { spacing } from "@/ui/theme";
import { useProgress } from "@/state/progress-provider";

export default function OnboardingScreen(): ReactElement {
  const router = useRouter();
  const { availableRoleTargets, isLoading, isSaving, profile, roleTarget, selectRoleTarget } = useProgress();

  function choosePath(roleTargetId: string): void {
    selectRoleTarget(roleTargetId, true);
    router.replace("/");
  }

  return (
    <Screen eyebrow="Career path" title="Choose your career path">
      <Panel accessibilityLabel="Career path setup">
        <Row>
          <Badge tone="green">Local profile</Badge>
          <Badge tone="blue">{roleTarget.title}</Badge>
          {isSaving || isLoading ? <Badge tone="amber">saving</Badge> : null}
        </Row>
        <SectionTitle>Your next screen becomes a focused dashboard.</SectionTitle>
        <BodyText>Pick the career path that should shape your next lesson, first portfolio mission, weekly plan, and readiness score.</BodyText>
        <MutedText>First action: choose a path below, then start from the dashboard plan. You can change paths later in Settings without erasing saved work.</MutedText>
        {profile.onboardingCompletedAt ? <MutedText>Last career path setup {new Date(profile.onboardingCompletedAt).toLocaleString()}</MutedText> : null}
      </Panel>

      <View style={styles.list}>
        {availableRoleTargets.map((target) => {
          const selected = profile.roleTargetId === target.id;
          const trackSummary = getRoleTrackOnboardingSummary(contentPack, target.id);
          const copy = roleOnboardingCopy[target.id];

          return (
            <Panel key={target.id}>
              {selected ? (
                <Row>
                  <Badge tone="rose">selected</Badge>
                </Row>
              ) : null}
              <SectionTitle>{target.title}</SectionTitle>
              <BodyText>Outcome: {target.summary}</BodyText>
              <MutedText>
                {trackSummary.trackCount} learning tracks: {trackSummary.includedTrackTitles.join(", ")}.
              </MutedText>
              {trackSummary.excludedTrackTitles.length > 0 ? (
                <MutedText>Not in this path (phase 2 or other target): {trackSummary.excludedTrackTitles.join(", ")}.</MutedText>
              ) : null}
              {copy ? (
                <>
                  <MutedText>Best for: {copy.bestFor}</MutedText>
                  <MutedText>First action: {copy.firstAction}</MutedText>
                </>
              ) : null}
              <ButtonShell
                accessibilityHint={selected ? "Keeps this career path selected and opens the dashboard." : "Selects this career path and opens the dashboard."}
                accessibilityLabel={selected ? `Open dashboard for ${target.title}` : `Start ${target.title} path`}
                disabled={isSaving || isLoading}
                onPress={() => choosePath(target.id)}
                selected={selected}
                tone={selected ? "ink" : "rose"}
              >
                {selected ? "Open dashboard" : "Start with this target"}
              </ButtonShell>
            </Panel>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: spacing.sm
  }
});
