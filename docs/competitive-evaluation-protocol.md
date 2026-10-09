# ProofPath Competitive Evaluation and Benchmark Protocol

## Overview

This protocol specifies the methodology for evaluating ProofPath against its key inspiration platforms:
1. **W3Schools** (Immediate browser-based experimentation, syntax references, W3Schools Adventure).
2. **Sololearn** (Bite-sized mobile lessons, progressive skill scaffolding, daily engagement).

ProofPath's unique differentiator is **proof-oriented engineering**:
$$\text{Learn} \longrightarrow \text{Practice} \longrightarrow \text{Debug} \longrightarrow \text{Verify} \longrightarrow \text{Build} \longrightarrow \text{Demonstrate}$$

Students do not stop at multiple-choice recognition or toy sandboxes; they bridge into runnable code, offline SQLite persistence, TypeScript contracts, and Git-verifiable portfolio artifacts.

---

## Evaluation Dimensions & Metrics

| Dimension | Primary Metric | Target / Criterion | Comparison Baseline |
| :--- | :--- | :--- | :--- |
| **Ergonomics & Time-to-First-Run** | Seconds from app launch to running first editable code snippet | $< 60$ seconds (sample lesson requires no registration or binding career path setup) | W3Schools "Try it Yourself" (< 30s on web); Sololearn (~90s with onboarding) |
| **Error Recovery & Diagnostics** | Success rate in resolving beginner syntax/runtime defects | Deterministic diagnostics, exact line numbers when known, actionable hints | Sololearn hints; W3Schools raw compiler messages |
| **Assessment Integrity** | Proportion of completion requiring verifiable code execution | $100\%$ of lesson mini-projects and missions require passing verifiers | Multiple-choice dominance in competitor entry lessons |
| **Provenance Transparency** | Separation of self-reported vs. machine-verified evidence | Explicit trust classification: `auto_verified_code_lab` (ProofPath executed the check), `reproduction_package_supplied` (repo + revision + command supplied, not executed), `manual_verifier_output`, `manual_note` (self-reported). `independently_verified` is reserved and not awarded until ProofPath can actually re-run external work. | No formal verification or repository cryptographic hashing on competitor platforms |
| **Offline Reliability** | Operational availability without internet connectivity | Core runtime execution (Pyodide, SQLite, TypeScript compiler) executes offline | Competitor apps require continuous internet connectivity |

---

## 30-Minute Participant Evaluation Study Protocol

### Participant Cohort
- **Group A (Beginners, N = 12):** 0–6 months coding experience; introductory Python students.
- **Group B (CS Students / Early Juniors, N = 12):** Have completed introductory CS course; seeking portfolio projects.

### Session Structure (30 minutes)
1. **Minutes 0–5: Unprompted Exploration**
   - Learner opens the platform without instructions.
   - Measures: Time to run first code; drop-off or hesitation points.
2. **Minutes 5–15: Guided Task & Error Recovery**
   - Task: Complete an introductory script that outputs a structured string and handles an intentional syntax/type mistake.
   - Measures: Time to diagnosis; clarity of error messages; confidence score (1–5 Likert).
3. **Minutes 15–25: Milestone Verification & Integration**
   - Task: Run a multi-step check (Code Lab checks + Checkpoint quiz) and examine portfolio evidence.
   - Measures: Comprehension of what "passed" means; understanding of why tests passed.
4. **Minutes 25–30: Exit Interview & Usability Scoring**
   - System Usability Scale (SUS) standardized questionnaire.
   - Qualitative assessment on readiness feeling: "Would you feel comfortable explaining this project to a reviewer or engineer?"

---

## Reporting & Integrity Rules

- **No Fabricated Benchmarks:** Numerical study results must be collected from real, conducted sessions under this exact protocol. Never publish synthetic participant statistics as empirical findings.
- **Device Disclosures:** Native Android execution times must specify the physical device model, Android OS version, and chipset.
- **Living Document Maintenance:** Keep evaluation guidelines in sync with codebase capabilities.
