import { useEffect, useRef, useState, type RefObject } from "react";
import { BackHandler, Pressable, ScrollView, Share, Text, View, useWindowDimensions } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { ReaderMaterialGradient as LinearGradient } from "./ReaderMaterialGradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BIBLE_MOMENTS, MOMENT_CATEGORIES, type BibleMoment, type MomentCategory } from "@/constants/bibleMoments";
import { findBookById } from "@/constants/books";
import { hydrateBibleMoments, useBibleMomentCollection } from "@/state/bibleMoments";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { systemText } from "@/lib/typography";
import { SFSymbol } from "./Symbol";
import { ReaderMomentArt } from "./ReaderMomentArt";

export type CardFrame = { x: number; y: number; width: number; height: number };
const ink = "#2A1F18", muted = "#6F5E50";
const spring = { damping: 17, stiffness: 190, mass: 0.8 };

export function ReaderMomentDetail({ moment, source, onClose }: { moment: BibleMoment; source?: CardFrame; onClose: () => void }) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const progress = useSharedValue(reduced ? 1 : 0);
  const w = Math.min(width - 32, 360), h = Math.min(height - insets.top - insets.bottom - 32, 620);
  const x = (width - w) / 2, y = insets.top + (height - insets.top - insets.bottom - h) / 2;
  useEffect(() => { progress.value = reduced ? 1 : withSpring(1, spring); }, []);
  const dismiss = () => { progress.value = withTiming(0, { duration: reduced ? 0 : 420, easing: Easing.inOut(Easing.cubic) }, done => { if (done) runOnJS(onClose)(); }); };
  useEffect(() => { const subscription = BackHandler.addEventListener("hardwareBackPress", () => { dismiss(); return true; }); return () => subscription.remove(); }, []);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, progress.value * 3), transform: [
    { translateX: ((source ? source.x + source.width / 2 : width / 2) - width / 2) * (1 - progress.value) },
    { translateY: ((source ? source.y + source.height / 2 : height / 2 + 30) - (y + h / 2)) * (1 - progress.value) },
    { scaleX: (source?.width ?? w * .9) / w + (1 - (source?.width ?? w * .9) / w) * progress.value },
    { scaleY: (source?.height ?? h * .9) / h + (1 - (source?.height ?? h * .9) / h) * progress.value },
    { rotate: `${-4 * (1 - progress.value)}deg` },
  ] }));
  return <View accessibilityViewIsModal style={{ position: "absolute", inset: 0, zIndex: 5 }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Close Moment" onPress={dismiss} style={{ position: "absolute", inset: 0, backgroundColor: "#160D0799" }} />
    <Animated.View style={[{ position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 18, borderWidth: 2, borderColor: ink, backgroundColor: "#FFFBF4", boxShadow: "0 24px 50px #00000055" }, style]}>
      <View style={{ flex: 1, borderRadius: 16, overflow: "hidden" }} collapsable={false}>
      <ScrollView removeClippedSubviews={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20, width: w - 4 }}>
        <View style={{ height: h * .38 }}><ReaderMomentArt moment={moment} /></View>
        <View style={{ padding: 22, gap: 14 }}>
          <Text style={{ ...systemText.footnote, color: moment.tint }}>{MOMENT_CATEGORIES[moment.category].name}</Text>
          <Text accessibilityRole="header" style={{ ...systemText.title1, color: ink }}>{moment.title}</Text>
          <View style={{ borderLeftWidth: 3, borderColor: "#FF5A36", paddingLeft: 12, gap: 8 }}><Text style={{ ...systemText.body, color: ink }}>“{moment.happened}”</Text><Text style={{ ...systemText.caption1, color: muted }}>{moment.reference}</Text></View>
          <Text style={{ ...systemText.headline, color: ink }}>Why it matters</Text><Text style={{ ...systemText.body, color: muted, lineHeight: 25 }}>{moment.importance}</Text>
        </View>
      </ScrollView>
      <View style={{ flexDirection: "row", padding: 12, borderTopWidth: 1, borderColor: "#EBD9BF", gap: 8 }}><Pressable accessibilityRole="button" onPress={() => void Share.share({ message: `${moment.title}\n${moment.reference}\n\n${moment.importance}` })} style={{ flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center" }}><Text style={{ ...systemText.headline, color: ink }}>Share</Text></Pressable><Pressable accessibilityRole="button" onPress={dismiss} style={{ flex: 1, minHeight: 44, borderRadius: 14, backgroundColor: "#FF5A36", alignItems: "center", justifyContent: "center" }}><Text style={{ ...systemText.headline, color: ink }}>Done</Text></Pressable></View>
      </View>
    </Animated.View>
  </View>;
}

function TrayCard({ moment, index, earned, active, hidden, onFocus, onOpen }: { moment: BibleMoment; index: number; earned: boolean; active: boolean; hidden: boolean; onFocus: () => void; onOpen: (frame: CardFrame) => void }) {
  const ref = useRef<View>(null);
  const touch = useRef({ x: 0, y: 0, moved: false });
  const reduced = useReducedMotion();
  const rise = useSharedValue(reduced ? 1 : 0), lift = useSharedValue(0);
  useEffect(() => { rise.value = reduced ? 1 : withDelay(Math.min(index, 8) * 70, withSpring(1, spring)); }, []);
  useEffect(() => { lift.value = reduced ? (active ? 1 : 0) : withSpring(active ? 1 : 0, spring); }, [active, reduced]);
  const style = useAnimatedStyle(() => ({ opacity: hidden ? 0 : rise.value, transform: [{ translateY: 90 * (1 - rise.value) - lift.value * 22 }, { rotate: `${((index * 7) % 5 - 2) * 1.6 * (1 - lift.value)}deg` }] }));
  return <Animated.View ref={ref} collapsable={false} style={[{ width: 106, height: 148, marginLeft: index ? -26 : 0, zIndex: active ? 4 : index === 0 ? 1 : 0, borderRadius: 10, backgroundColor: earned ? "#FFFBF4" : "#F3E4CC", borderWidth: 2, borderColor: earned ? ink : "#C6A77C", overflow: "hidden", boxShadow: "0 6px 12px #3C1E0A40" }, style]}>
    <Pressable accessibilityRole="button" accessibilityLabel={earned ? `Open ${moment.title}` : `Undiscovered ${MOMENT_CATEGORIES[moment.category].name} Moment`} accessibilityState={{ disabled: !earned }} onTouchStart={e => { touch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, moved: false }; }} onTouchMove={e => { if (Math.abs(e.nativeEvent.pageX - touch.current.x) + Math.abs(e.nativeEvent.pageY - touch.current.y) > 10) touch.current.moved = true; }} onPressIn={onFocus} onPress={() => { if (earned && !touch.current.moved) ref.current?.measureInWindow((x, y, width, height) => onOpen({ x, y, width, height })); }} style={{ flex: 1 }}>
      {earned ? <View style={{ height: "58%" }}><ReaderMomentArt moment={moment} /></View> : <View style={{ height: "58%", alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 36, fontWeight: "600", color: "#AA8B64" }}>?</Text></View>}
      <Text numberOfLines={3} style={{ fontSize: 12, fontWeight: "600", lineHeight: 14, color: earned ? ink : muted, padding: 8 }}>{earned ? moment.title : MOMENT_CATEGORIES[moment.category].name}</Text>
    </Pressable>
  </Animated.View>;
}

function CardTray({ moments, collected, selectedId, onOpen }: { moments: BibleMoment[]; collected: Set<string>; selectedId?: string; onOpen: (m: BibleMoment, frame: CardFrame) => void }) {
  const [active, setActive] = useState(-1);
  return <View style={{ marginTop: 20 }}>
    <View style={{ flexDirection: "row", alignItems: "baseline", paddingHorizontal: 16 }}><Text style={{ ...systemText.headline, flex: 1, color: ink }}>{findBookById(moments[0].bookId)?.name}</Text><Text style={{ ...systemText.caption1, color: muted }}>{moments.filter(m => collected.has(m.id)).length} / {moments.length}</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEventThrottle={32} onScroll={e => { const i = Math.min(moments.length - 1, Math.round(e.nativeEvent.contentOffset.x / 80) + 1); setActive(i); }} contentContainerStyle={{ paddingTop: 38, paddingHorizontal: 18, paddingBottom: 16 }}>
      {moments.map((m, i) => <TrayCard key={m.id} moment={m} index={i} earned={collected.has(m.id)} active={active === i && collected.has(m.id)} hidden={selectedId === m.id} onFocus={() => setActive(i)} onOpen={frame => onOpen(m, frame)} />)}
    </ScrollView>
    <LinearGradient pointerEvents="none" colors={["#BF8A52", "#8E5A2E"]} style={{ height: 26, marginTop: -26, marginHorizontal: 8, borderTopWidth: 1, borderColor: "#E7B47A", borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }} />
  </View>;
}

export function ReaderMomentCardBox({ bookId, pocketRef, onClose }: { bookId: string; pocketRef: RefObject<View | null>; onClose: () => void }) {
  const { width, height } = useWindowDimensions(), insets = useSafeAreaInsets();
  const reduced = useReducedMotion(), { ids, hydrated, error } = useBibleMomentCollection();
  const [filter, setFilter] = useState<MomentCategory | "all">("all");
  const [selected, setSelected] = useState<{ moment: BibleMoment; frame: CardFrame } | null>(null);
  const progress = useSharedValue(reduced ? 1 : 0), lid = useSharedValue(0);
  const anchorX = useSharedValue(width / 2 - 35), anchorY = useSharedValue(-height / 2 + insets.top + 28);
  useEffect(() => { pocketRef.current?.measureInWindow((x, y, w, h) => { anchorX.value = x + w / 2 - width / 2; anchorY.value = y + h / 2 - height / 2; }); progress.value = reduced ? 1 : withTiming(1, { duration: 480, easing: Easing.bezier(.3, 1.2, .4, 1) }); lid.value = reduced ? 1 : withDelay(260, withTiming(1, { duration: 900 })); }, []);
  const close = () => { progress.value = withTiming(0, { duration: reduced ? 0 : 380, easing: Easing.inOut(Easing.cubic) }, done => { if (done) runOnJS(onClose)(); }); };
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, progress.value * 2), transform: [{ translateX: anchorX.value * (1 - progress.value) }, { translateY: anchorY.value * (1 - progress.value) }, { scale: .08 + progress.value * .92 }] }));
  const lidStyle = useAnimatedStyle(() => ({ transformOrigin: "top", transform: [{ perspective: 1400 }, { rotateX: `${-Math.sin(lid.value * Math.PI) * 65}deg` }] }));
  const matching = BIBLE_MOMENTS.filter(m => filter === "all" || m.tags.includes(filter));
  const books = [...new Set(matching.map(m => m.bookId))].sort((a, b) => a === bookId ? -1 : b === bookId ? 1 : 0);
  const collected = new Set(ids);
  const bookMoments = BIBLE_MOMENTS.filter(m => m.bookId === bookId);
  const bookCollected = bookMoments.filter(m => collected.has(m.id)).length;
  return <View style={{ position: "absolute", inset: 0 }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Close card box" onPress={close} style={{ position: "absolute", inset: 0 }} />
    <Animated.View style={[{ position: "absolute", left: 10, right: 14, top: insets.top + 10, bottom: insets.bottom + 16, borderRadius: 18, backgroundColor: "#9C6536", padding: 10, boxShadow: "0 25px 50px #00000077" }, style]}>
      <Animated.View style={[{ height: 58, margin: -10, marginBottom: 8, zIndex: 3 }, lidStyle]}><LinearGradient colors={["#D29A62", "#9C6536", "#7A4C26"]} style={{ flex: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingLeft: 16, paddingRight: 8, flexDirection: "row", alignItems: "center" }}><LinearGradient colors={["#F1D08C", "#C99A4B"]} style={{ minWidth: 150, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 }}><Text style={{ ...systemText.headline, color: "#3A2410" }}>Bible Moments</Text></LinearGradient><View style={{ flex: 1 }} /><Pressable accessibilityRole="button" accessibilityLabel="Close card box" onPress={close} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#2A140540", alignItems: "center", justifyContent: "center" }}><SFSymbol name="xmark" size={18} color="#FBF1E4" /></Pressable></LinearGradient></Animated.View>
      <ScrollView style={{ flex: 1, backgroundColor: "#FBF1E4", borderRadius: 8 }} contentContainerStyle={{ paddingVertical: 22 }}>
        <View style={{ paddingHorizontal: 16, gap: 6 }}><Text style={{ ...systemText.title1, color: ink }}>Your Moments</Text><Text style={{ ...systemText.subheadline, color: muted }}>{error ? "Your collection couldn’t load." : !hydrated ? "Loading your collection…" : `${ids.length} of ${BIBLE_MOMENTS.length} discovered`}</Text></View>
        {!!bookMoments.length && <View style={{ marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 16, backgroundColor: "#FFFBF4", flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 3, borderColor: "#EBD2A0" }}><View style={{ width: 44, height: 58, borderRadius: 7, overflow: "hidden", borderWidth: 1, borderColor: "#D1B893" }}><ReaderMomentArt moment={bookMoments[0]} /></View><View style={{ flex: 1, gap: 6 }}><Text style={{ ...systemText.subheadline, fontWeight: "600", color: ink }}>{findBookById(bookId)?.name} collection</Text><Text style={{ ...systemText.caption1, color: muted }}>{bookCollected} of {bookMoments.length} Moments discovered</Text><View style={{ height: 7, borderRadius: 4, backgroundColor: "#EBD9BF", overflow: "hidden" }}><View style={{ height: 7, width: `${bookCollected / bookMoments.length * 100}%`, borderRadius: 4, backgroundColor: "#FF5A36" }} /></View></View></View>}
        {error && <Pressable onPress={() => void hydrateBibleMoments()} style={{ padding: 16 }}><Text style={{ color: ink }}>Try again</Text></Pressable>}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 6, gap: 6 }}>{(["all", ...Object.keys(MOMENT_CATEGORIES)] as const).map(key => <Pressable key={key} accessibilityRole="button" accessibilityState={{ selected: key === filter }} onPress={() => setFilter(key as typeof filter)} style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: "center", backgroundColor: key === filter ? "#FF5A36" : "#EBD9BF", borderTopLeftRadius: 12, borderTopRightRadius: 12, borderBottomWidth: 3, borderColor: key === filter ? "#C9431F" : "#D1B893", transform: [{ translateY: key === filter ? -4 : 0 }] }}><Text style={{ ...systemText.footnote, fontWeight: "600", color: ink }}>{key === "all" ? "All" : MOMENT_CATEGORIES[key as MomentCategory].name}</Text></Pressable>)}</ScrollView>
        {hydrated && !error && books.map(id => <CardTray key={`${filter}-${id}`} moments={matching.filter(m => m.bookId === id)} collected={collected} selectedId={selected?.moment.id} onOpen={(moment, frame) => setSelected({ moment, frame })} />)}
        <Text style={{ ...systemText.footnote, color: muted, textAlign: "center", padding: 24 }}>Discover glowing verses as you read. Each Moment becomes a card to keep.</Text>
      </ScrollView>
    </Animated.View>
    {selected && <ReaderMomentDetail moment={selected.moment} source={selected.frame} onClose={() => setSelected(null)} />}
  </View>;
}
