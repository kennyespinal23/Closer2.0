import { useEffect, useState } from "react";
import { Pressable, View, useWindowDimensions } from "react-native";
import { Text } from "@/components/CloserText";
import Svg, { Circle } from "react-native-svg";
import Animated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import { SFSymbol } from "@/components/Symbol";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { CLOSER_ACCENT } from "@/constants/theme";

import { useColors, useResolvedScheme } from "@/state/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const PROGRESS_YELLOW = "#FFD60A";
const CIRCUMFERENCE = 2 * Math.PI * 22;

export function BookReadingProgress({ read, total, onContinue, continueLabel, compact = false }: { read: number; total: number; onContinue?: () => void; continueLabel?: string; compact?: boolean }) {
  const colors = useColors(), dark = useResolvedScheme() === "dark";
  const green = dark ? "#30D158" : "#248A3D";
  const [pressed, setPressed] = useState(false);
  const reducedMotion = useReducedMotion();
  const { fontScale } = useWindowDimensions();
  const count = Math.min(total, Math.max(0, read));
  const ratio = total > 0 ? count / total : 0;
  const progress = useSharedValue(ratio);
  useEffect(() => {
    progress.value = reducedMotion ? ratio : withTiming(ratio, { duration: 550, easing: Easing.out(Easing.cubic) });
    return () => cancelAnimation(progress);
  }, [ratio, reducedMotion, progress]);
  const ring = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - progress.value) }));
  const complete = total > 0 && count === total;
  const ringColor = complete ? green : ratio >= 0.5 ? PROGRESS_YELLOW : CLOSER_ACCENT;
  const label = complete ? (compact ? "Read Again" : "Book completed") : count === 0 && !onContinue ? "Your journey starts here" : `${count} of ${total} chapters read`;
  const minutes = (total - count) * 4;
  const estimate = minutes >= 60 ? `${Math.floor(minutes / 60)} hr${minutes % 60 ? ` ${minutes % 60} min` : ""}` : `${minutes} min`;
  const detail = complete && compact ? "Book completed" : `Est. time left · ${estimate}`;
  return <Pressable disabled={!onContinue} onPress={onContinue} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} accessible accessibilityRole={onContinue ? "button" : "text"} accessibilityLabel={`${label}. ${detail}. ${onContinue ? continueLabel ?? "Continue reading" : ""}`} style={{ opacity: pressed ? 0.78 : 1, width: "100%", maxWidth: compact ? undefined : 340, marginTop: compact ? 0 : 16, minHeight: 72, padding: 12, borderRadius: 20, borderCurve: "continuous", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: "row", alignItems: "center", gap: 14 }}>
    <View style={{ width: 52, height: 52, alignItems: "center", justifyContent: "center" }}>
      <Svg width={52} height={52} style={{ position: "absolute" }}>
        <Circle cx={26} cy={26} r={22} fill="none" stroke={colors.border} strokeWidth={4} />
        <AnimatedCircle cx={26} cy={26} r={22} fill="none" stroke={ringColor} strokeWidth={4} strokeLinecap="round" strokeDasharray={[CIRCUMFERENCE, CIRCUMFERENCE]} rotation={-90} origin="26, 26" animatedProps={ring} />
      </Svg>
      {complete ? <SFSymbol name="checkmark" size={20} color={green} weight="semibold" /> : <Text allowFontScaling={false} style={{ color: colors.ink, fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] }}>{Math.round(ratio * 100)}%</Text>}
    </View>
    <View style={{ flex: 1, gap: 3 }}>
      <Text allowFontScaling={false} style={{ color: colors.ink, fontSize: 14 * fontScale, lineHeight: 20 * fontScale, fontWeight: "600" }}>{label}</Text>
      <Text allowFontScaling={false} style={{ color: colors.inkMuted, fontSize: 12 * fontScale, lineHeight: 17 * fontScale }}>{detail}</Text>
    </View>
    {onContinue ? <SFSymbol name="arrow.right" size={20} color={colors.ink} weight="semibold" /> : null}
  </Pressable>;
}
