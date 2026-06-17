import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as haptics from "@/lib/haptics";
import { SFSymbol } from "@/components/Symbol";
import { StreakDashboard } from "@/components/StreakDashboard";
import { useColors } from "@/state/theme";

/**
 * Rhythm modal — the streak/reading-history dashboard.
 *
 * Presented as a modal (slide_from_bottom, configured in
 * app/_layout.tsx). Chrome here is intentionally light: an X
 * close affordance on the leading edge + a centered "Rhythm"
 * title. The dashboard body is the same `<StreakDashboard />`
 * component the post-sermon /sermon/streak screen renders, so
 * the two surfaces never visually drift apart — change the
 * dashboard once, both screens update.
 *
 * Why the same body as the post-sermon screen:
 *   The information is identical (current streak, week strip,
 *   month grid, soon-features). The original /rhythm shipped
 *   with its own custom layout (Lottie flame on the right, day
 *   number on the left, two stat tiles, custom calendar cells).
 *   Design review unified them on the iOS-native "Streaks"
 *   dashboard pattern shown in the reference Bible-app screen
 *   we were targeting, so /rhythm now renders the same body as
 *   the post-sermon /sermon/streak — one source of visual
 *   truth, one source of layout truth.
 *
 * Chrome differences vs /sermon/streak:
 *   • Modal X (xmark) on the leading edge, not a back chevron
 *     — Apple's modal-dismiss convention (App Store details,
 *       Apple Music now-playing, Maps location card all use the
 *       same filled-circle xmark).
 *   • No entrance haptic — the modal slide-up is the entrance
 *     cue; firing a haptic on top of that would feel doubled.
 *   • No fade-in motion — the modal's own slide is the
 *     entrance choreography; layering an opacity fade on the
 *     body would feel redundant against the slide.
 */
export default function RhythmModalScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top", "bottom"]}
    >
      {/* Nav bar — same shape as the Streaks screen's bar but
          with an X close instead of a back chevron. The X is
          Apple's "this is a sheet; tap to dismiss" affordance,
          painted as a filled-circle chip on `surfaceSecondary`
          so the chip recipe stays consistent with every other
          leading-edge dismiss in the app (SettingsScaffold,
          /sermon/streak, etc.). */}
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <Pressable
          onPress={() => {
            haptics.soft();
            router.back();
          }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close rhythm"
          style={({ pressed }) => ({
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: colors.surfaceSecondary,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <SFSymbol
            name="xmark"
            size={14}
            color={colors.ink}
            weight="semibold"
          />
        </Pressable>
        <Text
          style={{
            color: colors.ink,
            fontFamily: "System",
            fontWeight: "700",
            fontSize: 17,
            flex: 1,
            textAlign: "center",
          }}
        >
          Streaks
        </Text>
        <View style={{ width: 36, height: 36 }} />
      </View>

      {/* Shared dashboard body — no day-count override (we
          always show the user's real current streak when the
          screen is opened from a "Streaks" tap rather than the
          post-sermon deep link). */}
      <StreakDashboard />
    </SafeAreaView>
  );
}
