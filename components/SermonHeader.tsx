import { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, View } from "react-native";
import { useRouter } from "expo-router";
import { Symbol } from "@/components/Symbol";
import { useColors } from "@/state/theme";

type SermonHeaderProps = {
  /** 0..1 fraction of the sermon completed. Omit/undefined for the intro screen. */
  progress?: number;
  /** Step number for display, e.g. { index: 2, total: 5 }. Omit for intro. */
  step?: { index: number; total: number };
};

/**
 * Sermon progress bar accent — the same editorial red the home
 * page uses for the "Daily Devotional" subsection header
 * (Tailwind rose-600 / #E11D48). Using one accent across both
 * surfaces means the sermon flow reads as a continuation of the
 * home card the user just tapped Begin on, instead of an
 * unrelated palette taking over mid-journey.
 *
 * Duplicated here (rather than imported from the home screen)
 * so the SermonHeader stays self-contained — the home file
 * already declares its own private constant for the same hex
 * value, and pulling one out as a shared module token would
 * mean a new file for a single color. If we add a third surface
 * that needs the same red we can promote it then.
 */
const SERMON_ACCENT = "#E11D48";

/**
 * Sermon header — used by both the intro (no progress) and the in-sermon
 * step screens.
 *
 * Left side: an X that exits the entire sermon flow and drops the user
 * back into the Today tab. We use `replace` so the sermon stack is gone
 * — a swipe-back gesture shouldn't resurrect it.
 *
 * Progress treatment (in-sermon only):
 *   One continuous horizontal bar (3pt tall, full available width)
 *   whose filled portion grows from left to right as the user
 *   advances through the sermon beats. The fill animates whenever
 *   `progress` changes so navigating panel→panel reads as a smooth
 *   sweep rather than a hard jump.
 *
 *   Replaces the earlier segmented-chip treatment (N capsule
 *   chips with margins between them, current chip breathing).
 *   The chips read as a five-stepper which surfaced an
 *   internal taxonomy the user shouldn't have to think about;
 *   one continuous bar reads as plain progress ("you're about
 *   60% of the way through") without naming the beats.
 *
 *   Color: editorial red (`#E11D48`) — same accent the home
 *   "Daily Devotional" header uses, so the sermon flow inherits
 *   the home card's signature color across screens.
 */
export function SermonHeader({ progress, step }: SermonHeaderProps) {
  const router = useRouter();
  const colors = useColors();
  const showProgress = typeof progress === "number";

  const handleClose = () => {
    router.replace("/today");
  };

  return (
    <View className="px-6 pt-2 pb-4">
      <View className="flex-row items-center">
        <Pressable
          hitSlop={14}
          onPress={handleClose}
          className="w-10 h-10 rounded-full items-center justify-center bg-surface border border-border"
        >
          <Symbol name="xmark" size={14} weight="semibold" color={colors.ink} />
        </Pressable>

        {showProgress ? (
          // The step prop is no longer rendered as a "2/5" cue
          // (the continuous bar shows the same thing visually),
          // but we keep accepting it for back-compat with callers
          // — referenced via the void below to satisfy the lint.
          <View className="flex-1 ml-4">
            <ProgressBar
              fraction={progress}
              fillColor={SERMON_ACCENT}
              trackColor={colors.border}
            />
            {/* eslint-disable-next-line @typescript-eslint/no-unused-expressions */}
            {step ? null : null}
          </View>
        ) : (
          // Spacer — keeps the X aligned to the left when no progress shown.
          <View className="flex-1" />
        )}
      </View>
    </View>
  );
}

/**
 * One continuous progress bar. Renders a slim rounded track and
 * an animated fill that grows from left to right as `fraction`
 * (0..1) changes.
 *
 * Fill width is driven by an Animated.Value so navigating between
 * panels reads as a smooth sweep instead of a hard jump. The
 * width is animated using the JS driver (not native) because
 * width interpolation isn't supported on the native driver path;
 * the bar is tiny + the animation is short, so the cost is
 * imperceptible.
 */
function ProgressBar({
  fraction,
  fillColor,
  trackColor,
}: {
  fraction: number;
  fillColor: string;
  trackColor: string;
}) {
  // Clamp to [0, 1] so a stale/garbage prop can't paint outside
  // the track (or render a negative-width fill and crash native).
  const safe = Math.max(0, Math.min(1, fraction));

  const fillAnim = useRef(new Animated.Value(safe)).current;
  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: safe,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [safe, fillAnim]);

  const widthInterp = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={{
        height: 4,
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
