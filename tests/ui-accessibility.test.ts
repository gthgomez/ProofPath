import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { clampPercent, contrastRatio, mergeAccessibilityState, passesAaContrast, percentAccessibilityValue } from "@/ui/accessibility";
import { colors, semanticColors, sizing, toneColors } from "@/ui/theme";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function readRepoFile(relativePath: string): string {
  return readFileSync(resolve(repoRoot, relativePath), "utf8");
}

interface SourceFile {
  relativePath: string;
  source: string;
}

function collectUiSource(relativeDir: string): SourceFile[] {
  return readdirSync(resolve(repoRoot, relativeDir), { withFileTypes: true }).flatMap((entry) => {
    const relativePath = `${relativeDir}/${entry.name}`;

    if (entry.isDirectory()) {
      return collectUiSource(relativePath);
    }

    return [".ts", ".tsx"].includes(extname(entry.name)) ? [{ relativePath, source: readRepoFile(relativePath) }] : [];
  });
}

function expectStyleMinHeightAtLeast(relativePath: string, styleName: string, minimum: number): void {
  const source = readRepoFile(relativePath);
  const styleBlock = new RegExp(`${styleName}:\\s*\\{([\\s\\S]*?)\\n\\s*\\}`, "m").exec(source)?.[1];
  expect(styleBlock, `${relativePath} style ${styleName} should exist`).toBeDefined();
  const rawMinHeight = /minHeight:\s*([^,\n]+)/.exec(styleBlock ?? "")?.[1]?.trim();
  expect(rawMinHeight, `${relativePath} style ${styleName} should define minHeight`).toBeDefined();

  const minHeight = rawMinHeight === "sizing.minTapTarget" ? sizing.minTapTarget : Number(rawMinHeight);
  expect(Number.isFinite(minHeight), `${relativePath} style ${styleName} minHeight should be numeric or sizing.minTapTarget`).toBe(true);
  expect(minHeight).toBeGreaterThanOrEqual(minimum);
}

const standardTextContrastPairs: Array<[string, string, string]> = [
  ["body text on surface", colors.text, colors.surface],
  ["body text on app background", colors.text, colors.background],
  ["muted text on surface", colors.muted, colors.surface],
  ["muted text on app background", colors.muted, colors.background],
  ["muted-strong text on muted surface", colors.mutedStrong, colors.surfaceMuted],
  ["heading text on surface", semanticColors.headingText, colors.surface],
  ["semantic muted text on surface", semanticColors.mutedText, colors.surface],
  ["code text on code background", colors.text, semanticColors.codeBackground],
  ...Object.entries(toneColors).flatMap(([tone, mappedTone]) => [
    [`${tone} tone foreground on soft background`, mappedTone.fg, mappedTone.bg],
    [`${tone} tone strong text on soft background`, mappedTone.strong, mappedTone.bg],
    [`white text on ${tone} primary button`, "#FFFFFF", mappedTone.fg]
  ] as Array<[string, string, string]>)
];

const touchTargetContracts: Array<[string, string]> = [
  ["src/ui/primitives.tsx", "backButton"],
  ["src/ui/primitives.tsx", "button"],
  ["src/ui/primitives.tsx", "buttonCompact"],
  ["src/ui/code-terminal.tsx", "densityButton"],
  ["src/ui/code-terminal.tsx", "expandButton"],
  ["src/ui/code-problems.tsx", "locationButton"],
  ["src/ui/code-problems.tsx", "rawDetailButton"],
  ["src/ui/syntax-highlighted-editor.tsx", "completionChip"],
  ["app/onboarding.tsx", "indicatorDotContainer"]
];

describe("ui accessibility helpers", () => {
  it("clamps progress values to a stable accessibility range", () => {
    expect(clampPercent(-4)).toBe(0);
    expect(clampPercent(32.5)).toBe(33);
    expect(clampPercent(142)).toBe(100);
    expect(clampPercent(Number.NEGATIVE_INFINITY)).toBe(0);
    expect(clampPercent(Number.POSITIVE_INFINITY)).toBe(100);
    expect(clampPercent(Number.NaN)).toBe(0);
  });

  it("builds Android TalkBack-friendly progress values", () => {
    expect(percentAccessibilityValue(88.2)).toEqual({
      min: 0,
      max: 100,
      now: 88,
      text: "88%"
    });
    expect(percentAccessibilityValue(142)).toEqual({
      min: 0,
      max: 100,
      now: 100,
      text: "100%"
    });
  });

  it("merges selected and disabled states without erasing existing state", () => {
    expect(mergeAccessibilityState({ expanded: true }, { disabled: true, selected: false })).toEqual({
      expanded: true,
      disabled: true,
      selected: false
    });
    expect(mergeAccessibilityState({ busy: true, disabled: true }, { checked: "mixed", disabled: undefined })).toEqual({
      busy: true,
      disabled: true,
      checked: "mixed"
    });
  });

  it.each(standardTextContrastPairs)("keeps %s at WCAG AA contrast", (_, foreground, background) => {
    expect(passesAaContrast(foreground, background)).toBe(true);
  });

  it("keeps contrast calculations stable and symmetric", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 2);
    expect(contrastRatio(colors.surface, colors.text)).toBeCloseTo(contrastRatio(colors.text, colors.surface), 5);
    expect(contrastRatio(colors.text, colors.surface)).toBeGreaterThan(10);
  });

  it("keeps shared tap target tokens Android-friendly", () => {
    expect(sizing.minTapTarget).toBeGreaterThanOrEqual(48);
  });

  it.each(touchTargetContracts)("keeps %s %s at least 48dp high", (relativePath, styleName) => {
    expectStyleMinHeightAtLeast(relativePath, styleName, sizing.minTapTarget);
  });

  it("keeps large text scaling enabled in app and shared UI surfaces", () => {
    const uiSources = [...collectUiSource("app"), ...collectUiSource("src/ui")];
    const scalingOptOuts = uiSources
      .filter(({ source }) => /allowFontScaling\s*=\s*{\s*false\s*}/.test(source) || /ellipsizeMode\s*=/.test(source))
      .map(({ relativePath }) => relativePath);
    const primitivesSource = readRepoFile("src/ui/primitives.tsx");

    expect(scalingOptOuts).toEqual([]);
    expect(primitivesSource).toMatch(/button:\s*\{[\s\S]*?flexShrink: 1,/);
    expect(primitivesSource).toMatch(/buttonText:\s*\{[\s\S]*?flexShrink: 1,/);
    expect(primitivesSource).toMatch(/headerControls:\s*\{[\s\S]*?flexWrap: "wrap",/);
  });

  it("keeps primitive roles, labels, and state helpers wired for TalkBack", () => {
    const primitivesSource = readRepoFile("src/ui/primitives.tsx");

    expect(primitivesSource).toContain("accessibilityLabel={label}");
    expect(primitivesSource).toContain("accessibilityRole={accessibilityRole ?? \"button\"}");
    expect(primitivesSource).toContain("accessibilityState={state}");
    expect(primitivesSource).toContain("accessibilityRole=\"progressbar\"");
    expect(primitivesSource).toContain("accessibilityValue={percentAccessibilityValue(percent)}");
  });
});
