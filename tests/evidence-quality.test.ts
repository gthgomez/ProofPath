import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { addEvidenceItem, createInitialProgress, setRoleTarget } from "@/domain/progress";
import { calculateReadinessScore } from "@/domain/readiness";
import { getContentForRole } from "@/domain/role-routing";

const NOW = "2026-05-04T18:00:00.000Z";

describe("portfolio evidence quality", () => {
  it("rewards structured portfolio proof more than a basic note", () => {
    const progress = setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
    const basic = addEvidenceItem(progress, {
      type: "note",
      title: "Short note",
      body: "I worked on it.",
      linkedProjectMissionId: "mission-cli-study-tracker"
    }, NOW);
    const structured = addEvidenceItem(progress, {
      type: "repo",
      title: "CLI tracker proof",
      body: "Repository has setup notes, tests, and an honest known-gaps section.",
      linkedProjectMissionId: "mission-cli-study-tracker",
      linkedSkillIds: ["skill-python-functions", "skill-testing-debugging", "skill-portfolio-evidence"],
      repoUrl: "https://github.com/example/cli-study-tracker",
      commitHash: "abc1234",
      testStatus: "passing",
      artifactUri: "https://github.com/example/cli-study-tracker#demo",
      readmeStatus: "complete",
      verifierOutput: "pytest",
      reflection: "This proves CLI input handling and weekly aggregation, but packaging is still future work."
    }, NOW);
    const roleContent = getContentForRole(contentPack, progress.profile.roleTargetId);

    expect(calculateReadinessScore(roleContent, structured, NOW).breakdown.evidenceHygiene)
      .toBeGreaterThan(calculateReadinessScore(roleContent, basic, NOW).breakdown.evidenceHygiene);
    expect(structured.evidenceItems[0]?.linkedSkillIds).toHaveLength(3);
    expect(structured.evidenceItems[0]?.trust).toBe("manual_verifier_output");
    expect(basic.evidenceItems[0]?.trust).toBe("manual_note");
  });

  it("does not let weak or unlinked evidence inflate role readiness", () => {
    const progress = setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
    const unlinked = addEvidenceItem(progress, {
      type: "repo",
      title: "Unlinked proof",
      body: "This should not count for a role path until it is attached to a mission or lesson.",
      repoUrl: "https://github.com/example/random",
      testStatus: "passing",
      verifierOutput: "npm test",
      readmeStatus: "complete"
    }, NOW);
    const failing = addEvidenceItem(progress, {
      type: "test-output",
      title: "Failing proof",
      body: "Useful diagnostic evidence, but not portfolio-ready proof.",
      linkedProjectMissionId: "mission-cli-study-tracker",
      repoUrl: "https://github.com/example/cli-study-tracker",
      testStatus: "failing",
      verifierOutput: "pytest",
      readmeStatus: "complete"
    }, NOW);
    const roleContent = getContentForRole(contentPack, progress.profile.roleTargetId);

    expect(calculateReadinessScore(roleContent, unlinked, NOW).breakdown.evidenceHygiene).toBe(0);
    expect(calculateReadinessScore(roleContent, failing, NOW).breakdown.evidenceHygiene).toBeLessThan(50);
  });
});
