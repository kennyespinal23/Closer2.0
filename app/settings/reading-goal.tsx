import { Text, View } from "react-native";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import * as haptics from "@/lib/haptics";
import { SFSymbol } from "@/components/Symbol";
import {
  SettingsScaffold,
  SettingsSection,
} from "@/components/SettingsScaffold";
import { useReadingGoal } from "@/state/readingGoal";
import { useColors, useResolvedScheme } from "@/state/theme";

/**
 * Daily reading-goal picker — native UISegmentedControl for the
 * short fixed set (5/10/15/20/30), matching Appearance.
 */
const OPTIONS: ReadonlyArray<{
  minutes: number;
  label: string;
  sublabel: string;
}> = [
  { minutes: 5, label: "5", sublabel: "A short, faithful pause" },
  {
    minutes: 10,
    label: "10",
    sublabel: "Recommended · a rhythm most can keep",
  },
  { minutes: 15, label: "15", sublabel: "A fuller sit-down" },
  { minutes: 20, label: "20", sublabel: "Deeper reading" },
  { minutes: 30, label: "30", sublabel: "A real quiet hour, halved" },
];

export default function ReadingGoalScreen() {
  const { goalMinutes, todayMinutes, reachedToday, setGoalMinutes } =
    useReadingGoal();
  const colors = useColors();
  const scheme = useResolvedScheme();

  const selectedIndex = Math.max(
    0,
    OPTIONS.findIndex((o) => o.minutes === goalMinutes),
  );
  const selected = OPTIONS[selectedIndex] ?? OPTIONS[1];
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
              <SFSymbol name="flame.fill" size={16} color="#FFB672" />
              <Text
                className="text-ink text-[13px] ml-2"
                style={{ fontFamily: "System", fontWeight: "600" }}
              >
                Today&apos;s reading goal reached.
              </Text>
            </View>
          ) : (
            <Text
              className="text-ink-muted text-[13px] mt-3 leading-[18px]"
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
        <View className="px-4 py-4">
          <Text
            className="text-ink-subtle text-[11px] tracking-[1.5px] uppercase mb-3"
            style={{ fontFamily: "System", fontWeight: "600" }}
          >
            Minutes
          </Text>
          <SegmentedControl
            appearance={scheme}
            values={OPTIONS.map((o) => o.label)}
            selectedIndex={selectedIndex}
            onChange={(event) => {
              const next = OPTIONS[event.nativeEvent.selectedSegmentIndex];
              if (next && next.minutes !== goalMinutes) {
                haptics.tick();
                setGoalMinutes(next.minutes);
              }
            }}
            style={{ height: 32 }}
          />
          <Text
            className="text-ink-muted text-[13px] mt-3 leading-[18px]"
            style={{ fontFamily: "System", fontWeight: "500" }}
          >
            {selected.sublabel}
          </Text>
        </View>
      </SettingsSection>
    </SettingsScaffold>
  );
}

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
  return `${rounded} minute${rounded === 1 ? "" : "s"} to go today.`;
}
