import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
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
import {
  type Book,
  type BookCategory,
  BOOKS,
  findBookById,
  NT_CATEGORY_ORDER,
  OT_CATEGORY_ORDER,
} from "@/constants/books";
import { hasBookCover } from "@/constants/bookCovers";
import * as haptics from "@/lib/haptics";
import { findMomentByDay, resolveSermonType } from "@/lib/moments";
import { useProgress } from "@/state/progress";
import { useSavedSermons } from "@/state/savedSermons";
import { useColors } from "@/state/theme";

/**
 * Library — Imprint-inspired browse grid.
 *
 * Anatomy (top → bottom):
 *
 *   ┌──────────────────────────────────────────┐
 *   │  Explore All 66 Books        (big title) │
 *   │                                          │
 *   │  [ search field ]                        │
 *   │                                          │
 *   │  ( All ) ( The Law ) ( Wisdom ) …        │ ← horizontal pill rail
 *   │                                          │
 *   │  All (66 books)                          │ ← section title for active filter
 *   │  ┌─────────┐  ┌─────────┐                │
 *   │  │  cover  │  │  cover  │                │ ← 2-col grid of book tiles
 *   │  │  GEN    │  │  EX     │                │
 *   │  └─────────┘  └─────────┘                │
 *   │   Genesis     Exodus                     │
 *   │   50 chapters 40 chapters                │
 *   │  …                                       │
 *   └──────────────────────────────────────────┘
 *
 * Why this shape (vs. the old curated rails):
 *   Imprint's library is a flat browsable surface. One filter
 *   axis (here: canon category instead of academic topic), one
 *   grid. Easier to scan, fewer modes, no testament toggle to
 *   pre-filter the rails. The Continue Reading hero from the
 *   old layout moved to the Today screen — Library is now pure
 *   discovery.
 *
 * Filter semantics:
 *   • "all"          → every book in canonical order
 *   • "Old"          → all OT books
 *   • "New"          → all NT books
 *   • <BookCategory> → just that grouping (Wisdom & Poetry, etc.)
 *
 * Search overrides the filter — when the user types, we ignore
 * the active pill and search across the full canon. (Matches
 * Apple Books' behavior: search is a mode, not a filter.)
 */
type LibraryFilter = "all" | "old" | "new" | BookCategory;

/**
 * Ordered list of filters surfaced as pills. "All" first, then
 * the two testaments, then every category in canonical order
 * (OT first, then NT — same order the user encounters them
 * cracking open the book).
 */
const FILTERS: ReadonlyArray<LibraryFilter> = [
  "all",
  "old",
  "new",
  ...OT_CATEGORY_ORDER,
  ...NT_CATEGORY_ORDER,
];

function labelForFilter(f: LibraryFilter): string {
  if (f === "all") return "All";
  if (f === "old") return "Old Testament";
  if (f === "new") return "New Testament";
  return f;
}

export default function LibraryScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<LibraryFilter>("all");
  const [query, setQuery] = useState("");
  const { lastVisited, hasReadChapter } = useProgress();
  const { saved: savedSermonDays } = useSavedSermons();

  // Search takes precedence over the active filter — when the user
  // types we hide the section header and surface a flat match grid.
  const isSearching = query.trim().length > 0;

  const filteredBooks = useMemo(() => {
    if (isSearching) {
      const q = query.trim().toLowerCase();
      return BOOKS.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.abbr.toLowerCase().includes(q),
      );
    }
    if (filter === "all") return BOOKS;
    if (filter === "old") return BOOKS.filter((b) => b.testament === "old");
    if (filter === "new") return BOOKS.filter((b) => b.testament === "new");
    return BOOKS.filter((b) => b.category === filter);
  }, [filter, query, isSearching]);

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
    // SafeAreaView transparent (no bg-bg) so the layout-level
    // AmbientAtmosphere bleeds through and the Library tab glows
    // with the day's accent the same way Today does.
    <SafeAreaView className="flex-1" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{
          paddingBottom: TAB_BAR_TOTAL_HEIGHT + 24,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* ─── Page title ──────────────────────────────────────────
            Just "Library" — matches the Home tab's title recipe so
            every tab reads with the same Apple Fitness "Summary"
            shape (32pt Bold, tight negative tracking, no
            decoration). The previous "Explore All 66 Books" was
            descriptive but lengthy; the tab bar already says
            Library, and the user's reset pass on the home tab
            established the single-word page label as the
            convention. */}
        <FadeIn delayMs={0} durationMs={700}>
          <View className="px-6 pt-2 pb-1">
            <Text
              className="text-ink"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 32,
                lineHeight: 36,
                letterSpacing: -0.8,
              }}
              accessibilityRole="header"
            >
              Library
            </Text>
          </View>
        </FadeIn>

        {/* ─── Continue Reading hero (conditional) ────────────────
            Sits between the title and search so the user lands on
            either "what I was just reading" or "what's available
            to read" — never both fighting for the first scroll. */}
        {continueReading && (
          <FadeIn delayMs={70} durationMs={800}>
            <View className="px-6 mt-5">
              <ContinueReadingHero
                book={continueReading.book}
                chapter={continueReading.chapter}
                hint={continueReading.hint}
                onPress={() =>
                  router.push(
                    `/book/${continueReading.book.id}/${continueReading.chapter}`,
                  )
                }
              />
            </View>
          </FadeIn>
        )}

        {/* ─── Saved sermons rail ─────────────────────────────────
            Surfaces every sermon the user has tapped Save on
            from the celebration screen. A horizontal rail of
            compact cards (title + voice + accent tint) so the
            collection reads as a glanceable "library of kept
            words" rather than a long vertical list. Hidden when
            the user has zero saves so the Library tab doesn't
            grow a permanent empty rail. */}
        {savedSermonDays.length > 0 && (
          <FadeIn delayMs={90} durationMs={800}>
            <SavedSermonsRail
              days={savedSermonDays}
              onOpen={(day) => {
                haptics.soft();
                router.push(`/saved-sermon/${day}` as const);
              }}
            />
          </FadeIn>
        )}

        {/* ─── Search ─────────────────────────────────────────── */}
        <SearchField value={query} onChangeText={setQuery} />

        {/* ─── Filter pills — horizontal scroll ───────────────── */}
        <FilterPills
          value={filter}
          onChange={(next) => {
            setFilter(next);
            // Clear search when the user picks a filter so the new
            // section reflects the pill they just tapped, not the
            // search residue.
            if (query.length > 0) setQuery("");
          }}
          disabled={isSearching}
        />

        {/* ─── Section header (current filter or search count) ── */}
        <SectionHeader
          title={isSearching ? "Search" : labelForFilter(filter)}
          count={filteredBooks.length}
          isSearch={isSearching}
        />

        {/* ─── Grid ───────────────────────────────────────────── */}
        {filteredBooks.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <BookGrid
            books={filteredBooks}
            onPick={(b) => router.push(`/book/${b.id}`)}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Filter pills — horizontal rail
// ─────────────────────────────────────────────────────────────────

/**
 * Imprint-style filter pills. Active = primary outline + ink text;
 * inactive = surface fill + muted text. Disabled (during search)
 * dims the whole rail so it reads as inert.
 */
function FilterPills({
  value,
  onChange,
  disabled,
}: {
  value: LibraryFilter;
  onChange: (next: LibraryFilter) => void;
  disabled: boolean;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 4,
      }}
      style={{ opacity: disabled ? 0.45 : 1 }}
      scrollEnabled={!disabled}
    >
      {FILTERS.map((f, i) => (
        <View key={f} style={{ marginRight: i === FILTERS.length - 1 ? 0 : 8 }}>
          <FilterPill
            label={labelForFilter(f)}
            active={value === f}
            onPress={() => !disabled && onChange(f)}
          />
        </View>
      ))}
    </ScrollView>
  );
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 10,
          borderRadius: 999,
          borderWidth: 1.5,
          // Active = surface backdrop with primary (ink) outline,
          // mirroring Imprint's selected chip. Inactive = same
          // surface with a neutral border that fades into the bg.
          backgroundColor: colors.surface,
          borderColor: active ? colors.primary : colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: active
              ? "PlusJakartaSans_700Bold"
              : "PlusJakartaSans_600SemiBold",
            fontSize: 13.5,
            color: active ? colors.ink : colors.inkMuted,
            letterSpacing: -0.1,
          }}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Section header — title of the active filter + book count
// ─────────────────────────────────────────────────────────────────

function SectionHeader({
  title,
  count,
  isSearch,
}: {
  title: string;
  count: number;
  isSearch: boolean;
}) {
  return (
    <View className="px-6 mt-7 mb-4 flex-row items-baseline justify-between">
      <Text
        className="text-ink text-[22px] tracking-[-0.3px]"
        style={{ fontFamily: "PlusJakartaSans_800ExtraBold" }}
      >
        {title}
      </Text>
      <Text
        className="text-ink-subtle text-[12px] tracking-[1.5px] uppercase"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {count} {isSearch ? (count === 1 ? "match" : "matches") : count === 1 ? "book" : "books"}
      </Text>
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
function BookGrid({
  books,
  onPick,
}: {
  books: ReadonlyArray<Book>;
  onPick: (b: Book) => void;
}) {
  const { width: screenWidth } = useWindowDimensions();
  const SIDE = 24;
  const GAP = 16;
  const COLS = 2;
  const colWidth = Math.floor(
    (screenWidth - SIDE * 2 - GAP * (COLS - 1)) / COLS,
  );

  return (
    <View
      style={{
        paddingHorizontal: SIDE,
        flexDirection: "row",
        flexWrap: "wrap",
      }}
    >
      {books.map((book, i) => {
        // Right column = every odd index → no right margin so the
        // row clips flush against the screen edge inset.
        const isRight = i % COLS === COLS - 1;
        return (
          <View
            key={book.id}
            style={{
              width: colWidth,
              marginRight: isRight ? 0 : GAP,
              marginBottom: 22,
            }}
          >
            <BookGridTile book={book} onPress={() => onPick(book)} />
          </View>
        );
      })}
    </View>
  );
}

/**
 * Single grid cell — cover artwork on top, name + chapter count
 * underneath. Books with hand-painted covers get a small "ART"
 * badge in the top-right (Imprint surfaces "NEW" the same way).
 */
function BookGridTile({
  book,
  onPress,
}: {
  book: Book;
  onPress: () => void;
}) {
  const colors = useColors();
  const illustrated = hasBookCover(book.id);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.88 : 1 })}
      accessibilityRole="button"
      accessibilityLabel={`Open ${book.name}`}
    >
      <View style={{ position: "relative" }}>
        <BookCover book={book} variant="card" />
        {illustrated && (
          <View
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 999,
              backgroundColor: "rgba(255,255,255,0.92)",
            }}
          >
            <Text
              style={{
                fontFamily: "PlusJakartaSans_800ExtraBold",
                fontSize: 9.5,
                color: "#0F0F10",
                letterSpacing: 1,
              }}
            >
              ART
            </Text>
          </View>
        )}
      </View>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize: 14.5,
          color: colors.ink,
          letterSpacing: -0.2,
          marginTop: 10,
        }}
        numberOfLines={1}
      >
        {book.name}
      </Text>
      <Text
        style={{
          fontFamily: "PlusJakartaSans_500Medium",
          fontSize: 11.5,
          color: colors.inkSubtle,
          marginTop: 2,
        }}
        numberOfLines={1}
      >
        {book.chapters} {book.chapters === 1 ? "chapter" : "chapters"}
      </Text>
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
  const colors = useColors();
  return (
    <View
      className="mx-5 mt-5 flex-row items-center bg-surface border border-border rounded-2xl px-4 py-3"
    >
      <SearchIcon stroke={colors.inkSubtle} />
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
          <ClearIcon stroke={colors.inkSubtle} />
        </Pressable>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Empty state — shown when a search yields nothing
// ─────────────────────────────────────────────────────────────────

function EmptyState({ query }: { query: string }) {
  const colors = useColors();
  return (
    <View className="px-6 mt-12 items-center">
      <View className="w-12 h-12 rounded-2xl bg-surface border border-border items-center justify-center mb-4">
        <SearchIcon size={18} stroke={colors.inkSubtle} />
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
function ContinueReadingHero({
  book,
  chapter,
  hint,
  onPress,
}: {
  book: Book;
  chapter: number;
  hint: string;
  onPress: () => void;
}) {
  const colors = useColors();
  const { width: screenWidth } = useWindowDimensions();
  // Bound the cover so the hero never dominates — the grid below
  // needs to peek for the page to read as a list, not a takeover.
  const COVER_W = Math.min(96, Math.round(screenWidth * 0.24));
  const COVER_H = Math.round((COVER_W * 4) / 3);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Continue reading ${book.name} ${chapter}`}
      className="rounded-3xl border border-border bg-surface p-4 flex-row items-center"
      style={({ pressed }) => ({ opacity: pressed ? 0.92 : 1 })}
    >
      <View style={{ width: COVER_W, height: COVER_H }}>
        <BookCover book={book} variant="card" />
      </View>
      <View className="flex-1 ml-4 justify-center">
        <Text
          className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          Continue Reading
        </Text>
        <Text
          className="text-ink text-[18px] leading-[22px] tracking-[-0.3px] mt-1"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          numberOfLines={1}
        >
          {book.name} {chapter}
        </Text>
        <Text
          className="text-ink-muted text-[12.5px] mt-1.5"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          numberOfLines={1}
        >
          {hint}
        </Text>
      </View>
      <View className="pl-2 items-center justify-center">
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
          <Path
            d="M9 6l6 6-6 6"
            stroke={colors.ink}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>
    </Pressable>
  );
}

/**
 * Decide whether (and what) to surface in the Continue Reading
 * hero. Mirrors the rules the old Home-screen helper used, minus
 * the "today's curated reading" de-dupe — the Library tab doesn't
 * surface today's reading, so there's nothing to clash with here.
 *
 * Rules:
 *   • Need a last visit, within the last 14 days (older than that
 *     and "continue" stops feeling honest — slightly more forgiving
 *     than the 7-day home cutoff because Library is browse-first).
 *   • If the visited chapter ISN'T marked as read → resume there.
 *   • If it IS read → suggest the next chapter (the natural flow).
 *   • Hidden entirely when there's no fresh visit, no resolvable
 *     book, or the user is sitting at the last chapter of the
 *     book (nothing forward to point at).
 */
function computeContinueReading(
  lastVisited: {
    bookId: string;
    chapter: number;
    visitedAt: number;
  } | null,
  hasReadChapter: (bookId: string, chapter: number) => boolean,
): { book: Book; chapter: number; hint: string } | null {
  if (!lastVisited) return null;

  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
  if (Date.now() - lastVisited.visitedAt > FOURTEEN_DAYS_MS) return null;

  const book = findBookById(lastVisited.bookId);
  if (!book) return null;

  const lastRead = hasReadChapter(lastVisited.bookId, lastVisited.chapter);
  if (!lastRead) {
    return {
      book,
      chapter: lastVisited.chapter,
      hint: "Pick up where you left off",
    };
  }

  const nextChapter = lastVisited.chapter + 1;
  if (nextChapter > book.chapters) return null;
  return {
    book,
    chapter: nextChapter,
    hint: `You finished ${book.name} ${lastVisited.chapter}`,
  };
}

// ─────────────────────────────────────────────────────────────────
// Saved sermons rail — horizontal list of bookmarked moments
// ─────────────────────────────────────────────────────────────────

/**
 * Horizontal rail of saved-sermon cards. Each card surfaces the
 * sermon title, voice, and the type's accent as a left-edge
 * ribbon — enough to recognize the kept piece at a glance
 * without overflowing the card with metadata.
 *
 * Renders nothing when the catalog can't resolve any of the
 * saved days (catalog truncation between updates) — the section
 * caller already guards on `savedSermonDays.length > 0`, but
 * the per-day filter inside means we don't paint dead cards
 * for moments that no longer exist.
 */
function SavedSermonsRail({
  days,
  onOpen,
}: {
  days: ReadonlyArray<number>;
  onOpen: (day: number) => void;
}) {
  const colors = useColors();
  const resolved = useMemo(
    () =>
      days
        .map((day) => {
          const moment = findMomentByDay(day);
          if (!moment) return null;
          return { moment, type: resolveSermonType(moment.type) };
        })
        .filter((x): x is { moment: NonNullable<ReturnType<typeof findMomentByDay>>; type: ReturnType<typeof resolveSermonType> } => x !== null),
    [days],
  );

  if (resolved.length === 0) return null;

  return (
    <View style={{ marginTop: 26 }}>
      <View className="px-6 flex-row items-baseline justify-between">
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: colors.ink,
            fontSize: 22,
            lineHeight: 26,
            letterSpacing: -0.4,
          }}
          accessibilityRole="header"
        >
          Saved sermons
        </Text>
        <Text
          style={{
            fontFamily: "PlusJakartaSans_700Bold",
            color: colors.inkSubtle,
            fontSize: 11,
            letterSpacing: 1.6,
            textTransform: "uppercase",
          }}
        >
          {resolved.length} {resolved.length === 1 ? "kept" : "kept"}
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: 4,
        }}
      >
        {resolved.map(({ moment, type }, i) => (
          <View
            key={moment.day}
            style={{
              marginRight: i === resolved.length - 1 ? 0 : 12,
            }}
          >
            <SavedSermonCard
              title={moment.title}
              voice={moment.voice}
              typeName={type.name}
              accent={type.accent}
              onPress={() => onOpen(moment.day)}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function SavedSermonCard({
  title,
  voice,
  typeName,
  accent,
  onPress,
}: {
  title: string;
  voice: string;
  typeName: string;
  accent: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open saved sermon ${title}`}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
    >
      <View
        style={{
          width: 220,
          minHeight: 132,
          borderRadius: 18,
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
          padding: 16,
          flexDirection: "row",
          overflow: "hidden",
        }}
      >
        {/* Left ribbon — paints the sermon-type accent down the
            left edge so each card is recognizable by color at a
            glance without leaning on a per-type illustration. */}
        <View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 4,
            backgroundColor: accent,
          }}
        />
        <View style={{ flex: 1, paddingLeft: 8 }}>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: accent,
              fontSize: 10.5,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
            numberOfLines={1}
          >
            {typeName}
          </Text>
          <Text
            style={{
              fontFamily: "PlusJakartaSans_700Bold",
              color: colors.ink,
              fontSize: 15.5,
              lineHeight: 20,
              letterSpacing: -0.2,
              marginTop: 8,
            }}
            numberOfLines={3}
          >
            {title}
          </Text>
          {voice ? (
            <Text
              style={{
                fontFamily: "PlusJakartaSans_500Medium",
                color: colors.inkMuted,
                fontSize: 12,
                marginTop: 10,
              }}
              numberOfLines={1}
            >
              {voice}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
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
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 19a8 8 0 100-16 8 8 0 000 16zM21 21l-4-4"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ClearIcon({ stroke }: { stroke: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22a10 10 0 100-20 10 10 0 000 20zM9 9l6 6M15 9l-6 6"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
