import { View, type ColorValue } from "react-native";
import { Tabs, useRouter } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { AmbientAtmosphere } from "@/components/AmbientAtmosphere";
import { GlassTabBar } from "@/components/GlassTabBar";
import { FocusMiniPlayer } from "@/components/FocusMiniPlayer";
import { resolveSermonType } from "@/lib/moments";
import { useMoments } from "@/state/moments";
import { useColors } from "@/state/theme";

/**
 * Bottom-tab layout for the main app.
 *
 * Five "cells" in the bar (Today / Journey / + / Library / Insights),
 * but only four of them are real tabs. The center "+" is a
 * full-screen check-in modal — we register it as a Tabs.Screen so
 * the GlassTabBar's row layout reserves a slot for it, then
 * intercept its press via `tabPress` and `router.push("/check-in")`
 * instead of letting React Navigation flip the focused index. The
 * placeholder `checkin.tsx` file redirects home in case the route
 * is ever reached directly.
 *
 * Journey sits second so the day-flow reads as "what's today" →
 * "what have I done" → quick check-in → "what to read" → "how am
 * I trending". The old Profile tab was removed — profile lives in
 * a presented sheet opened from the home screen's top-left avatar.
 *
 * GlassTabBar renders the cell at `name === "checkin"` as a raised
 * accent FAB instead of the standard icon+label cell.
 *
 * Focus chrome lives here too: a FocusMiniPlayer floats above the
 * tab bar whenever a focus session is active, replacing the old
 * top-anchored GlobalFocusBanner. Bottom-anchoring keeps the top of
 * every tab free for its own hero content (page titles, scripture
 * cards, sermon images) while still surfacing a live status + End
 * control everywhere the user navigates.
 */
export default function TabsLayout() {
  const router = useRouter();
  const colors = useColors();
  // Pull today's sermon type so the ambient atmosphere can pick
  // up the day's accent — the WHOLE tabs experience (Today,
  // Practice, Library, Insights) now glows with the same per-day
  // color, so the app reads as one continuous lit space rather
  // than four flat-black tabs. Re-evaluates when the day changes.
  const { todaysMoment } = useMoments();
  const sermonType = resolveSermonType(todaysMoment.type);

  return (
    // Layered structure (back → front):
    //   1. Outer View with backgroundColor=colors.bg — this is
    //      now the page bg paint surface. (Previously each tab's
    //      SafeAreaView painted its own bg-bg; we moved it here
    //      so the AmbientAtmosphere can sit between the bg and
    //      the tab content.)
    //   2. AmbientAtmosphere — per-day accent wash anchored to
    //      the top of the screen. Behind every tab.
    //   3. Tabs container — the actual tab screens. Each tab's
    //      SafeAreaView is now TRANSPARENT (no bg-bg) so the
    //      atmosphere bleeds through.
    //   4. FocusMiniPlayer — floats above tabs when active.
    //
    // FocusMiniPlayer + mini-player rationale stays the same as
    // the previous comment: mounted INSIDE the layout (rather
    // than at the root) so react-native-screens' native view
    // controllers don't occlude the sibling on iOS.
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AmbientAtmosphere accent={sermonType.accent} />
      <View style={{ flex: 1 }}>
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={(props) => <GlassTabBar {...props} />}
        >
        <Tabs.Screen
          name="today"
          options={{
            title: "Today",
            tabBarIcon: ({ color }) => <TodayIcon color={color} />,
          }}
        />
        {/* The route file is still `journey.tsx` (we kept the
            path stable so existing deep-links and routing
            patterns don't break), but the screen now hosts the
            "Practice" hub — study sessions + saved verses +
            notes. Title + icon are updated accordingly. */}
        <Tabs.Screen
          name="journey"
          options={{
            title: "Practice",
            tabBarIcon: ({ color }) => <PracticeIcon color={color} />,
          }}
        />
        <Tabs.Screen
          name="checkin"
          options={{
            // Title isn't shown on the FAB cell, but accessibility
            // tools and the default tab bar (if ever surfaced) need
            // a meaningful label.
            title: "Check-in",
            // Icon isn't shown either (the FAB has its own glyph),
            // but provided so the type contract is satisfied.
            tabBarIcon: ({ color }) => <PlusIcon color={color} />,
          }}
          listeners={{
            // Open the modal instead of switching tabs. preventDefault
            // stops React Navigation from updating state.index, which
            // would otherwise cause the GlassTabBar bubble to slide to
            // a tab that should never be "focused".
            tabPress: (e) => {
              e.preventDefault();
              router.push("/check-in");
            },
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
          name="insights"
          options={{
            title: "Insights",
            tabBarIcon: ({ color }) => <InsightsIcon color={color} />,
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
  // Sunrise — a small sun arc rising over a horizon line.
  // Echoes the brand's "quiet morning" motif.
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={14} r={4} stroke={color} strokeWidth={STROKE_W} />
      <Path
        d="M3 18h18M12 4v2M5 7l1.5 1.5M19 7l-1.5 1.5"
        stroke={color}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PlusIcon({ color }: { color: ColorValue }) {
  // Fallback icon for the check-in cell — used only by accessibility
  // tools and any non-glass tab bar; the real FAB visual lives in
  // GlassTabBar (white plus on accent disc).
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function PracticeIcon({ color }: { color: ColorValue }) {
  // Bookmarked-page glyph — a sheet with a small ribbon. Reads as
  // "the things you've set aside / kept" which is exactly what
  // the Practice tab contains (study sessions, saved verses, notes).
  // Picked over a generic checklist or notebook so it doesn't
  // collide with the Library tab's stacked-books glyph or the
  // Insights tab's bars.
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 4h9l4 4v12H6z"
        stroke={color}
        strokeWidth={STROKE_W}
        strokeLinejoin="round"
      />
      <Path
        d="M11 4v6l2-1.5L15 10V4"
        stroke={color}
        strokeWidth={STROKE_W}
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

function InsightsIcon({ color }: { color: ColorValue }) {
  // Three ascending bars — reflects "your rhythm" / journey data.
  // Reads cleanly at 22px and pairs visually with the breakdown list.
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 20V13M12 20V8M19 20V4"
        stroke={color}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
      />
    </Svg>
  );
}
