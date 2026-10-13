import { View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";

/**
 * A small closed Bible, tipped back like it was just set down: cream pages,
 * a cover in `color`, a darker spine and a gold cross. Used in the reading
 * pill on Home and as the book marker on Highlights.
 */
export function TiltedBook({ color = "#5A3324", size = 18, tilt = -14 }: { color?: string; size?: number; tilt?: number }) {
  return <View accessible={false} style={{ transform: [{ rotate: `${tilt}deg` }] }}>
    <Svg width={size} height={size * 22 / 18} viewBox="0 0 18 22">
      <Rect x={3} y={1.5} width={14} height={19} rx={2} fill="#F4E6D3"/>
      <Path d="M5 4.5h11M5 7.5h11M5 10.5h11M5 13.5h11M5 16.5h11" stroke="#E2CDB2" strokeWidth={.8}/>
      <Rect x={1} y={0.5} width={14} height={19} rx={2.2} fill={color}/>
      <Rect x={1} y={0.5} width={3.2} height={19} rx={1.4} fill="#000000" opacity={.28}/>
      <Path d="M9.6 5v8.4M7.2 7.6h4.8" stroke="#FFC93C" strokeWidth={1.6} strokeLinecap="round"/>
    </Svg>
  </View>;
}

/** Each book keeps one warm cover colour, so the same book always looks the same. */
const COVERS = ["#2D5238", "#8E4A22", "#5B3A4E", "#9E2410", "#4A2C20", "#6B5A1E", "#A0522D"];
export function bookCoverColor(order: number): string {
  return COVERS[(Math.max(1, order) - 1) % COVERS.length];
}
