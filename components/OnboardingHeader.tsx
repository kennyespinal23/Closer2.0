import { Pressable, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";

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
        <Pressable
          hitSlop={14}
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full items-center justify-center bg-surface border border-border"
        >
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 18l-6-6 6-6"
              stroke={colors.ink}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>

        {/* Progress track */}
        <View className="flex-1 ml-4 h-[3px] bg-border rounded-full overflow-hidden">
          <View
            className="h-full bg-primary rounded-full"
            style={{ width: `${clamped * 100}%` }}
          />
        </View>
      </View>
    </View>
  );
}
