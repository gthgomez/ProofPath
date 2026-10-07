import { chmodSync, mkdirSync, mkdtempSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { ASSET_MODE, TYPESCRIPT_LIB_FILES, buildTypeScriptLibsSource, copyTypeScriptAssets } = require(
  "../scripts/copy-typescript-assets.js"
) as {
  ASSET_MODE: number;
  TYPESCRIPT_LIB_FILES: string[];
  buildTypeScriptLibsSource: (root: string) => string;
  copyTypeScriptAssets: (root: string) => void;
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
  const root = mkdtempSync(join(tmpdir(), "proofpath-typescript-assets-"));
  tempRoots.push(root);

  const libDir = join(root, "node_modules", "typescript", "lib");
  mkdirSync(libDir, { recursive: true });

  const compiler = join(libDir, "typescript.js");
  writeFileSync(compiler, "// fixture compiler");
  chmodSync(compiler, 0o755);

  for (const file of TYPESCRIPT_LIB_FILES) {
    const source = join(libDir, file);
    writeFileSync(source, `// fixture ${file}`);
    chmodSync(source, 0o755);
  }

  return root;
}

describe("copy-typescript-assets", () => {
  it("copies the compiler and generated libs into both output roots with mode 644", () => {
    const root = makeFixture();

    copyTypeScriptAssets(root);

    const outputRoots = [join(root, "public"), join(root, "android", "app", "src", "main", "assets")];
    const outputs = outputRoots.flatMap((outputRoot) => [
      join(outputRoot, "sandbox-assets", "typescript", "typescript.js"),
      join(outputRoot, "sandbox-assets", "typescript", "typescript-libs.js")
    ]);

    expect(outputs.length).toBeGreaterThan(0);
    for (const output of outputs) {
      expect(statSync(output).mode & 0o777).toBe(ASSET_MODE);
    }
  });

  it("builds a libs source that exposes exactly the expected library keys", () => {
    const root = makeFixture();
    const source = buildTypeScriptLibsSource(root);

    // The generated script must publish the map to the global the runner reads.
    expect(source).toContain("window.PROOFPATH_TYPESCRIPT_LIBS =");

    const json = source.slice(source.indexOf("=") + 1).trim().replace(/;$/, "");
    const parsed = JSON.parse(json) as Record<string, string>;

    expect(Object.keys(parsed)).toEqual([...TYPESCRIPT_LIB_FILES]);
    for (const file of TYPESCRIPT_LIB_FILES) {
      expect(parsed[file]).toBe(`// fixture ${file}`);
    }
  });
});
