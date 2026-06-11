import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";

/**
 * HeroOnboardingPage — the Hallow-style "strong visual page"
 * vocabulary used across the narrative beats of onboarding.
 *
 * Anatomy (top to bottom):
 *
 *   ┌────────────────────────────────┐
 *   │  ←                             │  ← OnboardingChrome (tone=dark)
 *   │                                │
 *   │            ╭──╮                │  ← Subject — circular framed
 *   │            │  │                │     visual (number, scripture,
 *   │            ╰──╯                │     brand mark, etc.)
 *   │                                │
 *   │  "dim setup bright punchline." │  ← Quote (mixed-color paragraph)
 *   │  small attribution line         │  ← Attribution
 *   │                                │
 *   │  ┌──────────────────────────┐  │  ← White rounded pill CTA
 *   │  │        Continue          │  │
 *   │  └──────────────────────────┘  │
 *   └────────────────────────────────┘
 *
 * The page is forced to a saturated PAGE_BG (overrides theme). A
 * lighter SKY radial paints the upper third for atmosphere. The
 * status bar is forced to light icons.
 *
 * Why a single shared component:
 *
 *   • Every Hallow-style screen ships with the same chrome,
 *     atmosphere, layout, and CTA — they ONLY differ in color,
 *     circle content, and copy. Without this component each
 *     screen reproduces ~120 lines of layout boilerplate, and a
 *     tweak to (say) the CTA spacing has to be made N times.
 *
 *   • Color discipline. Forcing every Hallow screen through the
 *     same shell makes it impossible for one to silently drift
 *     out of vocabulary — wrong padding, wrong chrome tone,
 *     wrong CTA shape. The visual coherence is structural.
 *
 *   • Future pages drop in with one block of JSX, picking a
 *     palette and a circle content.
 *
 * The CIRCLE content is the variable part (a giant number for
 * the stat reveal, two stacked app icons for the pattern
 * diagnosis, a scripture excerpt for the welcome, etc.) so it's
 * passed in as the `subject` slot. A companion `HeroDisc` helper
 * renders the standard halo + framed disc so most subjects can
 * be expressed as just `<HeroDisc haloColor={...}>{content}</HeroDisc>`.
 */
export type HeroOnboardingPageProps = {
  /** Deep saturated background — sampled per-screen to feel like
   *  a different "room" while staying in the Hallow vocabulary. */
  pageBg: string;
  /** Lighter version of pageBg, used for the ambient sky radial
   *  at the top of the page and (typically) for the disc halo. */
  ambientGlow: string;
  /** Whether to render the back chevron (tone=dark). Defaults to
   *  true; pass false for terminal beats (welcome / calculating)
   *  where backward navigation is intentionally blocked. */
  showBack?: boolean;
  /** The circular framed subject. Usually a <HeroDisc>...</HeroDisc>. */
  subject: ReactNode;
  /** Dim half of the quote-style paragraph (the setup). */
  quoteSetup: string;
  /** Bright half of the quote-style paragraph (the punchline). */
  quoteEmphasis: string;
  /** Optional small attribution-style line under the quote. */
  attribution?: string;
  /** CTA pill label. */
  ctaLabel: string;
  /** CTA pill tap handler. */
  onContinue: () => void;
  /** Color of the CTA pill text. Defaults to a near-black that
   *  reads cleanly on the white pill regardless of page hue. */
  ctaTextColor?: string;
  /** Optional eyebrow (small caps line above the subject). */
  eyebrow?: string;
};

export function HeroOnboardingPage({
  pageBg,
  ambientGlow,
  showBack = true,
  subject,
  quoteSetup,
  quoteEmphasis,
  attribution,
  ctaLabel,
  onContinue,
  ctaTextColor = "#0F1226",
  eyebrow,
}: HeroOnboardingPageProps) {
  return (
    <View style={{ flex: 1, backgroundColor: pageBg }}>
      <StatusBar style="light" />

      {/* Ambient sky radial — soft, top-anchored, falls off
          before the quote block. Same shape on every Hallow
          page so the atmosphere reads as a system, not a
          per-page artifact. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 520,
        }}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="hero-sky"
              cx="50%"
              cy="20%"
              rx="95%"
              ry="70%"
              fx="50%"
              fy="20%"
            >
              <Stop offset="0" stopColor={ambientGlow} stopOpacity={0.55} />
              <Stop offset="0.45" stopColor={ambientGlow} stopOpacity={0.18} />
              <Stop offset="0.85" stopColor={ambientGlow} stopOpacity={0.02} />
              <Stop offset="1" stopColor={ambientGlow} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#hero-sky)" />
        </Svg>
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {showBack ? (
          <OnboardingChrome mode="back-only" tone="dark" />
        ) : (
          // Reserve the same vertical space so subject placement
          // matches across screens regardless of whether the
          // chrome is rendered. Without this, subject-less
          // screens jump up by ~64px.
          <View style={{ height: 64 }} />
        )}

        <View style={{ flex: 1, paddingHorizontal: 28 }}>
          {/* Upper half — subject lives optically centered above
              the quote block. flex:1 on both halves keeps the
              composition balanced across phone heights. */}
          <View
            style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
          >
            {eyebrow ? (
              <FadeIn delayMs={100} durationMs={800}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontFamily: "PlusJakartaSans_700Bold",
                    fontSize: 11,
                    letterSpacing: 2.8,
                    textTransform: "uppercase",
                    marginBottom: 22,
                    textAlign: "center",
                  }}
                >
                  {eyebrow}
                </Text>
              </FadeIn>
            ) : null}
            <FadeIn delayMs={200} durationMs={1100}>
              {subject}
            </FadeIn>
          </View>

          {/* Lower half — quote + attribution. Left-aligned so
              the eye can read it as a quote rather than a label.
              Mirrors the Hallow reference exactly. */}
          <View style={{ flex: 1, justifyContent: "flex-start" }}>
            <FadeIn delayMs={1100} durationMs={1100}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 23,
                  lineHeight: 32,
                  letterSpacing: -0.4,
                  textAlign: "left",
                }}
              >
                <Text style={{ color: "rgba(255,255,255,0.55)" }}>
                  &ldquo;{quoteSetup}{" "}
                </Text>
                <Text style={{ color: "#FFFFFF" }}>
                  {quoteEmphasis}&rdquo;
                </Text>
              </Text>
            </FadeIn>

            {attribution ? (
              <FadeIn delayMs={1900} durationMs={900}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontFamily: "PlusJakartaSans_500Medium",
                    fontSize: 14,
                    marginTop: 18,
                  }}
                >
                  {attribution}
                </Text>
              </FadeIn>
            ) : null}
          </View>

          {/* CTA pill — white, full-width, rounded. Same shape
              and treatment on every Hallow page so taps land in
              the same spot the user has muscle memory for. */}
          <FadeIn delayMs={2600} durationMs={800}>
            <Pressable
              onPress={onContinue}
              accessibilityRole="button"
              accessibilityLabel={ctaLabel}
              style={({ pressed }) => ({
                height: 58,
                borderRadius: 999,
                backgroundColor: "#FFFFFF",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 8,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text
                style={{
                  color: ctaTextColor,
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 17,
                  letterSpacing: -0.1,
                }}
              >
                {ctaLabel}
              </Text>
            </Pressable>
          </FadeIn>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// HeroDisc — the standard circular framed subject.
// ─────────────────────────────────────────────────────────────────

export type HeroDiscProps = {
  /** Color of the soft halo behind the disc. Pass the page's
   *  `ambientGlow` for the standard "lit from above" feel. */
  haloColor: string;
  /** Disc diameter in pt. Default 196 — comfortable for a single
   *  big number / icon. Bump to ~216 for stacked content. */
  size?: number;
  /** Content rendered inside the disc (number, icon, scripture
   *  excerpt, etc.). */
  children: ReactNode;
  /** Whether the disc breathes (slow scale loop + halo opacity
   *  oscillation). Default true. */
  breathe?: boolean;
  /** Extra paddingVertical inside the disc. Default 0. Useful
   *  when the children are stacked elements (e.g. two icons +
   *  a divider). */
  innerPaddingVertical?: number;
};

export function HeroDisc({
  haloColor,
  size = 196,
  children,
  breathe = true,
  innerPaddingVertical = 0,
}: HeroDiscProps) {
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!breathe) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath, breathe]);

  const discScale = breathe
    ? breath.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.015],
      })
    : 1;
  const haloOpacity = breathe
    ? breath.interpolate({
        inputRange: [0, 1],
        outputRange: [0.55, 0.85],
      })
    : 0.7;

  // Halo extends ~42% beyond the disc. Slight pad so the halo
  // visible portion (after the 0.7 scale) lands ≈ 1.4× the disc.
  const haloSize = Math.round(size * 1.42);

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <Animated.View
        style={{
          position: "absolute",
          width: haloSize,
          height: haloSize,
          borderRadius: haloSize / 2,
          backgroundColor: haloColor,
          opacity: haloOpacity,
          transform: [{ scale: 0.7 }],
        }}
      />
      <Animated.View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: "rgba(255,255,255,0.08)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.22)",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: innerPaddingVertical,
          transform: [{ scale: discScale }],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}
