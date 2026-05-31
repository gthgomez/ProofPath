# CareerForge Sandbox Runtime Limits

CareerForge Code Lab is a production-style workflow trainer, not a full IDE and not a deployed production environment. The MVP teaches a focused loop:

1. Edit one file.
2. Run file to inspect output.
3. Read terminal output and Problems diagnostics.
4. Run checks to verify the lesson.
5. Capture proof only from passing checks.

## Shared Rules

- `Run file` executes the learner file and shows output. It never completes progress and never captures proof.
- `Run checks` runs the lesson verifier. Passing checks can complete the Code Lab gate and create a proof artifact.
- Hidden checks may affect pass/fail, but raw hidden messages, expected values, hidden code, and edge cases must stay redacted.
- Terminal transcripts and proof artifacts must consume redacted check data only.
- Canonical copied output is generated from structured terminal events, not ad hoc strings.
- Terminal result events include result status, reason, runtime, and exit-style status when a command ran.
- Policy blocks are shown as pre-execution blocks; skipped phases are intentional and are not fake failures.
- Problems diagnostics should use deterministic parser/runtime/policy signals first, then lesson-authored hints.
- Problems should show line numbers only when known or high-confidence. Otherwise the UI should say `Location unknown`.
- Manual evidence is labeled as self-reported. Only passing `Run checks` proof is classified as auto-verified Code Lab proof.

## Python

Current status:

- Web path uses Pyodide for Python execution.
- Native path can use a local beginner-subset fallback for early proof lessons.
- Native fallback supports simple assignments, strings, numbers, booleans, f-strings with variable interpolation, `str(...)`, `print(...)`, and the assertion forms used by early checks.
- Later Python features should use the fuller runtime path instead of pretending the subset runner supports them.

Terminal phases:

- `[parse] Checking Python syntax...`
- `[execute] Running study_session.py...`
- `[verify] Running lesson checks...`

Do not use a Python `compile` phase label unless a lesson is specifically teaching Python internals.

Known limits:

- No package installation.
- No network access.
- No filesystem writes.
- Web/native error wording can differ, so parity tests should lock the normalized CodeRunAttempt behavior rather than exact raw traceback text.
- Native beginner-subset fallback does not support later Python features; those produce an unsupported-feature diagnostic instead of pretending parity.

Parity expectations now tested:

- Passing first Python proof.
- SyntaxError creates parser diagnostics.
- NameError creates runtime diagnostics.

## SQL

Current status:

- SQL runs against lesson-provided in-memory data.
- Query output is checked against visible and hidden verifier expectations.
- Beginner SQL labs are read-only.

Terminal phases:

- `[prepare] Loading SQLite database...`
- `[execute] Running query.sql...`
- `[verify] Checking result rows...`

Known limits:

- No external database connections.
- Mutation statements are blocked for read-only labs.
- Diagnostics distinguish SQLite syntax, missing-table, and missing-column failures when the runtime message is deterministic.

## JavaScript

Current status:

- JavaScript runs in an offline sandbox using a worker when available, with an in-process fallback for tests/environments without worker APIs.
- Console output is captured as terminal stdout/stderr.

Terminal phases:

- `[parse] Checking JavaScript syntax...`
- `[execute] Running lesson.js...`
- `[verify] Running lesson checks...`

Known limits:

- Network, filesystem, browser storage, host process, constructor escape, and obvious infinite-loop patterns are blocked.
- No package installation.
- Diagnostics cover deterministic SyntaxError, ReferenceError, and TypeError signals first.

## TypeScript

Current status:

- TypeScript is transformed for execution before checks run.
- The sandbox does not run the full TypeScript compiler yet.
- UI should describe this as `transform + run + verify`.

Terminal phases:

- `[prepare] Reading TypeScript source...`
- `[transform] Preparing JavaScript runtime...`
- `[execute] Running lesson.ts...`
- `[verify] Running lesson checks...`

Known limits:

- Do not label sandbox phases as full compiler validation until a real compiler pass exists.
- Type annotations and simple type/interface declarations may be stripped for execution.
- Lessons may still ask students to capture external project command evidence, such as `npm run typecheck`, but that is separate from the current Code Lab sandbox runtime.

## Next Sandbox Priorities

1. Capture the full web and Android screenshot baseline listed in `docs/sandbox-qa-baseline.md`.
2. Keep expanding Python, SQL, JavaScript, and TypeScript fixture parity before adding larger IDE features.
3. Add a real TypeScript compiler pass before any sandbox UI claims full compiler validation.
4. Delay file tabs, file tree, debugger concepts, package awareness, and multi-file execution until the single-file workflow remains stable across run modes and proof capture.
