## Project Layout

```
CareerForgeMobile/
├── app/                        — Expo Router screens (file-based routing)
│   ├── _layout.tsx             — Root Stack navigator + ProgressShell provider
│   ├── index.tsx               — Student dashboard
│   ├── path.tsx                — Career path progression map
│   ├── lesson/[lessonId].tsx   — 5-step lesson stepper wizard
│   ├── mission/[missionId].tsx — Build mission screen
│   ├── evidence.tsx            — Portfolio evidence submission
│   ├── onboarding.tsx          — Onboarding flow
│   ├── settings.tsx            — App settings
│   ├── readiness.tsx           — Readiness score detail
│   ├── review.tsx              — Spaced-repetition review
│   ├── projects.tsx            — Project tracking
│   └── weekly-plan.tsx         — Weekly plan
│
├── src/
│   ├── domain/                 — Pure domain logic (no React/UI imports)
│   │   ├── types.ts            — Core TypeScript types
│   │   ├── schemas.ts          — Zod validation schemas
│   │   ├── readiness.ts        — Career readiness scoring (0-100)
│   │   ├── progress.ts         — Progress state reconciliation
│   │   ├── role-routing.ts     — Career track routing + sequential locking
│   │   ├── lesson-workflow.ts  — Lesson stepper state machine
│   │   ├── learning-path.ts    — Learning path resolution
│   │   ├── code-run.ts         — Code run attempt processing
│   │   ├── content.ts          — Content pack query helpers
│   │   ├── content-audit.ts    — Content audit functions
│   │   ├── review.ts           — Review/recall event handling
│   │   ├── review-queue.ts     — Spaced repetition scheduling
│   │   ├── mini-project-tester.ts — Mini-project validation
│   │   └── weekly-report.ts    — Weekly report generation
│   │
│   ├── state/                  — React Context state providers
│   │   ├── progress-provider.tsx
│   │   ├── progress-provider.web.tsx
│   │   ├── progress-shell.tsx
│   │   └── progress-shell.native.tsx
│   │
│   ├── storage/                — Persistence layer
│   │   └── progress-store.ts   — Direct SQLite local-first data store
│   │
│   ├── content/                — Curriculum content datasets (TypeScript data)
│   │   ├── seed.ts             — Content pack: assembles tracks, modules, lessons, quizzes, missions
│   │   ├── concepts.ts         — Concept registry (~130+ knowledge nodes)
│   │   ├── roles.ts            — Career path definitions (4 role targets)
│   │   └── python/             — Modular Python curriculum by level
│   │       ├── shared.ts       — Shared helpers (proofLesson, checkpointQuiz, workshop)
│   │       └── level-0.ts through level-7.ts
│   │
│   ├── sandbox/                — Code execution engines
│   │   ├── runner.ts           — Core execution pipeline (Python/Pyodide, SQL/sql.js, TS)
│   │   ├── native-python-proof-runner.ts — Lightweight regex-based offline Python verifier
│   │   ├── native-webview-runner.ts      — WebView-based Pyodide bridge
│   │   ├── diagnostics.ts      — Problem diagnostic builder
│   │   ├── feedback.ts         — Sandbox failure feedback formatting
│   │   └── policy.ts           — Sandbox security policy (blocks fetch, DOM, filesystem)
│   │
│   ├── ui/                     — Reusable UI components
│   │   ├── theme.ts            — Color palette and theme tokens
│   │   ├── primitives.tsx      — Base UI primitives (Button, Card, Panel, etc.)
│   │   ├── code-lab.tsx / .native.tsx / .shared.ts / bridge.tsx — Code Lab editor
│   │   ├── code-terminal.tsx   — Terminal emulator component
│   │   ├── code-problems.tsx   — Problem diagnostic display
│   │   ├── code-walkthrough.tsx — Walkthrough/guided steps
│   │   ├── concept-capsule.tsx — Concept summary capsule
│   │   ├── error-clinic.tsx    — Error clinic component
│   │   ├── guided-edit-list.tsx — Guided edit step list
│   │   ├── syntax-highlighted-editor.tsx — Code editor with highlighting
│   │   ├── onboarding-guard.ts — Onboarding flow guard
│   │   └── accessibility.ts   — Accessibility utilities
│   │
│   └── types/
│       └── sql-js.d.ts         — TypeScript declarations for sql.js
│
├── scripts/                    — DevOps, validation, and content audit tools
│   ├── validate-content.ts     — Schema, prerequisite, and quiz integrity checks
│   ├── report-content.ts       — Deterministic curriculum audit report
│   ├── scan-sandbox-redaction.ts — Code Lab template policy checks
│   ├── python-depth-audit.ts   — Python lesson depth coverage analysis
│   └── copy-sandbox-assets.js  — Pyodide/sql.js WASM asset bundler
│
├── tests/                      — Vitest test suite (19 test files)
├── android/                    — Expo-managed Android native project (auto-generated)
├── app.json                    — Expo app manifest
├── package.json                — npm scripts and dependencies
├── tsconfig.json               — TypeScript config (strict, `@/` → `src/`)
└── vitest.config.ts            — Vitest runner config
```
