#!/usr/bin/env node
/**
 * Browser gate for hidden-only failure feedback.
 *
 * Uses a real SQL lesson whose visible check accepts a forged constant row
 * (`at_goal | 2`) while a seeded hidden check expects `at_goal | 3`. The page
 * must show the learner-safe private-verification status without leaking the
 * hidden expectation, harness INSERT, or sentinel-like detail.
 *
 * Run after `npm run build:web`:
 *   node scripts/e2e-private-verification.mjs
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const DIST = process.env.E2E_DIST ?? "dist";
const PORT = Number(process.env.E2E_PRIVATE_PORT ?? 8102);
const BASE = `http://127.0.0.1:${PORT}`;
const ARTIFACT_DIR = process.env.E2E_ARTIFACT_DIR ?? "artifacts/e2e";
const LESSON_ID = "lesson-sql-ctes";
const FORGED_VISIBLE_PASS = "SELECT 'at_goal' AS bucket, 2 AS learners;";
// Guided exercise: count learners who reached at least seventy minutes.
const CORRECT = `WITH totals AS (
  SELECT learner, SUM(minutes) AS total
  FROM study_sessions
  GROUP BY learner
),
at_goal AS (
  SELECT learner
  FROM totals
  WHERE total >= 70
)
SELECT 'at_goal' AS bucket, COUNT(*) AS learners
FROM at_goal;`;
const HIDDEN_SECRETS = [
  "at_goal | 3",
  "INSERT INTO study_sessions",
  "nina",
  "Hidden check adds a learner",
  "sql-ctes-hidden"
];

if (!existsSync(join(DIST, "index.html"))) {
  console.error("No dist/index.html. Run: npm run build:web");
  process.exit(2);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".wasm": "application/wasm"
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

async function openCodeLab(page) {
  const editor = page.getByLabel("sql code editor");
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.getByRole("button", { name: "Code Lab step" }).click();
    try {
      await editor.waitFor({ state: "visible", timeout: 5000 });
      return editor;
    } catch {
      await page.waitForTimeout(500);
    }
  }
  throw new Error("SQL Code Lab editor did not become visible");
}

async function waitForText(page, text, timeout = 90000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      await page.getByText(text, { exact: false }).first().waitFor({ timeout: 3000 });
      return;
    } catch {
      await page.waitForTimeout(500);
    }
  }
  const body = (await page.locator("body").innerText()).slice(-3000);
  throw new Error(`Text "${text}" did not appear. Body=${body}`);
}

async function assertNoSecrets(page, label) {
  const body = await page.locator("body").innerText();
  for (const secret of HIDDEN_SECRETS) {
    if (body.includes(secret)) {
      throw new Error(`${label}: leaked hidden material ${JSON.stringify(secret)}`);
    }
  }
}

async function main() {
  mkdirSync(ARTIFACT_DIR, { recursive: true });
  await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext();
  await context.addInitScript((progress) => {
    if (!window.localStorage.getItem("proofpath.progress.v1")) {
      window.localStorage.setItem("proofpath.progress.v1", JSON.stringify(progress));
    }
  }, seedProgress());
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  const results = {};
  try {
    await page.goto(`${BASE}/lesson/${LESSON_ID}`, { waitUntil: "domcontentloaded" });
    await waitForText(page, "Name Each Step with WITH", 60000);
    const editor = await openCodeLab(page);

    // Forged constant passes the visible exact row but fails the seeded hidden check.
    await editor.fill(FORGED_VISIBLE_PASS);
    await page.waitForTimeout(250);
    await page.getByRole("button", { name: /^Run checks/ }).click();
    await waitForText(page, "Private checks need work", 120000);
    await waitForText(page, "Visible checks passed, but additional private verification did not", 15000);
    await waitForText(page, "private checks that stay hidden on purpose", 15000);
    await assertNoSecrets(page, "forged-failure");
    results.forged = "private-verification feedback shown without hidden leaks";

    // Edit while unverified: failure clue must survive.
    await editor.fill(`${FORGED_VISIBLE_PASS}\n-- editing`);
    await waitForText(page, "Unverified changes", 15000);
    await waitForText(page, "Visible checks passed, but additional private verification did not", 15000);
    await assertNoSecrets(page, "unverified-edit");
    results.editSurvives = "private-verification clue kept while draft unverified";

    // Correct solution clears the private-failure state.
    await editor.fill(CORRECT);
    await page.getByRole("button", { name: /^Run checks/ }).click();
    await waitForText(page, "Check passed", 120000);
    const passedBody = await page.locator("body").innerText();
    if (/Private checks need work/i.test(passedBody)) {
      throw new Error("private-verification status remained after a passing run");
    }
    await assertNoSecrets(page, "corrected-pass");
    results.corrected = "passed after fixing the forged constant";

    writeFileSync(join(ARTIFACT_DIR, "private-verification.json"), JSON.stringify({ ok: true, results, errors }, null, 2));
    console.log(JSON.stringify({ ok: true, results, errors }, null, 2));
  } catch (error) {
    const shot = join(ARTIFACT_DIR, "private-verification-failure.png");
    await page.screenshot({ path: shot, fullPage: true }).catch(() => undefined);
    writeFileSync(join(ARTIFACT_DIR, "private-verification-failure.json"), JSON.stringify({
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      errors,
      body: (await page.locator("body").innerText().catch(() => "")).slice(0, 4000)
    }, null, 2));
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser.close();
    server.close();
  }
}

main();
