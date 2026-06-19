import { contentPack } from "../src/content/seed";
import { roleTargets } from "../src/content/roles";
import { generatePythonAuditRows } from "../src/domain/content-audit";
import type { ContentPack, Quiz } from "../src/domain/types";
import * as fs from "fs";
import * as path from "path";

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

// 9.5 Teachability Depth metrics and Python Content Audit
const reviewQueueTestPath = path.resolve(process.cwd(), "tests/review-queue.test.ts");
const weeklyReportTestPath = path.resolve(process.cwd(), "tests/weekly-report.test.ts");
const reviewQueueTestContent = fs.existsSync(reviewQueueTestPath) ? fs.readFileSync(reviewQueueTestPath, "utf8") : "";
const weeklyReportTestContent = fs.existsSync(weeklyReportTestPath) ? fs.readFileSync(weeklyReportTestPath, "utf8") : "";

const pythonLessons = contentPack.lessons.filter(l => l.id.startsWith("lesson-python") || l.workshop?.language?.toLowerCase() === "python");
const activePythonModules = contentPack.modules.filter(m => m.trackId === "track-python").sort((a, b) => a.sortOrder - b.sortOrder);
const activeModuleLessonIds = activePythonModules.flatMap(m => m.lessonIds);
const activeModuleLessonSet = new Set(activeModuleLessonIds);

const auditList = pythonLessons.map(lesson => {
  const isDeprecated = !!lesson.curriculum?.deprecated;
  const isHiddenLegacy = !!lesson.curriculum?.legacyEvidenceOnly;
  const isInActiveModuleList = activeModuleLessonSet.has(lesson.id);

  let status: "active" | "deprecated" | "hidden" = "active";
  if (isDeprecated) {
    status = "deprecated";
  } else if (isHiddenLegacy) {
    status = "hidden";
  } else if (!isInActiveModuleList) {
    status = "hidden";
  }

  const inReviewQueue = reviewQueueTestContent.includes(lesson.id);
  const inWeeklyReport = weeklyReportTestContent.includes(lesson.id);
  const isMissionSupported = contentPack.projectMissions.some(m => m.curriculum?.supportedLessonIds?.includes(lesson.id));

  return {
    lesson,
    status,
    inReviewQueue,
    inWeeklyReport,
    isMissionSupported,
    isInActiveModuleList
  };
});

console.log("=== PYTHON LESSONS AUDIT ===");
const activeInOrder = auditList.filter(item => item.status === "active" && item.isInActiveModuleList);
const activeNotInOrder = auditList.filter(item => item.status === "active" && !item.isInActiveModuleList);
const deprecatedList = auditList.filter(item => item.status === "deprecated");
const hiddenList = auditList.filter(item => item.status === "hidden");

const printGroup = (title: string, list: typeof auditList) => {
  console.log(`\n--- ${title} (${list.length}) ---`);
  for (const item of list) {
    const l = item.lesson;
    const curr = l.curriculum;
    const depth = l.depth;
    const bridge = depth?.codeLabBridge ? "codeLabBridge" : (depth ? "nonRunnerBridge" : "none");

    console.log(`Lesson ID: ${l.id}`);
    console.log(`  Title: ${l.title}`);
    console.log(`  Level: ${curr?.level ?? "none"}`);
    console.log(`  Status: ${item.status}`);
    console.log(`  Replaces Lesson IDs: ${curr?.replacesLessonIds ? curr.replacesLessonIds.join(", ") : "none"}`);
    console.log(`  Replaced By Lesson IDs: ${curr?.replacedByLessonIds ? curr.replacedByLessonIds.join(", ") : "none"}`);
    console.log(`  Has Curriculum: ${curr ? "yes" : "no"}`);
    console.log(`  Has Depth: ${depth ? "yes" : "no"}`);
    console.log(`  Teaches: ${curr?.teaches ? curr.teaches.join(", ") : "none"}`);
    console.log(`  Visible Code Concepts: ${curr?.visibleCodeConcepts ? curr.visibleCodeConcepts.join(", ") : "none"}`);
    console.log(`  Capsule Count: ${depth?.conceptCapsules?.length ?? 0}`);
    console.log(`  Bridge: ${bridge}`);
    console.log(`  Evidence Proof Outputs: ${curr?.proofOutputs ? curr.proofOutputs.join(", ") : "none"}`);
    console.log(`  Appears in Review Queue Targets: ${item.inReviewQueue ? "yes" : "no"}`);
    console.log(`  Appears in Weekly Report Tests: ${item.inWeeklyReport ? "yes" : "no"}`);
    console.log(`  Appears in Mission Supported Lessons: ${item.isMissionSupported ? "yes" : "no"}`);
  }
};

printGroup("ACTIVE LESSONS (IN ORDER)", activeInOrder);
printGroup("ACTIVE LESSONS (NOT IN ORDER)", activeNotInOrder);
printGroup("DEPRECATED LESSONS", deprecatedList);
printGroup("HIDDEN/LEGACY LESSONS", hiddenList);

// Strict-ready checks for Level 0 Python lessons
console.log("\n=== LEVEL 0 PYTHON STRICT-READY REPORT ===");
const level0PythonLessons = pythonLessons.filter(l => l.curriculum?.level === 0);
for (const l of level0PythonLessons) {
  const hasCurr = !!l.curriculum;
  const hasDepth = !!l.depth;
  const hasCapsules = !!l.depth && (l.depth.conceptCapsules?.length ?? 0) > 0;
  const hasBridge = !!l.depth?.codeLabBridge;

  const stripComments = (code: string) => {
    return code.split("\n").map(line => {
      const idx = line.indexOf("#");
      return idx !== -1 ? line.substring(0, idx) : line;
    }).join("\n");
  };
  const starterCode = stripComments(l.workshop?.practice?.starterCode || "");
  const practiceExpected = stripComments(l.workshop?.practice?.expectedOutput || "");
  const runnerStarter = stripComments(l.workshop?.miniProject?.runnerSpec?.starterCode || "");
  const forbiddenRegex = /\b(for|while|def|import)\b/;
  const forbiddenStarter = forbiddenRegex.test(starterCode);
  const forbiddenExpected = forbiddenRegex.test(practiceExpected);
  const forbiddenRunner = forbiddenRegex.test(runnerStarter);
  const forbiddenSyntaxFail = forbiddenStarter || forbiddenExpected || forbiddenRunner;

  const testCode = l.workshop?.miniProject?.runnerSpec?.visibleTests?.map(t => t.code).join("\n") || "";
  const hiddenTestCode = l.workshop?.miniProject?.runnerSpec?.hiddenTests?.map(t => t.code).join("\n") || "";
  const checkAssertions = testCode.includes("assert") || hiddenTestCode.includes("assert") || testCode.includes("raise") || hiddenTestCode.includes("raise");
  const checkerAssertionsPass = (l.curriculum?.lessonKind !== "run_file" && l.curriculum?.lessonKind !== "debug_repair") || checkAssertions;

  const nonLocalEvidence = (l.curriculum?.proofOutputs || []).some(
    p => p === "github_repo_url" || p === "git_commit" || p === "ci_run"
  );
  const localEvidencePass = !nonLocalEvidence;

  const quiz = contentPack.quizzes.find(q => q.id === l.quizId);
  const quizCoveragePass = !!quiz && quiz.questions.length > 0;

  const gitRegex = /\b(git|github|clone|push|commit|repo)\b/i;
  const textToSearch = [
    l.title,
    l.summary,
    l.bodyMarkdown,
    l.desktopTask,
    l.evidencePrompt,
    l.workshop?.objective || "",
    l.workshop?.whyItMatters || "",
    l.workshop?.coreConcept || "",
    l.workshop?.workedExample || "",
    l.workshop?.guidedExercise || "",
    l.workshop?.missionConnection || "",
    l.workshop?.reflectionPrompt || "",
    l.workshop?.practice?.checkYourAnswer || "",
    l.workshop?.miniProject?.title || "",
    l.workshop?.miniProject?.goal || "",
    l.workshop?.miniProject?.expectedEvidence || "",
    l.workshop?.miniProject?.projectConnection || ""
  ].join("\n");
  const prematureGitFail = gitRegex.test(textToSearch);

  const isStrictReady = 
    hasCurr &&
    hasDepth &&
    hasCapsules &&
    hasBridge &&
    !forbiddenSyntaxFail &&
    checkerAssertionsPass &&
    localEvidencePass &&
    quizCoveragePass &&
    !prematureGitFail;

  console.log(`Lesson ID: ${l.id} (${l.title})`);
  console.log(`  - Curriculum metadata coverage: ${hasCurr ? "PASS" : "FAIL"}`);
  console.log(`  - Depth metadata coverage: ${hasDepth ? "PASS" : "FAIL"}`);
  console.log(`  - Capsule coverage: ${hasCapsules ? "PASS" : "FAIL"}`);
  console.log(`  - Bridge coverage: ${hasBridge ? "PASS" : "FAIL"}`);
  console.log(`  - Learner-facing forbidden syntax checks: ${!forbiddenSyntaxFail ? "PASS" : "FAIL"}`);
  console.log(`  - Checker assertions inside checker scripts: ${checkerAssertionsPass ? "PASS" : "FAIL"}`);
  console.log(`  - Local evidence compliance: ${localEvidencePass ? "PASS" : "FAIL"}`);
  console.log(`  - Quiz concept coverage: ${quizCoveragePass ? "PASS" : "FAIL"}`);
  console.log(`  - Premature Git/GitHub terms check: ${!prematureGitFail ? "PASS" : "FAIL"}`);
  console.log(`  - FINAL STRICT-READY: ${isStrictReady ? "YES" : "NO"}`);
}

// Choice index distribution globally, in Python, and by level/module
console.log("\n=== DETAILED QUIZ ANSWER INDEX DISTRIBUTION ===");

// Global
const globalDistribution: Record<number, number> = {};
let globalTotal = 0;
for (const quiz of contentPack.quizzes) {
  for (const q of quiz.questions) {
    const idx = q.correctChoiceIndex;
    globalDistribution[idx] = (globalDistribution[idx] ?? 0) + 1;
    globalTotal++;
  }
}
console.log("Global Distribution:");
for (const [idxStr, count] of Object.entries(globalDistribution).sort()) {
  const idx = parseInt(idxStr, 10);
  const pct = ((count / globalTotal) * 100).toFixed(1);
  console.log(`  - Choice Index ${idx}: ${count} questions (${pct}%)`);
}

// Python
const pythonQuizzes = contentPack.quizzes.filter(q => {
  const lessonObj = contentPack.lessons.find(l => l.id === q.lessonId);
  return q.id.startsWith("quiz-python") || (lessonObj && (lessonObj.id.startsWith("lesson-python") || lessonObj.workshop?.language?.toLowerCase() === "python"));
});

const pythonDistribution: Record<number, number> = {};
let pythonTotal = 0;
for (const quiz of pythonQuizzes) {
  for (const q of quiz.questions) {
    const idx = q.correctChoiceIndex;
    pythonDistribution[idx] = (pythonDistribution[idx] ?? 0) + 1;
    pythonTotal++;
  }
}
console.log("\nPython Track Distribution:");
for (const [idxStr, count] of Object.entries(pythonDistribution).sort()) {
  const idx = parseInt(idxStr, 10);
  const pct = ((count / pythonTotal) * 100).toFixed(1);
  console.log(`  - Choice Index ${idx}: ${count} questions (${pct}%)`);
}

// By Python Level
const pythonQuizzesByLevel: Record<number, Quiz[]> = {};
for (const quiz of pythonQuizzes) {
  const lessonObj = contentPack.lessons.find(l => l.id === quiz.lessonId);
  const lvl = lessonObj?.curriculum?.level ?? 0;
  if (!pythonQuizzesByLevel[lvl]) pythonQuizzesByLevel[lvl] = [];
  pythonQuizzesByLevel[lvl].push(quiz);
}

console.log("\nPython Track Distribution by Level:");
for (const level of Object.keys(pythonQuizzesByLevel).map(Number).sort()) {
  const quizzes = pythonQuizzesByLevel[level];
  const dist: Record<number, number> = {};
  let total = 0;
  for (const quiz of quizzes) {
    for (const q of quiz.questions) {
      const idx = q.correctChoiceIndex;
      dist[idx] = (dist[idx] ?? 0) + 1;
      total++;
    }
  }
  console.log(`  - Level ${level} (Total Questions: ${total}):`);
  for (const [idxStr, count] of Object.entries(dist).sort()) {
    const idx = parseInt(idxStr, 10);
    const pct = ((count / total) * 100).toFixed(1);
    console.log(`    - Choice Index ${idx}: ${count} questions (${pct}%)`);
  }
}

// By Python Module
const pythonQuizzesByModule: Record<string, Quiz[]> = {};
for (const quiz of pythonQuizzes) {
  const lessonObj = contentPack.lessons.find(l => l.id === quiz.lessonId);
  const modId = lessonObj?.moduleId ?? "unknown";
  if (!pythonQuizzesByModule[modId]) pythonQuizzesByModule[modId] = [];
  pythonQuizzesByModule[modId].push(quiz);
}

console.log("\nPython Track Distribution by Module:");
for (const modId of Object.keys(pythonQuizzesByModule).sort()) {
  const quizzes = pythonQuizzesByModule[modId];
  const dist: Record<number, number> = {};
  let total = 0;
  for (const quiz of quizzes) {
    for (const q of quiz.questions) {
      const idx = q.correctChoiceIndex;
      dist[idx] = (dist[idx] ?? 0) + 1;
      total++;
    }
  }
  console.log(`  - Module ${modId} (Total Questions: ${total}):`);
  for (const [idxStr, count] of Object.entries(dist).sort()) {
    const idx = parseInt(idxStr, 10);
    const pct = ((count / total) * 100).toFixed(1);
    console.log(`    - Choice Index ${idx}: ${count} questions (${pct}%)`);
  }
}

// Audit single index percentage targets
for (const [idxStr, count] of Object.entries(globalDistribution)) {
  const pct = (count / globalTotal) * 100;
  if (pct > 55) {
    warnings.push(`Global quiz answer index ${idxStr} is at ${pct.toFixed(1)}%, exceeding the 55% target.`);
  }
}
for (const [idxStr, count] of Object.entries(pythonDistribution)) {
  const pct = (count / pythonTotal) * 100;
  if (pct > 60) {
    warnings.push(`Python quiz answer index ${idxStr} is at ${pct.toFixed(1)}%, exceeding the 60% target.`);
  }
}
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
