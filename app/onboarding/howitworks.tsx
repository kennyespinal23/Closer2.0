import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Button } from "@/components/Button";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { ScriptureStickerNote } from "@/components/ScriptureStickerNote";
import { progressFor } from "@/constants/onboarding";
import { CLOSER_ACCENT, LIGHT_COLORS } from "@/constants/theme";
import { SOCIAL_APP_ICON_SOURCES } from "@/lib/socialAppIconAssets";

/**
 * How Closer works — Brainrot layout proportions:
 *   floating phone (soft bottom fade) in the upper half
 *   large air gap
 *   bold headline in the lower third
 *   gray body
 *   Continue pinned to the bottom
 */

type Step = {
  title: string;
  body: string;
};

const STEPS: ReadonlyArray<Step> = [
  {
    title: "We block your apps",
    body: "When you wake up, Instagram, TikTok, and the rest stay locked — until you've met with God first.",
  },
  {
    title: "You read your daily\ndevotional",
    body: "Five minutes. One verse. One thought. Before anything else gets to you.",
  },
  {
    title: "Apps are unlocked",
    body: "Once you've sat with the Word, the shield comes down for the day.",
  },
];

const ROW1 = [
  SOCIAL_APP_ICON_SOURCES.tiktok,
  SOCIAL_APP_ICON_SOURCES.youtube,
  SOCIAL_APP_ICON_SOURCES.instagram,
  SOCIAL_APP_ICON_SOURCES.x,
] as const;

const ROW2 = [
  SOCIAL_APP_ICON_SOURCES.snapchat,
  SOCIAL_APP_ICON_SOURCES.facebook,
  SOCIAL_APP_ICON_SOURCES.discord,
  SOCIAL_APP_ICON_SOURCES.reddit,
] as const;

/** Match app light-mode page cream (`LIGHT_COLORS.bg`). */
const PAGE_BG = LIGHT_COLORS.bg;
const INK = "#0F0F0F";
const INK_SECONDARY = "#8A8A8E";
const PHONE_BORDER = "#111111";

export default function HowItWorksScreen() {
  const router = useRouter();
  const { height: winH } = useWindowDimensions();
  const [step, setStep] = useState(0);
  const fade = useRef(new Animated.Value(1)).current;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  // Phone ~56% of screen — Brainrot scale, with room for copy below.
  const phoneH = Math.min(500, Math.max(420, Math.round(winH * 0.56)));
  const phoneW = Math.round(phoneH * 0.72);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [step, fade]);

  const goNext = () => {
    if (isLast) {
      router.push("/onboarding/personalize");
      return;
    }
    setStep((s) => s + 1);
  };

  const goBack = () => {
    if (step > 0) {
      setStep((s) => s - 1);
      return;
    }
    router.back();
  };

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: PAGE_BG }]} edges={["top", "bottom"]}>
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("howitworks")}
        onBack={goBack}
      />

      {/* Phone — fixed height, not flex-crushed into the copy */}
      <View style={styles.upper}>
        <Animated.View style={{ opacity: fade }}>
          {step === 0 ? (
            <JailPhone width={phoneW} height={phoneH} />
          ) : null}
          {step === 1 ? (
            <ContentPhone width={phoneW} height={phoneH}>
              <DevotionalInside />
            </ContentPhone>
          ) : null}
          {step === 2 ? (
            <ContentPhone width={phoneW} height={phoneH}>
              <UnlockInside />
            </ContentPhone>
          ) : null}
        </Animated.View>
      </View>

      {/* Copy — always below the phone with a hard gap */}
      <Animated.View style={[styles.lower, { opacity: fade }]}>
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.body}>{current.body}</Text>
      </Animated.View>

      <View style={styles.spacer} />

      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={{
              width: i === step ? 18 : 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: i === step ? CLOSER_ACCENT : "#D1D1D6",
            }}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <Button label="Continue" onPress={goNext} />
      </View>
    </SafeAreaView>
  );
}

// ─── Phone shell with soft bottom dissolve ───────────────────────

function PhoneShell({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  // Soft dissolve at the bottom edge — a touch stronger than before.
  const fadeH = Math.round(height * 0.16);

  return (
    <View style={{ width, height, alignItems: "center" }}>
      <View
        style={{
          width,
          height,
          borderRadius: 36,
          borderWidth: 2.5,
          borderColor: PHONE_BORDER,
          backgroundColor: PAGE_BG,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
      <Svg
        pointerEvents="none"
        width={width}
        height={fadeH}
        style={{ position: "absolute", left: 0, bottom: 0 }}
      >
        <Defs>
          <LinearGradient id="phoneDissolve" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={PAGE_BG} stopOpacity="0" />
            <Stop offset="40%" stopColor={PAGE_BG} stopOpacity="0.25" />
            <Stop offset="75%" stopColor={PAGE_BG} stopOpacity="0.7" />
            <Stop offset="100%" stopColor={PAGE_BG} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={fadeH} fill="url(#phoneDissolve)" />
      </Svg>
    </View>
  );
}

/** Slow side-to-side drift — alternating directions per row. */
function MarqueeRow({
  apps,
  icon,
  gap,
  direction,
  travel,
}: {
  apps: ReadonlyArray<(typeof ROW1)[number]>;
  icon: number;
  gap: number;
  direction: "left" | "right";
  travel: number;
}) {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const end = direction === "left" ? -travel : travel;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(x, {
          toValue: end,
          duration: 7200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(x, {
          toValue: direction === "left" ? travel : -travel,
          duration: 7200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [direction, travel, x]);

  // Duplicate strip so edges stay filled while drifting.
  const strip = [...apps, ...apps];

  return (
    <Animated.View
      style={{
        flexDirection: "row",
        gap,
        transform: [{ translateX: x }],
      }}
    >
      {strip.map((src, i) => (
        <Image
          key={i}
          source={src}
          style={{ width: icon, height: icon, borderRadius: icon * 0.22 }}
        />
      ))}
    </Animated.View>
  );
}

function JailPhone({ width, height }: { width: number; height: number }) {
  const icon = Math.round(width * 0.26);
  const gap = Math.round(width * 0.055);
  const padTop = Math.round(height * 0.2);
  const rowGap = Math.round(icon * 0.36);
  const travel = Math.round(icon * 0.9);

  return (
    <PhoneShell width={width} height={height}>
      <View
        style={{
          paddingTop: padTop,
          gap: rowGap,
          // Let rows spill past the frame so the marquee can clip.
          overflow: "visible",
        }}
      >
        <View style={{ marginLeft: -Math.round(icon * 0.55) }}>
          <MarqueeRow
            apps={ROW1}
            icon={icon}
            gap={gap}
            direction="left"
            travel={travel}
          />
        </View>
        <View style={{ marginLeft: -Math.round(icon * 0.15) }}>
          <MarqueeRow
            apps={ROW2}
            icon={icon}
            gap={gap}
            direction="right"
            travel={travel}
          />
        </View>
      </View>
    </PhoneShell>
  );
}

function ContentPhone({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <PhoneShell width={width} height={height}>
      {children}
    </PhoneShell>
  );
}

function DevotionalInside() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 14,
        // Soft warm wash behind the sticker — reads like the home photo moment.
        backgroundColor: "#E8DFD2",
      }}
    >
      <ScriptureStickerNote
        quote={"Be still, and know that I am God."}
        reference="Psalm 46:10"
        maxWidth={220}
        rotationDeg={-1.15}
      />
    </View>
  );
}

function UnlockInside() {
  const sheetY = useRef(new Animated.Value(36)).current;
  const sheetOpacity = useRef(new Animated.Value(0)).current;
  const icon0 = useRef(new Animated.Value(0)).current;
  const icon1 = useRef(new Animated.Value(0)).current;
  const icon2 = useRef(new Animated.Value(0)).current;
  const copyOpacity = useRef(new Animated.Value(0)).current;
  const btnScale = useRef(new Animated.Value(0.86)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const springPop = (v: Animated.Value, delay: number) =>
      Animated.sequence([
        Animated.delay(delay),
        Animated.spring(v, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
      ]);

    Animated.parallel([
      Animated.timing(sheetOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(sheetY, {
        toValue: 0,
        friction: 9,
        tension: 70,
        useNativeDriver: true,
      }),
      springPop(icon0, 180),
      springPop(icon1, 280),
      springPop(icon2, 380),
      Animated.sequence([
        Animated.delay(420),
        Animated.timing(copyOpacity, {
          toValue: 1,
          duration: 320,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.delay(520),
        Animated.parallel([
          Animated.spring(btnScale, {
            toValue: 1,
            friction: 7,
            tension: 90,
            useNativeDriver: true,
          }),
          Animated.timing(btnOpacity, {
            toValue: 1,
            duration: 240,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  }, [
    sheetY,
    sheetOpacity,
    icon0,
    icon1,
    icon2,
    copyOpacity,
    btnScale,
    btnOpacity,
  ]);

  const iconStyle = (v: Animated.Value) => ({
    opacity: v,
    transform: [
      {
        scale: v.interpolate({
          inputRange: [0, 1],
          outputRange: [0.35, 1],
        }),
      },
      {
        translateY: v.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  });

  return (
    <View style={{ flex: 1 }}>
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <DevotionalInside />
      </View>
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFillObject,
          { backgroundColor: "rgba(20, 16, 12, 0.28)" },
        ]}
      />

      <Animated.View
        style={[
          styles.unlockSheetWrap,
          {
            opacity: sheetOpacity,
            transform: [{ translateY: sheetY }],
          },
        ]}
      >
        <View style={styles.unlockSheet}>
          <View style={styles.unlockGrabber} />
          <View style={styles.unlockIconRow}>
            <Animated.View
              style={[iconStyle(icon0), { zIndex: 1, marginRight: -8 }]}
            >
              <Image
                source={SOCIAL_APP_ICON_SOURCES.tiktok}
                style={styles.unlockIcon}
              />
            </Animated.View>
            <Animated.View
              style={[iconStyle(icon1), { zIndex: 2, marginRight: -8 }]}
            >
              <Image
                source={SOCIAL_APP_ICON_SOURCES.instagram}
                style={styles.unlockIcon}
              />
            </Animated.View>
            <Animated.View style={[iconStyle(icon2), { zIndex: 3 }]}>
              <View style={styles.unlockPlus}>
                <Text style={styles.unlockPlusText}>+3</Text>
              </View>
            </Animated.View>
          </View>
          <Animated.View style={{ opacity: copyOpacity, alignItems: "center" }}>
            <Text style={styles.unlockTitle}>Apps unlocked for today</Text>
            <Text style={styles.unlockBody}>
              You met with God first. The shield is down.
            </Text>
          </Animated.View>
          <Animated.View
            style={{
              alignSelf: "stretch",
              opacity: btnOpacity,
              transform: [{ scale: btnScale }],
            }}
          >
            <View style={styles.unlockBtn}>
              <Text style={styles.unlockBtnLabel}>Continue</Text>
            </View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // Phone sized by itself — no flex squeeze into the copy below.
  upper: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 8,
  },
  // Hard gap under the phone so headline never overlaps the graphic.
  lower: {
    marginTop: 40,
    paddingHorizontal: 36,
    paddingTop: 0,
    paddingBottom: 4,
    alignItems: "center",
  },
  title: {
    fontFamily: "System",
    fontWeight: "800",
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.9,
    color: INK,
    textAlign: "center",
  },
  body: {
    marginTop: 12,
    fontFamily: "System",
    fontWeight: "400",
    fontSize: 16,
    lineHeight: 23,
    color: INK_SECONDARY,
    textAlign: "center",
    maxWidth: 300,
  },
  spacer: {
    flex: 1,
    minHeight: 8,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    paddingBottom: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 10,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "center",
  },
  unlockSheetWrap: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 12,
    paddingBottom: 18,
  },
  unlockSheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  unlockGrabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D1D6",
    marginBottom: 14,
  },
  unlockIconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  unlockIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  unlockPlus: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F2F2F7",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  unlockPlusText: {
    fontFamily: "System",
    fontWeight: "700",
    fontSize: 14,
    color: INK,
  },
  unlockTitle: {
    fontFamily: "System",
    fontWeight: "700",
    fontSize: 17,
    letterSpacing: -0.3,
    color: INK,
    textAlign: "center",
  },
  unlockBody: {
    marginTop: 6,
    fontFamily: "System",
    fontWeight: "400",
    fontSize: 13,
    lineHeight: 18,
    color: INK_SECONDARY,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  unlockBtn: {
    marginTop: 16,
    height: 46,
    alignSelf: "stretch",
    borderRadius: 999,
    backgroundColor: "#5AC8FA",
    alignItems: "center",
    justifyContent: "center",
  },
  unlockBtnLabel: {
    color: "#FFFFFF",
    fontFamily: "System",
    fontWeight: "700",
    fontSize: 15,
  },
});
