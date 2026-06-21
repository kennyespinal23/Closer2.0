import { memo, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { TAB_BAR_TOTAL_HEIGHT } from "@/components/GlassTabBar";
import { SFSymbol } from "@/components/Symbol";
import * as haptics from "@/lib/haptics";
import { typography } from "@/lib/typography";
import { getHeroImage } from "@/services/unsplashService";
import {
  FROSTED_CHROME_INK,
  FROSTED_CHROME_PILL,
} from "@/constants/heroChrome";

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
          color: "rgba(255,255,255,0.88)",
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
}: {
  card: DevotionalCarouselCard;
  width: number;
  height: number;
  todayLabel: string;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const typeEmoji = TYPE_EMOJI[card.typeId] ?? "📖";

  useEffect(() => {
    let cancelled = false;
    getHeroImage(card.typeId, card.sermonDay, card.illustrationPrompt).then(
      (url) => {
        if (!cancelled) setImageUrl(url);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [card.typeId, card.sermonDay, card.illustrationPrompt]);

  const ctaLabel =
    card.ctaLabel ??
    (card.completed ? "Read Again" : card.active ? "Read Now" : "Coming Soon");
  const ctaColor = card.active ? card.accent : "rgba(255,255,255,0.18)";

  return (
    <View style={{ width, height }}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={StyleSheet.absoluteFillObject}
          contentFit="cover"
          transition={400}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#1a1a1a" }]} />
      )}

      <Svg
        pointerEvents="none"
        style={StyleSheet.absoluteFillObject}
        width={width}
        height={height}
      >
        <Defs>
          <LinearGradient id="heroBottomFade" x1="0" y1="0" x2="0" y2={height}>
            <Stop offset="0" stopColor="#000000" stopOpacity={0} />
            <Stop offset="0.38" stopColor="#000000" stopOpacity={0.12} />
            <Stop offset="0.58" stopColor="#000000" stopOpacity={0.42} />
            <Stop offset="0.78" stopColor="#000000" stopOpacity={0.68} />
            <Stop offset="1" stopColor="#000000" stopOpacity={0.82} />
          </LinearGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#heroBottomFade)" />
      </Svg>

      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          paddingHorizontal: 24,
          paddingBottom: TAB_BAR_TOTAL_HEIGHT + 56,
        }}
      >
        <Text
          style={{
            fontFamily: "System",
            fontWeight: "700",
            fontSize: 30,
            lineHeight: 36,
            letterSpacing: -0.5,
            color: "#FFFFFF",
          }}
        >
          {card.title}
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            marginTop: 10,
            gap: 12,
          }}
        >
          <EmojiMeta emoji="📅" label={todayLabel} />
          <EmojiMeta emoji={typeEmoji} label={card.typeName} />
          <EmojiMeta emoji="🕐" label={`${card.readMinutes} min read`} />
          <EmojiMeta emoji="🎧" label="Listen" />
        </View>

        {card.blurb ? (
          <Text
            style={[
              typography.body,
              {
                color: "rgba(255,255,255,0.94)",
                marginTop: 16,
                textShadowColor: "rgba(0,0,0,0.45)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 6,
              },
            ]}
            numberOfLines={4}
          >
            {card.blurb}
          </Text>
        ) : null}

        <Pressable
          onPress={() => {
            if (!card.active) return;
            haptics.soft();
            void card.onPress();
          }}
          disabled={!card.active}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          style={({ pressed }) => ({
            marginTop: 20,
            opacity: pressed && card.active ? 0.92 : 1,
          })}
        >
          <View
            style={{
              backgroundColor: ctaColor,
              borderRadius: 999,
              paddingVertical: 16,
              paddingHorizontal: 28,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 52,
            }}
          >
            <Text
              style={[
                typography.button,
                { color: card.active ? "#FFFFFF" : "rgba(255,255,255,0.5)" },
              ]}
            >
              {ctaLabel}
            </Text>
            {card.active ? (
              <SFSymbol
                name="arrow.right"
                size={15}
                color="#FFFFFF"
                weight="semibold"
                style={{ marginLeft: 8 }}
              />
            ) : null}
          </View>
        </Pressable>
      </View>
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

  if (!card) return null;

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <HomeHeroSlide
        card={card}
        width={screenWidth}
        height={screenHeight}
        todayLabel={todayLabel}
      />

      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: insets.top + 6,
          left: 20,
          right: 20,
          zIndex: 10,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Pressable
          onPress={() => {
            haptics.soft();
            onCompletedPress?.();
          }}
          accessibilityRole="button"
          accessibilityLabel="Open completed sermons"
          hitSlop={12}
          style={({ pressed }) => ({
            ...FROSTED_CHROME_PILL,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <SFSymbol
            name="book.closed.fill"
            size={18}
            color={FROSTED_CHROME_INK}
            weight="medium"
          />
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
            hitSlop={8}
            style={({ pressed }) => ({
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 22,
                backgroundColor: "rgba(255,255,255,0.92)",
                minHeight: 44,
              }}
            >
              <Text
                style={{ fontSize: 16, lineHeight: 20, marginRight: 5 }}
                allowFontScaling={false}
              >
                🔥
              </Text>
              <Text
                style={{
                  color: "#1C1C1E",
                  fontFamily: "System",
                  fontWeight: "700",
                  fontSize: 16,
                  lineHeight: 20,
                  letterSpacing: -0.2,
                }}
              >
                {streakCount}
              </Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});
