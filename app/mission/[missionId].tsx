import { Link, Redirect, useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { contentPack } from "@/content/seed";
import { findMission } from "@/domain/content";
import { getLessonsForRole } from "@/domain/role-routing";
import { getMissionProofChecklist, getMissionSupportedLessonIds } from "@/domain/progress";
import { Badge, BodyText, ButtonShell, MutedText, Panel, ProgressBar, Row, Screen, SectionTitle, SubPanel } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { useProgress } from "@/state/progress-provider";

export default function MissionDetailScreen(): ReactElement {
  const { missionId } = useLocalSearchParams<{ missionId: string }>();
  const mission = findMission(contentPack, missionId);
  const { isCheckingOnboarding, needsOnboarding } = useOnboardingGate();
  const { isSaving, progress, roleTarget } = useProgress();

  if (isCheckingOnboarding) {
    return (
      <Screen eyebrow="Path setup" title="Loading mission">
        <Panel accessibilityLabel="Loading mission" accessibilityState={{ busy: true }}>
          <SectionTitle>Reading local profile</SectionTitle>
          <MutedText>Checking SQLite before opening the mission.</MutedText>
        </Panel>
      </Screen>
    );
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (!mission) {
    return (
      <Screen eyebrow="Mission" title="Mission not found">
        <Panel>
          <BodyText>The requested mission is not in the local content pack.</BodyText>
        </Panel>
      </Screen>
    );
  }

  const missionDone = progress.completedProjectMissionIds.includes(mission.id);
  const linkedEvidence = progress.evidenceItems.filter((item) => item.linkedProjectMissionId === mission.id);
  const hasVerifierEvidence = linkedEvidence.some((item) => item.testStatus === "passing" && Boolean(item.verifierOutput));
  const proofChecklist = getMissionProofChecklist(progress, mission);
  const completedProofCount = proofChecklist.filter((item) => item.complete).length;
  const relatedLessons = getLessonsForRole(contentPack, roleTarget.id)
    .filter((lesson) => lesson.skillIds.some((skillId) => mission.skillIds.includes(skillId)))
    .slice(0, 3);
  const roleLessons = getLessonsForRole(contentPack, roleTarget.id);
  const supportedLessonIds = getMissionSupportedLessonIds(mission, roleLessons, contentPack);
  const completedSupportedLessonCount = supportedLessonIds.filter((lessonId) => progress.completedLessonIds.includes(lessonId)).length;
  const preparationProgress = supportedLessonIds.length === 0 ? 100 : Math.round((completedSupportedLessonCount / supportedLessonIds.length) * 100);
  const proofProgress = proofChecklist.length === 0 ? 100 : Math.round((completedProofCount / proofChecklist.length) * 100);
  const missionAwardProgress = missionDone ? 100 : Math.round((preparationProgress + proofProgress) / 2);

  return (
    <Screen eyebrow="Mission" title={mission.title}>
      <Panel>
        <Row>
          <Badge tone={mission.difficulty === "foundation" ? "blue" : "amber"}>{mission.difficulty}</Badge>
          <Badge tone="green">{mission.skillIds.length} skills</Badge>
          <Badge tone={missionDone ? "green" : hasVerifierEvidence ? "amber" : "rose"}>{missionDone ? "award captured" : "proof required"}</Badge>
        </Row>
        <BodyText>{mission.brief}</BodyText>
        <ProgressBar label="Mission award progress" tone="amber" value={missionAwardProgress} />
        <MutedText>
          {missionDone
            ? "Award captured from completed preparation and required evidence."
            : "No manual completion. This mission awards itself when the linked lesson preparation and proof checklist are complete."}
        </MutedText>
      </Panel>

      <Panel accessibilityLabel="Mission status summary">
        <SectionTitle>Tracked gates</SectionTitle>
        <ProgressBar label="Lesson preparation" value={preparationProgress} />
        <ProgressBar label="Evidence checklist" tone="green" value={proofProgress} />
        <BodyText>{missionDone ? "All mission gates are satisfied." : "Finish the incomplete gates below to earn this mission award."}</BodyText>
        <Link href={{ pathname: "/evidence", params: { missionId: mission.id } }} asChild>
          <ButtonShell accessibilityHint={`Opens evidence capture for ${mission.title}.`} disabled={isSaving} tone="green">Add evidence for this mission</ButtonShell>
        </Link>
      </Panel>

      <Panel>
        <SectionTitle>Mission workspace</SectionTitle>
        <BodyText>{mission.starterPrompt}</BodyText>
      </Panel>

      {mission.phases.map((phase) => (
        <Panel key={phase.id}>
          <Row>
            <Badge tone={missionDone ? "green" : "teal"}>{phase.title}</Badge>
            <Badge tone={missionDone ? "green" : "ink"}>{missionDone ? "awarded" : "tracked by activity"}</Badge>
          </Row>
          <BodyText>{phase.goal}</BodyText>
          {phase.tasks.map((task) => (
            <MutedText key={task}>{task}</MutedText>
          ))}
        </Panel>
      ))}

      <Panel>
        <SectionTitle>Deliverables</SectionTitle>
        <BodyText>Deliverables unlock as an award only after the required evidence proves the mission is real.</BodyText>
        {mission.deliverables.map((deliverable) => (
          <SubPanel key={deliverable}>
            <Row>
              <Badge tone={missionDone ? "green" : "rose"}>{missionDone ? "verified" : "Not earned yet"}</Badge>
            </Row>
            <BodyText>{deliverable}</BodyText>
          </SubPanel>
        ))}
      </Panel>

      <Panel>
        <SectionTitle>Acceptance criteria</SectionTitle>
        {mission.acceptanceCriteria.map((criterion) => (
          <MutedText key={criterion}>{criterion}</MutedText>
        ))}
      </Panel>

      <Panel>
        <SectionTitle>Verification recipe</SectionTitle>
        <MutedText>{linkedEvidence.length} linked evidence item{linkedEvidence.length === 1 ? "" : "s"}</MutedText>
        {mission.verificationCommands.map((command) => (
          <BodyText key={command}>{command}</BodyText>
        ))}
      </Panel>

      <Panel>
        <SectionTitle>Proof checklist</SectionTitle>
        {proofChecklist.map((requirement) => (
          <Row key={requirement.id}>
            <Badge tone={requirement.complete ? "green" : "rose"}>{requirement.complete ? "done" : "missing"}</Badge>
            <BodyText>{requirement.label}</BodyText>
          </Row>
        ))}
      </Panel>

      <Panel>
        <SectionTitle>Expected artifacts</SectionTitle>
        {mission.expectedArtifacts.map((artifact) => (
          <MutedText key={artifact}>{artifact}</MutedText>
        ))}
      </Panel>

      <Panel>
        <SectionTitle>Rubric</SectionTitle>
        {mission.rubric.map((item) => (
          <MutedText key={item}>{item}</MutedText>
        ))}
      </Panel>

      <Panel>
        <SectionTitle>Common failure modes</SectionTitle>
        {mission.commonFailureModes.map((failureMode) => (
          <MutedText key={failureMode}>{failureMode}</MutedText>
        ))}
      </Panel>

      <Panel>
        <SectionTitle>Portfolio summary prompt</SectionTitle>
        <BodyText>{mission.portfolioSummaryPrompt}</BodyText>
      </Panel>

      {relatedLessons.length > 0 ? (
        <Panel>
          <SectionTitle>Related lessons</SectionTitle>
          {relatedLessons.map((lesson) => (
            <Link key={lesson.id} href={{ pathname: "/lesson/[lessonId]", params: { lessonId: lesson.id } }} asChild>
              <ButtonShell accessibilityHint={`Opens ${lesson.title}.`} tone={progress.completedLessonIds.includes(lesson.id) ? "ink" : "blue"}>
                {progress.completedLessonIds.includes(lesson.id) ? `Review: ${lesson.title}` : lesson.title}
              </ButtonShell>
            </Link>
          ))}
        </Panel>
      ) : null}
    </Screen>
  );
}
