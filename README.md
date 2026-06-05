# CareerForge Mobile

An offline-first React Native learning system that helps beginner CS students convert lessons into reviewer-ready portfolio evidence.

---

## 1. Product Summary

CareerForge Mobile is a comprehensive career-readiness and technical learning application designed for software engineering students. Unlike typical educational platforms that prioritize passive video consumption or multiple-choice questions, CareerForge is built entirely around active engineering exercises, code sandbox verification, and project deliverables. It serves as a personal, local dashboard that guides students through structured learning paths, monitors their progress, and helps them build a validated portfolio of work.

---

## 2. Core Differentiator: Proof-First Learning

Most course platforms award certificates of completion for merely clicking through screens. CareerForge rejects this model, enforcing a **Proof-First Philosophy**:

* **No Free Completion:** Passing quizzes or reading material is not enough. To complete a lesson, students must complete an applied mini-project, run checks in the editor, and verify their code.
* **Portfolio Missions:** The core of the learning progression is the **Build Mission**. Each mission requires tangible deliverables (e.g., repository URLs, commit hashes, specific verifier outputs, and written reflections).
* **Telemetry & Readiness:** The **Career Readiness Score** requires actual evidence hygiene. Bypassing lessons via placement tests (diagnostic mastery) unblocks navigation but does *not* inflate the portfolio readiness score until the student provides concrete evidence of completed missions.

---

## 3. Architecture Overview

The codebase is organized cleanly as an Expo React Native TypeScript project, dividing UI screens, state providers, storage engines, and domain logic:

* **`app/`**: Expo Router navigation layout and screen components (e.g. `index.tsx` for dashboard, `path.tsx` for career path map, `lesson/[lessonId].tsx` for the 5-step stepper, and `evidence.tsx` for logging portfolio artifacts).
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
1. **Understand:** Read core concepts,Worked Examples, and synopsis notes.
2. **Experiment:** Execute practice code snippets and fluency repetitions inside the inline sandbox.
3. **Apply:** Run checks inside the Code Lab editor to pass structural tests.
4. **Checkpoint:** Take active recall checkpoints and quizzes.
5. **Evidence:** Log verifier output, commit hashes, and reflection statements.

### Evidence Capture & Verification
Maintains a verifiable log of student outcomes. The evidence logger validates repository links, commit hashes, and test outputs. When code runs in the Code Lab pass successfully, the output can be auto-prefilled into the evidence form via search query parameters.

### Career Readiness Score
A bounded metric (0 to 100) that models candidate readiness for technical roles:
* **Lesson & Quiz Coverage (20%):** Satisfied by completing lessons or passing placement diagnostics.
* **Project Completion (40%):** Direct evidence of completing core portfolio-grade Build Missions.
* **Evidence Hygiene (30%):** The structural quality of saved logs (e.g. including repos, commit hashes, clean verifier output, and complete READMEs).
* **Review Cadence (10%):** The spacing and consistency of active recall review sessions.
* **Proof Caps:** If a student lacks project completions or evidence hygiene, their readiness score is strictly capped at **59%** or **69%** respectively, preventing paper-only certifications.

### SQLite Persistence
An offline-first data layer. All attempts, progress state, evidence items, and weekly report snapshots are stored locally on-device using the `expo-sqlite` driver, resolving sequentially through a robust promise queue to maintain state synchronization.

---

## 5. Sandbox Boundaries & Defensive Guardrails

CareerForge includes a **Learner Sandbox with Defensive Guardrails** for run-testing code snippets and Code Labs. It is designed to guide beginners and catch syntax or logical bugs offline; **it is not an adversarial secure runtime.**

* **Native Python Runner:** A lightweight, regex-based offline verifier. It parses basic assignments and assertions. Standard control structures (like `if`, `for`, `def`) are intentionally unsupported in this offline fallback. If written, they fail gracefully with clean diagnostic errors instead of throwing crashes. Intermediate lessons requiring full control flow require the browser's webview Pyodide sandbox environment.
* **TypeScript Execution:** Relies on lightweight JS transformation to strip types at runtime before running inside the local JavaScript runtime engine, rather than invoking a full, heavy TypeScript compiler.
* **API Redaction & Policies:** Explicitly blocks standard browser network calls (like `fetch`), DOM mutations, and malicious filesystem/database operations before execution, providing beginner-focused diagnostic hints instead of generic failures.

---

## 6. Verification Commands

All curriculum modules, code sandboxes, and domain logic are fully covered by automated checks. You can execute these from your terminal:

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

CareerForge Mobile is currently in its local verification and sandbox testing phase. The application compiles cleanly for React Native/Expo and web environments. Local persistence is fully functional through the SQLite storage manager.

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

CareerForge Mobile represents a serious engineering project rather than a simple content app:
1. **Verifiable State Engine:** State is derived mathematically using the pure reconciliation logic in `reconcileDerivedProgress`.
2. **Defensive Sandbox Pipeline:** Code execution is structured defensively with AST-like checking and regex validation to provide direct compiler diagnostics back to mobile learners.
3. **Robust Local-First Persistence:** Implements a serialization queue using React refs to coordinate SQLite writes on low-spec mobile storage arrays.
4. **Pedagogical Stepper:** Integrates a state-machine driven wizard layout that tracks learner interaction across five stages without compromising state integrity.