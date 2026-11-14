import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Svg, { Circle, Path } from "react-native-svg";
import { Page } from "@/components/page/Page";
import { K, Label, Title, nunito } from "@/components/closer/kit";
import { MOTIFS } from "@/components/closer/Motifs";
import { LESSONS } from "@/lib/closer-page/content";
import { library, TONE, type Entry, type Shelf } from "@/lib/closer-page/content/library";

/**
 * Explore: one full-width band per category, in its colour, with its signature object and a one-line promise. Tap a
 * band and the category opens as a shelf of its own objects (app/shelf/[id].tsx). Search reaches every passage,
 * person and topic. Page peeks into the second band.
 */
export default function ExploreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState("");
  const [poke, setPoke] = useState(0);
  const results = useMemo(() => search(q), [q]);
  const openEntry = (e: Entry) => { if (e.lessonId && LESSONS[e.lessonId]) router.push(`/lesson/${e.lessonId}` as never); };

  return (
    <View style={{ flex: 1, backgroundColor: K.cream }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Title>Explore</Title>
        <View style={{ marginTop: 16, height: 48, borderRadius: 16, backgroundColor: K.creamDeep, flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16 }}>
          <Svg width={18} height={18} viewBox="0 0 24 24"><Circle cx="10" cy="10" r="7" fill="none" stroke={K.inkSoft} strokeWidth={2.6} /><Path d="m15 15 6 6" stroke={K.inkSoft} strokeWidth={2.6} strokeLinecap="round" /></Svg>
          <TextInput value={q} onChangeText={setQ} placeholder="A passage, a person, a topic…" placeholderTextColor={K.inkSoft} accessibilityLabel="Search"
            style={[nunito(700, 16, { color: K.ink, flex: 1, height: "100%" })]} returnKeyType="search" clearButtonMode="while-editing" />
        </View>

        {q.trim() ? (
          <Animated.View entering={FadeIn} style={{ marginTop: 16, gap: 8 }}>
            {results.length === 0 && <Text style={nunito(700, 15, { color: K.inkSoft, textAlign: "center", marginTop: 24 })}>Nothing yet for “{q}”.</Text>}
            {results.map(({ e, shelf, detail }) => (
              <Pressable key={e.id} onPress={() => openEntry(e)} accessibilityRole="button" accessibilityLabel={`${e.title}, ${shelf.label}`}
                style={{ flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: K.creamDeep, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12 }}>
                <View style={{ width: 8, height: 36, borderRadius: 4, backgroundColor: TONE[e.tone].bg }} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={nunito(800, 16, { color: K.ink })}>{e.title}</Text>
                  <Text numberOfLines={1} style={nunito(700, 12.5, { color: K.inkFaint })}>{shelf.label} · {detail}</Text>
                </View>
              </Pressable>
            ))}
          </Animated.View>
        ) : (
          <View style={{ marginTop: 20, gap: 12 }}>
            {library.map((s, i) => {
              const t = TONE[s.entries[0]?.tone ?? "forest"];
              const Motif = MOTIFS[s.id];
              const ready = s.entries.filter(e => e.lessonId).length;
              return (
                <Animated.View key={s.id} entering={FadeInDown.delay(Math.min(i, 6) * 40).springify().damping(28)}>
                  <Pressable onPress={() => router.push(`/shelf/${s.id}` as never)} accessibilityRole="button" accessibilityLabel={`${s.label}. ${s.promise ?? ""}`}
                    style={({ pressed }) => ({ transform: [{ translateY: pressed ? 4 : 0 }] })}>
                    <View style={{ position: "absolute", left: 0, right: 0, top: 5, bottom: -5, borderRadius: 24, backgroundColor: "rgba(0,0,0,.18)" }} />
                    <View style={{ minHeight: Motif ? 112 : 88, borderRadius: 24, backgroundColor: t.bg, flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 16, paddingLeft: i === 1 ? 54 : 20, paddingRight: 12, overflow: "hidden" }}>
                      <View style={{ flex: 1 }}>
                        <Text style={nunito(900, 21, { color: t.fg, letterSpacing: -0.4, lineHeight: 23 })}>{s.label}</Text>
                        {!!s.promise && <Text style={nunito(700, 13, { color: t.fg, opacity: 0.85, marginTop: 4, lineHeight: 17 })}>{s.promise}</Text>}
                        <Text style={nunito(900, 11, { color: t.fg, opacity: 0.6, letterSpacing: 1.3, marginTop: 6 })}>{ready ? `${ready} READY` : "COMING SOON"}</Text>
                      </View>
                      {Motif && <Motif />}
                    </View>
                  </Pressable>
                  {/* Page, peeking into the second band */}
                  {i === 1 && (
                    <View style={{ position: "absolute", left: -12, top: "50%", marginTop: -31 }}>
                      <Page size={56} mood="curious" act={poke ? "hop" : "enter"} actKey={poke + 1} look={0.8} shadow={false} onTap={() => setPoke(poke + 1)} />
                    </View>
                  )}
                </Animated.View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/* Search everything a lesson knows about itself: its title, its line, its passages, its category */
function search(q: string) {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  const seen = new Set<string>();
  const out: { e: Entry; shelf: Shelf; detail: string; score: number }[] = [];
  for (const shelf of library) {
    for (const e of shelf.entries) {
      const key = e.lessonId ?? e.id;
      if (seen.has(key)) continue;
      const l = e.lessonId ? LESSONS[e.lessonId] : undefined;
      const hay = [e.title, e.sub, shelf.label, l?.title, l?.subtitle, l?.scripture, l?.kind].filter(Boolean).join(" ").toLowerCase();
      if (!words.every(w => hay.includes(w))) continue;
      seen.add(key);
      out.push({ e, shelf, detail: l?.scripture.split(" · ")[0] ?? e.sub, score: (e.title.toLowerCase().includes(words[0]) ? 2 : 0) + (e.lessonId ? 1 : 0) });
    }
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 24);
}
