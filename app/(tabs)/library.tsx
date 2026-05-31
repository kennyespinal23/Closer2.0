import { useMemo, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { BookCover } from "@/components/BookCover";
import { FadeIn } from "@/components/FadeIn";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import { colors } from "@/constants/theme";
import {
  type Book,
  BOOKS,
  filterBooks,
  findBookById,
  groupByCategory,
  type Testament,
} from "@/constants/books";
import { hasBookCover } from "@/constants/bookCovers";
import { useProgress } from "@/state/progress";

/**
 * Library — Apple Books-style browse surface for the canon.
 *
 * Two modes:
 *
 *   1. Browse (no search query)
 *      • Continue Reading hero — pulled from progress.lastVisited
 *        when present. Big cover, picks up at the last chapter.
 *      • Illustrated Editions rail — books with hand-painted art
 *        (currently Job; grows as we ship more covers).
 *      • Testament switcher (Old / New) — pill with a sliding
 *        bubble. Drives the rails below.
 *      • Per-category rails — one per BookCategory in the active
 *        testament. Each rail is a horizontal scroller of portrait
 *        3:4 cover tiles, with the book's name + chapter count
 *        beneath. Reads like flipping through a shelf.
 *
 *   2. Search (query present)
 *      • Hides hero + rails entirely.
 *      • Shows a flat grid of matching covers across BOTH
 *        testaments — when the user knows what they want, the
 *        testament filter is friction, not help.
 *
 * The grid uses portrait 3:4 covers throughout (matching Apple
 * Books' Library tab) — `BookCover` already handles real art vs.
 * the gradient placeholder per book.
 */
export default function LibraryScreen() {
  const router = useRouter();
  const [testament, setTestament] = useState<Testament>("old");
  const [query, setQuery] = useState("");
  const { lastVisited } = useProgress();

  // Browse data — only computed when the user isn't searching.
  const groups = useMemo(
    () => groupByCategory(filterBooks(testament, ""), testament),
    [testament],
  );

  // Search data — flat list across both testaments.
  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return BOOKS.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.abbr.toLowerCase().includes(q),
    );
  }, [query]);

  const isSearching = query.trim().length > 0;

  // Illustrated rail — every book that has a hand-painted cover.
  // As the catalog of art grows this rail automatically grows with it.
  const illustrated = useMemo(
    () => BOOKS.filter((b) => hasBookCover(b.id)),
    [],
  );

  // Continue reading — resolve the lastVisited id back to a Book so
  // we can render its cover/name without coupling the hero to the
  // shape of the progress state.
  const continueBook = lastVisited ? findBookById(lastVisited.bookId) : null;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Header ─────────────────────────────────────────── */}
        <FadeIn delayMs={0} durationMs={700}>
          <View className="px-6 pt-2">
            <Text
              className="text-ink-subtle text-[11px] uppercase tracking-[2.5px]"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Library
            </Text>
            <Text
              className="text-ink text-[34px] leading-[40px] tracking-[-0.6px] mt-1.5"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              The Word
            </Text>
            <Text
              className="text-ink-muted text-[14px] leading-[20px] mt-2"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Sixty-six books. One quiet, unbroken story.
            </Text>
          </View>
        </FadeIn>

        {/* ─── Search ─────────────────────────────────────────── */}
        <SearchField value={query} onChangeText={setQuery} />

        {isSearching ? (
          /* ─── Search results ─── */
          <SearchResults
            results={searchResults}
            query={query}
            onPick={(b) => router.push(`/book/${b.id}`)}
          />
        ) : (
          <>
            {/* ─── Continue Reading hero ────────────────────── */}
            {continueBook && lastVisited && (
              <FadeIn delayMs={150} durationMs={900}>
                <ContinueReadingHero
                  book={continueBook}
                  chapter={lastVisited.chapter}
                  visitedAt={lastVisited.visitedAt}
                  onPress={() =>
                    router.push(
                      `/book/${continueBook.id}/${lastVisited.chapter}` as never,
                    )
                  }
                />
              </FadeIn>
            )}

            {/* ─── Illustrated rail ─────────────────────────── */}
            {illustrated.length > 0 && (
              <FadeIn delayMs={250} durationMs={900}>
                <IllustratedRail
                  books={illustrated}
                  onPick={(b) => router.push(`/book/${b.id}`)}
                />
              </FadeIn>
            )}

            {/* ─── Testament switcher ──────────────────────── */}
            <FadeIn delayMs={350} durationMs={900}>
              <TestamentSegments value={testament} onChange={setTestament} />
            </FadeIn>

            {/* ─── Per-category rails ──────────────────────── */}
            {groups.map(({ category, books }, idx) => (
              <FadeIn
                key={category}
                delayMs={450 + idx * 60}
                durationMs={900}
              >
                <CategoryRail
                  title={category}
                  books={books}
                  onPick={(b) => router.push(`/book/${b.id}`)}
                />
              </FadeIn>
            ))}

            <FadeIn delayMs={800} durationMs={900}>
              <View className="px-6 mt-12">
                <Text
                  className="text-ink-muted text-[12.5px] leading-[19px] text-center"
                  style={{ fontFamily: "PlusJakartaSans_400Regular" }}
                >
                  Every chapter is a doorway.{"\n"}Walk through one tonight.
                </Text>
              </View>
            </FadeIn>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Continue Reading hero — the "Reading Now" anchor of the page
// ─────────────────────────────────────────────────────────────────

/**
 * Large cover + chapter info + CTA. Mirrors Apple Books' "Reading
 * Now" hero — when the user has an in-progress book the app's first
 * job is to make resuming it one tap away.
 *
 * Hits the chapter route directly (not the book overview) so a tap
 * really IS resuming, not navigating-then-navigating.
 */
function ContinueReadingHero({
  book,
  chapter,
  visitedAt,
  onPress,
}: {
  book: Book;
  chapter: number;
  visitedAt: number;
  onPress: () => void;
}) {
  const { width: screenWidth } = useWindowDimensions();
  // Cover is bounded so the hero never dominates the screen — the
  // rails beneath need to peek so the user understands the page
  // keeps going.
  const COVER_W = Math.min(110, Math.round(screenWidth * 0.28));
  const COVER_H = Math.round((COVER_W * 4) / 3); // 3:4 portrait

  return (
    <View className="px-6 mt-7">
      <Text
        className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase mb-3 ml-1"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        Continue Reading
      </Text>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      >
        <View className="rounded-3xl border border-border bg-surface p-5 flex-row">
          <View style={{ width: COVER_W, height: COVER_H }}>
            <BookCover book={book} variant="card" />
          </View>
          <View className="flex-1 ml-5 justify-between py-1">
            <View>
              <Text
                className="text-ink-subtle text-[10.5px] tracking-[2px] uppercase"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                {book.category}
              </Text>
              <Text
                className="text-ink text-[20px] leading-[24px] tracking-[-0.3px] mt-1.5"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                numberOfLines={1}
              >
                {book.name}
              </Text>
              <Text
                className="text-ink-muted text-[13px] mt-1"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                numberOfLines={1}
              >
                Picking up at chapter {chapter}
              </Text>
            </View>
            <View className="flex-row items-center mt-3">
              <Text
                className="text-primary text-[12.5px] mr-1.5"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                Open chapter
              </Text>
              <PlayChevronIcon />
              <Text
                className="text-ink-subtle text-[11px] ml-auto"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                {relativeMoment(visitedAt)}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Illustrated rail — books that ship with hand-painted covers
// ─────────────────────────────────────────────────────────────────

/**
 * Apple Books "Featured" rail equivalent — but tuned to OUR
 * library, where the bespoke covers are the marketing. Books with
 * real art get a bigger treatment than the catalog rails below
 * (they're literally the point of the curated shelf).
 */
function IllustratedRail({
  books,
  onPick,
}: {
  books: ReadonlyArray<Book>;
  onPick: (b: Book) => void;
}) {
  return (
    <View className="mt-9">
      <View className="px-6 mb-3">
        <View className="flex-row items-baseline justify-between">
          <Text
            className="text-ink text-[18px] tracking-[-0.2px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            Illustrated Editions
          </Text>
          <Text
            className="text-ink-subtle text-[11px] tracking-[2px] uppercase"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {books.length}
          </Text>
        </View>
        <Text
          className="text-ink-muted text-[12.5px] mt-1"
          style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        >
          Books with covers painted just for Closer.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingRight: 24,
        }}
      >
        {books.map((book, i) => (
          <View
            key={book.id}
            style={{ marginRight: i === books.length - 1 ? 0 : 14 }}
          >
            <BookTile book={book} size="lg" onPress={() => onPick(book)} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Category rail — one rail per category in the active testament
// ─────────────────────────────────────────────────────────────────

function CategoryRail({
  title,
  books,
  onPick,
}: {
  title: string;
  books: ReadonlyArray<Book>;
  onPick: (b: Book) => void;
}) {
  return (
    <View className="mt-9">
      <View className="px-6 mb-3 flex-row items-baseline justify-between">
        <Text
          className="text-ink text-[17px] tracking-[-0.2px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {title}
        </Text>
        <Text
          className="text-ink-subtle text-[11px] tracking-[2px] uppercase"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {books.length} {books.length === 1 ? "book" : "books"}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingRight: 24 }}
      >
        {books.map((book, i) => (
          <View
            key={book.id}
            style={{ marginRight: i === books.length - 1 ? 0 : 12 }}
          >
            <BookTile book={book} size="md" onPress={() => onPick(book)} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Book tile — the unit of the rails
// ─────────────────────────────────────────────────────────────────

/**
 * A single tappable book cover with its name + chapter count below.
 * Two sizes:
 *   • md (96pt)  — used in category rails (3+ visible at once)
 *   • lg (136pt) — used in the Illustrated rail (~2.5 visible)
 *
 * Covers always render at 3:4 portrait via the shared `BookCover`
 * component, so a real cover sits next to a placeholder seamlessly.
 */
function BookTile({
  book,
  size,
  onPress,
}: {
  book: Book;
  size: "md" | "lg";
  onPress: () => void;
}) {
  const WIDTH = size === "lg" ? 136 : 96;
  const HEIGHT = Math.round((WIDTH * 4) / 3);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
    >
      <View style={{ width: WIDTH }}>
        <View style={{ width: WIDTH, height: HEIGHT }}>
          <BookCover book={book} variant={size === "lg" ? "card" : "thumb"} />
        </View>
        <Text
          className="text-ink text-[12.5px] mt-2"
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            letterSpacing: -0.1,
          }}
          numberOfLines={1}
        >
          {book.name}
        </Text>
        <Text
          className="text-ink-subtle text-[10.5px] mt-0.5"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          numberOfLines={1}
        >
          {book.chapters} {book.chapters === 1 ? "chapter" : "chapters"}
        </Text>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Search field
// ─────────────────────────────────────────────────────────────────

function SearchField({
  value,
  onChangeText,
}: {
  value: string;
  onChangeText: (next: string) => void;
}) {
  return (
    <View className="mx-5 mt-6 flex-row items-center bg-surface border border-border rounded-2xl px-4 py-3">
      <SearchIcon />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Find a book"
        placeholderTextColor={colors.inkSubtle}
        className="flex-1 ml-2.5 text-ink"
        style={{
          fontFamily: "PlusJakartaSans_500Medium",
          fontSize: 15,
          paddingVertical: 0,
        }}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText("")} hitSlop={10}>
          <ClearIcon />
        </Pressable>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Search results — a 3-column grid of matching covers
// ─────────────────────────────────────────────────────────────────

/**
 * When the user has a search query, hide the curated browse layout
 * and render a flat grid. Apple Books does the same — search is a
 * different mode, not a filter over the browse view.
 *
 * Grid is 3 columns of 3:4 portrait covers with names beneath.
 */
function SearchResults({
  results,
  query,
  onPick,
}: {
  results: ReadonlyArray<Book>;
  query: string;
  onPick: (b: Book) => void;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const COLS = 3;
  const SIDE = 24;
  const GAP = 14;
  const colWidth = Math.floor(
    (screenWidth - SIDE * 2 - GAP * (COLS - 1)) / COLS,
  );

  if (results.length === 0) {
    return <EmptyState query={query} />;
  }

  return (
    <View className="mt-7 px-6">
      <Text
        className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase mb-3 ml-1"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {results.length} {results.length === 1 ? "match" : "matches"}
      </Text>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          marginHorizontal: -GAP / 2,
        }}
      >
        {results.map((book) => (
          <View
            key={book.id}
            style={{
              width: colWidth,
              marginHorizontal: GAP / 2,
              marginBottom: 18,
            }}
          >
            <BookTile book={book} size="md" onPress={() => onPick(book)} />
          </View>
        ))}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Testament segmented control — sliding bubble, two slots
// ─────────────────────────────────────────────────────────────────

function TestamentSegments({
  value,
  onChange,
}: {
  value: Testament;
  onChange: (next: Testament) => void;
}) {
  const [trackWidth, setTrackWidth] = useState(0);
  const slotWidth = trackWidth / 2;
  const bubbleX = useMemo(() => new Animated.Value(0), []);

  const handle = (next: Testament) => {
    if (next === value) return;
    onChange(next);
    Animated.spring(bubbleX, {
      toValue: next === "old" ? 0 : slotWidth,
      useNativeDriver: true,
      tension: 100,
      friction: 14,
    }).start();
  };

  return (
    <View
      className="mx-5 mt-9 rounded-2xl border border-border bg-surface p-1"
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width - 8;
        setTrackWidth(w);
        bubbleX.setValue(value === "old" ? 0 : w / 2);
      }}
    >
      <View style={{ position: "relative", height: 38 }}>
        {slotWidth > 0 && (
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: slotWidth,
              height: 38,
              backgroundColor: colors.accentSoft,
              borderRadius: 12,
              transform: [{ translateX: bubbleX }],
            }}
          />
        )}
        <View style={{ flexDirection: "row" }}>
          <Segment
            label="Old Testament"
            active={value === "old"}
            onPress={() => handle("old")}
          />
          <Segment
            label="New Testament"
            active={value === "new"}
            onPress={() => handle("new")}
          />
        </View>
      </View>
    </View>
  );
}

function Segment({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <View
        style={{
          height: 38,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "PlusJakartaSans_600SemiBold",
            fontSize: 13,
            color: active ? colors.ink : colors.inkMuted,
            letterSpacing: 0.1,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Empty state for searches that match nothing
// ─────────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  return (
    <View className="px-6 mt-16 items-center">
      <View className="w-12 h-12 rounded-2xl bg-surface border border-border items-center justify-center mb-4">
        <SearchIcon size={18} />
      </View>
      <Text
        className="text-ink text-[16px]"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        No books match
      </Text>
      <Text
        className="text-ink-muted text-[13px] mt-1.5 text-center"
        style={{ fontFamily: "PlusJakartaSans_400Regular" }}
      >
        {query
          ? `Nothing in the canon contains "${query}".`
          : "Try a different search."}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Friendly relative time used by the Continue Reading hero. Goes
 * down to "Just now" within a minute, then minutes, hours, "Yesterday",
 * days; falls back to a date label past a week.
 */
function relativeMoment(epochMs: number): string {
  const now = Date.now();
  const diff = Math.max(0, now - epochMs);
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  const date = new Date(epochMs);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

function SearchIcon({ size = 16 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4-4"
        stroke={colors.inkSubtle}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClearIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22a10 10 0 100-20 10 10 0 000 20zM9 9l6 6M15 9l-6 6"
        stroke={colors.inkSubtle}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PlayChevronIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={colors.primary}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
