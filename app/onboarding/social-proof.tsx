import { ImageBackground, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { useOnboarding } from "@/state/onboarding";

/**
 * Social proof beat — after Faith Check In.
 * Layout mirrors Abide: large top headline, mid-screen
 * testimonial + stars, pill CTA at the bottom. SF Pro throughout.
 */

const BACKDROP = require("@/assets/onboarding/social-proof-hills.png");

const TESTIMONIAL =
  "I'm using Closer every day and it's making a real change in my daily faith life. I always felt like I was too far from God — thank you for reminding me I was wrong.";

const AUTHOR = "KENNY";

export default function SocialProofScreen() {
  const router = useRouter();
  const { answers } = useOnboarding();
  const firstName = (answers.name || "").trim().split(/\s+/)[0];
  const headline = firstName
    ? `${firstName}, you're among many Christians\nchoosing Closer\nto find their way back to God.`
    : "You're among many Christians\nchoosing Closer\nto find their way back to God.";

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ImageBackground
        source={BACKDROP}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <View style={styles.scrim} pointerEvents="none" />

      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        <View style={styles.body}>
          {/* Top — headline (~Abide 28pt serif scale) */}
          <FadeIn delayMs={100}>
            <Text style={styles.headline}>{headline}</Text>
          </FadeIn>

          {/* Mid — testimonial sits high in the remaining gap */}
          <View style={styles.midSpacerTop} />
          <FadeIn delayMs={450}>
            <View style={styles.testimonial}>
              <Text style={styles.quote}>"{TESTIMONIAL}"</Text>
              <Text style={styles.author}>{AUTHOR}</Text>
              <View style={styles.stars}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Text key={i} style={styles.star}>
                    ★
                  </Text>
                ))}
              </View>
            </View>
          </FadeIn>
          <View style={styles.midSpacerBottom} />

          {/* Bottom — into How Closer works */}
          <FadeIn delayMs={700}>
            <Button
              label="Show me how it works"
              onPress={() => router.push("/onboarding/howitworks")}
            />
          </FadeIn>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#2A3A48",
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(10, 16, 24, 0.40)",
  },
  body: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 140,
    paddingBottom: 12,
  },
  headline: {
    fontFamily: "System",
    fontWeight: "700",
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.6,
    color: "#FFFFFF",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
  // Uneven spacers push the testimonial higher toward the headline.
  midSpacerTop: {
    flex: 0.12,
  },
  midSpacerBottom: {
    flex: 1.2,
  },
  testimonial: {
    paddingHorizontal: 4,
  },
  quote: {
    fontFamily: "System",
    fontWeight: "400",
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: -0.2,
    color: "rgba(255,255,255,0.95)",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  author: {
    marginTop: 20,
    fontFamily: "System",
    fontWeight: "600",
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 2.6,
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 12,
  },
  star: {
    fontSize: 15,
    lineHeight: 18,
    color: "#E8C07A",
  },
});
