import { AchievementShelf } from "./AchievementShelf";
import { useAchievements } from "@/lib/useAchievements";
import { useState } from "react";
import { ScrollView, Pressable, View } from "react-native";
import { Text } from "@/components/CloserText";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { BibleMomentsCollection } from "@/components/BibleMomentsCollection";
import { StreakFireAnimation } from "@/components/StreakFireAnimation";
import { SFSymbol } from "@/components/Symbol";
import { useColors, useResolvedScheme } from "@/state/theme";
import { useProgress } from "@/state/progress";
import { buildCurrentWeek, buildMonthGrid } from "@/lib/rhythm";
import { contentText } from "@/lib/contentStyles";
import { systemText } from "@/lib/typography";
import type { MomentCategory } from "@/constants/bibleMoments";

/** A single summary, with collection detail revealed only when requested. */
export function JourneyCollection({ focusMoments = false }: { focusMoments?: boolean }) {
  const colors = useColors();
  const { achievements } = useAchievements();
  const scheme = useResolvedScheme();
  const { streak, engagedDates } = useProgress();
  const [section, setSection] = useState(focusMoments ? 1 : 0);
  const [history, setHistory] = useState(false);
  const [category, setCategory] = useState<MomentCategory | "all">("all");
  const now = new Date();
  const week = buildCurrentWeek(engagedDates);
  const month = buildMonthGrid(engagedDates, now.getFullYear(), now.getMonth(), now);
  const header = <View style={{ gap: 24, paddingBottom: 8 }}>
    <View style={{ padding: 20, borderRadius: 24, borderCurve: "continuous", backgroundColor: colors.surfaceSecondary, gap: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={{ ...systemText.title1, color: colors.ink, fontVariant: ["tabular-nums"] }}>{streak.current > 0 ? `${streak.current} day streak` : "Your journey begins"}</Text>
          <Text style={{ ...contentText.metadata, color: colors.inkMuted }}>{streak.longest > 0 ? `Personal best · ${streak.longest} days` : "A little time with God, one day at a time."}</Text>
        </View>
        <StreakFireAnimation size={80} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Text style={{ ...contentText.title, color: colors.ink }}>{history ? month.monthLabel : "This week"}</Text>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: history }} onPress={() => setHistory(!history)} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 8 }}><Text style={{ ...contentText.description, color: colors.ink }}>{history ? "Hide" : "History"}</Text></Pressable>
      </View>
      <View style={{ gap: 12 }}>
        {(history ? month.rows : [week.cells]).map((row, index) => <View key={index} style={{ flexDirection: "row" }}>{row.map(cell => <View key={cell.dateISO} accessible accessibilityLabel={`${cell.dateISO}${cell.state === "engaged" ? ", devotional completed" : ""}${cell.isToday ? ", today" : ""}`} style={{ flex: 1, alignItems: "center", gap: 8 }}>
          {index === 0 && <Text style={{ ...contentText.metadata, color: colors.inkMuted }}>{new Date(`${cell.dateISO}T12:00:00`).toLocaleDateString(undefined, { weekday: "narrow" })}</Text>}
          <View style={{ width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: cell.state === "engaged" ? colors.ink : "transparent", borderWidth: cell.isToday ? 1 : 0, borderColor: colors.inkMuted }}>
            {cell.state !== "outOfMonth" && <Text style={{ ...contentText.metadata, color: cell.state === "engaged" ? colors.bg : cell.state === "future" ? colors.inkSubtle : colors.ink }}>{Number(cell.dateISO.slice(-2))}</Text>}
          </View>
        </View>)}</View>)}
      </View>
    </View>
    <SegmentedControl appearance={scheme} values={["Badges", "Bible Moments"]} selectedIndex={section} onChange={event => setSection(event.nativeEvent.selectedSegmentIndex)} style={{ height: 44 }} />
  </View>;
  if (section === 1) return <BibleMomentsCollection key={category} standalone initialCategory={category} journeyHeader={header} />;
  return <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 24, paddingBottom: 40 }}>{header}<Text style={{ ...contentText.metadata, color: colors.inkMuted }}>{achievements.filter(a => a.value >= a.target).length} of {achievements.length} earned</Text><AchievementShelf achievements={achievements} /></ScrollView>;
}
