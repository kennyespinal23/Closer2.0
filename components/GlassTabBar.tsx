import { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Svg, { Path } from "react-native-svg";
import * as haptics from "@/lib/haptics";
import { useColors, useResolvedScheme } from "@/state/theme";

// Flush bottom tab bar (Apple-system style — Notes / Books /
// Reminders). The bar hugs the screen's bottom edge AND its side
// edges with rounded TOP corners only; the safe-area / home-
// indicator zone is baked into the bar's internal padding so
// scrolling content disappears cleanly behind it instead of
// peeking through a "floating gap" under a translucent pill.
//
// Earlier revisions ran an Opal-style floating glass pill with
// 24pt side margins and a 12-34pt bottom gap. The user pulled
// that aesthetic — content scrolling beneath the pill was
// visible in the gap, which read as a bug. The flush bar treats
// the entire bottom strip as bar territory, which is the
// dominant iOS pattern and what every native Apple app uses.
const ROW_PADDING_H = 16;
const CELL_MARGIN_H = 4;
const PILL_TOP_RADIUS = 24;
const PILL_PADDING_TOP = 8;
// CELL_HEIGHT is the bubble's footprint — wraps just the icon
// area at the top of the cell. Labels sit BELOW the bubble so
// the active state reads as "haloed icon + emphasized label"
// rather than a big bordered chip wrapping both.
const CELL_HEIGHT = 38;
const LABEL_GAP = 4;
const LABEL_LINE_HEIGHT = 12;
// Visible portion of the bar above the safe-area inset, sized to
// fit the cell stack exactly: paddingTop + iconWrap + label gap +
// label line. Total: 8 + 38 + 4 + 12 = 62.
const PILL_VISIBLE_HEIGHT =
  PILL_PADDING_TOP + CELL_HEIGHT + LABEL_GAP + LABEL_LINE_HEIGHT;
const BUBBLE_TOP = PILL_PADDING_TOP;
/**
 * Route name marker for the "+" FAB cell. The tabs layout registers
 * a regular Tabs.Screen with this name (see app/(tabs)/_layout.tsx)
 * but the press is intercepted to push the check-in modal instead
 * of switching tabs. Here in the bar we just use the name to swap
 * the cell renderer.
 */
const FAB_ROUTE_NAME = "checkin";
const FAB_SIZE = 48;

/**
 * GlassTabBar
 *
 * A flush bottom tab bar with a glass / blur surface and a SINGLE
 * sliding active bubble that physically springs between cells —
 * not a per-cell background that snaps on and off. Closest visual
 * cousin is Apple Notes / Books / Reminders on iOS 26: edge-to-
 * edge, rounded TOP corners, safe-area baked in. Earlier
 * revisions ran an Opal-style floating pill with side margins
 * and a bottom gap; the user pulled that aesthetic because
 * scrolling content was visible in the gap, which read as a bug.
 *
 * Anatomy:
 *   ┌─╮━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╭─┐
 *   │ ╰     (bubble)                            ╯ │   ← rounded top
 *   │      Home       Library      Profile        │     edges only
 *   │      home       library      profile        │   ← labels
 *   │                                             │   ← safe-area
 *   └─────────────────────────────────────────────┘     inset (baked)
 *               └── bubble springs to active cell
 *
 * IMPORTANT (NativeWind quirk): with `nativewind/babel`'s
 * jsxImportSource, every component is wrapped in CssInterop. When
 * Pressable's `style` is the FUNCTION form `({ pressed }) => ({...})`
 * those styles get silently dropped, collapsing the cell to zero
 * width. Always pass a static style/array to Pressable in this codebase.
 *
 * Per-day accent (optional):
 *   The tabs layout passes `accent` — the current sermon-type
 *   color. We use it for the active icon tint and a faint glow on
 *   the active bubble border. Apple Fitness uses a vibrant red,
 *   Apple TV uses red, Apple Games uses neon orange — all three
 *   pop the active tab with a saturated color against the dark
 *   chrome. Closer earns the same energy from each day's sermon
 *   accent (warm orange for Daily Church, royal violet for Jesus
 *   Only, emerald for Character Studies, etc) so the tab bar
 *   visually belongs to "today" the way the home hero does.
 *   When `accent` is absent the bar falls back to pure ink white
 *   for the active state — the old behavior.
 */
type GlassTabBarProps = BottomTabBarProps & {
  /** Per-day accent color. Tints the active icon + bubble border. */
  accent?: string;
};

export function GlassTabBar({
  state,
  descriptors,
  navigation,
  accent,
}: GlassTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const colors = useColors();
  const scheme = useResolvedScheme();
  const isDark = scheme === "dark";

  // Theme-aware glass treatment. In dark mode we keep the original
  // black blur + faint-white edge highlight. In light mode we flip
  // to a light blur + faint-ink edge so the bar reads as a frosted
  // panel on a bright canvas (instead of looking like a dim grey
  // smear that washes out the inactive labels).
  //
  // Critically, we render a near-opaque themed backing UNDERNEATH
  // the BlurView so colorful scroll content (book covers in the
  // Library, hero images in Insights) can't bleed through and
  // murk up the bar. Without the backing, BlurView averages
  // whatever's beneath it — which on the Library screen turned
  // the bar purple and ate the inactive labels.
  // Glass treatment is now significantly more transparent so the
  // page beneath shows through (Opal's bar appears to float above
  // the content rather than carve a strip out of it). The opaque
  // backing dropped from 0.78 / 0.82 to 0.45 / 0.55, and the
  // pill border is barely visible — just a hairline glass edge.
  const pillBorderColor = isDark
    ? "rgba(255, 255, 255, 0.05)"
    : "rgba(15, 15, 15, 0.06)";
  const backingColor = isDark
    ? "rgba(12, 12, 14, 0.45)"
    : "rgba(255, 255, 255, 0.55)";
  const androidFillColor = isDark
    ? "rgba(20, 20, 20, 0.82)"
    : "rgba(255, 255, 255, 0.88)";
  const bubbleBg = isDark
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(15, 15, 15, 0.06)";
  // Active bubble border picks up the per-day accent at 35% alpha
  // when present — gives the focused cell a faint colored halo that
  // mirrors Apple Fitness/TV/Games' vibrant active tint without
  // turning the whole bubble into a colored slab. Falls back to the
  // neutral white hairline when no accent is supplied (e.g. screens
  // outside the daily-sermon flow).
  const bubbleBorder = accent
    ? hexToRgba(accent, 0.35)
    : isDark
      ? "rgba(255, 255, 255, 0.06)"
      : "rgba(15, 15, 15, 0.08)";
  const fabBorder = isDark
    ? "rgba(255, 255, 255, 0.18)"
    : "rgba(255, 255, 255, 0.65)";

  const pillWidth = screenWidth;
  const cellCount = state.routes.length;
  // Each cell takes an equal share of the row content area; the
  // bubble matches one cell's footprint (cell margins on either side).
  // The FAB cell uses the same horizontal slot so the surrounding
  // tabs stay evenly spaced — the FAB just paints a circular disc
  // inside its slot instead of a label.
  const cellSlot = (pillWidth - ROW_PADDING_H * 2) / cellCount;
  const bubbleWidth = cellSlot - CELL_MARGIN_H * 2;
  const bubbleLeft = ROW_PADDING_H + CELL_MARGIN_H;

  // Animated bubble offset (transform.translateX). Drives the slide
  // between tabs whenever the focused index changes. The FAB cell
  // is never the focused index (its press is preventDefault'd in
  // the tabs layout) so the bubble naturally skips past it.
  const slide = useRef(new Animated.Value(state.index * cellSlot)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: state.index * cellSlot,
      useNativeDriver: true,
      // Tuned to feel like iOS — slightly bouncy but lands quickly.
      tension: 90,
      friction: 13,
    }).start();
  }, [state.index, cellSlot, slide]);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.anchor,
        // Flush bottom: bar hugs the screen's bottom edge so the safe-
        // area / home-indicator zone is part of bar territory and
        // scrolling content can't peek through any "gap" beneath.
      ]}
    >
      <View
        style={[
          styles.pill,
          {
            borderColor: pillBorderColor,
            // Safe-area inset is baked into the bar's bottom padding.
            // Total visible bar height = PILL_VISIBLE_HEIGHT (icons +
            // labels area) + insets.bottom (home indicator zone).
            paddingBottom: insets.bottom,
            height: PILL_VISIBLE_HEIGHT + insets.bottom,
          },
        ]}
      >
        {/* Solid themed backing — rendered FIRST so it sits beneath
            the BlurView. Keeps the bar from picking up colored
            scroll content (book covers, hero images) on screens
            like Library / Profile. Without it the blur averages
            whatever's beneath it and the labels become unreadable. */}
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: backingColor }]}
        />
        {/* BlurView adds the frosted texture on top of the backing.
            iOS only — Android has no reliable real-time blur, so
            we already have the opaque android fill above. */}
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={40}
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: androidFillColor },
            ]}
          />
        )}

        <View style={styles.row}>
          {/* The single animated bubble that slides between active
              tabs. Rendered BEHIND the touch targets (siblings later
              in the row paint on top in z-order). */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.bubble,
              {
                top: BUBBLE_TOP,
                left: bubbleLeft,
                width: bubbleWidth,
                backgroundColor: bubbleBg,
                borderColor: bubbleBorder,
                transform: [{ translateX: slide }],
              },
            ]}
          />

          {state.routes.map((route: (typeof state.routes)[number], index: number) => {
            const { options } = descriptors[route.key]!;
            const isFocused = state.index === index;
            const isFab = route.name === FAB_ROUTE_NAME;

            const label =
              typeof options.tabBarLabel === "string"
                ? options.tabBarLabel
                : (options.title ?? route.name);

            const onPress = () => {
              // Light haptic confirms every tab tap, including the
              // FAB. We fire BEFORE emitting tabPress so the user
              // feels the buzz the instant they tap, not after the
              // bubble starts sliding (haptic latency stacks with
              // animation latency otherwise). Re-tapping the active
              // tab still buzzes — that matches iOS Safari / Maps
              // where a re-tap is a scroll-to-top gesture and
              // should still register tactilely.
              haptics.soft();
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            const onLongPress = () => {
              navigation.emit({ type: "tabLongPress", target: route.key });
            };

            // ─── FAB cell ─────────────────────────────────────
            // Same slot width as the other cells (so spacing stays
            // even) but renders a circular accent disc with a
            // crisp plus glyph instead of icon+label. The disc is
            // slightly larger than CELL_HEIGHT to read as "raised".
            if (isFab) {
              return (
                <Pressable
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityLabel={
                    options.tabBarAccessibilityLabel ?? "Check in"
                  }
                  onPress={onPress}
                  onLongPress={onLongPress}
                  style={styles.cell}
                >
                  <View
                    style={[
                      styles.fab,
                      {
                        backgroundColor: colors.primary,
                        borderColor: fabBorder,
                      },
                    ]}
                  >
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M12 5v14M5 12h14"
                        stroke={colors.primaryFg}
                        strokeWidth={2.6}
                        strokeLinecap="round"
                      />
                    </Svg>
                  </View>
                </Pressable>
              );
            }

            // ─── Normal cell — icon + label ───────────────────
            // Apple-system cell layout: icon on top, label
            // directly below. Both share the active tint when
            // focused — the per-day accent if supplied, otherwise
            // ink white. Inactive cells sit at inkSubtle so the
            // active state has clear contrast against quiet
            // monochrome siblings.
            //
            // Icon size stays constant whether focused or not —
            // the active state communicates via (a) the sliding
            // bubble behind the icon and (b) the accent-tinted
            // icon + label. Growing the icon on focus made the
            // layout shift visibly on every tab change, which
            // read as jittery; constant-size + bubble feels
            // more iOS-native.
            //
            // Icon size bumped 22 → 26 → 30 across two user
            // requests — the smaller glyphs read too quiet
            // against the 62pt bar. 30 fits inside CELL_HEIGHT=38
            // (4pt total breathing) and gives the icons real
            // visual weight, slightly larger than Apple Music /
            // Notes — which is what the user is going for.
            const tint = isFocused
              ? (accent ?? colors.ink)
              : colors.inkSubtle;
            const iconSize = 30;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.cell}
              >
                <View style={styles.iconWrap}>
                  {options.tabBarIcon?.({
                    focused: isFocused,
                    color: tint,
                    size: iconSize,
                  })}
                </View>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    {
                      color: tint,
                      // Active label nudges to SemiBold so the
                      // focused tab reads with a touch more weight
                      // even at 10pt. Inactive stays at Medium —
                      // legible but quiet.
                      fontFamily: isFocused
                        ? "PlusJakartaSans_600SemiBold"
                        : "PlusJakartaSans_500Medium",
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  pill: {
    // Flush bottom bar: rounded TOP corners only (the bottom is
    // hidden against the screen edge). Border radius is on the
    // top corners explicitly — borderRadius shorthand would
    // round the bottom too, which we don't want now that the
    // bar hugs the screen edge.
    borderTopLeftRadius: PILL_TOP_RADIUS,
    borderTopRightRadius: PILL_TOP_RADIUS,
    overflow: "hidden",
    // Hairline glass-edge border (color comes from the theme-aware
    // `pillBorderColor` inline so it flips with the scheme). Now
    // hairline-width to be even more subtle.
    borderWidth: StyleSheet.hairlineWidth,
    // Subtle lift — the bar should feel like it's resting *above*
    // the content, not painted onto it. Shadow gentled now that
    // the bar itself is more transparent — heavy shadow on a
    // glass surface read as inconsistent depth.
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: ROW_PADDING_H,
    paddingTop: PILL_PADDING_TOP,
    height: PILL_VISIBLE_HEIGHT,
  },
  cell: {
    flex: 1,
    marginHorizontal: CELL_MARGIN_H,
    alignItems: "center",
    // Top-aligned: icon sits at the top of the cell so the
    // sliding bubble below has a fixed origin to lock onto,
    // and the label sits BELOW the icon with a small gap.
    justifyContent: "flex-start",
    backgroundColor: "transparent",
  },
  iconWrap: {
    height: CELL_HEIGHT,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    // Tab labels are intentionally tiny — iOS standard is 10pt at
    // San Francisco's metrics; PlusJakartaSans reads close to the
    // same proportion. Tight tracking keeps "Library" from
    // breaking onto two lines on narrow phones. Magic numbers
    // (fontSize / lineHeight / marginTop) match the constants
    // (LABEL_LINE_HEIGHT / LABEL_GAP) above so the pill height
    // math stays consistent.
    fontSize: 10,
    lineHeight: LABEL_LINE_HEIGHT,
    letterSpacing: 0.2,
    marginTop: LABEL_GAP,
    textAlign: "center",
  },
  bubble: {
    position: "absolute",
    height: CELL_HEIGHT,
    borderRadius: CELL_HEIGHT / 2,
    // bg + border come from the theme-aware values inline.
    borderWidth: 1,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    // Faint inner ring + lift shadow so the FAB reads as a raised
    // accent on top of the glass bar, not painted into it. Border
    // color comes from the theme-aware `fabBorder` inline.
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
});

/**
 * Total vertical footprint a screen should reserve at the bottom of
 * its scroll content so nothing hides under the bottom bar.
 *
 * NOTE — value is now sized for the NATIVE React Navigation bottom
 * tab bar (the GlassTabBar component is no longer mounted; the
 * tabs layout dropped its `tabBar={...}` override). Native iOS
 * tab bars are 49pt of content above the bottom safe area inset:
 *   • 49pt — Apple's canonical tab bar visible height (Health,
 *            Fitness, News, Notes all use this)
 *   • ~34pt — bottom safe area on iPhones with the home indicator
 *
 * Worst case (iPhone with home indicator): 49 + 34 = 83pt. Older
 * iPhones with no home indicator over-reserve by ~34pt; that cost
 * is just empty scroll whitespace beneath the bar, not visible
 * chrome, and avoids a hook in every consumer.
 *
 * The GlassTabBar component below is retained in this file ONLY
 * because we may want to revert. If we keep the native bar long-
 * term, delete the component + its sub-helpers and reduce this
 * file to the exported constant.
 */
export const TAB_BAR_TOTAL_HEIGHT = 83;

/**
 * hexToRgba — accepts `#RRGGBB` / `#RGB` / `rgb(…)` / `rgba(…)` and
 * returns a CSS rgba string with the requested alpha. Safe to call
 * with already-rgba inputs (we just replace the alpha channel).
 *
 * Why a local helper rather than the file-scoped one in today.tsx:
 * GlassTabBar lives in components/ and shouldn't reach into a
 * screen file. The sermon-type accents on this project are always
 * `#RRGGBB` hex literals, so the parsing surface is tiny.
 */
function hexToRgba(input: string, alpha: number): string {
  // Already rgba? Swap its alpha and return.
  const rgbaMatch = input.match(/^rgba?\(([^)]+)\)$/);
  if (rgbaMatch) {
    const parts = rgbaMatch[1]!.split(",").map((s) => s.trim());
    const [r, g, b] = parts;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  let hex = input.replace("#", "");
  // Expand `#RGB` shorthand to `#RRGGBB`.
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  if (hex.length !== 6) return `rgba(255, 255, 255, ${alpha})`;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
