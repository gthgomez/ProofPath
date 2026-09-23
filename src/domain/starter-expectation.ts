/**
 * Detection for "intentionally unfinished" Code Lab starters.
 *
 * About a third of active lessons ship starter code with TODO markers: the
 * graded checks fail as shipped until the learner implements the marked parts.
 * That is the exercise working as designed, so the Code Lab labels these
 * starters up front instead of letting the first failing run look like
 * breakage.
 *
 * Detection stays on the whole-word, uppercase TODO token only. The content
 * convention pairs TODO markers with NotImplementedError / "implement ..."
 * comments, but those strings can also appear in a lesson's reference material,
 * and a lowercase "todo" inside a learner-facing string must never count. The
 * exact token cannot false-positive on a complete starter.
 */
export function isScaffoldStarter(starterCode: string): boolean {
  return /\bTODO\b/.test(starterCode);
}

export interface ScaffoldStarterNotice {
  title: string;
  body: string;
}

/**
 * Learner-facing explanation for scaffold starters. It must set expectations
 * (checks are supposed to fail at first), explain the two run buttons, and
 * never say what the implementation should be — only that the TODO parts are
 * the learner's to write.
 */
export function scaffoldStarterNotice(): ScaffoldStarterNotice {
  return {
    title: "This starter is intentionally unfinished",
    body: [
      "The parts marked TODO are yours to implement, so the lesson checks are expected to fail until they are done.",
      "That first failing run is the exercise working, not something you broke.",
      "Use Run file to inspect your code without grading. Use Run checks to run the graded checks when you think it is ready.",
      "Each TODO you replace moves the checks closer to passing."
    ].join(" ")
  };
}
