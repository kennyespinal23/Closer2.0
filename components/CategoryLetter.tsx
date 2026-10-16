import { useEffect, useRef } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { Easing, type SharedValue, interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/CloserText";
import { FeedbackPressable as Pressable } from "./FeedbackPressable";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { ReaderMomentArt } from "./ReaderMomentArt";
import { characterName } from "./CategoryArt";
import { HANDWRITTEN } from "./HomeQuoteText";
import { BIBLE_MOMENTS, type BibleMoment } from "@/constants/bibleMoments";
import type { FloatingScriptureCard } from "@/constants/homePrototype";
import * as haptics from "@/lib/haptics";

/**
 * The day's letter, as the category's own object: an order of service, a
 * sealed red envelope, a note under the door, a card with a photo inside, a
 * comic, an index card in a drawer, an envelope stamped LOOK AGAIN, a film
 * canister, a folded question. Tap it and it opens in about a second; the
 * experience is revealed before it finishes, so the open never feels like a wait.
 */

const OPEN_MS = 1200, REVEAL_AT = 900;
export const LETTER_ACTIONS: Record<string, string> = {
  "daily-church": "Open the order of service", "jesus-only": "Break the seal", "letters-struggling": "Read the note",
  "letters-grateful": "Take out the photo", "character-studies": "Open the issue", "deep-verse": "Take out the card",
  "misconceptions": "Look again", "testimonies": "Play the reel", "questions": "Unfold it",
};

type Props = { categoryId: string; card: FloatingScriptureCard; art: BibleMoment; opening: boolean; onOpen: () => void; onRevealed: () => void };

export function CategoryLetter({ categoryId, card, art, opening, onOpen, onRevealed }: Props) {
  const p = useSharedValue(0), inset = useSafeAreaInsets(), { width, height } = useWindowDimensions();
  const revealed = useRef(false), reveal = useRef(onRevealed);
  reveal.current = onRevealed;
  useEffect(() => {
    if (!opening) return;
    p.value = withTiming(1, { duration: OPEN_MS, easing: Easing.linear });
    const timer = setTimeout(() => { if (!revealed.current) { revealed.current = true; haptics.success(); reveal.current(); } }, REVEAL_AT);
    return () => clearTimeout(timer);
  }, [opening, p]);
  const press = () => { if (opening) return; haptics.soft(); onOpen(); };
  const meta = META[categoryId] ?? META["daily-church"]!;
  const captionStyle = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0, .25], [1, 0], "clamp") }));
  const Obj = meta.Object;
  return <View style={StyleSheet.absoluteFill}>
    <meta.Ground/>
    <Pressable onPress={press} accessibilityRole="button" accessibilityLabel={`${meta.title}. ${LETTER_ACTIONS[categoryId] ?? "Open it"}`} feedback="row"
      style={{ position: "absolute", left: 0, right: 0, top: inset.top + 70, height: height * .5, alignItems: "center", justifyContent: "center" }}>
      <Obj p={p} card={card} art={art} width={width}/>
    </Pressable>
    <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 24, right: 24, top: inset.top + 70 + height * .5 + 8, alignItems: "center" }, captionStyle]}>
      <Text style={{ fontSize: 28, lineHeight: 33, fontWeight: "900", letterSpacing: -.7, color: meta.ink, textAlign: "center" }}>{meta.title}</Text>
      <Text style={{ fontSize: 15, lineHeight: 21, fontWeight: "700", color: meta.sub, marginTop: 8, textAlign: "center" }}>{meta.line(card)}</Text>
    </Animated.View>
  </View>;
}

type ObjProps = { p: SharedValue<number>; card: FloatingScriptureCard; art: BibleMoment; width: number };
const seg = (v: number, a: number, b: number) => { "worklet"; return Math.max(0, Math.min(1, (v - a) / (b - a))); };
const ease = (x: number) => { "worklet"; return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const lerp = (a: number, b: number, t: number) => { "worklet"; return a + (b - a) * t; };
const Grad = (colors: string[]) => function Ground() { return <ReaderMaterialGradient colors={colors} style={StyleSheet.absoluteFill}/>; };
const others = (art: BibleMoment, n: number) => [art, ...BIBLE_MOMENTS.filter(m => m.bookId === art.bookId && m.id !== art.id)].slice(0, n);

/* 1 · Daily Church: the order of service opens out. */
function Bulletin({ p, card }: ObjProps) {
  const left = useAnimatedStyle(() => ({ transform: [{ perspective: 1000 }, { translateX: -50 }, { rotateY: `${-170 * ease(seg(p.value, .05, .7))}deg` }, { translateX: 50 }], opacity: 1 - seg(p.value, .6, .75) }));
  const right = useAnimatedStyle(() => ({ transform: [{ perspective: 1000 }, { translateX: 50 }, { rotateY: `${170 * ease(seg(p.value, .05, .7))}deg` }, { translateX: -50 }], opacity: 1 - seg(p.value, .6, .75) }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ scale: lerp(1, 1.5, ease(seg(p.value, .3, 1))) }] }));
  return <Animated.View style={[{ width: 200, height: 290 }, sheet]}>
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#FFF8EA", borderRadius: 6, padding: 16, gap: 10, boxShadow: "0 30px 40px -24px #6A2B10AA" }]}>
      <Text style={l.eyebrow("#B5400A")}>Order of service · Day {card.day}</Text>
      {["1 · The reading", "2 · The message", "3 · Take home"].map(x => <Text key={x} style={{ fontSize: 15, fontWeight: "900", color: "#3A1500" }}>{x}</Text>)}
      <Text style={{ fontSize: 12, fontWeight: "700", color: "#7A4A1A" }}>{card.scriptureReference}</Text>
    </View>
    <Animated.View style={[{ position: "absolute", left: 0, top: 0, width: 100, height: 290, backgroundColor: "#FFF1D0", borderTopLeftRadius: 6, borderBottomLeftRadius: 6, backfaceVisibility: "hidden" }, left]}/>
    <Animated.View style={[{ position: "absolute", left: 100, top: 0, width: 100, height: 290, backgroundColor: "#FFF8EA", borderTopRightRadius: 6, borderBottomRightRadius: 6, overflow: "hidden", backfaceVisibility: "hidden", padding: 12, justifyContent: "flex-end" }, right]}>
      <View style={{ position: "absolute", right: -90, top: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: "#FFE27A" }}/>
      <Text style={{ fontSize: 17, lineHeight: 20, fontWeight: "900", color: "#3A1500" }}>{card.title}</Text>
    </Animated.View>
  </Animated.View>;
}

/* 2 · Jesus Only: the gold seal splits; a card in red ink rises. */
function SealedRed({ p, card }: ObjProps) {
  const half = (dir: number) => useAnimatedStyle(() => ({ opacity: 1 - seg(p.value, .3, .5), transform: [{ translateX: dir * 14 * seg(p.value, .02, .25) }, { rotate: `${dir * 25 * seg(p.value, .02, .25)}deg` }] })); // eslint-disable-line react-hooks/rules-of-hooks
  const l1 = half(-1), r1 = half(1);
  const flap = useAnimatedStyle(() => ({ transform: [{ perspective: 800 }, { translateY: -60 }, { rotateX: `${180 * ease(seg(p.value, .15, .55))}deg` }, { translateY: 60 }], zIndex: p.value > .35 ? 0 : 2 }));
  const letter = useAnimatedStyle(() => ({ transform: [{ translateY: lerp(20, -170, ease(seg(p.value, .45, 1))) }] }));
  return <View style={{ width: 280, height: 190 }}>
    <Animated.View style={[{ position: "absolute", left: 14, right: 14, top: 0, height: 200, backgroundColor: "#FFF7F2", borderRadius: 4, padding: 18 }, letter]}>
      <Text style={l.eyebrow("#C21A33")}>{card.scriptureReference}</Text>
      <Text numberOfLines={4} style={{ marginTop: 10, fontSize: 19, lineHeight: 25, fontWeight: "900", color: "#D11A36" }}>“{card.scriptureText}”</Text>
    </Animated.View>
    <View style={{ position: "absolute", inset: 0, backgroundColor: "#C21A33", borderRadius: 8, boxShadow: "0 30px 40px -24px #5A0010CC" }}/>
    <Animated.View style={[{ position: "absolute", left: 0, right: 0, top: 0, height: 120, borderTopLeftRadius: 8, borderTopRightRadius: 8, overflow: "hidden" }, flap]}>
      <View style={{ position: "absolute", left: 140 - 99, top: -99, width: 198, height: 198, backgroundColor: "#A8132A", transform: [{ rotate: "45deg" }] }}/></Animated.View>
    <View style={{ position: "absolute", left: 116, top: 94, width: 48, height: 48, zIndex: 3 }}>
      <Animated.View style={[{ position: "absolute", left: 0, width: 24, height: 48, overflow: "hidden" }, l1]}><View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFC21A" }}/></Animated.View>
      <Animated.View style={[{ position: "absolute", left: 24, width: 24, height: 48, overflow: "hidden" }, r1]}><View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFC21A", marginLeft: -24 }}/></Animated.View>
    </View>
  </View>;
}

/* 3 · A struggling letter: the note under the door slides out and unfolds. */
function NoteUnderDoor({ p }: ObjProps) {
  const note = useAnimatedStyle(() => {
    const slide = ease(seg(p.value, .02, .35)), open = ease(seg(p.value, .3, .9));
    return { width: lerp(180, 300, open), height: lerp(108, 300, open), transform: [{ translateY: lerp(lerp(120, 150, slide), -10, open) }, { rotate: `${lerp(-4, 0, open)}deg` }] };
  });
  const words = useAnimatedStyle(() => ({ opacity: seg(p.value, .55, .85) }));
  const front = useAnimatedStyle(() => ({ opacity: 1 - seg(p.value, .4, .6) }));
  return <View style={{ width: 300, height: 360, alignItems: "center" }}>
    <View style={{ width: 230, height: 270, borderTopLeftRadius: 10, borderTopRightRadius: 10, backgroundColor: "#0E4D33", borderWidth: 6, borderColor: "#0A3324" }}>
      <View style={{ position: "absolute", right: 20, top: 140, width: 16, height: 16, borderRadius: 8, backgroundColor: "#C9A24A" }}/></View>
    <View style={{ width: 330, height: 6, backgroundColor: "#FFE7A04D" }}/>
    <Animated.View style={[{ position: "absolute", top: 0, backgroundColor: "#FFFBF2", borderRadius: 4, padding: 16, boxShadow: "0 20px 30px -16px #000000AA", overflow: "hidden" }, note]}>
      <Animated.Text style={[{ fontFamily: HANDWRITTEN, fontSize: 17, color: "#0A6B47" }, front]}>for a hard day</Animated.Text>
      <Animated.View style={[StyleSheet.absoluteFill, { padding: 20 }, words]}>
        <Text style={{ fontFamily: HANDWRITTEN, fontSize: 28, color: "#0A6B47" }}>Dear friend,</Text>
        <Text style={{ marginTop: 10, fontSize: 16, lineHeight: 26, fontWeight: "600", color: "#22332B" }}>A few lines for today, a little at a time.</Text>
      </Animated.View>
    </Animated.View>
  </View>;
}

/* 4 · A grateful letter: the polaroid slides out of the card and flips to its thank-you. */
function CardWithPhoto({ p, card, art }: ObjProps) {
  // A flip without 3D: the photo squashes to an edge and opens out showing its back.
  const photo = useAnimatedStyle(() => {
    const out = ease(seg(p.value, .02, .45)), land = ease(seg(p.value, .4, .95));
    return { zIndex: out > .85 ? 3 : 0, transform: [{ translateY: lerp(lerp(-30, -150, out), -60, land) }, { scale: lerp(1, 1.9, land) }, { rotate: `${lerp(-6, -2, land)}deg` }, { scaleX: Math.max(.02, Math.abs(Math.cos(land * Math.PI))) }] };
  });
  const back = useAnimatedStyle(() => ({ opacity: seg(p.value, .4, .95) > .5 ? 1 : 0 }));
  const env = useAnimatedStyle(() => ({ opacity: 1 - seg(p.value, .45, .7), transform: [{ translateY: 40 * seg(p.value, .45, .7) }] }));
  const note = card.story.split(/(?<=[.!?])\s/)[0] ?? card.insight;
  return <View style={{ width: 280, height: 220, alignItems: "center", justifyContent: "flex-end" }}>
    <Animated.View style={[{ position: "absolute", top: 40, width: 130, height: 148, padding: 8, paddingBottom: 26, backgroundColor: "#FFFFFF", boxShadow: "0 10px 18px -10px #00000080" }, photo]}>
      <View style={{ flex: 1, overflow: "hidden" }}><ReaderMomentArt moment={art}/></View>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#FFFDF7", padding: 10, justifyContent: "center" }, back]}>
        <Text numberOfLines={6} style={{ fontFamily: HANDWRITTEN, fontSize: 11, lineHeight: 15, color: "#7A0E33" }}>{note}</Text></Animated.View>
    </Animated.View>
    <Animated.View style={[{ width: 280, height: 150, backgroundColor: "#FFE7EE", borderRadius: 8, boxShadow: "0 30px 40px -24px #7A0E33AA", alignItems: "center", justifyContent: "flex-end", paddingBottom: 18 }, env]}>
      <Text style={{ fontFamily: HANDWRITTEN, fontSize: 18, color: "#B0124A" }}>for you, with thanks</Text></Animated.View>
  </View>;
}

/* 5 · Character study: the comic's cover swings open. */
function ComicIssue({ p, card, art }: ObjProps) {
  const cover = useAnimatedStyle(() => ({ transform: [{ perspective: 1400 }, { translateX: -110 }, { rotateY: `${-165 * ease(seg(p.value, .02, .65))}deg` }, { translateX: 110 }], opacity: 1 - seg(p.value, .55, .7) }));
  const book = useAnimatedStyle(() => ({ transform: [{ scale: lerp(1, 1.55, ease(seg(p.value, .45, 1))) }] }));
  const pages = others(art, 2);
  const name = characterName(card.title, card.scriptureText).toUpperCase();
  return <Animated.View style={[{ width: 220, height: 320 }, book]}>
    <View style={[StyleSheet.absoluteFill, { borderWidth: 4, borderColor: "#2A1000", backgroundColor: "#FFFFFF", padding: 6, gap: 6 }]}>
      {pages.map(m => <View key={m.id} style={{ flex: 1, borderWidth: 3, borderColor: "#2A1000", overflow: "hidden" }}><ReaderMomentArt moment={m}/></View>)}</View>
    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#E2500A", borderWidth: 4, borderColor: "#2A1000", overflow: "hidden", backfaceVisibility: "hidden", boxShadow: "8px 8px 0 #2A1000" }, cover]}>
      <View style={{ position: "absolute", left: 10, top: 10, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "#FFE680", borderWidth: 2, borderColor: "#2A1000" }}><Text style={{ fontSize: 12, fontWeight: "900", color: "#2A1000" }}>ISSUE {String(card.day).padStart(2, "0")}</Text></View>
      <Text numberOfLines={1} adjustsFontSizeToFit style={{ position: "absolute", left: 8, right: 8, top: 42, fontSize: 58, lineHeight: 62, fontWeight: "900", letterSpacing: -3, color: "#FFE680", textShadowColor: "#2A1000", textShadowOffset: { width: 4, height: 4 }, textShadowRadius: 0 }}>{name}</Text>
      <View style={{ position: "absolute", left: 14, right: 14, top: 116, bottom: 58, borderWidth: 3, borderColor: "#2A1000", overflow: "hidden" }}><ReaderMomentArt moment={art}/></View>
      <View style={{ position: "absolute", left: 14, right: 14, bottom: 14, padding: 6, backgroundColor: "#FFFFFF", borderWidth: 2, borderColor: "#2A1000" }}><Text numberOfLines={1} style={{ fontSize: 14, fontWeight: "900", color: "#2A1000" }}>{card.title}</Text></View>
    </Animated.View>
  </Animated.View>;
}

/* 6 · Deep verse: the drawer slides out and the card lifts to face you. */
function CardDrawer({ p, card }: ObjProps) {
  const drawer = useAnimatedStyle(() => ({ opacity: 1 - seg(p.value, .6, .85), transform: [{ translateY: 50 * ease(seg(p.value, .02, .35)) }] }));
  const cardStyle = useAnimatedStyle(() => {
    const lift = ease(seg(p.value, .3, 1));
    return { transform: [{ translateY: lerp(lerp(30, 0, ease(seg(p.value, .02, .35))), -120, lift) }, { scale: lerp(1, 1.6, lift) }, { perspective: 1000 }, { rotateX: `${lerp(55, 0, lift)}deg` }] };
  });
  return <View style={{ width: 260, height: 300, alignItems: "center", justifyContent: "flex-end" }}>
    <Animated.View style={[{ width: 250, height: 150, borderRadius: 6, backgroundColor: "#7A4E2C", borderWidth: 3, borderColor: "#A0703F", alignItems: "center", justifyContent: "flex-end", paddingBottom: 26, boxShadow: "0 24px 30px -16px #000000CC" }, drawer]}>
      <View style={{ width: 60, height: 22, borderRadius: 4, backgroundColor: "#C9A24A" }}/></Animated.View>
    <Animated.View style={[{ position: "absolute", bottom: 110, width: 210, height: 130, padding: 12, borderRadius: 3, backgroundColor: "#FFFBF2", boxShadow: "0 18px 26px -16px #000000AA", zIndex: 2 }, cardStyle]}>
      <Text style={l.eyebrow("#8A6A4A")}>Deep verse · {card.scriptureReference}</Text>
      <View style={{ height: 1.5, backgroundColor: "#E7A3A0", marginVertical: 6 }}/>
      <Text numberOfLines={4} style={{ fontSize: 12, lineHeight: 17, fontWeight: "800", color: "#2A1A10" }}>{card.scriptureText}</Text>
    </Animated.View>
  </View>;
}

/* 7 · Misconception: a red strike tears the LOOK AGAIN envelope in two. */
function LookAgainEnvelope({ p, card }: ObjProps) {
  const strike = useAnimatedStyle(() => ({ width: 340 * ease(seg(p.value, .02, .3)), opacity: 1 - seg(p.value, .35, .5) }));
  const top = useAnimatedStyle(() => { const f = seg(p.value, .3, .9); return { transform: [{ translateX: -60 * f * f }, { translateY: -620 * f * f }, { rotate: `${-16 * f}deg` }] }; });
  const bottom = useAnimatedStyle(() => { const f = seg(p.value, .3, .9); return { transform: [{ translateX: 30 * f * f }, { translateY: 640 * f * f }, { rotate: `${10 * f}deg` }] }; });
  return <View style={{ width: 280, height: 190 }}>
    <Animated.View style={[{ position: "absolute", left: 0, top: 0, width: 280, height: 98, overflow: "hidden" }, top]}>
      <View style={{ width: 280, height: 190, backgroundColor: "#F6EEE4", borderRadius: 8, borderWidth: 1.5, borderColor: "#E5D8C6" }}/>
      <View style={{ position: "absolute", left: 40, top: 40, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 3, borderColor: "#E0230F", borderRadius: 6, transform: [{ rotate: "-8deg" }] }}><Text style={{ color: "#E0230F", fontSize: 22, fontWeight: "900", letterSpacing: 1 }}>LOOK AGAIN</Text></View>
    </Animated.View>
    <Animated.View style={[{ position: "absolute", left: 0, top: 98, width: 280, height: 92, overflow: "hidden" }, bottom]}>
      <View style={{ width: 280, height: 190, marginTop: -98, backgroundColor: "#F6EEE4", borderRadius: 8, borderWidth: 1.5, borderColor: "#E5D8C6" }}/>
      <Text style={{ position: "absolute", left: 24, bottom: 20, fontSize: 15, fontWeight: "700", color: "#6E645C" }}>Misconception · Day {card.day}</Text>
    </Animated.View>
    <Animated.View style={[{ position: "absolute", left: -30, top: 93, height: 10, borderRadius: 5, backgroundColor: "#FF2E1F" }, strike]}/>
  </View>;
}

/* 8 · Testimony: the canister lid lifts, the reel spins, the film runs out. */
function FilmCanister({ p, card, art }: ObjProps) {
  const lid = useAnimatedStyle(() => ({ opacity: 1 - seg(p.value, .25, .4), transform: [{ translateY: -200 * ease(seg(p.value, .02, .3)) }, { rotate: `${-20 * seg(p.value, .02, .3)}deg` }] }));
  const reel = useAnimatedStyle(() => ({ transform: [{ rotate: `${p.value * 900}deg` }], opacity: 1 - seg(p.value, .8, 1) }));
  const film = useAnimatedStyle(() => ({ width: 560 * ease(seg(p.value, .25, .95)) }));
  const frames = others(art, 5);
  return <View style={{ width: 200, height: 260, alignItems: "center", justifyContent: "center" }}>
    <Animated.View style={[{ width: 180, height: 180, borderRadius: 90, backgroundColor: "#2E2A26", borderWidth: 4, borderColor: "#4A4540", alignItems: "center", justifyContent: "center" }, reel]}>
      {[0, 60, 120, 180, 240, 300].map(a => <View key={a} style={{ position: "absolute", width: 24, height: 24, borderRadius: 12, backgroundColor: "#141210", transform: [{ rotate: `${a}deg` }, { translateY: -54 }] }}/>)}
      <View style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: "#3A3632" }}/></Animated.View>
    <Animated.View style={[{ position: "absolute", left: 100, top: 160, height: 66, backgroundColor: "#0A0908", flexDirection: "row", gap: 6, padding: 6, overflow: "hidden" }, film]}>
      {frames.map(m => <View key={m.id} style={{ width: 70, height: 54, overflow: "hidden" }}><ReaderMomentArt moment={m}/></View>)}</Animated.View>
    <Animated.View style={[{ position: "absolute", width: 192, height: 192, borderRadius: 96, backgroundColor: "#6A645C", borderWidth: 2, borderColor: "#8A847A", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 20px -8px #000" }, lid]}>
      <View style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#FFFBF2", transform: [{ rotate: "-4deg" }] }}><Text style={{ fontFamily: HANDWRITTEN, fontSize: 15, color: "#3A2A1A" }}>{card.title}</Text></View>
    </Animated.View>
  </View>;
}

/* 9 · Honest question: the folded square flattens and the question is inside. */
function FoldedQuestion({ p, card }: ObjProps) {
  const sheet = useAnimatedStyle(() => { const s = lerp(140, 300, ease(seg(p.value, .02, .85))); return { width: s, height: s }; });
  const creases = useAnimatedStyle(() => ({ opacity: 1 - seg(p.value, .5, .9) }));
  const mark = useAnimatedStyle(() => ({ opacity: 1 - seg(p.value, .02, .25) }));
  const words = useAnimatedStyle(() => ({ opacity: seg(p.value, .2, .55) }));
  return <Animated.View style={[{ backgroundColor: "#FFF8E6", alignItems: "center", justifyContent: "center", padding: 18, boxShadow: "0 24px 30px -16px #000000" }, sheet]}>
    <Animated.View style={[StyleSheet.absoluteFill, creases]}>
      <View style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 2, marginLeft: -1, backgroundColor: "#D9C7A0" }}/>
      <View style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 2, marginTop: -1, backgroundColor: "#D9C7A0" }}/></Animated.View>
    <Animated.Text style={[{ position: "absolute", fontSize: 56, fontWeight: "900", color: "#FFC21A" }, mark]}>?</Animated.Text>
    <Animated.Text style={[{ fontSize: 22, lineHeight: 27, fontWeight: "900", color: "#2A1206", textAlign: "center" }, words]}>{card.question ?? card.title}</Animated.Text>
  </Animated.View>;
}

type Meta = { title: string; line: (card: FloatingScriptureCard) => string; ink: string; sub: string; Ground: () => React.ReactElement; Object: (props: ObjProps) => React.ReactElement };
const META: Record<string, Meta> = {
  "daily-church": { title: "Daily Church", line: () => "Today’s order of service. Tap to open it.", ink: "#3A1500", sub: "#6A2B10", Ground: Grad(["#FFE45C", "#FFC21A", "#FF9F0A"]), Object: Bulletin },
  "jesus-only": { title: "Jesus Only", line: () => "Sealed with His words. Tap the seal.", ink: "#FFFFFF", sub: "#FFE7E2", Ground: Grad(["#FF5A4E", "#E0233A", "#A80F2A"]), Object: SealedRed },
  "letters-struggling": { title: "A letter for a hard day", line: () => "Someone slipped it under the door. Tap to read it.", ink: "#FFFFFF", sub: "#BFE3CF", Ground: Grad(["#1E7A52", "#13563A", "#0B3A28"]), Object: NoteUnderDoor },
  "letters-grateful": { title: "A grateful letter", line: () => "There’s a photo inside. Tap to take it out.", ink: "#3A0716", sub: "#5A0A24", Ground: Grad(["#FFB3C6", "#FF7A9E", "#F24F7F"]), Object: CardWithPhoto },
  "character-studies": { title: "Character study", line: card => `${characterName(card.title, card.scriptureText)}, this week’s issue. Tap to open it.`, ink: "#2A1000", sub: "#7A5A44", Ground: Grad(["#F6EBDD", "#EFE0CB"]), Object: ComicIssue },
  "deep-verse": { title: "Deep verse", line: () => "One card from the drawer. Tap to take it out.", ink: "#FFF1E0", sub: "#E8D2B8", Ground: Grad(["#6B4426", "#4A2E18", "#3A2312"]), Object: CardDrawer },
  "misconceptions": { title: "Misconception", line: () => "What you were told. Tap to look again.", ink: "#2A1206", sub: "#6E645C", Ground: Grad(["#FFFFFF", "#FFF1DA"]), Object: LookAgainEnvelope },
  "testimonies": { title: "Testimony", line: () => "A story on film. Tap to play it.", ink: "#F2EDE6", sub: "#BDB4A8", Ground: Grad(["#2A2620", "#141210"]), Object: FilmCanister },
  "questions": { title: "Honest question", line: () => "Someone asked this. Tap to unfold it.", ink: "#FFFFFF", sub: "#C9B59D", Ground: Grad(["#4A3624", "#33261C", "#261D17"]), Object: FoldedQuestion },
};
export const hasLetter = (categoryId: string) => categoryId in META;

const l = { eyebrow: (color: string) => ({ fontSize: 11, lineHeight: 15, fontWeight: "800" as const, letterSpacing: 1, textTransform: "uppercase" as const, color }) };
