import { type ReactNode, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeInDown, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './CloserText';
import { CloseButton } from './CloseButton';
import { DailyStoryProgress } from './DailyStoryProgress';
import { ReaderMaterialGradient } from './ReaderMaterialGradient';
import { SFSymbol } from './Symbol';
import { dailyText, uiText } from '@/lib/typography';
import { buttonStyles } from '@/lib/buttonStyles';
import { useReducedMotion } from '@/lib/useReducedMotion';
import type { DailyStep } from '@/lib/dailyPractice';
import * as haptics from '@/lib/haptics';
import { useOnboarding } from '@/state/onboarding';
import Svg, { Circle, G, Path } from 'react-native-svg';

// The opening, in ms: hands rise, the greeting follows, then one sentence at a time.
const FIRST_LINE = 2000, LINE_GAP = 1700, LINE_FADE = 1400;
const PRAYER = [
  'God, I haven’t talked to You in a while, and I’m not sure what to say.',
  'Thank You for speaking hope first, before I fix anything.',
  'Help me believe that today.',
];

/**
 * One sentence of the prayer. Sentences arrive one after another, slowly,
 * like someone saying them; tapping the prayer shows the rest at once.
 */
function FadeUp({ delay, duration, shown, children }: { delay: number; duration: number; shown: boolean; children: ReactNode }) {
  const t = useSharedValue(shown ? 1 : 0);
  useEffect(() => {
    if (shown) { t.value = withTiming(1, { duration: 280 }); return; }
    t.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.cubic) }));
  }, [shown, delay, duration, t]);
  const look = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: 10 * (1 - t.value) }] }));
  return <Animated.View style={look}>{children}</Animated.View>;
}

const PALM = 'M60 9C57 9 54.5 11.5 54 15.5C51.5 15.5 49.5 18 49 21.5C46.5 22 44.5 25 44.5 28.5L43.5 54C40.5 60 38.5 67 39 75C39.5 83 42 89 44 94.5L45 101H60Z';
function Hand({ palm }: { palm: string }) {
  return <>
    <Path d={PALM} fill={palm}/>
    <Path d="M54 15.5C55.5 17.5 57.5 18.5 59.5 18.5M49 21.5C51 23.5 54 24.5 57 24.5M44.5 28.5C47 30.5 50.5 31.5 54 31.5" stroke="#D9B79A" strokeWidth={1.5} fill="none" strokeLinecap="round"/>
    <Path d="M59.5 50C55.5 50 52.5 53.5 52.5 58.5L53 73C53.5 78.5 56 81.5 59.5 81.5Z" fill="#F5DCC5" stroke="#D9B79A" strokeWidth={1.5} strokeLinejoin="round"/>
  </>;
}
/** Two hands pressed together in front of a low sun. The palms turn gold once the prayer is said. */
function PrayingHands({ size, prayed, rise }: { size: number; prayed: boolean; rise: boolean }) {
  const t = useSharedValue(rise ? 0 : 1), gold = useSharedValue(prayed ? 1 : 0);
  useEffect(() => { if (rise) t.value = withTiming(1, { duration: 800, easing: Easing.bezier(.23, 1, .32, 1) }); }, [rise, t]);
  useEffect(() => { gold.value = withTiming(prayed ? 1 : 0, { duration: 450 }); }, [prayed, gold]);
  const enter = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: 18 * (1 - t.value) }, { scale: .9 + .1 * t.value }] }));
  const glow = useAnimatedStyle(() => ({ opacity: gold.value }));
  const art = (palm: string) => <Svg width={size} height={size} viewBox="0 0 120 120">
    <Circle cx={60} cy={62} r={40} fill="#FFC93C"/>
    <G><Hand palm={palm}/></G>
    <G transform="translate(120 0) scale(-1 1)"><Hand palm={palm}/></G>
    <Path d="M60 10V100" stroke="#D9B79A" strokeWidth={1.5}/>
    <Path d="M41 97H79V104A6 6 0 0 1 73 110H47A6 6 0 0 1 41 104Z" fill="#6A3A24"/>
  </Svg>;
  return <Animated.View accessible={false} style={[{ width: size, height: size, alignSelf: 'center' }, enter]}>
    {art('#FFF1E4')}
    <Animated.View style={[{ position: 'absolute', inset: 0 }, glow]}>{art('#FFE7A0')}</Animated.View>
  </Animated.View>;
}

/** Completion is saved only after a full hold, never on a partial press. */
export function DailyPrayer({ completed, onComplete, onContinue, onClose }: {
  completed: Partial<Record<DailyStep, boolean>>;
  onComplete: () => Promise<void> | void; onContinue: () => void; onClose: () => void;
}) {
  const { height } = useWindowDimensions();
  const prayerText = height < 700 ? dailyText.compactPrayer : dailyText.prayer;
  const inset = useSafeAreaInsets(), reduced = useReducedMotion();
  const [prayed, setPrayed] = useState(!!completed.prayer), [busy, setBusy] = useState(false);
  const [holding, setHolding] = useState(false), [error, setError] = useState('');
  const [spoken, setSpoken] = useState(false), [screenReader, setScreenReader] = useState(false);
  const [time, setTime] = useState('');
  // Already prayed, Reduce Motion, or a tap: the whole prayer, no waiting.
  const [revealed, setRevealed] = useState(!!completed.prayer || reduced);
  const [opening] = useState(!completed.prayer && !reduced);
  useEffect(() => { if (reduced) setRevealed(true); }, [reduced]);
  const compactScreen = height < 700;
  const prayerStyle = { ...prayerText, fontSize: prayerText.fontSize + 2, lineHeight: prayerText.lineHeight + 2, fontWeight: '700' as const, letterSpacing: -.3, color: '#FFF1E4', textAlign: 'center' as const };
  const firstName = useOnboarding().answers.name.trim().split(' ')[0];
  // The buttons wait until the whole prayer, Amen included, is on screen.
  const [ready, setReady] = useState(revealed || screenReader);
  const buttons = useSharedValue(ready ? 1 : 0);
  useEffect(() => {
    if (ready) return;
    const wait = revealed || screenReader ? 300 : FIRST_LINE + PRAYER.length * LINE_GAP + LINE_FADE;
    const timer = setTimeout(() => setReady(true), wait);
    return () => clearTimeout(timer);
  }, [ready, revealed, screenReader]);
  useEffect(() => { if (ready) buttons.value = withTiming(1, { duration: reduced ? 0 : 500, easing: Easing.out(Easing.cubic) }); }, [ready, reduced, buttons]);
  const buttonsIn = useAnimatedStyle(() => ({ opacity: buttons.value, transform: [{ translateY: 12 * (1 - buttons.value) }] }));
  const locked = useRef(false), live = useRef(true), progress = useSharedValue(0);
  useEffect(() => {
    live.current = true;
    AccessibilityInfo.isScreenReaderEnabled().then(value => { if (live.current) setScreenReader(value); });
    const subscription = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReader);
    return () => { live.current = false; cancelAnimation(progress); subscription.remove(); };
  }, [progress]);
  const finish = async () => {
    if (locked.current || prayed) return;
    locked.current = true; setBusy(true); setHolding(false); setError('');
    try {
      await onComplete();
      if (!live.current) return;
      setPrayed(true); setTime(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
      haptics.success();
    } catch {
      if (live.current) { setError('Couldn’t save your prayer. Please try again.'); progress.value = 0; locked.current = false; }
    } finally { if (live.current) setBusy(false); }
  };
  const start = () => {
    if (locked.current || prayed || screenReader) return;
    haptics.soft(); setHolding(true);
    progress.value = withTiming(1, { duration: 1200, easing: Easing.linear }, finished => { if (finished) runOnJS(finish)(); });
  };
  const release = () => {
    if (locked.current) return;
    cancelAnimation(progress); progress.value = withTiming(0, { duration: reduced ? 0 : 160 }); setHolding(false);
  };
  const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: progress.value }] }));
  return <ReaderMaterialGradient colors={['#3A2219', '#24140E']} style={{ flex: 1, paddingTop: inset.top, backgroundColor: '#24140E' }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, gap: 16 }}>
      <CloseButton onPress={onClose} disabled={busy} color="#FFF1E4" style={{ backgroundColor: '#FFFFFF15' }} accessibilityLabel="Close prayer"/>
      <View style={{ flex: 1 }}><DailyStoryProgress completed={{ ...completed, prayer: prayed }} active="prayer" fraction={.08} color={prayed ? '#FF4326' : '#FFF1E4'} track="#FFFFFF22"/></View>
    </View>
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
      <Pressable accessible={false} onPress={() => setRevealed(true)} style={{ alignItems: 'center' }}>
        <PrayingHands size={compactScreen ? 76 : 112} prayed={prayed} rise={opening}/>
        <FadeUp delay={400} duration={900} shown={!opening}>
          <Text accessibilityRole="header" style={{ ...uiText.screenTitle, fontSize: compactScreen ? 23 : 27, lineHeight: compactScreen ? 27 : 31, letterSpacing: -.5, color: '#FFF1E4', textAlign: 'center', marginTop: compactScreen ? 8 : 14 }}>
            {firstName ? `Hello ${firstName},` : 'Let’s pray together.'}{firstName ? <Text style={{ fontWeight: '800', color: '#D8BDA5' }}>{'\n'}let’s pray together.</Text> : null}
          </Text>
        </FadeUp>
        <View style={{ gap: compactScreen ? 12 : 18, marginTop: compactScreen ? 18 : 28 }}>
          {[...PRAYER, 'Amen.'].map((line, i) => <FadeUp key={i} delay={FIRST_LINE + i * LINE_GAP} duration={LINE_FADE} shown={revealed}>
            <Text selectable style={i === PRAYER.length ? { ...prayerStyle, fontWeight: '900', color: prayed ? '#FFD455' : '#FFF1E4' } : prayerStyle}>{line}</Text>
          </FadeUp>)}
        </View>
      </Pressable>
    </ScrollView>
    <Animated.View pointerEvents={ready ? 'auto' : 'none'} accessibilityElementsHidden={!ready} importantForAccessibility={ready ? 'auto' : 'no-hide-descendants'} style={[{ padding: 20, paddingBottom: inset.bottom + 16, gap: 16 }, buttonsIn]}>
      {prayed ? <Animated.View entering={reduced ? undefined : FadeInDown.duration(220)} accessibilityLiveRegion="polite" style={{ alignSelf: 'center', backgroundColor: '#FFF7EB', borderRadius: 28, padding: 10, paddingRight: 18, flexDirection: 'row', gap: 10, alignItems: 'center' }}><View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF4326', alignItems: 'center', justifyContent: 'center' }}><SFSymbol name="checkmark" size={16} color="#FFF"/></View><Text style={{ ...uiText.supporting, fontWeight: '800', color: '#30241D' }}>Prayed</Text>{!!time && <Text style={{ ...uiText.supporting, color: '#786554' }}>{time}</Text>}</Animated.View> : <Pressable accessibilityRole="button" accessibilityLabel="Say it in my own way" onPress={() => setSpoken(value => !value)} style={{ alignSelf: 'center', minHeight: 44, paddingHorizontal: 16, justifyContent: 'center', borderRadius: 24, backgroundColor: '#FFFFFF12' }}><Text style={{ ...uiText.supporting, color: '#FFF1E4', textAlign: 'center' }}>{spoken ? 'Take your time. God is listening.' : 'Say it in my own way'}</Text></Pressable>}
      {!!error && <Text accessibilityLiveRegion="polite" style={{ ...uiText.supporting, color: '#FFF1E4' }}>{error}</Text>}
      <Pressable accessibilityRole="button" accessibilityLabel={prayed ? 'On to today’s letter' : screenReader ? 'Say Amen' : 'Hold to say Amen'} accessibilityHint={prayed ? undefined : 'Hold for a little over one second to complete your prayer.'} disabled={busy} onPressIn={prayed ? undefined : start} onPressOut={prayed ? undefined : release} onPress={prayed ? onContinue : screenReader ? () => void finish() : undefined} style={[buttonStyles.primary, { overflow: 'hidden', backgroundColor: prayed ? '#FFD455' : '#FFF1E4', opacity: busy ? .65 : 1 }]}>
        {!prayed && <Animated.View pointerEvents="none" style={[{ position: 'absolute', inset: 0, backgroundColor: '#FFD455', transformOrigin: 'left' }, fill]}/>}
        <Text style={[buttonStyles.label, { color: '#30241D' }]}>{prayed ? 'On to today’s letter  →' : busy ? 'Saving…' : holding ? 'Amen' : screenReader ? 'Say Amen' : 'Hold to say Amen'}</Text>
      </Pressable>
    </Animated.View>
  </ReaderMaterialGradient>;
}
