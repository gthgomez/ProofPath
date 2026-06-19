import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { CodeWalkthroughNote as CodeWalkthroughNoteType } from "@/domain/types";
import { Badge, BodyText, MutedText, SubPanel, SectionTitle } from "./primitives";
import { colors, radius, spacing } from "./theme";

interface CodeWalkthroughProps {
  notes: CodeWalkthroughNoteType[];
}

export function CodeWalkthrough({ notes }: CodeWalkthroughProps): ReactElement {
  return (
    <View style={styles.container}>
      <SectionTitle style={styles.header}>Code Line-by-Line Walkthrough</SectionTitle>
      {notes.map((note, index) => (
        <SubPanel key={note.id} style={styles.noteCard}>
          <View style={styles.headerRow}>
            <Badge tone="blue">Line {index + 1}</Badge>
            <Text style={styles.label}>{note.label}</Text>
          </View>

          <Text style={styles.codeFragment}>{note.codeFragment}</Text>

          <BodyText style={styles.explanation}>{note.explanation}</BodyText>

          <View style={styles.ticketSection}>
            <Text style={styles.ticketLabel}>Verify your understanding. You should be able to say:</Text>
            <Text style={styles.ticketText}>💬 "{note.learnerShouldBeAbleToSay}"</Text>
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
  noteCard: {
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
    fontSize: 13,
    fontWeight: "700",
    color: colors.text
  },
  codeFragment: {
    fontFamily: "System",
    fontSize: 14,
    fontWeight: "bold",
    color: colors.ink,
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.sm,
    padding: spacing.sm,
    marginVertical: spacing.xs
  },
  explanation: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20
  },
  ticketSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 4
  },
  ticketLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    color: colors.muted
  },
  ticketText: {
    fontSize: 13,
    color: colors.ink,
    fontWeight: "600",
    fontStyle: "italic"
  }
});
