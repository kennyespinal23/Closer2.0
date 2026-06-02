import { View } from "react-native";
import { Stack } from "expo-router";
import { FocusMiniPlayer } from "@/components/FocusMiniPlayer";
import { useColors } from "@/state/theme";

/**
 * Nested stack for the `/book/[id]` route.
 *
 * Each book detail (and, eventually, each chapter / reader) lives
 * inside this group so the outer Stack can give the whole group a
 * single, consistent entrance animation (slide-from-right,
 * configured on the matching <Stack.Screen name="book" /> in
 * app/_layout.tsx).
 *
 * The FocusMiniPlayer is mounted here (with aboveTabBar={false},
 * since this stack pushes OVER the tabs and no GlassTabBar is
 * visible) so an active focus session keeps a persistent "now
 * playing" strip while the user browses chapters or reads. The
 * mini-player replaces the top-anchored GlobalFocusBanner that
 * used to sit here — a bottom strip preserves the full top of the
 * screen for the book reader's hero image + chapter title, which
 * the banner used to push down 60pt.
 *
 * Same per-layout mounting pattern as in (tabs) and settings —
 * mini-player MUST live inside a layout's screen container (not
 * at the root) because react-native-screens' native view
 * controllers occlude root-level React siblings on iOS.
 */
export default function BookLayout() {
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
