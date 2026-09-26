import { MomentCollectibleFront } from "./MomentCollectible";
import { useEffect, useRef, useState, type RefObject } from "react";
import { AccessibilityInfo, BackHandler, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withTiming } from "react-native-reanimated";
import { ReaderMomentArt } from "./ReaderMomentArt";
import { ReaderMomentCardBox, ReaderMomentDetail } from "./ReaderMomentCardBox";
import Svg, { Path, Rect } from "react-native-svg";
import { ReaderMaterialGradient as LinearGradient } from "./ReaderMaterialGradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useColors } from "@/state/theme";
import { useBibleMomentCollection, unlockBibleMomentWithRewards } from "@/state/bibleMoments";
import { type BibleMoment, type MomentCategory } from "@/constants/bibleMoments";
import { systemText } from "@/lib/typography";
import { SFSymbol } from "@/components/Symbol";
import { MomentCategoryReward } from "@/components/MomentCategoryReward";
import * as haptics from "@/lib/haptics";

export function ReaderMomentExperience({ moment, onFinish, pocketRef, showcase, onCloseShowcase, bookId, onCollected, origin }: {
  origin: { x: number; y: number; width: number; height: number } | null;
  moment: BibleMoment | null; onFinish: () => void; pocketRef: RefObject<View | null>;
  showcase: boolean; onCloseShowcase: () => void; bookId: string; onCollected: () => void;
}) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [selected, setSelected] = useState<BibleMoment | null>(null);
  const [saveError, setSaveError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [rewards, setRewards] = useState<MomentCategory[]>([]);
  const alive = useRef(0);
  const reveal = useSharedValue(0);
  const flip = useSharedValue(0);
  const rays = useSharedValue(0);
  const flight = useSharedValue(0);
  const stamp = useSharedValue(0);
  const targetX = useSharedValue(0);
  const targetY = useSharedValue(0);
  const cardWidth = Math.min(250, width - 80);
  const cardHeight = Math.min(cardWidth * 1.38, height - insets.top - insets.bottom - 120);
  const arrived = () => { onCollected(); haptics.success(); AccessibilityInfo.announceForAccessibility("Bible Moment added to your card box"); onFinish(); };
  const animated = useAnimatedStyle(() => ({ opacity: 1 - flight.value * 0.5, transform: [
    { translateX: (origin ? origin.x + origin.width / 2 - width / 2 : 0) * (1 - reveal.value) + targetX.value * flight.value },
    { translateY: (origin ? origin.y + origin.height / 2 - height / 2 : 0) * (1 - reveal.value) + targetY.value * flight.value - Math.sin(flight.value * Math.PI) * 38 },
    { scaleX: (1 + ((origin?.width ?? cardWidth) / cardWidth - 1) * (1 - reveal.value)) * (1 - 0.92 * flight.value) },
    { scaleY: (1 + ((origin?.height ?? cardHeight) / cardHeight - 1) * (1 - reveal.value)) * (1 - 0.92 * flight.value) },
    { rotate: `${flight.value * 20 - Math.sin(flight.value * Math.PI) * 12}deg` },
  ] }));
  const rayStyle = useAnimatedStyle(() => ({ opacity: Math.sin(rays.value * Math.PI) * .5, transform: [{ scale: .4 + rays.value * .7 }, { rotate: `${rays.value * 40}deg` }] }));
  const front = useAnimatedStyle(() => ({ backfaceVisibility: "hidden", transform: [{ perspective: 1000 }, { rotateY: `${-180 + flip.value * 180}deg` }] }));
  const back = useAnimatedStyle(() => ({ backfaceVisibility: "hidden", transform: [{ perspective: 1000 }, { rotateY: `${flip.value * 180}deg` }] }));
  const stamped = useAnimatedStyle(() => ({ opacity: stamp.value, transform: [{ scale: 2.6 - stamp.value * 1.6 }, { rotate: `${-30 + stamp.value * 22}deg` }] }));
  useEffect(() => {
    if (!moment) return;
    const generation = ++alive.current;
    setSaveError(false); reveal.value = reduced ? 1 : 0; flip.value = 0; rays.value = 0; flight.value = 0; stamp.value = 0;
    pocketRef.current?.measureInWindow((x, y, w, h) => { targetX.value = x + w / 2 - width / 2; targetY.value = y + h / 2 - height / 2; });
    targetX.value = width / 2 - 30; targetY.value = insets.top + 28 - height / 2;
    void unlockBibleMomentWithRewards(moment.id).then(result => {
      if (generation !== alive.current) return;
      setRewards(result.categories);
      if (result.status === "existing") { setSelected(moment); onFinish(); return; }
      if (reduced) { reveal.value = 1; flip.value = 1; stamp.value = 1; flight.value = withDelay(900, withTiming(1, { duration: 0 }, done => { if (done) runOnJS(arrived)(); })); return; }
      rays.value = withDelay(280, withTiming(1, { duration: 1000 }));
      reveal.value = withTiming(1, { duration: 320, easing: Easing.bezier(.3, 1.2, .4, 1) });
      flip.value = withDelay(280, withTiming(1, { duration: 460, easing: Easing.bezier(.3, 1.2, .4, 1) }));
      stamp.value = withDelay(700, withTiming(1, { duration: 260, easing: Easing.bezier(.3, 1.35, .4, 1) }));
      flight.value = withDelay(1400, withTiming(1, { duration: 460, easing: Easing.inOut(Easing.cubic) }, done => { if (done) runOnJS(arrived)(); }));
    }).catch(() => { if (generation === alive.current) setSaveError(true); });
    return () => { alive.current++; cancelAnimation(reveal); cancelAnimation(flip); cancelAnimation(flight); cancelAnimation(stamp); cancelAnimation(rays); };
  }, [moment?.id, attempt]);
  const close = () => { if (moment) onFinish(); else if (selected) setSelected(null); else if (rewards.length) setRewards([]); else onCloseShowcase(); };
  useEffect(() => {
    if (!moment && !showcase && !selected && !rewards.length) return;
    const handler = BackHandler.addEventListener("hardwareBackPress", () => { close(); return true; });
    return () => handler.remove();
  }, [moment, showcase, selected, rewards.length]);
  if (!moment && !showcase && !selected && !rewards.length) return null;
  return <View accessibilityViewIsModal style={{ position: "absolute", inset: 0, zIndex: 210 }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Close Moments" onPress={close} style={{ position: "absolute", inset: 0, backgroundColor: "#00000077" }} />
    {moment ? <>
      <Animated.View pointerEvents="none" style={[{ position: "absolute", left: width / 2 - 240, top: height / 2 - 240, width: 480, height: 480 }, rayStyle]}><Svg width="480" height="480" viewBox="0 0 480 480">{Array.from({ length: 12 }, (_, i) => <Path key={i} d="M240 240L218 0H262Z" fill="#FFC56B" transform={`rotate(${i * 30} 240 240)`} />)}</Svg></Animated.View>
      <Animated.View style={[{ position: "absolute", left: (width - cardWidth) / 2, top: (height - cardHeight) / 2, width: cardWidth, height: cardHeight }, animated]}>
        <Animated.View style={[{ position: "absolute", inset: 0, backgroundColor: colors.surface, borderRadius: 22, borderWidth: 2, borderColor: "#A97B42", alignItems: "center", justifyContent: "center", padding: 24 }, back]}><SFSymbol name="rectangle.stack" size={44} color={colors.ink} /><Text style={{ ...systemText.title2, color: colors.ink, textAlign: "center", marginTop: 20 }}>{saveError ? "Couldn’t collect this Moment" : moment.title}</Text>{saveError && <Pressable accessibilityRole="button" onPress={() => setAttempt(attempt + 1)} style={{ minHeight: 48, justifyContent: "center" }}><Text style={{ ...systemText.headline, color: colors.ink }}>Try again</Text></Pressable>}</Animated.View>
        <Animated.View style={[{ position: "absolute", inset: 0, borderRadius: 22, overflow: "hidden", backgroundColor: colors.surface, borderWidth: 2, borderColor: "#A97B42" }, front]}>
          <MomentCollectibleFront moment={moment} />

        </Animated.View>
        <Animated.View pointerEvents="none" style={[{ position: "absolute", bottom: -18, right: -18, width: 76, height: 76, borderRadius: 38, borderWidth: 3, borderColor: "#C9431F", overflow: "hidden", boxShadow: "0 4px 8px #00000044" }, stamped]}><LinearGradient colors={["#FF8B64", "#FF5A36", "#C9431F"]} style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 3 }}><SFSymbol name="checkmark" size={23} color="#FFF0DB" /><Text style={{ fontSize: 8, fontWeight: "800", letterSpacing: .5, color: "#FFF0DB" }}>COLLECTED</Text></LinearGradient></Animated.View>
      </Animated.View>
      <Pressable accessibilityRole="button" accessibilityLabel="Return to reading" onPress={onFinish} style={{ position: "absolute", top: insets.top + 12, left: 20, width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><SFSymbol name="xmark" size={20} color="white" /></Pressable>
    </> : selected ? <ReaderMomentDetail moment={selected} onClose={() => setSelected(null)} /> : rewards.length ? <View style={{ position: "absolute", top: insets.top + 24, left: 20, right: 20, backgroundColor: colors.surface, borderRadius: 24, padding: 20 }}><ScrollView>{rewards.map(category => <MomentCategoryReward key={category} category={category} expanded />)}<Pressable onPress={close} style={{ minHeight: 48, alignItems: "center", justifyContent: "center" }}><Text style={{ ...systemText.headline, color: colors.ink }}>Done</Text></Pressable></ScrollView></View> : <ReaderMomentCardBox bookId={bookId} pocketRef={pocketRef} onClose={onCloseShowcase} />}
  </View>;
}

export function ReaderMomentPocket({ onPress, arrival, collecting }: { onPress: () => void; arrival: number; collecting?: boolean }) {
  const colors = useColors();
  const { ids } = useBibleMomentCollection();
  const reduced = useReducedMotion();
  const scale = useSharedValue(1);
  const [displayCount, setDisplayCount] = useState(ids.length);
  useEffect(() => { if (!collecting) setDisplayCount(ids.length); }, [ids.length, collecting, arrival]);
  useEffect(() => { if (arrival && !reduced) scale.value = withSequence(withTiming(1.25, { duration: 180 }), withTiming(1, { duration: 320 })); }, [arrival, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }, { rotate: `${(scale.value - 1) * -24}deg` }] }));
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open your Bible Moments card box, ${displayCount} collected`} onPress={onPress} style={{ width: 44, height: 44, justifyContent: "center", alignItems: "center" }}>
    <Animated.View style={style}><Svg width={26} height={28} viewBox="0 0 26 28"><Rect x="3" y="4" width="17" height="22" rx="3" fill="#FFFBF4" stroke="#2A1F18" strokeWidth="2" transform="rotate(-10 11 15)" /><Rect x="8" y="2" width="17" height="22" rx="3" fill="#FF5A36" stroke="#2A1F18" strokeWidth="2" transform="rotate(8 16 13)" /></Svg>{displayCount > 0 && <View style={{ position: "absolute", top: -7, right: -9, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 3, backgroundColor: "#52B3F6", alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#12304A", fontSize: 10, fontWeight: "700" }}>{displayCount}</Text></View>}</Animated.View>
  </Pressable>;
}

export function ReaderRibbon() {
  const reduced = useReducedMotion();
  const swing = useSharedValue(0);
  useEffect(() => { swing.value = reduced ? 0 : withDelay(1200, withSequence(withTiming(12, { duration: 350 }), withTiming(-6, { duration: 550 }), withTiming(3, { duration: 550 }), withTiming(0, { duration: 750 }))); }, [reduced]);
  const style = useAnimatedStyle(() => ({ transformOrigin: "top", transform: [{ rotate: `${swing.value}deg` }] }));
  return <Animated.View pointerEvents="none" accessible={false} style={[{ position: "absolute", top: -4, right: 34, width: 14, height: 92 }, style]}><Svg width="14" height="92" viewBox="0 0 14 92"><Path d="M0 0H14V92L7 79L0 92Z" fill="#FF5A36" /><Path d="M2 0V87M12 0V87" stroke="#E0431E" strokeWidth="1" /></Svg></Animated.View>;
}
