# PROJECT_LAYOUT.md — ProofPath

Canonical directory map. The tree is relative to the `ProofPath/` repo root. Totals below are maintained against `npm run report:content` output.

```
ProofPath/
├── app/                  Expo Router routes (screens)
├── src/                  Application source
│   ├── content/          Curriculum data (TypeScript)
│   ├── domain/           Pure logic (no React, no I/O)
│   ├── sandbox/          Code execution runners + policy
│   ├── storage/          SQLite persistence
│   ├── state/            React progress provider
│   └── ui/               Shared screen components
├── scripts/              Verification and reporting scripts
├── tests/                Vitest suite
├── android/              Expo prebuild (only sandbox-assets are maintained by hand)
├── public/               Web preview static assets
├── assets/               App icon and images
└── docs/                 Documentation (router: docs/README.md)
```

## app/ — Routes (Expo Router, file-based)

Each file is a route. Screens render state; they do not own logic — domain rules live in `src/domain/`, progress in `src/storage/`.

| File | Route | Renders |
| --- | --- | --- |
| `_layout.tsx` | — | Root layout; mounts the progress provider and navigation stack. |
| `index.tsx` | `/` | Dashboard ("Today"): next lesson, weekly focus, path entry points. |
| `path.tsx` | `/path` | Learn screen for the selected path: tracks, modules, lesson list. |
| `lesson/[lessonId].tsx` | `/lesson/[lessonId]` | Proof-First 5-step lesson stepper (Understand → Experiment → Apply → Checkpoint → Evidence). |
| `mission/[missionId].tsx` | `/mission/[missionId]` | Mission detail with evidence/proof requirements. |
| `projects.tsx` | `/projects` | Build screen: portfolio missions for the selected path. |
| `readiness.tsx` | `/readiness` | Career readiness score with proof-cap enforcement. |
| `review.tsx` | `/review` | Review queue of due recall items. |
| `evidence.tsx` | `/evidence` | Portfolio evidence log. |
| `weekly-plan.tsx` | `/weekly-plan` | Weekly practice plan. |
| `onboarding.tsx` | `/onboarding` | Career path selection (first run and re-run). |
| `settings.tsx` | `/settings` | Career path switching without deleting saved work. |

## src/content/ — Curriculum Data

Content is TypeScript data validated by Zod (`npm run validate:content`). No runtime I/O; no lesson IDs outside `seed.ts` registration.

- `seed.ts` — single source of truth: tracks, modules, lessons, quizzes, and missions (11 tracks, 15 modules, 104 lessons, 104 quizzes, 20 missions).
- `roles.ts` — selectable `path-*` career paths and their track membership.
- `concepts.ts` — concept registry (160 concepts) with category, label, and `introducedLevel`.
- `python/level-0.ts` … `level-9.ts` — Python proof lessons grouped by level 0-9.
- `python/shared.ts` — shared Python lesson helpers, including the deterministic quiz answer shuffle.
- `progress.ts` — demo progress fixture for previews and tests.

## src/domain/ — Pure Logic

Pure functions and types only — no React, no storage, no I/O — so everything here runs in Vitest without mocks.

- `types.ts`, `schemas.ts` — shared types and the Zod schemas every content file must satisfy.
- `content.ts` — catalog access over the validated content pack.
- `content-audit.ts` — deterministic per-lesson audit rows (used by `report:content`).
- `role-routing.ts` — path-level proof gates, unlocks, and locked-specialization labels.
- `learning-path.ts` — path/track/lesson progression state.
- `lesson-workflow.ts` — the 5-step lesson stepper state machine.
- `progress.ts` — progress derivation and actions.
- `review.ts`, `review-queue.ts` — review scheduling and the due queue.
- `readiness.ts` — career readiness scoring (0-100) with proof caps.
- `weekly-report.ts` — weekly plan/report derivation.
- `mini-project-tester.ts` — mini-project validation utility, intentionally not wired into the app.
- `code-run.ts` — runner language/mode helpers and runtime capabilities.

## src/sandbox/ — Code Execution

Runners execute learner code offline; `policy.ts` is the security enforcement point.

- `runner.ts` — runner selection and dispatch for a lesson's code runner spec.
- `native-webview-runner.ts` — full Python via Pyodide WASM in a WebView (levels 2+).
- `native-python-proof-runner.ts` — offline regex-based Python fallback (levels 0-1; no `if`/`for`/`def`).
- `policy.ts` — blocks fetch/network, DOM mutations, and filesystem access in all runners. **Never weaken without explicit approval.**
- `diagnostics.ts` — maps runtime errors to learner-facing diagnostics.
- `feedback.ts` — structured pass/fail feedback from runner output (missing output, policy, runtime, timeout, runner failures).

SQL exercises run on sql.js WASM through the same policy.

## src/storage/ — Persistence

- `progress-store.ts` — Expo SQLite local-first persistence and schema migrations. **Schema changes are HIGH blast radius: every change needs a migration.**

## src/state/ — Progress Provider

- `progress-provider.tsx` (`.web.tsx` variant) — React context that loads/saves progress through the storage layer.
- `progress-shell.native.tsx` / `progress-shell.tsx` — platform shells that gate rendering until progress is hydrated.

## src/ui/ — Shared Components

Screen-level building blocks; no curriculum definitions live here.

- `primitives.tsx`, `theme.ts`, `accessibility.ts` — base UI, styling, and a11y helpers.
- `code-lab.tsx` / `code-lab.native.tsx` / `code-lab.shared.ts` + `code-lab-bridge.tsx` — Code Lab editor/runner surface per platform.
- `syntax-highlighted-editor.tsx`, `code-terminal.tsx`, `code-walkthrough.tsx`, `guided-edit-list.tsx` — coding exercise surfaces.
- `concept-capsule.tsx`, `error-clinic.tsx`, `code-problems.tsx` — teaching components.
- `onboarding-guard.ts` — onboarding gate hooks.

## scripts/ — Verification and Reporting

- `validate-content.ts` — Zod + cross-reference integrity validation (`npm run validate:content`).
- `report-content.ts` — deterministic curriculum totals and audit report (`npm run report:content`); the source of truth for every count in docs.
- `scan-sandbox-redaction.ts` — scans sandbox templates for policy violations (`npm run scan:redaction`).
- `python-depth-audit.ts` — Python depth-coverage audit.
- `copy-sandbox-assets.js` — copies Pyodide/sql.js WASM bundles into `android/` and `public/` (runs on postinstall).
- `generate-careerforge-icon.ps1` — icon generation helper (legacy file name).

## tests/ — Vitest Suite

21 test files / 292 tests mirroring domain, sandbox, storage, and content rules. `npm run test` runs them; `npm run verify` is the full gate (validate:content + report:content + scan:redaction + typecheck + test).

## android/app/src/main/assets/sandbox-assets/ — Bundled WASM

Bundled `pyodide/` and `sql.js/` runtimes for offline in-app execution; refreshed by `scripts/copy-sandbox-assets.js`. `public/sandbox-assets/` mirrors them for web preview.

## docs/ — Documentation

Entry point and router: [docs/README.md](./README.md). It separates current product truth from research inputs, sandbox QA evidence, and historical records.
