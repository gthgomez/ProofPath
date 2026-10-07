import type { Lesson, Quiz } from "@/domain/types";
import { shuffleQuizChoices, workshop } from "../python/shared";

// Git and GitHub track. Mirrors the python/level-N.ts split: this file owns the
// track's lessons and quizzes, and the shared builders in
// src/content/python/shared.ts do the rest.

export const gitLessons: Lesson[] = [
    {
      id: "lesson-git-evidence",
      moduleId: "module-git-core",
      slug: "git-evidence",
      title: "Evidence A Reviewer Can Trust",
      summary: "A repo proves more when setup, tests, and screenshots are easy to inspect.",
      bodyMarkdown: "A portfolio repo should answer what it does, how to run it, how it was verified, and what is intentionally unfinished.",
      estimatedMinutes: 6,
      difficulty: "foundation",
      skillIds: ["skill-git-workflow", "skill-portfolio-evidence"],
      quizId: "quiz-git-evidence",
      desktopTask: "Add a README verification section to one practice repo.",
      evidencePrompt: "Link the commit and record the exact command that passed or failed.",
      workshop: workshop(
        "Make one repo understandable and verifiable for a reviewer.",
        "GitHub evidence only helps if the reviewer can reproduce your claims.",
        "A strong repo has a clear problem statement, setup command, verification command, sample output, and known gaps.",
        "Verification: npm run test -> 9 passed; Known gaps: no auth, no deployment.",
        "Add or improve the verification section in one README.",
        "This directly supports Portfolio README Upgrade and every portfolio mission.",
        "What proof would make this repo trustworthy to someone who has never met you?",
        ["Writing only feature lists", "No run command", "No known gaps"],
        undefined,
        {
          language: "Markdown and Git",
          tools: ["GitHub", "README", "commit history"],
          synopsis: "You are learning how to make a repo understandable to a reviewer by showing setup, verification, sample output, and honest gaps.",
          prerequisites: ["Have or create a practice repo.", "Know how to edit a README file."],
          testingFocus: "You will test whether the repo is reviewer-ready by linking a commit and recording the exact command that passed or failed."
        },
        {
          starterCode: "## Verification\n\nCommand:\n```bash\nnpm run test\n```\n\nResult:\n```text\n9 passed\n```\n\nKnown gaps:\n- No deployment yet.\n- Test data is local only.",
          expectedOutput: "A reviewer can see the command, the result, and the current limits without digging through your commit history.",
          checkYourAnswer: "Your README should answer: what does it do, how do I run it, how was it verified, and what is intentionally unfinished?"
        },
        {
          title: "Upgrade one repo README",
          goal: "Make one practice repo inspectable by adding verification and known-gaps sections.",
          steps: ["Add setup and run commands", "Add exact check output", "Add known gaps that are honest but not self-sabotaging"],
          deliverables: ["README diff", "Commit or local note", "Check output"],
          verifierCommand: "git diff -- README.md",
          expectedEvidence: "README diff or commit link showing verification and known-gaps sections.",
          projectConnection: "This is the smallest useful slice of the Portfolio README Upgrade mission.",
          tester: {
            codeLabel: "Paste README diff or updated sections",
            outputLabel: "Paste check output or git diff summary",
            requiredCodeIncludes: ["Verification", "Known gaps"],
          requiredOutputIncludes: ["passed"],
          successMessage: "Your repo proof includes check output and honest known gaps.",
          failureMessage: "The tester needs README verification/known-gaps text plus passing check output."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "const readme = `# Practice Repo\n\n## Verification\nnpm run test\n9 passed\n\n## Known gaps\nNo deployment yet.`;",
            visibleTests: [
              {
                id: "repo-readme-verifiable",
                name: "Repo README is verifiable",
                code: "for (const phrase of ['Verification', 'Known gaps', 'passed']) {\n  if (!readme.includes(phrase)) throw new Error(`missing ${phrase}`);\n}\nconsole.log('passed repo README verifier');",
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
      id: "lesson-github-review-flow",
      moduleId: "module-git-core",
      slug: "github-review-flow",
      title: "Commits Tell a Review Story",
      summary: "Group changes into small commits with messages, diffs, and verification notes a reviewer can follow.",
      bodyMarkdown: "A reviewer should be able to understand why a change exists, what files moved, and what command proved it. Git history is not just backup; it is engineering evidence.",
      estimatedMinutes: 9,
      difficulty: "foundation",
      skillIds: ["skill-git-workflow", "skill-portfolio-evidence"],
      quizId: "quiz-github-review-flow",
      desktopTask: "Draft a commit message and PR checklist for one small practice change.",
      evidencePrompt: "Save the diff summary, commit message, and exact check command.",
      workshop: workshop(
        "Turn a local diff into a reviewable GitHub story.",
        "Career evidence improves when each commit explains one reason, one change, and one verification result.",
        "A good review flow has a scoped branch, a focused diff, a commit message with intent, and a PR note that names tests and risks.",
        "feat: add evidence status filter pairs with npm run test -> 12 passed and a note that deployment was not touched.",
        "Write a commit message and PR checklist for a small change before pretending it is ready.",
        "This deepens the Portfolio README Upgrade mission and supports every future portfolio repo.",
        "What would a reviewer know from your commit message that the diff alone does not explain?",
        ["Bundling unrelated fixes into one commit", "Writing vague messages like update stuff", "Leaving verification out of the PR body"],
        undefined,
        {
          language: "Git and GitHub",
          tools: ["git diff", "commit message", "PR checklist"],
          synopsis: "You are learning how to make GitHub history useful to reviewers by connecting the diff, reason, verifier, and risk note.",
          prerequisites: ["Know that a commit captures a snapshot of changes.", "Have a small practice change or hypothetical diff to describe."],
          testingFocus: "You will test the review story by checking whether the message names intent, scope, verification, and known risk."
        },
        {
          starterCode: "Commit message:\nfeat: add evidence status filter\n\nPR checklist:\n- Scope: filter completed evidence cards only\n- Verification: npm run test -> 12 passed\n- Risk: no storage or API changes",
          expectedOutput: "A reviewer can identify the intent, changed area, verification result, and risk boundary from the notes.",
          checkYourAnswer: "If the message could apply to any project, make it more specific. If the PR note has no command result, the reviewer still has to guess."
        },
        {
          title: "Draft a review-ready commit note",
          goal: "Write a commit message and PR checklist that connect one diff to verifier evidence.",
          steps: ["Summarize the diff in one scope", "Write a commit message with intent", "Add verification and risk notes"],
          deliverables: ["Commit message", "Diff summary", "Verifier and risk checklist"],
          verifierCommand: "Review the note against the checklist.",
          expectedEvidence: "Commit and PR notes that include intent, scope, verification output, and one honest risk boundary.",
          projectConnection: "This is the reviewer-facing workflow behind the Portfolio README Upgrade mission.",
          tester: {
            codeLabel: "Paste your commit message and PR checklist",
            outputLabel: "Paste your checklist review",
            requiredCodeIncludes: ["Verification", "Risk"],
            requiredOutputIncludes: ["passed"],
            successMessage: "Your GitHub story gives a reviewer intent, scope, verification, and risk.",
            failureMessage: "The tester needs a commit/PR note with verification and risk evidence."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "const reviewNote = {\n  commit: 'feat: add evidence status filter',\n  scope: 'filter completed evidence cards only',\n  verification: 'npm run test -> 12 passed',\n  risk: 'no storage or API changes'\n};",
            visibleTests: [
              {
                id: "review-note-has-evidence",
                name: "Review note includes verification and risk",
                code: "for (const key of ['commit', 'scope', 'verification', 'risk']) {\n  if (!reviewNote[key]) throw new Error(`missing ${key}`);\n}\nif (!reviewNote.verification.includes('passed')) throw new Error('verification must include result');\nconsole.log('review story passed');",
                expectedOutputIncludes: ["review story", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["review story", "passed"]
          }
        }
      )
    },
];

export const gitQuizzes: Quiz[] = [
      {
      id: "quiz-git-evidence",
      lessonId: "lesson-git-evidence",
      title: "Repo evidence checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-git-1",
          prompt: "What is the strongest portfolio evidence?",
          choices: ["A vague completed badge", "A repo with setup, tests, and a demo", "A private note with no commands"],
          correctChoiceIndex: 1,
          explanation: "Reviewers need inspectable artifacts and commands, not only completion claims."
        },
        {
          id: "question-git-2",
          prompt: "What makes a commit useful to a reviewer?",
          choices: ["A message that explains why the change was made", "A large bundle of unrelated edits", "A commit made without running checks"],
          correctChoiceIndex: 0,
          explanation: "Reviewers can follow and verify work when each commit has a clear purpose and scope."
        },
        {
          id: "question-git-3",
          prompt: "Why run the checks before committing?",
          choices: ["So the recorded state of the project actually works", "So the commit is larger", "So the README can be skipped"],
          correctChoiceIndex: 0,
          explanation: "A commit that passes its checks is evidence, while an unverified commit is only a claim."
        }
      ].map(shuffleQuizChoices)
    },
      {
      id: "quiz-github-review-flow",
      lessonId: "lesson-github-review-flow",
      title: "GitHub review flow checkpoint",
      passingScore: 80,
      questions: ([
        {
          id: "question-github-review-1",
          prompt: "What should a commit message add beyond the diff?",
          choices: ["Intent and scope", "A secret token", "Unrelated future plans"],
          correctChoiceIndex: 0,
          explanation: "The diff shows what changed; the message should help explain why and where."
        },
        {
          id: "question-github-review-2",
          prompt: "What belongs in a reviewer-friendly PR note?",
          choices: ["Verification result and risk boundary", "Only marketing language", "A hidden checklist"],
          correctChoiceIndex: 0,
          explanation: "Reviewers need exact evidence and a clear statement of what was not touched."
        },
        {
          id: "question-github-review-3",
          prompt: "Why keep commits focused?",
          choices: ["So reviewers can understand and revert them more easily", "So every file changes at once", "So verification becomes optional"],
          correctChoiceIndex: 0,
          explanation: "Focused commits make review, verification, and recovery simpler."
        }
      ].map(shuffleQuizChoices)),
    },
];
