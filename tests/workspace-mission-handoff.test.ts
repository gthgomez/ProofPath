import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { buildCiWorkflowDiagnosisTask, buildStudyTrackerFullJourneyTask } from "@/content/workspace-tasks";
import { generateReviewerPortfolioExport } from "@/domain/evidence-export";
import { evidenceTrustLabel } from "@/domain/evidence-trust";
import {
  addEvidenceItem,
  canCompleteMission,
  createInitialProgress,
  getMissionSupportedLessonIds,
  hasVerifierBackedMissionEvidence,
  reconcileDerivedProgress,
  setRoleTarget,
  summarizeMissionProof
} from "@/domain/progress";
import { validateResultManifest, workspaceFilesHash } from "@/domain/workspace-bridge";

const PYTHON = process.env.PYTHON ?? "python3";
const NODE_MODULES = join(process.cwd(), "node_modules");
const HAS_TYPESCRIPT = existsSync(join(NODE_MODULES, "typescript"));
const NOW = "2026-11-07T12:00:00.000Z";

const tempDirs: string[] = [];
afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

const REPAIRED_VIEW = `CREATE VIEW IF NOT EXISTS weekly_summary AS
SELECT
  strftime('%Y-W%W', date) AS week,
  topic,
  COUNT(*) AS session_count,
  SUM(minutes) AS total_minutes
FROM study_sessions
GROUP BY week, topic
ORDER BY week, topic;`;

function materializeRepairedStudyTracker(): string {
  const task = buildStudyTrackerFullJourneyTask();
  const dir = mkdtempSync(join(tmpdir(), "proofpath-mission-"));
  tempDirs.push(dir);
  const files = new Map(task.files.map((file) => [file.path, file.content]));
  files.set("schema.sql", files.get("schema.sql")!.replace(/CREATE VIEW[\s\S]*?;/, REPAIRED_VIEW));
  for (const [path, content] of files) {
    const target = join(dir, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content, "utf8");
  }
  if (HAS_TYPESCRIPT) {
    symlinkSync(NODE_MODULES, join(dir, "node_modules"), process.platform === "win32" ? "junction" : "dir");
  }
  return dir;
}

function runVerifier(dir: string): { code: number; stdout: string; stderr: string } {
  try {
    return {
      code: 0,
      stdout: execFileSync(PYTHON, ["verify_journey.py"], { cwd: dir, encoding: "utf8" }),
      stderr: ""
    };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    return { code: failure.status ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" };
  }
}

describe("Study Tracker → mission → reviewer handoff", () => {
  it("runs the real verifier, then requires a coherent submission before awarding the mission", () => {
    const task = buildStudyTrackerFullJourneyTask();
    const mission = contentPack.projectMissions.find((candidate) => candidate.id === task.linkedMissionId);
    expect(mission).toBeDefined();
    expect(task.linkedMissionId).toBe("mission-cli-study-tracker");

    const run = runVerifier(materializeRepairedStudyTracker());
    expect(run.code).toBe(0);
    expect(validateResultManifest(task, run.stdout.trim())).toEqual({ status: "valid", passed: true, problems: [] });
    const manifest = run.stdout.trim();

    // A pasted manifest alone is self-reported verification evidence, not an
    // independently verified repository.
    let progress = setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
    progress = addEvidenceItem(progress, {
      type: "test-output",
      title: `${task.title} verifier run`,
      body: `Pasted the verifier result manifest for ${task.id} v${task.version}. Self-reported by the learner's own machine.`,
      linkedProjectMissionId: mission!.id,
      testStatus: "passing",
      verifierOutput: manifest
    }, NOW);

    const savedManifest = progress.evidenceItems[0];
    expect(savedManifest?.trust).toBe("manual_verifier_output");
    expect(hasVerifierBackedMissionEvidence(progress, mission!.id)).toBe(true);

    const manifestOnlySummary = summarizeMissionProof(progress, mission!);
    expect(manifestOnlySummary.verificationProvided).toBe(true);
    expect(manifestOnlySummary.documentationComplete).toBe(false);
    expect(canCompleteMission(progress, mission!)).toBe(false);

    const notYetAwarded = reconcileDerivedProgress(contentPack, progress, NOW);
    expect(notYetAwarded.completedProjectMissionIds).not.toContain(mission!.id);

    // One coherent submission carries the verifier output, README state, and
    // reflection for the same linked mission.
    progress = addEvidenceItem(progress, {
      type: "repo",
      title: `${task.title} submission`,
      body: "Repository revision, verifier output, README usage, and a short reflection for the same submission.",
      linkedProjectMissionId: mission!.id,
      testStatus: "passing",
      verifierOutput: manifest,
      readmeStatus: "basic",
      reflection: "Repaired the weekly aggregation and verified the project locally."
    }, NOW);

    expect(canCompleteMission(progress, mission!)).toBe(true);
    // Mission award also requires the linked lesson preparation. Placement is a
    // legitimate way to represent already-satisfied preparation.
    const supportedLessonIds = getMissionSupportedLessonIds(mission!, contentPack.lessons, contentPack);
    progress = { ...progress, placedOutLessonIds: supportedLessonIds };
    const awarded = reconcileDerivedProgress(contentPack, progress, NOW);
    expect(awarded.completedProjectMissionIds).toContain(mission!.id);

    const packet = generateReviewerPortfolioExport(contentPack, awarded, NOW);
    const manifestEntry = packet.evidenceItems.find((item) => item.id === savedManifest?.id);
    expect(manifestEntry?.trust).toBe("manual_verifier_output");
    expect(evidenceTrustLabel(manifestEntry?.trust)).toBe("Self-reported check output");
    expect(packet.summary.autoVerifiedCount).toBe(0);
    expect(packet.evidenceItems.every((item) => item.trust !== "auto_verified_code_lab")).toBe(true);
    expect(packet.markdownPacket).toContain("Self-reported check output");
    expect(packet.markdownPacket).toContain("not been independently verified");
  });

  it("rejects a manifest from a different task and a tampered workspace hash", () => {
    const studyTask = buildStudyTrackerFullJourneyTask();
    const ciTask = buildCiWorkflowDiagnosisTask();
    const run = runVerifier(materializeRepairedStudyTracker());
    const manifest = run.stdout.trim();

    expect(validateResultManifest(ciTask, manifest).status).toBe("wrong-task");
    const tampered = manifest.replace(workspaceFilesHash(studyTask), "00000000");
    expect(validateResultManifest(studyTask, tampered).status).toBe("stale-workspace");
    expect(validateResultManifest(studyTask, "{not json").status).toBe("malformed");
  });
});
