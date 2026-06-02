import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { progressFor } from "@/constants/onboarding";
import { useColors } from "@/state/theme";

/**
 * Screen 11 — The Reframe.
 *
 * The first time the Closer brand appears. Ten screens of
 * audit + emotional setup, and only NOW do we name what the app
 * is. The screen has two visual jobs:
 *
 *   1. Display the wordmark at the top, small. Quiet, not
 *      triumphal — we're naming ourselves, not announcing.
 *
 *   2. Show the "Apps → Empty mornings" → "Closer → 5 minutes
 *      that actually fill you" swap. Two stacked rows. The first
 *      row leverages the user's existing visual memory (app
 *      icons, scroll feed) and the second row introduces what
 *      Closer replaces it with.
 *
 * After this screen the progress-bar chrome appears for the
 * rest of onboarding — the user knows what they're doing and
 * the bar reads as "almost there" rather than as a brand tell.
 *
 * This is also the screen where the OnboardingChrome switches
 * from `back-only` to `with-progress`. The back chevron remains
 * (users can rewind to the rating prompt if they tapped through
 * by accident), and a thin progress bar appears for the first
 * time.
 */
export default function ReframeScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("reframe")}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          {/* Small wordmark, top-centered. First brand impression. */}
          <FadeIn delayMs={0}>
            <View className="items-center mt-4">
              <Text
                style={{
                  color: colors.ink,
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 22,
                  letterSpacing: -0.6,
                }}
              >
                Closer
              </Text>
            </View>
          </FadeIn>

          <FadeIn delayMs={400}>
            <Text
              className="text-ink text-[28px] leading-[36px] tracking-[-0.5px] text-center mt-10"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Meet God before{"\n"}the noise.
            </Text>
          </FadeIn>

          <FadeIn delayMs={900}>
            <Text
              className="text-ink-muted text-[16px] leading-[26px] text-center mt-5 px-2"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Not a Bible study.{"\n"}Not a sermon.{"\n"}Not church.
            </Text>
          </FadeIn>

          <FadeIn delayMs={1500}>
            <Text
              className="text-ink text-[18px] leading-[28px] text-center mt-6 px-2"
              style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
            >
              One verse. One thought. One question.{"\n"}5 minutes.
            </Text>
          </FadeIn>

          <FadeIn delayMs={2000}>
            <Text
              className="text-ink-muted text-[14.5px] leading-[22px] text-center mt-3 px-2"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Before anything else gets to you first.
            </Text>
          </FadeIn>

          {/* The swap. Two rows. The "before" row says where the
              first five minutes go today; the "after" row says
              where they'd go with Closer. Kept stark — no app
              icons, no glyph noise, just typography. */}
          <FadeIn delayMs={2600}>
            <View
              className="mt-10 mx-1 rounded-2xl border border-border"
              style={{ backgroundColor: colors.surface }}
            >
              <SwapRow
                left="App icons"
                arrow="→"
                right="Empty mornings"
                muted
              />
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  marginHorizontal: 16,
                }}
              />
              <SwapRow
                left="Closer"
                arrow="→"
                right="5 minutes that actually fill you"
              />
            </View>
          </FadeIn>

          <View className="flex-1 min-h-[16px]" />

          <FadeIn delayMs={3200}>
            <View className="pt-6 pb-2">
              <Button
                label="I want that"
                onPress={() => router.push("/onboarding/attribution")}
              />
            </View>
          </FadeIn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Single row inside the swap card. Left phrase, arrow, right
 * phrase. The `muted` variant dims the whole row so the "before"
 * read as the past tense and the "after" as the new path.
 */
function SwapRow({
  left,
  arrow,
  right,
  muted = false,
}: {
  left: string;
  arrow: string;
  right: string;
  muted?: boolean;
}) {
  const colors = useColors();
  const opacity = muted ? 0.55 : 1;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        paddingHorizontal: 18,
        opacity,
      }}
    >
      <Text
        style={{
          color: colors.ink,
          fontFamily: "PlusJakartaSans_600SemiBold",
          fontSize: 15,
        }}
      >
        {left}
      </Text>
      <Text
        style={{
          color: colors.inkSubtle,
          fontFamily: "PlusJakartaSans_500Medium",
          fontSize: 15,
          marginHorizontal: 12,
        }}
      >
        {arrow}
      </Text>
      <Text
        style={{
          color: colors.ink,
          fontFamily: "PlusJakartaSans_500Medium",
          fontSize: 15,
          flex: 1,
        }}
      >
        {right}
      </Text>
    </View>
  );
}
