import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { HeroDisc, HeroOnboardingPage } from "@/components/HeroOnboardingPage";

/**
 * Screen — The Reframe (Brand reveal).
 *
 * The first time the Closer brand appears as the centerpiece.
 * Until this screen the audit + emotional setup has been
 * unbranded ("the average person", "you", "God") — now we name
 * what the app IS.
 *
 * Built on the shared <HeroOnboardingPage> shell with the
 * EMERALD palette — deep forest green, calm peace tone. Green
 * carries growth / new-life weight and is the natural "after
 * the storm" color following the punch (crimson) and the
 * proof's amber. It's also distinct from the cobalt + violet
 * earlier in the flow, so the user feels they've walked into a
 * different room when the brand is named.
 *
 * Subject: the Closer wordmark itself, framed in the disc — the
 * brand getting its first hero treatment. The quote underneath
 * delivers the value proposition in the dim-setup / bright-
 * punchline split that's now the onboarding's signature
 * vocabulary.
 *
 * This is the natural launch point for the progress-bar chrome
 * that ran on the previous version of this screen, but the
 * Hallow page intentionally drops chrome (the back arrow stays,
 * the progress bar would compete with the brand moment). The
 * "we've come a long way" signal lives in the page itself — by
 * the time the user reaches the brand reveal they don't need a
 * bar to know they're far in.
 */

const PAGE_BG = "#1F5B3D"; // deep forest emerald
const SKY_EMERALD = "#4A9577"; // softer emerald halo + sky

export default function ReframeScreen() {
  const router = useRouter();

  return (
    <HeroOnboardingPage
      pageBg={PAGE_BG}
      ambientGlow={SKY_EMERALD}
      eyebrow="WE'LL CALL IT"
      subject={
        <HeroDisc haloColor={SKY_EMERALD}>
          {/* The brand wordmark itself, sized to feel like the
              "portrait" subject — same visual weight as a 2-digit
              number or a circular icon. Tight negative tracking
              gives it editorial polish. */}
          <Text
            style={{
              color: "#FFFFFF",
              fontFamily: "PlusJakartaSans_800ExtraBold",
              fontSize: 38,
              letterSpacing: -1.4,
              lineHeight: 42,
            }}
          >
            Closer
          </Text>
          <View style={{ marginTop: 4 }}>
            <Text
              style={{
                color: "rgba(255,255,255,0.6)",
                fontFamily: "PlusJakartaSans_500Medium",
                fontSize: 11,
                letterSpacing: 1.8,
                textTransform: "uppercase",
              }}
            >
              meet God first
            </Text>
          </View>
        </HeroDisc>
      }
      quoteSetup="Not a Bible study. Not a sermon. Not church."
      quoteEmphasis="One verse. One thought. Five minutes — before anything else gets to you."
      attribution="The first word of your day."
      ctaLabel="I want that"
      onContinue={() => router.push("/onboarding/howitworks")}
      ctaTextColor="#0E2A1C"
    />
  );
}
