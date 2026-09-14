import { describe, expect, it } from "vitest";
import { normalizeCodeRunAttempt, redactCheckResults } from "@/domain/code-run";
import type { CodeRunAttempt } from "@/domain/types";
import {
  createNativeWebViewRunnerHtml,
  NATIVE_ANDROID_SANDBOX_BASE_URL,
  nativeWebViewTrustedSqlHarness,
  parseNativeWebViewRunnerMessage,
  parseNativeWebViewRunnerResult,
  SANDBOX_ASSET_PATHS
} from "@/sandbox/native-webview-runner";
import {
  PYTHON_DIRECT_RUN_NAME,
  PYTHON_IMPORT_RUN_NAME,
  SQL_HARNESS_DANGEROUS_PATTERN,
  SQL_HARNESS_PATTERN,
  isTrustedSqlHarness
} from "@/sandbox/runner";

describe("native WebView sandbox runner bridge", () => {
  it("exposes the bridge entrypoint and ready handshake in the generated HTML", () => {
    const html = createNativeWebViewRunnerHtml();

    expect(html).toContain("window.CareerForgeSandbox");
    expect(html).toContain("sandbox-ready");
    expect(html).toContain(SANDBOX_ASSET_PATHS.pyodide);
    expect(html).toContain(SANDBOX_ASSET_PATHS.sqlJs);
    expect(html).toContain("loadPyodide");
    expect(html).toContain("initSqlJs");
    expect(NATIVE_ANDROID_SANDBOX_BASE_URL).toBe("file:///android_asset/");
  });

  it("embeds the shared Python run-mode sentinels used by the web runner", () => {
    const html = createNativeWebViewRunnerHtml();

    // Blocker 3: the native runner must match the web runner's __name__ fidelity
    // so `if __name__ == "__main__":` guard lessons behave the same off-device.
    expect(html).toContain(`const PYTHON_DIRECT_RUN_NAME = ${JSON.stringify(PYTHON_DIRECT_RUN_NAME)};`);
    expect(html).toContain(`const PYTHON_IMPORT_RUN_NAME = ${JSON.stringify(PYTHON_IMPORT_RUN_NAME)};`);
    expect(PYTHON_DIRECT_RUN_NAME).toBe("__main__");
    expect(PYTHON_IMPORT_RUN_NAME).not.toBe(PYTHON_DIRECT_RUN_NAME);
    // run_file selects the direct sentinel; every other/unknown mode defaults to
    // the import sentinel so Code Lab checks stay import-style.
    expect(html).toContain('request.runMode === "run_file" ? PYTHON_DIRECT_RUN_NAME : PYTHON_IMPORT_RUN_NAME');
    expect(html).toContain('pyodide.globals.set("__name__", moduleName);');
    expect(html).toContain("__name__");

    // Ordering, not just presence: the sentinel is selected before it is bound to
    // Pyodide's globals, and both happen before the per-check loop. Reversing any
    // of these would still satisfy the substring assertions above but would bind
    // the wrong __name__ while checks run.
    const runPythonStart = html.indexOf("async function runPython(request) {");
    const nameChoice = html.indexOf('request.runMode === "run_file" ? PYTHON_DIRECT_RUN_NAME : PYTHON_IMPORT_RUN_NAME');
    const nameBinding = html.indexOf('pyodide.globals.set("__name__", moduleName);');
    const pythonCheckLoop = html.indexOf("for (let index = 0; index < tests.length; index += 1) {", runPythonStart);
    expect(runPythonStart).toBeGreaterThanOrEqual(0);
    expect(nameChoice).toBeGreaterThan(runPythonStart);
    expect(nameBinding).toBeGreaterThan(nameChoice);
    expect(pythonCheckLoop).toBeGreaterThan(nameBinding);
  });

  it("creates a fresh SQL database per check and gates the trusted harness with the shared gate", () => {
    const html = createNativeWebViewRunnerHtml();

    // The embedded regexes must be built from the very same source strings the
    // web runner exports, so the two cannot drift on which harness statements run.
    expect(html).toContain(`new RegExp(${JSON.stringify(SQL_HARNESS_PATTERN.source)}, "i")`);
    expect(html).toContain(`new RegExp(${JSON.stringify(SQL_HARNESS_DANGEROUS_PATTERN.source)}, "i")`);
    expect(html).toContain("isTrustedSqlHarness(test.code)");
    // One fresh database per check plus one for the direct file run, each closed.
    expect(html).toContain("const fileDb = new SQL.Database();");
    expect(html).toContain("const db = new SQL.Database();");
    expect(html).toContain("fileDb.close();");
    expect(html).toContain("db.close();");

    // Ordering, not just presence: the per-check database must be created inside
    // the check loop and the run_file database before it. Hoisting the check
    // database out of the loop (or reusing fileDb) would still satisfy the plain
    // substring assertions above.
    const runSqlStart = html.indexOf("async function runSql(request) {");
    const fileDbIndex = html.indexOf("const fileDb = new SQL.Database();", runSqlStart);
    const checkLoopIndex = html.indexOf("for (let index = 0; index < tests.length; index += 1) {", runSqlStart);
    const checkDbIndex = html.indexOf("const db = new SQL.Database();", runSqlStart);
    expect(runSqlStart).toBeGreaterThanOrEqual(0);
    expect(fileDbIndex).toBeGreaterThan(runSqlStart);
    expect(checkLoopIndex).toBeGreaterThan(fileDbIndex);
    expect(checkDbIndex).toBeGreaterThan(checkLoopIndex);

    // Harness executes before the learner query, and hidden output is not published.
    const harnessIndex = html.indexOf("db.run(test.code);", checkLoopIndex);
    const queryIndex = html.indexOf("db.exec(request.code);", checkLoopIndex);
    expect(harnessIndex).toBeGreaterThan(checkLoopIndex);
    expect(queryIndex).toBeGreaterThan(harnessIndex);
    expect(html).toContain("if (visible) {");
    expect(html).toContain("stdout.length = stdoutStart;");
  });

  it("shares the trusted-harness predicate with the web runner", () => {
    // Seed-safe harness statements are allowed; mutations are rejected. This is
    // the exact predicate embedded in the generated script.
    expect(nativeWebViewTrustedSqlHarness("INSERT INTO sessions (topic) VALUES ('sql');")).toBe(true);
    expect(nativeWebViewTrustedSqlHarness("CREATE TABLE seed (topic TEXT);")).toBe(true);
    expect(nativeWebViewTrustedSqlHarness("DROP TABLE sessions;")).toBe(false);
    expect(nativeWebViewTrustedSqlHarness("EXPECT_ROWS:no evidence")).toBe(false);
    expect(SQL_HARNESS_PATTERN.test("WITH seed AS (SELECT 1 AS n) SELECT n FROM seed;")).toBe(true);

    // The prefix pattern alone accepts a destructive statement chained after a
    // seed; the combined predicate must reject it.
    const chained = "INSERT INTO sessions (topic) VALUES ('sql'); DROP TABLE sessions;";
    expect(SQL_HARNESS_PATTERN.test(chained)).toBe(true);
    expect(nativeWebViewTrustedSqlHarness(chained)).toBe(false);
  });

  it("embeds a trusted-harness gate that behaves exactly like the web runner", () => {
    const html = createNativeWebViewRunnerHtml();
    const startMarker = "/* trusted-sql-harness-gate:start */";
    const endMarker = "/* trusted-sql-harness-gate:end */";
    const start = html.indexOf(startMarker);
    const end = html.indexOf(endMarker);
    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);

    // Evaluate the exact gate source embedded in the WebView so drift between
    // the mirrored script and the shared web predicate fails the test instead of
    // silently changing which harness SQL runs on device.
    const gateSource = html.slice(start + startMarker.length, end);
    const nativeGate = new Function(
      "SQL_HARNESS_PATTERN",
      "SQL_HARNESS_DANGEROUS_PATTERN",
      `${gateSource}\nreturn isTrustedSqlHarness;`
    )(SQL_HARNESS_PATTERN, SQL_HARNESS_DANGEROUS_PATTERN) as (code: string) => boolean;

    const cases = [
      "INSERT INTO sessions (date, topic, minutes) VALUES ('2026-06-04', 'sql', 45);",
      "-- seed\nINSERT INTO sessions (topic) VALUES ('sql');",
      "CREATE TABLE seed (topic TEXT);",
      "WITH seed AS (SELECT 1 AS n) SELECT n FROM seed;",
      "INSERT INTO notes (body) VALUES ('call; delete later');",
      "INSERT INTO sessions (topic) VALUES ('sql'); DROP TABLE sessions;",
      "SELECT 1; DELETE FROM sessions;",
      "WITH seed AS (SELECT 1 AS n) DELETE FROM sessions;",
      "CREATE TABLE tmp (id INTEGER); PRAGMA writable_schema = 1;",
      "UPDATE sessions SET minutes = 0;",
      "DROP TABLE sessions;",
      "EXPECT_ROWS:no evidence",
      "-- visible check runs no harness SQL"
    ];

    for (const code of cases) {
      expect(nativeGate(code), `native gate disagreed on: ${code}`).toBe(isTrustedSqlHarness(code));
    }
  });

  it("derives run_file pass from error output, matching the web runner", () => {
    const html = createNativeWebViewRunnerHtml();

    // The web runner only passes a run_file attempt when no error diagnostic was
    // produced. The native script has no diagnostic parser, so it uses the signal
    // it does have (a raised exception lands in stderr) instead of hardcoding true.
    expect(html).toContain('? stderr.join("\\n").trim().length === 0');
    expect(html).not.toContain('request.runMode === "run_file" ? true');
  });

  it("generates a syntactically valid embedded runner script", () => {
    const html = createNativeWebViewRunnerHtml();
    const script = /<script>([\s\S]*)<\/script>/.exec(html)?.[1];

    expect(script).toBeTruthy();
    // Parsing (not executing) the embedded script catches template-literal
    // escaping regressions that a plain substring assertion would miss.
    expect(() => new Function(script as string)).not.toThrow();
  });

  it("parses ready and result messages from the native WebView", () => {
    const ready = parseNativeWebViewRunnerMessage(
      JSON.stringify({
        type: "sandbox-ready",
        assets: SANDBOX_ASSET_PATHS
      })
    );
    const attempt: CodeRunAttempt = normalizeCodeRunAttempt({
      id: "code-run-lesson-20260507203000000",
      lessonId: "lesson",
      language: "javascript",
      codeSnapshot: "console.log('ok')",
      stdout: "ok",
      stderr: "",
      passed: true,
      score: 100,
      runtimeMs: 4,
      testResults: [{ id: "visible", name: "Visible", passed: true, visible: true, message: "Passed" }],
      createdAt: "2026-05-07T20:30:00.000Z"
    });
    const resultPayload = JSON.stringify({ type: "sandbox-result", attempt });

    expect(ready?.type).toBe("sandbox-ready");
    expect(parseNativeWebViewRunnerMessage(resultPayload)).toEqual({ type: "sandbox-result", attempt });
    expect(parseNativeWebViewRunnerResult(resultPayload)).toEqual(attempt);
  });

  it("redacts raw hidden check data when parsing native WebView results", () => {
    const rawAttempt: CodeRunAttempt = {
      id: "code-run-hidden",
      lessonId: "lesson",
      language: "javascript",
      runMode: "run_checks",
      command: "careerforge checks lesson.js",
      codeSnapshot: "console.log('ok')",
      stdout: "ok",
      stderr: "",
      passed: false,
      score: 50,
      runtimeMs: 5,
      testResults: [
        { id: "visible", name: "Visible", passed: true, visible: true, message: "Passed" },
        { id: "hidden", name: "SECRET hidden name", passed: false, visible: false, message: "SECRET hidden message" }
      ],
      hiddenCheckSummary: { total: 0, passed: 0, failed: 0 },
      diagnostics: [],
      terminalTranscript: [],
      createdAt: "2026-05-07T20:31:00.000Z"
    };
    const parsed = parseNativeWebViewRunnerResult(JSON.stringify({ type: "sandbox-result", attempt: rawAttempt }));

    // `normalizeCodeRunAttempt` always zeroes the hidden summary on the parsed
    // attempt, so assert the meaningful source-derived summary directly rather
    // than only the zeroed result. The learner-facing attempt must additionally
    // carry no hidden output, names, or messages.
    expect(redactCheckResults(rawAttempt.testResults).hiddenCheckSummary).toEqual({ total: 1, passed: 0, failed: 1 });
    expect(parsed?.hiddenCheckSummary).toEqual({ total: 0, passed: 0, failed: 0 });
    expect(parsed?.testResults).toHaveLength(1);
    expect(parsed?.testResults[0]?.id).toBe("visible");
    expect(JSON.stringify(parsed)).not.toContain("SECRET");
    expect(JSON.stringify(parsed)).not.toContain("Hidden checks");
    expect(parsed?.testResults.some((result) => !result.visible)).toBe(false);
  });

  it("ignores malformed or unknown messages", () => {
    expect(parseNativeWebViewRunnerMessage("{")).toBeNull();
    expect(parseNativeWebViewRunnerResult(JSON.stringify({ type: "sandbox-ready", assets: SANDBOX_ASSET_PATHS }))).toBeNull();
  });
});
