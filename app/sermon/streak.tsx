import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import LottieView from "lottie-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { milestoneCopy } from "@/lib/journey";

// Hero flame animation. Lottie JSON (500×690 native, portrait
// aspect) lives in `assets/lottie/` and renders in `FlameMark`
// below at 140×140 to drop-in-replace the static SVG flame
// the streak screen shipped with. Lottie autoplays + loops
// on mount, so the screen has live motion the moment it
// lands — no separate JS-driven breath needed inside the
// flame itself.
const FIRE_STREAK_ANIMATION = require("../../assets/lottie/FireStreakAnimation.json");

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
  // Live "count-up" of the streak number — the displayed value
  // animates from (days - 1) up to `days` so the user SEES the
  // +1 land. This is the Apple Watch / Strava trick where the
  // metric jumps in the rendered UI exactly when the metric
  // jumps in your real life — the satisfaction comes from
  // watching the number change, not just seeing the new total.
  // For day 1 we start from 0 since "subtracting one" would
  // render -1 for half a second before snapping to 0 → 1.
  const startCount = Math.max(0, days - 1);
  const [displayedCount, setDisplayedCount] = useState(startCount);

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

  // Number count-up — drives the JS-side text. We give it a small
  // delay so it lines up with the spring that scales the numeral
  // up, then ticks from startCount → days in even steps. The
  // animation length scales with the delta so a single +1 lands
  // in ~700ms and a +30 (theoretical) still lands cleanly. The
  // count uses setTimeout per tick rather than a single Animated
  // listener because we're updating a Text node and Animated's
  // native driver can't drive text content directly.
  useEffect(() => {
    const delta = days - startCount;
    if (delta <= 0) {
      setDisplayedCount(days);
      return;
    }
    const totalDurationMs = Math.min(1100, 320 + delta * 110);
    const stepMs = Math.max(40, Math.floor(totalDurationMs / delta));
    const startDelayMs = 700; // line up with the spring landing
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 1; i <= delta; i += 1) {
      const t = setTimeout(
        () => {
          if (!cancelled) setDisplayedCount(startCount + i);
        },
        startDelayMs + i * stepMs,
      );
      timers.push(t);
    }
    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
    };
  }, [days, startCount]);

  // Subtle flame breath — gentle scale + opacity oscillation so the
  // flame reads as "lit" rather than "icon". Loops forever; same
  // pattern as the LivingHeroIcon halo. Tuned to be calm enough not
  // to distract while the user reads the headline / subcopy.
  const flameBreath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameBreath, {
          toValue: 1,
          duration: 2400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(flameBreath, {
          toValue: 0,
          duration: 2800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [flameBreath]);
  const flameScale = flameBreath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.97, 1.05],
  });
  const flameOpacity = flameBreath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

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

          <Animated.View
            style={{
              transform: [{ scale: flameScale }],
              opacity: flameOpacity,
            }}
          >
            <FlameMark />
          </Animated.View>
        </View>

        {/* Milestone badge — only present when this advance crossed
            a threshold. Sits just above the number so the eye reads
            it before settling on the count. */}
        {isMilestone && (
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
        )}

        {/* The number itself — biggest type on the screen. The
            spring-scale Animated.View lands the count with a small
            bounce; the displayed value count-ups from (days - 1)
            → days so the +1 lands VISIBLY (Apple-Watch-style metric
            satisfaction).
            Note: this is `displayedCount`, not `days`. The final
            frame always shows `days` once the count-up settles. */}
        <Animated.View style={{ transform: [{ scale: numberScale }] }}>
          <Text
            className={isMilestone ? "text-[88px] leading-[88px] tracking-[-2px] mt-4 text-center" : "text-[88px] leading-[88px] tracking-[-2px] mt-7 text-center"}
            style={{
              fontFamily: "PlusJakartaSans_800ExtraBold",
              color: STREAK_AMBER,
            }}
          >
            {displayedCount}
          </Text>
        </Animated.View>

        <Text
          className="text-ink-subtle text-[12px] tracking-[3px] uppercase text-center mt-2"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {days === 1 ? "DAY STREAK" : `${days}-DAY STREAK`}
        </Text>

        <Text
          className="text-ink text-[26px] leading-[32px] tracking-[-0.3px] text-center mt-7 px-4"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {streakHeadline(days, isMilestone)}
        </Text>

        <Text
          className="text-ink-muted text-[14.5px] leading-[22px] text-center mt-3.5 px-4"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          {streakSubcopy(days, isMilestone)}
        </Text>
      </View>

      <View className="px-6 pb-2">
        <Button label="Continue" onPress={handleContinue} />
      </View>
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
 * Large glowing flame — visual anchor of the screen.
 *
 * Lottie animation (FireStreakAnimation.json) renders at
 * 140×140, matching the static SVG slot the screen
 * shipped with so the surrounding halo / number layout
 * stays unchanged.
 *
 * `autoPlay` + `loop` start the flame the moment the
 * screen mounts; the wrapping `flameBreath` Animated.View
 * higher up in the tree continues to layer a slow ambient
 * scale/opacity pulse on top of the Lottie's own internal
 * motion, so the flame reads as alive AND "breathing in
 * the room" rather than just looping in place.
 *
 * The asset is intrinsically portrait (500×690). At 140×140
 * the Lottie engine preserves aspect ratio and centers
 * horizontally, so the flame fills ~100×140 within the
 * 140-square box. If a future iteration wants the flame
 * to read bigger, bump the width/height together — the
 * Lottie scales cleanly to any size.
 */
function FlameMark() {
  return (
    <LottieView
      source={FIRE_STREAK_ANIMATION}
      autoPlay
      loop
      style={{ width: 140, height: 140 }}
    />
  );
}
