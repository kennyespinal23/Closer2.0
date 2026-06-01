import { useEffect, useMemo, useRef } from "react";
import { Animated, Image, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { resolveSermonType } from "@/lib/moments";
import { useFocus } from "@/state/focus";
import { useMoments } from "@/state/moments";
import { completionOrdinal } from "@/state/progress";

/**
 * Celebration screen — shown after the user taps "Amen" on the
 * closing prayer.
 *
 * The closing screen records the completion and passes a few snapshot
 * values via search params so this screen has them at render-time
 * (the React Context state has just been mutated; reading it here
 * works too, but params make the screen self-contained and replayable).
 *
 * Visual rhythm:
 *   1. Soft expanding halo + the type hero gently fade in
 *   2. Big ordinal numeral in the type's accent color
 *   3. "Well done." headline (or "Welcome to Closer." for the very first ever)
 *   4. Milestone sentence (per-type, ordinal-aware)
 *   5. A small grounding line
 *   6. Continue button (returns to /today)
 *
 * Everything is tinted to today's sermon type's accent so the celebration
 * is the last beat of that color world before chrome goes back to white.
 */
export default function CompleteScreen() {
  const router = useRouter();
  const { todaysMoment } = useMoments();
  const { endSession: endFocusSession } = useFocus();
  const type = useMemo(
    () => resolveSermonType(todaysMoment.type),
    [todaysMoment.type],
  );

  // Tear the focus session down the moment the completion screen
  // mounts. This is the canonical "session over" trigger — the
  // user reached the Amen → completion celebration, so the
  // commitment is fulfilled and any shield (real or honor-mode)
  // should come down. Effect runs once; endSession is idempotent
  // so re-mounts on hot-reload don't double-fire anything.
  useEffect(() => {
    endFocusSession().catch(() => {
      /* session teardown is best-effort */
    });
    // We want this effect to fire exactly once on mount, and
    // endFocusSession is stable across renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Snapshot params from closing.tsx — fall back to 1 so the screen
  // is still renderable if someone deep-links here for design QA.
  const {
    typeCount: typeCountParam,
    isFirstEver: isFirstEverParam,
    streak: streakParam,
    streakAdvanced: streakAdvancedParam,
    milestone: milestoneParam,
  } = useLocalSearchParams<{
    typeCount?: string;
    isFirstEver?: string;
    streak?: string;
    streakAdvanced?: string;
    milestone?: string;
  }>();

  const typeCount = Math.max(1, Number(typeCountParam) || 1);
  const isFirstEver = isFirstEverParam === "true";
  const ordinal = completionOrdinal(typeCount);

  // When this completion was the first of the day, the streak count
  // bumped — chain into /sermon/streak to show the fire update.
  // Re-completions on the same day skip the streak screen and go
  // straight home (count didn't change, nothing to celebrate).
  const streakAdvanced = streakAdvancedParam === "1";
  const streakDays = Math.max(0, Number(streakParam) || 0);
  const milestoneDays = milestoneParam ? Number(milestoneParam) : 0;

  // Subtle expanding-halo animation on mount — a slow exhale, not a pop.
  const haloScale = useRef(new Animated.Value(0.85)).current;
  const haloOpacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(haloScale, {
        toValue: 1,
        duration: 1800,
        delay: 100,
        useNativeDriver: true,
      }),
      Animated.timing(haloOpacity, {
        toValue: 1,
        duration: 1400,
        delay: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [haloScale, haloOpacity]);

  const headline = isFirstEver ? "Welcome to Closer." : "Well done.";

  const handleContinue = () => {
    if (streakAdvanced) {
      // Chain into the fire screen. The milestone param is just a
      // hint for an extra badge — empty string = no milestone, the
      // screen still renders for plain everyday streak bumps.
      router.replace({
        pathname: "/sermon/streak",
        params: {
          days: String(streakDays),
          milestone: milestoneDays ? String(milestoneDays) : "",
        },
      });
      return;
    }
    router.replace("/today");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <View className="flex-1 px-6 items-center justify-center">
        {/* Hero with animated halo */}
        <View className="items-center justify-center mb-6">
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              width: 420,
              height: 420,
              alignItems: "center",
              justifyContent: "center",
              opacity: haloOpacity,
              transform: [{ scale: haloScale }],
            }}
          >
            <CelebrationHalo color={type.accent} />
          </Animated.View>

          <Image
            source={type.hero}
            style={{ width: 180, height: 150 }}
            resizeMode="contain"
          />
        </View>

        {/* Big ordinal numeral — visual anchor of the screen */}
        <Text
          className="text-[64px] leading-[64px] tracking-[-1px] mt-2"
          style={{
            fontFamily: "PlusJakartaSans_800ExtraBold",
            color: type.accent,
          }}
        >
          {formatOrdinalNumeral(typeCount)}
        </Text>

        <Text
          className="text-ink text-[30px] leading-[36px] tracking-[-0.4px] text-center mt-6"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {headline}
        </Text>

        {/* Milestone sentence — with the type name highlighted */}
        <Text
          className="text-ink-muted text-[16px] leading-[24px] text-center mt-4 px-4"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          You completed your {ordinal}{" "}
          <Text style={{ color: type.accent }}>{type.name}</Text> sermon.
        </Text>

        <Text
          className="text-ink-subtle text-[13px] text-center mt-7 italic px-6"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          {grounding(isFirstEver, typeCount)}
        </Text>
      </View>

      <View className="px-6 pb-2">
        <Button label="Continue" onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

/**
 * The big numeral displayed under the hero — zero-padded for 1–9 so
 * "01" feels visually weighty, like a chapter number. Beyond 9 we drop
 * the leading zero since "010" reads as filename, not as poetry.
 */
function formatOrdinalNumeral(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/**
 * One closing sentence below the milestone, varying with the moment.
 * Kept short — the celebration is meant to be felt, not read.
 */
function grounding(isFirstEver: boolean, count: number): string {
  if (isFirstEver) return "The rhythm starts with one.";
  if (count === 1) return "A new doorway opened today.";
  if (count === 5) return "Five times in. That's a rhythm forming.";
  if (count === 10) return "Ten. Faithfulness shows itself in the count.";
  if (count % 25 === 0) return "Twenty-five more. Don't lose the wonder.";
  return "Small, faithful days. Keep going.";
}

function CelebrationHalo({ color }: { color: string }) {
  return (
    <Svg width={420} height={420} viewBox="0 0 420 420">
      <Defs>
        <RadialGradient id="celebration" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.32} />
          <Stop offset="45%" stopColor={color} stopOpacity={0.1} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={420} height={420} fill="url(#celebration)" />
    </Svg>
  );
}
