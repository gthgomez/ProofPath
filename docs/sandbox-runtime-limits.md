# ProofPath Sandbox Runtime Limits

ProofPath Code Lab is a production-style workflow trainer, not a full IDE and not a deployed production environment. The MVP teaches a focused loop:

1. Edit one file.
2. Run file to inspect output.
3. Read terminal output and Problems diagnostics.
4. Run checks to verify the lesson.
5. Capture proof only from passing checks.

## Shared Rules

- `Run file` executes the learner file and shows output. It never completes progress and never captures proof.
- `Run checks` runs the lesson verifier. Passing checks can complete the Code Lab gate and create a proof artifact.
- Hidden checks may affect pass/fail, but raw hidden messages, expected values, hidden code, and edge cases must stay redacted. Neither hidden stdout, hidden stderr, nor hidden failure messages are permitted to leak into learner output, terminal transcripts, or proof artifacts.
- Public hidden-check disclosure policy: ProofPath publishes **no** hidden-check counts, names, messages, expected values, seeds, or internal identities. Grading still uses the full result set internally; every learner-facing summary, persisted attempt, proof artifact, and export carries a zeroed aggregate (`publicHiddenCheckSummary`). This is a product decision, not an authentication claim.
- Both stdout and stderr buffers have an enforced cumulative cap (512 KB) per run to prevent memory exhaustion and UI lockups from runaway print loops. The cap is instantiated fresh per run and enforced across JS, Python, SQL, and error output paths.
- Truncation is never reported as success: a run that hits the cap and then throws is still failed, because execution success is tracked explicitly (`executionError`) independently of whether a buffer retained text. A bounded error summary bypasses the output budget so the failure clue stays visible, and the transcript labels truncated output.
- Terminal transcripts and proof artifacts must consume redacted check data only.
- Canonical copied output is generated from structured terminal events, not ad hoc strings.
- Terminal result events include result status, reason, runtime, and exit-style status when a command ran.
- Learner editor draft code (including unrun typing and edits after a run) is persisted per lesson so work is not lost when switching tabs or reloading the screen.
- A versioned disclosure boundary (`sandboxDisclosureVersion`) distinguishes current, source-sanitized output from legacy records. Attempts or proof artifacts without the marker are quarantined on normalization, load, backup, and export: raw stdout, stderr, diagnostics, and terminal text are withheld, visible result text is neutralized, and the already-computed grade plus the learner's code snapshot are preserved. Ambiguous legacy text is never guessed apart.
- The editor's “Check passed” state requires byte-for-byte equality with the checked snapshot. A previous pass is a separate historical achievement; editing or resetting shows “Unverified changes” until the current draft is re-run.
- Draft clearing is a generation-fenced barrier: saves issued before a reset are dropped, in-flight writes settle before clearing, and edits issued after the reset survive. Native drafts live in `proofpath-drafts.db`; web drafts use localStorage with an in-memory mirror.
- SQL results are formatted through an early 512 KB cap, TypeScript diagnostics are capped (200 formatted errors plus a count), and failure messages are bounded. On web, Python, SQL, JavaScript, and TypeScript all execute in disposable Workers, so a timeout calls `terminate()` and genuinely stops the computation. Runtime/assets boot has its own 45 s allowance and is not charged to the lesson's execution timeout.
- Versioned progress backups (`proofpath-progress-backup` v1) validate before mutation, include drafts and reset tombstones, and require explicit confirmation. Export and import share a measured 20,000,000-character ceiling, so the app never produces a “complete” backup it cannot restore.
- Restore is a verified two-phase replacement, not a sequence of independent writes: it stages a durable recovery journal (old and new draft snapshots plus the old/new progress identities), replaces drafts with per-write durability checks and rollback, replaces progress atomically, then clears the journal. A process termination between stages is resolved deterministically at startup by comparing the persisted progress identity.
- Imported backup records are untrusted input. A disclosure marker, passing grade, `auto_verified_code_lab` label, code hash, or proof identity that arrives inside a document is not evidence that this device executed it. Imported output is quarantined, visible check labels are neutralized, hashes are recomputed from preserved code, attempts are excluded from durable-achievement promotion, and proof-backed evidence is downgraded to self-reported with an explicit “restored from backup” label in the reviewer packet.
- A progress backup is not a reviewer portfolio packet.
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

## Web execution boundary (all languages)

Current status:

- Python (Pyodide), SQL (sql.js), JavaScript, and TypeScript run in dedicated disposable Workers created from a same-origin Blob. The page realm no longer executes learner code or synchronously compiles TypeScript.
- A per-run token correlates each worker message; stale or mismatched messages are discarded. A timeout rejects the pending request, terminates the Worker, revokes the Blob URL, and drops the runtime so the next legitimate run boots fresh.
- Worker startup failure is reported as a startup failure, not as the learner's code timing out. The 45 s boot allowance is separate from the lesson execution timeout.
- Runtime and library assets are same-origin files under `sandbox-assets/`, so execution remains available offline after the browser has cached the assets (the offline shell service worker runtime-caches them on first use).
- Worker memory is reclaimed by termination after a timeout or runner error. Successful runtimes are reused to avoid repeated cold boots.
- In Node-based unit tests, execution intentionally uses the in-process runner so Pyodide/sql.js can be imported directly; the browser path is covered by `scripts/e2e-runtime-matrix.mjs`.

## JavaScript

Current status:

- JavaScript runs in an offline sandbox using Web Workers (or Android WebView on native). Environments lacking Worker/Blob/URL isolation fail closed; in-process execution in the host realm has been eliminated.
- Worker messaging is protected with an unguessable execution `nonce`, private post bindings, and global `postMessage` revocation/shadowing so learner code cannot emit forged passing results.
- Console output is captured as terminal stdout/stderr with a 512 KB cumulative output limit per run. Output limits are reset on every run.
- Native WebView runners require an active matching `requestId`. Results without an active run or with mismatched request IDs are strictly discarded.

Terminal phases:

- `[parse] Checking JavaScript syntax...`
- `[execute] Running lesson.js...`
- `[verify] Running lesson checks...`

Known limits:

- Network, filesystem, browser storage, host process, constructor escape, and obvious infinite-loop patterns are blocked.
- No package installation.
- Diagnostics cover deterministic SyntaxError, ReferenceError, and TypeError signals first.
- Execution stopping boundaries:
  - Native Android: On timeout, the host terminates execution by destroying and recreating the WebView instance (`setWebViewKey`), resetting runtime state and discarding orphaned results via `requestId`.
  - Web JavaScript, TypeScript, Python, and SQL: On timeout, `worker.terminate()` halts the worker thread immediately. The browser E2E matrix verifies non-terminating Python and SQL queries, termination feedback, and successful recovery on the next run.

## TypeScript

Current status:

- TypeScript runs the real compiler (`typecheck`) before execution, then strips annotations for running. On web, the compiler and the standard-library asset load inside the same disposable Worker that runs the file, so a slow or pathological compile cannot block the UI.
- The compiler is bundled offline in `sandbox-assets/typescript/`; no network access is required.
- Checking covers the single learner file against the ES2015 standard library plus a `console` prelude. It is not a project build, `strict` is off, and harness test code is not type-checked.
- UI should describe this as `typecheck + transform + run + verify`.

Terminal phases:

- `[prepare] Reading TypeScript source...`
- `[typecheck] Checking TypeScript types...`
- `[transform] Preparing JavaScript runtime...`
- `[execute] Running lesson.ts...`
- `[verify] Running lesson checks...`

Known limits:

- The `typecheck` phase reflects a real compiler pass; it is still not "full compiler validation" of a project (single file, ES2015 lib, `strict` off).
- Type annotations and simple type/interface declarations are stripped only to prepare code for execution, after the type check has run.
- Lessons may still ask students to capture external project command evidence, such as `npm run typecheck`, but that is separate from the current Code Lab sandbox runtime.

## Editor drafts and exports

- Web editor drafts are stored in `localStorage` under `proofpath.editor_draft.v1.<lessonId>`.
- Native editor drafts are stored in a dedicated `proofpath-drafts.db` SQLite database, separate from progress/evidence/proof data. A reset writes a tombstone so a remount or restart cannot resurrect the last executed snapshot; writes are serialized per lesson so an older save cannot overwrite a newer edit. Clearing local progress also clears drafts.
- Portfolio/workspace/progress export on web downloads a real file with the correct name and content. On native, the app writes a named file to app cache with `expo-file-system` and opens the system share sheet with `expo-sharing`; if file sharing is unavailable it falls back to explicitly-labelled text sharing. The share API cannot distinguish a completed share from a dismissed sheet, so the UI says the sheet closed and tells the learner to choose a destination rather than claiming the file was saved.
- Backup import offers a real file picker on web (a file input whose cancel event resolves) and `expo-document-picker` on native, in addition to the paste field.
- Native request IDs correlate a result with the run that produced it; they are not an authentication mechanism. A forged message emitted from inside the same run remains an architectural trust limitation of the WebView boundary.

## Next Sandbox Priorities

1. Capture the full web and Android screenshot baseline listed in `docs/sandbox-qa-baseline.md`.
2. Keep expanding Python, SQL, JavaScript, and TypeScript fixture parity before adding larger IDE features.
3. Extend the TypeScript compiler pass to cover more than a single file (project/file imports, richer lib targets, `strict`) if lesson content needs it. The compiler pass itself now exists — see below.
4. Delay file tabs, file tree, debugger concepts, package awareness, and multi-file execution until the single-file workflow remains stable across run modes and proof capture.
