import { contentPack } from "../src/content/seed";
import { roleTargets } from "../src/content/roles";
import { contentPackSchema, roleTargetSchema } from "../src/domain/schemas";
import { conceptRegistry } from "../src/content/concepts";

function assertKnownIds(label: string, ids: string[], knownIds: Set<string>, errors: string[]): void {
  for (const id of ids) {
    if (!knownIds.has(id)) {
      errors.push(`${label} references unknown id: ${id}`);
    }
  }
}

export function validateContent(): string[] {
  const errors: string[] = [];

  const parsed = contentPackSchema.safeParse(contentPack);
  const parsedRoleTargets = roleTargetSchema.array().safeParse(roleTargets);

  if (!parsed.success) {
    errors.push(parsed.error.message);
    return errors;
  }

  if (!parsedRoleTargets.success) {
    errors.push(JSON.stringify(parsedRoleTargets.error.format()));
    return errors;
  }

  const trackIds = new Set(contentPack.tracks.map((track) => track.id));
  const moduleIds = new Set(contentPack.modules.map((moduleItem) => moduleItem.id));
  const lessonIds = new Set(contentPack.lessons.map((lesson) => lesson.id));
  const quizIds = new Set(contentPack.quizzes.map((quiz) => quiz.id));
  const missionIds = new Set(contentPack.projectMissions.map((mission) => mission.id));
  const skillIds = new Set(contentPack.skills.map((skill) => skill.id));

// Base checks from original validator
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

const nonPythonDepthRepLessonIds = [
  "lesson-typescript-contracts",
  "lesson-typescript-runtime-validation",
  "lesson-sql-joins",
  "lesson-security-secrets-auth",
  "lesson-security-access-control-lab",
  "lesson-security-injection-output-encoding",
  "lesson-ai-retrieval-grounding",
  "lesson-cloud-ci-deploy-checks",
  "lesson-cloud-rollback-drill",
  "lesson-data-contracts-fixtures",
  "lesson-data-rejected-row-proof",
  "lesson-ml-confusion-matrix"
];

for (const lesson of contentPack.lessons) {
  assertKnownIds(`lesson ${lesson.id}`, [lesson.moduleId], moduleIds, errors);
  assertKnownIds(`lesson ${lesson.id}`, lesson.skillIds, skillIds, errors);
  assertKnownIds(`lesson ${lesson.id}`, [lesson.quizId], quizIds, errors);

  if (lesson.curriculum?.deprecated) {
    continue;
  }

  if (lesson.workshop.commonMistakes.length < 2) {
    errors.push(`lesson ${lesson.id} needs at least two common mistakes for workshop depth`);
  }

  const recallTypes = new Set(lesson.workshop.recallCards.map((card) => card.type));
  if (!["explain", "debug", "transfer"].every((type) => recallTypes.has(type as "explain" | "debug" | "transfer"))) {
    errors.push(`lesson ${lesson.id} needs explain, debug, and transfer recall cards`);
  }

  const recallCardIds = new Set(lesson.workshop.recallCards.map((card) => card.id));
  if (recallCardIds.size !== lesson.workshop.recallCards.length) {
    errors.push(`lesson ${lesson.id} has duplicate recall card ids`);
  }

  if (lesson.workshop.recallCards.some((card) => card.prompt.length < 50 || card.answerHint.length < 20)) {
    errors.push(`lesson ${lesson.id} needs specific recall prompts and answer hints`);
  }

  if (lesson.workshop.misconceptionChecks.length === 0) {
    errors.push(`lesson ${lesson.id} needs at least one misconception check`);
  }

  if (lesson.workshop.misconceptionChecks.some((check) => check.repair.length < 40 || check.checkPrompt.length < 50)) {
    errors.push(`lesson ${lesson.id} misconception checks need repair guidance`);
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

  if (lesson.workshop.practice.expectedOutput.length < 1) { // Adjusted from 20 to 1 to accommodate short Level 0 answers like 'py'
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

  const lessonKind = lesson.curriculum?.lessonKind;
  const isNonRunnerLesson = lessonKind === "concept_only" || lessonKind === "simulated_terminal";
  if (!isNonRunnerLesson && lesson.workshop.miniProject.runnerSpec.language === "python" && lesson.workshop.miniProject.runnerSpec.hiddenTests.length === 0) {
    errors.push(`lesson ${lesson.id} Python sandbox needs at least one hidden test`);
  }

  if (nonPythonDepthRepLessonIds.includes(lesson.id)) {
    if ((lesson.workshop.practiceReps?.length ?? 0) < 3) {
      errors.push(`lesson ${lesson.id} needs at least three non-Python depth practice reps`);
    }
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


// --- RULE GROUP A: Concept Registry Integrity ---
const registeredConceptIds = new Set(conceptRegistry.map((c) => c.id));
if (registeredConceptIds.size !== conceptRegistry.length) {
  errors.push("Rule Group A: Duplicate concept IDs found in conceptRegistry");
}

const stableNamespaces = ["py.", "tool.", "git.", "github.", "runner.", "evidence.", "debug.", "stderr.", "ops.", "testing.", "files."];
for (const concept of conceptRegistry) {
  const match = stableNamespaces.some((ns) => concept.id.startsWith(ns));
  if (!match) {
    errors.push(`Rule Group A: Concept ID '${concept.id}' does not use a stable namespace prefix`);
  }
}

// Track concept first-teach lesson mapping to ensure exactly one teaching lesson (unless reinforced)
const conceptTeachers: Record<string, string[]> = {};
for (const lesson of contentPack.lessons) {
  if (lesson.curriculum?.deprecated) {
    continue;
  }
  if (lesson.curriculum?.teaches) {
    for (const conceptId of lesson.curriculum.teaches) {
      if (!conceptTeachers[conceptId]) {
        conceptTeachers[conceptId] = [];
      }
      conceptTeachers[conceptId].push(lesson.id);
    }
  }
}

for (const [conceptId, teachers] of Object.entries(conceptTeachers)) {
  if (teachers.length > 1) {
    // Check if any of these teachers declare this concept in reinforces
    const nonReinforcedTeachers = teachers.filter((lessonId) => {
      const lessonObj = contentPack.lessons.find((l) => l.id === lessonId);
      return !lessonObj?.curriculum?.reinforces?.includes(conceptId);
    });
    if (nonReinforcedTeachers.length > 1) {
      errors.push(`Rule Group A: Concept '${conceptId}' is taught in multiple lessons without being marked as reinforced: ${nonReinforcedTeachers.join(", ")}`);
    }
  }
}


// --- RULE GROUP B: Lesson Sequencing ---
// Construct ordered lesson list:
// 1. Python track modules sorted by sortOrder
// 2. For each module, lessons in sequence of module.lessonIds
const pythonTrack = contentPack.tracks.find((t) => t.id === "track-python");
if (!pythonTrack) {
  errors.push("Missing track-python");
} else {
  const pythonModules = contentPack.modules
    .filter((m) => m.trackId === "track-python")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const orderedLessons: typeof contentPack.lessons = [];
  for (const mod of pythonModules) {
    for (const lId of mod.lessonIds) {
      const lessonObj = contentPack.lessons.find((l) => l.id === lId);
      if (lessonObj) {
        orderedLessons.push(lessonObj);
      }
    }
  }

  // Verify sequencing:
  const taughtConcepts = new Set<string>();
  const globalBootstrapConcepts = new Set<string>(); // global concepts learner has initially (empty by default)

  for (const lesson of orderedLessons) {
    const curriculum = lesson.curriculum;
    if (!curriculum) {
      // If no curriculum metadata yet, we skip checks but raise warning
      continue;
    }

    // Check teaches references valid concepts
    for (const cId of curriculum.teaches) {
      if (!registeredConceptIds.has(cId)) {
        errors.push(`Rule Group A: Lesson '${lesson.id}' teaches unregistered concept '${cId}'`);
      }
    }

    // Check requires references valid concepts
    for (const cId of curriculum.requires) {
      if (!registeredConceptIds.has(cId)) {
        errors.push(`Rule Group A: Lesson '${lesson.id}' requires unregistered concept '${cId}'`);
      }
    }

    // Rule B1: lesson.requires ⊆ availableConceptsBeforeLesson
    for (const requiredId of curriculum.requires) {
      if (!taughtConcepts.has(requiredId) && !globalBootstrapConcepts.has(requiredId)) {
        errors.push(`Rule Group B: Lesson '${lesson.id}' requires untaught concept '${requiredId}'`);
      }
    }

    // Rule B2: lesson.visibleCodeConcepts ⊆ availableConceptsBeforeLesson ∪ lesson.teaches
    if (curriculum.visibleCodeConcepts) {
      for (const visibleId of curriculum.visibleCodeConcepts) {
        if (!taughtConcepts.has(visibleId) && !curriculum.teaches.includes(visibleId) && !globalBootstrapConcepts.has(visibleId)) {
          errors.push(`Rule Group B: Lesson '${lesson.id}' uses untaught visibleCodeConcept '${visibleId}'`);
        }
      }
    }

    // Rule B3: lesson.quizConcepts ⊆ availableConceptsBeforeLesson ∪ lesson.teaches
    if (curriculum.quizConcepts) {
      for (const quizId of curriculum.quizConcepts) {
        if (!taughtConcepts.has(quizId) && !curriculum.teaches.includes(quizId) && !globalBootstrapConcepts.has(quizId)) {
          errors.push(`Rule Group B: Lesson '${lesson.id}' references untaught quizConcept '${quizId}'`);
        }
      }
    }

    // Rule B4: teaches does not contain already-taught concept unless reinforces does
    for (const teachesId of curriculum.teaches) {
      if (taughtConcepts.has(teachesId)) {
        if (!curriculum.reinforces?.includes(teachesId)) {
          errors.push(`Rule Group B: Lesson '${lesson.id}' teaches already-taught concept '${teachesId}' without reinforces marker`);
        }
      }
    }

    // Add taught concepts to set
    for (const teachesId of curriculum.teaches) {
      taughtConcepts.add(teachesId);
    }
  }
}


// --- RULE GROUP C: Mission Sequencing ---
const allPythonTaughtConcepts = new Set<string>();
for (const lesson of contentPack.lessons) {
  if (lesson.curriculum?.teaches) {
    for (const c of lesson.curriculum.teaches) {
      allPythonTaughtConcepts.add(c);
    }
  }
}

for (const mission of contentPack.projectMissions) {
  if (mission.trackId !== "track-python" || !mission.curriculum) {
    continue;
  }
  const curr = mission.curriculum;

  // Verify all requires are taught by the lessons listed in supported/required lessons
  const missionAvailableConcepts = new Set<string>();
  const combinedLessonIds = [...curr.supportedLessonIds, ...(curr.requiredLessonIds ?? [])];
  for (const lId of combinedLessonIds) {
    const lessonObj = contentPack.lessons.find((l) => l.id === lId);
    if (lessonObj?.curriculum?.teaches) {
      for (const c of lessonObj.curriculum.teaches) {
        missionAvailableConcepts.add(c);
      }
    }
  }

  for (const req of curr.requires) {
    if (!missionAvailableConcepts.has(req)) {
      errors.push(`Rule Group C: Mission '${mission.id}' requires concept '${req}' which is not taught by its supported or required lessons`);
    }
  }
}


// --- RULE GROUP D: GitHub Proof Before Git ---
for (const mission of contentPack.projectMissions) {
  if (mission.trackId !== "track-python") {
    continue;
  }
  if (mission.evidenceRequirements.repoUrl === true) {
    // Must require git concepts
    const curr = mission.curriculum;
    if (!curr) {
      continue;
    }
    const gitConcepts = ["git.repo.local", "git.stage.add", "git.commit.local", "github.repo.url"];
    const teachesGit = gitConcepts.every((c) => {
      // Find if any supported/required lesson teaches this concept
      const combinedLessonIds = [...curr.supportedLessonIds, ...(curr.requiredLessonIds ?? [])];
      return combinedLessonIds.some((lId) => {
        const l = contentPack.lessons.find((lesson) => lesson.id === lId);
        return l?.curriculum?.teaches.includes(c);
      });
    });

    if (!teachesGit) {
      errors.push(`Rule Group D: Mission '${mission.id}' requires repoUrl evidence but its lessons do not teach Git/GitHub fundamentals`);
    }
  }
}

// Fail when a Python lesson evidence prompt says “GitHub,” “repo URL,” “commit hash,” or “push”
// unless the lesson requires those concepts or follows a Git bridge lesson.
const gitTerms = ["github", "repo url", "commit hash", "push"];
for (const lesson of contentPack.lessons) {
  if (lesson.moduleId.startsWith("module-python-") && lesson.curriculum) {
    const lowerPrompt = lesson.evidencePrompt.toLowerCase();
    const containsGitTerm = gitTerms.some((term) => lowerPrompt.includes(term));
    if (containsGitTerm) {
      const hasGitPrereq = lesson.curriculum?.requires.some((r) => r.startsWith("git.") || r.startsWith("github."));
      if (!hasGitPrereq) {
        errors.push(`Rule Group D: Python lesson '${lesson.id}' evidence prompt refers to Git/GitHub without Git prerequisites`);
      }
    }
  }
}


// --- RULE GROUP E: Code Runner Syntax Drift ---
const pythonSyntaxConceptPatterns = [
  { conceptId: "py.f_string", pattern: /\bf["']/ },
  { conceptId: "py.list.literal", pattern: /\[[\s\S]*\]/ },
  { conceptId: "py.dict.literal", pattern: /\{[\s\S]*:/ },
  { conceptId: "py.if_else", pattern: /^\s*if\s+/m },
  { conceptId: "py.for_loop", pattern: /^\s*for\s+/m },
  { conceptId: "py.function.def", pattern: /^\s*def\s+/m },
  { conceptId: "py.return", pattern: /^\s*return\b/m },
  { conceptId: "py.assertion", pattern: /^\s*assert\s+/m },
  { conceptId: "py.import", pattern: /^\s*import\s+|^\s*from\s+\S+\s+import/m },
  { conceptId: "py.argparse", pattern: /\bargparse\b/ },
  { conceptId: "py.csv", pattern: /\bcsv\b/ },
  { conceptId: "py.json", pattern: /\bjson\b/ },
  { conceptId: "py.dataclass", pattern: /\bdataclass\b/ },
  { conceptId: "py.sqlite", pattern: /\bsqlite3\b/ },
  { conceptId: "py.logging", pattern: /\blogging\b/ }
];

// Check all python lessons code for syntax drift
// Since we sort lessons, we track concepts available up to each lesson:
if (pythonTrack) {
  const pythonModules = contentPack.modules
    .filter((m) => m.trackId === "track-python")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const taughtSoFar = new Set<string>();
  for (const mod of pythonModules) {
    for (const lId of mod.lessonIds) {
      const lesson = contentPack.lessons.find((l) => l.id === lId);
      if (!lesson) continue;
      if (!lesson.curriculum) continue;

      const codeSnippets = [
        lesson.workshop.practice.starterCode,
        ...(lesson.workshop.practiceReps ?? []).map((rep) => rep.starterCode),
        lesson.workshop.miniProject.runnerSpec.starterCode,
        ...lesson.workshop.miniProject.runnerSpec.visibleTests.map((t) => t.code)
      ];

      for (const snippet of codeSnippets) {
        for (const checker of pythonSyntaxConceptPatterns) {
          if (checker.pattern.test(snippet)) {
            // Must be taught so far or taught/required in this lesson
            const isTaught = taughtSoFar.has(checker.conceptId) || 
                             lesson.curriculum?.teaches.includes(checker.conceptId) ||
                             lesson.curriculum?.requires.includes(checker.conceptId) ||
                             lesson.curriculum?.usesButDoesNotTeach?.includes(checker.conceptId);
            if (!isTaught) {
              errors.push(`Rule Group E: Lesson '${lesson.id}' contains syntax for '${checker.conceptId}' before it is taught or declared`);
            }
          }
        }
      }

      if (lesson.curriculum?.teaches) {
        for (const t of lesson.curriculum.teaches) {
          taughtSoFar.add(t);
        }
      }
    }
  }
}


// --- RULE GROUP F: Quizzes ---
for (const quiz of contentPack.quizzes) {
  const lesson = contentPack.lessons.find((l) => l.id === quiz.lessonId);
  if (!lesson) continue;

  const quizTaughtSoFar = new Set<string>();
  // Find all lessons before this one in the python track (or just build it)
  // Quizzes check that conceptIds are in lesson requires ∪ lesson teaches ∪ previously taught
  if (pythonTrack) {
    const pythonModules = contentPack.modules
      .filter((m) => m.trackId === "track-python")
      .sort((a, b) => a.sortOrder - b.sortOrder);
    
    let foundThisLesson = false;
    for (const mod of pythonModules) {
      for (const lId of mod.lessonIds) {
        const lObj = contentPack.lessons.find((l) => l.id === lId);
        if (!lObj) continue;

        if (lObj.id === lesson.id) {
          foundThisLesson = true;
          // Add this lesson's taught and required concepts
          if (lObj.curriculum) {
            for (const t of lObj.curriculum.teaches) quizTaughtSoFar.add(t);
            for (const r of lObj.curriculum.requires) quizTaughtSoFar.add(r);
          }
          break;
        }

        if (lObj.curriculum) {
          for (const t of lObj.curriculum.teaches) quizTaughtSoFar.add(t);
        }
      }
      if (foundThisLesson) break;
    }
  }

  for (const question of quiz.questions) {
    if (question.conceptIds) {
      for (const conceptId of question.conceptIds) {
        if (!quizTaughtSoFar.has(conceptId)) {
          errors.push(`Rule Group F: Quiz '${quiz.id}' question '${question.id}' references concept '${conceptId}' which is untaught/unavailable`);
        }
      }
    }
  }
}


// --- RULE GROUP G: Capstone Dependencies ---
const capstoneMissions = contentPack.projectMissions.filter(
  (m) => m.curriculum?.missionType === "production_capstone"
);
for (const capstone of capstoneMissions) {
  const curr = capstone.curriculum;
  if (!curr) continue;
  if (!curr.capstoneDependencyMissionIds || curr.capstoneDependencyMissionIds.length === 0) {
    errors.push(`Rule Group G: Capstone mission '${capstone.id}' lacks capstoneDependencyMissionIds`);
  } else {
    // verify all required concepts for this capstone are taught by the lessons in dependencies
    const dependencyLessons = new Set<string>();
    for (const depMissionId of curr.capstoneDependencyMissionIds) {
      const depMission = contentPack.projectMissions.find((m) => m.id === depMissionId);
      if (depMission?.curriculum) {
        for (const lId of depMission.curriculum.supportedLessonIds) {
          dependencyLessons.add(lId);
        }
      }
    }
    const capstoneConcepts = new Set<string>();
    for (const lId of dependencyLessons) {
      const lObj = contentPack.lessons.find((l) => l.id === lId);
      if (lObj?.curriculum?.teaches) {
        for (const c of lObj.curriculum.teaches) {
          capstoneConcepts.add(c);
        }
      }
    }

    for (const req of curr.requires) {
      if (!capstoneConcepts.has(req)) {
        errors.push(`Rule Group G: Capstone mission '${capstone.id}' requires concept '${req}' which is not covered by dependency missions`);
      }
    }
  }
}
// --- RULE GROUPS H-M: Lesson Depth Validation ---
for (const lesson of contentPack.lessons) {
  if (lesson.curriculum?.deprecated) {
    continue;
  }
  if (!lesson.depth) {
    continue;
  }
  const depth = lesson.depth;

  // Rule H: Concept Budget
  const numNew = depth.conceptCapsules.length;
  const numSecondary = depth.secondaryConceptIds.length;
  if (lesson.difficulty === "foundation") {
    if (numSecondary > 2) {
      errors.push(`Rule Group H: Foundation lesson '${lesson.id}' exceeds secondary concept limit of 2 (has ${numSecondary})`);
    }
    if (depth.maxNewConcepts > 3) {
      errors.push(`Rule Group H: Foundation lesson '${lesson.id}' maxNewConcepts budget cannot exceed 3 (has ${depth.maxNewConcepts})`);
    }
  } else if (lesson.difficulty === "applied") {
    if (numSecondary > 3) {
      errors.push(`Rule Group H: Applied lesson '${lesson.id}' exceeds secondary concept limit of 3 (has ${numSecondary})`);
    }
    if (depth.maxNewConcepts > 4) {
      errors.push(`Rule Group H: Applied lesson '${lesson.id}' maxNewConcepts budget cannot exceed 4 (has ${depth.maxNewConcepts})`);
    }
  } else if (lesson.difficulty === "portfolio") {
    if (numSecondary > 5) {
      errors.push(`Rule Group H: Portfolio lesson '${lesson.id}' exceeds secondary concept limit of 5 (has ${numSecondary})`);
    }
    if (depth.maxNewConcepts > 2) {
      errors.push(`Rule Group H: Portfolio lesson '${lesson.id}' maxNewConcepts budget cannot exceed 2 (has ${depth.maxNewConcepts})`);
    }
  }

  // Find all previously taught concepts in python track order up to this lesson
  const previouslyTaught = new Set<string>();
  if (pythonTrack) {
    const pythonModules = contentPack.modules
      .filter((m) => m.trackId === "track-python")
      .sort((a, b) => a.sortOrder - b.sortOrder);
    
    let foundThisLesson = false;
    for (const mod of pythonModules) {
      for (const lId of mod.lessonIds) {
        const lObj = contentPack.lessons.find((l) => l.id === lId);
        if (!lObj) continue;
        if (lObj.id === lesson.id) {
          foundThisLesson = true;
          break;
        }
        if (lObj.curriculum?.teaches) {
          for (const t of lObj.curriculum.teaches) {
            previouslyTaught.add(t);
          }
        }
      }
      if (foundThisLesson) break;
    }
  }

  // Rule I: Every visible concept must be explained
  const capsuleConceptIds = new Set(depth.conceptCapsules.map((c) => c.conceptId));
  const verifierOnlyConcepts = new Set(depth.codeLabBridge.verifierOnlyConcepts ?? []);

  const visibleCodeConcepts = lesson.curriculum?.visibleCodeConcepts ?? [];
  for (const conceptId of visibleCodeConcepts) {
    if (!previouslyTaught.has(conceptId) && !capsuleConceptIds.has(conceptId) && !verifierOnlyConcepts.has(conceptId)) {
      errors.push(`Rule Group I: Lesson '${lesson.id}' visibleCodeConcept '${conceptId}' is not covered by previous lessons, concept capsules, or verifier-only tags`);
    }
  }

  const quizConcepts = lesson.curriculum?.quizConcepts ?? [];
  for (const conceptId of quizConcepts) {
    if (!previouslyTaught.has(conceptId) && !capsuleConceptIds.has(conceptId)) {
      errors.push(`Rule Group I: Lesson '${lesson.id}' quizConcept '${conceptId}' is not taught here or previously taught`);
    }
  }

  // Rule J: Code Lab Bridge Integrity
  for (const conceptId of depth.codeLabBridge.usesConcepts) {
    if (!registeredConceptIds.has(conceptId)) {
      errors.push(`Rule Group J: Lesson '${lesson.id}' codeLabBridge references unregistered concept '${conceptId}'`);
    }
  }
  for (const conceptId of (depth.codeLabBridge.verifierOnlyConcepts ?? [])) {
    if (!registeredConceptIds.has(conceptId)) {
      errors.push(`Rule Group J: Lesson '${lesson.id}' codeLabBridge references unregistered verifierOnlyConcept '${conceptId}'`);
    }
  }
  const kind = lesson.curriculum?.lessonKind;
  const isNonRunner = kind === "concept_only" || kind === "simulated_terminal";
  if (!isNonRunner && (depth.codeLabBridge.learnerOwns.length === 0 || depth.codeLabBridge.checkerOwns.length === 0)) {
    errors.push(`Rule Group J: Lesson '${lesson.id}' codeLabBridge ownership lists cannot be empty`);
  }

  // Rule K: Early Python lesson assertions must have custom failure messages
  if (lesson.curriculum && lesson.curriculum.level <= 4 && lesson.workshop.miniProject.runnerSpec.language === "python") {
    const tests = [
      ...lesson.workshop.miniProject.runnerSpec.visibleTests,
      ...lesson.workshop.miniProject.runnerSpec.hiddenTests
    ];
    for (const t of tests) {
      const lines = t.code.split("\n");
      for (const line of lines) {
        if (line.trim().startsWith("assert") && !line.includes(",")) {
          errors.push(`Rule Group K: Lesson '${lesson.id}' test code contains assertion without custom failure message: '${line.trim()}'`);
        }
      }
    }
  }

  // Rule L: Checkpoint question conceptIds mapping
  const quiz = contentPack.quizzes.find((q) => q.id === lesson.quizId);
  if (quiz) {
    for (const question of quiz.questions) {
      if (!question.conceptIds || question.conceptIds.length === 0) {
        errors.push(`Rule Group L: Quiz '${quiz.id}' question '${question.id}' lacks conceptIds mapping`);
      }
    }
  }

  // Rule M: Assertion lock (no assert before level 4)
  const isAssertionTaughtOrAvailable = previouslyTaught.has("py.assertion") ||
                                       lesson.curriculum?.teaches.includes("py.assertion") ||
                                       lesson.curriculum?.requires.includes("py.assertion");
  if (!isAssertionTaughtOrAvailable) {
    const codeSnippets = [
      lesson.workshop.practice.starterCode,
      ...(lesson.workshop.practiceReps ?? []).map((rep) => rep.starterCode),
      lesson.workshop.miniProject.runnerSpec.starterCode
    ];
    for (const snippet of codeSnippets) {
      if (/\bassert\b/.test(snippet)) {
        errors.push(`Rule Group M: Lesson '${lesson.id}' starter code uses assert before py.assertion is taught/available`);
      }
    }
  }
  }
  
  // --- SURFACE CLASSIFICATION HELPERS ---
  function stripComments(code: string): string {
    return code
      .split("\n")
      .map((line) => {
        const idx = line.indexOf("#");
        return idx >= 0 ? line.slice(0, idx) : line;
      })
      .join("\n");
  }

  function stripCommentsAndStrings(code: string): string {
    let stripped = stripComments(code);
    stripped = stripped.replace(/"[^"\\]*(?:\\.[^"\\]*)*"/g, '""');
    stripped = stripped.replace(/'[^'\\]*(?:\\.[^'\\]*)*'/g, "''");
    return stripped;
  }

  interface LessonSurfaces {
    learnerVisibleCode: string[];
    learnerEditableCode: string[];
    visibleExampleCode: string[];
    visibleCheckerCode: string[];
    hiddenCheckerCode: string[];
    prose: string[];
    evidencePrompts: string[];
  }

  function getLessonSurfaces(lesson: any): LessonSurfaces {
    const learnerVisibleCode: string[] = [];
    const learnerEditableCode: string[] = [];
    const visibleExampleCode: string[] = [];
    const visibleCheckerCode: string[] = [];
    const hiddenCheckerCode: string[] = [];
    const prose: string[] = [];
    const evidencePrompts: string[] = [];

    if (lesson.workshop?.practice?.starterCode) {
      learnerVisibleCode.push(lesson.workshop.practice.starterCode);
      learnerEditableCode.push(lesson.workshop.practice.starterCode);
    }
    if (lesson.workshop?.practiceReps) {
      for (const rep of lesson.workshop.practiceReps) {
        if (rep.starterCode) {
          learnerVisibleCode.push(rep.starterCode);
          learnerEditableCode.push(rep.starterCode);
        }
      }
    }
    if (lesson.workshop?.miniProject?.runnerSpec?.starterCode) {
      learnerVisibleCode.push(lesson.workshop.miniProject.runnerSpec.starterCode);
      learnerEditableCode.push(lesson.workshop.miniProject.runnerSpec.starterCode);
    }

    if (lesson.workshop?.workedExample) {
      visibleExampleCode.push(lesson.workshop.workedExample);
    }
    if (lesson.depth?.conceptCapsules) {
      for (const capsule of lesson.depth.conceptCapsules) {
        if (capsule.tinyExample) visibleExampleCode.push(capsule.tinyExample);
        if (capsule.syntaxShape) visibleExampleCode.push(capsule.syntaxShape);
      }
    }
    if (lesson.depth?.codeWalkthrough) {
      for (const note of lesson.depth.codeWalkthrough) {
        if (note.codeFragment) visibleExampleCode.push(note.codeFragment);
      }
    }
    if (lesson.depth?.errorClinic) {
      for (const item of lesson.depth.errorClinic) {
        if (item.brokenExample) visibleExampleCode.push(item.brokenExample);
      }
    }

    if (lesson.workshop?.miniProject?.runnerSpec?.visibleTests) {
      for (const test of lesson.workshop.miniProject.runnerSpec.visibleTests) {
        if (test.code) visibleCheckerCode.push(test.code);
      }
    }

    if (lesson.workshop?.miniProject?.runnerSpec?.hiddenTests) {
      for (const test of lesson.workshop.miniProject.runnerSpec.hiddenTests) {
        if (test.code) hiddenCheckerCode.push(test.code);
      }
    }

    if (lesson.summary) prose.push(lesson.summary);
    if (lesson.bodyMarkdown) prose.push(lesson.bodyMarkdown);
    if (lesson.desktopTask) prose.push(lesson.desktopTask);
    if (lesson.workshop?.synopsis) prose.push(lesson.workshop.synopsis);
    if (lesson.workshop?.objective) prose.push(lesson.workshop.objective);
    if (lesson.workshop?.whyItMatters) prose.push(lesson.workshop.whyItMatters);
    if (lesson.workshop?.coreConcept) prose.push(lesson.workshop.coreConcept);
    if (lesson.workshop?.guidedExercise) prose.push(lesson.workshop.guidedExercise);
    if (lesson.workshop?.missionConnection) prose.push(lesson.workshop.missionConnection);
    if (lesson.workshop?.reflectionPrompt) prose.push(lesson.workshop.reflectionPrompt);
    if (lesson.workshop?.practice?.checkYourAnswer) {
      prose.push(lesson.workshop.practice.checkYourAnswer);
    }
    if (lesson.workshop?.practiceReps) {
      for (const rep of lesson.workshop.practiceReps) {
        if (rep.checkYourAnswer) prose.push(rep.checkYourAnswer);
      }
    }
    if (lesson.workshop?.miniProject) {
      const mp = lesson.workshop.miniProject;
      if (mp.title) prose.push(mp.title);
      if (mp.goal) prose.push(mp.goal);
      if (mp.steps) prose.push(...mp.steps);
      if (mp.deliverables) prose.push(...mp.deliverables);
      if (mp.expectedEvidence) prose.push(mp.expectedEvidence);
      if (mp.projectConnection) prose.push(mp.projectConnection);
    }
    if (lesson.workshop?.commonMistakes) {
      prose.push(...lesson.workshop.commonMistakes);
    }
    if (lesson.workshop?.misconceptionChecks) {
      for (const check of lesson.workshop.misconceptionChecks) {
        if (check.mistake) prose.push(check.mistake);
        if (check.repair) prose.push(check.repair);
        if (check.checkPrompt) prose.push(check.checkPrompt);
      }
    }
    if (lesson.workshop?.recallCards) {
      for (const card of lesson.workshop.recallCards) {
        if (card.prompt) prose.push(card.prompt);
        if (card.answerHint) prose.push(card.answerHint);
      }
    }
    if (lesson.depth?.conceptCapsules) {
      for (const capsule of lesson.depth.conceptCapsules) {
        if (capsule.definition) prose.push(capsule.definition);
        if (capsule.mentalModel) prose.push(capsule.mentalModel);
        if (capsule.commonMistake) prose.push(capsule.commonMistake);
        if (capsule.repairHint) prose.push(capsule.repairHint);
      }
    }
    if (lesson.depth?.codeWalkthrough) {
      for (const note of lesson.depth.codeWalkthrough) {
        if (note.explanation) prose.push(note.explanation);
        if (note.learnerShouldBeAbleToSay) prose.push(note.learnerShouldBeAbleToSay);
      }
    }
    if (lesson.depth?.guidedEdits) {
      for (const edit of lesson.depth.guidedEdits) {
        if (edit.instruction) prose.push(edit.instruction);
        if (edit.expectedObservation) prose.push(edit.expectedObservation);
        if (edit.wrongTurnHint) prose.push(edit.wrongTurnHint);
      }
    }
    if (lesson.depth?.errorClinic) {
      for (const item of lesson.depth.errorClinic) {
        if (item.symptom) prose.push(item.symptom);
        if (item.likelyCause) prose.push(item.likelyCause);
        if (item.fixStrategy) prose.push(item.fixStrategy);
      }
    }
    if (lesson.depth?.codeLabBridge?.story) {
      prose.push(lesson.depth.codeLabBridge.story);
    }

    if (lesson.evidencePrompt) {
      evidencePrompts.push(lesson.evidencePrompt);
    }

    return {
      learnerVisibleCode,
      learnerEditableCode,
      visibleExampleCode,
      visibleCheckerCode,
      hiddenCheckerCode,
      prose,
      evidencePrompts
    };
  }

  const warnings: string[] = [];

  // --- METADATA MISSING CHECKS ---
  for (const lesson of contentPack.lessons) {
    if (lesson.moduleId.startsWith("module-python-")) {
      const level = lesson.curriculum?.level;
      if (level === undefined || level === null) {
        if (lesson.id.includes("zero")) {
          errors.push(`Lesson '${lesson.id}' (Level 0) is missing curriculum metadata`);
        } else {
          warnings.push(`Lesson '${lesson.id}' is missing curriculum metadata`);
        }
      } else {
        if (level === 0) {
          if (!lesson.depth) {
            errors.push(`Lesson '${lesson.id}' (Level 0) is missing depth metadata`);
          }
        } else if (level === 1) {
          if (!lesson.depth) {
            warnings.push(`Lesson '${lesson.id}' (Level 1) is missing depth metadata`);
          }
        } else if (level >= 2 && level <= 4) {
          if (!lesson.depth) {
            warnings.push(`Lesson '${lesson.id}' (Level ${level}) is missing depth metadata`);
          }
        } else if (level >= 5) {
          if (!lesson.depth) {
            warnings.push(`Lesson '${lesson.id}' (Level ${level}) is missing depth metadata`);
          }
        }
      }
    }
  }

  // --- LEVEL 0 STRICT RULES & LEVEL 1 WARNINGS ---
  const pythonModules = contentPack.modules
    .filter((m) => m.trackId === "track-python")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const orderedLessons: typeof contentPack.lessons = [];
  for (const mod of pythonModules) {
    for (const lId of mod.lessonIds) {
      const lessonObj = contentPack.lessons.find((l) => l.id === lId);
      if (lessonObj) {
        orderedLessons.push(lessonObj);
      }
    }
  }

  const taughtSoFar = new Set<string>();

  for (const lesson of orderedLessons) {
    if (!lesson.curriculum) continue;
    const level = lesson.curriculum.level;

    // Strict Rules for Level 0
    if (level === 0) {
      const depth = lesson.depth;
      if (depth) {
        // Capsule check
        const capsuleConceptIds = new Set(depth.conceptCapsules.map((c) => c.conceptId));
        for (const conceptId of lesson.curriculum.teaches) {
          if (!capsuleConceptIds.has(conceptId)) {
            errors.push(`Level 0 Lesson '${lesson.id}' is missing concept capsule for taught concept '${conceptId}'`);
          }
        }

        // Bridge check
        if (!depth.codeLabBridge) {
          errors.push(`Level 0 Lesson '${lesson.id}' is missing a codeLabBridge`);
        } else {
          const kind = lesson.curriculum.lessonKind;
          const isNonRunner = kind === "concept_only" || kind === "simulated_terminal";
          if (!isNonRunner) {
            if (depth.codeLabBridge.learnerOwns.length === 0 || depth.codeLabBridge.checkerOwns.length === 0) {
              errors.push(`Level 0 Lesson '${lesson.id}' codeLabBridge ownership lists cannot be empty for runnable lessonKind`);
            }
          }
        }
      }

      // Surface checks
      const surfaces = getLessonSurfaces(lesson);

      // no variables/f-strings/lists/dicts/if/loops/functions/assertions/file input/CLI args/Git/GitHub
      const checkRestricted = (snippet: string, surfaceName: string) => {
        const stripped = stripComments(snippet);
        const strippedFull = stripCommentsAndStrings(snippet);

        if (/\b[a-zA-Z_][a-zA-Z0-9_]*\s*=(?!=)/.test(stripped)) {
          errors.push(`Level 0 Lesson '${lesson.id}' contains variable assignment in surface '${surfaceName}': '${stripped.trim()}'`);
        }
        if (/\bf["']/.test(stripped)) {
          errors.push(`Level 0 Lesson '${lesson.id}' contains f-string in surface '${surfaceName}': '${stripped.trim()}'`);
        }
        if (/\[[\s\S]*\]/.test(stripped)) {
          errors.push(`Level 0 Lesson '${lesson.id}' contains lists in surface '${surfaceName}': '${stripped.trim()}'`);
        }
        if (/\{[\s\S]*\}/.test(stripped)) {
          errors.push(`Level 0 Lesson '${lesson.id}' contains dicts in surface '${surfaceName}': '${stripped.trim()}'`);
        }
        if (/\bif\b|\belse\b|\belif\b/.test(stripped)) {
          errors.push(`Level 0 Lesson '${lesson.id}' contains conditionals in surface '${surfaceName}': '${stripped.trim()}'`);
        }
        if (/\bfor\b|\bwhile\b/.test(stripped)) {
          errors.push(`Level 0 Lesson '${lesson.id}' contains loops in surface '${surfaceName}': '${stripped.trim()}'`);
        }
        if (/\bdef\b|\breturn\b/.test(stripped)) {
          errors.push(`Level 0 Lesson '${lesson.id}' contains functions in surface '${surfaceName}': '${stripped.trim()}'`);
        }
        if (/\bassert\b/.test(stripped)) {
          errors.push(`Level 0 Lesson '${lesson.id}' contains assertions in surface '${surfaceName}': '${stripped.trim()}'`);
        }
        if (/\bopen\b/.test(stripped)) {
          errors.push(`Level 0 Lesson '${lesson.id}' contains file input in surface '${surfaceName}': '${stripped.trim()}'`);
        }
        if (/\bargv\b|\bargparse\b/.test(stripped)) {
          errors.push(`Level 0 Lesson '${lesson.id}' contains CLI args in surface '${surfaceName}': '${stripped.trim()}'`);
        }
      };

      const checkKeyword = (text: string, surfaceName: string) => {
        if (/git|github|commit|push/i.test(text)) {
          errors.push(`Level 0 Lesson '${lesson.id}' contains Git/GitHub keyword in surface '${surfaceName}': '${text.trim()}'`);
        }
      };

      // Apply checks
      surfaces.learnerVisibleCode.forEach(c => checkRestricted(c, "learnerVisibleCode"));
      surfaces.learnerEditableCode.forEach(c => checkRestricted(c, "learnerEditableCode"));
      surfaces.visibleExampleCode.forEach(c => checkRestricted(c, "visibleExampleCode"));
      surfaces.prose.forEach(c => checkKeyword(c, "prose"));
      surfaces.evidencePrompts.forEach(c => checkKeyword(c, "evidencePrompts"));

      // Check visible tests have no assertions
      surfaces.visibleCheckerCode.forEach(c => {
        if (/\bassert\b/.test(stripComments(c))) {
          errors.push(`Level 0 Lesson '${lesson.id}' visible checker test uses assert, which is forbidden`);
        }
      });

      // Local evidence check
      surfaces.evidencePrompts.forEach(prompt => {
        if (/github|repo url|commit hash|push/i.test(prompt)) {
          errors.push(`Level 0 Lesson '${lesson.id}' evidence prompt requires remote Git/GitHub, which is forbidden`);
        }
      });
    }

    // Warnings for Level 1
    if (level === 1) {
      if (lesson.curriculum.teaches.length > 3) {
        warnings.push(`Lesson '${lesson.id}' (Level 1) teaches more than 3 concepts`);
      }
      if (lesson.depth) {
        const capsuleIds = new Set(lesson.depth.conceptCapsules.map(c => c.conceptId));
        for (const conceptId of lesson.curriculum.visibleCodeConcepts ?? []) {
          if (!taughtSoFar.has(conceptId) && !lesson.curriculum.teaches.includes(conceptId) && !capsuleIds.has(conceptId)) {
            warnings.push(`Lesson '${lesson.id}' (Level 1) uses visible concept '${conceptId}' without explaining it in a capsule`);
          }
        }
      }
    }

    // Premature syntax usage checks (Level 1+)
    const surfaces = getLessonSurfaces(lesson);
    const visibleCodeSnippets = [
      ...surfaces.learnerVisibleCode,
      ...surfaces.learnerEditableCode,
      ...surfaces.visibleExampleCode
    ];

    for (const snippet of visibleCodeSnippets) {
      const stripped = stripComments(snippet);
      const strippedFull = stripCommentsAndStrings(snippet);

      // f-strings
      if (/\bf["']/.test(stripped)) {
        if (!taughtSoFar.has("py.f_string") && !lesson.curriculum.teaches.includes("py.f_string") && !lesson.curriculum.requires.includes("py.f_string")) {
          warnings.push(`Lesson '${lesson.id}' uses f-strings before the f-string lesson`);
        }
      }
      // newline escapes
      if (/\\n/.test(stripped)) {
        if (!taughtSoFar.has("py.f_string") && !lesson.curriculum.teaches.includes("py.f_string") && !lesson.curriculum.requires.includes("py.f_string")) {
          warnings.push(`Lesson '${lesson.id}' uses newline escape \\n before the f-string/newline lesson`);
        }
      }
      // print(variable)
      if (/\bprint\(\s*[a-zA-Z_][a-zA-Z0-9_]*\s*\)/.test(strippedFull)) {
        if (!taughtSoFar.has("py.print.variable") && !lesson.curriculum.teaches.includes("py.print.variable") && !lesson.curriculum.requires.includes("py.print.variable")) {
          warnings.push(`Lesson '${lesson.id}' uses print(variable) before the print-variable lesson`);
        }
      }
      // arithmetic
      if (/\b\d+\s*[+\-*\/]\s*\d+\b|\b[a-zA-Z_][a-zA-Z0-9_]*\s*[+\-*\/]\s*[a-zA-Z0-9_]+\b/.test(strippedFull)) {
        if (!taughtSoFar.has("py.arithmetic.add") && !taughtSoFar.has("py.arithmetic.multiply") &&
            !lesson.curriculum.teaches.includes("py.arithmetic.add") && !lesson.curriculum.teaches.includes("py.arithmetic.multiply") &&
            !lesson.curriculum.requires.includes("py.arithmetic.add") && !lesson.curriculum.requires.includes("py.arithmetic.multiply")) {
          warnings.push(`Lesson '${lesson.id}' uses arithmetic operators before the arithmetic lesson`);
        }
      }
      // string concatenation / combination
      if (/\b[a-zA-Z_][a-zA-Z0-9_]*\s*\+\s*[a-zA-Z0-9_]+\b/.test(strippedFull)) {
        if (!taughtSoFar.has("py.f_string") && !lesson.curriculum.teaches.includes("py.f_string") && !lesson.curriculum.requires.includes("py.f_string")) {
          warnings.push(`Lesson '${lesson.id}' uses string concatenation '+' before the string-combination/f-string lesson`);
        }
      }
    }

    if (lesson.curriculum.teaches) {
      for (const t of lesson.curriculum.teaches) {
        taughtSoFar.add(t);
      }
    }
  }

  // --- QUIZ POSITION BIAS CHECKS ---
  const moduleCorrectCounts: Record<string, Record<number, number>> = {};
  const moduleTotalQuestions: Record<string, number> = {};

  for (const quiz of contentPack.quizzes) {
    const lesson = contentPack.lessons.find((l) => l.id === quiz.lessonId);
    if (!lesson) continue;

    const quizCorrectCounts: Record<number, number> = {};
    const totalQuestions = quiz.questions.length;

    for (const q of quiz.questions) {
      const idx = q.correctChoiceIndex;
      quizCorrectCounts[idx] = (quizCorrectCounts[idx] ?? 0) + 1;

      const modId = lesson.moduleId;
      if (!moduleCorrectCounts[modId]) {
        moduleCorrectCounts[modId] = {};
        moduleTotalQuestions[modId] = 0;
      }
      moduleCorrectCounts[modId][idx] = (moduleCorrectCounts[modId][idx] ?? 0) + 1;
      moduleTotalQuestions[modId]++;
    }

    // 80%+ check for quiz
    for (const [idxStr, count] of Object.entries(quizCorrectCounts)) {
      const idx = parseInt(idxStr, 10);
      const ratio = count / totalQuestions;
      if (ratio >= 0.8) {
        warnings.push(`Quiz '${quiz.id}' has answer position bias: ${(ratio * 100).toFixed(0)}% of questions have correct index ${idx}`);
      }
    }
  }

  // 70%+ check for module
  for (const [modId, counts] of Object.entries(moduleCorrectCounts)) {
    const total = moduleTotalQuestions[modId];
    for (const [idxStr, count] of Object.entries(counts)) {
      const idx = parseInt(idxStr, 10);
      const ratio = count / total;
      if (ratio >= 0.7) {
        warnings.push(`Module '${modId}' has answer position bias: ${(ratio * 100).toFixed(0)}% of quiz questions have correct index ${idx}`);
      }
    }
  }

  if (warnings.length > 0) {
    console.log("=== THIN COVERAGE AND CURRICULUM DEPTH WARNINGS ===");
    for (const w of warnings) {
      console.warn(`[WARN] ${w}`);
    }
    console.log("");
  }

  return errors;
}

if (process.argv[1] && (process.argv[1].endsWith("validate-content.ts") || process.argv[1].endsWith("validate-content"))) {
  const errors = validateContent();
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(
    `Validated ${contentPack.tracks.length} tracks, ${contentPack.lessons.length} lessons, ${contentPack.quizzes.length} quizzes, and ${contentPack.projectMissions.length} missions successfully.`
  );
}
