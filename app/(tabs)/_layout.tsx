import { View, type ColorValue } from "react-native";
import { Tabs } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { GlassTabBar } from "@/components/GlassTabBar";
import { FocusMiniPlayer } from "@/components/FocusMiniPlayer";
import { useColors } from "@/state/theme";

/**
 * Editorial-red accent. Mirrors the `SERMON_ACCENT` constant used
 * across the home screen, the scripture opener, every sermon
 * panel, and the "Complete and unlock apps" button so the active
 * tab visually belongs to the same color story as the rest of
 * the app. Earlier builds tinted the tab bar with each day's
 * per-sermon-type accent (warm orange for Daily Church, royal
 * violet for Jesus Only, etc.) but the user pulled that — the
 * one consistent red across every surface reads as the app's
 * single brand mark, not "today's sermon tinted everything."
 */
const TAB_BAR_ACCENT = "#E11D48";

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
 * Focus chrome lives here too: a FocusMiniPlayer floats above the
 * tab bar whenever a focus session is active, replacing the old
 * top-anchored GlobalFocusBanner. Bottom-anchoring keeps the top of
 * every tab free for its own hero content (page titles, scripture
 * cards, sermon images) while still surfacing a live status + End
 * control everywhere the user navigates.
 */
export default function TabsLayout() {
  const colors = useColors();

  return (
    // Layered structure (back → front):
    //   1. Outer View with backgroundColor=colors.bg — true-black
    //      Apple dark-app canvas. (Previously each tab's SafeAreaView
    //      painted its own bg-bg; we moved it up here so the
    //      whole tabs area shares a single black canvas.)
    //   2. Tabs container — the actual tab screens. Each tab's
    //      SafeAreaView is TRANSPARENT (no bg-bg) so the canvas
    //      bleeds through cleanly.
    //   3. FocusMiniPlayer — floats above tabs when active.
    //
    // Quick-reset note: an earlier iteration mounted an
    // <AmbientAtmosphere accent={sermonType.accent} /> here that
    // washed the top of every tab with the day's sermon color.
    // The user pulled it out for the Apple Fitness pass — the
    // dark apps land on TRUE black with content carrying all the
    // color (per-day tint lives in the tab-bar accent and stat
    // colors instead). Re-adding it is a one-line change if we
    // ever want the ambient back, but the component import is
    // removed so the change is visible in a diff.
    //
    // FocusMiniPlayer + mini-player rationale stays the same:
    // mounted INSIDE the layout (rather than at the root) so
    // react-native-screens' native view controllers don't occlude
    // the sibling on iOS.
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{
            headerShown: false,
            // CRITICAL: explicitly set sceneStyle bg to TRANSPARENT
            // so the outer View's colors.bg + AmbientAtmosphere
            // bleed through to each tab.
            //
            // Expo Router's Tabs (built on react-native-screens via
            // bottom-tabs) defaults each tab's scene container to a
            // SYSTEM bg color. On iOS 26 with userInterfaceStyle="dark"
            // this should be black — but in practice the scene
            // container paints a SYSTEM LIGHT (cream/white) bg unless
            // we override it. That white slab sits ON TOP of our
            // outer View + atmosphere, killing dark mode.
            //
            // We saw this as: home shows a cream/lavender bg with
            // white text fading into it; verse-card bg (7% accent
            // alpha) reads as lavender instead of dark-purple;
            // every other tab (Practice, Library, Insights) hit the
            // same washout. Profile drawer + onboarding screens
            // weren't affected because they're outside the Tabs
            // navigator.
            //
            // Transparent here means the scene paints nothing of its
            // own; the parent View's colors.bg + the absolutely-
            // positioned AmbientAtmosphere are the only things you
            // see behind tab content. Don't change this without
            // re-testing every tab in light AND dark mode.
            sceneStyle: { backgroundColor: "transparent" },
          }}
          tabBar={(props) => (
            <GlassTabBar {...props} accent={TAB_BAR_ACCENT} />
          )}
        >
        <Tabs.Screen
          name="today"
          options={{
            title: "Home",
            tabBarIcon: ({ color }) => <TodayIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: "Library",
            tabBarIcon: ({ color }) => <LibraryIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
          }}
        />
        </Tabs>
      </View>
      <FocusMiniPlayer />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab icons — stroke-based, 22px, single-color (tinted by tab state)
// ─────────────────────────────────────────────────────────────────

const ICON_SIZE = 22;
const STROKE_W = 1.8;

function TodayIcon({ color }: { color: ColorValue }) {
  // House outline — anchors the "Home" tab. Picked over the older
  // sunrise glyph after the tab was relabeled Home (sun-over-
  // horizon read as "daily" / "morning", not a destination).
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6h-6v6H5a1 1 0 01-1-1v-9z"
        stroke={color}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function LibraryIcon({ color }: { color: ColorValue }) {
  // Stacked books — three slim verticals
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 4h2v16H5zM10 4h2v16h-2zM15.5 5l1.9-.5 3 13.5-1.9.5z"
        stroke={color}
        strokeWidth={STROKE_W}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ProfileIcon({ color }: { color: ColorValue }) {
  // Person — circle head + rounded shoulders. iOS-canonical
  // "profile" glyph; reads clean at 22pt without competing with
  // the Library books or the Home house glyph.
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 12a4 4 0 100-8 4 4 0 000 8z"
        stroke={color}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 21c0-4 4-7 8-7s8 3 8 7"
        stroke={color}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
