import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useLocalSearchParams, useRouter } from "expo-router";
import { PrimaryPillButton } from "@/components/PrimaryPillButton";
import { SFSymbol } from "@/components/Symbol";
import * as haptics from "@/lib/haptics";
import { isMediaLibraryAvailable } from "@/lib/mediaLibraryAvailable";
import { isPhotoSaveAvailable } from "@/lib/photoSaveAvailable";
import { shareVerse } from "@/lib/share";
import { splitScripture } from "@/lib/moments";
import { getSermonBackdrop } from "@/services/unsplashService";
import { useMoments } from "@/state/moments";
import { HERO_DIM_OVERLAY, HERO_GLASS_DISC } from "@/constants/heroChrome";
import { NEW_YORK } from "@/lib/typography";

export default function SermonScriptureScreen() {
  const router = useRouter();
  const { continuity } = useLocalSearchParams<{ continuity?: string }>();
  const isContinuity = continuity === "1";
  const insets = useSafeAreaInsets();
  const { todaysMoment } = useMoments();
  const scripture = useMemo(
    () => splitScripture(todaysMoment.scripture),
    [todaysMoment.scripture],
  );
  const shotRef = useRef<View>(null);
  const [saving, setSaving] = useState(false);
  const canSavePhoto =
    isPhotoSaveAvailable() && isMediaLibraryAvailable();

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const query =
      todaysMoment.illustrationPrompt?.trim() ||
      todaysMoment.imageQuery?.trim();
    if (!query) return;
    getSermonBackdrop(query, todaysMoment.day).then((url) => {
      if (!cancelled) setImageUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [
    todaysMoment.illustrationPrompt,
    todaysMoment.imageQuery,
    todaysMoment.day,
  ]);

  const backdropFade = useRef(
    new Animated.Value(isContinuity ? 1 : 0),
  ).current;
  const verseAnim = useRef(new Animated.Value(0)).current;
  const continueAnim = useRef(new Animated.Value(0)).current;
  const chromeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const verseDelay = isContinuity ? 900 : 1100;
    const verseDuration = 4200;
    const continueDelay = isContinuity ? 6800 : 5800;

    Animated.timing(verseAnim, {
      toValue: 1,
      duration: verseDuration,
      delay: verseDelay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(chromeAnim, {
      toValue: 1,
      duration: isContinuity ? 1800 : 1400,
      delay: isContinuity ? verseDelay + 200 : 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(continueAnim, {
      toValue: 1,
      duration: isContinuity ? 1800 : 1400,
      delay: continueDelay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [verseAnim, continueAnim, chromeAnim, isContinuity]);

  const verseTranslateY = verseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  const continueTranslateY = continueAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  const handleContinue = () => {
    haptics.tap();
    router.push("/sermon/panel/1");
  };

  const handleShare = async () => {
    haptics.soft();
    if (!scripture.text) return;
    await shareVerse({
      text: scripture.text,
      reference: scripture.reference,
    });
  };

  const handleSavePhoto = async () => {
    if (saving) return;
    haptics.soft();
    setSaving(true);
    const { captureViewToPhotos } = await import("@/lib/saveToPhotos");
    const saved = await captureViewToPhotos(shotRef);
    setSaving(false);
    if (saved) {
      haptics.success();
      Alert.alert("Saved", "Scripture image saved to your Photos library.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0A0A" }}>
      <View ref={shotRef} style={{ flex: 1 }}>
        {imageUrl ? (
          <Animated.Image
            source={{ uri: imageUrl }}
            onLoad={() => {
              if (isContinuity) {
                backdropFade.setValue(1);
                return;
              }
              Animated.timing(backdropFade, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }).start();
            }}
            style={[StyleSheet.absoluteFill, { opacity: backdropFade }]}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
          />
        ) : null}

        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: HERO_DIM_OVERLAY },
          ]}
        />

        <View
          style={{
            flex: 1,
            justifyContent: "center",
            paddingHorizontal: 32,
            paddingTop: insets.top + 72,
            paddingBottom: insets.bottom + 120,
          }}
        >
          {scripture.text ? (
            <Animated.Text
              style={{
                opacity: verseAnim,
                transform: [{ translateY: verseTranslateY }],
                color: "#FFFFFF",
                fontFamily: NEW_YORK,
                fontStyle: "italic",
                fontWeight: "400",
                fontSize: 26,
                lineHeight: 40,
                textAlign: "center",
                textShadowColor: "rgba(0, 0, 0, 0.75)",
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 14,
              }}
            >
              {scripture.text}
            </Animated.Text>
          ) : null}

          <Animated.View
            style={{
              opacity: verseAnim,
              transform: [{ translateY: verseTranslateY }],
              alignItems: "center",
              marginTop: 32,
            }}
          >
            <View
              style={{
                width: 32,
                height: 1,
                backgroundColor: "rgba(255, 255, 255, 0.45)",
                marginBottom: 14,
                borderRadius: 1,
              }}
            />
            <Text
              style={{
                color: "rgba(255, 255, 255, 0.7)",
                fontFamily: "System",
                fontWeight: "700",
                fontSize: 12,
                letterSpacing: 2.5,
                textTransform: "uppercase",
                textAlign: "center",
              }}
            >
              {scripture.reference}
            </Text>
          </Animated.View>
        </View>
      </View>

      <Animated.View
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 16,
          opacity: chromeAnim,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel="Close scripture"
          style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
        >
          <View style={HERO_GLASS_DISC}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path
                d="M6 6l12 12M6 18L18 6"
                stroke="#FFFFFF"
                strokeWidth={2.2}
                strokeLinecap="round"
              />
            </Svg>
          </View>
        </Pressable>
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          top: insets.top + 8,
          right: 16,
          flexDirection: "row",
          gap: 8,
          opacity: chromeAnim,
        }}
      >
        {canSavePhoto ? (
          <Pressable
            onPress={handleSavePhoto}
            hitSlop={14}
            accessibilityRole="button"
            accessibilityLabel="Save scripture image to Photos"
            disabled={saving}
          >
            {({ pressed }) => (
              <View
                style={{
                  ...HERO_GLASS_DISC,
                  opacity: saving ? 0.5 : pressed ? 0.7 : 1,
                }}
              >
                <SFSymbol
                  name="square.and.arrow.down"
                  size={16}
                  color="#FFFFFF"
                  weight="semibold"
                />
              </View>
            )}
          </Pressable>
        ) : null}

        <Pressable
          onPress={handleShare}
          hitSlop={14}
          accessibilityRole="button"
          accessibilityLabel="Share scripture"
        >
          {({ pressed }) => (
            <View
              style={{
                ...HERO_GLASS_DISC,
                opacity: pressed ? 0.7 : 1,
              }}
            >
              <SFSymbol
                name="square.and.arrow.up"
                size={16}
                color="#FFFFFF"
                weight="semibold"
              />
            </View>
          )}
        </Pressable>
      </Animated.View>

      <Animated.View
        style={{
          position: "absolute",
          bottom: insets.bottom + 16,
          left: 16,
          right: 16,
          opacity: continueAnim,
          transform: [{ translateY: continueTranslateY }],
        }}
      >
        <PrimaryPillButton
          label="Continue"
          onPress={handleContinue}
          showArrow
          accessibilityLabel="Continue to sermon"
        />
      </Animated.View>
    </View>
  );
}
