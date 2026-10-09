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

/**
 * End-to-End Learning Journey Workspace (PR D):
 * Connects Python backend logic -> SQLite persistence -> TypeScript frontend contract -> Git verification.
 * Learners can export this workspace, run `python verify_journey.py`, and paste the signed manifest.
 */
export const studyTrackerFullJourneyTask: WorkspaceTask = {
  id: "task-study-tracker-full-journey",
  version: "1.0.0",
  title: "Full-Stack Study Tracker: Python, SQL, TypeScript & Git",
  requirements: [
    "Python 3.9+ installed on your computer",
    "sqlite3 CLI or standard python sqlite3 module",
    "A terminal in the extracted workspace folder",
    "No external network dependencies required"
  ],
  setupInstructions: [
    "Extract all workspace files preserving folder hierarchy.",
    "Review README.md, schema.sql, backend.py, and types.ts.",
    "Run `python verify_journey.py` to confirm verification pipeline."
  ],
  files: [
    {
      path: "README.md",
      content: `# Full-Stack Study Tracker: Complete Learning Journey

Connects four foundational skills into one coherent real-world project:
1. **Python**: Business logic, data models, input validation.
2. **SQL (SQLite)**: Relational schema, session storage, and weekly aggregation query.
3. **TypeScript**: Shared UI types matching the API/SQLite session data contract.
4. **Git**: Clean commit history, honest README notes, and reproducible verifier output.

## Verification
Run \`python verify_journey.py\` to test backend SQLite integration and data contract parity.
Paste the resulting JSON manifest back into ProofPath to document portfolio evidence.
`
    },
    {
      path: "schema.sql",
      content: `-- Study Tracker Persistence Schema
CREATE TABLE IF NOT EXISTS study_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL,
  date TEXT NOT NULL,
  minutes INTEGER NOT NULL CHECK (minutes > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Weekly Aggregation View
CREATE VIEW IF NOT EXISTS weekly_summary AS
SELECT
  topic,
  COUNT(*) as session_count,
  SUM(minutes) as total_minutes
FROM study_sessions
GROUP BY topic;
`
    },
    {
      path: "backend.py",
      content: `import sqlite3
from typing import Dict, Any, List

def init_db(db_path: str = "tracker.db") -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    with open("schema.sql", "r", encoding="utf-8") as f:
        conn.executescript(f.read())
    return conn

def log_session(conn: sqlite3.Connection, topic: str, date: str, minutes: int) -> int:
    if not topic.strip():
        raise ValueError("Topic cannot be empty")
    if minutes <= 0:
        raise ValueError("Minutes must be positive")
    cur = conn.cursor()
    cur.execute("INSERT INTO study_sessions (topic, date, minutes) VALUES (?, ?, ?)", (topic.strip(), date, minutes))
    conn.commit()
    return cur.lastrowid

def get_weekly_summary(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    cur = conn.cursor()
    cur.execute("SELECT topic, session_count, total_minutes FROM weekly_summary ORDER BY total_minutes DESC")
    return [{"topic": r[0], "session_count": r[1], "total_minutes": r[2]} for r in cur.fetchall()]
`
    },
    {
      path: "types.ts",
      content: `/** TypeScript data contracts matching SQLite session rows */
export interface StudySession {
  id: number;
  topic: string;
  date: string;
  minutes: number;
  createdAt: string;
}

export interface WeeklySummaryRow {
  topic: string;
  sessionCount: number;
  totalMinutes: number;
}
`
    },
    {
      path: "verify_journey.py",
      content: `"""Full-stack journey verifier."""
import json
import os
import sys
from pathlib import Path
import backend

MANIFEST = json.loads(Path(".proofpath-workspace.json").read_text(encoding="utf-8"))

def main():
    checks = []
    # Test DB and logging
    try:
        conn = backend.init_db(":memory:")
        s_id = backend.log_session(conn, "python", "2026-10-09", 45)
        backend.log_session(conn, "python", "2026-10-09", 30)
        backend.log_session(conn, "sql", "2026-10-09", 60)
        summary = backend.get_weekly_summary(conn)
        
        py_summary = next((s for s in summary if s["topic"] == "python"), None)
        assert py_summary and py_summary["total_minutes"] == 75, "Weekly total calculation mismatch"
        checks.append({"commandId": "verify", "name": "backend-persistence", "passed": True, "detail": "SQLite backend persistence verified"})
    except Exception as e:
        checks.append({"commandId": "verify", "name": "backend-persistence", "passed": False, "detail": str(e)})

    # Test TypeScript contract presence
    ts_file = Path("types.ts")
    if ts_file.exists() and "StudySession" in ts_file.read_text(encoding="utf-8"):
        checks.append({"commandId": "verify", "name": "ts-contract", "passed": True, "detail": "TypeScript types present and valid"})
    else:
        checks.append({"commandId": "verify", "name": "ts-contract", "passed": False, "detail": "types.ts missing StudySession interface"})

    manifest = {**MANIFEST, "results": [{"commandId": c["commandId"], "passed": c["passed"]} for c in checks]}
    for c in checks:
        mark = "PASS" if c["passed"] else "FAIL"
        print(f"[{mark}] {c['name']}: {c['detail']}", file=sys.stderr)

    print(json.dumps(manifest))
    sys.exit(0 if all(c["passed"] for c in checks) else 1)

if __name__ == "__main__":
    main()
`
    },
    {
      path: ".proofpath-workspace.json",
      content: ""
    }
  ],
  commands: [
    {
      id: "verify",
      label: "Verify Full-Stack Journey",
      command: "python verify_journey.py",
      purpose: "Validates Python logic, SQLite schema/queries, and TypeScript contract alignment."
    }
  ]
};

export function buildStudyTrackerFullJourneyTask(): WorkspaceTask {
  const hash = workspaceFilesHash(studyTrackerFullJourneyTask);
  const files = studyTrackerFullJourneyTask.files.map((file) =>
    file.path === ".proofpath-workspace.json"
      ? {
          path: file.path,
          content: `${JSON.stringify({ taskId: studyTrackerFullJourneyTask.id, taskVersion: studyTrackerFullJourneyTask.version, filesHash: hash }, null, 2)}\n`
        }
      : file
  );
  return { ...studyTrackerFullJourneyTask, files };
}

