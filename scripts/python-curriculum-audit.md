# CareerForgeMobile Python Curriculum — Comprehensive Audit

**Date:** 2026-06-21
**Scope:** All Python lessons across levels 0–9 (62 active + 3 deprecated)
**Methodology:** Multi-phase exploration (structural, pedagogical, practice-depth) + automated tool runs (`report:content`, `validate:content`, `python-depth-audit`)

---

## Executive Summary

The CareerForgeMobile Python curriculum is a **well-engineered, pedagogically sophisticated** learning system that stands above typical mobile coding education. It delivers 62 active lessons across 10 levels spanning absolute beginner (Level 0: "what is a file?") to professional practice (Level 9: CI/CD workflows). Every lesson follows a consistent 8-part structure with depth blocks, workshop exercises, and project continuity through a single "Study Tracker" narrative thread.

**Overall assessment: Strong foundation with targeted gaps at the upper levels and some structural inconsistencies.**

### Key Strengths

- **100% depth block coverage** on all active lessons — concept capsules, code walkthroughs, guided edits, error clinics, bridge exercises, understanding prompts, and exit tickets present on every lesson
- **Exceptional beginner scaffolding** — Level 0 enforces 9 strict rules banning variables, f-strings, lists, dicts, conditionals, loops, functions, assertions, and file I/O before they're taught
- **Proof-first pedagogy** — every lesson requires code execution evidence, not passive reading; learners build, run, and verify
- **Rich practice variety** — quizzes, code-run exercises, 3-tier practice reps (replicate/diagnose/synthesize), mini-projects, portfolio missions, spaced repetition recall cards, misconception checks, and error clinics
- **Build-time content integrity** — 10+ rule groups (A–N) validate concept DAG integrity, prerequisite ordering, quiz mapping, sandbox policy, and practice tier coverage at build time
- **Project continuity** — the "Study Tracker" project threads through all 10 levels, giving learners one evolving codebase they own
- **Deprecated lesson management** — old monolithic lessons are preserved with `deprecated: true` and `replacedByLessonIds` so learner progress is never lost
- **Dual sandbox execution** — Pyodide WASM for full Python + native regex offline verifier as fallback

### Key Gaps

- **Upper levels are thin** — levels 8–9 contain only 3 combined lessons (vs. 8–11 in levels 5–7), with no associated missions
- **Depth contracts stop at level 4** — levels 5–9 lack concept capsules, code walkthroughs, guided edits, and error clinics (they rely on workshop structure only)
- **Level 0 structural gaps** — missing `visibleCodeConcepts` field on all 5 lessons; first two concept-only lessons have zero guided edits and zero error clinics
- **Concept duplication** — `py.json.dumps_loads` (level 5) overlaps with `py.json.dumps` + `py.json.loads` (level 6); three separate concepts cover file reading (`py.file.input`, `py.open.read`, `files.input_text`)
- **Quizzes are shallow** — only 3 multiple-choice questions per lesson (~26% chance of passing by guessing); non-Python tracks have widespread answer position bias
- **No level-10 file** — concepts `ops.architecture.note` and `evidence.portfolio` are registered at `introducedLevel: 10` but no corresponding lesson file exists (these concepts are actually taught at level 7)
- **JavaScript runner for Python concept lessons** — Level 9 uses a JavaScript sandbox to teach Python environment config, which could confuse learners

---

## 1. Curriculum Structure

### 1.1 Content Inventory

| Level | File | Active Lessons | Deprecated | Quiz Count | Lines | Depth Contracts |
|-------|------|:---:|:---:|:---:|-----:|:---:|
| 0 | `level-0.ts` | 5 | 0 | 5 | 673 | Yes |
| 1 | `level-1.ts` | 6 | 1 | 7 | 1,304 | Yes |
| 2 | `level-2.ts` | 6 | 0 | 6 | 1,170 | Yes |
| 3 | `level-3.ts` | 6 | 1 | 7 | 1,422 | Yes |
| 4 | `level-4.ts` | 8 | 1 | 9 | 1,846 | Yes |
| 5 | `level-5.ts` | 9 | 0 | 9 | ~1,855 | **No** |
| 6 | `level-6.ts` | 11 | 0 | 11 | ~2,294 | **No** |
| 7 | `level-7.ts` | 8 | 0 | 8 | 1,552 | **No** |
| 8 | `level-8.ts` | 1 | 0 | 1 | 221 | **No** |
| 9 | `level-9.ts` | 2 | 0 | 2 | 430 | **No** |
| — | `shared.ts` | — | — | — | 480 | — |
| **Total** | | **62** | **3** | **65** | **~13,247** | |

**Module breakdown** (from `seed.ts`):

| Module | Sort | Lessons | Missions | Primary Skills |
|--------|:---:|:---:|:---:|--------|
| `module-python-core` | 1 | 39 | `mission-cli-study-tracker`, `mission-python-data-cleaner` | python-basics, python-functions, testing-debugging |
| `module-python-professional` | 2 | 11 | `mission-professional-python-utility` | python-professional, python-functions, testing-debugging |
| `module-python-dashboard` | 3 | 8 | `mission-python-integration-service` | python-integration, python-professional, testing-debugging |
| `module-python-api-resilience` | 4 | **1** | **(none)** | python-integration, api-contracts, testing-debugging |
| `module-python-ops` | 5 | **2** | **(none)** | python-professional, secret-handling, ci-release |

### 1.2 Concept DAG Health

The concept registry (`concepts.ts`, 1,133 lines) defines all knowledge nodes as a DAG with prerequisites. Python concepts (`py.*`) are distributed across levels:

| Level | Concept Count | Example Concepts |
|:---:|:---:|--------|
| 0 | 4 | `py.script.run`, `py.print.literal` |
| 1 | 12 | `py.variable.assignment`, `py.string`, `py.integer`, `py.boolean`, `py.f_string` |
| 2 | 15 | `py.if_else`, `py.for_loop`, `py.list.literal`, `py.dict.literal`, `py.accumulator` |
| 3 | 9 | `py.function.def`, `py.parameter`, `py.argument`, `py.return`, `py.print_vs_return` |
| 4 | 7 | `py.try_except`, `py.raise`, `py.assertion`, `py.value_error` |
| 5 | 17 | `py.file.input`, `py.csv`, `py.json`, `py.argparse`, `py.cli.*`, `py.test.assertions` |
| 6 | 14 | `py.import`, `py.pytest.*`, `py.dataclass.model`, `py.pyproject.toml` |
| 7 | 5 | `py.typing.hints`, `py.dataclass`, `py.validation.schema`, `py.testing.mock` |
| 8 | 5 | `py.sqlite.*`, `py.api.*` |
| 9 | 3 | `py.logging`, `py.config.env`, `ops.ci.github_actions.basic` |
| 10 | 2 | `ops.architecture.note`, `evidence.portfolio` |

**Issues found:**

| # | Issue | Detail |
|---|-------|--------|
| C1 | **Concept duplication** | `py.json.dumps_loads` (level 5) is a combined concept; `py.json.dumps` + `py.json.loads` (level 6) split the same topic. The level 5 combined concept should not coexist with the level 6 split concepts. |
| C2 | **Triple overlap on file reading** | `py.file.input`, `py.open.read`, and `files.input_text` all cover file reading at level 5 with overlapping descriptions. |
| C3 | **Level 10 concepts have no file** | `ops.architecture.note` and `evidence.portfolio` are registered at `introducedLevel: 10`, but no `level-10.ts` exists. These concepts are actually taught in level 7 lessons (`lesson-python-integration-capstone` and `lesson-python-integration-review`). The `introducedLevel` values should match the teaching level. |
| C4 | **`py.logging` at level 9** | `py.logging` (general logging) is registered at level 9, but `py.logging.warning` (warnings-specific) is taught at level 6. The general concept should ideally precede or coincide with the specific one. |
| C5 | **No cross-module prerequisite enforcement** | The `learning-path.ts` locking is purely sequential within a module. `CurriculumMetadata.requires` declares concept prerequisites but the learning path does not enforce that concepts from earlier modules are completed before unlocking later ones. |

### 1.3 Module Progression & Lesson Distribution

The core module (`module-python-core`, 39 lessons) is well-paced with 6 thematic arcs:
1. **Python Basics** (lessons 1–5): files, terminal, first script, change-rerun, syntax errors
2. **Variables and Output** (lessons 6–11): literals, assignment, print, numbers, strings, f-strings
3. **Collections and Control Flow** (lessons 12–17): lists/dicts, decisions, loops, capstone, module guard
4. **Functions** (lessons 18–23): motivation, def/call, parameters, return, print-vs-return, capstone
5. **Debugging and Assertions** (lessons 24–31): traceback, NameError, TypeError, ValueError, try/except, breakpoint, assertions, capstone
6. **File I/O and CLI** (lessons 32–39): file input, parser tests, CLI arguments, file-backed CLI, polish, output files, rejected rows, portfolio proof

**The drop-off after module 3 is sharp**: modules 4 (`api-resilience`, 1 lesson) and 5 (`ops`, 2 lessons) are barely populated. A learner completing Level 7's 8-lesson integration module will find only 3 more lessons across 2 modules before the path ends.

### 1.4 Depth Block Coverage

**Levels 0–4 (complete depth contracts):**

Every lesson at levels 0–4 has a full `LessonDepth` block:
- `conceptCapsules[]` — structured definitions with mental model, syntax shape, tiny example, common mistake, repair hint
- `codeWalkthrough[]` — step-by-step code exploration with `learnerShouldBeAbleToSay`
- `guidedEdits[]` — specific editing tasks with target code fragments and wrong-turn hints
- `errorClinic[]` — broken examples with symptom/likely-cause/fix-strategy
- `codeLabBridge` — story context + `learnerOwns`/`checkerOwns` ownership lists
- `understandingProofPrompt` — open-ended explanation question
- `exitTicket[]` — 2 behavioral self-assessment items

Capsule counts: 1–4 per lesson (average ~2.1). Edit counts: 0–2 per lesson. Clinic counts: 0–3 per lesson.

**Notable exceptions:**
- Level 0, lessons 1–2 (files/folders and terminal): 0 guided edits, 0 error clinics. Justified — these are concept-only orientation lessons before any code is written.
- Level 3, lesson 1 (why functions exist): 0 error clinics. Justified — the lesson demonstrates code duplication without introducing new syntax.

**Levels 5–9 (workshop-only depth):**

These levels have `depth` blocks present but the fields that provide guided learning (conceptCapsules, codeWalkthrough, guidedEdits, errorClinic) are missing. They rely on the workshop structure (practice blocks, practice reps, mini-projects, recall cards, misconception checks) instead. This means learners at higher levels have less scaffolded concept introduction.

**`visibleCodeConcepts` field:**

| Level | Field Present? |
|:---:|:---:|
| 0 | **No** — missing on all 5 lessons |
| 1–9 | Yes — present on all lessons |

This is a validation gap. The field is used by Rule Group I to verify that visible code concepts are covered by concept capsules or prior lessons. Without it on Level 0, the validator cannot check whether the code shown to absolute beginners uses only concepts they've been taught.

---

## 2. Beginner Accessibility

### 2.1 Level 0 Onboarding: "Absolute Zero"

Level 0 is the curriculum's strongest pedagogical asset. Its 5 lessons assume **zero prior knowledge** (`requires: []` on all lessons) and enforce **9 strict validation rules**:
- No variable assignments, no f-strings, no lists, no dicts, no conditionals, no loops, no functions, no assertions, no file I/O, no CLI arguments, no Git/GitHub keywords
- Visible checker tests must NOT use `assert`

Lesson progression for the absolute beginner:
1. **Files, Folders, and Extensions** — "Think of a file as a physical document inside a folder"
2. **The Terminal and Command Line** — "Think of the prompt as a blinking green light at a traffic stop"
3. **Running Your First Script** — executes `print("hello")`, introduces the concept of running code
4. **The Change-and-Rerun Loop** — teaches the edit→run→observe cycle
5. **Your First Syntax Error** — "Think of a syntax error as a grammatical typo"

**Assessment:** This is exemplary onboarding. The first two lessons are concept-only (no code editing), which is appropriate — forcing a learner who has never seen a terminal to write code would be premature. The metaphors are universally accessible, not culturally bound.

**Gaps:**
- Lessons 1–2 have no guided edits or error clinics (defensible for concept-only orientation)
- `visibleCodeConcepts` field is missing, weakening the automated safety net
- Evidence prompts use terms like "absolute path" and "transcription" without definition (noted in prior audit as jargon risk)

### 2.2 Scaffolding Progression

The curriculum follows a well-established progression through Bloom's taxonomy:

| Level | Cognitive Stage | What's New |
|:---:|--------|--------|
| 0 | **Remember** | Recognize files, terminal, `print()` |
| 1 | **Understand** | Variables, types, arithmetic, string methods, f-strings |
| 2 | **Apply** | Lists, dicts, conditionals, loops, capstone integration |
| 3 | **Analyze** | Function decomposition, parameters, return, single responsibility |
| 4 | **Evaluate** | Debugging, assertions, exception handling, regression testing |
| 5 | **Create (guided)** | File I/O, CLI tools, parser tests, output reports |
| 6 | **Create (professional)** | Packages, dataclasses, pytest, pyproject.toml, CI, virtualenvs |
| 7 | **Create (integration)** | Type hints, regex, OOP, SQLite, API clients, mocks |
| 8–9 | **Synthesize** | Retry resilience, env config, CI workflows |

**Prerequisite chain integrity:** The `validate:content` Rule Group B enforces that every lesson's `requires` concepts are taught by prior lessons. No violations were found. The concept DAG is internally consistent.

**Cognitive load management:**
- `maxNewConcepts` is capped at 3 for foundation lessons, 4 for applied, 2 for portfolio
- Level 1 splits what was originally one monolithic lesson into 6 micro-lessons (4–6 min each)
- Level 3 similarly splits functions into 5 micro-lessons + 1 capstone
- **Concern:** Level 2 introduces both `list` and `dict` simultaneously in a single lesson (`lesson-python-collections`). Prior audit flagged this as a cognitive load spike. The re-audit noted this was partially addressed but the simultaneous introduction remains.

**`usesButDoesNotTeach` honesty:**
The field is populated on most lessons, documenting concepts that appear in lesson code but aren't taught:
- Levels 0–4: consistently lists `"py.assertion"` (assertions appear in runner tests but aren't formally taught until Level 4)
- Level 5 CLI polish: lists **4 untaught concepts** (`py.import`, `py.argparse`, `py.csv`, `py.json`) — the densest use of untaught concepts anywhere in the curriculum. This is honest documentation but indicates the lesson expects significant absorption by context.

### 2.3 Metaphor and Language Quality

The curriculum's use of metaphors is a standout feature. Every concept is introduced with a concrete, relatable analogy:

| Concept | Metaphor | Level |
|---------|----------|:---:|
| File | Physical document in a folder | 0 |
| Terminal prompt | Blinking green traffic light | 0 |
| Syntax error | Grammatical typo | 0 |
| Variable | Labeled box | 1 |
| String method | Filter machine | 1 |
| f-string | Fill-in-the-blank sentence | 1 |
| List | Numbered line of train cars | 2 |
| Dictionary | Labeling drawer | 2 |
| if/else | Fork in the road | 2 |
| Loop | Mail carrier checking every mailbox | 2 |
| Module guard | Velvet rope at a club entrance | 2 |
| open() + with | Library book + study room that auto-returns | 5 |
| argparse | Border checkpoint | 5 |
| Type hints | Label on a package | 7 |
| Regex | Security gate | 7 |
| SQLite | Structured spreadsheet file | 7 |
| API client | Translator at a border post | 7 |
| Mock | Stunt double in a movie | 7 |
| Retry loop | Persistent delivery person | 8 |
| CI workflow | Robot quality inspector | 9 |

**Assessment:** The metaphors are concrete, culturally neutral, and level-appropriate. They become more professional/architectural at higher levels (matching the learner's growing sophistication) while remaining accessible. No metaphors contradict each other across levels.

### 2.4 Sandbox Experience for Beginners

| Lesson Type | Runner | Used In |
|--------|--------|---------|
| Python code execution | Pyodide WASM (WebView) | Levels 0–8 |
| Python offline fallback | Native regex verifier | Levels 0–1 (basic print/variables only) |
| Concept-only Python | JavaScript sandbox | **Level 9** (both lessons) |
| SQL exercises | sql.js WASM | Level 7 (SQLite lesson) |

**Issue:** Level 9's two Python lessons (`env-config`, `ci-workflow`) use a JavaScript sandbox. The lesson body explains this ("concept-only lesson uses a JavaScript sandbox to demonstrate the pattern since the real os.environ requires a Python runtime"), but a beginner who has spent 8 levels writing Python in a Python sandbox may be confused when the runner suddenly switches to JavaScript. This is an honest constraint of the WASM sandbox (no real environment variables) but the cognitive switch is not ideal.

---

## 3. Practice Depth

### 3.1 Practice Tier Coverage

Rule Group N enforces that every Level 2+ lesson has all three practice rep tiers:

| Tier | Description | Example (Level 5, parser-tests) |
|------|-------------|--------|
| **replicate** | Same pattern, new data | "Parse a second valid row" |
| **diagnose** | Find and fix a bug | "Reject a missing-topic row" |
| **synthesize** | Create something project-shaped | "Parse a mixed file with both good and bad rows" |

These tiers ensure the full spectrum from guided practice to independent construction. The `practiceReps` arrays use tier labels (`replicate`, `diagnose`, `synthesize`) to scaffold difficulty within a single lesson.

**Coverage:** 100% on levels 2–9 (enforced by Rule Group N). Level 0–1 lessons have practice blocks but not all three tiers (appropriate — beginners at level 1 don't yet have the syntax vocabulary for independent synthesis).

**Workshop structure (every lesson):**
- `practice` block: starter code (40+ chars), expected output, self-check guidance (50+ chars)
- `guidedExercise`: workbook-style "first do this…" instructions
- `miniProject`: 3+ steps, 3+ deliverables, runner spec with visible + hidden tests
- `recallCards`: 3 cards (explain, debug, transfer) feeding into spaced repetition
- `misconceptionChecks`: 1+ per lesson with mistake-specific repair guidance
- `reflectionPrompt`: end-of-lesson synthesis question

### 3.2 Quiz Assessment

Every lesson has one quiz with exactly 3 multiple-choice questions:

| Question | Type | Example Prompt |
|----------|------|--------|
| Q1 | Code reading | "Look at this code: … What does it produce or do?" |
| Q2 | Output prediction | "What would happen if you ran this version of the code?" |
| Q3 | Application | "In the Study Tracker project, where would you apply [concept]?" |

**Strengths:**
- Questions use `deterministicShuffle()` seeded per question ID — no answer position bias (confirmed: zero Python quizzes flagged in `validate:content`)
- Every question has `conceptIds` mapping back to the concept registry (Rule Group L)
- Passing threshold: 80% (2/3 correct)
- Concept coverage verified by Rule Group F (quiz concepts must be taught or available)

**Weaknesses:**
- **Only 3 questions per quiz** — with 3 choices each, the probability of passing by random guessing is ~26% (1 - probability of getting 0 or 1 correct: 1 - (8/27 + 12/27) = 7/27 ≈ 26%). This is low enough to be a concern for assessment validity.
- Question depth is primarily recognition/recall, not deep reasoning
- **Non-Python tracks have widespread answer position bias** — 30 quizzes across TypeScript, SQL, Git, AI, ML, testing, security, cloud, and data tracks have 100% of correct answers at the same index (either 0 or 1). Python quizzes are clean, but the non-Python quiz builder apparently uses `checkpointQuiz()` (deprecated) instead of `codeReadingQuiz()`, which has the shuffle.

### 3.3 Error & Misconception Support

**Error clinics** follow a consistent 4-part structure:
1. `brokenExample` — the problematic code
2. `symptom` — what the learner sees
3. `likelyCause` — why it happened
4. `fixStrategy` — how to resolve it

The errors shown are realistic, not contrived — exactly the mistakes beginners make:
- Level 0: unclosed string quotes
- Level 1: `NameError` from undefined variables, `TypeError` from mixing types, forgetting to store method results, swapped assignment
- Level 2: `KeyError` from wrong dict keys, `IndexError` from wrong list indices, `IndentationError`, `=` vs `==` in conditions, accumulator reset inside loops
- Level 3: missing colon on `def`, forgetting `()` when calling, wrong argument count, `print` vs `return`
- Level 5: unclosed file handles, missing `type=int` in argparse, hardcoded paths
- Level 7: SQL injection with string interpolation, missing timeout in API calls, mock assertions without checks
- Level 8: no retry loop at all, return inside loop without status check
- Level 9: hardcoded secrets, printing secret values, missing CI setup steps

**Misconception checks** have been improved from generic to specific repair guidance (confirmed by audit recheck). Each names a specific mistake and provides targeted fix instructions.

### 3.4 Project-Based Practice

**The Study Tracker through-line:**

Every level extends the same project:
- Level 0: Locate script files
- Level 1: Create variables for topics/minutes
- Level 2: Store session records in lists of dicts
- Level 3: Decompose into single-responsibility functions
- Level 5: Add CLI arguments + file I/O + output reports
- Level 7: Add SQLite persistence + API client + type hints
- Level 8: Add retry resilience
- Level 9: Add CI/CD automation

This is a strong pedagogical design — one evolving codebase the learner genuinely owns.

**Mission evidence system:**

Missions require 6-field evidence packages:
| Field | Foundation | Portfolio |
|-------|:---:|:---:|
| `repoUrl` | — | Required |
| `commitHash` | — | Required |
| `passingVerifierOutput` | Required | Required |
| `readmeStatus` | — | Required |
| `artifactOrDeployment` | — | Required |
| `reflection` | Required | Required |

This mirrors real hiring expectations — portfolio missions produce evidence a learner can show to an employer.

**Mission gaps:**
- Modules 4 (`api-resilience`) and 5 (`ops`) have **no missions** — learners complete these modules without a culminating project
- Prior audit noted evidence prompts use academic language ("Write a 400-word reflection…") that may feel inauthentic to industry-focused learners

### 3.5 Spaced Repetition

The review system uses an SM-2 variant:
- Intervals: [1, 3, 7, 14, 30] days
- Default ease factor: 2.5
- Ratings: again (2), hard (3), good (4), easy (5)
- On "again": lapse tracking, reset to 1 day
- Review cards draw from lesson content: explain (recall), debug (name a mistake), transfer (project connection)
- Lapsed learners get the "debug" card (active retrieval of error knowledge)

Integration with the curriculum is tight: recall cards, misconception checks, and reflection prompts all feed the review queue. Stale reviews reduce readiness scores.

**Limitation:** Review is individual only — no collaborative or pair-programming mechanisms exist. This is a gap for professional-level lessons where code review and pair programming are industry norms.

---

## 4. Prioritized Findings

### [CRITICAL] — Blockers that affect content integrity or learner experience

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| **F1** | Level 0 missing `visibleCodeConcepts` field | `level-0.ts` (all 5 lessons) | Rule Group I cannot validate that Level 0 visible code uses only taught concepts. Reduces safety net for absolute beginners. |
| **F2** | Concept DAG entries at wrong `introducedLevel` | `concepts.ts`: `ops.architecture.note` (L10, actually L7), `evidence.portfolio` (L10, actually L7) | Build-time validation uses `introducedLevel` to check concept availability. Mismatches could cause false validation passes or failures. |

### [HIGH] — Significant gaps in coverage or pedagogy

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| **F3** | Levels 8–9 severely underpopulated (3 lessons total, 0 missions) | `level-8.ts` (1 lesson, 221 lines), `level-9.ts` (2 lessons, 430 lines) | Curriculum ends abruptly after Level 7's rich integration module. Modules 4–5 feel abandoned. |
| **F4** | Depth contracts stop at level 4 | `level-5.ts` through `level-9.ts` | Levels 5–9 lack conceptCapsules, codeWalkthrough, guidedEdits, errorClinic. Learners at higher levels lose scaffolded concept introduction. |
| **F5** | JavaScript runner for Level 9 Python lessons | `level-9.ts` (both lessons) | After 8 levels of Python sandbox execution, the runner switches to JavaScript. Confusing for learners who expect to write Python. |
| **F6** | Level 2 simultaneous list+dict introduction | `level-2.ts`, `lesson-python-collections` | Cognitive load spike — two complex data structures introduced in one lesson. Prior audit flagged this; partially addressed but unresolved. |

### [MEDIUM] — Quality and consistency issues

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| **F7** | Concept duplication: `py.json.dumps_loads` vs `py.json.dumps` + `py.json.loads` | `concepts.ts` lines 601, 1001, 1008 | Two concept IDs cover the same knowledge. Could cause `requires` chain confusion. |
| **F8** | Triple overlap on file reading concepts | `concepts.ts`: `py.file.input`, `py.open.read`, `files.input_text` (all level 5) | Three concepts with overlapping scope at the same level. Unclear which is canonical. |
| **F9** | `py.logging` at level 9, but `py.logging.warning` at level 6 | `concepts.ts` lines 806, 1015 | General logging concept is registered AFTER the specific warning concept. Order should be reversed. |
| **F10** | Level 5 CLI polish uses 4 untaught concepts | `level-5.ts`, `lesson-python-cli-polish` | `usesButDoesNotTeach: ["py.import", "py.argparse", "py.csv", "py.json"]` — densest untaught concept usage in curriculum |
| **F11** | 106 "arithmetic before arithmetic lesson" warnings | `validate:content` output | Likely false positives from `+` in f-strings triggering arithmetic detection. Should either fix the detection or suppress if intentional. |

### [LOW] — Nice-to-have improvements

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| **F12** | Quizzes have only 3 questions (26% guess pass rate) | All Python quizzes | Assessment validity is weak. 5–6 questions would reduce guessing to ~4%. |
| **F13** | No pair programming or collaborative practice | Entire curriculum | Professional-level lessons (6+) would benefit from code review / pair programming exercises. |
| **F14** | `if __name__ == "__main__"` not explained | Guard is used in code but never formally taught | `py.module.guard` concept exists but `__name__` and `__main__` dunder mechanics are never explained. |
| **F15** | `pathlib.Path` not taught | File I/O uses `open()` with string paths | Industry standard library for path handling is absent from the curriculum. |
| **F16** | Non-Python quizzes have answer position bias | 30 quizzes across 9 non-Python tracks | All correct answers at the same index (0 or 1). These use deprecated `checkpointQuiz()` without shuffle. |

---

## 5. Recommended Fixes

### Fix Pack 1 — Structural Integrity (Critical)

| Fix | Issue | Effort | Approach |
|-----|-------|:---:|-----|
| Add `visibleCodeConcepts` to Level 0 | F1 | Small | Add `visibleCodeConcepts` array to the `curriculum` block of all 5 Level 0 lessons, referencing the concept IDs shown in their depth capsules (e.g., `["tool.files.file", "tool.files.extension", "tool.files.path"]` for files/folders). |
| Fix concept `introducedLevel` values | F2 | Small | Change `ops.architecture.note` and `evidence.portfolio` from `introducedLevel: 10` to `introducedLevel: 7` to match their actual teaching location. Remove level 10 expectation or create a level-10 stub. |

### Fix Pack 2 — Upper-Level Coverage (High)

| Fix | Issue | Effort | Approach |
|-----|-------|:---:|-----|
| Add lessons to levels 8–9 | F3 | Large | Add 3–4 lessons to level 8 (rate limiting, caching strategies, async/await basics, circuit breaker pattern) and 3–4 to level 9 (secrets management, deployment strategies, monitoring basics). Create missions for both modules. |
| Add depth contracts to levels 5–7 | F4 | Large | Backfill conceptCapsules, guidedEdits, and errorClinics for levels 5–7 lessons. Prioritize the hardest concepts (type hints, regex, OOP, SQLite). |
| Add explanation for JS runner | F5 | Small | Add a prominent note at the top of each Level 9 lesson body explaining why the JavaScript sandbox is used and what the learner should focus on (the concept, not the language). |
| Split list+dict lesson | F6 | Medium | Split `lesson-python-collections` into two: one for lists (with the train cars metaphor), one for dicts (with the labeling drawer metaphor), then a third that combines them into `list_of_dicts`. |

### Fix Pack 3 — Quality & Polish (Medium)

| Fix | Issue | Effort | Approach |
|-----|-------|:---:|-----|
| Consolidate JSON concepts | F7 | Small | Remove `py.json.dumps_loads` and ensure all references use `py.json.dumps` + `py.json.loads`. Update the level 5 lesson that teaches JSON to use the split concepts. |
| Consolidate file reading concepts | F8 | Small | Keep `py.file.input` as canonical, deprecate `py.open.read` and `files.input_text` as aliases, or clearly differentiate their scopes (e.g., `py.open.read` = raw file open, `py.file.input` = with-statement pattern, `files.input_text` = text stream abstraction). |
| Move `py.logging` to level 6 | F9 | Small | Change `py.logging.introducedLevel` from 9 to 6 so it precedes or coincides with `py.logging.warning`. |
| Teach `import` before Level 5 CLI polish | F10 | Medium | Add a brief `py.import` lesson or concept capsule at early Level 5. `import` is fundamental enough to deserve explicit teaching before it appears in `usesButDoesNotTeach`. |
| Fix arithmetic false positives | F11 | Small | Adjust `validate:content.ts` Rule Group E arithmetic detection to exclude `+` inside f-string braces or string contexts where it's concatenation, not arithmetic. |

### Fix Pack 4 — Enhancement (Low)

| Fix | Issue | Effort | Approach |
|-----|-------|:---:|-----|
| Increase quiz questions to 5 | F12 | Medium | Extend `codeReadingQuiz()` to generate 5 questions per quiz. Add a "debug" question (find the bug) and a "refactor" question (improve the code). Update passing threshold to 4/5 (80%). |
| Add `__name__` explanation | F14 | Small | Add a `py.module.guard.mechanics` concept at level 2 explaining `__name__` and `__main__` dunders in the module guard lesson. |
| Add `pathlib.Path` capsule | F15 | Small | Add a concept capsule or brief section in the Level 5 file I/O lesson introducing `Path` as an alternative to string paths. |
| Fix non-Python quiz shuffle | F16 | Small | Convert non-Python quizzes from `checkpointQuiz()` to `codeReadingQuiz()` to get deterministic shuffle. Or add shuffle to `checkpointQuiz()` directly. |

---

## 6. Verification Checklist

After applying fixes, run the full pipeline:

```bash
npx tsc --noEmit              # TypeScript compilation
npm run validate:content      # All Rule Groups A–N
npm run report:content        # Structural report + quiz bias check
npm run scan:redaction        # Sandbox policy scan
npm run test                  # Vitest test suite (19 test files)
```

**Specific checks per fix pack:**

| Fix Pack | Verification |
|----------|-------------|
| 1 (Structural) | Rule Group I passes for Level 0; `validate:content` reports 0 concept-level mismatches |
| 2 (Coverage) | `report:content` shows 4+ lessons per module; `python-depth-audit` shows depth contracts on levels 5–7 |
| 3 (Quality) | Rule Group A passes without duplicate-concept warnings; arithmetic warnings reduced by >50% |
| 4 (Enhancement) | `report:content` shows 0 non-Python quizzes with position bias; Python quizzes show 5 questions each |

---

## Appendix A: Prior Audit History

| Audit | Date | Scores |
|-------|------|--------|
| Initial audit (`audit-report.md`) | ~2026 | Beginner 3.5/5, Pedagogy 3.7/5, Real-World 3.8/5, Pythonic 4/5 |
| Post-fix re-audit (`audit-recheck.md`) | ~2026 | Beginner 4.0/5 (+0.5), Pedagogy 4.2/5 (+0.5), Real-World 4.0/5 (+0.2), Pythonic 5/5 (+1.0) |

**Resolved since last audit:** `or True` bug in hidden tests, quiz shuffle added, `breakpoint()` lesson added, pytest parametrize/raises content added, repair messages made specific.

**Still open from last audit:** Git branching/PR workflow, `if __name__` explanation, `pathlib.Path` teaching, quiz question count.

## Appendix B: Tool Outputs Used

- `npm run report:content` — 11 tracks, 15 modules, 95 lessons, 18 missions; Python: 59 lessons, 4 missions; all 62 active Python lessons listed with per-lesson audit fields
- `npm run validate:content` — Rule Groups A–N passed; 106 "arithmetic before arithmetic lesson" warnings; 30 non-Python quizzes with position bias
- `npx tsx scripts/python-depth-audit.ts` — 62-row depth table showing 100% depth block presence, capsule/edit/clinic counts per lesson
