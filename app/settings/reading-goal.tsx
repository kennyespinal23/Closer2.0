import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  SettingsChoiceRow,
  SettingsScaffold,
  SettingsSection,
} from "@/components/SettingsScaffold";
import { useReadingGoal } from "@/state/readingGoal";
import { useColors } from "@/state/theme";

/**
 * Daily reading-goal picker.
 *
 * The user picks how many minutes of in-reader time counts as "today,
 * I drew near." We curate a tight set of options (5/10/15/20/30) so
 * picking is a one-tap decision and so the choices map naturally to
 * the rhythms a real person can sustain.
 *
 * State + persistence live in state/readingGoal.tsx; this page is
 * pure UI. The reader picks the current `goalMinutes` value up from
 * the same hook and fires a celebration toast the first time the
 * accumulated minutes cross it on a given day.
 */
const OPTIONS: ReadonlyArray<{
  minutes: number;
  label: string;
  sublabel: string;
}> = [
  { minutes: 5, label: "5 minutes", sublabel: "A short, faithful pause" },
  {
    minutes: 10,
    label: "10 minutes",
    sublabel: "Recommended · a rhythm most can keep",
  },
  { minutes: 15, label: "15 minutes", sublabel: "A fuller sit-down" },
  { minutes: 20, label: "20 minutes", sublabel: "Deeper reading" },
  { minutes: 30, label: "30 minutes", sublabel: "A real quiet hour, halved" },
];

export default function ReadingGoalScreen() {
  const { goalMinutes, todayMinutes, reachedToday, setGoalMinutes } =
    useReadingGoal();
  const colors = useColors();

  const todayLabel = formatMinutes(todayMinutes);

  return (
    <SettingsScaffold title="Reading Goal">
      <SettingsSection
        title="Today"
        footer="Your minutes are tracked passively while you read in the chapter view. We'll surface a small celebration the first time you cross your goal each day."
      >
        <View className="px-4 py-4">
          <View className="flex-row items-baseline justify-between">
            <Text
              className="text-ink-subtle text-[11px] tracking-[2px] uppercase"
              style={{ fontFamily: "System", fontWeight: "700" }}
            >
              Progress
            </Text>
            <Text
              className="text-ink-subtle text-[11px]"
              style={{ fontFamily: "System", fontWeight: "500" }}
            >
              {todayLabel} / {goalMinutes} min
            </Text>
          </View>
          <View
            style={{
              height: 6,
              backgroundColor: colors.border,
              borderRadius: 3,
              overflow: "hidden",
              marginTop: 10,
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${Math.min(100, Math.round((todayMinutes / goalMinutes) * 100))}%`,
                backgroundColor: reachedToday ? "#FFB672" : colors.primary,
              }}
            />
          </View>
          {reachedToday ? (
            <View className="flex-row items-center mt-3">
              <FlameIcon />
              <Text
                className="text-ink text-[12.5px] ml-2"
                style={{ fontFamily: "System", fontWeight: "600" }}
              >
                Today&apos;s reading goal reached.
              </Text>
            </View>
          ) : (
            <Text
              className="text-ink-muted text-[12.5px] mt-3 leading-[18px]"
              style={{ fontFamily: "System", fontWeight: "500" }}
            >
              {minutesLeftCopy(goalMinutes - todayMinutes)}
            </Text>
          )}
        </View>
      </SettingsSection>

      <SettingsSection
        title="Daily goal"
        footer="Minutes spent in the chapter reader count toward your goal. Sermons, check-ins, and the rest of the app don't — this is specifically about time with Scripture."
      >
        {OPTIONS.map((opt, i) => (
          <SettingsChoiceRow
            key={opt.minutes}
            icon={<ClockIcon />}
            label={opt.label}
            sublabel={opt.sublabel}
            selected={goalMinutes === opt.minutes}
            onPress={() => setGoalMinutes(opt.minutes)}
            showDivider={i < OPTIONS.length - 1}
          />
        ))}
      </SettingsSection>
    </SettingsScaffold>
  );
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Show today's accumulated minutes as a clean "M:SS" when partial,
 * or just "N min" when the value rounds to a whole minute. Keeps the
 * progress feedback feeling alive rather than padded with decimals.
 */
function formatMinutes(m: number): string {
  if (m <= 0) return "0 min";
  if (m >= 1) {
    const whole = Math.floor(m);
    const seconds = Math.round((m - whole) * 60);
    if (seconds === 0) return `${whole} min`;
    return `${whole}:${String(seconds).padStart(2, "0")}`;
  }
  const seconds = Math.round(m * 60);
  return `0:${String(seconds).padStart(2, "0")}`;
}

function minutesLeftCopy(left: number): string {
  if (left <= 0) return "Today's goal is just ahead.";
  if (left < 1) return "Less than a minute to go today.";
  const rounded = Math.ceil(left);
  return `${rounded} ${rounded === 1 ? "minute" : "minutes"} left for today.`;
}

// ─────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────

const ICON_PROPS_BASE = {
  strokeWidth: 1.7,
  fill: "none",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function ClockIcon() {
  const { ink } = useColors();
  const props = { ...ICON_PROPS_BASE, stroke: ink };
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path d="M12 21a9 9 0 100-18 9 9 0 000 18z" {...props} />
      <Path d="M12 7v5l3 2" {...props} />
    </Svg>
  );
}

function FlameIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path
        d="M12 3c2 3 5 5 5 9a5 5 0 11-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-6 1-8z"
        fill="#FFB672"
        stroke="#FFB672"
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
