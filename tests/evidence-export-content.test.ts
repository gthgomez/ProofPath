import { describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { addEvidenceItem, createInitialProgress, recordCodeRunAttempt, setRoleTarget } from "@/domain/progress";
import { generateReviewerPortfolioExport } from "@/domain/evidence-export";
import type { CodeRunAttempt, EvidenceItem, UserProgress } from "@/domain/types";

const NOW = "2026-10-09T12:00:00.000Z";

function onboarded(): UserProgress {
  return setRoleTarget(createInitialProgress(NOW), "path-software-foundations", true, NOW);
}

function attempt(overrides: Partial<CodeRunAttempt> = {}): CodeRunAttempt {
  return {
    id: "attempt-export",
    lessonId: "lesson-python-values",
    language: "python",
    runMode: "run_checks",
    command: "proofpath checks",
    codeSnapshot: "print('ok')",
    stdout: "ok",
    stderr: "",
    passed: true,
    score: 100,
    runtimeMs: 9,
    testResults: [{ id: "visible", name: "Visible check", passed: true, visible: true, message: "ok" }],
    hiddenCheckSummary: { total: 2, passed: 2, failed: 0 },
    diagnostics: [],
    terminalTranscript: [
      { type: "command", text: "$ proofpath checks" },
      { type: "stdout", text: "ok" },
      { type: "result", status: "passed", reason: "success", runtimeMs: 9, exitCode: 0 }
    ],
    createdAt: NOW,
    ...overrides
  };
}

describe("reviewer export content", () => {
  it("includes lesson-linked evidence, not only mission-linked entries", () => {
    let progress = onboarded();
    progress = addEvidenceItem(progress, {
      type: "test-output",
      title: "Lesson values proof",
      body: "Captured the values lesson run.",
      linkedLessonId: "lesson-python-values",
      testStatus: "passing",
      verifierOutput: "python values.py -> ok"
    }, NOW);

    const packet = generateReviewerPortfolioExport(contentPack, progress, NOW);

    expect(packet.lessons).toHaveLength(1);
    expect(packet.markdownPacket).toContain("## Lesson evidence");
    expect(packet.markdownPacket).toContain("Lesson values proof");
    expect(packet.summary.lessonLinkedCount).toBe(1);
    expect(packet.summary.missionLinkedCount).toBe(0);
  });

  it("labels self-reported output honestly and never as independently verified", () => {
    const progress = addEvidenceItem(onboarded(), {
      type: "test-output",
      title: "Pasted output",
      body: "Ran it locally.",
      linkedProjectMissionId: "mission-cli-study-tracker",
      testStatus: "passing",
      verifierOutput: "pytest: 4 passed"
    }, NOW);

    const packet = generateReviewerPortfolioExport(contentPack, progress, NOW);

    expect(packet.markdownPacket).toContain("Classification:** Self-reported check output");
    expect(packet.markdownPacket).not.toContain("Classification:** Locally verified (Code Lab)");
    expect(packet.markdownPacket).not.toContain("Classification:** Independently verified");
    expect(packet.summary.selfReportedCount).toBe(1);
    expect(packet.summary.autoVerifiedCount).toBe(0);
  });

  it("renders an empty portfolio without throwing", () => {
    const packet = generateReviewerPortfolioExport(contentPack, onboarded(), NOW);

    expect(packet.summary.totalEvidenceCount).toBe(0);
    expect(packet.markdownPacket).toContain("No lesson evidence has been recorded yet");
    expect(packet.markdownPacket).toContain("No mission evidence has been recorded yet");
    expect(packet.markdownPacket).toContain("## Limitations");
  });

  it("handles a large portfolio", () => {
    let progress = onboarded();
    for (let index = 0; index < 300; index += 1) {
      progress = addEvidenceItem(progress, {
        type: "note",
        title: `Note ${index}`,
        body: `Body ${index}`,
        linkedLessonId: "lesson-python-values"
      }, NOW);
    }

    const packet = generateReviewerPortfolioExport(contentPack, progress, NOW);
    expect(packet.summary.totalEvidenceCount).toBe(300);
    expect(packet.markdownPacket).toContain("Note 0");
    expect(packet.markdownPacket).toContain("Note 299");
  });

  it("keeps unusual text from closing the code fence early", () => {
    const payload = "line one\n```\nnot a fence break\n````\nend";
    const progress = addEvidenceItem(onboarded(), {
      type: "test-output",
      title: "Weird ### title with `backticks`",
      body: "Body with ``` fences and # headings.",
      linkedLessonId: "lesson-python-values",
      testStatus: "passing",
      verifierOutput: payload
    }, NOW);

    const packet = generateReviewerPortfolioExport(contentPack, progress, NOW);

    expect(packet.markdownPacket).toContain("Weird ### title with `backticks`");
    // A fence strictly longer than any run in the payload (4 backticks here).
    expect(packet.markdownPacket).toContain("`````");
  });

  it("does not leak hidden-check material into the export", () => {
    const base = recordCodeRunAttempt(onboarded(), attempt(), NOW);
    const proofItem = base.evidenceItems.find((item) => item.proofArtifact)!;
    // Simulate a proof artifact carrying an unexpected hidden field.
    const planted = {
      ...proofItem,
      proofArtifact: {
        ...proofItem.proofArtifact,
        hiddenCheckNames: ["SECRET_HIDDEN_CHECK"]
      }
    } as unknown as EvidenceItem;

    const packet = generateReviewerPortfolioExport(contentPack, { ...base, evidenceItems: [planted] }, NOW);
    const serialized = JSON.stringify(packet);

    expect(serialized).not.toContain("SECRET_HIDDEN_CHECK");
    expect(packet.markdownPacket).not.toContain("SECRET_HIDDEN_CHECK");
    // The redacted summary is allowed through.
    expect(serialized).toContain("hiddenCheckSummary");
  });
});
