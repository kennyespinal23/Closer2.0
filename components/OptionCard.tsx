import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { minTouchTarget, spacing } from "@/constants/spacing";
import { typography } from "@/lib/typography";

type OptionCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * Single-select choice card used across onboarding (why, denomination,
 * faithstage, attribution, waketime, scrolltime, …).
 *
 * Kept as branded cards (not a system list) — the blue check + tinted
 * selected state is intentional chrome across the narrative flow.
 * Spacing + 44pt touch floor come from `constants/spacing.ts`.
 */
export function OptionCard({ label, selected, onPress }: OptionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        minHeight: minTouchTarget,
        borderRadius: spacing[16],
        paddingHorizontal: spacing[16],
        paddingVertical: spacing[16],
        borderWidth: 2,
        flexDirection: "row",
        alignItems: "center",
      }}
      className={[
        "active:opacity-80",
        selected
          ? "border-select bg-select-soft"
          : "border-border bg-surface",
      ].join(" ")}
    >
      <Text
        className="flex-1 text-ink"
        style={[
          typography.body,
          {
            fontSize: 16,
            lineHeight: 22,
            fontWeight: selected ? "600" : "500",
          },
        ]}
      >
        {label}
      </Text>

      {selected ? (
        <View
          style={{
            marginLeft: spacing[12],
            width: spacing[24],
            height: spacing[24],
            borderRadius: spacing[12],
            alignItems: "center",
            justifyContent: "center",
          }}
          className="bg-select"
        >
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 12.5l4.5 4.5L19 7"
              stroke="#FFFFFF"
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
