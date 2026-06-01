import { Link, Redirect } from "expo-router";
import type { ReactElement } from "react";
import { contentPack } from "@/content/seed";
import { getMissionsForRole } from "@/domain/role-routing";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { useProgress } from "@/state/progress-provider";

export default function ProjectMissionsScreen(): ReactElement {
  const { progress, roleTarget } = useProgress();
  const { isCheckingOnboarding, needsOnboarding } = useOnboardingGate();
  const missions = getMissionsForRole(contentPack, roleTarget.id);

  if (isCheckingOnboarding) {
    return (
      <Screen eyebrow="Path setup" title="Loading missions">
        <Panel accessibilityLabel="Loading mission board" accessibilityState={{ busy: true }}>
          <SectionTitle>Reading local profile</SectionTitle>
          <MutedText>Checking SQLite before routing the mission board.</MutedText>
        </Panel>
      </Screen>
    );
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen eyebrow={roleTarget.title} title="Build">
      <Panel>
        <SectionTitle>Build missions</SectionTitle>
        <BodyText>{roleTarget.summary}</BodyText>
      </Panel>

      {missions.length === 0 ? (
        <Panel>
          <SectionTitle>No missions for this path</SectionTitle>
          <MutedText>Choose another career path or add a mission to this track before collecting project evidence.</MutedText>
        </Panel>
      ) : null}

      {missions.map((mission) => {
        const missionDone = progress.completedProjectMissionIds.includes(mission.id);

        return (
          <Panel key={mission.id}>
            <Row>
              <Badge tone={mission.difficulty === "foundation" ? "blue" : "amber"}>{mission.difficulty}</Badge>
              <Badge tone="green">{mission.deliverables.length} deliverables</Badge>
              <Badge tone="teal">{mission.phases.length} phases</Badge>
              {missionDone ? <Badge tone="green">complete</Badge> : null}
            </Row>
            <SectionTitle>{mission.title}</SectionTitle>
            <BodyText>{mission.brief}</BodyText>
            <MutedText>{mission.acceptanceCriteria[0]}</MutedText>
            <MutedText>{mission.verificationCommands[0]}</MutedText>
            <Link href={{ pathname: "/mission/[missionId]", params: { missionId: mission.id } }} asChild>
              <ButtonShell accessibilityHint={`Opens ${mission.title}.`} tone="amber">Open mission</ButtonShell>
            </Link>
          </Panel>
        );
      })}
    </Screen>
  );
}
