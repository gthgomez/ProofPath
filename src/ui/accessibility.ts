export interface UiAccessibilityState {
  disabled?: boolean;
  selected?: boolean;
  busy?: boolean;
  checked?: boolean | "mixed";
  expanded?: boolean;
}

export interface UiAccessibilityValue {
  min: number;
  max: number;
  now: number;
  text: string;
}

export function relativeLuminance(hexColor: string): number {
  const normalized = hexColor.replace("#", "");
  const red = parseInt(normalized.slice(0, 2), 16) / 255;
  const green = parseInt(normalized.slice(2, 4), 16) / 255;
  const blue = parseInt(normalized.slice(4, 6), 16) / 255;

  return [red, green, blue]
    .map((channel) => channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

export function contrastRatio(foreground: string, background: string): number {
  const foregroundLum = relativeLuminance(foreground);
  const backgroundLum = relativeLuminance(background);
  const lighter = Math.max(foregroundLum, backgroundLum);
  const darker = Math.min(foregroundLum, backgroundLum);

  return (lighter + 0.05) / (darker + 0.05);
}

export function passesAaContrast(foreground: string, background: string, largeText = false): boolean {
  return contrastRatio(foreground, background) >= (largeText ? 3 : 4.5);
}

export function clampPercent(value: number): number {
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function mergeAccessibilityState(
  baseState: UiAccessibilityState | undefined,
  overrides: UiAccessibilityState
): UiAccessibilityState {
  return {
    ...baseState,
    ...Object.fromEntries(
      Object.entries(overrides).filter(([, value]) => value !== undefined)
    )
  };
}

export function percentAccessibilityValue(value: number): UiAccessibilityValue {
  const percent = clampPercent(value);

  return {
    min: 0,
    max: 100,
    now: percent,
    text: `${percent}%`
  };
}
