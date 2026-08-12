# CLAUDE.md — CareerForge Mobile

## Model & Trust Configuration

- **Primary model:** Sonnet 4.6
- **Trust level:** High autonomy — act decisively on clear tasks, pause only for genuine risk
- **Apply the right tools for the stack:** this is TypeScript/React Native, not Kotlin/Android

## Tech Stack

TypeScript 5.9 (strict) · React Native 0.83 / Expo SDK 55 · Expo Router (file-based) · React Context (`src/state/progress-provider.tsx`) · SQLite via `expo-sqlite` (local-first, offline) · Zod 4.4 · Pyodide / sql.js / native regex runners · Vitest 4.1 · EAS + `tsc --noEmit` · package `com.jonathangomez.careerforge`

**No Gradle, Kotlin, Jetpack Compose, or Google Play Billing.** Disregard inherited Android/Kotlin patterns (FileProvider, Play Billing, Gradle, Jetpack Compose) from root workspace docs — they do not apply here.

## Startup Sequence

1. Read this file
2. Read `PROJECT_CONTEXT.md` (directory map + content rules)
3. Read root `PROJECT_CONTEXT.md` for workspace-wide context
4. Read `tasks/lessons.md` if it exists — apply learned patterns

## Project Layout

- Full layout map: [docs/PROJECT_LAYOUT.md](docs/PROJECT_LAYOUT.md)

## Workflow

### Plan vs Act

- **Act directly:** single-file content fixes, UI/Composable changes, processing logic fixes, quiz/lesson data corrections
- **Plan first:** multi-file content restructuring, sandbox/runner changes, schema changes, new curriculum levels, storage migrations
- **If something breaks:** STOP → identify what failed → re-plan. Don't push through.

### Autonomous Execution

**Blast radius:** LOW = single content file, UI component tweak, test fix · MEDIUM = multiple content files, domain logic change, runner modification · HIGH = `seed.ts` restructuring, schema changes, storage migrations, sandbox policy changes, new Expo native modules

**Act without asking** (LOW, some MEDIUM): lesson content fixes (typos, missing fields, quiz answer shuffling) · UI/component changes within existing screens · test fixes for broken assertions · content validation warning cleanup · missing curriculum metadata additions

**Pause and confirm** (HIGH, ambiguous MEDIUM): `seed.ts` structural changes (module/lesson registration IDs) · sandbox policy (`src/sandbox/policy.ts`) · storage schema migrations (`src/storage/progress-store.ts`) · new Expo native modules or permissions · `app.json`/`eas.json` build config changes · anything affecting the content integrity verification pipeline

**Rule:** Fix the problem — not everything around it.

### Verification (Non-Negotiable)

Never mark work complete without evidence. Run: `npx tsc --noEmit`, `npm run validate:content`, `npm run report:content`, `npm run scan:redaction`, `npm run test`, `npm run verify`. Ask: *"Would a senior React Native engineer approve this?"*

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
5. **No Quiz Position Bias (Rule Group L)** — every checkpoint quiz question needs `conceptIds: ["py.xxx"]` mapping to `concepts.ts`; randomize correct choices via the deterministic shuffle in `shared.ts`
6. **Curriculum Metadata** — declare `curriculumTags` (track/module/lesson IDs), `estimatedMinutes`, `difficulty`, `skills`

## Sandbox Boundaries

- **Native regex runner** (`native-python-proof-runner.ts`) — offline fallback, basic Python only: NO `if`/`for`/`def`; levels 0-1
- **WebView Pyodide runner** (`native-webview-runner.ts`) — full Python via Pyodide WASM; levels 2+
- **SQL runner** — sql.js WASM for SQL exercises
- **Policy** (`policy.ts`) — blocks network, DOM manipulation, filesystem in all runners

## Shell Tool Usage

npm/Node tooling, not Gradle. PowerShell for: `npx tsc --noEmit`, `npm run test`, `npm run validate:content`, `git status`/`git diff`, `npx expo start`, `./gradlew assembleDebug` (android/ only). File ops via dedicated tools only — Grep (not `findstr`), Glob (not `ls`/`dir`), Read (not `cat`/`Get-Content`). Bash for POSIX scripts; prefer PowerShell.

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

After corrections or repeated mistakes: update `tasks/lessons.md` with a generalizable rule (what went wrong → why → how to prevent it); review lessons at session start; only log meaningful patterns — skip trivial one-off corrections

## Core Principles

1. TypeScript/React Native project — Kotlin/Android patterns from root workspace docs do not apply
2. Content is data — curriculum lives in TS files, not a CMS/database; changes must pass validation
3. Proof-first — lessons require code execution evidence, not passive reading
4. Offline-first — SQLite persistence is source of truth; network optional
5. Root cause over symptoms — fix underlying issues, not just validation warnings
6. Evidence over assertion — back claims with `npm run verify` output
7. Never fake certainty — surface unknowns early
