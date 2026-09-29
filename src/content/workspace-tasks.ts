import { workspaceFilesHash, type WorkspaceTask } from "@/domain/workspace-bridge";

/**
 * Pilot workspace task (audit brief PR07): converts the sandbox rehearsal in
 * `lesson-python-ci-workflow` into authoring and debugging a real GitHub
 * Actions workflow with real tools. The app exports the workspace; the learner
 * runs the commands locally; the app validates the printed result manifest.
 * Validated results are self-reported by the learner's machine and are labeled
 * as such in evidence.
 */
export const ciWorkflowDiagnosisTask: WorkspaceTask = {
  id: "task-ci-workflow-diagnosis",
  version: "1.0.0",
  title: "Diagnose the broken CI workflow",
  requirements: [
    "Python 3.9+ installed on your computer",
    "A terminal in the extracted workspace folder",
    "No network access needed — nothing is uploaded anywhere"
  ],
  setupInstructions: [
    "Save the files below into one folder, preserving the paths.",
    "Read README.md first, then run the verify command."
  ],
  files: [
    {
      path: "README.md",
      content: `# Broken CI workflow: diagnose and repair

This project's CI workflow has two defects. The first deploy failure shipped
broken code to the "production" server; the second failed with a typo nobody
read until a human tried the command by hand.

## Your task

1. Run \`python verify.py\` and read the failures.
2. Open \`.github/workflows/ci.yml\` and repair the workflow so the deploy job
   can never run before lint and test pass, and so every command is spelled
   correctly.
3. Run \`python verify.py\` again. It prints a JSON result manifest.
4. Paste that JSON manifest back into the app.

Do not edit verify.py — it is the checker, not the exercise.
`
    },
    {
      path: ".github/workflows/ci.yml",
      content: `name: CI
on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ruff check .
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pyhton -m pytest
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/deploy.sh
`
    },
    {
      path: "verify.py",
      content: `"""ProofPath workspace verifier. Run: python verify.py

Checks the GitHub Actions workflow in .github/workflows/ci.yml for the two
reported defects. Prints a JSON result manifest on stdout; paste it back into
the app. This script is the checker — do not edit it.
"""
import json
import sys
from pathlib import Path

WORKFLOW = Path(".github/workflows/ci.yml")
MANIFEST = json.loads(Path(".proofpath-workspace.json").read_text(encoding="utf-8"))


def fail(checks, name, detail):
    checks.append({"commandId": "verify", "name": name, "passed": False, "detail": detail})


def checks_on(checks, text):
    deploy_block = text.split("deploy:", 1)[1]
    if "needs:" not in deploy_block:
        checks.append({
            "commandId": "verify",
            "name": "deploy-gated",
            "passed": False,
            "detail": "The deploy job has no 'needs:' — it can run before lint and test."
        })
    else:
        needs_line = [line for line in deploy_block.splitlines() if "needs:" in line][0]
        if "lint" not in needs_line or "test" not in needs_line:
            checks.append({
                "commandId": "verify",
                "name": "deploy-gated",
                "passed": False,
                "detail": f"deploy must need both lint and test, found: {needs_line.strip()}"
            })
        else:
            checks.append({"commandId": "verify", "name": "deploy-gated", "passed": True, "detail": "deploy is gated on lint and test"})


def main():
    if not WORKFLOW.exists():
        print(json.dumps({**MANIFEST, "results": [{"commandId": "verify", "passed": False}]}))
        sys.exit(1)

    text = WORKFLOW.read_text(encoding="utf-8")
    checks = []

    if "pyhton" in text:
        checks.append({
            "commandId": "verify",
            "name": "command-spelling",
            "passed": False,
            "detail": "Found 'pyhton' — a command is misspelled in the workflow."
        })
    else:
        checks.append({"commandId": "verify", "name": "command-spelling", "passed": True, "detail": "no misspelled commands"})

    checks_on(checks, text)

    manifest = {**MANIFEST, "results": [{"commandId": c["commandId"], "passed": c["passed"]} for c in checks]}
    for check in checks:
        mark = "PASS" if check["passed"] else "FAIL"
        print(f"[{mark}] {check['name']}: {check['detail']}", file=sys.stderr)

    print(json.dumps(manifest))
    sys.exit(0 if all(c["passed"] for c in checks) else 1)


if __name__ == "__main__":
    main()
`
    },
    {
      path: ".proofpath-workspace.json",
      content: "" // filled below with task id/version/hash
    }
  ],
  commands: [
    {
      id: "verify",
      label: "Verify workflow",
      command: "python verify.py",
      purpose: "Re-checks the workflow and prints the JSON result manifest."
    }
  ]
};

// The workspace manifest file must carry the task identity and the files hash
// so verify.py can echo them into the result manifest without recomputing them.
export function buildCiWorkflowDiagnosisTask(): WorkspaceTask {
  const hash = workspaceFilesHash(ciWorkflowDiagnosisTask);
  const files = ciWorkflowDiagnosisTask.files.map((file) =>
    file.path === ".proofpath-workspace.json"
      ? {
          path: file.path,
          content: `${JSON.stringify({ taskId: ciWorkflowDiagnosisTask.id, taskVersion: ciWorkflowDiagnosisTask.version, filesHash: hash }, null, 2)}\n`
        }
      : file
  );
  return { ...ciWorkflowDiagnosisTask, files };
}
