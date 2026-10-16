import { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import Animated, { Easing, Extrapolation, type SharedValue, cancelAnimation, interpolate, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";
import { Image } from "expo-image";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import Svg, { Circle, Defs, Ellipse, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/CloserText";
import { CloseButton } from "@/components/CloseButton";
import { FeedbackPressable as Pressable } from "./FeedbackPressable";
import { SFSymbol, type SFSymbolName } from "./Symbol";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useReminder } from "@/lib/useReminder";
import { NIGHT_FEELINGS, NIGHT_TOPICS, composeNightPrayer, recordNightPrayer, useNightPrayer, type NightPrayerEntry } from "@/lib/nightPrayer";
import * as haptics from "@/lib/haptics";
import { focusAmount, useFocusMoment } from "@/lib/homeFocus";

// Night colours: a warm plum, leaning red so it sits with the ember palette.
export const NIGHT = { top: "#6E3878", mid: "#42204F", deep: "#1F1028", moon: "#FBF2F6", lav: "#D2C3DC", lav2: "#C2B2CF", ink: "#2A1233", candle: "#FFC93C" };

const SKY = require("@/assets/backdrops/night-sky.jpg");
const TWINKLES: [number, number, number][] = [[.74, .17, 0], [.17, .38, 1500], [.85, .6, 800]];

function Twinkle({ x, y, delay }: { x: number; y: number; delay: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }), -1, true));
    return () => cancelAnimation(t);
  }, [delay, t]);
  const look = useAnimatedStyle(() => ({ opacity: .25 + .75 * t.value, transform: [{ scale: .7 + .45 * t.value }] }));
  return <Animated.View style={[{ position: "absolute", left: `${x * 100}%`, top: `${y * 100}%`, width: 6, height: 6, borderRadius: 3, backgroundColor: "#FFFFFF", boxShadow: "0 0 10px 3px #FFF0E6B3" }, look]}/>;
}

/**
 * The night sky: painted plum clouds and a field of stars. In the prayer it
 * drifts slowly and a few stars twinkle; Reduce Motion keeps it still.
 */
export function NightSky({ drift = false, fade = false }: { width?: number | `${number}%`; height?: number | `${number}%`; stars?: number; drift?: boolean; fade?: boolean }) {
  const reduced = useReducedMotion(), t = useSharedValue(0), moving = drift && !reduced;
  useEffect(() => {
    if (!moving) return;
    t.value = withRepeat(withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(t);
  }, [moving, t]);
  const look = useAnimatedStyle(() => ({ transform: [{ translateX: -16 * t.value }, { translateY: 6 * t.value }, { scale: 1.06 + .02 * t.value }] }));
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: "hidden", backgroundColor: "#1A0C26" }]}>
    <Animated.View style={[StyleSheet.absoluteFill, look]}><Image source={SKY} contentFit="cover" contentPosition="top" style={StyleSheet.absoluteFill}/></Animated.View>
    {/* A veil so the sky stays behind the words, never in front of them. */}
    <View style={[StyleSheet.absoluteFill, { backgroundColor: "#12071A94" }]}/>
    {fade && <ReaderMaterialGradient colors={["#12071A00", "#12071A40", "#0E0514E6"]} locations={[0, .4, 1]} style={StyleSheet.absoluteFill}/>}
    {moving && TWINKLES.map(([x, y, d], i) => <Twinkle key={i} x={x} y={y} delay={d}/>)}
  </View>;
}

function Moon({ size }: { size: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, boxShadow: `0 0 ${size * .6}px ${size * .12}px #FFECBE2E, 0 0 0 ${size * .14}px #FBF2F60D, 0 0 0 ${size * .32}px #FBF2F608` }}>
    <Svg width={size} height={size}><Defs><RadialGradient id="moonFace" cx="35%" cy="35%" r="70%"><Stop offset="0" stopColor="#FFFBEA"/><Stop offset=".6" stopColor="#F2E6C4"/><Stop offset="1" stopColor="#D9C79A"/></RadialGradient></Defs><Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#moonFace)"/></Svg>
  </View>;
}

function Candle({ size = 54 }: { size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 54 54">
    <Ellipse cx={27} cy={16} rx={12} ry={14} fill={NIGHT.candle} opacity={.18}/>
    <Path d="M27 4c3 5 6 8 6 12a6 6 0 0 1-12 0c0-4 3-7 6-12Z" fill={NIGHT.candle}/>
    <Path d="M27 11c1.5 2.5 3 4 3 6a3 3 0 0 1-6 0c0-2 1.5-3.5 3-6Z" fill="#FFF1C2"/>
    <Rect x={21} y={25} width={12} height={25} rx={3} fill={NIGHT.moon}/>
    <Rect x={21} y={25} width={12} height={4} rx={2} fill="#E8D7E0"/>
  </Svg>;
}

/** Heights on Home, slim and open, for the fold. */
export const NIGHT_SLIM = 104, NIGHT_FULL = 300, REST_SLIM = 80, REST_FULL = 116;

/**
 * The Home card. Shows after your night prayer time until you say Amen.
 * On Home it folds like an eyelid closing: the sky shortens from below, the
 * title stays, and the moon shrinks into the Begin button. When the page
 * comes to rest on it, the moon rises into place and the stars catch once.
 */
export function NightPrayerCard({ onPress, scrollY, settled, last = 1, distance = 140 }: { onPress: () => void; scrollY?: SharedValue<number>; settled?: SharedValue<number>; last?: number; distance?: number }) {
  const e = useDerivedValue(() => scrollY ? focusAmount(scrollY.value, 0, last, distance) : 1);
  const idle = useSharedValue(0);
  const m = useFocusMoment(settled ?? idle, 0, 600);
  // The stack folds the card (FoldStack). The card is drawn at its open 300pt, so anything pinned to the bottom follows the folded edge: h - 300.
  const lift = (v: number) => { "worklet"; return 104 + 196 * v - 300; };
  const open = useAnimatedStyle(() => ({ opacity: interpolate(e.value, [.5, .85], [0, 1], Extrapolation.CLAMP) }));
  const slim = useAnimatedStyle(() => ({ opacity: interpolate(e.value, [.1, .35], [1, 0], Extrapolation.CLAMP), transform: [{ translateY: lift(e.value) }] }));
  const bottomOpen = useAnimatedStyle(() => ({ opacity: interpolate(e.value, [.5, .85], [0, 1], Extrapolation.CLAMP), transform: [{ translateY: lift(e.value) }] }));
  // Transforms only: the card's height is the one layout change.
  const moon = useAnimatedStyle(() => ({ transformOrigin: "right top", transform: [{ translateY: -8 * e.value + 18 * (1 - m.value) * e.value }, { scale: .667 + .333 * e.value }] }));
  const arrow = useAnimatedStyle(() => ({ opacity: interpolate(e.value, [.1, .4], [1, 0], Extrapolation.CLAMP) }));
  const title = useAnimatedStyle(() => ({ transformOrigin: "left bottom", transform: [{ translateY: lift(e.value) - 94 * e.value }, { scale: .74 + .26 * e.value }] }));
  const twinkle = useAnimatedStyle(() => ({ opacity: e.value * Math.sin(m.value * Math.PI) }));
  return <Pressable feedback="action" onPress={() => { haptics.soft(); onPress(); }} accessibilityRole="button" accessibilityLabel="Night prayer. Lay today down. Begin" style={{ borderRadius: 32, borderCurve: "continuous" }}>
    <View style={[s.card, { height: 300, padding: 0 }]}>
      <NightSky/>
      {TWINKLES.map(([x, y], i) => <Animated.View key={i} pointerEvents="none" style={[s.star, { left: `${x * 100}%`, top: `${y * 100}%` }, twinkle]}/>)}
      <Animated.View style={[s.tag, { position: "absolute", left: 22, top: 22 }, open]}><View style={s.tagDot}/><Text style={s.tagText}>Night prayer</Text></Animated.View>
      <Animated.View style={[{ position: "absolute", right: 22, top: 30 }, moon]}>
        <Moon size={66}/>
        <Animated.View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }, arrow]}><SFSymbol name="arrow.right" size={22} color={NIGHT.ink} weight="bold"/></Animated.View>
      </Animated.View>
      <Animated.View style={[{ position: "absolute", left: 22, bottom: 46 }, title]}><Text numberOfLines={1} style={{ fontSize: 34, lineHeight: 36, fontWeight: "900", letterSpacing: -1, color: NIGHT.moon }}>Lay today down.</Text></Animated.View>
      <Animated.View style={[{ position: "absolute", left: 22, bottom: 24 }, slim]}><Text style={{ fontSize: 13, lineHeight: 17, fontWeight: "700", color: NIGHT.lav }}>Before you sleep</Text></Animated.View>
      <Animated.View style={[{ position: "absolute", left: 22, right: 22, bottom: 22 }, bottomOpen]}>
        <Text style={{ fontSize: 15, lineHeight: 20, fontWeight: "600", color: NIGHT.lav }}>Say how today felt, then pray before you sleep.</Text>
        <View style={[s.btn, { backgroundColor: NIGHT.moon, height: 52, marginTop: 16 }]}><Text style={[s.btnText, { color: NIGHT.ink }]}>Begin</Text><SFSymbol name="arrow.right" size={16} color={NIGHT.ink} weight="bold"/></View>
      </Animated.View>
    </View>
  </Pressable>;
}

/** After Amen: the card stays tonight, plainly done, so you know you prayed. */
export function NightPrayerDoneCard({ entry, onPress, scrollY, last = 1, distance = 140 }: { entry: NightPrayerEntry; onPress: () => void; scrollY?: SharedValue<number>; last?: number; distance?: number }) {
  // Folds like a lamp dimming: the line closes up and a shade slides over the moon until it is a crescent.
  const p = useDerivedValue(() => scrollY ? 1 - focusAmount(scrollY.value, 0, last, distance) : 0);
  // On Home the stack folds the card (FoldStack), so the line only fades; nothing here changes size.
  const line = useAnimatedStyle(() => ({ opacity: interpolate(p.value, [0, .5], [1, 0], Extrapolation.CLAMP) }));
  const shade = useAnimatedStyle(() => ({ transform: [{ translateX: 48 - 34 * p.value }] }));
  const at = new Date(entry.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  const what = entry.topics.length ? `You prayed for ${entry.topics.map(t => t.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " and $1")}.` : "You gave today back.";
  return <Pressable feedback="action" onPress={() => { haptics.soft(); onPress(); }} accessibilityRole="button" accessibilityLabel={`Night prayer done at ${at}. ${what} Open your prayers`} style={[s.card, { height: scrollY ? REST_FULL : undefined, paddingVertical: 18 }]}>
    <NightSky width="100%" height="100%" stars={5}/>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
      <View style={s.doneTick}><SFSymbol name="checkmark" size={20} color={NIGHT.ink} weight="bold"/></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", color: NIGHT.candle }}>Prayed tonight · {at}</Text>
        <Text style={{ fontSize: 22, lineHeight: 26, fontWeight: "900", letterSpacing: -.5, color: NIGHT.moon, marginTop: 4 }}>Rest now.</Text>
      </View>
      <View style={{ width: 44, height: 44, borderRadius: 22, overflow: "hidden" }}><Moon size={44}/><Animated.View style={[StyleSheet.absoluteFill, { borderRadius: 22, backgroundColor: "#1F1128" }, shade]}/></View>
    </View>
    <Animated.View style={line}><Text numberOfLines={scrollY ? 1 : undefined} style={{ fontSize: 15, lineHeight: 20, fontWeight: "600", color: NIGHT.lav, marginTop: 12 }}>{what}</Text></Animated.View>
  </Pressable>;
}

function FadeLine({ index, shown, children }: { index: number; shown: boolean; children: React.ReactNode }) {
  const t = useSharedValue(shown ? 1 : 0);
  useEffect(() => {
    if (shown) { t.value = withTiming(1, { duration: 250 }); return; }
    t.value = withDelay(900 + index * 2100, withTiming(1, { duration: 1400, easing: Easing.out(Easing.cubic) }));
  }, [shown, index, t]);
  const look = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: 10 * (1 - t.value) }] }));
  return <Animated.View style={look}>{children}</Animated.View>;
}

function Chip({ label, on, onPress }: { label: string; on: boolean; onPress: () => void }) {
  return <Pressable onPress={() => { haptics.tick(); onPress(); }} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={label}
    style={[s.chip, on ? { backgroundColor: NIGHT.moon } : { backgroundColor: "#2A1836", borderWidth: 1, borderColor: "#FBF2F62E" }]}>
    {on && <SFSymbol name="checkmark" size={13} color={NIGHT.ink} weight="bold"/>}
    <Text style={{ fontSize: 16, fontWeight: "800", color: on ? NIGHT.ink : NIGHT.moon }}>{label}</Text>
  </Pressable>;
}

/** The flow: how today felt, what to pray for, the prayer, then rest. */
export function NightPrayerFlow({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets(), reduced = useReducedMotion(), reminder = useReminder(), settings = useNightPrayer();
  const [step, setStep] = useState(0), [feelings, setFeelings] = useState<string[]>([]), [topics, setTopics] = useState<string[]>([]);
  const [revealAll, setRevealAll] = useState(false), [ready, setReady] = useState(false);
  useEffect(() => { if (visible) { setStep(0); setFeelings([]); setTopics(settings.topics); setRevealAll(false); setReady(false); } }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  const prayer = useMemo(() => composeNightPrayer(feelings, topics), [feelings, topics]);
  useEffect(() => {
    if (step !== 2) return;
    if (reduced || revealAll) { setReady(true); return; }
    const t = setTimeout(() => setReady(true), 900 + (prayer.length - 1) * 2100 + 1400);
    return () => clearTimeout(t);
  }, [step, reduced, revealAll, prayer.length]);
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
  const amen = () => { haptics.thud(); recordNightPrayer(feelings, topics); setStep(3); };

  const dots = <View style={{ flexDirection: "row", gap: 6 }}>{[0, 1, 2].map(i => <View key={i} style={{ width: 22, height: 5, borderRadius: 3, backgroundColor: i <= step ? NIGHT.moon : "#FBF2F62E" }}/>)}</View>;
  const fact = (icon: SFSymbolName, title: string, sub: string, first?: boolean) => <View style={s.fact}>
    {!first && <View style={{ position: "absolute", top: 0, left: 52, right: 0, height: StyleSheet.hairlineWidth, backgroundColor: "#FBF2F624" }}/>}
    <SFSymbol name={icon} size={20} color={NIGHT.candle}/>
    <View style={{ flex: 1 }}><Text style={{ fontSize: 16, fontWeight: "800", color: NIGHT.moon }}>{title}</Text><Text style={{ fontSize: 13, lineHeight: 17, fontWeight: "600", color: NIGHT.lav, marginTop: 2 }}>{sub}</Text></View>
  </View>;

  return <Modal visible={visible} animationType={reduced ? "fade" : "slide"} presentationStyle="fullScreen" onRequestClose={onClose} statusBarTranslucent>
    <View style={{ flex: 1, backgroundColor: NIGHT.deep }}>
      <NightSky drift fade/>
      <View style={{ flex: 1, paddingTop: insets.top + 6, paddingHorizontal: 22, paddingBottom: Math.max(insets.bottom, 16) + 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", height: 48 }}>
          {step < 3 ? dots : <Text style={s.kicker}>Night prayer</Text>}
          <View style={{ flex: 1 }}/>
          <CloseButton onPress={onClose} color={NIGHT.moon} style={{ width: 44, height: 44, backgroundColor: "#FBF2F61A" }}/>
        </View>

        {step === 0 && <>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text accessibilityRole="header" style={s.h1}>How was today, really?</Text>
            <Text style={s.sub}>Pick as many as are true.</Text>
            <Text style={s.gh}>Carrying</Text>
            <View style={s.chips}>{NIGHT_FEELINGS.carrying.map(f => <Chip key={f} label={f} on={feelings.includes(f)} onPress={() => toggle(feelings, setFeelings, f)}/>)}</View>
            <Text style={s.gh}>Holding</Text>
            <View style={s.chips}>{NIGHT_FEELINGS.holding.map(f => <Chip key={f} label={f} on={feelings.includes(f)} onPress={() => toggle(feelings, setFeelings, f)}/>)}</View>
          </ScrollView>
          <Pressable feedback="action" onPress={() => { haptics.soft(); setStep(1); }} accessibilityRole="button" style={[s.btn, { backgroundColor: NIGHT.moon }]}><Text style={[s.btnText, { color: NIGHT.ink }]}>{feelings.length ? "Next" : "Skip"}</Text></Pressable>
        </>}

        {step === 1 && <>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text accessibilityRole="header" style={s.h1}>What do you want to pray for?</Text>
            <Text style={s.sub}>Pick up to three.</Text>
            <View style={[s.chips, { marginTop: 24 }]}>{NIGHT_TOPICS.map(t => <Chip key={t} label={t} on={topics.includes(t)} onPress={() => topics.includes(t) || topics.length < 3 ? toggle(topics, setTopics, t) : setTopics([...topics.slice(1), t])}/>)}</View>
          </ScrollView>
          <Pressable feedback="action" onPress={() => { haptics.thud(); setStep(2); }} accessibilityRole="button" style={[s.btn, s.candleBtn]}><Text style={[s.btnText, { color: "#3A1A08" }]}>Pray with me</Text></Pressable>
        </>}

        {step === 2 && <>
          <Pressable onPress={() => setRevealAll(true)} accessibilityRole="text" accessibilityLabel={prayer.map(l => l.text).join(" ")} style={{ flex: 1 }}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, justifyContent: "center", alignItems: "center", paddingTop: 14, paddingBottom: 20, gap: 16 }}>
              <Candle/>
              {prayer.map((l, i) => <FadeLine key={i} index={i} shown={reduced || revealAll}><Text style={{ fontSize: 23, lineHeight: 32, fontWeight: "800", letterSpacing: -.3, textAlign: "center", color: l.yours ? "#FFE2A0" : NIGHT.moon }}>{l.text}</Text></FadeLine>)}
            </ScrollView>
          </Pressable>
          {ready
            ? <Pressable feedback="action" onPress={amen} accessibilityRole="button" style={[s.btn, s.candleBtn]}><Text style={[s.btnText, { color: "#3A1A08" }]}>Amen</Text></Pressable>
            : <Text style={{ textAlign: "center", fontSize: 15, fontWeight: "800", color: NIGHT.lav, paddingVertical: 18 }}>Pray it aloud, or just read along</Text>}
        </>}

        {step === 3 && <>
          <View style={{ flex: 1, justifyContent: "flex-end", alignItems: "center" }}>
            <Moon size={74}/>
            <Text accessibilityRole="header" style={[s.h1, { fontSize: 44, lineHeight: 46, textAlign: "center", marginTop: 26 }]}>Rest now.</Text>
            <Text style={[s.sub, { textAlign: "center" }]}>You gave today back. Tomorrow is his too.</Text>
            <View style={s.facts}>
              {topics.length > 0 && fact("heart", `Praying for ${topics.map(t => t.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " and $1")}`, "He heard every word", true)}
              {fact("sun.max", "Tomorrow’s letter", `Arrives at ${reminder.label}`, topics.length === 0)}
            </View>
          </View>
          <Pressable feedback="action" onPress={() => { haptics.soft(); onClose(); }} accessibilityRole="button" style={[s.btn, { backgroundColor: NIGHT.moon, marginTop: 28 }]}><Text style={[s.btnText, { color: NIGHT.ink }]}>Goodnight</Text></Pressable>
        </>}
      </View>
    </View>
  </Modal>;
}

const s = StyleSheet.create({
  card: { height: 300, borderRadius: 32, borderCurve: "continuous", overflow: "hidden", padding: 22, boxShadow: "0 24px 40px -22px #320F3CE6" },
  tag: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: "#FBF2F61F" },
  tagDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: NIGHT.candle, boxShadow: "0 0 0 3px #FFC93C40" },
  star: { position: "absolute", width: 5, height: 5, borderRadius: 3, backgroundColor: "#FFFFFF" },
  tagText: { fontSize: 13, fontWeight: "800", letterSpacing: 1, textTransform: "uppercase", color: NIGHT.moon },
  btn: { height: 58, borderRadius: 29, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  doneTick: { width: 44, height: 44, borderRadius: 22, backgroundColor: NIGHT.candle, alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 5px #FFC93C33" },
  candleBtn: { backgroundColor: "#FFC24A", boxShadow: "0 10px 24px -10px #FFB83A99" },
  btnText: { fontSize: 17, fontWeight: "900" },
  kicker: { fontSize: 13, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", color: NIGHT.lav },
  h1: { marginTop: 22, fontSize: 38, lineHeight: 40, fontWeight: "900", letterSpacing: -1.2, color: NIGHT.moon },
  sub: { marginTop: 10, fontSize: 16, lineHeight: 22, fontWeight: "600", color: NIGHT.lav },
  gh: { marginTop: 24, marginBottom: 12, marginLeft: 2, fontSize: 13, fontWeight: "800", letterSpacing: 1.4, textTransform: "uppercase", color: NIGHT.lav2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { height: 44, paddingHorizontal: 16, borderRadius: 22, flexDirection: "row", alignItems: "center", gap: 6 },
  facts: { marginTop: 30, alignSelf: "stretch", borderRadius: 22, borderCurve: "continuous", backgroundColor: "#FBF2F612", borderWidth: 1, borderColor: "#FBF2F61A" },
  fact: { flexDirection: "row", alignItems: "center", gap: 14, minHeight: 62, paddingHorizontal: 16, paddingVertical: 10 },
});
