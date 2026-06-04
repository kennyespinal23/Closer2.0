import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { LivingHeroIcon } from "@/components/LivingHeroIcon";
import { SermonHeader } from "@/components/SermonHeader";
import * as haptics from "@/lib/haptics";
import { summarizeBlockedApps } from "@/lib/focus";
import {
  momentDurationMin,
  resolveSermonType,
  splitScripture,
} from "@/lib/moments";
import { useFocus } from "@/state/focus";
import { useMoments } from "@/state/moments";
import { useColors } from "@/state/theme";

/**
 * Sermon intro — the antechamber, AKA "sermon detail page".
 *
 * Layout (top → bottom):
 *   1. Eyebrow      ("Today · Daily Church")
 *   2. Hero strip   (sermon type's hero illustration + accent glow)
 *   3. Title        (today's specific sermon title)
 *   4. Voice line   (e.g. "with Matt Chandler · 7 min")
 *   5. Scripture    (the day's verse — reference small, text larger)
 *   6. Description  (what this type of sermon is, in one quiet line)
 *   7. Begin button + grounding microcopy
 *
 * The scripture lives on THIS page (not inside the sermon flow)
 * because the verse is context, not content — knowing the verse
 * before you begin lets the body land more clearly. The five
 * in-sermon panels (Hook → Story → Turn → Landing → Prayer) all
 * unfold the meaning of that verse, so showing it up front
 * orients the reader without delaying them.
 *
 * No progress bar — the sermon hasn't begun yet. The job here is
 * to let the user know what they're stepping into and take a
 * breath before they tap Begin.
 */
export default function SermonIntroScreen() {
  const router = useRouter();
  const colors = useColors();
  const { todaysMoment } = useMoments();
  const { prefs: focusPrefs, startSession: startFocusSession } = useFocus();
  const type = resolveSermonType(todaysMoment.type);
  const durationMin = momentDurationMin(todaysMoment);
  // Split the scripture into reference + verse text so each gets
  // its own typographic role: the reference plays the chip / label
  // beat, the verse text plays the reverent quote beat.
  const scripture = useMemo(
    () => splitScripture(todaysMoment.scripture),
    [todaysMoment.scripture],
  );

  // Per-visit override: the user can tap "Skip this time" on the
  // focus row to bypass focus for THIS session without changing
  // their standing preference. Resets when they leave the screen
  // (we don't persist it).
  const [skipFocusOnce, setSkipFocusOnce] = useState(false);

  // Focus is offered only when (a) the user enabled it in settings,
  // (b) they have at least one app in their block list, and
  // (c) they haven't tapped Skip on this session.
  const focusOffered =
    focusPrefs.enabled &&
    focusPrefs.blockedAppIds.length > 0 &&
    !skipFocusOnce;

  // When the user explicitly opted into autoStart we don't render
  // the inline row — they want the friction-free path. The row
  // only shows for the "ask each time" mode.
  const showFocusRow = focusOffered && !focusPrefs.autoStart;

  const handleStart = async () => {
    // Medium-impact haptic — Begin is the moment the user
    // commits to today's sermon, so it gets a noticeable pulse.
    haptics.tap();
    if (focusOffered) {
      // Stamp the session BEFORE navigating so the FocusBanner is
      // already armed on the first panel render. Fire-and-forget
      // the shield call (currently a no-op stub) — we don't want
      // to block the user's tap on a network/permission round-trip.
      await startFocusSession(todaysMoment.day);
    }
    // The first sermon panel is always `id: 1` ("The Hook"). The
    // dynamic panel route handles all 5 panels in sequence.
    router.push("/sermon/panel/1");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* ─── Page-level ambient atmosphere ───────────────────────
          Same Opal-style stage treatment as the home screen — the
          per-sermon-type accent paints a wide radial wash anchored
          to the screen (not the scroll content) so it bleeds into
          the status-bar area and gives the whole intro a lit-stage
          quality. Wider falloff than the home version because the
          intro hero is centered lower (icon ~280pt from top of
          screen vs ~200pt on home). */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 560,
        }}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <RadialGradient
              id="intro-ambient"
              cx="50%"
              cy="38%"
              rx="95%"
              ry="60%"
              fx="50%"
              fy="38%"
            >
              <Stop offset="0" stopColor={type.accent} stopOpacity={0.32} />
              <Stop offset="0.4" stopColor={type.accent} stopOpacity={0.12} />
              <Stop offset="0.75" stopColor={type.accent} stopOpacity={0.03} />
              <Stop offset="1" stopColor={type.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#intro-ambient)" />
        </Svg>
      </View>

      <SermonHeader />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 items-center">
          {/* Eyebrow — sermon type for today */}
          <View className="flex-row items-center mt-2 mb-1">
            <View
              className="w-6 h-[1.5px] rounded-full mr-3"
              style={{ backgroundColor: type.accent }}
            />
            <Text
              className="text-[10px] tracking-[3px] uppercase"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: type.accent,
              }}
            >
              Today · {type.name}
            </Text>
            <View
              className="w-6 h-[1.5px] rounded-full ml-3"
              style={{ backgroundColor: type.accent }}
            />
          </View>

          {/* Hero — living sermon icon. The shared LivingHeroIcon
              gives the icon the same float + breathing halo we use
              on the home screen, so the transition from home →
              intro carries one consistent "alive object" treatment
              rather than home's living icon → intro's static icon.
              haloScale=1.5 gives the intro a roomier glow because
              the icon sits in more open space than home. */}
          <View className="items-center justify-center mt-6 mb-2">
            <LivingHeroIcon
              source={type.hero}
              accent={type.accent}
              width={200}
              height={170}
              haloScale={1.5}
            />
          </View>

          {/* Title of today's specific moment */}
          <Text
            className="text-ink text-[28px] leading-[34px] tracking-[-0.4px] text-center mt-5 px-2"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {todaysMoment.title}
          </Text>

          {/* Voice + duration — "with Matt Chandler · 7 min" */}
          <View className="flex-row items-center mt-3.5">
            <Text
              className="text-ink-muted text-[13px]"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            >
              with{" "}
              <Text
                className="text-ink"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                {todaysMoment.voice}
              </Text>
              {`  ·  ${durationMin} min read`}
            </Text>
          </View>

          {/* ─── Scripture (the verse this sermon unpacks) ──────
              Set apart in its own pillared card so it reads as a
              quiet preview, not just another body paragraph. The
              left accent bar in the type color ties it visually to
              the rest of the moment's identity.

              Scripture body is now set in EB Garamond italic —
              same editorial-serif treatment used by the home's
              Verse for Today card. The verse is the most sacred
              text on this screen; sans-serif reads as UI label,
              serif italic reads as scripture pulled from a
              printed page. Size bumped 19→21 because Garamond
              reads smaller optically than Plus Jakarta Sans. */}
          <View
            className="w-full mt-7 rounded-2xl px-5 py-5"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View className="flex-row">
              <View
                className="w-[3px] rounded-full mr-4"
                style={{ backgroundColor: type.accent }}
              />
              <View className="flex-1">
                <Text
                  className="text-[10px] tracking-[2.5px] uppercase"
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: type.accent,
                  }}
                >
                  Today&apos;s Scripture
                </Text>
                {scripture.text ? (
                  <Text
                    className="text-ink text-[21px] leading-[31px] mt-2.5"
                    style={{
                      fontFamily: "EBGaramond_400Regular_Italic",
                      letterSpacing: 0.1,
                    }}
                  >
                    &ldquo;{scripture.text}&rdquo;
                  </Text>
                ) : null}
                <Text
                  className="text-ink-muted text-[12.5px] mt-3 tracking-[1.5px] uppercase"
                  style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                >
                  {scripture.reference}
                </Text>
              </View>
            </View>
          </View>

          {/* Description of what this *type* of sermon is —
              quieter than the title + scripture, just orienting
              context for someone new to this kind of beat. Set
              in serif italic so it reads as an editorial
              epigraph rather than UI copy, matching the
              sermon-hero subtitle voice on home. */}
          <Text
            className="text-ink-subtle text-[14px] leading-[22px] text-center mt-5 px-4"
            style={{
              fontFamily: "EBGaramond_400Regular_Italic",
              letterSpacing: 0.1,
            }}
          >
            {type.description}
          </Text>
        </View>
      </ScrollView>

      {/* Begin CTA — fixed at bottom.
          The optional FocusRow sits just above the button so the
          user sees the commitment they're about to make in the
          same glance as the action that confirms it. */}
      <View className="px-6 pb-2 pt-2">
        {showFocusRow && (
          <FocusRow
            apps={focusPrefs.blockedAppIds}
            onSkip={() => {
              haptics.soft();
              setSkipFocusOnce(true);
            }}
          />
        )}
        <Button label="Begin" onPress={handleStart} />
        <Text
          className="text-ink-subtle text-[13px] leading-[20px] text-center mt-3 px-2"
          style={{
            fontFamily: "EBGaramond_400Regular_Italic",
            letterSpacing: 0.1,
          }}
        >
          {focusOffered
            ? "Focus mode will quiet the noise while you read."
            : "Take a breath. There's no rush."}
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// FocusRow — inline pre-session commitment + skip-once affordance
//
// Visual rhythm:
//   • Slim pill in the same iOS-blue accent family as the live
//     banner, but at a quieter intensity (this is a preview, not
//     an active state)
//   • Shield glyph on the leading edge
//   • Two-line label: "Focus mode" + summarized app list
//   • Trailing "Skip" button with no destructive treatment — it's
//     a "this time only" affordance, not a setting change, and we
//     want the friction low so users feel free to skip without
//     penalty
// ─────────────────────────────────────────────────────────────────

const FOCUS_ACCENT = "#0A84FF";

function FocusRow({
  apps,
  onSkip,
}: {
  apps: ReadonlyArray<string>;
  onSkip: () => void;
}) {
  const colors = useColors();
  return (
    <View
      className="rounded-2xl px-3.5 py-3 mb-3 flex-row items-center"
      style={{
        backgroundColor: withAlpha(FOCUS_ACCENT, 0.1),
        borderWidth: 1,
        borderColor: withAlpha(FOCUS_ACCENT, 0.22),
      }}
    >
      <View
        className="w-7 h-7 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: withAlpha(FOCUS_ACCENT, 0.2) }}
      >
        <ShieldGlyph stroke={FOCUS_ACCENT} />
      </View>
      <View className="flex-1 pr-2">
        <Text
          className="text-[12px] tracking-[1.5px] uppercase"
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: FOCUS_ACCENT,
          }}
        >
          Focus mode
        </Text>
        <Text
          className="text-ink-muted text-[11.5px] mt-0.5"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          numberOfLines={1}
        >
          {summarizeBlockedApps(apps)}
        </Text>
      </View>
      <Pressable
        onPress={onSkip}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Skip focus mode for this session"
        className="rounded-full px-3 py-1.5"
        style={({ pressed }) => ({
          backgroundColor: withAlpha(colors.ink, 0.06),
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          className="text-[11.5px] tracking-[0.5px]"
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: colors.inkMuted,
          }}
        >
          Skip
        </Text>
      </Pressable>
    </View>
  );
}

function ShieldGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3l8 3v6c0 4-3 7-8 9-5-2-8-5-8-9V6l8-3z"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/**
 * Compose an alpha into a `#RRGGBB` hex string, returning a CSS
 * `rgba(r, g, b, a)` string usable by RN's color props.
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

// (Legacy AccentGlow was removed when LivingHeroIcon took over
// the hero rendering; the page-level radial gradient at the top
// of the screen now provides the ambient atmosphere.)
