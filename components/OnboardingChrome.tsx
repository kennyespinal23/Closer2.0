import { Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { useColors } from "@/state/theme";

/**
 * Unified top-chrome for the onboarding flow.
 *
 * The new onboarding has two distinct chrome modes:
 *
 *   • `"back-only"` (Screens 2–10, pre-brand)
 *     A single back chevron in the top-left. No progress bar — a
 *     progress bar across the top would advertise "you're in an
 *     onboarding flow," which leaks the brand before the reveal.
 *     The chevron itself is monochrome and lives quietly so the
 *     hero copy below carries the screen.
 *
 *   • `"with-progress"` (Screens 11–17, post-brand)
 *     Back chevron + thin progress bar. This is the existing
 *     OnboardingHeader treatment — the brand has been revealed,
 *     the user knows what they're doing, and a sense of "this
 *     ends soon" becomes a help instead of a tell.
 *
 * Screen 1 doesn't render any chrome at all (no back button — it's
 * the entry point of the audit, you commit forward), so it doesn't
 * use this component.
 *
 * Optional `tone` controls whether the chevron is rendered against
 * a dark or light backdrop. Black-canvas screens (e.g. the
 * personalized punch on Screen 6) need a white chevron regardless
 * of the user's theme.
 */
type OnboardingChromeProps = {
  mode: "back-only" | "with-progress";
  /** 0..1 progress — only honored when mode is "with-progress". */
  progress?: number;
  /**
   * "auto" (default) reads colors from the active theme. "dark"
   * forces a white chevron on a transparent backdrop — for use on
   * the forced-black narrative screens (stat, calculating, punch,
   * paywall, welcome). "light" is the inverse — for the warm-white
   * proof screen.
   */
  tone?: "auto" | "dark" | "light";
  /**
   * Override the default `router.back()`. Used by multi-step
   * screens (e.g. howitworks) that need to step back inside the
   * screen before leaving the route.
   */
  onBack?: () => void;
};

export function OnboardingChrome({
  mode,
  progress = 0,
  tone = "auto",
  onBack,
}: OnboardingChromeProps) {
  const router = useRouter();
  const colors = useColors();

  const chevronColor =
    tone === "dark"
      ? "#FFFFFF"
      : tone === "light"
        ? "#0F0F0F"
        : colors.ink;
  const trackColor =
    tone === "dark"
      ? "rgba(255,255,255,0.15)"
      : tone === "light"
        ? "rgba(15,15,15,0.12)"
        : colors.border;
  const fillColor =
    tone === "dark"
      ? "#FFFFFF"
      : tone === "light"
        ? "#0F0F0F"
        : colors.primary;

  const clamped = Math.max(0, Math.min(1, progress));
  const handleBack = onBack ?? (() => router.back());

  return (
    <View className="px-6 pt-2 pb-3">
      <View className="flex-row items-center">
        <Pressable
          hitSlop={14}
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => ({
            width: 40,
            height: 40,
            borderRadius: 20,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.6 : 1,
          })}
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18l-6-6 6-6"
              stroke={chevronColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        {mode === "with-progress" ? (
          <View
            style={{
              flex: 1,
              marginLeft: 12,
              height: 3,
              backgroundColor: trackColor,
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${clamped * 100}%`,
                backgroundColor: fillColor,
                borderRadius: 999,
              }}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
