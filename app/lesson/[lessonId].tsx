import { Link, Redirect, router, useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { contentPack } from "@/content/seed";
import { findLesson } from "@/domain/content";
import { CodeLab } from "@/ui/code-lab";
import { Badge, BodyText, ButtonShell, MutedText, Panel, ProgressBar, Row, Screen, SectionTitle, StickyActionBar, SubPanel } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { useProgress } from "@/state/progress-provider";
import { colors, radius, spacing } from "@/ui/theme";
import { preloadSandbox, runLessonSandbox } from "@/sandbox/runner";
import { deriveLessonWorkflow, type LessonWorkflowStep, STEPS } from "@/domain/lesson-workflow";
import { getMissionProofChecklist } from "@/domain/progress";

const beginnerPythonSupportLessonIds = new Set([
  "lesson-python-values",
  "lesson-python-collections",
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
  const [showConceptNotes, setShowConceptNotes] = useState(opensBeginnerPythonSupport);
  const [showCommonMistakes, setShowCommonMistakes] = useState(false);
  const [showFluencyReps, setShowFluencyReps] = useState(opensBeginnerPythonSupport);
  const [currentStep, setCurrentStep] = useState<LessonWorkflowStep>("understand");
  const [practiceOutputs, setPracticeOutputs] = useState<Record<string, { output: string; running: boolean }>>({});

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
    setShowConceptNotes(opensBeginnerPythonSupport);
    setShowFluencyReps(opensBeginnerPythonSupport);
    if (lesson?.workshop.miniProject.runnerSpec.language) {
      preloadSandbox(lesson.workshop.miniProject.runnerSpec.language);
    }
  }, [lessonIdValue, opensBeginnerPythonSupport, lesson?.workshop.miniProject.runnerSpec.language]);

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
  const canCompleteLesson = miniProjectDone && quizDone;
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
  const answeredCount = quiz ? quiz.questions.filter((_, index) => selectedChoiceIndexes[index] !== undefined).length : 0;
  const moduleItem = contentPack.modules.find((candidate) => candidate.id === lesson.moduleId);
  const moduleLessonIds = moduleItem?.lessonIds ?? [];
  const lessonPosition = moduleLessonIds.indexOf(lesson.id);
  const nextLessonId = lessonPosition >= 0 ? moduleLessonIds[lessonPosition + 1] : undefined;
  const nextLesson = nextLessonId ? findLesson(contentPack, nextLessonId) : undefined;
  const fluencyRepTone = opensBeginnerPythonSupport ? "green" : "teal";
  const fluencyRepLabel = opensBeginnerPythonSupport ? "guided reps" : "optional reps";
  
  const workflow = deriveLessonWorkflow({
    currentStep,
    miniProjectDone,
    quizDone,
    lessonDone,
    hasQuiz: !!quiz,
    nextLessonId,
    allQuestionsAnswered
  });

  const handleStickyPress = () => {
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
      setCurrentStep("understand");
    } else if (cta.action === "module-complete") {
      router.push("/path");
    }
  };

  return (
    <Screen
      eyebrow="Lesson"
      stickyAction={(
        <StickyActionBar accessibilityLabel="Persistent lesson action">
          <ButtonShell
            accessibilityHint="Executes the primary workflow step action."
            disabled={workflow.cta.disabled || isSaving}
            onPress={handleStickyPress}
            tone={workflow.cta.tone}
            variant={workflow.cta.disabled ? "secondary" : "primary"}
          >
            {workflow.cta.label}
          </ButtonShell>
        </StickyActionBar>
      )}
      title={lesson.title}
    >
      {/* Stepper Wizard Header */}
      <Panel style={styles.tabContainer}>
        <Row style={styles.tabRow}>
          {STEPS.map((step, idx) => {
            const isCompleted = workflow.completedSteps.includes(step);
            const isCurrent = workflow.currentStep === step;
            const isUnlocked = workflow.unlockedSteps.includes(step);
            const stepNum = idx + 1;
            const stepLabel = step === "apply" ? "Code Lab" : step.charAt(0).toUpperCase() + step.slice(1);
            
            return (
              <ButtonShell
                key={step}
                disabled={!isUnlocked}
                onPress={() => setCurrentStep(step)}
                selected={isCurrent}
                size="compact"
                style={styles.tabButton}
                tone={isCurrent ? "blue" : isCompleted ? "green" : "ink"}
                variant={isCurrent ? "primary" : "secondary"}
                accessibilityLabel={`${stepLabel} step`}
                accessibilityHint={isUnlocked ? `Go to step ${stepNum}: ${stepLabel}` : `Step ${stepNum} is locked.`}
              >
                {isCompleted ? "✓" : stepNum}
              </ButtonShell>
            );
          })}
        </Row>
      </Panel>

      {/* Progress & Quick Badges */}
      <Panel style={styles.metaPanel}>
        <Row style={{ justifyContent: "center", marginBottom: spacing.xs }}>
          <Text style={styles.stepTitle}>
            Step {workflow.stepIndex + 1} of 5: {workflow.currentStep === "apply" ? "CODE LAB" : workflow.currentStep.toUpperCase()}
          </Text>
        </Row>
        <Row>
          <Badge tone="blue">{lesson.difficulty}</Badge>
          <Badge tone="teal">{lesson.estimatedMinutes} min</Badge>
          <Badge tone="amber">{lesson.workshop.language}</Badge>
          {moduleItem && lessonPosition >= 0 ? <Badge tone="blue">part {lessonPosition + 1}/{moduleLessonIds.length}</Badge> : null}
          {lessonDone ? <Badge tone="green">complete</Badge> : null}
        </Row>
        <ProgressBar label="Lesson progress" value={lessonProgressPercent} />
      </Panel>

      {/* Understand Step Content */}
      {currentStep === "understand" && (
        <Panel>
          <SectionTitle>Before coding: goal</SectionTitle>
          <BodyText>{lesson.workshop.miniProject.goal}</BodyText>
          <SectionTitle>Plain-English version</SectionTitle>
          <BodyText>{lesson.bodyMarkdown}</BodyText>
          <SectionTitle>Tiny example</SectionTitle>
          <MutedText style={styles.codeBlock}>{lesson.workshop.workedExample}</MutedText>
          {lesson.workshop.codeShape ? (
            <View style={styles.practiceBlock}>
              <SectionTitle>What to type shape</SectionTitle>
              <Text selectable style={styles.codeBlock}>{lesson.workshop.codeShape}</Text>
            </View>
          ) : null}
          <SectionTitle>Why this lesson exists</SectionTitle>
          <BodyText>{lesson.workshop.synopsis}</BodyText>
          <SectionTitle>Before you start</SectionTitle>
          <Row style={styles.badgeRow}>
            {lesson.workshop.tools.map((tool) => (
              <Badge key={tool} tone="teal">{tool}</Badge>
            ))}
          </Row>
          
          <SectionTitle>Concept notes</SectionTitle>
          <BodyText>{lesson.workshop.objective}</BodyText>
          <ButtonShell
            accessibilityHint={showConceptNotes ? "Hides deeper explanation and prerequisites." : "Shows deeper explanation and prerequisites."}
            accessibilityState={{ expanded: showConceptNotes }}
            onPress={() => setShowConceptNotes((current) => !current)}
            size="compact"
            tone="ink"
            variant="tertiary"
          >
            {showConceptNotes ? "Hide explanation" : "Show explanation"}
          </ButtonShell>
          {showConceptNotes ? (
            <View style={styles.disclosureBlock}>
              <SectionTitle>Why it matters</SectionTitle>
              <BodyText>{lesson.workshop.whyItMatters}</BodyText>
              <SectionTitle>Core concept</SectionTitle>
              <BodyText>{lesson.workshop.coreConcept}</BodyText>
              <SectionTitle>Guided exercise</SectionTitle>
              <BodyText>{lesson.workshop.guidedExercise}</BodyText>
              <MutedText>{lesson.workshop.missionConnection}</MutedText>
              <SectionTitle>Prerequisites</SectionTitle>
              {lesson.workshop.prerequisites.map((prerequisite) => (
                <MutedText key={prerequisite}>• {prerequisite}</MutedText>
              ))}
            </View>
          ) : null}

          {/* Stepper Navigation */}
          <Row style={styles.navRow}>
            <View style={styles.navButtonPlaceholder} />
            {workflow.canNavigateForward ? (
              <ButtonShell
                accessibilityHint="Continue to Practice step."
                onPress={() => setCurrentStep("experiment")}
                tone="blue"
                variant="secondary"
                style={styles.navButton}
              >
                Continue to Practice →
              </ButtonShell>
            ) : null}
          </Row>
        </Panel>
      )}

      {/* Experiment Step Content */}
      {currentStep === "experiment" && (
        <Panel>
          <Row>
            <Badge tone="blue">Step 2</Badge>
            <Badge tone="green">practice first</Badge>
          </Row>
          <SectionTitle>Try this first</SectionTitle>
          <BodyText>Before editing, predict what the starter code prints. Then change one line at a time and compare the result with the expected output.</BodyText>
          <View style={styles.practiceBlock}>
            <SectionTitle>Starter code</SectionTitle>
            <Text selectable style={styles.codeBlock}>{lesson.workshop.practice.starterCode}</Text>
            
            {/* Run example button */}
            <ButtonShell
              accessibilityHint="Runs the practice starter code in the sandbox."
              disabled={practiceOutputs["main"]?.running}
              onPress={() => handleRunPractice("main", lesson.workshop.practice.starterCode)}
              size="compact"
              tone="teal"
              variant="secondary"
              style={{ alignSelf: "flex-start", marginVertical: spacing.xs }}
            >
              {practiceOutputs["main"]?.running ? "Running..." : "▶ Run starter code"}
            </ButtonShell>
            {practiceOutputs["main"]?.output ? (
              <View>
                <SectionTitle>Starter output</SectionTitle>
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
          
          <ButtonShell
            accessibilityHint={showCommonMistakes ? "Hides common beginner mistakes." : "Shows common beginner mistakes."}
            accessibilityState={{ expanded: showCommonMistakes }}
            onPress={() => setShowCommonMistakes((current) => !current)}
            size="compact"
            tone="ink"
            variant="tertiary"
          >
            {showCommonMistakes ? "Hide common mistakes" : "Show common mistakes"}
          </ButtonShell>
          {showCommonMistakes ? (
            <SubPanel>
              <SectionTitle>Common mistakes</SectionTitle>
              {lesson.workshop.commonMistakes.map((mistake) => (
                <MutedText key={mistake}>• {mistake}</MutedText>
              ))}
            </SubPanel>
          ) : null}

          {lesson.workshop.practiceReps && lesson.workshop.practiceReps.length > 0 ? (
            <SubPanel style={styles.repsPanel}>
              <Row>
                <Badge tone={fluencyRepTone}>{fluencyRepLabel}</Badge>
              </Row>
              <SectionTitle>Fluency reps</SectionTitle>
              <BodyText>
                {opensBeginnerPythonSupport
                  ? "Do these small variations before the checkpoint so the syntax becomes familiar instead of one copied answer."
                  : "Do these small variations when you want more confidence before the checkpoint."}
              </BodyText>
              <ButtonShell
                accessibilityHint={showFluencyReps ? "Hides fluency reps." : "Shows fluency reps."}
                accessibilityState={{ expanded: showFluencyReps }}
                onPress={() => setShowFluencyReps((current) => !current)}
                size="compact"
                tone="ink"
                variant="tertiary"
              >
                {showFluencyReps ? "Hide reps" : `Show ${lesson.workshop.practiceReps.length} reps`}
              </ButtonShell>
              {showFluencyReps ? lesson.workshop.practiceReps.map((practiceRep, repIndex) => {
                const repKey = `rep-${repIndex}`;
                return (
                  <View key={`${lesson.id}-practice-rep-${repIndex}`} style={styles.repBlock}>
                    <Row>
                      <Badge tone="teal">rep {repIndex + 1}</Badge>
                      <Badge tone="blue">same idea, new data</Badge>
                    </Row>
                    <SectionTitle>Starter code</SectionTitle>
                    <Text selectable style={styles.codeBlock}>{practiceRep.starterCode}</Text>
                    
                    {/* Run example button */}
                    <ButtonShell
                      accessibilityHint={`Runs fluency rep ${repIndex + 1} starter code in the sandbox.`}
                      disabled={practiceOutputs[repKey]?.running}
                      onPress={() => handleRunPractice(repKey, practiceRep.starterCode)}
                      size="compact"
                      tone="teal"
                      variant="secondary"
                      style={{ alignSelf: "flex-start", marginVertical: spacing.xs }}
                    >
                      {practiceOutputs[repKey]?.running ? "Running..." : `▶ Run rep ${repIndex + 1} code`}
                    </ButtonShell>
                    {practiceOutputs[repKey]?.output ? (
                      <View>
                        <SectionTitle>Rep output</SectionTitle>
                        <Text style={styles.codeBlock}>{practiceOutputs[repKey].output}</Text>
                      </View>
                    ) : null}
                    
                    <SectionTitle>Expected output</SectionTitle>
                    <Text selectable style={styles.codeBlock}>{practiceRep.expectedOutput}</Text>
                    <SectionTitle>Check your answer</SectionTitle>
                    <BodyText>{practiceRep.checkYourAnswer}</BodyText>
                  </View>
                );
              }) : null}
            </SubPanel>
          ) : null}

          {/* Stepper Navigation */}
          <Row style={styles.navRow}>
            <ButtonShell
              accessibilityHint="Go back to Understand step."
              onPress={() => setCurrentStep("understand")}
              tone="ink"
              variant="secondary"
              style={styles.navButton}
            >
              ← Back
            </ButtonShell>
            {workflow.canNavigateForward ? (
              <ButtonShell
                accessibilityHint="Continue to Code Lab step."
                onPress={() => setCurrentStep("apply")}
                tone="blue"
                variant="secondary"
                style={styles.navButton}
              >
                Continue to Code Lab →
              </ButtonShell>
            ) : null}
          </Row>
        </Panel>
      )}

      {/* Apply Step Content (display: none/flex to preserve editor states) */}
      <View style={{ display: currentStep === "apply" ? "flex" : "none" }}>
        <Panel>
          <Row>
            <Badge tone="blue">Step 3</Badge>
            <Badge tone={miniProjectDone ? "green" : "amber"}>{miniProjectDone ? "check passed" : "code lab"}</Badge>
            <Badge tone="teal">offline check</Badge>
          </Row>
          <SectionTitle>Code Lab: {lesson.workshop.miniProject.title}</SectionTitle>
          <BodyText>{lesson.workshop.miniProject.goal}</BodyText>
          <SectionTitle>Build steps</SectionTitle>
          {lesson.workshop.miniProject.steps.map((step) => (
            <MutedText key={step}>• {step}</MutedText>
          ))}
          <SectionTitle>Deliverables</SectionTitle>
          {lesson.workshop.miniProject.deliverables.map((deliverable) => (
            <MutedText key={deliverable}>• {deliverable}</MutedText>
          ))}
          <SectionTitle>Check command</SectionTitle>
          <Text selectable style={styles.codeBlock}>{lesson.workshop.miniProject.verifierCommand}</Text>
          <SectionTitle>Expected output</SectionTitle>
          <BodyText>{lesson.workshop.testingFocus}</BodyText>
          <MutedText>If you see a final passed line, the app check confirmed your code. Only print it yourself when the lesson explicitly asks you to.</MutedText>
          {lesson.workshop.miniProject.runnerSpec.expectedOutput.length > 0 ? (
            <Text selectable style={styles.codeBlock}>{lesson.workshop.miniProject.runnerSpec.expectedOutput.join("\n")}</Text>
          ) : null}
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
              <Row>
                <Badge tone="green">Check passed</Badge>
                <Badge tone="amber">Mission closer</Badge>
              </Row>
              <SectionTitle>Add evidence now</SectionTitle>
              <BodyText>{lesson.workshop.miniProject.expectedEvidence}</BodyText>
              <MutedText>{lesson.workshop.miniProject.projectConnection}</MutedText>
              <Link href="/evidence" asChild>
                <ButtonShell accessibilityHint="Opens evidence capture so this passing check can become portfolio evidence." tone="green">
                  Add evidence now
                </ButtonShell>
              </Link>
            </SubPanel>
          ) : (
            <SubPanel>
              <SectionTitle>Focused hint</SectionTitle>
              <MutedText>Make one small change, run the check, then inspect the exact pass or fail message before editing again.</MutedText>
            </SubPanel>
          )}
          {nextLesson ? <MutedText>Next lesson connection: this prepares you for {nextLesson.title}.</MutedText> : null}

          {/* Stepper Navigation */}
          <Row style={styles.navRow}>
            <ButtonShell
              accessibilityHint="Go back to Practice step."
              onPress={() => setCurrentStep("experiment")}
              tone="ink"
              variant="secondary"
              style={styles.navButton}
            >
              ← Back
            </ButtonShell>
            {workflow.canNavigateForward ? (
              <ButtonShell
                accessibilityHint="Continue to Checkpoint step."
                onPress={() => setCurrentStep("checkpoint")}
                tone="blue"
                variant="secondary"
                style={styles.navButton}
              >
                Continue to Checkpoint →
              </ButtonShell>
            ) : null}
          </Row>
        </Panel>
      </View>

      {/* Checkpoint Step Content */}
      {currentStep === "checkpoint" && (
        <View>
          {/* Recall Cards */}
          <Panel>
            <Row>
              <Badge tone="blue">Recall cards</Badge>
            </Row>
            <BodyText>Use these prompts to keep the idea available without rereading everything.</BodyText>
            {lesson.workshop.recallCards.map((card) => (
              <SubPanel key={card.id}>
                <Row>
                  <Badge tone="teal">{card.type}</Badge>
                </Row>
                <SectionTitle>{card.prompt}</SectionTitle>
                <MutedText>{card.answerHint}</MutedText>
              </SubPanel>
            ))}
            <SectionTitle>Mistake check</SectionTitle>
            {lesson.workshop.misconceptionChecks.map((check, checkIndex) => (
              <MutedText key={`${lesson.id}-misconception-${checkIndex}`}>• {check.checkPrompt}</MutedText>
            ))}
          </Panel>

          {/* Quiz (Checkpoints) */}
          {quiz ? (
            <Panel>
              <Row>
                <Badge tone="blue">Checkpoint</Badge>
                <Badge tone={quizDone ? "green" : "amber"}>{quizDone ? "passed" : `${quiz.passingScore}% target`}</Badge>
                {latestQuizAttempt ? <Badge tone={latestQuizAttempt.passed ? "green" : "rose"}>{latestQuizAttempt.score}% last</Badge> : null}
                <Badge tone="blue">{answeredCount}/{quiz.questions.length} answered</Badge>
              </Row>
              <SectionTitle>After coding: {quiz.title}</SectionTitle>
              <BodyText>Use this checkpoint to confirm the idea before you build. The quiz is a quick readiness check for the project.</BodyText>
              {latestQuizAttempt ? (
                <View style={styles.statusBlock}>
                  <SectionTitle>{latestQuizAttempt.passed ? "Checkpoint passed" : "Checkpoint needs review"}</SectionTitle>
                  <BodyText>
                    {latestQuizAttempt.passed
                      ? "Your latest attempt passed. You can still retry to strengthen recall before building."
                      : "Review the marked explanations, revisit Step 1, then submit another attempt."}
                  </BodyText>
                </View>
              ) : null}
              {quiz.questions.map((question, questionIndex) => (
                <View key={question.id} style={styles.questionBlock}>
                  <Row>
                    <Badge tone="teal">Question {questionIndex + 1}/{quiz.questions.length}</Badge>
                    {latestQuizAttempt ? (
                      <Badge tone={latestQuizAttempt.selectedChoiceIndexes[questionIndex] === question.correctChoiceIndex ? "green" : "rose"}>
                        {latestQuizAttempt.selectedChoiceIndexes[questionIndex] === question.correctChoiceIndex ? "correct" : "review"}
                      </Badge>
                    ) : null}
                  </Row>
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
                accessibilityHint={allQuestionsAnswered ? "Scores this checkpoint attempt." : "Answer every question before submitting."}
                disabled={isSaving || !allQuestionsAnswered}
                onPress={() => submitQuiz(quiz, selectedChoiceIndexes)}
                selected={quizDone}
                tone={quizDone ? "ink" : "amber"}
              >
                {quizDone ? "Submit another attempt" : "Submit checkpoint"}
              </ButtonShell>
            </Panel>
          ) : null}

          {/* Lesson Completion Summary */}
          <Panel>
            <Row>
              <Badge tone="blue">Summary</Badge>
              <Badge tone={quizDone ? "green" : "amber"}>{quizDone ? "quiz passed" : "quiz required"}</Badge>
              <Badge tone={miniProjectDone ? "green" : "amber"}>{miniProjectDone ? "project complete" : "project required"}</Badge>
              {lessonDone ? <Badge tone="green">lesson complete</Badge> : null}
            </Row>
            <SectionTitle>Lesson progress</SectionTitle>
            <BodyText>
              {lessonDone
                ? "This lesson is complete from real activity: a passing Code Lab run and a passed checkpoint."
                : "No manual marking here. Progress updates automatically when the Code Lab check and checkpoint are both complete."}
            </BodyText>
            <ProgressBar label="Progress" value={lessonProgressPercent} />
            <SectionTitle>Portfolio extension</SectionTitle>
            <BodyText>{lesson.desktopTask}</BodyText>
            <MutedText>{lesson.evidencePrompt}</MutedText>
            <MutedText>{lesson.workshop.reflectionPrompt}</MutedText>
            <SubPanel accessibilityLabel="Lesson progress requirements">
              <Row>
                <Badge tone={miniProjectDone ? "green" : "rose"}>{miniProjectDone ? "Code Lab passed" : "Code Lab required"}</Badge>
                <Badge tone={quizDone ? "green" : "rose"}>{quizDone ? "Checkpoint passed" : "Checkpoint required"}</Badge>
              </Row>
              <MutedText>{lessonDone ? "Review is now scheduled for this lesson." : "Complete the missing activity above to finish the lesson."}</MutedText>
            </SubPanel>

            {/* Stepper Navigation */}
            <Row style={styles.navRow}>
              <ButtonShell
                accessibilityHint="Go back to Code Lab step."
                onPress={() => setCurrentStep("apply")}
                tone="ink"
                variant="secondary"
                style={styles.navButton}
              >
                ← Back
              </ButtonShell>
              {workflow.canNavigateForward ? (
                <ButtonShell
                  accessibilityHint="Continue to Evidence step."
                  onPress={() => setCurrentStep("evidence")}
                  tone="blue"
                  variant="secondary"
                  style={styles.navButton}
                >
                  Continue to Evidence →
                </ButtonShell>
              ) : null}
            </Row>
          </Panel>
        </View>
      )}

      {/* Evidence Step Content */}
      {currentStep === "evidence" && (() => {
        const trackId = moduleItem?.trackId;
        const linkedMission = trackId ? contentPack.projectMissions.find((m) => m.trackId === trackId) : undefined;
        const checklist = linkedMission ? getMissionProofChecklist(progress, linkedMission) : [];

        return (
          <Panel>
            <Row>
              <Badge tone="blue">Step 5</Badge>
              <Badge tone={lessonDone ? "green" : "amber"}>{lessonDone ? "Complete" : "Evidence checklist"}</Badge>
            </Row>
            <SectionTitle>Document your proof</SectionTitle>
            <BodyText>
              To complete the lesson and build portfolio credibility, save your proof. Prefill your passing verifier logs directly into the evidence tracker.
            </BodyText>
            
            <SubPanel>
              <SectionTitle>Portfolio task</SectionTitle>
              <BodyText>{lesson.desktopTask}</BodyText>
              <MutedText>Prompt: {lesson.evidencePrompt}</MutedText>
              <MutedText>Reflection: {lesson.workshop.reflectionPrompt}</MutedText>
            </SubPanel>

            {linkedMission ? (
              <SubPanel>
                <SectionTitle>Linked Mission Checklist: {linkedMission.title}</SectionTitle>
                <BodyText style={{ fontSize: 13, color: colors.muted, marginBottom: spacing.xs }}>
                  Evidence requirements needed to complete the mission:
                </BodyText>
                {checklist.map((item) => (
                  <Row key={item.id} style={{ marginVertical: 2, alignItems: "center" }}>
                    <View style={{ marginRight: 8 }}>
                      <Badge tone={item.complete ? "green" : "ink"}>
                        {item.complete ? "✓" : "✗"}
                      </Badge>
                    </View>
                    <Text style={{ fontSize: 13, color: item.complete ? colors.text : colors.muted }}>
                      {item.label} {item.required ? "(Required)" : ""}
                    </Text>
                  </Row>
                ))}
              </SubPanel>
            ) : null}

            <Link href={{ pathname: "/evidence", params: { lessonId: lesson.id, prefill: "codelab" } }} asChild>
              <ButtonShell accessibilityHint="Go to evidence log and prefill Code Lab check output." tone="green" style={{ marginVertical: spacing.sm }}>
                Go to Evidence Screen
              </ButtonShell>
            </Link>

            {/* Stepper Navigation */}
            <Row style={styles.navRow}>
              <ButtonShell
                accessibilityHint="Go back to Checkpoint step."
                onPress={() => setCurrentStep("checkpoint")}
                tone="ink"
                variant="secondary"
                style={styles.navButton}
              >
                ← Back
              </ButtonShell>
              <View style={styles.navButtonPlaceholder} />
            </Row>
          </Panel>
        );
      })()}
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    padding: spacing.xs,
    marginBottom: spacing.xs
  },
  tabRow: {
    justifyContent: "space-between",
    width: "100%"
  },
  tabButton: {
    flex: 1,
    marginHorizontal: 2,
    minHeight: 44
  },
  metaPanel: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    marginBottom: spacing.xs
  },
  badgeRow: {
    gap: spacing.xs,
    marginVertical: spacing.xs
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
  disclosureBlock: {
    gap: spacing.sm,
    marginTop: spacing.sm
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
  stepTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.text,
    textAlign: "center"
  },
  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    width: "100%"
  },
  navButton: {
    flex: 1,
    marginHorizontal: spacing.xs,
    minHeight: 44
  },
  navButtonPlaceholder: {
    flex: 1,
    marginHorizontal: spacing.xs
  }
});
