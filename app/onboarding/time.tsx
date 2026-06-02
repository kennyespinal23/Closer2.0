import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingChrome } from "@/components/OnboardingChrome";
import { progressFor } from "@/constants/onboarding";
import { useOnboarding, type WakeBucket } from "@/state/onboarding";
import {
  scheduleDailyReminder,
  type DailyReminderTime,
} from "@/lib/notifications";

/**
 * Screen 14 — "What time does your morning start, [Name]?"
 *
 * The time picker, simplified to a 2x2 grid of four curated
 * options. The new flow trades the old custom-time wheel for
 * speed — onboarding momentum matters more than minute-perfect
 * personalization, and the user can always refine the time on
 * /settings/notifications later.
 *
 * Each option carries a small subtitle ("Early riser", "Most
 * people", etc.) so the user is choosing an identity, not a
 * timestamp. The subtitle nudges the choice to feel right —
 * "Most people" lowers the friction on the default pick.
 *
 * Default selection: lifted from the wake-time bucket the user
 * picked on Screen 4. If they said "6:00 – 7:00am" we pre-pick
 * 7:00; if they said "before 6am" we pre-pick 6:00; and so on.
 *
 * Scheduling: if the user accepted notifications on Screen 13,
 * we schedule the daily reminder here as soon as they confirm
 * their time. If they declined, we still persist the time so
 * the settings screen knows what to pre-fill if they enable
 * notifications later.
 */

type TimeOption = {
  key: string;
  time: DailyReminderTime;
  label: string;
  meta: string;
};

const TIME_OPTIONS: ReadonlyArray<TimeOption> = [
  { key: "6", time: { hour: 6, minute: 0 }, label: "6:00am", meta: "Early riser" },
  { key: "7", time: { hour: 7, minute: 0 }, label: "7:00am", meta: "Most people" },
  { key: "8", time: { hour: 8, minute: 0 }, label: "8:00am", meta: "Take your time" },
  { key: "9", time: { hour: 9, minute: 0 }, label: "9:00am", meta: "Night owl" },
];

const BUCKET_DEFAULT_KEY: Record<WakeBucket, string> = {
  before6: "6",
  six7: "7",
  seven8: "8",
  eight9: "9",
  after9: "9",
};

export default function TimeScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();

  const firstName = (answers.name || "").trim().split(" ")[0];

  // Pre-pick based on wake bucket, falling back to "7" (the
  // pre-selected default in the spec — "Most people").
  const defaultKey = useMemo(() => {
    if (answers.dailyReminderTime) {
      // If the user has already passed through and come back, honor
      // their previous pick.
      const existing = TIME_OPTIONS.find(
        (o) =>
          o.time.hour === answers.dailyReminderTime?.hour &&
          o.time.minute === answers.dailyReminderTime?.minute,
      );
      if (existing) return existing.key;
    }
    return answers.wakeBucket ? BUCKET_DEFAULT_KEY[answers.wakeBucket] : "7";
  }, [answers.wakeBucket, answers.dailyReminderTime]);

  const [selectedKey, setSelectedKey] = useState<string>(defaultKey);
  const [submitting, setSubmitting] = useState(false);

  const selectedOption =
    TIME_OPTIONS.find((o) => o.key === selectedKey) ?? TIME_OPTIONS[1];

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      setAnswer("dailyReminderTime", selectedOption.time);
      // Only actually schedule the OS-level notification if the
      // user accepted permission on Screen 13. Silently no-op
      // otherwise — settings.notifications has the recovery path.
      if (answers.notificationsEnabled) {
        await scheduleDailyReminder(selectedOption.time);
      }
    } catch {
      // Scheduling errors are non-fatal during onboarding — we'd
      // rather advance than block the user; settings can retry.
    } finally {
      setSubmitting(false);
      router.push("/onboarding/paywall");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingChrome
        mode="with-progress"
        progress={progressFor("time")}
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
              What time does your morning start
              {firstName ? `, ${firstName}?` : "?"}
            </Text>
          </FadeIn>

          <FadeIn delayMs={500}>
            <Text
              className="text-ink-muted text-[15px] leading-[22px] mt-3"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              We&apos;ll be there waiting{"\n"}before you reach for your phone.
            </Text>
          </FadeIn>

          {/* 2x2 grid — two explicit rows of two cards each.
              Originally implemented as flex-wrap with 48.5%-wide
              children, which on this RN/iOS pairing intermittently
              dropped one card from the visible layout (the parent's
              measured width briefly fell a few px short of 2×card +
              gap, so the second card wrapped to its own row AND the
              previous flex-wrap state cached a zero-height frame
              that hid one cell). Switching to a deterministic two-
              row layout with `flex: 1` cells guarantees all four
              cards render and the columns are exactly equal width
              regardless of measured parent width. */}
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
              label={submitting ? "Setting up…" : "This is my time"}
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
 * Single time card. Two-line content — large time on top, dimmer
 * label below. Selected state inverts the colors (filled chip)
 * the same way the OptionCard does for radio rows. Border-width
 * is pinned in the inline style so the iOS render is consistent
 * (see notes on TimeChip in the old reminders screen).
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
    // NativeWind classes for the chrome (border + bg) — the original
    // inline `style={() => ({borderWidth, borderColor, backgroundColor})}`
    // approach bundled correctly but rendered chromeless on iOS in
    // RN 0.81 (the Pressable layer appeared to ignore the function-
    // returned style for border / bg props specifically). Switching
    // to className tokens (the same pattern OptionCard uses) paints
    // reliably. `flex: 1` stays inline because there's no Tailwind
    // shorthand for it in the codebase config.
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
