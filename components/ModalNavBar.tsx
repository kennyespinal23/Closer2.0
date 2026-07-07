import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SFSymbol } from "@/components/Symbol";
import * as haptics from "@/lib/haptics";
import { useColors } from "@/state/theme";

const SIDE_WIDTH = 44;

export type ModalNavBarProps = {
  title: string;
  onClose: () => void;
  closeAccessibilityLabel?: string;
  /** Defaults to a filled-circle xmark chip. */
  leading?: ReactNode;
};

/**
 * Centered-title modal header with a fixed-width leading close
 * column so the title never shoves the dismiss control off-screen.
 */
export function ModalNavBar({
  title,
  onClose,
  closeAccessibilityLabel = "Close",
  leading,
}: ModalNavBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingHorizontal: 16,
        paddingBottom: 8,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          minHeight: 44,
        }}
      >
        <View
          style={{
            width: SIDE_WIDTH,
            alignItems: "flex-start",
            flexShrink: 0,
          }}
        >
          {leading ?? (
            <Pressable
              onPress={() => {
                haptics.soft();
                onClose();
              }}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={closeAccessibilityLabel}
              style={({ pressed }) => ({
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: colors.surfaceSecondary,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <SFSymbol
                name="xmark"
                size={14}
                color={colors.ink}
                weight="semibold"
              />
            </Pressable>
          )}
        </View>

        <View
          style={{
            flex: 1,
            minWidth: 0,
            alignItems: "center",
            paddingHorizontal: 8,
          }}
        >
          <Text
            numberOfLines={1}
            style={{
              fontFamily: "System",
              fontWeight: "700",
              color: colors.ink,
              fontSize: 17,
              letterSpacing: -0.2,
              textAlign: "center",
            }}
            accessibilityRole="header"
          >
            {title}
          </Text>
        </View>

        <View style={{ width: SIDE_WIDTH, flexShrink: 0 }} />
      </View>
    </View>
  );
}
