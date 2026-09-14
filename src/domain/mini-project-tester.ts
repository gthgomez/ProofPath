/**
 * Mini-project tester — validation utility, intentionally not wired into the app.
 *
 * `runMiniProjectTest` validates a code/artifact plus terminal output against a
 * lesson's `tester` spec (required code, required output, forbidden output).
 * Lesson completion is currently driven by Code Lab `run_checks`, so this tester
 * is NOT part of the live completion path.
 *
 * Recorded decision for issue #13: keep the tester (do not retire it). It is
 * exercised by tests and reserved for evidence validation outside the Code Lab
 * runner, where a submission may need to be checked against explicit required and
 * forbidden terms.
 */

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

/**
 * Reduce a term to lowercase alphanumerics so containment comparisons ignore
 * case and punctuation. This lets a generic guard like "error:" be recognized
 * as part of a required term like "NameError" (the "Error:" in "NameError:" is
 * the requested output, not an unrequested error).
 */
function comparableTerm(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * A forbidden term must not block output when it is a substring of one of the
 * lesson's required output terms. If the lesson requires `NameError`, the
 * generic `error:` guard must not veto that required output. Genuinely
 * forbidden content (for example an unrequested traceback on a normal lesson)
 * is still blocked because no required term covers it.
 */
function isCoveredByRequiredOutput(blockedText: string, requiredOutputIncludes: string[]): boolean {
  const blocked = comparableTerm(blockedText);
  if (blocked.length === 0) {
    return false;
  }
  return requiredOutputIncludes.some((requiredText) => comparableTerm(requiredText).includes(blocked));
}

export function runMiniProjectTest(miniProject: LessonMiniProject, submission: MiniProjectSubmission): MiniProjectTestResult {
  const codeOrArtifact = submission.codeOrArtifact.trim();
  const terminalOutput = submission.terminalOutput.trim();
  const tester = miniProject.tester;
  const missingCodeRequirements = tester.requiredCodeIncludes.filter((requiredText) => !includesNeedle(codeOrArtifact, requiredText));
  const missingOutputRequirements = tester.requiredOutputIncludes.filter((requiredText) => !includesNeedle(terminalOutput, requiredText));
  const blockedOutputTerms = tester.forbiddenOutputIncludes.filter((blockedText) => (
    includesNeedle(terminalOutput, blockedText)
    && !isCoveredByRequiredOutput(blockedText, tester.requiredOutputIncludes)
  ));
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
