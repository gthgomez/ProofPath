import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SANDBOX_BOOT_TIMEOUT_MS,
  SandboxCanceledError,
  SandboxStartupError,
  SandboxTerminatedError,
  SandboxWorkerRuntime
} from "@/sandbox/execution-worker";

interface SentMessage {
  type: string;
  token: string;
  [key: string]: unknown;
}

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: { data: Record<string, unknown> }) => void) | null = null;
  onerror: ((event: { message: string }) => void) | null = null;
  terminated = false;
  readonly sent: SentMessage[] = [];

  constructor(_url: string) {
    FakeWorker.instances.push(this);
  }

  postMessage(message: SentMessage): void {
    this.sent.push(message);
  }

  terminate(): void {
    this.terminated = true;
  }

  respond(payload: Record<string, unknown>, token = this.sent.at(-1)?.token): void {
    this.onmessage?.({ data: { ...payload, token } });
  }

  fail(message: string): void {
    this.onerror?.({ message });
  }
}

const flush = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, 0));
};

async function waitForSent(worker: FakeWorker, count: number): Promise<void> {
  for (let attempt = 0; attempt < 50 && worker.sent.length < count; attempt += 1) {
    await flush();
  }
  expect(worker.sent.length).toBeGreaterThanOrEqual(count);
}

function lastWorker(): FakeWorker {
  return FakeWorker.instances.at(-1) as FakeWorker;
}

describe("sandbox worker runtime lifecycle", () => {
  beforeEach(() => {
    FakeWorker.instances = [];
    vi.stubGlobal("Worker", FakeWorker as unknown as typeof Worker);
    vi.stubGlobal("Blob", class FakeBlob {});
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: vi.fn(() => "blob:proofpath-test") });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("deduplicates simultaneous boot calls", async () => {
    const runtime = new SandboxWorkerRuntime("javascript", "");
    const first = runtime.ensureBooted();
    const second = runtime.ensureBooted();
    await waitForSent(lastWorker(), 1);

    const worker = lastWorker();
    expect(worker.sent).toHaveLength(1);
    worker.respond({ type: "ready" });

    await expect(Promise.all([first, second])).resolves.toBeDefined();
    expect(FakeWorker.instances).toHaveLength(1);
  });

  it("queues two executions that arrive before boot completes", async () => {
    const runtime = new SandboxWorkerRuntime("javascript", "");
    const first = runtime.exec({ language: "javascript", code: "1", mode: "checks" }, 1000);
    const second = runtime.exec({ language: "javascript", code: "2", mode: "checks" }, 1000);
    await flush();

    const worker = lastWorker();
    await waitForSent(worker, 1);
    expect(worker.sent[0]?.type).toBe("boot");
    worker.respond({ type: "ready" });
    await waitForSent(worker, 2);
    expect(worker.sent[1]?.type).toBe("exec");

    worker.respond({ type: "exec-result", result: { stdout: "one", stderr: "", executionError: null, outputTruncated: false } });
    await expect(first).resolves.toEqual({ stdout: "one", stderr: "", executionError: null, outputTruncated: false });

    await waitForSent(worker, 3);
    expect(worker.sent[2]?.type).toBe("exec");
    worker.respond({ type: "exec-result", result: { stdout: "two", stderr: "", executionError: null, outputTruncated: false } });
    await expect(second).resolves.toEqual({ stdout: "two", stderr: "", executionError: null, outputTruncated: false });
    expect(FakeWorker.instances).toHaveLength(1);
  });

  it("keeps preload and a user run on one booted worker", async () => {
    const runtime = new SandboxWorkerRuntime("javascript", "");
    const preload = runtime.ensureBooted();
    const run = runtime.exec({ language: "javascript", code: "ok", mode: "checks" }, 1000);
    await flush();

    const worker = lastWorker();
    await waitForSent(worker, 1);
    worker.respond({ type: "ready" });
    await preload;
    await waitForSent(worker, 2);
    worker.respond({ type: "exec-result", result: { stdout: "ok", stderr: "", executionError: null, outputTruncated: false } });

    await expect(run).resolves.toMatchObject({ stdout: "ok" });
    expect(FakeWorker.instances).toHaveLength(1);
  });

  it("rejects an execution timeout, terminates the worker, and recovers on the next run", async () => {
    const runtime = new SandboxWorkerRuntime("javascript", "");
    const first = runtime.exec({ language: "javascript", code: "loop", mode: "checks" }, 20);
    await flush();
    const worker = lastWorker();
    await waitForSent(worker, 1);
    worker.respond({ type: "ready" });
    await waitForSent(worker, 2);

    await expect(first).rejects.toBeInstanceOf(SandboxTerminatedError);
    expect(worker.terminated).toBe(true);

    const second = runtime.exec({ language: "javascript", code: "ok", mode: "checks" }, 1000);
    await flush();
    const replacement = lastWorker();
    expect(replacement).not.toBe(worker);
    await waitForSent(replacement, 1);
    replacement.respond({ type: "ready" });
    await waitForSent(replacement, 2);
    replacement.respond({ type: "exec-result", result: { stdout: "recovered", stderr: "", executionError: null, outputTruncated: false } });

    await expect(second).resolves.toMatchObject({ stdout: "recovered" });
  });

  it("times out startup separately from execution", async () => {
    vi.useFakeTimers();
    const runtime = new SandboxWorkerRuntime("python", "");
    const boot = runtime.ensureBooted();
    const rejection = expect(boot).rejects.toBeInstanceOf(SandboxStartupError);

    await vi.advanceTimersByTimeAsync(SANDBOX_BOOT_TIMEOUT_MS + 1);
    await rejection;
    expect(lastWorker().terminated).toBe(true);
  });

  it("rejects only the active request on a worker error, then lets the queued request recover", async () => {
    const runtime = new SandboxWorkerRuntime("javascript", "");
    const first = runtime.exec({ language: "javascript", code: "first", mode: "checks" }, 1000);
    const second = runtime.exec({ language: "javascript", code: "second", mode: "checks" }, 1000);
    await flush();
    const worker = lastWorker();
    await waitForSent(worker, 1);
    worker.respond({ type: "ready" });
    await waitForSent(worker, 2);

    worker.fail("worker crashed");
    await expect(first).rejects.toThrow("worker crashed");

    const replacement = lastWorker();
    await waitForSent(replacement, 1);
    replacement.respond({ type: "ready" });
    await waitForSent(replacement, 2);
    replacement.respond({ type: "exec-result", result: { stdout: "second", stderr: "", executionError: null, outputTruncated: false } });
    await expect(second).resolves.toMatchObject({ stdout: "second" });
  });

  it("ignores duplicate and late messages", async () => {
    const runtime = new SandboxWorkerRuntime("javascript", "");
    const run = runtime.exec({ language: "javascript", code: "ok", mode: "checks" }, 1000);
    await flush();
    const worker = lastWorker();
    await waitForSent(worker, 1);
    worker.respond({ type: "ready" });
    await waitForSent(worker, 2);

    const execToken = worker.sent[1]?.token;
    worker.respond({ type: "exec-result", result: { stdout: "once", stderr: "", executionError: null, outputTruncated: false } }, execToken);
    worker.respond({ type: "exec-result", result: { stdout: "twice", stderr: "", executionError: null, outputTruncated: false } }, execToken);
    worker.respond({ type: "exec-result", result: { stdout: "late", stderr: "", executionError: null, outputTruncated: false } }, "wrong-token");

    await expect(run).resolves.toMatchObject({ stdout: "once" });
  });

  it("rejects an in-flight request when the runtime is shut down", async () => {
    const runtime = new SandboxWorkerRuntime("javascript", "");
    const run = runtime.exec({ language: "javascript", code: "pending", mode: "checks" }, 5000);
    await flush();
    const worker = lastWorker();
    await waitForSent(worker, 1);
    worker.respond({ type: "ready" });
    await waitForSent(worker, 2);

    runtime.terminate();
    await expect(run).rejects.toBeInstanceOf(SandboxCanceledError);
    expect(worker.terminated).toBe(true);
  });

  it("does not leave a timeout promise unresolved when the lane is reused", async () => {
    const runtime = new SandboxWorkerRuntime("javascript", "");
    const first = runtime.exec({ language: "javascript", code: "timeout", mode: "checks" }, 10);
    const second = runtime.exec({ language: "javascript", code: "ok", mode: "checks" }, 1000);
    await flush();
    const worker = lastWorker();
    await waitForSent(worker, 1);
    worker.respond({ type: "ready" });
    await waitForSent(worker, 2);

    await expect(first).rejects.toBeInstanceOf(SandboxTerminatedError);
    await flush();
    const replacement = lastWorker();
    await waitForSent(replacement, 1);
    replacement.respond({ type: "ready" });
    await waitForSent(replacement, 2);
    replacement.respond({ type: "exec-result", result: { stdout: "ok", stderr: "", executionError: null, outputTruncated: false } });
    await expect(second).resolves.toMatchObject({ stdout: "ok" });
  });
});
