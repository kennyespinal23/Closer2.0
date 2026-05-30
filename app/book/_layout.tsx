import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

/**
 * Nested stack for the `/book/[id]` route.
 *
 * Each book detail (and, eventually, each chapter / reader) lives
 * inside this group so the outer Stack can give the whole group a
 * single, consistent entrance animation (slide-from-right, configured
 * on the matching <Stack.Screen name="book" /> in app/_layout.tsx).
 */
export default function BookLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    />
  );
}
