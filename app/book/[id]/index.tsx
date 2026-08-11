import { useMemo, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  type ScrollView as ScrollViewType,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { BookCover } from "@/components/BookCover";
import { BubbleBackButton } from "@/components/BubbleBackButton";
import { SFSymbol, type SFSymbolName } from "@/components/Symbol";
import { CATEGORY_COVER_PALETTE } from "@/constants/bookCovers";
import { getBookBlurb, getBookTheme } from "@/constants/bookBlurbs";
import { type Book, findBookById, siblingBooks } from "@/constants/books";
import { minTouchTarget, spacing } from "@/constants/spacing";
import { type ColorPalette } from "@/constants/theme";
import { getBookAuthor } from "@/lib/bookAuthors";
import { prefetchChapter } from "@/lib/bible";
import * as haptics from "@/lib/haptics";
import { goBackOr } from "@/lib/navigation";
import { NEW_YORK, systemText, typography } from "@/lib/typography";
import { useProgress } from "@/state/progress";
import { useColors, useResolvedScheme } from "@/state/theme";

/**
 * Book detail — a centered "storefront" hero (cover → title → stats →
 * about) over a soft category-tinted wash, with a pinned Read / Chapters
 * action bar. The chapter grid + sibling shelf live further down the
 * scroll so the top reads like a clean product page.
 */
export default function BookOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const book = id ? findBookById(id) : undefined;

  if (!book) {
    return (
      <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
        <NotFoundHeader />
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
            onPress={() => goBackOr(router, "/(tabs)/library")}
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
  const scheme = useResolvedScheme();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollViewType>(null);
  const [chaptersY, setChaptersY] = useState(0);
  const [liked, setLiked] = useState(false);
  const { lastVisited, hasReadChapter, chaptersRead } = useProgress();
  const blurb = useMemo(() => getBookBlurb(book.id), [book.id]);
  const theme = useMemo(() => getBookTheme(book.id), [book.id]);
  const siblings = useMemo(() => siblingBooks(book.id), [book.id]);
  const author = useMemo(() => getBookAuthor(book.id), [book.id]);
  const palette = CATEGORY_COVER_PALETTE[book.category];

  const chapters = Array.from({ length: book.chapters }, (_, i) => i + 1);

  const openChapter = (chapter: number) => {
    router.push(`/book/${book.id}/${chapter}`);
  };

  const resumeChapter =
    lastVisited && lastVisited.bookId === book.id ? lastVisited.chapter : null;

  const readCount = useMemo(
    () => chaptersRead.filter((c) => c.bookId === book.id).length,
    [chaptersRead, book.id],
  );

  const estMinutes = book.chapters * 4;
  const primaryLabel = resumeChapter ? "Continue" : "Read";
  const scrollToChapters = () => {
    haptics.soft();
    scrollRef.current?.scrollTo({
      y: Math.max(0, chaptersY - 12),
      animated: true,
    });
  };

  // Frosted circular controls — theme-aware translucency.
  const chipBg =
    scheme === "dark" ? "rgba(120,120,128,0.36)" : "rgba(255,255,255,0.78)";
  const chipBorder =
    scheme === "dark" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.05)";

  // Height reserved so the scroll never hides behind the pinned bar.
  const footerClearance = 52 + spacing[24] + insets.bottom + spacing[16];

  const share = async () => {
    haptics.soft();
    try {
      await Share.share({ message: `${book.name} — ${author}` });
    } catch {
      /* user dismissed the share sheet */
    }
  };

  const toggleLike = () => {
    haptics.soft();
    setLiked((v) => !v);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <AmbientWash color={palette?.top ?? colors.accentSoft} scheme={scheme} />

      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* ─── Floating top bar ─────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: spacing[16],
            paddingTop: spacing[4],
            paddingBottom: spacing[8],
          }}
        >
          <CircleButton
            icon="chevron.left"
            label="Back"
            tint={colors.ink}
            bg={chipBg}
            border={chipBorder}
            onPress={() => {
              haptics.soft();
              goBackOr(router, "/(tabs)/library");
            }}
          />
          <View style={{ flexDirection: "row", gap: spacing[12] }}>
            <CircleButton
              icon={liked ? "heart.fill" : "heart"}
              label={liked ? "Remove from favorites" : "Add to favorites"}
              tint={liked ? "#FF3B30" : colors.ink}
              bg={chipBg}
              border={chipBorder}
              onPress={toggleLike}
            />
            <CircleButton
              icon="ellipsis"
              label="More"
              tint={colors.ink}
              bg={chipBg}
              border={chipBorder}
              onPress={share}
            />
          </View>
        </View>

        <ScrollView
          ref={scrollRef}
          contentContainerStyle={{ paddingBottom: footerClearance }}
          showsVerticalScrollIndicator={false}
        >
          {/* ─── Cover ──────────────────────────────────────────── */}
          <View style={{ alignItems: "center", marginTop: spacing[8] }}>
            <View
              style={{
                width: 188,
                borderRadius: 16,
                ...Platform.select({
                  ios: {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 14 },
                    shadowOpacity: scheme === "dark" ? 0.5 : 0.28,
                    shadowRadius: 24,
                  },
                  android: { elevation: 14 },
                }),
              }}
            >
              <BookCover book={book} variant="card" />
            </View>
          </View>

          {/* ─── Title · theme · author ─────────────────────────── */}
          <Text
            style={[
              systemText.title1,
              {
                color: colors.ink,
                textAlign: "center",
                marginTop: spacing[24],
                paddingHorizontal: spacing[24],
              },
            ]}
            numberOfLines={2}
          >
            {book.name}
          </Text>
          {theme ? (
            <Text
              style={{
                fontFamily: NEW_YORK,
                fontStyle: "italic",
                fontWeight: "400",
                fontSize: 17,
                lineHeight: 24,
                color: colors.inkMuted,
                textAlign: "center",
                marginTop: spacing[8],
                paddingHorizontal: spacing[32],
              }}
            >
              &ldquo;{theme}&rdquo;
            </Text>
          ) : null}
          <Text
            style={[
              systemText.subheadline,
              {
                color: colors.inkMuted,
                textAlign: "center",
                marginTop: theme ? spacing[8] : spacing[4],
              },
            ]}
            numberOfLines={1}
          >
            {author}
          </Text>

          {/* ─── Tags ───────────────────────────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: spacing[8],
              marginTop: spacing[12],
              paddingHorizontal: spacing[24],
            }}
          >
            <Tag label={book.category} colors={colors} />
            <Tag
              label={book.testament === "old" ? "Old Testament" : "New Testament"}
              colors={colors}
            />
          </View>

          {/* ─── Stats card ─────────────────────────────────────── */}
          <View
            style={{
              flexDirection: "row",
              marginHorizontal: spacing[16],
              marginTop: spacing[24],
              backgroundColor: colors.surface,
              borderRadius: 20,
              paddingVertical: spacing[16],
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: colors.border,
              ...Platform.select({
                ios: {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: scheme === "dark" ? 0.3 : 0.06,
                  shadowRadius: 14,
                },
                android: { elevation: 3 },
              }),
            }}
          >
            <StatColumn
              icon="clock"
              label="Minutes"
              value={`${estMinutes}`}
              colors={colors}
            />
            <StatDivider color={colors.border} />
            <StatColumn
              icon="list.bullet"
              label="Chapters"
              value={`${book.chapters}`}
              colors={colors}
            />
            <StatDivider color={colors.border} />
            <StatColumn
              icon="book.closed"
              label="Testament"
              value={book.testament === "old" ? "Old" : "New"}
              colors={colors}
            />
          </View>

          {/* ─── About ──────────────────────────────────────────── */}
          {blurb ? (
            <View
              style={{
                marginHorizontal: spacing[16],
                marginTop: spacing[16],
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: spacing[16],
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: colors.border,
              }}
            >
              <Text
                style={[
                  systemText.title3,
                  { color: colors.ink, marginBottom: spacing[8] },
                ]}
              >
                About
              </Text>
              <AboutBlurb text={blurb} color={colors.inkMuted} />
            </View>
          ) : null}

          {/* ─── Chapters grid ──────────────────────────────────── */}
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
              <Text style={[systemText.title3, { color: colors.ink }]}>
                Chapters
              </Text>
              <Text
                style={[systemText.footnote, { color: colors.inkMuted }]}
              >
                {readCount > 0
                  ? `${readCount} of ${book.chapters} read`
                  : `${book.chapters} total`}
              </Text>
            </View>
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 }}
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

          {/* ─── More from this category ────────────────────────── */}
          {siblings.length > 0 ? (
            <View style={{ marginTop: spacing[32] }}>
              <Text
                style={[
                  systemText.title3,
                  {
                    color: colors.ink,
                    paddingHorizontal: spacing[16],
                    marginBottom: spacing[12],
                  },
                ]}
              >
                More {book.category}
              </Text>
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

      {/* ─── Pinned action bar ────────────────────────────────── */}
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          elevation: 20,
          backgroundColor: colors.bg,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: colors.border,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            gap: spacing[12],
            paddingHorizontal: spacing[16],
            paddingTop: spacing[12],
            paddingBottom: insets.bottom + spacing[12],
          }}
        >
          <ActionButton
            label={primaryLabel}
            filled
            colors={colors}
            onPress={() => openChapter(resumeChapter ?? 1)}
          />
          <ActionButton
            label="Chapters"
            colors={colors}
            onPress={scrollToChapters}
          />
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Pieces
// ─────────────────────────────────────────────────────────────────

/** Soft category-tinted wash behind the hero, fading to the canvas. */
function AmbientWash({ color, scheme }: { color: string; scheme: string }) {
  const topOpacity = scheme === "dark" ? 0.34 : 0.24;
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 10 10">
        <Defs>
          <LinearGradient id="ambientWash" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={topOpacity} />
            <Stop offset="0.55" stopColor={color} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="10" height="10" fill="url(#ambientWash)" />
      </Svg>
    </View>
  );
}

function CircleButton({
  icon,
  label,
  tint,
  bg,
  border,
  onPress,
}: {
  icon: SFSymbolName;
  label: string;
  tint: string;
  bg: string;
  border: string;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  // NOTE: this app's Pressable drops function-form `style` backgrounds,
  // so visuals use a plain style object and press feedback is driven
  // by local state instead of the ({ pressed }) callback.
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: bg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: border,
        opacity: pressed ? 0.6 : 1,
        ...Platform.select({
          ios: {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
          },
          android: { elevation: 3 },
        }),
      }}
    >
      <SFSymbol name={icon} size={18} color={tint} weight="semibold" />
    </Pressable>
  );
}

function ActionButton({
  label,
  filled = false,
  colors,
  onPress,
}: {
  label: string;
  filled?: boolean;
  colors: ColorPalette;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={{
        flex: 1,
        height: 52,
        borderRadius: 26,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: filled ? colors.primary : colors.surface,
        borderWidth: filled ? 0 : 1,
        borderColor: colors.border,
        opacity: pressed ? 0.85 : 1,
      }}
    >
      <Text
        style={[typography.button, { color: filled ? colors.primaryFg : colors.ink }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function StatColumn({
  icon,
  label,
  value,
  colors,
}: {
  icon: SFSymbolName;
  label: string;
  value: string;
  colors: ColorPalette;
}) {
  return (
    <View style={{ flex: 1, alignItems: "center", paddingHorizontal: spacing[8] }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          marginBottom: spacing[4],
        }}
      >
        <SFSymbol name={icon} size={12} color={colors.inkSubtle} weight="semibold" />
        <Text style={[systemText.caption1, { color: colors.inkSubtle }]} numberOfLines={1}>
          {label}
        </Text>
      </View>
      <Text
        style={[systemText.title3, { color: colors.ink, fontWeight: "700" }]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function StatDivider({ color }: { color: string }) {
  return (
    <View style={{ width: StyleSheet.hairlineWidth, backgroundColor: color, marginVertical: spacing[4] }} />
  );
}

function Tag({ label, colors }: { label: string; colors: ColorPalette }) {
  return (
    <View
      style={{
        backgroundColor: colors.accentSoft,
        borderRadius: 999,
        paddingHorizontal: spacing[12],
        paddingVertical: spacing[4],
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: colors.border,
      }}
    >
      <Text style={[systemText.caption1, { color: colors.inkMuted }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function NotFoundHeader() {
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
      <BubbleBackButton
        onPress={() => goBackOr(router, "/(tabs)/library")}
        color={ink}
      />
    </View>
  );
}

function AboutBlurb({ text, color }: { text: string; color: string }) {
  return (
    <Text style={[systemText.callout, { color, lineHeight: 22 }]}>{text}</Text>
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
              <SFSymbol name="checkmark.circle.fill" size={14} color={primary} />
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
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, width: 110 })}
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
