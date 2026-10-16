import { Easing, withTiming, type ExitAnimationsValues } from 'react-native-reanimated';

// Timings and transform ranges from the day-walk reference reels.
export const dailyScoreReveal = () => {
  'worklet';
  const timing = { duration: 400, easing: Easing.bezier(.23, 1, .32, 1) };
  return { initialValues: { opacity: 0, transform: [{ scale: .96 }] }, animations: { opacity: withTiming(1, timing), transform: [{ scale: withTiming(1, timing) }] } };
};
export const dailyKeptReveal = () => {
  'worklet';
  const timing = { duration: 700, easing: Easing.bezier(.23, 1, .32, 1) };
  return { initialValues: { opacity: 0, transform: [{ scale: .9 }] }, animations: { opacity: withTiming(1, timing), transform: [{ scale: withTiming(1, timing) }] } };
};

export const dailyPushExit = (values: ExitAnimationsValues) => {
  'worklet';
  return { initialValues: { transform: [{ translateX: 0 }] }, animations: { transform: [{ translateX: withTiming(-values.windowWidth * .28, { duration: 500, easing: Easing.bezier(.23, 1, .32, 1) }) }] } };
};

export const dailyReadingReveal = () => {
  'worklet';
  const timing = { duration: 340, easing: Easing.bezier(.23, 1, .32, 1) };
  return { initialValues: { opacity: 0, transform: [{ scale: .94 }] }, animations: { opacity: withTiming(1, timing), transform: [{ scale: withTiming(1, timing) }] } };
};
export const dailyLetterExit = () => {
  'worklet';
  const timing = { duration: 300, easing: Easing.bezier(.23, 1, .32, 1) };
  return { initialValues: { opacity: 1, transform: [{ scale: 1 }] }, animations: { opacity: withTiming(0, timing), transform: [{ scale: withTiming(1.35, timing) }] } };
};
