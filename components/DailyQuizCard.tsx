import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/CloserText";
import Animated, { cancelAnimation, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import type { DailyQuestion } from '@/lib/dailyQuiz';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { SFSymbol } from './Symbol';
import { SuccessBurst } from './SuccessFeedback';

export function quizColors(dark: boolean) {
  return dark ? { ink: '#FFF2DE', muted: '#C4B19A', paper: '#352C24', answer: '#392F27', edge: '#17130F', line: '#66503A', background: ['#34271B', '#171510'] as const }
    : { ink: '#35271E', muted: '#77604B', paper: '#FFFAF0', answer: '#FFFCF5', edge: '#DAC9AD', line: '#E3CCAB', background: ['#F9E6C2', '#FFF7E9'] as const };
}
export function DailyQuizCard({ question, index, total, selected, result, score, dark, onAnswer }: { question: DailyQuestion; index: number; total: number; selected?: number; result: boolean; score: number; dark: boolean; onAnswer: (index: number) => void }) {
  const c = quizColors(dark), reduced = useReducedMotion(), answered = selected !== undefined, correct = selected === question.answer;
  return <Animated.View entering={reduced ? FadeIn.duration(120) : FadeInDown.duration(280)} style={{ gap: 24 }}>
    {result ? <View style={s.result}>
      <View style={s.seal}><SFSymbol name="checkmark" size={60} weight="bold" color="#FFFFFF" />{score === total && <SuccessBurst />}</View>
      <View style={[s.score, { backgroundColor: c.paper }]}><Text style={{ color: c.ink, fontSize: 16, fontWeight: '600' }}>{score} of {total} correct</Text></View>
      <Text accessibilityRole="header" style={[s.resultTitle, { color: c.ink }]}>{score === total ? 'Look at you grow.' : 'A little closer today.'}</Text>
      <Text style={[s.resultBody, { color: c.muted }]}>You made room for His word.{'\n'}That’s something worth keeping.</Text>
    </View> : <>
      <Text style={{ color: c.muted, textAlign: 'center', fontSize: 14, fontWeight: '600' }}>Question {index + 1} of {total}</Text>
      <View style={[s.question, { backgroundColor: c.paper }]}>
        <Text accessible={false} pointerEvents="none" style={s.watermark}>?</Text>
        <Text accessibilityRole="header" style={[s.prompt, { color: c.ink }]}>{question.prompt}</Text>
        {!!question.quote && <Text style={[s.quote, { color: c.muted }]}>{question.quote}</Text>}
      </View>
      <View style={{ gap: 13, marginTop: 6 }}>{question.options.map((label, i) => <QuizAnswer key={i} label={label} index={i} dark={dark} selected={selected === i} state={!answered ? 'idle' : i === question.answer ? 'right' : i === selected ? 'wrong' : 'dim'} celebrate={correct && i === question.answer} onPress={() => onAnswer(i)} />)}</View>
      <View style={{ minHeight: 80, paddingHorizontal: 8 }}>
        {answered ? <Animated.View entering={FadeIn.duration(reduced ? 0 : 180)} accessibilityLiveRegion="polite" style={{ gap: 8 }}>
          <Text style={{ color: correct ? dark ? '#67DA99' : '#218E50' : c.ink, fontSize: 25, fontWeight: '700', letterSpacing: -.6, textAlign: 'center' }}>{correct ? 'That’s it!' : 'A little discovery.'}</Text>
          <Text style={{ color: c.muted, fontSize: 15, lineHeight: 22, textAlign: 'center' }}>{question.explanation}</Text>
        </Animated.View> : <Text style={{ color: c.muted, textAlign: 'center', fontSize: 15 }}>Take your time. You’ve got this.</Text>}
      </View>
    </>}
  </Animated.View>;
}
function QuizAnswer({ label, index, dark, state, selected, celebrate, onPress }: { label: string; index: number; dark: boolean; state: 'idle' | 'right' | 'wrong' | 'dim'; selected: boolean; celebrate: boolean; onPress: () => void }) {
  const c = quizColors(dark), reduced = useReducedMotion(), scale = useSharedValue(1), x = useSharedValue(0), press = useSharedValue(0);
  useEffect(() => {
    if (!reduced) {
      if (state === 'right') { scale.value = .97; scale.value = withSpring(1, { stiffness: 400, damping: 18 }); }
      if (state === 'wrong') x.value = withSequence(withTiming(-5, { duration: 60 }), withTiming(5, { duration: 60 }), withTiming(-4, { duration: 60 }), withTiming(4, { duration: 60 }), withTiming(0, { duration: 80 }));
    }
    return () => { cancelAnimation(scale); cancelAnimation(x); };
  }, [state, reduced, scale, x]);
  const motion = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { translateY: press.value }, { scale: scale.value }] }));
  const right = state === 'right', wrong = state === 'wrong';
  const color = right ? '#092F1C' : wrong ? '#602C23' : c.ink;
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: state !== 'idle', selected }} disabled={state !== 'idle'} onPress={onPress} onPressIn={() => { press.value = withTiming(reduced ? 0 : 3, { duration: 90 }); }} onPressOut={() => { press.value = withTiming(0, { duration: 120 }); }}>
    <Animated.View style={[s.answer, { backgroundColor: right ? '#35BD76' : wrong ? '#EFB8A9' : c.answer, borderColor: right ? '#279D5E' : wrong ? '#C98370' : c.line, opacity: state === 'dim' ? .55 : 1, boxShadow: `0 4px 0 ${right ? '#188246' : wrong ? '#B27666' : c.edge}` }, motion]}>
      <View style={[s.letter, { backgroundColor: right ? '#EFFFF4' : '#B8997320', borderRadius: right ? 14 : 9 }]}>{right || wrong ? <SFSymbol name={right ? 'checkmark' : 'xmark'} color={right ? '#15824A' : '#602C23'} size={16} weight="bold" /> : <Text style={{ color: c.muted, fontSize: 13, fontWeight: '600' }}>{'ABCD'[index]}</Text>}</View>
      <Text style={{ flex: 1, color, fontSize: 17, lineHeight: 24, fontWeight: '500' }}>{label}</Text>
      {celebrate && <SuccessBurst />}
    </Animated.View>
  </Pressable>;
}
const s = StyleSheet.create({
  question: { minHeight: 194, borderWidth: 5, borderColor: '#D87950', borderRadius: 24, borderCurve: 'continuous', paddingVertical: 27, paddingHorizontal: 22, justifyContent: 'center', boxShadow: '0 7px 0 #9B4D31, 0 16px 24px #6D3A2220' },
  watermark: { position: 'absolute', right: 10, top: -20, fontSize: 170, lineHeight: 190, fontWeight: '800', color: '#D879501C', transform: [{ rotate: '12deg' }] },
  prompt: { fontSize: 27, lineHeight: 32, letterSpacing: -.7, fontWeight: '700' },
  quote: { fontSize: 17, lineHeight: 26, marginTop: 15 },
  answer: { minHeight: 58, paddingVertical: 12, paddingHorizontal: 16, borderWidth: 1, borderRadius: 17, borderCurve: 'continuous', flexDirection: 'row', alignItems: 'center', gap: 14 },
  letter: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center' },
  result: { alignItems: 'center', paddingTop: 36, paddingBottom: 25, gap: 24 },
  seal: { width: 130, height: 130, backgroundColor: '#35BD76', borderWidth: 7, borderColor: '#86DFA9', borderRadius: 40, borderCurve: 'continuous', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 0 #218B51', transform: [{ rotate: '-7deg' }], marginTop: 30, marginBottom: 16 },
  score: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 18 },
  resultTitle: { fontSize: 34, fontWeight: '700', letterSpacing: -1, textAlign: 'center' },
  resultBody: { fontSize: 17, lineHeight: 26, textAlign: 'center' },
});
