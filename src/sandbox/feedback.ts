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

  return [
    "The code crashed before the test could finish checking it.",
    `Read the first ${label} error clue, then ask: which name, value, or line is the program complaining about?`,
    detail ? `Error clue: ${detail}` : "Error clue: no extra detail was reported.",
    "Make the smallest change that would prove your next assumption, then run the test again."
  ].join("\n");
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
