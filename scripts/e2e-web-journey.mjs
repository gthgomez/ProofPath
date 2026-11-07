#!/usr/bin/env node
/**
 * Real-browser qualification for the ProofPath web build.
 *
 * This is deliberately not part of `npm run verify`: Playwright is an optional
 * local tool, not an application dependency. Run it manually:
 *
 *   npx expo export --platform web
 *   PLAYWRIGHT_PATH=/path/to/playwright node scripts/e2e-web-journey.mjs
 *
 * It starts a tiny SPA static server for `dist/`, drives a real Chromium, and
 * checks the learner journey with actual sandbox execution and localStorage.
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const playwrightPath = process.env.PLAYWRIGHT_PATH ?? "playwright";
const { chromium } = require(playwrightPath);

const DIST = process.env.E2E_DIST ?? "dist";
const PORT = Number(process.env.E2E_PORT ?? 8099);
const LESSON_ID = "lesson-git-stage-commit-inspect";
const BASE = `http://127.0.0.1:${PORT}`;

const STARTER = `const repo = { index: {}, log: [] };

// Record the latest contents of one file in the staging area.
function stage(repo, path, contents) {
  return repo;
}

// Save the staged files as one inspectable commit.
// Reject the commit when nothing is staged.
function commit(repo, message) {
  return { status: "rejected", reason: "not implemented" };
}`;

const CORRECT = `const repo = { index: {}, log: [] };

function stage(repo, path, contents) {
  repo.index[path] = contents;
  return repo;
}

function commit(repo, message) {
  const files = { ...repo.index };
  if (Object.keys(files).length === 0) {
    return { status: "rejected", reason: "nothing staged" };
  }
  repo.log.push({ message, files });
  repo.index = {};
  return { status: "committed" };
}`;

const WRONG = STARTER;
const EDITED_DRAFT = `${CORRECT}\n// unrun edit after the pass`;

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
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
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

function now() {
  return new Date().toISOString();
}

function seedProgress() {
  const timestamp = now();
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

async function waitForText(page, text, timeout = 30000) {
  await page.getByText(text, { exact: false }).first().waitFor({ timeout });
}

async function openCodeLab(page) {
  const editor = page.getByLabel("javascript code editor");
  // Hydration can finish after the first click and reset the stepper to
  // "understand". Retry until the apply panel is actually visible.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await page.getByRole("button", { name: "Code Lab step" }).click();
    try {
      await editor.waitFor({ state: "visible", timeout: 5000 });
      return editor;
    } catch {
      await page.waitForTimeout(500);
    }
  }
  throw new Error("Code Lab editor did not become visible");
}

async function waitForCodeLabStatus(page, text, timeout = 20000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    await openCodeLab(page);
    try {
      await page.getByText(text, { exact: false }).first().waitFor({ timeout: 3000 });
      return;
    } catch {
      await page.waitForTimeout(500);
    }
  }
  const bodyTail = (await page.locator("body").innerText()).slice(-1800);
  const editorValue = await page.getByLabel("javascript code editor").inputValue().catch(() => "<no editor>");
  throw new Error(`Code Lab status "${text}" did not become visible. Editor=${JSON.stringify(editorValue)} Body=${bodyTail}`);
}

async function main() {
  const results = {};
  await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));

  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext({ acceptDownloads: true });
  await context.addInitScript((progress) => {
    // Seed a fresh learner once. Do not overwrite progress saved by the app on
    // reload, or the restored draft/proof would be erased by the harness.
    if (!window.localStorage.getItem("proofpath.progress.v1")) {
      window.localStorage.setItem("proofpath.progress.v1", JSON.stringify(progress));
    }
  }, seedProgress());

  const page = await context.newPage();
  try {
    await page.goto(`${BASE}/lesson/${LESSON_ID}`, { waitUntil: "domcontentloaded" });
    await waitForText(page, "Code Lab", 60000);

    const editor = await openCodeLab(page);

    // 1. Incorrect submission fails a real check.
    await editor.fill(WRONG);
    await page.getByRole("button", { name: /^Run checks/ }).click();
    await waitForCodeLabStatus(page, "checks failed", 60000);
    results.incorrectSubmission = "failed as expected";

    // 2. Corrected submission passes.
    await editor.fill(CORRECT);
    await page.waitForTimeout(250);
    await page.getByRole("button", { name: /^Run checks/ }).click();
    try {
      await waitForCodeLabStatus(page, "Check passed", 30000);
    } catch (error) {
      console.error("DEBUG_EDITOR_VALUE", JSON.stringify(await editor.inputValue()));
      console.error("DEBUG_BODY_TAIL", (await page.locator("body").innerText()).slice(-2500));
      throw error;
    }
    results.correctedSubmission = "passed";

    // 3. An edit after the pass is explicitly unverified, while the achievement remains.
    await editor.fill(EDITED_DRAFT);
    await page.waitForTimeout(500);
    try {
      await waitForCodeLabStatus(page, "Unverified changes", 15000);
    } catch (error) {
      console.error("DEBUG_STEP3_VALUE", JSON.stringify(await editor.inputValue()));
      console.error("DEBUG_STEP3_BODY", (await page.locator("body").innerText()).slice(-1800));
      throw error;
    }
    results.editedDraft = "unverified";
    await waitForCodeLabStatus(page, "Lesson passed previously", 15000);

    // 4. Reload: the unrun draft survives and the achievement stays distinct.
    await page.reload({ waitUntil: "domcontentloaded" });
    await waitForText(page, "Code Lab", 60000);
    await openCodeLab(page);
    await page.waitForFunction(
      (expected) => document.querySelector('textarea[aria-label="javascript code editor"]')?.value === expected,
      EDITED_DRAFT,
      { timeout: 30000 }
    );
    await waitForCodeLabStatus(page, "Unverified changes", 20000);
    results.draftPersistence = "draft restored after reload";

    // 5. Export real packets and inspect the downloaded bytes.
    await page.goto(`${BASE}/evidence`, { waitUntil: "domcontentloaded" });
    await waitForText(page, "Interview-ready evidence", 60000);

    const markdownDownload = page.waitForEvent("download");
    await page.getByText("Download Markdown packet", { exact: true }).click();
    const markdown = await markdownDownload;
    const markdownPath = await markdown.path();
    const markdownText = readFileSync(markdownPath, "utf8");

    const jsonDownload = page.waitForEvent("download");
    await page.getByText("Download JSON packet", { exact: true }).click();
    const json = await jsonDownload;
    const jsonPath = await json.path();
    const jsonText = readFileSync(jsonPath, "utf8");
    const packet = JSON.parse(jsonText);

    if (!markdownText.includes("ProofPath Reviewer-Ready Portfolio Evidence Packet")) {
      throw new Error("Markdown packet header missing");
    }
    if (markdown.suggestedFilename() !== "proofpath-portfolio.md") {
      throw new Error(`Unexpected Markdown filename: ${markdown.suggestedFilename()}`);
    }
    if (json.suggestedFilename() !== "proofpath-portfolio.json") {
      throw new Error(`Unexpected JSON filename: ${json.suggestedFilename()}`);
    }
    if (markdownText.includes("HIDDEN_ONLY_SENTINEL") || jsonText.includes("HIDDEN_ONLY_SENTINEL")) {
      throw new Error("Private hidden-check sentinel leaked into an export");
    }
    if (!Array.isArray(packet.evidenceItems) || packet.summary.autoVerifiedCount < 1) {
      throw new Error("Export did not contain the locally verified Code Lab proof");
    }
    results.exports = {
      markdownBytes: Buffer.byteLength(markdownText),
      jsonBytes: Buffer.byteLength(jsonText),
      autoVerifiedCount: packet.summary.autoVerifiedCount
    };

    console.log(JSON.stringify({ ok: true, results }, null, 2));
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
  server.close();
  process.exit(1);
});
