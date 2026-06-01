export const colors = {
  background: "#F8FAFF",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  surfaceMuted: "#EAF1FF",
  surfacePressed: "#D6E3FA",
  text: "#0F1E33",
  muted: "#4A5C78",
  mutedStrong: "#263B58",
  border: "#D7E2F2",
  borderStrong: "#B8CAE8",
  blue: "#0B2F6A", // navy primary
  blueSoft: "#DCE6F7",
  blueMuted: "#B7CAE6",
  blueStrong: "#08234F",
  gold: "#0B5CAD", // accessible electric-blue secondary/accent
  goldSoft: "#E6F0FF",
  goldMuted: "#B5D4FF",
  goldStrong: "#084A8A",
  amber: "#0B5CAD", // keep key compatibility, same accent family
  amberSoft: "#E6F0FF",
  amberMuted: "#B5D4FF",
  amberStrong: "#084A8A",
  emerald: "#0B6F61",
  emeraldSoft: "#E5F6F2",
  emeraldMuted: "#9FD8C9",
  emeraldStrong: "#084F45",
  green: "#0B6F61",
  greenSoft: "#E5F6F2",
  greenMuted: "#9FD8C9",
  greenStrong: "#084F45",
  teal: "#005F8F",
  tealSoft: "#E6F0FF",
  tealMuted: "#B5D4FF",
  tealStrong: "#064C72",
  crimson: "#B42318",
  crimsonSoft: "#FCEFED",
  crimsonMuted: "#EFAEA9",
  crimsonStrong: "#8E1B13",
  rose: "#B42318",
  roseSoft: "#FCEFED",
  roseMuted: "#EFAEA9",
  roseStrong: "#8E1B13",
  ink: "#0F1E33",
  inkSoft: "#EAF0FA",
  inkMuted: "#C3CFDD",
  inkStrong: "#0A1626"
};

export const semanticColors = {
  lessonPrimary: colors.blue,
  lessonSoft: colors.blueSoft,
  lessonStrong: colors.blueStrong,

  missionPrimary: colors.gold,
  missionSoft: colors.goldSoft,
  missionStrong: colors.goldStrong,

  proofPrimary: colors.gold,
  proofSoft: colors.goldSoft,
  proofStrong: colors.goldStrong,

  success: colors.emerald,
  successSoft: colors.emeraldSoft,
  successStrong: colors.emeraldStrong,

  progress: colors.teal,
  progressSoft: colors.tealSoft,
  progressStrong: colors.tealStrong,

  warning: colors.amber,
  warningSoft: colors.amberSoft,
  warningStrong: colors.amberStrong,

  danger: colors.crimson,
  dangerSoft: colors.crimsonSoft,
  dangerStrong: colors.crimsonStrong,

  headingText: colors.text,
  mutedText: colors.muted,
  badgeBackground: colors.surface,
  badgeBorder: colors.border,
  codeBackground: colors.surfaceMuted
};

export type Tone = "blue" | "teal" | "amber" | "rose" | "green" | "ink";

export const toneColors: Record<Tone, { fg: string; bg: string; border: string; strong: string }> = {
  blue: {
    fg: colors.blue,
    bg: colors.blueSoft,
    border: colors.blueMuted,
    strong: colors.blueStrong
  },
  amber: {
    fg: colors.gold,
    bg: colors.goldSoft,
    border: colors.goldMuted,
    strong: colors.goldStrong
  },
  green: {
    fg: colors.emerald,
    bg: colors.emeraldSoft,
    border: colors.emeraldMuted,
    strong: colors.emeraldStrong
  },
  teal: {
    fg: colors.teal,
    bg: colors.tealSoft,
    border: colors.tealMuted,
    strong: colors.tealStrong
  },
  rose: {
    fg: colors.crimson,
    bg: colors.crimsonSoft,
    border: colors.crimsonMuted,
    strong: colors.crimsonStrong
  },
  ink: {
    fg: colors.ink,
    bg: colors.inkSoft,
    border: colors.inkMuted,
    strong: colors.inkStrong
  }
};

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 30
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 8
};

export const sizing = {
  minTapTarget: 48,
  compactTapTarget: 44
};
