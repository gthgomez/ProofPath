import type { ContentPack, EvidenceItem, ProofArtifact, UserProgress } from "./types";
import { calculateReadinessScore } from "./readiness";
import { formatProofArtifactVerifierOutput } from "./code-run";
import { evidenceTrustLabel } from "./evidence-trust";

export interface ReviewedEvidenceEntry {
  id: string;
  title: string;
  trust: string;
  trustLabel: string;
  testStatus: string;
  command?: string;
  repoUrl?: string;
  commitHash?: string;
  verifierOutput?: string;
  reflection?: string;
  createdAt: string;
}

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
    /** Repositories+revisions+commands supplied but not executed by ProofPath. */
    reproductionPackageCount: number;
    selfReportedCount: number;
    lessonLinkedCount: number;
    missionLinkedCount: number;
    completedMissionsCount: number;
  };
  lessons: Array<{
    lessonId: string;
    lessonTitle: string;
    evidenceItems: ReviewedEvidenceEntry[];
  }>;
  missions: Array<{
    missionId: string;
    missionTitle: string;
    evidenceItems: ReviewedEvidenceEntry[];
  }>;
  evidenceItems: EvidenceItem[];
  markdownPacket: string;
}

/** Choose a fence longer than any backtick run in the content so text cannot close it early. */
function fenced(content: string): string[] {
  const longestRun = (content.match(/`+/g) ?? []).reduce((max, run) => Math.max(max, run.length), 0);
  const fence = "`".repeat(Math.max(3, longestRun + 1));
  return [fence, content.replace(/\n$/, ""), fence];
}

function toEntry(item: EvidenceItem): ReviewedEvidenceEntry {
  return {
    id: item.id,
    title: item.title,
    trust: item.trust ?? "manual_note",
    trustLabel: evidenceTrustLabel(item.trust),
    testStatus: item.testStatus,
    command: item.proofArtifact?.command,
    repoUrl: item.repoUrl,
    commitHash: item.commitHash,
    verifierOutput: item.proofArtifact ? formatProofArtifactVerifierOutput(item.proofArtifact) : item.verifierOutput,
    reflection: item.reflection ?? item.body,
    createdAt: item.createdAt
  };
}

/**
 * Reconstruct an evidence item from known fields only. This prevents any
 * unexpected property (for example an unstripped hidden-check name) from
 * riding along into a shared export.
 */
function safeProofArtifact(proof: ProofArtifact): ProofArtifact {
  return {
    sourceRunAttemptId: proof.sourceRunAttemptId,
    lessonId: proof.lessonId,
    ...(proof.lessonVersion ? { lessonVersion: proof.lessonVersion } : {}),
    ...(proof.missionId ? { missionId: proof.missionId } : {}),
    language: proof.language,
    runMode: proof.runMode,
    command: proof.command,
    passed: proof.passed,
    ...(proof.score !== undefined ? { score: proof.score } : {}),
    runtimeMs: proof.runtimeMs,
    createdAt: proof.createdAt,
    stdout: proof.stdout,
    stderr: proof.stderr,
    visibleCheckResults: proof.visibleCheckResults,
    hiddenCheckSummary: proof.hiddenCheckSummary,
    codeHash: proof.codeHash,
    ...(proof.codeSnapshot ? { codeSnapshot: proof.codeSnapshot } : {}),
    terminalTranscript: proof.terminalTranscript
  };
}

function safeEvidenceItem(item: EvidenceItem): EvidenceItem {
  return {
    id: item.id,
    type: item.type,
    title: item.title,
    body: item.body,
    linkedSkillIds: item.linkedSkillIds,
    testStatus: item.testStatus,
    readmeStatus: item.readmeStatus,
    createdAt: item.createdAt,
    ...(item.linkedProjectMissionId ? { linkedProjectMissionId: item.linkedProjectMissionId } : {}),
    ...(item.linkedLessonId ? { linkedLessonId: item.linkedLessonId } : {}),
    ...(item.uri ? { uri: item.uri } : {}),
    ...(item.repoUrl ? { repoUrl: item.repoUrl } : {}),
    ...(item.commitHash ? { commitHash: item.commitHash } : {}),
    ...(item.artifactUri ? { artifactUri: item.artifactUri } : {}),
    ...(item.deploymentUrl ? { deploymentUrl: item.deploymentUrl } : {}),
    ...(item.verifierOutput ? { verifierOutput: item.verifierOutput } : {}),
    ...(item.reflection ? { reflection: item.reflection } : {}),
    ...(item.proofArtifact ? { proofArtifact: safeProofArtifact(item.proofArtifact) } : {}),
    ...(item.trust ? { trust: item.trust } : {})
  };
}

function entryLines(entry: ReviewedEvidenceEntry): string[] {
  const lines = [
    `#### ${entry.title}`,
    `- **Classification:** ${entry.trustLabel} (\`${entry.trust}\`)`,
    `- **Verification result:** ${entry.testStatus}`,
    `- **Date:** ${entry.createdAt}`
  ];

  if (entry.command) lines.push(`- **Command:** ${entry.command}`);
  if (entry.repoUrl) lines.push(`- **Repository:** ${entry.repoUrl}`);
  if (entry.commitHash) lines.push(`- **Revision:** \`${entry.commitHash}\``);
  if (entry.reflection) lines.push(`- **Reflection / context:** ${entry.reflection}`);
  if (entry.verifierOutput) {
    lines.push("", ...fenced(entry.verifierOutput), "");
  }

  return lines;
}

export function generateReviewerPortfolioExport(
  content: ContentPack,
  progress: UserProgress,
  now = new Date().toISOString()
): ReviewerPortfolioExport {
  const readiness = calculateReadinessScore(content, progress, now);
  const evidenceItems = progress.evidenceItems;

  const autoVerifiedCount = evidenceItems.filter((item) => item.trust === "auto_verified_code_lab").length;
  const reproductionPackageCount = evidenceItems.filter((item) => item.trust === "reproduction_package_supplied").length;
  const selfReportedCount = evidenceItems.filter((item) => (
    item.trust === "manual_verifier_output" || item.trust === "manual_note" || !item.trust
  )).length;

  const lessonMap = new Map<string, EvidenceItem[]>();
  const missionMap = new Map<string, EvidenceItem[]>();
  const unlinked: EvidenceItem[] = [];

  for (const item of evidenceItems) {
    if (item.linkedLessonId) {
      const list = lessonMap.get(item.linkedLessonId) ?? [];
      list.push(item);
      lessonMap.set(item.linkedLessonId, list);
    }
    if (item.linkedProjectMissionId) {
      const list = missionMap.get(item.linkedProjectMissionId) ?? [];
      list.push(item);
      missionMap.set(item.linkedProjectMissionId, list);
    }
    if (!item.linkedLessonId && !item.linkedProjectMissionId) {
      unlinked.push(item);
    }
  }

  const lessons = Array.from(lessonMap.entries()).map(([lessonId, items]) => ({
    lessonId,
    lessonTitle: content.lessons.find((lesson) => lesson.id === lessonId)?.title ?? lessonId,
    evidenceItems: items.map(toEntry)
  }));

  const missions = Array.from(missionMap.entries()).map(([missionId, items]) => ({
    missionId,
    missionTitle: content.projectMissions.find((mission) => mission.id === missionId)?.title ?? missionId,
    evidenceItems: items.map(toEntry)
  }));

  const markdownSections: string[] = [
    `# ProofPath Reviewer-Ready Portfolio Evidence Packet`,
    ``,
    `**Export Date:** ${now}`,
    `**Career Track:** ${progress.profile.roleTargetId}`,
    `**Readiness Score (Practice Heuristic):** ${readiness.score}% (${readiness.label})`,
    ``,
    `> [!NOTE]`,
    `> This packet exports artifacts logged by the learner. Only "Locally verified (Code Lab)" entries were executed by ProofPath itself. Reproduction packages, pasted check output, and notes are learner-supplied and have not been independently executed or verified. This is not a validated hiring prediction.`,
    ``,
    `## Evidence Provenance Overview`,
    `- **Locally verified (Code Lab):** ${autoVerifiedCount}`,
    `- **Reproduction packages supplied (not executed by ProofPath):** ${reproductionPackageCount}`,
    `- **Self-reported checks & notes:** ${selfReportedCount}`,
    `- **Lesson-linked evidence:** ${evidenceItems.filter((item) => Boolean(item.linkedLessonId)).length}`,
    `- **Mission-linked evidence:** ${evidenceItems.filter((item) => Boolean(item.linkedProjectMissionId)).length}`,
    `- **Completed missions:** ${progress.completedProjectMissionIds.length}`,
    ``
  ];

  markdownSections.push(`## Lesson evidence`);
  if (lessons.length === 0) {
    markdownSections.push(`*No lesson evidence has been recorded yet.*`);
  } else {
    for (const lesson of lessons) {
      markdownSections.push(`### Lesson: ${lesson.lessonTitle} (\`${lesson.lessonId}\`)`);
      for (const entry of lesson.evidenceItems) {
        markdownSections.push(...entryLines(entry));
      }
      markdownSections.push(``);
    }
  }

  markdownSections.push(`## Project mission evidence`);
  if (missions.length === 0) {
    markdownSections.push(`*No mission evidence has been recorded yet.*`);
  } else {
    for (const mission of missions) {
      markdownSections.push(`### Mission: ${mission.missionTitle} (\`${mission.missionId}\`)`);
      for (const entry of mission.evidenceItems) {
        markdownSections.push(...entryLines(entry));
      }
      markdownSections.push(``);
    }
  }

  if (unlinked.length > 0) {
    markdownSections.push(`## Unlinked evidence`);
    for (const entry of unlinked.map(toEntry)) {
      markdownSections.push(...entryLines(entry));
    }
    markdownSections.push(``);
  }

  markdownSections.push(
    `## Limitations`,
    `- Only entries classified as "Locally verified (Code Lab)" were executed by ProofPath.`,
    `- Reproduction packages, pasted check output, and notes are self-reported and have not been independently verified.`,
    `- The readiness score is a practice-progress heuristic, not a validated hiring prediction.`,
    ``
  );

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
      reproductionPackageCount,
      selfReportedCount,
      lessonLinkedCount: evidenceItems.filter((item) => Boolean(item.linkedLessonId)).length,
      missionLinkedCount: evidenceItems.filter((item) => Boolean(item.linkedProjectMissionId)).length,
      completedMissionsCount: progress.completedProjectMissionIds.length
    },
    lessons,
    missions,
    evidenceItems: evidenceItems.map(safeEvidenceItem),
    markdownPacket: markdownSections.join("\n")
  };
}
