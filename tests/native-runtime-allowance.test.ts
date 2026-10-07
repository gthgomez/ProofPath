import { describe, expect, it } from "vitest";
import {
  NATIVE_DEFAULT_STARTUP_ALLOWANCE_MS,
  NATIVE_RUNTIME_STARTUP_ALLOWANCE_MS,
  nativeStartupAllowanceMs
} from "@/sandbox/native-webview-runner";

describe("nativeStartupAllowanceMs", () => {
  it("grants every bundled-asset runtime the full startup allowance", () => {
    expect(nativeStartupAllowanceMs("python")).toBe(NATIVE_RUNTIME_STARTUP_ALLOWANCE_MS);
    expect(nativeStartupAllowanceMs("sql")).toBe(NATIVE_RUNTIME_STARTUP_ALLOWANCE_MS);
    expect(nativeStartupAllowanceMs("typescript")).toBe(NATIVE_RUNTIME_STARTUP_ALLOWANCE_MS);
  });

  it("falls back to the default allowance for a runtime without a bundled asset", () => {
    expect(nativeStartupAllowanceMs("javascript")).toBe(NATIVE_DEFAULT_STARTUP_ALLOWANCE_MS);
    expect(nativeStartupAllowanceMs("javascript")).not.toBe(NATIVE_RUNTIME_STARTUP_ALLOWANCE_MS);
  });

  it("keeps the flat allowance values that back the native startup budget", () => {
    expect(NATIVE_RUNTIME_STARTUP_ALLOWANCE_MS).toBe(20000);
    expect(NATIVE_DEFAULT_STARTUP_ALLOWANCE_MS).toBe(250);
  });
});
