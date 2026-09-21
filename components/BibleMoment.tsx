import { useEffect, useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View, Animated, type TextStyle, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { CardGlass } from "@/components/CardGlass";
import { SFSymbol } from "@/components/Symbol";
import { loadJSON, saveJSON } from "@/lib/storage";
import type { BibleMoment } from "@/constants/bibleMoments";

export function MomentVerseText({ children, style, onPress, onUnlock }: {
  children: ReactNode; style: TextStyle; onPress: () => void; onUnlock: () => void;
}) {
  const reduced = useReducedMotion();
  const glow = useRef(new Animated.Value(0)).current;
  const unlocked = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reset = () => { if (holdTimer.current) clearTimeout(holdTimer.current); glow.stopAnimation(); Animated.timing(glow, { toValue: 0, duration: reduced ? 0 : 180, useNativeDriver: false }).start(); };
  useEffect(() => () => { glow.stopAnimation(); if (holdTimer.current) clearTimeout(holdTimer.current); }, [glow]);
  return <Animated.Text
    accessibilityHint="Hold to discover a Bible Moment. Tap for verse actions."
    accessibilityActions={[{ name: "activate", label: "Verse actions" }, { name: "longpress", label: "Discover Bible Moment" }]}
    onAccessibilityAction={(event) => event.nativeEvent.actionName === "longpress" ? onUnlock() : onPress()}
    onPressIn={() => { unlocked.current = false; holdTimer.current = setTimeout(() => { unlocked.current = true; onUnlock(); }, 700); Animated.timing(glow, { toValue: 1, duration: reduced ? 0 : 700, useNativeDriver: false }).start(); }}
    onPressOut={reset}
    onLongPress={() => { /* Keep a completed hold from also triggering a tap. */ }}
    onPress={() => { if (!unlocked.current) onPress(); }}
    style={[style, { textShadowColor: "#E8B654", textShadowOffset: { width: 0, height: 0 }, textShadowRadius: reduced ? 0 : glow.interpolate({ inputRange: [0, 1], outputRange: [3, 12] }) }]}
  >{children}</Animated.Text>;
}

export function BibleMomentCard({ moment, onClose }: { moment: BibleMoment | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const entrance = useRef(new Animated.Value(0)).current;
  const [fresh, setFresh] = useState(false);
  const closing = useRef(false);
  useEffect(() => {
    if (!moment) return;
    let cancelled = false;
    closing.current = false;
    entrance.setValue(0);
    // Each moment has its own key so simultaneous discoveries cannot overwrite each other.
    void loadJSON<boolean>(`closer.bible-moment.${moment.id}.v1`).then((seen) => {
      if (cancelled) return;
      setFresh(!seen);
      void saveJSON(`closer.bible-moment.${moment.id}.v1`, true);
      Animated.spring(entrance, { toValue: 1, damping: 24, stiffness: 220, mass: 1, useNativeDriver: true }).start();
    });
    return () => { cancelled = true; entrance.stopAnimation(); };
  }, [moment, entrance]);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(entrance, { toValue: 0, duration: reduced ? 0 : 180, useNativeDriver: true }).start(() => onClose());
  };
  return <Modal transparent visible={!!moment} animationType="none" onRequestClose={close} statusBarTranslucent>
    <View style={{ flex: 1 }}>
      <Pressable accessibilityLabel="Dismiss Bible Moment" accessibilityRole="button" onPress={close} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.25)" }} />
      {moment && <Animated.View accessibilityViewIsModal style={{ marginTop: insets.top + 12, marginHorizontal: 16, maxHeight: height - insets.top - insets.bottom - 48, borderRadius: 30, backgroundColor: "transparent", borderWidth: 1, borderColor: "#FFFFFF30", overflow: "hidden", transform: [{ translateY: reduced ? 0 : entrance.interpolate({ inputRange: [0, 1], outputRange: [-height, 0] }) }] }}>
        <CardGlass tint={moment.tint} />
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 24, paddingTop: 16 }}>
          <Text style={{ color: "#FFE3A8", fontSize: 12, fontWeight: "700", letterSpacing: 1.5 }}>{fresh ? "MOMENT DISCOVERED" : "BIBLE MOMENT"}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Close Bible Moment" onPress={close} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><SFSymbol name="xmark" color="white" size={18} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 26, paddingBottom: 26 }}>
          <SFSymbol name={moment.id === "creation" ? "sun.max" : "sunrise"} color="#FFE3A8" size={42} />
          <Text accessibilityRole="header" style={{ color: "white", fontSize: 32, fontWeight: "700", marginTop: 18 }}>{moment.title}</Text>
          <Text style={{ color: "#FFE3A8", fontSize: 15, marginTop: 8, marginBottom: 22 }}>{moment.reference}</Text>
          <Text style={{ color: "white", fontSize: 18, lineHeight: 27 }}>{moment.happened}</Text>
          <View style={{ height: 1, backgroundColor: "#FFFFFF26", marginVertical: 22 }} />
          <Text style={{ color: "white", fontSize: 20, fontWeight: "600", marginBottom: 10 }}>Why it matters</Text>
          <Text style={{ color: "#FFFFFFDD", fontSize: 17, lineHeight: 26 }}>{moment.importance}</Text>
          <Pressable onPress={close} accessibilityRole="button" style={{ minHeight: 50, marginTop: 26, borderRadius: 25, backgroundColor: "#FFFFFF18", borderWidth: 1, borderColor: "#FFFFFF30", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>Back to reading</Text></Pressable>
        </ScrollView>
      </Animated.View>}
    </View>
  </Modal>;
}
