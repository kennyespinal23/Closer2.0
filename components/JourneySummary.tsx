import { Pressable, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useProgress } from "@/state/progress";
import { useBibleMomentCollection } from "@/state/bibleMoments";
import { useColors } from "@/state/theme";
import { MILESTONES, isMilestoneUnlocked } from "@/lib/milestones";
import { getMilestoneBadge } from "@/lib/milestoneBadges";
import { BIBLE_MOMENTS } from "@/constants/bibleMoments";
import { SFSymbol } from "@/components/Symbol";
import { systemText } from "@/lib/typography";

/** Personal progress uses earned data, independently of developer badge previews. */
export function JourneySummary({ onSelect, compact = false }: {
  onSelect: (section?: "moments" | "badges") => void;
  compact?: boolean;
}) {
  const colors = useColors();
  const router = useRouter();
  const { streak } = useProgress();
  const { ids, hydrated, error } = useBibleMomentCollection();
  const earned = MILESTONES.filter(m => isMilestoneUnlocked(m, streak.longest));
  const latest = earned[earned.length - 1];
  const next = MILESTONES.find(m => m.day > streak.longest);
  const label = { fontFamily: "System", fontSize: 13, lineHeight: 18, color: colors.inkMuted } as const;
  return <View style={{ marginTop: 24, marginBottom: 12, marginHorizontal: compact ? 0 : 20, gap: 14 }}>
    {!compact && <Pressable accessibilityRole="button" accessibilityLabel="Open Your Journey" onPress={() => onSelect()} style={{ minHeight: 44, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <View><Text style={[systemText.title2, { color: colors.ink }]}>Your Journey</Text><Text style={label}>Small moments. A growing faith.</Text></View>
      <SFSymbol name="chevron.right" size={16} color={colors.inkMuted} />
    </Pressable>}
    <View style={{ borderRadius: 24, backgroundColor: colors.surfaceSecondary, padding: 20, gap: 20 }}>
      <View style={{ flexDirection: "row", gap: 12 }}>
        {[
          { value: String(streak.current), title: "Day streak", section: undefined },
          { value: String(earned.length), title: "Badges", section: "badges" as const },
          { value: hydrated && !error ? String(ids.length) : "—", title: "Moments", section: "moments" as const },
        ].filter(item => !compact || item.section).map(item => <Pressable key={item.title} accessibilityRole="button" accessibilityLabel={`${item.value} ${item.title}. View ${item.title}`} onPress={() => onSelect(item.section)} style={{ flex: 1, minHeight: 60, gap: 4 }}>
          <Text style={[systemText.title1, { color: colors.ink }]}>{item.value}</Text><Text style={label}>{item.title}</Text>
        </Pressable>)}
      </View>
      <View style={{ height: 1, backgroundColor: colors.ink, opacity: 0.08 }} />
      <Pressable accessibilityRole="button" onPress={() => latest ? router.push(`/milestone/${latest.day}`) : onSelect("badges")} style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Image source={getMilestoneBadge(latest ? MILESTONES.indexOf(latest) + 1 : 1)} contentFit="contain" transition={0} style={{ width: 72, height: 72, opacity: latest ? 1 : 0.45 }} />
        <View style={{ flex: 1, gap: 4 }}><Text style={label}>{latest ? "Latest milestone" : "Your first milestone awaits"}</Text><Text style={[systemText.headline, { color: colors.ink }]}>{latest?.title ?? "One small beginning"}</Text><Text style={label}>{latest ? `Earned at ${latest.day} ${latest.day === 1 ? "day" : "days"}` : "Begin with today's devotional."}</Text></View>
        <SFSymbol name="chevron.right" size={14} color={colors.inkMuted} />
      </Pressable>
      <Text style={label}>{next ? `Next milestone at ${next.day} days · Best streak ${streak.longest}` : "Every milestone earned. Keep growing."}</Text>
    </View>
    <Pressable accessibilityRole="button" onPress={() => onSelect("moments")} style={{ minHeight: 64, borderRadius: 20, padding: 16, backgroundColor: colors.surfaceSecondary, flexDirection: "row", alignItems: "center", gap: 12 }}>
      <SFSymbol name="sparkles" size={24} color={colors.ink} /><View style={{ flex: 1, gap: 3 }}><Text style={[systemText.headline, { color: colors.ink }]}>Your Bible Moments</Text><Text style={label}>{error ? "Open collection to retry" : !hydrated ? "Loading your collection…" : ids.length ? `${ids.length} of ${BIBLE_MOMENTS.length} discovered` : "Discover glowing verses as you read."}</Text></View><SFSymbol name="chevron.right" size={14} color={colors.inkMuted} />
    </Pressable>
  </View>;
}
