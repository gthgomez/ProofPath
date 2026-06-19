import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { addEvidenceItem, createInitialProgress, setLessonCompletion, setMissionCompletion, setRoleTarget, ensureProgressProfile } from "@/domain/progress";
import { calculateReadinessScore } from "@/domain/readiness";
import { evaluatePathProofGate, getContentForRole, getFutureUnlocksForRole, getMissionsForRole, getNextLessonForRole, getNextMissionForRole, getRoleTarget, getRoleTrackOnboardingSummary, getTracksForRole, isOnboardingComplete, isGitTrackCompleted } from "@/domain/role-routing";

const NOW = "2026-05-04T16:50:00.000Z";

describe("role routing", () => {
  it("uses Software Foundations as the default path", () => {
    const progress = createInitialProgress(NOW);

    expect(getRoleTarget(progress.profile.roleTargetId).title).toBe("Intern Generalist");
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
    const lessonsToComplete = [
      "lesson-python-zero-files-folders",
      "lesson-python-zero-terminal",
      "lesson-python-zero-first-script",
      "lesson-python-zero-change-rerun",
      "lesson-python-zero-first-error",
      "lesson-python-values"
    ];
    let withFirstLesson = progress;
    for (const lessonId of lessonsToComplete) {
      withFirstLesson = setLessonCompletion(withFirstLesson, lessonId, true, NOW);
    }
    const withFirstMission = ensureProgressProfile({ ...withFirstLesson, completedProjectMissionIds: ["mission-cli-study-tracker"] });

    expect(getNextLessonForRole(contentPack, withFirstMission)?.id).toBe("lesson-python-collections");
    expect(getNextMissionForRole(contentPack, withFirstMission)?.id).toBe("mission-python-data-cleaner");
  });

  it("lists included and excluded tracks for onboarding copy", () => {
    const junior = getRoleTrackOnboardingSummary(contentPack, "path-software-foundations");
    const python = getRoleTrackOnboardingSummary(contentPack, "path-backend-api-data");

    expect(junior.trackCount).toBe(6);
    expect(junior.includedTrackTitles).toContain("Python Fundamentals");
    expect(junior.includedTrackTitles).toContain("Testing and Debugging");
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

  it("evaluates path proof gates and labels future unlocks", () => {
    const baseProgress = setRoleTarget(createInitialProgress(NOW), "path-secure-software-appsec", true, NOW);
    const mission = contentPack.projectMissions.find((candidate) => candidate.id === "mission-secure-review-pack");

    expect(mission).toBeTruthy();
    expect(evaluatePathProofGate(contentPack, baseProgress)?.complete).toBe(false);
    expect(getFutureUnlocksForRole(contentPack, baseProgress).map((unlock) => [unlock.id, unlock.label])).toContainEqual([
      "track-cloud-platform-basics",
      "Locked specialization"
    ]);
    expect(getFutureUnlocksForRole(contentPack, baseProgress).map((unlock) => [unlock.id, unlock.label])).toContainEqual([
      "track-ai-security",
      "Coming later"
    ]);

    const withEvidence = addEvidenceItem(baseProgress, {
      type: "repo",
      title: "Secure review proof",
      body: "This secure review pack names the feature-specific threats, controls, validation evidence, dependency risk, logging behavior, and residual security limits for the reviewed app slice.",
      linkedProjectMissionId: "mission-secure-review-pack",
      linkedSkillIds: ["skill-threat-modeling", "skill-secret-handling"],
      repoUrl: "https://github.com/example/secure-review",
      commitHash: "abcdef1",
      testStatus: "passing",
      readmeStatus: "complete",
      artifactUri: "https://example.com/security-review",
      verifierOutput: "security review checks passed",
      reflection: "The largest remaining risk is that the sample validator only covers one feature boundary."
    }, NOW);
    const completed = setMissionCompletion(withEvidence, mission!, true, NOW);

    expect(evaluatePathProofGate(contentPack, completed)?.complete).toBe(true);
    expect(getFutureUnlocksForRole(contentPack, completed).map((unlock) => [unlock.id, unlock.label])).toContainEqual([
      "track-cloud-platform-basics",
      "Roadmap"
    ]);
  });

  it("determines whether the Git track is completed", () => {
    const progress = createInitialProgress(NOW);
    
    // Initial status should be false
    expect(isGitTrackCompleted(contentPack, progress)).toBe(false);

    // Complete all lessons in the Git track
    const gitModules = contentPack.modules.filter((m) => m.trackId === "track-git");
    const gitLessons = gitModules.flatMap((m) => m.lessonIds);
    expect(gitLessons.length).toBeGreaterThan(0);

    let completedProgress = progress;
    for (const lessonId of gitLessons) {
      completedProgress = setLessonCompletion(completedProgress, lessonId, true, NOW);
    }

    // Now it should return true
    expect(isGitTrackCompleted(contentPack, completedProgress)).toBe(true);
  });
});
