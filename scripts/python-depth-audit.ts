import { contentPack } from "../src/content/seed";
import { generatePythonAuditRows } from "../src/domain/content-audit";
import type { ContentPack } from "../src/domain/types";

function run() {
  const rows = generatePythonAuditRows(contentPack as ContentPack);

  console.log("# Python Lesson Depth Audit Table\n");
  console.log(
    "| Index | Module | Lesson ID | Title | Level | Teaches | Requires | Visible Concepts | Quiz Concepts | Depth? | Capsules | Edits | Clinics | Bridge? | Starter Lines | Proof Outputs |"
  );
  console.log(
    "|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|"
  );

  for (const row of rows) {
    const teachesStr = row.teaches.join(", ") || "none";
    const requiresStr = row.requires.join(", ") || "none";
    const visibleStr = row.visibleCodeConcepts.join(", ") || "none";
    const quizStr = row.quizConcepts.join(", ") || "none";
    const proofStr = row.proofOutputs.join(", ") || "none";

    console.log(
      `| ${row.orderIndex} | ${row.moduleId} | ${row.lessonId} | ${row.title} | ${row.level} | ${teachesStr} | ${requiresStr} | ${visibleStr} | ${quizStr} | ${row.hasDepthBlock ? "Yes" : "No"} | ${row.conceptCapsuleCount} | ${row.guidedEditCount} | ${row.errorClinicCount} | ${row.codeLabBridgePresent ? "Yes" : "No"} | ${row.starterCodeLineCount} | ${proofStr} |`
    );
  }
}

run();
