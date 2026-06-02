import { StatusBar } from "expo-status-bar";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { FadeIn } from "@/components/FadeIn";

/**
 * Screen 1 — The Opening Stat.
 *
 * The very first beat of onboarding. No logo, no progress bar, no
 * back arrow. Pure black with white text. The job is one thing:
 * name the stat the user is about to recognize themselves in.
 *
 * Hard-coded "2 hrs 27 min" is intentional — this is The Number
 * we're putting on the wall, not a personalized stat (the
 * personalized one lands on Screen 6 once we've gathered their
 * inputs). The Pew/eMarketer-style figure works because the
 * average is the average; the user nods along.
 *
 * Everything below — the next 16 screens — is the consequence of
 * the user choosing to keep reading after this number lands.
 */
export default function StatScreen() {
  const router = useRouter();

  return (
    // Forced black background — overrides the user's theme pref.
    // The screen is a set piece; the dramatic effect depends on
    // pure-black contrast with bright white text. SafeAreaView is
    // black; the status bar is forced to light icons so the time
    // / battery don't disappear.
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-6 items-center justify-center">
          {/* Eyebrow — sets up the stat. Smaller, dimmer so the
              number below explodes off the page by contrast. */}
          <FadeIn delayMs={300} durationMs={1100}>
            <Text
              className="text-[14px] tracking-[3px] uppercase text-center"
              style={{
                color: "#9B9BA3",
                fontFamily: "PlusJakartaSans_700Bold",
              }}
            >
              The average American
            </Text>
          </FadeIn>

          {/* The number itself. Single line, oversized, tight
              tracking. The whole screen exists to deliver this. */}
          <FadeIn delayMs={1100} durationMs={1400}>
            <Text
              className="text-center mt-6"
              style={{
                color: "#FFFFFF",
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 64,
                lineHeight: 68,
                letterSpacing: -2,
              }}
            >
              2 hrs{"\n"}27 min
            </Text>
          </FadeIn>

          {/* The "on social media" + "before 10am" couplet. Two
              short lines, generously spaced from the number so the
              eye lands on them after the stat has registered. */}
          <FadeIn delayMs={2400} durationMs={900}>
            <Text
              className="text-center mt-8"
              style={{
                color: "#FFFFFF",
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 18,
                lineHeight: 26,
              }}
            >
              On social media.{"\n"}Before 10am.
            </Text>
          </FadeIn>

          {/* The personal beat. Lower-key, italic feel via the
              regular weight + extra letterspacing. */}
          <FadeIn delayMs={3500} durationMs={900}>
            <Text
              className="text-center mt-10 px-2"
              style={{
                color: "#C2C2C7",
                fontFamily: "PlusJakartaSans_400Regular",
                fontSize: 15.5,
                lineHeight: 23,
              }}
            >
              You open Instagram{"\n"}
              before you open your eyes.{"\n\n"}
              Most of us do.
            </Text>
          </FadeIn>

          {/* The setup line for the next screen. Slightly brighter
              than the previous block so the reader feels nudged
              toward the action. */}
          <FadeIn delayMs={5000} durationMs={900}>
            <Text
              className="text-center mt-8 px-2"
              style={{
                color: "#FFFFFF",
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 15,
                lineHeight: 22,
              }}
            >
              The question is what{"\n"}that time is costing you.
            </Text>
          </FadeIn>
        </View>

        {/* Single CTA — "I know the feeling →". Underlined chevron-
            style link instead of a fat primary button. The screen
            is contemplative; a bold pill would shatter the mood. */}
        <FadeIn delayMs={6200} durationMs={900}>
          <View className="px-6 pb-4">
            <Pressable
              hitSlop={14}
              onPress={() => router.push("/onboarding/apps")}
              accessibilityRole="button"
              accessibilityLabel="Continue to next step"
              style={({ pressed }) => ({
                alignSelf: "center",
                paddingVertical: 14,
                paddingHorizontal: 28,
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontFamily: "PlusJakartaSans_600SemiBold",
                  fontSize: 17,
                  letterSpacing: 0.2,
                }}
              >
                I know the feeling  →
              </Text>
            </Pressable>
          </View>
        </FadeIn>
      </SafeAreaView>
    </View>
  );
}
