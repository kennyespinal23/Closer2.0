import { useState, type ReactElement, type ReactNode } from "react";
import { Image, Pressable, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from "react-native-svg";
import { LESSONS } from "@/lib/closer-page/content";
import { TONE, type Entry, type Shelf } from "@/lib/closer-page/content/library";
import { BOOK } from "@/lib/closer-page/lesson/bookTokens";
import { CONN } from "@/lib/closer-page/lesson/connTokens";
import type { Block, Lesson } from "@/lib/closer-page/lesson/types";
import { K, nunito } from "./kit";
import { Landscape } from "./Motifs";

/* Inside a category: each shelf drawn as the thing it holds. Case files stacked with their stamps, books as spines
   sized by length, connections as tiny networks, psalms as their landscapes, testimonies as portraits. Categories
   without an object of their own keep the coloured tiles. */

type Props = { shelf: Shelf; onOpen: (e: Entry) => void };
const lessonOf = (e: Entry): Lesson | undefined => (e.lessonId ? LESSONS[e.lessonId] : undefined);
const tilt = [-1.4, 1, -0.6, 1.3, -1, 0.7, -1.2, 0.9];
const src = (s: unknown) => (typeof s === "number" ? s : { uri: String(s) });

export function ShelfView(p: Props) {
  const View = ({ mysteries: CaseShelf, books: BookShelf, connections: ThreadShelf, psalms: PsalmShelf, testimonies: PortraitShelf } as Record<string, (p: Props) => ReactElement>)[p.shelf.id] ?? TileShelf;
  return <View {...p} />;
}

/* A pressable card. Layout goes in a plain style object: this app's NativeWind setup drops styles given as a function. */
function Press({ onPress, label, style, children }: { onPress: () => void; label: string; style?: object; children: ReactNode }) {
  const [down, setDown] = useState(false);
  return <Pressable onPress={onPress} onPressIn={() => setDown(true)} onPressOut={() => setDown(false)} accessibilityRole="button" accessibilityLabel={label} style={[style, { opacity: down ? 0.85 : 1 }]}>{children}</Pressable>;
}

/* Bible Mysteries: case files, stacked */
function CaseShelf({ shelf, onOpen }: Props) {
  return (
    <View style={{ paddingTop: 12 }}>
      {shelf.entries.map((e, i) => {
        const l = lessonOf(e);
        return (
          <Animated.View key={e.id} entering={FadeInDown.delay(i * 50).springify().damping(22)} style={{ marginTop: i ? -10 : 0, zIndex: i, transform: [{ rotate: `${tilt[i % tilt.length]}deg` }] }}>
            <Press onPress={() => onOpen(e)} label={`Case ${l?.case?.id}: ${l?.title ?? e.title}, ${l?.case?.status ?? ""}`}>
              <View style={{ position: "absolute", left: 16, top: -10, width: 64, height: 14, borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: "#56301E" }} />
              <View style={{ backgroundColor: "#F4DCC0", borderRadius: 14, borderTopLeftRadius: 4, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 20, shadowColor: "#56301E", shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={nunito(900, 11, { letterSpacing: 1.6, color: "#A45536" })}>CASE {l?.case?.id}</Text>
                  <Text style={nunito(900, 9.5, { letterSpacing: 1.2, color: "#A45536", borderWidth: 2, borderColor: "#A45536", borderRadius: 5, paddingHorizontal: 6, transform: [{ rotate: "-5deg" }] })}>{(l?.case?.status ?? "Soon").toUpperCase()}</Text>
                </View>
                <Text style={nunito(900, 19, { color: "#56301E", letterSpacing: -0.4, marginTop: 4 })}>{l?.title ?? e.title}</Text>
              </View>
            </Press>
          </Animated.View>
        );
      })}
    </View>
  );
}

/* Bible Books: spines on shelves, taller for longer books */
function BookShelf({ shelf, onOpen }: Props) {
  const items = shelf.entries.map(e => ({ e, l: lessonOf(e) }));
  const rows: (typeof items)[] = [];
  for (let i = 0; i < items.length; i += 6) rows.push(items.slice(i, i + 6));
  return (
    <View style={{ paddingTop: 16, gap: 28 }}>
      {rows.map((row, r) => (
        <View key={r} style={{ flexDirection: "row", alignItems: "flex-end", gap: 6, borderBottomWidth: 6, borderColor: "#8A6A50", paddingHorizontal: 4 }}>
          {row.map(({ e, l }, k) => {
            const verses = l?.book?.chapterLengths.reduce((a, b) => a + b, 0) ?? 400;
            const [fill, ink] = BOOK.sections[(r * 6 + k) % BOOK.sections.length];
            const name = l?.book?.name ?? e.title;
            return (
              <Press key={e.id} onPress={() => onOpen(e)} label={l?.title ?? e.title}
                style={{ flex: 1, height: 96 + Math.min(80, Math.sqrt(verses) * 2.2), backgroundColor: fill, borderTopLeftRadius: 6, borderTopRightRadius: 6, alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                {/* the name runs up the spine */}
                <Text numberOfLines={1} style={[nunito(900, 13, { color: ink, width: 160, textAlign: "center" }), { transform: [{ rotate: "-90deg" }] }]}>{name}</Text>
              </Press>
            );
          })}
        </View>
      ))}
    </View>
  );
}

/* Connections: each experience as its own little network, drawn from its threads */
export function MiniNetwork({ lesson, width = 120, height = 86 }: { lesson?: Lesson; width?: number; height?: number }) {
  const pull = lesson?.blocks.find((b): b is Extract<Block, { kind: "pull" }> => b.kind === "pull");
  if (!pull) return <View style={{ width, height }} />;
  const [W, H] = pull.size;
  const at = (id: string) => pull.fragments.find(f => f.id === id)!.at;
  return (
    <Svg width={width} height={height} viewBox={`-60 -40 ${W + 120} ${H + 80}`}>
      {pull.strands.map((s, k) => { const [a, b] = [at(s.from), at(s.to)]; return <Path key={k} d={`M${a[0]} ${a[1]} L${b[0]} ${b[1]}`} stroke={CONN.primary} strokeWidth={s.kind === "quote" ? 16 : 9} strokeDasharray={s.kind === "theme" ? [26, 22] : undefined} strokeLinecap="round" />; })}
      {pull.fragments.map(f => <Rect key={f.id} x={f.at[0] - 70} y={f.at[1] - 38} width="140" height="76" rx="14" fill={CONN.light} />)}
    </Svg>
  );
}
function ThreadShelf({ shelf, onOpen }: Props) {
  return (
    <View style={{ paddingTop: 12, gap: 12 }}>
      {shelf.entries.map((e, i) => {
        const l = lessonOf(e);
        return (
          <Animated.View key={e.id} entering={FadeInDown.delay(i * 60)}>
            <Press onPress={() => onOpen(e)} label={l?.title ?? e.title} style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: CONN.dark, borderRadius: 22, padding: 12 }}>
              <MiniNetwork lesson={l} />
              <View style={{ flex: 1 }}>
                <Text style={nunito(900, 19, { color: CONN.light, letterSpacing: -0.4 })}>{l?.title ?? e.title}</Text>
                <Text style={nunito(700, 13, { color: CONN.light, opacity: 0.75, marginTop: 4 })}>{l?.subtitle ?? e.sub}</Text>
              </View>
            </Press>
          </Animated.View>
        );
      })}
    </View>
  );
}

/* Psalms & Emotions: each psalm as its own landscape, where it ends */
export function PsalmTile({ lesson, sub, onPress, height = 150 }: { lesson?: Lesson; sub: string; onPress: () => void; height?: number }) {
  const m = lesson?.psalm?.movements;
  const scene = m ? m[m.length - 1].end : { light: 0.2, mist: 0.3, rain: 0, cloud: 0.2, stars: 0.4, glow: 0 };
  return (
    <Press onPress={onPress} label={lesson?.title ?? sub} style={{ height, borderRadius: 22, overflow: "hidden", backgroundColor: "#1B3833" }}>
      <Landscape scene={scene} id={lesson?.id ?? sub} />
      <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 12, paddingBottom: 12, paddingTop: 32 }}>
        <Svg style={{ position: "absolute", left: 0, top: 0, right: 0, bottom: 0 }} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
          <Defs><LinearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#10231F" stopOpacity={0} /><Stop offset="1" stopColor="#10231F" stopOpacity={0.88} /></LinearGradient></Defs>
          <Rect width="10" height="10" fill="url(#fade)" />
        </Svg>
        <Text style={nunito(900, 10.5, { letterSpacing: 1.4, color: "#F0FAF6", opacity: 0.8 })}>{sub.toUpperCase()}</Text>
        <Text style={nunito(900, 15.5, { color: "#F0FAF6", lineHeight: 18 })}>{lesson?.title}</Text>
      </View>
    </Press>
  );
}
function PsalmShelf({ shelf, onOpen }: Props) {
  return (
    <View style={{ paddingTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {shelf.entries.map(e => {
        const l = lessonOf(e);
        return (
          <View key={e.id} style={{ width: "48%" }}>
            <PsalmTile lesson={l} sub={`${e.sub.split(" · ")[0]} · Psalm ${l?.psalm?.number ?? ""}`} onPress={() => onOpen(e)} />
          </View>
        );
      })}
    </View>
  );
}

/* Testimonies: portraits from the historical record, with dates */
function PortraitShelf({ shelf, onOpen }: Props) {
  return (
    <View style={{ paddingTop: 12, gap: 10 }}>
      {shelf.entries.map((e, i) => {
        const l = lessonOf(e);
        const d = l?.blocks.find((b): b is Extract<Block, { kind: "dialogue" }> => b.kind === "dialogue" && !!b.portrait);
        const a = l?.blocks.find((b): b is Extract<Block, { kind: "artifact" }> => b.kind === "artifact");
        const p = d?.portrait ?? a?.image;
        return (
          <Animated.View key={e.id} entering={FadeInDown.delay(i * 50)}>
            <Press onPress={() => onOpen(e)} label={`${e.title}, ${e.sub}`} style={{ flexDirection: "row", alignItems: "center", gap: 16, backgroundColor: TONE.walnut.bg, borderRadius: 22, padding: 12, paddingRight: 16 }}>
              {p ? <Image source={src(p.src)} accessibilityLabel={p.alt} style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 3, borderColor: "rgba(255,247,235,.5)" }} />
                : <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(255,247,235,.15)" }} />}
              <View style={{ flex: 1 }}>
                <Text style={nunito(900, 17, { color: TONE.walnut.fg, lineHeight: 20 })}>{e.title}</Text>
                <Text style={nunito(700, 13, { color: TONE.walnut.fg, opacity: 0.75, marginTop: 4 })}>{e.sub}</Text>
              </View>
            </Press>
          </Animated.View>
        );
      })}
    </View>
  );
}

/* Everything else: the coloured tiles */
function TileShelf({ shelf, onOpen }: Props) {
  return (
    <View style={{ paddingTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {shelf.entries.map((e, i) => {
        const t = TONE[e.tone];
        return (
          <View key={e.id} style={{ width: i === 0 ? "100%" : "47.8%" }}>
            <Press onPress={() => onOpen(e)} label={e.title} style={{ height: i === 0 ? 166 : 146, backgroundColor: t.bg, borderRadius: 24, padding: 16, justifyContent: "flex-end" }}>
              {!e.lessonId && <Text style={nunito(800, 11, { position: "absolute", right: 12, top: 12, color: t.fg, opacity: 0.8, letterSpacing: 1, backgroundColor: "rgba(0,0,0,.15)", borderRadius: 99, overflow: "hidden", paddingHorizontal: 10, paddingVertical: 4 })}>SOON</Text>}
              <Text style={nunito(900, i === 0 ? 30 : 19, { color: t.fg, letterSpacing: -0.6, lineHeight: i === 0 ? 31 : 20 })}>{e.title}</Text>
              <Text style={nunito(700, 13, { color: t.fg, opacity: 0.7, marginTop: 6 })}>{e.sub}</Text>
            </Press>
          </View>
        );
      })}
    </View>
  );
}

export { K };
