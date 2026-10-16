import { memo, useEffect, useRef, useState } from "react";
import { AccessibilityInfo, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Text, TextInput } from "@/components/CloserText";
import { FeedbackPressable as Pressable } from "./FeedbackPressable";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { ReaderMomentArt } from "./ReaderMomentArt";
import { CategoryGesture, characterName } from "./CategoryArt";
import { SFSymbol } from "./Symbol";
import { HANDWRITTEN } from "./HomeQuoteText";
import type { BIBLE_MOMENTS } from "@/constants/bibleMoments";
import type { FloatingScriptureCard } from "@/constants/homePrototype";
import * as haptics from "@/lib/haptics";

/**
 * The opened reading, shaped by the day's category. Every category keeps
 * the same five parts of the devotional (title, verse, story, insight,
 * painting) and the same chrome; what changes is how the page is built:
 * an order of service, red letters, a letter, a card, a profile, one verse
 * slowly, a struck myth, a timeline, a question.
 */

export type ReadingTheme = {
  /** The page behind everything, top to bottom. */
  ground: [string, string];
  /** A coloured header band: the strip behind the close button matches its top. */
  band?: [string, string];
  statusBar: "light" | "dark";
  closeBg: string; closeInk: string; bar: string; track: string;
  ctaBg: string; ctaInk: string;
};

const LIGHT = { statusBar: "dark" as const };
export const READING_THEMES: Record<string, ReadingTheme> = {
  "daily-church": { ...LIGHT, ground: ["#FFF8EA", "#FFF8EA"], band: ["#FFC21A", "#FF9F0A"], closeBg: "#FFFFFF59", closeInk: "#3A1500", bar: "#3A1500", track: "#3A150026", ctaBg: "#3A1500", ctaInk: "#FFF6C9" },
  "jesus-only": { ...LIGHT, ground: ["#FFF7F2", "#FFF7F2"], closeBg: "#F4E6E2", closeInk: "#2A0A10", bar: "#E0233A", track: "#2A0A1022", ctaBg: "#C21A33", ctaInk: "#FFFFFF" },
  "letters-struggling": { ...LIGHT, ground: ["#1FB878", "#0A6B47"], closeBg: "#FFFFFF33", closeInk: "#FFFFFF", bar: "#FFFFFF", track: "#FFFFFF40", ctaBg: "#0A6B47", ctaInk: "#FFFFFF" },
  "letters-grateful": { ...LIGHT, ground: ["#FFEFF3", "#FFEFF3"], closeBg: "#FFFFFF99", closeInk: "#3A0716", bar: "#B0124A", track: "#3A071626", ctaBg: "#7A0E33", ctaInk: "#FFFFFF" },
  "character-studies": { ...LIGHT, ground: ["#FFF4EA", "#FFF4EA"], band: ["#FF8A2B", "#E2500A"], closeBg: "#FFFFFF40", closeInk: "#FFFFFF", bar: "#FFFFFF", track: "#FFFFFF4D", ctaBg: "#3A1200", ctaInk: "#FFF1E0" },
  "deep-verse": { statusBar: "light", ground: ["#2A2032", "#18121C"], closeBg: "#FFFFFF14", closeInk: "#F7F0E6", bar: "#FFC21A", track: "#FFFFFF24", ctaBg: "#FFC21A", ctaInk: "#2A1206" },
  "misconceptions": { ...LIGHT, ground: ["#FFFFFF", "#FFF6E8"], closeBg: "#F1ECE6", closeInk: "#2A1206", bar: "#FF2E1F", track: "#2A120622", ctaBg: "#2A1206", ctaInk: "#FFFFFF" },
  "testimonies": { ...LIGHT, ground: ["#F2FBF5", "#F2FBF5"], band: ["#2FCB7A", "#0E8A4C"], closeBg: "#FFFFFF40", closeInk: "#FFFFFF", bar: "#FFFFFF", track: "#FFFFFF4D", ctaBg: "#0A6E3C", ctaInk: "#FFFFFF" },
  "questions": { statusBar: "light", ground: ["#3A2B1F", "#261D17"], closeBg: "#FFFFFF14", closeInk: "#F7F0E6", bar: "#FFC21A", track: "#FFFFFF24", ctaBg: "#FFC21A", ctaInk: "#2A1206" },
};
export const readingTheme = (categoryId: string) => READING_THEMES[categoryId] ?? READING_THEMES["daily-church"]!;

type Highlight = { available: boolean; on: boolean; disabled: boolean; toggle: () => void };
type Props = { categoryId: string; card: FloatingScriptureCard; art: typeof BIBLE_MOMENTS[number]; progress: number; highlight: Highlight };

/** Memoised: the reading only re-renders when its content, progress step or highlight changes. */
export const CategoryReading = memo(function CategoryReading(props: Props) {
  switch (props.categoryId) {
    case "jesus-only": return <RedLetters {...props}/>;
    case "letters-struggling": return <DearFriend {...props}/>;
    case "letters-grateful": return <ThankYouCard {...props}/>;
    case "character-studies": return <Profile {...props}/>;
    case "deep-verse": return <OneVerse {...props}/>;
    case "misconceptions": return <StruckThrough {...props}/>;
    case "testimonies": return <ThenAndNow {...props}/>;
    case "questions": return <SitWithIt {...props}/>;
    default: return <MorningService {...props}/>;
  }
}, (a, b) => a.categoryId === b.categoryId && a.card === b.card && a.art === b.art && a.progress === b.progress
  && a.highlight.available === b.highlight.available && a.highlight.on === b.highlight.on && a.highlight.disabled === b.highlight.disabled);

/* ── Shared pieces ─────────────────────────────────────────── */

const paras = (card: FloatingScriptureCard) => card.story.split(/\n\n+/);
const clamp = (v: number) => Math.max(0, Math.min(1, v));

function Eyebrow({ children, color, style }: { children: React.ReactNode; color: string; style?: object }) {
  return <Text style={[t.eyebrow, { color }, style]}>{children}</Text>;
}
function Painting({ art, height = 200 }: { art: Props["art"]; height?: number }) {
  return <View style={{ height, borderRadius: 24, borderCurve: "continuous", overflow: "hidden" }}><ReaderMomentArt moment={art}/></View>;
}
/** The verse highlight that used to live on the yellow card, coloured for each page. */
function HighlightChip({ highlight, ink, bg, onInk, onBg }: { highlight: Highlight; ink: string; bg: string; onInk: string; onBg: string }) {
  if (!highlight.available) return null;
  const on = highlight.on;
  return <Pressable accessibilityRole="button" accessibilityLabel={on ? "Remove highlight" : "Highlight verse"} accessibilityState={{ selected: on }} disabled={highlight.disabled}
    onPress={() => { highlight.toggle(); haptics.soft(); }} style={[t.chip, { backgroundColor: on ? onBg : bg }]}>
    <SFSymbol name={on ? "checkmark" : "pencil"} color={on ? onInk : ink} size={14}/>
    <Text style={{ fontSize: 14, fontWeight: "700", color: on ? onInk : ink }}>{on ? "Highlighted" : "Highlight"}</Text>
  </Pressable>;
}
function Closing({ color }: { color: string }) {
  return <Text style={[t.body, { color, textAlign: "center", marginTop: 8 }]}>The Lord is closer than you think.</Text>;
}
/** A value that eases toward the reading progress instead of stepping with each scroll event. */
function useSmooth(target: number) {
  const v = useSharedValue(target);
  useEffect(() => { v.value = withTiming(target, { duration: 160 }); }, [target, v]);
  return v;
}
/** A full-width coloured header that starts under the close button. */
function Band({ colors, height, children }: { colors: [string, string]; height: number; children: React.ReactNode }) {
  return <View style={{ marginHorizontal: -20, marginTop: -20, height, overflow: "hidden" }}>
    <ReaderMaterialGradient colors={colors} style={StyleSheet.absoluteFill}/>
    {children}
  </View>;
}
/** The spoken words of a verse (in single quotes), set apart in `color`. */
function Spoken({ verse, color }: { verse: string; color: string }) {
  const parts: { text: string; said: boolean }[] = [];
  const re = /(^|[\s,:])'(.+?)'(?=[\s.,;!?]|$)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(verse))) {
    const start = m.index + m[1].length;
    parts.push({ text: verse.slice(last, start), said: false }, { text: `‘${m[2]}’`, said: true });
    last = start + m[2].length + 2;
  }
  parts.push({ text: verse.slice(last), said: false });
  return <>{parts.map((p, i) => p.said ? <Text key={i} style={{ color }}>{p.text}</Text> : p.text)}</>;
}

/* ── 1 · Daily Church: the morning service ─────────────────── */
function MorningService({ card, art, highlight }: Props) {
  const [p1, ...rest] = paras(card), ink = "#3A1500", label = "#8A3B00", num = "#B5400A";
  const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => <View style={{ flexDirection: "row", gap: 14 }}>
    <Text style={{ width: 22, fontSize: 15, lineHeight: 17, fontWeight: "900", color: num }}>{n}</Text>
    <View style={{ flex: 1, gap: 10 }}><Eyebrow color={label}>{title}</Eyebrow>{children}</View>
  </View>;
  return <View>
    <Band colors={READING_THEMES["daily-church"].band!} height={250}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}><CategoryGesture id="daily-church" title={card.title} text={card.scriptureText} top={40}/></View>
      <View style={{ position: "absolute", left: 20, right: 150, bottom: 52, gap: 10 }}>
        <Eyebrow color={label}>Daily Church · Day {card.day}</Eyebrow>
        <Text accessibilityRole="header" style={[t.h1, { color: ink }]}>{card.title}</Text>
      </View>
    </Band>
    <View style={{ marginHorizontal: -20, marginTop: -32, paddingHorizontal: 20, paddingTop: 28, gap: 22, backgroundColor: "#FFF8EA", borderTopLeftRadius: 32, borderTopRightRadius: 32, borderCurve: "continuous" }}>
      <Step n={1} title={`The reading · ${card.scriptureReference}`}>
        <Text selectable style={[t.verse, { color: ink }]}>{card.scriptureText}</Text>
        <HighlightChip highlight={highlight} ink={ink} bg="#FFE9B0" onInk="#FFF6C9" onBg={ink}/>
      </Step>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: "#3A150033", marginLeft: 36 }}/>
      <Step n={2} title="The message">{[p1, ...rest].map((p, i) => <Text key={i} selectable style={[t.body, { color: ink }]}>{p}</Text>)}<Painting art={art}/></Step>
      <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: "#3A150033", marginLeft: 36 }}/>
      <Step n={3} title="Take home"><Text selectable style={[t.insight, { color: ink }]}>{card.insight}</Text></Step>
      <Closing color={label}/>
    </View>
  </View>;
}

/* ── 2 · Jesus Only: His words in red ──────────────────────── */
function RedLetters({ card, art, highlight }: Props) {
  const ink = "#2A0A10", red = "#D11A36";
  return <View style={{ gap: 22 }}>
    <View>
      <View pointerEvents="none" accessible={false} style={{ position: "absolute", right: -38, top: -34 }}><Text style={{ fontSize: 150, lineHeight: 156, fontWeight: "900", letterSpacing: -9, color: "#E0233A14" }}>Him<Text style={{ color: "#FFC21A" }}>.</Text></Text></View>
      <Eyebrow color="#B0152D">Jesus Only · Day {card.day}</Eyebrow>
      <Text accessibilityRole="header" style={[t.h1, { color: ink, marginTop: 10, maxWidth: 300 }]}>{card.title}</Text>
    </View>
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}><View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#E0233A" }}/><Text style={[t.meta, { color: "#8A5560" }]}>His words are in red · {card.scriptureReference}</Text></View>
      <Text selectable style={[t.verse, { color: "#5A3A40", fontSize: 24, lineHeight: 33 }]}><Spoken verse={card.scriptureText} color={red}/></Text>
      <HighlightChip highlight={highlight} ink={red} bg="#FBE3E5" onInk="#FFFFFF" onBg={red}/>
    </View>
    <View style={{ width: 40, height: 2, borderRadius: 1, backgroundColor: "#E0233A" }}/>
    <Painting art={art}/>
    {paras(card).map((p, i) => <Text key={i} selectable style={[t.body, { color: ink }]}>{p}</Text>)}
    <View style={[t.card, { backgroundColor: "#C21A33" }]}><Eyebrow color="#FFE27A">Carry this with you</Eyebrow><Text selectable style={[t.insight, { color: "#FFFFFF", marginTop: 12 }]}>{card.insight}<Text style={{ color: "#FFC21A" }}> ●</Text></Text></View>
    <Closing color="#8A5560"/>
  </View>;
}

/* ── 3 · A struggling letter: Dear friend ──────────────────── */
const RULE = 32;
function DearFriend({ card, art, highlight }: Props) {
  const ink = "#22332B";
  const [height, setHeight] = useState(0);
  return <View>
    <View pointerEvents="none" accessible={false} style={{ position: "absolute", right: -14, top: -40 }}><Text style={{ fontSize: 240, lineHeight: 250, fontWeight: "900", color: "#FFB38A", transform: [{ rotate: "-6deg" }] }}>“</Text></View>
    <View onLayout={e => setHeight(e.nativeEvent.layout.height)} style={{ marginTop: 70, marginHorizontal: -6, borderRadius: 18, borderCurve: "continuous", backgroundColor: "#FFFBF2", transform: [{ rotate: "-1.2deg" }], boxShadow: "0 20px 40px -18px #0A3A2899", overflow: "hidden" }}>
      {/* Ruled lines, and the red margin. */}
      {/* The first line of the letter starts 114pt down; each rule sits just under a line of text. */}
      {Array.from({ length: Math.max(0, Math.floor((height - 114) / RULE)) }, (_, i) => <View key={i} pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 114 + i * RULE + 27, height: 1, backgroundColor: "#CFE3D8" }}/>)}
      <View pointerEvents="none" style={{ position: "absolute", left: 30, top: 0, bottom: 0, width: 1.5, backgroundColor: "#F2B8A8" }}/>
      <View style={{ paddingLeft: 46, paddingRight: 22, paddingTop: 26, paddingBottom: 30 }}>
        <Text style={[t.meta, { color: "#5F7A6C" }]}>{card.scriptureReference} · Day {card.day}</Text>
        <Text accessibilityRole="header" style={{ fontFamily: HANDWRITTEN, fontSize: 30, lineHeight: 40, color: "#0A6B47", marginTop: 22 }}>Dear friend,</Text>
        {paras(card).map((p, i) => <Text key={i} selectable style={[t.body, { color: ink, lineHeight: RULE, marginTop: i ? RULE : 6 }]}>{p}</Text>)}
        <View style={{ marginTop: 26, marginLeft: -10, marginRight: -6, padding: 18, borderRadius: 6, backgroundColor: "#FFE0C9", transform: [{ rotate: "1.4deg" }], boxShadow: "0 6px 14px -8px #00000055" }}>
          <Text selectable style={{ fontSize: 19, lineHeight: 26, fontWeight: "800", color: "#5A2410" }}>“{card.scriptureText}”</Text>
          <View style={{ flexDirection: "row", alignItems: "center", marginTop: 10, gap: 10 }}><Text style={[t.meta, { flex: 1, fontSize: 13, color: "#8A4A2A" }]}>{card.scriptureReference}</Text><HighlightChip highlight={highlight} ink="#5A2410" bg="#FFF1E4" onInk="#FFF1E4" onBg="#5A2410"/></View>
        </View>
        <View style={{ marginTop: 26, padding: 8, paddingBottom: 30, backgroundColor: "#FFFFFF", transform: [{ rotate: "-2deg" }], boxShadow: "0 8px 18px -10px #00000066", alignSelf: "center", width: "86%" }}><Painting art={art} height={170}/></View>
        <Text selectable style={[t.body, { color: ink, lineHeight: RULE, marginTop: 26 }]}>{card.insight}</Text>
        <Text style={{ fontFamily: HANDWRITTEN, fontSize: 24, lineHeight: 32, color: "#0A6B47", marginTop: 18, textAlign: "right" }}>With you, Closer</Text>
      </View>
    </View>
  </View>;
}

/* ── 4 · A grateful letter: the thank-you card ─────────────── */
function ThankYouCard({ card, art, highlight }: Props) {
  const ink = "#3A0716", plum = "#7A0E33", key = `closer.thanks.${card.id}`;
  const [thanks, setThanks] = useState(""), timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => { AsyncStorage.getItem(key).then(v => { if (v) setThanks(v); }).catch(() => {}); }, [key]);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const write = (v: string) => { setThanks(v); if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => { AsyncStorage.setItem(key, v).catch(() => {}); }, 400); };
  return <View style={{ gap: 22 }}>
    <View style={{ height: 290, borderRadius: 26, borderCurve: "continuous", overflow: "hidden", boxShadow: "0 18px 30px -18px #A0123F99" }}>
      <ReaderMaterialGradient colors={["#FF9AB5", "#F24F7F"]} style={StyleSheet.absoluteFill}/>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}><CategoryGesture id="letters-grateful" title={card.title} text={card.scriptureText} scale={.7} top={52}/></View>
      <View style={{ position: "absolute", left: 22, right: 22, bottom: 22, gap: 8 }}>
        <Eyebrow color="#5A0A24">A grateful letter · Day {card.day}</Eyebrow>
        <Text accessibilityRole="header" style={[t.h1, { color: ink, fontSize: 30, lineHeight: 34 }]}>{card.title}</Text>
        <Text style={[t.meta, { color: "#5A0A24" }]}>{card.scriptureReference}</Text>
      </View>
    </View>
    <Text selectable style={[t.verse, { color: ink, fontSize: 21, lineHeight: 29 }]}><Spoken verse={card.scriptureText} color="#B0124A"/></Text>
    <HighlightChip highlight={highlight} ink={plum} bg="#FFD9E3" onInk="#FFFFFF" onBg={plum}/>
    {paras(card).map((p, i) => <Text key={i} selectable style={[t.body, { color: "#4A1A2A" }]}>{p}</Text>)}
    <Painting art={art}/>
    <View style={[t.card, { backgroundColor: ink }]}><Eyebrow color="#FFB3C6">Carry this with you</Eyebrow><Text selectable style={[t.insight, { color: "#FFF0F4", marginTop: 12 }]}>{card.insight}</Text></View>
    <View style={[t.card, { backgroundColor: "#FFFFFF", boxShadow: "0 10px 26px -16px #A0123F66" }]}>
      <Text style={{ fontFamily: HANDWRITTEN, fontSize: 26, lineHeight: 34, color: "#B0124A" }}>Thank you for…</Text>
      <TextInput value={thanks} onChangeText={write} placeholder="One line" placeholderTextColor="#C7A0AC" maxLength={140} accessibilityLabel="Thank you for"
        style={{ marginTop: 8, paddingVertical: 10, borderBottomWidth: 1.5, borderBottomColor: "#E8C6D0", fontFamily: HANDWRITTEN, fontSize: 22, color: ink }}/>
      <Text style={[t.meta, { color: "#8A5A68", marginTop: 12 }]}>Just for you. It stays on this phone.</Text>
    </View>
    <Closing color="#8A5A68"/>
  </View>;
}

/* ── 5 · Character study: the profile ──────────────────────── */
function Profile({ card, art, progress, highlight }: Props) {
  const name = (card.character?.name ?? characterName(card.title, card.scriptureText)).toUpperCase();
  const facts = card.character?.facts ?? [card.scriptureReference];
  const ink = "#2A1000", scenes = paras(card);
  return <View style={{ gap: 22 }}>
    <Band colors={READING_THEMES["character-studies"].band!} height={290}>
      <Text accessible={false} numberOfLines={1} style={{ position: "absolute", left: 14, top: 26, fontSize: 140, lineHeight: 146, fontWeight: "900", letterSpacing: -7, color: "#FFFFFF47" }}><Text style={{ color: "#3A1200" }}>{name.charAt(0)}</Text>{name.slice(1)}</Text>
      <View style={{ position: "absolute", left: 20, right: 20, bottom: 22, gap: 8 }}>
        <Eyebrow color="#FFF1E0">Character study · Day {card.day}</Eyebrow>
        <Text accessibilityRole="header" style={[t.h1, { color: "#FFFFFF" }]}>{card.title}</Text>
      </View>
    </Band>
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{facts.map(f => <View key={f} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: "#FFE3CC" }}><Text style={{ fontSize: 15, fontWeight: "800", color: "#5A2600" }}>{f}</Text></View>)}</View>
    <View style={[t.card, { backgroundColor: "#FFE9D6" }]}>
      <Text selectable style={[t.verse, { color: ink, fontSize: 21, lineHeight: 29 }]}>“{card.scriptureText}”</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 }}><Text style={[t.meta, { flex: 1, color: "#8A3B00" }]}>{card.scriptureReference}</Text><HighlightChip highlight={highlight} ink="#5A2600" bg="#FFF4EA" onInk="#FFF1E0" onBg="#3A1200"/></View>
    </View>
    {scenes.map((p, i) => {
      const reached = progress >= i / scenes.length;
      return <View key={i} style={{ flexDirection: "row", gap: 14 }}>
        <View style={{ width: 36, alignItems: "center", gap: 6 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: reached ? "#3A1200" : "#FFE3CC" }}><Text style={{ fontSize: 15, fontWeight: "900", color: reached ? "#FFF1E0" : "#8A3B00" }}>{i + 1}</Text></View>
          {i < scenes.length - 1 && <View style={{ flex: 1, width: 2, backgroundColor: "#3A120022" }}/>}
        </View>
        <View style={{ flex: 1, gap: 6, paddingBottom: 8 }}>
          <Eyebrow color="#A3440A">{["Scene one", "Scene two", "Scene three", "Scene four"][i] ?? `Scene ${i + 1}`}</Eyebrow>
          <Text selectable style={[t.body, { color: ink }]}>{p}</Text>
          {i === 0 && <View style={{ marginTop: 10 }}><Painting art={art} height={180}/></View>}
        </View>
      </View>;
    })}
    <View style={[t.card, { backgroundColor: "#3A1200" }]}><Eyebrow color="#FFB15C">What {name.charAt(0) + name.slice(1).toLowerCase()} teaches</Eyebrow><Text selectable style={[t.insight, { color: "#FFF1E0", marginTop: 12 }]}>{card.insight}</Text></View>
    <Closing color="#8A3B00"/>
  </View>;
}

/* ── 6 · Deep verse: one verse, slowly ─────────────────────── */
function OneVerse({ card, progress, highlight }: Props) {
  const words = card.scriptureText.split(/\s+/), key = card.keyWord?.word.toLowerCase();
  // Scrolling lights the verse word by word; it starts a third lit so the first screen reads.
  const lit = Math.ceil(words.length * clamp(.35 + progress * 1.8));
  return <View style={{ gap: 26 }}>
    <View style={{ gap: 16 }}>
      <Eyebrow color="#FFC21A">Deep verse · {card.scriptureReference}</Eyebrow>
      <Text accessibilityRole="header" accessibilityLabel={`${card.title}. ${card.scriptureText}`} style={{ fontSize: 34, lineHeight: 42, fontWeight: "900", letterSpacing: -1 }}>
        {words.map((w, i) => {
          const isKey = !!key && w.replace(/[^A-Za-z]/g, "").toLowerCase() === key;
          return <Text key={i} style={{ color: isKey ? "#FFC21A" : i < lit ? "#F7F0E6" : "#F7F0E638", textDecorationLine: isKey ? "underline" : "none", textDecorationColor: "#F7F0E6" }}>{w}{i < words.length - 1 ? " " : ""}</Text>;
        })}
      </Text>
      <HighlightChip highlight={highlight} ink="#F7F0E6" bg="#FFFFFF14" onInk="#2A1206" onBg="#FFC21A"/>
    </View>
    {card.keyWord && <View style={[t.card, { backgroundColor: "#FFFFFF0F", borderWidth: 1, borderColor: "#FFFFFF14" }]}>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: 10 }}><Text style={{ fontSize: 26, fontWeight: "900", color: "#FFC21A" }}>{card.keyWord.word}</Text>{!!card.keyWord.original && <Text style={[t.meta, { color: "#B8A8C4" }]}>{card.keyWord.original}</Text>}</View>
      <Text selectable style={[t.body, { color: "#E9DFF0", marginTop: 8 }]}>{card.keyWord.meaning}</Text>
    </View>}
    <View style={{ gap: 6 }}><Eyebrow color="#B8A8C4">{card.title}</Eyebrow></View>
    {paras(card).map((p, i) => <Text key={i} selectable style={[t.body, { color: "#E9DFF0" }]}>{p}</Text>)}
    <View style={[t.card, { backgroundColor: "#FFC21A" }]}><Eyebrow color="#5A3A00">Carry this with you</Eyebrow><Text selectable style={[t.insight, { color: "#2A1206", marginTop: 12 }]}>{card.insight}</Text></View>
    <Closing color="#B8A8C4"/>
  </View>;
}

/* ── 7 · Misconception: struck through ─────────────────────── */
function StruckThrough({ card, art, progress, highlight }: Props) {
  const ink = "#2A1206", red = "#E0230F";
  // The strike draws across the myth over the first stretch of reading.
  const strike = useSmooth(clamp(progress * 4));
  const line = useAnimatedStyle(() => ({ transform: [{ scaleX: strike.value }, { rotate: "-3deg" }], transformOrigin: "left center" }));
  return <View style={{ gap: 24 }}>
    <View style={{ gap: 8 }}>
      <Eyebrow color="#6E645C">Misconception · Day {card.day}</Eyebrow>
      <Text accessibilityRole="header" style={[t.h1, { color: ink }]}>{card.title}</Text>
    </View>
    {card.myth ? <View style={[t.card, { backgroundColor: "#F6EEE4" }]}>
      <Eyebrow color="#6E645C">What people say</Eyebrow>
      <View style={{ marginTop: 10 }}>
        <Text selectable accessibilityLabel={`What people say, and it is not true: ${card.myth}`} style={{ fontSize: 25, lineHeight: 32, fontWeight: "800", color: "#2A120699" }}>“{card.myth}”</Text>
        <Animated.View pointerEvents="none" style={[{ position: "absolute", left: -6, right: -4, top: "46%", height: 6, borderRadius: 3, backgroundColor: "#FF2E1F" }, line]}/>
      </View>
    </View> : <View accessible={false} style={{ height: 70, justifyContent: "center" }}>
      <Text style={{ fontSize: 76, lineHeight: 80, fontWeight: "900", letterSpacing: -3, color: "#2A12061F" }}>LIE</Text>
      <Animated.View style={[{ position: "absolute", left: -6, width: 170, top: 30, height: 9, borderRadius: 5, backgroundColor: "#FF2E1F" }, line]}/>
    </View>}
    <View style={{ gap: 10 }}>
      <Eyebrow color={red}>What the text says · {card.scriptureReference}</Eyebrow>
      <Text selectable style={[t.verse, { color: ink }]}>{card.scriptureText}</Text>
      <HighlightChip highlight={highlight} ink={ink} bg="#F1ECE6" onInk="#FFFFFF" onBg={ink}/>
    </View>
    {paras(card).map((p, i) => <Text key={i} selectable style={[t.body, { color: "#3A2A20" }]}>{p}</Text>)}
    <View style={[t.card, { backgroundColor: "#FFFFFF", borderLeftWidth: 5, borderLeftColor: "#FF2E1F", boxShadow: "0 10px 26px -16px #2A120640" }]}><Eyebrow color={red}>The truth</Eyebrow><Text selectable style={[t.insight, { color: ink, marginTop: 12 }]}>{card.insight}</Text></View>
    <Painting art={art}/>
    <Closing color="#6E645C"/>
  </View>;
}

/* ── 8 · Testimony: then, the turn, now ────────────────────── */
function ThenAndNow({ card, art, progress, highlight }: Props) {
  const story = paras(card), labels = story.length === 3 ? ["Then", "The turn", "Now"] : story.map((_, i) => i === 0 ? "Then" : i === story.length - 1 ? "Now" : "And then");
  return <View style={{ gap: 22 }}>
    <Band colors={READING_THEMES["testimonies"].band!} height={230}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}><CategoryGesture id="testimonies" title={card.title} text={card.scriptureText} top={20}/></View>
      <View style={{ position: "absolute", left: 20, right: 150, bottom: 24, gap: 8 }}>
        <Eyebrow color="#FFF6B0">Testimony · Day {card.day}</Eyebrow>
        <Text accessibilityRole="header" style={[t.h1, { color: "#FFFFFF" }]}>{card.title}</Text>
      </View>
    </Band>
    <View style={[t.card, { backgroundColor: "#DDF4E6" }]}>
      <Text selectable style={[t.verse, { color: "#0B3A22", fontSize: 21, lineHeight: 29 }]}>“{card.scriptureText}”</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 }}><Text style={[t.meta, { flex: 1, color: "#0A6E3C" }]}>{card.scriptureReference}</Text><HighlightChip highlight={highlight} ink="#0A6E3C" bg="#F2FBF5" onInk="#FFFFFF" onBg="#0A6E3C"/></View>
    </View>
    <View>{story.map((p, i) => <TimelineNode key={i} label={labels[i]!} text={p} fill={clamp(progress * story.length - i)} last={i === story.length - 1}>{i === 1 && <View style={{ marginTop: 12 }}><Painting art={art} height={170}/></View>}</TimelineNode>)}</View>
    <View style={[t.card, { backgroundColor: "#0A6E3C" }]}><Eyebrow color="#FFF6B0">Still moving</Eyebrow><Text selectable style={[t.insight, { color: "#FFFFFF", marginTop: 12 }]}>{card.insight}</Text></View>
    <Closing color="#0A6E3C"/>
  </View>;
}
function TimelineNode({ label, text, fill, last, children }: { label: string; text: string; fill: number; last: boolean; children?: React.ReactNode }) {
  const f = useSmooth(fill);
  const line = useAnimatedStyle(() => ({ transform: [{ scaleY: f.value }], transformOrigin: "center top" }));
  return <View style={{ flexDirection: "row", gap: 16 }}>
    <View style={{ width: 22, alignItems: "center" }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 3, borderColor: "#1FB868", backgroundColor: fill > 0 ? "#1FB868" : "#FFFFFF" }}/>
      {!last && <View style={{ flex: 1, width: 3, marginVertical: 4, borderRadius: 2, backgroundColor: "#CDEBD9", overflow: "hidden" }}><Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#1FB868" }, line]}/></View>}
    </View>
    <View style={{ flex: 1, paddingBottom: 22, gap: 6 }}><Eyebrow color="#0A6E3C">{label}</Eyebrow><Text selectable style={[t.body, { color: "#123322" }]}>{text}</Text>{children}</View>
  </View>;
}

/* ── 9 · Hard question: sit with it ────────────────────────── */
function SitWithIt({ card, art, highlight }: Props) {
  const question = card.question ?? card.title;
  const [shown, setShown] = useState(false), [screenReader, setScreenReader] = useState(false);
  useEffect(() => { AccessibilityInfo.isScreenReaderEnabled().then(setScreenReader).catch(() => {}); }, []);
  const reveal = () => { if (shown) return; setShown(true); haptics.soft(); };
  return <View style={{ gap: 24 }}>
    <View pointerEvents="none" accessible={false} style={{ position: "absolute", right: -40, top: -50 }}><Text style={{ fontSize: 300, lineHeight: 310, fontWeight: "900", letterSpacing: -10, color: "#FFC21A1F" }}>?</Text></View>
    <View style={{ gap: 14 }}>
      <Eyebrow color="#FFC21A">Hard question · {card.scriptureReference}</Eyebrow>
      <Text accessibilityRole="header" style={[t.h1, { color: "#FFFFFF", fontSize: 40, lineHeight: 46 }]}>{question}</Text>
      {question !== card.title && <Text style={[t.meta, { color: "#C9B59D" }]}>{card.title}</Text>}
    </View>
    <View style={{ gap: 10 }}>
      <Text selectable style={[t.verse, { color: "#F7F0E6", fontSize: 21, lineHeight: 29 }]}>“{card.scriptureText}”</Text>
      <HighlightChip highlight={highlight} ink="#F7F0E6" bg="#FFFFFF14" onInk="#2A1206" onBg="#FFC21A"/>
    </View>
    {paras(card).map((p, i) => <Text key={i} selectable style={[t.body, { color: "#E3D3BF" }]}>{p}</Text>)}
    <Painting art={art}/>
    {/* The answer waits under a cover: hold it to see. With VoiceOver, a double-tap reveals it. */}
    <Pressable accessibilityRole="button" accessibilityLabel={shown ? `One answer: ${card.insight}` : "One answer, hidden"} accessibilityHint={shown ? undefined : "Reveals one answer"}
      onLongPress={reveal} delayLongPress={350} onPress={() => { if (screenReader) reveal(); }}
      style={[t.card, shown ? { backgroundColor: "#FFC21A", boxShadow: "0 18px 30px -18px #000000" } : { backgroundColor: "#FFFFFF0F", borderWidth: 1.5, borderColor: "#FFC21A59" }]}>
      <Eyebrow color={shown ? "#5A3A00" : "#FFC21A"}>One answer</Eyebrow>
      {shown ? <Text selectable style={[t.insight, { color: "#2A1206", marginTop: 12 }]}>{card.insight}</Text> : <View style={{ marginTop: 14, gap: 12 }}>
        {[1, .92, .8, .55].map((w, i) => <View key={i} style={{ height: 14, width: `${w * 100}%`, borderRadius: 7, backgroundColor: "#FFC21A26" }}/>)}
        <View style={[StyleSheet.absoluteFill, { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }]}><SFSymbol name="hand.tap" size={20} color="#FFC21A"/><Text style={{ fontSize: 17, fontWeight: "800", color: "#FFC21A" }}>Hold to see it</Text></View>
      </View>}
    </Pressable>
    {shown && <Text style={[t.body, { color: "#C9B59D" }]}>It is not the only answer. Sit with the question a little longer.</Text>}
    <Closing color="#C9B59D"/>
  </View>;
}

const t = StyleSheet.create({
  eyebrow: { fontSize: 13, lineHeight: 17, fontWeight: "800", letterSpacing: 1.1, textTransform: "uppercase" },
  meta: { fontSize: 15, lineHeight: 20, fontWeight: "600" },
  h1: { fontSize: 36, lineHeight: 42, fontWeight: "900", letterSpacing: -1 },
  verse: { fontSize: 23, lineHeight: 31, fontWeight: "800" },
  body: { fontSize: 18, lineHeight: 28, fontWeight: "500" },
  insight: { fontSize: 21, lineHeight: 28, fontWeight: "800" },
  card: { padding: 22, borderRadius: 24, borderCurve: "continuous" },
  chip: { alignSelf: "flex-start", minHeight: 44, paddingHorizontal: 14, borderRadius: 22, flexDirection: "row", gap: 6, alignItems: "center" },
});
