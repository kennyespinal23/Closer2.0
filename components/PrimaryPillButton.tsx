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
  PRIMARY_PILL_BG,
  PRIMARY_PILL_INK,
  PRIMARY_PILL_SHADOW,
} from "@/constants/heroChrome";
import * as haptics from "@/lib/haptics";
import { typography } from "@/lib/typography";
import { useReducedMotion } from "@/lib/useReducedMotion";

type PrimaryPillButtonProps = {
  label: string;
  sublabel?: string;
  onPress?: PressableProps["onPress"];
  disabled?: boolean;
  loading?: boolean;
  showArrow?: boolean;
  fullWidth?: boolean;
  heavy?: boolean;
  accessibilityLabel?: string;
};

/**
 * Classic white pill CTA — matches the home screen Read Now button.
 * Black label, full-width capsule, soft white glow on dark surfaces.
 */
export function PrimaryPillButton({
  label,
  sublabel,
  onPress,
  disabled = false,
  loading = false,
  showArrow = false,
  fullWidth = true,
  heavy = false,
  accessibilityLabel,
}: PrimaryPillButtonProps) {
  const isDisabled = disabled || loading;
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

  const handlePressIn = () => {
    if (isDisabled) return;
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
        accessibilityState={{ disabled: isDisabled }}
        style={({ pressed }) => ({
          opacity: isDisabled ? 0.45 : pressed ? 0.92 : 1,
          alignSelf: "stretch",
        })}
      >
        <View
          style={{
            backgroundColor: PRIMARY_PILL_BG,
            borderRadius: 999,
            paddingVertical: 16,
            paddingHorizontal: 24,
            minHeight: 52,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            ...PRIMARY_PILL_SHADOW,
          }}
        >
          {loading ? (
            <ActivityIndicator color={PRIMARY_PILL_INK} />
          ) : (
            <View style={{ alignItems: "center" }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={[
                    typography.button,
                    {
                      color: PRIMARY_PILL_INK,
                      marginRight: showArrow ? 8 : 0,
                    },
                  ]}
                >
                  {label}
                </Text>
                {showArrow ? (
                  <SFSymbol
                    name="arrow.right"
                    size={15}
                    color={PRIMARY_PILL_INK}
                    weight="semibold"
                  />
                ) : null}
              </View>
              {sublabel ? (
                <Text
                  style={{
                    color: "rgba(0, 0, 0, 0.55)",
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
