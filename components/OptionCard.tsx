import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { colors } from "@/constants/theme";

type OptionCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * Single-select choice card.
 *
 * - 2px border in both states so selection doesn't shift layout
 * - Subtle orange tint + bright orange border when selected
 * - Tiny checkmark glyph on the right confirms selection without
 *   needing a separate label
 */
export function OptionCard({ label, selected, onPress }: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={[
        "rounded-2xl px-5 py-4 border-2 flex-row items-center active:opacity-80",
        selected
          ? "border-primary bg-accent-soft"
          : "border-border bg-surface",
      ].join(" ")}
    >
      <Text
        className="flex-1 text-ink text-[16px] leading-[22px]"
        style={{
          fontFamily: selected
            ? "PlusJakartaSans_600SemiBold"
            : "PlusJakartaSans_500Medium",
        }}
      >
        {label}
      </Text>

      {selected ? (
        <View className="ml-3 w-6 h-6 rounded-full items-center justify-center bg-primary">
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 12.5l4.5 4.5L19 7"
              stroke={colors.primaryFg}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      ) : null}
    </Pressable>
  );
}
