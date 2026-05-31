# Career Paths Future Roadmap (2026+)

**Purpose:** Research-led roadmap for the current CareerForge Mobile `path-*` model and its next curriculum additions while lessons are still movable.

**Status:** Implemented as active path taxonomy on 2026-05-31. See [career-paths-current-curriculum-2026.md](./career-paths-current-curriculum-2026.md) for the current summary.

**Current app reality:** `src/content/roles.ts` now ships four active career path IDs:

- `path-software-foundations`
- `path-backend-api-data`
- `path-secure-software-appsec`
- `path-ai-product-engineering`

Older local `role-*` values are compatibility inputs only and are normalized into the new `path-*` IDs.

---

## Executive Decision

CareerForge has evolved from three job-title-like paths into a **shared core plus four primary career path families**, with two advanced unlock lanes.

### Recommended Primary Path Families

| Priority | Learner-facing path | Career signal | Roadmap action |
| ---: | --- | --- | --- |
| 1 | **Software Foundations** | Generalist SWE, backend, full-stack, mobile, platform later | Keep as default and make it proof-first, not "junior" branded. |
| 2 | **Backend, APIs & Data Systems** | Backend/API, data-facing services, SQL, reliable systems | Expand current Python backend path into the strongest backend + data route. |
| 3 | **Secure Software & AppSec** | AppSec, secure coding, cyber-aware engineering, cloud security later | Add as a first-class path or near-first-class phase once content exists. |
| 4 | **AI Features & Product Engineering** | LLM app features, RAG, evals, guardrails, AI product integration | Keep and sharpen current AI path, but gate claims with proof and avoid ML promises. |

### Advanced Unlocks

| Unlock | Best entry point | Why not day-one |
| --- | --- | --- |
| **Cloud & Platform Systems** | Software Foundations or Backend/API after Git, CLI, APIs, tests | High-value but senior-weighted and hard to simulate honestly on mobile. |
| **ML & Model Literacy** | Backend/Data or AI Features after testing/eval/data proof | ML engineering remains too math/infrastructure-heavy for a beginner promise. |

### Optional Later Branch

| Branch | Product stance |
| --- | --- |
| **Analytics & Decision Systems** | Add as a module branch under Backend/Data first. Promote to top-level only if lessons and demand evidence justify it. |

---

## Why This Replaces The Old Roadmap

The older roadmap treated the shipped three paths as the product frame:

1. Junior SWE
2. Python backend & full-stack
3. AI product engineer

That was defensible while the app needed stable routing. It is not ideal if lessons are still being finalized.

Across the four external research exports plus our in-repo synthesis, the repeated 2026 signals are:

- **Software foundations remain the broadest default**, but generic "learn to code" is too weak.
- **Backend/API/data proof is one of the strongest beginner-to-career bridges.**
- **Cybersecurity and AppSec are too important to remain only a footnote**, though the path must be practical secure-building, not certification theater.
- **AI product work is real but often overhyped**; it belongs as application-layer engineering, not ML training.
- **Cloud/platform is valuable but risky as a first mobile-learning path** because honest proof often needs infrastructure.
- **ML engineering should stay gated** until learners can prove programming, testing, data, and eval discipline.

The future roadmap should optimize for **durable proof artifacts**, not the current role ID count.

---

## Proposed Path Model

### 1. Software Foundations

**Replaces:** the old generalist beginner job-title framing.

**Promise:** Build reliable software with code, tests, Git evidence, and clear explanations.

**First proof artifact:** A small application or CLI slice with passing checks, a README, and a short "what I verified" note.

**Core skills:**

- Python or TypeScript fundamentals
- Git/GitHub workflow
- Debugging and tests
- SQL basics
- HTTP/API mental model
- AI-assisted coding with human verification
- Portfolio evidence

**Keep:** Default path for undecided learners.

**Avoid:** "Junior SWE" as the main title. It sounds like a job level and undersells the proof mission.

---

### 2. Backend, APIs & Data Systems

**Replaces/expands:** the old language-branded backend/full-stack framing.

**Promise:** Build data-backed services that can be tested, explained, and extended.

**First proof artifact:** A Python or TypeScript service/CLI that validates input, persists data, exposes or simulates an API contract, and includes test output.

**Core skills:**

- Python depth
- SQL joins, constraints, and schema design
- HTTP, REST, JSON, API contracts
- Testing and error handling
- Data cleaning and reliability
- Git evidence and README quality
- Intro cloud/deploy vocabulary without promising cloud mastery

**Why it matters:** GPT and Meta both converge on backend/API/data proof as a durable career bridge. It also gives CareerForge a practical spine for future AI, data, and platform work.

**Avoid:** Over-branding this as "full-stack" before the learner has API and persistence proof.

---

### 3. Secure Software & AppSec

**Adds:** New primary path candidate.

**Promise:** Learn to build and review software like a defender.

**First proof artifact:** A small app/API with a threat model, secrets/auth checklist, dependency or static scan note, and exploit/fix narrative.

**Core skills:**

- OWASP-style web risks
- Auth and session basics
- Secrets hygiene
- PII and prompt/data leakage
- Dependency awareness
- Secure API defaults
- Logging and incident notes
- Python or TypeScript security scripts

**Why it matters:** Every external document elevated security. Our previous roadmap only had security as cross-cutting habits. That is too small if the goal is best future career paths.

**Implementation shape:** Start with cross-path secure-default modules, then promote to top-level once there are at least two missions and one gated capstone.

**Avoid:** Certification-first copy. A CareerForge security path should produce practical secure-building evidence, not imply that Security+ alone gets a job.

---

### 4. AI Features & Product Engineering

**Replaces:** the old AI-app full-stack framing.

**Promise:** Ship AI-backed features with evals, guardrails, and failure analysis.

**First proof artifact:** A small AI feature plan or local simulation with a test set, expected failures, guardrail note, and cost/latency/eval reflection.

**Core skills:**

- TypeScript product surface
- Model/API boundaries
- Prompt structure and JSON contracts
- RAG concepts
- Eval sets and failure analysis
- Guardrails and "do not ship" decisions
- Data/privacy safety
- Human review of AI-generated code

**Why it matters:** AI product work appears in all four external documents, but the better-sourced docs caution against making it the default for everyone. Keep it visible, but honest.

**Avoid:** "Become an AI engineer" or "ML engineer" claims. This path is application-layer AI, not model training.

---

## What To Do With Current Tracks

| Current track | Future use |
| --- | --- |
| `track-python` | Core for Software Foundations and Backend/Data; supporting skill for AI and Security. |
| `track-typescript` | Core for Software Foundations and AI Features; supporting skill for API/UI contracts. |
| `track-sql` | Core for Backend/Data and Analytics branch; required before ML/data unlocks. |
| `track-git` | Shared core for every path. |
| `track-ai-tools` | Shared AI-verification module; do not treat as a whole career path. |
| `track-ai-apps` | Core for AI Features; optional/gated enrichment for Backend/Data. |
| `track-ml` | Advanced unlock only; never day-one route. |

### New Track Candidates

| Candidate track | Belongs under | Minimum content before shipping |
| --- | --- | --- |
| `track-secure-software` | Secure Software & AppSec plus shared cross-cut | Secrets/auth lesson, OWASP lesson, dependency/security scan lesson, threat-model mission. |
| `track-data-systems` | Backend, APIs & Data Systems | SQL modeling, data cleaning, data-quality tests, pipeline/ELT mission. |
| `track-cloud-platform-basics` | Advanced unlock | CLI/Git/deploy mental model, Docker/container concept, CI smoke, cloud-cost warning. |
| `track-analytics-systems` | Optional later branch | Metrics, dashboard/reporting, SQL aggregation, decision memo mission. |

---

## Routing Strategy

### If We Keep Three Onboarding Cards

Use these:

1. **Software Foundations**
2. **Backend, APIs & Data Systems**
3. **Secure Software & AppSec**

Then expose **AI Features** as a high-visibility specialization after the learner completes core proof. This follows GPT and Meta more than Gemini/Copilot, and it avoids overselling AI as the default beginner route.

### If We Allow Four Onboarding Cards

Use these:

1. **Software Foundations**
2. **Backend, APIs & Data Systems**
3. **Secure Software & AppSec**
4. **AI Features & Product Engineering**

This is the best product shape if CareerForge wants to visibly reflect 2026 AI demand while still being honest about fundamentals.

### Do Not Use As Day-One Cards

- Cloud Architect
- Platform Engineer
- ML Engineer
- Prompt Engineer
- Data Scientist
- Privacy Engineer
- Game Developer

These can be advanced unlocks, electives, or future modules after proof exists.

---

## Migration From Former Role IDs

The active migration has happened in code. Progress loading and path selection normalize older local values into the new active IDs.

| Former compatibility input | Active path ID |
| --- | --- |
| `role-junior-swe` | `path-software-foundations` |
| `role-python-fullstack` | `path-backend-api-data` |
| `role-ai-app-fullstack` | `path-ai-product-engineering` |

### Stage A - Completed: Path IDs And Copy

- Active IDs now use `path-*`.
- Onboarding and Settings show **Software Foundations**, **Backend, APIs & Data Systems**, **Secure Software & AppSec**, and **AI Product Engineering**.
- Compatibility input handling preserves old local progress semantics without keeping old IDs as active choices.

### Stage B - Security Curriculum

- Add `track-secure-software` after there are enough lessons and missions.
- Keep secure-default modules visible across all paths.
- Give `path-secure-software-appsec` at least one dedicated threat-model/exploit-fix capstone.

### Stage C - Data/Analytics And Cloud Unlocks

- Expand Backend/Data lessons before adding an analyst path.
- Add cloud/platform basics as an advanced proof module, not a beginner promise.
- Keep ML behind G3-style gates after data/testing/eval proof.

---

## Lesson Roadmap By Phase

### Phase 1 - Reframe Existing Lessons

- Convert onboarding copy from job titles to proof outcomes.
- Make the first two weeks identical in spirit: run code, read errors, pass checks, save proof.
- Make role differences visible through first artifact, not long track lists.

### Phase 2 - Add Security And Data Systems

- Add secure-default lessons:
  - secrets in repos
  - auth/session basics
  - PII and prompt leakage
  - dependency/security scan interpretation
- Add data-system lessons:
  - schema design
  - SQL joins and constraints
  - data cleaning
  - data-quality tests
  - reproducible data report

### Phase 3 - Sharpen AI Features

- Keep AI product lessons focused on application-layer proof:
  - model/API boundaries
  - RAG plan
  - eval set
  - hallucination/failure log
  - guardrail decision
  - cost/latency tradeoff

### Phase 4 - Advanced Unlocks

- Cloud/platform basics:
  - CLI and deployment mental model
  - CI pipeline reading
  - Docker/container concept
  - cloud cost and secret boundaries
- ML/model literacy:
  - metrics
  - train/test split
  - model limits
  - when not to use ML

---

## Research Mapping

| Research signal | Roadmap response |
| --- | --- |
| GPT: proof-based beginner ladders; top three SWE/Cyber/Data | Add Software, Security, Backend/Data as strongest path families. |
| Meta: Backend API + Secure Software + Data Pipelines | Expand Python backend into Backend/API/Data; add security path. |
| Copilot: Software + Cloud + Cyber; portfolio rubrics | Use capstone/rubric ideas; keep cloud as advanced unlock. |
| Gemini: AI + Cyber + Platform; AI verification | Keep AI Features visible; reject cyber-first/default-AI hype and platform as day-one. |
| All: ML not beginner; prompt engineer not standalone | Keep `track-ml` gated; keep AI workflow as skill, not career. |
| All: proof matters more than course completion | Keep readiness mission/evidence weighting; make roadmap lessons produce artifacts. |

---

## Product Claims To Use

- "Build proof a reviewer can inspect."
- "Learn the software, data, security, and AI habits that survive tooling changes."
- "AI is part of the workflow; verification is the skill."
- "Security and data reliability are not electives anymore."

## Product Claims To Avoid

- "These are the top three jobs by salary."
- "Complete this path and become an AI engineer."
- "ML is the next step after AI apps."
- "Cloud architect is a beginner role."
- "Cyber certification guarantees entry-level work."
- "Lesson completion equals job readiness."

---

## Recommendation

Because lessons are not finalized, CareerForge should **add Secure Software & AppSec and expand Backend/Data before locking the curriculum**.

The strongest future-facing structure is:

1. **Software Foundations** as the default.
2. **Backend, APIs & Data Systems** as the strongest technical builder path.
3. **Secure Software & AppSec** as the biggest missing 2026 path.
4. **AI Features & Product Engineering** as a visible but carefully bounded AI path.
5. **Cloud/platform and ML** as advanced unlocks after proof.

This gives the app a 2026+ career map without letting noisy market hype push beginners into titles the product cannot honestly verify.
