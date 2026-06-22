import { useState, type ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Link, Redirect } from "expo-router";
import { contentPack } from "@/content/seed";
import { getLessonsForModule, getModulesForTrack } from "@/domain/content";
import { evaluatePathProofGate, getFutureUnlocksForRole, getTracksForRole, getPathNodes } from "@/domain/role-routing";
import type { Difficulty, Module, ProjectMission } from "@/domain/types";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle, SubPanel } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { colors, radius, spacing } from "@/ui/theme";
import { useProgress } from "@/state/progress-provider";

interface PlacementQuestion {
  prompt: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

interface PlacementState {
  trackId: string;
  trackTitle: string;
  questions: PlacementQuestion[];
  currentQuestionIndex: number;
  selectedAnswers: number[];
  failed: boolean;
  success: boolean;
}

export default function LearningPathScreen(): ReactElement {
  const { progress, roleTarget, placement } = useProgress();
  const { isCheckingOnboarding, needsOnboarding } = useOnboardingGate();
  const [placementState, setPlacementState] = useState<PlacementState | null>(null);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">("all");

  const startPlacement = (trackId: string, trackTitle: string) => {
    const trackModules = getModulesForTrack(contentPack, trackId);
    const trackLessons = trackModules.flatMap((m) => getLessonsForModule(contentPack, m.id));
    
    const questions: PlacementQuestion[] = [];

    for (const lesson of trackLessons) {
      const quiz = contentPack.quizzes.find((q) => q.id === lesson.quizId);
      if (quiz && quiz.questions.length > 0) {
        const question = quiz.questions[0];
        questions.push({
          prompt: question.prompt,
          choices: question.choices,
          correctIndex: question.correctChoiceIndex,
          explanation: question.explanation
        });
      }
    }

    if (questions.length === 0) {
      questions.push({
        prompt: `Are you ready to test out of ${trackTitle}?`,
        choices: ["Yes, I am ready", "No, go back"],
        correctIndex: 0,
        explanation: "Basic test confirmation."
      });
    }

    setSelectedChoice(null);
    setPlacementState({
      trackId,
      trackTitle,
      questions: questions.slice(0, 5),
      currentQuestionIndex: 0,
      selectedAnswers: [],
      failed: false,
      success: false
    });
  };

  const tracks = getTracksForRole(contentPack, roleTarget.id);
  const proofGate = evaluatePathProofGate(contentPack, progress, roleTarget.id);
  const futureUnlocks = getFutureUnlocksForRole(contentPack, progress, roleTarget.id);

  if (isCheckingOnboarding) {
    return (
      <Screen eyebrow="Path setup" title="Loading Learn">
        <Panel accessibilityLabel="Loading Learn" accessibilityState={{ busy: true }}>
          <SectionTitle>Reading local profile</SectionTitle>
          <MutedText>Checking SQLite before routing Learn.</MutedText>
        </Panel>
      </Screen>
    );
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen eyebrow={roleTarget.title} title="Learn">
      <Panel>
        <SectionTitle>career path</SectionTitle>
        <BodyText>{roleTarget.summary}</BodyText>
        <Link href="/onboarding" asChild>
          <ButtonShell accessibilityHint="Changes which tracks appear in Learn." tone="rose" variant="secondary">Change career path</ButtonShell>
        </Link>
      </Panel>

      {tracks.length === 0 ? (
        <Panel>
          <SectionTitle>No Learn tracks for this path yet</SectionTitle>
          <MutedText>Choose another career path or add path track mappings to the local content pack.</MutedText>
        </Panel>
      ) : null}

      {proofGate ? (
        <Panel>
          <SectionTitle>{proofGate.gate.title}</SectionTitle>
          <BodyText>{proofGate.gate.summary}</BodyText>
          <MutedText>
            {proofGate.completedMissionCount}/{proofGate.requiredMissionCount} projects complete
            {proofGate.complete ? " ✓" : ""}
          </MutedText>
          <View style={styles.unlockGrid}>
            {proofGate.missions.map((mission) => (
              <SubPanel key={mission.missionId}>
                <SectionTitle>
                  {mission.complete ? "✓ " : ""}{mission.title}
                </SectionTitle>
                <MutedText>
                  {mission.checklist.filter((item) => item.complete).length}/{mission.checklist.length} checks
                </MutedText>
              </SubPanel>
            ))}
          </View>
          {futureUnlocks.length > 0 ? (
            <View style={styles.unlockGrid}>
              <SectionTitle style={styles.futureTitle}>Future paths</SectionTitle>
              {futureUnlocks.map((unlock) => (
                <SubPanel key={unlock.id}>
                  <SectionTitle>{unlock.title}</SectionTitle>
                  <MutedText>{unlock.label} · {unlock.kind}</MutedText>
                </SubPanel>
              ))}
            </View>
          ) : null}
        </Panel>
      ) : null}

      {tracks.map((track) => {
        const pathNodes = getPathNodes(contentPack, track.id, progress);

        return (
          <Panel key={track.id}>
            <SectionTitle>{track.title}</SectionTitle>
            <MutedText style={styles.trackSummary}>{track.summary}</MutedText>
            {!pathNodes.every((node) => node.status === "completed" || node.status === "placed-out") ? (
              <ButtonShell
                accessibilityHint={`Start a placement test to test out of ${track.title} lessons.`}
                onPress={() => startPlacement(track.id, track.title)}
                size="compact"
                tone="rose"
                variant="secondary"
                style={styles.fastTrackButton}
              >
                Placement: Test out of this track
              </ButtonShell>
            ) : (
              <MutedText style={{ marginBottom: spacing.sm }}>All lessons complete</MutedText>
            )}

            {/* Difficulty filter pills */}
            <Row style={styles.filterRow}>
              {(["all", "foundation", "applied", "portfolio"] as const).map((level) => (
                <ButtonShell
                  key={level}
                  accessibilityHint={level === "all" ? "Show all difficulty levels" : `Show only ${level} lessons`}
                  onPress={() => setDifficultyFilter(level)}
                  size="compact"
                  selected={difficultyFilter === level}
                  tone={difficultyFilter === level ? "blue" : "ink"}
                  variant={difficultyFilter === level ? "primary" : "tertiary"}
                  style={styles.filterPill}
                >
                  {level === "all" ? "All" : level.charAt(0).toUpperCase() + level.slice(1)}
                </ButtonShell>
              ))}
            </Row>

            <View style={styles.nodeListContainer}>
              {(() => {
                const filteredNodes = pathNodes.filter(
                  (node) => difficultyFilter === "all" || node.difficulty === difficultyFilter
                );
                let lastModuleId: string | undefined;

                return filteredNodes.length === 0 ? (
                  <MutedText style={{ padding: spacing.md }}>No {difficultyFilter} items in this track.</MutedText>
                ) : filteredNodes.map((node) => {
                  const isCompleted = node.status === "completed";
                  const isPlacedOut = node.status === "placed-out";
                  const isCurrent = node.status === "current";
                  const isLocked = node.status === "locked" || node.status === "upcoming";

                  // Module grouping header
                  const nodeModule = getModuleForNode(node, contentPack);
                  const moduleChanged = nodeModule && nodeModule.id !== lastModuleId;
                  if (nodeModule) {
                    lastModuleId = nodeModule.id;
                  }

                  const nodeHref = node.type === "mission"
                    ? { pathname: "/mission/[missionId]" as const, params: { missionId: node.id } }
                    : { pathname: "/lesson/[lessonId]" as const, params: { lessonId: node.id } };

                  return (
                    <View key={node.id}>
                      {moduleChanged && nodeModule ? (
                        <ModuleHeader module={nodeModule} pathNodes={pathNodes} />
                      ) : null}
                      <View style={styles.nodeRow}>
                        <Text style={[styles.nodeStatusIcon, isCurrent && { color: colors.blue }]}>
                          {isCompleted ? "✓" : isPlacedOut ? "—" : isCurrent ? "▸" : "·"}
                        </Text>
                        <View style={styles.nodeRowContent}>
                          <Text style={[styles.nodeRowTitle, (isLocked || isPlacedOut) && { color: colors.muted }, isCurrent && { color: colors.blue, fontWeight: "700" }]}>
                            {node.title}
                          </Text>
                        </View>
                        {isLocked ? (
                          <Text style={{ fontSize: 12, fontWeight: "700", color: colors.muted }}>Locked</Text>
                        ) : (
                          <Link href={nodeHref} asChild>
                            <ButtonShell
                              accessibilityHint={`Opens ${node.title}.`}
                              size="compact"
                              tone={isCompleted || isPlacedOut ? "ink" : isCurrent ? "blue" : "teal"}
                              variant={isCurrent ? "primary" : "secondary"}
                              style={{ flexGrow: 0, minWidth: 80 }}
                            >
                              {isCompleted || isPlacedOut ? "Review" : isCurrent ? "Continue" : "Start"}
                            </ButtonShell>
                          </Link>
                        )}
                      </View>
                    </View>
                  );
                });
              })()}
            </View>
          </Panel>
        );
      })}
      {placementState ? (
        <View style={styles.overlayContainer} accessibilityViewIsModal accessibilityLabel="Placement Test Modal">
          <Panel style={styles.modalPanel}>
            {placementState.success ? (
              <View style={styles.modalCenter}>
                <Badge tone="green">passed</Badge>
                <SectionTitle style={styles.modalTitle}>Passed Placement Test!</SectionTitle>
                <BodyText style={styles.modalBody}>
                  Concepts marked as placed out. Complete lessons individually for full readiness credit.
                </BodyText>
                <ButtonShell
                  accessibilityHint="Closes this modal and returns to the roadmap."
                  onPress={() => setPlacementState(null)}
                  tone="green"
                >
                  Back to Roadmap
                </ButtonShell>
              </View>
            ) : placementState.failed && placementState.currentQuestionIndex >= placementState.questions.length ? (
              <View style={styles.modalCenter}>
                <Badge tone="rose">test failed</Badge>
                <SectionTitle style={styles.modalTitle}>Placement Test Failed</SectionTitle>
                <BodyText style={styles.modalBody}>
                  You missed one or more questions. We recommend continuing with the lessons on the roadmap to build your readiness score.
                </BodyText>
                <ButtonShell
                  accessibilityHint="Closes this modal and returns to the roadmap."
                  onPress={() => setPlacementState(null)}
                  tone="rose"
                >
                  Back to Roadmap
                </ButtonShell>
              </View>
            ) : (
              <View>
                <Row>
                  <Badge tone="blue">{placementState.trackTitle} Test</Badge>
                  <Badge tone="teal">
                    Question {placementState.currentQuestionIndex + 1} of {placementState.questions.length}
                  </Badge>
                </Row>
                <SectionTitle style={styles.modalQuestionTitle}>
                  {placementState.questions[placementState.currentQuestionIndex].prompt}
                </SectionTitle>
                <View style={styles.choicesList}>
                  {placementState.questions[placementState.currentQuestionIndex].choices.map((choice, cIndex) => {
                    const isChoiceSelected = selectedChoice === cIndex;
                    return (
                      <ButtonShell
                        key={`choice-${cIndex}`}
                        accessibilityHint={`Selects answer option: ${choice}.`}
                        onPress={() => setSelectedChoice(cIndex)}
                        selected={isChoiceSelected}
                        tone={isChoiceSelected ? "blue" : "ink"}
                        variant={isChoiceSelected ? "primary" : "secondary"}
                        style={styles.choiceButton}
                      >
                        {choice}
                      </ButtonShell>
                    );
                  })}
                </View>
                <ButtonShell
                  accessibilityHint="Submit your selected answer for this question."
                  disabled={selectedChoice === null}
                  onPress={() => {
                    if (selectedChoice === null) return;
                    
                    const currentQ = placementState.questions[placementState.currentQuestionIndex];
                    const isCorrect = selectedChoice === currentQ.correctIndex;
                    
                    const nextAnswers = [...placementState.selectedAnswers, selectedChoice];
                    const nextIndex = placementState.currentQuestionIndex + 1;
                    const isEnd = nextIndex >= placementState.questions.length;
                    const hasFailed = placementState.failed || !isCorrect;

                    setSelectedChoice(null);

                    if (isEnd) {
                      if (hasFailed) {
                        setPlacementState((prev) => prev ? {
                          ...prev,
                          selectedAnswers: nextAnswers,
                          currentQuestionIndex: nextIndex,
                          failed: true
                        } : null);
                      } else {
                        // Success! Skip track
                        const trackModules = getModulesForTrack(contentPack, placementState.trackId);
                        const trackLessons = trackModules.flatMap((m) => getLessonsForModule(contentPack, m.id));
                        const lessonIds = trackLessons.map((l) => l.id);
                        const quizIds = trackLessons.map((l) => l.quizId).filter(Boolean);
                        placement(lessonIds, quizIds);

                        setPlacementState((prev) => prev ? {
                          ...prev,
                          selectedAnswers: nextAnswers,
                          currentQuestionIndex: nextIndex,
                          success: true
                        } : null);
                      }
                    } else {
                      setPlacementState((prev) => prev ? {
                        ...prev,
                        selectedAnswers: nextAnswers,
                        currentQuestionIndex: nextIndex,
                        failed: hasFailed
                      } : null);
                    }
                  }}
                  tone="blue"
                  style={styles.submitButton}
                >
                  {placementState.currentQuestionIndex === placementState.questions.length - 1 ? "Finish Test" : "Submit Answer"}
                </ButtonShell>
                <ButtonShell
                  accessibilityHint="Cancel the placement test and return to roadmap."
                  onPress={() => setPlacementState(null)}
                  tone="ink"
                  variant="tertiary"
                  style={styles.cancelButton}
                >
                  Cancel Test
                </ButtonShell>
              </View>
            )}
          </Panel>
        </View>
      ) : null}
    </Screen>
  );
}

function getModuleForNode(node: { id: string; type: string }, content: typeof contentPack): Module | undefined {
  if (node.type === "lesson") {
    return content.modules.find((m) => m.lessonIds.includes(node.id));
  }
  if (node.type === "mission") {
    return content.modules.find((m) => m.projectMissionIds.includes(node.id));
  }
  return undefined;
}

function ModuleHeader({ module: mod, pathNodes }: { module: Module; pathNodes: ReturnType<typeof getPathNodes> }): ReactElement {
  const moduleNodeCount = pathNodes.filter((n) => {
    const m = getModuleForNode(n, contentPack);
    return m?.id === mod.id;
  }).length;
  const completedCount = pathNodes.filter((n) => {
    const m = getModuleForNode(n, contentPack);
    return m?.id === mod.id && n.status === "completed";
  }).length;
  return (
    <View style={styles.moduleHeader}>
      <SectionTitle style={styles.moduleHeaderTitle}>{mod.title}</SectionTitle>
      <MutedText>{mod.summary} · {completedCount}/{moduleNodeCount} lessons</MutedText>
    </View>
  );
}

const styles = StyleSheet.create({
  unlockGrid: {
    gap: spacing.sm,
    marginTop: spacing.md
  },
  futureTitle: {
    marginTop: spacing.md
  },
  trackSummary: {
    marginBottom: spacing.md
  },
  filterRow: {
    marginVertical: spacing.sm,
    gap: spacing.xs
  },
  filterPill: {
    flexGrow: 0,
    minWidth: 0,
    paddingHorizontal: spacing.sm
  },
  moduleHeader: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md
  },
  moduleHeaderTitle: {
    fontSize: 15
  },
  nodeListContainer: {
    gap: spacing.xs,
    marginVertical: spacing.sm
  },
  nodeRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.sm
  },
  nodeStatusIcon: {
    color: colors.muted,
    fontSize: 16,
    fontWeight: "700",
    width: 20,
    textAlign: "center" as const
  },
  nodeRowContent: {
    flex: 1
  },
  nodeRowTitle: {
    color: colors.text,
    fontSize: 15
  },
  overlayContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
    zIndex: 999
  },
  modalPanel: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    elevation: 5,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: radius.md
  },
  modalCenter: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center"
  },
  modalBody: {
    textAlign: "center",
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.md
  },
  modalQuestionTitle: {
    fontSize: 16,
    marginVertical: spacing.sm,
    color: colors.text
  },
  choicesList: {
    gap: spacing.xs,
    marginVertical: spacing.sm
  },
  choiceButton: {
    width: "100%",
    alignItems: "flex-start"
  },
  submitButton: {
    marginTop: spacing.sm
  },
  cancelButton: {
    marginTop: spacing.xs,
    alignSelf: "center"
  },
  fastTrackButton: {
    alignSelf: "flex-start",
    marginBottom: spacing.sm
  }
});
