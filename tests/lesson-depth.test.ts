import { describe, expect, it } from "vitest";
import { lessonDepthSchema } from "@/domain/schemas";
import { validateContent } from "../scripts/validate-content";
import { contentPack } from "@/content/seed";

describe("lesson depth schemas", () => {
  it("parses valid lesson depth structure", () => {
    const validDepth = {
      primaryConceptId: "py.variable.assignment",
      secondaryConceptIds: ["py.print.variable"],
      maxNewConcepts: 2,
      conceptCapsules: [
        {
          conceptId: "py.variable.assignment",
          definition: "A variable stores a value under a name.",
          mentalModel: "Think of a variable as a label attached to a value.",
          syntaxShape: "name = value",
          tinyExample: "topic = \"python\"",
          commonMistake: "Putting the value on the left.",
          repairHint: "The name goes on the left.",
          usedIn: ["learn", "practice"]
        }
      ],
      codeWalkthrough: [
        {
          id: "w-1",
          label: "Store topic",
          codeFragment: "topic = \"python\"",
          conceptIds: ["py.variable.assignment"],
          explanation: "Stores python in topic.",
          learnerShouldBeAbleToSay: "topic is name"
        }
      ],
      guidedEdits: [
        {
          id: "g-1",
          instruction: "Change value to terminal.",
          conceptIds: ["py.variable.assignment"],
          expectedObservation: "prints terminal",
          wrongTurnHint: "keep topic on left"
        }
      ],
      errorClinic: [
        {
          id: "e-1",
          conceptIds: ["py.print.variable"],
          brokenExample: "print(\"topic\")",
          symptom: "prints word topic",
          likelyCause: "quotes print literal",
          fixStrategy: "remove quotes"
        }
      ],
      codeLabBridge: {
        story: "create a variable",
        usesConcepts: ["py.variable.assignment"],
        learnerOwns: ["name"],
        checkerOwns: ["assert"],
        runExpectation: "prints passed"
      },
      understandingProofPrompt: "explain print vs print(\"var\")",
      exitTicket: ["I can define variables"]
    };

    const parsed = lessonDepthSchema.safeParse(validDepth);
    expect(parsed.success).toBe(true);
  });

  it("fails parsing when required fields are missing", () => {
    const invalidDepth = {
      primaryConceptId: "", // empty
      secondaryConceptIds: []
      // missing conceptCapsules, codeWalkthrough etc.
    };

    const parsed = lessonDepthSchema.safeParse(invalidDepth);
    expect(parsed.success).toBe(false);
  });

  it("can run validation on contentPack", () => {
    const errors = validateContent();
    // Initially, there are no lessons with depth, so errors should be empty.
    expect(errors).toEqual([]);
  });
});
