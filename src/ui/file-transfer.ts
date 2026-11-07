import { Platform, Share } from "react-native";

/** A backup larger than this is almost certainly not a ProofPath document. */
export const MAX_IMPORT_FILE_BYTES = 50_000_000;

export type TransferOutcome = "downloaded" | "shared" | "clipped" | "dismissed" | "unsupported" | "failed";

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

export type PickTextFileResult =
  | { status: "picked"; fileName: string; content: string }
  | { status: "cancelled" }
  | { status: "unsupported" }
  | { status: "failed"; error?: string };

interface BrowserFileLike {
  name: string;
  size?: number;
  text: () => Promise<string>;
}

interface BrowserFileInputLike {
  type: string;
  accept: string;
  files: { 0?: BrowserFileLike } | null;
  onchange: (() => void) | null;
  oncancel: (() => void) | null;
  click: () => void;
  remove: () => void;
}

/**
 * Ask the learner to choose a text file. Web uses a real file input so a
 * cancelled picker resolves instead of hanging; native uses the system document
 * picker and reads the chosen file through the filesystem module.
 */
export async function pickTextFile(
  mimeTypes: string[] = ["application/json", "text/plain"],
  webAccept = ".json,.txt,application/json,text/plain"
): Promise<PickTextFileResult> {
  if (Platform.OS === "web") {
    const scope = globalThis as unknown as {
      document?: {
        body: { appendChild: (node: unknown) => void };
        createElement: (tag: string) => BrowserFileInputLike;
      };
    };
    if (!scope.document) {
      return { status: "unsupported" };
    }

    return new Promise<PickTextFileResult>((resolve) => {
      const input = scope.document!.createElement("input");
      input.type = "file";
      input.accept = webAccept;
      input.onchange = () => {
        const file = input.files?.[0];
        input.remove();
        if (!file) {
          resolve({ status: "cancelled" });
          return;
        }
        if (typeof file.size === "number" && file.size > MAX_IMPORT_FILE_BYTES) {
          resolve({ status: "failed", error: "That file is too large for ProofPath to import." });
          return;
        }
        file.text()
          .then((content) => resolve({ status: "picked", fileName: file.name, content }))
          .catch(() => resolve({ status: "failed", error: "The selected file could not be read." }));
      };
      input.oncancel = () => {
        input.remove();
        resolve({ status: "cancelled" });
      };
      scope.document!.body.appendChild(input);
      input.click();
    });
  }

  try {
    // Loaded only on native; the web branch above never touches these modules.
    const DocumentPicker = await import("expo-document-picker");
    const result = await DocumentPicker.getDocumentAsync({
      type: mimeTypes,
      copyToCacheDirectory: true,
      multiple: false,
      base64: false
    });
    if (result.canceled) {
      return { status: "cancelled" };
    }
    const asset = result.assets?.[0];
    if (!asset) {
      return { status: "cancelled" };
    }
    if (typeof asset.size === "number" && asset.size > MAX_IMPORT_FILE_BYTES) {
      return { status: "failed", error: "That file is too large for ProofPath to import." };
    }
    const { File } = await import("expo-file-system");
    const content = await new File(asset.uri).text();
    return { status: "picked", fileName: asset.name, content };
  } catch (caughtError) {
    return {
      status: "failed",
      error: caughtError instanceof Error ? caughtError.message : "The selected file could not be read."
    };
  }
}

/**
 * Write a named file to app storage and open the system share sheet with the
 * file itself. Returns `unsupported` when the platform cannot share files and
 * `failed` only when writing or opening the sheet threw. A dismissed sheet is
 * indistinguishable from a completed share in this API, so callers must not
 * claim the file was saved.
 */
export async function shareFile(
  fileName: string,
  content: string,
  mimeType = "text/plain"
): Promise<TransferOutcome> {
  if (Platform.OS === "web") {
    return "unsupported";
  }

  try {
    const Sharing = await import("expo-sharing");
    if (!(await Sharing.isAvailableAsync())) {
      return "unsupported";
    }
    const { File, Paths } = await import("expo-file-system");
    const file = new File(Paths.cache, fileName);
    file.write(content);
    await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: fileName });
    return "shared";
  } catch {
    return "failed";
  }
}

/**
 * Share text through the platform share sheet (native).
 *
 * This is the fallback for platforms where file sharing is unavailable. It
 * shares TEXT, not a named attachment, so callers must label it accordingly.
 * A dismissed sheet is reported as a cancellation, never as success.
 */
export async function shareText(title: string, message: string): Promise<TransferOutcome> {
  if (Platform.OS === "web") {
    return "unsupported";
  }

  try {
    const result = await Share.share({ title, message });
    const action = (result as { action?: string } | undefined)?.action;
    return action === "dismissedAction" ? "dismissed" : "shared";
  } catch {
    return "failed";
  }
}

/** Copy text to the clipboard. Never label this an "export" or "download". */
export async function copyToClipboard(content: string): Promise<TransferOutcome> {
  // `navigator.clipboard` is a browser API and is absent on native. React
  // Native's core Clipboard bridge is deprecated and slated for removal, so use
  // the SDK-matched Expo module on device instead of reporting a false
  // "unsupported" and leaving the learner without a copy path.
  if (Platform.OS !== "web") {
    try {
      // Loaded lazily so the web/test bundle never initializes a native module.
      const ExpoClipboard = await import("expo-clipboard");
      await ExpoClipboard.setStringAsync(content);
      return "clipped";
    } catch {
      return "failed";
    }
  }

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
