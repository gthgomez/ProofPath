# CareerForge Sandbox Production-Quality Roadmap

Status: implementation-control roadmap  
Scope: single-file Code Lab first, then multi-file IDE features later  
Target: beginner-safe, offline, production-style coding workflow for Python, SQL, JavaScript, and TypeScript

This roadmap converts the terminal/sandbox audit into build phases. The target is not a full IDE yet. The target is a credible professional code lab that teaches real habits: edit code, run the file, run checks, inspect stdout/stderr, read diagnostics, fix the smallest thing, and capture proof from verified activity.

## Production-Quality Definition

CareerForge can claim production-style sandbox quality only when all of these are true:

- `Run file` and `Run checks` are separate in data, UI, storage, and progress behavior.
- `Run file` never completes progress and never captures proof.
- `Run checks` is the only Code Lab action that can create verified proof.
- Terminal output is rendered from structured events, not ad hoc strings.
- Terminal results include command, stdout, stderr, phase status, runtime, result status, and exit-style status.
- Phase statuses reflect the actual failure point instead of marking every phase failed after any failure.
- Hidden checks are redacted before terminal rendering, proof capture, copied transcript, storage, and native bridge messages.
- Problems diagnostics are deterministic, line locations are only shown when known, and unknown locations say `Location unknown`.
- Python does not use `compile` language unless a lesson explicitly teaches Python internals.
- TypeScript does not use `typecheck` language unless a real compiler/typechecking pass exists.
- Web/native behavior is covered by parity tests for normalized attempts, diagnostics, redaction, and proof artifacts.

## Phase 0: Baseline Lock

Goal: freeze the current sandbox contract before deeper changes.

Current evidence:

- Contracts exist in `src/domain/types.ts`.
- Runtime helpers exist in `src/domain/code-run.ts`.
- Runtime limits are documented in `docs/sandbox-runtime-limits.md`.
- Verification currently passes with `npm run verify`.

Tasks:

- Record a current baseline screenshot set for web and Android: fresh lesson, Run file pass, Run checks pass, SyntaxError, policy block, hidden-check failure.
- Add a short `docs/sandbox-qa-baseline.md` with device, browser, emulator, and app build details.
- Confirm no Code Lab screen still says Python `compile`.
- Confirm no sandbox phase says TypeScript `typecheck`.

Acceptance criteria:

- `npm run verify` passes.
- Web export passes.
- Baseline screenshots exist.
- Runtime-limits doc matches observed UI wording.

Tests:

- Existing `sandbox-production-workflow.test.ts`.
- Existing `python-runner-parity.test.ts`.
- Manual web/native screenshot QA.

## Phase 1: Integrity Boundary Hardening

Goal: make hidden-check and proof boundaries genuinely safe.

Primary gaps:

- Native WebView runner can post raw hidden `testResults` across the bridge before `normalizeCodeRunAttempt` redacts them.
- Copied output is generated from `formatRunOutput`, not from the canonical terminal transcript.
- Manual evidence can still look similar to auto-verified proof.

Tasks:

- Redact hidden checks inside `src/sandbox/native-webview-runner.ts` before posting `sandbox-result`.
- Add a bridge-safe result shape: visible check results plus `HiddenCheckSummary`.
- Add a canonical transcript formatter that converts `TerminalEvent[]` into copyable text.
- Replace `formatRunOutput` in web/native Code Lab with the canonical transcript formatter.
- Add an evidence trust field or display classification:
  - `auto_verified_code_lab`
  - `manual_verifier_output`
  - `manual_note`
- Keep manual evidence, but never visually equate it with auto-captured Code Lab proof.

Acceptance criteria:

- Raw hidden names/messages/code do not cross the native bridge.
- Raw hidden data does not appear in terminal UI, copied transcript, proof artifact, evidence item, or persisted storage.
- Copied output includes command, stdout, stderr, visible checks, hidden summary, result status, and runtime.
- Manual evidence is labeled as self-reported unless it contains a `ProofArtifact`.

Tests:

- Native WebView hidden-check redaction test.
- Transcript formatter test.
- Proof artifact redaction test.
- Evidence trust-label test.
- Storage round-trip test for redacted proof.

## Phase 2: Real Terminal Semantics

Goal: make terminal behavior teach real CLI concepts, not just terminal-looking output.

Primary gaps:

- `TerminalEvent.result` has result status and runtime, but no exit code.
- `buildTerminalTranscript` currently gives all phases the same final pass/fail status.
- Terminal has no working directory or file context.
- Run history is limited to the latest visible run.

Tasks:

- Extend `TerminalEvent.result` with:
  - `exitCode?: number`
  - `reason?: "success" | "syntax_error" | "runtime_error" | "check_failed" | "timeout" | "policy_blocked" | "runner_error"`
- Add optional terminal context event:
  - `{ type: "context"; cwd: string; file: string; language: RunnerLanguage }`
- Track phase-specific status:
  - syntax/parser failure: parse failed, later phases pending/skipped
  - runtime failure: parse done, execute failed, verify skipped
  - check failure: parse done, execute done, verify failed
  - policy block: policy blocked before parse/execute
- Add a compact run history list for the last 3 to 5 attempts per lesson.
- Show repeated command transcripts without overwhelming mobile users.

Acceptance criteria:

- A failed visible check does not mark parse/execute as failed.
- Timeout displays `timeout`, not a fake `0ms` result.
- Policy block displays as a pre-execution block.
- Passing runs show exit-style success, for example `exit 0`.
- Failed runs show nonzero or blocked status.
- Learners can inspect the latest few attempts.

Tests:

- Phase status tests for pass, syntax fail, runtime fail, check fail, timeout, policy block.
- Terminal event schema validation.
- Terminal renderer tests.
- Run history ordering and truncation tests.

## Phase 3: Diagnostics and Problems Upgrade

Goal: make failures actionable without guessing.

Current baseline:

- `ProblemDiagnostic` supports severity, source, message, beginner explanation, line, column, and confidence.
- `CodeProblems` displays `Location unknown` when location is not known.
- Editor marks known diagnostic lines with `!`.

Tasks:

- Add click/tap-to-line behavior from Problems panel to editor.
- Preserve raw runtime error or traceback separately from beginner explanation.
- Add collapsed traceback rendering:
  - first line visible
  - beginner explanation visible
  - full raw detail expandable/copyable
- Add deterministic parser coverage:
  - Python: SyntaxError, IndentationError, NameError, TypeError, timeout, policy
  - SQL: syntax error, no such table, no such column
  - JavaScript: SyntaxError, ReferenceError, TypeError
  - TypeScript transform/runtime errors, without claiming typechecking
- Add diagnostic source counters in Problems: parser/runtime/check/policy/system.

Acceptance criteria:

- Known line diagnostics can move the cursor/focus to that line.
- Unknown locations never display guessed line numbers.
- Raw traceback is available but not dumped as an overwhelming wall by default.
- Beginner explanation never replaces the raw error; it layers on top.

Tests:

- Problem click-to-line test.
- Python SyntaxError line test.
- Unknown location test.
- SQL no-column/no-table diagnostics.
- JS ReferenceError diagnostics.
- Traceback collapse rendering test.

## Phase 4: Python Gold Path

Goal: make Python the reference implementation for the full single-file workflow.

Tasks:

- Create a Python parity fixture suite for at least:
  - pass
  - wrong output
  - SyntaxError
  - IndentationError
  - NameError
  - TypeError
  - timeout
  - policy block
  - hidden check failure
- Run each fixture through:
  - web/Pyodide runner
  - native Python fallback where supported
  - native WebView Pyodide path where practical
- Document known Pyodide vs native fallback differences in `docs/sandbox-runtime-limits.md`.
- Ensure Python terminal labels stay:
  - `[parse] Checking Python syntax...`
  - `[execute] Running study_session.py...`
  - `[verify] Running lesson checks...`

Acceptance criteria:

- Same normalized `CodeRunAttempt` semantics across web/native for supported cases.
- Python failures create Problems diagnostics and terminal events.
- Python proof artifact is stable, redacted, and storage-safe.

Tests:

- Expanded `python-runner-parity.test.ts`.
- Python proof storage round trip.
- Python hidden failure redaction.
- Native fallback unsupported-feature diagnostic.

## Phase 5: SQL, JavaScript, and TypeScript Parity

Goal: extend the same professional workflow across supported languages without lying about runtime capabilities.

SQL tasks:

- Add SQL fixture tests for pass, syntax error, no such table, no such column, empty rows, hidden-check failure, policy mutation block.
- Add result table formatting that remains readable on mobile.
- Keep phases: prepare database, execute query, verify rows.

JavaScript tasks:

- Add JS fixture tests for pass, SyntaxError, ReferenceError, TypeError, timeout, policy block, hidden-check failure.
- Improve worker/in-process parity.
- Keep phases: parse/prepare, execute, verify.

TypeScript tasks:

- Keep current wording as `transform + run + verify`.
- Add tests that prove `supportsTypecheck === false`.
- Add a real TypeScript compiler phase only if a real compiler/typechecking pass is implemented.
- If implemented later, add a new phase:
  - `[typecheck] Running TypeScript compiler...`

Acceptance criteria:

- Every language has accurate phase labels tied to actual runner behavior.
- No phase claims work that the runtime does not perform.
- Cross-language hidden-check redaction is tested.
- Cross-language proof artifacts share one schema.

Tests:

- SQL parity fixtures.
- JS parity fixtures.
- TS transform/runtime fixtures.
- No-fake-typecheck assertion.

## Phase 6: Evidence and Portfolio Proof Quality

Goal: make Code Lab proof useful for real review while preserving assessment integrity.

Tasks:

- Add proof artifact detail view.
- Show:
  - command
  - run mode
  - language
  - timestamp
  - runtime
  - result
  - visible checks
  - hidden summary
  - code hash
  - optional code snapshot
- Add `lessonVersion` when content versioning exists.
- Add mission linkage where a lesson proof supports a mission.
- Add proof export/copy using canonical transcript.
- Keep full code snapshot optional and size-limited.

Acceptance criteria:

- Failed checks never produce Code Lab proof.
- Passing checks create local evidence automatically.
- Proof details are understandable to a reviewer.
- Hidden content remains redacted in every proof surface.

Tests:

- Proof artifact schema test.
- Evidence display test.
- Mission linkage test.
- Snapshot size-limit test.
- Redacted export test.

## Phase 7: Mobile Terminal Usability

Goal: make terminal and Problems useful on phones, not decorative.

Tasks:

- Add terminal density modes:
  - compact
  - detailed
- Collapse long stdout/stderr/tracebacks with expand controls.
- Add copy buttons for:
  - full transcript
  - stdout only
  - stderr only
  - proof summary
- Improve keyboard overlap handling around editor and run buttons.
- Test large Android font scaling.
- Add sticky run status that does not cover content or navigation bars.

Acceptance criteria:

- Long tracebacks do not push the learner into an unreadable wall of text.
- Text remains readable at large font sizes.
- Buttons remain at least 48dp.
- Terminal copy actions are clear and distinct.

Tests:

- Mobile layout screenshot tests where practical.
- Accessibility/tap target checks.
- Manual emulator QA on Pixel profile.

## Phase 8: Production Monitoring and Regression Gates

Goal: keep sandbox quality from drifting as content and languages grow.

Tasks:

- Add a sandbox fixture runner script that runs all language fixtures.
- Add a redaction scanner that fails if secret hidden strings appear in terminal/proof/copy/storage outputs.
- Add content validation for runner specs:
  - visible tests have safe names/messages
  - hidden tests do not rely on user-visible explanation
  - timeout is within allowed range
  - unsupported language features are flagged
- Add QA checklist for every release.

Acceptance criteria:

- `npm run verify` includes sandbox contract tests.
- Hidden leak scanner is part of verification.
- New lessons cannot introduce unsafe hidden messages into visible surfaces.
- Release checklist includes web/native runner parity.

Tests:

- Hidden secret sentinel tests.
- Fixture runner test.
- Content validator extensions.
- Storage migration test.

## Phase 9: Deferred IDE Features

Only begin after Phases 1 through 8 are stable.

Deferred features:

- File tabs.
- File tree.
- Multi-file execution.
- Project root.
- Package/environment awareness.
- Real command history with rerun.
- Git-like evidence workflow.
- Hover help.
- Debugger concepts.
- Context-aware autocomplete.

Entry criteria:

- Single-file Python gold path is stable.
- Hidden checks are redacted before every boundary.
- Terminal phases and result status are honest.
- Problems panel can guide learners to fixes.
- Proof capture is trusted and reviewer-useful.
- Web/native parity tests are in place.

## Production-Candidate Gate

CareerForge sandbox can move from `SANDBOX` to `PRODUCTION-CANDIDATE` when:

- Phase 1 through Phase 8 are complete.
- `npm run verify` passes.
- Web export passes.
- Android emulator QA passes on a Pixel profile.
- No hidden sentinel string appears in terminal UI, copied transcript, proof artifact, storage, or logs.
- Python, SQL, JavaScript, and TypeScript each have pass/fail/policy fixture coverage.
- TypeScript either has real typechecking or all UI/docs continue to say transform/run/verify.
- Manual evidence and auto-verified proof are visually distinct.

## Anti-Goals

Do not build these early:

- File tabs before terminal/proof contracts are stable.
- TypeScript typecheck labels before real typechecking exists.
- Python compile labels unless teaching Python internals.
- AI-generated diagnostics in MVP.
- Hidden-check hints that reveal edge cases.
- Manual completion or manual proof that looks equivalent to verified Code Lab proof.
- Full IDE branding or production deployment claims.

## Immediate Next Sprint

Recommended first sprint:

1. Redact hidden checks inside the native WebView before posting results.
2. Add canonical transcript formatting from `TerminalEvent[]`.
3. Replace copy output with copy transcript.
4. Add exit-style result status to terminal events.
5. Fix run-file `0% last run` UI.
6. Add phase-specific statuses.
7. Add tests for all six changes.

This sprint directly addresses the highest-risk audit findings without adding premature IDE complexity.
