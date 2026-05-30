import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { SermonHeader } from "@/components/SermonHeader";
import type { SermonStep } from "@/constants/sermon";
import { sermonProgressFor, sermonStepNumber } from "@/constants/sermon";
import { getTodaysSermonType } from "@/constants/sermonTypes";

type ReflectionLayoutProps = {
  step: SermonStep;
  /** Eyebrow label, e.g. "Reflection · 1 of 2" */
  eyebrow: string;
  /** Big two-digit numeric marker, e.g. "01" */
  numeral: string;
  /** The teaching point title */
  title: string;
  /** Body paragraphs — each becomes its own <Text> with breathing room */
  paragraphs: string[];
  /** Where the Continue button leads */
  onContinue: () => void;
  /** Custom continue label — defaults to "Continue" */
  continueLabel?: string;
};

/**
 * Shared layout for the in-sermon reflection screens.
 *
 * Using a single layout for both reflections (and reusable for future
 * sermons with N reflections) keeps the reading experience consistent —
 * the user develops muscle memory: eyebrow → numeral → title → body →
 * continue. Predictable structure lets the *content* be the surprise.
 */
export function ReflectionLayout({
  step,
  eyebrow,
  numeral,
  title,
  paragraphs,
  onContinue,
  continueLabel = "Continue",
}: ReflectionLayoutProps) {
  const type = useMemo(() => getTodaysSermonType(), []);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <SermonHeader
        progress={sermonProgressFor(step)}
        step={sermonStepNumber(step)}
      />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6 pt-4">
          <FadeIn delayMs={100} durationMs={800}>
            <Text
              className="text-[10px] tracking-[3px] uppercase"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: type.accent,
              }}
            >
              {eyebrow}
            </Text>
          </FadeIn>

          <FadeIn delayMs={400} durationMs={900}>
            <Text
              className="text-[64px] leading-[64px] mt-3 opacity-30"
              style={{
                fontFamily: "PlusJakartaSans_800ExtraBold",
                color: type.accent,
              }}
            >
              {numeral}
            </Text>
          </FadeIn>

          <FadeIn delayMs={700} durationMs={1000}>
            <Text
              className="text-ink text-[28px] leading-[36px] tracking-[-0.4px] mt-3"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              {title}
            </Text>
          </FadeIn>

          <View className="mt-7">
            {paragraphs.map((p, i) => (
              <FadeIn key={i} delayMs={1100 + i * 350} durationMs={1000}>
                <Text
                  className="text-ink text-[17px] leading-[28px] opacity-90 mb-5"
                  style={{ fontFamily: "PlusJakartaSans_400Regular" }}
                >
                  {p}
                </Text>
              </FadeIn>
            ))}
          </View>
        </View>
      </ScrollView>

      <FadeIn delayMs={1100 + paragraphs.length * 350 + 200} durationMs={800}>
        <View className="px-6 pb-2">
          <Button label={continueLabel} onPress={onContinue} />
        </View>
      </FadeIn>
    </SafeAreaView>
  );
}
