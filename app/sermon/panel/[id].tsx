import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { FocusBanner } from "@/components/FocusBanner";
import { SermonHeader } from "@/components/SermonHeader";
import { Symbol } from "@/components/Symbol";
import {
  SERMON_STEPS,
  sermonProgressFor,
  sermonStepNumber,
  stepForPanelId,
} from "@/constants/sermon";
import * as haptics from "@/lib/haptics";
import { resolveSermonTypeForMoment } from "@/lib/moments";
import { useMoments } from "@/state/moments";
import { useProgress } from "@/state/progress";
import { useColors } from "@/state/theme";

/**
 * The editorial red shared with the home "Daily Devotional"
 * subsection header and the SermonHeader progress bar. The
 * Continue pill on every narrative panel paints with this color
 * so the home → sermon flow reads as one continuous accent.
 *
 * Same hex (`#E11D48` / Tailwind rose-600) duplicated here rather
 * than threaded through a shared module so the panel file stays
 * self-contained. The home file and SermonHeader each declare
 * their own private copy of the constant for the same reason.
 */
const SERMON_ACCENT = "#E11D48";

/**
 * Hero image geometry for the Hook panel (panel 1).
 *
 * Apple-News-style hero treatment: the per-sermon illustration
 * sits at the top of the article as a full-width image, with the
 * body prose below. 320pt is ~38% of an iPhone 14 Pro screen —
 * matches the proportion Apple News uses for an article's
 * primary art and leaves enough vertical room for the title +
 * opening paragraph to be visible above the fold.
 *
 * The bottom 120pt of the image dissolves into the page's black
 * canvas via a vertical gradient so the title beneath it reads
 * without a hard horizontal seam. Tuned long enough to feel like
 * a gradient rather than a band, short enough that the
 * recognizable subject of the illustration stays visible.
 */
const HOOK_HERO_HEIGHT = 320;
const HOOK_HERO_FADE_HEIGHT = 120;

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
  const type = resolveSermonTypeForMoment(todaysMoment);
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
    () => splitPanelParagraphs(panel.body, isPrayer),
    [panel.body, isPrayer],
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
  const accent = SERMON_ACCENT;

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
    // moment's title goes onto the Journey timeline and the
    // moment's `voice` carries through as the pastor attribution
    // so the timeline card has a real name to display.
    const {
      typeCount,
      isFirstEver,
      newStreak,
      streakAdvanced,
      crossedMilestone,
    } = recordCompletion(type.id, {
      title: todaysMoment.title,
      pastor: todaysMoment.voice,
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
    // Calm canvas across the entire sermon flow — true black in
    // dark mode, warm cream in light mode. The previous full-
    // bleed dimmed illustration + bottom fade gradient was
    // removed at the user's request — the prose is the whole
    // stage now, and the eye stays anchored on the words across
    // panel transitions instead of re-acclimating to a new
    // visual every time. Prayer keeps its dawn-glow halo on top
    // of this canvas, painted in the SafeAreaView below.
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
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
            progress={sermonProgressFor(stepName)}
            step={sermonStepNumber(stepName)}
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

        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingBottom: 24,
            // Prayer is meant to be received — vertically centered so
            // the words settle in the middle of the screen, not at
            // the top. Narrative panels start at the top so the
            // reader scans naturally downward through the long copy.
            justifyContent: isPrayer ? "center" : "flex-start",
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Apple News-style hero image (Hook panel only) ──
              The per-sermon illustration sits at the top of the
              article as a full-width hero — the visual anchor
              that grounds the reader in the topic before any
              prose is read. Renders ONLY on panel 1 (the Hook);
              every subsequent panel drops it so the body has
              the screen to itself once the reader is settled
              into the sermon.
              
              `type.illustration` resolves to the per-sermon
              override from sermons.js when present (e.g. the
              "When God Feels Silent" phone-receiver art),
              otherwise falls back to the sermon TYPE's default
              illustration. Either way, we paint nothing when
              both are absent — better to drop the band than to
              render a placeholder.
              
              Full screen width (no horizontal padding so the
              image goes edge-to-edge — same as Apple News),
              320pt tall, cover-cropped. A 120pt vertical
              gradient on the bottom dissolves the image into
              the black canvas so the title underneath reads
              without a hard horizontal seam. The image scrolls
              naturally with the rest of the article rather
              than parallaxing — the simpler scroll is the
              Apple News default and reads as more reverent
              than a paralax effect would for a sermon body. */}
          {isHookPanel && type.illustration ? (
            <View
              style={{
                width: "100%",
                height: HOOK_HERO_HEIGHT,
              }}
            >
              <Image
                source={type.illustration}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                transition={260}
                accessibilityIgnoresInvertColors
              />
              <Svg
                pointerEvents="none"
                width={screenWidth}
                height={HOOK_HERO_FADE_HEIGHT}
                style={{ position: "absolute", bottom: 0, left: 0 }}
              >
                <Defs>
                  <LinearGradient
                    id="hookHeroFade"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={HOOK_HERO_FADE_HEIGHT}
                    gradientUnits="userSpaceOnUse"
                  >
                    <Stop offset="0" stopColor={colors.bg} stopOpacity={0} />
                    <Stop offset="1" stopColor={colors.bg} stopOpacity={1} />
                  </LinearGradient>
                </Defs>
                <Rect
                  width={screenWidth}
                  height={HOOK_HERO_FADE_HEIGHT}
                  fill="url(#hookHeroFade)"
                />
              </Svg>
            </View>
          ) : null}

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
                  fontFamily: "PlusJakartaSans_700Bold",
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
              return (
                <Animated.Text
                  key={i}
                  style={{
                    fontFamily: "PlusJakartaSans_400Regular",
                    color: colors.ink,
                    fontSize: isPrayer ? 24 : 20,
                    lineHeight: isPrayer ? 36 : 32,
                    letterSpacing: -0.1,
                    textAlign: isPrayer ? "center" : "left",
                    marginBottom: 28,
                    opacity: anim,
                    transform: [{ translateY }],
                  }}
                >
                  {p}
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
          {isPrayer && !prayerRevealComplete ? null : (
            <PillReveal animate={isPrayer}>
              <ImprintContinuePill
                label={
                  isPrayer
                    ? "Complete and unlock apps"
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
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                You showed up today. That counts.
              </Text>
            </PillReveal>
          ) : null}
        </View>
      </SafeAreaView>
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
            fontFamily: "PlusJakartaSans_700Bold",
            fontSize: 15,
            letterSpacing: 0.2,
            marginRight: showArrowGlyph ? 10 : 0,
          }}
        >
          {displayLabel}
        </Text>
        {showArrowGlyph ? (
          <Symbol name="arrow.right" size={15} weight="bold" color="#FFFFFF" />
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
          <Symbol name="xmark" size={12} weight="semibold" color={colors.ink} />
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
