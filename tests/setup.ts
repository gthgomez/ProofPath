import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
import { setRunPhaseDelaysOverride } from "../src/ui/run-phase-timing";

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
