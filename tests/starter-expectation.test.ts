import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { contentPack } from "@/content/seed";
import { isScaffoldStarter, scaffoldStarterNotice } from "@/domain/starter-expectation";
import { runLessonSandbox } from "@/sandbox/runner";
import { validateSandboxSubmission } from "@/sandbox/policy";

describe("isScaffoldStarter", () => {
  it("detects a TODO marker paired with NotImplementedError as an intentional fill-in starter", () => {
    const starter = [
      "def total_minutes(sessions):",
      "    # TODO: add up the minutes across sessions and return the total.",
      "    raise NotImplementedError"
    ].join("\n");

    expect(isScaffoldStarter(starter)).toBe(true);
  });

  it("detects a plain TODO comment", () => {
    expect(isScaffoldStarter("# TODO: print the result below\n")).toBe(true);
  });

  it("does not classify a complete starter as scaffold", () => {
    const complete = [
      "def total_minutes(sessions):",
      "    total = 0",
      "    for s in sessions:",
      "        total = total + s['minutes']",
      "    return total",
      "",
      "print(total_minutes([{'topic': 'python', 'minutes': 30}]))"
    ].join("\n");

    expect(isScaffoldStarter(complete)).toBe(false);
  });

  it("does not match a lowercase 'todo' inside a string literal", () => {
    const code = "message = \"add this to your todo list\"\nprint(message)";

    expect(isScaffoldStarter(code)).toBe(false);
  });

  it("does not match a plural or embedded token (whole-word only)", () => {
    expect(isScaffoldStarter("# TODOs and AUTOTODO are not markers\nprint('ok')")).toBe(false);
  });

  it("does not classify an empty starter as scaffold", () => {
    expect(isScaffoldStarter("")).toBe(false);
  });
});

describe("scaffoldStarterNotice", () => {
  const notice = scaffoldStarterNotice();

  it("has a title and a body", () => {
    expect(notice.title.length).toBeGreaterThan(0);
    expect(notice.body.length).toBeGreaterThan(0);
  });

  it("says the checks are expected to fail by design until the TODO parts are implemented", () => {
    expect(notice.title + "\n" + notice.body).toContain("expected to fail");
    expect(notice.body).toContain("TODO");
  });

  it("explains both run buttons", () => {
    expect(notice.body).toContain("Run file");
    expect(notice.body).toContain("Run checks");
    expect(notice.body).toContain("without grading");
    expect(notice.body).toContain("graded checks");
  });

  it("never reveals the implementation", () => {
    const combined = `${notice.title}\n${notice.body}`;

    expect(combined).not.toContain("print(");
    expect(combined).not.toContain("raise NotImplementedError");
  });
});

describe("lesson-python-zero-first-script starter contract", () => {
  const lesson = contentPack.lessons.find((candidate) => candidate.id === "lesson-python-zero-first-script")!;
  const spec = lesson.workshop.miniProject.runnerSpec;

  it("keeps the shipped starter out of scaffold classification (no from-scratch TODO regression)", () => {
    expect(isScaffoldStarter(spec.starterCode)).toBe(false);
  });

  it("keeps the shipped starter inside the sandbox policy", () => {
    expect(validateSandboxSubmission(spec, spec.starterCode)).toEqual([]);
  });

  it("ships a near-complete starter whose executable text does not already satisfy the check", () => {
    const executableLines = spec.starterCode
      .split("\n")
      .filter((line) => !line.trim().startsWith("#"))
      .join("\n");

    // The print statement is provided; only the string literal is missing, so
    // the expected phrase cannot appear in the executable starter text.
    expect(executableLines).toContain("print(");
    expect(executableLines).not.toContain("first run");
    // The check's expectation must still be reachable by a one-line fill-in.
    expect(spec.expectedOutput).toContain("first run");
  });

  describe("fails as shipped and passes after the one-line fix (real sandbox execution)", () => {
    beforeAll(() => {
      globalThis.__proofpathImportRuntimeModuleForTests = (specifier: string) => import(specifier);
    });

    afterAll(() => {
      globalThis.__proofpathImportRuntimeModuleForTests = undefined;
    });

    it("fails the graded checks with the shipped starter", async () => {
      const result = await runLessonSandbox(spec, lesson.id, spec.starterCode, "2026-05-07T21:30:00.000Z", "run_checks");

      expect(result.passed).toBe(false);
      expect(result.testResults.length).toBeGreaterThan(0);
      expect(result.testResults.every((testResult) => testResult.passed)).toBe(false);
    }, 60000);

    it("passes every visible and hidden check once the learner fills in the missing string", async () => {
      const fixed = spec.starterCode.replace('print("")', 'print("first run")');

      // The fix is a single edit inside the provided quotes.
      expect(fixed).not.toBe(spec.starterCode);
      expect(fixed.replace('print("first run")', 'print("")')).toBe(spec.starterCode);

      const result = await runLessonSandbox(spec, lesson.id, fixed, "2026-05-07T21:31:00.000Z", "run_checks");

      expect(result.passed).toBe(true);
      expect(result.stdout).toContain("first run");
    }, 60000);
  });
});
