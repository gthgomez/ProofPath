#!/usr/bin/env node
/**
 * First-time learner journey with genuinely empty storage:
 * onboarding -> sample lesson -> fail -> pass -> checkpoint -> evidence ->
 * draft persistence -> backup/reset/import -> offline reload -> packet contents.
 *
 * Run after `npm run build:web`.
 */
import { createServer } from "node:http";
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { extname, join, normalize } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const DIST = process.env.E2E_DIST ?? "dist";
const PORT = Number(process.env.E2E_FIRST_PORT ?? 8096);
const BASE = `http://127.0.0.1:${PORT}`;
const ARTIFACT_DIR = process.env.E2E_ARTIFACT_DIR ?? "artifacts/e2e";
const LESSON_ID = "lesson-python-zero-first-script";
const CORRECT_STARTER = "print(\"first run\")\n";
const EDITED_DRAFT = "print(\"draft survives\")\n";
const CORRECT_ANSWERS = [
  "It prints the text \"first run\" to standard output",
  "It would produce a different output or error",
  "When processing or inspecting session data",
  "A logic error from misunderstanding what the function returns",
  "Extract a helper function for the repeated logic"
];

if (!existsSync(join(DIST, "index.html"))) {
  console.error("No dist/index.html. Run: npm run build:web");
  process.exit(2);
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2"
};

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", BASE).pathname);
  let filePath = join(DIST, normalize(pathname).replace(/^(\.\.[/\\])+/, ""));
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(DIST, "index.html");
  }
  if (pathname === "/sw.js" || pathname === "/" || pathname === "/index.html") {
    response.setHeader("Cache-Control", "no-store");
  }
  response.setHeader("Content-Type", MIME[extname(filePath)] ?? "application/octet-stream");
  createReadStream(filePath).pipe(response);
});

let activePage = null;
const errors = [];

async function waitForText(page, text, timeout = 60000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    try {
      await page.getByText(text, { exact: false }).first().waitFor({ timeout: 2000 });
      return;
    } catch {
      await page.waitForTimeout(400);
    }
  }
  const body = await page.locator("body").innerText().catch(() => "<unavailable>");
  throw new Error(`Text "${text}" did not appear. Tail=${body.slice(-2000)}`);
}

async function main() {
  await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext();
  const page = await context.newPage();
  activePage = page;
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  const results = {};
  try {
    // 1. Empty storage -> onboarding.
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await waitForText(page, "Choose your career path");
    const initialStorage = await page.evaluate(() => window.localStorage.getItem("proofpath.progress.v1"));
    if (initialStorage !== null) {
      throw new Error("first-time journey did not start with empty storage");
    }
    results.onboarding = "present with empty storage";

    // 2. Choose a career path, then open the sample lesson.
    await page.getByRole("button", { name: /Open dashboard/ }).click();
    await waitForText(page, "Today", 30000);
    await page.waitForFunction(() => {
      const stored = JSON.parse(window.localStorage.getItem("proofpath.progress.v1") || "{}");
      return Boolean(stored.profile?.onboardingCompletedAt);
    }, { timeout: 30000 });
    await page.goto(`${BASE}/lesson/${LESSON_ID}`, { waitUntil: "domcontentloaded" });
    await waitForText(page, "Running Your First Script");
    await page.getByRole("button", { name: "Continue to Practice", exact: true }).click();
    await page.getByRole("button", { name: "Continue to Code Lab", exact: true }).click();
    const editor = page.getByLabel("python code editor");
    await editor.waitFor({ state: "visible", timeout: 30000 });

    // 3. Wrong then corrected code.
    await editor.fill("print(\"\")\n");
    await page.getByRole("button", { name: /^Run checks/ }).click();
    await waitForText(page, "CHECKS FAILED", 60000);
    results.incorrect = "failed";
    await editor.fill(CORRECT_STARTER);
    await page.getByRole("button", { name: /^Run checks/ }).click();
    await waitForText(page, "Check passed", 60000);
    results.corrected = "passed";

    // 4. Checkpoint.
    await page.getByRole("button", { name: "Take checkpoint" }).click();
    await waitForText(page, "Step 4 of 5: CHECKPOINT");
    for (const answer of CORRECT_ANSWERS) {
      await page.getByText(answer, { exact: true }).first().click();
    }
    await page.getByRole("button", { name: "Submit checkpoint" }).first().click();
    await waitForText(page, "Checkpoint passed", 60000);
    results.checkpoint = "passed";

    // 5. Portfolio evidence.
    await page.getByRole("button", { name: "Save evidence" }).click();
    await waitForText(page, "Step 5 of 5: EVIDENCE");
    await page.getByText("Go to Evidence Screen", { exact: true }).click();
    await page.getByLabel("Evidence title").fill("Sample lesson proof");
    await page.getByLabel("Evidence note").fill("Ran print(\"first run\") and the Code Lab check passed.");
    await page.getByRole("button", { name: "Save evidence" }).click();
    await waitForText(page, "Sample lesson proof", 30000);
    results.evidence = "saved";

    // 6. Draft persistence after an unrun edit.
    await page.goto(`${BASE}/lesson/${LESSON_ID}`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Code Lab step" }).click();
    const draftEditor = page.getByLabel("python code editor");
    await draftEditor.waitFor({ state: "visible", timeout: 30000 });
    await draftEditor.fill(EDITED_DRAFT);
    await page.waitForTimeout(500);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Code Lab step" }).click();
    await page.waitForFunction(
      (expected) => document.querySelector('textarea[aria-label="python code editor"]')?.value === expected,
      EDITED_DRAFT,
      { timeout: 30000 }
    );
    results.draft = "restored after reload";

    // 7. Backup, reset cancellation, reset, file import, restore.
    await page.goto(`${BASE}/settings`, { waitUntil: "domcontentloaded" });
    await waitForText(page, "Back up or restore progress");
    const download = page.waitForEvent("download");
    await page.getByText("Download backup", { exact: true }).click();
    const backupFile = await download;
    const backupPath = await backupFile.path();
    const backup = JSON.parse(readFileSync(backupPath, "utf8"));
    if (backup.progress?.evidenceItems?.length < 1) {
      throw new Error("backup did not contain saved evidence");
    }

    await page.getByLabel("Progress backup JSON").fill(JSON.stringify(backup));
    await page.getByText("Restore from backup", { exact: true }).click();
    await waitForText(page, "Replace local progress?");
    await page.getByText("Keep my data", { exact: true }).click();
    await page.waitForTimeout(300);
    results.restoreCancel = "progress preserved";

    await page.getByText("Show reset action", { exact: true }).click();
    await page.getByText("Reset progress", { exact: true }).click();
    await waitForText(page, "Reset saved work?");
    await page.getByText("Erase everything", { exact: true }).click();
    await page.waitForTimeout(800);

    const chooserPromise = page.waitForEvent("filechooser");
    await page.getByText("Import backup file", { exact: true }).click();
    const chooser = await chooserPromise;
    await chooser.setFiles(backupPath);
    await waitForText(page, "Replace local progress?");
    await page.getByText("Replace with backup", { exact: true }).click();
    await waitForText(page, "restored from the backup", 60000);
    results.restore = "file import restored";

    // 8. Downloaded packet reflects the restored, self-reported evidence.
    await page.goto(`${BASE}/evidence`, { waitUntil: "domcontentloaded" });
    await waitForText(page, "Interview-ready evidence");
    const packetDownload = page.waitForEvent("download");
    await page.getByText("Download JSON packet", { exact: true }).click();
    const packetFile = await packetDownload;
    const packet = JSON.parse(readFileSync(await packetFile.path(), "utf8"));
    if (!Array.isArray(packet.evidenceItems) || packet.evidenceItems.length < 1) {
      throw new Error("downloaded packet did not contain restored evidence");
    }
    if (packet.summary.autoVerifiedCount !== 0) {
      throw new Error("restored evidence was not downgraded to self-reported");
    }
    results.packet = "restored evidence present and self-reported";

    // 9. Offline shell after installation.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => {
          navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
          setTimeout(resolve, 10000);
        });
      }
    });
    if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), { timeout: 20000 });
    }
    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: "domcontentloaded" });
      await waitForText(page, "Interview-ready evidence", 30000);
      results.offline = "evidence route available without network";
    } finally {
      await context.setOffline(false);
    }

    console.log(JSON.stringify({ ok: true, results, errors }, null, 2));
    if (errors.length > 0) {
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
      await activePage.screenshot({ path: join(ARTIFACT_DIR, "first-time-failure.png"), fullPage: true }).catch(() => undefined);
      const body = await activePage.locator("body").innerText().catch(() => "<unavailable>");
      writeFileSync(join(ARTIFACT_DIR, "first-time-failure.txt"), `${body}\n\nErrors:\n${errors.join("\n")}\n\n${String(error)}`);
    }
  } catch {
    // ignore artifact failure
  }
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
  server.close();
  process.exit(1);
});
