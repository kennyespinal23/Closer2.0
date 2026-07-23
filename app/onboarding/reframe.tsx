import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { HeroDisc, HeroOnboardingPage } from "@/components/HeroOnboardingPage";
import { useColors } from "@/state/theme";

export default function ReframeScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <HeroOnboardingPage
      eyebrow="WE'LL CALL IT"
      subject={
        <HeroDisc>
          <Text
            style={{
              color: colors.ink,
              fontFamily: "System",
              fontWeight: "800",
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
                color: colors.inkSecondary,
                fontFamily: "System",
                fontWeight: "500",
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
      onContinue={() => router.push("/onboarding/notifications")}
    />
  );
}
