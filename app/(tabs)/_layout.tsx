import { View } from "react-native";
import type {
  ParamListBase,
  TabNavigationState,
} from "@react-navigation/native";
import { withLayoutContext } from "expo-router";
import { FocusMiniPlayer } from "@/components/FocusMiniPlayer";
import {
  createNativeBottomTabsNavigator,
  type NativeBottomTabsNavigationEventMap,
  type NativeBottomTabsScreenOptions,
} from "@/components/NativeBottomTabsNavigator";
import { useColors } from "@/state/theme";

/**
 * Active tint for the tab bar — iOS systemRed (#FF3B30). Reads as
 * the canonical Apple "selected tab" red across Health, Fitness,
 * Music, and Photos. We use the iOS hex (not our editorial
 * #E11D48) so the tab bar slots into the iOS first-party visual
 * language — the rest of the app keeps its editorial red for
 * brand-anchored surfaces (Daily Devotional header, sermon flow
 * Continue pill, Read Now CTA). Easy to flip back to the
 * editorial red if we want one accent everywhere.
 */
const TAB_BAR_ACTIVE = "#FF3B30";
// #AAAAAA per explicit direction. Resolves to ~7.2:1 contrast
// against pure black — comfortably above the WCAG AA 4.5:1 floor
// for navigation text. Applied via `experimentalBakedTintColors`
// on the navigator so the value actually lands on the iOS 26+
// Liquid Glass tab bar (the package returns nil for the inactive
// tint on iOS 26+ unless the bake flag is on — see the
// NativeBottomTabsNavigator wrapper comment).
const TAB_BAR_INACTIVE = "#AAAAAA";

/**
 * NativeTabs — expo-router-friendly handle on our custom
 * native-iOS UITabBar navigator. Built in three layers:
 *
 *   1. `react-native-bottom-tabs` exposes `TabView`, a controlled
 *      component that renders the REAL iOS UITabBarController
 *      (and the iOS 18+ floating "Liquid Glass" pill) via a
 *      native module. It's not a React Navigation navigator
 *      though — just a controlled view.
 *
 *   2. `components/NativeBottomTabsNavigator.tsx` wraps that
 *      `TabView` in React Navigation's `TabRouter` +
 *      `useNavigationBuilder` to produce a proper
 *      `Navigator/Screen` pair — same shape as
 *      `@react-navigation/bottom-tabs`.
 *
 *   3. `withLayoutContext` from expo-router re-attaches that
 *      navigator to expo-router's file-based routing so the
 *      children of `app/(tabs)/` are auto-picked-up as screens,
 *      `router.push("/library")` still switches tabs, deep
 *      links to `/profile` still land in the Profile tab, and
 *      segments resolve normally.
 *
 * Net effect: the public API in this file is essentially
 * unchanged from the old `<Tabs>` setup — just renamed to
 * `<NativeTabs>` and the icons are now SF Symbol names instead
 * of inline SVG render functions.
 */
const { Navigator } = createNativeBottomTabsNavigator();
const NativeTabs = withLayoutContext<
  NativeBottomTabsScreenOptions,
  typeof Navigator,
  TabNavigationState<ParamListBase>,
  NativeBottomTabsNavigationEventMap
>(Navigator);

/**
 * Bottom-tab layout for the main app — consolidated 3-tab shell.
 *
 * Home · Library · Profile. The earlier 5-cell layout (Today /
 * Journey / + Check-in / Library / Insights) was collapsed at
 * the user's request:
 *
 *   • Journey (the Practice tab) was removed — its content
 *     (study-session schedules) now lives as the "App Blocks"
 *     section directly on the home page.
 *   • The center "+" check-in FAB was removed — mood/feeling
 *     check-ins are no longer surfaced from the tab bar.
 *   • Insights was removed — its rhythm/streak content moved
 *     under "Your rhythm" on home, and the per-day breakdown is
 *     reachable from Profile.
 *   • Profile was promoted from a left-side drawer launcher to
 *     a first-class tab, with Notes and Highlights surfaced
 *     inline (Imprint-style) so the user's saved scripture work
 *     lives one tap away from the bottom bar.
 *
 * The home-page avatar still navigates to the Profile tab (now
 * via `router.navigate("/profile")` instead of the legacy modal
 * push) so the visual entry point is preserved for users who
 * learned the drawer pattern.
 *
 * Tab bar: native iOS UITabBar (via react-native-bottom-tabs).
 * Replaces both the old custom GlassTabBar AND the JS-rendered
 * stock React Navigation bar. This is the actual Apple tab bar
 * — same component Health, Fitness, News, and Gentler Streak
 * use — including the iOS 18+ floating Liquid Glass pill, inner
 * highlight on the active tab, automatic dark/light adaptation,
 * and scroll-aware appearance changes. Requires a custom dev
 * build (won't run in Expo Go).
 *
 * Focus chrome lives here too: a FocusMiniPlayer floats above the
 * tab bar whenever a focus session is active, replacing the old
 * top-anchored GlobalFocusBanner. Bottom-anchoring keeps the top of
 * every tab free for its own hero content (page titles, scripture
 * cards, sermon images) while still surfacing a live status + End
 * control everywhere the user navigates.
 */
export default function TabsLayout() {
  const colors = useColors();

  // Layered structure (back → front):
  //   1. Outer View with backgroundColor=colors.bg — the dark
  //      canvas painted on first to prevent any white flash during
  //      scene transitions. (TabView paints its own background but
  //      this is the belt-and-suspenders pass.)
  //   2. NativeTabs — the actual native iOS UITabBarController.
  //      Each tab screen renders directly under it; the native
  //      bar handles its own safe-area inset automatically.
  //   3. FocusMiniPlayer — floats above the bar when active.
  //
  // FocusMiniPlayer mounting rationale (preserved from the pre-
  // native-bar build): mounted INSIDE the (tabs) layout (rather
  // than at the root) so react-native-screens' native view
  // controllers don't occlude the sibling on iOS.
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1 }}>
        <NativeTabs
          tabBarActiveTintColor={TAB_BAR_ACTIVE}
          tabBarInactiveTintColor={TAB_BAR_INACTIVE}
          // Force our custom tints onto the iOS 26+ Liquid Glass
          // tab bar. Without this the package returns nil for the
          // inactive tint on iOS 26+ (see TabViewProps.swift's
          // `effectiveInactiveTintColor`), and iOS paints the
          // inactive labels in its own greige formula tuned for
          // the glass material — which lands at ~3:1 contrast
          // against the dark glass, below the HIG AAA bar this
          // project targets for navigation text. The `baked` mode
          // applies our tints at draw time so #B5B5B5 actually
          // reaches the labels.
          experimentalBakedTintColors
          hapticFeedbackEnabled
          // `scrollEdgeAppearance: "transparent"` lets content
          // bleed under the bar's edge and only paints the bar's
          // material when there's scrolled content underneath —
          // matches Health / Fitness / Gentler Streak which all
          // hide the hairline when content sits flush with the
          // safe-area inset.
          scrollEdgeAppearance="transparent"
          // Kill the cross-fade between tabs. With the package
          // default the UITabBarController plays a 1-frame
          // crossfade that briefly shows the previous tab's
          // snapshot on top of the new one — visible to the user
          // as "I see Library/Profile for a flash when I tap
          // Home." Apple's first-party Settings / Music / Phone
          // tab bars don't animate either; tapping a tab is
          // atomic. Disabling here matches that feel.
          disablePageAnimations
        >
          <NativeTabs.Screen
            name="today"
            options={{
              title: "Home",
              sfSymbol: { default: "house", selected: "house.fill" },
            }}
          />
          <NativeTabs.Screen
            name="library"
            options={{
              title: "Bible",
              sfSymbol: {
                default: "books.vertical",
                selected: "books.vertical.fill",
              },
            }}
          />
          <NativeTabs.Screen
            name="profile"
            options={{
              title: "Profile",
              sfSymbol: { default: "person", selected: "person.fill" },
            }}
          />
        </NativeTabs>
      </View>
      <FocusMiniPlayer />
    </View>
  );
}
