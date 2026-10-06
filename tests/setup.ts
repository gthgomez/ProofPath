import "@testing-library/jest-dom/vitest";
import { cleanup, configure } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest runs with globals disabled, so testing-library's auto-cleanup never
// registers. Clean the DOM after every test so renders do not leak across
// tests in the same file.
afterEach(() => {
  cleanup();
});

// The Code Lab deliberately pads each run with real timers
// (`waitForRunPhase` in src/ui/code-lab.tsx: 260ms before the sandbox call,
// 180ms after) so the running state is actually observable. A journey test
// can trigger several runs, and the suite executes in parallel, so testing-
// library's 1000ms default `asyncUtilTimeout` is not enough headroom — the
// journey helpers would time out mid-run and report a missing button rather
// than a real failure. Keep this in step with `testTimeout` in
// vitest.config.ts.
configure({ asyncUtilTimeout: 20000 });