import type { UserProgress } from "@/domain/types";
import { PATH_SOFTWARE_FOUNDATIONS_ID } from "@/content/roles";

export const demoProgress: UserProgress = {
  profile: {
    roleTargetId: PATH_SOFTWARE_FOUNDATIONS_ID,
    onboardingCompletedAt: "2026-05-04T12:00:00.000Z",
    createdAt: "2026-05-04T12:00:00.000Z",
    updatedAt: "2026-05-04T12:15:00.000Z"
  },
  completedLessonIds: [
    "lesson-python-values",
    "lesson-git-evidence"
  ],
  completedLessonMiniProjectIds: [
    "lesson-python-values",
    "lesson-git-evidence"
  ],
  completedQuizIds: [
    "quiz-python-values"
  ],
  completedProjectMissionIds: [
    "mission-portfolio-readme"
  ],
  completedProjectMissionDeliverableIds: [
    "mission-portfolio-readme:0",
    "mission-portfolio-readme:1",
    "mission-portfolio-readme:2"
  ],
  completedProjectMissionPhaseIds: [
    "mission-portfolio-readme:portfolio-readme-plan",
    "mission-portfolio-readme:portfolio-readme-build",
    "mission-portfolio-readme:portfolio-readme-verify"
  ],
  quizAttempts: [
    {
      id: "quiz-attempt-demo-python",
      quizId: "quiz-python-values",
      selectedChoiceIndexes: [0, 1, 0],
      score: 100,
      passed: true,
      attemptedAt: "2026-05-04T12:08:00.000Z"
    }
  ],
  codeRunAttempts: [],
  weeklyPlanTaskIds: [
    "task-git-readme"
  ],
  reviewItems: [],
  reviewEvents: [
    {
      id: "review-demo-git-evidence",
      targetType: "lesson",
      targetId: "lesson-git-evidence",
      rating: "good",
      reviewedAt: "2026-05-04T12:12:00.000Z",
      nextDueAt: "2026-05-05T12:12:00.000Z",
      intervalDays: 1
    }
  ],
  weeklyReports: [],
  evidenceItems: [
    {
      id: "evidence-readme-setup",
      type: "repo",
      title: "README setup proof",
      body: "Practice repo now lists install, run, and verification commands.",
      linkedProjectMissionId: "mission-portfolio-readme",
      linkedSkillIds: ["skill-git-workflow", "skill-portfolio-evidence"],
      repoUrl: "https://github.com/example/practice-repo",
      commitHash: "abc1234",
      testStatus: "passing",
      artifactUri: "https://github.com/example/practice-repo#screenshot",
      readmeStatus: "complete",
      verifierOutput: "npm test",
      reflection: "The README now lets a reviewer run and verify the project.",
      createdAt: "2026-05-04T12:00:00.000Z"
    },
    {
      id: "evidence-test-output",
      type: "test-output",
      title: "Verification command",
      body: "Captured the exact command and pass/fail result for the practice repo.",
      linkedProjectMissionId: "mission-portfolio-readme",
      linkedSkillIds: ["skill-testing-debugging", "skill-portfolio-evidence"],
      testStatus: "passing",
      readmeStatus: "basic",
      verifierOutput: "npm run verify",
      createdAt: "2026-05-04T12:10:00.000Z"
    }
  ],
  updatedAt: "2026-05-04T12:15:00.000Z"
};
