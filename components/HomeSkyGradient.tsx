import { useId } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useResolvedScheme } from "@/state/theme";

const DAY_STOPS = [
  { offset: "0", color: "#0B7CDA" },
  { offset: "0.33", color: "#2592E4" },
  { offset: "0.66", color: "#6EB6F0" },
  { offset: "1", color: "#B4DCFF" },
] as const;

/** Night sky — same vertical read as day, shifted into navy. */
const NIGHT_STOPS = [
  { offset: "0", color: "#071433" },
  { offset: "0.32", color: "#0C2560" },
  { offset: "0.68", color: "#163A82" },
  { offset: "1", color: "#1E4A9C" },
] as const;

export const SKY_TOP_DAY = DAY_STOPS[0].color;
export const SKY_TOP_NIGHT = NIGHT_STOPS[0].color;
/** @deprecated Use `useSkyTop()` — light-mode top only. */
export const HOME_SKY_TOP = SKY_TOP_DAY;

/** Chrome that sits directly on the sky (titles, nav glyphs). */
export const SKY_CHROME_INK = "#FFFFFF";
export const SKY_CHROME_INK_MUTED = "rgba(255, 255, 255, 0.82)";

export function useSkyTop(): string {
  return useResolvedScheme() === "dark" ? SKY_TOP_NIGHT : SKY_TOP_DAY;
}

/**
 * Full-bleed vertical sky. Light mode is the daytime azure from
 * the Brands-page reference; dark mode is a deeper night sky.
 */
export function SkyGradient() {
  const scheme = useResolvedScheme();
  const uid = useId().replace(/:/g, "");
  const stops = scheme === "dark" ? NIGHT_STOPS : DAY_STOPS;
  const gradId = `closerSky-${scheme}-${uid}`;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
        <Defs>
          <LinearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            {stops.map((stop) => (
              <Stop
                key={stop.offset}
                offset={stop.offset}
                stopColor={stop.color}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="10" height="10" fill={`url(#${gradId})`} />
      </Svg>
    </View>
  );
}

export const HomeSkyGradient = SkyGradient;
