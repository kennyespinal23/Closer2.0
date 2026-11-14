import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SFSymbol } from "@/components/Symbol";
import { K, nunito } from "@/components/closer/kit";
import { SavedSection } from "@/components/closer/SavedSection";
import { LESSONS } from "@/lib/closer-page/content";
import { TONE, library } from "@/lib/closer-page/content/library";
import { streakOf, useCloserPage } from "@/state/closerPage";

/**
 * The pages behind You's list (CLOSER-PICKS.md, "You tab": B, like Speak): your days, your finished stories, saved
 * verses, reflections. Each opens from one row on You, so You itself stays short.
 */
const TITLES: Record<string, string> = { days: "Your days", finished: "Finished", verses: "Saved verses", reflections: "Reflections" };

export default function KeptScreen() {
  const { kind = "days" } = useLocalSearchParams<{ kind?: string }>();
  const router = useRouter(), insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: K.cream }}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: insets.bottom + 60 }} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: K.creamDeep, alignItems: "center", justifyContent: "center" }}>
          <SFSymbol name="chevron.left" size={17} weight="bold" color={K.ink} />
        </Pressable>
        <Text accessibilityRole="header" style={nunito(900, 32, { color: K.ink, letterSpacing: -0.8, lineHeight: 40, marginTop: 14 })}>{TITLES[kind] ?? "Saved"}</Text>
        {kind === "days" ? <Days /> :
          kind === "verses" ? <SavedSection initial="Verses" only={["Verses"]} /> :
          kind === "reflections" ? <SavedSection initial="Reflections" only={["Reflections"]} /> :
          <SavedSection only={["All", "Books", "Cases", "Threads", "Psalms"]} />}
      </ScrollView>
    </View>
  );
}

/* Your days: a journal, newest first. Each day is what you finished, in its category's colour. */
function Days() {
  const router = useRouter();
  const { days } = useCloserPage();
  const keys = Object.keys(days).filter(k => days[k].length).sort().reverse();
  const streak = streakOf(days);
  const tone = (id: string) => {
    for (const s of library) { const e = s.entries.find(x => x.lessonId === id); if (e) return { ...TONE[e.tone], label: s.label }; }
    return { ...TONE.forest, label: "" };
  };
  if (!keys.length) return <Text style={nunito(700, 16, { color: K.inkSoft, marginTop: 16, lineHeight: 22 })}>Finish today’s story and it’ll be kept here, one day at a time.</Text>;
  return (
    <View style={{ marginTop: 6 }}>
      <Text style={nunito(700, 15, { color: K.inkSoft })}>{keys.length} {keys.length === 1 ? "day" : "days"}{streak > 1 ? ` · ${streak} in a row` : ""}</Text>
      {keys.map(k => {
        const [y, m, d] = k.split("-").map(Number), date = new Date(y, m - 1, d);
        return (
          <View key={k} style={{ flexDirection: "row", gap: 12, marginTop: 14 }}>
            <View style={{ width: 46, alignItems: "center", paddingTop: 6 }}>
              <Text style={nunito(900, 24, { color: K.ink, lineHeight: 28 })}>{d}</Text>
              <Text style={nunito(900, 11, { color: K.inkFaint, letterSpacing: 1.1 })}>{date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1, gap: 8 }}>
              {days[k].map(id => {
                const l = LESSONS[id]; if (!l) return null;
                const t = tone(id);
                return (
                  <Pressable key={id} accessibilityRole="button" accessibilityLabel={`${l.title}, ${date.toDateString()}`} onPress={() => router.push(`/lesson/${id}` as never)}
                    style={{ backgroundColor: t.bg, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12 }}>
                    <Text style={nunito(800, 11, { color: t.fg, opacity: 0.75, letterSpacing: 1.5, textTransform: "uppercase" })}>{t.label}</Text>
                    <Text style={nunito(900, 18, { color: t.fg, lineHeight: 22, marginTop: 2 })}>{l.title}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
}
