import { Link } from "expo-router";
import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { conceptRegistry } from "@/content/concepts";
import { contentPack } from "@/content/seed";
import {
  buildConceptIndex,
  groupConceptsByCategory,
  type ConceptCategoryGroup,
  type ConceptIndexEntry
} from "@/domain/reference";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle } from "@/ui/primitives";
import { colors, radius, spacing } from "@/ui/theme";

const conceptIndex = buildConceptIndex(contentPack, conceptRegistry);
const categoryGroups = groupConceptsByCategory(conceptIndex);
const taughtCount = conceptIndex.filter((entry) => !entry.isSupportingOnly).length;

export default function ConceptsScreen(): ReactElement {
  return (
    <Screen eyebrow="Reference" title="Concepts">
      <Panel accessibilityLabel="Concepts reference introduction">
        <Row>
          <Badge tone="blue">{conceptRegistry.length} concepts</Badge>
          <Badge tone="teal">{taughtCount} taught in lessons</Badge>
        </Row>
        <BodyText>
          Every concept ProofPath tracks, grouped by area. Open one for the mental model, syntax shape,
          and a tiny example — then jump to the lesson that teaches it.
        </BodyText>
      </Panel>

      {categoryGroups.map((group) => (
        <CategoryPanel key={group.category} group={group} />
      ))}
    </Screen>
  );
}

function CategoryPanel({ group }: { group: ConceptCategoryGroup }): ReactElement {
  return (
    <Panel accessibilityLabel={`${group.label} concepts`}>
      <Row>
        <SectionTitle>{group.label}</SectionTitle>
        <Badge tone="ink">{group.entries.length}</Badge>
      </Row>
      <View style={styles.conceptList}>
        {group.entries.map((entry) => (
          <ConceptRow key={entry.concept.id} entry={entry} />
        ))}
      </View>
    </Panel>
  );
}

function ConceptRow({ entry }: { entry: ConceptIndexEntry }): ReactElement {
  const levelBadge = entry.isSupportingOnly
    ? <Badge tone="ink">supporting</Badge>
    : <Badge tone="teal">level {entry.introducingLesson?.level ?? "?"}</Badge>;

  return (
    <View style={styles.conceptRow}>
      <View style={styles.conceptCopy}>
        <Text style={styles.conceptTitle}>{entry.concept.label}</Text>
        <MutedText>{entry.concept.description}</MutedText>
        <Row>{levelBadge}</Row>
      </View>
      {entry.isSupportingOnly ? (
        <MutedText style={styles.supportingNote}>No lesson yet</MutedText>
      ) : (
        <Link
          href={{ pathname: "/concepts/[conceptId]", params: { conceptId: entry.concept.id } }}
          asChild
        >
          <ButtonShell
            accessibilityHint={`Opens the reference entry for ${entry.concept.label}.`}
            size="compact"
            tone="blue"
            variant="secondary"
          >
            Open
          </ButtonShell>
        </Link>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  conceptList: {
    gap: spacing.xs
  },
  conceptRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  conceptCopy: {
    flex: 1,
    gap: spacing.xs
  },
  conceptTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 20
  },
  supportingNote: {
    flexShrink: 1
  }
});
