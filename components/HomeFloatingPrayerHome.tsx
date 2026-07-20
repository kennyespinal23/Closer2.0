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
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SFSymbol } from "@/components/Symbol";
import { ScriptureStickerNote } from "@/components/ScriptureStickerNote";
import {
  PHOTO_DIM_OVERLAY,
  PHOTO_OVERLAY_INK,
  PHOTO_OVERLAY_INK_MUTED,
} from "@/constants/heroChrome";
import {
  HOME_FLOATING_PROMPTS,
  type FloatingScriptureCard,
} from "@/constants/homePrototype";
import { minTouchTarget } from "@/constants/spacing";
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
const MINI_CARD_WIDTH_RATIO = 0.72;
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
    getSermonBackdrop(item.illustrationPrompt, item.day).then((url) => {
      if (!cancelled) {
        setImageUrl(url);
        setUseFallback(!url);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [item.day, item.id, item.illustrationPrompt]);

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

function ContinueButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        haptics.soft();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel="Continue"
      style={{
        marginTop: 32,
        minHeight: Math.max(56, minTouchTarget),
        borderRadius: 999,
        backgroundColor: CARD_INK,
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={[typography.button, { color: "#FFFFFF" }]}>Continue</Text>
    </Pressable>
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
        minHeight: Math.max(56, minTouchTarget),
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
  card,
  onPress,
  hidden,
}: {
  card: FloatingScriptureCard;
  onPress: () => void;
  hidden?: boolean;
}) {
  const { width: windowWidth } = useWindowDimensions();
  const { book, passage } = useMemo(
    () => splitScriptureReference(card.scriptureReference),
    [card.scriptureReference],
  );
  const cardWidth = windowWidth * MINI_CARD_WIDTH_RATIO;
  const { source, setUseFallback } = useFloatingCardImage(card);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${book}${passage ? ` ${passage}` : ""} scripture card`}
      style={{
        width: cardWidth,
        minWidth: minTouchTarget,
        minHeight: minTouchTarget,
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

function DetailSectionBlock({
  eyebrow,
  body,
}: {
  eyebrow: string;
  body: string;
}) {
  const trimmed = body.trim();
  if (!trimmed) return null;
  return (
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
        {eyebrow}
      </Text>
      <Text style={[typography.body, { color: CARD_INK, marginTop: 8 }]}>
        {trimmed}
      </Text>
    </>
  );
}

/** Status-dot tints — mirror StatusPill's semantic tone palette. */
const BREAK_TONE_DOT: Record<"live" | "armed" | "muted", string> = {
  live: "#22C55E",
  armed: "#F59E0B",
  muted: "#9CA3AF",
};

export type HomeFloatingPrayerHomeProps = {
  card: FloatingScriptureCard;
  nextBreakLabel: string;
  nextBreakTone: "live" | "armed" | "muted";
  unlockedToday: boolean;
  onCompleteCard: (card: FloatingScriptureCard) => void;
  bottomInset: number;
};

export const HomeFloatingPrayerHome = memo(function HomeFloatingPrayerHome({
  card,
  nextBreakLabel,
  nextBreakTone,
  unlockedToday,
  onCompleteCard,
}: HomeFloatingPrayerHomeProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState<FloatingScriptureCard>(card);
  const [expanded, setExpanded] = useState(false);
  const [expandPhase, setExpandPhase] = useState<ExpandPhase>("hero");
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [closePressed, setClosePressed] = useState(false);

  // Separate native-driver values only — never mix with layout props.
  const openProgress = useRef(new Animated.Value(0)).current;
  const detailProgress = useRef(new Animated.Value(0)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0)).current;
  const heroDragY = useRef(new Animated.Value(0)).current;
  const verseOpacity = useRef(new Animated.Value(0)).current;

  // Live block = apps are currently gated; otherwise the CTA is Continue.
  const hasOngoingAppBlock = nextBreakTone === "live";

  const expandPhaseRef = useRef<ExpandPhase>("hero");
  const expandedRef = useRef(false);
  const [promptLine, setPromptLine] = useState<string>(
    HOME_FLOATING_PROMPTS[0],
  );

  const activeImage = useFloatingCardImage(active);

  // The card is the daily "unlock gate", so it only appears once per
  // day around the person's scheduled app block:
  //   • "live"  — a block is firing right now → show the card (the
  //               gate to unlock apps).
  //   • "muted" — nothing scheduled at all → still show it so a
  //               brand-new user can read / unlock manually.
  //   • "armed" — a block is scheduled for later → hide the card and
  //               leave just the prompt + status pill until it fires.
  // Once today's card is saved (unlockedToday) it stays hidden for
  // the rest of the day.
  const showCard = !unlockedToday && nextBreakTone !== "armed";

  useEffect(() => {
    expandPhaseRef.current = expandPhase;
  }, [expandPhase]);

  useEffect(() => {
    expandedRef.current = expanded;
  }, [expanded]);

  // When the day advances, sync the home card unless the expand modal is open.
  useEffect(() => {
    if (expandedRef.current) return;
    setActive(card);
  }, [card]);

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
    () => buildVerseLines(active.scriptureText),
    [active],
  );
  const activeHeader = useMemo(
    () => splitScriptureReference(active.scriptureReference),
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
    verseOpacity.stopAnimation();
    openProgress.setValue(0);
    detailProgress.setValue(0);
    hintOpacity.setValue(0);
    hintPulse.setValue(0);
    heroDragY.setValue(0);
    verseOpacity.setValue(0);
    setExpandPhase("hero");
    setShowSwipeHint(false);
  }, [
    detailProgress,
    heroDragY,
    hintOpacity,
    hintPulse,
    openProgress,
    verseOpacity,
  ]);

  const fadeInVerse = useCallback(() => {
    verseOpacity.stopAnimation();
    verseOpacity.setValue(0);
    Animated.timing(verseOpacity, {
      toValue: 1,
      duration: reducedMotion ? 220 : 900,
      delay: reducedMotion ? 40 : 280,
      easing: LIQUID_OUT,
      useNativeDriver: true,
    }).start();
  }, [reducedMotion, verseOpacity]);

  const openCard = useCallback(
    (item: FloatingScriptureCard) => {
      haptics.soft();
      resetExpandState();
      setActive(item);
      setExpanded(true);

      if (reducedMotion) {
        // Reduced motion: swap the scale/slide expand for a plain
        // opacity cross-fade (HIG: replace motion with a fade rather
        // than snapping). Land on the hero quote like the full-motion
        // path so the experience is identical minus the zoom.
        detailProgress.setValue(0);
        openProgress.setValue(0);
        requestAnimationFrame(() => {
          fadeInVerse();
          Animated.timing(openProgress, {
            toValue: 1,
            duration: 260,
            easing: LIQUID_OUT,
            useNativeDriver: true,
          }).start(({ finished }) => {
            if (!finished || expandPhaseRef.current !== "hero") return;
            setShowSwipeHint(true);
            Animated.timing(hintOpacity, {
              toValue: 1,
              duration: 200,
              easing: LIQUID_OUT,
              useNativeDriver: true,
            }).start();
          });
        });
        return;
      }

      requestAnimationFrame(() => {
        fadeInVerse();
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
    [
      detailProgress,
      fadeInVerse,
      hintOpacity,
      openProgress,
      reducedMotion,
      resetExpandState,
    ],
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
        // Hero→detail is already an opacity cross-fade, so keep a short
        // fade even under reduced motion rather than snapping.
        toValue: 1,
        duration: reducedMotion ? 220 : 360,
        easing: LIQUID_OUT,
        useNativeDriver: true,
      }),
    ]).start();
  }, [detailProgress, heroDragY, hintOpacity, reducedMotion]);

  const closeExpanded = useCallback(() => {
    haptics.soft();
    if (reducedMotion) {
      // Reduced motion: fade the shell out instead of snapping away.
      Animated.timing(openProgress, {
        toValue: 0,
        duration: 200,
        easing: LIQUID_IN,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        resetExpandState();
        setExpanded(false);
        setActive(card);
      });
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
      setActive(card);
    });
  }, [
    card,
    detailProgress,
    hintOpacity,
    openProgress,
    reducedMotion,
    resetExpandState,
  ]);

  const finishCard = useCallback(() => {
    haptics.tap();
    const completed = active;
    if (reducedMotion) {
      // Reduced motion: fade out instead of snapping, then complete.
      Animated.timing(openProgress, {
        toValue: 0,
        duration: 200,
        easing: LIQUID_IN,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (!finished) return;
        resetExpandState();
        setExpanded(false);
        setActive(card);
        onCompleteCard(completed);
      });
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
      setActive(card);
      onCompleteCard(completed);
    });
  }, [
    active,
    card,
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
      {/* Single centered column: prompt copy sits ABOVE the card so the
          two never overlap. (They were previously two separate
          absolute-fill layers both centered, which stacked the card on
          top of the text.) */}
      <View
        pointerEvents="box-none"
        style={{
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          pointerEvents="none"
          style={{
            alignItems: "center",
            maxWidth: 300,
            paddingHorizontal: 20,
            marginBottom: showCard ? 28 : 0,
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
          {unlockedToday ? (
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
              Today&apos;s card is saved. Your apps are free for the rest of the
              day.
            </Text>
          ) : (
            <View
              style={{
                marginTop: 16,
                flexDirection: "row",
                alignItems: "center",
                alignSelf: "center",
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 999,
                backgroundColor: colors.surface,
                shadowColor: "#000",
                shadowOpacity: 0.08,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 2 },
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 999,
                  marginRight: 7,
                  backgroundColor: BREAK_TONE_DOT[nextBreakTone],
                }}
              />
              <Text
                style={{
                  fontFamily: typography.body.fontFamily,
                  fontWeight: "600",
                  fontSize: 13,
                  lineHeight: 16,
                  letterSpacing: -0.08,
                  color: colors.inkMuted,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                {nextBreakLabel}
              </Text>
            </View>
          )}
        </View>

        {showCard ? (
          <FloatingMiniCard
            card={card}
            onPress={() => openCard(card)}
            hidden={expanded}
          />
        ) : null}
      </View>

      <Modal
        visible={expanded}
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
                // Under reduced motion we drop the scale zoom and lean on
                // the opacity cross-fade alone (heroDragY stays — it's a
                // direct-manipulation gesture, not decorative motion).
                transform: reducedMotion
                  ? [{ translateY: heroDragY }]
                  : [{ scale: shellScale }, { translateY: heroDragY }],
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
                    { backgroundColor: "rgba(0, 0, 0, 0.1)" },
                  ]}
                />

                <Animated.View
                  pointerEvents="none"
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 28,
                    opacity: verseOpacity,
                  }}
                >
                  <ScriptureStickerNote
                    quote={heroQuote}
                    reference={heroReference || undefined}
                    maxWidth={windowWidth * 0.82}
                  />
                </Animated.View>

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
                      color="rgba(20, 20, 20, 0.72)"
                      weight="semibold"
                    />
                    <Text
                      style={[
                        typography.smallLabel,
                        {
                          color: "rgba(20, 20, 20, 0.72)",
                          textTransform: "uppercase",
                          marginTop: 8,
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
                        backgroundColor: PHOTO_DIM_OVERLAY,
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
                          fontFamily: typography.photoQuote.fontFamily,
                          fontStyle: "normal",
                          fontWeight: "700",
                          fontSize: 40,
                          lineHeight: 42,
                          color: PHOTO_OVERLAY_INK,
                          letterSpacing: -0.6,
                        }}
                      >
                        {activeHeader.book}
                      </Text>
                      {activeHeader.passage ? (
                        <Text
                          style={{
                            fontFamily: typography.photoQuote.fontFamily,
                            fontStyle: "normal",
                            fontWeight: "700",
                            fontSize: 34,
                            lineHeight: 38,
                            color: PHOTO_OVERLAY_INK,
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

                    <DetailSectionBlock eyebrow="Story" body={active.story} />
                    <DetailSectionBlock eyebrow="Insight" body={active.insight} />

                    {!unlockedToday ? (
                      hasOngoingAppBlock ? (
                        <HoldToUnlockButton
                          label="Hold to Unlock your apps"
                          holdingLabel="Keep holding…"
                          onComplete={finishCard}
                          reducedMotion={reducedMotion}
                        />
                      ) : (
                        <ContinueButton onPress={finishCard} />
                      )
                    ) : null}
                  </View>
                </ScrollView>
              </Animated.View>
            </Animated.View>

            {/* Outside the opacity/scale shell so nothing can hide it.
                High-contrast disc — the previous dark pill disappeared
                into the sky photo on the detail phase (screenshot
                audit: users reported "no back button"). */}
            <Pressable
              onPress={closeExpanded}
              onPressIn={() => setClosePressed(true)}
              onPressOut={() => setClosePressed(false)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={{
                position: "absolute",
                top: Math.max(insets.top, 12) + 4,
                left: 16,
                zIndex: 9999,
                elevation: 9999,
                width: minTouchTarget,
                height: minTouchTarget,
                borderRadius: minTouchTarget / 2,
                backgroundColor: "rgba(255,255,255,0.92)",
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: "rgba(0,0,0,0.12)",
                alignItems: "center",
                justifyContent: "center",
                opacity: closePressed ? 0.75 : 1,
                shadowColor: "#000",
                shadowOpacity: 0.18,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <SFSymbol
                name="xmark"
                size={16}
                color="#0F0F0F"
                weight="semibold"
              />
            </Pressable>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
});
