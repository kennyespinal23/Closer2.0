import { useEffect, useRef } from 'react';
import { View, useWindowDimensions } from 'react-native';
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Text } from './CloserText';
import { useReducedMotion } from '@/lib/useReducedMotion';

/** The letter-live sequence: press seal, break it, unfold, then lift today's letter. */
export function DailyLetterEnvelope({ opened, day, title, onRevealed }: { opened: boolean; day: number; title: string; onRevealed: () => void }) {
  const reduced = useReducedMotion(), { width } = useWindowDimensions();
  const scale = Math.min(1, (width - 80) / 300);
  const seal = useSharedValue(0), flap = useSharedValue(0), paper = useSharedValue(0), halves = useSharedValue(0);
  const callback = useRef(onRevealed); callback.current = onRevealed;
  useEffect(() => {
    if (!opened) { seal.value = flap.value = paper.value = halves.value = 0; return; }
    const ease = Easing.bezier(.23, 1, .32, 1);
    seal.value = withTiming(1, { duration: reduced ? 0 : 240 });
    halves.value = withDelay(reduced ? 0 : 240, withTiming(1, { duration: reduced ? 0 : 900, easing: ease }));
    flap.value = withDelay(reduced ? 0 : 540, withTiming(1, { duration: reduced ? 0 : 900, easing: ease }));
    paper.value = withDelay(reduced ? 0 : 1440, withTiming(1, { duration: reduced ? 0 : 900, easing: ease }));
    const timer = setTimeout(() => callback.current(), reduced ? 120 : 3100);
    return () => { clearTimeout(timer); [seal, flap, paper, halves].forEach(cancelAnimation); };
  }, [opened, reduced, seal, flap, paper, halves]);
  const stamp = useAnimatedStyle(() => ({ opacity: seal.value < 1 ? 1 : 0, transform: [{ scale: 1 - .12 * seal.value }] }));
  const lid = useAnimatedStyle(() => ({ transform: [{ scaleY: Math.max(0, 1 - flap.value * 2) }] }));
  const back = useAnimatedStyle(() => ({ transform: [{ scaleY: Math.max(0, (flap.value - .5) * 2) }] }));
  const sheet = useAnimatedStyle(() => ({ transform: [{ translateY: -138 * paper.value }] }));
  const left = useAnimatedStyle(() => ({ opacity: seal.value === 1 ? 1 - halves.value : 0, transform: [{ translateX: -48 * halves.value }, { translateY: 150 * halves.value }, { rotate: `${-60 * halves.value}deg` }] }));
  const right = useAnimatedStyle(() => ({ opacity: seal.value === 1 ? 1 - halves.value : 0, transform: [{ translateX: 52 * halves.value }, { translateY: 150 * halves.value }, { rotate: `${55 * halves.value}deg` }] }));
  return <View accessible accessibilityLabel={`A letter for day ${day}: ${title}`} style={{ width: 300 * scale, height: 340 * scale, alignSelf: 'center' }}>
    <View accessibilityElementsHidden style={{ width: 300, height: 340, transform: [{ scale }], transformOrigin: 'top left' }}>
      <View style={{ position: 'absolute', top: 140, width: 300, height: 200, transform: [{ rotate: '-3deg' }], backgroundColor: '#E4D2B8', borderRadius: 16, boxShadow: '0 18px 24px -12px #6A2B1060' }}>
        <Animated.View style={[{ position: 'absolute', top: -116, width: 300, height: 116, transformOrigin: 'bottom' }, back]}><Svg width={300} height={116}><Path d="M0 116L150 0L300 116Z" fill="#EBDAC0"/></Svg></Animated.View>
        <Animated.View style={[{ position: 'absolute', left: 22, top: 12, width: 256, height: 178, borderRadius: 12, backgroundColor: '#FFFDF8', padding: 22 }, sheet]}>
          <Text allowFontScaling={false} style={{ fontSize: 14, fontWeight: '800', color: '#8E4A22' }}>Day {day}</Text>
          <Text allowFontScaling={false} numberOfLines={2} style={{ fontSize: 23, lineHeight: 28, fontWeight: '900', color: '#17120F', marginTop: 8 }}>{title}</Text>
          {[1, .87, .94].map((w, i) => <View key={i} style={{ height: 7, width: `${w * 100}%`, backgroundColor: '#EDE5DA', borderRadius: 4, marginTop: 10 }}/>) }
        </Animated.View>
        <View style={{ position: 'absolute', inset: 0, borderRadius: 16, overflow: 'hidden' }}><Svg width={300} height={200}><Path d="M0 0L150 124L300 0V200H0Z" fill="#F7EBDA"/><Path d="M0 80L150 200L300 80" fill="none" stroke="#E4D2B8" strokeWidth={2}/></Svg></View>
        <Animated.View style={[{ position: 'absolute', top: 0, width: 300, height: 124, transformOrigin: 'top', borderTopLeftRadius: 16, borderTopRightRadius: 16, overflow: 'hidden' }, lid]}><Svg width={300} height={124}><Path d="M0 0H300L150 124Z" fill="#EFDFC7"/></Svg></Animated.View>
        <Animated.View style={[{ position: 'absolute', left: 122, top: 96, width: 56, height: 56, borderRadius: 28, backgroundColor: '#FF4326', borderWidth: 4, borderColor: '#FFFFFF35', alignItems: 'center', justifyContent: 'center' }, stamp]}><Svg width={28} height={28}><Path d="M14 3V25M6 10H22" stroke="#FFF" strokeWidth={3.4} strokeLinecap="round"/></Svg></Animated.View>
        <Animated.View style={[{ position: 'absolute', left: 122, top: 96, width: 28, height: 56, borderTopLeftRadius: 28, borderBottomLeftRadius: 28, backgroundColor: '#FF4326' }, left]}/>
        <Animated.View style={[{ position: 'absolute', left: 150, top: 96, width: 28, height: 56, borderTopRightRadius: 28, borderBottomRightRadius: 28, backgroundColor: '#E7391D' }, right]}/>
      </View>
    </View>
  </View>;
}
