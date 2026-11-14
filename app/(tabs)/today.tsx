import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Page } from "@/components/page/Page";
import { K, Label, PressButton, nunito } from "@/components/closer/kit";
import { dailyPick } from "@/lib/closer-page/content/daily";
import { TONE } from "@/lib/closer-page/content/library";
import type { Action, Mood } from "@/lib/closer-page/page/states";
import { useCloserPage } from "@/state/closerPage";

/**
 * Today: one experience, one button. The story card's shape, filled with the day's pick in its own category colour
 * (a case one day, a psalm the next), with Page perched on its edge. Tomorrow's pick sits underneath.
 */
export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { finished } = useCloserPage();
  const [poke, setPoke] = useState<{ act: Action; mood: Mood; n: number }>({ act: "enter", mood: "neutral", n: 0 });
  const now = new Date();
  const dateKey = now.toDateString();
  const today = useMemo(() => dailyPick(now), [dateKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const tomorrow = useMemo(() => dailyPick(new Date(now.getTime() + 86400000)), [dateKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const { lesson, shelf, entry } = today;
  const t = TONE[entry.tone];
  const hello = now.getHours() < 12 ? "Morning." : now.getHours() < 18 ? "Afternoon." : "Evening.";
  const big = lesson.title.length > 22 ? 34 : lesson.title.length > 12 ? 44 : 56;
  const open = (id: string) => router.push(`/lesson/${id}` as never);

  return (
    <View style={{ flex: 1, backgroundColor: K.cream }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <Label>{now.toLocaleDateString("en-US", { weekday: "long" })} · {now.toLocaleDateString("en-US", { month: "long", day: "numeric" })}</Label>
        <Text accessibilityRole="header" style={nunito(900, 34, { color: K.ink, letterSpacing: -1, lineHeight: 36, marginTop: 8 })}>{hello} Got a few minutes?</Text>

        <Animated.View entering={FadeInDown.springify().damping(24).delay(100)} style={{ marginTop: 60, marginBottom: 8 }}>
          {/* the card's lip, a step darker beneath it */}
          <View style={{ position: "absolute", left: 0, right: 0, top: 8, bottom: -8, borderRadius: 32, backgroundColor: t.bg }}>
            <View style={{ flex: 1, borderRadius: 32, backgroundColor: "rgba(0,0,0,.24)" }} />
          </View>
          <View style={{ backgroundColor: t.bg, borderRadius: 32, padding: 24, paddingTop: 28 }}>
            <View style={{ position: "absolute", top: -62, right: 12 }}>
              <Page size={104} mood={poke.mood} act={poke.act} actKey={poke.n} look={-0.7} shadow={false}
                onTap={() => setPoke(p => ({ act: p.n % 3 === 2 ? "spin" : "hop", mood: p.n % 3 === 1 ? "cheeky" : "excited", n: p.n + 1 }))} />
            </View>
            <Label color={t.fg} style={{ opacity: 0.7 }}>Today · {shelf.label}</Label>
            <Text style={nunito(900, big, { color: t.fg, letterSpacing: -big * 0.035, lineHeight: big * 1.0, marginTop: 12 })}>{lesson.title}</Text>
            <Text style={nunito(700, 18, { color: t.fg, opacity: 0.8, lineHeight: 24, marginTop: 12, maxWidth: 270 })}>{lesson.subtitle}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
              {[lesson.scripture.split(" · ")[0], `${lesson.minutes} min`].map(s => (
                <Text key={s} style={nunito(800, 13, { color: t.fg, backgroundColor: "rgba(255,255,255,.14)", borderRadius: 99, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 6 })}>{s}</Text>
              ))}
            </View>
            <PressButton style={{ marginTop: 28 }} tone={{ face: t.fg, lip: "rgba(0,0,0,.28)", text: t.bg }} onPress={() => open(lesson.id)}>
              {finished.includes(lesson.id) ? "Go again" : "Begin"}
            </PressButton>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(350)}>
          <Pressable onPress={() => open(tomorrow.lesson.id)} accessibilityRole="button" accessibilityLabel={`Tomorrow: ${tomorrow.lesson.title}`}
            style={{ marginTop: 28 }}>
            <View style={{ backgroundColor: K.creamDeep, borderRadius: 22, paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Label>Tomorrow · {tomorrow.shelf.label}</Label>
              <Text numberOfLines={1} style={nunito(800, 17, { color: K.ink, marginTop: 2 })}>{tomorrow.lesson.title}</Text>
            </View>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: TONE[tomorrow.entry.tone].bg }} />
            </View>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
