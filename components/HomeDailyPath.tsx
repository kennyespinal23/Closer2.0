import type { HomeQuote } from "@/lib/homeQuotes";
import { type CardOrigin, DailyWalkOverview } from "./DailyWalkOverview";
import { type DailyStep, useDailyPractice } from '@/lib/dailyPractice';
import { dailyStepsFor } from '@/lib/dailySteps';
import { contentLayout } from "@/lib/contentStyles";
import { dailyText, uiText } from "@/lib/typography";

import { buttonStyles } from "@/lib/buttonStyles";
import { CloseButton } from "@/components/CloseButton";
import { useTabContentFade } from '@/lib/useTabContentFade';
import { FeedbackPressable as Pressable } from "./FeedbackPressable";


import { SUCCESS_GREEN } from "./SuccessFeedback";
import { DailyExperience } from "./DailyExperience";
import { useEffect, useMemo, useRef, useState } from "react";
import { Modal, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/CloserText";
import Animated, { Easing, Extrapolation, type SharedValue, cancelAnimation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "@/state/onboarding";
import { useProgress } from "@/state/progress";
import { useResolvedScheme } from "@/state/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { MOMENTS, devotionalLabel, resolveSermonTypeForMoment, toHomeCard } from "@/lib/moments";
import { TODAY_FULL, TODAY_SLIM, TodayCard } from "./TodayCard";
import { FoldStack, type FoldItem } from "./FoldStack";
import type { FloatingScriptureCard } from "@/constants/homePrototype";
import { BIBLE_MOMENTS } from "@/constants/bibleMoments";
import { ReaderMomentArt } from "./ReaderMomentArt";
import { SealedEnvelope, TomorrowLetter } from "./TomorrowLetter";
import { YouSheet } from "./YouSheet";
import { DAY_AFTER_FULL, DAY_AFTER_PEEK, DayAfterCard, DayAfterSheet } from "./StillWriting";
import { APP_CANVAS, SkyGradient } from "./HomeSkyGradient";
import { TiltedBook } from "./TiltedBook";
import { NIGHT_FULL, NIGHT_SLIM, NightPrayerCard, NightPrayerDoneCard, NightPrayerFlow, REST_FULL, REST_SLIM } from "./NightPrayer";
import { isNightPrayerDue, tonightsNightPrayer, useNightPrayer } from "@/lib/nightPrayer";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { SFSymbol, type SFSymbolName } from "./Symbol";
import * as haptics from "@/lib/haptics";
import { focusAmount, useFocusMoment } from "@/lib/homeFocus";

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
  // Where Today's card was when tapped; the walk opens out of it. Other ways in (Tomorrow's letter, the week list) leave it null.
  const [overviewOrigin, setOverviewOrigin] = useState<CardOrigin | null>(null);
  const night = useNightPrayer(), [nightOpen, setNightOpen] = useState(false), [clock, setClock] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setClock(Date.now()), 60_000); return () => clearInterval(t); }, []);
  const nightDue = night.hydrated && isNightPrayerDue(night, new Date(clock));
  const nightDone = night.hydrated ? tonightsNightPrayer(night, new Date(clock)) : null;
  // Tapping the night prayer notification lands here with ?night=1.
  const { night: nightParam } = useLocalSearchParams<{ night?: string }>();
  useEffect(() => {
    if (nightParam !== "1") return;
    setNightOpen(true);
    router.setParams({ night: undefined });
  }, [nightParam]); // eslint-disable-line react-hooks/exhaustive-deps
  const finishAfterDismiss = useRef(false);
  const pendingHistory = useRef<(() => void) | null>(null);
  const router = useRouter(), insets = useSafeAreaInsets(), dark = useResolvedScheme() === "dark", reduced = useReducedMotion();
  const tabContentStyle = useTabContentFade(reduced);
  const scrollY = useSharedValue(0);
  // The cards take turns: whichever one the page rests on is open, the rest
  // fold to slim rows. Today's paintings drift out and shrink away, the day
  // number and date close up, and the title with its steps stays.
  const nightShown = nightDue || !!nightDone;
  const tomorrowMoment = MOMENTS.find(m => m.day === card.day + 1);
  // Home holds three cards at most: at night the prayer takes the third place.
  const dayAfterMoment = nightShown ? undefined : MOMENTS.find(m => m.day === card.day + 2);
  const todayStop = nightShown ? 1 : 0, tomorrowStop = todayStop + 1, dayAfterStop = tomorrowStop + 1;
  const lastStop = dayAfterMoment ? dayAfterStop : tomorrowMoment ? tomorrowStop : todayStop;
  const foldOn = !compact && !reduced && lastStop > 0;
  const foldDistance = tomorrowGrowDistance(height);
  // Where the page rests, in stops, or -1 while it moves: each card plays its one beat when it settles.
  const settled = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: e => { scrollY.value = e.contentOffset.y; },
    onBeginDrag: () => { settled.value = -1; },
    onEndDrag: e => { settled.value = Math.max(0, Math.min(lastStop, Math.round(e.contentOffset.y / foldDistance))); },
    onMomentumBegin: () => { settled.value = -1; },
    onMomentumEnd: e => { settled.value = Math.max(0, Math.min(lastStop, Math.round(e.contentOffset.y / foldDistance))); },
  }, [lastStop, foldDistance]);
  const categoryId = resolveSermonTypeForMoment({ day: card.day }).id;
  const { answers } = useOnboarding(), { sermonCompletions, completeDailyTasks, hydrated } = useProgress();
  const [active, setActive] = useState<DailyStep | null>(null), [weekPicker, setWeekPicker] = useState(false), [tomorrowOpen, setTomorrowOpen] = useState(false), [youOpen, setYouOpen] = useState(false), [dayAfterOpen, setDayAfterOpen] = useState(false);
  const lastPractice = useRef<DailyStep>("prayer");
  if (active) lastPractice.current = active;
  const sheetPractice = active ?? lastPractice.current;
  const { saved, ready, error, save, key: storageKey } = useDailyPractice(card.id);
  const [saving, setSaving] = useState(false);
  const currentWeek = Math.ceil(card.day / 7), [week, setWeek] = useState(currentWeek);
  useEffect(() => { setWeek(currentWeek); }, [currentWeek]);
  const ink = dark ? "#F7F0E6" : "#30241D", muted = dark ? "#BBAA99" : "#7C6B5B", surface = dark ? "#302820" : "#FFFAF0", border = dark ? "#FFFFFF13" : "#6B49251A";
  const done = (id: string) => id === "reading" ? completed : !!saved[id as Practice];
  // Today's steps, in order: the experience first, then what this kind of day holds.
  const steps = useMemo(() => dailyStepsFor(card.day), [card.day]);
  const todaysActions = steps.map(id => ACTIONS.find(a => a.id === id)!);
  const count = todaysActions.filter(a => done(a.id)).length, total = todaysActions.length, next = todaysActions.find(a => !done(a.id))?.id;
  useEffect(() => {
    if (ready && hydrated && count === total) completeDailyTasks(card.day, saved);
  }, [ready, storageKey, hydrated, count, total, card.day, saved, completeDailyTasks]);

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
  const tomorrow = tomorrowMoment, dayAfter = dayAfterMoment;
  const dayAfterName = new Date(Date.now() + 2 * 86_400_000).toLocaleDateString("en-US", { weekday: "long" });
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
    const index = steps.indexOf(active);
    const remaining = [...steps.slice(index + 1), ...steps.slice(0, index)];
    setActive(remaining.find(step => !done(step)) ?? null);
  };
  const dismiss = () => { if (!saving) { setWeekPicker(false); if (active) { finishAfterDismiss.current = true; setTimeout(() => { if (finishAfterDismiss.current) { finishAfterDismiss.current = false; setOverview(false); } }, 1000); /* iOS sometimes skips the modal's onDismiss */ setActive(null); } else setOverview(false); } };
  // Built once, placed either in the folding stack or, with Reduce Motion or large text, in plain order.
  const nightCard = nightDue && <NightPrayerCard onPress={() => setNightOpen(true)} scrollY={foldOn ? scrollY : undefined} settled={settled} last={lastStop} distance={foldDistance}/>;
  const restCard = nightDone && <NightPrayerDoneCard entry={nightDone} onPress={() => { haptics.soft(); router.push("/prayers" as never); }} scrollY={foldOn ? scrollY : undefined} last={lastStop} distance={foldDistance}/>;
  const todayCard = <TodayCard categoryId={categoryId} day={card.day} label={devotionalLabel({ day: card.day })} reference={card.scriptureReference} title={card.title} scriptureText={card.scriptureText}
        steps={todaysActions.map(a => ({ id: a.id, icon: a.icon, done: done(a.id) }))} compact={compact} onPress={origin => { haptics.soft(); setOverviewOrigin(origin ?? null); setOverview(true); }}
        accessibilityLabel={`Open today's walk, ${devotionalLabel({ day: card.day })}, ${card.title}, ${count} of ${total} complete`}
        fold={foldOn ? { scrollY, settled, stop: todayStop, last: lastStop, distance: foldDistance } : undefined}/>;
  const tomorrowCard = tomorrow && <TomorrowCard onPress={() => { haptics.soft(); setTomorrowOpen(true); }} day={tomorrow.day} dark={dark} grow={foldOn} smallPhone={smallPhone} scrollY={scrollY} settled={settled} distance={foldDistance} stop={tomorrowStop} last={lastStop}/>;
  const dayAfterCard = dayAfter && <DayAfterCard day={dayAfter.day} weekday={dayAfterName} dark={dark} grow={foldOn} scrollY={scrollY} settled={settled}
        distance={foldDistance} stop={dayAfterStop} last={lastStop} onPress={() => { haptics.soft(); setDayAfterOpen(true); }}/>;
  const links = <View style={{ flexDirection: compact || smallPhone ? "column" : "row", gap: 12 }}>
        <Pressable onPress={() => setWeekPicker(true)} accessibilityRole="button" style={[s.homeLink, { backgroundColor: surface }]}><SFSymbol name="calendar" color={ink} size={20}/><Text style={{ ...uiText.body, color: ink }}>Your daily walk</Text><SFSymbol name="chevron.right" color={muted} size={12}/></Pressable>
        <Pressable onPress={() => router.push("/check-in")} accessibilityRole="button" accessibilityLabel="How are you, really? Check in" style={[s.homeLink, { backgroundColor: surface }]}><SFSymbol name="heart" color={ink} size={20}/><Text style={{ ...uiText.body, color: ink }}>Check in</Text></Pressable>
      </View>;
  const linksHeight = compact || smallPhone ? 124 : 56;
  return <View style={{ flex: 1, backgroundColor: background }}>
    {dark ? <ReaderMaterialGradient colors={["#4A3420", "#211D19"]} style={{ position: "absolute", top: 0, left: 0, right: 0, height: 420 }} /> : <SkyGradient />}
    <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} snapToOffsets={foldOn ? Array.from({ length: lastStop + 1 }, (_, i) => i * foldDistance) : undefined} snapToEnd={false} style={tabContentStyle} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + contentLayout.screenTop, paddingHorizontal: 20, paddingBottom: bottomInset + 28, gap: 24,
      // Always leave enough scroll for the page to rest on the last card's stop.
      minHeight: foldOn ? height + lastStop * foldDistance : undefined }}>
      <View style={s.top}>
        <Pressable onPress={() => { haptics.soft(); setYouOpen(true); }} accessibilityRole="button" accessibilityLabel="You: profile and settings" style={[s.avatar, { backgroundColor: "#FF4326" }]}>{firstName ? <Text style={{ ...uiText.sectionTitle, color: "#FFF" }}>{firstName[0].toUpperCase()}</Text> : <SFSymbol name="person.fill" color="#FFF" size={22}/>}</Pressable>
        <View style={{ flex: 1, gap: 2 }}>{!!firstName && <Text style={{ ...uiText.body, fontWeight: "800", color: ink }}>{firstName}</Text>}{streak > 1 && <Pressable onPress={onStreak} accessibilityRole="button" accessibilityLabel={`${streak} day streak`} hitSlop={{ top: 10, bottom: 10 }} style={{ alignSelf: "flex-start" }}><Text style={{ ...uiText.supporting, color: firstName ? muted : ink, fontWeight: firstName ? "500" : "800" }}>{streak} days in a row</Text></Pressable>}</View>
        {continueReading && <ReadingPill {...continueReading} ink={ink} surface={surface} reduced={reduced} scrollY={scrollY}/>}
      </View>
      <View style={{ gap: 14, marginTop: 4 }}><Text accessibilityRole="header" style={{ ...titleStyle, color: ink }}>{title}</Text>{!!quote && !!homeQuote?.reference && <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}><View style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: muted }}/><Text style={{ ...uiText.supporting, color: muted }}>{homeQuote.reference}</Text></View>}</View>
      {foldOn ? <FoldStack scrollY={scrollY} distance={foldDistance} last={lastStop} items={([
        nightDue && { key: "night", stop: 0, slim: NIGHT_SLIM, open: NIGHT_FULL, gap: 24, radius: 32, node: nightCard },
        nightDone && { key: "rest", stop: 0, slim: REST_SLIM, open: REST_FULL, gap: 24, radius: 32, node: restCard },
        { key: "today", stop: todayStop, slim: TODAY_SLIM, open: TODAY_FULL, gap: tomorrow ? 12 : 24, radius: 28, node: todayCard },
        tomorrow && { key: "tomorrow", stop: tomorrowStop, slim: TOMORROW_PEEK, open: TOMORROW_FULL, gap: dayAfter ? 12 : 24, radius: 28, node: tomorrowCard },
        dayAfter && { key: "dayAfter", stop: dayAfterStop, slim: DAY_AFTER_PEEK, open: DAY_AFTER_FULL, gap: 24, radius: 24, node: dayAfterCard },
        { key: "links", stop: null, slim: linksHeight, open: linksHeight, gap: 0, radius: 0, node: links },
      ] as (FoldItem | false | null | undefined)[]).filter((x): x is FoldItem => !!x)}/> : <>
        {nightCard}{restCard}{todayCard}{tomorrowCard}{dayAfterCard}{links}
      </>}
      {!!error && !active && <Text style={{ color: muted }}>{error}</Text>}
    </Animated.ScrollView>
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: bottomInset + 36 }}><ReaderMaterialGradient colors={[`${background}00`, `${background}E6`, background]} locations={[0, .45, 1]} style={{ flex: 1 }}/></View>
    <DailyWalkOverview visible={overview} origin={overviewOrigin} card={card} paintings={paintings} completed={{ ...saved, reading: completed }} ready={ready && !saving} onClose={dismiss} onTask={openTask}>
      <DailyExperience visible={active !== null} kind={sheetPractice} card={card} onClose={() => { if (!saving) setActive(null); }} onComplete={mark} onDismiss={() => { if (finishAfterDismiss.current) { finishAfterDismiss.current = false; setOverview(false); } }} onFinish={dismiss} onContinue={continueFlow}/>
    </DailyWalkOverview>
  {tomorrow && <TomorrowLetter visible={tomorrowOpen} day={tomorrow.day} todayCount={count} todayTotal={total} onClose={() => setTomorrowOpen(false)}
    onOpenToday={() => { const action = () => { setOverviewOrigin(null); setOverview(true); }; if (Platform.OS === "ios") pendingHistory.current = action; setTomorrowOpen(false); if (Platform.OS !== "ios") action(); }}
    onDismiss={() => { const action = pendingHistory.current; pendingHistory.current = null; action?.(); }}/>}
  <YouSheet visible={youOpen} onClose={() => setYouOpen(false)}/>
  <NightPrayerFlow visible={nightOpen} onClose={() => setNightOpen(false)}/>
  {dayAfter && <DayAfterSheet visible={dayAfterOpen} day={dayAfter.day} weekday={dayAfterName} onClose={() => setDayAfterOpen(false)}/>}
  <Modal visible={weekPicker} onDismiss={() => { const action = pendingHistory.current; pendingHistory.current = null; action?.(); }} animationType={reduced ? "fade" : "slide"} presentationStyle="pageSheet" onRequestClose={dismiss}><ReaderMaterialGradient colors={dark ? ["#372B22", "#1D1916"] : ["#EBD8BE", "#FFF9EE"]} style={{ flex: 1 }}><View style={{ alignItems: "flex-end", padding: 20 }}><CloseButton onPress={dismiss} accessibilityRole="button" accessibilityLabel="Close" style={s.close} color={ink} /></View><ScrollView contentContainerStyle={{ padding: 28, paddingBottom: 60, gap: 24 }}><Text style={{ ...uiText.screenTitle, color: ink }}>Your weeks</Text>{Array.from({ length: currentWeek }, (_, i) => i + 1).map(w => <Pressable key={w} onPress={() => { setWeek(w); }} style={[s.row, { borderTopColor: border }]}><Text style={{ color: ink, fontSize: 18, flex: 1 }}>Week {w}</Text>{week === w && <SFSymbol name="checkmark" color={SUCCESS_GREEN} size={18} />}</Pressable>)}<Text style={{ ...uiText.sectionTitle, color: ink }}>Week {week}</Text>{days.map(day => <Pressable key={day.day} disabled={day.day > card.day} accessibilityRole="button" onPress={() => { const action = () => { if (day.day === card.day) { setOverviewOrigin(null); setOverview(true); } else onRead(toHomeCard(day)); }; if (Platform.OS === "ios") pendingHistory.current = action; setWeekPicker(false); if (Platform.OS !== "ios") action(); }} style={[s.row, { marginHorizontal: 0, borderTopColor: border }]}><Text style={{ ...uiText.supporting, color: muted }}>{day.day}</Text><Text style={{ ...uiText.body, color: ink, flex: 1 }}>{day.day > card.day ? "A letter waiting for you" : day.title}</Text><SFSymbol name={day.day > card.day ? "lock" : "chevron.right"} color={muted} size={16}/></Pressable>)}</ScrollView></ReaderMaterialGradient></Modal>
  </View>;
}
const TOMORROW_PEEK = 92, TOMORROW_FULL = 240;
const tomorrowGrowDistance = (viewport: number) => Math.min(140, viewport * .18);
/**
 * Tomorrow's locked letter. It rests as a slim row with the envelope tucked
 * on the right. At its stop the letter comes toward you: it grows in place,
 * tilts and lifts, and nothing slides across the words. Settled, a band of
 * light crosses the seal and the tilt comes to rest. It never opens here.
 */
function TomorrowCard({ onPress, day, dark, grow, smallPhone, scrollY, settled, distance, stop, last }: { onPress: () => void; day: number; dark: boolean; grow: boolean; smallPhone: boolean; scrollY: SharedValue<number>; settled: SharedValue<number>; distance: number; stop: number; last: number }) {
  // Driven by scroll distance, not screen position, so every phone rests on the slim row.
  const e = useDerivedValue(() => focusAmount(scrollY.value, stop, last, distance));
  const m = useFocusMoment(settled, stop, 450);
  // The stack folds the card (FoldStack); inside, the letter's travel and lift are transforms.

  const drawer = useAnimatedStyle(() => ({ opacity: .2 * (1 - e.value) }));
  const peek = useAnimatedStyle(() => ({ opacity: interpolate(e.value, [.15, .4], [1, 0], Extrapolation.CLAMP) }));
  const full = useAnimatedStyle(() => ({ opacity: interpolate(e.value, [.6, .9], [0, 1], Extrapolation.CLAMP) }));
  const letter = useAnimatedStyle(() => ({
    transformOrigin: "right top",
    transform: [{ translateX: 2 * e.value }, { translateY: 42 * e.value }, { scale: .373 + .627 * e.value }, { rotate: `${7 - 10 * e.value + 3 * m.value * e.value}deg` }],
  }));
  const glint = useAnimatedStyle(() => ({ opacity: e.value * Math.sin(m.value * Math.PI), transform: [{ translateX: -20 + 50 * m.value }, { rotate: "20deg" }] }));
  const background = dark ? "#4A2C20" : "#3A2219";
  const fullText = <View style={{ gap: 8 }}><Text style={{ ...dailyText.dayNumber, color: "#FFF1E466", fontVariant: ["tabular-nums"] }}>{String(day).padStart(2, "0")}</Text><Text style={{ ...uiText.supporting, color: "#D8BDA5", marginTop: -6 }}>Tomorrow</Text><Text style={{ ...dailyText.cardTitle, color: "#FFF1E4", marginTop: 16 }}>A letter waiting for you</Text><View style={s.lockChip}><SFSymbol name="lock.fill" size={13} color="#D8BDA5"/><Text style={{ ...uiText.supporting, color: "#D8BDA5" }}>Opens tomorrow</Text></View></View>;
  const border = { borderWidth: dark ? StyleSheet.hairlineWidth : 0, borderColor: "#FFF1E42E" };
  const a11y = { accessibilityRole: "button" as const, accessibilityLabel: "Tomorrow. A letter waiting for you. Opens tomorrow." };
  if (!grow) return <Pressable feedback="action" onPress={onPress} {...a11y} style={[s.featureCard, border, { backgroundColor: background, marginTop: -12 }]}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 20 }}><View style={{ flex: 1 }}>{fullText}</View><SealedEnvelope width={smallPhone ? 104 : 120}/></View>
  </Pressable>;
  return <Pressable feedback="action" onPress={onPress} {...a11y}><View style={[s.featureCard, border, { backgroundColor: background, padding: 0, height: TOMORROW_FULL }]}>
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }, drawer]}/>
    <Animated.View style={[s.tomorrowPeek, peek]}>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}><SFSymbol name="lock.fill" size={11} color="#D8BDA5"/><Text style={{ ...uiText.supporting, fontSize: 13, lineHeight: 17, color: "#D8BDA5" }}>{String(day).padStart(2, "0")} · Tomorrow</Text></View>
        <Text numberOfLines={1} style={{ ...uiText.body, fontWeight: "800", color: "#FFF1E4" }}>A letter waiting for you</Text>
      </View>
    </Animated.View>
    <Animated.View style={[s.tomorrowFull, full]}>{fullText}</Animated.View>
    <Animated.View pointerEvents="none" style={[{ position: "absolute", right: 24, top: 26, width: 150, borderRadius: 10, boxShadow: "0 12px 16px -8px #00000080" }, letter]}>
      <SealedEnvelope width={150} tilt={0} shadow={false}/>
      {/* The seal sits at (75, 58) of the 150-wide envelope. */}
      <View style={{ position: "absolute", left: 60, top: 43, width: 30, height: 30, borderRadius: 15, overflow: "hidden" }}><Animated.View style={[{ position: "absolute", top: -8, bottom: -8, left: 8, width: 10, backgroundColor: "#FFFFFFA6" }, glint]}/></View>
    </Animated.View>
  </View></Pressable>;
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
  token: { width: 36, height: 36, borderRadius: 18, borderWidth: 2, borderColor: "#FFB83A", alignItems: "center", justifyContent: "center" },
  kept: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 8, marginTop: 12, paddingLeft: 6, paddingRight: 14, height: 36, borderRadius: 18, backgroundColor: "#FFF4CC" },
  keptDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#E2391F" },
  tomorrowPeek: { position: "absolute", top: 0, left: 22, right: 96, height: TOMORROW_PEEK, flexDirection: "row", alignItems: "center" },
  tomorrowFull: { position: "absolute", top: 24, left: 22, width: 170 },
  lockChip: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 6, marginTop: 12, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: "#FFFFFF12" },
  pillCover: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#FFE7A8" },
  pillRing: { position: "absolute", width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: "#FF4326" },
  homeLink: { flex: 1, minHeight: 56, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, top: { flexDirection: "row", alignItems: "center", gap: 10 },
  pill: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, paddingLeft: 6, paddingRight: 16, paddingVertical: 5, borderRadius: 26, boxShadow: "0 1px 2px #502D0A14, 0 10px 20px -12px #502D0A59" },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, marginHorizontal: 18, borderTopWidth: .5, minHeight: 68 },
  close: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
