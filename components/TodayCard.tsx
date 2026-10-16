import { useRef } from "react";
import { StyleSheet, View } from "react-native";
import type { CardOrigin } from "./DailyWalkOverview";
import Animated, { Extrapolation, type SharedValue, interpolate, useAnimatedStyle, useDerivedValue } from "react-native-reanimated";
import { Text } from "@/components/CloserText";
import { FeedbackPressable as Pressable } from "./FeedbackPressable";
import { SFSymbol, type SFSymbolName } from "./Symbol";
import { CategoryGesture, CategoryGround, categoryTheme } from "./CategoryArt";
import { dailyText, uiText } from "@/lib/typography";
import { focusAmount, useFocusMoment } from "@/lib/homeFocus";

export const TODAY_SLIM = 104, TODAY_FULL = 224;
type Step = { id: string; icon: SFSymbolName; done: boolean };

/**
 * Today's walk. Open, it wears its category's gesture, the day and the day's
 * steps. As the page moves on, the gesture slides off to the right, the day
 * and the steps close up into one kicker line with a dot per step, and the title
 * stays, only smaller, so its shape never reflows.
 */
export function TodayCard({ categoryId, day, label, reference, title, scriptureText, steps, accessibilityLabel, onPress, fold, compact }: {
  categoryId: string; day: number; label: string; reference: string; title: string; scriptureText: string; steps: Step[];
  accessibilityLabel: string; onPress: (origin?: CardOrigin) => void; compact: boolean;
  /** Present when the page folds: the scroll, this card's stop and where the page rests. */
  fold?: { scrollY: SharedValue<number>; settled: SharedValue<number>; stop: number; last: number; distance: number };
}) {
  const theme = categoryTheme(categoryId), count = steps.filter(x => x.done).length, kept = count === steps.length;
  const dayLabel = String(day).padStart(2, "0");
  const keptChip = <View style={[s.kept, { backgroundColor: theme.chip }]}><View style={[s.keptDot, { backgroundColor: theme.accent }]}><SFSymbol name="checkmark" size={13} color={theme.accentInk}/></View><Text style={{ ...uiText.supporting, fontWeight: "800", color: theme.chipIcon }}>Today, kept</Text></View>;
  const token = (x: Step) => <View style={[s.token, { backgroundColor: x.done ? theme.accent : theme.chip }]}><SFSymbol name={x.done ? "checkmark" : x.icon} size={17} color={x.done ? theme.accentInk : theme.chipIcon}/></View>;
  const count4 = <Text style={{ ...uiText.supporting, fontWeight: "800", color: theme.label, marginLeft: 12 }}>{count} of {steps.length}</Text>;

  // Where the card sits on screen (transforms included), so the walk can open out of it.
  const box = useRef<View>(null);
  const press = (visibleHeight?: () => number) => {
    const node = box.current;
    if (!node) { onPress(); return; }
    node.measureInWindow((x, y, width, height) => onPress(width > 0 ? { x, y, width, height: visibleHeight ? visibleHeight() : height } : undefined));
  };
  if (!fold) return <View ref={box} collapsable={false}><Pressable feedback="action" onPress={() => press()} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={[s.card, { justifyContent: "space-between" }]}>
    <CategoryGround id={categoryId}/>
    <View pointerEvents="none" style={StyleSheet.absoluteFill}><CategoryGesture id={categoryId} title={title} text={scriptureText}/></View>
    <View style={{ minHeight: compact ? 0 : 188 }}>
      <View style={{ gap: 8 }}>
        <Text style={{ ...dailyText.dayNumber, color: theme.num, fontVariant: ["tabular-nums"] }}>{dayLabel}</Text>
        <Text numberOfLines={2} style={{ ...uiText.supporting, fontWeight: "800", color: theme.label, marginTop: -6, marginBottom: 16, maxWidth: 190 }}>{label} · {reference}</Text>
        <Text style={{ ...dailyText.cardTitle, color: theme.ink, maxWidth: 240 }}>{title}</Text>
      </View>
      {kept ? <View style={{ marginTop: 12 }}>{keptChip}</View> : <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12 }}>{steps.map((x, i) => <View key={x.id} style={{ marginLeft: i ? 6 : 0 }}>{token(x)}</View>)}{count4}</View>}
    </View>
  </Pressable></View>;
  return <View ref={box} collapsable={false}><FoldingToday {...{ categoryId, dayLabel, label, reference, title, scriptureText, steps, accessibilityLabel, fold, theme, kept, keptChip, token, count4 }} onPress={press}/></View>;
}

function FoldingToday({ categoryId, dayLabel, label, reference, title, scriptureText, steps, accessibilityLabel, onPress, fold, theme, kept, keptChip, token, count4 }: {
  categoryId: string; dayLabel: string; label: string; reference: string; title: string; scriptureText: string; steps: Step[]; accessibilityLabel: string; onPress: (visibleHeight: () => number) => void;
  fold: { scrollY: SharedValue<number>; settled: SharedValue<number>; stop: number; last: number; distance: number };
  theme: ReturnType<typeof categoryTheme>; kept: boolean; keptChip: React.ReactNode; token: (x: Step) => React.ReactNode; count4: React.ReactNode;
}) {
  const { scrollY, settled, stop, last, distance } = fold;
  const e = useDerivedValue(() => focusAmount(scrollY.value, stop, last, distance));
  // The moment: the steps land one after another when the page settles here.
  const m = useFocusMoment(settled, stop, 600);
  const gesture = useAnimatedStyle(() => ({
    opacity: .5 + .5 * e.value, transformOrigin: "right top",
    transform: [{ translateX: 30 * (1 - e.value) }, { translateY: 34 * (1 - e.value) }, { scale: .3 + .7 * e.value }],
  }));
  const open = useAnimatedStyle(() => ({ opacity: interpolate(e.value, [.62, .9], [0, 1], Extrapolation.CLAMP) }));
  const meta = useAnimatedStyle(() => ({ opacity: interpolate(e.value, [.62, .9], [0, 1], Extrapolation.CLAMP), transform: [{ translateY: -10 * (1 - e.value) }] }));
  const slim = useAnimatedStyle(() => ({ opacity: interpolate(e.value, [.25, .45], [1, 0], Extrapolation.CLAMP) }));
  // Transforms only, so the fold never re-lays out anything but the card height.
  const titleStyle = useAnimatedStyle(() => ({ transformOrigin: "left top", transform: [{ translateY: 54 * e.value }, { scale: .77 + .23 * e.value }] }));
  // Folded, only part of the card shows: that is the height the walk opens out of.
  return <Pressable feedback="action" onPress={() => onPress(() => TODAY_SLIM + (TODAY_FULL - TODAY_SLIM) * e.value)} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={{ borderRadius: 28, borderCurve: "continuous" }}>
    <View style={[s.card, { padding: 0, height: TODAY_FULL }]}>
      <CategoryGround id={categoryId}/>
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, gesture]}><CategoryGesture id={categoryId} title={title} text={scriptureText}/></Animated.View>
      <Animated.View style={[s.at, { top: 22 }, meta]}>
        <Text style={{ ...dailyText.dayNumber, color: theme.num, fontVariant: ["tabular-nums"] }}>{dayLabel}</Text>
        <Text numberOfLines={1} style={{ ...uiText.supporting, fontWeight: "800", color: theme.label, marginTop: 2, maxWidth: 230 }}>{label} · {reference}</Text>
      </Animated.View>
      <Animated.View style={[s.at, s.kicker, slim]}>
        <Text style={{ fontSize: 13, lineHeight: 17, fontWeight: "800", color: theme.label }}>{dayLabel} · {kept ? "Today, kept" : label}</Text>
        <View style={{ flexDirection: "row", gap: 4 }}>{kept ? <SFSymbol name="checkmark.circle.fill" size={13} color={theme.accent}/> : steps.map(x => <View key={x.id} style={[s.dot, { borderColor: theme.label }, x.done && { backgroundColor: theme.label }]}/>)}</View>
      </Animated.View>
      <Animated.View style={[s.at, { top: 42, width: 240 }, titleStyle]}><Text numberOfLines={2} style={{ ...dailyText.cardTitle, color: theme.ink }}>{title}</Text></Animated.View>
      <Animated.View style={[s.at, { top: 166, flexDirection: "row", alignItems: "center" }, open]}>
        {kept ? keptChip : <>{steps.map((x, i) => <Landing key={x.id} m={m} i={i}>{token(x)}</Landing>)}{count4}</>}
      </Animated.View>
    </View>
  </Pressable>;
}

function Landing({ m, i, children }: { m: SharedValue<number>; i: number; children: React.ReactNode }) {
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -14 * (1 - Math.min(1, Math.max(0, m.value * 1.6 - i * .2))) }] }));
  return <Animated.View style={[{ marginLeft: i ? 6 : 0 }, style]}>{children}</Animated.View>;
}

const s = StyleSheet.create({
  card: { padding: 22, borderRadius: 28, borderCurve: "continuous", overflow: "hidden" },
  at: { position: "absolute", left: 22 },
  kicker: { top: 20, flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, borderWidth: 1.5 },
  token: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", boxShadow: "0 2px 6px #0000001F" },
  kept: { flexDirection: "row", alignSelf: "flex-start", alignItems: "center", gap: 8, paddingLeft: 6, paddingRight: 14, height: 36, borderRadius: 18 },
  keptDot: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center" },
});
