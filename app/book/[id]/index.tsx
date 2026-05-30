import { Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
} from "react-native-svg";
import { BookCover } from "@/components/BookCover";
import { findBookById } from "@/constants/books";
import { hasBookCover } from "@/constants/bookCovers";
import { colors } from "@/constants/theme";
import { prefetchChapter } from "@/lib/bible";

/**
 * Book overview — the page you land on when you tap a book in the
 * Library. Hero block (book number / category / chapter count) over
 * a tappable chapter grid; each tile pushes /book/[id]/[chapter]
 * which is the actual reader.
 */
export default function BookOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const book = id ? findBookById(id) : undefined;

  // Unknown slug fallback — only reachable via manual deep-linking;
  // the Library never produces a missing book.
  if (!book) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        <Header title="Not found" />
        <View className="flex-1 items-center justify-center px-6">
          <Text
            className="text-ink text-[18px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            We don&apos;t know that book.
          </Text>
          <Text
            className="text-ink-muted text-[13.5px] mt-2 text-center"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            Head back to the Library and try another.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 px-5 py-3 rounded-full bg-primary"
          >
            <Text
              className="text-primary-fg text-[13px]"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Back to Library
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const testamentLabel =
    book.testament === "old" ? "Old Testament" : "New Testament";

  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  const openChapter = (chapter: number) => {
    router.push(`/book/${book.id}/${chapter}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <Header title={book.name} />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Hero ────────────────────────────────────────────────
            Centered cover card sits at the visual top of the page.
            Real cover art (when registered) speaks for itself; books
            without art fall back to a category-tinted placeholder so
            the layout reads as intentional, never broken.

            A soft halo behind the cover gives a little atmospheric
            depth — light enough that flat placeholders also benefit,
            strong enough that painted covers feel "lit". */}
        <HeroCoverArea book={book} />

        {/* ─── Book identity block ──────────────────────────────── */}
        <View className="px-6 mt-6 items-center">
          <Text
            className="text-ink-subtle text-[11px] uppercase tracking-[2.5px] text-center"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            Book {book.order} · {testamentLabel}
          </Text>
          <Text
            className="text-ink text-[32px] leading-[38px] tracking-[-0.6px] mt-2.5 text-center"
            style={{ fontFamily: "PlusJakartaSans_800ExtraBold" }}
          >
            {book.name}
          </Text>
          <Text
            className="text-ink-muted text-[13px] mt-2 text-center"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            {book.category} · {book.chapters}{" "}
            {book.chapters === 1 ? "chapter" : "chapters"}
          </Text>
        </View>

        {/* ─── "Begin reading" CTA ──────────────────────────────
            A quiet, primary call-to-action that drops the reader
            into chapter 1. Saves users from hunting in the grid for
            the most common starting point. */}
        <View className="px-6 mt-7">
          <Pressable
            onPress={() => openChapter(1)}
            className="bg-primary rounded-2xl py-4 items-center"
            style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
          >
            <Text
              className="text-primary-fg text-[15px] tracking-[-0.1px]"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Begin {book.name}
            </Text>
            <Text
              className="text-primary-fg text-[11.5px] mt-0.5 opacity-60"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            >
              Open chapter 1
            </Text>
          </Pressable>
        </View>

        {/* ─── Chapter grid ─────────────────────────────────────
            5-up grid of tappable chapter tiles. We prefetch chapter
            1 on screen mount via the Pressable's onLayout below so
            that opening the most common starting chapter feels
            instant. */}
        <View className="px-5 mt-8">
          <Text
            className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase mb-3 ml-1"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            Chapters
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginHorizontal: -3,
            }}
            onLayout={() => prefetchChapter(book.id, 1)}
          >
            {chapters.map((c) => (
              <ChapterTile
                key={c}
                number={c}
                onPress={() => openChapter(c)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Shared chrome
// ─────────────────────────────────────────────────────────────────

function Header({ title }: { title: string }) {
  const router = useRouter();
  return (
    <View className="flex-row items-center px-4 pt-2 pb-3">
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Back"
        className="w-10 h-10 rounded-full items-center justify-center"
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 6l-6 6 6 6"
            stroke={colors.ink}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>
      <Text
        className="text-ink text-[17px] flex-1 text-center"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <View className="w-10 h-10" />
    </View>
  );
}

/**
 * Hero block above the book identity text. Wraps BookCover in a
 * centered container sized to ~62% of screen width (capped at 280px
 * for tablets) and floats a soft, low-contrast halo behind it. The
 * halo is just an SVG radial-ish gradient drawn as a rectangle —
 * cheap and harmless on flat placeholders, and gives painted covers
 * (like Job's) a sense of "lit-from-behind" warmth without crowding
 * the artwork itself.
 */
function HeroCoverArea({ book }: { book: ReturnType<typeof findBookById> }) {
  const { width: screenWidth } = useWindowDimensions();
  if (!book) return null;
  const coverWidth = Math.min(screenWidth * 0.62, 280);
  // Halo follows the cover proportions but with extra room around
  // it, so the glow extends past the cover edges instead of being
  // clipped at the same bounds.
  const haloWidth = coverWidth + 80;
  const haloHeight = coverWidth * (4 / 3) + 80;
  // Real cover art has more color identity than a flat placeholder,
  // so the halo gets a slightly warmer tone there. Placeholder
  // halos stay neutral so the gradient palette inside the cover
  // does all the category-coloring work.
  const haloColor = hasBookCover(book.id) ? "#FFE3B0" : "#FFFFFF";

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 8,
        paddingBottom: 4,
      }}
    >
      {/* Halo behind the cover. pointerEvents="none" so taps still
          land on the cover (currently a no-op visual, but doesn't
          hurt to be future-proof). */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: haloWidth,
          height: haloHeight,
          top: -20,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={haloWidth} height={haloHeight}>
          <Defs>
            <LinearGradient id="bookHeroHalo" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={haloColor} stopOpacity="0.16" />
              <Stop offset="0.55" stopColor={haloColor} stopOpacity="0.04" />
              <Stop offset="1" stopColor={haloColor} stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={haloWidth}
            height={haloHeight}
            fill="url(#bookHeroHalo)"
            rx={32}
            ry={32}
          />
        </Svg>
      </View>

      <View style={{ width: coverWidth }}>
        <BookCover book={book} variant="hero" />
      </View>
    </View>
  );
}

function ChapterTile({
  number,
  onPress,
}: {
  number: number;
  onPress: () => void;
}) {
  return (
    <View
      style={{
        // 20% width minus 3px horizontal padding gives a clean 5-up
        // grid that scales with screen width.
        width: "20%",
        padding: 3,
      }}
    >
      <Pressable onPress={onPress}>
        <View
          className="rounded-xl border border-border bg-surface items-center justify-center"
          style={{ aspectRatio: 1 }}
        >
          <Text
            className="text-ink text-[14px]"
            style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
          >
            {number}
          </Text>
        </View>
      </Pressable>
    </View>
  );
}
