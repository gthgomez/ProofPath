export type Difficulty = "foundation" | "applied" | "portfolio";

export type EvidenceType =
  | "repo"
  | "commit"
  | "test-output"
  | "screenshot"
  | "reflection"
  | "deployment"
  | "note";
export type EvidenceTestStatus = "unknown" | "not-run" | "passing" | "failing";
export type ReadmeStatus = "missing" | "basic" | "complete";
export type RunnerLanguage = "python" | "sql" | "javascript" | "typescript";
export type CodeRunMode = "run_file" | "run_checks";
export type TerminalPhaseStatus = "pending" | "active" | "done" | "failed" | "skipped";
export type TerminalResultReason =
  | "success"
  | "syntax_error"
  | "runtime_error"
  | "check_failed"
  | "timeout"
  | "policy_blocked"
  | "runner_error";
export type EvidenceTrustClassification = "auto_verified_code_lab" | "manual_verifier_output" | "manual_note";

export type TerminalEvent =
  | { type: "context"; cwd: string; file: string; language: RunnerLanguage }
  | { type: "command"; text: string }
  | { type: "phase"; label: string; status: TerminalPhaseStatus }
  | { type: "stdout"; text: string }
  | { type: "stderr"; text: string }
  | { type: "diagnostic"; severity: "info" | "warning" | "error"; message: string; line?: number }
  | {
      type: "result";
      status: "passed" | "failed" | "timeout" | "policy_blocked";
      runtimeMs: number;
      exitCode?: number;
      reason: TerminalResultReason;
    };

export interface ProblemDiagnostic {
  id: string;
  severity: "info" | "warning" | "error";
  source: "parser" | "runtime" | "check" | "policy" | "system";
  message: string;
  beginnerExplanation?: string;
  rawDetail?: string;
  line?: number;
  column?: number;
  confidence: "known" | "estimated" | "unknown";
}

export interface HiddenCheckSummary {
  total: number;
  passed: number;
  failed: number;
}

export interface SandboxRuntimeCapabilities {
  language: RunnerLanguage;
  workflowLabel: string;
  supportsRunFile: boolean;
  supportsRunChecks: boolean;
  supportsProofCapture: boolean;
  supportsTypecheck: boolean;
  beginnerNote?: string;
  limitations: string[];
}

export type AttemptStatus = "not-started" | "in-progress" | "completed";
export type ReviewTargetType = "lesson" | "quiz" | "mission";
export type ReviewRating = "again" | "hard" | "good" | "easy";

export interface RoleTarget {
  id: string;
  title: string;
  summary: string;
  trackIds: string[];
  default: boolean;
}

export interface Skill {
  id: string;
  slug: string;
  name: string;
  category: "workflow" | "language" | "data" | "backend" | "ai" | "portfolio";
}

export interface SkillEdge {
  fromSkillId: string;
  toSkillId: string;
  relationType: "prerequisite" | "supports" | "extends";
}

export interface Track {
  id: string;
  slug: string;
  title: string;
  summary: string;
  roleTargets: string[];
  moduleIds: string[];
  accentColor: string;
}

export interface Module {
  id: string;
  trackId: string;
  slug: string;
  title: string;
  summary: string;
  lessonIds: string[];
  projectMissionIds: string[];
  skillIds: string[];
  sortOrder: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  estimatedMinutes: number;
  difficulty: Difficulty;
  skillIds: string[];
  quizId: string;
  desktopTask: string;
  evidencePrompt: string;
  workshop: LessonWorkshop;
}

export interface LessonWorkshop {
  language: string;
  tools: string[];
  synopsis: string;
  prerequisites: string[];
  testingFocus: string;
  codeShape?: string;
  practice: LessonPracticeBlock;
  practiceReps?: LessonPracticeBlock[];
  miniProject: LessonMiniProject;
  objective: string;
  whyItMatters: string;
  coreConcept: string;
  workedExample: string;
  commonMistakes: string[];
  misconceptionChecks: LessonMisconceptionCheck[];
  recallCards: LessonRecallCard[];
  guidedExercise: string;
  missionConnection: string;
  reflectionPrompt: string;
}

export type LessonRecallCardType = "explain" | "debug" | "transfer";

export interface LessonRecallCard {
  id: string;
  type: LessonRecallCardType;
  prompt: string;
  answerHint: string;
}

export interface LessonMisconceptionCheck {
  mistake: string;
  repair: string;
  checkPrompt: string;
}

export interface LessonPracticeBlock {
  starterCode: string;
  expectedOutput: string;
  checkYourAnswer: string;
}

export interface LessonMiniProject {
  title: string;
  goal: string;
  steps: string[];
  deliverables: string[];
  verifierCommand: string;
  expectedEvidence: string;
  projectConnection: string;
  tester: LessonMiniProjectTester;
  runnerSpec: LessonRunnerSpec;
}

export interface LessonMiniProjectTester {
  codeLabel: string;
  outputLabel: string;
  requiredCodeIncludes: string[];
  requiredOutputIncludes: string[];
  forbiddenOutputIncludes: string[];
  successMessage: string;
  failureMessage: string;
}

export interface LessonRunnerSpec {
  language: RunnerLanguage;
  instructions: string;
  starterCode: string;
  setupCode?: string;
  visibleTests: LessonRunnerTest[];
  hiddenTests: LessonRunnerTest[];
  expectedOutput: string[];
  timeoutMs: number;
  memoryLimitMb?: number;
  allowNetwork: false;
}

export interface LessonRunnerTest {
  id: string;
  name: string;
  code: string;
  expectedOutputIncludes?: string[];
}

export interface CodeRunAttempt {
  id: string;
  lessonId: string;
  language: RunnerLanguage;
  runMode: CodeRunMode;
  command: string;
  codeSnapshot: string;
  stdout: string;
  stderr: string;
  passed: boolean;
  score: number;
  runtimeMs: number;
  testResults: CodeRunTestResult[];
  hiddenCheckSummary: HiddenCheckSummary;
  diagnostics: ProblemDiagnostic[];
  terminalTranscript: TerminalEvent[];
  createdAt: string;
}

export interface CodeRunTestResult {
  id: string;
  name: string;
  passed: boolean;
  visible: boolean;
  message: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  choices: string[];
  correctChoiceIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  lessonId: string;
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  selectedChoiceIndexes: number[];
  score: number;
  passed: boolean;
  attemptedAt: string;
}

export interface ProjectMission {
  id: string;
  trackId: string;
  title: string;
  brief: string;
  difficulty: Difficulty;
  deliverables: string[];
  acceptanceCriteria: string[];
  phases: ProjectMissionPhase[];
  starterPrompt: string;
  verificationCommands: string[];
  expectedArtifacts: string[];
  rubric: string[];
  commonFailureModes: string[];
  portfolioSummaryPrompt: string;
  evidenceRequirements: MissionEvidenceRequirements;
  skillIds: string[];
}

export interface ProjectMissionPhase {
  id: string;
  title: string;
  goal: string;
  tasks: string[];
}

export interface MissionEvidenceRequirements {
  repoUrl: boolean;
  commitHash: boolean;
  passingVerifierOutput: boolean;
  readmeStatus: ReadmeStatus;
  artifactOrDeployment: boolean;
  reflection: boolean;
}

export interface EvidenceItem {
  id: string;
  type: EvidenceType;
  title: string;
  body: string;
  linkedProjectMissionId?: string;
  linkedLessonId?: string;
  linkedSkillIds: string[];
  uri?: string;
  repoUrl?: string;
  commitHash?: string;
  testStatus: EvidenceTestStatus;
  artifactUri?: string;
  readmeStatus: ReadmeStatus;
  deploymentUrl?: string;
  verifierOutput?: string;
  reflection?: string;
  proofArtifact?: ProofArtifact;
  trust?: EvidenceTrustClassification;
  createdAt: string;
}

export interface ProofArtifact {
  sourceRunAttemptId: string;
  lessonId: string;
  lessonVersion?: string;
  missionId?: string;
  language: RunnerLanguage;
  runMode: "run_checks";
  command: string;
  passed: boolean;
  score?: number;
  runtimeMs: number;
  createdAt: string;
  stdout: string;
  stderr: string;
  visibleCheckResults: CodeRunTestResult[];
  hiddenCheckSummary: HiddenCheckSummary;
  codeHash: string;
  codeSnapshot?: string;
  terminalTranscript: TerminalEvent[];
}

export interface UserProfile {
  roleTargetId: string;
  onboardingCompletedAt?: string;
  dashboardTourDismissed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewItem {
  targetType: ReviewTargetType;
  targetId: string;
  dueAt: string;
  lastReviewedAt?: string;
  intervalDays: number;
  repetitions: number;
  easeFactor: number;
  lapses: number;
}

export interface ReviewEvent {
  id: string;
  targetType: ReviewTargetType;
  targetId: string;
  rating: ReviewRating;
  reviewedAt: string;
  nextDueAt: string;
  intervalDays: number;
}

export interface WeeklyReportSnapshot {
  id: string;
  weekStart: string;
  generatedAt: string;
  roleTargetId: string;
  readinessScore: number;
  lessonsCompleted: number;
  quizzesCompleted: number;
  missionsCompleted: number;
  evidenceCount: number;
  passingEvidenceCount: number;
  reviewEventsCount: number;
  summary: string;
  wins: string[];
  risks: string[];
  nextActions: string[];
  portfolioSummary?: string;
  portfolioBullets?: string[];
  projectGaps?: string[];
  portfolioMarkdown?: string;
}

export interface UserProgress {
  profile: UserProfile;
  completedLessonIds: string[];
  completedLessonMiniProjectIds: string[];
  completedQuizIds: string[];
  placedOutLessonIds: string[];
  placedOutQuizIds: string[];
  completedProjectMissionIds: string[];
  completedProjectMissionDeliverableIds: string[];
  completedProjectMissionPhaseIds: string[];
  evidenceItems: EvidenceItem[];
  quizAttempts: QuizAttempt[];
  codeRunAttempts: CodeRunAttempt[];
  weeklyPlanTaskIds: string[];
  reviewItems: ReviewItem[];
  reviewEvents: ReviewEvent[];
  weeklyReports: WeeklyReportSnapshot[];
  updatedAt: string;
}

export interface WeeklyPlanTask {
  id: string;
  title: string;
  detail: string;
  linkedLessonId?: string;
  linkedProjectMissionId?: string;
  minutes: number;
}

export interface WeeklyPlan {
  id: string;
  weekStart: string;
  headline: string;
  tasks: WeeklyPlanTask[];
}

export interface ContentPack {
  skills: Skill[];
  skillEdges: SkillEdge[];
  tracks: Track[];
  modules: Module[];
  lessons: Lesson[];
  quizzes: Quiz[];
  projectMissions: ProjectMission[];
  weeklyPlan: WeeklyPlan;
}

export interface ReadinessBreakdown {
  lessonCompletion: number;
  quizPerformance: number;
  projectCompletion: number;
  evidenceHygiene: number;
  reviewCadence: number;
}

export interface ReadinessScore {
  score: number;
  label: "starting" | "building" | "portfolio-ready";
  breakdown: ReadinessBreakdown;
  nextAction: string;
  weakestArea: keyof ReadinessBreakdown;
  blockingProofRequirement: string;
  explanation: string[];
}
