import { buttonStyles } from '@/lib/buttonStyles';
import { useState } from "react";
import type { PressableProps } from "react-native";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Text } from "@/components/CloserText";
import { PrimaryPillButton } from "@/components/PrimaryPillButton";
import * as haptics from "@/lib/haptics";
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
 * Universal button — primary uses the reddish-orange CTA pill
 * (`PrimaryPillButton` / `CLOSER_ACCENT`); secondary and ghost stay
 * surface-native for settings-style actions.
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
  const [pressed, setPressed] = useState(false);

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
        setPressed(true);
        if (!isDisabled && variant !== "ghost") haptics.soft();
      }}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={{
        width: fullWidth ? "100%" : undefined,
        ...buttonStyles.primary,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor:
          variant === "secondary" ? colors.surface : "transparent",
        borderWidth: variant === "secondary" ? 1 : 0,
        borderColor: colors.border,
        opacity: isDisabled ? 0.6 : pressed ? 0.88 : 1,
      }}
    >
      {loading ? <ActivityIndicator color={colors.ink} style={{ marginRight: 10 }} /> : leadingIcon ? <View style={{ marginRight: 10 }}>{leadingIcon}</View> : null}
      <Text
        style={[
          buttonStyles.label,
          { color: variant === "ghost" ? colors.inkMuted : colors.ink },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}
