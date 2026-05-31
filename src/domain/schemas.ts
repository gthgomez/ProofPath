import { z } from "zod";

const nonEmptyString = z.string().min(1);

export const hiddenCheckSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative()
});

export const terminalEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("context"),
    cwd: nonEmptyString,
    file: nonEmptyString,
    language: z.enum(["python", "sql", "javascript", "typescript"])
  }),
  z.object({ type: z.literal("command"), text: nonEmptyString }),
  z.object({
    type: z.literal("phase"),
    label: nonEmptyString,
    status: z.enum(["pending", "active", "done", "failed", "skipped"])
  }),
  z.object({ type: z.literal("stdout"), text: z.string() }),
  z.object({ type: z.literal("stderr"), text: z.string() }),
  z.object({
    type: z.literal("diagnostic"),
    severity: z.enum(["info", "warning", "error"]),
    message: nonEmptyString,
    line: z.number().int().positive().optional()
  }),
  z.object({
    type: z.literal("result"),
    status: z.enum(["passed", "failed", "timeout", "policy_blocked"]),
    runtimeMs: z.number().int().nonnegative(),
    exitCode: z.number().int().optional(),
    reason: z.enum(["success", "syntax_error", "runtime_error", "check_failed", "timeout", "policy_blocked", "runner_error"])
  })
]);

export const problemDiagnosticSchema = z.object({
  id: nonEmptyString,
  severity: z.enum(["info", "warning", "error"]),
  source: z.enum(["parser", "runtime", "check", "policy", "system"]),
  message: nonEmptyString,
  beginnerExplanation: z.string().optional(),
  rawDetail: z.string().optional(),
  line: z.number().int().positive().optional(),
  column: z.number().int().positive().optional(),
  confidence: z.enum(["known", "estimated", "unknown"])
});

export const codeRunTestResultSchema = z.object({
  id: nonEmptyString,
  name: nonEmptyString,
  passed: z.boolean(),
  visible: z.boolean(),
  message: nonEmptyString
});

export const skillSchema = z.object({
  id: nonEmptyString,
  slug: nonEmptyString,
  name: nonEmptyString,
  category: z.enum(["workflow", "language", "data", "backend", "ai", "portfolio"])
});

export const skillEdgeSchema = z.object({
  fromSkillId: nonEmptyString,
  toSkillId: nonEmptyString,
  relationType: z.enum(["prerequisite", "supports", "extends"])
});

export const roleTargetSchema = z.object({
  id: nonEmptyString,
  title: nonEmptyString,
  summary: nonEmptyString,
  trackIds: z.array(nonEmptyString).min(1),
  default: z.boolean()
});

export const trackSchema = z.object({
  id: nonEmptyString,
  slug: nonEmptyString,
  title: nonEmptyString,
  summary: nonEmptyString,
  roleTargets: z.array(nonEmptyString).min(1),
  moduleIds: z.array(nonEmptyString).min(1),
  accentColor: nonEmptyString
});

export const moduleSchema = z.object({
  id: nonEmptyString,
  trackId: nonEmptyString,
  slug: nonEmptyString,
  title: nonEmptyString,
  summary: nonEmptyString,
  lessonIds: z.array(nonEmptyString).min(1),
  projectMissionIds: z.array(nonEmptyString),
  skillIds: z.array(nonEmptyString).min(1),
  sortOrder: z.number().int().nonnegative()
});

export const lessonWorkshopSchema = z.object({
  language: nonEmptyString,
  tools: z.array(nonEmptyString).min(1),
  synopsis: nonEmptyString,
  prerequisites: z.array(nonEmptyString).min(1),
  testingFocus: nonEmptyString,
  codeShape: z.string().min(20).optional(),
  practice: z.object({
    starterCode: nonEmptyString,
    expectedOutput: nonEmptyString,
    checkYourAnswer: nonEmptyString
  }),
  practiceReps: z.array(z.object({
    starterCode: nonEmptyString,
    expectedOutput: nonEmptyString,
    checkYourAnswer: nonEmptyString
  })).optional(),
  miniProject: z.object({
    title: nonEmptyString,
    goal: nonEmptyString,
    steps: z.array(nonEmptyString).min(2),
    deliverables: z.array(nonEmptyString).min(1),
    verifierCommand: nonEmptyString,
    expectedEvidence: nonEmptyString,
    projectConnection: nonEmptyString,
    tester: z.object({
      codeLabel: nonEmptyString,
      outputLabel: nonEmptyString,
      requiredCodeIncludes: z.array(nonEmptyString),
      requiredOutputIncludes: z.array(nonEmptyString).min(1),
      forbiddenOutputIncludes: z.array(nonEmptyString),
      successMessage: nonEmptyString,
      failureMessage: nonEmptyString
    }),
    runnerSpec: z.object({
      language: z.enum(["python", "sql", "javascript", "typescript"]),
      instructions: nonEmptyString,
      starterCode: nonEmptyString,
      setupCode: z.string().optional(),
      visibleTests: z.array(z.object({
        id: nonEmptyString,
        name: nonEmptyString,
        code: nonEmptyString,
        expectedOutputIncludes: z.array(nonEmptyString).optional()
      })).min(1),
      hiddenTests: z.array(z.object({
        id: nonEmptyString,
        name: nonEmptyString,
        code: nonEmptyString,
        expectedOutputIncludes: z.array(nonEmptyString).optional()
      })),
      expectedOutput: z.array(nonEmptyString),
      timeoutMs: z.number().int().positive(),
      memoryLimitMb: z.number().int().positive().optional(),
      allowNetwork: z.literal(false)
    })
  }),
  objective: nonEmptyString,
  whyItMatters: nonEmptyString,
  coreConcept: nonEmptyString,
  workedExample: nonEmptyString,
  commonMistakes: z.array(nonEmptyString).min(1),
  guidedExercise: nonEmptyString,
  missionConnection: nonEmptyString,
  reflectionPrompt: nonEmptyString
});

export const lessonSchema = z.object({
  id: nonEmptyString,
  moduleId: nonEmptyString,
  slug: nonEmptyString,
  title: nonEmptyString,
  summary: nonEmptyString,
  bodyMarkdown: nonEmptyString,
  estimatedMinutes: z.number().int().positive(),
  difficulty: z.enum(["foundation", "applied", "portfolio"]),
  skillIds: z.array(nonEmptyString).min(1),
  quizId: nonEmptyString,
  desktopTask: nonEmptyString,
  evidencePrompt: nonEmptyString,
  workshop: lessonWorkshopSchema
});

export const quizQuestionSchema = z.object({
  id: nonEmptyString,
  prompt: nonEmptyString,
  choices: z.array(nonEmptyString).min(2),
  correctChoiceIndex: z.number().int().nonnegative(),
  explanation: nonEmptyString
}).superRefine((question, context) => {
  if (question.correctChoiceIndex >= question.choices.length) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "correctChoiceIndex must point at a choice"
    });
  }
});

export const quizSchema = z.object({
  id: nonEmptyString,
  lessonId: nonEmptyString,
  title: nonEmptyString,
  passingScore: z.number().min(0).max(100),
  questions: z.array(quizQuestionSchema).min(1)
});

export const missionEvidenceRequirementsSchema = z.object({
  repoUrl: z.boolean(),
  commitHash: z.boolean(),
  passingVerifierOutput: z.boolean(),
  readmeStatus: z.enum(["missing", "basic", "complete"]),
  artifactOrDeployment: z.boolean(),
  reflection: z.boolean()
});

export const projectMissionPhaseSchema = z.object({
  id: nonEmptyString,
  title: nonEmptyString,
  goal: nonEmptyString,
  tasks: z.array(nonEmptyString).min(1)
});

export const quizAttemptSchema = z.object({
  id: nonEmptyString,
  quizId: nonEmptyString,
  selectedChoiceIndexes: z.array(z.number().int().nonnegative()),
  score: z.number().min(0).max(100),
  passed: z.boolean(),
  attemptedAt: nonEmptyString
});

export const codeRunAttemptSchema = z.object({
  id: nonEmptyString,
  lessonId: nonEmptyString,
  language: z.enum(["python", "sql", "javascript", "typescript"]),
  runMode: z.enum(["run_file", "run_checks"]).default("run_checks"),
  command: z.string().default("careerforge checks"),
  codeSnapshot: nonEmptyString,
  stdout: z.string(),
  stderr: z.string(),
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  runtimeMs: z.number().int().nonnegative(),
  testResults: z.array(codeRunTestResultSchema),
  hiddenCheckSummary: hiddenCheckSummarySchema.default({ total: 0, passed: 0, failed: 0 }),
  diagnostics: z.array(problemDiagnosticSchema).default([]),
  terminalTranscript: z.array(terminalEventSchema).default([]),
  createdAt: nonEmptyString
});

export const proofArtifactSchema = z.object({
  sourceRunAttemptId: nonEmptyString,
  lessonId: nonEmptyString,
  lessonVersion: z.string().optional(),
  missionId: z.string().optional(),
  language: z.enum(["python", "sql", "javascript", "typescript"]),
  runMode: z.literal("run_checks"),
  command: nonEmptyString,
  passed: z.boolean(),
  score: z.number().min(0).max(100).optional(),
  runtimeMs: z.number().int().nonnegative(),
  createdAt: nonEmptyString,
  stdout: z.string(),
  stderr: z.string(),
  visibleCheckResults: z.array(codeRunTestResultSchema),
  hiddenCheckSummary: hiddenCheckSummarySchema,
  codeHash: nonEmptyString,
  codeSnapshot: z.string().optional(),
  terminalTranscript: z.array(terminalEventSchema)
});

export const projectMissionSchema = z.object({
  id: nonEmptyString,
  trackId: nonEmptyString,
  title: nonEmptyString,
  brief: nonEmptyString,
  difficulty: z.enum(["foundation", "applied", "portfolio"]),
  deliverables: z.array(nonEmptyString).min(1),
  acceptanceCriteria: z.array(nonEmptyString).min(1),
  phases: z.array(projectMissionPhaseSchema).min(1),
  starterPrompt: nonEmptyString,
  verificationCommands: z.array(nonEmptyString).min(1),
  expectedArtifacts: z.array(nonEmptyString).min(1),
  rubric: z.array(nonEmptyString).min(1),
  commonFailureModes: z.array(nonEmptyString).min(1),
  portfolioSummaryPrompt: nonEmptyString,
  evidenceRequirements: missionEvidenceRequirementsSchema,
  skillIds: z.array(nonEmptyString).min(1)
});

export const evidenceItemSchema = z.object({
  id: nonEmptyString,
  type: z.enum(["repo", "commit", "test-output", "screenshot", "reflection", "deployment", "note"]),
  title: nonEmptyString,
  body: nonEmptyString,
  linkedProjectMissionId: z.string().optional(),
  linkedLessonId: z.string().optional(),
  linkedSkillIds: z.array(nonEmptyString).optional(),
  uri: z.string().optional(),
  repoUrl: z.string().optional(),
  commitHash: z.string().optional(),
  testStatus: z.enum(["unknown", "not-run", "passing", "failing"]).optional(),
  artifactUri: z.string().optional(),
  readmeStatus: z.enum(["missing", "basic", "complete"]).optional(),
  deploymentUrl: z.string().optional(),
  verifierOutput: z.string().optional(),
  reflection: z.string().optional(),
  proofArtifact: proofArtifactSchema.optional(),
  trust: z.enum(["auto_verified_code_lab", "manual_verifier_output", "manual_note"]).default("manual_note"),
  createdAt: nonEmptyString
});

export const userProfileSchema = z.object({
  roleTargetId: nonEmptyString,
  onboardingCompletedAt: z.string().optional(),
  createdAt: nonEmptyString,
  updatedAt: nonEmptyString
});

export const reviewItemSchema = z.object({
  targetType: z.enum(["lesson", "quiz", "mission"]),
  targetId: nonEmptyString,
  dueAt: nonEmptyString,
  lastReviewedAt: z.string().optional(),
  intervalDays: z.number().int().positive(),
  repetitions: z.number().int().nonnegative(),
  easeFactor: z.number().min(1.3),
  lapses: z.number().int().nonnegative()
});

export const reviewEventSchema = z.object({
  id: nonEmptyString,
  targetType: z.enum(["lesson", "quiz", "mission"]),
  targetId: nonEmptyString,
  rating: z.enum(["again", "hard", "good", "easy"]),
  reviewedAt: nonEmptyString,
  nextDueAt: nonEmptyString,
  intervalDays: z.number().int().positive()
});

export const weeklyReportSnapshotSchema = z.object({
  id: nonEmptyString,
  weekStart: nonEmptyString,
  generatedAt: nonEmptyString,
  roleTargetId: nonEmptyString,
  readinessScore: z.number().min(0).max(100),
  lessonsCompleted: z.number().int().nonnegative(),
  quizzesCompleted: z.number().int().nonnegative(),
  missionsCompleted: z.number().int().nonnegative(),
  evidenceCount: z.number().int().nonnegative(),
  passingEvidenceCount: z.number().int().nonnegative(),
  reviewEventsCount: z.number().int().nonnegative(),
  summary: nonEmptyString,
  wins: z.array(nonEmptyString),
  risks: z.array(nonEmptyString),
  nextActions: z.array(nonEmptyString),
  portfolioSummary: z.string().optional(),
  portfolioBullets: z.array(nonEmptyString).optional(),
  projectGaps: z.array(nonEmptyString).optional(),
  portfolioMarkdown: z.string().optional()
});

export const userProgressSchema = z.object({
  profile: userProfileSchema.optional(),
  completedLessonIds: z.array(nonEmptyString),
  completedLessonMiniProjectIds: z.array(nonEmptyString).optional(),
  completedQuizIds: z.array(nonEmptyString),
  completedProjectMissionIds: z.array(nonEmptyString),
  completedProjectMissionDeliverableIds: z.array(nonEmptyString).optional(),
  completedProjectMissionPhaseIds: z.array(nonEmptyString).optional(),
  evidenceItems: z.array(evidenceItemSchema),
  quizAttempts: z.array(quizAttemptSchema).optional(),
  codeRunAttempts: z.array(codeRunAttemptSchema).optional(),
  weeklyPlanTaskIds: z.array(nonEmptyString),
  reviewItems: z.array(reviewItemSchema).optional(),
  reviewEvents: z.array(reviewEventSchema).optional(),
  weeklyReports: z.array(weeklyReportSnapshotSchema).optional(),
  updatedAt: nonEmptyString
});

export const weeklyPlanTaskSchema = z.object({
  id: nonEmptyString,
  title: nonEmptyString,
  detail: nonEmptyString,
  linkedLessonId: z.string().optional(),
  linkedProjectMissionId: z.string().optional(),
  minutes: z.number().int().positive()
});

export const weeklyPlanSchema = z.object({
  id: nonEmptyString,
  weekStart: nonEmptyString,
  headline: nonEmptyString,
  tasks: z.array(weeklyPlanTaskSchema).min(1)
});

export const contentPackSchema = z.object({
  skills: z.array(skillSchema).min(1),
  skillEdges: z.array(skillEdgeSchema),
  tracks: z.array(trackSchema).min(1),
  modules: z.array(moduleSchema).min(1),
  lessons: z.array(lessonSchema).min(1),
  quizzes: z.array(quizSchema).min(1),
  projectMissions: z.array(projectMissionSchema).min(1),
  weeklyPlan: weeklyPlanSchema
});
