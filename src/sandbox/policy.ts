import type { LessonRunnerSpec } from "@/domain/types";

export interface SandboxPolicyViolation {
  rule: string;
  message: string;
}

interface PatternRule {
  rule: string;
  pattern: RegExp;
  message: string;
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

const pythonRules: PatternRule[] = [
  { rule: "python-js-bridge", pattern: /^\s*(from\s+js\s+import|import\s+js\b)/im, message: "The Pyodide JavaScript bridge is disabled in beginner Python lessons." },
  { rule: "python-package-install", pattern: /\b(micropip|pyodide)\b/i, message: "Package installation/runtime control is disabled in beginner Python lessons." },
  { rule: "python-process", pattern: /\b(subprocess|os\.system|shutil|pathlib)\b/i, message: "Process and filesystem helpers are disabled in beginner Python lessons." },
  { rule: "python-network", pattern: /\b(socket|urllib|requests|http\.client)\b/i, message: "Python network modules are disabled in beginner sandboxes." },
  { rule: "python-dynamic-code", pattern: /\b(eval|exec|__import__)\s*\(/, message: "Dynamic Python execution is disabled in learner submissions." },
  { rule: "python-file-io", pattern: /\bopen\s*\(/, message: "File I/O is disabled; use the in-memory inputs provided by the lesson." },
  { rule: "python-infinite-loop", pattern: /while\s+True\s*:/, message: "Obvious infinite loops are blocked before execution." }
];

const sqlRules: PatternRule[] = [
  { rule: "sql-attach", pattern: /\b(ATTACH|DETACH)\b/i, message: "Attaching external databases is disabled." },
  { rule: "sql-extension", pattern: /\b(load_extension|CREATE\s+VIRTUAL\s+TABLE)\b/i, message: "SQLite extensions and virtual tables are disabled." },
  { rule: "sql-mutation", pattern: /\b(DROP|DELETE|UPDATE|INSERT|ALTER|REPLACE|VACUUM|PRAGMA)\b/i, message: "Learner SQL sandboxes are read-only; write statements are disabled." }
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
    if (rule.pattern.test(code)) {
      violations.push({
        rule: rule.rule,
        message: rule.message
      });
    }
  }

  return violations;
}
