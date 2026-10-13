import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "@/components/CloserText";
import { SFSymbol } from "@/components/Symbol";
import { fetchChapter } from "@/lib/bible";
import * as haptics from "@/lib/haptics";
import type { Translation, TranslationId } from "@/state/preferences";

type Palette = { bg: string; ink: string; muted: string; control: string; line: string };
type Sample = { state: "loading" } | { state: "ok"; text: string } | { state: "missing" };

/**
 * Pick a translation by reading it: each card shows the same verse in that
 * translation, so the difference is something you hear rather than guess.
 */
export function TranslationCards({ versions, currentId, bookId, bookName, chapter, verse, palette, dark, visible, onPick }: {
  versions: ReadonlyArray<Translation>; currentId: TranslationId; bookId: string; bookName: string; chapter: number; verse: number;
  palette: Palette; dark: boolean; visible: boolean; onPick: (id: TranslationId) => void;
}) {
  const [samples, setSamples] = useState<Record<string, Sample>>({});
  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setSamples(Object.fromEntries(versions.map(v => [v.id, { state: "loading" } as Sample])));
    for (const v of versions) {
      fetchChapter(bookId, chapter, v.id)
        .then(c => { const text = c.verses.find(x => x.number === verse)?.text?.trim(); if (alive) setSamples(s => ({ ...s, [v.id]: text ? { state: "ok", text } : { state: "missing" } })); })
        .catch(() => { if (alive) setSamples(s => ({ ...s, [v.id]: { state: "missing" } })); });
    }
    return () => { alive = false; };
  }, [visible, versions, bookId, chapter, verse]);
  const gold = dark ? "#E9B949" : "#C98A1E";
  const card = dark ? "#2C2621" : "#FFFFFF";

  return <View style={{ gap: 10 }}>
    {versions.map(v => {
      const on = v.id === currentId, sample = samples[v.id] ?? { state: "loading" }, missing = sample.state === "missing";
      return <Pressable key={v.id} accessibilityRole="radio" accessibilityState={{ checked: on }} accessibilityLabel={`${v.fullName}${sample.state === "ok" ? `. ${sample.text}` : ""}`}
        onPress={() => { if (!on) { haptics.tick(); onPick(v.id); } }}
        style={[s.card, { backgroundColor: card, borderColor: on ? gold : palette.line, borderWidth: on ? 2 : StyleSheet.hairlineWidth }]}>
        <View style={s.head}>
          <View style={[s.tag, { backgroundColor: on ? gold : palette.control }]}><Text style={{ fontSize: 12, lineHeight: 16, fontWeight: "900", letterSpacing: .4, color: on ? "#2A1608" : palette.ink }}>{v.tag}</Text></View>
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 16, lineHeight: 20, fontWeight: "800", color: missing ? palette.muted : palette.ink }}>{v.fullName}</Text>
          {on && <View style={[s.check, { backgroundColor: gold }]}><SFSymbol name="checkmark" size={13} color="#2A1608" weight="bold"/></View>}
        </View>
        {sample.state === "ok" ? <Text style={{ fontSize: 16, lineHeight: 24, color: palette.ink, marginTop: 10 }}>{sample.text}</Text>
          : sample.state === "missing" ? <Text style={{ fontSize: 15, lineHeight: 22, fontStyle: "italic", color: palette.muted, marginTop: 10 }}>{bookName} isn’t in this translation yet, or you’re offline.</Text>
          : <View style={{ gap: 7, marginTop: 12 }}>{[1, .9, .6].map((w, i) => <View key={i} style={{ height: 11, width: `${w * 100}%`, borderRadius: 6, backgroundColor: palette.control }}/>)}</View>}
        <Text style={{ fontSize: 13, lineHeight: 17, fontWeight: "600", color: palette.muted, marginTop: 8 }}>{v.description}</Text>
      </Pressable>;
    })}
  </View>;
}

const s = StyleSheet.create({
  card: { borderRadius: 22, borderCurve: "continuous", paddingHorizontal: 16, paddingVertical: 14 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  tag: { height: 24, paddingHorizontal: 8, borderRadius: 8, justifyContent: "center" },
  check: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
});
