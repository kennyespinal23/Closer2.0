import { SuccessMark, SUCCESS_GREEN } from "./SuccessFeedback";
import { DailyExperience } from "./DailyExperience";
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "@/state/onboarding";
import { useProgress } from "@/state/progress";
import { useResolvedScheme } from "@/state/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { MOMENTS, toHomeCard } from "@/lib/moments";
import type { FloatingScriptureCard } from "@/constants/homePrototype";
import { BIBLE_MOMENTS } from "@/constants/bibleMoments";
import { ReaderMomentArt } from "./ReaderMomentArt";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { SFSymbol, type SFSymbolName } from "./Symbol";
import * as haptics from "@/lib/haptics";

type Practice = "prayer" | "quiz" | "action";
const ACTIONS: { id: Practice | "reading"; title: string; sub: string; icon: SFSymbolName }[] = [
  { id: "prayer", title: "Daily prayer", sub: "A quiet minute", icon: "hands.sparkles" },
  { id: "reading", title: "Today’s scripture & word", sub: "Read at your own pace", icon: "book" },
  { id: "quiz", title: "Quick check", sub: "Two questions from today’s verse", icon: "questionmark.bubble" },
  { id: "action", title: "One small step", sub: "Carry it into your day", icon: "sun.max" },
];
export function HomeDailyPath({ card, completed, onRead, onStreak, streak = 0, bottomInset, continueReading }: { card: FloatingScriptureCard; completed: boolean; onRead: (card: FloatingScriptureCard) => void; onStreak?: () => void; streak?: number; bottomInset: number; continueReading?: { label: string; accessibilityLabel: string; onPress: () => void } }) {
  const router = useRouter(), insets = useSafeAreaInsets(), dark = useResolvedScheme() === "dark", reduced = useReducedMotion();
  const { answers } = useOnboarding(), { sermonCompletions } = useProgress();
  const [active, setActive] = useState<Practice | null>(null), [weekPicker, setWeekPicker] = useState(false);
  const lastPractice = useRef<Practice>("prayer");
  if (active) lastPractice.current = active;
  const sheetPractice = active ?? lastPractice.current;
  const [saved, setSaved] = useState<Partial<Record<Practice, boolean>>>({}), [ready, setReady] = useState(false), [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const currentWeek = Math.ceil(card.day / 7), [week, setWeek] = useState(currentWeek);
  const storageKey = `closer.daily-practice.${card.id}.v1`;
  useEffect(() => { setWeek(currentWeek);  }, [card.id]);
  useEffect(() => { let live = true; setReady(false); setSaved({}); AsyncStorage.getItem(storageKey).then(raw => { if (live) { setSaved(raw ? JSON.parse(raw) : {}); setReady(true); } }).catch(() => { if (live) setError("Couldn’t load your practice. Reopen Home to retry."); }); return () => { live = false; }; }, [storageKey]);
  const ink = dark ? "#F7F0E6" : "#30241D", muted = dark ? "#BBAA99" : "#7C6B5B", surface = dark ? "#302820" : "#FFFAF0", border = dark ? "#FFFFFF13" : "#6B49251A";
  const done = (id: string) => id === "reading" ? completed : !!saved[id as Practice];
  const count = ACTIONS.filter(a => done(a.id)).length, next = ACTIONS.find(a => !done(a.id))?.id;
  const days = MOMENTS.filter(m => Math.ceil(m.day / 7) === week);
  const art = (reference: string) => BIBLE_MOMENTS.find(m => reference.toLowerCase().startsWith(m.bookId.replaceAll("-", " "))) ?? BIBLE_MOMENTS[0];
  const mark = async (score?: number) => { if (!active || saving) return; if (!ready) throw new Error("Practice has not loaded"); setSaving(true); setError(""); const nextSaved = { ...saved, [active]: true, ...(active === "quiz" ? { quizScore: score } : {}) }; try { await AsyncStorage.setItem(storageKey, JSON.stringify(nextSaved)); setSaved(nextSaved); } catch { throw new Error("Couldn’t save practice"); } finally { setSaving(false); } };
  const dismiss = () => { if (!saving) { setActive(null); setWeekPicker(false); setError(""); } };
  return <View style={{ flex: 1 }}><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: bottomInset + 28 }}>
    <View style={s.top}><Pressable onPress={() => setWeekPicker(true)} accessibilityRole="button" accessibilityLabel="Choose a week" style={[s.pill, { backgroundColor: surface }]}><Text style={{ color: ink, fontSize: 18, fontWeight: "600" }}>Week {week}</Text><SFSymbol name="chevron.down" size={12} color={muted} /></Pressable><View style={{ flex: 1 }} /><Pressable onPress={onStreak} accessibilityRole="button" accessibilityLabel={`${streak} day streak`} style={[s.pill, { backgroundColor: surface }]}><SFSymbol name="flame.fill" color="#E9884F" size={23} /><Text style={{ color: ink, fontSize: 17, fontWeight: "600" }}>{streak}</Text></Pressable><Pressable onPress={() => router.push("/profile")} accessibilityRole="button" accessibilityLabel="Your profile" style={s.portrait}><ReaderMaterialGradient colors={["#A6CFD0", "#E8B98B"]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#30241D", fontSize: 20, fontWeight: "600" }}>{answers.name.trim()[0]?.toUpperCase() || "C"}</Text></ReaderMaterialGradient></Pressable></View>
    <Animated.View layout={reduced ? undefined : LinearTransition.duration(220)} style={[s.today, { backgroundColor: surface }]}>
      <View style={s.head}><View style={s.thumb}><ReaderMomentArt moment={art(card.scriptureReference)} /></View><View style={{ flex: 1, gap: 8 }}><Text style={{ color: muted, fontSize: 13, fontWeight: "600" }}>Day {card.day} · Today</Text><Text style={{ color: ink, fontSize: 24, lineHeight: 28, fontWeight: "700", letterSpacing: -.4 }}>{card.title}</Text><View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><Text style={{ color: muted, fontSize: 13 }}>{count}/4 done</Text><View style={{ flex: 1, height: 5, borderRadius: 3, backgroundColor: border, overflow: "hidden" }}><View style={{ width: `${count * 25}%`, height: 5, backgroundColor: count === 4 ? SUCCESS_GREEN : "#83B8C8" }} /></View></View></View></View>
      {<Animated.View entering={FadeIn.duration(reduced ? 0 : 160)}>{ACTIONS.map(a => <Pressable key={a.id} accessibilityRole="button" onPress={() => { haptics.soft(); if (a.id === "reading") onRead(card); else setActive(a.id); }} style={[s.row, { borderTopColor: border }]}><SFSymbol name={a.icon} color={ink} size={23} /><View style={{ flex: 1, gap: 4 }}><Text style={{ color: done(a.id) ? muted : ink, fontSize: 16, fontWeight: "600" }}>{a.title}</Text><Text style={{ color: next === a.id ? dark ? "#9BCBDC" : "#327489" : muted, fontSize: 13 }}>{done(a.id) ? "Done" : next === a.id ? "Up next" : a.sub}</Text></View>{done(a.id) ? <SuccessMark size={26} /> : <SFSymbol name="circle.dashed" size={26} color={next === a.id ? "#83B8C8" : muted} />}</Pressable>)}<View style={{ height: 12 }} /></Animated.View>}
    </Animated.View>
    <View style={{ alignItems: "center", marginTop: 36, marginBottom: 24, gap: 6 }}><Text style={{ color: muted, fontSize: 13 }}>Week {week}</Text><Text style={{ color: ink, fontSize: 26, fontWeight: "700", letterSpacing: -.5 }}>Your daily walk</Text></View>
    {days.map((day, i) => { const today = day.day === card.day, future = day.day > card.day, finished = sermonCompletions.some(c => c.day === day.day), tomorrow = day.day === card.day + 1; return <View key={day.day} style={{ paddingBottom: i === days.length - 1 ? 0 : 28 }}>{i < days.length - 1 && <View style={{ position: "absolute", left: 43, top: 84, bottom: 0, width: 3, backgroundColor: finished ? SUCCESS_GREEN : border }} />}<Pressable disabled={future} accessibilityRole="button" accessibilityLabel={`Day ${day.day}, ${future ? "sealed" : day.title}`} onPress={() => { if (today) {  onRead(card); } else onRead(toHomeCard(day)); }} style={s.pathRow}><View style={[s.pathArt, { transform: [{ rotate: `${i % 2 ? 2 : -2}deg` }] }]}><ReaderMomentArt moment={art(day.reference)} />{future && <View style={[StyleSheet.absoluteFill, { backgroundColor: dark ? "#211B17DC" : "#D6C5AFEA", alignItems: "center", justifyContent: "center" }]}><SFSymbol name={tomorrow ? "envelope.badge" : "lock.fill"} color={muted} size={26} /></View>}{finished && <View style={s.seal}><SFSymbol name="checkmark" color="#FFF" size={14} /></View>}</View><View style={{ flex: 1, gap: 5 }}><Text style={{ color: today ? "#D97450" : muted, fontSize: 13, fontWeight: "600" }}>{today ? "Today" : tomorrow ? "Tomorrow" : `Day ${day.day}`}</Text><Text style={{ color: ink, fontSize: 19, lineHeight: 24, fontWeight: "600" }}>{future ? "A letter waiting for you" : day.title}</Text><Text style={{ color: muted, fontSize: 13, lineHeight: 19 }}>{future ? tomorrow ? "Opens with your next daily reading" : "One day at a time" : finished ? "Finished" : day.reference}</Text></View></Pressable></View>; })}
    {continueReading && <Pressable onPress={continueReading.onPress} accessibilityRole="button" accessibilityLabel={continueReading.accessibilityLabel} style={[s.row, { backgroundColor: surface, borderTopColor: "transparent", borderRadius: 18, marginHorizontal: 0, marginTop: 24, paddingHorizontal: 16 }]}><SFSymbol name="book" color={ink} size={22} /><Text style={{ color: ink, fontSize: 16, flex: 1 }}>{continueReading.label}</Text><SFSymbol name="arrow.right" color={ink} size={18} /></Pressable>}
    {!!error && !active && <Text style={{ color: muted, marginTop: 16 }}>{error}</Text>}
  </ScrollView>
  <DailyExperience visible={active !== null} kind={sheetPractice} card={card} onClose={dismiss} onComplete={mark} />
  <Modal visible={weekPicker} animationType={reduced ? "fade" : "slide"} presentationStyle="pageSheet" onRequestClose={dismiss}><ReaderMaterialGradient colors={dark ? ["#372B22", "#1D1916"] : ["#EBD8BE", "#FFF9EE"]} style={{ flex: 1 }}><View style={{ alignItems: "flex-end", padding: 20 }}><Pressable onPress={dismiss} accessibilityRole="button" accessibilityLabel="Close" style={s.close}><SFSymbol name="xmark" size={20} color={ink} /></Pressable></View><ScrollView contentContainerStyle={{ padding: 28, paddingBottom: 60, gap: 24 }}><Text style={{ color: ink, fontSize: 30, fontWeight: "700" }}>Your weeks</Text>{Array.from({ length: currentWeek }, (_, i) => i + 1).map(w => <Pressable key={w} onPress={() => { setWeek(w); setWeekPicker(false); }} style={[s.row, { borderTopColor: border }]}><Text style={{ color: ink, fontSize: 18, flex: 1 }}>Week {w}</Text>{week === w && <SFSymbol name="checkmark" color={SUCCESS_GREEN} size={18} />}</Pressable>)}</ScrollView></ReaderMaterialGradient></Modal>
  </View>;
}
const s = StyleSheet.create({ top: { flexDirection: "row", alignItems: "center", gap: 10 }, pill: { height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, borderRadius: 24 }, portrait: { width: 44, height: 48, backgroundColor: "#FFF9EE", padding: 3, paddingBottom: 8, transform: [{ rotate: "4deg" }], boxShadow: "0 4px 10px #00000022" }, today: { marginTop: 24, borderRadius: 24, borderCurve: "continuous", overflow: "hidden", boxShadow: "0 12px 30px #0000001C" }, head: { padding: 16, flexDirection: "row", gap: 12, alignItems: "center" }, thumb: { width: 88, height: 100, borderRadius: 14, overflow: "hidden" }, row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, marginHorizontal: 18, borderTopWidth: .5, minHeight: 68 }, pathRow: { flexDirection: "row", gap: 20, alignItems: "center", minHeight: 92 }, pathArt: { width: 88, height: 92, borderRadius: 16, overflow: "hidden", boxShadow: "0 6px 12px #00000020" }, seal: { position: "absolute", bottom: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: SUCCESS_GREEN, alignItems: "center", justifyContent: "center" }, close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, button: { padding: 18, borderRadius: 28, backgroundColor: "#FFF9EE", alignItems: "center", marginTop: 16 } });
