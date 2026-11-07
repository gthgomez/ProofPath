import { beforeEach, describe, expect, it } from "vitest";
import {
  clearEditorDraft,
  getEditorDraft,
  resetDraftStoreForTests,
  saveEditorDraft
} from "@/storage/draft-store";

describe("editor draft store", () => {
  beforeEach(() => {
    resetDraftStoreForTests();
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it("returns null when no draft exists for a lesson", () => {
    expect(getEditorDraft("lesson-python-test")).toBeNull();
  });

  it("persists and retrieves unrun editor edits", () => {
    saveEditorDraft("lesson-python-test", "x = 42\nprint(x)");
    expect(getEditorDraft("lesson-python-test")).toBe("x = 42\nprint(x)");
  });

  it("updates existing drafts when more edits are made after a run", () => {
    saveEditorDraft("lesson-python-test", "initial code");
    saveEditorDraft("lesson-python-test", "updated code after run");
    expect(getEditorDraft("lesson-python-test")).toBe("updated code after run");
  });

  it("clears drafts when reset starter is triggered", () => {
    saveEditorDraft("lesson-python-test", "custom code");
    clearEditorDraft("lesson-python-test");
    expect(getEditorDraft("lesson-python-test")).toBeNull();
  });

  it("isolates drafts across different lessons", () => {
    saveEditorDraft("lesson-a", "code for a");
    saveEditorDraft("lesson-b", "code for b");
    expect(getEditorDraft("lesson-a")).toBe("code for a");
    expect(getEditorDraft("lesson-b")).toBe("code for b");
  });
});
