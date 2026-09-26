import { useId } from "react";
import { View, type ViewProps } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

export function ReaderMaterialGradient({ colors, children, style, ...props }: ViewProps & { colors: string[] }) {
  const id = useId().replace(/:/g, "");
  return <View {...props} style={[style, { overflow: "hidden" }]}><Svg pointerEvents="none" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}><Defs><LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">{colors.map((color, i) => <Stop key={i} offset={i / (colors.length - 1)} stopColor={color} />)}</LinearGradient></Defs><Rect width="100%" height="100%" fill={`url(#${id})`} /></Svg>{children}</View>;
}
