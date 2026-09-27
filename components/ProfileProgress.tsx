import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useColors } from "@/state/theme";
import { useProgress } from "@/state/progress";
import { useBibleMomentCollection } from "@/state/bibleMoments";
import { useAchievements } from "@/lib/useAchievements";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { buildCurrentWeek } from "@/lib/rhythm";
import { AchievementShelf } from "./AchievementShelf";
import { StreakFireAnimation } from "./StreakFireAnimation";
import { SFSymbol, type SFSymbolName } from "./Symbol";
export function ProfileProgress() {
  const colors = useColors(), router = useRouter(), reduced = useReducedMotion();
  const { streak, totalCompletions, engagedDates } = useProgress();
  const { ids } = useBibleMomentCollection();
  const { achievements, finishedBooks } = useAchievements();
  const week = buildCurrentWeek(engagedDates);
  return <View style={{ paddingHorizontal: 20, gap: 28 }}><View style={{ flexDirection: "row", gap: 10 }}>{[
    {label:"Letters read", value:totalCompletions, icon:"envelope", route:"/completed-sermons"},
    {label:"Books finished", value:finishedBooks, icon:"book.closed", route:"/library"},
    {label:"Moments found", value:ids.length, icon:"rectangle.on.rectangle", route:"/rhythm?section=moments"},
  ].map((s,i) => <Animated.View key={s.label} entering={reduced ? undefined : FadeInDown.delay(i*55).springify().damping(18)} style={{ flex: 1 }}><Pressable accessibilityRole="button" onPress={() => router.push(s.route as any)} style={{ paddingVertical: 16, paddingHorizontal: 6, alignItems: "center", gap: 8, backgroundColor: colors.surface, borderRadius: 14, boxShadow: "0 3px 0 #9D724033" }}><SFSymbol name={s.icon as SFSymbolName} size={28} color="#D97450" /><Text style={{ color: colors.ink, fontSize: 28, fontWeight: "700" }}>{s.value}</Text><Text style={{ color: colors.inkMuted, fontSize: 12, textAlign: "center" }}>{s.label}</Text></Pressable></Animated.View>)}</View>
    <Animated.View entering={reduced ? undefined : FadeInDown.delay(100).springify().damping(22)} style={{ gap: 12 }}><View style={{ flexDirection: "row", alignItems: "center" }}><Text style={{ flex: 1, color: colors.ink, fontSize: 22, fontWeight: "700" }}>Your light</Text><Pressable accessibilityRole="button" onPress={() => router.push("/rhythm")} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ color: colors.inkMuted, fontSize: 15 }}>History</Text></Pressable></View><View style={{ padding: 20, gap: 16, borderRadius: 22, backgroundColor: colors.surface }}><View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}><StreakFireAnimation size={70} /><View style={{ flex: 1, gap: 6 }}><Text style={{ color: colors.ink, fontSize: 22, fontWeight: "700" }}>{streak.current ? `${streak.current} ${streak.current === 1 ? "day" : "days"} in a row` : "A little light starts here"}</Text><Text style={{ color: colors.inkMuted, fontSize: 15, lineHeight: 21 }}>One letter. One quiet moment.</Text></View></View><View style={{ flexDirection: "row" }}>{week.cells.map(cell => <View key={cell.dateISO} style={{ flex: 1, alignItems: "center", gap: 8 }}><Text style={{ color: colors.inkMuted, fontSize: 12 }}>{new Date(`${cell.dateISO}T12:00:00`).toLocaleDateString(undefined,{weekday:"narrow"})}</Text><View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: cell.state === "engaged" ? "#248A3D" : colors.surfaceSecondary, alignItems: "center", justifyContent: "center", borderWidth: cell.isToday ? 1 : 0, borderColor: colors.inkMuted }}>{cell.state === "engaged" ? <SFSymbol name="checkmark" size={14} color="#FFFFFF" /> : <Text style={{ color: colors.inkMuted, fontSize: 12 }}>{Number(cell.dateISO.slice(-2))}</Text>}</View></View>)}</View></View></Animated.View>
    <Animated.View entering={reduced ? undefined : FadeInDown.delay(160).springify().damping(22)} style={{ gap: 12 }}><View style={{ flexDirection: "row", alignItems: "center" }}><Text style={{ flex: 1, color: colors.ink, fontSize: 22, fontWeight: "700" }}>Achievements</Text><Pressable accessibilityRole="button" onPress={() => router.push("/achievements")} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ color: colors.inkMuted, fontSize: 15 }}>See all {achievements.filter(a=>a.value>=a.target).length}/24</Text></Pressable></View><AchievementShelf achievements={achievements} compact /></Animated.View>
  </View>;
}
