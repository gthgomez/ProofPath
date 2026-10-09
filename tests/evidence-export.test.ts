import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { createInitialProgress, addEvidenceItem, setRoleTarget } from "@/domain/progress";
import { generateReviewerPortfolioExport } from "@/domain/evidence-export";

const NOW = "2026-10-09T22:00:00.000Z";

describe("evidence export packet generator", () => {
  it("generates markdown and json packets reflecting evidence provenance accurately", () => {
    let progress = setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
    
    // Add 1 auto-verified code lab item
    progress = {
      ...progress,
      evidenceItems: [
        {
          id: "evidence-proof-1",
          type: "test-output",
          title: "Code Lab proof: lesson-python-values",
          body: "Passing Run checks output captured automatically.",
          linkedLessonId: "lesson-python-values",
          linkedSkillIds: ["skill-python-basics"],
          testStatus: "passing",
          readmeStatus: "missing",
          verifierOutput: "Passed",
          trust: "auto_verified_code_lab",
          createdAt: NOW
        }
      ]
    };

    // Add 1 externally reproducible item
    progress = addEvidenceItem(progress, {
      type: "repo",
      title: "CLI study tracker project",
      body: "Full repo submission with pytest verifier and README documentation.",
      linkedProjectMissionId: "mission-cli-study-tracker",
      linkedSkillIds: ["skill-python-functions"],
      repoUrl: "https://github.com/learner/cli-tracker",
      commitHash: "a1b2c3d4e5",
      testStatus: "passing",
      readmeStatus: "complete",
      verifierOutput: "pytest passed 4 tests",
      reflection: "Built CLI flags, CSV parsing, and handled malformed inputs."
    }, NOW);

    // Add 1 self-reported note
    progress = addEvidenceItem(progress, {
      type: "note",
      title: "Self-reported observation",
      body: "Reflection notes on learning Python loops.",
      linkedProjectMissionId: "mission-cli-study-tracker"
    }, NOW);

    const packet = generateReviewerPortfolioExport(contentPack, progress, NOW);

    expect(packet.summary.totalEvidenceCount).toBe(3);
    expect(packet.summary.autoVerifiedCount).toBe(1);
    expect(packet.summary.reproductionPackageCount).toBe(1);
    expect(packet.summary.selfReportedCount).toBe(1);

    expect(packet.markdownPacket).toContain("# ProofPath Reviewer-Ready Portfolio Evidence Packet");
    expect(packet.markdownPacket).toContain("- **Locally verified (Code Lab):** 1");
    expect(packet.markdownPacket).toContain("- **Reproduction packages supplied (not executed by ProofPath):** 1");
    expect(packet.markdownPacket).toContain("- **Self-reported checks & notes:** 1");
    expect(packet.markdownPacket).toContain("https://github.com/learner/cli-tracker");
    expect(packet.markdownPacket).toContain("a1b2c3d4e5");
    expect(packet.markdownPacket).toContain("pytest passed 4 tests");
  });
});
