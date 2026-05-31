# Career paths research (2026)

**Purpose:** Evidence-backed input for CareerForge Mobile’s three role targets and six learning tracks. This supplements [`career-paths-2026.md`](./career-paths-2026.md) (product stance) with 2025–2026 labor-market and skills signals. It is **not** labor-market advice or a curriculum rewrite mandate.

**Product baseline (verified in repo):**

| Role ID | Title | Track IDs (`roles.ts`) |
| --- | --- | --- |
| `role-junior-swe` | Junior SWE | `track-python`, `track-typescript`, `track-sql`, `track-git`, `track-ai-tools` |
| `role-python-fullstack` | Python backend & full-stack | Python, SQL, TypeScript, Git, `track-ai-apps` (excludes `track-ai-tools`) |
| `role-ai-app-fullstack` | AI product engineer | TypeScript, `track-ai-tools`, `track-ai-apps`, SQL, Python, Git |
| *(phase 2)* | — | `track-ml` exists in `seed.ts` but is not wired to any role |

---

## Executive summary

1. **AI-assisted development is table stakes, not a substitute for fundamentals.** ~84% of professional developers use or plan to use AI tools (Stack Overflow, 2025), but **more respondents distrust than trust** AI output accuracy; “almost right” code is a top frustration. Teaching must emphasize **verification, tests, and ownership**—aligned with `track-ai-tools`, not prompt-only shortcuts.

2. **Python, SQL, and Git remain the most durable “posting backbone”** for junior and intern SWE roles across surveys and aggregated job-skill lists (Lightcast occupational skill bundles; recurring intern JD patterns). TypeScript/JavaScript cluster with **web and full-stack** postings; Python clusters with **backend, data, and AI-adjacent** work.

3. **TypeScript’s rise is real but role-specific.** GitHub Octoverse 2025 reports TypeScript as #1 by monthly contributors (Aug 2025), driven partly by typed, AI-assisted app work; **Python still leads AI-tagged repositories** and ML/data workflows. CareerForge should teach **both**, with **path-dependent ordering** (already reflected in `roles.ts`).

4. **APIs, testing, and basic security are “assumed” more than listed**—employers often omit SQL or testing because they expect baseline competence (Stack Overflow “admired/desired” language data; NACE career-readiness framing). The app should make **HTTP/REST literacy, test evidence, and safe handling of secrets/PII** explicit outcomes, not optional footnotes.

5. **Cloud exposure is common at intern level as familiarity, not architect depth**—AWS/Azure/GCP and CI/CD appear as **nice-to-have** or context skills in many intern/backend postings; **Docker + CI keywords** rise for product teams. Defer deep platform certification paths; teach **deployable proof** (README, run commands, one pipeline concept) via Git + missions.

6. **ML engineering ≠ AI application engineering** (consistent industry framing, 2025–2026): ML engineers **train/own models and data pipelines**; AI / LLM / applied AI engineers **integrate foundation models** (RAG, evals, guardrails, orchestration) into products. Junior “AI product” roles rarely require training from scratch; they require **reliability and eval discipline**—matches `track-ai-apps` vs deferred `track-ml`.

7. **Employers hire for proof, not trivia.** NACE Job Outlook 2025: rising grad hiring (+7.3% YoY for Class of 2025), **~two-thirds use skills-based hiring** for entry-level roles; resume scans prioritize **teamwork, problem-solving, communication** (Job Outlook 2026 Spring Update themes). Portfolio, verifiers, and mission artifacts align with market direction.

8. **Cybersecurity and resilience are top macro skills** (WEF Future of Jobs Report 2025: AI/big data #1, **networks and cybersecurity #2** among fastest-growing skills). For students, translate to **secure defaults**: secrets hygiene, dependency awareness, auth basics, and “don’t ship AI slop” review habits—not full AppSec specialization first.

9. **Junior slot composition is shifting, not vanishing.** Macro reports note automation pressure on some tasks, but CS hiring intent remains strong (NACE: computer science tied for top bachelor’s hiring intent ~67% of respondents). Differentiation is **breadth + evidence + AI fluency with judgment**, not a single buzzword stack.

10. **CareerForge’s three-path split is well aligned** with posting clusters: generalist junior (polyglot + AI verification), Python/data/API path (persistence + practical AI boundaries), AI product path (TypeScript + evals/safety earlier). **Defer `track-ml` for all roles** until learners have production-style proof—supported by role-skill separation above.

---

## Skill categories ranked by evidence strength

Evidence strength reflects **source type and reproducibility**, not importance to learners. “Hard” = large surveys or official reports; “Medium” = aggregated job-market datasets or consistent multi-source patterns; “Soft” = expert/industry commentary useful for role design but weaker for frequency claims.

| Rank | Category | Strength | Representative signals |
| --- | --- | --- | --- |
| 1 | **Foundational programming** (variables, types, debugging, data structures, OOP basics) | **Hard** | SO 2025: developers resist AI for high-risk tasks; intern JDs require debugging tracebacks without autocomplete; NACE competencies emphasize problem-solving |
| 2 | **Version control (Git) & collaboration hygiene** | **Hard** | Lightcast “Software Developers” top skills include agile/software engineering practices; intern postings routinely require Git; CareerForge `track-git` |
| 3 | **SQL & data modeling basics** | **Hard** | Lightcast occupational lists: SQL among top skills for software developers; SO surveys historically rank SQL highly desired; intern/data roles require queries + schema |
| 4 | **Python proficiency** | **Hard** | Lightcast/GW RevU-style aggregates: Python among most cited languages in SWE postings; GitHub: Python +48% YoY contributors, dominant in AI-tagged repos (Octoverse 2025) |
| 5 | **TypeScript / JavaScript (typed web & APIs)** | **Hard** (trend) | GitHub Octoverse 2025: TypeScript #1 by contributors; SO 2025: high “desired” language interest; clusters with full-stack/front-end JDs |
| 6 | **REST/HTTP APIs & integration literacy** | **Medium–Hard** | Lightcast top skills include API; intern postings (API infrastructure, REST intern roles) expect REST + JSON; backend+AI sample JDs list HTTP/serialization explicitly |
| 7 | **Testing & quality mindset** (unit/integration, CI awareness) | **Medium** | SO 2025: developers plan more AI use for testing/docs but remain cautious; Samsung-style intern JDs list testing frameworks + SQL; many JDs say “testing concepts a plus” |
| 8 | **AI-assisted development with human review** | **Hard** (adoption), **Medium** (curriculum shape) | SO 2025: 84% use/plan AI tools; trust gap and ethical/security concerns widespread; product differentiator = **document what you verified** |
| 9 | **Cloud & DevOps exposure** (AWS/Azure/GCP, Docker, CI/CD keywords) | **Medium** | Lightcast SWE skill bundles include AWS; intern/enterprise JDs list cloud as plus; rarely core week-1 for pure juniors |
| 10 | **Security basics** (secrets, auth awareness, dependency hygiene, secure AI use) | **Hard** (macro), **Medium** (junior JD text) | WEF 2025: networks & cybersecurity among fastest-growing skills; SO press: ethical/security concerns about AI-generated code |
| 11 | **Practical AI apps** (RAG, evals, guardrails, orchestration—not training) | **Medium** | Distinct role narratives (applied AI vs ML); differentiated intern/associate postings; **not** universal in all junior SWE posts |
| 12 | **ML engineering** (training, feature stores, distributed training, deep metrics) | **Medium** (role-specific), **Soft** for most junior targets | WEF: “AI and ML specialists” growing; typical **junior SWE/intern** postings emphasize apps/APIs over training; aligns with deferring `track-ml` |
| 13 | **Soft / career skills** (communication, teamwork, learning agility) | **Hard** (employer surveys) | NACE Career Readiness competencies; Job Outlook 2026 Spring Update resume priorities |
| 14 | **Portfolio & demonstrable artifacts** | **Hard** (hiring process) | NACE skills-based hiring (~63–70% of employers); sample JDs value deployed projects/GitHub over GPA |

---

## ML / AI engineering vs AI application engineering

| Dimension | ML engineering (model layer) | AI application / LLM product engineering (application layer) |
| --- | --- | --- |
| **Primary deliverable** | Trained/tuned model, features, inference service | Product feature: chat, search, agent workflow, copilot |
| **Typical tasks** | Datasets, training loops, evaluation metrics, drift monitoring, GPU infra | RAG, prompts, tool routing, eval harnesses, guardrails, observability |
| **Stack emphasis** | PyTorch/sklearn, feature pipelines, MLOps | Hosted LLM APIs, vector DBs, TypeScript/Python services, test sets |
| **Math/stat depth** | Higher expectation for modeling roles | Enough to interpret evals; less emphasis on proving theorems |
| **Junior posting fit** | Uncommon unless internship is explicitly ML research/platform | Growing in “backend + AI”, “full-stack + LLM feature” intern roles |
| **CareerForge mapping** | `track-ml` (phase 2) | `track-ai-apps` + `track-ai-tools`; TS/Python/SQL/Git |

**Hiring reality:** Job titles conflate “AI Engineer,” “ML Engineer,” and “LLM Engineer.” Candidates should match **layer** (model vs application) to the team’s actual work. CareerForge’s `role-ai-app-fullstack` should **not** imply ML research training; `role-python-fullstack` should teach **AI product boundaries** (`track-ai-apps`) without replacing **daily verification habits** (`track-ai-tools` on the junior/AI-product paths).

---

## Patterns in junior / intern postings (aggregated, not single employers)

Synthesized from recurring requirements across public 2025–2026 intern and junior SWE listings (e.g., backend+AI, Python intern, API infrastructure intern, SDE intern testing focus) and skill-frequency summaries:

| Pattern | Frequency in JD language | Notes |
| --- | --- | --- |
| Python **or** Java/C# plus one scripting language | Very common | Python preferred for data/backend/AI-adjacent |
| SQL / relational DB | Very common | Often “strong understanding” even when stack is NoSQL elsewhere |
| Git | Very common | Branching, PRs, sometimes merge conflict resolution |
| REST / web APIs / JSON | Very common | HTTP methods, serialization, basic auth concepts |
| Degree enrollment / new grad window | Very common | STEM majors; less emphasis on GPA when portfolio present |
| **Deployed project / GitHub** | Increasingly explicit | “Beats resume” in competitive AI-adjacent junior posts |
| Testing (unit/integration) | Common as “plus” or in QA-leaning SDE intern roles | Framework named less often than “testing concepts” |
| Cloud (AWS/Azure/GCP) | Common as **exposure** | Rarely deep multi-service architect expectations |
| Docker / CI | Moderate | More in platform/backend/AI product teams |
| LLM APIs / RAG / LangChain-class tools | Niche but rising | Usually **differentiator**, paired with solid Python/API fundamentals |
| React/TypeScript frontend | Moderate in full-stack intern posts | Tied to `role-junior-swe` / AI product paths |
| “Debug AI-generated code” | Emerging explicit line | Aligns with SO trust findings |

**What is rarely required at true intern level:** Production ML training ownership, Kubernetes expertise, PhD-level statistics, or full security certification.

---

## What to teach FIRST vs defer

### Teach FIRST (weeks 1–4 product equivalent)

Aligned with existing onboarding copy in `roles.ts` and market backbone skills.

| Priority | Skills / outcomes | Why |
| --- | --- | --- |
| P0 | **Run code + read errors** (Python first for two paths; TypeScript first for AI product path) | Foundation for everything else; SO trust gap implies verification literacy |
| P0 | **Git commit hygiene + README** | Universal JD signal; portfolio evidence |
| P0 | **One verifier-backed artifact** (Code Lab + Portfolio) | Skills-based hiring + posting emphasis on demos |
| P1 | **SQL: SELECT, JOIN, simple schema** | Hard skill in aggregates; backend/data intern staple |
| P1 | **HTTP/REST mental model** | APIs in Lightcast top skills; bridge to TS and Python services |
| P1 | **AI-assisted workflow with explicit review** (`track-ai-tools` where included) | Adoption is universal; differentiation is **judgment** |
| P2 | **Second language surface** (TS for Python path; Python depth for AI product path) | Polyglot proof without stack trivia |
| P2 | **Basic testing evidence** (assertions, one failing-then-passing story) | Quality signal; supports “don’t ship almost-right AI code” |

### Teach NEXT (weeks 5–12 equivalent)

| Area | Content |
| --- | --- |
| Structured projects | CLI/data → API-shaped missions; schema + persistence narrative |
| Practical AI apps | RAG plan, eval checklist, safety note (`track-ai-apps`)—especially Python full-stack & AI product roles |
| CI / cloud vocabulary | “What happens when this runs in CI/deploy” via Git track extensions, not certification depth |

### DEFER (phase 2 or optional enrichment)

| Defer | Rationale |
| --- | --- |
| **`track-ml` (training, deep metrics, error analysis at ML-research depth)** | WEF growth is real for **specialist** roles; junior/generalist postings rarely require training ownership; product already phase-2 |
| **Advanced cloud architecture** (multi-region, IAM mastery, cost optimization) | Exposure > expertise for target personas |
| **Kubernetes / platform engineering depth** | Low frequency in intern JDs |
| **Fine-tuning / custom model training as default** | AI **application** roles favor integration + evals; misaligned hires per applied-AI commentary |
| **Heavy frontend framework churn** (beyond typed contracts + one UI proof) | Junior SWE needs UI literacy, not every meta-framework |
| **“Vibe coding” without tests** | SO 2025 press themes: ethical/security concerns; employer skepticism |

---

## Implications for CareerForge Mobile (three career paths)

### 1. Junior SWE (`role-junior-swe`)

| Research implication | Product action (content/routing, not code) |
| --- | --- |
| Market wants **breadth + verification** | Keep five-track bundle; lead Python + Git + one Portfolio proof |
| AI tools universal; trust low | Keep `track-ai-tools` in default path; missions should ask **what you changed after AI** |
| TS + Python both matter | Maintain Python-first onboarding but surface TS early enough for web/API contracts |
| Defer ML | Keep `track-ml` unwired; optional “Add ML phase” later per `career-paths-2026.md` |

### 2. Python backend & full-stack (`role-python-fullstack`)

| Research implication | Product action |
| --- | --- |
| Postings emphasize **data + API + SQL** | Track order: Python → SQL before TS breadth; backend mission evidence |
| AI apps as **boundaries**, not Copilot workflow only | `track-ai-apps` without `track-ai-tools` is intentional—add Portfolio prompts on **data leakage / eval** not just speed |
| TS as contract layer, not primary identity | TypeScript module framed API/UI contracts, not frontend mastery race |

### 3. AI product engineer (`role-ai-app-fullstack`)

| Research implication | Product action |
| --- | --- |
| Closest to **application-layer AI** roles | TS + `track-ai-tools` + `track-ai-apps` ordering is correct |
| Differentiator = **eval + safety narrative** | Portfolio templates for “what failed eval” and “what never ships” |
| Python supporting, not headline | Avoid implying ML training; Python missions support integration/scripts |
| Risk of three “AI” labels | Marketing copy: “product AI” vs “ML Foundations (later)” |

### Cross-path product principles

1. **Proof > quizzes** — NACE skills-based hiring and JD “deployed project” language support verifier-backed Portfolio as primary signal.
2. **Same language, different story** — Octoverse + SO: Python for data/ML adjacency, TypeScript for typed product surfaces; paths should explain *why order differs*.
3. **Do not conflate tracks** — `track-ai-tools` (workflow/verification) vs `track-ai-apps` (RAG/evals/product) vs `track-ml` (training)—research supports current separation.
4. **Security as habits** — Short modules on secrets in repos, PII in prompts, dependency updates; tie to WEF cybersecurity skill rise.
5. **Honest labor-market framing** — Regional variance; no “best stack” claims (consistent with `career-paths-2026.md` disclaimers).

---

## Alignment check: existing `career-paths-2026.md` vs research

| Existing stance | Research verdict |
| --- | --- |
| Three stable role IDs | **Confirmed** — maps to posting clusters |
| `track-ml` phase 2 for all | **Confirmed** for target personas |
| Junior includes `track-ai-tools`, excludes `track-ai-apps` | **Confirmed** — verification before product AI surface |
| Python path includes `track-ai-apps`, excludes `track-ai-tools` | **Reasonable** — emphasize product boundaries; consider light “review AI output” prompts in missions even without full track |
| AI product leads TS + both AI tracks | **Confirmed** — matches application-layer hiring |
| Portfolio / verifiers over checkbox quizzes | **Strongly confirmed** (NACE + JD patterns) |

**Optional research follow-ups (out of scope here):** Regional posting splits (EU vs US), new-grad vs intern-only corpora, formal Lightcast API skill-frequency pull for SOC 15-1252.

---

## Sources cited

| Source | Year | URL / org | Used for |
| --- | --- | --- | --- |
| Stack Overflow Developer Survey | 2025 | https://survey.stackoverflow.co/2025 , https://survey.stackoverflow.co/2025/AI | AI adoption, trust, frustrations, workflow resistance |
| Stack Overflow (blog/press) | 2025 | https://stackoverflow.blog/2025/10/23/what-leaders-need-to-know-from-the-2025-stack-overflow-developer-survey/ ; https://stackoverflow.co/company/press/archive/stack-overflow-2025-developer-survey/ | Leadership summary, trust themes |
| World Economic Forum — Future of Jobs Report | 2025 | https://www.weforum.org/publications/the-future-of-jobs-report-2025/ ; PDF https://reports.weforum.org/docs/WEF_Future_of_Jobs_Report_2025.pdf | Fastest-growing skills (AI/big data, cybersecurity), role outlook |
| GitHub — Octoverse | 2025 | https://github.blog/news-insights/octoverse/octoverse-a-new-developer-joins-github-every-second-as-ai-leads-typescript-to-1/ | TypeScript vs Python usage trends, AI-tagged repos |
| Lightcast | 2025 | https://lightcast.io/resources/blog/top-jobs-to-watch-2025 | Software developer occupational skill bundles (Java, Python, AWS, SQL, API, JS) |
| NACE — Job Outlook | 2025 | https://www.naceweb.org/research/reports/job-outlook/2025 | Hiring volume, skills-based hiring prevalence |
| NACE — Career Readiness / Job Outlook updates | 2025–2026 | https://naceweb.org/career-readiness/competencies/career-readiness-defined ; Job Outlook 2026 Spring Update (resume skill themes, cited on NACE site) | Teamwork, communication, problem-solving priority |
| NACE — Winter Salary Survey (executive summary) | 2025 | https://www.naceweb.org/docs/default-source/default-document-library/2025/publication/executive-summary/2025-nace-winter-salary-survey-executive-summary.pdf | CS hiring demand context |
| GW RevU / Lightcast citation (secondary) | 2025 | https://tech.revu.gwu.edu/post/the-9-best-paying-software-engineering-jobs-and-the-skills-to-land-them | Python ~34% / SQL ~20% posting mention rates (treat as heuristic) |
| DataCamp (SO citation) | 2024–2026 | https://www.datacamp.com/blog/the-best-sql-jobs-in-2022-unlock-new-career-paths-with-sql | SQL as baseline SWE expectation |
| Applied AI role distinction (commentary) | 2025–2026 | https://amitkoth.com/applied-ai-engineer/ ; https://automateedge.cloud/blog/03-ai-engineer-vs-ml-engineer ; https://www.kore1.com/llm-engineer-vs-ml-engineer/ | Model layer vs application layer (soft frequency, strong definitional clarity) |
| Sample intern/junior postings (pattern evidence) | 2025–2026 | e.g. https://builtin.com/job/junior-python-developer-intern/6764175 ; https://aijobs.ai/job/junior-software-engineer-backend-ai ; https://prosple.com/graduate-employers/tgs-usa/jobs-internships/software-api-infrastructure-intern | Recurring requirement themes (not single-employer proof) |

---

## Document metadata

- **Authoring context:** Research task for CareerForge Mobile, May 2026.
- **Companion doc:** [`career-paths-2026.md`](./career-paths-2026.md)
- **Content tracks reference:** `src/content/seed.ts` (`track-python` … `track-ml`)
- **Routing reference:** `src/content/roles.ts`
