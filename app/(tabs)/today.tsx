import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { feel } from "@/lib/feedback";
import { isInternalBuild } from "@/lib/isInternalBuild";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { Page } from "@/components/page/Page";
import { K, Label, PressButton, nunito } from "@/components/closer/kit";
import { dailyPick } from "@/lib/closer-page/content/daily";
import { TONE } from "@/lib/closer-page/content/library";
import type { Action, Mood } from "@/lib/closer-page/page/states";
import { dayKey, streakOf, useCloserPage } from "@/state/closerPage";
import Svg, { Path } from "react-native-svg";
import { TomorrowSheet } from "@/components/closer/TomorrowSheet";
import { date, fill, plural, useStrings } from "@/lib/i18n";

/**
 * Today: one experience, one button. The story card's shape, filled with the day's pick in its own category colour
 * (a case one day, a psalm the next), with Page perched on its edge. Tomorrow's pick sits underneath.
 */
export default function TodayScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { finished, days, hydrated } = useCloserPage();
  const streak = streakOf(days), litToday = !!days[dayKey(new Date())]?.length;
  // the day's first lesson lights today: the streak sound plays when you come back here and see it
  const wasLit = useRef<boolean | null>(null), streakDue = useRef(false);
  useEffect(() => {
    if (!hydrated) return;
    if (wasLit.current === false && litToday) streakDue.current = true;
    wasLit.current = litToday;
  }, [hydrated, litToday]);
  useFocusEffect(useCallback(() => {
    if (!streakDue.current) return;
    streakDue.current = false;
    const t = setTimeout(() => feel("streak"), 600);
    return () => clearTimeout(t);
  }, []));
  const { tmr } = useLocalSearchParams<{ tmr?: string }>(); // ?tmr=1 (testing builds) opens Tomorrow
  const [tmrOpen, setTmrOpen] = useState(false);
  useEffect(() => { if (tmr && isInternalBuild()) setTmrOpen(true); }, [tmr]);
  const [poke, setPoke] = useState<{ act: Action; mood: Mood; n: number }>({ act: "enter", mood: "neutral", n: 0 });
  const now = new Date();
  const dateKey = now.toDateString();
  const today = useMemo(() => dailyPick(now), [dateKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const tomorrow = useMemo(() => dailyPick(new Date(now.getTime() + 86400000)), [dateKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const { lesson, shelf, entry } = today;
  const t = TONE[entry.tone];
  const s = useStrings().native.today;
  const hello = now.getHours() < 12 ? s.morning : now.getHours() < 18 ? s.afternoon : s.evening;
  const big = lesson.title.length > 22 ? 34 : lesson.title.length > 12 ? 44 : 56;
  const open = (id: string) => router.push(`/lesson/${id}` as never);

  return (
    <View style={{ flex: 1, backgroundColor: K.cream }}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 24, paddingHorizontal: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Label>{fill(s.dateLine, { weekday: date(now, { weekday: "long" }), date: date(now, { month: "long", day: "numeric" }) })}</Label>
          <Pressable accessibilityRole="button" accessibilityLabel={plural(streak, s.streakA11y)} onPress={() => { void Haptics.selectionAsync(); router.push("/streak" as never); }} hitSlop={8}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, height: 34, paddingLeft: 10, paddingRight: 12, borderRadius: 17, backgroundColor: litToday ? "#FFE7C2" : K.creamDeep }}>
              <Svg width={14} height={16} viewBox="0 0 14 16"><Path d="M7 0C8 4 13 5.5 13 10a6 6 0 0 1-12 0c0-2.5 1.5-4 3-5 .3 1.6 1 2.6 2 3C6 5 5.6 2.5 7 0z" fill={litToday ? "#F07B12" : "#C9BBA6"} /></Svg>
              <Text style={nunito(900, 15, { color: litToday ? "#B5530F" : K.inkFaint })}>{streak}</Text>
            </View>
          </Pressable>
        </View>
        <Text accessibilityRole="header" style={nunito(900, 34, { color: K.ink, letterSpacing: -1, lineHeight: 36, marginTop: 8 })}>{hello}</Text>

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
            <Label color={t.fg} style={{ opacity: 0.7 }}>{fill(s.todayFrom, { shelf: shelf.label })}</Label>
            <Text style={nunito(900, big, { color: t.fg, letterSpacing: -big * 0.035, lineHeight: big * 1.12, marginTop: 10 })}>{lesson.title}</Text>
            <Text style={nunito(700, 18, { color: t.fg, opacity: 0.8, lineHeight: 24, marginTop: 12, maxWidth: 270 })}>{lesson.subtitle}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 20 }}>
              {[lesson.scripture.split(" · ")[0], fill(s.minutes, { n: lesson.minutes })].map(s => (
                <Text key={s} style={nunito(800, 13, { color: t.fg, backgroundColor: "rgba(255,255,255,.14)", borderRadius: 99, overflow: "hidden", paddingHorizontal: 12, paddingVertical: 6 })}>{s}</Text>
              ))}
            </View>
            <PressButton style={{ marginTop: 28 }} tone={{ face: t.fg, lip: "rgba(0,0,0,.28)", text: t.bg }} onPress={() => open(lesson.id)}>
              {finished.includes(lesson.id) ? s.again : s.begin}
            </PressButton>
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(350)}>
          <Pressable onPress={() => { void Haptics.selectionAsync(); setTmrOpen(true); }} accessibilityRole="button" accessibilityLabel={fill(s.tomorrowA11y, { title: tomorrow.lesson.title })} accessibilityHint={s.tomorrowHint}
            style={{ marginTop: 28 }}>
            <View style={{ backgroundColor: K.creamDeep, borderRadius: 22, paddingHorizontal: 20, paddingVertical: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Label>{fill(s.tomorrowFrom, { shelf: tomorrow.shelf.label })}</Label>
              <Text numberOfLines={1} style={nunito(800, 17, { color: K.ink, marginTop: 2 })}>{tomorrow.lesson.title}</Text>
            </View>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: TONE[tomorrow.entry.tone].bg }} />
            </View>
          </Pressable>
        </Animated.View>
      </ScrollView>
      <TomorrowSheet open={tmrOpen} pick={tomorrow} onClose={() => setTmrOpen(false)} />
    </View>
  );
}
