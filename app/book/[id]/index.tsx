import { usePreferences } from "@/state/preferences";
import { findExpressBook, expressReadingMinutes } from "@/constants/expressBooks";
import { Host, ContextMenu, Button as NativeButton, Image as NativeImage } from "@expo/ui/swift-ui";
import { accessibilityLabel, frame } from "@expo/ui/swift-ui/modifiers";
import { BookReadingProgress } from "@/components/BookReadingProgress";
import { useEffect, useState } from "react";
import {
  Platform,
  useWindowDimensions,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { cancelAnimation, Easing, interpolate, Extrapolation, runOnUI, scrollTo as scrollOnUI, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useFocusMiniPlayerSpacing } from "@/components/FocusMiniPlayer";
import { BookCover } from "@/components/BookCover";
import { BubbleBackButton } from "@/components/BubbleBackButton";
import { SFSymbol, type SFSymbolName } from "@/components/Symbol";
import { CATEGORY_COVER_PALETTE, getBookCover } from "@/constants/bookCovers";
import { getBookBlurb, getBookTheme } from "@/constants/bookBlurbs";
import { type Book, findBookById, siblingBooks } from "@/constants/books";
import { minTouchTarget, spacing } from "@/constants/spacing";
import { getBookAuthor } from "@/lib/bookAuthors";
import { prefetchChapter } from "@/lib/bible";
import * as haptics from "@/lib/haptics";
import { goBackOr } from "@/lib/navigation";
import { systemText } from "@/lib/typography";
import { useProgress } from "@/state/progress";
import { useColors } from "@/state/theme";

/** Immersive artwork-led book overview, with details and chapters below. */
export default function BookOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const book = id ? findBookById(id) : undefined;

  if (!book) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: "transparent" }} edges={["top", "bottom"]}>
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

  return <BookDetail key={book.id} book={book} />;
}

function BookDetail({ book }: { book: Book }) {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height, width, fontScale } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const focusSpacing = useFocusMiniPlayerSpacing();
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const currentY = useSharedValue(0);
  const targetY = useSharedValue(0);
  const autoScrolling = useSharedValue(false);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => { currentY.value = event.contentOffset.y; },
    onBeginDrag: () => { autoScrolling.value = false; cancelAnimation(targetY); },
  });
  useDerivedValue(() => {
    if (autoScrolling.value) scrollOnUI(scrollRef, 0, targetY.value, false);
  });
  const headerShade = useAnimatedStyle(() => ({
    opacity: interpolate(currentY.value, [height * 0.3, height * 0.6], [0, 1], Extrapolation.CLAMP),
  }));
  useEffect(() => () => { cancelAnimation(targetY); }, [targetY]);
  useEffect(() => {
    if (reducedMotion) { autoScrolling.value = false; cancelAnimation(targetY); }
  }, [reducedMotion, autoScrolling, targetY]);
  const [aboutY, setAboutY] = useState(0);
  const [chaptersY, setChaptersY] = useState(0);
  const [liked, setLiked] = useState(false);
  const readPress = useSharedValue(0);
  const readButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: reducedMotion ? 1 : 1 - readPress.value * 0.035 }],
    opacity: 1 - readPress.value * 0.12,
  }));
  const readArrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: reducedMotion ? 0 : readPress.value * 3 }],
  }));
  const animateReadPress = (pressed: boolean) => {
    readPress.value = reducedMotion ? (pressed ? 1 : 0) : withSpring(pressed ? 1 : 0, {
      duration: pressed ? 120 : 220, dampingRatio: 1,
    });
  };
  const { lastVisited, hasReadChapter, chaptersRead } = useProgress();
  const { translation } = usePreferences();
  const express = findExpressBook(book.id);
  const blurb = getBookBlurb(book.id);
  const theme = getBookTheme(book.id);
  const author = getBookAuthor(book.id);
  const siblings = siblingBooks(book.id);
  const cover = getBookCover(book.id);
  const resumeChapter = lastVisited?.bookId === book.id ? lastVisited.chapter : null;
  const readCount = new Set(chaptersRead.filter(c => c.bookId === book.id && c.chapter >= 1 && c.chapter <= book.chapters).map(c => c.chapter)).size;
  const started = resumeChapter !== null || readCount > 0;
  const nextUnread = Array.from({ length: book.chapters }, (_, i) => i + 1).find(chapter => !hasReadChapter(book.id, chapter));
  const continueChapter = resumeChapter !== null && !hasReadChapter(book.id, resumeChapter) ? resumeChapter : nextUnread ?? 1;
  // Load the selected translation while the cover is visible, before the tap.
  useEffect(() => {
    prefetchChapter(book.id, started ? continueChapter : 1, translation.id);
  }, [book.id, started, continueChapter, translation.id]);
  const openChapter = (chapter: number) => router.push(`/book/${book.id}/${chapter}`);
  const scrollTo = (y: number) => {
    haptics.soft();
    const destination = Math.max(0, y - insets.top - 64);
    runOnUI((nextY: number, reduce: boolean) => {
      "worklet";
      autoScrolling.value = false;
      cancelAnimation(targetY);
      if (reduce) {
        scrollOnUI(scrollRef, 0, nextY, false);
        return;
      }
      targetY.value = currentY.value;
      autoScrolling.value = true;
      targetY.value = withTiming(nextY, {
        duration: Math.min(650, Math.max(320, Math.abs(nextY - currentY.value) * 0.65)),
        easing: Easing.inOut(Easing.cubic),
      });
    })(destination, reducedMotion);
  };
  const share = async () => {
    try { await Share.share({ message: `${book.name} — ${author}` }); } catch { /* Share sheet dismissed. */ }
  };
  // Text grows naturally at accessibility sizes; the illustration never dictates
  // a fixed text box. The lower edge stays readable regardless of artwork color.
  const artSpace = Math.max(200, Math.min(height * 0.52, width * 1.2) - 88);
  const font = (size: number) => size * fontScale;
  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      <Animated.ScrollView ref={scrollRef} onScroll={scrollHandler} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingBottom: insets.bottom + focusSpacing + 24 }}>
        <View style={{ minHeight: height - focusSpacing, justifyContent: "flex-end", paddingTop: insets.top + 64 + artSpace, paddingBottom: Math.max(insets.bottom, 20) + 16 }}>
          <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
            {cover ? <Image source={cover} contentFit="cover" contentPosition="top center" style={[StyleSheet.absoluteFill, { bottom: undefined, height: "84%" }]} /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: CATEGORY_COVER_PALETTE[book.category].top }]} />}
            <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              <Defs><LinearGradient id="bookHeroShade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#000000" stopOpacity={0.24} />
                <Stop offset="0.35" stopColor="#000000" stopOpacity={0} />
                <Stop offset="0.53" stopColor="#000000" stopOpacity={0.30} />
                <Stop offset="0.68" stopColor="#000000" stopOpacity={0.85} />
                <Stop offset="0.83" stopColor="#000000" stopOpacity={1} />
                <Stop offset="1" stopColor="#000000" />
              </LinearGradient></Defs>
              <Rect width="100%" height="100%" fill="url(#bookHeroShade)" />
            </Svg>
          </View>
          <View style={{ paddingHorizontal: 32, width: "100%", maxWidth: 540, alignSelf: "center", alignItems: "center" }}>
            <Text allowFontScaling={false} style={{ fontSize: font(10), lineHeight: font(16), letterSpacing: 2.4, fontWeight: "600", color: "#D3D7DE", textAlign: "center" }}>{book.testament === "old" ? "OLD TESTAMENT" : "NEW TESTAMENT"}</Text>
            <Text accessibilityRole="header" allowFontScaling={false} style={{ fontFamily: "System", fontSize: font(36), lineHeight: font(44), fontWeight: "700", letterSpacing: -0.8, color: "white", textAlign: "center", marginTop: 6 }}>{book.name}</Text>
            <Text allowFontScaling={false} style={{ fontFamily: "System", fontSize: font(15), lineHeight: font(22), color: "#D3D7DE", textAlign: "center", marginTop: 6 }}>{theme || blurb}</Text>
            <Text allowFontScaling={false} style={{ fontSize: font(12), lineHeight: font(18), color: "#B3BBC7", marginTop: 10 }}>{book.chapters} {book.chapters === 1 ? "chapter" : "chapters"}</Text>
            {started && <BookReadingProgress read={readCount} total={book.chapters}
              onContinue={() => { haptics.soft(); openChapter(continueChapter); }}
              continueLabel={`${readCount === book.chapters ? "Read again" : "Continue reading"}, ${book.name}, chapter ${continueChapter}`}
            />}
            {!started && <Animated.View style={[{ marginTop: 18 }, readButtonStyle]}>
            <Pressable onPress={() => { haptics.soft(); openChapter(resumeChapter ?? 1); }} onPressIn={() => { animateReadPress(true); prefetchChapter(book.id, resumeChapter ?? 1, translation.id); }} onPressOut={() => animateReadPress(false)} accessibilityRole="button" accessibilityLabel={resumeChapter ? `Continue ${book.name}, chapter ${resumeChapter}` : `Read ${book.name}, chapter 1`}
              style={{ backgroundColor: "#FFFFFF", borderRadius: 999, minHeight: 48, paddingHorizontal: 26, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Text allowFontScaling={false} style={{ color: "#101722", fontSize: font(15), lineHeight: font(22), fontWeight: "700" }}>{resumeChapter ? "Continue Reading" : "Read Now"}</Text>
              <Animated.View style={readArrowStyle}><SFSymbol name="arrow.right" size={18} color="#101722" weight="semibold" /></Animated.View>
            </Pressable>
            </Animated.View>}
            {express && <Pressable accessibilityRole="button" accessibilityLabel={`Read ${book.name} Express version`} onPress={() => { haptics.soft(); router.push(`/book/${book.id}/express`); }} style={{ minHeight: 48, marginTop: 12, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: "#FFFFFF40", backgroundColor: "#FFFFFF10", flexDirection: "row", alignItems: "center", gap: 10 }}>
              <SFSymbol name="bolt" color="white" size={17} />
              <Text style={{ color: "white", fontSize: 15, fontWeight: "600" }}>Read Express</Text>
              <Text style={{ color: "#CDD3DC", fontSize: 13 }}>{expressReadingMinutes(express)} min</Text>
            </Pressable>}
            <Pressable onPress={() => scrollTo(aboutY)} accessibilityRole="button" accessibilityLabel="About this book and chapters" style={{ minHeight: 44, marginTop: 10, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 }}>
              <Text allowFontScaling={false} style={{ fontSize: font(12), lineHeight: font(18), color: "#CDD3DC" }}>About this book</Text><SFSymbol name="chevron.down" size={12} color="#CDD3DC" />
            </Pressable>
          </View>
        </View>
        <View onLayout={e => setAboutY(e.nativeEvent.layout.y)} style={{ backgroundColor: colors.bg, paddingVertical: 28 }}>
          <View style={{ paddingHorizontal: 24 }}>
            <Text accessibilityRole="header" style={[systemText.title2, { color: colors.ink }]}>About {book.name}</Text>
            <Text style={[systemText.footnote, { color: colors.inkMuted, marginTop: 8, marginBottom: 16 }]}>{author} · {book.category} · Approximately {book.chapters * 4} minutes</Text>
            {blurb ? <AboutBlurb text={blurb} color={colors.inkMuted} /> : null}
          </View>
          <View onLayout={e => setChaptersY(e.nativeEvent.layout.y)} style={{ paddingHorizontal: 24, marginTop: 28 }}>
            <Text accessibilityRole="header" style={[systemText.title3, { color: colors.ink }]}>Chapters</Text>
            <Text style={[systemText.footnote, { color: colors.inkMuted, marginTop: 4, marginBottom: 12 }]}>{readCount > 0 ? `${readCount} of ${book.chapters} read` : `${book.chapters} total`}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -3 }}>
              {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => <ChapterTile key={chapter} number={chapter} read={hasReadChapter(book.id, chapter)} isResume={chapter === resumeChapter} onPress={() => openChapter(chapter)} />)}
            </View>
          </View>
          {siblings.length > 0 && <View style={{ marginTop: 28 }}>
            <Text accessibilityRole="header" style={[systemText.title3, { color: colors.ink, paddingHorizontal: 24, marginBottom: 16 }]}>More {book.category}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, gap: 12 }}>
              {siblings.map(sibling => <SiblingCard key={sibling.id} book={sibling} onPress={() => router.replace(`/book/${sibling.id}`)} />)}
            </ScrollView>
          </View>}
        </View>
      </Animated.ScrollView>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 8, flexDirection: "row", justifyContent: "space-between" }} pointerEvents="box-none">
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "#000000" }, headerShade]} />
        <CircleButton icon="chevron.left" label="Back" tint="white" bg="rgba(10,15,24,0.48)" border="rgba(255,255,255,0.12)" onPress={() => goBackOr(router, "/(tabs)/library")} />
        <Host colorScheme="dark" style={{ width: 48, height: 48 }}>
          <ContextMenu activationMethod="singlePress">
            <ContextMenu.Trigger>
              <NativeButton variant="bordered" modifiers={[accessibilityLabel("Book options")]}>
                <NativeImage systemName="ellipsis" size={22} color="white" modifiers={[frame({ width: 24, height: 28 })]} />
              </NativeButton>
            </ContextMenu.Trigger>
            <ContextMenu.Items>
              {express && <NativeButton systemImage="bolt" onPress={() => router.push(`/book/${book.id}/express`)}>Read Express</NativeButton>}
              <NativeButton systemImage="headphones" onPress={() => router.push(`/book/${book.id}/audio`)}>Listen to book</NativeButton>
              <NativeButton systemImage="list.bullet" onPress={() => scrollTo(aboutY + chaptersY)}>Choose a chapter</NativeButton>
              <NativeButton systemImage={liked ? "heart.fill" : "heart"} onPress={() => setLiked(value => !value)}>{liked ? "Remove from favorites" : "Add to favorites"}</NativeButton>
              <NativeButton systemImage="square.and.arrow.up" onPress={() => { void share(); }}>Share book</NativeButton>
            </ContextMenu.Items>
          </ContextMenu>
        </Host>
      </View>
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
        width: 44,
        height: 44,
        borderRadius: 22,
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
