import { useDailyPractice } from '@/lib/dailyPractice';
import { DailyStoryProgress } from './DailyStoryProgress';
import { contentLayout } from "@/lib/contentStyles";
import { uiText } from "@/lib/typography";

import { buttonStyles } from "@/lib/buttonStyles";
import { CloseButton } from "@/components/CloseButton";
import { useTabContentFade } from '@/lib/useTabContentFade';
import { FeedbackPressable as Pressable } from "./FeedbackPressable";
import { useReadingGoal } from "@/state/readingGoal";
import { paperActionColors } from "@/lib/paperControls";
import { SuccessMark, SUCCESS_GREEN } from "./SuccessFeedback";
import { DailyExperience } from "./DailyExperience";
import { useEffect, useRef, useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { Text } from "@/components/CloserText";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";

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
const ACTIONS: { id: Practice | "reading"; title: string; icon: SFSymbolName }[] = [
  { id: "prayer", title: "Daily prayer", icon: "hands.sparkles" },
  { id: "reading", title: "Today’s scripture & word", icon: "book" },
  { id: "quiz", title: "Quick check", icon: "questionmark.bubble" },
  { id: "action", title: "One small step", icon: "sun.max" },
];
export function HomeDailyPath({ card, completed, onRead, onStreak, streak = 0, bottomInset, continueReading }: { card: FloatingScriptureCard; completed: boolean; onRead: (card: FloatingScriptureCard) => void; onStreak?: () => void; streak?: number; bottomInset: number; continueReading?: { label: string; accessibilityLabel: string; onPress: () => void } }) {
  const { goalMinutes } = useReadingGoal();
  const router = useRouter(), insets = useSafeAreaInsets(), dark = useResolvedScheme() === "dark", reduced = useReducedMotion();
  const tabContentStyle = useTabContentFade(reduced);
  const { answers } = useOnboarding(), { sermonCompletions, completeDailyTasks, hydrated } = useProgress();
  const [active, setActive] = useState<Practice | null>(null), [weekPicker, setWeekPicker] = useState(false);
  const lastPractice = useRef<Practice>("prayer");
  if (active) lastPractice.current = active;
  const sheetPractice = active ?? lastPractice.current;
  const { saved, ready, error, save, key: storageKey } = useDailyPractice(card.id);
  const [saving, setSaving] = useState(false);
  const currentWeek = Math.ceil(card.day / 7), [week, setWeek] = useState(currentWeek);
  useEffect(() => { setWeek(currentWeek); }, [currentWeek]);
  const ink = dark ? "#F7F0E6" : "#30241D", muted = dark ? "#BBAA99" : "#7C6B5B", surface = dark ? "#302820" : "#FFFAF0", border = dark ? "#FFFFFF13" : "#6B49251A";
  const done = (id: string) => id === "reading" ? completed : !!saved[id as Practice];
  const count = ACTIONS.filter(a => done(a.id)).length, next = ACTIONS.find(a => !done(a.id))?.id;
  useEffect(() => {
    if (ready && hydrated && count === 4) completeDailyTasks(card.day, saved);
  }, [ready, storageKey, hydrated, count, card.day, saved, completeDailyTasks]);
  const firstVisit = ready && sermonCompletions.length === 0 && count === 0;
  const actionColors = paperActionColors(dark);
  const openTask = (id: Practice | "reading") => { if (!ready || saving) return; haptics.soft(); if (id === "reading") onRead(card); else setActive(id); };
  const days = MOMENTS.filter(m => Math.ceil(m.day / 7) === week);
  const art = (reference: string) => BIBLE_MOMENTS.find(m => reference.toLowerCase().startsWith(m.bookId.replaceAll("-", " "))) ?? BIBLE_MOMENTS[0];
  const mark = async (score?: number) => { if (!active || saving) return; if (!ready) throw new Error("Practice has not loaded"); setSaving(true); try { await save(active, score); } finally { setSaving(false); } };
  const dismiss = () => { if (!saving) { setActive(null); setWeekPicker(false); } };
  return <View style={{ flex: 1 }}><Animated.ScrollView style={tabContentStyle} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + contentLayout.screenTop, paddingHorizontal: contentLayout.gutter, paddingBottom: bottomInset + 28 }}>
    <View style={s.top}><Pressable onPress={() => setWeekPicker(true)} accessibilityRole="button" accessibilityLabel="Choose a week" style={[s.pill, { backgroundColor: surface }]}><Text style={{ color: ink, fontSize: 18, fontWeight: "600" }}>Week {week}</Text><SFSymbol name="chevron.down" size={12} color={muted} /></Pressable><View style={{ flex: 1 }} />{ready && count === 4 && <Pressable onPress={onStreak} accessibilityRole="button" accessibilityLabel={`${streak} day streak`} style={[s.pill, { backgroundColor: surface }]}><SFSymbol name="flame.fill" color="#E9884F" size={23} /><Text style={{ color: ink, fontSize: 17, fontWeight: "600" }}>{streak}</Text></Pressable>}<Pressable onPress={() => router.push("/profile")} accessibilityRole="button" accessibilityLabel="Your profile" style={s.portrait}><ReaderMaterialGradient colors={["#A6CFD0", "#E8B98B"]} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}><Text style={{ color: "#30241D", fontSize: 20, fontWeight: "600" }}>{answers.name.trim()[0]?.toUpperCase() || "C"}</Text></ReaderMaterialGradient></Pressable></View>
    {firstVisit && <View style={{ marginTop: 28, gap: 8 }}><Text accessibilityRole="header" style={{ ...uiText.screenTitle, color: ink }}>{answers.name.trim() ? `A little closer, ${answers.name.trim().split(" ")[0]}.` : "Your first small step."}</Text><Text style={{ color: muted, fontSize: 16, lineHeight: 23 }}>{goalMinutes} minutes today</Text></View>}
    <Animated.View layout={reduced ? undefined : LinearTransition.duration(220)} style={[s.today, { backgroundColor: surface }]}>
      <View style={s.head}><View style={s.thumb}><ReaderMomentArt moment={art(card.scriptureReference)} /></View><View style={{ flex: 1, gap: 8 }}><Text style={{ color: muted, fontSize: 13, fontWeight: "600" }}>Day {card.day} · Today</Text><Text style={{ ...uiText.sectionTitle, color: ink }}>{card.title}</Text><View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><Text style={{ color: muted, fontSize: 13 }}>{count}/4 done</Text><View style={{ flex: 1 }}><DailyStoryProgress completed={{ ...saved, reading: completed }} color={ink} track={border} /></View></View></View></View>
      {ready && next && <Pressable feedback="action" accessibilityRole="button" onPress={() => openTask(next)} style={[buttonStyles.primary, { marginHorizontal: 16, marginBottom: 16, backgroundColor: actionColors.backgroundColor }]}><Text style={[{ color: actionColors.color }, buttonStyles.label]}>{count === 0 ? "Start today" : next === "reading" ? "Read today’s letter" : next === "quiz" ? "Try the quick check" : next === "action" ? "Take one small step" : "Begin your prayer"}</Text></Pressable>}
      {ready && count === 4 && <Text accessibilityLiveRegion="polite" style={{ color: muted, fontSize: 15, textAlign: "center", paddingBottom: 16 }}>All four tasks complete</Text>}
      {<Animated.View entering={FadeIn.duration(reduced ? 0 : 160)}>{ACTIONS.map(a => <Pressable key={a.id} accessibilityRole="button" disabled={!ready || saving} onPress={() => openTask(a.id)} style={[s.row, { borderTopColor: border }]}><SFSymbol name={a.icon} color={ink} size={23} /><View style={{ flex: 1, gap: 4 }}><Text style={{ ...uiText.body, color: done(a.id) ? muted : ink, fontWeight: "800" }}>{a.title}</Text></View>{done(a.id) ? <SuccessMark size={26} /> : <SFSymbol name="circle.dashed" size={26} color={next === a.id ? "#83B8C8" : muted} />}</Pressable>)}<View style={{ height: 12 }} /></Animated.View>}
    </Animated.View>
    <View style={{ alignItems: "center", marginTop: 36, marginBottom: 24, gap: 6 }}><Text style={{ color: muted, fontSize: 13 }}>Week {week}</Text><Text style={{ ...uiText.sectionTitle, color: ink }}>Your daily walk</Text></View>
    {days.map((day, i) => { const today = day.day === card.day, future = day.day > card.day, finished = sermonCompletions.some(c => c.day === day.day), tomorrow = day.day === card.day + 1; return <View key={day.day} style={{ paddingBottom: i === days.length - 1 ? 0 : 28 }}>{i < days.length - 1 && <View style={{ position: "absolute", left: 43, top: 84, bottom: 0, width: 3, backgroundColor: finished ? SUCCESS_GREEN : border }} />}<Pressable disabled={future} accessibilityRole="button" accessibilityLabel={`Day ${day.day}, ${future ? "sealed" : day.title}`} onPress={() => { if (today) {  onRead(card); } else onRead(toHomeCard(day)); }} style={s.pathRow}><View style={[s.pathArt, { transform: [{ rotate: `${i % 2 ? 2 : -2}deg` }] }]}><ReaderMomentArt moment={art(day.reference)} />{future && <View style={[StyleSheet.absoluteFill, { backgroundColor: dark ? "#211B17DC" : "#D6C5AFEA", alignItems: "center", justifyContent: "center" }]}><SFSymbol name={tomorrow ? "envelope.badge" : "lock.fill"} color={muted} size={26} /></View>}{finished && <View style={s.seal}><SFSymbol name="checkmark" color="#FFF" size={14} /></View>}</View><View style={{ flex: 1, gap: 5 }}><Text style={{ color: today ? "#D97450" : muted, fontSize: 13, fontWeight: "600" }}>{today ? "Today" : tomorrow ? "Tomorrow" : `Day ${day.day}`}</Text><Text style={{ ...uiText.body, fontWeight: "800", color: ink }}>{future ? "A letter waiting for you" : day.title}</Text><Text style={{ color: muted, fontSize: 13, lineHeight: 19 }}>{future ? tomorrow ? "Opens with your next daily reading" : "One day at a time" : finished ? "Finished" : day.reference}</Text></View></Pressable></View>; })}
    {continueReading && <Pressable onPress={continueReading.onPress} accessibilityRole="button" accessibilityLabel={continueReading.accessibilityLabel} style={[s.row, { backgroundColor: surface, borderTopColor: "transparent", borderRadius: 18, marginHorizontal: 0, marginTop: 24, paddingHorizontal: 16 }]}><SFSymbol name="book" color={ink} size={22} /><Text style={{ color: ink, fontSize: 16, flex: 1 }}>{continueReading.label}</Text><SFSymbol name="arrow.right" color={ink} size={18} /></Pressable>}
    {!!error && !active && <Text style={{ color: muted, marginTop: 16 }}>{error}</Text>}
  </Animated.ScrollView>
  <DailyExperience visible={active !== null} kind={sheetPractice} card={card} onClose={dismiss} onComplete={mark} />
  <Modal visible={weekPicker} animationType={reduced ? "fade" : "slide"} presentationStyle="pageSheet" onRequestClose={dismiss}><ReaderMaterialGradient colors={dark ? ["#372B22", "#1D1916"] : ["#EBD8BE", "#FFF9EE"]} style={{ flex: 1 }}><View style={{ alignItems: "flex-end", padding: 20 }}><CloseButton onPress={dismiss} accessibilityRole="button" accessibilityLabel="Close" style={s.close} color={ink} /></View><ScrollView contentContainerStyle={{ padding: 28, paddingBottom: 60, gap: 24 }}><Text style={{ ...uiText.screenTitle, color: ink }}>Your weeks</Text>{Array.from({ length: currentWeek }, (_, i) => i + 1).map(w => <Pressable key={w} onPress={() => { setWeek(w); setWeekPicker(false); }} style={[s.row, { borderTopColor: border }]}><Text style={{ color: ink, fontSize: 18, flex: 1 }}>Week {w}</Text>{week === w && <SFSymbol name="checkmark" color={SUCCESS_GREEN} size={18} />}</Pressable>)}</ScrollView></ReaderMaterialGradient></Modal>
  </View>;
}
const s = StyleSheet.create({ top: { flexDirection: "row", alignItems: "center", gap: 10 }, pill: { height: 44, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, borderRadius: 24 }, portrait: { width: 44, height: 48, backgroundColor: "#FFF9EE", padding: 3, paddingBottom: 8, transform: [{ rotate: "4deg" }], boxShadow: "0 4px 10px #00000022" }, today: { marginTop: 24, borderRadius: 24, borderCurve: "continuous", overflow: "hidden", boxShadow: "0 12px 30px #0000001C" }, head: { padding: 16, flexDirection: "row", gap: 12, alignItems: "center" }, thumb: { width: 88, height: 100, borderRadius: 14, overflow: "hidden" }, row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, marginHorizontal: 18, borderTopWidth: .5, minHeight: 68 }, pathRow: { flexDirection: "row", gap: 20, alignItems: "center", minHeight: 92 }, pathArt: { width: 88, height: 92, borderRadius: 16, overflow: "hidden", boxShadow: "0 6px 12px #00000020" }, seal: { position: "absolute", bottom: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: SUCCESS_GREEN, alignItems: "center", justifyContent: "center" }, close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" }, button: { padding: 18, borderRadius: 28, backgroundColor: "#FFF9EE", alignItems: "center", marginTop: 16 } });
