import { View } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";
import { useColors } from "@/state/theme";

type BrandMarkProps = {
  size?: number;
};

/**
 * Closer brand mark — an open book paired with a soft sunrise halo.
 * Reads as "scripture + light" without being literal or kitschy.
 */
export function BrandMark({ size = 56 }: BrandMarkProps) {
  const colors = useColors();
  return (
    <View
      style={{
        width: size,
        height: size,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
        <Circle cx="32" cy="26" r="22" fill={colors.accentSoft} opacity={0.55} />
        <Path
          d="M10 38c6-3 12-3 22 1 10-4 16-4 22-1v10c-6-2-12-2-22 1-10-3-16-3-22-1V38z"
          fill={colors.primary}
        />
        <Path
          d="M32 39V21"
          stroke={colors.accent}
          strokeWidth={2}
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}
