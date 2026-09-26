import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { SFSymbol } from "./Symbol";
import { useAmbientMotionEnabled } from "@/lib/useAmbientMotionEnabled";

/** One foil per book, derived from the unique saved Moments, never a separate reward write. */
export function MomentBookFoil({ name, earned, width = 106, onPress }: { name: string; earned: boolean; width?: number; onPress?: () => void }) {
  const animate = useAmbientMotionEnabled(), shine = useSharedValue(-1);
  useEffect(() => {
    shine.value = -1;
    if (earned && animate) shine.value = withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.cubic) }), withDelay(3500, withTiming(-1, { duration: 0 }))), -1, false);
    return () => cancelAnimation(shine);
  }, [earned, animate]);
  const sheen = useAnimatedStyle(() => ({ transform: [{ translateX: shine.value * width * 1.6 }, { rotate: "-25deg" }] }));
  return <Pressable accessibilityRole={onPress ? "button" : undefined} accessibilityLabel={`${name} silver foil card, ${earned ? "earned" : "locked. Collect every Moment in this book to unlock"}`} onPress={onPress} style={{ width, height: width * 1.4, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: earned ? "#F7FAFF" : "#777C84", boxShadow: "0 5px 12px #00000035" }}>
    <ReaderMaterialGradient colors={earned ? ["#EFF3FA", "#909AA9", "#F8FBFF", "#ACB8C9", "#EBEFF5"] : ["#989CA2", "#777B82", "#A3A6AC"]} style={{ width, height: width * 1.4 }}><View style={{ flex: 1, padding: width * .1, alignItems: "center", justifyContent: width < 80 ? "center" : "space-between" }}>
      {width >= 80 && <Text style={{ fontSize: Math.max(9, width * .085), fontWeight: "700", letterSpacing: 1, color: "#303947" }}>CLOSER</Text>}
      <SFSymbol name={earned ? "seal.fill" : "lock.fill"} size={width * .28} color="#3E4B60" />
      {width >= 80 && <View><Text style={{ fontSize: Math.max(12, width * .11), lineHeight: width * .14, fontWeight: "700", color: "#202B3D", textAlign: "center" }}>{name}</Text><Text style={{ marginTop: 5, fontSize: Math.max(9, width * .06), color: "#354258", textAlign: "center" }}>{earned ? "COMPLETE COLLECTION" : "SILVER FOIL"}</Text></View>}
    </View></ReaderMaterialGradient>
    <View pointerEvents="none" style={{ position: "absolute", inset: 5, borderWidth: 1, borderColor: "#FFFFFF88", borderRadius: 6 }} />
    {earned && animate && <Animated.View pointerEvents="none" style={[{ position: "absolute", top: -width, bottom: -width, width: width * .3, alignSelf: "center", backgroundColor: "#FFFFFF66" }, sheen]} />}
  </Pressable>;
}
