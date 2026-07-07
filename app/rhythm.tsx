import { useCallback } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ModalNavBar } from "@/components/ModalNavBar";
import { StreakDashboard } from "@/components/StreakDashboard";
import { useColors } from "@/state/theme";

/**
 * Rhythm modal — the streak/reading-history dashboard.
 *
 * Presented as a modal (slide_from_bottom, configured in
 * app/_layout.tsx). Chrome here is intentionally light: an X
 * close affordance on the leading edge + a centered "Streaks"
 * title. The dashboard body is the same `<StreakDashboard />`
 * component the post-sermon /sermon/streak screen renders, so
 * the two surfaces never visually drift apart — change the
 * dashboard once, both screens update.
 */
export default function RhythmModalScreen() {
  const router = useRouter();
  const colors = useColors();

  const close = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/today");
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ModalNavBar title="Streaks" onClose={close} />

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <StreakDashboard />
      </SafeAreaView>
    </View>
  );
}
