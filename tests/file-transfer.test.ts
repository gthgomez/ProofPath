// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { downloadTextFile } from "@/ui/file-transfer";
import { studyTrackerFullJourneyTask } from "@/content/workspace-tasks";
import { createWorkspaceBundle, serializeWorkspaceBundle } from "@/domain/workspace-bridge";

function stubDownloadEnvironment() {
  const anchors: HTMLAnchorElement[] = [];
  const originalCreateElement = document.createElement.bind(document);

  vi.spyOn(document, "createElement").mockImplementation(((tagName: string) => {
    const element = originalCreateElement(tagName);
    if (tagName.toLowerCase() === "a") {
      const anchor = element as HTMLAnchorElement;
      anchor.click = vi.fn();
      anchor.remove = vi.fn();
      anchors.push(anchor);
    }
    return element;
  }) as unknown as typeof document.createElement);

  const createObjectURL = vi.fn((_blob: unknown) => "blob:proofpath");
  const revokeObjectURL = vi.fn();
  Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });

  return { anchors, createObjectURL, revokeObjectURL };
}

describe("web file download", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads the exact content under the requested file name", async () => {
    const { anchors, createObjectURL, revokeObjectURL } = stubDownloadEnvironment();

    const outcome = await downloadTextFile("proofpath-portfolio.md", "# Packet\n\nbody", "text/markdown");

    expect(outcome).toBe("downloaded");
    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.download).toBe("proofpath-portfolio.md");
    expect(anchors[0]?.href).toBe("blob:proofpath");
    expect(anchors[0]?.click).toHaveBeenCalledTimes(1);
    expect(anchors[0]?.remove).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:proofpath");

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    await expect(blob.text()).resolves.toBe("# Packet\n\nbody");
  });

  it("downloads a reconstructable workspace bundle with every file path", async () => {
    const { anchors, createObjectURL } = stubDownloadEnvironment();
    const bundle = createWorkspaceBundle(studyTrackerFullJourneyTask);
    const content = serializeWorkspaceBundle(bundle);

    const outcome = await downloadTextFile(bundle.fileName, content, "application/json");

    expect(outcome).toBe("downloaded");
    expect(bundle.fileName).toMatch(/\.workspace\.json$/);
    expect(anchors[0]?.download).toBe(bundle.fileName);

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob;
    const parsed = JSON.parse(await blob.text()) as {
      taskId: string;
      files: Array<{ path: string; content: string }>;
    };
    expect(parsed.taskId).toBe(bundle.taskId);
    expect(parsed.files.map((file) => file.path)).toEqual(bundle.files.map((file) => file.path));
    expect(parsed.files.length).toBeGreaterThan(0);
    // The export is self-contained: file contents travel with the paths.
    expect(parsed.files.every((file) => typeof file.content === "string")).toBe(true);
  });
});
