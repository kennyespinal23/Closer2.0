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
 * Screen 2 — Multi-select grid: "Which apps do you open first
 * thing in the morning?"
 *
 * Two reasons this screen matters:
 *
 *   1. Personalization for Screen 6. The names the user picks here
 *      get NAMED back at them on the gut-punch screen ("You're
 *      opening Instagram & TikTok 730 times before God this year").
 *      Without inputs the punch is generic; with inputs it's a
 *      mirror.
 *
 *   2. Implicit confession. Picking the apps is a small "yeah, I
 *      know" moment. By the time the user finishes this screen
 *      they've already conceded the premise.
 *
 * UX: pill-row grid. Multi-select. Order matches the rough
 * frequency of "which app does America wake up to" (Pew-ish).
 * "Other" is a catch-all that doesn't surface as a named app on
 * the punch screen but still counts toward the morning-apps tally.
 */

type AppOption = {
  id: string;
  label: string;
  /** Display name used when listing the apps back on Screen 6 ("Instagram & TikTok"). */
  punchName: string | null;
};

const APP_OPTIONS: ReadonlyArray<AppOption> = [
  { id: "instagram", label: "Instagram", punchName: "Instagram" },
  { id: "tiktok", label: "TikTok", punchName: "TikTok" },
  { id: "x", label: "Twitter / X", punchName: "X" },
  { id: "youtube", label: "YouTube", punchName: "YouTube" },
  { id: "facebook", label: "Facebook", punchName: "Facebook" },
  { id: "news", label: "News apps", punchName: "the news" },
  // "Other" doesn't get named back to the user — we don't want
  // to invent a label they didn't pick. It still counts toward
  // the morning-apps tally so the punch math stays honest.
  { id: "other", label: "Other", punchName: null },
];

export default function AppsScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();

  const [selected, setSelected] = useState<string[]>(
    answers.morningApps ?? [],
  );

  const canContinue = selected.length > 0;

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleContinue = () => {
    if (!canContinue) return;
    setAnswer("morningApps", selected);
    router.push("/onboarding/scrolltime");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingChrome mode="back-only" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          <FadeIn delayMs={0}>
            <Text
              className="text-ink text-[26px] leading-[34px] tracking-[-0.4px] mt-4"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Which apps do you open{"\n"}first thing in the morning?
            </Text>
          </FadeIn>

          <FadeIn delayMs={500}>
            <Text
              className="text-ink-muted text-[15px] leading-[22px] mt-3"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              Pick all that apply.
            </Text>
          </FadeIn>

          <FadeIn delayMs={900}>
            <View className="mt-8 flex-row flex-wrap" style={{ gap: 10 }}>
              {APP_OPTIONS.map((opt) => (
                <AppPill
                  key={opt.id}
                  label={opt.label}
                  selected={selected.includes(opt.id)}
                  onPress={() => toggle(opt.id)}
                />
              ))}
            </View>
          </FadeIn>

          <View className="flex-1 min-h-[16px]" />

          <View className="pt-6 pb-2">
            <Button
              label="Continue"
              onPress={handleContinue}
              disabled={!canContinue}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Multi-select pill. Same visual idiom as the time chips on the
 * old reminders screen (filled when active, outlined when not),
 * with a small check glyph added so the multi-select metaphor
 * reads at a glance — these aren't radio buttons.
 */
function AppPill({
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
    // NativeWind classes (rather than inline border styles) here:
    // an earlier attempt with style={() => ({borderWidth, borderColor})}
    // was correctly bundled by metro but appeared to be ignored by
    // RN 0.81's Pressable layer on iOS, producing pills with no
    // visible chrome (just floating labels). Matching the existing
    // OptionCard pattern — which renders correctly elsewhere in the
    // app — uses NativeWind's `border-2` / `border-primary` /
    // `bg-accent-soft` token classes and works reliably.
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      className={[
        "rounded-full px-4 py-2.5 flex-row items-center active:opacity-80 border-2",
        selected
          ? "bg-primary border-primary"
          : "border-border-strong bg-accent-soft",
      ].join(" ")}
    >
      {selected ? (
        <View style={{ marginRight: 8 }}>
          <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 12.5l4.5 4.5L19 7"
              stroke={colors.primaryFg}
              strokeWidth={2.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      ) : null}
      <Text
        className={selected ? "text-primary-fg" : "text-ink"}
        style={{
          fontFamily: "PlusJakartaSans_600SemiBold",
          fontSize: 15,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

