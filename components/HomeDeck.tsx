import { memo, useState, type ReactNode } from "react";
import { type ImageSourcePropType, StyleSheet, View, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import { Image } from "expo-image";
import Animated, { type SharedValue, interpolate, Extrapolation, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import Svg, { Defs, RadialGradient, LinearGradient, Rect, Stop } from "react-native-svg";
import { Text } from "@/components/CloserText";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { uiText } from "@/lib/typography";
import { FeedbackPressable as Pressable } from "./FeedbackPressable";
import { SFSymbol, type SFSymbolName } from "./Symbol";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { categoryTheme } from "./CategoryArt";
import * as haptics from "@/lib/haptics";

/* Home as today's deck. One card in front (what to do now), its neighbours peeking,
   on the category's own deep ground. Text on the ground is white mixed with the ground
   (never grey); chrome is a greyed version of the ground; the paper cards take a breath
   of the category colour. Transforms only while swiping. */

const hex = (h: string) => { const n = parseInt(h.replace("#", "").slice(0, 6), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
export const mix = (a: string, b: string, t: number) => { const x = hex(a), y = hex(b); return "#" + x.map((v, i) => Math.round(v + (y[i]! - v) * t).toString(16).padStart(2, "0")).join(""); };
const light = (h: string) => { const [r, g, b] = hex(h); return (.2126 * r + .7152 * g + .0722 * b) / 255 > .7; };

/** The category's ground, deepened so tinted text reads on it, plus the text and chrome roles that sit on it. */
export function deckPalette(categoryId: string) {
  const theme = categoryTheme(categoryId);
  const base = light(theme.ground[2]) ? theme.accent : theme.ground[2];
  const top = mix(base, "#000000", .3), mid = mix(base, "#000000", .52), low = mix(base, "#000000", .8);
  return {
    theme, top, mid, low, glow: light(theme.ground[0]) ? theme.accent : theme.ground[0],
    t2: mix("#FFFFFF", mid, .3), t3: mix("#FFFFFF", mid, .5),
    chrome: mix(mix(mid, "#2E2A2C", .6), "#000000", .1) + "C7",
    paperTop: mix("#FFFCF6", theme.accent, .05), paperBot: mix("#F5E9D9", theme.accent, .1),
    num: mix(theme.accent, "#000000", light(theme.accent) ? .45 : .18),
  };
}
export type DeckPalette = ReturnType<typeof deckPalette>;

/** The lit ground: deep category colour, brightest top right, with a soft light behind the deck. */
export function DeckGround({ p }: { p: DeckPalette }) {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}><Svg width="100%" height="100%">
    <Defs>
      <LinearGradient id="dg-base" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor={p.top}/><Stop offset=".45" stopColor={p.mid}/><Stop offset="1" stopColor={p.low}/></LinearGradient>
      <RadialGradient id="dg-corner" cx="92%" cy="0%" rx="80%" ry="40%"><Stop offset="0" stopColor={p.glow} stopOpacity=".55"/><Stop offset="1" stopColor={p.glow} stopOpacity="0"/></RadialGradient>
      <RadialGradient id="dg-glow" cx="50%" cy="46%" rx="60%" ry="32%"><Stop offset="0" stopColor={p.glow} stopOpacity=".42"/><Stop offset="1" stopColor={p.glow} stopOpacity="0"/></RadialGradient>
    </Defs>
    <Rect width="100%" height="100%" fill="url(#dg-base)"/><Rect width="100%" height="100%" fill="url(#dg-corner)"/><Rect width="100%" height="100%" fill="url(#dg-glow)"/>
  </Svg></View>;
}

export type DeckItem = {
  key: string;
  /** Picture for the card's window; null draws the category ground instead. */
  art: ImageSourcePropType | number | null;
  blurred?: boolean;
  /** The colour sampled from the picture; the card wears it. */
  tint?: string;
  /** Text laid over the window (the verse, or the reveal header). */
  over?: ReactNode;
  chip?: { icon: SFSymbolName; label: string };
  label: string; title: string; sentence?: string;
  done?: boolean; stamp?: string;
  /** Lilac paper for night. */
  night?: boolean;
  accessibilityLabel: string;
  onPress: () => void;
};

const GAP = 18;

export function HomeDeck({ items, index, onIndex, p }: { items: DeckItem[]; index: number; onIndex: (i: number) => void; p: DeckPalette }) {
  const { width } = useWindowDimensions();
  const [area, setArea] = useState(0);
  const cardH0 = Math.min(Math.max(area - 6, 0), 420);
  const cardW = Math.min(cardH0 * 270 / 392, width * .68), cardH = cardW * 392 / 270;
  const interval = cardW + GAP, side = (width - cardW) / 2;
  const x = useSharedValue(index * interval);
  const onScroll = useAnimatedScrollHandler({ onScroll: e => { x.value = e.contentOffset.x; } });
  const settle = (offset: number) => { const i = Math.max(0, Math.min(items.length - 1, Math.round(offset / interval))); if (i !== index) { haptics.tick(); onIndex(i); } };
  return <View style={{ flex: 1, justifyContent: "center" }} onLayout={(e: LayoutChangeEvent) => setArea(e.nativeEvent.layout.height)}>
    {cardW > 0 && <Animated.ScrollView key={`${cardW}`} horizontal showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}
      snapToInterval={interval} decelerationRate="fast" contentOffset={{ x: index * interval, y: 0 }} style={{ flexGrow: 0, overflow: "visible" }}
      contentContainerStyle={{ paddingHorizontal: side, gap: GAP, alignItems: "center", height: cardH + 40 }}
      onMomentumScrollEnd={e => settle(e.nativeEvent.contentOffset.x)} onScrollEndDrag={e => { if (!e.nativeEvent.velocity?.x) settle(e.nativeEvent.contentOffset.x); }}>
      {items.map((item, i) => <Slot key={item.key} i={i} x={x} interval={interval}><DeckCard item={item} w={cardW} h={cardH} p={p} front={i === index}/></Slot>)}
    </Animated.ScrollView>}
  </View>;
}

function Slot({ i, x, interval, children }: { i: number; x: SharedValue<number>; interval: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const look = useAnimatedStyle(() => {
    if (reduced) return { transform: [{ rotate: "0deg" }, { scale: 1 }] } as never;
    const d = (x.value - i * interval) / interval;
    return { transform: [{ rotate: `${interpolate(d, [-1.5, 0, 1.5], [4, 0, -4], Extrapolation.CLAMP)}deg` }, { scale: interpolate(Math.abs(d), [0, 1], [1, .97], Extrapolation.CLAMP) }], transformOrigin: "50% 100%" } as never;
  });
  const dim = useAnimatedStyle(() => ({ opacity: interpolate(Math.abs((x.value - i * interval) / interval), [0, 1], [0, .16], Extrapolation.CLAMP) }));
  return <Animated.View style={look}>{children}<Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#000", borderRadius: 28 }, dim]}/></Animated.View>;
}

const DeckCard = memo(function DeckCard({ item, w, h, p, front }: { item: DeckItem; w: number; h: number; p: DeckPalette; front: boolean }) {
  const paper = item.night ? ["#FBF2F6", "#ECE2F2"] : [p.paperTop, p.paperBot];
  const ink = item.night ? "#2A1233" : "#2A1206", muted = item.night ? "#5A4466" : mix(p.num, "#3A1A14", .55), num = item.night ? "#6A4A7A" : p.num;
  const small = h < 330;
  return <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={item.accessibilityLabel} accessibilityState={{ selected: front }} onPress={() => { haptics.soft(); item.onPress(); }}
    style={{ width: w, height: h, borderRadius: 28, borderCurve: "continuous", padding: 10, boxShadow: `0 2px 4px -1px ${p.low}88, 0 40px 60px -28px ${p.low}` }}>
    <ReaderMaterialGradient colors={paper} style={[StyleSheet.absoluteFill, { borderRadius: 28, borderCurve: "continuous" }]}/>
    <View style={{ height: "60%", borderRadius: 20, borderCurve: "continuous", overflow: "hidden", backgroundColor: p.mid }}>
      {item.art != null ? <Image source={item.art as ImageSourcePropType} contentFit="cover" blurRadius={item.blurred ? 22 : 0} style={StyleSheet.absoluteFill} transition={0}/> : <ReaderMaterialGradient colors={[p.top, p.low]} style={StyleSheet.absoluteFill}/>}
      {/* light across the print, and a little depth at the foot */}
      <ReaderMaterialGradient pointerEvents="none" colors={["#FFFFFF33", "#FFFFFF00", "#00000000", "#00000066"]} locations={[0, .32, .55, 1]} style={StyleSheet.absoluteFill}/>
      {item.over}
      {!!item.chip && <View style={{ position: "absolute", left: 10, bottom: 10, height: 28, borderRadius: 14, paddingLeft: 8, paddingRight: 11, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: p.chrome }}>
        <SFSymbol name={item.chip.icon} size={12} color="#FFFFFF"/><Text style={{ ...uiText.supporting, fontSize: 12, lineHeight: 16, fontWeight: "800", color: "#FFFFFF" }}>{item.chip.label}</Text>
      </View>}
    </View>
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 }}>
      <Text style={{ ...uiText.supporting, fontSize: 11, lineHeight: 14, fontWeight: "800", letterSpacing: .9, color: mix(num, paper[1]!, .3), marginBottom: 4 }}>{item.label.toUpperCase()}</Text>
      <Text numberOfLines={2} style={{ ...uiText.sectionTitle, fontSize: w < 230 ? 22 : 26, lineHeight: w < 230 ? 25 : 29, fontWeight: "800", letterSpacing: -.5, color: ink, textAlign: "center" }}>{item.title}</Text>
      {!!item.sentence && !small && <Text numberOfLines={2} style={{ ...uiText.supporting, fontSize: 14, lineHeight: 19, fontWeight: "600", color: muted, textAlign: "center", marginTop: 6 }}>{item.sentence}</Text>}
    </View>
    {!!item.stamp && <View pointerEvents="none" style={{ position: "absolute", right: 12, top: "40%", width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: num, alignItems: "center", justifyContent: "center", transform: [{ rotate: "-14deg" }], backgroundColor: paper[0] + "E6" }}>
      <Text style={{ ...uiText.supporting, fontSize: 11, lineHeight: 13, fontWeight: "900", letterSpacing: .8, color: num }}>{item.stamp}</Text>
    </View>}
  </Pressable>;
});

/** Where you are in the deck: done cards are ticked, the front one is a pill, the rest are rings. */
export function DeckDots({ items, index, p }: { items: DeckItem[]; index: number; p: DeckPalette }) {
  return <View accessible={false} style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 6 }}>
    {items.map((it, i) => i === index
      ? <View key={it.key} style={{ width: 28, height: 15, borderRadius: 8, backgroundColor: "#FFFFFF" }}/>
      : it.done
        ? <View key={it.key} style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: "#FFFFFFE6", alignItems: "center", justifyContent: "center" }}><SFSymbol name="checkmark" size={8} color={p.mid}/></View>
        : <View key={it.key} style={{ width: 15, height: 15, borderRadius: 8, borderWidth: 1.5, borderColor: p.t3 }}/>)}
  </View>;
}

/** A glass pill over the ground: greyed ground with a hairline of light on top. */
export function GroundPill({ p, children, onPress, accessibilityLabel, style }: { p: DeckPalette; children: ReactNode; onPress?: () => void; accessibilityLabel: string; style?: object }) {
  return <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} hitSlop={6}
    style={[{ minHeight: 40, borderRadius: 20, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: p.chrome, boxShadow: "inset 0 1px 0 #FFFFFF22" }, style]}>{children}</Pressable>;
}

