import { Stack } from "expo-router";
import { useColors } from "@/state/theme";

/**
 * Nested stack for the `/book/[id]` route.
 *
 * Each book detail (and, eventually, each chapter / reader) lives
 * inside this group so the outer Stack can give the whole group a
 * single, consistent entrance animation (slide-from-right, configured
 * on the matching <Stack.Screen name="book" /> in app/_layout.tsx).
 */
export default function BookLayout() {
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
