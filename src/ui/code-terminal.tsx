import type { ReactElement } from "react";
import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import type { TerminalEvent } from "@/domain/types";
import { colors, radius, semanticColors, spacing } from "@/ui/theme";

interface CodeTerminalProps {
  density?: "compact" | "detailed";
  events: TerminalEvent[];
}

const LONG_BLOCK_LIMIT = 520;

export function CodeTerminal({ density: initialDensity = "compact", events }: CodeTerminalProps): ReactElement {
  const [density, setDensity] = useState<"compact" | "detailed">(initialDensity);
  const isRunning = events.some((event) => event.type === "phase" && event.status === "active");
  const visibleEvents = density === "compact"
    ? events.filter((event) => event.type !== "context" && !(event.type === "phase" && event.status === "skipped"))
    : events;

  return (
    <View style={styles.terminalShell}>
      <View style={styles.terminalHeader}>
        <View style={styles.windowDots}>
          <View style={[styles.dot, styles.dotClose]} />
          <View style={[styles.dot, styles.dotMinimize]} />
          <View style={[styles.dot, styles.dotZoom]} />
        </View>
        <Text style={styles.terminalTitle}>Terminal</Text>
        {isRunning ? <ActivityIndicator color={colors.surface} size="small" /> : null}
        <Pressable
          accessibilityHint={`Switches terminal to ${density === "compact" ? "detailed" : "compact"} output density.`}
          accessibilityLabel="Toggle terminal density"
          onPress={() => setDensity((current) => current === "compact" ? "detailed" : "compact")}
          style={styles.densityButton}
        >
          <Text style={styles.densityButtonText}>{density}</Text>
        </Pressable>
      </View>
      <View style={styles.terminalBody}>
        {visibleEvents.map((event, index) => (
          <TerminalEventLine event={event} key={`${event.type}-${index}`} />
        ))}
      </View>
    </View>
  );
}

function TerminalEventLine({ event }: { event: TerminalEvent }): ReactElement {
  if (event.type === "context") {
    return <TerminalLine tone="muted" text={`[context] ${event.cwd} ${event.file} ${event.language}`} />;
  }

  if (event.type === "command") {
    return <TerminalLine tone="prompt" text={event.text} />;
  }

  if (event.type === "phase") {
    return (
      <TerminalLine
        active={event.status === "active"}
        tone={event.status === "failed" ? "danger" : event.status === "done" ? "success" : event.status === "skipped" ? "muted" : "info"}
        text={`${event.status === "active" ? "> " : ""}${event.label}`}
      />
    );
  }

  if (event.type === "stdout") {
    return (
      <>
        <TerminalLine tone="section" text="[stdout]" />
        <TerminalBlock text={event.text} />
      </>
    );
  }

  if (event.type === "stderr") {
    return (
      <>
        <TerminalLine tone="section" text="[stderr]" />
        <TerminalBlock text={event.text} />
      </>
    );
  }

  if (event.type === "diagnostic") {
    const location = typeof event.line === "number" ? `line ${event.line}: ` : "";
    return <TerminalLine tone={event.severity === "error" ? "danger" : event.severity === "warning" ? "section" : "muted"} text={`${location}${event.message}`} />;
  }

  return (
    <TerminalLine
      tone={event.status === "passed" ? "success" : "danger"}
      text={`[result] ${event.status} (${event.reason}${typeof event.exitCode === "number" ? `, exit ${event.exitCode}` : ", blocked"})${event.runtimeMs > 0 ? ` in ${event.runtimeMs}ms` : ""}`}
    />
  );
}

function TerminalLine({
  active = false,
  text,
  tone
}: {
  active?: boolean;
  text: string;
  tone: "danger" | "info" | "muted" | "prompt" | "section" | "success";
}): ReactElement {
  return (
    <Text selectable style={[styles.terminalLine, terminalToneStyles[tone], active ? styles.activeLine : null]}>
      {text}
    </Text>
  );
}

function TerminalBlock({ text }: { text: string }): ReactElement {
  const [expanded, setExpanded] = useState(false);
  const shouldCollapse = text.length > LONG_BLOCK_LIMIT;
  const visibleText = shouldCollapse && !expanded ? `${text.slice(0, LONG_BLOCK_LIMIT).trimEnd()}\n...` : text;

  return (
    <>
      <Text selectable style={styles.terminalBlock}>{visibleText}</Text>
      {shouldCollapse ? (
        <Pressable
          accessibilityHint={expanded ? "Collapses this long terminal block." : "Expands this long terminal block."}
          accessibilityLabel={expanded ? "Collapse terminal block" : "Expand terminal block"}
          onPress={() => setExpanded((current) => !current)}
          style={styles.expandButton}
        >
          <Text style={styles.expandButtonText}>{expanded ? "Show less" : "Show full output"}</Text>
        </Pressable>
      ) : null}
    </>
  );
}

const terminalFont = {
  fontFamily: "monospace",
  fontSize: 12,
  letterSpacing: 0,
  lineHeight: 18
};

const styles = StyleSheet.create({
  terminalShell: {
    backgroundColor: colors.inkStrong,
    borderColor: colors.ink,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden"
  },
  terminalHeader: {
    alignItems: "center",
    backgroundColor: colors.ink,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  windowDots: {
    flexDirection: "row",
    gap: 6
  },
  dot: {
    borderRadius: 999,
    height: 10,
    width: 10
  },
  dotClose: {
    backgroundColor: semanticColors.danger
  },
  dotMinimize: {
    backgroundColor: semanticColors.warning
  },
  dotZoom: {
    backgroundColor: semanticColors.success
  },
  terminalTitle: {
    color: colors.surface,
    flex: 1,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  densityButton: {
    alignItems: "center",
    borderColor: colors.inkMuted,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  densityButtonText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  terminalBody: {
    gap: 4,
    minHeight: 148,
    padding: spacing.md
  },
  terminalLine: {
    ...terminalFont
  },
  terminalBlock: {
    ...terminalFont,
    color: colors.inkMuted,
    paddingLeft: spacing.sm
  },
  expandButton: {
    alignSelf: "flex-start",
    borderColor: colors.inkMuted,
    borderRadius: radius.sm,
    borderWidth: 1,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6
  },
  expandButtonText: {
    color: colors.tealMuted,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0
  },
  activeLine: {
    color: colors.goldMuted,
    fontWeight: "900"
  }
});

const terminalToneStyles = StyleSheet.create({
  danger: {
    color: colors.crimsonMuted
  },
  info: {
    color: colors.blueMuted
  },
  muted: {
    color: colors.inkMuted
  },
  prompt: {
    color: colors.tealMuted,
    fontWeight: "900"
  },
  section: {
    color: colors.goldMuted,
    fontWeight: "900"
  },
  success: {
    color: colors.emeraldMuted,
    fontWeight: "800"
  }
});
