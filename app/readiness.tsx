import { Redirect } from "expo-router";
import type { ReactElement } from "react";
import { Badge, BodyText, MutedText, Panel, ProgressBar, Row, Screen, SectionTitle } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { useProgress } from "@/state/progress-provider";

export default function ReadinessScreen(): ReactElement {
  const { progress, readiness, roleTarget } = useProgress();
  const { isCheckingOnboarding, needsOnboarding } = useOnboardingGate();
  const rows = [
    ["Lesson completion", readiness.breakdown.lessonCompletion],
    ["Quiz performance", readiness.breakdown.quizPerformance],
    ["Project completion", readiness.breakdown.projectCompletion],
    ["Proof quality", readiness.breakdown.evidenceHygiene],
    ["Review cadence", readiness.breakdown.reviewCadence]
  ] as const;

  if (isCheckingOnboarding) {
    return (
      <Screen eyebrow="Path setup" title="Loading readiness">
        <Panel accessibilityLabel="Loading readiness" accessibilityState={{ busy: true }}>
          <SectionTitle>Reading local profile</SectionTitle>
          <MutedText>Checking SQLite before calculating role readiness.</MutedText>
        </Panel>
      </Screen>
    );
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen eyebrow={roleTarget.title} title="Career readiness">
      <Panel>
        <Row>
          <Badge tone="blue">{readiness.score}% {readiness.label}</Badge>
          <Badge tone="teal">Explainable</Badge>
          <Badge tone="green">Local first</Badge>
          <Badge tone="rose">{readiness.weakestArea}</Badge>
        </Row>
        <BodyText>
          The score is project-heavy: missions and evidence drive most of readiness, while lessons, checkpoints, and reviews support the proof.
        </BodyText>
        <ProgressBar label="Career readiness" value={readiness.score} />
      </Panel>

      <Panel>
        <SectionTitle>Next highest-leverage action</SectionTitle>
        <BodyText>{readiness.nextAction}</BodyText>
        <MutedText>{readiness.blockingProofRequirement}</MutedText>
      </Panel>

      <Panel>
        <SectionTitle>Why this score</SectionTitle>
        {readiness.explanation.map((line) => (
          <MutedText key={line}>{line}</MutedText>
        ))}
      </Panel>

      {rows.map(([label, value]) => (
        <Panel key={label}>
          <SectionTitle>{label}</SectionTitle>
          <ProgressBar label={label} value={value} />
          <MutedText>Updated {new Date(progress.updatedAt).toLocaleString()}</MutedText>
        </Panel>
      ))}
    </Screen>
  );
}
