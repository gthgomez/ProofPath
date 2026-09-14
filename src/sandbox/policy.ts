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

const commonRules: PatternRule[] = [
  { rule: "network-fetch", pattern: /\bfetch\s*\(/i, message: "Network calls are disabled in beginner sandboxes." },
  { rule: "dynamic-import", pattern: /\bimport\s*\(/i, message: "Dynamic imports are disabled in beginner sandboxes." }
];

const javascriptRules: PatternRule[] = [
  { rule: "eval", pattern: /\beval\s*\(/i, message: "eval is disabled in the sandbox." },
  { rule: "function-constructor", pattern: /\bFunction\s*\(/, message: "The Function constructor is disabled in learner code." },
  { rule: "constructor-escape", pattern: /\.constructor\b|\["constructor"\]|\['constructor'\]/, message: "Constructor escape patterns are disabled." },
  { rule: "global-object", pattern: /\b(globalThis|window|document|process|require)\b/, message: "Global host objects are not available to learner code." },
  { rule: "browser-storage", pattern: /\b(localStorage|sessionStorage|indexedDB)\b/i, message: "Browser storage is disabled in beginner sandboxes." },
  { rule: "browser-network", pattern: /\b(XMLHttpRequest|WebSocket|EventSource|sendBeacon)\b/i, message: "Browser network APIs are disabled in beginner sandboxes." },
  { rule: "prototype-access", pattern: /\b(__proto__|prototype)\b/, message: "Prototype mutation/introspection is disabled." },
  { rule: "infinite-loop", pattern: /while\s*\(\s*true\s*\)|for\s*\(\s*;\s*;\s*\)/i, message: "Obvious infinite loops are blocked before execution." }
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

// Matches real Python network module usage after comments/strings are stripped:
// module names anywhere in an import list (e.g. `import os, socket`,
// `from http import client`) and attribute access (`requests.get`, `http.client`).
const PYTHON_NETWORK_PATTERN =
  /\b(?:import|from)\s+[^\n]*\b(?:socket|urllib|requests|http)\b|\b(?:socket|urllib|requests)\s*\.|\bhttp\.client\b/i;

const pythonRules: PatternRule[] = [
  { rule: "python-js-bridge", pattern: /^\s*(from\s+js\s+import|import\s+js\b)/im, message: "The Pyodide JavaScript bridge is disabled in beginner Python lessons." },
  { rule: "python-package-install", pattern: /\b(micropip|pyodide)\b/i, message: "Package installation/runtime control is disabled in beginner Python lessons." },
  { rule: "python-process", pattern: /\b(subprocess|os\.system|shutil|pathlib)\b/i, message: "Process and filesystem helpers are disabled in beginner Python lessons." },
  { rule: "python-network", pattern: PYTHON_NETWORK_PATTERN, message: "Python network modules are disabled in beginner sandboxes.", sanitize: stripPythonCommentsAndStrings },
  { rule: "python-dynamic-import", pattern: /\b(importlib|import_module)\b/, message: "Dynamic Python imports are disabled in learner submissions.", sanitize: stripPythonCommentsAndStrings },
  { rule: "python-dynamic-code", pattern: /\b(eval|exec|__import__)\s*\(/, message: "Dynamic Python execution is disabled in learner submissions." },
  { rule: "python-file-io", pattern: /\bopen\s*\(/, message: "File I/O is disabled; use the in-memory inputs provided by the lesson." },
  { rule: "python-infinite-loop", pattern: /while\s+True\s*:/, message: "Obvious infinite loops are blocked before execution." }
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
  { rule: "sql-mutation", pattern: /\b(DROP|DELETE|UPDATE|INSERT|ALTER|REPLACE|VACUUM|PRAGMA)\b/i, message: "Learner SQL sandboxes are read-only; write statements are disabled.", sanitize: stripSqlCommentsAndStrings }
];

function rulesForLanguage(language: LessonRunnerSpec["language"]): PatternRule[] {
  if (language === "python") {
    return [...commonRules, ...pythonRules];
  }

  if (language === "sql") {
    return [...sqlRules];
  }

  return [...commonRules, ...javascriptRules];
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
