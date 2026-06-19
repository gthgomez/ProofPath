import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { CodeLabBridge as CodeLabBridgeType } from "@/domain/types";
import { Badge, BodyText, MutedText, SubPanel, SectionTitle } from "./primitives";
import { colors, radius, spacing } from "./theme";

interface CodeLabBridgeProps {
  bridge: CodeLabBridgeType;
}

export function CodeLabBridge({ bridge }: CodeLabBridgeProps): ReactElement {
  return (
    <SubPanel style={styles.card}>
      <View style={styles.headerRow}>
        <SectionTitle style={styles.title}>Code Lab Bridge</SectionTitle>
        <Badge tone="blue">Context</Badge>
      </View>

      <BodyText style={styles.story}>{bridge.story}</BodyText>

      <View style={styles.conceptsRow}>
        <MutedText style={styles.label}>Using Concepts:</MutedText>
        <View style={styles.badgeContainer}>
          {bridge.usesConcepts.map((c) => (
            <Badge key={c} tone="teal">{c}</Badge>
          ))}
        </View>
      </View>

      <View style={styles.splitSection}>
        <View style={styles.splitCol}>
          <Text style={[styles.colLabel, { color: colors.blue }]}>You Own</Text>
          {bridge.learnerOwns.map((item) => (
            <MutedText key={item} style={styles.colItem}>• {item}</MutedText>
          ))}
        </View>

        <View style={styles.splitCol}>
          <Text style={[styles.colLabel, { color: colors.ink }]}>Verifier Owns</Text>
          {bridge.checkerOwns.map((item) => (
            <MutedText key={item} style={styles.colItem}>• {item}</MutedText>
          ))}
          {(bridge.verifierOnlyConcepts ?? []).map((c) => (
            <Badge key={c} tone="ink">{c}</Badge>
          ))}
        </View>
      </View>

      <View style={styles.expectationSection}>
        <Text style={styles.expectationLabel}>Run Expectation</Text>
        <BodyText style={styles.expectationText}>🚀 {bridge.runExpectation}</BodyText>
      </View>
    </SubPanel>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    gap: spacing.sm,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    marginVertical: spacing.xs
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text
  },
  story: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20
  },
  conceptsRow: {
    gap: 4,
    marginVertical: 2
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.muted
  },
  badgeContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4
  },
  splitSection: {
    flexDirection: "row",
    gap: spacing.md,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.xs
  },
  splitCol: {
    flex: 1,
    gap: 4
  },
  colLabel: {
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 2
  },
  colItem: {
    fontSize: 13,
    color: colors.text
  },
  expectationSection: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingTop: spacing.sm,
    marginTop: spacing.xs,
    gap: 2
  },
  expectationLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.muted
  },
  expectationText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600"
  }
});
