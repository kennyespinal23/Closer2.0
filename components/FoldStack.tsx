import { View } from "react-native";
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated";
import { focusAmount } from "@/lib/homeFocus";

/**
 * Home's folding cards, moved by transforms alone.
 *
 * Animating card heights made the scroll view lay itself out again on every
 * frame, which stuttered. Here nothing changes size while you scroll: each
 * card is drawn at its open height inside a window that clips its bottom,
 * the window slides up as the card folds while the card slides back down
 * inside it (so only the bottom is hidden), and the cards below move up by
 * the same amount. The stack's own height never changes, so neither does
 * the scroll content.
 */
export type FoldItem = {
  key: string;
  /** The card's scroll stop, or null for something that never folds (it only moves). */
  stop: number | null;
  slim: number; open: number;
  /** Space after this item. */
  gap: number;
  radius: number;
  node: React.ReactNode;
};

export function FoldStack({ items, scrollY, distance, last }: { items: FoldItem[]; scrollY: SharedValue<number>; distance: number; last: number }) {
  // Tall enough for whichever stop opens the most.
  const slimTotal = items.reduce((sum, it, i) => sum + it.slim + (i < items.length - 1 ? it.gap : 0), 0);
  const height = slimTotal + Math.max(0, ...items.map(it => it.open - it.slim));
  const specs = items.map(({ stop, slim, open, gap }) => ({ stop, slim, open, gap }));
  return <View style={{ height }}>
    {items.map((it, i) => <FoldSlot key={it.key} index={i} specs={specs} scrollY={scrollY} distance={distance} last={last} radius={it.radius} open={it.open}>{it.node}</FoldSlot>)}
  </View>;
}

type Spec = { stop: number | null; slim: number; open: number; gap: number };

function FoldSlot({ index, specs, scrollY, distance, last, radius, open, children }: { index: number; specs: Spec[]; scrollY: SharedValue<number>; distance: number; last: number; radius: number; open: number; children: React.ReactNode }) {
  const heightAt = (spec: Spec, y: number) => {
    "worklet";
    return spec.stop === null ? spec.slim : spec.slim + (spec.open - spec.slim) * focusAmount(y, spec.stop, last, distance);
  };
  const windowStyle = useAnimatedStyle(() => {
    let offset = 0;
    for (let j = 0; j < index; j++) offset += heightAt(specs[j]!, scrollY.value) + specs[j]!.gap;
    const hidden = open - heightAt(specs[index]!, scrollY.value);
    return { transform: [{ translateY: offset - hidden }] };
  });
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateY: open - heightAt(specs[index]!, scrollY.value) }] }));
  return <Animated.View pointerEvents="box-none" style={[{ position: "absolute", left: 0, right: 0, top: 0, height: open, overflow: "hidden", borderRadius: radius, borderCurve: "continuous" }, windowStyle]}>
    <Animated.View pointerEvents="box-none" style={[{ height: open }, cardStyle]}>{children}</Animated.View>
  </Animated.View>;
}
