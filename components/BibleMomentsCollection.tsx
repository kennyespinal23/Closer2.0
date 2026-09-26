import { MomentCollectibleFront } from "./MomentCollectible";
import { contentText, contentLayout } from "@/lib/contentStyles";
import { type ReactNode, useRef, useState } from "react";
import { Modal, ScrollView, FlatList, Pressable, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useRouter, type Href } from "expo-router";
import { Host, ContextMenu, Button as NativeButton } from "@expo/ui/swift-ui";
import { accessibilityLabel } from "@expo/ui/swift-ui/modifiers";
import { BIBLE_MOMENTS, MOMENT_CATEGORIES, type BibleMoment, type MomentCategory } from "@/constants/bibleMoments";
import { getBookCover } from "@/constants/bookCovers";
import { useBibleMomentCollection, hydrateBibleMoments } from "@/state/bibleMoments";
import { useColors, useResolvedScheme } from "@/state/theme";
import { ReaderMomentDetail } from "@/components/ReaderMomentCardBox";
import { MomentBookFoil } from "@/components/MomentBookFoil";
import { findBookById } from "@/constants/books";
import { SFSymbol } from "@/components/Symbol";
import * as haptics from "@/lib/haptics";

type CategoryFilter = MomentCategory | "all";

/** Journey owns a virtualized gallery; the post-reading dashboard keeps a compact rail. */
export function BibleMomentsCollection({ standalone = false, initialCategory = "all", journeyHeader }: { standalone?: boolean; initialCategory?: CategoryFilter; journeyHeader?: ReactNode }) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const { ids, hydrated, error } = useBibleMomentCollection();
  const [filter, setFilter] = useState<CategoryFilter>(initialCategory);
  const [view, setView] = useState(0);
  const [foil, setFoil] = useState<string | null>(null);
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
  const foilBooks = [...new Set(BIBLE_MOMENTS.map(m => m.bookId))].filter(id => BIBLE_MOMENTS.filter(m => m.bookId === id).every(m => earnedIds.has(m.id)));
  const header = <View style={{ gap: 16, paddingBottom: 16 }}>
    {journeyHeader}
    {ready && foilBooks.length > 0 && <View style={{ gap: 12 }}><Text style={{ color: colors.ink, ...contentText.section }}>Silver collections</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 10 }}>{foilBooks.map(id => <MomentBookFoil key={id} name={findBookById(id)?.name ?? "Book"} earned onPress={() => setFoil(id)} />)}</ScrollView></View>}
    {!journeyHeader && <View style={{ gap: contentLayout.textGap }}>
      <Text accessibilityRole="header" style={{ color: colors.ink, ...contentText.section }}>Bible Moments</Text>
    </View>}
    <View style={{ gap: 8 }}>
      <Text style={{ color: colors.inkMuted, ...contentText.metadata, fontVariant: ["tabular-nums"] }}>{ready ? `${ids.length} of ${BIBLE_MOMENTS.length} collected` : error ? "Collection unavailable" : "Loading your collection…"}</Text>
      {ready && <View accessibilityRole="progressbar" accessibilityLabel="Bible Moments collected" accessibilityValue={{ min: 0, max: BIBLE_MOMENTS.length, now: ids.length }} style={{ height: 4, borderRadius: 2, backgroundColor: colors.surfaceSecondary, overflow: "hidden" }}><View style={{ height: 4, width: `${ids.length / BIBLE_MOMENTS.length * 100}%`, backgroundColor: colors.inkMuted }} /></View>}
    </View>
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <Text style={{ flex: 1, color: colors.inkMuted, ...contentText.metadata }}>{filter === "all" ? ["All Moments", "Collected", "To discover"][view] : MOMENT_CATEGORIES[filter].name}</Text>
      <Host colorScheme={scheme} style={{ width: 108, height: 44 }}>
        <ContextMenu activationMethod="singlePress">
          <ContextMenu.Trigger><NativeButton variant="bordered" systemImage="line.3.horizontal.decrease" modifiers={[accessibilityLabel("Filter Moments")]}>Filter</NativeButton></ContextMenu.Trigger>
          <ContextMenu.Items>
            {["All Moments", "Collected", "To discover"].map((label, index) => <NativeButton key={label} systemImage={view === index ? "checkmark" : undefined} onPress={() => { haptics.tick(); setView(index); resetScroll(); }}>{label}</NativeButton>)}
            {(["all", ...Object.keys(MOMENT_CATEGORIES)] as CategoryFilter[]).map(category => <NativeButton key={category} systemImage={filter === category ? "checkmark" : undefined} onPress={() => { haptics.tick(); setFilter(category); resetScroll(); }}>{category === "all" ? "All categories" : MOMENT_CATEGORIES[category].name}</NativeButton>)}
          </ContextMenu.Items>
        </ContextMenu>
      </Host>
    </View>
    {ready && filter !== "all" && <CategoryGoal category={filter} moments={inCategory} earnedIds={earnedIds} onDiscover={moment => {
      haptics.soft();
      router.push(`/book/${moment.bookId}/${moment.chapter}?focus=${moment.verse}` as Href);
    }} />}
  </View>;
  const empty = <View style={{ padding: 24, gap: 10, borderRadius: 24, backgroundColor: colors.surfaceSecondary }}>
    <Text style={{ color: colors.ink, ...contentText.section }}>{error ? "Let’s try that again" : !hydrated ? "Gathering your Moments" : view === 1 ? "Your collection starts with a verse" : "Every Moment here is yours"}</Text>
    <Text style={{ color: colors.inkMuted, ...contentText.description }}>{error ? "Your collection couldn’t be loaded. Your saved Moments haven’t been changed." : !hydrated ? "Your saved discoveries will appear here." : view === 1 ? "Open Discover, choose a story, then tap its glowing verse in the reader to collect it." : "You’ve collected every Moment in this selection. Revisit them in Collected."}</Text>
    {(error || hydrated) && <Pressable accessibilityRole="button" onPress={() => { if (error) void hydrateBibleMoments(); else { setView(view === 1 ? 2 : 1); resetScroll(); } }} style={{ minHeight: 44, justifyContent: "center" }}><Text style={{ color: colors.ink, ...contentText.title }}>{error ? "Try again" : view === 1 ? "Discover Moments" : "View collected"}</Text></Pressable>}
  </View>;
  const badges = ready && completed.length > 0 ? <View style={{ marginTop: 24, gap: 12 }}>
    <Text accessibilityRole="header" style={{ color: colors.ink, ...contentText.section }}>Category badges</Text>
    {completed.map(([id, category]) => <View key={id} style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderRadius: 24, backgroundColor: colors.surfaceSecondary }}><SFSymbol name="seal.fill" size={28} color={category[scheme]} /><View style={{ flex: 1 }}><Text style={{ color: colors.ink, ...contentText.title }}>{category.name}</Text><Text style={{ color: colors.inkMuted, ...contentText.metadata }}>Every moment collected</Text></View><SFSymbol name="checkmark" size={18} color={category[scheme]} /></View>)}
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
      contentContainerStyle={{ paddingHorizontal: contentLayout.gutter, paddingTop: 12, paddingBottom: 32 }} showsVerticalScrollIndicator={false} initialNumToRender={6} maxToRenderPerBatch={6} windowSize={5} /> : <>
      {header}<FlatList ref={list} horizontal data={ready ? moments : []} key={`${view}:${filter}`} keyExtractor={moment => moment.id} renderItem={renderCard} ListEmptyComponent={empty} contentContainerStyle={{ gap: 12 }} showsHorizontalScrollIndicator={false} />{badges}
    </>}
    <Modal visible={!!open} transparent animationType="none" onRequestClose={() => setOpen(null)}>{open && <ReaderMomentDetail moment={open} onClose={() => setOpen(null)} />}</Modal>
    <Modal visible={!!foil} transparent animationType="fade" onRequestClose={() => setFoil(null)}><View style={{ flex: 1, backgroundColor: "#000000CC", alignItems: "center", justifyContent: "center", gap: 24 }}>{foil && <MomentBookFoil name={findBookById(foil)?.name ?? "Book"} earned width={220} />}<Pressable accessibilityRole="button" onPress={() => setFoil(null)} style={{ padding: 18, minWidth: 160, backgroundColor: "white", borderRadius: 26, alignItems: "center" }}><Text style={{ color: "#202B3D", fontSize: 17, fontWeight: "600" }}>Done</Text></Pressable></View></Modal>
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
  return <View style={{ ...contentLayout.card, gap: contentLayout.itemGap, backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: colors.border }}>
    <View style={{ flexDirection: "row", alignItems: "center", gap: contentLayout.itemGap }}>
      <View accessible={false} style={{ width: 52, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <SFSymbol name={complete ? "checkmark.seal.fill" : "seal.fill"} size={34} color={complete ? definition[scheme] : colors.inkMuted} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: colors.ink, ...contentText.title }}>{complete ? "Category complete" : "Your next collection badge"}</Text>
        <Text style={{ color: colors.inkMuted, ...contentText.metadata }}>{definition.name} · {complete ? "Badge earned" : "Badge locked"}</Text>
      </View>
      {complete && <SFSymbol name="checkmark.circle.fill" size={22} color={green} />}
    </View>
    <View style={{ gap: 8 }}>
      <Text style={{ color: complete ? green : colors.inkMuted, ...contentText.metadata, fontVariant: ["tabular-nums"] }}>{collected} of {moments.length} collected</Text>
      <View accessibilityRole="progressbar" accessibilityLabel={`${definition.name} collected`} accessibilityValue={{ min: 0, max: moments.length, now: collected }} style={{ height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" }}>
        <View style={{ height: 4, width: `${moments.length ? collected / moments.length * 100 : 0}%`, backgroundColor: complete ? green : definition[scheme] }} />
      </View>
    </View>
    {next ? <Pressable accessibilityRole="button" accessibilityLabel={`Next to discover: ${next.event}. Read ${next.reference}`} onPress={() => onDiscover(next)} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} style={{ minHeight: 64, flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, opacity: pressed ? 0.65 : 1 }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: colors.inkMuted, ...contentText.metadata }}>Next to discover</Text>
        <Text style={{ color: colors.ink, ...contentText.title }}>{next.title}</Text>
        <Text style={{ color: colors.inkMuted, ...contentText.metadata }}>{next.reference}</Text>
      </View>
      <SFSymbol name="arrow.right" size={18} color={colors.ink} />
    </Pressable> : <Text style={{ color: colors.inkMuted, ...contentText.description }}>Every Moment in this category is yours to revisit.</Text>}
  </View>;
}

function MomentCollectionCard({ moment, earned, width, onPress }: { moment: BibleMoment; earned: boolean; width: number; onPress: () => void }) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const [pressed, setPressed] = useState(false);
  const category = MOMENT_CATEGORIES[moment.category];
  return <Pressable accessibilityRole="button" accessibilityLabel={`${moment.event}. ${earned ? "Collected. Open moment" : `Not collected. Read ${moment.reference}`}`} onPress={onPress} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
    style={{ width, borderRadius: 24, borderCurve: "continuous", overflow: "hidden", backgroundColor: colors.surfaceSecondary, borderWidth: 1, borderColor: earned ? `${category[scheme]}55` : colors.border, opacity: pressed ? 0.8 : 1 }}>
    <View style={{ height: width * 1.38, opacity: earned ? 1 : .55 }}><MomentCollectibleFront moment={moment} compact /></View>
    {!earned && <View style={{ position: "absolute", top: 12, right: 12 }}><SFSymbol name="lock.fill" size={16} color="white" /></View>}
  </Pressable>;
}
