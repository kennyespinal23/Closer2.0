import { useState } from "react";
import { TextInput, View, Text, Pressable } from "react-native";
import type { TextInputProps } from "react-native";
import { useColors } from "@/state/theme";

type InputProps = TextInputProps & {
  label: string;
  trailing?: React.ReactNode;
  onTrailingPress?: () => void;
};

export function Input({
  label,
  trailing,
  onTrailingPress,
  onFocus,
  onBlur,
  ...rest
}: InputProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);

  return (
    <View className="w-full">
      <Text className="font-medium text-ink-muted text-[13px] mb-2 ml-1">
        {label}
      </Text>
      <View
        className={[
          "h-14 rounded-2xl flex-row items-center px-4 bg-surface",
          "border",
          focused ? "border-primary" : "border-border",
        ].join(" ")}
      >
        <TextInput
          {...rest}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          placeholderTextColor={colors.inkMuted}
          selectionColor={colors.primary}
          className="flex-1 font-sans text-ink text-[17px] py-0"
          style={{ fontFamily: "System", fontWeight: "400", lineHeight: 22 }}
        />
        {trailing ? (
          <Pressable
            hitSlop={12}
            onPress={onTrailingPress}
            className="ml-2"
          >
            {trailing}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
