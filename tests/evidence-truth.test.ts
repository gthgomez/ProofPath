import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import {
  addEvidenceItem,
  createInitialProgress,
  ensureProgressProfile,
  getMissionProofChecklist,
  missionEvidenceMeetsRequirements,
  recordCodeRunAttempt,
  setMissionCompletion,
  setRoleTarget,
  summarizeMissionProof
} from "@/domain/progress";
import { classifyEvidenceTrust, suppliesReproductionPackage, trustProvenance } from "@/domain/evidence-trust";
import { calculateReadinessScore } from "@/domain/readiness";
import type { CodeRunAttempt, ProjectMission, UserProgress } from "@/domain/types";

const NOW = "2026-10-09T12:00:00.000Z";

const CLI_MISSION = contentPack.projectMissions.find((mission) => mission.id === "mission-cli-study-tracker")!;
const PORTFOLIO_MISSION = contentPack.projectMissions.find((mission) => mission.id === "mission-professional-python-utility")!;

function onboardedProgress(): UserProgress {
  return setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
}

function codeRunAttempt(overrides: Partial<CodeRunAttempt> = {}): CodeRunAttempt {
  return {
    id: "attempt-1",
    lessonId: "lesson-python-print-values",
    language: "python",
    runMode: "run_checks",
    command: "proofpath checks",
    codeSnapshot: "print('hi')",
    stdout: "passed",
    stderr: "",
    passed: true,
    score: 100,
    runtimeMs: 12,
    testResults: [{ id: "t1", name: "prints", passed: true, visible: true, message: "ok" }],
    hiddenCheckSummary: { total: 0, passed: 0, failed: 0 },
    diagnostics: [],
    terminalTranscript: [],
    createdAt: NOW,
    ...overrides
  };
}

describe("evidence provenance classification", () => {
  it("never awards independent verification to a fabricated repository URL", () => {
    const progress = addEvidenceItem(onboardedProgress(), {
      type: "repo",
      title: "Fabricated repo",
      body: "Looks structured but proves nothing about who ran anything.",
      repoUrl: "https://github.com/not-a-real-org/not-a-real-repo",
      commitHash: "abcdef1",
      testStatus: "passing",
      readmeStatus: "complete",
      verifierOutput: "all tests passed"
    }, NOW);

    const item = progress.evidenceItems[0];
    expect(item.trust).toBe("reproduction_package_supplied");
    expect(trustProvenance(item.trust).independentlyVerified).toBe(false);
    expect(trustProvenance(item.trust).locallyVerified).toBe(false);
  });

  it("does not treat a syntactically valid but unsupported hash as a verified commit", () => {
    const progress = addEvidenceItem(onboardedProgress(), {
      type: "commit",
      title: "Bare hash",
      body: "A random hex string with no repository, revision history, or executed check.",
      commitHash: "deadbeefcafe"
    }, NOW);

    const item = progress.evidenceItems[0];
    expect(item.trust).toBe("manual_note");
    expect(trustProvenance(item.trust).independentlyVerified).toBe(false);
  });

  it("keeps manually entered passing output self-reported", () => {
    const progress = addEvidenceItem(onboardedProgress(), {
      type: "test-output",
      title: "Pasted output",
      body: "I ran the tests on my machine and they passed.",
      testStatus: "passing",
      verifierOutput: "pytest: 4 passed"
    }, NOW);

    const item = progress.evidenceItems[0];
    expect(item.trust).toBe("manual_verifier_output");
    expect(trustProvenance(item.trust).independentlyVerified).toBe(false);
    expect(trustProvenance(item.trust).locallyVerified).toBe(false);
  });

  it("retains the locally-verified classification for a genuine Code Lab pass", () => {
    const progress = recordCodeRunAttempt(onboardedProgress(), codeRunAttempt(), NOW);
    const proof = progress.evidenceItems.find((item) => item.proofArtifact);

    expect(proof).toBeDefined();
    expect(proof?.trust).toBe("auto_verified_code_lab");
    expect(trustProvenance(proof?.trust).locallyVerified).toBe(true);
  });

  it("cannot generate passing proof from a failing or file-only Code Lab run", () => {
    const failed = recordCodeRunAttempt(onboardedProgress(), codeRunAttempt({ passed: false, stdout: "boom" }), NOW);
    const fileOnly = recordCodeRunAttempt(onboardedProgress(), codeRunAttempt({ runMode: "run_file" }), NOW);

    expect(failed.evidenceItems).toHaveLength(0);
    expect(fileOnly.evidenceItems).toHaveLength(0);
    expect(failed.evidenceItems.some((item) => item.testStatus === "passing")).toBe(false);
  });

  it("classifies the reproduction-package predicate without claiming execution", () => {
    expect(suppliesReproductionPackage({ repoUrl: "https://github.com/x/y", commitHash: "abc1234", verifierOutput: "pytest" })).toBe(true);
    expect(suppliesReproductionPackage({ repoUrl: "not-a-url", commitHash: "abc1234", verifierOutput: "pytest" })).toBe(false);
    expect(suppliesReproductionPackage({ repoUrl: "https://github.com/x/y", commitHash: "zzz", verifierOutput: "pytest" })).toBe(false);
    expect(classifyEvidenceTrust({ repoUrl: "https://github.com/x/y", commitHash: "abc1234", verifierOutput: "pytest" }))
      .toBe("reproduction_package_supplied");
  });
});

describe("mission proof coherence", () => {
  function evidenceFor(mission: ProjectMission, overrides: Record<string, unknown>, index: number): UserProgress {
    return addEvidenceItem(onboardedProgress(), {
      type: "repo",
      title: `Submission ${index}`,
      body: `Evidence record ${index} for ${mission.id}.`,
      linkedProjectMissionId: mission.id,
      ...overrides
    }, NOW);
  }

  it("does not stitch unrelated records into a verified submission", () => {
    let progress = onboardedProgress();
    progress = evidenceFor(PORTFOLIO_MISSION, { repoUrl: "https://github.com/learner/utility", reflection: "Built the package." }, 1);
    progress = evidenceFor(PORTFOLIO_MISSION, { commitHash: "abc1234" }, 2);
    progress = evidenceFor(PORTFOLIO_MISSION, { testStatus: "passing", verifierOutput: "pytest: 4 passed" }, 3);
    progress = evidenceFor(PORTFOLIO_MISSION, { readmeStatus: "complete" }, 4);
    progress = evidenceFor(PORTFOLIO_MISSION, { artifactUri: "https://example.com/demo" }, 5);

    // Fields are distributed across records, so no single record describes one revision.
    expect(missionEvidenceMeetsRequirements(progress, PORTFOLIO_MISSION)).toBe(false);
    const checklist = getMissionProofChecklist(progress, PORTFOLIO_MISSION);
    expect(checklist.some((item) => !item.complete)).toBe(true);
  });

  it("accepts one coherent submission that binds repo, revision, command, result, docs, and artifact", () => {
    let progress = onboardedProgress();
    progress = evidenceFor(PORTFOLIO_MISSION, {
      repoUrl: "https://github.com/learner/utility",
      commitHash: "abc1234",
      testStatus: "passing",
      verifierOutput: "pytest: 4 passed",
      readmeStatus: "complete",
      artifactUri: "https://example.com/demo",
      reflection: "Package layout, JSON mode, and error handling are verified by the pasted command output."
    }, 1);

    expect(missionEvidenceMeetsRequirements(progress, PORTFOLIO_MISSION)).toBe(true);
    expect(getMissionProofChecklist(progress, PORTFOLIO_MISSION).every((item) => item.complete)).toBe(true);
  });

  it("separates documentation complete from verification supplied from mission complete", () => {
    let progress = onboardedProgress();
    // Coherent repo + revision + command, but README missing and no artifact.
    progress = evidenceFor(PORTFOLIO_MISSION, {
      repoUrl: "https://github.com/learner/utility",
      commitHash: "abc1234",
      testStatus: "passing",
      verifierOutput: "pytest: 4 passed",
      reflection: "Still needs README and a demo artifact."
    }, 1);

    const summary = summarizeMissionProof(progress, PORTFOLIO_MISSION);
    expect(summary.verificationProvided).toBe(true);
    expect(summary.documentationComplete).toBe(false);
    expect(summary.meetsRequirements).toBe(false);
    expect(progress.completedProjectMissionIds).not.toContain(PORTFOLIO_MISSION.id);
  });

  it("refuses to award a mission whose evidence policy is not met", () => {
    const fragmented = evidenceFor(CLI_MISSION, { testStatus: "passing", verifierOutput: "pytest: 1 passed" }, 1);
    const blocked = setMissionCompletion(fragmented, CLI_MISSION, true, NOW);
    expect(blocked.completedProjectMissionIds).not.toContain(CLI_MISSION.id);

    const coherent = evidenceFor(CLI_MISSION, {
      repoUrl: "https://github.com/learner/cli",
      testStatus: "passing",
      verifierOutput: "pytest: 1 passed",
      readmeStatus: "basic",
      reflection: "The CLI validates input and prints weekly totals."
    }, 2);
    const awarded = setMissionCompletion(coherent, CLI_MISSION, true, NOW);
    expect(awarded.completedProjectMissionIds).toContain(CLI_MISSION.id);
  });
});

describe("readiness provenance weighting", () => {
  it("credits identical fields at reduced confidence when self-reported rather than locally verified", () => {
    const fields = {
      type: "repo" as const,
      title: "Project evidence",
      body: "The same structure either way; only provenance differs in this comparison.",
      linkedProjectMissionId: CLI_MISSION.id,
      repoUrl: "https://github.com/learner/cli",
      commitHash: "abc1234",
      testStatus: "passing" as const,
      readmeStatus: "complete" as const,
      verifierOutput: "pytest: 4 passed",
      artifactUri: "https://example.com/demo",
      reflection: "Describes the work and what remains."
    };

    // Same documentation supplied by the learner (defaults to reproduction_package_supplied).
    const selfReported = addEvidenceItem(onboardedProgress(), fields, NOW);
    // Identical documentation that ProofPath had actually executed. The trust is
    // set explicitly here to isolate the scoring weight from classification.
    const asIfLocallyVerified = addEvidenceItem(onboardedProgress(), {
      ...fields,
      linkedProjectMissionId: PORTFOLIO_MISSION.id,
      trust: "auto_verified_code_lab"
    }, NOW);

    const selfReportedHygiene = calculateReadinessScore(contentPack, selfReported, NOW).breakdown.evidenceHygiene;
    const verifiedHygiene = calculateReadinessScore(contentPack, asIfLocallyVerified, NOW).breakdown.evidenceHygiene;

    expect(verifiedHygiene).toBeGreaterThan(selfReportedHygiene);
    expect(selfReportedHygiene).toBeLessThan(100);
  });

  it("does not let duplicate evidence inflate readiness", () => {
    const single = addEvidenceItem(onboardedProgress(), {
      type: "repo",
      title: "Project proof",
      body: "A coherent submission for the CLI mission with repository and check output.",
      linkedProjectMissionId: CLI_MISSION.id,
      linkedSkillIds: ["skill-python-functions"],
      repoUrl: "https://github.com/learner/cli",
      commitHash: "abc1234",
      testStatus: "passing",
      readmeStatus: "complete",
      verifierOutput: "pytest: 4 passed",
      reflection: "Proves input handling and weekly aggregation."
    }, NOW);
    const duplicated = addEvidenceItem(single, {
      type: "repo",
      title: "Project proof (copy)",
      body: "An identical duplicate submission for the same mission.",
      linkedProjectMissionId: CLI_MISSION.id,
      linkedSkillIds: ["skill-python-functions"],
      repoUrl: "https://github.com/learner/cli",
      commitHash: "abc1234",
      testStatus: "passing",
      readmeStatus: "complete",
      verifierOutput: "pytest: 4 passed",
      reflection: "Proves input handling and weekly aggregation."
    }, NOW);

    expect(calculateReadinessScore(contentPack, duplicated, NOW).breakdown.evidenceHygiene)
      .toBe(calculateReadinessScore(contentPack, single, NOW).breakdown.evidenceHygiene);
  });
});

describe("persistence compatibility", () => {
  it("reclassifies legacy externally_reproducible evidence without removing or promoting it", () => {
    const legacy = {
      ...createInitialProgress(NOW),
      evidenceItems: [
        {
          id: "legacy-1",
          type: "repo" as const,
          title: "Legacy submission",
          body: "Saved before the provenance categories were corrected.",
          repoUrl: "https://github.com/legacy/repo",
          commitHash: "aaaaaaa",
          testStatus: "passing" as const,
          readmeStatus: "complete" as const,
          verifierOutput: "pytest passed",
          trust: "externally_reproducible",
          createdAt: NOW
        }
      ]
    };

    const migrated = ensureProgressProfile(legacy as unknown as Parameters<typeof ensureProgressProfile>[0], NOW);

    expect(migrated.evidenceItems).toHaveLength(1);
    expect(migrated.evidenceItems[0].trust).toBe("reproduction_package_supplied");
    expect(migrated.evidenceItems[0].repoUrl).toBe("https://github.com/legacy/repo");
    expect(migrated.evidenceItems[0].commitHash).toBe("aaaaaaa");
    // The legacy row carried no proof artifact, so it must not become locally verified.
    expect(migrated.evidenceItems[0].proofArtifact).toBeUndefined();
  });

  it("keeps historical progress loadable and idempotent", () => {
    const legacy = {
      ...createInitialProgress(NOW),
      completedLessonIds: ["lesson-python-values"],
      evidenceItems: [
        {
          id: "legacy-2",
          type: "note" as const,
          title: "Note",
          body: "A saved note from an older build.",
          trust: "manual_note",
          createdAt: NOW
        }
      ]
    };

    const first = ensureProgressProfile(legacy as unknown as Parameters<typeof ensureProgressProfile>[0], NOW);
    const second = ensureProgressProfile(first, NOW);

    expect(first.evidenceItems).toHaveLength(1);
    expect(second.evidenceItems).toHaveLength(1);
    expect(second.evidenceItems[0].trust).toBe("manual_note");
    expect(second.placedOutLessonIds.sort()).toEqual(first.placedOutLessonIds.sort());
  });
});
