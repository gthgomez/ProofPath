import { chmodSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { ASSET_MODE, ASSET_TARGETS, copySandboxAssets } = require("../scripts/copy-sandbox-assets.js") as {
  ASSET_MODE: number;
  ASSET_TARGETS: Array<{ packageDir: string[]; relativeDir: string; files: string[] }>;
  copySandboxAssets: (root: string) => void;
};

const tempRoots: string[] = [];

afterEach(() => {
  for (const dir of tempRoots.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

// Build a hermetic fixture with executable (0755) sources so the test fails
// whenever the copy step stops normalizing permissions.
function makeFixture(): string {
  const root = mkdtempSync(join(tmpdir(), "proofpath-sandbox-assets-"));
  tempRoots.push(root);

  for (const target of ASSET_TARGETS) {
    const fromDir = join(root, "node_modules", ...target.packageDir);
    mkdirSync(fromDir, { recursive: true });

    for (const file of target.files) {
      const source = join(fromDir, file);
      writeFileSync(source, "// fixture asset");
      chmodSync(source, 0o755);
    }
  }

  return root;
}

describe("copy-sandbox-assets", () => {
  it("copies every asset into both output roots with mode 644", () => {
    const root = makeFixture();

    copySandboxAssets(root);

    const outputRoots = [join(root, "public"), join(root, "android", "app", "src", "main", "assets")];
    const outputs = outputRoots.flatMap((outputRoot) =>
      ASSET_TARGETS.flatMap((target) =>
        target.files.map((file) => join(outputRoot, target.relativeDir, file))
      )
    );

    expect(outputs.length).toBeGreaterThan(0);
    for (const output of outputs) {
      expect(statSync(output).mode & 0o777).toBe(ASSET_MODE);
    }
  });
});
