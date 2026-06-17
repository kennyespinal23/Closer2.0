import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { SocialButton } from "@/components/SocialButton";
import { progressFor } from "@/constants/onboarding";

export default function AccountScreen() {
  const router = useRouter();

  const goToTime = () => router.push("/onboarding/time");

  const handleApple = () => {
    goToTime();
  };

  const handleGoogle = () => {
    goToTime();
  };

  const handleEmail = () => {
    goToTime();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("account")}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          <View className="mt-16">
            <FadeIn delayMs={0}>
              <Text
                className="text-ink text-[32px] leading-[40px] tracking-[-0.8px]"
                style={{ fontFamily: "System", fontWeight: "700" }}
              >
                Start your journey{"\n"}with Closer.
              </Text>
            </FadeIn>

            <FadeIn delayMs={700}>
              <Text
                className="text-ink-muted text-[16px] leading-[24px] mt-4"
                style={{ fontFamily: "System", fontWeight: "400" }}
              >
                Create your account to personalize your experience.
              </Text>
            </FadeIn>
          </View>

          <View className="flex-1 min-h-[60px]" />

          <FadeIn delayMs={1400}>
            <View className="gap-3">
              <SocialButton provider="apple" onPress={handleApple} />
              <SocialButton provider="google" onPress={handleGoogle} />
              <SocialButton provider="email" onPress={handleEmail} />
            </View>
          </FadeIn>

          <FadeIn delayMs={2000}>
            <Text
              className="text-ink-subtle text-[11px] leading-[16px] text-center mt-6 mb-2 px-4"
              style={{ fontFamily: "System", fontWeight: "400" }}
            >
              By continuing, you agree to our{" "}
              <Text
                className="text-ink-muted"
                style={{ fontFamily: "System", fontWeight: "500" }}
              >
                Terms of Service
              </Text>{" "}
              and{" "}
              <Text
                className="text-ink-muted"
                style={{ fontFamily: "System", fontWeight: "500" }}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </FadeIn>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
