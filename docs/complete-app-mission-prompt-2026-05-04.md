# Historical Migration Evidence - SoloLearnDup Complete App Mission Prompt

Status: archived historical record.

This file was written when CareerForge Mobile still used the `SoloLearnDup` working name and path. It is retained only for provenance and should not be used as a current mission prompt, routing file, or execution envelope. Current work belongs in `C:\Workspace\Project_Android\CareerForgeMobile`; use [docs/README.md](./README.md) and [career-paths-status-and-plan-2026.md](./career-paths-status-and-plan-2026.md) for current documentation routing.

Use this prompt to run the full SoloLearnDup build as a bounded, phase-gated mission. The mission is not complete until the Android app is implemented, audited, reviewed, APK-tested, and ready for the intended release target.

```text
You are Codex working in C:\Workspace\SoloLearnDup.

MISSION:
Complete the SoloLearnDup Android-first career-prep app from the current verified local MVP slice into a fully built, tested, APK-ready app aligned with:
- C:\Users\icbag\Downloads\deep-research-report (9).md
- C:\Users\icbag\Downloads\deep-research-report (10).md
- C:\Workspace\SoloLearnDup\readme.md
- C:\Workspace\docs\CODEX_RALPH_LOOP.md
- C:\Users\icbag\.codex\skills\ralph-loop\SKILL.md

CURRENT KNOWN STATE:
- Expo + TypeScript + Expo Router app exists.
- Local curriculum seed data exists.
- Local SQLite progress persistence exists.
- Lessons, quizzes/checkpoints, missions, evidence entry, readiness, weekly plan, and settings/reset are implemented as early flows.
- `npm run verify` has passed with content validation, TypeScript, and Vitest.
- EAS preview/production scripts and Android config exist.
- No APK/AAB artifact has been proven.
- No emulator/physical-device install smoke test has been proven.
- Full research-scope app is not done.

OPERATING CONTRACT:
Use a RALPH-style loop for the whole mission and for each phase:
1. Recon: read current code, research docs, current official docs needed for that phase, and previous Ralph state.
2. Aim: define phase-specific done criteria, risks, stop conditions, and verification.
3. Loop: implement only the current approved phase.
4. Prove: run automated checks and any phase-specific manual/device checks that are feasible.
5. Review: audit the implementation against the phase research, app architecture, UX, security, and release criteria.
6. Handoff: write a concise phase report with changed files, verification evidence, known gaps, and next-phase recommendation.
7. Approval Gate: stop and ask the user for approval before starting the next phase.

Do not skip the Approval Gate. Do not claim the app, phase, APK, AAB, release, or device support is done unless the exact verifier evidence exists.

RESEARCH HARDENING RULE:
Before implementing each phase, perform a phase-specific research hardening pass:
- Re-read the two deep research reports for relevant requirements.
- Inspect current app code and tests.
- Check current official/primary documentation for the phase's technologies where versions, APIs, or release rules may have changed.
- Summarize the phase-specific decisions before coding.
- Convert the research into testable acceptance criteria.

Use official/primary sources for technical research whenever possible. For OpenAI, Expo/EAS, React Native, Android, Supabase, SQLite, SecureStore, testing libraries, and Play publishing requirements, verify current docs before relying on memory.

GLOBAL DONE CRITERIA:
The mission is complete only when all of these are true:
- The app implements the agreed research-scope MVP screens and flows.
- Local-first behavior works offline.
- User progress persists after app restart.
- Evidence capture supports portfolio-grade proof, not just notes.
- Readiness scoring reflects lessons, quizzes, projects, evidence, and review cadence.
- Review queue/spaced recall exists and is tested.
- Weekly career report history exists and is tested.
- Role/profile/onboarding path selection exists and is tested.
- Android preview APK is produced.
- APK installs and runs on emulator and at least one physical Android device, or the absence of physical-device proof is explicitly marked as a release blocker.
- No dangerous Android permissions are added without justification.
- No client bundle secrets exist.
- Automated verification passes.
- Release/privacy/security checklist exists.
- Final audit confirms open risks are either resolved or explicitly accepted by the user.

PHASE 0 - Baseline Audit And Mission State
Goal:
Establish exact current state before changing anything.

Research hardening:
- Re-read both deep research reports.
- Read `readme.md`, `package.json`, `app.json`, `eas.json`, app routes, src domain/storage/state code, tests, and docs/ralph-state.
- Check current official Expo/EAS and Android APK/AAB requirements if release claims are being evaluated.

Implementation:
- Do not implement product changes in this phase.
- Create or update a Ralph state file for this mission under `docs/ralph-state/`.

Acceptance:
- Current implemented scope is documented.
- Missing research requirements are listed.
- Next phase is recommended.
- User approval is requested before Phase 1.

PHASE 1 - Product Shell, Onboarding, And Role Path
Goal:
Add the missing product identity and role/profile foundation.

Research hardening:
- Research current Expo Router patterns for onboarding/profile flows.
- Re-read research requirements for role-based path selection and core screens.

Implementation:
- Add onboarding/profile flow.
- Add role target selection, defaulting to the primary path.
- Persist selected role/profile locally.
- Route dashboard/path content from the selected role.
- Ensure the app opens into a real usable experience, not a marketing screen.

Acceptance:
- User can choose/change role target.
- Choice persists after restart.
- Dashboard/path reflect the selected role.
- Unit and screen-level tests cover role/profile state.
- Review verifies UX and data model.
- Stop for approval.

PHASE 2 - Review Queue And Spaced Recall
Goal:
Implement the research-required recall loop.

Research hardening:
- Research spaced repetition/recall implementation patterns appropriate for a local mobile MVP.
- Re-read research lines about retrieval practice, review cadence, and repair tasks.

Implementation:
- Add Review Queue screen.
- Track due reviews for lessons/quizzes/missions.
- Add recall prompts and repair tasks.
- Persist review history locally.
- Reflect review cadence in readiness.

Acceptance:
- Review items become due by deterministic local logic.
- Completing/reopening reviews updates local progress.
- Readiness score incorporates review cadence.
- Tests cover scheduling, completion, and edge cases.
- Review verifies no fake completion loops.
- Stop for approval.

PHASE 3 - Portfolio-Grade Evidence System
Goal:
Upgrade evidence from basic notes/URIs into employability proof.

Research hardening:
- Re-read evidence requirements in the research reports.
- Research mobile-safe file/link evidence capture options with Expo.
- Check security/privacy implications before adding imports or permissions.

Implementation:
- Add structured evidence fields: repo URL, commit hash, test status, screenshot/demo artifact reference, README completeness, deployment link, verifier output, reflection, linked lesson/mission/skill.
- Add validation and useful empty/error states.
- Link evidence to missions, skills, readiness, and weekly reports.
- Avoid dangerous permissions unless explicitly justified and approved.

Acceptance:
- Evidence can prove project work, tests, docs, screenshots/demo, and releases.
- Evidence links to missions/skills.
- Readiness responds to evidence quality.
- Tests cover validation and readiness impact.
- Review verifies no secrets or private data leakage.
- Stop for approval.

PHASE 4 - Weekly Career Report History
Goal:
Turn the weekly plan into a historical employability report.

Research hardening:
- Re-read research requirements for weekly career reporting and proof loops.
- Research local report persistence and export/share patterns if needed.

Implementation:
- Add weekly report generation from progress, reviews, missions, and evidence.
- Store weekly report snapshots.
- Add report history screen/detail.
- Add clear next-week recommendations grounded in local evidence.

Acceptance:
- Weekly report can be generated and revisited.
- Reports are evidence-backed.
- Tests cover report calculations and persistence.
- Review verifies no generic/fake career advice.
- Stop for approval.

PHASE 5 - Normalized Local Data Model
Goal:
Move from one JSON progress row to a sync-ready durable-ID schema.

Research hardening:
- Re-read technical report requirements for normalized durable IDs.
- Research Expo SQLite migration/versioning patterns.
- Inspect current progress JSON and content schema.

Implementation:
- Design normalized local tables for profile, roles, tracks, modules, lessons, quizzes, missions, skills, evidence, reviews, readiness snapshots, weekly reports, and sync metadata placeholders.
- Add migrations from the current JSON row.
- Keep local-first behavior intact.

Acceptance:
- Existing progress migrates safely.
- No user progress is lost in tests.
- Persistence, reset, and seed logic are tested.
- Review verifies schema supports future Supabase sync.
- Stop for approval.

PHASE 6 - UI/UX Hardening And Accessibility
Goal:
Make the app feel complete and usable on target Android viewports.

Research hardening:
- Research current React Native accessibility and testing guidance.
- Inspect app screens on small/medium Android dimensions.

Implementation:
- Polish navigation, loading, empty, error, and disabled states.
- Improve screen density and touch ergonomics.
- Add accessibility labels where useful.
- Ensure text does not overflow on target mobile sizes.

Acceptance:
- Key workflows are ergonomic.
- No obvious text overlap/overflow.
- Screen/component tests or screenshots cover main paths.
- Review verifies mobile UX against research goals.
- Stop for approval.

PHASE 7 - APK Build And Device Smoke
Goal:
Produce and test the Android preview APK.

Research hardening:
- Verify current official Expo/EAS APK guidance.
- Verify current Android sideload/emulator/physical-device smoke expectations.

Implementation:
- Configure EAS if needed.
- Build preview APK.
- Document artifact location and signing profile.
- Install on emulator and at least one physical Android device when available.
- Run offline smoke: launch, onboarding, dashboard, path, lesson, quiz, mission, evidence, review queue, weekly report, settings/reset, kill/restart persistence.

Acceptance:
- APK artifact exists.
- Emulator install/run proof exists.
- Physical-device install/run proof exists, or explicitly blocked.
- Offline and restart persistence are verified.
- No dangerous permissions or secrets are found.
- Stop for approval.

PHASE 8 - Optional Sync/Auth Foundation
Goal:
Add Supabase sync/auth only after the local app is stable and approved.

Research hardening:
- Verify current Supabase + Expo guidance.
- Verify RLS, auth, SecureStore, and client-secret constraints.
- Re-read technical report Phase 4 sync requirements.

Implementation:
- Add auth only if approved.
- Store tokens in SecureStore.
- Add outbox/idempotent sync.
- Add RLS-backed migrations/policies if Supabase is introduced.
- Keep local DB as source of truth.

Acceptance:
- App remains usable offline.
- Sync is idempotent and tested.
- RLS/security policies are documented and reviewed.
- No service-role secrets ship in the client.
- Stop for approval.

PHASE 9 - Optional AI Mentor
Goal:
Add AI coach/mentor only after evidence, review, and security foundations are done.

Research hardening:
- Verify current official OpenAI/API guidance.
- Re-read research requirements for AI coach behavior.
- Define server boundary so secrets are never embedded in the app.

Implementation:
- AI critiques plans, tests, docs, bugs, and evidence.
- AI asks questions and grades evidence rather than simply giving solutions.
- AI outputs must cite local evidence and mark uncertainty.
- No client-side model/API secrets.

Acceptance:
- AI feature is behind a safe server boundary.
- Prompts and outputs are evidence-grounded.
- Tests cover fallback/error states.
- Security review passes.
- Stop for approval.

PHASE 10 - Release Hardening, Docs, And Final Audit
Goal:
Prepare the app as a portfolio/release artifact.

Research hardening:
- Verify current Android/Google Play/AAB requirements if publishing is in scope.
- Re-read report release, privacy, security, and testing requirements.

Implementation:
- Add polished README, architecture notes, test strategy, release checklist, screenshots/demo media references, and known limitations.
- Prepare AAB path if approved.
- Add privacy/data safety/account deletion docs only if applicable.
- Finalize mission state and handoff.

Acceptance:
- README explains setup, architecture, testing, APK/AAB status, and demo flow.
- Release checklist is complete.
- Final automated verification passes.
- Final manual/device smoke evidence is recorded.
- Final audit compares implementation against both research reports.
- User explicitly accepts remaining risks.

FINAL RESPONSE FORMAT AFTER EACH PHASE:
Report findings first if reviewing.
Then provide:
- Phase status: done / partial / blocked
- Changed files
- Verification commands and results
- Research sources checked
- Open risks
- Recommendation for next phase
- Explicit approval request before continuing

STOP CONDITIONS:
- A phase requires secrets, paid external services, publishing, destructive commands, or remote pushes without explicit user approval.
- Official docs contradict the current plan.
- Verification cannot run.
- The app no longer builds or typechecks.
- A change risks user data loss without a migration test.
- Android release/device proof is claimed without an actual artifact and install evidence.
```
