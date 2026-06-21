import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  type TextStyle,
  useWindowDimensions,
  View,
} from "react-native";
// `expo-image` was imported for the Hook panel's hero illustration;
// that block was removed for V1 (artwork prep is incomplete) so the
// import goes with it. Re-add when V2 reintroduces the hero.
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FocusBanner } from "@/components/FocusBanner";
import { PracticeTodayCard } from "@/components/PracticeTodayCard";
import { SermonBlurredBackdrop } from "@/components/SermonBlurredBackdrop";
import { SermonHeader } from "@/components/SermonHeader";
import { SFSymbol } from "@/components/Symbol";
import {
  SERMON_STEPS,
  sermonStepNumber,
  stepForPanelId,
} from "@/constants/sermon";
import * as haptics from "@/lib/haptics";
import { parseInlineEmphasis } from "@/lib/inlineEmphasis";
import { resolveSermonTypeForMoment } from "@/lib/moments";
import { useMoments } from "@/state/moments";
import { useOnboarding } from "@/state/onboarding";
import { useProgress } from "@/state/progress";
import { useColors } from "@/state/theme";

/**
 * The editorial red shared with the home "Daily Devotional"
 * subsection header and the SermonHeader progress bar. The
 * Continue pill on every narrative panel paints with CLOSER_ACCENT
 * so the home → sermon flow reads as one continuous accent.
 */
import { CLOSER_ACCENT } from "@/constants/theme";

// (Hook hero geometry constants HOOK_HERO_HEIGHT and
//  HOOK_HERO_FADE_HEIGHT were removed alongside the Hook
//  illustration render. Re-introduce when V2 brings the
//  hero image back.)

/**
 * The Continue pill is locked for the first 5 seconds of every
 * panel so the reader actually has to sit with the words before
 * advancing. Speed-tappers can no longer treadmill through the
 * sermon — the door doesn't open until the dwell time elapses.
 *
 * 5000 ms is the floor: long enough that even a short beat
 * (a 30-word landing) gets a moment of contemplation, short
 * enough that returning readers don't feel punished. We
 * surface the countdown inline on the pill ("Continue · 4s")
 * so the lock reads as a deliberate dwell, not a broken
 * button.
 */
const CONTINUE_LOCK_MS = 5000;

/**
 * Split a panel body into render-ready stanzas.
 *
 * For narrative panels the author splits with blank lines and
 * we honor that — `"\n\n"` becomes a paragraph break.
 *
 * Prayer bodies in the catalog are written as one long flowing
 * sentence run with no blank lines (so the data file stays
 * readable in source). Rendered as-is, that lands on screen as
 * a single jumbled wall of text. For prayer panels we split on
 * sentence-ending punctuation and regroup the sentences into
 * 2-sentence stanzas so the prayer reads as a series of
 * breathing beats — each beat sits on its own line with a
 * generous gap to the next one. Sentence pairs (rather than
 * one-per-line) keep the rhythm musical instead of staccato.
 *
 * The split tolerates `.`, `!`, `?` and keeps the punctuation
 * attached to the preceding sentence (positive lookbehind on
 * the delimiter). Single trailing sentence falls through as a
 * one-sentence stanza so we never drop content.
 */
function splitPanelParagraphs(body: string, isPrayer: boolean): string[] {
  const authored = body
    .split(/\n{2,}/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!isPrayer || authored.length > 1) return authored;

  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 1) return authored;

  const stanzas: string[] = [];
  for (let i = 0; i < sentences.length; i += 2) {
    const a = sentences[i];
    const b = sentences[i + 1];
    stanzas.push(b ? `${a} ${b}` : (a as string));
  }
  return stanzas;
}

/**
 * Sermon panel renderer — a single dynamic route that handles all
 * five in-sermon beats (Hook → Story → Turn → Landing → Prayer).
 *
 * URL: /sermon/panel/[id] where `id` is 1..5, matching the panel's
 * own `id` field in `assets/data/sermons.js`. The earlier flow had
 * five near-identical screen files; collapsing into one route
 * means tuning the layout (typography, animation, spacing) happens
 * in one place instead of five.
 *
 * Design language (post Wave 1 polish):
 *   • Full-bleed dimmed illustration backdrop on narrative panels
 *     — same image you stepped into on the intro page, dimmed to
 *     70% so the prose stays clean. Replaces the previous
 *     repeating 340×220 illustration card that landed on each of
 *     the four narrative panels (the same image painted four
 *     times in a row stopped reading as an anchor and started
 *     reading as monotony). The image becomes the room you're
 *     sitting in across the whole sermon.
 *   • Numeral demoted to a watermark (160pt, ~6% opacity, behind
 *     the text) instead of a 64pt foreground element. Still
 *     present as ambient structure; no longer competes with the
 *     prose for the eye.
 *   • Sermon title shows only on panel 1 (the Hook) — the intro
 *     page already showed it and the header chips already report
 *     position, so repeating it on 2-5 was clutter.
 *   • Per-beat duration chip ("~1 min") under the eyebrow so the
 *     reader knows the commitment of each panel.
 *   • "Next · The Story →" preview chip above the Continue
 *     button, building narrative pull beat-to-beat the way
 *     Imprint primes you for the next page.
 *   • Continue pill picks up the per-sermon accent (was always
 *     iOS blue) — the whole flow now reads of-a-piece in the
 *     day's color.
 *
 * The prayer panel (always `id: 5`, flagged `isPrayer: true` in
 * the data) keeps its distinct treatment — no illustration
 * backdrop, dawn glow from above, centered italic copy, "Amen"
 * CTA in blue, and the completion record on tap. It's the
 * closing breath of the sermon, deliberately a different room
 * than the narrative panels.
 *
 * Navigation:
 *   • Panels 1–4 push to `/sermon/panel/${id + 1}`
 *   • Panel  5  (prayer) records the completion and replaces into
 *     `/sermon/complete` — same chain the old prayer.tsx wired.
 *
 * The body field can contain blank-line paragraph breaks (`\n\n`)
 * that we split on so multi-paragraph beats read with breathing
 * room between them — without forcing the content team to use a
 * markdown layer.
 */
export default function SermonPanelScreen() {
  const router = useRouter();
  const { todaysMoment } = useMoments();
  const { recordCompletion } = useProgress();
  const { answers } = useOnboarding();
  const type = resolveSermonTypeForMoment(todaysMoment);

  // First-name source for the Practice Today card's `[name]`
  // interpolation. Same convention used everywhere else in the
  // app (today.tsx, pray-together, profile): take the first
  // space-separated token from the onboarding answer and fall
  // back to "friend" so the practice line never renders as a
  // bare "[name]" or an empty hyphen. Computed once per render
  // — the practice card itself memoizes the interpolated copy.
  const firstName = useMemo(
    () => (answers.name || "").trim().split(" ")[0] || "friend",
    [answers.name],
  );
  // Theme-aware so light mode lands on the warm cream canvas with
  // deep ink prose, and dark mode keeps its true-black sermon
  // canvas. We thread `colors.bg` through the page root, the body
  // text fill, AND the Hook hero's bottom-fade gradient stops so
  // the image dissolves into whichever canvas is active without
  // exposing a hard horizontal seam at the bottom of the hero.
  const colors = useColors();

  // Pull the panel id out of the URL segment. Coerce + guard so a
  // hot-reload glitch or a deep link with garbage doesn't crash
  // the screen — we fall back to panel 1 ("The Hook") which is
  // always safe to render.
  const { id: idParam } = useLocalSearchParams<{ id: string }>();
  const panelId = clampPanelId(Number(idParam));

  // Screen width drives the Hook hero's bottom-fade gradient
  // (the Svg has to be sized in absolute pt to render correctly).
  // Read here once so multiple downstream consumers share one
  // value rather than re-subscribing.
  const { width: screenWidth } = useWindowDimensions();
  const panel =
    todaysMoment.panels.find((p) => p.id === panelId) ??
    todaysMoment.panels[0]!;

  const isLastPanel = panelId === SERMON_STEPS.length;
  const isPrayer = panel.isPrayer === true;
  // The Hook (panel 1) keeps the sermon title as an anchor —
  // panels 2..N have it dropped to give the body room to breathe.
  // (The intro page already showed the title; the SermonHeader
  // chips already report position; repeating the title on every
  // panel was clutter that pushed the body further down.)
  const isHookPanel = !isPrayer && panelId === 1;

  // Practice Today — opt-in per-panel field. Shown only on The
  // Landing (panel 4) and only when the catalog entry actually
  // ships practice copy. When present, the panel hides its
  // regular Continue pill and the Practice Today card becomes
  // the sole advance affordance: the user expands the card,
  // reads the practice, then taps "Continue to prayer" (or
  // swipes the card back down) to route into the prayer-together
  // interstitial — the same destination Continue would have
  // taken them on a sermon without a practice line.
  const practiceText = panel.practiceToday?.trim() ?? "";
  const showPracticeCard = practiceText.length > 0 && !isPrayer && !isLastPanel;

  // Map the panel id to the canonical step name so we can drive
  // the SermonHeader progress bar from the same source of truth
  // every other screen uses (constants/sermon.ts).
  const stepName = stepForPanelId(panelId) ?? SERMON_STEPS[0]!;

  // Author-authored paragraph breaks (`\n\n`) split the body
  // into stanzas. Prayer bodies that arrive as one long sentence
  // run get auto-split into 2-sentence stanzas so the prayer
  // lands as a series of breathing beats rather than a wall of
  // text (see `splitPanelParagraphs` above).
  const paragraphs = useMemo(
    () =>
      splitPanelParagraphs(
        panel.body.replace(/\[name\]/g, firstName),
        isPrayer,
      ),
    [panel.body, isPrayer, firstName],
  );

  // ─── Entrance choreography ────────────────────────────────────
  // The screen unfolds rather than slams in: title first (Hook
  // panel only), then paragraphs cascade in one-by-one. Each
  // beat fades in with a tiny upward translate so the panel
  // reads as "settling into place" rather than a flat paint.
  // Tuned so the whole choreography completes inside ~1s on a
  // two-paragraph panel — slow enough to feel reverent, fast
  // enough that a returning reader isn't waiting on it.
  //
  // The earlier choreography also animated an eyebrow ("THE
  // HOOK") and a giant breathing numeral watermark. Both were
  // removed at the user's request — those were internal beat
  // taxonomy not meant for the reader. The animation now goes
  // straight from title → paragraphs.
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(12)).current;
  // One Animated.Value per paragraph, allocated lazily for the
  // CURRENT panel's paragraph count. Reset whenever the panel
  // changes so the cascade replays on every navigation.
  const paragraphAnims = useRef<Animated.Value[]>([]).current;
  while (paragraphAnims.length < paragraphs.length) {
    paragraphAnims.push(new Animated.Value(0));
  }

  // ─── Prayer reveal gate ─────────────────────────────────────
  // The prayer panel withholds its Continue pill until ALL
  // stanzas have finished fading in — the button "arrives" as
  // the conclusion of the prayer rather than competing with
  // the rising text for the user's first glance. Narrative
  // panels don't use this gate; their button is visible the
  // whole time (still locked by the dwell timer separately).
  const [prayerRevealComplete, setPrayerRevealComplete] = useState(
    !isPrayer,
  );

  useEffect(() => {
    titleOpacity.setValue(0);
    titleY.setValue(12);
    setPrayerRevealComplete(!isPrayer);

    if (isPrayer) {
      // ─── Prayer panel — deliberate line-by-line reveal ──────
      // Prayer paragraphs fade in WAY slower than narrative
      // panels — 2800 ms per stanza with a 1200 ms stagger, so
      // a ~6-stanza prayer takes around 10 seconds to fully
      // settle. The deliberately glacial rise mirrors (and
      // exceeds) the scripture screen's reverent arrival
      // rhythm; prayer should feel received line-by-line,
      // not paged. The user explicitly asked for this pacing
      // in an earlier iteration, so it's preserved even
      // though the narrative cascade was removed.
      paragraphAnims.forEach((a) => a.setValue(0));
      Animated.sequence([
        Animated.parallel([
          Animated.timing(titleOpacity, {
            toValue: 1,
            duration: 1400,
            delay: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(titleY, {
            toValue: 0,
            duration: 1500,
            delay: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.stagger(
          1200,
          paragraphAnims.map((a) =>
            Animated.timing(a, {
              toValue: 1,
              duration: 2800,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ),
        ),
      ]).start(({ finished }) => {
        if (finished) setPrayerRevealComplete(true);
      });
      return;
    }

    // ─── Narrative panels — no paragraph cascade ────────────
    // The previous build ran a per-paragraph staggered fade
    // (420 ms duration / 90 ms stagger) so paragraphs cascaded
    // in like steps. The user pulled it — the "stairs"
    // sequence read as jarring on every panel transition,
    // especially after the type size bump made each step
    // more visually weighty.
    //
    // Now: every body paragraph is fully visible immediately
    // on mount; the title is the only animated element, and
    // it gets a single gentle fade + lift so the reader still
    // feels the panel "arrive" without the staircase. Title
    // animation duration matches the old narrative cadence
    // (420 ms / 480 ms) so nothing else about the entrance
    // changes.
    paragraphAnims.forEach((a) => a.setValue(1));
    Animated.parallel([
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 420,
        delay: 80,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(titleY, {
        toValue: 0,
        duration: 480,
        delay: 80,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
    // panelId is the single source of truth for "we're on a new
    // panel". Re-running the effect on panelId change replays the
    // choreography for each beat without re-triggering on every
    // ambient re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelId]);

  // Every panel locks the Continue / Complete CTA for the first
  // CONTINUE_LOCK_MS so the reader sits with the beat instead of
  // mashing through. `secondsLeft` drives the inline countdown
  // ("Continue · 4s") and `locked` controls the pill's disabled
  // state. Both reset on panel change so each beat gets its own
  // 5-second dwell.
  //
  // We tick at 200 ms (not 1 s) so the displayed integer flips
  // crisply at the second boundary instead of lagging up to a
  // full second behind reality. The Math.ceil keeps the
  // displayed value at "5" for the entire first second, then
  // "4", "3", "2", "1", then unlocks — matches the user's
  // intuition that a "5-second timer" starts AT 5 and counts
  // down toward zero.
  const [secondsLeft, setSecondsLeft] = useState(
    Math.ceil(CONTINUE_LOCK_MS / 1000),
  );
  const locked = secondsLeft > 0;
  useEffect(() => {
    setSecondsLeft(Math.ceil(CONTINUE_LOCK_MS / 1000));
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const left = Math.max(
        0,
        Math.ceil((CONTINUE_LOCK_MS - elapsed) / 1000),
      );
      setSecondsLeft(left);
      if (left <= 0) clearInterval(interval);
    }, 200);
    return () => clearInterval(interval);
  }, [panelId]);

  // Every panel — INCLUDING the prayer — uses the shared
  // editorial-red SERMON_ACCENT so the home → sermon → prayer →
  // completion flow reads as one continuous color story.
  //
  // Earlier revisions flipped the prayer panel to an atmospheric
  // blue (PRAYER_BLUE) as a "you've arrived at the closing breath"
  // cue, but the color break made the prayer feel like a separate
  // app and the "Complete and unlock apps" pill at the end clashed
  // with the red accent the user sees the moment they tap Begin on
  // home. One accent across the whole flow keeps the journey
  // visually coherent.
  const accent = CLOSER_ACCENT;

  // ─── Scroll-driven progress within the active step ──────────
  // The Deepstash-style segmented progress bar fills the
  // CURRENT segment based on how far the reader has scrolled
  // through this panel's body. This isn't a perfect proxy for
  // "did you read it" — but it matches the user's intuition:
  // "the bar is filling as I move down the page."
  //
  // Implementation notes:
  //   • We snap to 0 on panel change so a fresh panel always
  //     starts with an empty active-segment fill.
  //   • The fraction is computed in onScroll as
  //     offsetY / (contentHeight - layoutHeight), clamped to
  //     [0, 1]. On a short panel that fits without scrolling,
  //     the divisor approaches 0 — in that case we fill to 1
  //     immediately (the whole panel is visible by definition,
  //     so the segment should read as "you've seen it").
  //   • Updates fire on every scroll frame (scrollEventThrottle
  //     of 16ms = 60fps). The progress bar internally
  //     rate-limits its animation so we don't pay any
  //     re-render cost downstream.
  const [scrollFraction, setScrollFraction] = useState(0);
  useEffect(() => {
    setScrollFraction(0);
  }, [panelId]);

  const handleContinue = () => {
    // Continue advances the sermon; Amen on the prayer panel
    // celebrates completion. Both deserve haptic confirmation —
    // success notification on the final Amen (it's a celebration),
    // medium tap on Continue (committed forward step).
    if (isPrayer && isLastPanel) {
      haptics.success();
    } else {
      haptics.tap();
    }
    if (!isLastPanel) {
      // Special transition: when the NEXT panel is the prayer,
      // route through the pray-together interstitial first
      // (`/sermon/pray-together`) instead of dropping the
      // reader straight into the prayer body. The interstitial
      // surfaces the reader by name and auto-advances into the
      // prayer after a short reverent pause. Detected by
      // peeking at the next panel's `isPrayer` flag rather
      // than hardcoding panelId === 4 — defensive against a
      // future sermon that places the prayer at a different
      // index.
      const nextPanel = todaysMoment.panels.find(
        (p) => p.id === panelId + 1,
      );
      if (nextPanel?.isPrayer) {
        router.push("/sermon/pray-together");
        return;
      }
      router.push(`/sermon/panel/${panelId + 1}` as const);
      return;
    }

    // Last panel — record the completion and chain into the
    // celebration screen, exactly as the old prayer.tsx did. The
    // moment's title goes onto the Journey timeline. The pastor
    // field is intentionally empty since the June 2026 catalog
    // dropped the `voice` attribution (sermons aren't truly
    // authored by named pastors); the field stays on the record
    // so old on-disk completions keep deserializing cleanly.
    const {
      typeCount,
      isFirstEver,
      newStreak,
      streakAdvanced,
      crossedMilestone,
    } = recordCompletion(type.id, {
      title: todaysMoment.title,
      pastor: "",
      // Stamp the catalog day onto the completion so the home card
      // can ask "did the user finish THIS moment?" rather than
      // "did the user finish anything today?" — without this the
      // dev "Next Sermon" pill leaves the new card stuck reading
      // as "Read Again" for a moment that hasn't been heard yet.
      day: todaysMoment.day,
    });
    router.replace({
      pathname: "/sermon/complete",
      params: {
        typeCount: String(typeCount),
        isFirstEver: String(isFirstEver),
        streak: String(newStreak),
        streakAdvanced: streakAdvanced ? "1" : "0",
        milestone: crossedMilestone ? String(crossedMilestone) : "",
      },
    });
  };

  return (
    // Blurred Unsplash wash behind the prose — same day's photo
    // as home/scripture, softened so the sermon stays legible.
    <View style={{ flex: 1 }}>
      <SermonBlurredBackdrop />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* Progress bar is hidden on the prayer panel — the
            sermon has functionally ended by the time the
            reader arrives at prayer, and the bar's "you're
            91% of the way through a piece of content" framing
            collapses the reverent posture the page is trying
            to set. Every other panel keeps the bar so the
            reader can see their position in the sermon. */}
        {!isPrayer ? (
          <SermonHeader
            step={sermonStepNumber(stepName)}
            stepProgress={scrollFraction}
          />
        ) : (
          <PrayerCloseHeader onClose={() => router.back()} />
        )}

        {/* Focus banner — renders nothing when no focus session is
            active, so it's safe to mount unconditionally. When a
            session IS active, the slim pill sits just below the
            progress bar so the user has a constant reminder + an
            escape hatch ("End") on every panel. */}
        <FocusBanner />

        {/* The prayer panel used to paint a top-anchored dawn-glow
            radial gradient (DawnGlow) here as its signature "light
            entering from above" cue. Removed at the user's request
            — the prayer should land on the same calm black canvas
            as every other panel, with the prose itself doing all
            the atmospheric work. */}

        <View style={{ flex: 1, position: "relative" }}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            // Generous bottom padding so the last line of body text
            // clears the bottom-anchored Continue/Finish pill. The
            // pill lives OUTSIDE the ScrollView (rendered as a
            // sibling at the bottom of the SafeAreaView), so its
            // height has to be reserved here as scroll content
            // padding — otherwise the bottom prose sits BENEATH
            // the pill and the last line gets visually clipped
            // (HIG: controls must not overlap content). 96pt
            // accounts for: ~52pt pill (paddingVertical 16 × 2 +
            // ~20pt label) + 16pt button-above-content breathing
            // room per HIG controls-spacing + ~28pt safety
            // margin for shadow glow. Previously 24pt — the
            // pill consistently covered the final paragraph's
            // trailing dash, e.g. "It's the pain of believing
            // He does —" was being cut off mid-em-dash.
            paddingBottom: 96,
            // Prayer is meant to be received — vertically centered so
            // the words settle in the middle of the screen, not at
            // the top. Narrative panels start at the top so the
            // reader scans naturally downward through the long copy.
            justifyContent: isPrayer ? "center" : "flex-start",
          }}
          showsVerticalScrollIndicator={false}
          // 16ms = 60fps. The segmented progress bar internally
          // smooths the value into an animated fill (220ms ease-
          // out), so we can afford to fire on every frame without
          // visible jitter or perf cost — the per-frame work is
          // a single Math.max/min in the handler below.
          scrollEventThrottle={16}
          onScroll={(e) => {
            // Skip on the prayer panel — its header is the
            // PrayerCloseHeader (no progress bar) and the scroll
            // is centered around a static stanza block. Computing
            // a fraction there would inflate state churn for no
            // visible payoff.
            if (isPrayer) return;
            const { contentOffset, contentSize, layoutMeasurement } =
              e.nativeEvent;
            const scrollable = contentSize.height - layoutMeasurement.height;
            // Short-panel guard: if the body fits on one screen
            // (scrollable <= 0), there's nothing to scroll
            // through, so we treat the panel as fully read.
            // This way the active segment doesn't stay stuck at
            // 0% just because the user has nothing to scroll.
            if (scrollable <= 0) {
              setScrollFraction(1);
              return;
            }
            const next = Math.max(
              0,
              Math.min(1, contentOffset.y / scrollable),
            );
            setScrollFraction(next);
          }}
        >
          {/* (Apple News-style hero illustration removed for
              launch — the user pulled hero artwork from the
              home cover card and the sermon reader for the
              same reason: artwork prep is incomplete for V1.
              The sermon panels now open straight to the
              title + body so the prose is the entire surface,
              consistent with the no-image home cover. The
              illustration prop is preserved on the sermon
              TYPE for V2 reintroduction; this render branch
              is the only consumer that needed to drop.) */}

          <View className="px-6 pt-4">
            {/* Beat eyebrow (THE HOOK / THE STORY / etc), per-
                beat duration chip, and the giant breathing
                numeral watermark all lived here in earlier
                revisions. They were removed at the user's
                request — those labels surfaced an internal beat
                taxonomy ("the hook", "the story") that wasn't
                meant for the reader, and the numeral was extra
                visual weight on a screen that wants the prose
                to be the only thing the eye lands on. The
                narrative panels now go straight from the (Hook-
                only) sermon title into the body; supporting
                panels (2..N) open directly on the body. */}

            {/* ─── Sermon title (Hook panel only) ─────────────────
                Panel 1 anchors on the sermon's title as the
                opening "you've entered today's sermon" cue.
                Panels 2..N drop it — the intro page already
                showed the title and the SermonHeader chips
                already report position, so repeating it on
                every panel was clutter that pushed the body
                further down without earning the space.

                Prayer also drops the title — that panel's copy
                speaks for itself. */}
            {isHookPanel && (
              <Animated.Text
                className="text-ink text-[28px] leading-[36px] tracking-[-0.4px] mt-3"
                style={{
                  fontFamily: "System",
                  fontWeight: "700",
                  opacity: titleOpacity,
                  transform: [{ translateY: titleY }],
                }}
              >
                {todaysMoment.title}
              </Animated.Text>
            )}

          {/* ─── Body ──────────────────────────────────────────
              Sermon prose is set in PLUS JAKARTA SANS — the same
              family the rest of the app uses for headlines, UI,
              and editorial copy. The previous build leaned hard
              on EB Garamond serif "for that printed-devotional
              feeling," but at body sizes against a dark bg it
              reads as crowded and old-fashioned, not premium.
              Modern reading apps (Apple Books default, Hallow,
              Glorify, Bible Project) all sit on a clean sans for
              body — the legibility win is unambiguous and the
              "feel" comes from spacing + scale + accent moves,
              not the font itself.

              Body settings tuned for long-form reading on dark:
                • Regular weight (400) — Medium starts to feel
                  shouty in long blocks. We give weight to the
                  drop cap and the title; the prose stays quiet.
                • 20pt / 32pt line-height — generous leading so
                  the eye has room to track. Bumped from 18/30
                  at the user's request — 18pt was reading as
                  "barely readable" against the dark canvas on
                  a 6.1" iPhone in evening light. 20pt is the
                  Apple Books default at the middle dynamic-type
                  setting and is the comfortable long-form
                  sweet spot for sans on dark.
                • -0.1 letter-spacing — sans body on iOS reads
                  slightly tighter than its default tracking.
                • 28pt paragraph gap — premium reading apps give
                  paragraphs real space; 20pt felt cramped.

              Prayer panels keep their distinct rhythm — bigger
              size (24/36, bumped from 21/33), text-align center,
              no drop cap — so the closing breath of the sermon
              still reads as a ceremony, not just another
              paragraph block. The 4pt prayer-vs-body delta is
              preserved so the prayer's spiritual weight reads
              the same way it did before the global bump.

              Body top-margin: panel 1 has the title above so it
              gets a tight 7pt gap; panels 2..N have only the
              eyebrow above so the body lifts to mt-5 to keep
              the eyebrow → body distance the same as on panel 1
              (eyebrow → title → body). */}
          <View
            className={isPrayer ? "mt-2" : isHookPanel ? "mt-7" : "mt-5"}
          >
            {paragraphs.map((p, i) => {
              const anim = paragraphAnims[i] ?? new Animated.Value(1);
              // Per-paragraph opacity + 8pt upward translate.
              // The behavior depends on which panel type this is:
              //   • Narrative panels (Hook/Story/Turn/Landing):
              //     the entrance effect (above) immediately sets
              //     every anim to 1, so each paragraph renders
              //     fully visible on mount — no cascade, no
              //     translation. The Animated.Text wrapper stays
              //     in place so the prayer branch can reuse the
              //     exact same render path.
              //   • Prayer panel: the entrance effect runs an
              //     Animated.stagger that drives each anim from
              //     0 to 1 sequentially (~2800 ms per stanza,
              //     1200 ms stagger). Each stanza fades in WITH
              //     the upward translate so the prayer arrives
              //     line-by-line, like a received whisper.
              //
              // The first narrative paragraph used to render with
              // an accent-colored drop cap (big extra-bold letter
              // bleeding into the body). Removed at the user's
              // request — the colored oversized letter was
              // reading as a typographic gimmick instead of an
              // editorial flourish. Every paragraph now uses the
              // same calm sans body style so the prose carries
              // itself.
              const translateY = anim.interpolate({
                inputRange: [0, 1],
                outputRange: [8, 0],
              });
              // Inline emphasis: split the paragraph into
              // {text, bold?, italic?} segments BEFORE render
              // so the catalog can author `**word**` /
              // `*word*` / `***word***` markers and we paint
              // each span with the matching Plus Jakarta face.
              // The parser is a no-op fast path for paragraphs
              // with zero markers (the vast majority today),
              // so we don't pay per-paragraph cost on
              // unemphasized prose.
              const emphasisSegments = parseInlineEmphasis(p);
              return (
                <Animated.Text
                  key={i}
                  style={{
                    // Body weight bumped from 400 Regular → 500
                    // Medium across both narrative and prayer
                    // panels. Per design review (June 2026) the
                    // long-form prose was reading as feather-
                    // weight against the calm canvas — bumping
                    // to Medium adds the editorial "ink on
                    // page" presence we wanted without forcing
                    // SemiBold (which would feel shouty in a
                    // multi-paragraph block).
                    //
                    // This is the BASE family inherited by
                    // every inline segment below. Bold /
                    // italic spans only override fontFamily;
                    // color, size, leading, spacing all pass
                    // through unchanged.
                    fontFamily: "System",
                    fontWeight: "500",
                    // Every paragraph uses the SAME ink color
                    // (colors.ink → pure #FFFFFF on dark theme,
                    // ~21:1 contrast — well past the 7:1 AAA bar
                    // for body text). All three body paragraphs
                    // on a panel are this same value; any
                    // perceived dimming on the trailing paragraph
                    // is the entrance animation's translateY
                    // sub-pixel anti-aliasing during the fade-in,
                    // not a color difference.
                    color: colors.ink,
                    fontSize: isPrayer ? 24 : 20,
                    lineHeight: isPrayer ? 36 : 32,
                    letterSpacing: -0.1,
                    // Prayer was previously center-aligned to
                    // read as a "ceremony" beat distinct from
                    // narrative panels. Design review reverted
                    // it to left-align so the closing prayer
                    // reads with the same column rhythm the
                    // reader has spent the last four panels
                    // settling into — switching alignment at
                    // the final beat felt like changing voices
                    // mid-sentence. Both modes now share the
                    // same left-anchored column.
                    textAlign: "left",
                    // Snapped from 28 → 24 to land on the 8-pt
                    // grid. The same value is applied to every
                    // paragraph (no per-index override) so the
                    // paragraph rhythm is mathematically uniform.
                    // 24pt is above the HIG 16pt floor for
                    // paragraph separation and reads as a clear
                    // "next thought" break without crowding.
                    marginBottom: 24,
                    opacity: anim,
                    transform: [{ translateY }],
                  }}
                >
                  {emphasisSegments.map((seg, j) => {
                    // Pick the matching SF Pro weight/style per
                    // segment kind. The base paragraph already
                    // declares Medium; we only override the
                    // weight (and optionally italic) for
                    // emphasized spans so the inner <Text> stays
                    // as light as possible (color, size,
                    // lineHeight, family all inherit from the
                    // parent Animated.Text above).
                    //
                    //   • Bold      → 700 Bold (a clean two-
                    //                 step jump above Medium so
                    //                 the emphasis lands; 600
                    //                 SemiBold read as "kind of
                    //                 bolder", which is no
                    //                 emphasis at all).
                    //   • Italic    → 500 Medium Italic
                    //                 (same weight as the
                    //                 surrounding prose so the
                    //                 italic reads as TONE, not
                    //                 weight — sub-cue, not
                    //                 over-emphasis).
                    //   • Both      → 700 Bold Italic (used
                    //                 sparingly for the
                    //                 strongest single beats).
                    //   • Plain     → no override, inherits
                    //                 Medium from the parent.
                    let segStyle: TextStyle | undefined;
                    if (seg.bold && seg.italic) {
                      segStyle = { fontWeight: "700", fontStyle: "italic" };
                    } else if (seg.bold) {
                      segStyle = { fontWeight: "700" };
                    } else if (seg.italic) {
                      segStyle = { fontWeight: "500", fontStyle: "italic" };
                    }
                    return segStyle ? (
                      <Text key={j} style={segStyle}>
                        {seg.text}
                      </Text>
                    ) : (
                      // Plain-text segment — render the raw
                      // string instead of a wrapper <Text> so
                      // we don't pay an unnecessary subtree
                      // for the common case of unemphasized
                      // prose between two emphasized spans.
                      seg.text
                    );
                  })}
                </Animated.Text>
              );
            })}
          </View>

          {/* (Earlier revisions rendered an Imprint-style
              "SERMON BY / {voice}" attribution block here at
              the bottom of the body. Removed because the
              sermons aren't truly authored by the named
              pastor — the `voice` field is a stylistic
              attribution, not a real credit, and surfacing it
              as "Sermon by Tim Keller" was misleading. The
              panel body now ends with the prose itself.)

              The standalone "AMEN" tracked-uppercase mark that
              previously closed the prayer body was also removed
              here — the prayer text itself ends with "...In
              Jesus' name, Amen." which makes the duplicate
              mark redundant, and the closing action is now the
              "Complete and unlock apps" CTA below. */}
          </View>
        </ScrollView>

        {/* Bottom-fade overlay — soft vertical gradient from the
            page background (opaque) → transparent over 56pt,
            anchored to the bottom edge of the scroll area just
            above the Continue pill. Apple Books / Apple News /
            iOS Reader all use this pattern so scrolling prose
            doesn't visually collide with the bottom toolbar —
            content gracefully dissolves into the page canvas as
            it approaches the CTA region instead of being clipped
            by the toolbar's hard edge or bleeding behind the
            button's shadow glow. Renders with
            `pointerEvents="none"` so it never intercepts taps
            on the body content beneath. */}
        <Svg
          pointerEvents="none"
          width={screenWidth}
          height={56}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <Defs>
            <LinearGradient
              id="bodyBottomFade"
              x1="0"
              y1="0"
              x2="0"
              y2="56"
              gradientUnits="userSpaceOnUse"
            >
              <Stop offset="0" stopColor={colors.bg} stopOpacity={0} />
              <Stop offset="1" stopColor={colors.bg} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect width={screenWidth} height={56} fill="url(#bodyBottomFade)" />
        </Svg>
        </View>

        <View className="px-6 pb-2">
          {/* Earlier revisions rendered a small "Next · The
              Story →" preview chip above the Continue button to
              prime the reader for the next beat. Removed at the
              user's request: the chip surfaced the internal
              beat label ("The Hook" / "The Story") which was
              never meant for the reader. The Continue pill on
              its own is enough — the eye already knows there's
              a next page. */}

          {/* Same Imprint-style pill across prayer and narrative
              panels — collapsed to one component so the lock
              countdown, accent color, and pressed-state behavior
              stay consistent across the whole flow. Prayer drops
              the trailing arrow (the action is "complete", not
              "next") and uses a longer label that names the real
              side-effect of the tap: "Complete and unlock apps"
              tells the user exactly what's about to happen when
              the sermon flow closes — focus mode lifts, the
              blocked apps return.

              On the prayer panel we ALSO hold the pill back
              entirely until every stanza has finished fading
              in (`prayerRevealComplete`). The button becomes
              the conclusion of the prayer rather than a
              competing UI element during the slow rise. We use
              a wrapping fade so the pill doesn't snap into
              existence — it whispers in over ~1s once the last
              stanza lands. Narrative panels render the pill
              immediately (the 5s dwell timer still gates the
              tap itself). */}
          {/* The Landing panel HIDES the regular Continue pill
              when the catalog ships a `practiceToday` line for
              this sermon — the swipe-up Practice card below
              becomes the only advance affordance, so the user's
              attention isn't split between two CTAs. The card
              itself includes a "Continue to prayer" pill inside
              its expanded body, so the user never loses access
              to a labeled advance. Panels without practice
              content render the regular pill exactly as before. */}
          {showPracticeCard ? null : isPrayer && !prayerRevealComplete ? null : (
            <PillReveal animate={isPrayer}>
              <ImprintContinuePill
                // Prayer pill prefixes the label with an unlock
                // emoji (🔓) — the small visual cue makes the
                // "and unlock apps" side-effect feel concrete in
                // the same pre-attentive glance the label takes.
                // Narrative / final panels keep their plain text
                // label (the trailing arrow on those carries the
                // forward-motion cue instead).
                label={
                  isPrayer
                    ? "🔓 Complete and unlock apps"
                    : isLastPanel
                      ? "Finish"
                      : "Continue"
                }
                accent={accent}
                onPress={handleContinue}
                locked={locked}
                secondsLeft={secondsLeft}
                showArrow={!isPrayer}
              />
            </PillReveal>
          )}
          {isPrayer && prayerRevealComplete ? (
            <PillReveal animate>
              <Text
                className="text-ink-subtle text-[12px] text-center mt-3"
                style={{ fontFamily: "System", fontWeight: "500" }}
              >
                You showed up today. That counts.
              </Text>
            </PillReveal>
          ) : null}
        </View>
      </SafeAreaView>

      {/* Practice Today card — sibling of SafeAreaView so it can
          overlay the entire panel (including the safe-area
          bottom inset) without being clipped by the safe-area
          padding. Anchored to the bottom of the root view in
          PEEK state, expanded to ~78% of the screen height on
          swipe up. The card's "Continue to prayer" CTA + the
          swipe-down gesture both route through the same path
          the regular Continue pill would have taken on this
          panel (the pray-together interstitial → prayer panel),
          so the practice card is a CONTENT moment, not a
          navigational branch. */}
      {showPracticeCard ? (
        <PracticeTodayCard
          text={practiceText}
          firstName={firstName}
          accent={accent}
          onAdvance={() => {
            // Same destination handleContinue would have used
            // on this panel — the pray-together interstitial
            // fades into the prayer body. Keeping the routing
            // in one place means future changes to the prayer
            // entry flow (e.g. swapping the interstitial for a
            // breath beat) automatically apply whether the
            // sermon has practice content or not.
            router.push("/sermon/pray-together");
          }}
        />
      ) : null}
    </View>
  );
}

/**
 * ImprintContinuePill — wide rounded primary CTA with a trailing
 * arrow glyph. Used on narrative sermon panels (1–4) as the
 * "carry me forward" tap. Matches the Imprint reading-screen
 * primary action shape: full-width pill, bright color, end-of-
 * label arrow that hints at the next beat.
 *
 * Background + glow color come from the shared SERMON_ACCENT so
 * the whole flow — narrative panels, prayer panel, home → sermon
 * transition — reads of-a-piece in the same editorial red. An
 * earlier revision hard-coded iOS-blue regardless of sermon type,
 * which created a jarring blue island in an otherwise accent-
 * tinted page; an intermediate revision flipped the prayer panel
 * to a separate blue palette, which made the prayer feel like a
 * different app. One accent across the whole journey collapses
 * both regressions.
 */
function ImprintContinuePill({
  label,
  accent,
  onPress,
  locked,
  secondsLeft,
  showArrow,
}: {
  label: string;
  accent: string;
  onPress: () => void;
  /** When true the pill is dimmed and ignores taps; the countdown is appended to the label. */
  locked: boolean;
  /** Seconds remaining on the lock; surfaced in-pill as "label · 4s". */
  secondsLeft: number;
  /** Show the trailing arrow glyph. Disabled on prayer (completion is not "next"). */
  showArrow: boolean;
}) {
  // When locked, append the countdown to the label and dim the
  // pill. Tap is swallowed by the `disabled` prop so the user
  // can mash without anything happening. We keep the arrow
  // hidden during the lock window so the eye doesn't read the
  // pill as "tap me, go forward" while it's deliberately
  // waiting on the dwell timer.
  const displayLabel = locked ? `${label} · ${secondsLeft}s` : label;
  const showArrowGlyph = showArrow && !locked;

  return (
    <Pressable
      onPress={onPress}
      disabled={locked}
      style={({ pressed }) => ({
        opacity: locked ? 0.45 : pressed ? 0.92 : 1,
        alignSelf: "stretch",
      })}
      accessibilityRole="button"
      accessibilityLabel={displayLabel}
      accessibilityState={{ disabled: locked }}
    >
      <View
        style={{
          backgroundColor: accent,
          borderRadius: 999,
          paddingVertical: 16,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          // Glow stays attached to the pill at all times — the
          // dim opacity above already communicates the lock; a
          // toggled shadow would feel like the button blinked
          // out of existence and back.
          shadowColor: accent,
          shadowOpacity: 0.5,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 0 },
          elevation: 6,
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontFamily: "System",
            fontWeight: "700",
            fontSize: 15,
            letterSpacing: 0.2,
            marginRight: showArrowGlyph ? 10 : 0,
          }}
        >
          {displayLabel}
        </Text>
        {showArrowGlyph ? (
          <SFSymbol name="arrow.right" size={15} weight="bold" color="#FFFFFF" />
        ) : null}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Constants + helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Clamp an arbitrary number to a valid panel id (1..5). Anything
 * else (NaN, negative, > 5) collapses to 1 so the screen always
 * has a real panel to render.
 */
function clampPanelId(raw: number): number {
  if (!Number.isFinite(raw)) return 1;
  const int = Math.floor(raw);
  if (int < 1) return 1;
  if (int > SERMON_STEPS.length) return SERMON_STEPS.length;
  return int;
}

// (Earlier revisions defined a top-anchored DawnGlow radial
// gradient that rendered behind the prayer panel as a "light
// entering from above" cue. Removed — the prayer screen now
// lands on the same calm black canvas as every other panel,
// with no extra atmosphere. The Defs / RadialGradient / Rect
// / Stop imports from react-native-svg were dropped with it.)

/**
 * Minimal top-bar used in place of the SermonHeader on the
 * prayer panel. Renders only the close (✕) chip so the user
 * always has an escape hatch — but drops the progress bar that
 * would otherwise frame the prayer as "you're 91% through a
 * piece of content." Prayer is the conclusion of the sermon;
 * surfacing a progress meter at that moment collapses the
 * posture the page is trying to set.
 *
 * Geometry mirrors the SermonHeader's left-aligned close glyph
 * so the chip lands on the same hit zone the user has muscle
 * memory for across the other panels.
 */
function PrayerCloseHeader({ onClose }: { onClose: () => void }) {
  // Same theme-aware chip treatment the SermonHeader's close
  // glyph uses (bg-surface + border-border, ink-color stroke), so
  // light mode lifts a white chip off the cream canvas while
  // dark mode keeps an inset dark chip against the void. The
  // earlier translucent-white-on-anything version disappeared on
  // a cream page.
  const colors = useColors();
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 8,
      }}
    >
      <Pressable
        onPress={onClose}
        hitSlop={14}
        accessibilityRole="button"
        accessibilityLabel="Close prayer"
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          alignSelf: "flex-start",
        })}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <SFSymbol name="xmark" size={12} weight="semibold" color={colors.ink} />
        </View>
      </Pressable>
    </View>
  );
}

/**
 * Thin wrapper that fades + lifts its child in over ~900 ms on
 * mount. Used by the prayer panel to "whisper in" the Continue
 * pill and its supporting micro-copy once the stanza cascade
 * has finished — the pill becomes the conclusion of the prayer
 * rather than a competing UI element during the slow rise.
 *
 * `animate=false` is the no-op render path for narrative
 * panels: we still render the pill through this wrapper so
 * the layout is identical, just without the entrance
 * animation.
 */
function PillReveal({
  animate,
  children,
}: {
  animate: boolean;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(animate ? 0 : 1)).current;
  const translateY = useRef(new Animated.Value(animate ? 10 : 0)).current;
  useEffect(() => {
    if (!animate) return;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [animate, opacity, translateY]);

  if (!animate) return <>{children}</>;
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
