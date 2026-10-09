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
from datetime import datetime, timezone
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
        print(json.dumps({
            **MANIFEST,
            "ranAt": datetime.now(timezone.utc).isoformat(),
            "results": [{"commandId": "verify", "passed": False}],
        }))
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

    manifest = {
        **MANIFEST,
        "ranAt": datetime.now(timezone.utc).isoformat(),
        "results": [{"commandId": c["commandId"], "passed": c["passed"]} for c in checks],
    }
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
 * Full-Stack Study Tracker workspace.
 *
 * Ties Python validation + persistence, SQLite weekly aggregation, a TypeScript
 * data contract, and Git habits into one local project. The learner exports the
 * files, repairs the intentionally-broken weekly aggregation, runs the real
 * verifier, and pastes the result manifest back into the app.
 *
 * The result manifest is self-reported by the learner's own machine. It is a
 * JSON record, not a signature, and does not prove independent execution.
 */
export const studyTrackerFullJourneyTask: WorkspaceTask = {
  id: "task-study-tracker-full-journey",
  version: "2.0.0",
  title: "Full-Stack Study Tracker: Python, SQL, TypeScript & Git",
  requirements: [
    "Python 3.9+ on your PATH (python3 or python)",
    "Node.js 18+ with `npm install` for the TypeScript contract check",
    "A terminal in the extracted workspace folder",
    "No network access is required once npm install has run"
  ],
  linkedMissionId: "mission-cli-study-tracker",
  setupInstructions: [
    "Reconstruct every file below, preserving its path.",
    "Run `npm install` once to fetch the TypeScript compiler.",
    "Read README.md, then run `python3 verify_journey.py`.",
    "Repair the weekly_summary view in schema.sql so it aggregates by week.",
    "Re-run the verifier until every check passes, then paste the printed JSON manifest back into ProofPath."
  ],
  files: [
    {
      path: "README.md",
      content: `# Full-Stack Study Tracker

One small project that ties four skills together:

- **Python** - validate session input, persist it, and compute deterministic summaries.
- **SQL (SQLite)** - a schema with real constraints and a weekly aggregation view.
- **TypeScript** - a data contract that must match the JSON the backend emits.
- **Git** - a clean history and reproducible verification commands.

## Your task (required)

\`schema.sql\` ships with a \`weekly_summary\` view that groups by topic only, so it
can never answer "how many minutes did I study each week?". Repair the view so it
groups by ISO week:

\`\`\`sql
CREATE VIEW IF NOT EXISTS weekly_summary AS
SELECT
  strftime('%Y-W%W', date) AS week,
  topic,
  COUNT(*) AS session_count,
  SUM(minutes) AS total_minutes
FROM study_sessions
GROUP BY week, topic
ORDER BY week, topic;
\`\`\`

## Verify

    python3 verify_journey.py

The verifier runs the Python checks, the SQLite weekly-aggregation check, and a
real \`tsc --noEmit\` type check of the TypeScript contract. It prints a JSON
result manifest on stdout; paste that manifest back into ProofPath.

The manifest is self-reported by your machine. It is not signed and does not
prove independent execution.

## Toolchain

    npm install        # installs the TypeScript compiler
    npx tsc --noEmit   # type-check the contract on its own

## Git

    git init
    git add .
    git commit -m "Repair weekly aggregation in study tracker"

Commit the repaired schema alongside the code so a reviewer can see exactly what
changed.
`
    },
    {
      path: "schema.sql",
      content: `-- Study Tracker persistence schema.
-- The learner must repair the weekly_summary view so it aggregates by week,
-- not by topic alone. See README.md.

CREATE TABLE IF NOT EXISTS study_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic TEXT NOT NULL CHECK (length(trim(topic)) > 0),
  date TEXT NOT NULL,
  minutes INTEGER NOT NULL CHECK (minutes > 0),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- BUG: this groups every session for a topic together and ignores the date,
-- so it can never report per-week totals. Repair it to group by week using
-- strftime('%Y-W%W', date).
CREATE VIEW IF NOT EXISTS weekly_summary AS
SELECT
  topic,
  COUNT(*) AS session_count,
  SUM(minutes) AS total_minutes
FROM study_sessions
GROUP BY topic;
`
    },
    {
      path: "backend.py",
      content: `"""Study tracker backend: validation, persistence, deterministic summaries."""
import sqlite3
from pathlib import Path
from typing import Any, Dict, List

SCHEMA_PATH = Path(__file__).with_name("schema.sql")


def init_db(db_path: str = "tracker.db") -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
    return conn


def validate_session(topic: str, date: str, minutes: int) -> None:
    if not isinstance(topic, str) or not topic.strip():
        raise ValueError("Topic cannot be empty")
    if isinstance(minutes, bool) or not isinstance(minutes, int) or minutes <= 0:
        raise ValueError("Minutes must be a positive whole number")
    if not isinstance(date, str) or len(date) != 10 or date[4] != "-" or date[7] != "-":
        raise ValueError("Date must be an ISO date such as 2026-10-09")


def log_session(conn: sqlite3.Connection, topic: str, date: str, minutes: int) -> int:
    validate_session(topic, date, minutes)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO study_sessions (topic, date, minutes) VALUES (?, ?, ?)",
        (topic.strip(), date, minutes),
    )
    conn.commit()
    return int(cursor.lastrowid)


def get_weekly_summary(conn: sqlite3.Connection) -> List[Dict[str, Any]]:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT week, topic, session_count, total_minutes FROM weekly_summary ORDER BY week, topic"
    )
    return [
        {
            "week": row[0],
            "topic": row[1],
            "sessionCount": row[2],
            "totalMinutes": row[3],
        }
        for row in cursor.fetchall()
    ]
`
    },
    {
      path: "types.ts",
      content: `/** TypeScript data contracts matching the JSON rows the Python backend emits. */
export interface StudySession {
  id: number;
  topic: string;
  date: string;
  minutes: number;
  createdAt: string;
}

export interface WeeklySummaryRow {
  week: string;
  topic: string;
  sessionCount: number;
  totalMinutes: number;
}
`
    },
    {
      path: "contract_check.ts",
      content: `import type { WeeklySummaryRow } from "./types";

// A compile-time contract check. If the interface above drifts from the JSON
// the Python backend emits, tsc --noEmit fails here and the verifier reports it.
const sample: WeeklySummaryRow = {
  week: "2026-W02",
  topic: "python",
  sessionCount: 2,
  totalMinutes: 75
};

export default sample;
`
    },
    {
      path: "tsconfig.json",
      content: `{
  "compilerOptions": {
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"]
  },
  "include": ["types.ts", "contract_check.ts"]
}
`
    },
    {
      path: "package.json",
      content: `{
  "name": "proofpath-study-tracker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "5.9.3"
  }
}
`
    },
    {
      path: "verify_journey.py",
      content: `"""ProofPath full-stack study tracker verifier.

Run: python3 verify_journey.py

Executes real checks against backend.py, schema.sql, and the TypeScript contract,
then prints a JSON result manifest on stdout. Paste that manifest back into
ProofPath. This script is the checker - do not edit it.
"""
import json
import shutil
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MANIFEST = json.loads((ROOT / ".proofpath-workspace.json").read_text(encoding="utf-8"))


def record(checks, name, passed, detail):
    checks.append({"name": name, "passed": bool(passed), "detail": detail})
    print(f"[{'PASS' if passed else 'FAIL'}] {name}: {detail}", file=sys.stderr)


def check_python_validation(checks):
    try:
        import backend

        conn = backend.init_db(":memory:")
        accepted_bad_input = []
        for topic, date, minutes in (("", "2026-01-05", 30), ("python", "2026-01-05", 0), ("python", "2026-01-05", -5)):
            try:
                backend.log_session(conn, topic, date, minutes)
                accepted_bad_input.append({"topic": topic, "minutes": minutes})
            except ValueError:
                pass
        if accepted_bad_input:
            record(checks, "python-input-validation", False,
                   f"log_session accepted invalid input: {accepted_bad_input}")
        else:
            record(checks, "python-input-validation", True,
                   "empty topics and non-positive minutes are rejected with ValueError")
    except Exception as error:
        record(checks, "python-input-validation", False, f"{type(error).__name__}: {error}")


def check_sql_weekly(checks):
    try:
        import backend

        conn = backend.init_db(":memory:")
        backend.log_session(conn, "python", "2026-01-05", 30)
        backend.log_session(conn, "python", "2026-01-07", 45)
        backend.log_session(conn, "python", "2026-01-12", 60)
        rows = [row for row in backend.get_weekly_summary(conn) if row["topic"] == "python"]
        if len(rows) != 2:
            record(checks, "sql-weekly-aggregation", False,
                   f"the weekly_summary view must aggregate each week separately; python rows were {rows}")
            return
        totals = sorted(row["totalMinutes"] for row in rows)
        weeks = sorted(row["week"] for row in rows)
        if totals != [60, 75] or weeks[0] == weeks[1]:
            record(checks, "sql-weekly-aggregation", False,
                   f"weekly totals must be 75 and 60 for two distinct weeks; got {rows}")
        else:
            record(checks, "sql-weekly-aggregation", True,
                   f"weekly aggregation groups by week: {weeks} gives totals {totals}")
    except Exception as error:
        record(checks, "sql-weekly-aggregation", False, f"{type(error).__name__}: {error}")


def check_typescript(checks):
    node = shutil.which("node")
    tsc = ROOT / "node_modules" / "typescript" / "bin" / "tsc"
    if not node or not tsc.exists():
        record(checks, "ts-contract-typecheck", False,
               "TypeScript toolchain not found. Install Node.js and run npm install in the workspace, then re-run.")
        return
    try:
        completed = subprocess.run(
            [node, str(tsc), "--noEmit", "-p", str(ROOT / "tsconfig.json")],
            cwd=str(ROOT), capture_output=True, text=True, timeout=120,
        )
        if completed.returncode == 0:
            record(checks, "ts-contract-typecheck", True,
                   "tsc --noEmit type-checked types.ts against contract_check.ts")
        else:
            lines = (completed.stdout + completed.stderr).strip().splitlines()
            detail = lines[0] if lines else "tsc reported a type error"
            record(checks, "ts-contract-typecheck", False, f"tsc --noEmit failed: {detail}")
    except Exception as error:
        record(checks, "ts-contract-typecheck", False, f"{type(error).__name__}: {error}")


def main():
    checks = []
    check_python_validation(checks)
    check_sql_weekly(checks)
    check_typescript(checks)

    manifest = {
        **MANIFEST,
        "ranAt": datetime.now(timezone.utc).isoformat(),
        "results": [{"commandId": "verify", "passed": check["passed"]} for check in checks],
    }
    print(json.dumps(manifest))
    sys.exit(0 if all(check["passed"] for check in checks) else 1)


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
      label: "Verify full-stack journey",
      command: "python3 verify_journey.py",
      purpose: "Runs the Python, SQL and TypeScript checks and prints the JSON result manifest."
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
