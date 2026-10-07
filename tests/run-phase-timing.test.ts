import { afterEach, describe, expect, it } from "vitest";
import { resolveRunPhaseDelay, setRunPhaseDelaysOverride } from "@/ui/run-phase-timing";

describe("run phase timing", () => {
  afterEach(() => {
    setRunPhaseDelaysOverride(null);
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
});
