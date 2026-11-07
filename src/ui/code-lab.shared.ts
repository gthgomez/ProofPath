import type { CodeRunAttempt, LessonRunnerSpec } from "@/domain/types";

export interface CodeLabHandoff {
  code: string;
  /** Changes once per handoff so the same code is not re-applied on re-render. */
  token: number;
}

export interface CodeLabProps {
  attemptHistory?: CodeRunAttempt[];
  /** True when this lesson has a durable passing achievement (may predate history compaction). */
  historicalAchievement?: boolean;
  /**
   * Code moved from the Experiment step. Loading it into the editor does not
   * run checks or grant an achievement; it only saves the learner a retype.
   */
  handoff?: CodeLabHandoff | null;
  isSaving: boolean;
  latestRun?: CodeRunAttempt;
  lessonId: string;
  onRunPassed: (attempt: CodeRunAttempt) => void;
  runnerSpec: LessonRunnerSpec;
}
