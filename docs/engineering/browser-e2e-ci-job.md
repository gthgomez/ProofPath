# Browser E2E CI Job (pending `workflow` scope)

The browser gates are implemented and pass locally, but the available OAuth
token cannot modify `.github/workflows/ci.yml` because it lacks GitHub's
`workflow` scope. Apply this job with a token/app that has that scope.

```yaml
  # Real-browser gate: the unit suite cannot prove that the web build actually
  # executes learner code, persists drafts, or restores a backup. This job runs
  # the exported app in Chromium against the real Pyodide/sql.js/TypeScript
  # worker runtimes, including timeout termination and recovery.
  e2e-web:
    name: Browser E2E
    runs-on: ubuntu-latest
    timeout-minutes: 30
    steps:
      - name: Check out repository
        uses: actions/checkout@11d5960a326750d5838078e36cf38b85af677262 # v4.4.0

      - name: Set up Node.js
        uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4.4.0
        with:
          node-version-file: .nvmrc
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Install Chromium
        run: npx playwright install --with-deps chromium

      - name: Export web build with offline shell
        run: npm run build:web

      - name: Runtime matrix (Python, SQL, JavaScript, TypeScript, timeouts)
        run: node scripts/e2e-runtime-matrix.mjs

      - name: First-time learner journey (empty storage through evidence)
        run: node scripts/e2e-first-time-journey.mjs

      - name: Learner journey (drafts, checks, backup, restore, provenance)
        run: node scripts/e2e-web-journey.mjs

      - name: Workspace -> real verifier -> mission -> reviewer packet
        run: node scripts/e2e-workspace-journey.mjs

      - name: Offline update safety and offline runtime assets
        run: node scripts/e2e-offline-update.mjs

      - name: Upload browser artifacts on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: browser-e2e-artifacts
          path: artifacts/e2e
          if-no-files-found: ignore
```

## Local reproduction

```bash
npm ci
npx playwright install chromium
npm run build:web
node scripts/e2e-web-journey.mjs
node scripts/e2e-runtime-matrix.mjs
```

The scripts start their own static server for `dist/`, so no hosted deployment
or credentials are required.
