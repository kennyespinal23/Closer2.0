import { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { CLOSER_ACCENT } from "@/constants/theme";
import { useOnboarding } from "@/state/onboarding";
import { useColors } from "@/state/theme";

/** iOS-style placeholder gray — lighter than body muted ink. */
const PLACEHOLDER_GRAY = "#C7C7CC";

/**
 * First onboarding screen after Get Started —
 * "Before we go any further — what should we call you?"
 *
 * Continue uses the shared `Button` → `PrimaryPillButton`
 * (CLOSER_ACCENT reddish-orange).
 */
export default function NameScreen() {
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { answers, setAnswer } = useOnboarding();

  const [name, setName] = useState(answers.name);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const trimmed = name.trim();
  const canContinue = trimmed.length >= 3;

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleContinue = () => {
    if (!canContinue) return;
    Keyboard.dismiss();
    setAnswer("name", trimmed);
    router.push("/onboarding/chat");
  };

  const bottomPad =
    keyboardHeight > 0
      ? Math.max(keyboardHeight - insets.bottom, 8) + 8
      : 8;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top", "bottom"]}
    >
      <OnboardingChrome mode="back-only" />

      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <View style={{ paddingTop: 72 }}>
          <FadeIn delayMs={0}>
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "700",
                fontSize: 28,
                lineHeight: 36,
                letterSpacing: -0.6,
                textAlign: "center",
                color: colors.ink,
              }}
            >
              Before we go any further —{"\n"}what should we call you?
            </Text>
          </FadeIn>

          <FadeIn delayMs={600}>
            <View style={{ marginTop: 40 }}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={PLACEHOLDER_GRAY}
                selectionColor={CLOSER_ACCENT}
                cursorColor={CLOSER_ACCENT}
                autoCapitalize="words"
                autoComplete="given-name"
                autoCorrect={false}
                autoFocus
                returnKeyType="done"
                blurOnSubmit={false}
                onSubmitEditing={handleContinue}
                maxLength={40}
                style={{
                  fontFamily: "System",
                  fontWeight: "600",
                  fontSize: 32,
                  paddingVertical: 8,
                  textAlign: "center",
                  color: colors.ink,
                }}
              />
            </View>
          </FadeIn>
        </View>

        <View style={{ flex: 1 }} />

        {canContinue ? (
          <View style={{ paddingBottom: bottomPad }}>
            <Button label="Continue" onPress={handleContinue} />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
