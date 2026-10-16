import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { Easing, cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Circle, Defs, Path, RadialGradient, Rect, Stop, Text as SvgText, TextPath } from "react-native-svg";
import { Text } from "@/components/CloserText";
import { useReducedMotion } from "@/lib/useReducedMotion";

/**
 * Each devotional category owns a colour and one big gesture: a sun, "Him.",
 * a quote mark, a name, a lens, a struck-out lie, a ring, a question mark.
 * The Today card and the walk it opens both wear it.
 */
export type CategoryTheme = {
  ground: [string, string, string]; // lit corner, middle, far edge
  light: boolean;      // light ground: dark ink and dark chrome
  ink: string;         // title
  label: string;       // category line
  num: string;         // day number
  chip: string;        // step chips on the card
  chipIcon: string;
  accent: string;      // next step, button
  accentInk: string;
};

const T = (ground: [string, string, string], light: boolean, label: string, accent: string, accentInk: string, ink?: string): CategoryTheme => ({
  ground, light, label, accent, accentInk,
  ink: ink ?? (light ? "#2A1206" : "#FFFFFF"),
  num: light ? "#2A120680" : "#FFFFFF8C",
  chip: light ? "#2A1206E0" : "#FFFFFFEB",
  chipIcon: light ? "#FFF6E6" : "#2A1206",
});

export const CATEGORY_THEME: Record<string, CategoryTheme> = {
  "daily-church": T(["#FFE45C", "#FFC21A", "#FF9F0A"], true, "#8A3B00", "#FFC21A", "#2A1206", "#3A1500"),
  "jesus-only": T(["#FF5A4E", "#E0233A", "#A80F2A"], false, "#FFE27A", "#FF4B55", "#FFFFFF"),
  "letters-struggling": T(["#2BD58C", "#13A06A", "#0A6B47"], false, "#FFE0C9", "#2BD58C", "#06301F"),
  "letters-grateful": T(["#FFB3C6", "#FF7A9E", "#F24F7F"], true, "#6E0B2C", "#FF7A9E", "#3A0716", "#3A0716"),
  "character-studies": T(["#FFB15C", "#FF7A1A", "#E2500A"], false, "#FFF1E0", "#FF8A2B", "#2A1000"),
  "deep-verse": T(["#3A2E44", "#231B2A", "#18121C"], false, "#FFC21A", "#FFC21A", "#2A1206"),
  "misconceptions": T(["#FFFFFF", "#FFF9EE", "#FFF1DA"], true, "#6E645C", "#FF2E1F", "#FFFFFF"),
  "testimonies": T(["#4BE08F", "#1FB868", "#0E8A4C"], false, "#FFF6B0", "#4BE08F", "#06301F"),
  "questions": T(["#4A3624", "#33261C", "#261D17"], false, "#FFC21A", "#FFC21A", "#2A1206"),
};
export const categoryTheme = (id: string) => CATEGORY_THEME[id] ?? CATEGORY_THEME["daily-church"]!;

/** The lit ground, brightest in the top right corner. */
export function CategoryGround({ id }: { id: string }) {
  const [a, b, c] = categoryTheme(id).ground, gid = `cg-${id}`;
  const dim = id === "questions" || id === "deep-verse";
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: b, borderRadius: 28, borderCurve: "continuous", borderWidth: dim ? 1.5 : 0, borderColor: "#FFC21A40" }]}><Svg width="100%" height="100%">
    <Defs><RadialGradient id={gid} cx="88%" cy="0%" rx="125%" ry="110%"><Stop offset="0" stopColor={a}/><Stop offset=".45" stopColor={b}/><Stop offset="1" stopColor={c}/></RadialGradient></Defs>
    <Rect width="100%" height="100%" fill={`url(#${gid})`}/>
  </Svg>{dim && <View style={[StyleSheet.absoluteFill, { borderRadius: 28, borderWidth: 1.5, borderColor: "#FFC21A47" }]}/>}</View>;
}

const NAMES = ["Adam", "Eve", "Cain", "Abel", "Seth", "Enoch", "Noah", "Abram", "Abraham", "Sarai", "Sarah", "Hagar", "Lot", "Isaac", "Rebekah", "Esau", "Jacob", "Rachel", "Leah", "Joseph", "Judah", "Moses", "Aaron", "Miriam", "Joshua", "Rahab", "Gideon", "Samson", "Ruth", "Naomi", "Boaz", "Hannah", "Samuel", "Saul", "David", "Jonathan", "Goliath", "Solomon", "Elijah", "Elisha", "Jonah", "Esther", "Daniel", "Job", "Mary", "Martha", "Peter", "John", "Paul", "Thomas", "Zacchaeus", "Lazarus", "Nicodemus"];
/** A name for a character study: the first person the passage or title mentions. */
export function characterName(title: string, text: string) {
  const hay = `${title} ${text}`;
  let best: { name: string; at: number } | null = null;
  for (const n of NAMES) { const at = hay.search(new RegExp(`\\b${n}\\b`)); if (at >= 0 && (!best || at < best.at)) best = { name: n, at }; }
  if (best) return best.name;
  return /\bman\b/.test(hay) ? "Adam" : title.split(" ")[0] ?? "";
}

function Ring({ size, reduced }: { size: number; reduced: boolean }) {
  const r = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    r.value = withRepeat(withTiming(360, { duration: 24000, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(r);
  }, [reduced, r]);
  const spin = useAnimatedStyle(() => ({ transform: [{ rotate: `${r.value}deg` }] }));
  return <View style={{ width: size, height: size }}>
    <Animated.View style={[StyleSheet.absoluteFill, spin]}>
      <Svg width={size} height={size} viewBox="0 0 220 220">
        <Defs><Path id="ringPath" d="M110 30a80 80 0 1 1 0 160a80 80 0 1 1 0-160"/></Defs>
        <SvgText fill="#FFFFFFD9" fontSize={17} fontWeight="900" letterSpacing={4}><TextPath href="#ringPath">STILL MOVING · STILL MOVING · STILL MOVING ·</TextPath></SvgText>
      </Svg>
    </Animated.View>
    <View style={{ position: "absolute", left: size / 2 - size * .1, top: size / 2 - size * .1, width: size * .2, height: size * .2, borderRadius: size * .1, backgroundColor: "#FFE14D" }}/>
  </View>;
}

/**
 * The gesture, drawn into the top right of whatever holds it. `scale` grows it
 * for the opened sheet; `top` drops it below a header.
 */
export function CategoryGesture({ id, title, text, scale = 1, top = 0 }: { id: string; title: string; text: string; scale?: number; top?: number }) {
  const reduced = useReducedMotion(), t = categoryTheme(id);
  const wrap = { position: "absolute" as const, right: 0, top, transform: [{ scale }], transformOrigin: "right top" };
  switch (id) {
    case "jesus-only":
      return <View pointerEvents="none" style={[wrap, { right: -14 * scale, top: top - 14 }]}><Text style={{ fontSize: 132, lineHeight: 140, fontWeight: "900", letterSpacing: -8, color: "#FFFFFF33" }}>Him<Text style={{ color: "#FFE27A" }}>.</Text></Text></View>;
    case "letters-struggling":
      return <View pointerEvents="none" style={[wrap, { right: 4, top: top - 46 }]}><Text style={{ fontSize: 300, lineHeight: 320, fontWeight: "900", color: "#FFB38A", transform: [{ rotate: "-6deg" }] }}>{"“"}</Text></View>;
    case "letters-grateful":
      return <View pointerEvents="none" style={[wrap, { right: 4, top: top - 46 }]}><Text style={{ fontSize: 300, lineHeight: 320, fontWeight: "900", color: "#7A0E33" }}>{"”"}</Text></View>;
    case "character-studies": {
      const name = characterName(title, text).toUpperCase();
      return <View pointerEvents="none" style={[wrap, { right: -10, top: top + 92 }]}><Text numberOfLines={1} style={{ fontSize: 100, lineHeight: 104, fontWeight: "900", letterSpacing: -5, color: "#FFFFFF42" }}><Text style={{ color: "#3A1200" }}>{name.charAt(0)}</Text>{name.slice(1)}</Text></View>;
    }
    case "deep-verse": {
      const words = text.replace(/[“”"']/g, "").split(/\s+/).filter(Boolean).slice(0, 9), last = words.pop() ?? "";
      return <View pointerEvents="none" style={[wrap, { width: 250, top: top + 22, right: -30 }]}>
        <Text numberOfLines={4} style={{ fontSize: 34, lineHeight: 34, fontWeight: "900", letterSpacing: -1.2, color: "#FFFFFF24" }}>{words.join(" ")} <Text style={{ color: "#FFC21A" }}>{last}</Text></Text>
        <View style={{ position: "absolute", right: 58, top: 64, width: 104, height: 104, borderRadius: 52, borderWidth: 4, borderColor: "#F7F0E6" }}/>
        <View style={{ position: "absolute", right: 28, top: 172, width: 44, height: 8, borderRadius: 4, backgroundColor: "#F7F0E6", transform: [{ rotate: "40deg" }] }}/>
      </View>;
    }
    case "misconceptions":
      return <View pointerEvents="none" style={[wrap, { right: -6, top: top + 30 }]}>
        <Text style={{ fontSize: 150, lineHeight: 156, fontWeight: "900", letterSpacing: -6, color: "#2A12061F" }}>LIE</Text>
        <View style={{ position: "absolute", right: -14, top: 66, width: 270, height: 12, borderRadius: 6, backgroundColor: "#FF2E1F", transform: [{ rotate: "-12deg" }] }}/>
      </View>;
    case "testimonies":
      return <View pointerEvents="none" style={[wrap, { right: -40, top: top - 30 }]}><Ring size={220} reduced={reduced}/></View>;
    case "questions":
      return <View pointerEvents="none" style={[wrap, { right: -14, top: top - 40 }]}><Text style={{ fontSize: 290, lineHeight: 300, fontWeight: "900", letterSpacing: -10, color: "#FFC21A" }}>?</Text></View>;
    default: // Daily Church: the sun coming up in the corner
      return <View pointerEvents="none" style={[wrap, { right: -96, top: top - 110 }]}>
        <Svg width={380} height={380} viewBox="0 0 380 380">
          <Defs><RadialGradient id="sunFace" cx="40%" cy="35%" r="60%"><Stop offset="0" stopColor="#FFFFFF"/><Stop offset=".55" stopColor="#FFF6C9"/><Stop offset="1" stopColor="#FFE27A"/></RadialGradient></Defs>
          <Circle cx={190} cy={190} r={190} fill="#FFFFFF" opacity={.12}/>
          <Circle cx={190} cy={190} r={162} fill="#FFFFFF" opacity={.22}/>
          <Circle cx={190} cy={190} r={135} fill="url(#sunFace)"/>
        </Svg>
      </View>;
  }
}
