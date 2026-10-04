import { ScrollView, View } from "react-native";
import { Text } from "@/components/CloserText";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { SkyGradient } from "@/components/HomeSkyGradient";
import { ModalNavBar } from "@/components/ModalNavBar";
import { AchievementShelf } from "@/components/AchievementShelf";
import { StreakFireAnimation } from "@/components/StreakFireAnimation";
import { useAchievements } from "@/lib/useAchievements";
import { useProgress } from "@/state/progress";
import { useColors } from "@/state/theme";
import { goBackOr } from "@/lib/navigation";
export default function AchievementsScreen() {
  const colors = useColors(), router = useRouter(), { achievements } = useAchievements(), { streak } = useProgress();
  const earned = achievements.filter(a => a.value >= a.target).length;
  return <View style={{ flex: 1, backgroundColor: colors.bg }}><SkyGradient /><ModalNavBar title="Achievements" onClose={() => goBackOr(router, "/profile")} /><SafeAreaView edges={["bottom"]} style={{ flex: 1 }}><ScrollView contentContainerStyle={{ padding: 24, gap: 28, paddingBottom: 48 }}><View style={{ gap: 12 }}><Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 32, fontWeight: "700" }}>Your milestones</Text><Text style={{ color: colors.inkMuted, fontSize: 16 }}>{earned} of {achievements.length} earned</Text><View style={{ height: 6, borderRadius: 3, backgroundColor: colors.border, overflow: "hidden" }}><View style={{ height: 6, width: `${earned/achievements.length*100}%`, backgroundColor: "#D97450" }} /></View></View><View style={{ padding: 20, borderRadius: 24, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: 16 }}><StreakFireAnimation size={80} /><View style={{ flex: 1, gap: 6 }}><Text style={{ color: colors.ink, fontSize: 24, fontWeight: "700" }}>{streak.current} day streak</Text><Text style={{ color: colors.inkMuted, fontSize: 13 }}>Longest: {streak.longest} {streak.longest === 1 ? "day" : "days"}</Text></View></View><AchievementShelf achievements={achievements} /></ScrollView></SafeAreaView></View>;
}
