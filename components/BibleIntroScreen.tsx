import Animated, { cancelAnimation, Easing, Extrapolation, interpolate, runOnJS, useAnimatedReaction, type SharedValue, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from "react-native-reanimated";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";
import { SFSymbol } from "@/components/Symbol";
import { StatusBar } from "expo-status-bar";
import { getBookCover } from "@/constants/bookCovers";
import { useReducedMotion } from "@/lib/useReducedMotion";
import * as haptics from "@/lib/haptics";

const WELCOME_DURATION = 8500;
const BOOK_ENTRANCE_DELAY = 1500;
const INTRO_BOOKS = ["genesis", "exodus", "job"] as const;

function IntroCover({ id, index, active, width, reducedMotion, progress }: { id: string; index: number; active: number; width: number; reducedMotion: boolean; progress: SharedValue<number> }) {
  const x = useSharedValue(0);
  const size = useSharedValue(0.82);
  const angle = useSharedValue(0);
  const role = (index - active + 3) % 3;
  useEffect(() => {
    const side = role === 0 ? 0 : role === 1 ? 1 : -1;
    const config = { duration: reducedMotion ? 0 : 1100, easing: Easing.inOut(Easing.cubic) };
    x.value = withTiming(side * width * 0.48, config);
    angle.value = withTiming(side * 9, config);
    size.value = withTiming(role === 0 ? 1 : 0.82, config);
  }, [role, width, reducedMotion, x, angle, size]);
  const style = useAnimatedStyle(() => {
    // Each cover is revealed by the same value that fills the button.
    const start = [0.06, 0.38, 0.70][index];
    const entrance = reducedMotion ? 1 : interpolate(progress.value, [start, start + 0.14], [0, 1], Extrapolation.CLAMP);
    return {
      opacity: entrance,
      transform: [{ translateX: x.value }, { translateY: (1 - entrance) * 44 }, { rotate: `${angle.value}deg` }, { scale: size.value * (0.90 + entrance * 0.10) }],
    };
  });
  return <Animated.View style={[{ position: "absolute", zIndex: role === 0 ? 3 : 1, width, height: width * 1.6, borderRadius: 28, borderCurve: "continuous", overflow: "hidden", backgroundColor: "#141414", borderWidth: 1, borderColor: "#343434" }, style]}>
    <Image source={getBookCover(id)!} contentFit="cover" style={{ width: "100%", height: "100%" }} />
  </Animated.View>;
}

/** First-visit introduction; persistence is owned by the Bible tab. */
export function BibleIntroScreen({ onComplete }: { onComplete: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height, fontScale } = useWindowDimensions();
  const focused = useIsFocused();
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const [ready, setReady] = useState(reducedMotion);
  const [activeBook, setActiveBook] = useState(0);
  const preparation = useSharedValue(0);
  const confirmation = useSharedValue(reducedMotion ? 1 : 0);
  const confirmationStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, confirmation.value),
    transform: [{ scale: 0.9 + confirmation.value * 0.1 }, { translateY: (1 - confirmation.value) * 10 }],
  }));
  useAnimatedReaction(
    () => preparation.value >= 0.70 ? 2 : preparation.value >= 0.38 ? 1 : 0,
    (next, previous) => { if (next !== previous) runOnJS(setActiveBook)(next); },
  );
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
    setActiveBook(0);
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
  const cardWidth = Math.min(width * 0.48, 230);
  const cardHeight = cardWidth * 1.6;
  const finish = () => { haptics.soft(); onComplete(); };
  return <Modal visible={focused} animationType={reducedMotion ? "none" : "fade"} onRequestClose={finish} presentationStyle="fullScreen">
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ minHeight: height, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20, paddingHorizontal: 24 }}>
        <View style={{ alignItems: "flex-end" }}>
          <Pressable accessibilityRole="button" onPress={finish} style={{ minHeight: 44, minWidth: 44, justifyContent: "center", alignItems: "center" }}>
            <Text allowFontScaling={false} style={{ fontSize: 16 * fontScale, color: "white", lineHeight: 23 * fontScale }}>Skip</Text>
          </Pressable>
        </View>
        <View style={{ alignItems: "center", marginTop: 28, maxWidth: 480, alignSelf: "center" }}>
          <Animated.View style={headingStyle}>
          <Text accessibilityRole="header" allowFontScaling={false} style={{ color: "white", fontSize: 28 * fontScale, lineHeight: 35 * fontScale, fontWeight: "700", textAlign: "center" }}>Thank you for choosing Closer.</Text>
          </Animated.View>
          <Animated.View style={subtitleStyle}>
          <Text allowFontScaling={false} style={{ color: "#B7BDC7", fontSize: 16 * fontScale, lineHeight: 24 * fontScale, textAlign: "center", marginTop: 12 }}>The Bible is yours to read, for free. All 66 books, ready for you to explore—one chapter at a time.</Text>
          </Animated.View>
        </View>
        <View accessible={false} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ flex: 1, minHeight: cardHeight + 80, alignItems: "center", justifyContent: "center", marginVertical: 20 }}>
          <View style={{ width: cardWidth, height: cardHeight, alignItems: "center", justifyContent: "center" }}>
            {INTRO_BOOKS.map((id, index) => <IntroCover key={id} id={id} index={index} active={activeBook} width={cardWidth} reducedMotion={reducedMotion} progress={preparation} />)}
          </View>
        </View>
        <Animated.View pointerEvents="none" accessibilityElementsHidden={!ready} importantForAccessibility={ready ? "auto" : "no-hide-descendants"} style={[{ minHeight: 52, marginBottom: 12, flexDirection: "row", gap: 10, alignItems: "center", justifyContent: "center" }, confirmationStyle]}>
          <SFSymbol name="checkmark.circle.fill" size={25} color="#FFFFFF" />
          <Text accessibilityLiveRegion="polite" allowFontScaling={false} style={{ color: "white", flexShrink: 1, textAlign: "center", fontWeight: "600", fontSize: 17 * fontScale, lineHeight: 24 * fontScale }}>{ready ? "Your library is ready" : ""}</Text>
        </Animated.View>
        <Pressable disabled={!ready} onPress={finish} onPressIn={() => setPressed(true)} onPressOut={() => setPressed(false)} accessibilityRole="button" accessibilityLabel={ready ? "Get started with the Bible" : "Preparing your library"} accessibilityState={{ disabled: !ready, busy: !ready }} style={{ width: "100%", maxWidth: 480, alignSelf: "center", minHeight: 56, padding: 16, borderRadius: 999, overflow: "hidden", backgroundColor: ready ? "#FFFFFF" : "#A9ADB4", opacity: pressed ? 0.8 : 1, alignItems: "center", justifyContent: "center" }}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { right: undefined, backgroundColor: "#FFFFFF" }, fillStyle]} />
          <Text accessibilityLiveRegion="polite" allowFontScaling={false} style={{ color: "#000000", fontWeight: "600", fontSize: 17 * fontScale, lineHeight: 24 * fontScale }}>{ready ? "Get started" : "Preparing your library…"}</Text>
        </Pressable>
      </ScrollView>
    </View>
  </Modal>;
}
