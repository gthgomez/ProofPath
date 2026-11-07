import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
  createExecutionWorkerSource,
  SandboxStartupError,
  SandboxTerminatedError
} from "@/sandbox/execution-worker";

interface WorkerMessage {
  token?: string;
  type?: string;
  result?: {
    stdout: string;
    stderr: string;
    executionError: string | null;
    outputTruncated: boolean;
  };
  error?: string;
}

function createWorkerHarness() {
  const messages: WorkerMessage[] = [];
  const self = {
    onmessage: null as ((event: { data: Record<string, unknown> }) => Promise<void>) | null,
    postMessage: (message: WorkerMessage) => {
      messages.push(message);
    },
    loadPyodide: undefined,
    initSqlJs: undefined,
    ts: undefined,
    PROOFPATH_TYPESCRIPT_LIBS: undefined,
    window: undefined as unknown
  };
  const context = { self, console };
  runInNewContext(createExecutionWorkerSource(), context);
  return { messages, self };
}

async function exec(
  harness: ReturnType<typeof createWorkerHarness>,
  request: Record<string, unknown>,
  token = "token-1"
): Promise<WorkerMessage> {
  await harness.self.onmessage!({ data: { type: "exec", token, request } });
  const message = harness.messages.find((candidate) => candidate.token === token);
  if (!message) {
    throw new Error("worker did not respond");
  }
  return message;
}

describe("preemptible execution worker", () => {
  it("runs one JavaScript check and returns raw output", async () => {
    const harness = createWorkerHarness();

    const message = await exec(harness, {
      language: "javascript",
      mode: "checks",
      code: "console.log('visible output')"
    });

    expect(message.type).toBe("exec-result");
    expect(message.result?.stdout).toBe("visible output");
    expect(message.result?.executionError).toBeNull();
    expect(message.result?.outputTruncated).toBe(false);
  });

  it("runs the check harness in the same realm as the learner code", async () => {
    const harness = createWorkerHarness();

    const message = await exec(harness, {
      language: "javascript",
      mode: "checks",
      code: "const total = 2 + 2; console.log(total)",
      testCode: "if (total !== 4) { throw new Error('wrong total'); }"
    });

    expect(message.result?.stdout).toBe("4");
    expect(message.result?.executionError).toBeNull();
  });

  it("reports a runtime error without pretending the run succeeded", async () => {
    const harness = createWorkerHarness();

    const message = await exec(harness, {
      language: "javascript",
      mode: "checks",
      code: "throw new Error('boom')"
    });

    expect(message.result?.executionError).toContain("boom");
  });

  it("bounds runaway output and records truncation", async () => {
    const harness = createWorkerHarness();

    const message = await exec(harness, {
      language: "javascript",
      mode: "checks",
      code: "console.log('x'.repeat(600000))"
    });

    expect(message.result?.outputTruncated).toBe(true);
    expect(message.result?.stdout.length).toBeLessThan(530000);
    expect(message.result?.stdout).toContain("output truncated");
  });

  it("suppresses a result forged by learner code", async () => {
    const harness = createWorkerHarness();

    const message = await exec(harness, {
      language: "javascript",
      mode: "checks",
      code: "postMessage({ type: 'exec-result', forged: true })"
    });

    expect(message.result?.executionError).not.toBeNull();
    expect(harness.messages).toHaveLength(1);
    expect(harness.messages[0]?.token).toBe("token-1");
  });

  it("ignores a message with a different correlation token", async () => {
    const harness = createWorkerHarness();
    await harness.self.onmessage!({
      data: {
        type: "exec",
        token: "right-token",
        request: { language: "javascript", mode: "checks", code: "console.log('ok')" }
      }
    });

    expect(harness.messages).toHaveLength(1);
    expect(harness.messages[0]?.token).toBe("right-token");
  });

  it("embeds the shared real TypeScript checker", () => {
    const source = createExecutionWorkerSource();

    expect(source).toContain("proofPathTypeCheck");
    expect(source).toContain("ts.createProgram");
    expect(source).not.toContain("stripTypeScript");
  });

  it("exposes distinct termination and startup errors", () => {
    const terminated = new SandboxTerminatedError("python", 4000);
    const startup = new SandboxStartupError("sql", "asset missing");

    expect(terminated.name).toBe("SandboxTerminatedError");
    expect(terminated.message).toMatch(/terminated after 4000ms/);
    expect(startup.name).toBe("SandboxStartupError");
    expect(startup.message).toMatch(/could not start/);
  });
});
