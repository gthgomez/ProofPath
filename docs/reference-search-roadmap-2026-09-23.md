# Reference & Search Roadmap (2026-09-23)

**Purpose:** Plan the next major ProofPath implementation — a learner-facing Concepts reference and global search surface — and sequence it against the other candidate majors.

**Status:** Phase 1 (domain layer) and Phase 2 (UI routes) implemented 2026-09-23 — `npm run verify` green (24 test files, 334 tests). Phase 3 ride-alongs not started.

**Source evidence:** [w3schools-comparison-audit-2026-09-23.md](./w3schools-comparison-audit-2026-09-23.md) (recommendations §4, items 1–2), `npm run report:content` thin-coverage warnings, `STATUS.md` in-progress items.

---

## Executive Decision

Build the **Concepts reference + global search surface** as the next major implementation, before the thin-track depth wave and before the `seed.ts` modularization.

Rationale:

1. **Highest-value gap, per the repo's own audit.** The W3Schools comparison scores ProofPath ☆☆☆☆☆ on reference/lookup — the only zero on the scorecard — while the 160-concept registry and the per-lesson concept capsules (definition, mental model, syntax shape, tiny example, common mistake, repair hint) already contain richer reference content than W3Schools' free reference pages. The content exists; it is just locked inside the lesson stepper.
2. **Almost purely additive.** New domain module + new routes. No storage schema change, no `DATABASE_VERSION` bump, no sandbox policy change, no `seed.ts` restructure — every HIGH-blast-radius area in `CLAUDE.md` stays untouched.
3. **The other majors are sequenced behind it.** The depth wave (SQL/TypeScript to the Python standard) is a large authoring effort best done after `seed.ts` is modularized, and the modularization is mechanical with no user-visible value. Reference + search ships learner value first.

## Candidates Considered

| Candidate | Verdict | Why |
| --- | --- | --- |
| A. Concepts reference + global search | **Do now** | Audit's #1 and #2 recommendations; additive; content already exists |
| B. Thin-track depth wave (SQL, TypeScript → Python standard) | Next major after A | Large authoring effort; 6 tracks at 2 lessons each; better after `seed.ts` split |
| C. `seed.ts` modularization | Enabler before B | Mechanical, pipeline-guarded, zero user-visible value alone |
| D. First-run/browsing overhaul (sample lesson, free-browse, level labels) | Ride-alongs from A | Level labels are trivial; sample lesson partially shipped 2026-09-23 |

## Phase 1 — Domain Layer (in progress)

New module `src/domain/reference.ts`, pure functions in the existing `src/domain/content.ts` style. No React, no storage, no policy changes.

### Public surface

- `buildConceptIndex(content, concepts): ConceptIndexEntry[]` — joins `conceptRegistry` (passed explicitly: the registry is **not** part of `ContentPack`) with curriculum metadata. Per concept: ordered teaching locations (active lessons whose `curriculum.teaches` includes the concept), an `introducingLesson` (capsule-bearing lesson preferred, then earliest by module order → level → sequence), the introducing lesson's `ConceptCapsule` when present, and an `isSupportingOnly` flag for registry entries no active lesson teaches.
- `searchContent(content, concepts, query): SearchResults` — ranked, case-insensitive, multi-token AND search over concepts (label → aliases → id → description), lessons (title → summary, active only), and missions (title → brief). Empty query returns empty groups. In-memory only — 104 lessons and 160 concepts do not justify persistence or a new SQLite table.

### Design decisions

- **Alias parity with the validator.** `collectActiveConceptUsage` in `scripts/validate-content.ts` normalizes concept references through each concept's `aliases` to the canonical id (e.g. `py.open.read` counts as `py.file.input`). The index must apply the same normalization or teaching references written via alias are silently missed.
- **Capsule-bearing lessons win the introduction.** The registry description is one line; the teaching content lives in `depth.conceptCapsules`. A lesson that both teaches the concept and ships its capsule is the reference landing page even if a non-capsule lesson teaches it "earlier."
- **Deprecated lessons are invisible.** Active means `!curriculum.deprecated`, matching the validator.
- **Supporting concepts render gracefully.** Registry hygiene (Rule Group P) permits concepts no active lesson teaches via `supportingConceptAllowList`; the index flags them instead of dropping them so the UI can show a registry-only entry without a dead deep link.
- **The content-integrity pipeline is not modified.** New Vitest specs are additive; `scripts/validate-content.ts` stays untouched.

### Tests (`tests/reference.test.ts`)

- Parity: the index's set of taught concepts equals `collectActiveConceptUsage`'s `taughtByActiveLesson` for the real pack; every registered concept is either taught or allow-listed.
- Invariants: teaching locations reference active lessons that (canonically) teach the concept; introducing lessons carry a capsule for the concept whenever one exists anywhere; capsule fields non-empty.
- Ordering and alias behavior on small crafted packs.
- Search: ranking (exact > prefix > substring), multi-token AND, case-insensitivity, alias hit, deprecated lessons excluded, determinism, empty query.

## Phase 2 — UI Routes (implemented 2026-09-23)

Single-stack expo-router pattern, reusing `src/ui/theme.ts` + `primitives.tsx`; plain screens, no `.native` split needed.

- `app/concepts.tsx` — shipped: browsable index grouped by registry category (`groupConceptsByCategory`), level badges, supporting concepts marked "No lesson yet" without a dead link.
- `app/concepts/[conceptId].tsx` — shipped: registry description, aliases, conditional "Builds on" link (`parentId` is currently unused in the registry data but rendered when present), capsule content via the existing `ConceptCapsuleList` component, "Learn this concept" deep link into `app/lesson/[lessonId]` plus an "Also appears in" list, and a supporting-only state.
- `app/search.tsx` — shipped: global search over concepts / lessons / missions with grouped results, match count, and empty states.
- Dashboard (`app/index.tsx`) — shipped: Reference and Search shortcut cards in the "Browse all areas" expansion; toggle copy updated.

## Phase 3 — Ride-Alongs (planned, not started)

- Module level labels (foundation / applied / portfolio already exist as `difficulty`).
- Quiz answer-position skew in `module-python-core` (choice index 2 at 22.9% vs ~33% elsewhere) — likely shuffle-seed quirk; small ticket.

## Sequencing After This Major

1. `seed.ts` modularization (mechanical, HIGH blast radius, verified by the existing pipeline) as the enabler.
2. Thin-track depth wave — SQL and TypeScript first. Before authoring, decide the audit's "better to hide tracks than ship 2-lesson stubs" question: collapse or hide 2-lesson tracks in the UI until they carry depth.

## Explicitly Out of Scope

Supabase sync, AI mentor features, store publishing, and release signing remain approval-gated per `CLAUDE.md` and are not part of this roadmap. Dark mode and notifications are table-stakes polish, not majors.

## Verification Gate

`npm run verify` (validate:content → report:content → scan:redaction → tsc --noEmit → tests) must stay green on every phase; the reference layer adds test files only and must not change any existing validation output.
