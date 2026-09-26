import { captureRef } from "react-native-view-shot";
import { prepareLibraryOpening } from "@/lib/libraryOpening";
import { LibraryAtmosphere } from "@/components/LibraryAtmosphere";
import { LibraryEnvironment } from "@/components/LibraryEnvironment";
import { LibraryBook, LibraryBookcase, LibraryLamp, type LibraryBookFrame } from "@/components/LibraryBookcase";
import { LibraryDoors } from "@/components/LibraryDoors";
import { systemText } from "@/lib/typography";
import { Host, ContextMenu, Section as NativeSection, Button as NativeButton } from "@expo/ui/swift-ui";
import { accessibilityLabel } from "@expo/ui/swift-ui/modifiers";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { BookReaderPreparation } from "@/app/book/[id]/[chapter]";
import { BibleIntroScreen } from "@/components/BibleIntroScreen";
import { loadJSON, saveJSON, STORAGE_KEYS } from "@/lib/storage";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  Modal,
  TextInput,
  FlatList,
  Keyboard,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useBottomTabBarHeight } from "react-native-bottom-tabs";
import { SFSymbol } from "@/components/Symbol";
import { BookCover } from "@/components/BookCover";
import { ThemedText } from "@/components/ThemedText";
import { type Book, type BookCategory, BOOKS } from "@/constants/books";
import { minTouchTarget, spacing } from "@/constants/spacing";
import * as haptics from "@/lib/haptics";
import { computeContinueReading } from "@/lib/continueReading";
import { SCREEN_H_PAD } from "@/lib/layout";
import { useProgress } from "@/state/progress";
import { useColors, useResolvedScheme } from "@/state/theme";

/**
 * Fallback when the native tab bar hasn't reported a height yet
 * (provider starts at 0). Apple's visible UITabBar content height.
 */
const TAB_BAR_CONTENT_FALLBACK = 49;

/**
 * Library — Imprint-inspired browse grid.
 *
 * Filter axis is just the two testaments (Old / New) via a native
 * UISegmentedControl — short fixed option set.
 *
 * Search overrides the filter — when the user types, we ignore
 * the active segment and search across the full canon.
 */
type LibraryFilter = "old" | "new";

const FILTER_SEGMENTS = ["Old Testament", "New Testament"] as const;

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

const COLLECTION_DESCRIPTIONS: Record<string, string> = {
  law: "Beginnings, covenant, and the foundations of faith.",
  history: "The people and events that shaped the biblical story.",
  wisdom: "Poetry, prayer, and wisdom for everyday life.",
  prophets: "Calls to justice, faithfulness, and hope.",
  gospels: "The life, teachings, death, and resurrection of Jesus.",
  letters: "Encouragement and guidance for a life of faith.",
  revelation: "A vision of hope and God’s final renewal.",
};

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
  const colors = useColors();
  const [doorReplay, setDoorReplay] = useState(0);
  const canvasRef = useRef<View>(null);
  const openingRef = useRef(false);
  const reducedOpening = useReducedMotion();
  const pickBook = async (book: Book, frame: LibraryBookFrame) => {
    if (openingRef.current) return;
    openingRef.current = true;
    try {
      if (!reducedOpening) {
        let snapshot: string | undefined;
        try { snapshot = await captureRef(canvasRef, { format: "jpg", quality: .85, result: "tmpfile" }); } catch { /* Warm canvas fallback if snapshot is unavailable. */ }
        prepareLibraryOpening({ bookId: book.id, source: frame, snapshot });
      }
      router.push({ pathname: "/book/[id]", params: { id: book.id, libraryOpening: "1" } });
    } finally { openingRef.current = false; }
  };
  const scheme = useResolvedScheme();
  const insets = useSafeAreaInsets();
  // Measured native UITabBar height from react-native-bottom-tabs
  // (onTabBarMeasured). NOT @react-navigation/bottom-tabs — that
  // context is a different React.createContext and throws/returns
  // unrelated values under our native TabView shell.
  const measuredTabBarHeight = useBottomTabBarHeight();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const viewChanged = useRef(false);
  useEffect(() => {
    let active = true;
    void loadJSON<string>(STORAGE_KEYS.bibleLibraryView).then(saved => {
      if (active && !viewChanged.current && (saved === "grid" || saved === "list")) setViewMode(saved);
    });
    return () => { active = false; };
  }, []);
  const changeView = (next: "grid" | "list") => {
    viewChanged.current = true;
    setViewMode(next);
    haptics.tick();
    void saveJSON(STORAGE_KEYS.bibleLibraryView, next);
  };
  const [collectionId, setCollectionId] = useState("all");
  const [filter, setFilter] = useState<LibraryFilter>("old");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchSession, setSearchSession] = useState(0);
  const { lastVisited, hasReadChapter } = useProgress();

  const filterIndex = filter === "old" ? 0 : 1;

  // Native scenes ignoreSafeArea under the floating Liquid Glass
  // bar, so scroll content must clear the measured bar height.
  // Measured frame ≥70 already includes the home-indicator band
  // (runtime on iPhone 17 Pro Max: bar=83); shorter reports are
  // content-only and need insets.bottom added.
  const tabClearance =
    measuredTabBarHeight > 0
      ? measuredTabBarHeight >= 70
        ? measuredTabBarHeight
        : measuredTabBarHeight + insets.bottom
      : TAB_BAR_CONTENT_FALLBACK + insets.bottom;
  const scrollBottomPad = tabClearance + spacing[24];

  const collection = COLLECTIONS.find(item => item.id === collectionId) ?? COLLECTIONS[0];
  const availableCollections = COLLECTIONS.filter(item => item.id === "all" || BOOKS.some(book => book.testament === filter && item.categories.includes(book.category)));
  const filteredBooks = useMemo(() => BOOKS.filter(book => book.testament === filter &&
    (collection.id === "all" || collection.categories.includes(book.category))), [filter, collection]);

  // Continue Reading — moved here from the Home screen. Surfaces
  // the user's most recent reader visit so they can pick up exactly
  // where they left off, OR roll naturally into the next chapter
  // if they already finished what they last opened. Hidden when
  // there's nothing fresh to point at (stale > 14 days, or end of
  // book with no next chapter), so the Library doesn't grow a
  // permanent "ghost" hero.
  const continueReading = useMemo(
    () => computeContinueReading(lastVisited, hasReadChapter),
    [lastVisited, hasReadChapter],
  );

  return (
    // Opaque root so the previous tab's snapshot never shows through
    // during native tab swaps. Scroll content still carries its own
    // surface fills; cards and search sit on solid dark chrome.
    <SafeAreaView ref={canvasRef} collapsable={false} className="flex-1" style={{ backgroundColor: colors.bg }} edges={["top"]}>
      <LibraryAtmosphere />
      <ScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{
          paddingBottom: scrollBottomPad,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* ─── Page title ──────────────────────────────────────────
            Apple Large Title via ThemedText variant="largeTitle"
            (34pt Bold). Matches Home / Profile tab anchors. */}

        <View style={{ paddingHorizontal: SCREEN_H_PAD, paddingTop: 22, minHeight: 152, flexDirection: "row", justifyContent: "space-between" }}>
          <View style={{ flex: 1, paddingRight: 12, gap: 8 }}><ThemedText variant="largeTitle" accessibilityRole="header">The Library</ThemedText><ThemedText variant="subheadline" color="secondary">Sixty-six books, one story.</ThemedText><Pressable onPress={() => { setSearchSession(session => session + 1); setSearchOpen(true); }} accessibilityRole="button" accessibilityLabel="Search Bible books" style={{ alignSelf: "flex-start", minHeight: 44, flexDirection: "row", alignItems: "center", gap: 7 }}><SFSymbol name="magnifyingglass" size={17} color={colors.ink} /><ThemedText variant="subheadline">Find a book</ThemedText></Pressable></View>
          <LibraryLamp />
        </View>

        {/* ─── Continue Reading hero (conditional) ────────────────
            Sits between the title and search so the user lands on
            either "what I was just reading" or "what's available
            to read" — never both fighting for the first scroll. */}
        {continueReading && (
            <View style={{ paddingHorizontal: SCREEN_H_PAD }}>
              <ContinueReadingHero
                onPick={pickBook}
                book={continueReading.book}
                chapter={continueReading.chapter}
                onPress={() =>
                  router.push(
                    `/book/${continueReading.book.id}/${continueReading.chapter}`,
                  )
                }
              />
            </View>

        )}

        {/* Saved sermons used to live here as a horizontal rail
            but moved to the Profile tab in June 2026 — once a user
            intentionally saves a sermon it stops being browsable
            content and becomes a personal artifact alongside Notes
            and Highlights. Library is now pure discovery:
            Continue Reading → Search → Filters → Books. */}

        {/* ─── Search ─────────────────────────────────────────── */}


        {/* ─── Testament segmented control ────────────────────── */}
        <View
          style={{
            paddingHorizontal: SCREEN_H_PAD,
            paddingTop: spacing[16],
            paddingBottom: spacing[8],
            minHeight: minTouchTarget,
            justifyContent: "center",
          }}
        >
          {/* Native UISegmentedControl — leave label/pill colors to
              the system so selected vs. unselected meet OS contrast
              (don't override with theme grays that fight HIG). */}
          <SegmentedControl
            appearance={scheme}
            values={[...FILTER_SEGMENTS]}
            selectedIndex={filterIndex}
            onChange={(event) => {
              const nextIndex = event.nativeEvent.selectedSegmentIndex;
              haptics.tick();
              setFilter(nextIndex === 1 ? "new" : "old");
              setCollectionId("all");
            }}
            style={{ height: 36 }}
          />
        </View>

        {/* ─── Section header (current filter or search count) ── */}
        <SectionHeader
          onReplay={() => setDoorReplay(value => value + 1)}
          title={collectionId === "all" ? "The books" : collection.label}
          count={filteredBooks.length}
          viewMode={viewMode}
          onChangeView={changeView}
          collectionId={collectionId}
          collections={availableCollections}
          onSelect={id => { haptics.tick(); setCollectionId(id); }}
        />

        {COLLECTION_DESCRIPTIONS[collectionId] && <ThemedText variant="subheadline" color="secondary"
          style={{ paddingHorizontal: SCREEN_H_PAD, marginBottom: 16 }}>{COLLECTION_DESCRIPTIONS[collectionId]}</ThemedText>}

        {/* ─── Grid ───────────────────────────────────────────── */}
        {filteredBooks.length === 0 ? (
          <EmptyState query="" />
        ) : viewMode === "list" ? (
          <BookList books={filteredBooks} onPick={book => router.push(`/book/${book.id}`)} />
        ) : (
          <LibraryBookcase books={filteredBooks} onPick={pickBook} />
        )}
      </ScrollView>
      {/* Fresh input and results before presentation; onShow runs too late to reset them. */}
      <LibraryDoors replay={doorReplay} />
      <BibleSearch key={searchSession} visible={searchOpen} onClose={() => setSearchOpen(false)} onPick={book => {
        setSearchOpen(false);
        router.push(`/book/${book.id}`);
      }} />
    </SafeAreaView>
  );
}


// ─────────────────────────────────────────────────────────────────
// Section header — title of the active filter + book count
// ─────────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  onReplay,
  collectionId, collections, onSelect, viewMode, onChangeView,
}: {
  title: string;
  count: number;
  onReplay: () => void;
  viewMode: "grid" | "list";
  onChangeView: (mode: "grid" | "list") => void;
  collectionId: string;
  collections: typeof COLLECTIONS;
  onSelect: (id: string) => void;
}) {
  const scheme = useResolvedScheme();
  const colors = useColors();
  return (
    <View
      className="mt-4 mb-4 flex-row items-center justify-between"
      style={{ paddingHorizontal: SCREEN_H_PAD }}
    >
      <View style={{ flex: 1, marginRight: 8 }}>
        <ThemedText variant="title2" accessibilityRole="header">{title}</ThemedText>
        <ThemedText variant="footnote" color="secondary" style={{ marginTop: 4 }}>{count} {count === 1 ? "book" : "books"}</ThemedText>
      </View>
      <Host colorScheme={scheme} style={{ width: 112, height: 44 }}>
        <ContextMenu activationMethod="singlePress">
          <ContextMenu.Trigger>
            <NativeButton variant="bordered" systemImage="line.3.horizontal.decrease" modifiers={[accessibilityLabel("Library view options")]}>View</NativeButton>
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
function BookList({ books, onPick }: { books: ReadonlyArray<Book>; onPick: (book: Book) => void }) {
  const colors = useColors();
  return <View style={{ marginHorizontal: SCREEN_H_PAD, borderRadius: 20, borderCurve: "continuous", overflow: "hidden", backgroundColor: colors.surface }}>
    {books.map((book, index) => <Pressable key={book.id} accessibilityRole="button" accessibilityLabel={`Open ${book.name}`}
      onPress={() => onPick(book)} style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 14,
        borderBottomWidth: index < books.length - 1 ? 1 : 0, borderBottomColor: colors.border }}>
      <View style={{ width: 42 }}><BookCover book={book} variant="thumb" /></View>
      <View style={{ flex: 1, gap: 5 }}>
        <ThemedText variant="headline">{book.name}</ThemedText>
        <BookStatus book={book} />
      </View>
      <SFSymbol name="chevron.right" size={14} color={colors.textSecondary} />
    </Pressable>)}
  </View>;
}

function BookStatus({ book }: { book: Book }) {
  const { chaptersRead } = useProgress();
  const dark = useResolvedScheme() === "dark";
  const completed = new Set(chaptersRead.filter(item => item.bookId === book.id && item.chapter >= 1 && item.chapter <= book.chapters).map(item => item.chapter)).size;
  const finished = completed === book.chapters;
  return <View style={{ flexDirection: "row", gap: 5, alignItems: "center" }}>
    {finished && <SFSymbol name="checkmark.circle.fill" size={14} color={dark ? "#30D158" : "#248A3D"} />}
    <ThemedText variant="caption1" color="secondary" style={{ flexShrink: 1 }}>
      {finished ? "Completed" : completed > 0 ? `${completed} of ${book.chapters} chapters read` : `${book.chapters} ${book.chapters === 1 ? "chapter" : "chapters"}`}
    </ThemedText>
  </View>;
}

// ─────────────────────────────────────────────────────────────────
// Search field
// ─────────────────────────────────────────────────────────────────

function BibleSearch({ visible, onClose, onPick }: {
  visible: boolean; onClose: () => void; onPick: (book: Book) => void;
}) {
  const colors = useColors();
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
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12,
          minHeight: 48, borderRadius: 14, borderCurve: "continuous", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong }}>
          <SFSymbol name="magnifyingglass" size={18} color={colors.textSecondary} />
          <TextInput ref={input} autoFocus defaultValue="" onChangeText={setQuery} placeholder="Find a book"
            accessibilityLabel="Search Bible books" placeholderTextColor={colors.textSecondary}
            autoCorrect={false} autoCapitalize="none" clearButtonMode="while-editing" returnKeyType="search"
            keyboardAppearance={scheme} onSubmitEditing={Keyboard.dismiss}
            style={{ flex: 1, minHeight: 46, fontFamily: "System", fontSize: 17, color: colors.ink }} />
        </View>
        <Pressable accessibilityRole="button" onPress={close} style={{ minHeight: 44, justifyContent: "center" }}>
          <ThemedText variant="headline">Cancel</ThemedText>
        </Pressable>
      </View>
      <FlatList data={results} keyExtractor={book => book.id} keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag" automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
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
  const colors = useColors();
  return (
    <View className="mt-12 items-center" style={{ paddingHorizontal: SCREEN_H_PAD }}>
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
 * Compact "pick up where you left off" hero. A small portrait
 * cover on the left, the chapter reference + a kind hint line on
 * the right, plus a chevron. Sits at the very top of the Library
 * tab when the user has a fresh recent visit — replaces the home
 * screen's old ContinueReadingCard now that Home is sermon + feel
 * + activity only.
 *
 * Three states the consumer should know about:
 *   • visited chapter unread       → "Pick up where you left off"
 *   • visited chapter read, has +1 → "You finished <book> <ch>"
 *   • too old / end-of-book        → consumer hides the hero
 *
 * Display is identical for the first two states (the hint string
 * carries the difference), so this component stays dumb.
 */
function ContinueReadingHero({ book, chapter, onPress, onPick }: {
  book: Book; chapter: number; onPress: () => void;
  onPick: (book: Book, frame: LibraryBookFrame) => void;
}) {
  const colors = useColors();
  const { chaptersRead } = useProgress();
  const read = new Set(chaptersRead.filter(item => item.bookId === book.id && item.chapter >= 1 && item.chapter <= book.chapters).map(item => item.chapter)).size;
  return <View style={{ flexDirection: "row", alignItems: "center", gap: 22, paddingTop: 16, paddingBottom: 28 }}>
    <BookReaderPreparation bookId={book.id} chapter={chapter} />
    <View><LibraryBook book={book} width={110} onPick={onPick} /><View pointerEvents="none" style={{ position: "absolute", bottom: -17, right: 22, width: 12, height: 30, backgroundColor: "#FF5A36" }}><View style={{ position: "absolute", bottom: -1, left: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 7, borderLeftColor: "transparent", borderRightColor: "transparent", borderBottomColor: colors.bg }} /></View></View>
    <View style={{ flex: 1, gap: 6 }}><Text style={{ ...systemText.footnote, color: colors.inkMuted }}>Where you left off</Text><ThemedText variant="title2" numberOfLines={2}>{book.name}</ThemedText><ThemedText variant="subheadline" color="secondary">Chapter {chapter} of {book.chapters}</ThemedText><Text style={{ ...systemText.caption1, color: colors.inkMuted }}>{read} chapters read</Text><Pressable accessibilityRole="button" accessibilityLabel={`Keep reading ${book.name}, chapter ${chapter}`} onPress={onPress} style={{ alignSelf: "flex-start", minHeight: 46, paddingHorizontal: 18, marginTop: 8, borderRadius: 14, borderBottomLeftRadius: 4, backgroundColor: "#FF5A36", justifyContent: "center" }}><Text style={{ ...systemText.headline, color: "#24160E" }}>Keep reading</Text></Pressable></View>
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
