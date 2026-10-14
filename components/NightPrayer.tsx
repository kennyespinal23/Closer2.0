import { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
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

// Night colours: a warm plum, leaning red so it sits with the ember palette.
export const NIGHT = { top: "#6E3878", mid: "#42204F", deep: "#1F1028", moon: "#FBF2F6", lav: "#D2C3DC", lav2: "#C2B2CF", ink: "#2A1233", candle: "#FFC93C" };
const STARS: [number, number, number][] = [[.12, .09, 2], [.28, .16, 3], [.46, .07, 2], [.63, .2, 2], [.82, .12, 3], [.9, .3, 2], [.36, .27, 2], [.72, .36, 3], [.55, .42, 2], [.18, .44, 2]];

/** A plum night sky: lit from the top right, a few crisp stars. */
export function NightSky({ width, height, stars = STARS.length }: { width: number | `${number}%`; height: number | `${number}%`; stars?: number }) {
  return <View pointerEvents="none" style={StyleSheet.absoluteFill}><Svg width={width} height={height}>
    <Defs><RadialGradient id="nightSky" cx="78%" cy="0%" rx="120%" ry="75%"><Stop offset="0" stopColor={NIGHT.top}/><Stop offset=".45" stopColor={NIGHT.mid}/><Stop offset="1" stopColor={NIGHT.deep}/></RadialGradient></Defs>
    <Rect width="100%" height="100%" fill="url(#nightSky)"/>
    {STARS.slice(0, stars).map(([x, y, r], i) => <Circle key={i} cx={`${x * 100}%`} cy={`${y * 100}%`} r={r / 2 + .3} fill="#FFFFFF" opacity={r > 2 ? .9 : .65}/>)}
  </Svg></View>;
}

function Moon({ size }: { size: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, boxShadow: `0 0 0 ${size * .14}px #FBF2F60D, 0 0 0 ${size * .32}px #FBF2F608` }}>
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

/** The Home card. Shows after your night prayer time until you say Amen. */
export function NightPrayerCard({ onPress }: { onPress: () => void }) {
  return <Pressable feedback="action" onPress={() => { haptics.soft(); onPress(); }} accessibilityRole="button" accessibilityLabel="Night prayer. Lay today down. Begin" style={s.card}>
    <NightSky width="100%" height="100%" stars={6}/>
    <View style={{ position: "absolute", right: 22, top: 22 }}><Moon size={66}/></View>
    <View style={s.tag}><View style={s.tagDot}/><Text style={s.tagText}>Night prayer</Text></View>
    <View style={{ flex: 1 }}/>
    <Text style={{ fontSize: 34, lineHeight: 36, fontWeight: "900", letterSpacing: -1, color: NIGHT.moon }}>Lay today down.</Text>
    <Text style={{ fontSize: 15, lineHeight: 20, fontWeight: "600", color: NIGHT.lav, marginTop: 8 }}>Say how today felt, then pray before you sleep.</Text>
    <View style={[s.btn, { backgroundColor: NIGHT.moon, height: 52, marginTop: 16 }]}><Text style={[s.btnText, { color: NIGHT.ink }]}>Begin</Text><SFSymbol name="arrow.right" size={16} color={NIGHT.ink} weight="bold"/></View>
  </Pressable>;
}

/** After Amen: the card stays tonight, plainly done, so you know you prayed. */
export function NightPrayerDoneCard({ entry, onPress }: { entry: NightPrayerEntry; onPress: () => void }) {
  const at = new Date(entry.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toLowerCase();
  const what = entry.topics.length ? `You prayed for ${entry.topics.map(t => t.toLowerCase()).join(", ").replace(/, ([^,]*)$/, " and $1")}.` : "You gave today back.";
  return <Pressable feedback="action" onPress={() => { haptics.soft(); onPress(); }} accessibilityRole="button" accessibilityLabel={`Night prayer done at ${at}. ${what} Open your prayers`} style={[s.card, { height: undefined, paddingVertical: 18 }]}>
    <NightSky width="100%" height="100%" stars={5}/>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
      <View style={s.doneTick}><SFSymbol name="checkmark" size={20} color={NIGHT.ink} weight="bold"/></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase", color: NIGHT.candle }}>Prayed tonight · {at}</Text>
        <Text style={{ fontSize: 22, lineHeight: 26, fontWeight: "900", letterSpacing: -.5, color: NIGHT.moon, marginTop: 4 }}>Rest now.</Text>
      </View>
      <Moon size={44}/>
    </View>
    <Text style={{ fontSize: 15, lineHeight: 20, fontWeight: "600", color: NIGHT.lav, marginTop: 12 }}>{what}</Text>
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
    style={[s.chip, on ? { backgroundColor: NIGHT.moon } : { backgroundColor: "#FBF2F614", borderWidth: 1, borderColor: "#FBF2F61F" }]}>
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
      <NightSky width="100%" height="100%"/>
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
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 14, paddingBottom: 20, gap: 16 }}>
              <Candle/>
              {prayer.map((l, i) => <FadeLine key={i} index={i} shown={reduced || revealAll}><Text style={{ fontSize: 23, lineHeight: 32, fontWeight: "800", letterSpacing: -.3, color: l.yours ? "#FFE2A0" : NIGHT.moon }}>{l.text}</Text></FadeLine>)}
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
