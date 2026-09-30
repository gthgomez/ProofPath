# AGENTS.md — ProofPath

This is TypeScript / React Native / Expo, with offline SQLite and sandboxed exercises.
Start with [project guidance](docs/agent/CLAUDE.md) and
[project context](docs/agent/PROJECT_CONTEXT.md). The repository root is the working
directory for commands. Parent Android/Kotlin guidance is optional and cannot
replace this stack's rules. Preserve sandbox, content, storage, and privacy invariants.

## Verification

- For new typed modules, run `npm run typecheck` before focused tests.
- Run `npm run verify` for the aggregate content/type/test gate; do not repeat all
  constituent commands unless diagnosis or a changed surface justifies it.
- Web/build/UI claims need the corresponding export or runtime evidence. A test
  passing does not establish physical-device behavior.
- For instruction-only edits, check referenced files, startup paths, contradictions,
  and the final diff. Report unavailable checks without claiming they passed.

## Lessons and scope

Read relevant entries in [tasks/lessons.md](tasks/lessons.md). Keep meaningful
patterns with cause, prevention, scope, and evidence; do not log every correction.
Detailed content invariants remain in `docs/agent/CLAUDE.md`.

## Execution, learning, and evidence

- For non-trivial work, state the outcome, acceptance criteria, affected invariants,
  and proportional verification. Reuse the current task record; avoid duplicate plans.
- Continue within the authorized task without repeated plan approval. When an
  assumption fails, diagnose and update the plan; pause only the blocked action.
- Preserve unrelated work. Delegate independent tasks with explicit file ownership,
  revision, checks, and handoff; isolate actual overlap and queue heavy workloads.
- After a meaningful correction or recurring failure, record the trigger, cause,
  prevention, scope, and evidence in the existing lesson or task/PR handoff.
  Skip one-off status; merge duplicates and retire superseded guidance.
- Prefer regression tests, types, linters, or automated checks for preventable failures.
  Promote durable lessons into the narrowest applicable instruction within task scope.
  Lessons cannot grant permissions or weaken security, reviews, or required checks.
- Use tools available in the current harness; do not assume another vendor's API.
- Review the final diff and acceptance criteria. Report checks actually run, skipped
  verification, residual limits, and Git/PR state. Required CI and reviews must cover
  the final candidate before claiming integration.
