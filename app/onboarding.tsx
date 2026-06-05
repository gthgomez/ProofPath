import { useRouter } from "expo-router";
import type { ReactElement } from "react";
import { useState, useRef } from "react";
import { ScrollView as RNScrollView, StyleSheet, View, useWindowDimensions, Pressable } from "react-native";
import { contentPack } from "@/content/seed";
import { roleOnboardingCopy } from "@/content/roles";
import { getRoleTrackOnboardingSummary } from "@/domain/role-routing";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle } from "@/ui/primitives";
import { colors, radius, spacing, sizing } from "@/ui/theme";
import { useProgress } from "@/state/progress-provider";

export default function OnboardingScreen(): ReactElement {
  const router = useRouter();
  const { availableRoleTargets, isLoading, isSaving, profile, roleTarget, selectRoleTarget } = useProgress();
  const [activeIndex, setActiveIndex] = useState(0);
  const [expandedTargetId, setExpandedTargetId] = useState<string | null>(null);
  const scrollViewRef = useRef<RNScrollView>(null);
  const { width } = useWindowDimensions();
  const carouselWidth = width - spacing.md * 2;

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

      <RNScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const index = Math.round(offsetX / carouselWidth);
          setActiveIndex(index);
        }}
        style={[styles.carousel, { width: carouselWidth }]}
        contentContainerStyle={{ width: carouselWidth * availableRoleTargets.length }}
      >
        {availableRoleTargets.map((target, index) => {
          const selected = profile.roleTargetId === target.id;
          const trackSummary = getRoleTrackOnboardingSummary(contentPack, target.id);
          const copy = roleOnboardingCopy[target.id];
          const active = activeIndex === index;
          const isExpanded = expandedTargetId === target.id;

          return (
            <View
              key={target.id}
              style={[styles.card, { width: carouselWidth }]}
              accessibilityElementsHidden={!active}
              importantForAccessibility={active ? "yes" : "no-hide-descendants"}
            >
              <Panel>
                {selected ? (
                  <Row>
                    <Badge tone="rose">selected</Badge>
                  </Row>
                ) : null}
                <SectionTitle>{target.title}</SectionTitle>
                
                <BodyText style={styles.pitchText}>
                  {copy ? copy.bestFor : target.summary}
                </BodyText>

                {copy ? (
                  <MutedText style={styles.milestoneText}>
                    First Milestone: {copy.firstAction}
                  </MutedText>
                ) : null}

                <ButtonShell
                  accessibilityHint={isExpanded ? "Hides the list of tracks in this syllabus." : "Shows the list of tracks in this syllabus."}
                  accessibilityState={{ expanded: isExpanded }}
                  onPress={() => setExpandedTargetId(isExpanded ? null : target.id)}
                  size="compact"
                  tone="ink"
                  variant="tertiary"
                  style={styles.expandButton}
                >
                  {isExpanded ? "Hide Syllabus Details" : "Detailed Syllabus"}
                </ButtonShell>

                {isExpanded ? (
                  <View style={styles.syllabusDrawer} accessibilityLiveRegion="polite">
                    <MutedText style={styles.syllabusText}>
                      {trackSummary.trackCount} learning tracks: {trackSummary.includedTrackTitles.join(", ")}.
                    </MutedText>
                    {trackSummary.excludedTrackTitles.length > 0 ? (
                      <MutedText style={styles.syllabusText}>
                        Not in this path: {trackSummary.excludedTrackTitles.join(", ")}.
                      </MutedText>
                    ) : null}
                  </View>
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
            </View>
          );
        })}
      </RNScrollView>

      <View style={styles.indicatorContainer} accessibilityRole="tablist" accessibilityLabel="Career path pages">
        {availableRoleTargets.map((target, index) => {
          const active = activeIndex === index;
          return (
            <Pressable
              key={`dot-${target.id}`}
              accessibilityRole="tab"
              accessibilityLabel={`Page ${index + 1} of ${availableRoleTargets.length}: ${target.title}`}
              accessibilityState={{ selected: active }}
              accessibilityHint={`Swipes to ${target.title} card.`}
              onPress={() => {
                scrollViewRef.current?.scrollTo({ x: index * carouselWidth, animated: true });
                setActiveIndex(index);
              }}
              style={styles.indicatorDotContainer}
            >
              <View style={[styles.indicatorDot, active ? styles.indicatorDotActive : null]} />
            </Pressable>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  carousel: {
    marginVertical: spacing.sm
  },
  card: {
    paddingHorizontal: spacing.xs
  },
  pitchText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
    marginVertical: spacing.xs
  },
  milestoneText: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.mutedStrong,
    fontWeight: "600",
    marginBottom: spacing.xs
  },
  expandButton: {
    alignSelf: "flex-start",
    marginBottom: spacing.xs
  },
  syllabusDrawer: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    gap: spacing.xs
  },
  syllabusText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    marginVertical: spacing.sm
  },
  indicatorDotContainer: {
    width: sizing.minTapTarget,
    height: sizing.minTapTarget,
    minHeight: sizing.minTapTarget,
    justifyContent: "center",
    alignItems: "center"
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.inkMuted
  },
  indicatorDotActive: {
    backgroundColor: colors.rose,
    width: 12,
    height: 12,
    borderRadius: 6
  }
});
