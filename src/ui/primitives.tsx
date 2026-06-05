import type { Href } from "expo-router";
import { Link, usePathname, useRouter } from "expo-router";
import type { PropsWithChildren, ReactElement, ReactNode } from "react";
import type { PressableProps, TextProps, ViewProps } from "react-native";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clampPercent, mergeAccessibilityState, percentAccessibilityValue } from "@/ui/accessibility";
import { colors, radius, sizing, spacing, toneColors, type Tone } from "./theme";

interface ScreenProps extends PropsWithChildren {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  backHref?: Href;
  backLabel?: string;
  showBack?: boolean;
  stickyAction?: ReactNode;
}

export function Screen({
  title,
  eyebrow,
  action,
  backHref,
  backLabel = "Back",
  children,
  showBack,
  stickyAction
}: ScreenProps): ReactElement {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const shouldShowBack = showBack ?? !isRootScreen(pathname);
  const shouldShowBottomNavigation = showsBottomNavigation(pathname);

  return (
    <View style={styles.screenFrame}>
      <ScrollView
        contentContainerStyle={[
          styles.screen,
          {
            paddingBottom: spacing.xl + insets.bottom,
            paddingTop: spacing.md + insets.top
          }
        ]}
        keyboardShouldPersistTaps="handled"
        style={styles.screenScroller}
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            {shouldShowBack || action ? (
              <View style={styles.headerControls}>
                {shouldShowBack ? <BackButton fallbackHref={backHref ?? getFallbackBackHref(pathname)} label={backLabel} /> : null}
                {action}
              </View>
            ) : null}
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          </View>
        </View>
        {children}
      </ScrollView>
      {stickyAction || shouldShowBottomNavigation ? (
        <View style={[styles.screenFooter, { paddingBottom: spacing.sm + insets.bottom }]}>
          {stickyAction}
          {shouldShowBottomNavigation ? <BottomNavigation pathname={pathname} /> : null}
        </View>
      ) : null}
    </View>
  );
}

function BackButton({ fallbackHref, label }: { fallbackHref: Href; label: string }): ReactElement {
  const router = useRouter();

  return (
    <Pressable
      accessibilityHint="Returns to the previous screen when history exists, otherwise opens the parent screen."
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={() => {
        if (router.canGoBack()) {
          router.back();
          return;
        }

        router.replace(fallbackHref);
      }}
      style={(pressState) => [
        styles.backButton,
        pressState.pressed ? styles.buttonPressed : null
      ]}
    >
      <Text style={styles.backButtonText}>{`< ${label}`}</Text>
    </Pressable>
  );
}

function isRootScreen(pathname: string): boolean {
  return pathname === "/"
    || pathname === "/path"
    || pathname === "/projects"
    || pathname === "/evidence"
    || pathname === "/settings"
    || pathname === "/onboarding";
}

function getFallbackBackHref(pathname: string): Href {
  if (pathname.startsWith("/lesson/")) {
    return "/path";
  }

  if (pathname.startsWith("/mission/")) {
    return "/projects";
  }

  return "/";
}

type RootNavItem = {
  href: Href;
  label: string;
  matches: readonly string[];
};

const rootNavItems: readonly RootNavItem[] = [
  { href: "/", label: "Today", matches: ["/", "/readiness", "/review", "/weekly-plan"] },
  { href: "/path", label: "Learn", matches: ["/path", "/lesson"] },
  { href: "/projects", label: "Build", matches: ["/projects", "/mission"] },
  { href: "/evidence", label: "Portfolio", matches: ["/evidence"] },
  { href: "/settings", label: "Settings", matches: ["/settings"] }
];

function showsBottomNavigation(pathname: string): boolean {
  return pathname !== "/onboarding";
}

function isNavItemSelected(pathname: string, item: RootNavItem): boolean {
  return item.matches.some((match) => pathname === match || (match !== "/" && pathname.startsWith(`${match}/`)));
}

function BottomNavigation({ pathname }: { pathname: string }): ReactElement {
  return (
    <View accessibilityRole="tablist" style={styles.bottomNavigation}>
      {rootNavItems.map((item) => {
        const selected = isNavItemSelected(pathname, item);

        return (
          <Link href={item.href} asChild key={item.label}>
            <Pressable
              accessibilityLabel={item.label}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              style={(pressState) => [
                styles.bottomNavigationItem,
                selected ? styles.bottomNavigationItemSelected : null,
                pressState.pressed ? styles.buttonPressed : null
              ]}
            >
              <Text
                style={[
                  styles.bottomNavigationText,
                  selected ? styles.bottomNavigationTextSelected : null
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          </Link>
        );
      })}
    </View>
  );
}

type PanelProps = PropsWithChildren<Pick<ViewProps,
  "accessibilityHint" | "accessibilityLabel" | "accessibilityLiveRegion" | "accessibilityRole" | "accessibilityState" | "style"
>>;

export function Panel({ children, style, ...accessibilityProps }: PanelProps): ReactElement {
  return <View style={[styles.panel, style]} {...accessibilityProps}>{children}</View>;
}

export function SubPanel({ children, style, ...accessibilityProps }: PanelProps): ReactElement {
  return <View style={[styles.subPanel, style]} {...accessibilityProps}>{children}</View>;
}

export function Row({ children, style }: PropsWithChildren<{ style?: ViewProps["style"] }>): ReactElement {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function SectionTitle({ children, ...textProps }: PropsWithChildren<TextProps>): ReactElement {
  return <Text accessibilityRole="header" style={styles.sectionTitle} {...textProps}>{children}</Text>;
}

export function BodyText({ children, ...textProps }: PropsWithChildren<TextProps>): ReactElement {
  return <Text style={styles.body} {...textProps}>{children}</Text>;
}

export function MutedText({ children, ...textProps }: PropsWithChildren<TextProps>): ReactElement {
  return <Text style={styles.muted} {...textProps}>{children}</Text>;
}

export function Badge({ children, tone = "blue" }: PropsWithChildren<{ tone?: Tone }>): ReactElement {
  const mappedTone = toneColors[tone];

  return (
    <View style={[styles.badge, { backgroundColor: mappedTone.bg, borderColor: mappedTone.border }]}>
      <Text style={[styles.badgeText, { color: mappedTone.fg }]}>{children}</Text>
    </View>
  );
}

interface ButtonShellProps extends PropsWithChildren<Omit<PressableProps, "children" | "style">> {
  tone?: Tone;
  variant?: "primary" | "secondary" | "tertiary";
  size?: "full" | "compact";
  selected?: boolean;
  style?: PressableProps["style"];
}

export function ButtonShell({
  accessibilityRole,
  accessibilityState,
  children,
  disabled = false,
  size = "full",
  selected,
  style,
  tone = "ink",
  variant = "primary",
  ...pressableProps
}: ButtonShellProps): ReactElement {
  const state = mergeAccessibilityState(accessibilityState, {
    disabled: disabled || undefined,
    selected
  });
  const mappedTone = toneColors[tone];
  const isPrimary = variant === "primary";
  const buttonTextColor = isPrimary ? colors.surface : mappedTone.fg;

  return (
    <Pressable
      accessibilityRole={accessibilityRole ?? "button"}
      accessibilityState={state}
      disabled={disabled}
      style={(pressState) => [
        styles.button,
        size === "compact" ? styles.buttonCompact : null,
        variant === "primary" ? { backgroundColor: mappedTone.fg, borderColor: mappedTone.fg } : null,
        variant === "secondary" ? { backgroundColor: mappedTone.bg, borderColor: mappedTone.border } : null,
        variant === "tertiary" ? { backgroundColor: "transparent", borderColor: "transparent" } : null,
        disabled ? styles.buttonDisabled : null,
        pressState.pressed ? styles.buttonPressed : null,
        typeof style === "function" ? style(pressState) : style
      ]}
      {...pressableProps}
    >
      <Text style={[styles.buttonText, { color: buttonTextColor }]}>{children}</Text>
    </Pressable>
  );
}

interface StickyActionBarProps extends PropsWithChildren {
  accessibilityLabel?: string;
}

export function StickyActionBar({ accessibilityLabel, children }: StickyActionBarProps): ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <View accessibilityLabel={accessibilityLabel} style={[styles.stickyActionBar, { paddingBottom: spacing.sm + insets.bottom }]}>
      {children}
    </View>
  );
}

interface ProgressBarProps {
  label: string;
  value: number;
  tone?: "blue" | "teal" | "amber" | "rose" | "green";
}

export function ProgressBar({ label, value, tone = "teal" }: ProgressBarProps): ReactElement {
  const percent = clampPercent(value);
  const mappedTone = toneColors[tone];

  return (
    <View
      accessible
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      accessibilityValue={percentAccessibilityValue(percent)}
      style={styles.progressGroup}
    >
      <View style={styles.progressHeader}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressValue}>{percent}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { backgroundColor: mappedTone.fg, width: `${percent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.background,
    gap: spacing.md,
    minHeight: "100%",
    padding: spacing.md,
    paddingBottom: spacing.xl
  },
  screenFrame: {
    backgroundColor: colors.background,
    flex: 1
  },
  screenScroller: {
    backgroundColor: colors.background,
    flex: 1
  },
  screenFooter: {
    backgroundColor: colors.background,
    borderColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  header: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  headerText: {
    flex: 1,
    gap: spacing.xs
  },
  headerControls: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  backButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    justifyContent: "center",
    minHeight: sizing.minTapTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs
  },
  backButtonText: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 20
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 34
  },
  panel: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  subPanel: {
    backgroundColor: colors.surfaceMuted,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 22
  },
  body: {
    color: colors.text,
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 22
  },
  muted: {
    color: colors.muted,
    fontSize: 14,
    letterSpacing: 0,
    lineHeight: 20
  },
  badge: {
    borderRadius: radius.sm,
    borderWidth: 1,
    flexShrink: 1,
    maxWidth: "100%",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    textTransform: "uppercase"
  },
  button: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    flexGrow: 1,
    flexShrink: 1,
    justifyContent: "center",
    minHeight: sizing.minTapTarget,
    minWidth: 96,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  buttonCompact: {
    flexGrow: 0,
    minHeight: sizing.minTapTarget,
    minWidth: 0,
    paddingHorizontal: spacing.md
  },
  buttonPressed: {
    opacity: 0.82
  },
  buttonDisabled: {
    opacity: 0.52
  },
  buttonText: {
    flexShrink: 1,
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 20,
    textAlign: "center"
  },
  bottomNavigation: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: spacing.xs,
    padding: spacing.xs
  },
  bottomNavigationItem: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: radius.sm,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: sizing.minTapTarget,
    minWidth: 0,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs
  },
  bottomNavigationItemSelected: {
    backgroundColor: colors.inkSoft,
    borderColor: colors.inkMuted
  },
  bottomNavigationText: {
    color: colors.muted,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 16,
    textAlign: "center"
  },
  bottomNavigationTextSelected: {
    color: colors.ink
  },
  stickyActionBar: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm
  },
  progressGroup: {
    gap: spacing.xs
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "space-between"
  },
  progressLabel: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 19
  },
  progressValue: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0,
    lineHeight: 19
  },
  progressTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    height: 10,
    overflow: "hidden"
  },
  progressFill: {
    borderRadius: radius.sm,
    height: "100%"
  }
});
