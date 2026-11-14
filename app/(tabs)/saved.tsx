import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import Svg, { Path, Rect } from "react-native-svg";
import { Page } from "@/components/page/Page";
import { BookCard } from "@/components/closer/BookCard";
import { K, Title, nunito } from "@/components/closer/kit";
import { MiniNetwork, PsalmTile } from "@/components/closer/Shelves";
import { LESSONS } from "@/lib/closer-page/content";
import { TONE } from "@/lib/closer-page/content/library";
import { BOOK } from "@/lib/closer-page/lesson/bookTokens";
import { CONN } from "@/lib/closer-page/lesson/connTokens";
import type { Lesson } from "@/lib/closer-page/lesson/types";
import { closerPage, useCloserPage } from "@/state/closerPage";

/**
 * Saved: everything you keep stays the thing it was. Book cards, filed cases, the networks you pulled, psalms as
 * their landscapes, verse cards, and your reflections under a lock, only on this device. A filter on top; Page
 * perches on the first thing and nods when you change it.
 */
type Filter = "All" | "Books" | "Cases" | "Threads" | "Psalms" | "Verses" | "Reflections";

export default function SavedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { finished, verses, notes } = useCloserPage();
  const [filter, setFilter] = useState<Filter>("All");
  const [nod, setNod] = useState(0);
  const done = finished.map(id => LESSONS[id]).filter((l): l is Lesson => !!l);
  const books = done.filter(l => l.book), cases = done.filter(l => l.case), threads = done.filter(l => l.kind === "Connection"), psalms = done.filter(l => l.psalm);
  const others = done.filter(l => !l.book && !l.case && l.kind !== "Connection" && !l.psalm);
  const counts: Record<Filter, number> = { All: 1, Books: books.length, Cases: cases.length, Threads: threads.length, Psalms: psalms.length, Verses: verses.length, Reflections: notes.length };
  const filters = (Object.keys(counts) as Filter[]).filter(f => f === "All" || counts[f] > 0);
  const show = (f: Filter) => filter === "All" || filter === f;
  const open = (l: Lesson) => router.push(`/lesson/${l.id}` as never);
  const empty = verses.length + notes.length + done.length === 0;
  let perched = false;
  const perch = () => {
    if (perched) return null;
    perched = true;
    return <View style={{ position: "absolute", top: -44, right: 8, zIndex: 5 }}><Page size={60} mood="happy" act={nod ? "nod" : "idle"} actKey={nod} look={-0.6} shadow={false} onTap={() => setNod(nod + 1)} /></View>;
  };

  return (
    <View style={{ flex: 1, backgroundColor: K.cream }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: 140, flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Title>Saved</Title>
        {empty ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 60 }}>
            <Page size={120} mood="thinking" look={0.6} />
            <Text style={nunito(900, 22, { color: K.ink, marginTop: 24 })}>Nothing here yet.</Text>
            <Text style={nunito(700, 16, { color: K.inkSoft, textAlign: "center", marginTop: 8, maxWidth: 260, lineHeight: 21 })}>Finish a book, file a case or save a verse, and I’ll keep it here for you.</Text>
          </View>
        ) : (
          <>
            {filters.length > 2 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 16, marginHorizontal: -20 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 6 }}>
                {filters.map(f => (
                  <Pressable key={f} onPress={() => { setFilter(f); setNod(nod + 1); }} accessibilityRole="tab" accessibilityState={{ selected: filter === f }}
                    style={{ height: 36, borderRadius: 18, paddingHorizontal: 14, justifyContent: "center", backgroundColor: filter === f ? K.ink : K.creamDeep }}>
                    <Text style={nunito(800, 14, { color: filter === f ? K.cream : K.inkSoft })}>{f}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            )}
            <View style={{ marginTop: 52, gap: 12 }}>
              {show("Books") && books.map(l => (
                <Animated.View key={l.id} layout={LinearTransition} entering={FadeInDown}>{perch()}
                  <Pressable onPress={() => open(l)} accessibilityRole="button" accessibilityLabel={`${l.book!.title}: book card`} style={{ backgroundColor: BOOK.primary, borderRadius: 26, padding: 8 }}><BookCard book={l.book!} /></Pressable>
                </Animated.View>
              ))}
              {show("Cases") && cases.length > 0 && (
                <Animated.View layout={LinearTransition} entering={FadeInDown}>{perch()}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>{cases.map((l, i) => <CaseFolder key={l.id} l={l} i={i} onOpen={open} />)}</View>
                </Animated.View>
              )}
              {show("Threads") && threads.length > 0 && (
                <Animated.View layout={LinearTransition} entering={FadeInDown}>{perch()}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {threads.map(l => (
                      <Pressable key={l.id} onPress={() => open(l)} accessibilityRole="button" accessibilityLabel={l.title} style={{ width: "48%", backgroundColor: CONN.dark, borderRadius: 18, padding: 10, alignItems: "center" }}>
                        <MiniNetwork lesson={l} width={140} height={86} />
                        <Text style={nunito(900, 13.5, { color: CONN.light, marginTop: 4, textAlign: "center" })}>{l.title}</Text>
                      </Pressable>
                    ))}
                  </View>
                </Animated.View>
              )}
              {show("Psalms") && psalms.length > 0 && (
                <Animated.View layout={LinearTransition} entering={FadeInDown}>{perch()}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                    {psalms.map(l => <View key={l.id} style={{ width: "48%" }}><PsalmTile lesson={l} sub={`Psalm ${l.psalm!.number}`} height={130} onPress={() => open(l)} /></View>)}
                  </View>
                </Animated.View>
              )}
              {show("Verses") && verses.map(v => (
                <Animated.View key={v.ref} layout={LinearTransition} entering={FadeInDown}>{perch()}
                  <View style={{ position: "absolute", left: 0, right: 0, top: 5, bottom: -5, borderRadius: 24, backgroundColor: K.burgundyDeep }} />
                  <View style={{ backgroundColor: K.burgundy, borderRadius: 24, padding: 20, paddingRight: 52 }}>
                    <Text style={nunito(700, 18, { color: K.cream, lineHeight: 24 })}>{v.text}</Text>
                    <Text style={nunito(800, 12, { color: K.gold, letterSpacing: 1.4, marginTop: 12 })}>{v.ref.toUpperCase()} · {v.translation.toUpperCase()}</Text>
                    <Pressable onPress={() => closerPage.saveVerse(v, false)} accessibilityRole="button" accessibilityLabel={`Remove ${v.ref}`} hitSlop={8} style={{ position: "absolute", right: 14, top: 14 }}>
                      <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M6 3h12v18l-6-4.5L6 21z" fill={K.gold} /></Svg>
                    </Pressable>
                  </View>
                </Animated.View>
              ))}
              {show("Reflections") && notes.length > 0 && (
                <Animated.View layout={LinearTransition} entering={FadeInDown}>{perch()}
                  <View style={{ backgroundColor: K.creamDeep, borderRadius: 24, padding: 16 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <Svg width={16} height={16} viewBox="0 0 24 24"><Rect x="5" y="10" width="14" height="11" rx="3" fill={K.inkFaint} /><Path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke={K.inkFaint} strokeWidth={2.4} /></Svg>
                      <Text style={nunito(800, 12.5, { color: K.inkFaint, letterSpacing: 1.6 })}>YOUR REFLECTIONS <Text style={{ letterSpacing: 0 }}>· only on this device</Text></Text>
                    </View>
                    <View style={{ marginTop: 12, gap: 10 }}>
                      {notes.map(n => (
                        <View key={n.at} style={{ backgroundColor: K.cream, borderRadius: 18, padding: 16, paddingRight: 44 }}>
                          <Text style={nunito(800, 12, { color: K.burgundy, letterSpacing: 1.4 })}>{n.ref.toUpperCase()} · {new Date(n.at).toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase()}</Text>
                          <Text style={nunito(700, 16, { color: K.ink, marginTop: 6, lineHeight: 21 })}>{n.text}</Text>
                          <Pressable onPress={() => closerPage.forgetNote(n.at)} accessibilityRole="button" accessibilityLabel="Delete this reflection" hitSlop={10} style={{ position: "absolute", right: 12, top: 10 }}>
                            <Text style={nunito(700, 22, { color: K.inkFaint })}>×</Text>
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  </View>
                </Animated.View>
              )}
              {filter === "All" && others.length > 0 && (
                <Animated.View layout={LinearTransition} entering={FadeInDown}>{perch()}
                  <Text style={nunito(800, 12.5, { color: K.inkFaint, letterSpacing: 1.7, marginBottom: 8, marginLeft: 4 })}>READ AGAIN</Text>
                  <View style={{ gap: 10 }}>
                    {others.map(l => {
                      const t = TONE[l.theme === "cream" ? "forest" : l.theme];
                      return (
                        <Pressable key={l.id} onPress={() => open(l)} accessibilityRole="button" accessibilityLabel={`Open ${l.title}`}
                          style={{ backgroundColor: t.bg, borderRadius: 22, paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
                          <View style={{ flex: 1 }}>
                            <Text numberOfLines={1} style={nunito(900, 19, { color: t.fg, letterSpacing: -0.4 })}>{l.title}</Text>
                            <Text style={nunito(700, 13, { color: t.fg, opacity: 0.7 })}>{l.kind} · {l.scripture.split(" · ")[0]}</Text>
                          </View>
                          <Text style={nunito(800, 14, { color: t.fg })}>Open</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </Animated.View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* a case you closed: a filed folder, stamped */
function CaseFolder({ l, i, onOpen }: { l: Lesson; i: number; onOpen: (l: Lesson) => void }) {
  return (
    <Pressable onPress={() => onOpen(l)} accessibilityRole="button" accessibilityLabel={`Case ${l.case!.id}, filed: ${l.title}`} style={{ width: "48%", transform: [{ rotate: `${i % 2 ? 1 : -1}deg` }] }}>
      <View style={{ position: "absolute", left: 12, top: -8, width: 48, height: 12, borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: "#56301E" }} />
      <View style={{ minHeight: 112, backgroundColor: "#F4DCC0", borderRadius: 14, borderTopLeftRadius: 4, padding: 12, shadowColor: "#56301E", shadowOpacity: 0.24, shadowRadius: 8, shadowOffset: { width: 0, height: 5 } }}>
        <Text style={nunito(900, 10, { color: "#A45536", letterSpacing: 1.4 })}>CASE {l.case!.id} · FILED</Text>
        <Text style={nunito(900, 15, { color: "#56301E", marginTop: 4, lineHeight: 18 })}>{l.title}</Text>
        <Text style={nunito(900, 8.5, { color: "#A45536", letterSpacing: 1.2, borderWidth: 2, borderColor: "#A45536", borderRadius: 4, alignSelf: "flex-start", paddingHorizontal: 4, marginTop: "auto", transform: [{ rotate: "-5deg" }] })}>{l.case!.status.toUpperCase()}</Text>
      </View>
    </Pressable>
  );
}
