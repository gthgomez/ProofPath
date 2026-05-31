import type { LessonMiniProject } from "@/domain/types";

export interface MiniProjectSubmission {
  codeOrArtifact: string;
  terminalOutput: string;
}

export interface MiniProjectTestResult {
  passed: boolean;
  message: string;
  missingCodeRequirements: string[];
  missingOutputRequirements: string[];
  blockedOutputTerms: string[];
}

function includesNeedle(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function runMiniProjectTest(miniProject: LessonMiniProject, submission: MiniProjectSubmission): MiniProjectTestResult {
  const codeOrArtifact = submission.codeOrArtifact.trim();
  const terminalOutput = submission.terminalOutput.trim();
  const tester = miniProject.tester;
  const missingCodeRequirements = tester.requiredCodeIncludes.filter((requiredText) => !includesNeedle(codeOrArtifact, requiredText));
  const missingOutputRequirements = tester.requiredOutputIncludes.filter((requiredText) => !includesNeedle(terminalOutput, requiredText));
  const blockedOutputTerms = tester.forbiddenOutputIncludes.filter((blockedText) => includesNeedle(terminalOutput, blockedText));
  const passed = codeOrArtifact.length > 0
    && terminalOutput.length > 0
    && missingCodeRequirements.length === 0
    && missingOutputRequirements.length === 0
    && blockedOutputTerms.length === 0;

  return {
    passed,
    message: passed ? tester.successMessage : tester.failureMessage,
    missingCodeRequirements,
    missingOutputRequirements,
    blockedOutputTerms
  };
}
