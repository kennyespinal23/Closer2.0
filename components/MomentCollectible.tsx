import { SkyGradient } from "./HomeSkyGradient";
import { useEffect, useState, useId, useRef } from "react";
import { BackHandler, Modal, Pressable, ScrollView, Share, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useSharedValue, type SharedValue, withSpring, withTiming } from "react-native-reanimated";
import { ReaderMomentArt } from "./ReaderMomentArt";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { CardGlass } from "./CardGlass";
import { SFSymbol } from "./Symbol";
import { useMomentPaper } from "./MomentPaperTheme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { systemText } from "@/lib/typography";
import { getBookCover } from "@/constants/bookCovers";
import { findBookById } from "@/constants/books";
import type { BibleMoment } from "@/constants/bibleMoments";
import * as haptics from "@/lib/haptics";

/** Shared artwork face for the collection, reader and collectible reveal. */
export function MomentCollectibleFront({ moment, compact = false, onBook }: { moment: BibleMoment; compact?: boolean; onBook?: () => void }) {
  const gradientId = `moment${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const name = findBookById(moment.bookId)?.name ?? moment.bookId;
  const badge = <View style={{ flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderCurve: "continuous", backgroundColor: "#E2EEE026", borderWidth: 1, borderColor: "#FFFFFF26", maxWidth: "100%" }}>
    <Image source={getBookCover(moment.bookId)} style={{ width: 15, height: 21, borderRadius: 2 }} contentFit="cover" transition={0} />
    <Text numberOfLines={1} style={{ fontSize: 11, fontWeight: "500", color: "#F4F5EB", flexShrink: 1 }}>{name}</Text>
  </View>;
  return <View style={{ flex: 1, overflow: "hidden", borderRadius: compact ? 10 : 22, borderCurve: "continuous" }}>
    <View style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}><ReaderMomentArt moment={moment} /></View>
    <Svg pointerEvents="none" width="100%" height="100%" style={{ position: "absolute", top: 0, left: 0 }}><Defs><LinearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%"><Stop offset="0.38" stopColor="#071D17" stopOpacity={0} /><Stop offset="0.65" stopColor="#071D17" stopOpacity={.45} /><Stop offset="1" stopColor="#071D17" stopOpacity={.97} /></LinearGradient></Defs><Rect width="100%" height="100%" fill={`url(#${gradientId})`} /></Svg>
    <View style={{ position: "absolute", bottom: compact ? 10 : 20, left: compact ? 10 : 22, right: compact ? 10 : 22, gap: 12 }}>
      <Text numberOfLines={compact ? 3 : undefined} style={{ color: "#FFFAF0", fontSize: compact ? 14 : 28, lineHeight: compact ? 17 : 32, fontWeight: "700", letterSpacing: -.4 }}>{moment.title}</Text>
      {!compact && (onBook ? <Pressable accessibilityRole="button" accessibilityLabel={`Open ${name}`} onPress={onBook} style={{ alignSelf: "center", minHeight: 44, justifyContent: "center", maxWidth: "100%" }}>{badge}</Pressable> : <View style={{ alignSelf: "center", maxWidth: "100%" }}>{badge}</View>)}
    </View>
  </View>;
}

export function MomentCollectibleDetail({ moment, source, onClose }: { moment: BibleMoment; source?: { x: number; y: number; width: number; height: number }; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets(), reduced = useReducedMotion(), router = useRouter();
  const { dark } = useMomentPaper();
  const [back, setBack] = useState(false);
  const [reading, setReading] = useState(false);
  const closing = useRef(false);
  const entry = useSharedValue(reduced ? 1 : 0), rotation = useSharedValue(0), tiltX = useSharedValue(0), tiltY = useSharedValue(0), lift = useSharedValue(1);
  const dragX = useSharedValue(0), dragY = useSharedValue(0), startX = useSharedValue(0), startY = useSharedValue(0), startTiltX = useSharedValue(0), startTiltY = useSharedValue(0);
  const w = Math.min(width - 48, 340), h = Math.min(w * 1.5, height - insets.top - insets.bottom - 152);
  const y = insets.top + 64 + (height - insets.top - insets.bottom - 152 - h) / 2;
  useEffect(() => {
    entry.value = reduced ? 1 : withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    return () => { [entry, rotation, tiltX, tiltY, lift, dragX, dragY].forEach(cancelAnimation); };
  }, []);
  const dismiss = () => {
    if (closing.current) return;
    closing.current = true;
    setReading(false);
    dragX.value = withTiming(0, { duration: 160 }); dragY.value = withTiming(0, { duration: 160 });
    tiltX.value = withTiming(0, { duration: 160 }); tiltY.value = withTiming(0, { duration: 160 }); lift.value = withTiming(1, { duration: 160 });
    rotation.value = withTiming(0, { duration: reduced ? 0 : 140 });
    entry.value = withTiming(0, { duration: reduced ? 0 : 320, easing: Easing.inOut(Easing.cubic) }, done => { if (done) runOnJS(onClose)(); });
  };
  useEffect(() => { const sub = BackHandler.addEventListener("hardwareBackPress", () => { dismiss(); return true; }); return () => sub.remove(); }, []);
  const turn = () => {
    if (closing.current) return;
    const next = !back; setReading(false); setBack(next); haptics.soft();
    if (reduced) { rotation.value = next ? 180 : 0; setReading(next); }
    else rotation.value = withSpring(next ? 180 : 0, { stiffness: 190, damping: 25, mass: 1, overshootClamping: true }, finished => { if (finished) runOnJS(setReading)(next); });
  };
  const readingGesture = Gesture.Native().disallowInterruption(true);
  const settle = { damping: 29, stiffness: 280, mass: 1 };
  const pan = Gesture.Pan().enabled(!back && !reduced).minDistance(3)
    .onStart(() => {
      cancelAnimation(dragX); cancelAnimation(dragY); cancelAnimation(tiltX); cancelAnimation(tiltY);
      startX.value = dragX.value; startY.value = dragY.value; startTiltX.value = tiltX.value; startTiltY.value = tiltY.value;
      lift.value = withSpring(1.045, settle);
    })
    .onUpdate(e => {
      dragX.value = Math.max(-70, Math.min(70, startX.value + e.translationX * .45));
      dragY.value = Math.max(-60, Math.min(60, startY.value + e.translationY * .4));
      tiltX.value = Math.max(-30, Math.min(30, startTiltX.value - e.translationY * .19));
      tiltY.value = Math.max(-65, Math.min(65, startTiltY.value + e.translationX * .4));
    })
    .onEnd(e => {
      dragX.value = withSpring(0, { ...settle, velocity: e.velocityX * .45 });
      dragY.value = withSpring(0, { ...settle, velocity: e.velocityY * .4 });
      tiltX.value = withSpring(0, { ...settle, velocity: -e.velocityY * .19 });
      tiltY.value = withSpring(0, { ...settle, velocity: e.velocityX * .4 });
    })
    .onFinalize((_e, success) => {
      if (!success) { dragX.value = withSpring(0, settle); dragY.value = withSpring(0, settle); tiltX.value = withSpring(0, settle); tiltY.value = withSpring(0, settle); }
      lift.value = withSpring(1, settle);
    });
  // Match the shelf card's real bounds. The previous 92% starting scale made
  // a nearly full-size card jump across the screen from its tiny thumbnail.
  const shell = useAnimatedStyle(() => ({ opacity: reduced ? entry.value : Math.min(1, entry.value * 5), transform: [
    { translateX: (source ? source.x + source.width / 2 - width / 2 : 0) * (1 - entry.value) + dragX.value },
    { translateY: (source ? source.y + source.height / 2 - y - h / 2 : 18) * (1 - entry.value) + dragY.value },
    { scaleX: (reduced ? 1 : (source?.width ?? w * .96) / w + (1 - (source?.width ?? w * .96) / w) * entry.value) * lift.value },
    { scaleY: (reduced ? 1 : (source?.height ?? h * .96) / h + (1 - (source?.height ?? h * .96) / h) * entry.value) * lift.value },
  ] }));
  // One perspective per face; nested 3D transforms flattened the card on iOS.
  const frontStyle = useAnimatedStyle(() => ({ opacity: rotation.value < 90 ? 1 : 0, transform: [{ perspective: 1100 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${rotation.value + tiltY.value}deg` }] }));
  const backStyle = useAnimatedStyle(() => ({ zIndex: reading ? 2 : 0, opacity: rotation.value >= 90 ? 1 : 0, transform: reading ? [] : [{ perspective: 1100 }, { rotateX: `${tiltX.value}deg` }, { rotateY: `${rotation.value - 180 + tiltY.value}deg` }] }));
  const backdropStyle = useAnimatedStyle(() => ({ opacity: entry.value }));
  const face = { position: "absolute" as const, top: 0, bottom: 0, left: 0, right: 0, borderRadius: 22, borderCurve: "continuous" as const, borderWidth: 1, borderColor: "#D9C9A788", overflow: "hidden" as const, backgroundColor: dark ? "#302626" : "#FFF7ED", boxShadow: "0 14px 26px #00000044, 0 2px 0 #A3987C" };
  const ink = dark ? "#FAF6E9" : "#213A2B", muted = dark ? "#BECEC0" : "#4B6150";
  return <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={dismiss}><GestureHandlerRootView style={{ flex: 1 }}><View accessibilityViewIsModal style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, zIndex: 10 }}>
    <Animated.View style={[{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }, backdropStyle]}><Pressable accessibilityRole="button" accessibilityLabel="Close Moment" onPress={dismiss} style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, }}><SkyGradient /></Pressable></Animated.View>
    <View style={{ position: "absolute", top: insets.top + 8, left: 24, right: 24, flexDirection: "row", justifyContent: "space-between" }}>
      <MomentControl label="Close Moment" symbol="xmark" onPress={dismiss} />
      <MomentControl label="Share Moment" symbol="square.and.arrow.up" onPress={() => { void Share.share({ message: `${moment.title}\n${moment.reference}\n\n${moment.happened}\n\n${moment.importance}` }).catch(() => {}); }} />
    </View>
    <Animated.View style={[{ position: "absolute", left: (width - w) / 2, top: y, width: w, height: h, borderRadius: 22 }, shell]}>
      <GestureDetector gesture={pan}><Animated.View pointerEvents={back ? "none" : "auto"} accessibilityElementsHidden={back} importantForAccessibility={back ? "no-hide-descendants" : "auto"} style={[face, frontStyle]}>
        <MomentCollectibleFront moment={moment} onBook={() => { onClose(); router.push({ pathname: "/book/[id]", params: { id: moment.bookId } }); }} />
        <CardSheen tiltX={tiltX} tiltY={tiltY} rotation={rotation} />
        <CardFinish />
      </Animated.View></GestureDetector>
      <Animated.View pointerEvents={back ? "auto" : "none"} accessibilityElementsHidden={!back} importantForAccessibility={!back ? "no-hide-descendants" : "auto"} style={[face, backStyle, reading && { transform: [], opacity: 1, zIndex: 2 }]}>
        <GestureDetector gesture={readingGesture}><ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ padding: 24, paddingBottom: 32, gap: 16 }} nestedScrollEnabled showsVerticalScrollIndicator indicatorStyle={dark ? "white" : "black"}>
          <Text style={{ ...systemText.footnote, color: muted }}>{moment.reference}</Text>
          <Text accessibilityRole="header" style={{ ...systemText.title2, fontWeight: "700", color: ink }}>{moment.title}</Text>
          <Text style={{ ...systemText.body, lineHeight: 25, color: muted }}>“{moment.happened}”</Text>
          <Text style={{ ...systemText.headline, color: ink, marginTop: 6 }}>Why it matters</Text>
          <Text style={{ ...systemText.body, lineHeight: 25, color: ink }}>{moment.importance}</Text>
          <Text style={{ ...systemText.caption2, color: muted, paddingTop: 12 }}>Closer · Bible Moments</Text>
        </ScrollView></GestureDetector>
        <CardFinish subtle />
      </Animated.View>
    </Animated.View>
    <Pressable accessibilityRole="button" onPress={turn} style={{ position: "absolute", top: y + h + 24, alignSelf: "center", minHeight: 48, paddingHorizontal: 24, borderRadius: 24, borderCurve: "continuous", backgroundColor: dark ? "#EEE8D6" : "#213A2B", alignItems: "center", justifyContent: "center", opacity: 1 }}><Text style={{ ...systemText.headline, color: dark ? "#30362A" : "#FFFFFF" }}>{back ? "Return to artwork" : "Read the meaning"}</Text></Pressable>
  </View></GestureHandlerRootView></Modal>;
}

function MomentControl({ label, symbol, onPress }: { label: string; symbol: "xmark" | "square.and.arrow.up"; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={{ width: 44, height: 44, borderRadius: 22, borderCurve: "continuous", overflow: "hidden", alignItems: "center", justifyContent: "center", opacity: 1 }}><CardGlass tint="#263D30" /><SFSymbol name={symbol} size={19} color="#FFFFFF" /></Pressable>;
}

/** Stationary edge lighting stays away from the reading surface. */
function CardFinish({ subtle = false }: { subtle?: boolean }) {
  const id = `edge${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  return <View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0 }}>
    <Svg width="100%" height="100%"><Defs><LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%"><Stop offset="0" stopColor="#FFFFFF" stopOpacity={subtle ? .25 : .65} /><Stop offset=".4" stopColor="#FFFFFF" stopOpacity={.06} /><Stop offset="1" stopColor="#C9B98D" stopOpacity={.45} /></LinearGradient></Defs><Rect x="1" y="1" width="99%" height="99%" rx="21" fill="none" stroke={`url(#${id})`} strokeWidth="1.5" /></Svg>
  </View>;
}

/** A narrow clear-coat reflection, driven entirely by the gesture worklet. */
function CardSheen({ tiltX, tiltY, rotation }: { tiltX: SharedValue<number>; tiltY: SharedValue<number>; rotation: SharedValue<number> }) {
  const { width } = useWindowDimensions();
  const span = Math.min(width - 48, 340) + 360;
  const id = `gloss${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const reflection = useAnimatedStyle(() => ({
    opacity: .65 + Math.min(.25, Math.abs(tiltY.value) / 100),
    transform: [{ translateX: tiltY.value * 2.8 + Math.sin(rotation.value * Math.PI / 180) * 90 }, { translateY: tiltX.value * 1.5 }, { rotate: `${-22 + tiltX.value * .3}deg` }],
  }));
  return <View pointerEvents="none" style={{ position: "absolute", top: 0, bottom: 0, left: 0, right: 0, overflow: "hidden", borderRadius: 22 }}>
    <Animated.View style={[{ position: "absolute", left: -180, top: -160, width: span, height: span + 320 }, reflection]}>
      <Svg width="100%" height="100%"><Defs><LinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
        <Stop offset="30%" stopColor="#FFFFFF" stopOpacity={0} />
        <Stop offset="43%" stopColor="#FFFFFF" stopOpacity={.05} />
        <Stop offset="48%" stopColor="#FFFFFF" stopOpacity={.38} />
        <Stop offset="49.5%" stopColor="#FFFFFF" stopOpacity={.72} />
        <Stop offset="51.5%" stopColor="#FFFFFF" stopOpacity={.12} />
        <Stop offset="59%" stopColor="#FFFFFF" stopOpacity={0} />
      </LinearGradient></Defs><Rect width="100%" height="100%" fill={`url(#${id})`} /></Svg>
    </Animated.View>
  </View>;
}
