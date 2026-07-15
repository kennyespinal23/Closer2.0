import { Pressable, Text } from "react-native";
import { minTouchTarget, spacing } from "@/constants/spacing";

type TimeCardProps = {
  label: string;
  meta: string;
  selected: boolean;
  onPress: () => void;
};

/**
 * Compact two-line time picker tile (sermon time / study time).
 * Same selection language as `OptionCard` — dark surface + blue
 * tint when selected. Shared so onboarding time screens stay in sync.
 */
export function TimeCard({ label, meta, selected, onPress }: TimeCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${meta}`}
      accessibilityState={{ selected }}
      style={{ flex: 1, minHeight: minTouchTarget }}
      className={[
        "rounded-2xl items-center border-2 active:opacity-80",
        selected
          ? "bg-select-soft border-select"
          : "bg-accent-soft border-border-strong",
      ].join(" ")}
    >
      <Text
        className="text-ink"
        style={{
          fontFamily: "System",
          fontWeight: "700",
          fontSize: 22,
          letterSpacing: -0.3,
          marginTop: spacing[16],
        }}
      >
        {label}
      </Text>
      <Text
        className="text-ink-muted"
        style={{
          fontFamily: "System",
          fontWeight: "500",
          fontSize: 12,
          marginTop: spacing[4],
          marginBottom: spacing[16],
        }}
      >
        {meta}
      </Text>
    </Pressable>
  );
}
