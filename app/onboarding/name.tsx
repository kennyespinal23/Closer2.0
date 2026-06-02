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
 * Screen 8 — "Before we go any further — what's your name?"
 *
 * Deliberately positioned AFTER the gut punch and the "why"
 * picker, not as the first screen. Two reasons:
 *
 *   1. Earned intimacy. By Screen 8 the user has agreed (by
 *      tapping forward) with our framing of their mornings and
 *      named what they're searching for. Asking for the name now
 *      reads as a friend taking interest — not a form field at
 *      sign-up.
 *
 *   2. Naming the verse. The closing line on Screen 16 ("Your
 *      first word.") and the personalized notification preview
 *      on Screen 13 both need the name to land. Setting it here
 *      gives us a value to interpolate into both downstream
 *      surfaces without the awkward fallback "[Name]".
 *
 * Input is the same hero underline style the old name screen
 * used — that pattern is muscle memory in the codebase and reads
 * cleanly. The body copy is rewritten per the new spec.
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
    router.push("/onboarding/proof");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
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
                selectionColor={colors.primary}
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
                  backgroundColor: focused
                    ? colors.primary
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
