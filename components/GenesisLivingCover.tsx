import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import { getBookCover } from "@/constants/bookCovers";
import { useAmbientMotionEnabled } from "@/lib/useAmbientMotionEnabled";

/** Genesis-only atmospheric prototype. All controls remain outside the moving art. */
export function GenesisLivingCover() {
  const enabled = useAmbientMotionEnabled();
  const phase = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(phase);
    phase.value = 0;
    if (enabled) {
      phase.value = withRepeat(withTiming(1, {
        duration: 10000,
        easing: Easing.inOut(Easing.sin),
      }), -1, true);
    }
    return () => cancelAnimation(phase);
  }, [enabled, phase]);
  const painting = useAnimatedStyle(() => ({
    transform: enabled ? [
      { scale: 1.06 + phase.value * 0.08 },
      { translateX: -6 + phase.value * 12 },
      { translateY: phase.value * -12 },
    ] : [],
  }));
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { bottom: undefined, height: "84%", overflow: "hidden" }]}>
      <Animated.View style={[StyleSheet.absoluteFill, painting]}>
        <Image source={getBookCover("genesis")} contentFit="cover" contentPosition="top center" transition={0} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}
