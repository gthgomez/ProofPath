#!/usr/bin/env node
/**
 * Offline update safety in a real browser:
 * - install version A, go offline, verify the shell and Python runtime still work;
 * - stage version B with one missing required asset and verify A survives;
 * - repair B, update, and verify B loads and remains usable offline;
 * - confirm old caches are removed only after the new cache is complete.
 *
 * Run after `npm run build:web`. Uses temporary copies of `dist`.
 */
import { createServer } from "node:http";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const ROOT = process.cwd();
const SOURCE = join(ROOT, "dist");
const PORT = Number(process.env.E2E_UPDATE_PORT ?? 8097);
const BASE = `http://127.0.0.1:${PORT}`;
const ARTIFACT_DIR = process.env.E2E_ARTIFACT_DIR ?? "artifacts/e2e";
const PYTHON_LESSON = "lesson-python-zero-first-script";

if (!existsSync(join(SOURCE, "index.html"))) {
  console.error("No dist/index.html. Run: npm run build:web");
  process.exit(2);
}

let activePage = null;
const workRoot = mkdtempSync(join(tmpdir(), "proofpath-offline-update-"));
const versionA = join(workRoot, "a");
const versionB = join(workRoot, "b");
cpSync(SOURCE, versionA, { recursive: true });
cpSync(SOURCE, versionB, { recursive: true });

function markBuild(directory, marker) {
  const file = join(directory, "index.html");
  const html = readFileSync(file, "utf8");
  writeFileSync(file, html.replace("</head>", `<meta name="proofpath-build" content="${marker}"></head>`));
}

function generateWorker(directory) {
  execFileSync(process.execPath, [join(ROOT, "scripts/generate-service-worker.mjs")], {
    cwd: ROOT,
    env: { ...process.env, E2E_DIST: directory },
    stdio: "pipe"
  });
  const sw = readFileSync(join(directory, "sw.js"), "utf8");
  const match = sw.match(/const VERSION = "([^"]+)"/);
  if (!match) {
    throw new Error("generated service worker has no version");
  }
  return match[1];
}

markBuild(versionA, "A");
markBuild(versionB, "B");
const cacheA = generateWorker(versionA);
const cacheB = generateWorker(versionB);

// Produce a genuinely incomplete version B: keep the generated precache list,
// then remove one asset it requires.
const entryCandidates = [];
function findEntry(directory) {
  const staticDir = join(directory, "_expo/static/js/web");
  for (const name of require("node:fs").readdirSync(staticDir)) {
    if (name.endsWith(".js")) {
      entryCandidates.push(join(staticDir, name));
    }
  }
  return entryCandidates.sort((left, right) => statSync(right).size - statSync(left).size)[0];
}
const missingAsset = findEntry(versionB);
const missingBytes = readFileSync(missingAsset);
rmSync(missingAsset);

let activeDirectory = versionA;
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".wasm": "application/wasm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};
const ASSET_PREFIXES = ["/_expo/", "/sandbox-assets/", "/assets/"];

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", BASE).pathname);
  const safePath = normalize(pathname).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(activeDirectory, safePath);
  const extension = extname(filePath);

  if (pathname === "/sw.js" || pathname === "/" || pathname === "/index.html") {
    response.setHeader("Cache-Control", "no-store");
  }

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    const isAsset = ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix)) || extension !== "";
    if (isAsset) {
      response.statusCode = 404;
      response.end("not found");
      return;
    }
    filePath = join(activeDirectory, "index.html");
  }

  response.setHeader("Content-Type", MIME[extname(filePath)] ?? "application/octet-stream");
  response.end(readFileSync(filePath));
});

const versionTextA = `proofpath-shell-${cacheA}`;
const versionTextB = `proofpath-shell-${cacheB}`;

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
  throw new Error(`Text "${text}" did not appear`);
}

async function openCodeLab(page) {
  const editor = page.getByLabel("python code editor");
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await page.getByRole("button", { name: "Code Lab step" }).click();
    try {
      await editor.waitFor({ state: "visible", timeout: 5000 });
      return;
    } catch {
      await page.waitForTimeout(500);
    }
  }
  throw new Error("Code Lab editor did not appear");
}

async function runPythonProof(page, expectText, timeout = 90000) {
  await page.goto(`${BASE}/lesson/${PYTHON_LESSON}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Code Lab step" }).waitFor({ state: "visible", timeout: 60000 });
  await openCodeLab(page);
  const editor = page.getByLabel("python code editor");
  await editor.fill("print(\"first run\")\n");
  await page.waitForTimeout(200);
  await page.getByRole("button", { name: /^Run checks/ }).click();
  await waitForText(page, expectText, timeout);
}

async function ensureControlled(page) {
  const controlled = await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (navigator.serviceWorker.controller) return true;
    await new Promise((resolve) => {
      navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
      setTimeout(resolve, 10000);
    });
    return Boolean(navigator.serviceWorker.controller);
  });
  if (!controlled) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller), { timeout: 20000 });
  }
}

async function controllerChange(page, timeout = 30000) {
  return page.evaluate((limit) => new Promise((resolve) => {
    if (!navigator.serviceWorker.controller) {
      resolve(false);
      return;
    }
    let done = false;
    const finish = (value) => {
      if (!done) {
        done = true;
        resolve(value);
      }
    };
    navigator.serviceWorker.addEventListener("controllerchange", () => finish(true), { once: true });
    setTimeout(() => finish(false), limit);
  }), timeout);
}

async function cacheKeys(page) {
  return page.evaluate(() => caches.keys());
}

async function main() {
  await new Promise((resolve) => server.listen(PORT, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const context = await browser.newContext();
  const page = await context.newPage();
  activePage = page;
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));

  const results = {};
  try {
    // Version A install and offline proof.
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await ensureControlled(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    results.initialBuild = await page.evaluate(() => document.querySelector('meta[name="proofpath-build"]')?.content ?? "A");

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await runPythonProof(page, "Check passed");
    results.offlineRuntimeA = "passed";
    await context.setOffline(false);

    // Stage B with one required asset missing. Installation must fail and A
    // must remain the active offline app.
    activeDirectory = versionB;
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    });
    await page.waitForTimeout(8000);
    const afterFailedInstall = await cacheKeys(page);
    if (afterFailedInstall.includes(versionTextB)) {
      throw new Error("incomplete version B cache was retained");
    }
    if (!afterFailedInstall.includes(versionTextA)) {
      throw new Error("version A cache disappeared after a failed update");
    }

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    const stillA = await page.evaluate(() => document.querySelector('meta[name="proofpath-build"]')?.content ?? "A");
    await runPythonProof(page, "Check passed");
    results.failedUpdatePreservedA = stillA;
    await context.setOffline(false);

    // Repair B and update for real.
    writeFileSync(missingAsset, missingBytes);
    const changed = controllerChange(page);
    await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    });
    const didChange = await changed;
    if (!didChange) {
      throw new Error("version B did not activate after a complete install");
    }
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelector('meta[name="proofpath-build"]')?.content === "B", { timeout: 15000 });
    results.updatedBuild = "B";

    const keysAfterUpdate = await cacheKeys(page);
    if (!keysAfterUpdate.includes(versionTextB) || keysAfterUpdate.includes(versionTextA)) {
      throw new Error(`unexpected caches after update: ${keysAfterUpdate.join(", ")}`);
    }

    await context.setOffline(true);
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => document.querySelector('meta[name="proofpath-build"]')?.content === "B", { timeout: 15000 });
    await runPythonProof(page, "Check passed");
    results.offlineRuntimeB = "passed";
    results.offlineDeepLink = "served from version B shell";
    await context.setOffline(false);

    console.log(JSON.stringify({ ok: true, results, errors }, null, 2));
    if (errors.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    server.close();
    rmSync(workRoot, { recursive: true, force: true });
  }
}

main().catch(async (error) => {
  try {
    mkdirSync(ARTIFACT_DIR, { recursive: true });
    if (activePage) {
      await activePage.screenshot({ path: join(ARTIFACT_DIR, "offline-update-failure.png"), fullPage: true }).catch(() => undefined);
      const body = await activePage.locator("body").innerText().catch(() => "<unavailable>");
      writeFileSync(join(ARTIFACT_DIR, "offline-update-failure.txt"), `${body}\n\n${String(error)}`);
    } else {
      writeFileSync(join(ARTIFACT_DIR, "offline-update-failure.txt"), String(error));
    }
  } catch {
    // ignore artifact failure
  }
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
  server.close();
  rmSync(workRoot, { recursive: true, force: true });
  process.exit(1);
});
