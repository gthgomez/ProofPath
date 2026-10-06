import type { Lesson, LessonPracticeBlock, Quiz } from "@/domain/types";
import { shuffleQuizChoices, workshop } from "../python/shared";

// Practical AI Apps track. Mirrors the python/level-N.ts split: this file owns the
// track's lessons and quizzes, and the shared builders in
// src/content/python/shared.ts do the rest.

const aiRetrievalPracticeReps: LessonPracticeBlock[] = [
  {
    starterCode: "const retrievedIds = ['n1'];\nconst answer = { claims: [{ text: 'Tests passed', citationId: 'n1' }] };\nconsole.log(answer.claims[0].citationId);",
    expectedOutput: "The answer cites n1, which is inside the retrieved note id list.",
    checkYourAnswer: "The claim cites a retrieved note. Change the citation to n2 and the grounding check should reject it."
  },
  {
    starterCode: "const retrievedIds = ['n1'];\nconst answer = { claims: [{ text: 'The app is deployed', citationId: null }] };\nconsole.log(answer.claims[0].citationId);",
    expectedOutput: "null means the claim is unsupported and should not be presented as fact.",
    checkYourAnswer: "Unsupported is a valid safe result. Do not fill in a citation just to make the answer look complete."
  },
  {
    starterCode: "const notes = [{ id: 'n1', text: 'SQLite stores progress locally.' }, { id: 'n2', text: 'Secrets stay server-side.' }];\nconst retrievedIds = ['n2'];",
    expectedOutput: "An answer about secrets may cite n2, but an answer about SQLite should not pretend n2 supports it.",
    checkYourAnswer: "This rep practices topic fit. Grounding is not just citation format; the cited note must support the claim."
  }
];

export const aiAppsLessons: Lesson[] = [
    {
      id: "lesson-ai-app-boundaries",
      moduleId: "module-ai-apps",
      slug: "ai-app-boundaries",
      title: "AI App Boundary Rules",
      summary: "Keep secrets and privileged AI calls out of the mobile client.",
      bodyMarkdown: "A mobile app may hold public configuration, but vendor keys and privileged actions belong behind a server boundary with logging and rate controls.",
      estimatedMinutes: 8,
      difficulty: "applied",
      skillIds: ["skill-ai-verification", "skill-api-contracts"],
      quizId: "quiz-ai-app-boundaries",
      desktopTask: "Draw the request path for a future AI mentor feature without putting secrets in the app.",
      evidencePrompt: "Save the diagram or notes and list which values may be public.",
      workshop: workshop(
        "Draw an AI feature boundary that keeps secrets and privileged actions off the phone.",
        "Mobile bundles can be inspected, so AI provider keys and privileged scoring logic need a server boundary.",
        "The client can send user intent and receive bounded results; the server owns secrets, logging, rate limits, and eval checks.",
        "Mobile -> API route -> model provider; API route stores audit metadata and strips unsupported claims before returning.",
        "Sketch one request path and label public config, private secrets, and verifier/eval checks.",
        "This prepares AI Study Planner Boundary Map and RAG Notes Search Prototype.",
        "Which value in your design must never ship inside the app bundle?",
        ["Putting vendor keys in client code", "Letting AI directly mutate readiness", "No eval or logging point"],
        undefined,
        {
          language: "Mobile architecture",
          tools: ["Expo or mobile app", "API boundary", "diagram or notes"],
          synopsis: "You are learning where AI requests belong in a mobile app so secrets, privileged logic, and audit checks stay off the client.",
          prerequisites: ["Know that mobile app bundles can be inspected.", "Have a rough idea for an AI feature such as a study planner or mentor."],
          testingFocus: "You will test the design by labeling which values are public, which are private, and where verification or logging happens."
        },
        {
          starterCode: "Mobile app -> /api/mentor-plan -> AI provider\n\nPublic on phone:\n- user goal\n- selected track id\n\nPrivate on server:\n- provider API key\n- rate limits\n- audit logs",
          expectedOutput: "The phone never contains provider secrets, and the server owns the privileged AI call plus logging.",
          checkYourAnswer: "If a value would let someone spend money, impersonate the app, or bypass checks, it belongs behind the server boundary."
        },
        {
          title: "Draw an AI boundary map",
          goal: "Map one mobile AI feature so public inputs, private secrets, and verification points are obvious.",
          steps: ["Pick one AI feature such as mentor planning", "Draw client, API, provider, and logging boxes", "Label public values and server-only values"],
          deliverables: ["Boundary diagram or note", "Public/private value list", "One verifier or logging checkpoint"],
          verifierCommand: "Review the diagram and confirm no provider secret is listed under the mobile app.",
          expectedEvidence: "A diagram or text map that clearly keeps secrets and privileged checks behind the API boundary.",
          projectConnection: "This is the foundation for AI Study Planner Boundary Map and RAG Notes Search Prototype.",
          tester: {
            codeLabel: "Paste your boundary map",
            outputLabel: "Paste your review result",
            requiredCodeIncludes: ["Mobile app", "API", "provider", "server"],
          requiredOutputIncludes: ["no provider secret"],
          successMessage: "Your boundary proof keeps secrets behind the server boundary.",
          failureMessage: "The tester needs a client/API/provider map and review output confirming no provider secret is on the phone."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "const boundary = {\n  mobile: ['user goal', 'selected track id'],\n  server: ['provider API key', 'rate limits', 'audit logs'],\n  provider: ['model call']\n};",
            visibleTests: [
              {
                id: "secrets-stay-server-side",
                name: "Secrets stay behind API boundary",
                code: "if (!boundary.server.includes('provider API key')) throw new Error('server must own provider key');\nif (boundary.mobile.includes('provider API key')) throw new Error('provider secret leaked to mobile');\nconsole.log('no provider secret on mobile passed');",
                expectedOutputIncludes: ["no provider secret", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["no provider secret", "passed"]
          }
        }
      )
    },
    {
      id: "lesson-ai-retrieval-grounding",
      moduleId: "module-ai-apps",
      slug: "ai-retrieval-grounding",
      title: "Ground Answers In Retrieved Notes",
      summary: "Separate retrieval from answer generation so AI app outputs can cite local evidence.",
      bodyMarkdown: "A practical AI app should know when it has support and when it does not. Retrieval gives the answer step a small local evidence set; the check confirms that claims point back to those notes.",
      estimatedMinutes: 12,
      difficulty: "applied",
      skillIds: ["skill-ai-verification", "skill-api-contracts", "skill-testing-debugging"],
      quizId: "quiz-ai-retrieval-grounding",
      desktopTask: "Create a tiny notes corpus and answer one question using only retrieved notes.",
      evidencePrompt: "Save retrieved note IDs, the answer, citation mapping, and unsupported-question behavior.",
      workshop: workshop(
        "Ground one AI-style answer in retrieved local notes.",
        "RAG features are safer when retrieval, answer drafting, and citation checking are separate steps that can each be tested.",
        "Retrieval selects relevant notes. Generation writes an answer using only those notes. Verification checks that every important claim cites a retrieved note.",
        "If note n1 says tests passed and note n2 says deployment is absent, the answer can cite n1 and n2 but should not invent production usage.",
        "Build a tiny retrieval result and an answer object with citations for each claim.",
        "This deepens the RAG Notes Search Prototype mission.",
        "Which claim would your verifier reject because no retrieved note supports it?",
        ["Answering from general knowledge", "Mixing retrieved and non-retrieved citations", "Skipping unsupported-question behavior"],
        undefined,
        {
          language: "Practical AI app design",
          tools: ["local notes", "retrieval function", "citation checker"],
          synopsis: "You are learning how an AI app can answer from a local evidence set instead of guessing from the model's general knowledge.",
          prerequisites: ["Understand that notes can be represented as small records with ids and text.", "Know that citations should point to specific source records."],
          testingFocus: "You will test that the answer cites retrieved note ids and that unsupported claims are rejected instead of invented."
        },
        {
          starterCode: "const notes = [{ id: 'n1', text: 'The parser tests passed.' }];\nconst answer = { text: 'The parser tests passed.', citations: ['n1'] };\nconsole.log(answer);",
          expectedOutput: "The answer cites only note ids that were retrieved, and unsupported questions return an uncertainty message.",
          checkYourAnswer: "If a citation points to a note that was not retrieved, the answer is not grounded. If the answer makes a claim with no citation, mark it unsupported."
        },
        {
          title: "Check answer citations against retrieved notes",
          goal: "Create a tiny retrieval result and verify that answer citations point only to retrieved notes.",
          steps: ["Create two local notes", "Select one retrieved note for a question", "Verify the answer cites only retrieved note ids"],
          deliverables: ["Notes corpus", "Retrieved ids", "Cited answer and unsupported-case note"],
          verifierCommand: "Run the citation-check script or Code Lab check.",
          expectedEvidence: "Retrieved note ids, answer citations, and check output showing citations are grounded in the retrieved set.",
          projectConnection: "This is the grounding check inside the RAG Notes Search Prototype mission.",
          tester: {
            codeLabel: "Paste your notes, retrieved ids, and cited answer",
            outputLabel: "Paste citation-check output",
            requiredCodeIncludes: ["notes", "retrievedIds", "citations"],
            requiredOutputIncludes: ["grounded", "passed"],
            successMessage: "Your AI app proof separates retrieval from answer grounding.",
            failureMessage: "The tester needs notes, retrieved ids, citations, and grounded check output."
          },
          runnerSpec: {
            language: "javascript",
            starterCode: "const notes = [{ id: 'n1', text: 'The parser tests passed.' }, { id: 'n2', text: 'Deployment is not configured.' }];\nconst retrievedIds = ['n1'];\nconst answer = { text: 'The parser tests passed.', citations: ['n1'] };\n\nfunction citationsAreGrounded(result, ids) {\n  return false;\n}",
            visibleTests: [
              {
                id: "citations-use-retrieved-notes",
                name: "Citations use only retrieved notes",
                code: "if (!citationsAreGrounded(answer, retrievedIds)) throw new Error('answer should be grounded');\nif (citationsAreGrounded({ text: 'Deployment is ready.', citations: ['n2'] }, retrievedIds)) throw new Error('non-retrieved citation should fail');\nconsole.log('grounded citations passed');",
                expectedOutputIncludes: ["grounded", "passed"]
              }
            ],
            hiddenTests: [],
            expectedOutput: ["grounded", "passed"]
          }
        }
        ,
        aiRetrievalPracticeReps
      )
    },
];

export const aiAppsQuizzes: Quiz[] = [
      {
      id: "quiz-ai-app-boundaries",
      lessonId: "lesson-ai-app-boundaries",
      title: "AI boundary checkpoint",
      passingScore: 80,
      questions: [
        {
          id: "question-ai-boundary-1",
          prompt: "Where should a model-provider secret live?",
          choices: ["Inside the mobile bundle", "Behind a server boundary", "In a screenshot"],
          correctChoiceIndex: 1,
          explanation: "Client bundles can be inspected, so privileged secrets must stay server-side."
        },
        {
          id: "question-ai-boundary-2",
          prompt: "What should the app send when it calls a model provider?",
          choices: ["A request proxied through a server that holds the key", "The API key copied into the request from the device", "A list of local user files"],
          correctChoiceIndex: 0,
          explanation: "A server-side proxy keeps the credential private while the app sends only the prompt data."
        },
        {
          id: "question-ai-boundary-3",
          prompt: "Why keep model outputs behind the same review as human edits?",
          choices: ["Generated code can be wrong in ways only checks reveal", "Models refuse to write tests", "Reviews slow down releases"],
          correctChoiceIndex: 0,
          explanation: "Treating model output like any other draft keeps verification in charge of what ships."
        }
      ].map(shuffleQuizChoices)
    },
      {
      id: "quiz-ai-retrieval-grounding",
      lessonId: "lesson-ai-retrieval-grounding",
      title: "Retrieval grounding checkpoint",
      passingScore: 80,
      questions: ([
        {
          id: "question-ai-retrieval-1",
          prompt: "What should retrieval provide before answer generation?",
          choices: ["A small evidence set with note ids", "A hidden provider key", "A production claim with no source"],
          correctChoiceIndex: 0,
          explanation: "The answer step should work from retrieved source records that can be checked."
        },
        {
          id: "question-ai-retrieval-2",
          prompt: "What should happen when no retrieved note supports the claim?",
          choices: ["Return uncertainty or reject the claim", "Invent a confident answer", "Cite any random note"],
          correctChoiceIndex: 0,
          explanation: "Unsupported answers should fail closed instead of pretending a source exists."
        },
        {
          id: "question-ai-retrieval-3",
          prompt: "Why check citation ids?",
          choices: ["To prove claims map back to retrieved evidence", "To remove all local notes", "To skip evaluation"],
          correctChoiceIndex: 0,
          explanation: "Citation checks make grounding inspectable instead of decorative."
        }
      ].map(shuffleQuizChoices)),
    },
];
