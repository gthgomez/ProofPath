import { TYPESCRIPT_TYPE_CHECK_SOURCE } from "@/sandbox/typescript-typecheck";
import type { RunnerLanguage } from "@/domain/types";

/**
 * Preemptible execution boundary for the web sandbox.
 *
 * Before this module, Pyodide and sql.js ran synchronously in the page realm.
 * `Promise.race` could stop waiting, but it could not stop the computation, so
 * a non-terminating script froze the UI and a late result could still resolve.
 * Each language runtime now owns a dedicated Worker: `terminate()` genuinely
 * stops it, the page stays responsive, and a terminated run can never deliver a
 * late passing result because its pending request is rejected first.
 *
 * The worker returns raw execution output for one check at a time. Pass/fail
 * evaluation stays in `runner.ts`, which keeps one owner for check semantics
 * and hidden-output redaction.
 */

export const SANDBOX_BOOT_TIMEOUT_MS = 45_000;

export class SandboxTerminatedError extends Error {
  readonly language: RunnerLanguage;
  readonly timeoutMs: number;

  constructor(language: RunnerLanguage, timeoutMs: number) {
    super(`Sandbox ${language} execution was terminated after ${timeoutMs}ms.`);
    this.name = "SandboxTerminatedError";
    this.language = language;
    this.timeoutMs = timeoutMs;
  }
}

export class SandboxStartupError extends Error {
  constructor(language: RunnerLanguage, detail: string) {
    super(`The ${language} sandbox could not start. ${detail}`);
    this.name = "SandboxStartupError";
  }
}

export class SandboxCanceledError extends Error {
  constructor(language: RunnerLanguage) {
    super(`Sandbox ${language} execution was canceled before it completed.`);
    this.name = "SandboxCanceledError";
  }
}

export interface WorkerExecutionResult {
  stdout: string;
  stderr: string;
  executionError: string | null;
  outputTruncated: boolean;
}

export interface WorkerTypeCheckResult {
  diagnostics: Array<{ line: number; column: number; code: number; message: string }>;
  stderr: string;
  learnerMessage: string;
}

interface ExecRequest {
  language: RunnerLanguage;
  code: string;
  testCode?: string;
  harnessCode?: string;
  setupCode?: string;
  mode: "checks" | "file";
}

/**
 * Worker source. Kept as a string because it must run in a Blob Worker created
 * from the page; it deliberately shares `TYPESCRIPT_TYPE_CHECK_SOURCE` with the
 * in-process runner so diagnostics cannot drift.
 */
export function createExecutionWorkerSource(): string {
  return String.raw`
"use strict";

var MAX_OUTPUT_CHARS = 524288;
var MAX_ERROR_SUMMARY_CHARS = 2000;
var OUTPUT_TRUNCATION_MARKER = "[output truncated: exceeded 512KB limit]";

var pyodide = null;
var sqlModule = null;
var tsCompiler = null;
var tsLibs = null;
var buffers = null;

function normalizeOutput(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

function resetBuffers() {
  buffers = { stdout: [], stderr: [], total: 0, truncated: false };
}

function appendOutput(target, text) {
  if (!buffers || buffers.truncated) return;
  var normalized = normalizeOutput(text);
  var added = normalized.length + 1;
  var remaining = MAX_OUTPUT_CHARS - buffers.total;
  if (added >= remaining) {
    var sliceLen = Math.max(0, remaining - OUTPUT_TRUNCATION_MARKER.length - 1);
    var prefix = sliceLen > 0 ? normalized.slice(0, sliceLen) + "\n" : "";
    target.push(prefix + OUTPUT_TRUNCATION_MARKER);
    buffers.truncated = true;
    buffers.total = MAX_OUTPUT_CHARS;
    return;
  }
  target.push(normalized);
  buffers.total += added;
}

function appendError(target, text) {
  var normalized = normalizeOutput(text) || "Unknown error";
  target.push(
    normalized.length > MAX_ERROR_SUMMARY_CHARS
      ? normalized.slice(0, MAX_ERROR_SUMMARY_CHARS) + "\n[error summary truncated]"
      : normalized
  );
}

function assetUrl(base, path) {
  return (base || "") + path;
}

async function ensureBooted(language, assetBase) {
  if (language === "python") {
    if (pyodide) return;
    if (typeof importScripts !== "function") {
      throw new Error("This browser worker cannot load the Python runtime.");
    }
    importScripts(assetUrl(assetBase, "/sandbox-assets/pyodide/pyodide.js"));
    var loadPyodide = self.loadPyodide || (self.window && self.window.loadPyodide);
    if (!loadPyodide) throw new Error("Pyodide loaded without loadPyodide.");
    pyodide = await loadPyodide({ indexURL: assetUrl(assetBase, "/sandbox-assets/pyodide/") });
    pyodide.setStdout({ batched: function (text) { appendOutput(buffers.stdout, text); } });
    pyodide.setStderr({ batched: function (text) { appendOutput(buffers.stderr, text); } });
    return;
  }

  if (language === "sql") {
    if (sqlModule) return;
    if (typeof importScripts !== "function") {
      throw new Error("This browser worker cannot load the SQL runtime.");
    }
    importScripts(assetUrl(assetBase, "/sandbox-assets/sql.js/sql-wasm.js"));
    var initSqlJs = self.initSqlJs || (self.window && self.window.initSqlJs);
    if (!initSqlJs) throw new Error("sql.js loaded without initSqlJs.");
    sqlModule = await initSqlJs({
      locateFile: function (file) { return assetUrl(assetBase, "/sandbox-assets/sql.js/" + file); }
    });
    return;
  }

  if (language === "typescript") {
    if (tsCompiler) return;
    if (typeof importScripts !== "function") {
      throw new Error("This browser worker cannot load the TypeScript compiler.");
    }
    self.window = self.window || self;
    importScripts(assetUrl(assetBase, "/sandbox-assets/typescript/typescript.js"));
    importScripts(assetUrl(assetBase, "/sandbox-assets/typescript/typescript-libs.js"));
    tsCompiler = self.ts || (self.window && self.window.ts);
    tsLibs = self.PROOFPATH_TYPESCRIPT_LIBS || (self.window && self.window.PROOFPATH_TYPESCRIPT_LIBS);
    if (!tsCompiler) throw new Error("TypeScript loaded without a compiler.");
    if (!tsLibs) throw new Error("TypeScript loaded without its library files.");
  }
}

function execPython(request) {
  var runtimeName = request.mode === "file" ? "__main__" : "<module>";
  var wrapped = [
    "_proofpath_globals = {'__builtins__': __builtins__, '__name__': " + JSON.stringify(runtimeName) + "}",
    "exec(" + JSON.stringify(request.code) + ", _proofpath_globals)"
  ];
  if (request.mode === "checks" && request.testCode) {
    wrapped.push("exec(" + JSON.stringify(request.testCode) + ", _proofpath_globals)");
  }
  return pyodide.runPythonAsync(wrapped.join("\n"));
}

function execSql(request) {
  var db = new sqlModule.Database();
  try {
    if (request.setupCode) db.run(request.setupCode);
    if (request.mode === "checks" && request.harnessCode) db.run(request.harnessCode);
    var result = db.exec(request.code);
    var output = "";
    for (var t = 0; t < result.length; t += 1) {
      var table = result[t];
      for (var r = 0; r < table.values.length; r += 1) {
        var line = table.values[r].join(" | ");
        if (output.length + line.length + 1 > MAX_OUTPUT_CHARS) {
          output += (output ? "\n" : "") + OUTPUT_TRUNCATION_MARKER;
          buffers.truncated = true;
          break;
        }
        output += (output ? "\n" : "") + line;
      }
      if (buffers.truncated) break;
    }
    if (output) buffers.stdout.push(output);
  } finally {
    db.close();
  }
}

function execJavaScript(request) {
  var post = typeof self.postMessage === "function" ? self.postMessage.bind(self) : function () {};
  try { delete self.postMessage; } catch (_) {}
  self.postMessage = function () {};
  var sandboxConsole = {
    log: function () {
      var values = [];
      for (var i = 0; i < arguments.length; i += 1) values.push(normalizeOutput(arguments[i]));
      appendOutput(buffers.stdout, values.join(" "));
    },
    error: function () {
      var values = [];
      for (var i = 0; i < arguments.length; i += 1) values.push(normalizeOutput(arguments[i]));
      appendOutput(buffers.stderr, values.join(" "));
    }
  };
  try {
    var source = '"use strict";\n' + request.code + (request.testCode ? "\n" + request.testCode : "");
    var runner = new Function(
      "console", "postMessage", "self", "window", "globalThis",
      "importScripts", "fetch", "XMLHttpRequest", "WebSocket", "indexedDB", "caches",
      source
    );
    runner(
      sandboxConsole, undefined, undefined, undefined, undefined,
      undefined, undefined, undefined, undefined, undefined, undefined
    );
  } finally {
    self.postMessage = post;
  }
}

async function handleExec(request) {
  resetBuffers();
  var executionError = null;
  try {
    if (request.language === "python") {
      await execPython(request);
    } else if (request.language === "sql") {
      execSql(request);
    } else {
      execJavaScript(request);
    }
  } catch (error) {
    executionError = error instanceof Error ? error.message : String(error || "Execution failed");
    if (request.mode === "file") appendError(buffers.stderr, executionError);
  }

  return {
    stdout: buffers.stdout.join("\n"),
    stderr: buffers.stderr.join("\n"),
    executionError: executionError,
    outputTruncated: buffers.truncated
  };
}

async function handleTypecheck(request) {
  await ensureBooted("typescript", request.assetBase);
  return proofPathTypeCheck(tsCompiler, tsLibs, request.fileName, request.code);
}

self.onmessage = async function (event) {
  var message = event.data || {};
  var token = message.token;
  function post(payload) {
    payload.token = token;
    self.postMessage(payload);
  }
  try {
    if (message.type === "boot") {
      await ensureBooted(message.language, message.assetBase);
      post({ type: "ready" });
      return;
    }
    if (message.type === "exec") {
      var result = await handleExec(message.request);
      post({ type: "exec-result", result: result });
      return;
    }
    if (message.type === "typecheck") {
      var typeCheck = await handleTypecheck(message);
      post({ type: "typecheck-result", result: typeCheck });
      return;
    }
    post({ type: "error", error: "Unknown sandbox worker request." });
  } catch (error) {
    post({ type: "error", error: error instanceof Error ? error.message : String(error) });
  }
};

${TYPESCRIPT_TYPE_CHECK_SOURCE}
`;
}

interface PendingRequest {
  token: string;
  timer: ReturnType<typeof setTimeout>;
  resolve: (message: Record<string, unknown>) => void;
  reject: (error: Error) => void;
}

/**
 * One Worker, one request lane.
 *
 * Concurrency contract:
 * - Boot is deduplicated; every caller awaits the same startup promise.
 * - Execution and typecheck requests are queued and run one at a time.
 * - A request is associated with a token; duplicate and late messages are
 *   ignored.
 * - A timeout or worker error rejects exactly the active request, disposes the
 *   Worker, and lets the next queued request start from a clean boot.
 * - Public shutdown rejects any in-flight request instead of abandoning it.
 */
export class SandboxWorkerRuntime {
  private worker: Worker | null = null;
  private objectUrl: string | null = null;
  private booted = false;
  private bootPromise: Promise<void> | null = null;
  private pending: PendingRequest | null = null;
  private lane: Promise<unknown> = Promise.resolve();
  private tokenCounter = 0;
  private readonly language: RunnerLanguage;

  constructor(language: RunnerLanguage, private readonly assetBase: string) {
    this.language = language;
  }

  async ensureBooted(): Promise<void> {
    if (this.booted) {
      return;
    }
    if (this.bootPromise) {
      return this.bootPromise;
    }

    const boot = this.bootOnce();
    this.bootPromise = boot;
    try {
      await boot;
    } finally {
      if (this.bootPromise === boot) {
        this.bootPromise = null;
      }
    }
  }

  async exec(request: ExecRequest, timeoutMs: number): Promise<WorkerExecutionResult> {
    return this.runInLane(async () => {
      await this.ensureBooted();
      const message = await this.request({ type: "exec", request }, timeoutMs);
      return normalizeExecutionResult(message.result);
    });
  }

  async typecheck(code: string, fileName: string, timeoutMs: number): Promise<WorkerTypeCheckResult> {
    return this.runInLane(async () => {
      await this.ensureBooted();
      const message = await this.request({ type: "typecheck", code, fileName }, timeoutMs);
      return normalizeTypeCheckResult(message.result);
    });
  }

  /** Reject any active request, then stop and release the Worker. */
  terminate(reason: Error = new SandboxCanceledError(this.language)): void {
    const pending = this.pending;
    this.pending = null;
    if (pending) {
      clearTimeout(pending.timer);
      pending.reject(reason);
    }
    this.disposeWorker();
  }

  private async bootOnce(): Promise<void> {
    try {
      await this.request({ type: "boot", language: this.language, assetBase: this.assetBase }, SANDBOX_BOOT_TIMEOUT_MS);
      this.booted = true;
    } catch (error) {
      this.disposeWorker();
      if (error instanceof SandboxTerminatedError) {
        throw new SandboxStartupError(this.language, "The runtime did not finish starting in time.");
      }
      if (error instanceof SandboxCanceledError) {
        throw error;
      }
      throw new SandboxStartupError(
        this.language,
        error instanceof Error ? error.message : "Unknown startup failure."
      );
    }
  }

  private runInLane<T>(task: () => Promise<T>): Promise<T> {
    const run = this.lane.then(task, task);
    this.lane = run.then(() => undefined, () => undefined);
    return run;
  }

  private request(payload: Record<string, unknown>, timeoutMs: number): Promise<Record<string, unknown>> {
    if (!this.worker) {
      this.createWorker();
    }
    if (this.pending) {
      return Promise.reject(new Error("Sandbox runtime already has an active request."));
    }

    const worker = this.worker as Worker;
    const token = `pp-${this.language}-${Date.now()}-${this.tokenCounter += 1}`;

    return new Promise<Record<string, unknown>>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.fail(new SandboxTerminatedError(this.language, timeoutMs));
      }, Math.max(1, timeoutMs));

      this.pending = { token, timer, resolve, reject };
      try {
        worker.postMessage({ ...payload, token });
      } catch (error) {
        this.fail(error instanceof Error ? error : new Error("Sandbox worker could not accept the request."));
      }
    });
  }

  private createWorker(): void {
    if (typeof Worker === "undefined" || typeof Blob === "undefined" || typeof URL === "undefined") {
      throw new SandboxStartupError(this.language, "Web Workers are unavailable in this environment.");
    }
    const objectUrl = URL.createObjectURL(new Blob([createExecutionWorkerSource()], { type: "text/javascript" }));
    const worker = new Worker(objectUrl);
    worker.onmessage = (event: MessageEvent<Record<string, unknown>>) => this.handleMessage(event.data);
    worker.onerror = (event) => {
      this.fail(new Error(event.message || "Sandbox worker failed."));
    };
    this.worker = worker;
    this.objectUrl = objectUrl;
  }

  private handleMessage(message: Record<string, unknown>): void {
    const pending = this.pending;
    if (!pending || message.token !== pending.token) {
      return;
    }
    this.pending = null;
    clearTimeout(pending.timer);

    if (message.type === "error") {
      pending.reject(new Error(typeof message.error === "string" ? message.error : "Sandbox worker failed."));
      return;
    }
    pending.resolve(message);
  }

  private fail(error: Error): void {
    const pending = this.pending;
    this.pending = null;
    if (pending) {
      clearTimeout(pending.timer);
    }
    this.disposeWorker();
    if (pending) {
      pending.reject(error);
    }
  }

  private disposeWorker(): void {
    const worker = this.worker;
    this.worker = null;
    if (worker) {
      worker.onmessage = null;
      worker.onerror = null;
      worker.terminate();
    }
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
    this.booted = false;
  }
}

function normalizeExecutionResult(raw: unknown): WorkerExecutionResult {
  if (!raw || typeof raw !== "object") {
    return { stdout: "", stderr: "", executionError: "The sandbox returned no result.", outputTruncated: false };
  }
  const value = raw as Partial<WorkerExecutionResult>;
  return {
    stdout: typeof value.stdout === "string" ? value.stdout : "",
    stderr: typeof value.stderr === "string" ? value.stderr : "",
    executionError: typeof value.executionError === "string" ? value.executionError : null,
    outputTruncated: value.outputTruncated === true
  };
}

function normalizeTypeCheckResult(raw: unknown): WorkerTypeCheckResult {
  if (!raw || typeof raw !== "object") {
    return { diagnostics: [], stderr: "", learnerMessage: "" };
  }
  const value = raw as Partial<WorkerTypeCheckResult>;
  const diagnostics = Array.isArray(value.diagnostics)
    ? value.diagnostics.filter((diagnostic): diagnostic is WorkerTypeCheckResult["diagnostics"][number] => Boolean(
      diagnostic
      && typeof diagnostic === "object"
      && typeof (diagnostic as { line?: unknown }).line === "number"
      && typeof (diagnostic as { column?: unknown }).column === "number"
      && typeof (diagnostic as { code?: unknown }).code === "number"
      && typeof (diagnostic as { message?: unknown }).message === "string"
    ))
    : [];
  return {
    diagnostics,
    stderr: typeof value.stderr === "string" ? value.stderr : "",
    learnerMessage: typeof value.learnerMessage === "string" ? value.learnerMessage : ""
  };
}

const runtimes = new Map<RunnerLanguage, SandboxWorkerRuntime>();

function assetBaseUrl(): string {
  return typeof window !== "undefined" && window.location?.origin
    ? window.location.origin
    : "";
}

/**
 * True only in a real browser. Node-based tests inject
 * `__proofpathImportRuntimeModuleForTests` and must keep the in-process runner,
 * where Pyodide and sql.js can be imported directly.
 */
export function canUsePreemptibleSandbox(): boolean {
  return typeof window !== "undefined"
    && typeof document !== "undefined"
    && typeof Worker !== "undefined"
    && typeof Blob !== "undefined"
    && typeof URL !== "undefined"
    && typeof globalThis.__proofpathImportRuntimeModuleForTests === "undefined";
}

export function getSandboxWorkerRuntime(language: RunnerLanguage): SandboxWorkerRuntime {
  const existing = runtimes.get(language);
  if (existing) {
    return existing;
  }
  const runtime = new SandboxWorkerRuntime(language, assetBaseUrl());
  runtimes.set(language, runtime);
  return runtime;
}

/** Drop a runtime after a timeout so the next run starts from a clean worker. */
export function terminateSandboxWorker(language: RunnerLanguage): void {
  const runtime = runtimes.get(language);
  if (!runtime) {
    return;
  }
  runtime.terminate();
  runtimes.delete(language);
}

export function terminateAllSandboxWorkers(): void {
  for (const runtime of runtimes.values()) {
    runtime.terminate();
  }
  runtimes.clear();
}
