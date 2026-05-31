import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { addEvidenceItem, createInitialProgress, generateWeeklyReport, recordReview, setLessonCompletion, setMissionCompletion, setMissionDeliverableCompletion, setRoleTarget } from "@/domain/progress";
import { getContentForRole } from "@/domain/role-routing";
import { createWeeklyReportSnapshot } from "@/domain/weekly-report";

const NOW = "2026-05-04T19:00:00.000Z";

function createProofProgress() {
  const roleProgress = setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
  const withLesson = setLessonCompletion(roleProgress, "lesson-python-functions", true, NOW);
  const mission = contentPack.projectMissions.find((candidate) => candidate.id === "mission-cli-study-tracker")!;
  const withDeliverables = mission.deliverables.reduce(
    (currentProgress, _deliverable, index) => setMissionDeliverableCompletion(currentProgress, mission.id, index, true, NOW),
    withLesson
  );
  const withEvidence = addEvidenceItem(withDeliverables, {
    type: "test-output",
    title: "CLI tracker tests",
    body: "Verifier output for the completed CLI Study Tracker mission.",
    linkedProjectMissionId: "mission-cli-study-tracker",
    linkedSkillIds: ["skill-python-functions", "skill-testing-debugging"],
    repoUrl: "https://github.com/example/cli-study-tracker",
    commitHash: "abc1234",
    testStatus: "passing",
    readmeStatus: "complete",
    verifierOutput: "pytest",
    reflection: "This proof shows the tracker can be run and verified from a clean repo."
  }, "2026-05-05T19:05:00.000Z");
  const withMission = setMissionCompletion(withEvidence, mission, true, NOW);

  return recordReview(withMission, "lesson", "lesson-python-functions", "good", "2026-05-05T19:00:00.000Z");
}

describe("weekly career reports", () => {
  it("generates evidence-backed weekly snapshots", () => {
    const progress = createProofProgress();
    const roleContent = getContentForRole(contentPack, progress.profile.roleTargetId);
    const report = createWeeklyReportSnapshot(roleContent, progress, "2026-05-06T19:00:00.000Z");

    expect(report.weekStart).toBe("2026-05-04");
    expect(report.lessonsCompleted).toBe(1);
    expect(report.missionsCompleted).toBe(1);
    expect(report.passingEvidenceCount).toBe(1);
    expect(report.reviewEventsCount).toBe(1);
    expect(report.summary).toContain("passing proof");
    expect(report.portfolioSummary).toContain("CLI Study Tracker");
    expect(report.portfolioBullets?.[0]).toContain("Built CLI Study Tracker");
  });

  it("stores one snapshot per week and replaces regenerated reports", () => {
    const progress = createProofProgress();
    const roleContent = getContentForRole(contentPack, progress.profile.roleTargetId);
    const first = generateWeeklyReport(progress, roleContent, "2026-05-06T19:00:00.000Z");
    const second = generateWeeklyReport(first, roleContent, "2026-05-07T19:00:00.000Z");

    expect(second.weeklyReports).toHaveLength(1);
    expect(second.weeklyReports[0]?.generatedAt).toBe("2026-05-07T19:00:00.000Z");
  });

  it("keeps same-week reports separate per role", () => {
    const junior = createProofProgress();
    const juniorContent = getContentForRole(contentPack, junior.profile.roleTargetId);
    const withJuniorReport = generateWeeklyReport(junior, juniorContent, "2026-05-06T19:00:00.000Z");
    const aiRole = setRoleTarget(withJuniorReport, "path-ai-product-engineering", true, "2026-05-06T20:00:00.000Z");
    const aiContent = getContentForRole(contentPack, aiRole.profile.roleTargetId);
    const withAiReport = generateWeeklyReport(aiRole, aiContent, "2026-05-06T21:00:00.000Z");

    expect(withAiReport.weeklyReports).toHaveLength(2);
    expect(withAiReport.weeklyReports.map((report) => report.roleTargetId)).toEqual([
      "path-ai-product-engineering",
      "path-software-foundations"
    ]);
  });

  it("does not count legacy passing evidence without verifier output as proof", () => {
    const roleProgress = setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
    const legacyEvidence = {
      ...roleProgress,
      evidenceItems: [
        {
          id: "legacy-passing",
          type: "repo" as const,
          title: "Legacy imported repo",
          body: "Old data said passing but had no verifier output.",
          linkedProjectMissionId: "mission-cli-study-tracker",
          linkedSkillIds: ["skill-portfolio-evidence"],
          repoUrl: "https://github.com/example/legacy",
          testStatus: "passing" as const,
          readmeStatus: "complete" as const,
          createdAt: NOW
        }
      ]
    };
    const roleContent = getContentForRole(contentPack, roleProgress.profile.roleTargetId);
    const report = createWeeklyReportSnapshot(roleContent, legacyEvidence, NOW);

    expect(report.passingEvidenceCount).toBe(0);
    expect(report.risks).toContain("No passing verifier-backed evidence is attached to this career path.");
  });
});
