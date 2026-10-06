# ProofPath Status

**Last verified:** 2026-10-06
**Status:** active development
**Confidence:** high

## Purpose

Offline-first technical career-readiness and learning app for software engineering students, emphasizing active coding exercises, code sandbox verification, and portfolio deliverables (Proof-First Philosophy).

## Current State

Expo SDK 55 / React Native 0.83 / TypeScript 5.9 application with Expo SQLite local-first persistence, Zod schemas, and Pyodide/sql.js WASM sandbox execution. The content pack ships 104 lessons (101 active plus 3 deprecated) across 11 tracks — 71 of the active lessons are Python — with 104 quizzes (380 questions), 15 modules, and 20 portfolio missions, all validated by the `npm run verify` pipeline.

## Verified Capabilities

- Content pack: 11 tracks, 15 modules, 104 lessons (101 active + 3 deprecated Python lessons), 104 quizzes, 160 registered concepts, and 20 proof-required missions (`npm run report:content`).
- Local-first Expo SQLite persistence and offline progress tracking.
- Proof-First 5-step lesson stepper (`Understand` -> `Experiment` -> `Apply` -> `Checkpoint` -> `Evidence`).
- Sandboxes: Pyodide WASM for full Python (WebView), native regex Python fallback for levels 0-1, sql.js WASM for SQL; policy engine blocks fetch, DOM mutations, and filesystem access.
- Content integrity validation suite (`npm run validate:content`, `npm run scan:redaction`).
- Career Readiness Scoring model (0-100) with proof-cap enforcement — a transparent practice-progress heuristic (see [docs/engineering/readiness-model.md](./docs/engineering/readiness-model.md)), not a validated hiring or employability prediction.
- Concepts reference + global search (`/concepts`, `/concepts/[conceptId]`, `/search` plus dashboard shortcuts), backed by `src/domain/reference.ts` (concept index with alias normalization and ranked search).
- Vitest suite green — current totals live in CI, not in prose. Latest observed hosted `main` run: [Actions run 36518059784](https://github.com/gthgomez/ProofPath/actions/runs/36518059784) (2026-09-29 snapshot, HEAD `055c57f`, 361 tests in 27 files). Test counts change with every commit; do not copy them here.

## Recent Evidence

- `npm run verify` run on 2026-09-23: integrity validation SUCCESS, sandbox redaction scan passed, `tsc --noEmit` clean, Vitest suite green (exact test totals for that dated run are recorded in its CI artifact, not duplicated here).
- `QA_CHECKLIST.md` documents the 9-section automated verification pipeline (`npm run verify`).
- `docs/agent/PROJECT_CONTEXT.md` details TypeScript/RN/Expo stack invariants and content integrity rules.

## Rebrand

The CareerForge -> ProofPath rename is complete. Package `proofpath`, `app.json` name/slug, Android `com.jonathangomez.proofpath`, `proofpath.db`, and all runtime strings are updated. `careerforge.db` and `careerforge.progress.v1` remain **only** as `LEGACY_*` migration identifiers in `src/storage/legacy-db-import.ts` and the web progress provider; renaming them would strand existing installs' progress.

## In Progress

- Modularizing `src/content/seed.ts` (3747 lines; curriculum data still lives in one large file).
- Enriching SQL and TypeScript sandbox exercises — `report:content` shows `track-typescript` at 3 lessons and `track-sql` at 2, against 71 for `track-python`.

## Blockers

- None currently blocking local development.

## Risks and Unknowns

- WASM execution performance (Pyodide / sql.js) on lower-end mobile devices.
- Future phases (Supabase sync, AI mentor features, app store signing) are approval-gated.

## Verification

- Command: `npm run verify` (runs the three content-integrity stages through the single-process `verify:content` runner — `validate:content`, `report:content`, `scan:redaction` — then `tsc --noEmit` with incremental build info cached in `node_modules/.cache`, and Vitest tests).
- Journey tests need testing-library's `asyncUtilTimeout` raised above the 1000ms default (configured in `tests/setup.ts`) because the Code Lab pads runs with real timers. Do not lower it without re-running the full suite several times.

## Next Actions

1. Keep `npm run verify` green as content changes land.
2. Modularize `src/content/seed.ts` without breaking validation.
3. Enrich SQL and TypeScript sandbox depth toward the Python lesson standard.

## Evidence Sources

- [README.md](./README.md)
- [QA_CHECKLIST.md](./QA_CHECKLIST.md)
- [docs/PROJECT_LAYOUT.md](./docs/PROJECT_LAYOUT.md)