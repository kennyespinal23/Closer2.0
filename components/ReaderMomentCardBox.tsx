import { SkyGradient } from "./HomeSkyGradient";
import { Host, ContextMenu, Button as NativeButton } from "@expo/ui/swift-ui";
import { accessibilityLabel, tint } from "@expo/ui/swift-ui/modifiers";
import { useMomentPaper } from "./MomentPaperTheme";
import { MomentBookFoil } from "./MomentBookFoil";
import { memo, useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Alert, FlatList, BackHandler, Pressable, ScrollView, Share, Text, View, useWindowDimensions } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue, type SharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
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

const spring = { damping: 24, stiffness: 380, mass: 0.65 };

export { MomentCollectibleDetail as ReaderMomentDetail } from "./MomentCollectible";
import { MomentCollectibleDetail as ReaderMomentDetail, MomentCollectibleFront } from "./MomentCollectible";

function TrayCard({ moment, index, earned, activeIndex, hidden, onOpen }: { moment: BibleMoment; index: number; earned: boolean; activeIndex: SharedValue<number>; hidden: boolean; onOpen: (frame: CardFrame) => void }) {
  const { ink, muted, paper, canvas, empty, border, divider, dark } = useMomentPaper();
  const ref = useRef<View>(null);
  const touch = useRef({ x: 0, y: 0, moved: false });
  const reduced = useReducedMotion();
  const rise = useSharedValue(reduced ? 1 : 0);
  const lift = useDerivedValue(() => {
    const target = activeIndex.value === index && earned ? 1 : 0;
    return reduced ? target : withSpring(target, spring);
  });
  useEffect(() => { rise.value = reduced ? 1 : withDelay(Math.min(index, 4) * 25, withSpring(1, spring)); }, []);
  const style = useAnimatedStyle(() => ({ opacity: hidden ? 0 : rise.value, zIndex: activeIndex.value === index && earned ? 4 : index === 0 ? 1 : 0, transform: [{ translateY: 24 * (1 - rise.value) - lift.value * 22 }, { rotate: `${((index * 7) % 5 - 2) * 1.6 * (1 - lift.value)}deg` }] }));
  return <Animated.View ref={ref} collapsable={false} style={[{ width: 106, height: 148, marginLeft: index ? -26 : 0, borderRadius: 10, backgroundColor: earned ? paper : empty, borderWidth: 2, borderColor: border, overflow: "hidden", boxShadow: "0 6px 12px #3C1E0A40" }, style]}>
    <Pressable accessibilityRole="button" accessibilityLabel={earned ? `Open ${moment.title}` : `Undiscovered ${MOMENT_CATEGORIES[moment.category].name} Moment`} accessibilityState={{ disabled: !earned }} onTouchStart={e => { touch.current = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, moved: false }; }} onTouchMove={e => { if (Math.abs(e.nativeEvent.pageX - touch.current.x) + Math.abs(e.nativeEvent.pageY - touch.current.y) > 10) touch.current.moved = true; }} onPressIn={() => { activeIndex.value = index; }} onPress={event => { const distance = Math.abs(event.nativeEvent.pageX - touch.current.x) + Math.abs(event.nativeEvent.pageY - touch.current.y); if (earned && !touch.current.moved && distance < 10) ref.current?.measureInWindow((x, y, width, height) => onOpen({ x: x + width / 2 - 53, y: y + height / 2 - 74 - 22 * (1 - lift.value), width: 106, height: 148 })); }} style={{ flex: 1 }}>
      {earned ? <MomentCollectibleFront moment={moment} compact /> : <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 8, gap: 12 }}><Text style={{ fontSize: 36, color: muted }}>?</Text><Text style={{ fontSize: 12, color: muted, textAlign: "center" }}>{MOMENT_CATEGORIES[moment.category].name}</Text></View>}
    </Pressable>
  </Animated.View>;
}

const CardTray = memo(function CardTray({ moments, collected, selectedId, onOpen, showFoil, onFoil }: { showFoil: boolean; onFoil: (id: string) => void; moments: BibleMoment[]; collected: Set<string>; selectedId?: string; onOpen: (m: BibleMoment, frame: CardFrame) => void }) {
  const { ink, muted, paper, canvas, empty, border, divider, dark } = useMomentPaper();
  const activeIndex = useSharedValue(-1);
  const scroll = useAnimatedScrollHandler(event => {
    activeIndex.value = Math.min(moments.length - 1, Math.round(event.contentOffset.x / 80) + 1);
  });
  return <View style={{ marginTop: 20 }}>
    <View style={{ flexDirection: "row", alignItems: "baseline", paddingHorizontal: 16 }}><Text style={{ ...systemText.headline, flex: 1, color: ink }}>{findBookById(moments[0].bookId)?.name}</Text><Text style={{ ...systemText.caption1, color: muted }}>{moments.filter(m => collected.has(m.id)).length} / {moments.length}</Text></View>
    {showFoil && <View accessibilityRole="progressbar" accessibilityLabel={`${findBookById(moments[0].bookId)?.name} silver foil progress`} accessibilityValue={{ min: 0, max: moments.length, now: moments.filter(m => collected.has(m.id)).length }} style={{ height: 3, marginHorizontal: 16, marginTop: 10, backgroundColor: divider, borderRadius: 2, overflow: "hidden" }}><View style={{ height: 3, width: `${moments.filter(m => collected.has(m.id)).length / moments.length * 100}%`, backgroundColor: "#B3BDC9" }} /></View>}
    <Animated.ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEventThrottle={16} onScroll={scroll} contentContainerStyle={{ paddingTop: 38, paddingHorizontal: 18, paddingBottom: 16 }}>
      {moments.map((m, i) => <TrayCard key={m.id} moment={m} index={i} earned={collected.has(m.id)} activeIndex={activeIndex} hidden={selectedId === m.id} onOpen={frame => onOpen(m, frame)} />)}
      {showFoil && <View style={{ marginLeft: 12 }}><MomentBookFoil name={findBookById(moments[0].bookId)?.name ?? "Book"} earned={BIBLE_MOMENTS.filter(m => m.bookId === moments[0].bookId).every(m => collected.has(m.id))} onPress={() => onFoil(moments[0].bookId)} /></View>}
    </Animated.ScrollView>
    <LinearGradient pointerEvents="none" colors={["#BF8A52", "#8E5A2E"]} style={{ height: 26, marginTop: -26, marginHorizontal: 8, borderTopWidth: 1, borderColor: "#E7B47A", borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }} />
  </View>;
});

export function ReaderMomentCardBox({ bookId, pocketRef, onClose }: { bookId: string; pocketRef: RefObject<View | null>; onClose: () => void }) {
  const { ink, muted, paper, canvas, empty, border, divider, dark } = useMomentPaper();
  const { width, height } = useWindowDimensions(), insets = useSafeAreaInsets();
  const reduced = useReducedMotion(), { ids, hydrated, error } = useBibleMomentCollection();
  const [foilBook, setFoilBook] = useState<string | null>(null);
  const [filter, setFilter] = useState<MomentCategory | "all">("all");
  useEffect(() => {
    if (!foilBook) return;
    const handler = BackHandler.addEventListener("hardwareBackPress", () => { setFoilBook(null); return true; });
    return () => handler.remove();
  }, [foilBook]);
  const [selected, setSelected] = useState<{ moment: BibleMoment; frame: CardFrame } | null>(null);
  const progress = useSharedValue(reduced ? 1 : 0), lid = useSharedValue(0);
  const anchorX = useSharedValue(width / 2 - 35), anchorY = useSharedValue(-height / 2 + insets.top + 28);
  useEffect(() => { pocketRef.current?.measureInWindow((x, y, w, h) => { anchorX.value = x + w / 2 - width / 2; anchorY.value = y + h / 2 - height / 2; }); progress.value = reduced ? 1 : withTiming(1, { duration: 240, easing: Easing.out(Easing.cubic) }); lid.value = reduced ? 1 : withTiming(1, { duration: 360 }); }, []);
  const close = () => { progress.value = withTiming(0, { duration: reduced ? 0 : 180, easing: Easing.inOut(Easing.cubic) }, done => { if (done) runOnJS(onClose)(); }); };
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, progress.value * 2), transform: [{ translateX: anchorX.value * (1 - progress.value) }, { translateY: anchorY.value * (1 - progress.value) }, { scale: .08 + progress.value * .92 }] }));
  const lidStyle = useAnimatedStyle(() => ({ transformOrigin: "top", transform: [{ perspective: 1400 }, { rotateX: `${-Math.sin(lid.value * Math.PI) * 65}deg` }] }));
  const groups = useMemo(() => {
    const grouped = new Map<string, BibleMoment[]>();
    for (const moment of BIBLE_MOMENTS) {
      if (filter !== "all" && !moment.tags.includes(filter)) continue;
      const group = grouped.get(moment.bookId) ?? [];
      group.push(moment);
      grouped.set(moment.bookId, group);
    }
    return [...grouped.entries()].sort(([a], [b]) => a === bookId ? -1 : b === bookId ? 1 : 0);
  }, [filter, bookId]);
  const collected = useMemo(() => new Set(ids), [ids]);
  const bookMoments = BIBLE_MOMENTS.filter(m => m.bookId === bookId);
  const foundInBook = bookMoments.filter(m => collected.has(m.id)).length;
  const bookName = findBookById(bookId)?.name ?? "this book";
  const openMoment = useCallback((moment: BibleMoment, frame: CardFrame) => setSelected({ moment, frame }), []);
  const openFoil = useCallback((id: string) => {
    const all = BIBLE_MOMENTS.filter(m => m.bookId === id), found = all.filter(m => collected.has(m.id)).length;
    if (all.length && found === all.length) setFoilBook(id);
    else Alert.alert(`${findBookById(id)?.name} silver foil`, `Discover ${all.length - found} more ${all.length - found === 1 ? "Moment" : "Moments"} in this book to unlock its silver foil card.`);
  }, [collected]);
  return <View style={{ position: "absolute", inset: 0 }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Close card box" onPress={close} style={{ position: "absolute", inset: 0 }} />
    <Animated.View style={[{ position: "absolute", left: 10, right: 14, top: insets.top + 10, bottom: insets.bottom + 16, borderRadius: 18, backgroundColor: "#9C6536", padding: 10, boxShadow: "0 25px 50px #00000077" }, style]}>
      <Animated.View style={[{ height: 58, margin: -10, marginBottom: 8, zIndex: 3 }, lidStyle]}><LinearGradient colors={["#D29A62", "#9C6536", "#7A4C26"]} style={{ flex: 1, borderTopLeftRadius: 18, borderTopRightRadius: 18, paddingLeft: 16, paddingRight: 8, flexDirection: "row", alignItems: "center" }}><LinearGradient colors={["#F1D08C", "#C99A4B"]} style={{ minWidth: 150, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 }}><Text style={{ ...systemText.headline, color: "#3A2410" }}>Bible Moments</Text></LinearGradient><View style={{ flex: 1 }} /><Pressable accessibilityRole="button" accessibilityLabel="Close card box" onPress={close} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#2A140540", alignItems: "center", justifyContent: "center" }}><SFSymbol name="xmark" size={18} color="#FBF1E4" /></Pressable></LinearGradient></Animated.View>
      <View pointerEvents="none" style={{ position: "absolute", left: 10, right: 10, top: 58, bottom: 10, borderRadius: 8, overflow: "hidden" }}><SkyGradient /></View>
      <FlatList data={hydrated && !error ? groups : []} keyExtractor={item => item[0]} initialNumToRender={2} maxToRenderPerBatch={1} windowSize={3} updateCellsBatchingPeriod={80} style={{ flex: 1, backgroundColor: "transparent", borderRadius: 8 }} contentContainerStyle={{ paddingVertical: 22 }} ListHeaderComponent={<View>
        <View style={{ paddingHorizontal: 16, gap: 8 }}>
          <Text accessibilityRole="header" style={{ ...systemText.title1, fontWeight: "700", color: ink }}>Your Moments</Text>
          <Text style={{ ...systemText.footnote, color: muted }}>{error ? "Your collection couldn’t load." : !hydrated ? "Loading your collection…" : `${ids.length} of ${BIBLE_MOMENTS.length} found across the Bible`}</Text>
          {bookMoments.length > 0 && <View style={{ marginTop: 12, marginBottom: 12, padding: 16, borderRadius: 20, backgroundColor: dark ? "#100E0B" : "#EDE1CE", flexDirection: "row", alignItems: "center", gap: 14 }}>
            <MomentBookFoil name={bookName} earned={foundInBook === bookMoments.length} width={44} onPress={() => openFoil(bookId)} />
            <View style={{ flex: 1, gap: 6 }}><Text style={{ ...systemText.subheadline, fontWeight: "600", color: ink }}>{foundInBook === bookMoments.length ? `${bookName} foil unlocked` : `Find all ${bookMoments.length} in ${bookName}`}</Text><Text style={{ ...systemText.caption1, color: muted }}>{foundInBook === bookMoments.length ? "Every Moment, found." : `${bookMoments.length - foundInBook} to go for the silver foil card`}</Text><View style={{ height: 5, borderRadius: 3, backgroundColor: divider, overflow: "hidden", marginTop: 4 }}><View style={{ height: 5, width: `${foundInBook / bookMoments.length * 100}%`, backgroundColor: "#C6CBD0" }} /></View></View>
          </View>}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 8 }}>
          {(["all", ...Object.keys(MOMENT_CATEGORIES)] as (MomentCategory | "all")[]).map(category => <Pressable key={category} accessibilityRole="button" accessibilityState={{ selected: category === filter }} onPress={() => setFilter(category)} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 14, borderRadius: 12, borderBottomLeftRadius: 3, backgroundColor: filter === category ? "#FF5A36" : dark ? "#352D1D" : "#E8D8BA" }}><Text style={{ ...systemText.footnote, fontWeight: "600", color: filter === category ? "#FFFFFF" : muted }}>{category === "all" ? "All" : MOMENT_CATEGORIES[category].name} {category === "all" ? ids.length : BIBLE_MOMENTS.filter(m => m.tags.includes(category) && collected.has(m.id)).length}</Text></Pressable>)}
        </ScrollView>
        {hydrated && !error && ids.length === 0 && <Text style={{ ...systemText.footnote, color: muted, paddingHorizontal: 16, paddingTop: 12 }}>Tap a glowing verse to collect your first Moment.</Text>}
        {error && <Pressable onPress={() => void hydrateBibleMoments()} style={{ padding: 16 }}><Text style={{ color: ink }}>Try again</Text></Pressable>}
      </View>} renderItem={({ item: [, moments] }) => <CardTray showFoil={filter === "all"} onFoil={openFoil} moments={moments} collected={collected} selectedId={moments.some(m => m.id === selected?.moment.id) ? selected?.moment.id : undefined} onOpen={openMoment} />}
      ListFooterComponent={<Text style={{ ...systemText.footnote, color: muted, padding: 20, lineHeight: 21 }}>Every card you find while reading ends up here. Question marks show what kind of Moment is waiting, never what it is.</Text>} />
    </Animated.View>
    {foilBook && <View accessibilityViewIsModal style={{ position: "absolute", inset: 0, zIndex: 6, backgroundColor: "#000000BB", justifyContent: "center", alignItems: "center", gap: 24 }}><MomentBookFoil name={findBookById(foilBook)?.name ?? "Book"} earned width={220} /><Text style={{ ...systemText.title2, color: "#FFFFFF" }}>Every Moment, collected.</Text><Pressable accessibilityRole="button" onPress={() => setFoilBook(null)} style={{ padding: 16, minWidth: 160, alignItems: "center", borderRadius: 24, backgroundColor: "#FFFFFF" }}><Text style={{ ...systemText.headline, color: "#202B3D" }}>Done</Text></Pressable></View>}
    {selected && <ReaderMomentDetail moment={selected.moment} source={selected.frame} onClose={() => setSelected(null)} />}
  </View>;
}
