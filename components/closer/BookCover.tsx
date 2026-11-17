import type { ReactElement } from "react";
import { Text, View, type ViewStyle } from "react-native";
import Svg, { Circle, G, Line, Path } from "react-native-svg";
import { nunito } from "@/components/closer/kit";
import { TONE, shelfOf } from "@/lib/closer-page/content/library";
import type { Lesson } from "@/lib/closer-page/lesson/types";
import { MOTIFS } from "@/lib/closer-page/ui/Motifs";

/**
 * A finished experience as a small hardback, the same book the lesson page shows when you collect it
 * (closer-page/src/ui/BookCover.tsx): the category's cloth, its sticker on a medallion, the title, a ribbon, and
 * the page block along the edge. The pressed pattern and where the medallion sits come from the experience's id, so
 * every book is its own and always looks the same.
 */

export function coverLook(lesson: Lesson) {
  const shelf = shelfOf(lesson.id);
  const entry = shelf?.entries.find(e => e.lessonId === lesson.id);
  const tone = TONE[entry?.tone ?? (lesson.theme === "cream" ? "forest" : lesson.theme)] ?? TONE.forest;
  return { bg: tone.bg, fg: tone.fg, shelf: shelf?.id ?? "stories", category: shelf?.label ?? lesson.kind };
}

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed || 1;
  return () => { a = Math.imul(a ^ (a >>> 15), a | 1); a ^= a + Math.imul(a ^ (a >>> 7), a | 61); return ((a ^ (a >>> 14)) >>> 0) / 4294967296; };
}

function Pattern({ id, ink, w, h }: { id: string; ink: string; w: number; h: number }) {
  const s = hash(id), r = rng(s), kind = s % 5, turn = ((s >> 3) % 4) * 15 - 22;
  const marks: ReactElement[] = [];
  if (kind === 0) for (let y = 8; y < 140; y += 12) for (let x = 6 + ((y / 12) % 2) * 6; x < 100; x += 12) marks.push(<Circle key={`${x}-${y}`} cx={x} cy={y} r={1.6} />);
  if (kind === 1) for (let k = -100; k < 200; k += 9) marks.push(<Line key={k} x1={k} y1={0} x2={k + 70} y2={140} strokeWidth={2} />);
  if (kind === 2) for (let y = 6; y < 150; y += 13) marks.push(<Path key={y} d={`M-10 ${y} q 12 -7 24 0 t 24 0 t 24 0 t 24 0 t 24 0`} fill="none" strokeWidth={2} />);
  if (kind === 3) for (let k = 1; k < 9; k++) marks.push(<Circle key={k} cx={r() > 0.5 ? 100 : 0} cy={r() > 0.5 ? 0 : 136} r={k * 16} fill="none" strokeWidth={2} />);
  if (kind === 4) for (let k = 0; k < 16; k++) { const x = r() * 100, y = r() * 136, z = 2 + r() * 3; marks.push(<Path key={k} d={`M${x} ${y - z}l${z * 0.35} ${z * 0.65} ${z * 0.65} ${z * 0.35} ${-z * 0.65} ${z * 0.35} ${-z * 0.35} ${z * 0.65} ${-z * 0.35} ${-z * 0.65} ${-z * 0.65} ${-z * 0.35} ${z * 0.65} ${-z * 0.35}z`} />); }
  return (
    <Svg width={w} height={h} viewBox="0 0 100 136" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", left: 0, top: 0 }}>
      <G fill={ink} stroke={ink} opacity={0.13} transform={kind === 1 || kind === 2 ? `rotate(${turn} 50 68)` : undefined}>{marks}</G>
    </Svg>
  );
}

/** the front of the book; `w` is its width, the height follows (100:136) */
export function BookCover({ lesson, w = 92, style }: { lesson: Lesson; w?: number; style?: ViewStyle }) {
  const look = coverLook(lesson);
  const h = Math.round(w * 1.36);
  const seed = hash(lesson.id);
  const medal = w * 0.62, up = 0.16 + ((seed >> 5) % 3) * 0.025;
  const Art = MOTIFS[look.shelf];
  const ribbon = look.bg.toUpperCase() === "#D92B2F" ? "#FFC72C" : "#D92B2F";
  const small = w < 120;
  const corner = { borderTopRightRadius: w * 0.09, borderBottomRightRadius: w * 0.09, borderTopLeftRadius: w * 0.04, borderBottomLeftRadius: w * 0.04 };
  return (
    <View style={[{ width: w, height: h }, style]}>
      {/* the page block past the cover, with a hard shadow under it */}
      <View style={{ position: "absolute", left: w * 0.05, top: w * 0.035, width: w, height: h, backgroundColor: "#F3E6D2", ...corner, shadowColor: "#17251F", shadowOpacity: 0.28, shadowRadius: 0, shadowOffset: { width: 0, height: Math.max(4, w * 0.035) } }} />
      <View style={{ position: "absolute", left: 0, top: 0, width: w, height: h, backgroundColor: look.bg, overflow: "hidden", ...corner }}>
        <Pattern id={lesson.id} ink={look.fg} w={w} h={h} />
        {/* spine */}
        <View style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: w * 0.085, backgroundColor: "rgba(0,0,0,.2)" }}>
          <View style={{ position: "absolute", left: 0, right: 0, top: "9%", height: 2, backgroundColor: "rgba(255,199,44,.7)" }} />
          <View style={{ position: "absolute", left: 0, right: 0, bottom: "9%", height: 2, backgroundColor: "rgba(255,199,44,.7)" }} />
        </View>
        {/* foil frame */}
        <View style={{ position: "absolute", left: w * 0.14, right: w * 0.06, top: w * 0.06, bottom: w * 0.06, borderRadius: w * 0.07, borderWidth: Math.max(1.5, w * 0.012), borderColor: "rgba(255,199,44,.55)" }} />
        {!small && <Text style={nunito(900, Math.max(8, w * 0.052), { position: "absolute", left: w * 0.1, right: 0, top: w * 0.1, textAlign: "center", letterSpacing: 1.3, textTransform: "uppercase", color: look.fg, opacity: 0.75 })}>{look.category}</Text>}
        {/* medallion */}
        <View style={{ position: "absolute", width: medal, height: medal, left: w * 0.1 + (w * 0.9 - medal) / 2, top: h * up, borderRadius: medal / 2, backgroundColor: "rgba(255,255,255,.16)", borderWidth: Math.max(2, w * 0.016), borderColor: "rgba(255,199,44,.55)", alignItems: "center", justifyContent: "center" }}>
          {Art && <View style={{ transform: [{ scale: (medal * 0.86) / 112 }] }}><Art /></View>}
        </View>
        <Text numberOfLines={3} style={nunito(900, Math.max(10.5, w * (small ? 0.12 : 0.105)), { position: "absolute", left: w * 0.16, right: w * 0.08, bottom: small ? w * 0.12 : w * 0.17, textAlign: "center", color: look.fg, lineHeight: Math.max(10.5, w * (small ? 0.12 : 0.105)) * 1.08, letterSpacing: -0.2 })}>{lesson.title}</Text>
      </View>
      {/* ribbon */}
      <Svg width={w * 0.09} height={w * 0.17} viewBox="0 0 10 18" style={{ position: "absolute", right: w * 0.2, bottom: -w * 0.11 }}>
        <Path d="M0 0h10v18l-5-4-5 4z" fill={ribbon} stroke="rgba(0,0,0,.25)" strokeWidth={1} />
      </Svg>
    </View>
  );
}
