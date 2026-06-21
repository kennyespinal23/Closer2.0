import { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { SermonBlurredBackdrop } from "@/components/SermonBlurredBackdrop";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import * as haptics from "@/lib/haptics";
import { useOnboarding } from "@/state/onboarding";
import { useColors } from "@/state/theme";

/**
 * Pray-together interstitial.
 *
 * Sits between the Landing panel (`/sermon/panel/4`) and the
 * Prayer panel (`/sermon/panel/5`) as a reverent pause beat:
 *
 *   panel/4 (Landing) → pray-together → panel/5 (Prayer)
 *
 * The screen surfaces the reader by name and invites them
 * into the closing prayer rather than dropping them straight
 * into the prayer body. Two lines, slow fade-in, no Continue
 * button — the screen auto-advances into the prayer ~6.6s
 * after mount with a single subtle breath cycle in between.
 *
 * Why auto-advance instead of a button?
 *   A tap-to-continue here would feel like a checkpoint to
 *   clear, which is the opposite tone we want for a moment
 *   that's asking the reader to slow down and arrive. Auto-
 *   advance lets the screen do its own breathing and hands
 *   the prayer panel to a reader who's already settled.
 *
 *   A close X stays available top-left as the escape hatch.
 *   Same minimal style as the prayer panel's close so the
 *   two screens read as one continuous beat.
 *
 * Why `router.replace` into the prayer?
 *   Once the reader is in the prayer body, a swipe-back
 *   should take them to the Landing panel they were just
 *   reading — NOT back to the pray-together prompt. Replace
 *   pops pray-together off the stack as the prayer slides
 *   in, keeping the back-stack clean for the rest of the
 *   sermon flow.
 *
 * Name fallback:
 *   `firstName` defaults to `"friend"` when no onboarding
 *   name is on file. We mirror the today.tsx convention and
 *   treat that case as nameless — drop the personal address
 *   entirely (`"Let's pray together"` with no comma).
 */
export default function PrayTogetherScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { answers } = useOnboarding();
  // Theme-aware palette: in dark mode the screen renders as
  // the original reverent black-on-white-text composition;
  // in light mode it inverts to a warm-cream canvas with
  // dark ink, so the screen sits of-a-piece with the rest of
  // the prayer flow (sermon panel reader / streak / etc all
  // resolve to `colors.bg`).
  const colors = useColors();

  // First-word slice of the onboarding name. Mirrors the
  // home screen's derivation exactly so the two surfaces
  // address the reader identically.
  const firstName = useMemo(
    () => (answers.name || "").trim().split(" ")[0] || "friend",
    [answers.name],
  );
  const hasRealName = firstName !== "friend" && firstName.length > 0;

  // ─── Mount choreography ───────────────────────────────────
  //
  // Three beats, deliberately slow — the screen is a breathing
  // beat, not a transition flash:
  //
  //   1. Name line fades + lifts in over 2000ms (600ms delay)
  //   2. "Let's pray together." fades in 1500ms after the name
  //      starts (so the two lines settle in sequence, not
  //      together — the reader feels the address first, then
  //      the invitation)
  //   3. Hold for ~2900ms once both lines are visible
  //   4. router.replace into the prayer panel — passes a
  //      `fade=1` sentinel param so the destination's layout
  //      config swaps the slide-from-right transition for a
  //      gentle cross-fade (the layout reads route.params at
  //      `options` time to pick the animation).
  //
  // Total dwell time before navigation: ~7000ms. The previous
  // revision wrapped the two lines in a continuous 1.0 → 1.025
  // → 1.0 "breath" scale that played in the back half of the
  // dwell; the zoom read as decorative on a beat that's meant
  // to ask the reader to slow down, so it's been removed. The
  // pace is now carried entirely by typography settling into
  // place — pure fade, no transform.
  const nameAnim = useRef(new Animated.Value(0)).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;

  // Guard against double-navigation if the user taps the
  // close X while the auto-advance timer is firing. Both
  // paths cancel the other.
  const navigated = useRef(false);

  useEffect(() => {
    const enter = Animated.parallel([
      Animated.timing(nameAnim, {
        toValue: 1,
        duration: 2000,
        delay: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(subtitleAnim, {
        toValue: 1,
        duration: 2000,
        delay: 2100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);

    enter.start();

    const advanceTimer = setTimeout(() => {
      if (navigated.current) return;
      navigated.current = true;
      // `fade=1` flips the prayer panel's enter animation
      // from the default slide-from-right to a cross-fade —
      // see app/sermon/_layout.tsx where the panel route
      // reads this param. Narrative panels (1-4) reach the
      // panel route without the param so they keep their
      // forward-motion slide.
      router.replace("/sermon/panel/5?fade=1");
    }, 7000);

    return () => {
      clearTimeout(advanceTimer);
      enter.stop();
    };
  }, [router, nameAnim, subtitleAnim]);

  const nameTranslateY = nameAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });
  const subtitleTranslateY = subtitleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  const handleClose = () => {
    if (navigated.current) return;
    navigated.current = true;
    haptics.soft();
    router.back();
  };

  return (
    <View style={{ flex: 1 }}>
      <SermonBlurredBackdrop />
      {/* ─── Minimal close X ───────────────────────────────
          Same glass disc as the prayer panel's close header
          so the two screens read as one continuous beat.
          Anchored to the top edge with safe-area padding;
          the escape hatch is always available even though
          there's no Continue chrome below. */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 4,
          left: 16,
          zIndex: 10,
        }}
      >
        <Pressable
          onPress={handleClose}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              // Theme-aware "glass disc" — uses the existing
              // `surface` token (semi-translucent ink on dark,
              // translucent dark-on-cream on light) so the
              // close affordance reads as the same shape in
              // both palettes without needing a custom
              // light-mode treatment.
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M6 6l12 12M6 18L18 6"
                stroke={colors.ink}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </View>
        </Pressable>
      </View>

      {/* ─── Two-line invitation ───────────────────────────
          Centered vertically on the canvas. Wide horizontal
          padding (40 vs the app's usual 24) keeps the lines
          visually quiet — even a long name doesn't crowd.
          The previous revision wrapped the two lines in a
          slow scale breath; design feedback flagged the zoom
          as inappropriate for a beat asking the reader to
          slow down, so the wrapping group is now a plain
          View — the typography settles in via the per-line
          fades and stays still. */}
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 40,
        }}
      >
        {hasRealName ? (
          <Animated.Text
            style={{
              opacity: nameAnim,
              transform: [{ translateY: nameTranslateY }],
              // Theme-aware primary ink — full white on dark,
              // near-black on the warm-cream light canvas.
              color: colors.ink,
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 32,
              lineHeight: 40,
              letterSpacing: -0.6,
              textAlign: "center",
              marginBottom: 10,
            }}
            allowFontScaling={false}
          >
            {firstName},
          </Animated.Text>
        ) : null}

        <Animated.Text
          style={{
            opacity: subtitleAnim,
            transform: [{ translateY: subtitleTranslateY }],
            // When the name line is rendered, the invitation
            // sits at ~85% ink so it whispers under the named
            // greeting; when nameless, it carries the full ink
            // weight as the sole anchor.
            color: hasRealName ? colors.inkMuted : colors.ink,
            fontFamily: "System",
            fontWeight: hasRealName ? "500" : "700",
            fontSize: hasRealName ? 26 : 32,
            lineHeight: hasRealName ? 36 : 40,
            letterSpacing: -0.3,
            textAlign: "center",
          }}
          allowFontScaling={false}
        >
          {hasRealName ? "let’s pray together." : "Let’s pray together."}
        </Animated.Text>
      </View>
    </View>
  );
}
