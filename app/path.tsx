import { useState, type ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Link, Redirect } from "expo-router";
import { contentPack } from "@/content/seed";
import { getLessonsForModule, getModulesForTrack } from "@/domain/content";
import { evaluatePathProofGate, getFutureUnlocksForRole, getTracksForRole, getPathNodes, type FutureUnlockLabel } from "@/domain/role-routing";
import type { ProjectMission } from "@/domain/types";
import { Badge, BodyText, ButtonShell, MutedText, Panel, Row, Screen, SectionTitle, SubPanel } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { colors, radius, semanticColors, spacing } from "@/ui/theme";
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
          <Row>
            <Badge tone={proofGate.complete ? "green" : "amber"}>
              {proofGate.completedMissionCount}/{proofGate.requiredMissionCount} projects
            </Badge>
            <Badge tone={proofGate.complete ? "green" : "ink"}>
              {proofGate.complete ? "Gate complete" : "Readiness gate"}
            </Badge>
          </Row>
          <SectionTitle>{proofGate.gate.title}</SectionTitle>
          <BodyText>{proofGate.gate.summary}</BodyText>
          <View style={styles.unlockGrid}>
            {proofGate.missions.map((mission) => (
              <SubPanel key={mission.missionId}>
                <Row>
                  <Badge tone={mission.complete ? "green" : "ink"}>{mission.complete ? "complete" : "needed"}</Badge>
                  <Badge tone="teal">{mission.checklist.filter((item) => item.complete).length}/{mission.checklist.length} checks</Badge>
                </Row>
                <SectionTitle>{mission.title}</SectionTitle>
              </SubPanel>
            ))}
          </View>
          {futureUnlocks.length > 0 ? (
            <View style={styles.unlockGrid}>
              <SectionTitle style={styles.futureTitle}>Future paths</SectionTitle>
              {futureUnlocks.map((unlock) => (
                <SubPanel key={unlock.id}>
                  <Row>
                    <Badge tone={unlockBadgeTone(unlock.label)}>{unlock.label}</Badge>
                    <Badge tone="teal">{unlock.kind}</Badge>
                  </Row>
                  <SectionTitle>{unlock.title}</SectionTitle>
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
            <Row>
              <Badge>{track.roleTargets[0] || "Foundations"}</Badge>
              <Badge tone="teal">{track.moduleIds.length} modules</Badge>
            </Row>
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
              <Row style={{ marginBottom: spacing.sm }}>
                <Badge tone="green">Track completed</Badge>
              </Row>
            )}

            <View style={styles.nodeListContainer}>
              {pathNodes.map((node, index) => {
                const isLast = index === pathNodes.length - 1;
                const isCompleted = node.status === "completed";
                const isPlacedOut = node.status === "placed-out";
                const isCurrent = node.status === "current";
                const isLocked = node.status === "locked" || node.status === "upcoming";

                const nodeHref = node.type === "mission"
                  ? { pathname: "/mission/[missionId]" as const, params: { missionId: node.id } }
                  : { pathname: "/lesson/[lessonId]" as const, params: { lessonId: node.id } };

                return (
                  <View key={node.id} style={styles.timelineNode}>
                    {!isLast ? <View style={styles.lineConnector} /> : null}
                    <View style={[
                      styles.circleNode,
                      isCompleted ? styles.circleCompleted : isPlacedOut ? styles.circlePlacedOut : isCurrent ? styles.circleCurrent : styles.circleLocked
                    ]}>
                      {isCompleted ? <Text style={styles.circleText}>✓</Text> : isPlacedOut ? <Text style={styles.circleTextPlacedOut}>—</Text> : null}
                    </View>
                    <View style={styles.nodeContent}>
                      <Row>
                        <Badge tone={isCompleted ? "green" : isCurrent ? "blue" : "ink"}>
                          {node.status === "placed-out" ? "placed out" : node.type}
                        </Badge>
                        {node.estimatedMinutes ? (
                          <Badge tone="teal">{node.estimatedMinutes} min</Badge>
                        ) : null}
                        {node.language ? (
                          <Badge tone="amber">{node.language}</Badge>
                        ) : null}
                      </Row>
                      <SectionTitle style={styles.nodeTitleText}>{node.title}</SectionTitle>
                      {isLocked ? (
                        <ButtonShell
                          accessibilityHint="This item is locked until you complete the previous lessons."
                          size="compact"
                          disabled={true}
                          tone="ink"
                          variant="secondary"
                        >
                          Locked
                        </ButtonShell>
                      ) : (
                        <Link href={nodeHref} asChild>
                          <ButtonShell
                            accessibilityHint={`Opens ${node.title}.`}
                            size="compact"
                            tone={isCompleted || isPlacedOut ? "ink" : isCurrent ? "blue" : "teal"}
                            variant={isCurrent || isCompleted || isPlacedOut ? "primary" : "secondary"}
                          >
                            {isCompleted || isPlacedOut ? "Review" : isCurrent ? "Continue" : "Start"}
                          </ButtonShell>
                        </Link>
                      )}
                    </View>
                  </View>
                );
              })}
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

function unlockBadgeTone(label: FutureUnlockLabel): "blue" | "teal" | "amber" | "rose" | "green" | "ink" {
  if (label === "Roadmap") {
    return "blue";
  }

  if (label === "Coming later") {
    return "ink";
  }

  return "amber";
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
  nodeListContainer: {
    gap: spacing.xs,
    marginVertical: spacing.sm
  },
  timelineNode: {
    flexDirection: "row",
    minHeight: 100,
    position: "relative"
  },
  lineConnector: {
    width: 2,
    backgroundColor: colors.border,
    position: "absolute",
    left: 11,
    top: 24,
    bottom: -16,
    zIndex: 1
  },
  circleNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    backgroundColor: colors.surface
  },
  circleCompleted: {
    borderColor: semanticColors.success,
    backgroundColor: semanticColors.success
  },
  circleCurrent: {
    borderColor: colors.blue,
    backgroundColor: colors.surface
  },
  circleLocked: {
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted
  },
  circlePlacedOut: {
    borderColor: colors.border,
    borderStyle: "dashed",
    backgroundColor: colors.surfaceMuted
  },
  circleText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "bold",
    lineHeight: 14
  },
  circleTextPlacedOut: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "bold",
    lineHeight: 14
  },
  nodeContent: {
    flex: 1,
    marginLeft: 16,
    gap: spacing.xs,
    paddingBottom: spacing.md
  },
  nodeTitleText: {
    fontSize: 15,
    marginVertical: 2
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
