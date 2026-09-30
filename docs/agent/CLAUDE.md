# CLAUDE.md — ProofPath

## Model & Trust Configuration

- **Model/tool selection:** use the actual active harness; this project does not pin a model
- **Trust level:** High autonomy — act decisively on clear tasks, pause only for genuine risk
- **Apply the right tools for the stack:** this is TypeScript/React Native, not Kotlin/Android

## Tech Stack

TypeScript 5.9 (strict) · React Native 0.83 / Expo SDK 55 · Expo Router (file-based) · React Context (`src/state/progress-provider.tsx`) · SQLite via `expo-sqlite` (local-first, offline) · Zod 4.4 · Pyodide / sql.js / native regex runners · Vitest 4.1 · EAS + `tsc --noEmit` · package `com.jonathangomez.proofpath`

App-source verification uses npm/TypeScript/Expo, not Kotlin or Compose. Generated
native Android builds may use Gradle only when an `android/` tree is actually
present and the task requires native packaging. Do not apply parent Kotlin app
patterns or Google Play Billing assumptions to this React Native project.

## Startup Sequence

1. Follow repository-root `../../AGENTS.md`; skip already loaded guidance.
2. Read this file and adjacent `PROJECT_CONTEXT.md` for domain facts.
3. From the repository root, read relevant `tasks/lessons.md` entries.
4. Parent workspace and runtime adapters are optional, never absent prerequisites.

## Project Layout

- Full layout map: [docs/PROJECT_LAYOUT.md](../PROJECT_LAYOUT.md)

## Workflow

### Plan vs Act

- **Act directly:** single-file content fixes, UI/component changes, processing logic fixes, quiz/lesson data corrections
- **Plan first:** multi-file content restructuring, sandbox/runner changes, schema changes, new curriculum levels, storage migrations
- **If something breaks:** Pause the failing dependent action, identify the cause, and revise its plan; continue safe independent work.

### Autonomous Execution

**Blast radius:** LOW = single content file, UI component tweak, test fix · MEDIUM = multiple content files, domain logic change, runner modification · HIGH = `seed.ts` restructuring, schema changes, storage migrations, sandbox policy changes, new Expo native modules

**Execute within task authorization** (LOW, some MEDIUM): lesson content fixes (typos, missing fields, quiz answer shuffling) · UI/component changes within existing screens · test fixes for broken assertions · content validation warning cleanup · missing curriculum metadata additions

**Plan and verify more strongly** (HIGH, ambiguous MEDIUM): `seed.ts` structural changes (module/lesson registration IDs) · sandbox policy (`src/sandbox/policy.ts`) · storage schema migrations (`src/storage/progress-store.ts`) · new Expo native modules or permissions · `app.json`/`eas.json` build config changes · anything affecting the content integrity verification pipeline. This classification increases review, rollback, and verification requirements; it does not require a second confirmation for an already-authorized task.

**Rule:** Fix the problem — not everything around it.

### Verification (Non-Negotiable)

Never mark work complete without evidence. For new typed source, run
`npm run typecheck` before focused tests. `npm run verify` owns aggregate content,
type, and test verification; inspect package scripts and do not rerun every
constituent without a diagnostic reason. Rendering, native packaging, and device
claims need their own evidence. Instruction-only edits require path/link and
conflict inspection rather than an unrelated product rebuild.

## Security Invariants (Non-Negotiable)

1. Sandbox policy must block `fetch`, DOM mutations, filesystem — `src/sandbox/policy.ts` is the enforcement point; never weaken without explicit approval
2. Never commit `local.properties` (machine-specific SDK path) — gitignored
3. Never commit keystore files (`*.jks`, `*.keystore`, `*.p12`) — gitignored
4. Never hardcode API keys or secrets — use environment variables
5. Never copy proprietary learning content from SoloLearn, freeCodeCamp, or third-party course platforms
6. Supabase, AI mentor features, store publishing, release signing are approval-gated — no implementation without explicit authorization

## Content Integrity Rules

For lessons under `src/content/python/`:

1. **No ID Creation Outside seed.ts** — lessons must match registered skeleton IDs; new lessons need a skeleton entry first
2. **Proof-First Stepper** — convert skeletons to `proofLesson` with a complete `depth` block (walkthrough, guided edits, error clinic, bridge, understanding prompt, exit tickets)
3. **Bridge Integrity (Rule Group J)** — runnable lessons (`usesConcepts` contains values) need non-empty `learnerOwns`/`checkerOwns` lists
4. **Prerequisites & Imports (Rule Group E)** — declare premature modules (`py.import`, `py.argparse`, `py.csv`, `py.json`, `py.sqlite`) in `usesButDoesNotTeach` if used before formally taught
5. **Quiz `conceptIds` (Rule Group L)** — `conceptIds: ["py.xxx"]` mapping to `concepts.ts` is **required for depth-bearing lessons' quiz questions**; lessons without a `depth` block are out of scope. The 36 inline non-Python (TypeScript/SQL/Git/AI/ML) quizzes assembled in `seed.ts` are intentionally exempt rather than force-mapped to an invented taxonomy. Quiz answer-position bias is checked separately; randomize correct choices via the deterministic shuffle in `shared.ts`
6. **Curriculum Metadata** — declare `curriculumTags` (track/module/lesson IDs), `estimatedMinutes`, `difficulty`, `skills`
7. **Concept Registry Hygiene (Rule Group P)** — every registered concept must be taught by an active lesson, referenced by active curriculum metadata, or listed in the `supportingConceptAllowList` in `scripts/validate-content.ts`; `usesButDoesNotTeach` must never re-declare a concept already taught earlier at the same curriculum level
8. **setupCode Safety (Rule Group O)** — privileged `runnerSpec.setupCode` may only appear on lessons in `setupCodeAllowedLessonIds` and may contain schema + seed statements only (no `DROP`, `ATTACH`, `DETACH`, `PRAGMA`, `load_extension`, `UPDATE`, `DELETE`)

## Sandbox Boundaries

- **Native regex runner** (`native-python-proof-runner.ts`) — offline fallback, basic Python only: NO `if`/`for`/`def`; levels 0-1
- **WebView Pyodide runner** (`native-webview-runner.ts`) — full Python via Pyodide WASM; levels 2+
- **SQL runner** — sql.js WASM for SQL exercises
- **Policy** (`policy.ts`) — blocks network, DOM manipulation, filesystem in all runners

## Shell Tool Usage

Use available tools in the active harness. Commands run from the repository root;
scoped `rg` / `rg --files`, dedicated search, and direct file reads are valid.
Do not require another host's Grep/Glob/Read APIs. Native Gradle commands are only
for an existing generated `android/` tree when required; routine app-source
verification uses the package scripts. Match shell syntax to the current shell.

## Debugging Protocol

1. **Identify** — errors via `tsc --noEmit`, `npm run test`, `npm run validate:content`
2. **Reproduce** — confirm in isolation
3. **Localize** — root cause: content data? domain logic? UI? sandbox runner?
4. **Fix** — minimal, targeted
5. **Verify** — `npm run verify` + touched areas

## Scope Control

- Smallest change that fully solves the problem
- Don't refactor unrelated code without reason
- Priority: **Correctness > Safety > Clarity > Simplicity > Elegance**

## Self-Learning

After corrections or repeated mistakes: update `tasks/lessons.md` with a generalizable rule (what went wrong → why → how to prevent it); review the relevant subset of lessons at session start; only log meaningful patterns — skip trivial one-off corrections

## Core Principles

1. TypeScript/React Native project — Kotlin/Android patterns from root workspace docs do not apply
2. Content is data — curriculum lives in TS files, not a CMS/database; changes must pass validation
3. Proof-first — lessons require code execution evidence, not passive reading
4. Offline-first — SQLite persistence is source of truth; network optional
5. Root cause over symptoms — fix underlying issues, not just validation warnings
6. Evidence over assertion — back claims with `npm run verify` output
7. Never fake certainty — surface unknowns early
