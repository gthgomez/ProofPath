# External CS career research review (2026)

**Purpose:** Critique four external research exports against CareerForge Mobile’s authoritative direction.  
**Authority:** [career-paths-status-and-plan-2026.md](./career-paths-status-and-plan-2026.md) (primary), [career-paths-future-roadmap-2026.md](./career-paths-future-roadmap-2026.md), [career-paths-2026.md](./career-paths-2026.md), [career-paths-research-2026.md](./career-paths-research-2026.md).  
**Reviewed:** 2026-05-30. External files read from user Downloads; not committed to this repo.

> **Supersession note, 2026-05-31:** This review originally defended the shipped three-path model because the product needed stable routing. Lessons are now considered not finalized, so the research may drive replacement/addition planning. Use [career-paths-future-roadmap-2026.md](./career-paths-future-roadmap-2026.md) for the current synthesis: add/plan Secure Software & AppSec, expand Backend/API/Data Systems, keep AI Features visible but bounded, and keep cloud/platform plus ML as advanced unlocks.

---

## 1. Authoritative direction (~5 bullets)

- **Current shipped `role-*` paths are routing state, not final taxonomy:** `role-junior-swe` (default), `role-python-fullstack`, `role-ai-app-fullstack` still exist in code, but they may be renamed, expanded, or joined by new paths before lessons are locked.
- **Future path families:** “Software Foundations”, “Backend, APIs & Data Systems”, “Secure Software & AppSec”, and “AI Features & Product Engineering”.
- **Phases:** **1** = titles/copy/readiness-cap UX plus roadmap alignment; **2** = gates, security-habit modules, data-system lessons, differentiator missions, Settings “Add ML phase”; **3** = `role-secure-software` / `track-secure-software`, analytics/data branch, cloud/platform basics, ML/model literacy unlocks.
- **Claims we avoid:** Top-three labor-market ranking; placement guarantees; “finish lessons = job-ready”; Practical AI Apps + future ML ≈ ML engineer.
- **Known market gaps now promoted to roadmap work:** No cyber/AppSec route today and no full data-systems route today; both are now candidates for lesson planning before curriculum lock. `track-ml` remains catalog-only until gates exist.

---

## 2. Per-document critique

### 2.1 `CS Career paths(GPT).md`

| Dimension | Score (1–10) |
| --- | ---: |
| Alignment with authoritative direction | **6** |
| Methodology (evidence, citations, reproducibility) | **8** |
| Actionability for CareerForge | **5** |

**Strengths**

- Strong **proof-based / skills-first** framing (“launch with proof-based beginner ladders, not inflated job titles”) aligned with readiness (missions 40%, evidence 30%).
- **AI product vs ML engineering** distinction matches `track-ai-apps` / deferred `track-ml`.
- **Entry-level realism:** Handshake junior SWE softening, Lightcast ~10% truly entry-level, Stanford/Harvard junior vacancy themes — supports honest copy, not “juniors are gone.”
- **Overlap ~40%** across paths is explicit; matches our intentional shared spine.
- **Evidence table** (BLS, NACE, SO 2025, WEF, GitHub Octoverse) with limitations called out.

**Weaknesses / conflicts**

- Recommends **top-three launch: Software Engineering Foundations + Cybersecurity + merged Data Systems** — not our three `role-*` IDs.
- Elevates **standalone cyber and data-engineering paths**; we defer cyber to phase 3 option A and analyst/data lane to option B.
- **Five-path shortlist** omits a dedicated “Python backend / generalist junior” product shape close to `role-python-fullstack` + default junior path.
- Suggests **~40% content overlap** as healthy v1; we already have ~80% track overlap — risk of misreading as “add more paths” vs “explain overlap.”

**Cherry-pick / hallucination risk**

- Low–medium: Core stats trace to named sources; internal `cite turn` tokens are export artifacts, not verify-by-click in-repo.
- **METR 19% slowdown** on mature OSS tasks is real research but easy to over-weight for mobile lesson design.

**Adopt vs ignore**

- **Adopt:** Proof gates before senior titles; ML as advanced unlock; security as cross-cut + optional later path; junior-market caution in onboarding; portfolio artifact examples (API + tests + deployment story).
- **Now reconsider:** Replacing or expanding the product with stronger Software/Security/Data/AI path families is allowed because lessons are not finalized. Still ignore any implied ranking of our display titles against BLS occupation titles.

---

### 2.2 `2026+ CS Career Outlook for Mobile Learning App(Copilot).md`

| Dimension | Score (1–10) |
| --- | ---: |
| Alignment | **4** |
| Methodology | **5** |
| Actionability | **4** |

**Strengths**

- Same **macro narrative** as GPT export (splitting market, AI raises the entry bar, verification matters).
- **Learner-facing capstone table** (App Builder, Cloud Architect, Digital Defender, etc.) useful as mission naming inspiration.
- Acknowledges **AI fluency as baseline** without making “prompt engineer” a path (aligned with our `track-ai-tools` stance).
- **Mobile-learning design** section (modular projects, rubrics) transferable to onboarding/Portfolio UX.

**Weaknesses / conflicts**

- **Top three: Software Engineering + Cloud/Platform + Cybersecurity** — pushes **cloud/platform as #2 launch path**; we have no platform track and no phase-1 plan for one.
- Ranked shortlist puts **Cloud/Platform #2** and **Data Engineering #4** above nuanced treatment of **generalist junior** and our **Python-backend** story.
- **BLS “22–26% growth” and “300,000+ annual openings”** for software developers are **inconsistent** with OOH wording used elsewhere (GPT uses 16% / 129,200 — closer to standard OOH tables). Treat Copilot growth figures as **unverified**.
- Heavy reliance on **LinkedIn articles, Dice, Coursera, codewave.com, elearningfaculty.org** — weak for frequency claims.
- Recommends **certification pathways** (CompTIA, AWS) as product integration — out of scope for current CareerForge spine.

**Cherry-pick / hallucination risk**

- **Medium–high:** Salary bands ($95k–$220k+) without consistent occupation mapping; “143%+ YoY” AI engineer growth from LinkedIn; “94% enterprise cloud adoption” unsourced in body.
- **“71% of U.S. tech job postings require AI skills”** (Dice) — may not match NACE “one-third entry-level” framing; don’t merge without primary read.

**Adopt vs ignore**

- **Adopt:** Capstone one-liners for missions; cross-cutting “AI-integrated content” = our verification track; skills-based hiring emphasis for Portfolio copy.
- **Ignore:** Cloud/platform as a primary path; certification roadmaps; top-three launch set; unchecked BLS/opening multiples.

---

### 2.3 `Research CS career(Meta).md`

| Dimension | Score (1–10) |
| --- | ---: |
| Alignment | **5** |
| Methodology | **6** |
| Actionability | **6** |

**Strengths**

- **Backend / API path** narrative (SQL, auth, containers, CI) maps cleanly to **`role-python-fullstack`** emphasis and shared SQL/Git spine.
- **AI Product Engineering** as separate from ML with “API composition + evals” matches **`role-ai-app-fullstack`** and `track-ai-apps` vs deferred `track-ml`.
- **ML/MLOps RED as starting path** aligns with phase-2 ML gating.
- **Evidence table** with BLS rows (15% software developers, 33% security analysts) and explicit “Hard / Medium” labels.
- **Shared CS core** list (Git, CLI, Python, SQL, HTTP, testing, security basics, AI-assist hygiene) matches phase-2 security-habit plan.

**Weaknesses / conflicts**

- **Top five shortlist ranks Cybersecurity #1**; **likely top three = Backend API Builder, Secure Software Fundamentals, Data Pipelines** — no **default generalist junior** path equivalent to `role-junior-swe`.
- **General Software Engineering = YELLOW** — conflicts with our default path (renamed “Software foundations,” still central).
- Uses **Stack Overflow 2024** (76% AI use) in places where authoritative in-repo research standardizes on **2025** trust-gap data.
- **Cloud/Platform #4** in top five — again not in our track catalog.

**Cherry-pick / hallucination risk**

- **Medium:** “Entry-level share fell to 7.4%” and senior 43.1% — plausible but needs primary Lightcast/Indeed link before product claims.
- **CIO “junior demand softens”** as medium evidence — fine for internal copy, not learner-facing guarantee.

**Adopt vs ignore**

- **Adopt:** Backend/API portfolio spec for Python path missions; OWASP/threat-model project template for phase-2 security modules; “prompt engineer not standalone” messaging.
- **Now reconsider:** Cyber and data pipelines are valid roadmap additions. Still ignore demoting generalist SWE to YELLOW and treating cloud/platform as a day-one path.

---

### 2.4 `CS Career Paths for Mobile Learning(Gemini).md`

| Dimension | Score (1–10) |
| --- | ---: |
| Alignment | **3** |
| Methodology | **4** |
| Actionability | **3** |

**Strengths**

- **Verification / debugging paradox** (SO: 84% use AI, 66% frustrated with “almost right”) supports **`track-ai-tools`** and readiness weighting.
- **Full-stack web → rebrand to AI Product Engineering** rhymes with our phase-1 rename away from inflated “AI product engineer” seniority (wording fix, not path elimination).
- **Platform overlap warning** (merge backend into AI product) flags real **~80% overlap** problem — useful for critique/onboarding copy, not for collapsing our three IDs.
- Explicit **mobile UX constraints** (K8s/terminal hard on phone) matches pragmatic scope control.

**Weaknesses / conflicts**

- **Top 3 launch: AI Product Engineering, Cybersecurity, Platform/Cloud** — contradicts **default `role-junior-swe`** and excludes **Python-backend** as a first-class story.
- **Cybersecurity ranked #1** with **“346% above national rate”** (CompTIA) — likely **misread or cherry-picked** growth metric; not in our phase-1–2 plan as a path.
- **QA Automation = RED** (“irresponsible to recommend”) — we still teach testing/evidence via missions; don’t adopt anti-QA career messaging.
- **Data Analytics = GRAY** (“largely obsolete”) — conflicts with our phase-3 **analyst-first** option and SQL-in-all-paths stance.
- **“290,000+ AI job openings” / “2.9 lakh”** and **CompTIA “323,000 replacement workers annually”** — regional/mixed units; unsuitable for US-first product claims without audit.

**Cherry-pick / hallucination risk**

- **High:** CompTIA **346%** cyber growth, **15–30% drop in traditional junior hiring** (AIMagicX), **QA layoff narrative** from Reddit/TestDino blogs, **$170k median data engineer by 2026** (Medium), **100k humanoid robots** — treat as **non-authoritative** until verified against primary reports.

**Adopt vs ignore**

- **Adopt:** SO trust-gap language for AI-assisted coding lessons; “proof-based path names” principle; ML strictly advanced unlock (already our plan).
- **Ignore:** Path ranking and top-3 launch set; QA/analytics verdicts; cyber-first default; merge backend into single AI track; sensational growth multipliers.

---

## 3. Overall ranking (informing product)

| Rank | Document | One-sentence justification |
| ---: | --- | --- |
| **1** | GPT | Best-sourced and closest to in-repo research on AI verification, ML deferral, and entry-level realism — wrong path taxonomy but safest for principles. |
| **2** | Meta | Shorter, decent BLS framing and backend/AI-product split useful for mission design — wrong top-3 launch and underweights generalist default. |
| **3** | Copilot | Readable product templates but weaker sources and harmful cloud-as-#2 launch bias. |
| **4** | Gemini | Highest sensational-stat and blog/Reddit risk; recommends launch mix that conflicts with shipped `role-*` model. |

---

## 4. Cross-doc synthesis

### Where all four agree with us

- **Fundamentals + proof + AI judgment** beat buzzword-only stacks.
- **AI-assisted coding is common; trusting raw output is not** (Stack Overflow theme).
- **ML engineering ≠ AI application / LLM product work**; ML should not be marketed as day-one outcome.
- **“Prompt engineer” alone is a poor top-level career.**
- **Portfolio / skills-based hiring** matter more than checkbox credentials.
- **Junior/generalist entry is tighter** than 2021–2022 boom (various Handshake/Stanford/Lightcast-style claims).
- **Security habits** belong in engineering education (WEF cyber skill rise).

### Where they disagree with each other

| Topic | GPT | Copilot | Meta | Gemini |
| --- | --- | --- | --- | --- |
| Best top-3 launch | SWE + Cyber + Data | SWE + **Cloud** + Cyber | **Backend** + Cyber + Data | **AI Product** + Cyber + **Platform** |
| Default for undecided | SWE Foundations | Software Engineering | Backend API Builder | **AI Product Engineering** |
| Data/analytics | Top-5 path; merge for lean v1 | Separate #5 path | Merge into DE | Analytics **GRAY/obsolete** |
| Cloud/platform | Advanced / YELLOW | **#2 path** | YELLOW #4 | **#3 launch** |
| Generalist junior SWE | #1 GREEN | #1 | YELLOW | GRAY / deprecate full-stack |

### Unplanned product pushes (flag only — not in status-and-plan)

- **Top-level cybersecurity path** as v1 or v2 (now promoted to roadmap candidate).
- **Top-level data engineering or “Data Systems” path** (now promoted through Backend, APIs & Data Systems).
- **Top-level cloud/platform/DevOps path** (no track; not planned).
- **Replace or demote `role-junior-swe`** in favor of backend-only or AI-product-default routing.
- **Merge backend + AI product** into one track (we intentionally split `track-ai-tools` vs `track-ai-apps` across roles).
- **Standalone QA career path** or **discard analytics** as a lane (we defer analyst path, not dismiss it).
- **Certification-first readiness** (CompTIA/AWS/Google) as core product mechanics.

---

## 5. Archive / discard / appendix

| Document | Recommendation |
| --- | --- |
| GPT | **Use as primary external influence** for proof-first architecture, security/data additions, and entry-level realism. |
| Meta | **Use as secondary influence** for backend/API, secure software, data pipelines, and AI-product mission templates. |
| Copilot | **Optional archive** for capstone naming only; do not use for stats or path count. |
| Gemini | **Do not use for product decisions** (high cherry-pick risk); discard or keep only as anti-pattern example. |

### Suggested appendix paragraph (`career-paths-status-and-plan-2026.md`)

> **External research review (updated 2026-05-31):** Four third-party CS career exports were compared to CareerForge planning. All supported proof-first learning, AI verification over prompt-only skills, and deferring ML engineering as an outcome. Because lessons are not finalized, the research now justifies roadmap changes: promote **Secure Software & AppSec**, expand **Backend, APIs & Data Systems**, keep **AI Features & Product Engineering** visible but bounded, and keep cloud/platform plus ML as advanced unlocks. Only the GPT export met the strongest evidence standard; the Gemini export contained unverified growth multipliers (e.g. “346%” cyber) and should not drive ranking. Full future synthesis: [career-paths-future-roadmap-2026.md](./career-paths-future-roadmap-2026.md).

---

## 6. Document metadata

- **Does not** change `roles.ts`, routing, or learner-facing copy.
- **Next step (optional):** Replicate GPT’s suggested “200 junior postings” audit scoped to our three path clusters before phase 3.
