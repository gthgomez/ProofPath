import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { CURRENT_SANDBOX_DISCLOSURE_VERSION } from "@/domain/code-run";
import {
  createProgressBackup,
  MAX_PROGRESS_BACKUP_CHARS,
  parseProgressBackup,
  PROGRESS_BACKUP_FORMAT,
  PROGRESS_BACKUP_VERSION,
  restoreProgressBackup,
  serializeProgressBackup
} from "@/domain/progress-backup";
import {
  addEvidenceItem,
  createInitialProgress,
  recordCodeRunAttempt,
  setRoleTarget
} from "@/domain/progress";
import type { CodeRunAttempt } from "@/domain/types";

const NOW = "2026-11-07T12:00:00.000Z";
const SENTINEL = "HIDDEN_ONLY_SENTINEL_2026";

function passingAttempt(overrides: Partial<CodeRunAttempt> = {}): CodeRunAttempt {
  return {
    id: "attempt-backup-1",
    lessonId: "lesson-python-values",
    language: "python",
    runMode: "run_checks",
    command: "proofpath checks study_session.py",
    codeSnapshot: "print('ok')",
    stdout: "ok",
    stderr: "",
    passed: true,
    score: 100,
    runtimeMs: 5,
    testResults: [{ id: "visible", name: "Prints ok", passed: true, visible: true, message: "Passed" }],
    hiddenCheckSummary: { total: 0, passed: 0, failed: 0 },
    diagnostics: [],
    terminalTranscript: [
      { type: "stdout", text: "ok" },
      { type: "result", status: "passed", reason: "success", runtimeMs: 5, exitCode: 0 }
    ],
    sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION,
    createdAt: NOW,
    ...overrides
  };
}

function sampleProgress() {
  let progress = setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
  progress = recordCodeRunAttempt(progress, passingAttempt(), NOW);
  progress = addEvidenceItem(progress, {
    type: "reflection",
    title: "Learning note",
    body: "What changed and why.",
    linkedLessonId: "lesson-python-values",
    testStatus: "unknown"
  }, NOW);
  progress = {
    ...progress,
    placedOutLessonIds: ["lesson-python-zero-files-folders"],
    completedLessonIds: [],
    weeklyPlanTaskIds: ["week-1"]
  };
  return progress;
}

const DRAFTS = {
  "lesson-python-values": { status: "draft" as const, code: "print('unfinished')" },
  "lesson-python-loops": { status: "reset" as const }
};

describe("versioned progress backup and restore", () => {
  it("round-trips progress, durable achievements, evidence, and draft reset state", () => {
    const progress = sampleProgress();
    const before = JSON.stringify(progress);

    const backup = createProgressBackup(progress, DRAFTS, NOW);
    expect(backup.format).toBe(PROGRESS_BACKUP_FORMAT);
    expect(backup.version).toBe(PROGRESS_BACKUP_VERSION);
    expect(backup.drafts).toEqual(DRAFTS);

    const serialized = serializeProgressBackup(backup);
    const parsed = parseProgressBackup(serialized, NOW);
    expect(parsed.error).toBeUndefined();
    expect(parsed.backup?.drafts).toEqual(DRAFTS);

    const restored = restoreProgressBackup(contentPack, parsed.backup!, NOW);
    expect(restored.profile.roleTargetId).toBe("path-software-foundations");
    expect(restored.durableLessonMiniProjectIds).toContain("lesson-python-values");
    expect(restored.codeRunAttempts[0]?.id).toBe("attempt-backup-1");
    expect(restored.evidenceItems.some((item) => item.title === "Learning note")).toBe(true);
    expect(restored.placedOutLessonIds).toContain("lesson-python-zero-files-folders");
    // Restore must not mutate the input backup.
    expect(JSON.stringify(progress)).toBe(before);
  });

  it("rejects malformed, wrong-format, unsupported, oversized, and invalid backups", () => {
    expect(parseProgressBackup("{not json").error).toMatch(/not valid JSON/i);
    expect(parseProgressBackup(JSON.stringify({ format: "other", version: 1, createdAt: NOW })).error).toMatch(/format/i);
    expect(parseProgressBackup("x".repeat(MAX_PROGRESS_BACKUP_CHARS + 1)).error).toMatch(/too large/i);

    const backup = createProgressBackup(sampleProgress(), {}, NOW);
    const newer = { ...backup, version: PROGRESS_BACKUP_VERSION + 1 };
    expect(parseProgressBackup(JSON.stringify(newer)).error).toMatch(/newer ProofPath version/i);

    const invalidProgress = {
      format: PROGRESS_BACKUP_FORMAT,
      version: 1,
      createdAt: NOW,
      progress: {},
      drafts: {}
    };
    expect(parseProgressBackup(JSON.stringify(invalidProgress)).error).toMatch(/does not match/i);
  });

  it("quarantines legacy hidden output inside a backup", () => {
    const legacy: CodeRunAttempt = passingAttempt({
      id: "legacy-attempt",
      sandboxDisclosureVersion: undefined,
      stdout: SENTINEL,
      stderr: SENTINEL,
      testResults: [
        { id: "visible", name: "Visible", passed: true, visible: true, message: SENTINEL },
        { id: "hidden", name: SENTINEL, passed: false, visible: false, message: SENTINEL }
      ],
      terminalTranscript: [{ type: "stdout", text: SENTINEL }]
    });
    let progress = setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
    progress = recordCodeRunAttempt(progress, legacy, NOW);

    const serialized = serializeProgressBackup(createProgressBackup(progress, DRAFTS, NOW));
    expect(serialized).not.toContain(SENTINEL);
    expect(serialized).toContain("Legacy sandbox output withheld");

    const parsed = parseProgressBackup(serialized, NOW);
    expect(parsed.error).toBeUndefined();
    const restored = restoreProgressBackup(contentPack, parsed.backup!, NOW);
    expect(JSON.stringify(restored)).not.toContain(SENTINEL);
  });

  it("preserves review assistance across a backup round-trip", () => {
    let progress = setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
    progress = {
      ...progress,
      completedLessonIds: ["lesson-python-values"],
      reviewItems: [{
        targetType: "lesson",
        targetId: "lesson-python-values",
        dueAt: NOW,
        intervalDays: 1,
        repetitions: 1,
        easeFactor: 2.5,
        lapses: 0
      }],
      reviewEvents: [{
        id: "review-assisted-1",
        targetType: "lesson",
        targetId: "lesson-python-values",
        rating: "good",
        reviewedAt: NOW,
        nextDueAt: NOW,
        intervalDays: 1,
        assisted: true
      }]
    };

    const parsed = parseProgressBackup(serializeProgressBackup(createProgressBackup(progress, {}, NOW)), NOW);
    expect(parsed.backup?.progress.reviewEvents[0]?.assisted).toBe(true);
  });
});
