import { View } from "react-native";
import { Tabs, useRouter, useSegments } from "expo-router";
import Svg, { Circle, Path } from "react-native-svg";
import { GlassTabBar } from "@/components/GlassTabBar";
import {
  GlobalFocusBanner,
  isGlobalBannerHiddenForRoute,
} from "@/components/GlobalFocusBanner";

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
 */
export default function TabsLayout() {
  const router = useRouter();
  // Track which tab is currently active so we can suppress the
  // global floating focus banner on Today (which has its own
  // inline FocusToggle pill and shouldn't double up). useSegments
  // returns the path segments under the current router state —
  // inside this layout, segments[1] is the active tab name
  // ("today", "journey", "library", "insights", or "checkin").
  const segments = useSegments();
  const activeTab = segments[1];
  const hideGlobalBanner = isGlobalBannerHiddenForRoute(activeTab);

  return (
    // The wrapping View hosts the Tabs navigator AND the floating
    // GlobalFocusBanner side by side. The banner is absolute-
    // positioned and uses pointerEvents="box-none" internally so
    // taps that miss the pill pass through to the tab's content.
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
        <Tabs.Screen
          name="journey"
          options={{
            title: "Journey",
            tabBarIcon: ({ color }) => <JourneyIcon color={color} />,
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
      {/* Global focus banner — floats at the top of the active
          tab when a focus session is in progress. Mounted after
          <Tabs /> so it sits above the tab content in the z-order
          (RN stacks later siblings on top). The banner's own
          conditional render handles the "no session" case, and
          we additionally suppress it on Today to avoid stacking
          with the inline FocusToggle pill. */}
      {!hideGlobalBanner && <GlobalFocusBanner />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Tab icons — stroke-based, 22px, single-color (tinted by tab state)
// ─────────────────────────────────────────────────────────────────

const ICON_SIZE = 22;
const STROKE_W = 1.8;

function TodayIcon({ color }: { color: string }) {
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

function PlusIcon({ color }: { color: string }) {
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

function JourneyIcon({ color }: { color: string }) {
  // Vertical timeline — three small dots on a single line. Echoes
  // exactly what the Journey screen draws so the icon reads as a
  // miniature of the destination.
  return (
    <Svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 4v16"
        stroke={color}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
      />
      <Circle cx={7} cy={6} r={2} fill={color} />
      <Circle cx={7} cy={12} r={2} fill={color} />
      <Circle cx={7} cy={18} r={2} fill={color} />
      <Path
        d="M12 6h7M12 12h5M12 18h7"
        stroke={color}
        strokeWidth={STROKE_W}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function LibraryIcon({ color }: { color: string }) {
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

function InsightsIcon({ color }: { color: string }) {
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
