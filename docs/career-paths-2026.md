# Career paths (2026 draft)

CareerForge keeps three stable role IDs for routing and saved progress: `role-junior-swe`, `role-python-fullstack`, and `role-ai-app-fullstack`. This document sharpens how they differ for learners and hiring signals in 2026—not a content rewrite of every lesson.

## Market signals (brief, non-exhaustive)

Sources are directional, not guarantees. Use them to prioritize proof and review skills, not to chase buzzwords.

| Signal | What it implies for learners |
| --- | --- |
| **Stack Overflow Developer Survey** (2024–2025 trend) | AI tool use is common; trust in raw AI output is not automatic—employers still want humans who test, review, and own outcomes. |
| **GitHub Octoverse 2025** (reported industry summaries) | TypeScript momentum on greenfield repos; polyglot repos remain normal. |
| **World Economic Forum, Future of Jobs Report 2025** | Analytical thinking, AI/big-data literacy, and cybersecurity/resilience stay in the “rising skills” set. |
| **Job-posting aggregates** (e.g. large 2025–2026 SWE posting samples) | Python, SQL, APIs, Git/CI, and cloud keywords appear often; TypeScript clusters with web/full-stack postings; LLM/RAG/eval language shows up as a **differentiator**, not a replacement for fundamentals. |
| **Hiring composition** (multiple 2025–2026 commentaries) | Fewer pure “write CRUD from scratch” junior slots; more weight on **portfolio proof**, verification, and communication. Treat this as pressure to show evidence, not as “juniors are gone.” |

CareerForge encodes this by making **verifier-backed Code Lab runs**, **portfolio entries**, and **missions** count more than checkbox quizzes alone.

## Three role targets (product stance)

### 1. Junior SWE (`role-junior-swe`) — default

**Who it’s for:** First internship or junior generalist roles—breadth over a single product niche.

| Phase | Focus |
| --- | --- |
| **Start here (weeks 1–2)** | Python values/functions + Git commit hygiene; one passing Code Lab; one Portfolio note explaining what you verified. |
| **Core stack** | Python, TypeScript (UI contracts), SQL, Git, AI-assisted coding (verification track). |
| **Differentiator** | Show you can **direct AI output**: what you changed, what tests caught, what you refused to ship. |
| **Defer until later** | Practical AI Apps (product/RAG track), ML Foundations. |

**Included tracks (app routing):** Python Fundamentals, TypeScript and Web, SQL and Postgres, Git and GitHub, AI-Assisted Coding.

**Excluded (other targets or phase 2):** Practical AI Apps, ML Foundations.

---

### 2. Python backend & full-stack (`role-python-fullstack`)

**Who it’s for:** Backend-leaning full-stack, data-facing APIs, “Python + SQL + services” job descriptions—not “AI product engineer” as the primary story.

| Phase | Focus |
| --- | --- |
| **Start here (weeks 1–2)** | Python core + first SQL module; mission oriented to CLI/data cleanup with repo + test output in Portfolio. |
| **Core stack** | Python (depth), SQL, TypeScript for API/UI contracts, Git, Practical AI Apps (boundaries/evals, not model training). |
| **Differentiator** | End-to-end **data + API** proof: schema, queries, small service, README with run commands. |
| **Defer until later** | AI-Assisted Coding workflow track (junior/AI-product paths cover this earlier), ML Foundations. |

**Included tracks:** Python, SQL, TypeScript, Git, Practical AI Apps.

**Excluded:** AI-Assisted Coding, ML Foundations.

**Overlap reduction vs Junior SWE:** Same languages, but **order and missions** emphasize persistence and backend artifacts before web breadth; includes **Practical AI Apps** instead of **AI-Assisted Coding** (product boundaries vs daily Copilot-style workflow).

---

### 3. AI product engineer (`role-ai-app-fullstack`)

**Who it’s for:** Roles building LLM-backed features (RAG, routers, evals, guardrails) on a full-stack surface—TypeScript-first story.

| Phase | Focus |
| --- | --- |
| **Start here (weeks 1–2)** | TypeScript lesson + AI verification habits; document one safety/eval decision in Portfolio. |
| **Core stack** | TypeScript, AI-Assisted Coding, Practical AI Apps, SQL, Python (supporting), Git. |
| **Differentiator** | **Eval + safety narrative**: what you measured, what failed, what never ships to production. |
| **Defer until later** | ML Foundations (training/metrics depth). |

**Included tracks:** TypeScript, AI-Assisted Coding, Practical AI Apps, SQL, Python, Git.

**Excluded:** ML Foundations (phase 2 for all paths).

**Overlap reduction vs Python path:** Leads with **TS + AI product** tracks; Python is supporting integration, not the headline. vs Junior: **more AI surface area earlier**, less “balanced intern breadth.”

---

## `track-ml` (ML Foundations)

**Status: phase 2 for every role ID** (not wired into `trackIds` yet).

Rationale: posting data still rewards Python/SQL/TS and portfolio proof for most junior/full-stack targets; dedicated ML hiring expects projects this app does not fully simulate yet. When we attach it:

- **Preferred attachment:** `role-junior-swe` as an optional sixth track after core proof, **or** Settings-driven “Add ML phase” without breaking existing progress.
- **Do not** add to `role-ai-app-fullstack` by default until eval/safety missions and ML metrics lessons are aligned—avoid “three AI tracks” confusion.

## Routing notes (implementation)

- Track membership lives in `src/content/roles.ts`; titles come from `src/content/seed.ts`.
- Onboarding summaries use `getRoleTrackOnboardingSummary()` so included/excluded lists stay in sync with routing.
- No migration required while IDs are unchanged; display titles/summaries may evolve.

## What we are not claiming

- No single “best language” for 2026—polyglot fluency plus proof beats stack trivia.
- Third-party hiring statistics vary by region and seniority; this doc is a **learning product** draft, not labor-market advice.

## References (for maintainers)

- Stack Overflow Developer Survey — AI use vs trust themes (2024–2025 editions).
- GitHub Octoverse 2025 — TypeScript and AI project growth (summary reports).
- World Economic Forum — Future of Jobs Report 2025 — skills outlook.
- Example posting-frequency writeups (2025–2026) — Python/SQL/TS/Git/CI keyword bands; treat as heuristic only.
