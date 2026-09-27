import { useEffect, useId } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { cancelAnimation, Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming, type SharedValue } from "react-native-reanimated";
import Svg, { Circle, Defs, G, LinearGradient, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { useTheme } from "@/state/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useAmbientMotionEnabled } from "@/lib/useAmbientMotionEnabled";
import { paperActionColors } from "@/lib/paperControls";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { SFSymbol, type SFSymbolName } from "./Symbol";
import * as haptics from "@/lib/haptics";

const EDGE = Array.from({ length: 144 }, (_, i) => {
  const a = i / 144 * Math.PI * 2, r = 101 + Math.sin(a * 12) * 2.8 + Math.sin(a * 7) * 1.3;
  return `${i ? "L" : "M"}${110 + Math.cos(a) * r},${110 + Math.sin(a) * r}`;
}).join(" ") + "Z";

/** The same physical wax medal in the collection and the immersive reveal. */
export function AchievementMedal({ size = 205, icon = "envelope", earned = true }: { size?: number; icon?: SFSymbolName; earned?: boolean }) {
  const id = useId().replace(/:/g, "");
  return <View accessible={false} style={{ width: size, height: size * 1.2 }}>
    <Svg width={size} height={size * 1.2} viewBox="0 0 220 264" style={{ position: "absolute" }}>
      <Defs><LinearGradient id={`${id}r`} x1="0%" y1="0%" x2="100%" y2="0%"><Stop offset="0" stopColor="#184B3E"/><Stop offset=".2" stopColor="#5D9982"/><Stop offset=".65" stopColor="#36735B"/><Stop offset="1" stopColor="#1E503F"/></LinearGradient></Defs>
      <Path d="M64 149 L109 157 L92 257 L71 237 L46 245 Z M111 157 L156 149 L174 245 L149 237 L128 257 Z" fill={earned ? `url(#${id}r)` : "#8D887B"}/>
    </Svg>
    <View style={{ width: size, height: size, shadowColor: "#71311D", shadowOpacity: .22, shadowRadius: 12, shadowOffset: { width: 0, height: 16 } }}>
      <Svg width={size} height={size} viewBox="0 0 220 220"><Defs>
        <RadialGradient id={`${id}w`} cx="30%" cy="20%" r="90%"><Stop offset="0" stopColor={earned ? "#FFA783" : "#E4D9C7"}/><Stop offset=".42" stopColor={earned ? "#D96F4E" : "#B9AA94"}/><Stop offset=".8" stopColor={earned ? "#A3452D" : "#8D7D67"}/><Stop offset="1" stopColor={earned ? "#703020" : "#655846"}/></RadialGradient>
        <LinearGradient id={`${id}rim`} x1="0%" y1="0%" x2="70%" y2="100%"><Stop offset="0" stopColor="#FFD0A7"/><Stop offset=".35" stopColor="#E18B64"/><Stop offset=".75" stopColor="#8B3E29"/><Stop offset="1" stopColor="#D38458"/></LinearGradient>
        <RadialGradient id={`${id}in`} cx="40%" cy="30%" r="80%"><Stop offset="0" stopColor={earned ? "#DD805B" : "#C4B6A0"}/><Stop offset="1" stopColor={earned ? "#AC4D32" : "#897861"}/></RadialGradient>
        <LinearGradient id={`${id}icon`} x1="0%" y1="0%" x2="0%" y2="100%"><Stop offset="0" stopColor="#FFDFB9"/><Stop offset="1" stopColor="#EDB47F"/></LinearGradient>
      </Defs><Path d={EDGE} transform="translate(0 4)" fill="#6C2D1F66"/><Path d={EDGE} fill={`url(#${id}w)`} stroke="#AB5335" strokeWidth="1"/><Circle cx="110" cy="110" r="88" fill="none" stroke={earned ? `url(#${id}rim)` : "#B4A28A"} strokeWidth="10"/><Circle cx="110" cy="111" r="78" fill={`url(#${id}in)`} stroke="#813C2855" strokeWidth="2"/><Circle cx="110" cy="110" r="70" fill="none" stroke="#FFD2A966" strokeDasharray="2 6" strokeWidth="1.5"/>
      {earned && icon === "envelope" && <>{[true, false].map(shadow => <G key={String(shadow)} transform={shadow ? "translate(0 3)" : undefined} fill="none" stroke={shadow ? "#713523" : `url(#${id}icon)`} strokeWidth={shadow ? 5 : 4} strokeLinecap="round" strokeLinejoin="round"><Rect x="73" y="85" width="74" height="51" rx="7"/><Path d="M76 89l34 25 34-25M76 132l23-19m22 0 23 19"/></G>)}</>}
      </Svg>
      {(!earned || icon !== "envelope") && <><View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", transform: [{ translateY: 3 }] }]}><SFSymbol name={earned ? icon : "lock"} size={size * .35} color="#713523" weight="medium"/></View>
      <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}><SFSymbol name={earned ? icon : "lock"} size={size * .35} color="#FFDCB1" weight="medium"/></View></>}
    </View>
  </View>;
}

function Confetti({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const angle = index * 2.39996, reach = 80 + (index * 37 % 90);
  const style = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0, .08, .65, 1], [0, 1, 1, 0]), transform: [
    { translateX: Math.cos(angle) * reach * Math.min(1, progress.value * 4) },
    { translateY: Math.sin(angle) * reach * Math.min(1, progress.value * 4) + 245 * progress.value * progress.value },
    { rotate: `${progress.value * (index % 2 ? 420 : -360)}deg` },
  ] }));
  return <Animated.View style={[{ position: "absolute", left: "50%", top: "40%", width: 4 + index % 3, height: 7 + index % 5, borderRadius: 2, backgroundColor: ["#D57851", "#D9AF63", "#5C947E", "#F8E1BF"][index % 4] }, style]}/>;
}

export function AchievementReveal({ title, detail, icon = "envelope", newlyEarned = false, earned = true, onContinue }: { title: string; detail: string; icon?: SFSymbolName; newlyEarned?: boolean; earned?: boolean; onContinue: () => void }) {
  const { scheme } = useTheme(), dark = scheme === "dark", reduced = useReducedMotion(), inset = useSafeAreaInsets();
  const { width } = useWindowDimensions(), action = paperActionColors(dark);
  const ambient = useAmbientMotionEnabled();
  // Match the approved 376-point HTML canvas, including its top-anchored layout.
  const scale = Math.min(width / 376, 1.18);
  const badgeSize = 205 * scale;
  const medal = useSharedValue(reduced ? 1 : 0), words = useSharedValue(reduced ? 1 : 0), button = useSharedValue(reduced ? 1 : 0), burst = useSharedValue(0), shine = useSharedValue(-1);
  useEffect(() => {
    medal.value = words.value = button.value = reduced ? 1 : 0; burst.value = 0;
    if (!reduced) {
      medal.value = withSpring(1, { damping: newlyEarned ? 12 : 23, stiffness: newlyEarned ? 130 : 230 });
      words.value = withDelay(newlyEarned ? 650 : 120, withTiming(1, { duration: newlyEarned ? 450 : 250 }));
      button.value = withDelay(newlyEarned ? 1100 : 120, withTiming(1, { duration: 350 }));
      if (newlyEarned && earned) burst.value = withDelay(440, withTiming(1, { duration: 1850, easing: Easing.linear }));
    }
    const timer = newlyEarned && earned ? setTimeout(haptics.success, reduced ? 0 : 440) : undefined;
    return () => { clearTimeout(timer); [medal, words, button, burst].forEach(cancelAnimation); };
  }, [reduced, newlyEarned, earned, title]);
  useEffect(() => {
    cancelAnimation(shine);
    shine.value = -1;
    if (earned && ambient) {
      shine.value = withDelay(newlyEarned ? 1000 : 300, withRepeat(withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.quad) }),
        withDelay(2800, withTiming(-1, { duration: 0 })),
      ), -1, false));
    }
    return () => cancelAnimation(shine);
  }, [earned, ambient, newlyEarned, shine]);
  const art = useAnimatedStyle(() => ({ opacity: Math.min(1, medal.value * 3), transform: [{ translateY: (1-medal.value) * (newlyEarned ? 35 : 10) }, { scale: (newlyEarned ? .55 : .92) + medal.value * (newlyEarned ? .45 : .08) }, { rotate: `${newlyEarned ? -12 * (1-medal.value) : 0}deg` }] }));
  const textStyle = useAnimatedStyle(() => ({ opacity: words.value, transform: [{ translateY: 12 * (1-words.value) }] }));
  const buttonStyle = useAnimatedStyle(() => ({ opacity: button.value, transform: [{ translateY: 12 * (1-button.value) }] }));
  const sheen = useAnimatedStyle(() => ({ transform: [{ translateX: shine.value * badgeSize * 1.4 }, { rotate: "-24deg" }] }));
  return <ReaderMaterialGradient colors={dark ? ["#513429", "#2F2020", "#221819"] : ["#F2D6B7", "#FBF2E5", "#FFFAF2"]} locations={[0, .53, .82]} style={{ flex: 1 }}>
    <StatusBar style={dark ? "light" : "dark"}/>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, alignItems: "center", paddingHorizontal: 25 * scale, paddingTop: inset.top + 25 * scale, paddingBottom: 24 }}>
      <Text style={{ fontSize: 13 * scale, fontWeight: "600", color: dark ? "#C0A894" : "#806F60", textAlign: "center", marginBottom: 8 * scale }}>{earned ? newlyEarned ? "Achievement unlocked" : "Achievement earned" : "Still ahead"}</Text>
      <View style={{ width: "100%", maxWidth: 440, height: 265 * scale, alignItems: "center", justifyContent: "center" }}>
        <Svg pointerEvents="none" width="100%" height="100%" viewBox="0 0 380 300" style={StyleSheet.absoluteFill}><Defs><RadialGradient id="achievementHalo"><Stop offset="0" stopColor="#F3C088" stopOpacity={dark ? .3 : .33}/><Stop offset="1" stopColor="#F3C088" stopOpacity="0"/></RadialGradient><RadialGradient id="achievementRays" gradientUnits="userSpaceOnUse" cx="190" cy="140" r="150"><Stop offset="0" stopColor="#FFE3BB" stopOpacity=".18"/><Stop offset="1" stopColor="#FFE3BB" stopOpacity="0"/></RadialGradient></Defs><Rect width="380" height="300" fill="url(#achievementHalo)"/>{Array.from({length:12},(_,i)=><Path key={i} d="M190 140 L180 0 L204 0 Z" fill="url(#achievementRays)" rotation={i*30} origin="190,140"/>)}</Svg>
        <Animated.View style={art}><AchievementMedal size={badgeSize} icon={icon} earned={earned}/>{earned && !reduced && <View pointerEvents="none" style={{ position: "absolute", top: badgeSize * .044, left: badgeSize * .044, width: badgeSize * .912, height: badgeSize * .912, borderRadius: badgeSize / 2, overflow: "hidden" }}><Animated.View style={[{ width: badgeSize * .5, height: badgeSize * 1.2 }, sheen]}><Svg width={badgeSize * .5} height={badgeSize * 1.2}><Defs><LinearGradient id="achievementShine"><Stop offset="0" stopColor="white" stopOpacity="0"/><Stop offset=".5" stopColor="white" stopOpacity=".4"/><Stop offset="1" stopColor="white" stopOpacity="0"/></LinearGradient></Defs><Rect width="100%" height="100%" fill="url(#achievementShine)"/></Svg></Animated.View></View>}</Animated.View>
        {newlyEarned && earned && !reduced && <View pointerEvents="none" style={StyleSheet.absoluteFill}>{Array.from({length:36},(_,i)=><Confetti key={i} index={i} progress={burst}/>)}</View>}
      </View>
      <Animated.View style={[{ alignItems: "center", maxWidth: 310 * scale, marginTop: 4 * scale }, textStyle]}>
        <Text accessibilityRole="header" style={{ fontSize: 32 * scale, lineHeight: 35.2 * scale, fontWeight: "700", letterSpacing: -.85 * scale, color: dark ? "#FBF1E5" : "#30251E", textAlign: "center", marginBottom: 15 * scale }}>{title}</Text>
        <Text style={{ fontSize: 16 * scale, lineHeight: 24.8 * scale, color: dark ? "#C0A894" : "#806F60", textAlign: "center" }}>{detail}</Text>
      </Animated.View>
    </ScrollView>
    <Animated.View style={[{ paddingHorizontal: 25 * scale, paddingTop: 25 * scale, paddingBottom: Math.max(inset.bottom, 18) + 32 * scale }, buttonStyle]}><Pressable accessibilityRole="button" onPress={onContinue} style={{ backgroundColor: action.backgroundColor, minHeight: 54 * scale, padding: 16, borderRadius: 28 * scale, alignItems: "center", justifyContent: "center" }}><Text style={{ color: action.color, fontSize: 16 * scale, fontWeight: "600" }}>Continue</Text></Pressable></Animated.View>
  </ReaderMaterialGradient>;
}
