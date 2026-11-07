# ProofPath — QA Checklist

---

## 1. Content Integrity

- [ ] npm run validate:content passes
- [ ] No broken skill/concept references
- [ ] Lesson IDs match seed.ts registration
- [ ] Prerequisite graph consistent
- [ ] All proofLesson depth blocks complete

**Pass criteria: 5/5**

---

## 2. Curriculum Audit

- [ ] npm run report:content shows no duplicates
- [ ] No missing curriculum metadata fields
- [ ] No quiz answer position bias

**Pass criteria: 3/3**

---

## 3. Sandbox Policy

- [ ] npm run scan:redaction passes
- [ ] No fetch/network in sandbox templates
- [ ] No DOM mutation in sandbox
- [ ] No filesystem access in sandbox
- [ ] Bracketed/concatenated constructor escape rejected by policy
- [ ] In-process JS fallback removed; fails closed when Worker is unavailable
- [ ] Android WebView disables file-origin cross-access and universal access

**Pass criteria: 7/7**

---

## 4. TypeScript

- [ ] npx tsc --noEmit passes
- [ ] No implicit any

**Pass criteria: 2/2**

---

## 5. Tests

- [ ] npm run test passes
- [ ] Full suite green (exact file/test totals are recorded per CI run, not listed here — see [GitHub Actions](https://github.com/gthgomez/ProofPath/actions))

**Pass criteria: 2/2**

---

## 6. Full Pipeline

- [ ] npm run verify exits 0

**Pass criteria: 1/1**

---

## 7. Lesson Quality

- [ ] Bridge integrity (learnerOwns + checkerOwns non-empty for runnable lessons)
- [ ] usesButDoesNotTeach declared for premature imports
- [ ] Concept capsules reference concepts.ts
- [ ] Exit tickets present

**Pass criteria: 4/4**

---

## 8. Offline

- [ ] App launches without network
- [ ] SQLite persistence works
- [ ] Progress survives app restart
- [ ] Placement state (placedOutLessonIds, placedOutQuizIds) persists in SQLite across reloads

**Pass criteria: 4/4**

---

## 9. Evidence Integrity & Export

- [ ] `tests/evidence-truth.test.ts` passes (fabricated URLs, random hashes, pasted output, genuine Code Lab passes, failing runs, cross-record stitching, duplicates, legacy reclassification)
- [ ] `tests/evidence-export-content.test.ts` passes (lesson evidence, provenance labels, empty/large portfolios, unusual text, hidden-check leakage)
- [ ] Legacy `externally_reproducible` evidence still loads and is remapped, not promoted
- [ ] Markdown/JSON export performs a real download on web and shares packet **text** on native (no named file attachment in this build); clipboard actions are labelled "Copy"

**Pass criteria: 4/4**

---

## 10. Local Workspace Verification

- [ ] `tests/workspace-journey.test.ts` passes (real Python verifier + real `tsc`)
- [ ] Shipped workspace fails but emits a schema-valid manifest
- [ ] Repaired workspace passes and validates as `valid`
- [ ] Deliberately broken project code fails the verifier
- [ ] TypeScript contract drift is caught by `tsc --noEmit`
- [ ] A mismatched workspace hash is rejected as `stale-workspace`
- [ ] CI workflow verifier ignores commented lines (rejecting `# needs: [lint, test]`) and accepts multiline YAML array syntax

**Pass criteria: 7/7**

---

## 11. Sample Lesson Journey

- [ ] `tests/journey-sample-lesson.test.tsx` passes (full journey with no onboarding)
- [ ] Preview explains itself instead of redirecting to onboarding silently
- [ ] Progress survives a reload

**Pass criteria: 3/3**

---

## 12. Android Build (native)

- [x] `npx expo export --platform android` succeeds (2026-10-11)
- [x] `android/gradlew :app:assembleDebug` produces `app-debug.apk` (2026-10-11, `-PreactNativeArchitectures=x86_64`; `:app:assembleStandalone` also builds with the JS bundle embedded)
- [x] Runtime device testing executed where the environment allows — 2026-10-11 on an offline Android 16 x86_64 emulator (WHPX): level-0 Python offline regex runner verified end to end (wrong answer fails instantly with guidance; corrected answer passes in 1 ms; attempt history survives force-stop/reinstall). WebView WASM cold boots (Pyodide, sql.js) exceed the 20 s startup allowance under software rendering — recorded in STATUS.md; physical-hardware timing still pending (see STATUS.md Blockers)

- [x] 2026-11-07: `:app:assembleStandalone` (`-PreactNativeArchitectures=x86_64`, debug-signed) installed on an Android 16 (API 36) x86_64 emulator with KVM, airplane mode on. Offline launch, sample lesson, native Python runner fail→pass, force-stop/relaunch persistence, `ConfirmDialog` cancel, native clipboard copy action, named-file share sheet (`Sharing 1 file` → `proofpath-progress-backup.json`), document picker, and file-picker backup restore (restored draft visible) were exercised. WebView Pyodide/sql.js/TypeScript cold-boot timing and physical hardware remain unverified.

**Pass criteria: 2 required, device step documented either way**

---

## 13. Runtime Truth & Continuity (2026-11-07 campaign)

- [ ] A hidden Python/JS/SQL/TS sentinel is absent from `stdout`, `stderr`, terminal transcript, stored attempt, proof artifact, and Markdown/JSON export (web and native)
- [ ] A run that truncates output and then throws is reported as failed with a bounded error summary
- [ ] Truncation alone is labelled in the output and never converts a failure into a pass
- [ ] Hidden-check counts are zero everywhere (`publicHiddenCheckSummary`), including historical/missing summaries
- [ ] An unexecuted draft survives remount/reload on web (localStorage) and native (SQLite)
- [ ] Reset starter writes a durable tombstone; the old executed snapshot does not return after remount/restart
- [ ] An older async draft save cannot land after a newer edit (per-lesson ordering)
- [ ] `ReviewEvent.assisted` round-trips through SQLite; legacy rows without the column load as unassisted
- [ ] Lesson screen survives the loading → hydrated transition without a hook-count change
- [ ] Exported readiness score/label equal the on-screen role-scoped readiness
- [ ] Workspace bundle download preserves every file path and content
- [ ] The Evidence stepper step requires an explicitly saved portfolio artifact, separate from lesson achievement

**Pass criteria: 12/12 (native SQLite/share items require device evidence)**

---

## 14. Historical Disclosure, Current-Draft Truth & Backup (2026-11-07 continuation)

- [ ] A legacy attempt/proof (no `sandboxDisclosureVersion`) with sentinels in stdout, stderr, diagnostics, transcript, visible names, or messages exports neither the sentinels nor the names in Markdown or JSON
- [ ] Legacy quarantine preserves the grade (`passed`/`score`) and the learner's `codeSnapshot`; repeated normalization is idempotent
- [ ] Fresh runner attempts keep visible output and visible check feedback
- [ ] `clearAll` cannot be followed by a pre-reset save; in-flight writes settle before clearing; a post-reset edit survives
- [ ] “Check passed” appears only when the editor exactly matches the checked snapshot
- [ ] Editing after a pass shows “Unverified changes” while “Lesson passed previously” remains
- [ ] Reset/restored draft never appears as checked until it is re-run
- [ ] Native results are rejected on request-ID, lesson, language, mode, code-snapshot, runtime, timestamp, empty-result, or contradictory-score mismatch
- [ ] A v10 SQLite fixture upgrades to v11 without losing lessons, evidence, attempts, or review rows; assisted is null for legacy and true round-trips
- [ ] A backup round-trip preserves profile, achievements, placement, attempts, evidence, reviews/assistance, reports, and draft/reset state
- [ ] Malformed, wrong-format, newer-version, oversized, and invalid backups are rejected before mutation; restore requires confirmation
- [ ] Native Copy uses the SDK-matched `expo-clipboard` module; web Copy/Download remain functional
- [ ] Real-browser journey passes (`scripts/e2e-web-journey.mjs`): incorrect→fail, corrected→pass, edit→unverified, reload→draft+achievement, downloads verified
- [ ] `npm audit --include=dev` (22: 1 low/11 moderate/10 high) and `npm audit --omit=dev` (18: 1/9/8) are both acknowledged; no forced Expo major upgrade

**Pass criteria: 13/13 (physical-device clipboard/share and SQLite restart still require device evidence)**

---

## 16. Reliability Closure (2026-11-07 continuation)

- [ ] Restore and reset confirmations are real modals on web and native; Escape/cancel changes nothing; confirm fires at most once
- [ ] Restore stages a durable journal; drafts require durable writes; a failed draft or progress write preserves the previous state
- [ ] A process termination between restore stages is recovered deterministically on the next launch
- [ ] Export refuses a backup above the shared import limit instead of producing an unrestorable "complete" backup
- [ ] An imported backup cannot bypass disclosure validation with `sandboxDisclosureVersion`, a passing grade, or an `auto_verified_code_lab` label
- [ ] Imported attempts do not promote durable achievements; imported proofs are labelled "restored from backup" and are self-reported
- [ ] Native results with duplicate IDs, a wrong visible-result count, no visible result, or a non-finite score are rejected
- [ ] Both providers expose `placement` only; placement never awards completion or Code Lab verification
- [ ] Web Python/SQL/JavaScript/TypeScript execute in disposable Workers; timeout terminates and the next run succeeds
- [ ] TypeScript typechecking runs in the Worker and still reports real compiler diagnostics
- [ ] `scripts/e2e-web-journey.mjs` passes: journey, backup download/reset/file import/restore, cancel, invalid input, restored provenance, offline reload
- [ ] `scripts/e2e-runtime-matrix.mjs` passes: Python/SQL/JS/TS, Python and SQL timeout termination, recovery, TypeScript diagnostics
- [ ] `npm run build:web` generates `dist/sw.js`; offline reload and lesson navigation work after installation
- [x] Native file export/import and clipboard behavior were exercised on an Android 16 x86_64 emulator (named share sheet, document picker, file-picker restore, clipboard copy action); physical-hardware behavior remains unverified

**Pass criteria: 14/14 (device rows require device evidence)**

---

## 17. P0 Closure (pre-merge)

- [x] A real-browser cold startup of 6 s (longer than the 4 s lesson timeout) still executes and passes; startup feedback stays distinct from execution feedback
- [x] Python and SQL non-terminating work is terminated; the next run succeeds; no stale passing result is accepted
- [x] Concurrent boot is deduplicated; two pre-boot executions queue and both settle; preload overlap resolves; timeouts/errors reject exactly one request; queued work recovers on a clean Worker
- [x] A progress write that commits but cannot be verified keeps the journal and never leaves new progress paired with old drafts
- [x] Restoration recovers to one coherent old or new state after journal/draft/progress/read/restart failures; ambiguous progress keeps the journal and surfaces an error
- [x] Failed draft imports roll back every attempted write and deletion, including session-memory-only writes; incomplete rollback is reported and the journal is kept
- [x] Offline update: content-hashed versions, all-or-nothing install, failed B preserves working A, repaired B activates, offline Python works on both A and B, old caches removed only after completion
- [x] First-time browser journey from empty storage completes onboarding, path selection, checks, checkpoint, evidence, backup/reset/import, and offline reload
- [x] Workspace browser journey runs the real verifier (fail → repair → pass), saves coherent self-reported evidence, awards the mission after placement, and preserves manifest provenance in the reviewer packet
- [ ] Browser E2E job is hosted CI (blocked: token lacks `workflow` scope)
- [x] Native restore with transaction identity and reset execution verified on the offline emulator; SQL WebView cold start exceeded 24 s under software rendering and is recorded as a limitation

---

## 18. Go / No-Go Gate

**Ship when all items pass.**

- [ ] No proprietary content from SoloLearn/freeCodeCamp/etc
- [ ] seed.ts restructuring passes all validation
- [ ] All Python levels (0-9) pass tsc --noEmit and content validation
