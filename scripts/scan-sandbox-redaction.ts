import {
  createProofArtifactFromAttempt,
  formatTerminalTranscript,
  normalizeCodeRunAttempt
} from "../src/domain/code-run";
import { parseNativeWebViewRunnerResult } from "../src/sandbox/native-webview-runner";

const HIDDEN_SENTINEL = "CAREERFORGE_HIDDEN_SENTINEL_DO_NOT_LEAK";

const rawAttempt = normalizeCodeRunAttempt({
  id: "redaction-scan-attempt",
  lessonId: "lesson-redaction-scan",
  language: "javascript",
  runMode: "run_checks",
  command: "careerforge checks lesson.js",
  codeSnapshot: "console.log('visible ok')",
  stdout: "visible ok",
  stderr: "",
  passed: true,
  score: 100,
  runtimeMs: 4,
  testResults: [
    { id: "visible", name: "Visible output", passed: true, visible: true, message: "Passed" },
    {
      id: "hidden",
      name: `${HIDDEN_SENTINEL} hidden name`,
      passed: true,
      visible: false,
      message: `${HIDDEN_SENTINEL} hidden message`
    }
  ],
  createdAt: "2026-05-08T00:00:00.000Z"
});

const proof = createProofArtifactFromAttempt(rawAttempt);
const nativeParsed = parseNativeWebViewRunnerResult(JSON.stringify({
  type: "sandbox-result",
  attempt: {
    ...rawAttempt,
    testResults: [
      ...rawAttempt.testResults,
      {
        id: "hidden-again",
        name: `${HIDDEN_SENTINEL} native hidden name`,
        passed: false,
        visible: false,
        message: `${HIDDEN_SENTINEL} native hidden message`
      }
    ]
  }
}));

const scannedSurfaces = [
  JSON.stringify(rawAttempt.testResults),
  formatTerminalTranscript(rawAttempt.terminalTranscript),
  proof ? JSON.stringify(proof) : "",
  nativeParsed ? JSON.stringify(nativeParsed) : ""
];

const leakedSurfaceIndex = scannedSurfaces.findIndex((surface) => surface.includes(HIDDEN_SENTINEL));

if (leakedSurfaceIndex >= 0) {
  console.error(`Hidden check sentinel leaked from sandbox surface ${leakedSurfaceIndex}.`);
  process.exit(1);
}

console.log("Sandbox redaction scan passed.");
