import { useId } from "react";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useResolvedScheme } from "@/state/theme";

const DAY_SKY = require("../assets/backdrops/sky.jpg");
export const SKY_TOP_DAY = "#264C78";
export const SKY_TOP_NIGHT = "#000000";
/** @deprecated Use `useSkyTop()` — light-mode top only. */
export const HOME_SKY_TOP = SKY_TOP_DAY;

/** Chrome sits over the darker upper sky, keeping white labels legible. */
export const SKY_CHROME_INK = "#FFFFFF";
export const SKY_CHROME_INK_MUTED = "rgba(255, 255, 255, 0.82)";

export function useSkyTop(): string {
  return useResolvedScheme() === "dark" ? SKY_TOP_NIGHT : SKY_TOP_DAY;
}

/** Static daylight sky with a cloud horizon; true black at night. */
export function SkyGradient() {
  const washId = `sky-wash-${useId().replace(/:/g, "")}`;
  const dark = useResolvedScheme() === "dark";
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { backgroundColor: dark ? SKY_TOP_NIGHT : SKY_TOP_DAY }]}>
      {!dark && <Image source={DAY_SKY} contentFit="cover" contentPosition="center"
        transition={0} style={StyleSheet.absoluteFill} />}
      {!dark && <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs><LinearGradient id={washId} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#F5FAFF" stopOpacity="0" />
          <Stop offset="0.12" stopColor="#F5FAFF" stopOpacity="0.18" />
          <Stop offset="0.24" stopColor="#F5FAFF" stopOpacity="0.76" />
          <Stop offset="0.62" stopColor="#F5FAFF" stopOpacity="0.62" />
          <Stop offset="1" stopColor="#FFF9EF" stopOpacity="0.48" />
        </LinearGradient></Defs>
        <Rect width="100%" height="100%" fill={`url(#${washId})`} />
      </Svg>}
    </View>
  );
}

export const HomeSkyGradient = SkyGradient;
