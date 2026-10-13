import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { G, Path, Rect } from "react-native-svg";
import { Text } from "@/components/CloserText";
import { BubbleBackButton } from "@/components/BubbleBackButton";
import { CloseButton } from "@/components/CloseButton";
import { SFSymbol } from "@/components/Symbol";
import { TiltedBook, bookCoverColor } from "@/components/TiltedBook";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { findBookById } from "@/constants/books";
import { relativeTime } from "@/lib/annotationsFormat";
import { computeContinueReading } from "@/lib/continueReading";
import { goBackOr } from "@/lib/navigation";
import { captureViewToPhotos, shareViewImage } from "@/lib/saveToPhotos";
import { shareVerse } from "@/lib/share";
import { uiText } from "@/lib/typography";
import { useReducedMotion } from "@/lib/useReducedMotion";
import * as haptics from "@/lib/haptics";
import { HIGHLIGHT_COLORS, type Highlight, type HighlightColorId, useAnnotations } from "@/state/annotations";
import { useProgress } from "@/state/progress";
import { useResolvedScheme } from "@/state/theme";

/**
 * Highlights: every marked verse, shown the way it looks in the reader,
 * with the marker colour behind the words. Grouped by book (each with its
 * own little Bible) or newest first. Tap a verse for its sheet: change the
 * colour, read it in context, add a note, or share it as an image.
 */

/** Soft marker tones for the stored highlight colours. Text on them is always dark ink. */
const MARKER: Record<HighlightColorId, string> = {
  amber: "#FFE38A",
  rose: "#FFD3BF",
  sage: "#CFE6C8",
  ocean: "#CFE0F5",
  lilac: "#E6DAF2",
};
const MARKER_INK = "#231C17";
const DAY = 86_400_000;

type Sort = "book" | "newest";

function useTheme() {
  const dark = useResolvedScheme() === "dark";
  return {
    dark,
    page: dark ? "#1B1815" : "#FBF9F6",
    wash: dark ? "#3A2C1C" : "#FFF3CC",
    ink: dark ? "#F7F0E6" : "#17120F",
    muted: dark ? "#BBAA99" : "#6E645C",
    rule: dark ? "#FFFFFF14" : "#17120F14",
    chip: dark ? "#FFFFFF1A" : "#17120F1A",
    sheet: dark ? "#26211C" : "#FFFDFA",
    soft: dark ? "#FFFFFF12" : "#F3EEE8",
  };
}

const bookName = (h: Highlight) => findBookById(h.bookId)?.name ?? h.bookId;
const bookOrder = (h: Highlight) => findBookById(h.bookId)?.order ?? 999;

export default function HighlightsScreen() {
  const router = useRouter();
  const t = useTheme();
  const { allHighlights, getNotes } = useAnnotations();
  const highlights = allHighlights();
  const [filter, setFilter] = useState<HighlightColorId | null>(null);
  const [sort, setSort] = useState<Sort>("book");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [shareKey, setShareKey] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = new Map<HighlightColorId, number>();
    for (const h of highlights) c.set(h.color.id, (c.get(h.color.id) ?? 0) + 1);
    return c;
  }, [highlights]);
  const visible = useMemo(() => (filter ? highlights.filter(h => h.color.id === filter) : highlights), [highlights, filter]);
  const sections = useMemo(() => {
    if (sort === "newest") return [{ bookId: "", items: [...visible].sort((a, b) => b.updatedAt - a.updatedAt) }];
    const byBook = new Map<string, Highlight[]>();
    for (const h of visible) byBook.set(h.bookId, [...(byBook.get(h.bookId) ?? []), h]);
    return [...byBook.entries()]
      .map(([bookId, items]) => ({ bookId, items: items.sort((a, b) => a.chapter - b.chapter || a.verse - b.verse) }))
      .sort((a, b) => bookOrder(a.items[0]) - bookOrder(b.items[0]));
  }, [visible, sort]);
  const bookCount = useMemo(() => new Set(highlights.map(h => h.bookId)).size, [highlights]);
  const open = highlights.find(h => h.key === openKey) ?? null;
  const sharing = highlights.find(h => h.key === shareKey) ?? null;

  return <View style={{ flex: 1, backgroundColor: t.page }}>
    <ReaderMaterialGradient colors={[t.wash, `${t.page}00`]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300 }}/>
    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
      <View style={s.bar}>
        <BubbleBackButton onPress={() => goBackOr(router, "/(tabs)/profile")}/>
        {highlights.length > 1 && <Pressable onPress={() => { haptics.tick(); setSort(v => v === "book" ? "newest" : "book"); }} accessibilityRole="button" accessibilityLabel={`Sorted ${sort === "book" ? "by book" : "newest first"}. Change order`} style={[s.sort, { backgroundColor: t.soft }]}>
          <SFSymbol name="arrow.up.arrow.down" size={13} color={t.ink}/>
          <Text style={{ ...uiText.supporting, fontWeight: "800", color: t.ink }}>{sort === "book" ? "By book" : "Newest"}</Text>
        </Pressable>}
      </View>

      {highlights.length === 0 ? <EmptyState/> : <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <Text accessibilityRole="header" style={{ ...uiText.screenTitle, fontSize: 40, lineHeight: 44, letterSpacing: -1, color: t.ink, marginTop: 8 }}>Highlights</Text>
        <Text style={{ ...uiText.supporting, color: t.muted, marginTop: 6 }}>{highlights.length} {highlights.length === 1 ? "verse" : "verses"} across {bookCount} {bookCount === 1 ? "book" : "books"}</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -20, marginTop: 20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          <Pressable onPress={() => setFilter(null)} accessibilityRole="button" accessibilityState={{ selected: !filter }} accessibilityLabel={`All, ${highlights.length}`} style={[s.chip, !filter ? { backgroundColor: t.ink } : { borderWidth: 1, borderColor: t.chip }, { paddingLeft: 16 }]}>
            <Text style={{ ...uiText.supporting, fontWeight: "800", color: !filter ? t.page : t.ink }}>All <Text style={{ color: t.muted }}>{highlights.length}</Text></Text>
          </Pressable>
          {HIGHLIGHT_COLORS.filter(c => counts.get(c.id)).map(c => {
            const on = filter === c.id;
            return <Pressable key={c.id} onPress={() => { haptics.tick(); setFilter(on ? null : c.id); }} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${c.name}, ${counts.get(c.id)}`} style={[s.chip, on ? { borderWidth: 2, borderColor: t.ink } : { borderWidth: 1, borderColor: t.chip }]}>
              <View style={[s.dot, { backgroundColor: MARKER[c.id] }]}/>
              <Text style={{ ...uiText.supporting, fontWeight: "800", color: t.ink }}>{counts.get(c.id)}</Text>
            </Pressable>;
          })}
        </ScrollView>

        {sections.map(section => <View key={section.bookId || "newest"} style={{ marginTop: 28 }}>
          {sort === "book" && <View style={[s.bookHead, { borderBottomColor: t.rule }]}>
            <TiltedBook size={22} tilt={-12} color={bookCoverColor(bookOrder(section.items[0]))}/>
            <Text style={{ ...uiText.sectionTitle, fontSize: 22, lineHeight: 26, fontWeight: "900", color: t.ink, flex: 1 }}>{bookName(section.items[0])}</Text>
            <Text style={{ ...uiText.supporting, fontSize: 13, fontWeight: "800", color: t.muted }}>{section.items.length}</Text>
          </View>}
          {section.items.map((h, i) => <Pressable key={h.key} onPress={() => { haptics.soft(); setOpenKey(h.key); }} accessibilityRole="button" accessibilityLabel={`${bookName(h)} ${h.chapter}:${h.verse}. ${h.verseText}`}
            style={({ pressed }) => [s.row, { borderBottomColor: t.rule, borderBottomWidth: i === section.items.length - 1 ? 0 : StyleSheet.hairlineWidth, opacity: pressed ? .7 : 1 }]}>
            <Text numberOfLines={4} style={{ ...uiText.body, fontSize: 18, lineHeight: 29, color: MARKER_INK }}>
              <Text style={{ backgroundColor: MARKER[h.color.id] }}>{h.verseText || "Tap to open the chapter"}</Text>
            </Text>
            <View style={s.meta}>
              <Text style={{ ...uiText.supporting, fontSize: 13, fontWeight: "800", color: t.ink }}>{sort === "book" ? `${h.chapter}:${h.verse}` : `${bookName(h)} ${h.chapter}:${h.verse}`}</Text>
              <Text style={{ ...uiText.supporting, fontSize: 13, color: t.muted }}>· {relativeTime(h.updatedAt)}</Text>
              {getNotes(h.key).length > 0 && <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}><Text style={{ ...uiText.supporting, fontSize: 13, color: t.muted }}>·</Text><SFSymbol name="note.text" size={12} color={t.muted}/><Text style={{ ...uiText.supporting, fontSize: 13, color: t.muted }}>Note</Text></View>}
              {Date.now() - h.updatedAt < DAY && <View style={s.newTag}><Text style={{ ...uiText.supporting, fontSize: 12, lineHeight: 16, fontWeight: "800", color: "#FFF" }}>New</Text></View>}
            </View>
          </Pressable>)}
        </View>)}
      </ScrollView>}
    </SafeAreaView>

    <HighlightSheet highlight={open} onClose={() => setOpenKey(null)} onShare={key => { setOpenKey(null); setTimeout(() => setShareKey(key), 350); }}/>
    <ShareHighlight highlight={sharing} onClose={() => setShareKey(null)}/>
  </View>;
}

/** One highlight, opened: the verse at full size, its note, colour, and what to do with it. */
function HighlightSheet({ highlight, onClose, onShare }: { highlight: Highlight | null; onClose: () => void; onShare: (key: string) => void }) {
  const router = useRouter(), t = useTheme(), inset = useSafeAreaInsets(), reduced = useReducedMotion();
  const { setHighlight, getNotes } = useAnnotations();
  // Keep the last highlight on screen while the sheet animates away.
  const last = useRef<Highlight | null>(null);
  if (highlight) last.current = highlight;
  // The card glides up on one ease-out curve while the backdrop fades; closing plays it back down,
  // and only then does the overlay go away. No spring, so nothing judders on the way in.
  const [mounted, setMounted] = useState(!!highlight);
  const shown = useSharedValue(0), sheetHeight = useSharedValue(700);
  useEffect(() => {
    if (highlight) {
      setMounted(true);
      shown.value = withTiming(1, { duration: reduced ? 150 : 380, easing: Easing.bezier(.2, .9, .25, 1) });
    } else if (mounted) {
      shown.value = withTiming(0, { duration: reduced ? 120 : 260, easing: Easing.in(Easing.cubic) }, done => { if (done) runOnJS(setMounted)(false); });
    }
  }, [highlight]); // eslint-disable-line react-hooks/exhaustive-deps
  const scrim = useAnimatedStyle(() => ({ opacity: shown.value }));
  const rise = useAnimatedStyle(() => reduced ? { opacity: shown.value } : { transform: [{ translateY: (1 - shown.value) * sheetHeight.value }] });
  const h = highlight ?? last.current;
  if (!h) return null;
  const notes = getNotes(h.key), note = notes[notes.length - 1];
  const name = bookName(h);
  const read = () => { onClose(); setTimeout(() => router.push(`/book/${h.bookId}/${h.chapter}?focus=${h.verse}` as never), 250); };
  return <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#17120F52" }, scrim]}><Pressable accessibilityLabel="Close" onPress={onClose} style={{ flex: 1 }}/></Animated.View>
    <Animated.View onLayout={e => { sheetHeight.value = e.nativeEvent.layout.height + 16; }} style={[s.sheet, { backgroundColor: t.sheet, paddingBottom: inset.bottom + 8 }, rise]}>
      <View style={[s.grab, { backgroundColor: t.chip }]}/>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <Text accessibilityRole="header" style={{ ...uiText.supporting, fontWeight: "800", color: t.muted }}>{name} {h.chapter}:{h.verse}</Text>
        <Text style={{ ...uiText.supporting, fontWeight: "800", color: t.muted }}>WEB</Text>
      </View>
      <ScrollView style={{ maxHeight: 260, marginTop: 10 }} showsVerticalScrollIndicator={false}>
        <Text selectable style={{ ...uiText.body, fontSize: 22, lineHeight: 34, fontWeight: "700", color: MARKER_INK }}><Text style={{ backgroundColor: MARKER[h.color.id] }}>{h.verseText}</Text></Text>
      </ScrollView>
      <Text style={{ ...uiText.supporting, fontSize: 13, color: t.muted, marginTop: 10 }}>Marked {relativeTime(h.updatedAt)}</Text>
      {note && <View style={s.note}>
        <SFSymbol name="note.text" size={16} color={t.muted}/>
        <View style={{ flex: 1 }}><Text style={{ ...uiText.body, fontWeight: "700", color: t.ink }}>{note.text}</Text><Text style={{ ...uiText.supporting, fontSize: 13, color: t.muted, marginTop: 2 }}>Your note</Text></View>
      </View>}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 16 }}>
        {HIGHLIGHT_COLORS.map(c => {
          const on = c.id === h.color.id;
          return <Pressable key={c.id} hitSlop={4} onPress={() => { haptics.tick(); setHighlight(h.key, c.id, { verseText: h.verseText }); }} accessibilityRole="button" accessibilityState={{ selected: on }} accessibilityLabel={`${c.name} highlight`}
            style={[s.swatch, { backgroundColor: MARKER[c.id] }, on && { borderWidth: 2, borderColor: t.ink }]}>{on && <SFSymbol name="checkmark" size={15} color={MARKER_INK}/>}</Pressable>;
        })}
        <Pressable onPress={() => { haptics.warn(); setHighlight(h.key, null); onClose(); }} accessibilityRole="button" accessibilityLabel="Remove highlight" style={s.remove}>
          <SFSymbol name="trash" size={15} color="#C4321A"/><Text style={{ ...uiText.supporting, fontWeight: "800", color: "#C4321A" }}>Remove</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
        <Pressable onPress={read} accessibilityRole="button" style={[s.act, { flex: 1.6, backgroundColor: t.ink }]}><SFSymbol name="book" size={18} color={t.page}/><Text numberOfLines={1} style={{ ...uiText.supporting, fontWeight: "800", color: t.page }}>Read {name} {h.chapter}</Text></Pressable>
        <Pressable onPress={read} accessibilityRole="button" accessibilityLabel={note ? "Edit note in the reader" : "Add a note in the reader"} style={[s.act, { flex: 1, backgroundColor: t.soft }]}><SFSymbol name="note.text" size={18} color={t.ink}/><Text style={{ ...uiText.supporting, fontWeight: "800", color: t.ink }}>Note</Text></Pressable>
        <Pressable onPress={() => onShare(h.key)} accessibilityRole="button" style={[s.act, { flex: 1, backgroundColor: t.soft }]}><SFSymbol name="square.and.arrow.up" size={18} color={t.ink}/><Text style={{ ...uiText.supporting, fontWeight: "800", color: t.ink }}>Share</Text></Pressable>
      </View>
    </Animated.View>
  </Modal>;
}

const LOOKS = [
  { id: "sun", colors: ["#FFD455", "#FFC12E"], ink: "#3A1A0A", sub: "#8E4A22" },
  { id: "paper", colors: ["#FFF8EC", "#F4E6D3"], ink: "#231C17", sub: "#7A5A44" },
  { id: "ember", colors: ["#5A3324", "#351E15"], ink: "#FFF1E4", sub: "#D8BDA5" },
] as const;

/** Share a highlight as a picture: the verse on a card, in one of three looks. */
function ShareHighlight({ highlight, onClose }: { highlight: Highlight | null; onClose: () => void }) {
  const inset = useSafeAreaInsets(), { height } = useWindowDimensions();
  const card = useRef<View>(null);
  const [look, setLook] = useState<(typeof LOOKS)[number]>(LOOKS[0]);
  const last = useRef<Highlight | null>(null);
  if (highlight) last.current = highlight;
  const h = highlight ?? last.current;
  if (!h) return null;
  const reference = `${bookName(h)} ${h.chapter}:${h.verse}`;
  const long = h.verseText.length;
  const size = long > 160 ? 20 : long > 100 ? 23 : 27;
  const share = async () => {
    haptics.soft();
    const result = await shareViewImage({ ref: card, title: `${reference} · Closer`, filenameBase: reference });
    if (result.status === "error") await shareVerse({ text: h.verseText, reference, translation: "WEB" });
  };
  return <Modal visible={!!highlight} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
    <ReaderMaterialGradient colors={["#4A2C20", "#2A1710"]} style={{ flex: 1, paddingTop: inset.top, paddingBottom: inset.bottom + 16, backgroundColor: "#2A1710" }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", height: 52, paddingHorizontal: 16 }}>
        <CloseButton onPress={onClose} color="#FFF1E4" style={{ position: "absolute", left: 16, width: 44, height: 44, backgroundColor: "#FFFFFF1F" }}/>
        <Text style={{ ...uiText.supporting, fontWeight: "800", color: "#FFF1E4BF" }}>Share this verse</Text>
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
        <View ref={card} collapsable={false} style={{ transform: [{ rotate: "-2deg" }], borderRadius: 30, boxShadow: "0 30px 50px -24px #000000AA" }}>
          <View style={{ width: 290, minHeight: Math.min(360, height * .42), borderRadius: 30, borderCurve: "continuous", overflow: "hidden", padding: 26, justifyContent: "space-between", backgroundColor: look.colors[1] }}>
            <ReaderMaterialGradient colors={[...look.colors]} style={StyleSheet.absoluteFill}/>
            <View>
              <Text style={{ ...uiText.screenTitle, fontSize: size, lineHeight: size * 1.22, letterSpacing: -.4, color: look.ink }}>{h.verseText}</Text>
              <Text style={{ ...uiText.supporting, fontWeight: "800", color: look.sub, marginTop: 14 }}>{reference}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 24 }}>
              <TiltedBook size={16} tilt={-10}/>
              <Text style={{ ...uiText.supporting, fontWeight: "900", color: look.sub }}>Closer</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 14, marginBottom: 24 }}>
        {LOOKS.map(l => <Pressable key={l.id} onPress={() => { haptics.tick(); setLook(l); }} accessibilityRole="button" accessibilityState={{ selected: l.id === look.id }} accessibilityLabel={`${l.id} card`}
          style={[{ width: 44, height: 44, borderRadius: 22, overflow: "hidden" }, l.id === look.id ? { borderWidth: 3, borderColor: "#FFF1E4" } : { borderWidth: 1.5, borderColor: "#FFF1E440" }]}>
          <ReaderMaterialGradient colors={[...l.colors]} style={{ flex: 1 }}/>
        </Pressable>)}
      </View>
      <Pressable onPress={share} accessibilityRole="button" style={[s.cta, { backgroundColor: "#FFF1E4" }]}><SFSymbol name="square.and.arrow.up" size={18} color="#17120F"/><Text style={{ ...uiText.body, fontWeight: "800", color: "#17120F" }}>Share image</Text></Pressable>
      <Pressable onPress={async () => { if (await captureViewToPhotos(card)) haptics.success(); }} accessibilityRole="button" style={[s.cta, { backgroundColor: "#FFFFFF1A", marginTop: 10 }]}><SFSymbol name="arrow.down.to.line" size={17} color="#FFF1E4"/><Text style={{ ...uiText.body, fontWeight: "800", color: "#FFF1E4" }}>Save to Photos</Text></Pressable>
    </ReaderMaterialGradient>
  </Modal>;
}

/** Nothing marked yet: a page with a marker mid-stroke, and a way back to reading. */
function EmptyState() {
  const router = useRouter(), t = useTheme();
  const { lastVisited, hasReadChapter } = useProgress();
  const next = computeContinueReading(lastVisited, hasReadChapter);
  return <View style={{ flex: 1, paddingHorizontal: 20, paddingBottom: 24 }}>
    <Text accessibilityRole="header" style={{ ...uiText.screenTitle, fontSize: 40, lineHeight: 44, letterSpacing: -1, color: t.ink, marginTop: 8 }}>Highlights</Text>
    <View accessible={false} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <View style={{ transform: [{ rotate: "-4deg" }], boxShadow: "0 22px 30px -16px #502D0A55", borderRadius: 18 }}>
        <Svg width={250} height={190} viewBox="0 0 250 190">
          <Rect width={250} height={190} rx={18} fill="#FFFDFA"/>
          <G fill="#E6DED5"><Rect x={24} y={30} width={190} height={9} rx={4.5}/><Rect x={24} y={52} width={160} height={9} rx={4.5}/><Rect x={24} y={100} width={176} height={9} rx={4.5}/><Rect x={24} y={122} width={130} height={9} rx={4.5}/><Rect x={24} y={144} width={184} height={9} rx={4.5}/></G>
          <Rect x={18} y={70} width={168} height={21} rx={5} fill="#FFE38A"/>
          <Rect x={24} y={76} width={152} height={9} rx={4.5} fill="#C9A94A" opacity={.55}/>
          <G transform="translate(186 82) rotate(-38)"><Rect x={-7} y={-12} width={20} height={58} rx={6} fill="#3A2219"/><Rect x={-7} y={-12} width={20} height={15} rx={5} fill="#FFC93C"/><Path d="M-5 -12 3 -26 11 -12Z" fill="#FFC93C"/></G>
        </Svg>
      </View>
    </View>
    <Text style={{ ...uiText.screenTitle, fontSize: 34, lineHeight: 38, letterSpacing: -.8, color: t.ink }}>Nothing marked yet.</Text>
    <Text style={{ ...uiText.body, color: t.muted, marginTop: 8 }}>Press and hold a verse while you read, then pick a colour. It lands here.</Text>
    <Pressable onPress={() => router.push((next ? `/book/${next.book.id}/${next.chapter}` : "/library") as never)} accessibilityRole="button" style={[s.cta, { backgroundColor: t.ink, marginTop: 24, marginHorizontal: 0 }]}>
      <SFSymbol name="book" size={18} color={t.page}/>
      <Text style={{ ...uiText.body, fontWeight: "800", color: t.page }}>{next ? `Keep reading ${next.book.name} ${next.chapter}` : "Open the Bible"}</Text>
    </Pressable>
  </View>;
}

const s = StyleSheet.create({
  bar: { height: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16 },
  sort: { minHeight: 36, paddingHorizontal: 14, borderRadius: 18, flexDirection: "row", alignItems: "center", gap: 6 },
  chip: { height: 40, paddingLeft: 8, paddingRight: 14, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: "#17120F22" },
  bookHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  row: { paddingTop: 16, paddingBottom: 18 },
  meta: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6, marginTop: 8 },
  newTag: { height: 20, paddingHorizontal: 7, borderRadius: 10, justifyContent: "center", backgroundColor: "#B82A15" },
  sheet: { position: "absolute", left: 8, right: 8, bottom: 8, borderRadius: 36, borderCurve: "continuous", paddingTop: 10, paddingHorizontal: 20, boxShadow: "0 -20px 50px -20px #28140A66" },
  grab: { width: 36, height: 5, borderRadius: 3, alignSelf: "center", marginBottom: 14 },
  note: { flexDirection: "row", gap: 10, marginTop: 14, paddingLeft: 14, borderLeftWidth: 3, borderLeftColor: "#FFC93C" },
  swatch: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: "#17120F22" },
  remove: { marginLeft: "auto", minHeight: 44, flexDirection: "row", alignItems: "center", gap: 6 },
  act: { height: 56, borderRadius: 22, borderCurve: "continuous", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingHorizontal: 10 },
  cta: { marginHorizontal: 20, height: 56, borderRadius: 28, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
});
