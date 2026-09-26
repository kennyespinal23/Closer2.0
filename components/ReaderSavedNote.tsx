import { useEffect } from "react";
import { Pressable, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useReducedMotion } from "@/lib/useReducedMotion";
/** A folded paper tab in the verse-number gutter; it never changes pagination. */
export function ReaderSavedNote({ x, y, verse, count, onPress }: { x: number; y: number; verse: number; count: number; onPress: () => void }) {
  const reduced = useReducedMotion();
  const pop = useSharedValue(reduced ? 1 : .85);
  useEffect(() => { pop.value = reduced ? 1 : withSpring(1, { damping: 18, stiffness: 420 }); }, [count, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }, { rotate: "-7deg" }] }));
  return <Pressable accessibilityRole="button" accessibilityLabel={`${count} saved ${count === 1 ? "note" : "notes"} on verse ${verse}`} onPress={onPress} hitSlop={8} style={{ position: "absolute", left: x, top: y, width: 17, height: 20, zIndex: 2 }}><Animated.View style={[{ width: 16, height: 18, backgroundColor: "#FFE89B", borderRadius: 2, boxShadow: "0 2px 3px #00000033" }, style]}><View style={{ position: "absolute", bottom: 0, right: 0, width: 6, height: 6, borderTopLeftRadius: 2, backgroundColor: "#C8A85A" }} /><View style={{ margin: 4, height: 1, backgroundColor: "#AD8946" }} /><View style={{ marginHorizontal: 4, height: 1, width: 6, backgroundColor: "#AD8946" }} /></Animated.View></Pressable>;
}
