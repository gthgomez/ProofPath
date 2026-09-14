import { describe, expect, it } from "vitest";
import { normalizeCodeRunAttempt } from "@/domain/code-run";
import type { CodeRunAttempt } from "@/domain/types";
import {
  createNativeWebViewRunnerHtml,
  NATIVE_ANDROID_SANDBOX_BASE_URL,
  nativeWebViewTrustedSqlHarness,
  parseNativeWebViewRunnerMessage,
  parseNativeWebViewRunnerResult,
  SANDBOX_ASSET_PATHS
} from "@/sandbox/native-webview-runner";
import { PYTHON_DIRECT_RUN_NAME, PYTHON_IMPORT_RUN_NAME, SQL_HARNESS_PATTERN } from "@/sandbox/runner";

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
  });

  it("creates a fresh SQL database per check and gates the trusted harness with the shared pattern", () => {
    const html = createNativeWebViewRunnerHtml();

    // The embedded regex must be built from the very same source string the web
    // runner exports, so the two cannot drift on which harness statements run.
    expect(html).toContain(`new RegExp(${JSON.stringify(SQL_HARNESS_PATTERN.source)}, "i")`);
    expect(html).toContain("SQL_HARNESS_PATTERN.test(test.code)");
    // One fresh database per check plus one for the direct file run, each closed.
    expect(html).toContain("const fileDb = new SQL.Database();");
    expect(html).toContain("const db = new SQL.Database();");
    expect(html).toContain("fileDb.close();");
    expect(html).toContain("db.close();");
    // Harness executes before the learner query, and hidden output is not published.
    expect(html).toContain("db.run(test.code);");
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

    expect(parsed?.hiddenCheckSummary).toEqual({ total: 0, passed: 0, failed: 0 });
    expect(JSON.stringify(parsed)).not.toContain("SECRET");
    expect(JSON.stringify(parsed)).not.toContain("Hidden checks");
  });

  it("ignores malformed or unknown messages", () => {
    expect(parseNativeWebViewRunnerMessage("{")).toBeNull();
    expect(parseNativeWebViewRunnerResult(JSON.stringify({ type: "sandbox-ready", assets: SANDBOX_ASSET_PATHS }))).toBeNull();
  });
});
