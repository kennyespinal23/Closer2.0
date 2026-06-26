import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Animated,
  Easing,
  PanResponder,
  Pressable,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SFSymbol } from "@/components/Symbol";
import * as haptics from "@/lib/haptics";
import { skipLaunchSplashForSession } from "@/lib/launchSplashSession";
import {
  getRandomMoment,
  getTimeCategory,
  splitMomentText,
} from "@/lib/rotatingMoments";
import {
  isRotatingMomentSaved,
  markRotatingMomentShown,
  saveRotatingMoment,
} from "@/lib/rotatingMomentStorage";
import { shareRaw } from "@/lib/share";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { typography } from "@/lib/typography";
import { useOnboarding } from "@/state/onboarding";

const BG = "#000000";
const INK = "#FFFFFF";
const REFERENCE = "rgba(255, 255, 255, 0.55)";
const ICON_DISC = "rgba(255, 255, 255, 0.12)";
const HINT = "rgba(255, 255, 255, 0.45)";

/** Upward travel or fling needed to commit into the app. */
const SWIPE_COMMIT_DY = -72;
const SWIPE_COMMIT_VY = -0.45;

/**
 * Rotating moment — one quiet line per time window per day.
 *
 * Shown on cold start when the user hasn't yet seen a moment for
 * today's morning / evening / neutral window. Swipe up to fade
 * into home; bookmark + share sit below the moment copy.
 */
export default function RotatingMomentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const { answers } = useOnboarding();
  const firstName = useMemo(
    () => (answers.name || "").trim().split(" ")[0] || "",
    [answers.name],
  );

  const moment = useMemo(
    () => getRandomMoment(firstName),
    [firstName],
  );
  const { body, reference } = useMemo(
    () => splitMomentText(moment.text),
    [moment.text],
  );
  const category = getTimeCategory();

  const [bookmarked, setBookmarked] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const fade = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const hintPulse = useRef(new Animated.Value(0)).current;
  const gestureStartY = useRef(0);
  const dismissingRef = useRef(false);
  const markedShown = useRef(false);

  useEffect(() => {
    dismissingRef.current = dismissing;
  }, [dismissing]);

  useEffect(() => {
    skipLaunchSplashForSession();
    if (markedShown.current) return;
    markedShown.current = true;
    void markRotatingMomentShown();
  }, []);

  useEffect(() => {
    let cancelled = false;
    void isRotatingMomentSaved(moment.id).then((saved) => {
      if (!cancelled) setBookmarked(saved);
    });
    return () => {
      cancelled = true;
    };
  }, [moment.id]);

  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(hintPulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(hintPulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [hintPulse, reducedMotion]);

  const finishDismiss = useCallback(() => {
    router.replace("/today");
  }, [router]);

  const completeDismiss = useCallback(() => {
    if (dismissingRef.current) return;
    setDismissing(true);
    haptics.soft();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -140,
        duration: reducedMotion ? 0 : 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 0,
        duration: reducedMotion ? 0 : 360,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) finishDismiss();
    });
  }, [fade, finishDismiss, reducedMotion, translateY]);

  const snapBack = useCallback(() => {
    Animated.spring(translateY, {
      toValue: 0,
      tension: 140,
      friction: 16,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gs) =>
        !dismissingRef.current &&
        gs.dy < -8 &&
        Math.abs(gs.dy) > Math.abs(gs.dx),
      onPanResponderGrant: () => {
        // @ts-expect-error Animated.Value exposes _value at runtime.
        gestureStartY.current = translateY._value as number;
      },
      onPanResponderMove: (_, gs) => {
        const next = Math.min(0, gestureStartY.current + gs.dy);
        translateY.setValue(next);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dy < SWIPE_COMMIT_DY || gs.vy < SWIPE_COMMIT_VY) {
          completeDismiss();
        } else {
          snapBack();
        }
      },
    }),
  ).current;

  const handleBookmark = useCallback(async () => {
    haptics.tap();
    if (bookmarked) return;
    await saveRotatingMoment({
      id: moment.id,
      body,
      reference,
      category,
      savedAtISO: new Date().toISOString(),
    });
    setBookmarked(true);
    haptics.success();
  }, [bookmarked, body, category, moment.id, reference]);

  const handleShare = useCallback(async () => {
    haptics.soft();
    const message = reference ? `${body}\n\n— ${reference}` : body;
    await shareRaw({ message });
  }, [body, reference]);

  const hintTranslateY = hintPulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  const dragFade = translateY.interpolate({
    inputRange: [-160, 0],
    outputRange: [0.35, 1],
    extrapolate: "clamp",
  });

  const screenOpacity = reducedMotion ? fade : Animated.multiply(fade, dragFade);

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="light" />

      <Animated.View
        {...panResponder.panHandlers}
        style={{
          flex: 1,
          opacity: screenOpacity,
          transform: [{ translateY }],
        }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 40,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 100,
          }}
        >
          <Text
            style={{
              color: INK,
              fontFamily: "System",
              fontWeight: "400",
              fontSize: 28,
              lineHeight: 40,
              textAlign: "center",
            }}
          >
            {body}
          </Text>

          {reference ? (
            <Text
              style={{
                marginTop: 20,
                color: REFERENCE,
                fontFamily: "System",
                fontWeight: "600",
                fontSize: 13,
                lineHeight: 18,
                letterSpacing: 1.2,
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {reference}
            </Text>
          ) : null}

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginTop: reference ? 28 : 32,
            }}
          >
            <ChromeButton
              label={bookmarked ? "Saved" : "Save moment"}
              onPress={handleBookmark}
              disabled={bookmarked || dismissing}
            >
              <SFSymbol
                name={bookmarked ? "bookmark.fill" : "bookmark"}
                size={18}
                color={INK}
                weight="semibold"
              />
            </ChromeButton>

            <ChromeButton
              label="Share moment"
              onPress={handleShare}
              disabled={dismissing}
            >
              <SFSymbol
                name="square.and.arrow.up"
                size={17}
                color={INK}
                weight="semibold"
              />
            </ChromeButton>
          </View>
        </View>
      </Animated.View>

      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: insets.bottom + 24,
          alignItems: "center",
        }}
      >
        {reducedMotion ? (
          <Pressable
            onPress={completeDismiss}
            disabled={dismissing}
            accessibilityRole="button"
            accessibilityLabel="Enter Closer"
            hitSlop={12}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={[typography.button, { color: INK }]}>Enter</Text>
          </Pressable>
        ) : (
          <Animated.View
            style={{
              alignItems: "center",
              transform: [{ translateY: hintTranslateY }],
            }}
            pointerEvents="none"
          >
            <SFSymbol
              name="chevron.up"
              size={14}
              color={HINT}
              weight="semibold"
            />
            <Text
              style={[
                typography.smallLabel,
                {
                  marginTop: 8,
                  color: HINT,
                  textTransform: "uppercase",
                },
              ]}
            >
              Swipe up to enter
            </Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

function ChromeButton({
  children,
  label,
  onPress,
  disabled,
}: {
  children: ReactNode;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: ICON_DISC,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {children}
      </View>
    </Pressable>
  );
}
