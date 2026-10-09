import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { buildCiWorkflowDiagnosisTask, buildStudyTrackerFullJourneyTask } from "@/content/workspace-tasks";
import { parseResultManifest, validateResultManifest, workspaceFilesHash, type WorkspaceTask } from "@/domain/workspace-bridge";

const NODE_MODULES = join(process.cwd(), "node_modules");
const PYTHON = process.env.PYTHON ?? "python3";
const HAS_TYPESCRIPT = existsSync(join(NODE_MODULES, "typescript"));

const tempDirs: string[] = [];

afterAll(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** Write the generated task to a temp dir; `edit` may mutate file contents. */
function materialize(task: WorkspaceTask, edit?: (files: Map<string, string>) => void): string {
  const dir = mkdtempSync(join(tmpdir(), "proofpath-workspace-"));
  tempDirs.push(dir);

  const files = new Map(task.files.map((file) => [file.path, file.content]));
  edit?.(files);

  for (const [path, content] of files) {
    const target = join(dir, path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content, "utf8");
  }

  // Give the workspace the real TypeScript compiler without a network install.
  if (HAS_TYPESCRIPT) {
    symlinkSync(NODE_MODULES, join(dir, "node_modules"), "dir");
  }

  return dir;
}

function runVerifier(dir: string, script: string): { code: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync(PYTHON, [script], { cwd: dir, encoding: "utf8" });
    return { code: 0, stdout, stderr: "" };
  } catch (error) {
    const failure = error as { status?: number; stdout?: string; stderr?: string };
    return { code: failure.status ?? 1, stdout: failure.stdout ?? "", stderr: failure.stderr ?? "" };
  }
}

const REPAIRED_VIEW = `CREATE VIEW IF NOT EXISTS weekly_summary AS
SELECT
  strftime('%Y-W%W', date) AS week,
  topic,
  COUNT(*) AS session_count,
  SUM(minutes) AS total_minutes
FROM study_sessions
GROUP BY week, topic
ORDER BY week, topic;`;

function repairWeeklyView(content: string): string {
  const repaired = content.replace(/CREATE VIEW[\s\S]*?;/, REPAIRED_VIEW);
  if (repaired === content) {
    throw new Error("No CREATE VIEW statement found in schema.sql to repair");
  }
  return repaired;
}

describe("study tracker workspace journey", () => {
  it("fails on the shipped build but still prints a schema-valid result manifest", () => {
    const task = buildStudyTrackerFullJourneyTask();
    const dir = materialize(task);
    const run = runVerifier(dir, "verify_journey.py");

    const parsed = parseResultManifest(run.stdout.trim());
    expect(parsed.manifest).toBeDefined();
    expect(run.code).not.toBe(0);

    const validation = validateResultManifest(task, run.stdout.trim());
    expect(validation.status).toBe("incomplete");
    expect(validation.passed).toBe(false);
    expect(run.stderr).toContain("sql-weekly-aggregation");
  });

  it("passes its real verifier once the weekly aggregation is repaired", () => {
    const task = buildStudyTrackerFullJourneyTask();
    const dir = materialize(task, (files) => {
      files.set("schema.sql", repairWeeklyView(files.get("schema.sql")!));
    });
    const run = runVerifier(dir, "verify_journey.py");

    expect(run.stderr).not.toContain("FAIL");
    expect(run.code).toBe(0);
    expect(validateResultManifest(task, run.stdout.trim())).toEqual({ status: "valid", passed: true, problems: [] });
  });

  it("fails the verifier when the learner breaks input validation", () => {
    const task = buildStudyTrackerFullJourneyTask();
    const dir = materialize(task, (files) => {
      files.set("schema.sql", repairWeeklyView(files.get("schema.sql")!));
      files.set("backend.py", files.get("backend.py")!.replace("    validate_session(topic, date, minutes)\n", ""));
    });
    const run = runVerifier(dir, "verify_journey.py");

    expect(run.code).not.toBe(0);
    expect(validateResultManifest(task, run.stdout.trim()).passed).toBe(false);
  });

  it.skipIf(!HAS_TYPESCRIPT)("catches TypeScript contract drift with a real typecheck", () => {
    const task = buildStudyTrackerFullJourneyTask();
    const dir = materialize(task, (files) => {
      files.set("schema.sql", repairWeeklyView(files.get("schema.sql")!));
      files.set("types.ts", files.get("types.ts")!.replace("totalMinutes: number;", "minutesTotal: number;"));
    });
    const run = runVerifier(dir, "verify_journey.py");

    expect(run.code).not.toBe(0);
    expect(run.stderr).toMatch(/ts-contract-typecheck.*FAIL|FAIL.*ts-contract-typecheck/s);
    expect(run.stdout).toContain('"passed": false');
  });

  it("rejects a result manifest whose workspace hash no longer matches", () => {
    const task = buildStudyTrackerFullJourneyTask();
    const dir = materialize(task, (files) => {
      files.set("schema.sql", repairWeeklyView(files.get("schema.sql")!));
    });
    const run = runVerifier(dir, "verify_journey.py");
    expect(validateResultManifest(task, run.stdout.trim()).passed).toBe(true);

    const tampered = run.stdout.trim().replace(workspaceFilesHash(task), "00000000");
    expect(validateResultManifest(task, tampered).status).toBe("stale-workspace");
  });
});

describe("CI diagnosis workspace journey", () => {
  const REPAIRED_WORKFLOW = (content: string): string => content
    .replace("pyhton -m pytest", "python -m pytest")
    .replace("  deploy:", "  deploy:\n    needs: [lint, test]");

  it("emits a schema-valid manifest and fails on the broken workflow", () => {
    const task = buildCiWorkflowDiagnosisTask();
    const dir = materialize(task);
    const run = runVerifier(dir, "verify.py");

    expect(parseResultManifest(run.stdout.trim()).manifest).toBeDefined();
    expect(run.code).not.toBe(0);
    expect(validateResultManifest(task, run.stdout.trim()).status).toBe("incomplete");
  });

  it("passes after a bounded repair and validates as the current task's result", () => {
    const task = buildCiWorkflowDiagnosisTask();
    const dir = materialize(task, (files) => {
      files.set(".github/workflows/ci.yml", REPAIRED_WORKFLOW(files.get(".github/workflows/ci.yml")!));
    });
    const run = runVerifier(dir, "verify.py");

    expect(run.code).toBe(0);
    expect(validateResultManifest(task, run.stdout.trim())).toEqual({ status: "valid", passed: true, problems: [] });
  });
});
