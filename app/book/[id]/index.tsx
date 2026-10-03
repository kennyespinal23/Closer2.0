import { SkyGradient } from "@/components/HomeSkyGradient";
import { LibraryBookTransition, type BookTransitionPhase } from "@/components/LibraryBookTransition";
import { useNavigation, usePreventRemove, type NavigationAction } from "@react-navigation/native";
import { takeLibraryOpening, clearLibraryOpening } from "@/lib/libraryOpening";
import { releaseCapture } from "react-native-view-shot";
import { BookReaderPreparation } from "./[chapter]";
import { usePreferences } from "@/state/preferences";
import { findExpressBook, expressReadingMinutes } from "@/constants/expressBooks";
import { Host, ContextMenu, Button as NativeButton, Image as NativeImage } from "@expo/ui/swift-ui";
import { accessibilityLabel, frame } from "@expo/ui/swift-ui/modifiers";
import { BookReadingProgress } from "@/components/BookReadingProgress";
import { useEffect, useRef, useState } from "react";
import { Platform, useWindowDimensions, Pressable, ScrollView, Share, StyleSheet, View } from "react-native";
import { Text } from "@/components/CloserText";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import Animated, { cancelAnimation, Easing, interpolate, Extrapolation, runOnUI, runOnJS, useAnimatedReaction, scrollTo as scrollOnUI, useAnimatedRef, useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { Image } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useFocusMiniPlayerSpacing } from "@/components/FocusMiniPlayer";
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
import { useColors, useResolvedScheme } from "@/state/theme";

/** Immersive artwork-led book overview, with details and chapters below. */
export default function BookOverviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [opening] = useState(() => takeLibraryOpening(id));
  useEffect(() => { clearLibraryOpening(opening); }, [opening]);
  const [phase, setPhase] = useState<BookTransitionPhase>(opening ? "opening" : "idle");
  const [exitReady, setExitReady] = useState(false);
  const exitAction = useRef<NavigationAction | null>(null);
  const navigation = useNavigation();
  usePreventRemove(Boolean(opening && !exitReady), ({ data }) => {
    exitAction.current = data.action;
    setPhase("closing");
  });
  useEffect(() => {
    if (exitReady && exitAction.current) navigation.dispatch(exitAction.current);
  }, [exitReady, navigation]);
  useEffect(() => () => { if (opening?.snapshot) releaseCapture(opening.snapshot); }, [opening]);
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

  const detail = <BookDetail key={book.id} book={book} prepareReader={phase === "idle"} />;
  return opening ? <LibraryBookTransition book={book} source={opening.source} snapshot={opening.snapshot} phase={phase} onOpened={() => setPhase("idle")} onClosed={() => setExitReady(true)}>{detail}</LibraryBookTransition> : detail;
}

function BookDetail({ book, prepareReader = true }: { book: Book; prepareReader?: boolean }) {
  const router = useRouter();
  const colors = useColors();
  const scheme = useResolvedScheme();
  const dark = scheme === "dark";
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
  // Track the actual hero title, including wrapped names and larger text.
  // These measurements do not participate in the reader's pagination or routing.
  const heroContentY = useSharedValue(0);
  const heroTitleBottom = useSharedValue(0);
  const [headerTitleVisible, setHeaderTitleVisible] = useState(false);
  const headerBottom = insets.top + 64;
  const heroActionBottom = useSharedValue(0);
  const [dockVisible, setDockVisible] = useState(false);
  const [dockHeight, setDockHeight] = useState(104);
  const dockOpacity = useSharedValue(0);
  useAnimatedReaction(() => heroActionBottom.value > 0 && currentY.value >= heroContentY.value + heroActionBottom.value - headerBottom, (visible, previous) => {
    if (visible === previous) return;
    runOnJS(setDockVisible)(visible);
    dockOpacity.value = reducedMotion ? (visible ? 1 : 0) : withTiming(visible ? 1 : 0, { duration: visible ? 160 : 100 });
  }, [reducedMotion, headerBottom]);
  const dockStyle = useAnimatedStyle(() => ({ opacity: dockOpacity.value }));

  const titleReveal = useDerivedValue(() => {
    if (heroTitleBottom.value === 0) return 0;
    const threshold = heroContentY.value + heroTitleBottom.value - headerBottom;
    if (reducedMotion) return currentY.value >= threshold ? 1 : 0;
    return interpolate(currentY.value, [threshold - 36, threshold], [0, 1], Extrapolation.CLAMP);
  });
  useAnimatedReaction(() => titleReveal.value >= 0.5, (visible, previous) => {
    if (visible !== previous) runOnJS(setHeaderTitleVisible)(visible);
  });
  const headerTitleStyle = useAnimatedStyle(() => ({ opacity: titleReveal.value }));
  const headerShade = useAnimatedStyle(() => ({
    opacity: Math.max(titleReveal.value, interpolate(currentY.value, [height * 0.3, height * 0.6], [0, 1], Extrapolation.CLAMP)),
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
  // Same four-minute chapter estimate used by the reading progress strip.
  const totalMinutes = book.chapters * 4;
  const totalReadingTime = totalMinutes >= 60
    ? `${Math.floor(totalMinutes / 60)} hr${totalMinutes % 60 ? ` ${totalMinutes % 60} min` : ""}`
    : `${totalMinutes} min`;

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
  const chapterColumns = Math.max(2, Math.min(5, Math.floor((width - 40) / (68 * Math.max(1, fontScale)))));
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {prepareReader && <BookReaderPreparation bookId={book.id} chapter={started ? continueChapter : 1} />}
      <StatusBar style={dark ? "light" : "dark"} />
      <Animated.ScrollView ref={scrollRef} onScroll={scrollHandler} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ backgroundColor: colors.bg, paddingBottom: focusSpacing + dockHeight + 24 }}>
        <View style={{ backgroundColor: colors.bg, minHeight: height - focusSpacing, justifyContent: "flex-end", paddingTop: insets.top + 64 + artSpace, paddingBottom: Math.max(insets.bottom, 20) + 16 }}>
          <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={StyleSheet.absoluteFill}>
            <SkyGradient />
            {cover && <Image source={cover} contentFit="contain" transition={0} style={{ position: "absolute", top: insets.top + 70, alignSelf: "center", width: Math.min(210, width * .5), height: Math.min(298, artSpace - 10) }} />}

            {dark && <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
              <Defs><LinearGradient id="bookHeroShade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#000000" stopOpacity={0.24} />
                <Stop offset="0.35" stopColor="#000000" stopOpacity={0} />
                <Stop offset="0.53" stopColor="#000000" stopOpacity={0.30} />
                <Stop offset="0.68" stopColor="#000000" stopOpacity={0.85} />
                <Stop offset="0.83" stopColor="#000000" stopOpacity={1} />
                <Stop offset="1" stopColor="#000000" />
              </LinearGradient></Defs>
              <Rect width="100%" height="100%" fill="url(#bookHeroShade)" />
            </Svg>}
          </View>
          <View onLayout={event => { heroContentY.value = event.nativeEvent.layout.y; }} style={{ paddingHorizontal: 32, width: "100%", maxWidth: 540, alignSelf: "center", alignItems: "center" }}>
            <Text allowFontScaling={false} style={{ fontSize: font(10), lineHeight: font(16), letterSpacing: 2.4, fontWeight: "600", color: colors.inkMuted, textAlign: "center" }}>{book.testament === "old" ? "OLD TESTAMENT" : "NEW TESTAMENT"}</Text>
            <Text onLayout={event => { heroTitleBottom.value = event.nativeEvent.layout.y + event.nativeEvent.layout.height; }} accessibilityRole="header" allowFontScaling={false} style={{ fontFamily: "System", fontSize: font(36), lineHeight: font(44), fontWeight: "700", letterSpacing: -0.8, color: colors.ink, textAlign: "center", marginTop: 6 }}>{book.name}</Text>
            <Text allowFontScaling={false} style={{ fontFamily: "System", fontSize: font(15), lineHeight: font(22), color: colors.inkMuted, textAlign: "center", marginTop: 8 }}>{theme || blurb}</Text>
            <Text allowFontScaling={false} style={{ fontSize: font(12), lineHeight: font(18), color: colors.inkMuted, textAlign: "center", marginTop: 12 }}>{book.chapters} {book.chapters === 1 ? "chapter" : "chapters"}{!started ? ` · About ${totalReadingTime}` : ""}</Text>
            <View onLayout={event => { heroActionBottom.value = event.nativeEvent.layout.y + event.nativeEvent.layout.height; }} style={{ width: "100%", alignItems: "center" }}>
            {started && <BookReadingProgress read={readCount} total={book.chapters}
              onContinue={() => { haptics.soft(); openChapter(continueChapter); }}
              continueLabel={`${readCount === book.chapters ? "Read again" : "Continue reading"}, ${book.name}, chapter ${continueChapter}`}
            />}
            {!started && <Animated.View style={[{ marginTop: 16 }, readButtonStyle]}>
            <Pressable onPress={() => { haptics.soft(); openChapter(resumeChapter ?? 1); }} onPressIn={() => { animateReadPress(true); prefetchChapter(book.id, resumeChapter ?? 1, translation.id); }} onPressOut={() => animateReadPress(false)} accessibilityRole="button" accessibilityLabel={resumeChapter ? `Continue ${book.name}, chapter ${resumeChapter}` : `Read ${book.name}, chapter 1`}
              style={{ backgroundColor: colors.ink, borderRadius: 999, minHeight: 48, paddingHorizontal: 26, paddingVertical: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <Text allowFontScaling={false} style={{ color: colors.bg, fontSize: font(15), lineHeight: font(22), fontWeight: "700" }}>{resumeChapter ? "Continue Reading" : "Read Now"}</Text>
              <Animated.View style={readArrowStyle}><SFSymbol name="arrow.right" size={18} color={colors.bg} weight="semibold" /></Animated.View>
            </Pressable>
            </Animated.View>}
            </View>
            {express && <Pressable accessibilityRole="button" accessibilityLabel={`Read ${book.name} Express version`} onPress={() => { haptics.soft(); router.push(`/book/${book.id}/express`); }} style={{ minHeight: 48, marginTop: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, flexDirection: "row", alignItems: "center", gap: 10 }}>
              <SFSymbol name="bolt" color={colors.ink} size={17} />
              <Text style={{ color: colors.ink, fontSize: 15, fontWeight: "600" }}>Read Express</Text>
              <Text style={{ color: colors.inkMuted, fontSize: 13 }}>{expressReadingMinutes(express)} min</Text>
            </Pressable>}
            <Pressable onPress={() => scrollTo(aboutY)} accessibilityRole="button" accessibilityLabel="About this book and chapters" style={{ minHeight: 44, marginTop: 8, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12 }}>
              <Text allowFontScaling={false} style={{ fontSize: font(12), lineHeight: font(18), color: colors.inkMuted }}>About this book</Text><SFSymbol name="chevron.down" size={12} color={colors.inkMuted} />
            </Pressable>
          </View>
        </View>
        <View onLayout={e => setAboutY(e.nativeEvent.layout.y)} style={{ backgroundColor: colors.bg, paddingVertical: 28 }}>
          <View style={{ paddingHorizontal: 24 }}>
            <Text accessibilityRole="header" style={[systemText.title2, { color: colors.ink }]}>About {book.name}</Text>
            <Text style={[systemText.footnote, { color: colors.inkMuted, marginTop: 8, marginBottom: 16 }]}>{author} · {book.category}</Text>
            {blurb ? <AboutBlurb text={blurb} color={colors.inkMuted} /> : null}
          </View>
          <View onLayout={e => setChaptersY(e.nativeEvent.layout.y)} style={{ paddingHorizontal: 24, marginTop: 28 }}>
            <Text accessibilityRole="header" style={[systemText.title3, { color: colors.ink }]}>Chapters</Text>
            <Text style={[systemText.footnote, { color: colors.inkMuted, marginTop: 4, marginBottom: 12 }]}>{readCount === book.chapters ? "All chapters completed" : started ? `${readCount} of ${book.chapters} read · Continue at chapter ${continueChapter}` : `${book.chapters} chapters · Choose where to begin`}</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -4 }}>
              {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => <ChapterTile key={chapter} number={chapter} read={hasReadChapter(book.id, chapter)} columns={chapterColumns} isResume={started && readCount < book.chapters && chapter === continueChapter} onPress={() => openChapter(chapter)} />)}
            </View>
          </View>
          {siblings.length > 0 && <View style={{ marginTop: 28 }}>
            <Text accessibilityRole="header" style={[systemText.title3, { color: colors.ink, paddingHorizontal: 24, marginBottom: 16 }]}>More in {book.category}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16, gap: 16 }}>
              {siblings.map(sibling => <SiblingCard key={sibling.id} book={sibling} onPress={() => router.replace(`/book/${sibling.id}`)} />)}
            </ScrollView>
          </View>}
        </View>
      </Animated.ScrollView>
      <Animated.View
        pointerEvents={dockVisible ? "auto" : "none"}
        accessibilityElementsHidden={!dockVisible}
        importantForAccessibility={dockVisible ? "auto" : "no-hide-descendants"}
        onLayout={event => setDockHeight(event.nativeEvent.layout.height)}
        style={[{ position: "absolute", bottom: focusSpacing, left: 0, right: 0, backgroundColor: colors.bg, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingHorizontal: 24, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 12) }, dockStyle]}
      >
        <Animated.View style={[{ width: "100%", maxWidth: 492, alignSelf: "center" }, !started && readButtonStyle]}>
          {started ? <BookReadingProgress compact read={readCount} total={book.chapters}
            onContinue={() => { haptics.soft(); openChapter(continueChapter); }}
            continueLabel={`${readCount === book.chapters ? "Read again" : "Continue reading"}, ${book.name}, chapter ${continueChapter}`}
          /> : <Pressable accessibilityRole="button" accessibilityLabel={`Read ${book.name}, chapter 1`}
            onPress={() => { haptics.soft(); openChapter(1); }}
            onPressIn={() => { animateReadPress(true); prefetchChapter(book.id, 1, translation.id); }} onPressOut={() => animateReadPress(false)}
            style={{ minHeight: 50, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 28, borderCurve: "continuous", backgroundColor: colors.ink, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <Text style={{ color: colors.bg, fontSize: 17, fontWeight: "600" }}>Read Now</Text><SFSymbol name="arrow.right" size={20} color={colors.bg} />
          </Pressable>}
        </Animated.View>
      </Animated.View>
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 8, flexDirection: "row", justifyContent: "space-between" }} pointerEvents="box-none">
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }, headerShade]} />
        <CircleButton icon="chevron.left" label="Back" tint={colors.ink} bg={colors.surface} border={colors.border} onPress={() => goBackOr(router, "/(tabs)/library")} />
        <Animated.View pointerEvents="none" accessibilityElementsHidden={!headerTitleVisible} importantForAccessibility={headerTitleVisible ? "auto" : "no-hide-descendants"} style={[{ position: "absolute", left: 76, right: 76, top: insets.top + 8, height: 48, justifyContent: "center" }, headerTitleStyle]}>
          <Text accessibilityRole="header" numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1.4} style={[systemText.headline, { color: colors.ink, textAlign: "center" }]}>{book.name}</Text>
        </Animated.View>
        <Host colorScheme={scheme} style={{ width: 48, height: 48 }}>
          <ContextMenu activationMethod="singlePress">
            <ContextMenu.Trigger>
              <NativeButton variant="bordered" modifiers={[accessibilityLabel("Book options")]}>
                <NativeImage systemName="ellipsis" size={22} color={colors.ink} modifiers={[frame({ width: 24, height: 28 })]} />
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

function ChapterTile({ number, read, isResume, columns, onPress }: {
  number: number;
  read: boolean;
  isResume: boolean;
  columns: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const dark = useResolvedScheme() === "dark";
  const [pressed, setPressed] = useState(false);
  const green = dark ? "#30D158" : "#248A3D";
  return (
    <View style={{ width: `${100 / columns}%`, padding: 4 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Chapter ${number}${read ? ", completed" : isResume ? ", continue reading here" : ", unread"}`}
        accessibilityState={{ selected: isResume }}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={{
          flex: 1, minHeight: 76, paddingVertical: 16, paddingHorizontal: 4,
          borderRadius: 16, borderCurve: "continuous",
          alignItems: "center", justifyContent: "center", gap: 4,
          opacity: pressed ? 0.7 : 1,
          backgroundColor: isResume ? colors.ink : colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: isResume ? colors.ink : "transparent",
        }}
      >
        <Text style={{ fontFamily: "System", fontWeight: isResume ? "700" : "500", fontSize: 18, fontVariant: ["tabular-nums"], color: isResume ? colors.bg : colors.ink }}>{number}</Text>
        {isResume && <Text style={{ fontFamily: "System", fontSize: 11, fontWeight: "600", color: colors.bg }}>Continue</Text>}
        {read && <View style={{ position: "absolute", top: 6, right: 6 }}><SFSymbol name="checkmark.circle.fill" size={13} color={green} /></View>}
      </Pressable>
    </View>
  );
}

function SiblingCard({ book, onPress }: { book: Book; onPress: () => void }) {
  const colors = useColors();
  const dark = useResolvedScheme() === "dark";
  const [pressed, setPressed] = useState(false);
  const { chaptersRead, lastVisited } = useProgress();
  const { fontScale } = useWindowDimensions();
  const read = new Set(chaptersRead.filter(entry => entry.bookId === book.id && entry.chapter >= 1 && entry.chapter <= book.chapters).map(entry => entry.chapter)).size;
  const started = read > 0 || lastVisited?.bookId === book.id;
  const complete = read === book.chapters;
  const percent = Math.round(read / book.chapters * 100);
  const progressColor = complete ? (dark ? "#30D158" : "#248A3D") : colors.inkMuted;
  const status = complete ? "Completed" : read > 0 ? `${percent}% read` : started ? "Started" : "";
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${book.name}, ${book.chapters} chapters${status ? `, ${status}` : ""}`} onPress={onPress}
      onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)}
      style={{ width: 120, opacity: pressed ? 0.75 : 1 }}>
      <Image source={getBookCover(book.id)} contentFit="cover" transition={0}
        style={{ width: 120, height: 160, borderRadius: 16, backgroundColor: colors.surfaceSecondary }} />
      <Text numberOfLines={2} style={{ marginTop: 8, minHeight: 40 * fontScale, fontFamily: "System", fontSize: 14, lineHeight: 20, fontWeight: "600", color: colors.ink }}>{book.name}</Text>
      <View style={{ minHeight: 28 * fontScale, marginTop: 4, gap: 6 }}>
        {started && <>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {complete && <SFSymbol name="checkmark.circle.fill" size={12} color={progressColor} />}
            <Text style={{ fontFamily: "System", fontSize: 12, lineHeight: 16, color: progressColor }}>{status}</Text>
          </View>
          {!complete && <View style={{ height: 3, borderRadius: 2, backgroundColor: colors.border, overflow: "hidden" }}><View style={{ height: 3, width: `${percent}%`, backgroundColor: progressColor, borderRadius: 2 }} /></View>}
        </>}
      </View>
    </Pressable>
  );
}
