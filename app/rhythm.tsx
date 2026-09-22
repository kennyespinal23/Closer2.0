import { StatusBar } from "expo-status-bar";
import { useColors, useResolvedScheme } from "@/state/theme";
import { useCallback } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ModalNavBar } from "@/components/ModalNavBar";
import { StreakDashboard } from "@/components/StreakDashboard";

/**
 * Rhythm modal — the streak/reading-history dashboard.
 *
 * Presented as a modal (slide_from_bottom, configured in
 * app/_layout.tsx). Chrome here is intentionally light: an X
 * close affordance on the leading edge + a centered "Streaks"
 * title. The dashboard body is the same `<StreakDashboard focusMoments={section === "moments"} />`
 * component the post-sermon /sermon/streak screen renders, so
 * the two surfaces never visually drift apart — change the
 * dashboard once, both screens update.
 */
export default function RhythmModalScreen() {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const router = useRouter();
  const { section } = useLocalSearchParams<{ section?: string }>();

  const close = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/today");
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <ModalNavBar title="Streaks & Moments" onClose={close} />

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <StreakDashboard focusMoments={section === "moments"} />
      </SafeAreaView>
    </View>
  );
}
