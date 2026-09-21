import { useEffect, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import Svg, { Circle } from "react-native-svg";
import Animated, { cancelAnimation, Easing, useAnimatedProps, useSharedValue, withTiming } from "react-native-reanimated";
import { SFSymbol } from "@/components/Symbol";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { CLOSER_ACCENT } from "@/constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const PROGRESS_YELLOW = "#FFD60A";
const PROGRESS_GREEN = "#30D158";
const CIRCUMFERENCE = 2 * Math.PI * 22;

export function BookReadingProgress({ read, total, onContinue, continueLabel }: { read: number; total: number; onContinue?: () => void; continueLabel?: string }) {
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
  const ringColor = complete ? PROGRESS_GREEN : ratio >= 0.5 ? PROGRESS_YELLOW : CLOSER_ACCENT;
  const label = complete ? "Book completed" : count === 0 && !onContinue ? "Your journey starts here" : `${count} of ${total} chapters read`;
  const minutes = (total - count) * 4;
  const estimate = minutes >= 60 ? `${Math.floor(minutes / 60)} hr${minutes % 60 ? ` ${minutes % 60} min` : ""}` : `${minutes} min`;
  const detail = `Est. time left · ${estimate}`;
  return <Pressable disabled={!onContinue} onPress={onContinue} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} accessible accessibilityRole={onContinue ? "button" : "text"} accessibilityLabel={`${label}. ${detail}. ${onContinue ? continueLabel ?? "Continue reading" : ""}`} style={{ opacity: pressed ? 0.78 : 1, width: "100%", maxWidth: 340, marginTop: 16, minHeight: 72, padding: 12, borderRadius: 20, borderCurve: "continuous", backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1, borderColor: "rgba(255,255,255,0.10)", flexDirection: "row", alignItems: "center", gap: 14 }}>
    <View style={{ width: 52, height: 52, alignItems: "center", justifyContent: "center" }}>
      <Svg width={52} height={52} style={{ position: "absolute" }}>
        <Circle cx={26} cy={26} r={22} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={4} />
        <AnimatedCircle cx={26} cy={26} r={22} fill="none" stroke={ringColor} strokeWidth={4} strokeLinecap="round" strokeDasharray={[CIRCUMFERENCE, CIRCUMFERENCE]} rotation={-90} origin="26, 26" animatedProps={ring} />
      </Svg>
      {complete ? <SFSymbol name="checkmark" size={20} color={PROGRESS_GREEN} weight="semibold" /> : <Text allowFontScaling={false} style={{ color: "white", fontSize: 12, fontWeight: "700", fontVariant: ["tabular-nums"] }}>{Math.round(ratio * 100)}%</Text>}
    </View>
    <View style={{ flex: 1, gap: 3 }}>
      <Text allowFontScaling={false} style={{ color: "white", fontSize: 14 * fontScale, lineHeight: 20 * fontScale, fontWeight: "600" }}>{label}</Text>
      <Text allowFontScaling={false} style={{ color: "#B3BBC7", fontSize: 12 * fontScale, lineHeight: 17 * fontScale }}>{detail}</Text>
    </View>
    {onContinue ? <SFSymbol name="arrow.right" size={20} color="white" weight="semibold" /> : null}
  </Pressable>;
}
