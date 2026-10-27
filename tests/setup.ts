import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { runInNewContext } from "node:vm";
import { setRunPhaseDelaysOverride } from "../src/ui/run-phase-timing";

// The production runner requires a Worker and must never fall back to evaluating
// learner code in the test runner's global realm. This VM-backed Worker shim
// models the postMessage surface used by the app and omits host capabilities
// from the worker global. It exists only in the offline test host.
const testWorkerBlobs = new Map<string, Blob>();
let nextTestWorkerId = 0;
Object.defineProperty(globalThis.URL, "createObjectURL", {
  configurable: true,
  value: (blob: Blob) => {
    const url = `test-worker:${++nextTestWorkerId}`;
    testWorkerBlobs.set(url, blob);
    return url;
  }
});
Object.defineProperty(globalThis.URL, "revokeObjectURL", {
  configurable: true,
  value: (url: string) => testWorkerBlobs.delete(url)
});
class OfflineTestWorker {
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onerror: ((event: { message: string }) => void) | null = null;
  private workerContext: { self?: { onmessage?: (event: { data: unknown }) => void; postMessage: (data: unknown) => void } } = {};
  private ready: Promise<void>;

  constructor(url: string) {
    const blob = testWorkerBlobs.get(url);
    if (!blob) throw new Error(`Unknown test Worker URL: ${url}`);
    this.ready = blob.text().then((source) => {
      this.workerContext.self = {
        onmessage: undefined,
        postMessage: (data) => this.onmessage?.({ data })
      };
      runInNewContext(source, this.workerContext);
    });
  }

  postMessage(data: unknown): void {
    void this.ready.then(() => this.workerContext.self?.onmessage?.({ data })).catch((error: unknown) => {
      this.onerror?.({ message: error instanceof Error ? error.message : String(error) });
    });
  }

  terminate(): void {}
}
Object.defineProperty(globalThis, "Worker", { configurable: true, value: OfflineTestWorker });

// Vitest runs with globals disabled, so testing-library's auto-cleanup never
// registers. Clean the DOM after every test so renders do not leak across
// tests in the same file.
afterEach(() => {
  cleanup();
});

// The Code Lab pads each run with real wall-clock delays
// (`waitForRunPhase` in src/ui/code-lab.tsx) so learners can see the progress
// phases. Journey tests do not need to watch that animation, and relying on it
// made their `waitFor` polling race the real timer under parallel load. Disable
// the padding here so the code lab's run phases settle on a microtask, with no
// real-timer hop for testing-library's `waitFor` polling to race.
setRunPhaseDelaysOverride(0);
