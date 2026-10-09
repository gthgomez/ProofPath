import { z } from "zod";

/**
 * Real repository bridge (audit brief PR07).
 *
 * The in-app sandbox honestly cannot run GitHub Actions, install packages, or
 * touch the filesystem. This module bridges deliberately: it exports a small
 * task workspace the learner runs with real tools on their own machine, and it
 * validates the versioned result manifest those tools produce. Results
 * validated here are still self-reported by the learner's machine — they are
 * labeled as such and never impersonate independently verified execution.
 */

export interface WorkspaceTaskFile {
  path: string;
  content: string;
}

export interface WorkspaceTaskCommand {
  id: string;
  label: string;
  command: string;
  purpose: string;
}

export interface WorkspaceTask {
  id: string;
  version: string;
  title: string;
  /** Disclosed before the learner commits: what the workspace requires. */
  requirements: string[];
  setupInstructions: string[];
  /** Optional portfolio mission this workspace's evidence belongs to. */
  linkedMissionId?: string;
  files: WorkspaceTaskFile[];
  commands: WorkspaceTaskCommand[];
}

export interface WorkspaceBundle {
  taskId: string;
  title: string;
  fileName: string;
  taskVersion: string;
  instructions: string[];
  files: WorkspaceTaskFile[];
}

export const workspaceResultManifestSchema = z.object({
  taskId: z.string().min(1),
  taskVersion: z.string().min(1),
  filesHash: z.string().min(1),
  results: z.array(z.object({
    commandId: z.string().min(1),
    passed: z.boolean()
  })).min(1),
  ranAt: z.string().min(1)
});

export type WorkspaceResultManifest = z.infer<typeof workspaceResultManifestSchema>;

export type WorkspaceManifestStatus =
  | "valid"
  | "wrong-task"
  | "stale-workspace"
  | "incomplete"
  | "malformed";

export interface WorkspaceManifestValidation {
  status: WorkspaceManifestStatus;
  /** True only when every task command passed on a matching workspace. */
  passed: boolean;
  problems: string[];
}

/** Deterministic FNV-1a hash over the task's file contents, used to detect a result manifest produced from a changed workspace. Files named `.proofpath-*` are excluded: they carry the hash itself and identity metadata echoed into the manifest. */
export function workspaceFilesHash(task: WorkspaceTask): string {
  let hash = 0x811c9dc5;
  const serialized = task.files
    .filter((file) => !file.path.split("/").pop()?.startsWith(".proofpath-"))
    .map((file) => `${file.path}\n${file.content}`)
    .sort()
    .join("\u0000");
  for (let i = 0; i < serialized.length; i++) {
    hash ^= serialized.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

// The bundle is text the learner will commit; scan for obvious secret shapes
// before exporting. This is a guard against authoring mistakes, not a
// substitute for review of task content.
const SECRET_PATTERNS: RegExp[] = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\b(?:password|secret|api[_-]?key)\s*[:=]\s*["'][^"']{8,}["']/i
];

export function createWorkspaceBundle(task: WorkspaceTask): WorkspaceBundle {
  const offenders = task.files.filter((file) => SECRET_PATTERNS.some((pattern) => pattern.test(file.content)));
  if (offenders.length > 0) {
    throw new Error(`Workspace task ${task.id} file looks like it contains a secret: ${offenders.map((file) => file.path).join(", ")}`);
  }

  return {
    taskId: task.id,
    title: task.title,
    fileName: `${task.id}-v${task.version}.workspace.json`,
    taskVersion: task.version,
    instructions: [
      ...task.requirements.map((requirement) => `Requires: ${requirement}`),
      ...task.setupInstructions,
      ...task.commands.map((command) => `Run: ${command.command}  (${command.purpose})`),
      "Paste the JSON manifest printed by the last command back into the app."
    ],
    files: task.files.map((file) => ({ ...file }))
  };
}

/**
 * Serialize a bundle to a self-contained, machine-readable file. Every file's
 * path and contents are preserved so the project can be reconstructed exactly
 * from this export (a human-readable Markdown rendering is also available).
 */
export function serializeWorkspaceBundle(bundle: WorkspaceBundle): string {
  return `${JSON.stringify({
    taskId: bundle.taskId,
    taskVersion: bundle.taskVersion,
    title: bundle.title,
    instructions: bundle.instructions,
    files: bundle.files
  }, null, 2)}\n`;
}

/** Human-readable rendering with file delimiters, for copy/paste review. */
export function workspaceBundleMarkdown(bundle: WorkspaceBundle): string {
  const sections = [
    `# ProofPath workspace: ${bundle.title}`,
    ``,
    `Task: \`${bundle.taskId}\` (version ${bundle.taskVersion})`,
    ``,
    `## Setup`,
    ...bundle.instructions.map((instruction) => `- ${instruction}`),
    ``
  ];

  for (const file of bundle.files) {
    sections.push(`## File: \`${file.path}\``, "", "```", file.content.replace(/\n$/, ""), "```", "");
  }

  return sections.join("\n");
}

export function parseResultManifest(raw: string): { manifest?: WorkspaceResultManifest; error?: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "The pasted result is not valid JSON." };
  }

  const result = workspaceResultManifestSchema.safeParse(parsed);
  if (!result.success) {
    return { error: "The pasted result does not match the workspace result manifest format." };
  }

  return { manifest: result.data };
}

export function validateResultManifest(task: WorkspaceTask, raw: string): WorkspaceManifestValidation {
  const parsed = parseResultManifest(raw);
  if (!parsed.manifest) {
    return { status: "malformed", passed: false, problems: [parsed.error ?? "Unreadable manifest."] };
  }

  const manifest = parsed.manifest;
  const problems: string[] = [];

  if (manifest.taskId !== task.id) {
    return { status: "wrong-task", passed: false, problems: [`This result belongs to task ${manifest.taskId}, not ${task.id}.`] };
  }

  if (manifest.taskVersion !== task.version) {
    return { status: "wrong-task", passed: false, problems: [`This result was produced for task version ${manifest.taskVersion}; the current task is version ${task.version}.`] };
  }

  const currentHash = workspaceFilesHash(task);
  if (manifest.filesHash !== currentHash) {
    return {
      status: "stale-workspace",
      passed: false,
      problems: ["The workspace files changed after this result was produced. Re-run the verification commands and paste a fresh manifest."]
    };
  }

  const taskCommandIds = new Set(task.commands.map((command) => command.id));
  const resultsByCommand = new Map<string, boolean>();
  for (const result of manifest.results) {
    resultsByCommand.set(result.commandId, resultsByCommand.get(result.commandId) === false ? false : result.passed);
  }

  for (const command of task.commands) {
    if (!resultsByCommand.has(command.id)) {
      problems.push(`No result recorded for: ${command.command}`);
    } else if (resultsByCommand.get(command.id) === false) {
      problems.push(`Did not pass yet: ${command.command}`);
    }
  }

  for (const commandId of resultsByCommand.keys()) {
    if (!taskCommandIds.has(commandId)) {
      problems.push(`Unknown command in manifest: ${commandId}`);
    }
  }

  if (problems.length > 0) {
    return { status: "incomplete", passed: false, problems };
  }

  return {
    status: "valid",
    passed: true,
    problems: []
  };
}
