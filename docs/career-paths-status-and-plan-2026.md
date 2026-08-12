# Career Paths Status And Plan, 2026

**Last updated:** 2026-06-01
**Purpose:** Maintainer view of the active CareerForge path taxonomy, current track coverage, and next curriculum work.  
**Code anchors:** `src/content/roles.ts`, `src/content/seed.ts`, `app/onboarding.tsx`, `app/settings.tsx`.

CareerForge now uses active `path-*` career IDs. Older `role-*` strings are no longer the product taxonomy; they are compatibility inputs only and are normalized into the new paths by progress loading/selection code.

See [career-paths-current-curriculum-2026.md](./career-paths-current-curriculum-2026.md) for the concise curriculum and unlock summary.

---

## 1. Active Paths

| Path ID | Display name | Tracks (`trackIds` order) | Default | Status |
| --- | --- | --- | --- | --- |
| `path-software-foundations` | Software Foundations | `track-python`, `track-typescript`, `track-sql`, `track-git`, `track-testing-debugging`, `track-ai-tools` | **Yes** | Shipped default with core proof gate |
| `path-backend-api-data` | Backend, APIs & Data Systems | `track-python`, `track-sql`, `track-typescript`, `track-git` | No | Shipped |
| `path-secure-software-appsec` | Secure Software & AppSec | `track-secure-software`, `track-git`, `track-python`, `track-sql`, `track-typescript`, `track-ai-tools` | No | Shipped with dedicated security track and proof gate |
| `path-ai-product-engineering` | AI Product Engineering | `track-typescript`, `track-ai-tools`, `track-ai-apps`, `track-sql`, `track-python`, `track-git` | No | Shipped |

**Where learners choose paths:** first-run onboarding and Settings > Career path.

**Compatibility:** old locally saved role IDs are normalized:

| Compatibility input | Normalized path |
| --- | --- |
| `role-junior-swe` | `path-software-foundations` |
| `role-python-fullstack` | `path-backend-api-data` |
| `role-ai-app-fullstack` | `path-ai-product-engineering` |

---

## 2. Current Tracks

| Track ID | Title | Current role in curriculum | Phase |
| --- | --- | --- | --- |
| `track-python` | Python Fundamentals | Core for software, backend/data, security, and AI product. | 1 |
| `track-typescript` | TypeScript and Web | Core for software and AI product; supports API/UI contracts plus runtime validation for external data. | 1 |
| `track-sql` | SQL and Postgres | Core for backend/data; required before analytics, data, and ML unlocks. | 1 |
| `track-git` | Git and GitHub | Core evidence path for every learner. | 1 |
| `track-testing-debugging` | Testing and Debugging | Core regression harness and failure-log proof before specialization. | 1 |
| `track-ai-tools` | AI-Assisted Coding | AI-output verification, test harness thinking, review discipline. | 1 |
| `track-secure-software` | Secure Software | AppSec foundation: threat notes, secrets, auth, access control, validation, output encoding, dependency/logging hygiene. | 1/2 |
| `track-ai-apps` | Practical AI Apps | RAG/evals/guardrails for AI Product; also a backend unlock. | 1/2 |
| `track-ml` | ML Foundations | Present in catalog; keep behind proof gates. | 2+ |
| `track-cloud-platform-basics` | Cloud Platform Basics | Backend/security unlock: config, CI release gates, rollback drills, logs, cost. | 2 |
| `track-data-systems` | Data Systems | Backend/data unlock: quality rules, dataset contracts, rejected-row proof, lineage, reproducible reports. | 2 |

---

## 3. What Ships Today

- Path selection changes track order, Today recommendations, missions shown first, weekly plan scope, and readiness scoring.
- Switching paths does not delete completed work.
- Readiness still favors mission/evidence proof over lesson checkboxes.
- Learn now shows path-level proof gates and future unlock labels: `Locked specialization`, `Roadmap`, and `Coming later`.
- `track-secure-software`, `track-testing-debugging`, `track-cloud-platform-basics`, and `track-data-systems` are implemented as real curriculum content with staged mini-arcs and repeated practice reps in the thinnest non-Python areas.
- `track-ml` remains advanced/unwired by default; do not market it as a beginner ML engineer path.

---

## 4. Roadmap Priorities

| Priority | Work | Reason |
| --- | --- | --- |
| 1 | Continue deepening `track-secure-software` | Access-control and output-encoding labs now exist; add broader exploit/fix variations and OWASP-style review depth after review-pack proof. |
| 2 | Continue deepening `track-data-systems` | Dataset contracts and rejected-row proof now exist; add analytics/data-system depth beyond lineage and reproducible reports. |
| 3 | Add `track-analytics-systems` | Backend/data should open decision systems only after data-system proof exists. |
| 4 | Deepen Backend -> AI/Data/Cloud/ML unlock UX | Backend is the cleanest bridge into AI product, data systems, cloud/platform, and ML/model literacy. |
| 5 | Anti-hype copy audit | Remove job guarantees, ML conflation, cloud-architect beginner claims, and standalone prompt-engineering claims. |

---

## 5. Path Unlock Model

1. **Start with Software Foundations** when the learner is unsure.
2. **Choose Backend, APIs & Data Systems** for APIs, SQL, service contracts, and data-backed software.
3. **Choose Secure Software & AppSec** for secure coding, secrets, auth, dependency hygiene, and threat notes.
4. **Choose AI Product Engineering** for RAG, evals, guardrails, TypeScript product surfaces, and AI reliability proof.

After Backend, the strongest next unlocks are:

- **AI Product Engineering** after API/data/test proof.
- **Data & Analytics Systems** after SQL/data-quality proof.
- **Cloud & Platform Systems** after CLI/Git/API/deploy proof.
- **ML & Model Literacy** after data/testing/eval proof.

After Security, unlock AppSec depth, cloud security, AI security, and privacy/security governance.

After AI Product, unlock AI platform/product systems, ML/model literacy, product analytics, and AI security.

---

## 6. Claims Guardrails

Use:

- "Build evidence before choosing a durable direction."
- "Backend, data, security, and AI verification are the 2026 spine."
- "AI Product Engineering is application-layer AI, not ML research."

Avoid:

- "Junior SWE path."
- "Python full-stack path."
- "Become an AI engineer."
- "ML engineer from beginner lessons."
- "Cloud architect as a beginner path."
- Any job guarantee, salary promise, or standalone prompt-engineering career claim.

**2026-06-26 Python update (AC5):** Complete 0-9 spine + 3 slices documented. See python-roadmap-2026-05-07.md and the next-design doc.
