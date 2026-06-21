import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import { SFSymbol } from "@/components/Symbol";
import * as haptics from "@/lib/haptics";
import { typography } from "@/lib/typography";
import { getSermonBackdrop } from "@/services/unsplashService";
import {
  COMPLETED_READ_GREEN,
  HERO_DIM_OVERLAY,
  HERO_GLASS_DISC,
} from "@/constants/heroChrome";

/** Title anchor — editorial placement, high enough for long titles + teaser. */
const TITLE_TOP_RATIO = 0.46;
const TITLE_FONT_SIZE = 40;
const TITLE_LINE_HEIGHT = 44;

/** Native emoji per sermon type — travel-app metadata dimension. */
const TYPE_EMOJI: Record<string, string> = {
  "daily-church": "☀️",
  "jesus-only": "✨",
  "letters-struggling": "✉️",
  "letters-grateful": "💌",
  "character-studies": "👤",
  "deep-verse": "📖",
  misconceptions: "💡",
  testimonies: "🗣️",
  questions: "❓",
  "prayer-nights": "🌙",
};

export type DevotionalCarouselCard = {
  key: string;
  title: string;
  blurb: string;
  typeName: string;
  accent: string;
  readMinutes: number;
  typeId: string;
  sermonDay: number;
  illustrationPrompt?: string;
  active: boolean;
  completed?: boolean;
  ctaLabel?: string;
  onPress: () => void | Promise<void>;
};

export type HomeDevotionalCarouselProps = {
  cards: ReadonlyArray<DevotionalCarouselCard>;
  onCompletedPress?: () => void;
  streakCount?: number;
  onStreakPress?: () => void;
};

/** "21 June" — same voice as the travel reference's "11–17 June". */
function formatTodayDate(now: Date): string {
  return now.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
  });
}

/** Inline emoji + label pair — native iOS emoji, not SF Symbol. */
function EmojiMeta({ emoji, label }: { emoji: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Text style={{ fontSize: 14, lineHeight: 18 }} allowFontScaling={false}>
        {emoji}
      </Text>
      <Text
        style={{
          fontFamily: "System",
          fontWeight: "500",
          fontSize: 13,
          lineHeight: 18,
          color: "rgba(255,255,255,0.72)",
          marginLeft: 5,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

const HomeHeroSlide = memo(function HomeHeroSlide({
  card,
  width,
  height,
  todayLabel,
  exitOpacity,
  onReadPress,
}: {
  card: DevotionalCarouselCard;
  width: number;
  height: number;
  todayLabel: string;
  exitOpacity: Animated.Value;
  onReadPress: () => void;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const typeEmoji = TYPE_EMOJI[card.typeId] ?? "📖";

  useEffect(() => {
    let cancelled = false;
    const query =
      card.illustrationPrompt?.trim() || "peaceful spiritual nature landscape";
    getSermonBackdrop(query, card.sermonDay).then((url) => {
      if (!cancelled) setImageUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [card.sermonDay, card.illustrationPrompt]);

  const ctaLabel =
    card.ctaLabel ??
    (card.completed ? "Read Again" : card.active ? "Read Now" : "Coming Soon");
  const useWhiteCta = card.active && !card.completed;

  return (
    <View style={{ width, height, backgroundColor: "#0A0A0A" }}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={600}
          accessibilityIgnoresInvertColors
        />
      ) : null}

      {/* Same 55% dim as scripture — moody, legible, photo-forward. */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: HERO_DIM_OVERLAY }]}
      />

      <Animated.View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: height * TITLE_TOP_RATIO,
          bottom: TAB_BAR_TOTAL_HEIGHT + 12,
          paddingHorizontal: 32,
          opacity: exitOpacity,
        }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              fontSize: TITLE_FONT_SIZE,
              lineHeight: TITLE_LINE_HEIGHT,
              letterSpacing: -0.7,
              color: "#FFFFFF",
              textShadowColor: "rgba(0, 0, 0, 0.75)",
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 14,
            }}
          >
            {card.title}
          </Text>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              alignItems: "center",
              marginTop: 12,
              gap: 12,
            }}
          >
            <EmojiMeta emoji="📅" label={todayLabel} />
            <EmojiMeta emoji={typeEmoji} label={card.typeName} />
            <EmojiMeta emoji="🕐" label={`${card.readMinutes} min read`} />
          </View>

          {card.blurb ? (
            <>
              <View
                style={{
                  width: 32,
                  height: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.35)",
                  marginTop: 14,
                  marginBottom: 12,
                  borderRadius: 1,
                }}
              />
              <Text
                style={[
                  typography.body,
                  {
                    color: "rgba(255, 255, 255, 0.88)",
                    textShadowColor: "rgba(0, 0, 0, 0.75)",
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 12,
                  },
                ]}
              >
                {card.blurb}
              </Text>
            </>
          ) : null}
        </ScrollView>

        <Pressable
          onPress={() => {
            if (!card.active) return;
            onReadPress();
          }}
          disabled={!card.active}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          style={({ pressed }) => ({
            marginTop: 8,
            opacity: pressed && card.active ? 0.92 : 1,
            alignSelf: "stretch",
          })}
        >
          <View
            style={{
              backgroundColor: useWhiteCta
                ? "#FFFFFF"
                : card.completed
                  ? COMPLETED_READ_GREEN
                  : "rgba(255,255,255,0.18)",
              borderRadius: 999,
              paddingVertical: useWhiteCta ? 18 : 16,
              paddingHorizontal: 28,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 52,
              ...(useWhiteCta
                ? {
                    shadowColor: "#FFFFFF",
                    shadowOpacity: 0.2,
                    shadowRadius: 18,
                    shadowOffset: { width: 0, height: 0 },
                  }
                : {}),
            }}
          >
            <Text
              style={[
                typography.button,
                {
                  color: useWhiteCta
                    ? "#000000"
                    : card.active
                      ? "#FFFFFF"
                      : "rgba(255,255,255,0.5)",
                  marginRight: card.active ? 8 : 0,
                },
              ]}
            >
              {ctaLabel}
            </Text>
            {card.active ? (
              <SFSymbol
                name={card.completed ? "checkmark" : "arrow.right"}
                size={15}
                color={useWhiteCta ? "#000000" : "#FFFFFF"}
                weight="semibold"
              />
            ) : null}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
});

export const HomeDevotionalCarousel = memo(function HomeDevotionalCarousel({
  cards,
  onCompletedPress,
  streakCount = 0,
  onStreakPress,
}: HomeDevotionalCarouselProps) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const card = cards[0];
  const todayLabel = useMemo(() => formatTodayDate(new Date()), []);
  const exitOpacity = useRef(new Animated.Value(1)).current;

  useFocusEffect(
    useCallback(() => {
      exitOpacity.setValue(1);
    }, [exitOpacity]),
  );

  const runReadTransition = useCallback(() => {
    if (!card) return;
    haptics.tap();
    Animated.timing(exitOpacity, {
      toValue: 0,
      duration: 720,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) void card.onPress();
    });
  }, [card, exitOpacity]);

  if (!card) return null;

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <HomeHeroSlide
        card={card}
        width={screenWidth}
        height={screenHeight}
        todayLabel={todayLabel}
        exitOpacity={exitOpacity}
        onReadPress={runReadTransition}
      />

      <Animated.View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          right: 16,
          zIndex: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          opacity: exitOpacity,
        }}
      >
        <Pressable
          onPress={() => {
            haptics.soft();
            onCompletedPress?.();
          }}
          accessibilityRole="button"
          accessibilityLabel="Open completed sermons"
          hitSlop={14}
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View style={HERO_GLASS_DISC}>
            <SFSymbol
              name="book.closed.fill"
              size={16}
              color="#FFFFFF"
              weight="medium"
            />
          </View>
        </Pressable>

        {onStreakPress ? (
          <Pressable
            onPress={() => {
              haptics.soft();
              onStreakPress();
            }}
            accessibilityRole="button"
            accessibilityLabel={
              streakCount > 0
                ? `${streakCount}-day streak. Tap to open Rhythm.`
                : "Start a streak. Tap to open Rhythm."
            }
            hitSlop={14}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 19,
                backgroundColor: HERO_GLASS_DISC.backgroundColor,
                borderWidth: HERO_GLASS_DISC.borderWidth,
                borderColor: HERO_GLASS_DISC.borderColor,
                minHeight: 38,
              }}
            >
              <Text
                style={{ fontSize: 15, lineHeight: 18, marginRight: 5 }}
                allowFontScaling={false}
              >
                🔥
              </Text>
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "System",
                  fontWeight: "700",
                  fontSize: 15,
                  lineHeight: 18,
                  letterSpacing: -0.2,
                }}
              >
                {streakCount}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </Animated.View>
    </View>
  );
});
