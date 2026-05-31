import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { createInitialProgress, setLessonCompletion, setRoleTarget } from "@/domain/progress";
import { calculateReadinessScore } from "@/domain/readiness";
import { getContentForRole, getMissionsForRole, getNextLessonForRole, getNextMissionForRole, getRoleTarget, getRoleTrackOnboardingSummary, getTracksForRole, isOnboardingComplete } from "@/domain/role-routing";

const NOW = "2026-05-04T16:50:00.000Z";

describe("role routing", () => {
  it("uses Software Foundations as the default path", () => {
    const progress = createInitialProgress(NOW);

    expect(getRoleTarget(progress.profile.roleTargetId).title).toBe("Software Foundations");
    expect(getTracksForRole(contentPack, progress.profile.roleTargetId).map((track) => track.id)).toContain("track-python");
    expect(isOnboardingComplete(progress.profile)).toBe(false);
  });

  it("normalizes legacy saved role IDs to the new career path IDs", () => {
    expect(getRoleTarget("role-ai-app-fullstack").id).toBe("path-ai-product-engineering");
  });

  it("routes path and missions from the selected role target", () => {
    const progress = setRoleTarget(
      createInitialProgress(NOW),
      "path-ai-product-engineering",
      true,
      "2026-05-04T16:51:00.000Z"
    );
    const tracks = getTracksForRole(contentPack, progress.profile.roleTargetId);
    const missions = getMissionsForRole(contentPack, progress.profile.roleTargetId);

    expect(isOnboardingComplete(progress.profile)).toBe(true);
    expect(tracks[0]?.id).toBe("track-typescript");
    expect(missions[0]?.id).toBe("mission-web-progress-board");
    expect(missions.map((mission) => mission.id)).toContain("mission-ai-study-planner");
  });

  it("selects the next unfinished lesson and mission inside the role path", () => {
    const progress = setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
    const withFirstLesson = setLessonCompletion(progress, "lesson-python-values", true, NOW);
    const withFirstMission = { ...withFirstLesson, completedProjectMissionIds: ["mission-cli-study-tracker"] };

    expect(getNextLessonForRole(contentPack, withFirstMission)?.id).toBe("lesson-python-collections");
    expect(getNextMissionForRole(contentPack, withFirstMission)?.id).toBe("mission-python-data-cleaner");
  });

  it("lists included and excluded tracks for onboarding copy", () => {
    const junior = getRoleTrackOnboardingSummary(contentPack, "path-software-foundations");
    const python = getRoleTrackOnboardingSummary(contentPack, "path-backend-api-data");

    expect(junior.trackCount).toBe(5);
    expect(junior.includedTrackTitles).toContain("Python Fundamentals");
    expect(junior.excludedTrackTitles).toContain("Practical AI Apps");
    expect(junior.excludedTrackTitles).toContain("ML Foundations");
    expect(python.excludedTrackTitles).toContain("AI-Assisted Coding");
    expect(python.excludedTrackTitles).toContain("Practical AI Apps");
  });

  it("can scope readiness inputs to the selected role path", () => {
    const roleProgress = setRoleTarget(createInitialProgress(NOW), "path-backend-api-data", true, NOW);
    const outOfRoleOnly = {
      ...roleProgress,
      completedProjectMissionIds: ["mission-ai-bug-rubric"],
      evidenceItems: [
        {
          id: "evidence-out-of-role",
          type: "repo" as const,
          title: "Out of role proof",
          body: "AI tools work should not inflate this role score.",
          linkedProjectMissionId: "mission-ai-bug-rubric",
          linkedSkillIds: ["skill-ai-verification"],
          testStatus: "passing" as const,
          readmeStatus: "complete" as const,
          createdAt: NOW
        }
      ]
    };
    const roleContent = getContentForRole(contentPack, roleProgress.profile.roleTargetId);
    const readiness = calculateReadinessScore(roleContent, outOfRoleOnly);

    expect(roleContent.tracks[0]?.id).toBe("track-python");
    expect(roleContent.projectMissions.map((mission) => mission.id)).not.toContain("mission-ai-bug-rubric");
    expect(readiness.breakdown.projectCompletion).toBe(0);
    expect(readiness.breakdown.evidenceHygiene).toBe(0);
  });
});
