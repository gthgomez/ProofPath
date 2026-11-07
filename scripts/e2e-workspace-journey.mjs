#!/usr/bin/env node
/**
 * Workspace -> real verifier -> mission -> reviewer packet, in a real browser.
 *
 * The browser exports the full Study Tracker workspace. Node reconstructs the
 * files, runs the real verifier (failing first), repairs schema.sql, reruns it,
 * and feeds the actual manifest back into the app. The app records self-reported
 * evidence, the learner places out the Python track, and the mission awards.
 */
import { createServer } from "node:http";
import { spawnSync } from "node:child_process";
import {
  createReadStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, extname, join, normalize } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const DIST = process.env.E2E_DIST ?? "dist";
const PORT = Number(process.env.E2E_WORKSPACE_PORT ?? 8095);
const BASE = `http://127.0.0.1:${PORT}`;
const ARTIFACT_DIR = process.env.E2E_ARTIFACT_DIR ?? "artifacts/e2e";
const TASK_ID = "task-study-tracker-full-journey";
const MISSION_ID = "mission-cli-study-tracker";
const PLACEMENT_ANSWERS = [
  "The .py extension identifies this as a Python script file",
  "The command is \"python hello.py\" — the $ is just the prompt symbol",
  "It prints the text \"first run\" to standard output",
  "You must save the file before rerunning, or the old version still runs",
  "It causes a SyntaxError because the closing quote is missing"
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
  ".svg": "image/svg+xml"
};

const server = createServer((request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", BASE).pathname);
  let filePath = join(DIST, normalize(pathname).replace(/^(\.\.[/\\])+/, ""));
  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(DIST, "index.html");
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
  throw new Error(`Text "${text}" did not appear. Tail=${body.slice(-2500)}`);
}

function run(command, args, cwd) {
  return spawnSync(command, args, { cwd, encoding: "utf8", timeout: 180000 });
}

function parseManifest(stdout) {
  const lines = stdout.trim().split(/\r?\n/).filter(Boolean);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    try {
      const parsed = JSON.parse(lines[index]);
      if (parsed.taskId && parsed.results) {
        return parsed;
      }
    } catch {
      // stderr/progress lines are allowed before the JSON manifest.
    }
  }
  throw new Error(`verifier did not print a manifest. stdout=${stdout.slice(-1000)}`);
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

  const workDir = mkdtempSync(join(tmpdir(), "proofpath-workspace-journey-"));
  const results = {};

  try {
    // Onboard so evidence is not gated.
    await page.goto(BASE, { waitUntil: "domcontentloaded" });
    await waitForText(page, "Choose your career path");
    await page.getByRole("button", { name: /Open dashboard/ }).click();
    await waitForText(page, "Today", 30000);

    // Export the workspace through the UI.
    await page.goto(`${BASE}/workspace?taskId=${TASK_ID}`, { waitUntil: "domcontentloaded" });
    await waitForText(page, "Export the workspace");
    const download = page.waitForEvent("download");
    await page.getByText("Download workspace file", { exact: true }).click();
    const bundleFile = await download;
    const bundle = JSON.parse(readFileSync(await bundleFile.path(), "utf8"));
    if (bundle.taskId !== TASK_ID || !Array.isArray(bundle.files)) {
      throw new Error("workspace export did not contain the expected task/files");
    }
    for (const file of bundle.files) {
      const target = join(workDir, file.path);
      mkdirSync(dirname(target), { recursive: true });
      writeFileSync(target, file.content);
    }
    results.exportedFiles = bundle.files.length;

    // Real verifier: fail first.
    const install = run("npm", ["install", "--no-audit", "--no-fund"], workDir);
    if (install.status !== 0) {
      throw new Error(`npm install failed: ${install.stderr.slice(-1000)}`);
    }
    const failing = run("python3", ["verify_journey.py"], workDir);
    if (failing.status === 0) {
      throw new Error("starter workspace unexpectedly passed the verifier");
    }
    results.starter = "failed as intended";

    // Repair the weekly view exactly as README specifies.
    const schemaPath = join(workDir, "schema.sql");
    const schema = readFileSync(schemaPath, "utf8");
    const repaired = schema.replace(
      /CREATE VIEW IF NOT EXISTS weekly_summary AS[\s\S]*$/m,
      `CREATE VIEW IF NOT EXISTS weekly_summary AS
SELECT
  strftime('%Y-W%W', date) AS week,
  topic,
  COUNT(*) AS session_count,
  SUM(minutes) AS total_minutes
FROM study_sessions
GROUP BY week, topic
ORDER BY week, topic;
`
    );
    if (repaired === schema) {
      throw new Error("could not find the weekly_summary view in schema.sql");
    }
    writeFileSync(schemaPath, repaired);

    const passing = run("python3", ["verify_journey.py"], workDir);
    if (passing.status !== 0) {
      throw new Error(`repaired workspace still failed: ${passing.stderr.slice(-1500)}`);
    }
    const manifest = parseManifest(passing.stdout);
    if (!manifest.results.every((result) => result.passed)) {
      throw new Error("manifest contains failed checks");
    }
    results.verifier = "failed starter -> repaired -> passed";

    // Paste the real manifest back.
    await page.getByLabel("Result manifest JSON").fill(JSON.stringify(manifest));
    await page.getByLabel("README status basic").click();
    await page.getByLabel("Workspace reflection").fill(
      "This project proves Python input validation, SQLite weekly aggregation, and a real TypeScript contract check. The verifier output above is from my machine, so it is self-reported rather than independently executed by ProofPath."
    );
    await page.getByRole("button", { name: "Validate & save evidence" }).click();
    await waitForText(page, "Saved as self-reported evidence", 30000);
    results.evidence = "saved with README and reflection";

    // Place out of the Python track so the mission's preparation gate is met.
    await page.goto(`${BASE}/path`, { waitUntil: "domcontentloaded" });
    await waitForText(page, "Placement: Test out of this track");
    const placementButtons = page.getByRole("button", { name: /Placement: Test out of this track/ });
    const total = await placementButtons.count();
    let foundPython = false;
    for (let index = 0; index < total && !foundPython; index += 1) {
      await placementButtons.nth(index).click();
      await waitForText(page, "Question 1 of", 15000);
      const modalText = await page.locator("body").innerText();
      if (!modalText.includes("Python Fundamentals")) {
        await page.getByRole("button", { name: "Cancel Test" }).click();
        await page.waitForTimeout(300);
        continue;
      }
      foundPython = true;
      for (const answer of PLACEMENT_ANSWERS) {
        await page.getByText(answer, { exact: true }).first().click();
        const submit = page.getByRole("button", { name: /Submit Answer|Finish Test/ });
        await submit.click();
        await page.waitForTimeout(200);
      }
      await waitForText(page, "Passed Placement Test!", 20000);
      await page.getByRole("button", { name: "Back to Roadmap" }).click();
    }
    if (!foundPython) {
      throw new Error("could not find the Python placement test");
    }
    results.placement = "Python track placed out";

    // Mission should award from coherent evidence + satisfied preparation.
    await page.goto(`${BASE}/mission/${MISSION_ID}`, { waitUntil: "domcontentloaded" });
    await waitForText(page, "award captured", 30000);
    results.mission = "award captured";

    // Reviewer packet: project info, self-reported provenance, reproduction data.
    await page.goto(`${BASE}/evidence`, { waitUntil: "domcontentloaded" });
    await waitForText(page, "Interview-ready evidence");
    const packetDownload = page.waitForEvent("download");
    await page.getByText("Download JSON packet", { exact: true }).click();
    const packetFile = await packetDownload;
    const packet = JSON.parse(readFileSync(await packetFile.path(), "utf8"));
    const missionEvidence = packet.missions?.find((entry) => entry.missionId === MISSION_ID);
    if (!missionEvidence || missionEvidence.evidenceItems.length === 0) {
      throw new Error("reviewer packet did not include mission evidence");
    }
    const item = missionEvidence.evidenceItems[0];
    if (item.trust !== "manual_verifier_output") {
      throw new Error(`workspace evidence was misclassified as ${item.trust}`);
    }
    if (!String(item.verifierOutput || "").includes(manifest.taskId)) {
      throw new Error("reviewer packet did not preserve the manifest provenance");
    }
    if (!String(item.reflection || "").includes("self-reported")) {
      throw new Error("reviewer packet did not preserve the reflection");
    }
    if (packet.summary.autoVerifiedCount !== 0) {
      throw new Error("self-reported workspace evidence was counted as independently verified");
    }
    results.reviewerPacket = "mission evidence present, self-reported, manifest preserved";

    console.log(JSON.stringify({ ok: true, results, errors }, null, 2));
    if (errors.length > 0) {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    server.close();
    rmSync(workDir, { recursive: true, force: true });
  }
}

main().catch(async (error) => {
  try {
    mkdirSync(ARTIFACT_DIR, { recursive: true });
    if (activePage) {
      await activePage.screenshot({ path: join(ARTIFACT_DIR, "workspace-failure.png"), fullPage: true }).catch(() => undefined);
      const body = await activePage.locator("body").innerText().catch(() => "<unavailable>");
      writeFileSync(join(ARTIFACT_DIR, "workspace-failure.txt"), `${body}\n\nErrors:\n${errors.join("\n")}\n\n${String(error)}`);
    }
  } catch {
    // ignore artifact failure
  }
  console.error(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }, null, 2));
  server.close();
  process.exit(1);
});
