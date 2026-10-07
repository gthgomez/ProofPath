const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const assetTargets = [
  {
    fromDir: path.join(root, "node_modules", "pyodide"),
    relativeDir: path.join("sandbox-assets", "pyodide"),
    files: [
      "pyodide.js",
      "pyodide.asm.js",
      "pyodide.asm.wasm",
      "python_stdlib.zip",
      "pyodide-lock.json"
    ]
  },
  {
    fromDir: path.join(root, "node_modules", "sql.js", "dist"),
    relativeDir: path.join("sandbox-assets", "sql.js"),
    files: [
      "sql-wasm.js",
      "sql-wasm.wasm",
      "worker.sql-wasm.js"
    ]
  },
  {
    fromDir: path.join(root, "node_modules", "typescript", "lib"),
    relativeDir: path.join("sandbox-assets", "typescript"),
    files: [
      "typescript.js"
    ]
  }
];

// The WebView cannot `fetch` individual `lib.*.d.ts` files from `file://`, so the
// TypeScript standard library is emitted as one script that assigns a name ->
// source map to a global. `proofPathTypeCheck` in src/sandbox/typescript-typecheck.ts
// reads that map (the web runtime builds the same map from the compiler's sys).
const typescriptLibFiles = [
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

const outputRoots = [
  path.join(root, "public"),
  path.join(root, "android", "app", "src", "main", "assets")
];

for (const target of assetTargets) {
  for (const outputRoot of outputRoots) {
    const toDir = path.join(outputRoot, target.relativeDir);
    fs.mkdirSync(toDir, { recursive: true });

    for (const file of target.files) {
      const source = path.join(target.fromDir, file);
      const destination = path.join(toDir, file);

      if (!fs.existsSync(source)) {
        throw new Error(`Missing sandbox asset: ${source}`);
      }

      fs.copyFileSync(source, destination);
      console.log(`copied ${path.relative(root, destination)}`);
    }
  }
}

for (const outputRoot of outputRoots) {
  const toDir = path.join(outputRoot, "sandbox-assets", "typescript");
  const libSources = {};

  for (const file of typescriptLibFiles) {
    const source = path.join(root, "node_modules", "typescript", "lib", file);
    if (!fs.existsSync(source)) {
      throw new Error(`Missing sandbox asset: ${source}`);
    }
    libSources[file] = fs.readFileSync(source, "utf8");
  }

  const destination = path.join(toDir, "typescript-libs.js");
  fs.writeFileSync(destination, `window.PROOFPATH_TYPESCRIPT_LIBS = ${JSON.stringify(libSources)};\n`);
  console.log(`generated ${path.relative(root, destination)}`);
}
