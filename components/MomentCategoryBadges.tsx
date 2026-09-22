import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { BIBLE_MOMENTS, MOMENT_CATEGORIES, type MomentCategory } from "@/constants/bibleMoments";
import { useBibleMomentCollection } from "@/state/bibleMoments";
import { useColors, useResolvedScheme } from "@/state/theme";
import { SFSymbol } from "@/components/Symbol";

export function MomentCategoryBadges({ onOpen }: { onOpen: (category: MomentCategory) => void }) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const { ids, hydrated, error } = useBibleMomentCollection();
  const [expanded, setExpanded] = useState<MomentCategory | null>(null);
  return <View style={{ gap: 12, marginBottom: 28 }}>
    <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 22, fontWeight: "700" }}>Collection badges</Text>
    <Text style={{ color: colors.inkMuted, fontSize: 15, lineHeight: 21 }}>Discover every Moment in a category to earn its badge.</Text>
    {!hydrated || error ? <Text style={{ color: colors.inkMuted }}>{error ? "Your collection is unavailable. Try again in Moments." : "Loading your badges…"}</Text> : (Object.keys(MOMENT_CATEGORIES) as MomentCategory[]).map(category => {
      const definition = MOMENT_CATEGORIES[category];
      const moments = BIBLE_MOMENTS.filter(moment => moment.tags.includes(category));
      const count = moments.filter(moment => ids.includes(moment.id)).length;
      const earned = count === moments.length;
      const active = expanded === category;
      return <View key={category} style={{ backgroundColor: colors.surfaceSecondary, borderRadius: 20, borderCurve: "continuous", overflow: "hidden" }}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: active }} accessibilityLabel={`${definition.name}. ${earned ? "Badge earned" : `${count} of ${moments.length} collected`}. Badge details`} onPress={() => setExpanded(active ? null : category)} style={{ flexDirection: "row", alignItems: "center", padding: 18, gap: 14, minHeight: 88 }}>
          <SFSymbol name={earned ? "checkmark.seal.fill" : "seal.fill"} size={38} color={earned ? definition[scheme] : colors.inkMuted} />
          <View style={{ flex: 1, gap: 6 }}><Text style={{ color: colors.ink, fontSize: 17, fontWeight: "600" }}>{definition.name}</Text><Text style={{ color: colors.inkMuted, fontSize: 13 }}>{earned ? "Badge earned" : `${count} of ${moments.length} collected`}</Text></View>
          <SFSymbol name={active ? "chevron.up" : "chevron.down"} size={14} color={colors.inkMuted} />
        </Pressable>
        {active && <View style={{ paddingHorizontal: 18, paddingBottom: 18, gap: 14 }}>
          <Text style={{ color: colors.inkMuted, fontSize: 15, lineHeight: 22 }}>{earned ? "Every Moment in this category is part of your collection. Revisit the stories behind your badge." : `${moments.length - count} more ${moments.length - count === 1 ? "Moment" : "Moments"} to discover. Collect them all to earn this badge.`}</Text>
          <Pressable accessibilityRole="button" onPress={() => onOpen(category)} style={{ backgroundColor: colors.ink, borderRadius: 24, minHeight: 48, alignItems: "center", justifyContent: "center", padding: 12 }}><Text style={{ color: colors.bg, fontSize: 15, fontWeight: "600" }}>{earned ? "Revisit Moments" : "Discover Moments"}</Text></Pressable>
        </View>}
      </View>;
    })}
  </View>;
}
