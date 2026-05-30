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
import { colors } from "@/constants/theme";

const SIDE_INSET = 16;
const ROW_PADDING_H = 6;
const CELL_MARGIN_H = 2;
const PILL_HEIGHT = 62;
const CELL_HEIGHT = 50;
const BUBBLE_TOP = (PILL_HEIGHT - CELL_HEIGHT) / 2;
/**
 * Route name marker for the "+" FAB cell. The tabs layout registers
 * a regular Tabs.Screen with this name (see app/(tabs)/_layout.tsx)
 * but the press is intercepted to push the check-in modal instead
 * of switching tabs. Here in the bar we just use the name to swap
 * the cell renderer.
 */
const FAB_ROUTE_NAME = "checkin";
const FAB_SIZE = 52;

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
      <View style={styles.pill}>
        {/* BlurView paints the translucent background only. Layout
            lives in the inner row so it's unambiguous to RN's flexbox. */}
        {Platform.OS === "ios" ? (
          <BlurView
            intensity={70}
            tint="dark"
            style={StyleSheet.absoluteFill}
          />
        ) : (
          // Android has no reliable real-time blur — fall back to a
          // near-opaque dark fill that still feels distinct from bg.
          <View style={[StyleSheet.absoluteFill, styles.androidFill]} />
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
                transform: [{ translateX: slide }],
              },
            ]}
          />

          {state.routes.map((route, index) => {
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
                  <View style={styles.fab}>
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
            const tint = isFocused ? colors.ink : colors.inkSubtle;

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
                  size: 22,
                })}
                <Text
                  style={[
                    styles.label,
                    {
                      color: tint,
                      fontFamily: isFocused
                        ? "PlusJakartaSans_700Bold"
                        : "PlusJakartaSans_600SemiBold",
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
    left: SIDE_INSET,
    right: SIDE_INSET,
  },
  pill: {
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    overflow: "hidden",
    // Hairline white border at very low opacity reads as a glass edge
    // highlight without becoming chrome.
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    // Subtle lift — the bar should feel like it's resting *above*
    // the content, not painted onto it.
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  androidFill: {
    backgroundColor: "rgba(20, 20, 20, 0.94)",
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
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    // Faint highlight ring around the bubble — sells the "glass" feel.
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
  },
  label: {
    fontSize: 10.5,
    letterSpacing: 0.3,
    marginTop: 3,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    // Faint inner ring + lift shadow so the FAB reads as a raised
    // accent on top of the glass bar, not painted into it.
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
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
 * Pill (62) + outer margin (12) + a small visual gap (16) = 90.
 */
export const TAB_BAR_TOTAL_HEIGHT = 90;
