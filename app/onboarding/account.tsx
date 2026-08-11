import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BrandMark } from "@/components/BrandMark";
import { EmailSignInModal } from "@/components/EmailSignInModal";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { SocialButton } from "@/components/SocialButton";
import { progressFor } from "@/constants/onboarding";
import { spacing } from "@/constants/spacing";
import { systemText, typography } from "@/lib/typography";
import { useAuth } from "@/state/auth";
import { useColors } from "@/state/theme";

export default function AccountScreen() {
  const router = useRouter();
  const colors = useColors();
  const {
    configured,
    signingIn,
    sendEmailCode,
    verifyEmailCode,
  } = useAuth();
  const [loginOpen, setLoginOpen] = useState(false);

  const progress = progressFor("account");
  const goNext = () => router.push("/onboarding/quietapps");

  const notConfigured = () =>
    Alert.alert(
      "Almost there",
      "Supabase isn't connected yet. Try again after restarting the app.",
      [{ text: "OK" }],
    );

  // Account is optional in onboarding — social CTAs always advance.
  // Sign-in can be completed later from Settings.
  const handleApple = () => goNext();
  const handleGoogle = () => goNext();

  const handleLoginEmail = async (email: string) => {
    if (!configured) {
      notConfigured();
      throw new Error("Supabase isn't connected yet.");
    }
    await sendEmailCode(email);
  };

  const handleLoginCode = async (email: string, code: string) => {
    await verifyEmailCode(email, code);
    setLoginOpen(false);
    goNext();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingChrome
        mode="with-progress"
        progress={progress}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: spacing[16] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            flex: 1,
            paddingHorizontal: spacing[24],
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, justifyContent: "center", paddingTop: 12 }}>
            <FadeIn delayMs={0}>
              <View style={{ alignItems: "center", marginBottom: spacing[24] }}>
                <BrandMark size={96} />
              </View>
            </FadeIn>

            <FadeIn delayMs={200}>
              <Text
                accessibilityRole="header"
                style={[
                  systemText.title1,
                  {
                    color: colors.ink,
                    textAlign: "center",
                  },
                ]}
              >
                Create your account
              </Text>
            </FadeIn>

            <FadeIn delayMs={400}>
              <Text
                style={[
                  systemText.callout,
                  {
                    color: colors.inkMuted,
                    textAlign: "center",
                    marginTop: spacing[12],
                    paddingHorizontal: spacing[8],
                  },
                ]}
              >
                Save your streak, highlights, and journey across devices.
              </Text>
            </FadeIn>
          </View>

          <View style={{ paddingBottom: spacing[8] }}>
            <FadeIn delayMs={800}>
              <View style={{ gap: spacing[12] }}>
                <SocialButton
                  provider="google"
                  variant="soft"
                  onPress={handleGoogle}
                />
                <SocialButton
                  provider="apple"
                  variant="accent"
                  onPress={handleApple}
                />
              </View>
            </FadeIn>

            <FadeIn delayMs={1000}>
              <Text
                style={[
                  systemText.caption1,
                  {
                    color: colors.inkMuted,
                    textAlign: "center",
                    marginTop: spacing[16],
                    paddingHorizontal: spacing[16],
                  },
                ]}
              >
                By continuing, you agree to our Terms of Service and Privacy
                Policy.
              </Text>
            </FadeIn>

            <FadeIn delayMs={1200}>
              <Pressable
                onPress={() => setLoginOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Log in"
                hitSlop={8}
                style={{
                  marginTop: spacing[24],
                  minHeight: 44,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={[
                    systemText.subheadline,
                    { color: colors.inkMuted, textAlign: "center" },
                  ]}
                >
                  Already have an account?{" "}
                  <Text
                    style={[
                      typography.button,
                      {
                        color: colors.ink,
                        fontSize: 15,
                        lineHeight: 20,
                      },
                    ]}
                  >
                    Log in
                  </Text>
                </Text>
              </Pressable>
            </FadeIn>
          </View>
        </View>
      </ScrollView>

      <EmailSignInModal
        visible={loginOpen}
        busy={signingIn}
        onClose={() => setLoginOpen(false)}
        onSubmitEmail={handleLoginEmail}
        onSubmitCode={handleLoginCode}
      />
    </SafeAreaView>
  );
}
