import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, cancelAnimation, runOnJS, Easing } from "react-native-reanimated";
import * as haptics from "@/lib/haptics";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Modal, Pressable, ScrollView, Text, View, type TextStyle, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { CardGlass } from "@/components/CardGlass";
import { SFSymbol } from "@/components/Symbol";
import { unlockBibleMoment } from "@/state/bibleMoments";
import { Image } from "expo-image";
import { getBookCover } from "@/constants/bookCovers";
import { MOMENT_CATEGORIES } from "@/constants/bibleMoments";
import { findBookById } from "@/constants/books";
import type { BibleMoment } from "@/constants/bibleMoments";

export function MomentVerseText({ children, style, onPress, onUnlock, glowColor }: {
  children: ReactNode; style: TextStyle; onPress: () => void; onUnlock: () => void; glowColor: string;
}) {
  const reduced = useReducedMotion();
  return <Text accessibilityRole="button"
    accessibilityHint="Tap to discover a Bible Moment. Hold for highlighting and notes."
    accessibilityActions={[{ name: "activate", label: "Discover Bible Moment" }, { name: "longpress", label: "Verse actions" }]}
    onAccessibilityAction={(event) => event.nativeEvent.actionName === "longpress" ? onPress() : onUnlock()}
    onPress={onUnlock} onLongPress={onPress}
    style={[style, { textShadowColor: glowColor, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: reduced ? 0 : 4 }]}
  >{children}</Text>;
}

export function BibleMomentCard({ moment, onClose }: { moment: BibleMoment | null; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const entrance = useSharedValue(0);
  const drag = useSharedValue(0);
  const closing = useSharedValue(false);
  const dragStart = useSharedValue(0);
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: drag.value + (1 - entrance.value) * -height }] }));
  const [saved, setSaved] = useState("Saving moment…");
  const [saveFailed, setSaveFailed] = useState(false);
  const save = () => {
    if (!moment) return;
    setSaveFailed(false);
    setSaved("Saving moment…");
    void unlockBibleMoment(moment.id).then(result => { setSaved(result === "new" ? "New moment collected" : "In your collection"); if (result === "new") haptics.success(); }).catch(() => { setSaved("Couldn’t save. Tap to retry."); setSaveFailed(true); });
  };
  const [canScroll, setCanScroll] = useState(false);
  const scrollMetrics = useRef({ content: 0, viewport: 0, offset: 0 });
  useEffect(() => {
    if (!moment) return;
    closing.value = false;
    entrance.value = 0;
    drag.value = 0;
    save();
    return () => { cancelAnimation(entrance); cancelAnimation(drag); };
  }, [moment, entrance, drag]);
  const close = () => {
    if (closing.value) return;
    closing.value = true;
    if (reduced) { onClose(); return; }
    entrance.value = withTiming(0, { duration: 200, easing: Easing.in(Easing.cubic) }, finished => { if (finished) runOnJS(onClose)(); });
  };
  const makePan = (handle: boolean) => Gesture.Pan().enabled(handle || !canScroll)
    .shouldCancelWhenOutside(false)
    .activeOffsetY([-6, 6])
    .onStart(() => {
      cancelAnimation(drag);
      dragStart.value = drag.value;
    })
    .onUpdate(event => {
      if (!closing.value) drag.value = Math.min(0, dragStart.value + event.translationY);
    })
    .onEnd(event => {
      if (closing.value) return;
      if (drag.value < -64 || event.velocityY < -650) {
        closing.value = true;
        entrance.value = withTiming(0, { duration: reduced ? 0 : 180, easing: Easing.in(Easing.cubic) }, finished => {
          if (finished) runOnJS(onClose)();
        });
      } else {
        drag.value = reduced ? 0 : withSpring(0, { damping: 30, stiffness: 340, mass: 0.8 });
      }
    })
    .onFinalize((_event, success) => {
      if (!success && !closing.value) drag.value = reduced ? 0 : withSpring(0, { damping: 30, stiffness: 340, mass: 0.8 });
    });
  return <Modal transparent visible={!!moment} animationType="none" onRequestClose={close} statusBarTranslucent onShow={() => {
    entrance.value = reduced ? 1 : withSpring(1, { damping: 30, stiffness: 250, mass: 0.85, overshootClamping: true });
  }}>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Pressable accessibilityLabel="Dismiss Bible Moment" accessibilityRole="button" onPress={close} style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.25)" }} />
      {moment && <GestureDetector gesture={makePan(false)}><Animated.View accessibilityViewIsModal style={[cardStyle, { maxHeight: height - insets.bottom - 64, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, backgroundColor: "transparent", borderBottomWidth: 1, borderColor: "#FFFFFF30", overflow: "hidden" }]}>
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
          <Image source={getBookCover(moment.bookId)} contentFit="cover" style={{ width: "100%", height: 144, borderRadius: 18, marginBottom: 16 }} />
          <Text style={{ color: MOMENT_CATEGORIES[moment.category].dark, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>{MOMENT_CATEGORIES[moment.category].name}</Text>
          <Text accessibilityRole="header" style={{ color: "#FFFFFFA6", fontSize: 24, lineHeight: 32, fontWeight: "700", marginBottom: 10 }}>{moment.title}</Text>
          <Text style={{ color: "white", fontSize: 22, lineHeight: 30, fontWeight: "700" }}>{moment.importance}</Text>
          <Text style={{ color: "#FFFFFFB8", fontSize: 15, lineHeight: 22, marginTop: 18 }}>{moment.happened}</Text>
          <Text style={{ color: "#FFFFFF99", fontSize: 13, marginTop: 8 }}>{moment.reference} · WEB</Text>
          <Pressable disabled={!saveFailed} onPress={save} accessibilityRole={saveFailed ? "button" : "text"} style={{ minHeight: 44, justifyContent: "center", marginTop: 8 }}><Text accessibilityLiveRegion="polite" style={{ color: MOMENT_CATEGORIES[moment.category].dark, fontSize: 14, fontWeight: "600" }}>{saved}</Text></Pressable>
        </ScrollView>
        <GestureDetector gesture={makePan(true)}><View accessibilityLabel="Swipe up to dismiss Bible Moment" style={{ height: 44, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: "#FFFFFF60" }} />
        </View></GestureDetector>
      </Animated.View></GestureDetector>}
    </GestureHandlerRootView>
  </Modal>;
}
