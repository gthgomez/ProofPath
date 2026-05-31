import { describe, expect, it } from "vitest";
import { normalizeCodeRunAttempt } from "@/domain/code-run";
import type { CodeRunAttempt } from "@/domain/types";
import {
  createNativeWebViewRunnerHtml,
  NATIVE_ANDROID_SANDBOX_BASE_URL,
  parseNativeWebViewRunnerMessage,
  parseNativeWebViewRunnerResult,
  SANDBOX_ASSET_PATHS
} from "@/sandbox/native-webview-runner";

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
