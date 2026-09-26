import { useEffect, useRef, type ReactNode } from "react";
import { Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import Animated, { cancelAnimation, Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import type { Book } from "@/constants/books";
import { LibraryBookCover, type LibraryBookFrame } from "./LibraryBookcase";
import { useReducedMotion } from "@/lib/useReducedMotion";

export type BookTransitionPhase = "opening" | "idle" | "closing";
/** One mounted surface expands from the shelf and returns to it; no modal/push handoff. */
export function LibraryBookTransition({ book, source, snapshot, phase, onOpened, onClosed, children }: {
  book: Book; source: LibraryBookFrame; snapshot?: string; phase: BookTransitionPhase;
  onOpened: () => void; onClosed: () => void; children: ReactNode;
}) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const flight = useSharedValue(0), hinge = useSharedValue(0), expand = useSharedValue(0);
  const callbacks = useRef({ onOpened, onClosed });
  callbacks.current = { onOpened, onClosed };
  const opened = () => callbacks.current.onOpened();
  const closed = () => callbacks.current.onClosed();
  const w = Math.min(340, width * .86), h = w * 1.42;
  const curve = Easing.bezier(.25, .8, .25, 1);
  useEffect(() => {
    if (phase === "idle") return;
    if (reduced) { flight.value = 1; hinge.value = 1; expand.value = 1; phase === "opening" ? opened() : closed(); return; }
    if (phase === "opening") {
      flight.value = withTiming(1, { duration: 260, easing: curve });
      hinge.value = withDelay(120, withTiming(1, { duration: 300, easing: Easing.bezier(.65, 0, .35, 1) }));
      expand.value = withDelay(350, withTiming(1, { duration: 230, easing: curve }, done => { if (done) runOnJS(opened)(); }));
    } else {
      expand.value = withTiming(0, { duration: 220, easing: Easing.bezier(.4, 0, .3, 1) });
      hinge.value = withDelay(100, withTiming(0, { duration: 260, easing: Easing.bezier(.65, 0, .35, 1) }));
      flight.value = withDelay(280, withTiming(0, { duration: 260, easing: Easing.bezier(.5, 0, .3, 1) }, done => { if (done) runOnJS(closed)(); }));
    }
    return () => { cancelAnimation(flight); cancelAnimation(hinge); cancelAnimation(expand); };
  }, [phase, reduced]);
  const scene = useAnimatedStyle(() => {
    const fw = source.width + (w - source.width) * flight.value;
    const fh = source.height + (h - source.height) * flight.value;
    return { borderRadius: 12 * (1 - expand.value), transform: [
      { translateX: (source.x + source.width / 2 - width / 2) * (1 - flight.value) * (1 - expand.value) },
      { translateY: ((source.y + source.height / 2 - height / 2 + 10) * (1 - flight.value) - 10 - Math.sin(flight.value * Math.PI) * 28) * (1 - expand.value) },
      { scaleX: fw / width + (1 - fw / width) * expand.value },
      { scaleY: fh / height + (1 - fh / height) * expand.value },
    ] };
  });
  const bookFrame = useAnimatedStyle(() => ({ opacity: interpolate(expand.value, [0, .25, 1], [1, 0, 0]), transform: [
    { translateX: (source.x + source.width / 2 - width / 2) * (1 - flight.value) },
    { translateY: (source.y + source.height / 2 - height / 2 + 10) * (1 - flight.value) - 10 - Math.sin(flight.value * Math.PI) * 28 },
    { scale: source.width / w + (1 - source.width / w) * flight.value },
  ] }));
  const cover = useAnimatedStyle(() => ({ transformOrigin: "left", transform: [{ perspective: 1800 }, { rotateY: `${-178 * hinge.value}deg` }] }));
  const scrim = useAnimatedStyle(() => ({ opacity: interpolate(flight.value, [0, 1], [0, .7]) * (1 - expand.value) }));
  return <View style={{ flex: 1, backgroundColor: "#221819" }}>
    {phase !== "idle" && <View pointerEvents="none" style={{ position: "absolute", inset: 0 }}>{snapshot && <Image source={{ uri: snapshot }} cachePolicy="memory" transition={0} contentFit="fill" style={{ position: "absolute", inset: 0 }} />}<Animated.View style={[{ position: "absolute", inset: 0, backgroundColor: "#160D07" }, scrim]} /></View>}
    <Animated.View pointerEvents={phase === "idle" ? "auto" : "none"} accessibilityElementsHidden={phase !== "idle"} style={[{ width, height, overflow: "hidden" }, scene]}>{children}</Animated.View>
    {phase !== "idle" && <View pointerEvents="auto" accessibilityElementsHidden style={{ position: "absolute", inset: 0, justifyContent: "center", alignItems: "center" }}><Animated.View style={[{ width: w, height: h }, bookFrame]}><Animated.View style={[{ width: w, height: h }, cover]}>
      <View style={{ position: "absolute", inset: 0, backfaceVisibility: "hidden", backgroundColor: "#FFFBF4", transform: [{ rotateY: "180deg" }], alignItems: "center", justifyContent: "center", padding: 32 }}><Text style={{ color: "#6F5E50", fontFamily: "System", fontSize: 20, textAlign: "center" }}>The Lord is closer than you think.</Text></View>
      <View style={{ backfaceVisibility: "hidden" }}><LibraryBookCover book={book} width={w} /></View>
    </Animated.View></Animated.View></View>}
  </View>;
}
