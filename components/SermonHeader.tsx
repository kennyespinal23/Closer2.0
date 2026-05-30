import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { colors } from "@/constants/theme";

type SermonHeaderProps = {
  /** 0..1 fraction of the sermon completed. Omit/undefined for the intro screen. */
  progress?: number;
  /** Step number for display, e.g. { index: 2, total: 5 }. Omit for intro. */
  step?: { index: number; total: number };
};

/**
 * Sermon header — used by both the intro (no progress) and the in-sermon
 * step screens (with a thin progress bar + step counter).
 *
 * Left side: an X that exits the entire sermon flow and drops the user
 * back into the Today tab. We use `replace` so the sermon stack is gone
 * — a swipe-back gesture shouldn't resurrect it.
 */
export function SermonHeader({ progress, step }: SermonHeaderProps) {
  const router = useRouter();
  const showProgress = typeof progress === "number";
  const clamped = showProgress ? Math.max(0, Math.min(1, progress!)) : 0;

  const handleClose = () => {
    router.replace("/today");
  };

  return (
    <View className="px-6 pt-2 pb-4">
      <View className="flex-row items-center">
        <Pressable
          hitSlop={14}
          onPress={handleClose}
          className="w-10 h-10 rounded-full items-center justify-center bg-surface border border-border"
        >
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 6l12 12M6 18L18 6"
              stroke={colors.ink}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>

        {showProgress ? (
          <>
            <View className="flex-1 ml-4 h-[3px] bg-border rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${clamped * 100}%` }}
              />
            </View>
            {step && (
              <Text
                className="text-ink-subtle text-[11px] ml-3 tracking-[1px]"
                style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
              >
                {step.index}/{step.total}
              </Text>
            )}
          </>
        ) : (
          // Spacer — keeps the X aligned to the left when no progress shown.
          <View className="flex-1" />
        )}
      </View>
    </View>
  );
}
