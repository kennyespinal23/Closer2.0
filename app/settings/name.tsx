import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useOnboarding } from "@/state/onboarding";
import { useColors } from "@/state/theme";

/**
 * Edit your display name.
 *
 * Linked from the profile drawer's "Your name" row. The drawer
 * surfaces the current name; this screen lets the user change it
 * in-place. Persistence flows through `useOnboarding().setAnswer`
 * — the same provider the original onboarding step writes to —
 * so the new value shows up everywhere the app greets the user
 * (home greeting, drawer header, etc.) on the next render.
 *
 * Layout intentionally mirrors `onboarding/name.tsx`:
 *   • Underlined hero input
 *   • Quiet supporting copy
 *   • Save CTA pinned to the bottom safe area
 *
 * Why a bespoke header instead of `SettingsScaffold`? The other
 * settings pages are all read-mostly lists. This one is a single
 * focused form, and we want the CTA visually anchored to the
 * keyboard via KeyboardAvoidingView — which a generic scaffold
 * with a ScrollView gets in the way of.
 */
export default function EditNameScreen() {
  const router = useRouter();
  const colors = useColors();
  const { answers, setAnswer } = useOnboarding();
  const [name, setName] = useState(answers.name);
  const [focused, setFocused] = useState(false);

  // Trim before validating so " " (just spaces) doesn't pass the
  // length check. The persisted value is also the trimmed form
  // so re-opening the screen later doesn't show ghost whitespace.
  const trimmed = useMemo(() => name.trim(), [name]);
  const canSave = trimmed.length >= 2 && trimmed !== answers.name;

  const handleSave = () => {
    if (!canSave) return;
    setAnswer("name", trimmed);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      {/* Inline header so the Save action can live next to Back —
          cleaner than wedging a primary CTA into a footer toolbar. */}
      <View className="flex-row items-center px-4 pt-2 pb-3">
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="w-10 h-10 rounded-full items-center justify-center"
        >
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 6l-6 6 6 6"
              stroke={colors.ink}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
        <Text
          className="text-ink text-[17px] flex-1 text-center"
          style={{ fontFamily: "System", fontWeight: "700" }}
        >
          Your name
        </Text>
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Save"
          className="w-12 h-10 items-end justify-center pr-1"
        >
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              color: canSave ? colors.primary : colors.inkSubtle,
              fontSize: 15,
            }}
          >
            Save
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <View className="flex-1 px-6">
          <View className="mt-8">
            <Text
              className="text-ink text-[28px] leading-[34px] tracking-[-0.6px]"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              What should{"\n"}we call you?
            </Text>
            <Text
              className="text-ink-muted mt-3 text-[14px] leading-[21px]"
              style={{ fontFamily: "System", fontWeight: "400" }}
            >
              Used to greet you each morning and{"\n"}
              personalize your daily reading.
            </Text>
          </View>

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
              onSubmitEditing={handleSave}
              maxLength={40}
              className="text-ink text-[28px] py-2"
              style={{ fontFamily: "System", fontWeight: "600" }}
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

          <Text
            className="text-ink-subtle text-[12.5px] leading-[18px] mt-5"
            style={{ fontFamily: "System", fontWeight: "400" }}
          >
            Lives only on this device. Closer never sends your name anywhere.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
