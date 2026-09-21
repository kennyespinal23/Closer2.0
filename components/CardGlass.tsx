import { useEffect, useState } from "react";
import { AccessibilityInfo, Platform, StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

/** Shared dark frosted material for text-heavy floating cards. */
export function CardGlass({ tint = "#FFFFFF" }: { tint?: string }) {
  const [opaque, setOpaque] = useState(Platform.OS !== "ios");
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    let active = true;
    void AccessibilityInfo.isReduceTransparencyEnabled().then((value) => { if (active) setOpaque(value); });
    const subscription = AccessibilityInfo.addEventListener("reduceTransparencyChanged", setOpaque);
    return () => { active = false; subscription.remove(); };
  }, []);
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}>
    {opaque ? <View style={[StyleSheet.absoluteFill, { backgroundColor: "#242426" }]} /> : <>
      <BlurView tint="dark" intensity={55} style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(12,14,18,0.25)" }]} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: tint, opacity: 0.08 }]} />
    </>}
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs><LinearGradient id="glassSheen" x1="0" y1="0" x2="1" y2="1"><Stop offset="0" stopColor="white" stopOpacity={0.14} /><Stop offset="0.4" stopColor="white" stopOpacity={0.02} /><Stop offset="1" stopColor="white" stopOpacity={0.05} /></LinearGradient></Defs>
      <Rect width="100%" height="100%" fill="url(#glassSheen)" />
    </Svg>
  </View>;
}
