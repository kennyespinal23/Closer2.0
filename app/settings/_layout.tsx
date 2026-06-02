import { View } from "react-native";
import { Stack } from "expo-router";
import { FocusMiniPlayer } from "@/components/FocusMiniPlayer";
import { useColors } from "@/state/theme";

/**
 * Nested stack for the `/settings/*` group.
 *
 * Currently each settings page is a leaf (you never navigate from
 * Privacy to Appearance, say) — so this layout exists mostly to
 * group the routes for the outer router. The outer Stack
 * (app/_layout.tsx) is the one that controls the slide-from-right
 * animation used when entering the group from the profile drawer.
 *
 * The FocusMiniPlayer is mounted here (aboveTabBar={false}, since
 * the settings stack pushes OVER the tabs and no GlassTabBar is
 * visible) so an active focus session keeps a persistent "now
 * playing" strip while the user manages preferences. The
 * mini-player replaces the top-anchored GlobalFocusBanner that
 * used to sit here — moving it to the bottom keeps the top of
 * every settings page free for its own SettingsScaffold header.
 *
 * Same per-layout mounting pattern as in (tabs) and book — the
 * mini-player MUST live inside a layout's screen container (not at
 * the root) because react-native-screens' native view controllers
 * occlude root-level React siblings on iOS.
 */
export default function SettingsLayout() {
  const { bg } = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: bg },
            animation: "slide_from_right",
          }}
        />
      </View>
      <FocusMiniPlayer aboveTabBar={false} />
    </View>
  );
}
