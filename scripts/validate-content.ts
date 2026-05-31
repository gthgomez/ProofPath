import { contentPack } from "../src/content/seed";
import { roleTargets } from "../src/content/roles";
import { contentPackSchema, roleTargetSchema } from "../src/domain/schemas";

function assertKnownIds(label: string, ids: string[], knownIds: Set<string>, errors: string[]): void {
  for (const id of ids) {
    if (!knownIds.has(id)) {
      errors.push(`${label} references unknown id: ${id}`);
    }
  }
}

const parsed = contentPackSchema.safeParse(contentPack);
const parsedRoleTargets = roleTargetSchema.array().safeParse(roleTargets);

if (!parsed.success) {
  console.error(parsed.error.format());
  process.exit(1);
}

if (!parsedRoleTargets.success) {
  console.error(parsedRoleTargets.error.format());
  process.exit(1);
}

const trackIds = new Set(contentPack.tracks.map((track) => track.id));
const moduleIds = new Set(contentPack.modules.map((moduleItem) => moduleItem.id));
const lessonIds = new Set(contentPack.lessons.map((lesson) => lesson.id));
const quizIds = new Set(contentPack.quizzes.map((quiz) => quiz.id));
const missionIds = new Set(contentPack.projectMissions.map((mission) => mission.id));
const skillIds = new Set(contentPack.skills.map((skill) => skill.id));
const errors: string[] = [];

for (const track of contentPack.tracks) {
  assertKnownIds(`track ${track.id}`, track.moduleIds, moduleIds, errors);
}

for (const roleTarget of roleTargets) {
  assertKnownIds(`role target ${roleTarget.id}`, roleTarget.trackIds, trackIds, errors);
}

for (const moduleItem of contentPack.modules) {
  assertKnownIds(`module ${moduleItem.id}`, [moduleItem.trackId], trackIds, errors);
  assertKnownIds(`module ${moduleItem.id}`, moduleItem.lessonIds, lessonIds, errors);
  assertKnownIds(`module ${moduleItem.id}`, moduleItem.projectMissionIds, missionIds, errors);
  assertKnownIds(`module ${moduleItem.id}`, moduleItem.skillIds, skillIds, errors);
}

for (const lesson of contentPack.lessons) {
  assertKnownIds(`lesson ${lesson.id}`, [lesson.moduleId], moduleIds, errors);
  assertKnownIds(`lesson ${lesson.id}`, lesson.skillIds, skillIds, errors);
  assertKnownIds(`lesson ${lesson.id}`, [lesson.quizId], quizIds, errors);

  if (lesson.workshop.commonMistakes.length < 2) {
    errors.push(`lesson ${lesson.id} needs at least two common mistakes for workshop depth`);
  }

  if (lesson.workshop.synopsis.length < 80) {
    errors.push(`lesson ${lesson.id} needs a beginner-friendly synopsis`);
  }

  if (lesson.workshop.prerequisites.length < 2) {
    errors.push(`lesson ${lesson.id} needs at least two beginner prerequisites`);
  }

  if (lesson.workshop.tools.length < 2) {
    errors.push(`lesson ${lesson.id} needs concrete language/tool labels`);
  }

  if (lesson.workshop.practice.starterCode.length < 40) {
    errors.push(`lesson ${lesson.id} needs starter code or a starter artifact before the quiz`);
  }

  if (lesson.workshop.practice.expectedOutput.length < 20) {
    errors.push(`lesson ${lesson.id} needs expected output before the quiz`);
  }

  if (lesson.workshop.practice.checkYourAnswer.length < 50) {
    errors.push(`lesson ${lesson.id} needs a check-your-answer explanation before the quiz`);
  }

  for (const [repIndex, practiceRep] of (lesson.workshop.practiceReps ?? []).entries()) {
    if (practiceRep.starterCode.length < 40) {
      errors.push(`lesson ${lesson.id} practice rep ${repIndex + 1} needs starter code`);
    }

    if (practiceRep.expectedOutput.length < 20) {
      errors.push(`lesson ${lesson.id} practice rep ${repIndex + 1} needs expected output`);
    }

    if (practiceRep.checkYourAnswer.length < 50) {
      errors.push(`lesson ${lesson.id} practice rep ${repIndex + 1} needs check-your-answer guidance`);
    }
  }

  if (lesson.workshop.miniProject.steps.length < 3) {
    errors.push(`lesson ${lesson.id} needs at least three mini-project steps`);
  }

  if (lesson.workshop.miniProject.deliverables.length < 3) {
    errors.push(`lesson ${lesson.id} needs concrete mini-project deliverables`);
  }

  if (lesson.workshop.miniProject.expectedEvidence.length < 60) {
    errors.push(`lesson ${lesson.id} needs mini-project evidence guidance`);
  }

  if (lesson.workshop.miniProject.tester.requiredOutputIncludes.length === 0) {
    errors.push(`lesson ${lesson.id} needs mini-project output checks`);
  }

  if (lesson.workshop.miniProject.tester.forbiddenOutputIncludes.length === 0) {
    errors.push(`lesson ${lesson.id} needs mini-project error markers`);
  }

  if (lesson.workshop.miniProject.runnerSpec.allowNetwork !== false) {
    errors.push(`lesson ${lesson.id} sandbox must disable network access`);
  }

  if (lesson.workshop.miniProject.runnerSpec.visibleTests.length === 0) {
    errors.push(`lesson ${lesson.id} sandbox needs visible tests`);
  }

  if (lesson.workshop.miniProject.runnerSpec.starterCode.trim().length < 20) {
    errors.push(`lesson ${lesson.id} sandbox needs starter code`);
  }

  if (lesson.workshop.miniProject.runnerSpec.expectedOutput.length === 0) {
    errors.push(`lesson ${lesson.id} sandbox needs expected output markers`);
  }

  if (lesson.workshop.miniProject.runnerSpec.timeoutMs > 10000) {
    errors.push(`lesson ${lesson.id} sandbox timeout must stay under 10 seconds`);
  }

  if ((lesson.workshop.miniProject.runnerSpec.memoryLimitMb ?? 0) > 256) {
    errors.push(`lesson ${lesson.id} sandbox memory budget is too high for beginner lessons`);
  }

  if (lesson.workshop.miniProject.runnerSpec.language === "python" && lesson.workshop.miniProject.runnerSpec.hiddenTests.length === 0) {
    errors.push(`lesson ${lesson.id} Python sandbox needs at least one hidden test`);
  }
}

for (const quiz of contentPack.quizzes) {
  assertKnownIds(`quiz ${quiz.id}`, [quiz.lessonId], lessonIds, errors);
}

for (const mission of contentPack.projectMissions) {
  assertKnownIds(`mission ${mission.id}`, [mission.trackId], trackIds, errors);
  assertKnownIds(`mission ${mission.id}`, mission.skillIds, skillIds, errors);

  const phaseIds = new Set(mission.phases.map((phase) => phase.id));
  if (phaseIds.size !== mission.phases.length) {
    errors.push(`mission ${mission.id} has duplicate phase ids`);
  }

  if (mission.difficulty === "portfolio" && mission.evidenceRequirements.readmeStatus !== "complete") {
    errors.push(`portfolio mission ${mission.id} must require a complete README`);
  }

  if (mission.evidenceRequirements.passingVerifierOutput && mission.verificationCommands.length === 0) {
    errors.push(`mission ${mission.id} requires verifier output but has no verification commands`);
  }
}

if (contentPack.projectMissions.length < 10) {
  errors.push("content pack needs at least 10 project missions for the flagship depth ladder");
}

for (const edge of contentPack.skillEdges) {
  assertKnownIds("skill edge", [edge.fromSkillId, edge.toSkillId], skillIds, errors);
}

const taskLinkedLessonIds = contentPack.weeklyPlan.tasks
  .map((task) => task.linkedLessonId)
  .filter((id): id is string => Boolean(id));
const taskLinkedMissionIds = contentPack.weeklyPlan.tasks
  .map((task) => task.linkedProjectMissionId)
  .filter((id): id is string => Boolean(id));

assertKnownIds("weekly plan task", taskLinkedLessonIds, lessonIds, errors);
assertKnownIds("weekly plan task", taskLinkedMissionIds, missionIds, errors);

const pythonWorkshopLessonCount = contentPack.lessons.filter((lesson) => lesson.moduleId === "module-python-core").length;
if (pythonWorkshopLessonCount < 4) {
  errors.push("Python depth pack needs at least 4 workshop lessons");
}

if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(
  `Validated ${contentPack.tracks.length} tracks, ${contentPack.lessons.length} lessons, ${contentPack.quizzes.length} quizzes, and ${contentPack.projectMissions.length} missions.`
);
