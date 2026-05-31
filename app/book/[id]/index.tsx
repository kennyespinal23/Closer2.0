import { useMemo, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { BookCover } from "@/components/BookCover";
import { type Book, findBookById, siblingBooks } from "@/constants/books";
import {
  CATEGORY_COVER_PALETTE,
  type CoverBloom,
  getCoverBloom,
  hasBookCover,
} from "@/constants/bookCovers";
import { getBookBlurb } from "@/constants/bookBlurbs";
import { colors } from "@/constants/theme";
import { prefetchChapter } from "@/lib/bible";
import { useProgress } from "@/state/progress";

/**
 * Book overview — Apple Books–inspired detail page.
 *
 * Top to bottom:
 *   1. Tinted backdrop gradient anchored to the book's bloom palette
 *      so the top of the screen reads as the cover's wash.
 *   2. Header chrome — back chevron + share chip floating over the
 *      backdrop. Matches the Insights detail chrome.
 *   3. Centered cover with deep drop shadow and a radial palette
 *      bloom behind it (HeroCover + PageBackdrop work as a pair).
 *   4. Title + category pill. We dropped the "Book N · Old
 *      Testament" eyebrow since both pieces of metadata appear in
 *      the stats strip below — appearing once each.
 *   5. Stats strip — four bordered tiles (Chapters / Read time /
 *      Testament / Position). Replaces the old 5-row "Information"
 *      list with something scannable in one glance.
 *   6. Primary "Continue Reading" / "Start Reading" CTA, then a
 *      single row of chip-style secondary actions (Start over /
 *      Random chapter / Share).
 *   7. Reading-progress pill — only renders when the user has read
 *      at least one chapter of this book. Shows X/N + percent over
 *      a slim fill bar.
 *   8. "About this book" — a short editorial blurb (only when we've
 *      written copy for it). Collapses past 4 lines with Read more.
 *   9. Chapters grid — the existing 5-up tile grid with read-dot
 *      indicators and a "resume" treatment on the current chapter.
 *  10. "More from {category}" — horizontal scroll of sibling books
 *      from the same canonical group, each with their own cover.
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
        <Header />
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

  return <BookDetail book={book} />;
}

// ─────────────────────────────────────────────────────────────────
// Body — split out from the screen so the missing-book guard above
// can return early without React complaining about hook order.
// ─────────────────────────────────────────────────────────────────

function BookDetail({ book }: { book: Book }) {
  const router = useRouter();
  const { lastVisited, hasReadChapter, chaptersRead } = useProgress();
  const blurb = useMemo(() => getBookBlurb(book.id), [book.id]);
  const siblings = useMemo(() => siblingBooks(book.id), [book.id]);

  const testamentLabel =
    book.testament === "old" ? "Old Testament" : "New Testament";
  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  const openChapter = (chapter: number) => {
    router.push(`/book/${book.id}/${chapter}`);
  };

  // "Continue from chapter N" only makes sense when the user has a
  // last-visited entry FOR THIS BOOK. Cross-book resume is handled
  // by the Library's Continue Reading card; here we want the
  // resume affordance to be book-scoped.
  const resumeChapter =
    lastVisited && lastVisited.bookId === book.id
      ? lastVisited.chapter
      : null;

  // Chapters of this book the user has marked read — used both for
  // the per-tile dot indicator AND the aggregate progress pill.
  const readCount = useMemo(
    () => chaptersRead.filter((c) => c.bookId === book.id).length,
    [chaptersRead, book.id],
  );
  const progressPct = Math.min(
    100,
    Math.round((readCount / book.chapters) * 100),
  );

  // Estimated total read time. We use a deliberately gentle 4 min/chapter
  // average — most chapters land between 2-6 min at a contemplative
  // pace; the round number reads as "honest estimate" not "spurious
  // precision."
  const estMinutes = book.chapters * 4;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Tinted backdrop sits behind everything and bleeds into the
          status-bar area. When the book has registered cover art,
          the backdrop borrows from the cover's bloom palette so the
          whole page sings in one key; otherwise it falls back to
          the category color so the placeholder books still feel
          tonally distinct from each other. */}
      <PageBackdrop book={book} />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <Header bookId={book.id} />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 56 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Hero cover ──────────────────────────────────── */}
          <HeroCover book={book} />

          {/* ─── Title + category pill ────────────────────────
              Tightened from before: dropped the testament/book-order
              eyebrow line — that information now lives in the stats
              strip below so each piece of metadata appears once. */}
          <View className="px-6 mt-7 items-center">
            <Text
              className="text-ink text-[30px] leading-[36px] tracking-[-0.6px] text-center"
              style={{ fontFamily: "PlusJakartaSans_800ExtraBold" }}
            >
              {book.name}
            </Text>
            <View
              className="mt-2.5 px-3 py-1 rounded-full"
              style={{
                backgroundColor: colors.accentSoft,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <Text
                className="text-ink-muted text-[11px] tracking-[0.5px]"
                style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
              >
                {book.category}
              </Text>
            </View>
          </View>

          {/* ─── Stats strip ──────────────────────────────────
              Four small bordered tiles, like Apple Books' "Length /
              Genre / Publisher" row. Tunes to the canonical info we
              actually have: chapter count, average read time,
              testament, position. Replaces the old "Information"
              section which was a 5-row list of mostly the same data. */}
          <View className="px-5 mt-6">
            <View className="flex-row" style={{ gap: 8 }}>
              <StatTile
                label="Chapters"
                value={String(book.chapters)}
              />
              <StatTile
                label="Read time"
                value={`${estMinutes >= 60 ? `${Math.round(estMinutes / 60)}h` : `${estMinutes}m`}`}
              />
              <StatTile
                label={book.testament === "old" ? "Testament" : "Testament"}
                value={book.testament === "old" ? "Old" : "New"}
              />
              <StatTile
                label="Position"
                value={`#${book.order}`}
              />
            </View>
          </View>

          {/* ─── Action row ───────────────────────────────────
              Apple Books pattern: one prominent primary CTA, then a
              quieter row of icon chips beneath. Removes the chunky
              two-up card layout that used to dominate this section. */}
          <View className="px-5 mt-5">
            <PrimaryReadButton
              label={resumeChapter ? "Continue Reading" : "Start Reading"}
              sublabel={
                resumeChapter
                  ? `Pick up at chapter ${resumeChapter}`
                  : `Begin from chapter 1 · ${estMinutes}m`
              }
              onPress={() => openChapter(resumeChapter ?? 1)}
            />
            <View className="flex-row mt-3" style={{ gap: 8 }}>
              {resumeChapter && resumeChapter !== 1 && (
                <ChipAction
                  label="Start over"
                  icon={<RewindIcon />}
                  onPress={() => openChapter(1)}
                />
              )}
              <ChipAction
                label="Random"
                icon={<DiceIcon />}
                onPress={() =>
                  openChapter(
                    1 + Math.floor(Math.random() * book.chapters),
                  )
                }
              />
              <ChipAction
                label="Share"
                icon={<ShareIcon />}
                onPress={async () => {
                  try {
                    await Share.share({
                      message: `${book.name} — reading it in Closer.`,
                    });
                  } catch {
                    /* user dismissed the share sheet */
                  }
                }}
              />
            </View>
          </View>

          {/* ─── Reading progress pill ──────────────────────── */}
          {readCount > 0 && (
            <View className="px-5 mt-7">
              <View className="px-1 mb-2 flex-row items-baseline justify-between">
                <Text
                  className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase"
                  style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                >
                  Your progress
                </Text>
                <Text
                  className="text-ink text-[12px]"
                  style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
                >
                  {readCount}/{book.chapters} ·{" "}
                  <Text className="text-ink-subtle">{progressPct}%</Text>
                </Text>
              </View>
              <View
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: colors.border }}
              >
                <View
                  className="h-2"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: colors.primary,
                  }}
                />
              </View>
            </View>
          )}

          {/* ─── About this book ───────────────────────────── */}
          {blurb && (
            <Section title="About this book">
              <AboutBlurb text={blurb} />
            </Section>
          )}

          {/* ─── Chapters ───────────────────────────────────── */}
          <Section
            title="Chapters"
            titleAside={
              readCount > 0
                ? `${readCount} of ${book.chapters} read`
                : `${book.chapters} total`
            }
          >
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
                  read={hasReadChapter(book.id, c)}
                  isResume={c === resumeChapter}
                  onPress={() => openChapter(c)}
                />
              ))}
            </View>
          </Section>

          {/* ─── More from category ────────────────────────── */}
          {siblings.length > 0 && (
            <View className="mt-9">
              <View className="px-6 mb-3 flex-row items-baseline justify-between">
                <Text
                  className="text-ink text-[17px] tracking-[-0.2px]"
                  style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                >
                  More from {book.category}
                </Text>
                <Text
                  className="text-ink-subtle text-[11px] tracking-[2px] uppercase"
                  style={{ fontFamily: "PlusJakartaSans_700Bold" }}
                >
                  {siblings.length}{" "}
                  {siblings.length === 1 ? "book" : "books"}
                </Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 20,
                  paddingTop: 2,
                  paddingBottom: 6,
                  gap: 12,
                }}
              >
                {siblings.map((sibling) => (
                  <SiblingCard
                    key={sibling.id}
                    book={sibling}
                    onPress={() =>
                      router.push(`/book/${sibling.id}`)
                    }
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Backdrop — soft tinted gradient at the top of the page
// ─────────────────────────────────────────────────────────────────

function PageBackdrop({ book }: { book: Book }) {
  const { width: screenWidth } = useWindowDimensions();
  const height = 420;

  // Prefer the cover's own bloom palette when one is registered,
  // so the page wash and the bloom behind the cover read as a
  // single color story. Fall back to the category palette so
  // placeholder books still feel tonally distinct.
  const coverBloom = getCoverBloom(book.id);
  const palette = CATEGORY_COVER_PALETTE[book.category];
  const top = coverBloom?.outer ?? palette.top;
  const mid = coverBloom?.outer ?? palette.bottom;

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height,
      }}
    >
      <Svg width={screenWidth} height={height}>
        <Defs>
          <LinearGradient id="pageBackdrop" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={top} stopOpacity="0.55" />
            <Stop offset="0.55" stopColor={mid} stopOpacity="0.28" />
            <Stop offset="1" stopColor={colors.bg} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={screenWidth}
          height={height}
          fill="url(#pageBackdrop)"
        />
      </Svg>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Hero cover — large centered cover with Apple-Books-style shadow
// + a focused radial bloom directly behind it
// ─────────────────────────────────────────────────────────────────

function HeroCover({ book }: { book: Book }) {
  const { width: screenWidth } = useWindowDimensions();
  // ~65% width, capped — gives a real "book on a table" presence
  // without crowding the screen on small phones or stretching on
  // tablets. The shadow lives on the cover wrapper because
  // BookCover applies overflow: hidden internally (which would clip
  // a shadow placed inside it).
  const coverWidth = Math.min(screenWidth * 0.62, 280);
  const coverHeight = coverWidth * (4 / 3);

  // The radial bloom is sized noticeably larger than the cover so
  // its falloff has room to breathe well past every edge. We push
  // the margins generously here because the visually IMPORTANT
  // part of the gradient is the ring AROUND the cover (the bright
  // center is fully obscured by the cover itself) — so the bloom
  // wants real estate outside the cover's bounds.
  const bloomWidth = coverWidth + 240;
  const bloomHeight = coverHeight + 280;

  // The bloom uses TWO colors so the gradient transitions through
  // the painting's palette as it fades out — a brighter highlight
  // at the center, a deeper supporting hue at the falloff. Picked
  // per source:
  //   • Books with art declare their own bloom in bookCovers.ts —
  //     sampled from the painting itself. Falls back to a warm
  //     amber pair if a cover ships without a palette yet.
  //   • Placeholder books reuse their category palette so the bloom
  //     stays consistent with what's painted INSIDE the placeholder
  //     gradient.
  const palette = CATEGORY_COVER_PALETTE[book.category];
  const bloom: CoverBloom = hasBookCover(book.id)
    ? getCoverBloom(book.id) ?? { inner: "#FFD49B", outer: "#A07040" }
    : { inner: palette.accent, outer: palette.top };

  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 12,
        paddingBottom: 6,
      }}
    >
      {/* Bloom — sits absolutely behind the cover and bleeds past
          its edges. pointerEvents disabled so it can't intercept
          future taps on the cover. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          width: bloomWidth,
          height: bloomHeight,
          top: 12 - (bloomHeight - coverHeight) / 2,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Svg width={bloomWidth} height={bloomHeight}>
          <Defs>
            <RadialGradient
              id={`coverBloom-${book.id}`}
              cx="50%"
              cy="50%"
              rx="50%"
              ry="50%"
            >
              {/* The cover blocks the gradient's geometric center.
                  Math: cover is ~280×373 inside a bloom of roughly
                  500×633, so the cover edges sit at ~42% of the
                  gradient radius from center. Everything BEFORE
                  ~42% is hidden behind the painting; the visible
                  bloom starts there. So we pile the brightest
                  stops at that boundary and keep significant
                  opacity all the way out to ~75% so the halo has
                  weight, not just a thin rim. */}
              <Stop offset="0%" stopColor={bloom.inner} stopOpacity={0.7} />
              <Stop offset="42%" stopColor={bloom.inner} stopOpacity={0.55} />
              {/* Just outside the cover edge — the peak visible
                  brightness with a hint of the outer color
                  bleeding in. */}
              <Stop offset="55%" stopColor={bloom.outer} stopOpacity={0.4} />
              {/* Mid falloff — quiet enough to keep the bloom
                  feeling like atmosphere, not a spotlight. */}
              <Stop offset="78%" stopColor={bloom.outer} stopOpacity={0.18} />
              {/* Edge: fade outer color to fully transparent so the
                  bloom blends into the page bg cleanly. */}
              <Stop offset="100%" stopColor={bloom.outer} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect
            x={0}
            y={0}
            width={bloomWidth}
            height={bloomHeight}
            fill={`url(#coverBloom-${book.id})`}
          />
        </Svg>
      </View>

      <View
        style={{
          width: coverWidth,
          // Drop shadow tuned to feel like a hardcover catching
          // overhead light. iOS picks this up directly; Android
          // uses elevation. The shadow is offset DOWN so the top
          // of the cover stays clean.
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 16 },
              shadowOpacity: 0.55,
              shadowRadius: 28,
            },
            android: { elevation: 20 },
          }),
        }}
      >
        <BookCover book={book} variant="hero" />
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Action row — Apple Books pattern: one tall primary + chip row
// ─────────────────────────────────────────────────────────────────

/**
 * Full-width primary CTA. Two lines stacked — bold action verb on
 * top, quieter context line below ("Pick up at chapter 8",
 * "Begin from chapter 1 · 200m"). Tall enough to feel like the
 * page's center of gravity without ballooning.
 */
function PrimaryReadButton({
  label,
  sublabel,
  onPress,
}: {
  label: string;
  sublabel: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.9 : 1 })}
      className="bg-primary rounded-2xl py-4 items-center"
    >
      <Text
        className="text-primary-fg text-[16px] tracking-[-0.1px]"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
      >
        {label}
      </Text>
      <Text
        className="text-primary-fg text-[11.5px] mt-0.5 opacity-65"
        style={{ fontFamily: "PlusJakartaSans_500Medium" }}
      >
        {sublabel}
      </Text>
    </Pressable>
  );
}

/**
 * Small icon-on-left pill used in the secondary action row. Apple
 * Books uses these for things like Sample / Share / More — light
 * enough to coexist with the heavy primary above, distinct enough
 * that each action reads as its own affordance.
 */
function ChipAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.85 : 1 })}
    >
      <View
        className="flex-row items-center justify-center rounded-full border border-border bg-surface"
        style={{ height: 38 }}
      >
        {icon}
        <Text
          className="text-ink text-[12.5px] ml-2"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Stats strip — 4-up bordered tiles, Apple Books info-row energy
// ─────────────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      className="flex-1 rounded-2xl border border-border items-center justify-center"
      style={{ backgroundColor: colors.surface, paddingVertical: 12 }}
    >
      <Text
        className="text-ink text-[18px] tracking-[-0.2px]"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        numberOfLines={1}
      >
        {value}
      </Text>
      <Text
        className="text-ink-subtle text-[9.5px] mt-0.5 tracking-[1.5px] uppercase"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// About blurb — collapses past ~4 lines with a "More" toggle
// ─────────────────────────────────────────────────────────────────

/**
 * Editorial blurb that clamps to 4 lines by default with a "Read
 * more" toggle beneath. Mirrors Apple Books' "Synopsis" pattern —
 * lets the short blurbs we ship today stay tight, and gives longer
 * future blurbs room to expand without forcing a wall of text on
 * first paint.
 */
function AboutBlurb({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View>
      <Text
        className="text-ink text-[14.5px] leading-[22px]"
        style={{ fontFamily: "PlusJakartaSans_400Regular" }}
        numberOfLines={expanded ? undefined : 4}
      >
        {text}
      </Text>
      {/* Only render the toggle when the text is long enough to
          plausibly clip — ~280 chars covers 4 lines at the body
          font size on most widths. Keeps the "More" affordance from
          appearing on one-paragraph blurbs that never overflow. */}
      {text.length > 280 && (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          hitSlop={6}
          className="mt-2"
        >
          <Text
            className="text-primary text-[12.5px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {expanded ? "Show less" : "Read more"}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sections + info card
// ─────────────────────────────────────────────────────────────────

/**
 * Section wrapper used by About + Chapters. Title is a normal-weight
 * heading (not the all-caps eyebrow we used before) so it matches
 * the heading rhythm in the Library and Insights tabs.
 */
function Section({
  title,
  titleAside,
  children,
}: {
  title: string;
  titleAside?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="px-5 mt-9">
      <View className="flex-row items-baseline justify-between mb-3 px-1">
        <Text
          className="text-ink text-[17px] tracking-[-0.2px]"
          style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        >
          {title}
        </Text>
        {titleAside && (
          <Text
            className="text-ink-subtle text-[11px] tracking-[2px] uppercase"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {titleAside}
          </Text>
        )}
      </View>
      <View className="px-1">{children}</View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Chapter grid — same shape as before, with read / resume markers
// ─────────────────────────────────────────────────────────────────

function ChapterTile({
  number,
  read,
  isResume,
  onPress,
}: {
  number: number;
  read: boolean;
  isResume: boolean;
  onPress: () => void;
}) {
  return (
    <View style={{ width: "20%", padding: 3 }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View
          className={`rounded-xl items-center justify-center ${
            isResume
              ? "bg-accent-soft border border-primary"
              : "border border-border bg-surface"
          }`}
          style={{ aspectRatio: 1, position: "relative" }}
        >
          <Text
            className={`text-[14px] ${
              isResume ? "text-primary" : "text-ink"
            }`}
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            {number}
          </Text>
          {/* Tiny dot in the upper-right corner marking chapters the
              user has finished. Quiet on its own; the larger
              "resume" treatment above takes precedence for the
              single chapter the user is currently in. */}
          {read && !isResume && (
            <View
              style={{
                position: "absolute",
                top: 6,
                right: 6,
                width: 5,
                height: 5,
                borderRadius: 3,
                backgroundColor: colors.primary,
              }}
            />
          )}
        </View>
      </Pressable>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// More from category — horizontal scrolling sibling cards
// ─────────────────────────────────────────────────────────────────

function SiblingCard({ book, onPress }: { book: Book; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, width: 120 })}
    >
      <View style={{ width: 120 }}>
        <BookCover book={book} variant="card" />
      </View>
      <Text
        className="text-ink text-[12.5px] mt-2.5"
        style={{ fontFamily: "PlusJakartaSans_700Bold" }}
        numberOfLines={1}
      >
        {book.name}
      </Text>
      <Text
        className="text-ink-subtle text-[11px] mt-0.5"
        style={{ fontFamily: "PlusJakartaSans_500Medium" }}
        numberOfLines={1}
      >
        {book.chapters} {book.chapters === 1 ? "chapter" : "chapters"}
      </Text>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Header — translucent so the backdrop gradient is visible behind it
// ─────────────────────────────────────────────────────────────────

/**
 * Top chrome floats over the backdrop. Back chip on the left,
 * Share + Library shortcut on the right. All buttons use a dark
 * translucent disc so they read against any backdrop color. Mirrors
 * the Insights detail chrome so the two detail screens feel cousin
 * to each other.
 */
function Header({ bookId }: { bookId?: string }) {
  const router = useRouter();

  const handleShare = async () => {
    if (!bookId) return;
    const book = findBookById(bookId);
    if (!book) return;
    try {
      await Share.share({
        message: `${book.name} — reading it in Closer.`,
      });
    } catch {
      /* user dismissed the share sheet */
    }
  };

  return (
    <View className="flex-row items-center px-4 pt-2 pb-3">
      <RoundChip onPress={() => router.back()} accessibilityLabel="Back">
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 6l-6 6 6 6"
            stroke={colors.ink}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </RoundChip>
      <View className="flex-1" />
      {bookId && (
        <RoundChip onPress={handleShare} accessibilityLabel="Share book">
          <ShareIcon />
        </RoundChip>
      )}
    </View>
  );
}

/**
 * A circular translucent button matching the Insights detail-page
 * chrome. Backdrop-blur isn't available without a native module so
 * we approximate with a high-opacity dark fill — still legible over
 * any backdrop palette we ship.
 */
function RoundChip({
  onPress,
  children,
  accessibilityLabel,
}: {
  onPress: () => void;
  children: React.ReactNode;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: "rgba(0,0,0,0.45)",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.12)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────
// Inline icons used by the chip actions + header
// ─────────────────────────────────────────────────────────────────

function ShareIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v13M8 7l4-4 4 4M5 14v6h14v-6"
        stroke={colors.ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function RewindIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11 6L5 12l6 6M19 6l-6 6 6 6"
        stroke={colors.ink}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DiceIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2z"
        stroke={colors.ink}
        strokeWidth={1.7}
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M8.5 8.5h0M15.5 8.5h0M12 12h0M8.5 15.5h0M15.5 15.5h0"
        stroke={colors.ink}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
