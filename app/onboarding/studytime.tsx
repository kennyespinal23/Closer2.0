import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { progressFor } from "@/constants/onboarding";
import { useOnboarding } from "@/state/onboarding";
import type { DailyReminderTime } from "@/lib/notifications";

/**
 * Screen 15 — "And when will you spend time in the Word?"
 *
 * The second of two consecutive time pickers. The previous
 * screen ("time") set the SERMON delivery time — the daily nudge
 * with a short word. This screen sets the BIBLE STUDY time — the
 * longer block the user commits to actually opening scripture
 * and sitting with it.
 *
 * Why two separate questions?
 *   A sermon notification is short and passive ("a thought for
 *   today"). A study session is longer and active ("I'm going to
 *   read a chapter and reflect"). Treating them as the same
 *   moment collapses two different rhythms. By picking each
 *   independently, the user gets:
 *     • a sermon at the time their morning lets them listen, and
 *     • a study commitment at the time they can actually focus.
 *
 *   For many users those will overlap (both in the morning) and
 *   that's fine — the routines just sit on top of each other in
 *   the Practice tab. For others the sermon is morning and the
 *   study is evening (or lunch), and the two-screen flow gives
 *   them an easy way to express that.
 *
 * Options:
 *   Four curated picks spanning the day so the user can find one
 *   that matches their reality:
 *     • 6:00 AM — "Before sunrise"   (predawn, monastic vibe)
 *     • 7:00 AM — "With your coffee"  (the default — most common)
 *     • 12:30 PM — "Lunch break"     (midday anchor)
 *     • 9:00 PM — "Wind down"        (evening rhythm)
 *
 *   The "Most people" copy is reserved for the default option so
 *   the social-proof nudge keeps doing its job here too — same
 *   pattern as the sermon-time screen.
 *
 * Default selection:
 *   Prefer the user's prior choice if they've passed through
 *   before; otherwise pre-pick 7:00 AM ("With your coffee"). We
 *   intentionally don't reuse the sermon time as the default —
 *   the two are independent decisions and presetting them equal
 *   would invisibly tie them together.
 *
 * Seeding:
 *   This screen only PERSISTS the choice to onboarding answers.
 *   The actual `upsertSystemSession` happens on welcome.tsx,
 *   which reads both `dailyReminderTime` and `bibleStudyTime`
 *   and seeds two system routines in one place. That keeps the
 *   "where do system routines get created?" answer to a single
 *   file (welcome.tsx) and makes the seeding idempotent across
 *   onboarding re-entries (since both upserts key on name).
 */

type TimeOption = {
  key: string;
  time: DailyReminderTime;
  label: string;
  meta: string;
};

const TIME_OPTIONS: ReadonlyArray<TimeOption> = [
  { key: "6", time: { hour: 6, minute: 0 }, label: "6:00am", meta: "Before sunrise" },
  { key: "7", time: { hour: 7, minute: 0 }, label: "7:00am", meta: "With your coffee" },
  { key: "12", time: { hour: 12, minute: 30 }, label: "12:30pm", meta: "Lunch break" },
  { key: "21", time: { hour: 21, minute: 0 }, label: "9:00pm", meta: "Wind down" },
];

const DEFAULT_KEY = "7";

export default function StudyTimeScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();

  const firstName = (answers.name || "").trim().split(" ")[0];

  // Honor a returning user's prior pick, otherwise default to
  // 7:00 AM. We don't fall back to the sermon time here — they're
  // two independent decisions per the rationale in the header.
  const initialKey = useMemo(() => {
    if (answers.bibleStudyTime) {
      const existing = TIME_OPTIONS.find(
        (o) =>
          o.time.hour === answers.bibleStudyTime?.hour &&
          o.time.minute === answers.bibleStudyTime?.minute,
      );
      if (existing) return existing.key;
    }
    return DEFAULT_KEY;
  }, [answers.bibleStudyTime]);

  const [selectedKey, setSelectedKey] = useState<string>(initialKey);
  const [submitting, setSubmitting] = useState(false);

  const selectedOption =
    TIME_OPTIONS.find((o) => o.key === selectedKey) ?? TIME_OPTIONS[1];

  const handleConfirm = () => {
    if (submitting) return;
    setSubmitting(true);
    // Persist only — actual study-session seeding happens on
    // welcome.tsx so all system routines are created together
    // and the seed point is a single source of truth.
    setAnswer("bibleStudyTime", selectedOption.time);
    setSubmitting(false);
    router.push("/onboarding/paywall");
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("studytime")}
      />

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
              And when will you sit with the Word
              {firstName ? `, ${firstName}?` : "?"}
            </Text>
          </FadeIn>

          <FadeIn delayMs={500}>
            <Text
              className="text-ink-muted text-[15px] leading-[22px] mt-3"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              A protected block on your calendar for prayer
              and scripture. We&apos;ll silence distractions
              when it&apos;s time.
            </Text>
          </FadeIn>

          {/* Same deterministic two-row layout as the sermon-time
              screen. See time.tsx for the historical reason —
              flex-wrap intermittently dropped a card on the iOS
              renderer, two explicit rows fix it. */}
          <FadeIn delayMs={1000}>
            <View className="mt-10" style={{ gap: 12 }}>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TimeCard
                  label={TIME_OPTIONS[0].label}
                  meta={TIME_OPTIONS[0].meta}
                  selected={selectedKey === TIME_OPTIONS[0].key}
                  onPress={() => setSelectedKey(TIME_OPTIONS[0].key)}
                />
                <TimeCard
                  label={TIME_OPTIONS[1].label}
                  meta={TIME_OPTIONS[1].meta}
                  selected={selectedKey === TIME_OPTIONS[1].key}
                  onPress={() => setSelectedKey(TIME_OPTIONS[1].key)}
                />
              </View>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TimeCard
                  label={TIME_OPTIONS[2].label}
                  meta={TIME_OPTIONS[2].meta}
                  selected={selectedKey === TIME_OPTIONS[2].key}
                  onPress={() => setSelectedKey(TIME_OPTIONS[2].key)}
                />
                <TimeCard
                  label={TIME_OPTIONS[3].label}
                  meta={TIME_OPTIONS[3].meta}
                  selected={selectedKey === TIME_OPTIONS[3].key}
                  onPress={() => setSelectedKey(TIME_OPTIONS[3].key)}
                />
              </View>
            </View>
          </FadeIn>

          <View className="flex-1 min-h-[16px]" />

          <View className="pt-6 pb-2">
            <Button
              label={submitting ? "Setting up…" : "Lock it in"}
              onPress={handleConfirm}
              disabled={submitting}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/**
 * Single time card — same visual language as the sermon-time
 * picker. Selected state inverts the colors (filled chip)
 * the same way the OptionCard does for radio rows. NativeWind
 * classes for the chrome (border + bg); inline flex:1 for the
 * one Tailwind shorthand we don't have in scope.
 */
function TimeCard({
  label,
  meta,
  selected,
  onPress,
}: {
  label: string;
  meta: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${meta}`}
      accessibilityState={{ selected }}
      style={{ flex: 1 }}
      className={[
        "rounded-2xl py-5 px-3 items-center border-2 active:opacity-80",
        selected
          ? "bg-primary border-primary"
          : "bg-accent-soft border-border-strong",
      ].join(" ")}
    >
      <Text
        className={selected ? "text-primary-fg" : "text-ink"}
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          fontSize: 22,
          letterSpacing: -0.3,
        }}
      >
        {label}
      </Text>
      <Text
        className={selected ? "text-primary-fg" : "text-ink-muted"}
        style={{
          fontFamily: "PlusJakartaSans_500Medium",
          fontSize: 12,
          marginTop: 4,
          opacity: selected ? 0.85 : 1,
        }}
      >
        {meta}
      </Text>
    </Pressable>
  );
}
