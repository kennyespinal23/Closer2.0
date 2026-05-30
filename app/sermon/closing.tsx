import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { SermonHeader } from "@/components/SermonHeader";
import {
  sermonProgressFor,
  sermonStepNumber,
  TODAYS_SERMON,
} from "@/constants/sermon";
import { getTodaysSermonType } from "@/constants/sermonTypes";
import { useProgress } from "@/state/progress";

const PRAYER = [
  "Father, the world is loud, and I am tired of trying to keep up with it.",
  "Today I want to draw nearer to You. Teach me to be still. Teach me to listen.",
  "Slow my heart down enough that I can hear Yours.",
];

/**
 * Every closing prayer ends the same way — first "In Jesus' Name,"
 * as a quiet, italic leading line, then "Amen" as the climactic close.
 * This is fixed across all sermon types, not part of the prayer body.
 */
const CLOSING_LINE = "In Jesus' Name,";

/**
 * Final step — Closing prayer.
 *
 * The progress bar reaches 100% here. The CTA is "Amen" instead of
 * "Continue" — completing it `replace`s the user back into the Today
 * tab, where their journey dot for today will now be filled.
 *
 * Background uses a warm dawn-like glow at the top, symbolizing the
 * sermon ending the way the day began — with light entering.
 */
export default function ClosingStep() {
  const router = useRouter();
  const type = useMemo(() => getTodaysSermonType(), []);
  const { recordCompletion } = useProgress();

  const handleAmen = () => {
    // Record the completion (per-type count increments + today's date
    // stamped) and pass the resulting snapshot along to the celebration
    // screen so it renders the correct ordinal without re-reading
    // context immediately after a state update.
    // Pass full sermon details so the Journey timeline can render
    // a meaningful card for this event without re-fetching anything.
    const {
      typeCount,
      isFirstEver,
      newStreak,
      streakAdvanced,
      crossedMilestone,
    } = recordCompletion(type.id, {
      title: TODAYS_SERMON.title,
      pastor: TODAYS_SERMON.pastor,
    });
    router.replace({
      pathname: "/sermon/complete",
      params: {
        typeCount: String(typeCount),
        isFirstEver: String(isFirstEver),
        // Streak snapshot for the streak update screen + any other
        // copy that wants to reference "Day N" inline.
        streak: String(newStreak),
        // "1" when this completion was the first of the day and the
        // streak actually moved; "0" otherwise. The complete screen
        // uses this to decide whether to chain into /sermon/streak.
        streakAdvanced: streakAdvanced ? "1" : "0",
        // Threshold value when this advance also crossed a milestone
        // (3 / 7 / 14 / …); empty string when not. Surfaced as a
        // badge on the streak screen.
        milestone: crossedMilestone ? String(crossedMilestone) : "",
      },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <SermonHeader
        progress={sermonProgressFor("closing")}
        step={sermonStepNumber("closing")}
      />

      {/* Soft dawn glow anchored top-center, tinted to today's sermon type */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 60,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <DawnGlow color={type.accent} />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-7 py-8">
          <FadeIn delayMs={200} durationMs={1000}>
            <View className="flex-row items-center justify-center mb-8">
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
                A Prayer to Close
              </Text>
              <View
                className="w-6 h-[1.5px] rounded-full ml-3"
                style={{ backgroundColor: type.accent }}
              />
            </View>
          </FadeIn>

          {PRAYER.map((line, i) => (
            <FadeIn key={i} delayMs={700 + i * 700} durationMs={1300}>
              <Text
                className="text-ink text-[22px] leading-[34px] text-center mb-6 tracking-[-0.2px]"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                {line}
              </Text>
            </FadeIn>
          ))}

          {/* Quiet liturgical lead-in to Amen — same beat as a body line
              but italicized and a touch smaller, so the ear hears it as
              part of the prayer's closing breath, not a new sentence. */}
          <FadeIn delayMs={700 + PRAYER.length * 700 + 100} durationMs={1300}>
            <Text
              className="text-ink text-[20px] leading-[30px] text-center mt-1 mb-4 italic opacity-90"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              {CLOSING_LINE}
            </Text>
          </FadeIn>

          <FadeIn delayMs={700 + PRAYER.length * 700 + 900} durationMs={1300}>
            <Text
              className="text-[18px] text-center mt-2 tracking-[6px] uppercase"
              style={{
                fontFamily: "PlusJakartaSans_700Bold",
                color: type.accent,
              }}
            >
              Amen
            </Text>
          </FadeIn>
        </View>
      </ScrollView>

      <FadeIn delayMs={700 + PRAYER.length * 700 + 1800} durationMs={900}>
        <View className="px-6 pb-2">
          <Button label="Amen" onPress={handleAmen} />
          <Text
            className="text-ink-subtle text-[12px] text-center mt-3"
            style={{ fontFamily: "PlusJakartaSans_500Medium" }}
          >
            You showed up today. That counts.
          </Text>
        </View>
      </FadeIn>
    </SafeAreaView>
  );
}

function DawnGlow({ color }: { color: string }) {
  return (
    <Svg width={480} height={360} viewBox="0 0 480 360">
      <Defs>
        <RadialGradient id="dawn" cx="50%" cy="20%" r="80%">
          <Stop offset="0%" stopColor={color} stopOpacity={0.28} />
          <Stop offset="40%" stopColor={color} stopOpacity={0.09} />
          <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Rect width={480} height={360} fill="url(#dawn)" />
    </Svg>
  );
}
