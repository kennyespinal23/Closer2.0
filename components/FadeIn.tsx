import { useEffect, useRef, type ReactNode } from "react";
import { Animated } from "react-native";
import { useReducedMotion } from "@/lib/useReducedMotion";

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
 *
 * Reduce Motion (iOS Accessibility): when the user has the OS-level
 * Reduce Motion preference on, the component skips the fade + slide
 * entirely and renders children at their final pose. The pacing of
 * onboarding is intentional, but the *motion itself* is the
 * disposable layer — anyone who's enabled Reduce Motion in iOS
 * Settings has explicitly told the OS "snap into screens, don't
 * slide". This is what Apple Books, Music, News all do.
 */
export function FadeIn({
  delayMs,
  durationMs = 900,
  children,
}: FadeInProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useRef(
    new Animated.Value(reducedMotion ? 1 : 0),
  ).current;
  const translateY = useRef(
    new Animated.Value(reducedMotion ? 0 : 10),
  ).current;

  useEffect(() => {
    if (reducedMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
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
  }, [opacity, translateY, delayMs, durationMs, reducedMotion]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}
