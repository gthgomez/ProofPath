import { normalizeCodeRunAttempt, redactCheckResults } from "@/domain/code-run";
import type { CodeRunAttempt, CodeRunMode, LessonRunnerSpec } from "@/domain/types";

export interface NativeWebViewRunnerRequest {
  lessonId: string;
  spec: LessonRunnerSpec;
  code: string;
  now: string;
  runMode: CodeRunMode;
}

export const SANDBOX_ASSET_PATHS = {
  pyodide: "file:///android_asset/sandbox-assets/pyodide/",
  sqlJs: "file:///android_asset/sandbox-assets/sql.js/"
} as const;

export const NATIVE_ANDROID_SANDBOX_BASE_URL = "file:///android_asset/";

export interface NativeWebViewRunnerReadyMessage {
  type: "sandbox-ready";
  assets: typeof SANDBOX_ASSET_PATHS;
}

export interface NativeWebViewRunnerResultMessage {
  type: "sandbox-result";
  attempt: CodeRunAttempt;
}

export type NativeWebViewRunnerMessage = NativeWebViewRunnerReadyMessage | NativeWebViewRunnerResultMessage;

export function createNativeWebViewRunnerHtml(): string {
  return `<!doctype html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CareerForge Sandbox Runner</title>
</head>
<body>
  <script>
    window.CAREERFORGE_SANDBOX_ASSETS = ${JSON.stringify(SANDBOX_ASSET_PATHS)};
    function post(payload) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(payload));
    }

    function normalizeOutput(value) {
      if (value === undefined || value === null) return "";
      if (typeof value === "string") return value;
      return JSON.stringify(value);
    }

    function stripTypeScript(code) {
      return code
        .replace(/type\\s+\\w+\\s*=\\s*\\{[\\s\\S]*?\\};/g, "")
        .replace(/interface\\s+\\w+\\s*\\{[\\s\\S]*?\\}/g, "")
        .replace(/:\\s*[A-Za-z_$][A-Za-z0-9_$<>,\\s[\\]|]*(?=\\s*[=,);])/g, "");
    }

    function includesAll(output, needles) {
      const normalizedOutput = output.toLowerCase();
      return (needles || []).every((needle) => normalizedOutput.includes(String(needle).toLowerCase()));
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
      const label = language === "typescript"
        ? "TypeScript"
        : language === "javascript"
          ? "JavaScript"
          : language === "python"
            ? "Python"
            : "SQL";

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

    function formatRunnerFailureMessage(error, language) {
      return [
        "The sandbox runner could not finish this attempt.",
        "Is the starter code using the lesson language and the visible test shape shown on screen?",
        "Runner note: " + (error instanceof Error ? error.message : String(error || "No extra detail was reported."))
      ].join("\\n");
    }

    function buildAttempt(request, startedAt, stdout, stderr, testResults) {
      const passedTests = testResults.filter((result) => result.passed).length;
      const score = testResults.length === 0 ? 0 : Math.round((passedTests / testResults.length) * 100);
      const passed = request.runMode === "run_file" ? true : testResults.length > 0 && testResults.every((result) => result.passed);
      const redacted = redactCheckResults(testResults);
      const learnerSafeHiddenSummary = { total: 0, passed: 0, failed: 0 };

      return {
        id: "code-run-" + request.lessonId + "-" + request.now.replace(/[^0-9]/g, ""),
        lessonId: request.lessonId,
        language: request.spec.language,
        runMode: request.runMode || "run_checks",
        codeSnapshot: request.code,
        stdout: stdout.join("\\n"),
        stderr: stderr.join("\\n"),
        passed,
        score,
        runtimeMs: Date.now() - startedAt,
        testResults: redacted.visibleCheckResults,
        hiddenCheckSummary: learnerSafeHiddenSummary,
        createdAt: request.now
      };
    }

    function redactCheckResults(testResults) {
      const visibleCheckResults = testResults
        .filter((result) => result.visible)
        .map((result) => ({ ...result, visible: true }));
      const hiddenResults = testResults.filter((result) => !result.visible);

      return {
        visibleCheckResults,
        hiddenCheckSummary: {
          total: hiddenResults.length,
          passed: hiddenResults.filter((result) => result.passed).length,
          failed: hiddenResults.filter((result) => !result.passed).length
        }
      };
    }

    function runJavaScriptLike(request) {
      const startedAt = Date.now();
      const spec = request.spec;
      const runtimeCode = spec.language === "typescript" ? stripTypeScript(request.code) : request.code;
      const stdout = [];
      const stderr = [];
      const testResults = [];
      const tests = spec.visibleTests.concat(spec.hiddenTests || []);
      const sandboxConsole = {
        log: (...values) => stdout.push(values.map(normalizeOutput).join(" ")),
        error: (...values) => stderr.push(values.map(normalizeOutput).join(" "))
      };

      if (request.runMode === "run_file") {
        const runner = new Function("console", "\\"use strict\\";\\n" + runtimeCode);
        runner(sandboxConsole);
        return buildAttempt(request, startedAt, stdout, stderr, testResults);
      }

      for (let index = 0; index < tests.length; index += 1) {
        const test = tests[index];
        const visible = index < spec.visibleTests.length;
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
            message: formatSandboxFailureMessage(error, spec.language)
          });
        }
      }

      return buildAttempt(request, startedAt, stdout, stderr, testResults);
    }

    function loadScript(src) {
      return new Promise((resolve, reject) => {
        const existing = document.querySelector('script[data-careerforge-src="' + src + '"]');
        if (existing) {
          resolve();
          return;
        }

        const script = document.createElement("script");
        script.async = true;
        script.dataset.careerforgeSrc = src;
        script.src = src;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Unable to load bundled sandbox asset: " + src));
        document.head.appendChild(script);
      });
    }

    let pyodideRuntime = null;
    async function getPyodideRuntime() {
      if (pyodideRuntime) return pyodideRuntime;

      if (!window.loadPyodide) {
        await loadScript(window.CAREERFORGE_SANDBOX_ASSETS.pyodide + "pyodide.js");
      }

      if (!window.loadPyodide) {
        throw new Error("Pyodide asset loaded without loadPyodide.");
      }

      pyodideRuntime = await window.loadPyodide({
        indexURL: window.CAREERFORGE_SANDBOX_ASSETS.pyodide
      });
      return pyodideRuntime;
    }

    async function runPython(request) {
      const startedAt = Date.now();
      const spec = request.spec;
      const pyodide = await getPyodideRuntime();
      const stdout = [];
      const stderr = [];
      const testResults = [];
      const tests = spec.visibleTests.concat(spec.hiddenTests || []);

      pyodide.setStdout({ batched: (text) => stdout.push(text) });
      pyodide.setStderr({ batched: (text) => stderr.push(text) });

      if (request.runMode === "run_file") {
        await pyodide.runPythonAsync(request.code);
        return buildAttempt(request, startedAt, stdout, stderr, testResults);
      }

      for (let index = 0; index < tests.length; index += 1) {
        const test = tests[index];
        const visible = index < spec.visibleTests.length;
        const stdoutStart = stdout.length;

        try {
          const wrappedCode = [
            "_careerforge_globals = {'__builtins__': __builtins__}",
            "exec(" + JSON.stringify(request.code) + ", _careerforge_globals)",
            "exec(" + JSON.stringify(test.code) + ", _careerforge_globals)"
          ].join("\\n");

          await pyodide.runPythonAsync(wrappedCode);
          const output = stdout.slice(stdoutStart).join("\\n");
          if (!includesAll(output, test.expectedOutputIncludes)) {
            throw new Error("Output missing");
          }
          testResults.push({ id: test.id, name: test.name, passed: true, visible, message: "Passed" });
        } catch (error) {
          stderr.push(error instanceof Error ? error.message : String(error || "Test failed"));
          testResults.push({
            id: test.id,
            name: test.name,
            passed: false,
            visible,
            message: formatSandboxFailureMessage(error, spec.language)
          });
        }
      }

      return buildAttempt(request, startedAt, stdout, stderr, testResults);
    }

    let sqlRuntime = null;
    async function getSqlRuntime() {
      if (sqlRuntime) return sqlRuntime;

      if (!window.initSqlJs) {
        await loadScript(window.CAREERFORGE_SANDBOX_ASSETS.sqlJs + "sql-wasm.js");
      }

      if (!window.initSqlJs) {
        throw new Error("sql.js asset loaded without initSqlJs.");
      }

      sqlRuntime = await window.initSqlJs({
        locateFile: (file) => window.CAREERFORGE_SANDBOX_ASSETS.sqlJs + file
      });
      return sqlRuntime;
    }

    async function runSql(request) {
      const startedAt = Date.now();
      const spec = request.spec;
      const SQL = await getSqlRuntime();
      const db = new SQL.Database();
      const stdout = [];
      const stderr = [];
      const testResults = [];
      const tests = spec.visibleTests.concat(spec.hiddenTests || []);

      if (spec.setupCode) {
        db.run(spec.setupCode);
      }

      if (request.runMode === "run_file") {
        const result = db.exec(request.code);
        const output = result.flatMap((table) => table.values.map((row) => row.join(" | "))).join("\\n");
        stdout.push(output);
        return buildAttempt(request, startedAt, stdout.filter(Boolean), stderr, testResults);
      }

      for (let index = 0; index < tests.length; index += 1) {
        const test = tests[index];
        const visible = index < spec.visibleTests.length;

        try {
          const result = db.exec(request.code);
          const output = result.flatMap((table) => table.values.map((row) => row.join(" | "))).join("\\n");
          stdout.push(output);

          if (!includesAll(output, test.expectedOutputIncludes)) {
            throw new Error("Output missing");
          }
          testResults.push({ id: test.id, name: test.name, passed: true, visible, message: output || "Query ran" });
        } catch (error) {
          stderr.push(error instanceof Error ? error.message : String(error || "Test failed"));
          testResults.push({
            id: test.id,
            name: test.name,
            passed: false,
            visible,
            message: formatSandboxFailureMessage(error, spec.language)
          });
        }
      }

      return buildAttempt(request, startedAt, stdout.filter(Boolean), stderr, testResults);
    }

    function runnerErrorAttempt(request, error) {
      const guidance = formatRunnerFailureMessage(error, request.spec.language);
      return {
        id: "code-run-" + request.lessonId + "-" + request.now.replace(/[^0-9]/g, ""),
        lessonId: request.lessonId,
        language: request.spec.language,
        runMode: request.runMode || "run_checks",
        codeSnapshot: request.code,
        stdout: "",
        stderr: guidance,
        passed: false,
        score: 0,
        runtimeMs: 0,
        testResults: [{ id: "native-webview-runner-error", name: "Native WebView runner", passed: false, visible: true, message: guidance }],
        createdAt: request.now
      };
    }

    async function handleRun(request) {
      let attempt;
      try {
        if (request.spec.language === "python") {
          attempt = await runPython(request);
        } else if (request.spec.language === "sql") {
          attempt = await runSql(request);
        } else {
          attempt = runJavaScriptLike(request);
        }
      } catch (error) {
        attempt = runnerErrorAttempt(request, error);
      }

      post({ type: "sandbox-result", attempt });
    }

    function handleMessage(event) {
      const payload = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      if (payload && payload.type === "run") {
        handleRun(payload.request);
      }
    }

    window.CareerForgeSandbox = {
      run: function(payload) {
        handleMessage({ data: payload });
      }
    };

    window.addEventListener("message", handleMessage);
    document.addEventListener("message", handleMessage);

    post({
      type: "sandbox-ready",
      assets: window.CAREERFORGE_SANDBOX_ASSETS
    });
  </script>
</body>
</html>`;
}

export function parseNativeWebViewRunnerMessage(payload: string): NativeWebViewRunnerMessage | null {
  try {
    const parsed = JSON.parse(payload) as {
      type?: string;
      assets?: typeof SANDBOX_ASSET_PATHS;
      attempt?: CodeRunAttempt;
    };

    if (parsed.type === "sandbox-ready" && parsed.assets) {
      return { type: "sandbox-ready", assets: parsed.assets };
    }

    if (parsed.type === "sandbox-result" && parsed.attempt) {
      const redacted = redactCheckResults(parsed.attempt.testResults ?? []);
      return {
        type: "sandbox-result",
        attempt: normalizeCodeRunAttempt({
          ...parsed.attempt,
          testResults: redacted.visibleCheckResults,
          hiddenCheckSummary: redacted.hiddenCheckSummary
        })
      };
    }

    return null;
  } catch {
    return null;
  }
}

export function parseNativeWebViewRunnerResult(payload: string): CodeRunAttempt | null {
  const parsed = parseNativeWebViewRunnerMessage(payload);
  return parsed?.type === "sandbox-result" ? parsed.attempt : null;
}
