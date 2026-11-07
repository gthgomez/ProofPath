import { describe, expect, it } from "vitest";
import type { CodeRunAttempt, LessonRunnerSpec } from "@/domain/types";
import {
  validateNativeWebViewResult,
  type NativeWebViewRunnerRequest
} from "@/sandbox/native-webview-runner";

const NOW = "2026-11-07T12:00:00.000Z";

const SPEC: LessonRunnerSpec = {
  language: "python",
  instructions: "Print ok.",
  starterCode: "print('ok')",
  visibleTests: [{ id: "visible", name: "Prints ok", code: "", expectedOutputIncludes: ["ok"] }],
  hiddenTests: [],
  expectedOutput: ["ok"],
  timeoutMs: 1000,
  allowNetwork: false
};

function request(overrides: Partial<NativeWebViewRunnerRequest> = {}): NativeWebViewRunnerRequest {
  return {
    requestId: "req-active-1",
    lessonId: "lesson-a",
    spec: SPEC,
    code: "print('ok')",
    now: NOW,
    runMode: "run_checks",
    ...overrides
  };
}

function attempt(overrides: Partial<CodeRunAttempt> = {}): CodeRunAttempt {
  return {
    id: "code-run-lesson-a-20261107120000000",
    lessonId: "lesson-a",
    language: "python",
    runMode: "run_checks",
    command: "proofpath checks study_session.py",
    codeSnapshot: "print('ok')",
    stdout: "ok",
    stderr: "",
    passed: true,
    score: 100,
    runtimeMs: 5,
    testResults: [{ id: "visible", name: "Prints ok", passed: true, visible: true, message: "Passed" }],
    hiddenCheckSummary: { total: 0, passed: 0, failed: 0 },
    diagnostics: [],
    terminalTranscript: [],
    createdAt: NOW,
    ...overrides
  };
}

describe("native result integrity binding", () => {
  it("accepts a result that matches the active request", () => {
    expect(validateNativeWebViewResult(attempt(), request(), "req-active-1")).toEqual({ ok: true });
  });

  it("rejects a result from a different request (late/duplicate/stale)", () => {
    expect(validateNativeWebViewResult(attempt(), request(), "req-previous")).toEqual({
      ok: false,
      reason: "request-id-mismatch"
    });
    expect(validateNativeWebViewResult(attempt(), request(), undefined)).toEqual({
      ok: false,
      reason: "request-id-mismatch"
    });
  });

  it("rejects cross-lesson, cross-language, and cross-mode results", () => {
    expect(validateNativeWebViewResult(attempt({ lessonId: "lesson-b" }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "lesson-id-mismatch"
    });
    expect(validateNativeWebViewResult(attempt({ language: "sql" }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "language-mismatch"
    });
    expect(validateNativeWebViewResult(attempt({ runMode: "run_file" }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "run-mode-mismatch"
    });
  });

  it("rejects a result for different code than the request sent", () => {
    expect(validateNativeWebViewResult(attempt({ codeSnapshot: "print('different')" }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "code-snapshot-mismatch"
    });
  });

  it("rejects impossible runtime and timestamp fields", () => {
    expect(validateNativeWebViewResult(attempt({ runtimeMs: -1 }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "invalid-runtime"
    });
    expect(validateNativeWebViewResult(attempt({ runtimeMs: Number.NaN }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "invalid-runtime"
    });
    expect(validateNativeWebViewResult(attempt({ createdAt: "not-a-date" }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "invalid-timestamp"
    });
  });

  it("rejects an empty or contradictory graded pass", () => {
    expect(validateNativeWebViewResult(attempt({ testResults: [] }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "empty-results"
    });
    expect(validateNativeWebViewResult(attempt({
      testResults: [{ id: "visible", name: "Prints ok", passed: false, visible: true, message: "Missing output" }]
    }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "contradictory-visible-failure"
    });
    expect(validateNativeWebViewResult(attempt({ score: 50 }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "contradictory-score"
    });
  });

  it("rejects duplicate result identities", () => {
    expect(validateNativeWebViewResult(attempt({
      testResults: [
        { id: "visible", name: "Prints ok", passed: true, visible: true, message: "Passed" },
        { id: "visible", name: "Prints ok again", passed: true, visible: true, message: "Passed" }
      ]
    }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "duplicate-results"
    });
  });

  it("rejects a pass with no visible result or the wrong visible result count", () => {
    expect(validateNativeWebViewResult(attempt({
      testResults: [{ id: "hidden", name: "Private", passed: true, visible: false, message: "" }]
    }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "empty-visible-results"
    });

    expect(validateNativeWebViewResult(attempt({
      testResults: []
    }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "empty-results"
    });

    expect(validateNativeWebViewResult(attempt({
      testResults: [
        { id: "visible", name: "Prints ok", passed: true, visible: true, message: "Passed" },
        { id: "extra", name: "Extra", passed: true, visible: true, message: "Passed" }
      ]
    }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "visible-result-count-mismatch"
    });
  });

  it("rejects a non-finite score", () => {
    expect(validateNativeWebViewResult(attempt({ passed: false, score: Number.NaN }), request(), "req-active-1")).toEqual({
      ok: false,
      reason: "invalid-score"
    });
  });

  it("accepts a genuine failing check and a plain file run", () => {
    expect(validateNativeWebViewResult(attempt({
      passed: false,
      score: 0,
      testResults: [{ id: "visible", name: "Prints ok", passed: false, visible: true, message: "Missing output" }]
    }), request(), "req-active-1")).toEqual({ ok: true });

    expect(validateNativeWebViewResult(
      attempt({ runMode: "run_file", passed: true, score: 0, testResults: [] }),
      request({ runMode: "run_file" }),
      "req-active-1"
    )).toEqual({ ok: true });
  });
});
