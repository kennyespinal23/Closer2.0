import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import Svg, { Circle } from "react-native-svg";
import { CLOSER_ACCENT, LIGHT_COLORS } from "@/constants/theme";
import * as haptics from "@/lib/haptics";
import { useOnboarding } from "@/state/onboarding";
import { useColors } from "@/state/theme";

/**
 * After preferred daily-devotional time — a "building your
 * journey" beat with a circular progress ring + floating
 * testimonials while we "create" their plan.
 */

const DURATION_MS = 14000;
const RING_SIZE = 118;
const RING_STROKE = 8;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

const TESTIMONIALS = [
  {
    name: "Sarah M.",
    quote: "Closer finally helped me put God before my phone.",
  },
  {
    name: "James T.",
    quote: "Five minutes in the morning changed my whole day.",
  },
  {
    name: "Maria L.",
    quote: "I feel closer to God than I have in years.",
  },
  {
    name: "David K.",
    quote: "The shield keeps me honest — and grateful.",
  },
  {
    name: "Hannah R.",
    quote: "My go-to app every morning before anything else.",
  },
  {
    name: "Michael P.",
    quote: "I didn't realize how much I needed this quiet.",
  },
] as const;

export default function CreatingJourneyScreen() {
  const router = useRouter();
  const colors = useColors();
  const { answers } = useOnboarding();
  const firstName = (answers.name || "").trim().split(/\s+/)[0];

  const progress = useRef(new Animated.Value(0)).current;
  const [percent, setPercent] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastHapticBucket = useRef(-1);

  useEffect(() => {
    haptics.soft();

    const id = progress.addListener(({ value }) => {
      const next = Math.min(100, Math.round(value * 100));
      setPercent(next);

      // Light tick every 10% — success pulse at 100.
      const bucket = Math.floor(next / 10);
      if (bucket !== lastHapticBucket.current && bucket > 0) {
        lastHapticBucket.current = bucket;
        if (bucket >= 10) haptics.success();
        else haptics.tick();
      }
    });

    Animated.timing(progress, {
      toValue: 1,
      duration: DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Slow upward drift of the testimonial stack.
    Animated.timing(scrollY, {
      toValue: -280,
      duration: DURATION_MS,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();

    const advance = setTimeout(() => {
      router.replace("/onboarding/apps");
    }, DURATION_MS + 450);

    return () => {
      progress.removeListener(id);
      clearTimeout(advance);
    };
  }, [progress, scrollY, router]);

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [RING_C, 0],
  });

  const headline = firstName
    ? `Welcome to your\nCloser journey, ${firstName}`
    : "Welcome to your\nCloser journey";

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.top}>
          <View style={styles.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_R}
                stroke="rgba(255, 67, 38, 0.18)"
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <AnimatedCircle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_R}
                stroke={CLOSER_ACCENT}
                strokeWidth={RING_STROKE}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${RING_C} ${RING_C}`}
                strokeDashoffset={strokeDashoffset}
                rotation="-90"
                origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
              />
            </Svg>
            <Text style={[styles.percent, { color: colors.ink }]}>
              {percent} %
            </Text>
          </View>

          <Text style={styles.headline}>{headline}</Text>
          <Text style={[styles.sub, { color: colors.inkSecondary }]}>
            Your personal plan is being created…
          </Text>
        </View>

        <View style={styles.testimonialStage}>
          <Animated.View
            style={{
              transform: [{ translateY: scrollY }],
              paddingHorizontal: 20,
              gap: 12,
            }}
          >
            {[...TESTIMONIALS, ...TESTIMONIALS].map((t, i) => (
              <TestimonialCard key={`${t.name}-${i}`} {...t} />
            ))}
          </Animated.View>
          <View
            pointerEvents="none"
            style={[styles.fadeTop, { backgroundColor: colors.bg }]}
          />
          <View
            pointerEvents="none"
            style={[styles.fadeBottom, { backgroundColor: colors.bg }]}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function TestimonialCard({ name, quote }: { name: string; quote: string }) {
  const { width } = useWindowDimensions();
  return (
    <View style={[styles.card, { maxWidth: Math.min(340, width - 48) }]}>
      <Text style={styles.cardName}>{name}</Text>
      <Text style={styles.cardStars}>★★★★★</Text>
      <Text style={styles.cardQuote}>{quote}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  top: {
    alignItems: "center",
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  percent: {
    position: "absolute",
    fontFamily: "System",
    fontWeight: "700",
    fontSize: 26,
    letterSpacing: -0.5,
  },
  headline: {
    marginTop: 28,
    fontFamily: "System",
    fontWeight: "800",
    fontSize: 28,
    lineHeight: 34,
    letterSpacing: -0.6,
    color: CLOSER_ACCENT,
    textAlign: "center",
  },
  sub: {
    marginTop: 12,
    fontFamily: "System",
    fontWeight: "500",
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
  testimonialStage: {
    flex: 1,
    marginTop: 28,
    overflow: "hidden",
  },
  fadeTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 36,
    opacity: 0.92,
  },
  fadeBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 64,
    opacity: 0.95,
  },
  card: {
    alignSelf: "center",
    width: "100%",
    backgroundColor: LIGHT_COLORS.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(20, 16, 12, 0.06)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: "#1A1510",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardName: {
    fontFamily: "System",
    fontWeight: "500",
    fontSize: 12,
    color: "#8A8A8E",
  },
  cardStars: {
    marginTop: 4,
    fontSize: 13,
    letterSpacing: 1.5,
    color: CLOSER_ACCENT,
  },
  cardQuote: {
    marginTop: 6,
    fontFamily: "System",
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 21,
    color: "#1C1C1E",
  },
});
