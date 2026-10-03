# PROJECT_CONTEXT.md — ProofPath

## What This Is

An offline-first technical career-readiness and technical learning application designed for software engineering students. It uses active engineering exercises, code sandbox verification, and project deliverables (Proof-First Philosophy) to build validated portfolios.

---

## Startup Sequence

1. Follow [repository-root AGENTS.md](../../AGENTS.md), skipping already loaded files.
   It is the sole instruction authority and owns all domain invariants for this
   repository.
2. Read relevant [lessons](../../tasks/lessons.md); parent workspace guidance is optional.
   Kotlin/Compose conventions do not apply to app-source work in this Expo project.

---

## Directory Map

See [docs/PROJECT_LAYOUT.md](../PROJECT_LAYOUT.md) for the canonical directory map (tree is relative to `ProofPath/`).

---

## Verification Pipeline

Run from the repository root. `npm run verify` is the aggregate content/type/test
gate; `npm run typecheck` is the first focused check for new typed modules.
Use individual content/report/redaction/test scripts for diagnosis rather than
duplicating the aggregate run. Rendering, export, and device claims need separate
evidence. For instruction-only edits, inspect paths, consistency, and final diff.

---

## Content Integrity & Curricular Rules

Canonical rules live in the repository-root `AGENTS.md` → "Content integrity rules".
