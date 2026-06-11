import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { HeroDisc, HeroOnboardingPage } from "@/components/HeroOnboardingPage";
import { useOnboarding } from "@/state/onboarding";

/**
 * Screen — The Good News (Proof).
 *
 * Relief beat right after the punch. The punch named the cost;
 * this screen names what changes when the cost is paid down.
 *
 * Built on the shared <HeroOnboardingPage> shell with the
 * WARM AMBER palette — sunrise tone, hopeful brightener. Amber
 * is the natural opposite of the punch's crimson and reads
 * unambiguously as "the dawn after the night" without needing
 * any explicit "good news" eyebrow.
 *
 * Subject for this beat: a giant "9 / 10" ratio inside the disc.
 * The previous version stacked three testimonial cards; we
 * compressed to a single dominant proof point because the
 * Hallow page wants ONE subject, not three — and "9 out of 10
 * feel less anxious after 7 days" is the strongest of the three
 * stats. The remaining two are folded into the quote + attribution.
 *
 * If the user gave us their name on /name (very likely now),
 * we drop it into the eyebrow so the relief feels addressed
 * specifically at them.
 */

const PAGE_BG = "#B26425"; // warm dawn amber
const SKY_AMBER = "#E29259"; // brighter sunrise halo + sky

export default function ProofScreen() {
  const router = useRouter();
  const { answers } = useOnboarding();
  const firstName = (answers.name || "").trim().split(" ")[0];

  const eyebrow = firstName
    ? `${firstName.toUpperCase()} — HERE'S THE GOOD NEWS`
    : "HERE'S THE GOOD NEWS";

  return (
    <HeroOnboardingPage
      pageBg={PAGE_BG}
      ambientGlow={SKY_AMBER}
      eyebrow={eyebrow}
      subject={
        <HeroDisc haloColor={SKY_AMBER}>
          {/* The 9/10 ratio is the page's whole point. We render
              the numerator and denominator at different sizes so
              the "9" sits as the headline glyph and the "/ 10"
              reads as the supporting fraction. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontFamily: "PlusJakartaSans_700Bold",
                fontSize: 74,
                letterSpacing: -3,
                lineHeight: 78,
              }}
            >
              9
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.65)",
                fontFamily: "PlusJakartaSans_600SemiBold",
                fontSize: 28,
                letterSpacing: -0.6,
                marginLeft: 6,
              }}
            >
              / 10
            </Text>
          </View>
          <View style={{ marginTop: 2 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.6)",
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 12,
                letterSpacing: 1.4,
                textTransform: "uppercase",
              }}
            >
              after 7 days
            </Text>
          </View>
        </HeroDisc>
      }
      quoteSetup="9 out of 10 Closer users say they"
      quoteEmphasis="feel less anxious before their day even starts."
      attribution="Join thousands who chose God before the feed."
      ctaLabel="Continue"
      onContinue={() => router.push("/onboarding/rating")}
      ctaTextColor="#2E1607"
    />
  );
}
