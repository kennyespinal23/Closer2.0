import { View } from "react-native";
import { Stack } from "expo-router";
import { useColors } from "@/state/theme";

/**
 * Onboarding stack layout.
 *
 * Light-mode canvas only — no ambient gradient overlay. Each
 * screen paints on colors.bg (warm cream) with dark ink.
 */
export default function OnboardingLayout() {
  const { bg } = useColors();
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: bg },
          animation: "slide_from_right",
        }}
      />
    </View>
  );
}
