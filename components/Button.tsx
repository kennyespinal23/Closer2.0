import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { PressableProps } from "react-native";
import { colors } from "@/constants/theme";

type Variant = "primary" | "secondary" | "ghost";

type ButtonProps = {
  label: string;
  onPress?: PressableProps["onPress"];
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  leadingIcon?: React.ReactNode;
  fullWidth?: boolean;
};

const containerByVariant: Record<Variant, string> = {
  primary: "bg-primary active:bg-primary-pressed",
  secondary: "bg-surface border border-border",
  ghost: "bg-transparent",
};

const labelByVariant: Record<Variant, string> = {
  primary: "text-primary-fg",
  secondary: "text-ink",
  ghost: "text-ink",
};

export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  leadingIcon,
  fullWidth = true,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={[
        "h-14 rounded-2xl flex-row items-center justify-center px-5",
        containerByVariant[variant],
        fullWidth ? "w-full" : "",
        isDisabled ? "opacity-60" : "",
      ].join(" ")}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.primaryFg : colors.ink}
        />
      ) : (
        <View className="flex-row items-center justify-center">
          {leadingIcon ? (
            <View className="mr-3">{leadingIcon}</View>
          ) : null}
          <Text
            className={[
              "font-semibold text-[16px] tracking-[0.1px]",
              labelByVariant[variant],
            ].join(" ")}
          >
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
