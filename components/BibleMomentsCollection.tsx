import { useState } from "react";
import { FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { BIBLE_MOMENTS, MOMENT_CATEGORIES, type BibleMoment, type MomentCategory } from "@/constants/bibleMoments";
import { getBookCover } from "@/constants/bookCovers";
import { useBibleMomentCollection, hydrateBibleMoments } from "@/state/bibleMoments";
import { useColors, useResolvedScheme } from "@/state/theme";
import { BibleMomentCard } from "@/components/BibleMoment";
import { SFSymbol } from "@/components/Symbol";

export function BibleMomentsCollection() {
  const colors = useColors();
  const dark = useResolvedScheme() === "dark";
  const router = useRouter();
  const { ids, hydrated, error } = useBibleMomentCollection();
  const [filter, setFilter] = useState<MomentCategory | "all">("all");
  const [open, setOpen] = useState<BibleMoment | null>(null);
  const moments = BIBLE_MOMENTS.filter(moment => filter === "all" || moment.tags.includes(filter));
  const completed = Object.entries(MOMENT_CATEGORIES).filter(([id]) => BIBLE_MOMENTS.filter(moment => moment.tags.includes(id as MomentCategory)).every(moment => ids.includes(moment.id)));
  return <View style={{ marginTop: 28, marginBottom: 8, gap: 12 }}>
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
      <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 24, fontWeight: "700", flex: 1 }}>Bible Moments</Text>
      <Text style={{ color: colors.inkSubtle, fontSize: 15, fontVariant: ["tabular-nums"] }}>{hydrated ? `${ids.length} / ${BIBLE_MOMENTS.length}` : "Loading…"}</Text>
    </View>
    <Text style={{ color: colors.inkSubtle, fontSize: 15, lineHeight: 22 }}>Tap glowing verses as you read to collect their stories. Complete a category to earn its badge.</Text>
    {error && <Pressable accessibilityRole="button" onPress={() => { void hydrateBibleMoments(); }} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ color: colors.ink }}>{error}</Text></Pressable>}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {(["all", ...Object.keys(MOMENT_CATEGORIES)] as (MomentCategory | "all")[]).map(category => {
        const active = category === filter;
        const categoryColor = category === "all" ? colors.ink : MOMENT_CATEGORIES[category][dark ? "dark" : "light"];
        return <Pressable key={category} accessibilityRole="button" accessibilityState={{ selected: active }} onPress={() => setFilter(category)} style={{ minHeight: 44, justifyContent: "center", paddingHorizontal: 16, borderRadius: 22, borderCurve: "continuous", backgroundColor: active ? colors.ink : colors.surfaceSecondary }}>
          <Text style={{ color: active ? (dark ? "#000" : "#FFF") : categoryColor, fontSize: 14, fontWeight: "600" }}>{category === "all" ? "All moments" : MOMENT_CATEGORIES[category].name}</Text>
        </Pressable>;
      })}
    </ScrollView>
    {filter !== "all" && <Text style={{ color: colors.inkSubtle, fontSize: 13 }}>{moments.filter(moment => ids.includes(moment.id)).length} of {moments.length} collected in {MOMENT_CATEGORIES[filter].name}</Text>}
    <FlatList horizontal data={moments} key={filter} keyExtractor={moment => moment.id} showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }} renderItem={({ item: moment }) => {
      const earned = ids.includes(moment.id);
      const category = MOMENT_CATEGORIES[moment.category];
      return <Pressable disabled={!hydrated} accessibilityRole="button" accessibilityLabel={`${moment.event}. ${earned ? "Collected. Open card" : `Not collected. Read ${moment.reference}`}`} onPress={() => {
        if (earned) setOpen(moment);
        else router.push(`/book/${moment.bookId}/${moment.chapter}?focus=${moment.verse}` as Href);
      }} style={{ width: 192, borderRadius: 22, borderCurve: "continuous", overflow: "hidden", backgroundColor: colors.surfaceSecondary }}>
        <View style={{ height: 160, backgroundColor: dark ? "#171717" : "#DDD" }}>
          <Image source={getBookCover(moment.bookId)} contentFit="cover" style={{ width: "100%", height: "100%", opacity: earned ? 1 : 0.25 }} />
          <View style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#00000099" }}><SFSymbol name={earned ? "checkmark" : "lock.fill"} size={15} color={earned ? category.dark : "#FFF"} /></View>
        </View>
        <View style={{ padding: 14, gap: 6, minHeight: 132 }}>
          <Text numberOfLines={1} style={{ color: category[dark ? "dark" : "light"], fontSize: 11, fontWeight: "600" }}>{category.name}</Text>
          <Text numberOfLines={2} style={{ color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "700" }}>{moment.title}</Text>
          <Text style={{ color: colors.inkSubtle, fontSize: 13 }}>{moment.reference}</Text>
        </View>
      </Pressable>;
    }} />
    {completed.length > 0 && <View style={{ gap: 8 }}>
      <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 17, fontWeight: "600" }}>Moment badges</Text>
      {completed.map(([id, category]) => <View key={id} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 18, backgroundColor: colors.surfaceSecondary }}>
        <SFSymbol name="seal.fill" size={28} color={category[dark ? "dark" : "light"]} />
        <View style={{ flex: 1 }}><Text style={{ color: colors.ink, fontSize: 16, fontWeight: "600" }}>{category.name}</Text><Text style={{ color: colors.inkSubtle, fontSize: 13 }}>Every moment collected</Text></View>
        <SFSymbol name="checkmark" size={18} color={category[dark ? "dark" : "light"]} />
      </View>)}
    </View>}
    <BibleMomentCard moment={open} onClose={() => setOpen(null)} />
  </View>;
}
