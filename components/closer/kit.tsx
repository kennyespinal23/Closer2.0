import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import * as Haptics from "expo-haptics";

/* The Page prototype's look, for the app's native screens: its colours, Nunito at its weights, small caps labels,
   and the tactile button (a solid face on a darker lip that presses down). */

export const K = {
  cream: "#FFF7EB", creamDeep: "#F3E6D2", creamLine: "#E8D9C2",
  ink: "#17251F", inkSoft: "#4E5B54", inkFaint: "#8A938D",
  red: "#D92B2F", redPress: "#9E1F25", gold: "#FFC72C",
  forest: "#123F32", forestDeep: "#0B2C23", burgundy: "#682C42", burgundyDeep: "#4A1E2F",
};

const FAMILY: Record<number, string> = { 400: "NunitoRegular", 500: "NunitoMedium", 600: "NunitoSemiBold", 700: "NunitoBold", 800: "NunitoExtraBold", 900: "NunitoBlack" };
/** Nunito at a weight, as a style (the app loads each weight as its own family) */
export const nunito = (weight: 400 | 500 | 600 | 700 | 800 | 900, size: number, extra: TextStyle = {}): TextStyle => ({
  fontFamily: FAMILY[weight], fontSize: size, ...extra,
});

/** Small capitals with a little spacing: CASE 001, TOMORROW */
export function Label({ children, color = K.inkFaint, style }: { children: ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return <Text style={[nunito(800, 12.5, { letterSpacing: 1.7, textTransform: "uppercase", color }), style]}>{children}</Text>;
}

export function Title({ children, style }: { children: ReactNode; style?: StyleProp<TextStyle> }) {
  return <Text accessibilityRole="header" style={[nunito(900, 34, { color: K.ink, letterSpacing: -1, lineHeight: 36 }), style]}>{children}</Text>;
}

type Tone = { face: string; lip: string; text: string };
export const TONES = {
  red: { face: K.red, lip: K.redPress, text: K.cream },
  ink: { face: K.ink, lip: "#000000", text: K.cream },
  cream: { face: K.cream, lip: "rgba(0,0,0,.28)", text: K.ink },
} satisfies Record<string, Tone>;

/** The tactile button: the face sits on its lip and presses down onto it */
export function PressButton({ children, onPress, tone = TONES.red, disabled, style, label }: { children: ReactNode; onPress?: () => void; tone?: Tone; disabled?: boolean; style?: StyleProp<ViewStyle>; label?: string }) {
  const down = useSharedValue(0);
  const face = useAnimatedStyle(() => ({ transform: [{ translateY: down.value * 4 }, { scaleY: 1 - down.value * 0.03 }] }));
  return (
    <Pressable
      onPressIn={() => { down.value = withSpring(1, { stiffness: 700, damping: 22 }); void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      onPressOut={() => { down.value = withSpring(0, { stiffness: 700, damping: 22 }); }}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[{ height: 63, opacity: disabled ? 0.45 : 1 }, style]}
    >
      <View style={[StyleSheet.absoluteFill, { top: 5, borderRadius: 20, backgroundColor: tone.lip }]} />
      <Animated.View style={[{ height: 58, borderRadius: 20, backgroundColor: tone.face, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }, face]}>
        {typeof children === "string" ? <Text style={nunito(800, 18, { color: tone.text, letterSpacing: -0.2 })}>{children}</Text> : children}
      </Animated.View>
    </Pressable>
  );
}

/** A soft row on cream: settings, tomorrow, search results */
export function Row({ children, onPress, style, label }: { children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle>; label?: string }) {
  const body = <View style={[{ backgroundColor: K.creamDeep, borderRadius: 22, paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12 }, style]}>{children}</View>;
  if (!onPress) return body;
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>{body}</Pressable>;
}
