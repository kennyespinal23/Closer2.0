import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { Stack, useLocalSearchParams, useRouter, type Href } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, FadeIn, FadeOut, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, Line, RadialGradient, Rect, Stop } from "react-native-svg";
import { Page } from "@/components/page/Page";
import { SFSymbol } from "@/components/Symbol";
import { nunito } from "@/components/closer/kit";
import { BASIS, CONNECTION_TYPES, constellations, type Star } from "@/lib/closer-page/content/discovery";
import { TONE, library } from "@/lib/closer-page/content/library";
import { useCloserPage } from "@/state/closerPage";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { isInternalBuild } from "@/lib/isInternalBuild";
import * as haptics from "@/lib/haptics";
import { fill, useStrings } from "@/lib/i18n";

/**
 * Connections, the night sky (DiscoveryNetwork; CLOSER-PICKS.md "Connections": C). Each group of hand-picked links
 * is a named constellation. A story you finish lights its star; the stories one link away are faint stars that
 * twinkle, and tapping one shows its hook. Kept to what you've started, one row on You, never on Today.
 * Every star is a button with its name, so VoiceOver and keyboards walk it; with Reduce Motion nothing twinkles.
 * ?demo=1 (testing builds) shows six finished stories.
 */
const NIGHT = "#0E1729", GOLD = "#FFD66B", STARLIGHT = "#FFF4CF", TEXT = "#F3EEDF", DIM = "rgba(243,238,223,.62)";
const DEMO = ["jesus-peter-sank", "jesus-storm", "psalm-13", "god-far-away", "three-wise-men", "corrie-ten-boom"];
// where the stars sit in each constellation, by how many it has (shares of the box)
const SHAPES: Record<number, [number, number][]> = {
  1: [[0.5, 0.42]],
  2: [[0.2, 0.62], [0.78, 0.28]],
  3: [[0.14, 0.34], [0.5, 0.72], [0.86, 0.3]],
  4: [[0.12, 0.6], [0.38, 0.18], [0.66, 0.56], [0.88, 0.16]],
  5: [[0.1, 0.3], [0.34, 0.7], [0.58, 0.3], [0.84, 0.66], [0.9, 0.12]],
  6: [[0.1, 0.62], [0.28, 0.2], [0.5, 0.58], [0.7, 0.14], [0.88, 0.5], [0.66, 0.88]],
};
const BOX = 200;

const toneOf = (categoryId: string) => {
  const t = library.find(s => s.id === categoryId)?.entries[0]?.tone;
  return t ? TONE[t] : TONE.forest;
};

export default function DiscoveryNetwork() {
  const router = useRouter(), insets = useSafeAreaInsets(), { width, height } = useWindowDimensions(), reduce = useReducedMotion();
  const { finished: real } = useCloserPage();
  const t = useStrings().native.connections;
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const finished = demo && isInternalBuild() ? DEMO : real;
  const skies = useMemo(() => constellations(finished), [finished]);
  const [open, setOpen] = useState<Star | null>(null);
  const found = new Set(skies.flatMap(c => c.stars.filter(s => s.finished).map(s => s.id))).size;
  const waiting = new Set(skies.flatMap(c => c.stars.filter(s => !s.finished).map(s => s.id))).size;
  const W = width - 40;

  // a fixed scatter of dust, the same every time
  const dust = useMemo(() => Array.from({ length: 80 }, (_, i) => ({ x: (i * 97) % width, y: (i * 173) % (height * 2.4), r: i % 5 ? 0.9 : 1.5, o: 0.12 + ((i * 37) % 50) / 120 })), [width, height]);

  const go = (id: string) => { haptics.soft(); setOpen(null); router.push(`/lesson/${id}` as Href); };

  return (
    <View style={{ flex: 1, backgroundColor: NIGHT }}>
      <StatusBar style="light" />
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 60 }} showsVerticalScrollIndicator={false}>
        <Svg width={width} height={height * 2.4} style={{ position: "absolute", left: 0, top: 0 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <Defs>
            <RadialGradient id="glow" cx="50%" cy="0%" rx="90%" ry="40%">
              <Stop offset="0" stopColor="#22335A" />
              <Stop offset="1" stopColor={NIGHT} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={width} height={height * 2.4} fill="url(#glow)" />
          {dust.map((d, i) => <Circle key={i} cx={d.x} cy={d.y} r={d.r} fill="#FFFFFF" opacity={d.o} />)}
        </Svg>

        <Pressable accessibilityRole="button" accessibilityLabel={t.back} onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,.1)", alignItems: "center", justifyContent: "center" }}>
          <SFSymbol name="chevron.left" size={17} weight="bold" color="#FFFFFF" />
        </Pressable>
        <Text accessibilityRole="header" style={nunito(900, 32, { color: TEXT, letterSpacing: -0.8, lineHeight: 40, marginTop: 14 })}>{t.title}</Text>
        <Text style={nunito(700, 15, { color: DIM, marginTop: 2 })}>{found ? fill(t.counts, { found, waiting }) : t.dark}</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 }}>
          <Page size={46} mood={found ? "happy" : "curious"} act="idle" shadow={false} />
          <Text style={nunito(800, 15, { color: TEXT, flex: 1, lineHeight: 21 })}>
            {found ? t.howFound : t.howNone}
          </Text>
        </View>

        {skies.map(c => {
          const shape = SHAPES[Math.min(c.stars.length, 6)];
          const at = Object.fromEntries(c.stars.slice(0, 6).map((s, i) => [s.id, { x: shape[i][0] * W, y: 22 + shape[i][1] * (BOX - 60) }]));
          return (
            <View key={c.id} style={{ marginTop: 26 }}>
              <Text accessibilityRole="header" style={nunito(900, 12, { color: GOLD, letterSpacing: 2.2 })}>{c.sky.toUpperCase()}</Text>
              <Text style={nunito(700, 13.5, { color: DIM })}>{c.name} · {c.note}</Text>
              <View style={{ width: W, height: BOX, marginTop: 6 }}>
                <Svg width={W} height={BOX} style={{ position: "absolute" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  {c.lines.map(([a, b]) => {
                    const p = at[a], q = at[b];
                    if (!p || !q) return null;
                    const lit = c.stars.find(s => s.id === a)?.finished && c.stars.find(s => s.id === b)?.finished;
                    return <Line key={a + b} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={GOLD} strokeOpacity={lit ? 0.95 : 0.4} strokeWidth={lit ? 2 : 1.5} strokeDasharray={lit ? undefined : "3 6"} strokeLinecap="round" />;
                  })}
                </Svg>
                {c.stars.slice(0, 6).map((s, i) => (
                  <StarButton key={s.id} star={s} x={at[s.id].x} y={at[s.id].y} W={W} delay={i * 400} reduce={reduce} onPress={() => { haptics.soft(); setOpen(s); }} />
                ))}
              </View>
            </View>
          );
        })}
        {found > 0 && <Text style={nunito(700, 13, { color: DIM, textAlign: "center", marginTop: 18, lineHeight: 18 })}>{t.byHand}</Text>}
      </ScrollView>

      {open && <>
        <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(5,10,20,.5)" }}>
          <Pressable accessibilityRole="button" accessibilityLabel={t.close} style={{ flex: 1 }} onPress={() => setOpen(null)} />
        </Animated.View>
        <Animated.View accessibilityViewIsModal entering={reduce ? FadeIn : SlideInDown.springify().damping(20)} exiting={reduce ? FadeOut : SlideOutDown.duration(200)}
          style={{ position: "absolute", left: 10, right: 10, bottom: insets.bottom + 10, backgroundColor: "#FFF7EB", borderRadius: 28, padding: 20 }}>
          <Sheet star={open} onGo={() => go(open.id)} onClose={() => setOpen(null)} />
        </Animated.View>
      </>}
    </View>
  );
}

/* One star: lit with its name under it, or faint with a "?" that twinkles until you find it */
function StarButton({ star: s, x, y, W, delay, reduce, onPress }: { star: Star; x: number; y: number; W: number; delay: number; reduce: boolean; onPress: () => void }) {
  const tw = useSharedValue(1);
  const t = useStrings().native.connections;
  useEffect(() => {
    if (reduce || s.finished) { tw.value = 1; return; }
    tw.value = 0.45;
    tw.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.quad) }), -1, true));
  }, [reduce, s.finished, delay, tw]);
  const twinkle = useAnimatedStyle(() => ({ opacity: tw.value }));
  const label = s.finished ? fill(t.starFound, { title: s.title, category: s.categoryLabel }) : fill(t.starFaint, { hook: s.hook ?? "" });
  const lx = Math.min(Math.max(x - 70, 0), W - 140);
  return <>
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} accessibilityHint={s.finished ? t.starFoundHint : t.starFaintHint} hitSlop={6}
      style={{ position: "absolute", left: x - 22, top: y - 22, width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
      {s.finished ? (
        <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: STARLIGHT, borderWidth: 3, borderColor: toneOf(s.categoryId).bg, shadowColor: GOLD, shadowOpacity: 0.95, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }} />
      ) : (
        <Animated.View style={[{ width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderStyle: "dashed", borderColor: "rgba(255,214,107,.7)", alignItems: "center", justifyContent: "center" }, twinkle]}>
          <Text style={nunito(900, 16, { color: GOLD, lineHeight: 22 })}>?</Text>
        </Animated.View>
      )}
    </Pressable>
    {s.finished && (
      <View pointerEvents="none" style={{ position: "absolute", left: lx, width: 140, top: y + 14, alignItems: "center" }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text numberOfLines={2} style={nunito(800, 12.5, { color: TEXT, textAlign: "center", lineHeight: 16, backgroundColor: "rgba(14,23,41,.85)", borderRadius: 6, paddingHorizontal: 4, overflow: "hidden" })}>{s.title}</Text>
      </View>
    )}
  </>;
}

/* What a star opens: a found story to revisit, or the hook of one you haven't found */
function Sheet({ star: s, onGo, onClose }: { star: Star; onGo: () => void; onClose: () => void }) {
  const tone = toneOf(s.categoryId);
  const t = useStrings().native.connections;
  const meta = [s.categoryLabel, fill(t.minutes, { n: s.estimatedDuration }), s.via ? BASIS[s.via.basis] : null].filter(Boolean).join(" · ");
  return <>
    <Text style={nunito(900, 11.5, { color: "#8A938D", letterSpacing: 1.6 })}>{(s.via && !s.finished ? `${CONNECTION_TYPES[s.via.type].label} · ${meta}` : meta).toUpperCase()}</Text>
    <Text accessibilityRole="header" style={nunito(900, 21, { color: "#17251F", lineHeight: 27, marginTop: 6 })}>{s.finished ? s.title : s.hook}</Text>
    <Text style={nunito(700, 14.5, { color: "#4E5B54", lineHeight: 20, marginTop: 6 })}>
      {s.finished ? fill(t.foundThis, { refs: s.scriptureReferences.join(" · ") }) : s.via?.explanation}
    </Text>
    {!s.finished && <Text style={nunito(800, 14, { color: "#17251F", marginTop: 8 })}>{t.leadsTo} <Text style={nunito(900, 14, { color: "#17251F" })}>{s.title}</Text></Text>}
    <View style={{ flexDirection: "row", gap: 8, marginTop: 16 }}>
      <Pressable style={{ flex: 1 }} accessibilityRole="button" accessibilityLabel={`${s.finished ? t.openAgain : t.start}: ${s.title}`} onPress={onGo}>
        <View style={{ height: 52, borderRadius: 16, backgroundColor: tone.bg, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 0, shadowOffset: { width: 0, height: 4 } }}>
          <Text style={nunito(900, 17, { color: tone.fg })}>{s.finished ? t.openAgain : t.start}</Text>
        </View>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel={t.notNow} onPress={onClose}>
        <View style={{ height: 52, paddingHorizontal: 18, borderRadius: 16, backgroundColor: "#F3E6D2", alignItems: "center", justifyContent: "center" }}>
          <Text style={nunito(900, 16, { color: "#17251F" })}>{t.notNow}</Text>
        </View>
      </Pressable>
    </View>
  </>;
}
