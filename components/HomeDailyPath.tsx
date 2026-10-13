import type { HomeQuote } from "@/lib/homeQuotes";
import { DailyWalkOverview } from "./DailyWalkOverview";
import { DAILY_STEPS, type DailyStep, useDailyPractice } from '@/lib/dailyPractice';
import { contentLayout } from "@/lib/contentStyles";
import { dailyText, uiText } from "@/lib/typography";

import { buttonStyles } from "@/lib/buttonStyles";
import { CloseButton } from "@/components/CloseButton";
import { useTabContentFade } from '@/lib/useTabContentFade';
import { FeedbackPressable as Pressable } from "./FeedbackPressable";


import { SUCCESS_GREEN } from "./SuccessFeedback";
import { DailyExperience } from "./DailyExperience";
import { useEffect, useRef, useState } from "react";
import { Modal, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/CloserText";
import Animated, { Easing, Extrapolation, type SharedValue, cancelAnimation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

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
import { SealedEnvelope, TomorrowLetter } from "./TomorrowLetter";
import { YouSheet } from "./YouSheet";
import { APP_CANVAS, SkyGradient } from "./HomeSkyGradient";
import { TiltedBook } from "./TiltedBook";
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
export function HomeDailyPath({ card, homeQuote, completed, onRead, onReadingComplete, onStreak, streak = 0, bottomInset, continueReading }: { card: FloatingScriptureCard; homeQuote?: HomeQuote | null; completed: boolean; onRead: (card: FloatingScriptureCard) => void; onReadingComplete: (card: FloatingScriptureCard) => void; onStreak?: () => void; streak?: number; bottomInset: number; continueReading?: { label: string; title?: string; bookId?: string; accessibilityLabel: string; onPress: () => void } }) {
  const { width, height, fontScale } = useWindowDimensions();
  const compact = fontScale > 1.2;
  const smallPhone = width < 380;
  const [overview, setOverview] = useState(false);
  const finishAfterDismiss = useRef(false);
  const pendingHistory = useRef<(() => void) | null>(null);
  const router = useRouter(), insets = useSafeAreaInsets(), dark = useResolvedScheme() === "dark", reduced = useReducedMotion();
  const tabContentStyle = useTabContentFade(reduced);
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y; });
  const { answers } = useOnboarding(), { sermonCompletions, completeDailyTasks, hydrated } = useProgress();
  const [active, setActive] = useState<DailyStep | null>(null), [weekPicker, setWeekPicker] = useState(false), [tomorrowOpen, setTomorrowOpen] = useState(false), [youOpen, setYouOpen] = useState(false);
  const lastPractice = useRef<DailyStep>("prayer");
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

  const openTask = (id: Practice | "reading") => { if (!ready || saving) return; haptics.soft(); setActive(id); };
  const days = MOMENTS.filter(m => Math.ceil(m.day / 7) === week);
  const art = (reference: string) => {
    const match = reference.match(/^(.+?)\s+(\d+)(?::(\d+))?/);
    const bookId = match?.[1].toLowerCase().replaceAll(" ", "-");
    const chapter = Number(match?.[2] ?? 1);
    const verse = Number(match?.[3] ?? 1);
    const candidates = BIBLE_MOMENTS.filter(m => m.bookId === bookId);
    const distance = (m: typeof BIBLE_MOMENTS[number]) => Math.abs(m.chapter - chapter) * 1000 + Math.abs(m.verse - verse);
    return candidates.find(m => m.chapter === chapter && verse >= m.verse && verse <= m.endVerse) ?? candidates.reduce((best, m) => distance(m) < distance(best) ? m : best, candidates[0] ?? BIBLE_MOMENTS[0]);
  };
  const todayArt = art(card.scriptureReference);
  const companionArt = BIBLE_MOMENTS.filter(m => m.bookId === todayArt.bookId && m.id !== todayArt.id).sort((a, b) => Math.abs(a.chapter - todayArt.chapter) - Math.abs(b.chapter - todayArt.chapter));
  const paintings = [todayArt, companionArt[0] ?? todayArt, companionArt[1] ?? todayArt];
  const tomorrow = MOMENTS.find(m => m.day === card.day + 1);
  const quote = homeQuote?.segments.map(segment => segment.text).join("").trim();
  const title = quote || card.title;
  const titleStyle = (() => {
    const base = height < 700 ? dailyText.compactHomeTitle : dailyText.homeTitle;
    const step = height < 700 ? 6 : 0;
    if (title.length <= 40) return base;
    if (title.length <= 65) return { ...base, fontSize: 38 - step, lineHeight: 42 - step, letterSpacing: -1 };
    return { ...base, fontSize: 32 - step, lineHeight: 37 - step, letterSpacing: -.6 };
  })();
  const firstName = answers.name.trim().split(" ")[0];
  // Light mode sits on the same cream canvas as the rest of the app; the bottom fade matches its lowest stop.
  const background = dark ? "#211D19" : APP_CANVAS.light[2];
  const mark = async (score?: number) => { if (!active || saving) return; if (!ready) throw new Error("Practice has not loaded"); setSaving(true); try { if (active === "reading") { if (!completed) onReadingComplete(card); } else await save(active, score); } finally { setSaving(false); } };
  const continueFlow = () => {
    if (!active) return;
    const index = DAILY_STEPS.indexOf(active);
    const remaining = [...DAILY_STEPS.slice(index + 1), ...DAILY_STEPS.slice(0, index)];
    setActive(remaining.find(step => !done(step)) ?? null);
  };
  const dismiss = () => { if (!saving) { setWeekPicker(false); if (active) { finishAfterDismiss.current = true; setTimeout(() => { if (finishAfterDismiss.current) { finishAfterDismiss.current = false; setOverview(false); } }, 1000); /* iOS sometimes skips the modal's onDismiss */ setActive(null); } else setOverview(false); } };
  return <View style={{ flex: 1, backgroundColor: background }}>
    {dark ? <ReaderMaterialGradient colors={["#4A3420", "#211D19"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420 }} /> : <SkyGradient />}
    <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} snapToOffsets={tomorrow && !compact && !reduced ? [0, tomorrowGrowDistance(height)] : undefined} snapToEnd={false} style={tabContentStyle} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + contentLayout.screenTop, paddingHorizontal: 20, paddingBottom: bottomInset + 28 + (tomorrow && !compact && !reduced ? TOMORROW_FULL - TOMORROW_PEEK : 0), gap: 24 }}>
      <View style={s.top}>
        <Pressable onPress={() => { haptics.soft(); setYouOpen(true); }} accessibilityRole="button" accessibilityLabel="You: profile and settings" style={[s.avatar, { backgroundColor: "#FF4326" }]}>{firstName ? <Text style={{ ...uiText.sectionTitle, color: "#FFF" }}>{firstName[0].toUpperCase()}</Text> : <SFSymbol name="person.fill" color="#FFF" size={22}/>}</Pressable>
        <View style={{ flex: 1, gap: 2 }}>{!!firstName && <Text style={{ ...uiText.body, fontWeight: "800", color: ink }}>{firstName}</Text>}{streak > 1 && <Pressable onPress={onStreak} accessibilityRole="button" accessibilityLabel={`${streak} day streak`} hitSlop={{ top: 10, bottom: 10 }} style={{ alignSelf: "flex-start" }}><Text style={{ ...uiText.supporting, color: firstName ? muted : ink, fontWeight: firstName ? "500" : "800" }}>{streak} days in a row</Text></Pressable>}</View>
        {continueReading && <ReadingPill {...continueReading} ink={ink} surface={surface} reduced={reduced} scrollY={scrollY}/>}
      </View>
      <View style={{ gap: 14, marginTop: 4 }}><Text accessibilityRole="header" style={{ ...titleStyle, color: ink }}>{title}</Text>{!!quote && !!homeQuote?.reference && <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><View style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: muted }}/><Text style={{ ...uiText.supporting, color: muted }}>{homeQuote.reference}</Text></View>}</View>
      <Pressable feedback="action" onPress={() => { haptics.soft(); setOverview(true); }} accessibilityRole="button" accessibilityLabel={`Open today's walk, ${card.title}, ${count} of 4 complete`} style={[s.featureCard, { backgroundColor: "#FFD04B", minHeight: compact ? undefined : 232, justifyContent: "space-between" }]}>
        <View style={{ flexDirection: compact ? "column-reverse" : "row", alignItems: "center", gap: 16 }}>
          <View style={{ flex: 1, alignSelf: "stretch", gap: 8 }}><Text style={{ ...dailyText.dayNumber, color: "#8E4A2280", fontVariant: ["tabular-nums"] }}>{String(card.day).padStart(2, "0")}</Text><Text style={{ ...uiText.supporting, color: "#8E4A22", marginTop: -6 }}>Today · {card.scriptureReference}</Text><Text style={{ ...dailyText.cardTitle, color: "#6A2B10", marginTop: 16 }}>{card.title}</Text></View>
          <View accessible={false} accessibilityElementsHidden style={{ width: compact ? 180 : smallPhone ? 124 : 146, height: smallPhone && !compact ? 146 : 156 }}>
            {[1, 2, 0].map((offset, i) => <View key={offset} style={[s.painting, { width: smallPhone && !compact ? 88 : 106, height: smallPhone && !compact ? 124 : 144, left: i === 0 ? 0 : i === 1 ? 37 : 22, top: i === 0 ? 20 : i === 1 ? 2 : 30, transform: [{ rotate: i === 0 ? "-12deg" : i === 1 ? "8deg" : "-4deg" }] }]}><ReaderMomentArt moment={paintings[offset]}/></View>)}
          </View>
        </View>
        {count === 4 ? <View style={s.kept}><View style={s.keptDot}><SFSymbol name="checkmark" size={13} color="#FFF"/></View><Text style={{ ...uiText.supporting, fontWeight: "800", color: "#6A2B10" }}>Today, kept</Text></View> : <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>
          {ACTIONS.map((a, i) => <View key={a.id} style={[s.token, { marginLeft: i ? -6 : 0, backgroundColor: done(a.id) ? "#A93620" : "#FFEFC2" }]}><SFSymbol name={done(a.id) ? "checkmark" : a.icon} size={16} color={done(a.id) ? "#FFF" : "#6A2B10"}/></View>)}
          <Text style={{ ...uiText.supporting, color: "#8E4A22", marginLeft: 12 }}>{count} of 4</Text>
        </View>}
      </Pressable>
      {tomorrow && <TomorrowCard onPress={() => { haptics.soft(); setTomorrowOpen(true); }} day={tomorrow.day} dark={dark} grow={!compact && !reduced} smallPhone={smallPhone} scrollY={scrollY} viewport={height}/>}
      <View style={{ flexDirection: compact || smallPhone ? "column" : "row", gap: 12 }}>
        <Pressable onPress={() => setWeekPicker(true)} accessibilityRole="button" style={[s.homeLink, { backgroundColor: surface }]}><SFSymbol name="calendar" color={ink} size={20}/><Text style={{ ...uiText.body, color: ink }}>Your daily walk</Text><SFSymbol name="chevron.right" color={muted} size={12}/></Pressable>
        <Pressable onPress={() => router.push("/check-in")} accessibilityRole="button" accessibilityLabel="How are you, really? Check in" style={[s.homeLink, { backgroundColor: surface }]}><SFSymbol name="heart" color={ink} size={20}/><Text style={{ ...uiText.body, color: ink }}>Check in</Text></Pressable>
      </View>
      {!!error && !active && <Text style={{ color: muted }}>{error}</Text>}
    </Animated.ScrollView>
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bottomInset + 36 }}><ReaderMaterialGradient colors={[`${background}00`, `${background}E6`, background]} locations={[0, .45, 1]} style={{ flex: 1 }}/></View>
    <DailyWalkOverview visible={overview} card={card} paintings={paintings} completed={{ ...saved, reading: completed }} ready={ready && !saving} onClose={dismiss} onTask={openTask}>
      <DailyExperience visible={active !== null} kind={sheetPractice} card={card} onClose={() => { if (!saving) setActive(null); }} onComplete={mark} onDismiss={() => { if (finishAfterDismiss.current) { finishAfterDismiss.current = false; setOverview(false); } }} onFinish={dismiss} onContinue={() => { if (active === "prayer") setActive("reading"); else continueFlow(); }}/>
    </DailyWalkOverview>
  {tomorrow && <TomorrowLetter visible={tomorrowOpen} day={tomorrow.day} todayCount={count} onClose={() => setTomorrowOpen(false)}
    onOpenToday={() => { const action = () => { setOverview(true); }; if (Platform.OS === "ios") pendingHistory.current = action; setTomorrowOpen(false); if (Platform.OS !== "ios") action(); }}
    onDismiss={() => { const action = pendingHistory.current; pendingHistory.current = null; action?.(); }}/>}
  <YouSheet visible={youOpen} onClose={() => setYouOpen(false)}/>
  <Modal visible={weekPicker} onDismiss={() => { const action = pendingHistory.current; pendingHistory.current = null; action?.(); }} animationType={reduced ? "fade" : "slide"} presentationStyle="pageSheet" onRequestClose={dismiss}><ReaderMaterialGradient colors={dark ? ["#372B22", "#1D1916"] : ["#EBD8BE", "#FFF9EE"]} style={{ flex: 1 }}><View style={{ alignItems: "flex-end", padding: 20 }}><CloseButton onPress={dismiss} accessibilityRole="button" accessibilityLabel="Close" style={s.close} color={ink} /></View><ScrollView contentContainerStyle={{ padding: 28, paddingBottom: 60, gap: 24 }}><Text style={{ ...uiText.screenTitle, color: ink }}>Your weeks</Text>{Array.from({ length: currentWeek }, (_, i) => i + 1).map(w => <Pressable key={w} onPress={() => { setWeek(w); }} style={[s.row, { borderTopColor: border }]}><Text style={{ color: ink, fontSize: 18, flex: 1 }}>Week {w}</Text>{week === w && <SFSymbol name="checkmark" color={SUCCESS_GREEN} size={18} />}</Pressable>)}<Text style={{ ...uiText.sectionTitle, color: ink }}>Week {week}</Text>{days.map(day => <Pressable key={day.day} disabled={day.day > card.day} accessibilityRole="button" onPress={() => { const action = () => { if (day.day === card.day) { setOverview(true); } else onRead(toHomeCard(day)); }; if (Platform.OS === "ios") pendingHistory.current = action; setWeekPicker(false); if (Platform.OS !== "ios") action(); }} style={[s.row, { marginHorizontal: 0, borderTopColor: border }]}><Text style={{ ...uiText.supporting, color: muted }}>{day.day}</Text><Text style={{ ...uiText.body, color: ink, flex: 1 }}>{day.day > card.day ? "A letter waiting for you" : day.title}</Text><SFSymbol name={day.day > card.day ? "lock" : "chevron.right"} color={muted} size={16}/></Pressable>)}</ScrollView></ReaderMaterialGradient></Modal>
  </View>;
}
const TOMORROW_PEEK = 92, TOMORROW_FULL = 240;
const tomorrowGrowDistance = (viewport: number) => Math.min(140, viewport * .18);
/**
 * Tomorrow's locked letter. It rests as a slim row under today's card
 * and unfolds into the full card over the first stretch of scrolling,
 * so the eye lands on today first and tomorrow arrives second.
 */
function TomorrowCard({ onPress, day, dark, grow, smallPhone, scrollY, viewport }: { onPress: () => void; day: number; dark: boolean; grow: boolean; smallPhone: boolean; scrollY: SharedValue<number>; viewport: number }) {
  // Driven by scroll distance, not screen position, so every phone rests on the slim row.
  // Plain functions can't be called on the UI thread, so the distance is computed here and captured as a number.
  const distance = tomorrowGrowDistance(viewport);
  const progress = (y: number) => {
    "worklet";
    return interpolate(y, [0, distance], [0, 1], Extrapolation.CLAMP);
  };
  const card = useAnimatedStyle(() => {
    const p = progress(scrollY.value);
    return { height: TOMORROW_PEEK + (TOMORROW_FULL - TOMORROW_PEEK) * p, marginHorizontal: 10 * (1 - p) };
  });
  const peek = useAnimatedStyle(() => {
    const p = progress(scrollY.value);
    return { opacity: interpolate(p, [.3, .42], [1, 0], Extrapolation.CLAMP), transform: [{ translateY: -6 * p }] };
  });
  const full = useAnimatedStyle(() => {
    const p = progress(scrollY.value);
    return { opacity: interpolate(p, [.42, .56], [0, 1], Extrapolation.CLAMP), transform: [{ translateY: 10 * (1 - p) }] };
  });
  const background = dark ? "#4A2C20" : "#3A2219";
  const fullContent = <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}>
    <View style={{ flex: 1, alignSelf: "stretch", gap: 8 }}><Text style={{ ...dailyText.dayNumber, color: "#FFF1E466", fontVariant: ["tabular-nums"] }}>{String(day).padStart(2, "0")}</Text><Text style={{ ...uiText.supporting, color: "#D8BDA5", marginTop: -6 }}>Tomorrow</Text><Text style={{ ...dailyText.cardTitle, color: "#FFF1E4", marginTop: 16 }}>A letter waiting for you</Text><View style={s.lockChip}><SFSymbol name="lock.fill" size={13} color="#D8BDA5"/><Text style={{ ...uiText.supporting, color: "#D8BDA5" }}>Opens tomorrow</Text></View></View>
    <SealedEnvelope width={smallPhone ? 104 : 120}/>
  </View>;
  const border = { borderWidth: dark ? StyleSheet.hairlineWidth : 0, borderColor: "#FFF1E42E" };
  const a11y = { accessibilityRole: "button" as const, accessibilityLabel: "Tomorrow. A letter waiting for you. Opens tomorrow." };
  if (!grow) return <Pressable feedback="action" onPress={onPress} {...a11y} style={[s.featureCard, border, { backgroundColor: background, marginTop: -12 }]}>{fullContent}</Pressable>;
  return <Pressable feedback="action" onPress={onPress} {...a11y} style={{ marginTop: -12 }}><Animated.View style={[s.featureCard, border, { backgroundColor: background, padding: 0 }, card]}>
    <Animated.View style={[s.tomorrowPeek, peek]}>
      <SealedEnvelope width={52}/>
      <View style={{ flex: 1 }}><Text style={{ ...uiText.supporting, fontSize: 13, lineHeight: 17, color: "#D8BDA5" }}>{String(day).padStart(2, "0")} · Tomorrow</Text><Text numberOfLines={1} style={{ ...uiText.body, fontWeight: "800", color: "#FFF1E4" }}>A letter waiting for you</Text></View>
      <SFSymbol name="lock.fill" size={15} color="#D8BDA5"/>
    </Animated.View>
    <Animated.View style={[s.tomorrowFull, full]}>{fullContent}</Animated.View>
  </Animated.View></Pressable>;
}
/** "Genesis 4" with the book's initial inside a slowly breathing accent ring. */
function ReadingPill({ label, title, accessibilityLabel, onPress, ink, surface, reduced, scrollY }: { label: string; title?: string; bookId?: string; accessibilityLabel: string; onPress: () => void; ink: string; surface: string; reduced: boolean; scrollY: SharedValue<number> }) {
  const text = title ?? label;
  const breath = useSharedValue(0);
  const [labelWidth, setLabelWidth] = useState(0);
  const width = useSharedValue(0);
  useEffect(() => {
    if (reduced) { breath.value = 0; return; }
    breath.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }), -1, true);
    return () => cancelAnimation(breath);
  }, [reduced, breath]);
  const ring = useAnimatedStyle(() => ({ opacity: 1 - breath.value * .55, transform: [{ scale: 1 + breath.value * .08 }] }));
  // Scrolls with the page, folding to just the ring as it leaves.
  const pill = useAnimatedStyle(() => {
    const p = interpolate(scrollY.value, [8, 72], [0, 1], Extrapolation.CLAMP);
    return { paddingRight: 16 - 11 * p };
  });
  const labelBox = useAnimatedStyle(() => {
    const p = interpolate(scrollY.value, [8, 72], [0, 1], Extrapolation.CLAMP);
    return width.value > 0 ? { width: (width.value + 10) * (1 - p), opacity: interpolate(p, [0, .6], [1, 0], Extrapolation.CLAMP) } : {};
  });
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
    <Animated.View style={[s.pill, { backgroundColor: surface, gap: 0 }, pill]}>
      <View style={{ width: 38, height: 38, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={[s.pillRing, ring]}/>
        <View style={s.pillCover}><TiltedBook/></View>
      </View>
      <Animated.View style={[{ overflow: "hidden", alignItems: "flex-end" }, labelBox]}>
        <Text numberOfLines={1} style={{ ...uiText.body, fontWeight: "800", color: ink, width: labelWidth || undefined }}>{text}</Text>
      </Animated.View>
    </Animated.View>
    {/* Measures the label's natural width once, so the fold animates to an exact size. */}
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: "absolute", left: 0, top: 0, width: 400, flexDirection: "row", opacity: 0 }}>
      <Text onLayout={e => { const w = Math.min(160, Math.ceil(e.nativeEvent.layout.width)); setLabelWidth(w); width.value = w; }} style={{ ...uiText.body, fontWeight: "800" }}>{text}</Text>
    </View>
  </Pressable>;
}
const s = StyleSheet.create({
  avatar: { width: 48, height: 48, borderRadius: 16, borderCurve: "continuous", alignItems: "center", justifyContent: "center" },
  featureCard: { padding: 22, borderRadius: 28, borderCurve: "continuous", overflow: "hidden" },
  painting: { position: "absolute", borderRadius: 12, borderWidth: 3, borderColor: "#FFF9EE", overflow: "hidden", boxShadow: "0 6px 12px #00000026" },
  token: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#FFD04B", alignItems: "center", justifyContent: "center" },
  kept: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 8, marginTop: 12, paddingLeft: 6, paddingRight: 14, height: 36, borderRadius: 18, backgroundColor: "#FFF4CC" },
  keptDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#E2391F" },
  tomorrowPeek: { position: "absolute", top: 0, left: 0, right: 0, height: TOMORROW_PEEK, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 14 },
  tomorrowFull: { position: "absolute", top: 0, left: 0, right: 0, height: TOMORROW_FULL, padding: 22, justifyContent: "center" },
  lockChip: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 6, marginTop: 12, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: "#FFFFFF12" },
  pillCover: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#FFE7A8" },
  pillRing: { position: "absolute", width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: "#FF4326" },
  homeLink: { flex: 1, minHeight: 56, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, top: { flexDirection: "row", alignItems: "center", gap: 10 },
  pill: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 6, paddingRight: 16, paddingVertical: 5, borderRadius: 26, boxShadow: "0 1px 2px #502D0A14, 0 10px 20px -12px #502D0A59" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, marginHorizontal: 18, borderTopWidth: .5, minHeight: 68 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
