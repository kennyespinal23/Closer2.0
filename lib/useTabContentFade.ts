import { useLayoutEffect } from 'react';
import { useNavigationState, useRoute } from '@react-navigation/native';
import { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

const INACTIVE_OPACITY = .65;
const FADE_DURATION_MS = 200;

/** A brief content-only fade for the four main tabs.
 * Read the tab index rather than focus events: closing a sheet or returning
 * from a pushed screen must not replay a tab transition. Scenes stay mounted.
 */
export function useTabContentFade(reduced: boolean) {
  const route = useRoute();
  const selected = useNavigationState(state => state.routes[state.index]?.key === route.key);
  // Inactive tabs are prepared before selection, avoiding a full-opacity frame
  // followed by a dip. Content never disappears or delays hit testing.
  const opacity = useSharedValue(selected || reduced ? 1 : INACTIVE_OPACITY);
  useLayoutEffect(() => {
    cancelAnimation(opacity);
    if (reduced) opacity.value = 1;
    else if (selected) opacity.value = withTiming(1, {
      duration: FADE_DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
    else opacity.value = INACTIVE_OPACITY;
    return () => cancelAnimation(opacity);
  }, [selected, reduced, opacity]);
  return useAnimatedStyle(() => ({ opacity: opacity.value }));
}
