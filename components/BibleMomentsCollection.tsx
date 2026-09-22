import { useRef, useState } from "react";
import { FlatList, Pressable, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { Host, ContextMenu, Button as NativeButton } from "@expo/ui/swift-ui";
import { accessibilityLabel } from "@expo/ui/swift-ui/modifiers";
import { BIBLE_MOMENTS, MOMENT_CATEGORIES, type BibleMoment, type MomentCategory } from "@/constants/bibleMoments";
import { getBookCover } from "@/constants/bookCovers";
import { useBibleMomentCollection, hydrateBibleMoments } from "@/state/bibleMoments";
import { useColors, useResolvedScheme } from "@/state/theme";
import { BibleMomentCard } from "@/components/BibleMoment";
import { SFSymbol } from "@/components/Symbol";
import * as haptics from "@/lib/haptics";

type CategoryFilter = MomentCategory | "all";

/** Journey owns a virtualized gallery; the post-reading dashboard keeps a compact rail. */
export function BibleMomentsCollection({ standalone = false, initialCategory = "all" }: { standalone?: boolean; initialCategory?: CategoryFilter }) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const { ids, hydrated, error } = useBibleMomentCollection();
  const [filter, setFilter] = useState<CategoryFilter>(initialCategory);
  const [view, setView] = useState(0);
  const [open, setOpen] = useState<BibleMoment | null>(null);
  const list = useRef<FlatList<BibleMoment>>(null);
  const earnedIds = new Set(ids);
  const inCategory = BIBLE_MOMENTS.filter(moment => filter === "all" || moment.tags.includes(filter));
  const moments = inCategory.filter(moment => view === 0 || (view === 1 ? earnedIds.has(moment.id) : !earnedIds.has(moment.id)));
  const completed = Object.entries(MOMENT_CATEGORIES).filter(([id]) => BIBLE_MOMENTS.filter(moment => moment.tags.includes(id as MomentCategory)).every(moment => earnedIds.has(moment.id)));
  const ready = hydrated && !error;
  const columns = width < 350 || fontScale > 1.4 ? 1 : 2;
  const cardWidth = standalone ? (width - 40 - (columns - 1) * 12) / columns : 224;
  const resetScroll = () => list.current?.scrollToOffset({ offset: 0, animated: false });
  const header = <View style={{ gap: 16, paddingBottom: 16 }}>
    <View style={{ gap: 6 }}>
      <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 26, fontWeight: "700" }}>Bible Moments</Text>
      <Text style={{ color: colors.inkMuted, fontSize: 15, lineHeight: 22 }}>Stories to discover. Meaning to carry with you.</Text>
    </View>
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.inkMuted, fontSize: 13, fontVariant: ["tabular-nums"] }}>{ready ? `${ids.length} of ${BIBLE_MOMENTS.length} collected` : error ? "Collection unavailable" : "Loading your collection…"}</Text>
      {ready && <View accessibilityRole="progressbar" accessibilityLabel="Bible Moments collected" accessibilityValue={{ min: 0, max: BIBLE_MOMENTS.length, now: ids.length }} style={{ height: 4, borderRadius: 2, backgroundColor: colors.surfaceSecondary, overflow: "hidden" }}><View style={{ height: 4, width: `${ids.length / BIBLE_MOMENTS.length * 100}%`, backgroundColor: colors.inkMuted }} /></View>}
    </View>
    <SegmentedControl appearance={scheme} values={["All", "Collected", "Discover"]} selectedIndex={view} onChange={event => { haptics.tick(); setView(event.nativeEvent.selectedSegmentIndex); resetScroll(); }} style={{ height: 36 }} />
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "600" }}>{filter === "all" ? "All categories" : MOMENT_CATEGORIES[filter].name}</Text>
        <Text style={{ color: colors.inkMuted, fontSize: 12 }}>{ready ? `${moments.length} ${moments.length === 1 ? "moment" : "moments"}` : " "}</Text>
      </View>
      <Host colorScheme={scheme} style={{ width: 120, height: 44 }}>
        <ContextMenu activationMethod="singlePress">
          <ContextMenu.Trigger><NativeButton variant="bordered" systemImage="line.3.horizontal.decrease" modifiers={[accessibilityLabel("Filter Moment categories")]}>Filter</NativeButton></ContextMenu.Trigger>
          <ContextMenu.Items>{(["all", ...Object.keys(MOMENT_CATEGORIES)] as CategoryFilter[]).map(category => <NativeButton key={category} systemImage={filter === category ? "checkmark" : undefined} onPress={() => { haptics.tick(); setFilter(category); resetScroll(); }}>{category === "all" ? "All categories" : MOMENT_CATEGORIES[category].name}</NativeButton>)}</ContextMenu.Items>
        </ContextMenu>
      </Host>
    </View>
    {ready && filter !== "all" && <CategoryGoal category={filter} moments={inCategory} earnedIds={earnedIds} onDiscover={moment => {
      haptics.soft();
      router.push(`/book/${moment.bookId}/${moment.chapter}?focus=${moment.verse}` as Href);
    }} />}
  </View>;
  const empty = <View style={{ padding: 24, gap: 10, borderRadius: 24, backgroundColor: colors.surfaceSecondary }}>
    <Text style={{ color: colors.ink, fontSize: 19, fontWeight: "600" }}>{error ? "Let’s try that again" : !hydrated ? "Gathering your Moments" : view === 1 ? "Your collection starts with a verse" : "Every Moment here is yours"}</Text>
    <Text style={{ color: colors.inkMuted, fontSize: 15, lineHeight: 22 }}>{error ? "Your collection couldn’t be loaded. Your saved Moments haven’t been changed." : !hydrated ? "Your saved discoveries will appear here." : view === 1 ? "Open Discover, choose a story, then tap its glowing verse in the reader to collect it." : "You’ve collected every Moment in this selection. Revisit them in Collected."}</Text>
    {(error || hydrated) && <Pressable accessibilityRole="button" onPress={() => { if (error) void hydrateBibleMoments(); else { setView(view === 1 ? 2 : 1); resetScroll(); } }} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ color: colors.ink, fontSize: 15, fontWeight: "600" }}>{error ? "Try again" : view === 1 ? "Discover Moments" : "View collected"}</Text></Pressable>}
  </View>;
  const badges = ready && completed.length > 0 ? <View style={{ marginTop: 24, gap: 12 }}>
    <Text accessibilityRole="header" style={{ color: colors.ink, fontSize: 19, fontWeight: "600" }}>Category badges</Text>
    {completed.map(([id, category]) => <View key={id} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 20, backgroundColor: colors.surfaceSecondary }}><SFSymbol name="seal.fill" size={28} color={category[scheme]} /><View style={{ flex: 1 }}><Text style={{ color: colors.ink, fontSize: 16, fontWeight: "600" }}>{category.name}</Text><Text style={{ color: colors.inkMuted, fontSize: 13 }}>Every moment collected</Text></View><SFSymbol name="checkmark" size={18} color={category[scheme]} /></View>)}
  </View> : null;
  const renderCard = ({ item }: { item: BibleMoment }) => <MomentCollectionCard moment={item} width={cardWidth} earned={earnedIds.has(item.id)} onPress={() => {
    haptics.soft();
    if (earnedIds.has(item.id)) setOpen(item);
    else router.push(`/book/${item.bookId}/${item.chapter}?focus=${item.verse}` as Href);
  }} />;
  return <View style={standalone ? { flex: 1 } : { marginTop: 28, marginBottom: 8 }}>
    {standalone ? <FlatList ref={list} key={columns} numColumns={columns} data={ready ? moments : []} keyExtractor={moment => moment.id} renderItem={renderCard}
      ListHeaderComponent={header} ListEmptyComponent={empty} ListFooterComponent={badges}
      columnWrapperStyle={columns > 1 ? { gap: 12 } : undefined} ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 }} showsVerticalScrollIndicator={false} initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5} /> : <>
      {header}<FlatList ref={list} horizontal data={ready ? moments : []} key={`${view}:${filter}`} keyExtractor={moment => moment.id} renderItem={renderCard} ListEmptyComponent={empty} contentContainerStyle={{ gap: 12 }} showsHorizontalScrollIndicator={false} />{badges}
    </>}
    <BibleMomentCard moment={open} onClose={() => setOpen(null)} />
  </View>;
}

function CategoryGoal({ category, moments, earnedIds, onDiscover }: {
  category: MomentCategory; moments: BibleMoment[]; earnedIds: Set<string>; onDiscover: (moment: BibleMoment) => void;
}) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const [pressed, setPressed] = useState(false);
  const definition = MOMENT_CATEGORIES[category];
  const collected = moments.filter(moment => earnedIds.has(moment.id)).length;
  const next = moments.find(moment => !earnedIds.has(moment.id));
  const complete = collected === moments.length;
  const green = scheme === "dark" ? "#83D8BC" : "#14665B";
  return <View style={{ padding: 18, gap: 14, borderRadius: 22, borderCurve: "continuous", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
      <View accessible={false} style={{ width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <SFSymbol name={complete ? "checkmark.seal.fill" : "seal.fill"} size={34} color={complete ? definition[scheme] : colors.inkMuted} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: colors.ink, fontSize: 16, lineHeight: 21, fontWeight: "600" }}>{complete ? "Category complete" : "Your next collection badge"}</Text>
        <Text style={{ color: colors.inkMuted, fontSize: 13, lineHeight: 18 }}>{definition.name} · {complete ? "Badge earned" : "Badge locked"}</Text>
      </View>
      {complete && <SFSymbol name="checkmark.circle.fill" size={22} color={green} />}
    </View>
    <View style={{ gap: 8 }}>
      <Text style={{ color: complete ? green : colors.inkMuted, fontSize: 13, fontVariant: ["tabular-nums"] }}>{collected} of {moments.length} collected</Text>
      <View accessibilityRole="progressbar" accessibilityLabel={`${definition.name} collected`} accessibilityValue={{ min: 0, max: moments.length, now: collected }} style={{ height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" }}>
        <View style={{ height: 4, width: `${moments.length ? collected / moments.length * 100 : 0}%`, backgroundColor: complete ? green : definition[scheme] }} />
      </View>
    </View>
    {next ? <Pressable accessibilityRole="button" accessibilityLabel={`Next to discover: ${next.event}. Read ${next.reference}`} onPress={() => onDiscover(next)} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, opacity: pressed ? 0.65 : 1 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: colors.inkMuted, fontSize: 12 }}>Next to discover</Text>
        <Text style={{ color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: "600" }}>{next.title}</Text>
        <Text style={{ color: colors.inkMuted, fontSize: 13, lineHeight: 18 }}>{next.reference}</Text>
      </View>
      <SFSymbol name="arrow.right" size={18} color={colors.ink} />
    </Pressable> : <Text style={{ color: colors.inkMuted, fontSize: 14, lineHeight: 20 }}>Every Moment in this category is yours to revisit.</Text>}
  </View>;
}

function MomentCollectionCard({ moment, earned, width, onPress }: { moment: BibleMoment; earned: boolean; width: number; onPress: () => void }) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const [pressed, setPressed] = useState(false);
  const category = MOMENT_CATEGORIES[moment.category];
  return <Pressable accessibilityRole="button" accessibilityLabel={`${moment.event}. ${earned ? "Collected. Open moment" : `Not collected. Read ${moment.reference}`}`} onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
    style={{ width, borderRadius: 24, borderCurve: "continuous", overflow: "hidden", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: earned ? `${category[scheme]}55` : colors.border, opacity: pressed ? 0.8 : 1 }}>
    <View style={{ height: Math.min(224, width * 0.9), backgroundColor: colors.surfaceSecondary }}>
      <Image source={getBookCover(moment.bookId)} contentFit="cover" transition={0} style={{ width: "100%", height: "100%", opacity: earned ? 1 : 0.5 }} />
      <View style={{ position: "absolute", top: 12, right: 12, width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#000000A6" }}><SFSymbol name={earned ? "checkmark" : "lock.fill"} size={14} color={earned ? category.dark : "white"} /></View>
    </View>
    <View style={{ padding: 14, gap: 8, flex: 1 }}>
      <Text style={{ color: category[scheme], fontSize: 11, lineHeight: 15, fontWeight: "600" }}>{category.name}</Text>
      <Text style={{ color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: "700" }}>{moment.title}</Text>
      <Text style={{ color: colors.inkMuted, fontSize: 13, lineHeight: 18 }}>{moment.reference}</Text>
      <View style={{ flex: 1, minHeight: 4 }} />
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 6 }}><Text style={{ flex: 1, color: colors.ink, fontSize: 12, fontWeight: "600" }}>{earned ? "Open moment" : "Read passage"}</Text><SFSymbol name={earned ? "chevron.right" : "arrow.right"} size={12} color={colors.inkMuted} /></View>
    </View>
  </Pressable>;
}
