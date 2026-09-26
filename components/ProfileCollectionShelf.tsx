import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useColors } from "@/state/theme";
import { useBibleMomentCollection } from "@/state/bibleMoments";
import { BIBLE_MOMENTS, type BibleMoment } from "@/constants/bibleMoments";
import { getBookCover } from "@/constants/bookCovers";
import { BibleMomentCard } from "@/components/BibleMoment";
import { contentText, contentLayout } from "@/lib/contentStyles";

export function ProfileCollectionShelf() {
  const colors = useColors();
  const router = useRouter();
  const { ids, hydrated, error } = useBibleMomentCollection();
  const [open, setOpen] = useState<BibleMoment | null>(null);
  const moments = [...ids].reverse().map(id => BIBLE_MOMENTS.find(m => m.id === id)).filter((m): m is BibleMoment => !!m).slice(0, 6);
  return <View style={{ marginTop: 32, gap: 12 }}>
    <View style={{ paddingHorizontal: contentLayout.gutter, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <Text accessibilityRole="header" style={[contentText.section, { color: colors.ink, flexShrink: 1 }]}>Bible Moments</Text>
      <Pressable accessibilityRole="button" onPress={() => router.push("/rhythm?section=moments")} style={{ minHeight: 44, justifyContent: "center" }}><Text style={[contentText.description, { color: colors.ink }]}>View all</Text></Pressable>
    </View>
    {hydrated && !error && moments.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
      {moments.map(moment => <Pressable key={moment.id} accessibilityRole="button" accessibilityLabel={`Open collected Moment: ${moment.title}`} onPress={() => setOpen(moment)} style={{ width: 148, gap: 8 }}>
        <Image source={getBookCover(moment.bookId)} contentFit="cover" style={{ width: 148, height: 184, borderRadius: 20 }} />
        <Text style={[contentText.title, { color: colors.ink }]} numberOfLines={2}>{moment.title}</Text>
        <Text style={[contentText.metadata, { color: colors.inkMuted }]}>{moment.reference}</Text>
      </Pressable>)}
    </ScrollView> : <Pressable accessibilityRole="button" onPress={() => router.push("/rhythm?section=moments")} style={{ marginHorizontal: 20, ...contentLayout.card, backgroundColor: colors.surfaceSecondary, gap: 4 }}>
      <Text style={[contentText.title, { color: colors.ink }]}>{error ? "Open your collection to retry" : !hydrated ? "Loading your collection…" : "Your first discovery awaits"}</Text>
      <Text style={[contentText.description, { color: colors.inkMuted }]}>Discover the glowing Moments as you read.</Text>
    </Pressable>}
    <BibleMomentCard moment={open} onClose={() => setOpen(null)} />
  </View>;
}
