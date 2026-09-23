import { contentPack } from "../src/content/seed";
import { validateContent } from "./validate-content";

/**
 * Single-process runner for the three content-integrity stages of
 * `npm run verify` (validate:content -> report:content -> scan:redaction).
 * Saves two tsx/node startups per verify; stage output and exit codes are
 * identical to running each npm script standalone. The individual
 * validate:content / report:content / scan:redaction scripts stay available.
 */

async function main(): Promise<void> {
  const errors = validateContent();
  if (errors.length > 0) {
    console.error(errors.join("\n"));
    process.exit(1);
  }
  console.log(
    `Validated ${contentPack.tracks.length} tracks, ${contentPack.lessons.length} lessons, ${contentPack.quizzes.length} quizzes, and ${contentPack.projectMissions.length} missions successfully.`
  );

  // report-content and scan-sandbox-redaction run their checks at module scope
  // and report through process.exitCode instead of process.exit, so a failed
  // stage stops the runner here.
  await import("./report-content");
  if (process.exitCode) {
    process.exit(process.exitCode);
  }

  await import("./scan-sandbox-redaction");
  if (process.exitCode) {
    process.exit(process.exitCode);
  }
}

void main();
