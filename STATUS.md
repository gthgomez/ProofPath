# ProofPath Status

**Last verified:** 2026-10-09
**Final verified main commit:** `abbbea10d820045c10ad3913dba13a2f8d016d2a`
**Status:** active development
**Confidence:** high

## Purpose

Offline-first technical career-readiness and learning app for software engineering students, emphasizing active coding exercises, code sandbox verification, and portfolio deliverables (Proof-First Philosophy).

## Current State

Expo SDK 55 / React Native 0.83 / TypeScript 5.9 application with Expo SQLite local-first persistence, Zod schemas, and Pyodide/sql.js WASM sandbox execution. The content pack ships 110 lessons (107 active plus 3 deprecated) across 11 tracks — 71 of the active lessons are Python — with 110 quizzes, 17 modules, and 20 portfolio missions, all validated by the `npm run verify` pipeline.

## Verified Capabilities

- Content pack: 11 tracks, 17 modules, 110 lessons (107 active + 3 deprecated Python lessons), 110 quizzes, and 20 proof-required missions (`npm run report:content`). SQL was deepened to 8 lessons; TypeScript (3) and Git tracks exist with runnable mini-projects. The tracks currently reported as thin (2 lessons) are Git, AI tools, AI apps, ML, and testing/debugging.
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

## Rebrand

The CareerForge -> ProofPath rename is complete. Package `proofpath`, `app.json` name/slug, Android `com.jonathangomez.proofpath`, `proofpath.db`, and all runtime strings are updated. `careerforge.db` and `careerforge.progress.v1` remain **only** as `LEGACY_*` migration identifiers in `src/storage/legacy-db-import.ts` and the web progress provider; renaming them would strand existing installs' progress.

## In Progress

- Deepening the remaining thin tracks (Git, AI tools, AI apps, ML, testing/debugging) toward the Python standard.
- Broader device/browser runtime coverage for the sandbox surfaces.

## Blockers

- **Android device/emulator testing is not possible in the current environment.** The Android SDK, emulator binary, AVDs, and JDK are present and a native debug APK builds, but there is no `/dev/kvm` and the CPU exposes no virtualization flags, so the x86_64 AVD cannot boot. Runtime device tests (cold/warm Python, SQL, TypeScript on Android) remain pending on real hardware. They are not substituted with mocked React tests.

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
