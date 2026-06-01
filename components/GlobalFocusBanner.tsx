import { useCallback, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import {
  isShieldSupported,
  summarizeBlockedApps,
} from "@/lib/focus";
import { useFocus } from "@/state/focus";
import { useColors } from "@/state/theme";

/**
 * Global floating focus banner.
 *
 * Mounted at the tabs-layout level so it floats above the active
 * tab's content whenever a focus session is in progress. This is
 * the "you can never forget the session is on" reminder — backing
 * out of the sermon mid-flow lands you on a tab, and the session
 * stays committed (until you reach /sermon/complete or hit End).
 *
 * Where this lives in the system:
 *
 *   1. /sermon/* screens use the INLINE <FocusBanner /> (same
 *      visual language, but positioned in-flow just under the
 *      sermon header so it's clearly part of the sermon chrome).
 *   2. /today uses the inline <FocusToggle /> in the scroll
 *      content — that's a full controller (Switch + drill-down),
 *      so we hide this global banner on Today specifically to
 *      avoid two "Focus mode active" indicators stacked.
 *   3. /journey, /library, /insights show THIS floating banner.
 *      No inline equivalent there, and the session needs visible
 *      ownership of the screen while it's live.
 *
 * Behavior:
 *   • Renders nothing when no session is active — safe to mount
 *     unconditionally
 *   • Tap body  → router.push("/settings/focus") so the user can
 *     manage the app list or end the session from inside the
 *     dedicated screen
 *   • Tap End   → Alert.alert confirm before tearing down (matches
 *     the in-sermon banner pattern — the commitment shouldn't be
 *     a one-tap dismiss)
 *
 * Positioning:
 *   • Absolute, floats over the active tab's content
 *   • Anchored to the top safe-area inset + a small breath gap
 *   • Drop shadow on iOS / elevation on Android so it reads as
 *     "above the canvas" rather than "stuck to the wall"
 *   • `pointerEvents="box-none"` on the wrapper so taps that miss
 *     the banner's actual pill still reach the screen below
 */

/** Same iOS-system-blue used by FocusBanner + FocusToggle + the
 *  reading-goal ring. Re-declared (not imported) so this file
 *  stays a standalone unit you can lift into a different layout
 *  without dragging in another module's constants. */
const FOCUS_ACCENT = "#0A84FF";

export function GlobalFocusBanner() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { session, endSession } = useFocus();
  const [ending, setEnding] = useState(false);

  const handleEnd = useCallback(() => {
    if (ending) return;
    Alert.alert(
      "End focus session?",
      isShieldSupported()
        ? "Apps will be unblocked right away. You can start another session anytime."
        : "Your focus commitment will end. You can start another one anytime.",
      [
        { text: "Keep focusing", style: "cancel" },
        {
          text: "End session",
          style: "destructive",
          onPress: async () => {
            setEnding(true);
            try {
              await endSession();
            } finally {
              setEnding(false);
            }
          },
        },
      ],
    );
  }, [ending, endSession]);

  const handleOpen = useCallback(() => {
    router.push("/settings/focus");
  }, [router]);

  // Conditional render AFTER all hooks above — keeps hook order
  // stable across renders regardless of session state.
  if (!session) return null;

  const subtitle = summarizeBlockedApps(session.blockedAppIds);

  return (
    // box-none lets taps NOT on the banner fall through to the
    // tab content beneath — the wrapper is purely a positioning
    // layer, not a touch interceptor.
    <View
      pointerEvents="box-none"
      style={{
        position: "absolute",
        top: insets.top + 6,
        left: 0,
        right: 0,
        alignItems: "stretch",
        // High z-index so we sit cleanly above whatever the active
        // tab is rendering. The tab bar itself has its own
        // higher z-index (it lives below the screen surface in
        // RN's Tabs view tree), so the banner never collides
        // with it visually.
        zIndex: 50,
      }}
    >
      <Pressable
        onPress={handleOpen}
        accessibilityRole="button"
        accessibilityLabel="Focus mode active. Tap to open settings."
        className="mx-4 rounded-2xl flex-row items-center px-3.5 py-2.5"
        style={({ pressed }) => ({
          backgroundColor: withAlpha(FOCUS_ACCENT, 0.96),
          opacity: pressed ? 0.95 : 1,
          // Drop shadow — keeps the floating banner visually lifted
          // off whatever surface is behind it (works for both
          // dark and light themes since it's a pure black blur).
          shadowColor: "#000",
          shadowOpacity: 0.18,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        })}
      >
        {/* Live dot on a slightly lighter wash so it reads as
            "filament inside the lamp" rather than a flat label
            color matching the background. */}
        <View
          className="w-2 h-2 rounded-full mr-3"
          style={{ backgroundColor: "#FFFFFF" }}
        />

        <View className="flex-1 pr-2">
          <Text
            className="text-[11.5px] tracking-[1.6px] uppercase"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: "#FFFFFF",
            }}
          >
            Focus mode active
          </Text>
          <Text
            className="text-[11.5px] mt-0.5"
            style={{
              fontFamily: "PlusJakartaSans_500Medium",
              // A softened white for the secondary line so the
              // hierarchy still reads (eyebrow > sublabel) on the
              // solid-color background.
              color: "rgba(255,255,255,0.82)",
            }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>

        {/* End pill — sits inside the banner instead of being a
            sibling so the Pressable on the body still feels like
            a contained card. We stop event propagation manually
            in the onPress so the body's handler doesn't ALSO
            fire on End taps. */}
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            handleEnd();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="End focus session"
          className="rounded-full px-3 py-1.5"
          style={({ pressed }) => ({
            backgroundColor: "rgba(255,255,255,0.18)",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            className="text-[11.5px] tracking-[0.5px]"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: "#FFFFFF",
            }}
          >
            End
          </Text>
        </Pressable>

        {/* Trailing micro-chevron hinting "tap me for more". Sits
            after the End pill so the visual reading order is
            still: status → action → drill-down hint. The
            chevron stays subtle (45% alpha) since it's a hint,
            not an affordance to compete with End. */}
        <View className="ml-2">
          <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
            <Path
              d="M9 6l6 6-6 6"
              stroke="rgba(255,255,255,0.45)"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </Pressable>
    </View>
  );
}

/**
 * Compose an alpha into a `#RRGGBB` hex string, returning a CSS
 * `rgba(r, g, b, a)` string usable by RN's color props. Same helper
 * as the other focus components — could be lifted into a shared
 * lib/color.ts once a fourth copy appears.
 */
function withAlpha(hex: string, alpha: number): string {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6) return hex;
  const r = parseInt(cleaned.slice(0, 2), 16);
  const g = parseInt(cleaned.slice(2, 4), 16);
  const b = parseInt(cleaned.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Re-exported via this module because it's the natural home for
 * a "should this banner show right now?" predicate. Used by the
 * tabs layout to avoid stacking the global banner on top of the
 * Today screen's inline FocusToggle.
 *
 * Kept as a pure function so the tabs layout doesn't need to
 * subscribe to the focus context just to make a layout decision.
 */
export function isGlobalBannerHiddenForRoute(routeSegment?: string): boolean {
  // Today already shows the inline FocusToggle pill which has a
  // visually richer "active" state (chip color flips, eyebrow
  // tints, End button replaces the Switch). Adding the floating
  // banner on top would be redundant noise. Every other tab gets
  // the floating banner since none of them surface focus state.
  return routeSegment === "today";
}
