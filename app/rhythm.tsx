import { SkyGradient } from "@/components/HomeSkyGradient";
import { StatusBar } from "expo-status-bar";
import { useColors, useResolvedScheme } from "@/state/theme";
import { useCallback, useState } from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { ModalNavBar } from "@/components/ModalNavBar";
import { contentLayout } from "@/lib/contentStyles";
import { JourneyCollection } from "@/components/JourneyCollection";
import { MomentsAlbum } from "@/components/MomentsAlbum";

export default function RhythmModalScreen() {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const router = useRouter();
  const { section, preview } = useLocalSearchParams<{ section?: string; preview?: string }>();
  const [replay, setReplay] = useState(0);
  const isPreview = preview === "streak";

  const close = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace("/(tabs)/today");
  }, [router]);

  // Bible Moments is its own album with a dark cover; it draws its own close button.
  if (section === "moments" && !isPreview) return <View style={{ flex: 1 }}><StatusBar style="light" /><MomentsAlbum onClose={close} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SkyGradient />
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <ModalNavBar title={isPreview ? "Streak preview" : section === "moments" ? "Bible Moments" : "Streaks"} horizontalPadding={contentLayout.gutter} onClose={close} />

      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <JourneyCollection key={replay} preview={isPreview} onContinue={isPreview ? () => setReplay(value => value + 1) : close} focusMoments={section === "moments"} />
      </SafeAreaView>
    </View>
  );
}
