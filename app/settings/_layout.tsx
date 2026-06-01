import { View } from "react-native";
import { Stack } from "expo-router";
import {
  GlobalFocusBanner,
  useGlobalFocusBannerSpacing,
} from "@/components/GlobalFocusBanner";
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
 * The GlobalFocusBanner is mounted here so a focus session in
 * progress stays visible while the user is inside any settings
 * screen. The Stack navigator is wrapped in an inner View whose
 * paddingTop reserves room for the banner pill — same per-layout
 * pattern used in (tabs) and book. See GlobalFocusBanner.tsx for
 * why the banner can't live at the root.
 */
export default function SettingsLayout() {
  const { bg } = useColors();
  const bannerSpacing = useGlobalFocusBannerSpacing();
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View style={{ flex: 1, paddingTop: bannerSpacing }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: bg },
            animation: "slide_from_right",
          }}
        />
      </View>
      <GlobalFocusBanner />
    </View>
  );
}
