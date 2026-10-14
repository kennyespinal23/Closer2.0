import type { ReactNode } from 'react';
import { Modal, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './CloserText';
import { CloseButton } from './CloseButton';
import { FeedbackPressable as Pressable } from './FeedbackPressable';
import { ReaderMomentArt } from './ReaderMomentArt';
import { SFSymbol, type SFSymbolName } from './Symbol';
import { dailyText, uiText } from '@/lib/typography';
import { buttonStyles } from '@/lib/buttonStyles';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { useResolvedScheme } from '@/state/theme';
import type { BibleMoment } from '@/constants/bibleMoments';
import type { FloatingScriptureCard } from '@/constants/homePrototype';
import type { DailyStep } from '@/lib/dailyPractice';
const steps: { id: DailyStep; title: string; subtitle: string; icon: SFSymbolName }[] = [
  { id: 'prayer', title: 'Daily prayer', subtitle: 'A prayer for today', icon: 'hands.sparkles' },
  { id: 'reading', title: 'Scripture and word', subtitle: 'A letter for today', icon: 'envelope' },
  { id: 'quiz', title: 'Quick check', subtitle: 'Reflect on today’s word', icon: 'questionmark.bubble' },
  { id: 'action', title: 'One small step', subtitle: 'Something to do before tonight', icon: 'sun.max' },
];
export function DailyWalkOverview({ visible, card, paintings, completed, ready, onClose, onTask, children }: {
  visible: boolean; card: FloatingScriptureCard; paintings: BibleMoment[]; completed: Partial<Record<DailyStep, boolean>>;
  ready: boolean; onClose: () => void; onTask: (step: DailyStep) => void; children: ReactNode;
}) {
  const inset = useSafeAreaInsets(), { height, width, fontScale } = useWindowDimensions(), reduced = useReducedMotion();
  // The marigold top stays the same in both modes; the paper sheet below follows the theme.
  const dark = useResolvedScheme() === 'dark';
  const t = dark
    ? { sheet: '#1E1A16', ink: '#F7F0E6', muted: '#BBAA99', dot: '#2E2823', line: '#FFFFFF14', cta: '#F7F0E6', ctaInk: '#17120F' }
    : { sheet: '#FBF9F6', ink: '#17120F', muted: '#786554', dot: '#EAE5DE', line: '#17120F14', cta: '#17120F', ctaInk: '#FFF7EB' };
  const next = steps.find(step => !completed[step.id])?.id;
  const artHeight = Math.min(236, Math.max(150, height * .25));
  const cardWidth = Math.min(180, width * .45);
  // A sheet that slides up over Home, the same way tomorrow's letter opens. Swipe down closes it.
  return <Modal visible={visible} animationType={reduced ? 'fade' : 'slide'} presentationStyle="pageSheet" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: '#FFB83A' }}>
      <View style={{ flex: 1, paddingTop: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20 }}><CloseButton onPress={onClose} color="#6A2B10" style={{ backgroundColor: '#FFFFFF40' }}/><Text style={{ ...uiText.supporting, fontWeight: '800', color: '#6A2B10' }}>{String(card.day).padStart(2, '0')} · Today</Text><View style={{ width: 44 }}/></View>
        <View accessibilityElementsHidden style={{ height: artHeight + 24, alignItems: 'center', justifyContent: 'center' }}>
          {[1, 2, 0].map((offset, i) => <View key={offset} style={{ position: 'absolute', width: i === 2 ? cardWidth : cardWidth * .69, height: i === 2 ? artHeight : artHeight * .69, borderRadius: 14, borderWidth: 3, borderColor: '#FFF9EE', overflow: 'hidden', boxShadow: '0 8px 16px #00000025', transform: [{ translateX: i === 0 ? -cardWidth * .68 : i === 1 ? cardWidth * .68 : 0 }, { translateY: i === 2 ? -8 : 6 }, { rotate: i === 0 ? '-12deg' : i === 1 ? '10deg' : '-3deg' }] }}><ReaderMomentArt moment={paintings[offset]}/></View>)}
        </View>
        <View style={{ flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderCurve: 'continuous', backgroundColor: t.sheet, padding: 20, paddingBottom: inset.bottom + 16, gap: 12 }}>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: 12 }} showsVerticalScrollIndicator={false}><Text style={{ ...uiText.supporting, color: t.muted }}>{card.scriptureReference}</Text>
          <Text accessibilityRole="header" style={{ ...dailyText.overviewTitle, color: t.ink }}>{card.title}</Text>
          <View style={{ marginTop: 8 }}>{steps.map(step => <Pressable key={step.id} onPress={() => onTask(step.id)} disabled={!ready} accessibilityRole="button" accessibilityLabel={`${step.title}${completed[step.id] ? ', complete' : ''}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, minHeight: 64, borderBottomWidth: .5, borderBottomColor: t.line }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: completed[step.id] ? '#FF4326' : next === step.id ? '#FFD455' : t.dot, alignItems: 'center', justifyContent: 'center' }}><SFSymbol name={completed[step.id] ? 'checkmark' : step.icon} size={17} color={completed[step.id] ? '#FFF' : next === step.id ? '#6A2B10' : t.muted}/></View>
            <View style={{ flex: 1 }}><Text style={{ ...uiText.body, fontSize: 17, lineHeight: 21, fontWeight: '800', color: t.ink }}>{step.title}</Text><Text style={{ ...uiText.supporting, fontSize: 13, lineHeight: 18, color: t.muted }}>{step.subtitle}</Text></View>{next === step.id && fontScale < 1.3 && <Text style={{ ...uiText.supporting, color: t.muted }}>Next</Text>}
          </Pressable>)}</View>
          </ScrollView>
          <Pressable feedback="action" accessibilityRole="button" disabled={!ready} onPress={() => onTask(next ?? 'reading')} style={[buttonStyles.primary, { backgroundColor: t.cta, opacity: ready ? 1 : .5 }]}><Text style={[buttonStyles.label, { color: t.ctaInk }]}>{next === 'prayer' ? 'Start with prayer' : next === 'reading' ? 'Open today’s letter' : next === 'quiz' ? 'Try the quick check' : next === 'action' ? 'Take one small step' : 'Read again'}</Text></Pressable>
        </View>
      </View>
    </View>
    {children}
  </Modal>;
}
