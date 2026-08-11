import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View, Platform } from "react-native";
import { CLOSER_ACCENT } from "@/constants/theme";
import { shouldPlayLaunchSplash, consumeLaunchSplash } from "@/lib/launchSplashSession";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * LaunchSplash — the first frame after the OS splash.
 *
 * Sits as an absolutely-positioned overlay on top of the app
 * shell during cold launch. The native splash hands off to this
 * component on the orange brand canvas with a white wordmark.
 */
export function LaunchSplash() {
  const reducedMotion = useReducedMotion();
  const playSplash = shouldPlayLaunchSplash();

  const [mounted, setMounted] = useState(playSplash);

  const logoOpacity = useRef(
    new Animated.Value(reducedMotion ? 1 : 0),
  ).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!playSplash) return;

    consumeLaunchSplash();

    // Total dwell time before the fade-out begins. 1300ms keeps
    // us comfortably inside Apple's "perceived load" window
    // (under 2s feels intentional; over 2s feels broken). The
    // brief's hold range is 800–1200ms; we land near the upper
    // edge so the wordmark has a beat to be read.
    const FADE_IN_MS = reducedMotion ? 0 : 300;
    const HOLD_MS = 1000;
    const FADE_OUT_MS = reducedMotion ? 0 : 400;

    let cancelled = false;

    Animated.timing(logoOpacity, {
      toValue: 1,
      duration: FADE_IN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (cancelled) return;
      // Hold beat — the only "do nothing" frame in the
      // choreography. Implemented as a plain setTimeout rather
      // than an Animated.delay so we can tear it down cleanly
      // in the cleanup callback below.
      const holdTimer = setTimeout(() => {
        if (cancelled) return;
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: FADE_OUT_MS,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          if (cancelled) return;
          // Self-unmount after the fade-out lands. Without
          // this the overlay would linger at 0 opacity over
          // the home screen, intercepting taps on `pointerEvents`
          // configurations the platform might not respect on
          // every iOS build.
          setMounted(false);
        });
      }, HOLD_MS);
      // Stash the timer on the closure so we can clear it if
      // the parent unmounts us before the hold expires (rare,
      // but defensive against Fast Refresh / dev reloads).
      (cleanupTimers as { holdTimer?: ReturnType<typeof setTimeout> })
        .holdTimer = holdTimer;
    });

    const cleanupTimers: { holdTimer?: ReturnType<typeof setTimeout> } =
      {};
    return () => {
      cancelled = true;
      if (cleanupTimers.holdTimer) clearTimeout(cleanupTimers.holdTimer);
    };
    // Intentionally only runs once per mount — the animation
    // controllers are refs (stable identities) and reducedMotion
    // is read at mount-time to lock the choreography. If a user
    // toggles Reduce Motion mid-splash, they get the choreography
    // they had at launch; respinning the splash because they
    // flipped a system setting would be weirder than honoring
    // the initial pose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSplash]);

  if (!playSplash || !mounted) return null;

  return (
    <Animated.View
      // pointerEvents="none" on the OUTER overlay so taps can
      // bleed through to the home screen the moment the fade-out
      // starts — the user shouldn't feel a "tap-eating" pause at
      // the end of the splash. The surface is purely visual.
      pointerEvents="none"
      accessible={false}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: CLOSER_ACCENT,
        alignItems: "center",
        justifyContent: "center",
        opacity: overlayOpacity,
        // Keep the splash above every absolute-positioned child
        // anywhere in the AppShell tree (modals, sheets, tab bar
        // overlays). Using a high explicit zIndex/elevation
        // because the splash sits at the layout-component level
        // and there's no portal hierarchy to lean on.
        zIndex: 9999,
        elevation: 9999,
      }}
    >
      <Animated.View style={{ opacity: logoOpacity }}>
        <Text
          // SF Pro Display — Apple's stock display font.
          // Weight bold + size 52 so the wordmark reads as the
          // sole hero on the orange canvas.
          style={{
            fontFamily: Platform.select({
              ios: "SF Pro Display",
              default: "System",
            }),
            fontWeight: "700",
            fontSize: 52,
            lineHeight: 56,
            color: "#FFFFFF",
            letterSpacing: -1,
            ...Platform.select({
              android: { includeFontPadding: false },
              default: {},
            }),
          }}
          accessibilityLabel="Closer"
        >
          Closer
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
