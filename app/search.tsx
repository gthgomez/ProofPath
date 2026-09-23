import { Link } from "expo-router";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { conceptRegistry } from "@/content/concepts";
import { contentPack } from "@/content/seed";
import { searchContent, type ConceptSearchHit, type LessonSearchHit, type MissionSearchHit } from "@/domain/reference";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle } from "@/ui/primitives";
import { colors, radius, sizing, spacing } from "@/ui/theme";

export default function SearchScreen(): ReactElement {
  const [query, setQuery] = useState("");
  const results = useMemo(
    () => searchContent(contentPack, conceptRegistry, query),
    [query]
  );
  const hasQuery = query.trim().length > 0;
  const totalHits = results.concepts.length + results.lessons.length + results.missions.length;

  return (
    <Screen eyebrow="Reference" title="Search">
      <Panel accessibilityLabel="Search ProofPath">
        <TextInput
          accessibilityLabel="Search concepts, lessons, and missions"
          autoCapitalize="none"
          autoCorrect={false}
          onChangeText={setQuery}
          placeholder="Search concepts, lessons, missions…"
          placeholderTextColor={colors.mutedStrong}
          style={styles.searchInput}
          value={query}
        />
        {hasQuery ? (
          <MutedText>{`${totalHits} match${totalHits === 1 ? "" : "es"} for "${query.trim()}"`}</MutedText>
        ) : (
          <BodyText>
            Look up any concept, lesson, or mission by name. Results link straight to the
            reference entry or the lesson that teaches it.
          </BodyText>
        )}
      </Panel>

      {hasQuery && totalHits === 0 ? (
        <Panel accessibilityLabel="No search results">
          <SectionTitle>No matches</SectionTitle>
          <MutedText>
            Try a shorter term, or browse the full concept index from the Concepts screen.
          </MutedText>
        </Panel>
      ) : null}

      {results.concepts.length > 0 ? (
        <Panel accessibilityLabel="Matching concepts">
          <Row>
            <SectionTitle>Concepts</SectionTitle>
            <Badge tone="blue">{results.concepts.length}</Badge>
          </Row>
          {results.concepts.map((hit) => (
            <ConceptResultRow key={hit.entry.concept.id} hit={hit} />
          ))}
        </Panel>
      ) : null}

      {results.lessons.length > 0 ? (
        <Panel accessibilityLabel="Matching lessons">
          <Row>
            <SectionTitle>Lessons</SectionTitle>
            <Badge tone="teal">{results.lessons.length}</Badge>
          </Row>
          {results.lessons.map((hit) => (
            <LessonResultRow key={hit.lesson.id} hit={hit} />
          ))}
        </Panel>
      ) : null}

      {results.missions.length > 0 ? (
        <Panel accessibilityLabel="Matching missions">
          <Row>
            <SectionTitle>Missions</SectionTitle>
            <Badge tone="amber">{results.missions.length}</Badge>
          </Row>
          {results.missions.map((hit) => (
            <MissionResultRow key={hit.mission.id} hit={hit} />
          ))}
        </Panel>
      ) : null}
    </Screen>
  );
}

function ConceptResultRow({ hit }: { hit: ConceptSearchHit }): ReactElement {
  const entry = hit.entry;

  return (
    <View style={styles.resultRow}>
      <View style={styles.resultCopy}>
        <Text style={styles.resultTitle}>{entry.concept.label}</Text>
        <MutedText>{entry.concept.description}</MutedText>
        <Row>
          {entry.isSupportingOnly
            ? <Badge tone="ink">supporting</Badge>
            : <Badge tone="teal">level {entry.introducingLesson?.level ?? "?"}</Badge>}
        </Row>
      </View>
      {!entry.isSupportingOnly ? (
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
      ) : null}
    </View>
  );
}

function LessonResultRow({ hit }: { hit: LessonSearchHit }): ReactElement {
  const lesson = hit.lesson;

  return (
    <View style={styles.resultRow}>
      <View style={styles.resultCopy}>
        <Text style={styles.resultTitle}>{lesson.title}</Text>
        <MutedText>{lesson.summary}</MutedText>
        <Row>
          <Badge tone="blue">{lesson.curriculum ? `level ${lesson.curriculum.level}` : "lesson"}</Badge>
        </Row>
      </View>
      <Link
        href={{ pathname: "/lesson/[lessonId]", params: { lessonId: lesson.id } }}
        asChild
      >
        <ButtonShell
          accessibilityHint={`Opens the lesson ${lesson.title}.`}
          size="compact"
          tone="blue"
          variant="secondary"
        >
          Open
        </ButtonShell>
      </Link>
    </View>
  );
}

function MissionResultRow({ hit }: { hit: MissionSearchHit }): ReactElement {
  const mission = hit.mission;

  return (
    <View style={styles.resultRow}>
      <View style={styles.resultCopy}>
        <Text style={styles.resultTitle}>{mission.title}</Text>
        <MutedText>{mission.brief}</MutedText>
        <Row>
          <Badge tone="amber">{mission.difficulty}</Badge>
        </Row>
      </View>
      <Link
        href={{ pathname: "/mission/[missionId]", params: { missionId: mission.id } }}
        asChild
      >
        <ButtonShell
          accessibilityHint={`Opens the mission ${mission.title}.`}
          size="compact"
          tone="amber"
          variant="secondary"
        >
          Open
        </ButtonShell>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  searchInput: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 15,
    minHeight: sizing.minTapTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  resultRow: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    padding: spacing.sm
  },
  resultCopy: {
    flex: 1,
    gap: spacing.xs
  },
  resultTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0,
    lineHeight: 20
  }
});
