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
 * Reduce a term to lowercase alphanumerics so comparisons ignore case and
 * punctuation.
 */
function comparableTerm(term: string): string {
  return term.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Split a required term into lowercased camelCase words, grouped per
 * alphanumeric identifier. "NameError" becomes [["name", "error"]] and
 * "error count: 0" becomes [["error"], ["count"], ["0"]].
 */
function requiredTermIdentifiers(term: string): string[][] {
  return term
    .split(/[^A-Za-z0-9]+/)
    .filter((identifier) => identifier.length > 0)
    .map((identifier) => identifier
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .toLowerCase()
      .split(" ")
      .filter((word) => word.length > 0));
}

/**
 * A forbidden term is covered only when a required output term actually names
 * it, never when the required term merely contains it as a substring.
 *
 * An exact normalized match always counts (a lesson may require a term it would
 * otherwise forbid). A term may also cover a generic guard when the guard is a
 * later camelCase word of an identifier the required term names, so an
 * exception type such as "NameError" covers the generic "error:" guard. A
 * phrase such as "error count: 0" must not cover "error:" because "error" is
 * its own word rather than the tail of an exception name.
 */
function isCoveredByRequiredOutput(blockedText: string, requiredOutputIncludes: string[]): boolean {
  const blocked = comparableTerm(blockedText);
  if (blocked.length === 0) {
    return false;
  }
  return requiredOutputIncludes.some((requiredText) => {
    if (comparableTerm(requiredText) === blocked) {
      return true;
    }
    return requiredTermIdentifiers(requiredText).some((words) => words.indexOf(blocked) > 0);
  });
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
