import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { useOnboarding } from "@/state/onboarding";

/**
 * Screen 9 — The Good News.
 *
 * The relief screen. After two beats of darkness (the gut punch
 * and the why), the user gets a deliberate visual + emotional
 * pivot — warm light backdrop, hope-coded copy, three stat cards
 * stacked vertically.
 *
 * Design choices:
 *
 *   • Forced warm-light background regardless of the user's
 *     theme pref. The contrast against the surrounding dark
 *     screens is half the point — feeling like you stepped out
 *     of a room. The warm ivory (#FAF5EE) is a hair off-white,
 *     reading as "morning light" rather than "data table."
 *
 *   • Each stat is presented as a quote on a card. Pulling the
 *     quote out of the body and into a card makes each one feel
 *     like a separate person spoke it. The "9 out of 10" line
 *     anchors it as a quantified claim.
 *
 *   • The closing line — "Join thousands of others who chose God
 *     before the feed." — sits below a thin rule. The rule lets
 *     the page breathe before the CTA.
 */

const STATS: ReadonlyArray<{ quote: string; meta: string }> = [
  {
    quote: "I feel less anxious before my day starts",
    meta: "9 out of 10 Closer users after 7 days",
  },
  {
    quote: "I actually look forward to waking up now",
    meta: "8 out of 10 Closer users after 14 days",
  },
  {
    quote: "I feel like God is closer than I thought",
    meta: "9 out of 10 Closer users after 30 days",
  },
];

// Forced palette. We don't read these from the theme because the
// screen is a deliberate set piece — the light/dark contrast with
// surrounding screens is the whole point. Named constants keep the
// inline styles readable.
const PAGE_BG = "#FAF5EE"; // warm ivory
const INK = "#1A1A1A";
const INK_MUTED = "#5B5B5F";
const RULE = "#DAD3C7";
const CARD_BG = "#FFFFFF";
const CARD_BORDER = "#EBE3D3";
const ACCENT = "#1A1A1A"; // black on warm ivory

export default function ProofScreen() {
  const router = useRouter();
  const { answers } = useOnboarding();
  const firstName = (answers.name || "").trim().split(" ")[0];

  return (
    <View style={{ flex: 1, backgroundColor: PAGE_BG }}>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        {/* Light-tone back chevron — chevron is ink, not the
            white default we'd get from the theme on a forced bg. */}
        <OnboardingChrome mode="back-only" tone="light" />

        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6">
            {/* Opening line. Uses the name we captured on Screen 8.
                If the user got here without one (shouldn't happen,
                but the navigator could replay), fall back to a
                generic comma. */}
            <FadeIn delayMs={0}>
              <Text
                style={{
                  color: INK,
                  fontFamily: "PlusJakartaSans_700Bold",
                  fontSize: 26,
                  lineHeight: 34,
                  letterSpacing: -0.4,
                  marginTop: 12,
                }}
              >
                Here&apos;s the good news
                {firstName ? `, ${firstName}.` : "."}
              </Text>
            </FadeIn>

            <FadeIn delayMs={500}>
              <Text
                style={{
                  color: INK_MUTED,
                  fontFamily: "PlusJakartaSans_400Regular",
                  fontSize: 16,
                  lineHeight: 24,
                  marginTop: 10,
                }}
              >
                People who start their morning with Closer report:
              </Text>
            </FadeIn>

            <View className="mt-7" style={{ gap: 14 }}>
              {STATS.map((stat, i) => (
                <FadeIn key={stat.quote} delayMs={900 + i * 350}>
                  <StatCard quote={stat.quote} meta={stat.meta} />
                </FadeIn>
              ))}
            </View>

            {/* Quiet rule separating the cards from the closing
                line + CTA. */}
            <FadeIn delayMs={2400}>
              <View
                style={{
                  height: 1,
                  backgroundColor: RULE,
                  marginTop: 28,
                  marginHorizontal: 24,
                }}
              />
            </FadeIn>

            <FadeIn delayMs={2700}>
              <Text
                style={{
                  color: INK,
                  fontFamily: "PlusJakartaSans_500Medium",
                  fontSize: 16,
                  lineHeight: 24,
                  textAlign: "center",
                  marginTop: 20,
                  paddingHorizontal: 12,
                }}
              >
                Join thousands of others who chose God{"\n"}before the feed.
              </Text>
            </FadeIn>

            <View className="flex-1 min-h-[24px]" />

            <FadeIn delayMs={3000}>
              <View className="pt-6 pb-2">
                {/* Custom CTA wrapper so we can render an ink-black
                    button on the warm ivory background — the
                    themed Button would pick up the active palette,
                    which on dark mode would be white-on-white. */}
                <DarkOnLightButton
                  label="Continue"
                  onPress={() => router.push("/onboarding/rating")}
                />
              </View>
            </FadeIn>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function StatCard({ quote, meta }: { quote: string; meta: string }) {
  return (
    <View
      style={{
        backgroundColor: CARD_BG,
        borderColor: CARD_BORDER,
        borderWidth: 1,
        borderRadius: 18,
        paddingVertical: 18,
        paddingHorizontal: 20,
      }}
    >
      <Text
        style={{
          color: INK,
          fontFamily: "PlusJakartaSans_600SemiBold",
          fontSize: 17,
          lineHeight: 25,
          letterSpacing: -0.1,
        }}
      >
        &ldquo;{quote}&rdquo;
      </Text>
      <Text
        style={{
          color: INK_MUTED,
          fontFamily: "PlusJakartaSans_500Medium",
          fontSize: 12.5,
          marginTop: 8,
          letterSpacing: 0.5,
        }}
      >
        {meta}
      </Text>
    </View>
  );
}

/**
 * Solid-ink CTA on a light-forced background. Cannot use the
 * themed Button because that one inherits the active palette,
 * which would render white-on-white if the user is in dark mode.
 */
function DarkOnLightButton({
  label,
  onPress,
}: {
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        height: 56,
        borderRadius: 16,
        backgroundColor: ACCENT,
        alignItems: "center",
        justifyContent: "center",
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        style={{
          color: "#FFFFFF",
          fontFamily: "PlusJakartaSans_600SemiBold",
          fontSize: 16,
          letterSpacing: 0.1,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
