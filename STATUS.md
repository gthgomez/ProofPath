# ProofPath Status

**Last verified:** 2026-09-23
**Status:** active development
**Confidence:** high

## Purpose

Offline-first technical career-readiness and learning app for software engineering students, emphasizing active coding exercises, code sandbox verification, and portfolio deliverables (Proof-First Philosophy).

## Current State

Expo SDK 55 / React Native 0.83 / TypeScript 5.9 application with Expo SQLite local-first persistence, Zod schemas, Pyodide/sql.js WASM sandbox execution, and a 21-file Vitest suite (292 tests). The content pack ships 104 lessons (101 active plus 3 deprecated) across 11 tracks — 71 of the active lessons are Python — with 104 quizzes (380 questions), 15 modules, and 20 portfolio missions, all validated by the `npm run verify` pipeline.

## Verified Capabilities

- Content pack: 11 tracks, 15 modules, 104 lessons (101 active + 3 deprecated Python lessons), 104 quizzes with 380 quiz questions, 160 registered concepts, and 20 proof-required missions (`npm run report:content`).
- Local-first Expo SQLite persistence and offline progress tracking.
- Proof-First 5-step lesson stepper (`Understand` -> `Experiment` -> `Apply` -> `Checkpoint` -> `Evidence`).
- Sandboxes: Pyodide WASM for full Python (WebView), native regex Python fallback for levels 0-1, sql.js WASM for SQL; policy engine blocks fetch, DOM mutations, and filesystem access.
- Content integrity validation suite (`npm run validate:content`, `npm run scan:redaction`).
- Career Readiness Scoring model (0-100) with proof-cap enforcement.
- Vitest suite green: 21 test files, 292 tests (verified 2026-09-23).

## Recent Evidence

- `npm run verify` run on 2026-09-23: integrity validation SUCCESS, sandbox redaction scan passed, `tsc --noEmit` clean, 292/292 tests green.
- `QA_CHECKLIST.md` documents the 9-section automated verification pipeline (`npm run verify`).
- `PROJECT_CONTEXT.md` details TypeScript/RN/Expo stack invariants and content integrity rules.

## In Progress

- Modularizing `src/content/seed.ts` (curriculum data still lives in one large file).
- Enriching SQL and TypeScript sandbox exercises (both tracks currently have thin lesson coverage per `npm run report:content`).

## Blockers

- None currently blocking local development.

## Risks and Unknowns

- WASM execution performance (Pyodide / sql.js) on lower-end mobile devices.
- Future phases (Supabase sync, AI mentor features, app store signing) are approval-gated.

## Verification

- Command: `npm run verify` (runs `validate:content`, `report:content`, `scan:redaction`, `tsc --noEmit`, and Vitest tests).

## Next Actions

1. Keep `npm run verify` green as content changes land.
2. Modularize `src/content/seed.ts` without breaking validation.
3. Enrich SQL and TypeScript sandbox depth toward the Python lesson standard.

## Evidence Sources

- [README.md](./README.md)
- [QA_CHECKLIST.md](./QA_CHECKLIST.md)
