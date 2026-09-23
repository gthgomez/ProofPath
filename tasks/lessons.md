# Lessons

## 2026-09-23 — Typecheck before vitest on new modules

- **What went wrong:** New domain module's sort helper had a callback-contract mismatch (arrows expected `ScoredHit<T>`, function passed bare `T`). Went straight to `vitest run`; esbuild strips types without checking, so the mismatch surfaced as `Cannot read properties of undefined (reading 'concept')` inside `Array.sort` — only on score ties — costing a long misdirected debugging session (stack lines also drifted due to repeated edits between runs).
- **Why:** `npx tsc --noEmit` is listed *first* in the verification pipeline for this reason; vitest alone gives zero type safety on new code.
- **How to prevent:** For any new source module, run `npx tsc --noEmit` before the first `vitest run`. When a runtime error contradicts obviously-correct code, stop reading and typecheck — a contract mismatch produces exactly this signature.
