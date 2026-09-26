import { useState } from "react";
import { FlatList, Pressable, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useRouter } from "expo-router";
import { BibleMomentsCollection } from "@/components/BibleMomentsCollection";
import { MomentCategoryBadges } from "@/components/MomentCategoryBadges";
import { StreakFireAnimation } from "@/components/StreakFireAnimation";
import { SFSymbol } from "@/components/Symbol";
import { useColors, useResolvedScheme } from "@/state/theme";
import { useProgress } from "@/state/progress";
import { useMilestoneUnlockStreak } from "@/lib/useMilestoneUnlockStreak";
import { buildCurrentWeek, buildMonthGrid } from "@/lib/rhythm";
import { MILESTONES, isMilestoneUnlocked } from "@/lib/milestones";
import { getMilestoneBadge } from "@/lib/milestoneBadges";
import { contentText } from "@/lib/contentStyles";
import { systemText } from "@/lib/typography";
import type { MomentCategory } from "@/constants/bibleMoments";

/** A single summary, with collection detail revealed only when requested. */
export function JourneyCollection({ focusMoments = false }: { focusMoments?: boolean }) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const router = useRouter();
  const { streak, engagedDates } = useProgress();
  const unlockedThrough = useMilestoneUnlockStreak();
  const { width, fontScale } = useWindowDimensions();
  const columns = width < 350 || fontScale > 1.4 ? 1 : 2;
  const [section, setSection] = useState(focusMoments ? 1 : 0);
  const [history, setHistory] = useState(false);
  const [category, setCategory] = useState<MomentCategory | "all">("all");
  const [categories, setCategories] = useState(false);
  const [allBadges, setAllBadges] = useState(false);
  const now = new Date();
  const week = buildCurrentWeek(engagedDates);
  const month = buildMonthGrid(engagedDates, now.getFullYear(), now.getMonth(), now);
  const earned = MILESTONES.filter(m => isMilestoneUnlocked(m, unlockedThrough)).length;
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
  return <FlatList key={columns} data={allBadges ? MILESTONES : MILESTONES.slice(0, Math.max(6, earned + 2))} initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5} numColumns={columns} keyExtractor={item => String(item.day)} showsVerticalScrollIndicator={false}
    contentContainerStyle={{ padding: 20, paddingTop: 12, paddingBottom: 32 }} columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined} ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    ListHeaderComponent={<View style={{ gap: 16, paddingBottom: 20 }}>{header}<Text style={{ ...contentText.metadata, color: colors.inkMuted }}>{earned} of {MILESTONES.length} earned</Text></View>}
    renderItem={({ item, index }) => {
      const unlocked = isMilestoneUnlocked(item, unlockedThrough);
      return <Pressable disabled={!unlocked} accessibilityRole={unlocked ? "button" : "text"} accessibilityLabel={`${item.title}, ${unlocked ? "earned" : "locked"}, ${item.day} day streak`} onPress={() => router.push(`/milestone/${item.day}`)} style={{ flex: 1, maxWidth: (width - 40 - (columns - 1) * 12) / columns, padding: 16, borderRadius: 24, borderCurve: "continuous", backgroundColor: colors.surfaceSecondary, alignItems: "center", gap: 12, }}>
        <Image source={getMilestoneBadge(index + 1)} style={{ width: 104, height: 104, borderRadius: 52, opacity: unlocked ? 1 : 0.25 }} contentFit="contain" transition={0} />
        <View style={{ gap: 4, alignItems: "center" }}><Text style={{ ...contentText.title, color: unlocked ? colors.ink : colors.inkMuted, textAlign: "center" }}>{item.title}</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>{!unlocked && <SFSymbol name="lock.fill" size={11} color={colors.inkMuted} />}<Text style={{ ...contentText.metadata, color: colors.inkMuted }}>Day {item.day}</Text></View></View>
      </Pressable>;
    }}
    ListFooterComponent={<View style={{ marginTop: 24 }}>{!allBadges && earned + 2 < MILESTONES.length && <Pressable accessibilityRole="button" onPress={() => setAllBadges(true)} style={{ minHeight: 48, alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Text style={{ ...contentText.description, color: colors.ink }}>View all badges</Text></Pressable>}<Pressable accessibilityRole="button" accessibilityState={{ expanded: categories }} onPress={() => setCategories(!categories)} style={{ minHeight: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}><Text style={{ ...contentText.title, color: colors.ink }}>Collection badges</Text><SFSymbol name={categories ? "chevron.up" : "chevron.down"} size={14} color={colors.inkMuted} /></Pressable>{categories && <MomentCategoryBadges onOpen={value => { setCategory(value); setSection(1); }} />}</View>} />;
}
