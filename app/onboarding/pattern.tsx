import { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { HeroDisc, HeroOnboardingPage } from "@/components/HeroOnboardingPage";
import { AppIcon } from "@/components/SocialAppCard";
import { useColors } from "@/state/theme";

/**
 * Screen — The Pattern.
 *
 * Spiritual diagnosis of what the user just admitted on the
 * three audit screens (apps / scrolltime / waketime). Sits
 * between waketime (the last data point) and calculating (the
 * fake-loader that sets up the personalized punch).
 *
 * Built on the shared <HeroOnboardingPage> shell with the
 * VIOLET palette — different room from the stat reveal (cobalt)
 * but same vocabulary. Violet carries historical religious
 * weight (advent, lent, penitence) so it reads as reverent
 * for the diagnostic beat.
 *
 * Subject: two stacked app icons (morning + night) inside the
 * disc, with timestamps. The icons breathe in opposite phases
 * so the pair forms a closed daily loop instead of two static
 * logos.
 */

export default function PatternScreen() {
  const router = useRouter();
  const colors = useColors();

  // Local breath value drives the morning/night opposite-phase
  // animation inside the disc. The disc itself doesn't breathe
  // (we pass breathe={false} to HeroDisc) — the breath here
  // belongs to the icons, not the frame, so we don't double up
  // the motion.
  const breath = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  return (
    <HeroOnboardingPage
      subject={
        <HeroDisc
          size={216}
          breathe={false}
          innerPaddingVertical={24}
        >
          <PatternIcon app="instagram" time="6:47 AM" breath={breath} phase="in" />
          <View
            style={{
              width: 64,
              height: 1,
              backgroundColor: colors.border,
              marginVertical: 12,
            }}
          />
          <PatternIcon app="tiktok" time="11:42 PM" breath={breath} phase="out" />
        </HeroDisc>
      }
      quoteSetup="Phone first. Phone last."
      quoteEmphasis="God somewhere in the middle. If at all."
      attribution="We're going to change the order."
      ctaLabel="Continue"
      onContinue={() => router.push("/onboarding/calculating")}
    />
  );
}

const ICON_SIZE = 56;

function PatternIcon({
  app,
  time,
  breath,
  phase,
}: {
  app: "instagram" | "tiktok";
  time: string;
  breath: Animated.Value;
  phase: "in" | "out";
}) {
  const colors = useColors();
  const scale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: phase === "in" ? [0.97, 1.03] : [1.03, 0.97],
  });
  const opacity = breath.interpolate({
    inputRange: [0, 1],
    outputRange: phase === "in" ? [0.88, 1] : [1, 0.88],
  });
  return (
    <View style={{ alignItems: "center" }}>
      <Animated.View
        style={{
          width: ICON_SIZE,
          height: ICON_SIZE,
          alignItems: "center",
          justifyContent: "center",
          opacity,
          transform: [{ scale }],
        }}
      >
        <AppIcon kind={app} size={ICON_SIZE} />
      </Animated.View>
      <Text
        style={{
          color: colors.inkSecondary,
          fontFamily: "System",
          fontWeight: "600",
          fontSize: 11,
          letterSpacing: 1.4,
          marginTop: 6,
          textTransform: "uppercase",
        }}
      >
        {time}
      </Text>
    </View>
  );
}
