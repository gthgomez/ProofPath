#!/usr/bin/env node
/**
 * Real-browser runtime matrix: Python, SQL, JavaScript, and TypeScript in the
 * preemptible worker runtime, including timeout termination and recovery.
 *
 * Run after `npx expo export --platform web`:
 *   node scripts/e2e-runtime-matrix.mjs
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const DIST = process.env.E2E_DIST ?? "dist";
const PORT = Number(process.env.E2E_PORT ?? 8098);
const BASE = `http://127.0.0.1:${PORT}`;
const ARTIFACT_DIR = process.env.E2E_ARTIFACT_DIR ?? "artifacts/e2e";
const browserErrors = [];
let activePage = null;

if (!existsSync(join(DIST, "index.html"))) {
  console.error(`No web export found at ${DIST}/index.html. Run: npx expo export --platform web`);
  process.exit(2);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm",
  ".db": "application/octet-stream"
};

const server = createServer((request, response) => {
  const requested = decodeURIComponent(new URL(request.url ?? "/", BASE).pathname);
  const safePath = normalize(requested).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(DIST, safePath);
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(DIST, "index.html");
  }
  response.setHeader("Content-Type", MIME[extname(filePath)] ?? "application/octet-stream");
  createReadStream(filePath).pipe(response);
});

function seedProgress() {
  const timestamp = new Date().toISOString();
  return {
    profile: {
      roleTargetId: "path-software-foundations",
      onboardingCompletedAt: timestamp,
      dashboardTourDismissed: true,
      createdAt: timestamp,
      updatedAt: timestamp
    },
    completedLessonIds: [],
    completedLessonMiniProjectIds: [],
    durableLessonMiniProjectIds: [],
    completedQuizIds: [],
    durableQuizIds: [],
    placedOutLessonIds: [],
    placedOutQuizIds: [],
    completedProjectMissionIds: [],
    completedProjectMissionDeliverableIds: [],
    completedProjectMissionPhaseIds: [],
    evidenceItems: [],
    quizAttempts: [],
    codeRunAttempts: [],
    weeklyPlanTaskIds: [],
    reviewItems: [],
    reviewEvents: [],
    weeklyReports: [],
    updatedAt: timestamp
  };
}

async function openCodeLab(page, label) {
  const editor = page.getByLabel(`${label} code editor`);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.getByRole("button", { name: "Code Lab step" }).click();
    try {
      await editor.waitFor({ state: "visible", timeout: 5000 });
      return editor;
    } catch {
      await page.waitForTimeout(500);
    }
  }
  throw new Error(`Code Lab editor (${label}) did not become visible`);
}

async function waitForStatus(page, text, timeout = 60000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      await page.getByText(text, { exact: false }).first().waitFor({ timeout: 3000 });
      return;
    } catch {
      await page.waitForTimeout(500);
    }
  }
  const body = (await page.locator("body").innerText()).slice(-2500);
  throw new Error(`Status "${text}" did not appear. Body=${body}`);
}

async function runLesson(page, { lessonId, language, code, expect, timeout = 60000 }) {
  await page.goto(`${BASE}/lesson/${lessonId}`, { waitUntil: "domcontentloaded" });
  try {
    await page.getByRole("button", { name: "Code Lab step" }).waitFor({ state: "visible", timeout: 60000 });
  } catch (error) {
    console.error("DEBUG_URL", page.url());
    console.error("DEBUG_BODY", (await page.locator("body").innerText()).slice(0, 2500));
    throw error;
  }
  const editor = await openCodeLab(page, language);
  await editor.fill(code);
  await page.waitForTimeout(250);
  await page.getByRole("button", { name: /^Run checks/ }).click();
  await waitForStatus(page, expect, timeout);
}

async function main() {
  await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext();
  await context.addInitScript((progress) => {
    if (!window.localStorage.getItem("proofpath.progress.v1")) {
      window.localStorage.setItem("proofpath.progress.v1", JSON.stringify(progress));
    }
  }, seedProgress());
  const page = await context.newPage();
  activePage = page;
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(`pageerror: ${error.message}`));

  const results = {};
  try {
    // Python: wrong then corrected.
    await runLesson(page, {
      lessonId: "lesson-python-zero-first-script",
      language: "python",
      code: "print(\"\")\n",
      expect: "checks failed"
    });
    results.pythonWrong = "failed";
    await runLesson(page, {
      lessonId: "lesson-python-zero-first-script",
      language: "python",
      code: "print(\"first run\")\n",
      expect: "Check passed"
    });
    results.pythonCorrect = "passed";

    // Python timeout must terminate, then recover on the next run.
    await runLesson(page, {
      lessonId: "lesson-python-zero-first-script",
      language: "python",
      code: "n = 1\nwhile n > 0:\n    n = n + 1\n",
      expect: "stopped because the code took too long",
      timeout: 90000
    });
    results.pythonTerminated = "terminated";
    await runLesson(page, {
      lessonId: "lesson-python-zero-first-script",
      language: "python",
      code: "print(\"first run\")\n",
      expect: "Check passed",
      timeout: 120000
    });
    results.pythonRecovered = "passed";

    // SQL: wrong then corrected.
    await runLesson(page, {
      lessonId: "lesson-sql-aggregates",
      language: "sql",
      code: "SELECT learner, topic, SUM(minutes) AS total\nFROM study_sessions\nWHERE SUM(minutes) >= 40\nGROUP BY learner, topic;",
      expect: "checks failed"
    });
    results.sqlWrong = "failed";
    await runLesson(page, {
      lessonId: "lesson-sql-aggregates",
      language: "sql",
      code: "SELECT learner, topic, SUM(minutes) AS total\nFROM study_sessions\nGROUP BY learner, topic\nHAVING SUM(minutes) >= 40;",
      expect: "Check passed"
    });
    results.sqlCorrect = "passed";

    // SQL non-terminating query must terminate, then recover.
    await runLesson(page, {
      lessonId: "lesson-sql-aggregates",
      language: "sql",
      code: "WITH RECURSIVE forever(x) AS (SELECT 1 UNION ALL SELECT x + 1 FROM forever) SELECT * FROM forever;",
      expect: "stopped because the code took too long",
      timeout: 90000
    });
    results.sqlTerminated = "terminated";
    await runLesson(page, {
      lessonId: "lesson-sql-aggregates",
      language: "sql",
      code: "SELECT learner, topic, SUM(minutes) AS total\nFROM study_sessions\nGROUP BY learner, topic\nHAVING SUM(minutes) >= 40;",
      expect: "Check passed",
      timeout: 90000
    });
    results.sqlRecovered = "passed";

    // TypeScript: valid starter passes; a type error fails with a real diagnosis.
    await runLesson(page, {
      lessonId: "lesson-typescript-contracts",
      language: "typescript",
      code: "type MissionCard = {\n  title: string;\n  proofCount: number;\n  nextAction: string;\n};\n\nconst card: MissionCard = {\n  title: \"CLI Study Tracker\",\n  proofCount: 2,\n  nextAction: \"Add check output\"\n};",
      expect: "Check passed",
      timeout: 90000
    });
    results.typescriptCorrect = "passed";
    await runLesson(page, {
      lessonId: "lesson-typescript-contracts",
      language: "typescript",
      code: "type MissionCard = {\n  title: string;\n  proofCount: number;\n  nextAction: string;\n};\n\nconst card: MissionCard = {\n  title: \"CLI Study Tracker\",\n  proofCount: \"two\",\n  nextAction: \"Add check output\"\n};",
      expect: "type error",
      timeout: 90000
    });
    results.typescriptTypeError = "failed with type diagnostics";

    console.log(JSON.stringify({ ok: true, results, consoleErrors: browserErrors }, null, 2));
    if (browserErrors.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch(async (error) => {
  try {
    mkdirSync(ARTIFACT_DIR, { recursive: true });
    if (activePage) {
      await activePage.screenshot({ path: join(ARTIFACT_DIR, "runtime-failure.png"), fullPage: true });
      const body = await activePage.locator("body").innerText().catch(() => "<unavailable>");
      writeFileSync(join(ARTIFACT_DIR, "runtime-failure.txt"), `${body}\n\nBrowser errors:\n${browserErrors.join("\n")}`);
    }
  } catch {
    // Artifact capture must never mask the original failure.
  }
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
    browserErrors
  }, null, 2));
  server.close();
  process.exit(1);
});
