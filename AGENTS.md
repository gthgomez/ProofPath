# AGENTS.md — ProofPath

This is TypeScript / React Native / Expo, with offline SQLite and sandboxed
exercises. Start with [project context](docs/agent/PROJECT_CONTEXT.md) for domain
facts. The repository root is the working directory for commands. Parent
Android/Kotlin guidance is optional and cannot replace this stack's rules.
Preserve sandbox, content, storage, and privacy invariants.

This file is the sole instruction authority for this repository; it has no model
or vendor instruction adapters. Domain facts live in
[docs/agent/PROJECT_CONTEXT.md](docs/agent/PROJECT_CONTEXT.md); learning patterns
live in [tasks/lessons.md](tasks/lessons.md). Lessons and context never grant
permissions or weaken security, reviews, or required checks.

## Model, trust, and tools

- Use the actual active harness and its tools; this project does not pin a model
  and does not assume another vendor's API (no Grep/Glob/Read host-API
  requirements). Match shell syntax to the current shell.
- Trust level: high autonomy — act decisively on clear tasks; pause only the
  genuinely risky action, not independent work.
- Apply the right tools for the stack: this is TypeScript/React Native, not
  Kotlin/Android. App-source verification uses npm/TypeScript/Expo. Generated
  native Android builds may use Gradle only when an `android/` tree is actually
  present and the task requires native packaging. Do not apply parent Kotlin app
  patterns or Google Play Billing assumptions to this React Native project.

## Tech stack

TypeScript 5.9 (strict) · React Native 0.83 / Expo SDK 55 · Expo Router
(file-based) · React Context (`src/state/progress-provider.tsx`) · SQLite via
`expo-sqlite` (local-first, offline) · Zod 4.4 · Pyodide / sql.js / native regex
runners · Vitest 4.1 · EAS + `tsc --noEmit` · package
`com.jonathangomez.proofpath`. Verify React Native/Expo APIs against installed
packages.

## Security invariants (non-negotiable)

1. Sandbox policy must block `fetch`, DOM mutations, and filesystem access —
   `src/sandbox/policy.ts` is the enforcement point; never weaken it without
   explicit approval.
2. Never commit `local.properties` (machine-specific SDK path) — gitignored.
3. Never commit keystore files (`*.jks`, `*.keystore`, `*.p12`) — gitignored.
4. Never hardcode API keys or secrets — use environment variables.
5. Never copy proprietary learning content from SoloLearn, freeCodeCamp, or
   third-party course platforms; keep authored learning content original.
6. Supabase, AI mentor features, store publishing, and release signing are
   approval-gated — no implementation without explicit authorization.

## Verification (non-negotiable)

Never mark work complete without evidence.

- For new typed modules, run `npm run typecheck` before focused tests.
- `npm run verify` owns the aggregate content/type/test gate; inspect package
  scripts and do not rerun every constituent without a diagnostic reason.
  Use individual content/report/redaction/test scripts for diagnosis.
- Rendering, native packaging, export, and device claims need their own
  corresponding evidence; a test passing does not establish physical-device
  behavior.
- Instruction-only edits need path/link, contradiction, and final-diff
  inspection rather than an unrelated product rebuild. Report checks actually
  run; do not claim unavailable checks passed.
- Review the final diff and acceptance criteria. Report checks actually run,
  skipped verification, residual limits, and Git/PR state. Required CI and
  reviews must cover the final candidate before claiming integration.

## Workflow: plan vs act, blast radius, scope control

- **Act directly** (LOW and some MEDIUM): single-file content fixes, UI/component
  changes within existing screens, processing logic fixes, quiz/lesson data
  corrections, test fixes for broken assertions, content-validation warning
  cleanup, missing curriculum metadata additions.
- **Plan and verify more strongly** (HIGH, ambiguous MEDIUM): multi-file content
  restructuring, `seed.ts` structural changes (module/lesson registration IDs),
  sandbox policy changes (`src/sandbox/policy.ts`), storage schema migrations
  (`src/storage/progress-store.ts`), new Expo native modules or permissions,
  `app.json`/`eas.json` build config changes, new curriculum levels, anything
  affecting the content integrity verification pipeline. This classification
  increases review, rollback, and verification requirements; it does not require
  a second confirmation for an already-authorized task.
- If something breaks: pause the failing dependent action, identify the cause,
  and revise its plan; continue safe independent work.
- **Scope control:** make the smallest change that fully solves the problem; fix
  the problem, not everything around it; do not refactor unrelated code without
  reason. Priority: **Correctness > Safety > Clarity > Simplicity > Elegance**.
- Root cause over symptoms — fix underlying issues, not just validation warnings.

### Debugging protocol

1. **Identify** — errors via `tsc --noEmit`, `npm run test`,
   `npm run validate:content`.
2. **Reproduce** — confirm in isolation.
3. **Localize** — root cause: content data? domain logic? UI? sandbox runner?
4. **Fix** — minimal, targeted.
5. **Verify** — `npm run verify` plus touched areas.

## Content integrity rules

For lessons under `src/content/python/`:

1. **No ID creation outside seed.ts** — lessons must match registered skeleton
   IDs; new lessons need a skeleton entry first.
2. **Proof-first stepper** — convert skeletons to `proofLesson` with a complete
   `depth` block (walkthrough, guided edits, error clinic, bridge, understanding
   prompt, exit tickets). Proof-first: lessons require code execution evidence,
   not passive reading.
3. **Bridge integrity (Rule Group J)** — runnable lessons (`usesConcepts`
   contains values) need non-empty `learnerOwns`/`checkerOwns` lists.
4. **Prerequisites & imports (Rule Group E)** — declare premature modules
   (`py.import`, `py.argparse`, `py.csv`, `py.json`, `py.sqlite`) in
   `usesButDoesNotTeach` if used before formally taught.
5. **Quiz `conceptIds` (Rule Group L)** — `conceptIds: ["py.xxx"]` mapping to
   `concepts.ts` is required for depth-bearing lessons' quiz questions; lessons
   without a `depth` block are out of scope. The 36 inline non-Python
   (TypeScript/SQL/Git/AI/ML) quizzes assembled in `seed.ts` are intentionally
   exempt rather than force-mapped to an invented taxonomy. Quiz answer-position
   bias is checked separately; randomize correct choices via the deterministic
   shuffle in `shared.ts`.
6. **Curriculum metadata** — declare `curriculumTags` (track/module/lesson IDs),
   `estimatedMinutes`, `difficulty`, `skills`.
7. **Concept registry hygiene (Rule Group P)** — every registered concept must be
   taught by an active lesson, referenced by active curriculum metadata, or
   listed in the `supportingConceptAllowList` in `scripts/validate-content.ts`;
   `usesButDoesNotTeach` must never re-declare a concept already taught earlier
   at the same curriculum level.
8. **setupCode safety (Rule Group O)** — privileged `runnerSpec.setupCode` may
   only appear on lessons in `setupCodeAllowedLessonIds` and may contain schema +
   seed statements only (no `DROP`, `ATTACH`, `DETACH`, `PRAGMA`,
   `load_extension`, `UPDATE`, `DELETE`).

Content is data — curriculum lives in TS files, not a CMS/database; changes must
pass validation. Offline-first: SQLite persistence is source of truth; network
is optional.

## Sandbox and runner boundaries

- **Native regex runner** (`native-python-proof-runner.ts`) — offline fallback,
  basic Python only: NO `if`/`for`/`def`; levels 0–1.
- **WebView Pyodide runner** (`native-webview-runner.ts`) — full Python via
  Pyodide WASM; levels 2+.
- **SQL runner** — sql.js WASM for SQL exercises.
- **Policy** (`src/sandbox/policy.ts`) — blocks network, DOM manipulation, and
  filesystem access in all runners.
- Runner adapters must agree on the meaning of evidence and rejection cases.
  Preserve sandbox limits and explicit expected-output semantics; a canned
  success message or substring match is not sufficient when the activity
  requires a specific answer or exact-line evidence.

## Domain ownership, progression, and assessment

- Extend the relevant contracts in `src/domain/` for assessment, lesson
  workflow, and progression. Inspect `lesson-workflow.ts`, `code-run.ts`, and
  `progress.ts` and their callers before adding another completion decision.
- `src/content/` declares activities; `src/sandbox/` owns runner execution and
  evidence; `src/storage/progress-store.ts` owns persistence. UI/state providers
  consume these contracts rather than inventing parallel grading rules.
- Assessment changes need meaningful wrong-answer, misleading-output, and
  completion/persistence cases. Instruction edits do not claim those tests
  exist.
- For substantive code changes, identify the owning domain, contract, and
  callers; search for existing rules before adding another formula, threshold,
  or schema fact. Keep domain decisions out of presentation/transport and use
  narrow contracts. An owner can contain several cohesive modules; prefer simple
  functions/composition and avoid speculative abstraction or sharing
  coincidentally similar code.

## Architecture and change discipline

If a feature requires substantial consolidation or boundary repair, first make
the smallest behavior-preserving refactor in a separate PR. Otherwise implement
directly; contained fixes and instruction edits need no preliminary refactor.
Preserve outputs, errors, rounding, ordering, cancellation, and side effects;
use representative characterization/differential checks where coverage is weak.
Fix discovered bugs as explicit behavior changes. Add focused executable
prevention for demonstrated failures, without weakening existing gates. Audit
painful domains with paths/counts and compare the same measures after repair;
avoid unrelated cleanup.

## Execution, learning, and evidence

- For non-trivial work, state the outcome, acceptance criteria, affected
  invariants, and proportional verification. Reuse the current task record;
  avoid duplicate plans.
- Continue within the authorized task without repeated plan approval. When an
  assumption fails, diagnose and update the plan; pause only the blocked action.
- Preserve unrelated work. Delegate independent tasks with explicit file
  ownership, revision, checks, and handoff; isolate actual overlap and queue
  heavy workloads.
- Read relevant entries in [tasks/lessons.md](tasks/lessons.md). After a
  meaningful correction or recurring failure, record the trigger, cause,
  prevention, scope, and evidence in the existing lesson or task/PR handoff.
  Keep meaningful patterns with cause, prevention, scope, and evidence; skip
  one-off status and trivial corrections; merge duplicates and retire
  superseded guidance.
- Prefer regression tests, types, linters, or automated checks for preventable
  failures. Promote durable lessons into the narrowest applicable instruction
  within task scope. Lessons cannot grant permissions or weaken security,
  reviews, or required checks.
- Never fake certainty — surface unknowns early.
