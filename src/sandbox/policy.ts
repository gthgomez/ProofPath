import type { LessonRunnerSpec } from "@/domain/types";

export interface SandboxPolicyViolation {
  rule: string;
  message: string;
}

interface PatternRule {
  rule: string;
  pattern: RegExp;
  message: string;
  /**
   * Optional pre-processing applied to the submission before `pattern` runs.
   * Used to ignore keywords that appear in comments or string literals.
   */
  sanitize?: (code: string) => string;
}

const MAX_CODE_LENGTH = 20000;

/**
 * Removes JavaScript comments and string/template literals so policy rules match
 * executable code rather than words inside line/block comments or string data.
 * Newlines are preserved so future line-oriented rules keep their meaning.
 * Handles single-, double-, and backtick-quoted strings with backslash escapes.
 * Template literal interpolations (`${...}`) are executable, so they are kept
 * and recursively sanitized; a blocked name inside `${}` is still matched,
 * which avoids turning the sanitizer itself into an evasion path.
 */
function stripJsCommentsAndStrings(code: string): string {
  let sanitized = "";
  let index = 0;

  const blankChar = (char: string): string => (char === "\n" ? "\n" : " ");

  // Whether a `/` here would start a regex literal rather than division. A
  // regex can follow only after operators/punctuation that cannot end an
  // expression (or a regex-preceding keyword); after a value (identifier,
  // literal, `)`, `]`, `}`) a slash is division. Tracking this keeps the
  // sanitizer from blanking executable code when it misreads a slash.
  let regexAllowed = true;

  const REGEX_PRECEDING_KEYWORDS = new Set([
    "return", "typeof", "instanceof", "in", "of", "new", "delete", "void",
    "case", "do", "else", "yield", "await", "throw"
  ]);

  const noteCodeChar = (char: string): void => {
    if (/\s/.test(char)) return;
    if (/[A-Za-z0-9_$]/.test(char)) {
      const wordMatch = /([A-Za-z_$][A-Za-z0-9_$]*)$/.exec(sanitized);
      regexAllowed = wordMatch ? REGEX_PRECEDING_KEYWORDS.has(wordMatch[1]) : false;
      return;
    }
    regexAllowed = "([{,;:?=!&|^~<>".includes(char);
  };

  const scan = (insideInterpolation: boolean): void => {
    let braceDepth = 0;

    while (index < code.length) {
      const char = code[index];
      const next = code[index + 1];

      if (insideInterpolation && char === "{") {
        braceDepth += 1;
        sanitized += char;
        index += 1;
        regexAllowed = true;
        continue;
      }

      if (insideInterpolation && char === "}") {
        if (braceDepth === 0) {
          sanitized += char;
          index += 1;
          regexAllowed = false;
          return;
        }
        braceDepth -= 1;
        sanitized += char;
        index += 1;
        regexAllowed = false;
        continue;
      }

      if (char === "/" && next === "/") {
        while (index < code.length && code[index] !== "\n") {
          sanitized += " ";
          index += 1;
        }
        continue;
      }

      if (char === "/" && next === "*") {
        sanitized += "  ";
        index += 2;
        while (index < code.length && !(code[index] === "*" && code[index + 1] === "/")) {
          sanitized += blankChar(code[index]);
          index += 1;
        }
        if (index < code.length) {
          sanitized += "  ";
          index += 2;
        }
        continue;
      }

      if (char === "/" && regexAllowed) {
        // Regex literal (or a misdetected division): blank it as a unit so a
        // `//` or a keyword inside can never be mistaken for a comment/code.
        sanitized += " ";
        index += 1;
        let inClass = false;
        while (index < code.length) {
          const regexChar = code[index];
          if (regexChar === "\\" && index + 1 < code.length) {
            sanitized += blankChar(regexChar) + blankChar(code[index + 1]);
            index += 2;
            continue;
          }
          if (regexChar === "\n") {
            break;
          }
          if (regexChar === "[") {
            inClass = true;
          } else if (regexChar === "]") {
            inClass = false;
          } else if (regexChar === "/" && !inClass) {
            sanitized += " ";
            index += 1;
            break;
          }
          sanitized += blankChar(regexChar);
          index += 1;
        }
        while (index < code.length && /[a-z]/i.test(code[index])) {
          sanitized += " ";
          index += 1;
        }
        regexAllowed = false;
        continue;
      }

      if (char === "'" || char === '"') {
        sanitized += " ";
        index += 1;
        while (index < code.length) {
          if (code[index] === "\\" && index + 1 < code.length) {
            sanitized += blankChar(code[index]) + blankChar(code[index + 1]);
            index += 2;
            continue;
          }
          if (code[index] === char) {
            sanitized += " ";
            index += 1;
            break;
          }
          if (code[index] === "\n") {
            // Unterminated single-line string; keep the newline so the rest of
            // the file remains analyzable.
            sanitized += "\n";
            index += 1;
            break;
          }
          sanitized += blankChar(code[index]);
          index += 1;
        }
        regexAllowed = false;
        continue;
      }

      if (char === "`") {
        sanitized += " ";
        index += 1;
        while (index < code.length) {
          if (code[index] === "\\" && index + 1 < code.length) {
            sanitized += blankChar(code[index]) + blankChar(code[index + 1]);
            index += 2;
            continue;
          }
          if (code[index] === "`") {
            sanitized += " ";
            index += 1;
            break;
          }
          if (code[index] === "$" && code[index + 1] === "{") {
            sanitized += "${";
            index += 2;
            regexAllowed = true;
            scan(true);
            continue;
          }
          sanitized += blankChar(code[index]);
          index += 1;
        }
        regexAllowed = false;
        continue;
      }

      sanitized += char;
      index += 1;
      noteCodeChar(char);
    }
  };

  scan(false);
  return sanitized;
}

const javascriptRules: PatternRule[] = [
  { rule: "network-fetch", pattern: /\bfetch\b/i, message: "Network calls are disabled in beginner sandboxes.", sanitize: stripJsCommentsAndStrings },
  { rule: "dynamic-import", pattern: /\bimport\s*\(/i, message: "Dynamic imports are disabled in beginner sandboxes.", sanitize: stripJsCommentsAndStrings },
  { rule: "eval", pattern: /\beval\b/i, message: "eval is disabled in the sandbox.", sanitize: stripJsCommentsAndStrings },
  { rule: "function-constructor", pattern: /\bFunction\b/, message: "The Function constructor is disabled in learner code.", sanitize: stripJsCommentsAndStrings },
  // Constructor escape is matched on the raw source: the bracket form encodes the
  // property name as a string literal, which the sanitizer would otherwise blank.
  { rule: "constructor-escape", pattern: /\.constructor\b|\["constructor"\]|\['constructor'\]/, message: "Constructor escape patterns are disabled." },
  { rule: "global-object", pattern: /\b(globalThis|self|window|document|process|require)\b/, message: "Global host objects are not available to learner code.", sanitize: stripJsCommentsAndStrings },
  { rule: "browser-storage", pattern: /\b(localStorage|sessionStorage|indexedDB)\b/i, message: "Browser storage is disabled in beginner sandboxes.", sanitize: stripJsCommentsAndStrings },
  { rule: "browser-network", pattern: /\b(XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/i, message: "Browser network APIs are disabled in beginner sandboxes.", sanitize: stripJsCommentsAndStrings },
  { rule: "prototype-access", pattern: /\b(__proto__|prototype)\b/, message: "Prototype mutation/introspection is disabled.", sanitize: stripJsCommentsAndStrings },
  { rule: "infinite-loop", pattern: /while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)/i, message: "Obvious infinite loops are blocked before execution.", sanitize: stripJsCommentsAndStrings }
];

/**
 * Removes Python comments and string literals so policy rules match executable
 * code rather than words inside `#` comments or string data. Newlines are
 * preserved so line-oriented rules keep their meaning. Handles single- and
 * double-quoted strings (including backslash escapes) and triple-quoted
 * strings; a `#` inside a string is not treated as a comment and a quote inside
 * a comment is not treated as a string delimiter. A bare package name inside a
 * string/list (e.g. 'requests==2.31.0') is therefore ignored, which avoids
 * false positives on requirements files.
 */
function stripPythonCommentsAndStrings(code: string): string {
  let sanitized = "";
  let index = 0;

  const blankChar = (char: string): string => (char === "\n" ? "\n" : " ");

  while (index < code.length) {
    const char = code[index];

    if (char === "#") {
      while (index < code.length && code[index] !== "\n") {
        sanitized += " ";
        index += 1;
      }
      continue;
    }

    if (char === '"' || char === "'") {
      const quote = char;
      const tripled = code[index + 1] === quote && code[index + 2] === quote;

      if (tripled) {
        sanitized += "   ";
        index += 3;
        while (index < code.length) {
          if (code[index] === "\\" && index + 1 < code.length) {
            sanitized += blankChar(code[index]) + blankChar(code[index + 1]);
            index += 2;
            continue;
          }
          if (code[index] === quote && code[index + 1] === quote && code[index + 2] === quote) {
            sanitized += "   ";
            index += 3;
            break;
          }
          sanitized += blankChar(code[index]);
          index += 1;
        }
        continue;
      }

      sanitized += " ";
      index += 1;
      while (index < code.length) {
        if (code[index] === "\\" && index + 1 < code.length) {
          sanitized += blankChar(code[index]) + blankChar(code[index + 1]);
          index += 2;
          continue;
        }
        if (code[index] === quote) {
          sanitized += " ";
          index += 1;
          break;
        }
        if (code[index] === "\n") {
          // Unterminated single-line string; preserve the newline so following
          // lines remain analyzable.
          sanitized += "\n";
          index += 1;
          break;
        }
        sanitized += " ";
        index += 1;
      }
      continue;
    }

    sanitized += char;
    index += 1;
  }

  return sanitized;
}

/**
 * Collapses Python explicit line continuations (`\` at the end of a physical
 * line) into spaces so a statement split across lines is matched as one logical
 * line. This must run after comments/strings are stripped, where a trailing
 * backslash can only be a continuation, otherwise `import \<newline>socket`
 * would slip past the line-oriented network rule (which the old bare-keyword
 * pattern caught) and also defeats reflective imports via string operands.
 */
function collapsePythonLineContinuations(code: string): string {
  return code.replace(/\\\r?\n/g, "  ");
}

/**
 * Python-rule pre-processing: strip comments/strings, then join explicit line
 * continuations. Every Python rule uses this so a keyword hidden in a comment
 * or string is ignored, and a blocked keyword cannot be split across lines.
 */
function sanitizePythonCode(code: string): string {
  return collapsePythonLineContinuations(stripPythonCommentsAndStrings(code));
}

// Matches real Python network module usage after comments/strings are stripped:
// module names anywhere in an import list (e.g. `import os, socket`,
// `from http import client`) and attribute access (`requests.get`, `http.client`).
const PYTHON_NETWORK_PATTERN =
  /\b(?:import|from)\s+[^\n]*\b(?:socket|urllib|requests|http)\b|\b(?:socket|urllib|requests)\s*\.|\bhttp\.client\b/i;

const pythonRules: PatternRule[] = [
  { rule: "python-js-bridge", pattern: /^\s*(from\s+js\s+import|import\s+js\b)/im, message: "The Pyodide JavaScript bridge is disabled in beginner Python lessons.", sanitize: sanitizePythonCode },
  { rule: "python-package-install", pattern: /\b(micropip|pyodide)\b/i, message: "Package installation/runtime control is disabled in beginner Python lessons.", sanitize: sanitizePythonCode },
  { rule: "python-process", pattern: /\b(subprocess|os\.system|shutil|pathlib)\b/i, message: "Process and filesystem helpers are disabled in beginner Python lessons.", sanitize: sanitizePythonCode },
  { rule: "python-network", pattern: PYTHON_NETWORK_PATTERN, message: "Python network modules are disabled in beginner sandboxes.", sanitize: sanitizePythonCode },
  { rule: "python-dynamic-import", pattern: /\b(importlib|import_module)\b/, message: "Dynamic Python imports are disabled in learner submissions.", sanitize: sanitizePythonCode },
  // Bare names (not just `name(`) so rebinding first — `e = eval; e(...)` — is
  // still caught. Sanitized so a keyword inside a comment/string is ignored.
  { rule: "python-dynamic-code", pattern: /\b(eval|exec|compile|__import__)\b/, message: "Dynamic Python execution is disabled in learner submissions.", sanitize: sanitizePythonCode },
  // Reflective access to the import machinery (`getattr(builtins, '__import__')`,
  // `vars(builtins)['__import__']`) that the sanitized network rule can no longer
  // see because the module name lives inside a string literal.
  { rule: "python-builtins-access", pattern: /\b(builtins|__builtins__)\b/, message: "Reflective access to Python builtins is disabled in learner submissions.", sanitize: sanitizePythonCode },
  { rule: "python-file-io", pattern: /\bopen\s*\(/, message: "File I/O is disabled; use the in-memory inputs provided by the lesson.", sanitize: sanitizePythonCode },
  { rule: "python-infinite-loop", pattern: /while\s+True\s*:/, message: "Obvious infinite loops are blocked before execution.", sanitize: sanitizePythonCode }
];

/**
 * Faithful SQL tokenizer that blanks comments and all quoted regions so keyword
 * rules match executable statements rather than words inside comments or quoted
 * data. It understands line comments, block comments, single-quoted strings
 * (`''` escapes), double-quoted identifiers (`""` escapes), backtick
 * identifiers (doubled backtick escapes), and `[...]` identifiers (which SQLite
 * closes at the first `]`).
 * Because each quoted region is consumed as a unit, a single quote inside a
 * double-quoted/backtick/bracketed identifier cannot swallow a following
 * statement. Real statements keep their keywords outside those regions, so
 * `UPDATE t SET x = 'DROP'` is still blocked while `SELECT 'DROP'` and
 * `SELECT "DROP"` are not.
 */
function stripSqlCommentsAndStrings(code: string): string {
  let sanitized = "";
  let index = 0;

  const blankChar = (char: string): string => (char === "\n" ? "\n" : " ");

  const blankComment = (): void => {
    // Already positioned after the opening delimiter; consume to the closer (or EOF).
    while (index < code.length) {
      if (code[index] === "*" && code[index + 1] === "/") {
        sanitized += "  ";
        index += 2;
        return;
      }
      sanitized += blankChar(code[index]);
      index += 1;
    }
  };

  const blankQuoted = (quote: string, escapeDoubled: boolean): void => {
    while (index < code.length) {
      if (code[index] === quote) {
        if (escapeDoubled && code[index + 1] === quote) {
          sanitized += "  ";
          index += 2;
          continue;
        }
        sanitized += " ";
        index += 1;
        return;
      }
      sanitized += blankChar(code[index]);
      index += 1;
    }
  };

  while (index < code.length) {
    const char = code[index];
    const next = code[index + 1];

    if (char === "-" && next === "-") {
      sanitized += "  ";
      index += 2;
      while (index < code.length && code[index] !== "\n") {
        sanitized += " ";
        index += 1;
      }
      continue;
    }

    if (char === "/" && next === "*") {
      sanitized += "  ";
      index += 2;
      blankComment();
      continue;
    }

    if (char === "'") {
      sanitized += " ";
      index += 1;
      blankQuoted("'", true);
      continue;
    }

    if (char === '"') {
      sanitized += " ";
      index += 1;
      blankQuoted('"', true);
      continue;
    }

    if (char === "`") {
      sanitized += " ";
      index += 1;
      blankQuoted("`", true);
      continue;
    }

    if (char === "[") {
      // SQLite closes a bracket identifier at the first `]` (unlike `""`/`` `` ``,
      // `]]` is not an escape), so match that exactly to avoid swallowing a
      // following statement that SQLite would still execute.
      sanitized += " ";
      index += 1;
      blankQuoted("]", false);
      continue;
    }

    sanitized += char;
    index += 1;
  }

  return sanitized;
}

const sqlRules: PatternRule[] = [
  { rule: "sql-attach", pattern: /\b(ATTACH|DETACH)\b/i, message: "Attaching external databases is disabled.", sanitize: stripSqlCommentsAndStrings },
  { rule: "sql-extension", pattern: /\b(load_extension|CREATE\s+VIRTUAL\s+TABLE)\b/i, message: "SQLite extensions and virtual tables are disabled.", sanitize: stripSqlCommentsAndStrings },
  { rule: "sql-mutation", pattern: /\b(DROP|DELETE|UPDATE|INSERT|ALTER|REPLACE\s+INTO|VACUUM|PRAGMA|REINDEX|ANALYZE)\b/i, message: "Data-modifying and destructive statements are disabled in learner SQL.", sanitize: stripSqlCommentsAndStrings }
];

function rulesForLanguage(language: LessonRunnerSpec["language"]): PatternRule[] {
  if (language === "python") {
    return [...pythonRules];
  }

  if (language === "sql") {
    return [...sqlRules];
  }

  return [...javascriptRules];
}

export function validateSandboxSubmission(spec: LessonRunnerSpec, code: string): SandboxPolicyViolation[] {
  const violations: SandboxPolicyViolation[] = [];

  if (code.length > MAX_CODE_LENGTH) {
    violations.push({
      rule: "max-code-length",
      message: `Code is too large for this beginner sandbox. Limit is ${MAX_CODE_LENGTH} characters.`
    });
  }

  for (const rule of rulesForLanguage(spec.language)) {
    const subject = rule.sanitize ? rule.sanitize(code) : code;
    if (rule.pattern.test(subject)) {
      violations.push({
        rule: rule.rule,
        message: rule.message
      });
    }
  }

  return violations;
}
