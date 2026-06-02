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
import { SOCIAL_APPS } from "@/lib/focus";
import { BrandGlyph } from "@/components/BrandGlyph";
import { findMood } from "@/constants/moods";
import { type SermonType } from "@/constants/sermonTypes";
import { useAnnotations } from "@/state/annotations";
import { type CheckIn, useCheckIns } from "@/state/checkIns";
import { useFocus } from "@/state/focus";
import { useMoments } from "@/state/moments";
import { useOnboarding } from "@/state/onboarding";
import { usePreferences } from "@/state/preferences";
import { useProgress } from "@/state/progress";
import { type StudySession, useStudySessions } from "@/state/studySessions";
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
    startSession: startFocusSession,
    endSession: endFocusSession,
    reset: resetFocus,
  } = useFocus();
  const { sessions: studySessions, reset: resetStudySessions } =
    useStudySessions();

  // Routines that are CURRENTLY participating in focus mode. The
  // home pill mentions them by name so the user can see, at a
  // glance, what's driving focus — answering "okay, the toggle is
  // on, but on for WHAT?" Two predicates must both hold:
  //   • session.enabled       — the user hasn't paused it on Practice
  //   • session.useFocusMode  — the per-session focus opt-in is on
  // We deliberately don't gate on focusPrefs.enabled here: the home
  // pill itself reflects that flag separately, and we want to keep
  // showing the routine names even while the master is off so the
  // user understands which sessions WILL light up when they flip
  // the switch back on.
  // ─── Featured routine for the home Routine card ─────────────
  //
  // The card picks ONE thing to feature, in priority order:
  //
  //   1. If a focus session is currently running and it was launched
  //      from a routine, feature THAT routine — it's by far the most
  //      relevant context.
  //   2. Otherwise, the single soonest-firing enabled study session
  //      (regardless of whether the routine opted into focus mode).
  //      This is the fix for the "I enabled Morning Study and
  //      nothing shows on home" bug — we surface ANY enabled
  //      session, not just the focus-opted subset.
  //   3. Otherwise, no routine — the card collapses to a calm
  //      "Focus mode" tagline with just the master Switch.
  //
  // The `subtitle` slot composes the human-readable status string
  // (e.g. "Active now" / "Tomorrow 7:15 AM" / "Paused · Tomorrow
  // 7:15 AM" / "Quiet the noise while you read") so the card body
  // doesn't have to re-derive it from raw state. `apps` is the
  // app-icon list to render inline — either the running session's
  // snapshot, the routine's own per-routine list, or the global
  // focus-prefs list as a last resort.
  const featured = useMemo(() => {
    const now = new Date();
    const masterOn = focusPrefs.enabled;
    const sessionOn = focusSession !== null;

    // Helper: format a date the way the human eye expects it on a
    // home card — Today / Tomorrow / weekday name, plus 12-hour clock.
    const formatWhen = (when: Date): string => {
      const time = format12h({
        hour: when.getHours(),
        minute: when.getMinutes(),
      });
      const sameDay = when.toDateString() === now.toDateString();
      if (sameDay) return `Today ${time}`;
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      if (when.toDateString() === tomorrow.toDateString()) {
        return `Tomorrow ${time}`;
      }
      const dayName = when.toLocaleDateString("en-US", { weekday: "long" });
      return `${dayName} ${time}`;
    };

    // 1) Active session from a known routine — the most informative
    //    state we can show, full stop. Apps come from the session
    //    snapshot (not the routine's current settings) because the
    //    user is in-flight and we shouldn't lie about what's
    //    currently silenced.
    if (sessionOn && focusSession?.routineId) {
      const activeRoutine = studySessions.find(
        (s) => s.id === focusSession.routineId,
      );
      if (activeRoutine) {
        return {
          routine: activeRoutine,
          subtitle: "Focus mode is on now",
          apps: focusSession.blockedAppIds as ReadonlyArray<string>,
          isActive: true as const,
        };
      }
    }

    // 2) Active session without a known routine — still show the
    //    active state, but use the generic "Focus mode" title since
    //    there's no routine to name. Apps from the session snapshot.
    if (sessionOn && focusSession) {
      return {
        routine: null,
        subtitle: "Focus mode is on now",
        apps: focusSession.blockedAppIds as ReadonlyArray<string>,
        isActive: true as const,
      };
    }

    // 3) An enabled study session — feature the soonest upcoming one.
    //    Title = routine name. Subtitle depends on master toggle:
    //    "Tomorrow 7:15 AM" when armed; "Paused · Tomorrow 7:15 AM"
    //    when the master is off (matches Practice tab's PAUSED badge).
    let best: { session: StudySession; when: Date } | null = null;
    for (const s of studySessions) {
      if (!s.enabled) continue;
      const when = computeNextOccurrence(s.time, s.daysOfWeek, now);
      if (!when) continue;
      if (!best || when.getTime() < best.when.getTime()) {
        best = { session: s, when };
      }
    }
    if (best) {
      const whenLabel = formatWhen(best.when);
      const focusOptedIn = best.session.useFocusMode;
      const paused = focusOptedIn && !masterOn;
      // Prefer the routine's own per-routine block list when the
      // routine has focus opted in (that's what would silence on
      // start). Fall back to the global focus prefs list so the
      // user always sees something concrete even for "reminder-only"
      // routines that don't carry their own list.
      const appsToShow = focusOptedIn
        ? best.session.blockedAppIds
        : focusPrefs.blockedAppIds;
      return {
        routine: best.session,
        subtitle: paused ? `Paused · ${whenLabel}` : whenLabel,
        apps: appsToShow as ReadonlyArray<string>,
        isActive: false as const,
      };
    }

    // 4) No routines configured — the card is just the master toggle
    //    with its calm marketing line.
    return {
      routine: null,
      subtitle: masterOn
        ? "On · Apps will be quieted during focus"
        : "Quiet the noise while you read",
      apps: focusPrefs.blockedAppIds as ReadonlyArray<string>,
      isActive: false as const,
    };
  }, [
    focusPrefs.enabled,
    focusPrefs.blockedAppIds,
    focusSession,
    studySessions,
  ]);

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
    // resetStudySessions also cancels every OS-level study
    // notification before clearing the persisted list, so the
    // wipe doesn't leave stale weekly reminders armed in the OS.
    resetStudySessions().catch(() => {});
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
    resetStudySessions().catch(() => {});
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
            do the talking.

            (Historical note: this header used to look "glitched" on
            top of the greeting — turned out to be the global focus
            banner from app/(tabs)/_layout.tsx rendering on top of
            the Today screen, NOT a font/animation issue. The banner's
            shouldHideForSegments check now correctly excludes the
            Today route; the greeting is back to a straightforward
            heading style.) */}
        {/* The avatar sits on the LEFT so it's spatially consistent
            with the profile drawer it opens — the drawer slides in
            from the left edge of the screen, so tapping a left-edge
            chip and watching a left-edge panel slide out reads as
            one continuous gesture. (Previously the avatar was
            top-right but the drawer was top-left, which made the
            two feel disconnected — tapping right, then the left
            half of the screen animates.) */}
        <View className="px-6 pt-2 flex-row items-center">
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
          <Text
            className="flex-1 ml-3 text-ink text-[28px] leading-[36px] tracking-[-0.4px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            numberOfLines={1}
          >
            {greeting}
          </Text>
        </View>

        {/* ─── Today's Sermon — the hero ──────────────────────────
            Promoted to the FIRST big element below the header. The
            sermon is the soul of Closer; everything else on home is
            supporting context. Opal puts its Now Playing card here
            for the same reason — the hero answers "what should I
            do right now?" before the user has to scan or scroll.

            (Historical note: this card used to sit fifth in the
            stack, behind the streak strip, reading pill, and
            routine card. Promoting it removes three small chips
            from the user's path-to-engagement; the supporting
            sections drop below the timeline.) */}
        <FadeIn delayMs={80} durationMs={900}>
          <View className="px-6 mt-4">
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

        {/* ─── Today's rhythm — the timeline ──────────────────────
            Chronological view of every scheduled moment the user
            has set up for today: the sermon arrival, every enabled
            study-session routine that fires today, anchors, etc.
            Each row carries a status (Done / Now / Upcoming) so
            the user reads the day as a continuous rhythm rather
            than a pile of unrelated cards.

            This is the section the new system-routine seeding
            (onboarding's sermon time + Bible study time) and the
            template-card flow both feed into — adding a routine
            on Practice immediately surfaces here. */}
        <FadeIn delayMs={140} durationMs={800}>
          <View className="mt-6">
            <TodayRhythm
              sermonTime={answers.dailyReminderTime}
              sermonName={todaysMoment.title}
              sermonCompleted={hasCompletedSermonToday}
              onSermonPress={handlePlaySermon}
              studySessions={studySessions}
              activeFocusSession={focusSession}
            />
          </View>
        </FadeIn>

        {/* ─── Streak strip ─────────────────────────────────────────
            Imprint-style compact card: one contextual prompt on top
            and 7 day cells beneath, with today highlighted by an
            outlined pill. Demoted to a supporting strip under the
            hero + timeline. */}
        <FadeIn delayMs={200} durationMs={800}>
          <View className="px-6 mt-6">
            <WeekStrip
              days={weekDays}
              prompt={streakPrompt(streak)}
            />
          </View>
        </FadeIn>

        {/* ─── Reading-goal pill ───────────────────────────────────
            Slim one-row pill: tiny iOS-blue activity ring + minutes
            label. Tap drills into /reading-goal for the full chart. */}
        <FadeIn delayMs={240} durationMs={800}>
          <View className="px-6 mt-4">
            <ReadingPill
              minutes={readingMinutes}
              goal={readingGoal}
              reached={readingGoalReached}
              onPress={() => router.push("/reading-goal")}
            />
          </View>
        </FadeIn>

        {/* ─── Routine / Focus card ────────────────────────────────
            Master toggle + featured routine. Demoted to support row
            since the timeline above now surfaces every scheduled
            routine; this card still owns the master-switch
            controller affordance, which the timeline doesn't. */}
        <FadeIn delayMs={280} durationMs={800}>
          <View className="px-6 mt-2.5">
            <RoutineCard
              masterEnabled={focusPrefs.enabled}
              sessionActive={focusSession !== null}
              featured={featured}
              onToggle={setFocusEnabled}
              onEndSession={() => {
                endFocusSession().catch(() => {});
              }}
              onOpen={() => {
                // Tap routes to where the user expects: the routine
                // editor when there's a routine to manage, the
                // global focus settings otherwise. Same shape Opal
                // uses (tap My Apps card → the app picker).
                if (featured.routine) {
                  router.push("/(tabs)/journey");
                } else {
                  router.push("/settings/focus");
                }
              }}
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
          <FadeIn delayMs={320} durationMs={800}>
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
              {/* Toggle a real focus SESSION without going through
                  the sermon Begin flow. The session uses the
                  current pref's blocked-app set + today's moment
                  day. Lets the reviewer verify the FocusMiniPlayer
                  appears on every tab + the book reader + settings
                  without having to walk through a full sermon each
                  time. End-state shows "End focus session" so the
                  pill doubles as a quick teardown affordance. */}
              <View className="items-center mb-3">
                <DevSessionPill
                  active={!!focusSession}
                  onPress={() => {
                    if (focusSession) {
                      endFocusSession().catch(() => {});
                    } else {
                      // Auto-enable focus before starting if the
                      // master toggle is off — otherwise the
                      // session would be silently dropped at
                      // surface time (the in-sermon banner and
                      // global banner both gate on session, but
                      // the user might be testing without
                      // having flipped the master switch yet).
                      if (!focusPrefs.enabled) {
                        setFocusEnabled(true);
                      }
                      startFocusSession(todaysMoment.day).catch(
                        () => {},
                      );
                    }
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
 *   • Untouched (0 min)  — quiet "X min today"
 *   • In progress        — accent-orange minutes, "X of Y min" + remaining caption
 *   • Reached            — bold "Completed" headline + "Read for X today"
 *     subline. Once the goal is honored we deliberately stop showing
 *     a "X of 10 min" counter that would otherwise read like
 *     "49:40 of 10 min" — confusing (the goal is 10, not 49) and
 *     guilt-shaped (rewarding overshooting a daily target works
 *     against the slow-and-quiet rhythm Closer aims for). The
 *     actual time spent is still visible in the subline so the user
 *     can see their day at a glance, and the full hourly breakdown
 *     is one tap away on /reading-goal.
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
  // Headline branches on three states. Reached takes precedence —
  // we don't want "49:40 of 10 min" or any "X of Y" formulation
  // once the user has crossed the threshold.
  // formatMinutes returns "4", "4:30", or "0:05" — never the raw
  // float that the underlying state stores (we track minutes as a
  // 1/60-precision number for second-by-second progress).
  const headline = reached
    ? "Completed"
    : minutes <= 0
      ? `${goal} min today`
      : `${formatMinutes(minutes)} of ${goal} min`;
  // Caption mirrors the headline split: when reached, surface the
  // total time invested so the user gets a small breakdown right on
  // the home screen (the full detail screen has the hourly chart
  // and 7-day rhythm strip). Otherwise show the existing "X minutes
  // to today's goal" / "Spend Y minutes near scripture" copy.
  const remainingLabel = reached
    ? `Read for ${formatMinutes(minutes)} today`
    : formatRemaining(minutes, goal, reached);

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
          The hero PNG bg matches bg-surface so it blends seamlessly.

          Layout: the eyebrow row (type name + optional completed badge)
          owns the top 36pt of the strip in normal flow. The illustration
          + accent glow live in the flex-1 remainder, centered. This
          replaces an older absolute-positioned eyebrow that visually
          collided with the top of the hero PNG when the illustration's
          opaque ink extended close to the upper edge (clearly visible
          on the Daily Church sun-arch). Keeping the eyebrow in flow
          guarantees consistent clearance regardless of which type's
          hero is rendered. */}
      {/* Hero strip — promoted to 200pt (was 176pt) so the
          illustration commands more visual weight when the card
          is the home page hero rather than a mid-stack card. The
          eyebrow row keeps the same 36pt vertical claim so the
          extra height all goes to the illustration + glow. */}
      <View className="h-[200px] w-full overflow-hidden">
        <View className="px-5 pt-4 flex-row items-center justify-between">
          <Text
            className="text-[10px] tracking-[3px] uppercase"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: type.accent,
            }}
          >
            {type.name}
          </Text>
          {/* Completed badge — sits at the eyebrow's right edge so
              the row reads as a single header band rather than two
              floating chips above the hero. Hidden until the user
              actually finishes today's sermon. */}
          {completed ? <CompletedBadge /> : null}
        </View>

        <View className="flex-1 items-center justify-center relative">
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

          {/* Illustration sized to 150x128 (was 130x110) — proportional
              bump to match the taller hero. Heavy-enough that the
              illustration carries the eye when the user lands on the
              screen. */}
          <Image
            source={type.hero}
            style={{ width: 150, height: 128 }}
            resizeMode="contain"
          />
        </View>
      </View>

      {/* Body — title bumped to 25px (was 22px) so the sermon's name
          reads as the focal text in the upper third of the page.
          Subtitle and meta row unchanged. */}
      <View className="px-5 pt-5 pb-5">
        <Text
          className="text-ink text-[25px] leading-[31px] tracking-[-0.4px]"
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
// RoutineCard — Opal-inspired home card
//
// One consolidated card that replaces what used to be the Focus
// pill + a separate "Up next" routine card. Inspired by Opal's My
// Apps panel: a routine name as the title, a one-line context
// sublabel, and the actual blocked-app icons rendered inline so
// the user can see at a glance what will be quieted.
//
// All the state composition (which routine, which subtitle, which
// apps) lives in the `featured` memo in TodayScreen — this
// component is intentionally dumb, taking a single shape and
// rendering the right variant. That keeps the test for "is the
// home screen reflecting my routine?" trivial: it's a memo, not a
// component-tree puzzle.
//
// Visual rhythm:
//   • Header row: 36-pt shield chip · routine name · trailing
//     control (Switch when off/armed, End pill when active)
//   • Subtitle row: contextual one-liner ("Tomorrow 7:15 AM" /
//     "Paused · Tomorrow 7:15 AM" / "Focus mode is on now")
//   • Apps row (optional): real brand glyphs in a tight stack
//     followed by a count, only rendered when there's at least
//     one app to show
//
// Critical UX rule that the prior FocusToggle violated: the
// trailing Switch is a sibling of (NOT a child of) the tap-to-
// open Pressable. Earlier nested shapes caused parent-onPress to
// fire on Switch flips, silently navigating users off-screen.
// ─────────────────────────────────────────────────────────────────

/** Same iOS-system-blue the in-sermon banner uses, so the home
 *  toggle and the in-flight banner read as the same feature. */
const FOCUS_ACCENT = "#0A84FF";

/** Shape the home screen feeds to the card. Pre-composed in the
 *  parent so this component never has to think about which
 *  routine to feature or what to call its state — just renders
 *  the variant. `isActive` is the strongest signal: when true the
 *  card swaps the Switch for an End pill and tints the chip live. */
type RoutineCardFeatured = {
  /** The routine to name in the title, or null when none exists. */
  routine: { name: string } | null;
  /** Contextual one-liner — "Tomorrow 7:15 AM" / "Paused · ..." /
   *  "Focus mode is on now" / off-state marketing tagline. */
  subtitle: string;
  /** Apps to render as the inline glyph stack. Pass [] to hide
   *  the apps row entirely (used when both prefs and routine
   *  have an empty block list). */
  apps: ReadonlyArray<string>;
  /** True when a focus session is currently running. Drives the
   *  active-state color tier and swaps Switch → End pill. */
  isActive: boolean;
};

function RoutineCard({
  masterEnabled,
  sessionActive,
  featured,
  onToggle,
  onEndSession,
  onOpen,
}: {
  masterEnabled: boolean;
  sessionActive: boolean;
  featured: RoutineCardFeatured;
  onToggle: (next: boolean) => void;
  onEndSession: () => void;
  onOpen: () => void;
}) {
  const colors = useColors();

  const title = featured.routine?.name?.trim() || "Focus mode";
  const hasApps = featured.apps.length > 0;

  // Three intensity tiers for the shield chip and the card border.
  // Active sessions get the bold fill so the home screen visibly
  // "lights up" while focus is engaged; armed (master on, no
  // session) gets a soft tint; off uses the calm accent-soft
  // surface so the row stays present without competing with the
  // sermon hero below.
  const chipBg = sessionActive
    ? FOCUS_ACCENT
    : masterEnabled
      ? withAlpha(FOCUS_ACCENT, 0.18)
      : colors.accentSoft;
  const chipFg = sessionActive ? "#FFFFFF" : FOCUS_ACCENT;
  const borderColor = sessionActive
    ? withAlpha(FOCUS_ACCENT, 0.4)
    : colors.border;

  return (
    <View
      className="rounded-2xl border bg-surface px-4 py-3.5"
      style={{ borderColor }}
    >
      {/* Header row — title + trailing control. */}
      <View className="flex-row items-center">
        <Pressable
          onPress={onOpen}
          accessibilityRole="button"
          accessibilityLabel={`${title}. ${featured.subtitle}. Tap to manage.`}
          className="flex-1 flex-row items-center pr-3"
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
          <View
            className="w-9 h-9 rounded-xl items-center justify-center mr-3"
            style={{ backgroundColor: chipBg }}
          >
            <ShieldGlyph stroke={chipFg} />
          </View>
          <View className="flex-1">
            <Text
              className="text-ink text-[16px] tracking-[-0.2px]"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              className="text-ink-muted text-[12.5px] mt-0.5"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              numberOfLines={1}
            >
              {featured.subtitle}
            </Text>
          </View>
        </Pressable>
        {sessionActive ? (
          // End pill replaces the Switch while a session is
          // running. Tap halts immediately — the FocusBanner inside
          // the sermon flow asks for confirmation; from home we
          // assume intent (the user is explicitly not in a sermon).
          <Pressable
            onPress={onEndSession}
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
          <Switch
            value={masterEnabled}
            onValueChange={onToggle}
            trackColor={{
              false: withAlpha(colors.ink, 0.1),
              true: FOCUS_ACCENT,
            }}
            thumbColor="#F4F4F5"
            ios_backgroundColor={withAlpha(colors.ink, 0.08)}
          />
        )}
      </View>

      {/* Apps row — Opal-style "here's what will be quieted" preview.
          Rendered as real brand glyphs so the user reads "Instagram,
          TikTok, YouTube" instantly without having to parse a comma-
          separated string. Sits below the header with a calm divider
          so the two regions read as related but distinct: identity
          on top, what-it-affects below. Hidden when there are no
          apps at all — there's nothing to show, and the divider
          alone would feel like a half-finished card. */}
      {hasApps && (
        <View
          className="mt-3 pt-3 flex-row items-center"
          style={{
            borderTopWidth: 1,
            borderTopColor: withAlpha(colors.ink, 0.08),
          }}
        >
          <AppGlyphStack ids={featured.apps} maxVisible={5} />
          <Text
            className="text-ink-muted text-[12.5px] ml-3 flex-1"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            numberOfLines={1}
          >
            {featured.apps.length === 1
              ? "1 app quieted"
              : `${featured.apps.length} apps quieted`}
          </Text>
        </View>
      )}
    </View>
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
// AppGlyphStack — overlapping brand-chip preview of blocked apps
//
// Render the first `maxVisible` brand glyphs in a slight horizontal
// overlap (iOS Contact-style avatar stack) so the row reads as
// "here are the apps that'll be quiet" at a glance. Extra apps
// beyond the cap collapse into a final "+N" chip in neutral tones.
//
// Sized to "sm" (32pt chips) to give the home routine card the
// chunkier, more recognizable feel of Opal's My Apps panel — the
// xs preset was too small for the icons to read instantly. The
// overlap pulls the row back to a comfortable width while keeping
// the glyphs legible.
// ─────────────────────────────────────────────────────────────────

const APP_GLYPH_CHIP = 32;
const APP_GLYPH_OVERLAP = 10;

function AppGlyphStack({
  ids,
  maxVisible,
}: {
  ids: ReadonlyArray<string>;
  maxVisible: number;
}) {
  const colors = useColors();
  const visible = ids.slice(0, maxVisible);
  const overflow = Math.max(0, ids.length - visible.length);

  if (ids.length === 0) return null;

  return (
    <View className="flex-row items-center">
      {visible.map((id, i) => (
        <View
          key={id}
          style={{
            // Pull each subsequent chip back over the previous one
            // — tight enough to read as a stack, loose enough that
            // the brand glyph inside each chip stays legible.
            marginLeft: i === 0 ? 0 : -APP_GLYPH_OVERLAP,
            // Borders the color of the active background give each
            // chip visual separation from its neighbor — without
            // this the dark-mode chips would melt into a smear of
            // color at the overlap point.
            borderWidth: 1.5,
            borderColor: colors.bg,
            borderRadius: 10,
          }}
        >
          <BrandGlyph appId={id} size="sm" />
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={{
            marginLeft: -APP_GLYPH_OVERLAP,
            borderWidth: 1.5,
            borderColor: colors.bg,
            borderRadius: 10,
            width: APP_GLYPH_CHIP,
            height: APP_GLYPH_CHIP,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: withAlpha(colors.ink, 0.12),
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 12,
              color: colors.ink,
            }}
          >
            +{overflow}
          </Text>
        </View>
      )}
    </View>
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
// DevSessionPill — manual focus-session toggle
//
// Lets a developer/reviewer flip a real focus session on without
// having to walk through the Begin Sermon flow. Used primarily to
// verify the FocusMiniPlayer renders on every tab + the book
// reader + settings without walking through a full sermon each
// time. Two visual states:
//
//   • Off → muted ghost pill, "Start focus session"
//   • On  → blue-tinted pill, "End focus session"
//
// On press the pill flips state immediately so the user gets
// instant feedback before navigating away to verify the banner.
// ─────────────────────────────────────────────────────────────────

function DevSessionPill({
  active,
  onPress,
}: {
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  // Same iOS-system-blue as the rest of the focus surface.
  const accent = "#0A84FF";
  return (
    <Pressable
      hitSlop={12}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        active ? "End the active focus session" : "Start a focus session"
      }
      className="flex-row items-center px-4 py-3 rounded-full border bg-surface"
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
        borderColor: active ? withAlpha(accent, 0.5) : colors.border,
        backgroundColor: active ? withAlpha(accent, 0.12) : colors.surface,
      })}
    >
      <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 3l8 3v6c0 4-3 7-8 9-5-2-8-5-8-9V6l8-3z"
          stroke={active ? accent : colors.inkMuted}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
      <Text
        className="text-[13px] ml-2"
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: active ? accent : colors.inkMuted,
        }}
      >
        {active ? "End focus session" : "Start focus session"}
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

/** 12-hour clock format with AM/PM — "7:15 AM", "11:00 PM". Used by
 *  the `featured` memo when composing the routine card's subtitle.
 *  Deliberately tiny and inlined so the home screen doesn't pull a
 *  date library for one call site. */
function format12h({
  hour,
  minute,
}: {
  hour: number;
  minute: number;
}): string {
  const period = hour >= 12 ? "PM" : "AM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  const mm = minute.toString().padStart(2, "0");
  return `${h12}:${mm} ${period}`;
}

/**
 * Compute the next datetime that a (time-of-day, days-of-week) pair
 * will fire, searching the next 7 days from `now`. Returns null when
 * the session has no active days at all — that case is treated as
 * "never fires" upstream and excludes the session from the home
 * routine card.
 *
 * The 7-day window is intentional and sufficient: a session must
 * have at least one weekday selected to be schedulable, so its next
 * occurrence is guaranteed to be within 6 days. We test each calendar
 * day in order so the result is the strictly-soonest matching slot
 * (we don't just match weekday; we match weekday AND time-in-future).
 */
function computeNextOccurrence(
  time: { hour: number; minute: number },
  daysOfWeek: ReadonlyArray<number>,
  now: Date,
): Date | null {
  if (daysOfWeek.length === 0) return null;
  for (let offset = 0; offset < 7; offset++) {
    const candidate = new Date(now);
    candidate.setDate(now.getDate() + offset);
    candidate.setHours(time.hour, time.minute, 0, 0);
    if (!daysOfWeek.includes(candidate.getDay())) continue;
    if (candidate.getTime() > now.getTime()) return candidate;
  }
  return null;
}

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

// ─────────────────────────────────────────────────────────────────
// Today's rhythm — chronological timeline
// ─────────────────────────────────────────────────────────────────

/**
 * Single row in the timeline. Three discrete states drive the
 * visual treatment:
 *
 *   "done"     — Sermon finished today. Checkmark dot, dimmed text,
 *                "Done" trailing label.
 *   "now"      — Routine's focus session is currently active.
 *                Filled blue dot with a soft halo, "Now" pill on
 *                the trailing edge, full-opacity text.
 *   "upcoming" — Default. Hollow dot, full-opacity text, relative
 *                time on the trailing edge ("in 3h", "9:00 PM").
 *
 * For routines we deliberately don't model "passed" (scheduled
 * time has slipped but no focus session ran). Treating them as
 * "upcoming" of the NEXT occurrence is more honest — the day's
 * routine slot is over, but the routine itself is still valid;
 * the same row just refers to tomorrow's instance.
 */
type RhythmStatus = "done" | "now" | "upcoming";

type RhythmItem = {
  /** Stable key for the FlatList-style map. Sermon row uses
   *  "sermon"; routine rows use the session id. */
  key: string;
  /** Epoch ms of the moment this row represents — drives the
   *  chronological sort. */
  at: number;
  /** "7:00 AM" — pre-formatted for the leading column. */
  timeLabel: string;
  title: string;
  /** One-line secondary text: duration, focus indicator,
   *  routine source, etc. */
  meta: string;
  status: RhythmStatus;
  /** Tap handler. Sermon row plays the sermon; routine rows
   *  open the routine landing page in /study/[id]. */
  onPress?: () => void;
};

function TodayRhythm({
  sermonTime,
  sermonName,
  sermonCompleted,
  onSermonPress,
  studySessions,
  activeFocusSession,
}: {
  sermonTime: { hour: number; minute: number } | undefined;
  sermonName: string;
  sermonCompleted: boolean;
  onSermonPress: () => void;
  studySessions: ReadonlyArray<StudySession>;
  activeFocusSession: { routineId?: string } | null;
}) {
  const router = useRouter();
  const colors = useColors();

  // Build the timeline in one pass so the section header's count
  // and the render list stay in lockstep.
  const items: RhythmItem[] = useMemo(() => {
    const now = new Date();
    const todayDow = now.getDay();
    const out: RhythmItem[] = [];

    // ── Sermon row ──
    // ALWAYS rendered. When the user hasn't set a sermon time
    // (legacy install before the onboarding sermon-time picker
    // shipped) we fall back to 7am — same default the welcome
    // screen's seeding uses, and the same default the daily
    // notification scheduler picks up. Showing the row anchored
    // at the fallback keeps the timeline non-empty for everyone,
    // and the row's title clearly names today's sermon so the
    // user can engage even if they never set an explicit time.
    const SERMON_FALLBACK = { hour: 7, minute: 0 };
    const resolvedSermonTime = sermonTime ?? SERMON_FALLBACK;
    const sermonAt = new Date(now);
    sermonAt.setHours(
      resolvedSermonTime.hour,
      resolvedSermonTime.minute,
      0,
      0,
    );
    out.push({
      key: "sermon",
      at: sermonAt.getTime(),
      timeLabel: format12h(resolvedSermonTime),
      title: sermonName,
      meta: sermonCompleted ? "Heard today" : "Today's sermon",
      status: sermonCompleted ? "done" : "upcoming",
      onPress: onSermonPress,
    });

    // ── Routine rows ──
    // One row per enabled study session that fires today. We
    // intentionally include routines whose time has already passed
    // — they still show up under their planned hour so the
    // chronological reading of the day stays continuous. The
    // active-session row gets bumped to "now" status; everything
    // else stays "upcoming". A "passed" status would suggest the
    // user failed at something they merely deferred — keeping it
    // upcoming preserves the calm tone.
    for (const s of studySessions) {
      if (!s.enabled) continue;
      if (!s.daysOfWeek.includes(todayDow as 0 | 1 | 2 | 3 | 4 | 5 | 6)) {
        continue;
      }
      const at = new Date(now);
      at.setHours(s.time.hour, s.time.minute, 0, 0);
      const isActive = activeFocusSession?.routineId === s.id;
      const metaParts: string[] = [];
      if (s.useFocusMode) {
        metaParts.push("Focus");
      }
      if (typeof s.durationMinutes === "number") {
        metaParts.push(`${s.durationMinutes} min`);
      }
      if (s.source === "system") {
        metaParts.push("Closer routine");
      }
      out.push({
        key: s.id,
        at: at.getTime(),
        timeLabel: format12h(s.time),
        title: s.name,
        meta: metaParts.join(" · ") || "Reminder",
        status: isActive ? "now" : "upcoming",
        onPress: () => router.push(`/study/${s.id}`),
      });
    }

    // Sort by time-of-day. Stable JS sort so equal-time rows keep
    // their insertion order (sermon before routines that happen
    // to be set to the same minute).
    out.sort((a, b) => a.at - b.at);
    return out;
  }, [
    sermonTime,
    sermonName,
    sermonCompleted,
    onSermonPress,
    studySessions,
    activeFocusSession,
    router,
  ]);

  return (
    <View>
      {/* Header — Opal-style section label. Title + supporting count
          pill so the section reads as a discrete unit. */}
      <View className="px-6 mb-3 flex-row items-baseline justify-between">
        <Text
          className="text-ink text-[12px] tracking-[2.5px] uppercase"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          Today's rhythm
        </Text>
        {items.length > 0 ? (
          <Text
            className="text-ink-subtle text-[11px]"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            {items.length} moment{items.length === 1 ? "" : "s"}
          </Text>
        ) : null}
      </View>

      {items.length === 0 ? (
        <View className="px-6">
          <View
            className="rounded-2xl p-5 items-center"
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              className="text-ink text-[13.5px] text-center"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Nothing scheduled today
            </Text>
            <Text
              className="text-ink-muted text-[12.5px] text-center mt-1.5 leading-[18px]"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Add a routine from Practice to start shaping your day.
            </Text>
          </View>
        </View>
      ) : (
        <View
          className="mx-6 rounded-2xl"
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
          }}
        >
          {items.map((item, i) => (
            <RhythmRow
              key={item.key}
              item={item}
              isFirst={i === 0}
              isLast={i === items.length - 1}
            />
          ))}
        </View>
      )}
    </View>
  );
}

/**
 * One row in the timeline. Layout (left → right):
 *
 *   [ TIME ]  | [ DOT ]  Title              [ STATUS LABEL ]
 *             |          Meta
 *             |  (vertical thread to next row)
 *
 * The vertical thread is drawn by the dot column having its own
 * background line that runs between rows. We do this with a sibling
 * absolutely-positioned View rather than a border on the dot
 * container so the line can extend ONLY between rows (not above
 * the first dot or below the last).
 */
function RhythmRow({
  item,
  isFirst,
  isLast,
}: {
  item: RhythmItem;
  isFirst: boolean;
  isLast: boolean;
}) {
  const colors = useColors();
  // Color tokens vary by status — kept in one spot so visual
  // changes for any state require touching exactly one block.
  const isDone = item.status === "done";
  const isNow = item.status === "now";
  const dotFill = isNow
    ? "#0A84FF"
    : isDone
      ? colors.inkSubtle
      : "transparent";
  const dotBorder = isNow
    ? "#0A84FF"
    : isDone
      ? colors.inkSubtle
      : withAlpha(colors.ink, 0.32);
  const titleOpacity = isDone ? 0.55 : 1;

  return (
    <Pressable
      onPress={item.onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.timeLabel}, ${item.status}.`}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        className="flex-row items-stretch"
        style={{
          paddingTop: isFirst ? 14 : 10,
          paddingBottom: isLast ? 14 : 10,
          paddingHorizontal: 14,
        }}
      >
        {/* Time column — fixed width so titles in column two align
            across all rows regardless of "7:00 AM" vs "12:30 PM". */}
        <View style={{ width: 62, paddingTop: 2 }}>
          <Text
            className="text-ink text-[12px]"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              opacity: isDone ? 0.55 : 1,
              letterSpacing: 0.2,
            }}
          >
            {item.timeLabel}
          </Text>
        </View>

        {/* Dot + thread column */}
        <View style={{ width: 24, alignItems: "center" }}>
          {/* Upper thread — connects this row's dot to the row
              above. Skipped on the first row. */}
          {!isFirst ? (
            <View
              style={{
                position: "absolute",
                top: 0,
                width: 1.5,
                height: 12,
                backgroundColor: withAlpha(colors.ink, 0.1),
              }}
            />
          ) : null}
          {/* The dot itself */}
          <View
            style={{
              marginTop: 4,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: dotFill,
              borderWidth: 1.5,
              borderColor: dotBorder,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Checkmark glyph for the done state — a small white
                tick inside the filled dot reads as "completed". */}
            {isDone ? (
              <Svg width={7} height={7} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 12l5 5 9-11"
                  stroke="#FFFFFF"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ) : null}
          </View>
          {/* Lower thread — connects this row's dot to the row
              below. Skipped on the last row. */}
          {!isLast ? (
            <View
              style={{
                position: "absolute",
                bottom: 0,
                top: 22,
                width: 1.5,
                backgroundColor: withAlpha(colors.ink, 0.1),
              }}
            />
          ) : null}
        </View>

        {/* Title + meta — the column that takes the remaining width.
            opacity-dims under the "done" state so the row reads as
            finished business without losing legibility. */}
        <View className="flex-1 pl-3 pr-2" style={{ opacity: titleOpacity }}>
          <Text
            className="text-ink text-[14.5px] leading-[19px]"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              letterSpacing: -0.1,
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            className="text-ink-muted text-[12px] leading-[16px] mt-0.5"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            numberOfLines={1}
          >
            {item.meta}
          </Text>
        </View>

        {/* Trailing status pill / label. Three visuals:
            • "Done" — quiet, dimmed
            • "Now"  — accent-blue pill that mirrors the dot
            • upcoming — relative time label ("in 3h" etc.) */}
        <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
          {isDone ? (
            <Text
              className="text-ink-subtle text-[11px]"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                letterSpacing: 0.4,
                textTransform: "uppercase",
              }}
            >
              Done
            </Text>
          ) : isNow ? (
            <View
              style={{
                paddingHorizontal: 9,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: withAlpha("#0A84FF", 0.14),
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 10,
                  color: "#0A84FF",
                  letterSpacing: 0.4,
                  textTransform: "uppercase",
                }}
              >
                Now
              </Text>
            </View>
          ) : (
            <Text
              className="text-ink-subtle text-[11px]"
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
              }}
            >
              {formatRelativeUntil(item.at, Date.now())}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

/**
 * Format an absolute future epoch ms as a short relative chip:
 *   "in 12m"   — under an hour
 *   "in 3h"    — under a day
 *   "Today"    — the moment's time has already passed today, but
 *                the row still represents something valid (the
 *                sermon is still available; the routine still
 *                fires tomorrow). "Today" reads neutrally — the
 *                moment is for today, not yesterday — without
 *                implying the user failed at anything.
 *
 * "Earlier" was an earlier draft of this label; it read slightly
 * reproachful, like the row was scolding the user for missing it.
 * "Today" preserves chronology without judgment.
 */
function formatRelativeUntil(targetMs: number, nowMs: number): string {
  const diff = targetMs - nowMs;
  if (diff < 0) return "Today";
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return "Now";
  if (minutes < 60) return `in ${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `in ${hours}h`;
}
