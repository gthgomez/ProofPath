# Dependency advisory review — PP02 (2026-09-29)

Source of truth: `npm audit --json` captures from a locked install (`npm ci`) on the
`audit/PP02-20260929` branch (base main @ `3aa09eb`). Raw JSON captures live in the
branch working tree under `.audit-tmp/` (not committed). This file records advisory
IDs, dependency paths, dispositions and waiver expiry gates. It is not a claim that
every audit label is an exploitable production route.

## Baseline and result

| Capture | Total | Critical | High | Moderate | Low |
| --- | --- | --- | --- | --- | --- |
| Baseline `npm audit --json` (main @ 3aa09eb lock) | 28 | 1 | 9 | 16 | 2 |
| Baseline `npm audit --omit=dev --json` | 24 | 1 | 8 | 14 | 1 |
| Final `npm audit --json` (this branch) | 12 | 0 | 0 | 12 | 0 |
| Final `npm audit --omit=dev --json` | 12 | 0 | 0 | 12 | 0 |

`npm audit` exits nonzero on the remaining moderates (exit 1 in both final captures).
This is recorded honestly; the audit is not suppressed and CI must not be silenced to
hide it.

## Changes applied (minimal compatible upgrades only)

1. `vitest` `4.1.5` → `^4.1.11` (dev-only, semver-compatible minor). Fixes
   `GHSA-…` advisories on `vitest` 2.1.0-beta.1–4.1.10 and `@vitest/mocker`
   2.1.0–4.1.10 (moderate, dev path via `vitest`).
2. Lockfile refresh (`npm audit fix`, no `--force`) pulling compatible transitive
   updates. This resolved the single **critical** (`shell-quote` ≤1.8.4,
   GHSA-w7jw-789q-3m8p, GHSA-395f-4hp3-45gv) and the following **high** advisories:
   `@xmldom/xmldom`, `brace-expansion`, `browserslist`, `js-yaml`, `nanoid`,
   `postcss` (path `@expo/metro-config`), `vite`, `ws`.
3. `package.json` `overrides`: `"image-size": "^2.0.4"` (2.0.4 > 2.0.2, patched).
   `image-size` 1.2.1 arrives transitively via `react-native` →
   `@react-native/community-cli-plugin` → `metro` → `image-size@^1.0.2`; the patched
   line is 2.x, which metro's declared range does not permit, so a plain in-range
   bump is impossible and an override is the minimal compatible mechanism. Resolves
   two **high** advisories (build/bundler path, DoS parsers):
   - GHSA-5p2g-fcmc-qvqq — JXL/HEIF parser infinite loop (`>=1.2.0 <=2.0.2`)
   - GHSA-w3rx-r6r6-pgpr — ICNS parser infinite loop (`>=0.6.3 <=2.0.2`)

No `npm audit fix --force` was used. No framework major was bumped in this slice.

## Per-advisory disposition (final state)

Every remaining advisory is **moderate** and requires a semver-major framework bump;
all are time-bounded waivers, not permanent.

| Package | Advisory (sample) | Path | Reachability | Disposition | Waiver expiry |
| --- | --- | --- | --- | --- | --- |
| expo (@expo/cli, @expo/config, @expo/config-plugins, @expo/local-build-cache-provider, @expo/metro-config, @expo/prebuild-config) | moderate toolchain advisories; fix requires `expo@46.0.21+` (isSemVerMajor: true) | dev/build tooling and runtime shell around the app | Build-time (prebuild, metro config, local CLI). The shipped web/Android bundles do not embed this toolchain; runtime exposure is limited to the developer/host machine. | WAIVED — framework-major migration tracked as follow-up | 2026-12-31 |
| expo (direct) | moderate; vulnerable ranges `40.0.0-alpha.0 – 40.0.0-beta.5 \|\| >=41.0.0-alpha.0`; fix `expo@46.0.21` | runtime framework | Not attacker-facing in this app: no untrusted input flows into the flagged surface; sandbox executes in a restricted Pyodide/worker runtime. | WAIVED — same follow-up | 2026-12-31 |
| expo-router | moderate; fix `expo-router@5.1.11`-compatible major | runtime routing | URL/query parsing of public deep links is limited; app does not expose privileged deep-link handlers. | WAIVED — same follow-up | 2026-12-31 |
| query-string (via expo-router) | GHSA — query parsing DoS (moderate); fix requires expo-router major | runtime routing | Parse of app-internal query strings; not a public untrusted-input sink at current scale. | WAIVED — same follow-up | 2026-12-31 |
| decode-uri-component (via query-string) | GHSA-vcc3-ghjq-m6fr — exponential decoding DoS (moderate) | runtime routing | Same as query-string. | WAIVED — same follow-up | 2026-12-31 |
| uuid <11.1.1 | GHSA-w5hq-g745-h8pq — buffer bounds check in v3/v5/v6 (moderate); fix via expo major | `xcode` → `@expo/config-plugins` → build tooling | Dev-machine iOS prebuild path only; `uuid` v3/v5/v6 with caller-provided `buf` is not used by app code. | WAIVED — same follow-up | 2026-12-31 |
| xcode (via @expo/config-plugins) | moderate; fix via expo major | iOS prebuild tooling | Dev-machine only. | WAIVED — same follow-up | 2026-12-31 |

Waiver gate: any disposition marked `WAIVED` **must** be re-evaluated on or before its
expiry date, or when a non-breaking compatible fix becomes available, whichever comes
first. A waiver that lapses without re-triage must be treated as unresolved and fail
security review. Framework-major migration (Expo SDK line, expo-router) is a separate
follow-up task and is intentionally out of scope for PP02.

## Negative controls / verification receipts

| Command | Result |
| --- | --- |
| `npm ci` | exit 0 |
| `npm audit --json` (final) | exit 1 (12 moderate remain, documented above) |
| `npm audit --omit=dev --json` (final) | exit 1 (same 12 moderates) |
| `npm test` | exit 0 — 28 files, 370 tests passed |
| `npx expo export --platform web` | exit 0 — exported to `dist/` |
| Sandbox assets in web bundle | `dist/sandbox-assets/pyodide/` (pyodide.asm.wasm, pyodide.js, python_stdlib.zip, …) and `dist/sandbox-assets/sql.js/` (sql-wasm.wasm, sql-wasm.js, worker.sql-wasm.js) present; regenerated by `postinstall` (`scripts/copy-sandbox-assets.js`) after `npm ci` |

## Known limitations

- The audit labels (severity, reachability) are npm/GHSA-derived; no dynamic
  exploitation testing was performed. Reachability notes are source/path reasoning,
  not proof of safety.
- Android bundle (`npx expo export --platform android` / EAS build) was not exported
  in this slice; web bundle was verified. Sandbox-asset preservation logic is shared
  (`postinstall` copies into `public/`, bundled for both platforms).
- The Expo framework-major migration must not be attempted as a side effect of a
  dependency PR; it needs its own review slice.
