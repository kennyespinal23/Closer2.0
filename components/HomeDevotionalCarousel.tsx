import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  InteractionManager,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useFocusEffect } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusMiniPlayerSpacing } from "@/components/FocusMiniPlayer";
import { PrimaryPillButton } from "@/components/PrimaryPillButton";
import { SFSymbol } from "@/components/Symbol";
import * as haptics from "@/lib/haptics";
import { typography } from "@/lib/typography";
import { getSermonBackdrop, HERO_BACKDROP_FALLBACK } from "@/services/unsplashService";
import {
  HERO_DIM_OVERLAY,
  HERO_GLASS_DISC,
} from "@/constants/heroChrome";

/** Native iOS UITabBar visible height (above home indicator). */
const TAB_BAR_VISIBLE_HEIGHT = 49;
/** Worst-case tab bar footprint (bar + home indicator) on modern iPhones. */
const TAB_BAR_FOOTPRINT = 83;
/** Breathing room between pinned CTAs and the floating tab bar. */
const TAB_BAR_CONTENT_GAP = 24;
/** Extra lift so the editorial block floats above the tab bar edge. */
const BOTTOM_CONTENT_LIFT = 40;
/** Horizontal page margin — Apple HIG / Espinal layout standard. */
const PAGE_MARGIN_H = 16;
/** Editorial gap between teaser body and the primary CTA. */
const CTA_TOP_MARGIN = 56;

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

/** Reserve space above the native tab bar (+ focus mini-player when live). */
function useHomeBottomInset(): number {
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const focusPillSpacing = useFocusMiniPlayerSpacing();
  const frozenFocusSpacingRef = useRef(focusPillSpacing);

  if (isFocused) {
    frozenFocusSpacingRef.current = focusPillSpacing;
  }

  const effectiveFocusSpacing = isFocused
    ? focusPillSpacing
    : frozenFocusSpacingRef.current;

  const tabClearance = Math.max(
    insets.bottom + TAB_BAR_VISIBLE_HEIGHT + TAB_BAR_CONTENT_GAP,
    TAB_BAR_FOOTPRINT + TAB_BAR_CONTENT_GAP,
  );
  return tabClearance + BOTTOM_CONTENT_LIFT + effectiveFocusSpacing;
}

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
  todayLabel,
  exitOpacity,
  onReadPress,
  bottomInset,
}: {
  card: DevotionalCarouselCard;
  todayLabel: string;
  exitOpacity: Animated.Value;
  onReadPress: () => void;
  bottomInset: number;
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const typeEmoji = TYPE_EMOJI[card.typeId] ?? "📖";

  useEffect(() => {
    let cancelled = false;
    setUseFallback(false);
    const query =
      card.illustrationPrompt?.trim() || "peaceful spiritual nature landscape";
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
      card.illustrationPrompt?.trim() || "peaceful spiritual nature landscape";
    getSermonBackdrop(query, card.sermonDay).then((url) => {
      if (url) {
        setImageUrl(url);
        setUseFallback(false);
      }
    });
  }, [card.illustrationPrompt, card.sermonDay]);

  const ctaLabel =
    card.ctaLabel ??
    (card.completed ? "Read Again" : card.active ? "Read Now" : "Coming Soon");

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <Image
        source={useFallback || !imageUrl ? HERO_BACKDROP_FALLBACK : { uri: imageUrl }}
        style={StyleSheet.absoluteFillObject}
        contentFit="cover"
        transition={600}
        onError={handleImageError}
        accessibilityIgnoresInvertColors
      />

      {/* Same 55% dim as scripture — moody, legible, photo-forward. */}
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: HERO_DIM_OVERLAY }]}
      />

      <Animated.View
        style={{
          flex: 1,
          justifyContent: "flex-end",
          paddingBottom: bottomInset,
          paddingHorizontal: PAGE_MARGIN_H,
          opacity: exitOpacity,
        }}
      >
        <ScrollView
          style={{ flexGrow: 0, flexShrink: 1 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[typography.pageTitle, { color: "#FFFFFF" }]}>
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

        <View style={{ height: CTA_TOP_MARGIN }} />

        {card.active ? (
          <PrimaryPillButton
            label={ctaLabel}
            variant={card.completed ? "completed" : "primary"}
            onPress={onReadPress}
            showArrow={!card.completed}
          />
        ) : (
          <View
            style={{
              backgroundColor: "rgba(255,255,255,0.18)",
              borderRadius: 999,
              paddingVertical: 14,
              paddingHorizontal: 24,
              minHeight: 52,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={[
                typography.button,
                { color: "rgba(255,255,255,0.5)" },
              ]}
            >
              {ctaLabel}
            </Text>
          </View>
        )}
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
  const insets = useSafeAreaInsets();
  const bottomInset = useHomeBottomInset();
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
        todayLabel={todayLabel}
        exitOpacity={exitOpacity}
        onReadPress={runReadTransition}
        bottomInset={bottomInset}
      />

      <Animated.View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: PAGE_MARGIN_H,
          right: PAGE_MARGIN_H,
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
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
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
              // Defer navigation one frame so the press opacity
              // settles and the native tab bar doesn't fight the
              // modal transition on the same tick.
              InteractionManager.runAfterInteractions(() => {
                onStreakPress();
              });
            }}
            accessibilityRole="button"
            accessibilityLabel={
              streakCount > 0
                ? `${streakCount}-day streak. Tap to open Rhythm.`
                : "Start a streak. Tap to open Rhythm."
            }
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 14,
                paddingVertical: 9,
                borderRadius: 22,
                backgroundColor: HERO_GLASS_DISC.backgroundColor,
                borderWidth: HERO_GLASS_DISC.borderWidth,
                borderColor: HERO_GLASS_DISC.borderColor,
                minHeight: 44,
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
