import { WaxMedal } from "./WaxMedal";
import { contentText, contentLayout } from "@/lib/contentStyles";
import { Pressable, View } from "react-native";
import { Text } from "@/components/CloserText";
import { useRouter } from "expo-router";
import { useProgress } from "@/state/progress";
import { useBibleMomentCollection } from "@/state/bibleMoments";
import { useColors } from "@/state/theme";
import { MILESTONES, isMilestoneUnlocked } from "@/lib/milestones";
import { BIBLE_MOMENTS } from "@/constants/bibleMoments";
import { SFSymbol } from "@/components/Symbol";
import { systemText } from "@/lib/typography";

/** Personal progress uses earned data, independently of developer badge previews. */
export function JourneySummary({ onSelect, compact = false, profile = false }: {
  onSelect: (section?: "moments" | "badges") => void;
  compact?: boolean;
  profile?: boolean;
}) {
  const colors = useColors();
  const router = useRouter();
  const { streak, engagedDates, chaptersRead } = useProgress();
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return { label: date.toLocaleDateString(undefined, { weekday: "narrow" }), full: date.toLocaleDateString(), read: engagedDates.includes(iso) || chaptersRead.some(chapter => chapter.dateISO === iso) };
  });
  const { ids, hydrated, error } = useBibleMomentCollection();
  const earned = MILESTONES.filter(m => isMilestoneUnlocked(m, streak.longest));
  const latest = earned[earned.length - 1];
  const next = MILESTONES.find(m => m.day > streak.longest);
  const label = { ...contentText.metadata, color: colors.inkMuted } as const;
  return <View style={{ marginTop: 24, marginBottom: 12, marginHorizontal: compact ? 0 : contentLayout.gutter, gap: contentLayout.itemGap }}>
    {!compact && <Pressable accessibilityRole="button" accessibilityLabel="Open Your Journey" onPress={() => onSelect()} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <View><Text style={[systemText.title2, { color: colors.ink }]}>Your Journey</Text><Text style={label}>Small moments. A growing faith.</Text></View>
      <SFSymbol name="chevron.right" size={16} color={colors.inkMuted} />
    </Pressable>}
    <View style={{ ...contentLayout.spaciousCard, backgroundColor: colors.surfaceSecondary, gap: contentLayout.sectionGap }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[
          { value: String(streak.current), title: "Day streak", section: undefined },
          { value: String(earned.length), title: "Badges", section: "badges" as const },
          { value: hydrated && !error ? String(ids.length) : "—", title: "Moments", section: "moments" as const },
        ].filter(item => !compact || item.section).map(item => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={`${item.value} ${item.title}. View ${item.title}`} onPress={() => onSelect(item.section)} style={{ flex: 1, minHeight: 60, gap: 4 }}>
          <Text style={[systemText.title1, { color: colors.ink }]}>{item.value}</Text><Text style={label}>{item.title}</Text>
        </Pressable>)}
      </View>
      {profile && <Pressable accessibilityRole="button" accessibilityLabel="Recent reading days. Open your reading history" onPress={() => onSelect()} style={{ gap: 12 }}>
        <Text style={label}>Your last seven days</Text>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          {days.map((day, index) => <View key={index} accessible accessibilityLabel={`${day.full}: ${day.read ? "Read" : "No reading recorded"}`} style={{ alignItems: "center", gap: 8 }}>
            <View style={{ width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: day.read ? "#248A3D" : colors.bg }}>
              {day.read && <SFSymbol name="checkmark" size={12} color="#FFFFFF" />}
            </View>
            <Text style={label}>{day.label}</Text>
          </View>)}
        </View>
      </Pressable>}
      <View style={{ height: 1, backgroundColor: colors.ink, opacity: 0.08 }} />
      <Pressable accessibilityRole="button" onPress={() => latest ? router.push(`/milestone/${latest.day}`) : onSelect("badges")} style={{ flexDirection: "row", alignItems: "center", gap: contentLayout.itemGap }}>
        <WaxMedal size={64} index={0} />
        <View style={{ flex: 1, gap: 4 }}><Text style={label}>{latest ? "Latest milestone" : "Your first milestone awaits"}</Text><Text style={[systemText.headline, { color: colors.ink }]}>{latest?.title ?? "One small beginning"}</Text><Text style={label}>{latest ? `Earned at ${latest.day} ${latest.day === 1 ? "day" : "days"}` : "Begin with today's devotional."}</Text></View>
        <SFSymbol name="chevron.right" size={14} color={colors.inkMuted} />
      </Pressable>
      <Text style={label}>{next ? `Next milestone at ${next.day} days · Best streak ${streak.longest}` : "Every milestone earned. Keep growing."}</Text>
    </View>
    {!profile && <Pressable accessibilityRole="button" onPress={() => onSelect("moments")} style={{ minHeight: 64, ...contentLayout.card, backgroundColor: colors.surfaceSecondary, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <SFSymbol name="sparkles" size={24} color={colors.ink} /><View style={{ flex: 1, gap: contentLayout.textGap }}><Text style={[systemText.headline, { color: colors.ink }]}>Your Bible Moments</Text><Text style={label}>{error ? "Open collection to retry" : !hydrated ? "Loading your collection…" : ids.length ? `${ids.length} of ${BIBLE_MOMENTS.length} discovered` : "Discover glowing verses as you read."}</Text></View><SFSymbol name="chevron.right" size={14} color={colors.inkMuted} />
    </Pressable>}
  </View>;
}
