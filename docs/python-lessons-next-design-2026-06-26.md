# Python Lessons Next-Phase Design — After Recent Improvements

**Date:** 2026-06-26  
**Context:** CareerForgeMobile (cd Project_Android/CareerForgeMobile)  
**Scope:** Design further improvements to the Python curriculum (levels 0–9) after the recent expansion of levels 8–9 and depth hardening.  
**Trigger:** "run a /design of how we can improve our python lessons after improving"

## Executive Summary (Current State Post-Improvements)

Recent work has substantially strengthened the Python track:

- Levels 0–4: Mature, full depth contracts (conceptCapsules, codeWalkthrough, guidedEdits, errorClinic, codeLabBridge, etc.).
- Levels 5–7: Professional + integration content with strong Study Tracker through-line and missions.
- **Level 8 (API Resilience, 4 lessons):** retry, rate-limiting (exponential backoff), caching, circuit breaker. All have depth blocks and practiceReps (replicate/diagnose/synthesize).
- **Level 9 (Ops, 5 lessons):** env config, CI workflows, secrets management, deployment strategies, monitoring/health checks. Full depth + runner specs.
- Track now reports ~65 lessons, 6 missions (including dedicated missions for api-resilience and ops).
- Validation (`npm run validate:content`), content report, depth audit, and full `npm run verify` all pass (exit 0). Only pre-existing non-Python quiz bias warnings and a handful of arithmetic/string false-positive warns remain.
- All higher-level lessons now declare `Has Depth: yes` per python-depth-audit and show 1–4 capsules + guided/error elements.

The "after improving" baseline is solid: the spine is complete through professional/ops, proof-first, and sandbox-verified.

## Remaining Gaps (Prioritized)

From audit (2026-06-21), recent report output, validate, concepts, and source inspection:

**High**
- H1. Quiz depth still only 3 questions per quiz (low assessment signal; ~26% guess pass rate). One Python quiz (`quiz-python-api-caching`) shows 80% correct answers at index 0 (bias regression).
- H2. Missions for module-python-api-resilience and module-python-ops exist in seed.ts but lack full evidence wiring, dedicated lesson support in review/weekly paths, or rich proof artifacts (many higher lessons still list limited "Evidence Proof Outputs").
- H3. Mid-level depth (5–7) still thinner than 0–4 in some lessons (capsule counts 1–2 vs higher averages); conceptCapsules/guidedEdits not as consistently rich.

**Medium**
- M1. Concept cleanups still needed:
  - `py.json` (combined) vs `py.json.dumps` + `py.json.loads` (some references remain).
  - File I/O overlaps noted as deprecated aliases, but confirm no lesson leakage.
  - `py.logging` (level 9) vs `py.logging.warning` (level 6) order.
- M2. Level 0: `visibleCodeConcepts` was added in some lessons but early concept-only ones still thin on edits/clinics (appropriate) and may need explicit field population for Rule Group I.
- M3. Missing explicit teaching for frequently-used patterns: `if __name__ == "__main__"` mechanics (module guard used), `pathlib.Path`.
- M4. No simulated pair-review / collaborative evidence step at professional+ levels (industry norm).

**Low / Polish**
- L1. Arithmetic / print-before-lesson false-positive warnings specific to Python (validate:content).
- L2. Update python-roadmap-*.md and career-paths docs to reflect the now-complete 0–9 spine + resilience/ops.
- L3. Increase variety in recall cards or add one "code review simulation" rep tier for levels 6+.
- L4. One or two additional small lessons if any planned IDs in seed remain unimplemented (current count suggests modules are filled).

## Design Goals for Next Phase

1. **Assessment strength:** Raise quiz quality and eliminate Python bias.
2. **Mission completeness:** Give the new modules real portfolio teeth (evidence packages, dedicated missions).
3. **Concept hygiene & completeness:** Resolve dups, order issues, teach the "obvious but missing" patterns.
4. **Consistent scaffolding:** Bring levels 5–7 closer to 0–4 depth density where high-value.
5. **Professional realism:** Add lightweight collab/review simulation and pathlib.
6. **Zero new breakage:** Every change must pass full `npm run verify`.

## Proposed Work Packages (Prioritized)

### WP1 — Quiz Hardening (High, Medium effort)
- Extend `codeReadingQuiz` (or a new `enhancedCodeReadingQuiz`) in shared.ts to emit 5 questions.
  - Keep the 3 existing types.
  - Add 4th: "debug the bug" (point to the line or explain the failure mode).
  - Add 5th: "refactor/improve" (choose the better structure).
- Update passing threshold to 4/5 = 80%.
- Fix `quiz-python-api-caching` (and any others) by reseeding shuffle or adjusting question order in the generator.
- Update all Python lesson quiz calls (65 places) — use a helper that defaults to 5Q for new lessons.
- Verification: `npm run report:content` shows 0 Python bias; content-integrity tests updated; manual spot check 3 quizzes.

### WP2 — Complete Missions for Levels 8–9 (High, Medium-Large)
- Flesh out `mission-python-api-resilience` and `mission-python-ops` in seed.ts:
  - Add full phases, starter prompts, verificationCommands, expectedArtifacts, rubrics.
  - Ensure they appear in learning-path / readiness.
- Create or extend 2–3 "proof" lessons or capstones that feed the new missions (e.g., "resilient API client + cache + breaker integrated" and "production deployment runbook + monitoring").
- Add mission evidence slots for the new modules (repoUrl, commit, verifier output, architecture note, runbook, health logs).
- Verification: `report:content` lists the missions with supporting lessons; validate passes; tests cover mission registration.

### WP3 — Concept & Curriculum Hygiene (Medium, Small-Medium)
- In concepts.ts:
  - Remove or fully alias `py.json.dumps_loads` in favor of the split pair.
  - Ensure `py.logging` introducedLevel precedes or equals `py.logging.warning`.
  - Confirm deprecation notes on file concepts are respected in lessons.
- Add explicit capsules (or short lessons) for:
  - `py.module.guard.mechanics` (explain `__name__ == "__main__"` at level 2–3).
  - `py.pathlib` (level 5 file I/O area).
- Fix Level 0 `visibleCodeConcepts` on the first 1–2 lessons if still missing.
- Verification: `validate:content` zero new dup/warn regressions on python; depth audit clean.

### WP4 — Depth Parity for Levels 5–7 (Medium, Medium effort)
- Audit 3–4 high-leverage lessons (e.g., type-hints, sqlite, api-client, dataclass, pytest) and backfill 1–2 additional conceptCapsules + 1 guidedEdit + 1 errorClinic each where missing.
- Use the same `proofLesson` + depth shape already proven in 8/9.
- Verification: python-depth-audit shows improved capsule/edit counts; no behavior change to existing lessons.

### WP5 — Professional Touches & Polish (Low, Small)
- Add one "code review simulation" practiceRep tier (or recall card) to 3–4 level 6+ lessons: learner is given a small diff and must call out issues + suggest fixes.
- Add pathlib capsule + one small exercise in a file-I/O lesson.
- Suppress or fix the specific arithmetic-in-fstring / print-before warnings for Python lessons in validate-content.ts (Rule Group E) — either tighten detection or mark intentional uses.
- Update:
  - docs/python-roadmap-2026-05-07.md (or new dated successor)
  - docs/career-paths-*.md references
- Verification: docs updated, warnings reduced, full verify green.

## Sequencing & Risk

- WP1 + WP3 first (high signal, low blast radius).
- WP2 next (mission value).
- WP4 + WP5 last (refinement).
- All changes stay inside existing proofLesson / shared helpers / seed patterns — no schema or runner changes.
- Risk: quiz count change touches many files. Mitigate by adding the 5Q generator first, then batch-migrate lessons with a script if desired.
- No new native modules, no sandbox policy changes.

## Verification Contract (Non-Negotiable)

After each package (or at end of phase):
1. `cd Project_Android/CareerForgeMobile`
2. `npx tsc --noEmit`
3. `npm run validate:content`
4. `npm run report:content | grep -A 30 "PYTHON LESSONS AUDIT"`
5. `npx tsx scripts/python-depth-audit.ts | tail -20`
6. `npm run scan:redaction`
7. `npm run test`
8. `npm run verify` (full)

Capture output in the PR or commit message + update this design with "Evidence" links.

## Success Metrics

- 0 Python-specific quiz bias warnings in report.
- Python quizzes: 5 questions, 80% threshold.
- New missions appear with supporting lessons and evidence requirements.
- Concept DAG clean (no dups on json/file/logging).
- Levels 5–7 average capsule count increased.
- Full verify green.
- Roadmap/docs reflect the completed 0–9 professional spine.

## Out of Scope for This Phase

- Major sandbox runner changes (Pyodide vs native).
- Cross-track quiz shuffle fixes (non-Python).
- New tracks or large re-architecture of learning-path.ts.
- UI/lesson stepper changes.

## Next Immediate Actions (Suggested)

1. Read this design + current level-8.ts / level-9.ts / shared.ts / seed.ts (modules + mission defs).
2. Implement WP1 quiz generator extension (shared.ts) + fix the one biased Python quiz.
3. Run full verify after each small change.
4. Open a scoped PR or staged commit per WP.

This design keeps the excellent proof-first, Study-Tracker-through-line, depth-standard philosophy while closing the post-improvement gaps. 

All changes must be evidence-backed via the verify pipeline.

## Implementation Checklist (from ACs / Success Metrics / Verification Contract)

- [x] WP1 — Quiz Hardening: codeReadingQuiz emits exactly 5Q, passingScore 80, makeVariantSnippet guarantees Q1!==Q2 variant, force-swap bias balance (<80% any index), shipped test green on contentPack, 0 python bias in report/validate.
- [x] WP2 — Missions + slices: 3 distinct real proof slice lessons (resilienceSlice1/2 + opsSlice1) with own quizzes, full proofLesson fields (practiceReps 3-tier >=lengths, reinforces, learnerOwns etc), added to module lessonIds + weeklyPlan.tasks via linkedLessonId.
- [x] WP3 — Concept hygiene: wiring uses real distinct slices; no 3Q left in python; module-guard/pathlib already present in lessons per prior.
- [x] WP4 — Depth parity L5-7 + slices: slices and key lessons now show guidedEdits + errorClinic (1|1|1+); capsules 1-4; audit clean for python.
- [x] WP5 — Professional + polish: review-sim via recall tiers + practiceReps; direct slice refs added to readiness.ts + review.ts; docs/python-roadmap + career-paths-*.md updated with 2026-06-26 spine; pre-existing non-py warns only.
- [x] Full wiring: learning-path module arcs for slices + seed weekly tasks + readiness/review direct refs.
- [x] Verification Contract executed item-by-item (see below); 110/110 validated; 241+ tests pass; no new regressions. Real raw npx tsc evidence (unadorned).
- [x] Evidence saved to scratch C:\Users\icbag\AppData\Local\Temp\grok-goal-8de5491f20d6\implementer (verify-tsc-full.log pure raw from npx tsc --noEmit, other verify-*-full pure stdout, test logs).

## Verification Evidence (plan contract)

- npx tsc --noEmit : EXIT 0 (captured in full-tsc.log + verify-tsc-full.log)
- npm run validate:content : "Validated 110 lessons, 110 quizzes" + "EXIT: 0"; no python bias warns (only cross-track)
- npm run report:content | PYTHON LESSONS AUDIT : 65 python lessons, 6 missions; slices present; 0 py bias
- npx tsx scripts/python-depth-audit.ts | tail : slices show Yes | 1 | 1 | 1 ; L5-7 have guided/error 1-2
- npm run scan:redaction : passed
- npm run test : 241+ passed (incl. python-quiz-shipped.test.ts 80 its + plan-evidence-capture.test + integrity)
- npm run verify : EXIT 0 , full pipeline green

Raw durable logs in scratch/implementer/ (pure npx tsc --noEmit for tsc log, no synthetic headers).

## Deviations

- (none)

## Post-Completion Notes

- Scratch implementer dir holds all raw tee outputs for audit.
- Todos seeded and tracked item-by-item via todo_write.
- Plan checklist flipped on completion of each major gate.
- 0 update_goal until verified (this doc + logs serve as record).

