import { useMemo } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { SermonHeader } from "@/components/SermonHeader";
import { sermonProgressFor, sermonStepNumber } from "@/constants/sermon";
import { getTodaysSermonType } from "@/constants/sermonTypes";

/**
 * Step 4 — Sit With This.
 *
 * The pivot from teaching to application. The whole screen exists to
 * hold a single question. No body copy compete with it — just the
 * question, an honest invitation underneath, and a generous Continue.
 *
 * The animations here are intentionally the slowest in the entire flow.
 * The user should feel the room slow down.
 */
export default function ApplicationStep() {
  const router = useRouter();
  const type = useMemo(() => getTodaysSermonType(), []);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <SermonHeader
        progress={sermonProgressFor("application")}
        step={sermonStepNumber("application")}
      />

      {/* Single soft glow low on the screen — like a candle on a table.
          Tinted to today's sermon type. */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: 80,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <CandleGlow color={type.accent} />
      </View>

      <View className="flex-1 px-7 justify-center">
        <FadeIn delayMs={200} durationMs={1100}>
          <View className="flex-row items-center mb-8">
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
              Sit With This
            </Text>
          </View>
        </FadeIn>

        <FadeIn delayMs={900} durationMs={1500}>
          <Text
            className="text-ink text-[30px] leading-[42px] tracking-[-0.4px]"
            style={{ fontFamily: "PlusJakartaSans_700Bold" }}
          >
            What is one source of noise you can step away from today
            <Text style={{ color: type.accent }}> — even for ten minutes?</Text>
          </Text>
        </FadeIn>

        <FadeIn delayMs={2200} durationMs={1200}>
          <Text
            className="text-ink-muted text-[16px] leading-[26px] mt-6 opacity-90"
            style={{ fontFamily: "PlusJakartaSans_400Regular" }}
          >
            Not forever. Just today. Just long enough to hear yourself, and to
            give God an opening.
          </Text>
        </FadeIn>
      </View>

      <FadeIn delayMs={3200} durationMs={1000}>
        <View className="px-6 pb-2">
          <Button
            label="Continue"
            onPress={() => router.push("/sermon/closing")}
          />
        </View>
      </FadeIn>
    </SafeAreaView>
  );
}

function CandleGlow({ color }: { color: string }) {
  return (
    <Svg width={320} height={320} viewBox="0 0 320 320">
      <Defs>
        <RadialGradient id="candle" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.22} />
          <Stop offset="55%" stopColor={color} stopOpacity={0.06} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={320} height={320} fill="url(#candle)" />
    </Svg>
  );
}
