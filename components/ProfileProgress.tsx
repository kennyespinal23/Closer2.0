import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useColors } from "@/state/theme";
import { useProgress } from "@/state/progress";
import { useBibleMomentCollection } from "@/state/bibleMoments";
import { MILESTONES, isMilestoneUnlocked } from "@/lib/milestones";
import { getMilestoneBadge } from "@/lib/milestoneBadges";
import { contentText } from "@/lib/contentStyles";
import { systemText } from "@/lib/typography";
import { StreakFireAnimation } from "@/components/StreakFireAnimation";
import { SFSymbol } from "@/components/Symbol";

export function ProfileProgress() {
  const colors = useColors();
  const router = useRouter();
  const { streak, totalCompletions } = useProgress();
  const { ids, hydrated, error } = useBibleMomentCollection();
  const earned = MILESTONES.map((milestone, index) => ({ milestone, index })).filter(({ milestone }) => isMilestoneUnlocked(milestone, streak.longest)).reverse().slice(0, 6);
  return <View style={{ gap: 32 }}>
    <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 8 }}>
      {[
        { label: "Day streak", value: String(streak.current), route: "/rhythm" as const, art: <StreakFireAnimation size={64} /> },
        { label: "Devotionals", value: String(totalCompletions), route: "/completed-sermons" as const, art: <SFSymbol name="book.closed.fill" size={40} color={colors.inkMuted} /> },
        { label: "Moments", value: hydrated && !error ? String(ids.length) : "—", route: "/rhythm?section=moments" as const, art: <SFSymbol name="sparkles" size={40} color={colors.inkMuted} /> },
      ].map(stat => <Pressable key={stat.label} accessibilityRole="button" accessibilityLabel={`${stat.value} ${stat.label}. View details`} onPress={() => router.push(stat.route)} style={{ flex: 1, alignItems: "center", gap: 4 }}>
        <View style={{ height: 64, justifyContent: "center", alignItems: "center" }}>{stat.art}</View>
        <Text style={[systemText.largeTitle, { color: colors.ink, fontVariant: ["tabular-nums"] }]}>{stat.value}</Text>
        <Text style={[contentText.metadata, { color: colors.inkMuted, textAlign: "center" }]}>{stat.label}</Text>
      </Pressable>)}
    </View>
    <View style={{ gap: 12 }}>
      <View style={{ marginHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text accessibilityRole="header" style={[contentText.section, { color: colors.ink }]}>Your badges</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push("/rhythm?section=badges")} style={{ minHeight: 44, justifyContent: "center" }}><Text style={[contentText.description, { color: colors.ink }]}>View all</Text></Pressable>
      </View>
      {earned.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}>
        {earned.map(({ milestone, index }) => <Pressable key={milestone.day} accessibilityRole="button" accessibilityLabel={`Open ${milestone.title} badge`} onPress={() => router.push(`/milestone/${milestone.day}`)} style={{ width: 124, alignItems: "center", gap: 8 }}>
          <Image source={getMilestoneBadge(index + 1)} contentFit="contain" style={{ width: 112, height: 112 }} />
          <Text numberOfLines={2} style={[contentText.title, { color: colors.ink, textAlign: "center" }]}>{milestone.title}</Text>
          <Text style={[contentText.metadata, { color: colors.inkMuted }]}>Day {milestone.day}</Text>
        </Pressable>)}
      </ScrollView> : <Text style={[contentText.description, { color: colors.inkMuted, marginHorizontal: 20 }]}>Your first devotional begins your collection.</Text>}
    </View>
  </View>;
}
