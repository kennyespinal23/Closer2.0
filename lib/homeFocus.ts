import { Easing, type SharedValue, useAnimatedReaction, useSharedValue, withTiming } from "react-native-reanimated";

/**
 * Home's cards take turns being the subject. Each card owns a scroll stop
 * (stop × distance); it is fully open at its stop and folds as the page
 * moves toward a neighbour's. The first card stays open above its stop,
 * the last stays open past it, so exactly one card is open at every rest.
 */
export function focusAmount(y: number, stop: number, last: number, distance: number) {
  "worklet";
  const t = y / distance - stop;
  if ((t < 0 && stop === 0) || (t > 0 && stop === last)) return 1;
  return 1 - Math.min(1, Math.abs(t));
}

/**
 * A card's one beat when the page comes to rest on it: 0 → 1 over `duration`.
 * `settled` is the stop the page rests on, or -1 while it moves. The card
 * the page opens on starts finished, so nothing replays on every visit.
 */
export function useFocusMoment(settled: SharedValue<number>, stop: number, duration: number) {
  const m = useSharedValue(1);
  useAnimatedReaction(() => settled.value, (now, prev) => {
    if (prev === null) { m.value = now === stop ? 1 : 0; return; }
    if (now === prev || now === -1) return;
    if (now === stop) { m.value = 0; m.value = withTiming(1, { duration, easing: Easing.out(Easing.cubic) }); }
    else m.value = 0;
  }, [stop, duration]);
  return m;
}
