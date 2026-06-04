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
import { useColors, useResolvedScheme } from "@/state/theme";

const SIDE_INSET = 24;
const ROW_PADDING_H = 8;
const CELL_MARGIN_H = 2;
// Opal-style minimal floating bar: icon-only cells, slimmer pill,
// muted glass. The bar is now an unobtrusive floating affordance
// rather than a chunky labeled toolbar — the user knows what
// "Today / Practice / Library / Insights" are by now and the icons
// carry recognition on their own.
const PILL_HEIGHT = 56;
const CELL_HEIGHT = 44;
const BUBBLE_TOP = (PILL_HEIGHT - CELL_HEIGHT) / 2;
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
 * A floating, translucent tab bar inspired by Apple News' "Liquid
 * Glass" navigation. Active state is a SINGLE bubble that physically
 * slides between cells on a spring — not a per-cell background that
 * snaps on and off.
 *
 * Anatomy:
 *   ┌───────────────────────────────────────────────┐
 *   │  (bubble) Today    Library    Insights        │  ← BlurView pill
 *   └───────────────────────────────────────────────┘
 *               └── animated, springs to active cell
 *
 * IMPORTANT (NativeWind quirk): with `nativewind/babel`'s
 * jsxImportSource, every component is wrapped in CssInterop. When
 * Pressable's `style` is the FUNCTION form `({ pressed }) => ({...})`
 * those styles get silently dropped, collapsing the cell to zero
 * width. Always pass a static style/array to Pressable in this codebase.
 */
export function GlassTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
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
  const bubbleBorder = isDark
    ? "rgba(255, 255, 255, 0.06)"
    : "rgba(15, 15, 15, 0.08)";
  const fabBorder = isDark
    ? "rgba(255, 255, 255, 0.18)"
    : "rgba(255, 255, 255, 0.65)";

  const pillWidth = screenWidth - SIDE_INSET * 2;
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
        // Hug the safe-area bottom; iPhones with a home indicator get
        // a small breathing gap, older devices fall back to a flat 12.
        { bottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View style={[styles.pill, { borderColor: pillBorderColor }]}>
        {/* Solid themed backing — rendered FIRST so it sits beneath
            the BlurView. Keeps the bar from picking up colored
            scroll content (book covers, hero images) on screens
            like Library / Insights. Without it the blur averages
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

            // ─── Normal cell — icon-only ──────────────────────
            // Labels were removed for Phase 7C's Opal-style pass.
            // Recognition is now carried by the icons alone (sun /
            // page / books / chart). Focused icons go to full ink
            // and a slightly larger size; inactive icons sit at
            // inkSubtle so the active state has clear contrast.
            // The accessibilityLabel still passes through so VoiceOver
            // users get "Today, Tab 1 of 5" — the visual label is
            // gone but the semantic label isn't.
            const tint = isFocused ? colors.ink : colors.inkSubtle;
            const iconSize = isFocused ? 24 : 22;
            // Keep the unused label variable typed so future
            // re-add doesn't require re-plumbing descriptors.
            void label;

            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.cell}
              >
                {options.tabBarIcon?.({
                  focused: isFocused,
                  color: tint,
                  size: iconSize,
                })}
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
    left: SIDE_INSET,
    right: SIDE_INSET,
  },
  pill: {
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
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
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: ROW_PADDING_H,
  },
  cell: {
    flex: 1,
    height: CELL_HEIGHT,
    marginHorizontal: CELL_MARGIN_H,
    alignItems: "center",
    justifyContent: "center",
    // Transparent — selection is communicated by the sliding bubble
    // beneath, not a per-cell background.
    backgroundColor: "transparent",
  },
  bubble: {
    position: "absolute",
    height: CELL_HEIGHT,
    borderRadius: CELL_HEIGHT / 2,
    // bg + border come from the theme-aware values inline.
    borderWidth: 1,
  },
  // (Cell labels removed in Phase 7C — icons carry recognition
  // on their own now, matching Opal's icon-only floating bar.)
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
 * its scroll content so nothing hides under the floating glass bar.
 *
 * Pill (56) + outer margin (12) + a small visual gap (16) = 84.
 */
export const TAB_BAR_TOTAL_HEIGHT = 84;
