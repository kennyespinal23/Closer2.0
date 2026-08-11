import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
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
import { Host, TextField as ExpoTextField } from "@expo/ui/swift-ui";
import { SFSymbol } from "@/components/Symbol";
import { BookCover } from "@/components/BookCover";
import { FadeIn } from "@/components/FadeIn";
import { ThemedText } from "@/components/ThemedText";
import { type Book, BOOKS } from "@/constants/books";
import { hasBookCover } from "@/constants/bookCovers";
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

function labelForFilter(f: LibraryFilter): string {
  return f === "old" ? "Old Testament" : "New Testament";
}

export default function LibraryScreen() {
  const router = useRouter();
  const { bg } = useColors();
  const scheme = useResolvedScheme();
  const insets = useSafeAreaInsets();
  // Measured native UITabBar height from react-native-bottom-tabs
  // (onTabBarMeasured). NOT @react-navigation/bottom-tabs — that
  // context is a different React.createContext and throws/returns
  // unrelated values under our native TabView shell.
  const measuredTabBarHeight = useBottomTabBarHeight();
  const [filter, setFilter] = useState<LibraryFilter>("old");
  const [query, setQuery] = useState("");
  const { lastVisited, hasReadChapter } = useProgress();

  const isSearching = query.trim().length > 0;
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

  const filteredBooks = useMemo(() => {
    if (isSearching) {
      const q = query.trim().toLowerCase();
      return BOOKS.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.abbr.toLowerCase().includes(q),
      );
    }
    return BOOKS.filter((b) => b.testament === filter);
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
    // Opaque root so the previous tab's snapshot never shows through
    // during native tab swaps. Scroll content still carries its own
    // surface fills; cards and search sit on solid dark chrome.
    <SafeAreaView className="flex-1" style={{ backgroundColor: bg }} edges={["top"]}>
      <ScrollView
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
        <FadeIn delayMs={0} durationMs={700}>
          <View className="pt-2 pb-1" style={{ paddingHorizontal: SCREEN_H_PAD }}>
            <ThemedText
              variant="largeTitle"
              accessibilityRole="header"
            >
              Bible
            </ThemedText>
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
        <SearchField
          resetToken={filter}
          onChangeText={setQuery}
        />

        {/* ─── Testament segmented control ────────────────────── */}
        <View
          style={{
            paddingHorizontal: SCREEN_H_PAD,
            paddingTop: spacing[16],
            paddingBottom: spacing[8],
            minHeight: minTouchTarget,
            justifyContent: "center",
            opacity: isSearching ? 0.45 : 1,
          }}
          pointerEvents={isSearching ? "none" : "auto"}
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
              if (query.length > 0) setQuery("");
            }}
            style={{ height: 36 }}
          />
        </View>

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
    <View
      className="mt-7 mb-4 flex-row items-baseline justify-between"
      style={{ paddingHorizontal: SCREEN_H_PAD }}
    >
      <ThemedText variant="title2">{title}</ThemedText>
      <ThemedText variant="captionEmphasized" color="muted">
        {count} {isSearch ? (count === 1 ? "match" : "matches") : count === 1 ? "book" : "books"}
      </ThemedText>
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
        {/* ART badge — decorative only (labels illustrated covers).
            Not interactive: no Pressable / onPress. Touch target
            HIG does not apply; the parent tile owns the tap. */}
        {illustrated && (
          <View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
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
            <ThemedText
              variant="captionEmphasized"
              style={{ color: "#0F0F10", fontWeight: "800" }}
            >
              ART
            </ThemedText>
          </View>
        )}
      </View>
      <ThemedText
        variant="subheadline"
        style={{ fontWeight: "700", marginTop: 10 }}
        numberOfLines={1}
      >
        {book.name}
      </ThemedText>
      <ThemedText
        variant="caption1"
        color="muted"
        style={{ marginTop: 2 }}
        numberOfLines={1}
      >
        {book.chapters} {book.chapters === 1 ? "chapter" : "chapters"}
      </ThemedText>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Search field
// ─────────────────────────────────────────────────────────────────

function SearchField({
  resetToken,
  onChangeText,
}: {
  /** Remount native field when the testament segment changes. */
  resetToken: string;
  onChangeText: (next: string) => void;
}) {
  // @expo/ui TextField is the closest SwiftUI text-entry control
  // available (no UISearchBar wrapper in @expo/ui yet). Wrapped
  // in Host per the package contract.
  return (
    <View
      style={{
        marginHorizontal: SCREEN_H_PAD,
        marginTop: 20,
        height: 44,
      }}
    >
      <Host style={{ flex: 1, width: "100%", height: 44 }}>
        <ExpoTextField
          key={resetToken}
          defaultValue=""
          placeholder="Find a book"
          onChangeText={onChangeText}
          autocorrection={false}
        />
      </Host>
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
      style={({ pressed }) => [
        continueReadingShadow,
        {
          backgroundColor: colors.surface,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <View style={{ width: COVER_W, height: COVER_H }}>
        <BookCover book={book} variant="card" />
      </View>
      <View className="flex-1 ml-4 justify-center">
        <ThemedText variant="captionEmphasized" color="muted">
          Continue Reading
        </ThemedText>
        <ThemedText
          variant="headline"
          numberOfLines={1}
          style={{ marginTop: 4 }}
        >
          {book.name} {chapter}
        </ThemedText>
        <ThemedText
          variant="footnote"
          color="muted"
          numberOfLines={1}
          style={{ marginTop: 6 }}
        >
          {hint}
        </ThemedText>
      </View>
      <View className="pl-2 items-center justify-center">
        <SFSymbol name="chevron.right" size={13} color={colors.ink} weight="semibold" />
      </View>
    </Pressable>
  );
}

/** Soft elevating shadow — readable against cream (StatusPill was too faint here). */
const continueReadingShadow = Platform.select({
  ios: {
    shadowColor: "#000000",
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  android: { elevation: 4 },
  default: {},
});

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
