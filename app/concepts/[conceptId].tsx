import { Link, useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { conceptRegistry } from "@/content/concepts";
import { contentPack } from "@/content/seed";
import { buildConceptIndex, conceptCategoryLabels, type ConceptIndexEntry } from "@/domain/reference";
import { ConceptCapsuleList } from "@/ui/concept-capsule";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle, SubPanel } from "@/ui/primitives";
import { colors, spacing } from "@/ui/theme";

const conceptIndex = buildConceptIndex(contentPack, conceptRegistry);

export default function ConceptDetailScreen(): ReactElement {
  const { conceptId } = useLocalSearchParams<{ conceptId: string }>();
  const conceptIdValue = typeof conceptId === "string" ? conceptId : "";
  const entry = conceptIndex.find((candidate) => candidate.concept.id === conceptIdValue);

  if (!entry) {
    return (
      <Screen backHref="/concepts" backLabel="Concepts" eyebrow="Reference" title="Concept not found">
        <Panel accessibilityLabel="Unknown concept">
          <MutedText>
            {`No registered concept matches "${conceptIdValue}". Browse the concept index instead.`}
          </MutedText>
          <Link href="/concepts" asChild>
            <ButtonShell accessibilityHint="Opens the browsable concept index." tone="blue" variant="secondary">
              Browse concepts
            </ButtonShell>
          </Link>
        </Panel>
      </Screen>
    );
  }

  return (
    <ConceptDetail entry={entry} />
  );
}

function ConceptDetail({ entry }: { entry: ConceptIndexEntry }): ReactElement {
  const concept = entry.concept;
  const parent = concept.parentId
    ? conceptIndex.find((candidate) => candidate.concept.id === concept.parentId)
    : undefined;
  const otherLocations = entry.introducingLesson
    ? entry.teachingLocations.filter((location) => location.lessonId !== entry.introducingLesson?.lessonId)
    : [];

  return (
    <Screen backHref="/concepts" backLabel="Concepts" eyebrow={`Reference · ${conceptCategoryLabels[concept.category]}`} title={concept.label}>
      <Panel accessibilityLabel={`${concept.label} reference entry`}>
        <Row>
          <Badge tone="blue">{conceptCategoryLabels[concept.category]}</Badge>
          {entry.isSupportingOnly
            ? <Badge tone="ink">supporting</Badge>
            : <Badge tone="teal">level {entry.introducingLesson?.level ?? "?"}</Badge>}
        </Row>
        <BodyText>{concept.description}</BodyText>
        {concept.aliases?.length ? (
          <MutedText>{`Also known as: ${concept.aliases.join(", ")}`}</MutedText>
        ) : null}
        {parent ? (
          <View style={styles.buildsOn}>
            <MutedText>Builds on</MutedText>
            <Link
              href={{ pathname: "/concepts/[conceptId]", params: { conceptId: parent.concept.id } }}
              asChild
            >
              <ButtonShell
                accessibilityHint={`Opens the reference entry for ${parent.concept.label}.`}
                size="compact"
                tone="ink"
                variant="secondary"
              >
                {parent.concept.label}
              </ButtonShell>
            </Link>
          </View>
        ) : null}
      </Panel>

      {entry.capsule ? (
        <Panel accessibilityLabel="Reference card">
          <SectionTitle>Reference card</SectionTitle>
          <ConceptCapsuleList capsules={[entry.capsule]} />
        </Panel>
      ) : null}

      {entry.introducingLesson ? (
        <Panel accessibilityLabel="Lessons teaching this concept">
          <SectionTitle>Learn this concept</SectionTitle>
          <BodyText>{`First taught in ${entry.introducingLesson.moduleTitle}:`}</BodyText>
          <Link
            href={{ pathname: "/lesson/[lessonId]", params: { lessonId: entry.introducingLesson.lessonId } }}
            asChild
          >
            <ButtonShell
              accessibilityHint={`Opens the lesson ${entry.introducingLesson.lessonTitle}.`}
              tone="blue"
            >
              {entry.introducingLesson.lessonTitle}
            </ButtonShell>
          </Link>
          {otherLocations.length > 0 ? (
            <View style={styles.alsoIn}>
              <MutedText>Also appears in</MutedText>
              {otherLocations.map((location) => (
                <Link
                  key={location.lessonId}
                  href={{ pathname: "/lesson/[lessonId]", params: { lessonId: location.lessonId } }}
                  asChild
                >
                  <ButtonShell
                    accessibilityHint={`Opens the lesson ${location.lessonTitle}.`}
                    size="compact"
                    tone="ink"
                    variant="secondary"
                  >
                    {location.lessonTitle}
                  </ButtonShell>
                </Link>
              ))}
            </View>
          ) : null}
        </Panel>
      ) : (
        <SubPanel accessibilityLabel="Supporting concept note">
          <SectionTitle>Supporting concept</SectionTitle>
          <MutedText>
            This concept is part of the ProofPath registry and is referenced by the curriculum,
            but no dedicated lesson teaches it yet.
          </MutedText>
        </SubPanel>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  buildsOn: {
    gap: spacing.xs,
    marginTop: spacing.xs
  },
  alsoIn: {
    gap: spacing.xs,
    marginTop: spacing.xs
  }
});
