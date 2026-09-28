import { useEffect, type ReactNode } from "react";
import { Platform, StyleSheet, Text, View, type TextProps } from "react-native";
import { BlurView } from "expo-blur";
import Animated, { cancelAnimation, Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useResolvedScheme } from "@/state/theme";

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);

/** Native backdrop blur samples the text beneath it, then clears as the text settles. */
export function OnboardingFocusText({ delay = 100, exiting = false, blurEnabled = true, children, ...props }: TextProps & { delay?: number; exiting?: boolean; blurEnabled?: boolean }) {
  const reduced = useReducedMotion(), dark = useResolvedScheme() === "dark";
  const focus = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    cancelAnimation(focus);
    if (reduced) focus.value = 1;
    else if (exiting) focus.value = withTiming(0, { duration: 140 });
    else {
      focus.value = 0;
      focus.value = withDelay(delay, withTiming(1, { duration: 420, easing: Easing.out(Easing.cubic) }));
    }
    return () => cancelAnimation(focus);
  }, [children, delay, exiting, reduced]);
  const motion = useAnimatedStyle(() => ({ opacity: focus.value, transform: [{ translateY: (1-focus.value) * 8 }] }));
  const blur = useAnimatedProps(() => ({ intensity: (1-focus.value) * 24 }));
  return <Animated.View style={motion}>
    <Text {...props}>{children}</Text>
    {!reduced && blurEnabled && Platform.OS === "ios" && <AnimatedBlur pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" tint={dark ? "dark" : "light"} animatedProps={blur} style={StyleSheet.absoluteFill}/>}
  </Animated.View>;
}

export function OnboardingMotionGroup({ children, delay = 0, exiting = false, stationary = false }: { children: ReactNode; delay?: number; exiting?: boolean; stationary?: boolean }) {
  const reduced = useReducedMotion(), p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    p.value = reduced ? 1 : exiting ? withTiming(0, { duration: 140 }) : withDelay(delay, withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) }));
    return () => cancelAnimation(p);
  }, [exiting, reduced, delay]);
  const style = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: (1-p.value) * 10 }] }));
  return stationary ? <View>{children}</View> : <Animated.View style={style}>{children}</Animated.View>;
}
