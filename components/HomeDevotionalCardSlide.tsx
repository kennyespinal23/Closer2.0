import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppIcon } from "@/components/SocialAppCard";
import { SFSymbol } from "@/components/Symbol";
import * as haptics from "@/lib/haptics";
import {
  SOCIAL_APP_ICON_SOURCES,
  type SocialAppKind,
} from "@/lib/socialAppIconAssets";
import { systemText, typography } from "@/lib/typography";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { getSermonBackdrop, HERO_BACKDROP_FALLBACK } from "@/services/unsplashService";
import { useColors, useResolvedScheme } from "@/state/theme";
import type { DevotionalCarouselCard } from "@/components/HomeDevotionalCarousel";

const PAGE_MARGIN_H = 20;
const CARD_RADIUS = 36;
const IMAGE_RADIUS = 12;
/** Wide horizontal hero crop — matches the reference card. */
const IMAGE_ASPECT = 16 / 9;
const BLOCKED_APP_ICON_SIZE = 20;
const VERSE_INDENT = 28;
/** Soft decelerate — long settle, no snap. */
const LIQUID_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const LIQUID_IN = Easing.bezier(0.4, 0, 0.2, 1);
const OPEN_MS = 720;
const CLOSE_MS = 560;
/** Fade text in only after the cream shell has finished growing. */
const CONTENT_FADE_MS = 360;

/** Cream editorial card — lifts off both dark and light page canvases. */
const CARD_BG_LIGHT = "#F4F0E6";
const CARD_INK = "#141414";
const CARD_INK_SOFT = "rgba(20, 20, 20, 0.72)";

type CardBounds = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type EarnedMilestoneChip = {
  title: string;
  accent: string;
};

export type HomeDevotionalCardSlideProps = {
  card: DevotionalCarouselCard;
  exitOpacity: Animated.Value;
  bottomInset: number;
  topClearance: number;
  onReadPress: () => void;
  scriptureReference: string;
  scriptureText: string;
  verseInsight: string;
  completedAt: number | null;
  earnedMilestones: ReadonlyArray<EarnedMilestoneChip>;
  greetingText: string;
  greetingEmoji: string;
  dateLabel: string;
  blocksOn: boolean;
  blockedAppIds: ReadonlyArray<string>;
};

type VerseLine = {
  verseNum?: string;
  text: string;
  indent: boolean;
};

function isIconAppId(id: string): id is SocialAppKind {
  return id in SOCIAL_APP_ICON_SOURCES;
}

function formatUnlockedLabel(completedAt: number | null): string | null {
  if (completedAt == null) return null;
  const label = new Date(completedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `Unlocked ${label}`;
}

function splitScriptureReference(ref: string): { book: string; passage: string } {
  const trimmed = ref.trim();
  const match = trimmed.match(/^(.+?)\s+(\d[\d:,\-–— ]*)$/);
  if (!match) {
    return { book: trimmed.toUpperCase(), passage: "" };
  }
  return {
    book: match[1]!.trim().toUpperCase(),
    passage: match[2]!.trim(),
  };
}

function firstVerseNumber(passage: string): string | undefined {
  const match = passage.match(/:(\d+)/);
  return match?.[1];
}

function cleanVerseText(text: string): string {
  return text
    .trim()
    .replace(/^['"“‘](.*)['"”’]$/s, "$1")
    .trim();
}

/** Break verse copy into multiple poetic lines for the card preview. */
function buildVerseLines(text: string, passage: string): VerseLine[] {
  const cleaned = cleanVerseText(text);
  if (!cleaned) return [];

  const numberedLines = cleaned
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (numberedLines.length > 1) {
    return numberedLines.map((line) => {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (!match) {
        return { indent: false, text: line };
      }
      return {
        verseNum: match[1],
        indent: false,
        text: match[2]!.trim(),
      };
    });
  }

  const verseNum = firstVerseNumber(passage);

  const dashParts = cleaned.split(/\s*[—–-]\s+/);
  if (dashParts.length > 1) {
    const lines: VerseLine[] = [
      { verseNum, indent: false, text: `"${dashParts[0]!.trim()}—` },
    ];
    const tail = dashParts.slice(1).join("—").trim();
    lines.push({
      indent: true,
      text: tail.endsWith('"') ? tail : `${tail}"`,
    });
    return lines;
  }

  const commaParts = cleaned.split(/,\s+/);
  if (commaParts.length > 1) {
    return commaParts.map((part, index) => {
      const isFirst = index === 0;
      const isLast = index === commaParts.length - 1;
      return {
        verseNum: isFirst ? verseNum : undefined,
        indent: !isFirst,
        text: isFirst
          ? `"${part},`
          : isLast
            ? `${part}${part.endsWith('"') ? "" : '"'}`
            : `${part},`,
      };
    });
  }

  const sentenceParts = cleaned.split(/(?<=[.!?])\s+/);
  if (sentenceParts.length > 1) {
    return sentenceParts.map((part, index) => ({
      verseNum: index === 0 ? verseNum : undefined,
      indent: index > 0,
      text:
        index === 0
          ? part.startsWith('"')
            ? part
            : `"${part}`
          : index === sentenceParts.length - 1 && !part.endsWith('"')
            ? `${part}"`
            : part,
    }));
  }

  const words = cleaned.split(/\s+/);
  if (words.length > 7) {
    const midpoint = Math.ceil(words.length / 2);
    return [
      {
        verseNum,
        indent: false,
        text: `"${words.slice(0, midpoint).join(" ")}`,
      },
      {
        indent: true,
        text: `${words.slice(midpoint).join(" ")}"`,
      },
    ];
  }

  return [
    {
      verseNum,
      indent: false,
      text: cleaned.startsWith('"') ? cleaned : `"${cleaned}"`,
    },
  ];
}

const VerseLineText = memo(function VerseLineText({
  line,
}: {
  line: VerseLine;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        paddingLeft: line.indent ? VERSE_INDENT : 0,
        marginTop: line.indent ? 4 : 0,
      }}
    >
      {line.verseNum ? (
        <Text
          style={{
            fontFamily: typography.body.fontFamily,
            fontWeight: "500",
            fontSize: 11,
            lineHeight: 24,
            color: CARD_INK_SOFT,
            marginRight: 4,
            marginTop: -2,
          }}
          allowFontScaling={false}
        >
          {line.verseNum}
        </Text>
      ) : null}
      <Text
        style={{
          flex: 1,
          fontFamily: typography.body.fontFamily,
          fontWeight: "500",
          fontSize: 17,
          lineHeight: 26,
          color: CARD_INK,
        }}
      >
        {line.text}
      </Text>
    </View>
  );
});

function CardChromeShadow(scheme: "light" | "dark") {
  return Platform.select({
    ios: {
      shadowColor: "#000000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: scheme === "light" ? 0.1 : 0.28,
      shadowRadius: 28,
    },
    android: { elevation: 10 },
  });
}

function ScriptureHeader({
  book,
  passage,
  unlockedLabel,
  iconAppIds,
  visibleAppIcons,
  overflowAppCount,
}: {
  book: string;
  passage: string;
  unlockedLabel: string | null;
  iconAppIds: ReadonlyArray<SocialAppKind>;
  visibleAppIcons: ReadonlyArray<SocialAppKind>;
  overflowAppCount: number;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text
          style={{
            fontFamily: typography.body.fontFamily,
            fontWeight: "800",
            fontSize: 40,
            lineHeight: 42,
            letterSpacing: -0.6,
            color: CARD_INK,
          }}
        >
          {book}
        </Text>
        {passage ? (
          <Text
            style={{
              fontFamily: typography.body.fontFamily,
              fontWeight: "800",
              fontSize: 34,
              lineHeight: 38,
              letterSpacing: -0.4,
              color: CARD_INK,
              marginTop: 2,
            }}
          >
            {passage}
          </Text>
        ) : null}
      </View>

      <View style={{ alignItems: "flex-end", maxWidth: "42%" }}>
        {unlockedLabel ? (
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <SFSymbol
              name="lock.open.fill"
              size={11}
              color={CARD_INK_SOFT}
              weight="medium"
            />
            <Text
              style={{
                fontFamily: typography.body.fontFamily,
                fontWeight: "500",
                fontSize: 12,
                lineHeight: 16,
                color: CARD_INK_SOFT,
                marginLeft: 4,
                textAlign: "right",
              }}
            >
              {unlockedLabel}
            </Text>
          </View>
        ) : (
          <Text
            style={{
              fontFamily: typography.body.fontFamily,
              fontWeight: "600",
              fontSize: 12,
              lineHeight: 16,
              color: CARD_INK_SOFT,
              textAlign: "right",
            }}
          >
            Today&apos;s reading
          </Text>
        )}

        {iconAppIds.length > 0 ? (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              marginTop: 8,
              gap: 5,
            }}
          >
            {visibleAppIcons.map((appId) => (
              <AppIcon
                key={appId}
                kind={appId}
                size={BLOCKED_APP_ICON_SIZE}
              />
            ))}
            {overflowAppCount > 0 ? (
              <Text
                style={{
                  fontFamily: typography.body.fontFamily,
                  fontWeight: "600",
                  fontSize: 11,
                  lineHeight: 14,
                  color: CARD_INK_SOFT,
                  marginLeft: 2,
                }}
              >
                +{overflowAppCount}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

function CardImage({
  imageUrl,
  useFallback,
  onError,
}: {
  imageUrl: string | null;
  useFallback: boolean;
  onError: () => void;
}) {
  return (
    <View
      style={{
        marginTop: 20,
        width: "100%",
        aspectRatio: IMAGE_ASPECT,
        borderRadius: IMAGE_RADIUS,
        overflow: "hidden",
        backgroundColor: "#D8D2C6",
      }}
    >
      <Image
        source={
          useFallback || !imageUrl
            ? HERO_BACKDROP_FALLBACK
            : { uri: imageUrl }
        }
        style={{
          width: "100%",
          height: "100%",
        }}
        contentFit="cover"
        contentPosition="center"
        transition={500}
        onError={onError}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

export const HomeDevotionalCardSlide = memo(function HomeDevotionalCardSlide({
  card,
  exitOpacity,
  bottomInset,
  topClearance,
  onReadPress,
  scriptureReference,
  scriptureText,
  verseInsight,
  completedAt,
  greetingText,
  dateLabel,
  blocksOn,
  blockedAppIds,
}: HomeDevotionalCardSlideProps) {
  const colors = useColors();
  const scheme = useResolvedScheme();
  const reducedMotion = useReducedMotion();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const cardRef = useRef<View>(null);
  const [expanded, setExpanded] = useState(false);
  const [cardBounds, setCardBounds] = useState<CardBounds | null>(null);
  const morphProgress = useRef(new Animated.Value(0)).current;
  const contentProgress = useRef(new Animated.Value(0)).current;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  const { book, passage } = useMemo(
    () => splitScriptureReference(scriptureReference.trim() || card.title),
    [scriptureReference, card.title],
  );

  const allVerseLines = useMemo(() => {
    const body = scriptureText.trim() || card.blurb.trim();
    return buildVerseLines(body, passage);
  }, [scriptureText, card.blurb, passage]);

  const previewVerseLine = allVerseLines[0] ?? null;

  const unlockedLabel = formatUnlockedLabel(
    card.completed ? completedAt : null,
  );

  const iconAppIds = useMemo(
    () => blockedAppIds.filter(isIconAppId),
    [blockedAppIds],
  );

  const visibleAppIcons = iconAppIds.slice(0, 4);
  const overflowAppCount = Math.max(0, iconAppIds.length - visibleAppIcons.length);

  const blocksStatusColor = blocksOn ? "#34C759" : CARD_INK_SOFT;

  useEffect(() => {
    let cancelled = false;
    setUseFallback(false);
    const query =
      card.illustrationPrompt?.trim() ||
      "peaceful mountain sunrise mist landscape";
    getSermonBackdrop(query, card.sermonDay).then((url) => {
      if (!cancelled) {
        setImageUrl(url);
        setUseFallback(!url);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [card.sermonDay, card.illustrationPrompt]);

  const handleImageError = useCallback(() => {
    setUseFallback(true);
    const query =
      card.illustrationPrompt?.trim() ||
      "peaceful mountain sunrise mist landscape";
    getSermonBackdrop(query, card.sermonDay).then((url) => {
      if (url) {
        setImageUrl(url);
        setUseFallback(false);
      }
    });
  }, [card.illustrationPrompt, card.sermonDay]);

  const measureCard = useCallback((): Promise<CardBounds | null> => {
    return new Promise((resolve) => {
      cardRef.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          resolve({ x, y, width, height });
          return;
        }
        resolve(null);
      });
    });
  }, []);

  const openExpanded = useCallback(async () => {
    haptics.soft();
    const bounds = await measureCard();
    if (!bounds) return;

    setCardBounds(bounds);
    morphProgress.setValue(0);
    contentProgress.setValue(0);
    setExpanded(true);

    if (reducedMotion) {
      morphProgress.setValue(1);
      contentProgress.setValue(1);
      return;
    }

    requestAnimationFrame(() => {
      Animated.timing(morphProgress, {
        toValue: 1,
        duration: OPEN_MS,
        easing: LIQUID_OUT,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (!finished) return;
        Animated.timing(contentProgress, {
          toValue: 1,
          duration: CONTENT_FADE_MS,
          easing: LIQUID_OUT,
          useNativeDriver: true,
        }).start();
      });
    });
  }, [contentProgress, measureCard, morphProgress, reducedMotion]);

  const closeExpanded = useCallback(() => {
    haptics.soft();

    if (reducedMotion) {
      morphProgress.setValue(0);
      contentProgress.setValue(0);
      setExpanded(false);
      return;
    }

    // Hide text first so it never reflows while the shell shrinks.
    Animated.timing(contentProgress, {
      toValue: 0,
      duration: 160,
      easing: LIQUID_IN,
      useNativeDriver: true,
    }).start(() => {
      Animated.timing(morphProgress, {
        toValue: 0,
        duration: CLOSE_MS,
        easing: LIQUID_IN,
        useNativeDriver: false,
      }).start(({ finished }) => {
        if (finished) setExpanded(false);
      });
    });
  }, [contentProgress, morphProgress, reducedMotion]);

  const openDevotional = useCallback(() => {
    if (!card.active) return;
    haptics.tap();
    setExpanded(false);
    morphProgress.setValue(0);
    contentProgress.setValue(0);
    onReadPress();
  }, [card.active, contentProgress, morphProgress, onReadPress]);

  const scrollMinHeight = Math.max(windowHeight - bottomInset, 0);

  const origin = cardBounds ?? {
    x: PAGE_MARGIN_H,
    y: topClearance + 80,
    width: Math.max(windowWidth - PAGE_MARGIN_H * 2, 1),
    height: 420,
  };

  const morphLeft = morphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [origin.x, 0],
  });
  const morphTop = morphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [origin.y, 0],
  });
  const morphWidth = morphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [origin.width, windowWidth],
  });
  const morphHeight = morphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [origin.height, windowHeight],
  });
  const morphRadius = morphProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [CARD_RADIUS, 0],
  });
  const backdropOpacity = morphProgress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.55, 1],
  });
  const contentOpacity = contentProgress;
  const frozenPreviewOpacity = contentProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <Animated.View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        opacity: exitOpacity,
      }}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: PAGE_MARGIN_H,
          paddingTop: topClearance,
          paddingBottom: bottomInset,
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!expanded}
      >
        <View
          style={{
            minHeight: Math.max(scrollMinHeight - topClearance - bottomInset, 0),
            justifyContent: "center",
          }}
        >
          <View style={{ marginBottom: 18 }}>
            <Text
              style={[systemText.largeTitle, { color: colors.ink }]}
            >
              {greetingText}
            </Text>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                alignItems: "center",
                marginTop: 8,
                gap: 8,
              }}
            >
              <Text
                style={{
                  fontFamily: typography.body.fontFamily,
                  fontWeight: "500",
                  fontSize: 15,
                  lineHeight: 22,
                  color: colors.inkMuted,
                }}
              >
                {dateLabel}
              </Text>
              <Text
                style={{
                  fontFamily: typography.body.fontFamily,
                  fontWeight: "500",
                  fontSize: 15,
                  lineHeight: 22,
                  color: colors.inkMuted,
                }}
              >
                ·
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 4,
                    backgroundColor: blocksStatusColor,
                    marginRight: 6,
                  }}
                />
                <Text
                  style={{
                    fontFamily: typography.body.fontFamily,
                    fontWeight: "600",
                    fontSize: 15,
                    lineHeight: 22,
                    color: colors.inkMuted,
                  }}
                >
                  Blocks {blocksOn ? "on" : "off"}
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={openExpanded}
            accessibilityRole="button"
            accessibilityLabel="Open today's scripture card"
            accessibilityHint="Expands the card to full screen"
            style={({ pressed }) => ({
              opacity: pressed ? 0.96 : 1,
            })}
          >
            <View
              ref={cardRef}
              collapsable={false}
              style={{
                borderRadius: CARD_RADIUS,
                backgroundColor: CARD_BG_LIGHT,
                paddingHorizontal: 28,
                paddingTop: 32,
                paddingBottom: 28,
                overflow: "hidden",
                borderWidth: scheme === "dark" ? 1 : 0,
                borderColor: "rgba(255, 255, 255, 0.14)",
                opacity: expanded ? 0 : 1,
                ...CardChromeShadow(scheme),
              }}
            >
              <ScriptureHeader
                book={book}
                passage={passage}
                unlockedLabel={unlockedLabel}
                iconAppIds={iconAppIds}
                visibleAppIcons={visibleAppIcons}
                overflowAppCount={overflowAppCount}
              />

              <CardImage
                imageUrl={imageUrl}
                useFallback={useFallback}
                onError={handleImageError}
              />

              {previewVerseLine ? (
                <View style={{ marginTop: 22 }}>
                  <VerseLineText line={previewVerseLine} />
                </View>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 20,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.body.fontFamily,
                    fontWeight: "600",
                    fontSize: 13,
                    lineHeight: 18,
                    color: CARD_INK_SOFT,
                  }}
                >
                  Tap to expand
                </Text>
                <SFSymbol
                  name="chevron.up"
                  size={13}
                  color={CARD_INK_SOFT}
                  weight="semibold"
                />
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={expanded}
        animationType="none"
        presentationStyle="overFullScreen"
        transparent
        onRequestClose={closeExpanded}
        statusBarTranslucent
      >
        <View style={{ flex: 1 }} pointerEvents="box-none">
          <Animated.View
            pointerEvents="none"
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: colors.bg,
              opacity: backdropOpacity,
            }}
          />

          <Animated.View
            style={{
              position: "absolute",
              left: morphLeft,
              top: morphTop,
              width: morphWidth,
              height: morphHeight,
              borderRadius: morphRadius,
              backgroundColor: CARD_BG_LIGHT,
              overflow: "hidden",
            }}
          >
            {/* Frozen snapshot of the collapsed card — fixed width so
                text never reflows while the cream shell grows. */}
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: origin.width,
                paddingHorizontal: 28,
                paddingTop: 32,
                paddingBottom: 28,
                opacity: frozenPreviewOpacity,
              }}
            >
              <ScriptureHeader
                book={book}
                passage={passage}
                unlockedLabel={unlockedLabel}
                iconAppIds={iconAppIds}
                visibleAppIcons={visibleAppIcons}
                overflowAppCount={overflowAppCount}
              />

              <CardImage
                imageUrl={imageUrl}
                useFallback={useFallback}
                onError={handleImageError}
              />

              {previewVerseLine ? (
                <View style={{ marginTop: 22 }}>
                  <VerseLineText line={previewVerseLine} />
                </View>
              ) : null}

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 20,
                }}
              >
                <Text
                  style={{
                    fontFamily: typography.body.fontFamily,
                    fontWeight: "600",
                    fontSize: 13,
                    lineHeight: 18,
                    color: CARD_INK_SOFT,
                  }}
                >
                  Tap to expand
                </Text>
                <SFSymbol
                  name="chevron.up"
                  size={13}
                  color={CARD_INK_SOFT}
                  weight="semibold"
                />
              </View>
            </Animated.View>

            {/* Full-screen content — laid out at final size, faded in
                only after the shell has finished growing. */}
            <Animated.View
              style={{
                flex: 1,
                opacity: contentOpacity,
              }}
            >
              <View
                style={{
                  paddingTop: insets.top + 8,
                  paddingHorizontal: 16,
                  paddingBottom: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Pressable
                  onPress={closeExpanded}
                  hitSlop={12}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  style={({ pressed }) => ({
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "rgba(20, 20, 20, 0.08)",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <SFSymbol
                    name="xmark"
                    size={15}
                    color={CARD_INK}
                    weight="semibold"
                  />
                </Pressable>

                <Text
                  style={{
                    fontFamily: typography.body.fontFamily,
                    fontWeight: "600",
                    fontSize: 15,
                    color: CARD_INK_SOFT,
                  }}
                >
                  Scripture
                </Text>

                <View style={{ width: 44 }} />
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{
                  paddingHorizontal: 28,
                  paddingBottom: insets.bottom + 28,
                }}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <ScriptureHeader
                  book={book}
                  passage={passage}
                  unlockedLabel={unlockedLabel}
                  iconAppIds={iconAppIds}
                  visibleAppIcons={visibleAppIcons}
                  overflowAppCount={overflowAppCount}
                />

                <CardImage
                  imageUrl={imageUrl}
                  useFallback={useFallback}
                  onError={handleImageError}
                />

                {allVerseLines.map((line, index) => (
                  <View
                    key={`${index}-${line.text.slice(0, 12)}`}
                    style={{ marginTop: index === 0 ? 22 : 10 }}
                  >
                    <VerseLineText line={line} />
                  </View>
                ))}

                {verseInsight.trim() ? (
                  <>
                    <View
                      style={{
                        height: 1,
                        backgroundColor: "rgba(20, 20, 20, 0.12)",
                        marginTop: 28,
                        marginBottom: 16,
                      }}
                    />
                    <Text
                      style={[
                        typography.smallLabel,
                        {
                          color: CARD_INK_SOFT,
                          textTransform: "uppercase",
                        },
                      ]}
                    >
                      Insight
                    </Text>
                    <Text
                      style={[
                        typography.body,
                        {
                          color: CARD_INK,
                          marginTop: 8,
                        },
                      ]}
                    >
                      {verseInsight.trim()}
                    </Text>
                  </>
                ) : null}

                {card.active ? (
                  <Pressable
                    onPress={openDevotional}
                    accessibilityRole="button"
                    accessibilityLabel="Read today's devotional"
                    style={({ pressed }) => ({
                      marginTop: 32,
                      minHeight: 52,
                      borderRadius: 999,
                      backgroundColor: CARD_INK,
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text
                      style={[
                        typography.button,
                        { color: "#FFFFFF" },
                      ]}
                    >
                      Read today&apos;s devotional
                    </Text>
                  </Pressable>
                ) : null}
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </View>
      </Modal>
    </Animated.View>
  );
});
