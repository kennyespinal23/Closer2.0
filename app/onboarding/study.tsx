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
import { DEFAULT_BLOCKED_APP_IDS } from "@/lib/focus";
import {
  type DailyReminderTime,
  formatReminderTime,
  type WeekdayIndex,
} from "@/lib/notifications";
import { useFocus } from "@/state/focus";
import { useOnboarding } from "@/state/onboarding";
import { useStudySessions } from "@/state/studySessions";
import { useColors } from "@/state/theme";

/**
 * Onboarding — Bible study time picker.
 *
 * Sits between /reminders (sermon delivery time) and /focus (focus
 * mode introduction). The narrative arc onboarding has been building
 * lands here:
 *
 *   "Your sermon arrives at X. When do YOU want to sit down with
 *    the Word — your daily reading time — for a few quiet minutes?"
 *
 * Sermon = passive (arrives via notification). Study = active (a
 * commitment the user makes to themselves). The distinction is
 * narrated explicitly in the copy so the user understands why this
 * is a separate question from the previous screen.
 *
 * On Save:
 *   • Persists the picked time to onboarding answers (studyTime)
 *   • Seeds a SYSTEM study session via upsertSystemSession so the
 *     routine shows up in the Practice tab immediately, with a
 *     distinct "Closer" badge to indicate it was set up during
 *     onboarding rather than created manually
 *   • Advances to /onboarding/focus
 *
 * The system routine seeded here:
 *   • Name: "Daily Bible Study" (matched by upsertSystemSession's
 *     dedupe key, so navigating back and re-saving updates instead
 *     of duplicating)
 *   • Days: Monday–Friday (the most common "commitment" shape;
 *     editable later in Practice tab)
 *   • Focus: ON by default — the value of a scheduled commitment is
 *     amplified when phones go quiet for those minutes
 *   • Apps: seeded from the user's existing focus prefs (or the
 *     catalog defaults if none) so they can be tuned per-routine
 *
 * Skip path: "Maybe later" advances without seeding. The Practice
 * tab still has its own "Add a session" affordance, so skipping
 * here doesn't lock the user out of the feature.
 */
export default function StudyOnboardingScreen() {
  const router = useRouter();
  const { answers, setAnswer } = useOnboarding();
  const { upsertSystemSession } = useStudySessions();
  const { prefs: focusPrefs } = useFocus();

  // Seed the picker with the user's previous pick if they navigated
  // back, otherwise the curated default. 8:00 AM is the "settled in
  // with coffee" anchor — distinct enough from the typical sermon
  // wake-up (7:00 AM) that it reads as its own moment.
  const [time, setTime] = useState<DailyReminderTime>(
    answers.studyTime ?? DEFAULT_STUDY_TIME,
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isCustomTime = useMemo(
    () =>
      !ALL_PRESETS.some(
        (p) => p.hour === time.hour && p.minute === time.minute,
      ),
    [time],
  );

  const goToNext = () => router.push("/onboarding/focus");

  const handleSave = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // Persist the picked time on the onboarding record first
      // (cheap, synchronous) so the recovery path has it even if
      // the seed call below races / fails.
      setAnswer("studyTime", time);

      // Seed the system routine. Idempotent — re-entering this
      // screen and saving again updates the existing record
      // instead of creating duplicates.
      const seedApps =
        focusPrefs.blockedAppIds.length > 0
          ? [...focusPrefs.blockedAppIds]
          : [...DEFAULT_BLOCKED_APP_IDS];
      await upsertSystemSession({
        name: SYSTEM_STUDY_NAME,
        source: "system",
        time,
        daysOfWeek: DEFAULT_STUDY_DAYS,
        enabled: true,
        useFocusMode: true,
        blockedAppIds: seedApps,
      });
    } finally {
      setSubmitting(false);
      goToNext();
    }
  };

  const handleMaybeLater = () => {
    // Don't seed a routine, don't write studyTime. The Practice tab
    // and settings remain the discovery paths if the user changes
    // their mind later.
    goToNext();
  };

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top", "bottom"]}>
      <OnboardingHeader progress={progressFor("study")} />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 px-6">
          {/* Sun hero — visually distinct from the reminders moon so
              the two screens don't blur together in the user's
              memory. Sun = "active, sit-down moment"; moon = "the
              ritual that arrives at the edges of the day". */}
          <FadeIn delayMs={0} durationMs={1500}>
            <View className="items-center mt-6">
              <SunWithGlow />
            </View>
          </FadeIn>

          <FadeIn delayMs={400}>
            <Text
              className="text-ink text-[28px] leading-[36px] tracking-[-0.5px] text-center mt-8"
              style={{ fontFamily: "PlusJakartaSans_700Bold" }}
            >
              Your study time.
            </Text>
          </FadeIn>

          <FadeIn delayMs={1000}>
            <Text
              className="text-ink-muted text-[15.5px] leading-[23px] text-center mt-4 px-2"
              style={{ fontFamily: "PlusJakartaSans_400Regular" }}
            >
              The sermon arrives on its own — this is the time YOU pick
              to open the Bible. We&apos;ll add it as a routine you can
              tune anytime.
            </Text>
          </FadeIn>

          <FadeIn delayMs={1600}>
            <View className="mt-9">
              <Text
                className="text-ink-subtle text-[10.5px] tracking-[2.5px] uppercase text-center mb-3"
                style={{ fontFamily: "PlusJakartaSans_700Bold" }}
              >
                I&apos;ll sit down at
              </Text>
              <View
                className="flex-row flex-wrap justify-center"
                style={{ gap: 8 }}
              >
                {ALL_PRESETS.map((preset) => {
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
                <CustomTimeChip
                  selected={isCustomTime}
                  label={
                    isCustomTime ? formatReminderTime(time) : "Custom"
                  }
                  onPress={() => setPickerOpen(true)}
                />
              </View>

              {/* Quiet footer copy explaining the default days +
                  pointing at where to tune. Two short lines so the
                  user doesn't feel a wall of microcopy, just enough
                  to clarify "Mon–Fri" isn't a surprise. */}
              <Text
                className="text-ink-subtle text-[12px] leading-[18px] text-center mt-5 px-6"
                style={{ fontFamily: "PlusJakartaSans_500Medium" }}
              >
                We&apos;ll set this up Mon–Fri. You can change days,
                apps to silence, or remove it from Practice anytime.
              </Text>
            </View>
          </FadeIn>

          <View className="flex-1 min-h-[24px]" />

          <FadeIn delayMs={2000}>
            <View className="pb-2">
              <Button
                label={
                  submitting
                    ? "Saving\u2026"
                    : `Save my study time \u2014 ${formatReminderTime(time)}`
                }
                onPress={handleSave}
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
            </View>
          </FadeIn>
        </View>
      </ScrollView>

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
// Constants
// ─────────────────────────────────────────────────────────────────

/**
 * Canonical name for the onboarding-seeded study routine. Used as
 * the dedupe key in upsertSystemSession AND as the display label on
 * the row, so changing it here is a visible UX change (existing
 * seeded routines won't be matched anymore).
 */
const SYSTEM_STUDY_NAME = "Daily Bible Study";

/** 8:00 AM — distinct from the typical 7:00 AM sermon anchor. */
const DEFAULT_STUDY_TIME: DailyReminderTime = { hour: 8, minute: 0 };

/** Mon–Fri default for the seeded study session. */
const DEFAULT_STUDY_DAYS: WeekdayIndex[] = [1, 2, 3, 4, 5];

/**
 * Preset study times, deliberately broader than the sermon picker
 * because "when do I sit down with the Bible" varies more than
 * "when do I get my morning anchor." Skips lunch hour (12 PM-ish
 * tends to be eat-and-scroll for the target audience) and any time
 * in the 11 PM+ band (we don't want to encourage scripture-as-
 * sleep-aid; the sermon has the late-evening band covered).
 */
const ALL_PRESETS: ReadonlyArray<DailyReminderTime> = [
  { hour: 7, minute: 0 },
  { hour: 8, minute: 0 },
  { hour: 9, minute: 0 },
  { hour: 12, minute: 30 },
  { hour: 17, minute: 30 },
  { hour: 19, minute: 0 },
  { hour: 21, minute: 0 },
];

// ─────────────────────────────────────────────────────────────────
// Chips — visually identical to the reminders screen so the two
// onboarding screens feel like one continuous picker UX
// ─────────────────────────────────────────────────────────────────

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
      className="rounded-full px-4 py-2.5"
      style={({ pressed }) => ({
        // Explicit borderWidth (rather than the NativeWind `border`
        // class) so the selected pill's white fill paints reliably
        // on iOS — see reminders.tsx for the full note.
        borderWidth: 1,
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
      className="rounded-full pl-3 pr-4 py-2.5 flex-row items-center"
      style={({ pressed }) => ({
        borderWidth: 1,
        backgroundColor: selected ? colors.primary : "transparent",
        borderColor: selected ? colors.primary : colors.borderStrong,
        opacity: pressed ? 0.85 : 1,
      })}
    >
      {selected ? (
        <PencilGlyph stroke={selected ? colors.primaryFg : colors.ink} />
      ) : (
        <ClockGlyph stroke={selected ? colors.primaryFg : colors.ink} />
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
// Sun hero — a warm sun with a soft glow, the daytime sibling to
// the moon used on the reminders (sermon) screen
// ─────────────────────────────────────────────────────────────────

function SunWithGlow() {
  const colors = useColors();
  const GLOW_SIZE = 240;
  const SUN_SIZE = 96;
  const RAY_LENGTH = 18;
  const RAY_OFFSET = SUN_SIZE / 2 + 8;

  return (
    <View
      style={{
        width: GLOW_SIZE,
        height: GLOW_SIZE,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Soft warm halo behind the sun — same gradient approach as
          the moon hero so the two screens feel like one visual
          family with different time-of-day metaphors. */}
      <Svg
        width={GLOW_SIZE}
        height={GLOW_SIZE}
        style={{ position: "absolute" }}
      >
        <Defs>
          <RadialGradient id="sunGlow" cx="50%" cy="50%" rx="50%" ry="50%">
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
          fill="url(#sunGlow)"
        />
      </Svg>

      {/* Sun rays — 8 short strokes radiating from a hidden center.
          Drawn as a single path with stroke caps rounded so each
          ray reads as a soft dash rather than a hard line. */}
      <Svg
        width={SUN_SIZE * 2}
        height={SUN_SIZE * 2}
        viewBox={`0 0 ${SUN_SIZE * 2} ${SUN_SIZE * 2}`}
        style={{ position: "absolute" }}
      >
        {RAY_ANGLES.map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const cx = SUN_SIZE;
          const cy = SUN_SIZE;
          const x1 = cx + Math.cos(rad) * RAY_OFFSET;
          const y1 = cy + Math.sin(rad) * RAY_OFFSET;
          const x2 = cx + Math.cos(rad) * (RAY_OFFSET + RAY_LENGTH);
          const y2 = cy + Math.sin(rad) * (RAY_OFFSET + RAY_LENGTH);
          return (
            <Path
              key={deg}
              d={`M ${x1} ${y1} L ${x2} ${y2}`}
              stroke={colors.accent}
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.75}
            />
          );
        })}
      </Svg>

      {/* The sun disc itself — same warm accent fill as the
          crescent on the reminders screen. */}
      <Svg width={SUN_SIZE} height={SUN_SIZE} viewBox="0 0 24 24" fill="none">
        <Path
          d="M12 4a8 8 0 100 16 8 8 0 000-16z"
          fill={colors.accent}
          fillOpacity={0.9}
        />
      </Svg>
    </View>
  );
}

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315] as const;
