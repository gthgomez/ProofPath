import type { ProblemDiagnostic, RunnerLanguage } from "@/domain/types";
import type { SandboxPolicyViolation } from "@/sandbox/policy";

interface DiagnosticInput {
  language: RunnerLanguage;
  stderr?: string;
  errorMessage?: string;
  policyViolations?: SandboxPolicyViolation[];
  timedOut?: boolean;
  checkMessages?: string[];
}

export function buildProblemDiagnostics({
  language,
  stderr = "",
  errorMessage = "",
  policyViolations = [],
  timedOut = false,
  checkMessages = []
}: DiagnosticInput): ProblemDiagnostic[] {
  const diagnostics: ProblemDiagnostic[] = [];

  for (const violation of policyViolations) {
    diagnostics.push({
      id: `policy-${violation.rule}`,
      severity: "error",
      source: "policy",
      message: violation.message,
      beginnerExplanation: policyExplanation(violation.rule),
      rawDetail: violation.message,
      confidence: "unknown"
    });
  }

  if (timedOut) {
    diagnostics.push({
      id: "runtime-timeout",
      severity: "error",
      source: "runtime",
      message: "Execution timed out.",
      beginnerExplanation: "The program kept running longer than this lesson allows. Check for input prompts, infinite loops, or repeated work that never stops.",
      rawDetail: "Execution timed out.",
      confidence: "unknown"
    });
  }

  const combinedMessage = [stderr, errorMessage, ...checkMessages].filter(Boolean).join("\n");
  if (!combinedMessage) {
    return diagnostics;
  }

  if (language === "python") {
    diagnostics.push(...parsePythonDiagnostics(combinedMessage));
  } else if (language === "sql") {
    diagnostics.push(...parseSqlDiagnostics(combinedMessage));
  } else {
    diagnostics.push(...parseJavaScriptDiagnostics(combinedMessage, language));
  }

  return uniqueDiagnostics(diagnostics);
}

function parsePythonDiagnostics(message: string): ProblemDiagnostic[] {
  const diagnostics: ProblemDiagnostic[] = [];
  const lineMatch = /File\s+["']<string>["'],\s+line\s+(\d+)/i.exec(message) ?? /line\s+(\d+)/i.exec(message);
  const knownLine = lineMatch?.[1] ? Number(lineMatch[1]) : undefined;
  const location = knownLine && Number.isInteger(knownLine) && knownLine > 0
    ? { line: knownLine, confidence: "known" as const }
    : { confidence: "unknown" as const };

  if (/SyntaxError/i.test(message)) {
    diagnostics.push({
      id: "python-syntax-error",
      severity: "error",
      source: "parser",
      message: firstMatchingLine(message, /SyntaxError/i) ?? "SyntaxError",
      beginnerExplanation: "Python could not read the code shape. Check punctuation, quotes, parentheses, and indentation near the reported line.",
      rawDetail: message,
      ...location
    });
  }

  if (/IndentationError/i.test(message)) {
    diagnostics.push({
      id: "python-indentation-error",
      severity: "error",
      source: "parser",
      message: firstMatchingLine(message, /IndentationError/i) ?? "IndentationError",
      beginnerExplanation: "Python uses indentation to decide which lines belong together. Make sure related lines line up consistently.",
      rawDetail: message,
      ...location
    });
  }

  const nameMatch = /NameError:\s*([^\n]+)/i.exec(message);
  if (nameMatch) {
    diagnostics.push({
      id: "python-name-error",
      severity: "error",
      source: "runtime",
      message: `NameError: ${nameMatch[1]}`,
      beginnerExplanation: "Python looked for a name that does not exist yet. Check spelling and make sure the variable is assigned before it is used.",
      rawDetail: message,
      confidence: "unknown"
    });
  }

  const typeMatch = /TypeError:\s*([^\n]+)/i.exec(message);
  if (typeMatch) {
    diagnostics.push({
      id: "python-type-error",
      severity: "error",
      source: "runtime",
      message: `TypeError: ${typeMatch[1]}`,
      beginnerExplanation: "Python received a value of the wrong kind for this operation. Check whether you are mixing text, numbers, lists, or dictionaries.",
      rawDetail: message,
      ...location
    });
  }

  const unsupportedNativeMatch = /Unsupported Python feature in the native offline verifier at line\s+(\d+):\s*([^\n]+)/i.exec(message);
  if (unsupportedNativeMatch) {
    diagnostics.push({
      id: "python-native-unsupported-feature",
      severity: "error",
      source: "system",
      message: `Unsupported Python feature: ${unsupportedNativeMatch[2]}`,
      beginnerExplanation: "The offline native fallback is only for the early beginner subset. Use the lesson pattern here, or use the full Python runtime path for later Python features.",
      rawDetail: message,
      line: Number(unsupportedNativeMatch[1]),
      confidence: "known"
    });
  }

  if (/Output missing/i.test(message) || /Not yet\./i.test(message)) {
    diagnostics.push({
      id: "check-output-missing",
      severity: "warning",
      source: "check",
      message: "The checks did not find the expected output yet.",
      beginnerExplanation: "Compare your printed output with the expected lines. Look for unchanged starter values, missing print calls, or different spacing.",
      rawDetail: message,
      confidence: "unknown"
    });
  }

  return diagnostics;
}

function parseSqlDiagnostics(message: string): ProblemDiagnostic[] {
  if (!/SQL|sqlite|syntax|no such/i.test(message)) {
    return [];
  }

  if (/no such table/i.test(message)) {
    return [{
      id: "sql-no-such-table",
      severity: "error",
      source: "runtime",
      message: firstMatchingLine(message, /no such table/i) ?? firstNonEmptyLine(message),
      beginnerExplanation: "The query references a table that is not in the lesson database. Check the table name in the prompt or setup data.",
      rawDetail: message,
      confidence: "unknown"
    }];
  }

  if (/no such column/i.test(message)) {
    return [{
      id: "sql-no-such-column",
      severity: "error",
      source: "runtime",
      message: firstMatchingLine(message, /no such column/i) ?? firstNonEmptyLine(message),
      beginnerExplanation: "The query references a column that does not exist in that table. Check spelling and which table owns the column.",
      rawDetail: message,
      confidence: "unknown"
    }];
  }

  if (/syntax/i.test(message)) {
    return [{
      id: "sql-syntax-error",
      severity: "error",
      source: "parser",
      message: firstMatchingLine(message, /syntax/i) ?? firstNonEmptyLine(message),
      beginnerExplanation: "SQLite could not parse the query. Check clause order, commas, quotes, and whether the query ends cleanly.",
      rawDetail: message,
      confidence: "unknown"
    }];
  }

  return [{
    id: "sql-runtime-error",
    severity: "error",
    source: "runtime",
    message: firstNonEmptyLine(message),
    beginnerExplanation: "The SQL engine could not run the query. Check table names, column names, commas, and clause order.",
    rawDetail: message,
    confidence: "unknown"
  }];
}

function parseJavaScriptDiagnostics(message: string, language: RunnerLanguage): ProblemDiagnostic[] {
  const label = language === "typescript" ? "TypeScript" : "JavaScript";
  const diagnostics: ProblemDiagnostic[] = [];

  const lineMatch = /<anonymous>:(\d+)/i.exec(message) ?? /line (\d+)/i.exec(message);
  const knownLine = lineMatch?.[1] ? Number(lineMatch[1]) : undefined;
  const location = knownLine && Number.isInteger(knownLine) && knownLine > 0
    ? { line: knownLine, confidence: "known" as const }
    : { confidence: "unknown" as const };

  if (/SyntaxError/i.test(message)) {
    diagnostics.push({
      id: `${language}-syntax-error`,
      severity: "error",
      source: "parser",
      message: firstMatchingLine(message, /SyntaxError/i) ?? `${label} SyntaxError`,
      beginnerExplanation: `${label} could not parse the code. Check brackets, quotes, commas, and parentheses near the changed line.`,
      rawDetail: message,
      ...location
    });
  }

  if (/ReferenceError/i.test(message)) {
    diagnostics.push({
      id: `${language}-reference-error`,
      severity: "error",
      source: "runtime",
      message: firstMatchingLine(message, /ReferenceError/i) ?? `${label} ReferenceError`,
      beginnerExplanation: `${label} looked for a name that does not exist in the current code. Check spelling and declaration order.`,
      rawDetail: message,
      ...location
    });
  }

  if (/TypeError/i.test(message)) {
    diagnostics.push({
      id: `${language}-type-error`,
      severity: "error",
      source: "runtime",
      message: firstMatchingLine(message, /TypeError/i) ?? `${label} TypeError`,
      beginnerExplanation: `${label} tried to use a value in a way it does not support. Check the value shape before calling methods or reading fields.`,
      rawDetail: message,
      ...location
    });
  }

  return diagnostics;
}

function policyExplanation(rule: string): string {
  if (rule.includes("network")) {
    return "Professional sandboxes block live network calls so practice stays repeatable. Use local sample data for this lesson.";
  }

  if (rule.includes("sql-mutation")) {
    return "This SQL lab is read-only. Practice inspecting result rows before changing tables.";
  }

  if (rule.includes("infinite-loop")) {
    return "The lab stopped code that appears to run forever. Add a stopping condition before running again.";
  }

  if (rule.includes("file") || rule.includes("process")) {
    return "Beginner labs use provided in-memory data so the workflow stays safe and offline.";
  }

  return "The code used a feature outside this lesson boundary. Keep the attempt inside the local starter data and normal language features.";
}

function firstMatchingLine(message: string, pattern: RegExp): string | undefined {
  return message.split(/\r?\n/).find((line) => pattern.test(line.trim()))?.trim();
}

function firstNonEmptyLine(message: string): string {
  return message.split(/\r?\n/).find((line) => line.trim().length > 0)?.trim() ?? "Runtime error";
}

function uniqueDiagnostics(diagnostics: ProblemDiagnostic[]): ProblemDiagnostic[] {
  const seen = new Set<string>();
  return diagnostics.filter((diagnostic) => {
    const key = `${diagnostic.id}:${diagnostic.message}:${diagnostic.line ?? ""}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
