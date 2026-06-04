import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  type ImageSourcePropType,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, {
  Defs,
  LinearGradient,
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
import * as haptics from "@/lib/haptics";
import { momentDurationMin, resolveSermonType } from "@/lib/moments";
import { formatMinutes, formatRemaining } from "@/lib/readingGoalFormat";
import { getVerseOfDay } from "@/lib/verseOfDay";
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
    pauseSession: pauseFocusSession,
    resumeSession: resumeFocusSession,
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
    // Medium-impact haptic on the primary CTA — the begin tap
    // is the moment the user commits to today's sermon, so it
    // gets a more noticeable tactile pulse than a generic row.
    haptics.tap();
    router.push("/sermon/intro");
  };

  const handleOpenLastCheckIn = () => {
    if (!lastCheckIn) return;
    haptics.soft();
    router.push(`/check-ins/${lastCheckIn.id}` as never);
  };

  const handleOpenProfile = () => {
    // Presented modally from the root stack — see app/_layout.tsx.
    haptics.soft();
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
      {/* ─── Page-level ambient atmosphere ───────────────────────
          Absolutely positioned radial gradient painted BEHIND
          everything in the scroll view. The per-sermon-type
          accent (violet for Letters, blue for Questions, peach
          for Hope…) becomes the ambient lighting of the upper
          page — bleeds into the safe area above the greeting,
          surrounds the sermon hero, and fades out by the time
          the eye reaches the verse card.

          Why at the SafeAreaView level rather than inside the
          ScrollView contents:
            • The gradient stays visually stationary as the user
              scrolls (it's anchored to the screen, not the
              scroll content). That makes the page feel like a
              lit stage with the content scrolling THROUGH it,
              not a single canvas that moves wholesale. Same
              parallax-y trick Opal uses for its background tint.
            • It can bleed into the status-bar area (above the
              SafeAreaView's content inset) without being clipped
              by a scroll content boundary.

          Falloff is wider and shallower than the previous
          in-card halo: starts at accent @ 0.35 at center,
          fades through 0.12 at the midpoint, fully transparent
          at the edges. The result is a gentle wash rather than
          a discrete pool of color. */}
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
              id="page-ambient"
              cx="50%"
              cy="32%"
              rx="95%"
              ry="65%"
              fx="50%"
              fy="32%"
            >
              <Stop offset="0" stopColor={sermonType.accent} stopOpacity={0.35} />
              <Stop offset="0.35" stopColor={sermonType.accent} stopOpacity={0.14} />
              <Stop offset="0.7" stopColor={sermonType.accent} stopOpacity={0.04} />
              <Stop offset="1" stopColor={sermonType.accent} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width="100%" height="100%" fill="url(#page-ambient)" />
        </Svg>
      </View>

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
        {/* ─── Editorial header ──────────────────────────────────────
            Matches Practice's framing pattern: big title + warm
            tagline. The title here is the personalized greeting
            ("Good evening, friend"), and the tagline is a one-line
            time-of-day-aware devotional invitation ("Wind down with
            today's word."). The avatar sits inline at the start of
            the title row so the layout reads as one editorial unit
            instead of an avatar floating above a separate title.

            Why a separate tagline rather than packing the greeting?
            The greeting alone reads as a "header bar". A tagline
            below — same as Practice — turns it into a magazine page
            opener: name + framing line. Costs nothing visually, but
            sets the tone before the user reaches the sermon. */}
        <View className="px-6 pt-2">
          <View className="flex-row items-center">
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
              {/*
                Personalized greeting: time-of-day phrase + first name.
                The fallback ("friend" lowercase) is intentional — when
                the onboarding name is missing, "Good evening, friend"
                feels warmer than capitalizing a placeholder which
                would read as "Friend" the proper noun. Trimmed and
                numberOfLines=1 because a very long given name on a
                narrow phone would push the header into two lines and
                throw the whole strip off vertically.
              */}
              {greeting}, {firstName}
            </Text>
            {/* Streak chip — Opal pattern. The flame + day count
                pill at the top-right of the greeting row gives the
                header a brand-surface quality the same way Opal's
                top bar carries the streak fire icon. Even when the
                rest of the page is calm, this chip keeps the
                momentum number visible above the fold so the user
                sees their streak the instant they open the app.

                Tapping the chip scrolls to / opens the WeekStrip
                so the user can see the calendar of engaged days —
                same affordance Opal's flame uses (it opens the
                streak detail sheet). For now we keep it
                non-interactive; wiring the scroll handler is a
                follow-up. */}
            {streak.current > 0 ? (
              <StreakChip
                count={streak.current}
                accent={sermonType.accent}
              />
            ) : null}
          </View>
          {/* Tagline — sits under the title with the same left inset
              as the title text (40pt avatar + 12pt ml-3 ≈ 52pt). The
              indent keeps the tagline visually attached to the title
              rather than the avatar, which makes the avatar feel
              like an anchor rather than a floating chip.

              Set in EB Garamond italic — the serif voicing reframes
              the tagline as a quiet editorial note ("Wind down with
              today's word.") rather than UI copy. Same typographic
              pairing the Verse for Today card uses, so the editorial
              voice is consistent across the page. */}
          <Text
            className="text-ink-muted text-[15px] leading-[22px] mt-2"
            style={{
              fontFamily: "EBGaramond_400Regular_Italic",
              marginLeft: 52,
              letterSpacing: 0.1,
            }}
          >
            {getHomeTagline()}
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
          {/* No px-6 here — the SermonCard now paints an
              ambient radial halo that needs to bleed edge-to-
              edge of the screen. The card's internal content
              manages its own horizontal padding. */}
          <View className="mt-4">
            {/* Hero is state-driven. Three modes:
                  1. focusSession active  → ActiveFocusHero
                     The user is currently in a focus session — the
                     control surface for that session is the most
                     important thing on the screen.
                  2. focusSession null    → SermonCard
                     Default state: today's sermon is the hero.
                     SermonCard handles its own completed-vs-unheard
                     branching internally (forward-look subtitle when
                     completed, "Begin" pill when not).
                The mini-player at the tab bar still renders in
                mode 1 — the hero and the pill are different views
                of the same state (control surface vs. ambient
                strip), see ActiveFocusHero header for the
                rationale. */}
            {focusSession ? (
              // ActiveFocusHero is still a card-style component
              // and needs its own horizontal padding (the parent
              // wrapper above is intentionally edge-to-edge for
              // the SermonCard's ambient halo).
              <View className="px-6">
              <ActiveFocusHero
                session={focusSession}
                routineName={
                  focusSession.routineId
                    ? studySessions.find((s) => s.id === focusSession.routineId)?.name
                    : undefined
                }
                appsSummary={`${focusSession.blockedAppIds.length} apps quieted`}
                onPause={pauseFocusSession}
                onResume={resumeFocusSession}
                onEnd={() => {
                  // Confirm before tear-down — mirrors the mini-player
                  // and the legacy GlobalFocusBanner. End is a
                  // commitment exit, not a casual dismiss.
                  Alert.alert(
                    "End focus session?",
                    "The shield will come down and notifications will return.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "End",
                        style: "destructive",
                        onPress: () => endFocusSession(),
                      },
                    ],
                  );
                }}
              />
              </View>
            ) : (
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
                // Forward-look label, only used when `completed`.
                // We compute it here (parent owns the reminder-time
                // preference) so the card stays a pure presenter.
                // Falls back to the 7am default that the timeline and
                // the welcome-screen seeding both use, so an installed
                // user without an explicit preference still gets a
                // grounded "Tomorrow at 7:00 AM" rather than nothing.
                nextSermonLabel={formatNextSermonLabel(
                  answers.dailyReminderTime ?? { hour: 7, minute: 0 },
                )}
                onPress={handlePlaySermon}
              />
            )}
          </View>
        </FadeIn>

        {/* ─── 3-stat row ──────────────────────────────────────────
            Opal-style stats triplet directly below the hero. Three
            columns separated by hairline dividers, hairlines top
            and bottom so the row reads as a discrete dashboard
            band the way Opal's FOCUS / SCREEN TIME / CULPRITS
            row does on its home screen.

            Stats are tied to data the user actually feels:
              • STREAK — current day-streak, the momentum number
              • READING — today's minutes against the goal
              • BEST — longest historical streak, the aspirational
                         "personal best" the current streak chases

            We picked BEST rather than a generic "TOTAL SERMONS"
            count because the streak loop is what brings people
            back daily; surfacing the personal best gives the
            current streak a target to chase even on days the
            sermon plays without ceremony.

            Each value is rendered as a bold number + small unit
            so the eye scans down the row at a glance. */}
        <FadeIn delayMs={100} durationMs={800}>
          <StatRow
            streakCurrent={streak.current}
            streakLongest={streak.longest}
            readingMinutes={readingMinutes}
            readingGoal={readingGoal}
          />
        </FadeIn>

        {/* ─── Verse for today ─────────────────────────────────────
            A slim scripture mini-card that lives between the
            sermon hero and the rhythm timeline. Same width as
            the sermon and a touch slimmer in vertical height
            so it reads as a related quiet companion (devotional
            flavor) rather than a competing feature.

            The accent color is pulled from the current sermon
            type so the verse, hero, and any per-type chrome
            feel like one composition. */}
        <FadeIn delayMs={130} durationMs={800}>
          <View className="px-6 mt-7">
            <VerseOfDay accent={sermonType.accent} />
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
          <View className="mt-9">
            <TodayRhythm
              sermonTime={answers.dailyReminderTime}
              sermonName={todaysMoment.title}
              sermonCompleted={hasCompletedSermonToday}
              onSermonPress={handlePlaySermon}
              studySessions={studySessions}
              activeFocusSession={focusSession}
              // Quick-focus button: only rendered when no session
              // is active (the takeover hero is the manage surface
              // during a live session, so adding a "start new"
              // affordance there would be confusing). Open-ended
              // session — no duration cap, no routineId — so the
              // user can decide on the fly when to End. Uses
              // today's sermonDay so the persisted session still
              // anchors to the day for stale-session cleanup math.
              onStartQuickFocus={
                focusSession
                  ? undefined
                  : () => {
                      haptics.tap();
                      startFocusSession(todaysMoment.day).catch(() => {
                        /* shield start is best-effort; persistence
                           wrote regardless */
                      });
                    }
              }
            />
          </View>
        </FadeIn>

        {/* ─── "Your practice" section header ─────────────────────
            Magazine-style chapter divider above the streak strip,
            reading pill, and routine card — the three surfaces
            that form the user's personal practice block (as
            opposed to today's content above). Same treatment as
            Practice's "Deepen your practice" header (19pt bold
            mixed-case + 12.5pt subtitle), so the two tabs share
            a section-heading rhythm and home stops reading as a
            flat stack of disconnected widgets. */}
        <FadeIn delayMs={180} durationMs={800}>
          <View className="px-6 mt-9 mb-4">
            <Text
              className="text-ink text-[19px] leading-[24px] tracking-[-0.2px]"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Your practice
            </Text>
            <Text
              className="text-ink-muted text-[12.5px] leading-[18px] mt-0.5"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            >
              The small anchors that keep you returning.
            </Text>
          </View>
        </FadeIn>

        {/* ─── Streak strip ─────────────────────────────────────────
            Imprint-style compact card: one contextual prompt on top
            and 7 day cells beneath, with today highlighted by an
            outlined pill. Demoted to a supporting strip under the
            hero + timeline. */}
        <FadeIn delayMs={200} durationMs={800}>
          <View className="px-6">
            <WeekStrip
              days={weekDays}
              prompt={streakPrompt(streak)}
              streakCount={streak.current}
              // Today's sermon-type accent doubles as the streak
              // strip's accent. See WeekStrip header for why per-day
              // accents would require data we don't currently track.
              accent={sermonType.accent}
            />
          </View>
        </FadeIn>

        {/* ─── Reading-goal pill ───────────────────────────────────
            Slim one-row pill: tiny iOS-blue activity ring + minutes
            label. Tap drills into /reading-goal for the full chart. */}
        <FadeIn delayMs={240} durationMs={800}>
          <View className="px-6 mt-4 mb-2">
            <ReadingPill
              minutes={readingMinutes}
              goal={readingGoal}
              reached={readingGoalReached}
              onPress={() => router.push("/reading-goal")}
            />
          </View>
        </FadeIn>

        {/* ─── Routine / Focus card ────────────────────────────────
            Master toggle + featured routine. Hidden when an active
            focus session exists — at that point the ActiveFocusHero
            up top owns the "what is focus doing right now?" surface,
            and the mini-player at the tab bar owns the always-on
            end-control. Leaving this card visible during an active
            session would create THREE simultaneous focus surfaces
            on home (hero + this + pill), which is the redundancy
            the consolidation phase was meant to retire.

            When no session is active this card stays — it's the
            ONLY surface that exposes the master enable/disable
            and the "next scheduled routine" preview, neither of
            which the timeline or pill cover. */}
        {!focusSession ? (
          <FadeIn delayMs={280} durationMs={800}>
            <View className="px-6 mt-4">
              <RoutineCard
                masterEnabled={focusPrefs.enabled}
                sessionActive={focusSession !== null}
                featured={featured}
                onToggle={setFocusEnabled}
                onEndSession={() => {
                  endFocusSession().catch(() => {});
                }}
                onOpen={() => {
                  // Tap routes to where the user expects: the
                  // routine editor when there's a routine to
                  // manage, the global focus settings otherwise.
                  // Same shape Opal uses (tap My Apps card → the
                  // app picker).
                  if (featured.routine) {
                    router.push("/(tabs)/journey");
                  } else {
                    router.push("/settings/focus");
                  }
                }}
              />
            </View>
          </FadeIn>
        ) : null}

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
  // We split the headline into two pieces for the "in progress"
  // state so the elapsed metric (the part the user actually
  // cares about — "how am I doing right now?") can be styled
  // distinctly from the goal suffix. The previous one-string
  // headline ("0:03 of 10 min") read as a single dim glyph
  // string and the user couldn't tell at a glance whether they
  // were close to or far from their goal.
  //
  // Layout per state:
  //   • reached   → "Completed"                 (big, ink color)
  //   • zero      → "10 min today"              (big, dim — invitation)
  //   • progress  → "0:03 [/ 10 min]"           (big metric + small suffix)
  const headline = reached
    ? "Completed"
    : minutes <= 0
      ? `${goal} min today`
      : formatMinutes(minutes);
  const headlineSuffix =
    reached || minutes <= 0 ? null : ` / ${goal} min`;
  // Caption mirrors the headline split: when reached, surface the
  // total time invested so the user gets a small breakdown right on
  // the home screen (the full detail screen has the hourly chart
  // and 7-day rhythm strip). Otherwise show the existing "X minutes
  // to today's goal" / "Spend Y minutes near scripture" copy.
  const remainingLabel = reached
    ? `Read for ${formatMinutes(minutes)} today`
    : formatRemaining(minutes, goal, reached);
  const accessibilityHeadline = headlineSuffix
    ? `${headline}${headlineSuffix}`
    : headline;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Reading goal: ${accessibilityHeadline}`}
      // Bumped vertical padding from py-3 → py-3.5 so the larger
      // 48pt ring breathes — the previous tighter padding made
      // the bigger ring crowd the headline. Otherwise unchanged.
      className="rounded-2xl border border-border bg-surface flex-row items-center px-4 py-3.5"
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      {/* Ring sized up from 36 → 48 with a thicker stroke. Reading
          progress is one of the few persistent metrics on the home
          screen and the previous tiny ring made it hard to read
          from arm's length. 48 still fits comfortably inside the
          pill's vertical rhythm and matches the visual weight of
          a small avatar. */}
      <ActivityRing
        pct={pct}
        reached={reached}
        size={48}
        stroke={5}
        showTip={false}
      />
      <View className="flex-1 ml-4">
        <Text
          className="text-ink-subtle text-[10px] tracking-[2.5px] uppercase"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          Drawing Near
        </Text>
        {/* Headline row — uses baseline alignment so the smaller
            "/ 10 min" suffix sits on the same line as the bolder
            elapsed metric. baseline (not center) is what makes
            "0:03 / 10 min" read like a unit instead of two
            separate strings. */}
        <View className="flex-row items-baseline mt-0.5">
          <Text
            // Bumped from 15 → 17 to make the elapsed minutes
            // pop. Still well under any title-style sizing, so
            // it doesn't compete with section headers.
            className="text-[17px] leading-[20px] tracking-[-0.3px]"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: reached ? colors.ink : minutes > 0 ? RING_ACCENT : colors.ink,
            }}
            numberOfLines={1}
          >
            {headline}
          </Text>
          {headlineSuffix ? (
            <Text
              className="text-ink-subtle text-[13px] leading-[18px]"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              numberOfLines={1}
            >
              {headlineSuffix}
            </Text>
          ) : null}
        </View>
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
// VerseOfDay — slim scripture mini-card under the sermon hero
// ─────────────────────────────────────────────────────────────────
//
// Sits in a narrow visual lane: same width as the sermon card,
// noticeably less vertical mass. Three pieces:
//
//   • Small "VERSE FOR TODAY" eyebrow (uppercase, tracked, accent-colored)
//   • The verse text itself (the only piece the eye should rest on)
//   • Reference line ("PSALM 46:10") in the same caps style as the eyebrow
//
// We deliberately do NOT make this card pressable. Tapping it
// would open… what? A standalone verse screen would feel like
// invented surface area, and routing it into the sermon player
// would be a confusing detour. Calm static content is the point.
// If we ever want a "share" or "save" affordance, that gets
// added as an explicit icon button, not the whole card.
//
// Themeing: pulls the per-sermon-type accent so the verse,
// hero eyebrow, and any future per-type chrome read as one
// composition. The accent only colors the small typographic
// elements — never the background — so dark mode stays dark.

function VerseOfDay({ accent }: { accent: string }) {
  const colors = useColors();
  // useMemo against the calendar date string (not the Date
  // instance) so re-renders within the same day return the same
  // verse without recomputing. Crossing midnight in the
  // background would normally re-trigger but the screen
  // remounts on tab change so the verse refreshes naturally
  // when the user returns the next day.
  const verse = useMemo(() => getVerseOfDay(), []);
  return (
    // Subtle accent-tinted background — the card wash carries
    // ~6% of the sermon-type accent so the verse visually
    // belongs to the same color family as the sermon hero
    // above. Border tint matches so the seam between
    // background and edge isn't broken by a neutral line.
    // Effect is intentionally barely-there: it should read
    // as "warm" not "colored", and dark mode stays dark.
    <View
      className="rounded-2xl px-5 py-4"
      style={{
        backgroundColor: withAlpha(accent, 0.07),
        borderWidth: 1,
        borderColor: withAlpha(accent, 0.14),
      }}
      accessibilityRole="summary"
      accessibilityLabel={`Verse for today: ${verse.text} — ${verse.reference}`}
    >
      {/* Eyebrow row — accent-colored small caps. The accent is
          the brightest pixel in the card by design, signaling
          "this is the topic" before the eye drops to the verse
          body. */}
      <Text
        className="text-[10px] tracking-[2.5px] uppercase"
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: accent,
        }}
      >
        Verse for Today
      </Text>

      {/* Verse body. Set in EB Garamond Italic — the editorial
          serif pairing signals "this is sacred text" the way a
          chapter epigraph does in a printed devotional. Garamond
          italic is one of the most beautiful display italics
          ever cut; using it here is a deliberate typographic
          flourish that the rest of the UI's sans pairing
          can't deliver.

          Size bumped 15.5 → 17 (serif reads smaller optically
          than sans at the same size), line-height 22 → 25 for
          the airier classical feel, letter-spacing reset to
          near-zero (serifs don't want tightening). Curly quotes
          remain — they're part of the typographic identity
          and they kern beautifully against Garamond italic. */}
      <Text
        className="text-[17px] leading-[25px] mt-2"
        style={{
          fontFamily: "EBGaramond_400Regular_Italic",
          color: colors.ink,
          letterSpacing: 0.1,
        }}
      >
        “{verse.text}”
      </Text>

      {/* Reference — small caps, same tracking as the eyebrow,
          dimmed so it sits as metadata rather than competing
          with the verse copy. */}
      <Text
        className="text-[10.5px] tracking-[1.8px] uppercase mt-2"
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: colors.inkSubtle,
        }}
      >
        {verse.reference}
      </Text>
    </View>
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
  /** When `completed` is true, a pre-formatted human string that
   *  tells the user when their next sermon will arrive — e.g.
   *  "Tomorrow at 7:00 AM" or "Sunday at 9:00 AM" if their reminder
   *  time skips weekends.
   *
   *  Why a string rather than a Date? Two reasons. (1) Parent
   *  already owns the user's reminder-time preferences and can
   *  format with the correct day-of-week math without exposing
   *  those internals to the card. (2) The string is the entire UI
   *  contract — making it a string keeps the card a pure
   *  presenter. Absent or empty → the card falls back to the type
   *  tagline subtitle, same as before. */
  nextSermonLabel?: string;
  onPress: () => void;
};

function SermonCard({
  type,
  title,
  subtitle,
  pastor,
  durationMin,
  completed,
  nextSermonLabel,
  onPress,
}: SermonCardProps) {
  // Surface color drives the bottom fade-out of the full-bleed
  // hero so the image dissolves into the body section instead
  // of stopping at a hard edge. Theme-aware so light mode fades
  // to white-ish surface, dark mode fades to near-black.
  const colors = useColors();
  // OBJECT-FORWARD layout (Opal-inspired): we removed the rounded
  // card chrome (border / bg-surface / rounded-3xl / overflow-hidden)
  // so the hero icon + accent glow read as a glowing OBJECT sitting
  // in the page rather than a flat illustration trapped inside a
  // card. The Pressable still wraps the whole thing for tap, just
  // without visual chrome. opacity-on-press stays for tactile
  // feedback. All horizontal padding now lives on the inner content
  // blocks so the ambient radial halo can paint edge-to-edge.
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      {/*
        Hero block. Two render modes — choice is driven entirely by
        whether the sermon type ships a `homeHero` landscape asset:

          • homeHero PRESENT (currently Daily Church):
              Rounded landscape panel at the top of the hero
              region — the photo IS the illustration. Eyebrow +
              date chip + optional Completed badge overlay the
              image. Fixed 200pt height so the panel reads as a
              distinct "scene" object floating above the title.

          • homeHero ABSENT (every other type):
              Object-forward icon hero: large centered
              illustration with an ambient accent halo painted
              behind it. The icon lives in the page space (no
              card chrome), so the per-type accent reads as the
              atmosphere of the upper screen.

        Both variants then share the centered title + meta + CTA
        block underneath.
      */}
      {type.homeHero ? (
          // ── Full-bleed landscape (rounded panel) ──────────
          <View
            style={{
              height: 200,
              marginHorizontal: 24,
              borderRadius: 24,
              overflow: "hidden",
              position: "relative",
            }}>
            <Image
              source={type.homeHero}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width: "100%",
                height: "100%",
              }}
              // `cover` not `contain` — we want the photo to fill
              // the strip with whatever crop the aspect ratio
              // requires, instead of letterboxing. The source
              // assets are composed to keep the focal subject in
              // the middle so cover-crop is safe.
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
            {/* Top legibility gradient — short fade so the
                eyebrow + completed badge sit on a darker band
                without darkening the focal subject below. SVG
                gradient (same lib BookCover and the template
                cards use) so we don't pull in a new dep. */}
            <Svg
              pointerEvents="none"
              width="100%"
              height={64}
              style={{ position: "absolute", top: 0, left: 0, right: 0 }}
            >
              <Defs>
                <RadialGradient id="sc-top-fade" cx="50%" cy="0%" rx="100%" ry="100%">
                  <Stop offset="0" stopColor="#000000" stopOpacity={0.35} />
                  <Stop offset="1" stopColor="#000000" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Rect x={0} y={0} width="100%" height={64} fill="url(#sc-top-fade)" />
            </Svg>

            {/* Bottom dissolve gradient — fades the image's lower
                edge into the body section's surface color so the
                transition reads as a soft hand-off instead of a
                hard line. Theme-aware via colors.surface (matches
                the card body's `bg-surface` class). 48pt feathers
                roughly the bottom quarter of the strip — short
                enough that the focal subject (chapel, hill) stays
                untouched, long enough that the eye can't pick out
                a discrete edge.

                Linear top→bottom (not radial like the top fade)
                because the goal here is a uniform horizontal
                dissolve, not a vignette. */}
            <Svg
              pointerEvents="none"
              width="100%"
              height={48}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
            >
              <Defs>
                <LinearGradient
                  id="sc-bottom-fade"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2={48}
                  gradientUnits="userSpaceOnUse"
                >
                  <Stop offset="0" stopColor={colors.surface} stopOpacity={0} />
                  <Stop offset="1" stopColor={colors.surface} stopOpacity={1} />
                </LinearGradient>
              </Defs>
              <Rect
                x={0}
                y={0}
                width="100%"
                height={48}
                fill="url(#sc-bottom-fade)"
              />
            </Svg>
            {/* Eyebrow overlay — white text so it lifts off the
                sunset palette. Three pieces in left→right order:
                  • Type name        ("DAILY CHURCH")
                  • Today date chip  ("TUE · JUN 2")
                  • Completed badge  (when applicable)

                The date chip is intentionally subtle (white at
                ~70% opacity, same caps tracking as the eyebrow)
                so it reads as supplementary metadata, not a
                second header. Grounds the hero in "this is
                today's word" without screaming for attention. */}
            <View
              className="px-5 pt-4 flex-row items-center justify-between"
              pointerEvents="none"
            >
              <View className="flex-row items-baseline">
                <Text
                  className="text-[10px] tracking-[3px] uppercase"
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: "#FFFFFF",
                    // Subtle text shadow gives the eyebrow a
                    // floor to sit on even when the gradient is
                    // gentle — covers the rare crop case where
                    // the top of the photo is unusually bright.
                    textShadowColor: "rgba(0, 0, 0, 0.4)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                  }}
                >
                  {type.name}
                </Text>
                <Text
                  className="text-[10px] tracking-[2.5px] uppercase"
                  style={{
                    fontFamily: "PlusJakartaSans_500Medium",
                    color: "rgba(255, 255, 255, 0.72)",
                    marginLeft: 8,
                    textShadowColor: "rgba(0, 0, 0, 0.4)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 4,
                  }}
                >
                  · {formatHeroDate(new Date())}
                </Text>
              </View>
              {completed ? <CompletedBadge /> : null}
            </View>
          </View>
        ) : (
          // ── OBJECT-FORWARD HERO (Opal-style) ────────────────
          // The sermon icon is rendered as a glowing centerpiece
          // that lives in the page space — no card border, no
          // surface backplate. A wide ambient radial halo paints
          // behind the icon and bleeds into the page background,
          // so the per-type accent (violet, blue, peach…)
          // becomes the atmosphere of the upper screen instead
          // of being trapped inside a 200pt strip.
          //
          // Compositional shift from the earlier card-bound
          // approach:
          //   was: card frame → strip → icon
          //   now: page → ambient glow → icon (no frame)
          //
          // The hero strip height is gone too — the icon size
          // and surrounding paddings drive layout. The
          // CardAccentGlow underneath the icon adds a tight
          // inner halo so the illustration lifts off the
          // ambient wash with extra contrast.
          <View
            style={{
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 8,
              paddingBottom: 4,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Note: the in-card ambient halo was removed in
                Phase 8B — the page-level ambient gradient
                (painted at the SafeAreaView level in
                app/(tabs)/today.tsx) now provides the
                atmosphere for the whole upper screen, not just
                the area inside this card. The CardAccentGlow
                behind the icon below still handles the tight
                inner halo that lifts the illustration off the
                background. */}

            {/* Eyebrow — sermon type name only, centered above
                the icon. We dropped the date chip in this layout
                because long type names ("Letters From A
                Struggling Christian") + date pushed the centered
                row past the 32pt side gutters and got truncated.
                The date is implied by "today's sermon" framing
                and the system status bar — the eyebrow's job is
                category identity, not calendar grounding.

                Type name uses the accent color rather than white
                so it harmonizes with the ambient halo and signals
                "this is the today's sermon brand" the way a chapter
                heading would in a magazine. */}
            <View
              className="items-center"
              pointerEvents="none"
              style={{ paddingHorizontal: 24 }}
            >
              <Text
                className="text-[10.5px] tracking-[3px] uppercase"
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: type.accent,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                {type.name}
              </Text>
            </View>

            {/* Living centered illustration — the icon never sits
                still. A gentle float (vertical drift) + breathing
                halo (opacity pulse on the accent glow behind it)
                give the hero a sense of presence, matching the
                "alive object" quality of Opal's rotating gemstone.
                See LivingHeroIcon for the animation curves and
                rationale. */}
            <View
              className="items-center justify-center relative"
              style={{ marginTop: 14, marginBottom: 6 }}
            >
              <LivingHeroIcon source={type.hero} accent={type.accent} />
            </View>

            {/* Completed badge — top-right overlay (same slot it
                occupied in the legacy card variant). Floats over
                the ambient halo. */}
            {completed ? (
              <View style={{ position: "absolute", top: 8, right: 16 }}>
                <CompletedBadge />
              </View>
            ) : null}
          </View>
        )}

      {/* Body — centered, no card chrome. Title is the focal
          text; the line below is the subtitle (tagline normally,
          forward-look when completed); the small meta pulls
          pastor + duration into one calm caps-tracked line. The
          Begin pill floats centered below.

          Layout deliberately mirrors the Opal "object →
          headline → meta → action" rhythm: each piece of text
          stacks vertically aligned to the icon above, so the
          eye reads top-to-bottom in a single column. */}
      <View
        style={{
          alignItems: "center",
          paddingHorizontal: 32,
          paddingTop: 4,
          paddingBottom: 8,
        }}
      >
        <Text
          className="text-ink text-[26px] leading-[32px] tracking-[-0.4px]"
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            textAlign: "center",
          }}
        >
          {title}
        </Text>
        {/* Subtitle in EB Garamond italic — gives the sermon
            tagline ("A letter found in someone's journal.") an
            editorial epigraph feel, matching the literary voice
            of the Verse for Today card and the home tagline. The
            sans Begin pill below keeps the action chrome
            unmistakably UI; the italic serif handles only the
            evocative narrative text. */}
        <Text
          className="text-ink-muted text-[15px] leading-[22px] mt-2"
          style={{
            fontFamily: "EBGaramond_400Regular_Italic",
            textAlign: "center",
            letterSpacing: 0.1,
          }}
        >
          {completed && nextSermonLabel
            ? `Your next word arrives ${nextSermonLabel}.`
            : subtitle}
        </Text>

        {/* Single-line meta: pastor (when present) + duration,
            joined by a middot. Caps-tracked so it reads as
            credit metadata rather than headline text. */}
        <Text
          className="text-ink-subtle text-[10.5px] tracking-[2px] uppercase mt-3.5"
          style={{
            fontFamily: "PlusJakartaSans_600SemiBold",
            textAlign: "center",
          }}
        >
          {pastor
            ? `${pastor} · ${durationMin} min`
            : `${durationMin} min listen`}
        </Text>

        {/* Begin button — glass pill on the accent halo. Solid
            white when not completed (primary CTA); subtle "Read
            again" outline when completed (the action is no
            longer urgent). Floats below the meta line.

            Tap target is the surrounding SermonCard Pressable
            anyway, so this is a visual affordance — not a
            separate hit zone. */}
        <View
          pointerEvents="none"
          style={{ marginTop: 18, alignItems: "center" }}
        >
          {completed ? <ReadAgainPill /> : <PlayPill />}
        </View>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// ActiveFocusHero — replaces SermonCard while a focus session runs
// ─────────────────────────────────────────────────────────────────
//
// Opal pattern, applied to Closer: when the user has a live focus
// session, the home hero becomes a "Now Focusing" card so the
// state is unmissable the instant they land on Today. The bottom
// FocusMiniPlayer still floats above the tab bar (handles every
// other screen), so on home there's intentional redundancy — but
// the hero gives a destination tap, a generous countdown, and
// quick Break/End access without a scroll.
//
// Why takeover the hero vs. stack it above the sermon?
//   The sermon is also tied to a focus state during the sermon
//   intro flow, but here on home the user has already chosen to
//   be IN a session — putting the sermon hero above a separate
//   focus card would force the user to scroll past the sermon
//   to manage their session, which inverts the priority of the
//   moment. Hero takeover is the simplest "what matters most
//   right now" affordance.
//
// Why not stack the mini-player AND the hero on home?
//   We keep the mini-player visible (consistency across screens)
//   AND the hero. The two are different products of the same
//   state: the pill is a glanceable strip, the hero is a control
//   surface. Removing the pill on home only would create a
//   "where's my session?" moment if the user scrolls past the
//   hero into the lower cards.

const FOCUS_HERO_ACCENT = "#0A84FF"; // matches FocusMiniPlayer

type ActiveFocusHeroProps = {
  session: import("@/state/focus").FocusSession;
  /** Name of the routine that launched this session, if any.
   *  When absent we fall back to "Focus session" — same logic the
   *  mini-player uses. */
  routineName?: string;
  /** Visible on the bottom-left as small text — "12 apps quieted",
   *  pre-formatted by the parent so this component stays presentational. */
  appsSummary: string;
  onPause: () => void;
  onResume: () => void;
  /** End is a "confirm before tearing down" action. The parent owns
   *  the Alert.alert; we just fire the intent. */
  onEnd: () => void;
};

function ActiveFocusHero({
  session,
  routineName,
  appsSummary,
  onPause,
  onResume,
  onEnd,
}: ActiveFocusHeroProps) {
  const colors = useColors();
  const router = useRouter();

  // 1s tick. We re-render the time display once per second so the
  // countdown/elapsed counter ticks smoothly. The interval is torn
  // down on unmount or when session changes identity, so the
  // listener can't leak across screens.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [session.startedAt]);

  // Pulsing dot — same value-based loop the mini-player uses.
  // Stops when the session is paused, so the visual rest state
  // matches the logical "I've stopped the clock" intent.
  const pulse = useRef(new Animated.Value(0)).current;
  const isPaused = Boolean(session.pausedAt);
  useEffect(() => {
    if (isPaused) return;
    pulse.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isPaused, pulse]);

  // Effective elapsed math — same formula as FocusMiniPlayer and
  // ActiveFocusCard. Kept inline (rather than extracted to a
  // shared util) because the three usages all want different
  // surrounding state and abstracting it would be premature.
  const accumPaused = session.accumulatedPausedMs ?? 0;
  const openPause = session.pausedAt ? Math.max(0, now - session.pausedAt) : 0;
  const elapsedMs = Math.max(
    0,
    now - session.startedAt - accumPaused - openPause,
  );

  const hasDuration =
    typeof session.durationMs === "number" && session.durationMs > 0;
  const remainingMs = hasDuration
    ? Math.max(0, (session.durationMs as number) - elapsedMs)
    : 0;
  const progress = hasDuration
    ? Math.min(1, elapsedMs / (session.durationMs as number))
    : 0;

  // mm:ss / h:mm:ss formatter. Identical output to the mini-player
  // so the user reads the same string in both surfaces — no
  // "12:34" here and "12m 34s" there mid-session.
  const formatClock = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    return `${minutes}:${pad(seconds)}`;
  };

  const timeLabel = hasDuration ? formatClock(remainingMs) : formatClock(elapsedMs);
  const timeMetaLabel = hasDuration ? "LEFT" : "ELAPSED";
  const titleLabel = routineName || "Focus session";

  // Pause toggles between Break / Resume. Only meaningful for
  // time-boxed sessions — open-ended sermon focus is "elapsed
  // counter only" with no clear pause semantics, so the button
  // hides entirely in that mode (same rule as the mini-player).
  const handleTogglePause = useCallback(() => {
    if (isPaused) onResume();
    else onPause();
  }, [isPaused, onPause, onResume]);

  return (
    <Pressable
      onPress={() => router.push("/settings/focus")}
      accessibilityRole="button"
      accessibilityLabel={`Focus session: ${titleLabel}. ${timeLabel} ${timeMetaLabel.toLowerCase()}.${
        isPaused ? " Paused." : ""
      } Tap to manage.`}
      className="rounded-3xl overflow-hidden border bg-surface"
      // Accent border so the card visually announces "this is a
      // different state". Subtle (~24% accent) so it doesn't
      // shout — the goal is recognition, not alarm.
      style={({ pressed }) => ({
        opacity: pressed ? 0.94 : 1,
        borderColor: withAlpha(FOCUS_HERO_ACCENT, 0.32),
      })}
    >
      {/* Body — no hero-image strip on this state; the focus card
          is about presence, not scenery. Single padded block. */}
      <View className="px-5 pt-5 pb-5">
        {/* Eyebrow row: pulsing dot + "FOCUS SESSION" + the live
            metadata chip. The dot lives in the same accent blue
            as the bottom mini-player so the two surfaces feel
            like one product showing the same state two ways. */}
        <View className="flex-row items-center">
          <Animated.View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: FOCUS_HERO_ACCENT,
              marginRight: 8,
              opacity: isPaused
                ? 0.35
                : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
              transform: [
                {
                  scale: isPaused
                    ? 1
                    : pulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.85, 1.15],
                      }),
                },
              ],
            }}
          />
          <Text
            className="text-[10px] tracking-[3px] uppercase"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: FOCUS_HERO_ACCENT,
            }}
          >
            {isPaused ? "Focus paused" : "Focus session"}
          </Text>
        </View>

        {/* Title + apps summary. Title takes the visual weight of
            the SermonCard title (25px / leading 31) so the two
            cards swap one-for-one without a vertical jump when
            focus starts/ends. */}
        <Text
          className="text-ink text-[25px] leading-[31px] tracking-[-0.4px] mt-3"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          numberOfLines={1}
        >
          {titleLabel}
        </Text>
        <Text
          className="text-ink-muted text-[14px] leading-[20px] mt-1"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          numberOfLines={1}
        >
          {appsSummary}
        </Text>

        {/* Time display — the big number is the focal element. We
            center it because it's not anchored to any other column
            (no left-rail meta, no right-rail badge). The "LEFT"
            label below is intentionally small + caps + tracked,
            same treatment as the eyebrow, so the eye reads
            "[big number] [tiny caption]" as a unit. */}
        <View className="items-center mt-5">
          <Text
            className="text-ink text-[44px] leading-[48px] tracking-[-1px]"
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              // Dim the number when paused so the pause state
              // reads visually before the user processes the
              // word. Same treatment as the mini-player.
              opacity: isPaused ? 0.55 : 1,
            }}
            // Tabular nums avoids the 0:00→0:01 width shift that
            // proportional digits cause; the number sits steady
            // in place as it ticks. iOS exposes this via the
            // `fontVariant` array.
            // @ts-expect-error — RN types accept this string but
            // TypeScript's typing for fontVariant is narrow.
            // The runtime correctly applies "tabular-nums".
            fontVariant={["tabular-nums"]}
          >
            {timeLabel}
          </Text>
          <Text
            className="text-ink-subtle text-[10px] tracking-[3px] uppercase mt-1"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {timeMetaLabel}
          </Text>
        </View>

        {/* Progress bar — only meaningful for time-boxed
            sessions. Animated implicitly via re-render (no
            Animated value needed for a 1Hz width tick). The
            track sits in a `border` color so light/dark each
            get a sensible faint groove. */}
        {hasDuration ? (
          <View
            className="mt-4 rounded-full overflow-hidden"
            style={{
              height: 6,
              backgroundColor: withAlpha(colors.ink, 0.08),
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${progress * 100}%`,
                backgroundColor: FOCUS_HERO_ACCENT,
                borderRadius: 999,
                // Soften the leading edge a hair so a 0%-to-3%
                // jump (first tick) doesn't look like a glitch.
                opacity: isPaused ? 0.55 : 1,
              }}
            />
          </View>
        ) : null}

        {/* Action row: Break/Resume + End. Wrapped View+Pressable
            so the outer card's onPress doesn't fire when the user
            taps a button (stopPropagation isn't reliable across
            platforms for nested Pressables; we rely on visually
            distinct hit areas and clearly-labeled buttons to
            avoid mistaps).

            Order: secondary action on the left, primary
            destructive on the right — matches iOS button-row
            convention so users find End where their thumb expects. */}
        <View className="flex-row mt-5" style={{ gap: 10 }}>
          {/* Only render Break/Resume for time-boxed sessions —
              an open-ended elapsed counter has no useful pause
              semantics, so the button would do nothing
              meaningful. Same rule as the mini-player. */}
          {hasDuration ? (
            <View style={{ flex: 1 }}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  handleTogglePause();
                }}
                accessibilityRole="button"
                accessibilityLabel={isPaused ? "Resume session" : "Pause session"}
                style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
              >
                <View
                  className="items-center justify-center rounded-2xl"
                  style={{
                    height: 48,
                    backgroundColor: withAlpha(colors.ink, 0.06),
                  }}
                >
                  <Text
                    className="text-ink text-[15px]"
                    style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                  >
                    {isPaused ? "Resume" : "Break"}
                  </Text>
                </View>
              </Pressable>
            </View>
          ) : null}
          <View style={{ flex: 1 }}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onEnd();
              }}
              accessibilityRole="button"
              accessibilityLabel="End focus session"
              style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
            >
              <View
                className="items-center justify-center rounded-2xl"
                style={{
                  height: 48,
                  backgroundColor: FOCUS_HERO_ACCENT,
                }}
              >
                <Text
                  className="text-[15px]"
                  style={{
                    fontFamily: "PlusJakartaSans_700Bold",
                    color: "#FFFFFF",
                  }}
                >
                  End
                </Text>
              </View>
            </Pressable>
          </View>
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

// ─────────────────────────────────────────────────────────────────
// LivingHeroIcon — animated sermon hero illustration
// ─────────────────────────────────────────────────────────────────
//
// Wraps the SermonCard's accent halo + illustration in two
// looping animations so the hero feels alive (the static asset
// problem that made the page feel less premium than Opal):
//
//   1. FLOAT  — the icon drifts vertically ±4pt over ~5s in a
//               sine-eased loop. Subtle enough not to distract,
//               obvious enough that the eye picks up the motion
//               on a glance. Same mechanism Opal uses to give
//               its stones their "alive" presence.
//
//   2. BREATH — the accent halo behind the icon pulses between
//               80% and 100% opacity over ~5s, offset from the
//               float so the two curves don't synchronize. Reads
//               as ambient light brightening and dimming.
//
// Both animations use native driver (useNativeDriver: true) so
// they run on the UI thread and don't compete with JS work
// (gestures, scroll, navigation). Both loop indefinitely.
//
// We deliberately don't pause when the screen is off-focus —
// the cost is negligible (two interpolated values per frame)
// and pausing would require navigation focus listeners that
// would add code surface for a non-issue.

function LivingHeroIcon({
  source,
  accent,
}: {
  source: ImageSourcePropType;
  accent: string;
}) {
  // Two separate Animated.Values so the curves run on
  // independent timelines (float is 5s sine, breath is 5.4s
  // sine — the offset prevents synchronization).
  const float = useRef(new Animated.Value(0)).current;
  const breath = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const breathLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 2700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    floatLoop.start();
    breathLoop.start();
    return () => {
      floatLoop.stop();
      breathLoop.stop();
    };
  }, [float, breath]);

  // Float interpolation: 0 → -5pt drift up at the apex, 1 → +5pt
  // drift down at the trough. ±4-5pt is the sweet spot — enough
  // to be perceptible, small enough not to feel jittery.
  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [-4, 4],
  });

  // Breath interpolation: 80% → 100% halo opacity. The halo never
  // fully fades (lower bound 0.8) so the icon always has a
  // grounded glow; we just modulate intensity.
  const haloOpacity = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  return (
    <>
      <Animated.View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
          opacity: haloOpacity,
        }}
      >
        <CardAccentGlow color={accent} />
      </Animated.View>
      <Animated.View style={{ transform: [{ translateY }] }}>
        <Image
          source={source}
          style={{ width: 184, height: 156 }}
          resizeMode="contain"
        />
      </Animated.View>
    </>
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
// StatRow — Opal-style 3-column stat triplet under the hero
// ─────────────────────────────────────────────────────────────────
//
// Three quick numbers separated by hairline dividers, with the
// row itself topped and tailed by a hairline so it reads as a
// distinct dashboard band. Each column stacks a small caps-tracked
// label over a bold value + small unit suffix.
//
// Layout (top → bottom):
//   ──────────────────────────────────────
//      STREAK      READING      BEST
//      4  days     12  min      12  days
//   ──────────────────────────────────────
//
// Why these three:
//   • STREAK    — momentum number (what brings users back today)
//   • READING   — today's engagement (against the goal)
//   • BEST      — personal best the streak chases (aspiration)
//
// Why a number + tiny unit:
//   The unit ("days", "min") rendered at ~60% the value size,
//   ink-subtle color, gives the number visual primacy without
//   losing the unit context. Same pattern Opal uses for "3m 21s".
//
// Why divider lines:
//   Opal frames its stats row with thin top/bottom rules. The
//   horizontal lines act as a magazine-style "stat band"
//   delimiter, distinct from the cards above (hero) and below
//   (verse). Without them the row would float without a sense
//   of its own region.

type StatRowProps = {
  streakCurrent: number;
  streakLongest: number;
  readingMinutes: number;
  readingGoal: number;
};

function StatRow({
  streakCurrent,
  streakLongest,
  readingMinutes,
}: StatRowProps) {
  const colors = useColors();
  return (
    <View
      style={{
        marginHorizontal: 24,
        marginTop: 26,
      }}
    >
      {/* Top hairline. Subtle border-color so it reads as
          structure not chrome. */}
      <View
        style={{
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
        }}
      />

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 16,
        }}
      >
        <Stat
          label="Streak"
          value={streakCurrent}
          unit={streakCurrent === 1 ? "day" : "days"}
        />
        <StatDivider />
        <Stat
          label="Reading"
          value={readingMinutes}
          unit="min"
        />
        <StatDivider />
        <Stat
          label="Best"
          value={streakLongest}
          unit={streakLongest === 1 ? "day" : "days"}
        />
      </View>

      {/* Bottom hairline mirrors the top. */}
      <View
        style={{
          height: StyleSheet.hairlineWidth,
          backgroundColor: colors.border,
        }}
      />
    </View>
  );
}

/**
 * useTickedNumber — animates a number from 0 up to `target` over
 * `duration` ms using ease-out-cubic. Same effect Apple's Fitness
 * rings use when the percentage counter spins up — the value
 * feels "earned" rather than just appearing.
 *
 * Implementation uses requestAnimationFrame (not Animated.Value
 * + listener, which would trigger an extra render per frame on
 * the JS thread). The hook only re-renders when the rounded
 * integer changes, so a tick from 0 → 30 fires ~30 re-renders
 * total — cheap enough to not need useNativeDriver.
 *
 * Triggers on every change to `target` so a streak increment
 * mid-session re-ticks from 0 → new value.
 */
function useTickedNumber(target: number, duration = 800): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (target <= 0) {
      setValue(0);
      return;
    }
    let start: number | null = null;
    let raf = 0;
    const step = (timestamp: number) => {
      if (start === null) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
}

function Stat({
  label,
  value,
  unit,
}: {
  label: string;
  /** Numeric value to display. Animated from 0 → value on mount. */
  value: number;
  unit: string;
}) {
  const colors = useColors();
  const ticked = useTickedNumber(value, 900);
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: colors.inkSubtle,
          fontSize: 10,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
          marginTop: 5,
        }}
      >
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: colors.ink,
            fontSize: 22,
            lineHeight: 26,
            letterSpacing: -0.4,
          }}
        >
          {ticked}
        </Text>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_500Medium",
            color: colors.inkSubtle,
            fontSize: 12,
            marginLeft: 4,
          }}
        >
          {unit}
        </Text>
      </View>
    </View>
  );
}

function StatDivider() {
  const colors = useColors();
  return (
    <View
      style={{
        width: StyleSheet.hairlineWidth,
        height: 32,
        backgroundColor: colors.border,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// StreakChip — Opal-style top-bar streak pill (🔥 4)
// ─────────────────────────────────────────────────────────────────
//
// A small flame + count pill that lives at the top-right of the
// greeting row. Mirrors Opal's home-bar streak fire icon — keeps
// the momentum number visible above the fold the moment the user
// opens the app, even before they read the greeting.
//
// Visual specs:
//   • Hairline accent-tinted border, 10% accent fill — the chip
//     should harmonize with the per-sermon accent (the rest of
//     the page is also accent-tinted) rather than introduce a
//     separate color.
//   • Stylized flame SVG (not emoji — emoji renders inconsistently
//     across iOS versions and the colors clash with our accent
//     palette). The flame uses the per-sermon accent so the chip
//     reads as part of the today-state, not a global fixture.
//   • Bold sans count — the number is the point of the chip.

function StreakChip({ count, accent }: { count: number; accent: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: withAlpha(accent, 0.32),
        backgroundColor: withAlpha(accent, 0.12),
      }}
      accessibilityRole="text"
      accessibilityLabel={`${count} day streak`}
    >
      {/* Stylized flame — simple two-curve outline. Filled with
          the per-sermon accent so the icon participates in the
          page's color story. */}
      <Svg width={11} height={13} viewBox="0 0 24 28">
        <Path
          d="M12 0c-2 4 1 6-2 9-2 2-4 4-4 8a8 8 0 0016 0c0-3-1-5-3-7-2-2 0-4-2-7-1 2-2 3-3 3 0-2 0-4-2-6z"
          fill={accent}
        />
      </Svg>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: accent,
          fontSize: 12.5,
          marginLeft: 5,
        }}
      >
        {count}
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
  streakCount,
  accent,
}: {
  days: ReadonlyArray<WeekDay>;
  prompt: string;
  /** Current streak length. When > 0 we render a bold count
   *  badge above the day cells; when 0 we render the prompt
   *  text instead so the strip never sits empty-feeling. */
  streakCount: number;
  /** Current sermon-type accent (warm orange for Daily Church,
   *  violet for Sabbath Rest, etc). All engaged-day dots use
   *  this color, so the strip visually ties to today's hero.
   *
   *  Why not per-day-type accents? Historical "what type was
   *  played on date X" data isn't tracked — we'd need to either
   *  re-derive sermon-day-for-date from rotation logic (fragile
   *  to content changes) or extend the progress store with a
   *  migration. Using today's accent for every engaged dot is
   *  a clean, intentional simplification: the strip becomes a
   *  small reflection of "this week's color", refreshed daily
   *  as the sermon rotates. */
  accent: string;
}) {
  // Streak count display swaps in over the prompt when > 0. The
  // count itself gets the accent color and a big bold treatment
  // so the user reads it as a small reward, not a stat. We keep
  // the prompt for the empty state because the count would be
  // "0 day streak" which is visually deflating.
  const hasStreak = streakCount > 0;
  return (
    <View className="rounded-2xl border border-border bg-surface px-5 py-4">
      {hasStreak ? (
        <View className="items-center">
          <View className="flex-row items-baseline">
            <Text
              className="text-[28px] leading-[32px] tracking-[-0.6px]"
              style={{
                fontFamily: "PlusJakartaSans_800ExtraBold",
                color: accent,
              }}
            >
              {streakCount}
            </Text>
            <Text
              className="text-ink text-[14px] leading-[18px] ml-1.5"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              {streakCount === 1 ? "day streak" : "day streak"}
            </Text>
          </View>
          {/* Quiet secondary line — keeps the original prompt
              copy ("3-day streak — honored today" etc.) as
              context under the count. Useful for distinguishing
              "honored today" vs "today is still waiting", which
              the number alone can't communicate. */}
          <Text
            className="text-ink-subtle text-[11.5px] leading-[16px] mt-0.5"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            {prompt}
          </Text>
        </View>
      ) : (
        <Text
          className="text-ink text-[13px] leading-[18px] text-center"
          style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
        >
          {prompt}
        </Text>
      )}
      <View className="flex-row justify-between mt-3">
        {days.map((day, i) => (
          <DayDot
            key={day.dateISO}
            dateISO={day.dateISO}
            engaged={day.engaged}
            isToday={i === days.length - 1}
            accent={accent}
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
  accent,
}: {
  dateISO: string;
  engaged: boolean;
  isToday: boolean;
  /** Color to use for engaged days + the today-outline. Sermon
   *  type accent passed down from WeekStrip → parent. */
  accent: string;
}) {
  const colors = useColors();
  // Parse the ISO date as a local date — never `new Date(iso)`,
  // which would interpret it as UTC and roll over a day for users
  // west of GMT.
  const [y, m, d] = dateISO.split("-").map(Number);
  const date = new Date(y!, (m ?? 1) - 1, d ?? 1);
  const weekday = ["S", "M", "T", "W", "T", "F", "S"][date.getDay()];

  // Three visual states (mutually exclusive):
  //   • engaged       — filled accent dot
  //   • today, unengaged — hollow dot with accent border
  //   • neither       — small muted dot (the baseline)
  let dotBg: string = colors.border;
  let dotBorder: string | undefined;
  if (engaged) {
    dotBg = accent;
  } else if (isToday) {
    dotBg = "transparent";
    dotBorder = accent;
  }

  // Engaged days get a slightly bigger dot (10 vs 8) so they
  // visually outweigh empty days — small reward each time the
  // user looks at the strip. Today-not-engaged stays at the
  // baseline 8 so the row doesn't visually jump if the user
  // hasn't honored today yet (which would otherwise read as
  // "complete" before the work is done).
  const dotSize = engaged ? 10 : 8;

  return (
    <View
      style={{
        borderWidth: 1.5,
        borderColor: isToday ? accent : "transparent",
        borderRadius: 14,
        paddingHorizontal: 5,
        paddingVertical: 4,
        alignItems: "center",
      }}
    >
      <Text
        className="text-[11px] tracking-[0.5px]"
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          // Engaged days get the accent on their letter too so
          // the "we did it" visual is read by the eye in two
          // places (letter + dot) instead of one. Today (without
          // engagement) still uses accent to mark "you are here".
          // Other days stay muted.
          color: engaged || isToday ? accent : colors.inkMuted,
        }}
      >
        {weekday}
      </Text>
      <View
        style={{
          marginTop: 6,
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
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

/**
 * Format the next-sermon arrival time as a human phrase.
 *
 * Returns one of:
 *   • "tomorrow at 7:00 AM"   — most common case (24-hour cadence)
 *   • "later today at 9:00 PM" — sermon time hasn't passed yet today
 *
 * We branch on whether the supplied reminder time has already
 * occurred today: if not, "later today" is the truth; if yes,
 * "tomorrow" is the next firing. The lowercase phrasing is
 * intentional — this label gets stitched into a sentence
 * ("Tomorrow's word arrives ${label}.") so a capital "T" would
 * read as a comma-spliced fragment.
 *
 * Locale: en-US time formatting via format12h to match the
 * "7:00 AM" style used everywhere else in the app — the timeline,
 * the reminder-picker, the notification copy. Keeping that one
 * style across surfaces means the user only ever has to parse
 * one time format.
 */
function formatNextSermonLabel(time: {
  hour: number;
  minute: number;
}): string {
  const now = new Date();
  const todayAt = new Date(now);
  todayAt.setHours(time.hour, time.minute, 0, 0);
  const formatted = format12h(time);
  return todayAt.getTime() > now.getTime()
    ? `later today at ${formatted}`
    : `tomorrow at ${formatted}`;
}

/**
 * Compact uppercase date for the sermon hero eyebrow.
 * "TUE · JUN 2" rather than "Tuesday, June 2nd" — short enough
 * to sit alongside the type name without crowding, long enough
 * that the user can tell at a glance what day this card is for.
 *
 * Reads from the device locale via `toLocaleString` so a non-US
 * locale gets sensible abbreviations. We don't pad the day
 * number (e.g. "JUN 2" not "JUN 02") because the eyebrow's
 * letter-spaced caps already give the digits enough breathing
 * room and the unpadded form feels less mechanical.
 */
function formatHeroDate(now: Date): string {
  const weekday = now
    .toLocaleString("en-US", { weekday: "short" })
    .toUpperCase();
  const month = now
    .toLocaleString("en-US", { month: "short" })
    .toUpperCase();
  return `${weekday} · ${month} ${now.getDate()}`;
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
 * Tagline that sits under the greeting on the home title row.
 *
 * Modeled on Practice's header pattern (page title + a single
 * editorial line). Mirrors the time-of-day branching the
 * greeting already does, so the two lines read as one
 * intentional voice: "Good morning, friend / Begin the day in
 * the Word."
 *
 * Tone notes:
 *   • Short. One line, max ~7 words. Anything longer pushes
 *     the title block past where the sermon hero should start.
 *   • Verb-first. Each line nudges the user toward an action
 *     (Begin / Return / Wind down / Rest) without sounding
 *     prescriptive.
 *   • Avoids "you" — feels like a quiet invitation, not a
 *     command. Same restraint Imprint and Opal use.
 *
 * Defaults to evening when given an out-of-range hour so
 * SSR/JSI clock skew never blanks the line.
 */
function getHomeTagline(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 5) return "Late grace. The Word is still here.";
  if (h < 12) return "Begin the day in the Word.";
  if (h < 17) return "Pause. Return. Be still.";
  if (h < 21) return "Wind down with today's word.";
  return "End the day in scripture.";
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
  onStartQuickFocus,
}: {
  sermonTime: { hour: number; minute: number } | undefined;
  sermonName: string;
  sermonCompleted: boolean;
  onSermonPress: () => void;
  studySessions: ReadonlyArray<StudySession>;
  activeFocusSession: { routineId?: string } | null;
  /** Quick-focus CTA. When provided, the section header renders a
   *  small "+ Focus" pill on the right. Parent decides when to
   *  pass this in (we hide it during an active session — see the
   *  parent's call site for the rationale). */
  onStartQuickFocus?: () => void;
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
      {/* Header — editorial section label, modeled on Practice's
          TemplatesSectionHeader: 19pt mixed-case title with a
          12.5pt poetic subtitle below. Replaces the older
          all-caps "TODAY'S RHYTHM" eyebrow that read like a
          settings label. The right-side "+ Focus" pill stays in
          the same slot but now top-aligns with the title (not
          the subtitle) so the pill anchors to the line that
          users actually read first.

          The previous "{N} moments" count is gone: the subtitle
          ("What's planned, what's done.") does the same framing
          job with more voice, and the user can count the rows
          themselves if they care. */}
      <View className="px-6 mb-4 flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text
            className="text-ink text-[19px] leading-[24px] tracking-[-0.2px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            Today's rhythm
          </Text>
          <Text
            className="text-ink-muted text-[12.5px] leading-[18px] mt-0.5"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            What&apos;s planned, what&apos;s done.
          </Text>
        </View>
        {onStartQuickFocus ? (
          <Pressable
            onPress={onStartQuickFocus}
            accessibilityRole="button"
            accessibilityLabel="Start a focus session"
            style={({ pressed }) => ({
              opacity: pressed ? 0.88 : 1,
              marginTop: 3,
            })}
          >
            <View
              className="flex-row items-center rounded-full"
              style={{
                paddingLeft: 9,
                paddingRight: 12,
                paddingVertical: 5,
                backgroundColor: withAlpha(FOCUS_HERO_ACCENT, 0.14),
              }}
            >
              {/* Plus glyph — same caps-tracked style as the
                  label so the pill reads as one unit. Drawn as
                  text (not SVG) to dodge an extra import; the
                  Plus Jakarta "+" sits well in the cap height. */}
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_800ExtraBold",
                  fontSize: 14,
                  lineHeight: 14,
                  color: FOCUS_HERO_ACCENT,
                  marginRight: 5,
                }}
              >
                +
              </Text>
              <Text
                className="text-[10.5px] tracking-[1.5px] uppercase"
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: FOCUS_HERO_ACCENT,
                }}
              >
                Focus
              </Text>
            </View>
          </Pressable>
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
            • upcoming — relative time label ("in 3h" etc.) + a
              small caret to signal the whole row is tappable.

            The caret was added because user testing surfaced
            that upcoming rows didn't read as actionable — the
            relative-time label alone looked like a passive
            timestamp ("Today") rather than a "tap to open"
            affordance. A `›` glyph borrowed from the iOS
            settings table-view cell is the cheapest, most
            universally understood signal. We omit it for done
            and now states because those rows communicate their
            own affordance: "done" reads as terminal, "now"
            reads as in-progress (the user already knows where
            to go to engage). */}
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
            <View className="flex-row items-center">
              <Text
                className="text-ink-subtle text-[11px]"
                style={{
                  fontFamily: "PlusJakartaSans_500Medium",
                }}
              >
                {formatRelativeUntil(item.at, Date.now())}
              </Text>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 16,
                  lineHeight: 16,
                  color: withAlpha(colors.ink, 0.32),
                  marginLeft: 6,
                  // Optical centering — the chevron glyph
                  // sits a hair high in its em-box so we
                  // nudge it down to align with the time
                  // label baseline.
                  marginTop: 1,
                }}
              >
                ›
              </Text>
            </View>
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
