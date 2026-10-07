import { describe, expect, it } from "vitest";
import {
  NATIVE_DEFAULT_STARTUP_ALLOWANCE_MS,
  NATIVE_RUNTIME_STARTUP_ALLOWANCE_MS,
  nativeRunTimeoutMs,
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

describe("nativeRunTimeoutMs", () => {
  it("adds the startup allowance only while the runtime is cold", () => {
    // Cold: first run before the preload handshake completes.
    expect(nativeRunTimeoutMs(4000, "typescript", false)).toBe(4000 + NATIVE_RUNTIME_STARTUP_ALLOWANCE_MS);
    expect(nativeRunTimeoutMs(4000, "python", false)).toBe(4000 + NATIVE_RUNTIME_STARTUP_ALLOWANCE_MS);
  });

  it("drops the allowance once the runtime has warmed", () => {
    expect(nativeRunTimeoutMs(4000, "typescript", true)).toBe(4000);
    expect(nativeRunTimeoutMs(4000, "python", true)).toBe(4000);
    expect(nativeRunTimeoutMs(4000, "javascript", true)).toBe(4000);
  });

  it("uses the smaller default allowance for a cold language without a bundled asset", () => {
    expect(nativeRunTimeoutMs(4000, "javascript", false)).toBe(4000 + NATIVE_DEFAULT_STARTUP_ALLOWANCE_MS);
  });
});
