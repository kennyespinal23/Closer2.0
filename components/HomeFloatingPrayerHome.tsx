import { memo, useCallback, useEffect, useMemo, useRef, useState, forwardRef } from "react";
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
  type View as RNView,
} from "react-native";
import { Image } from "expo-image";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { SFSymbol } from "@/components/Symbol";
import { ScriptureStickerNote } from "@/components/ScriptureStickerNote";
import { HomeQuoteText } from "@/components/HomeQuoteText";
import {
  PHOTO_DIM_OVERLAY,
  PHOTO_OVERLAY_INK,
  PHOTO_OVERLAY_INK_MUTED,
} from "@/constants/heroChrome";
import { type FloatingScriptureCard } from "@/constants/homePrototype";
import { minTouchTarget } from "@/constants/spacing";
import { CLOSER_ACCENT } from "@/constants/theme";
import * as haptics from "@/lib/haptics";
import {
  resolveHomeQuote,
  subscribeHomeQuotePreview,
  type HomeQuote,
} from "@/lib/homeQuotes";
import { typography } from "@/lib/typography";
import { useReducedMotion } from "@/lib/useReducedMotion";
import {
  getSermonBackdrop,
  HERO_BACKDROP_FALLBACK,
} from "@/services/unsplashService";
import { useColors } from "@/state/theme";

const CARD_RADIUS = 22;
/** Full-bleed unread delivery room — matches brand orange accent. */
const ENVELOPE_ROOM = CLOSER_ACCENT;
const ENVELOPE_LAVENDER = "#CDB8E8";
const ENVELOPE_LAVENDER_DEEP = "#B79AD6";
const ENVELOPE_LAVENDER_LIP = "#E2D4F4";
const LETTER_CREAM = "#F7F1E6";
const LIQUID_OUT = Easing.bezier(0.22, 1, 0.36, 1);
const LIQUID_IN = Easing.bezier(0.4, 0, 0.2, 1);
const HERO_HINT_DELAY_MS = 4200;
const HOLD_UNLOCK_MS = 1600;
const SWIPE_DOWN_COMMIT_DY = 40;
const SWIPE_DOWN_COMMIT_VY = 400;
const CLOSE_MS = 320;
const ENVELOPE_OPEN_MS = 640;
/** Pause on the opened letter + title before handing off to reading. */
const ENVELOPE_HOLD_MS = 3000;
/** Photo fade after envelope → verse hero. */
const REVEAL_PHOTO_MS = 480;
/** Scrap rise into the hero. */
const REVEAL_STICKER_MS = 720;

type CardBounds = { x: number; y: number; width: number; height: number };

/** Floating cream card / quote-screen cream shell. */
const CARD_BG = "#F4F0E6";
const CARD_INK = "#141414";
const CARD_INK_SOFT = "rgba(20, 20, 20, 0.72)";

type ExpandPhase = "hero" | "detail";

type VerseLine = {
  verseNum?: string;
  text: string;
};

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
        backgroundColor: CLOSER_ACCENT,
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

/**
 * Big lavender envelope on the orange delivery room.
 * Tap: flap opens → cream letter rises → hold on the title →
 * then `onOpened` hands off to the existing reading modal.
 */
const DevotionalEnvelope = forwardRef<
  RNView,
  {
    card: FloatingScriptureCard;
    /** Called after the open choreography + hold finish. */
    onOpened: () => void;
    hidden?: boolean;
    width: number;
  }
>(function DevotionalEnvelope({ card, onOpened, hidden, width }, ref) {
  const reducedMotion = useReducedMotion();
  const breathe = useRef(new Animated.Value(0)).current;
  const flap = useRef(new Animated.Value(0)).current;
  const letter = useRef(new Animated.Value(0)).current;
  const openingRef = useRef(false);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { book, passage } = useMemo(
    () => splitScriptureReference(card.scriptureReference),
    [card.scriptureReference],
  );

  const envW = width;
  const envH = Math.round(width * 0.66);
  const letterW = Math.round(envW * 0.72);
  const letterH = Math.round(envH * 0.78);
  const flapH = Math.round(envH * 0.58);

  // viewBox geometry for a classic mail envelope
  const W = 280;
  const H = 176;
  const flapTipY = H * 0.58;

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (hidden) return;
    // Reset when returning to the unread envelope state.
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    openingRef.current = false;
    flap.setValue(0);
    letter.setValue(0);
  }, [flap, hidden, letter, card.id]);

  useEffect(() => {
    if (reducedMotion || hidden || openingRef.current) {
      breathe.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breathe, hidden, reducedMotion]);

  const lift = breathe.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const flapRotate = flap.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-168deg"],
  });
  const letterRise = letter.interpolate({
    inputRange: [0, 1],
    outputRange: [envH * 0.28, -envH * 0.42],
  });
  const letterScale = letter.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1],
  });

  const finishOpen = () => {
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      onOpened();
    }, ENVELOPE_HOLD_MS);
  };

  const runOpen = () => {
    if (openingRef.current || hidden) return;
    openingRef.current = true;
    haptics.soft();
    breathe.stopAnimation();
    breathe.setValue(0);

    if (reducedMotion) {
      flap.setValue(1);
      letter.setValue(1);
      finishOpen();
      return;
    }

    Animated.parallel([
      Animated.timing(flap, {
        toValue: 1,
        duration: ENVELOPE_OPEN_MS,
        easing: LIQUID_OUT,
        useNativeDriver: true,
      }),
      Animated.timing(letter, {
        toValue: 1,
        duration: ENVELOPE_OPEN_MS,
        delay: 90,
        easing: LIQUID_OUT,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) finishOpen();
    });
  };

  return (
    <Pressable
      onPress={runOpen}
      hitSlop={12}
      accessibilityRole="button"
      accessibilityLabel={`Open today's reading, ${book}${passage ? ` ${passage}` : ""}`}
      style={{
        minWidth: minTouchTarget,
        minHeight: minTouchTarget,
        opacity: hidden ? 0 : 1,
      }}
    >
      <Animated.View
        style={{
          width: envW,
          transform: [{ translateY: lift }],
        }}
      >
        <View
          ref={ref}
          collapsable={false}
          style={{
            width: envW,
            height: envH + 48,
            alignItems: "center",
            justifyContent: "flex-end",
            overflow: "visible",
          }}
        >
          {/* Back of envelope */}
          <View
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: envW,
              height: envH,
              zIndex: 1,
              ...Platform.select({
                ios: {
                  shadowColor: "#5A1840",
                  shadowOffset: { width: 0, height: 16 },
                  shadowOpacity: 0.28,
                  shadowRadius: 24,
                },
                android: { elevation: 12 },
              }),
            }}
          >
            <Svg width={envW} height={envH} viewBox={`0 0 ${W} ${H}`}>
              <Defs>
                <LinearGradient id="envBodyLav" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={ENVELOPE_LAVENDER_LIP} />
                  <Stop offset="1" stopColor={ENVELOPE_LAVENDER} />
                </LinearGradient>
              </Defs>
              <Path
                d={`M 10 18
                    Q 10 8 20 8
                    L ${W - 20} 8
                    Q ${W - 10} 8 ${W - 10} 18
                    L ${W - 10} ${H - 14}
                    Q ${W - 10} ${H - 4} ${W - 20} ${H - 4}
                    L 20 ${H - 4}
                    Q 10 ${H - 4} 10 ${H - 14}
                    Z`}
                fill="url(#envBodyLav)"
              />
            </Svg>
          </View>

          {/* Cream letter — rises from the pocket as the flap opens */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              bottom: envH * 0.18,
              width: letterW,
              height: letterH,
              borderRadius: 18,
              backgroundColor: LETTER_CREAM,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 18,
              zIndex: 2,
              transform: [
                { translateY: letterRise },
                { scale: letterScale },
                { rotate: "-4deg" },
              ],
              ...Platform.select({
                ios: {
                  shadowColor: "#3A1840",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.18,
                  shadowRadius: 16,
                },
                android: { elevation: 8 },
              }),
            }}
          >
            <Text
              style={[
                typography.smallLabel,
                {
                  color: CLOSER_ACCENT,
                  textTransform: "uppercase",
                },
              ]}
              allowFontScaling={false}
            >
              Today
            </Text>
            <Text
              style={{
                marginTop: 10,
                fontFamily: "System",
                fontWeight: "800",
                fontSize: 26,
                lineHeight: 30,
                letterSpacing: -0.5,
                color: CARD_INK,
                textAlign: "center",
              }}
              numberOfLines={2}
            >
              {book}
            </Text>
            {passage ? (
              <Text
                style={{
                  marginTop: 4,
                  fontFamily: "System",
                  fontWeight: "600",
                  fontSize: 17,
                  lineHeight: 22,
                  color: CARD_INK_SOFT,
                  textAlign: "center",
                }}
                numberOfLines={1}
              >
                {passage}
              </Text>
            ) : null}
          </Animated.View>

          {/* Front pockets — frame the letter */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              bottom: 0,
              width: envW,
              height: envH,
              zIndex: 3,
            }}
          >
            <Svg width={envW} height={envH} viewBox={`0 0 ${W} ${H}`}>
              <Defs>
                <LinearGradient id="envPocketLLav" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={ENVELOPE_LAVENDER_DEEP} />
                  <Stop offset="1" stopColor={ENVELOPE_LAVENDER} />
                </LinearGradient>
                <LinearGradient id="envPocketRLav" x1="1" y1="0" x2="0" y2="0">
                  <Stop offset="0" stopColor={ENVELOPE_LAVENDER_DEEP} />
                  <Stop offset="1" stopColor={ENVELOPE_LAVENDER} />
                </LinearGradient>
              </Defs>
              <Path
                d={`M 10 18 L ${W / 2} ${flapTipY} L 10 ${H - 14} Z`}
                fill="url(#envPocketLLav)"
                opacity={0.95}
              />
              <Path
                d={`M ${W - 10} 18 L ${W / 2} ${flapTipY} L ${W - 10} ${H - 14} Z`}
                fill="url(#envPocketRLav)"
                opacity={0.95}
              />
              <Path
                d={`M 10 ${H - 14}
                    Q 10 ${H - 4} 20 ${H - 4}
                    L ${W - 20} ${H - 4}
                    Q ${W - 10} ${H - 4} ${W - 10} ${H - 14}
                    L ${W / 2} ${flapTipY}
                    Z`}
                fill={ENVELOPE_LAVENDER_LIP}
              />
            </Svg>
          </View>

          {/* Top flap — rotates open around its top edge */}
          <Animated.View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: 0,
              bottom: envH - flapH,
              width: envW,
              height: flapH,
              zIndex: 5,
              transform: [
                { perspective: 900 },
                { translateY: -flapH / 2 },
                { rotateX: flapRotate },
                { translateY: flapH / 2 },
              ],
              backfaceVisibility: "hidden",
            }}
          >
            <Svg width={envW} height={flapH} viewBox={`0 0 ${W} ${flapTipY + 4}`}>
              <Path
                d={`M 10 18
                    L ${W / 2} ${flapTipY}
                    L ${W - 10} 18
                    Q ${W - 10} 8 ${W - 20} 8
                    L 20 8
                    Q 10 8 10 18
                    Z`}
                fill={ENVELOPE_LAVENDER_LIP}
                stroke="rgba(90,40,120,0.12)"
                strokeWidth={1}
              />
              <Path
                d={`M 18 20 L ${W / 2} ${flapTipY - 2} L ${W - 18} 20`}
                fill="none"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth={1.5}
              />
            </Svg>
          </Animated.View>
        </View>
      </Animated.View>
    </Pressable>
  );
});

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
  /** Returns true when navigation leaves home (e.g. streak screen). */
  onCompleteCard: (card: FloatingScriptureCard) => boolean;
  bottomInset: number;
};

export const HomeFloatingPrayerHome = memo(function HomeFloatingPrayerHome({
  card,
  nextBreakLabel,
  nextBreakTone,
  unlockedToday,
  onCompleteCard,
  bottomInset,
}: HomeFloatingPrayerHomeProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const [active, setActive] = useState<FloatingScriptureCard>(card);
  const [expanded, setExpanded] = useState(false);
  const [expandPhase, setExpandPhase] = useState<ExpandPhase>("hero");
  const [showSwipeHint, setShowSwipeHint] = useState(false);
  const [closePressed, setClosePressed] = useState(false);
  /** Live app-block gate — hide dismiss chrome until they finish. */
  const [dismissLocked, setDismissLocked] = useState(false);
  const [cardBounds, setCardBounds] = useState<CardBounds | null>(null);
  const miniCardRef = useRef<RNView>(null);

  // Layout morph uses JS driver; content fades stay on the native driver.
  const morphProgress = useRef(new Animated.Value(0)).current;
  const openProgress = useRef(new Animated.Value(0)).current;
  const detailProgress = useRef(new Animated.Value(0)).current;
  const hintOpacity = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0)).current;
  const heroDragY = useRef(new Animated.Value(0)).current;
  const verseOpacity = useRef(new Animated.Value(0)).current;
  /** Scrap entrance — rise + fade after the envelope handoff. */
  const heroEnter = useRef(new Animated.Value(0)).current;

  // Live block = apps are currently gated; otherwise the CTA is Continue.
  const hasOngoingAppBlock = nextBreakTone === "live";

  const expandPhaseRef = useRef<ExpandPhase>("hero");
  const expandedRef = useRef(false);
  const [homeQuote, setHomeQuote] = useState<HomeQuote | null>(() =>
    resolveHomeQuote(),
  );

  const activeImage = useFloatingCardImage(active);

  // Envelope while today's reading is still open; after finish, Home
  // returns to the reflective quote + next-break pill.
  const showCard = !unlockedToday;

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
    const refresh = () => setHomeQuote(resolveHomeQuote());
    refresh();
    const unsub = subscribeHomeQuotePreview(refresh);
    const id = setInterval(refresh, 60_000);
    return () => {
      unsub();
      clearInterval(id);
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
    morphProgress.stopAnimation();
    openProgress.stopAnimation();
    detailProgress.stopAnimation();
    hintOpacity.stopAnimation();
    hintPulse.stopAnimation();
    heroDragY.stopAnimation();
    verseOpacity.stopAnimation();
    heroEnter.stopAnimation();
    morphProgress.setValue(0);
    openProgress.setValue(0);
    detailProgress.setValue(0);
    hintOpacity.setValue(0);
    hintPulse.setValue(0);
    heroDragY.setValue(0);
    verseOpacity.setValue(0);
    heroEnter.setValue(0);
    setExpandPhase("hero");
    setShowSwipeHint(false);
  }, [
    detailProgress,
    heroDragY,
    heroEnter,
    hintOpacity,
    hintPulse,
    morphProgress,
    openProgress,
    verseOpacity,
  ]);

  const measureMiniCard = useCallback((): Promise<CardBounds | null> => {
    return new Promise((resolve) => {
      miniCardRef.current?.measureInWindow((x, y, width, height) => {
        if (width > 0 && height > 0) {
          resolve({ x, y, width, height });
          return;
        }
        resolve(null);
      });
    });
  }, []);

  const envelopeWidth = Math.min(windowWidth * 0.98, 420);
  const envelopeHeight = Math.round(envelopeWidth * 0.66);

  const fallbackCardBounds = useCallback((): CardBounds => {
    const width = envelopeWidth;
    const height = envelopeHeight;
    return {
      x: windowWidth - width + 36,
      y: Math.max(windowHeight - height - bottomInset + 8, insets.top + 160),
      width,
      height,
    };
  }, [
    bottomInset,
    envelopeHeight,
    envelopeWidth,
    insets.top,
    windowHeight,
    windowWidth,
  ]);

  const showHeroHint = useCallback(() => {
    if (expandPhaseRef.current !== "hero") return;
    setShowSwipeHint(true);
    Animated.timing(hintOpacity, {
      toValue: 1,
      duration: reducedMotion ? 200 : 380,
      easing: LIQUID_OUT,
      useNativeDriver: true,
    }).start();
  }, [hintOpacity, reducedMotion]);

  const openCard = useCallback(
    async (
      item: FloatingScriptureCard,
      opts?: { silent?: boolean; dismissLocked?: boolean },
    ) => {
      if (!opts?.silent) haptics.soft();
      // Bounds kept for layout fallbacks; entrance is a full-screen reveal
      // (not a morph from the bottom-right envelope).
      const bounds = (await measureMiniCard()) ?? fallbackCardBounds();
      setCardBounds(bounds);
      resetExpandState();
      setActive(item);
      // Live app-block gate: no X / back dismiss — finish the card.
      setDismissLocked(
        opts?.dismissLocked === true || nextBreakTone === "live",
      );
      // Full-screen shell immediately — avoids the cream card morph
      // growing out of the lavender envelope.
      morphProgress.setValue(1);
      setExpanded(true);

      if (reducedMotion) {
        openProgress.setValue(1);
        heroEnter.setValue(1);
        verseOpacity.setValue(1);
        requestAnimationFrame(() => {
          showHeroHint();
        });
        return;
      }

      requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(openProgress, {
            toValue: 1,
            duration: REVEAL_PHOTO_MS,
            easing: LIQUID_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(heroEnter, {
            toValue: 1,
            duration: REVEAL_STICKER_MS,
            delay: 100,
            easing: LIQUID_OUT,
            useNativeDriver: true,
          }),
          Animated.timing(verseOpacity, {
            toValue: 1,
            duration: REVEAL_STICKER_MS,
            delay: 160,
            easing: LIQUID_OUT,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (!finished) return;
          setTimeout(showHeroHint, Math.round(HERO_HINT_DELAY_MS * 0.55));
        });
      });
    },
    [
      fallbackCardBounds,
      heroEnter,
      measureMiniCard,
      morphProgress,
      nextBreakTone,
      openProgress,
      reducedMotion,
      resetExpandState,
      showHeroHint,
      verseOpacity,
    ],
  );

  // Cold-open / resume into a live app block → land on the verse
  // hero immediately (verse fades in via openCard → fadeInVerse).
  // Once per live window so closing the card doesn't force-reopen.
  const autoOpenedForLiveRef = useRef(false);
  useEffect(() => {
    if (nextBreakTone !== "live" || unlockedToday) {
      autoOpenedForLiveRef.current = false;
      return;
    }
    if (autoOpenedForLiveRef.current || expanded) return;
    autoOpenedForLiveRef.current = true;
    const timer = setTimeout(() => {
      openCard(card, { silent: true, dismissLocked: true });
    }, 450);
    return () => clearTimeout(timer);
  }, [card, expanded, nextBreakTone, openCard, unlockedToday]);

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

  const dismissExpanded = useCallback(
    (nextActive: FloatingScriptureCard = card) => {
      const finish = () => {
        resetExpandState();
        setDismissLocked(false);
        setExpanded(false);
        setActive(nextActive);
      };

      if (reducedMotion) {
        Animated.timing(openProgress, {
          toValue: 0,
          duration: 200,
          easing: LIQUID_IN,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) finish();
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
        Animated.timing(heroEnter, {
          toValue: 0,
          duration: Math.round(CLOSE_MS * 0.65),
          easing: LIQUID_IN,
          useNativeDriver: true,
        }),
        Animated.timing(verseOpacity, {
          toValue: 0,
          duration: Math.round(CLOSE_MS * 0.55),
          easing: LIQUID_IN,
          useNativeDriver: true,
        }),
        Animated.timing(openProgress, {
          toValue: 0,
          duration: CLOSE_MS,
          easing: LIQUID_IN,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) finish();
      });
    },
    [
      card,
      detailProgress,
      heroEnter,
      hintOpacity,
      openProgress,
      reducedMotion,
      resetExpandState,
      verseOpacity,
    ],
  );

  const closeExpanded = useCallback(() => {
    if (dismissLocked) return;
    haptics.soft();
    dismissExpanded(card);
  }, [card, dismissExpanded, dismissLocked]);

  const finishCard = useCallback(() => {
    haptics.tap();
    const completed = active;
    // Complete + navigate BEFORE collapsing the modal. Closing first
    // flashes home ("unlocked" copy) under the streak transition.
    const navigatedAway = onCompleteCard(completed);
    if (navigatedAway) return;
    dismissExpanded(card);
  }, [active, card, dismissExpanded, onCompleteCard]);

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

  const origin = cardBounds ?? fallbackCardBounds();
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
  const shellOpacity = openProgress.interpolate({
    inputRange: [0, 0.2, 1],
    outputRange: [0, 1, 1],
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
  const stickerOpacity = heroEnter.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });
  const stickerRise = heroEnter.interpolate({
    inputRange: [0, 1],
    outputRange: [36, 0],
  });
  const stickerScale = heroEnter.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1],
  });

  return (
    <View style={{ flex: 1, backgroundColor: showCard ? ENVELOPE_ROOM : colors.bg }}>
      <View
        pointerEvents="box-none"
        style={{
          ...StyleSheet.absoluteFillObject,
          alignItems: "center",
          justifyContent: "center",
          paddingBottom: 24,
          backgroundColor: showCard ? ENVELOPE_ROOM : "transparent",
        }}
      >
        {showCard ? (
          <>
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: insets.top + 28,
                left: 28,
                right: 28,
              }}
            >
              <Text
                style={[
                  typography.smallLabel,
                  {
                    color: "rgba(255,255,255,0.85)",
                    textTransform: "uppercase",
                  },
                ]}
                allowFontScaling={false}
              >
                Today&apos;s reading
              </Text>
              <Text
                style={{
                  marginTop: 6,
                  fontFamily: "System",
                  fontWeight: "700",
                  fontSize: 28,
                  lineHeight: 34,
                  letterSpacing: -0.8,
                  color: "#FFFFFF",
                }}
                numberOfLines={1}
              >
                Tap to open
              </Text>
            </View>
            <View
              style={{
                position: "absolute",
                right: -36,
                bottom: Math.max(bottomInset - 28, 24),
                transform: [{ rotate: "-10deg" }],
              }}
            >
              <DevotionalEnvelope
                ref={miniCardRef}
                card={card}
                width={Math.min(windowWidth * 0.98, 420)}
                onOpened={() => {
                  void openCard(card);
                }}
                hidden={expanded}
              />
            </View>
          </>
        ) : (
          <View
            pointerEvents="none"
            style={{
              alignItems: "center",
              maxWidth: 360,
              paddingHorizontal: 12,
            }}
          >
            {homeQuote ? (
              <HomeQuoteText quote={homeQuote} maxWidth={340} />
            ) : null}
            <View
              style={{
                marginTop: homeQuote ? 14 : 16,
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
          </View>
        )}
      </View>

      <Modal
        visible={expanded}
        animationType="none"
        presentationStyle="overFullScreen"
        transparent
        onRequestClose={() => {
          if (!dismissLocked) closeExpanded();
        }}
        statusBarTranslucent
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={{ flex: 1 }} pointerEvents="box-none">
            <Animated.View
              pointerEvents="none"
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: "#000",
                opacity: morphProgress.interpolate({
                  inputRange: [0, 0.35, 1],
                  outputRange: [0, 0.55, 1],
                }),
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
                backgroundColor: "#000",
                overflow: "hidden",
              }}
            >
              <Animated.View
                style={{
                  ...StyleSheet.absoluteFillObject,
                  opacity: shellOpacity,
                  transform: [{ translateY: heroDragY }],
                }}
              >
              {/* Hero quote screen */}
              <Animated.View
                pointerEvents={expandPhase === "hero" ? "auto" : "none"}
                style={[StyleSheet.absoluteFillObject, { opacity: heroOpacity }]}
              >
                <Animated.View
                  style={[StyleSheet.absoluteFillObject, { opacity: openProgress }]}
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
                </Animated.View>

                <Animated.View
                  pointerEvents="none"
                  style={{
                    ...StyleSheet.absoluteFillObject,
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 28,
                    opacity: stickerOpacity,
                    transform: [
                      { translateY: stickerRise },
                      { scale: stickerScale },
                    ],
                  }}
                >
                  <ScriptureStickerNote
                    quote={heroQuote}
                    reference={heroReference || undefined}
                    maxWidth={windowWidth * 0.82}
                    textOpacity={verseOpacity}
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
                      color={PHOTO_OVERLAY_INK}
                      weight="semibold"
                    />
                    <Text
                      style={[
                        typography.smallLabel,
                        {
                          color: PHOTO_OVERLAY_INK,
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
            </Animated.View>

            {/* Outside the morph shell so nothing can hide it.
                Hidden during a live app-block gate — they must finish
                the card (Hold to Unlock) rather than dismiss. */}
            {!dismissLocked ? (
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
            ) : null}
          </View>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
});
