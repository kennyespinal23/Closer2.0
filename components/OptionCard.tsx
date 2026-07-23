import { Pressable, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { minTouchTarget, spacing } from "@/constants/spacing";
import { CLOSER_ACCENT } from "@/constants/theme";
import { typography } from "@/lib/typography";
import { useColors } from "@/state/theme";

type OptionCardProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * Single-select choice card used across onboarding (why, denomination,
 * faithstage, attribution, waketime, scrolltime, …).
 *
 * Selected state uses `CLOSER_ACCENT`. Layout lives on an inner View —
 * Pressable function-form style drops layout in this app.
 */
export function OptionCard({ label, selected, onPress }: OptionCardProps) {
  const colors = useColors();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
    >
      <View
        style={{
          minHeight: minTouchTarget,
          borderRadius: spacing[16],
          paddingHorizontal: spacing[16],
          paddingVertical: spacing[16],
          borderWidth: 2,
          flexDirection: "row",
          alignItems: "center",
          borderColor: selected ? CLOSER_ACCENT : colors.border,
          backgroundColor: selected
            ? "rgba(255, 67, 38, 0.10)"
            : colors.surface,
        }}
      >
        <Text
          style={[
            typography.body,
            {
              flex: 1,
              color: colors.ink,
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
              backgroundColor: CLOSER_ACCENT,
            }}
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
      </View>
    </Pressable>
  );
}
