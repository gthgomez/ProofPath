import { Link, Redirect } from "expo-router";
import type { ReactElement } from "react";
import { View, Text } from "react-native";
import { contentPack } from "@/content/seed";
import { getMissionsForRole } from "@/domain/role-routing";
import { getMissionSupportedLessonIds, getMissionProofChecklist } from "@/domain/progress";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { useProgress } from "@/state/progress-provider";
import { colors, spacing } from "@/ui/theme";

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
        const linkedEvidenceCount = progress.evidenceItems.filter(
          (item) => item.linkedProjectMissionId === mission.id
        ).length;

        // Derive status
        let status: "complete" | "in-progress" | "needs-evidence" | "ready" = "ready";
        if (missionDone) {
          status = "complete";
        } else if (linkedEvidenceCount > 0) {
          status = "in-progress";
        } else {
          const supportedLessonIds = getMissionSupportedLessonIds(mission, contentPack.lessons, contentPack);
          const preparationComplete = supportedLessonIds.length === 0
            || supportedLessonIds.every((lessonId) => progress.completedLessonIds.includes(lessonId));
          if (preparationComplete) {
            status = "needs-evidence";
          } else {
            status = "ready";
          }
        }

        const checklist = getMissionProofChecklist(progress, mission);

        let actionLabel = "Start mission";
        let buttonTone: "blue" | "amber" | "green" | "teal" = "blue";
        let statusBadgeTone: "blue" | "amber" | "green" | "teal" = "blue";

        if (status === "complete") {
          actionLabel = "Review";
          buttonTone = "green";
          statusBadgeTone = "green";
        } else if (status === "in-progress") {
          actionLabel = "Add evidence";
          buttonTone = "teal";
          statusBadgeTone = "teal";
        } else if (status === "needs-evidence") {
          actionLabel = "Save proof";
          buttonTone = "amber";
          statusBadgeTone = "amber";
        }

        return (
          <Panel key={mission.id}>
            <Row>
              <Badge tone={mission.difficulty === "foundation" ? "blue" : "amber"}>{mission.difficulty}</Badge>
              <Badge tone="green">{mission.deliverables.length} deliverables</Badge>
              <Badge tone="teal">{mission.phases.length} phases</Badge>
              <Badge tone={statusBadgeTone}>{status.replace("-", " ")}</Badge>
            </Row>
            <SectionTitle>{mission.title}</SectionTitle>
            <BodyText>{mission.brief}</BodyText>
            <MutedText style={{ marginBottom: spacing.xs }}>{mission.acceptanceCriteria[0]}</MutedText>
            <MutedText style={{ marginBottom: spacing.xs }}>{mission.verificationCommands[0]}</MutedText>

            {checklist.length > 0 ? (
              <View style={{ marginVertical: spacing.xs }}>
                <MutedText style={{ fontSize: 13, fontWeight: "600", marginBottom: spacing.xs }}>
                  Evidence Checklist:
                </MutedText>
                <Row style={{ flexWrap: "wrap", gap: spacing.xs }}>
                  {checklist.map((item) => (
                    <Row key={item.id} style={{ alignItems: "center", marginRight: spacing.sm, marginBottom: 2 }}>
                      <Text style={{ fontSize: 13, color: item.complete ? colors.green : colors.rose, marginRight: 4 }}>
                        {item.complete ? "✓" : "✗"}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.muted }}>
                        {item.label}
                      </Text>
                    </Row>
                  ))}
                </Row>
              </View>
            ) : null}

            <Link href={{ pathname: "/evidence", params: { missionId: mission.id } }} asChild>
              <ButtonShell accessibilityHint={`Opens evidence form for ${mission.title}.`} tone={buttonTone}>
                {actionLabel}
              </ButtonShell>
            </Link>
          </Panel>
        );
      })}
    </Screen>
  );
}
