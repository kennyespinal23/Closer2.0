import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { useOnboarding } from "@/state/onboarding";
import { useColors } from "@/state/theme";

/**
 * Screen 2 (new flow) — "Before we go any further — what's your name?"
 *
 * Sits between the "what brings you" picker (screen 1) and the
 * stat reveal (screen 3). The previous flow placed this screen
 * much later, after the gut punch; in the new ordering the user
 * names themselves BEFORE we audit their phone time, so the
 * stat that lands next reads as personally directed instead of
 * a billboard at a stranger.
 *
 * Naming the verse: Screens further down (the closing line on
 * /onboarding/welcome and the personalized notification preview
 * on /onboarding/notifications) both interpolate `answers.name`,
 * so capturing it here keeps those surfaces from falling back to
 * a generic "[Name]" token.
 *
 * Input is the same hero underline style the old name screen
 * used — that pattern is muscle memory in the codebase and reads
 * cleanly.
 */
export default function NameScreen() {
  const router = useRouter();
  const colors = useColors();
  const { answers, setAnswer } = useOnboarding();

  const [name, setName] = useState(answers.name);
  const [focused, setFocused] = useState(false);

  const trimmed = name.trim();
  const canContinue = trimmed.length >= 2;

  const handleContinue = () => {
    if (!canContinue) return;
    setAnswer("name", trimmed);
    // After name we enter the three Christian-identity beats —
    // denomination → faith stage → growth areas — before the
    // secular app audit (stat / apps / scrolltime / waketime).
    // These three screens signal "this is a Christian product
    // first" inside the first 60 seconds, and they unlock the
    // personalization that the rest of the app reads from.
    router.push("/onboarding/denomination");
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <OnboardingChrome mode="back-only" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <View className="flex-1 px-6">
          <FadeIn delayMs={0}>
            <View className="mt-8">
              <Text
                className="text-ink text-[28px] leading-[36px] tracking-[-0.6px]"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                Before we go any further —{"\n"}what&apos;s your name?
              </Text>
            </View>
          </FadeIn>

          <FadeIn delayMs={600}>
            <View className="mt-10">
              <TextInput
                value={name}
                onChangeText={setName}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="Your name"
                placeholderTextColor={colors.inkSubtle}
                // iOS-blue text caret + selection handles match the
                // rest of the onboarding selection vocabulary and
                // also match the OS-level iOS convention for any
                // editable text field.
                selectionColor={colors.select}
                autoCapitalize="words"
                autoComplete="given-name"
                autoCorrect={false}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleContinue}
                maxLength={40}
                className="text-ink text-[32px] py-2"
                style={{ fontFamily: "PlusJakartaSans_600SemiBold" }}
              />
              <View
                className="h-[2px] rounded-full"
                style={{
                  // Focused underline lights up in iOS blue — same
                  // accent as the cursor above, so the input's
                  // focus state reads as one coherent thing.
                  backgroundColor: focused
                    ? colors.select
                    : colors.borderStrong,
                }}
              />
            </View>
          </FadeIn>

          <FadeIn delayMs={1100}>
            <Text
              className="text-ink-muted text-[14px] leading-[21px] mt-6"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              This is just for us.{"\n"}
              Your verse will know who it&apos;s talking to.
            </Text>
          </FadeIn>

          <View className="flex-1" />

          <View className="pb-2">
            <Button
              label="Continue"
              onPress={handleContinue}
              disabled={!canContinue}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
