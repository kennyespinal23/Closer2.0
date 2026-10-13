import { dailyScoreReveal } from '@/lib/dailyMotion';
import { useEffect } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, { FadeInDown, Easing, useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import { Text } from './CloserText';
import { FeedbackPressable as Pressable } from './FeedbackPressable';
import { SFSymbol } from './Symbol';
import { dailyText, uiText } from '@/lib/typography';
import type { DailyQuestion } from '@/lib/dailyQuiz';
import { useReducedMotion } from '@/lib/useReducedMotion';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export function quizColors(_dark: boolean) {
  return { ink: '#17120F', muted: '#786554', paper: '#FBF9F6', answer: '#FFFFFF', edge: '#EAE5DE', line: '#DDD6CD', background: ['#FBF9F6', '#FBF9F6'] as const };
}
export function DailyQuizCard({ question, index, total, selected, result, score, dark, onAnswer }: { question: DailyQuestion; index: number; total: number; selected?: number; result: boolean; score: number; dark: boolean; onAnswer: (index: number) => void }) {
  const c = quizColors(dark), reduced = useReducedMotion(), ring = useSharedValue(0);
  useEffect(() => { ring.value = result ? withTiming(score / Math.max(1, total), { duration: reduced ? 0 : 700 }) : 0; }, [result, score, total, reduced, ring]);
  const circle = useAnimatedProps(() => ({ strokeDashoffset: 427.26 * (1 - ring.value) }));
  return <Animated.View key={result ? 'result' : index} entering={reduced ? undefined : result ? dailyScoreReveal : FadeInDown.duration(240).easing(Easing.bezier(.23, 1, .32, 1))} style={{ gap: 22, flex: 1 }}>
    {result ? <View style={{ alignItems: 'center', justifyContent: 'center', flex: 1, paddingVertical: 24, gap: 24 }}>
      <View accessibilityLabel={`${score} of ${total} correct`} style={{ width: 168, height: 168, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={168} height={168} style={{ position: 'absolute' }}><Circle cx={84} cy={84} r={68} fill="none" stroke="#EAE5DE" strokeWidth={10}/><AnimatedCircle cx={84} cy={84} r={68} fill="none" stroke="#FFC93C" strokeWidth={10} strokeLinecap="round" strokeDasharray={427.26} rotation={-90} origin="84,84" animatedProps={circle}/></Svg>
        <Text style={{ ...uiText.displayNumber, fontSize: 64, lineHeight: 72, color: c.ink }}>{score}</Text><Text style={{ ...uiText.supporting, color: c.muted }}>of {total}</Text>
      </View>
      <Text accessibilityRole="header" style={{ ...uiText.screenTitle, color: c.ink, textAlign: 'center' }}>{score === total ? 'You remembered it.' : 'You’re learning.'}</Text>
      <Text style={{ ...uiText.supporting, color: c.muted, textAlign: 'center' }}>Carry today’s word into the rest of today.</Text>
    </View> : <>
      <View style={{ gap: 10 }}><Text style={{ ...uiText.supporting, color: c.muted }}>Quick check · {index + 1} of {total}</Text>
      <Text accessibilityRole="header" style={{ ...uiText.screenTitle, color: c.ink }}>{question.prompt}</Text></View>
      {question.quote && <View style={{ backgroundColor: '#FFD455', padding: 24, borderRadius: 20, borderCurve: 'continuous', boxShadow: '0 6px 12px #6A2B1015' }}><Text style={{ ...dailyText.quote, color: '#30241D' }}>{question.quote}</Text></View>}
      <View style={{ gap: 12 }}>{question.options.map((option, i) => {
        const picked = selected === i, correct = i === question.answer, answered = selected !== undefined;
        return <Pressable key={i} feedback="action" accessibilityRole="button" accessibilityState={{ selected: picked, disabled: answered }} disabled={answered} onPress={() => onAnswer(i)} style={{ minHeight: 58, paddingHorizontal: 20, paddingVertical: 14, borderRadius: 20, borderCurve: 'continuous', backgroundColor: picked ? '#17120F' : '#FFF', flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: answered && correct && !picked ? 2 : 1, borderColor: answered && correct && !picked ? '#B96B19' : '#17120F18' }}>
          <Text style={{ ...uiText.body, fontWeight: '700', color: picked ? '#FFF' : c.ink, flex: 1 }}>{option}</Text>
          {answered && (picked || correct) && <Animated.View entering={reduced ? undefined : FadeInDown.duration(180)} style={{ width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: correct ? '#FF4326' : '#786554' }}><SFSymbol name={correct ? 'checkmark' : 'xmark'} color="#FFF" size={14}/></Animated.View>}
        </Pressable>;
      })}</View>
      {selected !== undefined && selected !== question.answer && <Text accessibilityLiveRegion="polite" style={{ ...uiText.supporting, color: c.muted }}>{question.explanation}</Text>}
    </>}
  </Animated.View>;
}
