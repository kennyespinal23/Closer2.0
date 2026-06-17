import { useEffect, useMemo, useRef } from "react";
import { Animated, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { LivingHeroIcon } from "@/components/LivingHeroIcon";
import { SFSymbol } from "@/components/Symbol";
import * as haptics from "@/lib/haptics";
import {
  type Moment,
  nextMoment,
  resolveSermonType,
  resolveSermonTypeForMoment,
} from "@/lib/moments";
import { useReducedMotion } from "@/lib/useReducedMotion";
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
  const { todaysMoment, advanceToNextMoment } = useMoments();
  const { endSession: endFocusSession } = useFocus();
  const { isSaved, toggle: toggleSaved } = useSavedSermons();
  const reducedMotion = useReducedMotion();
  const type = useMemo(
    () => resolveSermonType(todaysMoment.type),
    [todaysMoment.type],
  );
  const saved = isSaved(todaysMoment.day);

  // The next sermon in the catalog — drives the "Up next" preview
  // card pinned beneath the celebration block. We resolve the
  // moment + its type once per render of today's day so the card
  // shows real artwork + title for what the user would read next.
  // Wraps to Day 1 at the end of the 90-day catalog so the card
  // is always populated rather than disappearing on Day 90.
  const upNext = useMemo<Moment>(
    () => nextMoment(todaysMoment.day),
    [todaysMoment.day],
  );
  const upNextType = useMemo(
    () => resolveSermonTypeForMoment(upNext),
    [upNext],
  );

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
  // Delayed entrance for the Up Next preview card — slides up + fades
  // in AFTER the celebration block has had a beat to land. Mirrors
  // the Deepstash sequence where the celebration plays first and the
  // "Read next" rail glides in once the moment has settled, so the
  // user isn't trying to read recommendations while the hero is
  // still blooming. We treat reducedMotion specially below (skip the
  // transform, just set to 1 instantly).
  const upNextEnter = useRef(new Animated.Value(0)).current;
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
      Animated.timing(upNextEnter, {
        toValue: 1,
        duration: reducedMotion ? 0 : 700,
        delay: reducedMotion ? 0 : 1400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [haloScale, haloOpacity, upNextEnter, reducedMotion]);

  const headline = isFirstEver ? "Welcome to Closer." : "Well done.";

  const handleUpNext = () => {
    // Roll the catalog forward so the rest of the app (home card,
    // intro screen, panels) sees the new "today's moment" and the
    // sermon flow renders against the right content. Then route
    // STRAIGHT into the scripture intro — same entry point a user
    // takes when starting today's sermon from the home card, so
    // the next-sermon experience is identical to a fresh start.
    haptics.soft();
    advanceToNextMoment();
    router.replace("/sermon/scripture");
  };

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
      {/* Celebration block — centered in the upper portion of the
          screen. The previous revision used flex-1 + justify-center
          which absorbed all the vertical space; we now cap that
          flex region so the Up Next rail beneath it has room to
          breathe instead of being squeezed into the bottom CTA
          block. The celebration still feels generous — there's a
          minHeight that keeps the hero comfortably in the upper
          half of the screen on tall devices — but a long-press
          recommendation rail can co-exist below it without overlap. */}
      <View
        className="px-6 items-center justify-center"
        style={{ flex: 1 }}
      >
        {/* Hero with animated entrance halo + LIVING icon + the
            warm one-shot confetti burst that's the visual signature
            of the celebration. Three layered systems:
              • External CelebrationHalo wrapped in Animated.View
                handles the ONE-SHOT entrance — a slow exhale of
                color expanding outward as the screen mounts. That
                entrance is the calm celebratory beat.
              • ConfettiBurst overlays the hero with warm-toned
                dots that burst outward then fade. Inspired by the
                Deepstash "Book Completed" sequence, retoned to
                Closer's palette so the energy reads as gentle
                fireworks rather than a party popper.
              • LivingHeroIcon (haloScale=0 to suppress its own
                halo since we have the external one) gives the ICON
                itself continuous float + breath so it doesn't go
                static after the entrance lands.
            Result: the screen blooms + bursts on arrival, then the
            icon keeps gently breathing — same alive-object quality
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

          <ConfettiBurst accent={type.accent} reducedMotion={reducedMotion} />

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
            fontFamily: "System",
            fontWeight: "800",
            color: type.accent,
          }}
        >
          {formatOrdinalNumeral(typeCount)}
        </Text>

        <Text
          className="text-ink text-[30px] leading-[36px] tracking-[-0.4px] text-center mt-6"
          style={{ fontFamily: "System", fontWeight: "700" }}
        >
          {headline}
        </Text>

        {/* Milestone sentence — with the type name highlighted.
            Kept in sans because the phrasing is informational
            ("You completed your 3rd Daily Church sermon."),
            not editorial. */}
        <Text
          className="text-ink-muted text-[16px] leading-[24px] text-center mt-4 px-4"
          style={{ fontFamily: "System", fontWeight: "400" }}
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
          style={{ fontFamily: "System", fontWeight: "500" }}
        >
          {grounding(isFirstEver, typeCount)}
        </Text>
      </View>

      <View className="px-6 pb-2">
        {/* Up Next preview card — the Deepstash-inspired "what's
            next" rail that lands once the celebration has settled.
            Shows the next sermon in the catalog as a small horizontal
            card (thumb + type eyebrow + title + chevron). Tapping
            advances the catalog and routes straight into the
            scripture intro, so users who want to keep going have a
            one-tap path forward while users who want to honor the
            daily rhythm can still pick Continue.
            
            Slides up + fades in via `upNextEnter` (700ms, 1400ms
            delay) so it doesn't compete with the celebration's own
            bloom. Reduced Motion mounts it in place at full
            opacity. The header eyebrow above the card matches the
            voice of other "Continue your..." rails in iOS Music
            and Apple TV ("Up Next" is the canonical iOS label).
            
            We DON'T offer a multi-card recommendation row here —
            Closer's "one quiet day at a time" rhythm makes a single
            invitation feel honest where a 3-up grid would feel
            like a content firehose. */}
        <Animated.View
          style={{
            opacity: upNextEnter,
            transform: [
              {
                translateY: upNextEnter.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          }}
        >
          <UpNextHeader colors={colors} />
          <UpNextCard
            moment={upNext}
            accent={upNextType.accent}
            illustration={upNextType.illustration ?? upNextType.hero}
            inkColor={colors.ink}
            mutedColor={colors.inkMuted}
            subtleColor={colors.inkSubtle}
            borderColor={colors.border}
            surfaceColor={colors.surface}
            onPress={handleUpNext}
          />
        </Animated.View>

        <View style={{ height: 18 }} />

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

            Lives in the bottom CTA block (between Up Next and
            Continue) so the three actions read as a clear stack:
            "open the next chapter → keep this for later → move
            on for now". Putting save inline with the celebration
            copy felt premature; the user has just finished the
            sermon, save is something they decide on the way out. */}
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

// ─────────────────────────────────────────────────────────────────
// ConfettiBurst — warm one-shot particle plume around the hero
//
// Renders ~14 small dots that start at the centerpoint, burst
// outward to a randomized scattered position, then fade out. Sits
// behind the hero icon visually so the icon stays the visual lead
// — the burst is supporting motion, not the subject.
//
// Inspired by the Deepstash "Book Completed" celebration sequence
// where confetti spreads from the artifact at the moment of
// finishing. Where Deepstash uses saturated red/orange dots at high
// energy, Closer's palette stays in the amber + peach + cream
// family at lower opacity so the burst feels like firelight catching
// in the room rather than a party popper. That tonal shift was the
// only way to import the pattern without violating Closer's calm-
// devotional aesthetic.
//
// Performance: each dot owns a static randomized config built once
// with useMemo (angle / distance / size / color / per-dot delay
// jitter), and the animation drives a SINGLE shared Animated.Value
// from 0 → 1 → 2 — every dot interpolates its translate / scale /
// opacity off that shared driver. This keeps native-driven
// transforms in play and avoids spawning 14 parallel timing
// instances per mount.
//
// Respects Reduce Motion: skips the burst entirely and renders
// nothing (the celebration halo + hero icon are still expressive on
// their own without animated particles).
// ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  "#FFB672", // peach amber
  "#FF8A3B", // streak deep
  "#FFE0B5", // cream
  "#FFCB8A", // warm gold
] as const;

const CONFETTI_COUNT = 14;

function ConfettiBurst({
  accent,
  reducedMotion,
}: {
  accent: string;
  reducedMotion: boolean;
}) {
  // Build each dot's static randomized properties once. We use the
  // even-distribution baseline (i / count * 2π) so the dots cover
  // the full circle around the hero rather than clustering, then
  // add a small angle jitter so the spread doesn't read as a
  // mechanical starburst.
  const dots = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => {
        const angle =
          (Math.PI * 2 * i) / CONFETTI_COUNT + (Math.random() - 0.5) * 0.6;
        const distance = 110 + Math.random() * 60;
        const size = 4 + Math.random() * 4;
        // Mix the per-type accent into the warm palette so the
        // burst nods to the sermon type's color without being
        // monochromatic — every fourth dot is the accent, the
        // rest cycle through the warm shared palette.
        const color =
          i % 4 === 0 ? accent : CONFETTI_COLORS[i % CONFETTI_COLORS.length]!;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance;
        return { tx, ty, size, color };
      }),
    [accent],
  );

  // Shared 0 → 1 → 2 driver. 0..1 is the outward burst (dots scale
  // from 0 to full and fly to their target offset); 1..2 is the
  // settle-and-fade phase where dots hold position and dim back to
  // zero. Holding the dots in place during fade (rather than
  // continuing to drift) keeps the motion legible at the small
  // particle sizes we're using.
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion) return;
    Animated.sequence([
      Animated.timing(progress, {
        toValue: 1,
        duration: 700,
        delay: 200,
        useNativeDriver: true,
      }),
      Animated.delay(550),
      Animated.timing(progress, {
        toValue: 2,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();
  }, [progress, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        width: 0,
        height: 0,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {dots.map((dot, i) => {
        const tx = progress.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [0, dot.tx, dot.tx],
        });
        const ty = progress.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [0, dot.ty, dot.ty],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.3, 1, 2],
          outputRange: [0, 0.95, 0.95, 0],
        });
        const scale = progress.interpolate({
          inputRange: [0, 0.4, 1, 2],
          outputRange: [0.2, 1, 1, 0.6],
        });
        return (
          <Animated.View
            key={i}
            style={{
              position: "absolute",
              width: dot.size,
              height: dot.size,
              borderRadius: dot.size / 2,
              backgroundColor: dot.color,
              opacity,
              transform: [{ translateX: tx }, { translateY: ty }, { scale }],
            }}
          />
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// UpNextHeader — the "UP NEXT" eyebrow above the preview card
//
// Small uppercase tracking-heavy label, color-overridden to the
// same rgba(235,235,245,0.72) value the streak screen uses for its
// supporting eyebrow so contrast clears Apple HIG's small-text
// preference (~6.6:1 against the dark canvas) without competing
// with the title typography on the card itself.
// ─────────────────────────────────────────────────────────────────

function UpNextHeader({ colors: _colors }: { colors: { ink: string } }) {
  return (
    <Text
      className="text-[11px] tracking-[2.5px] uppercase mb-2.5 ml-1"
      style={{
        fontFamily: "System",
        fontWeight: "700",
        color: "rgba(235, 235, 245, 0.72)",
      }}
      accessibilityRole="header"
    >
      Up next
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────
// UpNextCard — compact horizontal preview of the next sermon
//
// Shape: 64×64 thumbnail (sermon illustration when available,
// falling back to the type's hero glyph) + a two-line text block
// (sermon-type eyebrow over the sermon title) + a trailing chevron
// glyph that signals "tap to open". Whole card is one Pressable
// so the entire row reads as a single 44pt+ touch target per HIG.
//
// The card's tint subtly nods to the upcoming sermon's accent — a
// faint accent-colored wash sits behind the thumbnail so the color
// world the user is about to enter is previewed inline. This is
// the same pattern the home SermonCard uses on the Library tab
// (small accent halo behind the hero glyph) so the visual
// language of "preview of an upcoming sermon" is consistent across
// surfaces.
// ─────────────────────────────────────────────────────────────────

function UpNextCard({
  moment,
  accent,
  illustration,
  inkColor,
  mutedColor,
  subtleColor: _subtleColor,
  borderColor,
  surfaceColor,
  onPress,
}: {
  moment: Moment;
  accent: string;
  illustration: ReturnType<typeof require>;
  inkColor: string;
  mutedColor: string;
  subtleColor: string;
  borderColor: string;
  surfaceColor: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Up next: ${moment.title}. Tap to start the next sermon.`}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 12,
          paddingHorizontal: 12,
          borderRadius: 18,
          borderWidth: 1,
          borderColor,
          backgroundColor: surfaceColor,
        }}
      >
        {/* Thumb — accent-tinted square cradling the sermon's hero
            artwork. Soft fill (16% accent) keeps the thumb visible
            without competing with the surrounding card surface, and
            gives a quiet preview of the color world the user is
            about to step into. */}
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            backgroundColor: withAlpha(accent, 0.16),
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <Image
            source={illustration}
            style={{ width: 56, height: 56 }}
            resizeMode="cover"
          />
        </View>

        <View style={{ flex: 1, marginLeft: 14, marginRight: 8 }}>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              color: accent,
              // Bumped from 10.5pt to 11pt to clear the Apple
              // HIG minimum font size floor for iOS (11pt).
              // The eyebrow caps still read as supporting
              // metadata against the title beneath, and the
              // 1.8 letter-spacing keeps the airy proportion
              // even at the slightly larger size.
              fontSize: 11,
              letterSpacing: 1.8,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
            numberOfLines={1}
          >
            {moment.type}
          </Text>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              color: inkColor,
              fontSize: 15.5,
              lineHeight: 20,
              letterSpacing: -0.2,
            }}
            numberOfLines={2}
          >
            {moment.title}
          </Text>
        </View>

        <SFSymbol
          name="chevron.right"
          size={14}
          color={mutedColor}
          weight="semibold"
        />
      </View>
    </Pressable>
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
            fontFamily: "System",
            fontWeight: "700",
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
