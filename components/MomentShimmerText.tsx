import { Text as CloserAnimatedTextBase } from "@/components/CloserText";
import { memo, useEffect, useMemo } from "react";
import { type TextStyle } from "react-native";
import { Text } from "@/components/CloserText";
import Animated, { cancelAnimation, Easing, interpolateColor, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from "react-native-reanimated";
import { useAmbientMotionEnabled } from "@/lib/useAmbientMotionEnabled";
import { useBibleMomentCollection } from "@/state/bibleMoments";

/** Inline spans preserve the reader's native text wrapping and touch handling.
 * One UI-thread clock moves a soft highlight along the verse; no overlay,
 * duplicate text, timers, or React updates on animation frames.
 */
export function MomentShimmerText({ text, momentId, active, color, dark, style }: {
  text: string; momentId: string; active: boolean; color: string; dark: boolean; style: TextStyle;
}) {
  const motion = useAmbientMotionEnabled();
  const { ids, hydrated, error } = useBibleMomentCollection();
  const enabled = active && motion && hydrated && !error && !ids.includes(momentId);
  const progress = useSharedValue(-0.4);
  const words = useMemo(() => {
    let offset = 0;
    return (text.match(/\S+\s*|\s+/g) ?? []).map(word => {
      const center = (offset + word.length / 2) / Math.max(1, text.length);
      offset += word.length;
      return { word, center };
    });
  }, [text]);
  useEffect(() => {
    cancelAnimation(progress);
    progress.value = -0.4;
    if (enabled) {
      progress.value = withDelay(400, withRepeat(withSequence(
        withTiming(1.4, { duration: 2200, easing: Easing.linear }),
        withTiming(-0.4, { duration: 0 }),
        withDelay(2400, withTiming(-0.4, { duration: 0 })),
      ), -1, false));
    }
    return () => cancelAnimation(progress);
  }, [enabled, progress]);
  // Dark paper gets a pale category sheen; light paper gets a richer ink sheen
  // so the letters never wash out against the reading background.
  const shine = dark ? "#FFFFFF" : "#111827";
  return <Text style={style}>{words.map(({ word, center }, index) =>
    <ShimmerWord key={index} progress={progress} center={center} color={color} shine={shine} enabled={enabled}>{word}</ShimmerWord>
  )}</Text>;
}

const ShimmerWord = memo(function ShimmerWord({ children, progress, center, color, shine, enabled }: {
  children: string; progress: SharedValue<number>; center: number; color: string; shine: string; enabled: boolean;
}) {
  const animated = useAnimatedStyle(() => {
    const distance = Math.abs(progress.value - center);
    const strength = enabled ? Math.min(1, Math.max(0, (0.36 - distance) / 0.24)) : 0;
    return { color: interpolateColor(strength, [0, 1], [color, shine]) };
  });
  return <NunitoAnimatedText style={animated}>{children}</NunitoAnimatedText>;
});

const NunitoAnimatedText = Animated.createAnimatedComponent(CloserAnimatedTextBase);
