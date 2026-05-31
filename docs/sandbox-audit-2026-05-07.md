# CareerForge Sandbox Audit - 2026-05-07

## Current State

CareerForge now has a real lesson Code Lab instead of a manual proof checkbox. Lesson mini-project completion is driven by `CodeRunAttempt.passed`, and every attempt stores code snapshot, stdout, stderr, score, runtime, and per-test results.

Supported local runners:

- Python beginner lessons run through Pyodide.
- SQL lessons run through sql.js with an in-memory SQLite database.
- JavaScript/TypeScript-style lessons run small executable checks through the shared runner contract. In browser contexts they run in a dedicated Worker that can be terminated on timeout; Node test runs use the fallback runner.
- Android lesson screens resolve to a native Code Lab wrapper backed by `react-native-webview`. JavaScript/TypeScript, Python, and SQL beginner lessons now execute through the local WebView bridge with a native timeout/remount path.
- Android packages bundle Pyodide and sql.js into `android/app/src/main/assets/sandbox-assets`, and the WebView runner loads them from `file:///android_asset/` so beginner Python/SQL lessons do not depend on CDN access.

All beginner runner specs disable network access, define visible tests, define expected output markers, and use bounded timeouts. Pyodide and sql.js assets are copied into `public/sandbox-assets` for local web serving instead of CDN-first loading.

## Hardening Added

- Static policy guard blocks obvious network, host-object, dynamic import, eval, constructor escape, file I/O, package install, process, and destructive SQL patterns before execution.
- Python tests execute in a fresh dictionary namespace per test to reduce cross-test state bleed.
- JavaScript/TypeScript output checks now evaluate only output produced by the current test, not previous tests.
- JavaScript/TypeScript browser execution runs in a Worker and terminates the Worker on timeout.
- Pyodide and sql.js browser assets are copied locally by `npm run prepare:sandbox-assets` and `postinstall`.
- SQL learner submissions are read-only for beginner lessons; setup data remains owned by trusted lesson content.
- Content validation now rejects missing expected-output markers, long timeouts, overly large memory budgets, and Python runner specs without hidden tests.

## Remaining Risks

- JavaScript/TypeScript still uses dynamic function construction inside the Worker. The Worker is a stronger browser boundary and supports termination, but it is still not equivalent to a hardened backend sandbox.
- iOS still needs its own bundled asset URI mapping before Python/SQL can run offline there. The current native asset proof is Android-specific.
- Python execution still runs in the page context on web. It should move into a Worker/WebView runtime for hard interruption of long-running Python.
- Memory limits are declared in runner specs but not enforced by the in-process JavaScript runner. Backend or worker-level isolation is needed for strict memory enforcement.
- Python policy blocks common file/network/process APIs, but Pyodide remains a large runtime. For higher-risk exercises, run Python inside a worker with interrupt support and no privileged bridge exposed.

## Recommended Next Improvements

1. Move Python execution into a dedicated Worker/WebView runner with interrupt or terminate support.
2. Add iOS asset URI loading for Pyodide and sql.js so iOS can run Python and SQL beginner lessons offline through the same WebView bridge.
3. Add a `SandboxBridge` abstraction that chooses `web-worker`, `native-webview`, or `backend-container` by lesson risk level.
4. Store first-class code-run evidence in weekly reports and readiness scoring.
5. Add backend container/microVM execution only for portfolio projects that need packages, repos, APIs, or multi-file tests.

## Why This Matters

The sandbox is the difference between quiz familiarity and job-like skill proof. A strong lesson should make a learner read, build, run, fail, debug, pass, and explain. The current system now supports that loop for beginner lessons, while the remaining hardening work is about making the execution boundary stronger and more offline-capable.
