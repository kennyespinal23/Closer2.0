import { useEffect } from "react";
import { Text, View } from "react-native";
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withSequence, withTiming } from "react-native-reanimated";
import { MOMENT_CATEGORIES, type MomentCategory } from "@/constants/bibleMoments";
import { SFSymbol } from "@/components/Symbol";
import { useReducedMotion } from "@/lib/useReducedMotion";

/** A single quiet unlock pulse; no looping motion while reading. */
export function MomentCategoryReward({ category, expanded = false, additionalCount = 0 }: { category: MomentCategory; expanded?: boolean; additionalCount?: number }) {
  const reduced = useReducedMotion();
  const glow = useSharedValue(0);
  const reveal = useSharedValue(reduced || expanded ? 1 : 0);
  useEffect(() => {
    reveal.value = reduced || expanded ? 1 : withTiming(1, { duration: 240 });
    glow.value = reduced || expanded ? 0 : withSequence(withTiming(0.24, { duration: 220 }), withTiming(0, { duration: 650 }));
    return () => { cancelAnimation(reveal); cancelAnimation(glow); };
  }, [reduced, expanded, reveal, glow]);
  const halo = useAnimatedStyle(() => ({ opacity: glow.value }));
  const badge = useAnimatedStyle(() => ({ opacity: 0.5 + reveal.value * 0.5, transform: [{ scale: 0.95 + reveal.value * 0.05 }] }));
  const definition = MOMENT_CATEGORIES[category];
  return <View style={{ flexDirection: expanded ? "column" : "row", alignItems: "center", gap: expanded ? 20 : 12, padding: expanded ? 24 : 14, borderRadius: 20, borderCurve: "continuous", backgroundColor: "#FFFFFF10" }}>
    <View style={{ width: expanded ? 120 : 48, height: expanded ? 120 : 48, alignItems: "center", justifyContent: "center" }}>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", inset: 0, borderRadius: 60, backgroundColor: definition.dark }, halo]} />
      <Animated.View style={badge}><SFSymbol name="checkmark.seal.fill" size={expanded ? 88 : 36} color={definition.dark} /></Animated.View>
    </View>
    <View style={{ flex: expanded ? undefined : 1, gap: 4, alignItems: expanded ? "center" : "flex-start" }}>
      <Text accessibilityRole="header" style={{ color: "white", fontSize: expanded ? 24 : 16, fontWeight: "700", textAlign: expanded ? "center" : "left" }}>{expanded ? definition.name : "Category complete"}</Text>
      <Text style={{ color: "#FFFFFFB8", fontSize: 14, lineHeight: 20, textAlign: expanded ? "center" : "left" }}>{expanded ? "Every Moment collected. This badge is yours." : `${definition.name}${additionalCount ? ` + ${additionalCount} more` : ""} · Badge earned`}</Text>
    </View>
  </View>;
}
