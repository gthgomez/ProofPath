import { describe, expect, it } from "vitest";
import type { CodeRunMode, LessonRunnerSpec } from "@/domain/types";
import { createNativeWebViewRunnerHtml } from "@/sandbox/native-webview-runner";

// Native SQL evidence parity for `expectedOutputExactSet`. Kept in its own file
// so this branch does not edit tests/native-webview-runner.test.ts, which the
// parallel TypeScript-sandbox branch rewrites (avoids a cross-PR merge conflict).

type EmbeddedAttempt = {
  id: string;
  lessonId: string;
  language: string;
  runMode: string;
  stdout: string;
  stderr: string;
  passed: boolean;
  score: number;
  testResults: Array<{ id: string; visible: boolean; passed: boolean; message: string }>;
  hiddenCheckSummary: { total: number; passed: number; failed: number };
};

interface EmbeddedRunnerOptions {
  request: {
    lessonId: string;
    spec: LessonRunnerSpec;
    code: string;
    now: string;
    runMode: CodeRunMode;
  };
  initSqlJs?: () => Promise<{ Database: new () => unknown }>;
}

function runEmbeddedNativeRunner(options: EmbeddedRunnerOptions): Promise<EmbeddedAttempt> {
  const html = createNativeWebViewRunnerHtml();
  const script = /<script>([\s\S]*)<\/script>/.exec(html)?.[1];
  if (!script) {
    throw new Error("embedded runner script not found");
  }

  let resolveResult!: (attempt: EmbeddedAttempt) => void;
  const resultPromise = new Promise<EmbeddedAttempt>((resolve) => {
    resolveResult = resolve;
  });

  const windowStub: Record<string, any> = {
    ReactNativeWebView: {
      postMessage: (payload: string) => {
        const message = JSON.parse(payload) as { type?: string; attempt?: EmbeddedAttempt };
        if (message.type === "sandbox-result" && message.attempt) {
          resolveResult(message.attempt);
        }
      }
    },
    addEventListener: () => {},
    initSqlJs: options.initSqlJs
  };
  const documentStub = {
    addEventListener: () => {},
    querySelector: () => null,
    createElement: () => ({}),
    head: { appendChild: () => {} }
  };

  new Function("window", "document", script)(windowStub, documentStub);
  windowStub.ProofPathSandbox.run({ type: "run", request: options.request });
  return resultPromise;
}

class FakeSqlDatabase {
  rows: unknown[][] = [["python", "50"], ["git", "15"]];
  runCalls: string[] = [];
  execCalls: string[] = [];
  closed = false;

  run(sql: string): void {
    this.runCalls.push(sql);
    if (/INSERT\s+INTO\s+sessions/i.test(sql) && sql.includes("'sql'")) {
      this.rows = [["python", "50"], ["git", "15"], ["sql", "45"]];
    }
  }

  exec(sql: string): Array<{ columns: string[]; values: unknown[][] }> {
    this.execCalls.push(sql);
    return [{ columns: ["topic", "total"], values: this.rows }];
  }

  close(): void {
    this.closed = true;
  }
}

describe("native WebView runner SQL exact-set evidence", () => {
  const makeSpec = (exactSet: boolean): LessonRunnerSpec => ({
    language: "sql",
    instructions: "Summarize study minutes per topic.",
    starterCode: "SELECT topic, SUM(minutes) FROM sessions GROUP BY topic;",
    setupCode: "CREATE TABLE sessions (topic TEXT, minutes INTEGER);",
    visibleTests: [
      exactSet
        ? {
            id: "visible",
            name: "Visible",
            code: "-- visible check runs no harness SQL",
            expectedOutputExactLines: ["python | 50", "git | 15"],
            expectedOutputExactSet: true
          }
        : {
            id: "visible",
            name: "Visible",
            code: "-- visible check runs no harness SQL",
            expectedOutputExactLines: ["python | 50", "git | 15"]
          }
    ],
    hiddenTests: [],
    expectedOutput: ["python | 50", "git | 15"],
    timeoutMs: 30000,
    allowNetwork: false
  });

  const createRuntime = (rows: unknown[][]) => {
    class RowsDatabase extends FakeSqlDatabase {
      constructor() {
        super();
        this.rows = rows;
      }
    }
    return async () => ({ Database: RowsDatabase });
  };

  it("accepts exact output under expectedOutputExactSet", async () => {
    const attempt = await runEmbeddedNativeRunner({
      request: {
        lessonId: "lesson-native-sql-exact",
        code: "SELECT topic, SUM(minutes) FROM sessions GROUP BY topic;",
        now: "2026-05-08T22:13:00.000Z",
        runMode: "run_checks",
        spec: makeSpec(true)
      },
      initSqlJs: createRuntime([["python", "50"], ["git", "15"]])
    });
    expect(attempt.passed).toBe(true);
    expect(attempt.testResults[0]?.passed).toBe(true);
  });

  it("rejects expected rows plus extra rows when expectedOutputExactSet is set", async () => {
    const attempt = await runEmbeddedNativeRunner({
      request: {
        lessonId: "lesson-native-sql-extra",
        code: "SELECT topic, SUM(minutes) FROM sessions GROUP BY topic;",
        now: "2026-05-08T22:14:00.000Z",
        runMode: "run_checks",
        spec: makeSpec(true)
      },
      initSqlJs: createRuntime([["python", "50"], ["git", "15"], ["sql", "45"]])
    });
    expect(attempt.passed).toBe(false);
    expect(attempt.testResults[0]?.passed).toBe(false);
  });

  it("preserves subset behavior (extra rows tolerated) when the flag is absent", async () => {
    const attempt = await runEmbeddedNativeRunner({
      request: {
        lessonId: "lesson-native-sql-subset",
        code: "SELECT topic, SUM(minutes) FROM sessions GROUP BY topic;",
        now: "2026-05-08T22:15:00.000Z",
        runMode: "run_checks",
        spec: makeSpec(false)
      },
      initSqlJs: createRuntime([["python", "50"], ["git", "15"], ["sql", "45"]])
    });
    expect(attempt.passed).toBe(true);
  });
});
