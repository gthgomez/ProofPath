import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ConceptCapsule as ConceptCapsuleType } from "@/domain/types";
import { Badge, BodyText, MutedText, SubPanel, SectionTitle } from "./primitives";
import { colors, radius, spacing } from "./theme";

interface ConceptCapsuleProps {
  capsules: ConceptCapsuleType[];
}

export function ConceptCapsuleList({ capsules }: ConceptCapsuleProps): ReactElement {
  return (
    <View style={styles.container}>
      {capsules.map((capsule) => (
        <SubPanel key={capsule.conceptId} style={styles.capsuleCard}>
          <View style={styles.headerRow}>
            <SectionTitle style={styles.title}>{capsule.definition}</SectionTitle>
            <Badge tone="teal">Concept</Badge>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.label}>Mental Model</Text>
            <BodyText>{capsule.mentalModel}</BodyText>
          </View>

          {capsule.syntaxShape ? (
            <View style={styles.section}>
              <Text style={styles.label}>Syntax Shape</Text>
              <Text style={styles.codeFragment}>{capsule.syntaxShape}</Text>
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.label}>Tiny Example</Text>
            <Text style={styles.codeBlock}>{capsule.tinyExample}</Text>
          </View>

          <View style={[styles.section, styles.mistakeSection]}>
            <Text style={[styles.label, { color: colors.rose }]}>Common Mistake</Text>
            <MutedText style={styles.mistakeText}>• {capsule.commonMistake}</MutedText>
            <MutedText style={styles.repairText}>💡 Repair: {capsule.repairHint}</MutedText>
          </View>
        </SubPanel>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    marginVertical: spacing.xs
  },
  capsuleCard: {
    padding: spacing.md,
    gap: spacing.sm,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.sm
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: colors.text
  },
  section: {
    gap: 4
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.muted,
    letterSpacing: 0.5
  },
  codeFragment: {
    fontFamily: "System",
    fontSize: 14,
    fontWeight: "bold",
    color: colors.ink,
    backgroundColor: colors.border,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: "flex-start"
  },
  codeBlock: {
    fontFamily: "System",
    fontSize: 13,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginVertical: 2
  },
  mistakeSection: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.xs
  },
  mistakeText: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 2
  },
  repairText: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: "600"
  }
});
