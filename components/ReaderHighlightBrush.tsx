import { useEffect, useRef } from "react";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** Paint behind measured text lines; never changes text layout or pagination. */
export function ReaderHighlightBrush({ color, x, y, width, height }: { color?: string; x: number; y: number; width: number; height: number }) {
  const reduced = useReducedMotion();
  const previous = useRef(color);
  const progress = useSharedValue(color ? 1 : 0);
  useEffect(() => {
    if (color !== previous.current) {
      progress.value = 0;
      progress.value = withTiming(color ? 1 : 0, { duration: reduced ? 0 : 700, easing: Easing.bezier(.5, 0, .3, 1) });
      previous.current = color;
    }
  }, [color, reduced]);
  const style = useAnimatedStyle(() => ({ width: width * progress.value }));
  return <Animated.View pointerEvents="none" style={[{ position: "absolute", left: x, top: y + height * .12, height: height * .8, borderRadius: 3, backgroundColor: color ?? "transparent" }, style]} />;
}
