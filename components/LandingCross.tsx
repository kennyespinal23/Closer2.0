import { View } from "react-native";
import Svg, { Rect } from "react-native-svg";

/**
 * Minimal white cross — transparent background, rounded bar caps.
 * Matches the landing reference (Latin cross, arms at ~⅓ height).
 */
export type LandingCrossProps = {
  /** Total height of the cross in pt. */
  height: number;
};

const VIEW = 100;
const BAR = 13.5;
const CROSS_Y = 36;
const ARM_HALF = 27;
const V_TOP = 7;
const V_BOTTOM = 93;

export function LandingCross({ height }: LandingCrossProps) {
  const width = height * 0.58;

  return (
    <View
      style={{ width, height, alignItems: "center", justifyContent: "center" }}
      accessibilityRole="image"
      accessibilityLabel="Closer"
    >
      <Svg width={width} height={height} viewBox={`0 0 ${VIEW} ${VIEW}`}>
        <Rect
          x={VIEW / 2 - BAR / 2}
          y={V_TOP}
          width={BAR}
          height={V_BOTTOM - V_TOP}
          rx={BAR / 2}
          fill="#FFFFFF"
        />
        <Rect
          x={VIEW / 2 - ARM_HALF}
          y={CROSS_Y - BAR / 2}
          width={ARM_HALF * 2}
          height={BAR}
          rx={BAR / 2}
          fill="#FFFFFF"
        />
      </Svg>
    </View>
  );
}
