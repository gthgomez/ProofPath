# ProofPath

An offline-first React Native learning system that helps beginner CS students convert lessons into reviewer-ready portfolio evidence.

> **Status: proprietary.** This repository is public for source visibility and
> transparency. It is **not open source** — there is no license grant to reuse,
> modify, or redistribute this code. See [LICENSE](LICENSE).

---

## 1. Product Summary

ProofPath is a comprehensive career-readiness and technical learning application designed for software engineering students. Unlike typical educational platforms that prioritize passive video consumption or multiple-choice questions, ProofPath is built entirely around active engineering exercises, code sandbox verification, and project deliverables. It serves as a personal, local dashboard that guides students through structured learning paths, monitors their progress, and helps them build a validated portfolio of work.

---

## 2. Core Differentiator: Proof-First Learning

Most course platforms award certificates of completion for merely clicking through screens. ProofPath rejects this model, enforcing a **Proof-First Philosophy**:

* **No Free Completion:** Passing quizzes or reading material is not enough. To complete a lesson, students must complete an applied mini-project, run checks in the editor, and verify their code.
* **Portfolio Missions:** The core of the learning progression is the **Build Mission**. Each mission requires tangible deliverables (e.g., repository URLs, commit hashes, specific verifier outputs, and written reflections). Mission proof must come from **one coherent submission** — repository, revision, check output, README, and artifact have to describe the same revision, so unrelated records cannot be stitched into a fictional verified project.
* **Honest Provenance:** Every evidence item carries a provenance classification. Only work ProofPath actually executed is labelled **Locally verified (Code Lab)**. Supplied repositories, pasted output, and notes are labelled **Reproduction package supplied** or **Self-reported** and are never presented as independently verified; there is no `independently_verified` award while ProofPath cannot re-run external work.
* **Telemetry & Readiness:** The **Career Readiness Score** requires actual evidence hygiene. Bypassing lessons via placement tests (diagnostic mastery) unblocks navigation but does *not* inflate the portfolio readiness score until the student provides concrete evidence of completed missions.

**Project docs:** [docs/](docs/) | [STATUS.md](STATUS.md) | [QA_CHECKLIST.md](QA_CHECKLIST.md)

Internal agent notes (not project documentation): [docs/agent/](docs/agent/)

---

## 3. Architecture Overview

The codebase is organized cleanly as an Expo React Native TypeScript project, dividing UI screens, state providers, storage engines, and domain logic:

* **`app/`**: Expo Router navigation layout and screen components (e.g. `index.tsx` for dashboard, `path.tsx` for career path map, `lesson/[lessonId].tsx` for the 5-step stepper, `evidence.tsx` for logging portfolio artifacts, and `workspace.tsx` for exportable local projects).
* **`src/domain/`**: Pure domain logic and helpers. Contains the core state engines including `readiness.ts` (readiness scoring calculation), `progress.ts` (progress updates and verification rules), `lesson-workflow.ts` (lesson stepper state machine), and `role-routing.ts` (career track navigation and Sequential Locking).
* **`src/state/`**: React Context state wrappers. Bridges UI interactions with storage and domain services (`progress-provider.tsx` and its web fallback `progress-provider.web.tsx`).
* **`src/storage/`**: Local persistence interfaces. Manages direct SQLite data binding and schema integrity (`progress-store.ts`).
* **`src/content/`**: Curriculum content storage. Houses the seed curriculum data, quizzes, paths, and missions (`seed.ts` and `roles.ts`).
* **`src/sandbox/`**: Code execution runtime adapters. Manages sandboxed code execution, policy validation, and diagnostic formatting (`runner.ts`, `native-python-proof-runner.ts`, etc.).
* **`tests/`**: Comprehensive unit and integration test suite using Vitest.

---

## 4. Main Subsystems

### Role & Path Routing
Guides users through custom career tracks (e.g. "Intern Generalist", "Backend API Developer"). Path nodes are unlocked sequentially. When a user skipped lessons via **Placement Tests**, the routing engine allows them to bypass locked modules, but flags these nodes visually as `"placed-out"` rather than `"completed"`.

### Guided Lesson Steppers
Each lesson utilizes a 5-step wizard flow that enforces a standard pedagogical progression:
1. **Understand:** Read core concepts, worked examples, and synopsis notes.
2. **Experiment:** Execute practice code snippets and fluency repetitions inside the inline sandbox.
3. **Apply:** Run checks inside the Code Lab editor to pass structural tests.
4. **Checkpoint:** Take active recall checkpoints and quizzes.
5. **Evidence:** Log verifier output, commit hashes, and reflection statements.

### Evidence Capture & Verification
Maintains a log of student outcomes with explicit provenance. The evidence logger validates repository links, commit hashes, and test outputs, then classifies each item:

* **Locally verified (Code Lab)** — ProofPath executed the check in its own sandbox.
* **Reproduction package supplied** — a repository, revision, and verification command were provided but not executed here.
* **Self-reported check output / note** — pasted output or a written note; ProofPath did not run or verify it.

When a Code Lab run passes, its output can be auto-prefilled into the evidence form. The **Portfolio** screen exports a reviewer packet as Markdown or JSON (a real file download on web, a share sheet on native, or an explicitly-labelled clipboard copy).

### Local Workspaces
For work that cannot run inside the app (GitHub Actions, a local SQLite project, a TypeScript type check), the **Build** tab links to **Local workspaces**. A learner exports the workspace as a self-contained JSON file (every path and its contents), runs the real verifier on their own machine, and pastes the printed result manifest back. The manifest is validated against the shipped template version and stored as self-reported evidence — a JSON manifest is a record, not a signature, and does not prove independent execution.

### Career Readiness Score
A bounded 0–100 **practice-progress heuristic**: it transparently measures how much verifiable, evidence-backed practice a learner has logged inside ProofPath. It is **not a validated hiring or employability prediction** — it has not been externally calibrated against hiring outcomes, and no such claim is made. It is designed to reward real proof over paper completion, not to rank candidates for employers.
* **Lesson & Quiz Coverage (10% + 10%):** Satisfied by completing lessons or passing placement diagnostics.
* **Project Completion (40%):** Direct evidence of completing core portfolio-grade Build Missions.
* **Evidence Hygiene (30%):** The structural quality of saved logs (e.g. including repos, commit hashes, clean verifier output, and complete READMEs), **weighted by provenance confidence** (Code Lab-run 1.0, reproduction package 0.7, pasted output 0.45, note 0.25). Evidence items without passing test results are additionally capped at 45/100 within this dimension, so fully-typed self-reported evidence cannot reach a fully credited score.
* **Review Cadence (10%):** The spacing and consistency of active recall review sessions.
* **Proof Caps:** If a student has no project completions, the total score is capped at **59**; if evidence hygiene is zero, it is capped at **69** — preventing paper-only certifications.
* **Labels:** `starting` / `building` / `portfolio-ready` describe progress through ProofPath's own curriculum and evidence requirements, not job-market readiness.

The full scoring model, caps and known limits are documented in [docs/engineering/readiness-model.md](docs/engineering/readiness-model.md).

### SQLite Persistence
An offline-first data layer. All attempts, progress state, evidence items, and weekly report snapshots are stored locally on-device using the `expo-sqlite` driver, resolving sequentially through a robust promise queue to maintain state synchronization.

---

## 5. Sandbox Boundaries & Defensive Guardrails

ProofPath includes a **Learner Sandbox with Defensive Guardrails** for run-testing code snippets and Code Labs. It is designed to guide beginners and catch syntax or logical bugs offline; **it is not an adversarial secure runtime, and it must not be treated as a sandbox for running hostile code.**

### Two execution surfaces

* **Mobile (native restricted runner):** A lightweight, regex-based offline Python verifier that parses basic assignments and assertions. Standard control structures (like `if`, `for`, `def`) are intentionally unsupported in this offline fallback. If written, they fail gracefully with clean diagnostic errors instead of throwing crashes.
* **Web (WebView + Pyodide WASM):** The full Python execution path. Intermediate lessons requiring complete control flow require this browser-based Pyodide environment, so lesson depth differs between mobile and web by design.
* **SQL:** Runs through the sql.js WASM sandbox on both surfaces.

Track depth remains uneven — the Python track is the deepest — but the SQL and TypeScript tracks are no longer thin: the SQL track was deepened to 8 lessons and the TypeScript and Git tracks were added with runnable mini-projects (see `npm run report:content`).

* **TypeScript Type Checking:** Runs the real TypeScript compiler (bundled as an offline sandbox asset, ~9 MB) against the learner's file before execution, so type errors fail the check with a line-numbered diagnostic instead of being silently stripped. Checking covers the single submitted file against the ES2015 standard library plus a `console` prelude — it is not a project build, and `strict` is off.
* **API Redaction & Policies:** Explicitly blocks standard browser network calls (like `fetch`), DOM mutations, and malicious filesystem/database operations before execution, providing beginner-focused diagnostic hints instead of generic failures.

---

## 6. Verification Commands

Automated checks cover content integrity, sandbox policy, type safety, and the unit/integration test suite. The workspace journey test additionally generates the shipped project into a temporary directory and executes its real Python verifier (with the real TypeScript compiler). Coverage is still not complete across every surface: native device behaviour and the readiness heuristic's real-world calibration are not automatically verified. Current test totals live in CI rather than in prose — see the latest hosted [Actions runs](https://github.com/gthgomez/ProofPath/actions) for per-run results. You can execute these checks from your terminal:

* **Validate Content Integrity:** Compares the curriculum seed files against Zod schemas and reference locks.
  ```bash
  npm run validate:content
  ```
* **Run Sandbox Scan:** Inspects Code Lab templates for policy or redaction mismatches.
  ```bash
  npm run scan:redaction
  ```
* **Generate Curriculum Report:** Runs a deterministic audit of tracks, modules, runner specs, and missions, highlighting warning zones (e.g., thin track coverage).
  ```bash
  npm run report:content
  ```
* **Compile TypeScript:** Runs typechecks to verify compilation safety.
  ```bash
  npm run typecheck
  ```
* **Run Vitest Tests:** Executes the unit and integration test suite.
  ```bash
  npm run test
  ```
* **Full Verification Pipeline:** Executes content verification, content reports, sandbox checks, typechecking, and tests sequentially.
  ```bash
  npm run verify
  ```

---

## 7. Current Project Status

ProofPath is currently in its local verification and sandbox testing phase. The application compiles cleanly for React Native/Expo and web environments. Local persistence is fully functional through the SQLite storage manager.

---

## 8. Development Roadmap

* **Modularize Curriculum Content:** Transition `src/content/seed.ts` from a single monolithic file into a structured directory:
  ```text
  src/content/
    tracks/
    modules/
    lessons/
    quizzes/
    seed.ts  <-- Lightweight entrypoint loader
  ```
* **Enrich SQL & TypeScript Sandboxes:** Expand the native and webview execution specs to match the comprehensive assertions and diagnostic feedback currently available in the Python track.
* **Expand Content Reporting telemetry:** Integrate reporting checks into local developer hooks to prevent compiling content with orphaned nodes or thin track modules.

---

## 9. Reviewer-Focused Architecture Note

ProofPath represents a serious engineering project rather than a simple content app:
1. **Verifiable State Engine:** State is derived mathematically using the pure reconciliation logic in `reconcileDerivedProgress`.
2. **Defensive Sandbox Pipeline:** Code execution is structured defensively with AST-like checking and regex validation to provide direct compiler diagnostics back to mobile learners.
3. **Robust Local-First Persistence:** Implements a serialization queue using React refs to coordinate SQLite writes on low-spec mobile storage arrays.
4. **Pedagogical Stepper:** Integrates a state-machine driven wizard layout that tracks learner interaction across five stages without compromising state integrity.
---

## 10. License

ProofPath is **proprietary**. This repository is public for viewing and
development transparency, but public visibility does not grant permission to
copy, modify, redistribute, sublicense, sell, commercially exploit, or create
derivative works from the project's original source, design, content, or
branding. See [LICENSE](LICENSE).
