import { Link, Redirect } from "expo-router";
import type { ComponentProps, ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { contentPack } from "@/content/seed";
import { getReviewCards } from "@/domain/review-queue";
import type { UserProgress } from "@/domain/types";
import { getContentForRole, getNextLessonForRole, getNextMissionForRole, getTracksForRole, getPathNodes } from "@/domain/role-routing";
import { getModulesForTrack, getLessonsForModule } from "@/domain/content";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { colors, radius, semanticColors, spacing } from "@/ui/theme";
import { useProgress } from "@/state/progress-provider";

export default function DashboardScreen(): ReactElement {
  const { error, progress, readiness, roleTarget, dismissTour } = useProgress();
  const { isCheckingOnboarding, needsOnboarding } = useOnboardingGate();
  const roleContent = getContentForRole(contentPack, roleTarget.id);
  const nextLesson = getNextLessonForRole(contentPack, progress);
  const nextMission = getNextMissionForRole(contentPack, progress);
  const reviewCards = getReviewCards(roleContent, progress);
  const dueReviewCards = reviewCards.filter((card) => card.isDue);
  const todayReview = dueReviewCards[0] ?? reviewCards[0];
  const weeklyCompleted = roleContent.weeklyPlan.tasks.filter((task) => progress.weeklyPlanTaskIds.includes(task.id)).length;
  const weeklyTotal = roleContent.weeklyPlan.tasks.length;
  const proofStreak = getActiveDayStreak(progress);
  const missionHasWork = nextMission
    ? progress.completedProjectMissionIds.includes(nextMission.id)
      || progress.evidenceItems.some((item) => item.linkedProjectMissionId === nextMission.id)
    : false;

  const tracks = getTracksForRole(contentPack, roleTarget.id);
  const activeTrack = tracks.find((track) => {
    const modules = getModulesForTrack(contentPack, track.id);
    const trackLessons = modules.flatMap((m) => getLessonsForModule(contentPack, m.id));
    return trackLessons.some((l) => !progress.completedLessonIds.includes(l.id));
  }) ?? tracks[0];

  const pathNodes = activeTrack ? getPathNodes(contentPack, activeTrack.id, progress) : [];
  const currentUnfinishedIndex = pathNodes.findIndex((node) => node.status !== "completed");
  const nextOnPathNodes = currentUnfinishedIndex >= 0
    ? pathNodes.slice(currentUnfinishedIndex, currentUnfinishedIndex + 3)
    : pathNodes.slice(-3);

  if (isCheckingOnboarding) {
    return (
      <Screen eyebrow="Path setup" title="Loading path">
        <Panel accessibilityLabel="Loading local profile" accessibilityState={{ busy: true }}>
          <SectionTitle>Reading local profile</SectionTitle>
          <MutedText>Checking SQLite before routing the dashboard.</MutedText>
        </Panel>
      </Screen>
    );
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen eyebrow="CareerForge Mobile" title="Today">
      {error ? (
        <Panel accessibilityLabel="Storage attention" accessibilityLiveRegion="polite">
          <SectionTitle>Storage attention</SectionTitle>
          <MutedText>{error}</MutedText>
        </Panel>
      ) : null}

      {!progress.profile.dashboardTourDismissed ? (
        <Panel accessibilityLabel="Welcome banner">
          <Row>
            <Badge tone="blue">Welcome</Badge>
            <MutedText style={{ flex: 1 }}>
              Your daily dashboard — continue your lesson, track your streak, and review what you've learned.
            </MutedText>
            <ButtonShell
              accessibilityHint="Dismisses welcome banner."
              onPress={dismissTour}
              size="compact"
              tone="ink"
              variant="tertiary"
            >
              ✕
            </ButtonShell>
          </Row>
        </Panel>
      ) : null}

      <Panel accessibilityLabel="Today dashboard">
        <SectionTitle>Today's plan</SectionTitle>
        <MutedText style={{ marginBottom: spacing.xs }}>{roleTarget.title} · {readiness.score}% ready</MutedText>

        {nextLesson ? (
          <TodayTask
            actionLabel="Start lesson"
            badge="Learn"
            detail={`${nextLesson.estimatedMinutes} minutes - ${nextLesson.summary}`}
            href={{ pathname: "/lesson/[lessonId]", params: { lessonId: nextLesson.id } }}
            tone="blue"
            title={nextLesson.title}
          />
        ) : (
          <TodayTask
            actionLabel="Open path"
            badge="Learn"
            detail="Lessons are complete for this career path. Use review or portfolio work to keep momentum."
            href="/path"
            tone="green"
            title="Lessons complete"
          />
        )}

        {nextMission ? (
          <TodayTask
            actionLabel={missionHasWork ? "Add evidence" : "Open build"}
            badge="Build"
            detail={missionHasWork ? "Turn the current mission work into evidence while it is fresh." : nextMission.brief}
            href={missionHasWork ? { pathname: "/evidence" as const, params: { missionId: nextMission.id } } : { pathname: "/mission/[missionId]" as const, params: { missionId: nextMission.id } }}
            tone="amber"
            title={nextMission.title}
          />
        ) : (
          <TodayTask
            actionLabel="Open evidence"
            badge="Portfolio"
            detail="All missions are complete. Strengthen the portfolio record with clearer evidence."
            href="/evidence"
            tone="green"
            title="Portfolio cleanup"
          />
        )}

        {todayReview ? (
          <TodayTask
            actionLabel="Review now"
            badge="Portfolio"
            detail={todayReview.recallPrompt}
            href="/review"
            tone={todayReview.isDue ? "rose" : "teal"}
            title={todayReview.title}
          />
        ) : (
          <TodayTask
            actionLabel="Open weekly plan"
            badge="Recall"
            detail="Complete a lesson, checkpoint, or mission to schedule the first review."
            href="/weekly-plan"
            tone="teal"
            title="No review due"
          />
        )}
        <View style={styles.readinessStrip}>
          <Row>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
              Streak: {proofStreak > 0 ? `${proofStreak}d` : "0d"}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
              Weekly: {weeklyCompleted}/{weeklyTotal}
            </Text>
            <Text style={{ fontSize: 15, fontWeight: "600", color: colors.text }}>
              Review: {dueReviewCards.length}
            </Text>
          </Row>
          <Link href="/readiness" asChild>
            <ButtonShell accessibilityHint="Opens the score breakdown screen." size="compact" tone="teal" variant="secondary">
              {readiness.score}% ready — see breakdown
            </ButtonShell>
          </Link>
        </View>
      </Panel>

      {nextOnPathNodes.length > 0 ? (
        <Panel accessibilityLabel="Next on Path Roadmap">
          <SectionTitle>Next on path: {activeTrack?.title}</SectionTitle>
          <View style={styles.nodeListContainer}>
            {nextOnPathNodes.map((node, index) => {
              const isLast = index === nextOnPathNodes.length - 1;
              const isCompleted = node.status === "completed";
              const isCurrent = node.status === "current";
              const isLocked = node.status === "locked" || node.status === "upcoming";

              return (
                <View key={node.id} style={styles.timelineNode}>
                  {!isLast ? <View style={styles.lineConnector} /> : null}
                  <View style={[
                    styles.circleNode,
                    isCompleted ? styles.circleCompleted : isCurrent ? styles.circleCurrent : styles.circleLocked
                  ]}>
                    {isCompleted ? <Text style={styles.circleText}>✓</Text> : null}
                  </View>
                  <View style={styles.nodeContent}>
                    <Row>
                      <Badge tone={isCompleted ? "green" : isCurrent ? "blue" : "ink"}>
                        {node.type}
                      </Badge>
                      {node.estimatedMinutes ? (
                        <Badge tone="teal">{node.estimatedMinutes} min</Badge>
                      ) : null}
                    </Row>
                    <Text style={[
                      styles.nodeTitle,
                      isCurrent ? styles.textCurrent : isLocked ? styles.textLocked : null
                    ]}>
                      {node.title}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
          <Link href="/path" asChild>
            <ButtonShell accessibilityHint="Opens the Learn tab to browse your full career roadmap." tone="blue" variant="secondary">
              Open full roadmap
            </ButtonShell>
          </Link>
        </Panel>
      ) : null}


    </Screen>
  );
}

interface TodayTaskProps {
  actionLabel: string;
  badge: string;
  detail: string;
  href: ComponentProps<typeof Link>["href"];
  title: string;
  tone: "blue" | "teal" | "amber" | "rose" | "green" | "ink";
}

function TodayTask({ actionLabel, badge, detail, href, title, tone }: TodayTaskProps): ReactElement {
  return (
    <View style={styles.todayTask}>
      <View style={styles.todayTaskCopy}>
        <Row>
          <Badge tone={tone}>{badge}</Badge>
        </Row>
        <SectionTitle>{title}</SectionTitle>
        <MutedText>{detail}</MutedText>
      </View>
      <Link href={href} asChild>
        <ButtonShell accessibilityHint={`Opens ${title}.`} size="compact" tone={tone}>{actionLabel}</ButtonShell>
      </Link>
    </View>
  );
}

function isoDay(value: string): string {
  return value.slice(0, 10);
}

function addDays(day: string, offset: number): string {
  const date = new Date(`${day}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

function getActiveDayStreak(progress: UserProgress, now = new Date().toISOString()): number {
  const activeDays = new Set([
    ...progress.codeRunAttempts.filter((attempt) => attempt.passed).map((attempt) => isoDay(attempt.createdAt)),
    ...progress.evidenceItems.map((item) => isoDay(item.createdAt)),
    ...progress.reviewEvents.map((event) => isoDay(event.reviewedAt))
  ]);
  const today = isoDay(now);
  let cursor = activeDays.has(today) ? today : addDays(today, -1);
  let streak = 0;

  while (activeDays.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  return streak;
}

const styles = StyleSheet.create({
  readinessStrip: {
    borderColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingTop: spacing.sm
  },
  todayTask: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  todayTaskCopy: {
    flex: 1,
    gap: spacing.xs
  },
  nodeListContainer: {
    gap: spacing.xs,
    marginVertical: spacing.sm
  },
  timelineNode: {
    flexDirection: "row",
    minHeight: 56,
    position: "relative"
  },
  lineConnector: {
    width: 2,
    backgroundColor: colors.border,
    position: "absolute",
    left: 11,
    top: 24,
    bottom: -8,
    zIndex: 1
  },
  circleNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    backgroundColor: colors.surface
  },
  circleCompleted: {
    borderColor: semanticColors.success,
    backgroundColor: semanticColors.success
  },
  circleCurrent: {
    borderColor: colors.blue,
    backgroundColor: colors.surface
  },
  circleLocked: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted
  },
  circleText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "bold",
    lineHeight: 14
  },
  nodeContent: {
    flex: 1,
    marginLeft: 16,
    gap: spacing.xs,
    paddingBottom: spacing.sm
  },
  nodeTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600"
  },
  textCurrent: {
    color: colors.blue
  },
  textLocked: {
    color: colors.muted
  }
});
