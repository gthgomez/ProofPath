import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { GuidedEditStep as GuidedEditStepType } from "@/domain/types";
import { Badge, BodyText, MutedText, SubPanel, SectionTitle } from "./primitives";
import { colors, radius, spacing } from "./theme";

interface GuidedEditListProps {
  steps: GuidedEditStepType[];
}

export function GuidedEditList({ steps }: GuidedEditListProps): ReactElement {
  return (
    <View style={styles.container}>
      <SectionTitle style={styles.header}>Guided Edit Steps</SectionTitle>
      {steps.map((step, index) => (
        <SubPanel key={step.id} style={styles.stepCard}>
          <View style={styles.headerRow}>
            <Badge tone="blue">Step {index + 1}</Badge>
            <Text style={styles.label}>Interactive Drill</Text>
          </View>

          <BodyText style={styles.instruction}>{step.instruction}</BodyText>

          {step.targetCodeFragment ? (
            <View style={styles.fragmentSection}>
              <MutedText style={styles.sectionLabel}>Target Code Line</MutedText>
              <Text style={styles.codeFragment}>{step.targetCodeFragment}</Text>
            </View>
          ) : null}

          <View style={styles.observationSection}>
            <MutedText style={styles.sectionLabel}>Expected Observation (When you run)</MutedText>
            <BodyText style={styles.observationText}>👁️ {step.expectedObservation}</BodyText>
          </View>

          <View style={styles.hintSection}>
            <Text style={styles.hintLabel}>Stuck? Wrong Turn Hint</Text>
            <MutedText style={styles.hintText}>💡 {step.wrongTurnHint}</MutedText>
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
  header: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: spacing.xs
  },
  stepCard: {
    padding: spacing.md,
    gap: spacing.xs,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    backgroundColor: colors.surface
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  instruction: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 22
  },
  fragmentSection: {
    gap: 4,
    marginVertical: 4
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.muted
  },
  codeFragment: {
    fontFamily: "System",
    fontSize: 13,
    fontWeight: "bold",
    color: colors.ink,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm
  },
  observationSection: {
    gap: 4,
    marginVertical: 4
  },
  observationText: {
    fontSize: 14,
    color: colors.text
  },
  hintSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 2
  },
  hintLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.rose
  },
  hintText: {
    fontSize: 13,
    color: colors.text
  }
});
