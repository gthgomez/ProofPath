import {
  buildTerminalTranscript,
  codeRunCommand,
  CURRENT_SANDBOX_DISCLOSURE_VERSION,
  defaultFileName,
  emptyHiddenCheckSummary,
  normalizeCodeRunAttempt,
  redactCheckResults
} from "@/domain/code-run";
import type { CodeRunAttempt, CodeRunMode, CodeRunTestResult, LessonRunnerSpec, LessonRunnerTest, RunnerLanguage } from "@/domain/types";
import { buildProblemDiagnostics } from "@/sandbox/diagnostics";
import {
  classifySandboxError,
  formatPolicyViolationFeedback,
  formatSandboxFailureFeedback
} from "@/sandbox/feedback";
import { validateSandboxSubmission } from "@/sandbox/policy";
import {
  assertTypeScriptSourceWithinLimit,
  evaluateTypeScriptTypeCheck,
  loadTypeScriptLibFiles,
  type TypeScriptCompiler,
  type TypeScriptTypeCheckResult
} from "@/sandbox/typescript-typecheck";
import {
  canUsePreemptibleSandbox,
  getSandboxWorkerRuntime,
  SandboxStartupError,
  SandboxTerminatedError
} from "@/sandbox/execution-worker";

type SqlJsModule = {
  Database: new () => {
    run: (sql: string) => void;
    exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }>;
    close: () => void;
  };
};

let pyodideRuntime: unknown | null = null;
let sqlRuntime: SqlJsModule | null = null;
let pyodidePromise: Promise<any> | null = null;
let sqlPromise: Promise<SqlJsModule> | null = null;
let typeScriptRuntime: TypeScriptCompiler | null = null;
let typeScriptPromise: Promise<TypeScriptCompiler> | null = null;
const PYODIDE_INDEX_URL = "/sandbox-assets/pyodide/";
const SQLJS_DIST_URL = "/sandbox-assets/sql.js/";
const TYPESCRIPT_DIST_URL = "/sandbox-assets/typescript/";

// Python's `__name__` for a file run directly is "__main__"; imported modules use
// their own name. The sandbox has no real module name for checks, so it uses a
// neutral import-style sentinel that guarantees `__name__ != "__main__"`.
// The native WebView runner mirrors these exact values.
export const PYTHON_DIRECT_RUN_NAME = "__main__";
export const PYTHON_IMPORT_RUN_NAME = "<module>";

// A test's `code` may carry trusted harness SQL that seeds the freshly created
// database before the learner query runs. The harness is privileged (it is not
// gated by validateSandboxSubmission), so it is restricted to seed-safe
// statements only: SELECT, WITH, INSERT, and CREATE. Anything else (UPDATE,
// DELETE, DROP, ALTER, VACUUM, PRAGMA, ATTACH, DETACH, REINDEX, ANALYZE, ...)
// is rejected, and legacy checks with non-SQL placeholder tokens (for example
// "EXPECT_ROWS:...") or comment-only notes are never executed as SQL.
//
// This prefix pattern only inspects the FIRST statement. Because `db.run`
// executes every `;`-separated statement, it must be combined with
// `isTrustedSqlHarness` below, which also rejects destructive/admin keywords and
// requires every statement to be seed-safe. The native WebView runner embeds the
// same combined gate.
export const SQL_HARNESS_PATTERN =
  /^\s*(?:(?:--[^\n]*\n?|\/\*[\s\S]*?\*\/)\s*)*(SELECT|WITH|INSERT|CREATE)\b/i;

// Destructive/admin operations trusted harness SQL must never contain. Mirrors
// `dangerousSetupCodePattern` in scripts/validate-content.ts so the runtime gate
// and the build-time content validator agree on what "seed-safe" means.
export const SQL_HARNESS_DANGEROUS_PATTERN =
  /\b(DROP|ATTACH|DETACH|PRAGMA|load_extension|UPDATE|DELETE|ALTER|VACUUM|REINDEX|ANALYZE|REPLACE\s+INTO|CREATE\s+(?:(?:TEMP|TEMPORARY)\s+)?TRIGGER|CREATE\s+VIRTUAL\s+TABLE)\b/i;

/**
 * Blanks SQL comments and quoted regions so keyword checks inspect executable
 * statements rather than words inside seed literals or comments. Mirrors
 * `stripSqlLiteralsAndComments` in scripts/validate-content.ts.
 */
export function stripSqlLiteralsAndComments(code: string): string {
  let sanitized = "";
  let index = 0;

  const blankChar = (char: string): string => (char === "\n" ? "\n" : " ");

  while (index < code.length) {
    const char = code[index];
    const next = code[index + 1];

    if (char === "-" && next === "-") {
      sanitized += "  ";
      index += 2;
      while (index < code.length && code[index] !== "\n") {
        sanitized += " ";
        index += 1;
      }
      continue;
    }

    if (char === "/" && next === "*") {
      sanitized += "  ";
      index += 2;
      while (index < code.length) {
        if (code[index] === "*" && code[index + 1] === "/") {
          sanitized += "  ";
          index += 2;
          break;
        }
        sanitized += blankChar(code[index]);
        index += 1;
      }
      continue;
    }

    const quote = char === "'" ? "'" : char === '"' ? '"' : char === "`" ? "`" : char === "[" ? "]" : null;
    if (quote) {
      const escapeDoubled = quote !== "]";
      sanitized += " ";
      index += 1;
      while (index < code.length) {
        if (code[index] === quote) {
          if (escapeDoubled && code[index + 1] === quote) {
            sanitized += "  ";
            index += 2;
            continue;
          }
          sanitized += " ";
          index += 1;
          break;
        }
        sanitized += blankChar(code[index]);
        index += 1;
      }
      continue;
    }

    sanitized += char;
    index += 1;
  }

  return sanitized;
}

/**
 * Returns true only when a check's trusted harness `code` is seed-safe. The
 * prefix pattern rejects comment-only notes and non-SQL placeholder tokens; this
 * additionally rejects destructive/admin keywords anywhere in the executable
 * text and requires every `;`-separated statement to start with SELECT/WITH/
 * INSERT/CREATE. That closes the multi-statement bypass (`INSERT ...; DROP ...`)
 * that `db.run` would otherwise execute in full.
 */
export function isTrustedSqlHarness(code: string): boolean {
  if (!SQL_HARNESS_PATTERN.test(code)) {
    return false;
  }

  const stripped = stripSqlLiteralsAndComments(code);
  if (SQL_HARNESS_DANGEROUS_PATTERN.test(stripped)) {
    return false;
  }

  for (const statement of stripped.split(";")) {
    const trimmed = statement.trim();
    if (trimmed.length > 0 && !/^(SELECT|WITH|INSERT|CREATE)\b/i.test(trimmed)) {
      return false;
    }
  }

  return true;
}

declare global {
  // Test environments that run code inside a VM may not allow dynamic import from new Function.
  // Production bundles should leave this unset and use the bundler-safe import path below.
  var __proofpathImportRuntimeModuleForTests: ((specifier: string) => Promise<unknown>) | undefined;

  interface Window {
    loadPyodide?: (options?: { indexURL?: string }) => Promise<unknown>;
    initSqlJs?: (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsModule>;
    ts?: TypeScriptCompiler;
    PROOFPATH_TYPESCRIPT_LIBS?: Record<string, string>;
  }
}

async function importRuntimeModule(specifier: string): Promise<unknown> {
  if (globalThis.__proofpathImportRuntimeModuleForTests) {
    return globalThis.__proofpathImportRuntimeModuleForTests(specifier);
  }

  const isHermes = typeof globalThis !== "undefined" && (globalThis as any).HermesInternal !== undefined;
  const isReactNative = typeof navigator !== "undefined" && navigator.product === "ReactNative";
  if (isHermes || isReactNative) {
    throw new Error("Dynamic import is not supported in Hermes/ReactNative environment.");
  }

  try {
    const importFn = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<unknown>;
    return importFn(specifier);
  } catch (error) {
    throw new Error(`Dynamic import is not supported in this environment: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function normalizeOutput(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function includesAll(output: string, needles: string[] = []): boolean {
  const normalizedOutput = output.toLowerCase();
  return needles.every((needle) => normalizedOutput.includes(needle.toLowerCase()));
}

function outputHasExactLines(output: string, expectedLines: string[]): boolean {
  const lines = new Set(
    output.split("\n").map((line) => line.trim().toLowerCase()).filter(Boolean)
  );
  return expectedLines.every((expected) => lines.has(expected.trim().toLowerCase()));
}

// Exact-line checks identify the learner's answer as a whole line, so taught
// misconceptions that merely contain the answer as a substring still fail.
// Exact-set matching: the output must be exactly the expected lines, with no
// extras. Subset matching tolerates extra rows, which lets a query that forgot
// its filter (or a constant UNION of every literal) satisfy a filtering lesson.
function outputMatchesExactSet(output: string, expectedLines: string[]): boolean {
  const actual = new Set(
    output.split("\n").map((line) => line.trim().toLowerCase()).filter(Boolean)
  );
  const expected = new Set(expectedLines.map((line) => line.trim().toLowerCase()));
  if (actual.size !== expected.size) {
    return false;
  }
  return [...expected].every((line) => actual.has(line));
}

function passesOutputCheck(output: string, test: LessonRunnerTest): boolean {
  if (test.expectedOutputExactLines && test.expectedOutputExactLines.length > 0) {
    return test.expectedOutputExactSet
      ? outputMatchesExactSet(output, test.expectedOutputExactLines)
      : outputHasExactLines(output, test.expectedOutputExactLines);
  }
  return includesAll(output, test.expectedOutputIncludes);
}

function sameOriginAssetUrl(path: string): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}${path}`;
  }

  return path;
}

function passResult(test: LessonRunnerTest, visible: boolean, message = "Passed"): CodeRunTestResult {
  return {
    id: test.id,
    name: test.name,
    passed: true,
    visible,
    message
  };
}

function failResult(
  test: LessonRunnerTest,
  visible: boolean,
  error: unknown,
  language: LessonRunnerSpec["language"]
): CodeRunTestResult {
  const message = formatSandboxFailureFeedback({
    kind: classifySandboxError(error),
    language,
    detail: error instanceof Error ? error.message : normalizeOutput(error) || "Test failed"
  });
  return {
    id: test.id,
    name: test.name,
    passed: false,
    visible,
    message: message.length > MAX_ERROR_SUMMARY_CHARS
      ? `${message.slice(0, MAX_ERROR_SUMMARY_CHARS)}\n[message truncated]`
      : message
  };
}

function timeoutAfter(timeoutMs: number): Promise<never> {
  return new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error(`Sandbox timed out after ${timeoutMs}ms.`)), timeoutMs);
  });
}

/**
 * Distinguish a real termination from a boundary that only stopped waiting.
 *
 * JavaScript/TypeScript run in a Worker that `terminate()` actually stops.
 * Python/SQL run synchronously in the page realm, so the race timeout cannot
 * preempt them; saying "stopped" there would be dishonest.
 */
export function formatSandboxTimeoutFeedback(language: RunnerLanguage, timeoutMs: number, terminated: boolean): string {
  if (terminated) {
    return [
      "The runner stopped because the code took too long.",
      "This lesson may not need a loop, input(), recursion, or repeated step. Remove any code that keeps waiting or repeating after the answer is already known.",
      "If the lesson does ask for a loop, name the stopping condition in plain English, then make the code match that condition."
    ].join("\n");
  }

  const runtime = language === "sql" ? "SQL" : "Python";
  return [
    `The runner stopped waiting after ${timeoutMs}ms.`,
    `${runtime} in this browser sandbox runs synchronously, so this build cannot force it to stop.`,
    "If the app stays busy, reload the page. Then remove loops, input(), recursion, or repeated work that never reaches an answer."
  ].join("\n");
}

function stripTypeScript(code: string): string {
  return code
    .replace(/type\s+\w+\s*=\s*\{[\s\S]*?\};/g, "")
    .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, "")
    .replace(/:\s*[A-Za-z_$][A-Za-z0-9_$<>,\s[\]|]*(?=\s*[=,);])/g, "");
}

// Exported as a test seam: the generated worker string is what actually runs in
// the browser, so tests evaluate this exact source to prove the inlined evidence
// checks cannot drift from `passesOutputCheck` in this module.
export function createJavaScriptWorkerSource(): string {
  return `
function normalizeOutput(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function classifySandboxError(error) {
  const message = error instanceof Error ? error.message : String(error || "");
  if (/output missing/i.test(message)) return "missing-output";
  if (/timed out|timeout/i.test(message)) return "timeout";
  return "runtime";
}

function formatSandboxFailureMessage(error, language) {
  const kind = classifySandboxError(error);
  const detail = error instanceof Error ? error.message : String(error || "Test failed");
  const label = language === "typescript" ? "TypeScript" : "JavaScript";

  if (kind === "missing-output") {
    return [
      "Not yet. The test ran, but it did not see all of the proof it was looking for.",
      "Think through your " + label + " flow: where is the required value produced, and where is it printed or returned?",
      "Before changing a lot, compare your output with the expected lines. Check for starter values left unchanged, quotes around numbers, empty summaries, and missing print calls."
    ].join("\\n");
  }

  if (kind === "timeout") {
    return [
      "The runner stopped because the code took too long.",
      "This lesson may not need a loop, input(), recursion, or repeated step. Remove any code that keeps waiting or repeating after the answer is already known.",
      "If the lesson does ask for a loop, name the stopping condition in plain English, then make the code match that condition."
    ].join("\\n");
  }

  return [
    "The code crashed before the test could finish checking it.",
    "Read the first " + label + " error clue, then ask: which name, value, or line is the program complaining about?",
    "Error clue: " + detail,
    "Make the smallest change that would prove your next assumption, then run the test again."
  ].join("\\n");
}

function includesAll(output, needles) {
  const normalizedOutput = output.toLowerCase();
  return (needles || []).every((needle) => normalizedOutput.includes(String(needle).toLowerCase()));
}

function outputHasExactLines(output, expectedLines) {
  const lines = new Set(
    output.split("\\n").map(function (line) { return line.trim().toLowerCase(); }).filter(Boolean)
  );
  return (expectedLines || []).every(function (expected) { return lines.has(String(expected).trim().toLowerCase()); });
}

function outputMatchesExactSet(output, expectedLines) {
  const actual = new Set(
    output.split("\\n").map(function (line) { return line.trim().toLowerCase(); }).filter(Boolean)
  );
  const expected = new Set((expectedLines || []).map(function (line) { return String(line).trim().toLowerCase(); }));
  if (actual.size !== expected.size) return false;
  let matched = true;
  expected.forEach(function (line) { if (!actual.has(line)) matched = false; });
  return matched;
}

function passesOutputCheck(output, test) {
  if (test.expectedOutputExactLines && test.expectedOutputExactLines.length > 0) {
    return test.expectedOutputExactSet
      ? outputMatchesExactSet(output, test.expectedOutputExactLines)
      : outputHasExactLines(output, test.expectedOutputExactLines);
  }
  return includesAll(output, test.expectedOutputIncludes);
}

self.onmessage = (event) => {
  const { nonce, language, runMode, runtimeCode, tests, visibleCount } = event.data;
  const stdout = [];
  const stderr = [];
  const testResults = [];
  const MAX_OUTPUT_CHARS = 524288;
  const MAX_ERROR_SUMMARY_CHARS = 2000;
  const OUTPUT_TRUNCATION_MARKER = "[output truncated: exceeded 512KB limit]";
  let totalChars = 0;
  let truncated = false;
  function appendOutput(target, text) {
    if (truncated) return;
    const normalized = normalizeOutput(text);
    const addedLen = normalized.length + 1;
    const remaining = MAX_OUTPUT_CHARS - totalChars;
    if (addedLen >= remaining) {
      const sliceLen = Math.max(0, remaining - OUTPUT_TRUNCATION_MARKER.length - 1);
      const prefix = sliceLen > 0 ? normalized.slice(0, sliceLen) + "\\n" : "";
      target.push(prefix + OUTPUT_TRUNCATION_MARKER);
      truncated = true;
      totalChars = MAX_OUTPUT_CHARS;
    } else {
      target.push(normalized);
      totalChars += addedLen;
    }
  }
  function appendError(target, text) {
    // Failure detail bypasses the output budget: a stdout flood must never be
    // able to erase the line that explains why execution failed. The summary is
    // bounded so it cannot itself become an unbounded allocation.
    const normalized = normalizeOutput(text) || "Unknown error";
    target.push(
      normalized.length > MAX_ERROR_SUMMARY_CHARS
        ? normalized.slice(0, MAX_ERROR_SUMMARY_CHARS) + "\\n[error summary truncated]"
        : normalized
    );
  }
  const sandboxConsole = {
    log: (...values) => appendOutput(stdout, values.map(normalizeOutput).join(" ")),
    error: (...values) => appendOutput(stderr, values.map(normalizeOutput).join(" "))
  };

  // Capture real postMessage for worker completion and protect against learner-emitted messages
  const post = typeof self.postMessage === "function" ? self.postMessage.bind(self) : function() {};
  try {
    delete self.postMessage;
  } catch (_) {}
  self.postMessage = function() {};

  if (runMode === "run_file") {
    let executionError = null;
    try {
      const runner = new Function("console", "postMessage", "self", "window", "globalThis", "\\"use strict\\";\\n" + runtimeCode);
      runner(sandboxConsole, undefined, undefined, undefined, undefined);
    } catch (error) {
      executionError = error instanceof Error ? error.message : String(error);
      appendError(stderr, executionError);
    }
    post({
      nonce,
      stdout: stdout.join("\\n"),
      stderr: stderr.join("\\n"),
      testResults,
      executionError,
      outputTruncated: truncated
    });
    return;
  }

  for (let index = 0; index < tests.length; index += 1) {
    const test = tests[index];
    const visible = index < visibleCount;
    const stdoutStart = stdout.length;
    const stderrStart = stderr.length;

    try {
      const runner = new Function("console", "postMessage", "self", "window", "globalThis", "\\"use strict\\";\\n" + runtimeCode + "\\n" + test.code);
      runner(sandboxConsole, undefined, undefined, undefined, undefined);
      const output = stdout.slice(stdoutStart).join("\\n");
      if (!passesOutputCheck(output, test)) {
        throw new Error("Output missing");
      }
      testResults.push({ id: test.id, name: test.name, passed: true, visible, message: "Passed" });
    } catch (error) {
      if (visible) {
        appendError(stderr, error instanceof Error ? error.message : String(error || "Test failed"));
      }
      testResults.push({
        id: test.id,
        name: test.name,
        passed: false,
        visible,
        message: formatSandboxFailureMessage(error, language)
      });
    } finally {
      // Hidden check output must never reach learner-visible stdout or stderr.
      // Roll back both buffers unconditionally; no failure branch is allowed to
      // preserve earlier private output (for example a sentinel printed before a
      // failing expectation).
      if (!visible) {
        stdout.length = stdoutStart;
        stderr.length = stderrStart;
      }
    }
  }

  post({
    nonce,
    stdout: stdout.join("\\n"),
    stderr: stderr.join("\\n"),
    testResults,
    executionError: null,
    outputTruncated: truncated
  });
};
`;
}

export const MAX_OUTPUT_CHARS = 524288;
const MAX_ERROR_SUMMARY_CHARS = 2000;
export const OUTPUT_TRUNCATION_MARKER = "[output truncated: exceeded 512KB limit]";

/**
 * Raw execution result. `executionError` is an explicit success/failure signal
 * that is independent of whether any output buffer retained text: a run that
 * prints past the output cap and then throws must still be reported as failed.
 */
export interface RunnerExecution {
  stdout: string;
  stderr: string;
  testResults: CodeRunTestResult[];
  executionError: string | null;
  outputTruncated: boolean;
}

export interface OutputCapper {
  append(target: string[], text: unknown): void;
  /** Append bounded failure detail, bypassing the output budget. */
  appendError(target: string[], text: unknown): void;
  readonly truncated: boolean;
}

export function createOutputCapper(maxChars = MAX_OUTPUT_CHARS): OutputCapper {
  let totalChars = 0;
  let truncated = false;
  return {
    get truncated() {
      return truncated;
    },
    append(target: string[], text: unknown) {
      if (truncated) return;
      const normalized = normalizeOutput(text);
      const addedLen = normalized.length + 1;
      const remaining = maxChars - totalChars;
      if (addedLen >= remaining) {
        const sliceLen = Math.max(0, remaining - OUTPUT_TRUNCATION_MARKER.length - 1);
        const prefix = sliceLen > 0 ? normalized.slice(0, sliceLen) + "\n" : "";
        target.push(prefix + OUTPUT_TRUNCATION_MARKER);
        truncated = true;
        totalChars = maxChars;
      } else {
        target.push(normalized);
        totalChars += addedLen;
      }
    },
    appendError(target: string[], text: unknown) {
      // Failure detail bypasses the output budget: a stdout flood must never be
      // able to erase the line that explains why execution failed. The summary is
      // bounded so it cannot itself become an unbounded allocation.
      const normalized = normalizeOutput(text) || "Unknown error";
      target.push(
        normalized.length > MAX_ERROR_SUMMARY_CHARS
          ? `${normalized.slice(0, MAX_ERROR_SUMMARY_CHARS)}\n[error summary truncated]`
          : normalized
      );
    }
  };
}

interface WorkerResultMessage {
  nonce?: string;
  stdout?: unknown;
  stderr?: unknown;
  testResults?: unknown;
  executionError?: unknown;
  outputTruncated?: unknown;
}

function parseWorkerResultMessage(data: WorkerResultMessage | null | undefined, nonce: string): RunnerExecution | null {
  if (!data || data.nonce !== nonce) {
    return null;
  }

  if (typeof data.stdout !== "string" || typeof data.stderr !== "string" || !Array.isArray(data.testResults)) {
    return null;
  }

  const testResults: CodeRunTestResult[] = [];
  for (const candidate of data.testResults) {
    if (!candidate || typeof candidate !== "object") {
      continue;
    }
    const result = candidate as Partial<CodeRunTestResult>;
    if (typeof result.id !== "string" || typeof result.name !== "string" || typeof result.passed !== "boolean") {
      continue;
    }
    testResults.push({
      id: result.id,
      name: result.name,
      passed: result.passed,
      visible: result.visible !== false,
      message: typeof result.message === "string" ? result.message : ""
    });
  }

  return {
    stdout: data.stdout,
    stderr: data.stderr,
    testResults,
    executionError: typeof data.executionError === "string" ? data.executionError : null,
    outputTruncated: data.outputTruncated === true
  };
}

async function runJavaScriptInWorker(spec: LessonRunnerSpec, runtimeCode: string, runMode: CodeRunMode): Promise<RunnerExecution> {
  if (typeof Worker === "undefined" || typeof Blob === "undefined" || typeof URL === "undefined") {
    throw new Error("JavaScript sandbox isolation is unavailable because this environment does not support Web Workers.");
  }

  return new Promise((resolve, reject) => {
    const workerUrl = URL.createObjectURL(new Blob([createJavaScriptWorkerSource()], { type: "text/javascript" }));
    const worker = new Worker(workerUrl);
    const nonce = `pp-worker-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const timeoutId = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(new Error(`Sandbox worker timed out after ${spec.timeoutMs}ms.`));
    }, spec.timeoutMs);

    worker.onmessage = (event: MessageEvent<WorkerResultMessage>) => {
      const parsed = parseWorkerResultMessage(event.data, nonce);
      if (!parsed) {
        // Discard unauthorized, forged, or malformed messages emitted by learner
        // code. The authentic result still arrives under the unguessable nonce.
        return;
      }
      clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve(parsed);
    };

    worker.onerror = (event) => {
      clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(new Error(event.message || "Sandbox worker failed."));
    };

    worker.postMessage({
      nonce,
      language: spec.language,
      runMode,
      runtimeCode,
      tests: [...spec.visibleTests, ...spec.hiddenTests],
      visibleCount: spec.visibleTests.length
    });
  });
}

function loadScriptAsset(src: string, label: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Unable to load ${label}.`));
    document.head.appendChild(script);
  });
}

async function getTypeScript(): Promise<TypeScriptCompiler> {
  if (typeScriptRuntime) {
    return typeScriptRuntime;
  }

  if (typeScriptPromise) {
    return typeScriptPromise;
  }

  typeScriptPromise = (async () => {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      if (!window.ts) {
        await loadScriptAsset(sameOriginAssetUrl(`${TYPESCRIPT_DIST_URL}typescript.js`), "TypeScript compiler runtime");
      }

      if (!window.ts) {
        throw new Error("TypeScript compiler runtime loaded without ts.");
      }

      if (!window.PROOFPATH_TYPESCRIPT_LIBS) {
        await loadScriptAsset(sameOriginAssetUrl(`${TYPESCRIPT_DIST_URL}typescript-libs.js`), "TypeScript library assets");
      }

      if (!window.PROOFPATH_TYPESCRIPT_LIBS) {
        throw new Error("TypeScript library assets loaded without libs.");
      }

      typeScriptRuntime = window.ts;
      return typeScriptRuntime;
    }

    const loaded = await importRuntimeModule("typescript");
    typeScriptRuntime = ((loaded as { default?: TypeScriptCompiler }).default ?? loaded) as TypeScriptCompiler;
    return typeScriptRuntime;
  })().catch((error) => {
    // Clear the rejected promise so a transient asset-load failure can be
    // retried instead of poisoning every later type check.
    typeScriptPromise = null;
    throw error;
  });

  return typeScriptPromise;
}

function getTypeScriptLibFiles(ts: TypeScriptCompiler): Record<string, string> {
  if (typeof window !== "undefined" && window.PROOFPATH_TYPESCRIPT_LIBS) {
    return window.PROOFPATH_TYPESCRIPT_LIBS;
  }

  return loadTypeScriptLibFiles(ts);
}

async function typeCheckTypeScript(code: string): Promise<TypeScriptTypeCheckResult> {
  const ts = await getTypeScript();
  return evaluateTypeScriptTypeCheck(ts, getTypeScriptLibFiles(ts), defaultFileName("typescript"), code);
}

function typeCheckFailureResult(
  spec: LessonRunnerSpec,
  runMode: CodeRunMode,
  typeCheck: TypeScriptTypeCheckResult
): RunnerExecution {
  if (runMode === "run_file") {
    return {
      stdout: "",
      stderr: typeCheck.stderr,
      testResults: [],
      executionError: typeCheck.stderr || "TypeScript type check failed.",
      outputTruncated: false
    };
  }

  const tests = [...spec.visibleTests, ...spec.hiddenTests];
  return {
    stdout: "",
    stderr: typeCheck.stderr,
    testResults: tests.map((test, index) => ({
      id: test.id,
      name: test.name,
      passed: false,
      visible: index < spec.visibleTests.length,
      message: typeCheck.learnerMessage
    })),
    executionError: null,
    outputTruncated: false
  };
}

async function runJavaScriptLike(spec: LessonRunnerSpec, code: string, runMode: CodeRunMode): Promise<RunnerExecution> {
  // TypeScript lessons must fail on type errors, which stripping and running the
  // code can never detect. `stripTypeScript` is still used below, but only to
  // erase annotations before execution: it is no longer the verification step.
  if (spec.language === "typescript") {
    // Fail fast before loading the ~9 MB compiler for a pathologically large
    // submission. The type check itself runs `ts.createProgram` synchronously on
    // the main thread, so the lesson `Promise.race` timeout cannot preempt it;
    // this input cap is the only bound on that work.
    assertTypeScriptSourceWithinLimit(code);
    const typeCheck = await typeCheckTypeScript(code);
    if (typeCheck.diagnostics.length > 0) {
      return typeCheckFailureResult(spec, runMode, typeCheck);
    }
  }

  const runtimeCode = spec.language === "typescript" ? stripTypeScript(code) : code;
  return runJavaScriptInWorker(spec, runtimeCode, runMode);
}

/**
 * Browser execution path. Every supported language runs in a disposable Worker,
 * so a timeout terminates the computation instead of merely abandoning it.
 * Check semantics stay here: the worker returns raw output for one check and
 * this function decides pass/fail and which output may be published.
 */
async function runPreemptible(
  spec: LessonRunnerSpec,
  code: string,
  runMode: CodeRunMode
): Promise<RunnerExecution> {
  const runtime = getSandboxWorkerRuntime(spec.language);
  // Runtime/assets boot is not learner work, so it is not charged to the
  // lesson's execution timeout. A boot failure gets its own honest message.
  await runtime.ensureBooted();

  const deadline = Date.now() + spec.timeoutMs;
  const remaining = (): number => Math.max(1, deadline - Date.now());

  if (spec.language === "typescript") {
    assertTypeScriptSourceWithinLimit(code);
    const typeCheck = await runtime.typecheck(code, defaultFileName("typescript"), remaining());
    if (typeCheck.diagnostics.length > 0) {
      return typeCheckFailureResult(spec, runMode, {
        diagnostics: typeCheck.diagnostics,
        stderr: typeCheck.stderr,
        learnerMessage: typeCheck.learnerMessage
      });
    }
  }

  const runtimeCode = spec.language === "typescript" ? stripTypeScript(code) : code;

  if (runMode === "run_file") {
    const result = await runtime.exec({
      language: spec.language,
      code: runtimeCode,
      mode: "file",
      setupCode: spec.setupCode
    }, remaining());
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      testResults: [],
      executionError: result.executionError,
      outputTruncated: result.outputTruncated
    };
  }

  const stdout: string[] = [];
  const stderr: string[] = [];
  const capper = createOutputCapper();
  const testResults: CodeRunTestResult[] = [];

  for (const [index, test] of [...spec.visibleTests, ...spec.hiddenTests].entries()) {
    const visible = index < spec.visibleTests.length;
    const harnessCode = spec.language === "sql" && test.code && isTrustedSqlHarness(test.code)
      ? test.code
      : undefined;
    const result = await runtime.exec({
      language: spec.language,
      code: runtimeCode,
      testCode: spec.language === "sql" ? undefined : test.code,
      harnessCode,
      setupCode: spec.setupCode,
      mode: "checks"
    }, remaining());

    const output = result.stdout;
    const checkPassed = result.executionError === null && passesOutputCheck(output, test);

    // Hidden checks publish neither their output nor their failure detail.
    if (visible) {
      if (output) capper.append(stdout, output);
      if (result.stderr) capper.append(stderr, result.stderr);
      if (!checkPassed && !result.stderr) {
        capper.appendError(stderr, result.executionError ?? "Output missing");
      }
    }

    if (checkPassed) {
      testResults.push(passResult(test, visible));
    } else {
      testResults.push(failResult(
        test,
        visible,
        result.executionError ? new Error(result.executionError) : new Error("Output missing"),
        spec.language
      ));
    }
  }

  return {
    stdout: stdout.join("\n"),
    stderr: stderr.join("\n"),
    testResults,
    executionError: null,
    outputTruncated: capper.truncated
  };
}

async function getPyodide(): Promise<any> {
  if (pyodideRuntime) {
    return pyodideRuntime;
  }

  if (pyodidePromise) {
    return pyodidePromise;
  }

  pyodidePromise = (async () => {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      if (!window.loadPyodide) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = `${PYODIDE_INDEX_URL}pyodide.js`;
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Unable to load Pyodide runtime."));
          document.head.appendChild(script);
        });
      }

      if (!window.loadPyodide) {
        throw new Error("Pyodide runtime loaded without loadPyodide.");
      }

      pyodideRuntime = await window.loadPyodide({ indexURL: PYODIDE_INDEX_URL });
      return pyodideRuntime;
    }

    const pyodide = await importRuntimeModule("pyodide") as { loadPyodide: () => Promise<unknown> };
    pyodideRuntime = await pyodide.loadPyodide();
    return pyodideRuntime;
  })().catch((error) => {
    // Clear the rejected promise so a transient boot failure can be retried.
    pyodidePromise = null;
    throw error;
  });

  return pyodidePromise;
}

// Only invoked for `run_checks`; `run_file` is routed to `runPythonFile`. Checks
// therefore always use the neutral import-style sentinel, never "__main__".
async function runPython(spec: LessonRunnerSpec, code: string): Promise<RunnerExecution> {
  const pyodide = await getPyodide();
  const testResults: CodeRunTestResult[] = [];
  const stdout: string[] = [];
  const stderr: string[] = [];
  const capper = createOutputCapper();

  pyodide.setStdout({ batched: (text: string) => capper.append(stdout, text) });
  pyodide.setStderr({ batched: (text: string) => capper.append(stderr, text) });

  for (const [index, test] of [...spec.visibleTests, ...spec.hiddenTests].entries()) {
    const visible = index < spec.visibleTests.length;
    const stdoutStart = stdout.length;
    const stderrStart = stderr.length;

    try {
      const wrappedCode = [
        `_proofpath_globals = {'__builtins__': __builtins__, '__name__': ${JSON.stringify(PYTHON_IMPORT_RUN_NAME)}}`,
        `exec(${JSON.stringify(code)}, _proofpath_globals)`,
        `exec(${JSON.stringify(test.code)}, _proofpath_globals)`
      ].join("\n");

      await pyodide.runPythonAsync(wrappedCode);
      const output = stdout.slice(stdoutStart).join("\n");
      if (!passesOutputCheck(output, test)) {
        throw new Error("Output missing");
      }
      testResults.push(passResult(test, visible));
    } catch (error) {
      const message = error instanceof Error ? error.message : normalizeOutput(error);
      // Only a visible check may publish failure text. A hidden check's message
      // can contain harness detail, expected values, or a stderr sentinel.
      if (visible) {
        capper.appendError(stderr, message);
      }
      testResults.push(failResult(test, visible, error, spec.language));
    } finally {
      // Hidden checks must never contribute to learner-visible stdout or stderr.
      // Roll back both buffers unconditionally so a generic "Output missing"
      // failure path cannot preserve an earlier private sentinel.
      if (!visible) {
        stdout.length = stdoutStart;
        stderr.length = stderrStart;
      }
    }
  }

  return {
    stdout: stdout.join("\n"),
    stderr: stderr.join("\n"),
    testResults,
    executionError: null,
    outputTruncated: capper.truncated
  };
}

async function runPythonFile(code: string): Promise<RunnerExecution> {
  const pyodide = await getPyodide();
  const stdout: string[] = [];
  const stderr: string[] = [];
  const capper = createOutputCapper();
  let executionError: string | null = null;

  pyodide.setStdout({ batched: (text: string) => capper.append(stdout, text) });
  pyodide.setStderr({ batched: (text: string) => capper.append(stderr, text) });
  try {
    // Direct execution is the "run the file" scenario: `__name__` is "__main__",
    // so `if __name__ == "__main__":` blocks run, matching `python file.py`.
    pyodide.globals.set("__name__", PYTHON_DIRECT_RUN_NAME);
    await pyodide.runPythonAsync(code);
  } catch (error) {
    executionError = error instanceof Error ? error.message : String(error);
    // Bypass the output budget so a truncated stdout cannot hide the failure.
    capper.appendError(stderr, executionError);
  }

  return {
    stdout: stdout.join("\n"),
    stderr: stderr.join("\n"),
    testResults: [],
    executionError,
    outputTruncated: capper.truncated
  };
}

async function getSqlJs(): Promise<SqlJsModule> {
  if (sqlRuntime) {
    return sqlRuntime;
  }

  if (sqlPromise) {
    return sqlPromise;
  }

  sqlPromise = (async () => {
    if (typeof window !== "undefined" && typeof document !== "undefined") {
      if (!window.initSqlJs) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = sameOriginAssetUrl(`${SQLJS_DIST_URL}sql-wasm.js`);
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Unable to load sql.js runtime."));
          document.head.appendChild(script);
        });
      }

      if (!window.initSqlJs) {
        throw new Error("sql.js runtime loaded without initSqlJs.");
      }

      sqlRuntime = await window.initSqlJs({
        locateFile: (file) => sameOriginAssetUrl(`${SQLJS_DIST_URL}${file}`)
      });
      return sqlRuntime;
    }

    const initSqlJs = ((await importRuntimeModule("sql.js")) as {
      default: (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsModule>;
    }).default;
    sqlRuntime = await initSqlJs({
      locateFile: (file) => sameOriginAssetUrl(`${SQLJS_DIST_URL}${file}`)
    });
    return sqlRuntime;
  })().catch((error) => {
    // Clear the rejected promise so a transient boot failure can be retried.
    sqlPromise = null;
    throw error;
  });

  return sqlPromise;
}

function formatSqlResult(result: Array<{ values: unknown[][] }>, maxChars = MAX_OUTPUT_CHARS): string {
  const lines: string[] = [];
  let total = 0;
  for (const table of result) {
    for (const row of table.values) {
      const line = row.join(" | ");
      if (total + line.length + 1 > maxChars) {
        lines.push("[output truncated: exceeded 512KB limit]");
        return lines.join("\n");
      }
      lines.push(line);
      total += line.length + 1;
    }
  }
  return lines.join("\n");
}

async function runSql(spec: LessonRunnerSpec, code: string): Promise<RunnerExecution> {
  const SQL = await getSqlJs();
  const testResults: CodeRunTestResult[] = [];
  const stdout: string[] = [];
  const stderr: string[] = [];
  const capper = createOutputCapper();

  for (const [index, test] of [...spec.visibleTests, ...spec.hiddenTests].entries()) {
    const visible = index < spec.visibleTests.length;
    const stdoutStart = stdout.length;
    const stderrStart = stderr.length;
    // Each check gets a fresh database seeded by setupCode so learner scripts
    // cannot leak state (for example a CREATE TABLE) into later checks.
    const db = new SQL.Database();

    try {
      if (spec.setupCode) {
        db.run(spec.setupCode);
      }

      // A check's `code` is trusted harness SQL (like setupCode): it runs against
      // the freshly seeded database before the learner query and is not subject
      // to the read-only policy that gates learner submissions. Hidden checks use
      // this to seed rows so a hardcoded/forged result cannot match. The harness
      // is restricted to seed-safe statements (isTrustedSqlHarness), so a
      // multi-statement payload cannot smuggle in a destructive statement.
      if (test.code && isTrustedSqlHarness(test.code)) {
        db.run(test.code);
      }

      const result = db.exec(code);
      const output = formatSqlResult(result);
      // Hidden checks must never contribute to learner-visible stdout: their
      // output reveals the anti-forgery seed inserted by the harness. Evaluate
      // the hidden expectation from `output`, but only publish visible output.
      if (visible) {
        capper.append(stdout, output);
      }

      if (!passesOutputCheck(output, test)) {
        throw new Error("Output missing");
      }
      testResults.push(passResult(test, visible, output || "Query ran"));
    } catch (error) {
      const message = error instanceof Error ? error.message : normalizeOutput(error);
      // Only a visible check may publish failure text; a hidden harness error can
      // name seeded rows or expected values.
      if (visible) {
        capper.appendError(stderr, message);
      }
      testResults.push(failResult(test, visible, error, spec.language));
    } finally {
      if (!visible) {
        stdout.length = stdoutStart;
        stderr.length = stderrStart;
      }
      db.close();
    }
  }

  return {
    stdout: stdout.filter(Boolean).join("\n"),
    stderr: stderr.join("\n"),
    testResults,
    executionError: null,
    outputTruncated: capper.truncated
  };
}

async function runSqlFile(spec: LessonRunnerSpec, code: string): Promise<RunnerExecution> {
  const SQL = await getSqlJs();
  const db = new SQL.Database();
  const stdout: string[] = [];
  const stderr: string[] = [];
  const capper = createOutputCapper();
  let executionError: string | null = null;

  try {
    try {
      if (spec.setupCode) {
        db.run(spec.setupCode);
      }

      const result = db.exec(code);
      capper.append(stdout, formatSqlResult(result));
    } catch (error) {
      executionError = error instanceof Error ? error.message : String(error);
      capper.appendError(stderr, executionError);
    }
  } finally {
    db.close();
  }

  return {
    stdout: stdout.join("\n"),
    stderr: stderr.join("\n"),
    testResults: [],
    executionError,
    outputTruncated: capper.truncated
  };
}

export async function runLessonSandbox(
  spec: LessonRunnerSpec,
  lessonId: string,
  code: string,
  now = new Date().toISOString(),
  runMode: CodeRunMode = "run_checks"
): Promise<CodeRunAttempt> {
  const startedAt = Date.now();
  const policyViolations = validateSandboxSubmission(spec, code);
  const command = codeRunCommand(spec.language, runMode);

  if (policyViolations.length > 0) {
    const stderr = policyViolations.map((violation) => formatPolicyViolationFeedback(violation, spec.language)).join("\n\n");
    const diagnostics = buildProblemDiagnostics({ language: spec.language, policyViolations });
    const runtimeMs = Date.now() - startedAt;
    return normalizeCodeRunAttempt({
      id: `code-run-${lessonId}-${now.replace(/[^0-9]/g, "")}`,
      lessonId,
      language: spec.language,
      runMode,
      sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION,
      command,
      codeSnapshot: code,
      stdout: "",
      stderr,
      passed: false,
      score: 0,
      runtimeMs,
      testResults: policyViolations.map((violation) => ({
        id: `policy-${violation.rule}`,
        name: "Sandbox policy",
        passed: false,
        visible: true,
        message: formatPolicyViolationFeedback(violation, spec.language)
      })),
      hiddenCheckSummary: emptyHiddenCheckSummary(),
      diagnostics,
      terminalTranscript: buildTerminalTranscript({
        command,
        diagnostics,
        hiddenCheckSummary: emptyHiddenCheckSummary(),
        language: spec.language,
        passed: false,
        runMode,
        runtimeMs,
        stderr,
        stdout: "",
        testResults: []
      }),
      createdAt: now
    });
  }

  const runner = async (): Promise<RunnerExecution> => {
    if (canUsePreemptibleSandbox()) {
      return runPreemptible(spec, code, runMode);
    }

    if (runMode === "run_file") {
      if (spec.language === "python") {
        return runPythonFile(code);
      }

      if (spec.language === "sql") {
        return runSqlFile(spec, code);
      }

      return runJavaScriptLike(spec, code, runMode);
    }

    if (spec.language === "python") {
      return runPython(spec, code);
    }

    if (spec.language === "sql") {
      return runSql(spec, code);
    }

    return runJavaScriptLike(spec, code, runMode);
  };

  try {
    const result = await Promise.race([runner(), timeoutAfter(spec.timeoutMs)]);
    const rawTestResults = runMode === "run_checks" ? result.testResults : [];
    const passedTests = rawTestResults.filter((testResult) => testResult.passed).length;
    const score = rawTestResults.length === 0 ? 0 : Math.round((passedTests / rawTestResults.length) * 100);
    const { visibleCheckResults, hiddenCheckSummary } = redactCheckResults(rawTestResults);
    const diagnostics = buildProblemDiagnostics({
      language: spec.language,
      stderr: result.stderr,
      checkMessages: visibleCheckResults.filter((testResult) => !testResult.passed).map((testResult) => testResult.message)
    });
    // Execution success is explicit and independent of retained output. A run
    // that exceeds the output cap and then throws still sets executionError, so
    // truncation can never turn a failure into a pass.
    const passed = runMode === "run_file"
      ? result.executionError === null && diagnostics.every((diagnostic) => diagnostic.severity !== "error")
      : rawTestResults.length > 0 && rawTestResults.every((testResult) => testResult.passed);
    const runtimeMs = Date.now() - startedAt;
    return normalizeCodeRunAttempt({
      id: `code-run-${lessonId}-${now.replace(/[^0-9]/g, "")}`,
      lessonId,
      language: spec.language,
      runMode,
      sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION,
      command,
      codeSnapshot: code,
      stdout: result.stdout,
      stderr: result.stderr,
      passed,
      score,
      runtimeMs,
      testResults: visibleCheckResults,
      hiddenCheckSummary,
      diagnostics,
      terminalTranscript: buildTerminalTranscript({
        command,
        diagnostics,
        hiddenCheckSummary,
        language: spec.language,
        passed,
        runMode,
        runtimeMs,
        stderr: result.stderr,
        stdout: result.stdout,
        testResults: visibleCheckResults
      }),
      createdAt: now
    });
  } catch (error) {
    const rawError = error instanceof Error ? error.message : normalizeOutput(error);
    const errorKind = classifySandboxError(error);
    const terminated = error instanceof SandboxTerminatedError;
    const startupFailure = error instanceof SandboxStartupError;
    const sourceTooLarge = /too large to run/i.test(rawError);
    const message = terminated
      ? formatSandboxTimeoutFeedback(spec.language, spec.timeoutMs, true)
      : startupFailure || sourceTooLarge
        ? rawError
        : formatSandboxFailureFeedback({
          kind: errorKind,
          language: spec.language,
          detail: rawError
        });
    const stderrContent = runMode === "run_file" ? rawError : message;
    const runtimeMs = Date.now() - startedAt;
    const diagnostics = buildProblemDiagnostics({
      language: spec.language,
      errorMessage: rawError,
      stderr: stderrContent,
      timedOut: terminated
    });
    const testResults = runMode === "run_checks" ? [
      {
        id: "runner-error",
        name: "Runner error",
        passed: false,
        visible: true,
        message
      }
    ] : [];
    return normalizeCodeRunAttempt({
      id: `code-run-${lessonId}-${now.replace(/[^0-9]/g, "")}`,
      lessonId,
      language: spec.language,
      runMode,
      sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION,
      command,
      codeSnapshot: code,
      stdout: "",
      stderr: stderrContent,
      passed: false,
      score: 0,
      runtimeMs,
      testResults,
      hiddenCheckSummary: emptyHiddenCheckSummary(),
      diagnostics,
      terminalTranscript: buildTerminalTranscript({
        command,
        diagnostics,
        hiddenCheckSummary: emptyHiddenCheckSummary(),
        language: spec.language,
        passed: false,
        runMode,
        runtimeMs,
        stderr: stderrContent,
        stdout: "",
        testResults
      }),
      createdAt: now
    });
  }
}

export function preloadSandbox(language: string): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  if (canUsePreemptibleSandbox() && (language === "python" || language === "sql" || language === "typescript")) {
    void getSandboxWorkerRuntime(language).ensureBooted().catch((err) => {
      console.warn("Failed to preload the sandbox worker:", err);
    });
    return;
  }
  if (language === "python") {
    void getPyodide().catch((err) => {
      console.warn("Failed to preload Pyodide sandbox:", err);
    });
  } else if (language === "sql") {
    void getSqlJs().catch((err) => {
      console.warn("Failed to preload sql.js sandbox:", err);
    });
  } else if (language === "typescript") {
    // Warm the compiler asset before the timed check so the first type check
    // on a low-end device does not race the lesson's 4s timeout.
    void getTypeScript().catch((err) => {
      console.warn("Failed to preload TypeScript sandbox:", err);
    });
  }
}

export function getSandboxCapabilityLabel(language: string): {
  label: string;
  note: string;
} {
  const isHermes = typeof globalThis !== "undefined" && (globalThis as any).HermesInternal !== undefined;
  const isReactNative = typeof navigator !== "undefined" && navigator.product === "ReactNative";
  
  if (language === "javascript") {
    return {
      label: "JavaScript: V8 sandbox",
      note: "Full ES2023 support."
    };
  }

  if (language === "typescript") {
    return {
      label: "TypeScript: typecheck + V8 sandbox",
      note: "Types are checked by the bundled TypeScript compiler before the file runs, then stripped for execution. One file, ES2015 lib, strict off."
    };
  }

  if (language === "python") {
    if (isHermes || isReactNative) {
      return {
        label: "Python: QuickJS fallback",
        note: "Limited sandbox — standard library imports are not available."
      };
    }
    return {
      label: "Python: Pyodide WASM",
      note: "Sandboxed Python in the browser."
    };
  }

  if (language === "sql") {
    return {
      label: "SQL: SQLite WASM",
      note: "In-memory database."
    };
  }

  return {
    label: "Sandboxed environment",
    note: "Safe local code execution."
  };
}
