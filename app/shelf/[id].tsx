import { Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { K, nunito } from "@/components/closer/kit";
import { ShelfView } from "@/components/closer/Shelves";
import { LESSONS } from "@/lib/closer-page/content";
import { library, TONE, type Entry } from "@/lib/closer-page/content/library";

/** A category, opened: a header in its colour, then its shelf of objects (components/closer/Shelves.tsx). */
export default function ShelfScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const shelf = library.find(s => s.id === id);
  if (!shelf) return null;
  const t = TONE[shelf.entries[0]?.tone ?? "forest"];
  const open = (e: Entry) => { if (e.lessonId && LESSONS[e.lessonId]) router.push(`/lesson/${e.lessonId}` as never); };
  const light = t.fg === "#233F58" || t.fg === "#294E49" || t.fg === "#17251F";
  return (
    <View style={{ flex: 1, backgroundColor: K.cream }}>
      <StatusBar style={light ? "dark" : "light"} />
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: t.bg, paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 24 }}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back to Explore" hitSlop={10} style={{ width: 40, height: 40, marginLeft: -8, alignItems: "center", justifyContent: "center" }}>
            <Svg width={22} height={22} viewBox="0 0 24 24"><Path d="M15 5 8 12l7 7" fill="none" stroke={t.fg} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" /></Svg>
          </Pressable>
          <Text accessibilityRole="header" style={nunito(900, 34, { color: t.fg, letterSpacing: -1, lineHeight: 36, marginTop: 4 })}>{shelf.label}</Text>
          {!!shelf.promise && <Text style={nunito(700, 15.5, { color: t.fg, opacity: 0.85, marginTop: 8, maxWidth: 300, lineHeight: 21 })}>{shelf.promise}</Text>}
        </View>
        <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
          <ShelfView shelf={shelf} onOpen={open} />
        </View>
      </ScrollView>
    </View>
  );
}
