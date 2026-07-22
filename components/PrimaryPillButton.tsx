import { useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  Text,
  View,
} from "react-native";
import type { PressableProps } from "react-native";
import { SFSymbol } from "@/components/Symbol";
import {
  COMPLETED_READ_GREEN,
  PRIMARY_PILL_SHADOW,
} from "@/constants/heroChrome";
import { CLOSER_ACCENT } from "@/constants/theme";
import * as haptics from "@/lib/haptics";
import { typography } from "@/lib/typography";
import { useReducedMotion } from "@/lib/useReducedMotion";

export type PrimaryPillVariant = "primary" | "completed";

type PrimaryPillButtonProps = {
  label: string;
  sublabel?: string;
  onPress?: PressableProps["onPress"];
  onPressIn?: PressableProps["onPressIn"];
  disabled?: boolean;
  loading?: boolean;
  showArrow?: boolean;
  fullWidth?: boolean;
  heavy?: boolean;
  accessibilityLabel?: string;
  /** `completed` — green pill + checkmark for post-devotional states. */
  variant?: PrimaryPillVariant;
};

/**
 * Primary CTA pill — reddish-orange fill (`CLOSER_ACCENT`) with
 * white label. Used for Get Started, Continue, Read Now, and any
 * `Button` primary variant across onboarding and the home surface.
 */
export function PrimaryPillButton({
  label,
  sublabel,
  onPress,
  onPressIn,
  disabled = false,
  loading = false,
  showArrow = false,
  fullWidth = true,
  heavy = false,
  accessibilityLabel,
  variant = "primary",
}: PrimaryPillButtonProps) {
  const isDisabled = disabled || loading;
  const isCompleted = variant === "completed";
  const pillBg = isCompleted ? COMPLETED_READ_GREEN : CLOSER_ACCENT;
  const pillInk = "#FFFFFF";
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (target: number) => {
    if (reducedMotion) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, {
      toValue: target,
      useNativeDriver: true,
      tension: 280,
      friction: 18,
    }).start();
  };

  const handlePressIn: PressableProps["onPressIn"] = (event) => {
    if (isDisabled) return;
    onPressIn?.(event);
    if (heavy) {
      haptics.thud();
    } else {
      haptics.soft();
    }
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
        alignSelf: fullWidth ? "stretch" : "center",
      }}
    >
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityHint={
          isCompleted ? "You've already completed today's devotional" : undefined
        }
        accessibilityState={{ disabled: isDisabled }}
        style={({ pressed }) => ({
          opacity: isDisabled ? 0.45 : pressed ? 0.92 : 1,
          alignSelf: "stretch",
        })}
      >
        <View
          style={{
            backgroundColor: pillBg,
            borderRadius: 999,
            paddingVertical: 16,
            paddingHorizontal: 24,
            minHeight: 52,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            ...(isCompleted ? {} : PRIMARY_PILL_SHADOW),
          }}
        >
          {loading ? (
            <ActivityIndicator color={pillInk} />
          ) : (
            <View style={{ alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={[
                    typography.button,
                    {
                      color: pillInk,
                      marginRight: showArrow || isCompleted ? 8 : 0,
                    },
                  ]}
                >
                  {label}
                </Text>
                {isCompleted ? (
                  <SFSymbol
                    name="checkmark"
                    size={15}
                    color={pillInk}
                    weight="semibold"
                  />
                ) : showArrow ? (
                  <SFSymbol
                    name="arrow.right"
                    size={15}
                    color={pillInk}
                    weight="semibold"
                  />
                ) : null}
              </View>
              {sublabel ? (
                <Text
                  style={{
                    color: "rgba(255, 255, 255, 0.75)",
                    fontFamily: "System",
                    fontWeight: "500",
                    fontSize: 12,
                    lineHeight: 16,
                    marginTop: 2,
                  }}
                >
                  {sublabel}
                </Text>
              ) : null}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}
