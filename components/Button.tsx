import { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  View,
} from "react-native";
import type { PressableProps } from "react-native";
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

/**
 * Universal primary button.
 *
 * Press behavior:
 *   • Spring-scale to 0.965 on pressIn, spring back to 1 on
 *     pressOut. Subtle (~3% squish) but adds the tactile
 *     "this button reacts" quality that iOS system buttons have
 *     since iOS 16. Tension/friction tuned so the rebound never
 *     overshoots visibly — feels like silicone, not jelly.
 *   • Light haptic on pressIn for primary + secondary variants
 *     (ghost stays haptic-less since it's reserved for "back"
 *     style links). The haptic fires INSIDE the spring start so
 *     the buzz lines up with the visual squish, not after.
 *   • No press behavior when disabled/loading — the press
 *     callbacks just early-return so the user can mash the
 *     button without feeling anything happen on a non-action.
 *
 * Typography: we set the font family explicitly via inline style
 * because `font-semibold` is a Tailwind weight class — RN has no
 * `font-weight: 600` mapping for our custom fonts, so the label
 * was actually rendering in the default system font (looked OK
 * but didn't match Plus Jakarta Sans elsewhere in the app).
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  leadingIcon,
  fullWidth = true,
}: ButtonProps) {
  const colors = useColors();
  const isDisabled = disabled || loading;
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (target: number) => {
    Animated.spring(scale, {
      toValue: target,
      useNativeDriver: true,
      tension: 280,
      friction: 18,
    }).start();
  };

  const handlePressIn = () => {
    if (isDisabled) return;
    if (variant !== "ghost") haptics.soft();
    animateTo(0.965);
  };

  const handlePressOut = () => {
    if (isDisabled) return;
    animateTo(1);
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        width: fullWidth ? "100%" : undefined,
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
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
                "text-[16px] tracking-[0.1px]",
                labelByVariant[variant],
              ].join(" ")}
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              {label}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
