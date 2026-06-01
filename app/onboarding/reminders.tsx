import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from "react-native-svg";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { FadeIn } from "@/components/FadeIn";
import { OnboardingHeader } from "@/components/OnboardingHeader";
import { TimePickerModal } from "@/components/TimePickerModal";
import { progressFor } from "@/constants/onboarding";
import { useColors } from "@/state/theme";
import {
  DEFAULT_REMINDER_TIME,
  formatReminderTime,
  requestNotificationPermission,
  scheduleDailyReminder,
  type DailyReminderTime,
} from "@/lib/notifications";
import { useOnboarding } from "@/state/onboarding";

/**
 * Onboarding — "Before The Noise" notification opt-in.
 *
 * This is where the user picks the time their daily ritual fires.
 * The whole product positioning rests on this moment: the notification
 * isn't a reminder, it's the trigger that opens the sermon. So the
 * screen treats "pick a time" as the primary action, not the
 * permission ask itself.
 *
 * Flow:
 *   1. User picks a preset morning time (6:00 → 8:00 AM in 30-min
 *      steps). 7:00 AM is selected by default — landing for most
 *      people before the social-feed pull starts.
 *   2. They tap the primary CTA, labeled with the chosen time.
 *      That triggers the system permission dialog (first time).
 *   3. On grant: we schedule the daily notification + persist the
 *      time + notificationsEnabled=true, then continue to paywall.
 *   4. On denial / "Maybe later": we persist notificationsEnabled=false
 *      so settings can render the right CTA, then continue.
 *
 * Why preset chips instead of a full time wheel?
 *   Speed. Onboarding is the moment a user is least patient with
 *   pickers. A 5-chip row is one tap; a time wheel is several. They
 *   can fine-tune to any minute in /settings/notifications later.
 */
export default function RemindersScreen() {
  const router = useRouter();
  const { setAnswer } = useOnboarding();
  const [time, setTime] = useState<DailyReminderTime>(DEFAULT_REMINDER_TIME);
  const [submitting, setSubmitting] = useState(false);
  // Custom-picker visibility. Open when the user taps the Custom
  // chip; closes on Save (commits the picked time) or Cancel
  // (discards the wheel draft without affecting `time`).
  const [pickerOpen, setPickerOpen] = useState(false);

  // True when the active time isn't one of the curated presets —
  // tells the chip row to highlight the Custom chip instead of
  // any preset, and lets the Custom chip display the picked
  // time as its label.
  const isCustomTime = useMemo(
    () =>
      !TIME_PRESETS.some(
        (p) => p.hour === time.hour && p.minute === time.minute,
      ),
    [time],
  );

  // After reminders we route through the focus step (introduces
  // social-app quieting) on the way to the paywall. The chain is:
  //   reminders → focus → paywall
  // Naming the helper goToNext (rather than goToPaywall) keeps the
  // call sites honest about what they're doing — they don't care
  // what comes next, just that the user finished here.
  const goToNext = () => router.push("/onboarding/focus");

  const handleEnable = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const status = await requestNotificationPermission();
      if (status === "granted") {
        await scheduleDailyReminder(time);
        setAnswer("notificationsEnabled", true);
        setAnswer("dailyReminderTime", time);
      } else {
        // Permission denied (or undetermined on a re-prompt that
        // can't surface the dialog). We still record their chosen
        // time so /settings/notifications can show it pre-populated
        // when they come back to enable manually.
        setAnswer("notificationsEnabled", false);
        setAnswer("dailyReminderTime", time);
      }
    } finally {
      // Always advance — the permission flow is incidental to
      // whether we keep moving through onboarding. The settings
      // screen is the recovery surface if they want to opt in later.
      setSubmitting(false);
      goToNext();
    }
  };

  const handleMaybeLater = () => {
    setAnswer("notificationsEnabled", false);
    setAnswer("dailyReminderTime", time);
    goToNext();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingHeader progress={progressFor("reminders")} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          {/* Moon hero — fades in slowly like the moon "rising" */}
          <FadeIn delayMs={0} durationMs={1500}>
            <View className="items-center mt-6">
              <MoonWithGlow />
            </View>
          </FadeIn>

          <FadeIn delayMs={400}>
            <Text
              className="text-ink text-[28px] leading-[36px] tracking-[-0.5px] text-center mt-8"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Begin before the noise.
            </Text>
          </FadeIn>

          <FadeIn delayMs={1000}>
            <Text
              className="text-ink-muted text-[16px] leading-[24px] text-center mt-4 px-2"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              One quiet moment, every morning. Pick when you&apos;d like
              your word delivered.
            </Text>
          </FadeIn>

          {/* Time picker chips */}
          <FadeIn delayMs={1600}>
            <View className="mt-9">
              <Text
                className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase text-center mb-3"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                Your time
              </Text>
              <View
                className="flex-row flex-wrap justify-center"
                style={{ gap: 8 }}
              >
                {TIME_PRESETS.map((preset) => {
                  // A preset chip is "selected" only when the
                  // active time equals the preset AND the user
                  // didn't pick a custom time. The custom-time
                  // case (where `time` happens to coincide with
                  // a preset is impossible by construction —
                  // any custom-picked time that matches a preset
                  // is treated as picking that preset).
                  const selected =
                    !isCustomTime &&
                    preset.hour === time.hour &&
                    preset.minute === time.minute;
                  return (
                    <TimeChip
                      key={`${preset.hour}-${preset.minute}`}
                      label={formatReminderTime(preset)}
                      selected={selected}
                      onPress={() => setTime(preset)}
                    />
                  );
                })}
                {/* Custom chip — opens the wheel modal. When the
                    user has picked a custom time, the chip
                    displays that time so the picked value is
                    visible in the row (otherwise nothing tells
                    the user "I'm set to 8:47 AM"). When no
                    custom time is set, the chip reads "Custom"
                    with a small clock glyph hint. */}
                <CustomTimeChip
                  selected={isCustomTime}
                  label={
                    isCustomTime ? formatReminderTime(time) : "Custom"
                  }
                  onPress={() => setPickerOpen(true)}
                />
              </View>
            </View>
          </FadeIn>

          <View className="flex-1 min-h-[24px]" />

          <FadeIn delayMs={2000}>
            <View className="pb-2">
              <Button
                label={
                  submitting
                    ? "Setting up\u2026"
                    : `Send my word at ${formatReminderTime(time)}`
                }
                onPress={handleEnable}
              />

              <Pressable
                hitSlop={12}
                onPress={handleMaybeLater}
                disabled={submitting}
                className="self-center mt-5 py-2 px-4"
                style={({ pressed }) => ({
                  opacity: pressed || submitting ? 0.5 : 1,
                })}
              >
                <Text
                  className="text-ink-muted text-[15px]"
                  style={{ fontFamily: "PlusJakartaSans_500Medium" }}
                >
                  Maybe later
                </Text>
              </Pressable>

              <Text
                className="text-ink-subtle text-[11.5px] text-center mt-4 leading-[17px]"
                style={{ fontFamily: "PlusJakartaSans_400Regular" }}
              >
                One notification a day. Never more. Tap it and the
                sermon is already waiting.
              </Text>
            </View>
          </FadeIn>
        </View>
      </ScrollView>

      {/* Custom time picker — slides up from the bottom when the
          user taps the Custom chip. Save commits the picked time
          into local state; the existing CTA picks it up via the
          `time` value and the label automatically refreshes. */}
      <TimePickerModal
        visible={pickerOpen}
        initial={time}
        onConfirm={(next) => {
          setTime(next);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────
// Preset time chips for the onboarding picker
// ─────────────────────────────────────────────────────────────────

/**
 * The curated set of "morning anchor" times the user can pick in
 * onboarding. 30-minute steps from 6:00 → 8:00 AM — the band that
 * lands "before the noise" for most readers without crowding the
 * picker with options that nobody picks.
 *
 * Custom times (any minute, any hour) are available in
 * /settings/notifications for users whose mornings start outside
 * this band.
 */
const TIME_PRESETS: ReadonlyArray<DailyReminderTime> = [
  { hour: 6, minute: 0 },
  { hour: 6, minute: 30 },
  { hour: 7, minute: 0 },
  { hour: 7, minute: 30 },
  { hour: 8, minute: 0 },
];

function TimeChip({
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
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Pick ${label}`}
      accessibilityState={{ selected }}
      className="rounded-full px-4 py-2.5 border"
      style={({ pressed }) => ({
        backgroundColor: selected ? colors.primary : "transparent",
        borderColor: selected ? colors.primary : colors.borderStrong,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <Text
        className="text-[14px] tracking-[-0.1px]"
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: selected ? colors.primaryFg : colors.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Variant of TimeChip that opens the bottom-sheet wheel picker
 * instead of committing a preset.
 *
 * When the user hasn't picked a custom time yet, the chip shows
 * "Custom" with a leading clock glyph so it visually reads as
 * "this opens something" rather than "this is just another
 * preset". Once a custom time IS picked, the chip displays the
 * time itself (e.g. "8:47 AM") and the glyph is replaced with a
 * small pencil glyph to suggest "tap to change".
 */
function CustomTimeChip({
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
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={
        selected ? `Custom time: ${label}. Tap to change.` : "Pick a custom time"
      }
      accessibilityState={{ selected }}
      className="rounded-full pl-3 pr-4 py-2.5 border flex-row items-center"
      style={({ pressed }) => ({
        backgroundColor: selected ? colors.primary : "transparent",
        borderColor: selected ? colors.primary : colors.borderStrong,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {selected ? (
        <PencilGlyph
          stroke={selected ? colors.primaryFg : colors.ink}
        />
      ) : (
        <ClockGlyph
          stroke={selected ? colors.primaryFg : colors.ink}
        />
      )}
      <Text
        className="text-[14px] tracking-[-0.1px] ml-1.5"
        style={{
          fontFamily: "PlusJakartaSans_700Bold",
          color: selected ? colors.primaryFg : colors.ink,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function ClockGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
        stroke={stroke}
        strokeWidth={1.7}
      />
      <Path
        d="M12 7v5l3 2"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PencilGlyph({ stroke }: { stroke: string }) {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 20l4-1 11-11-3-3L5 16zM14 5l3 3"
        stroke={stroke}
        strokeWidth={1.7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// Moon with a soft halo behind it. The crescent itself is a single
// path; the glow is a radial gradient sitting underneath.
// ─────────────────────────────────────────────────────────────────

function MoonWithGlow() {
  const colors = useColors();
  const GLOW_SIZE = 240;
  const MOON_SIZE = 96;

  return (
    <View
      style={{
        width: GLOW_SIZE,
        height: GLOW_SIZE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Soft warm halo */}
      <Svg
        width={GLOW_SIZE}
        height={GLOW_SIZE}
        style={{ position: "absolute" }}
      >
        <Defs>
          <RadialGradient id="moonGlow" cx="50%" cy="50%" rx="50%" ry="50%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.5} />
            <Stop offset="40%" stopColor={colors.accent} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect
          x={0}
          y={0}
          width={GLOW_SIZE}
          height={GLOW_SIZE}
          fill="url(#moonGlow)"
        />
      </Svg>

      {/* Crescent moon — a waxing crescent (open to the right) */}
      <Svg
        width={MOON_SIZE}
        height={MOON_SIZE}
        viewBox="0 0 24 24"
        fill="none"
      >
        <Path
          d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
          fill={colors.accent}
          fillOpacity={0.9}
        />
      </Svg>
    </View>
  );
}
