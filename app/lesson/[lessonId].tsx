import { Link, Redirect, router, useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { contentPack } from "@/content/seed";
import { findLesson } from "@/domain/content";
import { CodeLab } from "@/ui/code-lab";
import { ConceptCapsuleList } from "@/ui/concept-capsule";
import { CodeWalkthrough } from "@/ui/code-walkthrough";
import { GuidedEditList } from "@/ui/guided-edit-list";
import { ErrorClinic } from "@/ui/error-clinic";
import { CodeLabBridge } from "@/ui/code-lab-bridge";
import { BodyText, ButtonShell, MutedText, Panel, ProgressBar, Row, Screen, SectionTitle, SubPanel } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { useProgress } from "@/state/progress-provider";
import { colors, radius, spacing } from "@/ui/theme";
import { preloadSandbox, runLessonSandbox } from "@/sandbox/runner";
import { deriveLessonWorkflow, type LessonWorkflowStep } from "@/domain/lesson-workflow";
import { getMissionProofChecklist } from "@/domain/progress";

const beginnerPythonSupportLessonIds = new Set([
  "lesson-python-values",
  "lesson-python-lists",
  "lesson-python-dicts",
  "lesson-python-list-of-dicts",
  "lesson-python-decisions",
  "lesson-python-loops",
  "lesson-python-foundation-capstone",
  "lesson-python-strings-cleanup",
  "lesson-python-functions"
]);

export default function LessonDetailScreen(): ReactElement {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lessonIdValue = typeof lessonId === "string" ? lessonId : "";
  const opensBeginnerPythonSupport = beginnerPythonSupportLessonIds.has(lessonIdValue);
  const lesson = findLesson(contentPack, lessonId);
  const { isCheckingOnboarding, needsOnboarding } = useOnboardingGate();
  const { isSaving, progress, recordCodeRun, submitQuiz } = useProgress();
  const [selectedChoiceIndexes, setSelectedChoiceIndexes] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState<LessonWorkflowStep>("read");
  const [practiceOutputs, setPracticeOutputs] = useState<Record<string, { output: string; running: boolean }>>({});
  const [practiceCodes, setPracticeCodes] = useState<Record<string, string>>({});

  const handleRunPractice = async (key: string, code: string) => {
    if (!lesson?.workshop.miniProject.runnerSpec) return;
    setPracticeOutputs((prev) => ({ ...prev, [key]: { output: "Executing code in sandbox...", running: true } }));
    try {
      const attempt = await runLessonSandbox(
        {
          language: lesson.workshop.miniProject.runnerSpec.language,
          instructions: "",
          starterCode: code,
          setupCode: "",
          visibleTests: [],
          hiddenTests: [],
          expectedOutput: [],
          timeoutMs: 5000,
          allowNetwork: false
        },
        `${lesson.id}-practice-${key}`,
        code,
        new Date().toISOString(),
        "run_file"
      );
      const combinedOutput = attempt.stdout + (attempt.stderr ? "\n" + attempt.stderr : "");
      setPracticeOutputs((prev) => ({
        ...prev,
        [key]: { output: combinedOutput || "(No output printed)", running: false }
      }));
    } catch (err) {
      setPracticeOutputs((prev) => ({
        ...prev,
        [key]: { output: String(err), running: false }
      }));
    }
  };

  useEffect(() => {
    if (lesson?.workshop.miniProject.runnerSpec.language) {
      preloadSandbox(lesson.workshop.miniProject.runnerSpec.language);
    }
  }, [lessonIdValue, lesson?.workshop.miniProject.runnerSpec.language]);

  useEffect(() => {
    if (!lesson) return;
    const initialCodes: Record<string, string> = {
      main: lesson.workshop.practice.starterCode,
    };
    lesson.workshop.practiceReps?.forEach((practiceRep, repIndex) => {
      initialCodes[`rep-${repIndex}`] = practiceRep.starterCode;
    });
    setPracticeCodes(initialCodes);
  }, [lesson]);

  if (isCheckingOnboarding) {
    return (
      <Screen eyebrow="Path setup" title="Loading lesson">
        <Panel accessibilityLabel="Loading lesson" accessibilityState={{ busy: true }}>
          <SectionTitle>Reading local profile</SectionTitle>
          <MutedText>Checking SQLite before opening the lesson.</MutedText>
        </Panel>
      </Screen>
    );
  }

  if (needsOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  if (!lesson) {
    return (
      <Screen eyebrow="Lesson" title="Lesson not found">
        <Panel>
          <BodyText>The requested lesson is not in the local content pack.</BodyText>
        </Panel>
      </Screen>
    );
  }

  const quiz = contentPack.quizzes.find((candidate) => candidate.id === lesson.quizId);
  const lessonDone = progress.completedLessonIds.includes(lesson.id);
  const miniProjectDone = progress.completedLessonMiniProjectIds.includes(lesson.id);
  const quizDone = quiz ? progress.completedQuizIds.includes(quiz.id) : false;
  const lessonProgressPercent = Math.round(((miniProjectDone ? 1 : 0) + (quizDone ? 1 : 0)) / 2 * 100);
  const latestQuizAttempt = quiz ? progress.quizAttempts.find((attempt) => attempt.quizId === quiz.id) : undefined;
  const latestCodeRun = progress.codeRunAttempts.find((attempt) => attempt.lessonId === lesson.id);
  const lessonCodeRunHistory = progress.codeRunAttempts.filter((attempt) => attempt.lessonId === lesson.id);
  const latestPassingCheckRun = progress.codeRunAttempts.find((attempt) => (
    attempt.lessonId === lesson.id
    && attempt.runMode === "run_checks"
    && attempt.passed
  ));
  const allQuestionsAnswered = quiz ? quiz.questions.every((_, index) => selectedChoiceIndexes[index] !== undefined) : false;
  const moduleItem = contentPack.modules.find((candidate) => candidate.id === lesson.moduleId);
  const moduleLessonIds = moduleItem?.lessonIds ?? [];
  const lessonPosition = moduleLessonIds.indexOf(lesson.id);
  const prevLessonId = lessonPosition > 0 ? moduleLessonIds[lessonPosition - 1] : undefined;
  const prevLesson = prevLessonId ? findLesson(contentPack, prevLessonId) : undefined;
  const nextLessonId = lessonPosition >= 0 ? moduleLessonIds[lessonPosition + 1] : undefined;
  const nextLesson = nextLessonId ? findLesson(contentPack, nextLessonId) : undefined;
  const parentTrack = moduleItem?.trackId ? contentPack.tracks.find((t) => t.id === moduleItem.trackId) : undefined;

  const workflow = deriveLessonWorkflow({
    currentStep,
    miniProjectDone,
    quizDone,
    lessonDone,
    hasQuiz: !!quiz,
    nextLessonId,
    allQuestionsAnswered
  });

  const handleCta = () => {
    const cta = workflow.cta;
    if (cta.disabled) return;

    if (cta.action === "navigate") {
      setCurrentStep(cta.targetStep);
    } else if (cta.action === "submit-quiz") {
      if (quiz) {
        submitQuiz(quiz, selectedChoiceIndexes);
      }
    } else if (cta.action === "next-lesson") {
      router.push({ pathname: "/lesson/[lessonId]", params: { lessonId: cta.lessonId } });
      setCurrentStep("read");
    } else if (cta.action === "module-complete") {
      router.push("/path");
    }
  };

  const renderCta = () => {
    const cta = workflow.cta;
    if (cta.action === "navigate" || cta.action === "submit-quiz") {
      return (
        <ButtonShell
          accessibilityHint="Continues to next step."
          disabled={cta.disabled || isSaving}
          onPress={handleCta}
          tone={cta.tone}
          style={{ marginTop: spacing.md }}
        >
          {cta.label}
        </ButtonShell>
      );
    }
    return null;
  };

  return (
    <Screen
      eyebrow={moduleItem && parentTrack ? `${parentTrack.title} > ${moduleItem.title}` : "Lesson"}
      title={lesson.title}
    >
      {/* Meta info */}
      <Panel style={styles.metaPanel}>
        <Row>
          <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text }}>
            {lesson.difficulty} · {lesson.estimatedMinutes} min · {lesson.workshop.language}
          </Text>
          {lessonDone ? <Text style={{ fontSize: 13, fontWeight: "700", color: colors.emerald }}>Complete</Text> : null}
        </Row>
        <ProgressBar label="Progress" value={lessonProgressPercent} />
      </Panel>

      {/* Step nav pills */}
      <Panel style={styles.navStrip}>
        <Row style={{ justifyContent: "center", gap: spacing.sm }}>
          <StepPill label="Read" isCurrent={currentStep === "read"} isComplete={workflow.completedSteps.includes("read")} onPress={() => setCurrentStep("read")} />
          <StepPill label="Code" isCurrent={currentStep === "code"} isComplete={workflow.completedSteps.includes("code")} onPress={() => workflow.unlockedSteps.includes("code") && setCurrentStep("code")} />
          <StepPill label="Check" isCurrent={currentStep === "check"} isComplete={workflow.completedSteps.includes("check")} onPress={() => workflow.unlockedSteps.includes("check") && setCurrentStep("check")} />
        </Row>
      </Panel>

      {/* READ step */}
      {currentStep === "read" && (
        <Panel>
          {lesson.depth ? (
            <ConceptCapsuleList capsules={lesson.depth.conceptCapsules} />
          ) : (
            <>
              <SectionTitle>Goal</SectionTitle>
              <BodyText>{lesson.workshop.miniProject.goal}</BodyText>
              <SectionTitle>Plain English</SectionTitle>
              <BodyText>{lesson.bodyMarkdown}</BodyText>
              <SectionTitle>Example</SectionTitle>
              <MutedText style={styles.codeBlock}>{lesson.workshop.workedExample}</MutedText>
              {lesson.workshop.codeShape ? (
                <View style={styles.practiceBlock}>
                  <SectionTitle>Shape</SectionTitle>
                  <Text selectable style={styles.codeBlock}>{lesson.workshop.codeShape}</Text>
                </View>
              ) : null}
              <SectionTitle>Why this matters</SectionTitle>
              <BodyText>{lesson.workshop.synopsis}</BodyText>
              <SectionTitle>Core concept</SectionTitle>
              <BodyText>{lesson.workshop.coreConcept}</BodyText>
              <SectionTitle>Guided exercise</SectionTitle>
              <BodyText>{lesson.workshop.guidedExercise}</BodyText>
              <MutedText>{lesson.workshop.missionConnection}</MutedText>
              {lesson.workshop.tools.length > 0 ? (
                <>
                  <SectionTitle>Tools you'll use</SectionTitle>
                  <Row style={{ gap: spacing.xs, flexWrap: "wrap" }}>
                    {lesson.workshop.tools.map((tool) => (
                      <Text key={tool} style={styles.toolTag}>{tool}</Text>
                    ))}
                  </Row>
                </>
              ) : null}
            </>
          )}
          {renderCta()}
        </Panel>
      )}

      {/* CODE step: practice + Code Lab merged */}
      {currentStep === "code" && (
        <>
          {/* Practice section */}
          <Panel>
            <SectionTitle>Try it</SectionTitle>
            {lesson.depth ? (
              <>
                <CodeWalkthrough notes={lesson.depth.codeWalkthrough} />
                <View style={styles.practiceBlock}>
                  <SectionTitle>Starter code</SectionTitle>
                  <TextInput
                    multiline
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.codeBlock, styles.practiceInput]}
                    value={practiceCodes["main"] ?? ""}
                    onChangeText={(text) => setPracticeCodes((prev) => ({ ...prev, main: text }))}
                  />
                  <ButtonShell
                    accessibilityHint="Runs the practice starter code in the sandbox."
                    disabled={practiceOutputs["main"]?.running}
                    onPress={() => handleRunPractice("main", practiceCodes["main"] ?? lesson.workshop.practice.starterCode)}
                    size="compact"
                    tone="teal"
                    variant="secondary"
                    style={{ alignSelf: "flex-start", marginVertical: spacing.xs }}
                  >
                    {practiceOutputs["main"]?.running ? "Running..." : "▶ Run code"}
                  </ButtonShell>
                  {practiceOutputs["main"]?.output ? (
                    <View>
                      <SectionTitle>Output</SectionTitle>
                      <Text style={styles.codeBlock}>{practiceOutputs["main"].output}</Text>
                    </View>
                  ) : null}
                </View>
                <GuidedEditList steps={lesson.depth.guidedEdits} />
                <ErrorClinic clinicItems={lesson.depth.errorClinic} />
              </>
            ) : (
              <>
                <BodyText>Before editing, predict what the starter code prints. Then change one line at a time and compare with the expected output.</BodyText>
                <View style={styles.practiceBlock}>
                  <SectionTitle>Starter code</SectionTitle>
                  <TextInput
                    multiline
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.codeBlock, styles.practiceInput]}
                    value={practiceCodes["main"] ?? ""}
                    onChangeText={(text) => setPracticeCodes((prev) => ({ ...prev, main: text }))}
                  />
                  <ButtonShell
                    accessibilityHint="Runs the practice starter code in the sandbox."
                    disabled={practiceOutputs["main"]?.running}
                    onPress={() => handleRunPractice("main", practiceCodes["main"] ?? lesson.workshop.practice.starterCode)}
                    size="compact"
                    tone="teal"
                    variant="secondary"
                    style={{ alignSelf: "flex-start", marginVertical: spacing.xs }}
                  >
                    {practiceOutputs["main"]?.running ? "Running..." : "▶ Run code"}
                  </ButtonShell>
                  {practiceOutputs["main"]?.output ? (
                    <View>
                      <SectionTitle>Output</SectionTitle>
                      <Text style={styles.codeBlock}>{practiceOutputs["main"].output}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.practiceBlock}>
                  <SectionTitle>Expected output</SectionTitle>
                  <Text selectable style={styles.codeBlock}>{lesson.workshop.practice.expectedOutput}</Text>
                </View>
                <View style={styles.practiceBlock}>
                  <SectionTitle>Check your answer</SectionTitle>
                  <BodyText>{lesson.workshop.practice.checkYourAnswer}</BodyText>
                </View>

                {lesson.workshop.commonMistakes.length > 0 && (
                  <SubPanel>
                    <SectionTitle>Common mistakes</SectionTitle>
                    {lesson.workshop.commonMistakes.map((mistake) => (
                      <MutedText key={mistake}>• {mistake}</MutedText>
                    ))}
                  </SubPanel>
                )}

                {lesson.workshop.practiceReps && lesson.workshop.practiceReps.length > 0 && (
                  <SubPanel style={styles.repsPanel}>
                    <Text style={{ fontSize: 13, fontWeight: "700", color: colors.teal }}>
                      {opensBeginnerPythonSupport ? "Required practice" : "Extra practice"}
                    </Text>
                    <SectionTitle>Practice variations</SectionTitle>
                    {lesson.workshop.practiceReps.map((practiceRep, repIndex) => {
                      const repKey = `rep-${repIndex}`;
                      return (
                        <View key={`${lesson.id}-practice-rep-${repIndex}`} style={styles.repBlock}>
                          <Text style={{ fontSize: 13, fontWeight: "700", color: colors.teal }}>
                            Variation {repIndex + 1}
                          </Text>
                          <TextInput
                            multiline
                            autoCapitalize="none"
                            autoCorrect={false}
                            style={[styles.codeBlock, styles.practiceInput]}
                            value={practiceCodes[repKey] ?? ""}
                            onChangeText={(text) => setPracticeCodes((prev) => ({ ...prev, [repKey]: text }))}
                          />
                          <ButtonShell
                            accessibilityHint={`Runs variation ${repIndex + 1} starter code.`}
                            disabled={practiceOutputs[repKey]?.running}
                            onPress={() => handleRunPractice(repKey, practiceCodes[repKey] ?? practiceRep.starterCode)}
                            size="compact"
                            tone="teal"
                            variant="secondary"
                            style={{ alignSelf: "flex-start", marginVertical: spacing.xs }}
                          >
                            {practiceOutputs[repKey]?.running ? "Running..." : `▶ Run code`}
                          </ButtonShell>
                          {practiceOutputs[repKey]?.output ? (
                            <View>
                              <SectionTitle>Output</SectionTitle>
                              <Text style={styles.codeBlock}>{practiceOutputs[repKey].output}</Text>
                            </View>
                          ) : null}
                          <SectionTitle>Expected output</SectionTitle>
                          <Text selectable style={styles.codeBlock}>{practiceRep.expectedOutput}</Text>
                          <SectionTitle>Check your answer</SectionTitle>
                          <BodyText>{practiceRep.checkYourAnswer}</BodyText>
                        </View>
                      );
                    })}
                  </SubPanel>
                )}
              </>
            )}
          </Panel>

          {/* Code Lab / mini-project section */}
          <Panel>
            <SectionTitle>Code project</SectionTitle>
            {lesson.depth ? (
              <CodeLabBridge bridge={lesson.depth.codeLabBridge} />
            ) : (
              <>
                <BodyText>{lesson.workshop.miniProject.goal}</BodyText>
                <SectionTitle>Build steps</SectionTitle>
                {lesson.workshop.miniProject.steps.map((step) => (
                  <MutedText key={step}>• {step}</MutedText>
                ))}
                <SectionTitle>Deliverables</SectionTitle>
                {lesson.workshop.miniProject.deliverables.map((deliverable) => (
                  <MutedText key={deliverable}>• {deliverable}</MutedText>
                ))}
              </>
            )}
            <CodeLab
              attemptHistory={lessonCodeRunHistory}
              isSaving={isSaving}
              latestRun={latestCodeRun}
              lessonId={lesson.id}
              onRunPassed={recordCodeRun}
              runnerSpec={lesson.workshop.miniProject.runnerSpec}
            />
            {latestPassingCheckRun ? (
              <SubPanel accessibilityLabel="Code Lab check passed" accessibilityLiveRegion="polite">
                <SectionTitle>✓ Passed — add to portfolio</SectionTitle>
                <BodyText>{lesson.workshop.miniProject.expectedEvidence}</BodyText>
                <MutedText>{lesson.workshop.miniProject.projectConnection}</MutedText>
                <Link href="/evidence" asChild>
                  <ButtonShell accessibilityHint="Opens evidence capture so this check can become portfolio evidence." tone="green">
                    Add evidence
                  </ButtonShell>
                </Link>
              </SubPanel>
            ) : (
              <SubPanel>
                <SectionTitle>Hint</SectionTitle>
                <MutedText>Make one small change, run the check, then inspect the exact pass or fail message before editing again.</MutedText>
              </SubPanel>
            )}
          </Panel>

          {renderCta()}
        </>
      )}

      {/* CHECK step: quiz + evidence + lesson completion */}
      {currentStep === "check" && (
        <View>
          {/* Recall cards */}
          <Panel>
            <SectionTitle>Review</SectionTitle>
            <BodyText>Use these prompts to keep the idea available without rereading everything.</BodyText>
            {lesson.workshop.recallCards.map((card) => (
              <SubPanel key={card.id}>
                <SectionTitle>{card.prompt}</SectionTitle>
                <MutedText>{card.answerHint}</MutedText>
              </SubPanel>
            ))}
            <SectionTitle>Mistake check</SectionTitle>
            {lesson.workshop.misconceptionChecks.map((check, checkIndex) => (
              <MutedText key={`${lesson.id}-misconception-${checkIndex}`}>• {check.checkPrompt}</MutedText>
            ))}
          </Panel>

          {/* Quiz */}
          {quiz ? (
            <Panel>
              <SectionTitle>{quiz.title}</SectionTitle>
              <BodyText>Confirm what you learned before moving on.</BodyText>
              {latestQuizAttempt ? (
                <View style={styles.statusBlock}>
                  <SectionTitle>{latestQuizAttempt.passed ? "Quiz passed" : "Quiz needs review"}</SectionTitle>
                  <BodyText>
                    {latestQuizAttempt.passed
                      ? "You passed. Retry to strengthen recall."
                      : "Review the explanations, revisit the lesson, then try again."}
                  </BodyText>
                </View>
              ) : null}
              {quiz.questions.map((question, questionIndex) => (
                <View key={question.id} style={styles.questionBlock}>
                  <Text style={{ fontSize: 13, fontWeight: "700", color: colors.teal }}>
                    {questionIndex + 1}/{quiz.questions.length}
                    {latestQuizAttempt ? latestQuizAttempt.selectedChoiceIndexes[questionIndex] === question.correctChoiceIndex ? " ✓" : " ✗" : null}
                  </Text>
                  <BodyText>{question.prompt}</BodyText>
                  {question.choices.map((choice, choiceIndex) => {
                    const submittedChoiceIndex = latestQuizAttempt?.selectedChoiceIndexes[questionIndex];
                    const selected = (selectedChoiceIndexes[questionIndex] ?? submittedChoiceIndex) === choiceIndex;
                    const submittedCorrect = latestQuizAttempt && choiceIndex === question.correctChoiceIndex;
                    const submittedWrongSelection = latestQuizAttempt && submittedChoiceIndex === choiceIndex && choiceIndex !== question.correctChoiceIndex;
                    const tone = submittedCorrect ? "green" : submittedWrongSelection ? "rose" : selected ? "ink" : "blue";

                    return (
                      <ButtonShell
                        accessibilityHint={`Selects answer ${choiceIndex + 1} for question ${questionIndex + 1}.`}
                        accessibilityLabel={choice}
                        key={choice}
                        onPress={() => {
                          setSelectedChoiceIndexes((currentSelections) => {
                            const nextSelections = [...currentSelections];
                            nextSelections[questionIndex] = choiceIndex;
                            return nextSelections;
                          });
                        }}
                        selected={selected}
                        tone={tone}
                      >
                        {choice}
                      </ButtonShell>
                    );
                  })}
                  {latestQuizAttempt ? (
                    <MutedText>
                      {latestQuizAttempt.selectedChoiceIndexes[questionIndex] === question.correctChoiceIndex ? "Why this works: " : "Review: "}
                      {question.explanation}
                    </MutedText>
                  ) : null}
                </View>
              ))}
              <ButtonShell
                accessibilityHint={allQuestionsAnswered ? "Scores this quiz attempt." : "Answer every question before submitting."}
                disabled={isSaving || !allQuestionsAnswered}
                onPress={() => submitQuiz(quiz, selectedChoiceIndexes)}
                selected={quizDone}
                tone={quizDone ? "ink" : "amber"}
                style={{ marginTop: spacing.sm }}
              >
                {quizDone ? "Submit another attempt" : "Submit quiz"}
              </ButtonShell>
            </Panel>
          ) : null}

          {renderCta()}

          {/* Lesson completion summary */}
          <Panel>
            <SectionTitle>Progress</SectionTitle>
            <ProgressBar label="Lesson" value={lessonProgressPercent} />
            <View style={styles.statusBlock} accessibilityLabel="Lesson progress requirements">
              <MutedText>
                {miniProjectDone ? "✓ Code complete" : "○ Code required"}
                {" · "}
                {quizDone ? "✓ Quiz passed" : "○ Quiz required"}
              </MutedText>
              <MutedText>{lessonDone ? "Review is now scheduled." : "Complete code and quiz above to finish the lesson."}</MutedText>
            </View>

            {(nextLesson || prevLesson) && (
              <Row style={{ justifyContent: "space-between", marginTop: spacing.md }}>
                {prevLesson ? (
                  <ButtonShell
                    accessibilityHint={`Go to previous lesson: ${prevLesson.title}`}
                    onPress={() => {
                      router.push({ pathname: "/lesson/[lessonId]", params: { lessonId: prevLesson.id } });
                      setCurrentStep("read");
                    }}
                    size="compact"
                    tone="ink"
                    variant="secondary"
                    style={{ flex: 1, marginRight: spacing.xs }}
                  >
                    ← Previous lesson
                  </ButtonShell>
                ) : <View style={{ flex: 1 }} />}
                {nextLesson ? (
                  <ButtonShell
                    accessibilityHint={`Go to next lesson: ${nextLesson.title}`}
                    onPress={() => {
                      router.push({ pathname: "/lesson/[lessonId]", params: { lessonId: nextLesson.id } });
                      setCurrentStep("read");
                    }}
                    size="compact"
                    tone="blue"
                    variant="secondary"
                    style={{ flex: 1, marginLeft: spacing.xs }}
                  >
                    Next lesson →
                  </ButtonShell>
                ) : <View style={{ flex: 1 }} />}
              </Row>
            )}
          </Panel>

          {/* Evidence section */}
          {(() => {
            const trackId = moduleItem?.trackId;
            const linkedMission = trackId ? contentPack.projectMissions.find((m) => m.trackId === trackId) : undefined;
            const checklist = linkedMission ? getMissionProofChecklist(progress, linkedMission) : [];

            return (
              <Panel>
                <SectionTitle>Portfolio</SectionTitle>
                <BodyText>Save your work to build your portfolio.</BodyText>
                <SubPanel>
                  <SectionTitle>Task</SectionTitle>
                  <BodyText>{lesson.desktopTask}</BodyText>
                  <MutedText>Prompt: {lesson.evidencePrompt}</MutedText>
                  <MutedText>Reflection: {lesson.workshop.reflectionPrompt}</MutedText>
                </SubPanel>
                {linkedMission ? (
                  <SubPanel>
                    <SectionTitle>Linked project: {linkedMission.title}</SectionTitle>
                    <BodyText style={{ fontSize: 13, color: colors.muted, marginBottom: spacing.xs }}>
                      Requirements needed to complete the project:
                    </BodyText>
                    {checklist.map((item) => (
                      <Row key={item.id} style={{ marginVertical: 2, alignItems: "center" }}>
                        <Text style={{ fontSize: 13, color: item.complete ? colors.emerald : colors.muted }}>
                          {item.complete ? "✓" : "○"} {item.label}{item.required ? " (Required)" : ""}
                        </Text>
                      </Row>
                    ))}
                  </SubPanel>
                ) : null}
                <Link href={{ pathname: "/evidence", params: { lessonId: lesson.id, prefill: "codelab" } }} asChild>
                  <ButtonShell accessibilityHint="Go to evidence log." tone="green" style={{ marginTop: spacing.sm }}>
                    Go to portfolio
                  </ButtonShell>
                </Link>
              </Panel>
            );
          })()}
        </View>
      )}
    </Screen>
  );
}

function StepPill({ label, isCurrent, isComplete, onPress }: { label: string; isCurrent: boolean; isComplete: boolean; onPress: () => void }): ReactElement {
  return (
    <ButtonShell
      onPress={onPress}
      size="compact"
      selected={isCurrent}
      tone={isCurrent ? "blue" : isComplete ? "green" : "ink"}
      variant={isCurrent ? "primary" : "secondary"}
      style={{ flexGrow: 0, minWidth: 80 }}
    >
      {isComplete ? "✓ " : ""}{label}
    </ButtonShell>
  );
}

const styles = StyleSheet.create({
  metaPanel: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    marginBottom: spacing.xs
  },
  navStrip: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.xs
  },
  questionBlock: {
    borderColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.md,
    marginVertical: spacing.xs
  },
  practiceBlock: {
    gap: spacing.xs,
    marginVertical: spacing.xs
  },
  repsPanel: {
    marginTop: spacing.md
  },
  repBlock: {
    borderColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingTop: spacing.md,
    marginTop: spacing.md
  },
  statusBlock: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md,
    marginVertical: spacing.sm
  },
  codeBlock: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontFamily: "monospace",
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 19,
    padding: spacing.md,
    marginVertical: spacing.xs
  },
  practiceInput: {
    minHeight: 100,
    textAlignVertical: "top"
  },
  toolTag: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.teal,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2
  }
});
