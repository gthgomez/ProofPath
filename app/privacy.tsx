import type { ReactElement } from "react";
import { Link } from "expo-router";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle } from "@/ui/primitives";

export default function PrivacyScreen(): ReactElement {
  return (
    <Screen eyebrow="CareerForge Mobile" title="Privacy">
      <Panel>
        <Row>
          <Badge tone="green">offline</Badge>
          <Badge tone="blue">on this device</Badge>
        </Row>
        <SectionTitle>Local-only learning app</SectionTitle>
        <BodyText>
          CareerForge Mobile stores your career path, lesson progress, quiz attempts, portfolio evidence, and weekly plans on this device only.
        </BodyText>
      </Panel>

      <Panel>
        <SectionTitle>What we collect</SectionTitle>
        <BodyText>No account is required. The app does not create user profiles on a server or collect advertising identifiers.</BodyText>
        <MutedText>Progress is saved in a local SQLite database named careerforge.db.</MutedText>
      </Panel>

      <Panel>
        <SectionTitle>Network use</SectionTitle>
        <BodyText>Lesson Code Lab sandboxes run with allowNetwork set to false. User code cannot open outbound network connections from the sandbox.</BodyText>
        <MutedText>The app itself is designed for offline learning; it does not sync your progress to our servers.</MutedText>
      </Panel>

      <Panel>
        <SectionTitle>Delete your data</SectionTitle>
        <BodyText>
          Use Settings → Reset progress to permanently delete local profile, progress, reviews, evidence, and weekly reports on this device.
        </BodyText>
        <Link href="/settings" asChild>
          <ButtonShell accessibilityHint="Opens Settings where you can reset local progress." tone="rose" variant="secondary">
            Open Settings
          </ButtonShell>
        </Link>
      </Panel>

      <Panel>
        <SectionTitle>Full policy</SectionTitle>
        <MutedText>See PRIVACY.md in the repository for the complete privacy policy text used before Play Store release.</MutedText>
      </Panel>
    </Screen>
  );
}
