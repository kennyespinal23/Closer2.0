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
import { SFSymbol } from "@/components/Symbol";
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
import { SCREEN_H_PAD } from "@/lib/layout";
import { useProgress } from "@/state/progress";
import { useColors, useResolvedScheme } from "@/state/theme";

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
          <View className="pt-2 pb-1" style={{ paddingHorizontal: SCREEN_H_PAD }}>
            <Text
              className="text-ink"
              style={{
                fontFamily: "System",
                fontWeight: "700",
                fontSize: 32,
                lineHeight: 36,
                letterSpacing: -0.8,
              }}
              accessibilityRole="header"
            >
              Bible
            </Text>
          </View>
        </FadeIn>

        {/* ─── Continue Reading hero (conditional) ────────────────
            Sits between the title and search so the user lands on
            either "what I was just reading" or "what's available
            to read" — never both fighting for the first scroll. */}
        {continueReading && (
          <FadeIn delayMs={70} durationMs={800}>
            <View className="mt-5" style={{ paddingHorizontal: SCREEN_H_PAD }}>
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

        {/* Saved sermons used to live here as a horizontal rail
            but moved to the Profile tab in June 2026 — once a user
            intentionally saves a sermon it stops being browsable
            content and becomes a personal artifact alongside Notes
            and Highlights. Library is now pure discovery:
            Continue Reading → Search → Filters → Books. */}

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
        paddingHorizontal: SCREEN_H_PAD,
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
  const scheme = useResolvedScheme();
  // iOS systemBlue — Apple's universal "selected filter" tint.
  // Music genre chips, App Store filter rails, News topic
  // pills all use blue-on-blue-tint for active state. We mirror
  // exactly so the rail reads as a first-party iOS control.
  const blue = scheme === "light" ? "#007AFF" : "#0A84FF";
  // Active fill — a low-alpha wash of the same systemBlue, the
  // ".tinted" button style Apple introduced in iOS 15. Inactive
  // chips sit on `surfaceSecondary` (the same secondary-grey
  // surface Apple uses for unfilled chips against an off-white
  // canvas).
  const activeFill =
    scheme === "light" ? "rgba(0, 122, 255, 0.12)" : "rgba(10, 132, 255, 0.20)";
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      {/* Pill — iOS-native ".tinted" capsule. Active uses a
          systemBlue wash + blue ink + bold weight to read as
          the selected filter; inactive sits on the secondary
          surface with muted ink. Border dropped entirely on
          the active state because the tinted fill itself
          communicates selection (less chrome = more iOS).
          
          paddingVertical 8 keeps the chip compact while the
          surrounding ScrollView's vertical padding + the chip's
          own hitSlop=6 keep the total tap region comfortably
          above HIG's 44pt floor. */}
      <View
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 999,
          backgroundColor: active ? activeFill : colors.surfaceSecondary,
          borderWidth: active ? 0 : StyleSheet.hairlineWidth,
          borderColor: colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontWeight: active ? "700" : "600",
            fontSize: 13,
            color: active ? blue : colors.inkMuted,
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
  const colors = useColors();
  return (
    <View
      className="mt-7 mb-4 flex-row items-baseline justify-between"
      style={{ paddingHorizontal: SCREEN_H_PAD }}
    >
      <Text
        className="text-ink text-[22px] tracking-[-0.3px]"
        style={{ fontFamily: "System", fontWeight: "800" }}
      >
        {title}
      </Text>
      {/* Count badge — tracking-1pt / 11pt / SemiBold so it reads as
          a quiet supporting number instead of competing with the
          section title beside it. Design review (June 2026) flagged
          the previous treatment (12pt Bold + 1.5pt tracking) as
          near-equal weight with "All" — the title now dominates and
          the count fades behind it. Color held at inkSubtle for the
          same hierarchy reason. */}
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "600",
          color: colors.inkSubtle,
          fontSize: 11,
          letterSpacing: 1,
          textTransform: "uppercase",
        }}
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
  const SIDE = SCREEN_H_PAD;
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
                fontFamily: "System",
                fontWeight: "800",
                fontSize: 11,
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
          fontFamily: "System",
          fontWeight: "700",
          fontSize: 15,
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
          fontFamily: "System",
          fontWeight: "500",
          fontSize: 12,
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
    // iOS-native search bar — the same recipe UISearchBar /
    // UIKit's `searchController` paints on every list screen
    // (Settings, Messages, Mail, Files). Visual contract:
    //   - Filled capsule on the SECONDARY surface (not the page
    //     bg) so the field reads as a chrome control sitting on
    //     the canvas rather than another card.
    //   - 10pt radius — Apple's stock UISearchBar curvature
    //     (more rounded than a row, less than a pill).
    //   - 16pt magnifyingglass leading + 8pt gutter + text.
    //   - clearButtonMode="while-editing" → native iOS X-circle
    //     clear button instead of a custom SVG one.
    //   - No border. Apple's search bar leans on the fill +
    //     placeholder contrast, not a hairline outline.
    <View
      style={{
        marginHorizontal: SCREEN_H_PAD,
        marginTop: 20,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: colors.surfaceSecondary,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 9,
      }}
    >
      <SearchIcon stroke={colors.inkSubtle} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder="Find a book"
        placeholderTextColor={colors.inkSubtle}
        style={{
          flex: 1,
          marginLeft: 8,
          color: colors.ink,
          fontFamily: "System",
          fontWeight: "500",
          fontSize: 16,
          paddingVertical: 0,
        }}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        // Use the native iOS clear button — UIKit paints a
        // small grey-circle X inside the field while editing,
        // which is the canonical search-clear affordance. Drops
        // our custom <ClearIcon> press target so we don't ship
        // two competing clear glyphs.
        clearButtonMode="while-editing"
      />
    </View>
  );
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
      <Text
        className="text-ink text-[16px]"
        style={{ fontFamily: "System", fontWeight: "700" }}
      >
        No books match
      </Text>
      <Text
        className="text-ink-muted text-[13px] mt-1.5 text-center"
        style={{ fontFamily: "System", fontWeight: "400" }}
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
          className="text-ink-subtle text-[11px] tracking-[2.5px] uppercase"
          style={{ fontFamily: "System", fontWeight: "700" }}
        >
          Continue Reading
        </Text>
        <Text
          className="text-ink text-[18px] leading-[22px] tracking-[-0.3px] mt-1"
          style={{ fontFamily: "System", fontWeight: "700" }}
          numberOfLines={1}
        >
          {book.name} {chapter}
        </Text>
        <Text
          className="text-ink-muted text-[13px] mt-1.5"
          style={{ fontFamily: "System", fontWeight: "500" }}
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
