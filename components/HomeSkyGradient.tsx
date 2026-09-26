import { useId } from "react";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";
import { StyleSheet, View } from "react-native";
import { useResolvedScheme } from "@/state/theme";

/** Shared atmospheric canvas, derived from the library's day/evening palette. */
export const APP_CANVAS = {
  light: ["#FBF3EC", "#F1E1D2", "#EBD7C1"],
  dark: ["#3A2B2A", "#221819", "#221819"],
} as const;
export const SKY_TOP_DAY = APP_CANVAS.light[0];
export const SKY_TOP_NIGHT = APP_CANVAS.dark[0];
export const HOME_SKY_TOP = SKY_TOP_DAY;
// Legacy exports for image-backed chrome. Plain canvas chrome uses theme ink.
export const SKY_CHROME_INK = "#FFFFFF";
export const SKY_CHROME_INK_MUTED = "rgba(255, 255, 255, 0.82)";
export function useSkyTop(): string {
  return APP_CANVAS[useResolvedScheme()][0];
}
export function SkyGradient() {
  const id = useId().replace(/:/g, "");
  const scheme = useResolvedScheme();
  const stops = APP_CANVAS[scheme];
  return <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[StyleSheet.absoluteFill, { backgroundColor: stops[0] }]}>
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
      <Defs>
        <LinearGradient id={`${id}canvas`} x1="0" y1="0" x2="0" y2="1">{stops.map((color, i) => <Stop key={i} offset={i / 2} stopColor={color} />)}</LinearGradient>
        <RadialGradient id={`${id}glow`} cx="82%" cy="0%" rx="80%" ry="39%"><Stop offset="0" stopColor="#FFBA64" stopOpacity={scheme === "dark" ? .17 : 0} /><Stop offset="1" stopColor="#FFBA64" stopOpacity="0" /></RadialGradient>
      </Defs>
      <Rect width="100%" height="100%" fill={`url(#${id}canvas)`} /><Rect width="100%" height="100%" fill={`url(#${id}glow)`} />
    </Svg>
  </View>;
}
export const HomeSkyGradient = SkyGradient;
