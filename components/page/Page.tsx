import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  ZoomIn,
  ZoomOut,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Circle, Ellipse, G, Path, Rect } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { ACTIONS, HELD, IDLE, QUIET_MOODS, SPARKS, type Action, type Mood } from "@/lib/closer-page/page/states";

/**
 * Page, Closer's storykeeper, drawn natively: a chunky red book with an open-book face and a yellow bookmark.
 * The same drawing and the same animation language as the lessons (lib/closer-page/page/states.ts):
 *   action layer  one-shot moves (enter, hop, tilt, spin…), played from the shared keyframes
 *   idle layer    the hover that never stops (slower when the moment is quiet)
 *   body          covers, pages, bookmark, a face whose eyes blink and glance
 */

const C = {
  red: "#D92B2F", lip: "#B62E36", back: "#9C2129", pages: "#FFF1DD", pageLine: "#EBD6B6",
  face: "#FFF4E3", eye: "#2A1416", gold: "#FFC72C", goldDeep: "#F0AD0E", blush: "#F49A9A",
};

export type PageProps = {
  mood?: Mood;
  act?: Action;
  /** change it to play the same action again */
  actKey?: number | string;
  /** where he looks, -1 (left) to 1 (right) */
  look?: number;
  size?: number;
  shadow?: boolean;
  onTap?: () => void;
  label?: string;
};

type Prop = "x" | "y" | "rotate" | "scaleX" | "scaleY";
const PROPS: Prop[] = ["x", "y", "rotate", "scaleX", "scaleY"];
const REST: Record<Prop, number> = { x: 0, y: 0, rotate: 0, scaleX: 1, scaleY: 1 };

/* Play one of the shared actions on the shared values. Keyframe actions become timed sequences; the held poses
   (tilt, stare, lean, settle) become springs, as in the lessons. */
function play(action: Action, sv: Record<Prop, SharedValue<number>>, scale: number) {
  const a = ACTIONS[action] as unknown as Record<string, unknown> & { transition: Record<string, unknown> };
  const tr = a.transition as { type?: string; duration?: number; times?: number[]; stiffness?: number; damping?: number };
  for (const p of PROPS) {
    const frames = a[p] as (number | null)[] | undefined;
    if (!frames) continue;
    // x and y in the shared language are in Page-at-150px units; scale them to this size
    const k = p === "x" || p === "y" ? scale : 1;
    const target = (v: number) => v * k;
    if (tr.type === "spring") {
      const last = frames[frames.length - 1];
      if (last !== null) sv[p].value = withSpring(target(last), { stiffness: tr.stiffness ?? 300, damping: tr.damping ?? 18 });
      continue;
    }
    const total = (tr.duration ?? 0.5) * 1000;
    const times = tr.times ?? frames.map((_, i) => i / Math.max(1, frames.length - 1));
    const steps = frames.map((v, i) => ({ v, t: i === 0 ? 0 : (times[i] - times[i - 1]) * total })).filter(s => s.v !== null) as { v: number; t: number }[];
    if (!steps.length) continue;
    const [first, ...rest] = steps;
    sv[p].value = withSequence(
      withTiming(target(first.v), { duration: first.t }),
      ...rest.map(s => withTiming(target(s.v), { duration: Math.max(16, s.t), easing: Easing.out(Easing.quad) })),
    );
  }
}

export function Page({ mood = "neutral", act = "idle", actKey = 0, look = 0, size = 160, shadow = true, onTap, label = "Page, your guide" }: PageProps) {
  const reduce = useReducedMotion();
  const [tapMood, setTapMood] = useState<Mood | null>(null);
  const [blink, setBlink] = useState(false);
  const [glance, setGlance] = useState(0);
  const last = useRef<Action>("idle");
  const sv = { x: useSharedValue(0), y: useSharedValue(0), rotate: useSharedValue(0), scaleX: useSharedValue(1), scaleY: useSharedValue(1) };
  const hover = useSharedValue(0);
  const scale = size / 150;

  // the action layer
  useEffect(() => {
    if (reduce) {
      for (const p of PROPS) sv[p].value = withTiming(p === "rotate" && act === "tilt" ? 6 : REST[p], { duration: 250 });
      return;
    }
    if (HELD.includes(last.current) && !HELD.includes(act)) play("settle", sv, scale);
    last.current = act;
    if (act !== "idle") play(act, sv, scale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [act, actKey, reduce]);

  // the idle layer: a slow hover, quieter for quiet moods
  const face = tapMood ?? mood;
  const idle = QUIET_MOODS.includes(face) ? IDLE.quiet : IDLE.normal;
  useEffect(() => {
    if (reduce) { hover.value = 0; return; }
    hover.value = 0;
    hover.value = withRepeat(withTiming(1, { duration: (idle.duration * 1000) / 2, easing: Easing.inOut(Easing.sin) }), -1, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idle.duration, reduce]);

  // blinks, sometimes twice
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 120);
        if (Math.random() < 0.25) setTimeout(() => { setBlink(true); setTimeout(() => setBlink(false), 110); }, 260);
        loop();
      }, 2200 + Math.random() * 3200);
    };
    loop();
    return () => clearTimeout(t);
  }, []);

  // when nobody tells him where to look, he glances around
  useEffect(() => {
    if (look !== 0 || reduce) { setGlance(0); return; }
    let t: ReturnType<typeof setTimeout>;
    const loop = () => {
      t = setTimeout(() => {
        setGlance(Math.random() < 0.5 ? -0.8 : 0.8);
        setTimeout(() => setGlance(0), 700 + Math.random() * 500);
        loop();
      }, 3800 + Math.random() * 4200);
    };
    loop();
    return () => clearTimeout(t);
  }, [look, reduce]);

  const actionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: sv.x.value }, { translateY: sv.y.value + size * 0.35 },
      { rotate: `${sv.rotate.value}deg` }, { scaleX: sv.scaleX.value }, { scaleY: sv.scaleY.value },
      { translateY: -size * 0.35 },
    ],
  }));
  const idleStyle = useAnimatedStyle(() => {
    const amp = QUIET_MOODS.includes(face) ? 3 : 7;
    const rot = QUIET_MOODS.includes(face) ? 0.6 : 1.6;
    return { transform: [{ translateY: -amp * hover.value * scale }, { rotate: `${-rot + 2 * rot * hover.value}deg` }] };
  });
  const shadowStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: 1 - 0.16 * hover.value }], opacity: 0.9 - 0.3 * hover.value }));

  function tap() {
    if (!reduce) play("react", sv, scale);
    const picks: Mood[] = ["excited", "happy", "cheeky", "surprised"];
    setTapMood(picks[Math.floor(Math.random() * picks.length)]);
    setTimeout(() => setTapMood(null), 900);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onTap?.();
  }

  const eyesX = (look || glance) * 5;
  const spark = SPARKS[face];
  return (
    <View style={{ width: size, height: size * 1.1 }} pointerEvents="box-none">
      {shadow && (
        <Animated.View
          pointerEvents="none"
          style={[{ position: "absolute", left: size * 0.25, bottom: 0, width: size * 0.5, height: size * 0.07, borderRadius: size, backgroundColor: "rgba(0,0,0,.18)" }, shadowStyle]}
        />
      )}
      <Animated.View style={[{ position: "absolute", inset: 0 }, actionStyle]} pointerEvents="box-none">
        <Animated.View style={[{ position: "absolute", inset: 0 }, idleStyle]} pointerEvents="box-none">
          <Pressable onPressIn={tap} accessibilityRole="button" accessibilityLabel={label} style={{ width: size, height: size }} hitSlop={6}>
            <Svg viewBox="0 0 200 200" width={size} height={size}>
              <Body />
              <Face mood={face} blink={blink} eyesX={eyesX} />
            </Svg>
          </Pressable>
          {spark && (
            <Animated.View key={spark} entering={reduce ? undefined : ZoomIn.springify().damping(14)} exiting={ZoomOut.duration(150)} pointerEvents="none"
              style={{ position: "absolute", left: 166 * (size / 200), top: -4 * (size / 200) }}>
              <Svg viewBox="0 0 60 60" width={66 * (size / 200)} height={66 * (size / 200)}>
                <Sparks kind={spark} />
              </Svg>
            </Animated.View>
          )}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

function Body() {
  return (
    <G>
      <Rect x="30" y="46" width="140" height="124" rx="28" fill={C.back} />
      <Rect x="38" y="52" width="44" height="110" rx="13" fill={C.pages} />
      {[0, 1, 2, 3, 4].map(i => <Path key={i} d={`M44 ${72 + i * 18} H56`} stroke={C.pageLine} strokeWidth={3.5} strokeLinecap="round" />)}
      <Rect x="54" y="38" width="122" height="126" rx="28" fill={C.lip} />
      <Rect x="54" y="34" width="122" height="120" rx="28" fill={C.red} />
      <Path d="M74 44 H130" stroke="#fff" strokeOpacity={0.24} strokeWidth={6} strokeLinecap="round" />
      <Path d="M80 22 h28 a5 5 0 0 1 5 5 v52 l-19 -12 l-19 12 v-52 a5 5 0 0 1 5 -5 z" fill={C.gold} />
      <Rect x="75" y="31" width="38" height="7" rx="3.5" fill={C.goldDeep} />
      <Path d="M86 70 C100 64 110 66 116 72 C122 66 132 64 146 70 Q154 72 154 80 L154 122 Q154 130 146 130 L123 130 Q116 130 116 135 Q116 130 109 130 L86 130 Q78 130 78 122 L78 80 Q78 72 86 70 Z" fill={C.face} />
    </G>
  );
}

const EYES: [number, number][] = [[102, 99], [130, 99]];

function Face({ mood, blink, eyesX }: { mood: Mood; blink: boolean; eyesX: number }) {
  const blinks = !["happy", "moved", "celebrating", "excited"].includes(mood);
  const sy = blink && blinks ? 0.12 : 1;
  return (
    <G>
      {(mood === "moved" || mood === "celebrating") && (
        <G fill={C.blush} opacity={0.75}>
          <Ellipse cx="91" cy="114" rx="7" ry="4.5" />
          <Ellipse cx="141" cy="114" rx="7" ry="4.5" />
        </G>
      )}
      <G transform={`translate(${116 + eyesX} 99) scale(1 ${sy}) translate(-116 -99)`}>
        {EYES.map(([cx, cy], i) => <Eye key={i} mood={mood} cx={cx} cy={cy} side={i === 0 ? -1 : 1} />)}
      </G>
      <Mouth mood={mood} />
    </G>
  );
}

function Eye({ mood, cx, cy, side }: { mood: Mood; cx: number; cy: number; side: number }) {
  const ink = { stroke: C.eye, strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  const oval = (rx: number, ry: number, dy = 0) => (
    <G>
      <Ellipse cx={cx} cy={cy + dy} rx={rx} ry={ry} fill={C.eye} />
      <Circle cx={cx - rx * 0.3} cy={cy + dy - ry * 0.45} r={Math.max(1.6, rx * 0.3)} fill="#fff" opacity={0.9} />
    </G>
  );
  switch (mood) {
    case "happy": case "moved": case "celebrating":
      return <Path d={`M${cx - 8} ${cy + 3} Q${cx} ${cy - 9} ${cx + 8} ${cy + 3}`} {...ink} />;
    case "excited":
      return side < 0
        ? <Path d={`M${cx - 6} ${cy - 7} L${cx + 5} ${cy} L${cx - 6} ${cy + 7}`} {...ink} />
        : <Path d={`M${cx + 6} ${cy - 7} L${cx - 5} ${cy} L${cx + 6} ${cy + 7}`} {...ink} />;
    case "curious":
      return (
        <G>
          {oval(side > 0 ? 7.5 : 6.5, side > 0 ? 12.5 : 10, side > 0 ? 0 : 1)}
          {side > 0
            ? <Path d={`M${cx - 8} ${cy - 18} Q${cx} ${cy - 25} ${cx + 9} ${cy - 20}`} {...ink} strokeWidth={4} />
            : <Path d={`M${cx - 8} ${cy - 14} L${cx + 7} ${cy - 15}`} {...ink} strokeWidth={4} />}
        </G>
      );
    case "surprised": return oval(8.5, 13.5, -1);
    case "thinking":
      return (
        <G>
          {oval(7, 11)}
          <Rect x={cx - 10} y={cy - 14} width="20" height="9" fill={C.face} />
          <Path d={`M${cx - 9} ${cy - 5} L${cx + 9} ${cy - 5}`} {...ink} strokeWidth={4} />
        </G>
      );
    case "tender":
      return (
        <G>
          {oval(6.5, 10, 2)}
          <Path d={side < 0 ? `M${cx - 8} ${cy - 12} L${cx + 6} ${cy - 16}` : `M${cx + 8} ${cy - 12} L${cx - 6} ${cy - 16}`} {...ink} strokeWidth={4} />
        </G>
      );
    case "cheeky":
      return (
        <G>
          {oval(7, 6.5, 2)}
          <Rect x={cx - 10} y={cy - 12} width="20" height="10" fill={C.face} />
          <Path d={`M${cx - 9} ${cy - 2} L${cx + 9} ${cy - 3.5}`} {...ink} strokeWidth={4.5} />
        </G>
      );
    default: return oval(7, 11.5);
  }
}

function Mouth({ mood }: { mood: Mood }) {
  const ink = { stroke: C.eye, strokeWidth: 4, strokeLinecap: "round" as const, fill: "none" };
  if (mood === "celebrating" || mood === "excited") return <Path d="M107 114 Q116 128 125 114 Z" fill={C.eye} />;
  if (mood === "surprised") return <Ellipse cx="116" cy="119" rx="4" ry="5" fill={C.eye} />;
  if (mood === "cheeky") return <Path d="M108 118 Q116 122 124 115" {...ink} />;
  if (mood === "moved") return <Path d="M110 117 Q116 121 122 117" {...ink} strokeWidth={3.5} />;
  return null;
}

/* the small yellow marks: a pop of lines, a question mark, two bangs */
function Sparks({ kind }: { kind: "pop" | "question" | "bang" }) {
  if (kind === "pop") return <G stroke={C.gold} strokeWidth={6} strokeLinecap="round"><Path d="M8 30 L2 12" /><Path d="M24 26 L28 6" /><Path d="M36 38 L54 26" /></G>;
  if (kind === "question") return <Path d="M14 18 Q14 4 28 4 Q42 4 42 16 Q42 24 30 28 L30 36 M30 48 L30 49" stroke={C.gold} strokeWidth={7} strokeLinecap="round" fill="none" />;
  return <G stroke={C.gold} strokeWidth={7} strokeLinecap="round"><Path d="M14 6 L16 34" /><Path d="M17 46 L17 47" /><Path d="M36 4 L32 32" /><Path d="M31 44 L31 45" /></G>;
}
