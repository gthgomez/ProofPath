# AGENTS.md — ProofPath

ProofPath uses TypeScript, React Native, Expo, offline SQLite, and sandboxed exercises. Read
[project context](docs/agent/PROJECT_CONTEXT.md) for facts. Commands run at the
repo root. Parent Android/Kotlin guidance is optional and cannot replace this
stack's rules. Preserve sandbox, content, storage, and privacy invariants.

Keep repository contributor instructions in this file. [Lessons](tasks/lessons.md)
record learning patterns. Context and lessons cannot grant permissions or weaken
gates.

## Model, trust, and tools

- Use the active harness and shell. Follow the current task's model choice. Act on
  clear tasks and pause only a genuinely risky action. This is React Native/Expo,
  not Kotlin/Android. Use Gradle only for an existing `android/` tree when
  native packaging is in scope; do not import parent Kotlin or Play Billing
  assumptions.

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
- Browser behavior needs browser evidence. `npm run build:web` exports the app
  and generates the offline service worker; `npm run test:e2e` runs the real
  Chromium learner journey and runtime matrix. Unit tests do not establish
  worker execution, service-worker offline behavior, or real backups.
- Rendering, native packaging, export, and device claims need their own
  corresponding evidence; a test passing does not establish physical-device
  behavior.
- Instruction-only edits need path/link, contradiction, and final-diff
  inspection rather than an unrelated product rebuild. Report checks actually
  run; do not claim unavailable checks passed.
- Review the final diff and acceptance criteria. Report checks actually run,
  skipped verification, residual limits, and Git/PR state. Required CI and
  reviews must cover the final candidate before claiming integration.

## Scope and verification by risk

- Act directly on contained content, UI, processing, and test fixes. Use stronger
  planning, verification, rollback, and review for curriculum restructuring,
  `seed.ts` registration IDs, sandbox policy, SQLite schema, Expo native modules or permissions,
  build configuration, new levels, or content-integrity pipeline changes. This
  raises rigor, not approval requirements for authorized work.
- On failure, isolate the dependent action, diagnose, change strategy, and
  continue safe work. Make the smallest root-cause fix; avoid unrelated refactors.
  Prioritize correctness, safety, clarity, simplicity, then elegance.

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
- **Native WebView runner** (`native-webview-runner.ts`) — full Python, SQL,
  JavaScript, and TypeScript on device; results are correlated to the active
  request and shape-validated by the host.
- **Web worker runtime** (`execution-worker.ts`) — disposable, token-correlated
  Workers for Pyodide, sql.js, JavaScript, and the real TypeScript typecheck.
  `terminate()` is the timeout boundary; do not move execution back into the
  page realm or claim a timeout stopped work it only stopped awaiting.
- **SQL runner** — sql.js WASM for SQL exercises (worker on web).
- **Policy** (`src/sandbox/policy.ts`) — blocks network, DOM manipulation, and
  filesystem access in all runners.
- Runner adapters must agree on the meaning of evidence and rejection cases.
  Preserve sandbox limits and explicit expected-output semantics; a canned
  success message or substring match is not sufficient when the activity
  requires a specific answer or exact-line evidence.

## Domain ownership and assessment

`src/domain/` owns workflow, assessment, and progression contracts;
`src/content/` declares activities; `src/sandbox/` executes checks and produces
evidence; `src/storage/progress-store.ts` owns persistence. Inspect contracts and
callers before adding completion rules. Keep domain decisions out of UI and
transport. Assessment changes need wrong-answer, misleading-output, and
completion/persistence cases. Search before adding formulas, thresholds, or
schemas; prefer narrow, simple composition over speculative abstractions.

## Architecture and change discipline

For substantial consolidation or boundary repair, isolate the smallest
behavior-preserving refactor in a separate PR. Implement contained changes directly. Preserve
outputs, errors, rounding, order, cancellation, and side effects; add
characterization checks where coverage is weak. Fix discovered bugs explicitly,
add focused regression prevention, and avoid unrelated cleanup.

## Execution, learning, and evidence

- For non-trivial work, record outcome, acceptance criteria, affected
  invariants, and proportional verification in the existing task record. Reuse
  decisions; continue authorized work without repeated plan approval and pause
  only blocked actions. Preserve unrelated work and isolate real overlap. Give
  delegated work explicit file ownership, revision, checks, and handoff.
- Read relevant [lessons](tasks/lessons.md). Record demonstrated recurring
  failures with trigger, cause, prevention, scope, and evidence; omit one-offs,
  merge duplicates, and retire superseded rules. Prefer executable prevention.
  Lessons never grant permission or weaken gates. Surface uncertainty honestly.
