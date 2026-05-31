# CareerForge Sandbox QA Baseline

Status: web and Android screenshot baseline captured; manual device notes still partial.

## Local Baseline

- Workspace: `C:\Workspace\Project_Android\CareerForgeMobile`
- App stack: Expo, React Native, TypeScript, Expo SQLite
- Verification command: `npm run verify`
- Baseline result before roadmap implementation: pass, 16 test files, 75 tests
- Code-contract result after roadmap implementation: `npm run verify` must include content validation, hidden redaction scan, TypeScript, and Vitest.
- Screenshot folder: `docs/screenshots/sandbox-baseline/`
- Screenshot capture time: 2026-05-08 20:25-20:45 local file timestamps.

## Required Screenshot Set

Captured baseline screenshots:

| File | Coverage |
| --- | --- |
| `01-fresh-dashboard.png` | Fresh dashboard / Today entry state. |
| `02-fresh-lesson.png` | Fresh lesson with untouched starter code. |
| `03-fresh-code-lab.png` | Code Lab editor and runner controls. |
| `04-run-file-pass-no-proof.png` | `Run file` pass with no proof capture. |
| `05-run-file-terminal.png` | Terminal output after `Run file`. |
| `06-run-checks-visible-failure.png` | Visible check failure. |
| `07-problems-location-unknown-hidden-summary.png` | Problems panel with `Location unknown` and hidden-check summary. |
| `08-run-checks-pass-stdout.png` | `Run checks` pass with stdout visible. |
| `09-run-checks-pass-clean.png` | Clean pass state after checks. |
| `10-android-editor-clean.png` | Android editor clean state. |
| `11-clean-start-lesson.png` | Clean lesson start state. |
| `12-android-editor-clean-visible.png` | Android editor visible clean state. |
| `13-android-clean-code-entered.png` | Android code entered state. |
| `14-android-run-checks-pass-clean-editor.png` | Android `Run checks` pass with clean editor. |
| `15-android-terminal-pass-clean.png` | Android terminal pass state. |
| `16-android-result-exit0-clean.png` | Android result state showing clean exit-style success. |

Remaining screenshot gaps before production-candidate promotion:

- SyntaxError or parser failure with known line when available.
- Policy block before execution.
- Long traceback/stderr collapsed and expanded.
- Recent attempts list with at least three runs.

## Manual Device Matrix

- Web: baseline screenshots captured from local preview.
- Android: baseline screenshots captured, but the exact emulator/device profile is not recorded in this file.
- Native bridge: Android screenshots cover editor, run-checks pass, terminal pass, and exit-style result; first Python/SQL runtime startup and second warm run are not separately documented here.
- Accessibility: touch-target intent is documented in the roadmap, but a measured 48dp pass is not recorded here.

## Promotion Rule

Do not claim production-candidate screenshot or emulator QA complete until the remaining screenshot gaps and device/profile notes above are captured in this folder or in a linked QA artifact. Code-level verification and the existing 16 screenshots are necessary but not sufficient for the final production-candidate gate.
