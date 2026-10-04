import { View } from "react-native";
import { BubbleBackButton } from "@/components/BubbleBackButton";
import { useRouter } from "expo-router";

type OnboardingHeaderProps = {
  /** 0..1 fraction of the flow completed */
  progress: number;
};

export function OnboardingHeader({ progress }: OnboardingHeaderProps) {
  const router = useRouter();
  const clamped = Math.max(0, Math.min(1, progress));

  return (
    <View className="px-6 pt-2 pb-4">
      <View className="flex-row items-center">
        <BubbleBackButton onPress={() => router.back()} />

        {/* Progress track */}
        <View className="flex-1 ml-4 h-[8px] bg-border rounded-full overflow-hidden">
          <View
            className="h-full bg-primary rounded-full"
            style={{ width: `${clamped * 100}%` }}
          />
        </View>
      </View>
    </View>
  );
}
