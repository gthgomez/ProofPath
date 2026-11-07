# Lessons

## 2026-09-23 — Typecheck before vitest on new modules

- **What went wrong:** New domain module's sort helper had a callback-contract mismatch (arrows expected `ScoredHit<T>`, function passed bare `T`). Went straight to `vitest run`; esbuild strips types without checking, so the mismatch surfaced as `Cannot read properties of undefined (reading 'concept')` inside `Array.sort` — only on score ties — costing a long misdirected debugging session (stack lines also drifted due to repeated edits between runs).
- **Why:** `npx tsc --noEmit` is listed *first* in the verification pipeline for this reason; vitest alone gives zero type safety on new code.
- **How to prevent:** For any new source module, run `npx tsc --noEmit` before the first `vitest run`. When a runtime error contradicts obviously-correct code, stop reading and typecheck — a contract mismatch produces exactly this signature.

## 2026-11-07 — A failure branch that "keeps" output is a leak; truncation must not imply success

- **What went wrong:** The hidden-check cleanup kept stderr when the last entry was the generic `"Output missing"` message. A hidden check that printed a sentinel to stderr and then failed its expectation left the sentinel in the learner-visible buffer. Separately, a single shared truncation flag dropped *all* later writes, including the exception text, while `run_file` inferred success from an empty stderr.
- **Why:** "Cleanup except when X" created a private-output path, and success was inferred from a derived artifact (buffer contents) instead of an explicit execution signal.
- **How to prevent:** Roll back hidden buffers unconditionally (no exception branches). Track execution failure separately (`executionError`) and compute pass/fail from it. Let bounded, essential failure detail bypass output caps. Regressions: `sandbox-runner.test.ts` and `native-webview-runner.test.ts` cover sentinel leakage and truncation-then-throw for web and native.

## 2026-10-11 — Test runner selection, not just runner behavior

- **What went wrong:** The offline regex Python runner was correct in unit tests (`runNativePythonProof` called directly), but the *selection gate* `canRunNativePythonProof` rejected comment-only verifier checks — the standard level-0/1 teaching style. Every beginner lesson, including the sample lesson, silently fell through to the WebView Pyodide runner, which on an offline device cold-booted past the startup allowance and timed out three times in a row (24000 ms each) before showing any feedback. No test covered the gate, only the runner.
- **Why:** Two components were tested in isolation while their composition — "which runner does this lesson get?" — had no coverage. The gate's acceptance predicate drifted from the runner's actual capability (comment-only checks execute fine as no-ops and are judged on captured stdout).
- **How to prevent:** When a component has a selector/dispatcher in front of it, regression-test the selector over the real content pack (see `tests/native-python-runner-selection.test.ts`), not only the implementation. Verify runner selection on a real native surface before claiming offline capability; web-journey tests always exercise the web runner and cannot catch native-only selection bugs.

## 2026-11-07 — Historical private output needs a version boundary, not a smarter regex

- **What went wrong:** New runners sanitized hidden stdout/stderr at the source, but `normalizeCodeRunAttempt` still trusted any supplied `terminalTranscript` and raw buffers, and exports reconstructed the same legacy fields. Fresh-attempt tests passed while an old record could still publish a hidden sentinel.
- **Why:** Sanitization was applied at write time only; there was no marker distinguishing "this was produced by a sanitizing runner" from "unknown historical text". Guessing public vs private text after the fact is not reliable.
- **How to prevent:** Persist a disclosure version on attempts/proofs, have current runners set it, and quarantine records without it at every boundary (normalize, load, proof creation, backup, export). Preserve the grade and learner code; omit ambiguous buffers and label the omission. Test adversarial legacy fixtures through both Markdown and JSON exports.

## 2026-11-07 — A reset is a barrier, not another queue entry

- **What went wrong:** Draft writes were serialized per lesson, but `clearAll()` called storage directly. A save issued before the reset could finish after the clear and resurrect the draft.
- **Why:** Per-key ordering does not order a cross-key operation against every queue.
- **How to prevent:** Fence `clearAll` with a global generation counter, wait for all in-flight queues, then clear; saves captured before the generation bump become no-ops, and saves issued after it wait for the barrier. Reproduce with deferred promises rather than sleeps.

## 2026-11-07 — "Check passed" belongs to a snapshot, not a lesson

- **What went wrong:** The Code Lab showed a green pass based on the latest executed attempt even after the learner edited or reset the editor to different code.
- **Why:** The UI conflated historical achievement, last-executed result, and current draft verification.
- **How to prevent:** Compare the current editor value to the checked snapshot for the green state; label durable achievement separately; show "Unverified changes" otherwise. Keep the distinction through reloads and reset tombstones.

## 2026-11-07 — Audit counts depend on whether dev dependencies are included

- **What went wrong:** One report said 19 vulnerabilities and CI said 23. Both were correct for different commands.
- **Why:** `npm audit` respects the production-only environment in this container; `--include=dev` adds Vitest/Vite advisories.
- **How to prevent:** Record the exact command with every count. Report both `npm audit --include=dev` (23) and `npm audit --omit=dev` (19), triage direct vs transitive and reachability, and do not force a major Expo upgrade just to lower the number.

## 2026-11-07 — Browser journeys must seed a fresh learner once, not on every reload

- **What went wrong:** The Playwright harness used `addInitScript` to write a blank progress object on every navigation, so reloading erased the saved proof and the "draft survived" assertion failed for the wrong reason.
- **Why:** `addInitScript` runs on each document; a blind `setItem` overwrites app state.
- **How to prevent:** Seed only when the storage key is absent. Assert on app-written state after reload, and inspect downloaded bytes rather than only clicking the download button.
