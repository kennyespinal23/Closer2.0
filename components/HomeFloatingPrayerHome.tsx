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
import { useFonts } from "expo-font";
import { PlayfairDisplay_500Medium_Italic } from "@expo-google-fonts/playfair-display";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SFSymbol } from "@/components/Symbol";
import {
  HOME_FLOATING_CARDS,
  HOME_FLOATING_PROMPTS,
  type FloatingScriptureCard,
} from "@/constants/homePrototype";
import * as haptics from "@/lib/haptics";
import { loadJSON, saveJSON, STORAGE_KEYS } from "@/lib/storage";
import { typography } from "@/lib/typography";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  getSermonBackdrop,
  HERO_BACKDROP_FALLBACK,
} from "@/services/unsplashService";
import { useColors } from "@/state/theme";

const CARD_RADIUS = 22;
const IMAGE_RADIUS = 8;
const IMAGE_ASPECT = 16 / 9;
const LIQUID_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const LIQUID_IN = Easing.bezier(0.4, 0, 0.2, 1);
const HERO_HINT_DELAY_MS = 1600;
const HOLD_UNLOCK_MS = 1600;
const SWIPE_DOWN_COMMIT_DY = 40;
const SWIPE_DOWN_COMMIT_VY = 400;
const OPEN_MS = 820;
const CLOSE_MS = 380;

/** Floating cream card / quote-screen cream shell. */
const CARD_BG = "#F4F0E6";
const CARD_INK = "#141414";
const CARD_INK_SOFT = "rgba(20, 20, 20, 0.72)";
const QUOTE_INK = "#F4F0E6";
const QUOTE_REF_INK = "rgba(244, 240, 230, 0.72)";

/**
 * Quote text on the full-bleed verse-share hero ONLY.
 * Loaded locally in this file — never registered as a global default.
 */
const QUOTE_PLAYFAIR = "PlayfairDisplay_500Medium_Italic";

type ExpandPhase = "hero" | "detail";

type VerseLine = {
  verseNum?: string;
  text: string;
};

let promptAdvancePromise: Promise<string> | null = null;

function advanceHomePrompt(): Promise<string> {
  if (promptAdvancePromise) return promptAdvancePromise;
  promptAdvancePromise = (async () => {
    const stored = await loadJSON<number>(
      STORAGE_KEYS.homeFloatingPromptIndex,
    );
    const prev =
      typeof stored === "number" && Number.isFinite(stored)
        ? Math.max(0, Math.floor(stored))
        : -1;
    const next = (prev + 1) % HOME_FLOATING_PROMPTS.length;
    await saveJSON(STORAGE_KEYS.homeFloatingPromptIndex, next);
    return HOME_FLOATING_PROMPTS[next]!;
  })().catch(() => HOME_FLOATING_PROMPTS[0]!);
  return promptAdvancePromise;
}

function splitScriptureReference(ref: string): { book: string; passage: string } {
  const trimmed = ref.trim();
  const match = trimmed.match(/^(.+?)\s+(\d[\d:,\-–— ]*)$/);
  if (!match) return { book: trimmed.toUpperCase(), passage: "" };
  return {
    book: match[1]!.trim().toUpperCase(),
    passage: match[2]!.trim(),
  };
}

function buildVerseLines(text: string): VerseLine[] {
  const cleaned = text.trim();
  if (!cleaned) return [];
  const numbered = cleaned
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (numbered.length > 1) {
    return numbered.map((line) => {
      const match = line.match(/^(\d+)\s+(.+)$/);
      if (!match) return { text: line };
      return { verseNum: match[1], text: match[2]!.trim() };
    });
  }
  return [{ text: cleaned }];
}

function firstVerseLine(lines: VerseLine[]): string {
  return lines[0]?.text?.trim() ?? "";
}

function useFloatingCardImage(item: FloatingScriptureCard) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUseFallback(false);
    getSermonBackdrop(item.illustrationPrompt, item.id.length).then((url) => {
      if (!cancelled) {
        setImageUrl(url);
        setUseFallback(!url);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [item.id, item.illustrationPrompt]);

  const source =
    useFallback || !imageUrl ? HERO_BACKDROP_FALLBACK : { uri: imageUrl };

  return { source, setUseFallback };
}

function VerseLineText({ line }: { line: VerseLine }) {
  return (
    <View style={{ flexDirection: "row", marginTop: 6 }}>
      {line.verseNum ? (
        <Text
          style={{
            fontFamily: typography.body.fontFamily,
            fontWeight: "500",
            fontSize: 13,
            lineHeight: 28,
            color: CARD_INK_SOFT,
            marginRight: 6,
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
          lineHeight: 28,
          color: CARD_INK,
        }}
      >
        {line.text}
      </Text>
    </View>
  );
}

function HoldToUnlockButton({
  label,
  holdingLabel,
  onComplete,
  reducedMotion,
}: {
  label: string;
  holdingLabel: string;
  onComplete: () => void;
  reducedMotion: boolean;
}) {
  const progress = useRef(new Animated.Value(0)).current;
  const holdingRef = useRef(false);
  const completedRef = useRef(false);
  const [holding, setHolding] = useState(false);

  const resetHold = useCallback(() => {
    holdingRef.current = false;
    setHolding(false);
    progress.stopAnimation();
    Animated.timing(progress, {
      toValue: 0,
      duration: reducedMotion ? 0 : 180,
      easing: LIQUID_IN,
      useNativeDriver: false,
    }).start();
  }, [progress, reducedMotion]);

  const startHold = useCallback(() => {
    if (completedRef.current) return;
    holdingRef.current = true;
    setHolding(true);
    haptics.soft();
    progress.stopAnimation();
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: reducedMotion ? 1 : HOLD_UNLOCK_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished || !holdingRef.current || completedRef.current) return;
      completedRef.current = true;
      haptics.tap();
      onComplete();
    });
  }, [onComplete, progress, reducedMotion]);

  const fillWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Pressable
      onPressIn={startHold}
      onPressOut={resetHold}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Hold to unlock your apps"
      style={{
        marginTop: 32,
        minHeight: 56,
        borderRadius: 999,
        backgroundColor: CARD_INK,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          ...StyleSheet.absoluteFillObject,
          width: fillWidth,
          backgroundColor: "rgba(255, 255, 255, 0.22)",
        }}
      />
      <Text style={[typography.button, { color: "#FFFFFF", zIndex: 1 }]}>
        {holding ? holdingLabel : label}
      </Text>
    </Pressable>
  );
}

function FloatingMiniCard({
  item,
  onPress,
  hidden,
}: {
  item: FloatingScriptureCard;
  onPress: () => void;
  hidden?: boolean;
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { book, passage } = useMemo(
    () => splitScriptureReference(item.scriptureReference),
    [item.scriptureReference],
  );
  const cardWidth = windowWidth * item.width;
  const { source, setUseFallback } = useFloatingCardImage(item);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      style={{
        position: "absolute",
        left: windowWidth * item.x,
        top: windowHeight * item.y,
        width: cardWidth,
        zIndex: item.z,
        transform: [{ rotate: `${item.rotate}deg` }],
        opacity: hidden ? 0 : 1,
      }}
    >
      <View
        collapsable={false}
        style={{
          borderRadius: CARD_RADIUS,
          backgroundColor: CARD_BG,
          paddingHorizontal: 12,
          paddingTop: 12,
          paddingBottom: 12,
          overflow: "hidden",
          ...Platform.select({
            ios: {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
            },
            android: { elevation: 6 },
          }),
        }}
      >
        <Text
          style={{
            fontFamily: typography.body.fontFamily,
            fontWeight: "800",
            fontSize: 15,
            lineHeight: 18,
            color: CARD_INK,
            letterSpacing: -0.2,
          }}
          numberOfLines={1}
        >
          {book}
        </Text>
        {passage ? (
          <Text
            style={{
              fontFamily: typography.body.fontFamily,
              fontWeight: "700",
              fontSize: 13,
              lineHeight: 16,
              color: CARD_INK_SOFT,
              marginTop: 1,
            }}
            numberOfLines={1}
          >
            {passage}
          </Text>
        ) : null}

        <View
          style={{
            marginTop: 10,
            width: "100%",
            aspectRatio: IMAGE_ASPECT,
            borderRadius: IMAGE_RADIUS,
            overflow: "hidden",
            backgroundColor: "#D8D2C6",
          }}
        >
          <Image
            source={source}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            contentPosition="center"
            transition={400}
            onError={() => setUseFallback(true)}
            accessibilityIgnoresInvertColors
          />
        </View>
      </View>
    </Pressable>
  );
}

export type HomeFloatingPrayerHomeProps = {
  nextBreakLabel: string;
  unlockedToday: boolean;
  onCompleteCard: (card: FloatingScriptureCard) => void;
  bottomInset: number;
};

export const HomeFloatingPrayerHome = memo(function HomeFloatingPrayerHome({
  nextBreakLabel,
  unlockedToday,
  onCompleteCard,
}: HomeFloatingPrayerHomeProps) {
  // Local-only — does not gate other screens or set a global default.
  const [fontsLoaded] = useFonts({
    [QUOTE_PLAYFAIR]: PlayfairDisplay_500Medium_Italic,
  });

  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState<FloatingScriptureCard | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [expandPhase, setExpandPhase] = useState<ExpandPhase>("hero");
  const [showSwipeHint, setShowSwipeHint] = useState(false);

  // Separate native-driver values only — never mix with layout props.
  const openProgress = useRef(new Animated.Value(0)).current;
  const detailProgress = useRef(new Animated.Value(0)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0)).current;
  const heroDragY = useRef(new Animated.Value(0)).current;

  const expandPhaseRef = useRef<ExpandPhase>("hero");
  const [promptLine, setPromptLine] = useState<string>(
    HOME_FLOATING_PROMPTS[0],
  );

  const activeImage = useFloatingCardImage(
    active ?? HOME_FLOATING_CARDS[0]!,
  );

  useEffect(() => {
    expandPhaseRef.current = expandPhase;
  }, [expandPhase]);

  useEffect(() => {
    let cancelled = false;
    advanceHomePrompt().then((line) => {
      if (!cancelled) setPromptLine(line);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeLines = useMemo(
    () => (active ? buildVerseLines(active.scriptureText) : []),
    [active],
  );
  const activeHeader = useMemo(
    () =>
      active
        ? splitScriptureReference(active.scriptureReference)
        : { book: "", passage: "" },
    [active],
  );
  const heroQuote = useMemo(() => firstVerseLine(activeLines), [activeLines]);
  const heroReference = useMemo(() => {
    if (!activeHeader.book) return "";
    return activeHeader.passage
      ? `${activeHeader.book} ${activeHeader.passage}`
      : activeHeader.book;
  }, [activeHeader]);

  const resetExpandState = useCallback(() => {
    openProgress.stopAnimation();
    detailProgress.stopAnimation();
    hintOpacity.stopAnimation();
    hintPulse.stopAnimation();
    heroDragY.stopAnimation();
    openProgress.setValue(0);
    detailProgress.setValue(0);
    hintOpacity.setValue(0);
    hintPulse.setValue(0);
    heroDragY.setValue(0);
    setExpandPhase("hero");
    setShowSwipeHint(false);
  }, [detailProgress, heroDragY, hintOpacity, hintPulse, openProgress]);

  const openCard = useCallback(
    (item: FloatingScriptureCard) => {
      haptics.soft();
      resetExpandState();
      setActive(item);
      setExpanded(true);

      if (reducedMotion) {
        openProgress.setValue(1);
        detailProgress.setValue(1);
        setExpandPhase("detail");
        return;
      }

      requestAnimationFrame(() => {
        Animated.timing(openProgress, {
          toValue: 1,
          duration: OPEN_MS,
          easing: LIQUID_OUT,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (!finished) return;
          setTimeout(() => {
            if (expandPhaseRef.current !== "hero") return;
            setShowSwipeHint(true);
            Animated.timing(hintOpacity, {
              toValue: 1,
              duration: 380,
              easing: LIQUID_OUT,
              useNativeDriver: true,
            }).start();
          }, HERO_HINT_DELAY_MS);
        });
      });
    },
    [detailProgress, hintOpacity, openProgress, reducedMotion, resetExpandState],
  );

  useEffect(() => {
    if (!showSwipeHint || reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulse, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(hintPulse, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hintPulse, reducedMotion, showSwipeHint]);

  const transitionToDetail = useCallback(() => {
    if (expandPhaseRef.current !== "hero") return;
    setExpandPhase("detail");
    setShowSwipeHint(false);
    haptics.soft();
    Animated.parallel([
      Animated.timing(hintOpacity, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.spring(heroDragY, {
        toValue: 0,
        damping: 24,
        stiffness: 300,
        useNativeDriver: true,
      }),
      Animated.timing(detailProgress, {
        toValue: 1,
        duration: reducedMotion ? 0 : 360,
        easing: LIQUID_OUT,
        useNativeDriver: true,
      }),
    ]).start();
  }, [detailProgress, heroDragY, hintOpacity, reducedMotion]);

  const closeExpanded = useCallback(() => {
    haptics.soft();
    if (reducedMotion) {
      resetExpandState();
      setExpanded(false);
      setActive(null);
      return;
    }
    Animated.parallel([
      Animated.timing(hintOpacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(detailProgress, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(openProgress, {
        toValue: 0,
        duration: CLOSE_MS,
        easing: LIQUID_IN,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      resetExpandState();
      setExpanded(false);
      setActive(null);
    });
  }, [
    detailProgress,
    hintOpacity,
    openProgress,
    reducedMotion,
    resetExpandState,
  ]);

  const finishCard = useCallback(() => {
    if (!active) return;
    haptics.tap();
    const card = active;
    if (reducedMotion) {
      resetExpandState();
      setExpanded(false);
      setActive(null);
      onCompleteCard(card);
      return;
    }
    Animated.parallel([
      Animated.timing(detailProgress, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(openProgress, {
        toValue: 0,
        duration: CLOSE_MS,
        easing: LIQUID_IN,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      resetExpandState();
      setExpanded(false);
      setActive(null);
      onCompleteCard(card);
    });
  }, [
    active,
    detailProgress,
    onCompleteCard,
    openProgress,
    reducedMotion,
    resetExpandState,
  ]);

  const snapHeroBack = useCallback(() => {
    Animated.spring(heroDragY, {
      toValue: 0,
      damping: 24,
      stiffness: 320,
      useNativeDriver: true,
    }).start();
  }, [heroDragY]);

  const onHeroPanUpdate = useCallback(
    (translationY: number) => {
      heroDragY.setValue(Math.max(0, translationY * 0.38));
    },
    [heroDragY],
  );

  const onHeroPanEnd = useCallback(
    (translationY: number, velocityY: number) => {
      if (
        translationY > SWIPE_DOWN_COMMIT_DY ||
        velocityY > SWIPE_DOWN_COMMIT_VY
      ) {
        transitionToDetail();
        return;
      }
      snapHeroBack();
    },
    [snapHeroBack, transitionToDetail],
  );

  const heroGesture = useMemo(
    () =>
      Gesture.Exclusive(
        Gesture.Pan()
          .enabled(expandPhase === "hero")
          .activeOffsetY(8)
          .failOffsetX([-24, 24])
          .onUpdate((event) => {
            onHeroPanUpdate(event.translationY);
          })
          .onEnd((event) => {
            onHeroPanEnd(event.translationY, event.velocityY);
          })
          .runOnJS(true),
        Gesture.Tap()
          .enabled(expandPhase === "hero" && showSwipeHint)
          .maxDuration(250)
          .onEnd(() => {
            transitionToDetail();
          })
          .runOnJS(true),
      ),
    [expandPhase, onHeroPanEnd, onHeroPanUpdate, showSwipeHint, transitionToDetail],
  );

  const shellOpacity = openProgress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.85, 1],
  });
  const shellScale = openProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });
  const heroOpacity = detailProgress.interpolate({
    inputRange: [0, 0.55],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const detailOpacity = detailProgress.interpolate({
    inputRange: [0.25, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const hintChevronY = hintPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View
        style={{ ...StyleSheet.absoluteFillObject, overflow: "hidden" }}
        pointerEvents="box-none"
      >
        {HOME_FLOATING_CARDS.map((item) => (
          <FloatingMiniCard
            key={item.id}
            item={item}
            onPress={() => openCard(item)}
            hidden={expanded && active?.id === item.id}
          />
        ))}
      </View>

      <View
        pointerEvents="box-none"
        style={{
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 40,
          zIndex: 20,
        }}
      >
        <View
          pointerEvents="none"
          style={{
            alignItems: "center",
            maxWidth: 300,
            paddingVertical: 28,
            paddingHorizontal: 20,
          }}
        >
          <Text
            style={{
              fontFamily: typography.body.fontFamily,
              fontWeight: "600",
              fontSize: 32,
              lineHeight: 38,
              letterSpacing: -0.4,
              color: colors.ink,
              textAlign: "center",
            }}
          >
            {unlockedToday ? "Apps unlocked" : promptLine}
          </Text>
          <Text
            style={{
              fontFamily: typography.body.fontFamily,
              fontWeight: "500",
              fontSize: 15,
              lineHeight: 22,
              color: colors.inkMuted,
              textAlign: "center",
              marginTop: 10,
            }}
          >
            {unlockedToday
              ? "Today's card is saved. Your apps are free for the rest of the day."
              : nextBreakLabel}
          </Text>
        </View>
      </View>

      <Modal
        visible={expanded && active != null}
        animationType="none"
        presentationStyle="overFullScreen"
        transparent
        onRequestClose={closeExpanded}
        statusBarTranslucent
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: "#000" }}>
            <Animated.View
              style={{
                flex: 1,
                opacity: shellOpacity,
                transform: [{ scale: shellScale }, { translateY: heroDragY }],
              }}
            >
              {/* Hero quote screen */}
              <Animated.View
                pointerEvents={expandPhase === "hero" ? "auto" : "none"}
                style={[StyleSheet.absoluteFillObject, { opacity: heroOpacity }]}
              >
                <Image
                  source={activeImage.source}
                  style={StyleSheet.absoluteFillObject}
                  contentFit="cover"
                  contentPosition="center"
                  onError={() => activeImage.setUseFallback(true)}
                  accessibilityIgnoresInvertColors
                />
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFillObject,
                    { backgroundColor: "rgba(0,0,0,0.48)" },
                  ]}
                />

                <View
                  pointerEvents="none"
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 36,
                  }}
                >
                  <View style={{ maxWidth: "85%", alignItems: "center" }}>
                    <Text
                      style={{
                        fontFamily: fontsLoaded
                          ? QUOTE_PLAYFAIR
                          : typography.reflectiveQuote.fontFamily,
                        fontSize: 26,
                        lineHeight: 36,
                        fontWeight: "500",
                        textAlign: "center",
                        color: QUOTE_INK,
                      }}
                    >
                      {heroQuote}
                    </Text>
                    {heroReference ? (
                      <Text
                        style={[
                          typography.smallLabel,
                          {
                            color: QUOTE_REF_INK,
                            textTransform: "uppercase",
                            letterSpacing: 1.2,
                            marginTop: 16,
                            textAlign: "center",
                          },
                        ]}
                      >
                        {heroReference}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <Animated.View
                  pointerEvents="none"
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    justifyContent: "flex-end",
                    alignItems: "center",
                    paddingBottom: insets.bottom + 28,
                    opacity: hintOpacity,
                  }}
                >
                  <Animated.View
                    style={{
                      alignItems: "center",
                      transform: [{ translateY: hintChevronY }],
                    }}
                  >
                    <SFSymbol
                      name="chevron.down"
                      size={18}
                      color="rgba(255,255,255,0.85)"
                      weight="semibold"
                    />
                    <Text
                      style={[
                        typography.smallLabel,
                        {
                          color: "rgba(255,255,255,0.72)",
                          textTransform: "uppercase",
                          marginTop: 8,
                          letterSpacing: 1.2,
                        },
                      ]}
                    >
                      Swipe down to continue
                    </Text>
                  </Animated.View>
                </Animated.View>

                {expandPhase === "hero" ? (
                  <GestureDetector gesture={heroGesture}>
                    <View
                      collapsable={false}
                      style={[
                        StyleSheet.absoluteFillObject,
                        { backgroundColor: "transparent" },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel="Swipe down to continue"
                      accessibilityHint="Swipe down or tap to read the full scripture card"
                    />
                  </GestureDetector>
                ) : null}
              </Animated.View>

              {/* Detail cream card */}
              <Animated.View
                pointerEvents={expandPhase === "detail" ? "auto" : "none"}
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: CARD_BG, opacity: detailOpacity },
                ]}
              >
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{
                    paddingBottom: insets.bottom + 28,
                  }}
                  contentInsetAdjustmentBehavior="never"
                  automaticallyAdjustContentInsets={false}
                  contentInset={{ top: 0, left: 0, bottom: 0, right: 0 }}
                  scrollIndicatorInsets={{ top: 0 }}
                  showsVerticalScrollIndicator={false}
                >
                  <View
                    style={{
                      width: "100%",
                      height: Math.round(windowWidth * 1.15) + insets.top,
                      marginTop: -insets.top,
                      overflow: "hidden",
                      backgroundColor: "#D8D2C6",
                      marginBottom: 8,
                    }}
                  >
                    <Image
                      source={activeImage.source}
                      style={{ width: "100%", height: "100%" }}
                      contentFit="cover"
                      contentPosition="center"
                      onError={() => activeImage.setUseFallback(true)}
                      accessibilityIgnoresInvertColors
                    />
                    <View
                      pointerEvents="none"
                      style={{
                        ...StyleSheet.absoluteFillObject,
                        backgroundColor: "rgba(0,0,0,0.28)",
                      }}
                    />
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        left: 28,
                        right: 28,
                        bottom: 28,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: typography.body.fontFamily,
                          fontWeight: "800",
                          fontSize: 40,
                          lineHeight: 42,
                          color: QUOTE_INK,
                          letterSpacing: -0.6,
                        }}
                      >
                        {activeHeader.book}
                      </Text>
                      {activeHeader.passage ? (
                        <Text
                          style={{
                            fontFamily: typography.body.fontFamily,
                            fontWeight: "800",
                            fontSize: 34,
                            lineHeight: 38,
                            color: QUOTE_INK,
                            marginTop: 2,
                          }}
                        >
                          {activeHeader.passage}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={{ paddingHorizontal: 28 }}>
                    {activeLines.map((line, index) => (
                      <View
                        key={`${index}-${line.text.slice(0, 12)}`}
                        style={{ marginTop: index === 0 ? 18 : 12 }}
                      >
                        <VerseLineText line={line} />
                      </View>
                    ))}

                    {active?.verseInsight ? (
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
                              letterSpacing: 1.1,
                            },
                          ]}
                        >
                          Insight
                        </Text>
                        <Text
                          style={[
                            typography.body,
                            { color: CARD_INK, marginTop: 8 },
                          ]}
                        >
                          {active.verseInsight}
                        </Text>
                      </>
                    ) : null}

                    {!unlockedToday ? (
                      <HoldToUnlockButton
                        label="Hold to unlock"
                        holdingLabel="Keep holding…"
                        onComplete={finishCard}
                        reducedMotion={reducedMotion}
                      />
                    ) : null}
                  </View>
                </ScrollView>
              </Animated.View>
            </Animated.View>

            {/* Outside the opacity/scale shell so nothing can hide it */}
            <Pressable
              onPress={closeExpanded}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={({ pressed }) => ({
                position: "absolute",
                top: Math.max(insets.top, 12) + 4,
                left: 16,
                zIndex: 9999,
                elevation: 9999,
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(0,0,0,0.72)",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: "rgba(255,255,255,0.55)",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 20,
                  fontWeight: "700",
                  lineHeight: 22,
                  marginTop: -1,
                }}
                allowFontScaling={false}
              >
                ✕
              </Text>
            </Pressable>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
});
