import { dailyKeptReveal, dailyPushExit, dailyReadingReveal, dailyLetterExit } from "@/lib/dailyMotion";
import Animated, { Easing, FadeIn, FadeOut, SlideInRight } from "react-native-reanimated";
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
import { useEffect, useMemo, useRef, useState } from "react";
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
import { ReaderMomentArt } from "./ReaderMomentArt";
import { ReaderMaterialGradient } from "./ReaderMaterialGradient";
import { SFSymbol } from "./Symbol";
import { paperActionColors } from "@/lib/paperControls";
import * as haptics from "@/lib/haptics";
import { SuccessMark } from "./SuccessFeedback";
import { DailyQuizCard, quizColors } from "./DailyQuizCard";
import { DailyLetterEnvelope } from "./DailyLetterEnvelope";
import { useAnnotations, verseKey } from "@/state/annotations";
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
  useEffect(() => { if (visible) { setReadingFraction(0); setCelebrating(false); setBusy(false); if (completionTimer.current) clearTimeout(completionTimer.current); setOpening(false); setOpened(false); setQuestion(0); setAnswers([]); setResult(false); setError(""); saving.current = false; chosenRef.current = false; } }, [visible, card.id, kind]);
  const quiz = quizColors(dark);
  const actionColors = kind === "quiz" || kind === "reading" ? { backgroundColor: quiz.ink, color: quiz.paper } : paperActionColors(dark);
  const readingPaper = kind === "reading" && opened;
  const letterScene = kind === "reading" && !opened;
  const ink = letterScene ? "#17120F" : readingPaper ? "#17120F" : dark ? "#F8EFE3" : "#34271F", muted = letterScene ? "#8E4A22" : readingPaper ? "#786554" : dark ? "#C1AE9A" : "#786554", paper = letterScene ? "#FFF4CC" : readingPaper ? "#FBF9F6" : dark ? "#3A3027" : "#FFFCF3";
  const referenceMatch = card.scriptureReference.match(/^(.+?)\s+(\d+):(\d+)/);
  const highlightKey = referenceMatch ? verseKey(referenceMatch[1].toLowerCase().replaceAll(" ", "-"), Number(referenceMatch[2]), Number(referenceMatch[3])) : null;
  const highlighted = highlightKey ? !!annotations.getHighlight(highlightKey) : false;
  const matchedArt = referenceMatch && BIBLE_MOMENTS.find(m => m.bookId === referenceMatch[1].toLowerCase().replaceAll(" ", "-") && m.chapter === Number(referenceMatch[2]) && Number(referenceMatch[3]) >= m.verse && Number(referenceMatch[3]) <= m.endVerse);
  const art = matchedArt || (BIBLE_MOMENTS.find(m => card.scriptureReference.toLowerCase().startsWith(m.bookId.replaceAll("-", " "))) ?? BIBLE_MOMENTS[0]);
  const q = questions[question], answered = answers[question] !== undefined, score = answers.filter((a, i) => a === questions[i]?.answer).length;
  const complete = async () => { if (saving.current) return; saving.current = true; setBusy(true); setError(""); try { await onComplete(kind === "quiz" ? score : undefined); setCelebrating(true); haptics.success(); const completeDay = (kind === "prayer" || saved.prayer) && (kind === "quiz" || saved.quiz) && (kind === "action" || saved.action) && (kind === "reading" || sermonCompletions.some(c => c.day === card.day)); if (!completeDay) completionTimer.current = setTimeout(onContinue ?? onClose, reduced ? 150 : 250); } catch { setError("Couldn’t save your progress. Please try again."); saving.current = false; setBusy(false); } };
  const label = kind === "reading" ? opened ? "I’ve read it" : opening ? "Opening…" : "Open my letter" : kind === "quiz" ? result ? "Done" : question === questions.length - 1 ? "See how you did" : "Next question" : kind === "prayer" ? "Amen" : "I did it";
  const advance = () => { haptics.soft(); if (kind === "reading" && !opened) setOpening(true); else if (kind === "quiz" && !result) { if (question === questions.length - 1) { setResult(true); haptics.success(); } else { chosenRef.current = false; setQuestion(i => i + 1); } } else void complete(); };
  const allDone = !!saved.prayer && !!saved.quiz && !!saved.action && sermonCompletions.some(c => c.day === card.day);
  const finishAction = async () => {
    await onComplete();
    if (saved.prayer && saved.quiz && sermonCompletions.some(c => c.day === card.day)) setCelebrating(true);
    else (onContinue ?? onClose)();
  };
  const disabled = busy || (kind === "reading" && opening && !opened) || (kind === "quiz" && !result && !answered);
  return <Modal visible={visible} presentationStyle="fullScreen" animationType={reduced || celebrating && allDone ? "fade" : "slide"} onDismiss={onDismiss} onRequestClose={() => { if (!busy) onClose(); }}><GestureHandlerRootView style={{ flex: 1, overflow: "hidden" }}><StatusBar style={kind === "quiz" || kind === "action" || kind === "reading" || (celebrating && allDone) ? "dark" : kind === "prayer" || dark ? "light" : "dark"}/><Animated.View key={celebrating && allDone ? "kept" : kind === "reading" ? `reading-${opened}` : kind} entering={reduced ? FadeIn.duration(120) : readingPaper ? dailyReadingReveal : kind === "prayer" ? undefined : celebrating && allDone ? dailyKeptReveal : SlideInRight.duration(500).easing(Easing.bezier(.23, 1, .32, 1))} exiting={!reduced && letterScene ? dailyLetterExit : reduced || kind === "action" ? FadeOut.duration(reduced ? 100 : 180) : dailyPushExit} style={{ flex: 1 }}>{celebrating && allDone ? <DayKept card={card} moment={art} onFinish={onFinish ?? onClose}/> : kind === "action" ? <DailySmallStep key={`${card.id}-${visible}`} card={card} completed={{ ...saved, reading: sermonCompletions.some(c => c.day === card.day) }} onComplete={finishAction} onClose={onClose}/> : kind === "prayer" ? <DailyPrayer key={`${card.id}-${visible}`} completed={{ ...saved, reading: sermonCompletions.some(c => c.day === card.day) }} onComplete={() => onComplete()} onContinue={onContinue ?? onClose} onClose={onClose}/> : <ReaderMaterialGradient colors={letterScene ? ["#FFD455", "#FFC12E"] : kind === "quiz" || readingPaper ? [...quiz.background] : dark ? ["#32271F", "#1B1815"] : ["#F3E5D3", "#FBF5EB"]} style={{ flex: 1, paddingTop: inset.top, backgroundColor: letterScene ? "#FFC12E" : kind === "quiz" || readingPaper ? quiz.paper : dark ? "#1B1815" : "#FBF5EB" }}>
    <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, gap: 16 }}>
      <CloseButton disabled={busy} onPress={onClose} accessibilityLabel="Close" color={kind === "quiz" ? quiz.ink : ink} style={{ backgroundColor: kind === "quiz" || readingPaper ? "#F1ECE6" : paper }}/>
      <View style={{ flex: 1 }}><DailyStoryProgress completed={{ ...saved, reading: sermonCompletions.some(c => c.day === card.day) }} active={kind} fraction={kind === 'quiz' ? answers.length / questions.length * .9 : readingFraction} color="#FF4326" track={kind === "quiz" || readingPaper ? "#DDD6CD" : letterScene ? "#6A2B1028" : "#FFFFFF22"}/></View>
    </View>
    <ScrollView onScroll={event => { if (kind !== 'reading' || !opened) return; const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent; const distance = contentSize.height - layoutMeasurement.height; setReadingFraction(distance > 0 ? Math.min(.9, Math.max(0, contentOffset.y / distance) * .9) : .9); }} scrollEventThrottle={100} style={{ flex: 1 }} key={`${kind}-${opened}-${question}-${result}`} contentContainerStyle={{ padding: 20, paddingBottom: 28, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
      <Animated.View entering={reduced ? undefined : FadeIn.duration(240)} style={{ gap: 22, flexGrow: 1 }}>
        {kind === "reading" && !opened ? <View style={{ flex: 1, gap: 20 }}><View style={{ flex: 1, justifyContent: "center", paddingBottom: 40 }}><DailyLetterEnvelope opened={opening} day={card.day} title={card.title} onRevealed={() => setOpened(true)}/></View><View style={{ gap: 10 }}><Text style={[s.heading, { color: ink, textAlign: "center" }]}>A letter for today.</Text><Text style={{ fontSize: 15, lineHeight: 21, fontWeight: "700", color: muted, textAlign: "center" }}>{card.title} · {card.scriptureReference}</Text></View></View> : kind === "reading" ? <>
          <View style={{ gap: 8 }}><Text style={{ color: muted, fontSize: 15 }}>Day {card.day} · {card.scriptureReference}</Text><Text style={[s.heading, { color: ink }]}>{card.title}</Text></View><View style={{ height: 214, borderRadius: 26, overflow: "hidden" }}><ReaderMomentArt moment={art} /></View>
          {card.story.split(/\n\n+/).map((p, i) => <View key={i} style={{ gap: 24 }}><Text selectable style={[s.body, { color: ink }]}>{p}</Text>{i === 0 && <View style={[s.paper, { backgroundColor: "#FFD455" }]}><Text selectable style={{ color: "#6A2B10", fontSize: 26, lineHeight: 33, fontWeight: "800" }}>“{card.scriptureText}”</Text><View style={{ marginTop: 16, flexDirection: "row", alignItems: "center", gap: 12 }}><Text style={{ color: "#8E4A22", fontSize: 14, flex: 1 }}>{card.scriptureReference}</Text>{highlightKey && <Pressable accessibilityRole="button" accessibilityLabel={highlighted ? "Remove highlight" : "Highlight verse"} accessibilityState={{ selected: highlighted }} disabled={!annotations.hydrated} onPress={() => { annotations.setHighlight(highlightKey, highlighted ? null : "amber", { verseText: card.scriptureText }); haptics.soft(); }} style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 22, backgroundColor: highlighted ? "#6A2B10" : "#FFF4CC", flexDirection: "row", gap: 6, alignItems: "center" }}><SFSymbol name={highlighted ? "checkmark" : "pencil"} color={highlighted ? "#FFF4CC" : "#6A2B10"} size={14}/><Text style={{ fontSize: 14, fontWeight: "700", color: highlighted ? "#FFF4CC" : "#6A2B10" }}>{highlighted ? "Highlighted" : "Highlight"}</Text></Pressable>}</View></View>}</View>)}
          <View style={[s.paper, { backgroundColor: "#3A2219" }]}><Text style={{ color: "#D8BDA5", fontSize: 13, fontWeight: "800", marginBottom: 12 }}>Carry this with you</Text><Text selectable style={{ color: "#FFF1E4", fontSize: 21, lineHeight: 28, fontWeight: "800" }}>{card.insight}</Text></View><Text style={[s.body, { color: muted, textAlign: "center" }]}>The Lord is closer than you think.</Text>
        </> : kind === "quiz" ? <DailyQuizCard question={q} index={question} total={questions.length} selected={answers[question]} result={result} score={score} dark={dark} onAnswer={i => { if (chosenRef.current) return; chosenRef.current = true; setAnswers(old => [...old, i]); if (i === q.answer) haptics.success(); else haptics.soft(); }} /> : <><Text style={[s.heading, { color: ink }]}>Take the word with you.</Text><View style={[s.paper, { backgroundColor: paper }]}><Text style={[s.body, { color: ink }]}>Choose one sentence from today’s reading. Put it into practice through a kind word, a quiet prayer, or a moment of patience.</Text></View><Text style={[s.body, { color: muted }]}>{card.insight}</Text></>}
      </Animated.View>
    </ScrollView><View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: inset.bottom + 16, gap: 12 }}>{!!error && <Text accessibilityLiveRegion="polite" style={{ color: ink }}>{error}</Text>}<Pressable feedback="action" accessibilityRole="button" disabled={disabled} onPress={advance} style={[s.button, { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: disabled && kind === "quiz" ? "#E9E4DE" : actionColors.backgroundColor, opacity: busy ? .5 : 1 }]}>{kind === "reading" && <SFSymbol name={opened ? "checkmark" : "envelope"} size={18} color={actionColors.color}/>}<Text style={{ color: disabled && kind === "quiz" ? "#786554" : actionColors.color, ...buttonStyles.label }}>{celebrating ? "Done" : busy ? "Saving…" : label}</Text></Pressable></View>
    {celebrating && <View pointerEvents="none" accessibilityLiveRegion="polite" style={{ position: "absolute", bottom: inset.bottom + 92, alignSelf: "center", backgroundColor: paper, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 10, boxShadow: "0 4px 16px #00000018" }}><SuccessMark size={28}/><Text style={{ color: ink, fontSize: 16, fontWeight: "600" }}>{kind === "quiz" ? "Quick check complete" : kind === "reading" ? "Reading complete" : "Small step complete"}</Text></View>}
  </ReaderMaterialGradient>}</Animated.View></GestureHandlerRootView></Modal>;
}
const s = StyleSheet.create({ top: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16 }, close: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }, heading: { ...dailyText.overviewTitle }, body: { fontSize: 19, lineHeight: 30, fontWeight: "500" }, paper: { padding: 24, borderRadius: 28, borderCurve: "continuous" }, button: { ...buttonStyles.primary, backgroundColor: "#FFF9EE" }, option: { minHeight: 64, padding: 18, borderRadius: 16, borderCurve: "continuous", flexDirection: "row", gap: 12, alignItems: "center" }, score: { width: 164, height: 164, borderRadius: 82, alignItems: "center", justifyContent: "center" } });
