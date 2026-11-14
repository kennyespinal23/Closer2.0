import { useEffect, useState } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import Animated, { Easing, FadeIn, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Page } from "@/components/page/Page";
import { nunito } from "@/components/closer/kit";
import { shouldPlayLaunchSplash, consumeLaunchSplash } from "@/lib/launchSplashSession";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** Matches the cream field in `assets/splash-page.png`. */
const SPLASH_CREAM = "#FFF7EB";

/**
 * LaunchSplash: the first frame after the OS splash.
 *
 * The native splash (assets/splash-page.png, rendered from the closer-page prototype's Splash at 428×926pt) is Page
 * over the Closer wordmark on cream. This overlay opens on that same frame, laid out at the same scale the OS used
 * ("cover"), so the handoff is invisible; then Page comes alive (a hop, a happy face, a light haptic), the line fades
 * in, and the whole thing fades into the app.
 */
export function LaunchSplash() {
  const reducedMotion = useReducedMotion();
  const playSplash = shouldPlayLaunchSplash();
  const { width, height } = useWindowDimensions();
  // the native image is 428×926pt drawn with "cover": everything in it is scaled by k
  const k = Math.max(width / 428, height / 926);

  const [mounted, setMounted] = useState(playSplash);
  const [act, setAct] = useState<"idle" | "hop">("idle");
  const [mood, setMood] = useState<"neutral" | "excited" | "happy">("neutral");
  const [line, setLine] = useState(false);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));

  useEffect(() => {
    if (!playSplash) return;
    consumeLaunchSplash();
    const timers = [
      setTimeout(() => { setAct("hop"); setMood("excited"); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }, reducedMotion ? 0 : 250),
      setTimeout(() => { setMood("happy"); setLine(true); }, reducedMotion ? 0 : 850),
      setTimeout(() => {
        opacity.value = withTiming(0, { duration: reducedMotion ? 150 : 450, easing: Easing.inOut(Easing.cubic) });
        if (!reducedMotion) scale.value = withTiming(1.04, { duration: 450 });
      }, reducedMotion ? 600 : 1900),
      setTimeout(() => setMounted(false), reducedMotion ? 800 : 2400),
    ];
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playSplash, reducedMotion]);

  if (!playSplash || !mounted) return null;

  return (
    <Animated.View
      pointerEvents="none"
      accessible
      accessibilityLabel="Closer"
      style={[{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: SPLASH_CREAM, alignItems: "center", justifyContent: "center", zIndex: 9999, elevation: 9999 }, fade]}
    >
      <View style={{ alignItems: "center", marginTop: -40 * k }}>
        <Page size={156 * k} mood={mood} act={act} actKey={act} />
        <Text style={nunito(900, 52 * k, { color: "#17251F", letterSpacing: -2 * k, marginTop: 20 * k, lineHeight: 56 * k })}>Closer</Text>
        <View style={{ height: 40 * k, justifyContent: "center" }}>
          {line && (
            <Animated.Text entering={reducedMotion ? undefined : FadeIn.duration(500)} style={nunito(700, 16 * k, { color: "#4E5B54", fontStyle: "italic" })}>
              The Lord is always closer than you think.
            </Animated.Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
