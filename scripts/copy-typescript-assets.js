const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

// Copied assets are normalized to a fixed, non-executable mode so a source file
// that happens to be executable cannot carry that bit into the bundle.
const ASSET_MODE = 0o644;

// The WebView cannot `fetch` individual `lib.*.d.ts` files from `file://`, so the
// TypeScript standard library is emitted as one script that assigns a name ->
// source map to a global. `proofPathTypeCheck` in src/sandbox/typescript-typecheck.ts
// reads that map (the web runtime builds the same map from the compiler's sys).
const TYPESCRIPT_LIB_FILES = [
  "lib.es5.d.ts",
  "lib.decorators.d.ts",
  "lib.decorators.legacy.d.ts",
  "lib.es2015.d.ts",
  "lib.es2015.core.d.ts",
  "lib.es2015.collection.d.ts",
  "lib.es2015.iterable.d.ts",
  "lib.es2015.generator.d.ts",
  "lib.es2015.promise.d.ts",
  "lib.es2015.proxy.d.ts",
  "lib.es2015.reflect.d.ts",
  "lib.es2015.symbol.d.ts",
  "lib.es2015.symbol.wellknown.d.ts"
];

function typescriptLibDir(rootDir) {
  return path.join(rootDir, "node_modules", "typescript", "lib");
}

function outputRoots(rootDir) {
  return [
    path.join(rootDir, "public"),
    path.join(rootDir, "android", "app", "src", "main", "assets")
  ];
}

/**
 * Builds the `typescript-libs.js` source that publishes the TypeScript standard
 * library to `window.PROOFPATH_TYPESCRIPT_LIBS`. Pure: it reads the library
 * files but writes nothing, so callers can build the source once and reuse it
 * across every output root.
 */
function buildTypeScriptLibsSource(rootDir) {
  const libDir = typescriptLibDir(rootDir);
  const libSources = {};

  for (const file of TYPESCRIPT_LIB_FILES) {
    const source = path.join(libDir, file);
    if (!fs.existsSync(source)) {
      throw new Error(`Missing sandbox asset: ${source}`);
    }
    libSources[file] = fs.readFileSync(source, "utf8");
  }

  return `window.PROOFPATH_TYPESCRIPT_LIBS = ${JSON.stringify(libSources)};\n`;
}

/**
 * Copies the TypeScript compiler bundle plus the generated standard-library
 * script into both `public/` and `android/`. The library files are read once
 * (into `libsSource`) rather than once per output root.
 */
function copyTypeScriptAssets(rootDir) {
  const compilerSource = path.join(typescriptLibDir(rootDir), "typescript.js");
  if (!fs.existsSync(compilerSource)) {
    throw new Error(`Missing sandbox asset: ${compilerSource}`);
  }

  const libsSource = buildTypeScriptLibsSource(rootDir);

  for (const outputRoot of outputRoots(rootDir)) {
    const toDir = path.join(outputRoot, "sandbox-assets", "typescript");
    fs.mkdirSync(toDir, { recursive: true });

    const compilerDestination = path.join(toDir, "typescript.js");
    fs.copyFileSync(compilerSource, compilerDestination);
    fs.chmodSync(compilerDestination, ASSET_MODE);
    console.log(`copied ${path.relative(rootDir, compilerDestination)}`);

    const libsDestination = path.join(toDir, "typescript-libs.js");
    fs.writeFileSync(libsDestination, libsSource);
    fs.chmodSync(libsDestination, ASSET_MODE);
    console.log(`generated ${path.relative(rootDir, libsDestination)}`);
  }
}

if (require.main === module) {
  copyTypeScriptAssets(root);
}

module.exports = {
  ASSET_MODE,
  TYPESCRIPT_LIB_FILES,
  buildTypeScriptLibsSource,
  copyTypeScriptAssets
};
