import type { Lesson, Quiz } from "@/domain/types";
import { shuffleQuizChoices, workshop } from "../python/shared";

// AI-Assisted Coding track. Mirrors the python/level-N.ts split: this file owns the
// track's lessons and quizzes, and the shared builders in
// src/content/python/shared.ts do the rest.

export const aiToolsLessons: Lesson[] = [
    {
      id: "lesson-ai-test-loop",
      moduleId: "module-ai-verification",
      slug: "ai-test-loop",
      title: "Use AI Without Surrendering Judgment",
      summary: "Treat model output as a draft until tests and inspection prove it.",
      bodyMarkdown: "AI can suggest a fix quickly, but ownership starts when you reproduce the issue, inspect the diff, and run the verifier yourself.",
      estimatedMinutes: 8,
      difficulty: "applied",
      skillIds: ["skill-ai-verification", "skill-testing-debugging"],
      quizId: "quiz-ai-test-loop",
      desktopTask: "Ask an AI for a test idea, then write your own final assertion and explain the difference.",
      evidencePrompt: "Store the prompt summary, final test, and check output.",
      workshop: workshop(
        "Use AI output as a draft while keeping verification custody.",
        "Employable AI-assisted engineers can explain why a suggested change is correct, not just who suggested it.",
        "The loop is reproduce, ask, inspect, edit, verify, then record evidence.",
        "An AI suggests a null check; you add a regression test and only accept the fix after the test fails then passes.",
        "Ask for one test idea, write your own final assertion, and record the check output.",
        "This prepares the AI Bug Review Rubric and AI Prompt Verification Harness missions.",
        "Where did your judgment change the model's suggestion?",
        ["Accepting plausible code", "Skipping reproduction", "Recording the prompt but not the verifier"],
        undefined,
        {
          language: "AI-assisted coding",
          tools: ["AI chat", "test runner", "diff review"],
          synopsis: "You are learning how to use AI as a draft partner while keeping ownership of the final test, code, and evidence.",
          prerequisites: ["Have a small bug, behavior, or test idea to inspect.", "Know how to run the verifier for the project."],
          testingFocus: "You will test the AI suggestion by reproducing the issue, writing or improving an assertion, and capturing check output yourself."
        },
        {
          starterCode: "AI suggestion: \"Add a null check before reading user.name.\"\n\nYour final test idea:\n- Given a user without a name\n- When the formatter runs\n- Then it returns \"Unknown user\" instead of crashing",
          expectedOutput: "A final assertion written in your words, plus check output that proves the behavior.",
          checkYourAnswer: "Do not accept the AI suggestion until you can explain the failing case and show the test passing after your edit."
        },
        {
          title: "Verify one AI-generated test idea",
          goal: "Use AI for a draft test idea, then rewrite and verify the final assertion yourself.",
          steps: ["Ask AI for one test idea", "Rewrite the assertion in your own words", "Run the verifier and record what changed from the AI draft"],
          deliverables: ["Prompt summary", "Final assertion", "Check output and judgment note"],
          verifierCommand: "Run the relevant project test command.",
          expectedEvidence: "Final test plus check output, with a short note explaining what you changed from the AI prompt.",
          projectConnection: "This rehearses the AI Prompt Verification Harness mission.",
          tester: {
            codeLabel: "Paste your final assertion and judgment note",
            outputLabel: "Paste check output",
            requiredCodeIncludes: ["assert", "AI"],
          requiredOutputIncludes: ["passed"],
          successMessage: "Your AI-assisted proof keeps ownership in your final assertion and check output.",
          failureMessage: "The tester needs a final assertion, a note about the AI draft, and passing check output."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "function formatUser(user) {\n  return user.name;\n}\n\n// Fix formatUser, then keep this note honest.\nconst aiJudgmentNote = 'AI suggested a null check; I verified the fallback behavior.';",
            visibleTests: [
              {
                id: "ai-suggestion-verified",
                name: "AI suggestion is verified with a real assertion",
                code: "if (formatUser({}) !== 'Unknown user') throw new Error('missing fallback');\nif (!aiJudgmentNote.includes('AI')) throw new Error('missing AI judgment note');\nconsole.log('passed AI verification');",
                expectedOutputIncludes: ["passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["passed"]
          }
        }
      )
    },
    {
      id: "lesson-ai-diff-review",
      moduleId: "module-ai-verification",
      slug: "ai-diff-review",
      title: "Review AI Diffs Before Trusting Them",
      summary: "Use a local checklist to inspect AI-generated changes for scope, contracts, secrets, and verification.",
      bodyMarkdown: "AI output is untrusted until the human review loop accepts it. A diff checklist makes acceptance explicit: what changed, what risk moved, what verifier passed, and what was rejected.",
      estimatedMinutes: 10,
      difficulty: "applied",
      skillIds: ["skill-ai-verification", "skill-testing-debugging", "skill-portfolio-evidence"],
      quizId: "quiz-ai-diff-review",
      desktopTask: "Apply a diff-review checklist to one AI-suggested change and reject at least one risky item.",
      evidencePrompt: "Keep the checklist, accepted edits, rejected edits, and check output.",
      workshop: workshop(
        "Inspect an AI-generated diff before accepting any code.",
        "Responsible AI-assisted coding means you can show what you accepted, what you rejected, and which local evidence justified the decision.",
        "A review checklist should cover scope, contract changes, secrets, destructive behavior, tests, and remaining uncertainty. The AI suggestion is a draft, not authority.",
        "Reject a suggestion that adds a package for a one-line bug fix, then keep the smaller tested edit.",
        "Review one suggested diff and mark each item accepted, rejected, or needs follow-up with a reason.",
        "This deepens the AI Bug Review Rubric and AI Prompt Verification Harness missions.",
        "Which part of the AI suggestion did you reject, and what evidence supported that decision?",
        ["Accepting the whole diff because tests pass", "Ignoring package or schema changes", "Failing to record rejected suggestions"],
        undefined,
        {
          language: "AI-assisted coding",
          tools: ["AI chat", "git diff", "test runner", "review checklist"],
          synopsis: "You are learning how to review model-generated code as untrusted input and keep custody of the final accepted change.",
          prerequisites: ["Have a small AI-suggested patch or sample diff.", "Know the check command for the project you are reviewing."],
          testingFocus: "You will test the review by ensuring the accepted change has check output and the rejected change has a clear risk reason."
        },
        {
          starterCode: "Checklist:\n- Scope: one bug fix\n- Contract change: none\n- Package change: rejected\n- Secret risk: none found\n- Verification: npm run test -> passed",
          expectedOutput: "The accepted change has local check output, and the rejected item names a concrete risk such as package expansion or contract drift.",
          checkYourAnswer: "A useful rejection is specific. Do not write 'bad'; write the risk, such as unnecessary package change for a local bug fix."
        },
        {
          title: "Apply an AI diff review checklist",
          goal: "Review an AI-suggested change and record accepted edits, rejected edits, and verifier evidence.",
          steps: ["List the AI-suggested changes", "Reject at least one risky or out-of-scope item", "Run the verifier for the accepted edit"],
          deliverables: ["Review checklist", "Rejected-item reason", "Check output"],
          verifierCommand: "Run the project verifier for the accepted change.",
          expectedEvidence: "Checklist showing accepted and rejected AI suggestions plus exact check output for the accepted change.",
          projectConnection: "This is the review gate inside the AI Prompt Verification Harness mission.",
          tester: {
            codeLabel: "Paste your AI diff checklist",
            outputLabel: "Paste check output",
            requiredCodeIncludes: ["accepted", "rejected", "Verification"],
            requiredOutputIncludes: ["passed"],
            successMessage: "Your AI diff review keeps human ownership over accepted and rejected changes.",
            failureMessage: "The tester needs accepted/rejected review notes plus passing check output."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "const aiReview = {\n  accepted: ['small null fallback with regression test'],\n  rejected: ['new dependency for a one-line bug fix'],\n  verification: 'npm run test -> passed',\n  risk: 'package changes were out of scope'\n};",
            visibleTests: [
              {
                id: "ai-review-records-judgment",
                name: "AI review records accepted and rejected choices",
                code: "if (aiReview.accepted.length === 0) throw new Error('accepted item required');\nif (aiReview.rejected.length === 0) throw new Error('rejected item required');\nif (!aiReview.verification.includes('passed')) throw new Error('missing check result');\nconsole.log('accepted rejected AI review passed');",
                expectedOutputIncludes: ["accepted", "rejected", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["accepted", "rejected", "passed"]
          }
        }
      )
    },
];

export const aiToolsQuizzes: Quiz[] = [
      {
      id: "quiz-ai-test-loop",
      lessonId: "lesson-ai-test-loop",
      title: "AI verification checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-ai-1",
          prompt: "When is AI-generated code acceptable to ship?",
          choices: ["When it looks plausible", "When local evidence verifies it", "When it uses modern syntax"],
          correctChoiceIndex: 1,
          explanation: "The proof comes from reproduction, tests, inspection, and verification output."
        },
        {
          id: "question-ai-2",
          prompt: "What is the first thing to do with a generated code suggestion?",
          choices: ["Run it against a small local check", "Paste it into the main branch", "Ask the model to confirm it was right"],
          correctChoiceIndex: 0,
          explanation: "A local check shows whether the suggestion actually behaves as claimed."
        },
        {
          id: "question-ai-3",
          prompt: "What does the test loop add to AI assistance?",
          choices: ["Evidence that the produced code works on real inputs", "Faster typing without review", "A reason to skip reading the diff"],
          correctChoiceIndex: 0,
          explanation: "The loop turns model output into verified work by pairing each suggestion with a runnable check."
        }
      ].map(shuffleQuizChoices)
    },
      {
      id: "quiz-ai-diff-review",
      lessonId: "lesson-ai-diff-review",
      title: "AI diff review checkpoint",
      passingScore: 80,
      questions: ([
        {
          id: "question-ai-diff-1",
          prompt: "How should you treat an AI-generated diff before review?",
          choices: ["As untrusted draft material", "As approved source authority", "As a replacement for tests"],
          correctChoiceIndex: 0,
          explanation: "Model output needs human inspection and local check evidence before acceptance."
        },
        {
          id: "question-ai-diff-2",
          prompt: "Why record rejected AI suggestions?",
          choices: ["To show the risk decision and preserve judgment", "To make the accepted code fail", "To hide what changed"],
          correctChoiceIndex: 0,
          explanation: "Rejected suggestions reveal scope control and the reasons behind the final edit."
        },
        {
          id: "question-ai-diff-3",
          prompt: "Which AI suggestion should raise extra risk?",
          choices: ["A package or schema change outside the task", "A typo fix with a passing test", "A clearer variable name inside one function"],
          correctChoiceIndex: 0,
          explanation: "Package and schema changes can widen blast radius beyond the requested fix."
        }
      ].map(shuffleQuizChoices)),
    },
];
