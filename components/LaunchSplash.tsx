import { useEffect, useRef, useState } from "react";
import { Animated, Easing } from "react-native";
import { Image } from "expo-image";
import { shouldPlayLaunchSplash, consumeLaunchSplash } from "@/lib/launchSplashSession";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** Matches the orange field in `assets/splash-closer.png`. */
const SPLASH_ORANGE = "#F93104";

/**
 * LaunchSplash — the first frame after the OS splash.
 *
 * Full-bleed Closer+ wordmark on orange, held briefly, then faded
 * into the app shell. Starts fully visible so the handoff from the
 * native splash is a single image, not a flash of empty canvas.
 */
export function LaunchSplash() {
  const reducedMotion = useReducedMotion();
  const playSplash = shouldPlayLaunchSplash();

  const [mounted, setMounted] = useState(playSplash);
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!playSplash) return;

    consumeLaunchSplash();

    const HOLD_MS = 1000;
    const FADE_OUT_MS = reducedMotion ? 0 : 400;

    let cancelled = false;
    const holdTimer = setTimeout(() => {
      if (cancelled) return;
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: FADE_OUT_MS,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        if (cancelled) return;
        setMounted(false);
      });
    }, HOLD_MS);

    return () => {
      cancelled = true;
      clearTimeout(holdTimer);
    };
  }, [playSplash, reducedMotion, overlayOpacity]);

  if (!playSplash || !mounted) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessible={false}
      accessibilityLabel="Closer"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: SPLASH_ORANGE,
        opacity: overlayOpacity,
        zIndex: 9999,
        elevation: 9999,
      }}
    >
      <Image
        source={require("@/assets/splash-closer.png")}
        style={{ width: "100%", height: "100%" }}
        contentFit="cover"
        contentPosition="center"
        accessibilityIgnoresInvertColors
      />
    </Animated.View>
  );
}
