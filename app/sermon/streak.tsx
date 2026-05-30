import { useEffect, useMemo, useRef } from "react";
import { Animated, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { milestoneCopy } from "@/lib/journey";

/**
 * Streak update screen — the "fire" screen.
 *
 * Shown after the sermon completion celebration (`/sermon/complete`)
 * whenever a sermon completion actually advanced the streak —
 * which is to say: the user just finished their first sermon of
 * the day. Re-completions on the same day skip this screen because
 * the count didn't change.
 *
 * Visually echoes the Duolingo / Snapchat fire-streak pattern:
 *   • Big amber flame in a warm halo
 *   • The day count, set huge
 *   • "X-DAY STREAK" eyebrow
 *   • One headline + one supporting line
 *   • A subtle "milestone" badge when this advance also crossed a
 *     threshold (3 / 7 / 14 / 21 / 30 / 50 / 75 / 100 / 150 / 200 /
 *     365) — same visual at every count, the badge is the only thing
 *     that signals "this one's bigger".
 *
 * Distinct from /sermon/complete in palette and rhythm: the
 * completion celebration is white-on-dark with the sermon's accent;
 * the streak screen lives in an amber + warm-orange world tied to
 * the fire icon.
 */

const STREAK_AMBER = "#FFB672";
const STREAK_DEEP = "#FF8A3B";

export default function StreakScreen() {
  const router = useRouter();
  const { days: daysParam, milestone: milestoneParam } =
    useLocalSearchParams<{ days?: string; milestone?: string }>();

  // Fall back to 1 so the screen is renderable for design QA even
  // when deep-linked without params. Clamped so a typo can't break
  // the formatter.
  const days = useMemo(() => Math.max(1, Number(daysParam) || 1), [daysParam]);
  // Milestone is the threshold value (e.g. 7) when this advance also
  // crossed one. Empty/missing string ⇒ no milestone badge.
  const milestone = useMemo(
    () => (milestoneParam ? Number(milestoneParam) : 0),
    [milestoneParam],
  );
  const isMilestone = milestone > 0;

  // Slow expanding halo on mount — same exhale-style motion the
  // completion screen uses, slightly slower so this beat lands as
  // its own thing rather than feeling tacked on.
  const haloScale = useRef(new Animated.Value(0.7)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;
  const numberScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(haloScale, {
        toValue: 1,
        duration: 2200,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(haloOpacity, {
        toValue: 1,
        duration: 1600,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.spring(numberScale, {
        toValue: 1,
        delay: 600,
        useNativeDriver: true,
        tension: 30,
        friction: 7,
      }),
    ]).start();
  }, [haloScale, haloOpacity, numberScale]);

  const handleContinue = () => {
    router.replace("/today");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-1 px-6 items-center justify-center">
        {/* Halo + flame stack */}
        <View className="items-center justify-center mb-2">
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: 460,
              height: 460,
              alignItems: "center",
              justifyContent: "center",
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            }}
          >
            <StreakHalo />
          </Animated.View>

          <FadeIn delayMs={300} durationMs={1200}>
            <FlameMark />
          </FadeIn>
        </View>

        {/* Milestone badge — only present when this advance crossed
            a threshold. Sits just above the number so the eye reads
            it before settling on the count. */}
        {isMilestone && (
          <FadeIn delayMs={550} durationMs={900}>
            <View
              className="flex-row items-center px-3 py-1.5 rounded-full mt-5"
              style={{
                backgroundColor: "rgba(255, 182, 114, 0.12)",
                borderWidth: 1,
                borderColor: "rgba(255, 182, 114, 0.35)",
              }}
            >
              <Svg width={10} height={10} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M12 2l2.5 7H22l-6 4.5L18 22l-6-4.5L6 22l2-8.5L2 9h7.5z"
                  fill={STREAK_AMBER}
                />
              </Svg>
              <Text
                className="text-[10.5px] tracking-[2.5px] uppercase ml-2"
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: STREAK_AMBER,
                }}
              >
                {milestone}-day milestone
              </Text>
            </View>
          </FadeIn>
        )}

        {/* The number itself — biggest type on the screen. Springs
            in slightly after the halo settles. */}
        <Animated.View style={{ transform: [{ scale: numberScale }] }}>
          <FadeIn delayMs={700} durationMs={900}>
            <Text
              className={isMilestone ? "text-[88px] leading-[88px] tracking-[-2px] mt-4 text-center" : "text-[88px] leading-[88px] tracking-[-2px] mt-7 text-center"}
              style={{
                fontFamily: "PlusJakartaSans_800ExtraBold",
                color: STREAK_AMBER,
              }}
            >
              {days}
            </Text>
          </FadeIn>
        </Animated.View>

        <FadeIn delayMs={1200} durationMs={900}>
          <Text
            className="text-ink-subtle text-[12px] tracking-[3px] uppercase text-center mt-2"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {days === 1 ? "DAY STREAK" : `${days}-DAY STREAK`}
          </Text>
        </FadeIn>

        <FadeIn delayMs={1600} durationMs={1100}>
          <Text
            className="text-ink text-[26px] leading-[32px] tracking-[-0.3px] text-center mt-7 px-4"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {streakHeadline(days, isMilestone)}
          </Text>
        </FadeIn>

        <FadeIn delayMs={2100} durationMs={1100}>
          <Text
            className="text-ink-muted text-[14.5px] leading-[22px] text-center mt-3.5 px-4"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            {streakSubcopy(days, isMilestone)}
          </Text>
        </FadeIn>
      </View>

      <FadeIn delayMs={2800} durationMs={900}>
        <View className="px-6 pb-2">
          <Button label="Continue" onPress={handleContinue} />
        </View>
      </FadeIn>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Copy helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Headline tuned to (1) the magnitude of the streak and (2) whether
 * this completion ALSO crossed a milestone. Milestone-day copy
 * leans into the moment; ordinary days stay warm + understated.
 */
function streakHeadline(days: number, isMilestone: boolean): string {
  if (isMilestone) {
    if (days <= 3) return "A rhythm is forming.";
    if (days <= 7) return "A full week of showing up.";
    if (days <= 14) return "Two weeks. You're building something real.";
    if (days <= 30) return "A month of nearness.";
    if (days <= 75) return "A practice, not an experiment.";
    if (days <= 200) return "You walk with Him.";
    return "A year of seeking. May it be the first of many.";
  }
  if (days === 1) return "Day one. You're on the board.";
  if (days === 2) return "Day two. Showing up again.";
  return "Streak alive.";
}

function streakSubcopy(days: number, isMilestone: boolean): string {
  if (isMilestone) return milestoneCopy(days);
  if (days === 1)
    return "The longest journeys begin with a single, faithful step.";
  if (days < 7)
    return `${days} days in a row. Small, consistent days are how rhythm is built.`;
  if (days < 30) return `${days} days. Keep tending the fire.`;
  return `${days} days. May today's quiet add to tomorrow's depth.`;
}

// ─────────────────────────────────────────────────────────────────
// Visuals
// ─────────────────────────────────────────────────────────────────

/**
 * The amber halo behind the flame. Same gradient family as the
 * sermon-complete halo but tinted to the streak palette so the two
 * screens feel related yet distinct.
 */
function StreakHalo() {
  return (
    <Svg width={460} height={460} viewBox="0 0 460 460">
      <Defs>
        <RadialGradient id="streakHalo" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={STREAK_AMBER} stopOpacity={0.34} />
          <Stop offset="40%" stopColor={STREAK_DEEP} stopOpacity={0.12} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={460} height={460} fill="url(#streakHalo)" />
    </Svg>
  );
}

/**
 * Large glowing flame glyph — visual anchor of the screen. Soft
 * inner highlight so it reads as "alive" rather than as a flat icon.
 */
function FlameMark() {
  return (
    <Svg width={140} height={140} viewBox="0 0 24 24">
      <Defs>
        <RadialGradient id="flameFill" cx="50%" cy="60%" r="55%">
          <Stop offset="0%" stopColor="#FFD9A8" stopOpacity={1} />
          <Stop offset="55%" stopColor={STREAK_AMBER} stopOpacity={1} />
          <Stop offset="100%" stopColor={STREAK_DEEP} stopOpacity={1} />
        </RadialGradient>
      </Defs>
      <Path
        d="M12 3c2 3 5 5 5 9a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-8z"
        fill="url(#flameFill)"
        stroke={STREAK_DEEP}
        strokeWidth={0.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
