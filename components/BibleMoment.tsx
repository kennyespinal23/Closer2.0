import { useEffect, useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View, Animated, Easing, type TextStyle, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { CardGlass } from "@/components/CardGlass";
import { SFSymbol } from "@/components/Symbol";
import { saveJSON } from "@/lib/storage";
import { findBookById } from "@/constants/books";
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
  const drag = useRef(new Animated.Value(0)).current;
  const closing = useRef(false);
  const [canScroll, setCanScroll] = useState(false);
  const scrollMetrics = useRef({ content: 0, viewport: 0, offset: 0 });
  useEffect(() => {
    if (!moment) return;
    closing.current = false;
    entrance.setValue(0);
    drag.setValue(0);
    // Each moment has its own key so simultaneous discoveries cannot overwrite each other.
    void saveJSON(`closer.bible-moment.${moment.id}.v1`, true);
    return () => { entrance.stopAnimation(); };
  }, [moment, entrance, drag]);
  const close = () => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(entrance, { toValue: 0, duration: reduced ? 0 : 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(({ finished }) => { if (finished) onClose(); });
  };
  const makePan = (handle: boolean) => Gesture.Pan().enabled(handle || !canScroll)
    .runOnJS(true)
    .shouldCancelWhenOutside(false)
    .activeOffsetY([-6, 6])
    .onBegin(() => drag.stopAnimation())
    .onUpdate((event) => {
      const { content, viewport, offset } = scrollMetrics.current;
      if ((handle || content - viewport - offset <= 2) && !reduced) drag.setValue(Math.min(0, event.translationY));
    })
    .onEnd((event) => {
      const { content, viewport, offset } = scrollMetrics.current;
      if ((handle || content - viewport - offset <= 2) && (event.translationY < -48 || event.velocityY < -600)) close();
      else Animated.spring(drag, { toValue: 0, damping: 26, stiffness: 240, useNativeDriver: true }).start();
    })
    .onFinalize(() => { if (!closing.current) Animated.spring(drag, { toValue: 0, damping: 26, stiffness: 240, useNativeDriver: true }).start(); });
  return <Modal transparent visible={!!moment} animationType="none" onRequestClose={close} statusBarTranslucent onShow={() => {
    if (reduced) entrance.setValue(1);
    else Animated.spring(entrance, { toValue: 1, damping: 30, stiffness: 210, mass: 1, overshootClamping: true, useNativeDriver: true }).start();
  }}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Pressable accessibilityLabel="Dismiss Bible Moment" accessibilityRole="button" onPress={close} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.25)" }} />
      {moment && <GestureDetector gesture={makePan(false)}><Animated.View accessibilityViewIsModal style={{ maxHeight: height - insets.bottom - 64, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, backgroundColor: "transparent", borderBottomWidth: 1, borderColor: "#FFFFFF30", overflow: "hidden", transform: [{ translateY: reduced ? 0 : Animated.add(drag, entrance.interpolate({ inputRange: [0, 1], outputRange: [-height, 0] })) }] }}>
        <CardGlass tint={moment.tint} topAttached />
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: insets.top + 6, paddingBottom: 14 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close Bible Moment" onPress={close} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF15", alignItems: "center", justifyContent: "center" }}>
            <SFSymbol name="chevron.up" color="white" size={18} />
          </Pressable>
          <Text accessibilityRole="header" style={{ flex: 1, textAlign: "center", color: "white", fontSize: 17, fontWeight: "600" }}>{findBookById(moment.bookId)?.name ?? "Bible Moment"}</Text>
          <View style={{ width: 44 }} />
        </View>
        <ScrollView
          bounces={false}
          scrollEnabled={canScroll}
          onContentSizeChange={(_, content) => { scrollMetrics.current.content = content; setCanScroll(content > scrollMetrics.current.viewport + 2); }}
          onLayout={({ nativeEvent }) => { scrollMetrics.current.viewport = nativeEvent.layout.height; setCanScroll(scrollMetrics.current.content > nativeEvent.layout.height + 2); }}
          onScroll={({ nativeEvent }) => { scrollMetrics.current.offset = nativeEvent.contentOffset.y; }}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: 26, paddingTop: 8, paddingBottom: 18 }}>
          <Text accessibilityRole="header" style={{ color: "#FFFFFFA6", fontSize: 24, lineHeight: 32, fontWeight: "700", marginBottom: 10 }}>{moment.id === "creation" ? "In the beginning" : moment.title}</Text>
          <Text style={{ color: "white", fontSize: 24, lineHeight: 34, fontWeight: "700" }}>{moment.importance}</Text>
        </ScrollView>
        <GestureDetector gesture={makePan(true)}><View accessibilityLabel="Swipe up to dismiss Bible Moment" style={{ height: 36, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: "#FFFFFF60" }} />
        </View></GestureDetector>
      </Animated.View></GestureDetector>}
    </GestureHandlerRootView>
  </Modal>;
}
