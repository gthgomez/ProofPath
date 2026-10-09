import type { ContentPack, EvidenceItem, UserProgress } from "./types";
import { calculateReadinessScore } from "./readiness";
import { formatProofArtifactVerifierOutput } from "./code-run";

export interface ReviewerPortfolioExport {
  exportedAt: string;
  roleTarget: {
    id: string;
    readinessScore: number;
    readinessLabel: string;
  };
  summary: {
    totalEvidenceCount: number;
    autoVerifiedCount: number;
    externallyReproducibleCount: number;
    selfReportedCount: number;
    completedMissionsCount: number;
  };
  missions: Array<{
    missionId: string;
    missionTitle: string;
    evidenceItems: Array<{
      id: string;
      title: string;
      trust: string;
      testStatus: string;
      repoUrl?: string;
      commitHash?: string;
      verifierOutput?: string;
      reflection?: string;
      createdAt: string;
    }>;
  }>;
  evidenceItems: EvidenceItem[];
  markdownPacket: string;
}

export function generateReviewerPortfolioExport(
  content: ContentPack,
  progress: UserProgress,
  now = new Date().toISOString()
): ReviewerPortfolioExport {
  const readiness = calculateReadinessScore(content, progress, now);
  const evidenceItems = progress.evidenceItems;

  const autoVerifiedCount = evidenceItems.filter((item) => item.trust === "auto_verified_code_lab").length;
  const externallyReproducibleCount = evidenceItems.filter((item) => item.trust === "externally_reproducible").length;
  const selfReportedCount = evidenceItems.filter((item) => (
    item.trust === "manual_verifier_output" || item.trust === "manual_note" || !item.trust
  )).length;

  const missionMap = new Map<string, EvidenceItem[]>();
  for (const item of evidenceItems) {
    if (item.linkedProjectMissionId) {
      const list = missionMap.get(item.linkedProjectMissionId) ?? [];
      list.push(item);
      missionMap.set(item.linkedProjectMissionId, list);
    }
  }

  const missions = Array.from(missionMap.entries()).map(([missionId, items]) => {
    const mission = content.projectMissions.find((m) => m.id === missionId);
    return {
      missionId,
      missionTitle: mission?.title ?? missionId,
      evidenceItems: items.map((item) => ({
        id: item.id,
        title: item.title,
        trust: item.trust ?? "manual_note",
        testStatus: item.testStatus,
        repoUrl: item.repoUrl,
        commitHash: item.commitHash,
        verifierOutput: item.proofArtifact
          ? formatProofArtifactVerifierOutput(item.proofArtifact)
          : item.verifierOutput,
        reflection: item.reflection ?? item.body,
        createdAt: item.createdAt
      }))
    };
  });

  const markdownSections: string[] = [
    `# ProofPath Reviewer-Ready Portfolio Evidence Packet`,
    ``,
    `**Export Date:** ${now}`,
    `**Career Track:** ${progress.profile.roleTargetId}`,
    `**Readiness Score (Practice Heuristic):** ${readiness.score}% (${readiness.label})`,
    ``,
    `> [!NOTE]`,
    `> This packet exports local and verified artifacts logged by the learner. ProofPath distinguishes auto-verified code lab results and externally reproducible project submissions from self-reported notes.`,
    ``,
    `## Evidence Provenance Overview`,
    `- **Auto-Verified Code Lab Checks:** ${autoVerifiedCount}`,
    `- **Externally Reproducible Projects:** ${externallyReproducibleCount}`,
    `- **Self-Reported Checks & Notes:** ${selfReportedCount}`,
    `- **Completed Missions:** ${progress.completedProjectMissionIds.length}`,
    ``,
    `## Portfolio Missions & Verified Deliverables`
  ];

  if (missions.length === 0) {
    markdownSections.push(`*No linked mission evidence has been recorded yet.*`);
  } else {
    for (const mission of missions) {
      markdownSections.push(`### Mission: ${mission.missionTitle} (\`${mission.missionId}\`)`);
      for (const item of mission.evidenceItems) {
        markdownSections.push(`#### ${item.title}`);
        markdownSections.push(`- **Classification:** \`${item.trust}\``);
        markdownSections.push(`- **Test Status:** ${item.testStatus}`);
        if (item.repoUrl) markdownSections.push(`- **Repository:** ${item.repoUrl}`);
        if (item.commitHash) markdownSections.push(`- **Commit SHA:** \`${item.commitHash}\``);
        if (item.reflection) markdownSections.push(`- **Reflection / Context:** ${item.reflection}`);
        if (item.verifierOutput) {
          markdownSections.push(``);
          markdownSections.push(`\`\`\`text`);
          markdownSections.push(item.verifierOutput.trim());
          markdownSections.push(`\`\`\``);
        }
        markdownSections.push(``);
      }
    }
  }

  const markdownPacket = markdownSections.join("\n");

  return {
    exportedAt: now,
    roleTarget: {
      id: progress.profile.roleTargetId,
      readinessScore: readiness.score,
      readinessLabel: readiness.label
    },
    summary: {
      totalEvidenceCount: evidenceItems.length,
      autoVerifiedCount,
      externallyReproducibleCount,
      selfReportedCount,
      completedMissionsCount: progress.completedProjectMissionIds.length
    },
    missions,
    evidenceItems,
    markdownPacket
  };
}
