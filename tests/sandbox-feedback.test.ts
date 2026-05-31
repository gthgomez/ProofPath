import { describe, expect, it } from "vitest";
import {
  classifySandboxError,
  formatPolicyViolationFeedback,
  formatSandboxFailureFeedback
} from "@/sandbox/feedback";

describe("sandbox feedback", () => {
  it("guides missing-output failures without revealing the expected answer", () => {
    const message = formatSandboxFailureFeedback({
      kind: "missing-output",
      language: "typescript",
      detail: "Output missing: secret-marker"
    });

    expect(message).toContain("Not yet");
    expect(message).toContain("where is the required value produced");
    expect(message).not.toContain("secret-marker");
  });

  it("keeps runtime errors as clues instead of direct answers", () => {
    const message = formatSandboxFailureFeedback({
      kind: "runtime",
      language: "javascript",
      detail: "ReferenceError: formatUser is not defined"
    });

    expect(message).toContain("which name, value, or line");
    expect(message).toContain("ReferenceError");
    expect(message).toContain("smallest change");
  });

  it("turns policy violations into a Socratic boundary explanation", () => {
    const message = formatPolicyViolationFeedback(
      {
        rule: "network-fetch",
        message: "Network calls are disabled in beginner sandboxes."
      },
      "python"
    );

    expect(message).toContain("outside the beginner lesson boundary");
    expect(message).toContain("What local sample data");
    expect(message).toContain("Network calls are disabled");
  });

  it("classifies common sandbox errors", () => {
    expect(classifySandboxError(new Error("Output missing"))).toBe("missing-output");
    expect(classifySandboxError(new Error("Sandbox timed out after 1000ms."))).toBe("timeout");
    expect(classifySandboxError(new Error("ReferenceError"))).toBe("runtime");
  });
});
