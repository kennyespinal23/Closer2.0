import { useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
  type ScrollView as ScrollViewType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookCover } from "@/components/BookCover";
import { SFSymbol } from "@/components/Symbol";
import { COMPLETED_READ_GREEN } from "@/constants/heroChrome";
import { CATEGORY_COVER_PALETTE } from "@/constants/bookCovers";
import { getBookBlurb } from "@/constants/bookBlurbs";
import { type Book, findBookById, siblingBooks } from "@/constants/books";
import { minTouchTarget, spacing } from "@/constants/spacing";
import { getBookAuthor } from "@/lib/bookAuthors";
import { prefetchChapter } from "@/lib/bible";
import { typography } from "@/lib/typography";
import { useProgress } from "@/state/progress";
import { useColors } from "@/state/theme";

/**
 * Book detail — GoodReader-style overview adapted for Closer's
 * Bible library.
 *
 * Layout (top → bottom):
 *   1. Header — back · Closer · search (Library)
 *   2. Hero row — cover left, title / author / stats / category tag
 *   3. Synopsis
 *   4. Dual CTA — Read Now (green) + Chapters (white)
 *   5. Chapter grid (anchored by the Chapters button)
 *   6. Bottom shelf — sibling books from the same category
 */
export default function BookOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const book = id ? findBookById(id) : undefined;

  if (!book) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        <Header />
        <View className="flex-1 items-center justify-center px-6">
          <Text
            className="text-ink text-[18px]"
            style={{ fontFamily: "System", fontWeight: "700" }}
          >
            We don&apos;t know that book.
          </Text>
          <Text
            className="text-ink-muted text-[13px] mt-2 text-center"
            style={{ fontFamily: "System", fontWeight: "400" }}
          >
            Head back to the Library and try another.
          </Text>
          <Pressable
            onPress={() => router.back()}
            className="mt-6 px-5 py-3 rounded-full bg-primary"
            style={{ minHeight: minTouchTarget, justifyContent: "center" }}
          >
            <Text
              className="text-primary-fg text-[13px]"
              style={{ fontFamily: "System", fontWeight: "700" }}
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

function BookDetail({ book }: { book: Book }) {
  const router = useRouter();
  const colors = useColors();
  const scrollRef = useRef<ScrollViewType>(null);
  const [chaptersY, setChaptersY] = useState(0);
  const { lastVisited, hasReadChapter, chaptersRead } = useProgress();
  const blurb = useMemo(() => getBookBlurb(book.id), [book.id]);
  const siblings = useMemo(() => siblingBooks(book.id), [book.id]);
  const author = useMemo(() => getBookAuthor(book.id), [book.id]);
  const categoryTint = CATEGORY_COVER_PALETTE[book.category]?.accent ?? "#EA333F";

  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  const openChapter = (chapter: number) => {
    router.push(`/book/${book.id}/${chapter}`);
  };

  const resumeChapter =
    lastVisited && lastVisited.bookId === book.id
      ? lastVisited.chapter
      : null;

  const readCount = useMemo(
    () => chaptersRead.filter((c) => c.bookId === book.id).length,
    [chaptersRead, book.id],
  );

  const estMinutes = book.chapters * 4;
  const primaryLabel = resumeChapter ? "Continue" : "Read Now";
  const scrollToChapters = () => {
    scrollRef.current?.scrollTo({ y: Math.max(0, chaptersY - 12), animated: true });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <Header />

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: spacing[48] }}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Hero: cover + metadata ───────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              paddingHorizontal: spacing[16],
              paddingTop: spacing[8],
              gap: spacing[16],
            }}
          >
            <View
              style={{
                width: 128,
                ...Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.45,
                    shadowRadius: 18,
                  },
                  android: { elevation: 12 },
                }),
              }}
            >
              <BookCover book={book} variant="card" />
            </View>

            <View style={{ flex: 1, paddingTop: 2 }}>
              <Text
                style={[
                  typography.devotionalTitle,
                  {
                    color: colors.ink,
                    fontSize: 22,
                    lineHeight: 28,
                  },
                ]}
                numberOfLines={3}
              >
                {book.name}
              </Text>
              <Text
                style={{
                  marginTop: spacing[4],
                  fontFamily: "System",
                  fontWeight: "500",
                  fontSize: 14,
                  color: colors.inkMuted,
                }}
                numberOfLines={1}
              >
                {author}
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginTop: spacing[12],
                  gap: spacing[12],
                }}
              >
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "500",
                    fontSize: 13,
                    color: colors.inkMuted,
                  }}
                >
                  {book.chapters} {book.chapters === 1 ? "Chapter" : "Chapters"}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <SFSymbol
                    name="eye"
                    size={13}
                    color={colors.inkMuted}
                    weight="medium"
                  />
                  <Text
                    style={{
                      fontFamily: "System",
                      fontWeight: "500",
                      fontSize: 13,
                      color: colors.inkMuted,
                    }}
                  >
                    {estMinutes}m
                  </Text>
                </View>
              </View>

              <View
                style={{
                  alignSelf: "flex-start",
                  marginTop: spacing[12],
                  backgroundColor: categoryTint,
                  paddingHorizontal: spacing[12],
                  paddingVertical: spacing[4],
                  borderRadius: 999,
                  minHeight: 28,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "700",
                    fontSize: 12,
                    color: "#FFFFFF",
                  }}
                >
                  #{book.category.replace(/\s+/g, "").toLowerCase()}
                </Text>
              </View>

              {readCount > 0 ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginTop: spacing[12],
                    gap: spacing[8],
                  }}
                >
                  <ProgressDots
                    read={readCount}
                    total={book.chapters}
                    color={COMPLETED_READ_GREEN}
                  />
                  <Text
                    style={{
                      fontFamily: "System",
                      fontWeight: "600",
                      fontSize: 12,
                      color: colors.inkMuted,
                    }}
                  >
                    {readCount}/{book.chapters} read
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* ─── Synopsis ─────────────────────────────────────── */}
          {blurb ? (
            <View style={{ paddingHorizontal: spacing[16], marginTop: spacing[24] }}>
              <Text
                style={{
                  fontFamily: "System",
                  fontWeight: "700",
                  fontSize: 17,
                  color: colors.ink,
                  marginBottom: spacing[8],
                }}
              >
                Synopsis
              </Text>
              <AboutBlurb text={blurb} color={colors.inkMuted} />
            </View>
          ) : null}

          {/* ─── Dual CTA ─────────────────────────────────────── */}
          <View style={{ paddingHorizontal: spacing[16], marginTop: spacing[24] }}>
            <View
              style={{
                flexDirection: "row",
                borderRadius: 999,
                overflow: "hidden",
                backgroundColor: colors.surfaceSecondary,
              }}
            >
              <Pressable
                onPress={() => openChapter(resumeChapter ?? 1)}
                accessibilityRole="button"
                accessibilityLabel={primaryLabel}
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: minTouchTarget + 8,
                  backgroundColor: COMPLETED_READ_GREEN,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.88 : 1,
                  paddingHorizontal: spacing[12],
                })}
              >
                <Text
                  style={[
                    typography.button,
                    { color: "#FFFFFF", fontWeight: "700" },
                  ]}
                >
                  {primaryLabel}
                </Text>
              </Pressable>
              <View
                style={{
                  width: 1,
                  backgroundColor: "rgba(0,0,0,0.12)",
                }}
              />
              <Pressable
                onPress={scrollToChapters}
                accessibilityRole="button"
                accessibilityLabel="Browse chapters"
                style={({ pressed }) => ({
                  flex: 1,
                  minHeight: minTouchTarget + 8,
                  backgroundColor: "#F2F2F7",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.88 : 1,
                  paddingHorizontal: spacing[12],
                })}
              >
                <Text
                  style={[
                    typography.button,
                    { color: "#1C1C1E", fontWeight: "700" },
                  ]}
                >
                  Chapters
                </Text>
              </Pressable>
            </View>
            {resumeChapter && resumeChapter !== 1 ? (
              <Pressable
                onPress={() => openChapter(1)}
                hitSlop={8}
                style={{
                  alignSelf: "center",
                  marginTop: spacing[12],
                  minHeight: minTouchTarget,
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "System",
                    fontWeight: "600",
                    fontSize: 13,
                    color: colors.inkMuted,
                  }}
                >
                  Start from chapter 1
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* ─── Chapters grid ────────────────────────────────── */}
          <View
            onLayout={(e) => setChaptersY(e.nativeEvent.layout.y)}
            style={{ paddingHorizontal: spacing[16], marginTop: spacing[32] }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: spacing[12],
              }}
            >
              <Text
                style={{
                  fontFamily: "System",
                  fontWeight: "700",
                  fontSize: 17,
                  color: colors.ink,
                }}
              >
                Chapters
              </Text>
              <Text
                style={{
                  fontFamily: "System",
                  fontWeight: "600",
                  fontSize: 12,
                  color: colors.inkSubtle,
                }}
              >
                {readCount > 0
                  ? `${readCount} of ${book.chapters} read`
                  : `${book.chapters} total`}
              </Text>
            </View>
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
          </View>

          {/* ─── More from category shelf ─────────────────────── */}
          {siblings.length > 0 ? (
            <View
              style={{
                marginTop: spacing[32],
                backgroundColor: colors.surface,
                borderTopLeftRadius: spacing[24],
                borderTopRightRadius: spacing[24],
                paddingTop: spacing[12],
                paddingBottom: spacing[16],
              }}
            >
              <View
                style={{
                  alignSelf: "center",
                  width: 40,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: COMPLETED_READ_GREEN,
                  marginBottom: spacing[16],
                }}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: spacing[16],
                  gap: spacing[12],
                }}
              >
                {siblings.map((sibling) => (
                  <SiblingCard
                    key={sibling.id}
                    book={sibling}
                    onPress={() => router.replace(`/book/${sibling.id}`)}
                  />
                ))}
              </ScrollView>
            </View>
          ) : null}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Pieces
// ─────────────────────────────────────────────────────────────────

function Header() {
  const router = useRouter();
  const { ink } = useColors();

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: spacing[8],
        paddingTop: spacing[4],
        paddingBottom: spacing[8],
        minHeight: minTouchTarget,
      }}
    >
      <Pressable
        onPress={() => router.back()}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={{
          width: minTouchTarget,
          height: minTouchTarget,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SFSymbol name="chevron.left" size={20} color={ink} weight="semibold" />
      </Pressable>
      <Text
        style={{
          flex: 1,
          textAlign: "center",
          fontFamily: "System",
          fontWeight: "600",
          fontSize: 17,
          color: ink,
        }}
      >
        Closer
      </Text>
      <Pressable
        onPress={() => router.push("/(tabs)/library")}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Search Library"
        style={{
          width: minTouchTarget,
          height: minTouchTarget,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <SFSymbol name="magnifyingglass" size={20} color={ink} weight="medium" />
      </Pressable>
    </View>
  );
}

function ProgressDots({
  read,
  total,
  color,
}: {
  read: number;
  total: number;
  color: string;
}) {
  const slots = 5;
  const filled = Math.max(1, Math.round((read / Math.max(total, 1)) * slots));
  return (
    <View style={{ flexDirection: "row" }}>
      {Array.from({ length: slots }, (_, i) => (
        <View
          key={i}
          style={{
            width: 18,
            height: 18,
            borderRadius: 9,
            marginLeft: i === 0 ? 0 : -6,
            backgroundColor: i < filled ? color : "rgba(128,128,128,0.35)",
            borderWidth: 1.5,
            borderColor: "#000",
          }}
        />
      ))}
    </View>
  );
}

function AboutBlurb({ text, color }: { text: string; color: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View>
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "400",
          fontSize: 15,
          lineHeight: 22,
          color,
        }}
        numberOfLines={expanded ? undefined : 4}
      >
        {text}
      </Text>
      {text.length > 280 ? (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          hitSlop={6}
          style={{ marginTop: spacing[8], minHeight: minTouchTarget / 2 }}
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 13,
              color: COMPLETED_READ_GREEN,
            }}
          >
            {expanded ? "Show less" : "Read more"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

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
  const { primary, ink, border, surface, accentSoft } = useColors();
  const showReadGlow = read && !isResume;
  return (
    <View style={{ width: "20%", padding: 3 }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
      >
        <View
          style={{
            aspectRatio: 1,
            borderRadius: spacing[12],
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: isResume || showReadGlow ? accentSoft : surface,
            borderWidth: 1,
            borderColor: isResume || showReadGlow ? primary : border,
          }}
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 14,
              color: isResume || showReadGlow ? primary : ink,
            }}
          >
            {number}
          </Text>
          {showReadGlow ? (
            <View style={{ position: "absolute", top: 5, right: 5 }}>
              <SFSymbol
                name="checkmark.circle.fill"
                size={14}
                color={primary}
              />
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

function SiblingCard({ book, onPress }: { book: Book; onPress: () => void }) {
  const { ink } = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        opacity: pressed ? 0.8 : 1,
        width: 110,
      })}
    >
      <View style={{ width: 110 }}>
        <BookCover book={book} variant="card" />
      </View>
      <Text
        style={{
          marginTop: spacing[8],
          fontFamily: "System",
          fontWeight: "700",
          fontSize: 13,
          color: ink,
          textAlign: "center",
        }}
        numberOfLines={2}
      >
        {book.name}
      </Text>
    </Pressable>
  );
}
