import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { SermonHeader } from "@/components/SermonHeader";
import { sermonProgressFor, sermonStepNumber } from "@/constants/sermon";
import { getTodaysSermonType } from "@/constants/sermonTypes";

const PASSAGE = {
  text:
    "Be still, and know that I am God; I will be exalted among the nations, I will be exalted in the earth.",
  reference: "Psalm 46:10",
};

/**
 * Step 1 — Scripture.
 *
 * Minimalism is the design here. One passage, set large and reverently
 * on the page. A soft ambient glow behind it. We want this screen to
 * feel like opening to a marked verse in a Bible — nothing competing.
 */
export default function ScriptureStep() {
  const router = useRouter();
  const type = useMemo(() => getTodaysSermonType(), []);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <SermonHeader
        progress={sermonProgressFor("scripture")}
        step={sermonStepNumber("scripture")}
      />

      {/* Quiet ambient glow centered behind the passage, tinted to today's
          sermon type so the whole reading experience feels of-a-piece. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 200,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <PassageGlow color={type.accent} />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-7 py-8">
          <FadeIn delayMs={150} durationMs={900}>
            <View className="flex-row items-center mb-6">
              <View
                className="w-6 h-[1.5px] rounded-full mr-3"
                style={{ backgroundColor: type.accent }}
              />
              <Text
                className="text-[10px] tracking-[3px] uppercase"
                style={{
                  fontFamily: "PlusJakartaSans_700Bold",
                  color: type.accent,
                }}
              >
                Today's Scripture
              </Text>
            </View>
          </FadeIn>

          <FadeIn delayMs={600} durationMs={1300}>
            <Text
              className="text-ink text-[28px] leading-[42px] tracking-[-0.3px]"
              style={{ fontFamily: "PlusJakartaSans_500Medium" }}
            >
              &ldquo;{PASSAGE.text}&rdquo;
            </Text>
          </FadeIn>

          <FadeIn delayMs={1500} durationMs={900}>
            <Text
              className="text-ink-muted text-[13px] mt-6 tracking-[3px] uppercase"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              {PASSAGE.reference}
            </Text>
          </FadeIn>
        </View>
      </ScrollView>

      <FadeIn delayMs={2000} durationMs={800}>
        <View className="px-6 pb-2">
          <Button
            label="Continue"
            onPress={() => router.push("/sermon/reflection-1")}
          />
        </View>
      </FadeIn>
    </SafeAreaView>
  );
}

function PassageGlow({ color }: { color: string }) {
  return (
    <Svg width={420} height={420} viewBox="0 0 420 420">
      <Defs>
        <RadialGradient id="passageGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <Stop offset="60%" stopColor={color} stopOpacity={0.05} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={420} height={420} fill="url(#passageGlow)" />
    </Svg>
  );
}
