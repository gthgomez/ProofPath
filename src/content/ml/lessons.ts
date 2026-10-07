import type { Lesson, LessonPracticeBlock, Quiz } from "@/domain/types";
import { shuffleQuizChoices, workshop } from "../python/shared";

// ML Foundations track. Mirrors the python/level-N.ts split: this file owns the
// track's lessons and quizzes, and the shared builders in
// src/content/python/shared.ts do the rest.

const mlConfusionMatrixPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "const matrix = { tp: 8, fp: 2, fn: 5, tn: 20 };\nconsole.log(matrix.fn);",
    expectedOutput: "The matrix reports 5 false negatives.",
    checkYourAnswer: "False negatives are real positives the model missed. Ask what user harm happens when this number is high."
  },
  {
    starterCode: "const matrix = { tp: 12, fp: 6, fn: 1, tn: 30 };\nconsole.log(matrix.fp);",
    expectedOutput: "The matrix reports 6 false positives.",
    checkYourAnswer: "False positives are negative examples predicted positive. They matter when incorrect alerts or approvals are costly."
  },
  {
    starterCode: "const matrix = { tp: 9, fp: 1, fn: 9, tn: 40 };\nconsole.log(matrix.tp + matrix.fn);",
    expectedOutput: "18 actual positive examples",
    checkYourAnswer: "This rep ties the cells back to the data. Actual positives are true positives plus false negatives."
  }
];

export const mlLessons: Lesson[] = [
    {
      id: "lesson-ml-metrics",
      moduleId: "module-ml-core",
      slug: "ml-metrics",
      title: "Metrics Need Context",
      summary: "A model score is only useful when you know the split, metric, and failure cases.",
      bodyMarkdown: "Accuracy can hide weak spots. Always ask what was measured, what data was held out, and which examples failed.",
      estimatedMinutes: 7,
      difficulty: "foundation",
      skillIds: ["skill-ml-metrics", "skill-testing-debugging"],
      quizId: "quiz-ml-metrics",
      desktopTask: "Write a short model-card note for a toy classifier result.",
      evidencePrompt: "Capture the metric, sample size, and one known limitation.",
      workshop: workshop(
        "Explain one model result without overclaiming it.",
        "Practical AI work needs engineers who can read metrics and spot weak evidence.",
        "A metric needs context: split, sample size, target label, failure examples, and limits.",
        "Accuracy 92% on 50 examples is weaker than it sounds if the minority class only had 3 examples.",
        "Write a model-card note with metric, sample size, split, one failure, and one limitation.",
        "This prepares the ML Metrics Report mission.",
        "What would make this model result untrustworthy in production?",
        ["Reporting accuracy alone", "No failure example", "No sample-size context"],
        undefined,
        {
          language: "Machine learning evaluation",
          tools: ["model card note", "metrics", "sample results"],
          synopsis: "You are learning how to explain a model score with enough context that a reader knows what was measured and what could still fail.",
          prerequisites: ["Know that a model makes predictions on examples.", "Have a toy metric or sample result to describe."],
          testingFocus: "You will test whether the metric claim is honest by naming the split, sample size, failure example, and limitation."
        },
        {
          starterCode: "Metric: accuracy = 92%\nSample size: 50 examples\nSplit: held-out test set\nKnown failure: misses short notes with abbreviations\nLimit: minority class has 3 examples",
          expectedOutput: "A metric note that includes score, sample size, split, one failure example, and one limitation.",
          checkYourAnswer: "If the note only says 92% accuracy, it is not enough. Add the context a reviewer needs to judge the claim."
        },
        {
          title: "Write a model metric card",
          goal: "Turn one model score into an honest evaluation note with context and limits.",
          steps: ["Record the metric, sample size, and split", "Add one failure example", "Add one limitation and one next evaluation you would run"],
          deliverables: ["Metric card note", "Failure example", "Limitation and next-check note"],
          verifierCommand: "Review the note and confirm it includes score, split, sample size, failure, and limitation.",
          expectedEvidence: "A model-card style note that makes the metric claim inspectable.",
          projectConnection: "This is the mini version of the ML Metrics Report mission.",
          tester: {
            codeLabel: "Paste your metric card note",
            outputLabel: "Paste your checklist review",
            requiredCodeIncludes: ["accuracy", "sample size", "split", "failure", "limitation"],
          requiredOutputIncludes: ["score", "split", "sample size", "failure", "limitation"],
          successMessage: "Your metric card proof gives the score enough context to inspect.",
          failureMessage: "The tester needs metric context in the note and checklist output covering score, split, sample size, failure, and limitation."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "const metricCard = {\n  score: 'accuracy = 92%',\n  sampleSize: 50,\n  split: 'held-out test set',\n  failure: 'misses short notes with abbreviations',\n  limitation: 'minority class has 3 examples'\n};",
            visibleTests: [
              {
                id: "metric-card-has-context",
                name: "Metric card has context",
                code: "for (const key of ['score', 'sampleSize', 'split', 'failure', 'limitation']) {\n  if (!metricCard[key]) throw new Error(`missing ${key}`);\n}\nconsole.log('score split sample size failure limitation passed');",
                expectedOutputIncludes: ["score", "split", "sample size", "failure", "limitation"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["score", "split", "sample size", "failure", "limitation"]
          }
        }
      )
    },
    {
      id: "lesson-ml-confusion-matrix",
      moduleId: "module-ml-core",
      slug: "ml-confusion-matrix",
      title: "Confusion Matrices Reveal Failure Patterns",
      summary: "Count true positives, false positives, false negatives, and true negatives before trusting a model score.",
      bodyMarkdown: "Accuracy can look fine while one class fails badly. A confusion matrix shows which errors happened so the next evaluation can focus on the real weak spot.",
      estimatedMinutes: 11,
      difficulty: "foundation",
      skillIds: ["skill-ml-metrics", "skill-testing-debugging"],
      quizId: "quiz-ml-confusion-matrix",
      desktopTask: "Calculate a confusion matrix for six toy predictions and explain one failure pattern.",
      evidencePrompt: "Capture the counts, one derived metric, and a limitation of the tiny sample.",
      workshop: workshop(
        "Calculate a confusion matrix and use it to explain one model failure pattern.",
        "Practical ML evaluation starts with counts a reviewer can inspect before trusting summary metrics.",
        "For binary classification, true positives are positive examples predicted positive, false positives are negatives predicted positive, false negatives are positives predicted negative, and true negatives are negatives predicted negative.",
        "For labels [1, 1, 0, 0] and predictions [1, 0, 1, 0], the matrix has one true positive, one false negative, one false positive, and one true negative.",
        "Count TP, FP, FN, and TN for a tiny prediction list, then write one sentence about the failure pattern.",
        "This deepens the ML Metrics Report mission.",
        "Which error type would matter most if the model screened urgent support tickets?",
        ["Reporting only accuracy", "Swapping false positives and false negatives", "Ignoring sample size when interpreting counts"],
        undefined,
        {
          language: "Machine learning evaluation",
          tools: ["toy predictions", "confusion matrix", "metrics note"],
          synopsis: "You are learning how to inspect the kinds of mistakes a classifier makes instead of relying on one score.",
          prerequisites: ["Know that a classifier predicts labels.", "Know that evaluation compares predictions to true labels."],
          testingFocus: "You will test the count function against a tiny known example and then explain what the errors mean."
        },
        {
          starterCode: "const labels = [1, 1, 0, 0];\nconst predictions = [1, 0, 1, 0];\nconst matrix = countMatrix(labels, predictions);\nconsole.log(matrix);",
          expectedOutput: "{ tp: 1, fp: 1, fn: 1, tn: 1 } plus a short note about the sample being too small for broad claims.",
          checkYourAnswer: "Check one row at a time. If an actual positive was predicted negative, that is a false negative, not a false positive."
        },
        {
          title: "Count classifier errors",
          goal: "Build a tiny confusion-matrix counter and explain one error pattern from the counts.",
          steps: ["Write countMatrix(labels, predictions)", "Verify the known four-example case", "Write one limitation about sample size"],
          deliverables: ["Count function", "Matrix output", "Failure-pattern note"],
          verifierCommand: "Run the Code Lab check or a local test.",
          expectedEvidence: "Matrix output with TP, FP, FN, and TN counts plus a short limitation note about what the tiny sample cannot prove.",
          projectConnection: "This is the error-analysis slice for the ML Metrics Report mission.",
          tester: {
            codeLabel: "Paste your confusion matrix function and note",
            outputLabel: "Paste check output",
            requiredCodeIncludes: ["tp", "fp", "fn", "tn"],
            requiredOutputIncludes: ["passed"],
            successMessage: "Your ML evaluation proof shows the error counts behind the metric.",
            failureMessage: "The tester needs TP/FP/FN/TN code plus check output."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "function countMatrix(labels, predictions) {\n  return { tp: 0, fp: 0, fn: 0, tn: 0 };\n}\n\nconst matrix = countMatrix([1, 1, 0, 0], [1, 0, 1, 0]);",
            visibleTests: [
              {
                id: "counts-confusion-matrix",
                name: "Counts binary confusion matrix",
                code: "if (matrix.tp !== 1 || matrix.fp !== 1 || matrix.fn !== 1 || matrix.tn !== 1) throw new Error('matrix counts are wrong');\nconst second = countMatrix([1, 0, 0, 1, 1], [1, 0, 0, 0, 1]);\nif (second.tp !== 2 || second.fp !== 0 || second.fn !== 1 || second.tn !== 2) throw new Error('second matrix counts are wrong');\nconsole.log('confusion matrix passed');",
                expectedOutputIncludes: ["confusion matrix", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["confusion matrix", "passed"]
          }
        }
        ,
        mlConfusionMatrixPracticeReps
      )
    }
];

export const mlQuizzes: Quiz[] = [
      {
      id: "quiz-ml-metrics",
      lessonId: "lesson-ml-metrics",
      title: "ML metrics checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-ml-1",
          prompt: "Why can accuracy be misleading?",
          choices: ["It never uses numbers", "It may hide class imbalance or failure cases", "It only works for SQL"],
          correctChoiceIndex: 1,
          explanation: "A single metric needs data context and error analysis."
        },
        {
          id: "question-ml-2",
          prompt: "Which situation makes a raw accuracy score look better than the model is?",
          choices: ["A dataset where one class is almost the whole dataset", "A dataset with balanced classes", "A model with zero features"],
          correctChoiceIndex: 0,
          explanation: "Predicting the majority class can score high on accuracy while missing every rare case."
        },
        {
          id: "question-ml-3",
          prompt: "What should accompany a metric before the model ships?",
          choices: ["An error analysis with examples the model missed", "A promise that the metric will not change", "A removal of the test dataset"],
          correctChoiceIndex: 0,
          explanation: "Looking at specific errors explains what the metric hides and where the model is unsafe to trust."
        }
      ].map(shuffleQuizChoices)
    },
      {
      id: "quiz-ml-confusion-matrix",
      lessonId: "lesson-ml-confusion-matrix",
      title: "Confusion matrix checkpoint",
      passingScore: 80,
      questions: ([
        {
          id: "question-ml-confusion-1",
          prompt: "What is a false negative?",
          choices: ["An actual positive predicted as negative", "An actual negative predicted as positive", "A metric with no data"],
          correctChoiceIndex: 0,
          explanation: "False negatives are missed positive cases."
        },
        {
          id: "question-ml-confusion-2",
          prompt: "Why use a confusion matrix instead of accuracy alone?",
          choices: ["It shows the kinds of errors the model made", "It hides class imbalance", "It removes sample-size concerns"],
          correctChoiceIndex: 0,
          explanation: "The matrix exposes false positives and false negatives that accuracy can hide."
        },
        {
          id: "question-ml-confusion-3",
          prompt: "What should a tiny confusion matrix include in its interpretation?",
          choices: ["A sample-size limitation", "A production guarantee", "A claim that no more tests are needed"],
          correctChoiceIndex: 0,
          explanation: "Small samples can teach error patterns but cannot justify broad quality claims."
        }
      ].map(shuffleQuizChoices))
    }
];
