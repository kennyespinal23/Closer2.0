import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { SFSymbol } from "@/components/Symbol";
import { useHighContrast } from "@/lib/useReducedMotion";
import { useColors } from "@/state/theme";

type SermonHeaderProps = {
  /**
   * 1-indexed CURRENT step (e.g. 2 for the second of five
   * panels). Drives which segment in the segmented bar is the
   * "active" one. Omit on the intro screen where no progress
   * is shown.
   */
  step?: { index: number; total: number };
  /**
   * 0..1 fraction of how far the user has read through the
   * CURRENT step's body. Each render of the panel screen
   * pipes its ScrollView `onScroll` through this so the
   * active segment fills incrementally as the reader moves
   * down the page (matches Deepstash's chapter-progress
   * bar). Defaults to 0 if omitted.
   */
  stepProgress?: number;
};

/**
 * Sermon progress bar accent — the editorial red the home page
 * uses for "Daily Devotional" subsection headers. Using one
 * accent across both surfaces means the sermon flow reads as a
 * continuation of the home card the user just tapped Begin on,
 * not an unrelated palette taking over mid-journey.
 */
import { CLOSER_ACCENT } from "@/constants/theme";

/**
 * Sermon header — used by both the intro (no progress) and the
 * in-sermon step screens.
 *
 * Left side: an X that exits the entire sermon flow and drops
 * the reader back into the Today tab. We use `replace` so the
 * sermon stack is gone — a swipe-back gesture shouldn't
 * resurrect it.
 *
 * Progress treatment (in-sermon only):
 *
 *   ━━━━  ▓▓▓▒▒▒  ░░░░  ░░░░  ░░░░       ← Deepstash pattern
 *   ↑     ↑       ↑
 *   done  active  future
 *
 *   Five capsule "segments" (one per sermon step) laid out as
 *   a horizontal row with a small gap between them. Each
 *   segment is independently painted in one of three states:
 *
 *     • DONE   — past steps. Fully filled with the editorial
 *                red so the reader can see at a glance which
 *                beats they've already moved through.
 *     • ACTIVE — current step. Track is rendered at the
 *                quiet-gray track color; an animated inner
 *                fill grows from 0% → 100% based on
 *                `stepProgress` (which the panel screen
 *                drives from its ScrollView scroll position).
 *                The fill is the same editorial red as the
 *                DONE segments so completing this segment
 *                visually merges it into the DONE row above.
 *     • FUTURE — upcoming steps. Track-color only, no fill.
 *
 *   The segmented treatment replaces the earlier continuous-
 *   bar pattern at the user's request: a Deepstash-style
 *   segmented bar makes the structure of the sermon visible
 *   (5 chunks, here's chunk 2 in progress) without needing
 *   to also surface a numeric "2 of 5" indicator. Apple News
 *   uses the same segmented pattern for its multi-card
 *   stories; Duolingo uses it for lesson progress.
 *
 *   Color choices:
 *     • Fill   — editorial red (#E11D48), same as the home
 *                "Daily Devotional" header so the sermon
 *                flow inherits the home card's accent.
 *     • Track  — responds to iOS Increase Contrast. Default
 *                #5C5C5C is ~3.1:1 vs black (the HIG 3:1
 *                floor for UI components). When Increase
 *                Contrast is on we bump to #8E8E93 (~5.5:1),
 *                matching what UIKit does for its own
 *                UIProgressView trackTintColor.
 */
export function SermonHeader({ step, stepProgress }: SermonHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const highContrast = useHighContrast();
  const showProgress = typeof step !== "undefined";

  const handleClose = () => {
    router.replace("/today");
  };

  return (
    <View className="px-6 pt-2 pb-4">
      <View className="flex-row items-center">
        {/* Close chip — 44×44pt visible target so the user can
            PERCEIVE the tap area, not just feel it (HIG calls
            for the visible control to meet 44pt, not just the
            hit-tested region under hitSlop). */}
        <Pressable
          hitSlop={8}
          onPress={handleClose}
          className="w-11 h-11 rounded-full items-center justify-center bg-surface border border-border"
        >
          <SFSymbol
            name="xmark"
            size={16}
            weight="semibold"
            color={colors.ink}
          />
        </Pressable>

        {showProgress ? (
          <View className="flex-1 ml-4">
            <SegmentedProgress
              total={step.total}
              currentIndex={step.index}
              currentFraction={stepProgress ?? 0}
              fillColor={CLOSER_ACCENT}
              trackColor={highContrast ? "#8E8E93" : "#5C5C5C"}
            />
          </View>
        ) : (
          // Spacer keeps the X aligned to the left when no
          // progress is shown (the intro screen).
          <View className="flex-1" />
        )}
      </View>
    </View>
  );
}

/**
 * Deepstash-style segmented progress bar.
 *
 * Renders `total` equal-width capsule segments separated by a
 * fixed 4pt gap. Each segment is one of three states (DONE,
 * ACTIVE, FUTURE) computed from `currentIndex` (1-indexed) and
 * `currentFraction` (0..1 progress within the active segment).
 *
 *   index < currentIndex   → DONE     (full fill)
 *   index === currentIndex → ACTIVE   (animated fraction fill)
 *   index > currentIndex   → FUTURE   (no fill, track only)
 *
 * The active segment's fill is wrapped in an Animated.View so
 * the fraction transitions smoothly as the user scrolls. We
 * use the JS driver (not native) because `width` interpolation
 * isn't supported on the native driver — the cost is
 * imperceptible at this scale (single tiny bar, short
 * animations).
 *
 * Segments use `flex: 1` so they always evenly split the
 * available width regardless of `total`. A future sermon
 * format with more or fewer steps doesn't need a new layout
 * pass here.
 */
function SegmentedProgress({
  total,
  currentIndex,
  currentFraction,
  fillColor,
  trackColor,
}: {
  total: number;
  currentIndex: number;
  currentFraction: number;
  fillColor: string;
  trackColor: string;
}) {
  // Defensive clamps — a stale prop should never paint outside
  // the bar or render a negative-width fill (which crashes
  // native on some iOS versions).
  const safeFraction = Math.max(0, Math.min(1, currentFraction));
  const segments = Array.from({ length: Math.max(1, total) }, (_, i) => i + 1);

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        // 10pt total container holds the 8pt segment tracks.
        // Bumped from 6/4 → 10/8 per the June 2026 design
        // review: the previous thin chip read as an
        // afterthought against the body-weight bump, and a
        // long-form reading app (Imprint, Deepstash, Pocket)
        // surfaces progress as a confident UI band, not a
        // hairline. 8pt is the iOS Now Playing scrubber
        // height — substantial enough to register at a glance
        // without becoming a banner.
        height: 10,
      }}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: total,
        // Surface the "X of Y" reading to screen readers — the
        // visual segmented bar already shows this, but the
        // numeric value is what VoiceOver speaks.
        now: Math.min(total, currentIndex - 1 + safeFraction),
        text: `Step ${currentIndex} of ${total}`,
      }}
    >
      {segments.map((segmentNumber, i) => {
        const isLast = i === segments.length - 1;
        const state: "done" | "active" | "future" =
          segmentNumber < currentIndex
            ? "done"
            : segmentNumber === currentIndex
              ? "active"
              : "future";
        return (
          <View
            key={segmentNumber}
            style={{
              flex: 1,
              // 4pt gap between segments — tight enough that
              // the bar reads as one continuous progress row,
              // wide enough to clearly delineate each step.
              // Last segment has no trailing margin so the
              // row ends flush with the parent's right edge.
              marginRight: isLast ? 0 : 4,
            }}
          >
            <Segment
              state={state}
              fraction={state === "active" ? safeFraction : 0}
              fillColor={fillColor}
              trackColor={trackColor}
            />
          </View>
        );
      })}
    </View>
  );
}

/**
 * One capsule in the segmented bar. Renders the track
 * unconditionally, then overlays a same-color fill at the
 * appropriate width for the segment's state.
 *
 * Animation contract:
 *   • DONE / FUTURE segments are static — no animator runs,
 *     they paint to their final state immediately.
 *   • ACTIVE segments animate the fill width on every
 *     `fraction` change so scroll-driven updates feel
 *     continuous rather than steppy.
 *
 * The fill always renders at 100% width inside the parent
 * track and we control its visible portion via a horizontal
 * transform.translateX (no width interpolation needed) —
 * actually NO: we DO use width interpolation here because we
 * want the LEFT edge anchored and the right edge to grow. The
 * native driver doesn't support animated width so we fall
 * back to the JS driver; the cost is negligible at this
 * scale (one bar, short ms).
 */
function Segment({
  state,
  fraction,
  fillColor,
  trackColor,
}: {
  state: "done" | "active" | "future";
  fraction: number;
  fillColor: string;
  trackColor: string;
}) {
  const animatedFraction = useRef(
    new Animated.Value(state === "done" ? 1 : state === "future" ? 0 : fraction),
  ).current;

  useEffect(() => {
    // Three branches:
    //   • DONE   — snap to 1 (no animation; the segment is
    //              already settled history, the user has
    //              moved past it).
    //   • FUTURE — snap to 0 (same reasoning in reverse).
    //   • ACTIVE — animate to the new fraction. Short ease-
    //              out so a scroll burst lands without
    //              feeling sluggish but doesn't jitter on
    //              fine-grain scrolls.
    if (state === "done") {
      animatedFraction.setValue(1);
      return;
    }
    if (state === "future") {
      animatedFraction.setValue(0);
      return;
    }
    Animated.timing(animatedFraction, {
      toValue: fraction,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [state, fraction, animatedFraction]);

  const widthInterp = animatedFraction.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={{
        // 8pt segment height — paired with the 10pt container
        // above. The taller capsule lets the fill animation
        // read as motion rather than a sliver, and the
        // pill-rounded ends still feel light enough to be
        // chrome (not a banner). Bumped from 4pt with the
        // June 2026 body-weight pass; a heavier body needs a
        // heavier progress band to keep the visual hierarchy.
        height: 8,
        borderRadius: 999,
        backgroundColor: trackColor,
        overflow: "hidden",
      }}
    >
      <Animated.View
        style={{
          width: widthInterp,
          height: "100%",
          borderRadius: 999,
          backgroundColor: fillColor,
        }}
      />
    </View>
  );
}
