import { useEffect, useMemo } from "react";
import {
  Linking,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Redirect, useRouter } from "expo-router";
import { requireOptionalNativeModule } from "expo-modules-core";
import { useVideoPlayer, VideoView } from "expo-video";
import { PrimaryPillButton } from "@/components/PrimaryPillButton";
import { FadeIn } from "@/components/FadeIn";
import * as haptics from "@/lib/haptics";
import { armLaunchSplash } from "@/lib/launchSplashSession";
import { useOnboarding } from "@/state/onboarding";

const SIGN_IN_VIDEO = require("@/assets/videos/signinpage.mp4");
const TERMS_URL = "https://closer.app/terms";
const PRIVACY_URL = "https://closer.app/privacy";

/** True only after a native rebuild that linked expo-video. */
function hasNativeExpoVideo(): boolean {
  return requireOptionalNativeModule("ExpoVideo") != null;
}

/**
 * Root launch gate.
 *
 * Returning users (`completed === true`) never see the Get Started
 * landing — they route straight home. New users see the video
 * Get Started landing below.
 */
export default function IndexScreen() {
  const { answers } = useOnboarding();

  useEffect(() => {
    if (answers.completed) armLaunchSplash();
  }, [answers.completed]);

  if (answers.completed) {
    return <Redirect href="/today" />;
  }

  return <GetStartedLanding />;
}

function GetStartedVideoBackground() {
  const player = useVideoPlayer(SIGN_IN_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  return (
    <VideoView
      player={player}
      style={StyleSheet.absoluteFillObject}
      contentFit="cover"
      nativeControls={false}
    />
  );
}

/**
 * First screen of the app for new users: looping full-bleed video
 * behind the Get Started CTA (falls back to black until native
 * expo-video is linked via `npx expo run:ios`).
 */
function GetStartedLanding() {
  const router = useRouter();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();
  const { reset: resetOnboarding } = useOnboarding();
  const videoReady = useMemo(() => hasNativeExpoVideo(), []);

  const compactLanding = screenHeight < 740 || screenWidth < 390;
  const headlineSize = compactLanding ? 32 : 36;
  const headlineLineHeight = compactLanding ? 36 : 40;

  const handleGetStarted = () => {
    haptics.thud();
    resetOnboarding();
    router.push("/onboarding/attribution");
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {videoReady ? <GetStartedVideoBackground /> : null}

      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, styles.scrim]}
      />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        <View style={styles.spacer} />

        <View style={styles.copyBlock}>
          <FadeIn delayMs={200} durationMs={800}>
            <Text
              style={{
                color: "#FFFFFF",
                fontFamily: "System",
                fontWeight: "700",
                fontSize: headlineSize,
                lineHeight: headlineLineHeight,
                letterSpacing: -0.8,
                marginBottom: 14,
                textAlign: "center",
              }}
              accessibilityRole="header"
            >
              Welcome to Closer.
            </Text>
          </FadeIn>

          <FadeIn delayMs={450} durationMs={800}>
            <Text
              style={{
                color: "rgba(255,255,255,0.82)",
                fontFamily: "System",
                fontWeight: "400",
                fontSize: 17,
                lineHeight: 24,
                marginBottom: 28,
                maxWidth: 340,
                textAlign: "center",
                alignSelf: "center",
              }}
            >
              Block your distracting apps and make more time for God every
              day.
            </Text>
          </FadeIn>

          <View style={{ alignSelf: "stretch" }}>
            <FadeIn delayMs={700} durationMs={700}>
              <PrimaryPillButton
                label="Get Started"
                onPress={handleGetStarted}
                heavy
              />
            </FadeIn>
          </View>

          <FadeIn delayMs={900} durationMs={600}>
            <Text
              style={{
                color: "rgba(255,255,255,0.72)",
                fontFamily: "System",
                fontWeight: "400",
                fontSize: 12,
                lineHeight: 17,
                textAlign: "center",
                marginTop: 16,
                paddingHorizontal: 12,
              }}
            >
              By continuing, you agree to Closer's{" "}
              <Text
                onPress={() => Linking.openURL(TERMS_URL)}
                style={{
                  color: "rgba(255,255,255,0.92)",
                  fontFamily: "System",
                  fontWeight: "600",
                  textDecorationLine: "underline",
                }}
                accessibilityRole="link"
                accessibilityLabel="Terms of Service"
              >
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text
                onPress={() => Linking.openURL(PRIVACY_URL)}
                style={{
                  color: "rgba(255,255,255,0.92)",
                  fontFamily: "System",
                  fontWeight: "600",
                  textDecorationLine: "underline",
                }}
                accessibilityRole="link"
                accessibilityLabel="Privacy Policy"
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </FadeIn>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrim: {
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  safe: {
    flex: 1,
  },
  spacer: {
    flex: 1,
  },
  copyBlock: {
    paddingHorizontal: 28,
    paddingBottom: 12,
    alignItems: "center",
  },
});
