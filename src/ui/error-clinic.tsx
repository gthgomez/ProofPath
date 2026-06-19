import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { ErrorClinicItem as ErrorClinicItemType } from "@/domain/types";
import { Badge, BodyText, MutedText, SubPanel, SectionTitle } from "./primitives";
import { colors, radius, spacing } from "./theme";

interface ErrorClinicProps {
  clinicItems: ErrorClinicItemType[];
}

export function ErrorClinic({ clinicItems }: ErrorClinicProps): ReactElement {
  return (
    <View style={styles.container}>
      <SectionTitle style={styles.header}>Error Clinic</SectionTitle>
      {clinicItems.map((item) => (
        <SubPanel key={item.id} style={styles.card}>
          <View style={styles.headerRow}>
            <Badge tone="rose">Broken Code</Badge>
            <Text style={styles.label}>Common Trap</Text>
          </View>

          <Text style={styles.codeBlock}>{item.brokenExample}</Text>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Symptom</Text>
            <Text style={styles.symptomText}>❌ {item.symptom}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Likely Cause</Text>
            <BodyText>{item.likelyCause}</BodyText>
          </View>

          <View style={styles.fixSection}>
            <Text style={styles.fixLabel}>How to Fix</Text>
            <BodyText style={styles.fixText}>🛠️ {item.fixStrategy}</BodyText>
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
  card: {
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
  codeBlock: {
    fontFamily: "System",
    fontSize: 13,
    color: colors.rose,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginVertical: 4
  },
  section: {
    gap: 2,
    marginVertical: 2
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.muted
  },
  symptomText: {
    fontSize: 14,
    color: colors.rose,
    fontWeight: "600"
  },
  fixSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 2
  },
  fixLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.green
  },
  fixText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "700"
  }
});
