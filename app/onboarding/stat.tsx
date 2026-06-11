import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { HeroDisc, HeroOnboardingPage } from "@/components/HeroOnboardingPage";

/**
 * Screen 6 (post-faith-identity flow) — The Stat Reveal.
 *
 * Was screen 1 in the original flow. Now lands AFTER the
 * Christian-identity beats (why → name → denomination →
 * faithstage → growth), so the "average person spends 2:27 a
 * day on socials" line is pointed AT a named, identified user
 * instead of an anonymous prospect.
 *
 * Built on the shared <HeroOnboardingPage> shell with the cobalt
 * palette — deep saturated blue, lighter sky-blue glow. Every
 * Hallow-style page in onboarding uses the same shell with a
 * different palette + a different circle subject + different
 * quote copy.
 *
 * Subject for this beat: the number itself. Since the "speaker"
 * is data (not a person), the centerpiece IS the figure — 2:27
 * inside the same circular frame Hallow uses for portraits, with
 * a small "hours / day" label underneath.
 */

const PAGE_BG = "#1841CC"; // deep cobalt
const SKY_BLUE = "#3A5FE0"; // lighter sky glow + halo

export default function StatScreen() {
  const router = useRouter();

  return (
    <HeroOnboardingPage
      pageBg={PAGE_BG}
      ambientGlow={SKY_BLUE}
      subject={
        <HeroDisc haloColor={SKY_BLUE}>
          <Text
            style={{
              color: "#FFFFFF",
              fontFamily: "PlusJakartaSans_700Bold",
              fontSize: 58,
              letterSpacing: -2,
              lineHeight: 62,
            }}
          >
            2:27
          </Text>
          <View style={{ marginTop: 4 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.55)",
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 13,
                letterSpacing: 1.2,
                textTransform: "uppercase",
              }}
            >
              hours / day
            </Text>
          </View>
        </HeroDisc>
      }
      quoteSetup="The average person spends"
      quoteEmphasis="2 hours, 27 minutes a day on social media."
      attribution="DataReportal · Global Digital Report 2024"
      ctaLabel="Continue"
      onContinue={() => router.push("/onboarding/apps")}
    />
  );
}
