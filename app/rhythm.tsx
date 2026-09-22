import { StatusBar } from "expo-status-bar";
import { useColors, useResolvedScheme } from "@/state/theme";
import { useCallback } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ModalNavBar } from "@/components/ModalNavBar";
import { StreakDashboard } from "@/components/StreakDashboard";

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
      <ModalNavBar title="Your Journey" onClose={close} />

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <StreakDashboard journey focusMoments={section === "moments"} focusBadges={section === "badges"} />
      </SafeAreaView>
    </View>
  );
}
