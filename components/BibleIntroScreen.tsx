import Animated, { cancelAnimation, Easing, Extrapolation, interpolate, runOnJS, type SharedValue, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { SFSymbol } from "@/components/Symbol";
import { StatusBar } from "expo-status-bar";
import { getBookCover } from "@/constants/bookCovers";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useColors, useResolvedScheme } from "@/state/theme";
import { NEW_YORK, systemText } from "@/lib/typography";
import * as haptics from "@/lib/haptics";

const WELCOME_DURATION = 12000;
const BOOK_ENTRANCE_DELAY = 250;
const INTRO_BOOKS = ["genesis", "exodus", "psalms", "proverbs", "isaiah", "john", "revelation"] as const;

function IntroCover({ id, index, width, reducedMotion, progress }: { id: string; index: number; width: number; reducedMotion: boolean; progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => {
    // One continuous rail: no recycled cover crossing over its neighbors.
    const travel = reducedMotion ? 0 : interpolate(progress.value, [0.05, 1], [0, INTRO_BOOKS.length - 3], Extrapolation.CLAMP);
    const start = index < 3 ? index * 0.018 : (index - 2) * 0.15;
    const entrance = reducedMotion ? 1 : interpolate(progress.value, [start, start + 0.055], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: entrance,
      transform: [{ translateX: (index - 1 - travel) * (width + 20) }, { translateY: (1 - entrance) * 12 }],
    };
  });
  return <Animated.View style={[{ position: "absolute", width, height: width * 1.6, borderRadius: 8, borderCurve: "continuous", overflow: "hidden", backgroundColor: "#141414", borderWidth: 1, borderColor: "#343434" }, style]}>
    <Image source={getBookCover(id)!} contentFit="cover" style={{ width: "100%", height: "100%" }} />
  </Animated.View>;
}

/** First-visit introduction; persistence is owned by the Bible tab. */
export function BibleIntroScreen({ onComplete }: { onComplete: () => void }) {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const scheme = useResolvedScheme();
  const { width, height, fontScale } = useWindowDimensions();
  const focused = useIsFocused();
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const [ready, setReady] = useState(reducedMotion);
  const preparation = useSharedValue(0);
  const confirmation = useSharedValue(reducedMotion ? 1 : 0);
  const confirmationStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, confirmation.value),
    transform: [{ scale: 0.9 + confirmation.value * 0.1 }, { translateY: (1 - confirmation.value) * 10 }],
  }));
  useEffect(() => {
    confirmation.value = ready ? (reducedMotion ? 1 : withSpring(1, { duration: 650, dampingRatio: 0.72 })) : 0;
    return () => cancelAnimation(confirmation);
  }, [ready, reducedMotion, confirmation]);
  const heading = useSharedValue(reducedMotion ? 1 : 0);
  const subtitle = useSharedValue(reducedMotion ? 1 : 0);
  const headingStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, heading.value * 1.5),
    transform: [{ translateY: (1 - heading.value) * 14 }, { scale: 0.88 + heading.value * 0.12 }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitle.value }));
  const fillStyle = useAnimatedStyle(() => ({ width: `${preparation.value * 100}%` }));
  useEffect(() => {
    if (!focused) return;
    // A short welcome sequence, not a network-download percentage.
    setReady(reducedMotion);
    preparation.value = reducedMotion ? 1 : 0;
    heading.value = reducedMotion ? 1 : 0;
    subtitle.value = reducedMotion ? 1 : 0;
    if (reducedMotion) return;
    heading.value = withDelay(150, withSpring(1, { duration: 750, dampingRatio: 0.68 }));
    subtitle.value = withDelay(750, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }));
    preparation.value = withDelay(BOOK_ENTRANCE_DELAY, withTiming(1, {
      duration: WELCOME_DURATION - BOOK_ENTRANCE_DELAY, easing: Easing.linear,
    }, finished => { if (finished) runOnJS(setReady)(true); }));
    return () => { cancelAnimation(preparation); cancelAnimation(heading); cancelAnimation(subtitle); };

  }, [focused, reducedMotion, preparation, heading, subtitle]);
  const cardWidth = Math.min(width * 0.48, 210);
  const cardHeight = cardWidth * 1.6;
  const finish = () => { haptics.soft(); onComplete(); };
  return <Modal visible={focused} animationType={reducedMotion ? "none" : "fade"} onRequestClose={finish} presentationStyle="fullScreen">
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, minHeight: height, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }}>
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ height: cardHeight + 32, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
          <View style={{ width: cardWidth, height: cardHeight, alignItems: "center", justifyContent: "center" }}>
            {INTRO_BOOKS.map((id, index) => <IntroCover key={id} id={id} index={index} width={cardWidth} reducedMotion={reducedMotion} progress={preparation} />)}
          </View>
        </View>
        <View style={{ alignItems: "center", marginTop: 32, paddingHorizontal: 32, maxWidth: 480, alignSelf: "center" }}>
          <Animated.View style={headingStyle}>
            <Text accessibilityRole="header" style={{ fontFamily: NEW_YORK, color: colors.ink, fontSize: 30, lineHeight: 34, textAlign: "center" }}>The Bible is yours.{"\n"}Discover its story.</Text>
          </Animated.View>
          <Animated.View style={subtitleStyle}>
            <Text style={[systemText.subheadline, { color: colors.inkMuted, textAlign: "center", marginTop: 16 }]}>Thank you for choosing Closer. Explore all 66 books, freely—one chapter at a time.</Text>
          </Animated.View>
        </View>
        <View style={{ flex: 1, minHeight: 16 }} />
        <Animated.View pointerEvents="none" accessibilityElementsHidden={!ready} importantForAccessibility={ready ? "auto" : "no-hide-descendants"} style={[{ minHeight: 52, marginBottom: 12, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" }, confirmationStyle]}>
          <SFSymbol name="checkmark.circle.fill" size={25} color={colors.ink} />
          <Text accessibilityLiveRegion="polite" allowFontScaling={false} style={{ color: colors.ink, flexShrink: 1, textAlign: "center", fontWeight: "600", fontSize: 17 * fontScale, lineHeight: 24 * fontScale }}>{ready ? "Your library is ready" : ""}</Text>
        </Animated.View>
        <Pressable disabled={!ready} onPress={finish} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} accessibilityRole="button" accessibilityLabel={ready ? "Get started with the Bible" : "Preparing your library"} accessibilityState={{ disabled: !ready, busy: !ready }} style={{ width: "90%", maxWidth: 480, alignSelf: "center", minHeight: 56, padding: 16, borderRadius: 999, overflow: "hidden", backgroundColor: ready ? colors.ink : colors.surfaceSecondary, opacity: pressed ? 0.8 : 1, alignItems: "center", justifyContent: "center" }}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { right: undefined, backgroundColor: colors.ink, opacity: ready ? 1 : 0.12 }, fillStyle]} />
          <Text accessibilityLiveRegion="polite" allowFontScaling={false} style={{ color: ready ? colors.bg : colors.ink, fontWeight: "600", fontSize: 17 * fontScale, lineHeight: 24 * fontScale }}>{ready ? "Get started" : "Preparing your library…"}</Text>
        </Pressable>
      </ScrollView>
    </View>
  </Modal>;
}
