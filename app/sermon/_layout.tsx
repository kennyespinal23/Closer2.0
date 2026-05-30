import { Stack } from "expo-router";
import { colors } from "@/constants/theme";

/**
 * Sermon flow layout.
 *
 * Lives at the root of `app/` (NOT inside `(tabs)`) so the tab bar hides
 * during the focused reading experience. The intro screen presents like
 * a modal antechamber; subsequent step screens slide in horizontally to
 * reinforce a sense of forward motion through the sermon.
 */
export default function SermonLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="intro"
        options={{
          // The intro feels more like opening a book than turning a page.
          animation: "fade_from_bottom",
        }}
      />
      <Stack.Screen
        name="complete"
        options={{
          // The celebration is a terminal beat — no swiping back into
          // the closing prayer to re-tap Amen. Fade in for a softer
          // arrival.
          animation: "fade",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="streak"
        options={{
          // Streak update screen — chained after /complete whenever
          // the streak actually advanced. Same "terminal beat"
          // treatment: fade in, no back-swipe into the celebration.
          animation: "fade",
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}
