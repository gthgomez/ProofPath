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
  }
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
