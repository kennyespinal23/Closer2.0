import { useEffect, useRef, type ReactNode } from "react";
import { Animated } from "react-native";

type FadeInProps = {
  /** Milliseconds to wait before the fade begins. */
  delayMs: number;
  /** Duration of the fade in milliseconds. Defaults to a contemplative pace. */
  durationMs?: number;
  children: ReactNode;
};

/**
 * Fades + slides children in with a small upward translate.
 * Uses the native driver for opacity/transform so it stays
 * buttery even on lower-end devices.
 *
 * Default timing is intentionally slow — these animations are used
 * on reflective onboarding screens where each line should feel like
 * an exhale, not a snap.
 */
export function FadeIn({
  delayMs,
  durationMs = 900,
  children,
}: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: durationMs,
        delay: delayMs,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: durationMs,
        delay: delayMs,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delayMs, durationMs]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
