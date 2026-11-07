import { describe, expect, it } from "vitest";
import {
  createProgressBackup,
  MAX_PROGRESS_BACKUP_CHARS,
  parseProgressBackup,
  ProgressBackupTooLargeError,
  serializeProgressBackup
} from "@/domain/progress-backup";
import { createInitialProgress } from "@/domain/progress";
import type { UserProgress } from "@/domain/types";

const NOW = "2026-11-07T12:00:00.000Z";

function progressWithEvidence(body: string): UserProgress {
  return {
    ...createInitialProgress(NOW),
    evidenceItems: [{
      id: "evidence-large",
      type: "note",
      title: "Large note",
      body,
      linkedSkillIds: [],
      testStatus: "unknown",
      readmeStatus: "missing",
      trust: "manual_note",
      createdAt: NOW
    }]
  };
}

describe("backup export/import size contract", () => {
  it("serializes a large but supported backup", () => {
    const json = serializeProgressBackup(createProgressBackup(progressWithEvidence("x".repeat(1_000_000)), {}, NOW));

    expect(json.length).toBeGreaterThan(1_000_000);
    expect(json.length).toBeLessThan(MAX_PROGRESS_BACKUP_CHARS);
    expect(parseProgressBackup(json, NOW).error).toBeUndefined();
  });

  it("refuses to export a document the importer would reject", () => {
    const backup = createProgressBackup(progressWithEvidence("x".repeat(MAX_PROGRESS_BACKUP_CHARS + 1)), {}, NOW);

    expect(() => serializeProgressBackup(backup)).toThrow(ProgressBackupTooLargeError);
    try {
      serializeProgressBackup(backup);
    } catch (error) {
      expect(error).toBeInstanceOf(ProgressBackupTooLargeError);
      expect((error as ProgressBackupTooLargeError).characters).toBeGreaterThan(MAX_PROGRESS_BACKUP_CHARS);
      expect((error as ProgressBackupTooLargeError).limit).toBe(MAX_PROGRESS_BACKUP_CHARS);
    }
  });

  it("rejects an oversized pasted document before parsing it", () => {
    const parsed = parseProgressBackup("x".repeat(MAX_PROGRESS_BACKUP_CHARS + 1), NOW);

    expect(parsed.backup).toBeUndefined();
    expect(parsed.error).toMatch(/too large/i);
  });

  it("rejects an oversized draft even inside an otherwise valid backup", () => {
    const backup = createProgressBackup(createInitialProgress(NOW), {}, NOW);
    const parsed = parseProgressBackup(JSON.stringify({
      ...backup,
      drafts: { "lesson-python-values": { status: "draft", code: "x".repeat(200_001) } }
    }), NOW);

    expect(parsed.backup).toBeUndefined();
    expect(parsed.error).toMatch(/oversized editor draft/i);
  });

  it("accepts a large code snapshot and terminal transcript within the documented limit", () => {
    const progress: UserProgress = createInitialProgress(NOW);
    const backup = createProgressBackup({
      ...progress,
      codeRunAttempts: [{
        id: "large-attempt",
        lessonId: "lesson-python-values",
        language: "python",
        runMode: "run_checks",
        command: "proofpath checks study_session.py",
        codeSnapshot: "print('ok')\n".repeat(50_000),
        stdout: "ok\n".repeat(100_000),
        stderr: "",
        passed: true,
        score: 100,
        runtimeMs: 1,
        testResults: [{ id: "visible", name: "Prints ok", passed: true, visible: true, message: "Passed" }],
        hiddenCheckSummary: { total: 0, passed: 0, failed: 0 },
        diagnostics: [],
        terminalTranscript: [{ type: "stdout", text: "ok\n".repeat(100_000) }],
        sandboxDisclosureVersion: 2,
        createdAt: NOW
      }]
    }, {}, NOW);

    const json = serializeProgressBackup(backup);
    expect(json.length).toBeLessThan(MAX_PROGRESS_BACKUP_CHARS);
    expect(parseProgressBackup(json, NOW).error).toBeUndefined();
  });
});
