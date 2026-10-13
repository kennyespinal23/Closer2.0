import { ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useProgress } from '@/state/progress';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { uiText } from '@/lib/typography';
import { buttonStyles } from '@/lib/buttonStyles';
import type { FloatingScriptureCard } from '@/constants/homePrototype';
import type { BibleMoment } from '@/constants/bibleMoments';
import { Text } from './CloserText';
import { ReaderMomentArt } from './ReaderMomentArt';
import { CloseButton } from './CloseButton';
import { FeedbackPressable as Pressable } from './FeedbackPressable';
import { SFSymbol } from './Symbol';
export function DayKept({ card, moment, onFinish }: { card: FloatingScriptureCard; moment: BibleMoment; onFinish: () => void }) {
  const { height } = useWindowDimensions();
  const compact = height < 700;
  const inset = useSafeAreaInsets(), reduced = useReducedMotion(), { streak } = useProgress();
  return <View style={{ flex: 1, backgroundColor: '#FFD455', paddingTop: inset.top }}>
    <View style={{ paddingHorizontal: 20, paddingTop: 8 }}><CloseButton onPress={onFinish} color="#6A2B10" style={{ backgroundColor: '#FFFFFF40' }}/></View>
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, alignItems: 'center', justifyContent: 'center', gap: 28 }}>
      <Animated.View entering={reduced ? undefined : FadeInDown.duration(350)} style={{ width: compact ? 140 : 210, height: compact ? 186 : 280, marginBottom: 12 }}>
        <View style={{ flex: 1, borderRadius: 18, borderWidth: 4, borderColor: '#FFF9EE', overflow: 'hidden', transform: [{ rotate: '-6deg' }], boxShadow: '0 14px 24px #6A2B1040' }}><ReaderMomentArt moment={moment}/></View>
        <Animated.View entering={reduced ? undefined : ZoomIn.delay(250).springify().damping(15)} style={{ position: 'absolute', bottom: -16, right: -22, width: compact ? 76 : 92, height: compact ? 76 : 92, borderRadius: 46, backgroundColor: '#A93620', alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '10deg' }], boxShadow: '0 5px 8px #6A2B1030' }}><Text style={{ ...uiText.body, fontWeight: '900', color: '#FFF' }}>Kept</Text><Text style={{ ...uiText.supporting, color: '#FFF1E4' }}>Day {card.day}</Text></Animated.View>
      </Animated.View>
      <View style={{ gap: 12 }}><Text accessibilityRole="header" style={{ ...uiText.screenTitle, fontSize: 44, lineHeight: 46, color: '#3A2219', textAlign: 'center' }}>Day {card.day}, kept.</Text><Text style={{ ...uiText.supporting, color: '#6A2B10', textAlign: 'center' }}>You made room for God today.</Text></View>
      <View style={{ flexDirection: 'row', alignSelf: 'stretch', justifyContent: 'space-between', gap: 4 }}>{streak.lastSevenDays.map((day, i) => <Animated.View key={day.dateISO} entering={reduced ? undefined : FadeInDown.delay(400 + i * 70).duration(220)} style={{ alignItems: 'center', gap: 8 }}><View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: day.engaged || i === 6 ? '#FF4326' : '#FFE79A', alignItems: 'center', justifyContent: 'center' }}>{day.engaged || i === 6 ? <SFSymbol name="checkmark" size={16} color="#FFF"/> : <Text style={{ ...uiText.supporting, color: '#6A2B10' }}>{Number(day.dateISO.slice(-2))}</Text>}</View><Text style={{ ...uiText.supporting, color: '#6A2B10' }}>{new Date(`${day.dateISO}T12:00:00`).toLocaleDateString(undefined, { weekday: 'narrow' })}</Text></Animated.View>)}</View>
    </ScrollView>
    <View style={{ padding: 20, paddingBottom: inset.bottom + 16 }}><Pressable accessibilityRole="button" onPress={onFinish} style={[buttonStyles.primary, { backgroundColor: '#17120F' }]}><Text style={[buttonStyles.label, { color: '#FFF' }]}>Back to today</Text></Pressable></View>
  </View>;
}
