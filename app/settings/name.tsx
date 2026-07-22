import { useCallback, useLayoutEffect, useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRouter } from "expo-router";
import { useOnboarding } from "@/state/onboarding";
import { systemText } from "@/lib/typography";
import { useColors } from "@/state/theme";

/**
 * Edit your display name — body form under the native UINavigationBar
 * (Save lives in headerRight so it matches iOS edit-profile sheets).
 */
export default function EditNameScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const colors = useColors();
  const { answers, setAnswer } = useOnboarding();
  const [name, setName] = useState(answers.name);
  const [focused, setFocused] = useState(false);

  const trimmed = useMemo(() => name.trim(), [name]);
  const canSave = trimmed.length >= 2 && trimmed !== answers.name;

  const handleSave = useCallback(() => {
    if (!(trimmed.length >= 2 && trimmed !== answers.name)) return;
    setAnswer("name", trimmed);
    router.back();
  }, [trimmed, answers.name, setAnswer, router]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Save"
          style={({ pressed }) => ({ opacity: pressed && canSave ? 0.6 : 1 })}
        >
          <Text
            style={[systemText.headline, { color: canSave ? "#007AFF" : colors.inkSubtle }]}
          >
            Save
          </Text>
        </Pressable>
      ),
    });
  }, [navigation, canSave, colors.inkSubtle, handleSave]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["bottom"]}>
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
              placeholderTextColor={colors.inkMuted}
              autoCapitalize="words"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              style={{
                fontFamily: "System",
                fontWeight: "600",
                fontSize: 28,
                lineHeight: 34,
                color: colors.ink,
                paddingVertical: 8,
                borderBottomWidth: 2,
                borderBottomColor: focused ? colors.primary : colors.border,
              }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
