import { Redirect } from "expo-router";
import type { ReactElement } from "react";
import { contentPack } from "@/content/seed";
import { getContentForRole } from "@/domain/role-routing";
import { getReviewCards } from "@/domain/review-queue";
import type { ReviewRating } from "@/domain/types";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { useProgress } from "@/state/progress-provider";

const reviewRatings: Array<{ rating: ReviewRating; label: string }> = [
  { rating: "again", label: "Again" },
  { rating: "hard", label: "Hard" },
  { rating: "good", label: "Good" },
  { rating: "easy", label: "Easy" }
];

export default function ReviewQueueScreen(): ReactElement {
  const { isSaving, progress, recordRecallReview, roleTarget } = useProgress();
  const { isCheckingOnboarding, needsOnboarding } = useOnboardingGate();
  const roleContent = getContentForRole(contentPack, roleTarget.id);
  const cards = getReviewCards(roleContent, progress);
  const dueCards = cards.filter((card) => card.isDue);
  const upcomingCards = cards.filter((card) => !card.isDue).slice(0, 5);

  if (isCheckingOnboarding) {
    return (
      <Screen eyebrow="Path setup" title="Loading reviews">
        <Panel accessibilityLabel="Loading review queue" accessibilityState={{ busy: true }}>
          <SectionTitle>Reading local profile</SectionTitle>
          <MutedText>Checking SQLite before building the review queue.</MutedText>
        </Panel>
      </Screen>
    );
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen eyebrow={roleTarget.title} title="Review queue">
      <Panel>
        <Row>
          <Badge tone="teal">{dueCards.length} due</Badge>
          <Badge tone="blue">{cards.length} scheduled</Badge>
          {isSaving ? <Badge tone="amber">saving</Badge> : null}
        </Row>
        <BodyText>Recall first, then rate how much effort it took.</BodyText>
      </Panel>

      {cards.length === 0 ? (
        <Panel>
          <SectionTitle>No reviews scheduled</SectionTitle>
          <MutedText>Complete a lesson, checkpoint, or mission to schedule recall work.</MutedText>
        </Panel>
      ) : null}

      {cards.length > 0 && dueCards.length === 0 ? (
        <Panel>
          <SectionTitle>Nothing due yet</SectionTitle>
          <MutedText>Your scheduled reviews are waiting in Upcoming.</MutedText>
        </Panel>
      ) : null}

      {dueCards.map((card) => (
        <Panel key={`${card.item.targetType}:${card.item.targetId}`}>
          <Row>
            <Badge tone="green">due</Badge>
            <Badge tone="rose">{card.subtitle}</Badge>
            <MutedText>{new Date(card.item.dueAt).toLocaleDateString()}</MutedText>
          </Row>
          <SectionTitle>{card.title}</SectionTitle>
          <BodyText>{card.recallPrompt}</BodyText>
          {card.answerHint ? <MutedText>After recall, compare against: {card.answerHint}</MutedText> : null}
          <MutedText>{card.repairPrompt}</MutedText>
          <Row>
          {reviewRatings.map(({ rating, label }) => (
              <ButtonShell
                accessibilityHint={`Records this recall as ${label.toLowerCase()} and schedules the next review.`}
                accessibilityLabel={`Rate recall ${label}`}
                disabled={isSaving}
                key={rating}
                onPress={() => recordRecallReview(card.item.targetType, card.item.targetId, rating)}
                tone={rating === "again" ? "rose" : rating === "hard" ? "amber" : rating === "easy" ? "green" : "teal"}
              >
                {label}
              </ButtonShell>
            ))}
          </Row>
        </Panel>
      ))}

      {upcomingCards.length > 0 ? (
        <Panel>
          <SectionTitle>Upcoming</SectionTitle>
          {upcomingCards.map((card) => (
            <MutedText key={`${card.item.targetType}:${card.item.targetId}`}>
              {card.title} - {new Date(card.item.dueAt).toLocaleDateString()}
            </MutedText>
          ))}
        </Panel>
      ) : null}
    </Screen>
  );
}
