import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View, Platform } from "react-native";
import Svg, { Path } from "react-native-svg";
import { shouldPlayLaunchSplash, consumeLaunchSplash } from "@/lib/launchSplashSession";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * LaunchSplash — the first frame after the OS splash.
 *
 * Sits as an absolutely-positioned overlay on top of the app
 * shell during cold launch. The native iOS splash hands off to
 * this component on a true-black canvas with a white wordmark.
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
      // the end of the splash. The white surface is purely visual.
      pointerEvents="none"
      accessible={false}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#000000",
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
      <Animated.View
        style={{
          opacity: logoOpacity,
          flexDirection: "row",
          alignItems: "center",
          // 20pt gap between cross and wordmark, per spec.
          // Using `gap` (RN 0.71+) instead of marginRight on the
          // cross because flex `gap` aligns the spacing to the
          // visual baseline of the row even when children have
          // different baselines.
          gap: 20,
        }}
      >
        <CrossIcon />
        <Text
          // SF Pro Display — Apple's stock display font.
          // `Platform.select` falls back to a sensible system
          // string on Android, but the brief is iOS-only so the
          // primary path is the Apple system fontFamily.
          // Weight bold + size 52 sits at the top of the brief's
          // 52–56pt range so the wordmark reads as authoritative
          // without crowding the cross.
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
            // Keep the text vertically aligned with the cross by
            // including the descender padding RN inserts by
            // default — `includeFontPadding: false` on Android,
            // ignored on iOS.
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

/**
 * The cross glyph. Two stroked paths (vertical + horizontal)
 * rendered in white with rounded line caps, sized at 64pt
 * tall to match the brief.
 *
 * Why SVG (not an SF Symbol or PNG asset):
 *   • A custom mark — Apple's `cross` SF Symbol is decorative
 *     and not a literal Christian cross.
 *   • SVG strokes scale cleanly at any density and let us
 *     control the line-cap geometry (`round`) and thickness
 *     (~7pt) per the brief without ever rasterizing.
 *   • Zero asset pipeline — no PNG to ship, no @2x/@3x
 *     variants, no asset registry.
 *
 * Proportions follow Apple's mark-design rule of thumb for
 * cross-shaped iconography: the horizontal bar sits in the
 * upper third (Latin cross silhouette), with the vertical
 * stem extending below to give the mark a weighted base.
 */
function CrossIcon() {
  // 64pt visual height, ~7pt stroke. Width is narrower than
  // the height because a Latin cross is taller than wide; the
  // viewBox is sized so the artwork bleeds to the edges with
  // a half-stroke of padding to avoid clipping on round caps.
  const HEIGHT = 64;
  const WIDTH = 44;
  return (
    <Svg width={WIDTH} height={HEIGHT} viewBox="0 0 44 64" fill="none">
      {/* Vertical stem — runs the full 64pt height of the mark,
          centered horizontally in the 44pt viewport. */}
      <Path
        d="M22 4 L22 60"
        stroke="#FFFFFF"
        strokeWidth={7}
        strokeLinecap="round"
      />
      {/* Crossbar — sits in the upper third of the stem (Latin
          cross proportions: bar at roughly 22/64 from the top
          instead of dead-center). Width of the bar is the full
          viewport width minus half-stroke each side so the
          rounded caps land flush against the bounding box. */}
      <Path
        d="M4 22 L40 22"
        stroke="#FFFFFF"
        strokeWidth={7}
        strokeLinecap="round"
      />
    </Svg>
  );
}
