import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveRunPhaseDelay, runPhaseDelay, setRunPhaseDelaysOverride } from "@/ui/run-phase-timing";

describe("run phase timing", () => {
  afterEach(() => {
    vi.useRealTimers();
    // Restore the suite default from tests/setup.ts (0), not the real app
    // delays, so a leak cannot reintroduce real timers if isolation is off.
    setRunPhaseDelaysOverride(0);
  });

  it("keeps the app's real delay when no override is set", () => {
    setRunPhaseDelaysOverride(null);
    expect(resolveRunPhaseDelay(260)).toBe(260);
    expect(resolveRunPhaseDelay(180)).toBe(180);
  });

  it("honors a test override", () => {
    setRunPhaseDelaysOverride(0);
    expect(resolveRunPhaseDelay(260)).toBe(0);
  });

  it("restores the real delay when the override is cleared", () => {
    setRunPhaseDelaysOverride(0);
    setRunPhaseDelaysOverride(null);
    expect(resolveRunPhaseDelay(260)).toBe(260);
  });

  it("resolves a zero override without scheduling a real timer", async () => {
    vi.useFakeTimers();
    setRunPhaseDelaysOverride(0);

    let settled = false;
    void runPhaseDelay(260).then(() => {
      settled = true;
    });

    // With fake timers active, a setTimeout-based delay would stay pending.
    await Promise.resolve();
    await Promise.resolve();
    expect(settled).toBe(true);
  });

  it("schedules the real delay when no override is set", async () => {
    vi.useFakeTimers();
    setRunPhaseDelaysOverride(null);

    let settled = false;
    void runPhaseDelay(260).then(() => {
      settled = true;
    });

    await Promise.resolve();
    expect(settled).toBe(false);

    await vi.advanceTimersByTimeAsync(260);
    expect(settled).toBe(true);
  });
});
