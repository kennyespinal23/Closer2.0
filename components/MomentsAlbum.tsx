import { useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "@/components/CloserText";
import { Text as NText } from "react-native";
import { FeedbackPressable as Pressable } from "@/components/FeedbackPressable";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { SFSymbol } from "@/components/Symbol";
import { FLOOR, INK_FAINT, RoundButton, tone } from "@/components/community/togetherKit";
import { MOMENT_CATEGORIES, type BibleMoment, type MomentCategory } from "@/constants/bibleMoments";
import { getBibleMomentArt } from "@/constants/bibleMomentArt";
import { findBookById } from "@/constants/books";
import { MOMENTS_IN_ORDER, collectedLabel } from "@/lib/momentOrder";
import { useReducedMotion } from "@/lib/useReducedMotion";
import * as haptics from "@/lib/haptics";
import { hydrateBibleMoments, useBibleMomentCollection } from "@/state/bibleMoments";
import { K, nunito } from "@/components/closer/kit";

/**
 * "Your collection": every Bible moment in Bible order on Closer's dark ink, three to a row (from the closer-page
 * prototype). Collected moments show their painting in a gold frame and open their page; the rest are a quiet "?"
 * with the reference, and tapping one takes you to read it.
 */
const SHORT: Record<MomentCategory, string> = { "turning-points": "Turning points", prophecy: "Prophecy", lessons: "Lessons", changed: "Changed by Jesus", promises: "Promises" };
const dotOf = (c: MomentCategory) => MOMENT_CATEGORIES[c].dark;
const readRoute = (m: BibleMoment) => `/book/${m.bookId}/${m.chapter}?focus=${m.verse}` as Href;
const chapterRef = (m: BibleMoment) => `${findBookById(m.bookId)?.name ?? m.bookId} ${m.chapter}`;


export function MomentsAlbum({ onClose, onReadRequest }: { onClose: () => void; onReadRequest?: (moment: BibleMoment) => void }) {
  const insets = useSafeAreaInsets(), router = useRouter(), { width } = useWindowDimensions();
  const { ids, collectedAt, hydrated, error } = useBibleMomentCollection();
  const [open, setOpen] = useState<BibleMoment | null>(null);
  const earned = useMemo(() => new Set(ids), [ids]);
  const read = (m: BibleMoment) => { haptics.soft(); if (onReadRequest) { onReadRequest(m); return; } onClose(); setTimeout(() => router.push(readRoute(m)), 350); };
  const total = MOMENTS_IN_ORDER.length;
  const have = MOMENTS_IN_ORDER.filter(m => earned.has(m.id)).length;
  const tile = Math.floor((width - 40 - 24) / 3);

  return <View style={{ flex: 1, backgroundColor: K.ink }}>
    <StatusBar style="light" />
    <ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 20 }}>
        <View style={{ flex: 1 }}>
          <NText style={nunito(800, 12.5, { color: K.gold, letterSpacing: 1.75, textTransform: "uppercase" })}>Your collection</NText>
          <NText accessibilityRole="header" style={nunito(900, 30, { color: K.cream, letterSpacing: -0.9, lineHeight: 34, marginTop: 2 })}>Bible moments</NText>
          <NText style={nunito(700, 15, { color: "#FFF7EBB3", lineHeight: 21, marginTop: 2 })}>
            {error ? "Your collection couldn’t be loaded." : !hydrated ? "Gathering your moments…" : `${have} of ${total}. Tap one you haven’t found to go and read it.`}
          </NText>
          {!!error && <Pressable accessibilityRole="button" onPress={() => void hydrateBibleMoments()} style={{ minHeight: 44, justifyContent: "center" }}><NText style={nunito(900, 15, { color: K.gold })}>Try again</NText></Pressable>}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => { haptics.soft(); onClose(); }}
          style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFFFFF1A", alignItems: "center", justifyContent: "center" }}>
          <SFSymbol name="xmark" size={17} weight="bold" color={K.cream} />
        </Pressable>
      </View>
      {hydrated && <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 20, marginTop: 18 }}>
        {MOMENTS_IN_ORDER.map(m => <Tile key={m.id} moment={m} size={tile} have={earned.has(m.id)} onPress={() => earned.has(m.id) ? setOpen(m) : read(m)} />)}
      </View>}
    </ScrollView>
    {open && <MomentPage moment={open} collectedAt={collectedAt[open.id]} onClose={() => setOpen(null)} onRead={() => { const m = open; setOpen(null); read(m); }}/>}
  </View>;
}

/** A moment in the album: its painting in a gold frame when collected; a quiet "?" with where to read it when not. */
function Tile({ moment, size, have, onPress }: { moment: BibleMoment; size: number; have: boolean; onPress: () => void }) {
  const art = getBibleMomentArt(moment.id);
  return <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={have ? `${moment.title}, ${moment.reference}. Open` : `Not found yet. Read ${chapterRef(moment)}`} onPress={onPress} style={{ width: size }}>
    <View style={{ width: size, height: size * 4 / 3, borderRadius: 14, borderCurve: "continuous", overflow: "hidden", borderWidth: 2, borderColor: have ? K.gold : "#FFF7EB24", backgroundColor: "#24342C", alignItems: "center", justifyContent: "center" }}>
      {have && art ? <Image source={art} contentFit="cover" style={StyleSheet.absoluteFill} /> : <NText style={nunito(900, 26, { color: "#FFF7EB40" })}>?</NText>}
    </View>
    <NText numberOfLines={1} style={nunito(900, 12.5, { color: K.cream, marginTop: 6 })}>{have ? moment.title : "???"}</NText>
    <NText numberOfLines={1} style={nunito(700, 11.5, { color: "#FFF7EB8C" })}>{moment.reference}</NText>
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
