import { useEffect, useMemo, useRef } from "react";
import { Animated, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { LivingHeroIcon } from "@/components/LivingHeroIcon";
import * as haptics from "@/lib/haptics";
import { resolveSermonType } from "@/lib/moments";
import { useFocus } from "@/state/focus";
import { useMoments } from "@/state/moments";
import { completionOrdinal } from "@/state/progress";
import { useSavedSermons } from "@/state/savedSermons";
import { useColors } from "@/state/theme";

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
  const colors = useColors();
  const { todaysMoment } = useMoments();
  const { endSession: endFocusSession } = useFocus();
  const { isSaved, toggle: toggleSaved } = useSavedSermons();
  const type = useMemo(
    () => resolveSermonType(todaysMoment.type),
    [todaysMoment.type],
  );
  const saved = isSaved(todaysMoment.day);

  const handleToggleSave = () => {
    // Light haptic on save, soft tap on unsave — matches the
    // bookmark interactions elsewhere in the app (saved
    // insights). Toggle is local-only; no nav side effect so
    // the user can keep tapping until they're sure.
    haptics.soft();
    toggleSaved(todaysMoment.day);
  };

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
        {/* Hero with animated entrance halo + LIVING icon.
            Two layered systems:
              • External CelebrationHalo wrapped in Animated.View
                handles the ONE-SHOT entrance — a slow exhale of
                color expanding outward as the screen mounts.
                That entrance is the celebratory beat.
              • LivingHeroIcon (haloScale=0 to suppress its own
                halo since we have the external one) gives the
                ICON itself continuous float + breath so it doesn't
                go static after the entrance lands.

            Result: the screen blooms on arrival, then the icon
            keeps gently breathing — same alive-object quality
            as the home and intro heroes. */}
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

          <LivingHeroIcon
            source={type.hero}
            accent={type.accent}
            width={180}
            height={150}
            haloScale={0}
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

        {/* Milestone sentence — with the type name highlighted.
            Kept in sans because the phrasing is informational
            ("You completed your 3rd Daily Church sermon."),
            not editorial. */}
        <Text
          className="text-ink-muted text-[16px] leading-[24px] text-center mt-4 px-4"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          You completed your {ordinal}{" "}
          <Text style={{ color: type.accent }}>{type.name}</Text> sermon.
        </Text>

        {/* Grounding line — kept in sans (Plus Jakarta Sans
            Medium). This is short framing copy that punctuates
            the celebration; sans keeps it scannable and trusts
            the milestone sentence above to carry the warmth.
            Italic serif on this single line was the kind of
            "applied flourish" that called attention to typography
            instead of the message. */}
        <Text
          className="text-ink-subtle text-[13px] leading-[20px] text-center mt-7 px-6"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        >
          {grounding(isFirstEver, typeCount)}
        </Text>
      </View>

      <View className="px-6 pb-2">
        {/* Save toggle — secondary action above the primary
            Continue button. Lets the user keep today's sermon in
            their Library "Saved" rail for re-reading later. The
            row reads as a subtle pill (no fill, hairline outline
            in the type's accent) so it sits one tier below the
            solid Continue button — the saving is OPT-IN, not the
            expected next tap. Filled state flips the bookmark
            icon to its solid form and the label to "Saved" in
            the accent color so the toggle's state is
            immediately legible.

            Lives in the bottom CTA block (above Continue) so the
            two actions read as a clear stack: "keep this for
            later → move on". Putting save inline with the
            celebration copy felt premature; the user has just
            finished the sermon, save is something they decide
            on the way out. */}
        <SaveToggle
          saved={saved}
          accent={type.accent}
          inkColor={colors.ink}
          mutedColor={colors.inkMuted}
          onPress={handleToggleSave}
        />
        <View style={{ height: 12 }} />
        <Button
          label="Continue"
          onPress={() => {
            haptics.soft();
            handleContinue();
          }}
        />
      </View>
    </SafeAreaView>
  );
}

/**
 * SaveToggle — the bookmark pill above the Continue CTA.
 *
 * Visual rhythm:
 *   • unsaved → outlined ghost pill, neutral ink label, hollow
 *               bookmark icon. Reads as a quiet invitation.
 *   • saved   → accent-tinted soft fill, accent-colored
 *               "Saved" label, filled bookmark glyph. Reads as
 *               a clear "this is in your collection now"
 *               confirmation.
 *
 * Lives in this file (rather than a shared component) because
 * the only consumer is the celebration screen and the pill is
 * tuned to that screen's accent palette + spacing.
 */
function SaveToggle({
  saved,
  accent,
  inkColor,
  mutedColor,
  onPress,
}: {
  saved: boolean;
  accent: string;
  inkColor: string;
  mutedColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={saved ? "Remove from saved" : "Save sermon"}
      accessibilityState={{ selected: saved }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          paddingVertical: 14,
          paddingHorizontal: 20,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: saved ? withAlpha(accent, 0.55) : withAlpha(inkColor, 0.18),
          backgroundColor: saved ? withAlpha(accent, 0.16) : "transparent",
        }}
      >
        <BookmarkGlyph
          filled={saved}
          stroke={saved ? accent : mutedColor}
          fill={saved ? accent : "none"}
        />
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: saved ? accent : inkColor,
            fontSize: 15,
            letterSpacing: -0.1,
            marginLeft: 10,
          }}
        >
          {saved ? "Saved" : "Save sermon"}
        </Text>
      </View>
    </Pressable>
  );
}

function BookmarkGlyph({
  filled,
  stroke,
  fill,
}: {
  filled: boolean;
  stroke: string;
  fill: string;
}) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24">
      <Path
        d="M6 3h12a1 1 0 011 1v17l-7-4-7 4V4a1 1 0 011-1z"
        stroke={stroke}
        strokeWidth={filled ? 0 : 1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={fill}
      />
    </Svg>
  );
}

/**
 * Adds an alpha channel to a hex color (`#RRGGBB`). Returns a
 * `rgba(...)` string. Same helper pattern used elsewhere in the
 * app for translucent tint plates; duplicated here so this file
 * doesn't pull in the color util just for one wash.
 */
function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
