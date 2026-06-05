import {
  buildTerminalTranscript,
  codeRunCommand,
  emptyHiddenCheckSummary,
  normalizeCodeRunAttempt,
  redactCheckResults
} from "@/domain/code-run";
import type { CodeRunAttempt, CodeRunTestResult, LessonRunnerSpec, LessonRunnerTest } from "@/domain/types";
import { buildProblemDiagnostics } from "@/sandbox/diagnostics";

/**
 * --- LEARNER SANDBOX BOUNDARIES & DEFENSIVE GUARDRAILS ---
 *
 * PURPOSE:
 * This native Python runner is a lightweight, regex-based offline fallback mechanism.
 * It is NOT a full Python interpreter, nor is it a hardened, adversarial secure runtime.
 * It is a local practice runner and beginner proof verifier meant to process simple variable
 * assignments and assertion-style test blocks when offline.
 *
 * BEHAVIOR FOR UNSUPPORTED SYNTAX:
 * Any standard Python control flow (such as `if`, `for`, `def`, `while`, etc.) or complex statements
 * will fail to pass the regex parsing checks. Instead of throwing unhandled crashes or validation
 * exceptions, it catches these lines and returns a descriptive, user-friendly diagnostic failure
 * (e.g. "Unsupported Python feature in the native offline verifier").
 *
 * RUNTIME PREFERENCE:
 * Intermediate and advanced Python lessons requiring control flows, functions, or external library calls
 * MUST prefer a more capable runtime environment (like Pyodide/Webview) when available.
 */

type PythonValue = string | number | boolean | null;
type PythonScope = Record<string, PythonValue>;

function withPythonLine(error: unknown, lineNumber: number): Error {
  const message = error instanceof Error ? error.message : String(error || "Python runtime error");
  if (/^File\s+/i.test(message)) {
    return new Error(message);
  }

  if (/^(NameError|TypeError|SyntaxError|IndentationError):/i.test(message)) {
    return new Error(`File "<string>", line ${lineNumber}\n${message}`);
  }

  return new Error(`${message} at line ${lineNumber}.`);
}

function unsupportedLearnerLineError(line: string, lineNumber: number): Error {
  if (/^(for|if|elif|else|while|def|try|except|with|class)\b/.test(line)) {
    return new Error(`Unsupported Python feature in the native offline verifier at line ${lineNumber}: ${line}`);
  }

  return new Error(`File "<string>", line ${lineNumber}\nSyntaxError: invalid syntax`);
}

function isSupportedLearnerLine(line: string): boolean {
  return !line
    || line.startsWith("#")
    || /^print\(([\s\S]*)\)$/.test(line)
    || /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\s\S]+)$/.test(line);
}

function isSupportedVerifierLine(line: string): boolean {
  return !line
    || line.startsWith("assert isinstance(")
    || /^assert\s+.+?\s+in\s+.+/.test(line)
    || /^assert\s+.+?\s+is\s+(True|False|None)/.test(line)
    || /^assert\s+.+?\s*==\s*.+/.test(line)
    || /^print\(([\s\S]*)\)$/.test(line);
}

export function canRunNativePythonProof(spec: LessonRunnerSpec): boolean {
  const learnerLines = spec.starterCode.split(/\r?\n/).map((line) => line.trim());
  const verifierLines = [...spec.visibleTests, ...spec.hiddenTests].flatMap((test) => (
    test.code.split(/\r?\n/).map((line) => line.trim())
  ));

  return learnerLines.every(isSupportedLearnerLine) && verifierLines.every(isSupportedVerifierLine);
}

function normalizeOutput(value: PythonValue): string {
  if (value === null) {
    return "None";
  }

  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }

  return String(value);
}

function includesAll(output: string, needles: string[] = []): boolean {
  const normalizedOutput = output.toLowerCase();
  return needles.every((needle) => normalizedOutput.includes(needle.toLowerCase()));
}

function unquote(value: string): string {
  const quote = value[0];
  const body = value.slice(1, -1);

  return body
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(new RegExp(`\\\\${quote}`, "g"), quote)
    .replace(/\\\\/g, "\\");
}

function splitTopLevel(value: string, delimiter: string): string[] {
  const parts: string[] = [];
  let current = "";
  let quote: string | null = null;
  let depth = 0;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]!;
    const previous = value[index - 1];

    if (quote) {
      current += character;
      if (character === quote && previous !== "\\") {
        quote = null;
      }
      continue;
    }

    if (character === "'" || character === '"') {
      quote = character;
      current += character;
      continue;
    }

    if (character === "(" || character === "[" || character === "{") {
      depth += 1;
    } else if (character === ")" || character === "]" || character === "}") {
      depth -= 1;
    }

    if (character === delimiter && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  parts.push(current.trim());
  return parts;
}

function evaluateExpression(expression: string, scope: PythonScope): PythonValue {
  const value = expression.trim();

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    return unquote(value);
  }

  if ((value.startsWith('f"') && value.endsWith('"')) || (value.startsWith("f'") && value.endsWith("'"))) {
    const template = unquote(value.slice(1));
    return template.replace(/\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_match, name: string) => normalizeOutput(scope[name] ?? ""));
  }

  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }

  if (value === "True") {
    return true;
  }

  if (value === "False") {
    return false;
  }

  if (value === "None") {
    return null;
  }

  const strMatch = /^str\(([^)]+)\)$/.exec(value);
  if (strMatch) {
    return normalizeOutput(evaluateExpression(strMatch[1]!, scope));
  }

  const joinedByPlus = splitTopLevel(value, "+");
  if (joinedByPlus.length > 1) {
    const evaluated = joinedByPlus.map((part) => evaluateExpression(part, scope));
    if (evaluated.every((part) => typeof part === "number")) {
      return evaluated.reduce<number>((total, part) => total + Number(part), 0);
    }
    return evaluated.map(normalizeOutput).join("");
  }

  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(value)) {
    if (Object.prototype.hasOwnProperty.call(scope, value)) {
      return scope[value]!;
    }
    throw new Error(`NameError: ${value} is not defined.`);
  }

  throw new Error(`Unsupported Python expression in the native offline verifier: ${value}`);
}

function executeLearnerCode(code: string): { scope: PythonScope; stdout: string[]; stderr: string[] } {
  const scope: PythonScope = {};
  const stdout: string[] = [];
  const stderr: string[] = [];
  const lines = code.split(/\r?\n/);

  for (const [lineIndex, rawLine] of lines.entries()) {
    const lineNumber = lineIndex + 1;
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const printMatch = /^print\(([\s\S]*)\)$/.exec(line);
    if (printMatch) {
      try {
        stdout.push(normalizeOutput(evaluateExpression(printMatch[1]!, scope)));
      } catch (error) {
        throw withPythonLine(error, lineNumber);
      }
      continue;
    }

    const assignmentMatch = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*([\s\S]+)$/.exec(line);
    if (assignmentMatch) {
      try {
        scope[assignmentMatch[1]!] = evaluateExpression(assignmentMatch[2]!, scope);
      } catch (error) {
        throw withPythonLine(error, lineNumber);
      }
      continue;
    }

    throw unsupportedLearnerLineError(line, lineNumber);
  }

  return { scope, stdout, stderr };
}

function assertionMessage(line: string, fallback: string): string {
  const match = /,\s*(['"])([\s\S]*)\1\s*$/.exec(line);
  return match?.[2] ? unquote(`${match[1]}${match[2]}${match[1]}`) : fallback;
}

function evaluateAssertion(line: string, scope: PythonScope): void {
  const assertBody = line.replace(/^assert\s+/, "");

  const isinstanceMatch = /^isinstance\(([^,]+),\s*(str|int|bool)\)/.exec(assertBody);
  if (isinstanceMatch) {
    const actual = evaluateExpression(isinstanceMatch[1]!, scope);
    const expectedType = isinstanceMatch[2]!;
    const passed = expectedType === "str"
      ? typeof actual === "string"
      : expectedType === "int"
        ? typeof actual === "number" && Number.isInteger(actual)
        : typeof actual === "boolean";

    if (!passed) {
      throw new Error(assertionMessage(line, `${isinstanceMatch[1]} should be a ${expectedType}.`));
    }
    return;
  }

  const inMatch = /^(.+?)\s+in\s+(.+?)(?:,|$)/.exec(assertBody);
  if (inMatch) {
    const needle = normalizeOutput(evaluateExpression(inMatch[1]!, scope));
    const haystack = normalizeOutput(evaluateExpression(inMatch[2]!, scope));
    if (!haystack.includes(needle)) {
      throw new Error(assertionMessage(line, `${needle} was not found in ${inMatch[2]}.`));
    }
    return;
  }

  const isMatch = /^(.+?)\s+is\s+(True|False|None)(?:,|$)/.exec(assertBody);
  if (isMatch) {
    const actual = evaluateExpression(isMatch[1]!, scope);
    const expected = evaluateExpression(isMatch[2]!, scope);
    if (actual !== expected) {
      throw new Error(assertionMessage(line, `${isMatch[1]} should be ${isMatch[2]}.`));
    }
    return;
  }

  const equalsMatch = /^(.+?)\s*==\s*(.+?)(?:,|$)/.exec(assertBody);
  if (equalsMatch) {
    const actual = evaluateExpression(equalsMatch[1]!, scope);
    const expected = evaluateExpression(equalsMatch[2]!, scope);
    if (actual !== expected) {
      throw new Error(assertionMessage(line, `${equalsMatch[1]} should equal ${normalizeOutput(expected)}.`));
    }
    return;
  }

  throw new Error(`Unsupported verifier assertion in the native offline Python runner: ${line}`);
}

function runTest(test: LessonRunnerTest, visible: boolean, scope: PythonScope, stdout: string[]): CodeRunTestResult {
  const stdoutStart = stdout.length;

  try {
    for (const rawLine of test.code.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) {
        continue;
      }

      if (line.startsWith("assert ")) {
        evaluateAssertion(line, scope);
        continue;
      }

      const printMatch = /^print\(([\s\S]*)\)$/.exec(line);
      if (printMatch) {
        stdout.push(normalizeOutput(evaluateExpression(printMatch[1]!, scope)));
        continue;
      }

      throw new Error(`Unsupported verifier line in the native offline Python runner: ${line}`);
    }

    const output = stdout.slice(stdoutStart).join("\n");
    const completeOutput = stdout.join("\n");
    if (!includesAll(output, test.expectedOutputIncludes) && !includesAll(completeOutput, test.expectedOutputIncludes)) {
      throw new Error("Output missing");
    }

    return { id: test.id, name: test.name, passed: true, visible, message: "Passed" };
  } catch (error) {
    return {
      id: test.id,
      name: test.name,
      passed: false,
      visible,
      message: [
        "Not yet. The native offline Python verifier ran this beginner check and found the next fix.",
        error instanceof Error ? error.message : String(error || "Test failed"),
        "Change the smallest thing, then run again."
      ].join("\n")
    };
  }
}

export function runNativePythonProof(
  spec: LessonRunnerSpec,
  lessonId: string,
  code: string,
  now = new Date().toISOString()
): CodeRunAttempt {
  const startedAt = Date.now();
  let execution: { scope: PythonScope; stdout: string[]; stderr: string[] };
  try {
    execution = executeLearnerCode(code);
  } catch (error) {
    const stderrText = error instanceof Error ? error.message : String(error || "Python runtime error");
    const diagnostics = buildProblemDiagnostics({ language: "python", stderr: stderrText, errorMessage: stderrText });
    const command = codeRunCommand("python", "run_checks");
    const runtimeMs = Date.now() - startedAt;
    const testResults: CodeRunTestResult[] = [{
      id: "python-execution",
      name: "Python execution",
      passed: false,
      visible: true,
      message: "The Python file must run before lesson checks can verify proof."
    }];

    return normalizeCodeRunAttempt({
      id: `code-run-${lessonId}-${now.replace(/[^0-9]/g, "")}`,
      lessonId,
      language: "python",
      runMode: "run_checks",
      command,
      codeSnapshot: code,
      stdout: "",
      stderr: stderrText,
      passed: false,
      score: 0,
      runtimeMs,
      testResults,
      hiddenCheckSummary: emptyHiddenCheckSummary(),
      diagnostics,
      terminalTranscript: buildTerminalTranscript({
        command,
        diagnostics,
        hiddenCheckSummary: emptyHiddenCheckSummary(),
        language: "python",
        passed: false,
        runMode: "run_checks",
        runtimeMs,
        stderr: stderrText,
        stdout: "",
        testResults
      }),
      createdAt: now
    });
  }

  const { scope, stdout, stderr } = execution;
  const tests = [...spec.visibleTests, ...spec.hiddenTests];
  const rawTestResults = tests.map((test, index) => runTest(test, index < spec.visibleTests.length, scope, stdout));
  const passedTests = rawTestResults.filter((result) => result.passed).length;
  const score = rawTestResults.length === 0 ? 0 : Math.round((passedTests / rawTestResults.length) * 100);
  const passed = rawTestResults.length > 0 && rawTestResults.every((result) => result.passed);
  const { visibleCheckResults, hiddenCheckSummary } = redactCheckResults(rawTestResults);
  const stderrText = stderr.join("\n");
  const stdoutText = stdout.join("\n");
  const command = codeRunCommand("python", "run_checks");
  const runtimeMs = Date.now() - startedAt;
  const diagnostics = buildProblemDiagnostics({
    language: "python",
    stderr: stderrText,
    checkMessages: visibleCheckResults.filter((result) => !result.passed).map((result) => result.message)
  });

  return normalizeCodeRunAttempt({
    id: `code-run-${lessonId}-${now.replace(/[^0-9]/g, "")}`,
    lessonId,
    language: "python",
    runMode: "run_checks",
    command,
    codeSnapshot: code,
    stdout: stdoutText,
    stderr: stderrText,
    passed,
    score,
    runtimeMs,
    testResults: visibleCheckResults,
    hiddenCheckSummary,
    diagnostics,
    terminalTranscript: buildTerminalTranscript({
      command,
      diagnostics,
      hiddenCheckSummary,
      language: "python",
      passed,
      runMode: "run_checks",
      runtimeMs,
      stderr: stderrText,
      stdout: stdoutText,
      testResults: visibleCheckResults
    }),
    createdAt: now
  });
}

export function runNativePythonFile(
  lessonId: string,
  code: string,
  now = new Date().toISOString()
): CodeRunAttempt {
  const startedAt = Date.now();
  const command = codeRunCommand("python", "run_file");

  try {
    const { stdout, stderr } = executeLearnerCode(code);
    const stdoutText = stdout.join("\n");
    const stderrText = stderr.join("\n");
    const diagnostics = buildProblemDiagnostics({ language: "python", stderr: stderrText });
    const runtimeMs = Date.now() - startedAt;

    return normalizeCodeRunAttempt({
      id: `code-run-${lessonId}-${now.replace(/[^0-9]/g, "")}`,
      lessonId,
      language: "python",
      runMode: "run_file",
      command,
      codeSnapshot: code,
      stdout: stdoutText,
      stderr: stderrText,
      passed: diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
      score: 0,
      runtimeMs,
      testResults: [],
      hiddenCheckSummary: emptyHiddenCheckSummary(),
      diagnostics,
      terminalTranscript: buildTerminalTranscript({
        command,
        diagnostics,
        hiddenCheckSummary: emptyHiddenCheckSummary(),
        language: "python",
        passed: diagnostics.every((diagnostic) => diagnostic.severity !== "error"),
        runMode: "run_file",
        runtimeMs,
        stderr: stderrText,
        stdout: stdoutText,
        testResults: []
      }),
      createdAt: now
    });
  } catch (error) {
    const stderrText = error instanceof Error ? error.message : String(error || "Python runtime error");
    const diagnostics = buildProblemDiagnostics({ language: "python", stderr: stderrText, errorMessage: stderrText });
    const runtimeMs = Date.now() - startedAt;

    return normalizeCodeRunAttempt({
      id: `code-run-${lessonId}-${now.replace(/[^0-9]/g, "")}`,
      lessonId,
      language: "python",
      runMode: "run_file",
      command,
      codeSnapshot: code,
      stdout: "",
      stderr: stderrText,
      passed: false,
      score: 0,
      runtimeMs,
      testResults: [],
      hiddenCheckSummary: emptyHiddenCheckSummary(),
      diagnostics,
      terminalTranscript: buildTerminalTranscript({
        command,
        diagnostics,
        hiddenCheckSummary: emptyHiddenCheckSummary(),
        language: "python",
        passed: false,
        runMode: "run_file",
        runtimeMs,
        stderr: stderrText,
        stdout: "",
        testResults: []
      }),
      createdAt: now
    });
  }
}
