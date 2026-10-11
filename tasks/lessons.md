# Lessons

## 2026-09-23 — Typecheck before vitest on new modules

- **What went wrong:** New domain module's sort helper had a callback-contract mismatch (arrows expected `ScoredHit<T>`, function passed bare `T`). Went straight to `vitest run`; esbuild strips types without checking, so the mismatch surfaced as `Cannot read properties of undefined (reading 'concept')` inside `Array.sort` — only on score ties — costing a long misdirected debugging session (stack lines also drifted due to repeated edits between runs).
- **Why:** `npx tsc --noEmit` is listed *first* in the verification pipeline for this reason; vitest alone gives zero type safety on new code.
- **How to prevent:** For any new source module, run `npx tsc --noEmit` before the first `vitest run`. When a runtime error contradicts obviously-correct code, stop reading and typecheck — a contract mismatch produces exactly this signature.

## 2026-10-11 — Test runner selection, not just runner behavior

- **What went wrong:** The offline regex Python runner was correct in unit tests (`runNativePythonProof` called directly), but the *selection gate* `canRunNativePythonProof` rejected comment-only verifier checks — the standard level-0/1 teaching style. Every beginner lesson, including the sample lesson, silently fell through to the WebView Pyodide runner, which on an offline device cold-booted past the startup allowance and timed out three times in a row (24000 ms each) before showing any feedback. No test covered the gate, only the runner.
- **Why:** Two components were tested in isolation while their composition — "which runner does this lesson get?" — had no coverage. The gate's acceptance predicate drifted from the runner's actual capability (comment-only checks execute fine as no-ops and are judged on captured stdout).
- **How to prevent:** When a component has a selector/dispatcher in front of it, regression-test the selector over the real content pack (see `tests/native-python-runner-selection.test.ts`), not only the implementation. Verify runner selection on a real native surface before claiming offline capability; web-journey tests always exercise the web runner and cannot catch native-only selection bugs.
