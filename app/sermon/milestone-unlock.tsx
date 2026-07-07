import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { MilestoneUnlockView } from "@/components/MilestoneUnlockView";
import { SermonBlurredBackdrop } from "@/components/SermonBlurredBackdrop";
import { getMilestoneByDay, getMilestoneIndex } from "@/lib/milestones";
import * as haptics from "@/lib/haptics";

/**
 * Milestone unlock — always shown AFTER the streak screen when a
 * completion crosses a milestone threshold. Chains from
 * `/sermon/streak` via the `milestone` param forwarded from
 * `/sermon/complete`.
 */
export default function MilestoneUnlockScreen() {
  const router = useRouter();
  const { day: dayParam } = useLocalSearchParams<{ day?: string }>();
  const day = Number(dayParam);
  const milestone = Number.isFinite(day) ? getMilestoneByDay(day) : undefined;

  if (!milestone) {
    router.replace("/today");
    return null;
  }

  const goHome = () => {
    haptics.soft();
    router.replace("/today");
  };

  const viewMilestone = () => {
    haptics.soft();
    router.push(`/milestone/${milestone.day}`);
  };

  return (
    <View style={{ flex: 1 }}>
      <SermonBlurredBackdrop />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <MilestoneUnlockView
          milestone={milestone}
          badgeIndex={getMilestoneIndex(milestone)}
          onViewMilestone={viewMilestone}
        />
        <View className="px-6 pb-2">
          <Button label="Continue" onPress={goHome} />
        </View>
      </SafeAreaView>
    </View>
  );
}
