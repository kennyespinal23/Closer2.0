import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { DAILY_STEPS, type DailyStep } from '@/lib/dailyPractice';
import { useReducedMotion } from '@/lib/useReducedMotion';
const names = { prayer: 'Prayer', reading: 'Reading', quiz: 'Quiz', action: 'Small step' };
export function DailyStoryProgress({ completed, active, fraction = 0, color, track }: { completed: Partial<Record<DailyStep, boolean>>; active?: DailyStep; fraction?: number; color: string; track: string }) {
  const count = DAILY_STEPS.filter(step => completed[step]).length;
  return <View accessibilityRole="progressbar" accessibilityLabel={`Daily devotional${active ? `, ${names[active]}` : ''}`} accessibilityValue={{ min: 0, max: 4, now: count, text: `${count} of 4 steps complete` }} style={{ flexDirection: 'row', gap: 6 }}>
    {DAILY_STEPS.map(step => <Segment key={step} value={completed[step] ? 1 : active === step ? Math.min(.9, Math.max(0, fraction)) : 0} color={color} track={track} />)}
  </View>;
}
function Segment({ value, color, track }: { value: number; color: string; track: string }) {
  const reduced = useReducedMotion(), fill = useSharedValue(value);
  useEffect(() => { fill.value = reduced ? value : withTiming(value, { duration: 280 }); }, [value, reduced, fill]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scaleX: fill.value }] }));
  return <View style={{ flex: 1, height: 8, borderRadius: 4, backgroundColor: track, overflow: 'hidden' }}><Animated.View style={[{ height: 8, width: '100%', borderRadius: 4, backgroundColor: color, transformOrigin: 'left' }, animated]} /></View>;
}
