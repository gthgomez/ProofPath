# CareerForge Docs Router

This folder contains current product documentation, supporting research, sandbox QA evidence, generated preview assets, and historical migration records. Treat this file as the entrypoint before using any other document in `docs/`.

## Current Product Truth

- [career-paths-current-curriculum-2026.md](./career-paths-current-curriculum-2026.md) - canonical current summary for active `path-*` IDs, shared core, selectable paths, implemented proof gates, unlock labels, and curriculum gaps.
- [career-paths-status-and-plan-2026.md](./career-paths-status-and-plan-2026.md) - maintainer view for path routing, track membership, and phase planning. Superseded where it still describes the old role-ID era.
- [career-paths-future-roadmap-2026.md](./career-paths-future-roadmap-2026.md) - research-led roadmap behind the `path-*` replacement while lessons are still movable.
- [career-paths-architecture-2026.md](./career-paths-architecture-2026.md) - product architecture for gates, shared core skills, role display naming, and phase-2 unlocks. Some gate mechanics are now implemented; verify against the current curriculum summary before treating older architecture notes as current.
- [python-roadmap-2026-05-07.md](./python-roadmap-2026-05-07.md) - current Python learning spine, reusable depth standard, and lesson template for future track ports.

## Research And Critique Inputs

These documents inform product decisions but are not themselves implementation authority.

- [career-paths-2026.md](./career-paths-2026.md) - concise product stance for the three stable role IDs.
- [career-paths-research-2026.md](./career-paths-research-2026.md) - sourced 2025-2026 career-path research and skill-priority notes.
- [career-paths-critique-2026.md](./career-paths-critique-2026.md) - adversarial critique of path differentiation, onboarding overload, and claims to avoid.
- [career-paths-external-research-review-2026.md](./career-paths-external-research-review-2026.md) - review of external research exports. The reviewed external source files are not committed here, so use it as synthesis only.

## Sandbox And QA

- [sandbox-runtime-limits.md](./sandbox-runtime-limits.md) - current runtime limits and honest language for Python, SQL, JavaScript, and TypeScript Code Lab execution.
- [sandbox-qa-baseline.md](./sandbox-qa-baseline.md) - baseline screenshot and manual QA inventory.
- [sandbox-audit-2026-05-07.md](./sandbox-audit-2026-05-07.md) - audit snapshot of Code Lab hardening and remaining risks.
- [sandbox-production-quality-roadmap.md](./sandbox-production-quality-roadmap.md) - implementation-control roadmap for sandbox production-candidate quality.
- [screenshots/sandbox-baseline/](./screenshots/sandbox-baseline/) - captured screenshot evidence for the sandbox baseline.

## Generated Preview Assets

- [careerforge-web-preview/](./careerforge-web-preview/) contains generated web-preview runtime assets, including Pyodide and sql.js bundles.
- `expo-web*.log` files are local preview logs and may be empty.
- [careerforge-icon-512.png](./careerforge-icon-512.png) is the icon image artifact.

Generated assets are evidence or preview support, not policy or source-of-truth documentation.

## Historical Migration Evidence

The following files are retained for provenance from the earlier SoloLearnDup working name and path. They are historical records only. Do not use their `C:\Workspace\SoloLearnDup` paths, writable-path envelopes, or phase instructions as current routing for CareerForge Mobile.

- [complete-app-mission-prompt-2026-05-04.md](./complete-app-mission-prompt-2026-05-04.md)
- [ralph-state/sololearndup-phase0-2026-05-04.md](./ralph-state/sololearndup-phase0-2026-05-04.md)
- [ralph-state/sololearndup-complete-app-mission-2026-05-04.md](./ralph-state/sololearndup-complete-app-mission-2026-05-04.md)

## Current Project Anchors

- Current project path: `C:\Workspace\Project_Android\CareerForgeMobile`
- App name: CareerForge Mobile
- Package: `com.jonathangomez.careerforge`
- Stack: Expo, React Native, TypeScript, Expo SQLite
