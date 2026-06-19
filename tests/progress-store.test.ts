import type { SQLiteDatabase } from "expo-sqlite";
import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import {
  addEvidenceItem,
  createInitialProgress,
  generateWeeklyReport,
  recordReview,
  setLessonCompletion,
  setLessonMiniProjectCompletion,
  setMissionDeliverableCompletion,
  setMissionPhaseCompletion,
  setMissionCompletion,
  setQuizCompletion,
  setRoleTarget,
  setWeeklyPlanTaskCompletion,
  ensureProgressProfile
} from "@/domain/progress";
import type { EvidenceItem, QuizAttempt, ReviewEvent, ReviewItem, UserProgress, WeeklyReportSnapshot } from "@/domain/types";
import type { CodeRunAttempt } from "@/domain/types";
import { loadProgress, migrateProgressDb, resetProgress, saveProgress } from "@/storage/progress-store";

interface LegacyRow {
  payload: string;
  updatedAt: string;
}

interface ProfileRow {
  role_target_id: string;
  onboarding_completed_at: string | null;
  dashboard_tour_dismissed?: number;
  created_at: string;
  updated_at: string;
}

interface CompletionRecord {
  entity_id: string;
  sort_order: number;
}

interface EvidenceRecord {
  item: EvidenceItem;
  sort_order: number;
}

interface MissionDeliverableRecord {
  mission_id: string;
  deliverable_index: number;
}

interface MissionPhaseRecord {
  mission_id: string;
  phase_id: string;
  sort_order: number;
}

interface QuizAttemptRecord {
  attempt: QuizAttempt;
  sort_order: number;
}

interface CodeRunAttemptRecord {
  attempt: CodeRunAttempt;
  sort_order: number;
}

interface EvidenceSkillRecord {
  evidence_id: string;
  skill_id: string;
  sort_order: number;
}

interface ReviewItemRecord {
  item: ReviewItem;
  sort_order: number;
}

interface ReviewEventRecord {
  event: ReviewEvent;
  sort_order: number;
}

interface WeeklyReportRecord {
  report: WeeklyReportSnapshot;
  sort_order: number;
}

interface WeeklyReportListRecord {
  report_id: string;
  value: string;
  sort_order: number;
}

class FakeSQLiteDatabase {
  public version = 0;
  public legacyRow: LegacyRow | null = null;
  public executedSql: string[] = [];
  public runSql: string[] = [];
  public metadata: { updated_at: string } | null = null;
  public profile: ProfileRow | null = null;
  public completedLessons: CompletionRecord[] = [];
  public completedLessonMiniProjects: CompletionRecord[] = [];
  public completedQuizzes: CompletionRecord[] = [];
  public completedProjectMissions: CompletionRecord[] = [];
  public completedProjectMissionDeliverables: MissionDeliverableRecord[] = [];
  public completedProjectMissionPhases: MissionPhaseRecord[] = [];
  public completedWeeklyPlanTasks: CompletionRecord[] = [];
  public quizAttempts: QuizAttemptRecord[] = [];
  public codeRunAttempts: CodeRunAttemptRecord[] = [];
  public evidenceItems: EvidenceRecord[] = [];
  public evidenceSkillLinks: EvidenceSkillRecord[] = [];
  public reviewItems: ReviewItemRecord[] = [];
  public reviewEvents: ReviewEventRecord[] = [];
  public weeklyReports: WeeklyReportRecord[] = [];
  public weeklyReportWins: WeeklyReportListRecord[] = [];
  public weeklyReportRisks: WeeklyReportListRecord[] = [];
  public weeklyReportNextActions: WeeklyReportListRecord[] = [];
  public weeklyReportPortfolioBullets: WeeklyReportListRecord[] = [];
  public weeklyReportProjectGaps: WeeklyReportListRecord[] = [];

  async withExclusiveTransactionAsync(task: (transactionDb: SQLiteDatabase) => Promise<void>): Promise<void> {
    await task(this as unknown as SQLiteDatabase);
  }

  async getFirstAsync<T>(sql: string): Promise<T | null> {
    const normalizedSql = normalizeSql(sql);

    if (normalizedSql.startsWith("PRAGMA user_version")) {
      return { user_version: this.version } as T;
    }

    if (normalizedSql.startsWith("SELECT payload FROM progress_state")) {
      return this.legacyRow ? { payload: this.legacyRow.payload } as T : null;
    }

    if (normalizedSql.startsWith("SELECT id FROM user_profile")) {
      return this.profile ? { id: "default" } as T : null;
    }

    if (normalizedSql.startsWith("SELECT updated_at FROM progress_metadata")) {
      return this.metadata as T | null;
    }

    if (normalizedSql.startsWith("SELECT role_target_id")) {
      return this.profile as T | null;
    }

    return null;
  }

  async getAllAsync<T>(sql: string): Promise<T[]> {
    const normalizedSql = normalizeSql(sql);

    if (normalizedSql.startsWith("SELECT lesson_id AS entity_id FROM completed_lesson_mini_projects")) {
      return sortByOrder(this.completedLessonMiniProjects) as T[];
    }

    if (normalizedSql.startsWith("SELECT lesson_id AS entity_id")) {
      return sortByOrder(this.completedLessons) as T[];
    }

    if (normalizedSql.startsWith("SELECT quiz_id AS entity_id")) {
      return sortByOrder(this.completedQuizzes) as T[];
    }

    if (normalizedSql.startsWith("SELECT project_mission_id AS entity_id")) {
      return sortByOrder(this.completedProjectMissions) as T[];
    }

    if (normalizedSql.startsWith("SELECT task_id AS entity_id")) {
      return sortByOrder(this.completedWeeklyPlanTasks) as T[];
    }

    if (normalizedSql.startsWith("SELECT project_mission_id, deliverable_index")) {
      return this.completedProjectMissionDeliverables
        .slice()
        .sort((left, right) => left.mission_id.localeCompare(right.mission_id) || left.deliverable_index - right.deliverable_index) as T[];
    }

    if (normalizedSql.startsWith("SELECT project_mission_id, phase_id")) {
      return sortByOrder(this.completedProjectMissionPhases) as T[];
    }

    if (normalizedSql.startsWith("SELECT id, quiz_id, selected_choice_indexes")) {
      return sortByOrder(this.quizAttempts).map(({ attempt }) => ({
        id: attempt.id,
        quiz_id: attempt.quizId,
        selected_choice_indexes: JSON.stringify(attempt.selectedChoiceIndexes),
        score: attempt.score,
        passed: attempt.passed ? 1 : 0,
        attempted_at: attempt.attemptedAt
      })) as T[];
    }

    if (normalizedSql.startsWith("SELECT id, lesson_id, language")) {
      return sortByOrder(this.codeRunAttempts).map(({ attempt }) => ({
        id: attempt.id,
        lesson_id: attempt.lessonId,
        language: attempt.language,
        run_mode: attempt.runMode,
        command: attempt.command,
        code_snapshot: attempt.codeSnapshot,
        stdout: attempt.stdout,
        stderr: attempt.stderr,
        passed: attempt.passed ? 1 : 0,
        score: attempt.score,
        runtime_ms: attempt.runtimeMs,
        test_results_json: JSON.stringify(attempt.testResults),
        hidden_check_summary_json: JSON.stringify(attempt.hiddenCheckSummary),
        diagnostics_json: JSON.stringify(attempt.diagnostics),
        terminal_transcript_json: JSON.stringify(attempt.terminalTranscript),
        created_at: attempt.createdAt
      })) as T[];
    }

    if (normalizedSql.startsWith("SELECT id, type, title, body")) {
      return sortByOrder(this.evidenceItems).map(({ item }) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        linked_project_mission_id: item.linkedProjectMissionId ?? null,
        linked_lesson_id: item.linkedLessonId ?? null,
        uri: item.uri ?? null,
        repo_url: item.repoUrl ?? null,
        commit_hash: item.commitHash ?? null,
        test_status: item.testStatus,
        artifact_uri: item.artifactUri ?? null,
        readme_status: item.readmeStatus,
        deployment_url: item.deploymentUrl ?? null,
        verifier_output: item.verifierOutput ?? null,
        reflection: item.reflection ?? null,
        proof_artifact_json: item.proofArtifact ? JSON.stringify(item.proofArtifact) : null,
        trust: item.trust,
        created_at: item.createdAt
      })) as T[];
    }

    if (normalizedSql.startsWith("SELECT evidence_id, skill_id")) {
      return this.evidenceSkillLinks
        .slice()
        .sort((left, right) => left.evidence_id.localeCompare(right.evidence_id) || left.sort_order - right.sort_order) as T[];
    }

    if (normalizedSql.startsWith("SELECT target_type, target_id, due_at")) {
      return sortByOrder(this.reviewItems).map(({ item }) => ({
        target_type: item.targetType,
        target_id: item.targetId,
        due_at: item.dueAt,
        last_reviewed_at: item.lastReviewedAt ?? null,
        interval_days: item.intervalDays,
        repetitions: item.repetitions,
        ease_factor: item.easeFactor,
        lapses: item.lapses
      })) as T[];
    }

    if (normalizedSql.startsWith("SELECT id, target_type, target_id")) {
      return sortByOrder(this.reviewEvents).map(({ event }) => ({
        id: event.id,
        target_type: event.targetType,
        target_id: event.targetId,
        rating: event.rating,
        reviewed_at: event.reviewedAt,
        next_due_at: event.nextDueAt,
        interval_days: event.intervalDays
      })) as T[];
    }

    if (normalizedSql.startsWith("SELECT id, week_start")) {
      return sortByOrder(this.weeklyReports).map(({ report }) => ({
        id: report.id,
        week_start: report.weekStart,
        generated_at: report.generatedAt,
        role_target_id: report.roleTargetId,
        readiness_score: report.readinessScore,
        lessons_completed: report.lessonsCompleted,
        quizzes_completed: report.quizzesCompleted,
        missions_completed: report.missionsCompleted,
        evidence_count: report.evidenceCount,
        passing_evidence_count: report.passingEvidenceCount,
        review_events_count: report.reviewEventsCount,
        portfolio_summary: report.portfolioSummary ?? null,
        portfolio_markdown: report.portfolioMarkdown ?? null,
        summary: report.summary
      })) as T[];
    }

    if (normalizedSql.startsWith("SELECT report_id, value FROM weekly_report_wins")) {
      return sortReportList(this.weeklyReportWins) as T[];
    }

    if (normalizedSql.startsWith("SELECT report_id, value FROM weekly_report_risks")) {
      return sortReportList(this.weeklyReportRisks) as T[];
    }

    if (normalizedSql.startsWith("SELECT report_id, value FROM weekly_report_next_actions")) {
      return sortReportList(this.weeklyReportNextActions) as T[];
    }

    if (normalizedSql.startsWith("SELECT report_id, value FROM weekly_report_portfolio_bullets")) {
      return sortReportList(this.weeklyReportPortfolioBullets) as T[];
    }

    if (normalizedSql.startsWith("SELECT report_id, value FROM weekly_report_project_gaps")) {
      return sortReportList(this.weeklyReportProjectGaps) as T[];
    }

    return [];
  }

  async execAsync(sql: string): Promise<void> {
    this.executedSql.push(sql);
    const versionMatch = /PRAGMA user_version = (\d+)/.exec(sql);

    if (versionMatch?.[1]) {
      this.version = Number(versionMatch[1]);
    }
  }

  async runAsync(sql: string, ...params: unknown[]): Promise<void> {
    const normalizedSql = normalizeSql(sql);
    this.runSql.push(sql);

    if (normalizedSql.startsWith("DELETE FROM")) {
      this.clearTable(normalizedSql.replace("DELETE FROM ", ""));
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO progress_state")) {
      this.legacyRow = { payload: params[1] as string, updatedAt: params[2] as string };
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO progress_metadata")) {
      this.metadata = { updated_at: params[1] as string };
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO user_profile")) {
      this.profile = {
        role_target_id: params[1] as string,
        onboarding_completed_at: params[2] as string | null,
        dashboard_tour_dismissed: params[5] as number | undefined,
        created_at: params[3] as string,
        updated_at: params[4] as string
      };
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO completed_lessons")) {
      this.completedLessons.push({ entity_id: params[0] as string, sort_order: params[1] as number });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO completed_lesson_mini_projects")) {
      this.completedLessonMiniProjects.push({ entity_id: params[0] as string, sort_order: params[1] as number });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO completed_quizzes")) {
      this.completedQuizzes.push({ entity_id: params[0] as string, sort_order: params[1] as number });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO completed_project_missions")) {
      this.completedProjectMissions.push({ entity_id: params[0] as string, sort_order: params[1] as number });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO completed_project_mission_deliverables")) {
      this.completedProjectMissionDeliverables.push({
        mission_id: params[0] as string,
        deliverable_index: params[1] as number
      });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO completed_project_mission_phases")) {
      this.completedProjectMissionPhases.push({
        mission_id: params[0] as string,
        phase_id: params[1] as string,
        sort_order: params[3] as number
      });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO completed_weekly_plan_tasks")) {
      this.completedWeeklyPlanTasks.push({ entity_id: params[0] as string, sort_order: params[1] as number });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO quiz_attempts")) {
      this.quizAttempts.push({
        attempt: {
          id: params[0] as string,
          quizId: params[1] as string,
          selectedChoiceIndexes: JSON.parse(params[2] as string) as number[],
          score: params[3] as number,
          passed: params[4] === 1,
          attemptedAt: params[5] as string
        },
        sort_order: params[6] as number
      });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO code_run_attempts")) {
      this.codeRunAttempts.push({
        attempt: {
          id: params[0] as string,
          lessonId: params[1] as string,
          language: params[2] as CodeRunAttempt["language"],
          runMode: params[3] as CodeRunAttempt["runMode"],
          command: params[4] as string,
          codeSnapshot: params[5] as string,
          stdout: params[6] as string,
          stderr: params[7] as string,
          passed: params[8] === 1,
          score: params[9] as number,
          runtimeMs: params[10] as number,
          testResults: JSON.parse(params[11] as string) as CodeRunAttempt["testResults"],
          hiddenCheckSummary: JSON.parse(params[12] as string) as CodeRunAttempt["hiddenCheckSummary"],
          diagnostics: JSON.parse(params[13] as string) as CodeRunAttempt["diagnostics"],
          terminalTranscript: JSON.parse(params[14] as string) as CodeRunAttempt["terminalTranscript"],
          createdAt: params[15] as string
        },
        sort_order: params[16] as number
      });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO evidence_items")) {
      this.evidenceItems.push({
        item: {
          id: params[0] as string,
          type: params[1] as EvidenceItem["type"],
          title: params[2] as string,
          body: params[3] as string,
          linkedProjectMissionId: params[4] as string | undefined,
          linkedLessonId: params[5] as string | undefined,
          linkedSkillIds: [],
          uri: params[6] as string | undefined,
          repoUrl: params[7] as string | undefined,
          commitHash: params[8] as string | undefined,
          testStatus: params[9] as EvidenceItem["testStatus"],
          artifactUri: params[10] as string | undefined,
          readmeStatus: params[11] as EvidenceItem["readmeStatus"],
          deploymentUrl: params[12] as string | undefined,
          verifierOutput: params[13] as string | undefined,
          reflection: params[14] as string | undefined,
          proofArtifact: params[15] ? JSON.parse(params[15] as string) as EvidenceItem["proofArtifact"] : undefined,
          trust: params[16] as EvidenceItem["trust"],
          createdAt: params[17] as string
        },
        sort_order: params[18] as number
      });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO evidence_skill_links")) {
      this.evidenceSkillLinks.push({
        evidence_id: params[0] as string,
        skill_id: params[1] as string,
        sort_order: params[2] as number
      });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO review_items")) {
      this.reviewItems.push({
        item: {
          targetType: params[0] as ReviewItem["targetType"],
          targetId: params[1] as string,
          dueAt: params[2] as string,
          lastReviewedAt: params[3] as string | undefined,
          intervalDays: params[4] as number,
          repetitions: params[5] as number,
          easeFactor: params[6] as number,
          lapses: params[7] as number
        },
        sort_order: params[8] as number
      });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO review_events")) {
      this.reviewEvents.push({
        event: {
          id: params[0] as string,
          targetType: params[1] as ReviewEvent["targetType"],
          targetId: params[2] as string,
          rating: params[3] as ReviewEvent["rating"],
          reviewedAt: params[4] as string,
          nextDueAt: params[5] as string,
          intervalDays: params[6] as number
        },
        sort_order: params[7] as number
      });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO weekly_reports")) {
      this.weeklyReports.push({
        report: {
          id: params[0] as string,
          weekStart: params[1] as string,
          generatedAt: params[2] as string,
          roleTargetId: params[3] as string,
          readinessScore: params[4] as number,
          lessonsCompleted: params[5] as number,
          quizzesCompleted: params[6] as number,
          missionsCompleted: params[7] as number,
          evidenceCount: params[8] as number,
          passingEvidenceCount: params[9] as number,
          reviewEventsCount: params[10] as number,
          portfolioSummary: params[11] as string | undefined,
          portfolioMarkdown: params[12] as string | undefined,
          summary: params[13] as string,
          wins: [],
          risks: [],
          nextActions: [],
          portfolioBullets: [],
          projectGaps: []
        },
        sort_order: params[14] as number
      });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO weekly_report_wins")) {
      this.weeklyReportWins.push({ report_id: params[0] as string, value: params[1] as string, sort_order: params[2] as number });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO weekly_report_risks")) {
      this.weeklyReportRisks.push({ report_id: params[0] as string, value: params[1] as string, sort_order: params[2] as number });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO weekly_report_next_actions")) {
      this.weeklyReportNextActions.push({ report_id: params[0] as string, value: params[1] as string, sort_order: params[2] as number });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO weekly_report_portfolio_bullets")) {
      this.weeklyReportPortfolioBullets.push({ report_id: params[0] as string, value: params[1] as string, sort_order: params[2] as number });
      return;
    }

    if (normalizedSql.startsWith("INSERT INTO weekly_report_project_gaps")) {
      this.weeklyReportProjectGaps.push({ report_id: params[0] as string, value: params[1] as string, sort_order: params[2] as number });
    }
  }

  private clearTable(tableName: string): void {
    switch (tableName) {
      case "progress_metadata":
        this.metadata = null;
        break;
      case "user_profile":
        this.profile = null;
        break;
      case "completed_lessons":
        this.completedLessons = [];
        break;
      case "completed_lesson_mini_projects":
        this.completedLessonMiniProjects = [];
        break;
      case "completed_quizzes":
        this.completedQuizzes = [];
        break;
      case "completed_project_missions":
        this.completedProjectMissions = [];
        break;
      case "completed_project_mission_deliverables":
        this.completedProjectMissionDeliverables = [];
        break;
      case "completed_project_mission_phases":
        this.completedProjectMissionPhases = [];
        break;
      case "completed_weekly_plan_tasks":
        this.completedWeeklyPlanTasks = [];
        break;
      case "quiz_attempts":
        this.quizAttempts = [];
        break;
      case "code_run_attempts":
        this.codeRunAttempts = [];
        break;
      case "evidence_items":
        this.evidenceItems = [];
        break;
      case "evidence_skill_links":
        this.evidenceSkillLinks = [];
        break;
      case "review_items":
        this.reviewItems = [];
        break;
      case "review_events":
        this.reviewEvents = [];
        break;
      case "weekly_reports":
        this.weeklyReports = [];
        break;
      case "weekly_report_wins":
        this.weeklyReportWins = [];
        break;
      case "weekly_report_risks":
        this.weeklyReportRisks = [];
        break;
      case "weekly_report_next_actions":
        this.weeklyReportNextActions = [];
        break;
      case "weekly_report_portfolio_bullets":
        this.weeklyReportPortfolioBullets = [];
        break;
      case "weekly_report_project_gaps":
        this.weeklyReportProjectGaps = [];
        break;
      default:
        break;
    }
  }
}

function createDb(): SQLiteDatabase {
  return new FakeSQLiteDatabase() as unknown as SQLiteDatabase;
}

function normalizeSql(sql: string): string {
  return sql.replace(/\s+/g, " ").trim();
}

function sortByOrder<T extends { sort_order: number }>(values: T[]): T[] {
  return values.slice().sort((left, right) => left.sort_order - right.sort_order);
}

function sortReportList(values: WeeklyReportListRecord[]): WeeklyReportListRecord[] {
  return values
    .slice()
    .sort((left, right) => left.report_id.localeCompare(right.report_id) || left.sort_order - right.sort_order);
}

function createRichProgress(): UserProgress {
  let progress = createInitialProgress("2026-05-04T16:45:00.000Z");
  progress = setRoleTarget(progress, "path-ai-product-engineering", true, "2026-05-04T16:46:00.000Z");
  progress = setLessonCompletion(progress, "lesson-python-functions", true, "2026-05-04T16:47:00.000Z");
  progress = setLessonMiniProjectCompletion(progress, "lesson-python-functions", true, "2026-05-04T16:47:30.000Z");
  progress = setQuizCompletion(progress, "quiz-python-functions", true, "2026-05-04T16:48:00.000Z");
  const cliMission = contentPack.projectMissions.find((mission) => mission.id === "mission-cli-study-tracker")!;
  progress = cliMission.deliverables.reduce(
    (currentProgress, _deliverable, index) => setMissionDeliverableCompletion(currentProgress, cliMission.id, index, true, "2026-05-04T16:48:30.000Z"),
    progress
  );
  progress = cliMission.phases.reduce(
    (currentProgress, phase) => setMissionPhaseCompletion(currentProgress, cliMission.id, phase.id, true, "2026-05-04T16:48:45.000Z"),
    progress
  );
  progress = setWeeklyPlanTaskCompletion(progress, "task-python-cli", true, "2026-05-04T16:50:00.000Z");
  progress = addEvidenceItem(progress, {
    type: "repo",
    title: "CLI tracker repo",
    body: "Built the tracker and captured verification output.",
    linkedProjectMissionId: "mission-cli-study-tracker",
    linkedLessonId: "lesson-python-functions",
    linkedSkillIds: ["skill-python-functions", "skill-testing-debugging", "skill-portfolio-evidence"],
    repoUrl: "https://github.com/example/cli-tracker",
    commitHash: "abcdef1234567890",
    testStatus: "passing",
    artifactUri: "https://example.com/demo.png",
    readmeStatus: "complete",
    deploymentUrl: "https://example.com/cli-tracker",
    verifierOutput: "npm run verify",
    reflection: "The failing case was input validation."
  }, "2026-05-04T17:00:00.000Z");
  progress = setMissionCompletion(progress, cliMission, true, "2026-05-04T16:49:00.000Z");
  progress = recordReview(progress, "lesson", "lesson-python-functions", "good", "2026-05-05T17:00:00.000Z");
  return generateWeeklyReport(progress, contentPack, "2026-05-07T19:00:00.000Z");
}

describe("progress-store", () => {
  it("creates sync-ready normalized schema and seeds content on migration", async () => {
    const fakeDb = new FakeSQLiteDatabase();

    await migrateProgressDb(fakeDb as unknown as SQLiteDatabase);

    const schemaSql = fakeDb.executedSql.join("\n");
    expect(fakeDb.version).toBe(10);
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS user_profile");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS evidence_items");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS review_items");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS quiz_attempts");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS code_run_attempts");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS weekly_reports");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS completed_project_mission_phases");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS completed_lesson_mini_projects");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS readiness_snapshots");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS sync_metadata");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS tracks");
    expect(schemaSql).toContain("CREATE TABLE IF NOT EXISTS lessons");
    expect(fakeDb.runSql.some((sql) => normalizeSql(sql).startsWith("INSERT INTO role_targets"))).toBe(true);
    expect(fakeDb.runSql.some((sql) => normalizeSql(sql).startsWith("INSERT INTO project_missions"))).toBe(true);
  });

  it("migrates a v1 JSON progress row into normalized rows without losing progress", async () => {
    const fakeDb = new FakeSQLiteDatabase();
    const richProgress = createRichProgress();
    fakeDb.version = 1;
    fakeDb.legacyRow = {
      payload: JSON.stringify(richProgress),
      updatedAt: richProgress.updatedAt
    };

    await migrateProgressDb(fakeDb as unknown as SQLiteDatabase);
    const loadedProgress = await loadProgress(fakeDb as unknown as SQLiteDatabase);

    expect(fakeDb.version).toBe(10);
    expect(fakeDb.completedLessons.map((row) => row.entity_id)).toEqual(["lesson-python-functions"]);
    expect(fakeDb.completedLessonMiniProjects.map((row) => row.entity_id)).toEqual(["lesson-python-functions"]);
    expect(fakeDb.completedQuizzes.map((row) => row.entity_id)).toEqual(["quiz-python-functions"]);
    expect(fakeDb.completedProjectMissions.map((row) => row.entity_id)).toEqual(["mission-cli-study-tracker"]);
    expect(fakeDb.completedProjectMissionDeliverables).toHaveLength(3);
    expect(fakeDb.completedProjectMissionPhases).toHaveLength(3);
    expect(fakeDb.quizAttempts).toHaveLength(0);
    expect(fakeDb.evidenceItems).toHaveLength(1);
    expect(fakeDb.evidenceSkillLinks.map((row) => row.skill_id)).toEqual([
      "skill-python-functions",
      "skill-testing-debugging",
      "skill-portfolio-evidence"
    ]);
    expect(fakeDb.reviewItems).toHaveLength(3);
    expect(fakeDb.reviewEvents).toHaveLength(1);
    expect(fakeDb.weeklyReports).toHaveLength(1);
    expect(fakeDb.weeklyReports[0]?.report.portfolioMarkdown).toContain("CareerForge Portfolio Report");
    expect(loadedProgress).toEqual(ensureProgressProfile(richProgress));
  });

  it("creates initial progress when no row exists", async () => {
    const db = createDb();

    await migrateProgressDb(db);
    const progress = await loadProgress(db);

    expect(progress.completedLessonIds).toEqual([]);
    expect(progress.updatedAt).toBeTruthy();
  });

  it("saves, loads, and resets progress through normalized tables", async () => {
    const db = createDb();
    const initialProgress = createInitialProgress("2026-05-04T16:45:00.000Z");
    const changedProgress = setLessonCompletion(
      initialProgress,
      "lesson-python-functions",
      true,
      "2026-05-04T16:46:00.000Z"
    );
    const changedWithMiniProject = setLessonMiniProjectCompletion(
      changedProgress,
      "lesson-python-functions",
      true,
      "2026-05-04T16:46:30.000Z"
    );

    await migrateProgressDb(db);
    await saveProgress(db, changedWithMiniProject);

    expect((await loadProgress(db)).completedLessonIds).toEqual(["lesson-python-functions"]);
    expect((await loadProgress(db)).completedLessonMiniProjectIds).toEqual(["lesson-python-functions"]);

    const reset = await resetProgress(db);
    expect(reset.completedLessonIds).toEqual([]);
    expect(reset.completedLessonMiniProjectIds).toEqual([]);
    expect((await loadProgress(db)).completedLessonIds).toEqual([]);
  });

  it("saves and loads dashboard_tour_dismissed status", async () => {
    const db = createDb();
    const initialProgress = createInitialProgress("2026-05-04T16:45:00.000Z");
    expect(initialProgress.profile.dashboardTourDismissed).toBe(false);

    const updatedProgress = {
      ...initialProgress,
      profile: {
        ...initialProgress.profile,
        dashboardTourDismissed: true
      }
    };

    await migrateProgressDb(db);
    await saveProgress(db, updatedProgress);

    const loaded = await loadProgress(db);
    expect(loaded.profile.dashboardTourDismissed).toBe(true);
  });
});
