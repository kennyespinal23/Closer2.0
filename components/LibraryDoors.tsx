import { buttonStyles } from "@/lib/buttonStyles";
import { useEffect, useState } from "react";
import { Modal, Pressable, View } from "react-native";
import { Text } from "@/components/CloserText";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { STORAGE_KEYS, loadJSON, saveJSON } from "@/lib/storage";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { systemText } from "@/lib/typography";

/** A first-visit welcome, never a gate on normal tab switching. */
export function LibraryDoors({ replay = 0 }: { replay?: number }) {
  const [visible, setVisible] = useState(false), reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const open = useSharedValue(0);
  useEffect(() => {
    let alive = true;
    void loadJSON<boolean>(STORAGE_KEYS.libraryDoorsSeen).then(seen => {
      if (!alive || seen) return;
      void saveJSON(STORAGE_KEYS.libraryDoorsSeen, true);
      if (!reduced) setVisible(true);
    });
    return () => { alive = false; };
  }, []);
  useEffect(() => { if (replay > 0) { open.value = 0; setVisible(true); } }, [replay]);
  useEffect(() => {
    if (!visible) return;
    if (reduced) { setVisible(false); return; }
    open.value = withDelay(250, withTiming(1, { duration: 1200, easing: Easing.bezier(.55, 0, .25, 1) }));
    const timer = setTimeout(() => setVisible(false), 1850);
    return () => { clearTimeout(timer); cancelAnimation(open); };
  }, [visible, reduced]);
  const left = useAnimatedStyle(() => ({ transformOrigin: "left", transform: [{ perspective: 1400 }, { rotateY: `${-105 * open.value}deg` }] }));
  const right = useAnimatedStyle(() => ({ transformOrigin: "right", transform: [{ perspective: 1400 }, { rotateY: `${105 * open.value}deg` }] }));
  const title = useAnimatedStyle(() => ({ opacity: open.value, transform: [{ translateY: 16 * (1 - open.value) }] }));
  const plaque = useAnimatedStyle(() => ({ opacity: 1 - open.value }));
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}><View style={{ flex: 1, backgroundColor: "#F1E1D2", justifyContent: "center", alignItems: "center" }}>
    <Animated.View style={[{ padding: 30, gap: 12 }, title]}><Text style={{ ...systemText.largeTitle, color: "#2A1F18", textAlign: "center" }}>The Library</Text><Text style={{ ...systemText.body, color: "#6F5E50", textAlign: "center" }}>Sixty-six books, one story.</Text></Animated.View>
    {[left, right].map((style, index) => <Animated.View key={index} style={[{ position: "absolute", top: 0, bottom: 0, width: "50%", ...(index ? { right: 0 } : { left: 0 }) }, style]}><ReaderMaterialGradient colors={["#7A4C2A", "#5A3620", "#7A4C2A"]} style={{ flex: 1, borderWidth: 10, borderColor: "#4A2C18", paddingHorizontal: 14, paddingVertical: insets.top + 30, gap: 30 }}>{[0, 1].map(panel => <View key={panel} style={{ flex: 1, borderRadius: 6, borderWidth: 4, borderColor: "#3C2517", backgroundColor: "#714529" }} />)}<View style={{ position: "absolute", top: "50%", ...(index ? { left: 10 } : { right: 10 }), width: 14, height: 14, borderRadius: 7, backgroundColor: "#D5AD62", borderWidth: 2, borderColor: "#F1D08C" }} /></ReaderMaterialGradient></Animated.View>)}
    <Animated.View style={[{ position: "absolute", top: "22%" }, plaque]}><ReaderMaterialGradient colors={["#F1D08C", "#C99A4B"]} style={{ paddingHorizontal: 22, paddingVertical: 10, borderRadius: 5 }}><Text style={{ ...systemText.title2, color: "#3A2410" }}>Library</Text></ReaderMaterialGradient></Animated.View>
    <Pressable accessibilityRole="button" accessibilityLabel="Enter the library" onPress={() => setVisible(false)} style={{ position: "absolute", bottom: insets.bottom + 28, minHeight: 44, paddingHorizontal: 24, borderRadius: 22, backgroundColor: "#FFF4EBDD", justifyContent: "center" }}><Text style={[{ color: "#3A2410" }, buttonStyles.label]}>Enter library</Text></Pressable>
  </View></Modal>;
}
