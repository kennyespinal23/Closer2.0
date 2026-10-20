import { useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Svg, { Circle } from "react-native-svg";
import { Text } from "@/components/CloserText";
import { FeedbackPressable as Pressable } from "@/components/FeedbackPressable";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { SFSymbol } from "@/components/Symbol";
import { BibleMomentReveal } from "@/components/BibleMomentReveal";
import { FLOOR, INK_FAINT, INK_SOFT, RoundButton, tone } from "@/components/community/togetherKit";
import { MOMENT_CATEGORIES, type BibleMoment, type MomentCategory } from "@/constants/bibleMoments";
import { getBibleMomentArt } from "@/constants/bibleMomentArt";
import { findBookById } from "@/constants/books";
import { MOMENTS_IN_ORDER, collectedLabel } from "@/lib/momentOrder";
import { useReducedMotion } from "@/lib/useReducedMotion";
import * as haptics from "@/lib/haptics";
import { hydrateBibleMoments, useBibleMomentCollection } from "@/state/bibleMoments";

/**
 * Bible Moments as an album on a near-black page. Each moment is its painting; each of the five
 * categories owns its colour (MOMENT_CATEGORIES). Collected moments are lit; the rest wait as softly
 * blurred paintings that say where to read them.
 */
type Filter = MomentCategory | "all";
const CATEGORIES = Object.keys(MOMENT_CATEGORIES) as MomentCategory[];
const SHORT: Record<MomentCategory, string> = { "turning-points": "Turning points", prophecy: "Prophecy", lessons: "Lessons", changed: "Changed by Jesus", promises: "Promises" };
const SET_NAME: Record<MomentCategory, string> = { "turning-points": "Where the story turns", prophecy: "Promised long before", lessons: "Stories Jesus told", changed: "People Jesus met", promises: "What God promised" };
const dotOf = (c: MomentCategory) => MOMENT_CATEGORIES[c].dark;
const readRoute = (m: BibleMoment) => `/book/${m.bookId}/${m.chapter}?focus=${m.verse}` as Href;
const chapterRef = (m: BibleMoment) => `${findBookById(m.bookId)?.name ?? m.bookId} ${m.chapter}`;

export function MomentsAlbum({ onClose, onReadRequest }: { onClose: () => void; onReadRequest?: (moment: BibleMoment) => void }) {
  const insets = useSafeAreaInsets(), router = useRouter(), { width } = useWindowDimensions();
  const { ids, collectedAt, hydrated, error } = useBibleMomentCollection();
  const [filter, setFilter] = useState<Filter>("all"), [open, setOpen] = useState<BibleMoment | null>(null), [foil, setFoil] = useState<string | null>(null);
  const earned = useMemo(() => new Set(ids), [ids]);
  const read = (m: BibleMoment) => { haptics.soft(); if (onReadRequest) { onReadRequest(m); return; } onClose(); setTimeout(() => router.push(readRoute(m)), 350); };
  const total = MOMENTS_IN_ORDER.length;
  const tile = (width - 32 - 20) / 3;

  // The nearest silver foil card: the book with the fewest moments still to find.
  const books = useMemo(() => {
    const by = new Map<string, BibleMoment[]>();
    MOMENTS_IN_ORDER.forEach(m => by.set(m.bookId, [...(by.get(m.bookId) ?? []), m]));
    return [...by.entries()].map(([bookId, list]) => ({ bookId, total: list.length, have: list.filter(m => earned.has(m.id)).length }));
  }, [earned]);
  const nearest = books.filter(b => b.have < b.total && b.have > 0).sort((a, b) => (a.total - a.have) - (b.total - b.have))[0]
    ?? books.filter(b => b.have < b.total).sort((a, b) => a.total - b.total)[0];
  const silvers = books.filter(b => b.have === b.total);

  const inFilter = (m: BibleMoment) => filter === "all" || m.tags.includes(filter);
  const next = MOMENTS_IN_ORDER.find(m => inFilter(m) && !earned.has(m.id));
  const groups = filter === "all" ? CATEGORIES.map(c => ({ c, list: MOMENTS_IN_ORDER.filter(m => m.category === c) })) : [{ c: filter, list: MOMENTS_IN_ORDER.filter(m => m.tags.includes(filter)) }];
  const catTone = filter === "all" ? null : tone(MOMENT_CATEGORIES[filter].tint);
  const catHave = filter === "all" ? 0 : groups[0]!.list.filter(m => earned.has(m.id)).length, catTotal = filter === "all" ? 0 : groups[0]!.list.length;

  const Medal = ({ fraction, label, ring, ink }: { fraction: number; label: string; ring: string; ink: string }) => <View style={{ width: 58, height: 58, alignItems: "center", justifyContent: "center" }}>
    <Svg width={58} height={58} style={StyleSheet.absoluteFill}><Circle cx={29} cy={29} r={26} stroke="#FFFFFF1F" strokeWidth={5} fill="none"/><Circle cx={29} cy={29} r={26} stroke={ring} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={`${Math.max(.03, fraction) * 163.4} 164`} transform="rotate(-90 29 29)"/></Svg>
    <ReaderMaterialGradient colors={["#F4F5F7", "#B9BEC6", "#858B94"]} style={{ width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }}><Text style={{ fontSize: 15, fontWeight: "900", color: ink }}>{label}</Text></ReaderMaterialGradient>
  </View>;

  return <View style={{ flex: 1, backgroundColor: FLOOR }}>
    <StatusBar style="light"/>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 6, paddingBottom: insets.bottom + 40 }}>
      <View style={{ paddingHorizontal: 16 }}><RoundButton icon="xmark" label="Close" onPress={onClose}/></View>
      <View style={{ paddingHorizontal: 22, marginTop: 10 }}>
        <Text accessibilityRole="header" style={{ fontSize: 34, lineHeight: 40, fontWeight: "900", letterSpacing: -.7, color: "#FCFCFC" }}>Bible moments</Text>
        <Text style={{ marginTop: 4, fontSize: 15, fontWeight: "700", color: INK_SOFT }}>{error ? "Your collection couldn’t be loaded." : !hydrated ? "Gathering your moments…" : <><Text style={{ fontWeight: "800", color: "#FFFFFF" }}>{ids.length}</Text> of {total} collected · found as you read</>}</Text>
        {!!error && <Pressable accessibilityRole="button" onPress={() => void hydrateBibleMoments()} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ fontSize: 15, fontWeight: "800", color: "#FFFFFF" }}>Try again</Text></Pressable>}
      </View>

      {/* The next badge: the category set when filtered, otherwise the nearest silver foil book */}
      {hydrated && (catTone ? <View style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 24, padding: 14, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: catTone.mid, boxShadow: "inset 0 1px 0 #FFFFFF1F" }}>
          <Medal fraction={catHave / Math.max(1, catTotal)} label={String(catHave)} ring={dotOf(filter as MomentCategory)} ink={catTone.deep}/>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, lineHeight: 14, fontWeight: "800", letterSpacing: .9, color: catTone.t3 }}>{SHORT[filter as MomentCategory].toUpperCase()} · {catHave} OF {catTotal}</Text>
            <Text style={{ marginTop: 2, fontSize: 17, fontWeight: "800", color: catTone.t1 }}>{SET_NAME[filter as MomentCategory]}</Text>
            <Text style={{ marginTop: 2, fontSize: 13, fontWeight: "700", color: catTone.t2 }}>{catHave === catTotal ? "Set complete. Every one is yours." : `${catTotal - catHave} more to finish the set`}</Text>
          </View>
        </View> : nearest && <View style={{ marginHorizontal: 16, marginTop: 16, borderRadius: 24, padding: 14, flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#211C1A", boxShadow: "inset 0 1px 0 #FFFFFF14" }}>
          <Medal fraction={nearest.have / nearest.total} label={String(nearest.have)} ring="#E9D6AB" ink="#4A4F57"/>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, lineHeight: 14, fontWeight: "800", letterSpacing: .9, color: INK_FAINT }}>NEXT SILVER · {findBookById(nearest.bookId)?.name.toUpperCase()}</Text>
            <Text style={{ marginTop: 2, fontSize: 17, fontWeight: "800", color: "#F4EFEC" }}>{nearest.total - nearest.have === 1 ? "One more moment" : `${nearest.total - nearest.have} more moments`}</Text>
            <Text style={{ marginTop: 2, fontSize: 13, fontWeight: "700", color: INK_SOFT }}>Find them all in {findBookById(nearest.bookId)?.name} for its silver foil card</Text>
          </View>
        </View>)}

      {/* Category chips, each with its colour */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {(["all", ...CATEGORIES] as Filter[]).map(f => { const on = f === filter, t = f === "all" ? null : tone(MOMENT_CATEGORIES[f].tint); return <Pressable key={f} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => { haptics.tick(); setFilter(f); }}
          style={{ height: 36, paddingLeft: f === "all" ? 14 : 10, paddingRight: 14, borderRadius: 18, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: on ? (t ? t.mid : "#FFF8F2") : "#FFFFFF12", boxShadow: on && t ? "inset 0 1px 0 #FFFFFF22" : undefined }}>
          {f !== "all" && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: dotOf(f) }}/>}
          <Text style={{ fontSize: 13, fontWeight: "800", color: on ? (t ? t.t1 : "#1A1412") : "#E8E3E0" }}>{f === "all" ? "All" : SHORT[f]}</Text>
        </Pressable>; })}
      </ScrollView>

      {/* Next to discover */}
      {hydrated && next && (() => { const t = tone(MOMENT_CATEGORIES[next.category].tint), art = getBibleMomentArt(next.id); return <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={`Next to discover: ${next.title}. Read ${chapterRef(next)}`} onPress={() => read(next)}
        style={{ marginHorizontal: 16, marginTop: 16, height: 170, borderRadius: 26, overflow: "hidden", flexDirection: "row", alignItems: "flex-end", padding: 16, backgroundColor: t.deep, boxShadow: "0 20px 34px -20px #000" }}>
        {art && <Image source={art} contentFit="cover" blurRadius={8} style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.08 }] }]}/>}
        <ReaderMaterialGradient pointerEvents="none" colors={[`${t.deep}00`, `${t.deep}EB`]} locations={[.2, 1]} style={StyleSheet.absoluteFill}/>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 11, lineHeight: 14, fontWeight: "800", letterSpacing: .9, color: t.t3 }}>NEXT TO DISCOVER</Text>
          <Text numberOfLines={1} style={{ marginTop: 3, fontSize: 20, lineHeight: 24, fontWeight: "900", color: t.t1 }}>{next.title}</Text>
          <Text style={{ marginTop: 3, fontSize: 14, fontWeight: "700", color: t.t2 }}>Read {chapterRef(next)} to find it</Text>
        </View>
        <View style={{ height: 46, paddingHorizontal: 16, borderRadius: 23, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", gap: 6 }}><SFSymbol name="book" size={14} color={t.deep}/><Text style={{ fontSize: 15, fontWeight: "800", color: t.deep }}>Read</Text></View>
      </Pressable>; })()}

      {/* Silver foil cards already earned */}
      {silvers.length > 0 && <>
        <Header title="Silver foil" count={`${silvers.length}`}/>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {silvers.map(b => <Pressable key={b.bookId} accessibilityRole="button" accessibilityLabel={`${findBookById(b.bookId)?.name} silver foil card`} onPress={() => { haptics.soft(); setFoil(b.bookId); }}
            style={{ height: 44, paddingHorizontal: 14, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#2A2725", boxShadow: "inset 0 1px 0 #FFFFFF22" }}>
            <ReaderMaterialGradient colors={["#F4F5F7", "#B9BEC6"]} style={{ width: 18, height: 18, borderRadius: 9 }}/><Text style={{ fontSize: 14, fontWeight: "800", color: "#E8E3E0" }}>{findBookById(b.bookId)?.name}</Text>
          </Pressable>)}
        </ScrollView>
      </>}

      {/* The album */}
      {hydrated && groups.map(({ c, list }) => <View key={c}>
        {filter === "all" ? <Header title={SHORT[c]} count={`${list.filter(m => earned.has(m.id)).length} of ${list.length}`}/> : <View style={{ height: 16 }}/>}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16 }}>
          {list.map(m => <Tile key={m.id} moment={m} size={tile} have={earned.has(m.id)} onPress={() => { haptics.soft(); if (earned.has(m.id)) setOpen(m); else read(m); }}/>)}
        </View>
      </View>)}
    </ScrollView>
    {open && <MomentPage moment={open} collectedAt={collectedAt[open.id]} onClose={() => setOpen(null)} onRead={() => { const m = open; setOpen(null); read(m); }}/>}
    {foil && <BibleMomentReveal request={{ collected: true, kind: "silver", bookId: foil }} onClose={() => setFoil(null)}/>}
  </View>;
}

function Header({ title, count }: { title: string; count: string }) {
  return <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: 22, marginTop: 24, marginBottom: 12 }}>
    <Text accessibilityRole="header" style={{ fontSize: 20, lineHeight: 25, fontWeight: "900", letterSpacing: -.3, color: "#FCFCFC" }}>{title}</Text>
    <Text style={{ fontSize: 13, fontWeight: "800", color: INK_FAINT, fontVariant: ["tabular-nums"] }}>{count}</Text>
  </View>;
}

/** A moment in the album: its painting when collected; blurred, with where to read it, when not. */
function Tile({ moment, size, have, onPress }: { moment: BibleMoment; size: number; have: boolean; onPress: () => void }) {
  const art = getBibleMomentArt(moment.id);
  return <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={have ? `${moment.title}. Collected. Open` : `Not collected yet. Read ${chapterRef(moment)}`} onPress={onPress}
    style={{ width: size, height: size * 4 / 3, borderRadius: 18, borderCurve: "continuous", overflow: "hidden", backgroundColor: "#1E1A18", boxShadow: "inset 0 0 0 1px #FFFFFF14, 0 12px 20px -14px #000" }}>
    {art && <Image source={art} contentFit="cover" blurRadius={have ? 0 : 7} style={[StyleSheet.absoluteFill, !have && { opacity: .78, transform: [{ scale: 1.1 }] }]}/>}
    <ReaderMaterialGradient pointerEvents="none" colors={["#00000000", "#000000B8"]} locations={[.45, 1]} style={StyleSheet.absoluteFill}/>
    {have ? <View style={{ position: "absolute", left: 8, top: 8, width: 9, height: 9, borderRadius: 5, backgroundColor: dotOf(moment.category), boxShadow: "0 0 0 2px #0006" }}/>
      : <View style={{ position: "absolute", left: "50%", top: "38%", width: 34, height: 34, marginLeft: -17, marginTop: -17, borderRadius: 17, backgroundColor: "#FFFFFF1F", alignItems: "center", justifyContent: "center" }}><SFSymbol name="lock.fill" size={13} color="#E8E3E0"/></View>}
    <Text numberOfLines={2} style={{ position: "absolute", left: 9, right: 9, bottom: 9, fontSize: 12, lineHeight: 15, fontWeight: have ? "800" : "700", color: have ? "#FFFFFF" : "#C9C1BD" }}>{have ? moment.title : chapterRef(moment)}</Text>
  </Pressable>;
}

/** One collected moment: the painting large, its verse, why it matters, and where to read it. */
function MomentPage({ moment, collectedAt, onClose, onRead }: { moment: BibleMoment; collectedAt?: number; onClose: () => void; onRead: () => void }) {
  const insets = useSafeAreaInsets(), reduced = useReducedMotion(), { height } = useWindowDimensions();
  const t = tone(MOMENT_CATEGORIES[moment.category].tint), art = getBibleMomentArt(moment.id);
  return <Modal visible presentationStyle="fullScreen" animationType={reduced ? "fade" : "slide"} onRequestClose={onClose}>
    <StatusBar style="light"/>
    <View style={{ flex: 1, backgroundColor: FLOOR }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <View style={{ height: height * .56 }}>
          {art && <Image source={art} contentFit="cover" style={StyleSheet.absoluteFill}/>}
          <ReaderMaterialGradient pointerEvents="none" colors={["#00000066", "#00000000", "#00000000", `${t.deep}D9`, FLOOR]} locations={[0, .24, .5, .82, 1]} style={StyleSheet.absoluteFill}/>
        </View>
        <View style={{ marginTop: -96, paddingHorizontal: 22 }}>
          <View style={{ alignSelf: "flex-start", height: 28, paddingLeft: 9, paddingRight: 11, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: t.mid, boxShadow: "inset 0 1px 0 #FFFFFF22" }}>
            <View style={{ width: 9, height: 9, borderRadius: 5, backgroundColor: dotOf(moment.category) }}/><Text style={{ fontSize: 12, fontWeight: "800", color: t.t1 }}>{SHORT[moment.category]}</Text>
          </View>
          <Text accessibilityRole="header" style={{ marginTop: 10, fontSize: 32, lineHeight: 36, fontWeight: "900", letterSpacing: -.6, color: t.t1 }}>{moment.title}</Text>
          <Text style={{ marginTop: 4, fontSize: 14, fontWeight: "800", color: t.t3 }}>{moment.reference}</Text>
          <View style={{ marginTop: 16, paddingLeft: 14, borderLeftWidth: 3, borderLeftColor: dotOf(moment.category) }}><Text style={{ fontSize: 17, lineHeight: 25, fontWeight: "700", color: "#F4EFEC" }}>{moment.happened}</Text></View>
          <Text style={{ marginTop: 14, fontSize: 15, lineHeight: 22, fontWeight: "700", color: "#B8B0AC" }}>{moment.importance}</Text>
          <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, backgroundColor: "#E9D6AB", alignItems: "center", justifyContent: "center" }}><SFSymbol name="checkmark" size={9} color="#3A2A10"/></View>
            <Text style={{ fontSize: 13, fontWeight: "700", color: INK_FAINT }}>{collectedLabel(collectedAt)}</Text>
          </View>
        </View>
      </ScrollView>
      <View style={{ position: "absolute", left: 16, right: 16, top: insets.top + 4 }}><RoundButton icon="chevron.left" label="Back to moments" onPress={onClose}/></View>
      <View style={{ position: "absolute", left: 16, right: 16, bottom: insets.bottom + 10 }}>
        <Pressable feedback="action" accessibilityRole="button" onPress={onRead} style={{ height: 56, borderRadius: 28, backgroundColor: "#FFF8F2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: `0 14px 30px -12px ${t.c}CC` }}>
          <SFSymbol name="book" size={16} color={t.deep}/><Text style={{ fontSize: 17, fontWeight: "800", color: t.deep }}>Read it in {chapterRef(moment)}</Text>
        </Pressable>
      </View>
    </View>
  </Modal>;
}
