import { contentLayout } from "@/lib/contentStyles";
import { searchStyles } from "@/lib/searchStyles";
import { tabContentClearance } from "@/lib/tabContentClearance";
import { useFocusMiniPlayerSpacing } from "@/components/FocusMiniPlayer";
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useTabContentFade } from '@/lib/useTabContentFade';
import { LibraryShelf } from "@/components/LibraryShelf";
import { LibraryGuidedPath } from "@/components/LibraryGuidedPath";
import { LibraryBookCover } from "@/components/LibraryBookcase";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { ReaderMaterialGradient } from "@/components/ReaderMaterialGradient";
import { getBookCover } from "@/constants/bookCovers";
import { getBookTheme } from "@/constants/bookBlurbs";
import { LibraryAtmosphere } from "@/components/LibraryAtmosphere";
import { LibraryEnvironment } from "@/components/LibraryEnvironment";
import { type LibraryBookFrame } from "@/components/LibraryBookcase";
import { LibraryDoors } from "@/components/LibraryDoors";
import { systemText } from "@/lib/typography";
import { Host, Image as NativeSymbol, ContextMenu, Section as NativeSection, Button as NativeButton } from "@expo/ui/swift-ui";
import { accessibilityLabel, frame, background, clipShape } from "@expo/ui/swift-ui/modifiers";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { BookReaderPreparation } from "@/app/book/[id]/[chapter]";
import { BibleIntroScreen } from "@/components/BibleIntroScreen";
import { loadJSON, saveJSON, STORAGE_KEYS } from "@/lib/storage";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, Modal, FlatList, Keyboard, ScrollView, StyleSheet, useWindowDimensions, View } from "react-native";
import { TextInput, Text } from "@/components/CloserText";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useBottomTabBarHeight } from "react-native-bottom-tabs";
import { SFSymbol } from "@/components/Symbol";
import { BookCover } from "@/components/BookCover";
import { ThemedText } from "@/components/ThemedText";
import { type Book, type BookCategory, BOOKS } from "@/constants/books";
import { itemGap, minTouchTarget, radius, spacing } from "@/constants/spacing";
import * as haptics from "@/lib/haptics";
import { computeContinueReading } from "@/lib/continueReading";
import { SCREEN_H_PAD } from "@/lib/layout";
import { useProgress } from "@/state/progress";
import { useColors, useResolvedScheme } from "@/state/theme";

// The Bible tab uses the app canvas: deep wine in dark, white in light.
const useLibraryColors = useColors;
/** Side gutter shared with Today. */
const GUTTER = 20;

/**
 * Fallback when the native tab bar hasn't reported a height yet
 * (provider starts at 0). Apple's visible UITabBar content height.
 */
const TAB_BAR_CONTENT_FALLBACK = 49;

/**
 * Library — Imprint-inspired browse grid.
 *
 * Testament, collection, and layout share a native menu.
 *
 * Search overrides the filter — when the user types, we ignore
 * the active filters and search across the full canon.
 */
type LibraryFilter = "old" | "new";

const COLLECTIONS: { id: string; label: string; categories: BookCategory[] }[] = [
  { id: "all", label: "All books", categories: [] },
  { id: "law", label: "The Law", categories: ["The Law"] },
  { id: "history", label: "History", categories: ["Historical Books", "Acts"] },
  { id: "wisdom", label: "Wisdom & Poetry", categories: ["Wisdom & Poetry"] },
  { id: "prophets", label: "Prophets", categories: ["Major Prophets", "Minor Prophets"] },
  { id: "gospels", label: "Gospels", categories: ["Gospels"] },
  { id: "letters", label: "Letters", categories: ["Pauline Epistles", "General Epistles"] },
  { id: "revelation", label: "Revelation", categories: ["Apocalyptic"] },
];

export default function LibraryScreen() {
  const [introduced, setIntroduced] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    loadJSON<boolean>(STORAGE_KEYS.bibleIntro).then(value => { if (active) setIntroduced(value === true); });
    return () => { active = false; };
  }, []);
  if (introduced === null) return <View style={{ flex: 1, backgroundColor: "#000000" }} />;
  if (!introduced) return <BibleIntroScreen onComplete={() => {
    setIntroduced(true);
    void saveJSON(STORAGE_KEYS.bibleIntro, true);
  }} />;
  return <LibraryEnvironment><BibleLibrary /></LibraryEnvironment>;
}

function BibleLibrary() {
  const router = useRouter();
  const colors = useLibraryColors();
  const [doorReplay, setDoorReplay] = useState(0);
  const canvasRef = useRef<View>(null);
  const openingRef = useRef(false);
  const reducedOpening = useReducedMotion();
  const tabContentStyle = useTabContentFade(reducedOpening);
  useFocusEffect(useCallback(() => { openingRef.current = false; }, []));
  const pickBook = (book: Book, _frame: LibraryBookFrame, targetChapter?: number) => {
    if (openingRef.current) return;
    openingRef.current = true;
    const last = lastVisited?.bookId === book.id ? lastVisited.chapter : 0;
    const chapter = targetChapter ?? (last ? Math.min(book.chapters, last + (hasReadChapter(book.id, last) ? 1 : 0)) : 1);
    // Continue is a quick reader entrance, not the decorative book-detail reveal.
    router.push({ pathname: "/book/[id]/[chapter]", params: { id: book.id, chapter: String(chapter), libraryReader: "1" } });
  };
  const scheme = useResolvedScheme();
  const insets = useSafeAreaInsets();
  // Measured native UITabBar height from react-native-bottom-tabs
  // (onTabBarMeasured). NOT @react-navigation/bottom-tabs — that
  // context is a different React.createContext and throws/returns
  // unrelated values under our native TabView shell.
  const measuredTabBarHeight = useBottomTabBarHeight();
  const focusSpacing = useFocusMiniPlayerSpacing();
  const [libraryMode, setLibraryMode] = useState<"browse" | "guided">("browse");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const viewChanged = useRef(false);
  useEffect(() => {
    let active = true;
    void loadJSON<string>(`${STORAGE_KEYS.bibleLibraryView}.refined`).then(saved => {
      if (active && !viewChanged.current && (saved === "grid" || saved === "list")) setViewMode(saved);
    });
    return () => { active = false; };
  }, []);
  const changeView = (next: "grid" | "list") => {
    viewChanged.current = true;
    setViewMode(next);
    haptics.tick();
    void saveJSON(`${STORAGE_KEYS.bibleLibraryView}.refined`, next);
  };
  const { lastVisited, hasReadChapter } = useProgress();
  const [shelfJump, setShelfJump] = useState(0);
  const [selectedBookId, setSelectedBookId] = useState(() => lastVisited?.bookId ?? "genesis");
  const [collectionId, setCollectionId] = useState("all");
  const [filter, setFilter] = useState<LibraryFilter>(() => BOOKS.find(book => book.id === lastVisited?.bookId)?.testament ?? "old");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSession, setSearchSession] = useState(0);
  const focused = useIsFocused();
  const openSearch = () => { setSearchSession(session => session + 1); setSearchOpen(true); };
  const changeFilter = (next: LibraryFilter) => {
    haptics.tick();
    setLibraryMode("browse");
    setFilter(next);
    setCollectionId("all");
    const first = BOOKS.find(book => book.testament === next);
    if (first) { setSelectedBookId(first.id); setShelfJump(value => value + 1); }
  };


  const { height: screenHeight, fontScale } = useWindowDimensions();
  const shelfView = libraryMode === "browse" && viewMode === "grid";
  const scrollBottomPad = tabContentClearance(measuredTabBarHeight, insets.bottom, focusSpacing);

  const collection = COLLECTIONS.find(item => item.id === collectionId) ?? COLLECTIONS[0];
  const availableCollections = COLLECTIONS.filter(item => item.id === "all" || BOOKS.some(book => book.testament === filter && item.categories.includes(book.category)));
  const filteredBooks = useMemo(() => BOOKS.filter(book => (viewMode === "grid" || book.testament === filter) &&
    (collection.id === "all" || collection.categories.includes(book.category))), [filter, collection, viewMode]);



  // Continue Reading — moved here from the Home screen. Surfaces
  // the user's most recent reader visit so they can pick up exactly
  // where they left off, OR roll naturally into the next chapter
  // if they already finished what they last opened. Hidden when
  // there's nothing fresh to point at (stale > 14 days, or end of
  // book with no next chapter), so the Library doesn't grow a
  // permanent "ghost" hero.
  const shelfDeparture = useSharedValue(0);
  const shelfHeaderStyle = useAnimatedStyle(() => ({ opacity: 1 - shelfDeparture.value, transform: [{ translateY: -12 * shelfDeparture.value }] }));
  const continueReading = useMemo(
    () => computeContinueReading(lastVisited, hasReadChapter),
    [lastVisited, hasReadChapter],
  );

  const hero = libraryMode === "browse" && viewMode === "list" && !!continueReading;
  const heroHeight = Math.round(Math.min(560, screenHeight * .6));
  const roundButton = hero ? "#00000059" : colors.surface, roundInk = hero ? "#FFFFFF" : colors.ink;
  const header = (
    <Animated.View style={[shelfHeaderStyle, { paddingHorizontal: GUTTER, paddingTop: insets.top + contentLayout.screenTop, paddingBottom: itemGap, flexDirection: "row", alignItems: "center", gap: 8 }]}>
      <View style={{ flex: 1 }}>
        <Text accessibilityRole="header" style={{ ...systemText.largeTitle, color: hero ? "#FFFFFF" : colors.ink }}>Library</Text>
        {shelfView && <Text style={{ ...systemText.footnote, color: colors.textSecondary, marginTop: 4 }}>Book {BOOKS.findIndex(book => book.id === selectedBookId) + 1} of {BOOKS.length}</Text>}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Search Bible books" onPress={openSearch} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: roundButton, alignItems: "center", justifyContent: "center" }}><SFSymbol name="magnifyingglass" size={20} weight="semibold" color={roundInk} /></Pressable>
      <SectionHeader compact background={roundButton} ink={roundInk}
        onReplay={() => setDoorReplay(value => value + 1)} title=""
        count={filteredBooks.length} viewMode={viewMode} onChangeView={changeView}
        collectionId={collectionId} collections={viewMode === "grid" ? COLLECTIONS : availableCollections}
        onSelect={id => { haptics.tick(); setCollectionId(id); }} />
    </Animated.View>
  );

  return (
    // Opaque root so the previous tab's snapshot never shows through
    // during native tab swaps. Scroll content still carries its own
    // surface fills; cards and search sit on solid dark chrome.
    <View ref={canvasRef} collapsable={false} style={{ flex: 1, backgroundColor: colors.bg }}>
      {focused && <StatusBar style={hero || scheme === "dark" ? "light" : "dark"} />}
      {shelfView && <LibraryAtmosphere bookId={(filteredBooks.find(book => book.id === selectedBookId) ?? filteredBooks[0])?.id} />}
      <Animated.ScrollView style={[{ flex: 1 }, tabContentStyle]}
        scrollEnabled={!shelfView}
        bounces={!shelfView}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingBottom: scrollBottomPad,
          flexGrow: shelfView ? 1 : undefined,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* Where you left off: the book's painting runs edge to edge behind the title. */}
        {hero && continueReading ? (
          <ContinueReadingHero book={continueReading.book} chapter={continueReading.chapter} height={heroHeight}
            onPress={() => router.push(`/book/${continueReading.book.id}/${continueReading.chapter}`)}>
            {header}
          </ContinueReadingHero>
        ) : header}

        {/* Testament and the reading path, as pill chips. */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: 8, paddingTop: hero ? 4 : 0, paddingBottom: itemGap }}>
          {viewMode === "list" && <>
            <Chip label="Old Testament" selected={libraryMode === "browse" && filter === "old"} onPress={() => changeFilter("old")} />
            <Chip label="New Testament" selected={libraryMode === "browse" && filter === "new"} onPress={() => changeFilter("new")} />
          </>}
          <Chip label="Reading path" icon="map.fill" selected={libraryMode === "guided"} onPress={() => { haptics.tick(); setLibraryMode(mode => mode === "browse" ? "guided" : "browse"); }} />
        </ScrollView>
        {libraryMode === "guided" ? <LibraryGuidedPath onPick={pickBook} /> : <>
        {/* Saved sermons used to live here as a horizontal rail
            but moved to the Profile tab in June 2026 — once a user
            intentionally saves a sermon it stops being browsable
            content and becomes a personal artifact alongside Notes
            and Highlights. Library is now pure discovery:
            Continue Reading → Search → Filters → Books. */}

        {/* ─── Search ─────────────────────────────────────────── */}


        {/* ─── Section header (current filter or search count) ── */}
        {/* ─── Grid ───────────────────────────────────────────── */}
        {filteredBooks.length === 0 ? (
          <EmptyState query="" />
        ) : viewMode === "list" ? (
          <BookList books={filteredBooks} onPick={pickBook} />
        ) : (
          <LibraryShelf availableHeight={screenHeight - insets.top - scrollBottomPad - 144 * Math.max(1, fontScale)} departure={shelfDeparture} key={`${collectionId}:${shelfJump}`} books={filteredBooks} selectedId={selectedBookId} onSelect={book => setSelectedBookId(book.id)} onPick={pickBook} />
        )}
        </>}
      </Animated.ScrollView>
      {/* Fresh input and results before presentation; onShow runs too late to reset them. */}
      {doorReplay > 0 && <LibraryDoors key={doorReplay} replay={doorReplay} />}
      <BibleSearch key={searchSession} visible={searchOpen} onClose={() => setSearchOpen(false)} onPick={book => {
        setSearchOpen(false);
        pickBook(book, {x:0,y:0,width:0,height:0});
      }} />
    </View>
  );
}

function Chip({ label, icon, selected, onPress }: { label: string; icon?: React.ComponentProps<typeof SFSymbol>["name"]; selected: boolean; onPress: () => void }) {
  const colors = useLibraryColors();
  return <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress}
    style={{ height: 40, borderRadius: radius.pill, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: selected ? colors.ink : colors.surface }}>
    {icon && <SFSymbol name={icon} size={15} color={selected ? colors.bg : colors.ink} />}
    <Text style={{ fontSize: 15, lineHeight: 20, fontWeight: "700", color: selected ? colors.bg : colors.ink }}>{label}</Text>
  </Pressable>;
}


// ─────────────────────────────────────────────────────────────────
// Section header — title of the active filter + book count
// ─────────────────────────────────────────────────────────────────

function SectionHeader({
  compact = false, title, background: buttonBackground, ink: buttonInk,
  count,
  onReplay,
  collectionId, collections, onSelect, viewMode, onChangeView,
}: {
  compact?: boolean; title: string;
  background?: string; ink?: string;
  count: number;
  onReplay: () => void;
  viewMode: "grid" | "list";
  onChangeView: (mode: "grid" | "list") => void;
  collectionId: string;
  collections: typeof COLLECTIONS;
  onSelect: (id: string) => void;
}) {
  const scheme = useResolvedScheme();
  const colors = useLibraryColors();
  return (
    <View
      className="flex-row items-center justify-between"
      style={{ paddingHorizontal: compact ? 0 : SCREEN_H_PAD }}
    >
      {!compact && <View style={{ flex: 1, marginRight: 8 }}>
        <ThemedText variant="headline" accessibilityRole="header">{title}</ThemedText>
        {viewMode === "list" && <ThemedText variant="footnote" color="secondary" style={{ marginTop: 4 }}>{collectionId !== "all" ? `${collections.find(item => item.id === collectionId)?.label} · ` : ""}{count} {count === 1 ? "book" : "books"}</ThemedText>}
      </View>}
      <Host colorScheme={scheme} style={{ width: compact ? 44 : 150, height: 44 }}>
        <ContextMenu activationMethod="singlePress">
          <ContextMenu.Trigger>
            {compact ? <NativeButton variant="plain" modifiers={[accessibilityLabel("Library view and filter options")]}>
              <NativeSymbol systemName="line.3.horizontal.decrease" size={21} color={buttonInk ?? colors.ink} modifiers={[frame({ width: 44, height: 44 }), background(buttonBackground ?? colors.surface), clipShape("circle")]} />
            </NativeButton> : <NativeButton variant="bordered" systemImage="line.3.horizontal.decrease" modifiers={[accessibilityLabel("Library view and filter options")]}>Options</NativeButton>}
          </ContextMenu.Trigger>
          <ContextMenu.Items>
            <NativeSection title="Layout">
              <NativeButton systemImage={viewMode === "grid" ? "checkmark" : "square.grid.2x2"} onPress={() => onChangeView("grid")}>Bookshelf</NativeButton>
              <NativeButton systemImage={viewMode === "list" ? "checkmark" : "list.bullet"} onPress={() => onChangeView("list")}>List</NativeButton>
            </NativeSection>
            <NativeSection title="Collection">
              {collections.map(item => <NativeButton key={item.id} systemImage={item.id === collectionId ? "checkmark" : undefined}
                onPress={() => onSelect(item.id)}>{item.label}</NativeButton>)}
            </NativeSection>
            {__DEV__ && <NativeSection title="Preview"><NativeButton systemImage="play" onPress={onReplay}>Replay library entrance</NativeButton></NativeSection>}
          </ContextMenu.Items>
        </ContextMenu>
      </Host>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Book grid — 2-column vertical grid of cover tiles
// ─────────────────────────────────────────────────────────────────

/**
 * Two-column grid (matching Imprint's courses layout). Each tile
 * renders a 3:4 portrait cover plus title and chapter count. We
 * compute the column width from the screen so the grid stays
 * symmetric on every device without hardcoding.
 */
function BookList({ books, onPick }: { books: ReadonlyArray<Book>; onPick: (book: Book, frame: LibraryBookFrame) => void }) {
  const colors = useLibraryColors();
  return <View style={{ marginHorizontal: GUTTER, borderRadius: radius.card, borderCurve: "continuous", overflow: "hidden", backgroundColor: colors.surface }}>
    {books.map((book, index) => <BookListRow key={book.id} book={book} last={index === books.length - 1} onPick={onPick} />)}
  </View>;
}
function BookListRow({ book, last, onPick }: { book: Book; last: boolean; onPick: (book: Book, frame: LibraryBookFrame) => void }) {
  const colors = useLibraryColors(), router = useRouter();
  const open = () => { haptics.soft(); onPick(book, { x: 0, y: 0, width: 0, height: 0 }); };
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginHorizontal: 16, paddingVertical: 16, minHeight: 132, borderBottomWidth: last ? 0 : .5, borderBottomColor: colors.border }}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Read ${book.name}`} onPress={open}><LibraryBookCover book={book} width={54} /></Pressable>
    <View style={{ flex: 1 }}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Read ${book.name}`} onPress={open} style={{flexShrink:1,minHeight:36,justifyContent:"center"}}><Text style={{fontSize:17,lineHeight:25,fontWeight:"700",color:colors.ink}}>{book.name}</Text></Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`About ${book.name}`} onPress={()=>router.push(`/book/${book.id}`)} style={{width:44,height:44,alignItems:"center",justifyContent:"center"}}><SFSymbol name="info.circle" size={17} color={colors.textSecondary}/></Pressable>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`Read ${book.name}`} onPress={open}>
        <Text numberOfLines={2} style={{fontSize:15,lineHeight:22,color:colors.textSecondary}}>{getBookTheme(book.id)}</Text>
        <View style={{marginTop:8}}><BookStatus book={book}/></View>
      </Pressable>
    </View>
  </View>;
}

function BookStatus({ book }: { book: Book }) {
  const { chaptersRead } = useProgress();
  const colors = useLibraryColors();
  const dark = useResolvedScheme() === "dark";
  const completed = new Set(chaptersRead.filter(item => item.bookId === book.id && item.chapter >= 1 && item.chapter <= book.chapters).map(item => item.chapter)).size;
  const finished = completed === book.chapters;
  if (completed === 0) return <ThemedText variant="caption1" color="secondary">{book.chapters} {book.chapters === 1 ? "chapter" : "chapters"}</ThemedText>;
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={finished ? "Completed" : `${completed} of ${book.chapters} chapters read`}
    accessibilityValue={{ min: 0, max: book.chapters, now: completed }}
    style={{ height: 4, maxWidth: 150, borderRadius: 2, overflow: "hidden", backgroundColor: dark ? "#FFFFFF1F" : "#17120E1A" }}>
    <View style={{ height: 4, width: `${Math.max(4, completed / book.chapters * 100)}%`, borderRadius: 2, backgroundColor: finished ? (dark ? "#30D158" : "#248A3D") : colors.ink }} />
  </View>;
}

// ─────────────────────────────────────────────────────────────────
// Search field
// ─────────────────────────────────────────────────────────────────

function BibleSearch({ visible, onClose, onPick }: {
  visible: boolean; onClose: () => void; onPick: (book: Book) => void;
}) {
  const colors = useLibraryColors();
  const scheme = useResolvedScheme();
  const reduced = useReducedMotion();
  const input = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const pendingBook = useRef<Book | null>(null);
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return normalized ? BOOKS.filter(book => book.name.toLowerCase().includes(normalized) || book.abbr.toLowerCase().includes(normalized)) : [];
  }, [query]);
  const close = () => { Keyboard.dismiss(); onClose(); };
  return <Modal visible={visible} animationType={reduced ? "fade" : "slide"} presentationStyle="pageSheet"
    onRequestClose={close} onDismiss={() => {
      onClose();
      const book = pendingBook.current;
      pendingBook.current = null;
      if (book) onPick(book);
    }} onShow={() => input.current?.focus()}>
    <SafeAreaView edges={["top", "bottom"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: 20, paddingBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <View style={[searchStyles.field, { flex: 1, backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SFSymbol name="magnifyingglass" size={20} color={colors.textSecondary} />
          <TextInput ref={input} autoFocus defaultValue="" onChangeText={setQuery} placeholder="Find a book"
            accessibilityLabel="Search Bible books" placeholderTextColor={colors.textSecondary}
            autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing" returnKeyType="search"
            keyboardAppearance={scheme} onSubmitEditing={Keyboard.dismiss}
            style={[searchStyles.text, { color: colors.ink }]} />
        </View>
        <Pressable accessibilityRole="button" onPress={close} style={{ minHeight: 44, justifyContent: "center" }}>
          <ThemedText variant="headline">Cancel</ThemedText>
        </Pressable>
      </View>
      <FlatList data={results} keyExtractor={book => book.id} keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingHorizontal: SCREEN_H_PAD, paddingBottom: 24 }}
        ListHeaderComponent={query.trim() ? <ThemedText variant="footnote" color="secondary" style={{ marginBottom: 12 }}>{results.length} {results.length === 1 ? "book" : "books"}</ThemedText> : null}
        ListEmptyComponent={query.trim() ? <EmptyState query={query} /> : <View style={{ paddingTop: 28, gap: 8 }}>
          <ThemedText variant="title2">Find your next passage</ThemedText>
          <ThemedText variant="callout" color="secondary">Search all 66 books by name, such as Psalms or John.</ThemedText>
        </View>}
        renderItem={({ item }) => <Pressable accessibilityRole="button" accessibilityLabel={`Open ${item.name}`}
          onPress={() => { pendingBook.current = item; close(); }}
          style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ width: 42 }}><BookCover book={item} variant="thumb" /></View>
          <View style={{ flex: 1, gap: 4 }}>
            <ThemedText variant="headline">{item.name}</ThemedText>
            <ThemedText variant="footnote" color="secondary">{item.chapters} {item.chapters === 1 ? "chapter" : "chapters"} · {item.testament === "old" ? "Old Testament" : "New Testament"}</ThemedText>
          </View>
          <SFSymbol name="chevron.right" size={14} color={colors.textSecondary} />
        </Pressable>} />
    </SafeAreaView>
  </Modal>;
}

// ─────────────────────────────────────────────────────────────────
// Empty state — shown when a search yields nothing
// ─────────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  const colors = useLibraryColors();
  return (
    <View className="mt-12 items-center" style={{ paddingHorizontal: 22 }}>
      <View className="w-12 h-12 rounded-2xl bg-surface border border-border items-center justify-center mb-4">
        <SearchIcon size={18} stroke={colors.inkSubtle} />
      </View>
      <ThemedText variant="callout" style={{ fontWeight: "700" }}>
        No books match
      </ThemedText>
      <ThemedText
        variant="footnote"
        color="muted"
        style={{ marginTop: 6, textAlign: "center" }}
      >
        {query
          ? `Nothing in the canon contains "${query}".`
          : "Try a different search."}
      </ThemedText>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Continue Reading hero — moved here from the Home screen
// ─────────────────────────────────────────────────────────────────

/**
 * Where you left off: the book's painting edge to edge, running up behind
 * the status bar and the title, and fading into the page under the button.
 * Shown only while the reader has a fresh visit (see computeContinueReading).
 */
function ContinueReadingHero({ book, chapter, height, onPress, children }: {
  book: Book; chapter: number; height: number; onPress: () => void; children: React.ReactNode;
}) {
  const colors = useLibraryColors();
  const { chaptersRead } = useProgress();
  const read = new Set(chaptersRead.filter(item => item.bookId === book.id && item.chapter >= 1 && item.chapter <= book.chapters).map(item => item.chapter)).size;
  const art = getBookCover(book.id);
  return <View style={{ minHeight: height, backgroundColor: "#1C1012" }}>
    <BookReaderPreparation bookId={book.id} chapter={chapter} />
    {art != null && <Image source={art} contentFit="cover" transition={0} style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors />}
    <ReaderMaterialGradient pointerEvents="none" colors={["#00000080", "#00000000", "#00000000", "#00000080", "#000000A6", "#000000A6", colors.bg]} locations={[0, .24, .42, .64, .8, .9, 1]} style={StyleSheet.absoluteFill} />
    {children}
    <View style={{ flex: 1, justifyContent: "flex-end", paddingHorizontal: GUTTER, paddingBottom: 44, gap: 4 }}>
      <Text style={{ fontSize: 12, lineHeight: 15, fontWeight: "800", letterSpacing: 1.1, color: "#FFFFFFCC" }}>WHERE YOU LEFT OFF</Text>
      <Text accessibilityRole="header" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={.7} style={{ ...systemText.largeTitle, fontSize: 36, lineHeight: 40, color: "#FFFFFF", textShadowColor: "#00000070", textShadowRadius: 14, textShadowOffset: { width: 0, height: 2 } }}>{book.name}</Text>
      <Text style={{ fontSize: 15, lineHeight: 20, fontWeight: "700", color: "#FFFFFFD9" }}>Chapter {chapter} of {book.chapters}{read > 0 ? ` · ${read} read` : ""}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Keep reading ${book.name}, chapter ${chapter}`} onPress={() => { haptics.soft(); onPress(); }}
        style={{ marginTop: 12, height: 56, borderRadius: radius.pill, backgroundColor: "#FFFFFF", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <Text style={{ fontSize: 17, lineHeight: 22, fontWeight: "700", color: "#17120E" }}>Keep reading</Text>
        <SFSymbol name="arrow.right" size={16} weight="bold" color="#17120E" />
      </Pressable>
    </View>
  </View>;
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

function SearchIcon({
  size = 16,
  stroke,
}: {
  size?: number;
  stroke: string;
}) {
  return (
    <SFSymbol
      name="magnifyingglass"
      size={size}
      color={stroke}
      weight="semibold"
    />
  );
}

// ClearIcon — REMOVED. The SearchField above now uses
// React Native's `clearButtonMode="while-editing"` prop, which
// renders UIKit's stock grey-circle X inside the search field
// while the user is typing. Same affordance Apple ships in
// Settings, Mail, Messages — we no longer need to maintain a
// custom SVG clear glyph.
