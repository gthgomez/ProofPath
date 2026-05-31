import { Link, Redirect, useLocalSearchParams } from "expo-router";
import type { ReactElement } from "react";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { contentPack } from "@/content/seed";
import { findLesson } from "@/domain/content";
import { CodeLab } from "@/ui/code-lab";
import { Badge, BodyText, ButtonShell, MutedText, Panel, ProgressBar, Row, Screen, SectionTitle, StickyActionBar, SubPanel } from "@/ui/primitives";
import { useOnboardingGate } from "@/ui/onboarding-guard";
import { useProgress } from "@/state/progress-provider";
import { colors, radius, spacing } from "@/ui/theme";

export default function LessonDetailScreen(): ReactElement {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = findLesson(contentPack, lessonId);
  const { isCheckingOnboarding, needsOnboarding } = useOnboardingGate();
  const { isSaving, progress, recordCodeRun, submitQuiz } = useProgress();
  const [selectedChoiceIndexes, setSelectedChoiceIndexes] = useState<number[]>([]);
  const [showConceptNotes, setShowConceptNotes] = useState(false);
  const [showCommonMistakes, setShowCommonMistakes] = useState(false);
  const [showFluencyReps, setShowFluencyReps] = useState(false);

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
  const stickyActionLabel = lessonDone
    ? "Lesson complete"
    : canCompleteLesson
      ? "Saving progress"
      : quiz && !quizDone
        ? allQuestionsAnswered
          ? "Submit checkpoint"
          : "Answer checkpoint"
        : "Run Code Lab";
  const stickyActionDisabled = isSaving
    || lessonDone
    || canCompleteLesson
    || (quiz && !quizDone && !allQuestionsAnswered)
    || (quizDone && !miniProjectDone)
    || (!quiz && !canCompleteLesson);
  const stickyActionHint = lessonDone
    ? "This lesson is already complete."
    : canCompleteLesson
      ? "The app marks this lesson complete automatically from verified Code Lab and checkpoint progress."
      : quiz && !quizDone
        ? allQuestionsAnswered
          ? "Scores this checkpoint attempt."
          : "Answer every checkpoint question before submitting."
        : "Use the Code Lab in the lesson before finishing.";

  return (
    <Screen
      eyebrow="Lesson"
      stickyAction={(
        <StickyActionBar accessibilityLabel="Persistent lesson action">
          <ButtonShell
            accessibilityHint={stickyActionHint}
            disabled={stickyActionDisabled}
            onPress={() => {
              if (lessonDone) {
                return;
              }

              if (quiz && !quizDone && allQuestionsAnswered) {
                submitQuiz(quiz, selectedChoiceIndexes);
              }
            }}
            tone={canCompleteLesson ? "green" : quizDone ? "amber" : "blue"}
            variant={canCompleteLesson || (quiz && !quizDone && allQuestionsAnswered) ? "primary" : "secondary"}
          >
            {stickyActionLabel}
          </ButtonShell>
        </StickyActionBar>
      )}
      title={lesson.title}
    >
      <Panel>
        <Row>
          <Badge tone="blue">{lesson.difficulty}</Badge>
          <Badge tone="teal">{lesson.estimatedMinutes} min</Badge>
          <Badge tone="amber">{lesson.workshop.language}</Badge>
          {moduleItem && lessonPosition >= 0 ? <Badge tone="blue">part {lessonPosition + 1}/{moduleLessonIds.length}</Badge> : null}
          {lessonDone ? <Badge tone="green">complete</Badge> : null}
        </Row>
        <SectionTitle>Before coding: goal</SectionTitle>
        <BodyText>{lesson.workshop.miniProject.goal}</BodyText>
        <SectionTitle>Plain-English version</SectionTitle>
        <BodyText>{lesson.bodyMarkdown}</BodyText>
        <SectionTitle>Tiny example</SectionTitle>
        <MutedText>{lesson.workshop.workedExample}</MutedText>
        {lesson.workshop.codeShape ? (
          <View style={styles.practiceBlock}>
            <SectionTitle>What to type shape</SectionTitle>
            <Text selectable style={styles.codeBlock}>{lesson.workshop.codeShape}</Text>
          </View>
        ) : null}
        <SectionTitle>Why this lesson exists</SectionTitle>
        <BodyText>{lesson.workshop.synopsis}</BodyText>
        <SectionTitle>How you will prove it</SectionTitle>
        <BodyText>Make the Code Lab verifier pass, then pass a short checkpoint and keep the evidence.</BodyText>
        <Row>
          {lesson.workshop.tools.map((tool) => (
            <Badge key={tool} tone="teal">{tool}</Badge>
          ))}
        </Row>
        <ProgressBar label="Lesson progress" value={lessonProgressPercent} />
        <View
          accessible
          accessibilityLabel={`Lesson flow: Learn, Code Lab ${miniProjectDone ? "complete" : "pending"}, Checkpoint ${quizDone ? "complete" : "pending"}, Evidence`}
          style={styles.stepFlow}
        >
          <Row>
            <Badge tone="blue">Learn</Badge>
            <MutedText>-&gt;</MutedText>
            <Badge tone={miniProjectDone ? "green" : "amber"}>Code Lab</Badge>
            <MutedText>-&gt;</MutedText>
            <Badge tone={quizDone ? "green" : "amber"}>Checkpoint</Badge>
            <MutedText>-&gt;</MutedText>
            <Badge tone={latestPassingCheckRun ? "green" : "teal"}>Evidence</Badge>
          </Row>
        </View>
        <MutedText>
          {lessonDone
            ? "Lesson complete: Code Lab proof and checkpoint are both done."
            : "This lesson completes itself after the Code Lab verifier passes and the checkpoint is passed."}
        </MutedText>
      </Panel>

      <Panel>
        <Row>
          <Badge tone="blue">Step 1</Badge>
          <Badge tone="green">practice first</Badge>
        </Row>
        <SectionTitle>Try this first</SectionTitle>
        <BodyText>Before editing, predict what the starter code prints. Then change one line at a time and compare the result with the expected output.</BodyText>
        <View style={styles.practiceBlock}>
          <SectionTitle>Starter code</SectionTitle>
          <Text selectable style={styles.codeBlock}>{lesson.workshop.practice.starterCode}</Text>
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
              <MutedText key={mistake}>{mistake}</MutedText>
            ))}
          </SubPanel>
        ) : null}
      </Panel>

      <Panel>
        <Row>
          <Badge tone="blue">Step 2</Badge>
          <Badge tone={miniProjectDone ? "green" : "amber"}>{miniProjectDone ? "proof captured" : "code lab"}</Badge>
          <Badge tone="teal">offline verifier</Badge>
        </Row>
        <SectionTitle>Code Lab: {lesson.workshop.miniProject.title}</SectionTitle>
        <BodyText>{lesson.workshop.miniProject.goal}</BodyText>
        <SectionTitle>Build steps</SectionTitle>
        {lesson.workshop.miniProject.steps.map((step) => (
          <MutedText key={step}>{step}</MutedText>
        ))}
        <SectionTitle>Deliverables</SectionTitle>
        {lesson.workshop.miniProject.deliverables.map((deliverable) => (
          <MutedText key={deliverable}>{deliverable}</MutedText>
        ))}
        <SectionTitle>Verifier</SectionTitle>
        <Text selectable style={styles.codeBlock}>{lesson.workshop.miniProject.verifierCommand}</Text>
        <SectionTitle>Expected output</SectionTitle>
        <BodyText>{lesson.workshop.testingFocus}</BodyText>
        <MutedText>If you see a final passed line, that is the verifier confirming your code. Only print it yourself when the lesson explicitly asks you to.</MutedText>
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
          <SubPanel accessibilityLabel="Code Lab proof captured" accessibilityLiveRegion="polite">
            <Row>
              <Badge tone="green">Proof captured</Badge>
              <Badge tone="amber">Mission closer</Badge>
            </Row>
            <SectionTitle>Add evidence now</SectionTitle>
            <BodyText>{lesson.workshop.miniProject.expectedEvidence}</BodyText>
            <MutedText>{lesson.workshop.miniProject.projectConnection}</MutedText>
            <Link href="/evidence" asChild>
              <ButtonShell accessibilityHint="Opens evidence capture so this passing verifier can become portfolio proof." tone="green">
                Add evidence now
              </ButtonShell>
            </Link>
          </SubPanel>
        ) : (
          <SubPanel>
            <SectionTitle>Focused hint</SectionTitle>
            <MutedText>Make one small change, run the verifier, then inspect the exact pass or fail message before editing again.</MutedText>
          </SubPanel>
        )}
        {nextLesson ? <MutedText>Next lesson connection: this prepares you for {nextLesson.title}.</MutedText> : null}
      </Panel>

      <Panel>
        <Row>
          <Badge tone="blue">Step 3</Badge>
          <Badge tone="teal">learn deeper</Badge>
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
            <SectionTitle>Before you start</SectionTitle>
            {lesson.workshop.prerequisites.map((prerequisite) => (
              <MutedText key={prerequisite}>{prerequisite}</MutedText>
            ))}
          </View>
        ) : null}
      </Panel>

      {lesson.workshop.practiceReps && lesson.workshop.practiceReps.length > 0 ? (
        <SubPanel>
          <Row>
            <Badge tone="teal">optional reps</Badge>
          </Row>
          <SectionTitle>After the first task: fluency reps</SectionTitle>
          <BodyText>Do these small variations when you want more confidence before the checkpoint.</BodyText>
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
          {showFluencyReps ? lesson.workshop.practiceReps.map((practiceRep, repIndex) => (
              <View key={`${lesson.id}-practice-rep-${repIndex}`} style={styles.repBlock}>
                <Row>
                  <Badge tone="teal">rep {repIndex + 1}</Badge>
                  <Badge tone="blue">same idea, new data</Badge>
                </Row>
                <SectionTitle>Starter code</SectionTitle>
                <Text selectable style={styles.codeBlock}>{practiceRep.starterCode}</Text>
                <SectionTitle>Expected output</SectionTitle>
                <Text selectable style={styles.codeBlock}>{practiceRep.expectedOutput}</Text>
                <SectionTitle>Check your answer</SectionTitle>
                <BodyText>{practiceRep.checkYourAnswer}</BodyText>
              </View>
            )) : null}
        </SubPanel>
      ) : null}

      {quiz ? (
        <Panel>
          <Row>
            <Badge tone="blue">Step 4</Badge>
            <Badge tone={quizDone ? "green" : "amber"}>{quizDone ? "passed" : `${quiz.passingScore}% target`}</Badge>
            {latestQuizAttempt ? <Badge tone={latestQuizAttempt.passed ? "green" : "rose"}>{latestQuizAttempt.score}% last</Badge> : null}
            <Badge tone="blue">{answeredCount}/{quiz.questions.length} answered</Badge>
          </Row>
          <SectionTitle>After coding: {quiz.title}</SectionTitle>
          <BodyText>Use this checkpoint to confirm the idea before you build. The quiz is not the lesson; it is a quick readiness check for the project.</BodyText>
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

      <Panel>
        <Row>
          <Badge tone="blue">Step 5</Badge>
          <Badge tone={quizDone ? "green" : "amber"}>{quizDone ? "quiz passed" : "quiz required"}</Badge>
          <Badge tone={miniProjectDone ? "green" : "amber"}>{miniProjectDone ? "project complete" : "project required"}</Badge>
          {lessonDone ? <Badge tone="green">lesson complete</Badge> : null}
        </Row>
        <SectionTitle>Lesson progress</SectionTitle>
        <BodyText>
          {lessonDone
            ? "This lesson is complete from real activity: a passing Code Lab run and a passed checkpoint."
            : "No manual marking here. Progress updates automatically when the verifier and checkpoint are both complete."}
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
      </Panel>
    </Screen>
  );
}

const styles = StyleSheet.create({
  questionBlock: {
    borderColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.md
  },
  practiceBlock: {
    gap: spacing.xs
  },
  disclosureBlock: {
    gap: spacing.sm
  },
  repBlock: {
    borderColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.xs,
    paddingTop: spacing.md
  },
  statusBlock: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.md
  },
  stepFlow: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm
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
    padding: spacing.md
  },
  input: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 20,
    padding: spacing.md,
    textAlignVertical: "top"
  },
  tallInput: {
    minHeight: 160
  },
  terminalInput: {
    fontFamily: "monospace",
    minHeight: 120
  }
});
