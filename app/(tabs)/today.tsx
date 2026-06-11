import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  type ImageSourcePropType,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
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
import { useFocusMiniPlayerSpacing } from "@/components/FocusMiniPlayer";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import { LivingHeroIcon } from "@/components/LivingHeroIcon";
import { ShieldOverlay } from "@/components/ShieldOverlay";
import { cancelDailyReminder } from "@/lib/notifications";
import * as haptics from "@/lib/haptics";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { buildMonthGrid, type RhythmCellState } from "@/lib/rhythm";
import {
  momentDurationMin,
  nextMoment,
  resolveSermonTypeForMoment,
  type Moment,
} from "@/lib/moments";
import { formatMinutes, formatRemaining } from "@/lib/readingGoalFormat";
import { getVerseOfDay } from "@/lib/verseOfDay";
import { SOCIAL_APPS } from "@/lib/focus";
import { BrandGlyph } from "@/components/BrandGlyph";
import { findMood } from "@/constants/moods";
import { SERMON_TYPES, type SermonType } from "@/constants/sermonTypes";
import { SYSTEM_COLORS_DARK } from "@/constants/theme";
import { useAnnotations } from "@/state/annotations";
import { type CheckIn, useCheckIns } from "@/state/checkIns";
import { useDevTools } from "@/state/devTools";
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
  const {
    streak,
    hasCompletedSermonToday,
    hasCompletedSermonForDay,
    engagedDates,
  } = progress;
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
  const {
    sessions: studySessions,
    toggleSession: toggleStudySession,
    reset: resetStudySessions,
  } = useStudySessions();
  // Dev-tools opt-in. In a __DEV__ build this defaults to true and
  // the panel is always visible; in production it defaults to false
  // and only flips on if a teammate enables Settings → Developer
  // Tools. The Today screen reads `showDevTools` below to gate the
  // entire dev-panel subtree without a code change for the team.
  const { enabled: devToolsEnabled } = useDevTools();
  const showDevTools = __DEV__ || devToolsEnabled;

  // Extra bottom padding the FocusMiniPlayer needs when a focus
  // session is active. Returns 0 when no session / hidden, so the
  // padding doesn't bloat on quiet days. Without this the bigger
  // 82pt pill can occlude the last verse/streak card on the home
  // scroll.
  const focusPillSpacing = useFocusMiniPlayerSpacing();

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

  // First name still feeds the avatar initial — the greeting line
  // itself was removed from the header for a cleaner top.
  const firstName = (answers.name || "").trim().split(" ")[0] || "friend";

  // Theme tokens for the inline-styled editorial chrome (small-caps
  // eyebrows, big page title, etc). The header used to be all
  // NativeWind className tokens, but the Apple-style redesign needs
  // a few precise font sizes / tracking values that read cleaner as
  // inline style than as utility composition.
  const colors = useColors();

  // Editorial date eyebrow that sits above the page title. Apple
  // uses small-caps section markers ("## Design", "## Cameras")
  // above every editorial headline on the iPhone 17 Pro page —
  // they're what take a flat product page and turn it into something
  // that reads like the table of contents to a magazine spread.
  // Here we use the live date in the same role: a tiny line of
  // structure that anchors the page in the present moment before
  // the eye drops to the big "Today." title.
  //
  // The day's sermon type is derived from today's moment (vs. the
  // old day-of-year rotation) so the home card's accent + hero
  // match the screens you're about to walk through. We resolve via
  // `resolveSermonTypeForMoment` (not the bare `resolveSermonType`)
  // so any per-sermon `illustration` override in the catalog wins
  // over the type-level default — letting individual sermons ship
  // their own face on the home card without changing the type.
  const sermonType = useMemo(
    () => resolveSermonTypeForMoment(todaysMoment),
    [todaysMoment],
  );

  // TEMP — true when today's sermon is the Gentler-Streak A/B test
  // ("When God Feels Silent"). Drives a fully restructured top-of-
  // page layout: header chrome is hidden, the editorial hero takes
  // over the top of the screen edge-to-edge, and the regular
  // SermonCard render is skipped. See GentlerStreakSermonCard.
  const isGentlerStreakTest =
    todaysMoment.title === GENTLER_STREAK_TEST_TITLE &&
    Boolean(sermonType.illustration);
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

  const handlePlaySermon = async () => {
    // Medium-impact haptic on the primary CTA — the begin tap
    // is the moment the user commits to today's sermon, so it
    // gets a more noticeable tactile pulse than a generic row.
    haptics.tap();
    // Focus-session bring-up was previously the responsibility
    // of the sermon intro screen (the antechamber). When the
    // user removed the intro from the flow we moved that
    // responsibility here so the "Begin → focus engaged →
    // scripture" sequencing still happens BEFORE the
    // FocusBanner / panel surfaces mount and read the
    // session. Conditions match the old intro:
    //   • focus is enabled
    //   • the user has at least one app on the blocked list
    // No "skip once" affordance here — that surface lived on
    // the intro page and is gone with it. If users miss it,
    // we'll add a long-press fallback on this button.
    const focusOffered =
      focusPrefs.enabled && focusPrefs.blockedAppIds.length > 0;
    if (focusOffered) {
      // Fire-and-forget the shield call — we don't want to
      // block the user's tap on a network/permission round-
      // trip. The session is committed in local state
      // synchronously, so the navigation below safely lands
      // on a screen that already sees the active session.
      await startFocusSession(todaysMoment.day);
    }
    // Skip the legacy intro/antechamber and go straight to
    // the scripture quote screen. The verse IS the first beat
    // of the sermon now — the intro page's metadata (READ
    // 5 min, description, focus row) was demoted as redundant
    // when the home page already shows the duration and the
    // App Blocks section right below the hero handles the
    // focus surface.
    router.push("/sermon/scripture");
  };

  const handleOpenLastCheckIn = () => {
    if (!lastCheckIn) return;
    haptics.soft();
    router.push(`/check-ins/${lastCheckIn.id}` as never);
  };

  const handleOpenProfile = () => {
    // Profile is now a first-class TAB (see app/(tabs)/_layout.tsx)
    // rather than a presented drawer. The avatar tap remains as a
    // shortcut for users who learned the drawer pattern; under the
    // hood we just navigate to the profile tab so the bottom-bar
    // selection state stays in sync with where the user actually is.
    haptics.soft();
    router.navigate("/profile");
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
    // SafeAreaView is now TRANSPARENT (no bg-bg) so the
    // AmbientAtmosphere painted at the (tabs) layout level shows
    // through. The previous per-screen radial gradient was
    // hoisted into the shared AmbientAtmosphere component and
    // mounted in app/(tabs)/_layout.tsx so every tab (Today,
    // Practice, Library, Insights) glows with the same per-day
    // accent — the whole app reads as one continuous lit space
    // rather than four flat-black tabs. See AmbientAtmosphere.tsx
    // and the comments in (tabs)/_layout.tsx for the full
    // architecture.
    <SafeAreaView className="flex-1" edges={["top"]}>
      <ScrollView
        // Floating glass tab bar sits over the screen — pad the bottom
        // of the scroll so the last sections aren't hidden beneath it.
        contentContainerStyle={{
          paddingBottom: TAB_BAR_TOTAL_HEIGHT + 16 + focusPillSpacing,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Editorial header — Apple iPhone 17 Pro pattern ──────
            The previous header was a single tight row: a small
            26pt "Home" title on the left, streak chip + avatar on
            the right. Compact, but it read like an app screen
            chrome, not a page. The user feedback was direct: "the
            home page looks supppppper cheap." The fix is a
            magazine-spread treatment inspired directly by Apple's
            product pages (iPhone 17 Pro, AirPods, MacBook):
              1.  A thin top row with a small-caps date "eyebrow"
                  on the left and the existing streak chip + avatar
                  cluster on the right — the FUNCTIONAL chrome.
              2.  A huge editorial page title beneath it ("Today.")
                  set in ExtraBold with very tight tracking and a
                  period — Apple's hallmark display-headline shape
                  ("A big zoom forward.", "New dimensions in
                  power.", "Battery life. All-time high.").
              3.  Generous vertical breathing room below before the
                  hero — a deliberate top gutter that lets the
                  title land before the page begins.
            Together this gives the home page a strong typographic
            anchor and reads as a curated daily edition rather than
            a stack of cards. The avatar + streak stay in their
            existing positions so nothing is functionally lost.

            TEMP — when the Gentler-Streak A/B test sermon is the
            day's moment, the entire header chrome is suppressed
            so the editorial hero (rendered below) can take over
            the top of the screen edge-to-edge. The avatar then
            floats overlaid on the hero image itself, the way
            Gentler Streak places its profile chip. */}
        {!isGentlerStreakTest ? (
        <View className="px-6 pt-1">
          {/* Top thin row — purely chrome. ONLY the monogram
              avatar lives here now; the streak chip that used
              to share this row was promoted into the page-
              title line below so the streak signal lives on
              the user's primary horizon (the "Home" headline)
              rather than as an accessory next to the profile
              icon.
              
              We keep the row's `minHeight: 40` and end-aligned
              child so the avatar still pins to the top-right
              corner the way Apple Fitness and Apple TV anchor
              their profile pills, with no inset jump regardless
              of streak state. */}
          <View
            className="flex-row items-center justify-end"
            style={{ minHeight: 40 }}
          >
            {/* Borderless monogram avatar — matches Apple
                Fitness Summary and Apple TV's top-right
                profile pill. The previous version had a
                hairline border, which reads as "form chrome";
                Apple's avatars are pure fills. The single
                elevation step (surface above true-black bg)
                is what gives the pill its shape. */}
            <Pressable
              hitSlop={12}
              onPress={handleOpenProfile}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              className="w-10 h-10 rounded-full bg-accent-soft items-center justify-center"
            >
              <Text
                className="text-primary text-[14px]"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                {firstName.charAt(0).toUpperCase()}
              </Text>
            </Pressable>
          </View>

          {/* Page title row — "Home" on the left, a compact
              StreakHeadline pinned to the right edge on the
              same baseline. The earlier layout stacked the
              streak headline UNDER the title on its own row,
              which read as a second hero element competing
              with "Home" for the eye. Bringing it inline
              right-aligned with the title gives the streak
              the same prominence Apple Fitness gives its
              "Move +120" inline counter — present, glance-
              able, but never dominating the page name.
              
              Apple-app title shape: 32pt Bold, tight negative
              tracking, no trailing punctuation. Names the
              SCREEN. */}
          <View
            style={{
              marginTop: 10,
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
            }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: colors.ink,
                fontSize: 32,
                lineHeight: 36,
                letterSpacing: -0.8,
              }}
              accessibilityRole="header"
            >
              Home
            </Text>
            {/* Streak headline — rendered inline at the page-
                title baseline. Hidden on the zero-streak
                fallback so a brand-new user doesn't land on a
                "0 day streak" badge; we surface this only once
                the user has at least one engaged day. */}
            {streak.current > 0 ? (
              <StreakHeadline
                count={streak.current}
                longest={streak.longest}
                honoredToday={streak.honoredToday}
              />
            ) : null}
          </View>

          {/* Subsection ribbon — Apple News "Top Stories" pattern,
              one tier below the page title. Apple News uses a
              BOLD colored label above each section ("Top
              Stories", "For You", "Trending") that names the
              section AND signals editorial hierarchy through
              color alone. Same color in light + dark so the
              section identity is stable across themes.

              Typography sized to Apple's iOS Title 2 (22pt Bold)
              — never heavier than the page title above it
              (Home is 32pt Bold). The earlier 800 ExtraBold
              broke the hierarchy by making the section header
              visually outweigh its own page title. The text
              uses the same `_700Bold` family as Home so the
              two lines feel like a related pair (page →
              section) rather than competing weights.

              Color: editorial red (#E11D48 — Tailwind rose-600).
              Reads warm-serious in light, holds brand-presence
              on dark without competing with the amber streak
              flame in the title row above. */}
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: HOME_SECTION_ACCENT,
              fontSize: 22,
              lineHeight: 26,
              letterSpacing: -0.4,
              marginTop: 18,
            }}
            accessibilityRole="header"
          >
            {/* Personalize the section header with the reader's
                first name ("Kenny's Daily Devotional"). Falls
                back to plain "Daily Devotional" when we don't
                have a real name on file — `firstName` defaults
                to "friend" for the avatar fallback, but
                "friend's Daily Devotional" reads like a stock
                template, so we treat that case as nameless and
                drop the possessive entirely.

                Always append `'s` (Kenny's, Chris's, James's)
                instead of conditionally swapping to a bare
                apostrophe for names ending in `s` — modern
                style guides prefer the consistent `'s` form
                and it keeps the title visually balanced. */}
            {firstName && firstName !== "friend"
              ? `${firstName}'s Daily Devotional`
              : "Daily Devotional"}
          </Text>
        </View>
        ) : null}

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
        {/* TEMP — Gentler-Streak full-bleed editorial hero.
            When today is the A/B test sermon ("When God Feels
            Silent") the card takes over the top of the page
            edge-to-edge, with the avatar floating overlaid on
            the image (the regular header was suppressed above).
            No FadeIn wrapper, no top margin — the image IS the
            page top. Remove this block (and the
            GentlerStreakSermonCard component) to revert. */}
        {isGentlerStreakTest && sermonType.illustration ? (
          <GentlerStreakSermonCard
            illustration={sermonType.illustration}
            title={todaysMoment.title}
            blurb={GENTLER_STREAK_TEST_BLURB}
            closer={GENTLER_STREAK_TEST_CLOSER}
            firstName={firstName}
            // Drives the "NEW" badge — pill renders only when
            // today's devotional hasn't been completed yet so
            // a returning reader doesn't see a permanent label
            // on a card they've already read.
            completed={hasCompletedSermonForDay(todaysMoment.day)}
            onPress={handlePlaySermon}
            onProfilePress={handleOpenProfile}
          />
        ) : (
        <FadeIn delayMs={80} durationMs={900}>
          {/* No px-6 here — the SermonCard now paints an
              ambient radial halo that needs to bleed edge-to-
              edge of the screen. The card's internal content
              manages its own horizontal padding.

              Top gap: 32pt — calibrated against the new 44pt
              editorial title above. Apple gives display
              headlines a real beat of silence before the hero
              shot (their iPhone 17 Pro page even uses a
              full-bleed scroll spacer). 32pt is the Closer
              equivalent: enough room that the title lands and
              isn't visually colliding with the card, not so
              much that the hero gets pushed below the fold on
              the smallest iPhone SE viewport. */}
          <View style={{ marginTop: 32 }}>
            {/* Hero is the SermonCard — full stop. Earlier builds
                swapped in an ActiveFocusHero whenever a focus
                session was running, but the user asked for the
                hero to stay anchored on today's sermon
                regardless of focus state. Focus sessions still
                run in the background (the mini-player at the
                tab bar surfaces the active session as an
                ambient strip + escape hatch); the home page is
                consistently sermon-first now. SermonCard
                handles its own completed-vs-unheard branching
                internally (forward-look subtitle when
                completed, "Begin" pill when not). */}
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
                // Day number anchors the carousel's preview lookups
                // into the 90-day catalog so the next-day cards
                // show their actual titles ("I Don't Know How To
                // Pray Anymore") rather than the sermon-type label.
                currentDay={todaysMoment.day}
                // Per-day check: ask "did the user complete the
                // sermon FOR THE MOMENT we're currently showing?"
                // not just "did the user complete any sermon
                // today?" The dev "Next Sermon" pill swaps the
                // shown moment to a different catalog day without
                // recording a completion against it, so the
                // coarse `hasCompletedSermonToday` would leave
                // this card stuck in its post-completion "Read
                // Again" state for a sermon the user has never
                // actually heard.
                completed={hasCompletedSermonForDay(todaysMoment.day)}
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
          </View>
        </FadeIn>
        )}

        {/* ─── App Blocks — scheduled focus rituals ────────────────
            The user explicitly asked for a list of "the times the
            user has set for App Blocks" with toggles, sitting
            directly under today's sermon. These are the same
            study-session routines that previously lived in the
            Practice tab — now that Practice is collapsed into
            Home + Profile, the routines live here so the user
            can glance at "what blocks am I committed to" without
            navigating away from the home page.
            
            Each row is the canonical iOS schedule row:
              • Title (routine name)
              • Subtitle (time · weekdays)
              • Trailing Switch (enabled/disabled)
            
            Tapping the row navigates to the per-routine editor;
            the switch is an independent affordance that toggles
            enabled state without leaving the page.
            
            We use FadeIn delay 90 (between the sermon card's 80
            and the rhythm section's 100) so the section eases in
            as part of the page's staggered entrance choreography. */}
        <FadeIn delayMs={90} durationMs={800}>
          <View style={{ marginTop: 44 }}>
            <View className="px-6" style={{ marginBottom: 16 }}>
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: colors.ink,
                  fontSize: 22,
                  lineHeight: 26,
                  letterSpacing: -0.4,
                }}
                accessibilityRole="header"
              >
                App Blocks
              </Text>
            </View>
            <AppBlocksList
              sessions={studySessions}
              onToggle={(id) => {
                // Fire-and-forget — toggleSession is async because
                // it reschedules the OS notification, but the local
                // state update is synchronous so the switch feels
                // instant. Errors are swallowed inside the provider.
                haptics.tap();
                void toggleStudySession(id);
              }}
              onAdd={() => {
                haptics.soft();
                router.push("/settings/study-sessions");
              }}
            />
          </View>
        </FadeIn>

        {/* ─── Your rhythm (supporting beat) ──────────────────────
            Apple's dark apps (Fitness, Games, TV) all anchor their
            sections with a single LARGE BOLD HEADLINE — not a
            small-caps eyebrow. The previous iteration here used
            "## Design"-style 11pt eyebrows borrowed from Apple's
            product MARKETING pages (apple.com/iphone-17-pro), but
            the user's brief is the dark APPS (Fitness Summary,
            Games Home, TV Watch Now). Those use a different
            convention:

              • Headline: 24pt Bold, left-aligned, near-white.
                ("Watch Now", "Continue Watching", "Workouts For
                You", "What We're Playing")
              • Optional trailing chevron / "See All" on the right.
              • One full line of breathing room before the content.

            Bumping to the Apple-app recipe is the single biggest
            move toward the Fitness/TV/Games aesthetic — small-caps
            eyebrows read editorial/print, but the user wants the
            app-shaped product feel of Apple's first-party apps. */}
        <FadeIn delayMs={100} durationMs={800}>
          <View style={{ marginTop: 44 }}>
            <View className="px-6">
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: colors.ink,
                  fontSize: 22,
                  lineHeight: 26,
                  letterSpacing: -0.4,
                }}
                accessibilityRole="header"
              >
                Your rhythm
              </Text>
            </View>
            {/* HabitKit-style current-month calendar heatmap.
                Each cell is a day in the current month; lit
                cells mark days the user completed a sermon
                (driven by `progress.engagedDates`). The grid
                IS the rhythm — replaces the previous three-up
                stat strip (streak / reading / best) because
                the strip surfaced numbers without pattern,
                and the user's brief is "I want to see the
                habit I'm creating."

                The home card shows only the current month so
                the eye lands on "where am I at, this month?"
                The full multi-year history with stats lives
                behind the tap → /rhythm detail page. */}
            <RhythmGrid
              engagedDates={engagedDates}
              onOpenDetail={() => {
                haptics.soft();
                router.push("/rhythm");
              }}
            />
          </View>
        </FadeIn>

        {/* ─── Scripture for today (supporting beat) ───────────────
            Same Apple-app recipe as "Your rhythm" — 24pt Bold
            headline, left-aligned, full white. This makes the home
            page read as a curated rail of sections (Fitness's
            Summary → Workouts → Meditations rhythm; TV's Watch
            Now → Continue Watching → Apple Originals rhythm).

            Top margin sits on the same 44pt drum as the rhythm
            section so the page has a consistent vertical pulse.
            Eyebrow-to-card gap is 16pt — wider than the previous
            14pt so the bigger headline has room to breathe before
            the verse card. */}
        <FadeIn delayMs={130} durationMs={800}>
          <View style={{ marginTop: 44 }} className="px-6">
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: colors.ink,
                fontSize: 22,
                lineHeight: 26,
                letterSpacing: -0.4,
                marginBottom: 16,
              }}
              accessibilityRole="header"
            >
              Today's verse
            </Text>
            <VerseOfDay accent={sermonType.accent} />
          </View>
        </FadeIn>

        {/* Browse all rail was removed at the user's request —
            home is now a focused funnel (Daily Devotional →
            App Blocks → rhythm → verse) and the other sermon
            types live exclusively on the Library tab. */}

        {/*
            ═══════════════════════════════════════════════════════════
            HOME PAGE STOPS HERE.

            Phase 10C declutter: removed Today's rhythm timeline,
            "Your practice" section header, WeekStrip, ReadingPill,
            RoutineCard, and LastCheckInCard from the home screen.

            Why — the user feedback was clear: the home was reading
            like a "put everything next to each other for the sake
            of it" stack. Opal's home is comparatively bare — a hero
            object and one or two supporting strips, then it ENDS.
            The rest of the app lives in dedicated tabs (My Apps,
            Insights, etc).

            Closer's home is now the same posture:
              1. Greeting + streak chip + tagline    (top-of-page personality)
              2. Sermon hero                          (the day's invitation)
              3. 3-stat row                           (gentle progress signal)
              4. Verse for today                      (the second sacred moment)
            …and that's it.

            The cut sections aren't deleted from the app — they live
            on more appropriate tabs:
              • Today's rhythm / RoutineCard → Practice tab (which
                already has the routines + study sessions).
              • WeekStrip                    → Insights tab (which
                already has the deep streak/history visualizations
                — the chip in the header keeps the streak signal on
                home for emotional continuity).
              • ReadingPill                  → Practice tab (paired
                with the Bible-study routine that drives it).
              • LastCheckInCard              → already accessible from
                the check-in flow / Insights timeline; cutting it
                from home reduces a "yesterday's history" feel from
                a screen meant to invite today's practice.

            The dev tools section below stays — see the gate
            immediately below for the visibility logic (kept on in
            __DEV__, opt-in for production-channel testers).
            ═══════════════════════════════════════════════════════════ */}

        {/* ─── Dev tools ────────────────────────────────────────────
            Gated behind `showDevTools` (= __DEV__ OR the persisted
            user opt-in from Settings → Developer Tools). In a local
            __DEV__ build this is always true so nothing changes for
            day-to-day development; in production builds the subtree
            stays hidden until a teammate flips the toggle on. That
            opt-in path is what lets the team QA a production-channel
            install (TestFlight / internal distribution) without
            cutting a custom build — see state/devTools.tsx for the
            persistence + defaults.

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
        {showDevTools && (
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

// ─────────────────────────────────────────────────────────────────
// AppBlocksList — the schedule list shown directly under today's
// sermon on the home page.
//
// Each row corresponds to a StudySession (the canonical persisted
// shape for "a recurring time the user has committed to read
// scripture + optionally silence distracting apps"). The row
// surfaces the routine name + a time/days subtitle + a Switch
// that toggles the routine's `enabled` flag (which also schedules
// or cancels the OS notification in state/studySessions.tsx).
//
// Empty state: invitational copy + tappable card pointing to the
// study-sessions editor. We don't surface this rail when there
// are no routines because an empty list with just "Add a block"
// reads as half-built; the empty card communicates the same
// invitation with more presence.
// ─────────────────────────────────────────────────────────────────

function AppBlocksList({
  sessions,
  onToggle,
  onAdd,
}: {
  sessions: ReadonlyArray<StudySession>;
  onToggle: (id: string) => void;
  onAdd: () => void;
}) {
  const colors = useColors();

  // Both empty + populated states share the same surface (rounded
  // card on the page-surface fill) and end with the same "+ Add a
  // time" action row. The only difference is whether any block
  // rows render above it. This keeps the affordance to add a
  // block in the SAME visual location regardless of state — the
  // user always knows where to tap, and the section never
  // collapses to zero height (an empty list with just a button
  // would feel half-built).
  return (
    <View className="px-6">
      <View
        style={{
          borderRadius: 16,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          overflow: "hidden",
        }}
      >
        {sessions.map((session) => (
          <AppBlockRow
            key={session.id}
            session={session}
            onToggle={() => onToggle(session.id)}
          />
        ))}
        {/* Only show the "Add a time" row when there's NO time
            yet. The App Block is meant for the single daily
            sermon — capping at one keeps the section from
            inflating into a calendar of routines and matches
            the same one-time rule the settings editor enforces.
            Tap the existing row to manage it (toggle here,
            edit via /settings/study-sessions). */}
        {sessions.length === 0 ? (
          <AppBlockAddRow onPress={onAdd} hasItems={false} />
        ) : null}
      </View>
    </View>
  );
}

function AppBlockRow({
  session,
  onToggle,
}: {
  session: StudySession;
  onToggle: () => void;
}) {
  const colors = useColors();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.border,
      }}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        {/* Time leads (Apple Calendar / iOS Alarms pattern — the
            primary line of a scheduled-event row is WHEN it
            happens, not what it's named). The routine's user-
            given name lives as the subtitle so power users who
            named their sessions ("Morning Devotion") still see
            them, but the row reads cleanly at a glance for
            users who haven't named anything. */}
        <Text
          style={{
            fontFamily: "PlusJakartaSans_600SemiBold",
            color: colors.ink,
            fontSize: 17,
            lineHeight: 22,
            letterSpacing: -0.2,
          }}
          numberOfLines={1}
        >
          {formatTimeOfDay(session.time)}
        </Text>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_400Regular",
            color: colors.inkMuted,
            fontSize: 13,
            lineHeight: 18,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {formatDaysOfWeek(session.daysOfWeek)} ·{" "}
          {formatAppCount(session.blockedAppIds.length)}
        </Text>
      </View>
      <Switch
        value={session.enabled}
        onValueChange={(next) => {
          haptics.tick();
          onToggle(next);
        }}
        // iOS-style green track for on, neutral surface for off —
        // matches Settings.app affordance so the toggle reads as
        // "this is the system switch" without any custom learning.
        ios_backgroundColor={colors.border as string}
        accessibilityLabel={`Toggle block at ${formatTimeOfDay(session.time)}`}
      />
    </View>
  );
}

/**
 * AppBlockAddRow — the always-present "+ Add a time" footer row.
 * Apple Calendar / iOS Settings put the create affordance at the
 * bottom of the list (rather than as a separate floating button)
 * so the action is anchored to the same surface as the items
 * it creates. Tap → opens the existing study-session editor
 * where the user picks a time + the apps to quiet.
 */
function AppBlockAddRow({
  onPress,
  hasItems,
}: {
  onPress: () => void;
  hasItems: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Add a time and apps to block"
      style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 14,
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: colors.primary,
            alignItems: "center",
            justifyContent: "center",
            marginRight: 12,
          }}
        >
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 5v14M5 12h14"
              stroke={colors.primaryFg}
              strokeWidth={3}
              strokeLinecap="round"
            />
          </Svg>
        </View>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_600SemiBold",
            color: colors.ink,
            fontSize: 17,
            lineHeight: 22,
            letterSpacing: -0.2,
          }}
        >
          {hasItems ? "Add another time" : "Add a time and apps to block"}
        </Text>
      </View>
    </Pressable>
  );
}

function formatTimeOfDay(t: { hour: number; minute: number }): string {
  const h12 = t.hour === 0 ? 12 : t.hour > 12 ? t.hour - 12 : t.hour;
  const period = t.hour >= 12 ? "PM" : "AM";
  const minute = t.minute.toString().padStart(2, "0");
  return `${h12}:${minute} ${period}`;
}

function formatDaysOfWeek(days: ReadonlyArray<number>): string {
  if (days.length === 0) return "Off";
  if (days.length === 7) return "Daily";
  const sorted = [...days].sort();
  const weekdays = [1, 2, 3, 4, 5];
  const weekend = [0, 6];
  const sameAs = (a: number[], b: number[]) =>
    a.length === b.length && a.every((v, i) => v === b[i]);
  if (sameAs(sorted, weekdays)) return "Mon–Fri";
  if (sameAs(sorted, weekend)) return "Sat & Sun";
  const abbr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return sorted.map((d) => abbr[d]).join(", ");
}

/**
 * formatAppCount — "5 apps" / "1 app" / "no apps" for the App
 * Blocks row subtitle. Pluralization is hand-rolled (no
 * Intl.PluralRules dep) since the row is English-only for now
 * and the rule is trivial.
 */
function formatAppCount(n: number): string {
  if (n === 0) return "no apps";
  if (n === 1) return "1 app";
  return `${n} apps`;
}

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
    // Apple-style editorial pull-quote treatment. The previous
    // version was a small card with a 10pt eyebrow, a 17pt verse
    // body, and a tight 16pt vertical padding — it read as a
    // chip, not a moment. Apple's product pages give scripture-
    // sized content (their quotes, their critic reviews, their
    // hero copy) a generous full-width treatment: big editorial
    // body type, an oversized opening glyph as a visual anchor,
    // and an attribution that sits a beat below in small caps.
    //
    // Recipe:
    //   • Wash retains the per-sermon accent tint at ~5–6% so
    //     the verse stays part of the same color family as the
    //     sermon hero above. Border tint matches.
    //   • Pull-quote opening glyph (the curly quotation mark)
    //     is rendered ONCE at the top-left at display size,
    //     accent-colored. It does the job of the old eyebrow:
    //     signals "topic = scripture" before the eye reads a
    //     single word.
    //   • Verse body is bumped to 22pt with 30pt leading —
    //     about 30% bigger than before. Big enough to feel
    //     like a real quote, not so big that 3-line verses
    //     wrap into a wall.
    //   • Reference sits below with a thin rule and small-caps
    //     attribution — Apple's "— Critic, Publication" review
    //     pattern, applied to scripture.
    //
    // We removed the internal eyebrow because the section
    // header ("FROM SCRIPTURE") now lives at the parent level
    // (see TodayScreen). Two stacked small-caps eyebrows would
    // have been redundant.
    // Apple-style borderless inset card. The previous version was a
    // tinted box: accent-wash fill + accent-tinted hairline border.
    // Reads "tagged content" — which is fine for editorial product
    // pages, but Apple's dark APPS (Fitness, TV, Games) don't use
    // colored borders. They use a single shared surface elevation
    // (#1C1C1E, iOS systemGray6 dark) and let CONTENT carry color.
    //
    // Recipe now matches Apple Fitness's "What's New" cards and
    // Apple TV's content rows:
    //   • Surface fill — `colors.surface` (#1C1C1E) so the card
    //     reads as the same material as every other card in the
    //     app. The "lift" comes from being a single shade above
    //     true-black bg, not from a border.
    //   • NO border. Apple kills borders in their dark apps; the
    //     value step from bg to surface IS the edge.
    //   • Color still flows through the content — the oversized
    //     opening quote glyph and the reference label both carry
    //     the per-sermon accent. The CHROME is monochromatic, the
    //     CONTENT is colorful. (Same recipe as Apple TV's content
    //     thumbnails — neutral chrome, vivid poster art.)
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 22,
        paddingHorizontal: 24,
        paddingTop: 22,
        paddingBottom: 22,
      }}
      accessibilityRole="summary"
      accessibilityLabel={`Verse for today: ${verse.text} — ${verse.reference}`}
    >
      {/* Display-sized opening quote glyph. Acts as the section
          anchor inside the card — color matches the per-sermon
          accent so the verse visually belongs to the same family
          as the hero. lineHeight is tight so the glyph hugs the
          top edge and doesn't push the verse body down. */}
      <Text
        style={{
          fontFamily: "PlusJakartaSans_800ExtraBold",
          color: accent,
          fontSize: 56,
          lineHeight: 56,
          marginBottom: -8,
        }}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {"\u201C"}
      </Text>

      {/* Verse body — display-size, near-zero letter-spacing,
          generous leading so multi-line verses breathe. The
          opening glyph above doubles as the quotation mark, so
          the body itself starts unquoted to avoid stacking two
          quote characters at the top.

          Closing quote stays inline at the end of the body
          (matches the Apple Books / iBooks treatment — the
          opening quote is display-sized and decorative, the
          closing one is just a typographic period). */}
      <Text
        style={{
          fontFamily: "PlusJakartaSans_500Medium",
          color: colors.ink,
          fontSize: 22,
          lineHeight: 30,
          letterSpacing: -0.4,
        }}
      >
        {verse.text}
        {"\u201D"}
      </Text>

      {/* Thin attribution divider — Apple's review-quote pattern
          uses a tiny accent-colored bar to signal the citation
          handoff between body and source. */}
      <View
        style={{
          marginTop: 18,
          height: 1,
          width: 24,
          backgroundColor: withAlpha(accent, 0.5),
        }}
      />

      {/* Reference — small-caps attribution, same 11pt / 2.4
          tracking recipe as the page-level eyebrows so the
          page reads as one editorial system. Tinted with the
          accent (not inkSubtle) so it carries a hint of the
          sermon family color into the bottom of the card. */}
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: accent,
          fontSize: 11,
          letterSpacing: 2.4,
          textTransform: "uppercase",
          marginTop: 10,
        }}
      >
        {verse.reference}
      </Text>
    </View>
  );
}

// BrowseRail + BrowseTile were removed when the user dropped the
// "Browse all" section from the home page. The Library tab is now
// the sole surface for discovering other sermon types, so the
// home-page poster rail no longer earned its scroll budget.
// (Git history preserves the previous implementation if we ever
// want to resurrect a rail on another surface — Profile, perhaps.)

// ─────────────────────────────────────────────────────────────────
// SermonCard — the visual anchor of the home screen
// ─────────────────────────────────────────────────────────────────

type SermonCardProps = {
  type: SermonType;
  title: string;
  subtitle: string;
  pastor: string;
  durationMin: number;
  /** 1-based day number of today's moment in the catalog. Used by
   *  the carousel variant to look up the NEXT two moments by day
   *  (so preview cards show the real sermon titles from the
   *  vault, not just the sermon-type names rotating through
   *  SERMON_TYPES). The legacy non-carousel SermonCard branches
   *  ignore this. */
  currentDay: number;
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

// ─────────────────────────────────────────────────────────────────
// TEMP: Gentler-Streak-style editorial hero card (test variant)
//
// One-off A/B test of an editorial home hero modeled on Gentler
// Streak's "Day to Rest and Recover" card: a single rounded
// surface with a full-bleed illustration on top and a soft body
// section beneath holding a personal greeting, the title, and a
// 3–4 sentence editorial blurb. The whole card is the tap target
// (small play affordance in the title row mirrors Gentler
// Streak's eye glyph) so the layout reads as a "magazine cover"
// rather than a button stack.
//
// Currently gated to the "When God Feels Silent" sermon so we
// can preview the layout side-by-side with the existing
// ImprintSermonCard for every other day of the catalog. The copy
// is hardcoded here for the test — if the layout sticks we'll
// promote the blurb to a per-sermon `blurb` field on
// sermons.js and lift this component into its own file.
// ─────────────────────────────────────────────────────────────────

const GENTLER_STREAK_TEST_TITLE = "When God Feels Silent";

// Editorial blurb shown beneath the title. Split into a quiet
// "context" paragraph (regular weight, muted ink) and a punchy
// closing line (heavier weight, full ink) that lands as the
// real invitation — the same one-two beat Apple News and
// Gentler Streak use in their hero cards (long calm setup,
// short bold payoff). The previous draft included a third
// "There's a man in scripture named Lazarus…" sentence between
// the two, which broke the rhythm by inserting a scriptural
// example before the reader was asked to lean in. Removed at
// the user's request so the closing invitation lands sooner.
const GENTLER_STREAK_TEST_BLURB =
  "Many of us have felt God has gone quiet at some point — like our prayers are hitting a ceiling and nothing is coming back.";
const GENTLER_STREAK_TEST_CLOSER =
  "Today's devotional is for anyone who has ever sat in that silence.";

function GentlerStreakSermonCard({
  illustration,
  title,
  blurb,
  closer,
  firstName,
  completed,
  onPress,
  onProfilePress,
}: {
  illustration: ImageSourcePropType;
  title: string;
  /** Long-form context paragraph (regular weight, muted ink). */
  blurb: string;
  /** Short closing invitation line (heavier weight, full ink) —
   *  the editorial payoff that justifies the Read Now CTA right
   *  underneath. */
  closer: string;
  firstName: string;
  /** True if the user has already completed today's devotional —
   *  drives the "NEW" badge: shown ONLY for unread devotionals so
   *  the pill reads as "fresh content waiting for you" rather
   *  than a permanent label on the card. */
  completed: boolean;
  onPress: () => void;
  onProfilePress: () => void;
}) {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  // Safe-area top inset — used to push the hero image UP behind
  // the status bar so the photo bleeds to the top edge of the
  // screen (Gentler Streak's pattern). The parent SafeAreaView
  // adds insets.top of padding to ScrollView content; we negate
  // it here on the image View so this single card escapes the
  // safe area while the rest of the page stays safely inside.
  const insets = useSafeAreaInsets();

  // Time-of-day greeting — Gentler Streak's "Hi Alex," softened
  // with a part-of-day cue so the card reads as a current,
  // present-tense address rather than a generic salutation. The
  // SALUTATION (Good morning, /Good evening,) sits in muted ink;
  // the NAME pops in the editorial red so the user's own name
  // becomes the warm anchor of the page — same accent the
  // "Daily Devotional" header used on the previous home layout
  // so the brand voice carries through even with that header
  // dropped.
  const { salutation, name } = useMemo(() => {
    const hour = new Date().getHours();
    const resolvedName =
      firstName && firstName !== "friend" ? firstName : "friend";
    let salute: string;
    if (hour < 12) salute = "Good morning, ";
    else if (hour < 17) salute = "Good afternoon, ";
    else if (hour < 22) salute = "Good evening, ";
    else salute = "Hi, ";
    return { salutation: salute, name: resolvedName };
  }, [firstName]);

  // Hero image height tuned to mirror Gentler Streak's
  // proportion — the illustration takes roughly the upper
  // third of an iPhone Pro viewport (~35%, not half), so the
  // body section ("Hi {name}," + title + blurb) gets real room
  // to breathe beneath it instead of crowding the bottom edge.
  // 320pt = ~37% of an iPhone 14 Pro (844pt) and ~48% of an
  // iPhone SE (667pt), keeping the image dominant on small
  // viewports without overwhelming the body on the standard
  // Pro size. NOTE: this is the VISIBLE height inside the
  // safe-area-respecting layout flow. The actual rendered
  // image View is `heroHeight + insets.top` tall and uses a
  // negative top margin to reach pixel y=0 of the screen, so
  // the photo bleeds behind the status bar.
  const heroHeight = 320;

  return (
    <View style={{ width: "100%" }}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Begin ${title}`}
        style={({ pressed }) => ({ opacity: pressed ? 0.97 : 1 })}
      >
        {/* ── Hero illustration — FULL-BLEED, behind status bar ─
            No card chrome, no rounded corners, no border. The
            image IS the top of the page (Gentler Streak's
            "Day to Rest and Recover" pattern). Closer's
            illustrations ship with baked-in dark backdrops so
            the hero gets a true-black fallback fill — the photo
            sits on that without exposing the page bg where the
            image doesn't fully cover.

            Negative top margin equal to the safe-area inset
            pulls the View up so its top edge sits at pixel y=0
            of the screen (behind the iOS status bar). The
            View's height is grown by the same amount so the
            visible photo area still measures `heroHeight` from
            below the status bar down — i.e. layout consumption
            stays at `heroHeight` while the rendered image
            extends UPWARD into the inset region. The previous
            hard horizontal line where the status-bar safe area
            ended and the image began is gone. */}
        <View
          style={{
            width: screenWidth,
            height: heroHeight + insets.top,
            marginTop: -insets.top,
            backgroundColor: "#000000",
            position: "relative",
          }}
        >
          <Image
            source={illustration}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            transition={300}
            accessibilityIgnoresInvertColors
          />

          {/* Top legibility fade — dark gradient under the
              status bar so the iOS time/icons (and our overlaid
              NEW badge + profile chip) read cleanly against any
              photo crop. Sized to cover the safe-area inset plus
              ~64pt below it. */}
          <Svg
            pointerEvents="none"
            width={screenWidth}
            height={insets.top + 64}
            style={{ position: "absolute", top: 0, left: 0 }}
          >
            <Defs>
              <LinearGradient
                id="gentlerHeroTopFade"
                x1="0"
                y1="0"
                x2="0"
                y2={insets.top + 64}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0" stopColor="#000000" stopOpacity={0.45} />
                <Stop offset="1" stopColor="#000000" stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect
              width={screenWidth}
              height={insets.top + 64}
              fill="url(#gentlerHeroTopFade)"
            />
          </Svg>

          {/* Bottom dissolve — tiny feather that just kisses
              the lower edge into the page bg without
              shadowing the focal subject. Iteration history:
              v1 140pt (heavy blur on lower half), v2 72pt
              (still felt like a haze), v3 (this) 36pt — only
              the last ~11% of the hero dissolves, which kills
              the hard seam without painting any of the image
              itself. Theme-aware via colors.bg. */}
          <Svg
            pointerEvents="none"
            width={screenWidth}
            height={36}
            style={{ position: "absolute", bottom: 0, left: 0 }}
          >
            <Defs>
              <LinearGradient
                id="gentlerHeroBottomFade"
                x1="0"
                y1="0"
                x2="0"
                y2={36}
                gradientUnits="userSpaceOnUse"
              >
                <Stop offset="0" stopColor={colors.bg} stopOpacity={0} />
                <Stop offset="1" stopColor={colors.bg} stopOpacity={1} />
              </LinearGradient>
            </Defs>
            <Rect
              width={screenWidth}
              height={36}
              fill="url(#gentlerHeroBottomFade)"
            />
          </Svg>

          {/* "NEW" badge — Gentler-Streak's "Highlight" pill
              equivalent. Surfaced only when the user has NOT
              yet completed today's devotional so the pill
              functions as a "fresh, waiting for you" cue
              rather than a permanent label. Dark capsule with
              white uppercase text reads against either a dark
              illustration or a light one because the
              top-fade above gives it a guaranteed contrast
              floor. Offset by insets.top so it lands just
              below the status bar. */}
          {!completed ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: insets.top + 10,
                left: 16,
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                backgroundColor: "rgba(0, 0, 0, 0.78)",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: "rgba(255, 255, 255, 0.12)",
              }}
              accessibilityElementsHidden
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 11,
                  letterSpacing: 1.8,
                }}
              >
                NEW
              </Text>
            </View>
          ) : null}

          {/* Profile avatar overlay — pinned to the image's
              top-right corner, same monogram chip we use in
              the regular home header. Offset by insets.top so
              it clears the status bar. */}
          <Pressable
            hitSlop={12}
            onPress={onProfilePress}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
            style={({ pressed }) => ({
              position: "absolute",
              top: insets.top + 8,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255, 255, 255, 0.18)",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.28)",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 14,
              }}
            >
              {firstName.charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        </View>

        {/* ── Body section — sits flush against page bg ──────
            No card chrome. Reads as page-native editorial
            content the way Gentler Streak's body sits flush on
            the white sheet beneath the illustration band.
            Generous horizontal padding (22pt) matches the
            sermon panel's reading rhythm. */}
        <View style={{ paddingHorizontal: 22, paddingTop: 22, paddingBottom: 26 }}>
          {/* Personal greeting — quiet salutation in muted ink
              ("Good morning, ") with the NAME in editorial red
              so the user's own name becomes the warm anchor at
              the top of the page. Same #E11D48 the previous
              "Daily Devotional" section header used so the
              brand accent carries through even after that
              header was suppressed. */}
          <Text
            style={{
              fontSize: 15,
              lineHeight: 20,
              letterSpacing: -0.1,
            }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                color: colors.inkMuted,
              }}
            >
              {salutation}
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: HOME_SECTION_ACCENT,
              }}
            >
              {name}
            </Text>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                color: colors.inkMuted,
              }}
            >
              .
            </Text>
          </Text>

          {/* Editorial title — ExtraBold (heavier than the
              earlier 700 Bold) and tighter tracking so the
              page anchor lands with real weight, the way
              Gentler Streak's "Day to Rest and Recover" does.
              The standalone play-glyph chip that used to sit
              to its right was dropped — with a real "Read Now"
              CTA at the bottom of the card the small chip
              became a duplicate affordance competing with the
              primary button for the eye. */}
          <Text
            style={{
              fontFamily: "PlusJakartaSans_800ExtraBold",
              color: colors.ink,
              fontSize: 30,
              lineHeight: 36,
              letterSpacing: -0.8,
              marginTop: 6,
            }}
            accessibilityRole="header"
          >
            {title}
          </Text>

          {/* Editorial blurb — long context paragraph in
              regular weight, muted ink. Same body type as the
              sermon panels (Plus Jakarta 16/24) so the home
              preview reads of-a-piece with the prose the
              reader will meet inside the sermon. */}
          <Text
            style={{
              fontFamily: "PlusJakartaSans_400Regular",
              color: colors.inkMuted,
              fontSize: 16,
              lineHeight: 24,
              letterSpacing: -0.1,
              marginTop: 14,
            }}
          >
            {blurb}
          </Text>

          {/* Closing line — punchier weight + full ink color so
              this lands as the real INVITATION at the end of
              the editorial setup. Apple News pull-quote energy:
              short, heavier, sits on the reader's mind as the
              last thing they read before the CTA. */}
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.ink,
              fontSize: 17,
              lineHeight: 24,
              letterSpacing: -0.2,
              marginTop: 14,
            }}
          >
            {closer}
          </Text>

          {/* Read Now CTA — primary editorial button, editorial
              red to match the brand accent established by the
              greeting's name color. Full-width pill consistent
              with the sermon flow's Continue pill so the visual
              language of "tap this to begin" is uniform from
              home → sermon → completion. */}
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={completed ? "Read again" : "Read now"}
            style={({ pressed }) => ({
              marginTop: 22,
              backgroundColor: HOME_SECTION_ACCENT,
              borderRadius: 999,
              paddingVertical: 16,
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.92 : 1,
              shadowColor: HOME_SECTION_ACCENT,
              shadowOpacity: 0.32,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4,
            })}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 15,
                letterSpacing: 0.2,
                marginRight: 10,
              }}
            >
              {completed ? "Read Again" : "Read Now"}
            </Text>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="#FFFFFF"
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

function SermonCard({
  type,
  title,
  subtitle,
  pastor,
  durationMin,
  currentDay,
  completed,
  nextSermonLabel,
  onPress,
}: SermonCardProps) {
  // Surface color drives the bottom fade-out of the full-bleed
  // hero so the image dissolves into the body section instead
  // of stopping at a hard edge. Theme-aware so light mode fades
  // to white-ish surface, dark mode fades to near-black.
  const colors = useColors();

  // ──────────────────────────────────────────────────────────────
  // IMPRINT-STYLE SELF-CONTAINED CARD (v2)
  //
  // When the sermon type ships an `illustration` asset we render a
  // wholly different layout: a single rounded card holding the
  // illustration (top ~60%) and a dark interior section
  // (bottom ~40%) with title + sub + CTA pill stacked centrally.
  // Pagination dots sit just below the card as a "more available"
  // visual cue (decorative for now — carousel functionality can
  // wire in later without redesigning the card).
  //
  // Why an EARLY RETURN rather than a third branch in the existing
  // ternary: the Imprint card is fully self-contained — title /
  // sub / CTA all live INSIDE the card — so the body block that
  // sits beneath the hero in the other two modes would render
  // twice if we left it in the same tree. The cleanest separation
  // is to return the whole layout here and let the rest of the
  // function handle the two legacy modes unchanged.
  //
  // Tap target: the Pressable still wraps the whole card so any
  // tap on the surface dispatches `onPress` (sermon intro). The
  // CTA pill inside is a visual affordance, not a separate hit
  // zone — same shape as the existing PlayPill / ReadAgainPill.
  // ──────────────────────────────────────────────────────────────
  if (type.illustration) {
    return (
      <ImprintSermonCard
        type={type}
        title={title}
        subtitle={subtitle}
        pastor={pastor}
        durationMin={durationMin}
        currentDay={currentDay}
        completed={completed}
        nextSermonLabel={nextSermonLabel}
        onPress={onPress}
      />
    );
  }

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

        NOTE: a THIRD mode — the Imprint-style self-contained
        portrait card with title/sub/CTA baked inside — has
        higher priority and is handled by an EARLY RETURN at the
        top of this component when `type.illustration` is set.
        Don't add it as a fourth branch here; the early-return
        path lets that mode skip the body block entirely
        (everything is inside its own card).
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
              contentFit="cover"
              transition={260}
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
        {/* Subtitle — kept in sans (Plus Jakarta Sans Regular)
            because this is a short framing line under the title,
            not editorial prose. The earlier italic-serif version
            looked elegant in isolation but fatigued the eye on
            quick scans and didn't match the legibility of the
            sermon BODY (which serves the same role and lives in
            upright serif). */}
        <Text
          className="text-ink-muted text-[14px] leading-[21px] mt-2"
          style={{
            fontFamily: "PlusJakartaSans_400Regular",
            textAlign: "center",
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

        {/* Begin button — solid white pill before completion
            (the one true primary CTA), accent-glowing "Read again"
            pill after completion (a calm-but-alive invitation to
            return).

            Tap target is the surrounding SermonCard Pressable
            anyway, so this is a visual affordance — not a
            separate hit zone. */}
        <View
          pointerEvents="none"
          style={{ marginTop: 18, alignItems: "center" }}
        >
          {completed ? <ReadAgainPill accent={type.accent} /> : <PlayPill />}
        </View>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// ImprintSermonCard — v2 self-contained Imprint-style hero
// ─────────────────────────────────────────────────────────────────
//
// Single rounded card. Illustration on top ~60%, dark interior
// section underneath holding title + meta sub + primary CTA. Three
// pagination dots float beneath the card so the eye reads it as
// the focal object in a horizontal stack (carousel intent — even
// if the carousel itself is just a single item today, the visual
// language stays consistent with where it goes next).
//
// Card geometry (matched to Imprint's iPhone capture: card is
// ~87% of screen width and ~0.78 aspect — slightly wider than
// tall on the body, with the illustration filling the top 63%):
//   • width  ........ 340pt  (centered, ~26pt side margins on 393pt screens)
//   • height ........ 436pt  (≈ 0.78 aspect — matches Imprint)
//   • image  ........ 274pt tall (63% — illustration cover-crops to fit)
//   • interior pad .. 22pt all around (text + CTA breathe inside)
//
// Lift: a soft WHITE halo on all sides (not a black drop shadow).
// Imprint's card sits on dark canvas with a light glow wrapping
// the whole rectangle — the eye reads "the card is lit from
// outside" rather than "the card is dropping a shadow." Reproduced
// by `shadowColor: white` with `shadowOffset: 0, 0` so the halo
// is symmetric on every side. Wrapped in an outer container so
// the inner card can keep `overflow: hidden` for the rounded
// illustration crop without clipping the halo.
//
// CTA: solid iOS-blue (#0A84FF) pill with soft glow. "Begin" pre-
// completion, "Read Again" post-completion. We considered a
// gradient (Imprint uses a horizontal blue gradient) but solid
// matches the existing focus accent color the user is already
// trained to read as "primary action" — adds a glow ring instead
// of a gradient to get the same "active object" lift.
//
// Tap target: outer Pressable wraps the whole card so any tap
// (illustration, body, or pill) navigates to the sermon intro.
// Same pattern as the legacy SermonCard — the CTA pill is a
// visual affordance, not a separate hit zone.

type ImprintSermonCardProps = SermonCardProps;

// Card geometry constants — shared by ImprintSermonCard (the
// carousel) and ImprintCardVisual (the actual card render). Pulled
// out so the carousel page math and the card render math can't
// drift apart.
//
// SIZING RATIONALE (current pass — image-prominent, tight body):
//
//   The previous 358×460 card paired a 260pt image with a 200pt
//   body. On dark-mode the body read as a heavy slab of grey
//   under the illustration: the image felt visually outweighed
//   by its own chrome. User feedback was direct: "the grey part
//   needs to be smaller so the image is showing more."
//
//   New target: 358×480 (aspect 0.75 — slightly more portrait
//   than 0.78). The 20pt height bump is spent ENTIRELY on the
//   illustration; the body actually shrinks. New split:
//
//     • Image: 330pt (was 260pt, +70)  — now ~69% of the card
//     • Body:  150pt (was 200pt, −50)  — ~31% of the card
//
//   The body's content stack still fits without overlap:
//     • 12pt top padding
//     • 52pt for a 2-line title (20pt fontSize × 26pt lineHeight)
//     • 5pt + 18pt for the sub line
//     • flex space-between gap (≥10pt)
//     • 38pt CTA pill (compact pill geometry from
//       ImprintCTAPill — paddingVertical 11 + 14pt label)
//     • 15pt bottom padding
//   = 140pt + gap. 150pt body leaves ~10pt of breathing slack so
//   a long 2-line title can't push into the sub or pill.
//
//   Image slot is now 358×330 ≈ 1.08:1 — close to square. The
//   source illustrations live as portrait ~3:4 (~0.75:1), so
//   `cover` crops the SIDES rather than the top/bottom now
//   (since the slot's aspect is wider-than-source). The focal
//   subject sits centered, so side-crop is safe.
//
//   📐 OPTIMAL SOURCE-ASSET EXPORT for this slot:
//        • Aspect ratio: 1.08:1 (slightly landscape, near-square)
//        • @1x:   358 × 330 px
//        • @2x:   716 × 660 px
//        • @3x:  1074 × 990 px
//     If easier to standardize, export at **1200 × 1100 px** —
//     same aspect, larger than @3x so it scales cleanly on any
//     future Pro Max / iPad density without re-cropping.
//
//   Existing portrait 3:4 artwork still works (no re-export
//   required): you'll just see more of the central subject and
//   lose a bit on the left/right edges.
//
//   On a 393pt screen this leaves ~17pt of side peek for the
//   carousel; on a 375pt phone it's ~8pt — tight but still
//   reads as "more available to the side."
const IMPRINT_CARD_WIDTH = 358;
const IMPRINT_CARD_HEIGHT = 480;
const IMPRINT_IMAGE_HEIGHT = 330;
const IMPRINT_CARD_INTERIOR = "#161618";

/**
 * Editorial red used for the "Daily Devotional" section header at
 * the top of the home page — an Apple News "Top Stories" treatment
 * that visually marks today's curated sermon as the headline
 * editorial item. Same shade in both light and dark themes so the
 * section identity reads consistently when the user flips modes;
 * picked for legibility against both the cream and true-black bg
 * (Tailwind rose-600). Lives at module scope so it's easy to
 * promote to a theme constant later if we add other section
 * headers (e.g. "Your Rhythms", "Recent Moods") that all want the
 * same colored treatment.
 */
const HOME_SECTION_ACCENT = "#E11D48";

/**
 * Green used by the "Read Again" pill on the today sermon card
 * once the day's sermon is complete. Apple's iOS system green
 * (`#34C759`) — recognizable across the OS as a "done /
 * succeeded / on" signal, so the pill reads as a "you finished
 * this" affordance instead of just another tappable button.
 * Paired with a check glyph on the pill so the state is legible
 * even when the color is out of focus.
 */
const COMPLETED_GREEN = "#34C759";

/**
 * ImprintSermonCard — paginated horizontal carousel
 *
 * Three pages: TODAY (the active sermon with a working Begin CTA)
 * and the two next sermon types as preview cards (illustration +
 * type name + day-of-week hint, no functional CTA). Tapping a
 * preview card scrolls it to center; tapping the centered card
 * fires the parent `onPress` (sermon intro navigation).
 *
 * Why this layout:
 *   • Side peek is the visual cue that there's more available
 *     (matches Imprint exactly).
 *   • Today is always at index 0 so the user always lands on the
 *     actionable card — they only see the others by intentional
 *     swiping.
 *   • Pagination dots reflect the actual scroll position via
 *     onScroll, so the dot animation feels alive.
 *
 * What's NOT here yet:
 *   • Real per-day content for the preview cards (tomorrow's
 *     title, pastor, duration). Those will land when the moments
 *     catalog exposes peek-ahead. For now previews carry the
 *     sermon TYPE's name + tagline + a day-relative label
 *     ("Tomorrow", weekday after that) so the carousel feels
 *     populated.
 *   • Functional taps on previews. They snap to center; they do
 *     NOT navigate to tomorrow's intro (that would be misleading
 *     since the content isn't unlocked yet).
 */
function ImprintSermonCard({
  type,
  title,
  subtitle,
  pastor,
  durationMin,
  currentDay,
  completed,
  nextSermonLabel,
  onPress,
}: ImprintSermonCardProps) {
  // Screen width drives the paging math — each carousel page is
  // exactly one screen wide so the centered card snaps cleanly
  // and the side peek emerges from the surrounding empty space.
  const { width: screenWidth } = useWindowDimensions();

  // Active scroll page. Updated from onScroll so the pagination
  // dots animate in lockstep with the user's finger.
  const [activePage, setActivePage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  // Sub-line shown directly under the title on the ACTIVE (today)
  // card. Imprint shows the content type ("Quick Read"). For
  // Closer the most useful glance is duration + pastor (when
  // present) — what the user wants to commit to before they tap.
  const todaySubLine = completed && nextSermonLabel
    ? `Completed · Your next word arrives ${nextSermonLabel}`
    : pastor
      ? `${durationMin} min · ${pastor}`
      : `${durationMin} min listen`;

  // Walk the 90-day catalog forward from today to pull the actual
  // next two sermons (not the next two sermon TYPES). Before this
  // change the preview cards cycled through SERMON_TYPES, so a
  // user looking ahead would see e.g. "Letters From A Struggling
  // Christian" as the day-2 card — the type, not the real day-2
  // sermon "I Don't Know How To Pray Anymore" that ships in
  // sermons.js. With per-day previews the carousel becomes a
  // genuine peek at the next two days of content.
  //
  // nextMoment() handles the catalog wrap, so day 90 → day 1
  // without any guard logic here.
  const previewMoments = useMemo<Moment[]>(() => {
    const m1 = nextMoment(currentDay);
    const m2 = nextMoment(m1.day);
    return [m1, m2];
  }, [currentDay]);

  // Build the 3 card configs. `today` is the only one that fires
  // a real navigation onPress; the previews snap to center on tap
  // and never navigate (their content isn't unlocked yet). Preview
  // cards now carry:
  //   • title → the real sermon title from the catalog
  //   • sub   → the sermon type's display name (kept as secondary
  //             context, so the user can still see the category
  //             at a glance — "I Don't Know How To Pray Anymore"
  //             / "Letters From A Struggling Christian")
  const cards = useMemo(
    () => [
      {
        key: "today",
        type,
        title,
        sub: todaySubLine,
        ctaLabel: completed ? "Read Again" : "Begin",
        // Two different CTA palettes depending on state:
        //   • Pre-completion (Begin) paints in HOME_SECTION
        //     _ACCENT — the same editorial red the "Daily
        //     Devotional" header above the card uses — so the
        //     card + CTA + section header all read as one
        //     composition. (Earlier this branch used iOS-blue
        //     `#0A84FF`, which felt like a detached system
        //     element.)
        //   • Post-completion (Read Again) paints in
        //     COMPLETED_GREEN with a trailing checkmark glyph
        //     so the card visibly switches into a "done" state
        //     at a glance, instead of staying the same color
        //     as a still-actionable Begin pill. The green
        //     reads as a signal-progress affordance the way
        //     iOS Mail's "completed" check does.
        ctaColor: completed ? COMPLETED_GREEN : HOME_SECTION_ACCENT,
        ctaActive: true,
        completed,
      },
      ...previewMoments.map((m, i) => {
        const previewType = resolveSermonTypeForMoment(m);
        return {
          key: `day-${m.day}`,
          type: previewType,
          title: m.title,
          sub: previewType.name,
          ctaLabel: i === 0 ? "Tomorrow" : previewDayLabel(i + 1),
          ctaColor: "rgba(255, 255, 255, 0.14)",
          ctaActive: false,
          completed: false,
        };
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type.id, title, todaySubLine, completed, previewMoments],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const page = Math.round(e.nativeEvent.contentOffset.x / screenWidth);
      if (page !== activePage) setActivePage(page);
    },
    [activePage, screenWidth],
  );

  const handleCardPress = useCallback(
    (idx: number) => {
      if (idx === activePage && cards[idx]?.ctaActive) {
        onPress();
        return;
      }
      // Inactive (or non-actionable) card → snap it to center
      // instead of doing nothing. Matches the carousel behavior
      // users expect from Apple Music / Imprint / etc.
      scrollRef.current?.scrollTo({
        x: idx * screenWidth,
        animated: true,
      });
    },
    [activePage, cards, onPress, screenWidth],
  );

  return (
    <View style={{ paddingTop: 6, paddingBottom: 4 }}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        // Each "page" is exactly one screen wide. The card sits
        // centered inside its page; the surrounding empty space
        // on the current page lets the adjacent page's card
        // peek through (~(screenWidth - 340) / 2 on each side).
        style={{ width: screenWidth }}
      >
        {cards.map((card, idx) => (
          <View
            key={card.key}
            style={{ width: screenWidth, alignItems: "center" }}
          >
            <ImprintCardVisual
              type={card.type}
              title={card.title}
              sub={card.sub}
              ctaLabel={card.ctaLabel}
              ctaColor={card.ctaColor}
              ctaActive={card.ctaActive}
              completed={card.completed}
              onPress={() => handleCardPress(idx)}
            />
          </View>
        ))}
      </ScrollView>

      {/* Pagination dots — reflect the live scroll page. The
          active dot is slightly larger + brighter so the eye
          tracks position at a glance. Sits 18pt below the
          carousel so it anchors to the cards, not the section
          below. */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          marginTop: 18,
        }}
        pointerEvents="none"
      >
        {cards.map((_, i) => {
          const isActive = i === activePage;
          return (
            <View
              key={i}
              style={{
                width: isActive ? 7 : 6,
                height: isActive ? 7 : 6,
                borderRadius: 4,
                backgroundColor: isActive
                  ? "rgba(255, 255, 255, 0.85)"
                  : "rgba(255, 255, 255, 0.22)",
                marginHorizontal: 3.5,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

/**
 * previewDayLabel — turns an offset of days into a short user-
 * facing label for a preview card's CTA pill. Offset 1 is
 * "Tomorrow" (handled inline above); offset 2 returns the
 * day-of-week of two days from now (e.g. "Sunday"). Kept
 * separate so the math stays out of the JSX and the label
 * style can change without touching the carousel.
 */
function previewDayLabel(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  // Short weekday name ("Sun", "Mon"…). For now we use the long
  // form ("Sunday") to match the conversational feel of
  // "Tomorrow"; flip to "short" if it ever overflows the pill.
  return d.toLocaleDateString(undefined, { weekday: "long" });
}

/**
 * ImprintCardVisual — the actual rounded card render
 *
 * Pure presenter — owns no state, no scroll wiring. Sized to
 * IMPRINT_CARD_WIDTH × IMPRINT_CARD_HEIGHT so the carousel page
 * math stays consistent. Tap routes back to the parent via
 * onPress (parent decides whether to navigate or scroll-to-
 * center based on the card's position).
 *
 * Visual structure unchanged from the prior single-card version:
 *   • Outer wrapper: carries the white halo (iOS) / elevation 0
 *   • Inner card:    overflow-hidden rounded container with
 *                    hairline rim border and the illustration +
 *                    title + sub + CTA stacked vertically.
 */
function ImprintCardVisual({
  type,
  title,
  sub,
  ctaLabel,
  ctaColor,
  ctaActive,
  completed,
  onPress,
}: {
  type: SermonType;
  title: string;
  sub: string;
  ctaLabel: string;
  ctaColor: string;
  ctaActive: boolean;
  completed: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.94 : 1 })}
    >
      <View style={{ width: IMPRINT_CARD_WIDTH, position: "relative" }}>
        {/* Per-type colored halo was removed at the user's
            request — the home page now reads as a flat editorial
            tile against the page background instead of a card
            floating in a colored wash. The lit-from-behind
            effect was distinctive but competed with the
            "Daily Devotional" red ribbon and the App Blocks
            list directly below for visual attention.
            
            We keep ONE soft black drop shadow underneath so the
            card still grounds against the bg — without it the
            card reads as a decal stuck to the page. The shadow
            is bottom-weighted (offset y: 12) so it feels like
            gravity, not glow. */}
        <View
          style={{
            borderRadius: 28,
            backgroundColor: IMPRINT_CARD_INTERIOR,
            shadowColor: "#000000",
            shadowOpacity: 0.45,
            shadowRadius: 22,
            shadowOffset: { width: 0, height: 12 },
          }}
        >
          {/* Inner card — borderless. The previous 1pt hairline
              edge at rgba(255,255,255,0.06) was the last bit of
              "form chrome" on the hero. Apple's content cards
              don't use borders; the value step from page-bg to
              card-fill IS the edge. Dropping the border lets the
              card read as pure elevation, matching every other
              Apple-tuned surface in the app. */}
          <View
            style={{
              width: IMPRINT_CARD_WIDTH,
              height: IMPRINT_CARD_HEIGHT,
              borderRadius: 28,
              overflow: "hidden",
              backgroundColor: IMPRINT_CARD_INTERIOR,
              elevation: 8,
            }}
          >
            {/* Top: illustration. */}
            <View style={{ width: "100%", height: IMPRINT_IMAGE_HEIGHT }}>
              <Image
                source={type.illustration}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={260}
                accessibilityIgnoresInvertColors
              />
              {/* Bottom dissolve into card interior. */}
              <Svg
                pointerEvents="none"
                width="100%"
                height={36}
                style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}
              >
                <Defs>
                  <LinearGradient
                    id={`imp-fade-${type.id}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={36}
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop
                      offset="0"
                      stopColor={IMPRINT_CARD_INTERIOR}
                      stopOpacity={0}
                    />
                    <Stop
                      offset="1"
                      stopColor={IMPRINT_CARD_INTERIOR}
                      stopOpacity={1}
                    />
                  </LinearGradient>
                </Defs>
                <Rect
                  x={0}
                  y={0}
                  width="100%"
                  height={36}
                  fill={`url(#imp-fade-${type.id})`}
                />
              </Svg>
            </View>

            {/* Bottom: title + sub + CTA. Type sizes tuned for the
                compressed 150pt body (down from 200pt) so the
                illustration above can take more of the card.
                
                Type-sizing math (must fit in 150pt without
                overlap):
                  12pt top padding
                + 52pt for a 2-line title (20pt × 26pt lh)
                +  5pt margin + 18pt sub line
                + flex space-between gap (≥10pt)
                + 38pt CTA pill (compact ImprintCTAPill)
                + 15pt bottom padding
                = 140pt + gap → 10pt of slack inside the 150pt
                  body even with a maximally long 2-line title.
                
                Title went 22pt → 20pt with a 28pt → 26pt line
                height — readable on the smaller body without
                eating into the pill. Sub margin trimmed (7 → 5)
                and font dropped (13.5 → 13) so the supporting
                line stays clearly secondary. */}
            <View
              style={{
                flex: 1,
                paddingHorizontal: 22,
                paddingTop: 12,
                paddingBottom: 15,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ alignItems: "center" }}>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "PlusJakartaSans_700Bold",
                    fontSize: 20,
                    lineHeight: 26,
                    letterSpacing: -0.3,
                    textAlign: "center",
                  }}
                  numberOfLines={2}
                >
                  {title}
                </Text>
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.6)",
                    fontFamily: "PlusJakartaSans_500Medium",
                    fontSize: 13,
                    lineHeight: 18,
                    marginTop: 5,
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {sub}
                </Text>
              </View>

              {/* CTA pill — active variant gets the bright accent
                  + glow; inactive (preview) variant gets a calm
                  translucent pill with no glow so it reads as a
                  status label, not an action. The active variant
                  also picks up a trailing checkmark when the
                  card is in its "Read Again" (completed) state
                  so the green pill reads as a "done" badge at
                  a glance, not just another tappable Begin. */}
              {ctaActive ? (
                <ImprintCTAPill
                  label={ctaLabel}
                  color={ctaColor}
                  showCheck={completed}
                />
              ) : (
                <ImprintPreviewPill label={ctaLabel} />
              )}
            </View>
          </View>
        </View>

        {/* Completed badge — top-right of the active card. */}
        {completed ? (
          <View style={{ position: "absolute", top: 12, right: 12 }}>
            <CompletedBadge />
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * ImprintPreviewPill — quiet status pill used on preview cards.
 * Translucent white surface with no glow, so the eye reads it
 * as a label ("Tomorrow", "Sunday") rather than a tappable
 * action. Same shape and dimensions as ImprintCTAPill so the
 * carousel cards stay visually aligned at the bottom.
 */
function ImprintPreviewPill({ label }: { label: string }) {
  return (
    <View pointerEvents="none" style={{ alignItems: "center" }}>
      <View
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          paddingHorizontal: 22,
          paddingVertical: 11,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        <Text
          style={{
            color: "rgba(255, 255, 255, 0.7)",
            fontFamily: "PlusJakartaSans_600SemiBold",
            fontSize: 12.5,
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

/**
 * Imprint-style CTA pill — substantial blue (or accent-colored
 * when post-completion) capsule with a glowing halo and bold
 * label. Sized to match Imprint's reference card: ~200pt wide
 * primary button that anchors the bottom of the card as the one
 * obvious action.
 *
 * Geometry rationale:
 *   • paddingHorizontal 64 + label width gives a real ~200pt pill
 *     (vs the earlier 38 padding pill that read as undersized
 *     against the new 358×600 card).
 *   • paddingVertical 17 produces a ~52pt tall hit target — Apple's
 *     44pt minimum with breathing room, so the button feels
 *     "tappable" without crowding the title above.
 *   • Glow ring radius bumped to 22 with opacity 0.6 so the halo
 *     reads from across the room — matches Imprint's lit-from-
 *     within button on a dark card.
 *
 * Pointer-events none so it doesn't steal taps from the parent
 * Pressable (the whole card is the hit target).
 */
function ImprintCTAPill({
  label,
  color,
  showCheck = false,
}: {
  label: string;
  color: string;
  /** When true, renders a trailing checkmark glyph — used by the green "Read Again" pill to read as "done" at a glance. */
  showCheck?: boolean;
}) {
  // Previous sizing was a wide pill (64×17 padding, 16pt label
  // with a 22pt-radius glow) that landed as the dominant
  // element on the card. Reduced to a more discreet 36×11
  // pill with a 14pt label so the headline + sub stay the
  // primary read and the Begin tap reads as a quiet
  // invitation rather than a banner. Glow radius also dropped
  // (22 → 12) and opacity softened (0.6 → 0.4) so the smaller
  // pill doesn't over-illuminate the surrounding card.
  //
  // Optional trailing checkmark (showCheck) is used by the
  // "Read Again" green pill — drawn as a clean 2pt stroked
  // SVG path. We tighten the right-side padding slightly when
  // the check is present so the glyph hangs balanced inside
  // the pill instead of pinning to the edge.
  return (
    <View pointerEvents="none" style={{ alignItems: "center" }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: color,
          paddingLeft: 36,
          paddingRight: showCheck ? 28 : 36,
          paddingVertical: 11,
          borderRadius: 999,
          shadowColor: color,
          shadowOpacity: 0.4,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 14,
            letterSpacing: 0.2,
            marginRight: showCheck ? 8 : 0,
          }}
        >
          {label}
        </Text>
        {showCheck ? (
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 12l5 5L20 7"
              stroke="#FFFFFF"
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : null}
      </View>
    </View>
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
  /** Whether today's sermon has already been read. Drives a hard
   *  mode swap:
   *    false → APPS LOCKED hero with "Read today's sermon to
   *            unlock" as the primary CTA. The user is in the
   *            middle of the unlock loop; the hero is the
   *            biggest possible nudge toward the action that
   *            completes it.
   *    true  → calm "Focus session" hero. The unlock loop is
   *            done for the day; the hero relaxes into a
   *            countdown + End control. */
  hasReadSermonToday: boolean;
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
  hasReadSermonToday,
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
  const reducedMotionActive = useReducedMotion();
  useEffect(() => {
    if (isPaused) return;
    if (reducedMotionActive) {
      pulse.setValue(0.5);
      return;
    }
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
  }, [isPaused, pulse, reducedMotionActive]);

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

  // CTA mode = "apps locked, primary action is read the sermon".
  // Status mode = sermon's been read, the hero is calm focus chrome.
  // Branching the entire layout (not just a button or two) so each
  // mode can be designed for its actual job rather than each
  // borrowing the other's hierarchy.
  const ctaMode = !hasReadSermonToday;

  return (
    <Pressable
      onPress={() => {
        // CTA mode: body tap = same as the "Read sermon" pill, so
        // a fat tap anywhere on the card kicks off the unlock loop.
        // Status mode: keep the legacy "open the focus manager"
        // affordance so users can still tweak apps mid-session.
        //
        // The unlock path now jumps straight to the scripture
        // screen (the antechamber intro page was removed; the
        // verse is the first sermon beat).
        if (ctaMode) router.push("/sermon/scripture");
        else router.push("/settings/focus");
      }}
      accessibilityRole="button"
      accessibilityLabel={
        ctaMode
          ? `Apps locked. Read today's sermon to unlock your apps. ${timeLabel} elapsed.${isPaused ? " Paused." : ""}`
          : `Focus session: ${titleLabel}. ${timeLabel} ${timeMetaLabel.toLowerCase()}.${
              isPaused ? " Paused." : ""
            } Tap to manage.`
      }
      className="rounded-3xl overflow-hidden border bg-surface"
      // Accent border so the card visually announces "this is a
      // different state". CTA mode pushes the accent harder
      // (~45% alpha) so the card feels like a primary surface;
      // status mode keeps the gentler ~32% it always had.
      style={({ pressed }) => ({
        opacity: pressed ? 0.94 : 1,
        borderColor: withAlpha(FOCUS_HERO_ACCENT, ctaMode ? 0.42 : 0.28),
      })}
    >
      {/* Subtle iOS-blue wash across the entire card in CTA mode —
          enough to mark the card as "the active task on the
          screen" without competing with the headline copy. Sits
          behind the body content so padding still works against
          the surface color, not the wash. */}
      {ctaMode ? (
        <View
          pointerEvents="none"
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: FOCUS_HERO_ACCENT,
            opacity: 0.07,
          }}
        />
      ) : null}

      <View className="px-5 pt-5 pb-5">
        {/* Eyebrow row — copy and icon swap by mode.
              CTA mode: a small lock chip with "APPS LOCKED" — the
                visible declaration of the state the user is in.
                The pulsing dot becomes a quietly-glowing lock so
                the metaphor stays consistent with the shield in
                the mini-player and the lock in the unlock CTA.
              Status mode: legacy "FOCUS SESSION" eyebrow with
                pulsing dot. */}
        <View className="flex-row items-center justify-between">
          {ctaMode ? (
            <View className="flex-row items-center">
              <Animated.View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: withAlpha(FOCUS_HERO_ACCENT, 0.18),
                  borderWidth: 1,
                  borderColor: withAlpha(FOCUS_HERO_ACCENT, 0.45),
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 9,
                  opacity: isPaused
                    ? 0.55
                    : pulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.75, 1],
                      }),
                  transform: [
                    {
                      scale: isPaused
                        ? 1
                        : pulse.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.95, 1.05],
                          }),
                    },
                  ],
                }}
              >
                <Svg width={11} height={11} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M6 10V8a6 6 0 1112 0v2"
                    stroke={FOCUS_HERO_ACCENT}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  <Path
                    d="M5 10h14v10H5z"
                    fill={FOCUS_HERO_ACCENT}
                  />
                </Svg>
              </Animated.View>
              <Text
                className="text-[10px] tracking-[3px] uppercase"
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: FOCUS_HERO_ACCENT,
                }}
              >
                {isPaused ? "Locked · paused" : "Apps locked"}
              </Text>
            </View>
          ) : (
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
                    : pulse.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.5, 1],
                      }),
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
          )}

          {/* Mode-dependent right cluster. CTA mode shows a small
              elapsed-time pill so the user still has the live
              session reference without it dominating the
              card. Status mode is intentionally empty here — the
              big centered timer below carries the visual. */}
          {ctaMode ? (
            <View
              className="flex-row items-center px-2.5 py-1 rounded-full"
              style={{
                backgroundColor: withAlpha(FOCUS_HERO_ACCENT, 0.12),
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: withAlpha(FOCUS_HERO_ACCENT, 0.32),
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: FOCUS_HERO_ACCENT,
                  fontSize: 11,
                  letterSpacing: 0.3,
                  opacity: isPaused ? 0.6 : 1,
                  // @ts-expect-error fontVariant typing — see below.
                  fontVariant: ["tabular-nums"],
                }}
              >
                {timeLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {ctaMode ? (
          <>
            {/* Editorial headline — same visual weight as the
                SermonCard title (25px/31), so the card swap is
                still one-for-one in height. Two-line layout so
                "Read today's sermon" and "to unlock your apps"
                land as a balanced couplet rather than a runner. */}
            <Text
              className="text-ink text-[25px] leading-[31px] tracking-[-0.4px] mt-3"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Read today&apos;s sermon
            </Text>
            <Text
              className="text-ink-muted text-[16px] leading-[22px] mt-1"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            >
              to unlock your apps.
            </Text>

            {/* Primary CTA — full-width iOS-blue pill with a
                soft accent-tinted glow. This is the single most
                important action when the strip is in CTA mode;
                the card around it exists to set the stage for
                this tap. */}
            <View className="mt-5">
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  // Intro/antechamber page was removed — scripture
                  // is the first sermon beat now, so Begin lands
                  // the user directly on the verse.
                  router.push("/sermon/scripture");
                }}
                accessibilityRole="button"
                accessibilityLabel="Read today's sermon to unlock your apps"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.88 : 1,
                })}
              >
                <View
                  className="flex-row items-center justify-center rounded-2xl"
                  style={{
                    height: 54,
                    backgroundColor: FOCUS_HERO_ACCENT,
                    shadowColor: FOCUS_HERO_ACCENT,
                    shadowOpacity: 0.5,
                    shadowRadius: 16,
                    shadowOffset: { width: 0, height: 6 },
                    elevation: 10,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "PlusJakartaSans_700Bold",
                      color: "#FFFFFF",
                      fontSize: 16,
                      letterSpacing: 0.3,
                    }}
                  >
                    Read sermon
                  </Text>
                  <Svg
                    width={16}
                    height={16}
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ marginLeft: 8 }}
                  >
                    <Path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="#FFFFFF"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </Pressable>
            </View>

            {/* Foot row — quiet meta (apps quieted) on the left,
                secondary End action on the right as a small text
                button. Hierarchically subordinate to the CTA
                above so a quick glance still reads "READ" as
                the path forward, not "END". */}
            <View className="flex-row items-center justify-between mt-4">
              <Text
                className="text-ink-subtle text-[12px]"
                style={{
                  fontFamily: "PlusJakartaSans_500Medium",
                  letterSpacing: 0.1,
                }}
                numberOfLines={1}
              >
                {appsSummary}
              </Text>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  onEnd();
                }}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="End focus session"
                style={({ pressed }) => ({
                  opacity: pressed ? 0.55 : 0.85,
                  paddingVertical: 2,
                  paddingHorizontal: 4,
                })}
              >
                <Text
                  className="text-ink-subtle text-[11px] tracking-[1.6px] uppercase"
                  style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                >
                  End focus
                </Text>
              </Pressable>
            </View>
          </>
        ) : (
          <>
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

            {/* Time display — the big number is the focal element. */}
            <View className="items-center mt-5">
              <Text
                className="text-ink text-[44px] leading-[48px] tracking-[-1px]"
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  opacity: isPaused ? 0.55 : 1,
                }}
                // @ts-expect-error — RN types accept this string but
                // TypeScript's typing for fontVariant is narrow.
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
                sessions. Animated implicitly via re-render. */}
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
                    opacity: isPaused ? 0.55 : 1,
                  }}
                />
              </View>
            ) : null}

            {/* Action row: Break/Resume + End. */}
            <View className="flex-row mt-5" style={{ gap: 10 }}>
              {hasDuration ? (
                <View style={{ flex: 1 }}>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      handleTogglePause();
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isPaused ? "Resume session" : "Pause session"
                    }
                    style={({ pressed }) => ({
                      opacity: pressed ? 0.88 : 1,
                    })}
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
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.88 : 1,
                  })}
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
          </>
        )}
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
 * "Read again" CTA — the post-completion celebration pill.
 *
 * Previously a quiet outlined chip ("the user finished, this is
 * just an escape hatch"). That underplayed the moment: finishing
 * today's word IS the success — the chip should LAND. So now the
 * pill is full accent-tinted with a soft outer glow, sized to
 * match the primary PlayPill, and continuously breathes (scale
 * 0.985 → 1.015 on a 5.6s sine wave) so it reads as alive,
 * inviting a return rather than confirming a finish.
 *
 * Why accent color (not solid white):
 *   The PlayPill (first-listen) is solid white = "primary action,
 *   one true CTA". After completion the urgency drops — there's no
 *   primary action anymore, just a re-engagement invite. Using the
 *   day's per-sermon accent for the BG ties the pill into the
 *   completed-state palette and signals "this is the same word
 *   you already heard, in the same color world" rather than a
 *   second primary CTA.
 */
function ReadAgainPill({ accent }: { accent: string }) {
  // Subtle continuous breath — same family as the LivingHeroIcon
  // halo and the SermonHeader chip pulse. The pill never demands
  // attention but it never lies fully still either, so the eye
  // returns to it after settling on the title above.
  const breath = useRef(new Animated.Value(0)).current;
  const reducedMotionActive = useReducedMotion();
  useEffect(() => {
    if (reducedMotionActive) {
      breath.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 3000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);
  const scale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.985, 1.015],
  });
  const glowOpacity = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0.95],
  });

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      {/* Outer glow — soft accent-tinted radial shadow that
          pulses with the breath. Sits behind the pill so the
          chip reads as "lit from below", not as a hard outline. */}
      <Animated.View
        style={{
          position: "absolute",
          top: -10,
          left: -10,
          right: -10,
          bottom: -10,
          borderRadius: 999,
          backgroundColor: accent,
          opacity: glowOpacity,
          shadowColor: accent,
          shadowOpacity: 0.5,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 0 },
        }}
      />
      <View
        className="rounded-full flex-row items-center"
        style={{
          backgroundColor: withAlpha(accent, 0.22),
          borderWidth: 1.5,
          borderColor: withAlpha(accent, 0.55),
          paddingLeft: 16,
          paddingRight: 20,
          paddingVertical: 11,
          // Inner accent halo via shadow on iOS — gives the pill
          // a subtle "lit from within" quality. Shadows on the
          // chip itself read as physical light around the action.
          shadowColor: accent,
          shadowOpacity: 0.45,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 6,
        }}
      >
        <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 9V4M4 9h5M20 15v5M20 15h-5"
            stroke={accent}
            strokeWidth={2.1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M19 9a7 7 0 00-13-1M5 15a7 7 0 0013 1"
            stroke={accent}
            strokeWidth={2.1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 14.5,
            color: accent,
            marginLeft: 9,
            letterSpacing: 0.2,
          }}
        >
          Read again
        </Text>
      </View>
    </Animated.View>
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

// (LivingHeroIcon was extracted to components/LivingHeroIcon.tsx so
// the sermon intro and complete screens can share it. The home
// screen imports it from there at the top of this file.)

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

/**
 * RhythmGrid — HabitKit-inspired current-month calendar
 * heatmap. The home page surfaces ONE month so the eye lands
 * on "where am I at, this month?" The multi-year history,
 * stats, and monthly chart live on the /rhythm detail page
 * (tap the card to open it).
 *
 * Visual structure:
 *
 *   ┌──────────────────────────────────────────────────────┐
 *   │  June 2026                                       12  │
 *   │                                                      │
 *   │   S   M   T   W   T   F   S                          │ (weekday strip)
 *   │   ·   ·   ·   ·   ·   ·   ▣                          │
 *   │   ▣   ▣   ·   ▣   ▣   ·   ·                          │
 *   │   ·   ·   ▣   ▣   ·   ·   ▣                          │
 *   │   ·   ·   ·   ·   ·   ·   ·                          │
 *   │   ·   ·   ·   ·   ·   ▢   ▢                          │ (future days)
 *   │                                                      │
 *   │  6 of 30 days                              View all →│
 *   └──────────────────────────────────────────────────────┘
 *
 *   • 7 columns (Sun → Sat) × 5–6 rows (weeks of the month).
 *     Days from the surrounding months that share a week with
 *     the current month are rendered as transparent slots so
 *     the grid keeps a proper calendar shape.
 *   • Lit cells: HOME_SECTION_ACCENT (editorial red) — same
 *     color as the "Daily Devotional" ribbon at the top of the
 *     page, so the rhythm card reads as part of the same
 *     conversation, not a new color world.
 *   • Today's cell carries a ring (border in the accent) even
 *     when not yet engaged, so the user can locate "now" at a
 *     glance.
 *   • Future days inside the current month render as faint
 *     outlines — they exist on the calendar but aren't
 *     painted yet.
 *   • The whole card is a Pressable. Tapping pushes /rhythm,
 *     which carries the full year heatmap, monthly chart, and
 *     streak stats.
 */
function RhythmGrid({
  engagedDates,
  onOpenDetail,
}: {
  engagedDates: ReadonlyArray<string>;
  onOpenDetail: () => void;
}) {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();

  // ─── Layout math ─────────────────────────────────────────
  // The card lives in a 24pt-padded section; inside the card
  // we add 18pt of internal padding. The 7-column calendar
  // grid then fills whatever's left, with cells clamped to a
  // pleasant 26–36pt square (smaller-feeling than full
  // calendar tiles, large enough to read as a grid of days).
  const SECTION_PADDING = 24;
  const CARD_PADDING = 18;
  const GAP = 6;
  const COLS = 7;
  const cardWidth = screenWidth - SECTION_PADDING * 2;
  const gridWidth = cardWidth - CARD_PADDING * 2;
  const rawCell = (gridWidth - (COLS - 1) * GAP) / COLS;
  const cellSize = Math.max(26, Math.min(36, Math.floor(rawCell)));

  // ─── Date math ───────────────────────────────────────────
  // Build the month grid via the shared `lib/rhythm.ts`
  // helper so the home card and the /rhythm detail page use
  // the same source of truth for cell-state classification.
  const monthGrid = useMemo(() => {
    const today = new Date();
    return buildMonthGrid(
      engagedDates,
      today.getFullYear(),
      today.getMonth(),
    );
  }, [engagedDates]);
  const { rows, monthLabel, engagedCount, totalDays } = monthGrid;

  return (
    <Pressable
      onPress={onOpenDetail}
      accessibilityRole="button"
      accessibilityLabel={`Open rhythm detail — ${engagedCount} of ${totalDays} days in ${monthLabel}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <View
        style={{
          marginHorizontal: SECTION_PADDING,
          marginTop: 16,
          padding: CARD_PADDING,
          borderRadius: 22,
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        }}
      >
        {/* Header — month label on the left, completion count
            on the right (small "12 / 30" pair). */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.ink,
              fontSize: 15.5,
              letterSpacing: -0.2,
            }}
          >
            {monthLabel}
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.inkSubtle,
              fontSize: 11,
              letterSpacing: 1.6,
              textTransform: "uppercase",
            }}
          >
            {engagedCount} / {totalDays}
          </Text>
        </View>

        {/* Weekday strip — single character abbreviations,
            quietly muted so the grid below stays the visual
            anchor. */}
        <View
          style={{
            flexDirection: "row",
            marginBottom: 8,
          }}
        >
          {WEEKDAY_LETTERS.map((letter, i) => (
            <View
              key={i}
              style={{
                width: cellSize,
                marginLeft: i === 0 ? 0 : GAP,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: colors.inkSubtle,
                  fontSize: 10,
                  letterSpacing: 1,
                }}
              >
                {letter}
              </Text>
            </View>
          ))}
        </View>

        {/* The calendar itself */}
        <View>
          {rows.map((row, rIdx) => (
            <View
              key={rIdx}
              style={{
                flexDirection: "row",
                marginTop: rIdx === 0 ? 0 : GAP,
              }}
            >
              {row.map((cell, cIdx) => (
                <RhythmCell
                  key={`${rIdx}-${cIdx}`}
                  size={cellSize}
                  marginLeft={cIdx === 0 ? 0 : GAP}
                  state={cell.state}
                  isToday={cell.isToday}
                  colors={colors}
                />
              ))}
            </View>
          ))}
        </View>

        {/* Footer — "N of N days" on the left, "View all →"
            on the right hinting the tappable detail. */}
        <View
          style={{
            marginTop: 14,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontFamily: "PlusJakartaSans_600SemiBold",
              color: colors.ink,
              fontSize: 13,
              letterSpacing: -0.1,
            }}
          >
            {engagedCount} of {totalDays} days
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: HOME_SECTION_ACCENT,
                fontSize: 13,
                letterSpacing: -0.1,
                marginRight: 4,
              }}
            >
              View all
            </Text>
            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <Path
                d="M9 6l6 6-6 6"
                stroke={HOME_SECTION_ACCENT}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/** Single-letter weekday strip — US locale (Sun → Sat). */
const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

/**
 * One cell in a rhythm heatmap. Kept as a separate component
 * so re-renders don't re-create style objects for dozens of
 * cells on every paint.
 *
 * State-driven render:
 *   • engaged    → solid HOME_SECTION_ACCENT
 *   • idle       → calm border-tone fill (a quiet "this day
 *                  has happened but you didn't engage")
 *   • future     → faint outline inside the current month
 *                  (the day exists, it just hasn't happened
 *                  yet)
 *   • outOfMonth → transparent placeholder (preserves
 *                  calendar shape on the home grid)
 *   • isToday    → adds an accent ring over whatever fill is
 *                  underneath so the user can locate "now"
 *                  at a glance, engaged or not
 */
function RhythmCell({
  size,
  marginLeft,
  state,
  isToday,
  colors,
}: {
  size: number;
  marginLeft: number;
  state: RhythmCellState;
  isToday: boolean;
  colors: { border: string };
}) {
  const radius = Math.max(2, Math.floor(size / 4));
  let backgroundColor = "transparent";
  let opacity = 1;
  let borderWidth = 0;
  let borderColor: string | undefined;
  switch (state) {
    case "engaged":
      backgroundColor = HOME_SECTION_ACCENT;
      break;
    case "idle":
      backgroundColor = colors.border;
      break;
    case "future":
      backgroundColor = "transparent";
      borderWidth = 1;
      borderColor = colors.border;
      opacity = 0.7;
      break;
    case "outOfMonth":
      backgroundColor = "transparent";
      opacity = 0;
      break;
  }
  // Today gets an accent ring over whatever fill is below so
  // the user can find "now" without scanning numbers.
  if (isToday && state !== "outOfMonth" && state !== "engaged") {
    borderWidth = 1.5;
    borderColor = HOME_SECTION_ACCENT;
    opacity = 1;
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        marginLeft,
        borderRadius: radius,
        backgroundColor,
        opacity,
        borderWidth,
        borderColor,
      }}
    />
  );
}

function StatRow({
  streakCurrent,
  streakLongest,
  readingMinutes,
}: StatRowProps) {
  return (
    // Apple-style stat strip. The previous version was a tight
    // Opal-shaped dashboard band: hairlines top and bottom,
    // compact 22pt numbers, 16pt vertical padding. The user feedback
    // was that the home read "supppppper cheap" — and this row was
    // a big part of that, because the numbers it surfaces are
    // EMOTIONAL (your streak, your minutes near scripture, your
    // personal best) but the typography was rendering them at
    // chip-size. Apple's product pages give numbers like this
    // hero-level treatment ("8x", "48MP", "33 hours") with display
    // weights and tight tracking so they LAND.
    //
    // Recipe (matches the iPhone 17 Pro page's stat block):
    //   • No outer hairlines — Apple doesn't fence supporting
    //     metrics with rules, the whitespace IS the structure.
    //   • Tight vertical dividers between the three columns —
    //     functional (separates the metrics) without being chrome.
    //   • Numbers at 42pt ExtraBold with negative tracking so they
    //     read as display headlines, not body data.
    //   • Section eyebrow is handled by the parent wrapper now
    //     (see the "YOUR RHYTHM" header in TodayScreen), so this
    //     component only owns the metric strip itself.
    //
    // Section spacing: marginTop is 16pt so it sits just under
    // the parent's "YOUR RHYTHM" eyebrow with the same vertical
    // beat as the verse section below.
    <View
      style={{
        marginHorizontal: 24,
        marginTop: 16,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "stretch",
        }}
      >
        {/* Apple Fitness assigns each metric its own iOS-system
            color so the eye scans the row and immediately keys
            metric → meaning (Move=red, Steps=purple, Distance=
            cyan, Sessions=green). We do the same for Closer's
            three metrics, picking colors with semantic weight:

              • Streak   → systemOrange (#FF9F0A)
                The flame metaphor — "keep the daily practice
                going." Visually echoes the 🔥 in StreakChip
                above the header.
              • Reading  → systemCyan   (#64D2FF)
                Quiet, scripture-coded "still waters." Cool tone
                signals the calm, devotional nature of time spent
                near the verse.
              • Best     → systemGreen  (#30D158)
                Personal record / growth. Apple uses green for
                the Exercise (growth) ring — same emotional cue
                applies here for the "highest you've ever been."

            All three are pulled from `SYSTEM_COLORS_DARK` so the
            whole app stays in family with Apple's published
            palette and we don't fork into one-off custom hex. */}
        <Stat
          label="Streak"
          value={streakCurrent}
          unit={streakCurrent === 1 ? "day" : "days"}
          valueColor={SYSTEM_COLORS_DARK.orange}
        />
        <StatDivider />
        <Stat
          label="Reading"
          value={readingMinutes}
          unit="min"
          valueColor={SYSTEM_COLORS_DARK.cyan}
        />
        <StatDivider />
        <Stat
          label="Best"
          value={streakLongest}
          unit={streakLongest === 1 ? "day" : "days"}
          valueColor={SYSTEM_COLORS_DARK.green}
        />
      </View>
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
  valueColor,
}: {
  label: string;
  /** Numeric value to display. Animated from 0 → value on mount. */
  value: number;
  unit: string;
  /**
   * Per-metric semantic color applied to the NUMBER + UNIT (Apple
   * Fitness recipe). Optional — when absent the value renders in
   * full ink white (the previous behavior). Pass one of the
   * `SYSTEM_COLORS_DARK` tokens so the whole app stays in family
   * with Apple's published iOS palette.
   *
   * The colored value/uncolored label split is Apple's exact
   * pattern: in Fitness's Summary screen, "Step Count" is white
   * but "3,492" is purple; "Step Distance" is white but
   * "1.42 MI" is cyan. Chrome monochromatic, content vibrant.
   */
  valueColor?: string;
}) {
  const colors = useColors();
  const ticked = useTickedNumber(value, 900);
  // Default to ink white when no per-metric color is supplied so
  // the component remains backward-compatible (the previous
  // render path) and can be used outside the home StatRow if
  // ever wanted.
  const valueTint = valueColor ?? colors.ink;
  return (
    // Apple Fitness metric column. The number does the heavy lifting
    // (display-sized ExtraBold with negative tracking) in its
    // semantic color, the unit picks up the SAME color (Apple's
    // "990 CAL" / "1.42 MI" treatment), and the label sits BELOW
    // in neutral small-caps caption — the inverted relationship
    // Apple uses on every Fitness/Health metric row.
    //
    // Why label-below + colored-value:
    //   • The number is the emotional answer ("12") so we lead
    //     with it visually AND give it the metric's brand color
    //     so the eye instantly reads "orange = streak."
    //   • The label answers "12 what?" — a follow-up the eye
    //     wants right after, in quiet neutral type so it doesn't
    //     compete with the colored number above it.
    //   • This vertical order gives the row a clean Apple-grade
    //     "ridgeline" across the page where all three colored
    //     numbers align at the top edge of the row.
    <View
      style={{
        flex: 1,
        alignItems: "center",
        paddingVertical: 6,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "baseline",
        }}
      >
        <Text
          style={{
            fontFamily: "PlusJakartaSans_800ExtraBold",
            color: valueTint,
            fontSize: 42,
            lineHeight: 46,
            letterSpacing: -1.6,
          }}
        >
          {ticked}
        </Text>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_600SemiBold",
            color: valueTint,
            fontSize: 13,
            marginLeft: 5,
            letterSpacing: -0.2,
          }}
        >
          {unit}
        </Text>
      </View>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: colors.inkSubtle,
          fontSize: 10,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginTop: 8,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function StatDivider() {
  const colors = useColors();
  return (
    // Vertical hairline between metric columns. Taller than the
    // previous 32pt (now ~56pt) because the numbers themselves
    // grew — a divider that's shorter than the content it
    // separates reads visually broken. We also nudged the
    // opacity down by routing through `border` (still the theme
    // token) so the divider feels structural without competing
    // with the now-louder numbers.
    <View
      style={{
        width: StyleSheet.hairlineWidth,
        backgroundColor: colors.border,
        alignSelf: "stretch",
        marginVertical: 6,
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────
// StreakChip — top-bar streak pill (🔥 4)
// ─────────────────────────────────────────────────────────────────
//
// A small flame + count pill that lives at the top-right of the
// home header. Mirrors Duolingo / Snapchat / Opal: the streak
// signal is a UNIVERSAL "fire" that doesn't change color day to
// day. Always amber, regardless of which sermon type runs that
// day — the chip is the user's momentum, not part of the day's
// content palette.
//
// (Earlier this took the per-sermon accent and rendered as a
// teal/green/purple "fire" depending on the sermon, which read as
// a colored droplet, not a flame. The fire is the fire — making
// it accent-tinted broke the metaphor.)

const FIRE_AMBER = "#FFB672";
const FIRE_DEEP = "#FF8A3B";

/**
 * StreakHeadline — large, prominent streak display surfaced
 * directly under the "Home" page title.
 *
 * Anatomy:
 *   ┌────────────────────────────────────────────┐
 *   │  🔥  36  day streak · best 41               │
 *   └────────────────────────────────────────────┘
 *
 *   • Big amber gradient flame (~26pt) — the "fire" of the
 *     daily practice. Larger than the corner StreakChip so it
 *     reads as an editorial anchor, not chrome.
 *   • Display-weight count (38pt ExtraBold) in the FIRE_AMBER
 *     hue — gives the number real weight without painting the
 *     count on a colored backdrop.
 *   • Compact two-line label to the right:
 *       line 1: "day streak"  (Sans 13pt Medium, ink)
 *       line 2: "best · N"    (Sans 11pt Medium, muted)
 *     Stacked so the number stays the visual anchor and the
 *     supporting text whispers context underneath.
 *   • "Honored today" subtle green dot to the right of "day
 *     streak" — confirms today is locked in without painting
 *     extra UI. Hidden when the streak is alive but today's
 *     sermon isn't done yet (gentle prompt to come back).
 *
 * Placed inside the top header block so it inherits the page
 * padding (`px-6`) — caller doesn't need to handle layout.
 */
function StreakHeadline({
  count,
  longest,
  honoredToday,
}: {
  count: number;
  longest: number;
  /** Marked unused via leading underscore — the inline variant
   *  no longer surfaces a "honored today" indicator. The flag
   *  remains in the API so the parent doesn't have to branch
   *  the prop spread, and so a future iteration can re-add
   *  the indicator without a signature change. */
  honoredToday?: boolean;
}) {
  const colors = useColors();
  // `honoredToday` is intentionally unread in the inline layout
  // — see prop-doc above. Reference it once so TS' `noUnused
  // Parameters` rule stays quiet without `void` ceremony.
  void honoredToday;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "baseline",
      }}
      accessibilityRole="text"
      accessibilityLabel={`${count} day streak${longest > count ? `, best ${longest}` : ""}`}
    >
      {/* Compact flame anchor — sized to sit on the baseline
          of the surrounding "Home" page title (32pt). The
          flame uses the same amber→deep-orange gradient as
          the celebration FlameMark so the chip reads as
          "the same fire, smaller". */}
      <Svg
        width={14}
        height={17}
        viewBox="0 0 24 28"
        style={{ alignSelf: "center", marginRight: 6 }}
      >
        <Defs>
          <LinearGradient id="streakHeadlineFlame" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={FIRE_AMBER} stopOpacity={1} />
            <Stop offset="100%" stopColor={FIRE_DEEP} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Path
          d="M12 0c-2 4 1 6-2 9-2 2-4 4-4 8a8 8 0 0016 0c0-3-1-5-3-7-2-2 0-4-2-7-1 2-2 3-3 3 0-2 0-4-2-6z"
          fill="url(#streakHeadlineFlame)"
        />
      </Svg>

      <Text
        style={{
          fontFamily: "PlusJakartaSans_800ExtraBold",
          color: FIRE_AMBER,
          fontSize: 22,
          lineHeight: 26,
          letterSpacing: -0.4,
        }}
        allowFontScaling={false}
      >
        {count}
      </Text>

      <Text
        style={{
          fontFamily: "PlusJakartaSans_600SemiBold",
          color: colors.inkMuted,
          fontSize: 13,
          letterSpacing: -0.1,
          marginLeft: 5,
        }}
      >
        day{count === 1 ? "" : "s"}
      </Text>
    </View>
  );
}

function StreakChip({ count }: { count: number }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: withAlpha(FIRE_AMBER, 0.4),
        backgroundColor: withAlpha(FIRE_AMBER, 0.14),
      }}
      accessibilityRole="text"
      accessibilityLabel={`${count} day streak`}
    >
      {/* Filled flame with a deep-orange gradient → amber tip. The
          same gradient family as the big celebration FlameMark
          on the post-streak screen, scaled down — so the chip
          reads as "the same fire, smaller" and not a different
          object. */}
      <Svg width={11} height={13} viewBox="0 0 24 28">
        <Defs>
          <LinearGradient id="streakChipFlame" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={FIRE_AMBER} stopOpacity={1} />
            <Stop offset="100%" stopColor={FIRE_DEEP} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Path
          d="M12 0c-2 4 1 6-2 9-2 2-4 4-4 8a8 8 0 0016 0c0-3-1-5-3-7-2-2 0-4-2-7-1 2-2 3-3 3 0-2 0-4-2-6z"
          fill="url(#streakChipFlame)"
        />
      </Svg>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: FIRE_AMBER,
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
            onValueChange={(next) => {
              haptics.tick();
              onToggle(next);
            }}
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
