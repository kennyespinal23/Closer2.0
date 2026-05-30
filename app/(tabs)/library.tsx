import { useMemo, useState } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { BookCover } from "@/components/BookCover";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import { colors } from "@/constants/theme";
import {
  type Book,
  filterBooks,
  groupByCategory,
  type Testament,
} from "@/constants/books";
import { hasBookCover } from "@/constants/bookCovers";

/**
 * Library — the Bible.
 *
 * Layout (top → bottom):
 *   • Quiet header     ("The Word" / 66 books, one story)
 *   • Search field     (filters within the active testament)
 *   • Segmented switch (Old / New Testament)
 *   • Stack of grouped category cards (Law, Historical, etc.)
 *
 * Tapping a book pushes /book/[id] (a placeholder for now — the
 * actual reader lives there).
 */
export default function LibraryScreen() {
  const router = useRouter();
  const [testament, setTestament] = useState<Testament>("old");
  const [query, setQuery] = useState("");

  // Filter once, group once. Cheap enough for 66 items that we don't
  // even need to think about it, but keeping the work in a memo
  // means the keyboard taps don't re-walk the array unnecessarily.
  const groups = useMemo(
    () => groupByCategory(filterBooks(testament, query), testament),
    [testament, query],
  );

  const noResults = groups.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Header ─────────────────────────────────────────── */}
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

        {/* ─── Search ─────────────────────────────────────────── */}
        <SearchField value={query} onChangeText={setQuery} />

        {/* ─── Testament switcher ─────────────────────────────── */}
        <TestamentSegments value={testament} onChange={setTestament} />

        {/* ─── Grouped book list ──────────────────────────────── */}
        {noResults ? (
          <EmptyState query={query} />
        ) : (
          groups.map(({ category, books }) => (
            <CategorySection
              key={category}
              title={category}
              count={books.length}
            >
              {books.map((book, i) => (
                <BookRow
                  key={book.id}
                  book={book}
                  showDivider={i < books.length - 1}
                  onPress={() => router.push(`/book/${book.id}`)}
                />
              ))}
            </CategorySection>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Search
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
          // The default iOS TextInput height varies with font metrics;
          // a fixed height + alignVertical center keeps the placeholder
          // visually centered with the icon next to it.
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
// Testament segmented control
// ─────────────────────────────────────────────────────────────────
// Two-segment pill with an animated bubble. The bubble translates
// between the two halves with a spring so it feels native.

function TestamentSegments({
  value,
  onChange,
}: {
  value: Testament;
  onChange: (next: Testament) => void;
}) {
  // Slot width is half of the segmented container's inner width. We
  // measure the container via onLayout the first time it renders, then
  // animate the bubble via translateX.
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
      className="mx-5 mt-4 rounded-2xl border border-border bg-surface p-1"
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width - 8; // minus padding (1 * 2 sides)
        setTrackWidth(w);
        // Keep the bubble snapped to the active position if the user
        // rotates / resizes — no animation, just realign.
        bubbleX.setValue(value === "old" ? 0 : w / 2);
      }}
    >
      <View style={{ position: "relative", height: 38 }}>
        {/* Animated highlight bubble */}
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
// Section card + book row
// ─────────────────────────────────────────────────────────────────

function CategorySection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <View className="px-5 mt-7">
      <View className="flex-row items-baseline mb-2.5 ml-1">
        <Text
          className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase flex-1"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {title}
        </Text>
        <Text
          className="text-ink-subtle text-[10.5px] tracking-[1px]"
          style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        >
          {count} {count === 1 ? "book" : "books"}
        </Text>
      </View>
      <View className="rounded-2xl border border-border bg-surface overflow-hidden">
        {children}
      </View>
    </View>
  );
}

function BookRow({
  book,
  onPress,
  showDivider,
}: {
  book: Book;
  onPress: () => void;
  showDivider: boolean;
}) {
  // A row with a registered cover gets a small "Illustrated" pill
  // — a quiet hint that the book has real art behind it. It's the
  // only differentiation between rows we make today; once more
  // books have art, it'll act as a way to spot them at a glance
  // without breaking out a separate "Featured" surface.
  const illustrated = hasBookCover(book.id);

  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}
      >
        <View className="flex-row items-center px-4 py-3">
          {/* Cover thumbnail — 48×64 (3:4) at the left. Real art when
              available; tasteful gradient placeholder otherwise. */}
          <View style={{ width: 48, marginRight: 12 }}>
            <BookCover book={book} variant="thumb" />
          </View>

          <View className="flex-1 pr-2">
            <View className="flex-row items-center">
              <Text
                className="text-ink text-[15.5px] tracking-[-0.1px]"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                numberOfLines={1}
              >
                {book.name}
              </Text>
              {illustrated && (
                <View
                  className="ml-2 px-1.5 py-0.5 rounded-full border border-border"
                  style={{ backgroundColor: colors.accentSoft }}
                >
                  <Text
                    className="text-ink-subtle text-[9px] tracking-[1.5px] uppercase"
                    style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                  >
                    Illustrated
                  </Text>
                </View>
              )}
            </View>
            <Text
              className="text-ink-subtle text-[12px] mt-1"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Book {book.order} ·{" "}
              {book.chapters === 1
                ? "1 chapter"
                : `${book.chapters} chapters`}
            </Text>
          </View>

          <ChevronIcon />
        </View>
      </Pressable>
      {showDivider && (
        <View className="h-[1px] bg-border" style={{ marginLeft: 76 }} />
      )}
    </View>
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
          ? `Nothing in this testament contains "${query}". Try the other one.`
          : "Try a different search."}
      </Text>
    </View>
  );
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

function ChevronIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 6l6 6-6 6"
        stroke={colors.inkSubtle}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
