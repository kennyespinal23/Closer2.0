import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  Circle,
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
import { HomeDevotionalCarousel } from "@/components/HomeDevotionalCarousel";
import { useFocusMiniPlayerSpacing } from "@/components/FocusMiniPlayer";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import { LivingHeroIcon } from "@/components/LivingHeroIcon";
import { ShieldOverlay } from "@/components/ShieldOverlay";
import { StatusPill, type StatusPillTone } from "@/components/StatusPill";
import { SFSymbol, type SFSymbolName } from "@/components/Symbol";
import {
  FocusStatusSheet,
  type FocusStatusSheetState,
} from "@/components/FocusStatusSheet";
import { resolveShieldPrimaryPath } from "@/lib/deviceActivityShield";
import * as haptics from "@/lib/haptics";
import { SCREEN_H_PAD } from "@/lib/layout";
import type { ShieldPrimaryPath } from "@/lib/shieldCopy";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { buildCurrentWeek, type RhythmCellState } from "@/lib/rhythm";
import {
  momentDurationMin,
  nextMoment,
  resolveSermonTypeForMoment,
  toHomeCard,
  type Moment,
} from "@/lib/moments";
import {
  getMilestoneAccent,
  isMilestoneUnlocked,
  MILESTONES,
} from "@/lib/milestones";
import { useMilestoneUnlockStreak } from "@/lib/useMilestoneUnlockStreak";
import { formatMinutes, formatRemaining } from "@/lib/readingGoalFormat";
import { getGreeting } from "@/lib/greeting";
import { systemText, typography } from "@/lib/typography";
import { shouldOfferManualFocusShield, SOCIAL_APPS, type SocialAppId } from "@/lib/focus";
import { BrandGlyph } from "@/components/BrandGlyph";
import { findMood } from "@/constants/moods";
import { SERMON_TYPES, type SermonType } from "@/constants/sermonTypes";
import { CLOSER_ACCENT, SYSTEM_COLORS_DARK } from "@/constants/theme";
import { type FloatingScriptureCard } from "@/constants/homePrototype";
import { natureBackdropQueryForDay } from "@/services/unsplashService";
import { type CheckIn, useCheckIns } from "@/state/checkIns";
import { useFocus } from "@/state/focus";
import { useMoments } from "@/state/moments";
import { useOnboarding } from "@/state/onboarding";
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
  const { answers } = useOnboarding();
  const { log: checkInLog } = useCheckIns();
  const { todaysMoment } = useMoments();
  const progress = useProgress();
  const {
    streak,
    hasCompletedSermonToday,
    hasCompletedSermonForDay,
    sermonCompletions,
    recordCompletion,
  } = progress;
  const milestoneUnlockStreak = useMilestoneUnlockStreak();
  // (engagedDates destructure removed alongside the home "Your
  // rhythm" RhythmGrid; the grid now lives only on the /rhythm
  // detail page reached from the top-right streak chip, and
  // that screen reads engagedDates directly from useProgress
  // inside StreakDashboard rather than via this surface.)
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
  } = useFocus();
  const {
    sessions: studySessions,
    toggleSession: toggleStudySession,
  } = useStudySessions();

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
  const [shieldPreviewPath, setShieldPreviewPath] =
    useState<ShieldPrimaryPath>("manual");

  useEffect(() => {
    void resolveShieldPrimaryPath().then(setShieldPreviewPath);
  }, []);

  // Focus-status sheet visibility. Toggled by the eye-button on
  // the Gentler-Streak hero (next to "Hi {firstName},") and by the
  // sheet's own Close X. The sheet itself reads focus state and
  // study sessions via the same useFocus/useStudySessions hooks
  // above so the displayed pill state stays in sync without
  // having to pass current state through props every render.
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);

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

  // Home-card editorial preview — full teaser, collapsed to single-
  // spaced body copy (catalog authors `\n\n` between beats; double
  // newlines read as awkward gaps on the hero).
  const homeBlurb = useMemo(
    () => firstParagraphOf(todaysMoment.story),
    [todaysMoment.story],
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

  // useCallback so the SermonCard / ImprintSermonCard / GentlerStreak
  // hero (all React.memo-wrapped) don't re-render when an unrelated
  // bit of TodayScreen state changes. Deps cover every reactive value
  // the closure reads — re-creating the handler is acceptable cost
  // because it only happens when focus prefs or today's moment day
  // actually change, both of which already imply the hero card props
  // changed too.
  const handlePlaySermon = useCallback(() => {
    // Navigate first — never let focus / Screen Time setup block
    // or race the sermon route. A native shield call can't be
    // caught by JS; starting focus after push keeps Read Now
    // resilient even when blocking misbehaves on device.
    router.push({
      pathname: "/sermon/scripture",
      params: { continuity: "1" },
    });

    const focusOffered = shouldOfferManualFocusShield(focusPrefs);
    if (focusOffered) {
      void startFocusSession(todaysMoment.day).catch(() => {
        /* focus is best-effort; never block the sermon entry */
      });
    }
  }, [
    focusPrefs.enabled,
    focusPrefs.blockedAppIds,
    todaysMoment.day,
    startFocusSession,
    router,
  ]);

  /**
   * Floating-card hold-to-unlock: save completion, clear focus,
   * then streak → milestone when the day advances.
   */
  const handleCompleteFloatingCard = useCallback(
    (card: FloatingScriptureCard) => {
      const { newStreak, streakAdvanced, crossedMilestone } =
        recordCompletion("daily", {
          title: card.title || card.scriptureReference,
          pastor: "",
          day: card.day,
        });
      void endFocusSession().catch(() => {
        /* shield stop is best-effort */
      });
      if (streakAdvanced) {
        router.replace({
          pathname: "/sermon/streak",
          params: {
            days: String(newStreak),
            milestone: crossedMilestone ? String(crossedMilestone) : "",
          },
        });
      }
    },
    [endFocusSession, recordCompletion, router],
  );

  const carouselCards = useMemo(() => {
    const todayType = resolveSermonTypeForMoment(todaysMoment);
    return [
      {
        key: `day-${todaysMoment.day}`,
        title: todaysMoment.title,
        blurb: homeBlurb,
        typeName: todayType.name,
        accent: todayType.accent,
        readMinutes: sermonDurationMin,
        typeId: todayType.id,
        sermonDay: todaysMoment.day,
        illustrationPrompt: natureBackdropQueryForDay(todaysMoment.day),
        active: true,
        completed: hasCompletedSermonForDay(todaysMoment.day),
        onPress: handlePlaySermon,
      },
    ];
  }, [
    todaysMoment,
    homeBlurb,
    sermonDurationMin,
    hasCompletedSermonForDay,
    handlePlaySermon,
  ]);

  const homeCardContent = useMemo(() => {
    const card = toHomeCard(todaysMoment);
    const completion = sermonCompletions
      .filter((c) => c.day === todaysMoment.day)
      .sort((a, b) => b.completedAt - a.completedAt)[0];
    const earnedMilestones = MILESTONES.filter((m) =>
      isMilestoneUnlocked(m, milestoneUnlockStreak),
    ).map((m) => ({
      title: m.title,
      accent: getMilestoneAccent(m).color,
    }));
    const greeting = getGreeting();
    const now = new Date();
    const dateLabel = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
    const blockedIds =
      focusSession?.blockedAppIds ?? focusPrefs.blockedAppIds ?? [];
    const hasEnabledSession = studySessions.some((s) => s.enabled);
    const blocksOn =
      focusSession !== null ||
      (hasEnabledSession && blockedIds.length > 0);

    let nextBreakLabel = "No app break scheduled yet";
    let nextBreakTone: "live" | "armed" | "muted" = "muted";
    if (focusSession !== null) {
      nextBreakLabel = "App break is on now";
      nextBreakTone = "live";
    } else {
      let best: Date | null = null;
      for (const s of studySessions) {
        if (!s.enabled) continue;
        const when = computeNextOccurrence(s.time, s.daysOfWeek, now);
        if (!when) continue;
        if (!best || when.getTime() < best.getTime()) best = when;
      }
      if (best) {
        nextBreakTone = "armed";
        const time = format12h({
          hour: best.getHours(),
          minute: best.getMinutes(),
        });
        const sameDay = best.toDateString() === now.toDateString();
        if (sameDay) {
          nextBreakLabel = `Next app break · Today ${time}`;
        } else {
          const tomorrow = new Date(now);
          tomorrow.setDate(now.getDate() + 1);
          if (best.toDateString() === tomorrow.toDateString()) {
            nextBreakLabel = `Next app break · Tomorrow ${time}`;
          } else {
            const dayName = best.toLocaleDateString("en-US", {
              weekday: "long",
            });
            nextBreakLabel = `Next app break · ${dayName} ${time}`;
          }
        }
      }
    }

    return {
      card,
      completedAt: completion?.completedAt ?? null,
      earnedMilestones,
      greetingText: greeting.text,
      greetingEmoji: greeting.emoji,
      dateLabel,
      blocksOn,
      blockedAppIds: blockedIds,
      nextBreakLabel,
      nextBreakTone,
      unlockedToday: hasCompletedSermonToday,
      onCompleteCard: handleCompleteFloatingCard,
    };
  }, [
    todaysMoment,
    sermonCompletions,
    milestoneUnlockStreak,
    focusSession,
    focusPrefs.blockedAppIds,
    studySessions,
    hasCompletedSermonToday,
    handleCompleteFloatingCard,
  ]);

  const handleOpenCompleted = useCallback(() => {
    haptics.soft();
    router.push("/completed-sermons");
  }, [router]);

  // Stable refs for the AppBlocksList + RhythmGrid children, which
  // are React.memo'd downstream. Without these the parent re-creates
  // the closures on every render and defeats the memo entirely.
  const handleToggleStudySession = useCallback(
    (id: string) => {
      haptics.tap();
      void toggleStudySession(id);
    },
    [toggleStudySession],
  );
  const handleOpenStudySessions = useCallback(() => {
    haptics.soft();
    router.navigate("/blocks");
  }, [router]);
  const handleOpenRhythm = useCallback(() => {
    router.push("/rhythm");
  }, [router]);

  const handleOpenLastCheckIn = useCallback(() => {
    if (!lastCheckIn) return;
    haptics.soft();
    router.push(`/check-ins/${lastCheckIn.id}` as never);
  }, [lastCheckIn, router]);

  const handleOpenProfile = useCallback(() => {
    // Profile is now a first-class TAB (see app/(tabs)/_layout.tsx)
    // rather than a presented drawer. The avatar tap remains as a
    // shortcut for users who learned the drawer pattern; under the
    // hood we just navigate to the profile tab so the bottom-bar
    // selection state stays in sync with where the user actually is.
    haptics.soft();
    router.navigate("/profile");
  }, [router]);

  // ─── Focus-status sheet plumbing ──────────────────────────────
  //
  // Computes the same live/armed/off triage the home Blocks pill
  // uses, but in a form the sheet wants directly:
  //   • state         — drives copy + CTA + pill color
  //   • blockedAppIds — which apps to list inside the sheet
  //
  // The two callbacks the sheet exposes:
  //   • handleEndFocusFromSheet — used on the LIVE state's CTA;
  //     ends the current session via state/focus.tsx.
  //   • handleManageBlocksFromSheet — used on ARMED + OFF; just
  //     navigates to the existing study-sessions editor.
  const focusSheetState: FocusStatusSheetState =
    focusSession !== null
      ? "live"
      : studySessions.some((s) => s.enabled)
        ? "armed"
        : "off";
  // App list resolution mirrors the same precedence the home
  // Blocks pill uses: live session snapshot wins, otherwise the
  // routine's per-routine list, otherwise the global focus prefs
  // list. Falls back to an empty array so the sheet renders the
  // "no apps" state cleanly.
  const focusSheetAppIds: ReadonlyArray<string> =
    focusSession?.blockedAppIds ?? focusPrefs.blockedAppIds ?? [];

  const handleShowStatus = useCallback(() => {
    haptics.soft();
    setStatusSheetVisible(true);
  }, []);
  const handleCloseStatus = useCallback(() => {
    setStatusSheetVisible(false);
  }, []);
  const handleEndFocusFromSheet = useCallback(() => {
    endFocusSession().catch(() => {
      /* end is best-effort; provider state stays consistent on retry */
    });
  }, [endFocusSession]);
  const handleManageBlocksFromSheet = useCallback(() => {
    router.push("/settings/study-sessions");
  }, [router]);

  // ─── Header status pill (Gentler Streak-style) ─────────────────
  //
  // ONE chip that mirrors the reference Gentler-Streak design:
  // "Status: Active ●" floats at the top of the home page with a
  // tinted status dot signalling what the app-block system is
  // doing for the user right now.
  //
  // ALWAYS RENDERED — even when no blocks are configured the pill
  // shows "Status: Off" with a muted dot. Keeping the chip
  // permanently mounted means the user always has a glance-able
  // anchor for the system and an obvious tap target to set blocks
  // up. Earlier iterations hid the pill on the off state, but
  // that left a brand-new user with no visible affordance for the
  // feature at all on the home page.
  //
  // Tone matrix:
  //   • LIVE  (focus session firing)         → "Active", green pulse
  //   • ARMED (block enabled, not firing)    → "Armed",  amber dot
  //   • OFF   (no enabled blocks)            → "Off",    muted dot
  const statusPills = useMemo(() => {
    type Pill = {
      key: "blocks";
      label: string;
      value: string;
      tone: StatusPillTone;
      pulse?: boolean;
      /** How many apps are configured for blocking (live snapshot
       *  if a session is firing, otherwise the routine/global
       *  blocklist count). Surfaced on the second line of the
       *  HeroStatusRow as "{n} Apps Blocked" when protection is
       *  active. Zero when the user has no apps selected, which
       *  the row treats as the Inactive state regardless of
       *  whether any sessions are technically enabled — "0 Apps
       *  Blocked" would read as protection-is-on-but-doing-
       *  nothing, which is the wrong mental model. */
      blockedCount: number;
      onPress: () => void;
    };

    // Two-state protection vocabulary — Active vs Inactive — per
    // the Apple Design Lead spec. The finer-grained LIVE / ARMED
    // / OFF triage still drives the visual TONE (green pulse on
    // live, amber on armed, grey on inactive) so screenreaders
    // and the status icon both reinforce what's actually
    // happening, but the headline copy stays binary so the user
    // doesn't have to learn a third state vocabulary.
    //
    //   • LIVE  (focus session firing)         → "Active", green pulse
    //   • ARMED (block enabled, not firing)    → "Active", amber
    //   • OFF   (no enabled blocks)            → "Inactive", muted
    //
    // The dot color still carries the finer state in the row's
    // leading status indicator: a green pulsing fill on LIVE, a
    // solid green fill on ARMED, an outline ring on OFF.
    const hasEnabledSession = studySessions.some((s) => s.enabled);
    const blockedCount = focusSheetAppIds.length;
    let value: string;
    let tone: StatusPillTone;
    let pulse = false;
    if (focusSession !== null) {
      value = "Active";
      tone = "live";
      pulse = true;
    } else if (hasEnabledSession && blockedCount > 0) {
      value = "Active";
      tone = "armed";
    } else {
      value = "Inactive";
      tone = "muted";
    }

    const pills: Pill[] = [
      {
        key: "blocks",
        label: "App Blocking",
        value,
        tone,
        pulse,
        blockedCount,
        onPress: handleOpenStudySessions,
      },
    ];
    return pills;
  }, [
    studySessions,
    focusSession,
    focusSheetAppIds,
    handleOpenStudySessions,
  ]);

  // ─── Shared status pill row JSX ──────────────────────────────
  // Single JSX value reused by both layouts:
  //   1. Regular days: rendered between the "Home" title and the
  //      "Daily Devotional" section ribbon.
  //   2. Gentler-Streak A/B days: rendered above the full-bleed
  //      editorial hero, since that day's layout suppresses the
  //      whole regular header. Keeping it in a shared variable
  //      means the chip language stays identical between layouts
  //      and we don't end up with two copy-pasted blocks to keep
  //      in sync. Renders null when no pills resolve so empty
  //      home (brand-new user) doesn't leave a ghost gap.
  //
  // Why a flex-wrap row over a horizontal ScrollView: the chips
  // are SHORT (< 80pt each) and there are at most 3, so they
  // comfortably fit one row even on iPhone SE. Wrap lets the
  // layout breathe if a future chip overflows; a ScrollView
  // would feel like a rail and invite scroll-to-discover
  // behavior we don't want for ambient status.
  const statusPillRow =
    statusPills.length > 0 ? (
      <View
        style={{
          marginTop: 16,
          flexDirection: "row",
          flexWrap: "wrap",
          // Negative left margin pairs with each chip's
          // marginLeft to give clean 8pt gutter without
          // needing flex-gap (still spotty on older RN).
          marginLeft: -8,
        }}
        accessibilityRole="toolbar"
        accessibilityLabel="Today's status"
      >
        {statusPills.map((pill) => (
          <View key={pill.key} style={{ marginLeft: 8, marginBottom: 8 }}>
            <StatusPill
              label={pill.label}
              value={pill.value}
              tone={pill.tone}
              pulse={pill.pulse}
              onPress={pill.onPress}
            />
          </View>
        ))}
      </View>
    ) : null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <HomeDevotionalCarousel
        cards={carouselCards}
        onCompletedPress={handleOpenCompleted}
        streakCount={streak.current}
        onStreakPress={handleOpenRhythm}
        cardContent={homeCardContent}
      />


      {/* ShieldOverlay — mounted at the SafeArea root so it covers
          the full screen + tab bar when visible. The Modal handles
          its own z-ordering. `previewAppId` is the single source
          of visibility — null hides the overlay, any string id
          shows it. */}
      <ShieldOverlay
        appId={previewAppId ?? "instagram"}
        visible={previewAppId !== null}
        primaryPath={shieldPreviewPath}
        onClose={() => setPreviewAppId(null)}
      />

      {/* FocusStatusSheet — bottom-sheet popup explaining the
          current app-block state. Opened by the eye button next
          to the greeting on the Gentler-Streak hero, mirrors
          Gentler Streak's "Go Gentler" recommendation popup
          pattern. State + app list are derived above; the
          sheet itself is pure presentation + dispatch. */}
      <FocusStatusSheet
        visible={statusSheetVisible}
        onClose={handleCloseStatus}
        state={focusSheetState}
        blockedAppIds={focusSheetAppIds as ReadonlyArray<SocialAppId>}
        onEndFocus={handleEndFocusFromSheet}
        onManageBlocks={handleManageBlocksFromSheet}
      />
    </View>
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
          className="text-ink-muted text-[11px] tracking-[1px] uppercase"
          style={{ fontFamily: "System", fontWeight: "700" }}
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
              fontFamily: "System",
              fontWeight: "700",
              color: reached ? colors.ink : minutes > 0 ? RING_ACCENT : colors.ink,
            }}
            numberOfLines={1}
          >
            {headline}
          </Text>
          {headlineSuffix ? (
            <Text
              className="text-ink-muted text-[13px] leading-[18px]"
              style={{ fontFamily: "System", fontWeight: "500" }}
              numberOfLines={1}
            >
              {headlineSuffix}
            </Text>
          ) : null}
        </View>
        <Text
          className="text-ink-muted text-[12px] mt-0.5"
          style={{ fontFamily: "System", fontWeight: "500" }}
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

const AppBlocksList = memo(function AppBlocksList({
  sessions,
  onToggle,
  onAdd,
  onEdit,
}: {
  sessions: ReadonlyArray<StudySession>;
  onToggle: (id: string) => void;
  onAdd: () => void;
  // Tapping a populated row hands off to the editor so the user
  // can change the time, the days, or which apps the block
  // silences. The list itself stays a thin overview; deep edits
  // happen in /settings/study-sessions.
  onEdit: (id: string) => void;
}) {
  const colors = useColors();
  const isEmpty = sessions.length === 0;

  // Section title sits OUTSIDE the card (Apple Fitness / TV
  // section-header pattern); the elevated surface below holds
  // only the schedule rows or the empty-state explainer.
  return (
    <View style={{ marginHorizontal: SCREEN_H_PAD }}>
      <Text
        style={[systemText.title2, { color: colors.ink }]}
        accessibilityRole="header"
      >
        My App Blocks
      </Text>

      <View
        style={{
          marginTop: 16,
          paddingHorizontal: SCREEN_H_PAD,
          paddingTop: isEmpty ? 24 : 8,
          paddingBottom: isEmpty ? 24 : 8,
          borderRadius: 24,
          backgroundColor: colors.surfaceSecondary,
        }}
      >
        {isEmpty ? (
          <AppBlocksEmptyState onAdd={onAdd} />
        ) : (
          <View>
            {sessions.map((session, idx) => (
              <AppBlockRow
                key={session.id}
                session={session}
                onToggle={onToggle}
                onEdit={onEdit}
                showDivider={idx > 0}
              />
            ))}
          </View>
        )}
      </View>
    </View>
  );
});

/**
 * AppBlocksEmptyState — onboarding-style explainer for users
 * who haven't set up a block yet. Apple rarely leaves feature
 * regions visually empty (per the audit); their pattern is to
 * frame the empty state as a CHOICE the user hasn't made yet:
 * short headline + one-sentence framing + clear primary action.
 *
 * Headline answers "what is this?", description answers "why
 * does this exist for me?", action answers "how do I start?".
 * Modeled on Apple Health's "Set up Cycle Tracking" empty card
 * and Apple Journal's "Start a New Entry" empty surface.
 *
 * Framing ties the feature back to Closer's mission ("free up
 * space for what matters") so the user understands the block
 * isn't just a utility — it's part of the devotional rhythm.
 */
const AppBlocksEmptyState = memo(function AppBlocksEmptyState({
  onAdd,
}: {
  onAdd: () => void;
}) {
  const colors = useColors();
  return (
    <View>
      <Text
        style={[systemText.headline, { color: colors.ink }]}
      >
        Schedule your first block
      </Text>
      <Text
        style={[
          systemText.subheadline,
          { color: colors.inkSecondary, marginTop: 8 },
        ]}
      >
        Quiet the apps that pull on you most during the time
        you set aside for God.
      </Text>
      <Pressable
        onPress={() => {
          haptics.soft();
          onAdd();
        }}
        accessibilityRole="button"
        accessibilityLabel="Set up a block"
        accessibilityHint="Opens the schedule editor where you can pick a time and apps to block"
        style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
      >
        <View
          style={{
            marginTop: 24,
            backgroundColor: colors.surfaceTertiary,
            borderRadius: 16,
            paddingVertical: 16,
            paddingHorizontal: SCREEN_H_PAD,
            alignItems: "center",
            justifyContent: "center",
            minHeight: 48,
          }}
        >
          <Text
            style={{
              color: colors.ink,
              fontFamily: "System",
              fontWeight: "600",
              fontSize: 15,
              letterSpacing: 0.2,
            }}
          >
            Set Up a Block
          </Text>
        </View>
      </Pressable>
    </View>
  );
});

const AppBlockRow = memo(function AppBlockRow({
  session,
  onToggle,
  onEdit,
  showDivider,
}: {
  session: StudySession;
  // (id) signature lets the parent pass one stable ref shared across
  // every row instead of allocating a per-row closure on each render.
  // Memo can then actually short-circuit when other rows change.
  onToggle: (id: string) => void;
  // Tap-the-row → open the editor. Same id-based shape as
  // onToggle so the parent passes one stable ref for the
  // whole list.
  onEdit: (id: string) => void;
  /** True for every row EXCEPT the first — adds a hairline
   *  separator above the row. The audit forbids the
   *  bordered-card chrome the previous version relied on for
   *  separation, so we use a single 1px inkSubtle rule
   *  between rows instead (Apple's inset-grouped list
   *  pattern: hairlines INSIDE the card, no outer border). */
  showDivider?: boolean;
}) {
  const colors = useColors();
  // The row is a Pressable that hands off to the editor; the
  // trailing Switch is rendered as a sibling INSIDE the
  // Pressable but with its own onValueChange, so iOS treats
  // the switch gesture as the higher-precedence target. The
  // earlier build wrapped the same content in a plain View —
  // there was nothing to tap, so a user with a scheduled
  // block could only flip it on/off and never reach the
  // editor to change the time or the apps it silences. (See
  // June 2026 design review.)
  return (
    <Pressable
      onPress={() => {
        haptics.soft();
        onEdit(session.id);
      }}
      accessibilityRole="button"
      accessibilityLabel={`Edit block at ${formatTimeOfDay(session.time)}`}
      accessibilityHint="Opens the schedule editor where you can change the time, days, or blocked apps"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderTopWidth: showDivider ? StyleSheet.hairlineWidth : 0,
        borderTopColor: colors.border,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flex: 1, paddingRight: 16 }}>
        {/* Time leads (Apple Calendar / iOS Alarms pattern — the
            primary line of a scheduled-event row is WHEN it
            happens, not what it's named). The routine's user-
            given name lives as the subtitle so power users who
            named their sessions ("Morning Devotion") still see
            them, but the row reads cleanly at a glance for
            users who haven't named anything. */}
        <Text
          style={[systemText.headline, { color: colors.ink }]}
          numberOfLines={1}
        >
          {formatTimeOfDay(session.time)}
        </Text>
        <Text
          style={[
            systemText.footnote,
            { color: colors.inkMuted, marginTop: 4 },
          ]}
          numberOfLines={1}
        >
          {formatDaysOfWeek(session.daysOfWeek)} ·{" "}
          {formatAppCount(session.blockedAppIds.length)}
        </Text>
      </View>
      <Switch
        value={session.enabled}
        onValueChange={() => {
          // Switch passes the new boolean but we ignore it — the
          // parent's onToggle is an id-based toggle, not a setter,
          // and the local optimistic state in the provider drives
          // the value display so this stays correct without a
          // round-trip.
          haptics.tick();
          onToggle(session.id);
        }}
        // iOS-style green track for on, neutral surface for off —
        // matches Settings.app affordance so the toggle reads as
        // "this is the system switch" without any custom learning.
        ios_backgroundColor={colors.border as string}
        accessibilityLabel={`Toggle block at ${formatTimeOfDay(session.time)}`}
      />
    </Pressable>
  );
});

/* AppBlockAddRow — removed in the v1 home redesign. The empty
   state now uses AppBlocksEmptyState (title + description +
   primary action) per the audit; the populated state caps at
   one block so an in-list "+ Add" affordance was redundant.
   Users with a block who want to edit it tap the row to open
   the schedule editor. If/when multi-block support lands, this
   component can be reintroduced from git history (it was the
   iOS-Settings-style "+ Add another time" footer row). */

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

/**
 * Extract the first paragraph of any blank-line-separated string
 * (a sermon's `teaser` or a panel `body`). Used by the home card
 * to show ONLY the first beat of the editorial teaser as a tight
 * preview — the full multi-paragraph teaser would dominate the
 * card and push the Read Now CTA off-screen on smaller phones.
 *
 * Paragraphs are separated by blank lines (`\n\n`), matching the
 * way the in-sermon panel renderer already splits them.
 */
function firstParagraphOf(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) return "";
  const [first] = trimmed.split(/\n\n+/);
  return first?.trim() ?? "";
}

/** Collapse authored `\n\n` paragraph breaks into normal body flow. */
function formatHomeTeaser(teaser: string): string {
  return teaser.trim().replace(/\n\n+/g, " ").replace(/\s+/g, " ");
}

// ─────────────────────────────────────────────────────────────────
// HeroStatusRow — protection status row (Apple Settings-row shape)
//
// Two-line status component that sits between the editorial closer
// and the Read Now CTA, surfacing the user's app-blocking state
// at a glance:
//
//   ┌────────────────────────────────────────────────────┐
//   │  ●   Protection Active                          ›  │
//   │      8 Apps Blocked                                │
//   └────────────────────────────────────────────────────┘
//
//   ┌────────────────────────────────────────────────────┐
//   │  ○   Protection Inactive                        ›  │
//   │      Turn on protection                            │
//   └────────────────────────────────────────────────────┘
//
// Shape borrows directly from Apple Settings disclosure rows
// (Apple Battery, Focus Mode status, Fitness rings summary):
//   • Leading status indicator (filled vs hollow — non-color
//     channel per HIG)
//   • Headline (state name) on top, supporting detail underneath
//   • Trailing chevron signaling "tap for more"
//   • Entire surface is one tappable target
//
// Replaces the earlier 44pt-tall chip (which only fit one line
// of text and so couldn't surface the live blocked-app count).
// The chip read as low-priority chrome; the row reads as a real
// status disclosure the user can act on.
//
// Tones still map to the same green/amber/grey vocabulary used
// elsewhere so a green leading dot here means the same thing it
// does on the standalone StatusPill row.
//
// Defined as a const arrow so Fast Refresh re-binds it cleanly
// on subsequent edits to this file (top-level function
// declarations added mid-session occasionally fail to resolve
// inside sibling memo'd components until the bundle is fully
// re-evaluated).
const HeroStatusRow = ({
  value,
  tone,
  pulse,
  blockedCount,
  onPress,
}: {
  /** "Active" or "Inactive" — drives the headline copy. */
  value: string;
  /** Finer LIVE/ARMED/OFF triage; reinforces the headline with
   *  the leading icon's fill color + pulse but never changes
   *  the visible state text. */
  tone: StatusPillTone;
  /** True ONLY when a focus session is actively firing. Drives
   *  the slow opacity pulse on the leading status dot so the
   *  user can tell at a glance "blocking is happening right
   *  now" vs "blocking is armed and waiting for its schedule". */
  pulse?: boolean;
  /** Number of apps in the active/armed blocklist — surfaced on
   *  the second line as "{n} Apps Blocked" when active. Ignored
   *  on the Inactive branch (where the subtitle becomes a CTA
   *  prompt instead). */
  blockedCount: number;
  /** Tap handler — wired by TodayScreen to open the
   *  FocusStatusSheet (the management screen for blocked apps,
   *  per Apple's status-then-detail disclosure pattern). */
  onPress: () => void;
}) => {
  const colors = useColors();
  // Pulse animation removed — the audit explicitly bans
  // infinite animations on the home surface ("No pulsing.
  // No infinite animations."). The fill/hollow icon shape
  // alone communicates state, with `isActive` reinforced
  // by the green systemFill. `pulse` is kept on the props
  // surface so callers don't have to remove it everywhere
  // at once, but it's intentionally a no-op here.
  void pulse;

  // Binary Active/Inactive disposition feeds copy + leading icon.
  // The status TONE (live/armed/muted) is preserved as visual
  // reinforcement (icon color), but the headline stays on the
  // two-state vocabulary so the user doesn't have to parse a
  // third word.
  const isActive = tone === "live" || tone === "armed";
  const title = isActive ? "Protection Active" : "Protection Inactive";
  const subtitle = isActive
    ? `${blockedCount} ${blockedCount === 1 ? "App" : "Apps"} Blocked`
    : "Turn on protection";

  // ── Surface hierarchy (Apple Health / Journal pattern) ──
  // The row is now a STANDALONE page section sitting directly
  // on the page background (#000), not nested inside the
  // devotional card. Per the home-section audit, every primary
  // section gets the same elevated surface treatment so the
  // eye reads them as parallel objects:
  //   • Devotional content card → surfaceSecondary
  //   • Protection card         → surfaceSecondary  ← this row
  //   • App Blocks card         → surfaceSecondary
  // (Previously this row used surfaceTertiary because it was a
  // nested element on top of the devotional card's surfaceSecondary.
  // Moving it OUT of the devotional card means it can step UP to
  // surfaceSecondary itself.)
  //
  // Typography hierarchy on the dark row:
  //   • Title    → `colors.ink`           (primary label)
  //   • Subtitle → `colors.inkSecondary`  (60% white)
  //   • Chevron  → `colors.inkSubtle`     (40% white)
  // Same descending tier of weight Apple uses inside Health's
  // metric rows: "Steps" headline + "1,432 — Today" subtitle +
  // chevron.
  const surfaceBg = colors.surfaceSecondary;
  const titleColor = colors.ink;
  const subtitleColor = colors.inkSecondary;
  const chevronColor = colors.inkSubtle;
  // System-on green (Apple SF Symbols semantic for "ENABLED")
  // for active, secondary-label gray for inactive. The
  // FILL/HOLLOW shape is the primary status channel (HIG:
  // never rely on color alone); the green is reinforcement
  // for sighted users who have learned the "system-on green"
  // affordance from iOS Settings.
  const iconColor = isActive
    ? SYSTEM_COLORS_DARK.green
    : colors.inkSecondary;

  // The row's visual surface lives on an INNER plain View, not on
  // the Pressable. The NativeWind/Pressable interop on this
  // codebase silently drops non-className flex/background/shadow
  // props from function-style `style` returns — the exact bug
  // pattern that caused the earlier HeroStatusPill to render
  // with no capsule for several iterations. Putting all surface
  // styling on a static inner View sidesteps the interop dance
  // and renders identically every time.
  //
  // Hit area: minHeight: 64 brings the visible row to ≥44pt
  // (well past the HIG floor for interactive elements), and the
  // hitSlop extends the press region another 8pt on every side
  // so users don't need to land precisely on the row.
  return (
    <Pressable
      onPress={() => {
        haptics.soft();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}. Tap to manage blocked apps.`}
      accessibilityHint="Opens the focus status sheet"
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      style={({ pressed }) => ({
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: surfaceBg,
          // Spec: horizontal padding 20pt, height 88pt,
          // corner radius 24pt. `minHeight` (not `height`)
          // preserves the row's resilience to Dynamic Type
          // — the row will grow past 88pt if the user has
          // Larger Text on, but never falls below 88pt
          // when copy is short.
          paddingHorizontal: 20,
          paddingVertical: 20,
          minHeight: 88,
          borderRadius: 24,
        }}
      >
        {/* Leading status glyph — SF Symbol shield (fill for
            ACTIVE, outline for INACTIVE). Apple-native concept
            map: shield.fill is iOS's universal "you are
            protected" affordance (Safari fraud warning, Mail
            privacy protection, Screen Time downtime — all use
            shield.fill on the green systemFill when active).
            
            Pure-shape distinction (filled vs outline) carries
            the channel without color, satisfying HIG's "never
            rely on color alone" rule; the green tint is
            reinforcement for sighted users who have learned
            the system-on green semantic from Settings.app.
            
            Sized at 18pt to read with the row's 15pt SemiBold
            title at the same optical weight — Apple's leading
            glyphs in Settings disclosure rows are calibrated
            slightly larger than the title's cap-height so the
            icon doesn't appear to "shrink" against the text.
            
            (Previously a custom SVG circle that ran an opacity
            pulse during LIVE focus sessions. The audit banned
            infinite animations on home, and the user's icon
            language pass replaced the placeholder geometry
            with a real native glyph the user already recognizes
            from iOS.) */}
        <View
          style={{
            marginRight: 12,
            width: 22,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SFSymbol
            name={isActive ? "shield.fill" : "shield"}
            size={18}
            weight="semibold"
            color={iconColor}
          />
        </View>

        {/* Title + subtitle stack — flex:1 so the chevron stays
            pinned to the trailing edge regardless of subtitle
            length. Title is the bold state name, subtitle is
            the supporting count/CTA in the muted ink. Same
            Plus Jakarta Sans family the rest of the home page
            uses so the row reads as part of the existing
            typographic system, not a foreign Settings panel. */}
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={1}
            style={[
              systemText.subheadline,
              {
                fontWeight: "600",
                color: titleColor,
              },
            ]}
          >
            {title}
          </Text>
          <Text
            numberOfLines={1}
            style={[
              systemText.footnote,
              {
                color: subtitleColor,
                marginTop: 2,
              },
            ]}
          >
            {subtitle}
          </Text>
        </View>

        {/* Trailing chevron — the iOS disclosure affordance.
            Signals "tap to drill into the management screen"
            (Apple Settings convention), and provides the only
            unambiguous "this is interactive" cue on a calm
            white row. Subtle 36% black so it sits as ambient
            chrome rather than competing with the title. */}
        <SFSymbol
          name="chevron.right"
          size={14}
          weight="semibold"
          color={chevronColor}
        />
      </View>
    </Pressable>
  );
};

const GentlerStreakSermonCard = memo(function GentlerStreakSermonCard({
  illustration,
  title,
  blurb,
  firstName,
  completed,
  streakCount = 0,
  typeName,
  typeIconSymbol,
  onPress,
  onProfilePress,
  statusPills,
  onShowStatus,
  onShowRhythm,
}: {
  /**
   * Full-bleed hero artwork for the top of the card. OPTIONAL —
   * when omitted the card renders a clean typography-only header
   * (TODAY'S DEVOTIONAL badge + avatar row at the top of the
   * body, no image, no overlay chrome). The image-less variant
   * was added for the v1 launch in June 2026 when per-sermon
   * cover artwork wasn't ready in time and the home card needed
   * to ship with no broken/placeholder images. Pass an
   * illustration again in v2 to restore the full-bleed editorial
   * hero exactly as it shipped originally — the rest of the
   * card's behavior (badge logic, status row, Read Now CTA) is
   * unchanged in either mode.
   */
  illustration?: ImageSourcePropType;
  title: string;
  /** Long-form context paragraph (regular weight, muted ink) —
   *  the first paragraph of the sermon's `teaser`. */
  blurb: string;
  firstName: string;
  /** True if the user has already completed today's devotional —
   *  drives the "TODAY'S WORD" marker visibility: shown ONLY for
   *  unread devotionals so the marker reads as "fresh content
   *  waiting for you" rather than a permanent label on the card. */
  completed: boolean;
  /** Current consecutive-day streak count. Drives the compact
   *  flame chip in the chrome row above the devotional region.
   *  Optional with a default of 0; the chip itself hides when 0
   *  so first-day users don't see "0 days" before they've earned
   *  the milestone. Matches Apple Fitness's pattern of hiding
   *  empty metrics rather than rendering placeholder zeros. */
  streakCount?: number;
  /** Today's sermon-type display name (e.g. "Daily Church",
   *  "Letters From A Struggling Christian"). Surfaced inline
   *  beneath the title as a compact category chip so the home
   *  card carries the type's identity without sacrificing the
   *  title's typographic dominance. Optional — when omitted
   *  the chip is hidden and the layout collapses cleanly. */
  typeName?: string;
  /** SF Symbol name paired with `typeName` in the inline type
   *  chip. Pulled from each sermon type's `iconSymbol` field
   *  in `constants/sermonTypes.ts`. Optional — when omitted
   *  the icon is suppressed; when both this and `typeName`
   *  are present, the chip renders icon + label inline. */
  typeIconSymbol?: SFSymbolName;
  onPress: () => void;
  onProfilePress: () => void;
  /** Header status pills (Streak / Blocks) lifted from
   *  TodayScreen and floated as overlay chrome over the hero
   *  image. Pre-computed by the parent so the card stays a
   *  pure presenter and doesn't have to know about focus
   *  sessions or streak math. Empty array hides the overlay
   *  row. */
  statusPills?: ReadonlyArray<{
    key: "streak" | "goal" | "blocks";
    label: string;
    value: string;
    tone: StatusPillTone;
    pulse?: boolean;
    /** Live count of apps currently in the blocklist — surfaced
     *  on the HeroStatusRow's second line when protection is
     *  active. Optional so other pill consumers (streak / goal)
     *  don't have to compute a value they'd never use. */
    blockedCount?: number;
    onPress: () => void;
  }>;
  /** Opens the focus-status sheet when the eye button next to the
   *  greeting is tapped. Passed in by TodayScreen because the
   *  sheet itself lives at the screen level (it's a Modal and
   *  needs to be mounted outside the card's render tree). When
   *  omitted the eye button is hidden entirely so we don't ship
   *  a button that opens nothing. */
  onShowStatus?: () => void;
  /** Tap handler for the streak hero card in the page chrome
   *  row. Wired to router.push('/rhythm') at the call site so
   *  the chip drills into the streak's history detail. When
   *  omitted the chip hides entirely (we don't ship a tappable
   *  surface that doesn't lead anywhere). */
  onShowRhythm?: () => void;
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

  // Dynamic greeting — replaces the static "Welcome back 👋"
  // subtitle with a time-of-day-aware line (Good morning ☀️ /
  // Good afternoon ☀️ / Good evening 🌙 / Good night 🌙). The
  // user wanted the home page to FEEL different across the day
  // without changing layout — the greeting and emoji swap is
  // the cheapest, highest-impact way to deliver that. Computed
  // at render time (not memoized) because the underlying value
  // is just a hour comparison; the cost is one new Date() per
  // render which is negligible. (`firstName` is still consumed
  // by the dead-code image-overlay variant's avatar initial.)
  const greeting = getGreeting();

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
  // Reduced 320 → 260 so the imprint card's primary CTA ("Read
  // Now") clears the floating tab bar on first viewport without
  // scrolling. With the previous 320pt hero plus the body
  // section, the button landed ~30pt below the fold — its
  // accent-red drop shadow bled UP behind the tab bar, which
  // users perceived as the button colliding with navigation
  // chrome (HIG: no interactive element may overlap another).
  // 260pt keeps the illustration commanding without pushing the
  // CTA off-screen, and reads close to Apple News article-hero
  // proportions (~30% of viewport).
  const heroHeight = 260;

  return (
    <View style={{ width: "100%" }}>
      {/* The whole card USED to be a single Pressable
          (onPress=onPress) so a tap anywhere in the title /
          blurb / illustration area navigated into the sermon.
          That meant a casual scroll-tap on the top of the home
          screen — including the status-bar-adjacent eyebrow
          and the avatar chip — fired the sermon-open. Per the
          June 2026 design review the card is now a plain View;
          ONLY the explicit Read Now / Read Again pill below
          navigates into today's sermon. Status pills, profile
          chip, and other interior controls keep their own
          dedicated handlers without competing with a parent
          card press. */}
      <View
        accessibilityRole="summary"
        accessibilityLabel={`Today's devotional: ${title}`}
      >
        {/* ── Hero illustration — FULL-BLEED, behind status bar ─
            ONLY renders when an `illustration` prop is provided.
            For v1 launch (June 2026) the home card ships without
            per-sermon cover artwork — the call site in TodayScreen
            stopped passing `illustration` — so the entire image
            block + overlaid chrome (TODAY'S DEVOTIONAL badge,
            profile avatar) below is gated on the prop. When art
            ships in v2, restoring it is a one-line change at the
            call site; this block's logic is preserved verbatim so
            the visual restoration is exact.
            
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
        {illustration ? (
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

          {/* "TODAY'S DEVOTIONAL" badge — surfaced only when
              the user has NOT yet completed today's devotional
              so the pill functions as a "what's waiting for you"
              cue rather than a permanent label. Relabeled from
              the earlier "NEW" treatment: HIG requires every UI
              element to clearly communicate its purpose, and a
              one-word "NEW" label out of context could mean a
              new feature, new entry, new release — anything.
              "TODAY'S DEVOTIONAL" is a complete, unambiguous
              statement of what the imprint card is.
              
              White capsule with black uppercase text — Apple
              News "Top Story" treatment. Maximum contrast,
              instantly readable over any photographic hero
              crop. Offset by insets.top so it lands just below
              the status bar.
              
              accessibilityRole="text" so VoiceOver reads it as
              a label rather than a button (the chip itself
              isn't tappable; it's a status badge). */}
          {!completed ? (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: insets.top + 8,
                left: 16,
                paddingHorizontal: 16,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: "#FFFFFF",
              }}
              accessible
              accessibilityLabel="Today's devotional, not yet read"
            >
              <Text
                style={[
                  systemText.captionEmphasized,
                  { color: "#000000", fontWeight: "700" },
                ]}
              >
                TODAY'S DEVOTIONAL
              </Text>
            </View>
          ) : null}

          {/* Profile avatar overlay — pinned to the image's
              top-right corner, same monogram chip we use in
              the regular home header. Offset by insets.top so
              it clears the status bar.
              
              Layered into three concentric components so each
              layer is handled by the most reliable React Native
              primitive for its job:
              
                1. Outer positioning <View>  — owns `position:
                   absolute, top, right`. Positioning lives on a
                   plain View because NativeWind's interop drops
                   non-className style props from a Pressable's
                   `({ pressed }) => ({...})` return value on
                   this codebase — the exact bug that produced
                   the user's "stray K rendered at the bottom-
                   left of the hero" report.
                2. Middle <Pressable>        — owns the tap +
                   press-state opacity. No layout/surface props.
                3. Inner visual <View>       — owns the size,
                   radius, fill, border, and content centering.
              
              Don't refactor this back into a single Pressable
              with combined styles — the next time NativeWind
              changes interop behavior the avatar will silently
              decompose into an inline letter again. */}
          <View
            style={{
              position: "absolute",
              top: insets.top + 8,
              right: 16,
            }}
          >
            <Pressable
              hitSlop={12}
              onPress={onProfilePress}
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
            >
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "rgba(255, 255, 255, 0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(255, 255, 255, 0.28)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontFamily: "System",
                    fontWeight: "700",
                    fontSize: 14,
                  }}
                >
                  {firstName.charAt(0).toUpperCase()}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
        ) : (
          /* No-illustration variant — UNIFIED HEADER
              Polish pass: the previous version had a 30pt Home
              title + tiny static "Welcome back 👋" subtitle on
              the left and a horizontal streak chip on the
              right. The user's audit flagged the header as
              "disconnected" and the streak as "still small".
              
              This version anchors both sides at the same
              optical height (alignItems: center) so the page
              identity column and the streak HERO read as a
              single intentional header band — Apple Fitness
              Summary pattern: large title on the left,
              prominent metric tile on the right, vertically
              centered to each other.
              
              Left column (page identity, tightened):
                • "Home" — LargeTitle (30pt 800)
                • Dynamic time-of-day greeting + emoji
                  (Good morning ☀️ / evening 🌙 / etc.)
              
              Right column (streak HERO, hierarchy: flame →
              big number → caption):
                • flame.fill icon on top
                • LARGE count number (32pt 800) — the hero
                • "Day Streak" small caps below — supporting
                The number is now the first thing the eye
                lands on, which is what the user asked for:
                "treat progress as a first-class citizen".
              
              Spacing: 12pt below SafeAreaView inset, 28pt
              below the row to the devotional card. Removed
              the excess empty space the previous version
              carried at the top. */
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: SCREEN_H_PAD,
              // Spec: status-bar → Home = 20pt. SafeAreaView
              // handles the status-bar inset; this is the
              // additional gap inside the safe area before
              // the Home title.
              paddingTop: 20,
              // Spec: Good Evening → Devotional card = 32pt.
              paddingBottom: 32,
              gap: 16,
            }}
          >
            {/* Left column — Home title + dynamic greeting.
                The greeting line replaces the static "Welcome
                back 👋" with a time-of-day-aware line so the
                page identity FEELS different morning vs
                evening without changing layout. Helper at
                `lib/greeting.ts` returns text + emoji per
                hour bucket. */}
            <View style={{ flex: 1 }}>
              <Text
                style={[systemText.largeTitle, { color: colors.ink }]}
                accessibilityRole="header"
              >
                Home
              </Text>
              <Text
                style={[
                  systemText.body,
                  {
                    color: colors.ink,
                    opacity: 0.65,
                    marginTop: 4,
                  },
                ]}
                accessibilityLabel={greeting.text}
              >
                {greeting.text} {greeting.emoji}
              </Text>
            </View>

            {/* Compact horizontal streak chip — "🔥 N".
            
                Replaces the previous 120×88 vertical card
                (flame ↑ number ↑ "DAY STREAK" caps). The
                vertical hero competed visually with the
                editorial sermon card directly below it; the
                horizontal chip drops the visual weight to
                roughly a quarter of the previous footprint
                so the home page reads as one anchored
                editorial surface with a small status mark in
                the top corner, not a two-tile dashboard.
                
                The 🔥 emoji (not the SF Symbol flame.fill)
                is intentional — the emoji renders with its
                own native orange/yellow gradient so the chip
                carries a touch of warmth without us painting
                any colored surface or glow. The number sits
                tight to the right of the flame so the whole
                chip reads as one glyph at a glance.
                
                Hidden entirely at streakCount === 0 so
                first-day users don't see a "🔥 0" before
                they've earned the milestone (same pattern
                Apple Fitness uses for empty metrics).
                
                Hit target is the full chip + 8pt hitSlop;
                tap still opens /rhythm. */}
            {onShowRhythm && streakCount > 0 ? (
              <Pressable
                onPress={() => {
                  haptics.soft();
                  onShowRhythm();
                }}
                accessibilityRole="button"
                accessibilityLabel={`${streakCount}-day streak. Tap to open Rhythm.`}
                hitSlop={8}
                style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 999,
                    backgroundColor: colors.surfaceSecondary,
                    minHeight: 32,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 16,
                      lineHeight: 20,
                      marginRight: 6,
                    }}
                  >
                    🔥
                  </Text>
                  <Text
                    style={{
                      color: colors.ink,
                      fontFamily: "System",
                      fontWeight: "700",
                      fontSize: 16,
                      lineHeight: 20,
                      letterSpacing: -0.2,
                    }}
                  >
                    {streakCount}
                  </Text>
                </View>
              </Pressable>
            ) : null}
          </View>
        )}

        {/* ── Devotional content card — elevated surface ──────
            Owns ONLY the devotional content now: greeting,
            title, type chip, blurb, closer, and Read Now CTA.
            The TODAY'S WORD marker moved above (own section)
            and the Protection card moved below (own section)
            per the home-section audit — "every section should
            be identifiable by shape and position before
            reading any text".
            
            Apple's first-party apps (Journal, Health, Fitness)
            group cohesive content on a layered surface
            (secondarySystemBackground in iOS terminology) and
            let the page background show through between
            sections. The previous home laid everything flush
            on pure black, which read as a stack of unrelated
            blocks — no perceptual grouping, no Apple-style
            depth.
            
            Surface: `colors.surfaceSecondary` (#111) — one
            elevation step above the page bg (#000). No border,
            no shadow per the audit — the surface contrast
            alone carries the depth. 24pt radius matches the
            iOS card radius used across Health/Fitness/Music
            grouped surfaces.
            
            Padding: 24pt all around. Apple's grouped card
            interior padding (UIListCollectionView inset-
            grouped cell). The 24pt internal padding is the
            audit's explicit ask and snaps cleanly onto the
            8pt spacing grid the rest of the home page uses.
            
            Horizontal margin: 16pt — leaves the page bg
            visible at the left/right edges so the card reads
            as a discrete object on the page, not a full-width
            band. Matches Apple Health's grouped-card insets.
            
            (Image-overlay variant, used when `illustration` is
            passed, deliberately skips this elevated wrapper —
            its visual grouping comes from the photo+gradient
            mask above. This wrapper is the no-image variant's
            equivalent grouping affordance.) */}
        <View
          style={{
            marginHorizontal: SCREEN_H_PAD,
            // Spec: 24pt horizontal/top/bottom padding,
            // 28pt corner radius. The devotional card runs
            // on its own `devotionalSurface` theme token —
            // dark mode: #151515 (one step darker than the
            // utility surfaceSecondary so the editorial
            // anchor reads as the deepest meditative tier);
            // light mode: #FFFFFF (pure white, lifts off
            // the warm-cream page bg #F8F7F4).
            paddingHorizontal: SCREEN_H_PAD,
            paddingTop: 24,
            paddingBottom: 24,
            borderRadius: 28,
            backgroundColor: colors.devotionalSurface,
          }}
        >
          {/* ── Top row: TODAY'S WORD badge ↔ Type chip ──────
              Reference: the user pulled this pattern from a
              modern devotional layout — a small colored icon
              badge anchoring the TODAY'S WORD label on the
              left, balanced by a Daily Church / Letters /
              etc. type pill on the right. Both rendered at
              roughly the same eyebrow height so the row
              reads as a single header strip identifying
              what this card is AND what voice it speaks in
              — before the title even begins.
              
              Spacing: 0pt from the card's 24pt top padding,
              16pt below before the title — gives the row
              its own clear band at the top of the card. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            {/* TODAY'S WORD badge — colored icon square + label.
                The square (28pt, CLOSER_ACCENT fill,
                white book.closed.fill glyph) is the only
                colored surface in the card, which is what
                makes it instantly findable. Apple Sleep,
                Health, and Notes all use a small colored
                icon-square pattern (the "category puck") to
                anchor their headline rows. */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexShrink: 1,
              }}
              accessible
              accessibilityRole="text"
              accessibilityLabel="Today's Word"
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: CLOSER_ACCENT,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SFSymbol
                  name="book.closed.fill"
                  size={14}
                  weight="semibold"
                  color="#FFFFFF"
                />
              </View>
              <Text
                style={[
                  typography.smallLabel,
                  {
                    color: CLOSER_ACCENT,
                    textTransform: "uppercase",
                    marginLeft: 10,
                  },
                ]}
              >
                TODAY'S WORD
              </Text>
            </View>

            {/* Type chip — Daily Church / Letters / etc.
                Moved from below the title up to this top row
                so it pairs with the TODAY'S WORD marker as
                co-headline metadata: "this is today's word,
                of the Daily Church voice". Renders as a
                compact pill (surfaceTertiary fill) so the
                two markers read as visually parallel chips
                at the top of the card. */}
            {typeName && typeIconSymbol ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: colors.surfaceTertiary,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  flexShrink: 1,
                }}
                accessible
                accessibilityRole="text"
                accessibilityLabel={typeName}
              >
                <SFSymbol
                  name={typeIconSymbol}
                  size={12}
                  weight="semibold"
                  color={colors.inkSecondary}
                />
                <Text
                  numberOfLines={1}
                  style={{
                    color: colors.ink,
                    fontFamily: "System",
                    fontWeight: "600",
                    fontSize: 12,
                    letterSpacing: -0.1,
                    marginLeft: 6,
                  }}
                >
                  {typeName}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Editorial title — spec maps "SF Pro Display Bold"
              to the project's existing display face at 700
              weight (kept on PlusJakartaSans so the card
              matches the rest of the page). 28/32 per spec.
              
              Spacing per spec:
                • Top row → title  = 12pt (was 8pt)
                • Title → body     = 20pt (was 24pt)
              The 12pt gap above keeps the eyebrow row + title
              feeling like one editorial block; the 20pt gap
              below separates the title cluster from the body
              prose. */}
          <Text
            style={[
              typography.devotionalTitle,
              {
                color: colors.ink,
                fontSize: 28,
                lineHeight: 32,
                marginTop: 12,
              },
            ]}
            accessibilityRole="header"
          >
            {title}
          </Text>

          {/* Editorial blurb — spec: 17pt regular, 28pt line
              height, 20pt above (from title), 32pt below (to
              CTA). */}
          <Text
            style={[
              typography.body,
              {
                color: colors.inkMuted,
                marginTop: 20,
              },
            ]}
          >
            {blurb}
          </Text>

          {/* (Closing emphasis line was REMOVED in the polish
              pass per the user's audit: "Less is more. The
              title already communicates the message." The
              closer paragraph repeated emotional ground the
              headline + blurb already cover and added a third
              typographic level inside the card. Removing it
              drops the card from 6 hierarchy levels down to
              4 — eyebrow, title, body, CTA — which is the
              maximum Apple Books and Journal carry on their
              own card surfaces. The `closer` prop is still
              accepted by this component for backward compat
              but is no longer rendered.) */}

          {/* Read Now CTA — primary editorial button, editorial
              red to match the brand accent established by the
              greeting's name color. Full-width pill consistent
              with the sermon flow's Continue pill so the visual
              language of "tap this to begin" is uniform from
              home → sermon → completion.
              
              Surface styling lives on an INNER static-style View,
              not on the Pressable's function-style return value.
              On this codebase the NativeWind/Pressable interop
              layer drops non-className surface props from
              function-style style objects (same bug pattern as
              HeroStatusPill), which paints the button transparent
              and leaves just the white text floating. Static
              inner View → guaranteed paint. */}
          {/* (Protection status row used to render between the
              closer and the Read Now CTA. The audit moved it
              OUT of this card — protection is a different
              purpose from devotional content, so it now lives
              as its own standalone section BELOW this card.
              Read Now sits directly under the closer with
              32pt of breathing room, the HIG-recommended
              minimum between primary editorial text and a
              primary CTA. See the outer render for the
              standalone protection card.) */}

          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={completed ? "Read again" : "Read now"}
            // Surface the completion state to assistive tech so
            // VoiceOver speaks "Read again. You've already
            // completed today's devotional." instead of just
            // "Read again." (a label that doesn't carry the
            // status the green pill is carrying visually).
            accessibilityHint={
              completed
                ? "You've already completed today's devotional"
                : undefined
            }
            style={({ pressed }) => ({
              // V4: 56 → 28pt. The previous 56pt was tuned for an
              // earlier revision that rendered a 2-line "closer"
              // paragraph below the blurb (the user's last-pass
              // edit). After the closer was removed, the body now
              // ends with the blurb's last line and 56pt of empty
              // space stranded the CTA at the bottom of the card,
              // making the whole card feel under-filled. 28pt
              // matches the gap between the title and the blurb
              // above (20pt → 28pt; ramping up as we move toward
              // the action) so the vertical rhythm reads as one
              // cohesive cluster instead of a top half + a
              // floating button.
              marginTop: 28,
              opacity: pressed ? 0.92 : 1,
            })}
          >
            <View
              style={{
                // Pre-completion: editorial red (the same accent
                // the page's section headers and progress bar
                // use, so the eye reads "this IS today's
                // devotional CTA"). Post-completion: iOS system
                // green (#34C759), the OS-wide "done /
                // succeeded" color. The color shift is the
                // primary visual signal the card has flipped
                // into its "complete" state — no extra badge or
                // copy needed, the pill itself reports the
                // status. (See CLOSER_ACCENT and
                // COMPLETED_GREEN comments below for the
                // palette rationale.)
                backgroundColor: completed
                  ? COMPLETED_GREEN
                  : CLOSER_ACCENT,
                // Spec: 56pt height, 28pt radius (= height/2
                // = full pill, same shape as Apple's primary
                // pill buttons in Books / Music).
                height: 56,
                borderRadius: 28,
                paddingHorizontal: SCREEN_H_PAD,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                // Red shadow REMOVED per the polish-pass surface
                // hierarchy rule ("DO NOT use shadows / glows /
                // gradients / borders"). The brand red is loud
                // enough as a fill against the deep editorial
                // surface to read as the primary action without
                // additional elevation chrome.
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "System",
                  fontWeight: "700",
                  fontSize: 15,
                  letterSpacing: 0.2,
                  marginRight: 8,
                }}
              >
                {completed ? "Read Again" : "Read Now"}
              </Text>
              {/* Glyph swaps with the state:
                    • Read Now    → forward arrow (the call to
                                    action, "go into the
                                    sermon").
                    • Read Again  → checkmark, the OS-standard
                                    completion mark. Even when
                                    the user is colorblind and
                                    can't distinguish red from
                                    green, the check itself
                                    reports the "done" status
                                    so the pill is still
                                    legible as a completion
                                    badge. Stroke weight 2.4 +
                                    rounded caps match the
                                    arrow's stroke style so
                                    both glyphs feel like the
                                    same family. */}
              <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                <Path
                  d={completed ? "M5 12l5 5L20 7" : "M5 12h14M13 6l6 6-6 6"}
                  stroke="#FFFFFF"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </View>
          </Pressable>

        </View>

        {/* ── Protection card — standalone section ─────────────
            A SEPARATE elevated card on the page bg, parallel
            to the devotional card above and the App Blocks
            card below. Three home sections, three identical
            shapes (24pt radius, surfaceSecondary fill, mx 16),
            three distinct purposes — exactly the "identifiable
            by shape and position" pattern the audit asked for.
            
            Tap propagation: HeroStatusRow contains its own
            Pressable that swallows the touch (opens the focus
            status sheet), so the outer card-level Pressable
            never receives the event — tapping the protection
            row opens the sheet, not the sermon.
            
            24pt margin above separates this card from the
            devotional card — the polish-pass audit flagged
            16pt as "blending together" because the two cards
            are different TASKS (read the devotional vs.
            manage protection) and should be visually distinct
            modules. 24pt is the same gap Apple uses between
            grouped inset sections on iOS Settings, which is
            the cleanest "these are siblings, not nested"
            signal in the design system. */}
        {onShowStatus && statusPills && statusPills.length > 0 ? (
          <View style={{ marginTop: 24, marginHorizontal: SCREEN_H_PAD }}>
            <HeroStatusRow
              value={statusPills[0].value}
              tone={statusPills[0].tone}
              pulse={statusPills[0].pulse}
              blockedCount={statusPills[0].blockedCount ?? 0}
              onPress={onShowStatus}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
});

const SermonCard = memo(function SermonCard({
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
                  className="text-[11px] tracking-[1px] uppercase"
                  style={{
                    fontFamily: "System",
                    fontWeight: "700",
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
                  className="text-[11px] tracking-[1px] uppercase"
                  style={{
                    fontFamily: "System",
                    fontWeight: "500",
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
              style={{ paddingHorizontal: SCREEN_H_PAD }}
            >
              <Text
                className="text-[11px] tracking-[1px] uppercase"
                style={{
                  fontFamily: "System",
                  fontWeight: "700",
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
              style={{ marginTop: 16, marginBottom: 4 }}
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
            fontFamily: "System",
            fontWeight: "700",
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
            fontFamily: "System",
            fontWeight: "400",
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
          className="text-ink-muted text-[11px] tracking-[1px] uppercase mt-3.5"
          style={{
            fontFamily: "System",
            fontWeight: "600",
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
          style={{ marginTop: 16, alignItems: "center" }}
        >
          {completed ? <ReadAgainPill accent={type.accent} /> : <PlayPill />}
        </View>
      </View>
    </Pressable>
  );
});

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
 * Brand orange accent for the "Daily Devotional" section header —
 * sourced from CLOSER_ACCENT in constants/theme.ts.
 */

/**
 * High-contrast body reading ink for editorial prose on the home
 * imprint card. Hardcoded per-theme rather than routing through
 * `colors.inkMuted` so we can pin reading-prose contrast at a
 * specific point (≈16:1 on dark, ≈14:1 on light — comfortably
 * past the WCAG AAA 7:1 floor for small text on a dark surface)
 * without dragging every other inkMuted consumer (eyebrows,
 * timestamps, refs) along for the ride. Light value picks
 * Apple's `label` near-black so light-mode reading prose stays
 * crisp; dark value picks `#E5E5EA` (Apple's tertiarySystemFill
 * dark — a near-white that still has visible separation from
 * pure `#FFFFFF` headings so type hierarchy is preserved).
 */
const BODY_READING_INK_FOR = (colors: { ink: string }) =>
  colors.ink === "#FFFFFF" ? "#E5E5EA" : "#1C1C1E";

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
const ImprintSermonCard = memo(function ImprintSermonCard({
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
        ctaColor: completed ? COMPLETED_GREEN : CLOSER_ACCENT,
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
    <View style={{ paddingTop: 4, paddingBottom: 4 }}>
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
          marginTop: 16,
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
                marginHorizontal: 4.5,
              }}
            />
          );
        })}
      </View>
    </View>
  );
});

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
                paddingHorizontal: SCREEN_H_PAD,
                paddingTop: 16,
                paddingBottom: 16,
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ alignItems: "center" }}>
                <Text
                  style={[
                    systemText.title3,
                    {
                      color: "#FFFFFF",
                      textAlign: "center",
                    },
                  ]}
                  numberOfLines={2}
                >
                  {title}
                </Text>
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.6)",
                    fontFamily: "System",
                    fontWeight: "500",
                    fontSize: 13,
                    lineHeight: 18,
                    marginTop: 4,
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
          paddingHorizontal: SCREEN_H_PAD,
          paddingVertical: 8,
          borderRadius: 999,
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.1)",
        }}
      >
        <Text
          style={[
            typography.smallLabel,
            {
              color: "rgba(255, 255, 255, 0.7)",
              textTransform: "uppercase",
            },
          ]}
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
          paddingLeft: 32,
          paddingRight: showCheck ? 28 : 36,
          paddingVertical: 8,
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
            fontFamily: "System",
            fontWeight: "700",
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
                  marginRight: 8,
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
                className="text-[11px] tracking-[1px] uppercase"
                style={{
                  fontFamily: "System",
                  fontWeight: "700",
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
                className="text-[11px] tracking-[1px] uppercase"
                style={{
                  fontFamily: "System",
                  fontWeight: "700",
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
                  fontFamily: "System",
                  fontWeight: "700",
                  color: FOCUS_HERO_ACCENT,
                  fontSize: 11,
                  letterSpacing: 0.3,
                  opacity: isPaused ? 0.6 : 1,
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
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Read today&apos;s sermon
            </Text>
            <Text
              className="text-ink-muted text-[16px] leading-[22px] mt-1"
              style={{ fontFamily: "System", fontWeight: "500" }}
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
                      fontFamily: "System",
                      fontWeight: "700",
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
                className="text-ink-muted text-[12px]"
                style={{
                  fontFamily: "System",
                  fontWeight: "500",
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
                  paddingVertical: 4,
                  paddingHorizontal: 4,
                })}
              >
                <Text
                  className="text-ink-muted text-[11px] tracking-[1.6px] uppercase"
                  style={{ fontFamily: "System", fontWeight: "700" }}
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
              style={{ fontFamily: "System", fontWeight: "700" }}
              numberOfLines={1}
            >
              {titleLabel}
            </Text>
            <Text
              className="text-ink-muted text-[14px] leading-[20px] mt-1"
              style={{ fontFamily: "System", fontWeight: "500" }}
              numberOfLines={1}
            >
              {appsSummary}
            </Text>

            {/* Time display — the big number is the focal element. */}
            <View className="items-center mt-5">
              <Text
                className="text-ink text-[44px] leading-[48px] tracking-[-1px]"
                style={{
                  fontFamily: "System",
                  fontWeight: "700",
                  opacity: isPaused ? 0.55 : 1,
                }}
                // @ts-expect-error — RN types accept this string but
                // TypeScript's typing for fontVariant is narrow.
                fontVariant={["tabular-nums"]}
              >
                {timeLabel}
              </Text>
              <Text
                className="text-ink-muted text-[11px] tracking-[1px] uppercase mt-1"
                style={{ fontFamily: "System", fontWeight: "700" }}
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
            <View className="flex-row mt-5" style={{ gap: 8 }}>
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
                        style={{ fontFamily: "System", fontWeight: "700" }}
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
                        fontFamily: "System",
                        fontWeight: "700",
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
        className="text-ink text-[11px] tracking-[1px] uppercase ml-1.5"
        style={{ fontFamily: "System", fontWeight: "700" }}
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
          paddingRight: 16,
          paddingVertical: 8,
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
            fontFamily: "System",
            fontWeight: "700",
            fontSize: 15,
            color: accent,
            marginLeft: 8,
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
        style={{ fontFamily: "System", fontWeight: "700" }}
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
 *   • Lit cells: CLOSER_ACCENT (editorial red) — same
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
const RhythmGrid = memo(function RhythmGrid({
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
  // we add 18pt of internal padding. With only 7 cells in a
  // single row (vs the previous month-grid's 35–42), each cell
  // gets meaningfully more horizontal room — we let cells
  // scale up to 44pt (Apple's HIG-floor tap target) so the day
  // numerals inside read comfortably at a glance.
  const SECTION_PADDING = 24;
  const CARD_PADDING = 18;
  const GAP = 6;
  const COLS = 7;
  const cardWidth = screenWidth - SECTION_PADDING * 2;
  const gridWidth = cardWidth - CARD_PADDING * 2;
  const rawCell = (gridWidth - (COLS - 1) * GAP) / COLS;
  const cellSize = Math.max(36, Math.min(44, Math.floor(rawCell)));

  // ─── Date math ───────────────────────────────────────────
  // Single-week view — the current Sun → Sat window. Drives
  // the same engaged/idle/future classification as the detail
  // page's month grid (via the shared lib/rhythm.ts helper) so
  // both surfaces speak one source of truth.
  const week = useMemo(() => buildCurrentWeek(engagedDates), [engagedDates]);
  const { cells, weekStartISO, weekEndISO, engagedCount } = week;

  // Tracking start ISO — the earliest engaged date across the
  // user's whole history. Anything older than this on the grid
  // is "pre-tracking" (the user wasn't here yet) and renders
  // with the bare-numeral visual instead of the "missed" fill.
  // A brand-new user with zero engagements has
  // `trackingStartISO === null`, which the cell renderer reads
  // as "treat every idle past day as pre-tracking" — so the
  // first time they open the app they don't see a wall of
  // shame for days they never had the chance to engage.
  const trackingStartISO = useMemo<string | null>(() => {
    if (engagedDates.length === 0) return null;
    let min = engagedDates[0]!;
    for (const iso of engagedDates) {
      if (iso < min) min = iso;
    }
    return min;
  }, [engagedDates]);

  // Header range — "Jun 7 – 13" formatted from the week
  // boundaries. Compresses to "Jun 28 – Jul 4" when the week
  // straddles a month boundary, matching iOS Calendar's
  // formatting convention.
  const weekRangeLabel = useMemo(
    () => formatWeekRange(weekStartISO, weekEndISO),
    [weekStartISO, weekEndISO],
  );

  // Footer copy — reframes the metric so a brand-new user
  // doesn't read "0 read this week" as failure. Three messages
  // depending on engagement state, each one truthful without
  // accusing the user of missing anything they couldn't have
  // done.
  const footerCopy =
    engagedCount === 0
      ? "Start your rhythm"
      : engagedCount === 1
      ? "1 read this week"
      : `${engagedCount} read this week`;

  return (
    <Pressable
      onPress={onOpenDetail}
      accessibilityRole="button"
      accessibilityLabel={`Open rhythm detail — ${footerCopy}, ${weekRangeLabel}`}
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
        {/* Header — "This week" anchor on the leading edge,
            "Jun 7 – 13" date range trailing as quiet context
            so the user can place the row in time without
            squinting at the cell numerals below. */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <Text
            style={[
              systemText.subheadline,
              { fontWeight: "700", color: colors.ink },
            ]}
          >
            This week
          </Text>
          <Text
            style={[
              systemText.caption1,
              { fontWeight: "600", color: colors.inkMuted },
            ]}
          >
            {weekRangeLabel}
          </Text>
        </View>

        {/* Weekday strip — single-character abbreviations
            (Sun → Sat), quietly muted so the cells below
            stay the visual anchor. */}
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
                style={[
                  systemText.captionEmphasized,
                  { color: colors.inkMuted },
                ]}
              >
                {letter}
              </Text>
            </View>
          ))}
        </View>

        {/* The single-week row */}
        <View style={{ flexDirection: "row" }}>
          {cells.map((cell, cIdx) => (
            // RhythmCell pulls colors from context itself so the
            // grid doesn't have to thread a fresh-on-each-render
            // colors prop into 7 cells (which would defeat the
            // cell-level React.memo wrapper).
            <RhythmCell
              key={cell.dateISO}
              size={cellSize}
              marginLeft={cIdx === 0 ? 0 : GAP}
              state={cell.state}
              isToday={cell.isToday}
              dateISO={cell.dateISO}
              trackingStartISO={trackingStartISO}
            />
          ))}
        </View>

        {/* Footer — copy varies by engagement count to avoid
            the previous "0 read" failure framing.
            "View all →" on the right hints the tappable
            detail page. */}
        <View
          style={{
            marginTop: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "600",
              color: colors.ink,
              fontSize: 13,
              letterSpacing: -0.1,
            }}
          >
            {footerCopy}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "700",
                color: CLOSER_ACCENT,
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
                stroke={CLOSER_ACCENT}
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
});

/**
 * Format the Sun → Sat boundaries of a week into a compact
 * label suitable for the home card's trailing context:
 *
 *   • Same month     →  "Jun 7 – 13"
 *   • Straddles two  →  "Jun 28 – Jul 4"
 *
 * Mirrors iOS Calendar's week-range convention so the home
 * card reads as a native iOS surface.
 */
function formatWeekRange(startISO: string, endISO: string): string {
  const start = new Date(startISO + "T00:00:00");
  const end = new Date(endISO + "T00:00:00");
  const startMonth = start.toLocaleDateString(undefined, { month: "short" });
  const endMonth = end.toLocaleDateString(undefined, { month: "short" });
  const startDay = start.getDate();
  const endDay = end.getDate();
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay} – ${endDay}`;
  }
  return `${startMonth} ${startDay} – ${endMonth} ${endDay}`;
}

/** Single-letter weekday strip — US locale (Sun → Sat). */
const WEEKDAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"] as const;

/** Tracks identical palette tokens to the /rhythm detail screen
 *  so the two surfaces speak one vocabulary. Duplicated locally
 *  (rather than imported) because the detail screen keeps its
 *  own private copies for the same self-contained reason. */
const RHYTHM_MISSED_FILL = "rgba(255, 255, 255, 0.06)";
const RHYTHM_NEUTRAL_OUTLINE = "rgba(255, 255, 255, 0.28)";

/**
 * One cell in the home rhythm heatmap. Visual vocabulary
 * mirrors the /rhythm detail screen's day cells exactly so the
 * home preview and the full page speak the same language —
 * tapping the home card into the detail page should feel like
 * the same calendar zoomed in, not a different chart.
 *
 * State-driven render:
 *   • engaged       — solid CLOSER_ACCENT filled circle
 *                     + bold WHITE day number (only saturated
 *                     fill in the grid → engaged days dominate)
 *   • today (idle)  — hollow CLOSER_ACCENT ring + bold
 *                     red day number. Renders only when today
 *                     isn't engaged — engaged-today falls into
 *                     the branch above so the user's lit moment
 *                     isn't visually downgraded.
 *   • future        — DASHED neutral outline (drawn via SVG
 *                     strokeDasharray — RN's native dashed
 *                     border is unreliable at 28–36pt circles)
 *                     + dim day number
 *   • pre-tracking  — BARE dim numeral, no container. Used for
 *                     any past idle day before the user's
 *                     first-ever engagement (or every past day
 *                     for a brand-new user). Fixes the design-
 *                     review concern that brand-new users were
 *                     being shown days they couldn't have
 *                     engaged as "missed"
 *   • missed        — subtle filled circle (rgba white 0.06) +
 *                     muted day number. Reads as "this day
 *                     passed without a sermon" without shouting
 *                     "you failed"
 *   • outOfMonth    — transparent placeholder (preserves
 *                     calendar shape)
 *
 * Kept memo'd because a typical month renders ~35–42 of these,
 * and the parent re-renders whenever ANY home-screen state
 * changes (focus pill, sermon swap, etc) — the memo keeps
 * those re-renders from cascading through 40+ subtrees.
 */
const RhythmCell = memo(function RhythmCell({
  size,
  marginLeft,
  state,
  isToday,
  dateISO,
  trackingStartISO,
}: {
  size: number;
  marginLeft: number;
  state: RhythmCellState;
  isToday: boolean;
  dateISO: string;
  trackingStartISO: string | null;
}) {
  // Out-of-month spacer — preserves the 7-column shape without
  // painting a ghost numeral.
  if (state === "outOfMonth") {
    return (
      <View
        style={{
          width: size,
          height: size,
          marginLeft,
        }}
      />
    );
  }

  const day = parseInt(dateISO.slice(8, 10), 10);
  // Numeral font sizes scale down a hair for the tightest cell
  // size (28pt). At 36pt the 12pt numeral has comfortable
  // breathing room; at 28pt we drop to 11pt (the HIG minimum)
  // to keep the numeral fully inside the disc.
  const numeralSize = size >= 32 ? 12 : 11;

  // Engaged — saturated red disc + bold white numeral. The ONLY
  // filled-red cell in the grid, so engaged days are the
  // unmistakable signal of "you showed up".
  if (state === "engaged") {
    return (
      <View
        style={{
          width: size,
          height: size,
          marginLeft,
          borderRadius: size / 2,
          backgroundColor: CLOSER_ACCENT,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "700",
            color: "#FFFFFF",
            fontSize: numeralSize,
            letterSpacing: -0.1,
          }}
          allowFontScaling={false}
        >
          {day}
        </Text>
      </View>
    );
  }

  // Today (not engaged) — hollow red ring + bold red numeral.
  // Distinct SHAPE (ring, not disc) marks "today, in play".
  if (isToday) {
    return (
      <View
        style={{
          width: size,
          height: size,
          marginLeft,
          borderRadius: size / 2,
          borderWidth: 1.5,
          borderColor: CLOSER_ACCENT,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "700",
            color: CLOSER_ACCENT,
            fontSize: numeralSize,
            letterSpacing: -0.1,
          }}
          allowFontScaling={false}
        >
          {day}
        </Text>
      </View>
    );
  }

  // Future — DASHED neutral outline + dim numeral. We draw the
  // ring via SVG (not borderStyle="dashed") because RN's dashed
  // border doesn't reliably render at 28–36pt circles — dashes
  // collapse to a solid line or disappear depending on the
  // platform pass. SVG strokeDasharray gives us deterministic
  // dotted rings at this size.
  if (state === "future") {
    const r = size / 2 - 0.5;
    return (
      <View
        style={{
          width: size,
          height: size,
          marginLeft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg
          width={size}
          height={size}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={RHYTHM_NEUTRAL_OUTLINE}
            strokeWidth={1}
            strokeDasharray="2,2"
            fill="none"
          />
        </Svg>
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "400",
            color: "rgba(235, 235, 245, 0.32)",
            fontSize: numeralSize,
            letterSpacing: -0.1,
          }}
          allowFontScaling={false}
        >
          {day}
        </Text>
      </View>
    );
  }

  // Pre-tracking — past idle day that sits BEFORE the user's
  // first-ever engagement, OR any past day for a brand-new
  // user who has never engaged. Bare dim numeral, no
  // container — reads as "you weren't here yet" rather than
  // "you missed this". Mirror of the detail screen's pre-
  // tracking branch.
  const isPreTracking =
    trackingStartISO === null || dateISO < trackingStartISO;
  if (isPreTracking) {
    return (
      <View
        style={{
          width: size,
          height: size,
          marginLeft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "400",
            color: "rgba(235, 235, 245, 0.24)",
            fontSize: numeralSize,
            letterSpacing: -0.1,
          }}
          allowFontScaling={false}
        >
          {day}
        </Text>
      </View>
    );
  }

  // Missed — subtle filled disc + muted numeral. Quiet enough
  // to read as "this day passed without a sermon" without
  // painting a heavy "you failed" badge on the grid.
  return (
    <View
      style={{
        width: size,
        height: size,
        marginLeft,
        borderRadius: size / 2,
        backgroundColor: RHYTHM_MISSED_FILL,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "500",
          color: "rgba(235, 235, 245, 0.55)",
          fontSize: numeralSize,
          letterSpacing: -0.1,
        }}
        allowFontScaling={false}
      >
        {day}
      </Text>
    </View>
  );
});

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
        paddingVertical: 4,
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
            fontFamily: "System",
            fontWeight: "800",
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
            fontFamily: "System",
            fontWeight: "600",
            color: valueTint,
            fontSize: 13,
            marginLeft: 4,
            letterSpacing: -0.2,
          }}
        >
          {unit}
        </Text>
      </View>
      <Text
        style={[
          systemText.captionEmphasized,
          { color: colors.inkMuted, marginTop: 8 },
        ]}
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
        marginVertical: 4,
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
        style={{ alignSelf: "center", marginRight: 4 }}
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
          fontFamily: "System",
          fontWeight: "800",
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
          fontFamily: "System",
          fontWeight: "600",
          color: colors.inkMuted,
          fontSize: 13,
          letterSpacing: -0.1,
          marginLeft: 4,
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
        paddingHorizontal: 8,
        paddingVertical: 4,
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
          fontFamily: "System",
          fontWeight: "700",
          color: FIRE_AMBER,
          fontSize: 13,
          marginLeft: 4,
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
                fontFamily: "System",
                fontWeight: "800",
                color: accent,
              }}
            >
              {streakCount}
            </Text>
            <Text
              className="text-ink text-[14px] leading-[18px] ml-1.5"
              style={{ fontFamily: "System", fontWeight: "700" }}
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
            className="text-ink-muted text-[12px] leading-[16px] mt-0.5"
            style={{ fontFamily: "System", fontWeight: "500" }}
          >
            {prompt}
          </Text>
        </View>
      ) : (
        <Text
          className="text-ink text-[13px] leading-[18px] text-center"
          style={{ fontFamily: "System", fontWeight: "600" }}
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
        paddingHorizontal: 4,
        paddingVertical: 4,
        alignItems: "center",
      }}
    >
      <Text
        className="text-[11px] tracking-[0.5px]"
        style={{
          fontFamily: "System",
          fontWeight: "700",
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
          marginTop: 4,
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
        style={{ fontFamily: "System", fontWeight: "600" }}
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
      accessibilityLabel={`Advance to next reading. Currently on ${position} of ${total}.`}
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
        style={{ fontFamily: "System", fontWeight: "600" }}
      >
        Next Reading
      </Text>
      {/* Small subtle counter chip — uses inkSubtle so it reads as
          metadata, not as the action itself. */}
      <Text
        className="text-ink-muted text-[12px] ml-2.5 tracking-[1px] uppercase"
        style={{ fontFamily: "System", fontWeight: "700" }}
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
              style={{ fontFamily: "System", fontWeight: "700" }}
              numberOfLines={1}
            >
              {title}
            </Text>
            <Text
              className="text-ink-muted text-[13px] mt-0.5"
              style={{ fontFamily: "System", fontWeight: "500" }}
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
                fontFamily: "System",
                fontWeight: "700",
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
            className="text-ink-muted text-[13px] ml-3 flex-1"
            style={{ fontFamily: "System", fontWeight: "500" }}
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
              fontFamily: "System",
              fontWeight: "700",
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
        style={{ fontFamily: "System", fontWeight: "600" }}
      >
        Preview Shield
      </Text>
      <Text
        className="text-ink-muted text-[12px] ml-2.5 tracking-[1px] uppercase"
        style={{ fontFamily: "System", fontWeight: "700" }}
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
          fontFamily: "System",
          fontWeight: "700",
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
          className="text-ink-muted text-[11px] tracking-[1px] uppercase"
          style={{ fontFamily: "System", fontWeight: "700" }}
        >
          Last check in
        </Text>
        <Text
          className="text-ink text-[17px] mt-1 tracking-[-0.2px]"
          style={{ fontFamily: "System", fontWeight: "700" }}
          numberOfLines={1}
        >
          {moodLabel}
        </Text>
        <Text
          className="text-ink-muted text-[13px] mt-1.5"
          style={{ fontFamily: "System", fontWeight: "500" }}
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
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            Today's rhythm
          </Text>
          <Text
            className="text-ink-muted text-[13px] leading-[18px] mt-0.5"
            style={{ fontFamily: "System", fontWeight: "500" }}
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
              marginTop: 4,
            })}
          >
            <View
              className="flex-row items-center rounded-full"
              style={{
                paddingLeft: 8,
                paddingRight: 16,
                paddingVertical: 4,
                backgroundColor: withAlpha(FOCUS_HERO_ACCENT, 0.14),
              }}
            >
              {/* Plus glyph — same caps-tracked style as the
                  label so the pill reads as one unit. Drawn as
                  text (not SVG) to dodge an extra import; the
                  Plus Jakarta "+" sits well in the cap height. */}
              <Text
                style={{
                  fontFamily: "System",
                  fontWeight: "800",
                  fontSize: 14,
                  lineHeight: 14,
                  color: FOCUS_HERO_ACCENT,
                  marginRight: 4,
                }}
              >
                +
              </Text>
              <Text
                className="text-[11px] tracking-[1.5px] uppercase"
                style={{
                  fontFamily: "System",
                  fontWeight: "700",
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
              className="text-ink text-[13px] text-center"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Nothing scheduled today
            </Text>
            <Text
              className="text-ink-muted text-[13px] text-center mt-1.5 leading-[18px]"
              style={{ fontFamily: "System", fontWeight: "400" }}
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
          paddingHorizontal: 16,
        }}
      >
        {/* Time column — fixed width so titles in column two align
            across all rows regardless of "7:00 AM" vs "12:30 PM". */}
        <View style={{ width: 62, paddingTop: 4 }}>
          <Text
            className="text-ink text-[12px]"
            style={{
              fontFamily: "System",
              fontWeight: "700",
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
            className="text-ink text-[15px] leading-[19px]"
            style={{
              fontFamily: "System",
              fontWeight: "700",
              letterSpacing: -0.1,
            }}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          <Text
            className="text-ink-muted text-[12px] leading-[16px] mt-0.5"
            style={{ fontFamily: "System", fontWeight: "500" }}
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
              style={[
                systemText.captionEmphasized,
                { color: colors.inkMuted },
              ]}
            >
              Done
            </Text>
          ) : isNow ? (
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 999,
                backgroundColor: withAlpha("#0A84FF", 0.14),
              }}
            >
              <Text
                style={[
                  systemText.captionEmphasized,
                  { color: "#0A84FF" },
                ]}
              >
                Now
              </Text>
            </View>
          ) : (
            <View className="flex-row items-center">
              <Text
                className="text-ink-muted text-[11px]"
                style={{
                  fontFamily: "System",
                  fontWeight: "500",
                }}
              >
                {formatRelativeUntil(item.at, Date.now())}
              </Text>
              <Text
                style={{
                  fontFamily: "System",
                  fontWeight: "700",
                  fontSize: 16,
                  lineHeight: 16,
                  color: withAlpha(colors.ink, 0.32),
                  marginLeft: 4,
                  // Optical centering — the chevron glyph
                  // sits a hair high in its em-box so we
                  // nudge it down to align with the time
                  // label baseline.
                  marginTop: 4,
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
