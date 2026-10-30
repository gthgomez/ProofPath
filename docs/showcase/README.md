# Reproducing the ProofPath showcase

These are screenshots and a video of the real locally running UI, captured by browser automation. Application source was unchanged. Existing license and attribution terms apply; public visibility is not a new license grant.

## Provenance

- Application source revision: [`c3c82079efa0b7763d35af274f590e081279d338`](https://github.com/gthgomez/ProofPath/tree/c3c82079efa0b7763d35af274f590e081279d338). The showcase commit adds documentation/media only.
- Captured 2026-10-30 with Chromium 154.0.8037.57, 540 × 960, en-US / UTC.
- [Machine-readable capture manifest](capture.json) records scenario, source SHA, timing, blocked hosts, screenshot labels, media byte sizes and SHA-256 checksums.
- MP4: 16.7 seconds, silent H.264. GIF: 1.04× playback, 4 fps, reduced palette/size. JPGs are direct viewport captures. Only the video/GIF receives a provenance caption; no UI is generated or reconstructed.
- Actual Expo web UI and local Python check results from original shipped curriculum. No mock runner or fabricated completion records were used. Browser behavior shown here does not establish native Android/device behavior.

## Run locally

Use this PR branch (the baseline revision above predates the added capture scripts). From the repository root, start the application in one terminal:

```bash
npm ci
EXPO_NO_TELEMETRY=1 npx expo start --web --host localhost --port 4314
```

In another terminal, install the isolated capture-tool dependencies and record. Requirements: Node compatible with the project, Chromium, FFmpeg and ffprobe on PATH. On Linux, the default browser path is `/usr/bin/chromium`; set `CHROMIUM_PATH` for your system. Installing Playwright's small FFmpeg helper supports its temporary WebM recorder; system FFmpeg creates the committed MP4/GIF. No hosted account or external media upload is needed.

```bash
npm ci --prefix docs/showcase
npx --prefix docs/showcase playwright install ffmpeg
node docs/showcase/capture.mjs
```

`SHOWCASE_URL` can override the local server origin; only loopback hosts are accepted. `CHROMIUM_PATH` and `FFMPEG_PATH` override executables. In restricted environments, put npm, corepack and Playwright caches in writable directories and use the same `PLAYWRIGHT_BROWSERS_PATH` during helper installation and capture. Do not point this script at production.

The script launches a new browser context with empty storage, blocks non-loopback requests, operates the actual UI, records a temporary WebM, creates the compact deliverables in `media/`, writes `capture.json`, and removes its own temporary recording directory. Rerunning replaces only showcase media and its manifest. Fonts can differ slightly because external font requests are blocked.

## Workflow and limits

Open fresh career-path setup; preview the first Python lesson; run starter code; fail the empty starter check; correct print output and pass the real local checks.

Capture uses the sample lesson `lesson-python-zero-first-script`. It executes the shipped practice code, runs the incomplete starter `print("")` and observes failure, then edits to `print("first run")` and observes passing checks. It does not complete the checkpoint, save external repository evidence, or manufacture portfolio readiness. Browser time starts at 2026-10-30 and continues advancing: freezing `Date.now()` created duplicate attempt IDs in a discarded first capture, so the capture script preserves elapsed time and unique IDs. No product fix was needed.

Source surfaces inspected: `app/onboarding.tsx`, `app/lesson/[lessonId].tsx`, `src/content/python/level-0.ts`, `src/ui/code-lab.tsx`, `src/state/progress-provider.web.tsx`.

## Validation

`npm run verify` passed content, redaction, and type checks. Its initial test run had two 20-second journey timeouts under concurrent builds. `npm run test -- --maxWorkers=2` then passed all 48 files / 461 tests without changing app code or increasing test timeouts. The capture separately exercised the actual browser runner, not the mocked journey-test runner.

Every screenshot and sampled video frames were visually inspected. Browser capture reported no uncaught page errors. README links, media checksums, encodings, file sizes, and final Git diff were reviewed. Public hosted links, when listed, received a read-only HTTP 200 check only; no production UI interaction, account setup, cloud sync, deployment, or paid inference was performed.
