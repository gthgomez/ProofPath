# Career Readiness Score — model, caps and limits

Source of truth: `src/domain/readiness.ts` (`calculateReadinessScore`). This
document describes what the score measures and, just as importantly, what it
does not.

## What it is

A bounded 0–100 **practice-progress heuristic**. It transparently measures how
much verifiable, evidence-backed practice a learner has logged inside
ProofPath, and is designed to reward real proof over paper completion.

## What it is NOT

- **Not a validated hiring or employability prediction.** The score has not
  been externally calibrated against hiring outcomes. The `portfolio-ready`
  label means the learner satisfied ProofPath's own curriculum and evidence
  requirements — nothing more.
- **Not a security boundary.** Relatedly, the sandbox that produces some of
  this evidence is a beginner guardrail, not an adversarial secure runtime
  (see README §5).

## Scoring inputs and weights

All five inputs are normalized to 0–100, then combined:

| Input | Weight | What it measures |
| --- | --- | --- |
| Lesson completion | 10% | Satisfied lessons (completed or placed out) as a share of the content pack |
| Quiz performance | 10% | Satisfied quizzes as a share of the content pack |
| Project completion | 40% | Completed proof-required portfolio missions |
| Evidence hygiene | 30% | Structural quality of saved evidence (see below) |
| Review cadence | 10% | Recency-weighted active-recall review ratings still within their next-due window |

## Caps (proof enforcement)

- **Zero project completions:** total score capped at **59**.
- **Zero evidence hygiene:** total score capped at **69** (applied after the
  project cap, so a learner with neither is capped at 59).
- **Within evidence hygiene, an item without passing test results** scores at
  most **45**, regardless of other attributes (repo URL, commit hash,
  README status, artifacts, reflection).

Evidence hygiene rewards coverage of distinct targets: only the strongest
evidence item per lesson/mission contributes, so duplicates do not inflate the
score.

## Labels

| Score | Label |
| --- | --- |
| >= 70 | `portfolio-ready` (within ProofPath's own requirements) |
| 35–69 | `building` |
| < 35 | `starting` |

## Known limits

- The weights and caps are design choices, not empirically derived — they are
  documented here so learners can see exactly how the score behaves.
- Placement tests unblock navigation but do not raise lesson/quiz inputs
  beyond satisfaction; the caps ensure mission evidence is still required.
- The score says nothing about job-market performance, interview skill, or
  employer expectations, and no employment outcome is claimed or implied.
- Test counts and other volatile metrics are deliberately kept out of living
  prose; current verification results live in CI
  ([Actions runs](https://github.com/gthgomez/ProofPath/actions)) and in
  immutable dated records only.
