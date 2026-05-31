import type { CodeRunAttempt, LessonRunnerSpec } from "@/domain/types";

export interface CodeLabProps {
  attemptHistory?: CodeRunAttempt[];
  isSaving: boolean;
  latestRun?: CodeRunAttempt;
  lessonId: string;
  onRunPassed: (attempt: CodeRunAttempt) => void;
  runnerSpec: LessonRunnerSpec;
}
