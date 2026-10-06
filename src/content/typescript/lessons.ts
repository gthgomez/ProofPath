import type { Lesson, LessonPracticeBlock, Quiz } from "@/domain/types";
import { checkpointQuiz, proofLesson, shuffleQuizChoices, workshop } from "../python/shared";

// TypeScript and Web track. Mirrors the python/level-N.ts split: this file owns the
// track's lessons and quizzes, and the shared builders in
// src/content/python/shared.ts do the rest.

const typescriptContractPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "type ReadinessCard = {\n  label: string;\n  score: number;\n};\n\nconst card: ReadinessCard = { label: 'Portfolio', score: 42 };\nconsole.log(card.score);",
    expectedOutput: "The readiness score prints 42 and the object keeps score as a number.",
    checkYourAnswer: "Add a status field to the type, then watch the example object fail until you provide it. The lesson is the contract catching drift before the UI renders."
  },
  {
    starterCode: "type EvidenceBadge = { title: string; passing: boolean };\nconst badge: EvidenceBadge = { title: 'CLI tests', passing: true };\nconsole.log(badge.passing);",
    expectedOutput: "The badge prints true because passing is a boolean, not a display string.",
    checkYourAnswer: "Change passing to the string 'yes'. TypeScript should reject it because later logic needs a real boolean branch."
  },
  {
    starterCode: "type MissionSummary = { title: string; artifactCount: number; nextAction: string };\nconst summary: MissionSummary = { title: 'RAG Notes', artifactCount: 3, nextAction: 'Add citation check' };",
    expectedOutput: "The object has one text title, one number count, and one next action string.",
    checkYourAnswer: "This repeats the same contract idea with new field names so you remember the shape, not just MissionCard."
  }
];

const typescriptRuntimeValidationPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "const payload = { title: 'CLI Study Tracker', proofCount: 2 };\nfunction isMissionCard(value) {\n  return false;\n}\nconsole.log(isMissionCard(payload));",
    expectedOutput: "true for the complete mission-card payload.",
    checkYourAnswer: "A TypeScript type helps your code, but external payloads are just unknown values until a runtime check confirms their shape."
  },
  {
    starterCode: "const payload = { title: 'CLI Study Tracker', proofCount: 'two' };\nfunction isMissionCard(value) {\n  return false;\n}\nconsole.log(isMissionCard(payload));",
    expectedOutput: "false because proofCount is text instead of a number.",
    checkYourAnswer: "This is the important failure case. If the guard accepts proofCount as a string, the UI contract is not actually protected."
  },
  {
    starterCode: "const payload = null;\nfunction isObject(value) {\n  return false;\n}\nconsole.log(isObject(payload));",
    expectedOutput: "false because null is not a usable object payload.",
    checkYourAnswer: "JavaScript has a trap: typeof null is object. A good guard checks value !== null before reading fields."
  }
];

export const typescriptLessons: Lesson[] = [
    {
      id: "lesson-typescript-contracts",
      moduleId: "module-typescript-core",
      slug: "typescript-contracts",
      title: "Types Before Screens",
      summary: "Define app data contracts before UI layout.",
      bodyMarkdown: "A type is a promise between data and UI. If a readiness card needs a score, label, and evidence count, model those fields before arranging the card.",
      estimatedMinutes: 7,
      difficulty: "foundation",
      skillIds: ["skill-typescript-types", "skill-api-contracts"],
      quizId: "quiz-typescript-contracts",
      desktopTask: "Define a ProjectMission type with deliverables and acceptance criteria.",
      evidencePrompt: "Save the type definition and one example object that typechecks.",
      workshop: workshop(
        "Model screen data before designing the screen.",
        "Typed contracts keep project boards from becoming hardcoded card collections.",
        "A type names the fields the UI is allowed to trust. Validation still belongs at the boundary when data is external.",
        "type MissionCard = { title: string; proofCount: number; nextAction: string } gives the UI a small stable contract.",
        "Define a typed object for one progress card and render it from data rather than literals.",
        "This prepares the Typed Progress Board and API Contract Playground missions.",
        "Which UI bug would your type prevent before runtime?",
        ["Using any for external data", "Embedding progress values inside JSX", "Adding fields only after the UI breaks"],
        undefined,
        {
          language: "TypeScript",
          tools: ["TypeScript", "React or Expo", "typecheck"],
          synopsis: "You are learning to describe app data before building screens, so the UI has a clear contract instead of scattered hardcoded values.",
          prerequisites: ["Know that TypeScript adds types to JavaScript.", "Have one simple card or object in mind, such as a mission progress card."],
          testingFocus: "You will test the contract by creating an example object that typechecks and would fail if a required field is missing."
        },
        {
          starterCode: "type MissionCard = {\n  title: string;\n  proofCount: number;\n  nextAction: string;\n};\n\nconst card: MissionCard = {\n  title: \"CLI Study Tracker\",\n  proofCount: 2,\n  nextAction: \"Add check output\"\n};",
          expectedOutput: "TypeScript accepts the object because every required field has the expected type.",
          checkYourAnswer: "Temporarily remove proofCount or make it a string. The typecheck should fail, which proves the UI contract is doing real work."
        },
        {
          title: "Create a typed mission card contract",
          goal: "Define one TypeScript contract and one example object that a future progress card can render.",
          steps: ["Write a MissionCard type", "Create one valid example object", "Break one field intentionally and confirm typecheck catches it"],
          deliverables: ["MissionCard type", "Valid example object", "Screenshot or note of the failed typecheck experiment"],
          verifierCommand: "npm run typecheck",
          expectedEvidence: "Typecheck result plus the exact field that failed when you broke the contract.",
          projectConnection: "This is a small slice of the Typed Progress Board mission.",
          tester: {
            codeLabel: "Paste your TypeScript contract and example object",
            outputLabel: "Paste typecheck output or your failed-field note",
            requiredCodeIncludes: ["type MissionCard", "proofCount", "nextAction"],
          requiredOutputIncludes: ["typecheck", "proofCount"],
          successMessage: "Your TypeScript proof shows both the contract and the typecheck experiment.",
          failureMessage: "The tester needs the MissionCard contract plus typecheck proof naming the field you broke."
          },
          runnerSpec: {
            language: "typescript",
            starterCode: "type MissionCard = {\n  title: string;\n  proofCount: number;\n  nextAction: string;\n};\n\nconst card: MissionCard = {\n  title: \"CLI Study Tracker\",\n  proofCount: 2,\n  nextAction: \"Add check output\"\n};",
            visibleTests: [
              {
                id: "card-has-required-data",
                name: "Card has required data",
                code: "if (card.title !== 'CLI Study Tracker') throw new Error('title mismatch');\nif (card.proofCount !== 2) throw new Error('proofCount mismatch');\nif (!card.nextAction.includes('check')) throw new Error('nextAction should name check work');\nconsole.log('typecheck proofCount contract passed');",
                expectedOutputIncludes: ["typecheck", "proofCount", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["typecheck", "proofCount", "passed"]
          }
        },
        typescriptContractPracticeReps
      )
    },
    proofLesson({
      id: "lesson-typescript-runtime-validation",
      moduleId: "module-typescript-core",
      slug: "typescript-runtime-validation",
      title: "Runtime Validation for External Data",
      summary: "Check unknown payloads before typed UI code trusts them.",
      bodyMarkdown: "TypeScript catches mistakes inside your code, but it cannot guarantee that a saved file, API response, or pasted JSON has the shape you expected. Runtime validation is the doorway check: inspect the unknown value, reject missing or wrong fields, then let the rest of the app use the typed shape confidently.",
      estimatedMinutes: 11,
      difficulty: "applied",
      skillIds: ["skill-typescript-types", "skill-api-contracts", "skill-testing-debugging"],
      quizId: "quiz-typescript-runtime-validation",
      desktopTask: "Write a small runtime guard for a mission-card payload and test one accepted and one rejected object.",
      evidencePrompt: "Capture the guard function, accepted payload, rejected payload, and typecheck or test output.",
      language: "TypeScript",
      tools: ["TypeScript", "runtime guard", "typecheck"],
      synopsis: "You are learning the difference between a type you wrote and an unknown value that arrives from outside your code.",
      prerequisites: ["Know how to define a TypeScript object type.", "Know that API or JSON data can be malformed."],
      testingFocus: "The check confirms that complete payloads pass and malformed payloads fail before UI code trusts them.",
      objective: "Write a runtime guard that accepts a valid mission-card payload and rejects malformed data.",
      whyItMatters: "A typed UI still breaks if external data is trusted without checking its runtime shape.",
      coreConcept: "Static types protect code you compile; runtime validation protects boundaries where unknown data enters the app.",
      workedExample: "A valid card has title as text, proofCount as a number, and nextAction as text; proofCount: 'two' must be rejected.",
      guidedExercise: "Create isMissionCard, test a complete payload, then test one payload with the wrong field type.",
      missionConnection: "This deepens the Typed Progress Board and API Contract Playground missions.",
      reflectionPrompt: "Which field would cause the clearest UI bug if you skipped runtime validation?",
      practiceStarter: "type MissionCard = { title: string; proofCount: number; nextAction: string };\nfunction isMissionCard(value: unknown): value is MissionCard {\n  return false;\n}",
      practiceExpected: "A complete object passes, proofCount as a string fails, and the check prints passed.",
      practiceCheck: "Do not read fields until you know the value is a non-null object. Then check each required field by type.",
      practiceReps: typescriptRuntimeValidationPracticeReps,
      miniTitle: "Guard an external mission card",
      miniGoal: "Create a runtime validation function for one UI payload shape.",
      miniSteps: ["Define the MissionCard type", "Write isMissionCard for unknown values", "Test one valid payload and one malformed payload"],
      miniDeliverables: ["MissionCard type", "Runtime guard", "Accepted and rejected payload tests"],
      verifierCommand: "npm run typecheck or run the Code Lab check.",
      expectedEvidence: "Runtime guard code plus output showing a valid payload accepted and malformed payload rejected.",
      projectConnection: "This is the boundary check for API-shaped progress data.",
      requiredCodeIncludes: ["isMissionCard", "proofCount", "unknown"],
      requiredOutputIncludes: ["passed"],
      runnerLanguage: "typescript",
      runnerStarterCode: "type MissionCard = { title: string; proofCount: number; nextAction: string };\n\nfunction isMissionCard(value: unknown): value is MissionCard {\n  return false;\n}\n\nconst validPayload = { title: 'CLI Study Tracker', proofCount: 2, nextAction: 'Add output' };\nconst invalidPayload = { title: 'CLI Study Tracker', proofCount: 'two', nextAction: 'Add output' };",
      runnerTestCode: "if (!isMissionCard(validPayload)) throw new Error('valid payload should pass');\nif (isMissionCard(invalidPayload)) throw new Error('string proofCount should fail');\nif (isMissionCard(null)) throw new Error('null should fail');\nconsole.log('runtime validation passed');"
    }),
    {
      id: "lesson-typescript-events-state",
      moduleId: "module-typescript-core",
      slug: "typescript-events-state",
      title: "Typed Events Change State",
      summary: "Model user actions as typed events so UI state changes stay reviewable.",
      bodyMarkdown: "A screen is easier to test when every button press becomes a small typed event and one reducer decides how state changes. This keeps UI rendering separate from business rules.",
      estimatedMinutes: 11,
      difficulty: "applied",
      skillIds: ["skill-typescript-types", "skill-api-contracts", "skill-testing-debugging"],
      quizId: "quiz-typescript-events-state",
      desktopTask: "Write a typed reducer for adding and completing one progress task.",
      evidencePrompt: "Save the event type, reducer output, and typecheck or test result.",
      workshop: workshop(
        "Use typed events to update UI state without scattering logic across the screen.",
        "Typed reducers make web and mobile screens easier to test because state changes can be verified without tapping through the UI.",
        "An event is a named action such as addTask or completeTask. A reducer takes the current state and one event, then returns the next state without mutating the original object.",
        "type Event = { type: 'complete'; id: string } lets the reducer handle completion with a known shape.",
        "Create a TaskState type, an Event union, and a reducer that completes one task by id.",
        "This deepens the Typed Progress Board and API Contract Playground missions.",
        "Which state update moved out of the UI and into a testable function?",
        ["Mutating the original state array", "Using stringly typed event names with no union", "Letting UI components decide business rules"],
        undefined,
        {
          language: "TypeScript",
          tools: ["TypeScript", "React or Expo", "typecheck", "unit test"],
          synopsis: "You are learning how a typed UI turns button actions into testable state changes instead of burying logic inside components.",
          prerequisites: ["Know how to define a TypeScript object type.", "Understand that UI state can be represented as plain data."],
          testingFocus: "You will test the reducer by sending a complete event and checking that only the matching task changes."
        },
        {
          starterCode: "type Task = { id: string; title: string; done: boolean };\ntype Event = { type: \"complete\"; id: string };\n\nconst state: Task[] = [{ id: \"t1\", title: \"Run typecheck\", done: false }];\nconst next = reducer(state, { type: \"complete\", id: \"t1\" });\nconsole.log(next);",
          expectedOutput: "The task with id t1 has done: true, and the original state can still be inspected separately.",
          checkYourAnswer: "If state[0].done changed before you assigned next, you mutated the original array. Return a new array so tests and UI updates stay predictable."
        },
        {
          title: "Build a typed task reducer",
          goal: "Create a reducer that completes one task from a typed event without mutating the original state.",
          steps: ["Define Task and Event types", "Implement reducer(state, event)", "Verify completion changes only the matching task"],
          deliverables: ["Task and Event types", "Reducer function", "Check output"],
          verifierCommand: "npm run typecheck or npm test",
          expectedEvidence: "Typecheck or test output plus a short note proving the reducer completes one task without mutating the original state.",
          projectConnection: "This is a testable state-management slice for the Typed Progress Board mission.",
          tester: {
            codeLabel: "Paste your reducer and event types",
            outputLabel: "Paste typecheck or test output",
            requiredCodeIncludes: ["type Event", "reducer", "complete"],
            requiredOutputIncludes: ["passed"],
            successMessage: "Your reducer proof shows a typed event changing state under test.",
            failureMessage: "The tester needs typed event code and check output showing the reducer passed."
          },
          runnerSpec: {
            language: "typescript",
            starterCode: "type Task = { id: string; title: string; done: boolean };\ntype Event = { type: \"complete\"; id: string };\n\nfunction reducer(state: Task[], event: Event): Task[] {\n  return state;\n}\n\nconst before: Task[] = [{ id: \"t1\", title: \"Run typecheck\", done: false }, { id: \"t2\", title: \"Commit proof\", done: false }];\nconst after = reducer(before, { type: \"complete\", id: \"t1\" });",
            visibleTests: [
              {
                id: "typed-event-completes-task",
                name: "Typed event completes the matching task",
                code: "if (after.find((task) => task.id === 't1')?.done !== true) throw new Error('t1 should be complete');\nif (after.find((task) => task.id === 't2')?.done !== false) throw new Error('t2 should stay incomplete');\nif (before[0].done !== false) throw new Error('original state was mutated');\nconsole.log('typed event reducer passed');",
                expectedOutputIncludes: ["typed event", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["typed event", "passed"]
          }
        }
      )
    },
];

export const typescriptQuizzes: Quiz[] = [
      {
      id: "quiz-typescript-contracts",
      lessonId: "lesson-typescript-contracts",
      title: "Type contract checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-typescript-1",
          prompt: "Why define a data type before building a screen?",
          choices: ["It replaces UI design", "It clarifies what the UI can safely read", "It removes the need for tests"],
          correctChoiceIndex: 1,
          explanation: "The type creates a reliable contract between content, logic, and display."
        },
        {
          id: "question-typescript-2",
          prompt: "What happens when a screen reads a field the type does not define?",
          choices: ["TypeScript reports the mismatch before the app runs", "The field silently appears at runtime", "The screen stops needing data"],
          correctChoiceIndex: 0,
          explanation: "A type contract catches unknown or misspelled fields before the app runs instead of inside a finished screen."
        },
        {
          id: "question-typescript-3",
          prompt: "Which change keeps a type contract trustworthy?",
          choices: ["Updating the type whenever the data shape changes", "Casting any value to bypass the shape", "Renaming fields without touching the type"],
          correctChoiceIndex: 0,
          explanation: "A contract stays reliable only when the declared type matches the data the screen actually receives."
        }
      ].map(shuffleQuizChoices)
    },
      {
      id: "quiz-typescript-events-state",
      lessonId: "lesson-typescript-events-state",
      title: "Typed events checkpoint",
      passingScore: 80,
      questions: ([
        {
          id: "question-typescript-events-1",
          prompt: "Why model UI actions as typed events?",
          choices: ["So state changes can be tested with known shapes", "So reducers can mutate every object", "So screens no longer need data"],
          correctChoiceIndex: 0,
          explanation: "Typed events make each action explicit and let tests call state logic without rendering the UI."
        },
        {
          id: "question-typescript-events-2",
          prompt: "What should a reducer return after handling an event?",
          choices: ["A next state value", "A hidden global variable", "Only console output"],
          correctChoiceIndex: 0,
          explanation: "Reducers are easiest to test when they return the next state as data."
        },
        {
          id: "question-typescript-events-3",
          prompt: "Why avoid mutating the original state array?",
          choices: ["It keeps previous state inspectable and updates predictable", "It makes TypeScript ignore errors", "It deletes old tests"],
          correctChoiceIndex: 0,
          explanation: "Non-mutating updates let tests compare before and after state reliably."
        }
      ].map(shuffleQuizChoices)),
    },
  checkpointQuiz("quiz-typescript-runtime-validation", "lesson-typescript-runtime-validation", "Runtime validation checkpoint", "runtime validation for external data", "Checking unknown payloads before treating them as typed app data", "Casting every API response directly to a TypeScript type", "Reading fields from null before checking the value", "Runtime guards protect the boundary where external data enters the app."),
];
