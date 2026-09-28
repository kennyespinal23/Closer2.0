import { useEffect } from "react";
import { Pressable, StyleSheet, type PressableProps } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withTiming, withSpring } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
/** Shared restrained feedback. Rows fade; standalone actions compress slightly. */
export function FeedbackPressable({ style, onPressIn, onPressOut, feedback = "row", ...props }: Omit<PressableProps, "style"> & { style?: Exclude<PressableProps["style"], Function>; feedback?: "row" | "action" }) {
  const reduced = useReducedMotion(), p = useSharedValue(0);
  useEffect(() => { if (props.disabled) p.value = 0; return () => cancelAnimation(p); }, [props.disabled, reduced]);
  const opacity = StyleSheet.flatten(style)?.opacity;
  const baseOpacity = typeof opacity === "number" ? opacity : 1;
  const motion = useAnimatedStyle(() => ({ opacity: baseOpacity * (1 - .16 * p.value), ...(feedback === "action" ? { transform: [{ scale: !reduced ? 1 - .02 * p.value : 1 }] } : {}) }));
  return <AnimatedPressable {...props} style={[style, motion]} onPressIn={event => { p.value = withTiming(1, { duration: reduced ? 0 : 90 }); onPressIn?.(event); }} onPressOut={event => { p.value = reduced ? 0 : withSpring(0, { stiffness: 420, damping: 32 }); onPressOut?.(event); }} />;
}
