import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { useOnboarding } from "@/state/onboarding";
import { useColors } from "@/state/theme";

/**
 * Growth areas — what fruit / virtue is the user trying to
 * cultivate. Last of the three Christian-specific beats before
 * the secular app audit (stat / apps / scrolltime / waketime).
 *
 * Multi-select chip grid in a 2-column layout. The two-column
 * grid is intentional — it visually signals "pick a few, not
 * exactly one" before the user even reads the subtitle, and it
 * lets us fit 10 options on screen without scrolling on most
 * phones.
 *
 * The options are anchored in Galatians 5:22-23 (Fruits of the
 * Spirit) plus a handful of pastoral additions (Healing,
 * Purpose, Wisdom, Discipline) so the picker feels like real
 * Christian formation language instead of corporate wellness
 * buzzwords. We're a Christian product first.
 *
 * Persisted as IDs (not display labels) so a future relabel
 * doesn't break downstream content-matching. Becomes the seed
 * for:
 *   • The home screen's "for you" sermon picks
 *   • Verse-of-the-day topic rotation
 *   • Potential per-user check-in mood suggestions
 *
 * Last screen before /onboarding/stat (the cobalt Hallow-style
 * reveal that hits the user with the 2:27 number).
 */

type GrowthArea = {
  id: string;
  label: string;
};

const OPTIONS: ReadonlyArray<GrowthArea> = [
  { id: "peace", label: "Peace" },
  { id: "patience", label: "Patience" },
  { id: "faith", label: "Faith" },
  { id: "hope", label: "Hope" },
  { id: "joy", label: "Joy" },
  { id: "wisdom", label: "Wisdom" },
  { id: "healing", label: "Healing" },
  { id: "purpose", label: "Purpose" },
  { id: "forgiveness", label: "Forgiveness" },
  { id: "discipline", label: "Discipline" },
];

const MIN_SELECTIONS = 1;
const MAX_SELECTIONS = 5;

export default function GrowthScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();

  const [selected, setSelected] = useState<string[]>(
    answers.growthAreas ?? [],
  );

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTIONS) return prev;
      return [...prev, id];
    });
  };

  const canContinue = selected.length >= MIN_SELECTIONS;

  const handleContinue = () => {
    if (!canContinue) return;
    setAnswer("growthAreas", selected);
    // Last Christian-identity beat → cobalt Hallow-style stat
    // reveal. The "you, who want to grow in peace and patience,
    // spend 2:27 a day on socials" reading is the seed of why
    // we asked these questions first.
    router.push("/onboarding/proof");
  };

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
      <OnboardingChrome mode="back-only" />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6">
          <FadeIn delayMs={0}>
            <Text
              className="text-ink text-[28px] leading-[36px] tracking-[-0.6px] mt-4"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              What do you{"\n"}want to grow in?
            </Text>
          </FadeIn>

          <FadeIn delayMs={500}>
            <Text
              className="text-ink-muted text-[15px] leading-[22px] mt-3"
              style={{ fontFamily: "System", fontWeight: "400" }}
            >
              Pick a few. We&apos;ll keep them in mind.
            </Text>
          </FadeIn>

          <FadeIn delayMs={1000}>
            <View
              className="mt-8 flex-row flex-wrap"
              style={{ gap: 10 }}
            >
              {OPTIONS.map((option) => (
                <GrowthChip
                  key={option.id}
                  label={option.label}
                  selected={selected.includes(option.id)}
                  onPress={() => toggle(option.id)}
                />
              ))}
            </View>
          </FadeIn>
        </View>
      </ScrollView>

      <View className="px-6 pt-3 pb-2 bg-bg">
        <Button
          label="Continue"
          onPress={handleContinue}
          disabled={!canContinue}
        />
      </View>
    </SafeAreaView>
  );
}

/**
 * Two-column chip. Width is calculated to fit two per row with a
 * 10pt gap inside the 24pt horizontal padding (= 48 lateral).
 * Uses 48% width with the gap absorbing the remainder, which
 * keeps the layout robust across screen widths.
 *
 * Selection treatment matches the rest of onboarding's chip
 * vocabulary: iOS-blue border + tinted bg + check icon at the
 * trailing edge.
 */
function GrowthChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: "48%",
        borderRadius: 16,
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderWidth: 2,
        borderColor: selected ? colors.select : colors.border,
        backgroundColor: selected ? colors.selectSoft : colors.surface,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Text
        style={{
          color: colors.ink,
          fontSize: 15,
          fontFamily: "System",
          fontWeight: selected ? "700" : "500",
        }}
      >
        {label}
      </Text>
      {selected ? (
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.select,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 12.5l4.5 4.5L19 7"
              stroke="#FFFFFF"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      ) : null}
    </Pressable>
  );
}
