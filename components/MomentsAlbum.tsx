import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { Easing, Extrapolation, cancelAnimation, interpolate, runOnJS, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { Text } from "@/components/CloserText";
import { CloseButton } from "@/components/CloseButton";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { ReaderMomentArt } from "@/components/ReaderMomentArt";
import { SFSymbol } from "@/components/Symbol";
import { TiltedBook, bookCoverColor } from "@/components/TiltedBook";
import { BibleMomentReveal } from "@/components/BibleMomentReveal";
import { type BibleMoment, type MomentCategory } from "@/constants/bibleMoments";
import { findBookById } from "@/constants/books";
import { GILT, MOMENTS_IN_ORDER, WARM_CATEGORY, WARM_CATEGORY_NAME, plateLabel } from "@/lib/momentOrder";
import { uiText } from "@/lib/typography";
import { useReducedMotion } from "@/lib/useReducedMotion";
import * as haptics from "@/lib/haptics";
import { hydrateBibleMoments, useBibleMomentCollection } from "@/state/bibleMoments";
import { useResolvedScheme } from "@/state/theme";

/**
 * Bible Moments as a collector's album. A dark cover with the newest three
 * paintings in gold frames, the count in gold, and a strip that runs from
 * Genesis to Revelation with one tick per Moment. Below, the album pages:
 * every Moment in Bible order, grouped by book. Collected ones show their
 * painting in a gilt frame with a plate number; the rest are sealed backs
 * that say where to find them.
 */
type Filter = MomentCategory | "all";
const CATEGORIES = Object.keys(WARM_CATEGORY) as MomentCategory[];
const DAY = 86_400_000;

function useAlbumTheme() {
  const dark = useResolvedScheme() === "dark";
  return { dark, page: dark ? "#1B1815" : "#FBF9F6", ink: dark ? "#F7F0E6" : "#17120F", muted: dark ? "#BBAA99" : "#6E645C", line: dark ? "#FFFFFF1F" : "#17120F1A", sheet: dark ? "#26211C" : "#FFFDFA" };
}

/** A gold frame: a lit gold gradient behind, the content inset by `edge`. */
function Gilt({ edge = 3, radius = 14, children, style }: { edge?: number; radius?: number; children: React.ReactNode; style?: object }) {
  return <View style={[{ borderRadius: radius, overflow: "hidden", padding: edge, backgroundColor: GILT[1] }, style]}>
    <ReaderMaterialGradient colors={GILT} locations={[0, .35, .55, 1]} horizontal style={StyleSheet.absoluteFill}/>
    <View style={{ flex: 1, borderRadius: radius - edge, overflow: "hidden" }}>{children}</View>
  </View>;
}

function Plate({ moment }: { moment: BibleMoment }) {
  return <View style={s.plate}><View style={[s.plateDot, { backgroundColor: WARM_CATEGORY[moment.category] }]}/><Text style={s.plateText}>{plateLabel(moment)}</Text></View>;
}

/** A sealed Moment: dark card back, dashed gold border, gold cross, its number. */
function SealedBack({ label, big = false }: { label?: string; big?: boolean }) {
  return <View style={[s.back, big && { width: 120, borderRadius: 18 }]}>
    <ReaderMaterialGradient colors={["#4A2C20", "#2E1A12"]} style={StyleSheet.absoluteFill}/>
    <View style={[s.backInner, big && { borderRadius: 12 }]}/>
    <Svg width={big ? 40 : 30} height={big ? 40 : 30} viewBox="0 0 30 30"><Circle cx={15} cy={15} r={11} fill="none" stroke="#FFC93C" strokeWidth={1.6} opacity={.7}/><Path d="M15 8.5v13M10 13h10" stroke="#FFC93C" strokeWidth={2.4} strokeLinecap="round"/></Svg>
    {!!label && <Text style={s.backNo}>{label}</Text>}
  </View>;
}

// Where each fan card rests: the newest in front, the two before it tilted out to the sides.
// The page slides up for ~400ms first; the deal waits for it so you actually see the cards fan out.
const FAN = [
  { left: -64, top: 0, width: 128, height: 172, rotate: -2, z: 2, delay: 0 },
  { left: -150, top: 26, width: 112, height: 150, rotate: -10, z: 1, delay: 140 },
  { left: 38, top: 26, width: 112, height: 150, rotate: 9, z: 1, delay: 220 },
];

/**
 * One card of the cover's fan. On open the cards start stacked in the middle
 * and deal out to their places on a soft spring. The front card then floats
 * gently and a slow shine crosses it every few seconds.
 */
function FanCard({ slot, moment, play }: { slot: number; moment?: BibleMoment; play: boolean }) {
  const reduced = useReducedMotion(), f = FAN[slot];
  const deal = useSharedValue(reduced ? 1 : 0), float = useSharedValue(0), shine = useSharedValue(0);
  useEffect(() => {
    if (!play) return;
    if (reduced) { deal.value = 1; return; }
    deal.value = withDelay(450 + f.delay, withSpring(1, { damping: 15, stiffness: 120, mass: .9 }));
    if (slot === 0) {
      float.value = withDelay(1500, withRepeat(withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }), -1, true));
      shine.value = withDelay(1700, withRepeat(withSequence(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.cubic) }), withDelay(3800, withTiming(0, { duration: 0 }))), -1));
    }
    return () => { cancelAnimation(float); cancelAnimation(shine); };
  }, [play, reduced, slot, f.delay, deal, float, shine]);
  // Start stacked on the front card's spot, smaller and flat, then spread out.
  const card = useAnimatedStyle(() => {
    const p = deal.value;
    return {
      opacity: Math.min(1, p * 2.5),
      transform: [
        { translateX: (FAN[0].left + (FAN[0].width - f.width) / 2 - f.left) * (1 - p) },
        { translateY: (f.top === 0 ? 14 : -10) * (1 - p) - 5 * float.value },
        { rotate: `${f.rotate * p}deg` },
        { scale: .86 + .14 * p },
      ],
    };
  });
  const sweep = useAnimatedStyle(() => ({ opacity: shine.value > 0 && shine.value < 1 ? 1 : 0, transform: [{ translateX: -160 + 360 * shine.value }, { rotate: "18deg" }] }));
  return <Animated.View style={[{ position: "absolute", left: "50%", marginLeft: f.left, top: f.top, width: f.width, height: f.height, zIndex: f.z, boxShadow: "0 24px 34px -18px #000000B3" }, card]}>
    {moment ? <Gilt style={{ flex: 1 }}><ReaderMomentArt moment={moment}/>
      {slot === 0 && !reduced && <Animated.View pointerEvents="none" style={[{ position: "absolute", top: -60, bottom: -60, width: 70 }, sweep]}><ReaderMaterialGradient horizontal colors={["#FFFFFF00", "#FFF7DC66", "#FFFFFF00"]} style={StyleSheet.absoluteFill}/></Animated.View>}
    </Gilt> : <SealedBack/>}
  </Animated.View>;
}

/** The gold count ticks up to the total as the cards land. */
function CountUp({ to, ready }: { to: number; ready: boolean }) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(reduced ? to : 0);
  useEffect(() => {
    if (!ready) return;
    if (reduced || to === 0) { setN(to); return; }
    let frame = 0; const start = Date.now() + 600;
    const tick = () => {
      const t = Math.min(1, Math.max(0, (Date.now() - start) / 900));
      setN(Math.round(to * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [to, ready, reduced]);
  return <Text style={s.countBig}>{ready ? n : "–"}</Text>;
}

export function MomentsAlbum({ onClose }: { onClose: () => void }) {
  const router = useRouter(), t = useAlbumTheme(), inset = useSafeAreaInsets(), { width } = useWindowDimensions();
  const { ids, collectedAt, hydrated, error } = useBibleMomentCollection();
  const [filter, setFilter] = useState<Filter>("all");
  const [open, setOpen] = useState<BibleMoment | null>(null);
  const [sealed, setSealed] = useState<BibleMoment | null>(null);
  const [foil, setFoil] = useState<string | null>(null);
  const earned = useMemo(() => new Set(ids), [ids]);
  const total = MOMENTS_IN_ORDER.length;
  const newest = useMemo(() => [...ids].sort((a, b) => (collectedAt[b] ?? 0) - (collectedAt[a] ?? 0)), [ids, collectedAt]);
  const fan = newest.slice(0, 3).map(id => MOMENTS_IN_ORDER.find(m => m.id === id)).filter((m): m is BibleMoment => !!m);
  const books = useMemo(() => {
    const map = new Map<string, BibleMoment[]>();
    for (const m of MOMENTS_IN_ORDER) map.set(m.bookId, [...(map.get(m.bookId) ?? []), m]);
    return [...map.entries()];
  }, []);
  const completeBooks = books.filter(([, ms]) => ms.every(m => earned.has(m.id))).map(([id]) => findBookById(id)?.name ?? id);
  const shown = books.map(([bookId, ms]) => [bookId, filter === "all" ? ms : ms.filter(m => m.tags.includes(filter))] as const).filter(([, ms]) => ms.length);
  const cardWidth = Math.floor((width - 40 - 24) / 3) - 1;
  const scrollY = useSharedValue(0), coverH = useSharedValue(560);
  const onScroll = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });
  const barH = inset.top + 60;
  const coverFold = useAnimatedStyle(() => {
    const p = interpolate(scrollY.value, [0, Math.max(1, coverH.value - barH)], [0, 1], Extrapolation.CLAMP);
    return { opacity: interpolate(p, [0, .7], [1, 0], Extrapolation.CLAMP), transform: [{ translateY: Math.max(0, scrollY.value) * .45 }, { scale: 1 - .1 * p }] };
  });
  const barIn = useAnimatedStyle(() => {
    const end = coverH.value - barH;
    return { opacity: interpolate(scrollY.value, [end - 60, end], [0, 1], Extrapolation.CLAMP), transform: [{ translateY: interpolate(scrollY.value, [end - 60, end], [-8, 0], Extrapolation.CLAMP) }] };
  });
  const read = (m: BibleMoment) => router.push(`/book/${m.bookId}/${m.chapter}?focus=${m.verse}` as Href);

  return <View style={{ flex: 1, backgroundColor: t.page }}>
    <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: inset.bottom + 40 }}>
      {/* the cover: its contents drift, shrink and fade as it folds away under the bar */}
      <View onLayout={e => { coverH.value = e.nativeEvent.layout.height; }} style={[s.cover, { paddingTop: inset.top + 60 }]}>
        <ReaderMaterialGradient colors={["#5A3526", "#3A2219", "#24140E"]} locations={[0, .5, 1]} style={StyleSheet.absoluteFill}/>
        <Animated.View style={coverFold}>
        <Text style={s.eyebrow}>Your Bible Moments</Text>
        <View style={s.fan} accessible={false}>
          {[1, 2, 0].map(slot => <FanCard key={slot} slot={slot} moment={fan[slot]} play={hydrated}/>)}
        </View>
        <View style={s.count} accessible accessibilityLabel={`${ids.length} of ${total} Bible Moments collected`}>
          <CountUp to={ids.length} ready={hydrated}/>
          <View style={{ flexShrink: 1 }}>
            <Text style={{ ...uiText.body, fontWeight: "800", color: "#FFF1E4" }}>of {total} collected</Text>
            <Text style={{ ...uiText.supporting, color: "#D8BDA5" }}>{completeBooks.length === 0 ? ids.length ? "Keep reading to fill your first book" : "Tap a glowing verse while you read" : completeBooks.length <= 2 ? `${completeBooks.join(" and ")} complete` : `${completeBooks.length} books complete`}</Text>
          </View>
        </View>
        <View style={s.strip} accessibilityLabel="Moments across the Bible, in order">
          {MOMENTS_IN_ORDER.map(m => <View key={m.id} style={[s.tick, earned.has(m.id) ? s.tickOn : null]}/>)}
        </View>
        <View style={s.stripLabels}><Text style={s.stripLabel}>Genesis</Text><Text style={s.stripLabel}>Revelation</Text></View>
        </Animated.View>
      </View>

      {!!error && <Pressable onPress={() => void hydrateBibleMoments()} style={{ margin: 20 }}><Text style={{ ...uiText.body, color: t.ink }}>Your collection couldn’t load. Tap to try again.</Text></Pressable>}

      {/* filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingTop: 20 }}>
        <Pressable onPress={() => setFilter("all")} accessibilityRole="button" accessibilityState={{ selected: filter === "all" }} style={[s.chip, filter === "all" ? { backgroundColor: t.ink } : { borderWidth: 1, borderColor: t.line }]}>
          <Text style={{ ...uiText.supporting, fontWeight: "800", color: filter === "all" ? t.page : t.ink }}>All <Text style={{ color: t.muted }}>{ids.length}</Text></Text>
        </Pressable>
        {CATEGORIES.map(c => {
          const inCat = MOMENTS_IN_ORDER.filter(m => m.tags.includes(c)), got = inCat.filter(m => earned.has(m.id)).length, on = filter === c;
          return <Pressable key={c} onPress={() => { haptics.tick(); setFilter(on ? "all" : c); }} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${WARM_CATEGORY_NAME[c]}, ${got} of ${inCat.length}`}
            style={[s.chip, on ? { borderWidth: 2, borderColor: t.ink } : { borderWidth: 1, borderColor: t.line }]}>
            {got === inCat.length ? <SFSymbol name="checkmark.seal.fill" size={14} color={WARM_CATEGORY[c]}/> : <View style={[s.dot, { backgroundColor: WARM_CATEGORY[c] }]}/>}
            <Text style={{ ...uiText.supporting, fontWeight: "800", color: t.ink }}>{WARM_CATEGORY_NAME[c]} <Text style={{ color: t.muted, fontWeight: "700" }}>{got}/{inCat.length}</Text></Text>
          </Pressable>;
        })}
      </ScrollView>

      {/* the album pages */}
      {hydrated && shown.map(([bookId, ms]) => {
        const book = findBookById(bookId), all = books.find(([id]) => id === bookId)?.[1] ?? ms;
        const got = all.filter(m => earned.has(m.id)).length, complete = got === all.length;
        return <View key={bookId} style={{ paddingHorizontal: 20, marginTop: 30 }}>
          <View style={s.bookHead}>
            <TiltedBook size={22} tilt={-12} color={bookCoverColor(book?.order ?? 1)}/>
            <Text style={{ ...uiText.sectionTitle, fontSize: 22, lineHeight: 26, fontWeight: "900", color: t.ink, flex: 1 }}>{book?.name ?? bookId}</Text>
            {complete ? <Pressable onPress={() => { haptics.soft(); setFoil(bookId); }} accessibilityRole="button" accessibilityLabel={`${book?.name} complete. Open the seal`} style={s.complete}>
              <View style={s.completeSeal}><SFSymbol name="checkmark" size={11} color="#6A2B10"/></View>
              <Text style={{ ...uiText.supporting, fontSize: 13, fontWeight: "800", color: "#6A2B10" }}>Complete</Text>
            </Pressable> : <Text style={{ ...uiText.supporting, fontSize: 13, fontWeight: "800", color: t.muted }}>{got} of {all.length}</Text>}
          </View>
          <View style={s.grid}>
            {ms.map(m => {
              const have = earned.has(m.id), fresh = have && Date.now() - (collectedAt[m.id] ?? 0) < DAY;
              return <Pressable key={m.id} onPress={() => { haptics.soft(); if (have) setOpen(m); else setSealed(m); }} accessibilityRole="button"
                accessibilityLabel={have ? `${m.event}, ${m.reference}. Collected. Open` : `Sealed Moment in ${book?.name} ${m.chapter}. Read there to collect it`}
                style={({ pressed }) => ({ width: cardWidth, gap: 6, opacity: pressed ? .75 : 1 })}>
                {have ? <Gilt edge={2.5} radius={14} style={{ width: cardWidth, height: cardWidth * 4 / 3, boxShadow: "0 1px 2px #502D0A14, 0 14px 24px -14px #502D0A73" }}>
                  <ReaderMomentArt moment={m}/>
                  <Plate moment={m}/>
                </Gilt> : <View style={{ width: cardWidth, height: cardWidth * 4 / 3 }}><SealedBack label={plateLabel(m)}/></View>}
                <Text numberOfLines={2} style={{ ...uiText.supporting, width: cardWidth, fontSize: 13, lineHeight: 16, fontWeight: have ? "800" : "700", color: have ? t.ink : t.muted }}>{have ? m.event : `${book?.name} ${m.chapter}`}</Text>
                {have && <Text style={{ ...uiText.supporting, fontSize: 12, lineHeight: 14, color: t.muted }}>{m.chapter}:{m.verse}{fresh ? " · New" : ""}</Text>}
              </Pressable>;
            })}
          </View>
        </View>;
      })}
    </Animated.ScrollView>

    {/* the folded cover: a slim bar that takes over once the big one has gone */}
    <Animated.View pointerEvents="none" style={[s.bar, { height: inset.top + 60 }, barIn]}>
      <ReaderMaterialGradient colors={["#4A2C20", "#24140E"]} style={StyleSheet.absoluteFill}/>
      <View style={[s.barRow, { top: inset.top + 8 }]}>
        {fan[0] ? <Gilt edge={1.5} radius={7} style={{ width: 30, height: 40, transform: [{ rotate: "-4deg" }] }}><ReaderMomentArt moment={fan[0]}/></Gilt> : null}
        <Text style={s.barCount}>{ids.length}</Text>
        <Text style={s.barText}>of {total} collected</Text>
      </View>
    </Animated.View>
    <CloseButton onPress={onClose} color="#FFF1E4" style={[s.close, { top: inset.top + 4 }]}/>

    <SealedSheet moment={sealed} onClose={() => setSealed(null)} onRead={m => { setSealed(null); setTimeout(() => read(m), 280); }}/>
    {open && <BibleMomentReveal autoPlay request={{ collected: true, kind: "moment", moment: open }} onClose={() => setOpen(null)}/>}
    {foil && <BibleMomentReveal request={{ collected: true, kind: "silver", bookId: foil }} onClose={() => setFoil(null)}/>}
  </View>;
}

/** Tapping a sealed card: where it waits, and a way straight there. Slides up on one smooth curve. */
function SealedSheet({ moment, onClose, onRead }: { moment: BibleMoment | null; onClose: () => void; onRead: (m: BibleMoment) => void }) {
  const t = useAlbumTheme(), inset = useSafeAreaInsets(), reduced = useReducedMotion();
  const last = useRef<BibleMoment | null>(null);
  if (moment) last.current = moment;
  const [mounted, setMounted] = useState(!!moment);
  const shown = useSharedValue(0), h = useSharedValue(600);
  useEffect(() => {
    if (moment) { setMounted(true); shown.value = withTiming(1, { duration: reduced ? 150 : 380, easing: Easing.bezier(.2, .9, .25, 1) }); }
    else if (mounted) shown.value = withTiming(0, { duration: reduced ? 120 : 260, easing: Easing.in(Easing.cubic) }, done => { if (done) runOnJS(setMounted)(false); });
  }, [moment]); // eslint-disable-line react-hooks/exhaustive-deps
  const scrim = useAnimatedStyle(() => ({ opacity: shown.value }));
  const rise = useAnimatedStyle(() => reduced ? { opacity: shown.value } : { transform: [{ translateY: (1 - shown.value) * h.value }] });
  const m = moment ?? last.current;
  if (!m) return null;
  const where = `${findBookById(m.bookId)?.name ?? m.bookId} ${m.chapter}`;
  return <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#17120F52" }, scrim]}><Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1 }}/></Animated.View>
    <Animated.View onLayout={e => { h.value = e.nativeEvent.layout.height + 16; }} style={[s.sheet, { backgroundColor: t.sheet, paddingBottom: inset.bottom + 8 }, rise]}>
      <View style={[s.grab, { backgroundColor: t.line }]}/>
      <View style={{ transform: [{ rotate: "-4deg" }], width: 120, height: 160, boxShadow: "0 20px 30px -16px #28140A99" }}><SealedBack big label={plateLabel(m)}/></View>
      <Text accessibilityRole="header" style={{ ...uiText.screenTitle, fontSize: 28, lineHeight: 30, color: t.ink, marginTop: 22, textAlign: "center" }}>Still sealed</Text>
      <Text style={{ ...uiText.body, color: t.muted, textAlign: "center", marginTop: 8, maxWidth: 300 }}>This one is waiting in {where}. Read there and it’s yours.</Text>
      <Pressable onPress={() => onRead(m)} accessibilityRole="button" style={[s.cta, { backgroundColor: t.ink }]}>
        <SFSymbol name="book" size={18} color={t.page}/>
        <Text style={{ ...uiText.body, fontWeight: "800", color: t.page }}>Read {where}</Text>
      </Pressable>
    </Animated.View>
  </Modal>;
}

const s = StyleSheet.create({
  cover: { paddingHorizontal: 20, paddingBottom: 26, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, borderCurve: "continuous", overflow: "hidden" },
  close: { position: "absolute", left: 16, width: 44, height: 44, backgroundColor: "#FFF1E41F", zIndex: 6 },
  bar: { position: "absolute", left: 0, right: 0, top: 0, zIndex: 5, overflow: "hidden", boxShadow: "0 8px 20px -10px #00000080" },
  barRow: { position: "absolute", left: 72, right: 20, flexDirection: "row", alignItems: "center", gap: 10 },
  barCount: { ...uiText.screenTitle, fontSize: 26, lineHeight: 30, letterSpacing: -.8, color: "#E9B949" },
  barText: { ...uiText.supporting, fontWeight: "800", color: "#FFF1E4" },
  eyebrow: { ...uiText.supporting, fontSize: 13, lineHeight: 16, fontWeight: "800", letterSpacing: 1.6, textTransform: "uppercase", color: "#E9B949", textAlign: "center" },
  fan: { height: 190, marginTop: 18 },
  count: { flexDirection: "row", alignItems: "flex-end", justifyContent: "center", gap: 10, marginTop: 18 },
  countBig: { ...uiText.screenTitle, fontSize: 76, lineHeight: 90, letterSpacing: -3, color: "#E9B949", marginBottom: -10, paddingTop: 4, fontVariant: ["tabular-nums"] },
  strip: { flexDirection: "row", alignItems: "flex-end", gap: 1.5, height: 22, marginTop: 20 },
  tick: { flex: 1, height: 12, borderRadius: 2, backgroundColor: "#FFF1E424" },
  tickOn: { height: 22, backgroundColor: "#E9B949" },
  stripLabels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  stripLabel: { ...uiText.supporting, fontSize: 13, lineHeight: 16, fontWeight: "700", color: "#D8BDA5" },
  chip: { height: 40, paddingHorizontal: 14, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  bookHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 14 },
  complete: { minHeight: 32, paddingLeft: 4, paddingRight: 10, borderRadius: 16, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF0B8" },
  completeSeal: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: "#E9B949" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, rowGap: 16 },
  plate: { position: "absolute", left: 5, top: 5, height: 20, paddingLeft: 5, paddingRight: 7, borderRadius: 10, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#24140EC7" },
  plateDot: { width: 7, height: 7, borderRadius: 4 },
  plateText: { ...uiText.supporting, fontSize: 11, lineHeight: 13, fontWeight: "800", color: "#FFE7A0" },
  back: { flex: 1, borderRadius: 14, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  backInner: { position: "absolute", top: 7, left: 7, right: 7, bottom: 7, borderRadius: 9, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#FFC93C59" },
  backNo: { position: "absolute", bottom: 10, ...uiText.supporting, fontSize: 11, lineHeight: 13, fontWeight: "800", color: "#FFC93C99" },
  sheet: { position: "absolute", left: 8, right: 8, bottom: 8, borderRadius: 36, borderCurve: "continuous", paddingTop: 10, paddingHorizontal: 20, alignItems: "center", boxShadow: "0 -20px 50px -20px #28140A66" },
  grab: { width: 36, height: 5, borderRadius: 3, marginBottom: 20 },
  cta: { alignSelf: "stretch", height: 56, borderRadius: 28, marginTop: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
});
