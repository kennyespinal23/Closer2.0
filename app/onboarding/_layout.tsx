import { Stack } from "expo-router";
import { useColors } from "@/state/theme";

export default function OnboardingLayout() {
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
