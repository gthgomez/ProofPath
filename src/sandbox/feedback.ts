import type { LessonRunnerSpec } from "@/domain/types";
import type { SandboxPolicyViolation } from "@/sandbox/policy";

export type SandboxFailureKind = "missing-output" | "policy" | "runtime" | "timeout" | "runner";

interface SandboxFailureFeedbackOptions {
  kind: SandboxFailureKind;
  language: LessonRunnerSpec["language"];
  detail?: string;
  policyRule?: string;
}

const languageNouns: Record<LessonRunnerSpec["language"], string> = {
  javascript: "JavaScript",
  python: "Python",
  sql: "SQL",
  typescript: "TypeScript"
};

function languageName(language: LessonRunnerSpec["language"]): string {
  return languageNouns[language];
}

function policyQuestion(rule?: string): string {
  if (rule?.includes("network")) {
    return "What local sample data could prove the same idea without calling the internet?";
  }

  if (rule?.includes("sql-mutation")) {
    return "Is this lesson asking you to inspect data, or to change the table?";
  }

  if (rule?.includes("infinite-loop")) {
    return "What exact condition should make your loop stop?";
  }

  if (rule?.includes("file") || rule?.includes("process")) {
    return "Which value could you keep in memory instead of reaching into the device or process?";
  }

  if (rule?.includes("eval") || rule?.includes("dynamic") || rule?.includes("constructor")) {
    return "Can the same behavior be expressed with normal functions, objects, or a query?";
  }

  return "What part of the lesson can you solve using only the starter data and normal language features?";
}

export function formatSandboxFailureFeedback({
  kind,
  language,
  detail,
  policyRule
}: SandboxFailureFeedbackOptions): string {
  const label = languageName(language);

  if (kind === "missing-output") {
    return [
      "Not yet. The test ran, but it did not see all of the proof it was looking for.",
      `Think through your ${label} flow: where is the required value produced, and where is it printed or returned?`,
      "Before changing a lot, compare your output with the expected lines. Check for starter values left unchanged, quotes around numbers, empty summaries, and missing print calls."
    ].join("\n");
  }

  if (kind === "policy") {
    return [
      "The sandbox stopped this before running because it uses something outside the beginner lesson boundary.",
      policyQuestion(policyRule),
      detail ? `Clue from the sandbox: ${detail}` : "Clue from the sandbox: stay inside the starter data, visible inputs, and local code."
    ].join("\n");
  }

  if (kind === "timeout") {
    return [
      "The runner stopped because the code took too long.",
      "This lesson may not need a loop, input(), recursion, or repeated query. Remove any code that keeps waiting or repeating after the answer is already known.",
      "If the lesson does ask for a loop, name the stopping condition in plain English, then make the code match that condition."
    ].join("\n");
  }

  if (kind === "runner") {
    return [
      "The sandbox runner could not finish this attempt.",
      "Is this lesson supported by the current runner on this device, or should it be tried in the web preview for now?",
      detail ? `Runner note: ${detail}` : "Runner note: no extra detail was reported."
    ].join("\n");
  }

  const pythonClue = language === "python" && detail ? getPythonBeginnerClue(detail) : undefined;
  const lines = [
    "The code crashed before the test could finish checking it.",
    `Read the first ${label} error clue, then ask: which name, value, or line is the program complaining about?`,
    detail ? `Error clue: ${detail}` : "Error clue: no extra detail was reported."
  ];
  if (pythonClue) {
    lines.push(pythonClue);
  }
  lines.push("Make the smallest change that would prove your next assumption, then run the test again.");
  return lines.join("\n");
}

function getPythonBeginnerClue(detail: string): string | undefined {
  if (/SyntaxError/i.test(detail)) {
    return [
      "💡 Python beginner tip (SyntaxError):",
      "• What it means: You have a typo in the code structure that Python does not recognize (like a missing colon, mismatched quotes, or unmatched parentheses).",
      "• How to fix: Look closely at the line mentioned. Check that every opening `(`, `[`, or `{` has a matching closing bracket, and loops or conditionals end with a colon `:`."
    ].join("\n");
  }
  if (/NameError/i.test(detail)) {
    return [
      "💡 Python beginner tip (NameError):",
      "• What it means: You used a variable name or function name that has not been defined yet, or is spelled differently.",
      "• How to fix: Check the spelling of the name. Did you define the variable before using it? Remember that Python is case-sensitive (`my_var` is different from `My_Var`)."
    ].join("\n");
  }
  if (/TypeError/i.test(detail)) {
    return [
      "💡 Python beginner tip (TypeError):",
      "• What it means: You tried to perform an operation on data types that don't mix (like adding a string to a number).",
      "• How to fix: Convert variables to the correct type first. For example, use `str(5)` to combine a number with a string, or `int('5')` to do math with a string digit."
    ].join("\n");
  }
  if (/IndentationError/i.test(detail)) {
    return [
      "💡 Python beginner tip (IndentationError):",
      "• What it means: The spaces or tabs at the beginning of the lines are not aligned correctly. Python uses spacing to group blocks of code.",
      "• How to fix: Make sure all lines inside the same block (like under an `if` or a loop) are indented by the exact same number of spaces (typically 4). Avoid mixing tabs and spaces."
    ].join("\n");
  }
  if (/KeyError/i.test(detail)) {
    return [
      "💡 Python beginner tip (KeyError):",
      "• What it means: You tried to look up a key in a dictionary, but that key doesn't exist.",
      "• How to fix: Check the spelling of the key. You can check if the key exists first (`if key in my_dict:`) or use the `.get(key, default)` method to avoid crashes."
    ].join("\n");
  }
  if (/IndexError/i.test(detail)) {
    return [
      "💡 Python beginner tip (IndexError):",
      "• What it means: You tried to access an item in a list using a position (index) that is out of range.",
      "• How to fix: Python list indices start at 0 and end at length - 1. Make sure your index is less than `len(my_list)`."
    ].join("\n");
  }
  if (/ValueError/i.test(detail)) {
    return [
      "💡 Python beginner tip (ValueError):",
      "• What it means: You passed an argument to a function that has the correct type but an invalid value (like trying to convert the letters `'abc'` to a number).",
      "• How to fix: Check the value you are passing to the function and make sure it can be processed (e.g. only convert digits to integers)."
    ].join("\n");
  }
  return undefined;
}

export function formatPolicyViolationFeedback(
  violation: SandboxPolicyViolation,
  language: LessonRunnerSpec["language"]
): string {
  return formatSandboxFailureFeedback({
    kind: "policy",
    language,
    detail: violation.message,
    policyRule: violation.rule
  });
}

export function classifySandboxError(error: unknown): SandboxFailureKind {
  const message = error instanceof Error ? error.message : String(error ?? "");

  if (/output missing/i.test(message)) {
    return "missing-output";
  }

  if (/timed out|timeout/i.test(message)) {
    return "timeout";
  }

  return "runtime";
}
