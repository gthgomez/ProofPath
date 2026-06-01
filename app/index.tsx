import { Link, Redirect } from "expo-router";
import type { ComponentProps, ReactElement } from "react";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { contentPack } from "@/content/seed";
import { getReviewCards, type ReviewCard } from "@/domain/review-queue";
import type { UserProgress } from "@/domain/types";
import { getContentForRole } from "@/domain/role-routing";
import { getNextLessonForRole, getNextMissionForRole } from "@/domain/role-routing";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { colors, radius, spacing } from "@/ui/theme";
import { useProgress } from "@/state/progress-provider";

export default function DashboardScreen(): ReactElement {
  const [showBrowseAreas, setShowBrowseAreas] = useState(false);
  const { error, isSaving, progress, readiness, roleTarget } = useProgress();
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

      <Panel accessibilityLabel="Today dashboard">
        <Row>
          <Badge tone="rose">{roleTarget.title}</Badge>
          <Badge tone="teal">{readiness.label}</Badge>
          <Badge tone="blue">{readiness.score}% ready</Badge>
          {isSaving ? <Badge tone="amber">saving</Badge> : null}
        </Row>
        <SectionTitle>Today's 3-step plan</SectionTitle>
        <BodyText>CareerForge turns practice into work you can explain. Start with Learn, Build, and Portfolio; use Browse all areas when you need the full map.</BodyText>

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
          <MutedText>{readiness.nextAction}</MutedText>
          <View style={styles.metricsGrid}>
            <MetricTile label="days with portfolio work" value={proofStreak > 0 ? `${proofStreak}` : "0"} />
            <MetricTile label="weekly tasks done" value={`${weeklyCompleted}/${weeklyTotal}`} />
            <MetricTile label="recalls due" value={`${dueReviewCards.length}`} />
          </View>
          <Link href="/readiness" asChild>
            <ButtonShell accessibilityHint="Opens the score breakdown screen." size="compact" tone="teal" variant="secondary">
              {readiness.score}% ready — see breakdown
            </ButtonShell>
          </Link>
        </View>
      </Panel>

      <Panel accessibilityLabel="Browse all areas">
        <SectionTitle>Browse all areas</SectionTitle>
        <BodyText>The Today plan is the main path. Expand below to jump to lessons, missions, portfolio, or settings.</BodyText>
        <ButtonShell
          accessibilityHint={showBrowseAreas ? "Hides Learn, Build, Portfolio, and Settings shortcuts." : "Shows shortcuts to Learn, Build, Portfolio, and Settings."}
          accessibilityState={{ expanded: showBrowseAreas }}
          onPress={() => setShowBrowseAreas((current) => !current)}
          tone="ink"
          variant="secondary"
        >
          {showBrowseAreas ? "Hide areas" : "Show Learn, Build, Portfolio, Settings"}
        </ButtonShell>
        {showBrowseAreas ? (
          <>
            <RouteCard
              actionLabel="Browse"
              detail="See every lesson and module for this career path."
              href="/path"
              label="Learn"
              tone="blue"
            />
            <RouteCard
              actionLabel="Open"
              detail="Portfolio missions that turn lessons into interview-ready work."
              href="/projects"
              label="Build"
              tone="amber"
            />
            <RouteCard
              actionLabel="Open"
              detail="Saved repo links, check output, screenshots, notes, and reflections."
              href="/evidence"
              label="Portfolio"
              tone="green"
            />
            <RouteCard
              actionLabel="Change"
              detail="Change your career path or reset local progress."
              href="/settings"
              label="Settings"
              tone="ink"
            />
          </>
        ) : null}
      </Panel>
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

function RouteCard({
  actionLabel,
  detail,
  href,
  label,
  tone
}: {
  actionLabel: string;
  detail: string;
  href: ComponentProps<typeof Link>["href"];
  label: string;
  tone: "blue" | "teal" | "amber" | "rose" | "green" | "ink";
}): ReactElement {
  return (
    <View style={styles.routeCard}>
      <View style={styles.routeCopy}>
        <Row>
          <Badge tone={tone}>{label}</Badge>
        </Row>
        <MutedText>{detail}</MutedText>
      </View>
      <Link href={href} asChild>
        <ButtonShell accessibilityHint={`Opens ${label}.`} size="compact" tone={tone} variant="secondary">
          {actionLabel}
        </ButtonShell>
      </Link>
    </View>
  );
}

function MetricTile({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <View style={styles.metricTile}>
      <Text style={styles.metricValue}>{value}</Text>
      <MutedText>{label}</MutedText>
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
  routeCard: {
    alignItems: "center",
    borderColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.sm
  },
  routeCopy: {
    flex: 1,
    gap: spacing.xs
  },
  metricsGrid: {
    flexDirection: "row",
    gap: spacing.sm
  },
  metricTile: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    gap: spacing.xs,
    padding: spacing.sm
  },
  metricValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 25
  }
});
