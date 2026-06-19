import type { ContentPack, Lesson } from "./types";

export interface PythonAuditRow {
  orderIndex: number;
  moduleId: string;
  lessonId: string;
  title: string;
  level: number;
  teaches: string[];
  requires: string[];
  visibleCodeConcepts: string[];
  quizConcepts: string[];
  hasDepthBlock: boolean;
  conceptCapsuleCount: number;
  guidedEditCount: number;
  errorClinicCount: number;
  codeLabBridgePresent: boolean;
  starterCodeLineCount: number;
  proofOutputs: string[];
}

export function generatePythonAuditRows(contentPack: ContentPack): PythonAuditRow[] {
  // Sort modules of track-python by sortOrder
  const pythonModules = contentPack.modules
    .filter((m) => m.trackId === "track-python")
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const orderedLessons: Lesson[] = [];
  for (const mod of pythonModules) {
    for (const lId of mod.lessonIds) {
      const lessonObj = contentPack.lessons.find((l) => l.id === lId);
      if (lessonObj) {
        orderedLessons.push(lessonObj);
      }
    }
  }

  return orderedLessons.map((lesson, idx) => {
    const depth = lesson.depth;
    const curriculum = lesson.curriculum;

    const teaches = curriculum?.teaches ?? [];
    const requires = curriculum?.requires ?? [];
    const visibleCodeConcepts = curriculum?.visibleCodeConcepts ?? [];
    const quizConcepts = curriculum?.quizConcepts ?? [];
    const proofOutputs = curriculum?.proofOutputs ?? [];

    const starterCode = lesson.workshop?.practice?.starterCode ?? "";
    const starterCodeLineCount = starterCode ? starterCode.split("\n").length : 0;

    return {
      orderIndex: idx + 1,
      moduleId: lesson.moduleId,
      lessonId: lesson.id,
      title: lesson.title,
      level: curriculum?.level ?? 0,
      teaches,
      requires,
      visibleCodeConcepts,
      quizConcepts,
      hasDepthBlock: !!depth,
      conceptCapsuleCount: depth?.conceptCapsules?.length ?? 0,
      guidedEditCount: depth?.guidedEdits?.length ?? 0,
      errorClinicCount: depth?.errorClinic?.length ?? 0,
      codeLabBridgePresent: !!depth?.codeLabBridge,
      starterCodeLineCount,
      proofOutputs: proofOutputs as string[]
    };
  });
}
