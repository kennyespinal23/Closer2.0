import { useMemo, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  Text,
  View,
  type PressableProps,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Host, Picker as ExpoUIPicker } from "@expo/ui/swift-ui";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { SFSymbol } from "@/components/Symbol";
import { progressFor } from "@/constants/onboarding";
import { CLOSER_ACCENT } from "@/constants/theme";
import * as haptics from "@/lib/haptics";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { useOnboarding, type Gender } from "@/state/onboarding";
import { useColors, useResolvedScheme } from "@/state/theme";

/**
 * Sex + year of birth — between name and Faith Check In.
 *
 * Year uses the native SwiftUI wheel (`@expo/ui` Picker).
 * Sex pills + arrow CTA use a soft spring press (same feel as
 * PrimaryPillButton).
 */

const SEX_OPTIONS: ReadonlyArray<{ id: Gender; label: string }> = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "other", label: "Other" },
];

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = CURRENT_YEAR - 100;
const MAX_YEAR = CURRENT_YEAR - 13;
const DEFAULT_YEAR = 1995;

/** Arrow CTA height — long stadium ~4–5× wider than tall on phone. */
const ARROW_BTN_HEIGHT = 56;

function buildYears(): number[] {
  const years: number[] = [];
  for (let y = MIN_YEAR; y <= MAX_YEAR; y += 1) years.push(y);
  return years;
}

const YEARS = buildYears();
const YEAR_LABELS = YEARS.map(String);

function usePressScale() {
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (target: number) => {
    if (reducedMotion) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, {
      toValue: target,
      useNativeDriver: true,
      tension: 320,
      friction: 20,
    }).start();
  };

  return {
    scale,
    onPressIn: () => animateTo(0.96),
    onPressOut: () => animateTo(1),
  };
}

function SexPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <View style={{ flex: 1 }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={() => {
            haptics.soft();
            onPress();
          }}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          accessibilityRole="button"
          accessibilityState={{ selected }}
        >
          <View
            style={{
              width: "100%",
              height: 56,
              borderRadius: 999,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 8,
              backgroundColor: selected ? CLOSER_ACCENT : colors.surface,
              borderWidth: selected ? 0 : 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: "System",
                fontWeight: "600",
                fontSize: 17,
                lineHeight: 22,
                color: selected ? "#FFFFFF" : colors.ink,
              }}
            >
              {label}
            </Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function ArrowContinueButton({
  disabled,
  onPress,
}: {
  disabled: boolean;
  onPress: () => void;
}) {
  const { scale, onPressIn, onPressOut } = usePressScale();

  const handlePressIn: PressableProps["onPressIn"] = () => {
    if (disabled) return;
    haptics.soft();
    onPressIn();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={handlePressIn}
        onPressOut={onPressOut}
        accessibilityRole="button"
        accessibilityLabel="Continue"
      >
        <View
          style={{
            width: "100%",
            height: ARROW_BTN_HEIGHT,
            borderRadius: 999,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: CLOSER_ACCENT,
            // Soft floating shadow — matches the reference arrow CTA.
            shadowColor: "#000000",
            shadowOpacity: 0.12,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 6 },
            elevation: 5,
          }}
        >
          <SFSymbol
            name="arrow.right"
            size={20}
            color="#FFFFFF"
            weight="semibold"
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function AboutYouScreen() {
  const router = useRouter();
  const colors = useColors();
  const scheme = useResolvedScheme();
  const { answers, setAnswer } = useOnboarding();

  const defaultYear = useMemo(() => {
    if (
      answers.birthYear &&
      answers.birthYear >= MIN_YEAR &&
      answers.birthYear <= MAX_YEAR
    ) {
      return answers.birthYear;
    }
    if (DEFAULT_YEAR >= MIN_YEAR && DEFAULT_YEAR <= MAX_YEAR) {
      return DEFAULT_YEAR;
    }
    return Math.min(MAX_YEAR, Math.max(MIN_YEAR, 1995));
  }, [answers.birthYear]);

  const [gender, setGender] = useState<Gender | null>(
    answers.gender ?? null,
  );
  const [birthYear, setBirthYear] = useState(defaultYear);

  const selectedYearIndex = Math.max(
    0,
    YEARS.findIndex((y) => y === birthYear),
  );

  const canContinue = gender != null;

  const handleContinue = () => {
    if (!canContinue || !gender) return;
    setAnswer("gender", gender);
    setAnswer("birthYear", birthYear);
    router.push("/onboarding/faith-check-in");
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top", "bottom"]}
    >
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("about-you")}
      />

      <View style={{ flex: 1, paddingHorizontal: 24 }}>
        <FadeIn delayMs={0}>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 34,
              lineHeight: 42,
              letterSpacing: -0.8,
              color: colors.ink,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            Just a few details.
          </Text>
        </FadeIn>

        <FadeIn delayMs={200}>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "400",
              fontSize: 16,
              lineHeight: 23,
              color: colors.inkMuted,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            Tell us your sex and birth year to help us curate the right
            guidance for your journey.
          </Text>
        </FadeIn>

        <View
          style={{
            height: 1,
            backgroundColor: colors.border,
            marginTop: 22,
            marginBottom: 8,
          }}
        />

        <FadeIn delayMs={350}>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 17,
              lineHeight: 22,
              color: colors.ink,
              textAlign: "center",
              marginTop: 20,
              marginBottom: 16,
            }}
          >
            Sex
          </Text>
          <View
            style={{
              flexDirection: "row",
              alignItems: "stretch",
              gap: 10,
              width: "100%",
            }}
          >
            {SEX_OPTIONS.map((option) => (
              <SexPill
                key={option.id}
                label={option.label}
                selected={gender === option.id}
                onPress={() => setGender(option.id)}
              />
            ))}
          </View>
        </FadeIn>

        <FadeIn delayMs={500}>
          <Text
            style={{
              fontFamily: "System",
              fontWeight: "700",
              fontSize: 17,
              lineHeight: 22,
              color: colors.ink,
              textAlign: "center",
              marginTop: 28,
              marginBottom: 8,
            }}
          >
            Year of Birth
          </Text>
          <Host style={{ width: "100%", height: 216 }} colorScheme={scheme}>
            <ExpoUIPicker
              options={YEAR_LABELS}
              selectedIndex={selectedYearIndex}
              variant="wheel"
              onOptionSelected={({ nativeEvent: { index } }) => {
                const year = YEARS[index];
                if (year != null && year !== birthYear) {
                  haptics.soft();
                  setBirthYear(year);
                }
              }}
            />
          </Host>
        </FadeIn>

        <View style={{ flex: 1 }} />

        <View style={{ paddingBottom: 8 }}>
          <ArrowContinueButton
            disabled={!canContinue}
            onPress={handleContinue}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
