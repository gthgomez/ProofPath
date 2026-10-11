# ProofPath Status

**Last verified:** 2026-10-11
**Final verified main commit:** `7b5cd5d5acc245dad2062d1ef5bf971e79f9b420` (this branch `codex/reliability-native-evidence` sits on top; see Recent Evidence)
**Status:** active development
**Confidence:** high

## Purpose

Offline-first technical career-readiness and learning app for software engineering students, emphasizing active coding exercises, code sandbox verification, and portfolio deliverables (Proof-First Philosophy).

## Current State

Expo SDK 55 / React Native 0.83 / TypeScript 5.9 application with Expo SQLite local-first persistence, Zod schemas, and Pyodide/sql.js WASM sandbox execution. The content pack ships 111 lessons (108 active plus 3 deprecated) across 11 tracks — 71 of the active lessons are Python — with 111 quizzes, 17 modules, and 20 portfolio missions, all validated by the `npm run verify` pipeline.

## Verified Capabilities

- Content pack: 11 tracks, 17 modules, 111 lessons (108 active + 3 deprecated Python lessons), 111 quizzes, and 20 proof-required missions (`npm run report:content`). SQL was deepened to 8 lessons; TypeScript (3) and Git (3, one concept-registered) tracks exist with runnable mini-projects. The tracks currently reported as thin (2 lessons) are AI tools, AI apps, ML, and testing/debugging.
- **Evidence provenance (PR #39):** every evidence item is classified as `auto_verified_code_lab` (ProofPath executed the check), `reproduction_package_supplied`, `manual_verifier_output`, or `manual_note`. `independently_verified` is reserved and never awarded. Legacy persisted `externally_reproducible` rows are remapped on load without being promoted or dropped.
- **Mission proof coherence (PR #39):** repository, revision, check output, README, and artifact requirements must co-occur on one evidence record; only reflection may be a separate linked note. `summarizeMissionProof` separates documentation-complete, verification-supplied, and mission-complete.
- **Readiness provenance weighting (PR #39):** evidence quality is scaled by provenance confidence (1.0 / 0.7 / 0.45 / 0.25), so fully-typed self-reported evidence cannot reach a fully credited score.
- **Local workspaces (PR #40):** the Build tab links to exportable projects (full-stack study tracker; CI-workflow diagnosis). The export is a self-contained JSON file; the generated verifier stamps `ranAt`, exits non-zero on failure, and its manifest is validated against the shipped task version. Evidence saved from a manifest is labelled self-reported — a JSON manifest is a record, not a signature.
- **Portfolio export (PR #41):** the Portfolio screen performs a real file download on web (Markdown/JSON), a share sheet on native, and an explicitly-labelled clipboard copy. The Markdown packet includes lesson and mission evidence with classification, result, command, date, revision, output, and limitations.
- **Sample lesson preview (PR #41):** a new user can complete `lesson-python-zero-first-script` without career-path setup; a preview panel explains saved-on-device progress and routes terminal actions to path setup instead of a silent onboarding redirect.
- Local-first Expo SQLite persistence and offline progress tracking.
- Proof-First 5-step lesson stepper (`Understand` -> `Experiment` -> `Apply` -> `Checkpoint` -> `Evidence`).
- Sandboxes: Pyodide WASM for full Python (WebView), native regex Python fallback for levels 0-1, sql.js WASM for SQL; policy engine blocks fetch, DOM mutations, and filesystem access.
- Career Readiness Scoring model (0-100) with proof-cap enforcement — a transparent practice-progress heuristic (see [docs/engineering/readiness-model.md](./docs/engineering/readiness-model.md)), not a validated hiring or employability prediction.
- Concepts reference + global search (`/concepts`, `/concepts/[conceptId]`, `/search`).

## Recent Evidence

- Campaign PRs merged to `main`: [#39](https://github.com/gthgomez/ProofPath/pull/39) (evidence truth), [#40](https://github.com/gthgomez/ProofPath/pull/40) (full-stack journey), [#41](https://github.com/gthgomez/ProofPath/pull/41) (beginner UX + export). All three had green hosted CI on their final head before merge.
- `npm run verify` on 2026-10-09 at `abbbea1`: content validation SUCCESS, `tsc --noEmit` clean, **47 test files / 455 tests pass**.
- `npx expo export --platform web` and `--platform android` both succeed.
- Android debug APK assembled with Gradle (`:app:assembleDebug`), including CMake native libraries for all ABIs (`android/app/build/outputs/apk/debug/app-debug.apk`).
- **2026-10-11 (branch `codex/reliability-native-evidence`):** `npm run verify` green on Windows — content validation SUCCESS, redaction scan passed, `tsc --noEmit` clean, **48 test files / 458 passed + 1 platform-gated skip (459 total)**. `npx expo export --platform web` exit 0. Android `:app:assembleDebug` and `:app:assembleStandalone` (embedded JS bundle, `-PreactNativeArchitectures=x86_64`) both BUILD SUCCESSFUL; the standalone APK was installed on an offline Android 16 emulator (airplane mode on) and completed onboarding and lesson navigation with no Metro connection.
- **2026-10-11 device runtime finding (fixed):** `canRunNativePythonProof` rejected comment-only verifier checks, so every comment-checked level-0/1 Python lesson — including the sample lesson — silently bypassed the offline regex runner and mounted the WebView Pyodide runner. On the offline emulator that produced three consecutive 24000 ms timeouts (4000 ms limit + 20000 ms startup allowance) before any learner saw feedback. The selection gate now accepts comment-only checks (they execute as no-ops and pass/fail on captured stdout), with a regression test sweeping all runnable level-0 Python lessons. On-device after the fix: the wrong starter answer fails instantly with learner guidance, the corrected `print("first run")` passes in **1 ms**, and attempt history survives force-stop and app reinstall (SQLite persistence).
- **2026-10-11 device runtime residual (open):** on the software-rendered (SwiftShader/WHPX) emulator, WebView WASM cold boots exceed the 20 s flat `NATIVE_RUNTIME_STARTUP_ALLOWANCE_MS` even with the preload handshake in flight — Pyodide 3×24000 ms timeouts pre-fix, and sql.js 1×24000 ms timeout on the SQL joins lesson despite a ready bridge. The timeout path itself behaved correctly (honest feedback, WebView recreated, allowance re-granted on the next attempt). Physical-hardware timing is still required before tuning the allowance (per its documented constraint).

## Rebrand

The CareerForge -> ProofPath rename is complete. Package `proofpath`, `app.json` name/slug, Android `com.jonathangomez.proofpath`, `proofpath.db`, and all runtime strings are updated. `careerforge.db` and `careerforge.progress.v1` remain **only** as `LEGACY_*` migration identifiers in `src/storage/legacy-db-import.ts` and the web progress provider; renaming them would strand existing installs' progress.

## In Progress

- Deepening the remaining thin tracks (AI tools, AI apps, ML, testing/debugging) toward the Python standard — the Git track now has a third, concept-registered lesson.
- Broader device/browser runtime coverage for the sandbox surfaces.

## Blockers

- **Android runtime testing on this host works only through the emulator, and its WebView WASM boots are too slow for the current startup allowance.** The earlier "no virtualization / AVD cannot boot" blocker no longer holds here: WHPX acceleration is usable, the API 36 x86_64 AVD boots, and offline app navigation was exercised. What remains blocked on this host is measuring real cold-boot timings for Pyodide/sql.js/TypeScript inside the WebView (every measured boot exceeded the 20 s allowance under software rendering), so tuning `NATIVE_RUNTIME_STARTUP_ALLOWANCE_MS` and the full TypeScript/SQL pass matrix still need real hardware. They are not substituted with mocked React tests.
- Native Gradle builds require a short checkout path on Windows: CMake object filenames embed the absolute source path, and long worktree names trip the 260-character limit (see `docs` note in the 2026-10-11 branch; keep ProofPath worktrees ≤ ~40 characters).

## Risks and Unknowns

- WASM execution performance (Pyodide / sql.js) on lower-end mobile devices is unmeasured on hardware here.
- The readiness heuristic's weights are design choices, not empirically calibrated.
- Future phases (Supabase sync, AI mentor features, app store signing) are approval-gated.

## Verification

- Command: `npm run verify` (content-integrity stages through `verify:content` — `validate:content`, `report:content`, `scan:redaction` — then `tsc --noEmit`, then Vitest).
- `tests/workspace-journey.test.ts` generates the shipped workspace into a temporary directory, runs its real Python verifier with the real TypeScript compiler, parses the manifest through `validateResultManifest`, and confirms the shipped build fails, the repaired build passes, deliberate breakage fails, and a mismatched hash is rejected as stale.
- `tests/journey-sample-lesson.test.tsx` completes the sample lesson end to end with no onboarding.
- Journey tests disable the Code Lab's wall-clock run-phase padding via `setRunPhaseDelaysOverride(0)` in `tests/setup.ts`; the app's real delays are unchanged.

## Next Actions

1. Keep `npm run verify` green as content changes land.
2. Run the pending Android runtime tests on a device or a KVM-enabled machine.
3. Continue enriching the thin tracks.

## Content Layout

`src/content/seed.ts` assembles the content pack (skills, tracks, modules, missions) and splices in each track's lessons and quizzes. Lesson bodies live per track: `python/level-0.ts` … `level-9.ts` for the 71 Python lessons, and `src/content/<track>/lessons.ts` for the other 30. All builders — `proofLesson`, `workshop`, `checkpointQuiz`, `miniProjectWithTester` — live in `src/content/python/shared.ts`, which despite its directory name serves every track. Exportable project workspaces live in `src/content/workspace-tasks.ts`. See [docs/PROJECT_LAYOUT.md](./docs/PROJECT_LAYOUT.md).

## Evidence Sources

- [README.md](./README.md)
- [QA_CHECKLIST.md](./QA_CHECKLIST.md)
- [docs/PROJECT_LAYOUT.md](./docs/PROJECT_LAYOUT.md)
