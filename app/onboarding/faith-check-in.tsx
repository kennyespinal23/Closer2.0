import { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { progressFor } from "@/constants/onboarding";
import { CLOSER_ACCENT } from "@/constants/theme";
import * as haptics from "@/lib/haptics";
import {
  type FaithCloseness,
  useOnboarding,
} from "@/state/onboarding";
import { useColors } from "@/state/theme";

/**
 * Faith Check In — replaces the old iMessage chat beat.
 *
 * Layout mirrors a calm check-in card (question → hero emoji →
 * feedback → 5-option scale → Continue), themed with CLOSER_ACCENT.
 * Scale reads Far → Very (left to right). Only the selected chip
 * draws a capsule border — matching the reference check-in UI.
 */

type ClosenessOption = {
  id: FaithCloseness;
  emoji: string;
  label: string;
  feedback: string;
  tip: string;
  halo: string;
};

const OPTIONS: ReadonlyArray<ClosenessOption> = [
  {
    id: "far",
    emoji: "😔",
    label: "Far",
    feedback: "Checking in is the first step. We're here with you.",
    tip: "Even in the distance, God's eyes are on you and His arms are open.",
    halo: "rgba(255, 67, 38, 0.10)",
  },
  {
    id: "distant",
    emoji: "😕",
    label: "Distant",
    feedback: "It's okay to feel far sometimes. You're not alone.",
    tip: "Even when you feel far away, God's love knows no distance and hasn't left your side.",
    halo: "rgba(255, 67, 38, 0.10)",
  },
  {
    id: "neutral",
    emoji: "😐",
    label: "Okay",
    feedback: "Right where you are is a good place to start.",
    tip: "God loves meeting us in the ordinary, everyday moments.",
    halo: "rgba(255, 67, 38, 0.10)",
  },
  {
    id: "close",
    emoji: "🙂",
    label: "Close",
    feedback: "It's good to sense that closeness. Hold onto that.",
    tip: "Take a moment to thank God for making His presence felt so clearly today.",
    halo: "rgba(255, 67, 38, 0.12)",
  },
  {
    id: "veryClose",
    emoji: "😍",
    label: "Very",
    feedback: "What a great space to be in. Celebrate that connection.",
    tip: "Rejoice in the peace and warmth of God's presence today.",
    halo: "rgba(255, 67, 38, 0.16)",
  },
];

const CHIP_WIDTH = 64;
const CHIP_HEIGHT = 88;

export default function FaithCheckInScreen() {
  const router = useRouter();
  const colors = useColors();
  const { answers, setAnswer } = useOnboarding();

  const [selected, setSelected] = useState<FaithCloseness | null>(
    answers.faithCloseness ?? "close",
  );

  const firstName =
    (answers.name || "").trim().split(/\s+/)[0] || "friend";

  const active = useMemo(
    () =>
      OPTIONS.find((o) => o.id === selected) ??
      OPTIONS.find((o) => o.id === "close")!,
    [selected],
  );

  const handleSelect = (id: FaithCloseness) => {
    haptics.soft();
    setSelected(id);
  };

  const handleContinue = () => {
    if (!selected) return;
    setAnswer("faithCloseness", selected);
    router.push("/onboarding/social-proof");
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.bg }}
      edges={["top", "bottom"]}
    >
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("faith-check-in")}
        title="Faith Check In"
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
              marginTop: 18,
            }}
          >
            Hi {firstName}, how close have you felt to God lately?
          </Text>
        </FadeIn>

        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 12,
          }}
        >
          <FadeIn delayMs={200} key={`hero-${active.id}`}>
            <View style={{ alignItems: "center", maxWidth: 340 }}>
              <View
                style={{
                  width: 148,
                  height: 148,
                  borderRadius: 74,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: active.halo,
                }}
              >
                <Text style={{ fontSize: 72, lineHeight: 84 }}>
                  {active.emoji}
                </Text>
              </View>

              <Text
                style={{
                  fontFamily: "System",
                  fontWeight: "700",
                  fontSize: 22,
                  lineHeight: 28,
                  letterSpacing: -0.4,
                  color: colors.ink,
                  textAlign: "center",
                  marginTop: 20,
                  paddingHorizontal: 8,
                }}
              >
                {active.feedback}
              </Text>
              <Text
                style={{
                  fontFamily: "System",
                  fontWeight: "400",
                  fontSize: 15,
                  lineHeight: 21,
                  color: colors.inkMuted,
                  textAlign: "center",
                  marginTop: 8,
                  paddingHorizontal: 12,
                }}
              >
                {active.tip}
              </Text>
            </View>
          </FadeIn>
        </View>

        <FadeIn delayMs={350}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              alignSelf: "center",
              gap: 10,
              marginBottom: 22,
            }}
          >
            {OPTIONS.map((option) => {
              const isSelected = option.id === selected;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => handleSelect(option.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`${option.label}: ${option.feedback}`}
                  hitSlop={4}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View
                    style={{
                      width: CHIP_WIDTH,
                      height: CHIP_HEIGHT,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: 22,
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: isSelected ? CLOSER_ACCENT : "transparent",
                      backgroundColor: isSelected
                        ? "rgba(255, 67, 38, 0.06)"
                        : "transparent",
                      paddingVertical: 8,
                    }}
                  >
                    <Text style={{ fontSize: 32, lineHeight: 38 }}>
                      {option.emoji}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "System",
                        fontWeight: "600",
                        fontSize: 12,
                        lineHeight: 16,
                        letterSpacing: 0.1,
                        color: isSelected ? CLOSER_ACCENT : colors.inkMuted,
                        marginTop: 6,
                        textAlign: "center",
                      }}
                    >
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </FadeIn>

        <View style={{ paddingBottom: 8 }}>
          <Button
            label="Continue"
            onPress={handleContinue}
            disabled={!selected}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
