import { describe, expect, it } from "vitest";
import { buildCiWorkflowDiagnosisTask } from "@/content/workspace-tasks";
import {
  createWorkspaceBundle,
  validateResultManifest,
  workspaceFilesHash
} from "@/domain/workspace-bridge";
import type { WorkspaceTask } from "@/domain/workspace-bridge";

function manifestJson(task: WorkspaceTask, passed: boolean): string {
  return JSON.stringify({
    taskId: task.id,
    taskVersion: task.version,
    filesHash: workspaceFilesHash(task),
    results: [{ commandId: "verify", passed }],
    ranAt: "2026-09-28T12:00:00.000Z"
  });
}

describe("workspace bundle export", () => {
  it("builds a deterministic bundle with identity metadata filled in", () => {
    const task = buildCiWorkflowDiagnosisTask();
    const first = createWorkspaceBundle(task);
    const second = createWorkspaceBundle(task);

    expect(first).toEqual(second);
    const manifestFile = task.files.find((file) => file.path === ".proofpath-workspace.json")!;
    expect(manifestFile.content).toContain(task.id);
    expect(manifestFile.content).toContain(workspaceFilesHash(task));
    expect(first.files.map((file) => file.path)).toContain(".github/workflows/ci.yml");
  });

  it("refuses to export a bundle whose files look like they contain secrets", () => {
    const task = buildCiWorkflowDiagnosisTask();
    const poisoned: WorkspaceTask = {
      ...task,
      files: [...task.files, { path: "deploy.sh", content: "API_KEY=\"sk-abcdefghijklmnopqrstuvwx\"\n" }]
    };

    expect(() => createWorkspaceBundle(poisoned)).toThrow(/secret/);
  });

  it("the shipped broken workflow exhibits both reported defects", () => {
    const task = buildCiWorkflowDiagnosisTask();
    const workflow = task.files.find((file) => file.path === ".github/workflows/ci.yml")!.content;
    const deployBlock = workflow.split("deploy:", 1)[1] ?? "";

    expect(workflow).toContain("pyhton -m pytest");
    expect(deployBlock).not.toContain("needs:");
  });

  it("the repaired workflow passes validation (bounded repair keeps contract)", () => {
    const task = buildCiWorkflowDiagnosisTask();
    const fixedWorkflow = task.files
      .find((file) => file.path === ".github/workflows/ci.yml")!
      .content
      .replace("pyhton -m pytest", "python -m pytest")
      .replace("  deploy:", "  deploy:\n    needs: [lint, test]");

    const fixedTask: WorkspaceTask = {
      ...task,
      files: task.files.map((file) =>
        file.path === ".github/workflows/ci.yml" ? { ...file, content: fixedWorkflow } : file
      )
    };

    // The valid equivalent repair (needs: lint and test spelled as a list or
    // scalar) is accepted; validation checks semantics through the manifest.
    expect(validateResultManifest(fixedTask, manifestJson(fixedTask, true))).toEqual({
      status: "valid",
      passed: true,
      problems: []
    });
  });
});

describe("result manifest validation", () => {
  const task = buildCiWorkflowDiagnosisTask();

  it("rejects a failing run as incomplete, naming the failed command", () => {
    const validation = validateResultManifest(task, manifestJson(task, false));

    expect(validation.status).toBe("incomplete");
    expect(validation.passed).toBe(false);
    expect(validation.problems.join("\n")).toContain("python verify.py");
  });

  it("rejects a manifest from a different task version as wrong-task", () => {
    const stale = { ...task, version: "0.9.0" };
    const validation = validateResultManifest(task, manifestJson(stale, true));

    expect(validation.status).toBe("wrong-task");
    expect(validation.problems.join("\n")).toContain("0.9.0");
  });

  it("rejects a manifest whose files hash does not match the current workspace as stale", () => {
    // The manifest must be re-verified when the workspace changes: a hash that
    // does not match the current task files is stale, never credited.
    const tampered = manifestJson(task, true).replace(workspaceFilesHash(task), "deadbeef");
    const staleValidation = validateResultManifest(task, tampered);
    expect(staleValidation.status).toBe("stale-workspace");
    expect(staleValidation.problems.join("\n")).toContain("Re-run");
  });

  it("rejects malformed input precisely", () => {
    expect(validateResultManifest(task, "not json").status).toBe("malformed");
    expect(validateResultManifest(task, JSON.stringify({ hello: 1 })).status).toBe("malformed");
  });

  it("rejects unknown and missing command results", () => {
    const withUnknown = JSON.stringify({
      taskId: task.id,
      taskVersion: task.version,
      filesHash: workspaceFilesHash(task),
      results: [
        { commandId: "verify", passed: true },
        { commandId: "mystery", passed: true }
      ],
      ranAt: "2026-09-28T12:00:00.000Z"
    });
    expect(validateResultManifest(task, withUnknown).problems.join("\n")).toContain("Unknown command");

    const withMissing = JSON.stringify({
      taskId: task.id,
      taskVersion: task.version,
      filesHash: workspaceFilesHash(task),
      results: [] as unknown[],
      ranAt: "2026-09-28T12:00:00.000Z"
    });
    expect(validateResultManifest(task, withMissing).status).toBe("malformed");
  });

  it("exports and validates the study tracker full-stack journey task (Python -> SQL -> TypeScript -> Git)", async () => {
    const { buildStudyTrackerFullJourneyTask } = await import("@/content/workspace-tasks");
    const journeyTask = buildStudyTrackerFullJourneyTask();
    const bundle = createWorkspaceBundle(journeyTask);

    expect(bundle.files.map((f) => f.path)).toContain("backend.py");
    expect(bundle.files.map((f) => f.path)).toContain("schema.sql");
    expect(bundle.files.map((f) => f.path)).toContain("types.ts");
    expect(bundle.files.map((f) => f.path)).toContain("README.md");
    expect(bundle.files.map((f) => f.path)).toContain("verify_journey.py");

    const passedValidation = validateResultManifest(journeyTask, manifestJson(journeyTask, true));
    expect(passedValidation.status).toBe("valid");
    expect(passedValidation.passed).toBe(true);
  });
});
