import { Link, Redirect } from "expo-router";
import type { ReactElement } from "react";
import { contentPack } from "@/content/seed";
import { findMission, findLesson } from "@/domain/content";
import { isWeeklyTaskComplete } from "@/domain/progress";
import { getContentForRole } from "@/domain/role-routing";
import { Badge, BodyText, ButtonShell, MutedText, Panel, ProgressBar, Row, Screen, SectionTitle } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { useProgress } from "@/state/progress-provider";

export default function WeeklyPlanScreen(): ReactElement {
  const { generateWeeklyCareerReport, isSaving, progress, roleTarget } = useProgress();
  const { isCheckingOnboarding, needsOnboarding } = useOnboardingGate();
  const roleContent = getContentForRole(contentPack, roleTarget.id);
  const roleReports = progress.weeklyReports.filter((report) => report.roleTargetId === roleTarget.id);
  const completedTaskCount = roleContent.weeklyPlan.tasks.filter((task) => isWeeklyTaskComplete(task, progress)).length;
  const weeklyProgress = roleContent.weeklyPlan.tasks.length === 0 ? 0 : Math.round((completedTaskCount / roleContent.weeklyPlan.tasks.length) * 100);

  if (isCheckingOnboarding) {
    return (
      <Screen eyebrow="Path setup" title="Loading weekly plan">
        <Panel accessibilityLabel="Loading weekly plan" accessibilityState={{ busy: true }}>
          <SectionTitle>Reading local profile</SectionTitle>
          <MutedText>Checking SQLite before routing the weekly plan.</MutedText>
        </Panel>
      </Screen>
    );
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen eyebrow={roleTarget.title} title={roleContent.weeklyPlan.headline}>
      <Panel>
        <Row>
          <Badge tone="blue">{roleReports.length} reports</Badge>
          <Badge tone="green">{completedTaskCount}/{roleContent.weeklyPlan.tasks.length} tracked</Badge>
          {isSaving ? <Badge tone="amber">saving</Badge> : null}
        </Row>
        <SectionTitle>Weekly career report</SectionTitle>
        <BodyText>Generate a snapshot from completed lessons, missions, evidence, and recall reviews. Weekly tasks complete only when their linked work is actually done.</BodyText>
        <ProgressBar label="Weekly tracked progress" tone="rose" value={weeklyProgress} />
        <ButtonShell
          accessibilityHint="Creates or refreshes this week's career report from local progress."
          disabled={isSaving}
          onPress={generateWeeklyCareerReport}
          tone="teal"
        >
          Generate report
        </ButtonShell>
      </Panel>

      {roleReports.length === 0 ? (
        <Panel>
          <SectionTitle>No reports yet</SectionTitle>
          <MutedText>Generate a weekly report after completing lessons, reviews, missions, or evidence work.</MutedText>
        </Panel>
      ) : null}

      {roleReports.map((report) => (
        <Panel key={report.id}>
          <Row>
            <Badge tone="teal">{report.readinessScore}% ready</Badge>
            <Badge tone="green">{report.passingEvidenceCount} evidence</Badge>
            <MutedText>{report.weekStart}</MutedText>
          </Row>
          <SectionTitle>{report.summary}</SectionTitle>
          {report.portfolioSummary ? <BodyText>{report.portfolioSummary}</BodyText> : null}
          {report.wins.map((win) => <MutedText key={win}>Win: {win}</MutedText>)}
          {report.risks.map((risk) => <MutedText key={risk}>Risk: {risk}</MutedText>)}
          {report.portfolioBullets?.map((bullet) => <MutedText key={bullet}>Portfolio: {bullet}</MutedText>)}
          {report.projectGaps?.map((gap) => <MutedText key={gap}>Gap: {gap}</MutedText>)}
          {report.nextActions.map((action) => <BodyText key={action}>{action}</BodyText>)}
          {report.portfolioMarkdown ? (
            <>
              <SectionTitle>Markdown export</SectionTitle>
              <MutedText>{report.portfolioMarkdown}</MutedText>
            </>
          ) : null}
        </Panel>
      ))}

      {roleContent.weeklyPlan.tasks.map((task) => {
        const complete = isWeeklyTaskComplete(task, progress);
        const linkedLesson = task.linkedLessonId ? findLesson(contentPack, task.linkedLessonId) : undefined;
        const linkedMission = task.linkedProjectMissionId ? findMission(contentPack, task.linkedProjectMissionId) : undefined;
        const href = linkedLesson
          ? { pathname: "/lesson/[lessonId]" as const, params: { lessonId: linkedLesson.id } }
          : linkedMission
            ? { pathname: "/mission/[missionId]" as const, params: { missionId: linkedMission.id } }
            : "/review";

        return (
          <Panel key={task.id}>
            <Row>
              <Badge tone="rose">{task.minutes} min</Badge>
              <Badge tone={complete ? "green" : "ink"}>{complete ? "tracked complete" : "Not earned yet"}</Badge>
              <MutedText>{roleContent.weeklyPlan.weekStart}</MutedText>
            </Row>
            <SectionTitle>{task.title}</SectionTitle>
            <BodyText>{task.detail}</BodyText>
            <MutedText>
              {complete
                ? "This task completed automatically from linked work."
                : "No manual checkbox. Open the linked activity and complete its required check."}
            </MutedText>
            <Link href={href} asChild>
              <ButtonShell
                accessibilityHint={complete ? "Reviews the linked completed activity." : "Opens the linked activity required for this weekly task."}
                tone={complete ? "ink" : "rose"}
                variant={complete ? "secondary" : "primary"}
              >
                {complete ? "Review linked work" : "Open required activity"}
              </ButtonShell>
            </Link>
          </Panel>
        );
      })}
    </Screen>
  );
}
