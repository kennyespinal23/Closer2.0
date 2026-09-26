import { useEffect, useRef, useState } from "react";
import { BackHandler, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withDelay, withTiming, runOnJS } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useResolvedScheme } from "@/state/theme";
import { useBibleMomentCollection } from "@/state/bibleMoments";
import type { BibleMoment } from "@/constants/bibleMoments";
import { systemText } from "@/lib/typography";
import { SFSymbol } from "@/components/Symbol";

/** A reading interruption, not a collection write. Collection starts only on confirmation. */
export function MomentThoughtBubble({ moment, anchorY, onClose, onCollect }: {
  moment: BibleMoment; anchorY: number; onClose: () => void; onCollect: (origin: { x: number; y: number; width: number; height: number }) => void;
}) {
  useEffect(() => {
    const back = BackHandler.addEventListener("hardwareBackPress", () => { dismiss(); return true; });
    return () => back.remove();
  }, [onClose]);
  const bubbleRef = useRef<View>(null);
  const dark = useResolvedScheme() === "dark";
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { ids } = useBibleMomentCollection();
  const collected = ids.includes(moment.id);
  const [measured, setMeasured] = useState(360);
  const progress = useSharedValue(0);
  const dismiss = () => { progress.value = withTiming(0, { duration: reduced ? 0 : 220 }, done => { if (done) runOnJS(onClose)(); }); };
  useEffect(() => { progress.value = reduced ? 1 : withSpring(1, { damping: 22, stiffness: 420, mass: 0.65 }); }, [reduced]);
  const style = useAnimatedStyle(() => ({ opacity: progress.value, transform: [{ scale: .92 + .08 * progress.value }, { translateY: (1 - progress.value) * 10 }, { rotate: `${-6 * (1 - progress.value)}deg` }] }));
  const paper = dark ? "#302820" : "#FFFBF2";
  const ink = dark ? "#FFF4E5" : "#302319";
  const top = Math.max(insets.top + 56, Math.min(anchorY + 28, height - insets.bottom - measured - 28));
  return <View accessibilityViewIsModal style={{ position: "absolute", inset: 0, zIndex: 200 }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Keep reading" onPress={dismiss} style={{ position: "absolute", inset: 0, backgroundColor: dark ? "#00000066" : "#20150D30" }} />
    <View pointerEvents="none" accessible={false} style={{ position: "absolute", left: 46, top: top - 58 }}>{[10, 16, 22].map((size, index) => <ThoughtDot key={size} size={size} index={index} paper={paper} ink={ink} reduced={reduced} />)}</View>
    <Animated.View ref={bubbleRef} onLayout={event => setMeasured(event.nativeEvent.layout.height)} style={[{ position: "absolute", left: 20, right: 20, top, maxHeight: height - insets.top - insets.bottom - 100, borderRadius: 36, borderTopLeftRadius: 24, borderBottomRightRadius: 28, borderCurve: "continuous", borderWidth: 2, borderColor: dark ? "#806C54" : "#493424", backgroundColor: paper, padding: 20, gap: 12 }, style]}>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}><SFSymbol name="sparkles" size={16} color={dark ? "#FFAC86" : "#A63C20"} /><Text style={{ ...systemText.footnote, color: dark ? "#FFAC86" : "#A63C20", flex: 1 }}>{collected ? "A Moment in your collection" : "You found a Bible Moment"}</Text></View>
      <ScrollView bounces={false} contentContainerStyle={{ gap: 12 }}>
        <Text accessibilityRole="header" style={{ ...systemText.title2, fontSize: 24, lineHeight: 29, fontWeight: "700", color: ink }}>{moment.title}</Text>
        <Text style={{ ...systemText.callout, color: ink, lineHeight: 23 }}>{moment.importance}</Text>
        <Text style={{ ...systemText.footnote, color: dark ? "#C9B7A1" : "#74614F" }}>{moment.reference}</Text>
      </ScrollView>
      <Pressable accessibilityRole="button" onPress={() => bubbleRef.current?.measureInWindow((x, y, width, height) => onCollect({ x, y, width, height }))} style={{ minHeight: 48, padding: 12, borderRadius: 18, borderBottomLeftRadius: 6, backgroundColor: "#FF5A36", alignItems: "center", justifyContent: "center" }}><Text style={{ ...systemText.headline, color: "#26130D" }}>{collected ? "View collected Moment" : "Collect this Moment"}</Text></Pressable>
      <Pressable accessibilityRole="button" onPress={dismiss} style={{ minHeight: 44, alignItems: "center", justifyContent: "center" }}><Text style={{ ...systemText.body, color: ink }}>Keep reading</Text></Pressable>
    </Animated.View>
  </View>;
}

function ThoughtDot({ size, index, paper, ink, reduced }: { size: number; index: number; paper: string; ink: string; reduced: boolean }) {
  const pop = useSharedValue(reduced ? 1 : 0);
  useEffect(() => { pop.value = reduced ? 1 : withDelay(index * 45, withSpring(1, { damping: 9, stiffness: 300 })); }, [reduced]);
  const style = useAnimatedStyle(() => ({ opacity: pop.value, transform: [{ scale: pop.value }] }));
  return <Animated.View style={[{ width: size, height: size, marginLeft: index * 8, marginBottom: 3, borderRadius: size / 2, borderWidth: 1.5, borderColor: ink, backgroundColor: paper }, style]} />;
}
