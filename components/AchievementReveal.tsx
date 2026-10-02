import { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { cancelAnimation, Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming, type SharedValue } from "react-native-reanimated";
import { useTheme } from "@/state/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useAmbientMotionEnabled } from "@/lib/useAmbientMotionEnabled";
import { paperActionColors } from "@/lib/paperControls";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { type SFSymbolName } from "./Symbol";
import * as haptics from "@/lib/haptics";

export { EnamelAchievement as AchievementMedal } from './EnamelAchievement';
import { EnamelAchievement, AchievementSheen, resolveAchievementArt } from './EnamelAchievement';
import { achievementArtwork } from '@/lib/achievementArtwork';

function Confetti({ index, progress }: { index: number; progress: SharedValue<number> }) {
  const angle = index * 2.39996, reach = 80 + (index * 37 % 90);
  const style = useAnimatedStyle(() => ({ opacity: interpolate(progress.value, [0, .08, .65, 1], [0, 1, 1, 0]), transform: [
    { translateX: Math.cos(angle) * reach * Math.min(1, progress.value * 4) },
    { translateY: Math.sin(angle) * reach * Math.min(1, progress.value * 4) + 245 * progress.value * progress.value },
    { rotate: `${progress.value * (index % 2 ? 420 : -360)}deg` },
  ] }));
  return <Animated.View style={[{ position: "absolute", left: "50%", top: "40%", width: 4 + index % 3, height: 7 + index % 5, borderRadius: 2, backgroundColor: ["#D57851", "#D9AF63", "#5C947E", "#F8E1BF"][index % 4] }, style]}/>;
}

export function AchievementReveal({ achievementId, title, detail, icon = "envelope", newlyEarned = false, earned = true, onContinue }: { achievementId?: string; title: string; detail: string; icon?: SFSymbolName; newlyEarned?: boolean; earned?: boolean; onContinue: () => void }) {
  const { scheme } = useTheme(), dark = scheme === "dark", reduced = useReducedMotion(), inset = useSafeAreaInsets();
  const { width } = useWindowDimensions(), action = paperActionColors(dark);
  const ambient = useAmbientMotionEnabled();
  // Match the approved 376-point HTML canvas, including its top-anchored layout.
  const scale = Math.min(width / 376, 1.18);
  const badgeSize = 265 * scale;
  const badge = achievementArtwork[resolveAchievementArt(achievementId, icon)];
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
  return <ReaderMaterialGradient colors={dark ? [badge.dark, "#172027", "#111913"] : [badge.light, "#FBF2E5", "#FFFAF2"]} locations={[0, .53, .82]} style={{ flex: 1 }}>
    <StatusBar style={dark ? "light" : "dark"}/>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, alignItems: "center", paddingHorizontal: 25 * scale, paddingTop: inset.top + 25 * scale, paddingBottom: 24 }}>
      <Text style={{ fontSize: 13 * scale, fontWeight: "600", color: dark ? "#C0A894" : "#806F60", textAlign: "center", marginBottom: 8 * scale }}>{earned ? newlyEarned ? "Achievement unlocked" : "Achievement earned" : "Still ahead"}</Text>
      <View style={{ width: "100%", maxWidth: 440, height: 280 * scale, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={art}><EnamelAchievement size={badgeSize} achievementId={achievementId} icon={icon} earned={earned}/>{earned && !reduced && <AchievementSheen size={badgeSize} achievementId={achievementId} icon={icon} progress={shine}/>}</Animated.View>
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
