const fs = require("node:fs");
const path = require("node:path");

const ASSET_MODE = 0o644;

// Static asset manifest: where each file ships from in node_modules and where
// it must be copied under every output root. Exported so the regression test can
// create a hermetic fixture instead of depending on the real node_modules.
const ASSET_TARGETS = [
  {
    packageDir: ["pyodide"],
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
    packageDir: ["sql.js", "dist"],
    relativeDir: path.join("sandbox-assets", "sql.js"),
    files: [
      "sql-wasm.js",
      "sql-wasm.wasm",
      "worker.sql-wasm.js"
    ]
  }
];

function copySandboxAssets(root) {
  const outputRoots = [
    path.join(root, "public"),
    path.join(root, "android", "app", "src", "main", "assets")
  ];

  for (const target of ASSET_TARGETS) {
    const fromDir = path.join(root, "node_modules", ...target.packageDir);

    for (const outputRoot of outputRoots) {
      const toDir = path.join(outputRoot, target.relativeDir);
      fs.mkdirSync(toDir, { recursive: true });

      for (const file of target.files) {
        const source = path.join(fromDir, file);
        const destination = path.join(toDir, file);

        if (!fs.existsSync(source)) {
          throw new Error(`Missing sandbox asset: ${source}`);
        }

        // Harden against a pre-placed symlink at the destination: remove it
        // first so the copy and the chmod below cannot follow the link out of
        // the output tree. Absent destinations are a no-op (ENOENT), and normal
        // files are left untouched.
        try {
          if (fs.lstatSync(destination).isSymbolicLink()) {
            fs.unlinkSync(destination);
          }
        } catch (error) {
          if (error.code !== "ENOENT") {
            throw error;
          }
        }

        fs.copyFileSync(source, destination);
        // fs.copyFileSync preserves the source file mode, and the upstream
        // node_modules assets are often 755. Force the committed 644 mode so
        // the copied output matches the index and `git status` stays clean in a
        // fresh checkout. WASM/JS assets need no executable bit.
        fs.chmodSync(destination, ASSET_MODE);
        console.log(`copied ${path.relative(root, destination)}`);
      }
    }
  }
}

if (require.main === module) {
  copySandboxAssets(path.resolve(__dirname, ".."));
}

module.exports = { ASSET_MODE, ASSET_TARGETS, copySandboxAssets };
