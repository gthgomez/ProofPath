import { useEffect, useRef, useState, type ReactElement } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, sizing, spacing, toneColors } from "@/ui/theme";

export interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  busy?: boolean;
  details?: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

type FocusableNode = { focus?: () => void };

/**
 * Cross-platform confirmation dialog.
 *
 * React Native Web does not implement `Alert.alert`, so a destructive action
 * confirmed through it could never complete in a browser. This uses a real
 * modal surface on every platform and adds the browser behaviours users rely
 * on: focus starts on the safe (cancel) action, Escape cancels, Tab stays
 * inside the dialog, and the confirm action can fire at most once.
 */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = "Cancel",
  destructive = false,
  busy = false,
  details = [],
  onConfirm,
  onCancel
}: ConfirmDialogProps): ReactElement {
  const cancelRef = useRef<View>(null);
  const confirmRef = useRef<View>(null);
  const actedRef = useRef(false);
  const [acted, setActed] = useState(false);

  const blocked = busy || acted;

  useEffect(() => {
    if (visible) {
      actedRef.current = false;
      setActed(false);
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || Platform.OS !== "web") {
      return;
    }

    const cancelNode = cancelRef.current as unknown as FocusableNode | null;
    // Start on the safe action so an accidental Enter cannot destroy data.
    const focusTimer = setTimeout(() => cancelNode?.focus?.(), 0);

    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!blocked) {
          onCancel();
        }
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const active = (globalThis as { document?: Document }).document?.activeElement;
      const cancelNodeElement = cancelRef.current as unknown as FocusableNode | null;
      const confirmNodeElement = confirmRef.current as unknown as FocusableNode | null;
      const cancelElement = cancelNodeElement as unknown as { contains?: (node: unknown) => boolean } | null;
      const confirmElement = confirmNodeElement as unknown as { contains?: (node: unknown) => boolean } | null;
      const focusOnConfirm = Boolean(confirmElement?.contains?.(active));
      const focusOnCancel = Boolean(cancelElement?.contains?.(active));

      if (event.shiftKey && (focusOnCancel || !focusOnConfirm)) {
        event.preventDefault();
        (confirmRef.current as unknown as FocusableNode | null)?.focus?.();
      } else if (!event.shiftKey && (focusOnConfirm || !focusOnCancel)) {
        event.preventDefault();
        (cancelRef.current as unknown as FocusableNode | null)?.focus?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [blocked, onCancel, visible]);

  function confirmOnce(): void {
    // A ref guard closes the same-tick double-press window that state alone
    // leaves open before React re-renders the disabled button.
    if (blocked || actedRef.current) {
      return;
    }
    actedRef.current = true;
    setActed(true);
    onConfirm();
  }

  function cancelOnce(): void {
    if (busy) {
      return;
    }
    onCancel();
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={cancelOnce}
      transparent
      visible={visible}
    >
      <View style={styles.overlay} accessibilityViewIsModal>
        <View
          accessibilityLabel={title}
          accessibilityRole="alert"
          style={styles.panel}
        >
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {details.length > 0 ? (
            <View style={styles.details}>
              {details.map((detail) => (
                <Text key={detail} style={styles.detail}>- {detail}</Text>
              ))}
            </View>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel={cancelLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: busy }}
              disabled={busy}
              onPress={cancelOnce}
              ref={cancelRef}
              style={(state) => [
                styles.button,
                styles.cancelButton,
                busy ? styles.disabled : null,
                state.pressed ? styles.pressed : null
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.ink }]}>{cancelLabel}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={confirmLabel}
              accessibilityRole="button"
              accessibilityState={{ disabled: blocked, busy }}
              disabled={blocked}
              onPress={confirmOnce}
              ref={confirmRef}
              style={(state) => [
                styles.button,
                { backgroundColor: destructive ? toneColors.rose.fg : toneColors.blue.fg, borderColor: destructive ? toneColors.rose.fg : toneColors.blue.fg },
                blocked ? styles.disabled : null,
                state.pressed ? styles.pressed : null
              ]}
            >
              <Text style={[styles.buttonText, { color: colors.surface }]}>
                {busy ? "Working..." : confirmLabel}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.md
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    maxWidth: 520,
    padding: spacing.lg,
    width: "100%"
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 26
  },
  message: {
    color: colors.text,
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 22
  },
  details: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.sm
  },
  detail: {
    color: colors.muted,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 18
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs
  },
  button: {
    alignItems: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    flexGrow: 1,
    justifyContent: "center",
    minHeight: sizing.minTapTarget,
    minWidth: 120,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  cancelButton: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 20,
    textAlign: "center"
  },
  disabled: {
    opacity: 0.55
  },
  pressed: {
    opacity: 0.82
  }
});
