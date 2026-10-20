import { Easing, withTiming, type ExitAnimationsValues } from 'react-native-reanimated';

// Quiet shared transitions: readable content settles quickly without overshoot.
export const dailyScoreReveal = () => {
  'worklet';
  const timing = { duration: 220, easing: Easing.bezier(.23, 1, .32, 1) };
  return { initialValues: { opacity: 0, transform: [{ scale: .96 }] }, animations: { opacity: withTiming(1, timing), transform: [{ scale: withTiming(1, timing) }] } };
};
export const dailyKeptReveal = () => {
  'worklet';
  const timing = { duration: 280, easing: Easing.bezier(.23, 1, .32, 1) };
  return { initialValues: { opacity: 0, transform: [{ scale: .98 }] }, animations: { opacity: withTiming(1, timing), transform: [{ scale: withTiming(1, timing) }] } };
};

export const dailyPushExit = (_values: ExitAnimationsValues) => {
  'worklet';
  return { initialValues: { opacity: 1 }, animations: { opacity: withTiming(0, { duration: 160, easing: Easing.bezier(.23, 1, .32, 1) }) } };
};

export const dailyReadingReveal = () => {
  'worklet';
  const timing = { duration: 240, easing: Easing.bezier(.23, 1, .32, 1) };
  return { initialValues: { opacity: 0, transform: [{ scale: .98 }] }, animations: { opacity: withTiming(1, timing), transform: [{ scale: withTiming(1, timing) }] } };
};
export const dailyLetterExit = () => {
  'worklet';
  const timing = { duration: 180, easing: Easing.bezier(.23, 1, .32, 1) };
  return { initialValues: { opacity: 1, transform: [{ scale: 1 }] }, animations: { opacity: withTiming(0, timing), transform: [{ scale: withTiming(1.02, timing) }] } };
};
