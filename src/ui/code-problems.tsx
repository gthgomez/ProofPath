import type { ReactElement } from "react";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { ProblemDiagnostic } from "@/domain/types";
import { Badge, MutedText, Row, SectionTitle } from "@/ui/primitives";
import { colors, radius, spacing } from "@/ui/theme";

interface CodeProblemsProps {
  diagnostics: ProblemDiagnostic[];
  onSelectLine?: (line: number) => void;
}

const diagnosticSources = ["parser", "runtime", "check", "policy", "system"] as const;

export function CodeProblems({ diagnostics, onSelectLine }: CodeProblemsProps): ReactElement {
  const errorCount = diagnostics.filter((diagnostic) => diagnostic.severity === "error").length;

  return (
    <View style={styles.panel}>
      <Row>
        <Badge tone={errorCount > 0 ? "rose" : diagnostics.length > 0 ? "amber" : "green"}>
          {diagnostics.length === 0 ? "No problems" : `${diagnostics.length} problem${diagnostics.length === 1 ? "" : "s"}`}
        </Badge>
      </Row>
      <SectionTitle>Problems</SectionTitle>
      {diagnostics.length > 0 ? (
        <Row>
          {diagnosticSources.map((source) => {
            const count = diagnostics.filter((diagnostic) => diagnostic.source === source).length;
            return count > 0 ? <Badge key={source} tone="blue">{source} {count}</Badge> : null;
          })}
        </Row>
      ) : null}
      {diagnostics.length === 0 ? (
        <MutedText>No parser, runtime, policy, or check problems reported for the latest run.</MutedText>
      ) : diagnostics.map((diagnostic) => (
        <ProblemRow diagnostic={diagnostic} key={diagnostic.id} onSelectLine={onSelectLine} />
      ))}
    </View>
  );
}

function ProblemRow({
  diagnostic,
  onSelectLine
}: {
  diagnostic: ProblemDiagnostic;
  onSelectLine?: (line: number) => void;
}): ReactElement {
  const [showRawDetail, setShowRawDetail] = useState(false);
  const canSelectLine = diagnostic.confidence === "known" && typeof diagnostic.line === "number";

  return (
    <View style={styles.problemRow}>
      <Row>
        <Badge tone={diagnostic.severity === "error" ? "rose" : diagnostic.severity === "warning" ? "amber" : "blue"}>
          {diagnostic.severity}
        </Badge>
        <Badge tone="ink">{diagnostic.source}</Badge>
        {canSelectLine ? (
          <Pressable
            accessibilityHint={`Moves the editor cursor to line ${diagnostic.line}.`}
            accessibilityLabel={`Go to ${formatLocation(diagnostic)}`}
            onPress={() => onSelectLine?.(diagnostic.line as number)}
            style={styles.locationButton}
          >
            <Text style={styles.locationButtonText}>{formatLocation(diagnostic)}</Text>
          </Pressable>
        ) : (
          <MutedText>{formatLocation(diagnostic)}</MutedText>
        )}
      </Row>
      <Text selectable style={styles.problemMessage}>{diagnostic.message}</Text>
      {diagnostic.beginnerExplanation ? <MutedText>{diagnostic.beginnerExplanation}</MutedText> : null}
      {diagnostic.rawDetail && diagnostic.rawDetail !== diagnostic.message ? (
        <>
          <Pressable
            accessibilityHint={showRawDetail ? "Hides the raw runtime detail." : "Shows the raw runtime detail."}
            accessibilityLabel={showRawDetail ? "Hide raw detail" : "Show raw detail"}
            onPress={() => setShowRawDetail((current) => !current)}
            style={styles.rawDetailButton}
          >
            <Text style={styles.rawDetailButtonText}>{showRawDetail ? "Hide raw detail" : "Show raw detail"}</Text>
          </Pressable>
          {showRawDetail ? <Text selectable style={styles.rawDetail}>{diagnostic.rawDetail}</Text> : null}
        </>
      ) : null}
    </View>
  );
}

function formatLocation(diagnostic: ProblemDiagnostic): string {
  if (diagnostic.confidence === "known" && diagnostic.line) {
    return diagnostic.column ? `Line ${diagnostic.line}, column ${diagnostic.column}` : `Line ${diagnostic.line}`;
  }

  return "Location unknown";
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  problemRow: {
    borderColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingTop: spacing.sm
  },
  problemMessage: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 20
  },
  locationButton: {
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  locationButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0
  },
  rawDetailButton: {
    alignSelf: "flex-start",
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  rawDetailButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0
  },
  rawDetail: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.mutedStrong,
    fontFamily: "monospace",
    fontSize: 12,
    letterSpacing: 0,
    lineHeight: 18,
    padding: spacing.sm
  }
});
