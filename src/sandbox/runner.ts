import {
  buildTerminalTranscript,
  codeRunCommand,
  emptyHiddenCheckSummary,
  normalizeCodeRunAttempt,
  redactCheckResults
} from "@/domain/code-run";
import type { CodeRunAttempt, CodeRunMode, CodeRunTestResult, LessonRunnerSpec, LessonRunnerTest } from "@/domain/types";
import { buildProblemDiagnostics } from "@/sandbox/diagnostics";
import {
  classifySandboxError,
  formatPolicyViolationFeedback,
  formatSandboxFailureFeedback
} from "@/sandbox/feedback";
import { validateSandboxSubmission } from "@/sandbox/policy";

interface CapturedConsole {
  stdout: string[];
  stderr: string[];
}

type SqlJsModule = {
  Database: new () => {
    run: (sql: string) => void;
    exec: (sql: string) => Array<{ columns: string[]; values: unknown[][] }>;
  };
};

let pyodideRuntime: unknown | null = null;
let sqlRuntime: SqlJsModule | null = null;
let pyodidePromise: Promise<any> | null = null;
let sqlPromise: Promise<SqlJsModule> | null = null;
const PYODIDE_INDEX_URL = "/sandbox-assets/pyodide/";
const SQLJS_DIST_URL = "/sandbox-assets/sql.js/";

declare global {
  // Test environments that run code inside a VM may not allow dynamic import from new Function.
  // Production bundles should leave this unset and use the bundler-safe import path below.
  var __careerforgeImportRuntimeModuleForTests: ((specifier: string) => Promise<unknown>) | undefined;

  interface Window {
    loadPyodide?: (options?: { indexURL?: string }) => Promise<unknown>;
    initSqlJs?: (config?: { locateFile?: (file: string) => string }) => Promise<SqlJsModule>;
  }
}

async function importRuntimeModule(specifier: string): Promise<unknown> {
  if (globalThis.__careerforgeImportRuntimeModuleForTests) {
    return globalThis.__careerforgeImportRuntimeModuleForTests(specifier);
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
  return {
    id: test.id,
    name: test.name,
    passed: false,
    visible,
    message: formatSandboxFailureFeedback({
      kind: classifySandboxError(error),
      language,
      detail: error instanceof Error ? error.message : normalizeOutput(error) || "Test failed"
    })
  };
}

function timeoutAfter(timeoutMs: number): Promise<never> {
  return new Promise((_resolve, reject) => {
    setTimeout(() => reject(new Error(`Sandbox timed out after ${timeoutMs}ms.`)), timeoutMs);
  });
}

function stripTypeScript(code: string): string {
  return code
    .replace(/type\s+\w+\s*=\s*\{[\s\S]*?\};/g, "")
    .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, "")
    .replace(/:\s*[A-Za-z_$][A-Za-z0-9_$<>,\s[\]|]*(?=\s*[=,);])/g, "");
}

function createJavaScriptWorkerSource(): string {
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

self.onmessage = (event) => {
  const { language, runMode, runtimeCode, tests, visibleCount } = event.data;
  const stdout = [];
  const stderr = [];
  const testResults = [];
  const sandboxConsole = {
    log: (...values) => stdout.push(values.map(normalizeOutput).join(" ")),
    error: (...values) => stderr.push(values.map(normalizeOutput).join(" "))
  };

  if (runMode === "run_file") {
    try {
      const runner = new Function("console", "\\"use strict\\";\\n" + runtimeCode);
      runner(sandboxConsole);
      self.postMessage({
        stdout: stdout.join("\\n"),
        stderr: stderr.join("\\n"),
        testResults
      });
    } catch (error) {
      self.postMessage({
        stdout: stdout.join("\\n"),
        stderr: formatSandboxFailureMessage(error, language),
        testResults
      });
    }
    return;
  }

  for (let index = 0; index < tests.length; index += 1) {
    const test = tests[index];
    const visible = index < visibleCount;
    const stdoutStart = stdout.length;

    try {
      const runner = new Function("console", "\\"use strict\\";\\n" + runtimeCode + "\\n" + test.code);
      runner(sandboxConsole);
      const output = stdout.slice(stdoutStart).join("\\n");
      if (!includesAll(output, test.expectedOutputIncludes)) {
        throw new Error("Output missing");
      }
      testResults.push({ id: test.id, name: test.name, passed: true, visible, message: "Passed" });
    } catch (error) {
      testResults.push({
        id: test.id,
        name: test.name,
        passed: false,
        visible,
        message: formatSandboxFailureMessage(error, language)
      });
    }
  }

  self.postMessage({
    stdout: stdout.join("\\n"),
    stderr: stderr.join("\\n"),
    testResults
  });
};
`;
}

async function runJavaScriptInWorker(spec: LessonRunnerSpec, runtimeCode: string, runMode: CodeRunMode): Promise<Pick<CodeRunAttempt, "stdout" | "stderr" | "testResults">> {
  if (typeof Worker === "undefined" || typeof Blob === "undefined" || typeof URL === "undefined") {
    return runJavaScriptInProcess(spec, runtimeCode, runMode);
  }

  return new Promise((resolve, reject) => {
    const workerUrl = URL.createObjectURL(new Blob([createJavaScriptWorkerSource()], { type: "text/javascript" }));
    const worker = new Worker(workerUrl);
    const timeoutId = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(new Error(`Sandbox worker timed out after ${spec.timeoutMs}ms.`));
    }, spec.timeoutMs);

    worker.onmessage = (event: MessageEvent<Pick<CodeRunAttempt, "stdout" | "stderr" | "testResults">>) => {
      clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve(event.data);
    };

    worker.onerror = (event) => {
      clearTimeout(timeoutId);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      reject(new Error(event.message || "Sandbox worker failed."));
    };

    worker.postMessage({
      language: spec.language,
      runMode,
      runtimeCode,
      tests: [...spec.visibleTests, ...spec.hiddenTests],
      visibleCount: spec.visibleTests.length
    });
  });
}

async function runJavaScriptInProcess(spec: LessonRunnerSpec, runtimeCode: string, runMode: CodeRunMode): Promise<Pick<CodeRunAttempt, "stdout" | "stderr" | "testResults">> {
  const captured: CapturedConsole = { stdout: [], stderr: [] };
  const testResults: CodeRunTestResult[] = [];
  const sandboxConsole = {
    log: (...values: unknown[]) => captured.stdout.push(values.map(normalizeOutput).join(" ")),
    error: (...values: unknown[]) => captured.stderr.push(values.map(normalizeOutput).join(" "))
  };

  if (runMode === "run_file") {
    const runner = new Function("console", `"use strict";\n${runtimeCode}`);
    runner(sandboxConsole);
    return {
      stdout: captured.stdout.join("\n"),
      stderr: captured.stderr.join("\n"),
      testResults
    };
  }

  for (const [index, test] of [...spec.visibleTests, ...spec.hiddenTests].entries()) {
    const visible = index < spec.visibleTests.length;
    const stdoutStart = captured.stdout.length;

    try {
      const runner = new Function("console", `"use strict";\n${runtimeCode}\n${test.code}`);
      runner(sandboxConsole);
      const output = captured.stdout.slice(stdoutStart).join("\n");
      if (!includesAll(output, test.expectedOutputIncludes)) {
        throw new Error("Output missing");
      }
      testResults.push(passResult(test, visible));
    } catch (error) {
      testResults.push(failResult(test, visible, error, spec.language));
    }
  }

  return {
    stdout: captured.stdout.join("\n"),
    stderr: captured.stderr.join("\n"),
    testResults
  };
}

async function runJavaScriptLike(spec: LessonRunnerSpec, code: string, runMode: CodeRunMode): Promise<Pick<CodeRunAttempt, "stdout" | "stderr" | "testResults">> {
  const runtimeCode = spec.language === "typescript" ? stripTypeScript(code) : code;
  return runJavaScriptInWorker(spec, runtimeCode, runMode);
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
  })();

  return pyodidePromise;
}

async function runPython(spec: LessonRunnerSpec, code: string): Promise<Pick<CodeRunAttempt, "stdout" | "stderr" | "testResults">> {
  const pyodide = await getPyodide();
  const testResults: CodeRunTestResult[] = [];
  const stdout: string[] = [];
  const stderr: string[] = [];

  pyodide.setStdout({ batched: (text: string) => stdout.push(text) });
  pyodide.setStderr({ batched: (text: string) => stderr.push(text) });

  for (const [index, test] of [...spec.visibleTests, ...spec.hiddenTests].entries()) {
    const visible = index < spec.visibleTests.length;

    try {
      const stdoutStart = stdout.length;
      const wrappedCode = [
        "_careerforge_globals = {'__builtins__': __builtins__}",
        `exec(${JSON.stringify(code)}, _careerforge_globals)`,
        `exec(${JSON.stringify(test.code)}, _careerforge_globals)`
      ].join("\n");

      await pyodide.runPythonAsync(wrappedCode);
      const output = stdout.slice(stdoutStart).join("\n");
      if (!includesAll(output, test.expectedOutputIncludes)) {
        throw new Error("Output missing");
      }
      testResults.push(passResult(test, visible));
    } catch (error) {
      stderr.push(error instanceof Error ? error.message : normalizeOutput(error));
      testResults.push(failResult(test, visible, error, spec.language));
    }
  }

  return {
    stdout: stdout.join("\n"),
    stderr: stderr.join("\n"),
    testResults
  };
}

async function runPythonFile(code: string): Promise<Pick<CodeRunAttempt, "stdout" | "stderr" | "testResults">> {
  const pyodide = await getPyodide();
  const stdout: string[] = [];
  const stderr: string[] = [];

  pyodide.setStdout({ batched: (text: string) => stdout.push(text) });
  pyodide.setStderr({ batched: (text: string) => stderr.push(text) });
  await pyodide.runPythonAsync(code);

  return {
    stdout: stdout.join("\n"),
    stderr: stderr.join("\n"),
    testResults: []
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
  })();

  return sqlPromise;
}

async function runSql(spec: LessonRunnerSpec, code: string): Promise<Pick<CodeRunAttempt, "stdout" | "stderr" | "testResults">> {
  const SQL = await getSqlJs();
  const db = new SQL.Database();
  const testResults: CodeRunTestResult[] = [];
  const stdout: string[] = [];
  const stderr: string[] = [];

  if (spec.setupCode) {
    db.run(spec.setupCode);
  }

  for (const [index, test] of [...spec.visibleTests, ...spec.hiddenTests].entries()) {
    const visible = index < spec.visibleTests.length;

    try {
      const result = db.exec(code);
      const output = result.flatMap((table) => table.values.map((row) => row.join(" | "))).join("\n");
      stdout.push(output);

      if (!includesAll(output, test.expectedOutputIncludes)) {
        throw new Error("Output missing");
      }
      testResults.push(passResult(test, visible, output || "Query ran"));
    } catch (error) {
      stderr.push(error instanceof Error ? error.message : normalizeOutput(error));
      testResults.push(failResult(test, visible, error, spec.language));
    }
  }

  return {
    stdout: stdout.filter(Boolean).join("\n"),
    stderr: stderr.join("\n"),
    testResults
  };
}

async function runSqlFile(spec: LessonRunnerSpec, code: string): Promise<Pick<CodeRunAttempt, "stdout" | "stderr" | "testResults">> {
  const SQL = await getSqlJs();
  const db = new SQL.Database();

  if (spec.setupCode) {
    db.run(spec.setupCode);
  }

  const result = db.exec(code);
  return {
    stdout: result.flatMap((table) => table.values.map((row) => row.join(" | "))).join("\n"),
    stderr: "",
    testResults: []
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

  const runner = async (): Promise<Pick<CodeRunAttempt, "stdout" | "stderr" | "testResults">> => {
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
    const passed = runMode === "run_file"
      ? true
      : rawTestResults.length > 0 && rawTestResults.every((testResult) => testResult.passed);
    const { visibleCheckResults, hiddenCheckSummary } = redactCheckResults(rawTestResults);
    const diagnostics = buildProblemDiagnostics({
      language: spec.language,
      stderr: result.stderr,
      checkMessages: visibleCheckResults.filter((testResult) => !testResult.passed).map((testResult) => testResult.message)
    });
    const runtimeMs = Date.now() - startedAt;
    return normalizeCodeRunAttempt({
      id: `code-run-${lessonId}-${now.replace(/[^0-9]/g, "")}`,
      lessonId,
      language: spec.language,
      runMode,
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
    const message = formatSandboxFailureFeedback({
      kind: classifySandboxError(error),
      language: spec.language,
      detail: error instanceof Error ? error.message : normalizeOutput(error)
    });
    const runtimeMs = Date.now() - startedAt;
    const diagnostics = buildProblemDiagnostics({
      language: spec.language,
      errorMessage: error instanceof Error ? error.message : normalizeOutput(error),
      stderr: message,
      timedOut: classifySandboxError(error) === "timeout"
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
      command,
      codeSnapshot: code,
      stdout: "",
      stderr: message,
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
        stderr: message,
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
  if (language === "python") {
    void getPyodide().catch((err) => {
      console.warn("Failed to preload Pyodide sandbox:", err);
    });
  } else if (language === "sql") {
    void getSqlJs().catch((err) => {
      console.warn("Failed to preload sql.js sandbox:", err);
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
      label: "TypeScript: V8 sandbox",
      note: "Types stripped at runtime."
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
