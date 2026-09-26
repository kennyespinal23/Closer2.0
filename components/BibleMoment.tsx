import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, cancelAnimation, runOnJS, Easing } from "react-native-reanimated";
import * as haptics from "@/lib/haptics";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AccessibilityInfo, Modal, Pressable, ScrollView, Text, View, type TextStyle, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { CardGlass } from "@/components/CardGlass";
import { SFSymbol } from "@/components/Symbol";
import { unlockBibleMomentWithRewards } from "@/state/bibleMoments";
import { Image } from "expo-image";
import { getBookCover } from "@/constants/bookCovers";
import { MOMENT_CATEGORIES, type MomentCategory } from "@/constants/bibleMoments";
import { findBookById } from "@/constants/books";
import type { BibleMoment } from "@/constants/bibleMoments";

import { MomentCategoryReward } from "@/components/MomentCategoryReward";

export function MomentVerseText({ children, style, onPress, onUnlock, glowColor }: {
  children: ReactNode; style: TextStyle; onPress: () => void; onUnlock: () => void; glowColor: string;
}) {
  const reduced = useReducedMotion();
  return <Text accessibilityRole="button"
    accessibilityHint="Tap to discover a Bible Moment. Hold for highlighting and notes."
    accessibilityActions={[{ name: "activate", label: "Discover Bible Moment" }, { name: "longpress", label: "Verse actions" }]}
    onAccessibilityAction={(event) => event.nativeEvent.actionName === "longpress" ? onPress() : onUnlock()}
    onPress={onUnlock}  onLongPress={onPress}
    style={[style, { textShadowColor: glowColor, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: reduced ? 0 : 2 }]}
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
  const [newlyCollected, setNewlyCollected] = useState(false);
  const [rewards, setRewards] = useState<MomentCategory[]>([]);
  const [viewBadge, setViewBadge] = useState(false);
  const saveGeneration = useRef(0);
  const confirmationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const confirmation = useSharedValue(0);
  const confirmationStyle = useAnimatedStyle(() => ({ opacity: confirmation.value }));
  const save = () => {
    if (!moment) return;
    const generation = ++saveGeneration.current;
    setSaveFailed(false);
    setSaved("Saving moment…");
    void unlockBibleMomentWithRewards(moment.id).then(result => {
      if (generation !== saveGeneration.current) return;
      setSaved("In your collection");
      if (result.status === "new") {
        setRewards(result.categories);
        setNewlyCollected(true);
        confirmation.value = reduced ? 1 : withTiming(1, { duration: 160 });
        haptics.success();
        AccessibilityInfo.announceForAccessibility(result.categories.length ? "Category complete. Collection badge earned." : "Bible Moment collected");
        confirmationTimer.current = setTimeout(() => {
          if (reduced) { confirmation.value = 0; setNewlyCollected(false); }
          else confirmation.value = withTiming(0, { duration: 180 }, finished => { if (finished) runOnJS(setNewlyCollected)(false); });
        }, 2800);
      }
    }).catch(() => {
      if (generation !== saveGeneration.current) return;
      setSaved("Couldn’t save. Tap to retry.");
      setSaveFailed(true);
    });
  };
  const [canScroll, setCanScroll] = useState(false);
  const scrollMetrics = useRef({ content: 0, viewport: 0, offset: 0 });
  useEffect(() => {
    if (!moment) return;
    setNewlyCollected(false);
    setRewards([]);
    setViewBadge(false);
    confirmation.value = 0;
    closing.value = false;
    entrance.value = 0;
    drag.value = 0;
    save();
    return () => {
      saveGeneration.current += 1;
      if (confirmationTimer.current) clearTimeout(confirmationTimer.current);
      cancelAnimation(confirmation);
      cancelAnimation(entrance); cancelAnimation(drag);
    };
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
          {viewBadge ? <View style={{ gap: 16 }}>{rewards.map(category => <MomentCategoryReward key={category} category={category} expanded />)}</View> : <>
          <Image source={getBookCover(moment.bookId)} contentFit="cover" style={{ width: "100%", height: Math.max(160, Math.min(212, height * 0.23)), borderRadius: 20, marginBottom: 20 }} />
          <Text style={{ color: MOMENT_CATEGORIES[moment.category].dark, fontSize: 13, fontWeight: "600", marginBottom: 8 }}>{MOMENT_CATEGORIES[moment.category].name}</Text>
          <Text accessibilityRole="header" style={{ color: "white", fontSize: 28, lineHeight: 34, fontWeight: "700", letterSpacing: -0.4, marginBottom: 20 }}>{moment.title}</Text>
          <Text style={{ color: "#FFFFFFB8", fontSize: 13, lineHeight: 18, fontWeight: "600", marginBottom: 8 }}>Why it matters</Text>
          <Text style={{ color: "white", fontSize: 21, lineHeight: 29, fontWeight: "600" }}>{moment.importance}</Text>
          <View style={{ height: 1, backgroundColor: "#FFFFFF20", marginTop: 24, marginBottom: 16 }} />
          <Text style={{ color: "#FFFFFFB8", fontSize: 15, lineHeight: 22 }}>{moment.happened}</Text>
          <Text style={{ color: "#FFFFFF99", fontSize: 13, marginTop: 8 }}>{moment.reference} · WEB</Text>
          </>}
        </ScrollView>
        <View style={{ paddingHorizontal: 26, paddingTop: 8 }}>
          {rewards.length > 0 ? <View style={{ gap: 8 }}>
            {!viewBadge && <MomentCategoryReward category={rewards[0]} additionalCount={rewards.length - 1} />}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable accessibilityRole="button" onPress={() => setViewBadge(!viewBadge)} style={{ flex: 1, minHeight: 48, padding: 12, borderRadius: 24, backgroundColor: "#FFFFFF18", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>{viewBadge ? "Back to Moment" : rewards.length > 1 ? "View badges" : "View badge"}</Text></Pressable>
              <Pressable accessibilityRole="button" onPress={close} style={{ flex: 1, minHeight: 48, padding: 12, borderRadius: 24, backgroundColor: "white", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#111827", fontSize: 15, fontWeight: "600" }}>Keep reading</Text></Pressable>
            </View>
          </View> : <Pressable disabled={!saveFailed} onPress={save} accessibilityLabel={newlyCollected ? "Moment collected" : saved} accessibilityRole={saveFailed ? "button" : "text"} style={{ minHeight: 44, justifyContent: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, opacity: newlyCollected ? 0 : 1 }}>
              {!saveFailed && saved === "In your collection" && <SFSymbol name="checkmark.circle.fill" size={16} color={MOMENT_CATEGORIES[moment.category].dark} />}
              <Text accessibilityLiveRegion="polite" style={{ flex: 1, color: "#FFFFFFB8", fontSize: 14, lineHeight: 20 }}>{saved}</Text>
            </View>
            <Animated.View pointerEvents="none" accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={[{ position: "absolute", left: 0, right: 0, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16, backgroundColor: "#FFFFFF14" }, confirmationStyle]}>
              <SFSymbol name="checkmark.seal.fill" size={20} color={MOMENT_CATEGORIES[moment.category].dark} />
              <Text style={{ flex: 1, color: "white", fontSize: 15, lineHeight: 20, fontWeight: "600" }}>Moment collected</Text>
            </Animated.View>
          </Pressable>}
        </View>
        <GestureDetector gesture={makePan(true)}><View accessibilityLabel="Swipe up to dismiss Bible Moment" style={{ height: 44, alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: 38, height: 5, borderRadius: 3, backgroundColor: "#FFFFFF60" }} />
        </View></GestureDetector>
      </Animated.View></GestureDetector>}
    </GestureHandlerRootView>
  </Modal>;
}
