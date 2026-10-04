import { useEffect, useState } from "react";
import { AppState, Linking, StyleSheet, useWindowDimensions, View } from "react-native";
import { Text } from "@/components/CloserText";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Redirect, useRouter } from "expo-router";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { useIsFocused } from "@react-navigation/native";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { PrimaryPillButton } from "@/components/PrimaryPillButton";
import { FadeIn } from "@/components/FadeIn";
import * as haptics from "@/lib/haptics";
import { armLaunchSplash } from "@/lib/launchSplashSession";
import { useOnboarding } from "@/state/onboarding";

const SPACE_BACKGROUND = require("@/assets/onboarding/welcome/space-cross-poster.jpg");
const TERMS_URL = "https://closer.app/terms";
const PRIVACY_URL = "https://closer.app/privacy";

/**
 * Root launch gate.
 *
 * Returning users (`completed === true`) never see the Get Started
 * landing — they route straight home. New users see the space
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

function WelcomeSpaceCross() {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const player = useVideoPlayer(require("@/assets/onboarding/welcome/space-cross.mp4"), p => {
    p.muted = true;
    p.loop = true;
    p.staysActiveInBackground = false;
    if (AppState.currentState === "active") p.play();
  });
  useEffect(() => {
    const app = AppState.addEventListener("change", state => {
      if (state === "active") player.play(); else player.pause();
    });
    const status = player.addListener("statusChange", event => {
      if (event.status === "error") setFailed(true);
    });
    return () => { app.remove(); status.remove(); };
  }, [player]);
  return failed ? null : <VideoView player={player} contentFit="cover" nativeControls={false}
    accessible={false} onFirstFrameRender={() => setReady(true)}
    style={[StyleSheet.absoluteFillObject, {opacity: ready ? 1 : 0}]}/>;
}

/** The animated cross shares the globe opening’s space background. */
function GetStartedLanding() {
  const router = useRouter();
  const focused = useIsFocused();
  const reduced = useReducedMotion();
  const { height: screenHeight, width: screenWidth } = useWindowDimensions();

  const compactLanding = screenHeight < 740 || screenWidth < 390;
  const headlineSize = compactLanding ? 32 : 36;
  const headlineLineHeight = compactLanding ? 36 : 40;

  const handleGetStarted = () => {
    haptics.thud();
    router.push("/onboarding/journey");
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <Image source={SPACE_BACKGROUND} style={StyleSheet.absoluteFillObject} contentFit="cover" accessible={false}/>
      {focused && !reduced && <WelcomeSpaceCross/>}

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
                variant="cream"
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
    backgroundColor: "#0C0E1E",
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
