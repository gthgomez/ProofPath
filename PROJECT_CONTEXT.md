# PROJECT_CONTEXT.md — CareerForge Mobile

## What This Is

An offline-first technical career-readiness and technical learning application designed for software engineering students. It uses active engineering exercises, code sandbox verification, and project deliverables (Proof-First Philosophy) to build validated portfolios.

---

## Startup Sequence

1. Read `CareerForgeMobile/CLAUDE.md` — this project's agent guidance (TypeScript/React Native/Expo stack, verification commands, content rules).
2. Read this file (`CareerForgeMobile/PROJECT_CONTEXT.md`) — directory map and content integrity rules.
3. Read root `PROJECT_CONTEXT.md` ([PROJECT_CONTEXT.md](file:///c:/Workspace/Project_Android/PROJECT_CONTEXT.md)) for workspace-wide context (note: CareerForgeMobile is the Expo/RN entry; the Kotlin/Compose "Shared Tech Stack" does not apply).
4. Skip root `AGENTS.md` and root `CLAUDE.md` — they target Kotlin/Compose/Gradle Android apps and their patterns (FileProvider, Play Billing, Gradle verification) do not apply to this TypeScript/React Native project.

---

## Directory Map

See `docs/PROJECT_LAYOUT.md` for the canonical directory map (tree is relative to `CareerForgeMobile/`).

---

## Verification Pipeline

Always verify content modifications using the following command suite inside `CareerForgeMobile/`:

* **Validate Content Integrity:**
  `npm run validate:content`
* **Generate Curriculum Audit Report:**
  `npm run report:content`
* **Scan Sandbox Policies:**
  `npm run scan:redaction`
* **Run Unit/Integration Tests:**
  `npm run test`
* **Full verification pipeline:**
  `npm run verify`

---

## Content Integrity & Curricular Rules

Canonical rules live in `CLAUDE.md` → "Content Integrity Rules".
