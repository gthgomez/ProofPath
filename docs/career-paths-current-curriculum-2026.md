# CareerForge Current Core And Path Curriculum, 2026

**Last updated:** 2026-06-01
**Status:** Current product direction and implementation summary. Active app path IDs now use `path-*`, not the older `role-*` IDs.

## Executive Summary

CareerForge should teach a **shared proof-first CS core** and then let learners specialize into 2026-relevant career paths. The app no longer treats old job-title IDs as the product taxonomy.

Active selectable paths live in `src/content/roles.ts` and are available from:

- **Onboarding:** first-time or re-run career path setup.
- **Settings > Career path:** path switching without deleting saved work.

Old local saved values are normalized at load/set time so existing device progress does not silently fall into the wrong path.

## Current Shared Core

Every durable path depends on the same proof base:

| Core area | Current track coverage | Learner proof |
| --- | --- | --- |
| Python fundamentals | `track-python` | Small CLI/data utility with tests or verifier output. |
| TypeScript and web contracts | `track-typescript` | Typed UI/API-shaped data exercise. |
| SQL and persistence | `track-sql` | Schema/query proof and data-backed project note. |
| Git and portfolio evidence | `track-git` | Commit history, README, repo link, and verification notes. |
| Testing and debugging | `track-testing-debugging` | Regression harness and failure log showing one fixed bug stays fixed. |
| AI-output verification | `track-ai-tools` | Failure log, test harness, or AI review rubric showing human judgment. |

The core promise is **portfolio evidence**, not job readiness. A learner should leave core with at least one working artifact, one passing verifier, one Git/README proof, and one reflection explaining what was verified.

Python is now the reusable depth standard for future serious tracks. Selected Python depth lessons require compact practice reps, visible plus negative checks, recall cards, project evidence, and review-gate judgment. Port TypeScript, SQL, Security, AI, Cloud, and Data depth by copying that lesson shape rather than copying Python-specific topics.

## Active Career Paths

| Path ID | Display path | Chosen from | Current track order | Current promise |
| --- | --- | --- | --- | --- |
| `path-software-foundations` | **Software Foundations** | Onboarding, Settings | Python, TypeScript, SQL, Git, Testing and Debugging, AI-Assisted Coding | Broadest default: build, test, debug, version, and verify software with AI as a tool. |
| `path-backend-api-data` | **Backend, APIs & Data Systems** | Onboarding, Settings | Python, SQL, TypeScript, Git | Services, API contracts, SQL-backed models, and backend/data proof. |
| `path-secure-software-appsec` | **Secure Software & AppSec** | Onboarding, Settings | Secure Software, Git, Python, SQL, TypeScript, AI-Assisted Coding | Security-minded software work: threat notes, secrets, auth boundaries, validation, dependency hygiene, safe logging, and evidence-backed fixes. |
| `path-ai-product-engineering` | **AI Product Engineering** | Onboarding, Settings | TypeScript, AI-Assisted Coding, Practical AI Apps, SQL, Python, Git | Application-layer AI features with RAG, evals, guardrails, privacy boundaries, and cost notes. |

## Implemented Proof Gates

The Learn screen now evaluates path-level proof gates from `src/domain/role-routing.ts` against mission completion plus mission evidence requirements. The UI labels downstream items as `Locked specialization`, `Roadmap`, or `Coming later`.

| Gate | Required proof missions | Opens |
| --- | --- | --- |
| Shared Core Proof Gate | CLI Study Tracker, Typed Progress Board, Portfolio README, Regression Proof Pack, AI Prompt Verification Harness | Backend, Security, and AI Product paths. |
| Backend Proof Gate | API Contract Playground, Job Tracker Schema, Python Integration Service | Data Systems, Cloud Platform Basics, Practical AI Apps, ML Foundations, Analytics Systems. |
| Security Proof Gate | Secure Review Pack | Cloud Platform Basics, AI Security, Privacy Governance. |
| AI Product Proof Gate | AI Study Planner Boundary Map, RAG Notes Search Prototype | ML Foundations, AI Platform, Product Analytics. |

## Path Progression

### Start: Shared Core Proof

Learners can begin with **Software Foundations** if they are unsure. It gives them the broadest base and opens all later directions.

After core proof, learners can move into:

- **Backend, APIs & Data Systems** if they like services, SQL, data models, and integration.
- **Secure Software & AppSec** if they like defending, auditing, breaking/fixing, secrets, auth, and risk notes.
- **AI Product Engineering** if they like shipping AI features and can prove reliability through evals and tests.

### After Backend, APIs & Data Systems

Backend is the strongest bridge path because it opens several higher-value lanes:

| Opens after backend proof | Why it opens here | Needed before promotion |
| --- | --- | --- |
| **AI Product Engineering** | AI apps need APIs, data boundaries, auth, persistence, and eval logging. | RAG/eval mission and failure log. |
| **Data & Analytics Systems** | SQL/data modeling can become metrics, dashboards, data quality, and decision systems. | Data cleaning, data-quality tests, reproducible report. |
| **Cloud & Platform Systems** | Deploying APIs leads naturally to CI, containers, environment variables, and observability. | CLI/Git/API/test proof plus cost/secrets warnings. |
| **ML & Model Literacy** | Model work needs data quality, metrics, error analysis, and Python fluency. | Data/testing/eval gate; never day-one ML promise. |

### After Secure Software & AppSec

Security opens durable specialization lanes, but they should stay proof-gated:

- **AppSec depth:** OWASP, auth flaws, secure defaults, dependency scanning, exploit/fix writeups.
- **Cloud security:** IAM basics, secret storage, logs, network boundaries, cost/risk notes.
- **AI security and privacy:** prompt/data leakage, eval abuse cases, PII handling, model-output review.
- **Security governance:** lightweight threat models, risk registers, audit notes, and policy-as-evidence.

### After AI Product Engineering

AI Product is not ML engineering. It opens:

- **AI platform/product systems:** eval dashboards, routing, tracing, cost controls, observability.
- **ML & Model Literacy:** only after data, metrics, and evaluation proof.
- **Product analytics:** measuring feature quality, failure modes, user outcomes, and data feedback loops.
- **AI security:** prompt injection, data leakage, guardrail failure analysis, and safe release notes.

## Current Curriculum Inventory

Current implemented tracks:

- `track-python` — Python Fundamentals
- `track-typescript` — TypeScript and Web
- `track-sql` — SQL and Postgres
- `track-git` — Git and GitHub
- `track-testing-debugging` — Testing and Debugging
- `track-ai-tools` — AI-Assisted Coding
- `track-secure-software` — Secure Software
- `track-ai-apps` — Practical AI Apps
- `track-ml` — ML Foundations, present in catalog but still an advanced unlock
- `track-cloud-platform-basics` — Cloud Platform Basics, present as backend/security unlock curriculum
- `track-data-systems` — Data Systems, present as backend/data unlock curriculum

Current catalog count: **11 tracks, 63 lessons, 63 quizzes, and 18 missions**.

Current portfolio missions cover:

- Python CLI/data cleaner/professional utility/integration service.
- TypeScript web progress board/API contract playground.
- SQL portfolio ledger/job tracker schema.
- Git portfolio README.
- Testing regression proof pack.
- Secure software review pack.
- AI bug rubric/test harness/study planner/RAG notes prototype.
- Cloud release runbook.
- Data quality report.
- ML metrics report, currently treated as advanced/unwired.

## Curriculum We Should Add Next

| Priority | Add | Why |
| --- | --- | --- |
| 1 | Continue deepening `track-secure-software` | Access-control and output-encoding labs now exist; next add broader exploit/fix variations after Secure Review Pack proof. |
| 2 | Continue deepening `track-data-systems` | Dataset contracts and rejected-row proof now exist; next add analytics/data-system depth after reproducible report proof. |
| 3 | Add `track-analytics-systems` | Promote only after data-system proof exists. Focus on decision systems, not dashboard-only promises. |
| 4 | Deepen `track-cloud-platform-basics` | Rollback drill now exists; next add containers/IAM/provider-specific labs after config, CI gates, logs, cost, and rollback notes. |
| 5 | ML/model literacy gates | Keep `track-ml` behind proof of Python, data quality, testing, and eval discipline. |

## Product Copy Rules

Use:

- "Build evidence before choosing a durable direction."
- "Security and data reliability are core engineering skills."
- "AI Product Engineering means application-layer AI features, evals, and guardrails."

Avoid:

- "Junior SWE path."
- "Python full-stack path."
- "Become an AI engineer."
- "ML engineer from beginner lessons."
- "Cloud architect as a beginner path."
- Any job guarantee, salary promise, or standalone prompt-engineering career claim.
