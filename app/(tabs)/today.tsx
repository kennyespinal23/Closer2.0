import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Defs,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useRouter } from "expo-router";
import { ActivityRing, RING_ACCENT } from "@/components/ActivityRing";
import { FadeIn } from "@/components/FadeIn";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import { ShieldOverlay } from "@/components/ShieldOverlay";
import { cancelDailyReminder } from "@/lib/notifications";
import { momentDurationMin, resolveSermonType } from "@/lib/moments";
import { formatMinutes, formatRemaining } from "@/lib/readingGoalFormat";
import { SOCIAL_APPS, summarizeBlockedApps } from "@/lib/focus";
import { findMood } from "@/constants/moods";
import { type SermonType } from "@/constants/sermonTypes";
import { useAnnotations } from "@/state/annotations";
import { type CheckIn, useCheckIns } from "@/state/checkIns";
import { useFocus } from "@/state/focus";
import { useMoments } from "@/state/moments";
import { useOnboarding } from "@/state/onboarding";
import { usePreferences } from "@/state/preferences";
import { useProgress } from "@/state/progress";
import { useReadingGoal } from "@/state/readingGoal";
import { useColors } from "@/state/theme";

// Home — the Imprint pass.
//
// One greeting line, one streak strip, then the reading-goal pill
// (the daily metric anchor) directly under it, then today's sermon
// hero, then a slim "Last check-in" recap pointing to the user's
// most recent mood log. Chapter-resume Continue-Reading lives on
// the Library tab now — Home is sermon + feeling + activity, in
// that order. Stats (sermons heard, highlights, etc.) sit in
// Profile → Your Practice; the activity ring's full detail screen
// is at /reading-goal.

export default function TodayScreen() {
  const router = useRouter();
  const { answers, reset: resetOnboarding } = useOnboarding();
  const { reset: resetPreferences } = usePreferences();
  const { reset: resetAnnotations } = useAnnotations();
  const { log: checkInLog, reset: resetCheckIns } = useCheckIns();
  const { reset: resetReadingGoal } = useReadingGoal();
  const {
    todaysMoment,
    catalogPosition,
    advanceToNextMoment,
    reset: resetMoments,
  } = useMoments();
  const progress = useProgress();
  const { streak, hasCompletedSermonToday } = progress;
  const {
    todayMinutes: readingMinutes,
    goalMinutes: readingGoal,
    reachedToday: readingGoalReached,
  } = useReadingGoal();
  const {
    prefs: focusPrefs,
    session: focusSession,
    setEnabled: setFocusEnabled,
    endSession: endFocusSession,
    reset: resetFocus,
  } = useFocus();

  // Dev preview state for the ShieldOverlay. Holds the id of the
  // app whose shield is currently being previewed, or null when no
  // preview is showing. Only ever set from the __DEV__ tools row.
  const [previewAppId, setPreviewAppId] = useState<string | null>(null);

  const greeting = useMemo(() => getGreeting(), []);
  const firstName = (answers.name || "").trim().split(" ")[0] || "friend";
  // The day's sermon type is derived from today's moment (vs. the
  // old day-of-year rotation) so the home card's accent + hero
  // match the screens you're about to walk through.
  const sermonType = useMemo(
    () => resolveSermonType(todaysMoment.type),
    [todaysMoment.type],
  );
  // Used by the sermon card meta line + the intro screen; computed
  // here (rather than re-derived inside SermonCard) so the same
  // number renders in both places.
  const sermonDurationMin = useMemo(
    () => momentDurationMin(todaysMoment),
    [todaysMoment],
  );

  // Most recent check-in — newest is at the end of the log. Used
  // by the "Last check-in" recap card below; entire card is hidden
  // when the user has never checked in.
  const lastCheckIn = useMemo<CheckIn | null>(
    () => (checkInLog.length > 0 ? checkInLog[checkInLog.length - 1]! : null),
    [checkInLog],
  );

  // Streak strip data — only the bits the simplified WeekStrip
  // actually needs: per-day engagement + the "you are here" cell.
  const weekDays = useMemo<ReadonlyArray<WeekDay>>(
    () =>
      streak.lastSevenDays.map((d) => ({
        dateISO: d.dateISO,
        engaged: d.engaged,
      })),
    [streak.lastSevenDays],
  );

  const handlePlaySermon = () => {
    router.push("/sermon/intro");
  };

  const handleOpenLastCheckIn = () => {
    if (!lastCheckIn) return;
    router.push(`/check-ins/${lastCheckIn.id}` as never);
  };

  const handleOpenProfile = () => {
    // Presented modally from the root stack — see app/_layout.tsx.
    router.push("/profile");
  };

  const handleResetApp = () => {
    // Dev shortcut: wipe ALL persisted state (onboarding, progress,
    // annotations, preferences, check-ins, moments, focus —
    // in-memory + on disk) and drop the user back at the welcome
    // screen, mimicking a fresh install. Each provider's reset()
    // also calls removeKey() so AsyncStorage is purged.
    resetOnboarding();
    progress.reset();
    resetAnnotations();
    resetPreferences();
    resetCheckIns();
    resetReadingGoal();
    resetMoments();
    resetFocus();
    // Also cancel any scheduled "Before The Noise" notification so a
    // reset doesn't leave a stale OS-level schedule firing every
    // morning long after the user has wiped the app.
    cancelDailyReminder().catch(() => {});
    router.replace("/");
  };

  const handleRestartApp = () => {
    // Sibling of handleResetApp — clears state but jumps STRAIGHT into
    // the onboarding flow instead of stopping at the welcome screen.
    // Useful when iterating on onboarding copy/visuals without having
    // to tap through the welcome page every time.
    resetOnboarding();
    progress.reset();
    resetAnnotations();
    resetPreferences();
    resetCheckIns();
    resetReadingGoal();
    resetMoments();
    resetFocus();
    cancelDailyReminder().catch(() => {});
    router.replace("/onboarding/name");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        // Floating glass tab bar sits over the screen — pad the bottom
        // of the scroll so the last sections aren't hidden beneath it.
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Header ──────────────────────────────────────────────
            Single greeting line with the profile avatar tucked to
            the right. Imprint shows just a time-of-day greeting
            here — no date, no name — and lets the content below
            do the talking. */}
        <FadeIn delayMs={0} durationMs={700}>
          <View className="px-6 pt-2 flex-row items-center justify-between">
            <Text
              className="text-ink text-[28px] leading-[34px] tracking-[-0.4px]"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              {greeting}
            </Text>
            <Pressable
              hitSlop={12}
              onPress={handleOpenProfile}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              className="w-10 h-10 rounded-full bg-accent-soft border border-border items-center justify-center"
            >
              <Text
                className="text-primary text-[14px]"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </Pressable>
          </View>
        </FadeIn>

        {/* ─── Streak strip ─────────────────────────────────────────
            Imprint-style compact card: one contextual prompt on top
            and 7 day cells beneath, with today highlighted by an
            outlined pill. No mini rings, no flames, no tally — the
            strip is a single-glance "where I am in the week"
            anchor, nothing more. */}
        <FadeIn delayMs={80} durationMs={800}>
          <View className="px-6 mt-6">
            <WeekStrip
              days={weekDays}
              prompt={streakPrompt(streak)}
            />
          </View>
        </FadeIn>

        {/* ─── Reading-goal pill ───────────────────────────────────
            Sits directly beneath the streak strip so the user sees
            "how am I doing this week + how am I doing today" as a
            single stacked block, before the sermon hero takes over.
            Slim one-row pill: tiny iOS-blue activity ring + minutes
            label. Tap drills into /reading-goal for the full chart. */}
        <FadeIn delayMs={140} durationMs={800}>
          <View className="px-6 mt-4">
            <ReadingPill
              minutes={readingMinutes}
              goal={readingGoal}
              reached={readingGoalReached}
              onPress={() => router.push("/reading-goal")}
            />
          </View>
        </FadeIn>

        {/* ─── Focus mode toggle ───────────────────────────────────
            Lives right under the reading pill because both are
            "I'm choosing to be present" intent toggles. Three
            states, same row:
              • Off               — quiet pill, switch off
              • Enabled, no sess. — calm accent + brief sublabel
              • Session active    — alive blue + End button
            Tap the body anywhere to drill into settings/focus for
            the app picker; the inline Switch handles the quick
            on/off without leaving the home screen. */}
        <FadeIn delayMs={170} durationMs={800}>
          <View className="px-6 mt-2.5">
            <FocusToggle
              enabled={focusPrefs.enabled}
              sessionActive={focusSession !== null}
              blockedAppIds={focusSession?.blockedAppIds ?? focusPrefs.blockedAppIds}
              onToggle={setFocusEnabled}
              onEndSession={() => {
                endFocusSession().catch(() => {});
              }}
              onOpen={() => router.push("/settings/focus")}
            />
          </View>
        </FadeIn>

        {/* ─── Today's Sermon — the daily anchor ──────────────────
            The hero. Sits below the metrics block so it stays the
            "do this now" anchor without competing with the at-a-
            glance numbers above. Content pulled from the day's
            moment (assets/data/sermons.js via useMoments). */}
        <FadeIn delayMs={200} durationMs={900}>
          <View className="px-6 mt-5">
            <SermonCard
              type={sermonType}
              title={todaysMoment.title}
              // The subtitle slot is a quiet teaser — the type's
              // tagline ("A daily anchor in scripture", etc) works
              // here because the verse itself now lives on the
              // intro screen and shouldn't be doubled up at home.
              subtitle={sermonType.tagline}
              // Voice is the attributed speaker straight from the
              // catalog ("Matt Chandler", "Jackie Hill Perry", …).
              // SermonCard renders this as the avatar + name +
              // duration triplet when non-empty.
              pastor={todaysMoment.voice}
              durationMin={sermonDurationMin}
              completed={hasCompletedSermonToday}
              onPress={handlePlaySermon}
            />
          </View>
        </FadeIn>

        {/* ─── Last check-in (conditional) ────────────────────────
            Took the slot the old chapter-resume Continue-Reading
            card used to occupy. Surfaces the user's most recent
            mood log as a memory card — tap to revisit it (and its
            verse + journal) on the check-in detail screen. Hidden
            entirely until the user has logged at least one mood. */}
        {lastCheckIn && (
          <FadeIn delayMs={260} durationMs={800}>
            <View className="px-6 mt-4">
              <LastCheckInCard
                checkIn={lastCheckIn}
                onPress={handleOpenLastCheckIn}
              />
            </View>
          </FadeIn>
        )}

        {/* ─── Dev tools ────────────────────────────────────────────
            Gated behind __DEV__ so the entire subtree is stripped from
            production builds automatically.

              • Next Sermon — replaces today's moment with the next
                              one in the flat catalog (wraps at 85).
                              Lets a reviewer walk through every
                              moment end-to-end during content QA
                              without waiting for the daily rotation.
                              Counter on the right shows position
                              within the catalog.
              • Reset App   — clears state, lands at welcome screen.
              • Restart App — clears state, jumps straight into the
                              onboarding flow (skips welcome).
        */}
        {__DEV__ && (
          <FadeIn delayMs={1100} durationMs={700}>
            <View className="px-6 mt-12 items-center">
              <Text
                className="text-ink-subtle text-[10px] tracking-[3px] uppercase mb-3"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                Dev
              </Text>
              <View className="items-center mb-3">
                <NextSermonPill
                  position={catalogPosition.position}
                  total={catalogPosition.total}
                  onPress={advanceToNextMoment}
                />
              </View>
              {/* Preview-shield row. Lets a reviewer step through
                  each app's quiet message overlay without starting
                  a real focus session. Tapping cycles through the
                  catalog (1 → 2 → ... → 7 → wrap). */}
              <View className="items-center mb-3">
                <PreviewShieldPill
                  onPress={() => {
                    const currentIdx = previewAppId
                      ? SOCIAL_APPS.findIndex((a) => a.id === previewAppId)
                      : -1;
                    const nextIdx = (currentIdx + 1) % SOCIAL_APPS.length;
                    setPreviewAppId(SOCIAL_APPS[nextIdx]!.id);
                  }}
                />
              </View>
              <View className="flex-row items-center gap-3">
                <DevPill
                  icon={<ResetIcon />}
                  label="Reset App"
                  onPress={handleResetApp}
                />
                <DevPill
                  icon={<RestartIcon />}
                  label="Restart App"
                  onPress={handleRestartApp}
                />
              </View>
            </View>
          </FadeIn>
        )}
      </ScrollView>

      {/* ShieldOverlay — mounted at the SafeArea root so it covers
          the full screen + tab bar when visible. The Modal handles
          its own z-ordering. `previewAppId` is the single source
          of visibility — null hides the overlay, any string id
          shows it. */}
      <ShieldOverlay
        appId={previewAppId ?? "instagram"}
        visible={previewAppId !== null}
        onClose={() => setPreviewAppId(null)}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// ReadingPill — slim one-row reading-goal pulse
// ─────────────────────────────────────────────────────────────────

/**
 * Replaces the old big ReadingRingCard hero. A small inline
 * activity ring on the left, a single label + minutes line in the
 * middle, and a chevron on the right.
 *
 * Three states, same shape:
 *   • Untouched (0 min)  — quiet "Begin today's reading"
 *   • In progress        — accent-orange minutes, "X of Y min today"
 *   • Reached            — white minutes, "Reached today"
 *
 * The full detail screen (big ring + hourly bar chart + week
 * strip + edit goal) lives at /reading-goal; this pill is purely
 * a glance + tap-to-drill affordance on the home screen.
 */
function ReadingPill({
  minutes,
  goal,
  reached,
  onPress,
}: {
  minutes: number;
  goal: number;
  reached: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const pct = goal > 0 ? Math.min(1, minutes / goal) : 0;
  const remainingLabel = formatRemaining(minutes, goal, reached);
  // formatMinutes returns "4", "4:30", or "0:05" — never the raw
  // float that the underlying state stores (we track minutes as a
  // 1/60-precision number for second-by-second progress).
  const headline =
    minutes <= 0
      ? `${goal} min today`
      : `${formatMinutes(minutes)} of ${goal} min`;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Reading goal: ${headline}`}
      className="rounded-2xl border border-border bg-surface flex-row items-center px-4 py-3"
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <ActivityRing
        pct={pct}
        reached={reached}
        size={36}
        stroke={4}
        showTip={false}
      />
      <View className="flex-1 ml-3.5">
        <Text
          className="text-ink-subtle text-[10px] tracking-[2.5px] uppercase"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          Drawing Near
        </Text>
        {/* Headline on its own line + caption underneath. The previous
            row-with-baseline layout was crowding the long remaining
            copy ("9 minutes to today's goal.") next to the bold
            metric, which truncated awkwardly on narrow phones. */}
        <Text
          className="text-[15px] leading-[18px] tracking-[-0.2px] mt-0.5"
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: reached ? colors.ink : minutes > 0 ? RING_ACCENT : colors.ink,
          }}
          numberOfLines={1}
        >
          {headline}
        </Text>
        <Text
          className="text-ink-subtle text-[11.5px] mt-0.5"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          numberOfLines={1}
        >
          {remainingLabel}
        </Text>
      </View>
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
        <Path
          d="M9 6l6 6-6 6"
          stroke={colors.inkSubtle}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// SermonCard — the visual anchor of the home screen
// ─────────────────────────────────────────────────────────────────

type SermonCardProps = {
  type: SermonType;
  title: string;
  subtitle: string;
  pastor: string;
  durationMin: number;
  /** True once the user has finished today's sermon. Flips the card
   *  into a "Completed · Read again" state — same content, different
   *  affordance. */
  completed: boolean;
  onPress: () => void;
};

function SermonCard({
  type,
  title,
  subtitle,
  pastor,
  durationMin,
  completed,
  onPress,
}: SermonCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-3xl overflow-hidden border border-border bg-surface"
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      {/* Hero strip — the sermon type's icon with a per-type accent glow.
          The hero PNG bg matches bg-surface so it blends seamlessly. */}
      <View className="h-40 w-full overflow-hidden items-center justify-center">
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CardAccentGlow color={type.accent} />
        </View>

        <Image
          source={type.hero}
          style={{ width: 130, height: 110 }}
          resizeMode="contain"
        />

        <View className="absolute top-4 left-5">
          <Text
            className="text-[10px] tracking-[3px] uppercase"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: type.accent,
            }}
          >
            {type.name}
          </Text>
        </View>

        {/* Completed badge — top-right of the hero strip so it
            doesn't fight with the type label on the left. Hidden
            until the user actually finishes today's sermon. */}
        {completed && (
          <View className="absolute top-4 right-5">
            <CompletedBadge />
          </View>
        )}
      </View>

      {/* Body */}
      <View className="px-5 pt-5 pb-5">
        <Text
          className="text-ink text-[22px] leading-[28px] tracking-[-0.3px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {title}
        </Text>
        <Text
          className="text-ink-muted text-[14px] leading-[20px] mt-2"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          {subtitle}
        </Text>

        <View className="flex-row items-center justify-between mt-5">
          {/* Left-side meta. When a pastor IS attributed we render
              the avatar + name + duration triplet; when there's no
              pastor (current state — moments don't ship a pastor
              attribution) we fall back to a single, calmer
              duration chip so the row doesn't feel half-empty. */}
          <View className="flex-row items-center flex-1 pr-3">
            {pastor ? (
              <>
                <View className="w-7 h-7 rounded-full bg-accent-soft items-center justify-center mr-3">
                  <Text
                    className="text-primary text-[12px]"
                    style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                  >
                    {pastor
                      .split(" ")
                      .slice(-1)[0]
                      ?.charAt(0) ?? ""}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text
                    className="text-ink text-[13px]"
                    style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
                    numberOfLines={1}
                  >
                    {pastor}
                  </Text>
                  <Text
                    className="text-ink-subtle text-[12px] mt-0.5"
                    style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                  >
                    {completed
                      ? `Heard today · ${durationMin} min`
                      : `${durationMin} min listen`}
                  </Text>
                </View>
              </>
            ) : (
              <View className="flex-row items-center">
                <ClockGlyph />
                <Text
                  className="text-ink-muted text-[13px] ml-2"
                  style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
                >
                  {completed
                    ? `Heard today · ${durationMin} min`
                    : `${durationMin} min listen`}
                </Text>
              </View>
            )}
          </View>

          {completed ? <ReadAgainPill /> : <PlayPill />}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Pill-shaped "Completed" tag that appears in the corner of the
 * sermon hero once today's sermon has been finished. Subtle, calm —
 * gives recognition without celebration (the celebration screen
 * already handled that).
 */
function CompletedBadge() {
  const colors = useColors();
  return (
    <View
      className="flex-row items-center px-2.5 py-1 rounded-full border"
      style={{
        backgroundColor: withAlpha(colors.ink, 0.08),
        borderColor: withAlpha(colors.ink, 0.18),
      }}
    >
      <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
        <Path
          d="M5 12l5 5L20 7"
          stroke={colors.ink}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        className="text-ink text-[10px] tracking-[2px] uppercase ml-1.5"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        Heard
      </Text>
    </View>
  );
}

/**
 * "Read again" CTA — visually quieter than the primary PlayPill so
 * the completed state feels like a calm secondary action rather
 * than the bold first-listen invitation. Border + ghost background
 * instead of the white-on-black PlayPill.
 */
function ReadAgainPill() {
  const colors = useColors();
  return (
    <View
      className="rounded-full flex-row items-center pl-3 pr-4 py-2"
      style={{
        backgroundColor: colors.accentSoft,
        borderWidth: 1,
        borderColor: colors.borderStrong,
      }}
    >
      <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 9V4M4 9h5M20 15v5M20 15h-5"
          stroke={colors.ink}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M19 9a7 7 0 00-13-1M5 15a7 7 0 0013 1"
          stroke={colors.ink}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        className="text-ink text-[13px] ml-2"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        Read again
      </Text>
    </View>
  );
}

/**
 * Wide elliptical glow tinted to the sermon type's accent color.
 * Sits behind the hero in the card's top strip and gives each day's
 * card a unique mood without overwhelming the surrounding UI.
 */
function CardAccentGlow({ color }: { color: string }) {
  // The outermost stop fades to the active card surface so the glow
  // blends into the SermonCard's chrome cleanly in both themes
  // (otherwise a hardcoded dark stop would leave a charcoal halo
  // on a light card).
  const colors = useColors();
  return (
    <Svg width={360} height={180} viewBox="0 0 360 180">
      <Defs>
        <RadialGradient id="cardGlow" cx="50%" cy="50%" r="60%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <Stop offset="60%" stopColor={color} stopOpacity={0.04} />
          <Stop offset="100%" stopColor={colors.surface} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={360} height={180} fill="url(#cardGlow)" />
    </Svg>
  );
}

function PlayPill() {
  const colors = useColors();
  return (
    <View className="bg-primary rounded-full flex-row items-center pl-3 pr-4 py-2">
      <Svg width={12} height={12} viewBox="0 0 24 24" fill={colors.primaryFg}>
        <Path d="M6 4l14 8-14 8z" />
      </Svg>
      <Text
        className="text-primary-fg text-[13px] ml-2"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        Begin
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// WeekStrip — Imprint-style streak card
// ─────────────────────────────────────────────────────────────────

/**
 * One day's shape consumed by the WeekStrip. We only track whether
 * the day advanced the streak (= completed a sermon) — the visual
 * is intentionally narrow: prompt on top, seven dots below.
 */
type WeekDay = {
  dateISO: string;
  /** Did this day advance the streak (= completed a sermon). */
  engaged: boolean;
};

/**
 * Compact 7-day strip surfaced just under the greeting.
 *
 * Layout mirrors Imprint exactly:
 *
 *   ┌───────────────────────────────────────────┐
 *   │ Complete a sermon to start a streak       │
 *   │                                           │
 *   │ S   M   T   W   T   F   (S)               │
 *   │ ●   ●   ●   ●   ●   ●   ◐                 │
 *   └───────────────────────────────────────────┘
 *
 * • One contextual line on top.
 * • Seven cells with a weekday letter and a dot below.
 * • Today's letter+dot are wrapped in a subtle outlined pill so the
 *   "you are here" cue is unambiguous, regardless of engagement.
 * • Days that advanced the streak fill in (primary), otherwise the
 *   dot sits in a calm border color.
 */
function WeekStrip({
  days,
  prompt,
}: {
  days: ReadonlyArray<WeekDay>;
  prompt: string;
}) {
  return (
    <View className="rounded-2xl border border-border bg-surface px-5 py-4">
      <Text
        className="text-ink text-[13px] leading-[18px] text-center"
        style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
      >
        {prompt}
      </Text>
      <View className="flex-row justify-between mt-3">
        {days.map((day, i) => (
          <DayDot
            key={day.dateISO}
            dateISO={day.dateISO}
            engaged={day.engaged}
            isToday={i === days.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

/**
 * One day cell: a weekday letter and a dot stacked vertically. The
 * cell always reserves the same border thickness (1.5pt) so that
 * showing or hiding the today-outline never shifts the row's
 * vertical rhythm.
 */
function DayDot({
  dateISO,
  engaged,
  isToday,
}: {
  dateISO: string;
  engaged: boolean;
  isToday: boolean;
}) {
  const colors = useColors();
  // Parse the ISO date as a local date — never `new Date(iso)`,
  // which would interpret it as UTC and roll over a day for users
  // west of GMT.
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d ?? 1);
  const weekday = ["S", "M", "T", "W", "T", "F", "S"][date.getDay()];

  let dotBg: string = colors.border;
  let dotBorder: string | undefined;
  if (engaged) {
    dotBg = colors.primary;
  } else if (isToday) {
    dotBg = "transparent";
    dotBorder = colors.primary;
  }

  return (
    <View
      style={{
        borderWidth: 1.5,
        borderColor: isToday ? colors.primary : "transparent",
        borderRadius: 14,
        paddingHorizontal: 5,
        paddingVertical: 4,
        alignItems: "center",
      }}
    >
      <Text
        className={`text-[11px] tracking-[0.5px] ${
          isToday ? "text-primary" : "text-ink-muted"
        }`}
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {weekday}
      </Text>
      <View
        style={{
          marginTop: 6,
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: dotBg,
          borderWidth: dotBorder ? 1.5 : 0,
          borderColor: dotBorder,
        }}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

function ResetIcon() {
  const colors = useColors();
  // Circular arrow — a refresh / reset glyph.
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4v6h6"
        stroke={colors.inkMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 20v-6h-6"
        stroke={colors.inkMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 10a8 8 0 0114-3.5L20 10M20 14a8 8 0 01-14 3.5L4 14"
        stroke={colors.inkMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RestartIcon() {
  const colors = useColors();
  // Classic power-button glyph — universally understood as "restart".
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v9"
        stroke={colors.inkMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M7 7a7 7 0 1 0 10 0"
        stroke={colors.inkMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/**
 * Small ghost pill used by the __DEV__ tools row. Keeping it as its
 * own component so Reset / Restart (and any future dev shortcuts)
 * stay visually consistent without copy-paste.
 */
function DevPill({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      hitSlop={12}
      onPress={onPress}
      className="flex-row items-center px-4 py-3 rounded-full border border-border bg-surface"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {icon}
      <Text
        className="text-ink-muted text-[13px] ml-2"
        style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Dedicated "Next Sermon" pill — same ghost styling as DevPill but
 * a touch wider so it can carry both the action label and a quiet
 * "N / TOTAL" counter on the right. Lives on its own row above
 * Reset / Restart so the counter has breathing room and isn't
 * competing with two other pills on a narrow phone.
 */
function NextSermonPill({
  position,
  total,
  onPress,
}: {
  position: number;
  total: number;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      hitSlop={12}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Advance to next sermon. Currently on ${position} of ${total}.`}
      className="flex-row items-center px-4 py-3 rounded-full border border-border bg-surface"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      {/* Forward-arrow glyph — same visual family as ResetIcon /
          RestartIcon so the three pills read as one tool family. */}
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path
          d="M5 12h14M13 6l6 6-6 6"
          stroke={colors.inkMuted}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        className="text-ink-muted text-[13px] ml-2"
        style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
      >
        Next Sermon
      </Text>
      {/* Small subtle counter chip — uses inkSubtle so it reads as
          metadata, not as the action itself. */}
      <Text
        className="text-ink-subtle text-[11.5px] ml-2.5 tracking-[1px] uppercase"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {position} / {total}
      </Text>
    </Pressable>
  );
}

/**
 * Compact clock glyph used by the SermonCard duration chip when no
 * pastor is attributed — replaces the pastor avatar so the meta
 * row still has a small left-side mark instead of just floating
 * text against the play button.
 */
function ClockGlyph() {
  const colors = useColors();
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
        stroke={colors.inkMuted}
        strokeWidth={1.6}
      />
      <Path
        d="M12 7v5l3 2"
        stroke={colors.inkMuted}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// FocusToggle — home-screen focus-mode pill
//
// Three visual states, all in the same row silhouette so the layout
// rhythm of the home screen never shifts:
//
//   1. Off            — quiet ghost pill, switch off, ChevronIcon
//                       drills to /settings/focus
//   2. Enabled, idle  — accent shield chip + "Focus mode" + sublabel
//                       summarizing the blocked-app set, switch on
//   3. Session active — alive blue chip + "Active" eyebrow, sublabel
//                       summarizing what's being quieted, trailing
//                       "End" pill in place of the chevron (no switch
//                       — turning the master toggle off mid-session
//                       would be confusing; user ends the session
//                       explicitly from here or the in-sermon banner)
//
// Tap the body anywhere → router.push("/settings/focus"). The body
// tap is separate from the trailing Switch press so users can
// flip the master toggle without leaving the home screen.
// ─────────────────────────────────────────────────────────────────

/** Same iOS-system-blue the in-sermon banner uses, so the home
 *  toggle and the in-flight banner read as the same feature. */
const FOCUS_ACCENT = "#0A84FF";

function FocusToggle({
  enabled,
  sessionActive,
  blockedAppIds,
  onToggle,
  onEndSession,
  onOpen,
}: {
  enabled: boolean;
  sessionActive: boolean;
  blockedAppIds: ReadonlyArray<string>;
  onToggle: (next: boolean) => void;
  onEndSession: () => void;
  onOpen: () => void;
}) {
  const colors = useColors();

  // Compose the sublabel based on the current state.
  let eyebrow = "Focus mode";
  let sublabel: string;
  if (sessionActive) {
    eyebrow = "Focus mode active";
    sublabel = summarizeBlockedApps(blockedAppIds);
  } else if (enabled) {
    sublabel = `On · ${summarizeBlockedApps(blockedAppIds)}`;
  } else {
    sublabel = "Quiet the noise while you read";
  }

  // Chip background — three tiers of intensity matching the row's
  // state. The active session gets the boldest fill; the idle-on
  // state gets a soft wash; off uses the calm accent-soft surface
  // so the whole row reads "muted but present".
  const chipBg = sessionActive
    ? FOCUS_ACCENT
    : enabled
      ? withAlpha(FOCUS_ACCENT, 0.18)
      : colors.accentSoft;
  const chipFg = sessionActive ? "#FFFFFF" : FOCUS_ACCENT;

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${eyebrow}. ${sublabel}. Tap to open focus settings.`}
      className="rounded-2xl border border-border bg-surface flex-row items-center px-4 py-3"
      style={({ pressed }) => ({
        opacity: pressed ? 0.92 : 1,
        // Subtle accent border tint when a session is active so the
        // row visually "lights up" without competing with the
        // sermon hero below it.
        borderColor: sessionActive
          ? withAlpha(FOCUS_ACCENT, 0.4)
          : colors.border,
      })}
    >
      {/* Leading shield chip. The chip color carries the state —
          the rest of the row stays calm. */}
      <View
        className="w-9 h-9 rounded-xl items-center justify-center mr-3"
        style={{ backgroundColor: chipBg }}
      >
        <ShieldGlyph stroke={chipFg} />
      </View>

      <View className="flex-1 pr-3">
        <Text
          className={
            sessionActive
              ? "text-[10px] tracking-[2.5px] uppercase"
              : "text-ink-subtle text-[10px] tracking-[2.5px] uppercase"
          }
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            // Active state gets a tinted eyebrow so the "live"
            // status reads at a glance. Off / idle-on stay in the
            // standard subtle ink for consistency with the
            // Drawing-Near pill above.
            color: sessionActive ? FOCUS_ACCENT : colors.inkSubtle,
          }}
        >
          {eyebrow}
        </Text>
        <Text
          className="text-ink text-[14.5px] mt-0.5"
          style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
          numberOfLines={1}
        >
          {sublabel}
        </Text>
      </View>

      {sessionActive ? (
        // Trailing "End" pill, replacing the Switch during an
        // active session. Tap halts the session immediately — the
        // FocusBanner inside the sermon flow has the same
        // affordance with a confirm step; from home we keep the
        // tap unconfirmed since the user is intentionally NOT
        // mid-sermon and clearly wants out.
        <Pressable
          onPress={(e) => {
            e.stopPropagation?.();
            onEndSession();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="End focus session"
          className="rounded-full px-3.5 py-1.5"
          style={({ pressed }) => ({
            backgroundColor: withAlpha(colors.ink, 0.08),
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            className="text-[12px] tracking-[0.5px]"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.ink,
            }}
          >
            End
          </Text>
        </Pressable>
      ) : (
        // Inline Switch — the easy-toggle the user asked for. The
        // onValueChange runs without bubbling to the row's onPress
        // because RN's Switch swallows its tap events.
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{
            false: withAlpha(colors.ink, 0.1),
            true: FOCUS_ACCENT,
          }}
          thumbColor="#F4F4F5"
          ios_backgroundColor={withAlpha(colors.ink, 0.08)}
        />
      )}
    </Pressable>
  );
}

function ShieldGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
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

// ─────────────────────────────────────────────────────────────────
// PreviewShieldPill — dev tool for cycling through quiet-message
//                     overlays without starting a real focus session
// ─────────────────────────────────────────────────────────────────

function PreviewShieldPill({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      hitSlop={12}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Preview the next app's shield overlay"
      className="flex-row items-center px-4 py-3 rounded-full border border-border bg-surface"
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3l8 3v6c0 4-3 7-8 9-5-2-8-5-8-9V6l8-3z"
          stroke={colors.inkMuted}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        className="text-ink-muted text-[13px] ml-2"
        style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
      >
        Preview Shield
      </Text>
      <Text
        className="text-ink-subtle text-[11.5px] ml-2.5 tracking-[1px] uppercase"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        Next App
      </Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// LastCheckInCard
//
// Quiet recap pointing at the user's most recent mood check-in.
// Shape: a swatch bar tinted to the mood's accent (mirrors the
// mood color story used in the verse-delivery screen + check-in
// detail page), the mood label as the title, the verse reference
// beneath as the supporting line, and a chevron — same silhouette
// as the old ContinueReadingCard so the home screen layout stays
// rhythmically familiar.
// ─────────────────────────────────────────────────────────────────

function LastCheckInCard({
  checkIn,
  onPress,
}: {
  checkIn: CheckIn;
  onPress: () => void;
}) {
  const colors = useColors();
  // findMood can fail if the catalog dropped this mood id between
  // saves; fall back to the brand accent + a kind label so the
  // card still renders without a broken left bar.
  const mood = findMood(checkIn.moodId);
  const accent = mood?.swatch ?? colors.primary;
  const moodLabel = mood?.label ?? "Check-in";
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Last check-in: ${moodLabel}, ${checkIn.verse.reference}`}
      className="rounded-2xl border border-border bg-surface overflow-hidden flex-row items-stretch"
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      {/* Vertical bar — tinted to the mood swatch. Same role as the
          old card's primary spine, but tied to the moment's feeling
          instead of the brand. */}
      <View style={{ width: 4, backgroundColor: accent }} />
      <View className="flex-1 px-5 py-4">
        <Text
          className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          Last check in
        </Text>
        <Text
          className="text-ink text-[17px] mt-1 tracking-[-0.2px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          numberOfLines={1}
        >
          {moodLabel}
        </Text>
        <Text
          className="text-ink-muted text-[12.5px] mt-1.5"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          numberOfLines={1}
        >
          {checkIn.verse.reference}
        </Text>
      </View>
      <View className="pr-5 items-center justify-center">
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 6l6 6-6 6"
            stroke={colors.ink}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Compose an alpha into a `#RRGGBB` hex string. Used by the
 * Completed badge to derive a translucent backdrop/border from the
 * active ink color (so the badge keeps its glassy feel in both
 * themes instead of being locked to white).
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

function getGreeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Peace to you";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  if (h < 21) return "Good evening";
  return "Peace to you";
}

/**
 * One-line prompt for the streak strip — direct, never shaming.
 * Matches the "Complete a Lesson to Start a Streak" energy from
 * Imprint's home: tells the user what's true right now and what
 * the next step is, in a single sentence.
 */
function streakPrompt(streak: {
  current: number;
  longest: number;
  honoredToday: boolean;
}): string {
  if (streak.current === 0) {
    return "Complete today's sermon to start a streak";
  }
  if (!streak.honoredToday) {
    return `${streak.current}-day streak — today is still waiting`;
  }
  if (streak.current === 1) {
    return "Day one — keep showing up tomorrow";
  }
  if (streak.current === streak.longest && streak.current > 2) {
    return `${streak.current}-day streak — a new personal best`;
  }
  return `${streak.current}-day streak — honored today`;
}
