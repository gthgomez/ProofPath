/**
 * Timing for the Code Lab's run-phase animation.
 *
 * The app deliberately pads each run with real wall-clock delays so learners
 * can see the progress phases. Tests do not need to watch those delays and
 * polling them under parallel load is the source of flaky `waitFor` timeouts,
 * so this module exposes a small, dependency-free override seam that
 * `tests/setup.ts` can reach without importing the UI tree.
 */
let overrideMs: number | null = null;

/**
 * Testing seam: override every run-phase delay. Pass `null` to restore the
 * real app timings.
 */
export function setRunPhaseDelaysOverride(delayMs: number | null): void {
  overrideMs = delayMs;
}

/** Resolve the delay for a single phase, honoring a test override if set. */
export function resolveRunPhaseDelay(defaultDurationMs: number): number {
  return overrideMs ?? defaultDurationMs;
}

/**
 * Await one run-phase delay. A zero override resolves on a microtask so tests
 * carry no real-timer reliance instead of a clamped `setTimeout` hop.
 */
export function runPhaseDelay(defaultDurationMs: number): Promise<void> {
  const delayMs = resolveRunPhaseDelay(defaultDurationMs);
  return delayMs <= 0
    ? Promise.resolve()
    : new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });
}
