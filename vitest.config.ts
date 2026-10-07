import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // The app's tsconfig sets `"jsx": "react-native"` (classic runtime), which
  // the oxc transformer cannot parse. Journey tests render React 19 components,
  // so use the automatic JSX runtime instead.
  oxc: {
    jsx: {
      runtime: "automatic"
    }
  },
  resolve: {
    alias: {
      // UI components import "react-native"; the web target renders through
      // react-native-web, which is what jsdom-based journey tests need.
      "react-native": resolve(rootDir, "node_modules/react-native-web"),
      // The native provider delegates to expo-sqlite, which cannot load in
      // jsdom. The web provider is the localStorage-backed implementation.
      // (String alias matches the import specifier exactly, never the
      // ".web.tsx" variant or longer paths.)
      "@/state/progress-provider": resolve(rootDir, "src/state/progress-provider.web.tsx"),
      "@": resolve(rootDir, "src")
    }
  },
  test: {
    // Default stays "node" for the existing domain/content suites. Journey
    // tests opt into jsdom with a `// @vitest-environment jsdom` docblock.
    environment: "node",
    // Journey tests render the full lesson stepper; the 5s default is tight on
    // a cold, loaded CI box. The Code Lab's wall-clock phase delays are disabled
    // in tests (tests/setup.ts), so this budget covers real render/work time
    // only, not animation. Kept close to the default rather than masking slow,
    // genuinely-hung runs.
    testTimeout: 15000,
    setupFiles: [
      resolve(rootDir, "tests/setup.ts")
    ],
    include: [
      "tests/**/*.test.{ts,tsx}"
    ]
  }
});
