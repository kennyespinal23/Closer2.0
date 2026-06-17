import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { HeroDisc, HeroOnboardingPage } from "@/components/HeroOnboardingPage";
import { useColors } from "@/state/theme";

export default function StatScreen() {
  const router = useRouter();
  const colors = useColors();

  return (
    <HeroOnboardingPage
      subject={
        <HeroDisc>
          <Text
            style={{
              color: colors.ink,
              fontFamily: "System",
              fontWeight: "700",
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
                color: colors.inkSecondary,
                fontFamily: "System",
                fontWeight: "500",
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
