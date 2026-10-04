import { CloseButton } from "@/components/CloseButton";
import { Text as CloserAnimatedTextBase } from "@/components/CloserText";
import { buttonStyles } from '@/lib/buttonStyles';
import { useEffect, useMemo, useRef, useState } from "react";
import { FeedbackPressable as Pressable } from "./FeedbackPressable";
import { Modal, StyleSheet, View } from "react-native";
import { Text } from "@/components/CloserText";
import { GestureHandlerRootView, ScrollView } from "react-native-gesture-handler";
import Animated, { FadeInDown } from "react-native-reanimated";
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
import { PaperEnvelope } from "./PaperEnvelope";
export type DailyExperienceKind = "reading" | "prayer" | "quiz" | "action";
export function DailyExperience({ visible, kind, card, onClose, onComplete, onDismiss }: { visible: boolean; kind: DailyExperienceKind; card: FloatingScriptureCard; onClose: () => void; onComplete: (score?: number) => Promise<void> | void; onDismiss?: () => void }) {
  const dark = useResolvedScheme() === "dark", reduced = useReducedMotion(), inset = useSafeAreaInsets();
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState(false), [question, setQuestion] = useState(0), [answers, setAnswers] = useState<number[]>([]), [result, setResult] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const saving = useRef(false), chosenRef = useRef(false);
  const [celebrating, setCelebrating] = useState(false);
  const completionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (completionTimer.current) clearTimeout(completionTimer.current); }, []);
  const questions = useMemo(() => buildDailyQuiz(card), [card]);
  useEffect(() => { if (visible) { setCelebrating(false); setBusy(false); if (completionTimer.current) clearTimeout(completionTimer.current); setOpening(false); setOpened(false); setQuestion(0); setAnswers([]); setResult(false); setError(""); saving.current = false; chosenRef.current = false; } }, [visible, card.id, kind]);
  const quiz = quizColors(dark);
  const actionColors = kind === "quiz" ? { backgroundColor: quiz.ink, color: quiz.paper } : paperActionColors(dark);
  const ink = dark ? "#F8EFE3" : "#34271F", muted = dark ? "#C1AE9A" : "#786554", paper = dark ? "#3A3027" : "#FFFCF3";
  const art = BIBLE_MOMENTS.find(m => card.scriptureReference.toLowerCase().startsWith(m.bookId.replaceAll("-", " "))) ?? BIBLE_MOMENTS[0];
  const q = questions[question], answered = answers[question] !== undefined, score = answers.filter((a, i) => a === questions[i]?.answer).length;
  const complete = async () => { if (saving.current) return; saving.current = true; setBusy(true); setError(""); try { await onComplete(kind === "quiz" ? score : undefined); setCelebrating(true); haptics.success(); completionTimer.current = setTimeout(onClose, reduced ? 350 : 550); } catch { setError("Couldn’t save your progress. Please try again."); saving.current = false; setBusy(false); } };
  const label = kind === "reading" ? opened ? "I’ve read it" : opening ? "Opening…" : "Open my letter" : kind === "quiz" ? result ? "Done" : question === questions.length - 1 ? "See how you did" : "Next question" : kind === "prayer" ? "Amen" : "I did it";
  const advance = () => { haptics.soft(); if (kind === "reading" && !opened) setOpening(true); else if (kind === "quiz" && !result) { if (question === questions.length - 1) { setResult(true); haptics.success(); } else { chosenRef.current = false; setQuestion(i => i + 1); } } else void complete(); };
  const disabled = busy || (kind === "reading" && opening && !opened) || (kind === "quiz" && !result && !answered);
  return <Modal visible={visible} presentationStyle="fullScreen" animationType={reduced ? "fade" : "slide"} onDismiss={onDismiss} onRequestClose={() => { if (!busy) onClose(); }}><GestureHandlerRootView style={{ flex: 1 }}><ReaderMaterialGradient colors={kind === "quiz" ? [...quiz.background] : dark ? ["#32271F", "#1B1815"] : ["#F3E5D3", "#FBF5EB"]} style={{ flex: 1, paddingTop: inset.top, backgroundColor: dark ? "#1B1815" : "#FBF5EB" }}>
    {kind === "quiz" ? <View style={[s.top, { justifyContent: "space-between", paddingHorizontal: 24 }]}>
      <CloseButton disabled={busy} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close quiz" style={[s.close, { backgroundColor: quiz.paper, borderWidth: 1, borderColor: quiz.line }]} color={quiz.ink} />
      <Text style={{ color: quiz.ink, fontSize: 14, fontWeight: "600" }}>Quick check</Text>
      <View accessibilityLabel={`Question ${question + 1} of ${questions.length}`} style={{ flexDirection: "row", gap: 5, minWidth: 44 }}>{questions.map((_, i) => <View key={i} style={{ width: i === question ? 26 : 16, height: 6, borderRadius: 5, backgroundColor: i <= question ? "#D66B43" : quiz.line }}/>)}</View>
    </View> : <View style={s.top}><CloseButton disabled={busy} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={[s.close, { backgroundColor: paper }]} color={ink} /><View style={{ flex: 1, gap: 8 }}><Text style={{ color: muted, fontSize: 13, fontWeight: "600" }}>{kind === "reading" ? "Today’s letter" : kind === "prayer" ? "Daily prayer" : "One small step"}</Text></View></View>}
    <ScrollView style={{ flex: 1 }} key={`${kind}-${opened}-${question}-${result}`} contentContainerStyle={{ padding: 24, paddingBottom: 36, flexGrow: kind === "reading" && opened ? 0 : 1 }} showsVerticalScrollIndicator={false}>
      <View style={{ gap: 24, flexShrink: 0 }}>
        {kind === "reading" && !opened ? <View style={{ flex: 1, justifyContent: "center", gap: 28 }}><PaperEnvelope opened={opening} onRevealed={() => setOpened(true)} /><Text style={[s.heading, { color: ink, textAlign: "center" }]}>A letter for today.</Text><Text style={[s.body, { color: muted, textAlign: "center" }]}>{card.title}</Text></View> : kind === "reading" ? <>
          <Text style={{ color: muted, fontSize: 14 }}>Day {card.day}</Text><Text style={[s.heading, { color: ink }]}>{card.title}</Text><View style={{ alignSelf: "flex-start", borderRadius: 16, backgroundColor: paper, paddingHorizontal: 12, paddingVertical: 8 }}><Text style={{ color: muted, fontSize: 14 }}>{card.scriptureReference}</Text></View><View style={{ height: 240, borderRadius: 22, overflow: "hidden" }}><ReaderMomentArt moment={art} /></View>
          {card.story.split(/\n\n+/).map((p, i) => <View key={i} style={{ gap: 24 }}><Text selectable style={[s.body, { color: ink }]}>{p}</Text>{i === 0 && <View style={[s.paper, { backgroundColor: paper, borderLeftWidth: 3, borderLeftColor: "#D9A66A" }]}><Text selectable style={{ color: ink, fontSize: 23, lineHeight: 33, fontWeight: "500" }}>“{card.scriptureText}”</Text><Text style={{ color: muted, fontSize: 14, marginTop: 16 }}>{card.scriptureReference}</Text></View>}</View>)}
          <View style={[s.paper, { backgroundColor: paper }]}><Text style={{ color: ink, fontSize: 20, fontWeight: "700", marginBottom: 12 }}>Carry this with you</Text><Text selectable style={[s.body, { color: ink }]}>{card.insight}</Text></View><Text style={[s.body, { color: muted, textAlign: "center" }]}>The Lord is closer than you think.</Text>
        </> : kind === "quiz" ? <DailyQuizCard question={q} index={question} total={questions.length} selected={answers[question]} result={result} score={score} dark={dark} onAnswer={i => { if (chosenRef.current) return; chosenRef.current = true; setAnswers(old => [...old, i]); if (i === q.answer) haptics.success(); else haptics.soft(); }} /> : kind === "prayer" ? <><Text style={[s.heading, { color: ink }]}>A prayer for today</Text><Text style={[s.body, { color: muted }]}>Pray it, or say it your own way.</Text><View style={[s.paper, { backgroundColor: paper, transform: [{ rotate: "-1deg" }] }]}>{["God, help me slow down and listen.", "Open my heart to Your word today.", "Show me one small way to live it with love.", "Amen."].map((line, i) => <NunitoAnimatedText key={line} entering={FadeInDown.delay(reduced ? 0 : i * 90).duration(reduced ? 0 : 240)} style={[s.body, { color: ink, marginBottom: 24 }]}>{line}</NunitoAnimatedText>)}</View></> : <><Text style={[s.heading, { color: ink }]}>Take the word with you.</Text><View style={[s.paper, { backgroundColor: paper }]}><Text style={[s.body, { color: ink }]}>Choose one sentence from today’s reading. Put it into practice through a kind word, a quiet prayer, or a moment of patience.</Text></View><Text style={[s.body, { color: muted }]}>{card.insight}</Text></>}
      </View>
    </ScrollView><View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: inset.bottom + 16, gap: 12 }}>{!!error && <Text accessibilityLiveRegion="polite" style={{ color: ink }}>{error}</Text>}<Pressable feedback="action" accessibilityRole="button" disabled={disabled} onPress={advance} style={[s.button, { backgroundColor: actionColors.backgroundColor, opacity: disabled ? .45 : 1 }]}><Text style={{ color: actionColors.color, ...buttonStyles.label }}>{celebrating ? "Done" : busy ? "Saving…" : label}</Text></Pressable></View>
    {celebrating && <View pointerEvents="none" accessibilityLiveRegion="polite" style={{ position: "absolute", bottom: inset.bottom + 92, alignSelf: "center", backgroundColor: paper, borderRadius: 24, paddingVertical: 12, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 10, boxShadow: "0 4px 16px #00000018" }}><SuccessMark size={28}/><Text style={{ color: ink, fontSize: 16, fontWeight: "600" }}>{kind === "prayer" ? "Prayer complete" : kind === "quiz" ? "Quick check complete" : kind === "reading" ? "Reading complete" : "Small step complete"}</Text></View>}
  </ReaderMaterialGradient></GestureHandlerRootView></Modal>;
}
const s = StyleSheet.create({ top: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16 }, close: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" }, heading: { fontSize: 32, lineHeight: 38, fontWeight: "700", letterSpacing: -.6 }, body: { fontSize: 19, lineHeight: 30 }, paper: { padding: 24, borderRadius: 20, borderCurve: "continuous" }, button: { ...buttonStyles.primary, backgroundColor: "#FFF9EE" }, option: { minHeight: 64, padding: 18, borderRadius: 16, borderCurve: "continuous", flexDirection: "row", gap: 12, alignItems: "center" }, score: { width: 164, height: 164, borderRadius: 82, alignItems: "center", justifyContent: "center" } });

const NunitoAnimatedText = Animated.createAnimatedComponent(CloserAnimatedTextBase);
