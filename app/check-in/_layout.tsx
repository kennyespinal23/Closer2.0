import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

/**
 * Check-in modal stack.
 *
 * Lives at the root of `app/` (not inside `(tabs)`) so the tab bar
 * is hidden during the check-in moment. The user enters from the
 * "+" FAB in the bottom navigation; the modal slides up from the
 * root layout. Inside, we have a two-step flow:
 *
 *   index.tsx     — "How are you?" mood grid (3×4)
 *   [mood].tsx    — verse delivery for the chosen mood
 *
 * The transition between the two steps slides right (Apple drill-
 * down feel) — they're conceptually a single decision, just split
 * across two surfaces.
 */
export default function CheckInLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          // Index is the entrypoint of the modal — it should feel
          // like the start of the experience, not a screen we slid
          // into. Fade so the mood grid lands with the modal itself.
          animation: "fade",
        }}
      />
    </Stack>
  );
}
