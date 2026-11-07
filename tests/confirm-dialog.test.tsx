// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/ui/confirm-dialog";

function renderDialog(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  const view = render(
    <ConfirmDialog
      cancelLabel="Keep my data"
      confirmLabel="Erase everything"
      destructive
      message="This clears saved work on this device."
      onCancel={onCancel}
      onConfirm={onConfirm}
      title="Reset saved work?"
      visible
      {...overrides}
    />
  );
  return { ...view, onCancel, onConfirm };
}

describe("ConfirmDialog", () => {
  it("shows what will be replaced and offers both actions", () => {
    renderDialog({ details: ["3 completed lessons", "2 editor drafts"] });

    expect(screen.getByText("Reset saved work?")).toBeTruthy();
    expect(screen.getByText("This clears saved work on this device.")).toBeTruthy();
    expect(screen.getByText("- 3 completed lessons")).toBeTruthy();
    expect(screen.getByLabelText("Keep my data")).toBeTruthy();
    expect(screen.getByLabelText("Erase everything")).toBeTruthy();
  });

  it("cancels without running the destructive action and leaves the dialog open for the parent to close", () => {
    const { onCancel, onConfirm } = renderDialog();

    fireEvent.click(screen.getByLabelText("Keep my data"));

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("Escape cancels and never confirms", () => {
    const { onCancel, onConfirm } = renderDialog();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("executes the destructive action at most once even for a rapid double press", () => {
    const { onConfirm } = renderDialog();
    const button = screen.getByLabelText("Erase everything");

    fireEvent.click(button);
    fireEvent.click(button);

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cannot execute while the parent reports a busy operation", () => {
    const { onConfirm } = renderDialog({ busy: true });

    fireEvent.click(screen.getByLabelText("Erase everything"));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("resets the one-shot guard when reopened", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { rerender } = render(
      <ConfirmDialog
        confirmLabel="Replace"
        message="Replace progress."
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="Replace?"
        visible
      />
    );

    fireEvent.click(screen.getByLabelText("Replace"));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    rerender(
      <ConfirmDialog
        confirmLabel="Replace"
        message="Replace progress."
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="Replace?"
        visible={false}
      />
    );
    rerender(
      <ConfirmDialog
        confirmLabel="Replace"
        message="Replace progress."
        onCancel={onCancel}
        onConfirm={onConfirm}
        title="Replace?"
        visible
      />
    );

    fireEvent.click(screen.getByLabelText("Replace"));
    expect(onConfirm).toHaveBeenCalledTimes(2);
  });
});
