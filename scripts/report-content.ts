import { contentPack } from "../src/content/seed";
import { roleTargets } from "../src/content/roles";

console.log("=== CONTENT PACK DETERMINISTIC REPORT ===");

// 1. Basic counts
const totalTracks = contentPack.tracks.length;
const totalModules = contentPack.modules.length;
const totalLessons = contentPack.lessons.length;
const totalMissions = contentPack.projectMissions.length;

console.log(`Total Tracks: ${totalTracks}`);
console.log(`Total Modules: ${totalModules}`);
console.log(`Total Lessons: ${totalLessons}`);
console.log(`Total Missions: ${totalMissions}`);
console.log("");

// 2. Maps & Sets for validation
const trackIds = new Set(contentPack.tracks.map((t) => t.id));
const moduleIds = new Set(contentPack.modules.map((m) => m.id));
const lessonIds = new Set(contentPack.lessons.map((l) => l.id));
const quizIds = new Set(contentPack.quizzes.map((q) => q.id));
const missionIds = new Set(contentPack.projectMissions.map((m) => m.id));
const skillIds = new Set(contentPack.skills.map((s) => s.id));

const errors: string[] = [];
const warnings: string[] = [];

// 3. Duplicate checks
function checkDuplicates(label: string, ids: string[]): void {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    }
    seen.add(id);
  }
  if (duplicates.size > 0) {
    errors.push(`Duplicate IDs found in ${label}: ${Array.from(duplicates).join(", ")}`);
  }
}

checkDuplicates("Tracks", contentPack.tracks.map((t) => t.id));
checkDuplicates("Modules", contentPack.modules.map((m) => m.id));
checkDuplicates("Lessons", contentPack.lessons.map((l) => l.id));
checkDuplicates("Quizzes", contentPack.quizzes.map((q) => q.id));
checkDuplicates("Missions", contentPack.projectMissions.map((m) => m.id));
checkDuplicates("Skills", contentPack.skills.map((s) => s.id));

// 4. Missing required fields check (titles, descriptions, etc.)
for (const track of contentPack.tracks) {
  if (!track.title?.trim()) errors.push(`Track ${track.id} is missing a title`);
  if (!track.summary?.trim()) errors.push(`Track ${track.id} is missing a summary`);
}
for (const mod of contentPack.modules) {
  if (!mod.title?.trim()) errors.push(`Module ${mod.id} is missing a title`);
  if (!mod.summary?.trim()) errors.push(`Module ${mod.id} is missing a summary`);
}
for (const lesson of contentPack.lessons) {
  if (!lesson.title?.trim()) errors.push(`Lesson ${lesson.id} is missing a title`);
  if (!lesson.summary?.trim()) errors.push(`Lesson ${lesson.id} is missing a summary`);
}
for (const quiz of contentPack.quizzes) {
  if (!quiz.title?.trim()) errors.push(`Quiz ${quiz.id} is missing a title`);
}
for (const mission of contentPack.projectMissions) {
  if (!mission.title?.trim()) errors.push(`Mission ${mission.id} is missing a title`);
  if (!mission.brief?.trim()) errors.push(`Mission ${mission.id} is missing a brief`);
}
for (const skill of contentPack.skills) {
  if (!skill.name?.trim()) errors.push(`Skill ${skill.id} is missing a name`);
}

// 5. Orphaned references validation
function assertRef(label: string, sourceId: string, refIds: string[], knownIds: Set<string>): void {
  for (const refId of refIds) {
    if (!knownIds.has(refId)) {
      errors.push(`${label} "${sourceId}" references unknown ID: "${refId}"`);
    }
  }
}

for (const track of contentPack.tracks) {
  assertRef("Track modules", track.id, track.moduleIds, moduleIds);
}
for (const mod of contentPack.modules) {
  assertRef("Module track", mod.id, [mod.trackId], trackIds);
  assertRef("Module lessons", mod.id, mod.lessonIds, lessonIds);
  assertRef("Module missions", mod.id, mod.projectMissionIds, missionIds);
  assertRef("Module skills", mod.id, mod.skillIds, skillIds);
}
for (const lesson of contentPack.lessons) {
  assertRef("Lesson module", lesson.id, [lesson.moduleId], moduleIds);
  assertRef("Lesson skills", lesson.id, lesson.skillIds, skillIds);
  assertRef("Lesson quiz", lesson.id, [lesson.quizId], quizIds);
}
for (const quiz of contentPack.quizzes) {
  assertRef("Quiz lesson", quiz.id, [quiz.lessonId], lessonIds);
}
for (const mission of contentPack.projectMissions) {
  assertRef("Mission track", mission.id, [mission.trackId], trackIds);
  assertRef("Mission skills", mission.id, mission.skillIds, skillIds);
}
for (const roleTarget of roleTargets) {
  assertRef("Role target tracks", roleTarget.id, roleTarget.trackIds, trackIds);
}

// 6. Metrics: lessons & missions per track, thin coverage warnings
console.log("Lessons and Missions per Track:");
for (const track of contentPack.tracks) {
  const lessonsInTrack = new Set<string>();
  const missionsInTrack = new Set<string>();

  for (const moduleId of track.moduleIds) {
    const mod = contentPack.modules.find((m) => m.id === moduleId);
    if (mod) {
      for (const lessonId of mod.lessonIds) {
        lessonsInTrack.add(lessonId);
      }
      for (const missionId of mod.projectMissionIds) {
        missionsInTrack.add(missionId);
      }
    }
  }

  // Double check directly linked trackId on missions
  const directMissions = contentPack.projectMissions.filter((m) => m.trackId === track.id);
  for (const dm of directMissions) {
    missionsInTrack.add(dm.id);
  }

  const lessonCount = lessonsInTrack.size;
  const missionCount = missionsInTrack.size;

  console.log(`- Track "${track.id}" (${track.title}): ${lessonCount} lessons, ${missionCount} missions`);

  // Warning: thin track coverage
  if (lessonCount < 3) {
    warnings.push(`Track "${track.id}" has thin lesson coverage: only ${lessonCount} lessons.`);
  }
  if (missionCount < 1) {
    warnings.push(`Track "${track.id}" has thin mission coverage: no project missions found.`);
  }
}
console.log("");

// 7. Lessons with Code Runner Specs
const lessonsWithRunner = contentPack.lessons.filter((l) => {
  const spec = l.workshop?.miniProject?.runnerSpec;
  return spec && spec.language && spec.starterCode;
});
console.log(`Lessons with Code Runner Specs: ${lessonsWithRunner.length}`);

// 8. Lessons with Quizzes
const lessonsWithQuizzes = contentPack.lessons.filter((l) => l.quizId && quizIds.has(l.quizId));
console.log(`Lessons with Quizzes: ${lessonsWithQuizzes.length}`);

// 9. Missions requiring evidence/proof
const missionsRequiringEvidence = contentPack.projectMissions.filter((m) => {
  const req = m.evidenceRequirements;
  return req.repoUrl || req.commitHash || req.passingVerifierOutput ||
         req.readmeStatus !== "missing" || req.artifactOrDeployment || req.reflection;
});
console.log(`Missions requiring Evidence/Proof: ${missionsRequiringEvidence.length}`);
console.log("");

// 10. Warnings output
if (warnings.length > 0) {
  console.log("=== WARNINGS (THIN COVERAGE) ===");
  for (const warn of warnings) {
    console.warn(`[WARN] ${warn}`);
  }
  console.log("");
}

// 11. Errors and exit code handling
if (errors.length > 0) {
  console.error("=== INTEGRITY FAILURES ===");
  for (const err of errors) {
    console.error(`[ERROR] ${err}`);
  }
  console.error(`\nReport failed with ${errors.length} integrity errors.`);
  process.exit(1);
} else {
  console.log("Integrity validation: SUCCESS. No orphan references, duplicate IDs, or missing required fields found.");
  process.exit(0);
}
