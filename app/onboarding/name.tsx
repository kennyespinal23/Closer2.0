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
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { useOnboarding } from "@/state/onboarding";
import { useColors } from "@/state/theme";
import { progressFor } from "@/constants/onboarding";

export default function NameStep() {
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
    router.push("/onboarding/world");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingHeader progress={progressFor("name")} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <View className="flex-1 px-6">
          {/* Question */}
          <View className="mt-12">
            <Text
              className="text-ink text-[34px] leading-[40px] tracking-[-0.8px]"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              First — what should{"\n"}we call you?
            </Text>
            <Text
              className="text-ink-muted mt-3 text-[15px] leading-[22px]"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              We&apos;ll use your name to personalize{"\n"}
              your daily readings.
            </Text>
          </View>

          {/* Input — hero style, underline only */}
          <View className="mt-12">
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

          {/* Spacer pushes CTA to bottom */}
          <View className="flex-1" />

          {/* CTA */}
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
