import { useCallback, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  isShieldSupported,
  summarizeBlockedApps,
} from "@/lib/focus";
import { useFocus } from "@/state/focus";
import { useColors } from "@/state/theme";

/**
 * Focus session banner — the slim pill that sits at the top of
 * sermon screens whenever a focus session is active.
 *
 * Renders nothing when no session is running, so call sites can
 * mount it unconditionally and let the component decide whether to
 * show itself. Keeps the call site (`<FocusBanner />` at the top
 * of each sermon screen) clean.
 *
 * Visual rhythm:
 *   • Slim horizontal pill, full-width with safe horizontal padding
 *   • Leading dot in the focus accent (iOS blue) to signal "live"
 *   • Caption: "Focus mode active" + summarized app list below
 *   • Trailing "End" pressable that confirms before tearing down
 *     the session (Phase 2 will physically drop the shield;
 *     Phase 1 just clears the flag)
 *
 * Why the confirm before End?
 *   The session is a commitment. Letting the user dismiss it with
 *   one tap defeats the purpose — even in honor mode, the friction
 *   of a confirm is what gives the commitment weight. The confirm
 *   uses the native Alert because that's the most "this matters"
 *   pattern available without bringing in a custom modal.
 */

/**
 * The accent used for the focus banner — same iOS system blue as the
 * reading-goal ring and the prayer panel. The shared color anchors
 * all three "drawing near" moments to the same chromatic language.
 */
const FOCUS_ACCENT = "#0A84FF";

export function FocusBanner() {
  const colors = useColors();
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

  // No session → render nothing. This is the "unconditional mount,
  // conditional render" pattern that keeps call sites tidy.
  if (!session) return null;

  const subtitle = summarizeBlockedApps(session.blockedAppIds);

  return (
    <View className="px-4 pt-2">
      <View
        className="rounded-2xl px-3.5 py-2.5 flex-row items-center"
        style={{
          // Soft tinted wash. The 14% opacity reads as "lit" but not
          // alarmist against either the dark canvas or the light
          // surface — matches the calm "you're in a session" tone.
          backgroundColor: withAlpha(FOCUS_ACCENT, 0.14),
          borderWidth: 1,
          borderColor: withAlpha(FOCUS_ACCENT, 0.28),
        }}
      >
        {/* Pulsing-style "live" dot. Pulsing animation skipped on
            purpose — every other animation on this screen was
            removed for the reading-rhythm pass, so a single
            animated dot would feel jarring. */}
        <View
          className="w-2 h-2 rounded-full mr-3"
          style={{ backgroundColor: FOCUS_ACCENT }}
        />

        <View className="flex-1 pr-2">
          <Text
            className="text-[12px] tracking-[1.6px] uppercase"
            style={{
              fontFamily: "System",
              fontWeight: "700",
              color: FOCUS_ACCENT,
            }}
          >
            Focus mode active
          </Text>
          <Text
            className="text-ink-muted text-[11.5px] mt-0.5"
            style={{ fontFamily: "System", fontWeight: "500" }}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>

        <Pressable
          onPress={handleEnd}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="End focus session"
          className="rounded-full px-3 py-1.5"
          style={({ pressed }) => ({
            backgroundColor: withAlpha(colors.ink, 0.08),
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            className="text-[11.5px] tracking-[0.5px]"
            style={{
              fontFamily: "System",
              fontWeight: "700",
              color: colors.ink,
            }}
          >
            End
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Optional small chevron glyph — exported for future use (e.g. a
 * "settings" affordance on the banner) so a downstream change
 * doesn't need to reach back into this file for chrome.
 */
export function FocusBannerChevron({ stroke }: { stroke: string }) {
  return (
    <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={stroke}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Compose an alpha into a `#RRGGBB` hex string, returning a CSS
 * `rgba(r, g, b, a)` string usable by RN's color props. Duplicated
 * across a few helpers in the codebase; would be a fine candidate
 * to centralize in a `lib/color.ts` if a third copy appears.
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
