import { View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

/**
 * OnboardingAtmosphere — a quiet, iOS-blue ambient wash that
 * sits at the top of every onboarding screen.
 *
 * Why this exists:
 *
 *   • Without it, onboarding was a sequence of black screens
 *     with white text. The screens read as "form" rather than
 *     "premium product." Adding a low-alpha radial atmosphere at
 *     the top of the canvas lifts the page into a "lit space" —
 *     same idiom we use for sermon-type ambient glow on the home
 *     screen, but neutralized to the system blue so it doesn't
 *     compete with any per-screen accents.
 *
 *   • The blue tone is chosen on purpose: it's the same iOS
 *     selection accent we use for chips and OptionCards. Pulling
 *     the same hue into the atmosphere ties the whole onboarding
 *     flow to a single color identity — selections and ambient
 *     glow rhyme, instead of the chips feeling like a separate
 *     visual language from the rest of the screen.
 *
 *   • Sits behind all content via absolute positioning, full-
 *     width, top-anchored. Doesn't intercept touches.
 *
 * Per-screen overrides:
 *
 *   • Screens that have their own thematic atmosphere (e.g. the
 *     proof screen's amber morning-light wash) opt out by setting
 *     `transparent` — see how proof.tsx renders its own amber
 *     gradient instead.
 *
 *   • Screens with their own forced black background (the
 *     narrative beats — stat / calculating / punch / paywall)
 *     also opt out, because the punch is supposed to feel COLD
 *     and the ambient lift would soften it.
 */

const ACCENT = "#0A84FF"; // iOS systemBlue (dark)

export type OnboardingAtmosphereProps = {
  /** Pixel height of the gradient band. Defaults to 420. */
  height?: number;
  /** Override the accent color if a screen wants a different tone. */
  accent?: string;
};

export function OnboardingAtmosphere({
  height = 420,
  accent = ACCENT,
}: OnboardingAtmosphereProps) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height,
      }}
    >
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient
            id="onboarding-atmosphere"
            cx="50%"
            cy="22%"
            rx="95%"
            ry="65%"
            fx="50%"
            fy="22%"
          >
            <Stop offset="0" stopColor={accent} stopOpacity={0.16} />
            <Stop offset="0.4" stopColor={accent} stopOpacity={0.06} />
            <Stop offset="0.8" stopColor={accent} stopOpacity={0.015} />
            <Stop offset="1" stopColor={accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width="100%"
          height="100%"
          fill="url(#onboarding-atmosphere)"
        />
      </Svg>
    </View>
  );
}
