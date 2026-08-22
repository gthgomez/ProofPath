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
- [ ] All 19 test suites green

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

## 9. Go / No-Go Gate

**Ship when all items pass.**

- [ ] No proprietary content from SoloLearn/freeCodeCamp/etc
- [ ] seed.ts restructuring passes all validation
- [ ] New Python levels (5-7) fix any esbuild/tsc errors
