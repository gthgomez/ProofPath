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

**Pass criteria: 4/4**

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

**Pass criteria: 3/3**

---

## 9. Evidence Integrity & Export

- [ ] `tests/evidence-truth.test.ts` passes (fabricated URLs, random hashes, pasted output, genuine Code Lab passes, failing runs, cross-record stitching, duplicates, legacy reclassification)
- [ ] `tests/evidence-export-content.test.ts` passes (lesson evidence, provenance labels, empty/large portfolios, unusual text, hidden-check leakage)
- [ ] Legacy `externally_reproducible` evidence still loads and is remapped, not promoted
- [ ] Markdown/JSON export performs a real download on web and share on native; clipboard actions are labelled "Copy"

**Pass criteria: 4/4**

---

## 10. Local Workspace Verification

- [ ] `tests/workspace-journey.test.ts` passes (real Python verifier + real `tsc`)
- [ ] Shipped workspace fails but emits a schema-valid manifest
- [ ] Repaired workspace passes and validates as `valid`
- [ ] Deliberately broken project code fails the verifier
- [ ] TypeScript contract drift is caught by `tsc --noEmit`
- [ ] A mismatched workspace hash is rejected as `stale-workspace`

**Pass criteria: 6/6**

---

## 11. Sample Lesson Journey

- [ ] `tests/journey-sample-lesson.test.tsx` passes (full journey with no onboarding)
- [ ] Preview explains itself instead of redirecting to onboarding silently
- [ ] Progress survives a reload

**Pass criteria: 3/3**

---

## 12. Android Build (native)

- [ ] `npx expo export --platform android` succeeds
- [ ] `android/gradlew :app:assembleDebug` produces `app-debug.apk`
- [ ] Runtime device testing executed — **or** documented as blocked when no KVM/device is available (see STATUS.md Blockers)

**Pass criteria: 2 required, device step documented either way**

---

## 13. Go / No-Go Gate

**Ship when all items pass.**

- [ ] No proprietary content from SoloLearn/freeCodeCamp/etc
- [ ] seed.ts restructuring passes all validation
- [ ] All Python levels (0-9) pass tsc --noEmit and content validation
