import { Platform, Share } from "react-native";

export type TransferOutcome = "downloaded" | "shared" | "clipped" | "unsupported" | "failed";

interface ClipboardLike {
  clipboard?: { writeText?: (value: string) => Promise<void> };
}

/**
 * Save text as a file on the web. On native there is no download primitive, so
 * callers must fall back to sharing or an explicitly-labelled copy.
 */
export async function downloadTextFile(fileName: string, content: string, mimeType = "text/plain"): Promise<TransferOutcome> {
  if (Platform.OS !== "web") {
    return "unsupported";
  }

  // Structural types keep this DOM-free for the React Native type environment.
  const scope = globalThis as {
    document?: {
      body: { appendChild: (node: unknown) => void };
      createElement: (tag: string) => { href: string; download: string; click: () => void; remove: () => void };
    };
    Blob?: new (parts: string[], options: { type: string }) => unknown;
    URL?: { createObjectURL?: (blob: unknown) => string; revokeObjectURL?: (url: string) => void };
  };
  if (!scope.document || !scope.Blob || typeof scope.URL?.createObjectURL !== "function") {
    return "unsupported";
  }

  try {
    const blob = new scope.Blob([content], { type: mimeType });
    const url = scope.URL.createObjectURL(blob);
    const anchor = scope.document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    scope.document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    scope.URL.revokeObjectURL?.(url);
    return "downloaded";
  } catch {
    return "failed";
  }
}

/** Share text through the platform share sheet (native). */
export async function shareText(title: string, message: string): Promise<TransferOutcome> {
  if (Platform.OS === "web") {
    return "unsupported";
  }

  try {
    await Share.share({ title, message });
    return "shared";
  } catch {
    return "failed";
  }
}

/** Copy text to the clipboard. Never label this an "export" or "download". */
export async function copyToClipboard(content: string): Promise<TransferOutcome> {
  const maybeNavigator = (globalThis as typeof globalThis & { navigator?: ClipboardLike }).navigator;

  if (!maybeNavigator?.clipboard?.writeText) {
    return "unsupported";
  }

  try {
    await maybeNavigator.clipboard.writeText(content);
    return "clipped";
  } catch {
    return "failed";
  }
}
