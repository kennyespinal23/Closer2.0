import { useEffect, type ReactNode } from "react";
import { StyleSheet, Text, View, useWindowDimensions, type ViewStyle } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useResolvedScheme } from "@/state/theme";
import { SFSymbol } from "./Symbol";

const SPRING = { damping: 17, stiffness: 145, mass: .8 };
/** Each paper object has its own entrance and departure; text stays outside the artwork. */
function Paper({ children, index = 0, rotation = 0, exiting, style }: { children: ReactNode; index?: number; rotation?: number; exiting: boolean; style: ViewStyle }) {
  const reduced = useReducedMotion(), p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    p.value = reduced ? 1 : exiting ? withTiming(0, { duration: 220 }) : withDelay(index * 90, withSpring(1, SPRING));
    return () => cancelAnimation(p);
  }, [exiting, reduced, index]);
  const motion = useAnimatedStyle(() => ({ opacity: Math.min(1, p.value), transform: [{ translateX: reduced ? 0 : (1-p.value) * (index % 2 ? 30 : -25) }, { translateY: reduced ? 0 : (1-p.value) * (exiting ? -32 : 40) }, { rotate: `${rotation + (reduced ? 0 : (1-p.value) * (index % 2 ? 12 : -12))}deg` }, { scale: reduced ? 1 : .82 + .18*p.value }] }));
  return <Animated.View shouldRasterizeIOS renderToHardwareTextureAndroid style={[{ position: "absolute" }, style, motion]}>{children}</Animated.View>;
}
function Stage({ children, label }: { children: ReactNode; label: string }) {
  const { width } = useWindowDimensions(), scale = Math.min(1.12, (width - 56) / 340);
  return <View accessible accessibilityLabel={label} style={{ height: 340 * scale, alignItems: "center" }}><View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ width: 340, height: 340, transform: [{ scale }], transformOrigin: "top center" }}>{children}</View></View>;
}
export function OnboardingCommunityScene({ exiting, scene = 0 }: { exiting: boolean; scene?: number }) {
  const dark = useResolvedScheme() === "dark", ink = dark ? "#FBEFDC" : "#35291F";
  const paper = dark ? "#45382B" : "#FFFAF0", muted = dark ? "#D0BFAB" : "#796957";
  if (scene === 1) return <Stage label="A verse from Galatians and a handwritten note of encouragement.">
    <Paper exiting={exiting} style={{ left: 49, top: 39, width: 245, height: 245, borderRadius: 120, backgroundColor: dark ? "#8F6939" : "#E9B962" }}><View/></Paper>
    <Paper exiting={exiting} index={1} rotation={-6} style={{ ...s.shadow, left: 30, top: 48, width: 260, minHeight: 202, padding: 25, backgroundColor: paper, borderRadius: 13 }}>
      <Text maxFontSizeMultiplier={1.15} style={{ color: muted, fontSize: 12, marginBottom: 16 }}>Galatians 6:2</Text><Text maxFontSizeMultiplier={1.15} style={{ color: ink, fontSize: 25, lineHeight: 33, fontWeight: "600" }}>“Bear ye one another’s burdens.”</Text>
    </Paper>
    <Paper exiting={exiting} index={2} rotation={5} style={{ ...s.shadow, left: 108, top: 235, width: 215, padding: 18, borderRadius: 13, backgroundColor: "#DAE5D1" }}><Text maxFontSizeMultiplier={1.15} style={{ color: "#35503C", fontSize: 14, lineHeight: 21 }}>Thinking of you today.</Text><Text maxFontSizeMultiplier={1.15} style={{ color: "#35503C", fontSize: 14, lineHeight: 21, fontWeight: "600" }}>You don’t have to do this alone.</Text></Paper>
  </Stage>;
  if (scene === 2) return <Stage label="A Genesis study group and a note: Your questions belong here, too.">
    <Paper exiting={exiting} style={{ left: 49, top: 39, width: 245, height: 245, borderRadius: 120, backgroundColor: dark ? "#8F6939" : "#E9B962" }}><View/></Paper>
    <Paper exiting={exiting} index={1} rotation={5} style={{ ...s.shadow, left: 63, top: 30, width: 240, backgroundColor: paper, borderRadius: 13, overflow: "hidden" }}>
      <View style={{ height: 133, backgroundColor: "#7F9E82", alignItems: "center", justifyContent: "center" }}><Svg width="100%" height="100%" viewBox="0 0 240 132"><Circle cx="195" cy="23" r="40" fill="#B9CB9A"/><Path d="M0 109Q70 64 134 110t106-4v26H0" fill="#55745D"/><G transform="translate(66 26) rotate(-7 55 40)"><Path d="M0 10Q28-1 55 13Q85-1 111 10v72q-28-11-56 3Q27 71 0 82Z" fill="#F4E4BD" stroke="#3D5541" strokeWidth="3"/><Path d="M55 13v72M12 28l31 2m-31 11 31 2m-31 11 31 2m24-24 30-6m-30 20 30-6m-30 20 30-6" fill="none" stroke="#AA966D" strokeWidth="2"/></G></Svg></View>
      <View style={{ padding: 20, gap: 10 }}><Text maxFontSizeMultiplier={1.15} style={{ color: ink, fontSize: 20, fontWeight: "600" }}>A fresh beginning</Text><Text maxFontSizeMultiplier={1.15} style={{ color: muted, fontSize: 13 }}>A small group exploring Genesis.</Text><Text maxFontSizeMultiplier={1.15} style={{ color: dark ? "#C4D7AA" : "#365738", fontSize: 12, fontWeight: "600" }}>Read · Reflect · Together</Text></View>
    </Paper>
    <Paper exiting={exiting} index={2} rotation={-9} style={{ ...s.shadow, left: 4, top: 106, width: 163, padding: 16, backgroundColor: "#EDD5B5", borderRadius: 8 }}><Text maxFontSizeMultiplier={1.15} style={{ color: "#51402E", fontSize: 14, lineHeight: 20, fontWeight: "600" }}>Your questions belong here, too.</Text></Paper>
  </Stage>;
  return <Stage label="A collage of friends, a prayer note, and a place to belong.">
    <Paper exiting={exiting} style={{ left: 49, top: 39, width: 245, height: 245, borderRadius: 120, backgroundColor: dark ? "#8F6939" : "#E9B962" }}><View /></Paper>
    <Paper exiting={exiting} index={1} rotation={-9} style={{ ...s.shadow, left: 13, top: 38, width: 168, height: 196, padding: 9, paddingBottom: 26, backgroundColor: "#FFF9E9", borderRadius: 4 }}>
      <Svg width="100%" height="100%" viewBox="0 0 160 165"><Rect width="160" height="165" fill="#AABFA4"/><Circle cx="129" cy="31" r="21" fill="#F5D788"/><Path d="M0 103Q47 60 88 113T160 97V165H0" fill="#739579"/><Path d="M13 165v-35q0-30 28-30t28 30v35" fill="#CC7756"/><Path d="M86 165v-31q0-30 27-30t29 30v31" fill="#EAD6A8"/><Ellipse cx="41" cy="79" rx="19" ry="23" fill="#E1A775"/><Path d="M22 79q-4-32 18-29t22 29q-12-4-18-16-5 12-22 16" fill="#44372B"/><Ellipse cx="114" cy="83" rx="19" ry="23" fill="#AB7354"/><Path d="M95 79q-3-30 19-27t20 27q-19-20-39 0" fill="#352E26"/><Path d="M34 84q7 8 14 0m60 4q7 8 14 0" fill="none" stroke="#68462F" strokeWidth="2" strokeLinecap="round"/></Svg>
      <View style={{ position: "absolute", top: -10, left: 54, width: 63, height: 23, backgroundColor: "#E9D69DAA", transform: [{ rotate: "6deg" }] }}/>
    </Paper>
    <Paper exiting={exiting} index={2} rotation={7} style={{ ...s.shadow, left: 173, top: 117, width: 156, minHeight: 154, padding: 16, backgroundColor: "#E7EDCE", borderRadius: 4 }}>
      <Text maxFontSizeMultiplier={1.2} style={{ fontSize: 11, color: "#51614C", marginBottom: 12 }}>A little prayer</Text><Text maxFontSizeMultiplier={1.2} style={{ fontSize: 16, lineHeight: 22, fontWeight: "600", color: "#334333" }}>For courage to begin again.</Text><Text maxFontSizeMultiplier={1.2} style={{ fontSize: 11, color: "#51614C", marginTop: 12 }}>You’re not alone.</Text>
    </Paper>
    <Paper exiting={exiting} index={3} rotation={-4} style={{ ...s.shadow, left: 35, top: 247, width: 223, padding: 16, backgroundColor: dark ? "#45382B" : "#FFFAF0", borderRadius: 13, borderCurve: "continuous", flexDirection: "row", alignItems: "center", gap: 12 }}>
      <SFSymbol name="person.2.fill" size={26} color={dark ? "#C4D7AA" : "#52744E"}/><View style={{ flex: 1 }}><Text maxFontSizeMultiplier={1.2} style={{ fontSize: 14, fontWeight: "600", color: ink }}>A place to belong</Text><Text maxFontSizeMultiplier={1.2} style={{ fontSize: 11, color: dark ? "#D0BFAB" : "#796957", marginTop: 4 }}>One small step together</Text></View>
    </Paper>
    <Paper exiting={exiting} index={4} rotation={12} style={{ ...s.shadow, left: 275, top: 44, width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: "#FFEFD0", backgroundColor: "#C77E5B", alignItems: "center", justifyContent: "center" }}><SFSymbol name="heart" size={23} color="#FFF1D6"/></Paper>
  </Stage>;
}
const s = StyleSheet.create({ shadow: { boxShadow: "0 12px 20px #48302025, 0 1px 2px #4434251A" } });
