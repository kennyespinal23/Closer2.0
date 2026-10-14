import { useEffect } from "react";
import { Modal, StyleSheet, View } from "react-native";
import Animated, { Easing, Extrapolation, type SharedValue, cancelAnimation, interpolate, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import Svg, { Path, Rect } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/CloserText";
import { CloseButton } from "@/components/CloseButton";
import { FeedbackPressable as Pressable } from "./FeedbackPressable";
import { SFSymbol } from "./Symbol";
import { dailyText, uiText } from "@/lib/typography";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useReminder } from "@/lib/useReminder";
import { useResolvedScheme } from "@/state/theme";

/**
 * The day after tomorrow isn't sealed yet: its letter is still being
 * written. A sheet of paper, a few lines in pencil, the pencil resting
 * mid-sentence. Opened, the pencil writes.
 */

const PAPER = "#FFF8EE", LINE = "#E6D6C2", GRAPHITE = "#5A4A3E";

/** A yellow pencil, drawn pointing down-left so its tip sits at the end of a line. */
function Pencil({ size }: { size: number }) {
  return <Svg width={size} height={size} viewBox="0 0 60 60" accessible={false}>
    <Path d="M14 46 46 14l6 6-32 32Z" fill="#FFC12E"/>
    <Path d="M14 46 46 14l2 2-32 32Z" fill="#FFD455"/>
    <Path d="M46 14l4-4a3 3 0 0 1 4 0l2 2a3 3 0 0 1 0 4l-4 4Z" fill="#E2391F"/>
    <Path d="M44 16l6 6M42 18l6 6" stroke="#B98322" strokeWidth={1.4}/>
    <Path d="M14 46 8 52l2 2 6-6Z" fill="#F4E6D3"/>
    <Path d="M8 52l-2 4 4-2Z" fill={GRAPHITE}/>
  </Svg>;
}

/** Paper with written lines. `progress` 0..1 drives how much of the writing is there. */
export function PencilPage({ width, progress }: { width: number; progress?: SharedValue<number> }) {
  const h = width * .78, pad = width * .12, lineW = width - pad * 2;
  // The lines being written: full, full, three-quarters, and the one in progress.
  const lines = [1, .92, .74, .5];
  const gap = h * .16, top = h * .22;
  const written = (i: number) => useAnimatedStyle(() => {
    const p = progress ? progress.value : .82;
    const share = 1 / lines.length;
    const local = interpolate(p, [i * share, (i + 1) * share], [0, 1], Extrapolation.CLAMP);
    return { width: lineW * lines[i] * local };
  });
  const styles = lines.map((_, i) => written(i)); // eslint-disable-line react-hooks/rules-of-hooks
  const pencil = useAnimatedStyle(() => {
    const p = progress ? progress.value : .82;
    const share = 1 / lines.length;
    const i = Math.min(lines.length - 1, Math.floor(p / share));
    const local = interpolate(p, [i * share, (i + 1) * share], [0, 1], Extrapolation.CLAMP);
    return { transform: [{ translateX: pad + lineW * lines[i] * local - width * .05 }, { translateY: top + gap * i - width * .27 }, { rotate: `${-4 + 6 * Math.sin(p * 40)}deg` }] };
  });
  return <View accessible={false} style={{ width, height: h }}>
    <View style={[s.paper, { width, height: h, borderRadius: width * .06 }]}>
      <Svg width={width} height={h} style={StyleSheet.absoluteFill}>
        <Rect x={pad * .55} y={0} width={1.4} height={h} fill="#F2B8A8"/>
        {lines.map((_, i) => <Rect key={i} x={pad} y={top + gap * i + 2} width={lineW} height={1} fill={LINE}/>)}
      </Svg>
      {lines.map((_, i) => <Animated.View key={i} style={[{ position: "absolute", left: pad, top: top + gap * i - 4, height: 5, borderRadius: 3, backgroundColor: GRAPHITE, opacity: .78 }, styles[i]]}/>)}
    </View>
    <Animated.View style={[{ position: "absolute", left: 0, top: 0 }, pencil]}><Pencil size={width * .34}/></Animated.View>
  </View>;
}

export const DAY_AFTER_PEEK = 76, DAY_AFTER_FULL = 200;

/**
 * The third card on Home. Rests as a slim tan row; once Tomorrow has fully
 * opened, keep scrolling and this one unfolds too, showing the page in progress.
 */
export function DayAfterCard({ day, weekday, dark, grow, scrollY, from, to, onPress }: {
  day: number; weekday: string; dark: boolean; grow: boolean; scrollY: SharedValue<number>; from: number; to: number; onPress: () => void;
}) {
  const p = (y: number) => { "worklet"; return interpolate(y, [from, to], [0, 1], Extrapolation.CLAMP); };
  const card = useAnimatedStyle(() => ({ height: DAY_AFTER_PEEK + (DAY_AFTER_FULL - DAY_AFTER_PEEK) * p(scrollY.value), marginHorizontal: 20 * (1 - p(scrollY.value)) }));
  const peek = useAnimatedStyle(() => ({ opacity: interpolate(p(scrollY.value), [.3, .42], [1, 0], Extrapolation.CLAMP) }));
  const full = useAnimatedStyle(() => ({ opacity: interpolate(p(scrollY.value), [.42, .56], [0, 1], Extrapolation.CLAMP), transform: [{ translateY: 10 * (1 - p(scrollY.value)) }] }));
  const bg = dark ? "#2A221D" : "#EADCCB", ink = dark ? "#E9D9C6" : "#4A3A2E", muted = dark ? "#A8907C" : "#7C6B5B", num = dark ? "#8F7A68" : "#9C8573";
  const label = `${weekday}. Day ${day}. Still being written.`;
  const fullContent = <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
    <View style={{ flex: 1, gap: 6 }}>
      <Text style={{ ...dailyText.dayNumber, color: num, fontVariant: ["tabular-nums"] }}>{String(day).padStart(2, "0")}</Text>
      <Text style={{ ...uiText.supporting, color: muted, marginTop: -4 }}>{weekday}</Text>
      <Text style={{ ...dailyText.cardTitle, color: ink, marginTop: 10 }}>Still being written</Text>
    </View>
    <View style={{ transform: [{ rotate: "6deg" }] }}><PencilPage width={118}/></View>
  </View>;
  if (!grow) return <Pressable feedback="action" onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[s.full, { backgroundColor: bg, marginTop: -12 }]}>{fullContent}</Pressable>;
  return <Pressable feedback="action" onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={{ marginTop: -12 }}>
    <Animated.View style={[s.card, { backgroundColor: bg }, card]}>
      <Animated.View style={[s.peek, peek]}>
        <Text style={{ ...dailyText.dayNumber, fontSize: 22, lineHeight: 26, color: num, fontVariant: ["tabular-nums"] }}>{String(day).padStart(2, "0")}</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ ...uiText.supporting, fontSize: 13, lineHeight: 17, color: muted }}>{weekday}</Text>
          <Text numberOfLines={1} style={{ ...uiText.body, fontWeight: "800", color: ink }}>Still being written</Text>
        </View>
        <SFSymbol name="pencil" size={16} color={num}/>
      </Animated.View>
      <Animated.View style={[s.fullLayer, full]}>{fullContent}</Animated.View>
    </Animated.View>
  </Pressable>;
}

/** Tapping the third card: the pencil writes, and it says when the letter will be ready. */
export function DayAfterSheet({ visible, day, weekday, onClose }: { visible: boolean; day: number; weekday: string; onClose: () => void }) {
  const insets = useSafeAreaInsets(), reduced = useReducedMotion(), reminder = useReminder(), dark = useResolvedScheme() === "dark";
  const t = dark ? { bg: "#1E1A16", ink: "#F7F0E6", muted: "#BBAA99", head: "#A8907C", close: "#E9D9C6", closeBg: "#FFFFFF14", card: "#2A241F", line: "#FFFFFF1A", cta: "#F7F0E6", ctaInk: "#17120F", gold: "#E9B949" }
                 : { bg: "#F1E1D2", ink: "#17120F", muted: "#6E645C", head: "#7C6B5B", close: "#4A3A2E", closeBg: "#17120F12", card: "#FFF8EE", line: "#17120F1F", cta: "#17120F", ctaInk: "#FBF9F6", gold: "#C98A1E" };
  const write = useSharedValue(reduced ? .82 : 0);
  useEffect(() => {
    if (!visible) { cancelAnimation(write); return; }
    if (reduced) { write.value = .82; return; }
    // Write the page, rest a moment, lift and start again.
    write.value = 0;
    write.value = withRepeat(withSequence(withTiming(.97, { duration: 5200, easing: Easing.inOut(Easing.quad) }), withTiming(.97, { duration: 1400 }), withTiming(0, { duration: 0 })), -1);
    return () => cancelAnimation(write);
  }, [visible, reduced, write]);
  return <Modal visible={visible} animationType={reduced ? "fade" : "slide"} presentationStyle="pageSheet" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: t.bg, paddingBottom: Math.max(insets.bottom, 18) + 16 }}>
      <View style={s.top}>
        <CloseButton onPress={onClose} color={t.close} style={{ width: 44, height: 44, backgroundColor: t.closeBg }}/>
        <Text style={{ ...uiText.supporting, fontWeight: "800", color: t.head }}>{String(day).padStart(2, "0")} · {weekday}</Text>
        <View style={{ width: 44 }}/>
      </View>
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24, gap: 32 }}>
        <View style={{ transform: [{ rotate: "-4deg" }] }}><PencilPage width={260} progress={write}/></View>
        <View style={{ alignItems: "center", gap: 10 }}>
          <Text accessibilityRole="header" style={{ ...dailyText.overviewTitle, color: t.ink, textAlign: "center" }}>Still being written</Text>
          <Text style={{ ...uiText.body, color: t.muted, textAlign: "center", maxWidth: 320 }}>{weekday}’s letter is still on the desk. It will be ready the morning it arrives.</Text>
        </View>
      </View>
      <View style={[s.facts, { backgroundColor: t.card }]}>
        <View style={s.fact}><SFSymbol name="bell" size={19} color={t.gold}/><View style={{ flex: 1 }}>
          <Text style={{ ...uiText.body, fontWeight: "800", color: t.ink }}>Arrives {weekday}</Text>
          <Text style={{ fontSize: 13, lineHeight: 18, color: t.muted }}>{reminder.enabled ? `At ${reminder.label}, with your reminder` : "The morning of"}</Text>
        </View></View>
        <View style={[s.fact, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: t.line }]}><SFSymbol name="envelope" size={19} color={t.gold}/><View style={{ flex: 1 }}>
          <Text style={{ ...uiText.body, fontWeight: "800", color: t.ink }}>Tomorrow’s comes first</Text>
          <Text style={{ fontSize: 13, lineHeight: 18, color: t.muted }}>One letter a day, in order</Text>
        </View></View>
      </View>
      <Pressable feedback="action" onPress={onClose} accessibilityRole="button" style={[s.cta, { backgroundColor: t.cta }]}><Text style={{ ...uiText.body, fontWeight: "800", color: t.ctaInk }}>Back to today</Text></Pressable>
    </View>
  </Modal>;
}

const s = StyleSheet.create({
  paper: { backgroundColor: PAPER, overflow: "hidden", boxShadow: "0 1px 2px #502D0A1A, 0 14px 24px -14px #502D0A80" },
  card: { borderRadius: 24, borderCurve: "continuous", overflow: "hidden" },
  full: { borderRadius: 28, borderCurve: "continuous", padding: 22 },
  peek: { position: "absolute", top: 0, left: 0, right: 0, height: DAY_AFTER_PEEK, paddingHorizontal: 20, flexDirection: "row", alignItems: "center", gap: 16 },
  fullLayer: { position: "absolute", top: 0, left: 0, right: 0, height: DAY_AFTER_FULL, padding: 22, justifyContent: "center" },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 16 },
  facts: { marginHorizontal: 20, marginBottom: 16, borderRadius: 22, borderCurve: "continuous", backgroundColor: "#FFF8EE", paddingHorizontal: 18 },
  fact: { minHeight: 64, flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10 },
  cta: { marginHorizontal: 20, height: 56, borderRadius: 28, backgroundColor: "#17120F", alignItems: "center", justifyContent: "center" },
});
