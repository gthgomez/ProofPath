# Historical Migration Evidence - RALPH-R State

Status: archived historical record.

This file was written when CareerForge Mobile still used the `SoloLearnDup` working name and path. It is retained only for provenance and should not be used as current routing, execution state, or approval authority. Current work belongs in `C:\Workspace\Project_Android\CareerForgeMobile`; use [../README.md](../README.md) for current documentation routing.

GOAL ID: sololearndup-phase0-2026-05-04
GOAL HASH: user-request-2026-05-04-implement-research-docs
DOD HASH: phase0-expo-shell-original-content-validation
STATE VERSION: 1
CREATED AT: 2026-05-04
LAST UPDATED AT: 2026-05-04 11:26:05 -05:00 post-version-pin verification
LAST UPDATED BY SURFACE: Codex local workspace
STATUS: done

## Objective

Implement the first bounded increment from the Deep Research reports: a local-first Expo/TypeScript Android app skeleton for a personal AI-era SWE career-prep app.

## Definition Of Done

- [x] App scaffold exists with Expo Router, TypeScript config, EAS profiles, and no client secrets.
- [x] Screens cover dashboard, learning path, lesson detail, project missions, evidence log, readiness, weekly plan, and settings.
- [x] Original seed content covers Python, TypeScript/Web, SQL/Postgres, Git/GitHub, AI-assisted coding, practical AI apps, and ML foundations.
- [x] Typed content contracts, readiness scoring, content validation, and tests exist.
- [x] Verification commands run and evidence is recorded.

## Execution Envelope

```text
SURFACE: local Codex
MODE: Agent
SANDBOX: workspace-write
APPROVAL POLICY: on-request
NETWORK: denied unless dependency installation requires approval
WRITABLE PATHS: C:\Workspace\SoloLearnDup/**
PROTECTED PATHS: root policy files, workspace memory except required startup reads, auth/RLS/migrations/CI/deploy, secrets, external services
MAX PASSES: 3
CURRENT PASS: 1
MAX CHANGED FILES BEFORE RE-AIM: 30 for initial scaffold
MAX SAME-VERIFIER FAILURES: 2
REVIEW GATE: self-review; no subagents requested
```

## Non-Negotiable Boundaries

- Do not copy proprietary course content from SoloLearn, freeCodeCamp, or any third-party curriculum.
- Do not add Supabase, AI model calls, job scraping, paid APIs, auth, or store deployment in Phase 0.
- Do not put secrets in the app bundle.
- Do not touch root policy files or unrelated workspace files.

## Context Checkpoint

```text
ACTIVE GOAL: implement Phase 0 app skeleton from the two Deep Research reports
DEFINITION OF DONE: see checklist above
NON-NEGOTIABLE BOUNDARIES: local-first, original content only, no backend/AI/job scraping/release actions
CURRENT PASS / MAX PASSES: 1 / 3
LAST VERIFIED STATE: content validation, typecheck, Vitest tests, Expo config parsing, and Expo dependency compatibility check passed
LAST FAILED VERIFIER: none unresolved; initial sandbox spawn and dependency compatibility failures were fixed and re-run
CURRENT HYPOTHESIS: Phase 0 scaffold is complete and ready for Phase 1 local persistence
NEXT CAUSAL INCREMENT: implement local SQLite/progress persistence and interactive completion flows
REVIEW GATE REQUIRED: self-review unless scope expands
STOP CONDITIONS: dependency install blocked, verifier cannot run, scope requires secrets/auth/backend/CI/deploy, or proprietary content is needed
RALPH_STATE PATH: SoloLearnDup/docs/ralph-state/sololearndup-phase0-2026-05-04.md
```

## Changed Files

- SoloLearnDup/.gitignore
- SoloLearnDup/app.json
- SoloLearnDup/babel.config.js
- SoloLearnDup/eas.json
- SoloLearnDup/package.json
- SoloLearnDup/package-lock.json
- SoloLearnDup/tsconfig.json
- SoloLearnDup/vitest.config.ts
- SoloLearnDup/app/_layout.tsx
- SoloLearnDup/app/index.tsx
- SoloLearnDup/app/path.tsx
- SoloLearnDup/app/projects.tsx
- SoloLearnDup/app/evidence.tsx
- SoloLearnDup/app/readiness.tsx
- SoloLearnDup/app/weekly-plan.tsx
- SoloLearnDup/app/settings.tsx
- SoloLearnDup/app/lesson/[lessonId].tsx
- SoloLearnDup/app/mission/[missionId].tsx
- SoloLearnDup/src/content/seed.ts
- SoloLearnDup/src/content/progress.ts
- SoloLearnDup/src/domain/content.ts
- SoloLearnDup/src/domain/readiness.ts
- SoloLearnDup/src/domain/schemas.ts
- SoloLearnDup/src/domain/types.ts
- SoloLearnDup/src/ui/primitives.tsx
- SoloLearnDup/src/ui/theme.ts
- SoloLearnDup/scripts/validate-content.ts
- SoloLearnDup/tests/content-integrity.test.ts
- SoloLearnDup/tests/readiness.test.ts
- SoloLearnDup/docs/ralph-state/sololearndup-phase0-2026-05-04.md

## Last Verifier

```text
COMMAND: npm run validate:content
CWD: C:\Workspace\SoloLearnDup
WHEN: post-patch
EXIT CODE: 0
RESULT: pass
OUTPUT EXCERPT: Validated 7 tracks, 7 lessons, 7 quizzes, and 6 missions.
OUTPUT TRUNCATED: no
TIMESTAMP: 2026-05-04 11:26 -05:00
SKIPPED REASON:
SUBSTITUTE EVIDENCE:
```

```text
COMMAND: npm run typecheck
CWD: C:\Workspace\SoloLearnDup
WHEN: post-patch
EXIT CODE: 0
RESULT: pass
OUTPUT EXCERPT: tsc --noEmit completed with no diagnostics.
OUTPUT TRUNCATED: no
TIMESTAMP: 2026-05-04 11:26 -05:00
SKIPPED REASON:
SUBSTITUTE EVIDENCE:
```

```text
COMMAND: npm test
CWD: C:\Workspace\SoloLearnDup
WHEN: post-patch
EXIT CODE: 0
RESULT: pass
OUTPUT EXCERPT: Test Files 2 passed (2); Tests 4 passed (4).
OUTPUT TRUNCATED: no
TIMESTAMP: 2026-05-04 11:26 -05:00
SKIPPED REASON:
SUBSTITUTE EVIDENCE:
```

```text
COMMAND: npx expo install --check
CWD: C:\Workspace\SoloLearnDup
WHEN: regression
EXIT CODE: 0
RESULT: pass
OUTPUT EXCERPT: Dependencies are up to date
OUTPUT TRUNCATED: no
TIMESTAMP: 2026-05-04 11:26 -05:00
SKIPPED REASON:
SUBSTITUTE EVIDENCE:
```

```text
COMMAND: npx expo config --type public
CWD: C:\Workspace\SoloLearnDup
WHEN: regression
EXIT CODE: 0
RESULT: pass
OUTPUT EXCERPT: name 'CareerForge Mobile'; sdkVersion '55.0.0'; android package 'com.jonathangomez.careerforge'; permissions []
OUTPUT TRUNCATED: no
TIMESTAMP: 2026-05-04 11:14 -05:00
SKIPPED REASON:
SUBSTITUTE EVIDENCE:
```

```text
COMMAND: npm run start -- --host localhost --port 8085
CWD: C:\Workspace\SoloLearnDup
WHEN: local preview
EXIT CODE: running in background
RESULT: pass
OUTPUT EXCERPT: Waiting on http://localhost:8085; Test-NetConnection TcpTestSucceeded=True
OUTPUT TRUNCATED: no
TIMESTAMP: 2026-05-04 11:24 -05:00
SKIPPED REASON:
SUBSTITUTE EVIDENCE:
```

## Open Risks

- Package versions are pinned in `package.json` and `package-lock.json`; `npx expo install --check` reports compatibility.
- APK/AAB build is not part of Phase 0 and remains a later release-hardening phase.
- Demo progress is static; Phase 1 should add local persistence before treating user progress as real state.
