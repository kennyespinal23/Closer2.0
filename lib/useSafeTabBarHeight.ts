import { useBottomTabBarHeight } from "react-native-bottom-tabs";

/** The native tab bar's height, or 0 on a screen pushed outside the tabs (where the real hook throws). */
export function useSafeTabBarHeight(): number {
  try { return useBottomTabBarHeight(); } catch { return 0; }
}
