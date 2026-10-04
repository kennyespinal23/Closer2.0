import { useState } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { SFSymbol } from "@/components/Symbol";
import * as haptics from "@/lib/haptics";
import { useColors, useResolvedScheme } from "@/state/theme";

const SIZE = 44;

export type BubbleBackButtonProps = {
  onPress: () => void;
  /** Override icon color (defaults to theme ink). */
  color?: string;
  /** Override bubble fill (defaults to charcoal chrome disc). */
  backgroundColor?: string;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/**
 * Circular charcoal “bubble” back control — matches the Home book /
 * streak chrome discs (44pt circle, centered chevron).
 */
export function BubbleBackButton({
  onPress,
  color,
  backgroundColor,
  accessibilityLabel = "Back",
  style,
  disabled = false,
}: BubbleBackButtonProps) {
  const [pressed, setPressed] = useState(false);
  const colors = useColors();
  const scheme = useResolvedScheme();
  const ink = color ?? colors.ink;
  // Dark: lifted charcoal disc. Light: soft ink wash so the bubble
  // stays visible on cream without competing with page titles.
  const fill =
    backgroundColor ??
    (scheme === "dark" ? colors.surfaceTertiary : "rgba(15,15,15,0.08)");

  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => {
        haptics.soft();
        onPress();
      }}
      disabled={disabled}
      accessibilityState={{ disabled }}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={[
        {
          width: SIZE,
          height: SIZE,
          borderRadius: SIZE / 2,
          borderCurve: "continuous",
          backgroundColor: fill,
          alignItems: "center",
          justifyContent: "center",
          opacity: disabled ? 0.4 : pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <SFSymbol name="chevron.left" size={17} color={ink} weight="semibold" />
    </Pressable>
  );
}
