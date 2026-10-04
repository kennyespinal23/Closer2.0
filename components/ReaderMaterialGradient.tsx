import { useId } from "react";
import { View, type ViewProps } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";

export function ReaderMaterialGradient({ colors, locations, horizontal=false, children, style, ...props }: ViewProps & { colors: string[]; locations?: number[]; horizontal?: boolean }) {
  const id = useId().replace(/:/g, "");
  return <View {...props} style={[style, { overflow: "hidden" }]}><Svg pointerEvents="none" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}><Defs><LinearGradient id={id} x1="0%" y1="0%" x2={horizontal?"100%":"0%"} y2={horizontal?"75%":"100%"}>{colors.map((color, i) => <Stop key={i} offset={`${(locations?.[i] ?? i / Math.max(1, colors.length - 1)) * 100}%`} stopColor={/^#[0-9a-f]{8}$/i.test(color)?color.slice(0,7):color} stopOpacity={/^#[0-9a-f]{8}$/i.test(color)?parseInt(color.slice(7),16)/255:1} />)}</LinearGradient></Defs><Rect width="100%" height="100%" fill={`url(#${id})`} /></Svg>{children}</View>;
}
