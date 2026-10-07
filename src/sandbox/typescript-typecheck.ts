/**
 * Real TypeScript type checking for the lesson sandbox.
 *
 * The TypeScript track's lessons claim to verify types, so a type error must be
 * able to fail a check. `stripTypeScript` only erases annotations so the code can
 * run in `new Function`; it cannot catch `const x: number = "hello"`. This module
 * runs the actual compiler API over the single learner file and returns the
 * diagnostics it produces.
 *
 * The checker is intentionally scoped to one file plus a small standard library
 * (ES2015 + a `console` prelude). It is not a full project build: there are no
 * imports, no `node_modules`, and no cross-file type resolution. That keeps the
 * work small enough to run inside the 4s / 128MB lesson budget on device.
 *
 * The implementation lives in `TYPESCRIPT_TYPE_CHECK_SOURCE` as source text so
 * the web runner (`src/sandbox/runner.ts`) and the native WebView runner
 * (`src/sandbox/native-webview-runner.ts`) execute byte-for-byte the same logic
 * and cannot drift.
 */

export const TYPESCRIPT_LIB_FILES = [
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
] as const;

export interface TypeScriptDiagnostic {
  line: number;
  column: number;
  code: number;
  message: string;
}

export interface TypeScriptTypeCheckResult {
  diagnostics: TypeScriptDiagnostic[];
  stderr: string;
  learnerMessage: string;
}

export interface TypeScriptCompiler {
  ScriptTarget: { ES2020: number };
  createProgram: (...args: any[]) => any;
  createSourceFile: (...args: any[]) => any;
  getPreEmitDiagnostics: (program: any) => any[];
  flattenDiagnosticMessageText: (message: any, newLine: string) => string;
  sys?: {
    getExecutingFilePath?: () => string;
    readFile?: (path: string) => string | undefined;
  };
}

export const TYPESCRIPT_TYPE_CHECK_SOURCE = String.raw`
function proofPathFormatTypeCheckErrors(fileName, diagnostics) {
  var label = fileName.indexOf("/") === 0 ? fileName.slice(1) : fileName;
  return diagnostics.map(function (diagnostic) {
    return label + "(" + diagnostic.line + "," + diagnostic.column + "): error TS" +
      diagnostic.code + ": " + diagnostic.message;
  }).join("\n");
}

function proofPathFormatTypeCheckLearnerMessage(diagnostics) {
  var count = diagnostics.length;
  var lines = [
    "Not yet. TypeScript found " + count + (count === 1 ? " type error" : " type errors") +
      " before the checks could run."
  ];
  var shown = diagnostics.slice(0, 3);
  for (var index = 0; index < shown.length; index += 1) {
    lines.push("Line " + shown[index].line + ": " + shown[index].message + " (TS" + shown[index].code + ")");
  }
  if (count > shown.length) {
    lines.push("Plus " + (count - shown.length) + " more type error(s).");
  }
  lines.push("Fix the type mismatch, then run the check again.");
  return lines.join("\n");
}

function proofPathTypeCheck(ts, libFiles, fileName, code) {
  var files = {};
  for (var libName in libFiles) {
    if (Object.prototype.hasOwnProperty.call(libFiles, libName)) {
      files["/" + libName] = libFiles[libName];
    }
  }
  files[fileName] = code;
  var sandboxLibName = "/lib.proofpath-sandbox.d.ts";
  files[sandboxLibName] = "declare var console: { log(...data: any[]): void; error(...data: any[]): void; warn(...data: any[]): void; };";

  var options = {
    noEmit: true,
    skipLibCheck: true,
    strict: false,
    target: ts.ScriptTarget.ES2020
  };
  var host = {
    getSourceFile: function (name, languageVersion) {
      var content = files[name];
      return content === undefined ? undefined : ts.createSourceFile(name, content, languageVersion, true);
    },
    getDefaultLibFileName: function () { return "/lib.es2015.d.ts"; },
    writeFile: function () {},
    getCurrentDirectory: function () { return "/"; },
    getCanonicalFileName: function (name) { return name; },
    useCaseSensitiveFileNames: function () { return true; },
    getNewLine: function () { return "\n"; },
    fileExists: function (name) { return files[name] !== undefined; },
    readFile: function (name) { return files[name]; }
  };

  var program = ts.createProgram([fileName, sandboxLibName], options, host);
  var rawDiagnostics = ts.getPreEmitDiagnostics(program).filter(function (diagnostic) {
    return diagnostic.file && diagnostic.file.fileName === fileName;
  });
  var diagnostics = rawDiagnostics.map(function (diagnostic) {
    var position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
    return {
      line: position.line + 1,
      column: position.character + 1,
      code: diagnostic.code,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
    };
  });

  return {
    diagnostics: diagnostics,
    stderr: proofPathFormatTypeCheckErrors(fileName, diagnostics),
    learnerMessage: proofPathFormatTypeCheckLearnerMessage(diagnostics)
  };
}
`;

/**
 * Evaluates the shared type check source and runs it against a single learner
 * file. `libFiles` maps library base names (for example `lib.es5.d.ts`) to their
 * contents; the browser reads them from the bundled `typescript-libs.js` asset
 * while Node reads them from the compiler's own `sys`.
 */
export function evaluateTypeScriptTypeCheck(
  ts: TypeScriptCompiler,
  libFiles: Record<string, string>,
  fileName: string,
  code: string
): TypeScriptTypeCheckResult {
  const run = new Function(
    "ts",
    "libFiles",
    "fileName",
    "code",
    `${TYPESCRIPT_TYPE_CHECK_SOURCE}\nreturn proofPathTypeCheck(ts, libFiles, fileName, code);`
  ) as (
    ts: TypeScriptCompiler,
    libFiles: Record<string, string>,
    fileName: string,
    code: string
  ) => TypeScriptTypeCheckResult;

  return run(ts, libFiles, fileName, code);
}

/**
 * Loads the bundled-feeling standard library from the compiler's own filesystem.
 * Used by the Node/web runtime and by tests; the on-device WebView loads the
 * generated `typescript-libs.js` asset instead because its compiler has no `sys`.
 */
export function loadTypeScriptLibFiles(ts: TypeScriptCompiler): Record<string, string> {
  const sys = ts.sys;
  if (!sys || typeof sys.readFile !== "function" || typeof sys.getExecutingFilePath !== "function") {
    throw new Error("TypeScript compiler did not expose a filesystem for its library files.");
  }

  const executingPath = sys.getExecutingFilePath();
  const separator = executingPath.includes("\\") ? "\\" : "/";
  const lastSeparator = executingPath.lastIndexOf(separator);
  // `getExecutingFilePath()` points at `.../typescript/lib/typescript.js`, so the
  // library directory is its dirname (not dirname + "/lib").
  const libDir = executingPath.slice(0, lastSeparator);
  const libFiles: Record<string, string> = {};

  for (const name of TYPESCRIPT_LIB_FILES) {
    const content = sys.readFile(`${libDir}${separator}${name}`);
    if (typeof content !== "string") {
      throw new Error(`Missing TypeScript library file: ${name}`);
    }
    libFiles[name] = content;
  }

  return libFiles;
}
