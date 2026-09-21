import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable, isGlassEffectAPIAvailable } from "expo-glass-effect";

/** Native Liquid Glass with frosted/opaque fallbacks for older OS and accessibility. */
export function CardGlass({ tint = "#20242C" }: { tint?: string }) {
  const [opaque, setOpaque] = useState(Platform.OS !== "ios");
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((value) => { if (active) setOpaque(value); });
    const subscription = AccessibilityInfo.addEventListener("reduceTransparencyChanged", setOpaque);
    return () => { active = false; subscription.remove(); };
  }, []);
  const nativeGlass = Platform.OS === "ios" && !opaque && isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {opaque ? <View style={[StyleSheet.absoluteFill, { backgroundColor: "#242426" }]} /> : nativeGlass ? <GlassView colorScheme="dark" glassEffectStyle="regular" tintColor={`${tint}66`} style={[StyleSheet.absoluteFill, { borderRadius: 30 }]} /> : <>
      <BlurView tint="dark" intensity={55} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(12,14,18,0.25)" }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint, opacity: 0.08 }]} />
    </>}

  </View>;
}
