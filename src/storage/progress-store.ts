import type { SQLiteDatabase } from "expo-sqlite";
import { roleTargets } from "@/content/roles";
import { contentPack } from "@/content/seed";
import { createInitialProgress, ensureProgressProfile } from "@/domain/progress";
import { userProgressSchema } from "@/domain/schemas";
import type {
  EvidenceItem,
  EvidenceTestStatus,
  EvidenceType,
  CodeRunAttempt,
  ReadmeStatus,
  QuizAttempt,
  ReviewEvent,
  ReviewItem,
  ReviewRating,
  ReviewTargetType,
  UserProgress,
  WeeklyReportSnapshot
} from "@/domain/types";

const DATABASE_VERSION = 10;
const PROGRESS_ROW_ID = "default";

type TransactionalSQLiteDatabase = SQLiteDatabase & {
  withExclusiveTransactionAsync?: (task: (transactionDb: SQLiteDatabase) => Promise<void>) => Promise<void>;
};

interface ProgressMetadataRow {
  updated_at: string;
}

interface UserProfileRow {
  role_target_id: string;
  onboarding_completed_at: string | null;
  dashboard_tour_dismissed?: number;
  created_at: string;
  updated_at: string;
}

interface IdRow {
  id: string;
}

interface CompletionRow {
  entity_id: string;
}

interface MissionDeliverableRow {
  mission_id: string;
  deliverable_index: number;
}

interface MissionPhaseRow {
  mission_id: string;
  phase_id: string;
}

interface QuizAttemptRow {
  id: string;
  quiz_id: string;
  selected_choice_indexes: string;
  score: number;
  passed: number;
  attempted_at: string;
}

interface CodeRunAttemptRow {
  id: string;
  lesson_id: string;
  language: CodeRunAttempt["language"];
  run_mode: CodeRunAttempt["runMode"] | null;
  command: string | null;
  code_snapshot: string;
  stdout: string;
  stderr: string;
  passed: number;
  score: number;
  runtime_ms: number;
  test_results_json: string;
  hidden_check_summary_json: string | null;
  diagnostics_json: string | null;
  terminal_transcript_json: string | null;
  created_at: string;
}

interface EvidenceRow {
  id: string;
  type: EvidenceType;
  title: string;
  body: string;
  linked_project_mission_id: string | null;
  linked_lesson_id: string | null;
  uri: string | null;
  repo_url: string | null;
  commit_hash: string | null;
  test_status: EvidenceTestStatus;
  artifact_uri: string | null;
  readme_status: ReadmeStatus;
  deployment_url: string | null;
  verifier_output: string | null;
  reflection: string | null;
  proof_artifact_json: string | null;
  trust: NonNullable<EvidenceItem["trust"]> | null;
  created_at: string;
}

interface EvidenceSkillLinkRow {
  evidence_id: string;
  skill_id: string;
}

interface ReviewItemRow {
  target_type: ReviewTargetType;
  target_id: string;
  due_at: string;
  last_reviewed_at: string | null;
  interval_days: number;
  repetitions: number;
  ease_factor: number;
  lapses: number;
}

interface ReviewEventRow {
  id: string;
  target_type: ReviewTargetType;
  target_id: string;
  rating: ReviewRating;
  reviewed_at: string;
  next_due_at: string;
  interval_days: number;
}

interface WeeklyReportRow {
  id: string;
  week_start: string;
  generated_at: string;
  role_target_id: string;
  readiness_score: number;
  lessons_completed: number;
  quizzes_completed: number;
  missions_completed: number;
  evidence_count: number;
  passing_evidence_count: number;
  review_events_count: number;
  summary: string;
  portfolio_summary: string | null;
  portfolio_markdown: string | null;
}

interface WeeklyReportListRow {
  report_id: string;
  value: string;
}

interface TableInfoRow {
  name: string;
}

function optionalString(value: string | null | undefined): string | undefined {
  return value ?? undefined;
}

async function withStorageTransaction(db: SQLiteDatabase, task: (transactionDb: SQLiteDatabase) => Promise<void>): Promise<void> {
  const transactionalDb = db as TransactionalSQLiteDatabase;

  if (typeof transactionalDb.withExclusiveTransactionAsync === "function") {
    await transactionalDb.withExclusiveTransactionAsync(task);
    return;
  }

  await task(db);
}

async function createLegacyProgressTable(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS progress_state (
      id TEXT PRIMARY KEY NOT NULL,
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

async function createNormalizedSchema(db: SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS role_targets (
      id TEXT PRIMARY KEY NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      is_default INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS role_target_tracks (
      role_target_id TEXT NOT NULL,
      track_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (role_target_id, track_id)
    );

    CREATE TABLE IF NOT EXISTS skills (
      id TEXT PRIMARY KEY NOT NULL,
      slug TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS skill_edges (
      from_skill_id TEXT NOT NULL,
      to_skill_id TEXT NOT NULL,
      relation_type TEXT NOT NULL,
      PRIMARY KEY (from_skill_id, to_skill_id, relation_type)
    );

    CREATE TABLE IF NOT EXISTS tracks (
      id TEXT PRIMARY KEY NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      accent_color TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS track_role_targets (
      track_id TEXT NOT NULL,
      role_target_title TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (track_id, role_target_title)
    );

    CREATE TABLE IF NOT EXISTS content_modules (
      id TEXT PRIMARY KEY NOT NULL,
      track_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS module_lessons (
      module_id TEXT NOT NULL,
      lesson_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (module_id, lesson_id)
    );

    CREATE TABLE IF NOT EXISTS module_project_missions (
      module_id TEXT NOT NULL,
      project_mission_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (module_id, project_mission_id)
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id TEXT PRIMARY KEY NOT NULL,
      module_id TEXT NOT NULL,
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      body_markdown TEXT NOT NULL,
      estimated_minutes INTEGER NOT NULL,
      difficulty TEXT NOT NULL,
      quiz_id TEXT NOT NULL,
      desktop_task TEXT NOT NULL,
      evidence_prompt TEXT NOT NULL,
      workshop_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY NOT NULL,
      lesson_id TEXT NOT NULL,
      title TEXT NOT NULL,
      passing_score REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_items (
      id TEXT PRIMARY KEY NOT NULL,
      quiz_id TEXT NOT NULL,
      prompt TEXT NOT NULL,
      choices_json TEXT NOT NULL,
      correct_choice_index INTEGER NOT NULL,
      explanation TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_missions (
      id TEXT PRIMARY KEY NOT NULL,
      track_id TEXT NOT NULL,
      title TEXT NOT NULL,
      brief TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      deliverables_json TEXT NOT NULL,
      acceptance_criteria_json TEXT NOT NULL,
      phases_json TEXT NOT NULL,
      starter_prompt TEXT NOT NULL,
      verification_commands_json TEXT NOT NULL,
      expected_artifacts_json TEXT NOT NULL,
      rubric_json TEXT NOT NULL,
      common_failure_modes_json TEXT NOT NULL,
      portfolio_summary_prompt TEXT NOT NULL,
      evidence_requirements_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS entity_skills (
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (entity_type, entity_id, skill_id)
    );

    CREATE TABLE IF NOT EXISTS weekly_plans (
      id TEXT PRIMARY KEY NOT NULL,
      week_start TEXT NOT NULL,
      headline TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_plan_seed_tasks (
      id TEXT PRIMARY KEY NOT NULL,
      weekly_plan_id TEXT NOT NULL,
      title TEXT NOT NULL,
      detail TEXT NOT NULL,
      linked_lesson_id TEXT,
      linked_project_mission_id TEXT,
      minutes INTEGER NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS progress_metadata (
      id TEXT PRIMARY KEY NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_profile (
      id TEXT PRIMARY KEY NOT NULL,
      role_target_id TEXT NOT NULL,
      onboarding_completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS completed_lessons (
      lesson_id TEXT PRIMARY KEY NOT NULL,
      sort_order INTEGER NOT NULL,
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS completed_lesson_mini_projects (
      lesson_id TEXT PRIMARY KEY NOT NULL,
      sort_order INTEGER NOT NULL,
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS completed_quizzes (
      quiz_id TEXT PRIMARY KEY NOT NULL,
      sort_order INTEGER NOT NULL,
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS completed_project_missions (
      project_mission_id TEXT PRIMARY KEY NOT NULL,
      sort_order INTEGER NOT NULL,
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS completed_project_mission_deliverables (
      project_mission_id TEXT NOT NULL,
      deliverable_index INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      PRIMARY KEY (project_mission_id, deliverable_index)
    );

    CREATE TABLE IF NOT EXISTS completed_project_mission_phases (
      project_mission_id TEXT NOT NULL,
      phase_id TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (project_mission_id, phase_id)
    );

    CREATE TABLE IF NOT EXISTS completed_weekly_plan_tasks (
      task_id TEXT PRIMARY KEY NOT NULL,
      sort_order INTEGER NOT NULL,
      completed_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id TEXT PRIMARY KEY NOT NULL,
      quiz_id TEXT NOT NULL,
      selected_choice_indexes TEXT NOT NULL,
      score REAL NOT NULL,
      passed INTEGER NOT NULL,
      attempted_at TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS code_run_attempts (
      id TEXT PRIMARY KEY NOT NULL,
      lesson_id TEXT NOT NULL,
      language TEXT NOT NULL,
      run_mode TEXT NOT NULL DEFAULT 'run_checks',
      command TEXT NOT NULL DEFAULT '',
      code_snapshot TEXT NOT NULL,
      stdout TEXT NOT NULL,
      stderr TEXT NOT NULL,
      passed INTEGER NOT NULL,
      score REAL NOT NULL,
      runtime_ms INTEGER NOT NULL,
      test_results_json TEXT NOT NULL,
      hidden_check_summary_json TEXT NOT NULL DEFAULT '{"total":0,"passed":0,"failed":0}',
      diagnostics_json TEXT NOT NULL DEFAULT '[]',
      terminal_transcript_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evidence_items (
      id TEXT PRIMARY KEY NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      linked_project_mission_id TEXT,
      linked_lesson_id TEXT,
      uri TEXT,
      repo_url TEXT,
      commit_hash TEXT,
      test_status TEXT NOT NULL,
      artifact_uri TEXT,
      readme_status TEXT NOT NULL,
      deployment_url TEXT,
      verifier_output TEXT,
      reflection TEXT,
      proof_artifact_json TEXT,
      trust TEXT NOT NULL DEFAULT 'manual_note',
      created_at TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS evidence_skill_links (
      evidence_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (evidence_id, skill_id)
    );

    CREATE TABLE IF NOT EXISTS review_items (
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      due_at TEXT NOT NULL,
      last_reviewed_at TEXT,
      interval_days INTEGER NOT NULL,
      repetitions INTEGER NOT NULL,
      ease_factor REAL NOT NULL,
      lapses INTEGER NOT NULL,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (target_type, target_id)
    );

    CREATE TABLE IF NOT EXISTS review_events (
      id TEXT PRIMARY KEY NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      rating TEXT NOT NULL,
      reviewed_at TEXT NOT NULL,
      next_due_at TEXT NOT NULL,
      interval_days INTEGER NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_reports (
      id TEXT PRIMARY KEY NOT NULL,
      week_start TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      role_target_id TEXT NOT NULL,
      readiness_score REAL NOT NULL,
      lessons_completed INTEGER NOT NULL,
      quizzes_completed INTEGER NOT NULL,
      missions_completed INTEGER NOT NULL,
      evidence_count INTEGER NOT NULL,
      passing_evidence_count INTEGER NOT NULL,
      review_events_count INTEGER NOT NULL,
      portfolio_summary TEXT,
      portfolio_markdown TEXT,
      summary TEXT NOT NULL,
      sort_order INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_report_wins (
      report_id TEXT NOT NULL,
      value TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (report_id, sort_order)
    );

    CREATE TABLE IF NOT EXISTS weekly_report_risks (
      report_id TEXT NOT NULL,
      value TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (report_id, sort_order)
    );

    CREATE TABLE IF NOT EXISTS weekly_report_next_actions (
      report_id TEXT NOT NULL,
      value TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (report_id, sort_order)
    );

    CREATE TABLE IF NOT EXISTS weekly_report_portfolio_bullets (
      report_id TEXT NOT NULL,
      value TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (report_id, sort_order)
    );

    CREATE TABLE IF NOT EXISTS weekly_report_project_gaps (
      report_id TEXT NOT NULL,
      value TEXT NOT NULL,
      sort_order INTEGER NOT NULL,
      PRIMARY KEY (report_id, sort_order)
    );

    CREATE TABLE IF NOT EXISTS readiness_snapshots (
      id TEXT PRIMARY KEY NOT NULL,
      role_target_id TEXT NOT NULL,
      score REAL NOT NULL,
      label TEXT NOT NULL,
      breakdown_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_metadata (
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      dirty_since TEXT,
      synced_at TEXT,
      deleted_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'local-only',
      PRIMARY KEY (entity_type, entity_id)
    );
  `);
}

async function ensureUserProfileColumns(db: SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<TableInfoRow>("PRAGMA table_info(user_profile)");
  const existingColumns = new Set(rows.map((row) => row.name));

  if (!existingColumns.has("dashboard_tour_dismissed")) {
    await db.execAsync("ALTER TABLE user_profile ADD COLUMN dashboard_tour_dismissed INTEGER NOT NULL DEFAULT 0;");
  }
}

async function ensureProjectMissionDepthColumns(db: SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<TableInfoRow>("PRAGMA table_info(project_missions)");
  const existingColumns = new Set(rows.map((row) => row.name));
  const columns: Array<{ name: string; definition: string }> = [
    { name: "phases_json", definition: "TEXT NOT NULL DEFAULT '[]'" },
    { name: "starter_prompt", definition: "TEXT NOT NULL DEFAULT ''" },
    { name: "verification_commands_json", definition: "TEXT NOT NULL DEFAULT '[]'" },
    { name: "expected_artifacts_json", definition: "TEXT NOT NULL DEFAULT '[]'" },
    { name: "rubric_json", definition: "TEXT NOT NULL DEFAULT '[]'" },
    { name: "common_failure_modes_json", definition: "TEXT NOT NULL DEFAULT '[]'" },
    { name: "portfolio_summary_prompt", definition: "TEXT NOT NULL DEFAULT ''" },
    { name: "evidence_requirements_json", definition: "TEXT NOT NULL DEFAULT '{}'" }
  ];

  for (const column of columns) {
    if (!existingColumns.has(column.name)) {
      await db.execAsync(`ALTER TABLE project_missions ADD COLUMN ${column.name} ${column.definition};`);
    }
  }
}

async function ensureWeeklyReportPortfolioColumns(db: SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<TableInfoRow>("PRAGMA table_info(weekly_reports)");
  const existingColumns = new Set(rows.map((row) => row.name));

  if (!existingColumns.has("portfolio_summary")) {
    await db.execAsync("ALTER TABLE weekly_reports ADD COLUMN portfolio_summary TEXT;");
  }

  if (!existingColumns.has("portfolio_markdown")) {
    await db.execAsync("ALTER TABLE weekly_reports ADD COLUMN portfolio_markdown TEXT;");
  }
}

async function ensureLessonWorkshopColumns(db: SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<TableInfoRow>("PRAGMA table_info(lessons)");
  const existingColumns = new Set(rows.map((row) => row.name));

  if (!existingColumns.has("workshop_json")) {
    await db.execAsync("ALTER TABLE lessons ADD COLUMN workshop_json TEXT NOT NULL DEFAULT '{}';");
  }
}

async function ensureCodeRunAttemptColumns(db: SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<TableInfoRow>("PRAGMA table_info(code_run_attempts)");
  const existingColumns = new Set(rows.map((row) => row.name));
  const columns: Array<{ name: string; definition: string }> = [
    { name: "run_mode", definition: "TEXT NOT NULL DEFAULT 'run_checks'" },
    { name: "command", definition: "TEXT NOT NULL DEFAULT ''" },
    { name: "hidden_check_summary_json", definition: "TEXT NOT NULL DEFAULT '{\"total\":0,\"passed\":0,\"failed\":0}'" },
    { name: "diagnostics_json", definition: "TEXT NOT NULL DEFAULT '[]'" },
    { name: "terminal_transcript_json", definition: "TEXT NOT NULL DEFAULT '[]'" }
  ];

  for (const column of columns) {
    if (!existingColumns.has(column.name)) {
      await db.execAsync(`ALTER TABLE code_run_attempts ADD COLUMN ${column.name} ${column.definition};`);
    }
  }
}

async function ensureEvidenceProofColumn(db: SQLiteDatabase): Promise<void> {
  const rows = await db.getAllAsync<TableInfoRow>("PRAGMA table_info(evidence_items)");
  const existingColumns = new Set(rows.map((row) => row.name));

  if (!existingColumns.has("proof_artifact_json")) {
    await db.execAsync("ALTER TABLE evidence_items ADD COLUMN proof_artifact_json TEXT;");
  }

  if (!existingColumns.has("trust")) {
    await db.execAsync("ALTER TABLE evidence_items ADD COLUMN trust TEXT NOT NULL DEFAULT 'manual_note';");
  }
}

async function deleteRows(db: SQLiteDatabase, tableNames: string[]): Promise<void> {
  for (const tableName of tableNames) {
    await db.runAsync(`DELETE FROM ${tableName}`);
  }
}

async function seedContentTables(db: SQLiteDatabase): Promise<void> {
  await withStorageTransaction(db, async (transactionDb) => {
    await deleteRows(transactionDb, [
      "weekly_plan_seed_tasks",
      "weekly_plans",
      "entity_skills",
      "project_missions",
      "quiz_items",
      "quizzes",
      "lessons",
      "module_project_missions",
      "module_lessons",
      "content_modules",
      "track_role_targets",
      "tracks",
      "skill_edges",
      "skills",
      "role_target_tracks",
      "role_targets"
    ]);

    for (const roleTarget of roleTargets) {
      await transactionDb.runAsync(
        "INSERT INTO role_targets (id, title, summary, is_default) VALUES (?, ?, ?, ?)",
        roleTarget.id,
        roleTarget.title,
        roleTarget.summary,
        roleTarget.default ? 1 : 0
      );

      for (const [index, trackId] of roleTarget.trackIds.entries()) {
        await transactionDb.runAsync(
          "INSERT INTO role_target_tracks (role_target_id, track_id, sort_order) VALUES (?, ?, ?)",
          roleTarget.id,
          trackId,
          index
        );
      }
    }

    for (const skill of contentPack.skills) {
      await transactionDb.runAsync(
        "INSERT INTO skills (id, slug, name, category) VALUES (?, ?, ?, ?)",
        skill.id,
        skill.slug,
        skill.name,
        skill.category
      );
    }

    for (const edge of contentPack.skillEdges) {
      await transactionDb.runAsync(
        "INSERT INTO skill_edges (from_skill_id, to_skill_id, relation_type) VALUES (?, ?, ?)",
        edge.fromSkillId,
        edge.toSkillId,
        edge.relationType
      );
    }

    for (const track of contentPack.tracks) {
      await transactionDb.runAsync(
        "INSERT INTO tracks (id, slug, title, summary, accent_color) VALUES (?, ?, ?, ?, ?)",
        track.id,
        track.slug,
        track.title,
        track.summary,
        track.accentColor
      );

      for (const [index, roleTargetTitle] of track.roleTargets.entries()) {
        await transactionDb.runAsync(
          "INSERT INTO track_role_targets (track_id, role_target_title, sort_order) VALUES (?, ?, ?)",
          track.id,
          roleTargetTitle,
          index
        );
      }
    }

    for (const module of contentPack.modules) {
      await transactionDb.runAsync(
        "INSERT INTO content_modules (id, track_id, slug, title, summary, sort_order) VALUES (?, ?, ?, ?, ?, ?)",
        module.id,
        module.trackId,
        module.slug,
        module.title,
        module.summary,
        module.sortOrder
      );

      for (const [index, lessonId] of module.lessonIds.entries()) {
        await transactionDb.runAsync(
          "INSERT INTO module_lessons (module_id, lesson_id, sort_order) VALUES (?, ?, ?)",
          module.id,
          lessonId,
          index
        );
      }

      for (const [index, projectMissionId] of module.projectMissionIds.entries()) {
        await transactionDb.runAsync(
          "INSERT INTO module_project_missions (module_id, project_mission_id, sort_order) VALUES (?, ?, ?)",
          module.id,
          projectMissionId,
          index
        );
      }

      await seedEntitySkills(transactionDb, "module", module.id, module.skillIds);
    }

    for (const lesson of contentPack.lessons) {
      await transactionDb.runAsync(
        `INSERT INTO lessons (
          id, module_id, slug, title, summary, body_markdown, estimated_minutes, difficulty, quiz_id, desktop_task, evidence_prompt, workshop_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        lesson.id,
        lesson.moduleId,
        lesson.slug,
        lesson.title,
        lesson.summary,
        lesson.bodyMarkdown,
        lesson.estimatedMinutes,
        lesson.difficulty,
        lesson.quizId,
        lesson.desktopTask,
        lesson.evidencePrompt,
        JSON.stringify(lesson.workshop)
      );
      await seedEntitySkills(transactionDb, "lesson", lesson.id, lesson.skillIds);
    }

    for (const quiz of contentPack.quizzes) {
      await transactionDb.runAsync(
        "INSERT INTO quizzes (id, lesson_id, title, passing_score) VALUES (?, ?, ?, ?)",
        quiz.id,
        quiz.lessonId,
        quiz.title,
        quiz.passingScore
      );

      for (const [index, question] of quiz.questions.entries()) {
        await transactionDb.runAsync(
          `INSERT INTO quiz_items (
            id, quiz_id, prompt, choices_json, correct_choice_index, explanation, sort_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          question.id,
          quiz.id,
          question.prompt,
          JSON.stringify(question.choices),
          question.correctChoiceIndex,
          question.explanation,
          index
        );
      }
    }

    for (const mission of contentPack.projectMissions) {
      await transactionDb.runAsync(
        `INSERT INTO project_missions (
          id, track_id, title, brief, difficulty, deliverables_json, acceptance_criteria_json, phases_json,
          starter_prompt, verification_commands_json, expected_artifacts_json, rubric_json, common_failure_modes_json,
          portfolio_summary_prompt, evidence_requirements_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        mission.id,
        mission.trackId,
        mission.title,
        mission.brief,
        mission.difficulty,
        JSON.stringify(mission.deliverables),
        JSON.stringify(mission.acceptanceCriteria),
        JSON.stringify(mission.phases),
        mission.starterPrompt,
        JSON.stringify(mission.verificationCommands),
        JSON.stringify(mission.expectedArtifacts),
        JSON.stringify(mission.rubric),
        JSON.stringify(mission.commonFailureModes),
        mission.portfolioSummaryPrompt,
        JSON.stringify(mission.evidenceRequirements)
      );
      await seedEntitySkills(transactionDb, "mission", mission.id, mission.skillIds);
    }

    await transactionDb.runAsync(
      "INSERT INTO weekly_plans (id, week_start, headline) VALUES (?, ?, ?)",
      contentPack.weeklyPlan.id,
      contentPack.weeklyPlan.weekStart,
      contentPack.weeklyPlan.headline
    );

    for (const [index, task] of contentPack.weeklyPlan.tasks.entries()) {
      await transactionDb.runAsync(
        `INSERT INTO weekly_plan_seed_tasks (
          id, weekly_plan_id, title, detail, linked_lesson_id, linked_project_mission_id, minutes, sort_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        task.id,
        contentPack.weeklyPlan.id,
        task.title,
        task.detail,
        task.linkedLessonId ?? null,
        task.linkedProjectMissionId ?? null,
        task.minutes,
        index
      );
    }
  });
}

async function seedEntitySkills(db: SQLiteDatabase, entityType: string, entityId: string, skillIds: string[]): Promise<void> {
  for (const [index, skillId] of skillIds.entries()) {
    await db.runAsync(
      "INSERT INTO entity_skills (entity_type, entity_id, skill_id, sort_order) VALUES (?, ?, ?, ?)",
      entityType,
      entityId,
      skillId,
      index
    );
  }
}

async function loadLegacyProgress(db: SQLiteDatabase): Promise<UserProgress | null> {
  const row = await db.getFirstAsync<{ payload: string }>(
    "SELECT payload FROM progress_state WHERE id = ?",
    PROGRESS_ROW_ID
  );

  if (!row) {
    return null;
  }

  return ensureProgressProfile(userProgressSchema.parse(JSON.parse(row.payload)));
}

async function saveLegacyProgressBackup(db: SQLiteDatabase, progress: UserProgress): Promise<void> {
  await db.runAsync(
    `INSERT INTO progress_state (id, payload, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    PROGRESS_ROW_ID,
    JSON.stringify(progress),
    progress.updatedAt
  );
}

async function hasNormalizedProgress(db: SQLiteDatabase): Promise<boolean> {
  const row = await db.getFirstAsync<IdRow>(
    "SELECT id FROM user_profile WHERE id = ?",
    PROGRESS_ROW_ID
  );
  return Boolean(row);
}

async function deleteUserProgressRows(db: SQLiteDatabase): Promise<void> {
  await deleteRows(db, [
    "weekly_report_next_actions",
    "weekly_report_project_gaps",
    "weekly_report_portfolio_bullets",
    "weekly_report_risks",
    "weekly_report_wins",
    "weekly_reports",
    "review_events",
    "review_items",
    "evidence_skill_links",
    "evidence_items",
    "code_run_attempts",
    "quiz_attempts",
    "completed_weekly_plan_tasks",
    "completed_project_mission_deliverables",
    "completed_project_mission_phases",
    "completed_project_missions",
    "completed_quizzes",
    "completed_lesson_mini_projects",
    "completed_lessons",
    "readiness_snapshots",
    "sync_metadata",
    "user_profile",
    "progress_metadata"
  ]);
}

async function saveCompletionIds(db: SQLiteDatabase, tableName: string, idColumn: string, ids: string[], updatedAt: string): Promise<void> {
  for (const [index, id] of ids.entries()) {
    await db.runAsync(
      `INSERT INTO ${tableName} (${idColumn}, sort_order, completed_at) VALUES (?, ?, ?)`,
      id,
      index,
      updatedAt
    );
  }
}

function parseMissionDeliverableId(value: string): { missionId: string; deliverableIndex: number } | null {
  const separatorIndex = value.lastIndexOf(":");
  if (separatorIndex <= 0) {
    return null;
  }

  const missionId = value.slice(0, separatorIndex);
  const deliverableIndex = Number(value.slice(separatorIndex + 1));
  return Number.isInteger(deliverableIndex) && deliverableIndex >= 0 ? { missionId, deliverableIndex } : null;
}

async function saveMissionDeliverables(db: SQLiteDatabase, ids: string[], updatedAt: string): Promise<void> {
  for (const id of ids) {
    const parsed = parseMissionDeliverableId(id);
    if (!parsed) {
      continue;
    }

    await db.runAsync(
      "INSERT INTO completed_project_mission_deliverables (project_mission_id, deliverable_index, completed_at) VALUES (?, ?, ?)",
      parsed.missionId,
      parsed.deliverableIndex,
      updatedAt
    );
  }
}

function parseMissionPhaseId(value: string): { missionId: string; phaseId: string } | null {
  const separatorIndex = value.indexOf(":");
  if (separatorIndex <= 0 || separatorIndex === value.length - 1) {
    return null;
  }

  return {
    missionId: value.slice(0, separatorIndex),
    phaseId: value.slice(separatorIndex + 1)
  };
}

async function saveMissionPhases(db: SQLiteDatabase, ids: string[], updatedAt: string): Promise<void> {
  for (const id of ids) {
    const parsed = parseMissionPhaseId(id);
    if (!parsed) {
      continue;
    }

    await db.runAsync(
      "INSERT INTO completed_project_mission_phases (project_mission_id, phase_id, completed_at, sort_order) VALUES (?, ?, ?, ?)",
      parsed.missionId,
      parsed.phaseId,
      updatedAt,
      ids.indexOf(id)
    );
  }
}

async function saveQuizAttempts(db: SQLiteDatabase, quizAttempts: QuizAttempt[]): Promise<void> {
  for (const [index, attempt] of quizAttempts.entries()) {
    await db.runAsync(
      `INSERT INTO quiz_attempts (
        id, quiz_id, selected_choice_indexes, score, passed, attempted_at, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      attempt.id,
      attempt.quizId,
      JSON.stringify(attempt.selectedChoiceIndexes),
      attempt.score,
      attempt.passed ? 1 : 0,
      attempt.attemptedAt,
      index
    );
  }
}

async function saveCodeRunAttempts(db: SQLiteDatabase, codeRunAttempts: CodeRunAttempt[]): Promise<void> {
  for (const [index, attempt] of codeRunAttempts.entries()) {
    await db.runAsync(
      `INSERT INTO code_run_attempts (
        id, lesson_id, language, run_mode, command, code_snapshot, stdout, stderr, passed, score, runtime_ms,
        test_results_json, hidden_check_summary_json, diagnostics_json, terminal_transcript_json, created_at, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      attempt.id,
      attempt.lessonId,
      attempt.language,
      attempt.runMode,
      attempt.command,
      attempt.codeSnapshot,
      attempt.stdout,
      attempt.stderr,
      attempt.passed ? 1 : 0,
      attempt.score,
      attempt.runtimeMs,
      JSON.stringify(attempt.testResults),
      JSON.stringify(attempt.hiddenCheckSummary),
      JSON.stringify(attempt.diagnostics),
      JSON.stringify(attempt.terminalTranscript),
      attempt.createdAt,
      index
    );
  }
}

async function saveEvidenceItems(db: SQLiteDatabase, evidenceItems: EvidenceItem[]): Promise<void> {
  for (const [index, item] of evidenceItems.entries()) {
    await db.runAsync(
      `INSERT INTO evidence_items (
        id, type, title, body, linked_project_mission_id, linked_lesson_id, uri, repo_url, commit_hash,
        test_status, artifact_uri, readme_status, deployment_url, verifier_output, reflection, proof_artifact_json, trust, created_at, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item.id,
      item.type,
      item.title,
      item.body,
      item.linkedProjectMissionId ?? null,
      item.linkedLessonId ?? null,
      item.uri ?? null,
      item.repoUrl ?? null,
      item.commitHash ?? null,
      item.testStatus,
      item.artifactUri ?? null,
      item.readmeStatus,
      item.deploymentUrl ?? null,
      item.verifierOutput ?? null,
      item.reflection ?? null,
      item.proofArtifact ? JSON.stringify(item.proofArtifact) : null,
      item.trust ?? (item.proofArtifact ? "auto_verified_code_lab" : item.verifierOutput ? "manual_verifier_output" : "manual_note"),
      item.createdAt,
      index
    );

    for (const [skillIndex, skillId] of item.linkedSkillIds.entries()) {
      await db.runAsync(
        "INSERT INTO evidence_skill_links (evidence_id, skill_id, sort_order) VALUES (?, ?, ?)",
        item.id,
        skillId,
        skillIndex
      );
    }
  }
}

async function saveReviewItems(db: SQLiteDatabase, reviewItems: ReviewItem[]): Promise<void> {
  for (const [index, item] of reviewItems.entries()) {
    await db.runAsync(
      `INSERT INTO review_items (
        target_type, target_id, due_at, last_reviewed_at, interval_days, repetitions, ease_factor, lapses, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      item.targetType,
      item.targetId,
      item.dueAt,
      item.lastReviewedAt ?? null,
      item.intervalDays,
      item.repetitions,
      item.easeFactor,
      item.lapses,
      index
    );
  }
}

async function saveReviewEvents(db: SQLiteDatabase, reviewEvents: ReviewEvent[]): Promise<void> {
  for (const [index, event] of reviewEvents.entries()) {
    await db.runAsync(
      `INSERT INTO review_events (
        id, target_type, target_id, rating, reviewed_at, next_due_at, interval_days, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      event.id,
      event.targetType,
      event.targetId,
      event.rating,
      event.reviewedAt,
      event.nextDueAt,
      event.intervalDays,
      index
    );
  }
}

async function saveWeeklyReports(db: SQLiteDatabase, weeklyReports: WeeklyReportSnapshot[]): Promise<void> {
  for (const [index, report] of weeklyReports.entries()) {
    await db.runAsync(
      `INSERT INTO weekly_reports (
        id, week_start, generated_at, role_target_id, readiness_score, lessons_completed, quizzes_completed,
        missions_completed, evidence_count, passing_evidence_count, review_events_count, portfolio_summary, portfolio_markdown, summary, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      report.id,
      report.weekStart,
      report.generatedAt,
      report.roleTargetId,
      report.readinessScore,
      report.lessonsCompleted,
      report.quizzesCompleted,
      report.missionsCompleted,
      report.evidenceCount,
      report.passingEvidenceCount,
      report.reviewEventsCount,
      report.portfolioSummary ?? null,
      report.portfolioMarkdown ?? null,
      report.summary,
      index
    );

    await saveWeeklyReportList(db, "weekly_report_wins", report.id, report.wins);
    await saveWeeklyReportList(db, "weekly_report_risks", report.id, report.risks);
    await saveWeeklyReportList(db, "weekly_report_next_actions", report.id, report.nextActions);
    await saveWeeklyReportList(db, "weekly_report_portfolio_bullets", report.id, report.portfolioBullets ?? []);
    await saveWeeklyReportList(db, "weekly_report_project_gaps", report.id, report.projectGaps ?? []);
  }
}

async function saveWeeklyReportList(db: SQLiteDatabase, tableName: string, reportId: string, values: string[]): Promise<void> {
  for (const [index, value] of values.entries()) {
    await db.runAsync(
      `INSERT INTO ${tableName} (report_id, value, sort_order) VALUES (?, ?, ?)`,
      reportId,
      value,
      index
    );
  }
}

async function saveNormalizedProgress(db: SQLiteDatabase, progress: UserProgress): Promise<UserProgress> {
  const parsedProgress = ensureProgressProfile(userProgressSchema.parse(progress));

  await withStorageTransaction(db, async (transactionDb) => {
    await deleteUserProgressRows(transactionDb);

    await transactionDb.runAsync(
      "INSERT INTO progress_metadata (id, updated_at) VALUES (?, ?)",
      PROGRESS_ROW_ID,
      parsedProgress.updatedAt
    );
    await transactionDb.runAsync(
      `INSERT INTO user_profile (
        id, role_target_id, onboarding_completed_at, created_at, updated_at, dashboard_tour_dismissed
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      PROGRESS_ROW_ID,
      parsedProgress.profile.roleTargetId,
      parsedProgress.profile.onboardingCompletedAt ?? null,
      parsedProgress.profile.createdAt,
      parsedProgress.profile.updatedAt,
      parsedProgress.profile.dashboardTourDismissed ? 1 : 0
    );
    await saveCompletionIds(transactionDb, "completed_lessons", "lesson_id", parsedProgress.completedLessonIds, parsedProgress.updatedAt);
    await saveCompletionIds(transactionDb, "completed_lesson_mini_projects", "lesson_id", parsedProgress.completedLessonMiniProjectIds, parsedProgress.updatedAt);
    await saveCompletionIds(transactionDb, "completed_quizzes", "quiz_id", parsedProgress.completedQuizIds, parsedProgress.updatedAt);
    await saveCompletionIds(
      transactionDb,
      "completed_project_missions",
      "project_mission_id",
      parsedProgress.completedProjectMissionIds,
      parsedProgress.updatedAt
    );
    await saveMissionDeliverables(transactionDb, parsedProgress.completedProjectMissionDeliverableIds, parsedProgress.updatedAt);
    await saveMissionPhases(transactionDb, parsedProgress.completedProjectMissionPhaseIds, parsedProgress.updatedAt);
    await saveCompletionIds(transactionDb, "completed_weekly_plan_tasks", "task_id", parsedProgress.weeklyPlanTaskIds, parsedProgress.updatedAt);
    await saveQuizAttempts(transactionDb, parsedProgress.quizAttempts);
    await saveCodeRunAttempts(transactionDb, parsedProgress.codeRunAttempts);
    await saveEvidenceItems(transactionDb, parsedProgress.evidenceItems);
    await saveReviewItems(transactionDb, parsedProgress.reviewItems);
    await saveReviewEvents(transactionDb, parsedProgress.reviewEvents);
    await saveWeeklyReports(transactionDb, parsedProgress.weeklyReports);
    await saveLegacyProgressBackup(transactionDb, parsedProgress);
  });

  return parsedProgress;
}

function groupValuesByReport(rows: WeeklyReportListRow[]): Map<string, string[]> {
  const groupedValues = new Map<string, string[]>();

  for (const row of rows) {
    const values = groupedValues.get(row.report_id) ?? [];
    values.push(row.value);
    groupedValues.set(row.report_id, values);
  }

  return groupedValues;
}

async function loadNormalizedProgress(db: SQLiteDatabase): Promise<UserProgress | null> {
  const metadata = await db.getFirstAsync<ProgressMetadataRow>(
    "SELECT updated_at FROM progress_metadata WHERE id = ?",
    PROGRESS_ROW_ID
  );
  const profile = await db.getFirstAsync<UserProfileRow>(
      `SELECT role_target_id, onboarding_completed_at, created_at, updated_at, dashboard_tour_dismissed
     FROM user_profile WHERE id = ?`,
    PROGRESS_ROW_ID
  );

  if (!metadata || !profile) {
    return null;
  }

  const completedLessonRows = await db.getAllAsync<CompletionRow>(
    "SELECT lesson_id AS entity_id FROM completed_lessons ORDER BY sort_order ASC"
  );
  const completedQuizRows = await db.getAllAsync<CompletionRow>(
    "SELECT quiz_id AS entity_id FROM completed_quizzes ORDER BY sort_order ASC"
  );
  const completedLessonMiniProjectRows = await db.getAllAsync<CompletionRow>(
    "SELECT lesson_id AS entity_id FROM completed_lesson_mini_projects ORDER BY sort_order ASC"
  );
  const completedMissionRows = await db.getAllAsync<CompletionRow>(
    "SELECT project_mission_id AS entity_id FROM completed_project_missions ORDER BY sort_order ASC"
  );
  const completedMissionDeliverableRows = await db.getAllAsync<MissionDeliverableRow>(
    "SELECT project_mission_id, deliverable_index FROM completed_project_mission_deliverables ORDER BY project_mission_id ASC, deliverable_index ASC"
  );
  const completedMissionPhaseRows = await db.getAllAsync<MissionPhaseRow>(
    "SELECT project_mission_id, phase_id FROM completed_project_mission_phases ORDER BY sort_order ASC"
  );
  const completedWeeklyTaskRows = await db.getAllAsync<CompletionRow>(
    "SELECT task_id AS entity_id FROM completed_weekly_plan_tasks ORDER BY sort_order ASC"
  );
  const quizAttemptRows = await db.getAllAsync<QuizAttemptRow>(
    `SELECT id, quiz_id, selected_choice_indexes, score, passed, attempted_at
     FROM quiz_attempts ORDER BY sort_order ASC`
  );
  const codeRunAttemptRows = await db.getAllAsync<CodeRunAttemptRow>(
    `SELECT id, lesson_id, language, run_mode, command, code_snapshot, stdout, stderr, passed, score, runtime_ms,
      test_results_json, hidden_check_summary_json, diagnostics_json, terminal_transcript_json, created_at
     FROM code_run_attempts ORDER BY sort_order ASC`
  );
  const evidenceRows = await db.getAllAsync<EvidenceRow>(
    `SELECT id, type, title, body, linked_project_mission_id, linked_lesson_id, uri, repo_url, commit_hash,
      test_status, artifact_uri, readme_status, deployment_url, verifier_output, reflection, proof_artifact_json, trust, created_at
     FROM evidence_items ORDER BY sort_order ASC`
  );
  const evidenceSkillRows = await db.getAllAsync<EvidenceSkillLinkRow>(
    "SELECT evidence_id, skill_id FROM evidence_skill_links ORDER BY evidence_id ASC, sort_order ASC"
  );
  const reviewItemRows = await db.getAllAsync<ReviewItemRow>(
    `SELECT target_type, target_id, due_at, last_reviewed_at, interval_days, repetitions, ease_factor, lapses
     FROM review_items ORDER BY sort_order ASC`
  );
  const reviewEventRows = await db.getAllAsync<ReviewEventRow>(
    `SELECT id, target_type, target_id, rating, reviewed_at, next_due_at, interval_days
     FROM review_events ORDER BY sort_order ASC`
  );
  const weeklyReportRows = await db.getAllAsync<WeeklyReportRow>(
    `SELECT id, week_start, generated_at, role_target_id, readiness_score, lessons_completed, quizzes_completed,
      missions_completed, evidence_count, passing_evidence_count, review_events_count, portfolio_summary, portfolio_markdown, summary
     FROM weekly_reports ORDER BY sort_order ASC`
  );
  const winRows = groupValuesByReport(await db.getAllAsync<WeeklyReportListRow>(
    "SELECT report_id, value FROM weekly_report_wins ORDER BY report_id ASC, sort_order ASC"
  ));
  const riskRows = groupValuesByReport(await db.getAllAsync<WeeklyReportListRow>(
    "SELECT report_id, value FROM weekly_report_risks ORDER BY report_id ASC, sort_order ASC"
  ));
  const nextActionRows = groupValuesByReport(await db.getAllAsync<WeeklyReportListRow>(
    "SELECT report_id, value FROM weekly_report_next_actions ORDER BY report_id ASC, sort_order ASC"
  ));
  const portfolioBulletRows = groupValuesByReport(await db.getAllAsync<WeeklyReportListRow>(
    "SELECT report_id, value FROM weekly_report_portfolio_bullets ORDER BY report_id ASC, sort_order ASC"
  ));
  const projectGapRows = groupValuesByReport(await db.getAllAsync<WeeklyReportListRow>(
    "SELECT report_id, value FROM weekly_report_project_gaps ORDER BY report_id ASC, sort_order ASC"
  ));

  const skillsByEvidenceId = new Map<string, string[]>();
  for (const row of evidenceSkillRows) {
    const skillIds = skillsByEvidenceId.get(row.evidence_id) ?? [];
    skillIds.push(row.skill_id);
    skillsByEvidenceId.set(row.evidence_id, skillIds);
  }

  return ensureProgressProfile(userProgressSchema.parse({
    profile: {
      roleTargetId: profile.role_target_id,
      onboardingCompletedAt: optionalString(profile.onboarding_completed_at),
      dashboardTourDismissed: Boolean(profile.dashboard_tour_dismissed),
      createdAt: profile.created_at,
      updatedAt: profile.updated_at
    },
    completedLessonIds: completedLessonRows.map((row) => row.entity_id),
    completedLessonMiniProjectIds: completedLessonMiniProjectRows.map((row) => row.entity_id),
    completedQuizIds: completedQuizRows.map((row) => row.entity_id),
    completedProjectMissionIds: completedMissionRows.map((row) => row.entity_id),
    completedProjectMissionDeliverableIds: completedMissionDeliverableRows.map((row) => `${row.mission_id}:${row.deliverable_index}`),
    completedProjectMissionPhaseIds: completedMissionPhaseRows.map((row) => `${row.mission_id}:${row.phase_id}`),
    evidenceItems: evidenceRows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      linkedProjectMissionId: optionalString(row.linked_project_mission_id),
      linkedLessonId: optionalString(row.linked_lesson_id),
      linkedSkillIds: skillsByEvidenceId.get(row.id) ?? [],
      uri: optionalString(row.uri),
      repoUrl: optionalString(row.repo_url),
      commitHash: optionalString(row.commit_hash),
      testStatus: row.test_status,
      artifactUri: optionalString(row.artifact_uri),
      readmeStatus: row.readme_status,
      deploymentUrl: optionalString(row.deployment_url),
      verifierOutput: optionalString(row.verifier_output),
      reflection: optionalString(row.reflection),
      proofArtifact: row.proof_artifact_json ? JSON.parse(row.proof_artifact_json) as EvidenceItem["proofArtifact"] : undefined,
      trust: row.trust ?? (row.proof_artifact_json ? "auto_verified_code_lab" : row.verifier_output ? "manual_verifier_output" : "manual_note"),
      createdAt: row.created_at
    })),
    quizAttempts: quizAttemptRows.map((row) => ({
      id: row.id,
      quizId: row.quiz_id,
      selectedChoiceIndexes: JSON.parse(row.selected_choice_indexes) as number[],
      score: row.score,
      passed: Boolean(row.passed),
      attemptedAt: row.attempted_at
    })),
    codeRunAttempts: codeRunAttemptRows.map((row) => ({
      id: row.id,
      lessonId: row.lesson_id,
      language: row.language,
      runMode: row.run_mode ?? "run_checks",
      command: row.command ?? "",
      codeSnapshot: row.code_snapshot,
      stdout: row.stdout,
      stderr: row.stderr,
      passed: Boolean(row.passed),
      score: row.score,
      runtimeMs: row.runtime_ms,
      testResults: JSON.parse(row.test_results_json) as CodeRunAttempt["testResults"],
      hiddenCheckSummary: row.hidden_check_summary_json ? JSON.parse(row.hidden_check_summary_json) as CodeRunAttempt["hiddenCheckSummary"] : { total: 0, passed: 0, failed: 0 },
      diagnostics: row.diagnostics_json ? JSON.parse(row.diagnostics_json) as CodeRunAttempt["diagnostics"] : [],
      terminalTranscript: row.terminal_transcript_json ? JSON.parse(row.terminal_transcript_json) as CodeRunAttempt["terminalTranscript"] : [],
      createdAt: row.created_at
    })),
    weeklyPlanTaskIds: completedWeeklyTaskRows.map((row) => row.entity_id),
    reviewItems: reviewItemRows.map((row) => ({
      targetType: row.target_type,
      targetId: row.target_id,
      dueAt: row.due_at,
      ...(row.last_reviewed_at ? { lastReviewedAt: row.last_reviewed_at } : {}),
      intervalDays: row.interval_days,
      repetitions: row.repetitions,
      easeFactor: row.ease_factor,
      lapses: row.lapses
    })),
    reviewEvents: reviewEventRows.map((row) => ({
      id: row.id,
      targetType: row.target_type,
      targetId: row.target_id,
      rating: row.rating,
      reviewedAt: row.reviewed_at,
      nextDueAt: row.next_due_at,
      intervalDays: row.interval_days
    })),
    weeklyReports: weeklyReportRows.map((row) => ({
      id: row.id,
      weekStart: row.week_start,
      generatedAt: row.generated_at,
      roleTargetId: row.role_target_id,
      readinessScore: row.readiness_score,
      lessonsCompleted: row.lessons_completed,
      quizzesCompleted: row.quizzes_completed,
      missionsCompleted: row.missions_completed,
      evidenceCount: row.evidence_count,
      passingEvidenceCount: row.passing_evidence_count,
      reviewEventsCount: row.review_events_count,
      summary: row.summary,
      wins: winRows.get(row.id) ?? [],
      risks: riskRows.get(row.id) ?? [],
      nextActions: nextActionRows.get(row.id) ?? [],
      portfolioSummary: optionalString(row.portfolio_summary),
      portfolioBullets: portfolioBulletRows.get(row.id) ?? [],
      projectGaps: projectGapRows.get(row.id) ?? [],
      portfolioMarkdown: optionalString(row.portfolio_markdown)
    })),
    updatedAt: metadata.updated_at
  }));
}

export async function migrateProgressDb(db: SQLiteDatabase): Promise<void> {
  const versionRow = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const currentVersion = versionRow?.user_version ?? 0;

  await createLegacyProgressTable(db);
  await createNormalizedSchema(db);
  await ensureProjectMissionDepthColumns(db);
  await ensureWeeklyReportPortfolioColumns(db);
  await ensureUserProfileColumns(db);
  await ensureLessonWorkshopColumns(db);
  await ensureCodeRunAttemptColumns(db);
  await ensureEvidenceProofColumn(db);
  await seedContentTables(db);

  if (currentVersion < DATABASE_VERSION) {
    const normalizedProgressExists = await hasNormalizedProgress(db);

    if (!normalizedProgressExists) {
      const legacyProgress = await loadLegacyProgress(db);
      await saveNormalizedProgress(db, legacyProgress ?? createInitialProgress());
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  }
}

export async function loadProgress(db: SQLiteDatabase): Promise<UserProgress> {
  const normalizedProgress = await loadNormalizedProgress(db);

  if (normalizedProgress) {
    return normalizedProgress;
  }

  const legacyProgress = await loadLegacyProgress(db);
  if (legacyProgress) {
    return saveNormalizedProgress(db, legacyProgress);
  }

  const initialProgress = createInitialProgress();
  await saveNormalizedProgress(db, initialProgress);
  return initialProgress;
}

export async function saveProgress(db: SQLiteDatabase, progress: UserProgress): Promise<void> {
  await saveNormalizedProgress(db, progress);
}

export async function resetProgress(db: SQLiteDatabase): Promise<UserProgress> {
  return saveNormalizedProgress(db, createInitialProgress());
}
