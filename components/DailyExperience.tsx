import { dailyKeptReveal, dailyPushExit, dailyReadingReveal, dailyLetterExit } from "@/lib/dailyMotion";
import Animated, { Easing, FadeIn, FadeOut } from "react-native-reanimated";
import { dailyText } from "@/lib/typography";
import { StatusBar } from "expo-status-bar";
import { DayKept } from "./DayKept";
import { DailySmallStep } from "./DailySmallStep";
import { DailyPrayer } from "./DailyPrayer";
import { DailyStoryProgress } from './DailyStoryProgress';
import { useDailyPractice } from '@/lib/dailyPractice';
import { useProgress } from '@/state/progress';
import { CloseButton } from "@/components/CloseButton";
import { buttonStyles } from '@/lib/buttonStyles';
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FeedbackPressable as Pressable } from "./FeedbackPressable";
import { Modal, StyleSheet, View } from "react-native";
import { Text } from "@/components/CloserText";
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResolvedScheme } from "@/state/theme";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { buildDailyQuiz } from "@/lib/dailyQuiz";
import type { FloatingScriptureCard } from "@/constants/homePrototype";
import { BIBLE_MOMENTS } from "@/constants/bibleMoments";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { SFSymbol } from "./Symbol";
import { paperActionColors } from "@/lib/paperControls";
import * as haptics from "@/lib/haptics";
import { SuccessMark } from "./SuccessFeedback";
import { DailyQuizCard, quizColors } from "./DailyQuizCard";
import { DailyLetterEnvelope } from "./DailyLetterEnvelope";
import { useAnnotations, verseKey } from "@/state/annotations";
import { CategoryReading, readingTheme } from "./CategoryReading";
import { CategoryExperience, EXPERIENCE_THEMES, hasExperience } from "./CategoryExperience";
import { CategoryLetter, LETTER_ACTIONS, hasLetter } from "./CategoryLetter";
import { useScreenReader } from "@/lib/useScreenReader";
import { dailyStepsFor } from "@/lib/dailySteps";
import { resolveSermonTypeForMoment } from "@/lib/moments";
export type DailyExperienceKind = "reading" | "prayer" | "quiz" | "action";
export function DailyExperience({ visible, kind, card, onClose, onComplete, onDismiss, onContinue, onFinish }: { visible: boolean; kind: DailyExperienceKind; card: FloatingScriptureCard; onClose: () => void; onComplete: (score?: number) => Promise<void> | void; onDismiss?: () => void; onContinue?: () => void; onFinish?: () => void }) {
  const dark = useResolvedScheme() === "dark", reduced = useReducedMotion(), inset = useSafeAreaInsets();
  const { saved } = useDailyPractice(card.id);
  const annotations = useAnnotations();
  const { sermonCompletions } = useProgress();
  const [readingFraction, setReadingFraction] = useState(0);
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false), [question, setQuestion] = useState(0), [answers, setAnswers] = useState<number[]>([]), [result, setResult] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const saving = useRef(false), chosenRef = useRef(false);
  const [celebrating, setCelebrating] = useState(false);
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (completionTimer.current) clearTimeout(completionTimer.current); }, []);
  const questions = useMemo(() => buildDailyQuiz(card), [card]);
  // The steps this day holds; the day is kept when all of them are done.
  const steps = useMemo(() => dailyStepsFor(card.day), [card.day]);
  const readDone = sermonCompletions.some(c => c.day === card.day);
  const doneWith = (except: DailyExperienceKind) => steps.every(step => step === except || (step === "reading" ? readDone : !!saved[step]));
  useEffect(() => { if (visible) { setReadingFraction(0); setCelebrating(false); setBusy(false); if (completionTimer.current) clearTimeout(completionTimer.current); setOpening(false); setOpened(false); setQuestion(0); setAnswers([]); setResult(false); setError(""); saving.current = false; chosenRef.current = false; } }, [visible, card.id, kind]);
  const quiz = quizColors(dark);
  const actionColors = kind === "quiz" || kind === "reading" ? { backgroundColor: quiz.ink, color: quiz.paper } : paperActionColors(dark);
  const readingPaper = kind === "reading" && opened;
  const letterScene = kind === "reading" && !opened;
  // The opened reading takes its shape and colours from the day's category.
  const categoryId = resolveSermonTypeForMoment({ day: card.day }).id, screenReader = useScreenReader();
  // The interactive experience, unless motion is reduced or VoiceOver is on: then the plain reading.
  const experience = readingPaper && hasExperience(categoryId) && !reduced && !screenReader;
  // Before it opens, the day's letter is the category's own object (the plain envelope with Reduce Motion or VoiceOver).
  const letter = letterScene && hasLetter(categoryId) && !reduced && !screenReader;
  const themed = readingPaper || letter;
  const rt = experience || letter ? { ...readingTheme(categoryId), ...EXPERIENCE_THEMES[categoryId]!, band: undefined } : readingTheme(categoryId);
  const onExperienceProgress = useCallback((f: number) => setReadingFraction(old => { const next = Math.min(.9, f * .9); return Math.abs(next - old) < .01 ? old : next; }), []);
  const ink = letterScene ? "#17120F" : readingPaper ? "#17120F" : dark ? "#F8EFE3" : "#34271F", muted = letterScene ? "#8E4A22" : readingPaper ? "#786554" : dark ? "#C1AE9A" : "#786554", paper = letterScene ? "#FFF4CC" : readingPaper ? "#FBF9F6" : dark ? "#3A3027" : "#FFFCF3";
  const referenceMatch = card.scriptureReference.match(/^(.+?)\s+(\d+):(\d+)/);
  const highlightKey = referenceMatch ? verseKey(referenceMatch[1].toLowerCase().replaceAll(" ", "-"), Number(referenceMatch[2]), Number(referenceMatch[3])) : null;
  const highlighted = highlightKey ? !!annotations.getHighlight(highlightKey) : false;
  const matchedArt = referenceMatch && BIBLE_MOMENTS.find(m => m.bookId === referenceMatch[1].toLowerCase().replaceAll(" ", "-") && m.chapter === Number(referenceMatch[2]) && Number(referenceMatch[3]) >= m.verse && Number(referenceMatch[3]) <= m.endVerse);
  const art = matchedArt || (BIBLE_MOMENTS.find(m => card.scriptureReference.toLowerCase().startsWith(m.bookId.replaceAll("-", " "))) ?? BIBLE_MOMENTS[0]);
  const q = questions[question], answered = answers[question] !== undefined, score = answers.filter((a, i) => a === questions[i]?.answer).length;
  const complete = async () => { if (saving.current) return; saving.current = true; setBusy(true); setError(""); try { await onComplete(kind === "quiz" ? score : undefined); setCelebrating(true); haptics.success(); const completeDay = doneWith(kind); if (!completeDay) completionTimer.current = setTimeout(onContinue ?? onClose, reduced ? 150 : 250); } catch { setError("Couldn’t save your progress. Please try again."); saving.current = false; setBusy(false); } };
  const label = kind === "reading" ? opened ? "I’ve read it" : opening ? "Opening…" : letter ? LETTER_ACTIONS[categoryId] ?? "Open my letter" : "Open my letter" : kind === "quiz" ? result ? "Done" : question === questions.length - 1 ? "See how you did" : "Next question" : kind === "prayer" ? "Amen" : "I did it";
  const advance = () => { haptics.soft(); if (kind === "reading" && !opened) setOpening(true); else if (kind === "quiz" && !result) { if (question === questions.length - 1) { setResult(true); haptics.success(); } else { chosenRef.current = false; setQuestion(i => i + 1); } } else void complete(); };
  const allDone = doneWith("none" as DailyExperienceKind);
  const finishAction = async () => {
    await onComplete();
    if (doneWith("action")) setCelebrating(true);
    else (onContinue ?? onClose)();
  };
  const disabled = busy || (kind === "reading" && opening && !opened) || (kind === "quiz" && !result && !answered);
  return <Modal visible={visible} presentationStyle="fullScreen" animationType={reduced || celebrating && allDone ? "fade" : "slide"} onDismiss={onDismiss} onRequestClose={() => { if (!busy) onClose(); }}><GestureHandlerRootView style={{ flex: 1, overflow: "hidden" }}><StatusBar style={themed && !(celebrating && allDone) ? rt.statusBar : kind === "quiz" || kind === "action" || kind === "reading" || (celebrating && allDone) ? "dark" : kind === "prayer" || dark ? "light" : "dark"}/><Animated.View key={celebrating && allDone ? "kept" : kind === "reading" ? `reading-${opened}` : kind} entering={reduced ? FadeIn.duration(120) : readingPaper ? dailyReadingReveal : kind === "prayer" ? undefined : celebrating && allDone ? dailyKeptReveal : FadeIn.duration(220).easing(Easing.bezier(.23, 1, .32, 1))} exiting={!reduced && letterScene ? dailyLetterExit : reduced || kind === "action" ? FadeOut.duration(reduced ? 100 : 180) : dailyPushExit} style={{ flex: 1 }}>{celebrating && allDone ? <DayKept card={card} moment={art} onFinish={onFinish ?? onClose}/> : kind === "action" ? <DailySmallStep key={`${card.id}-${visible}`} card={card} completed={{ ...saved, reading: sermonCompletions.some(c => c.day === card.day) }} onComplete={finishAction} onClose={onClose}/> : kind === "prayer" ? <DailyPrayer steps={steps} key={`${card.id}-${visible}`} completed={{ ...saved, reading: sermonCompletions.some(c => c.day === card.day) }} onComplete={() => onComplete()} onContinue={onContinue ?? onClose} onClose={onClose}/> : <ReaderMaterialGradient colors={letterScene ? ["#FFD455", "#FFC12E"] : readingPaper ? rt.ground : kind === "quiz" ? [...quiz.background] : dark ? ["#32271F", "#1B1815"] : ["#F3E5D3", "#FBF5EB"]} style={{ flex: 1, paddingTop: inset.top, backgroundColor: letterScene ? "#FFC12E" : readingPaper ? rt.ground[1] : kind === "quiz" ? quiz.paper : dark ? "#1B1815" : "#FBF5EB" }}>
    {/* A coloured header band runs up behind the close button. */}
    {letter && <View style={StyleSheet.absoluteFill}><CategoryLetter categoryId={categoryId} card={card} art={art} opening={opening} onOpen={() => setOpening(true)} onRevealed={() => setOpened(true)}/></View>}
    {experience && <View style={StyleSheet.absoluteFill}><CategoryExperience categoryId={categoryId} card={card} art={art} onProgress={onExperienceProgress}/></View>}
    {readingPaper && rt.band && <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, top: 0, height: inset.top + 60, backgroundColor: rt.band[0] }}/>}
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, gap: 16 }}>
      <CloseButton disabled={busy} onPress={onClose} accessibilityLabel="Close" color={themed ? rt.closeInk : kind === "quiz" ? quiz.ink : ink} style={{ backgroundColor: themed ? rt.closeBg : kind === "quiz" ? "#F1ECE6" : paper }}/>
      <View style={{ flex: 1 }}><DailyStoryProgress steps={steps} completed={{ ...saved, reading: sermonCompletions.some(c => c.day === card.day) }} active={kind} fraction={kind === 'quiz' ? answers.length / questions.length * .9 : readingFraction} color={themed ? rt.bar : "#FF4326"} track={themed ? rt.track : kind === "quiz" ? "#DDD6CD" : letterScene ? "#6A2B1028" : "#FFFFFF22"}/></View>
    </View>
    {experience || letter ? <View pointerEvents="none" style={{ flex: 1 }}/> : <ScrollView onScroll={event => { if (kind !== 'reading' || !opened) return; const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent; const distance = contentSize.height - layoutMeasurement.height; const next = distance > 0 ? Math.min(.9, Math.max(0, contentOffset.y / distance) * .9) : .9;
      // Re-render the page only on meaningful steps; every scroll event re-rendering the whole reading made it stutter.
      setReadingFraction(old => Math.abs(next - old) >= .04 || (next >= .9) !== (old >= .9) ? next : old); }} scrollEventThrottle={100} style={{ flex: 1 }} key={`${kind}-${opened}-${question}-${result}`} contentContainerStyle={{ padding: 20, paddingBottom: 28, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <Animated.View entering={reduced ? undefined : FadeIn.duration(240)} style={{ gap: 22, flexGrow: 1 }}>
        {kind === "reading" && !opened ? <View style={{ flex: 1, gap: 20 }}><View style={{ flex: 1, justifyContent: "center", paddingBottom: 40 }}><DailyLetterEnvelope opened={opening} day={card.day} title={card.title} onRevealed={() => setOpened(true)}/></View><View style={{ gap: 10 }}><Text style={[s.heading, { color: ink, textAlign: "center" }]}>A letter for today.</Text><Text style={{ fontSize: 15, lineHeight: 21, fontWeight: "700", color: muted, textAlign: "center" }}>{card.title} · {card.scriptureReference}</Text></View></View> : kind === "reading" ? <CategoryReading categoryId={categoryId} card={card} art={art} progress={Math.min(1, readingFraction / .9)}
          highlight={{ available: !!highlightKey, on: highlighted, disabled: !annotations.hydrated, toggle: () => { if (highlightKey) annotations.setHighlight(highlightKey, highlighted ? null : "amber", { verseText: card.scriptureText }); } }}/>
 : kind === "quiz" ? <DailyQuizCard question={q} index={question} total={questions.length} selected={answers[question]} result={result} score={score} dark={dark} onAnswer={i => { if (chosenRef.current) return; chosenRef.current = true; setAnswers(old => [...old, i]); if (i === q.answer) haptics.success(); else haptics.soft(); }} /> : <><Text style={[s.heading, { color: ink }]}>Take the word with you.</Text><View style={[s.paper, { backgroundColor: paper }]}><Text style={[s.body, { color: ink }]}>Choose one sentence from today’s reading. Put it into practice through a kind word, a quiet prayer, or a moment of patience.</Text></View><Text style={[s.body, { color: muted }]}>{card.insight}</Text></>}
      </Animated.View>
    </ScrollView>}<View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: inset.bottom + 16, gap: 12 }}>{!!error && <Text accessibilityLiveRegion="polite" style={{ color: ink }}>{error}</Text>}<Pressable feedback="action" accessibilityRole="button" disabled={disabled} onPress={advance} style={[s.button, { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: disabled && kind === "quiz" ? "#E9E4DE" : themed ? rt.ctaBg : actionColors.backgroundColor, opacity: busy ? .5 : 1 }]}>{kind === "reading" && <SFSymbol name={opened ? "checkmark" : "envelope"} size={18} color={themed ? rt.ctaInk : actionColors.color}/>}<Text style={{ color: disabled && kind === "quiz" ? "#786554" : themed ? rt.ctaInk : actionColors.color, ...buttonStyles.label }}>{celebrating ? "Done" : busy ? "Saving…" : label}</Text></Pressable></View>
    {celebrating && <View pointerEvents="none" accessibilityLiveRegion="polite" style={{ position: "absolute", bottom: inset.bottom + 92, alignSelf: "center", backgroundColor: paper, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 10, boxShadow: "0 4px 16px #00000018" }}><SuccessMark size={28}/><Text style={{ color: ink, fontSize: 16, fontWeight: "600" }}>{kind === "quiz" ? "Quick check complete" : kind === "reading" ? "Reading complete" : "Small step complete"}</Text></View>}
  </ReaderMaterialGradient>}</Animated.View></GestureHandlerRootView></Modal>;
}
const s = StyleSheet.create({ top: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16 }, close: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }, heading: { ...dailyText.overviewTitle }, body: { fontSize: 19, lineHeight: 30, fontWeight: "500" }, paper: { padding: 24, borderRadius: 28, borderCurve: "continuous" }, button: { ...buttonStyles.primary, backgroundColor: "#FFF9EE" }, option: { minHeight: 64, padding: 18, borderRadius: 16, borderCurve: "continuous", flexDirection: "row", gap: 12, alignItems: "center" }, score: { width: 164, height: 164, borderRadius: 82, alignItems: "center", justifyContent: "center" } });
