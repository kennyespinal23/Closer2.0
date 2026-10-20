import { setStatusBarStyle } from "expo-status-bar";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
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
import { type DeckItem, deckPalette, mix } from "./HomeDeck";
import { SCENE_COLORS } from "@/constants/sceneColors";
import { tone } from "./community/togetherKit";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { findAvatar } from "@/constants/avatars";
import { getBibleMomentArt } from "@/constants/bibleMomentArt";
import { getMilestoneBadge } from "@/lib/milestoneBadges";
import { MILESTONES } from "@/lib/milestones";
import { useCheckIns } from "@/state/checkIns";
import { findMood } from "@/constants/moods";
import { formatNightTime } from "@/lib/nightPrayer";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import { bookIdFromReference, syncWidgets } from "@/lib/widgetSync";
import { paintedCover } from "@/constants/paintedCovers";

const NIGHT_SKY = require("@/assets/backdrops/night-sky.jpg");
const NEVER_LEAVE = require("@/assets/bible-moments/never-leave.jpg");

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
  // ── The deck: past days, the verse, today's steps, night prayer, tomorrow. One card in front.
  const pal = useMemo(() => deckPalette(categoryId), [categoryId]);
  const { log: checkIns } = useCheckIns();
  const todayISO = new Date(clock).toLocaleDateString("en-CA");
  const checkedIn = [...checkIns].reverse().find(c => c.dateISO === todayISO), mood = checkedIn ? findMood(checkedIn.moodId) : null;
  const startStep = (id: DailyStep) => { haptics.soft(); setOverviewOrigin(null); setOverview(true); setTimeout(() => openTask(id as Practice | "reading"), reduced ? 150 : 520); };
  const STEP_COPY: Record<string, { title: string; sentence: string; chip: string; icon: SFSymbolName; verb: string }> = {
    reading: { title: card.title, sentence: card.scriptureReference, chip: "Read", icon: "book", verb: "Read" },
    prayer: { title: "Pray it back", sentence: "Tell God the story you just read, in your own words.", chip: "Pray", icon: "hands.sparkles", verb: "Pray it back" },
    quiz: { title: "Quick check", sentence: "A few questions on today’s story.", chip: "Quick check", icon: "questionmark.bubble", verb: "Start the check" },
    action: { title: "One small step", sentence: "Carry today’s word into one moment.", chip: "Small step", icon: "sun.max", verb: "Take the step" },
  };
  const artFor = (m: { id: string }) => getBibleMomentArt(m.id) ?? null;
  const tomorrowArt = tomorrow ? art(tomorrow.reference) : null;
  const items: (DeckItem & { act: { label: string; run: () => void } })[] = [];
  if (card.day > 1) items.push({ key: "past", art: artFor(paintings[2]!), tint: SCENE_COLORS[paintings[2]!.id], blurred: true, label: "Your weeks", title: "Look back", sentence: `Days 1 to ${card.day - 1}`, done: true, chip: { icon: "calendar", label: `${card.day - 1} days` },
    accessibilityLabel: "Look back at your weeks", onPress: () => setWeekPicker(true), act: { label: "See your weeks", run: () => setWeekPicker(true) } });
  const firstOpen = steps.find(id => !done(id));
  if (quote) items.push({ key: "verse", art: null, done: true, label: "For today", title: homeQuote?.reference ?? "For today", sentence: "Carry it with you.",
    over: <View style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center", padding: 18 }]}><Text numberOfLines={6} style={{ ...uiText.body, fontSize: 18, lineHeight: 24, fontWeight: "700", color: pal.theme.light ? "#FFFFFF" : pal.theme.label, textAlign: "center" }}>“{quote}”</Text></View>,
    accessibilityLabel: `For today. ${quote}. ${homeQuote?.reference ?? ""}`, onPress: () => { setOverviewOrigin(null); setOverview(true); },
    act: firstOpen ? { label: STEP_COPY[firstOpen]!.verb, run: () => startStep(firstOpen) } : { label: "Open today’s walk", run: () => { setOverviewOrigin(null); setOverview(true); } } });
  steps.forEach((id, i) => { const c = STEP_COPY[id]!, isDone = done(id);
    items.push({ key: id, art: artFor(paintings[i % paintings.length]!), tint: SCENE_COLORS[paintings[i % paintings.length]!.id], chip: { icon: c.icon, label: c.chip }, label: `Step ${i + 1} of ${steps.length}`, title: c.title, sentence: c.sentence, done: isDone, stamp: isDone ? "KEPT" : undefined,
      accessibilityLabel: `Step ${i + 1} of ${steps.length}. ${c.title}.${isDone ? " Done." : ""}`, onPress: () => { setOverviewOrigin(null); setOverview(true); },
      act: { label: isDone ? "Open again" : c.verb, run: () => startStep(id) } }); });
  if (night.enabled || nightDue || nightDone) items.push({ key: "night", art: NIGHT_SKY, tint: SCENE_COLORS["never-leave"], night: true, chip: { icon: "moon.fill", label: formatNightTime(night.hour, night.minute) }, label: "Night prayer", title: "Lay today down.", sentence: "Say how today felt, then pray before you sleep.",
    done: !!nightDone, stamp: nightDone ? "PRAYED" : undefined, over: <View style={{ position: "absolute", right: 16, top: 16, width: 46, height: 46, borderRadius: 23, backgroundColor: "#F6EDCF", boxShadow: "0 0 0 8px #FBF2F612, 0 0 0 18px #FBF2F608" }}/>,
    accessibilityLabel: nightDone ? "Night prayer, prayed tonight" : "Night prayer. Lay today down.", onPress: () => nightDone ? router.push("/prayers" as never) : setNightOpen(true),
    act: nightDone ? { label: "See tonight’s prayer", run: () => router.push("/prayers" as never) } : { label: nightDue ? "Begin" : "Pray now", run: () => setNightOpen(true) } });
  if (tomorrow && tomorrowArt) items.push({ key: "tomorrow", art: artFor(tomorrowArt), tint: SCENE_COLORS[tomorrowArt.id], blurred: true, chip: { icon: "lock.fill", label: "In the morning" }, label: `Day ${tomorrow.day}`, title: "A letter waiting for you", sentence: devotionalLabel({ day: tomorrow.day }),
    over: <View style={{ position: "absolute", left: 10, right: 10, top: 10, borderRadius: 16, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: pal.chrome, alignItems: "center" }}><Text style={{ ...uiText.supporting, fontSize: 11, lineHeight: 14, fontWeight: "800", letterSpacing: .8, color: "#FFFFFFB8" }}>TOMORROW</Text><Text style={{ ...uiText.sectionTitle, fontSize: 20, lineHeight: 24, fontWeight: "800", color: "#FFFFFF" }}>Your letter opens</Text></View>,
    accessibilityLabel: `Tomorrow, day ${tomorrow.day}. A letter waiting for you.`, onPress: () => setTomorrowOpen(true), act: { label: "Peek at tomorrow", run: () => setTomorrowOpen(true) } });
  const defaultIndex = Math.max(0, (() => {
    const at = (k: string) => items.findIndex(i => i.key === k);
    if (nightDue && (!firstOpen || at("night") >= 0)) return at("night");
    if (firstOpen) return at(firstOpen);
    if (at("tomorrow") >= 0) return at("tomorrow");
    return items.length - 1;
  })());
  const [picked, setPicked] = useState<{ key: string; at: string } | null>(null);
  // A swipe holds until the day's state moves on; then the deck returns to what's now.
  const stateKey = `${card.day}:${count}:${nightDue}:${!!nightDone}`;
  const deckIndex = picked && picked.at === stateKey ? Math.max(0, items.findIndex(i => i.key === picked.key)) : defaultIndex;
  const front = items[deckIndex] ?? items[0]!;
  // Other mounted screens can leave the bar dark; this room is always dark, so claim it on focus.
  useFocusEffect(useCallback(() => { setStatusBarStyle("light", true); }, []));
  const streakBadge = getMilestoneBadge(Math.max(0, MILESTONES.filter(m => m.day <= streak).length - 1));
  const weekday = new Date(clock).toLocaleDateString("en-US", { weekday: "long" }) + (nightDue ? " night" : "");
  // ── The hero: one big card in the day's colour, the scene rising into it, one action. Nothing else.
  const isNight = front.key === "night";
  // The card wears the colour of its own picture; the day's category stays as a dot in the chip.
  const heroTone = tone(front.tint ?? pal.theme.ground[1]);
  const floor = "#0B0909";
  const heroArt = isNight ? NEVER_LEAVE : front.art;
  const HEADLINE: Record<string, string> = { reading: card.title, prayer: "Pray it back", quiz: "Quick check", action: "One small step", night: "Lay today down", tomorrow: "A letter waits", verse: "For today", past: "Look back" };
  const PILL: Record<string, string> = { reading: card.scriptureReference, prayer: card.title, quiz: card.title, action: card.title, night: "Say how today felt", tomorrow: "It opens in the morning", verse: homeQuote?.reference ?? card.scriptureReference, past: `Days 1 to ${card.day - 1}` };
  // The widgets mirror this card: the next open step on its scene, the verse on its book's cover, night prayer's hour.
  const widgetStepIndex = firstOpen ? steps.indexOf(firstOpen) : -1, widgetPainting = widgetStepIndex >= 0 ? paintings[widgetStepIndex % paintings.length]! : null;
  const widgetVerseRef = homeQuote?.reference ?? card.scriptureReference, widgetBook = bookIdFromReference(widgetVerseRef);
  const widgetJSON = JSON.stringify({
    date: todayISO, streak, keptToday: count === total, stepsDone: count, stepsTotal: total,
    step: firstOpen && widgetPainting ? { key: firstOpen, headline: HEADLINE[firstOpen] ?? STEP_COPY[firstOpen]!.title, title: card.title, label: `Step ${widgetStepIndex + 1} of ${steps.length}`, art: widgetPainting.id, tint: SCENE_COLORS[widgetPainting.id] ?? "#A47D28" } : null,
    verse: { text: (quote || card.scriptureText || "").trim(), reference: widgetVerseRef, book: widgetBook, tint: paintedCover(widgetBook)?.color ?? "#A47D28" },
    night: night.hydrated ? { enabled: night.enabled, hour: night.hour, minute: night.minute, doneDate: nightDone ? todayISO : null } : null,
  });
  useEffect(() => { if (ready && hydrated) syncWidgets(JSON.parse(widgetJSON)); }, [widgetJSON, ready, hydrated]);
  const after = items.slice(deckIndex + 1).find(i => !i.done && i.key !== "past");
  const nextLine = after ? after.key === "night" ? `Then, tonight at ${formatNightTime(night.hour, night.minute)} · Night prayer` : after.key === "tomorrow" ? "Tomorrow, a letter opens" : `Then · ${HEADLINE[after.key] ?? after.title}` : "Today, kept";
  const kicker = isNight ? "Night prayer" : front.key === "tomorrow" ? `Day ${tomorrow?.day ?? card.day + 1}` : `${devotionalLabel({ day: card.day })} · ${front.label}`;
  const avatarSource = answers.avatarPhotoUri ? { uri: answers.avatarPhotoUri } : findAvatar(answers.avatarId)?.source;
  const heroH = Math.min(660, height - insets.top - 6 - 54 - bottomInset - 12 - 44);
  return <View style={{ flex: 1, backgroundColor: floor }}>
    <StatusBar style="light"/>
    <Animated.View style={[{ flex: 1, paddingTop: insets.top + 6, paddingBottom: bottomInset + 12 }, tabContentStyle]}>
      <View style={{ height: 50, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 }}>
        <View style={{ width: 44 }}/>
        <Pressable accessibilityRole="button" accessibilityLabel={`${weekday}. Day ${card.day}. ${streak} days in a row`} onPress={onStreak} style={{ flex: 1, alignItems: "center" }}>
          <Text accessibilityRole="header" style={{ ...uiText.body, fontSize: 19, lineHeight: 23, fontWeight: "900", color: "#FFFFFF" }}>{weekday}</Text>
          <Text style={{ ...uiText.supporting, fontSize: 12, lineHeight: 15, fontWeight: "700", color: mix("#FFFFFF", floor, .45) }}>Day {card.day}{streak > 0 ? ` · ${streak} ${streak === 1 ? "day" : "days"} in a row` : ""}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Your profile" onPress={() => router.navigate("/profile" as never)} style={{ width: 44, height: 44, borderRadius: 22, overflow: "hidden", backgroundColor: mix(floor, "#FFFFFF", .1), alignItems: "center", justifyContent: "center" }}>
          {avatarSource ? <Image source={avatarSource} contentFit="cover" style={StyleSheet.absoluteFill}/> : <SFSymbol name="person.fill" size={18} color="#FFFFFFB8"/>}
        </Pressable>
      </View>
      <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={`${kicker}. ${HEADLINE[front.key] ?? front.title}. Open today's walk`} onPress={() => { haptics.soft(); front.onPress(); }}
        style={{ height: heroH, marginHorizontal: 14, marginTop: 4, borderRadius: 34, borderCurve: "continuous", overflow: "hidden", boxShadow: `0 30px 60px -30px ${heroTone.c}CC, 0 0 0 1px ${heroTone.c}4D` }}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: heroTone.deep }]}/>
        {heroArt != null && <View style={StyleSheet.absoluteFill}>
          <Image source={heroArt as never} contentFit="cover" blurRadius={front.blurred ? 18 : 0} style={StyleSheet.absoluteFill} transition={0}/>
          <ReaderMaterialGradient pointerEvents="none" colors={[heroTone.deep, `${heroTone.deep}D9`, `${heroTone.deep}00`]} locations={[0, .24, .52]} style={StyleSheet.absoluteFill}/>
        </View>}
        <View style={{ alignSelf: "center", marginTop: 26, height: 28, paddingLeft: 8, paddingRight: 12, borderRadius: 14, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: mix(heroTone.deep, "#000000", .3), boxShadow: "inset 0 1px 0 #FFFFFF1A" }}>
          <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isNight ? "#FFC93C" : pal.theme.ground[1] }}/>
          <Text style={{ ...uiText.supporting, fontSize: 13, lineHeight: 17, fontWeight: "800", color: heroTone.t1 }}>{kicker}</Text>
        </View>
        <Text numberOfLines={2} adjustsFontSizeToFit minimumFontScale={.6} style={{ ...uiText.screenTitle, fontSize: 58, lineHeight: 56, fontWeight: "900", letterSpacing: -2.4, textTransform: "uppercase", color: heroTone.t1, textAlign: "center", marginTop: 10, paddingHorizontal: 16 }}>{HEADLINE[front.key] ?? front.title}</Text>
        <BlurView intensity={40} tint="dark" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 78, overflow: "hidden", flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: 20, paddingRight: 12, backgroundColor: `${heroTone.deep}99`, boxShadow: "inset 0 1px 0 #FFFFFF2E" }}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ ...uiText.body, fontSize: 16, lineHeight: 20, fontWeight: "800", color: heroTone.t1 }}>{PILL[front.key] ?? front.sentence ?? front.title}</Text>
            {!!front.sentence && ["reading", "prayer", "quiz", "action"].includes(front.key) && <Text numberOfLines={1} style={{ ...uiText.supporting, fontSize: 13, lineHeight: 17, fontWeight: "700", color: heroTone.t2 }}>{front.sentence}</Text>}
          </View>
          <Pressable feedback="action" accessibilityRole="button" accessibilityLabel={front.act.label} disabled={!ready || saving} onPress={() => { haptics.soft(); front.act.run(); }}
            style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", boxShadow: "0 8px 16px -8px #000", opacity: ready ? 1 : .6 }}>
            <SFSymbol name="arrow.right" size={18} color={heroTone.deep}/>
          </Pressable>
        </BlurView>
      </Pressable>
      <Text style={{ ...uiText.supporting, fontSize: 14, fontWeight: "700", color: mix("#FFFFFF", floor, .48), textAlign: "center", marginTop: 16 }}>{nextLine}</Text>
      {!!error && !active && <Text style={{ ...uiText.supporting, color: mix("#FFFFFF", floor, .4), textAlign: "center", marginTop: 6 }}>{error}</Text>}
    </Animated.View>
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
