import { describe, expect, it } from "vitest";
import { getSandboxCapabilityLabel } from "@/sandbox/runner";

describe("getSandboxCapabilityLabel", () => {
  it("describes TypeScript as a real typecheck runtime, not transform-only", () => {
    const capability = getSandboxCapabilityLabel("typescript");

    expect(capability.label.toLowerCase()).toContain("typecheck");
    expect(capability.note.toLowerCase()).not.toContain("stripped at runtime");
    expect(capability.note.toLowerCase()).toContain("checked");
  });
});
