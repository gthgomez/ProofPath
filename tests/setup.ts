import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Vitest runs with globals disabled, so testing-library's auto-cleanup never
// registers. Clean the DOM after every test so renders do not leak across
// tests in the same file.
afterEach(() => {
  cleanup();
});
