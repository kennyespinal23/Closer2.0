import { useEffect, useMemo } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { Page } from "@/components/page/Page";
import { SFSymbol } from "@/components/Symbol";
import { K, PressButton, nunito } from "@/components/closer/kit";
import { dailyPick } from "@/lib/closer-page/content/daily";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { bestStreakOf, dayKey, streakOf, useCloserPage } from "@/state/closerPage";
import * as haptics from "@/lib/haptics";
import { isInternalBuild } from "@/lib/isInternalBuild";

/**
 * Your streak (CLOSER-PICKS.md, "Streak page": A2, like Numo): one big flame with the number inside it on a warm
 * ground, a line about where you are, Keep it going (today's story), then this week and Page cheering for tomorrow.
 * A day counts when you finish a story.
 */
const PEACH = "#FFE9D6", ORANGE = "#F07B12", DEEP = "#B5530F", TEXT = "#8A4B12";
const DAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

export default function StreakScreen() {
  const router = useRouter(), insets = useSafeAreaInsets(), reduce = useReducedMotion();
  const { days: realDays } = useCloserPage();
  // testing builds only: /streak?demo=12 shows a 12-day streak (5 of them this week, today not yet done)
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const days = useMemo(() => {
    const n = isInternalBuild() ? Number(demo) : 0;
    if (!n) return realDays;
    const out: Record<string, string[]> = {}, d = new Date();
    for (let i = 1; i <= n; i++) { const x = new Date(d); x.setDate(d.getDate() - i); out[dayKey(x)] = ["demo"]; }
    return out;
  }, [demo, realDays]);
  const streak = streakOf(days), best = bestStreakOf(days);
  const doneToday = !!days[dayKey(new Date())]?.length;

  // this week, Monday first
  const week = useMemo(() => {
    const now = new Date(), mon = new Date(now);
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    return DAYS.map((d, i) => {
      const x = new Date(mon); x.setDate(mon.getDate() + i);
      const k = dayKey(x), today = k === dayKey(now);
      return { d, done: !!days[k]?.length, today, future: x > now && !today };
    });
  }, [days]);

  const line = streak === 0 ? "Finish today’s story to light it." :
    !doneToday ? "Finish today’s story to keep it going." :
    streak >= best && streak > 1 ? "Your longest yet. Keep going." :
    streak === 1 ? "Day one. That’s how it starts." : `Your best is ${best}. You’re on your way.`;
  const cheer = doneToday ? `Tomorrow makes ${streak + 1}!` : streak ? `Today makes ${streak + 1}!` : "Let’s start one today!";

  // the flame breathes; the number sits still inside it
  const flick = useSharedValue(1);
  useEffect(() => { if (!reduce) flick.value = withRepeat(withTiming(1.05, { duration: 900, easing: Easing.inOut(Easing.quad) }), -1, true); }, [reduce, flick]);
  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scaleY: flick.value }, { scaleX: 2 - flick.value }] }));

  const keepGoing = () => {
    haptics.soft();
    if (doneToday) { router.back(); return; }
    router.replace(`/lesson/${dailyPick(new Date()).lesson.id}` as never);
  };

  return (
    <View style={{ flex: 1, backgroundColor: K.cream }}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false, presentation: "modal", animation: reduce ? "fade" : "slide_from_bottom" }} />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ backgroundColor: PEACH, paddingTop: insets.top + 8, paddingHorizontal: 20, paddingBottom: 26, alignItems: "center" }}>
          <View style={{ alignSelf: "stretch" }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} hitSlop={8} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
              <SFSymbol name="xmark" size={19} weight="bold" color={DEEP} />
            </Pressable>
          </View>

          <View accessible accessibilityLabel={`${streak} day streak`} style={{ width: 200, height: 228, alignItems: "center" }}>
            <Animated.View style={[{ position: "absolute", left: 0, top: 0, transformOrigin: "50% 100%" }, flameStyle]}>
              <Svg width={200} height={228} viewBox="0 0 14 16">
                <Path d="M7 0C8 4 13 5.5 13 10a6 6 0 0 1-12 0c0-2.5 1.5-4 3-5 .3 1.6 1 2.6 2 3C6 5 5.6 2.5 7 0z" fill={streak ? ORANGE : "#E9C9A8"} />
              </Svg>
            </Animated.View>
            <Text adjustsFontSizeToFit numberOfLines={1} style={nunito(900, streak > 99 ? 70 : 92, { color: K.cream, position: "absolute", top: 98, left: 20, right: 20, textAlign: "center", lineHeight: streak > 99 ? 96 : 120, letterSpacing: -2 })}>{streak}</Text>
          </View>

          <Text style={nunito(900, 30, { color: "#D2580A", marginTop: 4, lineHeight: 38 })}>{streak === 1 ? "day streak" : "day streak"}</Text>
          <Text style={nunito(800, 15, { color: TEXT, marginTop: 2, textAlign: "center" })}>{line}</Text>
          <PressButton style={{ marginTop: 18, alignSelf: "stretch" }} tone={{ face: ORANGE, lip: DEEP, text: "#FFFFFF" }} onPress={keepGoing}>
            {doneToday ? "Done for today" : "Keep it going"}
          </PressButton>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
          <View accessible accessibilityLabel={`This week: ${week.filter(w => w.done).length} days`} style={{ flexDirection: "row", justifyContent: "space-between" }}>
            {week.map(w => (
              <View key={w.d} style={{ alignItems: "center", gap: 6 }}>
                <Text style={nunito(900, 12, { color: w.today ? ORANGE : K.inkFaint })}>{w.d}</Text>
                <View style={{ width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: w.done ? ORANGE : "#FFFFFF", borderWidth: w.done ? 0 : w.today ? 3 : 2.5, borderColor: w.today ? ORANGE : "#F1E8DA" }}>
                  {w.done && <SFSymbol name="checkmark" size={15} weight="heavy" color="#FFFFFF" />}
                </View>
              </View>
            ))}
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 22 }}>
            <Page size={64} mood="happy" act="idle" shadow={false} />
            <View style={{ flex: 1 }}>
              <View style={{ alignSelf: "flex-start", backgroundColor: "#FFFFFF", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, shadowColor: "#EADFCC", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 0 }}>
                <Text style={nunito(800, 15, { color: K.ink })}>{cheer}</Text>
              </View>
            </View>
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 22 }}>
            {[[String(best), "Best streak"], [String(Object.keys(days).filter(k => days[k].length).length), "Days in all"]].map(([n, l]) => (
              <View key={l} style={{ flex: 1, backgroundColor: "#FFFFFF", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, shadowColor: "#EADFCC", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 0 }}>
                <Text style={nunito(900, 22, { color: K.ink, lineHeight: 28 })}>{n}</Text>
                <Text style={nunito(800, 12.5, { color: K.inkFaint })}>{l}</Text>
              </View>
            ))}
          </View>
          <Text style={nunito(700, 13, { color: K.inkFaint, textAlign: "center", marginTop: 18 })}>A day counts when you finish a story.</Text>
        </View>
      </ScrollView>
    </View>
  );
}
