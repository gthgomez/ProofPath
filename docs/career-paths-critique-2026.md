# Career paths adversarial critique (2026)

Adversarial review of CareerForge’s three stable role IDs (`role-junior-swe`, `role-python-fullstack`, `role-ai-app-fullstack`) against common CS-student “pick your lane” patterns in 2026. Grounded in `docs/career-paths-2026.md`, `src/content/roles.ts`, `src/content/seed.ts` (seven tracks, six in routing), and `app/onboarding.tsx`.

This is a **product and pedagogy** critique—not labor-market advice. Stable role IDs may stay; positioning, gating, and onboarding copy may not.

---

## Executive summary

The current triad is **market-plausible** but **weakly differentiated at the track-set level**: all three paths are permutations of five shared tracks with one swap (`track-ai-tools` vs `track-ai-apps`) and ordering changes. Differentiation lives in copy and mission emphasis—easy to miss on a phone. The app’s **readiness model already favors portfolio proof** (missions 40%, evidence 30%, lessons/quizzes 20%); onboarding still **reads like course catalog selection**, which fights that model.

**Top recommendation:** Keep the three role IDs for routing/progress, but reframe onboarding around **“first proof you will ship in 14 days”** (artifact archetype), not job titles. Gate **Practical AI Apps** and any future **ML Foundations** on readiness thresholds, not path membership alone. Collapse mobile onboarding to one screen: three cards × (pitch + first mission + “not yet” list hidden behind expand).

**Merge conflicts to resolve:** job-title honesty vs aspirational labels; whether excluded-track lists belong in first-run UX; default path when users skip onboarding; when `track-ml` attaches.

---

## Common failure modes (3-path models for CS students, 2026)

### 1. Overlap traps (reordered tracks, not distinct paths)

**Pattern:** Three cards that differ only by track order or one elective swap while sharing ~80% of curriculum.

**CareerForge today:**  
| Role | `trackIds` (order) |
| --- | --- |
| Junior SWE | python → typescript → sql → git → **ai-tools** |
| Python backend & full-stack | python → sql → typescript → git → **ai-apps** |
| AI product engineer | typescript → **ai-tools** → **ai-apps** → sql → python → git |

All paths include Python, TypeScript, SQL, and Git. Two paths include both AI tracks in practice only via exclusion lists—Junior excludes `track-ai-apps`; Python path excludes `track-ai-tools`; AI path includes both. **Only one track differs by membership** between Junior and Python paths; AI path is “both AI tracks + TS first.”

**Risk:** Learners choose based on **identity** (“I’m an AI person”) and get nearly the same graph. Coaches and reviewers cannot tell paths apart from transcripts without track-order metadata.

**Mitigation already in doc but underpowered in UI:** “Overlap reduction” paragraphs in `career-paths-2026.md` are not visible at choice time—onboarding shows **full included and excluded track title lists** per card (`getRoleTrackOnboardingSummary`), which reinforces “these are different degrees” when they are mostly the same syllabus.

### 2. Fake progression (senior framing before fundamentals are proven)

**Pattern:** Paths named or sequenced like mid-level roles (product engineer, full-stack) while week-1–2 content is still values, functions, and first Code Lab.

**CareerForge today:**

- **AI product engineer** leads with TypeScript + “AI verification habits” and Portfolio “safety/eval decision”—correct *topic* emphasis for 2026 hiring, but the **title** implies shipping production LLM features before CLI/SQL/Git proof exists in other paths.
- **Python backend & full-stack** promises “APIs, data modeling, services” while first actions are still first Python lesson + mission logging—appropriate if framed as *target job family*, misleading if read as *current skill level*.
- Readiness scoring **caps** users without missions/evidence (`readiness.ts`: no projects → max 59; no evidence → max 69). That is good engineering—but **onboarding never mentions the cap**, so users can select “AI product engineer,” complete lessons, and still feel misled by a low “% ready” label.

**2026 market reality:** Fewer pure CRUD-junior slots; more emphasis on proof—but **employers still hire interns on fundamentals + one credible artifact**, not on RAG architecture vocabulary alone.

### 3. AI → ML pipeline myths vs job reality

**Pattern:** “Learn AI apps now, add ML later → ML engineer” implied pipeline.

**CareerForge today (mostly healthy):**

- `track-ml` exists in `seed.ts` but is **excluded from all role `trackIds`**; doc defers ML to phase 2.
- **Risk remains:** Two AI tracks (`track-ai-tools`, `track-ai-apps`) plus a future `track-ml` can read as “AI career ladder” in onboarding excluded lists (“ML Foundations … phase 2”), especially on the AI path card that already lists two AI tracks.
- **Job reality (2026 heuristic):** Most junior/full-stack postings want Python/SQL/TS/Git/API proof; **LLM feature work** is a slice of product teams, not the default intern loop; **ML engineer** hiring expects projects (training, eval rigor, deployment) this app does not yet simulate—doc acknowledges this.

**Do not promise:** completing Practical AI Apps + deferred ML track ≈ ML engineer readiness.

### 4. Portfolio evidence vs course completion

**Pattern:** UI celebrates lesson/quiz progress; hiring celebrates **verifier output, repo, README, failure stories**.

**CareerForge today (strong backend, weak first-run story):**

- Readiness weights: projects 40%, evidence 30%, lessons 10%, quizzes 10%, review 10%.
- Evidence quality scoring rewards repo, commit hash, passing tests, verifier output, README, reflection (`evidenceQuality` in `readiness.ts`).
- Onboarding copy mentions Portfolio in `firstAction` strings but **choice UI emphasizes track lists** (5 titles + excluded list per card).

**Gap:** A learner can optimize **lesson completion** and still be “building” with a misleading sense of progress unless they hit mission + evidence gates—those gates are on the dashboard/readiness screen, not the career-target decision.

### 5. Information overload in mobile onboarding

**Pattern:** First-run screen asks users to compare three multi-paragraph product specs.

**CareerForge today (`app/onboarding.tsx` per card):**

- Outcome summary (`target.summary`)
- “N learning tracks:” + comma-separated **five** included titles
- “Not in this path:” + excluded titles (up to two for most paths)
- “Best for:” long sentence
- “First action:” long sentence
- CTA

On a narrow viewport this is **~6 text blocks + button** × 3 cards ≈ catalog shopping, not commitment to one proof artifact.

**Principle:** Mobile onboarding should fit **one glance per path** (≤40 words visible) with optional “compare tracks” drawer.

---

## Scorecard: current three roles

Scores 1 (weak) – 5 (strong). Criteria defined for repeatability when merging with research/architecture docs.

| Role ID | Differentiation | Market fit | Beginner clarity | Notes |
| --- | ---: | ---: | ---: | --- |
| `role-junior-swe` (default) | **3** | **5** | **4** | Best default for “I don’t know yet”; breadth matches intern postings; still shares most tracks with siblings. |
| `role-python-fullstack` | **2** | **4** | **3** | Credible for backend-leaning JDs; hardest to distinguish from Junior without reading excluded tracks; “full-stack” in title oversells early weeks. |
| `role-ai-app-fullstack` | **3** | **3** | **2** | Differentiated by **dual AI tracks + TS-first order**; market fit is real but **niche and regional**; title and week-1 AI eval language scare beginners and attract the wrong expectation (ML/model training). |

**Aggregate:** Differentiation **~2.7**, market fit **~4**, beginner clarity **~3**.

---

## Alternative path triads (not the current three)

Each triad is a **positioning alternative**—would require new copy and possibly different `trackIds` ordering or gating, not necessarily new content.

### Triad A — **Proof archetype** (artifact-first, job-agnostic)

| Path | One-line pitch |
| --- | --- |
| **CLI & data proof** | Ship a small Python command-line tool with tests and a README a reviewer can run locally. |
| **Web contract proof** | Ship a typed UI + API-shaped data story with one happy path and one handled failure in the browser. |
| **AI feature proof** | Ship one LLM-backed feature slice with an eval note and a explicit “won’t ship” guardrail—no model training. |

| Pros | Cons |
| --- | --- |
| Aligns with readiness scoring (missions + evidence). | Does not map 1:1 to LinkedIn job titles; needs translation layer for career services. |
| Reduces “fake senior” branding. | May feel vague to students seeking identity labels. |
| Works on mobile: three short pitches. | Requires remapping existing role IDs to archetypes in copy only, or renaming in UI. |

### Triad B — **Hiring funnel** (stage-first, not stack-first)

| Path | One-line pitch |
| --- | --- |
| **Explore & fundamentals** | First internship prep: Python, Git, one verifier, one Portfolio note—defer AI product depth. |
| **Intern-ready generalist** | Balanced proof across Python, TS, SQL, Git, and how you verify AI-assisted code. |
| **Specialist pivot (post-proof)** | Unlocks after readiness ≥35: choose backend depth *or* AI product depth—not both at week 1. |

| Pros | Cons |
| --- | --- |
| Honest about sequencing; reduces overlap trap at choice time. | “Specialist pivot” is two paths collapsed—needs clear unlock UX. |
| Matches fewer junior slots + more proof pressure. | Weaker appeal for students who want to pick “AI” on day 1. |
| Pairs naturally with readiness-gated tracks. | Implementation: second onboarding moment or Settings gate. |

### Triad C — **Constraint & context** (learner situation, not employer brand)

| Path | One-line pitch |
| --- | --- |
| **Phone-first cadence** | Short daily lessons, one sandbox proof at a time—minimize setup friction. |
| **Laptop project cadence** | Missions expect local repo, CLI, and richer Portfolio artifacts. |
| **Career switch (time-boxed)** | 8-week plan: one mission chain, skip optional breadth until first hire signal artifact ships. |

| Pros | Cons |
| --- | --- |
| Reduces overload by matching device/reality. | Does not align to job postings directly—needs secondary “also maps to…” mapping. |
| Good for mobile product truth (sandbox limits). | Harder to maintain three parallel weekly plans in content. |
| Surfaces honest limits of mobile Code Lab vs desktop Git. | May duplicate “Today plan” features if not careful. |

**Not recommended as primary triad for CareerForge:** pure language splits (Python vs Java vs Go)—content pack is polyglot Python/TS/SQL by design.

---

## Recommended gating philosophy

### Principle

**Path choice = planning bias; readiness = permission to claim job-family skills.**

| Mechanism | Use for | Avoid for |
| --- | --- | --- |
| **Completion-based** (lesson/quiz checkboxes) | Ordering within a track; unlocking next module in a sequence. | Declaring “backend-ready” or “AI product-ready”; unlocking `track-ml`. |
| **Readiness-score-based** (existing formula) | Surfacing “portfolio-ready” label; unlocking **Practical AI Apps** on Junior path, **dual-AI** emphasis, or **ML phase 2**; changing weekly plan aggressiveness. | Blocking first lesson on day 1—kills activation. |
| **Evidence gates** (hard caps already in code) | Any copy that mentions % ready; internship export; future certificates. | Punishing exploration—allow practice lessons without evidence. |

### Concrete gates (proposed)

1. **Day 0:** Any path; first action always “one passing Code Lab + one Portfolio note” (already in `roleOnboardingCopy`—make it the **only** visible first action on onboarding cards).
2. **Readiness ≥ 25 (“building” mid):** Recommend track swap or “add AI apps phase” in Settings—soft nudge only.
3. **Readiness ≥ 35 + ≥1 mission complete:** Unlock **optional** `track-ai-apps` for `role-junior-swe` users (or prompt switch to python/ai paths)—avoids two AI tracks on confused beginners.
4. **Readiness ≥ 50 + evidence hygiene > 0:** Marketing language may reference “full-stack” or “AI product” **outcomes** in dashboard copy—not in onboarding title.
5. **`track-ml`:** Only via explicit Settings “Add ML phase” after **projectCompletion ≥ 40%** on role-scoped content; default attach to `role-junior-swe` optional sixth track per `career-paths-2026.md`, never default on `role-ai-app-fullstack`.

### Onboarding UX (mobile)

- **Visible:** title (learner-friendly, not job level), one-line pitch, single first action, “5 tracks, details ▾”.
- **Hidden by default:** excluded track list, “best for” essay, market citations.
- **Post-choice:** Today screen shows readiness cap explanation once (`blockingProofRequirement`).

---

## Red lines (what NOT to promise learners)

1. **“You will be hired as an AI/ML engineer after this path.”** RAG/eval lessons ≠ ML hiring bar; `track-ml` is not production-grade ML project simulation.
2. **“This path replaces a CS degree or bootcamp portfolio.”** CareerForge supplements proof-building; it does not place candidates.
3. **“Senior / product engineer titles mean senior-level work in week 1.”** Titles describe **job family targets**, not current seniority.
4. **“Completing all lessons means you’re ready.”** Readiness explicitly caps without missions/evidence—never contradict that in marketing.
5. **“AI-assisted coding means employers trust AI output.”** Market signal is the opposite: trust comes from **human verification**—align with AI-tools track, not “autopilot.”
6. **“Three paths are mutually exclusive careers.”** They are routing presets over shared content; switching roles must stay **non-destructive** (already true)—do not imply wasted progress when switching.
7. **“Regional salary or posting counts guarantee outcomes.”** Doc heuristics are directional only (`career-paths-2026.md` disclaimer)—do not elevate to promises in UI.
8. **“Mobile sandbox equals local dev environment.”** See `docs/sandbox-*`; CLI/Git depth may require desktop follow-through—state in Portfolio expectations.

---

## Top recommendation (for merge)

**Adopt Triad A framing in UX while keeping Triad B gating mechanics**, without changing role IDs in v1:

1. **Rename display titles** (not IDs): e.g. “Junior SWE (broad proof)” → **“Intern generalist”**; “AI product engineer” → **“AI feature proof (TS-led)”**; “Python backend & full-stack” → **“Backend & data proof (Python-led)”**.
2. **Strip track lists from first onboarding screen**; link to a single “Compare tracks” sheet.
3. **Gate `track-ai-apps` and `track-ml`** on readiness + explicit opt-in, matching the existing scoring model instead of path membership alone.
4. **Default remains `role-junior-swe`**—highest clarity and market fit score.

---

## Disagreements to resolve when merging research / architecture

| Topic | This critique | Likely tension in other docs | Resolution question |
| --- | --- | --- | --- |
| **Job titles vs proof titles** | Prefer artifact-first labels in UI. | Research may cite posting titles (“AI engineer”). | Do we optimize for **searchability** (LinkedIn keywords) or **honesty** (week-1 skills)? |
| **AI path market fit** | Score 3/5—niche. | Architecture may prioritize AI differentiation for product story. | Is AI path **growth** or **accuracy**? |
| **Track swap as differentiation** | Insufficient alone; needs gating/missions. | `career-paths-2026.md` leans on order + one track swap. | Do we invest in **path-exclusive missions** or accept copy-only differentiation? |
| **Excluded tracks on onboarding** | Remove from first run. | Transparency / trust arguments. | Show exclusions only in Settings or compare sheet? |
| **`track-ml` attachment** | Junior optional after proof; never default on AI path. | ML content exists in seed—pressure to ship. | Ship ML module to all users in library vs role-gated phase 2? |
| **Readiness vs completion UX** | Readiness is authoritative; lessons are practice. | Lesson-first engagement metrics. | Does dashboard primary CTA stay “next lesson” or “next mission proof”? |
| **Python path skips `track-ai-tools`** | Good for reducing AI noise. | “Everyone must learn Copilot verification” narrative. | Universal short AI verification module outside path choice? |
| **Stable role IDs** | Keep IDs; change copy/gating only. | Brand rename of roles in marketing. | ID stability vs external comms rename? |

---

## References (in-repo)

- `docs/career-paths-2026.md` — product stance and overlap notes  
- `src/content/roles.ts` — `trackIds` and onboarding copy  
- `src/content/seed.ts` — track catalog and `track-ml`  
- `src/domain/readiness.ts` — scoring weights and caps  
- `app/onboarding.tsx` — first-run overload surface  
- `tests/role-routing.test.ts` — included/excluded track summaries  

---

*Draft for maintainer merge. Does not change routing IDs or seed data.*
