import { Stack } from "expo-router";

/**
 * Sermon flow layout.
 *
 * Lives at the root of `app/` (NOT inside `(tabs)`) so the tab bar
 * hides during the focused reading experience. The scripture screen
 * is now the FIRST beat of the sermon (the antechamber intro page
 * was retired so Begin on home → verse directly); subsequent panel
 * screens slide in horizontally to reinforce a sense of forward
 * motion through the sermon — with one exception: the prayer panel
 * (panel/5) is reached from the pray-together interstitial via a
 * cross-fade rather than a slide, so the closing breath doesn't
 * arrive as another horizontal page turn. See the panel/[id]
 * options below for the per-param animation switch.
 */
export default function SermonLayout() {
  return (
    <Stack
        screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "transparent" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="scripture"
        options={{
          // Quiet fade into the verse — the scripture screen is a
          // reverent quote beat (and now the entry point to the
          // sermon flow). The fade reads as "the room settles
          // around this verse" rather than a horizontal page slide.
          animation: "fade",
        }}
      />
      <Stack.Screen
        name="pray-together"
        options={{
          // Reverent pause beat between the Landing panel and the
          // Prayer panel. Fade in (same treatment as scripture) so
          // the screen "settles" into the prayer rather than
          // sliding in horizontally. Gesture disabled — the screen
          // auto-advances and the only intentional exit is the
          // close X; swiping back mid-breath cycle would break
          // the rhythm.
          animation: "fade",
          gestureEnabled: false,
        }}
      />
      <Stack.Screen
        name="panel/[id]"
        options={({ route }) => {
          // Narrative panels (1-4) slide in from the right — the
          // forward-motion cue that carries the reader through
          // the sermon's beats. The prayer panel (panel/5)
          // arrives from the pray-together interstitial which
          // appends `?fade=1` to its replace target; when that
          // sentinel is present we swap the slide for a cross-
          // fade so the closing prayer settles in rather than
          // sliding past as one more page turn.
          const params = (route.params as Record<string, unknown>) ?? {};
          const isFade = params.fade === "1" || params.fade === 1;
          return {
            animation: isFade ? "fade" : "slide_from_right",
          };
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
