import type { PressableProps } from "react-native";
import { Pressable, Text, View } from "react-native";
import { PrimaryPillButton } from "@/components/PrimaryPillButton";
import * as haptics from "@/lib/haptics";
import { typography } from "@/lib/typography";
import { useColors } from "@/state/theme";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  label: string;
  onPress?: PressableProps["onPress"];
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  leadingIcon?: React.ReactNode;
  fullWidth?: boolean;
  heavy?: boolean;
};

/**
 * Universal button — primary uses the classic white home-screen pill;
 * secondary and ghost stay surface-native for settings-style actions.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  leadingIcon,
  fullWidth = true,
  heavy = false,
}: ButtonProps) {
  const colors = useColors();

  if (variant === "primary") {
    return (
      <PrimaryPillButton
        label={label}
        onPress={onPress}
        loading={loading}
        disabled={disabled}
        fullWidth={fullWidth}
        heavy={heavy}
      />
    );
  }

  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      onPressIn={() => {
        if (!isDisabled && variant !== "ghost") haptics.soft();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled }}
      style={({ pressed }) => ({
        width: fullWidth ? "100%" : undefined,
        minHeight: 52,
        borderRadius: 999,
        paddingVertical: 14,
        paddingHorizontal: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
          variant === "secondary" ? colors.surface : "transparent",
        borderWidth: variant === "secondary" ? 1 : 0,
        borderColor: colors.border,
        opacity: isDisabled ? 0.6 : pressed ? 0.88 : 1,
      })}
    >
      {leadingIcon ? <View style={{ marginRight: 10 }}>{leadingIcon}</View> : null}
      <Text
        style={[
          typography.button,
          { color: variant === "ghost" ? colors.inkMuted : colors.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
