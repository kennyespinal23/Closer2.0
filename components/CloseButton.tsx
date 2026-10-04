import { useState } from "react";
import { Pressable, type PressableProps } from "react-native";
import { SFSymbol } from "@/components/Symbol";
import { useColors, useResolvedScheme } from "@/state/theme";

type Props = Omit<PressableProps, "children"> & { color?: string };

/** Shared dismissal control. Screen styles may position/tint it, never shrink its target. */
export function CloseButton({ color, style, disabled, onPressIn, onPressOut, accessibilityLabel = "Close", accessibilityState, ...props }: Props) {
  const colors = useColors();
  const dark = useResolvedScheme() === "dark";
  const [pressed, setPressed] = useState(false);
  return <Pressable {...props} disabled={disabled} accessibilityRole="button"
    accessibilityLabel={accessibilityLabel} accessibilityState={{ ...accessibilityState, disabled: !!disabled }} hitSlop={8}
    onPressIn={event => { setPressed(true); onPressIn?.(event); }}
    onPressOut={event => { setPressed(false); onPressOut?.(event); }}
    style={[
      { backgroundColor: dark ? colors.surfaceTertiary : "rgba(15,15,15,0.08)" },
      typeof style === "function" ? style({ pressed, hovered: false }) : style,
      { width: 44, height: 44, minWidth: 44, minHeight: 44, flexShrink: 0, padding: 0,
        borderRadius: 22, borderCurve: "continuous", borderWidth: 0, alignItems: "center", justifyContent: "center",
        opacity: disabled ? 0.4 : pressed ? 0.75 : 1 },
    ]}>
    <SFSymbol name="xmark" size={17} weight="semibold" color={color ?? colors.ink} />
  </Pressable>;
}
