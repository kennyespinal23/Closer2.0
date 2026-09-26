import { APP_CANVAS } from "./HomeSkyGradient";
import { useEffect } from "react";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useLibraryLight } from "./LibraryEnvironment";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
export function LibraryAtmosphere() {
  const { dark } = useLibraryLight(), reduced = useReducedMotion();
  const night = useSharedValue(dark ? 1 : 0);
  useEffect(() => { night.value = withTiming(dark ? 1 : 0, { duration: reduced ? 0 : 650 }); }, [dark, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: night.value }));
  return <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}><ReaderMaterialGradient colors={[...APP_CANVAS.light]} style={{ position: "absolute", inset: 0 }} /><Animated.View style={[{ position: "absolute", inset: 0 }, style]}><ReaderMaterialGradient colors={[...APP_CANVAS.dark]} style={{ position: "absolute", inset: 0 }} /><Svg width="100%" height="60%"><Defs><RadialGradient id="libraryLampGlow" cx="82%" cy="0%" rx="80%" ry="65%"><Stop offset="0" stopColor="#FFBA64" stopOpacity=".17" /><Stop offset="1" stopColor="#FFBA64" stopOpacity="0" /></RadialGradient></Defs><Rect width="100%" height="100%" fill="url(#libraryLampGlow)" /></Svg></Animated.View></View>;
}
