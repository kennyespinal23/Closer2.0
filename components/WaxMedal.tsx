import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";
import { useIsFocused } from "@react-navigation/native";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useEffect, useId } from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Rect, RadialGradient, Stop } from "react-native-svg";
import { SFSymbol, type SFSymbolName } from "./Symbol";
const SYMBOLS: SFSymbolName[] = ["envelope", "sun.max", "moon", "star", "book", "heart", "sparkles", "leaf", "flame", "crown"];
/** Wax seal and brass stand from the HTML reference; vector art stays sharp at every size. */
export function WaxMedal({ size = 72, icon, index = 0, earned = true }: { size?: number; icon?: SFSymbolName; index?: number; earned?: boolean }) {
  const id = useId().replace(/:/g, "");
  const reduced = useReducedMotion(), focused = useIsFocused(), shine = useSharedValue(-1);
  useEffect(() => { if (earned && focused && !reduced) { shine.value = -1; shine.value = withRepeat(withDelay(2800, withTiming(1, {duration: 1000})), -1, false); } else { cancelAnimation(shine); shine.value = -1; } return () => cancelAnimation(shine); }, [earned, focused, reduced]);
  const sheen = useAnimatedStyle(() => ({ transform: [{ translateX: shine.value * size * 1.5 }, { rotate: "-20deg" }] }));
  return <View accessible={false} style={{ width: size, height: size * 1.12, alignItems: "center" }}>
    <View style={{ width: size, height: size, borderRadius: size / 2, boxShadow: earned ? "0 6px 12px #A0321438" : "0 3px 6px #00000015" }}>
      <Svg width={size} height={size} viewBox="0 0 100 100"><Defs><RadialGradient id={id} cx="35%" cy="28%" r="78%"><Stop offset="0" stopColor={earned ? "#FFA07F" : "#E5D6C0"} /><Stop offset=".45" stopColor={earned ? "#FF5A36" : "#DDCBB1"} /><Stop offset=".75" stopColor={earned ? "#C9431F" : "#C9B599"} /><Stop offset="1" stopColor={earned ? "#9E2F14" : "#AC977D"} /></RadialGradient></Defs><Circle cx="50" cy="50" r="49" fill={`url(#${id})`} /><Circle cx="50" cy="50" r="46" fill="none" stroke="#FFFFFF28" strokeWidth="5" /><Circle cx="50" cy="50" r="38" fill="none" stroke="#5A14064D" strokeWidth="1.5" strokeDasharray="3 3" /></Svg>
      <View style={{ position: "absolute", inset: 0, justifyContent: "center", alignItems: "center", opacity: earned ? .75 : .4 }}><SFSymbol name={icon ?? SYMBOLS[index % SYMBOLS.length]} size={size * .43} color={earned ? "#5A200E" : "#786957"} /></View>
      {earned && <View pointerEvents="none" style={{ position: "absolute", inset: 0, borderRadius: size / 2, overflow: "hidden" }}><Animated.View style={[{ width: size, height: size }, sheen]}><Svg width={size} height={size}><Defs><LinearGradient id={`${id}shine`} x1="0" y1="0" x2="1" y2="0"><Stop offset=".3" stopColor="#FFFFFF" stopOpacity={0}/><Stop offset=".5" stopColor="#FFFFFF" stopOpacity={.38}/><Stop offset=".7" stopColor="#FFFFFF" stopOpacity={0}/></LinearGradient></Defs><Rect width={size} height={size} fill={`url(#${id}shine)`}/></Svg></Animated.View></View>}
      {!earned && <View style={{ position: "absolute", top: -2, right: -2, width: size * .28, height: size * .28, borderRadius: size, backgroundColor: "#2A1F18", alignItems: "center", justifyContent: "center" }}><SFSymbol name="lock.fill" size={size * .15} color="#FBF1E4" /></View>}
    </View><View style={{ width: size * .48, height: size * .12, marginTop: -2, borderTopLeftRadius: 3, borderTopRightRadius: 3, backgroundColor: earned ? "#B68A42" : "#A38C6B", borderTopWidth: 2, borderColor: earned ? "#E6BD73" : "#C6B395" }} />
  </View>;
}
