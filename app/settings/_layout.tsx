import { Stack } from "expo-router";
import { useColors } from "@/state/theme";

/**
 * Nested stack for the `/settings/*` group.
 *
 * Currently each settings page is a leaf (you never navigate from
 * Privacy to Appearance, say) — so this layout exists mostly to
 * group the routes for the outer router. The outer Stack
 * (app/_layout.tsx) is the one that controls the slide-from-right
 * animation used when entering the group from the profile drawer.
 */
export default function SettingsLayout() {
  const { bg } = useColors();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: bg },
        animation: "slide_from_right",
      }}
    />
  );
}
