import { useEffect, useMemo, useRef, useState } from "react";
import { Linking, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown, FadeOut, interpolate, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/CloserText";
import { FeedbackPressable as Pressable } from "./FeedbackPressable";
import { ReaderMomentArt } from "./ReaderMomentArt";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { characterName } from "./CategoryArt";
import { HANDWRITTEN } from "./HomeQuoteText";
import { SFSymbol } from "./Symbol";
import { BIBLE_MOMENTS, type BibleMoment } from "@/constants/bibleMoments";
import type { FloatingScriptureCard } from "@/constants/homePrototype";
import * as haptics from "@/lib/haptics";

/**
 * Scripture and word, as something you do. Each category turns the same
 * devotional (title, verse, story, insight, paintings) into its own
 * interaction: a scene to explore, a walk, a conversation, a photo journal,
 * a graphic novel, a study desk, a second look, a reel, a branching question.
 * Each reports how far you have gone; the walk's button stays below it.
 * Reduce Motion and VoiceOver get the plain reading (CategoryReading) instead.
 */

export type ExperienceTheme = { statusBar: "light" | "dark"; closeBg: string; closeInk: string; bar: string; track: string; ctaBg: string; ctaInk: string };
const dark = (bar: string, ctaBg: string, ctaInk: string): ExperienceTheme => ({ statusBar: "light", closeBg: "#FFFFFF26", closeInk: "#FFFFFF", bar, track: "#FFFFFF40", ctaBg, ctaInk });
export const EXPERIENCE_THEMES: Record<string, ExperienceTheme> = {
  "daily-church": { statusBar: "dark", closeBg: "#F4E6CF", closeInk: "#3A1500", bar: "#3A1500", track: "#3A150026", ctaBg: "#3A1500", ctaInk: "#FFF6C9" },
  "jesus-only": dark("#FFFFFF", "#FFFFFF", "#2A0A10"),
  "letters-struggling": dark("#FFFFFF", "#FFF4E6", "#0B3A28"),
  "letters-grateful": { statusBar: "dark", closeBg: "#FFFFFFB3", closeInk: "#3A0716", bar: "#B0124A", track: "#3A071626", ctaBg: "#7A0E33", ctaInk: "#FFFFFF" },
  "character-studies": { statusBar: "dark", closeBg: "#EADBC8", closeInk: "#2A1000", bar: "#E2500A", track: "#2A100022", ctaBg: "#2A1000", ctaInk: "#FFF6D6" },
  "deep-verse": { ...dark("#FFC21A", "#FFC21A", "#2A1206"), closeBg: "#FFFFFF1F", closeInk: "#FFF1E0", track: "#FFFFFF33" },
  "misconceptions": dark("#FFFFFF", "#FFFFFF", "#2A1206"),
  "testimonies": { ...dark("#4BE08F", "#4BE08F", "#06301F"), closeBg: "#FFFFFF1A", closeInk: "#F2EDE6", track: "#FFFFFF2E" },
  "questions": { ...dark("#FFC21A", "#FFC21A", "#2A1206"), closeBg: "#FFFFFF14", closeInk: "#F7F0E6", track: "#FFFFFF24" },
};
export const hasExperience = (categoryId: string) => categoryId in EXPERIENCE_THEMES;

type Props = { categoryId: string; card: FloatingScriptureCard; art: BibleMoment; onProgress: (fraction: number) => void };

export function CategoryExperience(props: Props) {
  switch (props.categoryId) {
    case "jesus-only": return <QuietWalk {...props}/>;
    case "letters-struggling": return <LetterThread {...props}/>;
    case "letters-grateful": return <PhotoJournal {...props}/>;
    case "character-studies": return <GraphicNovel {...props}/>;
    case "deep-verse": return <StudyDesk {...props}/>;
    case "misconceptions": return <LookAgain {...props}/>;
    case "testimonies": return <FilmReel {...props}/>;
    case "questions": return <BranchingQuestion {...props}/>;
    default: return <MiniTalk {...props}/>;
  }
}

/* ── Shared ────────────────────────────────────────────────── */

const paras = (card: FloatingScriptureCard) => card.story.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
const sentences = (text: string) => text.match(/[^.!?]+[.!?]+["”’']?|[^.!?]+$/g)?.map(s => s.trim()).filter(Boolean) ?? [text];
const firstSentence = (text: string) => sentences(text)[0] ?? text;
const rest = (text: string) => sentences(text).slice(1).join(" ");
/** The day's painting first, then others from the same book, for experiences that need several. */
function usePaintings(art: BibleMoment, count: number) {
  return useMemo(() => {
    const near = BIBLE_MOMENTS.filter(m => m.bookId === art.bookId && m.id !== art.id).sort((a, b) => Math.abs(a.chapter - art.chapter) - Math.abs(b.chapter - art.chapter));
    const all = [art, ...near, ...BIBLE_MOMENTS.filter(m => m.bookId !== art.bookId)];
    return all.slice(0, count);
  }, [art, count]);
}
/** Room the experience leaves at the bottom for the walk's button. */
function useChrome() {
  const inset = useSafeAreaInsets();
  return { top: inset.top + 68, bottom: inset.bottom + 96 };
}
function Eyebrow({ children, color, style }: { children: React.ReactNode; color: string; style?: object }) {
  return <Text style={[t.eyebrow, { color }, style]}>{children}</Text>;
}
const spring = { damping: 16, stiffness: 180, mass: .9 };

/* ── 1 · Daily Church: an illustrated mini-talk ───────────── */
const SPOTS = [{ x: .72, y: .2 }, { x: .28, y: .66 }, { x: .76, y: .58 }];
function MiniTalk({ card, art, onProgress }: Props) {
  const { top, bottom } = useChrome(), { height } = useWindowDimensions();
  const points = paras(card).slice(0, 3);
  const [found, setFound] = useState<number[]>([]), [open, setOpen] = useState<number | null>(null);
  const sheet = useSharedValue(0);
  useEffect(() => { onProgress(found.length / points.length); }, [found.length, points.length, onProgress]);
  const show = (i: number) => { haptics.soft(); setOpen(i); if (!found.includes(i)) setFound(f => [...f, i]); sheet.value = withSpring(1, spring); };
  const hide = () => { sheet.value = withTiming(0, { duration: 260 }, done => { if (done) runOnJS(setOpen)(null); }); };
  const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - sheet.value) * 460 }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: sheet.value * .25 }));
  const artH = Math.min(420, height * .46);
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: "#FFF8EA" }]}>
    <View style={{ paddingTop: top, paddingHorizontal: 20 }}>
      <Eyebrow color="#8A3B00">Daily Church · {card.scriptureReference}</Eyebrow>
      <Text accessibilityRole="header" style={[t.h1, { color: "#3A1500", marginTop: 6 }]}>{card.title}</Text>
      <View style={{ height: artH, marginTop: 18, borderRadius: 28, borderCurve: "continuous", overflow: "hidden", boxShadow: "0 18px 30px -18px #3A150099" }}>
        <ReaderMomentArt moment={art}/>
        {points.map((_, i) => <Spot key={i} n={i + 1} found={found.includes(i)} active={open === i} x={SPOTS[i]!.x} y={SPOTS[i]!.y} onPress={() => show(i)}/>)}
        {found.length === 0 && <View style={{ position: "absolute", left: 16, bottom: 16, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: "#FFFFFFE6" }}><Text style={{ color: "#3A1500", fontSize: 15, fontWeight: "800" }}>Tap what you notice</Text></View>}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18 }}>
        <View style={{ flexDirection: "row", gap: 6 }}>{points.map((_, i) => <View key={i} style={{ width: 28, height: 6, borderRadius: 3, backgroundColor: i < found.length ? "#FFC21A" : "#3A150022" }}/>)}</View>
        <Text style={[t.meta, { color: "#8A3B00" }]}>{found.length === points.length ? "The whole talk, found" : `${found.length} of ${points.length} found`}</Text>
      </View>
      {found.length === points.length && <Animated.View entering={FadeInDown.springify().damping(16)} style={{ marginTop: 14, padding: 16, borderRadius: 20, backgroundColor: "#FFE9B0" }}><Text selectable style={{ color: "#5A2A00", fontSize: 17, lineHeight: 24, fontWeight: "800" }}>{card.insight}</Text></Animated.View>}
    </View>
    {open !== null && <>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#3A1500" }, scrim]}><Pressable accessibilityRole="button" accessibilityLabel="Close point" onPress={hide} style={{ flex: 1 }}/></Animated.View>
      <GestureDetector gesture={Gesture.Pan().onEnd(e => { if (e.translationY > 60) runOnJS(hide)(); })}>
        <Animated.View style={[{ position: "absolute", left: 0, right: 0, bottom: 0, paddingBottom: bottom, paddingHorizontal: 20, paddingTop: 12, backgroundColor: "#FFF8EA", borderTopLeftRadius: 32, borderTopRightRadius: 32, borderCurve: "continuous", boxShadow: "0 -14px 30px -12px #3A150059" }, sheetStyle]}>
          <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: "#3A150026", alignSelf: "center", marginBottom: 16 }}/>
          <Eyebrow color="#B5400A">Point {open + 1} of {points.length}</Eyebrow>
          <Text style={{ fontSize: 24, lineHeight: 29, fontWeight: "900", color: "#3A1500", marginTop: 8, letterSpacing: -.5 }}>{firstSentence(points[open]!)}</Text>
          {!!rest(points[open]!) && <Animated.Text entering={FadeIn.delay(220)} selectable style={[t.body, { color: "#3A1500", marginTop: 10 }]}>{rest(points[open]!)}</Animated.Text>}
          {open === points.length - 1 && <Animated.View entering={FadeInDown.delay(360)} style={{ marginTop: 14, padding: 14, borderRadius: 18, backgroundColor: "#FFE9B0" }}><Text selectable style={{ color: "#5A2A00", fontSize: 17, lineHeight: 24, fontWeight: "800" }}>“{card.scriptureText}”</Text></Animated.View>}
        </Animated.View>
      </GestureDetector>
    </>}
  </View>;
}
function Spot({ n, found, active, x, y, onPress }: { n: number; found: boolean; active: boolean; x: number; y: number; onPress: () => void }) {
  const pulse = useSharedValue(0), pop = useSharedValue(1);
  useEffect(() => { pulse.value = withSequence(withTiming(0, { duration: 0 }), withDelay(n * 300, withTiming(1, { duration: 1400 }))); }, [n, pulse]);
  useEffect(() => { if (active) pop.value = withSequence(withTiming(1.25, { duration: 120 }), withSpring(1, spring)); }, [active, pop]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }], boxShadow: found ? "0 6px 14px -6px #00000080" : `0 0 0 ${8 * Math.sin(pulse.value * Math.PI)}px #FFFFFF40` }));
  return <Animated.View style={[{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, marginLeft: -24, marginTop: -24, width: 48, height: 48, borderRadius: 24 }, style]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Point ${n}${found ? ", found" : ""}`} onPress={onPress} hitSlop={8}
      style={{ flex: 1, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: found ? "#FFC21A" : "#3A150059", borderWidth: found ? 0 : 3, borderColor: "#FFFFFF" }}>
      {found ? <SFSymbol name="checkmark" size={18} color="#3A1500" weight="bold"/> : <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "900" }}>{n}</Text>}
    </Pressable>
  </Animated.View>;
}

/* ── 2 · Jesus Only: a quiet walk ─────────────────────────── */
function QuietWalk({ card, art, onProgress }: Props) {
  const { top, bottom } = useChrome();
  // His words, in up to three stops; the last stop rests on the day's insight.
  const stops = useMemo(() => {
    const parts = card.scriptureText.split(/(?<=[.;?!])\s+/).map(s => s.trim()).filter(Boolean);
    const words = parts.length > 3 ? [parts.slice(0, Math.ceil(parts.length / 2)).join(" "), parts.slice(Math.ceil(parts.length / 2)).join(" ")] : parts;
    return [...words.map(w => ({ text: w, said: true })), { text: card.insight, said: false }];
  }, [card.scriptureText, card.insight]);
  const [stop, setStop] = useState(0);
  const walk = useSharedValue(0);
  useEffect(() => { onProgress(stop / (stops.length - 1)); }, [stop, stops.length, onProgress]);
  const go = (to: number) => { if (to < 0 || to >= stops.length || to === stop) return; haptics.soft(); setStop(to); walk.value = withTiming(to / (stops.length - 1), { duration: 1300, easing: Easing.inOut(Easing.cubic) }); };
  const pan = Gesture.Pan().activeOffsetX([-20, 20]).onEnd(e => { if (e.translationX < -40) runOnJS(go)(stop + 1); else if (e.translationX > 40) runOnJS(go)(stop - 1); });
  const zoom = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(walk.value, [0, 1], [1.12, 1.55]) }, { translateY: interpolate(walk.value, [0, 1], [0, 60]) }] }));
  const s = stops[stop]!;
  return <GestureDetector gesture={pan}><View style={[StyleSheet.absoluteFill, { backgroundColor: "#12060A" }]}>
    <Animated.View style={[StyleSheet.absoluteFill, zoom]}><ReaderMomentArt moment={art}/></Animated.View>
    <ReaderMaterialGradient colors={["#12060AEB", "#12060AB3", "#12060A00", "#12060A33", "#12060AF2"]} locations={[0, .45, .62, .78, 1]} style={StyleSheet.absoluteFill}/>
    <Animated.View key={stop} entering={FadeIn.duration(600).delay(500)} exiting={FadeOut.duration(250)} style={{ position: "absolute", left: 24, right: 24, top: top + 40 }}>
      <Eyebrow color="#FFE27A">{s.said ? `Jesus Only · Stop ${stop + 1} of ${stops.length}` : "Carry this with you"}</Eyebrow>
      <Text selectable style={{ marginTop: 14, fontSize: 30, lineHeight: 37, fontWeight: "900", letterSpacing: -.8, color: "#FFFFFF", textShadowColor: "#00000066", textShadowRadius: 18 }}>{s.said ? `“${s.text}”` : s.text}</Text>
      {s.said && <Text style={[t.meta, { color: "#FFFFFFCC", marginTop: 12 }]}>{card.scriptureReference}</Text>}
    </Animated.View>
    <View style={{ position: "absolute", left: 28, right: 28, bottom: bottom + 8 }}>
      <View style={{ height: 24, justifyContent: "center" }}>
        <View style={{ height: 2, backgroundColor: "#FFFFFF4D" }}/>
        <Animated.View style={[{ position: "absolute", left: 0, height: 2, backgroundColor: "#FFFFFF" }, useAnimatedStyle(() => ({ width: `${walk.value * 100}%` }))]}/>
        {stops.map((_, i) => <Pressable key={i} onPress={() => go(i)} accessibilityRole="button" accessibilityLabel={`Stop ${i + 1}`} hitSlop={10}
          style={{ position: "absolute", left: `${(i / (stops.length - 1)) * 100}%`, marginLeft: -10, width: 20, height: 20, borderRadius: 10, backgroundColor: i <= stop ? "#FFFFFF" : "#FFFFFF40", boxShadow: i === stop ? "0 0 0 5px #FFFFFF40" : undefined }}/>)}
      </View>
      {stop < stops.length - 1 && <Pressable onPress={() => go(stop + 1)} accessibilityRole="button" style={{ alignSelf: "center", marginTop: 16, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 22, backgroundColor: "#00000059" }}>
        <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "800" }}>Walk on</Text><SFSymbol name="arrow.right" size={16} color="#FFFFFF" weight="bold"/></Pressable>}
    </View>
  </View></GestureDetector>;
}

/* ── 3 · A struggling letter: a conversation, a few lines at a time ── */
type Line = { from: "letter" | "me" | "verse"; text: string };
const REPLIES = [["That’s me lately.", "Go on.", "I’m not sure."], ["That helps.", "Keep going.", "Why, though?"], ["Okay.", "I needed that.", "I’ll try."]];
function LetterThread({ card, onProgress }: Props) {
  const { top, bottom } = useChrome();
  // Each paragraph arrives as two or three messages; after it, you choose a reply.
  const chunks = useMemo(() => paras(card).map(p => { const s = sentences(p), half = Math.ceil(s.length / 2); return s.length > 2 ? [s.slice(0, half).join(" "), s.slice(half).join(" ")] : [p]; }), [card]);
  const [lines, setLines] = useState<Line[]>([]), [stage, setStage] = useState(0), [typing, setTyping] = useState(true), [waiting, setWaiting] = useState(false), [help, setHelp] = useState(false);
  const scroll = useRef<Animated.ScrollView>(null), timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const deliver = (queue: Line[], then: () => void) => {
    setTyping(true);
    queue.forEach((line, i) => timers.current.push(setTimeout(() => { setLines(l => [...l, line]); setTyping(i < queue.length - 1); if (i === queue.length - 1) then(); }, 900 + i * 1300)));
  };
  useEffect(() => { deliver(chunks[0]!.map(text => ({ from: "letter", text })), () => setWaiting(true)); return () => timers.current.forEach(clearTimeout); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { onProgress(Math.min(1, stage / chunks.length)); }, [stage, chunks.length, onProgress]);
  useEffect(() => { const id = setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 80); return () => clearTimeout(id); }, [lines.length, typing, waiting]);
  const reply = (text: string) => {
    haptics.soft(); setWaiting(false); setLines(l => [...l, { from: "me", text }]);
    const next = stage + 1; setStage(next);
    if (next < chunks.length) deliver(chunks[next]!.map(x => ({ from: "letter", text: x })), () => setWaiting(true));
    else deliver([{ from: "verse", text: card.scriptureText }, { from: "letter", text: card.insight }], () => setStage(chunks.length + 1));
  };
  return <View style={StyleSheet.absoluteFill}>
    <ReaderMaterialGradient colors={["#1E7A52", "#0E4D33", "#08301F"]} style={StyleSheet.absoluteFill}/>
    <View style={{ position: "absolute", left: 20, right: 20, top: top - 4, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "#FFB38A", alignItems: "center", justifyContent: "center" }}><SFSymbol name="envelope.fill" size={17} color="#5A2410"/></View>
      <View><Text style={{ fontSize: 17, fontWeight: "800", color: "#FFFFFF" }}>A letter for a hard day</Text><Text style={{ fontSize: 13, color: "#BFE3CF" }}>Written ahead of time, a few lines at a time</Text></View>
    </View>
    <Animated.ScrollView ref={scroll} style={{ position: "absolute", left: 0, right: 0, top: top + 56, bottom }} contentContainerStyle={{ padding: 16, gap: 8 }} showsVerticalScrollIndicator={false}>
      {lines.map((l, i) => l.from === "verse"
        ? <Animated.View key={i} entering={FadeInDown.springify().damping(15)} style={{ alignSelf: "flex-start", maxWidth: "86%", padding: 16, borderRadius: 22, borderBottomLeftRadius: 6, backgroundColor: "#FFE0C9" }}>
            <Eyebrow color="#8A4A2A">{card.scriptureReference}</Eyebrow><Text selectable style={{ fontSize: 19, lineHeight: 25, fontWeight: "800", color: "#5A2410", marginTop: 6 }}>“{l.text}”</Text></Animated.View>
        : <Animated.View key={i} entering={FadeInDown.springify().damping(16)} style={{ alignSelf: l.from === "me" ? "flex-end" : "flex-start", maxWidth: "80%", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 22, ...(l.from === "me" ? { borderBottomRightRadius: 6, backgroundColor: "#FFFFFF" } : { borderBottomLeftRadius: 6, backgroundColor: "#FFF4E6" }) }}>
            <Text selectable style={{ fontSize: 17, lineHeight: 23, fontWeight: "600", color: l.from === "me" ? "#0B3A28" : "#22332B" }}>{l.text}</Text></Animated.View>)}
      {typing && <TypingDots/>}
      {waiting && <Animated.View entering={FadeInDown.delay(150)} style={{ alignItems: "flex-end", gap: 8, marginTop: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: "800", color: "#BFE3CF" }}>Choose a reply</Text>
        {REPLIES[Math.min(stage, REPLIES.length - 1)]!.map(r => <Pressable key={r} onPress={() => reply(r)} accessibilityRole="button" style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 22, backgroundColor: "#FFFFFF1F", borderWidth: 1.5, borderColor: "#FFFFFF59" }}><Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "700" }}>{r}</Text></Pressable>)}
      </Animated.View>}
    </Animated.ScrollView>
    <View style={{ position: "absolute", left: 20, right: 20, bottom: bottom - 44, alignItems: "center" }}>
      {help ? <Animated.View entering={FadeIn} style={{ padding: 14, borderRadius: 18, backgroundColor: "#00000059", gap: 8 }}>
          <Text style={{ color: "#FFFFFF", fontSize: 15, lineHeight: 21, fontWeight: "600" }}>If you might hurt yourself, please talk to someone now. In the US, call or text 988. Elsewhere, call your local emergency number.</Text>
          <Pressable onPress={() => void Linking.openURL("tel:988")} accessibilityRole="button" style={{ alignSelf: "flex-start" }}><Text style={{ color: "#FFE0C9", fontSize: 15, fontWeight: "800" }}>Call 988</Text></Pressable>
        </Animated.View>
        : <Pressable onPress={() => setHelp(true)} accessibilityRole="button" style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, backgroundColor: "#00000033" }}><SFSymbol name="heart" size={15} color="#DDF2E6"/><Text style={{ color: "#DDF2E6", fontSize: 15, fontWeight: "700" }}>If you’re not okay today</Text></Pressable>}
    </View>
  </View>;
}
function TypingDots() {
  const p = useSharedValue(0);
  useEffect(() => { p.value = withTiming(1000, { duration: 600000, easing: Easing.linear }); }, [p]);
  const dot = (i: number) => useAnimatedStyle(() => ({ opacity: .3 + .7 * Math.abs(Math.sin(p.value * 3 + i * .9)) })); // eslint-disable-line react-hooks/rules-of-hooks
  const styles = [dot(0), dot(1), dot(2)];
  return <View style={{ alignSelf: "flex-start", flexDirection: "row", gap: 5, paddingHorizontal: 18, paddingVertical: 14, borderRadius: 22, backgroundColor: "#FFF4E6" }}>{styles.map((st, i) => <Animated.View key={i} style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#5F7A6C" }, st]}/>)}</View>;
}

/* ── 4 · A grateful letter: a photo journal ───────────────── */
const PLACES = [{ x: .04, y: 0, r: -7 }, { x: .5, y: .04, r: 6 }, { x: .06, y: .52, r: 4 }, { x: .52, y: .56, r: -5 }];
function PhotoJournal({ card, art, onProgress }: Props) {
  const { top, bottom } = useChrome(), { width, height } = useWindowDimensions();
  const notes = useMemo(() => [...paras(card).map(firstSentence), card.insight].slice(0, 4), [card]);
  const photos = usePaintings(art, notes.length);
  const [turned, setTurned] = useState<number[]>([]), [open, setOpen] = useState<number | null>(null);
  useEffect(() => { onProgress(turned.length / notes.length); }, [turned.length, notes.length, onProgress]);
  const areaTop = top + 84, areaH = height - areaTop - bottom - 40, w = Math.min(170, width * .42);
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: "#FFE7EE" }]}>
    <View style={{ paddingTop: top, paddingHorizontal: 20 }}>
      <Eyebrow color="#6E0B2C">A grateful letter · {card.scriptureReference}</Eyebrow>
      <Text accessibilityRole="header" style={[t.h1, { color: "#3A0716", marginTop: 6 }]}>Turn them over</Text>
    </View>
    {notes.map((note, i) => <Snapshot key={i} moment={photos[i]!} note={note} w={w} x={PLACES[i]!.x * width + 12} y={areaTop + PLACES[i]!.y * areaH} r={PLACES[i]!.r}
      cx={(width - 300) / 2} cy={areaTop + 30} turned={turned.includes(i)} open={open === i} dimmed={open !== null && open !== i}
      onPress={() => { haptics.soft(); if (open === i) setOpen(null); else { setOpen(i); if (!turned.includes(i)) setTurned(x => [...x, i]); } }}/>)}
    <View style={{ position: "absolute", left: 20, right: 20, bottom: bottom + 4, flexDirection: "row", justifyContent: "space-between" }}>
      <Text style={[t.meta, { color: "#8A3A55" }]}>{turned.length} of {notes.length} turned over</Text>
      <Text style={{ fontSize: 15, fontWeight: "800", color: "#B0124A" }}>{open !== null ? "Tap it to put it back" : "Tap a photo to turn it"}</Text>
    </View>
  </View>;
}
function Snapshot({ moment, note, w, x, y, r, cx, cy, turned, open, dimmed, onPress }: { moment: BibleMoment; note: string; w: number; x: number; y: number; r: number; cx: number; cy: number; turned: boolean; open: boolean; dimmed: boolean; onPress: () => void }) {
  const go = useSharedValue(0), flip = useSharedValue(turned ? 1 : 0);
  useEffect(() => { go.value = withSpring(open ? 1 : 0, { damping: 18, stiffness: 140 }); if (open) flip.value = withDelay(120, withTiming(1, { duration: 650, easing: Easing.inOut(Easing.cubic) })); }, [open, go, flip]);
  const big = 300, scale = (s: number) => { "worklet"; return interpolate(s, [0, 1], [1, big / w]); };
  const frame = useAnimatedStyle(() => ({
    zIndex: open ? 10 : 1, opacity: withTiming(dimmed ? .35 : 1),
    transform: [{ translateX: interpolate(go.value, [0, 1], [x, cx + (big - w) / 2]) }, { translateY: interpolate(go.value, [0, 1], [y, cy + (big * 1.14 - w * 1.14) / 2]) - Math.sin(go.value * Math.PI) * 18 }, { scale: scale(go.value) }, { rotate: `${interpolate(go.value, [0, 1], [r, -2])}deg` }],
  }));
  const front = useAnimatedStyle(() => ({ transform: [{ perspective: 900 }, { rotateY: `${flip.value * 180}deg` }] }));
  const back = useAnimatedStyle(() => ({ transform: [{ perspective: 900 }, { rotateY: `${flip.value * 180 + 180}deg` }] }));
  const face = { position: "absolute" as const, inset: 0, padding: w * .06, paddingBottom: w * .2, backgroundColor: "#FFFFFF", backfaceVisibility: "hidden" as const, boxShadow: "0 14px 24px -14px #5A0A2499" };
  return <Animated.View style={[{ position: "absolute", left: 0, top: 0, width: w, height: w * 1.14 }, frame]}>
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={turned ? note : "A snapshot. Turn it over"} style={{ flex: 1 }}>
      <Animated.View style={[face, front]}><View style={{ flex: 1, overflow: "hidden" }}><ReaderMomentArt moment={moment}/></View></Animated.View>
      <Animated.View style={[face, { backgroundColor: "#FFFDF7", justifyContent: "center" }, back]}><Text style={{ fontFamily: HANDWRITTEN, fontSize: 12.5, lineHeight: 17, color: "#7A0E33" }}>{note}</Text></Animated.View>
    </Pressable>
  </Animated.View>;
}

/* ── 5 · Character study: a graphic novel ─────────────────── */
function GraphicNovel({ card, art, onProgress }: Props) {
  const { top, bottom } = useChrome();
  const scenes = useMemo(() => [...paras(card).map(p => ({ caption: firstSentence(p), text: rest(p) || p })), { caption: card.scriptureReference, text: `“${card.scriptureText}”` }], [card]);
  const paintings = usePaintings(art, scenes.length);
  const [page, setPage] = useState(0);
  const turn = useSharedValue(1);
  useEffect(() => { onProgress(page / (scenes.length - 1)); }, [page, scenes.length, onProgress]);
  const next = (to: number) => { if (to < 0 || to >= scenes.length) return; haptics.soft(); turn.value = 0; setPage(to); turn.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }); };
  const pageStyle = useAnimatedStyle(() => ({ opacity: interpolate(turn.value, [0, .3, 1], [0, 1, 1]), transform: [{ perspective: 1400 }, { translateX: -160 }, { rotateY: `${(1 - turn.value) * 90}deg` }, { translateX: 160 }] }));
  const name = characterName(card.title, card.scriptureText).toUpperCase();
  const s = scenes[page]!;
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: "#F6EBDD" }]}>
    <View style={{ paddingTop: top, paddingHorizontal: 20, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
      <Text style={{ fontSize: 30, fontWeight: "900", letterSpacing: -1, color: "#E2500A" }}>{name}</Text>
      <Text style={[t.meta, { color: "#7A5A44" }]}>Page {page + 1} of {scenes.length}</Text>
    </View>
    <GestureDetector gesture={Gesture.Pan().activeOffsetX([-20, 20]).onEnd(e => { if (e.translationX < -40) runOnJS(next)(page + 1); else if (e.translationX > 40) runOnJS(next)(page - 1); })}>
      <Animated.View style={[{ position: "absolute", left: 14, right: 14, top: top + 56, bottom: bottom + 10, borderWidth: 4, borderColor: "#2A1000", borderRadius: 6, overflow: "hidden", backgroundColor: "#2A1000" }, pageStyle]}>
        <Pressable onPress={() => next(page + 1)} accessibilityRole="button" accessibilityLabel={`${s.caption} ${s.text}. Next page`} style={{ flex: 1 }}>
          <ReaderMomentArt moment={paintings[page]!}/>
          <View style={{ position: "absolute", left: 12, top: 12, right: 60, alignItems: "flex-start" }}><Text style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#FFF6D6", color: "#2A1000", fontSize: 14, lineHeight: 18, fontWeight: "800", boxShadow: "2px 2px 0 #2A1000" }}>{s.caption}</Text></View>
          <Animated.View key={page} entering={FadeInDown.delay(420).springify().damping(14)} style={{ position: "absolute", left: 16, right: 16, bottom: 16, padding: 14, backgroundColor: "#FFFFFF", borderWidth: 3, borderColor: "#2A1000", borderRadius: 22 }}>
            <Text selectable style={{ fontSize: 17, lineHeight: 23, fontWeight: "800", color: "#2A1000" }}>{s.text}</Text></Animated.View>
          {page < scenes.length - 1 && <View style={{ position: "absolute", right: 12, top: 12, width: 34, height: 34, borderRadius: 17, backgroundColor: "#E2500A", alignItems: "center", justifyContent: "center" }}><SFSymbol name="arrow.right" size={15} color="#FFFFFF" weight="bold"/></View>}
        </Pressable>
      </Animated.View>
    </GestureDetector>
  </View>;
}

/* ── 6 · Deep verse: a study desk ─────────────────────────── */
function StudyDesk({ card, onProgress }: Props) {
  const { top, bottom } = useChrome();
  // The phrase to mark: the day's key word if it has one, otherwise the verse's longest clause.
  const verse = card.scriptureText;
  const phrase = useMemo(() => {
    if (card.keyWord && verse.includes(card.keyWord.word)) return card.keyWord.word;
    return verse.split(/[,;:]/).map(s => s.trim()).sort((a, b) => b.length - a.length)[0] ?? verse;
  }, [card.keyWord, verse]);
  const at = verse.indexOf(phrase), before = verse.slice(0, at), after = verse.slice(at + phrase.length);
  const [step, setStep] = useState(0); // 0 verse · 1 highlighted · 2 note · 3+ study cards opened
  const [opened, setOpened] = useState<number[]>([]);
  const studies = paras(card);
  const hl = useSharedValue(0);
  useEffect(() => { onProgress(Math.min(1, (step >= 2 ? 2 : step) / 2 * .5 + opened.length / studies.length * .5)); }, [step, opened.length, studies.length, onProgress]);
  const mark = () => { if (step > 0) return; haptics.soft(); setStep(1); hl.value = withTiming(1, { duration: 700 }); setTimeout(() => setStep(2), 800); };
  const hlStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(hl.value, [0, 1], ["#FFD84D00", "#FFD84DE6"]) }));
  return <View style={StyleSheet.absoluteFill}>
    <ReaderMaterialGradient colors={["#6B4426", "#4A2E18", "#3A2312"]} style={StyleSheet.absoluteFill}/>
    <Animated.ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: top, paddingHorizontal: 18, paddingBottom: bottom + 20, gap: 18 }} showsVerticalScrollIndicator={false}>
      <View style={{ padding: 22, borderRadius: 6, backgroundColor: "#FFFBF2", boxShadow: "0 22px 40px -20px #000000AA", transform: [{ rotate: "-.6deg" }] }}>
        <Eyebrow color="#8A6A4A">Deep verse · {card.scriptureReference}</Eyebrow>
        <Text style={{ marginTop: 12, fontSize: 22, lineHeight: 34, fontWeight: "800", color: "#2A1A10" }} onPress={mark}>{before}<Animated.Text style={hlStyle}>{phrase}</Animated.Text>{after}</Text>
        {step === 0 && <Pressable onPress={mark} accessibilityRole="button" style={{ marginTop: 14, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, backgroundColor: "#2A1A10" }}><View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#FFD84D" }}/><Text style={{ color: "#FFF1E0", fontSize: 15, fontWeight: "800" }}>Highlight the heart of it</Text></Pressable>}
        {step >= 2 && <Animated.View entering={FadeInDown.springify().damping(12).withInitialValues({ transform: [{ translateY: -40 }, { rotate: "14deg" }] })} style={{ marginTop: 16, alignSelf: "flex-end", width: "62%", padding: 14, backgroundColor: "#FFE36B", transform: [{ rotate: "3deg" }], boxShadow: "0 10px 16px -10px #00000080" }}>
          <Text style={{ fontFamily: HANDWRITTEN, fontSize: 15, lineHeight: 20, color: "#4A3200" }}>{card.keyWord?.meaning ?? card.insight}</Text></Animated.View>}
      </View>
      {step >= 2 && <Animated.View entering={FadeIn.delay(400)} style={{ gap: 10 }}>
        <Eyebrow color="#F2DCC2">Study notes · tap to open</Eyebrow>
        {studies.map((p, i) => { const isOpen = opened.includes(i); return <Pressable key={i} onPress={() => { haptics.soft(); setOpened(o => isOpen ? o.filter(x => x !== i) : [...o, i]); }} accessibilityRole="button"
          style={{ padding: 16, borderRadius: 4, backgroundColor: "#FFFDF8", borderTopWidth: 4, borderTopColor: isOpen ? "#D2332A" : "#C9B79E", transform: [{ rotate: `${[-1, .8, -.6][i % 3]}deg` }], boxShadow: "0 10px 18px -12px #000000AA" }}>
          <Text style={{ fontSize: 16, fontWeight: "900", color: "#2A1A10" }}>{firstSentence(p)}</Text>
          {isOpen && !!rest(p) && <Animated.Text entering={FadeIn} selectable style={[t.body, { color: "#5A4030", marginTop: 8, fontSize: 16, lineHeight: 23 }]}>{rest(p)}</Animated.Text>}
        </Pressable>; })}
      </Animated.View>}
    </Animated.ScrollView>
  </View>;
}

/* ── 7 · Misconception: look again ────────────────────────── */
function LookAgain({ card, art, onProgress }: Props) {
  const { top, bottom } = useChrome(), { width } = useWindowDimensions();
  const assumption = card.myth ?? firstSentence(paras(card)[0] ?? card.title);
  const split = useSharedValue(width * .8), start = useSharedValue(0);
  const [seen, setSeen] = useState(false);
  const report = (x: number) => { const f = Math.min(1, Math.max(0, (width * .8 - x) / (width * .7))); onProgress(f); if (f > .85 && !seen) { setSeen(true); haptics.soft(); } };
  const pan = Gesture.Pan().onBegin(() => { start.value = split.value; }).onUpdate(e => { split.value = Math.max(16, Math.min(width - 16, start.value + e.translationX)); runOnJS(report)(split.value); });
  const grey = useAnimatedStyle(() => ({ width: split.value }));
  const line = useAnimatedStyle(() => ({ transform: [{ translateX: split.value }] }));
  const left = useAnimatedStyle(() => ({ opacity: interpolate(split.value, [width * .5, width * .7], [0, 1], "clamp") }));
  const right = useAnimatedStyle(() => ({ opacity: interpolate(split.value, [width * .3, width * .5], [1, 0], "clamp"), transform: [{ translateY: interpolate(split.value, [width * .3, width * .5], [0, 16], "clamp") }] }));
  return <GestureDetector gesture={pan}><View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }]}>
    <View style={StyleSheet.absoluteFill}><ReaderMomentArt moment={art}/></View>
    <Animated.View style={[{ position: "absolute", left: 0, top: 0, bottom: 0, overflow: "hidden" }, grey]}>
      <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width }}><ReaderMomentArt moment={art}/>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#7A7A7A", mixBlendMode: "saturation" }]}/><View style={[StyleSheet.absoluteFill, { backgroundColor: "#0000008C" }]}/></View>
    </Animated.View>
    <ReaderMaterialGradient colors={["#00000099", "#00000000", "#00000000", "#000000D9"]} locations={[0, .35, .5, 1]} style={StyleSheet.absoluteFill}/>
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 24, top: top + 24, width: width * .72 }, left]}>
      <Eyebrow color="#D8D2CC">What it looks like</Eyebrow>
      <Text style={{ marginTop: 12, fontSize: 28, lineHeight: 34, fontWeight: "900", letterSpacing: -.7, color: "#FFFFFF" }}>{assumption}</Text>
    </Animated.View>
    <Animated.View pointerEvents="none" style={[{ position: "absolute", right: 24, left: 56, bottom: bottom + 16 }, right]}>
      <Eyebrow color="#FFD84D">Look again · {card.scriptureReference}</Eyebrow>
      <Text style={{ marginTop: 12, fontSize: 25, lineHeight: 31, fontWeight: "900", letterSpacing: -.5, color: "#FFFFFF" }}>“{card.scriptureText}”</Text>
      <Text style={[t.meta, { color: "#FFFFFFD9", marginTop: 10 }]}>{card.insight}</Text>
    </Animated.View>
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: -1.5, top: 0, bottom: 0, width: 3, backgroundColor: "#FFFFFF" }, line]}/>
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: -30, top: "48%", width: 60, height: 60, borderRadius: 30, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 24px -8px #000000AA" }, line]}>
      <SFSymbol name="chevron.left.chevron.right" size={20} color="#2A1206" weight="bold"/></Animated.View>
    {!seen && <Animated.View pointerEvents="none" exiting={FadeOut} style={{ position: "absolute", left: 0, right: 0, bottom: bottom + 8, alignItems: "center" }}><Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "800" }}>Drag to look again</Text></Animated.View>}
  </View></GestureDetector>;
}

/* ── 8 · Testimony: a film reel ───────────────────────────── */
const CHAPTER_NAMES = ["Before", "The turn", "Now"];
function FilmReel({ card, art, onProgress }: Props) {
  const { top, bottom } = useChrome(), { width } = useWindowDimensions();
  const chapters = paras(card);
  const frames = usePaintings(art, chapters.length);
  const [ch, setCh] = useState(0);
  const reel = useSharedValue(0), start = useSharedValue(0), flash = useSharedValue(0);
  const frameW = 82, span = Math.max(1, chapters.length - 1) * frameW * 2;
  useEffect(() => { onProgress(ch / Math.max(1, chapters.length - 1)); }, [ch, chapters.length, onProgress]);
  const cut = (to: number) => { if (to === ch) return; haptics.soft(); setCh(to); flash.value = withSequence(withTiming(.7, { duration: 60 }), withTiming(0, { duration: 260 })); };
  const pan = Gesture.Pan().onBegin(() => { start.value = reel.value; }).onUpdate(e => {
    reel.value = Math.max(0, Math.min(span, start.value - e.translationX));
    runOnJS(cut)(Math.round(reel.value / span * (chapters.length - 1)));
  }).onEnd(() => { reel.value = withSpring(Math.round(reel.value / span * (chapters.length - 1)) * (span / Math.max(1, chapters.length - 1)), spring); });
  const strip = useAnimatedStyle(() => ({ transform: [{ translateX: width / 2 - frameW / 2 - reel.value }] }));
  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));
  const words = chapters.slice(0, ch + 1).join(" ").split(/\s+/).length, secs = Math.round(words / 2.6), total = Math.round(card.story.split(/\s+/).length / 2.6);
  const tc = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: "#141210" }]}>
    <View style={{ paddingTop: top, paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Eyebrow color="#4BE08F">Testimony · {card.title}</Eyebrow>
      <Text style={{ fontSize: 15, fontWeight: "800", color: "#F2EDE6", fontVariant: ["tabular-nums"] }}>{tc(secs)} / {tc(total)}</Text>
    </View>
    <View style={{ marginHorizontal: 20, marginTop: 14, height: 260, borderRadius: 14, overflow: "hidden", backgroundColor: "#000" }}>
      <Animated.View key={ch} entering={FadeIn.duration(200)} style={StyleSheet.absoluteFill}><ReaderMomentArt moment={frames[ch]!}/></Animated.View>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#FFFFFF" }, flashStyle]}/>
      <View style={{ position: "absolute", left: 16, bottom: 14, flexDirection: "row", alignItems: "center", gap: 8 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#FF3B30" }}/><Text style={{ color: "#FFFFFF", fontSize: 13, fontWeight: "800", letterSpacing: 1 }}>CH {ch + 1} · {(CHAPTER_NAMES[ch] ?? `Part ${ch + 1}`).toUpperCase()}</Text></View>
    </View>
    <Animated.ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 18, paddingBottom: 12 }} showsVerticalScrollIndicator={false}>
      <Animated.View key={ch} entering={FadeIn.duration(300)}>
        <Text style={{ fontSize: 24, lineHeight: 30, fontWeight: "900", letterSpacing: -.5, color: "#F2EDE6" }}>{firstSentence(chapters[ch]!)}</Text>
        {!!rest(chapters[ch]!) && <Text selectable style={[t.body, { color: "#BDB4A8", marginTop: 10 }]}>{rest(chapters[ch]!)}</Text>}
      </Animated.View>
    </Animated.ScrollView>
    <GestureDetector gesture={pan}><View style={{ height: 96, backgroundColor: "#0A0908", overflow: "hidden", justifyContent: "center" }}>
      <Animated.View style={[{ flexDirection: "row", gap: 6 }, strip]}>{Array.from({ length: chapters.length * 2 - 1 }, (_, i) => <View key={i} style={{ width: frameW - 6, height: 56, borderRadius: 3, overflow: "hidden", opacity: i % 2 ? .55 : 1 }}><ReaderMomentArt moment={frames[Math.floor(i / 2)]!}/></View>)}</Animated.View>
      <View style={{ position: "absolute", left: 0, right: 0, top: 6, height: 8, flexDirection: "row", gap: 10 }}>{Array.from({ length: 30 }, (_, i) => <View key={i} style={{ width: 10, backgroundColor: "#2A2622" }}/>)}</View>
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 6, height: 8, flexDirection: "row", gap: 10 }}>{Array.from({ length: 30 }, (_, i) => <View key={i} style={{ width: 10, backgroundColor: "#2A2622" }}/>)}</View>
      <View pointerEvents="none" style={{ position: "absolute", left: width / 2 - 2, top: 0, bottom: 0, width: 4, backgroundColor: "#4BE08F" }}/>
    </View></GestureDetector>
    <View style={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: bottom, flexDirection: "row", gap: 6 }}>
      {chapters.map((_, i) => <Pressable key={i} onPress={() => { cut(i); reel.value = withSpring(i * (span / Math.max(1, chapters.length - 1)), spring); }} accessibilityRole="button" style={{ flex: 1 }}>
        <View style={{ height: 5, borderRadius: 3, backgroundColor: i <= ch ? "#4BE08F" : "#FFFFFF26" }}/>
        <Text style={{ marginTop: 8, fontSize: 13, fontWeight: "800", color: i === ch ? "#4BE08F" : "#BDB4A8" }}>{CHAPTER_NAMES[i] ?? `Part ${i + 1}`}</Text></Pressable>)}
    </View>
  </View>;
}

/* ── 9 · Honest question: a branching conversation ────────── */
function BranchingQuestion({ card, onProgress }: Props) {
  const { top, bottom } = useChrome();
  const [p1, p2, p3] = paras(card);
  const branches = useMemo(() => [
    { ask: "What actually happened?", answer: p1 ?? card.story, ref: false },
    { ask: "Why does it matter?", answer: [p2, p3].filter(Boolean).join(" ") || card.insight, ref: false },
    { ask: "What does it mean for me?", answer: card.insight, ref: true },
  ], [p1, p2, p3, card.story, card.insight]);
  const [path, setPath] = useState<number[]>([]);
  useEffect(() => { onProgress(path.length / branches.length); }, [path.length, branches.length, onProgress]);
  const current = path[path.length - 1], remaining = branches.map((_, i) => i).filter(i => !path.includes(i));
  const choose = (i: number) => { haptics.soft(); setPath(p => [...p, i]); };
  return <View style={StyleSheet.absoluteFill}>
    <ReaderMaterialGradient colors={["#4A3624", "#33261C", "#261D17"]} style={StyleSheet.absoluteFill}/>
    <Animated.ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingTop: top, paddingHorizontal: 24, paddingBottom: bottom + 20 }} showsVerticalScrollIndicator={false}>
      <Eyebrow color="#FFC21A">Honest question · {card.scriptureReference}</Eyebrow>
      <Text accessibilityRole="header" style={{ marginTop: 10, fontSize: current === undefined ? 34 : 22, lineHeight: current === undefined ? 39 : 27, fontWeight: "900", letterSpacing: -.8, color: current === undefined ? "#FFFFFF" : "#C9B59D" }}>{card.question ?? card.title}</Text>
      {current !== undefined && <Animated.View key={current} entering={FadeInDown.springify().damping(15)} style={{ marginTop: 18, gap: 12 }}>
        <View style={{ alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 18, borderWidth: 1.5, borderColor: "#FFC21A", backgroundColor: "#FFC21A1F" }}><Text style={{ color: "#FFC21A", fontSize: 17, fontWeight: "800" }}>{branches[current]!.ask}</Text></View>
        <View style={{ padding: 20, borderRadius: 24, backgroundColor: "#FFC21A" }}>
          {branches[current]!.ref && <Text selectable style={{ fontSize: 19, lineHeight: 25, fontWeight: "900", color: "#2A1206", marginBottom: 10 }}>“{card.scriptureText}”</Text>}
          <Text selectable style={{ fontSize: 17, lineHeight: 24, fontWeight: "600", color: "#2A1206" }}>{branches[current]!.answer}</Text>
        </View>
      </Animated.View>}
      {remaining.length > 0 && <Animated.View key={`r${path.length}`} entering={FadeInDown.delay(current === undefined ? 0 : 350)} style={{ marginTop: 26, gap: 10 }}>
        <Text style={{ fontSize: 15, fontWeight: "800", color: "#C9B59D" }}>{current === undefined ? "What are you actually thinking?" : "Then you might wonder"}</Text>
        {remaining.map(i => <Pressable key={i} onPress={() => choose(i)} accessibilityRole="button" style={{ padding: 18, borderRadius: 22, backgroundColor: "#FFFFFF0F", borderWidth: 1.5, borderColor: "#FFC21A59", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <Text style={{ flex: 1, color: "#F7F0E6", fontSize: 18, lineHeight: 23, fontWeight: "800" }}>{branches[i]!.ask}</Text><SFSymbol name="arrow.right" size={15} color="#FFC21A" weight="bold"/></Pressable>)}
      </Animated.View>}
      {current === undefined && <Text style={{ marginTop: 26, textAlign: "center", color: "#C9B59D", fontSize: 15, fontWeight: "700" }}>There are no wrong questions here.</Text>}
      {path.length > 0 && <View style={{ marginTop: 24, flexDirection: "row", alignItems: "center", gap: 8 }}>{branches.map((_, i) => <View key={i} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: i < path.length ? "#FFC21A" : "#FFFFFF26" }}/>)}<Text style={{ marginLeft: 4, color: "#C9B59D", fontSize: 13, fontWeight: "800" }}>Your path · {path.length} of {branches.length}</Text></View>}
    </Animated.ScrollView>
  </View>;
}

const t = StyleSheet.create({
  eyebrow: { fontSize: 13, lineHeight: 17, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" },
  h1: { fontSize: 32, lineHeight: 36, fontWeight: "900", letterSpacing: -.9 },
  body: { fontSize: 17, lineHeight: 25, fontWeight: "500" },
  meta: { fontSize: 15, lineHeight: 20, fontWeight: "600" },
});
