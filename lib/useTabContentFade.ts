import { useAnimatedStyle } from 'react-native-reanimated';

/** Native tabs own their transition. A second content fade dims the newly
 * selected screen and can flash when native and JS selection land separately.
 * Keep this hook's API for screens that already compose its animated style.
 */
export function useTabContentFade(_reduced: boolean) {
  return useAnimatedStyle(() => ({ opacity: 1 }));
}
