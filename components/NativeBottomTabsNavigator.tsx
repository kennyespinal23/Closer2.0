import {
  type DefaultNavigatorOptions,
  type EventArg,
  type ParamListBase,
  type RouteProp,
  type TabActionHelpers,
  TabActions,
  type TabNavigationState,
  TabRouter,
  type TabRouterOptions,
  useNavigationBuilder,
} from "@react-navigation/native";
import { createNavigatorFactory } from "@react-navigation/native";
import type { ColorValue } from "react-native";
import TabView from "react-native-bottom-tabs";
import type { AppleIcon } from "react-native-bottom-tabs";

/**
 * NativeBottomTabsNavigator
 *
 * A React-Navigation-compatible wrapper around the native iOS
 * `UITabBarController` rendered by `react-native-bottom-tabs`.
 *
 * Why this exists:
 *   The stock `@react-navigation/bottom-tabs` renders the tab bar
 *   in JavaScript (a styled <View>). It looks fine, but it isn't
 *   the real iOS 18 floating "Liquid Glass" UITabBar that Apple
 *   ships in Health / Fitness / News / Gentler Streak. To get that
 *   exact native chrome — the pill, the inner highlight on the
 *   active tab, the system blur, the iOS-26 minimize-on-scroll —
 *   we need a real native module (react-native-bottom-tabs).
 *
 *   That package exports a controlled `TabView` component, not a
 *   React Navigation navigator. This file is the glue: it builds
 *   a navigator using React Navigation's `TabRouter` + `useNavigationBuilder`
 *   and forwards the navigation state into `TabView`. Wrap the
 *   factory's `.Navigator` with expo-router's `withLayoutContext`
 *   in a `_layout.tsx` and it slots into expo-router's file-based
 *   routing exactly like the stock `<Tabs>` did — `/today`,
 *   `/library`, `/profile` deep links keep working, segments
 *   resolve normally, navigation events fire correctly.
 *
 * Adapting screen options:
 *   The native tab bar needs platform icons — either an SF Symbol
 *   (cleanest, scales perfectly) or an `ImageSource` (PNG). React
 *   Navigation's stock `tabBarIcon` is a render function that
 *   returns a React element, which the native bar can't consume.
 *   So we add three custom screen options that the navigator
 *   reads when building the route descriptors:
 *
 *     • `sfSymbol`            — string, used for both states
 *     • `sfSymbol.default`    — unfocused state SF Symbol name
 *     • `sfSymbol.selected`   — focused state SF Symbol name
 *
 *   Anything else (PNG icons, badges, etc.) can be added later by
 *   extending the options type and the routes-mapper below.
 */

export type NativeBottomTabsScreenOptions = {
  /** Tab label shown under the icon. Falls back to `route.name`. */
  title?: string;
  /**
   * SF Symbol to render as the tab's icon on iOS. Pass a string to
   * use the same symbol for both focused/unfocused states (the
   * native bar handles the visual difference automatically), or
   * an object to use distinct symbols per state — e.g.
   *
   *   sfSymbol: { default: "house", selected: "house.fill" }
   *
   * See https://developer.apple.com/sf-symbols for the catalog.
   */
  sfSymbol?: string | { default: string; selected: string };
  /** Optional badge text shown on the tab icon. */
  badge?: string;
  /** Hide a tab without removing it from the tree. */
  hidden?: boolean;
};

export type NativeBottomTabsNavigationEventMap = {
  tabPress: { data: undefined; canPreventDefault: true };
  tabLongPress: { data: undefined };
};

type NativeBottomTabsNavigatorProps = {
  /** Active tab tint color. iOS systemRed `#FF3B30` by default. */
  tabBarActiveTintColor?: ColorValue;
  /** Inactive tab tint color. iOS 26+ ignores this (Liquid Glass)
   *  UNLESS `experimentalBakedTintColors` is enabled. */
  tabBarInactiveTintColor?: ColorValue;
  /**
   * Force the active/inactive tint colors to be applied even on
   * iOS 26+ Liquid Glass tabs. Required to override the default
   * low-contrast greige Apple paints for inactive labels — the
   * stock UITabBar appearance on iOS 26+ uses a tint formula
   * tuned for the translucent glass material that lands below the
   * AAA contrast bar this project targets. Setting this flag
   * routes our `tabBarInactiveTintColor` into the icons and
   * labels at draw time so we can hit AAA on inactive tabs
   * without sacrificing the Liquid Glass material behind them.
   *
   * Marked `experimental` upstream because the bake-time tint
   * application can produce slight icon-color mismatches with
   * other Apple tab bars; for our use case (single solid tint per
   * state) it's stable.
   */
  experimentalBakedTintColors?: boolean;
  /** Enable haptic feedback on tab change. */
  hapticFeedbackEnabled?: boolean;
  /** How the bar's appearance reacts when scrolled to the bottom. */
  scrollEdgeAppearance?: "default" | "opaque" | "transparent";
  /** iOS 26+: tab bar minimize-on-scroll behavior. */
  minimizeBehavior?: "automatic" | "onScrollDown" | "onScrollUp" | "never";
  /**
   * Disable the cross-fade animation between tabs (iOS only).
   *
   * When false (the package default) UITabBarController plays a
   * brief crossfade as it swaps scenes. With our setup that
   * crossfade renders a 1-frame "ghost" of the previous tab on top
   * of the new one before the snapshot drops — visible to the eye
   * as a flash of the screen you just left. Setting this true makes
   * the swap atomic the way Apple's Settings / Music / Phone tab
   * bars feel: tap → new tab is just there, no transition. We
   * surface it on the navigator (and forward it into TabView) so
   * the layout can opt in without reaching into the package's
   * internal prop surface.
   */
  disablePageAnimations?: boolean;
};

type Props = DefaultNavigatorOptions<
  ParamListBase,
  string | undefined,
  TabNavigationState<ParamListBase>,
  NativeBottomTabsScreenOptions,
  NativeBottomTabsNavigationEventMap,
  unknown
> &
  TabRouterOptions &
  NativeBottomTabsNavigatorProps;

function NativeBottomTabsNavigator({
  id,
  initialRouteName,
  children,
  layout,
  screenListeners,
  screenOptions,
  screenLayout,
  backBehavior,
  tabBarActiveTintColor,
  tabBarInactiveTintColor,
  experimentalBakedTintColors,
  hapticFeedbackEnabled,
  scrollEdgeAppearance,
  minimizeBehavior,
  disablePageAnimations,
}: Props) {
  const { state, descriptors, navigation, NavigationContent } =
    useNavigationBuilder<
      TabNavigationState<ParamListBase>,
      TabRouterOptions,
      TabActionHelpers<ParamListBase>,
      NativeBottomTabsScreenOptions,
      NativeBottomTabsNavigationEventMap
    >(TabRouter, {
      id,
      initialRouteName,
      children,
      layout,
      screenListeners,
      screenOptions,
      screenLayout,
      backBehavior,
    });

  const routes = state.routes
    .map((route) => {
      const { options } = descriptors[route.key];
      const { focused, unfocused } = resolveSFSymbols(options.sfSymbol);
      return {
        key: route.key,
        title: options.title ?? route.name,
        focusedIcon: focused,
        unfocusedIcon: unfocused,
        badge: options.badge,
        hidden: options.hidden,
      };
    });

  return (
    <NavigationContent>
      <TabView
        navigationState={{ index: state.index, routes }}
        onIndexChange={(index) => {
          const route = state.routes[index];
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          }) as EventArg<"tabPress", true, undefined>;
          if (!event.defaultPrevented) {
            navigation.dispatch({
              ...TabActions.jumpTo(route.name),
              target: state.key,
            });
          }
        }}
        onTabLongPress={(index) => {
          const route = state.routes[index];
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        }}
        renderScene={({ route }) => descriptors[route.key]?.render() ?? null}
        tabBarActiveTintColor={tabBarActiveTintColor}
        tabBarInactiveTintColor={tabBarInactiveTintColor}
        experimental_bakedTintColors={experimentalBakedTintColors}
        hapticFeedbackEnabled={hapticFeedbackEnabled}
        scrollEdgeAppearance={scrollEdgeAppearance}
        minimizeBehavior={minimizeBehavior}
        disablePageAnimations={disablePageAnimations}
      />
    </NavigationContent>
  );
}

function resolveSFSymbols(
  symbol: NativeBottomTabsScreenOptions["sfSymbol"],
): { focused?: AppleIcon; unfocused?: AppleIcon } {
  if (!symbol) return {};
  if (typeof symbol === "string") {
    const icon: AppleIcon = { sfSymbol: symbol as AppleIcon["sfSymbol"] };
    return { focused: icon, unfocused: icon };
  }
  return {
    focused: { sfSymbol: symbol.selected as AppleIcon["sfSymbol"] },
    unfocused: { sfSymbol: symbol.default as AppleIcon["sfSymbol"] },
  };
}

/**
 * Use the returned object exactly the way you'd use the result of
 * `createBottomTabNavigator()` from `@react-navigation/bottom-tabs`:
 *
 *   const { Navigator, Screen } = createNativeBottomTabsNavigator();
 *
 * In an expo-router layout you'll typically wrap `Navigator` with
 * `withLayoutContext` and re-export it as your own `<NativeTabs>`
 * component — see `app/(tabs)/_layout.tsx` for the canonical use.
 *
 * React Navigation v7 dropped the generic arguments from
 * `createNavigatorFactory` (the typed `Screen` callback infers
 * options/events from the navigator component instead), so the
 * factory call is plain — the navigator's own typed Props above
 * are what carries the option/event shapes downstream.
 */
export const createNativeBottomTabsNavigator = createNavigatorFactory(
  NativeBottomTabsNavigator,
);

// `RouteProp` is re-exported as a convenience for screen-level
// hooks that need the typed `route.params` of a sibling tab. Kept
// in this module so consumers only import from one place.
export type { RouteProp };
