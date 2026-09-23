# ProofPath Audit & In-Depth Comparison vs W3Schools

**Date:** 2026-09-23 · **Repo:** `main` @ `19068e1` (clean tree) · **Method:** full repo audit (architecture, `npm run report:content`, content files, tests) + live W3Schools site walkthrough (homepage, Python tutorial/lesson/reference/exercise/quiz pages, editors directory, campus/certificates store).

---

## 0. Verdict in one paragraph

ProofPath and W3Schools are near-opposite answers to the same question — "how should a beginner learn to code?" W3Schools is a **free, ad-supported reference-first library**: ~45+ topics, thousands of skimmable pages, an optional ungraded "Try it Yourself" editor, and paid certificates at the exit. ProofPath is a **depth-first proof engine**: 104 lessons across 11 tracks (68% Python), every one of which requires runnable, auto-graded code (visible + hidden tests), a quiz, and portfolio evidence before it counts as complete. ProofPath's per-lesson pedagogy, assessment integrity, and retention machinery are **a generation beyond anything on W3Schools' free surface**; W3Schools' breadth, reference depth, zero-friction access, and lookup ergonomics are **unmatched by ProofPath and mostly unbuilt there**. The biggest ProofPath risks are concentration (10 of 11 tracks are thin) and first-run friction, not pedagogy.

---

## 1. ProofPath as it stands today

### 1.1 Architecture

| Aspect | Detail |
|---|---|
| Stack | Expo SDK 55, React Native 0.83.6, React 19.2, TypeScript 5.9 strict, Zod 4.4 |
| Navigation | expo-router, single stack, 11 routes; no tabs/drawer |
| Persistence | expo-sqlite (WAL, ~30 tables, `DATABASE_VERSION = 10`), localStorage web fallback; fully offline-first, zero network SDKs |
| Code execution | Pyodide (Python WASM) in web/WebView; sql.js for SQL; type-stripping transform for TS; regex-based native Python fallback (assignments only) |
| Policy engine | `src/sandbox/policy.ts` — comment/string-stripped regex rules per language; blocks network, eval, fs, subprocess, DOM, infinite loops; 20k-char cap; documented as *not* an adversarial runtime |
| Tests | 22 Vitest files, ~184 cases: content invariants, sandbox policy obfuscation resistance, runner behavior, product logic; `npm run verify` = content validation → audit report → redaction scan → `tsc --noEmit` → tests; CI adds a web export |

### 1.2 Curriculum inventory (authoritative, from `npm run report:content`)

**11 tracks · 15 modules · 104 lessons (101 active) · 104 quizzes · 380 quiz questions · 20 missions · 160-concept registry.**

| Track | Lessons | Missions | Depth block? |
|---|---|---|---|
| Python Fundamentals | **71** | 6 | Yes (all 71) |
| Secure Software | 6 | 1 | No |
| Data Systems | 5 | 1 | No |
| Cloud Platform Basics | 4 | 1 | No |
| TypeScript and Web | 3 | 2 | No |
| SQL and Postgres | 2 | 2 | No |
| Git and GitHub | 2 | 1 | No |
| AI-Assisted Coding | 2 | 2 | No |
| Testing and Debugging | 2 | 1 | No |
| Practical AI Apps | 2 | 2 | No |
| ML Foundations | 2 | 1 | No |

The project's own audit script warns six tracks are "thin." The Python track itself is strong: `module-python-core` alone is 43 micro-lessons in a deliberate arc (files/terminal → types/strings/lists/dicts → control flow → a "Study Tracker" project thread → functions → a debugging arc (traceback, NameError/TypeError/ValueError, debugger, assert) → files/CLI/pytest/packaging), then levels 6–9 (professional tooling, a SQLite-backed dashboard app, API resilience with `FakeClient` doubles, ops/CI simulated in JS). Avg lesson ≈ 10 min; avg `bodyMarkdown` ≈ 46 words — exposition lives in structured fields (concept capsules, annotated walkthroughs, error clinics), not prose walls.

### 1.3 Lesson anatomy (the 5-step Proof-First stepper)

1. **Understand** — summary, concept capsules (definition / mental model / syntax shape / tiny example / common mistake / repair hint), annotated code walkthrough ("learner should be able to say…"), worked example.
2. **Experiment** — run starter snippets in the sandbox; tiered practice reps (replicate → diagnose → synthesize).
3. **Apply (Code Lab)** — edit code; `Run file` (inspect) vs `Run checks` (graded: visible + hidden tests). Passing checks is the *only* way to complete the mini-project.
4. **Checkpoint** — quiz (locked until project passes) + recall cards. Quizzes are code-reading quizzes (predict mutated output, debug, refactor), Fisher–Yates shuffled, one-miss-tolerant.
5. **Evidence** — log repo URL, commit hash, verifier output, reflection; auto-prefilled from a passing run.

On top: SM-2-like spaced repetition (`review.ts`, intervals 1/3/7/14/30 days), placement tests (unlock navigation, flagged `placed-out`, never inflate readiness), and the **Career Readiness Score** (lessons 10 + quizzes 10 + projects 40 + evidence hygiene 30 + review cadence 10; hard-capped at 59 without projects, 69 without evidence).

### 1.4 Issues found in this audit

**Resolution note (2026-09-23, later same day):** issues 1–4 below were fixed by a 3-agent remediation wave (full `npm run verify` green afterward: 23 test files / 313 tests). Rebrand completed (package `com.jonathangomez.proofpath`, `proofpath.db` with ATTACH-based legacy-data import, `window.ProofPathSandbox` bridge, `proofpath checks` verifier command, migrated storage keys); stale docs corrected against `report:content`; `docs/PROJECT_LAYOUT.md` created; Code Lab now shows an "intentionally unfinished starter" notice on scaffold lessons and `lesson-python-zero-first-script` ships a one-line-fix starter. Issues 5–7 remain open product decisions.

| # | Issue | Evidence |
|---|---|---|
| 1 | **Incomplete rebrand**: package `careerforge-mobile`, `app.json` "CareerForge Mobile", Android package `com.jonathangomez.careerforge`, DB `careerforge.db`, runtime strings "Loading CareerForge" / `eyebrow="CareerForge Mobile"` | `package.json`, `app.json`, `app/_layout.tsx:33`, `app/index.tsx:62`, `src/state/progress-shell.native.tsx` |
| 2 | **Stale docs**: `docs/career-paths-current-curriculum-2026.md` says 63 lessons/63 quizzes/18 missions vs actual 104/104/20; `QA_CHECKLIST.md:50` says "19 test suites" vs actual 22 files | docs/ |
| 3 | **Missing referenced doc**: `CLAUDE.md` and `PROJECT_CONTEXT.md` both point to `docs/PROJECT_LAYOUT.md`, which doesn't exist | docs/ |
| 4 | **Concentration risk**: 10 of 11 tracks are 2–6 token lessons with no depth block, 1–2-sentence bodies, and (for TS) a paste-based tester rather than a sandbox verifier. The catalog *looks* broad but only Python is real. | `report:content` warnings, `seed.ts` |
| 5 | **Fail-by-design starters may read as breakage**: ~34 of 101 active lessons ship TODO starters that fail `Run checks` until implemented (levels 0–9, including "Running Your First Script" early in the path). Intentional and harness-complete, but a first-run learner hits a failing red state within minutes. | `src/content/python/level-*.ts` |
| 6 | **Levels 8–9 are simulations**, disclosed in-app but worth tracking: level 9 "ops" lessons run JavaScript stand-ins; level 8 uses `FakeClient` doubles. | `level-9.ts:835` |
| 7 | **No search, no reference, no dark mode, no notifications** — fine for v1, but all are table stakes against any consumer comparison. | repo-wide |

---

## 2. W3Schools anatomy (as observed 2026-09-23)

- **Scope:** ~45 topics in the top nav ("and 40+ more" in the picker): the web trio, Python, SQL, Java, C-family, Git, data science (NumPy/Pandas/SciPy), AI/Gen AI, DSA, cybersecurity, Excel, tools. Free tutorials since 1999.
- **Four pillars:** Tutorials → References → Exercises → Certificates, plus services (Spaces hosting, Plus subscription, Practice, Academy for institutions, the "Adventure" gamified app).
- **Tutorial structure:** one linear chapter tree per language (Python: 13 groups — 35 core pages, OOP, file handling, NumPy/Pandas/SciPy/Django, Matplotlib, Machine Learning, DSA, MySQL, MongoDB, then Reference/How-To/Examples). **No level labels, no prerequisites, no enforced order** — pure prev/next chaining plus a persistent sidebar.
- **Lesson anatomy:** H1 → short H2 sections of one-paragraph + bullets → an "Example" block with **"Try it Yourself »"** → prev/next → links to exercises, quiz, video, reference. The Python Intro lesson contains exactly one runnable example (`print("Hello, World!")`). Prose is deliberately minimal and skimmable.
- **Tryit editor:** separate environment, split editor/result panes, Run button, filename tabs; covers 8 front-end editors and 20+ backend compilers/interpreters (Python, SQL, Java, PHP, C/C++/C#, R, Node, Rust, Kotlin, Go, Bash, Swift, Ruby, Julia…). **Optional and ungraded** — nothing checks your output.
- **Exercises (Python):** 108 total, multiple-choice + fill-in-the-blank, 3–9 per topic, "Show Answer" escape hatch, XP/streak/League gamification behind a free login. Free.
- **Quiz:** 25 MCQs, untimed, 1 point each, explicitly "not official," no explanations, separate from certification.
- **References:** hub → per-category pages (built-ins, string/list/dict methods, keywords, exceptions, glossary, module refs) — a genuine lookup surface ProofPath has no equivalent of.
- **Monetization:** ads + "Remove ads" Plus upsell; certificates via campus store — $95/course or standalone exam, bundles $190–$285, "Full Access" $499, 70+ certifications, "skip the course and go straight to the exam," marketed as LinkedIn/CV credentials.
- **Known reputation:** long-standing (W3Fools-era, 2011, retired ~2014) criticism for shallow, sometimes outdated content that historically outranked official docs (MDN) on SEO; consensus view since: a fine gentle on-ramp, not a reference of record.

---

## 3. Head-to-head

### 3.1 Product thesis

| | W3Schools | ProofPath |
|---|---|---|
| Core bet | Coverage + instant access: look anything up, copy a working snippet, move on | Depth + proof: you haven't learned it until code passes tests and evidence exists |
| Completion | Self-declared; nothing stops you skipping everything | Enforced by state machine: project checks + quiz gate each lesson |
| What you leave with | familiarity (and, for $95, a certificate) | a graded run history, portfolio evidence items, weekly reports |

ProofPath's README explicitly defines itself against the W3Schools/SoloLearn model ("no free completion… ProofPath rejects this model"). The comparison shows that rejection is *implemented*, not just marketed.

### 3.2 Lesson experience, step by step

| Moment | W3Schools | ProofPath |
|---|---|---|
| Arrive at topic | Sidebar chapter; jump anywhere instantly | Sequential path with locks; placement tests to skip |
| Read | 1–2 short paragraphs + bullets (~100–300 words/page) | 46-word body + structured capsules/walkthrough/error clinic (more *teaching scaffolding*, less prose) |
| First code | "Try it Yourself" opens editor; run is ungraded, ~5 seconds | Experiment reps run in-sandbox; Code Lab checks are graded with hidden tests |
| Check understanding | Optional; 25-question quiz at chapter end, no explanations | Locked checkpoint quiz per lesson (code-reading, mutated-output prediction) + recall cards |
| Retention | Nothing systematic (XP streak is engagement, not memory) | SM-2 spaced repetition queue feeding the readiness score |
| Proof of work | Paid certificate | Evidence log + readiness score capped without real projects |

### 3.3 Where W3Schools genuinely wins

1. **Breadth**: 45+ live topics vs 11 tracks where 1 is deep. A beginner asking "what is SQL" gets a real answer on W3Schools and a 2-lesson taste on ProofPath.
2. **Reference/lookup**: full method references per language. ProofPath has a 160-concept internal registry with no user-facing lookup.
3. **Zero-friction start**: no install, no onboarding, "Try it Yourself" in one click. ProofPath's first-session path is onboarding → path → lesson; a learner can hit a failing-by-design check before their first success moment.
4. **Free-exploration browsing**: every chapter reachable out of order. ProofPath's sequential locking is pedagogically defensible but browsing-hostile (placement tests only partially mitigate).
5. **Search**: global search + per-tutorial find. ProofPath has none.

### 3.4 Where ProofPath genuinely wins

1. **Practice integrity**: graded runs with visible + hidden tests, anti-cheat (forged-constant discrimination test), redaction scan, deterministic quiz shuffling. W3Schools' Tryit can't tell whether you did anything.
2. **Assessment quality**: 380 code-reading questions embedded in context vs a single 25-MCQ chapter quiz with no explanations.
3. **Retention**: a real spaced-repetition system. W3Schools' League/XP/Adventure optimize *return visits*, not memory.
4. **Honest credentials**: readiness score that caps at 59/69 without real project evidence — the anti-certificate. W3Schools sells "$95 → LinkedIn badge" with a "not official" quiz upstream.
5. **Content QA**: content is schema-validated, reference-locked, plagiarism-checked, and covered by ~184 tests in CI. W3Schools' model is human editing plus a disclaimer ("content reviewed but not guaranteed").
6. **Offline/privacy**: fully local, no analytics, no accounts. W3Schools is ad-funded and login-gated for any progress tracking.

### 3.5 Scorecard (relative to each product's own goals)

| Dimension | W3Schools | ProofPath | Edge |
|---|---|---|---|
| Breadth of subjects | ★★★★★ | ★★☆☆☆ | W3S |
| Reference/lookup | ★★★★★ | ☆☆☆☆☆ | W3S |
| Access friction | ★★★★★ | ★★★☆☆ | W3S |
| Lesson pedagogy structure | ★★☆☆☆ | ★★★★★ | PP |
| Practice grading & anti-cheat | ★☆☆☆☆ | ★★★★★ | PP |
| Assessment quality | ★★☆☆☆ | ★★★★☆ | PP |
| Retention/forgetting curve | ★☆☆☆☆ | ★★★★☆ | PP |
| Motivation/gamification | ★★★★☆ (XP/League) | ★★☆☆☆ | W3S |
| Credential value | ★★☆☆☆ (paid, unofficial) | ★★★☆☆ (evidence, unbuilt sync) | PP |
| Content QA engineering | ★★☆☆☆ | ★★★★★ | PP |
| Depth per topic | ★★☆☆☆ (wide-thin) | ★★★★☆ (deep where it exists) | PP |
| Monetization pressure on learner | heavy (ads/upsells) | none | PP |

---

## 4. Recommendations

**Borrow from W3Schools (cheap, high-leverage):**
1. **A lookup/reference surface.** The 160-concept registry is 80% of a reference already — render it as a browsable, searchable "Concepts" screen (definition, syntax shape, tiny example). Highest-value gap.
2. **Global search** over lessons, concepts, and mission titles.
3. **A no-onboarding sample lesson** ("run your first program in 60 seconds") reachable from the dashboard before path selection — kills the first-run friction and the fail-by-design first impression (make the very first runnable starter a one-line edit that *succeeds*).
4. **Free-browse mode**: let lessons be opened out of order (read-only or flagged "out of sequence") the way placement tests already decouple unlocking from completion.
5. **Level labels** on modules (foundation/applied/portfolio already exist internally — surface them the way W3Schools' syllabus pages do).

**Do NOT copy from W3Schools:**
- Breadth-first thin content (ProofPath's own critique doc warns against "fake progression" — the current 10 thin tracks already flirt with this; better to hide tracks than ship 2-lesson stubs).
- Advertising/upsell UX; certificate-of-clicking (the readiness cap is the better product).

**Internal fixes surfaced by this audit:**
1. Finish the CareerForge → ProofPath rebrand (package names, `app.json`, DB name needs a migration, runtime strings).
2. Refresh stale docs: `career-paths-current-curriculum-2026.md` (63→104), `QA_CHECKLIST.md` (19→22 suites).
3. Create the missing `docs/PROJECT_LAYOUT.md` that two top-level docs reference.
4. Decide and document the policy for TODO starters (learner-facing "expected to fail until you implement it" messaging in Code Lab), since ~1/3 of active lessons open in a failing state by design.
