import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useResolvedScheme } from "@/state/theme";
import { SFSymbol } from "./Symbol";

/** One selection motion for notes, questions, intentions and reminder times. */
export function OnboardingChoice({ label, detail, selected, onPress, multiple = false, paper, rotation = 0, compact = false, style }: {
  label: string; detail?: string; selected: boolean; onPress: () => void;
  multiple?: boolean; paper?: string; rotation?: number; compact?: boolean; style?: StyleProp<ViewStyle>;
}) {
  const dark = useResolvedScheme() === "dark", reduced = useReducedMotion();
  const selection = useSharedValue(selected ? 1 : 0), press = useSharedValue(1), check = useSharedValue(selected ? 1 : .65);
  const base = paper ?? (dark ? "#362B24" : "#FFF9EE");
  const ink = paper ? "#362A22" : dark ? "#F6F0E6" : "#30251E";
  const green = dark ? "#254C39" : "#DCEEDC", selectedInk = dark ? "#EDFAED" : "#17462C";
  useEffect(() => {
    selection.value = withTiming(selected ? 1 : 0, { duration: reduced ? 0 : 160 });
    check.value = reduced ? (selected ? 1 : .65) : withSpring(selected ? 1 : .65, { stiffness: 420, damping: 19 });
  }, [selected, reduced]);
  const card = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(selection.value, [0, 1], [base, green]),
    borderColor: interpolateColor(selection.value, [0, 1], [dark ? "#756254" : "#AC9985", dark ? "#83BC8D" : "#4D865B"]),
    transform: [{ scale: press.value }, { rotate: `${rotation * (1 - selection.value)}deg` }],
  }));
  const text = useAnimatedStyle(() => ({ color: interpolateColor(selection.value, [0, 1], [ink, selectedInk]) }));
  const tick = useAnimatedStyle(() => ({ opacity: selection.value, transform: [{ scale: check.value }, { rotate: `${(1 - check.value) * -35}deg` }] }));
  return <Pressable accessibilityRole={multiple ? "checkbox" : "radio"} accessibilityLabel={detail ? `${label}, ${detail}` : label} accessibilityState={multiple ? { checked: selected } : { selected }}
    onPressIn={() => { press.value = reduced ? 1 : withTiming(.975, { duration: 90 }); }}
    onPressOut={() => { press.value = reduced ? 1 : withSpring(1, { stiffness: 460, damping: 24 }); }}
    onPress={onPress} style={style}>
    <Animated.View style={[styles.card, compact && styles.compact, card]}>
      <View style={{ flexShrink: 1, gap: 6 }}><Animated.Text style={[styles.label, text]}>{label}</Animated.Text>{detail && <Animated.Text style={[styles.detail, text]}>{detail}</Animated.Text>}</View>
      <View style={[styles.check, { borderColor: paper || !dark ? "#8A7965" : "#BBAA97" }]}><Animated.View style={[StyleSheet.absoluteFill, styles.tick, tick]}><SFSymbol name="checkmark" size={13} weight="bold" color="#FFFFFF" /></Animated.View></View>
    </Animated.View>
  </Pressable>;
}
const styles = StyleSheet.create({
  card: { minHeight: 64, borderRadius: 16, borderCurve: "continuous", borderWidth: 1, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 14 },
  compact: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24, gap: 8 },
  label: { fontSize: 17, lineHeight: 24, fontWeight: "500" }, detail: { fontSize: 14, lineHeight: 20 },
  check: { width: 23, height: 23, flexShrink: 0, borderRadius: 12, borderWidth: 1 },
  tick: { backgroundColor: "#478657", borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
