import type { CodeRunAttempt, LessonRunnerSpec } from "@/domain/types";

export interface CodeLabProps {
  attemptHistory?: CodeRunAttempt[];
  /** True when this lesson has a durable passing achievement (may predate history compaction). */
  historicalAchievement?: boolean;
  isSaving: boolean;
  latestRun?: CodeRunAttempt;
  lessonId: string;
  onRunPassed: (attempt: CodeRunAttempt) => void;
  runnerSpec: LessonRunnerSpec;
}
