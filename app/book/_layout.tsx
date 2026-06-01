import { View } from "react-native";
import { Stack } from "expo-router";
import {
  GlobalFocusBanner,
  useGlobalFocusBannerSpacing,
} from "@/components/GlobalFocusBanner";
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
 * The GlobalFocusBanner is mounted here so a focus session in
 * progress stays visible while the user is browsing book covers
 * or reading a chapter. The Stack navigator is wrapped in an inner
 * View whose paddingTop reserves room for the banner pill — same
 * per-layout pattern used in (tabs) and settings. See
 * GlobalFocusBanner.tsx for why the banner can't live at the root.
 */
export default function BookLayout() {
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
