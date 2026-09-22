import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, withSpring } from "react-native-reanimated";
import Svg, { Defs, RadialGradient, Rect, Stop, Path } from "react-native-svg";
import { SFSymbol } from "@/components/Symbol";
import type { Milestone } from "@/lib/milestones";
import { getMilestoneAccent } from "@/lib/milestones";
import { getMilestoneBadge } from "@/lib/milestoneBadges";
import { systemText } from "@/lib/typography";
import { useReducedMotion } from "@/lib/useReducedMotion";

type Props = { milestone: Milestone; badgeIndex: number; onClose: () => void; showBack?: boolean; newlyUnlocked?: boolean };

/** Shared immersive presentation for earned badges and fresh unlocks. */
export function MilestoneDetailView({ milestone, badgeIndex, onClose, newlyUnlocked = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const accent = getMilestoneAccent(milestone);
  const color = accent.isLandmark ? "#E8B84A" : accent.color;
  const size = Math.min(width * 0.62, height * 0.31, 280);
  const float = useSharedValue(0);
  const entrance = useSharedValue(1);
  useEffect(() => {
    cancelAnimation(float);
    cancelAnimation(entrance);
    float.value = 0;
    entrance.value = reduced ? 1 : 0.94;
    if (!reduced) {
      entrance.value = withSpring(1, { damping: newlyUnlocked ? 12 : 20, stiffness: 160 });
      float.value = withRepeat(withSequence(
        withTiming(1, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3200, easing: Easing.inOut(Easing.sin) }),
      ), -1);
    }
    return () => { cancelAnimation(float); cancelAnimation(entrance); };
  }, [reduced, newlyUnlocked, milestone.day]);
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -3 * float.value }, { scale: entrance.value }, { rotate: `${reduced ? 0 : (float.value - 0.5) * 2}deg` }] }));
  const glowStyle = useAnimatedStyle(() => ({ opacity: 0.7 + float.value * 0.15 }));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          <Defs><RadialGradient id="milestoneAtmosphere" cx="50%" cy="34%" rx="75%" ry="65%">
            <Stop offset="0" stopColor={color} stopOpacity={0.28} />
            <Stop offset="0.6" stopColor={color} stopOpacity={0.09} />
            <Stop offset="1" stopColor={color} stopOpacity={0} />
          </RadialGradient></Defs>
          <Rect width="100%" height="100%" fill="url(#milestoneAtmosphere)" />
        </Svg>
      </View>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close achievement" style={styles.close}>
          <SFSymbol name="xmark" size={17} color="#FFFFFFCC" weight="medium" />
        </Pressable>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.stage, { width: Math.min(width - 32, 380), height: size + 88 }]}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { zIndex: 0 }, glowStyle]}>
            <Svg width="100%" height="100%" viewBox="0 0 380 360">
              <Defs><RadialGradient id="badgeHalo"><Stop offset="0" stopColor={color} stopOpacity={0.65} /><Stop offset="1" stopColor={color} stopOpacity={0} /></RadialGradient></Defs>
              <Rect width="380" height="360" fill="url(#badgeHalo)" />
              {[[55,85,5],[110,30,4],[286,45,6],[330,115,4],[40,180,3],[320,235,3]].map(([x,y,s], i) => <Path key={i} d={`M ${x} ${y-s} Q ${x} ${y} ${x+s} ${y} Q ${x} ${y} ${x} ${y+s} Q ${x} ${y} ${x-s} ${y} Q ${x} ${y} ${x} ${y-s}`} fill="#FFFFFF" opacity={0.75} />)}
            </Svg>
          </Animated.View>
          <Animated.View style={[{ zIndex: 1 }, badgeStyle]}>
            <Image source={getMilestoneBadge(badgeIndex)} style={{ width: size, height: size }} contentFit="contain" accessibilityLabel={`${milestone.title} badge`} />
          </Animated.View>
        </View>
        <Text accessibilityRole="header" style={styles.title}>{milestone.title}</Text>
        <Text style={styles.description}>{milestone.day === 1 ? "You made time for God today.\nA small beginning. A beautiful step.\nKeep going — this is just the start." : `You kept showing up.\n${milestone.day} days of making room for God.\nEvery small step matters.`}</Text>
        <View style={styles.earned}>
          <SFSymbol name="checkmark.seal.fill" size={19} color={color} />
          <Text style={styles.earnedText}>{newlyUnlocked ? "Milestone unlocked" : "Milestone earned"} · Day {milestone.day}</Text>
        </View>
        <Pressable onPress={() => setExpanded(value => !value)} accessibilityRole="button" accessibilityState={{ expanded }} style={{ minHeight: 44, justifyContent: "center", marginTop: 16 }}><Text style={styles.earnedText}>{expanded ? "Hide reflection" : "Read the reflection"}</Text></Pressable>
        {expanded && <View style={styles.reflection}>
          <Text style={styles.reference}>{milestone.reference}</Text>
          <Text style={styles.verse}>{milestone.verse}</Text>
          <Text style={styles.message}>{milestone.message}</Text>
        </View>}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <Pressable accessibilityRole="button" onPress={onClose} style={styles.continue}>
          <Text style={styles.continueText}>Continue</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#03070B" },
  header: { alignItems: "flex-end", paddingHorizontal: 24 },
  close: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF14", alignItems: "center", justifyContent: "center" },
  content: { flexGrow: 1, alignItems: "center", paddingHorizontal: 28, paddingBottom: 24 },
  stage: { alignItems: "center", justifyContent: "center" },
  title: { ...systemText.title2, fontSize: 26, lineHeight: 32, fontWeight: "600", letterSpacing: 0, color: "#FFFFFF", textAlign: "center", marginTop: 4 },
  description: { ...systemText.body, fontSize: 19, fontWeight: "400", letterSpacing: 0, color: "#B9C1CA", textAlign: "center", lineHeight: 27, marginTop: 12 },
  earned: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 28 },
  earnedText: { ...systemText.footnote, fontSize: 15, lineHeight: 21, letterSpacing: 0, color: "#94A1B1" },
  reflection: { width: "100%", marginTop: 40, paddingTop: 24, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#FFFFFF20", gap: 12 },
  reference: { ...systemText.footnote, color: "#B9C1CA", textAlign: "center" },
  verse: { ...systemText.body, color: "#D7DDE4", lineHeight: 26, textAlign: "center" },
  message: { ...systemText.callout, color: "#94A1B1", lineHeight: 25, marginTop: 8 },
  footer: { paddingTop: 16, paddingHorizontal: 28 },
  continue: { minHeight: 56, padding: 16, borderRadius: 28, borderCurve: "continuous", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  continueText: { ...systemText.headline, fontSize: 20, lineHeight: 26, fontWeight: "600", letterSpacing: 0, color: "#142640" },
});
