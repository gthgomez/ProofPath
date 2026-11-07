import { describe, expect, it } from "vitest";
import * as tsModule from "typescript";
import { CURRENT_SANDBOX_DISCLOSURE_VERSION, normalizeCodeRunAttempt, redactCheckResults } from "@/domain/code-run";
import type { CodeRunAttempt, CodeRunMode, LessonRunnerSpec } from "@/domain/types";
import {
  createNativeWebViewRunnerHtml,
  NATIVE_ANDROID_SANDBOX_BASE_URL,
  NATIVE_SANDBOX_WEBVIEW_SECURITY_PROPS,
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
import {
  loadTypeScriptLibFiles,
  type TypeScriptCompiler
} from "@/sandbox/typescript-typecheck";

const typeScriptCompiler = ((tsModule as unknown as { default?: TypeScriptCompiler }).default ?? tsModule) as unknown as TypeScriptCompiler;

describe("native WebView sandbox runner bridge", () => {
  it("exposes the bridge entrypoint and ready handshake in the generated HTML", () => {
    const html = createNativeWebViewRunnerHtml();

    expect(html).toContain("window.ProofPathSandbox");
    expect(html).toContain("sandbox-ready");
    expect(html).toContain(SANDBOX_ASSET_PATHS.pyodide);
    expect(html).toContain(SANDBOX_ASSET_PATHS.sqlJs);
    expect(html).toContain(SANDBOX_ASSET_PATHS.typescript);
    expect(html).toContain("loadPyodide");
    expect(html).toContain("initSqlJs");
    expect(html).toContain('window.PROOFPATH_SANDBOX_ASSETS.typescript + "typescript.js"');
    expect(html).toContain('window.PROOFPATH_SANDBOX_ASSETS.typescript + "typescript-libs.js"');
    expect(NATIVE_ANDROID_SANDBOX_BASE_URL).toBe("file:///android_asset/");
  });

  it("does not grant file-origin JavaScript access to other file or web origins", () => {
    expect(NATIVE_SANDBOX_WEBVIEW_SECURITY_PROPS).toEqual({
      allowFileAccessFromFileURLs: false,
      allowUniversalAccessFromFileURLs: false
    });
  });

  it("embeds the shared TypeScript type-check source", () => {
    const html = createNativeWebViewRunnerHtml();

    // The native runner must run the very same type check as the web runner.
    expect(html).toContain("/* typescript-typecheck:start */");
    expect(html).toContain("/* typescript-typecheck:end */");
    expect(html).toContain("function proofPathTypeCheck(ts, libFiles, fileName, code)");
    expect(html).toContain("proofPathFormatTypeCheckLearnerMessage");
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

    // The web runner only passes a run_file attempt when execution did not throw
    // and no error diagnostic was produced. The native script has no diagnostic
    // parser, so it combines its explicit executionError signal with the error
    // output signal instead of hardcoding true.
    expect(html).toContain("? !executionError && stderr.join");
    expect(html).toContain('.trim().length === 0');
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
      sandboxDisclosureVersion: CURRENT_SANDBOX_DISCLOSURE_VERSION,
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
      command: "proofpath checks lesson.js",
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

// The tests above assert on the generated HTML text. The harness below executes
// the same embedded script with stubbed host globals so the runtime logic (fresh
// per-check databases, harness ordering, __name__ binding) is observed rather
// than merely grepped for.
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

interface EmbeddedRunnerStubs {
  initSqlJs?: (config?: { locateFile?: (file: string) => string }) => Promise<{ Database: new () => unknown }>;
  loadPyodide?: (config: { indexURL: string }) => Promise<unknown>;
  ts?: unknown;
  typeScriptLibs?: Record<string, string>;
  // When set, runtime globals are only assigned when their bundle script
  // "loads" through the document stub, mirroring an asset that is fetched and
  // parsed on demand instead of being pre-injected.
  deferRuntimeStubs?: boolean;
}

interface EmbeddedRunnerOptions extends EmbeddedRunnerStubs {
  request: {
    lessonId: string;
    spec: LessonRunnerSpec;
    code: string;
    now: string;
    runMode: CodeRunMode;
  };
}

interface EmbeddedRunnerWindow {
  windowStub: Record<string, any>;
  sandbox: {
    run: (payload: unknown) => void;
    preload: (payload: { language: string }) => void;
  };
  dispatchMessage: (data: string) => void;
  loadedScriptSources: string[];
}

function createEmbeddedNativeRunnerWindow(options: EmbeddedRunnerStubs = {}): EmbeddedRunnerWindow {
  const html = createNativeWebViewRunnerHtml();
  const script = /<script>([\s\S]*)<\/script>/.exec(html)?.[1];
  if (!script) {
    throw new Error("embedded runner script not found");
  }

  // The runner registers the same `message` handler on both window and document,
  // mirroring the two bridges react-native-webview may use. Capture them so a
  // test can deliver a raw bridge payload through the real handler.
  const messageListeners: Array<(event: { data: unknown }) => void> = [];
  const loadedScriptSources: string[] = [];
  const windowStub: Record<string, any> = {
    ReactNativeWebView: { postMessage: () => {} },
    addEventListener: (type: string, listener: (event: { data: unknown }) => void) => {
      if (type === "message") {
        messageListeners.push(listener);
      }
    }
  };

  if (!options.deferRuntimeStubs) {
    windowStub.initSqlJs = options.initSqlJs;
    windowStub.loadPyodide = options.loadPyodide;
    windowStub.ts = options.ts;
    windowStub.PROOFPATH_TYPESCRIPT_LIBS = options.typeScriptLibs;
  }

  // Simulate the bundled asset loader: record the requested script and, once it
  // is "loaded", expose the matching runtime global (an async load in the real
  // WebView).
  const applyLoadedScript = (src: string): void => {
    if (src.endsWith("typescript.js")) {
      windowStub.ts = options.ts;
    } else if (src.endsWith("typescript-libs.js")) {
      windowStub.PROOFPATH_TYPESCRIPT_LIBS = options.typeScriptLibs;
    } else if (src.endsWith("pyodide.js")) {
      windowStub.loadPyodide = options.loadPyodide;
    } else if (src.endsWith("sql-wasm.js")) {
      windowStub.initSqlJs = options.initSqlJs;
    }
  };

  const documentStub = {
    addEventListener: (type: string, listener: (event: { data: unknown }) => void) => {
      if (type === "message") {
        messageListeners.push(listener);
      }
    },
    querySelector: () => null,
    createElement: () => ({ dataset: {}, remove: () => {} }),
    head: {
      appendChild: (element: { src?: string; onload?: () => void }) => {
        const src = element.src ?? "";
        loadedScriptSources.push(src);
        applyLoadedScript(src);
        element.onload?.();
      }
    }
  };

  new Function("window", "document", script)(windowStub, documentStub);

  return {
    windowStub,
    sandbox: windowStub.ProofPathSandbox,
    loadedScriptSources,
    dispatchMessage: (data: string) => {
      // Both bridges hold the same handler; one delivery exercises the contract.
      messageListeners[0]?.({ data });
    }
  };
}

function runEmbeddedNativeRunner(options: EmbeddedRunnerOptions): Promise<EmbeddedAttempt> {
  const { windowStub, sandbox } = createEmbeddedNativeRunnerWindow(options);

  let resolveResult!: (attempt: EmbeddedAttempt) => void;
  const resultPromise = new Promise<EmbeddedAttempt>((resolve) => {
    resolveResult = resolve;
  });

  windowStub.ReactNativeWebView.postMessage = (payload: string) => {
    const message = JSON.parse(payload) as { type?: string; attempt?: EmbeddedAttempt };
    if (message.type === "sandbox-result" && message.attempt) {
      resolveResult(message.attempt);
    }
  };

  sandbox.run({ type: "run", request: options.request });
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

function createFakeSqlRuntime(): {
  databases: FakeSqlDatabase[];
  initSqlJs: () => Promise<{ Database: new () => unknown }>;
} {
  const databases: FakeSqlDatabase[] = [];
  class TrackedDatabase extends FakeSqlDatabase {
    constructor() {
      super();
      databases.push(this);
    }
  }

  return { databases, initSqlJs: async () => ({ Database: TrackedDatabase }) };
}

describe("native WebView runner behavior (embedded script executed with stubs)", () => {
  it("exposes the preload bridge and routes a preload payload to the runtime loader", async () => {
    const pyodideCalls: Array<{ indexURL: string }> = [];
    const sqlInitCalls: Array<{ locateFile?: (file: string) => string }> = [];
    const { sandbox, dispatchMessage } = createEmbeddedNativeRunnerWindow({
      loadPyodide: async (config) => {
        pyodideCalls.push(config);
        return {};
      },
      initSqlJs: async (config) => {
        sqlInitCalls.push(config ?? {});
        return { Database: class {} };
      }
    });

    // code-lab.native.tsx warms the runtime through this entrypoint on the
    // sandbox-ready handshake, so it must survive in the generated HTML.
    expect(typeof sandbox.preload).toBe("function");
    const html = createNativeWebViewRunnerHtml();
    expect(html).toContain("preload: function(payload)");
    expect(html).toContain('payload.type === "preload"');
    expect(html).toContain("preloadRuntime(payload.language)");

    // The bridge method warms Pyodide with the bundled asset index URL.
    sandbox.preload({ language: "python" });
    await Promise.resolve();
    expect(pyodideCalls).toEqual([{ indexURL: SANDBOX_ASSET_PATHS.pyodide }]);

    // A raw bridge payload follows the same preload contract.
    dispatchMessage(JSON.stringify({ type: "preload", language: "sql" }));
    await Promise.resolve();
    expect(sqlInitCalls).toHaveLength(1);
    expect(typeof sqlInitCalls[0]?.locateFile).toBe("function");
  });

  it("preloads the TypeScript compiler and library assets through the script loader", async () => {
    const fakeTs = { ScriptTarget: { ES2020: 1 }, createProgram: () => ({}) };
    const typeScriptLibs = { "lib.es5.d.ts": "// lib" };
    const { sandbox, loadedScriptSources } = createEmbeddedNativeRunnerWindow({
      ts: fakeTs,
      typeScriptLibs,
      deferRuntimeStubs: true
    });

    sandbox.preload({ language: "typescript" });
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Preloading must actually invoke the TypeScript runtime loader (not only the
    // python/sql loaders): both the compiler and the generated libs asset load.
    expect(loadedScriptSources).toEqual([
      SANDBOX_ASSET_PATHS.typescript + "typescript.js",
      SANDBOX_ASSET_PATHS.typescript + "typescript-libs.js"
    ]);
  });

  it("creates and closes a fresh database per check, running the gated harness before the query", async () => {
    const setupCode = "CREATE TABLE sessions (topic TEXT, minutes INTEGER);";
    const hiddenHarness = "INSERT INTO sessions (topic, minutes) VALUES ('sql', 45);";
    const learnerQuery = "SELECT topic, SUM(minutes) FROM sessions GROUP BY topic ORDER BY topic;";
    const { databases, initSqlJs } = createFakeSqlRuntime();

    const attempt = await runEmbeddedNativeRunner({
      request: {
        lessonId: "lesson-native-sql",
        code: learnerQuery,
        now: "2026-05-08T22:10:00.000Z",
        runMode: "run_checks",
        spec: {
          language: "sql",
          instructions: "Summarize study minutes per topic.",
          starterCode: learnerQuery,
          setupCode,
          visibleTests: [
            {
              id: "visible",
              name: "Visible",
              code: "-- visible check runs no harness SQL",
              expectedOutputIncludes: ["python | 50"]
            }
          ],
          hiddenTests: [
            {
              id: "hidden",
              name: "Hidden",
              code: hiddenHarness,
              expectedOutputIncludes: ["python | 50", "sql | 45"]
            }
          ],
          expectedOutput: ["python | 50"],
          timeoutMs: 30000,
          allowNetwork: false
        }
      },
      initSqlJs
    });

    // One fresh database per check, each closed.
    expect(databases).toHaveLength(2);
    expect(databases.every((database) => database.closed)).toBe(true);

    // The visible check's comment-only harness is skipped; the hidden check runs
    // its seed after setup. Both run their single learner query once.
    expect(databases[0]?.runCalls).toEqual([setupCode]);
    expect(databases[1]?.runCalls).toEqual([setupCode, hiddenHarness]);
    for (const database of databases) {
      expect(database.execCalls).toEqual([learnerQuery]);
    }

    // The hidden check only passes because its harness ran before the learner
    // query: the seeded sql row satisfies expectedOutputIncludes but must not be
    // published to learner-visible stdout.
    expect(attempt.passed).toBe(true);
    expect(attempt.stdout).toContain("python | 50");
    expect(attempt.stdout).not.toContain("sql | 45");
    expect(attempt.testResults.map((result) => result.id)).toEqual(["visible"]);
    expect(attempt.hiddenCheckSummary).toEqual({ total: 0, passed: 0, failed: 0 });
  });

  it("binds the import sentinel before checks and the direct sentinel for run_file", async () => {
    const createFakePyodide = () => {
      const events: string[] = [];
      const pyodide = {
        setStdout: () => {},
        setStderr: () => {},
        globals: {
          set: (key: string, value: unknown) => {
            events.push(`globals.set:${key}=${String(value)}`);
          }
        },
        runPythonAsync: async (code: string) => {
          events.push(`runPythonAsync:${code}`);
        }
      };
      return { events, pyodide };
    };

    const spec: LessonRunnerSpec = {
      language: "python",
      instructions: "Probe the bound __name__.",
      starterCode: "print(__name__)",
      visibleTests: [{ id: "visible", name: "Visible", code: "print('ok')", expectedOutputIncludes: [] }],
      hiddenTests: [],
      expectedOutput: [],
      timeoutMs: 30000,
      allowNetwork: false
    };

    const checks = createFakePyodide();
    const checkAttempt = await runEmbeddedNativeRunner({
      request: {
        lessonId: "lesson-native-python",
        code: "print('probe')",
        now: "2026-05-08T22:11:00.000Z",
        runMode: "run_checks",
        spec
      },
      loadPyodide: async () => checks.pyodide
    });

    expect(checks.events[0]).toBe(`globals.set:__name__=${PYTHON_IMPORT_RUN_NAME}`);
    expect(checks.events).not.toContain(`globals.set:__name__=${PYTHON_DIRECT_RUN_NAME}`);
    const firstRun = checks.events.findIndex((event) => event.startsWith("runPythonAsync:"));
    expect(firstRun).toBeGreaterThan(0);
    expect(checks.events.indexOf(`globals.set:__name__=${PYTHON_IMPORT_RUN_NAME}`)).toBeLessThan(firstRun);
    expect(checkAttempt.passed).toBe(true);

    const direct = createFakePyodide();
    await runEmbeddedNativeRunner({
      request: {
        lessonId: "lesson-native-python",
        code: "print('probe')",
        now: "2026-05-08T22:12:00.000Z",
        runMode: "run_file",
        spec
      },
      loadPyodide: async () => direct.pyodide
    });

    expect(direct.events[0]).toBe(`globals.set:__name__=${PYTHON_DIRECT_RUN_NAME}`);
  });

  it("fails a native TypeScript check with a learner-facing type error", async () => {
    const code = 'const value: number = "hello";';
    const typeScriptLibs = loadTypeScriptLibFiles(typeScriptCompiler);
    const attempt = await runEmbeddedNativeRunner({
      request: {
        lessonId: "lesson-native-typescript",
        code,
        now: "2026-10-07T20:10:00.000Z",
        runMode: "run_checks",
        spec: {
          language: "typescript",
          instructions: "Declare a number and print it.",
          starterCode: code,
          visibleTests: [
            { id: "visible", name: "Prints the number", code: "console.log(value);", expectedOutputIncludes: ["2"] }
          ],
          hiddenTests: [],
          expectedOutput: ["2"],
          timeoutMs: 4000,
          allowNetwork: false
        }
      },
      ts: typeScriptCompiler,
      typeScriptLibs
    });

    expect(attempt.passed).toBe(false);
    expect(attempt.testResults[0]?.passed).toBe(false);
    expect(attempt.testResults[0]?.message).toMatch(/type error/i);
    expect(attempt.testResults[0]?.message).toMatch(/not assignable to type 'number'/i);
    expect(attempt.stderr).toMatch(/error TS2322/);
  });

  it("passes a type-correct native TypeScript check", async () => {
    const code = "const value: number = 2;\nconsole.log(value);";
    const typeScriptLibs = loadTypeScriptLibFiles(typeScriptCompiler);
    const attempt = await runEmbeddedNativeRunner({
      request: {
        lessonId: "lesson-native-typescript",
        code,
        now: "2026-10-07T20:11:00.000Z",
        runMode: "run_checks",
        spec: {
          language: "typescript",
          instructions: "Declare a number and print it.",
          starterCode: code,
          visibleTests: [
            { id: "visible", name: "Prints the number", code: "console.log(value);", expectedOutputIncludes: ["2"] }
          ],
          hiddenTests: [],
          expectedOutput: ["2"],
          timeoutMs: 4000,
          allowNetwork: false
        }
      },
      ts: typeScriptCompiler,
      typeScriptLibs
    });

    expect(attempt.passed).toBe(true);
    expect(attempt.stdout).toContain("2");
  });

  it("resets output character capping between consecutive runs on the same runner", async () => {
    const { windowStub, sandbox } = createEmbeddedNativeRunnerWindow({});
    const results: EmbeddedAttempt[] = [];
    let resolveRun!: () => void;

    windowStub.ReactNativeWebView.postMessage = (payload: string) => {
      const message = JSON.parse(payload) as { type?: string; attempt?: EmbeddedAttempt };
      if (message.type === "sandbox-result" && message.attempt) {
        results.push(message.attempt);
        resolveRun?.();
      }
    };

    // First run emits huge output that triggers truncation
    const firstRunPromise = new Promise<void>((resolve) => {
      resolveRun = resolve;
    });
    sandbox.run({
      type: "run",
      request: {
        lessonId: "lesson-output-1",
        code: 'for (var i = 0; i < 25000; i++) console.log("line " + i + " padding text data");',
        now: "2026-11-06T20:00:00.000Z",
        runMode: "run_file",
        spec: {
          language: "javascript",
          instructions: "Test big output.",
          starterCode: "",
          visibleTests: [],
          hiddenTests: [],
          expectedOutput: [],
          timeoutMs: 4000,
          allowNetwork: false
        }
      }
    });
    await firstRunPromise;

    expect(results).toHaveLength(1);
    expect(results[0]?.stdout).toContain("[output truncated: exceeded 512KB limit]");

    // Second run on the same window emits normal output
    const secondRunPromise = new Promise<void>((resolve) => {
      resolveRun = resolve;
    });
    sandbox.run({
      type: "run",
      request: {
        lessonId: "lesson-output-2",
        code: 'console.log("second run output line");',
        now: "2026-11-06T20:00:01.000Z",
        runMode: "run_file",
        spec: {
          language: "javascript",
          instructions: "Test second run output.",
          starterCode: "",
          visibleTests: [],
          hiddenTests: [],
          expectedOutput: [],
          timeoutMs: 4000,
          allowNetwork: false
        }
      }
    });
    await secondRunPromise;

    expect(results).toHaveLength(2);
    // The second run's output must not be empty or truncated by the previous run
    expect(results[1]?.stdout).toBe("second run output line");
  });

  it("includes requestId in results and correlates active runs", async () => {
    const { windowStub, sandbox } = createEmbeddedNativeRunnerWindow({});
    let capturedResult: { type?: string; requestId?: string; attempt?: unknown } | undefined;
    let resolveResult!: () => void;
    const resultPromise = new Promise<void>((resolve) => {
      resolveResult = resolve;
    });

    windowStub.ReactNativeWebView.postMessage = (payload: string) => {
      capturedResult = JSON.parse(payload);
      resolveResult?.();
    };

    sandbox.run({
      type: "run",
      request: {
        requestId: "req-xyz-999",
        lessonId: "lesson-test",
        code: "console.log('hello');",
        now: "2026-11-06T20:00:00.000Z",
        runMode: "run_file",
        spec: {
          language: "javascript",
          instructions: "Say hello",
          starterCode: "",
          visibleTests: [],
          hiddenTests: [],
          expectedOutput: [],
          timeoutMs: 4000,
          allowNetwork: false
        }
      }
    });
    await resultPromise;

    expect(capturedResult).toBeDefined();
    expect(capturedResult?.type).toBe("sandbox-result");
    expect(capturedResult?.requestId).toBe("req-xyz-999");
  });
});

describe("native runner privacy and truncation truth (A01/A02/A04)", () => {
  function createScriptedPyodide(script: (code: string, emitOut: (text: string) => void, emitErr: (text: string) => void) => Promise<void>) {
    let emitOut: (text: string) => void = () => {};
    let emitErr: (text: string) => void = () => {};
    return {
      setStdout: ({ batched }: { batched: (text: string) => void }) => {
        emitOut = batched;
      },
      setStderr: ({ batched }: { batched: (text: string) => void }) => {
        emitErr = batched;
      },
      globals: { set: () => {} },
      runPythonAsync: async (code: string) => script(code, emitOut, emitErr)
    };
  }

  it("does not leak a hidden Python stderr sentinel and still grades the hidden failure", async () => {
    const pyodide = createScriptedPyodide(async (code, emitOut, emitErr) => {
      if (code.includes("HIDDEN_ONLY_SENTINEL_2026")) {
        emitErr("HIDDEN_ONLY_SENTINEL_2026\n");
        emitOut("not the expected row\n");
        return;
      }
      emitOut("DONE\n");
    });

    const attempt = await runEmbeddedNativeRunner({
      request: {
        lessonId: "lesson-native-python-hidden",
        code: 'print("DONE")',
        now: "2026-11-07T21:10:00.000Z",
        runMode: "run_checks",
        spec: {
          language: "python",
          instructions: "Print the visible answer.",
          starterCode: 'print("DONE")',
          visibleTests: [{ id: "visible", name: "Visible", code: "# comment-only", expectedOutputIncludes: ["DONE"] }],
          hiddenTests: [{
            id: "hidden",
            name: "Hidden",
            code: "import sys\nsys.stderr.write('HIDDEN_ONLY_SENTINEL_2026\\n')\nprint('wrong')",
            expectedOutputIncludes: ["SECRET_EXPECTED_ROW_2026"]
          }],
          expectedOutput: ["DONE"],
          timeoutMs: 30000,
          allowNetwork: false
        }
      },
      loadPyodide: async () => pyodide
    });

    expect(attempt.passed).toBe(false);
    expect(attempt.score).toBe(50);
    const serialized = JSON.stringify(attempt);
    for (const secret of ["HIDDEN_ONLY_SENTINEL_2026", "SECRET_EXPECTED_ROW_2026", "Output missing"]) {
      expect(serialized).not.toContain(secret);
      expect(attempt.stdout).not.toContain(secret);
      expect(attempt.stderr).not.toContain(secret);
    }
    expect(attempt.testResults.map((result) => result.id)).toEqual(["visible"]);
  });

  it("fails a native Python run_file when output truncates before an exception", async () => {
    const pyodide = createScriptedPyodide(async (_code, emitOut) => {
      for (let index = 0; index < 20000; index += 1) {
        emitOut(`filler ${index} ${"x".repeat(60)}\n`);
      }
      throw new Error("boom-after-truncation");
    });

    const attempt = await runEmbeddedNativeRunner({
      request: {
        lessonId: "lesson-native-python-truncation",
        code: "print('anything')",
        now: "2026-11-07T21:11:00.000Z",
        runMode: "run_file",
        spec: {
          language: "python",
          instructions: "Produce output, then fail.",
          starterCode: "",
          visibleTests: [],
          hiddenTests: [],
          expectedOutput: [],
          timeoutMs: 30000,
          allowNetwork: false
        }
      },
      loadPyodide: async () => pyodide
    });

    expect(attempt.passed).toBe(false);
    expect(attempt.stdout).toContain("[output truncated: exceeded 512KB limit]");
    expect(attempt.stderr).toContain("boom-after-truncation");
  });

  it("rejects malformed native results and never upgrades a contradictory pass", () => {
    // Missing required fields is not a result.
    expect(parseNativeWebViewRunnerMessage(JSON.stringify({
      type: "sandbox-result",
      requestId: "req-1",
      attempt: { id: "x", lessonId: "y" }
    }))).toBeNull();

    // A non-string stdout is not a result.
    const base = {
      id: "code-run-x-1",
      lessonId: "lesson-x",
      language: "javascript",
      runMode: "run_checks",
      codeSnapshot: "console.log('ok')",
      stdout: "ok",
      stderr: "",
      passed: true,
      score: 100,
      runtimeMs: 1,
      testResults: [{ id: "visible", name: "Visible", passed: false, visible: true, message: "failed" }],
      createdAt: "2026-11-07T21:12:00.000Z"
    };
    expect(parseNativeWebViewRunnerResult(JSON.stringify({
      type: "sandbox-result",
      requestId: "req-2",
      attempt: { ...base, stdout: 42 }
    }))).toBeNull();

    // passed:true contradicts a failed visible check, so it is coerced to false.
    const parsed = parseNativeWebViewRunnerResult(JSON.stringify({ type: "sandbox-result", requestId: "req-3", attempt: base }));
    expect(parsed).not.toBeNull();
    expect(parsed?.passed).toBe(false);
    expect(parsed?.hiddenCheckSummary).toEqual({ total: 0, passed: 0, failed: 0 });
  });
});

describe("native runner per-run output budget", () => {
  it("gives each sequential run a fresh output budget", async () => {
    const pyodide = {
      setStdout: (options: { batched: (text: string) => void }) => {
        (pyodide as unknown as { emit: (text: string) => void }).emit = options.batched;
      },
      setStderr: () => {},
      globals: { set: () => {} },
      runPythonAsync: async () => {
        const emit = (pyodide as unknown as { emit?: (text: string) => void }).emit ?? (() => {});
        for (let index = 0; index < 20000; index += 1) {
          emit(`line ${index} ${"x".repeat(60)}\n`);
        }
      }
    };

    const { windowStub, sandbox } = createEmbeddedNativeRunnerWindow({ loadPyodide: async () => pyodide });
    const results: EmbeddedAttempt[] = [];
    windowStub.ReactNativeWebView.postMessage = (payload: string) => {
      const message = JSON.parse(payload) as { type?: string; attempt?: EmbeddedAttempt };
      if (message.type === "sandbox-result" && message.attempt) {
        results.push(message.attempt);
      }
    };

    const request = (now: string) => ({
      lessonId: "lesson-native-budget",
      code: "print('hello')",
      now,
      runMode: "run_file" as const,
      spec: {
        language: "python" as const,
        instructions: "Produce a lot of output.",
        starterCode: "",
        visibleTests: [],
        hiddenTests: [],
        expectedOutput: [],
        timeoutMs: 30000,
        allowNetwork: false
      }
    });

    const waitFor = async (count: number) => {
      for (let attempt = 0; attempt < 200 && results.length < count; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    };

    sandbox.run({ type: "run", request: request("2026-11-07T21:30:00.000Z") });
    await waitFor(1);
    sandbox.run({ type: "run", request: request("2026-11-07T21:31:00.000Z") });
    await waitFor(2);

    expect(results).toHaveLength(2);
    for (const attempt of results) {
      expect(attempt.stdout).toContain("[output truncated: exceeded 512KB limit]");
    }
  });
});
